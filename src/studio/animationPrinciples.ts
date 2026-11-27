/**
 * Stagecraft Studio — 12 Principles of Animation Engine
 *
 * Distills Disney's 12 classic animation principles and the motion-craft frameworks
 * from `dylantarre/animation-principles` (Traditional Animator, Filmmaker,
 * Naturalistic Motion, Timing Mastery, Anticipation-Payoff, and Video Motion Graphics)
 * into pure, deterministic Canvas 2D math, AI Director guidance, and episode diagnostics.
 */
import type {
  EpisodeScript,
  MotionId,
  MotionProfileId,
  RenderStyleId,
  StoryBeat,
} from './types';

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// =========================================================================
// 1. MOTION PHILOSOPHY PROFILES (Thinking Styles -> Deterministic Physics)
// =========================================================================

export type ResolvedMotionProfileId = Exclude<MotionProfileId, 'auto'>;

export interface MotionProfileSpec {
  id: ResolvedMotionProfileId;
  label: string;
  /** Multiplier for squash-and-stretch & pose extremes (0.72 naturalistic .. 1.45 cartoon) */
  exaggeration: number;
  /** Fraction of movement spent in reverse anticipation wind-up (0.06 .. 0.16) */
  anticipationRatio: number;
  /** Elastic overshoot amplitude on settles & entrances */
  overshootAmp: number;
  /** Overshoot oscillation frequency (Hz) */
  overshootFreq: number;
  /** Overshoot exponential decay rate */
  overshootDecay: number;
  /** Secondary follow-through lag in 60fps-equivalent frames (4..8 frames per repo spec) */
  followThroughFrames: number;
  /** Subtle vertical arc lift (px at 620px reference height) so movement avoids straight lines */
  arcLiftPx: number;
  /** Asymmetric left/right limb phase offset (radians) to eliminate robotic twinning */
  asymmetryRad: number;
  /** Camera Slow In / Slow Out bezier control points [x1, y1, x2, y2] */
  cameraBezier: [number, number, number, number];
  /** Stage movement bezier control points [x1, y1, x2, y2] */
  motionBezier: [number, number, number, number];
  /** Lower-third caption entrance duration in seconds (12..20 frames at 60fps -> 0.22..0.34s) */
  captionInSec: number;
  /** Lower-third caption exit duration in seconds (8..12 frames at 60fps -> 0.14..0.20s) */
  captionOutSec: number;
}

export const MOTION_PROFILE_SPECS: Record<ResolvedMotionProfileId, MotionProfileSpec> = {
  cinematic_drama: {
    id: 'cinematic_drama',
    label: 'Cinematic Drama (Filmmaker)',
    exaggeration: 1.0,
    anticipationRatio: 0.12,
    overshootAmp: 0.32,
    overshootFreq: 2.6,
    overshootDecay: 5.5,
    followThroughFrames: 6,
    arcLiftPx: 14,
    asymmetryRad: 0.42,
    cameraBezier: [0.42, 0.0, 0.2, 1.0],
    motionBezier: [0.25, 0.1, 0.25, 1.0],
    captionInSec: 0.28,
    captionOutSec: 0.18,
  },
  naturalistic: {
    id: 'naturalistic',
    label: 'Naturalistic Life (Organic)',
    exaggeration: 0.72,
    anticipationRatio: 0.09,
    overshootAmp: 0.16,
    overshootFreq: 2.1,
    overshootDecay: 6.4,
    followThroughFrames: 7,
    arcLiftPx: 11,
    asymmetryRad: 0.58,
    cameraBezier: [0.37, 0.0, 0.28, 1.0],
    motionBezier: [0.33, 0.05, 0.28, 1.0],
    captionInSec: 0.32,
    captionOutSec: 0.2,
  },
  snappy_cartoon: {
    id: 'snappy_cartoon',
    label: 'Snappy Cartoon (Exaggerated)',
    exaggeration: 1.42,
    anticipationRatio: 0.15,
    overshootAmp: 0.62,
    overshootFreq: 3.4,
    overshootDecay: 4.4,
    followThroughFrames: 5,
    arcLiftPx: 22,
    asymmetryRad: 0.48,
    cameraBezier: [0.22, 1.0, 0.36, 1.0],
    motionBezier: [0.2, 0.9, 0.25, 1.0],
    captionInSec: 0.22,
    captionOutSec: 0.14,
  },
  motion_graphics: {
    id: 'motion_graphics',
    label: 'Motion Graphics (Crisp Bezier)',
    exaggeration: 1.12,
    anticipationRatio: 0.08,
    overshootAmp: 0.45,
    overshootFreq: 3.0,
    overshootDecay: 5.0,
    followThroughFrames: 4,
    arcLiftPx: 12,
    asymmetryRad: 0.32,
    cameraBezier: [0.22, 1.0, 0.36, 1.0],
    motionBezier: [0.16, 1.0, 0.3, 1.0],
    captionInSec: 0.24,
    captionOutSec: 0.15,
  },
};

