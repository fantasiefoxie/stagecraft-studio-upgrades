/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Subtitles,
  Plus,
  Trash2,
  Copy,
  Check,
  Mic,
  Circle,
  Square,
  SlidersHorizontal,
  Layers,
  Code2,
  Download,
  BookOpen,
  ChevronDown,
  Upload,
  ImagePlus,
  Palette,
  FlipHorizontal2,
  Scissors,
  Rocket,
  Undo2,
  Redo2,
  Zap,
  Smile,
  Meh,
  Globe,
  Move,
  Columns2,
  Tv,
  History,
  Sparkles,
  LayoutGrid,
  StepBack,
  StepForward,
  Ghost,
  Scan,
  Command,
  GitCompare,
} from 'lucide-react';
import { LANGUAGE_CATALOG, LanguageCode, resolveEpisodeLanguage } from './studio/i18n';
import { formatLongDuration, partitionEpisodeIntoChapters } from './studio/longFormEngine';
import {
  ActArcPresetId,
  BackdropThemeId,
  CustomPropPresetId,
  applyActVisualProgression,
  generateProceduralBackdropDataUrl,
  generateProceduralPropDataUrl,
} from './studio/backdropGenerator';
import {
  ARCHETYPE_CATALOG,
  ARCHETYPE_DEFAULT_COLORS,
  ArchetypeId,
  AspectMode,
  CastMember,
  EpisodeScript,
  EpisodeVisualStyle,
  EXPRESSION_LIST,
  MotionCadenceId,
  MotionProfileId,
  PostFxPassId,
  RenderStyleId,
  SfxId,
  StorybookShelf,
  STUDIO_FPS,
  StoryBeat,
  buildAiDirectorPrompt,
  frameIndexToTime,
  getEpisodeDuration,
  getEpisodeTotalFrames,
  getRecommendedRenderStyle,
  resolveVisualStyle,
  timeToFrameIndex,
  validateEpisodeScript,
} from './studio/types';
import { PRESET_EPISODES } from './studio/presets';
import { KathaAudioEngine } from './studio/audioEngine';
import {
  drawSafeZoneOverlay,
  evaluateEpisodeAtTime,
  getStageInteractiveTargets,
  renderEpisodeFrame,
} from './studio/renderer';
import { StoryboardTimelineStrip } from './studio/StoryboardTimelineStrip';
import { StoryboardQaModal } from './studio/StoryboardQaModal';
import { WorkbenchAssetsTab } from './studio/WorkbenchAssetsTab';
import {
  SpriteWorkshopPreset,
  buildCastMemberFromSpritePreset,
} from './studio/spriteWorkshopPresets';
import { TeleprompterModal } from './studio/TeleprompterModal';
import { VersionDiffModal, HistoryCheckpointItem } from './studio/VersionDiffModal';
import { CommandPaletteModal } from './studio/CommandPaletteModal';
import {
  StudioCommandItem,
  buildStudioCommandRegistry,
  isEditableEventTarget,
} from './studio/studioShortcuts';
import { boostFlatBeats } from './studio/pacingAnalyzer';
import { autoTagStageChangeLocationCards } from './studio/lowerThirds';
import { restoreSingleBeatFromCheckpoint } from './studio/episodeDiff';
import { ActingMacroId, applyActingMacroToBeat } from './studio/actingMacros';
import { WorkbenchScriptTab } from './studio/WorkbenchScriptTab';
import { WorkbenchLookTab } from './studio/WorkbenchLookTab';
import { WorkbenchBeatInspector } from './studio/WorkbenchBeatInspector';
import { useHeadlessDriver } from './studio/useHeadlessDriver';
import {
  getVoiceSpeechProfile,
  sampleVoiceProfileAtTime,
  trimAndNormalizeVoiceBlob,
} from './studio/voiceEnvelope';
import { buildShortSliceEpisode } from './studio/shortsRecommender';
import { applyAnimationPrinciplesAutoPolish } from './studio/animationPrinciples';
import { CAST_VOICES_STORAGE_KEY, VoiceStudioPanel } from './studio/VoiceStudioPanel';
import type { CarriedVoiceClip, GrowthTab } from './studio/ChannelGrowthModal';
import { ProjectVaultMenu } from './studio/ProjectVaultMenu';
import {
  ChannelBrandKit,
  createYoutubeEndScreenBeat,
  loadBrandKit,
  sanitizeRasterDataUrl,
  saveBrandKit,
} from './studio/brandKit';
import {
  applyCinematicJCuts,
  duplicateBeat,
  reorderBeats,
  splitBeatAtMidpoint,
} from './studio/timelineUtils';
import { exportKathaArchiveBytes, parseKathaArchiveBytes } from './studio/kathaArchive';
import { loadLookRecipes, mergeLookRecipes, saveLookRecipes } from './studio/lookPresets';
import { loadCastBible, upsertMemberInBible } from './studio/castBible';
import { recordEpisodeExportInLedger } from './studio/monetizationShield';
import { createBaseDna, syncMemberWithDna } from './studio/characterDna';

const ShortsAndThumbnailModal = lazy(() =>
  import('./studio/ShortsAndThumbnailModal').then((m) => ({ default: m.ShortsAndThumbnailModal }))
);
const ChannelGrowthModal = lazy(() =>
  import('./studio/ChannelGrowthModal').then((m) => ({ default: m.ChannelGrowthModal }))
);
const FastRenderModal = lazy(() =>
  import('./studio/FastRenderModal').then((m) => ({ default: m.FastRenderModal }))
);
const EntityWorkshopModal = lazy(() =>
  import('./studio/EntityWorkshopModal').then((m) => ({ default: m.EntityWorkshopModal }))
);
import { retimeBeatExpressionTracks } from './studio/emotionChoreographer';
import {
  AUTOSAVE_PROJECT_ID,
  SavedProjectRecord,
  deleteMusicStemFromVault,
  deleteSavedProject,
  deleteVoiceBlobFromVault,
  listSavedProjects,
  loadAutosaveProject,
  loadMusicStemFromVault,
  loadVoiceBlobsForProject,
  parseVoiceSlotKey,
  replaceAutosaveVoiceBlobs,
  saveAutosaveProject,
  saveMusicStemToVault,
  saveNamedProject,
  saveVoiceBlobToVault,
} from './studio/projectVault';
import {
  buildGuidedDirectorPrompt,
  compileLiteOrFullToEpisode,
  detectPlaybookFromText,
  healAndParseLlmJson,
} from './studio/llmDirectorKit';

type PanelTab = 'levers' | 'look' | 'voice' | 'assets' | 'script';
type AssetCategory = 'cast' | 'stages' | 'props';

interface HistoryCheckpoint {
  episode: EpisodeScript;
  label: string;
  savedAt: number;
}

function cloneEpisode(ep: EpisodeScript): EpisodeScript {
  return JSON.parse(JSON.stringify(ep)) as EpisodeScript;
}

function inferHistoryLabel(prev: EpisodeScript, next: EpisodeScript): string {
  if (prev.id !== next.id || prev.title !== next.title) {
    return `Before "${next.title.slice(0, 26)}"`;
  }
  if (next.beats.length > prev.beats.length) {
    const diff = next.beats.length - prev.beats.length;
    return diff === 1 ? 'Before adding scene' : `Before adding ${diff} scenes`;
  }
  if (next.beats.length < prev.beats.length) {
    const diff = prev.beats.length - next.beats.length;
    return diff === 1 ? 'Before deleting scene' : `Before removing ${diff} scenes`;
  }
  if (next.cast.length !== prev.cast.length) {
    return 'Before cast update';
  }
  if (JSON.stringify(prev.visualStyle || {}) !== JSON.stringify(next.visualStyle || {})) {
    return 'Before visual style change';
  }
  for (let i = 0; i < next.beats.length; i++) {
    if (prev.beats[i] !== next.beats[i]) {
      return `Before Scene ${i + 1} edit`;
    }
  }
  return 'Before episode edit';
}

