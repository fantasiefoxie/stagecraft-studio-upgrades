/**
 * Stagecraft Studio — Director's Continuity & Pacing Auditor + 1-Click Auto-Fixer
 *
 * Pure deterministic analyzer inspecting:
 * 1. 180-degree eye-line / facing flips between consecutive beats on the same stage
 * 2. Flat pacing stretches (3+ consecutive identical shots OR >16s with zero camera/cue energy)
 * 3. Reading-speed mismatches across Latin, Devanagari/Indic, and CJK scripts vs beat.duration
 * 4. Missing speaker placement (speakerId not present on stage when not 'narrator')
 */

import type { EpisodeScript, ShotId, StoryBeat } from './types';

export type ContinuityIssueKind =
  | 'eyeline_flip'
  | 'identical_shot_streak'
  | 'flat_pacing_stretch'
  | 'reading_speed_fast'
  | 'reading_speed_slow'
  | 'missing_speaker_on_stage';

export type ContinuitySeverity = 'error' | 'warning' | 'info';

export interface ContinuityIssue {
  id: string;
  kind: ContinuityIssueKind;
  severity: ContinuitySeverity;
  beatIdx: number;
  beatId: string;
  beatTitle: string;
  message: string;
  suggestion: string;
  autoFixable: boolean;
  meta?: {
    castId?: string;
    measuredRate?: number;
    rateUnit?: 'wpm' | 'cps';
    recommendedDurationSec?: number;
    streakLength?: number;
    stretchDurationSec?: number;
  };
}

export interface ContinuityAuditReport {
  score: number; // 0..100
  passed: boolean;
  issues: ContinuityIssue[];
  counts: {
    errors: number;
    warnings: number;
    info: number;
    autoFixable: number;
  };
  summary: string;
}

export interface ContinuityAutoFixResult {
  episode: EpisodeScript;
  fixedCount: number;
  fixesApplied: string[];
}

export type ScriptFamily = 'cjk' | 'indic' | 'latin';

/**
 * Classifies dialogue script family and computes script-appropriate reading speed.
 */
export function measureDialogueReadingRate(
  dialogue: string,
  durationSec: number
): {
  family: ScriptFamily;
  unitCount: number;
  rate: number;
  unit: 'wpm' | 'cps';
  tooFast: boolean;
  tooSlow: boolean;
  recommendedDurationSec: number;
} {
  const clean = dialogue.trim();
  const safeDur = Math.max(0.5, Number.isFinite(durationSec) ? durationSec : 4);
  if (!clean) {
    return {
      family: 'latin',
      unitCount: 0,
      rate: 0,
      unit: 'wpm',
      tooFast: false,
      tooSlow: false,
      recommendedDurationSec: safeDur,
    };
  }

  const cjkMatches = clean.match(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/g) || [];
  const indicMatches = clean.match(/[\u0900-\u0d7f]/g) || [];
  const nonSpaceChars = clean.replace(/\s+/g, '').length || 1;

  // CJK (Japanese / Chinese / Korean): characters per second
  if (cjkMatches.length / nonSpaceChars >= 0.35) {
    const chars = cjkMatches.length;
    const cps = chars / safeDur;
    const targetCps = 4.0;
    const recommendedDurationSec = Number(
      Math.max(2.2, Math.min(14.0, chars / targetCps + 0.6)).toFixed(1)
    );
    return {
      family: 'cjk',
      unitCount: chars,
      rate: Number(cps.toFixed(2)),
      unit: 'cps',
      tooFast: chars >= 10 && cps > 6.2,
      tooSlow: chars >= 4 && safeDur >= 5.5 && cps < 1.35,
      recommendedDurationSec,
    };
  }

  const words = clean.split(/\s+/).filter(Boolean).length;

  // Devanagari / Indic scripts: words per minute (slightly slower spoken syllables per word)
  if (indicMatches.length / nonSpaceChars >= 0.35) {
    const wpm = (words / safeDur) * 60;
    const targetWpm = 132;
    const recommendedDurationSec = Number(
      Math.max(2.2, Math.min(14.0, (words / targetWpm) * 60 + 0.55)).toFixed(1)
    );
    return {
      family: 'indic',
      unitCount: words,
      rate: Math.round(wpm),
      unit: 'wpm',
      tooFast: words >= 5 && wpm > 185,
      tooSlow: words >= 2 && safeDur >= 6.0 && wpm < 52,
      recommendedDurationSec,
    };
  }

  // Latin / Arabic / Cyrillic / default: words per minute
  const wpm = (words / safeDur) * 60;
  const targetWpm = 148;
  const recommendedDurationSec = Number(
    Math.max(2.2, Math.min(14.0, (words / targetWpm) * 60 + 0.5)).toFixed(1)
  );
  return {
    family: 'latin',
    unitCount: words,
    rate: Math.round(wpm),
    unit: 'wpm',
    tooFast: words >= 5 && wpm > 205,
    tooSlow: words >= 2 && safeDur >= 6.2 && wpm < 55,
    recommendedDurationSec,
  };
}