export function resolveMotionProfileId(
  profile: MotionProfileId | undefined,
  renderStyle?: RenderStyleId
): ResolvedMotionProfileId {
  if (profile && profile !== 'auto' && profile in MOTION_PROFILE_SPECS) {
    return profile;
  }
  switch (renderStyle) {
    case 'felt_puppet':
    case 'anime_cel':
    case 'manga_screentone':
    case 'papercraft_diorama':
      return 'snappy_cartoon';
    case 'blueprint_technical':
    case 'lineless_vector':
    case 'risograph_print':
      return 'motion_graphics';
    case 'sumi_e_wash':
    case 'gouache_storybook':
    case 'backlit_sand':
    case 'illuminated_codex':
      return 'naturalistic';
    default:
      return 'cinematic_drama';
  }
}

export function resolveMotionProfileSpec(
  profile: MotionProfileId | undefined,
  renderStyle?: RenderStyleId
): MotionProfileSpec {
  return MOTION_PROFILE_SPECS[resolveMotionProfileId(profile, renderStyle)];
}

// =========================================================================
// 2. SLOW IN / SLOW OUT — DETERMINISTIC CUBIC BEZIER SOLVER (Principle #6)
// =========================================================================

function sampleBezierCurve(p1: number, p2: number, u: number): number {
  const inv = 1 - u;
  return 3 * inv * inv * u * p1 + 3 * inv * u * u * p2 + u * u * u;
}

function sampleBezierDerivative(p1: number, p2: number, u: number): number {
  const inv = 1 - u;
  return 3 * inv * inv * p1 + 6 * inv * u * (p2 - p1) + 3 * u * u * (1 - p2);
}

/**
 * Pure deterministic cubic-bezier(x1, y1, x2, y2) easing evaluator.
 * Never uses linear motion where organic acceleration/deceleration belongs.
 */
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  t: number
): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;

  // Solve x(u) = t via 5 Newton-Raphson iterations with safe bisection fallback
  let u = t;
  for (let i = 0; i < 5; i++) {
    const err = sampleBezierCurve(x1, x2, u) - t;
    if (Math.abs(err) < 1e-5) break;
    const d = sampleBezierDerivative(x1, x2, u);
    if (Math.abs(d) < 1e-5) break;
    u = clamp(u - err / d, 0, 1);
  }
  const finalErr = Math.abs(sampleBezierCurve(x1, x2, u) - t);
  if (finalErr > 1e-4) {
    let lo = 0;
    let hi = 1;
    u = t;
    for (let i = 0; i < 10; i++) {
      const val = sampleBezierCurve(x1, x2, u);
      if (val < t) lo = u;
      else hi = u;
      u = (lo + hi) * 0.5;
    }
  }
  return sampleBezierCurve(y1, y2, u);
}

// =========================================================================
// 3. SQUASH & STRETCH — CONSTANT VOLUME CONSERVATION (Principle #1)
// =========================================================================

/**
 * Enforces Disney Principle #1: volume stays strictly constant (`scaleX * scaleY === 1`).
 * Positive `stretchY` stretches taller and thinner; negative squashes wider and shorter.
 */
export function volumeConservingSquash(stretchY: number): { scaleX: number; scaleY: number } {
  const scaleY = clamp(1 + stretchY, 0.72, 1.38);
  const scaleX = 1 / scaleY;
  return { scaleX, scaleY };
}

// =========================================================================
// 4. FOLLOW-THROUGH & ELASTIC OVERSHOOT (Principle #5)
// =========================================================================

/**
 * Deterministic port of the Video Motion Graphics overshoot spring expression:
 * `amp * (sin(t * w) / exp(decay * t) / w)` where `w = freq * 2π`.
 */
