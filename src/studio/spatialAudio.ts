/**
 * Stagecraft Studio — Deterministic Stereo Spatial Audio & Stage Room Acoustics
 *
 * Computes deterministic stereo pan positions (-0.28 left actor, 0 center/narrator,
 * +0.28 right actor) and deterministic procedural room impulse responses matched to
 * `beat.stage` (temple reverb, cave slapback, palace hall, canyon echo, wood interior,
 * dry outdoor clearing). Zero Math.random() — 100% reproducible across live playback
 * and OfflineAudioContext renders.
 */

import type { StageId, StoryBeat } from './types';

export type RoomAcousticProfileId =
  | 'temple_reverb'
  | 'cave_slapback'
  | 'palace_hall'
  | 'canyon_echo'
  | 'wood_interior'
  | 'dry_outdoor';

export interface StageRoomAcoustics {
  profileId: RoomAcousticProfileId;
  label: string;
  /** Reverb decay time RT60 in seconds */
  rt60Sec: number;
  /** Pre-delay before early reflections in milliseconds */
  preDelayMs: number;
  /** Subtle wet send level (0..0.28) so dialogue stays crystal clear */
  wetMix: number;
  /** High-frequency damping cutoff in Hz */
  dampingHz: number;
  /** Optional slapback reflection tap delay in milliseconds (caves / canyons) */
  slapbackMs?: number;
  /** Optional slapback tap amplitude */
  slapbackGain?: number;
}

const ROOM_PROFILES: Record<RoomAcousticProfileId, StageRoomAcoustics> = {
  temple_reverb: {
    profileId: 'temple_reverb',
    label: 'Stone Temple Reverb',
    rt60Sec: 1.35,
    preDelayMs: 22,
    wetMix: 0.17,
    dampingHz: 3400,
  },
  cave_slapback: {
    profileId: 'cave_slapback',
    label: 'Cavern Slapback',
    rt60Sec: 1.45,
    preDelayMs: 16,
    wetMix: 0.21,
    dampingHz: 2600,
    slapbackMs: 118,
    slapbackGain: 0.36,
  },
  palace_hall: {
    profileId: 'palace_hall',
    label: 'Marble Palace Hall',
    rt60Sec: 0.96,
    preDelayMs: 18,
    wetMix: 0.13,
    dampingHz: 4200,
  },
  canyon_echo: {
    profileId: 'canyon_echo',
    label: 'Open Ridge & Canyon',
    rt60Sec: 0.78,
    preDelayMs: 30,
    wetMix: 0.11,
    dampingHz: 3200,
    slapbackMs: 165,
    slapbackGain: 0.24,
  },
  wood_interior: {
    profileId: 'wood_interior',
    label: 'Intimate Interior',
    rt60Sec: 0.42,
    preDelayMs: 8,
    wetMix: 0.08,
    dampingHz: 4800,
  },
  dry_outdoor: {
    profileId: 'dry_outdoor',
    label: 'Dry Outdoor Clearing',
    rt60Sec: 0.26,
    preDelayMs: 6,
    wetMix: 0.045,
    dampingHz: 5200,
  },
};

const STAGE_ACOUSTIC_MAP: Record<StageId, RoomAcousticProfileId> = {
  // Temples & sacred stone enclosures
  kali_temple: 'temple_reverb',
  himalayan_hermitage: 'temple_reverb',
  olympus_acropolis: 'temple_reverb',
  bamboo_pagoda: 'temple_reverb',
  // Caves & enclosed dungeons
  cave_den: 'cave_slapback',
  royal_dungeon: 'cave_slapback',
  // Grand marble halls & courts
  royal_durbar: 'palace_hall',
  mughal_courtyard: 'palace_hall',
  golden_lanka: 'palace_hall',
  throne_mound: 'palace_hall',
  cloud_skies: 'palace_hall',
  // Canyons, river ghats, forests & water reflections
  red_canyon_mesa: 'canyon_echo',
  river_ghat: 'canyon_echo',
  enchanted_lake: 'canyon_echo',
  ocean_ship: 'canyon_echo',
  bamboo_forest: 'canyon_echo',
  // Cozy & stone/wood interiors
  royal_bedchamber: 'wood_interior',
  enchanted_cottage: 'wood_interior',
  courtyard_well: 'wood_interior',
  bazaar_lane: 'wood_interior',
  // Dry outdoor stages
  banyan_clearing: 'dry_outdoor',
  moonlit_terrace: 'dry_outdoor',
  palace_garden: 'dry_outdoor',
  kurukshetra_field: 'dry_outdoor',
  village_chowk: 'dry_outdoor',
  cremation_ground: 'dry_outdoor',
  desert_caravan: 'dry_outdoor',
  ashoka_vatika: 'dry_outdoor',
  savanna_baobab: 'dry_outdoor',
  tropical_archipelago: 'dry_outdoor',
};

