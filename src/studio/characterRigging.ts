// =========================================================================
// WAVE 9 (UPGRADES 47–50): LIVING CHARACTER RIGGING & SECONDARY PHYSICS
// 100% Pure Deterministic Functions — ZERO Math.random(), ZERO Allocations
// =========================================================================

import type {
  ActorHeldHandId,
  ActorPlacement,
  MotionId,
  PoseId,
  PropId,
  StoryBeat,
  WeatherId,
} from './types';

export type ResolvedHeadAngle = 'front' | 'three_quarter' | 'profile';

export interface ResolvedHeadOrientation {
  headAngle: ResolvedHeadAngle;
  /**
   * Signed horizontal yaw bias in [-1, 1] in the rendered portrait coordinate space.
   * 0 = dead-on front, ±0.55 = classic 3/4 turn, ±0.92 = true side profile.
   * Positive turns features toward +X (viewer's right); negative turns toward -X.
   */
  yawBias: number;
}

export interface ResolvedGazeVector {
  gazeTarget: 'camera' | 'partner' | 'left' | 'right' | 'up' | 'down';
  /** Horizontal pupil/iris target in [-1, 1] (positive = viewer's right) */
  lookX: number;
  /** Vertical pupil/iris target in [-0.6, 0.6] (positive = down, negative = up) */
  lookY: number;
}

export interface SecondaryMotionSway {
  /** Analytical hair swing behind head in radians */
  hairSwayRad: number;
  /** Analytical cape drag & pendulum lag in radians */
  capeLagRad: number;
  /** Analytical tail wave angle in radians */
  tailWaveRad: number;
  /** Normalized combined secondary kinetic energy in [0, 1] */
  energy: number;
}

export interface ActorRigRenderOptions {
  headAngle?: ResolvedHeadAngle;
  /** Yaw bias in local actor coordinates (-1..1). Note: full-body flips X when facing='left'. */
  yawBias?: number;
  /** Horizontal eye gaze in local head coordinates (-1..1). */
  lookX?: number;
  /** Vertical eye gaze in local head coordinates (-0.6..0.6). */
  lookY?: number;
  /** Optional hand-held prop anchored to the articulated 2-bone wrist/hand joint. */
  heldProp?: PropId | 'none';
  /** Hand choice for heldProp (default 'front'). */
  heldHand?: ActorHeldHandId;
  /** Precomputed deterministic secondary motion state for hair/cape/tail. */
  secondaryMotion?: SecondaryMotionSway;
  /** Active beat weather (used when computing fallback secondary motion inside full-body rigs). */
  weather?: WeatherId;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function hashSeed(input: string | number): number {
  if (typeof input === 'number') {
    const n = Math.abs(Math.floor(Number.isFinite(input) ? input : 0));
    return (n * 2654435761) % 997;
  }
  let h = 17;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) % 997;
  }
  return h;
}

function slotNormalizedX(actor: ActorPlacement): number {
  const base =
    actor.slot === 'left'
      ? -0.45
      : actor.slot === 'right'
        ? 0.45
        : actor.slot === 'overhead'
          ? 0.08
          : 0;
  return clamp(base + (actor.offsetX ?? 0), -0.95, 0.95);
}

function slotNormalizedY(actor: ActorPlacement): number {
  const base = actor.slot === 'overhead' ? -0.45 : 0;
  return clamp(base + (actor.offsetY ?? 0), -0.8, 0.6);
}

const CLOSEUP_SHOTS = new Set<string>(['closeup_left', 'closeup_right', 'eye_strip', 'motion_card']);
const CONVERSATION_SHOTS = new Set<string>([
  'two_shot',
  'wide_stage',
  'split_faceoff',
  'prop_spotlight',
  'low_angle_swoop',
]);
const PROFILE_MOTIONS = new Set<string>([
  'enter_left',
  'enter_right',
  'exit_left',
  'exit_right',
  'cross_stage',
]);

/**
 * Upgrade 47: Deterministically resolves an actor's head & torso angle ('front' | 'three_quarter' | 'profile')
 * and signed yawBias from shot framing, partner placement, movement, and explicit actor override.
 */