export function dampedOvershoot(
  tSec: number,
  freq = 3.0,
  decay = 5.0,
  amp = 1.0
): number {
  if (tSec <= 0) return 0;
  const w = Math.max(0.5, freq) * Math.PI * 2;
  return amp * (Math.sin(tSec * w) / Math.exp(Math.max(0.5, decay) * tSec)) / w;
}

/**
 * Principle #5 (`valueAtTime` delay): returns a lagged timestamp so secondary
 * limbs, capes, hair, and forearms follow 4–8 frames behind primary torso motion.
 */
export function computeFollowThroughTime(
  timeSec: number,
  lagFrames: number,
  fps = 60
): number {
  const lagSec = Math.max(0, lagFrames) / Math.max(12, fps);
  return Math.max(0, timeSec - lagSec);
}

// =========================================================================
// 5. ANTICIPATION + ARCS + SETTLE FOR STAGE MOTION (Principles #2, #6, #7)
// =========================================================================

export interface StageMotionSample {
  /** Normalized progress along travel axis (may dip slightly <0 in anticipation or >1 in overshoot) */
  progress: number;
  /** Vertical curved-arc lift in reference pixels (negative = upward arc) */
  arcOffsetY: number;
}

/**
 * Computes organic stage travel with:
 * - Reverse anticipation wind-up (2–4 frames opposite direction before moving)
 * - Cubic-bezier Slow In / Slow Out acceleration & cushion
 * - Curved parabolic arc (Principle #7: natural movement avoids straight lines)
 * - Subtle elastic settle on arrival
 */
export function computeStageMotionArc(
  motion: MotionId | undefined,
  u: number,
  spec: MotionProfileSpec
): StageMotionSample {
  const cu = clamp(u, 0, 1);
  const [x1, y1, x2, y2] = spec.motionBezier;

  if (!motion || motion === 'still') {
    return { progress: 0, arcOffsetY: 0 };
  }

  if (motion === 'leap_arc') {
    // 12% crouch anticipation -> 73% airborne parabolic arc -> 15% landing cushion
    const crouchEnd = clamp(spec.anticipationRatio, 0.08, 0.16);
    const landStart = 0.86;
    if (cu < crouchEnd) {
      const p = cu / crouchEnd;
      return {
        progress: -0.04 * Math.sin(p * Math.PI) * spec.exaggeration,
        arcOffsetY: 0,
      };
    }
    if (cu < landStart) {
      const airU = (cu - crouchEnd) / (landStart - crouchEnd);
      const eased = cubicBezier(x1, y1, x2, y2, airU);
      const arcH = Math.sin(airU * Math.PI) * (150 + spec.arcLiftPx * 1.4);
      return { progress: eased, arcOffsetY: -arcH };
    }
    const settleT = (cu - landStart) / (1 - landStart);
    const settleBounce = dampedOvershoot(settleT * 0.6, spec.overshootFreq, spec.overshootDecay, spec.overshootAmp * 0.15);
    return { progress: 1 + settleBounce, arcOffsetY: 0 };
  }

  if (motion === 'step_forward' || motion === 'retreat') {
    // Reverse wind-up anticipation -> eased stride -> subtle elastic settle + shallow curved arc
    const ant = clamp(spec.anticipationRatio, 0.07, 0.15);
    if (cu < ant) {
      const p = cu / ant;
      return {
        progress: -0.09 * Math.sin(p * Math.PI) * spec.exaggeration,
        arcOffsetY: 0,
      };
    }
    const moveU = (cu - ant) / (1 - ant);
    const eased = cubicBezier(x1, y1, x2, y2, moveU);
    const settle =
      moveU > 0.72
        ? dampedOvershoot((moveU - 0.72) * 1.4, spec.overshootFreq, spec.overshootDecay, spec.overshootAmp * 0.14)
        : 0;
    const arcLift = Math.sin(moveU * Math.PI) * spec.arcLiftPx;
    return { progress: eased + settle, arcOffsetY: -arcLift };
  }

  if (motion === 'enter_left' || motion === 'enter_right') {
    // Crisp ease-out entrance with gentle settling overshoot and subtle curved glide
    const eased = cubicBezier(0.18, 0.92, 0.3, 1.0, cu);
    const settle =
      cu > 0.65
        ? dampedOvershoot((cu - 0.65) * 1.5, spec.overshootFreq, spec.overshootDecay, spec.overshootAmp * 0.12)
        : 0;
    const arcLift = Math.sin(cu * Math.PI) * (spec.arcLiftPx * 0.75);
    return { progress: eased + settle, arcOffsetY: -arcLift };
  }

  // cross_stage: smooth Slow In / Slow Out traverse with shallow stepping arc
  const eased = cubicBezier(x1, y1, x2, y2, cu);
  const arcLift = Math.sin(cu * Math.PI) * (spec.arcLiftPx * 0.85);
  return { progress: eased, arcOffsetY: -arcLift };
}

