/**
 * Stagecraft Studio — Wave 8 (Upgrade 42): Shot-Inspector Native QA Telemetry Bundle
 *
 * Exports deterministic `stagecraft-shot-inspector/v1` telemetry bundles so companion
 * Shot-Inspector can audit composition, timing, hitstop/VFX windows, speech pacing,
 * lower-third placement, and Wave 7 CharacterDNA silhouette separation without
 * guessing or re-implementing Stagecraft math.
 *
 * Pure deterministic TypeScript — zero Math.random(), zero canvas allocations, zero deps.
 */
import {
  AspectMode,
  BeatActionCue,
  CastMember,
  EpisodeScript,
  STUDIO_FPS,
  StoryBeat,
  frameIndexToTime,
  resolveVisualStyle,
  timeToFrameIndex,
} from './types';
import { resolveEffectiveMotionFps } from './animationEngine';
import { measureDialogueReadingRate } from './continuityAuditor';
import type { CharacterDNA } from './characterDna';

export const STAGECRAFT_QA_BUNDLE_SCHEMA = 'stagecraft-shot-inspector/v1' as const;
export const STAGECRAFT_STUDIO_VERSION = '8.0.0' as const;

/** Deterministic fallback timestamp when caller omits `exportedAt` (keeps repeated calls bit-exact). */
export const DEFAULT_DETERMINISTIC_EXPORTED_AT = '2026-01-01T00:00:00.000Z';

export interface StagecraftHitstopWindowV1 {
  startSec: number;
  endSec: number;
  frames: number;
}

export interface StagecraftVfxBurstWindowV1 {
  startSec: number;
  endSec: number;
  intensity: number;
}

export interface StagecraftSpeechWindowV1 {
  startSec: number;
  endSec: number;
  wordCount: number;
  estimatedCps: number;
  speakerId: string;
}

export interface StagecraftLocationCardV1 {
  title: string;
  subtitle?: string;
  position?: string;
  style?: string;
}

export interface StagecraftActorTelemetryV1 {
  castId: string;
  slot: 'left' | 'center' | 'right' | 'overhead';
  pose: string;
  expression: string;
  offsetX: number;
  offsetY: number;
  hasGranularDna: boolean;
  dnaSilhouetteSignature: string;
}

export interface StagecraftBeatTelemetryV1 {
  beatIndex: number;
  beatId: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  shot: string;
  stage: string;
  renderStyle: string;
  transition: string;
  audioLeadSec: number;
  hitstopWindows: StagecraftHitstopWindowV1[];
  vfxBurstWindows: StagecraftVfxBurstWindowV1[];
  speechWindow: StagecraftSpeechWindowV1 | null;
  locationCard: StagecraftLocationCardV1 | null;
  actors: StagecraftActorTelemetryV1[];
}

export interface StagecraftAudioSummaryV1 {
  targetLufs: -14;
  targetTruePeakDbtp: -1.5;
  integratedLufs?: number;
  truePeakDbtp?: number;
}

export interface StagecraftQaBundleV1 {
  schema: 'stagecraft-shot-inspector/v1';
  exportedAt: string; // ISO-8601
  studioVersion: string;
  aspect: '16:9' | '9:16';
  fps: 60;
  episode: EpisodeScript;
  telemetry: {
    totalDurationSec: number;
    effectiveCadenceFps: 12 | 24 | 60;
    beatTimeline: StagecraftBeatTelemetryV1[];
    audioSummary?: StagecraftAudioSummaryV1;
  };
}

export interface BuildStagecraftQaBundleOptions {
  aspect?: AspectMode;
  exportedAt?: string;
  studioVersion?: string;
  integratedLufs?: number;
  truePeakDbtp?: number;
}

const IMPACT_SFX_SET = new Set<string>(['sword_clash', 'thunder_crack']);
const IMPACT_FX_SET = new Set<string>([
  'crimson_impact',
  'shock_burst',
  'shatter_glass',
  'comic_pow',
]);