export function resolveActorHeadOrientation(
  beat: Pick<StoryBeat, 'shot' | 'actors' | 'speakerId'>,
  actor: ActorPlacement,
  partnerActor?: ActorPlacement
): ResolvedHeadOrientation {
  const facingSign = actor.facing === 'left' ? -1 : 1;
  const effectivePartner =
    partnerActor ||
    (Array.isArray(beat.actors)
      ? beat.actors.find((a) => a.castId !== actor.castId)
      : undefined);

  // Direction toward partner if present, otherwise actor facing direction
  let turnSign = facingSign;
  if (effectivePartner) {
    const dx = slotNormalizedX(effectivePartner) - slotNormalizedX(actor);
    if (Math.abs(dx) > 0.06) {
      turnSign = dx >= 0 ? 1 : -1;
    }
  }

  const requested = actor.headAngle || 'auto';
  if (requested === 'front') {
    return { headAngle: 'front', yawBias: 0 };
  }
  if (requested === 'three_quarter') {
    return { headAngle: 'three_quarter', yawBias: Number((turnSign * 0.55).toFixed(3)) };
  }
  if (requested === 'profile') {
    return { headAngle: 'profile', yawBias: Number((facingSign * 0.92).toFixed(3)) };
  }

  // 'auto' deterministic heuristic:
  // 1. Walking or crossing the stage -> true profile in travel direction
  if (
    PROFILE_MOTIONS.has(String(actor.motion || 'still')) ||
    actor.pose === 'walk'
  ) {
    return { headAngle: 'profile', yawBias: Number((facingSign * 0.9).toFixed(3)) };
  }

  // 2. Close-ups / eye_strip / motion_card / solo centered subject -> front-facing (with gentle presence)
  if (
    CLOSEUP_SHOTS.has(String(beat.shot)) ||
    (!effectivePartner && actor.slot === 'center')
  ) {
    return { headAngle: 'front', yawBias: 0 };
  }

  // 3. Multi-actor conversation / staging shots -> classic 3/4 turn toward partner
  if (effectivePartner && CONVERSATION_SHOTS.has(String(beat.shot))) {
    return { headAngle: 'three_quarter', yawBias: Number((turnSign * 0.55).toFixed(3)) };
  }

  // 4. Solo off-center actor turns gently 3/4 toward stage center
  if (actor.slot === 'left' || actor.slot === 'right') {
    const towardCenter = actor.slot === 'left' ? 1 : -1;
    return { headAngle: 'three_quarter', yawBias: Number((towardCenter * 0.48).toFixed(3)) };
  }

  return { headAngle: 'front', yawBias: 0 };
}

/**
 * Upgrade 47: Deterministically computes an actor's eye-gaze target & bounded (lookX, lookY) vector
 * with subtle organic micro-saccades.
 * Bounds: lookX in [-1, 1], lookY in [-0.6, 0.6].
 */
export function resolveActorGazeVector(
  beat: Pick<StoryBeat, 'shot' | 'actors' | 'speakerId'>,
  actor: ActorPlacement,
  partnerActor?: ActorPlacement,
  timeSec = 0
): ResolvedGazeVector {
  const safeT = Number.isFinite(timeSec) ? Math.max(0, timeSec) : 0;
  const seed = hashSeed(actor.castId);
  const effectivePartner =
    partnerActor ||
    (Array.isArray(beat.actors)
      ? beat.actors.find((a) => a.castId !== actor.castId)
      : undefined);

  // Subtle deterministic micro-saccade stepped in ~1.4s natural fixations
  const saccadeBucket = Math.floor((safeT + (seed % 19) * 0.17) / 1.45);
  const microX = Math.sin(saccadeBucket * 1.93 + seed * 0.37) * 0.08;
  const microY = Math.cos(saccadeBucket * 1.41 + seed * 0.23) * 0.05;

  const requested = actor.gazeTarget || 'auto';

  let resolvedTarget: ResolvedGazeVector['gazeTarget'];
  let baseX = 0;
  let baseY = 0;

  if (requested !== 'auto') {
    resolvedTarget = requested;
  } else if (CLOSEUP_SHOTS.has(String(beat.shot)) || !effectivePartner) {
    resolvedTarget = 'camera';
  } else {
    resolvedTarget = 'partner';
  }

  switch (resolvedTarget) {
    case 'camera':
      baseX = 0;
      baseY = 0;
      break;
    case 'left':
      baseX = -0.82;
      baseY = 0;
      break;
    case 'right':
      baseX = 0.82;
      baseY = 0;
      break;
    case 'up':
      baseX = 0;
      baseY = -0.48;
      break;
    case 'down':
      baseX = 0;
      baseY = 0.48;
      break;
    case 'partner': {
      if (effectivePartner) {
        const dx = slotNormalizedX(effectivePartner) - slotNormalizedX(actor);
        const dy = slotNormalizedY(effectivePartner) - slotNormalizedY(actor);
        baseX = clamp(dx * 1.35, -0.88, 0.88);
        baseY = clamp(dy * 0.85, -0.45, 0.45);
      } else {
        baseX = actor.facing === 'left' ? -0.52 : 0.52;
        baseY = 0;
      }
      break;
    }
  }

  const lookX = Number(clamp(baseX + microX, -1, 1).toFixed(4));
  const lookY = Number(clamp(baseY + microY, -0.6, 0.6).toFixed(4));

  return {
    gazeTarget: resolvedTarget,
    lookX,
    lookY,
  };
}