// =========================================================================
// 6. LOWER-THIRD CAPTION TIMING (Video Motion Graphics Timing Table)
// =========================================================================

export interface CaptionMotionState {
  alpha: number;
  translateYNorm: number; // fraction of caption block height to offset vertically
  scale: number;
}

/**
 * Implements the Video Motion Graphics timing table:
 * - Lower-third in: 12–18 frames ease-out (`cubic-bezier(0.22, 1, 0.36, 1)`)
 * - Lower-third out: 8–12 frames ease-in (`cubic-bezier(0.4, 0, 1, 1)`)
 */
export function computeCaptionLowerThirdMotion(
  localT: number,
  beatDuration: number,
  spec: MotionProfileSpec
): CaptionMotionState {
  const dur = Math.max(1.0, beatDuration);
  const inDur = Math.min(spec.captionInSec, dur * 0.25);
  const outDur = Math.min(spec.captionOutSec, dur * 0.2);

  if (localT < inDur) {
    const p = clamp(localT / Math.max(0.05, inDur), 0, 1);
    const eased = cubicBezier(0.22, 1.0, 0.36, 1.0, p);
    return {
      alpha: eased,
      translateYNorm: (1 - eased) * 0.28,
      scale: 0.96 + 0.04 * eased,
    };
  }

  const remaining = dur - localT;
  if (remaining < outDur) {
    const p = clamp(1 - remaining / Math.max(0.05, outDur), 0, 1);
    const easedOut = cubicBezier(0.4, 0.0, 1.0, 1.0, p);
    return {
      alpha: 1 - easedOut,
      translateYNorm: easedOut * 0.16,
      scale: 1 - 0.02 * easedOut,
    };
  }

  return { alpha: 1, translateYNorm: 0, scale: 1 };
}

// =========================================================================
// 7. 12-PRINCIPLES EPISODE AUDIT & 1-CLICK AUTO-POLISH
// =========================================================================

export interface PrincipleCheckResult {
  id: string;
  principle: string;
  score: number; // 0..100
  status: 'pass' | 'warn';
  note: string;
}

export interface AnimationPrinciplesAudit {
  overallScore: number;
  profile: ResolvedMotionProfileId;
  checks: PrincipleCheckResult[];
}

