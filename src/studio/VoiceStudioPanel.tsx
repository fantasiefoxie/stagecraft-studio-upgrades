import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Mic,
  Square,
  Upload,
  Sparkles,
  Volume2,
  Download,
  Server,
  Laptop,
  Check,
  AlertCircle,
  Music,
  Globe,
  Layers,
  Scissors,
} from 'lucide-react';
import {
  CharacterVoiceAssignment,
  CloudTtsProviderId,
  EpisodeScript,
  StoryBeat,
  VoiceSourceMode,
  VoiceStudioSettings,
} from './types';
import { resolveEpisodeLanguage } from './i18n';
import {
  CAST_BIBLE_UPDATED_EVENT,
  loadCastBible,
  saveCastBible,
} from './castBible';
import { partitionEpisodeIntoChapters } from './longFormEngine';
import { buildExpressiveTtsProsody } from './facialExpressions';
import { trimAndNormalizeVoiceBlob } from './voiceEnvelope';
import { TeleprompterModal } from './TeleprompterModal';

export const CAST_VOICES_STORAGE_KEY = 'katha_studio_cast_voices_v1';

function loadSavedCastVoices(): Record<string, CharacterVoiceAssignment> {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(CAST_VOICES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, CharacterVoiceAssignment>;
  } catch {
    return {};
  }
}

function saveCastVoicesToStorage(map: Record<string, CharacterVoiceAssignment>): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(CAST_VOICES_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota errors
  }
}

interface ServerTtsStatus {
  gemini: boolean;
  openai: boolean;
  elevenlabs: boolean;
  custom_server: boolean;
}

interface VoiceStudioPanelProps {
  episode: EpisodeScript;
  selectedBeat: StoryBeat;
  selectedBeatIdx: number;
  voiceMeta: Record<string, { fileName: string; duration: number }>;
  onBindVoiceBlob: (
    beatId: string,
    blob: Blob,
    fileName: string,
    autoSyncDuration: boolean
  ) => Promise<void>;
  onClearVoiceClip: (beatId: string) => void;
  onTriggerSingleUpload: () => void;
  onTriggerBatchUpload: () => void;
  musicStemMeta?: { fileName: string; duration: number } | null;
  onUploadMusicStem?: (file: File) => Promise<void>;
  onClearMusicStem?: () => void;
  onTightenAllVoices?: () => Promise<{ trimmedCount: number; savedSec: number }>;
  onOpenVoiceBooth?: () => void;
}

const PROVIDER_MODELS: Record<CloudTtsProviderId, string[]> = {
  gemini: ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts'],
  openai: ['gpt-4o-mini-tts', 'tts-1', 'tts-1-hd'],
  elevenlabs: ['eleven_multilingual_v2', 'eleven_flash_v2_5'],
  custom_server: ['tts-1', 'kokoro', 'piper'],
};

const PROVIDER_VOICE_SUGGESTIONS: Record<CloudTtsProviderId | 'local_tts', string[]> = {
  gemini: ['Charon', 'Fenrir', 'Puck', 'Kore', 'Zephyr'],
  openai: ['onyx', 'alloy', 'echo', 'fable', 'nova', 'shimmer'],
  elevenlabs: ['JBFqnCBsd6RMkjVDRZzb', 'EXAVITQu4vr4xnSDxMaL', 'TX3LPaxmHKxFdv7VOQHJ'],
  custom_server: ['alloy', 'am_michael', 'af_heart', 'bm_george'],
  local_tts: ['am_michael', 'bm_george', 'af_heart', 'am_adam', 'bf_emma'],
};

function defaultVoiceForCharacter(
  id: string,
  index: number,
  providerKey: CloudTtsProviderId | 'local_tts'
): CharacterVoiceAssignment {
  const pool = PROVIDER_VOICE_SUGGESTIONS[providerKey] || PROVIDER_VOICE_SUGGESTIONS.gemini;
  if (id === 'narrator') {
    return {
      voiceId: pool[0],
      style: 'Warm, cinematic Indian storyteller with clear dramatic pacing',
    };
  }
  return {
    voiceId: pool[(index + 1) % pool.length],
    style: 'Expressive character voice matching the scene emotion',
  };
}

