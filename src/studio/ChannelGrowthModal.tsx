import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Activity,
  BookOpen,
  Globe,
  Users,
  Rocket,
  Sparkles,
  Check,
  Copy,
  Download,
  Moon,
  Plus,
  Trash2,
  Film,
  Upload,
  ShieldCheck,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { EpisodeScript } from './types';
import { PRESET_EPISODES } from './presets';
import {
  TARGET_LANGUAGES,
  applyLocalizedPayload,
  auditEpisodeRetention,
  autoFixRetentionPacing,
  autoInjectColdOpen,
  buildYoutubeLaunchPack,
  compileEpisodesIntoAnthology,
  extractLocalizationPayload,
  formatYoutubeTime,
} from './growthTools';
import { resolveEpisodeLanguage } from './i18n';
import {
  AudienceTarget,
  PublishLedgerEntry,
  applyAdSafeSoftener,
  applyAntiTemplateDifferentiator,
  applyCastVisualDiversifier,
  applyFullYppAutoShield,
  auditEpisodeYppCompliance,
  buildYppUploadChecklist,
  clearPublishLedger,
  injectTransformativeCommentaryBeat,
  loadPublishLedger,
  recordEpisodeExportInLedger,
} from './monetizationShield';
import {
  CastBibleEntry,
  applyCastBibleToEpisode,
  injectChannelHostBookends,
  loadCastBible,
  saveCastBible,
  upsertMemberInBible,
} from './castBible';
import { AssetThumb } from './AssetThumb';
import { buildMlaLanguagePackZip, MlaLanguageVariant } from './mlaPackager';
import { renderEpisodeAudioOffline, VoiceClipEntry } from './audioEngine';
import { encodeAudioBufferToWav } from './offlineRenderer';
import { buildExpressiveTtsProsody } from './facialExpressions';
import {
  buildDubSyncPackageZipBytes,
  computeDubTimingPlan,
  generateSyncedSrt,
  generateSyncedWebVtt,
  generateYouTubeChaptersText,
} from './dubSyncPackager';
import {
  PRODUCTION_STATUS_LABELS,
  PRODUCTION_STATUS_ORDER,
  SeasonEpisodeCard,
  advanceCardStatus,
  buildPreviouslyOnRecapBeat,
  loadSeasonBoard,
  removeCardFromSeasonBoard,
  upsertEpisodeInSeasonBoard,
} from './seasonBoard';
import {
  listSavedProjects,
  loadVoiceBlobsForProject,
  parseVoiceSlotKey,
  SavedProjectRecord,
} from './projectVault';
import { partitionEpisodeIntoChapters } from './longFormEngine';
import { healAndParseLlmJson } from './llmDirectorKit';

export type GrowthTab = 'ypp' | 'retention' | 'compile' | 'localize' | 'bible' | 'season' | 'launch';

interface LlmStatus {
  gemini: boolean;
  openai: boolean;
  anthropic: boolean;
  custom_server: boolean;
  ffmpeg: boolean;
}

export interface CarriedVoiceClip {
  beatId: string;
  blob: Blob;
  fileName: string;
  duration: number;
}

interface ChannelGrowthModalProps {
  episode: EpisodeScript;
  initialTab?: GrowthTab;
  voiceClipCount?: number;
  activeVoiceBlobs?: Map<string, { blob: Blob; fileName: string; duration: number }>;
  onClose: () => void;
  onApplyEpisode: (next: EpisodeScript, message?: string) => void;
  onApplyAnthologyVoices?: (remappedVoices: CarriedVoiceClip[]) => Promise<void>;
  onOpenVoiceTab: () => void;
  onOpenWorkshop?: (castId?: string) => void;
}