/**
 * Resolves wind intensity [0..1] for deterministic secondary motion physics from beat weather.
 */
function getWeatherWindForce(weather?: WeatherId): number {
  switch (weather) {
    case 'blizzard_gale':
    case 'sandstorm':
    case 'lightning_storm':
    case 'hailstorm':
      return 0.92;
    case 'rain':
    case 'acid_rain':
    case 'ash_fallout':
    case 'volcanic_cinders':
    case 'locust_swarm':
      return 0.72;
    case 'snow':
    case 'autumn_leaves':
    case 'sakura_blossoms':
    case 'petals':
    case 'embers':
    case 'dandelion_seeds':
    case 'confetti_shower':
    case 'golden_pollen':
      return 0.42;
    case 'mist':
    case 'fog_bank':
    case 'fireflies':
    case 'floating_lanterns':
    case 'starlight_dust':
    case 'starfall':
    case 'aurora_ribbons':
      return 0.16;
    case 'none':
    default:
      return 0.06;
  }
}

/**
 * Upgrade 50: Stateless analytical spring-pendulum secondary motion physics.
 * 100% pure function of (seed, timeSec, pose, motion, weather, speechEnergy) —
 * scrubbable to any exact frame with zero retained state and zero Math.random().
 */
export function computeSecondaryMotionSway(
  seed: number | string,
  timeSec: number,
  pose: PoseId = 'stand',
  motion: MotionId = 'still',
  weather: WeatherId = 'none',
  speechEnergy = 0
): SecondaryMotionSway {
  const s = hashSeed(seed);
  const t = Number.isFinite(timeSec) ? Math.max(0, timeSec) : 0;
  const sp = clamp(Number.isFinite(speechEnergy) ? speechEnergy : 0, 0, 1);

  // Kinetic impulse from character locomotion & pose
  let poseForce = 0.12;
  let freq = 2.6;
  let lagBias = 0.05;
  switch (pose) {
    case 'soar':
      poseForce = 0.85;
      freq = 5.4;
      lagBias = 0.48;
      break;
    case 'attack':
      poseForce = 0.78;
      freq = 6.2;
      lagBias = 0.36;
      break;
    case 'walk':
      poseForce = 0.56;
      freq = 4.6;
      lagBias = 0.28;
      break;
    case 'recoil':
      poseForce = 0.64;
      freq = 5.0;
      lagBias = -0.26;
      break;
    case 'hang_upside_down':
      poseForce = 0.45;
      freq = 3.6;
      lagBias = 0.16;
      break;
    case 'gesture':
      poseForce = 0.3;
      freq = 3.2;
      lagBias = 0.12;
      break;
    case 'kneel':
    case 'sit':
      poseForce = 0.14;
      freq = 2.1;
      lagBias = 0.04;
      break;
    case 'stand':
    default:
      poseForce = 0.12;
      freq = 2.5;
      lagBias = 0.04;
      break;
  }

  let motionForce = 0;
  switch (motion) {
    case 'cross_stage':
    case 'enter_left':
    case 'enter_right':
      motionForce = 0.52;
      lagBias += 0.24;
      break;
    case 'leap_arc':
      motionForce = 0.76;
      lagBias += 0.34;
      break;
    case 'step_forward':
      motionForce = 0.36;
      lagBias += 0.14;
      break;
    case 'retreat':
      motionForce = 0.48;
      lagBias -= 0.22;
      break;
    case 'still':
    default:
      motionForce = 0;
      break;
  }

  const windForce = getWeatherWindForce(weather);
  const energy = Number(
    clamp(poseForce * 0.45 + motionForce * 0.4 + windForce * 0.45 + sp * 0.18, 0, 1).toFixed(4)
  );

  // Damped dual-harmonic analytical spring pendulum (phase-shifted per limb layer)
  const phase = s * 0.19;
  const gust = 0.75 + 0.25 * Math.sin(t * 1.15 + phase * 0.6);
  const primaryOsc = Math.sin(t * freq + phase);
  const secondaryOsc = Math.sin(t * (freq * 1.73) - 0.85 + phase) * 0.35;
  const speechPulse = Math.sin(t * 8.4 + phase) * sp * 0.06;

  // Hair lags slightly behind head motion & flutters in wind
  const hairSwayRad = Number(
    clamp(
      (lagBias * 0.38 + windForce * 0.26 * gust) + (primaryOsc + secondaryOsc) * (0.06 + energy * 0.22) + speechPulse,
      -0.65,
      0.65
    ).toFixed(4)
  );

  // Cape carries heavier inertia and deeper phase lag (-0.95 rad phase delay)
  const capeOsc = Math.sin(t * (freq * 0.92) - 0.95 + phase) + Math.sin(t * (freq * 1.55) - 1.6 + phase) * 0.3;
  const capeLagRad = Number(
    clamp(
      (lagBias * 0.65 + windForce * 0.42 * gust) + capeOsc * (0.08 + energy * 0.3),
      -0.95,
      0.95
    ).toFixed(4)
  );

  // Tail carries springy traveling-wave whip
  const tailOsc = Math.sin(t * (freq * 1.08) - 0.45 + phase) + Math.sin(t * (freq * 2.05) - 1.3 + phase) * 0.32;
  const tailWaveRad = Number(
    clamp(
      (lagBias * 0.3 + windForce * 0.22 * gust) + tailOsc * (0.12 + energy * 0.34),
      -0.85,
      0.85
    ).toFixed(4)
  );

  return {
    hairSwayRad,
    capeLagRad,
    tailWaveRad,
    energy,
  };
}