export const VoiceStudioPanel: React.FC<VoiceStudioPanelProps> = ({
  episode,
  selectedBeat,
  selectedBeatIdx,
  voiceMeta,
  onBindVoiceBlob,
  onClearVoiceClip,
  onTriggerSingleUpload,
  onTriggerBatchUpload,
  musicStemMeta = null,
  onUploadMusicStem,
  onClearMusicStem,
  onTightenAllVoices,
  onOpenVoiceBooth,
}) => {
  const stemInputRef = useRef<HTMLInputElement>(null);
  const [boothOpen, setBoothOpen] = useState(false);
  const [settings, setSettings] = useState<VoiceStudioSettings>({
    source: 'cloud_tts',
    cloudProvider: 'gemini',
    cloudModel: 'gemini-3.8-flash-lite-tts',
    localEndpoint: 'http://localhost:8880/v1/audio/speech',
    localModel: 'kokoro',
    speed: 1.0,
    browserVoiceUri: '',
    autoSyncDuration: true,
  });

  const [serverStatus, setServerStatus] = useState<ServerTtsStatus>({
    gemini: false,
    openai: false,
    elevenlabs: false,
    custom_server: false,
  });
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [castVoices, setCastVoices] = useState<Record<string, CharacterVoiceAssignment>>(() =>
    loadSavedCastVoices()
  );
  const [bibleVersion, setBibleVersion] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onBibleUpdate = () => setBibleVersion((v) => v + 1);
    window.addEventListener(CAST_BIBLE_UPDATED_EVENT, onBibleUpdate);
    return () => window.removeEventListener(CAST_BIBLE_UPDATED_EVENT, onBibleUpdate);
  }, []);

  // Live microphone recording state
  const [isMicRecording, setIsMicRecording] = useState(false);
  const [micSeconds, setMicSeconds] = useState(0);
  const micRecorderRef = useRef<MediaRecorder | null>(null);
  const micChunksRef = useRef<Blob[]>([]);
  const micTimerRef = useRef<number | null>(null);

  // Generation progress & feedback
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const cancelBatchRef = useRef(false);

  // Query configured server-side TTS providers (booleans only)
  useEffect(() => {
    fetch('/api/tts/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data === 'object') {
          setServerStatus({
            gemini: Boolean(data.gemini),
            openai: Boolean(data.openai),
            elevenlabs: Boolean(data.elevenlabs),
            custom_server: Boolean(data.custom_server),
          });
        }
      })
      .catch(() => {});
  }, []);

  const episodeLang = useMemo(() => resolveEpisodeLanguage(episode), [episode]);
  const [skipAlreadyVoiced, setSkipAlreadyVoiced] = useState(true);
  const [autoExpressiveProsody, setAutoExpressiveProsody] = useState(true);
  const [autoTrimSilence, setAutoTrimSilence] = useState(true);
  const chapters = useMemo(() => partitionEpisodeIntoChapters(episode, 200), [episode]);
  const currentChapter = useMemo(
    () =>
      chapters.find(
        (c) => selectedBeatIdx >= c.startBeatIdx && selectedBeatIdx <= c.endBeatIdx
      ) || chapters[0],
    [chapters, selectedBeatIdx]
  );

  // Load browser SpeechSynthesis voices for zero-cost offline preview
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      setBrowserVoices(list);
      if (list.length > 0) {
        const langMatch = list.find((v) =>
          v.lang.toLowerCase().startsWith(episodeLang.code.toLowerCase())
        );
        setSettings((prev) => ({
          ...prev,
          browserVoiceUri: langMatch ? langMatch.voiceURI : prev.browserVoiceUri || list[0].voiceURI,
        }));
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [episodeLang.code]);

  const speakerList = useMemo(
    () => [
      { id: 'narrator', name: 'Narrator', role: 'Storyteller' },
      ...episode.cast.map((c) => ({ id: c.id, name: c.name, role: c.archetype.replace('_', ' ') })),
    ],
    [episode.cast]
  );

  const activePoolKey: CloudTtsProviderId | 'local_tts' =
    settings.source === 'local_tts' ? 'local_tts' : settings.cloudProvider;

  const getVoiceForSpeaker = (speakerId: string): CharacterVoiceAssignment => {
    const existing = castVoices[speakerId];
    if (existing) return existing;
    // Check Channel Cast Bible preferredVoice by character name so recurring heroes keep their signature voice
    const speaker = speakerList.find((s) => s.id === speakerId);
    if (speaker) {
      const bible = loadCastBible();
      const nameKey = speaker.name.trim().toLowerCase();
      const match = bible.find(
        (b) =>
          (speakerId === 'channel_host' && b.isHost) ||
          b.key === nameKey ||
          nameKey.includes(b.key) ||
          b.key.includes(nameKey)
      );
      if (match?.preferredVoice) {
        return {
          voiceId: match.preferredVoice,
          style: `Consistent signature voice for ${speaker.name}`,
        };
      }
    }
    const idx = speakerList.findIndex((s) => s.id === speakerId);
    return defaultVoiceForCharacter(speakerId, Math.max(0, idx), activePoolKey);
  };

  // Re-evaluate Cast Bible voices if Bible updates
  void bibleVersion;

  const updateCastVoice = (speakerId: string, patch: Partial<CharacterVoiceAssignment>) => {
    setCastVoices((prev) => {
      const nextEntry = { ...getVoiceForSpeaker(speakerId), ...patch };
      const next = { ...prev, [speakerId]: nextEntry };
      saveCastVoicesToStorage(next);

      // Keep matching Cast Bible member's preferredVoice in sync automatically
      if (patch.voiceId) {
        const speaker = speakerList.find((s) => s.id === speakerId);
        if (speaker) {
          const bible = loadCastBible();
          const nameKey = speaker.name.trim().toLowerCase();
          let changed = false;
          const updatedBible = bible.map((entry) => {
            if (
              (speakerId === 'channel_host' && entry.isHost) ||
              entry.key === nameKey ||
              nameKey.includes(entry.key)
            ) {
              changed = true;
              return { ...entry, preferredVoice: patch.voiceId };
            }
            return entry;
          });
          if (changed) saveCastBible(updatedBible);
        }
      }
      return next;
    });
  };

  // Switch cloud provider cleanly and snap to its default model + suggested voices
  const handleSelectCloudProvider = (provider: CloudTtsProviderId) => {
    setSettings((prev) => ({
      ...prev,
      cloudProvider: provider,
      cloudModel: PROVIDER_MODELS[provider][0],
    }));
    const resetMap: Record<string, CharacterVoiceAssignment> = {};
    speakerList.forEach((sp, i) => {
      resetMap[sp.id] = defaultVoiceForCharacter(sp.id, i, provider);
    });
    setCastVoices(resetMap);
    saveCastVoicesToStorage(resetMap);
    setErrorMsg(null);
  };

  // ---- MODE 1: LIVE MICROPHONE RECORDING ----
  const stopMicRecording = () => {
    if (micTimerRef.current !== null) {
      window.clearInterval(micTimerRef.current);
      micTimerRef.current = null;
    }
    if (micRecorderRef.current && micRecorderRef.current.state !== 'inactive') {
      micRecorderRef.current.stop();
    }
  };

  const toggleMicRecording = async () => {
    setErrorMsg(null);
    if (isMicRecording) {
      stopMicRecording();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Microphone capture is not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micChunksRef.current = [];
      const rec = new MediaRecorder(stream);
      const targetBeatId = selectedBeat.id;
      const targetSceneNum = selectedBeatIdx + 1;

      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) micChunksRef.current.push(ev.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        setIsMicRecording(false);
        setMicSeconds(0);
        if (micChunksRef.current.length > 0) {
          let blob = new Blob(micChunksRef.current, { type: rec.mimeType || 'audio/webm' });
          let fileName = `mic_scene_${String(targetSceneNum).padStart(2, '0')}.webm`;
          let trimNote = '';
          if (autoTrimSilence) {
            const trimmed = await trimAndNormalizeVoiceBlob(blob);
            if (trimmed.didModify) {
              blob = trimmed.blob;
              fileName = `mic_scene_${String(targetSceneNum).padStart(2, '0')}.wav`;
              if (trimmed.savedSec >= 0.05) {
                trimNote = ` (trimmed ${trimmed.savedSec.toFixed(1)}s dead air)`;
              }
            }
          }
          try {
            await onBindVoiceBlob(
              targetBeatId,
              blob,
              fileName,
              settings.autoSyncDuration
            );
            setStatusMsg(`Recorded & bound Scene ${targetSceneNum} mic take${trimNote}`);
            setTimeout(() => setStatusMsg(null), 3200);
          } catch {
            setErrorMsg('Could not decode microphone recording.');
          }
        }
      };

      micRecorderRef.current = rec;
      rec.start(150);
      setIsMicRecording(true);
      setMicSeconds(0);
      micTimerRef.current = window.setInterval(() => {
        setMicSeconds((s) => Number((s + 0.1).toFixed(1)));
      }, 100);
    } catch {
      setErrorMsg('Microphone access was denied or unavailable.');
    }
  };

  // Bounded client-side LRU TTS blob cache so repeated scene synthesis reuses audio instantly
  const clientTtsCacheRef = useRef<Map<string, Blob>>(new Map());
  const MAX_CLIENT_TTS_CACHE = 64;

  const getCachedTtsBlob = (key: string): Blob | null => {
    const map = clientTtsCacheRef.current;
    const hit = map.get(key);
    if (!hit) return null;
    map.delete(key);
    map.set(key, hit);
    return hit;
  };

  const putCachedTtsBlob = (key: string, blob: Blob): void => {
    const map = clientTtsCacheRef.current;
    if (map.has(key)) map.delete(key);
    while (map.size >= MAX_CLIENT_TTS_CACHE) {
      const oldest = map.keys().next().value;
      if (!oldest) break;
      map.delete(oldest);
    }
    map.set(key, blob);
  };

  // ---- MODE 2/3: SYNTHESIZE ONE BEAT VIA CLOUD (/api/tts) OR LOCAL SERVER ----
  const synthesizeBeat = async (beat: StoryBeat, sceneNumber: number): Promise<void> => {
    const dialogue = beat.dialogue.trim();
    if (!dialogue) return;
    const assigned = getVoiceForSpeaker(beat.speakerId || 'narrator');
    const prosody = autoExpressiveProsody
      ? buildExpressiveTtsProsody(beat, assigned.style, settings.speed)
      : { style: assigned.style, speed: settings.speed, expression: 'calm' as const, summary: '' };

    if (settings.source === 'browser_tts') {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(dialogue);
        utt.lang = episodeLang.bcp47;
        utt.rate = prosody.speed;
        const selected = browserVoices.find((v) => v.voiceURI === settings.browserVoiceUri);
        const langPrefix = episodeLang.code.toLowerCase();
        const matched =
          selected && selected.lang.toLowerCase().startsWith(langPrefix)
            ? selected
            : browserVoices.find((v) => v.lang.toLowerCase().startsWith(langPrefix)) || selected;
        if (matched) utt.voice = matched;
        window.speechSynthesis.speak(utt);
        setStatusMsg(`Playing ${episodeLang.label} browser preview for Scene ${sceneNumber}`);
      }
      return;
    }

    const ttsCacheKey = JSON.stringify({
      source: settings.source,
      provider: settings.source === 'local_tts' ? settings.localEndpoint.trim() : settings.cloudProvider,
      model: settings.source === 'local_tts' ? settings.localModel.trim() || 'kokoro' : settings.cloudModel,
      voice: assigned.voiceId,
      style: prosody.style,
      speed: Number(prosody.speed.toFixed(2)),
      lang: episodeLang.bcp47,
      dialogue,
    });
    const cachedBlob = getCachedTtsBlob(ttsCacheKey);
    if (cachedBlob) {
      const prefix = settings.source === 'local_tts' ? 'local' : settings.cloudProvider;
      await onBindVoiceBlob(
        beat.id,
        cachedBlob,
        `${prefix}_${String(sceneNumber).padStart(2, '0')}_${beat.speakerId}_cached.wav`,
        settings.autoSyncDuration
      );
      return;
    }

    if (settings.source === 'local_tts') {
      let parsed: URL;
      try {
        parsed = new URL(settings.localEndpoint.trim());
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          throw new Error('Endpoint must use http:// or https://');
        }
      } catch {
        throw new Error('Enter a valid Local TTS URL (e.g. http://localhost:8880/v1/audio/speech).');
      }

      const resp = await fetch(parsed.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.localModel.trim() || 'kokoro',
          input: dialogue,
          voice: assigned.voiceId,
          speed: prosody.speed,
          language: episodeLang.code,
        }),
      });
      if (!resp.ok) {
        const errTxt = await resp.text().catch(() => resp.statusText);
        throw new Error(`Local TTS (${resp.status}): ${errTxt.slice(0, 160)}`);
      }
      let blob = await resp.blob();
      if (autoTrimSilence) {
        const trimmed = await trimAndNormalizeVoiceBlob(blob);
        if (trimmed.didModify) blob = trimmed.blob;
      }
      putCachedTtsBlob(ttsCacheKey, blob);
      await onBindVoiceBlob(
        beat.id,
        blob,
        `local_${String(sceneNumber).padStart(2, '0')}_${beat.speakerId}.wav`,
        settings.autoSyncDuration
      );
      return;
    }

    // Cloud TTS via server-side proxy (/api/tts) with automatic HTTP 429 Retry-After backoff
    const maxAttempts = 4;
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (cancelBatchRef.current) return;
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: settings.cloudProvider,
          model: settings.cloudModel,
          voice: assigned.voiceId,
          style: prosody.style,
          speed: prosody.speed,
          language: episodeLang.bcp47,
          text: dialogue,
        }),
      });
      if (resp.status === 429 && attempt < maxAttempts) {
        const retryHeader = Number(resp.headers.get('Retry-After'));
        const waitSec =
          Number.isFinite(retryHeader) && retryHeader > 0
            ? Math.min(30, retryHeader)
            : Math.min(16, attempt * 3);
        setBusyLabel(
          `Rate limit reached on Scene ${sceneNumber} — waiting ${waitSec}s (retry ${attempt}/${maxAttempts - 1})…`
        );
        await new Promise((r) => setTimeout(r, waitSec * 1000));
        continue;
      }
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({ error: resp.statusText }));
        lastError = new Error(data.error || `TTS request failed (${resp.status})`);
        break;
      }
      let blob = await resp.blob();
      if (autoTrimSilence) {
        const trimmed = await trimAndNormalizeVoiceBlob(blob);
        if (trimmed.didModify) blob = trimmed.blob;
      }
      putCachedTtsBlob(ttsCacheKey, blob);
      await onBindVoiceBlob(
        beat.id,
        blob,
        `${settings.cloudProvider}_${String(sceneNumber).padStart(2, '0')}_${beat.speakerId}.wav`,
        settings.autoSyncDuration
      );
      return;
    }
    throw lastError || new Error('Cloud TTS request failed after retries.');
  };

  const handleGenerateCurrentScene = async () => {
    setErrorMsg(null);
    setBusyLabel(`Generating Scene ${selectedBeatIdx + 1}…`);
    try {
      await synthesizeBeat(selectedBeat, selectedBeatIdx + 1);
      if (settings.source !== 'browser_tts') {
        setStatusMsg(`Bound generated voice to Scene ${selectedBeatIdx + 1}`);
        setTimeout(() => setStatusMsg(null), 3000);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Voice generation failed.');
    } finally {
      setBusyLabel(null);
    }
  };

  const runBatchSynthesis = async (
    items: Array<{ beat: StoryBeat; num: number }>,
    scopeLabel: string
  ) => {
    setErrorMsg(null);
    cancelBatchRef.current = false;

    const spokenBeats = items.filter((item) => {
      if (item.beat.dialogue.trim().length === 0) return false;
      if (skipAlreadyVoiced && voiceMeta[item.beat.id]) return false;
      return true;
    });

    if (spokenBeats.length === 0) {
      setStatusMsg(`All spoken scenes in ${scopeLabel} already have voice audio bound!`);
      setTimeout(() => setStatusMsg(null), 3200);
      return;
    }

    // Pace long cloud batches (>40 scenes) slightly below 60 req/min so server rate limit never trips
    const shouldPaceCloud = settings.source === 'cloud_tts' && spokenBeats.length > 40;
    const minIntervalMs = shouldPaceCloud ? 1050 : 0;

    let done = 0;
    try {
      for (const item of spokenBeats) {
        if (cancelBatchRef.current) break;
        const callStart = Date.now();
        const remaining = spokenBeats.length - done;
        const etaNote =
          shouldPaceCloud && remaining > 5
            ? ` · ~${Math.ceil((remaining * 1.4) / 60)}m left`
            : '';
        setBusyLabel(
          `Voicing ${done + 1} / ${spokenBeats.length} (Scene ${item.num}${etaNote})…`
        );
        await synthesizeBeat(item.beat, item.num);
        if (cancelBatchRef.current) break;
        done++;

        if (minIntervalMs > 0 && done < spokenBeats.length) {
          const elapsed = Date.now() - callStart;
          const wait = minIntervalMs - elapsed;
          if (wait > 40) {
            await new Promise((r) => setTimeout(r, wait));
          }
        }
      }
      setStatusMsg(
        cancelBatchRef.current
          ? `Paused after ${done} / ${spokenBeats.length} scenes (click again to resume)`
          : `Generated & bound ${done} scenes (${scopeLabel})`
      );
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err) {
      setErrorMsg(
        `Stopped at ${done}/${spokenBeats.length}: ${
          err instanceof Error ? err.message : 'Generation error'
        } (re-click to resume remaining scenes)`
      );
    } finally {
      setBusyLabel(null);
    }
  };

  const handleGenerateAllScenes = async () => {
    const allItems = episode.beats.map((b, idx) => ({ beat: b, num: idx + 1 }));
    await runBatchSynthesis(allItems, 'Full Episode');
  };

  const handleGenerateCurrentChapter = async () => {
    if (!currentChapter) return;
    const chapterItems = episode.beats
      .slice(currentChapter.startBeatIdx, currentChapter.endBeatIdx + 1)
      .map((b, offset) => ({ beat: b, num: currentChapter.startBeatIdx + offset + 1 }));
    await runBatchSynthesis(chapterItems, `Chapter ${currentChapter.chapterNumber}`);
  };

  const handleExportVoiceScript = () => {
    const lines = [
      `# ${episode.series} — ${episode.title}`,
      `# Numbered Voiceover Recording Sheet (save files as 01_..., 02_... for 1-click Batch Bind)`,
      '',
      ...episode.beats.map((b, i) => {
        const num = String(i + 1).padStart(2, '0');
        const slug = b.speakerLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        return `[${num}_${slug}.wav] (${b.duration.toFixed(1)}s) — ${b.speakerLabel.toUpperCase()}:\n${b.dialogue || '(No dialogue — visual/music beat)'}\n`;
      }),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${episode.id}_voiceover_script.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const voiceSuggestions = PROVIDER_VOICE_SUGGESTIONS[activePoolKey] || [];
  const boundCount = episode.beats.filter((b) => Boolean(voiceMeta[b.id])).length;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Header Summary */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#f2c85b]">Configurable Voice Studio</span>
            <span
              className="px-1.5 py-0.5 rounded bg-[#18223d] border border-[#60a5fa]/30 text-[10px] font-semibold text-[#bfdbfe] inline-flex items-center gap-1"
              title={`Active episode voice locale: ${episodeLang.label} (${episodeLang.bcp47})`}
            >
              <Globe className="w-2.5 h-2.5" />
              <span>{episodeLang.nativeName} · {episodeLang.bcp47}</span>
            </span>
          </div>
          <div className="text-[11px] text-[#848da8]">
            {boundCount} / {episode.beats.length} scenes have audio bound
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onOpenVoiceBooth) {
                onOpenVoiceBooth();
              } else {
                setBoothOpen(true);
              }
            }}
            title="Launch full-focus Voiceover Booth Teleprompter & Multi-Take Recorder"
            className="h-8 px-2.5 rounded-md bg-[#231d12] hover:bg-[#332917] border border-[#f2c85b]/45 text-[11px] font-semibold text-[#f2c85b] inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Booth</span>
          </button>
          <button
            type="button"
            onClick={handleExportVoiceScript}
            title="Export numbered voiceover script for external recording or TTS"
            className="h-8 px-2.5 rounded-md bg-[#161b2e] hover:bg-[#202742] border border-white/12 text-[11px] font-semibold text-[#d6dcf0] inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Script .txt</span>
          </button>
        </div>
      </div>

      {boothOpen && (
        <TeleprompterModal
          episode={episode}
          initialBeatIdx={selectedBeatIdx}
          voiceMeta={voiceMeta}
          onBindVoiceBlob={onBindVoiceBlob}
          onClose={() => setBoothOpen(false)}
        />
      )}

      {/* Source Mode Switcher */}
      <div className="grid grid-cols-2 gap-1.5">
        {(
          [
            ['cloud_tts', 'Cloud AI TTS', Server],
            ['local_tts', 'Local TTS Model', Laptop],
            ['mic', 'Record Yourself', Mic],
            ['upload', 'Upload / Batch', Upload],
            ['browser_tts', 'Browser Preview', Volume2],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setSettings((p) => ({ ...p, source: id as VoiceSourceMode }));
              setErrorMsg(null);
            }}
            className={`h-9 px-2.5 rounded-md border text-[11px] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              settings.source === id
                ? 'bg-[#1c2440] border-[#f2c85b] text-[#f2c85b]'
                : 'bg-[#13182b] border-white/10 text-[#b4bcd4] hover:border-white/25 hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Mode-Specific Configuration Card */}
      {settings.source === 'mic' && (
        <div className="p-3 rounded-lg bg-[#13182b] border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-white">
              Scene {selectedBeatIdx + 1}: {selectedBeat.speakerLabel}
            </span>
            {isMicRecording && (
              <span className="font-mono-tabular text-xs font-semibold text-[#ff6b81]">
                REC {micSeconds.toFixed(1)}s
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#cfd6ea] italic leading-relaxed bg-[#0c0f1b] p-2.5 rounded border border-white/8">
            “{selectedBeat.dialogue || 'No dialogue on this beat.'}”
          </p>
          <button
            type="button"
            onClick={toggleMicRecording}
            className={`h-9 w-full rounded-md text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer ${
              isMicRecording
                ? 'bg-[#e6223c] hover:bg-[#cc1d34] text-white'
                : 'bg-[#f2c85b] hover:bg-[#f7d577] text-[#110e0a]'
            }`}
          >
            {isMicRecording ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop &amp; Bind Take to Scene {selectedBeatIdx + 1}</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>Record Voiceover for Scene {selectedBeatIdx + 1}</span>
              </>
            )}
          </button>
        </div>
      )}

      {settings.source === 'upload' && (
        <div className="p-3 rounded-lg bg-[#13182b] border border-white/10 space-y-2.5">
          <p className="text-[11px] text-[#9aa3bd] leading-relaxed">
            Upload a single MP3/WAV clip for Scene {selectedBeatIdx + 1}, or select multiple numbered files (<span className="text-white">01_..., 02_...</span>) to auto-bind the entire chapter.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onTriggerSingleUpload}
              className="h-9 rounded-md bg-[#1f2947] hover:bg-[#2a365e] border border-[#f2c85b]/35 text-xs font-semibold text-[#f7e7bc] inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Scene Audio</span>
            </button>
            <button
              type="button"
              onClick={onTriggerBatchUpload}
              className="h-9 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] text-[#110e0a] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Batch Bind</span>
            </button>
          </div>
        </div>
      )}

      {settings.source === 'cloud_tts' && (
        <div className="p-3 rounded-lg bg-[#13182b] border border-white/10 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Cloud Provider</span>
              <select
                value={settings.cloudProvider}
                onChange={(e) => handleSelectCloudProvider(e.target.value as CloudTtsProviderId)}
                className="w-full h-9 px-2 rounded-md bg-[#0c0f1b] border border-white/12 text-xs text-white"
              >
                <option value="gemini">Gemini TTS {serverStatus.gemini ? '(Ready)' : '(Key in Secrets)'}</option>
                <option value="openai">OpenAI TTS {serverStatus.openai ? '(Ready)' : '(Set OPENAI_API_KEY)'}</option>
                <option value="elevenlabs">ElevenLabs {serverStatus.elevenlabs ? '(Ready)' : '(Set ELEVENLABS_API_KEY)'}</option>
                <option value="custom_server">Server Custom TTS {serverStatus.custom_server ? '(Ready)' : '(Set CUSTOM_TTS_URL)'}</option>
              </select>
            </label>

            <label className="block">
              <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Model</span>
              <input
                type="text"
                list="cloud-tts-models"
                value={settings.cloudModel}
                onChange={(e) => setSettings((p) => ({ ...p, cloudModel: e.target.value }))}
                className="w-full h-9 px-2 rounded-md bg-[#0c0f1b] border border-white/12 text-xs text-white"
              />
              <datalist id="cloud-tts-models">
                {PROVIDER_MODELS[settings.cloudProvider].map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </label>
          </div>
          <p className="text-[10px] text-[#848da8] leading-relaxed">
            Provider keys are read securely on the server from Settings &rarr; Secrets (never entered in browser UI).
          </p>
        </div>
      )}

      {settings.source === 'local_tts' && (
        <div className="p-3 rounded-lg bg-[#13182b] border border-white/10 space-y-2.5">
          <label className="block">
            <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">
              Local OpenAI-Compatible TTS Endpoint
            </span>
            <input
              type="text"
              value={settings.localEndpoint}
              onChange={(e) => setSettings((p) => ({ ...p, localEndpoint: e.target.value }))}
              placeholder="http://localhost:8880/v1/audio/speech"
              className="w-full h-9 px-2.5 rounded-md bg-[#0c0f1b] border border-white/12 font-mono-tabular text-[11px] text-white"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Local Model Name</span>
              <input
                type="text"
                value={settings.localModel}
                onChange={(e) => setSettings((p) => ({ ...p, localModel: e.target.value }))}
                placeholder="kokoro / piper / xtts"
                className="w-full h-8 px-2 rounded-md bg-[#0c0f1b] border border-white/12 text-xs text-white"
              />
            </label>
            <label className="block">
              <div className="flex items-center justify-between text-[11px] text-[#8e97b0] mb-1">
                <span>Speed</span>
                <span className="font-mono-tabular text-white">{settings.speed.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                min={0.75}
                max={1.3}
                step={0.05}
                value={settings.speed}
                onChange={(e) => setSettings((p) => ({ ...p, speed: Number(e.target.value) }))}
                className="w-full accent-[#f2c85b] cursor-pointer"
              />
            </label>
          </div>
          <p className="text-[10px] text-[#848da8] leading-relaxed">
            Works directly from your browser with Kokoro-FastAPI, Piper, AllTalk, Coqui XTTS, or Chatterbox (enable CORS on your local server).
          </p>
        </div>
      )}

      {settings.source === 'browser_tts' && (
        <div className="p-3 rounded-lg bg-[#13182b] border border-white/10 space-y-2.5">
          <label className="block">
            <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">System Voice</span>
            <select
              value={settings.browserVoiceUri}
              onChange={(e) => setSettings((p) => ({ ...p, browserVoiceUri: e.target.value }))}
              className="w-full h-9 px-2 rounded-md bg-[#0c0f1b] border border-white/12 text-xs text-white"
            >
              {browserVoices.length === 0 ? (
                <option value="">Default System Voice</option>
              ) : (
                browserVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))
              )}
            </select>
          </label>
          <p className="text-[10px] text-[#f5d380] leading-relaxed bg-[#241c10] border border-[#f2c85b]/25 rounded p-2">
            Preview only: browser system speech cannot be captured inside exported .webm/.mp4 videos. For final renders, use Cloud TTS, Local TTS, Mic Record, or Upload.
          </p>
        </div>
      )}

      {/* Auto-sync + Silence Auto-Trim + Resumable Batch toggles */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-[11px] text-[#b4bcd4] cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoSyncDuration}
            onChange={(e) => setSettings((p) => ({ ...p, autoSyncDuration: e.target.checked }))}
            className="accent-[#f2c85b]"
          />
          <span>Auto-sync beat duration to voice length (+0.35s breath)</span>
        </label>
        <label className="flex items-center gap-2 text-[11px] text-[#b4bcd4] cursor-pointer">
          <input
            type="checkbox"
            checked={autoTrimSilence}
            onChange={(e) => setAutoTrimSilence(e.target.checked)}
            className="accent-[#f2c85b]"
          />
          <span>Auto-trim dead air &amp; normalize new voice clips (-1 dBFS)</span>
        </label>
        {(settings.source === 'cloud_tts' || settings.source === 'local_tts') && (
          <>
            <label className="flex items-center gap-2 text-[11px] text-[#b4bcd4] cursor-pointer">
              <input
                type="checkbox"
                checked={skipAlreadyVoiced}
                onChange={(e) => setSkipAlreadyVoiced(e.target.checked)}
                className="accent-[#f2c85b]"
              />
              <span>Skip already-voiced scenes (resume long-form batches cleanly)</span>
            </label>
            <label className="flex items-center gap-2 text-[11px] text-[#b4bcd4] cursor-pointer">
              <input
                type="checkbox"
                checked={autoExpressiveProsody}
                onChange={(e) => setAutoExpressiveProsody(e.target.checked)}
                className="accent-[#f2c85b]"
              />
              <span>
                Auto-Expressive Prosody (sync vocal acting to Scene {selectedBeatIdx + 1}:{' '}
                <strong className="text-[#f2c85b]">
                  {buildExpressiveTtsProsody(
                    selectedBeat,
                    getVoiceForSpeaker(selectedBeat.speakerId || 'narrator').style,
                    settings.speed
                  ).summary}
                </strong>
                )
              </span>
            </label>
          </>
        )}
      </div>

      {(settings.source === 'cloud_tts' ||
        settings.source === 'local_tts' ||
        settings.source === 'browser_tts') && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={Boolean(busyLabel)}
              onClick={handleGenerateCurrentScene}
              className="h-9 px-2.5 rounded-md bg-[#1f2947] hover:bg-[#2a365e] disabled:opacity-50 border border-[#f2c85b]/35 text-xs font-semibold text-[#f7e7bc] inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{settings.source === 'browser_tts' ? 'Speak Scene' : `Voice Scene ${selectedBeatIdx + 1}`}</span>
            </button>

            {settings.source !== 'browser_tts' && (
              busyLabel ? (
                <button
                  type="button"
                  onClick={() => {
                    cancelBatchRef.current = true;
                  }}
                  className="h-9 px-2.5 rounded-md bg-[#e6223c] hover:bg-[#cc1d34] text-xs font-bold text-white whitespace-nowrap cursor-pointer"
                >
                  Pause / Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerateAllScenes}
                  className="h-9 px-2.5 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] text-[#110e0a] text-xs font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Voice {skipAlreadyVoiced && boundCount > 0 ? 'Remaining' : 'All'} (
                    {skipAlreadyVoiced
                      ? Math.max(
                          0,
                          episode.beats.filter((b) => b.dialogue.trim() && !voiceMeta[b.id]).length
                        )
                      : episode.beats.length}
                    )
                  </span>
                </button>
              )
            )}
          </div>

          {settings.source !== 'browser_tts' && chapters.length > 1 && currentChapter && !busyLabel && (
            <button
              type="button"
              onClick={handleGenerateCurrentChapter}
              className="w-full h-8 px-2.5 rounded-md bg-[#161d34] hover:bg-[#1f2947] border border-white/12 text-[11px] font-semibold text-[#d6dcf0] inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-[#f2c85b]" />
              <span>
                Voice Chapter {currentChapter.chapterNumber} Only ({currentChapter.beatCount} scenes · {currentChapter.title})
              </span>
            </button>
          )}
        </div>
      )}

      {onTightenAllVoices && boundCount > 0 && !busyLabel && (
        <button
          type="button"
          onClick={async () => {
            setErrorMsg(null);
            setBusyLabel(`Trimming dead air & normalizing ${boundCount} voice clip${boundCount === 1 ? '' : 's'}…`);
            try {
              const res = await onTightenAllVoices();
              setStatusMsg(
                res.trimmedCount > 0
                  ? `Tightened ${res.trimmedCount} voice clip${res.trimmedCount === 1 ? '' : 's'} (-1 dBFS · saved ${res.savedSec.toFixed(1)}s dead air)`
                  : 'All bound voice clips are already tight and normalized!'
              );
              setTimeout(() => setStatusMsg(null), 4000);
            } catch (err) {
              setErrorMsg(err instanceof Error ? err.message : 'Failed to tighten voice clips.');
            } finally {
              setBusyLabel(null);
            }
          }}
          className="w-full h-8 px-2.5 rounded-md bg-[#132030] hover:bg-[#1a2c42] border border-[#38bdf8]/35 text-[11px] font-semibold text-[#bae6fd] inline-flex items-center justify-center gap-1.5 cursor-pointer"
          title="Trim leading/trailing silence to crisp breath pads and peak-normalize all bound voice clips to -1 dBFS"
        >
          <Scissors className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>Tighten All Voice Pauses &amp; Normalize ({boundCount})</span>
        </button>
      )}

      {busyLabel && (
        <div className="px-3 py-2 rounded-md bg-[#192342] border border-[#f2c85b]/40 text-xs text-[#f7e7bc]">
          {busyLabel}
        </div>
      )}
      {statusMsg && (
        <div className="px-3 py-2 rounded-md bg-[#142e22] border border-[#4ade80]/40 text-xs text-[#bbf7d0] flex items-center gap-2">
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="px-3 py-2 rounded-md bg-[#3d1220] border border-[#ff4d6d]/50 text-xs text-[#ffb3c1] flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Per-Character Voice Casting */}
      {(settings.source === 'cloud_tts' || settings.source === 'local_tts') && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <span className="block text-xs font-semibold text-white">Per-Character Voice Casting</span>
          <datalist id="voice-id-suggestions">
            {voiceSuggestions.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
          {speakerList.map((sp) => {
            const assigned = getVoiceForSpeaker(sp.id);
            return (
              <div
                key={sp.id}
                className="p-2.5 rounded-lg bg-[#13182b] border border-white/10 space-y-1.5"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-white truncate">{sp.name}</span>
                  <span className="text-[10px] text-[#848da8] whitespace-nowrap">{sp.role}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  <input
                    type="text"
                    list="voice-id-suggestions"
                    value={assigned.voiceId}
                    onChange={(e) => updateCastVoice(sp.id, { voiceId: e.target.value })}
                    placeholder="Voice ID"
                    className="col-span-2 h-8 px-2 rounded bg-[#0c0f1b] border border-white/10 text-[11px] text-white"
                  />
                  <input
                    type="text"
                    value={assigned.style}
                    onChange={(e) => updateCastVoice(sp.id, { style: e.target.value })}
                    placeholder="Delivery style / persona"
                    className="col-span-3 h-8 px-2 rounded bg-[#0c0f1b] border border-white/10 text-[11px] text-[#cfd6ea]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Current Scene Bound Audio Status */}
      {voiceMeta[selectedBeat.id] && (
        <div className="p-2.5 rounded-lg bg-[#131c2e] border border-[#f2c85b]/30 flex items-center justify-between gap-2 text-[11px]">
          <span className="text-[#f7e7bc] truncate">
            Scene {selectedBeatIdx + 1}: {voiceMeta[selectedBeat.id].fileName} (
            {voiceMeta[selectedBeat.id].duration.toFixed(1)}s)
          </span>
          <button
            type="button"
            onClick={() => onClearVoiceClip(selectedBeat.id)}
            className="text-[#ff6b81] hover:underline shrink-0 cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Optional Acoustic Music Stem Bed (auto-loops & sidechain-ducks under narration!) */}
      {onUploadMusicStem && (
        <div className="p-3 rounded-lg bg-[#11172a] border border-white/10 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-white inline-flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-[#f2c85b]" />
              <span>Acoustic Music Stem (Optional)</span>
            </span>
            <input
              ref={stemInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                setErrorMsg(null);
                try {
                  await onUploadMusicStem(file);
                  setStatusMsg(`Loaded acoustic music stem: ${file.name}`);
                  setTimeout(() => setStatusMsg(null), 3200);
                } catch {
                  setErrorMsg('Could not decode uploaded music stem file.');
                }
              }}
            />
            <button
              type="button"
              onClick={() => stemInputRef.current?.click()}
              className="h-7 px-2.5 rounded bg-[#1d2746] hover:bg-[#293761] border border-[#f2c85b]/30 text-[10px] font-semibold text-[#f7e7bc] cursor-pointer"
            >
              {musicStemMeta ? 'Replace Stem' : 'Upload .mp3/.wav'}
            </button>
          </div>
          {musicStemMeta ? (
            <div className="flex items-center justify-between gap-2 text-[11px] bg-[#0c1120] px-2.5 py-1.5 rounded border border-emerald-400/25">
              <span className="text-emerald-200 truncate">
                {musicStemMeta.fileName} ({musicStemMeta.duration.toFixed(1)}s loop)
              </span>
              {onClearMusicStem && (
                <button
                  type="button"
                  onClick={onClearMusicStem}
                  className="text-[#ff6b81] hover:underline shrink-0 cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-[#848da8] leading-relaxed">
              Drop a real sitar, flute, lute, or ambient acoustic track to replace procedural synth—automatically loops and ducks under dialogue in live preview &amp; fast offline exports.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
