import { useEffect } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import {
  AspectMode,
  EpisodeScript,
  STUDIO_FPS,
  frameIndexToTime,
  getEpisodeDuration,
  getEpisodeTotalFrames,
  timeToFrameIndex,
  validateEpisodeScript,
} from './types';
import { evaluateEpisodeAtTime, renderEpisodeFrame } from './renderer';
import {
  KathaAudioEngine,
  renderEpisodeAudioOffline,
} from './audioEngine';
import { encodeAudioBufferToWav } from './offlineRenderer';
import {
  getVoiceSpeechProfile,
  sampleVoiceProfileAtTime,
} from './voiceEnvelope';
import { renderStoryboardContactSheetCanvas } from './storyboardQa';
import {
  RecommendedShortSlice,
  buildShortSliceEpisode,
  recommendTopShortSlices,
} from './shortsRecommender';
import {
  buildAbcThumbnailVariants,
  renderYoutubeThumbnail,
} from './thumbnailRenderer';

export interface HeadlessVoiceInput {
  beatId: string;
  fileName: string;
  mimeType: string;
  base64: string;
}

export interface HeadlessDriver {
  loadEpisode: (
    rawEpisode: unknown,
    nextAspect?: AspectMode,
    captions?: boolean
  ) => {
    ok: true;
    duration: number;
    totalFrames: number;
    width: number;
    height: number;
    beatCount: number;
  };
  loadVoiceAssets: (payload?: {
    voices?: HeadlessVoiceInput[];
    musicStem?: { fileName: string; mimeType: string; base64: string } | null;
  }) => Promise<{
    loadedVoices: number;
    hasMusicStem: boolean;
  }>;
  renderFrameAt: (timeSec: number) => {
    width: number;
    height: number;
    duration: number;
    frameIndex: number;
    pngBase64: string;
  };
  renderFrameAtIndex: (
    frameIndex: number,
    fps?: number
  ) => {
    width: number;
    height: number;
    duration: number;
    frameIndex: number;
    pngBase64: string;
  };
  renderAudioWavBase64: (opts?: {
    sampleRate?: number;
    musicLevel?: number;
    autoDuck?: boolean;
  }) => Promise<{
    wavBase64: string;
    durationSec: number;
    sampleRate: number;
  }>;
  renderContactSheetPng: () => {
    width: number;
    height: number;
    qaScore: number;
    passed: boolean;
    errorCount: number;
    warnCount: number;
    pngBase64: string;
  };
  recommendShorts: (maxCount?: number) => {
    slices: Array<RecommendedShortSlice & { episode: EpisodeScript }>;
  };
  renderThumbnailPackPngs: (
    variantKeys?: Array<'A' | 'B' | 'C'>
  ) => Array<{
    key: 'A' | 'B' | 'C';
    name: string;
    width: number;
    height: number;
    pngBase64: string;
  }>;
  getDuration: () => number;
}

export interface UseHeadlessDriverArgs {
  stageCanvasRef: MutableRefObject<HTMLCanvasElement | null>;
  audioRef: MutableRefObject<KathaAudioEngine | null>;
  episodeRef: MutableRefObject<EpisodeScript>;
  aspectRef: MutableRefObject<AspectMode>;
  showCaptionsRef: MutableRefObject<boolean>;
  expressionsEnabledRef: MutableRefObject<boolean>;
  isPlayingRef: MutableRefObject<boolean>;
  timeRef: MutableRefObject<number>;
  setEpisode: Dispatch<SetStateAction<EpisodeScript>>;
  setAspect: Dispatch<SetStateAction<AspectMode>>;
  setShowCaptions: Dispatch<SetStateAction<boolean>>;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
}

function bytesToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, Math.min(bytes.length, i + chunkSize));
    parts.push(String.fromCharCode(...slice));
  }
  return btoa(parts.join(''));
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

/**
 * Exposes `window.__STAGECRAFT_HEADLESS__` when loaded with `?headless=1`
 * so `scripts/render-batch.mjs` (Playwright + FFmpeg) can drive exact 60fps
 * deterministic frame rendering, voice asset ingestion, offline WAV mixing,
 * and Visual QA contact sheet audits headlessly.
 */