function effectiveFacing(slot: string, explicit?: 'left' | 'right'): 'left' | 'right' {
  if (explicit === 'left' || explicit === 'right') return explicit;
  return slot === 'right' ? 'left' : 'right';
}

function beatHasKineticEnergy(beat: StoryBeat): boolean {
  if (beat.cameraMove && beat.cameraMove !== 'still') return true;
  if (beat.cameraKeyframes && beat.cameraKeyframes.length > 0) return true;
  if (beat.actionCues && beat.actionCues.length > 0) return true;
  if (beat.sfx && beat.sfx !== 'none') return true;
  if (beat.fx && beat.fx !== 'none') return true;
  return false;
}

/**
 * Pure deterministic Director's Continuity & Pacing Audit.
 */
export function auditEpisodeContinuity(episode: EpisodeScript): ContinuityAuditReport {
  const issues: ContinuityIssue[] = [];
  const beats = episode.beats || [];

  // 1. Missing speaker placement + Reading-speed audit (per beat)
  for (let i = 0; i < beats.length; i++) {
    const beat = beats[i];
    const title = beat.title || `Beat ${i + 1}`;

    if (
      beat.speakerId &&
      beat.speakerId !== 'narrator' &&
      beat.shot !== 'motion_card' &&
      beat.shot !== 'prop_spotlight' &&
      !beat.actors.some((a) => a.castId === beat.speakerId)
    ) {
      issues.push({
        id: `missing_speaker_${i}`,
        kind: 'missing_speaker_on_stage',
        severity: 'error',
        beatIdx: i,
        beatId: beat.id,
        beatTitle: title,
        message: `Speaker "${beat.speakerLabel || beat.speakerId}" is not placed on stage in Beat ${i + 1}.`,
        suggestion: 'Place the active speaker in an open stage slot or switch speaker to Narrator.',
        autoFixable: true,
        meta: { castId: beat.speakerId },
      });
    }

    const rateInfo = measureDialogueReadingRate(beat.dialogue || '', beat.duration);
    if (rateInfo.tooFast) {
      issues.push({
        id: `reading_fast_${i}`,
        kind: 'reading_speed_fast',
        severity: 'warning',
        beatIdx: i,
        beatId: beat.id,
        beatTitle: title,
        message: `Dialogue in Beat ${i + 1} reads too fast (${rateInfo.rate} ${rateInfo.unit.toUpperCase()} for ${beat.duration.toFixed(1)}s).`,
        suggestion: `Extend beat duration to ~${rateInfo.recommendedDurationSec}s so voiceover and captions breathe comfortably.`,
        autoFixable: true,
        meta: {
          measuredRate: rateInfo.rate,
          rateUnit: rateInfo.unit,
          recommendedDurationSec: rateInfo.recommendedDurationSec,
        },
      });
    } else if (rateInfo.tooSlow) {
      issues.push({
        id: `reading_slow_${i}`,
        kind: 'reading_speed_slow',
        severity: 'info',
        beatIdx: i,
        beatId: beat.id,
        beatTitle: title,
        message: `Beat ${i + 1} lingers slowly (${rateInfo.rate} ${rateInfo.unit.toUpperCase()} over ${beat.duration.toFixed(1)}s).`,
        suggestion: `Tighten beat duration toward ~${rateInfo.recommendedDurationSec}s to maintain retention.`,
        autoFixable: true,
        meta: {
          measuredRate: rateInfo.rate,
          rateUnit: rateInfo.unit,
          recommendedDurationSec: rateInfo.recommendedDurationSec,
        },
      });
    }
  }

  // 2. 180-degree eye-line / facing flips between consecutive beats on the same stage
  for (let i = 1; i < beats.length; i++) {
    const prev = beats[i - 1];
    const curr = beats[i];
    if (prev.stage !== curr.stage) continue;
    if (Boolean(prev.flipStage) !== Boolean(curr.flipStage)) continue;
    if (
      prev.shot === 'motion_card' ||
      curr.shot === 'motion_card' ||
      prev.shot === 'prop_spotlight' ||
      curr.shot === 'prop_spotlight'
    ) {
      continue;
    }

    for (const currActor of curr.actors) {
      const prevActor = prev.actors.find((a) => a.castId === currActor.castId);
      if (!prevActor) continue;
      if (prevActor.motion === 'cross_stage' || currActor.motion === 'cross_stage') continue;

      const sideFlipped =
        (prevActor.slot === 'left' && currActor.slot === 'right') ||
        (prevActor.slot === 'right' && currActor.slot === 'left');
      const prevFace = effectiveFacing(prevActor.slot, prevActor.facing);
      const currFace = effectiveFacing(currActor.slot, currActor.facing);
      const sameSlotFacingFlipped = prevActor.slot === currActor.slot && prevFace !== currFace;

      if (sideFlipped || sameSlotFacingFlipped) {
        const castName =
          episode.cast.find((c) => c.id === currActor.castId)?.name || currActor.castId;
        issues.push({
          id: `eyeline_flip_${i}_${currActor.castId}`,
          kind: 'eyeline_flip',
          severity: 'warning',
          beatIdx: i,
          beatId: curr.id,
          beatTitle: curr.title || `Beat ${i + 1}`,
          message: sideFlipped
            ? `180° axis break on Beat ${i + 1}: "${castName}" jumped from ${prevActor.slot} to ${currActor.slot} on the same stage (${curr.stage}).`
            : `Eye-line flip on Beat ${i + 1}: "${castName}" flipped facing (${prevFace} -> ${currFace}) without changing stage.`,
          suggestion: `Preserve "${castName}" on the ${prevActor.slot} side facing ${prevFace} to maintain screen direction.`,
          autoFixable: true,
          meta: { castId: currActor.castId },
        });
      }
    }
  }

  // 3. Flat pacing: 3+ consecutive identical shots
  let shotStreakStart = 0;
  for (let i = 1; i <= beats.length; i++) {
    const sameAsPrev =
      i < beats.length &&
      beats[i].shot === beats[shotStreakStart].shot &&
      beats[i].shot !== 'motion_card';
    if (!sameAsPrev) {
      const len = i - shotStreakStart;
      if (len >= 3) {
        const midIdx = shotStreakStart + Math.floor(len / 2);
        const midBeat = beats[midIdx];
        issues.push({
          id: `shot_streak_${shotStreakStart}_${len}`,
          kind: 'identical_shot_streak',
          severity: 'warning',
          beatIdx: midIdx,
          beatId: midBeat.id,
          beatTitle: midBeat.title || `Beat ${midIdx + 1}`,
          message: `${len} consecutive "${midBeat.shot}" shots (Beats ${shotStreakStart + 1}–${i}) create visual monotony.`,
          suggestion: 'Cut to a close-up or two-shot in the middle of the streak to refresh visual rhythm.',
          autoFixable: true,
          meta: { streakLength: len },
        });
      }
      shotStreakStart = i;
    }
  }

  // 4. Flat pacing: >16s continuous stretch with zero camera moves, action cues, or SFX/FX energy
  let flatStart = 0;
  let flatDur = 0;
  for (let i = 0; i <= beats.length; i++) {
    const isFlat = i < beats.length && !beatHasKineticEnergy(beats[i]);
    if (isFlat) {
      if (flatDur === 0) flatStart = i;
      flatDur += Math.max(1.0, beats[i].duration || 4);
    } else {
      if (flatDur > 16) {
        const targetIdx = flatStart + Math.floor((i - flatStart) / 2);
        const b = beats[targetIdx];
        issues.push({
          id: `flat_stretch_${flatStart}_${i}`,
          kind: 'flat_pacing_stretch',
          severity: 'warning',
          beatIdx: targetIdx,
          beatId: b.id,
          beatTitle: b.title || `Beat ${targetIdx + 1}`,
          message: `${flatDur.toFixed(1)}s flat pacing stretch (Beats ${flatStart + 1}–${i}) with no camera movement, cues, or SFX.`,
          suggestion: 'Add subtle camera drift (slow push-in or gentle pan) to keep visual momentum alive.',
          autoFixable: true,
          meta: { stretchDurationSec: Number(flatDur.toFixed(1)) },
        });
      }
      flatDur = 0;
    }
  }

  const errors = issues.filter((x) => x.severity === 'error').length;
  const warnings = issues.filter((x) => x.severity === 'warning').length;
  const info = issues.filter((x) => x.severity === 'info').length;
  const autoFixable = issues.filter((x) => x.autoFixable).length;

  const penalty = errors * 16 + warnings * 8 + info * 3;
  const score = Math.max(0, Math.min(100, 100 - penalty));
  const passed = errors === 0 && score >= 75;

  const summary =
    issues.length === 0
      ? 'Continuity & pacing look broadcast-ready: consistent 180° axis, balanced shot variety, and natural reading pace.'
      : `Found ${issues.length} continuity/pacing note${issues.length === 1 ? '' : 's'} (${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}) — ${autoFixable} auto-fixable in 1 click.`;

  return {
    score,
    passed,
    issues,
    counts: { errors, warnings, info, autoFixable },
    summary,
  };
}

