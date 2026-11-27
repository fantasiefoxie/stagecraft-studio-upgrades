import { CameraMoveId, EpisodeScript, SfxId, ShotId, StoryBeat } from './types';

export interface BeatPacingScore {
  beatIndex: number;
  beatId: string;
  startSec: number;
  durationSec: number;
  score: number; // 0..100 engagement score
  isFlat: boolean;
  reasons: string[];
}

export interface DropOffZone {
  startBeatIndex: number;
  endBeatIndex: number;
  startSec: number;
  endSec: number;
  durationSec: number;
  avgScore: number;
}

export interface EpisodePacingReport {
  overallScore: number; // 0..100
  beatScores: BeatPacingScore[];
  dropOffZones: DropOffZone[];
  flatBeatIndices: number[];
  shotVarietyRatio: number;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Pure deterministic beat-by-beat retention & pacing engagement analyzer (0..100).
 * Evaluates shot variety, duration rhythm, camera/cue kinetics, FX/SFX punctuation, and emotional arc.
 * Flags flat "drop-off zones" (>12s continuous low-energy stretches).
 */
export function analyzeEpisodePacing(episode: EpisodeScript): EpisodePacingReport {
  const beats = episode.beats || [];
  if (beats.length === 0) {
    return {
      overallScore: 0,
      beatScores: [],
      dropOffZones: [],
      flatBeatIndices: [],
      shotVarietyRatio: 0,
    };
  }

  const beatScores: BeatPacingScore[] = [];
  const uniqueShots = new Set<ShotId>();
  let cursorSec = 0;

  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    const prev = i > 0 ? beats[i - 1] : null;
    const dur = Math.max(1.2, Number.isFinite(b.duration) ? b.duration : 4);
    uniqueShots.add(b.shot);

    let score = 46;
    const reasons: string[] = [];

    // 1. Shot variety vs previous beat
    if (!prev || prev.shot !== b.shot) {
      score += 14;
    } else {
      score -= 10;
      reasons.push('Repeated camera shot');
    }

    // 2. Duration rhythm (sweet spot 2.8s..7.2s)
    if (dur >= 2.6 && dur <= 7.2) {
      score += 12;
    } else if (dur > 9.5) {
      score -= 16;
      reasons.push(`Long static hold (${dur.toFixed(1)}s)`);
    } else if (dur > 7.2) {
      score -= 6;
    } else {
      score += 6;
    }

    // 3. Camera & actor kinetics
    const hasCamMove = Boolean(b.cameraMove && b.cameraMove !== 'still');
    const hasKeyframes = Boolean(b.cameraKeyframes && b.cameraKeyframes.length > 0);
    const hasActorMotion = (b.actors || []).some(
      (a) => (a.motion && a.motion !== 'still') || a.pose === 'attack' || a.pose === 'gesture' || a.pose === 'recoil'
    );
    const hasActionCues = Boolean(b.actionCues && b.actionCues.length > 0);

    if (hasCamMove || hasKeyframes) score += 12;
    else reasons.push('Static camera');

    if (hasActorMotion || hasActionCues) score += 10;
    else reasons.push('Low actor movement');

    // 4. FX / SFX / Transition punctuation
    const hasFx = b.fx !== 'none';
    const hasSfx = Boolean(b.sfx && b.sfx !== 'none');
    const hasTransition = b.transition !== 'hard_cut';
    if (hasFx) score += 7;
    if (hasSfx) score += 7;
    if (hasTransition) score += 3;

    // 5. Emotional & musical energy shift
    const hasExprShift =
      Boolean(b.expressionCues && b.expressionCues.length > 0) ||
      (b.actors || []).some((a) => a.expression !== 'calm' || (a.expressionTrack && a.expressionTrack.length > 0));
    if (hasExprShift) score += 7;
    if ((b.musicEnergy ?? 0.65) >= 0.72) score += 5;
    else if ((b.musicEnergy ?? 0.65) < 0.4) score -= 5;

    // Slates are intentionally calmer
    const isSlate = b.frame === 'chapter_title' || b.frame === 'moral_card' || b.frame === 'end_screen';
    if (isSlate) {
      score = Math.max(score, 68);
    }

    const clamped = Math.round(clamp(score, 10, 100));
    const isFlat = !isSlate && clamped < 60;

    beatScores.push({
      beatIndex: i,
      beatId: b.id,
      startSec: Number(cursorSec.toFixed(2)),
      durationSec: Number(dur.toFixed(2)),
      score: clamped,
      isFlat,
      reasons: isFlat ? reasons.slice(0, 3) : [],
    });
    cursorSec += dur;
  }

  // Detect contiguous low-energy drop-off zones (> 12s continuous flat beats, or single flat beat > 12s)
  const dropOffZones: DropOffZone[] = [];
  let zoneStart = -1;
  let zoneDur = 0;
  let zoneScoreSum = 0;
  let zoneCount = 0;