export function useHeadlessDriver(args: UseHeadlessDriverArgs): void {
  const {
    stageCanvasRef,
    audioRef,
    episodeRef,
    aspectRef,
    showCaptionsRef,
    expressionsEnabledRef,
    isPlayingRef,
    timeRef,
    setEpisode,
    setAspect,
    setShowCaptions,
    setIsPlaying,
  } = args;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('headless') !== '1') return;

    const renderHeadlessAtFrame = (frameIndex: number, fps = STUDIO_FPS) => {
      const canvas = stageCanvasRef.current;
      if (!canvas) throw new Error('Stage canvas not mounted.');
      const ep = episodeRef.current;
      const curAspect = aspectRef.current;
      const width = curAspect === '9:16' ? 1080 : 1920;
      const height = curAspect === '9:16' ? 1920 : 1080;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('2D canvas context unavailable.');
      const duration = getEpisodeDuration(ep);
      const safeFrame = Math.max(0, Math.floor(Number(frameIndex) || 0));
      const clampedT = Math.max(
        0,
        Math.min(Math.max(0, duration - 0.001), frameIndexToTime(safeFrame, fps))
      );
      timeRef.current = clampedT;
      const preEv = evaluateEpisodeAtTime(ep, clampedT, null);
      const voiceClip = audioRef.current?.getVoiceClip(preEv.beat.id);
      const voiceProfile = getVoiceSpeechProfile(voiceClip?.buffer);
      const voiceEnergy = sampleVoiceProfileAtTime(voiceProfile, preEv.localT);
      const ev =
        voiceEnergy !== null || voiceProfile?.speechWindow
          ? evaluateEpisodeAtTime(ep, clampedT, voiceEnergy, voiceProfile?.speechWindow)
          : preEv;
      renderEpisodeFrame(
        ctx,
        width,
        height,
        ep,
        ev,
        clampedT,
        curAspect,
        showCaptionsRef.current,
        expressionsEnabledRef.current,
        voiceProfile?.speechWindow
      );
      const dataUrl = canvas.toDataURL('image/png');
      return {
        width,
        height,
        duration,
        frameIndex: ev.frameIndex,
        pngBase64: dataUrl.slice('data:image/png;base64,'.length),
      };
    };

    const driver: HeadlessDriver = {
      loadEpisode(rawEpisode, nextAspect = '16:9', captions = true) {
        const check = validateEpisodeScript(rawEpisode);
        if (!check.ok) {
          throw new Error(check.error || 'Invalid episode script passed to headless renderer.');
        }
        const safeAspect: AspectMode = nextAspect === '9:16' ? '9:16' : '16:9';
        audioRef.current?.clearAllVoiceClips();
        audioRef.current?.clearMusicStem();
        setIsPlaying(false);
        isPlayingRef.current = false;
        episodeRef.current = check.script;
        aspectRef.current = safeAspect;
        showCaptionsRef.current = Boolean(captions);
        timeRef.current = 0;
        setEpisode(check.script);
        setAspect(safeAspect);
        setShowCaptions(Boolean(captions));
        const width = safeAspect === '9:16' ? 1080 : 1920;
        const height = safeAspect === '9:16' ? 1920 : 1080;
        const canvas = stageCanvasRef.current;
        if (canvas) {
          canvas.width = width;
          canvas.height = height;
        }
        return {
          ok: true,
          duration: getEpisodeDuration(check.script),
          totalFrames: getEpisodeTotalFrames(check.script, STUDIO_FPS),
          width,
          height,
          beatCount: check.script.beats.length,
        };
      },
      async loadVoiceAssets(payload = {}) {
        if (!audioRef.current) {
          audioRef.current = new KathaAudioEngine();
        }
        const OfflineAC =
          window.OfflineAudioContext ||
          (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
            .webkitOfflineAudioContext;
        const decodeCtx = new OfflineAC(2, 128, 48000);
        let loadedVoices = 0;
        let hasMusicStem = false;

        if (Array.isArray(payload.voices)) {
          for (const v of payload.voices) {
            if (!v?.beatId || !v?.base64) continue;
            try {
              const ab = base64ToArrayBuffer(v.base64);
              const decoded = await decodeCtx.decodeAudioData(ab);
              audioRef.current.setDecodedVoiceClip(v.beatId, decoded, v.fileName || `${v.beatId}.wav`);
              loadedVoices++;
            } catch {
              // skip undecodable audio clip cleanly
            }
          }
        }

        if (payload.musicStem?.base64) {
          try {
            const ab = base64ToArrayBuffer(payload.musicStem.base64);
            const decoded = await decodeCtx.decodeAudioData(ab);
            audioRef.current.setDecodedMusicStem(decoded, payload.musicStem.fileName || 'music_stem.wav');
            hasMusicStem = true;
          } catch {
            // skip undecodable stem cleanly
          }
        }

        return { loadedVoices, hasMusicStem };
      },
      renderFrameAt(timeSec: number) {
        return renderHeadlessAtFrame(timeToFrameIndex(Number(timeSec) || 0, STUDIO_FPS), STUDIO_FPS);
      },
      renderFrameAtIndex(frameIndex: number, fps = STUDIO_FPS) {
        return renderHeadlessAtFrame(frameIndex, fps);
      },
      async renderAudioWavBase64(opts = {}) {
        const ep = episodeRef.current;
        const sampleRate = opts.sampleRate ?? 48000;
        const audioBuf = await renderEpisodeAudioOffline(
          ep,
          audioRef.current?.getAllVoiceClips() ?? new Map(),
          {
            sampleRate,
            musicLevel: opts.musicLevel ?? 0.52,
            autoDuck: opts.autoDuck ?? true,
            musicStemBuffer: audioRef.current?.getMusicStemBuffer() ?? null,
          }
        );
        const wavBlob = encodeAudioBufferToWav(audioBuf);
        const wavBytes = new Uint8Array(await wavBlob.arrayBuffer());
        return {
          wavBase64: bytesToBase64(wavBytes),
          durationSec: audioBuf.duration,
          sampleRate: audioBuf.sampleRate,
        };
      },
      renderContactSheetPng() {
        const res = renderStoryboardContactSheetCanvas(episodeRef.current, aspectRef.current, {
          showCaptions: showCaptionsRef.current,
          expressionsEnabled: expressionsEnabledRef.current,
        });
        return {
          width: res.canvas.width,
          height: res.canvas.height,
          qaScore: res.qaReport.score,
          passed: res.qaReport.passed,
          errorCount: res.qaReport.errorCount,
          warnCount: res.qaReport.warnCount,
          pngBase64: res.dataUrl.slice('data:image/png;base64,'.length),
        };
      },
      recommendShorts(maxCount = 3) {
        const ep = episodeRef.current;
        const clamped = Math.max(1, Math.min(5, Math.floor(Number(maxCount) || 3)));
        const recs = recommendTopShortSlices(ep, clamped);
        return {
          slices: recs.map((r) => ({
            ...r,
            episode: buildShortSliceEpisode(ep, r.startIdx, r.endIdx, r.suggestedHook, true),
          })),
        };
      },
      renderThumbnailPackPngs(variantKeys?: Array<'A' | 'B' | 'C'>) {
        const ep = episodeRef.current;
        const variants = buildAbcThumbnailVariants(ep).filter((v) =>
          Array.isArray(variantKeys) && variantKeys.length > 0 ? variantKeys.includes(v.key) : true
        );
        const w = 1280;
        const h = 720;
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = w;
        thumbCanvas.height = h;
        const tctx = thumbCanvas.getContext('2d');
        if (!tctx) throw new Error('2D canvas context unavailable for thumbnail render.');
        return variants.map((v) => {
          tctx.clearRect(0, 0, w, h);
          renderYoutubeThumbnail(tctx, w, h, ep, v.config);
          const dataUrl = thumbCanvas.toDataURL('image/png');
          return {
            key: v.key,
            name: v.name,
            width: w,
            height: h,
            pngBase64: dataUrl.slice('data:image/png;base64,'.length),
          };
        });
      },
      getDuration() {
        return getEpisodeDuration(episodeRef.current);
      },
    };

    (window as unknown as { __STAGECRAFT_HEADLESS__?: HeadlessDriver }).__STAGECRAFT_HEADLESS__ =
      driver;

    return () => {
      delete (window as unknown as { __STAGECRAFT_HEADLESS__?: HeadlessDriver })
        .__STAGECRAFT_HEADLESS__;
    };
  }, [
    aspectRef,
    audioRef,
    episodeRef,
    expressionsEnabledRef,
    isPlayingRef,
    setAspect,
    setEpisode,
    setIsPlaying,
    setShowCaptions,
    showCaptionsRef,
    stageCanvasRef,
    timeRef,
  ]);
}