/**
 * Computes WCAG 2.1 sRGB relative luminance in [0, 1] for a hex color string (e.g. '#f4c542').
 * Used by Upgrade 52 Shot-Inspector actor telemetry (`paletteContrastLuma`).
 */
export function computePaletteContrastLuma(hexColor: string): number {
  const clean = typeof hexColor === 'string' ? hexColor.trim() : '';
  const match = /^#([0-9a-fA-F]{6})$/.exec(clean);
  if (!match) return 0.5;
  const num = parseInt(match[1], 16);
  const toLinear = (c8: number) => {
    const s = c8 / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = toLinear((num >> 16) & 255);
  const g = toLinear((num >> 8) & 255);
  const b = toLinear(num & 255);
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return Number(clamp(luma, 0, 1).toFixed(4));
}

/**
 * Convenience helper to resolve a complete ActorRigRenderOptions bundle for a beat actor.
 */
export function resolveActorRigForBeat(
  beat: Pick<StoryBeat, 'shot' | 'actors' | 'speakerId' | 'weather'>,
  actor: ActorPlacement,
  timeSec: number,
  speechEnergy = 0
): {
  orientation: ResolvedHeadOrientation;
  gaze: ResolvedGazeVector;
  secondaryMotion: SecondaryMotionSway;
  rig: ActorRigRenderOptions;
} {
  const partner = Array.isArray(beat.actors)
    ? beat.actors.find((a) => a.castId !== actor.castId)
    : undefined;
  const orientation = resolveActorHeadOrientation(beat, actor, partner);
  const gaze = resolveActorGazeVector(beat, actor, partner, timeSec);
  const secondaryMotion = computeSecondaryMotionSway(
    actor.castId,
    timeSec,
    actor.pose,
    actor.motion || 'still',
    beat.weather || 'none',
    speechEnergy
  );

  // Convert world-space yaw/lookX into actor-local coordinates when full-body mirrors X for facing='left'
  const flip = actor.facing === 'left' ? -1 : 1;
  const localYaw = Number((orientation.yawBias * flip).toFixed(4));
  const localLookX = Number((gaze.lookX * flip).toFixed(4));

  return {
    orientation,
    gaze,
    secondaryMotion,
    rig: {
      headAngle: orientation.headAngle,
      yawBias: localYaw,
      lookX: localLookX,
      lookY: gaze.lookY,
      heldProp: actor.heldProp || 'none',
      heldHand: actor.heldHand || 'front',
      secondaryMotion,
      weather: beat.weather || 'none',
    },
  };
}