export default function App() {
  const [episode, setEpisode] = useState<EpisodeScript>(() => cloneEpisode(PRESET_EPISODES[0]));
  const [selectedBeatIdx, setSelectedBeatIdx] = useState(0);
  const [aspect, setAspect] = useState<AspectMode>('16:9');
  const [isPlaying, setIsPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [autoDuck, setAutoDuck] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [expressionsEnabled, setExpressionsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('katha_studio_expressions_enabled') !== 'false';
    } catch {
      return true;
    }
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [activeBeatIdx, setActiveBeatIdx] = useState(0);

  const [panelTab, setPanelTab] = useState<PanelTab>('levers');
  const [assetCat, setAssetCat] = useState<AssetCategory>('cast');
  const [jsonDraft, setJsonDraft] = useState(() => JSON.stringify(PRESET_EPISODES[0], null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonAppliedMsg, setJsonAppliedMsg] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const [voiceMeta, setVoiceMeta] = useState<Record<string, { fileName: string; duration: number }>>({});
  const [batchVoiceFeedback, setBatchVoiceFeedback] = useState<string | null>(null);
  const [musicStemMeta, setMusicStemMeta] = useState<{ fileName: string; duration: number } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [zipFeedback, setZipFeedback] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [shortsModalOpen, setShortsModalOpen] = useState(false);
  const [growthModalOpen, setGrowthModalOpen] = useState(false);
  const [growthInitialTab, setGrowthInitialTab] = useState<GrowthTab>('ypp');
  const [fastRenderOpen, setFastRenderOpen] = useState(false);
  const [fastRenderOverride, setFastRenderOverride] = useState<{
    episode: EpisodeScript;
    aspect: AspectMode;
  } | null>(null);
  const [qaModalOpen, setQaModalOpen] = useState(false);
  const [workshopTarget, setWorkshopTarget] = useState<{ member: CastMember; isNew: boolean } | null>(null);
  const [savedProjects, setSavedProjects] = useState<SavedProjectRecord[]>([]);
  const [autosaveAt, setAutosaveAt] = useState<number | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [historyCounts, setHistoryCounts] = useState<{ undo: number; redo: number }>({ undo: 0, redo: 0 });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [procBackdropTheme, setProcBackdropTheme] = useState<BackdropThemeId>('eclipse_lotus_courtyard');
  const [procBackdropSeed, setProcBackdropSeed] = useState<number>(108);
  const [actArcPreset, setActArcPreset] = useState<ActArcPresetId>('mythic_odyssey');
  const [procPropPreset, setProcPropPreset] = useState<CustomPropPresetId>('crystal_orb');
  const [procPropSeed, setProcPropSeed] = useState<number>(1);
  const [brandKit, setBrandKit] = useState<ChannelBrandKit>(() => loadBrandKit());
  const [stageMoveMode, setStageMoveMode] = useState(false);
  const [safeZones, setSafeZones] = useState(false);
  const [onionSkin, setOnionSkin] = useState(false);
  const [voiceBoothOpen, setVoiceBoothOpen] = useState(false);
  const [versionDiffOpen, setVersionDiffOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [dragBeatIdx, setDragBeatIdx] = useState<number | null>(null);
  const [dragOverBeatIdx, setDragOverBeatIdx] = useState<number | null>(null);

  const stageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const onionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const onionSkinRef = useRef(false);
  const safeZonesRef = useRef(false);
  const libraryMenuRef = useRef<HTMLDivElement | null>(null);
  const historyMenuRef = useRef<HTMLDivElement | null>(null);
  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const voiceInputRef = useRef<HTMLInputElement | null>(null);
  const batchVoiceInputRef = useRef<HTMLInputElement | null>(null);
  const customPropInputRef = useRef<HTMLInputElement | null>(null);
  const customBackdropInputRef = useRef<HTMLInputElement | null>(null);
  const brandLogoInputRef = useRef<HTMLInputElement | null>(null);
  const jsonImportInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<KathaAudioEngine | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const voiceBlobsRef = useRef<Map<string, { blob: Blob; fileName: string; duration: number }>>(new Map());
  const [, setVoiceDecodeTick] = useState(0);
  const musicStemBlobRef = useRef<{ blob: Blob; fileName: string; duration: number } | null>(null);
  const stageMoveModeRef = useRef(false);
  const stageDragRef = useRef<{
    kind: 'actor' | 'prop';
    index: number;
    startClientX: number;
    startClientY: number;
    initOffX: number;
    initOffY: number;
  } | null>(null);
  const vaultHydratedRef = useRef(false);
  const pastRef = useRef<HistoryCheckpoint[]>([]);
  const futureRef = useRef<HistoryCheckpoint[]>([]);
  const pendingHistoryLabelRef = useRef<string | null>(null);
  const prevEpisodeForHistoryRef = useRef<EpisodeScript>(episode);
  const skipNextHistoryRef = useRef(false);
  const lastHistoryPushAtRef = useRef(0);
  const restoreAfterRecordRef = useRef<{
    episode: EpisodeScript;
    aspect: AspectMode;
    selectedBeatIdx: number;
  } | null>(null);

  // Mutable 60fps clock refs
  const episodeRef = useRef(episode);
  const timeRef = useRef(0);
  const isPlayingRef = useRef(true);
  const aspectRef = useRef<AspectMode>('16:9');
  const showCaptionsRef = useRef(true);
  const expressionsEnabledRef = useRef(expressionsEnabled);
  const isScrubbingRef = useRef(false);
  const isRecordingRef = useRef(false);
  const [activeChapterIdx, setActiveChapterIdx] = useState<number | 'all'>('all');
  const episodeChapters = useMemo(
    () => partitionEpisodeIntoChapters(episode, 200),
    [episode]
  );

  useEffect(() => {
    setActiveChapterIdx('all');
  }, [episode.id]);

  useEffect(() => {
    onionSkinRef.current = onionSkin;
  }, [onionSkin]);

  useEffect(() => {
    safeZonesRef.current = safeZones;
  }, [safeZones]);

  useEffect(() => {
    episodeRef.current = episode;
    // Track labeled Undo/Redo history checkpoints (coalescing rapid slider/typing changes within 400ms)
    if (skipNextHistoryRef.current) {
      skipNextHistoryRef.current = false;
      pendingHistoryLabelRef.current = null;
      prevEpisodeForHistoryRef.current = episode;
      return;
    }
    const prev = prevEpisodeForHistoryRef.current;
    if (prev !== episode) {
      const now = Date.now();
      const explicitLabel = pendingHistoryLabelRef.current;
      pendingHistoryLabelRef.current = null;
      const sameStructure = prev.id === episode.id && prev.beats.length === episode.beats.length;
      const shouldCoalesce =
        !explicitLabel && sameStructure && now - lastHistoryPushAtRef.current < 400 && pastRef.current.length > 0;
      if (!shouldCoalesce) {
        pastRef.current.push({
          episode: cloneEpisode(prev),
          label: explicitLabel || inferHistoryLabel(prev, episode),
          savedAt: now,
        });
        if (pastRef.current.length > 40) pastRef.current.shift();
        lastHistoryPushAtRef.current = now;
      }
      futureRef.current = [];
      prevEpisodeForHistoryRef.current = episode;
      setCanUndo(pastRef.current.length > 0);
      setCanRedo(false);
      setHistoryCounts({ undo: pastRef.current.length, redo: 0 });
    }
  }, [episode]);

  useEffect(() => {
    if (!historyOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (historyMenuRef.current && !historyMenuRef.current.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
    };
    window.addEventListener('mousedown', onOutside);
    return () => window.removeEventListener('mousedown', onOutside);
  }, [historyOpen]);

  // Hydrate saved projects & autosaved draft + persisted voiceover clips from IndexedDB Vault
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [projects, autosave] = await Promise.all([
          listSavedProjects(),
          loadAutosaveProject(),
        ]);
        if (cancelled) return;
        setSavedProjects(projects);

        if (autosave?.episode) {
          const valid = validateEpisodeScript(autosave.episode);
          if (valid.ok) {
            skipNextHistoryRef.current = true;
            setEpisode(valid.script);
            setJsonDraft(JSON.stringify(valid.script, null, 2));
            if (autosave.aspect === '9:16' || autosave.aspect === '16:9') {
              setAspect(autosave.aspect);
            }
            setAutosaveAt(autosave.savedAt || Date.now());
          }
        }

        const [blobs, persistedStem] = await Promise.all([
          loadVoiceBlobsForProject(AUTOSAVE_PROJECT_ID),
          loadMusicStemFromVault(AUTOSAVE_PROJECT_ID),
        ]);
        if (cancelled) return;
        if (blobs.length > 0) {
          if (!audioRef.current) audioRef.current = new KathaAudioEngine();
          const restoredMeta: Record<string, { fileName: string; duration: number }> = {};
          const useLazy = blobs.length > 24;
          for (let i = 0; i < blobs.length; i++) {
            const item = blobs[i];
            const parsed = parseVoiceSlotKey(item.beatId);
            const activeBeatId = parsed.beatId || item.beatId;
            voiceBlobsRef.current.set(activeBeatId, {
              blob: item.blob,
              fileName: item.fileName,
              duration: item.duration,
            });
            if (useLazy && i >= 12) {
              const clip = audioRef.current.registerLazyVoiceBlob(
                activeBeatId,
                item.blob,
                item.fileName,
                item.duration
              );
              restoredMeta[activeBeatId] = { fileName: clip.fileName, duration: clip.duration };
            } else {
              try {
                const clip = await audioRef.current.loadVoiceBlob(activeBeatId, item.blob, item.fileName);
                restoredMeta[activeBeatId] = { fileName: clip.fileName, duration: clip.duration };
              } catch {
                restoredMeta[activeBeatId] = { fileName: item.fileName, duration: item.duration };
              }
            }
          }
          if (!cancelled && Object.keys(restoredMeta).length > 0) {
            setVoiceMeta(restoredMeta);
          }
        }
        if (persistedStem && !cancelled) {
          if (!audioRef.current) audioRef.current = new KathaAudioEngine();
          musicStemBlobRef.current = {
            blob: persistedStem.blob,
            fileName: persistedStem.fileName,
            duration: persistedStem.duration,
          };
          try {
            const meta = await audioRef.current.loadMusicStem(persistedStem.blob, persistedStem.fileName);
            if (!cancelled) setMusicStemMeta(meta);
          } catch {
            if (!cancelled) {
              setMusicStemMeta({ fileName: persistedStem.fileName, duration: persistedStem.duration });
            }
          }
        }
      } catch {
        // Ignore IndexedDB unavailability in private contexts
      } finally {
        if (!cancelled) vaultHydratedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced autosave to IndexedDB Vault whenever episode, aspect, voice clips, or music stem changes
  useEffect(() => {
    if (!vaultHydratedRef.current) return;
    const timer = window.setTimeout(() => {
      const count = Object.keys(voiceMeta).length;
      void saveAutosaveProject(episode, aspect, count, Boolean(musicStemMeta)).then(() => {
        setAutosaveAt(Date.now());
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [episode, aspect, voiceMeta, musicStemMeta]);

  useEffect(() => {
    stageMoveModeRef.current = stageMoveMode;
  }, [stageMoveMode]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    audioRef.current?.setPlaying(isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    audioRef.current?.setSpatialAudio(episode.visualStyle?.spatialAudio !== false);
  }, [episode.visualStyle?.spatialAudio]);
  useEffect(() => {
    aspectRef.current = aspect;
  }, [aspect]);
  useEffect(() => {
    showCaptionsRef.current = showCaptions;
  }, [showCaptions]);
  useEffect(() => {
    expressionsEnabledRef.current = expressionsEnabled;
    try {
      localStorage.setItem('katha_studio_expressions_enabled', String(expressionsEnabled));
    } catch {
      // ignore storage quota errors
    }
  }, [expressionsEnabled]);
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const totalDuration = useMemo(() => getEpisodeDuration(episode), [episode]);
  const selectedBeat = episode.beats[selectedBeatIdx] || episode.beats[0];

  const beatStarts = useMemo(() => {
    const starts: number[] = [];
    let acc = 0;
    for (const b of episode.beats) {
      starts.push(acc);
      acc += Math.max(1.2, b.duration);
    }
    return starts;
  }, [episode]);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = new KathaAudioEngine();
    if (!audioRef.current.unlocked) audioRef.current.unlock();
  }, []);

  const toggleSound = useCallback(() => {
    ensureAudio();
    setMuted((prev) => {
      const next = !prev;
      audioRef.current?.setMuted(next);
      audioRef.current?.setPlaying(isPlayingRef.current);
      return next;
    });
  }, [ensureAudio]);

  const jumpToTime = useCallback((sec: number) => {
    const dur = getEpisodeDuration(episodeRef.current);
    const clamped = Math.max(0, Math.min(dur - 0.02, sec));
    timeRef.current = clamped;
    audioRef.current?.reset();
    setCurrentTime(clamped);
    const ev = evaluateEpisodeAtTime(episodeRef.current, clamped, null);
    setActiveBeatIdx(ev.beatIndex);
  }, []);

  const handleReplay = useCallback(() => {
    timeRef.current = 0;
    audioRef.current?.reset();
    setCurrentTime(0);
    setActiveBeatIdx(0);
    setSelectedBeatIdx(0);
    setIsPlaying(true);
  }, []);

  const handleUndo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const prevSnap = pastRef.current.pop()!;
    futureRef.current.push({
      episode: cloneEpisode(episodeRef.current),
      label: prevSnap.label,
      savedAt: Date.now(),
    });
    if (futureRef.current.length > 40) futureRef.current.shift();
    skipNextHistoryRef.current = true;
    setEpisode(prevSnap.episode);
    setJsonDraft(JSON.stringify(prevSnap.episode, null, 2));
    setSelectedBeatIdx((idx) => Math.min(idx, Math.max(0, prevSnap.episode.beats.length - 1)));
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
    setHistoryCounts({ undo: pastRef.current.length, redo: futureRef.current.length });
    setExportNotice(`Undid (${prevSnap.label})`);
    setTimeout(() => setExportNotice(null), 2200);
  }, []);

  const handleRedo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const nextSnap = futureRef.current.pop()!;
    pastRef.current.push({
      episode: cloneEpisode(episodeRef.current),
      label: nextSnap.label,
      savedAt: Date.now(),
    });
    if (pastRef.current.length > 40) pastRef.current.shift();
    skipNextHistoryRef.current = true;
    setEpisode(nextSnap.episode);
    setJsonDraft(JSON.stringify(nextSnap.episode, null, 2));
    setSelectedBeatIdx((idx) => Math.min(idx, Math.max(0, nextSnap.episode.beats.length - 1)));
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
    setHistoryCounts({ undo: pastRef.current.length, redo: futureRef.current.length });
    setExportNotice(`Redid (${nextSnap.label})`);
    setTimeout(() => setExportNotice(null), 2200);
  }, []);

  const handleRestoreCheckpoint = useCallback((stackIdx: number) => {
    if (stackIdx < 0 || stackIdx >= pastRef.current.length) return;
    const target = pastRef.current[stackIdx];
    const popped = pastRef.current.splice(stackIdx);
    // Push current state + newer checkpoints onto redo stack so user can redo back if needed
    futureRef.current.push({
      episode: cloneEpisode(episodeRef.current),
      label: popped[popped.length - 1]?.label || 'Restored checkpoint',
      savedAt: Date.now(),
    });
    for (let i = popped.length - 1; i >= 1; i--) {
      futureRef.current.push(popped[i]);
    }
    if (futureRef.current.length > 40) {
      futureRef.current = futureRef.current.slice(-40);
    }
    skipNextHistoryRef.current = true;
    setEpisode(target.episode);
    setJsonDraft(JSON.stringify(target.episode, null, 2));
    setSelectedBeatIdx((idx) => Math.min(idx, Math.max(0, target.episode.beats.length - 1)));
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
    setHistoryCounts({ undo: pastRef.current.length, redo: futureRef.current.length });
    setHistoryOpen(false);
    setExportNotice(`Restored checkpoint: ${target.label}`);
    setTimeout(() => setExportNotice(null), 2500);
  }, []);

  const handleGenerateProceduralBackdrop = useCallback(
    (scope: 'scene' | 'act') => {
      const curBeat = episodeRef.current.beats[selectedBeatIdx];
      if (!curBeat) return;
      const { dataUrl, label } = generateProceduralBackdropDataUrl({
        theme: procBackdropTheme,
        mood: curBeat.mood,
        seed: procBackdropSeed,
      });
      if (!dataUrl) return;

      if (scope === 'scene') {
        pendingHistoryLabelRef.current = `Before painting Scene ${selectedBeatIdx + 1} (${label})`;
        setEpisode((prev) => {
          const beats = prev.beats.map((b, idx) =>
            idx === selectedBeatIdx
              ? { ...b, customBackdropDataUrl: dataUrl, customBackdropLabel: label }
              : b
          );
          const next = { ...prev, beats };
          setJsonDraft(JSON.stringify(next, null, 2));
          return next;
        });
        setExportNotice(`Painted custom plate "${label}" onto Scene ${selectedBeatIdx + 1}`);
      } else {
        // Apply to current chapter/act window (up to 6 consecutive narrative scenes around selectedBeatIdx)
        const chapters = partitionEpisodeIntoChapters(episodeRef.current, 200);
        const owner = chapters.find(
          (ch) => selectedBeatIdx >= ch.startBeatIdx && selectedBeatIdx <= ch.endBeatIdx
        );
        const startIdx = owner ? owner.startBeatIdx : Math.max(0, selectedBeatIdx);
        const endIdx = owner
          ? owner.endBeatIdx
          : Math.min(episodeRef.current.beats.length - 1, selectedBeatIdx + 5);
        pendingHistoryLabelRef.current = `Before painting Scenes ${startIdx + 1}–${endIdx + 1} (${label})`;
        setEpisode((prev) => {
          const beats = prev.beats.map((b, idx) => {
            if (idx < startIdx || idx > endIdx) return b;
            if (b.frame === 'chapter_title' || b.frame === 'moral_card' || b.frame === 'end_screen') return b;
            return { ...b, customBackdropDataUrl: dataUrl, customBackdropLabel: label };
          });
          const next = { ...prev, beats };
          setJsonDraft(JSON.stringify(next, null, 2));
          return next;
        });
        setExportNotice(`Painted "${label}" across Scenes ${startIdx + 1}–${endIdx + 1}`);
      }
      setTimeout(() => setExportNotice(null), 2600);
    },
    [procBackdropSeed, procBackdropTheme, selectedBeatIdx]
  );

  const handleApplyActVisualArc = useCallback(() => {
    const result = applyActVisualProgression(episodeRef.current, actArcPreset);
    pendingHistoryLabelRef.current = `Before 4-Act Visual Arc (${result.preset.label.split(' (')[0]})`;
    setEpisode(result.episode);
    setJsonDraft(JSON.stringify(result.episode, null, 2));
    setExportNotice(result.summary);
    setTimeout(() => setExportNotice(null), 3200);
  }, [actArcPreset]);

  const handleGenerateProceduralProp = useCallback(() => {
    const { dataUrl, label } = generateProceduralPropDataUrl({
      preset: procPropPreset,
      seed: procPropSeed,
    });
    if (!dataUrl) return;
    pendingHistoryLabelRef.current = `Before custom prop "${label}" on Scene ${selectedBeatIdx + 1}`;
    setEpisode((prev) => {
      const beats = prev.beats.map((b, idx) =>
        idx === selectedBeatIdx
          ? { ...b, customPropDataUrl: dataUrl, customPropLabel: label }
          : b
      );
      const next = { ...prev, beats };
      setJsonDraft(JSON.stringify(next, null, 2));
      return next;
    });
    setExportNotice(`Placed custom cutout "${label}" in Scene ${selectedBeatIdx + 1}`);
    setTimeout(() => setExportNotice(null), 2400);
  }, [procPropPreset, procPropSeed, selectedBeatIdx]);

  const loadPreset = useCallback((preset: EpisodeScript) => {
    const fresh = cloneEpisode(preset);
    audioRef.current?.clearAllVoiceClips();
    voiceBlobsRef.current.clear();
    setVoiceMeta({});
    void replaceAutosaveVoiceBlobs([]);
    setEpisode(fresh);
    setJsonDraft(JSON.stringify(fresh, null, 2));
    setJsonError(null);
    setSelectedBeatIdx(0);
    setActiveBeatIdx(0);
    timeRef.current = 0;
    audioRef.current?.reset();
    setCurrentTime(0);
    setIsPlaying(true);
    setLibraryOpen(false);
  }, []);

  const handleSaveNamedProject = useCallback(async (name: string) => {
    await saveNamedProject(
      name,
      episodeRef.current,
      aspectRef.current,
      voiceBlobsRef.current,
      musicStemBlobRef.current
    );
    const updatedList = await listSavedProjects();
    setSavedProjects(updatedList);
  }, []);

  const handleLoadSavedProject = useCallback(async (record: SavedProjectRecord) => {
    const valid = validateEpisodeScript(record.episode);
    if (valid.ok === false) return;
    const fresh = cloneEpisode(valid.script);
    audioRef.current?.clearAllVoiceClips();
    audioRef.current?.clearMusicStem();
    voiceBlobsRef.current.clear();
    musicStemBlobRef.current = null;
    setMusicStemMeta(null);

    const [persisted, persistedStem] = await Promise.all([
      loadVoiceBlobsForProject(record.id),
      loadMusicStemFromVault(record.id),
    ]);
    const restoredMeta: Record<string, { fileName: string; duration: number }> = {};
    if (persisted.length > 0) {
      if (!audioRef.current) audioRef.current = new KathaAudioEngine();
      const useLazy = persisted.length > 24;
      for (let i = 0; i < persisted.length; i++) {
        const item = persisted[i];
        const parsed = parseVoiceSlotKey(item.beatId);
        const activeBeatId = parsed.beatId || item.beatId;
        voiceBlobsRef.current.set(activeBeatId, {
          blob: item.blob,
          fileName: item.fileName,
          duration: item.duration,
        });
        if (useLazy && i >= 12) {
          const clip = audioRef.current.registerLazyVoiceBlob(
            activeBeatId,
            item.blob,
            item.fileName,
            item.duration
          );
          restoredMeta[activeBeatId] = { fileName: clip.fileName, duration: clip.duration };
        } else {
          try {
            const clip = await audioRef.current.loadVoiceBlob(activeBeatId, item.blob, item.fileName);
            restoredMeta[activeBeatId] = { fileName: clip.fileName, duration: clip.duration };
          } catch {
            restoredMeta[activeBeatId] = { fileName: item.fileName, duration: item.duration };
          }
        }
      }
    }
    if (persistedStem) {
      if (!audioRef.current) audioRef.current = new KathaAudioEngine();
      musicStemBlobRef.current = {
        blob: persistedStem.blob,
        fileName: persistedStem.fileName,
        duration: persistedStem.duration,
      };
      void saveMusicStemToVault(
        AUTOSAVE_PROJECT_ID,
        persistedStem.blob,
        persistedStem.fileName,
        persistedStem.duration
      );
      try {
        const meta = await audioRef.current.loadMusicStem(persistedStem.blob, persistedStem.fileName);
        setMusicStemMeta(meta);
      } catch {
        setMusicStemMeta({ fileName: persistedStem.fileName, duration: persistedStem.duration });
      }
    } else {
      void deleteMusicStemFromVault(AUTOSAVE_PROJECT_ID);
    }
    void replaceAutosaveVoiceBlobs(
      persisted.map((p) => ({
        beatId: p.beatId,
        blob: p.blob,
        fileName: p.fileName,
        duration: p.duration,
      }))
    );
    setVoiceMeta(restoredMeta);
    setEpisode(fresh);
    setJsonDraft(JSON.stringify(fresh, null, 2));
    setAspect(record.aspect === '9:16' ? '9:16' : '16:9');
    setJsonError(null);
    setSelectedBeatIdx(0);
    setActiveBeatIdx(0);
    timeRef.current = 0;
    audioRef.current?.reset();
    setCurrentTime(0);
    setIsPlaying(true);
  }, []);

  const handleDeleteSavedProject = useCallback(async (id: string) => {
    await deleteSavedProject(id);
    const updatedList = await listSavedProjects();
    setSavedProjects(updatedList);
  }, []);

  const handleExportKathaArchive = useCallback(async () => {
    try {
      const voices = await Promise.all(
        Array.from(voiceBlobsRef.current.entries()).map(async ([slotKey, v]) => ({
          slotKey,
          fileName: v.fileName,
          mimeType: v.blob.type || 'audio/wav',
          duration: v.duration,
          bytes: new Uint8Array(await v.blob.arrayBuffer()),
        }))
      );
      const stem = musicStemBlobRef.current
        ? {
            fileName: musicStemBlobRef.current.fileName,
            mimeType: musicStemBlobRef.current.blob.type || 'audio/wav',
            duration: musicStemBlobRef.current.duration,
            bytes: new Uint8Array(await musicStemBlobRef.current.blob.arrayBuffer()),
          }
        : null;
      let castVoices: Record<string, { voiceId: string; style: string }> | undefined;
      try {
        const raw = localStorage.getItem(CAST_VOICES_STORAGE_KEY);
        if (raw) castVoices = JSON.parse(raw);
      } catch {
        // optional
      }
      const bytes = exportKathaArchiveBytes({
        version: 1,
        exportedAt: Date.now(),
        aspect: aspectRef.current,
        episode: episodeRef.current,
        brandKit: loadBrandKit(),
        castVoices,
        lookRecipes: loadLookRecipes(),
        voices,
        musicStem: stem,
      });
      const ab = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(ab).set(bytes);
      const blob = new Blob([ab], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${episodeRef.current.id || 'episode'}.katha`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setExportNotice(
        `Exported portable .katha bundle (${voices.length} voice clip${voices.length === 1 ? '' : 's'}${stem ? ' + music stem' : ''}).`
      );
    } catch (err) {
      setExportNotice(err instanceof Error ? err.message : 'Failed to export .katha archive.');
    }
  }, []);

  const handleImportKathaArchive = useCallback(async (file: File) => {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const bundle = parseKathaArchiveBytes(bytes);

      audioRef.current?.clearAllVoiceClips();
      audioRef.current?.clearMusicStem();
      voiceBlobsRef.current.clear();
      musicStemBlobRef.current = null;
      setMusicStemMeta(null);

      const restoredMeta: Record<string, { fileName: string; duration: number }> = {};
      const autosaveVoices: Array<{ beatId: string; blob: Blob; fileName: string; duration: number }> = [];

      if (bundle.voices.length > 0) {
        if (!audioRef.current) audioRef.current = new KathaAudioEngine();
        for (const v of bundle.voices) {
          const ab = new ArrayBuffer(v.bytes.byteLength);
          new Uint8Array(ab).set(v.bytes);
          const blob = new Blob([ab], { type: v.mimeType || 'audio/wav' });
          const parsed = parseVoiceSlotKey(v.slotKey);
          const activeBeatId = parsed.beatId || v.slotKey;
          voiceBlobsRef.current.set(activeBeatId, { blob, fileName: v.fileName, duration: v.duration });
          autosaveVoices.push({ beatId: activeBeatId, blob, fileName: v.fileName, duration: v.duration });
          try {
            const clip = await audioRef.current.loadVoiceBlob(activeBeatId, blob, v.fileName);
            restoredMeta[activeBeatId] = { fileName: clip.fileName, duration: clip.duration };
          } catch {
            restoredMeta[activeBeatId] = { fileName: v.fileName, duration: v.duration };
          }
        }
      }
      void replaceAutosaveVoiceBlobs(autosaveVoices);

      if (bundle.musicStem) {
        if (!audioRef.current) audioRef.current = new KathaAudioEngine();
        const ab = new ArrayBuffer(bundle.musicStem.bytes.byteLength);
        new Uint8Array(ab).set(bundle.musicStem.bytes);
        const blob = new Blob([ab], { type: bundle.musicStem.mimeType || 'audio/wav' });
        musicStemBlobRef.current = {
          blob,
          fileName: bundle.musicStem.fileName,
          duration: bundle.musicStem.duration,
        };
        void saveMusicStemToVault(
          AUTOSAVE_PROJECT_ID,
          blob,
          bundle.musicStem.fileName,
          bundle.musicStem.duration
        );
        try {
          const meta = await audioRef.current.loadMusicStem(blob, bundle.musicStem.fileName);
          setMusicStemMeta(meta);
        } catch {
          setMusicStemMeta({ fileName: bundle.musicStem.fileName, duration: bundle.musicStem.duration });
        }
      } else {
        void deleteMusicStemFromVault(AUTOSAVE_PROJECT_ID);
      }

      if (bundle.brandKit) {
        const savedKit = saveBrandKit(bundle.brandKit);
        setBrandKit(savedKit);
      }
      if (bundle.castVoices) {
        try {
          localStorage.setItem(CAST_VOICES_STORAGE_KEY, JSON.stringify(bundle.castVoices));
        } catch {
          // ignore
        }
      }
      if (bundle.lookRecipes && bundle.lookRecipes.length > 0) {
        saveLookRecipes(mergeLookRecipes(loadLookRecipes(), bundle.lookRecipes));
      }

      setVoiceMeta(restoredMeta);
      setEpisode(bundle.episode);
      setJsonDraft(JSON.stringify(bundle.episode, null, 2));
      setAspect(bundle.aspect);
      setSelectedBeatIdx(0);
      setActiveBeatIdx(0);
      timeRef.current = 0;
      audioRef.current?.reset();
      setCurrentTime(0);
      setIsPlaying(true);
      setExportNotice(
        `Imported "${bundle.episode.title}" (.katha · ${bundle.voices.length} voice clip${bundle.voices.length === 1 ? '' : 's'}${bundle.musicStem ? ' + music stem' : ''}).`
      );
    } catch (err) {
      setExportNotice(err instanceof Error ? err.message : 'Invalid .katha project bundle.');
    }
  }, []);

  const groupedLibrary = useMemo(() => {
    const shelfOrder: StorybookShelf[] = [
      'Modern Multi-Genre Showcases',
      'Supernatural & Royal Legends',
      'Animal Fables & Strategy',
      'Royal Court Wit & Satire',
      'Sacred Epics & Puranas',
      'Western Folklore & Fables',
      'East Asian Tales & Epics',
      'Southeast Asian Folklore',
      'Americas & Indigenous Legends',
      'African Griot & Trickster Tales',
    ];
    return shelfOrder
      .map((shelf) => ({
        shelf,
        episodes: PRESET_EPISODES.filter((ep) => (ep.shelf || 'Supernatural & Royal Legends') === shelf),
      }))
      .filter((g) => g.episodes.length > 0);
  }, []);

  useEffect(() => {
    if (!libraryOpen) return;
    const onDown = (e: MouseEvent) => {
      if (libraryMenuRef.current && !libraryMenuRef.current.contains(e.target as Node)) {
        setLibraryOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLibraryOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [libraryOpen]);

  const updateSelectedBeat = useCallback(
    (patch: Partial<StoryBeat>, historyLabel?: string) => {
      if (historyLabel) {
        pendingHistoryLabelRef.current = historyLabel;
      }
      setEpisode((prev) => {
        const nextBeats = prev.beats.map((b, i) => {
          if (i !== selectedBeatIdx) return b;
          const base =
            patch.duration !== undefined && patch.actors === undefined && patch.duration !== b.duration
              ? retimeBeatExpressionTracks(b, patch.duration)
              : b;
          return { ...base, ...patch };
        });
        const updated = { ...prev, beats: nextBeats };
        setJsonDraft(JSON.stringify(updated, null, 2));
        return updated;
      });
    },
    [selectedBeatIdx]
  );

  const resolvedStyle = useMemo(
    () => resolveVisualStyle(episode.visualStyle),
    [episode.visualStyle]
  );

  const updateVisualStyle = useCallback((patch: Partial<EpisodeVisualStyle>) => {
    setEpisode((prev) => {
      const merged = { ...resolveVisualStyle(prev.visualStyle), ...patch };
      const updated = { ...prev, visualStyle: merged };
      setJsonDraft(JSON.stringify(updated, null, 2));
      return updated;
    });
  }, []);

  const handleSelectRenderStyle = useCallback(
    (renderStyle: RenderStyleId) => {
      updateVisualStyle({ renderStyle });
    },
    [updateVisualStyle]
  );

  const handleSelectMotionCadence = useCallback(
    (motionCadence: MotionCadenceId) => {
      updateVisualStyle({ motionCadence });
    },
    [updateVisualStyle]
  );

  const handleSelectMotionProfile = useCallback(
    (motionProfile: MotionProfileId) => {
      updateVisualStyle({ motionProfile });
    },
    [updateVisualStyle]
  );

  const handleSelectPostFxPass = useCallback(
    (postFxPass: PostFxPassId) => {
      updateVisualStyle({ postFxPass });
    },
    [updateVisualStyle]
  );

  const handlePolishAnimationPrinciples = useCallback(() => {
    pendingHistoryLabelRef.current = '12-Principles Polish';
    setEpisode((prev) => {
      const polished = applyAnimationPrinciplesAutoPolish(prev);
      setJsonDraft(JSON.stringify(polished.episode, null, 2));
      return polished.episode;
    });
  }, []);

  const handleMatchShelfStyle = useCallback(() => {
    const rec = getRecommendedRenderStyle(episodeRef.current);
    updateVisualStyle({ renderStyle: rec });
  }, [updateVisualStyle]);

  const applyLookPreset = useCallback((presetStyle: EpisodeVisualStyle) => {
    setEpisode((prev) => {
      const updated = { ...prev, visualStyle: { ...presetStyle } };
      setJsonDraft(JSON.stringify(updated, null, 2));
      return updated;
    });
  }, []);

  const updateCastMember = useCallback((castId: string, patch: Partial<CastMember>) => {
    setEpisode((prev) => {
      const nextCast = prev.cast.map((c) => {
        if (c.id !== castId) return c;
        const next: CastMember = { ...c, ...patch };
        if (next.dna) {
          next.dna = {
            ...next.dna,
            palette: {
              ...next.dna.palette,
              ...(patch.primaryColor ? { primary: patch.primaryColor } : {}),
              ...(patch.accentColor ? { accent: patch.accentColor } : {}),
              ...(patch.skinColor ? { skin: patch.skinColor } : {}),
            },
          };
        }
        return next;
      });
      const updated = { ...prev, cast: nextCast };
      setJsonDraft(JSON.stringify(updated, null, 2));
      return updated;
    });
  }, []);

  const openWorkshopForNewEntity = useCallback(() => {
    const newId = `entity_${Date.now().toString(36)}`;
    const freshDna = createBaseDna('humanoid');
    const freshMember = syncMemberWithDna(
      {
        id: newId,
        name: `Custom Entity ${episodeRef.current.cast.length + 1}`,
        archetype: 'king',
        primaryColor: freshDna.palette.primary,
        accentColor: freshDna.palette.accent,
        skinColor: freshDna.palette.skin,
      },
      freshDna
    );
    setWorkshopTarget({ member: freshMember, isNew: true });
  }, []);

  const openWorkshopForCastId = useCallback((castId?: string) => {
    const target =
      (castId ? episodeRef.current.cast.find((c) => c.id === castId) : undefined) ||
      episodeRef.current.cast[0];
    if (target) {
      setWorkshopTarget({ member: target, isNew: false });
    } else {
      openWorkshopForNewEntity();
    }
  }, [openWorkshopForNewEntity]);

  const handleSaveWorkshopMember = useCallback(
    (savedMember: CastMember, options?: { addToCurrentBeat?: boolean }) => {
      setEpisode((prev) => {
        const exists = prev.cast.some((c) => c.id === savedMember.id);
        const nextCast = exists
          ? prev.cast.map((c) => (c.id === savedMember.id ? savedMember : c))
          : [...prev.cast, savedMember];

        let nextBeats = prev.beats;
        if (!exists && options?.addToCurrentBeat) {
          nextBeats = prev.beats.map((b, i) => {
            if (i !== selectedBeatIdx) return b;
            const nextActors = [...b.actors];
            if (nextActors.length >= 2) {
              nextActors[1] = { ...nextActors[1], castId: savedMember.id };
            } else {
              nextActors.push({
                castId: savedMember.id,
                slot: nextActors.length === 0 ? 'left' : 'right',
                pose: 'stand',
                expression: 'warm',
                facing: nextActors.length === 0 ? 'right' : 'left',
              });
            }
            return { ...b, actors: nextActors };
          });
        }

        const updated = { ...prev, cast: nextCast, beats: nextBeats };
        setJsonDraft(JSON.stringify(updated, null, 2));
        return updated;
      });
      setExportNotice(`Saved "${savedMember.name}" custom Entity DNA to cast.`);
    },
    [selectedBeatIdx]
  );

  const handleSaveWorkshopToBible = useCallback((savedMember: CastMember) => {
    const current = loadCastBible();
    upsertMemberInBible(current, savedMember, `${episodeRef.current.series} · Custom Entity DNA`);
    setExportNotice(`Locked "${savedMember.name}" into Channel Cast Bible.`);
  }, []);

  const addBeat = useCallback(() => {
    setEpisode((prev) => {
      const template = prev.beats[selectedBeatIdx] || prev.beats[prev.beats.length - 1];
      const newBeat: StoryBeat = {
        ...JSON.parse(JSON.stringify(template)),
        id: `beat_${Date.now().toString(36)}`,
        title: `Scene ${prev.beats.length + 1}`,
        dialogue: 'Add voiceover dialogue or paste an AI-generated beat here.',
      };
      const nextBeats = [...prev.beats, newBeat];
      const updated = { ...prev, beats: nextBeats };
      setJsonDraft(JSON.stringify(updated, null, 2));
      setSelectedBeatIdx(nextBeats.length - 1);
      return updated;
    });
  }, [selectedBeatIdx]);

  const deleteSelectedBeat = useCallback(() => {
    setEpisode((prev) => {
      if (prev.beats.length <= 1) return prev;
      const nextBeats = prev.beats.filter((_, i) => i !== selectedBeatIdx);
      const updated = { ...prev, beats: nextBeats };
      setJsonDraft(JSON.stringify(updated, null, 2));
      setSelectedBeatIdx(Math.max(0, selectedBeatIdx - 1));
      timeRef.current = 0;
      return updated;
    });
  }, [selectedBeatIdx]);

  const handleDuplicateSelectedBeat = useCallback(() => {
    setEpisode((prev) => {
      const { beats: nextBeats, newIdx } = duplicateBeat(prev.beats, selectedBeatIdx);
      const updated = { ...prev, beats: nextBeats };
      setJsonDraft(JSON.stringify(updated, null, 2));
      setSelectedBeatIdx(newIdx);
      return updated;
    });
  }, [selectedBeatIdx]);

  const handleSplitSelectedBeat = useCallback(() => {
    setEpisode((prev) => {
      const { beats: nextBeats, newIdx } = splitBeatAtMidpoint(prev.beats, selectedBeatIdx);
      const updated = { ...prev, beats: nextBeats };
      setJsonDraft(JSON.stringify(updated, null, 2));
      setSelectedBeatIdx(newIdx);
      return updated;
    });
  }, [selectedBeatIdx]);

  const handleReorderBeat = useCallback(
    (fromIdx: number, toIdx: number) => {
      if (fromIdx === toIdx) return;
      setEpisode((prev) => {
        const nextBeats = reorderBeats(prev.beats, fromIdx, toIdx);
        const updated = { ...prev, beats: nextBeats };
        setJsonDraft(JSON.stringify(updated, null, 2));
        return updated;
      });
      setSelectedBeatIdx(toIdx);
    },
    []
  );

  const handleAddEndScreenBeat = useCallback(() => {
    setEpisode((prev) => {
      const outro = createYoutubeEndScreenBeat(prev, brandKit);
      const nextBeats = [...prev.beats, outro];
      const updated = { ...prev, beats: nextBeats };
      setJsonDraft(JSON.stringify(updated, null, 2));
      setSelectedBeatIdx(nextBeats.length - 1);
      return updated;
    });
    setExportNotice('Added 12s YouTube End-Screen safe-zone outro card.');
  }, [brandKit]);

  const handleResizeBeatDuration = useCallback((idx: number, newDuration: number) => {
    const clamped = Number(Math.max(1.5, Math.min(18, newDuration)).toFixed(1));
    pendingHistoryLabelRef.current = `Trim Scene ${idx + 1} (${clamped}s)`;
    setEpisode((prev) => {
      if (idx < 0 || idx >= prev.beats.length) return prev;
      const nextBeats = prev.beats.map((b, i) => (i === idx ? { ...b, duration: clamped } : b));
      const updated = { ...prev, beats: nextBeats };
      setJsonDraft(JSON.stringify(updated, null, 2));
      return updated;
    });
  }, []);

  const handleApplyCinematicJCuts = useCallback(() => {
    pendingHistoryLabelRef.current = 'Apply Cinematic J-Cuts';
    setEpisode((prev) => {
      const { beats: nextBeats, updatedCount } = applyCinematicJCuts(prev.beats, 0.3);
      if (updatedCount === 0) {
        setExportNotice('Cinematic J-Cuts are already applied across spoken dialogue cuts.');
        return prev;
      }
      const updated = { ...prev, beats: nextBeats };
      setJsonDraft(JSON.stringify(updated, null, 2));
      setExportNotice(`Applied cinematic J-Cut audio overlap across ${updatedCount} scene transitions.`);
      return updated;
    });
  }, []);

  const updateBrandKitState = useCallback((patch: Partial<ChannelBrandKit>) => {
    setBrandKit((prev) => saveBrandKit({ ...prev, ...patch }));
  }, []);

  const addArchetypeToEpisode = useCallback(
    (arch: ArchetypeId, label: string) => {
      const newId = `${arch}_${episode.cast.length + 1}`;
      const col = ARCHETYPE_DEFAULT_COLORS[arch] || ARCHETYPE_DEFAULT_COLORS.king;
      setEpisode((prev) => {
        const existing = prev.cast.find((c) => c.archetype === arch);
        const castId = existing ? existing.id : newId;
        const nextCast = existing
          ? prev.cast
          : [
              ...prev.cast,
              {
                id: newId,
                name: label,
                archetype: arch,
                primaryColor: col.primary,
                accentColor: col.accent,
                skinColor: col.skin,
              },
            ];
        const nextBeats = prev.beats.map((b, i) => {
          if (i !== selectedBeatIdx) return b;
          const nextActors = [...b.actors];
          if (nextActors.length >= 2) {
            nextActors[1] = { ...nextActors[1], castId };
          } else {
            nextActors.push({
              castId,
              slot: nextActors.length === 0 ? 'left' : 'right',
              pose: 'stand',
              expression: 'calm',
              facing: nextActors.length === 0 ? 'right' : 'left',
            });
          }
          return { ...b, actors: nextActors };
        });
        const updated = { ...prev, cast: nextCast, beats: nextBeats };
        setJsonDraft(JSON.stringify(updated, null, 2));
        return updated;
      });
    },
    [episode.cast.length, selectedBeatIdx]
  );

  const addSpritePresetToEpisode = useCallback(
    (preset: SpriteWorkshopPreset) => {
      setEpisode((prev) => {
        const existing = prev.cast.find(
          (c) => c.id.startsWith(`sprite_${preset.id}_`) || (c.name === preset.name && Boolean(c.dna))
        );
        const member = existing || buildCastMemberFromSpritePreset(preset, prev.cast.length);
        const nextCast = existing ? prev.cast : [...prev.cast, member];
        const nextBeats = prev.beats.map((b, i) => {
          if (i !== selectedBeatIdx) return b;
          const nextActors = [...b.actors];
          if (nextActors.length >= 2) {
            nextActors[1] = { ...nextActors[1], castId: member.id };
          } else {
            nextActors.push({
              castId: member.id,
              slot: nextActors.length === 0 ? 'left' : 'right',
              pose: 'stand',
              expression: 'calm',
              facing: nextActors.length === 0 ? 'right' : 'left',
            });
          }
          return { ...b, actors: nextActors };
        });
        const updated = { ...prev, cast: nextCast, beats: nextBeats };
        setJsonDraft(JSON.stringify(updated, null, 2));
        return updated;
      });
    },
    [selectedBeatIdx]
  );

  const handleVoiceUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !selectedBeat) return;
      ensureAudio();
      try {
        const clip = await audioRef.current!.loadVoiceClip(selectedBeat.id, file);
        voiceBlobsRef.current.set(selectedBeat.id, {
          blob: file,
          fileName: clip.fileName,
          duration: clip.duration,
        });
        void saveVoiceBlobToVault(
          AUTOSAVE_PROJECT_ID,
          selectedBeat.id,
          file,
          clip.fileName,
          clip.duration
        );
        setMuted(false);
        audioRef.current?.setMuted(false);
        setVoiceMeta((prev) => ({
          ...prev,
          [selectedBeat.id]: { fileName: clip.fileName, duration: clip.duration },
        }));
        // Automatically sync beat duration to uploaded voiceover clip length + 0.35s breath!
        updateSelectedBeat({ duration: Number(Math.max(1.5, Math.min(18, clip.duration + 0.35)).toFixed(1)) });
      } catch {
        // Ignore decode failure gracefully
      }
      e.target.value = '';
    },
    [ensureAudio, selectedBeat, updateSelectedBeat]
  );

  const handleBatchVoiceUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      ensureAudio();
      const sorted = files.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );
      const beats = episodeRef.current.beats;
      const boundMeta: Record<string, { fileName: string; duration: number }> = {};
      const durationMap: Record<string, number> = {};
      let boundCount = 0;

      for (let i = 0; i < sorted.length && i < beats.length; i++) {
        const beat = beats[i];
        try {
          const clip = await audioRef.current!.loadVoiceClip(beat.id, sorted[i]);
          voiceBlobsRef.current.set(beat.id, {
            blob: sorted[i],
            fileName: clip.fileName,
            duration: clip.duration,
          });
          void saveVoiceBlobToVault(
            AUTOSAVE_PROJECT_ID,
            beat.id,
            sorted[i],
            clip.fileName,
            clip.duration
          );
          boundMeta[beat.id] = { fileName: clip.fileName, duration: clip.duration };
          durationMap[beat.id] = Number(Math.max(1.5, Math.min(18, clip.duration + 0.35)).toFixed(1));
          boundCount++;
        } catch {
          // Skip undecodable file cleanly
        }
      }

      if (boundCount > 0) {
        setMuted(false);
        audioRef.current?.setMuted(false);
        setVoiceMeta((prev) => ({ ...prev, ...boundMeta }));
        setEpisode((prev) => {
          const nextBeats = prev.beats.map((b) =>
            durationMap[b.id] !== undefined ? retimeBeatExpressionTracks(b, durationMap[b.id]) : b
          );
          const updated = { ...prev, beats: nextBeats };
          setJsonDraft(JSON.stringify(updated, null, 2));
          return updated;
        });
        setBatchVoiceFeedback(`Auto-bound ${boundCount} audio ${boundCount === 1 ? 'track' : 'tracks'}`);
        setTimeout(() => setBatchVoiceFeedback(null), 3200);
      }
      e.target.value = '';
    },
    [ensureAudio]
  );

  const handleBindVoiceBlob = useCallback(
    async (beatId: string, blob: Blob, fileName: string, autoSyncDuration: boolean) => {
      ensureAudio();
      const clip = await audioRef.current!.loadVoiceBlob(beatId, blob, fileName);
      voiceBlobsRef.current.set(beatId, {
        blob,
        fileName: clip.fileName,
        duration: clip.duration,
      });
      void saveVoiceBlobToVault(AUTOSAVE_PROJECT_ID, beatId, blob, clip.fileName, clip.duration);
      setMuted(false);
      audioRef.current?.setMuted(false);
      setVoiceMeta((prev) => ({
        ...prev,
        [beatId]: { fileName: clip.fileName, duration: clip.duration },
      }));
      if (autoSyncDuration) {
        const nextDur = Number(Math.max(1.5, Math.min(18, clip.duration + 0.35)).toFixed(1));
        setEpisode((prev) => {
          const nextBeats = prev.beats.map((b) =>
            b.id === beatId ? retimeBeatExpressionTracks(b, nextDur) : b
          );
          const updated = { ...prev, beats: nextBeats };
          setJsonDraft(JSON.stringify(updated, null, 2));
          return updated;
        });
      }
    },
    [ensureAudio]
  );

  const handleClearVoiceClip = useCallback((beatId: string) => {
    audioRef.current?.removeVoiceClip(beatId);
    voiceBlobsRef.current.delete(beatId);
    void deleteVoiceBlobFromVault(AUTOSAVE_PROJECT_ID, beatId);
    setVoiceMeta((prev) => {
      const copy = { ...prev };
      delete copy[beatId];
      return copy;
    });
  }, []);

  const handleTightenAllVoices = useCallback(async () => {
    ensureAudio();
    const entries = Array.from(voiceBlobsRef.current.entries());
    let trimmedCount = 0;
    let savedSec = 0;
    const durationUpdates = new Map<string, number>();
    const metaUpdates: Record<string, { fileName: string; duration: number }> = {};

    for (const [beatId, entry] of entries) {
      const trimmed = await trimAndNormalizeVoiceBlob(entry.blob);
      if (!trimmed.didModify) continue;
      const nextName = entry.fileName.replace(/\.[^.]+$/, '') + '.wav';
      const clip = await audioRef.current!.loadVoiceBlob(beatId, trimmed.blob, nextName);
      voiceBlobsRef.current.set(beatId, {
        blob: trimmed.blob,
        fileName: clip.fileName,
        duration: clip.duration,
      });
      void saveVoiceBlobToVault(AUTOSAVE_PROJECT_ID, beatId, trimmed.blob, clip.fileName, clip.duration);
      metaUpdates[beatId] = { fileName: clip.fileName, duration: clip.duration };
      durationUpdates.set(
        beatId,
        Number(Math.max(1.5, Math.min(18, clip.duration + 0.35)).toFixed(1))
      );
      trimmedCount++;
      savedSec += trimmed.savedSec;
    }

    if (trimmedCount > 0) {
      setVoiceMeta((prev) => ({ ...prev, ...metaUpdates }));
      pendingHistoryLabelRef.current = 'Tighten Voice Pauses';
      setEpisode((prev) => {
        const nextBeats = prev.beats.map((b) => {
          const nextDur = durationUpdates.get(b.id);
          return nextDur !== undefined ? retimeBeatExpressionTracks(b, nextDur) : b;
        });
        const updated = { ...prev, beats: nextBeats };
        setJsonDraft(JSON.stringify(updated, null, 2));
        return updated;
      });
    }

    return {
      trimmedCount,
      savedSec: Number(savedSec.toFixed(2)),
    };
  }, [ensureAudio]);

  const handleUploadMusicStem = useCallback(
    async (file: File) => {
      ensureAudio();
      const meta = await audioRef.current!.loadMusicStem(file, file.name);
      musicStemBlobRef.current = { blob: file, fileName: meta.fileName, duration: meta.duration };
      void saveMusicStemToVault(AUTOSAVE_PROJECT_ID, file, meta.fileName, meta.duration);
      setMusicStemMeta(meta);
      setMuted(false);
      audioRef.current?.setMuted(false);
    },
    [ensureAudio]
  );

  const handleClearMusicStem = useCallback(() => {
    audioRef.current?.clearMusicStem();
    musicStemBlobRef.current = null;
    void deleteMusicStemFromVault(AUTOSAVE_PROJECT_ID);
    setMusicStemMeta(null);
  }, []);

  const handleCustomBackdropUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!/^image\/(png|jpeg|jpg|webp|gif)$/i.test(file.type)) {
        setExportNotice('Custom backdrops support PNG, JPG, WebP, or GIF images only.');
        e.target.value = '';
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        setExportNotice('Custom stage backdrop must be 4 MB or smaller.');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const cleanUrl = sanitizeRasterDataUrl(reader.result);
        if (cleanUrl) {
          const cleanLabel = file.name.replace(/\.[^.]+$/, '');
          updateSelectedBeat({
            customBackdropDataUrl: cleanUrl,
            customBackdropLabel: cleanLabel,
          });
          setExportNotice(`Applied custom stage backdrop "${cleanLabel}" to Scene ${selectedBeatIdx + 1}.`);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [selectedBeatIdx, updateSelectedBeat]
  );

  const handleBrandLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!/^image\/(png|jpeg|jpg|webp|gif)$/i.test(file.type)) {
        setExportNotice('Channel watermark logo supports PNG, JPG, WebP, or GIF images only.');
        e.target.value = '';
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setExportNotice('Channel logo must be 2 MB or smaller.');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const cleanUrl = sanitizeRasterDataUrl(reader.result);
        if (cleanUrl) {
          updateBrandKitState({ logoDataUrl: cleanUrl, showWatermark: true });
          setExportNotice('Updated Channel Brand Kit watermark logo.');
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [updateBrandKitState]
  );

  const handleCustomPropUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!/^image\/(png|jpeg|jpg|webp|gif)$/i.test(file.type)) {
        setExportNotice('Custom props support PNG, JPG, WebP, or GIF images only.');
        e.target.value = '';
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        setExportNotice('Custom prop image must be 4 MB or smaller.');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string' && /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(reader.result)) {
          const cleanLabel = file.name.replace(/\.[^.]+$/, '');
          updateSelectedBeat({
            customPropDataUrl: reader.result,
            customPropLabel: cleanLabel,
          });
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [updateSelectedBeat]
  );

  const handleExportChapterJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(episodeRef.current, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${episodeRef.current.id || 'katha_chapter'}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, []);

  const handleImportChapterJson = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : '';
        const healed = healAndParseLlmJson(text);
        if (healed.ok === false) {
          setJsonError(healed.error);
          return;
        }
        const res = compileLiteOrFullToEpisode(healed.data, {
          castBible: loadCastBible(),
        });
        if (res.ok === false) {
          setJsonError(res.error);
          return;
        }
        setEpisode(res.script);
        setJsonDraft(JSON.stringify(res.script, null, 2));
        setJsonError(null);
        setSelectedBeatIdx(0);
        setActiveBeatIdx(0);
        timeRef.current = 0;
        audioRef.current?.reset();
        setIsPlaying(true);
        setJsonAppliedMsg(true);
        setTimeout(() => setJsonAppliedMsg(false), 1800);
      } catch (err) {
        setJsonError(err instanceof Error ? err.message : 'Invalid chapter JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleApplyJson = useCallback(() => {
    try {
      const healed = healAndParseLlmJson(jsonDraft);
      if (healed.ok === false) {
        setJsonError(healed.error);
        return;
      }
      const res = compileLiteOrFullToEpisode(healed.data, {
        castBible: loadCastBible(),
      });
      if (res.ok === false) {
        setJsonError(res.error);
        return;
      }
      setEpisode(res.script);
      setJsonDraft(JSON.stringify(res.script, null, 2));
      setJsonError(null);
      setSelectedBeatIdx(0);
      setActiveBeatIdx(0);
      timeRef.current = 0;
      audioRef.current?.reset();
      setIsPlaying(true);
      setJsonAppliedMsg(true);
      setTimeout(() => setJsonAppliedMsg(false), 1800);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON syntax.');
    }
  }, [jsonDraft]);

  const handleApplyExternalEpisode = useCallback((nextEpisode: EpisodeScript) => {
    const cloned = cloneEpisode(nextEpisode);
    setEpisode(cloned);
    setJsonDraft(JSON.stringify(cloned, null, 2));
    setJsonError(null);
    setSelectedBeatIdx(0);
    setActiveBeatIdx(0);
    timeRef.current = 0;
    setCurrentTime(0);
    audioRef.current?.reset();
    setIsPlaying(true);
  }, []);

  const handleApplyAnthologyVoices = useCallback(async (remappedVoices: CarriedVoiceClip[]) => {
    if (!audioRef.current) audioRef.current = new KathaAudioEngine();
    audioRef.current.clearAllVoiceClips();
    voiceBlobsRef.current.clear();
    const nextMeta: Record<string, { fileName: string; duration: number }> = {};

    for (let i = 0; i < remappedVoices.length; i++) {
      const v = remappedVoices[i];
      voiceBlobsRef.current.set(v.beatId, {
        blob: v.blob,
        fileName: v.fileName,
        duration: v.duration,
      });
      void saveVoiceBlobToVault(AUTOSAVE_PROJECT_ID, v.beatId, v.blob, v.fileName, v.duration);
      if (i < 8) {
        try {
          const clip = await audioRef.current.loadVoiceBlob(v.beatId, v.blob, v.fileName);
          nextMeta[v.beatId] = { fileName: clip.fileName, duration: clip.duration };
        } catch {
          const lazy = audioRef.current.registerLazyVoiceBlob(v.beatId, v.blob, v.fileName, v.duration);
          nextMeta[v.beatId] = { fileName: lazy.fileName, duration: lazy.duration };
        }
      } else {
        const lazy = audioRef.current.registerLazyVoiceBlob(v.beatId, v.blob, v.fileName, v.duration);
        nextMeta[v.beatId] = { fileName: lazy.fileName, duration: lazy.duration };
      }
    }
    setVoiceMeta(nextMeta);
    setMuted(false);
    audioRef.current.setMuted(false);
  }, []);

  // Rolling 4-beat lazy voice prefetch window for smooth 200+ beat long-form playback & waveform inspection
  useEffect(() => {
    if (!audioRef.current) return;
    let cancelled = false;
    const anchor = Math.max(activeBeatIdx, selectedBeatIdx);
    const upcoming: string[] = [];
    const curSel = episode.beats[selectedBeatIdx]?.id;
    if (curSel) {
      upcoming.push(curSel);
      const selClip = audioRef.current.getVoiceClip(curSel);
      if (selClip && !selClip.buffer && selClip.blob) {
        void audioRef.current.ensureVoiceClipDecoded(curSel).then((buf) => {
          if (!cancelled && buf) setVoiceDecodeTick((t) => t + 1);
        });
      }
    }
    for (let i = activeBeatIdx; i < Math.min(episode.beats.length, activeBeatIdx + 4); i++) {
      const id = episode.beats[i]?.id;
      if (id && !upcoming.includes(id)) upcoming.push(id);
    }
    if (upcoming.length > 0 && anchor >= 0) {
      audioRef.current.prefetchVoiceBeats(upcoming);
    }
    return () => {
      cancelled = true;
    };
  }, [activeBeatIdx, selectedBeatIdx, episode.beats]);

  const handleCopyPrompt = useCallback(() => {
    const pb = detectPlaybookFromText(`${episodeRef.current.series} ${episodeRef.current.title}`);
    const prompt = buildGuidedDirectorPrompt({
      mode: 'lite',
      playbook: pb,
      beatTarget: 12,
      castBible: loadCastBible(),
    });
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(prompt).catch(() => {});
    }
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  }, []);

  const handleDownloadZip = useCallback(async () => {
    setZipFeedback('Packing ZIP...');
    try {
      const { downloadAllMachinimasZip } = await import('./studio/zipBuilder');
      const { fileCount } = downloadAllMachinimasZip();
      setZipFeedback(`Saved (${fileCount} files)`);
      setTimeout(() => setZipFeedback(null), 2600);
    } catch {
      setZipFeedback(null);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startRecordingInternal = useCallback(
    (downloadFileName: string) => {
      const canvas = stageCanvasRef.current;
      if (!canvas || typeof canvas.captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
        return;
      }
      ensureAudio();
      // Automatic Unmute Guard: never let creators accidentally export a silent .webm
      if (audioRef.current?.muted) {
        setMuted(false);
        audioRef.current.setMuted(false);
        setExportNotice('Audio auto-enabled for export');
        window.setTimeout(() => setExportNotice(null), 3600);
      }
      try {
        // Ensure exact canvas output dimensions match active aspect before captureStream
        const targetW = aspectRef.current === '9:16' ? 1080 : 1920;
        const targetH = aspectRef.current === '9:16' ? 1920 : 1080;
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const ev0 = evaluateEpisodeAtTime(episodeRef.current, 0, null);
          renderEpisodeFrame(
            ctx,
            targetW,
            targetH,
            episodeRef.current,
            ev0,
            0,
            aspectRef.current,
            showCaptionsRef.current,
            expressionsEnabledRef.current
          );
        }

        const videoStream = canvas.captureStream(STUDIO_FPS);
        const tracks = [...videoStream.getVideoTracks()];
        if (audioRef.current?.recordDest && !audioRef.current.muted) {
          const aTracks = audioRef.current.recordDest.stream.getAudioTracks();
          if (aTracks.length > 0) tracks.push(...aTracks);
        }
        const combined = new MediaStream(tracks);
        const mimes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
        const chosen = mimes.find((m) => MediaRecorder.isTypeSupported(m)) || '';
        recordedChunksRef.current = [];
        const rec = new MediaRecorder(
          combined,
          chosen ? { mimeType: chosen, videoBitsPerSecond: 10_000_000 } : { videoBitsPerSecond: 10_000_000 }
        );
        rec.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) recordedChunksRef.current.push(ev.data);
        };
        rec.onstop = () => {
          setIsRecording(false);
          if (recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { type: chosen || 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = downloadFileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 4000);
            recordEpisodeExportInLedger(episodeRef.current);
          }
          const restore = restoreAfterRecordRef.current;
          if (restore) {
            restoreAfterRecordRef.current = null;
            episodeRef.current = restore.episode;
            aspectRef.current = restore.aspect;
            setEpisode(restore.episode);
            setAspect(restore.aspect);
            setSelectedBeatIdx(restore.selectedBeatIdx);
            timeRef.current = 0;
            audioRef.current?.reset();
            setCurrentTime(0);
            setActiveBeatIdx(0);
          }
        };
        mediaRecorderRef.current = rec;
        handleReplay();
        rec.start(250);
        setIsRecording(true);
      } catch {
        setIsRecording(false);
        const restore = restoreAfterRecordRef.current;
        if (restore) {
          restoreAfterRecordRef.current = null;
          episodeRef.current = restore.episode;
          aspectRef.current = restore.aspect;
          setEpisode(restore.episode);
          setAspect(restore.aspect);
          setSelectedBeatIdx(restore.selectedBeatIdx);
        }
      }
    },
    [ensureAudio, handleReplay]
  );

  const toggleRecording = useCallback(() => {
    if (isRecordingRef.current) {
      stopRecording();
      return;
    }
    const name = `${episodeRef.current.id}_${aspectRef.current === '9:16' ? 'shorts' : 'youtube'}.webm`;
    startRecordingInternal(name);
  }, [startRecordingInternal, stopRecording]);

  const handleExportShortSlice = useCallback(
    (startIdx: number, endIdx: number, hookTitle: string, useShortsPopCaptions: boolean) => {
      if (isRecordingRef.current) return;
      const orig = episodeRef.current;
      const safeStart = Math.max(0, Math.min(startIdx, orig.beats.length - 1));
      const safeEnd = Math.max(safeStart, Math.min(endIdx, orig.beats.length - 1));
      if (orig.beats.length === 0) return;

      setShortsModalOpen(false);
      restoreAfterRecordRef.current = {
        episode: orig,
        aspect: aspectRef.current,
        selectedBeatIdx,
      };

      const shortEp = buildShortSliceEpisode(
        orig,
        safeStart,
        safeEnd,
        hookTitle,
        useShortsPopCaptions
      );

      episodeRef.current = shortEp;
      aspectRef.current = '9:16';
      setEpisode(shortEp);
      setAspect('9:16');
      setSelectedBeatIdx(0);
      startRecordingInternal(`${orig.id}_short_s${safeStart + 1}-s${safeEnd + 1}.webm`);
    },
    [selectedBeatIdx, startRecordingInternal]
  );

  const handleFastRenderShortSlice = useCallback(
    (startIdx: number, endIdx: number, hookTitle: string, useShortsPopCaptions: boolean) => {
      const orig = episodeRef.current;
      if (orig.beats.length === 0) return;
      const shortEp = buildShortSliceEpisode(
        orig,
        startIdx,
        endIdx,
        hookTitle,
        useShortsPopCaptions
      );
      setFastRenderOverride({ episode: shortEp, aspect: '9:16' });
      setFastRenderOpen(true);
    },
    []
  );

  const handleExportShortKatha = useCallback(
    async (startIdx: number, endIdx: number, hookTitle: string, useShortsPopCaptions: boolean) => {
      try {
        const orig = episodeRef.current;
        if (orig.beats.length === 0) return;
        const shortEp = buildShortSliceEpisode(
          orig,
          startIdx,
          endIdx,
          hookTitle,
          useShortsPopCaptions
        );
        const includedBeatIds = new Set(shortEp.beats.map((b) => b.id));
        const voices = await Promise.all(
          Array.from(voiceBlobsRef.current.entries())
            .filter(([slotKey]) => includedBeatIds.has(slotKey))
            .map(async ([slotKey, v]) => ({
              slotKey,
              fileName: v.fileName,
              mimeType: v.blob.type || 'audio/wav',
              duration: v.duration,
              bytes: new Uint8Array(await v.blob.arrayBuffer()),
            }))
        );
        const stem = musicStemBlobRef.current
          ? {
              fileName: musicStemBlobRef.current.fileName,
              mimeType: musicStemBlobRef.current.blob.type || 'audio/wav',
              duration: musicStemBlobRef.current.duration,
              bytes: new Uint8Array(await musicStemBlobRef.current.blob.arrayBuffer()),
            }
          : null;
        const bytes = exportKathaArchiveBytes({
          version: 1,
          exportedAt: Date.now(),
          aspect: '9:16',
          episode: shortEp,
          brandKit: loadBrandKit(),
          voices,
          musicStem: stem,
        });
        const ab = new ArrayBuffer(bytes.byteLength);
        new Uint8Array(ab).set(bytes);
        const blob = new Blob([ab], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${shortEp.id}.katha`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        setExportNotice(
          `Saved 9:16 Short archive "${shortEp.id}.katha" (${voices.length} voice clip${voices.length === 1 ? '' : 's'})`
        );
        setTimeout(() => setExportNotice(null), 4500);
      } catch {
        setExportNotice('Failed to build 9:16 Short .katha archive.');
        setTimeout(() => setExportNotice(null), 4000);
      }
    },
    []
  );

  // Integer frame-by-frame stepper (-1f / +1f / -10f / +10f) for animation arc & lip-sync inspection
  const stepFrame = useCallback((deltaFrames: number) => {
    const ep = episodeRef.current;
    if (!ep.beats.length) return;
    setIsPlaying(false);
    isPlayingRef.current = false;
    audioRef.current?.setPlaying(false);
    const totalFrames = Math.max(1, getEpisodeTotalFrames(ep, STUDIO_FPS));
    const curFrame = timeToFrameIndex(timeRef.current, STUDIO_FPS);
    const nextFrame = Math.max(0, Math.min(totalFrames - 1, curFrame + deltaFrames));
    const nextTime = frameIndexToTime(nextFrame, STUDIO_FPS);
    timeRef.current = nextTime;
    audioRef.current?.reset();
    setCurrentTime(nextTime);
    const ev = evaluateEpisodeAtTime(ep, nextTime, null);
    setActiveBeatIdx(ev.beatIndex);
    setSelectedBeatIdx(ev.beatIndex);
  }, []);

  // Main 60fps deterministic render loop
  useEffect(() => {
    let rafId = 0;
    let lastTs = 0;
    let uiAcc = 0;

    const tick = (ts: number) => {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(0.08, (ts - lastTs) / 1000);
      lastTs = ts;

      const ep = episodeRef.current;
      const dur = getEpisodeDuration(ep);

      if (isPlayingRef.current && !isScrubbingRef.current) {
        timeRef.current += dt;
        if (timeRef.current >= dur) {
          if (isRecordingRef.current) {
            timeRef.current = dur - 0.01;
            setIsPlaying(false);
            stopRecording();
          } else {
            timeRef.current = timeRef.current % dur;
            audioRef.current?.reset();
          }
        }
      }

      const t = timeRef.current;
      const preEv = evaluateEpisodeAtTime(ep, t, null);
      const voiceClip = audioRef.current?.getVoiceClip(preEv.beat.id);
      const voiceProfile = getVoiceSpeechProfile(voiceClip?.buffer);
      const liveVoice = isPlayingRef.current
        ? audioRef.current?.getLiveVoiceEnergy(preEv.beat.id) ??
          sampleVoiceProfileAtTime(voiceProfile, preEv.localT)
        : sampleVoiceProfileAtTime(voiceProfile, preEv.localT);
      const ev =
        liveVoice !== null || voiceProfile?.speechWindow
          ? evaluateEpisodeAtTime(ep, t, liveVoice, voiceProfile?.speechWindow)
          : preEv;
      const nextBeatForJCut =
        ev.beatIndex + 1 < ep.beats.length ? ep.beats[ev.beatIndex + 1] : null;

      audioRef.current?.update(
        t,
        ev.beat,
        ev.localT,
        isPlayingRef.current,
        ev.speechEnergy,
        nextBeatForJCut
      );

      const canvas = stageCanvasRef.current;
      if (canvas) {
        const curAspect = aspectRef.current;
        const cw = curAspect === '16:9' ? 1920 : 1080;
        const ch = curAspect === '16:9' ? 1080 : 1920;
        if (canvas.width !== cw || canvas.height !== ch) {
          canvas.width = cw;
          canvas.height = ch;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderEpisodeFrame(
            ctx,
            cw,
            ch,
            ep,
            ev,
            t,
            curAspect,
            showCaptionsRef.current,
            expressionsEnabledRef.current,
            voiceProfile?.speechWindow
          );

          // Paused Motion Onion-Skin Overlay (reuses single pooled offscreen buffer — zero per-frame allocations)
          if (
            onionSkinRef.current &&
            !isPlayingRef.current &&
            !isRecordingRef.current &&
            ev.frameIndex > 0
          ) {
            let onionCanvas = onionCanvasRef.current;
            if (!onionCanvas) {
              onionCanvas = document.createElement('canvas');
              onionCanvasRef.current = onionCanvas;
            }
            if (onionCanvas.width !== cw || onionCanvas.height !== ch) {
              onionCanvas.width = cw;
              onionCanvas.height = ch;
            }
            const octx = onionCanvas.getContext('2d');
            if (octx) {
              const ghostFrame = Math.max(0, ev.frameIndex - 6);
              const ghostT = frameIndexToTime(ghostFrame, STUDIO_FPS);
              const ghostPreEv = evaluateEpisodeAtTime(ep, ghostT, null);
              const ghostVoiceClip = audioRef.current?.getVoiceClip(ghostPreEv.beat.id);
              const ghostProfile = getVoiceSpeechProfile(ghostVoiceClip?.buffer);
              const ghostEnergy = sampleVoiceProfileAtTime(ghostProfile, ghostPreEv.localT);
              const ghostEv =
                ghostEnergy !== null || ghostProfile?.speechWindow
                  ? evaluateEpisodeAtTime(ep, ghostT, ghostEnergy, ghostProfile?.speechWindow)
                  : ghostPreEv;
              renderEpisodeFrame(
                octx,
                cw,
                ch,
                ep,
                ghostEv,
                ghostT,
                curAspect,
                false,
                expressionsEnabledRef.current,
                ghostProfile?.speechWindow
              );
              ctx.save();
              ctx.globalAlpha = 0.24;
              ctx.drawImage(onionCanvas, 0, 0);
              ctx.restore();
            }
          }

          // Broadcast Safe-Zone & Shorts/Reels UI Danger-Zone Overlay (editor-only; never drawn during recording)
          if (safeZonesRef.current && !isRecordingRef.current) {
            drawSafeZoneOverlay(ctx, cw, ch, curAspect);
          }

          // Interactive drag handles overlay (editor-only; never drawn during recording)
          if (stageMoveModeRef.current && !isRecordingRef.current) {
            const targets = getStageInteractiveTargets(ev.beat, ep, cw, ch, curAspect, ev.u);
            ctx.save();
            for (const tgt of targets) {
              ctx.strokeStyle = tgt.kind === 'prop' ? 'rgba(52, 211, 153, 0.85)' : 'rgba(242, 200, 91, 0.85)';
              ctx.lineWidth = 3;
              ctx.setLineDash([8, 6]);
              ctx.beginPath();
              ctx.arc(tgt.x, tgt.y, tgt.radius, 0, Math.PI * 2);
              ctx.stroke();
              ctx.setLineDash([]);
              ctx.font = '700 22px system-ui, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillStyle = 'rgba(8, 10, 18, 0.8)';
              const lw = ctx.measureText(tgt.label).width + 20;
              ctx.fillRect(tgt.x - lw / 2, tgt.y - tgt.radius - 34, lw, 28);
              ctx.fillStyle = tgt.kind === 'prop' ? '#6ee7b7' : '#f2c85b';
              ctx.fillText(tgt.label, tgt.x, tgt.y - tgt.radius - 13);
            }
            ctx.restore();
          }
        }
      }

      uiAcc += dt;
      if (uiAcc >= 0.05) {
        uiAcc = 0;
        setCurrentTime(t);
        setActiveBeatIdx(ev.beatIndex);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [stopRecording]);

  // Deterministic headless batch-rendering hook (activated only when opened with ?headless=1)
  useHeadlessDriver({
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
  });

  // Clean AudioContext & timer disposal on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.dispose();
      audioRef.current = null;
    };
  }, []);

  // Sync live audio engine harmonic tension arc whenever episode updates (Upgrade 14)
  useEffect(() => {
    audioRef.current?.setEpisodeMusicArc(episode);
  }, [episode]);

  // Upgrade 16: 1-Click Boost Flat Retention Beats (preserves durations & dialogue)
  const handleBoostFlatBeats = useCallback(() => {
    const res = boostFlatBeats(episodeRef.current);
    if (res.boostedIndices.length === 0) {
      setExportNotice('Retention pacing is already strong — no flat beats detected.');
      return;
    }
    pendingHistoryLabelRef.current = `Boost ${res.boostedIndices.length} Flat Beat${res.boostedIndices.length === 1 ? '' : 's'}`;
    setEpisode(res.episode);
    setJsonDraft(JSON.stringify(res.episode, null, 2));
    setExportNotice(
      `Boosted ${res.boostedIndices.length} flat beat${res.boostedIndices.length === 1 ? '' : 's'} (Retention ${res.beforeScore} → ${res.afterScore}/100).`
    );
  }, []);

  // Upgrade 17: 1-Click Auto-Tag Stage Changes with Animated Location Banners
  const handleAutoTagStageChanges = useCallback(() => {
    const res = autoTagStageChangeLocationCards(episodeRef.current);
    if (res.taggedCount === 0) {
      setExportNotice('All stage changes already have Location Banners.');
      return;
    }
    pendingHistoryLabelRef.current = 'Auto-Tag Location Banners';
    setEpisode(res.episode);
    setJsonDraft(JSON.stringify(res.episode, null, 2));
    setExportNotice(
      `Tagged ${res.taggedCount} stage change${res.taggedCount === 1 ? '' : 's'} with animated Location Banners.`
    );
  }, []);

  // Upgrade 18: Selective Single-Beat Snapshot Restore from History Checkpoint (with Undo support)
  const handleRestoreSingleBeat = useCallback(
    (checkpoint: HistoryCheckpointItem, beatId: string) => {
      pendingHistoryLabelRef.current = `Restore Beat from "${checkpoint.label}"`;
      setEpisode((prev) => {
        const updated = restoreSingleBeatFromCheckpoint(prev, checkpoint.episode, beatId);
        setJsonDraft(JSON.stringify(updated, null, 2));
        return updated;
      });
      setExportNotice(`Restored scene snapshot from "${checkpoint.label}" (Ctrl+Z to undo).`);
    },
    []
  );

  // Upgrade 19: Command Palette Registry & Executor
  const studioCommands = useMemo(() => buildStudioCommandRegistry(episode), [episode]);
  const handleExecuteCommand = useCallback(
    (cmd: StudioCommandItem) => {
      switch (cmd.actionType) {
        case 'jump_beat': {
          const idx = typeof cmd.payload === 'number' ? cmd.payload : 0;
          const clamped = Math.max(0, Math.min(episodeRef.current.beats.length - 1, idx));
          setSelectedBeatIdx(clamped);
          jumpToTime(beatStarts[clamped] ?? 0);
          break;
        }
        case 'set_render_style': {
          if (typeof cmd.payload === 'string') {
            handleSelectRenderStyle(cmd.payload as RenderStyleId);
          }
          break;
        }
        case 'apply_acting_macro': {
          if (typeof cmd.payload === 'string') {
            const curBeat = episodeRef.current.beats[selectedBeatIdx];
            if (curBeat) {
              const patch = applyActingMacroToBeat(curBeat, cmd.payload as ActingMacroId);
              updateSelectedBeat(patch, `Acting Macro: ${cmd.payload}`);
            }
          }
          break;
        }
        case 'toggle_safe_zones':
          setSafeZones((v) => !v);
          break;
        case 'toggle_onion_skin':
          setOnionSkin((v) => !v);
          break;
        case 'toggle_move_mode':
          setStageMoveMode((v) => !v);
          break;
        case 'open_fast_render':
          setFastRenderOverride(null);
          setFastRenderOpen(true);
          break;
        case 'open_shorts':
          setShortsModalOpen(true);
          break;
        case 'open_qa':
          setQaModalOpen(true);
          break;
        case 'open_voice_booth':
          setVoiceBoothOpen(true);
          break;
        case 'open_version_diff':
          setVersionDiffOpen(true);
          break;
        case 'apply_j_cuts':
          handleApplyCinematicJCuts();
          break;
        case 'apply_animation_polish':
          handlePolishAnimationPrinciples();
          break;
        case 'boost_flat_beats':
          handleBoostFlatBeats();
          break;
        case 'auto_tag_locations':
          handleAutoTagStageChanges();
          break;
        case 'split_beat':
          handleSplitSelectedBeat();
          break;
      }
    },
    [
      beatStarts,
      handleApplyCinematicJCuts,
      handleAutoTagStageChanges,
      handleBoostFlatBeats,
      handlePolishAnimationPrinciples,
      handleSelectRenderStyle,
      handleSplitSelectedBeat,
      jumpToTime,
      selectedBeatIdx,
      updateSelectedBeat,
    ]
  );

  // Keyboard shortcuts (Ctrl/Cmd+K Command Palette + safe non-input-blocking NLE transport shortcuts)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ctrl/Cmd+K opens Command Palette from anywhere
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((open) => !open);
        return;
      }
      if (isEditableEventTarget(e.target)) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }
      const lower = e.key.toLowerCase();
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (lower === 'j' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        jumpToTime(Math.max(0, timeRef.current - 1));
      } else if (lower === 'k' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setIsPlaying(false);
        isPlayingRef.current = false;
        audioRef.current?.setPlaying(false);
      } else if (lower === 'l' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        ensureAudio();
        setIsPlaying(true);
      } else if (e.key === '[' || e.key === ']') {
        const ep = episodeRef.current;
        if (!ep.beats.length) return;
        e.preventDefault();
        const ev = evaluateEpisodeAtTime(ep, timeRef.current, null);
        const nextIdx =
          e.key === ']'
            ? Math.min(ep.beats.length - 1, ev.beatIndex + 1)
            : Math.max(0, ev.beatIndex - 1);
        let startSec = 0;
        for (let i = 0; i < nextIdx; i++) {
          startSec += Math.max(1.2, ep.beats[i].duration);
        }
        setSelectedBeatIdx(nextIdx);
        jumpToTime(startSec + 0.05);
      } else if (lower === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setSafeZones((v) => !v);
      } else if (lower === 'o' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOnionSkin((v) => !v);
      } else if (lower === 'm' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (e.shiftKey) {
          toggleSound();
        } else {
          setStageMoveMode((v) => !v);
        }
      } else if (lower === 's' && e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        handleSplitSelectedBeat();
      } else if (lower === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        handleReplay();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const ep = episodeRef.current;
        if (!ep.beats.length) return;
        e.preventDefault();
        if (e.altKey) {
          const ev = evaluateEpisodeAtTime(ep, timeRef.current, null);
          const nextIdx =
            e.key === 'ArrowRight'
              ? Math.min(ep.beats.length - 1, ev.beatIndex + 1)
              : Math.max(0, ev.beatIndex - 1);
          let startSec = 0;
          for (let i = 0; i < nextIdx; i++) {
            startSec += Math.max(1.2, ep.beats[i].duration);
          }
          setSelectedBeatIdx(nextIdx);
          jumpToTime(startSec + 0.05);
        } else {
          const step = e.shiftKey ? 10 : 1;
          stepFrame(e.key === 'ArrowRight' ? step : -step);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    ensureAudio,
    handleRedo,
    handleReplay,
    handleSplitSelectedBeat,
    handleUndo,
    jumpToTime,
    stepFrame,
    toggleSound,
  ]);

  const updateScrub = (clientX: number) => {
    const el = scrubberRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    jumpToTime(ratio * totalDuration);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#080a12] text-[#f3efe6] overflow-hidden">
      {/* Top Bar: Brand | Story Presets | Format & Export */}
      <header className="h-14 px-5 border-b border-white/10 bg-[#0c0f1b] flex items-center justify-between gap-6 shrink-0">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="font-display text-lg font-semibold tracking-tight text-[#f7f1e3] whitespace-nowrap shrink-0">
            Stagecraft Studio
          </span>
          <span className="hidden xl:inline text-xs text-[#8b94ad] whitespace-nowrap truncate">
            20-Engine Multi-Genre 2D Animation Studio
          </span>
        </div>

        {/* Grouped 10-Storybook Library Dropdown */}
        <div className="relative shrink-0" ref={libraryMenuRef}>
          <button
            type="button"
            onClick={() => setLibraryOpen((o) => !o)}
            aria-expanded={libraryOpen}
            className={`h-9 px-3.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              libraryOpen
                ? 'bg-[#1d2440] border-[#f2c85b]/60 text-white'
                : 'bg-[#14182a] hover:bg-[#1b2138] border-white/12 text-[#f3efe6]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#f2c85b] shrink-0" />
            <span className="text-[#f2c85b]">{episode.series}</span>
            <span className="text-white/30">·</span>
            <span className="max-w-[210px] truncate text-[#eef1f8]">{episode.title}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#8e97b0] transition-transform shrink-0 ${
                libraryOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {libraryOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-[440px] max-w-[92vw] max-h-[72vh] overflow-y-auto rounded-xl bg-[#0e1222] border border-white/15 shadow-2xl p-2 z-50">
              <div className="px-2.5 py-1.5 border-b border-white/10 flex items-baseline justify-between">
                <span className="text-xs font-semibold text-white">World &amp; Indian Folklore Storybooks</span>
                <span className="text-[11px] text-[#8b94ad]">
                  {new Set(PRESET_EPISODES.map((e) => e.series)).size} books · {PRESET_EPISODES.length} episodes
                </span>
              </div>

              <div className="py-1 space-y-2.5">
                {groupedLibrary.map(({ shelf, episodes }) => (
                  <div key={shelf}>
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#f2c85b]/80">
                      {shelf}
                    </div>
                    <div className="space-y-0.5">
                      {episodes.map((ep) => {
                        const active = episode.id === ep.id;
                        const dur = getEpisodeDuration(ep);
                        return (
                          <button
                            key={ep.id}
                            type="button"
                            onClick={() => loadPreset(ep)}
                            className={`w-full px-2.5 py-2 rounded-lg text-left transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                              active
                                ? 'bg-[#f2c85b]/15 border border-[#f2c85b]/50'
                                : 'hover:bg-white/6 border border-transparent'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span
                                  className={`text-xs font-semibold whitespace-nowrap ${
                                    active ? 'text-[#f2c85b]' : 'text-white'
                                  }`}
                                >
                                  {ep.series}
                                </span>
                                <span className="text-[11px] text-[#b4bcd4] truncate">{ep.title}</span>
                              </div>
                              <div className="text-[10px] text-[#7e87a1] truncate mt-0.5">{ep.subtitle}</div>
                            </div>
                            <span className="font-mono-tabular text-[10px] text-[#8e97b0] whitespace-nowrap shrink-0">
                              {ep.beats.length} scenes · {dur.toFixed(0)}s
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Format Switch, Vault, Undo/Redo, Fast Offline Render & Export */}
        <div className="flex items-center gap-2 shrink-0">
          <div ref={historyMenuRef} className="relative flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              disabled={!canUndo}
              onClick={handleUndo}
              title={
                canUndo
                  ? `Undo (${pastRef.current[pastRef.current.length - 1]?.label || 'Ctrl+Z'})`
                  : 'Undo (Ctrl+Z)'
              }
              className="h-9 px-2 rounded-md bg-[#14182a] hover:bg-[#1e2540] disabled:opacity-35 border border-white/10 text-[#d6dcf0] inline-flex items-center justify-center gap-1 cursor-pointer disabled:cursor-default"
            >
              <Undo2 className="w-3.5 h-3.5" />
              {historyCounts.undo > 0 && (
                <span className="text-[10px] font-mono text-[#a8b3d1]">{historyCounts.undo}</span>
              )}
            </button>
            <button
              type="button"
              disabled={!canRedo}
              onClick={handleRedo}
              title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
              className="h-9 w-8 rounded-md bg-[#14182a] hover:bg-[#1e2540] disabled:opacity-35 border border-white/10 text-[#d6dcf0] inline-flex items-center justify-center cursor-pointer disabled:cursor-default"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={!canUndo}
              onClick={() => setHistoryOpen((o) => !o)}
              title="Edit History Checkpoints"
              className={`h-9 w-8 rounded-md border text-[#d6dcf0] inline-flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-default ${
                historyOpen
                  ? 'bg-[#232c4d] border-[#f2c85b]/60 text-[#f2c85b]'
                  : 'bg-[#14182a] hover:bg-[#1e2540] border-white/10'
              }`}
            >
              <History className="w-3.5 h-3.5" />
            </button>

            {historyOpen && pastRef.current.length > 0 && (
              <div className="absolute right-0 top-11 z-50 w-72 rounded-xl bg-[#111526] border border-white/15 shadow-2xl overflow-hidden">
                <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between gap-2 bg-[#151a2e]">
                  <span className="text-[11px] font-bold text-[#f2c85b]">
                    History ({pastRef.current.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryOpen(false);
                      setVersionDiffOpen(true);
                    }}
                    className="h-6 px-2 rounded bg-[#212b4c] hover:bg-[#2c3a66] border border-[#f2c85b]/45 text-[10px] font-semibold text-[#f7e7bc] inline-flex items-center gap-1 cursor-pointer"
                    title="Inspect scene-by-scene diff & selectively restore individual beats"
                  >
                    <GitCompare className="w-3 h-3" />
                    <span>Compare</span>
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                  {[...pastRef.current]
                    .map((cp, idx) => ({ cp, idx }))
                    .reverse()
                    .slice(0, 14)
                    .map(({ cp, idx }) => (
                      <button
                        key={`${cp.savedAt}_${idx}`}
                        type="button"
                        onClick={() => handleRestoreCheckpoint(idx)}
                        className="w-full px-3 py-2 text-left hover:bg-[#1b223a] transition-colors flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold text-white truncate">
                            {cp.label}
                          </div>
                          <div className="text-[10px] text-[#848da8] truncate">
                            {cp.episode.beats.length} scenes · {cp.episode.cast.length} cast
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-[#9ca7c4] shrink-0">
                          {new Date(cp.savedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            title="Open Studio Command Palette (Ctrl/Cmd+K)"
            className="h-9 px-2.5 rounded-md bg-[#14182a] hover:bg-[#1e2540] border border-white/10 text-[11px] font-semibold text-[#cbd3e8] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Command className="w-3.5 h-3.5 text-[#f2c85b]" />
            <span className="hidden lg:inline">⌘K</span>
          </button>

          <ProjectVaultMenu
            currentTitle={episode.title}
            savedProjects={savedProjects}
            autosaveAt={autosaveAt}
            voiceClipCount={Object.keys(voiceMeta).length}
            onSaveNamed={handleSaveNamedProject}
            onLoadProject={handleLoadSavedProject}
            onDeleteProject={handleDeleteSavedProject}
            onExportKatha={handleExportKathaArchive}
            onImportKatha={handleImportKathaArchive}
          />

          <div className="flex items-center gap-1 p-1 bg-[#14182a] border border-white/8 rounded-lg shrink-0">
            {(['16:9', '9:16'] as const).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => setAspect(ratio)}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  aspect === ratio
                    ? 'bg-white/15 text-white'
                    : 'text-[#8e97b0] hover:text-white'
                }`}
              >
                {ratio === '16:9' ? '16:9' : '9:16'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShortsModalOpen(true)}
            className="h-9 px-2.5 rounded-md bg-[#161b2e] hover:bg-[#202742] border border-white/12 text-xs font-semibold text-[#eef1f8] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Slice any scene range into a 9:16 Short or render a 1280×720 PNG YouTube Thumbnail"
          >
            <Scissors className="w-3.5 h-3.5 text-[#f2c85b]" />
            <span className="hidden 2xl:inline">Shorts &amp; Thumb</span>
            <span className="2xl:hidden">Shorts</span>
          </button>

          <button
            type="button"
            onClick={() => setQaModalOpen(true)}
            className="h-9 px-2.5 rounded-md bg-[#161b2e] hover:bg-[#202742] border border-white/12 text-xs font-semibold text-[#eef1f8] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="1-Click Storyboard Contact Sheet PNG & Pre-Render Visual QA Gate"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#f2c85b]" />
            <span className="hidden 2xl:inline">QA Sheet</span>
            <span className="2xl:hidden">QA</span>
          </button>

          <button
            type="button"
            onClick={() => setGrowthModalOpen(true)}
            className="h-9 px-2.5 rounded-md bg-[#161b2e] hover:bg-[#202742] border border-[#f2c85b]/35 text-xs font-semibold text-[#eef1f8] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Retention Auditor, Anthology & Bedtime Stitcher, Multi-Language Dubbing, Cast Bible, YouTube Launch Packager & Broadcast -14 LUFS MP4"
          >
            <Rocket className="w-3.5 h-3.5 text-[#f2c85b]" />
            <span>Growth</span>
          </button>

          <button
            type="button"
            onClick={() => void handleDownloadZip()}
            className={`h-9 px-2.5 rounded-md border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              zipFeedback
                ? 'bg-[#1a3328] border-[#4ade80]/50 text-[#bbf7d0]'
                : 'bg-[#161b2e] hover:bg-[#202742] border-white/12 text-[#eef1f8]'
            }`}
            title="Download all 20 machinimas, 10 art engines & AI Director Kit as a standalone ZIP"
          >
            {zipFeedback ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            <span>{zipFeedback ?? 'ZIP'}</span>
          </button>

          <button
            type="button"
            onClick={() => setFastRenderOpen(true)}
            className="h-9 px-3 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] text-[#110e0a] text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Deterministic faster-than-realtime WebCodecs Offline Renderer + YouTube MP4 & lossless WAV export"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Fast Render</span>
          </button>

          <button
            type="button"
            onClick={toggleRecording}
            className={`h-9 px-2.5 rounded-md border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isRecording
                ? 'bg-[#e6223c] hover:bg-[#cc1d34] border-[#e6223c] text-white'
                : 'bg-[#161b2e] hover:bg-[#202742] border-white/15 text-[#eef1f8]'
            }`}
            title="Real-time canvas recorder (.webm) with automatic audio unmute guard"
          >
            {isRecording ? <Square className="w-3 h-3 fill-current" /> : <Circle className="w-3 h-3 fill-current text-[#f2c85b]" />}
            <span>{isRecording ? 'Stop' : 'Rec'}</span>
          </button>
        </div>
      </header>
      {exportNotice && (
        <div className="px-5 py-1.5 bg-[#19283a] border-b border-[#f2c85b]/30 text-[11px] font-medium text-[#f7e7bc] flex items-center justify-between shrink-0">
          <span>{exportNotice}</span>
          <button
            type="button"
            onClick={() => setExportNotice(null)}
            className="text-[#8e97b0] hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split Studio Workspace */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left/Center: Live 1080p60 Stage + Transport + Beat Strip */}
        <main className="flex-1 min-w-0 flex flex-col bg-[#080a12] overflow-hidden">
          {/* Episode Header Meta (unboxed clean text + language switcher) */}
          <div className="px-5 pt-3 pb-2 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-baseline gap-2.5 min-w-0">
              <h1 className="font-display text-base font-semibold text-white truncate">
                {episode.title}
              </h1>
              <span className="text-xs text-[#8b94ad] whitespace-nowrap shrink-0">
                {episode.series} · {episode.beats.length} scenes · {totalDuration.toFixed(1)}s
              </span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <label
                className="inline-flex items-center gap-1 h-7 px-2 rounded-md bg-[#121626] border border-white/10 text-[11px] text-[#cfd6ea]"
                title="Active episode language (controls Canvas script fonts, RTL direction, cards, TTS locale & YouTube Launch Pack)"
              >
                <Globe className="w-3 h-3 text-[#f2c85b] shrink-0" />
                <select
                  aria-label="Episode language"
                  value={resolveEpisodeLanguage(episode).code}
                  onChange={(e) => {
                    const nextCode = e.target.value as LanguageCode;
                    setEpisode((prev) => ({ ...prev, language: nextCode }));
                  }}
                  className="bg-transparent text-[11px] font-medium text-[#eef1f8] focus:outline-none cursor-pointer"
                >
                  {LANGUAGE_CATALOG.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-[#0e1222] text-white">
                      {lang.nativeName} ({lang.label})
                    </option>
                  ))}
                </select>
              </label>
              <span className="font-mono-tabular text-xs text-[#aeb6cc] whitespace-nowrap shrink-0">
                {aspect === '16:9' ? '1920×1080' : '1080×1920'} · 60fps
              </span>
            </div>
          </div>

          {/* Live Stage Viewport */}
          <div className="flex-1 min-h-0 px-5 pb-3 flex items-center justify-center">
            <div
              className={`relative ${
                aspect === '16:9' ? 'aspect-video w-full max-w-[1040px]' : 'aspect-[9/16] h-full'
              } max-h-full rounded-lg overflow-hidden bg-[#050712] border border-white/12 shadow-2xl`}
            >
              <canvas
                ref={stageCanvasRef}
                onPointerDown={(e) => {
                  if (!stageMoveMode) {
                    setIsPlaying((p) => !p);
                    return;
                  }
                  const canvas = stageCanvasRef.current;
                  if (!canvas) return;
                  const rect = canvas.getBoundingClientRect();
                  const cx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * canvas.width;
                  const cy = ((e.clientY - rect.top) / Math.max(1, rect.height)) * canvas.height;
                  const ev = evaluateEpisodeAtTime(episodeRef.current, timeRef.current, null);
                  setSelectedBeatIdx(ev.beatIndex);
                  const targets = getStageInteractiveTargets(
                    ev.beat,
                    episodeRef.current,
                    canvas.width,
                    canvas.height,
                    aspectRef.current,
                    ev.u
                  );
                  let best: (typeof targets)[number] | null = null;
                  let bestDist = Infinity;
                  for (const t of targets) {
                    const d = Math.hypot(cx - t.x, cy - t.y);
                    if (d <= t.radius * 1.25 && d < bestDist) {
                      best = t;
                      bestDist = d;
                    }
                  }
                  if (best) {
                    setIsPlaying(false);
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    const initOffX =
                      best.kind === 'actor'
                        ? ev.beat.actors[best.index]?.offsetX ?? 0
                        : ev.beat.propOffsetX ?? 0;
                    const initOffY =
                      best.kind === 'actor'
                        ? ev.beat.actors[best.index]?.offsetY ?? 0
                        : ev.beat.propOffsetY ?? 0;
                    stageDragRef.current = {
                      kind: best.kind,
                      index: best.index,
                      startClientX: e.clientX,
                      startClientY: e.clientY,
                      initOffX,
                      initOffY,
                    };
                  }
                }}
                onPointerMove={(e) => {
                  const drag = stageDragRef.current;
                  const canvas = stageCanvasRef.current;
                  if (!drag || !canvas) return;
                  const rect = canvas.getBoundingClientRect();
                  const dx = (e.clientX - drag.startClientX) / Math.max(1, rect.width);
                  const dy = (e.clientY - drag.startClientY) / Math.max(1, rect.height);
                  const nextX = Number(Math.max(-0.35, Math.min(0.35, drag.initOffX + dx)).toFixed(3));
                  const nextY = Number(Math.max(-0.35, Math.min(0.35, drag.initOffY + dy)).toFixed(3));
                  if (drag.kind === 'actor') {
                    setEpisode((prev) => {
                      const nextBeats = prev.beats.map((b, bi) => {
                        if (bi !== selectedBeatIdx) return b;
                        const nextActors = b.actors.map((a, ai) =>
                          ai === drag.index ? { ...a, offsetX: nextX, offsetY: nextY } : a
                        );
                        return { ...b, actors: nextActors };
                      });
                      return { ...prev, beats: nextBeats };
                    });
                  } else {
                    updateSelectedBeat({ propOffsetX: nextX, propOffsetY: nextY });
                  }
                }}
                onPointerUp={() => {
                  if (stageDragRef.current) {
                    stageDragRef.current = null;
                    setJsonDraft(JSON.stringify(episodeRef.current, null, 2));
                  }
                }}
                className={`w-full h-full object-contain block ${
                  stageMoveMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                }`}
              />

              {/* Compact On-Canvas Safe Zones & Move Mode Toggles */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                <button
                  type="button"
                  onClick={() => setSafeZones((v) => !v)}
                  className={`h-7 px-2.5 rounded-md border text-[11px] font-semibold inline-flex items-center gap-1 backdrop-blur-sm cursor-pointer transition ${
                    safeZones
                      ? 'bg-[#38bdf8] border-[#38bdf8] text-[#08131f]'
                      : 'bg-[#080a12]/75 border-white/15 text-[#dbe2f4] hover:border-[#38bdf8]/50'
                  }`}
                  title="Toggle Broadcast Safe-Zone & YouTube Shorts/Reels UI Danger-Zone overlay (editor-only; never burned into exports)"
                >
                  <Scan className="w-3 h-3" />
                  <span>{safeZones ? 'Safe Zones ON' : 'Safe Zones'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = !stageMoveMode;
                    setStageMoveMode(next);
                    if (next) setIsPlaying(false);
                  }}
                  className={`h-7 px-2.5 rounded-md border text-[11px] font-semibold inline-flex items-center gap-1 backdrop-blur-sm cursor-pointer transition ${
                    stageMoveMode
                      ? 'bg-[#f2c85b] border-[#f2c85b] text-[#110e0a]'
                      : 'bg-[#080a12]/75 border-white/15 text-[#dbe2f4] hover:border-[#f2c85b]/50'
                  }`}
                  title="Toggle Stage Move Mode to drag actors and stage props directly on the canvas"
                >
                  <Move className="w-3 h-3" />
                  <span>{stageMoveMode ? 'Staging ON' : 'Move Stage'}</span>
                </button>
                {stageMoveMode &&
                  selectedBeat &&
                  (selectedBeat.propOffsetX ||
                    selectedBeat.propOffsetY ||
                    selectedBeat.actors.some((a) => a.offsetX || a.offsetY)) && (
                    <button
                      type="button"
                      onClick={() => {
                        updateSelectedBeat({
                          propOffsetX: 0,
                          propOffsetY: 0,
                          actors: selectedBeat.actors.map((a) => ({ ...a, offsetX: 0, offsetY: 0 })),
                        });
                      }}
                      className="h-7 px-2 rounded-md bg-[#080a12]/80 border border-white/15 text-[10px] font-semibold text-amber-200 hover:bg-[#1a223b] cursor-pointer"
                      title="Reset actor and prop drag offsets in this scene"
                    >
                      Reset
                    </button>
                  )}
              </div>
            </div>
          </div>

          {/* Transport Bar + Beat Storyboard Strip */}
          <div className="px-5 py-3 border-t border-white/10 bg-[#0c0f1b] flex flex-col gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="h-9 px-4 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] text-[#110e0a] text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                type="button"
                onClick={handleReplay}
                className="h-9 px-3 rounded-md bg-[#161b2e] hover:bg-[#202742] border border-white/10 text-xs font-semibold text-white inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay</span>
              </button>

              {/* Frame-by-Frame Stepper (-1f / +1f) & Paused Onion-Skin Toggle */}
              <div className="inline-flex items-center rounded-md bg-[#121728] border border-white/10 p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => stepFrame(e.shiftKey ? -10 : -1)}
                  className="h-8 px-2 rounded hover:bg-white/10 text-[#d6dcf0] text-[11px] font-mono-tabular inline-flex items-center gap-0.5 cursor-pointer"
                  title="Step back 1 frame (← key; Shift+Click or Shift+← for -10f; Alt+← for prev scene)"
                >
                  <StepBack className="w-3.5 h-3.5" />
                  <span>-1f</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => stepFrame(e.shiftKey ? 10 : 1)}
                  className="h-8 px-2 rounded hover:bg-white/10 text-[#d6dcf0] text-[11px] font-mono-tabular inline-flex items-center gap-0.5 cursor-pointer"
                  title="Step forward 1 frame (→ key; Shift+Click or Shift+→ for +10f; Alt+→ for next scene)"
                >
                  <span>+1f</span>
                  <StepForward className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = !onionSkin;
                    setOnionSkin(next);
                    if (next) {
                      setIsPlaying(false);
                      isPlayingRef.current = false;
                      audioRef.current?.setPlaying(false);
                    }
                  }}
                  className={`h-8 px-2 rounded text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                    onionSkin
                      ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40'
                      : 'text-[#8e97b0] hover:text-white'
                  }`}
                  title="Paused Onion-Skin overlay: blends previous -6f motion ghost at 24% opacity to inspect arcs & poses"
                >
                  <Ghost className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Onion</span>
                </button>
              </div>

              <button
                type="button"
                onClick={toggleSound}
                className={`h-9 px-3 rounded-md border text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  !muted
                    ? 'bg-[#212b4a] border-[#f2c85b]/50 text-[#f7e7bc]'
                    : 'bg-[#161b2e] hover:bg-[#202742] border-white/10 text-[#b4bcd4]'
                }`}
              >
                {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{muted ? 'Audio Off' : 'Raag On'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCaptions((c) => !c)}
                className={`h-9 px-3 rounded-md border text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  showCaptions
                    ? 'bg-[#1e2640] border-white/25 text-white'
                    : 'bg-[#161b2e] hover:bg-[#202742] border-white/10 text-[#8e97b0]'
                }`}
              >
                <Subtitles className="w-3.5 h-3.5" />
                <span>Captions</span>
              </button>

              <button
                type="button"
                onClick={() => setExpressionsEnabled((v) => !v)}
                className={`h-9 px-3 rounded-md border text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  expressionsEnabled
                    ? 'bg-[#251f3d] border-[#c084fc]/45 text-[#f3e8ff]'
                    : 'bg-[#161b2e] hover:bg-[#202742] border-white/10 text-[#8e97b0]'
                }`}
                title="System-wide facial expressions toggle — Off renders calm neutral faces across all characters while keeping blinking & lip-sync active"
              >
                {expressionsEnabled ? (
                  <Smile className="w-3.5 h-3.5 text-[#d8b4fe]" />
                ) : (
                  <Meh className="w-3.5 h-3.5" />
                )}
                <span>{expressionsEnabled ? 'Expressions' : 'Neutral'}</span>
              </button>

              {/* Timeline Scrubber */}
              <div
                ref={scrubberRef}
                role="slider"
                aria-label="Episode timeline"
                aria-valuemin={0}
                aria-valuemax={Number(totalDuration.toFixed(1))}
                aria-valuenow={Number(currentTime.toFixed(1))}
                tabIndex={0}
                onPointerDown={(e) => {
                  isScrubbingRef.current = true;
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  updateScrub(e.clientX);
                }}
                onPointerMove={(e) => {
                  if (isScrubbingRef.current) updateScrub(e.clientX);
                }}
                onPointerUp={() => {
                  isScrubbingRef.current = false;
                }}
                className="relative flex-1 h-6 flex items-center cursor-pointer select-none min-w-[80px]"
              >
                <div className="relative w-full h-1.5 bg-white/12 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, (currentTime / totalDuration) * 100)}%` }}
                    className="h-full bg-[#f2c85b]"
                  />
                  {beatStarts.slice(1).map((st, idx) => (
                    <span
                      key={idx}
                      style={{ left: `${(st / totalDuration) * 100}%` }}
                      className="absolute top-0 bottom-0 w-0.5 bg-[#0c0f1b]"
                    />
                  ))}
                </div>
              </div>

              <div className="font-mono-tabular text-right whitespace-nowrap shrink-0 leading-tight">
                <div className="text-xs text-[#d6dcf0]">
                  {totalDuration >= 120
                    ? `${formatLongDuration(currentTime)} / ${formatLongDuration(totalDuration)}`
                    : `${currentTime.toFixed(1).padStart(4, '0')}s / ${totalDuration.toFixed(1)}s`}
                </div>
                <div className="text-[10px] text-[#8e97b0]">
                  f{timeToFrameIndex(currentTime, STUDIO_FPS)} · b
                  {Math.max(0, Math.round((currentTime - (beatStarts[activeBeatIdx] ?? 0)) * STUDIO_FPS))}
                </div>
              </div>
            </div>

            <StoryboardTimelineStrip
              episode={episode}
              episodeChapters={episodeChapters}
              activeChapterIdx={activeChapterIdx}
              selectedBeatIdx={selectedBeatIdx}
              activeBeatIdx={activeBeatIdx}
              beatStarts={beatStarts}
              currentTime={currentTime}
              totalDuration={totalDuration}
              voiceMeta={voiceMeta}
              dragBeatIdx={dragBeatIdx}
              dragOverBeatIdx={dragOverBeatIdx}
              onSelectChapter={(chIdx) => {
                setActiveChapterIdx(chIdx);
                if (chIdx !== 'all') {
                  const ch = episodeChapters[chIdx];
                  if (ch) {
                    setSelectedBeatIdx(ch.startBeatIdx);
                    jumpToTime(beatStarts[ch.startBeatIdx] ?? 0);
                  }
                }
              }}
              onSelectBeat={(idx) => {
                setSelectedBeatIdx(idx);
                jumpToTime(beatStarts[idx]);
              }}
              onSeekTime={(tSec) => jumpToTime(tSec)}
              onResizeBeatDuration={handleResizeBeatDuration}
              onApplyCinematicJCuts={handleApplyCinematicJCuts}
              onBoostFlatBeats={handleBoostFlatBeats}
              onDragStartBeat={(idx) => setDragBeatIdx(idx)}
              onDragOverBeat={(idx) => setDragOverBeatIdx(idx)}
              onDragLeaveBeat={() => setDragOverBeatIdx(null)}
              onDropBeat={(fromIdx, toIdx) => {
                pendingHistoryLabelRef.current = 'Reorder Scenes';
                handleReorderBeat(fromIdx, toIdx);
              }}
              onDragEndBeat={() => {
                setDragBeatIdx(null);
                setDragOverBeatIdx(null);
              }}
              onAddBeat={() => {
                pendingHistoryLabelRef.current = 'Add Scene';
                addBeat();
              }}
              onAddEndScreenBeat={() => {
                pendingHistoryLabelRef.current = 'Add End Screen';
                handleAddEndScreenBeat();
              }}
            />
          </div>
        </main>

        {/* Right Director Workbench (Beat | Look | Voice | Assets | Script) */}
        <aside className="w-[370px] xl:w-[410px] border-l border-white/10 bg-[#0d101d] flex flex-col shrink-0 overflow-hidden">
          {/* Persistent hidden audio file inputs shared by Beat & Voice tabs */}
          <input
            ref={voiceInputRef}
            type="file"
            accept="audio/*"
            onChange={handleVoiceUpload}
            className="hidden"
          />
          <input
            ref={batchVoiceInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={handleBatchVoiceUpload}
            className="hidden"
          />

          {/* Workbench Tabs */}
          <div className="p-2 border-b border-white/10 grid grid-cols-5 gap-1 bg-[#0b0e19] shrink-0">
            {(
              [
                ['levers', 'Beat', SlidersHorizontal],
                ['look', 'Look', Palette],
                ['voice', 'Voice', Mic],
                ['assets', 'Assets', Layers],
                ['script', 'Script', Code2],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPanelTab(id)}
                className={`h-9 px-1 rounded-md text-[11px] font-semibold inline-flex items-center justify-center gap-1 transition-colors whitespace-nowrap cursor-pointer ${
                  panelTab === id
                    ? 'bg-[#1b233d] text-[#f2c85b] border border-[#f2c85b]/35'
                    : 'text-[#9aa3bd] hover:text-white border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: BEAT LEVERS & VOICEOVER UPLOAD (Extracted Memoized Module) */}
          {panelTab === 'levers' && selectedBeat && (
            <WorkbenchBeatInspector
              episode={episode}
              selectedBeat={selectedBeat}
              selectedBeatIdx={selectedBeatIdx}
              activeBeatIdx={activeBeatIdx}
              beatStarts={beatStarts}
              currentTime={currentTime}
              resolvedStyle={resolvedStyle}
              autoDuck={autoDuck}
              voiceMeta={voiceMeta}
              activeVoiceBuffer={audioRef.current?.getVoiceClip(selectedBeat.id)?.buffer ?? null}
              batchVoiceFeedback={batchVoiceFeedback}
              customPropInputRef={customPropInputRef}
              onDuplicateSelectedBeat={handleDuplicateSelectedBeat}
              onSplitSelectedBeat={handleSplitSelectedBeat}
              onDeleteSelectedBeat={deleteSelectedBeat}
              onUpdateSelectedBeat={updateSelectedBeat}
              onTriggerVoiceUpload={() => voiceInputRef.current?.click()}
              onTriggerBatchVoiceUpload={() => batchVoiceInputRef.current?.click()}
              onClearVoiceClip={handleClearVoiceClip}
              onScrubBeatLocalTime={(beatStart, localSec) => {
                setIsPlaying(false);
                isPlayingRef.current = false;
                audioRef.current?.setPlaying(false);
                jumpToTime(beatStart + localSec);
              }}
              onAddActionCueOnWave={(frame) => {
                pendingHistoryLabelRef.current = 'Add Action Cue on Wave';
                const nextCues = [
                  ...(selectedBeat.actionCues || []),
                  {
                    frame,
                    endFrame: frame + 36,
                    cameraPunch: 0.08,
                    sfx: 'none' as SfxId,
                  },
                ];
                updateSelectedBeat({ actionCues: nextCues });
              }}
              onToggleAutoDuck={() => {
                const next = !autoDuck;
                setAutoDuck(next);
                audioRef.current?.setAutoDuck(next);
              }}
              onPreviewSfx={(sfx) => {
                ensureAudio();
                audioRef.current?.playSfx(sfx, true);
              }}
              onCustomPropUpload={handleCustomPropUpload}
              onAutoTagStageChanges={handleAutoTagStageChanges}
            />
          )}

          {/* TAB 2: ART ENGINE, SERIES LOOK & CAST WARDROBE CUSTOMIZER (Extracted Memoized Module) */}
          {panelTab === 'look' && (
            <WorkbenchLookTab
              episode={episode}
              selectedBeatIdx={selectedBeatIdx}
              resolvedStyle={resolvedStyle}
              expressionsEnabled={expressionsEnabled}
              brandKit={brandKit}
              brandLogoInputRef={brandLogoInputRef}
              onSelectRenderStyle={handleSelectRenderStyle}
              onSelectMotionCadence={handleSelectMotionCadence}
              onSelectMotionProfile={handleSelectMotionProfile}
              onSelectPostFxPass={handleSelectPostFxPass}
              onPolishAnimationPrinciples={handlePolishAnimationPrinciples}
              onMatchShelfStyle={handleMatchShelfStyle}
              onAutoStyleNestedFlashbacks={() => {
                setEpisode((prev) => {
                  const nextBeats = prev.beats.map((b) =>
                    b.frame === 'nested_story'
                      ? { ...b, renderStyle: 'shadow_puppetry' as RenderStyleId }
                      : b
                  );
                  const updated = { ...prev, beats: nextBeats };
                  setJsonDraft(JSON.stringify(updated, null, 2));
                  return updated;
                });
              }}
              onApplyLookPreset={applyLookPreset}
              onUpdateVisualStyle={updateVisualStyle}
              onUpdateBrandKit={updateBrandKitState}
              onBrandLogoUpload={handleBrandLogoUpload}
              onOpenWorkshopForNewEntity={openWorkshopForNewEntity}
              onEditCastMemberWorkshop={(member) => setWorkshopTarget({ member, isNew: false })}
              onUpdateCastMember={updateCastMember}
            />
          )}

          {/* TAB 3: COMPLETE LIVE ASSET CATALOG (Extracted Memoized Module) */}
          {panelTab === 'assets' && (
            <WorkbenchAssetsTab
              assetCat={assetCat}
              onSelectAssetCat={setAssetCat}
              episode={episode}
              selectedBeat={selectedBeat}
              selectedBeatIdx={selectedBeatIdx}
              customBackdropInputRef={customBackdropInputRef}
              onCustomBackdropUpload={handleCustomBackdropUpload}
              procBackdropTheme={procBackdropTheme}
              onChangeProcBackdropTheme={setProcBackdropTheme}
              procBackdropSeed={procBackdropSeed}
              onCycleProcBackdropSeed={() => setProcBackdropSeed((s) => ((s * 37 + 17) % 997) + 1)}
              onGenerateProceduralBackdrop={handleGenerateProceduralBackdrop}
              actArcPreset={actArcPreset}
              onChangeActArcPreset={setActArcPreset}
              onApplyActVisualArc={handleApplyActVisualArc}
              procPropPreset={procPropPreset}
              onChangeProcPropPreset={setProcPropPreset}
              procPropSeed={procPropSeed}
              onCycleProcPropSeed={() => setProcPropSeed((s) => ((s * 29 + 7) % 97) + 1)}
              onGenerateProceduralProp={handleGenerateProceduralProp}
              onOpenWorkshopForNewEntity={openWorkshopForNewEntity}
              onAddArchetypeToEpisode={addArchetypeToEpisode}
              onAddSpritePresetToEpisode={addSpritePresetToEpisode}
              onUpdateSelectedBeat={updateSelectedBeat}
            />
          )}

          {/* TAB 4: AI DIRECTOR PROMPT & LIVE JSON ORCHESTRATION (Extracted Memoized Module) */}
          {panelTab === 'script' && (
            <WorkbenchScriptTab
              episode={episode}
              copiedPrompt={copiedPrompt}
              jsonError={jsonError}
              jsonDraft={jsonDraft}
              jsonAppliedMsg={jsonAppliedMsg}
              jsonImportInputRef={jsonImportInputRef}
              onGeneratedEpisode={handleApplyExternalEpisode}
              onCopyPrompt={handleCopyPrompt}
              onChangeJsonDraft={setJsonDraft}
              onImportChapterJson={handleImportChapterJson}
              onExportChapterJson={handleExportChapterJson}
              onApplyJson={handleApplyJson}
            />
          )}

          {/* TAB 3: CONFIGURABLE MULTI-VOICE STUDIO */}
          {panelTab === 'voice' && selectedBeat && (
            <VoiceStudioPanel
              episode={episode}
              selectedBeat={selectedBeat}
              selectedBeatIdx={selectedBeatIdx}
              voiceMeta={voiceMeta}
              onBindVoiceBlob={handleBindVoiceBlob}
              onClearVoiceClip={handleClearVoiceClip}
              onTriggerSingleUpload={() => voiceInputRef.current?.click()}
              onTriggerBatchUpload={() => batchVoiceInputRef.current?.click()}
              musicStemMeta={musicStemMeta}
              onUploadMusicStem={handleUploadMusicStem}
              onClearMusicStem={handleClearMusicStem}
              onTightenAllVoices={handleTightenAllVoices}
              onOpenVoiceBooth={() => setVoiceBoothOpen(true)}
            />
          )}
        </aside>
      </div>

      {/* Shorts Slicer & 1-Click YouTube Thumbnail Studio Modal */}
      {shortsModalOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center text-xs text-[#eef1f8]">
              Loading Shorts & Thumbnail Studio…
            </div>
          }
        >
          <ShortsAndThumbnailModal
            episode={episode}
            onClose={() => setShortsModalOpen(false)}
            onExportShortSlice={handleExportShortSlice}
            onFastRenderShortSlice={handleFastRenderShortSlice}
            onExportShortKatha={handleExportShortKatha}
          />
        </Suspense>
      )}

      {/* Channel Growth Suite Modal: YPP Shield, Retention Auditor, Anthology Stitcher, Multi-Language Dubbing, Cast Bible & Launch/MP4 */}
      {growthModalOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center text-xs text-[#eef1f8]">
              Loading Channel Growth Suite…
            </div>
          }
        >
          <ChannelGrowthModal
            episode={episode}
            initialTab={growthInitialTab}
            voiceClipCount={audioRef.current?.getAllVoiceClips().size ?? 0}
            activeVoiceBlobs={voiceBlobsRef.current}
            onClose={() => setGrowthModalOpen(false)}
            onApplyEpisode={handleApplyExternalEpisode}
            onApplyAnthologyVoices={handleApplyAnthologyVoices}
            onOpenVoiceTab={() => setPanelTab('voice')}
            onOpenWorkshop={(castId) => openWorkshopForCastId(castId)}
          />
        </Suspense>
      )}

      {/* Sims-Style Modular Character, Animal, Creature & Spirit DNA Workshop Modal */}
      {workshopTarget && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center text-xs text-[#eef1f8]">
              Loading Entity DNA Workshop…
            </div>
          }
        >
          <EntityWorkshopModal
            member={workshopTarget.member}
            isNew={workshopTarget.isNew}
            episode={episode}
            onSave={handleSaveWorkshopMember}
            onSaveToBible={handleSaveWorkshopToBible}
            onClose={() => setWorkshopTarget(null)}
          />
        </Suspense>
      )}

      {/* Deterministic Faster-Than-Realtime WebCodecs Offline Video & Master WAV Renderer */}
      {fastRenderOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center text-xs text-[#eef1f8]">
              Loading Offline Renderer…
            </div>
          }
        >
          <FastRenderModal
            open={fastRenderOpen}
            onClose={() => {
              setFastRenderOpen(false);
              setFastRenderOverride(null);
            }}
            episode={fastRenderOverride?.episode ?? episode}
            aspect={fastRenderOverride?.aspect ?? aspect}
            showCaptions={showCaptions}
            expressionsEnabled={expressionsEnabled}
            voiceClips={audioRef.current?.getAllVoiceClips() ?? new Map()}
            musicStemBuffer={audioRef.current?.getMusicStemBuffer() ?? null}
            musicLevel={0.45}
            autoDuck={autoDuck}
            onApplyEpisode={fastRenderOverride ? undefined : handleApplyExternalEpisode}
            onOpenYppShield={() => {
              setGrowthInitialTab('ypp');
              setGrowthModalOpen(true);
            }}
            onFallbackRealtime={() => {
              setFastRenderOpen(false);
              setFastRenderOverride(null);
              toggleRecording();
            }}
          />
        </Suspense>
      )}
      {/* Storyboard Contact Sheet & Pre-Render Visual QA Gate Modal */}
      <StoryboardQaModal
        open={qaModalOpen}
        episode={episode}
        aspect={aspect}
        showCaptions={showCaptions}
        expressionsEnabled={expressionsEnabled}
        onClose={() => setQaModalOpen(false)}
        onJumpToBeat={(beatIdx) => {
          setSelectedBeatIdx(beatIdx);
          jumpToTime(beatStarts[beatIdx] ?? 0);
        }}
        onApplyFixedEpisode={(fixedEp, summary) => {
          pendingHistoryLabelRef.current = summary;
          setEpisode(fixedEp);
          setJsonDraft(JSON.stringify(fixedEp, null, 2));
          setSelectedBeatIdx((idx) => Math.min(idx, Math.max(0, fixedEp.beats.length - 1)));
        }}
      />

      {/* Upgrade 15: Voiceover Booth Teleprompter & Multi-Take Recorder Modal */}
      {voiceBoothOpen && (
        <TeleprompterModal
          episode={episode}
          initialBeatIdx={selectedBeatIdx}
          voiceMeta={voiceMeta}
          onBindVoiceBlob={handleBindVoiceBlob}
          onClose={() => setVoiceBoothOpen(false)}
        />
      )}

      {/* Upgrade 18: History Checkpoint Diff & Selective Beat Snapshot Restore Modal */}
      {versionDiffOpen && (
        <VersionDiffModal
          currentEpisode={episode}
          checkpoints={pastRef.current}
          onRestoreBeatFromCheckpoint={handleRestoreSingleBeat}
          onRestoreEntireCheckpoint={handleRestoreCheckpoint}
          onClose={() => setVersionDiffOpen(false)}
        />
      )}

      {/* Upgrade 19: Studio Command Palette (Ctrl/Cmd+K) & NLE Shortcut Cheat-Sheet */}
      {commandPaletteOpen && (
        <CommandPaletteModal
          commands={studioCommands}
          onExecute={handleExecuteCommand}
          onClose={() => setCommandPaletteOpen(false)}
        />
      )}
    </div>
  );
}
