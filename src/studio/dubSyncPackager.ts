/**
 * Stagecraft Studio — Multi-Language Dub Timing & MLA Track Packager
 *
 * Given a master EpisodeScript and translated variants, computes per-beat
 * speech-rate adjustment targets (0.85x..1.25x) so dubbed TTS tracks align
 * frame-accurately to master video visual cuts; exports synced .SRT, WebVTT (.VTT)
 * with speaker tags, YouTube chapters, and MLA track manifests.
 */

import type { EpisodeScript, StoryBeat } from './types';
import { buildBinaryZipBytes, type BinaryZipEntry } from './mlaPackager';

export type DubAlignmentStatus = 'aligned' | 'speed_up' | 'slow_down' | 'tight_fit';

export interface BeatDubTimingTarget {
  beatIdx: number;
  beatId: string;
  beatTitle: string;
  startSec: number;
  endSec: number;
  masterDurationSec: number;
  naturalDubDurationSec: number;
  /** Recommended TTS speech-rate multiplier clamped strictly to [0.85, 1.25] */
  speechRate: number;
  /** Estimated duration after applying clamped speechRate */
  adjustedDurationSec: number;
  /** Remaining timing delta vs master visual cut (positive = still slightly long) */
  residualDriftSec: number;
  status: DubAlignmentStatus;
}

export interface DubTimingPlan {
  masterEpisodeId: string;
  targetLang: string;
  totalMasterDurationSec: number;
  averageSpeechRate: number;
  tightFitBeats: number;
  beats: BeatDubTimingTarget[];
}

export interface MlaVariantInput {
  langCode: string;
  label?: string;
  episode: EpisodeScript;
}

export interface MlaTrackManifestEntry {
  langCode: string;
  label: string;
  isMaster: boolean;
  srtFile: string;
  vttFile: string;
  averageSpeechRate: number;
  tightFitBeats: number;
  beatRates: Array<{
    beatId: string;
    startSec: number;
    endSec: number;
    speechRate: number;
    status: DubAlignmentStatus;
  }>;
}

export interface MlaTrackManifest {
  schemaVersion: 1;
  episodeId: string;
  title: string;
  totalDurationSec: number;
  chapters: Array<{ timestamp: string; startSec: number; title: string }>;
  tracks: MlaTrackManifestEntry[];
}

/**
 * Estimates natural spoken TTS duration in seconds across Latin, Devanagari/Indic,
 * Arabic, and CJK scripts without requiring audio synthesis.
 */
export function estimateNaturalSpeechSec(dialogue: string, langCode?: string): number {
  const clean = dialogue.trim();
  if (!clean) return 0;

  const cjk = (clean.match(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/g) || []).length;
  const indic = (clean.match(/[\u0900-\u0d7f]/g) || []).length;
  const arabic = (clean.match(/[\u0600-\u06ff]/g) || []).length;
  const nonSpace = clean.replace(/\s+/g, '').length || 1;
  const pauses = (clean.match(/[,.;:!?।॥—–]/g) || []).length * 0.12;

  if (cjk / nonSpace >= 0.35 || /^(ja|zh|ko)/i.test(langCode || '')) {
    const chars = Math.max(cjk, nonSpace);
    return Number((chars / 4.2 + pauses + 0.25).toFixed(3));
  }

  const words = clean.split(/\s+/).filter(Boolean).length;
  if (indic / nonSpace >= 0.35 || /^(hi|ta|te|bn|mr|gu|kn|ml|pa)/i.test(langCode || '')) {
    // Indic voices articulate ~2.25 words/sec naturally
    return Number((words / 2.25 + pauses + 0.28).toFixed(3));
  }

  if (arabic / nonSpace >= 0.35 || /^ar/i.test(langCode || '')) {
    return Number((words / 2.3 + pauses + 0.28).toFixed(3));
  }

  // Latin / European languages ~2.55 words/sec
  return Number((words / 2.55 + pauses + 0.25).toFixed(3));
}

/**
 * Computes per-beat speech-rate adjustment targets (0.85x..1.25x) so translated
 * dubbing tracks align frame-accurately to the master video's visual cuts.
 */
