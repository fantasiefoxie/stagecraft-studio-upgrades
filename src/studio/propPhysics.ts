import { ActorPlacement, PropId, StoryBeat } from './types';

export type PropPhysicsMode = 'mystic_float' | 'pendulum_carry' | 'kinetic_weapon' | 'grounded_settle';

export interface PropPhysicsTransform {
  mode: PropPhysicsMode;
  offsetX: number; // px offset scaled by `scaleUnit`
  offsetY: number; // px offset scaled by `scaleUnit`
  rotationRad: number; // additional rotation in radians
  scalePulse: number; // multiplier around 1.0 (e.g. 0.94..1.14)
  glowBoost: number; // 0..1 halo pulse intensity for mystic/divine props
}

const MYSTIC_FLOAT_PROPS = new Set<string>([
  'sudarshana_chakra',
  'diya_lamp',
  'sun_orb',
  'lotus_petal',
  'neon_drone',
  'holo_tablet',
  'spellbook_tome',
  'crystal_amulet',
  'potion_flask',
  'crystal_orb',
  'lantern',
  'lotus_lamp',
  'spirit_lantern',
  'magic_lamp',
  'divine_trident',
  'golden_lotus',
  'sacred_scroll',
  'celestial_crown',
  'glowing_gem',
  'star_map',
]);

const WEAPON_SWING_PROPS = new Set<string>([
  'khanda_sword',
  'gada_mace',
  'trishul',
  'bow_arrow',
  'magic_staff',
  'kris_dagger',
  'flying_stick',
  'energy_blade',
  'wizard_staff',
  'judge_gavel',
  'violin_bow',
  'electric_guitar',
  'royal_sword',
  'sword',
  'mace',
  'gada',
  'spear',
  'trident',
  'staff',
  'axe',
  'hammer',
  'shield',
  'dagger',
]);

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Classifies a prop + anchor + actor choreography into a deterministic physics profile.
 */
export function resolvePropPhysicsMode(
  prop: PropId | string,
  propAnchor?: StoryBeat['propAnchor'],
  carrier?: ActorPlacement
): PropPhysicsMode {
  const p = String(prop || 'none').toLowerCase();
  if (
    MYSTIC_FLOAT_PROPS.has(p) ||
    p.includes('chakra') ||
    p.includes('orb') ||
    p.includes('lamp') ||
    p.includes('lantern') ||
    p.includes('halo') ||
    p.includes('lotus')
  ) {
    return 'mystic_float';
  }
  const isHeld = propAnchor === 'actor_left_hand' || propAnchor === 'actor_right_hand';
  if (
    isHeld &&
    (WEAPON_SWING_PROPS.has(p) ||
      p.includes('sword') ||
      p.includes('bow') ||
      p.includes('spear') ||
      p.includes('mace') ||
      p.includes('staff') ||
      carrier?.pose === 'attack' ||
      carrier?.motion === 'leap_arc')
  ) {
    return 'kinetic_weapon';
  }
  if (isHeld) {
    return 'pendulum_carry';
  }
  return 'grounded_settle';
}

/**
 * Pure deterministic secondary motion & follow-through arcs for stage and hand-held props.
 * Driven solely by `(beat, animT, beatU, scaleUnit, carrier, propPulse)` — zero Math.random(),
 * zero allocations beyond the returned transform record.
 */
