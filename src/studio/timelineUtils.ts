/**
 * Katha Studio — Timeline Editing Utilities (Upgrade 5)
 * Pure, immutable beat reorder, duplicate, and smart multilingual split helpers.
 */
import {
  ExpressionKeyframe,
  STUDIO_FPS,
  ShotId,
  StoryBeat,
} from './types';

function deepCloneBeat(beat: StoryBeat): StoryBeat {
  return JSON.parse(JSON.stringify(beat)) as StoryBeat;
}

function getKeyframeSec(kf: ExpressionKeyframe, totalDur: number): number {
  if (typeof kf.timeSec === 'number' && Number.isFinite(kf.timeSec)) return Math.max(0, kf.timeSec);
  if (typeof kf.frame === 'number' && Number.isFinite(kf.frame)) return Math.max(0, kf.frame / STUDIO_FPS);
  if (typeof kf.at === 'number' && Number.isFinite(kf.at)) return Math.max(0, kf.at * totalDur);
  return 0;
}

function splitKeyframes<T extends ExpressionKeyframe>(
  items: T[] | undefined,
  totalDur: number,
  durA: number,
  durB: number
): [T[] | undefined, T[] | undefined] {
  if (!Array.isArray(items) || items.length === 0) return [undefined, undefined];
  const partA: T[] = [];
  const partB: T[] = [];
  const splitFrame = Math.round(durA * STUDIO_FPS);

  for (const item of items) {
    const t = getKeyframeSec(item, totalDur);
    if (t < durA) {
      const next = { ...item };
      if (typeof next.timeSec === 'number') next.timeSec = Number(Math.max(0, t).toFixed(2));
      if (typeof next.frame === 'number') next.frame = Math.max(0, Math.round(next.frame));
      if (typeof next.endFrame === 'number') {
        next.endFrame = Math.min(Math.max(0, splitFrame - 1), Math.round(next.endFrame));
      }
      if (typeof next.at === 'number') {
        next.at = Number(Math.max(0, Math.min(1, t / durA)).toFixed(3));
      }
      partA.push(next);
    } else {
      const shiftedT = Math.max(0, t - durA);
      const next = { ...item };
      if (typeof next.timeSec === 'number') next.timeSec = Number(shiftedT.toFixed(2));
      if (typeof next.frame === 'number') {
        next.frame = Math.max(0, Math.round(next.frame - splitFrame));
      }
      if (typeof next.endFrame === 'number') {
        next.endFrame = Math.max(
          next.frame ?? 0,
          Math.round(next.endFrame - splitFrame)
        );
      }
      if (typeof next.at === 'number') {
        next.at = Number(Math.max(0, Math.min(1, shiftedT / durB)).toFixed(3));
      }
      partB.push(next);
    }
  }
  return [partA.length > 0 ? partA : undefined, partB.length > 0 ? partB : undefined];
}

/**
 * Reorders a beat from `fromIdx` to `toIdx` without mutating the source array.
 */
export function reorderBeats(
  beats: StoryBeat[],
  fromIdx: number,
  toIdx: number
): StoryBeat[] {
  if (!Array.isArray(beats) || beats.length <= 1) return [...(beats || [])];
  if (
    !Number.isInteger(fromIdx) ||
    !Number.isInteger(toIdx) ||
    fromIdx < 0 ||
    toIdx < 0 ||
    fromIdx >= beats.length ||
    toIdx >= beats.length ||
    fromIdx === toIdx
  ) {
    return [...beats];
  }
  const next = [...beats];
  const [moved] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, moved);
  return next;
}

/**
 * Duplicates the beat at `idx`, inserting a deep copy immediately after it with a unique ID.
 */