export function auditEpisodeAnimationPrinciples(
  episode: EpisodeScript
): AnimationPrinciplesAudit {
  const beats = episode.beats || [];
  const profile = resolveMotionProfileId(
    episode.visualStyle?.motionProfile,
    episode.visualStyle?.renderStyle
  );

  // 1. Timing & Rhythm Contrast ("Fast only feels fast next to slow")
  const durs = beats.map((b) => Math.max(1.2, b.duration || 4));
  const minDur = durs.length > 0 ? Math.min(...durs) : 4;
  const maxDur = durs.length > 0 ? Math.max(...durs) : 4;
  const durSpread = maxDur - minDur;
  const timingScore = beats.length <= 1 ? 80 : clamp(Math.round(52 + durSpread * 28), 45, 100);

  // 2. Staging & Shot Variety (Clear focal point, never monotonous wide-only)
  const uniqueShots = new Set(beats.map((b) => b.shot)).size;
  const stagingScore = clamp(Math.round(40 + Math.min(uniqueShots, 4) * 15), 40, 100);

  // 3. Anticipation & Payoff (Camera moves, action motions, and SFX punctuation)
  const dynamicMoves = beats.filter((b) => b.cameraMove && b.cameraMove !== 'still').length;
  const sfxBeats = beats.filter((b) => b.sfx && b.sfx !== 'none').length;
  const anticipationRatio = beats.length > 0 ? (dynamicMoves + sfxBeats) / (beats.length * 1.4) : 0;
  const anticipationScore = clamp(Math.round(45 + anticipationRatio * 55), 45, 100);

  // 4. Secondary Action & Living Atmosphere (Weather, props, or animated actors)
  const livingBeats = beats.filter(
    (b) =>
      (b.weather && b.weather !== 'none') ||
      (b.prop && b.prop !== 'none') ||
      b.actors.some((a) => (a.motion && a.motion !== 'still') || (a.expressionTrack && a.expressionTrack.length > 1))
  ).length;
  const secondaryScore =
    beats.length > 0 ? clamp(Math.round(45 + (livingBeats / beats.length) * 55), 45, 100) : 70;

  // 5. Exaggeration, Arcs & Appeal (Close-ups / faceoffs + non-static expressions)
  const uniqueExprs = new Set(
    beats.flatMap((b) => b.actors.map((a) => a.expression))
  ).size;
  const hasDramaticFraming = beats.some(
    (b) => b.shot === 'closeup_left' || b.shot === 'closeup_right' || b.shot === 'eye_strip' || b.shot === 'split_faceoff'
  );
  const appealScore = clamp(
    Math.round(50 + Math.min(uniqueExprs, 4) * 9 + (hasDramaticFraming ? 14 : 0)),
    50,
    100
  );

  const checks: PrincipleCheckResult[] = [
    {
      id: 'timing_rhythm',
      principle: 'Timing & Rhythm Contrast',
      score: timingScore,
      status: timingScore >= 75 ? 'pass' : 'warn',
      note:
        timingScore >= 75
          ? `Good pacing contrast (${minDur.toFixed(1)}s–${maxDur.toFixed(1)}s beats).`
          : 'Uniform beat lengths feel mechanical; vary fast punch beats and slower hold beats.',
    },
    {
      id: 'staging_clarity',
      principle: 'Staging & Focal Clarity',
      score: stagingScore,
      status: stagingScore >= 75 ? 'pass' : 'warn',
      note:
        stagingScore >= 75
          ? `${uniqueShots} distinct shot framings guide viewer attention.`
          : 'Add close-ups or two-shots to break up repeated wide staging.',
    },
    {
      id: 'anticipation_payoff',
      principle: 'Anticipation, Slow-In/Out & Payoff',
      score: anticipationScore,
      status: anticipationScore >= 75 ? 'pass' : 'warn',
      note:
        anticipationScore >= 75
          ? 'Camera cushioning and SFX payoffs punctuate story beats.'
          : 'Add slow_push/slow_pull camera cushions and SFX cues before key reveals.',
    },
    {
      id: 'secondary_life',
      principle: 'Secondary Action & Living World',
      score: secondaryScore,
      status: secondaryScore >= 75 ? 'pass' : 'warn',
      note:
        secondaryScore >= 75
          ? 'Atmospheric layers, props, and actor motion keep scenes alive.'
          : 'Add subtle weather particles, actor entrance arcs, or prop interactions.',
    },
    {
      id: 'appeal_acting',
      principle: 'Exaggeration, Arcs & Appeal',
      score: appealScore,
      status: appealScore >= 75 ? 'pass' : 'warn',
      note:
        appealScore >= 75
          ? `${uniqueExprs} emotional states with strong facial close-up framing.`
          : 'Broaden character expressions and include at least one dramatic close-up.',
    },
  ];

  const overallScore = Math.round(
    checks.reduce((sum, c) => sum + c.score, 0) / checks.length
  );

  return { overallScore, profile, checks };
}

/**
 * 1-Click 12-Principles Auto-Polish:
 * Non-destructively upgrades static beats with Slow-In/Out camera cushions,
 * varied rhythm contrast, curved stage entrances, and secondary atmospheric motion.
 */