  const flushZone = (endIdx: number) => {
    if (zoneStart >= 0 && zoneDur >= 12) {
      const startBeat = beatScores[zoneStart];
      const endBeat = beatScores[endIdx];
      dropOffZones.push({
        startBeatIndex: zoneStart,
        endBeatIndex: endIdx,
        startSec: startBeat.startSec,
        endSec: Number((endBeat.startSec + endBeat.durationSec).toFixed(2)),
        durationSec: Number(zoneDur.toFixed(2)),
        avgScore: Math.round(zoneScoreSum / Math.max(1, zoneCount)),
      });
    }
    zoneStart = -1;
    zoneDur = 0;
    zoneScoreSum = 0;
    zoneCount = 0;
  };

  for (let i = 0; i < beatScores.length; i++) {
    const bs = beatScores[i];
    if (bs.isFlat) {
      if (zoneStart === -1) zoneStart = i;
      zoneDur += bs.durationSec;
      zoneScoreSum += bs.score;
      zoneCount += 1;
    } else {
      flushZone(i - 1);
    }
  }
  flushZone(beatScores.length - 1);

  const overallScore = Math.round(
    beatScores.reduce((acc, b) => acc + b.score, 0) / beatScores.length
  );
  const flatBeatIndices = beatScores.filter((b) => b.isFlat).map((b) => b.beatIndex);
  const shotVarietyRatio = Number((uniqueShots.size / Math.min(beats.length, 5)).toFixed(2));

  return {
    overallScore,
    beatScores,
    dropOffZones,
    flatBeatIndices,
    shotVarietyRatio,
  };
}

/**
 * Pure auto-director helper: upgrades flat / drop-off beats with subtle camera moves,
 * reaction shot variety, actor gesture cues, or tasteful SFX accents — strictly preserving
 * every beat's `duration`, `dialogue`, `id`, and voice binding.
 */
export function boostFlatBeats(episode: EpisodeScript): {
  episode: EpisodeScript;
  boostedIndices: number[];
  beforeScore: number;
  afterScore: number;
} {
  const beforeReport = analyzeEpisodePacing(episode);
  const flatSet = new Set<number>(beforeReport.flatBeatIndices);
  for (const z of beforeReport.dropOffZones) {
    for (let i = z.startBeatIndex; i <= z.endBeatIndex; i++) {
      flatSet.add(i);
    }
  }

  if (flatSet.size === 0) {
    return {
      episode,
      boostedIndices: [],
      beforeScore: beforeReport.overallScore,
      afterScore: beforeReport.overallScore,
    };
  }

  const camCycle: CameraMoveId[] = ['slow_push', 'pan_right', 'slow_pull', 'pan_left'];
  const sfxByMood = (beat: StoryBeat): SfxId => {
    if (beat.mood === 'crimson_wrath' || beat.mood === 'midnight_banyan') return 'thunder_crack';
    if (beat.mood === 'twilight_temple' || beat.mood === 'mystic_teal') return 'mystic_chime';
    if (beat.mood === 'golden_durbar') return 'court_gasp';
    return 'temple_bell';
  };

  const boostedIndices: number[] = [];
  const nextBeats = episode.beats.map((beat, idx) => {
    if (!flatSet.has(idx)) return beat;
    const prev = idx > 0 ? episode.beats[idx - 1] : null;
    const next: StoryBeat = { ...beat };

    // 1. Add deterministic camera motion if static
    if (!next.cameraMove || next.cameraMove === 'still') {
      next.cameraMove = camCycle[idx % camCycle.length];
    }

    // 2. Break consecutive identical wide shots with a tasteful reaction cut
    if (prev && prev.shot === next.shot && next.shot === 'wide_stage' && next.actors.length > 0) {
      const speakerIdx = next.actors.findIndex((a) => a.castId === next.speakerId);
      next.shot =
        speakerIdx === 1
          ? 'closeup_right'
          : speakerIdx === 0
            ? 'closeup_left'
            : idx % 2 === 0
              ? 'two_shot'
              : 'closeup_left';
    }

    // 3. Inject subtle expressive actor beat if everyone is standing still with calm face
    const allStatic = next.actors.every(
      (a) => (!a.motion || a.motion === 'still') && a.pose === 'stand'
    );
    if (allStatic && next.actors.length > 0) {
      next.actors = next.actors.map((a, aIdx) => {
        const isSpeaker = a.castId === next.speakerId || aIdx === 0;
        if (!isSpeaker) return a;
        return {
          ...a,
          pose: 'gesture',
          expression: a.expression === 'calm' ? 'curious' : a.expression,
        };
      });
    }

    // 4. Add tasteful SFX accent on every second flat beat if silent
    if ((!next.sfx || next.sfx === 'none') && idx % 2 === 0) {
      next.sfx = sfxByMood(next);
      next.sfxOffsetSec = Number(Math.min(Math.max(0.2, next.duration * 0.2), next.duration - 0.3).toFixed(2));
    }

    // 5. Lift sluggish music energy gently
    if ((next.musicEnergy ?? 0.5) < 0.62) {
      next.musicEnergy = 0.68;
    }

    boostedIndices.push(idx);
    return next;
  });

  const updatedEpisode: EpisodeScript = {
    ...episode,
    beats: nextBeats,
  };
  const afterReport = analyzeEpisodePacing(updatedEpisode);

  return {
    episode: updatedEpisode,
    boostedIndices,
    beforeScore: beforeReport.overallScore,
    afterScore: afterReport.overallScore,
  };
}