export function getStageRoomAcoustics(stage: StageId | string): StageRoomAcoustics {
  const profileId = STAGE_ACOUSTIC_MAP[stage as StageId] || 'dry_outdoor';
  return ROOM_PROFILES[profileId];
}

/**
 * Deterministic stereo pan resolver for voices, SFX, and sub-beat action cues.
 * Returns -0.28 for left actor, 0 for center/narrator/overhead, +0.28 for right actor,
 * with subtle actor offsetX nudge clamped safely inside [-0.36, +0.36].
 */
export function computeSpatialPanForBeat(
  beat: StoryBeat,
  source: 'voice' | 'sfx' | 'action_cue',
  castId?: string
): number {
  const clampPan = (v: number) => Number(Math.max(-0.36, Math.min(0.36, v)).toFixed(3));
  const slotPan = (slot?: string): number => {
    if (slot === 'left') return -0.28;
    if (slot === 'right') return 0.28;
    return 0;
  };

  if (source === 'voice') {
    const targetId = castId || beat.speakerId;
    if (!targetId || targetId === 'narrator') return 0;
    const actor = beat.actors.find((a) => a.castId === targetId);
    if (!actor) return 0;
    const base = slotPan(actor.slot);
    const nudge = typeof actor.offsetX === 'number' && Number.isFinite(actor.offsetX) ? actor.offsetX * 0.22 : 0;
    return clampPan(base + nudge);
  }

  if (source === 'action_cue') {
    if (castId) {
      const actor = beat.actors.find((a) => a.castId === castId);
      if (actor) {
        const nudge = typeof actor.offsetX === 'number' && Number.isFinite(actor.offsetX) ? actor.offsetX * 0.22 : 0;
        return clampPan(slotPan(actor.slot) + nudge);
      }
    }
    return 0;
  }

  // SFX: prefer explicit propSlot if off-center, otherwise bias gently toward speaker
  if (beat.prop && beat.prop !== 'none' && (beat.propSlot === 'left' || beat.propSlot === 'right')) {
    const pNudge =
      typeof beat.propOffsetX === 'number' && Number.isFinite(beat.propOffsetX)
        ? beat.propOffsetX * 0.2
        : 0;
    return clampPan(slotPan(beat.propSlot) + pNudge);
  }

  if (beat.speakerId && beat.speakerId !== 'narrator') {
    const actor = beat.actors.find((a) => a.castId === beat.speakerId);
    if (actor) return clampPan(slotPan(actor.slot) * 0.65);
  }
  return 0;
}

