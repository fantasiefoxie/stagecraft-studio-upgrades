import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Zap,
  X,
  Download,
  Music,
  Film,
  AlertCircle,
  CheckCircle2,
  Square,
  ShieldCheck,
  Sparkles,
  Layers,
  FileCode2,
} from 'lucide-react';
import { AspectMode, EpisodeScript } from './types';
import { VoiceClipEntry } from './audioEngine';
import {
  ChapterRenderArtifact,
  ChapteredRenderResult,
  FastRenderProgress,
  FastRenderResult,
  RenderBitrateMode,
  renderEpisodeByChapters,
  renderEpisodeFastOffline,
  supportsWebCodecsFastRender,
} from './offlineRenderer';
import {
  applyFullYppAutoShield,
  auditEpisodeYppCompliance,
  recordEpisodeExportInLedger,
} from './monetizationShield';
import {
  buildFfmpegChapterConcatBundle,
  formatLongDuration,
  partitionEpisodeIntoChapters,
} from './longFormEngine';
import { generateSrtCaptions } from './growthTools';

interface FastRenderModalProps {
  open: boolean;
  onClose: () => void;
  episode: EpisodeScript;
  aspect: AspectMode;
  showCaptions: boolean;
  expressionsEnabled: boolean;
  voiceClips: Map<string, VoiceClipEntry>;
  musicStemBuffer: AudioBuffer | null;
  musicLevel: number;
  autoDuck: boolean;
  onFallbackRealtime: () => void;
  onApplyEpisode?: (next: EpisodeScript, message?: string) => void;
  onOpenYppShield?: () => void;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const RESUMABLE_RENDER_KEY = 'katha_resumable_render_session_v1';

interface ResumableRenderSession {
  sessionId: string;
  episodeId: string;
  aspect: AspectMode;
  fps: 30 | 60;
  bitrateMode: RenderBitrateMode;
  chapterCount: number;
  uploadedIndices: number[];
  updatedAt: number;
}

function loadResumableSession(): ResumableRenderSession | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(RESUMABLE_RENDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ResumableRenderSession;
    if (!parsed || typeof parsed.sessionId !== 'string' || !Array.isArray(parsed.uploadedIndices)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveResumableSession(sess: ResumableRenderSession | null): void {
  try {
    if (typeof sessionStorage === 'undefined') return;
    if (!sess) sessionStorage.removeItem(RESUMABLE_RENDER_KEY);
    else sessionStorage.setItem(RESUMABLE_RENDER_KEY, JSON.stringify(sess));
  } catch {
    // ignore storage errors
  }
}

export const FastRenderModal: React.FC<FastRenderModalProps> = ({
  open,
  onClose,
  episode,
  aspect,
  showCaptions,
  expressionsEnabled,
  voiceClips,
  musicStemBuffer,
  musicLevel,
  autoDuck,
  onFallbackRealtime,
  onApplyEpisode,
  onOpenYppShield,
}) => {
  const totalDurationSec = useMemo(
    () => episode.beats.reduce((sum, b) => sum + Math.max(0.5, b.duration || 4), 0),
    [episode.beats]
  );
  const chapters = useMemo(
    () => partitionEpisodeIntoChapters(episode, 200),
    [episode]
  );
  const isLongFormEpisode = totalDurationSec > 210 && chapters.length > 1;

  const [fps, setFps] = useState<30 | 60>(30);
  const [bitrateMode, setBitrateMode] = useState<RenderBitrateMode>(() =>
    totalDurationSec > 210 ? 'longform_cinema' : 'standard'
  );
  const [renderMode, setRenderMode] = useState<'single' | 'chaptered'>(() =>
    isLongFormEpisode ? 'chaptered' : 'single'
  );
  const [outputFormat, setOutputFormat] = useState<'mp4' | 'webm'>('mp4');
  const [normalizeLufs, setNormalizeLufs] = useState<boolean>(true);
  const [spatialAudio, setSpatialAudio] = useState<boolean>(
    episode.visualStyle?.spatialAudio !== false
  );
  const [autoStitchChaptersMp4, setAutoStitchChaptersMp4] = useState<boolean>(true);
  const [ffmpegReady, setFfmpegReady] = useState<boolean>(false);
  const [rendering, setRendering] = useState(false);
  const [convertingMp4, setConvertingMp4] = useState(false);
  const [stitchingMasterMp4, setStitchingMasterMp4] = useState(false);
  const [stitchedMasterMp4, setStitchedMasterMp4] = useState<Blob | null>(null);
  const [convertingChapterIdx, setConvertingChapterIdx] = useState<number | null>(null);
  const [progress, setProgress] = useState<FastRenderProgress | null>(null);
  const [result, setResult] = useState<FastRenderResult | null>(null);
  const [chapteredResult, setChapteredResult] = useState<ChapteredRenderResult | null>(null);
  const [liveChaptersDone, setLiveChaptersDone] = useState<ChapterRenderArtifact[]>([]);
  const [chapterMp4Map, setChapterMp4Map] = useState<Record<number, Blob>>({});
  const [mp4BlobResult, setMp4BlobResult] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shieldNotice, setShieldNotice] = useState<string | null>(null);
  const [resumableSession, setResumableSession] = useState<ResumableRenderSession | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const activeStitchSessionRef = useRef<string | null>(null);

  const supported = supportsWebCodecsFastRender();
  const safeSlug = (episode.id || 'episode')
    .replace(/[^A-Za-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 48);
  const safeBaseName = `${safeSlug || 'episode'}_${aspect === '9:16' ? '9x16' : '16x9'}`;
  const yppReport = useMemo(
    () => auditEpisodeYppCompliance(episode, { voiceClipCount: voiceClips.size }),
    [episode, voiceClips.size]
  );

  // Auto-select Chaptered Long-Form mode + Cinema 5 Mbps when opening a >3.5 min episode
  useEffect(() => {
    if (!open) return;
    if (isLongFormEpisode) {
      setRenderMode('chaptered');
      setFps(30);
      setBitrateMode('longform_cinema');
    } else {
      setRenderMode('single');
    }
  }, [open, isLongFormEpisode]);

  useEffect(() => {
    if (!open) {
      abortRef.current?.abort();
      abortRef.current = null;
      setRendering(false);
      setConvertingMp4(false);
      setStitchingMasterMp4(false);
      setConvertingChapterIdx(null);
      return;
    }
    fetch('/api/llm/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const ok = Boolean(d && d.ffmpeg);
        setFfmpegReady(ok);
        if (!ok) setOutputFormat('webm');
      })
      .catch(() => {
        setFfmpegReady(false);
        setOutputFormat('webm');
      });

    // Check if an interrupted chaptered render session for this episode is still alive on the server
    const saved = loadResumableSession();
    if (
      saved &&
      saved.episodeId === episode.id &&
      saved.aspect === aspect &&
      saved.chapterCount === chapters.length &&
      saved.uploadedIndices.length > 0
    ) {
      fetch(`/api/render-session/${saved.sessionId}/status`)
        .then((r) => (r.ok ? r.json() : null))
        .then((status) => {
          if (status && Array.isArray(status.uploadedIndices) && status.uploadedIndices.length > 0 && !status.finalizing) {
            const refreshed: ResumableRenderSession = {
              ...saved,
              uploadedIndices: status.uploadedIndices as number[],
              updatedAt: Date.now(),
            };
            saveResumableSession(refreshed);
            setResumableSession(refreshed);
          } else {
            saveResumableSession(null);
            setResumableSession(null);
          }
        })
        .catch(() => {
          setResumableSession(null);
        });
    } else {
      setResumableSession(null);
    }
  }, [open, episode.id, aspect, chapters.length]);

  if (!open) return null;

  const transcodeWebmToMp4 = async (
    webmBlob: Blob,
    filenameBase: string,
    signal?: AbortSignal
  ): Promise<Blob> => {
    if (webmBlob.size > 150 * 1024 * 1024) {
      throw new Error(
        'Rendered WebM exceeds 150 MB server limit. Use Chaptered Long-Form mode (keeps each chapter <150 MB) or CLI render-batch.mjs.'
      );
    }
    const res = await fetch(`/api/convert-mp4?filename=${encodeURIComponent(filenameBase)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'video/webm' },
      body: webmBlob,
      signal,
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ error: 'MP4 conversion failed.' }));
      throw new Error(errJson.error || `Server returned ${res.status}`);
    }
    return res.blob();
  };

  const uploadSingleChapterToSession = async (
    sessionId: string,
    chapterIndex: number,
    blob: Blob,
    signal?: AbortSignal
  ): Promise<void> => {
    const upRes = await fetch(`/api/render-session/${sessionId}/chapter?index=${chapterIndex}`, {
      method: 'POST',
      headers: { 'Content-Type': 'video/webm' },
      body: blob,
      signal,
    });
    if (!upRes.ok) {
      const errJson = (await upRes.json().catch(() => ({}))) as { error?: string };
      throw new Error(errJson.error || `Chapter ${chapterIndex + 1} upload failed (${upRes.status})`);
    }
  };

  const finalizeRenderSessionOnServer = async (
    sessionId: string,
    chapterCount: number,
    signal?: AbortSignal
  ): Promise<Blob> => {
    setProgress((prev) => ({
      phase: 'muxing',
      frame: prev?.frame ?? 0,
      totalFrames: prev?.totalFrames ?? 0,
      elapsedSec: prev?.elapsedSec ?? 0,
      speedMultiplier: prev?.speedMultiplier ?? 0,
      percent: 96,
      message: `FFmpeg stitching all ${chapterCount} chapters into 1 unified Broadcast .MP4 (-14 LUFS)...`,
    }));
    const finRes = await fetch(
      `/api/render-session/${sessionId}/finalize?filename=${encodeURIComponent(safeBaseName)}`,
      { method: 'POST', signal }
    );
    if (!finRes.ok) {
      const errJson = (await finRes.json().catch(() => ({}))) as { error?: string };
      throw new Error(errJson.error || `Chapter stitch failed (${finRes.status})`);
    }
    activeStitchSessionRef.current = null;
    saveResumableSession(null);
    setResumableSession(null);
    return finRes.blob();
  };

  const handleDiscardResumableSession = async () => {
    const sid = resumableSession?.sessionId || activeStitchSessionRef.current;
    saveResumableSession(null);
    setResumableSession(null);
    activeStitchSessionRef.current = null;
    if (sid) {
      await fetch(`/api/render-session/${sid}`, { method: 'DELETE' }).catch(() => {});
    }
  };

  const stitchChaptersOnServer = async (
    artifacts: ChapterRenderArtifact[],
    signal?: AbortSignal
  ): Promise<Blob> => {
    const startRes = await fetch('/api/render-session/start', {
      method: 'POST',
      signal,
    });
    if (!startRes.ok) {
      const errJson = (await startRes.json().catch(() => ({}))) as { error?: string };
      throw new Error(errJson.error || `Could not start stitch session (${startRes.status})`);
    }
    const { sessionId } = (await startRes.json()) as { sessionId: string };
    activeStitchSessionRef.current = sessionId;

    try {
      for (let i = 0; i < artifacts.length; i++) {
        const ch = artifacts[i];
        if (!ch.webmBlob) continue;
        setProgress((prev) => ({
          phase: 'muxing',
          frame: prev?.frame ?? 0,
          totalFrames: prev?.totalFrames ?? 0,
          elapsedSec: prev?.elapsedSec ?? 0,
          speedMultiplier: prev?.speedMultiplier ?? 0,
          percent: Math.min(95, Math.round(90 + (i / artifacts.length) * 5)),
          message: `Uploading Chapter ${i + 1}/${artifacts.length} (${(ch.sizeBytes / (1024 * 1024)).toFixed(1)} MB) for Server FFmpeg Stitch...`,
        }));
        await uploadSingleChapterToSession(sessionId, i, ch.webmBlob, signal);
      }

      return await finalizeRenderSessionOnServer(sessionId, artifacts.length, signal);
    } catch (err) {
      if (activeStitchSessionRef.current === sessionId) {
        activeStitchSessionRef.current = null;
        void fetch(`/api/render-session/${sessionId}`, { method: 'DELETE' }).catch(() => {});
      }
      throw err;
    }
  };

  const startFastRender = async (resumeFrom?: ResumableRenderSession | null) => {
    setError(null);
    setResult(null);
    setChapteredResult(null);
    setLiveChaptersDone([]);
    setChapterMp4Map({});
    setStitchedMasterMp4(null);
    setMp4BlobResult(null);
    setRendering(true);
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      if (renderMode === 'chaptered' && chapters.length > 1) {
        const useStreamingServerStitch = autoStitchChaptersMp4 && ffmpegReady;
        let streamSessionId: string | null = null;
        const uploadedSet = new Set<number>(resumeFrom?.uploadedIndices || []);

        if (useStreamingServerStitch) {
          if (resumeFrom) {
            streamSessionId = resumeFrom.sessionId;
            activeStitchSessionRef.current = streamSessionId;
          } else {
            const startRes = await fetch('/api/render-session/start', {
              method: 'POST',
              signal: ac.signal,
            });
            if (!startRes.ok) {
              const errJson = (await startRes.json().catch(() => ({}))) as { error?: string };
              throw new Error(errJson.error || `Could not start stitch session (${startRes.status})`);
            }
            const data = (await startRes.json()) as { sessionId: string };
            streamSessionId = data.sessionId;
            activeStitchSessionRef.current = streamSessionId;
            const freshSess: ResumableRenderSession = {
              sessionId: streamSessionId,
              episodeId: episode.id,
              aspect,
              fps,
              bitrateMode,
              chapterCount: chapters.length,
              uploadedIndices: [],
              updatedAt: Date.now(),
            };
            saveResumableSession(freshSess);
            setResumableSession(freshSess);
          }
        }

        const chRes = await renderEpisodeByChapters(chapters, {
          baseName: safeBaseName,
          aspect,
          fps: resumeFrom?.fps ?? fps,
          bitrateMode: resumeFrom?.bitrateMode ?? bitrateMode,
          showCaptions,
          expressionsEnabled,
          voiceClips,
          musicStemBuffer,
          musicLevel,
          autoDuck,
          normalizeLufs,
          spatialAudio,
          signal: ac.signal,
          skipChapterIndices: uploadedSet.size > 0 ? uploadedSet : undefined,
          releaseBlobAfterCallback: useStreamingServerStitch,
          onChapterProgress: (cp) => {
            const scaledPct = useStreamingServerStitch
              ? Math.min(92, Math.round(cp.overallPercent * 0.92))
              : cp.overallPercent;
            setProgress({
              ...cp.chapterProgress,
              percent: scaledPct,
              message: `Chapter ${cp.chapterIndex + 1}/${cp.chapterCount} (${cp.chapterTitle}) · ${cp.chapterProgress.message}`,
            });
          },
          onChapterDone: async (artifact) => {
            if (useStreamingServerStitch && streamSessionId && artifact.webmBlob) {
              setProgress((prev) => ({
                phase: 'muxing',
                frame: prev?.frame ?? 0,
                totalFrames: prev?.totalFrames ?? 0,
                elapsedSec: prev?.elapsedSec ?? 0,
                speedMultiplier: prev?.speedMultiplier ?? 0,
                percent: Math.min(
                  94,
                  Math.round(((artifact.chapterIndex + 1) / chapters.length) * 92)
                ),
                message: `Streaming Chapter ${artifact.chapterNumber}/${chapters.length} (${(
                  artifact.sizeBytes /
                  (1024 * 1024)
                ).toFixed(1)} MB) to Server & freeing browser RAM...`,
              }));
              await uploadSingleChapterToSession(
                streamSessionId,
                artifact.chapterIndex,
                artifact.webmBlob,
                ac.signal
              );
              uploadedSet.add(artifact.chapterIndex);
              const nextSess: ResumableRenderSession = {
                sessionId: streamSessionId,
                episodeId: episode.id,
                aspect,
                fps: resumeFrom?.fps ?? fps,
                bitrateMode: resumeFrom?.bitrateMode ?? bitrateMode,
                chapterCount: chapters.length,
                uploadedIndices: Array.from(uploadedSet).sort((a, b) => a - b),
                updatedAt: Date.now(),
              };
              saveResumableSession(nextSess);
              setResumableSession(nextSess);
            }
            setLiveChaptersDone((prev) => [
              ...prev,
              useStreamingServerStitch
                ? { ...artifact, webmBlob: null, uploadedToServer: true }
                : artifact,
            ]);
          },
        });
        setChapteredResult(chRes);
        recordEpisodeExportInLedger(episode);

        if (useStreamingServerStitch && streamSessionId) {
          setStitchingMasterMp4(true);
          try {
            const masterMp4 = await finalizeRenderSessionOnServer(
              streamSessionId,
              chapters.length,
              ac.signal
            );
            setStitchedMasterMp4(masterMp4);
            triggerDownload(masterMp4, `${safeBaseName}_full_youtube.mp4`);
            setProgress({
              phase: 'done',
              frame: 0,
              totalFrames: 0,
              percent: 100,
              elapsedSec: chRes.totalElapsedSec,
              speedMultiplier: Number(
                (chRes.totalDurationSec / Math.max(0.1, chRes.totalElapsedSec)).toFixed(1)
              ),
              message: `Unified ${formatLongDuration(chRes.totalDurationSec)} Broadcast .MP4 (-14 LUFS) streamed, stitched & downloaded!`,
            });
          } catch (stitchErr) {
            if (stitchErr instanceof DOMException && stitchErr.name === 'AbortError') {
              setError('Server stitch cancelled. Uploaded chapters remain resumable on the server.');
            } else {
              setError(
                `Server stitch failed (${stitchErr instanceof Error ? stitchErr.message : 'server error'}). Retry or turn off Auto-Stitch to download local chapters.`
              );
            }
          } finally {
            setStitchingMasterMp4(false);
          }
          return;
        }

        setProgress({
          phase: 'done',
          frame: 0,
          totalFrames: 0,
          percent: 100,
          elapsedSec: chRes.totalElapsedSec,
          speedMultiplier: Number((chRes.totalDurationSec / Math.max(0.1, chRes.totalElapsedSec)).toFixed(1)),
          message: `All ${chRes.chapters.length} chapters rendered cleanly (${formatLongDuration(chRes.totalDurationSec)} total)!`,
        });
        return;
      }

      const res = await renderEpisodeFastOffline({
        episode,
        aspect,
        fps,
        bitrateMode,
        skipWav: totalDurationSec > 240,
        showCaptions,
        expressionsEnabled,
        voiceClips,
        musicStemBuffer,
        musicLevel,
        autoDuck,
        normalizeLufs,
        spatialAudio,
        signal: ac.signal,
        onProgress: (p) => setProgress(p),
      });
      setResult(res);
      recordEpisodeExportInLedger(episode);

      // Seamless 1-click auto-handoff to server Broadcast H.264 MP4 (-14 LUFS) when selected & FFmpeg is ready
      if (outputFormat === 'mp4' && ffmpegReady) {
        setConvertingMp4(true);
        setProgress((prev) => ({
          phase: 'muxing',
          percent: 96,
          frame: prev?.frame ?? 0,
          totalFrames: prev?.totalFrames ?? 0,
          elapsedSec: prev?.elapsedSec ?? res.elapsedSec,
          speedMultiplier: res.speedMultiplier,
          message: 'Mastering YouTube Broadcast H.264 MP4 (-14 LUFS loudness)...',
        }));
        try {
          const mp4Blob = await transcodeWebmToMp4(res.webmBlob, safeBaseName, ac.signal);
          setMp4BlobResult(mp4Blob);
          setProgress((prev) =>
            prev
              ? { ...prev, phase: 'done', percent: 100, message: 'Broadcast H.264 MP4 (-14 LUFS) ready!' }
              : null
          );
          triggerDownload(mp4Blob, `${safeBaseName}_youtube.mp4`);
        } catch (mp4Err) {
          if (mp4Err instanceof DOMException && mp4Err.name === 'AbortError') {
            setError('MP4 transcode cancelled. Your rendered .WebM master is still ready below.');
          } else {
            setError(
              `Auto-MP4 handoff unavailable (${mp4Err instanceof Error ? mp4Err.message : 'server error'}). Your .WebM master is ready to download below.`
            );
          }
        } finally {
          setConvertingMp4(false);
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Offline render cancelled.');
      } else {
        setError(err instanceof Error ? err.message : 'Offline render failed.');
      }
    } finally {
      setRendering(false);
      abortRef.current = null;
    }
  };

  const handleConvertResultToMp4 = async () => {
    if (!result) return;
    if (mp4BlobResult) {
      triggerDownload(mp4BlobResult, `${safeBaseName}_youtube.mp4`);
      return;
    }
    setConvertingMp4(true);
    setError(null);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const mp4Blob = await transcodeWebmToMp4(result.webmBlob, safeBaseName, ac.signal);
      setMp4BlobResult(mp4Blob);
      triggerDownload(mp4Blob, `${safeBaseName}_youtube.mp4`);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError(err instanceof Error ? err.message : 'MP4 conversion failed.');
      }
    } finally {
      setConvertingMp4(false);
      abortRef.current = null;
    }
  };

  const handleManualStitchAllChapters = async () => {
    if (!chapteredResult) return;
    if (stitchedMasterMp4) {
      triggerDownload(stitchedMasterMp4, `${safeBaseName}_full_youtube.mp4`);
      return;
    }
    setStitchingMasterMp4(true);
    setError(null);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const allStreamed = chapteredResult.chapters.every((c) => !c.webmBlob && c.uploadedToServer);
      const masterMp4 =
        allStreamed && resumableSession
          ? await finalizeRenderSessionOnServer(
              resumableSession.sessionId,
              chapteredResult.chapters.length,
              ac.signal
            )
          : await stitchChaptersOnServer(chapteredResult.chapters, ac.signal);
      setStitchedMasterMp4(masterMp4);
      triggerDownload(masterMp4, `${safeBaseName}_full_youtube.mp4`);
      setProgress((prev) =>
        prev
          ? {
              ...prev,
              phase: 'done',
              percent: 100,
              message: `Unified ${formatLongDuration(chapteredResult.totalDurationSec)} Master .MP4 (-14 LUFS) ready!`,
            }
          : null
      );
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError(err instanceof Error ? err.message : 'Server chapter stitching failed.');
      }
    } finally {
      setStitchingMasterMp4(false);
      abortRef.current = null;
    }
  };

  const handleConvertChapterToMp4 = async (artifact: ChapterRenderArtifact) => {
    const existing = chapterMp4Map[artifact.chapterIndex];
    if (existing) {
      triggerDownload(existing, `${artifact.filenameBase}.mp4`);
      return;
    }
    if (!artifact.webmBlob) return;
    setConvertingChapterIdx(artifact.chapterIndex);
    setError(null);
    try {
      const mp4Blob = await transcodeWebmToMp4(artifact.webmBlob, artifact.filenameBase);
      setChapterMp4Map((prev) => ({ ...prev, [artifact.chapterIndex]: mp4Blob }));
      triggerDownload(mp4Blob, `${artifact.filenameBase}.mp4`);
    } catch (err) {
      setError(
        `Chapter ${artifact.chapterNumber} MP4 error: ${err instanceof Error ? err.message : 'conversion failed'}`
      );
    } finally {
      setConvertingChapterIdx(null);
    }
  };

  const handleDownloadStitchKit = (useMp4Names: boolean) => {
    if (!chapteredResult) return;
    const ext = useMp4Names ? '.mp4' : '.webm';
    const filenames = chapteredResult.chapters.map((c) => `${c.filenameBase}${ext}`);
    const bundle = buildFfmpegChapterConcatBundle({
      baseName: safeBaseName,
      chapterFilenames: filenames,
      chapters,
      isMp4Inputs: useMp4Names,
    });
    triggerDownload(
      new Blob([bundle.chaptersListTxt], { type: 'text/plain;charset=utf-8' }),
      'chapters.txt'
    );
    window.setTimeout(() => {
      triggerDownload(
        new Blob([bundle.shellScriptSh], { type: 'text/x-shellscript;charset=utf-8' }),
        `stitch_${safeBaseName}.sh`
      );
    }, 250);
    window.setTimeout(() => {
      triggerDownload(
        new Blob([bundle.youtubeChaptersTxt], { type: 'text/plain;charset=utf-8' }),
        `${safeBaseName}_youtube_chapters.txt`
      );
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border border-amber-400/25 bg-[#0d1221] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Fast Offline Studio Render</h2>
              <p className="text-[11px] text-slate-400">
                Deterministic WebCodecs + OfflineAudioContext + Direct Broadcast MP4
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              abortRef.current?.abort();
              onClose();
            }}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!supported ? (
          <div className="space-y-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
            <div className="flex items-start gap-2 text-xs text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                Your current browser does not expose WebCodecs <code>VideoEncoder</code>. Use
                Chrome or Edge for faster-than-realtime offline rendering, or use standard Real-Time
                WebM recording below.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onFallbackRealtime();
              }}
              className="w-full rounded-lg bg-amber-400 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-300"
            >
              Use Real-Time .WebM Recorder Instead
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* Frame Rate & Bitrate Presets */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={rendering}
                onClick={() => {
                  setFps(30);
                  setBitrateMode('longform_cinema');
                }}
                className={`rounded-xl border p-2.5 text-left transition ${
                  fps === 30 && bitrateMode === 'longform_cinema'
                    ? 'border-amber-400 bg-amber-400/10 text-amber-100'
                    : 'border-white/10 bg-[#13192c] text-slate-300 hover:border-white/20'
                }`}
              >
                <div className="text-[11px] font-bold">30 fps · Long-Form</div>
                <div className="mt-0.5 text-[10px] text-slate-400">
                  5 Mbps · ~50% smaller
                </div>
              </button>
              <button
                type="button"
                disabled={rendering}
                onClick={() => {
                  setFps(30);
                  setBitrateMode('standard');
                }}
                className={`rounded-xl border p-2.5 text-left transition ${
                  fps === 30 && bitrateMode === 'standard'
                    ? 'border-amber-400 bg-amber-400/10 text-amber-100'
                    : 'border-white/10 bg-[#13192c] text-slate-300 hover:border-white/20'
                }`}
              >
                <div className="text-[11px] font-bold">30 fps · Studio</div>
                <div className="mt-0.5 text-[10px] text-slate-400">
                  8 Mbps · Crisp standard
                </div>
              </button>
              <button
                type="button"
                disabled={rendering}
                onClick={() => {
                  setFps(60);
                  setBitrateMode('standard');
                }}
                className={`rounded-xl border p-2.5 text-left transition ${
                  fps === 60
                    ? 'border-amber-400 bg-amber-400/10 text-amber-100'
                    : 'border-white/10 bg-[#13192c] text-slate-300 hover:border-white/20'
                }`}
              >
                <div className="text-[11px] font-bold">60 fps · Broadcast</div>
                <div className="mt-0.5 text-[10px] text-slate-400">
                  11 Mbps · Ultra-smooth
                </div>
              </button>
            </div>

            {/* Single-File vs. Chaptered Long-Form Engine (shown whenever episode has 2+ chapters) */}
            {chapters.length > 1 && (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={rendering}
                  onClick={() => setRenderMode('chaptered')}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    renderMode === 'chaptered'
                      ? 'border-amber-400 bg-amber-400/10 text-amber-100'
                      : 'border-white/10 bg-[#13192c] text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 text-xs font-bold">
                    <span className="inline-flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-amber-300" />
                      Chaptered ({chapters.length} parts)
                    </span>
                    {isLongFormEpisode && (
                      <span className="text-[9px] font-mono text-emerald-300">RECOMMENDED</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    RAM-safe · Every part &lt;150 MB + FFmpeg stitch script
                  </div>
                </button>
                <button
                  type="button"
                  disabled={rendering}
                  onClick={() => setRenderMode('single')}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    renderMode === 'single'
                      ? 'border-amber-400 bg-amber-400/10 text-amber-100'
                      : 'border-white/10 bg-[#13192c] text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-bold">Single Master File</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    Best for Shorts &amp; episodes under 4 minutes
                  </div>
                </button>
              </div>
            )}

            {/* 1-Click Server-Side Chapter Auto-Stitch Toggle (when Chaptered + Server FFmpeg ready) */}
            {renderMode === 'chaptered' && chapters.length > 1 && ffmpegReady && (
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-500/8 p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={rendering}
                    checked={autoStitchChaptersMp4}
                    onChange={(e) => setAutoStitchChaptersMp4(e.target.checked)}
                    className="mt-0.5 accent-emerald-400"
                  />
                  <div className="text-[11px]">
                    <div className="font-bold text-emerald-200">
                      Zero-RAM Streaming Auto-Stitch &rarr; 1 Unified YouTube .MP4 (-14 LUFS)
                    </div>
                    <div className="text-[10px] text-slate-300">
                      Streams each finished chapter straight to Server FFmpeg &amp; frees browser memory immediately, then downloads one seamless {formatLongDuration(totalDurationSec)} H.264/AAC master.
                    </div>
                  </div>
                </label>

                {resumableSession && !rendering && (
                  <div className="rounded-xl border border-amber-400/35 bg-amber-500/10 p-2.5 text-[11px] flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-amber-200">
                        Resumable Server Session Found ({resumableSession.uploadedIndices.length}/{chapters.length} chapters already uploaded)
                      </div>
                      <div className="text-[10px] text-slate-300">
                        Skip already-uploaded chapters and continue from where the previous export stopped.
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void startFastRender(resumableSession)}
                        className="rounded-md bg-amber-400 px-2.5 py-1 text-[10px] font-bold text-slate-950 hover:bg-amber-300 cursor-pointer"
                      >
                        Resume Remaining ({chapters.length - resumableSession.uploadedIndices.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDiscardResumableSession()}
                        className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-semibold text-slate-300 hover:bg-white/10 cursor-pointer"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Direct Output Format Selector (for Single File mode) */}
            {renderMode === 'single' && (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={rendering || !ffmpegReady}
                  onClick={() => setOutputFormat('mp4')}
                  className={`rounded-xl border p-2.5 text-left transition disabled:opacity-45 ${
                    outputFormat === 'mp4' && ffmpegReady
                      ? 'border-emerald-400 bg-emerald-400/10 text-emerald-100'
                      : 'border-white/10 bg-[#13192c] text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 text-xs font-bold">
                    <span>Direct YouTube .MP4</span>
                    <span className="text-[10px] font-mono text-emerald-300">
                      {ffmpegReady ? '-14 LUFS' : 'No FFmpeg'}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    1-click H.264/AAC broadcast master
                  </div>
                </button>
                <button
                  type="button"
                  disabled={rendering}
                  onClick={() => setOutputFormat('webm')}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    outputFormat === 'webm' || !ffmpegReady
                      ? 'border-amber-400 bg-amber-400/10 text-amber-100'
                      : 'border-white/10 bg-[#13192c] text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-bold">Instant .WebM Only</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    Zero-copy browser VP9 + Opus
                  </div>
                </button>
              </div>
            )}

            <div className="rounded-lg border border-white/10 bg-[#080c17] px-3 py-2 text-[11px] text-slate-300 space-y-1">
              <div className="flex justify-between gap-2">
                <span>Episode:</span>
                <span className="font-semibold text-white truncate">{episode.title}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Runtime &amp; Structure:</span>
                <span className="font-mono-tabular text-white">
                  {formatLongDuration(totalDurationSec)} · {episode.beats.length} scenes
                  {chapters.length > 1 ? ` · ${chapters.length} chapters` : ''}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Audio Mix:</span>
                <span className="text-amber-300">
                  {voiceClips.size} voice clip{voiceClips.size === 1 ? '' : 's'} +{' '}
                  {musicStemBuffer ? 'Acoustic Stem' : 'Regional Synth'} + Ambience + SFX
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-1.5 mt-1 border-t border-white/8 text-[10px] text-slate-300">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={rendering}
                    checked={normalizeLufs}
                    onChange={(e) => setNormalizeLufs(e.target.checked)}
                    className="accent-emerald-400"
                  />
                  <span>EBU R128 -14 LUFS / -1.5 dBTP Normalize</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={rendering}
                    checked={spatialAudio}
                    onChange={(e) => setSpatialAudio(e.target.checked)}
                    className="accent-amber-400"
                  />
                  <span>Stereo Spatial Audio &amp; Stage Acoustics</span>
                </label>
              </div>
            </div>

            {/* YouTube YPP Monetization Pre-Flight Gate */}
            <div
              className={`rounded-xl border p-3 text-[11px] ${
                yppReport.status === 'monetization_ready'
                  ? 'border-emerald-400/25 bg-emerald-500/8'
                  : yppReport.status === 'review_recommended'
                    ? 'border-amber-400/30 bg-amber-500/8'
                    : 'border-rose-400/35 bg-rose-500/10'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <ShieldCheck
                    className={`h-4 w-4 ${
                      yppReport.status === 'monetization_ready'
                        ? 'text-emerald-300'
                        : yppReport.status === 'review_recommended'
                          ? 'text-amber-300'
                          : 'text-rose-300'
                    }`}
                  />
                  <span>YPP Monetization Pre-Flight</span>
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                    yppReport.status === 'monetization_ready'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : yppReport.status === 'review_recommended'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/25 text-rose-200'
                  }`}
                >
                  {yppReport.score}/100 ·{' '}
                  {yppReport.status === 'monetization_ready'
                    ? 'AdSense Ready'
                    : yppReport.status === 'review_recommended'
                      ? 'Review Advised'
                      : 'High Risk'}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-slate-300 leading-relaxed">
                {yppReport.issues[0]?.title
                  ? `${yppReport.issues[0].title} — ${yppReport.issues[0].detail}`
                  : yppReport.summaryLine}
              </p>
              {shieldNotice && (
                <div className="mt-1.5 text-[10px] font-medium text-emerald-300">
                  {shieldNotice}
                </div>
              )}
              {(yppReport.status !== 'monetization_ready' || onOpenYppShield) && (
                <div className="mt-2 flex items-center gap-2">
                  {onApplyEpisode && yppReport.status !== 'monetization_ready' && (
                    <button
                      type="button"
                      disabled={rendering}
                      onClick={() => {
                        const res = applyFullYppAutoShield(episode);
                        if (res.changed) {
                          onApplyEpisode(res.episode, `YPP Auto-Shield: ${res.summary.join(' · ')}`);
                          setShieldNotice(res.summary.join(' · '));
                        } else {
                          setShieldNotice(res.summary[0]);
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-400 px-2.5 py-1 text-[10px] font-bold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>1-Click Auto-Shield</span>
                    </button>
                  )}
                  {onOpenYppShield && (
                    <button
                      type="button"
                      disabled={rendering}
                      onClick={() => {
                        onClose();
                        onOpenYppShield();
                      }}
                      className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-slate-200 transition hover:bg-white/10"
                    >
                      Open Full YPP Audit
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {(rendering || convertingMp4 || stitchingMasterMp4 || progress) && (
              <div className="space-y-1.5 rounded-xl border border-white/10 bg-[#12182b] p-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-200">
                    {progress?.message || 'Initializing offline encoder...'}
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    {progress?.percent ?? 0}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-150"
                    style={{ width: `${progress?.percent ?? 0}%` }}
                  />
                </div>
                {progress && progress.elapsedSec > 0.2 && (
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Elapsed: {progress.elapsedSec.toFixed(1)}s</span>
                    {progress.speedMultiplier > 0 && (
                      <span className="text-emerald-300">
                        Speed: {progress.speedMultiplier.toFixed(1)}× realtime
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons & Results */}
            {(!result && !chapteredResult) || rendering ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  {rendering ? (
                    <button
                      type="button"
                      onClick={() => abortRef.current?.abort()}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 py-2.5 text-xs font-bold text-rose-200 transition hover:bg-rose-500/25 cursor-pointer"
                    >
                      <Square className="h-3.5 w-3.5 fill-current" />
                      Cancel Render
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void startFastRender()}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-400 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-amber-300 cursor-pointer"
                    >
                      <Zap className="h-4 w-4" />
                      {renderMode === 'chaptered' && chapters.length > 1
                        ? autoStitchChaptersMp4 && ffmpegReady
                          ? `Render & Auto-Stitch ${chapters.length} Chapters -> 1 Master .MP4 (${formatLongDuration(totalDurationSec)})`
                          : `Render All ${chapters.length} Chapters (${formatLongDuration(totalDurationSec)})`
                        : outputFormat === 'mp4' && ffmpegReady
                          ? 'Render & Export Broadcast .MP4 (-14 LUFS)'
                          : 'Start Fast Offline .WebM Render'}
                    </button>
                  )}
                </div>

                {/* Live completed chapters while rendering long-form */}
                {rendering && liveChaptersDone.length > 0 && (
                  <div className="rounded-lg border border-white/10 bg-[#0b1020] p-2.5 text-[10px] text-slate-300 space-y-1">
                    <div className="font-semibold text-emerald-300">
                      Completed {liveChaptersDone.length} / {chapters.length} chapters:
                    </div>
                    {liveChaptersDone.map((ch) => (
                      <div key={ch.chapterIndex} className="flex justify-between font-mono-tabular">
                        <span className="truncate">
                          Ch {ch.chapterNumber}: {ch.title}
                        </span>
                        <span className="text-slate-400">
                          {(ch.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : chapteredResult ? (
              <div className="space-y-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3.5">
                <div className="flex items-center justify-between gap-2 text-xs font-bold text-emerald-200">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {chapteredResult.chapters.length} Chapters Ready ({formatLongDuration(chapteredResult.totalDurationSec)})
                  </span>
                  <span className="font-mono-tabular text-[11px] text-emerald-300">
                    {(chapteredResult.totalSizeBytes / (1024 * 1024)).toFixed(1)} MB total
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {chapteredResult.chapters.map((ch) => {
                    const hasMp4 = Boolean(chapterMp4Map[ch.chapterIndex]);
                    const isBusy = convertingChapterIdx === ch.chapterIndex;
                    return (
                      <div
                        key={ch.chapterIndex}
                        className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#0b1020] px-2.5 py-2 text-[11px]"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">
                            Ch {String(ch.chapterNumber).padStart(2, '0')} · {ch.title}
                          </div>
                          <div className="font-mono-tabular text-[10px] text-slate-400">
                            {formatLongDuration(ch.durationSec)} · {(ch.sizeBytes / (1024 * 1024)).toFixed(1)} MB · {ch.videoCodec}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {ch.webmBlob ? (
                            <>
                              <button
                                type="button"
                                onClick={() => triggerDownload(ch.webmBlob!, `${ch.filenameBase}.webm`)}
                                className="rounded-md bg-amber-400 px-2 py-1 text-[10px] font-bold text-slate-950 hover:bg-amber-300 cursor-pointer"
                              >
                                .WebM
                              </button>
                              {ffmpegReady && (
                                <button
                                  type="button"
                                  disabled={isBusy || convertingChapterIdx !== null}
                                  onClick={() => void handleConvertChapterToMp4(ch)}
                                  className={`rounded-md px-2 py-1 text-[10px] font-bold cursor-pointer disabled:opacity-45 ${
                                    hasMp4
                                      ? 'bg-emerald-400 text-slate-950'
                                      : 'border border-emerald-400/40 bg-[#131c32] text-emerald-200 hover:bg-[#1c2947]'
                                  }`}
                                >
                                  {isBusy ? 'MP4...' : hasMp4 ? '.MP4 Ready' : '.MP4'}
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-200">
                              Streamed to Master
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 1-Click Server FFmpeg Master Stitch Button */}
                {ffmpegReady && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={stitchingMasterMp4}
                      onClick={() => void handleManualStitchAllChapters()}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-bold transition disabled:opacity-50 cursor-pointer ${
                        stitchedMasterMp4
                          ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
                          : 'bg-emerald-500/20 border border-emerald-400/45 text-emerald-200 hover:bg-emerald-500/30'
                      }`}
                    >
                      <Film className="h-4 w-4" />
                      <span>
                        {stitchingMasterMp4
                          ? 'Stitching All Chapters on Server FFmpeg (-14 LUFS)...'
                          : stitchedMasterMp4
                            ? `Download Unified Master .MP4 (${(stitchedMasterMp4.size / (1024 * 1024)).toFixed(1)} MB)`
                            : `1-Click Stitch All ${chapteredResult.chapters.length} Chapters -> 1 Unified .MP4 (-14 LUFS)`}
                      </span>
                    </button>
                    {stitchingMasterMp4 && (
                      <button
                        type="button"
                        onClick={() => abortRef.current?.abort()}
                        className="rounded-lg border border-rose-500/40 bg-rose-500/15 px-3 py-2.5 text-xs font-bold text-rose-200 hover:bg-rose-500/25 cursor-pointer shrink-0"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadStitchKit(
                        Object.keys(chapterMp4Map).length === chapteredResult.chapters.length
                      )
                    }
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-400/40 bg-[#141b30] px-3 py-2 text-[11px] font-bold text-amber-200 hover:bg-[#1b2440] cursor-pointer"
                  >
                    <FileCode2 className="h-3.5 w-3.5" />
                    <span>FFmpeg Stitch Script + Timestamps</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const srt = generateSrtCaptions(episode);
                      triggerDownload(
                        new Blob([srt], { type: 'text/plain;charset=utf-8' }),
                        `${safeBaseName}_full.srt`
                      );
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-[#141b30] px-3 py-2 text-[11px] font-semibold text-slate-200 hover:border-white/30 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Full Episode .SRT</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setChapteredResult(null);
                    setLiveChaptersDone([]);
                    setChapterMp4Map({});
                    setStitchedMasterMp4(null);
                    setProgress(null);
                  }}
                  className="w-full pt-1 text-center text-[10px] font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Render again with different settings
                </button>
              </div>
            ) : result ? (
              <div className="space-y-2.5 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Done in {result.elapsedSec.toFixed(1)}s ({result.speedMultiplier}× realtime ·{' '}
                    {mp4BlobResult ? 'H.264 MP4 -14 LUFS Ready' : result.videoCodec}
                    {!mp4BlobResult && result.hasOpusAudio ? ' + Opus' : ''})
                  </span>
                </div>
                {result.loudnessMetrics && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#090e1d] border border-emerald-400/20 px-2.5 py-1.5 text-[10px] font-mono-tabular text-slate-200">
                    <span>
                      Loudness:{' '}
                      <strong className="text-emerald-300">
                        {result.loudnessMetrics.after.integratedLufs.toFixed(1)} LUFS
                      </strong>
                      {result.loudnessMetrics.normalized
                        ? ` (from ${result.loudnessMetrics.before.integratedLufs.toFixed(1)}, ${
                            result.loudnessMetrics.appliedGainDb >= 0 ? '+' : ''
                          }${result.loudnessMetrics.appliedGainDb.toFixed(1)} dB)`
                        : ' (unmodified)'}
                    </span>
                    <span>
                      True Peak:{' '}
                      <strong className="text-amber-300">
                        {result.loudnessMetrics.after.truePeakDbtp.toFixed(1)} dBTP
                      </strong>
                    </span>
                  </div>
                )}
                <div className={`grid grid-cols-1 gap-2 ${result.wavBlob ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                  <button
                    type="button"
                    disabled={convertingMp4}
                    onClick={() => void handleConvertResultToMp4()}
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition disabled:opacity-50 cursor-pointer ${
                      mp4BlobResult
                        ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
                        : 'border border-amber-400/40 bg-[#141b30] text-amber-200 hover:bg-[#1b2440]'
                    }`}
                  >
                    <Film className="h-3.5 w-3.5" />
                    {convertingMp4
                      ? 'Mastering...'
                      : mp4BlobResult
                        ? `.MP4 (${(mp4BlobResult.size / (1024 * 1024)).toFixed(1)} MB)`
                        : 'YouTube .MP4'}
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerDownload(result.webmBlob, `${safeBaseName}_master.webm`)}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2 text-[11px] font-bold text-slate-950 transition hover:bg-amber-300 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    .WebM ({(result.webmBlob.size / (1024 * 1024)).toFixed(1)} MB)
                  </button>
                  {result.wavBlob && (
                    <button
                      type="button"
                      onClick={() => triggerDownload(result.wavBlob!, `${safeBaseName}_audio.wav`)}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-[#141b30] px-3 py-2 text-[11px] font-semibold text-slate-200 transition hover:border-white/30 cursor-pointer"
                    >
                      <Music className="h-3.5 w-3.5 text-emerald-300" />
                      Master .WAV
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setMp4BlobResult(null);
                    setProgress(null);
                  }}
                  className="w-full pt-1 text-center text-[10px] font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Render again with different settings
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