function downloadTextFile(filename: string, content: string, mime = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export const ChannelGrowthModal: React.FC<ChannelGrowthModalProps> = ({
  episode,
  initialTab = 'ypp',
  voiceClipCount = 0,
  activeVoiceBlobs,
  onClose,
  onApplyEpisode,
  onApplyAnthologyVoices,
  onOpenVoiceTab,
  onOpenWorkshop,
}) => {
  const [tab, setTab] = useState<GrowthTab>(initialTab);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [llmStatus, setLlmStatus] = useState<LlmStatus>({
    gemini: false,
    openai: false,
    anthropic: false,
    custom_server: false,
    ffmpeg: false,
  });

  useEffect(() => {
    fetch('/api/llm/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setLlmStatus(d as LlmStatus);
      })
      .catch(() => {});
  }, []);

  const flash = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg((cur) => (cur === msg ? null : cur)), 4500);
  };

  // ---- TAB 0: YOUTUBE MONETIZATION & YPP POLICY SHIELD ----
  const [audience, setAudience] = useState<AudienceTarget>('general_audience');
  const [ledger, setLedger] = useState<PublishLedgerEntry[]>(() => loadPublishLedger());
  const [bible, setBible] = useState<CastBibleEntry[]>(() => loadCastBible());
  const hostEntry = bible.find((b) => b.isHost) || bible[0];
  const yppAudit = useMemo(
    () => auditEpisodeYppCompliance(episode, { audience, voiceClipCount, ledger, castBible: bible }),
    [episode, audience, voiceClipCount, ledger, bible]
  );
  const yppChecklist = useMemo(
    () => buildYppUploadChecklist(episode, audience, voiceClipCount),
    [episode, audience, voiceClipCount]
  );

  // ---- TAB 1: RETENTION AUDITOR (#5) ----
  const audit = useMemo(() => auditEpisodeRetention(episode), [episode]);

  // ---- TAB 2: COMPILATION & BEDTIME ANTHOLOGY (#7) ----
  const [vaultProjects, setVaultProjects] = useState<SavedProjectRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    PRESET_EPISODES.slice(0, 3).map((e) => e.id)
  );
  const [anthologyTitle, setAnthologyTitle] = useState('Ancient World Folklore Anthology');
  const [bedtimeMode, setBedtimeMode] = useState(false);
  const [includeBumpers, setIncludeBumpers] = useState(true);

  const [loadingAnthology, setLoadingAnthology] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listSavedProjects()
      .then((list) => {
        if (!cancelled) setVaultProjects(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const anthologyCatalog = useMemo(() => {
    const items: Array<{ key: string; source: 'active' | 'vault' | 'preset'; label: string; episode: EpisodeScript }> = [
      {
        key: '__active_stage__',
        source: 'active',
        label: 'Current Stage',
        episode,
      },
      ...vaultProjects.map((vp) => ({
        key: `vault::${vp.id}`,
        source: 'vault' as const,
        label: 'Saved Vault',
        episode: vp.episode,
      })),
      ...PRESET_EPISODES.map((ep) => ({
        key: ep.id,
        source: 'preset' as const,
        label: ep.series,
        episode: ep,
      })),
    ];
    return items;
  }, [episode, vaultProjects]);

  const selectedCatalogItems = useMemo(
    () =>
      selectedIds
        .map((id) => anthologyCatalog.find((item) => item.key === id))
        .filter((x): x is (typeof anthologyCatalog)[number] => Boolean(x)),
    [selectedIds, anthologyCatalog]
  );

  const selectedEpisodes = useMemo(
    () => selectedCatalogItems.map((item) => item.episode),
    [selectedCatalogItems]
  );

  const compilationPreview = useMemo(() => {
    if (selectedEpisodes.length === 0) return null;
    return compileEpisodesIntoAnthology(selectedEpisodes, {
      anthologyTitle,
      bedtimeMode,
      includeBumpers,
    });
  }, [selectedEpisodes, anthologyTitle, bedtimeMode, includeBumpers]);

  const handleLoadCompiledAnthology = async () => {
    if (!compilationPreview) return;
    setLoadingAnthology(true);
    try {
      const remappedVoices: CarriedVoiceClip[] = [];

      if (onApplyAnthologyVoices && compilationPreview.beatOriginMap.length > 0) {
        // Group beat remaps by sourceEpisodeIdx for fast lookup
        const originBySource = new Map<number, Map<string, string>>();
        for (const entry of compilationPreview.beatOriginMap) {
          let map = originBySource.get(entry.sourceEpisodeIdx);
          if (!map) {
            map = new Map<string, string>();
            originBySource.set(entry.sourceEpisodeIdx, map);
          }
          map.set(entry.oldBeatId, entry.newBeatId);
        }

        for (let idx = 0; idx < selectedCatalogItems.length; idx++) {
          const item = selectedCatalogItems[idx];
          const beatMap = originBySource.get(idx);
          if (!beatMap || beatMap.size === 0) continue;

          if (item.source === 'active' && activeVoiceBlobs && activeVoiceBlobs.size > 0) {
            for (const [oldId, v] of activeVoiceBlobs.entries()) {
              const newId = beatMap.get(oldId);
              if (newId) {
                remappedVoices.push({
                  beatId: newId,
                  blob: v.blob,
                  fileName: v.fileName,
                  duration: v.duration,
                });
              }
            }
          } else if (item.source === 'vault') {
            const projectId = item.key.replace(/^vault::/, '');
            try {
              const savedVoices = await loadVoiceBlobsForProject(projectId);
              for (const sv of savedVoices) {
                const parsed = parseVoiceSlotKey(sv.beatId);
                const rawBeatId = parsed.beatId || sv.beatId;
                const newId = beatMap.get(rawBeatId);
                if (newId) {
                  remappedVoices.push({
                    beatId: newId,
                    blob: sv.blob,
                    fileName: sv.fileName,
                    duration: sv.duration,
                  });
                }
              }
            } catch {
              // Non-fatal if IndexedDB lookup fails for one project
            }
          }
        }
      }

      const voiceNote =
        remappedVoices.length > 0
          ? ` + carried over ${remappedVoices.length} saved voiceover clip${remappedVoices.length === 1 ? '' : 's'}!`
          : '!';
      onApplyEpisode(
        compilationPreview.episode,
        `Compiled ${selectedEpisodes.length} stories into "${compilationPreview.episode.title}"${voiceNote}`
      );
      if (onApplyAnthologyVoices && remappedVoices.length > 0) {
        await onApplyAnthologyVoices(remappedVoices);
      }
      onClose();
    } finally {
      setLoadingAnthology(false);
    }
  };

  // ---- TAB 3: MULTI-LANGUAGE DUBBING (#4) ----
  const activeEpisodeLang = useMemo(() => resolveEpisodeLanguage(episode), [episode]);
  const [targetLang, setTargetLang] = useState('hi');
  const [locProvider, setLocProvider] = useState<'gemini' | 'openai' | 'anthropic' | 'ollama'>('gemini');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434/api/chat');
  const [ollamaModel, setOllamaModel] = useState('llama3.1');
  const [translating, setTranslating] = useState(false);
  const [translateProgress, setTranslateProgress] = useState<string | null>(null);
  const [manualTransJson, setManualTransJson] = useState('');
  // Upgrade 6: Batch Multi-Language & YouTube MLA Packager state
  const [mlaLangs, setMlaLangs] = useState<string[]>(['hi', 'es', 'ja']);
  const isLongFormForWav = audit.totalDurationSec > 240;
  const [mlaIncludeWav, setMlaIncludeWav] = useState(true);
  const [mlaAutoDubVoices, setMlaAutoDubVoices] = useState(false);
  const [mlaBusy, setMlaBusy] = useState(false);
  const [mlaProgress, setMlaProgress] = useState<string | null>(null);
  const mlaCancelRef = useRef(false);
  // Upgrade 7: Season Production Board state
  const [seasonCards, setSeasonCards] = useState<SeasonEpisodeCard[]>(() => loadSeasonBoard());

  const invokeTranslatorLlm = async (systemPrompt: string, userPrompt: string): Promise<string> => {
    if (locProvider === 'ollama') {
      let parsedOllama: URL;
      try {
        parsedOllama = new URL(ollamaUrl.trim());
        if (parsedOllama.protocol !== 'http:' && parsedOllama.protocol !== 'https:') {
          throw new Error('Ollama URL must use http:// or https://');
        }
      } catch {
        throw new Error('Enter a valid Local Ollama URL (e.g. http://localhost:11434/api/chat).');
      }
      const res = await fetch(parsedOllama.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaModel,
          stream: false,
          format: 'json',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });
      if (!res.ok) throw new Error(`Local Ollama error (${res.status})`);
      const data = (await res.json()) as { message?: { content?: string } };
      return data.message?.content || '';
    }

    const res = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: locProvider,
        systemPrompt,
        userPrompt,
      }),
    });
    const data = (await res.json()) as { text?: string; error?: string };
    if (!res.ok) throw new Error(data.error || 'Translation request failed');
    return data.text || '';
  };

  /**
   * Translates both short and long-form (8–25 min, 60–250 beat) episodes safely by automatically
   * chunking into chapter payloads whenever beat count exceeds 26 so prompts never hit the 48 KB cap!
   */
  const translateEpisodeChunked = async (
    sourceEp: EpisodeScript,
    langObj: (typeof TARGET_LANGUAGES)[number],
    onStep?: (msg: string) => void,
    shouldCancel?: () => boolean
  ): Promise<EpisodeScript> => {
    const systemPrompt =
      'You are an expert literary folklore translator. Translate title, subtitle, series, cast[].name, and every beat title/speakerLabel/dialogue into natural, vivid storytelling language. Preserve all beat IDs and cast IDs verbatim. Return STRICT valid JSON matching the exact input keys.';

    if (sourceEp.beats.length <= 26) {
      onStep?.(`Translating ${sourceEp.beats.length} scenes to ${langObj.label}...`);
      const payload = extractLocalizationPayload(sourceEp);
      const userPrompt = `Translate this JSON into ${langObj.label} (${langObj.nativeName}) with ${langObj.voiceHint}:\n\n${JSON.stringify(payload, null, 2)}`;
      const rawText = await invokeTranslatorLlm(systemPrompt, userPrompt);
      const healed = healAndParseLlmJson(rawText);
      if (healed.ok === false) throw new Error(healed.error);
      const parsed = healed.data as Partial<ReturnType<typeof extractLocalizationPayload>>;
      return applyLocalizedPayload(sourceEp, parsed, langObj.code);
    }

    // Long-form chaptered translation: chunk via partitionEpisodeIntoChapters (~140s / <=24 beats per call)
    const chapters = partitionEpisodeIntoChapters(sourceEp, 140);
    let workingEp: EpisodeScript = sourceEp;
    let castGlossary = '';

    for (let i = 0; i < chapters.length; i++) {
      if (shouldCancel?.()) break;
      const ch = chapters[i];
      const chBeats = ch.subEpisode.beats;
      onStep?.(
        `Translating Chapter ${i + 1}/${chapters.length} (${chBeats.length} scenes) -> ${langObj.label}...`
      );
      const subPayload =
        i === 0
          ? {
              language: langObj.code,
              title: sourceEp.title,
              subtitle: sourceEp.subtitle || '',
              series: sourceEp.series,
              cast: sourceEp.cast.map((c) => ({ id: c.id, name: c.name })),
              beats: chBeats.map((b) => ({
                id: b.id,
                title: b.title,
                speakerLabel: b.speakerLabel,
                dialogue: b.dialogue,
              })),
            }
          : {
              beats: chBeats.map((b) => ({
                id: b.id,
                title: b.title,
                speakerLabel: b.speakerLabel,
                dialogue: b.dialogue,
              })),
            };

      const userPrompt = `Translate Chapter ${i + 1}/${chapters.length} into ${langObj.label} (${langObj.nativeName}) with ${langObj.voiceHint}.${
        castGlossary ? ` Keep character names consistent: ${castGlossary}.` : ''
      }\n\n${JSON.stringify(subPayload, null, 2)}`;

      const rawText = await invokeTranslatorLlm(systemPrompt, userPrompt);
      const healed = healAndParseLlmJson(rawText);
      if (healed.ok === false) throw new Error(`Chapter ${i + 1}: ${healed.error}`);
      const parsed = healed.data as Partial<ReturnType<typeof extractLocalizationPayload>>;
      workingEp = applyLocalizedPayload(workingEp, parsed, langObj.code);
      if (i === 0) {
        castGlossary = workingEp.cast.map((c) => `${c.id}=${c.name}`).join(', ');
      }
    }

    return workingEp;
  };

  const handleAiTranslate = async () => {
    const langObj = TARGET_LANGUAGES.find((l) => l.code === targetLang) || TARGET_LANGUAGES[0];
    setTranslating(true);
    setTranslateProgress(null);
    try {
      const localized = await translateEpisodeChunked(episode, langObj, (msg) =>
        setTranslateProgress(msg)
      );
      onApplyEpisode(
        localized,
        `Localized "${episode.title}" into ${langObj.label} (${langObj.nativeName})! Open Voice tab to dub.`
      );
      flash(
        `Episode localized to ${langObj.label}${
          episode.beats.length > 26 ? ' (chunked long-form safe)' : ''
        }! Visual timing & animation stay 100% identical.`
      );
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Translation failed.');
    } finally {
      setTranslating(false);
      setTranslateProgress(null);
    }
  };

  /**
   * Decodes a chapter's voice blobs (or synthesizes dubbed voice clips via /api/tts with expressive prosody),
   * renders the chapter's offline mix, and frees PCM buffers immediately between chapters!
   */
  const renderChapteredAudioTrackForLanguage = async (
    targetEp: EpisodeScript,
    langLabel: string,
    bcp47: string,
    dubVoicesWithTts: boolean,
    reuseBaseVoices: boolean,
    progressPrefix: string
  ): Promise<{ bytes: Uint8Array; ext: 'm4a' | 'wav' } | null> => {
    const OfflineAC =
      window.OfflineAudioContext ||
      (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
        .webkitOfflineAudioContext;

    const geminiVoices = ['Charon', 'Fenrir', 'Puck', 'Kore', 'Zephyr'];
    const speakerVoiceMap = new Map<string, string>();
    speakerVoiceMap.set('narrator', 'Charon');
    targetEp.cast.forEach((c, idx) => {
      speakerVoiceMap.set(c.id, geminiVoices[(idx + 1) % geminiVoices.length]);
    });

    const synthesizeDubbedChapterVoices = async (
      subEp: EpisodeScript,
      chapterLabel: string
    ): Promise<Map<string, VoiceClipEntry>> => {
      const map = new Map<string, VoiceClipEntry>();
      const decodeCtx = new OfflineAC(2, 128, 44100);

      for (let bIdx = 0; bIdx < subEp.beats.length; bIdx++) {
        if (mlaCancelRef.current) break;
        const beat = subEp.beats[bIdx];
        if (!beat.dialogue.trim()) continue;

        if (reuseBaseVoices && activeVoiceBlobs?.has(beat.id)) {
          const existing = activeVoiceBlobs.get(beat.id)!;
          try {
            const ab = await existing.blob.arrayBuffer();
            const decoded = await decodeCtx.decodeAudioData(ab);
            map.set(beat.id, {
              beatId: beat.id,
              fileName: existing.fileName,
              buffer: decoded,
              duration: decoded.duration,
            });
          } catch {
            // ignore unreadable clip
          }
          continue;
        }

        if (!dubVoicesWithTts) continue;

        const voiceId = speakerVoiceMap.get(beat.speakerId || 'narrator') || 'Charon';
        const dubTiming = computeDubTimingPlan(episode, subEp, bcp47);
        const beatRate = dubTiming.beats[bIdx]?.speechRate ?? 1.0;
        const prosody = buildExpressiveTtsProsody(
          beat,
          'Expressive regional storyteller dubbing',
          beatRate
        );
        setMlaProgress(
          `${progressPrefix} Dubbing ${langLabel} ${chapterLabel} (${bIdx + 1}/${subEp.beats.length}, ${beatRate.toFixed(2)}×)...`
        );
        for (let attempt = 1; attempt <= 3; attempt++) {
          if (mlaCancelRef.current) break;
          const resp = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: 'gemini',
              model: 'gemini-3.8-flash-lite-tts',
              voice: voiceId,
              style: prosody.style,
              speed: prosody.speed,
              language: bcp47,
              text: beat.dialogue,
            }),
          });
          if (resp.status === 429 && attempt < 3) {
            await new Promise((r) => setTimeout(r, attempt * 2500));
            continue;
          }
          if (!resp.ok) break;
          try {
            const arrBuf = await resp.arrayBuffer();
            const decoded = await decodeCtx.decodeAudioData(arrBuf);
            map.set(beat.id, {
              beatId: beat.id,
              fileName: `dub_${beat.id}.wav`,
              buffer: decoded,
              duration: decoded.duration,
            });
          } catch {
            // non-fatal decode error
          }
          break;
        }
      }
      return map;
    };

    // Short episode (<=4 min): render single browser WAV directly
    if (!isLongFormForWav) {
      const voiceMap = await synthesizeDubbedChapterVoices(targetEp, 'Full');
      if (mlaCancelRef.current) return null;
      setMlaProgress(`${progressPrefix} Mixing ${langLabel} offline WAV...`);
      const buf = await renderEpisodeAudioOffline(targetEp, voiceMap, { sampleRate: 44100 });
      const blob = encodeAudioBufferToWav(buf);
      return { bytes: new Uint8Array(await blob.arrayBuffer()), ext: 'wav' };
    }

    // Long-form (>4 min): chapter-chunked browser mix -> streaming Server FFmpeg .m4a stitch (-14 LUFS)!
    if (!llmStatus.ffmpeg) return null;

    const chapters = partitionEpisodeIntoChapters(targetEp, 180);
    const startRes = await fetch('/api/audio-session/start', { method: 'POST' });
    if (!startRes.ok) return null;
    const { sessionId } = (await startRes.json()) as { sessionId: string };

    try {
      for (let cIdx = 0; cIdx < chapters.length; cIdx++) {
        if (mlaCancelRef.current) {
          void fetch(`/api/audio-session/${sessionId}`, { method: 'DELETE' }).catch(() => {});
          return null;
        }
        const ch = chapters[cIdx];
        const chVoices = await synthesizeDubbedChapterVoices(
          ch.subEpisode,
          `Ch ${cIdx + 1}/${chapters.length}`
        );
        if (mlaCancelRef.current) {
          void fetch(`/api/audio-session/${sessionId}`, { method: 'DELETE' }).catch(() => {});
          return null;
        }
        setMlaProgress(
          `${progressPrefix} Mixing & uploading ${langLabel} Ch ${cIdx + 1}/${chapters.length}...`
        );
        const buf = await renderEpisodeAudioOffline(ch.subEpisode, chVoices, { sampleRate: 44100 });
        const wavBlob = encodeAudioBufferToWav(buf);
        const upRes = await fetch(`/api/audio-session/${sessionId}/chunk?index=${cIdx}`, {
          method: 'POST',
          headers: { 'Content-Type': 'audio/wav' },
          body: wavBlob,
        });
        if (!upRes.ok) {
          throw new Error(`Audio chunk ${cIdx + 1} upload failed (${upRes.status})`);
        }
        await new Promise((r) => setTimeout(r, 25));
      }

      setMlaProgress(
        `${progressPrefix} Stitching ${langLabel} broadcast .M4A (-14 LUFS) on Server FFmpeg...`
      );
      const safeAudioName = `${(targetEp.id || 'episode').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 40)}_${bcp47.replace(/[^A-Za-z0-9_-]/g, '_')}`;
      const finRes = await fetch(
        `/api/audio-session/${sessionId}/finalize?format=m4a&filename=${encodeURIComponent(safeAudioName)}`,
        { method: 'POST' }
      );
      if (!finRes.ok) {
        throw new Error(`Server audio stitch failed (${finRes.status})`);
      }
      const m4aBytes = new Uint8Array(await finRes.arrayBuffer());
      return { bytes: m4aBytes, ext: 'm4a' };
    } catch {
      void fetch(`/api/audio-session/${sessionId}`, { method: 'DELETE' }).catch(() => {});
      return null;
    }
  };

  // Upgrade 6: Batch AI Translate + Long-Form Chapter-Chunked Dubbed Audio -> YouTube MLA (.zip)
  const handleBuildMlaPack = async () => {
    const targets = Array.from(new Set(mlaLangs));
    if (targets.length === 0) {
      flash('Select at least one target language for the YouTube MLA pack.');
      return;
    }
    mlaCancelRef.current = false;
    setMlaBusy(true);
    setMlaProgress('Preparing current episode base track...');
    try {
      const variants: MlaLanguageVariant[] = [];
      const canRenderAudio = mlaIncludeWav && (!isLongFormForWav || llmStatus.ffmpeg);

      // Always include the current active episode language as the primary reference track
      let baseAudio: { bytes: Uint8Array; ext: 'm4a' | 'wav' } | null = null;
      if (canRenderAudio) {
        try {
          baseAudio = await renderChapteredAudioTrackForLanguage(
            episode,
            activeEpisodeLang.label,
            activeEpisodeLang.bcp47,
            mlaAutoDubVoices && (!activeVoiceBlobs || activeVoiceBlobs.size === 0),
            true,
            '[Base]'
          );
        } catch {
          // Non-fatal if browser blocks OfflineAudioContext
        }
      }
      variants.push({
        langCode: activeEpisodeLang.code,
        episode,
        audioBytes: baseAudio?.bytes,
        audioExt: baseAudio?.ext,
      });

      for (let i = 0; i < targets.length; i++) {
        if (mlaCancelRef.current) {
          flash('Batch MLA packaging cancelled.');
          return;
        }
        const code = targets[i];
        if (code === activeEpisodeLang.code) continue;
        const langObj = TARGET_LANGUAGES.find((l) => l.code === code);
        if (!langObj) continue;

        let localizedEp: EpisodeScript = { ...episode, language: langObj.code };
        try {
          localizedEp = await translateEpisodeChunked(
            episode,
            langObj,
            (stepMsg) => setMlaProgress(`(${i + 1}/${targets.length}) ${stepMsg}`),
            () => mlaCancelRef.current
          );
        } catch {
          // If LLM key is not configured for this provider, still bundle localized stage metadata + SRT structure cleanly
        }

        let langAudio: { bytes: Uint8Array; ext: 'm4a' | 'wav' } | null = null;
        if (canRenderAudio && !mlaCancelRef.current) {
          try {
            const locSpec = resolveEpisodeLanguage(localizedEp);
            langAudio = await renderChapteredAudioTrackForLanguage(
              localizedEp,
              langObj.label,
              locSpec.bcp47,
              mlaAutoDubVoices,
              false,
              `(${i + 1}/${targets.length})`
            );
          } catch {
            // fallback cleanly without audio
          }
        }

        variants.push({
          langCode: langObj.code,
          episode: localizedEp,
          audioBytes: langAudio?.bytes,
          audioExt: langAudio?.ext,
        });
      }

      if (mlaCancelRef.current) {
        flash('Batch MLA packaging cancelled.');
        return;
      }

      setMlaProgress('Packing CRC-32 YouTube MLA .ZIP bundle...');
      const zipBytes = buildMlaLanguagePackZip(variants);
      const ab = new ArrayBuffer(zipBytes.byteLength);
      new Uint8Array(ab).set(zipBytes);
      const zipBlob = new Blob([ab], { type: 'application/zip' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${episode.id}_youtube_mla_pack_${variants.length}langs.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      const audioTrackCount = variants.filter((v) => v.audioBytes && v.audioBytes.byteLength > 0).length;
      flash(
        `Exported YouTube MLA Pack (${variants.length} languages${
          audioTrackCount > 0 ? `, ${audioTrackCount} audio tracks` : ''
        }, ${(zipBytes.byteLength / (1024 * 1024)).toFixed(1)} MB)!`
      );
    } catch (err) {
      flash(err instanceof Error ? err.message : 'MLA Packager failed.');
    } finally {
      setMlaBusy(false);
      setMlaProgress(null);
    }
  };

  // ---- TAB 5: YOUTUBE LAUNCH PACK & BATCH MP4 (#10 & #1) ----
  const launchPack = useMemo(
    () => buildYoutubeLaunchPack(episode, { audience, voiceClipCount }),
    [episode, audience, voiceClipCount]
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [convertingMp4, setConvertingMp4] = useState(false);
  const webmFileRef = useRef<HTMLInputElement | null>(null);

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      flash('Clipboard blocked; use Download instead.');
    }
  };

  const handleConvertWebmToMp4 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setConvertingMp4(true);
    try {
      const res = await fetch('/api/convert-mp4', {
        method: 'POST',
        headers: { 'Content-Type': 'video/webm' },
        body: file,
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || `Conversion failed (${res.status})`);
      }
      const mp4Blob = await res.blob();
      const url = URL.createObjectURL(mp4Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace(/\.webm$/i, '')}_youtube_14lufs.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      flash('Broadcast H.264 MP4 (-14 LUFS loudness normalized) downloaded!');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'MP4 conversion failed.');
    } finally {
      setConvertingMp4(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[1040px] max-h-[92vh] bg-[#0e1222] border border-white/15 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 h-14 border-b border-white/10 flex items-center justify-between gap-4 shrink-0 bg-[#0b0e19]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-display text-base font-semibold text-white whitespace-nowrap">
              Channel Growth &amp; Production Suite
            </span>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#14192d] border border-white/8 overflow-x-auto">
              {(
                [
                  ['ypp', 'YPP Shield', ShieldCheck],
                  ['retention', 'Retention', Activity],
                  ['compile', 'Anthology', BookOpen],
                  ['localize', 'Dub & MLA', Globe],
                  ['bible', 'Cast Bible', Users],
                  ['season', 'Season Board', Layers],
                  ['launch', 'Launch & MP4', Rocket],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    tab === id
                      ? 'bg-[#1f2947] text-[#f2c85b]'
                      : 'text-[#8e97b0] hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-white/10 flex items-center justify-center text-[#9aa3bd] hover:text-white shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {statusMsg && (
          <div className="px-5 py-2 bg-[#1a2847] border-b border-[#f2c85b]/30 text-xs text-[#f7e7bc] flex items-center justify-between">
            <span>{statusMsg}</span>
            <button
              type="button"
              onClick={() => setStatusMsg(null)}
              className="text-[11px] text-[#9aa3bd] hover:text-white cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ============================================================== */}
          {/* TAB 0: YOUTUBE MONETIZATION & YPP POLICY SHIELD                */}
          {/* ============================================================== */}
          {tab === 'ypp' && (
            <div className="space-y-4">
              {/* Top Score & 1-Click Fixes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#13182b] border border-white/10 flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center font-extrabold shrink-0 ${
                      yppAudit.status === 'monetization_ready'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : yppAudit.status === 'review_recommended'
                          ? 'bg-amber-500/20 text-[#f2c85b] border border-[#f2c85b]/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                    }`}
                  >
                    <span className="text-2xl leading-none">{yppAudit.score}</span>
                    <span className="text-[10px] uppercase tracking-wider mt-0.5">
                      Grade {yppAudit.grade}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {yppAudit.status === 'monetization_ready'
                        ? 'Monetization Ready'
                        : yppAudit.status === 'review_recommended'
                          ? 'Review Advised'
                          : 'High YPP / Ad Risk'}
                    </div>
                    <div className="text-[11px] text-[#8e97b0] mt-0.5 font-mono-tabular">
                      {Math.round(yppAudit.characterDialogueRatio * 100)}% acting ·{' '}
                      {yppAudit.uniqueShotCount} shots · {yppAudit.castUniquenessScore}% unique cast
                    </div>
                    <div className="text-[11px] text-[#f2c85b] mt-1">
                      {yppAudit.castTwinWarnings.length > 0
                        ? `${yppAudit.castTwinWarnings.length} Twin Silhouette${yppAudit.castTwinWarnings.length === 1 ? '' : 's'} Flagged`
                        : yppAudit.hasEditorialCommentary
                          ? 'Transformative Context Active'
                          : 'Missing Editorial Context'}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 p-4 rounded-xl bg-[#13182b] border border-white/10 flex flex-col justify-between gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-white">
                        One-Click YPP &amp; AdSense Hardening
                      </div>
                      <p className="text-[11px] text-[#8e97b0] mt-0.5">{yppAudit.summaryLine}</p>
                    </div>
                    <div className="inline-flex rounded-md bg-[#0b0f1d] border border-white/10 p-0.5 text-[10px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setAudience('general_audience')}
                        className={`px-2 py-1 rounded cursor-pointer ${
                          audience === 'general_audience'
                            ? 'bg-[#1f2947] text-emerald-300'
                            : 'text-[#8e97b0] hover:text-white'
                        }`}
                      >
                        General Audience (Full RPM)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAudience('made_for_kids')}
                        className={`px-2 py-1 rounded cursor-pointer ${
                          audience === 'made_for_kids'
                            ? 'bg-[#1f2947] text-[#f2c85b]'
                            : 'text-[#8e97b0] hover:text-white'
                        }`}
                      >
                        Made for Kids (COPPA)
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const res = applyFullYppAutoShield(episode, ledger);
                        if (res.changed) {
                          onApplyEpisode(res.episode, `YPP Auto-Shield: ${res.summary.join(' · ')}`);
                        }
                        flash(res.summary.join(' · '));
                      }}
                      className="h-8 px-3 rounded-md bg-emerald-400 hover:bg-emerald-300 text-[#091310] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>1-Click Full YPP Auto-Shield</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = applyAdSafeSoftener(episode);
                        if (res.replacementsCount > 0) {
                          onApplyEpisode(
                            res.episode,
                            `Softened ${res.replacementsCount} ad-risk term(s) for Green-Dollar AdSense.`
                          );
                          flash(
                            `Softened ${res.replacementsCount} term(s): ${res.replacedTerms.join(', ')}`
                          );
                        } else {
                          flash('No yellow-icon vocabulary found in title or dialogue.');
                        }
                      }}
                      className="h-8 px-3 rounded-md bg-[#1d2745] hover:bg-[#27355c] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#f2c85b]" />
                      <span>Soften Ad-Risk Words ({yppAudit.adTriggers.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = injectTransformativeCommentaryBeat(episode);
                        if (res.added) {
                          onApplyEpisode(
                            res.episode,
                            'Added Cultural Context & Modern Reflection beat for YPP originality.'
                          );
                          flash('Injected Cultural Context & Modern Reflection beat before Moral Card!');
                        } else {
                          flash('Episode already includes transformative editorial commentary.');
                        }
                      }}
                      className="h-8 px-3 rounded-md bg-[#1d2745] hover:bg-[#27355c] text-white text-xs font-semibold cursor-pointer"
                    >
                      + Cultural Commentary
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = applyAntiTemplateDifferentiator(episode, ledger);
                        onApplyEpisode(
                          res.episode,
                          `Differentiated episode: ${res.changes.join(' · ')}`
                        );
                        flash(res.changes.join(' · '));
                      }}
                      className="h-8 px-3 rounded-md bg-[#1d2745] hover:bg-[#27355c] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-sky-300" />
                      <span>Differentiate vs. Uploads</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = applyCastVisualDiversifier(episode, ledger, bible);
                        if (res.diversifiedNames.length > 0) {
                          onApplyEpisode(
                            res.episode,
                            `Diversified ${res.diversifiedNames.length} character silhouette(s): ${res.diversifiedNames.join(', ')}`
                          );
                          flash(`Mutated ${res.diversifiedNames.join(', ')} into unique silhouettes.`);
                        } else {
                          flash('All cast members already have distinct silhouettes vs. fellow cast & past uploads.');
                        }
                      }}
                      className="h-8 px-3 rounded-md bg-[#1d2745] hover:bg-[#27355c] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-[#f2c85b]" />
                      <span>Diversify Cast ({yppAudit.castTwinWarnings.length})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Lower 2-Column Audit + Ledger / Disclosure */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Policy Findings */}
                <div className="p-4 rounded-xl bg-[#12172a] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">
                      5-Pillar Policy &amp; Ad-Suitability Audit
                    </span>
                    <span className="text-[10px] text-[#8e97b0]">
                      {yppAudit.issues.length === 0
                        ? 'All Clear'
                        : `${yppAudit.issues.length} item${yppAudit.issues.length === 1 ? '' : 's'}`}
                    </span>
                  </div>

                  {yppAudit.issues.length === 0 ? (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-400/25 text-xs text-emerald-200">
                      All 5 YPP monetization pillars pass cleanly — ready for export and upload!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {yppAudit.issues.map((issue) => (
                        <div
                          key={issue.id}
                          className={`p-3 rounded-lg border text-xs ${
                            issue.severity === 'high'
                              ? 'bg-rose-500/10 border-rose-400/30'
                              : issue.severity === 'medium'
                                ? 'bg-amber-500/10 border-[#f2c85b]/30'
                                : 'bg-[#0b0f1d] border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-white">{issue.title}</span>
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                issue.severity === 'high'
                                  ? 'bg-rose-500/25 text-rose-200'
                                  : issue.severity === 'medium'
                                    ? 'bg-amber-500/20 text-[#f2c85b]'
                                    : 'bg-sky-500/20 text-sky-200'
                              }`}
                            >
                              {issue.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#b4bed6] mt-1 leading-relaxed">
                            {issue.detail}
                          </p>
                          {issue.actionHint === 'add_voices' && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenVoiceTab();
                              }}
                              className="mt-2 px-2.5 py-1 rounded bg-[#1e2948] hover:bg-[#2a3861] text-[10px] font-semibold text-[#f2c85b] cursor-pointer"
                            >
                              Open Voice Studio &rarr;
                            </button>
                          )}
                          {issue.actionHint === 'diversify_cast' && (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const res = applyCastVisualDiversifier(episode, ledger, bible);
                                  if (res.diversifiedNames.length > 0) {
                                    onApplyEpisode(
                                      res.episode,
                                      `Diversified ${res.diversifiedNames.join(', ')} into unique modular silhouettes.`
                                    );
                                    flash(`Diversified ${res.diversifiedNames.join(', ')}!`);
                                  } else {
                                    flash('All cast silhouettes already pass uniqueness threshold.');
                                  }
                                }}
                                className="px-2.5 py-1 rounded bg-[#f2c85b] hover:bg-[#f7d577] text-[10px] font-bold text-[#110e0a] cursor-pointer"
                              >
                                1-Click Diversify Cast
                              </button>
                              {onOpenWorkshop && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onOpenWorkshop(episode.cast[0]?.id);
                                  }}
                                  className="px-2.5 py-1 rounded bg-[#1e2948] hover:bg-[#2a3861] text-[10px] font-semibold text-[#f2c85b] cursor-pointer"
                                >
                                  Open Entity Workshop &rarr;
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Channel Upload Diversity Ledger + Studio Disclosure Checklist */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#12172a] border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold text-white">
                          Channel Upload Diversity Ledger ({ledger.length}/15)
                        </div>
                        <div className="text-[10px] text-[#8e97b0]">
                          Auto-logs exported episodes to catch back-to-back template repetition before YouTube does.
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = recordEpisodeExportInLedger(episode);
                            setLedger(updated);
                            flash(`Logged "${episode.title}" in Upload Diversity Ledger.`);
                          }}
                          className="px-2 py-1 rounded bg-[#1f2a4a] hover:bg-[#2b3a66] text-[10px] font-semibold text-[#f2c85b] cursor-pointer"
                        >
                          Log Current
                        </button>
                        {ledger.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              clearPublishLedger();
                              setLedger([]);
                              flash('Cleared Upload Diversity Ledger.');
                            }}
                            className="px-2 py-1 rounded bg-white/5 hover:bg-rose-500/20 text-[10px] font-semibold text-[#9aa3bd] hover:text-rose-200 cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {ledger.length === 0 ? (
                      <div className="p-3 rounded-lg bg-[#0b0f1d] border border-white/8 text-[11px] text-[#8e97b0]">
                        No exports logged yet. Every Fast Render or WebM export is recorded here automatically so consecutive episodes stay visually distinct.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {ledger.slice(0, 6).map((entry) => (
                          <div
                            key={`${entry.id}_${entry.exportedAt}`}
                            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-[#0b0f1d] border border-white/8 text-[11px]"
                          >
                            <div className="min-w-0">
                              <div className="font-medium text-white truncate">{entry.title}</div>
                              <div className="text-[10px] text-[#8e97b0] truncate">
                                {entry.renderStyle.replace(/_/g, ' ')} ·{' '}
                                {entry.primaryStage.replace(/_/g, ' ')} · {entry.defaultRaag}
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-[#6e7794] shrink-0">
                              {new Date(entry.exportedAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-[#12172a] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">
                        YouTube Studio Disclosure &amp; Provenance Checklist
                      </span>
                      <button
                        type="button"
                        onClick={() => copyText('ypp_checklist', yppChecklist)}
                        className="text-[11px] text-[#f2c85b] inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'ypp_checklist' ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Copy Checklist</span>
                      </button>
                    </div>
                    <pre className="text-[10px] font-mono-tabular text-[#c5cee6] bg-[#0b0f1d] p-2.5 rounded max-h-44 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {yppChecklist}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 1: COLD OPEN & RETENTION AUDITOR (#5)                      */}
          {/* ============================================================== */}
          {tab === 'retention' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#13182b] border border-white/10 flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center font-extrabold shrink-0 ${
                      audit.score >= 85
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : audit.score >= 65
                          ? 'bg-amber-500/20 text-[#f2c85b] border border-[#f2c85b]/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                    }`}
                  >
                    <span className="text-2xl leading-none">{audit.score}</span>
                    <span className="text-[10px] uppercase tracking-wider mt-0.5">
                      Grade {audit.grade}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{episode.title}</div>
                    <div className="text-[11px] text-[#8e97b0] mt-0.5">
                      {episode.beats.length} scenes · {audit.totalDurationSec.toFixed(1)}s runtime
                    </div>
                    <div className="text-[11px] text-[#f2c85b] mt-1">
                      {audit.hasColdOpen ? 'Cold Open Active' : 'Missing Cold Open Hook'}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 p-4 rounded-xl bg-[#13182b] border border-white/10 flex flex-col justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-white">
                      One-Click YouTube Retention Optimizers
                    </div>
                    <p className="text-[11px] text-[#8e97b0] mt-0.5">
                      Fixes the two biggest viewer drop-off points: slow intros and static camera stretches over 4.4s.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        const next = autoInjectColdOpen(episode);
                        onApplyEpisode(next, 'Injected 3.4s Cold Open cliffhanger at Scene 1!');
                        flash('Cold Open cliffhanger hook injected at Scene 1!');
                      }}
                      className="h-9 px-3.5 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] text-[#110e0a] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Auto-Inject 3.4s Cold Open Hook</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = autoFixRetentionPacing(episode);
                        onApplyEpisode(next, 'Applied dynamic camera moves, shot variety & SFX pattern interrupts!');
                        flash('Pacing optimized! Static stretches and repeated shots resolved.');
                      }}
                      className="h-9 px-3.5 rounded-md bg-[#1c2542] hover:bg-[#263259] border border-white/12 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Activity className="w-3.5 h-3.5 text-[#f2c85b]" />
                      <span>Auto-Fix Pacing &amp; Pattern Interrupts</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-white">
                  Diagnostics ({audit.issues.length === 0 ? 'All Clear!' : `${audit.issues.length} Opportunities`})
                </div>
                {audit.issues.length === 0 ? (
                  <div className="p-4 rounded-lg bg-emerald-950/35 border border-emerald-500/30 text-xs text-emerald-200">
                    This episode scores {audit.score}/100 with a strong opening hook, varied camera rhythm, and audio punctuation. Ready to record!
                  </div>
                ) : (
                  audit.issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-3.5 rounded-lg bg-[#12172a] border border-white/10 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              issue.severity === 'high'
                                ? 'bg-rose-500/20 text-rose-300'
                                : issue.severity === 'medium'
                                  ? 'bg-amber-500/20 text-[#f2c85b]'
                                  : 'bg-sky-500/20 text-sky-300'
                            }`}
                          >
                            {issue.severity}
                          </span>
                          <span className="text-xs font-semibold text-white">{issue.title}</span>
                        </div>
                        <p className="text-[11px] text-[#9aa3bd] mt-1">{issue.detail}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Long-Form Mid-Roll Ad-Break Planner (shown for >= 7.5 min episodes) */}
              {audit.recommendedMidRolls.length > 0 && (
                <div className="p-4 rounded-xl bg-[#11172a] border border-emerald-400/25 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-emerald-300">
                        YouTube Mid-Roll Ad-Break Planner ({audit.recommendedMidRolls.length} Cliffhanger-Safe Slots)
                      </div>
                      <p className="text-[11px] text-[#8e97b0] mt-0.5">
                        {audit.totalDurationSec >= 480
                          ? 'Eligible for YouTube Mid-Roll Ads (≥ 8:00). Paste these Act-boundary timestamps in YouTube Studio -> Monetization -> Manage Mid-Rolls to maximize RPM without cutting dialogue.'
                          : 'Almost in the 8:00 Mid-Roll window! Add 1 short beat or Epilogue to unlock Mid-Roll ads at these natural pauses.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          'midrolls',
                          audit.recommendedMidRolls
                            .map((m) => `${m.formattedTime} — ${m.reason}`)
                            .join('\n')
                        )
                      }
                      className="h-7 px-2.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-[11px] font-semibold text-emerald-200 inline-flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'midrolls' ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Copy Mid-Rolls</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {audit.recommendedMidRolls.map((m, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-1.5 rounded bg-[#0b0f1d] border border-white/8 flex items-center gap-2 text-[11px]"
                      >
                        <span className="font-mono-tabular font-bold text-[#f2c85b] shrink-0">
                          {m.formattedTime}
                        </span>
                        <span className="text-[#c5cee6] truncate">{m.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: LONG-FORM COMPILATION & COZY BEDTIME STITCHER (#7)      */}
          {/* ============================================================== */}
          {tab === 'compile' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              <div className="lg:col-span-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white">
                    Select Episodes to Chain ({selectedIds.length} chosen)
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {vaultProjects.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIds(vaultProjects.map((vp) => `vault::${vp.id}`));
                          setAnthologyTitle('My Saved Episodes — Full Marathon');
                        }}
                        className="text-[11px] text-emerald-300 hover:underline cursor-pointer"
                      >
                        All Saved Vault ({vaultProjects.length})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIds(PRESET_EPISODES.slice(-6).map((e) => e.id));
                        setAnthologyTitle('World Folklore Marathon — 6 Continents');
                      }}
                      className="text-[11px] text-[#f2c85b] hover:underline cursor-pointer"
                    >
                      All 6 World Tales
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIds(PRESET_EPISODES.slice(0, 6).map((e) => e.id));
                        setAnthologyTitle('Indian Folklore Classics — Full Anthology');
                      }}
                      className="text-[11px] text-[#9aa3bd] hover:text-white cursor-pointer"
                    >
                      6 Indian Classics
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[370px] overflow-y-auto pr-1">
                  {anthologyCatalog.map((item) => {
                    const checked = selectedIds.includes(item.key);
                    const dur = item.episode.beats.reduce((s, b) => s + b.duration, 0);
                    return (
                      <label
                        key={item.key}
                        className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-colors ${
                          checked
                            ? 'bg-[#1b2442] border-[#f2c85b]/60'
                            : 'bg-[#12172a] border-white/10 hover:border-white/25'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedIds((prev) =>
                              prev.includes(item.key)
                                ? prev.filter((id) => id !== item.key)
                                : [...prev, item.key]
                            )
                          }
                          className="mt-0.5 accent-[#f2c85b]"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">
                            {item.episode.title}
                          </div>
                          <div className="text-[10px] text-[#8e97b0] truncate">
                            <span
                              className={
                                item.source === 'vault'
                                  ? 'text-emerald-300 font-semibold'
                                  : item.source === 'active'
                                    ? 'text-[#f2c85b] font-semibold'
                                    : ''
                              }
                            >
                              {item.label}
                            </span>{' '}
                            · {item.episode.beats.length} scenes · {formatYoutubeTime(dur)}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-3">
                <label className="block">
                  <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">
                    Anthology Title
                  </span>
                  <input
                    type="text"
                    value={anthologyTitle}
                    onChange={(e) => setAnthologyTitle(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
                  />
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg bg-[#13182b] border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bedtimeMode}
                    onChange={(e) => setBedtimeMode(e.target.checked)}
                    className="mt-0.5 accent-[#f2c85b]"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white inline-flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-[#f2c85b]" />
                      <span>Cozy Bedtime / Sleep Mode</span>
                    </div>
                    <div className="text-[10px] text-[#8e97b0] mt-0.5">
                      Applies warm candlelight grade, gentle fireflies, 18% slower pacing, and softer music curves.
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#13182b] border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBumpers}
                    onChange={(e) => setIncludeBumpers(e.target.checked)}
                    className="accent-[#f2c85b]"
                  />
                  <span className="text-xs text-white">Insert Chapter Bumper Slates between stories</span>
                </label>

                {compilationPreview && (
                  <div className="p-3 rounded-lg bg-[#0b0f1d] border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#f2c85b]">Auto YouTube Timestamps</span>
                      <span className="font-mono-tabular text-white">
                        {formatYoutubeTime(compilationPreview.totalDurationSec)} total ·{' '}
                        {compilationPreview.episode.beats.length} scenes
                      </span>
                    </div>
                    <div className="max-h-28 overflow-y-auto font-mono-tabular text-[10px] text-[#c5cee6] space-y-0.5">
                      {compilationPreview.timestamps.map((ts) => (
                        <div key={ts.chapterNum} className="truncate">
                          {ts.formattedTime} — {ts.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!compilationPreview || loadingAnthology}
                  onClick={() => void handleLoadCompiledAnthology()}
                  className="w-full h-10 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] disabled:opacity-40 text-[#110e0a] text-xs font-bold cursor-pointer"
                >
                  {loadingAnthology
                    ? 'Stitching Anthology & Carrying Over Vault Voices...'
                    : 'Load Compiled Anthology onto Stage (Preserves Saved Voices)'}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: MULTI-LANGUAGE DUBBING & LOCALIZATION (#4)              */}
          {/* ============================================================== */}
          {tab === 'localize' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-3 p-4 rounded-xl bg-[#13182b] border border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-[#f2c85b]">
                    Multi-Language Build &amp; Dubbing (19 Global &amp; Indian Languages)
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#18223d] border border-[#60a5fa]/35 text-[10px] font-semibold text-[#bfdbfe] whitespace-nowrap">
                    Active: {activeEpisodeLang.nativeName} ({activeEpisodeLang.bcp47}
                    {activeEpisodeLang.dir === 'rtl' ? ' · RTL' : ''})
                  </span>
                </div>
                <p className="text-[11px] text-[#8e97b0] leading-relaxed">
                  Translates episode title, cast names, chapter cards, speaker labels, and dialogue into any of 19 scripts (including Devanagari, Tamil, Telugu, Bengali, Arabic/Urdu RTL, Japanese, Korean &amp; Chinese) with automatic Noto typography, RTL layout, and CJK spoken-duration timing.
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  <label className="block">
                    <span className="block text-[11px] text-[#8e97b0] mb-1">Target Language (19)</span>
                    <select
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      className="w-full h-9 px-2 rounded-md bg-[#0e1324] border border-white/12 text-xs text-white"
                    >
                      {TARGET_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.label} ({l.nativeName}
                          {l.dir === 'rtl' ? ' · RTL' : ''})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="block text-[11px] text-[#8e97b0] mb-1">Translator Engine</span>
                    <select
                      value={locProvider}
                      onChange={(e) =>
                        setLocProvider(e.target.value as 'gemini' | 'openai' | 'anthropic' | 'ollama')
                      }
                      className="w-full h-9 px-2 rounded-md bg-[#0e1324] border border-white/12 text-xs text-white"
                    >
                      <option value="gemini">
                        Gemini 2.5 Flash {llmStatus.gemini ? '(Ready)' : '(Add Key)'}
                      </option>
                      <option value="openai">
                        OpenAI GPT-4o Mini {llmStatus.openai ? '(Ready)' : '(Add Key)'}
                      </option>
                      <option value="anthropic">
                        Claude 3.5 Sonnet {llmStatus.anthropic ? '(Ready)' : '(Add Key)'}
                      </option>
                      <option value="ollama">Local Ollama (Free, Zero Key)</option>
                    </select>
                  </label>
                </div>

                {locProvider === 'ollama' && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={ollamaUrl}
                      onChange={(e) => setOllamaUrl(e.target.value)}
                      placeholder="http://localhost:11434/api/chat"
                      className="h-8 px-2 rounded-md bg-[#0e1324] border border-white/12 text-[11px] text-white"
                    />
                    <input
                      type="text"
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      placeholder="llama3.1 / qwen2.5"
                      className="h-8 px-2 rounded-md bg-[#0e1324] border border-white/12 text-[11px] text-white"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={translating}
                    onClick={handleAiTranslate}
                    className="flex-1 h-9 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] disabled:opacity-50 text-[#110e0a] text-xs font-bold cursor-pointer"
                  >
                    {translating
                      ? translateProgress || 'Translating Episode...'
                      : episode.beats.length > 26
                        ? `Translate Long-Form (${episode.beats.length} Scenes, Auto-Chunked)`
                        : 'Translate Episode Now'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const langObj = TARGET_LANGUAGES.find((l) => l.code === targetLang) || TARGET_LANGUAGES[0];
                      onApplyEpisode(
                        { ...episode, language: langObj.code },
                        `Switched stage typography & TTS locale to ${langObj.label} (${langObj.nativeName})`
                      );
                      flash(`Stage rendering, cards & TTS locale set to ${langObj.label} (${langObj.nativeName}).`);
                    }}
                    className="h-9 px-3 rounded-md bg-[#182925] hover:bg-[#203833] border border-[#4ade80]/30 text-xs font-semibold text-[#bbf7d0] cursor-pointer"
                    title="Set episode language metadata immediately without running AI translation (great if you already wrote dialogue manually)"
                  >
                    Set Stage Locale Only
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenVoiceTab();
                    }}
                    className="h-9 px-3 rounded-md bg-[#1d2745] hover:bg-[#27355c] text-xs font-semibold text-white cursor-pointer"
                  >
                    Open Voice Studio
                  </button>
                </div>
              </div>

              {/* Zero-Key Manual Translation JSON Workflow */}
              <div className="space-y-2.5 p-4 rounded-xl bg-[#13182b] border border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white">
                    Zero-Key Offline Translation JSON
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        'trans_export',
                        JSON.stringify(extractLocalizationPayload(episode), null, 2)
                      )
                    }
                    className="h-7 px-2.5 rounded bg-[#1e2745] hover:bg-[#29355c] text-[11px] font-semibold text-[#f2c85b] inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'trans_export' ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Copy Dialogue JSON</span>
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={manualTransJson}
                  onChange={(e) => setManualTransJson(e.target.value)}
                  placeholder="Paste translated JSON here (from any external translator or LLM) and click Apply..."
                  className="w-full p-2.5 rounded-md bg-[#090c16] border border-white/12 font-mono-tabular text-[11px] text-[#d9e2f5] resize-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(manualTransJson);
                      const next = applyLocalizedPayload(episode, parsed, targetLang);
                      onApplyEpisode(next, 'Applied translated dialogue JSON!');
                      flash('Localized dialogue applied cleanly!');
                    } catch {
                      flash('Invalid JSON pasted—please paste the translated dialogue JSON object.');
                    }
                  }}
                  className="w-full h-8 rounded-md bg-[#1d2745] hover:bg-[#28365e] text-xs font-semibold text-white cursor-pointer"
                >
                  Apply Pasted Translation JSON
                </button>
              </div>

              {/* Upgrade 6: Batch Multi-Language Audio (MLA) Packager */}
              <div className="lg:col-span-2 p-4 rounded-xl bg-[#111629] border border-[#f2c85b]/25 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-[#f2c85b]">
                      Batch YouTube Multi-Language Audio (MLA) &amp; Subtitles Packager
                    </div>
                    <div className="text-[11px] text-[#8e97b0]">
                      Select multiple languages to batch-translate and bundle synced .SRT subtitles, .JSON scripts, localized YouTube Launch Packs, and optional offline .WAV audio mixes into one ready-to-upload ZIP.
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      className={`inline-flex items-center gap-1.5 text-[11px] ${
                        isLongFormForWav && !llmStatus.ffmpeg
                          ? 'text-slate-500 cursor-not-allowed'
                          : 'text-slate-300 cursor-pointer'
                      }`}
                      title={
                        isLongFormForWav
                          ? llmStatus.ffmpeg
                            ? 'Renders chapters sequentially & stitches into broadcast -14 LUFS .M4A via Server FFmpeg (RAM-safe for 10–25 min epics!)'
                            : 'Install FFmpeg on the server to enable chapter-chunked audio tracks on >4 min episodes.'
                          : 'Render offline soundtrack WAV mixes for each language'
                      }
                    >
                      <input
                        type="checkbox"
                        disabled={isLongFormForWav && !llmStatus.ffmpeg}
                        checked={mlaIncludeWav && (!isLongFormForWav || llmStatus.ffmpeg)}
                        onChange={(e) => setMlaIncludeWav(e.target.checked)}
                        className="accent-[#f2c85b]"
                      />
                      <span>
                        {isLongFormForWav
                          ? llmStatus.ffmpeg
                            ? 'Include Long-Form Chapter-Stitched .M4A (-14 LUFS)'
                            : 'Audio skipped (>4m requires Server FFmpeg)'
                          : 'Include Offline .WAV Mixes'}
                      </span>
                    </label>

                    {mlaIncludeWav && (!isLongFormForWav || llmStatus.ffmpeg) && (
                      <label
                        className="inline-flex items-center gap-1.5 text-[11px] text-[#f7e7bc] cursor-pointer"
                        title="Calls Cloud AI TTS with expression-matched prosody for every spoken scene in each target language before mixing!"
                      >
                        <input
                          type="checkbox"
                          checked={mlaAutoDubVoices}
                          onChange={(e) => setMlaAutoDubVoices(e.target.checked)}
                          className="accent-[#f2c85b]"
                        />
                        <span>Auto-Dub Voices via Cloud TTS</span>
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {TARGET_LANGUAGES.map((l) => {
                    const active = mlaLangs.includes(l.code);
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() =>
                          setMlaLangs((prev) =>
                            prev.includes(l.code) ? prev.filter((c) => c !== l.code) : [...prev, l.code]
                          )
                        }
                        className={`px-2 py-1 rounded text-[11px] font-medium border cursor-pointer transition ${
                          active
                            ? 'bg-[#2a2315] border-[#f2c85b] text-[#f2c85b]'
                            : 'bg-[#0c1020] border-white/10 text-[#9aa3bd] hover:text-white'
                        }`}
                      >
                        {l.label} ({l.nativeName})
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={mlaBusy || mlaLangs.length === 0}
                    onClick={() => void handleBuildMlaPack()}
                    className="h-9 px-4 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] disabled:opacity-50 text-[#110e0a] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {mlaBusy
                        ? mlaProgress || 'Building MLA Pack...'
                        : `Build YouTube MLA ZIP (${mlaLangs.length} + Base)`}
                    </span>
                  </button>
                  {mlaBusy && (
                    <button
                      type="button"
                      onClick={() => {
                        mlaCancelRef.current = true;
                      }}
                      className="h-9 px-3 rounded-md bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 text-xs font-semibold cursor-pointer"
                    >
                      Cancel Batch
                    </button>
                  )}
                </div>

                {/* Upgrade 8: Multi-Language Dub Timing & Frame-Accurate Caption / MLA Manifest Exporter */}
                {(() => {
                  const dubPlan = computeDubTimingPlan(episode, episode, episode.language || targetLang);
                  return (
                    <div className="pt-3 mt-2 border-t border-white/10 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-[11px] font-semibold text-white">
                            Dub Timing Alignment &amp; Synced Track Export ({dubPlan.averageSpeechRate.toFixed(2)}× avg rate)
                          </div>
                          <div className="text-[10px] text-[#8e97b0]">
                            Per-beat TTS speed targets (0.85×–1.25×) keep dubbed tracks frame-locked to master cuts
                            {dubPlan.tightFitBeats > 0 ? ` · ${dubPlan.tightFitBeats} tight beat(s)` : ' · all beats aligned'}.
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              downloadTextFile(
                                `${episode.id}_synced.srt`,
                                generateSyncedSrt(episode, episode)
                              );
                              flash('Exported cut-locked .SRT captions.');
                            }}
                            className="h-7 px-2.5 rounded bg-[#182038] hover:bg-[#222e4f] border border-white/12 text-[10px] font-semibold text-[#eef1f8] cursor-pointer"
                          >
                            Synced .SRT
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              downloadTextFile(
                                `${episode.id}_synced.vtt`,
                                generateSyncedWebVtt(episode, episode)
                              );
                              flash('Exported WebVTT (.vtt) with speaker tags.');
                            }}
                            className="h-7 px-2.5 rounded bg-[#182038] hover:bg-[#222e4f] border border-white/12 text-[10px] font-semibold text-[#eef1f8] cursor-pointer"
                          >
                            WebVTT (.VTT)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              downloadTextFile(
                                `${episode.id}_chapters.txt`,
                                generateYouTubeChaptersText(episode)
                              );
                              flash('Exported YouTube chapters.');
                            }}
                            className="h-7 px-2.5 rounded bg-[#182038] hover:bg-[#222e4f] border border-white/12 text-[10px] font-semibold text-[#eef1f8] cursor-pointer"
                          >
                            Chapters .TXT
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const zipBytes = buildDubSyncPackageZipBytes(episode, []);
                              const ab = new ArrayBuffer(zipBytes.byteLength);
                              new Uint8Array(ab).set(zipBytes);
                              const blob = new Blob([ab], { type: 'application/zip' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${episode.id}_dub_sync_mla_manifest.zip`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              window.setTimeout(() => URL.revokeObjectURL(url), 4000);
                              flash('Downloaded Dub Sync & MLA Track Manifest ZIP!');
                            }}
                            className="h-7 px-2.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/35 text-[10px] font-bold text-emerald-200 cursor-pointer"
                          >
                            MLA Manifest ZIP
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {dubPlan.beats.slice(0, 10).map((b) => (
                          <span
                            key={b.beatId}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono-tabular border ${
                              b.status === 'tight_fit'
                                ? 'bg-amber-500/15 border-amber-400/35 text-amber-200'
                                : 'bg-[#0b0f1d] border-white/10 text-[#b4c0dc]'
                            }`}
                            title={`${b.beatTitle}: natural ${b.naturalDubDurationSec}s vs cut ${b.masterDurationSec}s`}
                          >
                            B{b.beatIdx + 1}: {b.speechRate.toFixed(2)}×
                          </span>
                        ))}
                        {dubPlan.beats.length > 10 && (
                          <span className="text-[9px] text-[#7c87a3] self-center">
                            +{dubPlan.beats.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4B: SEASON / SERIES PRODUCTION BOARD & RECAP GENERATOR     */}
          {/* ============================================================== */}
          {tab === 'season' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#13182b] border border-white/10">
                <div>
                  <div className="text-xs font-semibold text-[#f2c85b]">
                    Season &amp; Series Production Board ({seasonCards.length} Tracked Episodes)
                  </div>
                  <div className="text-[11px] text-[#8e97b0] mt-0.5">
                    Track your channel pipeline from Idea to Published, and inject 1-click &ldquo;Previously On...&rdquo; cold-open recap beats to boost multi-episode binge watch time.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = upsertEpisodeInSeasonBoard(seasonCards, episode, voiceClipCount > 0 ? 'voiced' : 'scripted');
                    setSeasonCards(next);
                    flash(`Tracked "${episode.title}" on the Season Production Board.`);
                  }}
                  className="h-9 px-3.5 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] text-[#110e0a] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Track Current Episode</span>
                </button>
              </div>

              {seasonCards.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-white/12 bg-[#101526] text-center space-y-2">
                  <div className="text-xs font-semibold text-white">No episodes tracked on your Season Board yet</div>
                  <p className="text-[11px] text-[#8e97b0] max-w-md mx-auto">
                    Click &ldquo;Track Current Episode&rdquo; above to log this episode into your Season slate. Once two or more episodes are tracked, you can inject 1-click &ldquo;Previously On...&rdquo; recaps between episodes.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {seasonCards.map((card) => (
                    <div
                      key={card.id}
                      className="p-3.5 rounded-xl bg-[#12172a] border border-white/10 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#f2c85b]">
                            Ep {card.episodeNumber} · {card.series} · {card.language.toUpperCase()}
                          </div>
                          <div className="text-xs font-bold text-white truncate">{card.title}</div>
                          <div className="text-[10px] text-[#8e97b0]">
                            {card.beatCount} beats · {card.durationSec}s
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSeasonCards(removeCardFromSeasonBoard(seasonCards, card.id))}
                          className="p-1 rounded text-[#8e97b0] hover:text-rose-300 hover:bg-rose-500/15 cursor-pointer"
                          title="Remove from board"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {PRODUCTION_STATUS_ORDER.map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setSeasonCards(advanceCardStatus(seasonCards, card.id, st))}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition ${
                              card.status === st
                                ? 'bg-[#f2c85b] text-[#110e0a]'
                                : 'bg-[#0b0f1d] text-[#9aa3bd] hover:text-white border border-white/8'
                            }`}
                          >
                            {PRODUCTION_STATUS_LABELS[st]}
                          </button>
                        ))}
                      </div>

                      <div className="text-[11px] text-[#b4c0dc] line-clamp-2 bg-[#0b0f1d] rounded p-2 border border-white/6">
                        {card.recapSummary}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const recapBeat = buildPreviouslyOnRecapBeat(card, episode);
                          const nextEp: EpisodeScript = {
                            ...episode,
                            beats: [recapBeat, ...episode.beats],
                          };
                          onApplyEpisode(
                            nextEp,
                            `Injected "Previously On: Ep ${card.episodeNumber}" cold-open recap at Scene 1!`
                          );
                          flash(`Prepended "Previously On: ${card.title}" recap scene!`);
                        }}
                        className="w-full h-8 rounded-md bg-[#1d2745] hover:bg-[#28365e] text-[11px] font-semibold text-[#f2c85b] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Inject &ldquo;Previously On...&rdquo; Recap into Current Episode</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: PERSISTENT CHANNEL CAST BIBLE & RECURRING HOST (#9)     */}
          {/* ============================================================== */}
          {tab === 'bible' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#13182b] border border-white/10">
                <div>
                  <div className="text-xs font-semibold text-[#f2c85b]">
                    Channel Universe Cast Bible ({bible.length} Locked Characters)
                  </div>
                  <div className="text-[11px] text-[#8e97b0]">
                    Guarantees returning heroes look identical across every episode—plus lets you bookend episodes with your Recurring Storyteller Host.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const { episode: synced, matchedCount } = applyCastBibleToEpisode(
                        episode,
                        bible
                      );
                      onApplyEpisode(
                        synced,
                        `Synced ${matchedCount} character(s) with Channel Cast Bible!`
                      );
                      flash(
                        matchedCount > 0
                          ? `Locked palette & headgear synced onto ${matchedCount} cast member(s)!`
                          : 'No matching character names in this episode yet—save any cast member below first!'
                      );
                    }}
                    className="h-8 px-3 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] text-[#110e0a] text-xs font-bold cursor-pointer"
                  >
                    Sync Bible to Current Episode
                  </button>
                  {hostEntry && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = injectChannelHostBookends(episode, hostEntry);
                        onApplyEpisode(next, `Injected ${hostEntry.member.name} Intro & Outro!`);
                        flash(`Added ${hostEntry.member.name} fireside Intro & Sign-Off scenes!`);
                      }}
                      className="h-8 px-3 rounded-md bg-[#1d2745] hover:bg-[#28365e] text-white text-xs font-semibold cursor-pointer"
                    >
                      Inject Host Intro &amp; Outro
                    </button>
                  )}
                </div>
              </div>

              {/* Save current episode's characters into the Bible */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-[#8e97b0] uppercase tracking-wider">
                  Save From Current Episode Into Bible
                </div>
                <div className="flex flex-wrap gap-2">
                  {episode.cast.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        const next = upsertMemberInBible(bible, c, `${episode.series} cast`);
                        setBible(next);
                        flash(`Locked "${c.name}" into your persistent Channel Cast Bible!`);
                      }}
                      className="px-2.5 py-1.5 rounded-md bg-[#141a2e] hover:bg-[#1e2745] border border-white/10 text-xs text-white inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: c.primaryColor }}
                      />
                      <Plus className="w-3 h-3 text-[#f2c85b]" />
                      <span>Save {c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Saved Bible Roster */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {bible.map((entry) => (
                  <div
                    key={entry.key}
                    className="p-3 rounded-lg bg-[#12172a] border border-white/10 flex items-start justify-between gap-2.5"
                  >
                    <AssetThumb
                      kind="member"
                      id={entry.key}
                      member={{ id: entry.key, ...entry.member }}
                      className="w-14 h-11 rounded bg-[#080b16] border border-white/10 shrink-0 block object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/25"
                          style={{ backgroundColor: entry.member.primaryColor }}
                        />
                        <span className="text-xs font-semibold text-white truncate">
                          {entry.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#f2c85b] mt-0.5 truncate">
                        {entry.member.dna
                          ? `DNA · ${entry.member.dna.chassis}`
                          : entry.member.archetype}
                        {entry.preferredVoice ? ` · ${entry.preferredVoice}` : ''}
                      </div>
                      <div className="text-[10px] text-[#8e97b0] mt-0.5 line-clamp-2">
                        {entry.roleNote}
                      </div>
                    </div>
                    {!entry.isHost && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = bible.filter((b) => b.key !== entry.key);
                          setBible(next);
                          saveCastBible(next);
                        }}
                        className="p-1 text-[#6e7794] hover:text-rose-400 cursor-pointer shrink-0"
                        title="Remove from Bible"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: YOUTUBE LAUNCH PACKAGER (#10) & BATCH MP4 (#1)          */}
          {/* ============================================================== */}
          {tab === 'launch' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left: Titles, Description, Tags, Community Poll, SRT Download */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#f2c85b]">
                    YouTube Launch Pack · Ready to Upload
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        downloadTextFile(`${episode.id}_captions.srt`, launchPack.srtContent)
                      }
                      className="h-8 px-3 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] text-[#110e0a] text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .SRT</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const fullTxt = [
                          '=== 5 HIGH-CTR TITLES ===',
                          ...launchPack.titles.map((t, i) => `${i + 1}. ${t}`),
                          '',
                          '=== DESCRIPTION & CHAPTERS ===',
                          launchPack.description,
                          ...(launchPack.midRollTimestampsText
                            ? [
                                '',
                                '=== RECOMMENDED YOUTUBE MID-ROLL AD BREAKS (CLIFFHANGER-SAFE) ===',
                                launchPack.midRollTimestampsText,
                              ]
                            : []),
                          '',
                          '=== SEO TAGS ===',
                          launchPack.tags.join(', '),
                          '',
                          '=== PINNED COMMENT ===',
                          launchPack.pinnedComment,
                          '',
                          '=== COMMUNITY TAB POLL ===',
                          launchPack.communityPoll.question,
                          ...launchPack.communityPoll.options.map((o) => `- ${o}`),
                          '',
                          launchPack.yppChecklistText,
                        ].join('\n');
                        downloadTextFile(`${episode.id}_youtube_launch_pack.txt`, fullTxt);
                      }}
                      className="h-8 px-3 rounded-md bg-[#1c2542] hover:bg-[#27345b] text-white text-[11px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Full Launch Pack (.txt)</span>
                    </button>
                  </div>
                </div>

                {/* 5 High-CTR Title Options */}
                <div className="p-3 rounded-lg bg-[#12172a] border border-white/10 space-y-1.5">
                  <div className="text-[11px] font-semibold text-white">5 High-CTR Title Options</div>
                  {launchPack.titles.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 text-[11px] text-[#dce4f7] bg-[#0b0f1d] px-2.5 py-1.5 rounded"
                    >
                      <span className="truncate">{t}</span>
                      <button
                        type="button"
                        onClick={() => copyText(`title_${i}`, t)}
                        className="text-[#f2c85b] shrink-0 cursor-pointer"
                        title="Copy title"
                      >
                        {copiedKey === `title_${i}` ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Description + Chapters */}
                <div className="p-3 rounded-lg bg-[#12172a] border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-white">
                      Description &amp; Auto-Timed Chapters
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText('desc', launchPack.description)}
                      className="text-[11px] text-[#f2c85b] inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'desc' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Description</span>
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono-tabular text-[#c5cee6] bg-[#0b0f1d] p-2.5 rounded max-h-36 overflow-y-auto whitespace-pre-wrap">
                    {launchPack.description}
                  </pre>
                </div>

                {launchPack.midRollTimestampsText && (
                  <div className="p-3 rounded-lg bg-[#11172a] border border-emerald-400/25 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-emerald-300">
                        Recommended Mid-Roll Ad Breaks (Long-Form)
                      </span>
                      <button
                        type="button"
                        onClick={() => copyText('launch_midrolls', launchPack.midRollTimestampsText)}
                        className="text-[11px] text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'launch_midrolls' ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Copy Mid-Rolls</span>
                      </button>
                    </div>
                    <pre className="text-[10px] font-mono-tabular text-[#c5cee6] bg-[#0b0f1d] p-2 rounded max-h-28 overflow-y-auto whitespace-pre-wrap">
                      {launchPack.midRollTimestampsText}
                    </pre>
                  </div>
                )}
              </div>

              {/* Right: Pinned Comment + Community Poll + Upgrade #1 Broadcast MP4 Converter & Offline CLI */}
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-[#12172a] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-white">
                      Pinned Comment Riddle &amp; Community Poll
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText('comment', launchPack.pinnedComment)}
                      className="text-[11px] text-[#f2c85b] inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'comment' ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Copy Pin</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[#dce4f7] bg-[#0b0f1d] p-2.5 rounded leading-relaxed">
                    {launchPack.pinnedComment}
                  </p>
                  <div className="text-[11px] text-[#f2c85b] font-semibold pt-1">
                    Poll: {launchPack.communityPoll.question}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {launchPack.communityPoll.options.map((opt, idx) => (
                      <div
                        key={idx}
                        className="px-2 py-1 rounded bg-[#0b0f1d] text-[10px] text-[#9aa3bd] truncate"
                      >
                        • {opt}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upgrade #1: Broadcast H.264 MP4 (-14 LUFS) Transcoder & Offline Batch CLI */}
                <div className="p-3.5 rounded-lg bg-[#13182b] border border-[#f2c85b]/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white inline-flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-[#f2c85b]" />
                      <span>Broadcast H.264 MP4 (-14 LUFS) &amp; Offline Batch CLI</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        llmStatus.ffmpeg
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/15 text-[#f2c85b]'
                      }`}
                    >
                      FFmpeg {llmStatus.ffmpeg ? 'Ready' : 'Local CLI'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8e97b0] leading-relaxed">
                    Convert any recorded <span className="text-white">.webm</span> into a YouTube-native 1080p60 H.264 <span className="text-white">.mp4</span> with EBU R128 <span className="text-white">-14 LUFS</span> loudness normalization—or run the included offline batch CLI across dozens of JSON episodes overnight.
                  </p>
                  <input
                    ref={webmFileRef}
                    type="file"
                    accept=".webm,video/webm"
                    onChange={handleConvertWebmToMp4}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={convertingMp4}
                    onClick={() => webmFileRef.current?.click()}
                    className="w-full h-9 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] disabled:opacity-50 text-[#110e0a] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {convertingMp4
                        ? 'Transcoding H.264 MP4 (-14 LUFS)...'
                        : 'Convert Recorded .WebM -> Broadcast .MP4'}
                    </span>
                  </button>
                  <div className="p-2 rounded bg-[#090c16] border border-white/10 font-mono-tabular text-[10px] text-[#9ec2ff] overflow-x-auto">
                    node scripts/render-batch.mjs ../04_ai_director_kit_and_episodes/*.json --out ./renders
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