function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createLcg(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Pure PCM generator for deterministic stereo room impulse responses.
 * Separated from AudioBuffer creation so unit tests can assert bit-exact determinism in Node.
 */
export function generateDeterministicImpulsePcm(
  stage: StageId | string,
  sampleRate: number
): { left: Float32Array; right: Float32Array; acoustics: StageRoomAcoustics } {
  const acoustics = getStageRoomAcoustics(stage);
  const fs = Math.max(8000, Math.round(sampleRate || 44100));
  const length = Math.max(512, Math.min(fs * 2.5, Math.round(fs * Math.max(0.25, acoustics.rt60Sec))));
  const left = new Float32Array(length);
  const right = new Float32Array(length);

  const randL = createLcg(hashSeed(`${acoustics.profileId}_L_${stage}`));
  const randR = createLcg(hashSeed(`${acoustics.profileId}_R_${stage}`));

  const preDelaySamples = Math.min(length - 1, Math.round((acoustics.preDelayMs / 1000) * fs));
  // One-pole low-pass coefficient from dampingHz
  const rc = 1 / (2 * Math.PI * Math.max(500, acoustics.dampingHz));
  const dt = 1 / fs;
  const alpha = dt / (rc + dt);

  // Decay rate so amplitude reaches -60dB (0.001) at rt60Sec
  const decayRate = Math.log(1000) / Math.max(0.15, acoustics.rt60Sec);

  let lpL = 0;
  let lpR = 0;

  // Diffuse tail
  for (let i = preDelaySamples; i < length; i++) {
    const t = (i - preDelaySamples) / fs;
    const env = Math.exp(-decayRate * t);
    const nL = (randL() * 2 - 1) * env;
    const nR = (randR() * 2 - 1) * env;
    lpL += alpha * (nL - lpL);
    lpR += alpha * (nR - lpR);
    left[i] = lpL * 0.42;
    right[i] = lpR * 0.42;
  }

  // Deterministic early reflection taps (stereo-staggered for natural stage width)
  const tapsMs = [11, 19, 29, 43, 61];
  for (let k = 0; k < tapsMs.length; k++) {
    const tapIdxL = Math.round(((acoustics.preDelayMs + tapsMs[k]) / 1000) * fs);
    const tapIdxR = Math.round(((acoustics.preDelayMs + tapsMs[k] + 3.5) / 1000) * fs);
    const amp = 0.24 / (k + 1.2);
    const sign = k % 2 === 0 ? 1 : -1;
    if (tapIdxL < length) left[tapIdxL] += sign * amp;
    if (tapIdxR < length) right[tapIdxR] -= sign * amp * 0.92;
  }

  // Optional cavern / canyon slapback echo tap
  if (acoustics.slapbackMs && acoustics.slapbackGain) {
    const slapIdxL = Math.round((acoustics.slapbackMs / 1000) * fs);
    const slapIdxR = Math.round(((acoustics.slapbackMs + 9) / 1000) * fs);
    const g = acoustics.slapbackGain;
    for (let j = 0; j < 18; j++) {
      const w = Math.exp(-j / 5) * g * 0.38;
      if (slapIdxL + j < length) left[slapIdxL + j] += w;
      if (slapIdxR + j < length) right[slapIdxR + j] += w * 0.92;
    }
  }

  // Normalize IR peak so convolver wet gain is predictable across all stages
  let peak = 0;
  for (let i = 0; i < length; i++) {
    const aL = Math.abs(left[i]);
    const aR = Math.abs(right[i]);
    if (aL > peak) peak = aL;
    if (aR > peak) peak = aR;
  }
  if (peak > 1e-5) {
    const norm = 0.72 / peak;
    for (let i = 0; i < length; i++) {
      left[i] *= norm;
      right[i] *= norm;
    }
  }

  return { left, right, acoustics };
}

const impulseCache = new WeakMap<BaseAudioContext, Map<string, AudioBuffer>>();

/**
 * Returns a cached deterministic stereo room impulse AudioBuffer for `(ctx, stage)`.
 */
export function getOrCreateRoomImpulseBuffer(
  ctx: BaseAudioContext,
  stage: StageId | string
): { buffer: AudioBuffer; acoustics: StageRoomAcoustics } {
  const acoustics = getStageRoomAcoustics(stage);
  const key = acoustics.profileId;
  let byCtx = impulseCache.get(ctx);
  if (!byCtx) {
    byCtx = new Map();
    impulseCache.set(ctx, byCtx);
  }
  const cached = byCtx.get(key);
  if (cached) return { buffer: cached, acoustics };

  const { left, right } = generateDeterministicImpulsePcm(stage, ctx.sampleRate);
  const buf = ctx.createBuffer(2, left.length, ctx.sampleRate);
  buf.getChannelData(0).set(left);
  buf.getChannelData(1).set(right);
  byCtx.set(key, buf);
  return { buffer: buf, acoustics };
}

export interface SpatialRouteNodes {
  input: AudioNode;
  panner: StereoPannerNode | null;
  wetGain: GainNode | null;
}

/**
 * Creates a lightweight deterministic stereo pan + optional stage room reverb send
 * feeding `destination`. Safe fallback to direct connection when disabled or when
 * `StereoPannerNode`/`ConvolverNode` is unavailable.
 */
export function createSpatialRoute(
  ctx: BaseAudioContext,
  destination: AudioNode,
  pan: number,
  stage: StageId | string,
  enabled: boolean,
  wetScale = 1.0
): SpatialRouteNodes {
  if (!enabled) {
    return { input: destination, panner: null, wetGain: null };
  }

  const input = ctx.createGain();
  input.gain.value = 1.0;

  let panner: StereoPannerNode | null = null;
  if (typeof ctx.createStereoPanner === 'function') {
    panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    input.connect(panner);
    panner.connect(destination);
  } else {
    input.connect(destination);
  }

  let wetGain: GainNode | null = null;
  if (typeof ctx.createConvolver === 'function' && wetScale > 0) {
    const { buffer, acoustics } = getOrCreateRoomImpulseBuffer(ctx, stage);
    const wetLevel = Math.max(0, Math.min(0.32, acoustics.wetMix * wetScale));
    if (wetLevel > 0.005) {
      const convolver = ctx.createConvolver();
      convolver.normalize = false;
      convolver.buffer = buffer;
      wetGain = ctx.createGain();
      wetGain.gain.value = wetLevel;
      input.connect(convolver);
      convolver.connect(wetGain);
      wetGain.connect(destination);
    }
  }

  return { input, panner, wetGain };
}