export function computePropPhysics(
  beat: Pick<StoryBeat, 'prop' | 'propAnchor' | 'actionCues' | 'actors' | 'duration'>,
  animT: number,
  beatU: number,
  scaleUnit: number,
  carrier?: ActorPlacement,
  actionPropPulse = 0
): PropPhysicsTransform {
  const safeU = clamp(Number.isFinite(beatU) ? beatU : 0, 0, 1);
  const safeT = Number.isFinite(animT) ? animT : 0;
  const s = Math.max(0.25, Number.isFinite(scaleUnit) ? scaleUnit : 1);
  const pulse = clamp(Number.isFinite(actionPropPulse) ? actionPropPulse : 0, 0, 1);

  if (!beat.prop || beat.prop === 'none') {
    return {
      mode: 'grounded_settle',
      offsetX: 0,
      offsetY: 0,
      rotationRad: 0,
      scalePulse: 1,
      glowBoost: 0,
    };
  }

  const activeCarrier =
    carrier ||
    (beat.propAnchor === 'actor_right_hand'
      ? beat.actors?.[1] || beat.actors?.[0]
      : beat.propAnchor === 'actor_left_hand'
        ? beat.actors?.[0]
        : undefined);

  const mode = resolvePropPhysicsMode(beat.prop, beat.propAnchor, activeCarrier);

  // Beat-entry damped settle overshoot (12-Principles Follow-Through & Overlapping Action)
  // Peaks slightly past rest around u ~ 0.08, then decays smoothly to 0 by u ~ 0.38.
  const entryDecay = Math.exp(-safeU * 8.5);
  const entryOvershoot = entryDecay * Math.sin(safeU * Math.PI * 5.2);

  const facingDir = activeCarrier?.facing === 'left' ? -1 : 1;
  const isAttack = activeCarrier?.pose === 'attack';
  const isGesture = activeCarrier?.pose === 'gesture';
  const isLeaping = activeCarrier?.motion === 'leap_arc';
  const isMoving =
    activeCarrier?.motion === 'enter_left' ||
    activeCarrier?.motion === 'enter_right' ||
    activeCarrier?.motion === 'cross_stage' ||
    activeCarrier?.motion === 'step_forward' ||
    activeCarrier?.motion === 'retreat';

  // Detect active action cue energy around current beatU
  const beatDur = Math.max(1.2, beat.duration || 4);
  let cueKinetic = pulse;
  if (beat.actionCues && beat.actionCues.length > 0) {
    for (const cue of beat.actionCues) {
      const cueStartU = clamp((cue.frame ?? 0) / (beatDur * 60), 0, 1);
      const cueEndU = clamp(
        cue.endFrame !== undefined ? cue.endFrame / (beatDur * 60) : cueStartU + 0.18,
        cueStartU + 0.04,
        1
      );
      if (safeU >= cueStartU && safeU <= cueEndU) {
        const localFrac = (safeU - cueStartU) / Math.max(0.001, cueEndU - cueStartU);
        const bell = Math.sin(localFrac * Math.PI);
        const weight = cue.pose === 'attack' || cue.motion === 'leap_arc' ? 1.0 : 0.65;
        cueKinetic = Math.max(cueKinetic, bell * weight);
      }
    }
  }

  if (mode === 'mystic_float') {
    const bobY = Math.sin(safeT * 2.8) * 7.5 * s + entryOvershoot * 10 * s;
    const driftX = Math.cos(safeT * 1.45) * 3.2 * s;
    const isSpinningDisk = String(beat.prop).includes('chakra');
    const rot = isSpinningDisk
      ? (safeT * 2.2) % (Math.PI * 2)
      : Math.sin(safeT * 1.9) * 0.08 + entryOvershoot * 0.12;
    const glowBoost = clamp(0.42 + 0.28 * (0.5 + 0.5 * Math.sin(safeT * 3.4)) + cueKinetic * 0.3, 0, 1);
    return {
      mode,
      offsetX: Number(driftX.toFixed(2)),
      offsetY: Number(bobY.toFixed(2)),
      rotationRad: Number(rot.toFixed(4)),
      scalePulse: Number((1 + Math.sin(safeT * 3.4) * 0.03 + cueKinetic * 0.09).toFixed(4)),
      glowBoost: Number(glowBoost.toFixed(3)),
    };
  }

  if (mode === 'kinetic_weapon') {
    // Wind-up anticipation -> forward slash arc -> damped recoil follow-through
    const swingPhase = isAttack
      ? Math.sin(clamp(safeU * 2.4, 0, 1) * Math.PI) * Math.exp(-Math.max(0, safeU - 0.35) * 3.5)
      : cueKinetic;
    const leapLift = isLeaping ? -Math.sin(safeU * Math.PI) * 14 * s : 0;
    const swingAngle = facingDir * (swingPhase * 0.58 + entryOvershoot * 0.18 + Math.sin(safeT * 2.4) * 0.04);
    const offsetX = facingDir * (swingPhase * 16 * s + entryOvershoot * 5 * s);
    const offsetY = leapLift - swingPhase * 9 * s + Math.sin(safeT * 2.8) * 2.2 * s;
    return {
      mode,
      offsetX: Number(offsetX.toFixed(2)),
      offsetY: Number(offsetY.toFixed(2)),
      rotationRad: Number(swingAngle.toFixed(4)),
      scalePulse: Number((1 + swingPhase * 0.08 + pulse * 0.06).toFixed(4)),
      glowBoost: Number(clamp(swingPhase * 0.45, 0, 0.7).toFixed(3)),
    };
  }

  if (mode === 'pendulum_carry') {
    const strideAmp = isMoving ? 1.0 : isGesture ? 0.65 : 0.28;
    const pendulum = Math.sin(safeT * (isMoving ? 6.2 : 2.6)) * 0.14 * strideAmp;
    const swayX = Math.sin(safeT * (isMoving ? 6.2 : 2.6) - 0.6) * 4.5 * s * strideAmp;
    const bobY = Math.abs(Math.cos(safeT * (isMoving ? 6.2 : 2.6))) * -3.5 * s * strideAmp + entryOvershoot * 6 * s;
    const gestureLift = isGesture ? -5 * s * Math.sin(clamp(safeU * 1.8, 0, 1) * Math.PI) : 0;
    return {
      mode,
      offsetX: Number(swayX.toFixed(2)),
      offsetY: Number((bobY + gestureLift).toFixed(2)),
      rotationRad: Number((pendulum * facingDir + entryOvershoot * 0.14).toFixed(4)),
      scalePulse: Number((1 + cueKinetic * 0.06).toFixed(4)),
      glowBoost: Number(clamp(cueKinetic * 0.35, 0, 0.5).toFixed(3)),
    };
  }

  // Grounded stage prop: subtle entry settle bounce + cue impact pulse
  const settleY = entryOvershoot * -7 * s;
  const squashScale = 1 + Math.abs(entryOvershoot) * 0.04 + cueKinetic * 0.07;
  return {
    mode: 'grounded_settle',
    offsetX: 0,
    offsetY: Number(settleY.toFixed(2)),
    rotationRad: Number((entryOvershoot * 0.05).toFixed(4)),
    scalePulse: Number(squashScale.toFixed(4)),
    glowBoost: Number(clamp(cueKinetic * 0.4, 0, 0.6).toFixed(3)),
  };
}