function roundSec(v: number): number {
  return Number(v.toFixed(4));
}

function roundNum(v: number, digits = 3): number {
  return Number(v.toFixed(digits));
}

function fnv1aHex(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function normalizeCadenceBucket(rawFps: number): 12 | 24 | 60 {
  if (rawFps <= 16) return 12;
  if (rawFps <= 36) return 24;
  return 60;
}

/**
 * Checks whether a CastMember uses Wave 7 granular DNA customization
 * (face morphs, granular facial parts, combinable body marks, layered clothing,
 * 5-slot accessories, or extended palette channels).
 */
export function hasGranularCharacterDna(castMember?: CastMember): boolean {
  const dna: CharacterDNA | undefined = castMember?.dna;
  if (!dna) return false;
  if (dna.faceMorph && Object.keys(dna.faceMorph).length > 0) return true;
  if (Array.isArray(dna.bodyMarks) && dna.bodyMarks.some((m) => m && m !== 'none')) return true;
  if (
    dna.accessories &&
    Object.values(dna.accessories).some((v) => typeof v === 'string' && v !== 'none')
  ) {
    return true;
  }
  if (
    dna.head &&
    ((dna.head.eyebrowStyle && dna.head.eyebrowStyle !== 'natural_arch') ||
      (dna.head.pupilStyle && dna.head.pupilStyle !== 'round') ||
      (dna.head.eyelashStyle && dna.head.eyelashStyle !== 'none') ||
      (dna.head.mouthStyle && dna.head.mouthStyle !== 'classic') ||
      (dna.head.secondaryFaceMark && dna.head.secondaryFaceMark !== 'none') ||
      (typeof dna.head.blushIntensity === 'number' && dna.head.blushIntensity > 0))
  ) {
    return true;
  }
  if (
    dna.outfit &&
    ((dna.outfit.outerwear && dna.outfit.outerwear !== 'none') ||
      (dna.outfit.sleeveStyle && dna.outfit.sleeveStyle !== 'auto') ||
      (dna.outfit.waistStyle && dna.outfit.waistStyle !== 'none') ||
      (dna.outfit.gloves && dna.outfit.gloves !== 'none') ||
      (dna.outfit.footwear && dna.outfit.footwear !== 'auto'))
  ) {
    return true;
  }
  if (
    dna.palette &&
    Boolean(dna.palette.eyeSecondary || dna.palette.lip || dna.palette.brow || dna.palette.markTint)
  ) {
    return true;
  }
  return false;
}

/**
 * Computes a deterministic silhouette signature for any CastMember incorporating
 * base archetype, color, and Wave 7 CharacterDNA silhouette-defining traits.
 * Pure function — zero Math.random().
 */
export function computeDnaSilhouetteSignature(castMember?: CastMember): string {
  if (!castMember) return 'dna_00000000';
  const dna = castMember.dna;
  const parts: string[] = [
    `arch:${castMember.archetype || 'unknown'}`,
    `col:${(castMember.primaryColor || '').toLowerCase()}`,
    `acc:${(castMember.accentColor || '').toLowerCase()}`,
  ];

  if (dna) {
    const morph = dna.morph;
    const head = dna.head;
    const outfit = dna.outfit;
    const acc = dna.accessories;
    const app = dna.appendages;
    const bodyMarks = Array.isArray(dna.bodyMarks)
      ? dna.bodyMarks.filter((m) => m && m !== 'none').slice().sort().join(',')
      : '';
    parts.push(
      `ch:${dna.chassis || 'humanoid'}`,
      `h:${roundNum(morph?.height ?? 1, 2)}`,
      `sw:${roundNum(morph?.shoulderWidth ?? 1, 2)}`,
      `tb:${roundNum(morph?.torsoBulk ?? 1, 2)}`,
      `hr:${roundNum(morph?.headRatio ?? 1, 2)}`,
      `hs:${head?.headShape || 'oval'}`,
      `hair:${head?.hairStyle || 'none'}`,
      `horns:${head?.horns || 'none'}`,
      `fm:${head?.faceMark || 'none'}+${head?.secondaryFaceMark || 'none'}`,
      `hw:${outfit?.headwear || 'none'}`,
      `top:${outfit?.topStyle || 'none'}`,
      `out:${outfit?.outerwear || 'none'}`,
      `cape:${outfit?.capeStyle || 'none'}`,
      `eye:${acc?.eyewear || 'none'}`,
      `back:${acc?.backGear || 'none'}`,
      `wing:${app?.wings || 'none'}`,
      `tail:${app?.tail || 'none'}`,
      `bm:${bodyMarks}`
    );
  }

  return `dna_${fnv1aHex(parts.join('|'))}`;
}

function resolveCueStartFrameLocal(
  cue: BeatActionCue,
  beatDur: number,
  totalBeatFrames: number
): number {
  if (typeof cue.frame === 'number' && Number.isFinite(cue.frame)) {
    return Math.max(0, Math.min(totalBeatFrames - 1, Math.round(cue.frame)));
  }
  if (typeof cue.timeSec === 'number' && Number.isFinite(cue.timeSec)) {
    return Math.max(
      0,
      Math.min(totalBeatFrames - 1, timeToFrameIndex(Math.max(0, cue.timeSec), STUDIO_FPS))
    );
  }
  if (typeof cue.at === 'number' && Number.isFinite(cue.at)) {
    const clampedAt = Math.max(0, Math.min(0.98, cue.at));
    return Math.max(
      0,
      Math.min(totalBeatFrames - 1, Math.round(clampedAt * beatDur * STUDIO_FPS))
    );
  }
  return Math.round(totalBeatFrames * 0.25);
}

function extractBeatHitstopWindows(
  beat: StoryBeat,
  beatStartFrame: number,
  totalBeatFrames: number,
  beatDur: number,
  hitstopEnabled: boolean
): StagecraftHitstopWindowV1[] {
  if (!hitstopEnabled) return [];
  const raw: Array<{ localFrame: number; frames: number }> = [];

  if (Array.isArray(beat.actionCues)) {
    for (const cue of beat.actionCues) {
      const isAttack = cue.pose === 'attack';
      const isPunch = typeof cue.cameraPunch === 'number' && cue.cameraPunch >= 0.5;
      const isImpactSfx = Boolean(cue.sfx && IMPACT_SFX_SET.has(cue.sfx));
      const isImpactFx = Boolean(cue.fx && IMPACT_FX_SET.has(cue.fx));
      if (!isAttack && !isPunch && !isImpactSfx && !isImpactFx) continue;
      const localFrame = resolveCueStartFrameLocal(cue, beatDur, totalBeatFrames);
      const frames =
        isImpactSfx || (typeof cue.cameraPunch === 'number' && cue.cameraPunch >= 0.78)
          ? 4
          : isAttack || isImpactFx
            ? 3
            : 2;
      raw.push({ localFrame, frames });
    }
  }

  if (beat.sfx && IMPACT_SFX_SET.has(beat.sfx)) {
    const offsetSec =
      typeof beat.sfxOffsetSec === 'number' && Number.isFinite(beat.sfxOffsetSec)
        ? Math.max(0, Math.min(beatDur - 0.08, beat.sfxOffsetSec))
        : 0.12;
    raw.push({
      localFrame: timeToFrameIndex(offsetSec, STUDIO_FPS),
      frames: beat.sfx === 'thunder_crack' ? 4 : 3,
    });
  }

  if (beat.fx && IMPACT_FX_SET.has(beat.fx)) {
    const fxFrame = Math.max(0, Math.min(totalBeatFrames - 1, Math.round(0.14 * STUDIO_FPS)));
    raw.push({ localFrame: fxFrame, frames: 3 });
  }

  if (Array.isArray(beat.actors) && beat.actors.some((a) => a.pose === 'attack')) {
    const attackFrame = Math.max(
      0,
      Math.min(totalBeatFrames - 1, Math.round(totalBeatFrames * 0.22))
    );
    raw.push({ localFrame: attackFrame, frames: 3 });
  }

  if (raw.length === 0) return [];
  raw.sort((a, b) => a.localFrame - b.localFrame || b.frames - a.frames);

  // Deduplicate windows within 10 frames of each other (mirrors impactVfx.ts)
  const merged: Array<{ localFrame: number; frames: number }> = [];
  for (const item of raw) {
    const prev = merged[merged.length - 1];
    if (prev && item.localFrame - prev.localFrame <= 10) {
      if (item.frames > prev.frames) prev.frames = item.frames;
    } else {
      merged.push({ ...item });
    }
  }

  return merged.map((ev) => {
    const startF = beatStartFrame + ev.localFrame;
    const endF = Math.min(beatStartFrame + totalBeatFrames, startF + ev.frames);
    return {
      startSec: roundSec(frameIndexToTime(startF, STUDIO_FPS)),
      endSec: roundSec(frameIndexToTime(endF, STUDIO_FPS)),
      frames: Math.max(1, endF - startF),
    };
  });
}

function extractBeatVfxBurstWindows(
  beat: StoryBeat,
  beatStartFrame: number,
  totalBeatFrames: number,
  beatDur: number,
  vfxIntensity: number
): StagecraftVfxBurstWindowV1[] {
  const safeIntensity = Math.max(0, Math.min(1, vfxIntensity));
  if (safeIntensity <= 0) return [];
  const windows: StagecraftVfxBurstWindowV1[] = [];

  if (beat.transition === 'popup_fold') {
    const foldFrames = Math.min(totalBeatFrames, Math.round(0.65 * STUDIO_FPS));
    windows.push({
      startSec: roundSec(frameIndexToTime(beatStartFrame, STUDIO_FPS)),
      endSec: roundSec(frameIndexToTime(beatStartFrame + foldFrames, STUDIO_FPS)),
      intensity: roundNum(Math.min(1, Math.max(0.35, safeIntensity * 0.85)), 3),
    });
  }

  if (beat.fx && beat.fx !== 'none') {
    const startOffset = Math.min(totalBeatFrames - 1, Math.round(0.08 * STUDIO_FPS));
    const spanFrames = Math.min(
      totalBeatFrames - startOffset,
      Math.max(Math.round(0.45 * STUDIO_FPS), Math.round(totalBeatFrames * 0.65))
    );
    const boost = IMPACT_FX_SET.has(beat.fx) ? 1.0 : 0.78;
    windows.push({
      startSec: roundSec(frameIndexToTime(beatStartFrame + startOffset, STUDIO_FPS)),
      endSec: roundSec(frameIndexToTime(beatStartFrame + startOffset + spanFrames, STUDIO_FPS)),
      intensity: roundNum(Math.min(1, safeIntensity * boost), 3),
    });
  }

  if (Array.isArray(beat.actionCues)) {
    for (const cue of beat.actionCues) {
      const hasFx = Boolean(cue.fx && cue.fx !== 'none');
      const hasPunch = typeof cue.cameraPunch === 'number' && cue.cameraPunch >= 0.35;
      const hasPulse = typeof cue.propPulse === 'number' && cue.propPulse >= 0.35;
      if (!hasFx && !hasPunch && !hasPulse) continue;
      const localStart = resolveCueStartFrameLocal(cue, beatDur, totalBeatFrames);
      const localEnd =
        typeof cue.endFrame === 'number' && Number.isFinite(cue.endFrame) && cue.endFrame > localStart
          ? Math.min(totalBeatFrames, Math.round(cue.endFrame))
          : Math.min(totalBeatFrames, localStart + Math.round(0.45 * STUDIO_FPS));
      const peak = Math.max(
        hasFx ? safeIntensity : 0,
        hasPunch ? Math.min(1, (cue.cameraPunch ?? 0) * safeIntensity) : 0,
        hasPulse ? Math.min(1, (cue.propPulse ?? 0) * safeIntensity) : 0
      );
      windows.push({
        startSec: roundSec(frameIndexToTime(beatStartFrame + localStart, STUDIO_FPS)),
        endSec: roundSec(frameIndexToTime(beatStartFrame + localEnd, STUDIO_FPS)),
        intensity: roundNum(Math.max(0.15, Math.min(1, peak)), 3),
      });
    }
  }

  windows.sort((a, b) => a.startSec - b.startSec || a.endSec - b.endSec);
  return windows;
}

function extractBeatSpeechWindow(
  beat: StoryBeat,
  beatStartSec: number,
  beatEndSec: number,
  beatDur: number,
  audioLeadSec: number
): StagecraftSpeechWindowV1 | null {
  const text = typeof beat.dialogue === 'string' ? beat.dialogue.trim() : '';
  if (!text) return null;

  const reading = measureDialogueReadingRate(text, beatDur);
  const wordCount =
    reading.unit === 'wpm' && reading.unitCount > 0
      ? reading.unitCount
      : text.split(/\s+/).filter(Boolean).length || reading.unitCount;

  // J-cut (+audioLeadSec) pre-rolls speech before visual cut; L-cut (-audioLeadSec) delays entry.
  const rawStart = beatStartSec + 0.08 - audioLeadSec;
  const startSec = Math.max(0, roundSec(rawStart));
  const rawEnd = Math.max(startSec + 0.25, beatEndSec - 0.12 - Math.max(0, audioLeadSec * 0.5));
  const endSec = roundSec(Math.min(beatEndSec + 0.6, rawEnd));
  const speakDur = Math.max(0.25, endSec - startSec);
  const nonSpaceChars = text.replace(/\s+/g, '').length;
  const estimatedCps = roundNum(nonSpaceChars / speakDur, 2);

  return {
    startSec,
    endSec,
    wordCount,
    estimatedCps,
    speakerId: beat.speakerId || 'narrator',
  };
}

/**
 * Builds a complete, deterministic `stagecraft-shot-inspector/v1` QA telemetry bundle.
 * Pure function of `(episode, options)` — zero Math.random(), zero side effects.
 */
export function buildStagecraftQaBundle(
  episode: EpisodeScript,
  options: BuildStagecraftQaBundleOptions = {}
): StagecraftQaBundleV1 {
  const aspect: '16:9' | '9:16' = options.aspect === '9:16' ? '9:16' : '16:9';
  const resolvedStyle = resolveVisualStyle(episode.visualStyle);
  const rawCadence = resolveEffectiveMotionFps(
    resolvedStyle.renderStyle,
    resolvedStyle.motionCadence
  );
  const effectiveCadenceFps = normalizeCadenceBucket(rawCadence);
  const hitstopEnabled = resolvedStyle.hitstopEnabled !== false;
  const vfxIntensity =
    typeof resolvedStyle.vfxIntensity === 'number' && Number.isFinite(resolvedStyle.vfxIntensity)
      ? resolvedStyle.vfxIntensity
      : 0.75;

  const castById = new Map<string, CastMember>();
  for (const member of episode.cast || []) {
    castById.set(member.id, member);
  }

  let cursorFrame = 0;
  const beatTimeline: StagecraftBeatTelemetryV1[] = [];

  for (let i = 0; i < (episode.beats || []).length; i++) {
    const beat = episode.beats[i];
    const safeDur = Math.max(0.5, Number.isFinite(beat.duration) ? beat.duration : 4);
    const beatFrames = Math.max(1, timeToFrameIndex(safeDur, STUDIO_FPS));
    const startFrame = cursorFrame;
    const endFrame = cursorFrame + beatFrames;
    const startSec = roundSec(frameIndexToTime(startFrame, STUDIO_FPS));
    const endSec = roundSec(frameIndexToTime(endFrame, STUDIO_FPS));
    const durationSec = roundSec(frameIndexToTime(beatFrames, STUDIO_FPS));
    const audioLeadSec =
      typeof beat.audioLeadSec === 'number' && Number.isFinite(beat.audioLeadSec)
        ? roundNum(Math.max(-0.6, Math.min(0.6, beat.audioLeadSec)), 3)
        : 0;

    const hitstopWindows = extractBeatHitstopWindows(
      beat,
      startFrame,
      beatFrames,
      durationSec,
      hitstopEnabled
    );
    const vfxBurstWindows = extractBeatVfxBurstWindows(
      beat,
      startFrame,
      beatFrames,
      durationSec,
      vfxIntensity
    );
    const speechWindow = extractBeatSpeechWindow(
      beat,
      startSec,
      endSec,
      durationSec,
      audioLeadSec
    );

    const locationCard: StagecraftLocationCardV1 | null =
      beat.locationCard && typeof beat.locationCard.title === 'string' && beat.locationCard.title.trim()
        ? {
            title: beat.locationCard.title.trim(),
            ...(beat.locationCard.subtitle?.trim()
              ? { subtitle: beat.locationCard.subtitle.trim() }
              : {}),
            ...(beat.locationCard.position ? { position: beat.locationCard.position } : {}),
            ...(beat.locationCard.style ? { style: beat.locationCard.style } : {}),
          }
        : null;

    const actors: StagecraftActorTelemetryV1[] = (beat.actors || []).map((actor) => {
      const member = castById.get(actor.castId);
      return {
        castId: actor.castId,
        slot: actor.slot,
        pose: actor.pose,
        expression: actor.expression,
        offsetX:
          typeof actor.offsetX === 'number' && Number.isFinite(actor.offsetX)
            ? roundNum(actor.offsetX, 4)
            : 0,
        offsetY:
          typeof actor.offsetY === 'number' && Number.isFinite(actor.offsetY)
            ? roundNum(actor.offsetY, 4)
            : 0,
        hasGranularDna: hasGranularCharacterDna(member),
        dnaSilhouetteSignature: computeDnaSilhouetteSignature(member),
      };
    });

    beatTimeline.push({
      beatIndex: i,
      beatId: beat.id,
      startSec,
      endSec,
      durationSec,
      shot: beat.shot,
      stage: beat.stage,
      renderStyle: beat.renderStyle || resolvedStyle.renderStyle,
      transition: beat.transition,
      audioLeadSec,
      hitstopWindows,
      vfxBurstWindows,
      speechWindow,
      locationCard,
      actors,
    });

    cursorFrame = endFrame;
  }

  const audioSummary: StagecraftAudioSummaryV1 = {
    targetLufs: -14,
    targetTruePeakDbtp: -1.5,
    ...(typeof options.integratedLufs === 'number' && Number.isFinite(options.integratedLufs)
      ? { integratedLufs: roundNum(options.integratedLufs, 2) }
      : {}),
    ...(typeof options.truePeakDbtp === 'number' && Number.isFinite(options.truePeakDbtp)
      ? { truePeakDbtp: roundNum(options.truePeakDbtp, 2) }
      : {}),
  };

  // Deep-clone episode deterministically so bundle snapshot cannot be mutated externally
  const episodeSnapshot = JSON.parse(JSON.stringify(episode)) as EpisodeScript;

  return {
    schema: STAGECRAFT_QA_BUNDLE_SCHEMA,
    exportedAt: options.exportedAt || DEFAULT_DETERMINISTIC_EXPORTED_AT,
    studioVersion: options.studioVersion || STAGECRAFT_STUDIO_VERSION,
    aspect,
    fps: 60,
    episode: episodeSnapshot,
    telemetry: {
      totalDurationSec: roundSec(frameIndexToTime(cursorFrame, STUDIO_FPS)),
      effectiveCadenceFps,
      beatTimeline,
      audioSummary,
    },
  };
}

/**
 * Serializes a `StagecraftQaBundleV1` payload into pretty-printed JSON.
 */
export function serializeStagecraftQaBundle(bundle: StagecraftQaBundleV1): string {
  return JSON.stringify(bundle, null, 2);
}