export function applyAnimationPrinciplesAutoPolish(episode: EpisodeScript): {
  episode: EpisodeScript;
  changes: string[];
} {
  const changes: string[] = [];
  const nextBeats: StoryBeat[] = episode.beats.map((b, idx) => {
    const next: StoryBeat = {
      ...b,
      actors: b.actors.map((a) => ({ ...a })),
    };

    // 1. Replace flat static cameras with Slow In / Slow Out breathing cushions
    if (!next.cameraMove || next.cameraMove === 'still') {
      if (next.frame === 'moral_card' || idx === episode.beats.length - 1) {
        next.cameraMove = 'slow_pull';
      } else if (next.shot === 'closeup_left' || next.shot === 'closeup_right' || next.shot === 'eye_strip') {
        next.cameraMove = 'slow_push';
      } else {
        next.cameraMove = idx % 2 === 0 ? 'slow_push' : 'slow_pull';
      }
      if (!changes.includes('Added Slow-In/Slow-Out camera cushions')) {
        changes.push('Added Slow-In/Slow-Out camera cushions');
      }
    }

    // 2. Ensure opening beat has an inviting entrance/step arc (Anticipation & Arcs)
    if (idx === 0 && next.actors.length > 0 && (!next.actors[0].motion || next.actors[0].motion === 'still')) {
      next.actors[0].motion = 'step_forward';
      changes.push('Added opening anticipation & curved step arc');
    }

    // 3. Ensure at least one close-up or split faceoff mid-episode for Staging & Appeal
    if (
      episode.beats.length >= 4 &&
      idx === Math.floor(episode.beats.length / 2) &&
      next.shot === 'wide_stage' &&
      !episode.beats.some((x) => x.shot === 'closeup_left' || x.shot === 'closeup_right' || x.shot === 'eye_strip')
    ) {
      next.shot = next.speakerId === next.actors[1]?.castId ? 'closeup_right' : 'closeup_left';
      changes.push('Added mid-story focal close-up for staging clarity');
    }

    // 4. Introduce subtle atmospheric Secondary Action on completely static scenes
    if ((!next.weather || next.weather === 'none') && next.frame !== 'chapter_title' && idx % 2 === 0) {
      next.weather =
        next.mood === 'crimson_wrath'
          ? 'embers'
          : next.mood === 'midnight_banyan' || next.mood === 'twilight_temple'
            ? 'fireflies'
            : 'petals';
      if (!changes.includes('Layered secondary atmospheric motion')) {
        changes.push('Layered secondary atmospheric motion');
      }
    }

    return next;
  });

  // 5. Add gentle Timing Contrast if every beat has identical duration
  const allSameDur =
    nextBeats.length >= 3 &&
    nextBeats.every((b) => Math.abs((b.duration || 4) - (nextBeats[0].duration || 4)) < 0.25);
  if (allSameDur) {
    nextBeats.forEach((b, i) => {
      if (b.shot === 'eye_strip' || b.shot === 'split_faceoff') {
        b.duration = Math.max(2.6, Number(((b.duration || 4) - 0.7).toFixed(1)));
      } else if (b.frame === 'moral_card' || i === nextBeats.length - 1) {
        b.duration = Number(((b.duration || 4) + 0.6).toFixed(1));
      }
    });
    changes.push('Tuned beat timing contrast (fast punches vs. dramatic holds)');
  }

  const resolvedProfile = resolveMotionProfileId(
    episode.visualStyle?.motionProfile,
    episode.visualStyle?.renderStyle
  );

  return {
    episode: {
      ...episode,
      visualStyle: {
        ...(episode.visualStyle || {}),
        motionProfile: episode.visualStyle?.motionProfile || resolvedProfile,
      },
      beats: nextBeats,
    },
    changes: changes.length > 0 ? changes : ['Episode already meets 12-Principles benchmarks'],
  };
}

// =========================================================================
// 8. AI DIRECTOR 12-PRINCIPLES CONSTITUTION (For LLM Storyboarding)
// =========================================================================

export function buildAnimationPrinciplesPromptBlock(): string {
  return `DISNEY'S 12 ANIMATION PRINCIPLES (MANDATORY FILMMAKING CRAFT):
1. TIMING CONTRAST: Fast only feels fast next to slow—vary beat pacing (2.6–3.4s snappy action/revelation beats vs. 4.4–5.6s emotional holds).
2. ANTICIPATION & PAYOFF: Telegraph big reveals or strikes with a setup beat (curious/stern expression + slow_push) before the explosive payoff (attack/recoil + impact_shake/sword_clash/thunder_crack).
3. STAGING & FOCAL CLARITY: Alternate wide_stage establishing shots with two_shot exchanges, closeup_left/closeup_right emotional beats, and eye_strip or split_faceoff climaxes—never repeat wide_stage flatly.
4. ARCS & FOLLOW-THROUGH: Give characters motivated stage motion (enter_left, step_forward, leap_arc, retreat) so Stagecraft's curved-arc & follow-through kinematics bring entrances and retreats alive.
5. SECONDARY ACTION & NO TWINNING: Keep scenes breathing with matched weather (fireflies, embers, rain, mist, petals), storytelling props, and asymmetric speaker-vs-listener emotions/poses so no two characters mirror each other like twins.`;
}