export function duplicateBeat(
  beats: StoryBeat[],
  idx: number
): { beats: StoryBeat[]; newIdx: number } {
  if (!Array.isArray(beats) || beats.length === 0 || idx < 0 || idx >= beats.length) {
    return { beats: [...(beats || [])], newIdx: Math.max(0, idx) };
  }
  const copy = deepCloneBeat(beats[idx]);
  copy.id = `beat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  copy.title = copy.title.endsWith('(Copy)') ? copy.title : `${copy.title} (Copy)`;
  const next = [...beats];
  next.splice(idx + 1, 0, copy);
  return { beats: next, newIdx: idx + 1 };
}

/**
 * Splits dialogue text cleanly near the midpoint across Latin, Indic, Arabic/Urdu RTL, and CJK scripts.
 */
export function splitDialogueCleanly(dialogue: string): [string, string] {
  const trimmed = dialogue.trim();
  if (!trimmed) return ['', ''];

  // 1. Prefer a natural sentence boundary near the middle (supports Latin, Devanagari ।, Urdu ۔, and space-free CJK 。！？)
  const sentenceBreaks = [...trimmed.matchAll(/(?:[。！？]+|[.!?।۔]+(?:\s+|$))/g)];
  if (sentenceBreaks.length >= 2) {
    const mid = trimmed.length / 2;
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < sentenceBreaks.length - 1; i++) {
      const m = sentenceBreaks[i];
      const endPos = (m.index ?? 0) + m[0].length;
      if (endPos <= 0 || endPos >= trimmed.length) continue;
      const dist = Math.abs(endPos - mid);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = endPos;
      }
    }
    if (bestIdx > 0 && bestIdx < trimmed.length) {
      return [trimmed.slice(0, bestIdx).trim(), trimmed.slice(bestIdx).trim()];
    }
  }

  // 2. Otherwise split on word boundaries for space-separated scripts
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const midWord = Math.ceil(words.length / 2);
    return [words.slice(0, midWord).join(' '), words.slice(midWord).join(' ')];
  }

  // 3. Space-free scripts (Japanese / Chinese) or single long token: split by codepoints at midpoint
  const chars = Array.from(trimmed);
  if (chars.length >= 2) {
    const midChar = Math.ceil(chars.length / 2);
    return [chars.slice(0, midChar).join(''), chars.slice(midChar).join('')];
  }

  return [trimmed, trimmed];
}

function alternateShotForCut(shot: ShotId): ShotId {
  if (shot === 'wide_stage') return 'two_shot';
  if (shot === 'two_shot') return 'closeup_left';
  if (shot === 'closeup_left') return 'closeup_right';
  if (shot === 'closeup_right') return 'wide_stage';
  return shot;
}

/**
 * Splits a beat at its natural dialogue/timing midpoint into two seamlessly paced scenes,
 * remapping mid-beat expression cues and per-actor expression tracks across the cut.
 */
export function splitBeatAtMidpoint(
  beats: StoryBeat[],
  idx: number
): { beats: StoryBeat[]; newIdx: number } {
  if (!Array.isArray(beats) || beats.length === 0 || idx < 0 || idx >= beats.length) {
    return { beats: [...(beats || [])], newIdx: Math.max(0, idx) };
  }
  const orig = beats[idx];
  const [partA, partB] = splitDialogueCleanly(orig.dialogue);

  const totalDur = Math.max(2.8, Number.isFinite(orig.duration) ? orig.duration : 4.0);
  const ratioA =
    partA.length + partB.length > 0
      ? Math.max(0.32, Math.min(0.68, partA.length / (partA.length + partB.length)))
      : 0.5;
  const durA = Math.max(1.4, Number((totalDur * ratioA).toFixed(1)));
  const durB = Math.max(1.4, Number((totalDur - durA).toFixed(1)));

  const first = deepCloneBeat(orig);
  first.duration = durA;
  first.dialogue = partA;

  const second = deepCloneBeat(orig);
  second.id = `beat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  second.title = `${orig.title} (Part 2)`;
  second.duration = durB;
  second.dialogue = partB;
  second.shot = alternateShotForCut(orig.shot);
  second.transition = 'hard_cut';

  // Split & re-base beat-level expression cues cleanly across the cut
  const [cuesA, cuesB] = splitKeyframes(orig.expressionCues, totalDur, durA, durB);
  first.expressionCues = cuesA;
  second.expressionCues = cuesB;

  // Split & re-base per-actor expressionTrack keyframes cleanly across the cut
  first.actors = first.actors.map((actor, aIdx) => {
    const [trackA] = splitKeyframes(orig.actors[aIdx]?.expressionTrack, totalDur, durA, durB);
    return trackA ? { ...actor, expressionTrack: trackA } : { ...actor, expressionTrack: undefined };
  });
  second.actors = second.actors.map((actor, aIdx) => {
    const [, trackB] = splitKeyframes(orig.actors[aIdx]?.expressionTrack, totalDur, durA, durB);
    return trackB ? { ...actor, expressionTrack: trackB } : { ...actor, expressionTrack: undefined };
  });

  // Clamp sfxOffsetSec cleanly on both halves
  if (typeof orig.sfxOffsetSec === 'number') {
    if (orig.sfxOffsetSec < durA) {
      first.sfxOffsetSec = Number(orig.sfxOffsetSec.toFixed(2));
      second.sfxOffsetSec = 0;
    } else {
      first.sfxOffsetSec = 0;
      second.sfxOffsetSec = Number(Math.max(0, orig.sfxOffsetSec - durA).toFixed(2));
    }
  }

  const next = [...beats];
  next.splice(idx, 1, first, second);
  return { beats: next, newIdx: idx + 1 };
}

/**
 * Deterministically applies subtle film-style J-Cuts (+0.25s..+0.35s audio lead)
 * across consecutive spoken dialogue scenes so dialogue pulls smoothly across visual cuts
 * instead of stopping abruptly like a slide deck. Preserves title/moral/end cards.
 */
export function applyCinematicJCuts(
  beats: StoryBeat[],
  leadSec = 0.3
): { beats: StoryBeat[]; updatedCount: number } {
  if (!Array.isArray(beats) || beats.length <= 1) {
    return { beats: [...(beats || [])], updatedCount: 0 };
  }
  const safeLead = Number(Math.max(0.1, Math.min(0.5, leadSec)).toFixed(2));
  let updatedCount = 0;

  const next = beats.map((beat, idx) => {
    if (idx === 0) {
      if (beat.audioLeadSec && beat.audioLeadSec > 0) {
        return { ...beat, audioLeadSec: undefined };
      }
      return beat;
    }
    const prev = beats[idx - 1];
    const isCard = (b: StoryBeat) =>
      b.frame === 'chapter_title' || b.frame === 'moral_card' || b.frame === 'end_screen';
    if (isCard(beat) || isCard(prev)) return beat;
    if ((beat.dialogue || '').trim().length < 8) return beat;
    if (Math.max(1.2, prev.duration) < 2.2) return beat;

    // Slight natural rhythm: slightly tighter J-cut on rapid exchanges, fuller on scene changes
    const sameStage = prev.stage === beat.stage;
    const targetLead = sameStage
      ? Number(Math.min(safeLead, 0.25).toFixed(2))
      : Number(Math.min(0.42, safeLead + 0.05).toFixed(2));
    if (beat.audioLeadSec === targetLead) return beat;
    updatedCount++;
    return {
      ...beat,
      audioLeadSec: targetLead,
    };
  });

  return { beats: next, updatedCount };
}