export function computeDubTimingPlan(
  master: EpisodeScript,
  translated: EpisodeScript,
  langCode?: string
): DubTimingPlan {
  const targetLang = (langCode || translated.language || 'en').toLowerCase();
  const translatedById = new Map<string, StoryBeat>();
  for (const b of translated.beats) {
    translatedById.set(b.id, b);
  }

  const beats: BeatDubTimingTarget[] = [];
  let cursor = 0;
  let rateSum = 0;
  let spokenCount = 0;
  let tightFitBeats = 0;

  for (let i = 0; i < master.beats.length; i++) {
    const mBeat = master.beats[i];
    const tBeat = translatedById.get(mBeat.id) || translated.beats[i] || mBeat;
    const masterDur = Math.max(1.2, Number(mBeat.duration) || 4);
    const availableSpeechWindow = Math.max(0.8, masterDur - 0.24);
    const naturalDur = estimateNaturalSpeechSec(tBeat.dialogue || '', targetLang);

    let rawRate = 1.0;
    if (naturalDur > 0.2) {
      rawRate = naturalDur / availableSpeechWindow;
    }

    const speechRate = Number(Math.max(0.85, Math.min(1.25, rawRate)).toFixed(2));
    const adjustedDurationSec =
      naturalDur > 0 ? Number((naturalDur / speechRate).toFixed(2)) : 0;
    const residualDriftSec = Number((adjustedDurationSec - availableSpeechWindow).toFixed(2));

    let status: DubAlignmentStatus = 'aligned';
    if (naturalDur > 0) {
      spokenCount++;
      rateSum += speechRate;
      if (rawRate > 1.26) {
        status = 'tight_fit';
        tightFitBeats++;
      } else if (speechRate >= 1.06) {
        status = 'speed_up';
      } else if (speechRate <= 0.94) {
        status = 'slow_down';
      }
    }

    beats.push({
      beatIdx: i,
      beatId: mBeat.id,
      beatTitle: mBeat.title || `Beat ${i + 1}`,
      startSec: Number(cursor.toFixed(3)),
      endSec: Number((cursor + masterDur).toFixed(3)),
      masterDurationSec: Number(masterDur.toFixed(2)),
      naturalDubDurationSec: Number(naturalDur.toFixed(2)),
      speechRate,
      adjustedDurationSec,
      residualDriftSec,
      status,
    });

    cursor += masterDur;
  }

  return {
    masterEpisodeId: master.id,
    targetLang,
    totalMasterDurationSec: Number(cursor.toFixed(2)),
    averageSpeechRate:
      spokenCount > 0 ? Number((rateSum / spokenCount).toFixed(2)) : 1.0,
    tightFitBeats,
    beats,
  };
}

