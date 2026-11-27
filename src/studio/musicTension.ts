import { EpisodeScript, MoodId, RaagId, StoryBeat } from './types';

export interface BeatMusicArcPlan {
  beatIndex: number;
  beatId: string;
  /** 0..1 holistic dramatic tension across the episode narrative arc */
  tension: number;
  /** 0 | 1 harmonic octave lift during climactic / awe-inspiring beats */
  octaveLift: number;
  /** 0.72..1.38 phrase rhythmic density multiplier (affects step tempo & ornament probability) */
  phraseDensity: number;
  /** 0.65..1.45 percussion accent multiplier (stronger drums/ghungroo at climax) */
  percussionEmphasis: number;
  /** Crossfade ramp duration (sec) entering this beat when raag or mood changed */
  crossfadeInSec: number;
  /** Whether raag or mood shifted relative to previous beat */
  hasHarmonicShift: boolean;
  /** Effective musical energy combining beat.musicEnergy + episode tension arc */
  effectiveEnergy: number;
}

export interface EpisodeMusicArc {
  beats: BeatMusicArcPlan[];
  peakBeatIndex: number;
  peakTension: number;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function moodTensionWeight(mood: MoodId): number {
  switch (mood) {
    case 'crimson_wrath':
      return 0.94;
    case 'twilight_temple':
      return 0.76;
    case 'golden_durbar':
      return 0.68;
    case 'sandstone_dusk':
      return 0.62;
    case 'mystic_teal':
      return 0.58;
    case 'midnight_banyan':
      return 0.54;
    case 'moonlit_marble':
      return 0.46;
    case 'emerald_jungle':
      return 0.38;
    default:
      return 0.5;
  }
}

/**
 * Pure deterministic harmonic tension & beat-boundary crossfade planner across an episode.
 * Never mutates inputs; zero Math.random().
 */
export function computeEpisodeMusicArc(
  episodeOrBeats: Pick<EpisodeScript, 'beats'> | StoryBeat[]
): EpisodeMusicArc {
  const beats = Array.isArray(episodeOrBeats) ? episodeOrBeats : episodeOrBeats.beats || [];
  if (beats.length === 0) {
    return { beats: [], peakBeatIndex: -1, peakTension: 0 };
  }

  const plans: BeatMusicArcPlan[] = [];
  let peakBeatIndex = 0;
  let peakTension = -1;
  const total = beats.length;

  for (let i = 0; i < total; i++) {
    const beat = beats[i];
    const prev = i > 0 ? beats[i - 1] : null;
    const progress = total <= 1 ? 0.5 : i / (total - 1);

    // Classic 3-act narrative curve: gentle rise -> climax peak near 72%-84% -> warm resolution tail
    const actCurve =
      progress < 0.78
        ? 0.28 + 0.62 * Math.pow(progress / 0.78, 1.35)
        : 0.9 - 0.48 * ((progress - 0.78) / 0.22);

    const baseEnergy = clamp(Number.isFinite(beat.musicEnergy) ? beat.musicEnergy : 0.65, 0.1, 1);
    const moodW = moodTensionWeight(beat.mood);
    const fxBoost =
      beat.fx === 'crimson_impact' || beat.fx === 'shock_burst'
        ? 0.16
        : beat.fx === 'divine_aura' || beat.fx === 'smear_swoop'
          ? 0.1
          : 0;
    const cueBoost = beat.actionCues && beat.actionCues.length > 0 ? Math.min(0.14, beat.actionCues.length * 0.05) : 0;
    const isSlate =
      beat.frame === 'chapter_title' || beat.frame === 'moral_card' || beat.frame === 'end_screen';

    let tension = clamp(baseEnergy * 0.42 + moodW * 0.28 + actCurve * 0.3 + fxBoost + cueBoost, 0.1, 1);
    if (isSlate) {
      tension = clamp(tension * 0.68, 0.12, 0.58);
    }

    const octaveLift = tension >= 0.78 && !isSlate ? 1 : 0;
    const phraseDensity = Number(clamp(0.76 + tension * 0.56, 0.72, 1.38).toFixed(3));
    const percussionEmphasis = Number(
      clamp(0.68 + tension * 0.72 + (beat.fx === 'crimson_impact' ? 0.12 : 0), 0.65, 1.45).toFixed(3)
    );

    const raagChanged = prev !== null && prev.raag !== beat.raag;
    const moodChanged = prev !== null && prev.mood !== beat.mood;
    const hasHarmonicShift = raagChanged || moodChanged;
    const crossfadeInSec = raagChanged ? 0.42 : moodChanged ? 0.28 : 0;

    const effectiveEnergy = Number(clamp(baseEnergy * 0.75 + tension * 0.32, 0.12, 1).toFixed(3));

    if (tension > peakTension) {
      peakTension = tension;
      peakBeatIndex = i;
    }

    plans.push({
      beatIndex: i,
      beatId: beat.id,
      tension: Number(tension.toFixed(3)),
      octaveLift,
      phraseDensity,
      percussionEmphasis,
      crossfadeInSec,
      hasHarmonicShift,
      effectiveEnergy,
    });
  }

  return {
    beats: plans,
    peakBeatIndex,
    peakTension: Number(Math.max(0, peakTension).toFixed(3)),
  };
}

/**
 * Computes a smooth crossfade gain multiplier (0.28..1.0) near a beat boundary when the
 * raag or mood shifts, eliminating abrupt harmonic jumps.
 */
export function computeBoundaryCrossfadeGain(
  beatLocalT: number,
  beatDuration: number,
  crossfadeInSec: number,
  nextCrossfadeInSec: number
): number {
  let gain = 1;
  if (crossfadeInSec > 0.01 && beatLocalT < crossfadeInSec) {
    const tIn = clamp(beatLocalT / crossfadeInSec, 0, 1);
    // Equal-power-style smooth sin ramp from 0.25 -> 1.0
    gain = Math.min(gain, 0.25 + 0.75 * Math.sin(tIn * Math.PI * 0.5));
  }
  if (nextCrossfadeInSec > 0.01) {
    const fadeOutDur = nextCrossfadeInSec * 0.75;
    const remaining = beatDuration - beatLocalT;
    if (remaining < fadeOutDur) {
      const tOut = clamp(remaining / fadeOutDur, 0, 1);
      gain = Math.min(gain, 0.28 + 0.72 * Math.sin(tOut * Math.PI * 0.5));
    }
  }
  return Number(clamp(gain, 0.2, 1).toFixed(4));
}

/**
 * Convenience helper for live playback when only the active beat + optional next/prev raag are known.
 */
export function computeLiveBeatTensionFallback(
  beat: StoryBeat,
  prevRaag?: RaagId | null,
  prevMood?: MoodId | null
): BeatMusicArcPlan {
  const single = computeEpisodeMusicArc([beat]).beats[0];
  const raagChanged = Boolean(prevRaag && prevRaag !== beat.raag);
  const moodChanged = Boolean(prevMood && prevMood !== beat.mood);
  return {
    ...single,
    hasHarmonicShift: raagChanged || moodChanged,
    crossfadeInSec: raagChanged ? 0.42 : moodChanged ? 0.28 : 0,
  };
}