/**
 * Deterministic 1-click auto-fixer for continuity & pacing issues.
 */
export function autoFixEpisodeContinuity(episode: EpisodeScript): ContinuityAutoFixResult {
  const nextBeats: StoryBeat[] = episode.beats.map((b) => ({
    ...b,
    actors: b.actors.map((a) => ({ ...a })),
  }));
  const fixesApplied: string[] = [];

  // Pass 1: Fix missing speaker on stage
  for (let i = 0; i < nextBeats.length; i++) {
    const beat = nextBeats[i];
    if (
      beat.speakerId &&
      beat.speakerId !== 'narrator' &&
      beat.shot !== 'motion_card' &&
      beat.shot !== 'prop_spotlight' &&
      !beat.actors.some((a) => a.castId === beat.speakerId)
    ) {
      const castExists = episode.cast.some((c) => c.id === beat.speakerId);
      if (castExists) {
        const usedSlots = new Set(beat.actors.map((a) => a.slot));
        const openSlot: 'left' | 'center' | 'right' = !usedSlots.has('left')
          ? 'left'
          : !usedSlots.has('right')
            ? 'right'
            : 'center';
        beat.actors.push({
          castId: beat.speakerId,
          slot: openSlot,
          pose: 'stand',
          expression: 'calm',
          facing: openSlot === 'right' ? 'left' : 'right',
          motion: 'still',
        });
        fixesApplied.push(`Beat ${i + 1}: placed missing speaker "${beat.speakerLabel || beat.speakerId}" in ${openSlot} slot.`);
      } else {
        beat.speakerId = 'narrator';
        beat.speakerLabel = 'Narrator';
        fixesApplied.push(`Beat ${i + 1}: switched unknown speaker to Narrator.`);
      }
    }
  }

  // Pass 2: Preserve 180° screen direction across same-stage cuts
  for (let i = 1; i < nextBeats.length; i++) {
    const prev = nextBeats[i - 1];
    const curr = nextBeats[i];
    if (prev.stage !== curr.stage) continue;
    if (Boolean(prev.flipStage) !== Boolean(curr.flipStage)) continue;
    if (
      prev.shot === 'motion_card' ||
      curr.shot === 'motion_card' ||
      prev.shot === 'prop_spotlight' ||
      curr.shot === 'prop_spotlight'
    ) {
      continue;
    }

    for (const currActor of curr.actors) {
      const prevActor = prev.actors.find((a) => a.castId === currActor.castId);
      if (!prevActor) continue;
      if (prevActor.motion === 'cross_stage' || currActor.motion === 'cross_stage') continue;

      const sideFlipped =
        (prevActor.slot === 'left' && currActor.slot === 'right') ||
        (prevActor.slot === 'right' && currActor.slot === 'left');
      const prevFace = effectiveFacing(prevActor.slot, prevActor.facing);
      const currFace = effectiveFacing(currActor.slot, currActor.facing);

      if (sideFlipped) {
        // Swap with occupant if another actor took prevActor.slot
        const occupant = curr.actors.find(
          (a) => a.castId !== currActor.castId && a.slot === prevActor.slot
        );
        if (occupant) {
          occupant.slot = currActor.slot;
          occupant.facing = occupant.slot === 'right' ? 'left' : 'right';
        }
        currActor.slot = prevActor.slot;
        currActor.facing = prevFace;
        fixesApplied.push(`Beat ${i + 1}: restored 180° axis (${currActor.castId} -> ${prevActor.slot}).`);
      } else if (prevActor.slot === currActor.slot && prevFace !== currFace) {
        currActor.facing = prevFace;
        fixesApplied.push(`Beat ${i + 1}: aligned eye-line facing (${currActor.castId} -> ${prevFace}).`);
      }
    }
  }

  // Pass 3: Break 3+ consecutive identical shots
  let streakStart = 0;
  for (let i = 1; i <= nextBeats.length; i++) {
    const same =
      i < nextBeats.length &&
      nextBeats[i].shot === nextBeats[streakStart].shot &&
      nextBeats[i].shot !== 'motion_card';
    if (!same) {
      const len = i - streakStart;
      if (len >= 3) {
        for (let k = streakStart + 1; k < i; k += 2) {
          const b = nextBeats[k];
          const speaker = b.actors.find((a) => a.castId === b.speakerId);
          let altShot: ShotId = 'two_shot';
          if (b.shot === 'wide_stage') {
            altShot =
              speaker?.slot === 'right'
                ? 'closeup_right'
                : speaker?.slot === 'left'
                  ? 'closeup_left'
                  : 'two_shot';
          } else if (b.shot === 'two_shot') {
            altShot = speaker?.slot === 'right' ? 'closeup_right' : 'closeup_left';
          } else if (b.shot === 'closeup_left') {
            altShot = b.actors.length >= 2 ? 'two_shot' : 'wide_stage';
          } else if (b.shot === 'closeup_right') {
            altShot = b.actors.length >= 2 ? 'two_shot' : 'wide_stage';
          } else {
            altShot = 'wide_stage';
          }
          if (altShot !== b.shot) {
            b.shot = altShot;
            fixesApplied.push(`Beat ${k + 1}: varied repeated shot -> ${altShot}.`);
          }
        }
      }
      streakStart = i;
    }
  }

  // Pass 4: Break >16s flat pacing stretches with gentle camera moves
  let flatStart = 0;
  let flatDur = 0;
  const subtleMoves = ['slow_push', 'pan_right', 'slow_pull', 'pan_left'] as const;
  for (let i = 0; i <= nextBeats.length; i++) {
    const isFlat = i < nextBeats.length && !beatHasKineticEnergy(nextBeats[i]);
    if (isFlat) {
      if (flatDur === 0) flatStart = i;
      flatDur += Math.max(1.0, nextBeats[i].duration || 4);
    } else {
      if (flatDur > 16) {
        for (let k = flatStart; k < i; k += 2) {
          const move = subtleMoves[k % subtleMoves.length];
          nextBeats[k].cameraMove = move;
          fixesApplied.push(`Beat ${k + 1}: added ${move} camera motion to break flat stretch.`);
        }
      }
      flatDur = 0;
    }
  }

  // Pass 5: Smooth reading-speed mismatches
  for (let i = 0; i < nextBeats.length; i++) {
    const b = nextBeats[i];
    const rateInfo = measureDialogueReadingRate(b.dialogue || '', b.duration);
    if (rateInfo.tooFast || rateInfo.tooSlow) {
      const prevDur = b.duration;
      b.duration = rateInfo.recommendedDurationSec;
      fixesApplied.push(
        `Beat ${i + 1}: adjusted duration ${prevDur.toFixed(1)}s -> ${b.duration.toFixed(1)}s for comfortable reading pace.`
      );
    }
  }

  return {
    episode: {
      ...episode,
      beats: nextBeats,
    },
    fixedCount: fixesApplied.length,
    fixesApplied,
  };
}