function formatSrtTimestamp(sec: number): string {
  const safe = Math.max(0, sec);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = Math.floor(safe % 60);
  const ms = Math.round((safe - Math.floor(safe)) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(Math.min(999, ms)).padStart(3, '0')}`;
}

function formatVttTimestamp(sec: number): string {
  return formatSrtTimestamp(sec).replace(',', '.');
}

function formatChapterTimestamp(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function escapeVttVoiceTag(speaker: string): string {
  return speaker.replace(/[<>&\n\r]/g, '').trim() || 'Narrator';
}

/**
 * Exports synced .SRT captions aligned strictly to master video visual cuts.
 */
export function generateSyncedSrt(
  episode: EpisodeScript,
  masterForTiming?: EpisodeScript
): string {
  const timingBeats = (masterForTiming || episode).beats;
  const textById = new Map(episode.beats.map((b) => [b.id, b]));
  const lines: string[] = [];
  let cursor = 0;
  let cue = 1;

  for (let i = 0; i < timingBeats.length; i++) {
    const mBeat = timingBeats[i];
    const tBeat = textById.get(mBeat.id) || episode.beats[i] || mBeat;
    const dur = Math.max(1.2, Number(mBeat.duration) || 4);
    const text = (tBeat.dialogue || '').trim();
    if (text) {
      const prefix =
        tBeat.speakerLabel && tBeat.speakerId !== 'narrator'
          ? `${tBeat.speakerLabel}: `
          : '';
      lines.push(
        `${cue}\n${formatSrtTimestamp(cursor + 0.08)} --> ${formatSrtTimestamp(cursor + dur - 0.08)}\n${prefix}${text}\n`
      );
      cue++;
    }
    cursor += dur;
  }

  return lines.join('\n');
}

/**
 * Exports synced WebVTT (.vtt) with `<v SpeakerName>` tags aligned strictly to master cuts.
 */
export function generateSyncedWebVtt(
  episode: EpisodeScript,
  masterForTiming?: EpisodeScript
): string {
  const timingBeats = (masterForTiming || episode).beats;
  const textById = new Map(episode.beats.map((b) => [b.id, b]));
  const lines: string[] = ['WEBVTT', ''];
  let cursor = 0;

  for (let i = 0; i < timingBeats.length; i++) {
    const mBeat = timingBeats[i];
    const tBeat = textById.get(mBeat.id) || episode.beats[i] || mBeat;
    const dur = Math.max(1.2, Number(mBeat.duration) || 4);
    const text = (tBeat.dialogue || '').trim();
    if (text) {
      const speaker = escapeVttVoiceTag(
        tBeat.speakerId === 'narrator' ? 'Narrator' : tBeat.speakerLabel || tBeat.speakerId
      );
      lines.push(
        `${formatVttTimestamp(cursor + 0.08)} --> ${formatVttTimestamp(cursor + dur - 0.08)}`,
        `<v ${speaker}>${text}`,
        ''
      );
    }
    cursor += dur;
  }

  return lines.join('\n');
}

/**
 * Exports clean YouTube description chapters from master beat cut boundaries.
 */
export function generateYouTubeChaptersText(episode: EpisodeScript): string {
  let cursor = 0;
  const rows: string[] = [];
  for (let i = 0; i < episode.beats.length; i++) {
    const b = episode.beats[i];
    rows.push(`${formatChapterTimestamp(cursor)} ${b.title || `Scene ${i + 1}`}`);
    cursor += Math.max(1.2, Number(b.duration) || 4);
  }
  return rows.join('\n');
}

/**
 * Builds a complete YouTube Multi-Language Audio (MLA) & Caption Track Manifest
 * pairing master visual timing with per-language speech-rate targets.
 */
export function buildMlaTrackManifest(
  master: EpisodeScript,
  variants: MlaVariantInput[] = []
): MlaTrackManifest {
  const chapters: MlaTrackManifest['chapters'] = [];
  let cursor = 0;
  for (let i = 0; i < master.beats.length; i++) {
    const b = master.beats[i];
    chapters.push({
      timestamp: formatChapterTimestamp(cursor),
      startSec: Number(cursor.toFixed(2)),
      title: b.title || `Scene ${i + 1}`,
    });
    cursor += Math.max(1.2, Number(b.duration) || 4);
  }

  const masterLang = (master.language || 'en').toLowerCase();
  const tracks: MlaTrackManifestEntry[] = [];

  const allTracks: Array<{ langCode: string; label: string; isMaster: boolean; ep: EpisodeScript }> = [
    { langCode: masterLang, label: `Master (${masterLang.toUpperCase()})`, isMaster: true, ep: master },
    ...variants
      .filter((v) => v.langCode.toLowerCase() !== masterLang)
      .map((v) => ({
        langCode: v.langCode.toLowerCase(),
        label: v.label || v.langCode.toUpperCase(),
        isMaster: false,
        ep: v.episode,
      })),
  ];

  for (const item of allTracks) {
    const plan = computeDubTimingPlan(master, item.ep, item.langCode);
    const safeLang = item.langCode.replace(/[^a-z0-9_-]/gi, '_');
    tracks.push({
      langCode: item.langCode,
      label: item.label,
      isMaster: item.isMaster,
      srtFile: `subtitles_${safeLang}.srt`,
      vttFile: `subtitles_${safeLang}.vtt`,
      averageSpeechRate: plan.averageSpeechRate,
      tightFitBeats: plan.tightFitBeats,
      beatRates: plan.beats.map((b) => ({
        beatId: b.beatId,
        startSec: b.startSec,
        endSec: b.endSec,
        speechRate: b.speechRate,
        status: b.status,
      })),
    });
  }

  return {
    schemaVersion: 1,
    episodeId: master.id,
    title: master.title,
    totalDurationSec: Number(cursor.toFixed(2)),
    chapters,
    tracks,
  };
}

/**
 * Packages synced .SRT, WebVTT (.VTT with speaker tags), YouTube chapters,
 * and `mla_track_manifest.json` into a clean downloadable ZIP archive.
 */
export function buildDubSyncPackageZipBytes(
  master: EpisodeScript,
  variants: MlaVariantInput[] = []
): Uint8Array {
  const manifest = buildMlaTrackManifest(master, variants);
  const enc = new TextEncoder();
  const entries: BinaryZipEntry[] = [];

  const addText = (path: string, content: string) => {
    entries.push({ path, data: enc.encode(content) });
  };

  addText('mla_track_manifest.json', JSON.stringify(manifest, null, 2));
  addText('youtube_chapters.txt', generateYouTubeChaptersText(master));

  const masterLang = (master.language || 'en').toLowerCase().replace(/[^a-z0-9_-]/gi, '_');
  addText(`subtitles_${masterLang}.srt`, generateSyncedSrt(master, master));
  addText(`subtitles_${masterLang}.vtt`, generateSyncedWebVtt(master, master));

  for (const v of variants) {
    const safeLang = v.langCode.toLowerCase().replace(/[^a-z0-9_-]/gi, '_');
    if (safeLang === masterLang) continue;
    addText(`subtitles_${safeLang}.srt`, generateSyncedSrt(v.episode, master));
    addText(`subtitles_${safeLang}.vtt`, generateSyncedWebVtt(v.episode, master));
  }

  return buildBinaryZipBytes(entries);
}
