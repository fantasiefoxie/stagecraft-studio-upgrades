import {
  AmbienceId,
  EpisodeScript,
  RaagId,
  RenderStyleId,
  SfxId,
  StoryBeat,
  resolveBeatActionSfxEvents,
} from './types';
import { getVoiceSpeechProfile, SpeechWindow } from './voiceEnvelope';
import { computeSpatialPanForBeat, createSpatialRoute } from './spatialAudio';
import { planBeatFoleyEvents, scheduleFoleyEventOnContext } from './proceduralFoley';
import {
  BeatMusicArcPlan,
  computeBoundaryCrossfadeGain,
  computeEpisodeMusicArc,
  computeLiveBeatTensionFallback,
} from './musicTension';

const RAAG_SCALES: Record<RaagId, number[]> = {
  // Indian Classical Raags
  bhairavi: [0, 1, 3, 5, 7, 8, 10, 12, 13, 15],
  yaman: [0, 2, 4, 6, 7, 9, 11, 12, 14, 16],
  marwa: [0, 1, 4, 6, 9, 11, 12, 13, 16, 18],
  darbari: [0, 2, 3, 5, 7, 8, 10, 12, 14, 15],
  bhoopali: [0, 2, 4, 7, 9, 12, 14, 16, 19, 21],
  malkauns: [0, 3, 5, 8, 10, 12, 15, 17, 20, 22],
  desh: [0, 2, 5, 7, 11, 12, 10, 9, 7, 4],

  // 6 Region-Authentic World Folklore Scales
  greek_lyre: [0, 2, 3, 5, 7, 8, 10, 12, 14, 15],
  medieval_lute: [0, 2, 3, 5, 7, 9, 10, 12, 14, 15],
  guqin_bamboo: [0, 2, 5, 7, 9, 12, 14, 17, 19, 21],
  gamelan_wayang: [0, 1, 3, 7, 8, 12, 13, 15, 19, 20],
  cedar_flute: [0, 3, 5, 7, 10, 12, 15, 17, 19, 22],
  kora_griot: [0, 2, 4, 7, 9, 10, 12, 14, 16, 19],
};

function isIndianRaag(raag: RaagId): boolean {
  return (
    raag === 'bhairavi' ||
    raag === 'yaman' ||
    raag === 'marwa' ||
    raag === 'darbari' ||
    raag === 'bhoopali' ||
    raag === 'malkauns' ||
    raag === 'desh'
  );
}

export function resolveBeatAmbience(beat: StoryBeat): Exclude<AmbienceId, 'auto'> {
  if (beat.ambience && beat.ambience !== 'auto') {
    return beat.ambience;
  }
  if (beat.weather === 'rain') return 'monsoon_rain';
  if (beat.weather === 'embers') return 'hearth_fire';
  if (
    beat.stage === 'royal_durbar' ||
    beat.stage === 'mughal_courtyard' ||
    beat.stage === 'royal_bedchamber' ||
    beat.stage === 'golden_lanka' ||
    beat.stage === 'bamboo_pagoda' ||
    beat.stage === 'royal_dungeon'
  ) {
    return 'royal_hall';
  }
  if (
    beat.stage === 'river_ghat' ||
    beat.stage === 'enchanted_lake' ||
    beat.stage === 'ocean_ship' ||
    beat.stage === 'tropical_archipelago' ||
    beat.stage === 'courtyard_well'
  ) {
    return 'river_stream';
  }
  if (
    beat.stage === 'village_chowk' ||
    beat.stage === 'enchanted_cottage' ||
    beat.stage === 'kurukshetra_field' ||
    beat.stage === 'cremation_ground' ||
    beat.stage === 'bazaar_lane'
  ) {
    return 'hearth_fire';
  }
  if (
    beat.stage === 'himalayan_hermitage' ||
    beat.stage === 'olympus_acropolis' ||
    beat.stage === 'kali_temple' ||
    beat.stage === 'cloud_skies' ||
    beat.stage === 'throne_mound' ||
    beat.stage === 'desert_caravan' ||
    beat.stage === 'red_canyon_mesa'
  ) {
    return 'temple_wind';
  }
  return 'night_forest';
}

interface AmbienceFilterSpec {
  type: BiquadFilterType;
  freq: number;
  q: number;
  gain: number;
}

function getAmbienceSpec(id: Exclude<AmbienceId, 'auto'>): AmbienceFilterSpec {
  switch (id) {
    case 'monsoon_rain':
      return { type: 'bandpass', freq: 1450, q: 0.55, gain: 0.085 };
    case 'river_stream':
      return { type: 'bandpass', freq: 820, q: 1.15, gain: 0.068 };
    case 'hearth_fire':
      return { type: 'lowpass', freq: 420, q: 0.85, gain: 0.075 };
    case 'temple_wind':
      return { type: 'bandpass', freq: 560, q: 2.8, gain: 0.062 };
    case 'royal_hall':
      return { type: 'lowpass', freq: 260, q: 0.7, gain: 0.032 };
    case 'night_forest':
      return { type: 'bandpass', freq: 2150, q: 2.4, gain: 0.036 };
    case 'none':
    default:
      return { type: 'lowpass', freq: 400, q: 1, gain: 0 };
  }
}

function createDeterministicNoiseBuffer(
  ctx: BaseAudioContext,
  durationSec: number,
  seedInit = 1337
): AudioBuffer {
  const len = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let seed = seedInit >>> 0;
  for (let i = 0; i < len; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    data[i] = (seed / 0xffffffff) * 2 - 1;
  }
  return buf;
}

function calcRaagFreq(baseFreq: number, raag: RaagId, deg: number, oct = 0): number {
  const scale = RAAG_SCALES[raag] || RAAG_SCALES.bhairavi;
  const idx = ((deg % scale.length) + scale.length) % scale.length;
  return baseFreq * Math.pow(2, (scale[idx] + oct * 12) / 12);
}

/**
 * Shared procedural SFX scheduler working identically for both live AudioContext
 * and deterministic OfflineAudioContext fast renders.
 */
function scheduleSfxOnContext(
  ctx: BaseAudioContext,
  dest: AudioNode,
  sfx: SfxId | undefined,
  atTime: number
): void {
  if (!sfx || sfx === 'none') return;
  const now = Math.max(0, atTime);

  if (sfx === 'temple_bell') {
    const partials = [
      { f: 523.25, v: 0.24, d: 1.9 },
      { f: 1049.0, v: 0.14, d: 1.5 },
      { f: 1582.0, v: 0.1, d: 1.1 },
      { f: 2218.0, v: 0.06, d: 0.7 },
    ];
    for (const p of partials) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.f, now);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(p.v, now + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0006, now + p.d);
      osc.connect(g);
      g.connect(dest);
      osc.start(now);
      osc.stop(now + p.d + 0.05);
    }
  } else if (sfx === 'shankha_conch') {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(248, now);
    osc1.frequency.exponentialRampToValueAtTime(294, now + 0.35);
    osc1.frequency.setValueAtTime(294, now + 1.35);
    osc1.frequency.exponentialRampToValueAtTime(272, now + 1.85);
    osc2.frequency.setValueAtTime(496, now);
    osc2.frequency.exponentialRampToValueAtTime(588, now + 0.35);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(620, now);
    bp.Q.value = 3.2;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.28, now + 0.3);
    g.gain.setValueAtTime(0.25, now + 1.25);
    g.gain.exponentialRampToValueAtTime(0.0008, now + 1.9);

    osc1.connect(bp);
    osc2.connect(bp);
    bp.connect(g);
    g.connect(dest);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.95);
    osc2.stop(now + 1.95);
  } else if (sfx === 'sword_clash') {
    const nb = createDeterministicNoiseBuffer(ctx, 0.45, 421);
    const src = ctx.createBufferSource();
    src.buffer = nb;
    const hp = ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.setValueAtTime(3400, now);
    hp.frequency.exponentialRampToValueAtTime(6200, now + 0.14);
    hp.Q.value = 4.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.28, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    src.connect(hp);
    hp.connect(g);
    g.connect(dest);
    src.start(now);

    for (const f of [2680, 4120]) {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.14, now);
      og.gain.exponentialRampToValueAtTime(0.0008, now + 0.55);
      osc.connect(og);
      og.connect(dest);
      osc.start(now);
      osc.stop(now + 0.58);
    }
  } else if (sfx === 'thunder_crack') {
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(98, now);
    sub.frequency.exponentialRampToValueAtTime(32, now + 1.1);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.36, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
    sub.connect(sg);
    sg.connect(dest);
    sub.start(now);
    sub.stop(now + 1.3);

    const nb = createDeterministicNoiseBuffer(ctx, 1.5, 907);
    const src = ctx.createBufferSource();
    src.buffer = nb;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1400, now);
    lp.frequency.exponentialRampToValueAtTime(160, now + 1.35);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.32, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.45);
    src.connect(lp);
    lp.connect(g);
    g.connect(dest);
    src.start(now);
  } else if (sfx === 'arrow_whoosh') {
    const nb = createDeterministicNoiseBuffer(ctx, 0.42, 311);
    const src = ctx.createBufferSource();
    src.buffer = nb;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(420, now);
    bp.frequency.exponentialRampToValueAtTime(2800, now + 0.16);
    bp.frequency.exponentialRampToValueAtTime(520, now + 0.38);
    bp.Q.value = 2.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.3, now + 0.14);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    src.connect(bp);
    bp.connect(g);
    g.connect(dest);
    src.start(now);
  } else if (sfx === 'mystic_chime') {
    const notes = [587.33, 739.99, 880, 1174.66, 1479.98];
    notes.forEach((f, i) => {
      const t0 = now + i * 0.075;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t0);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.14, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.72);
      osc.connect(g);
      g.connect(dest);
      osc.start(t0);
      osc.stop(t0 + 0.76);
    });
  } else if (sfx === 'court_gasp') {
    const drum = ctx.createOscillator();
    drum.type = 'sine';
    drum.frequency.setValueAtTime(135, now);
    drum.frequency.exponentialRampToValueAtTime(44, now + 0.45);
    const dg = ctx.createGain();
    dg.gain.setValueAtTime(0.36, now);
    dg.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    drum.connect(dg);
    dg.connect(dest);
    drum.start(now);
    drum.stop(now + 0.52);

    const nb = createDeterministicNoiseBuffer(ctx, 0.5, 619);
    const src = ctx.createBufferSource();
    src.buffer = nb;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(980, now);
    bp.Q.value = 1.6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.16, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    src.connect(bp);
    bp.connect(g);
    g.connect(dest);
    src.start(now);
  } else if (sfx === 'wooden_gavel') {
    for (const delay of [0, 0.22]) {
      const t0 = now + delay;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, t0);
      osc.frequency.exponentialRampToValueAtTime(115, t0 + 0.09);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.34, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.14);
      osc.connect(g);
      g.connect(dest);
      osc.start(t0);
      osc.stop(t0 + 0.16);
    }
  } else if (sfx === 'fire_crackle') {
    const nb = createDeterministicNoiseBuffer(ctx, 0.9, 773);
    const src = ctx.createBufferSource();
    src.buffer = nb;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1150, now);
    bp.Q.value = 1.1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.22, now + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.88);
    src.connect(bp);
    bp.connect(g);
    g.connect(dest);
    src.start(now);
  }
}

/**
 * Shared 13-engine regional instrument note scheduler for both live & offline audio mixdown.
 */
function scheduleRegionalStepOnContext(
  ctx: BaseAudioContext,
  dest: AudioNode,
  baseFreq: number,
  raag: RaagId,
  step: number,
  energy: number,
  atTime: number,
  gainScale = 1,
  tensionMod?: { octaveLift?: number; percussionEmphasis?: number }
): void {
  if (gainScale <= 0.01) return;
  const now = Math.max(0, atTime);
  const eVol = (0.14 * energy + 0.06) * gainScale;
  const octLift = tensionMod?.octaveLift ? 1 : 0;
  const percScale =
    typeof tensionMod?.percussionEmphasis === 'number' && Number.isFinite(tensionMod.percussionEmphasis)
      ? Math.max(0.5, Math.min(1.5, tensionMod.percussionEmphasis))
      : 1;

  const pluck = (r: RaagId, deg: number, oct = 0, vol = 0.2, dur = 0.52) => {
    const f = calcRaagFreq(baseFreq, r, deg, oct + octLift);
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f, now);
    const flt = ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(f * 5.2, now);
    flt.frequency.exponentialRampToValueAtTime(Math.max(220, f * 1.25), now + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(vol * gainScale, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, now + dur);
    osc.connect(flt);
    flt.connect(g);
    g.connect(dest);
    osc.start(now);
    osc.stop(now + dur + 0.04);
  };

  const flute = (r: RaagId, deg: number, oct = 0, vol = 0.13, dur = 0.78, bendFrom = 0.96) => {
    const f = calcRaagFreq(baseFreq, r, deg, oct);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f * bendFrom, now);
    osc.frequency.exponentialRampToValueAtTime(f, now + 0.095);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(vol * gainScale, now + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0008, now + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(now);
    osc.stop(now + dur + 0.04);
  };

  const worldString = (
    r: RaagId,
    deg: number,
    oct = 0,
    vol = 0.18,
    dur = 0.65,
    brightness = 4.2,
    glideRatio = 1.0
  ) => {
    const f = calcRaagFreq(baseFreq, r, deg, oct);
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(f * glideRatio, now);
    osc2.frequency.setValueAtTime(f * 2 * glideRatio, now);
    if (glideRatio !== 1.0) {
      osc1.frequency.exponentialRampToValueAtTime(f, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(f * 2, now + 0.12);
    }
    const flt = ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(f * brightness, now);
    flt.frequency.exponentialRampToValueAtTime(Math.max(260, f * 1.15), now + dur);
    const g1 = ctx.createGain();
    const g2 = ctx.createGain();
    g1.gain.value = 0.85;
    g2.gain.value = 0.16;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(vol, now + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0008, now + dur);
    osc1.connect(g1);
    osc2.connect(g2);
    g1.connect(flt);
    g2.connect(flt);
    flt.connect(env);
    env.connect(dest);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + dur + 0.05);
    osc2.stop(now + dur + 0.05);
  };

  const gamelanStrike = (r: RaagId, deg: number, oct = 0, vol = 0.16, dur = 1.15) => {
    const f = calcRaagFreq(baseFreq, r, deg, oct);
    const detunes = [f, f * 1.007, f * 2.74];
    const weights = [0.55, 0.45, 0.16];
    detunes.forEach((freqVal, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqVal, now);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(vol * weights[i], now + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0006, now + (i === 2 ? dur * 0.45 : dur));
      osc.connect(g);
      g.connect(dest);
      osc.start(now);
      osc.stop(now + dur + 0.06);
    });
  };

  const handDrum = (
    startFreq: number,
    endFreq: number,
    vol = 0.2,
    dur = 0.24,
    glideBackUp = false
  ) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + dur * 0.55);
    if (glideBackUp) {
      osc.frequency.exponentialRampToValueAtTime(startFreq * 1.25, now + dur * 0.92);
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(vol * gainScale * percScale, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0008, now + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(now);
    osc.stop(now + dur + 0.04);
  };

  const breathyFlute = (r: RaagId, deg: number, oct = 0, vol = 0.14, dur = 0.95) => {
    const f = calcRaagFreq(baseFreq, r, deg, oct);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f * 0.94, now);
    osc.frequency.exponentialRampToValueAtTime(f, now + 0.14);
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 5.2;
    lfoGain.gain.value = f * 0.009;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(vol * gainScale, now + 0.14);
    g.gain.exponentialRampToValueAtTime(0.0008, now + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(now);
    lfo.start(now);
    osc.stop(now + dur + 0.05);
    lfo.stop(now + dur + 0.05);
  };

  if (raag === 'greek_lyre') {
    const lyreMotif = [0, 2, 4, 7, 4, 2, 5, 4, 3, 2, 0, 4, 6, 4, 2, 0];
    const deg = lyreMotif[step % lyreMotif.length];
    worldString('greek_lyre', deg, step % 8 === 0 ? -1 : 0, eVol, 0.72, 4.8);
    if (step % 4 === 0) {
      worldString('greek_lyre', (deg + 4) % 8, 0, eVol * 0.65, 0.85, 3.6);
      handDrum(155, 76, 0.16 * energy + 0.06, 0.22);
    } else if (step % 4 === 2) {
      handDrum(220, 128, 0.09 * energy + 0.03, 0.14);
    }
    return;
  }

  if (raag === 'medieval_lute') {
    const luteMotif = [0, 4, 2, 5, 4, 3, 2, 0, 0, 5, 4, 6, 5, 4, 2, 1];
    const deg = luteMotif[step % luteMotif.length];
    if (step % 2 === 0 || energy > 0.75) {
      worldString('medieval_lute', deg, 0, eVol * 0.95, 0.68, 3.5);
    }
    if (step % 8 === 0) {
      worldString('medieval_lute', 0, -1, eVol * 0.85, 1.2, 2.4);
    }
    if (step % 4 === 2) {
      const recNotes = [4, 5, 7, 5, 3, 4, 2, 0];
      flute('medieval_lute', recNotes[Math.floor(step / 4) % recNotes.length], 1, 0.09 * energy + 0.03, 0.72, 0.99);
    }
    return;
  }

  if (raag === 'guqin_bamboo') {
    const qinMotif = [0, 3, 2, 4, 5, 4, 2, 0, 3, 5, 6, 4, 3, 2, 0, 1];
    const deg = qinMotif[step % qinMotif.length];
    if (step % 2 === 0) {
      worldString('guqin_bamboo', deg, step % 6 === 0 ? -1 : 0, eVol, 0.95, 3.2, step % 4 === 0 ? 0.93 : 1.0);
    }
    if (step % 6 === 0) {
      const fluteNotes = [4, 5, 7, 5, 3, 2, 4, 0];
      breathyFlute('guqin_bamboo', fluteNotes[Math.floor(step / 6) % fluteNotes.length], 0, 0.12 * energy + 0.05, 1.15);
    }
    if (step % 8 === 4 && energy > 0.6) {
      handDrum(620, 410, 0.08 * energy, 0.08);
    }
    return;
  }

  if (raag === 'gamelan_wayang') {
    const saronMotif = [0, 2, 3, 4, 3, 2, 1, 0, 2, 4, 5, 4, 3, 1, 2, 0];
    const deg = saronMotif[step % saronMotif.length];
    gamelanStrike('gamelan_wayang', deg, step % 2 === 0 ? 0 : 1, eVol * 0.92, 0.95);
    if (step % 8 === 0) {
      gamelanStrike('gamelan_wayang', 0, -2, (0.24 * energy + 0.08) * gainScale, 2.2);
    }
    if (step % 4 === 2) {
      handDrum(195, 110, 0.12 * energy + 0.04, 0.16);
    }
    return;
  }

  if (raag === 'cedar_flute') {
    if (step % 4 === 0) {
      handDrum(118, 56, 0.22 * energy + 0.08, 0.34);
    } else if (step % 4 === 1) {
      handDrum(105, 52, 0.12 * energy + 0.04, 0.22);
    }
    if (step % 4 === 0 || step % 6 === 3) {
      const cedarMotif = [4, 3, 2, 0, 2, 3, 5, 4, 3, 1, 0];
      breathyFlute('cedar_flute', cedarMotif[Math.floor(step / 2) % cedarMotif.length], 0, 0.14 * energy + 0.05, 1.05);
    }
    return;
  }

  if (raag === 'kora_griot') {
    const koraMotif = [0, 2, 4, 6, 4, 2, 3, 5, 7, 5, 4, 2, 1, 3, 4, 2];
    const deg = koraMotif[step % koraMotif.length];
    worldString('kora_griot', deg, step % 4 === 0 ? -1 : 0, eVol * 0.92, 0.54, 5.4);
    if (step % 3 === 0) {
      worldString('kora_griot', (deg + 3) % 9, 1, eVol * 0.55, 0.42, 6.0);
    }
    if (step % 4 === 0) {
      handDrum(165, 92, 0.18 * energy + 0.06, 0.28, true);
    } else if (step % 4 === 2) {
      handDrum(240, 130, 0.11 * energy + 0.04, 0.16, false);
    }
    return;
  }

  // Classical Indian Raag
  const motif = [0, 4, 2, 3, 5, 4, 2, 1, 0, 4, 6, 5, 4, 2, 1, 0];
  const deg = motif[step % motif.length];
  if (step % 2 === 0 || energy > 0.78) {
    pluck(raag, deg, energy > 0.85 ? 1 : 0, 0.16 * energy + 0.06, 0.5);
  }
  if (step % 4 === 0) {
    const fluteNotes = [4, 5, 7, 5, 3, 2, 4, 0, 5, 6, 7];
    flute(
      raag,
      fluteNotes[Math.floor(step / 4) % fluteNotes.length],
      raag === 'bhoopali' ? 1 : 0,
      0.11 * energy + 0.04,
      0.76
    );
  }
}

export interface VoiceClipEntry {
  beatId: string;
  fileName: string;
  buffer: AudioBuffer | null;
  duration: number;
  blob?: Blob;
}

export interface MusicStemMeta {
  fileName: string;
  duration: number;
}

export interface OfflineAudioMixOptions {
  sampleRate?: number;
  musicLevel?: number;
  autoDuck?: boolean;
  musicStemBuffer?: AudioBuffer | null;
  spatialAudio?: boolean;
}

/**
 * Deterministic OfflineAudioContext full-episode soundtrack + ambient bed + mid-beat SFX
/**
 * Shared Broadcast Vocal Bus Chain (identical in Live Preview & Offline WAV/WebCodecs/Headless renders):
 * 80 Hz High-Pass rumble filter -> +2.4 dB @ 3 kHz vocal presence peaking EQ -> 3:1 gentle vocal compressor.
 */
function buildBroadcastVocalChain(
  ctx: BaseAudioContext,
  destination: AudioNode
): AudioNode {
  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = 80;
  hpf.Q.value = 0.707;

  const presence = ctx.createBiquadFilter();
  presence.type = 'peaking';
  presence.frequency.value = 3000;
  presence.Q.value = 1.1;
  presence.gain.value = 2.4;

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 12;
  comp.ratio.value = 3;
  comp.attack.value = 0.008;
  comp.release.value = 0.14;

  hpf.connect(presence);
  presence.connect(comp);
  comp.connect(destination);
  return hpf;
}

export interface SpeechDuckWindowResult {
  duckStart: number;
  duckEnd: number;
  hasSpeech: boolean;
}

/**
 * Pure deterministic speech-window sidechain ducking envelope calculator.
 * Ducks music 80ms before speech starts and swells music back 120ms after speech ends,
 * clamped safely inside `[beatStart, beatEnd]`.
 */
export function computeSpeechDuckWindows(
  beatStart: number,
  beatEnd: number,
  speechWindow: SpeechWindow | null | undefined,
  fallbackDur: number
): SpeechDuckWindowResult {
  const safeStart = Math.max(0, Number.isFinite(beatStart) ? beatStart : 0);
  const safeEnd = Math.max(safeStart, Number.isFinite(beatEnd) ? beatEnd : safeStart);
  if (safeEnd <= safeStart + 0.05) {
    return { duckStart: safeStart, duckEnd: safeEnd, hasSpeech: false };
  }

  if (
    speechWindow &&
    Number.isFinite(speechWindow.startSec) &&
    Number.isFinite(speechWindow.endSec) &&
    speechWindow.endSec > speechWindow.startSec + 0.05
  ) {
    const duckStart = Math.max(safeStart, Math.min(safeEnd, safeStart + speechWindow.startSec - 0.08));
    const duckEnd = Math.max(duckStart, Math.min(safeEnd, safeStart + speechWindow.endSec + 0.12));
    return {
      duckStart: Number(duckStart.toFixed(3)),
      duckEnd: Number(duckEnd.toFixed(3)),
      hasSpeech: duckEnd > duckStart + 0.05,
    };
  }

  const fb = Math.max(0, Number.isFinite(fallbackDur) ? fallbackDur : 0);
  if (fb <= 0.05) {
    return { duckStart: safeStart, duckEnd: safeStart, hasSpeech: false };
  }
  const duckEnd = Math.min(safeEnd, safeStart + fb);
  return {
    duckStart: Number(safeStart.toFixed(3)),
    duckEnd: Number(duckEnd.toFixed(3)),
    hasSpeech: duckEnd > safeStart + 0.05,
  };
}

/**
 * + voiceover auto-ducking mixdown renderer! Powers both Fast WebCodecs Export AND Lossless .WAV Master!
 */
export async function renderEpisodeAudioOffline(
  episode: EpisodeScript,
  voiceClips: Map<string, VoiceClipEntry>,
  options: OfflineAudioMixOptions = {}
): Promise<AudioBuffer> {
  const sampleRate = options.sampleRate ?? 48000;
  const musicLevel = options.musicLevel ?? 0.62;
  const autoDuck = options.autoDuck ?? true;
  const musicStem = options.musicStemBuffer ?? null;
  const spatialAudio =
    options.spatialAudio ?? episode.visualStyle?.spatialAudio ?? true;

  const totalDur = Math.max(
    1,
    episode.beats.reduce((sum, b) => sum + Math.max(1.2, b.duration || 4), 0)
  );
  const totalSamples = Math.ceil((totalDur + 0.25) * sampleRate);
  const OfflineAC =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;
  const ctx = new OfflineAC(2, totalSamples, sampleRate);

  // Master limiter + output gain
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -10;
  limiter.knee.value = 12;
  limiter.ratio.value = 8;
  limiter.attack.value = 0.004;
  limiter.release.value = 0.14;

  const master = ctx.createGain();
  master.gain.value = 0.84;
  limiter.connect(master);
  master.connect(ctx.destination);

  const musicBus = ctx.createGain();
  musicBus.gain.setValueAtTime(musicLevel, 0);
  musicBus.connect(limiter);

  const ambienceBus = ctx.createGain();
  ambienceBus.gain.setValueAtTime(1.0, 0);
  ambienceBus.connect(limiter);

  const sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.88;
  sfxBus.connect(limiter);

  const voiceBus = ctx.createGain();
  voiceBus.gain.value = 1.08;
  const offlineVocalIn = buildBroadcastVocalChain(ctx, limiter);
  voiceBus.connect(offlineVocalIn);

  // 1. Optional Custom Acoustic Music Stem (loops seamlessly through musicBus so it auto-ducks!)
  if (musicStem && musicStem.duration > 0.2) {
    const stemSrc = ctx.createBufferSource();
    stemSrc.buffer = musicStem;
    stemSrc.loop = true;
    const stemGain = ctx.createGain();
    stemGain.gain.value = 0.92;
    stemSrc.connect(stemGain);
    stemGain.connect(musicBus);
    stemSrc.start(0);
    stemSrc.stop(totalDur + 0.15);
  }

  // 2. Tanpura Drone (only active on Indian Raags & when no acoustic stem replaces synth)
  const droneGain = ctx.createGain();
  droneGain.gain.setValueAtTime(0, 0);
  const droneLp = ctx.createBiquadFilter();
  droneLp.type = 'lowpass';
  droneLp.frequency.value = 390;
  droneGain.connect(droneLp);
  droneLp.connect(musicBus);
  for (const f of [73.42, 110.0, 146.83]) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f, 0);
    osc.connect(droneGain);
    osc.start(0);
    osc.stop(totalDur + 0.1);
  }

  // 3. Continuous Looping Ambient Soundscape Noise Bed
  const ambNoise = createDeterministicNoiseBuffer(ctx, 3.0, 2027);
  const ambSrc = ctx.createBufferSource();
  ambSrc.buffer = ambNoise;
  ambSrc.loop = true;
  const ambFilter = ctx.createBiquadFilter();
  ambFilter.type = 'bandpass';
  ambFilter.frequency.setValueAtTime(1200, 0);
  ambFilter.Q.setValueAtTime(1.2, 0);
  const ambGain = ctx.createGain();
  ambGain.gain.setValueAtTime(0.0001, 0);
  ambSrc.connect(ambFilter);
  ambFilter.connect(ambGain);
  ambGain.connect(ambienceBus);
  ambSrc.start(0);
  ambSrc.stop(totalDur + 0.15);

  const baseFreq = 293.6648;
  const synthGainScale = musicStem ? 0.14 : 1.0;

  const episodeArc = computeEpisodeMusicArc(episode);
  let cursor = 0;
  let lastStep = -1;

  for (let beatIdx = 0; beatIdx < episode.beats.length; beatIdx++) {
    const beat = episode.beats[beatIdx];
    const arcPlan = episodeArc.beats[beatIdx];
    const nextArcPlan = beatIdx + 1 < episodeArc.beats.length ? episodeArc.beats[beatIdx + 1] : null;
    const dur = Math.max(1.2, beat.duration || 4);
    const beatStart = cursor;
    const beatEnd = cursor + dur;

    // Schedule Tanpura drone crossfade
    const wantDrone = !musicStem && isIndianRaag(beat.raag) ? 0.055 : 0;
    droneGain.gain.setTargetAtTime(wantDrone, beatStart, 0.14);

    // Schedule Ambient Soundscape filter + gain
    const ambId = resolveBeatAmbience(beat);
    const ambSpec = getAmbienceSpec(ambId);
    ambFilter.frequency.setTargetAtTime(ambSpec.freq, beatStart, 0.18);
    ambFilter.Q.setTargetAtTime(ambSpec.q, beatStart, 0.18);
    ambGain.gain.setTargetAtTime(Math.max(0.0001, ambSpec.gain), beatStart, 0.22);

    // Schedule Voiceover Clip + Sidechain Ducking Envelope (supports J-Cut pre-roll & L-Cut delay!)
    const clip = voiceClips.get(beat.id);
    let clipBuffer = clip?.buffer ?? null;
    if (clip && !clipBuffer && clip.blob) {
      try {
        const ab = await clip.blob.arrayBuffer();
        clipBuffer = await ctx.decodeAudioData(ab);
      } catch {
        clipBuffer = null;
      }
    }
    const rawLead =
      typeof beat.audioLeadSec === 'number' && Number.isFinite(beat.audioLeadSec)
        ? Math.max(-0.6, Math.min(0.6, beat.audioLeadSec))
        : 0;
    const voiceStart = Math.max(0, beatStart - rawLead);
    const maxPlayableDur = Math.max(0.2, beatEnd - voiceStart + 0.15);

    if (clip && clipBuffer) {
      const vSrc = ctx.createBufferSource();
      vSrc.buffer = clipBuffer;
      const vPan = computeSpatialPanForBeat(beat, 'voice');
      const vRoute = createSpatialRoute(ctx, voiceBus, vPan, beat.stage, spatialAudio, 0.85);
      vSrc.connect(vRoute.input);
      vSrc.start(voiceStart, 0, Math.min(clipBuffer.duration || clip.duration, maxPlayableDur));
      if (autoDuck) {
        const speechProfile = getVoiceSpeechProfile(clipBuffer);
        const duckWin = computeSpeechDuckWindows(
          voiceStart,
          Math.max(beatEnd, voiceStart + (clipBuffer.duration || clip.duration)),
          speechProfile?.speechWindow ?? null,
          clipBuffer.duration || clip.duration
        );
        if (duckWin.hasSpeech) {
          if (duckWin.duckStart > beatStart + 0.04) {
            musicBus.gain.setTargetAtTime(musicLevel, beatStart, 0.12);
          }
          musicBus.gain.setTargetAtTime(musicLevel * 0.28, duckWin.duckStart, 0.045);
          musicBus.gain.setTargetAtTime(
            musicLevel,
            Math.max(duckWin.duckStart + 0.05, duckWin.duckEnd),
            0.22
          );
        } else {
          musicBus.gain.setTargetAtTime(musicLevel, beatStart, 0.18);
        }
      }
    } else if (autoDuck && beat.dialogue.trim().length > 0 && beat.frame !== 'chapter_title') {
      musicBus.gain.setTargetAtTime(musicLevel * 0.52, Math.max(0, voiceStart + 0.08), 0.08);
      musicBus.gain.setTargetAtTime(musicLevel, Math.max(beatStart + 0.2, beatEnd - 0.35), 0.25);
    } else {
      musicBus.gain.setTargetAtTime(musicLevel, beatStart, 0.18);
    }

    // Schedule Mid-Beat SFX at exact sfxOffsetSec with deterministic stereo pan + room acoustics
    if (beat.sfx && beat.sfx !== 'none') {
      const offset = Math.max(0, Math.min(dur - 0.15, beat.sfxOffsetSec ?? 0));
      const sfxPan = computeSpatialPanForBeat(beat, 'sfx');
      const sfxRoute = createSpatialRoute(ctx, sfxBus, sfxPan, beat.stage, spatialAudio, 0.72);
      scheduleSfxOnContext(ctx, sfxRoute.input, beat.sfx, beatStart + offset);
    } else if (beat.transition === 'crimson_flash' || beat.fx === 'crimson_impact') {
      scheduleRegionalStepOnContext(ctx, musicBus, baseFreq, beat.raag, 0, 1.0, beatStart, synthGainScale);
    }

    // Schedule frame-locked sub-beat actionCues SFX (e.g. mid-beat sword clash / chime / thunder)
    const cueSfxEvents = resolveBeatActionSfxEvents(beat);
    for (const cueEv of cueSfxEvents) {
      const cueCastId = beat.actionCues?.[cueEv.cueIndex]?.castId;
      const cuePan = computeSpatialPanForBeat(beat, 'action_cue', cueCastId);
      const cueRoute = createSpatialRoute(ctx, sfxBus, cuePan, beat.stage, spatialAudio, 0.72);
      scheduleSfxOnContext(ctx, cueRoute.input, cueEv.sfx, beatStart + cueEv.offsetSec);
    }

    // Schedule deterministic stride footsteps, attack/leap whooshes, weather & paper-theatre foley
    const beatRenderStyle = beat.renderStyle || episode.visualStyle?.renderStyle;
    const foleyEvents = planBeatFoleyEvents(beat, beatRenderStyle);
    for (const fEv of foleyEvents) {
      scheduleFoleyEventOnContext(ctx, sfxBus, fEv, beatStart + fEv.offsetSec, beat.stage, spatialAudio);
    }

    // Schedule Procedural Regional Music Steps across this beat modulated by Episode Harmonic Tension Arc
    const baseStepDur =
      beat.raag === 'kora_griot' || beat.raag === 'gamelan_wayang'
        ? 0.2
        : beat.raag === 'guqin_bamboo' || beat.raag === 'cedar_flute'
          ? 0.26
          : 0.23;
    const density = arcPlan ? arcPlan.phraseDensity : 1;
    const effEnergy = arcPlan ? arcPlan.effectiveEnergy : beat.musicEnergy;
    const stepDur = Math.max(0.13, (baseStepDur - effEnergy * 0.03) / Math.max(0.75, Math.min(1.35, density)));

    const startStep = Math.ceil(beatStart / stepDur);
    const endStep = Math.floor(beatEnd / stepDur);
    for (let st = startStep; st <= endStep; st++) {
      if (st <= lastStep) continue;
      lastStep = st;
      const tNote = st * stepDur;
      if (tNote >= beatStart && tNote < totalDur) {
        const xfadeGain = computeBoundaryCrossfadeGain(
          tNote - beatStart,
          dur,
          arcPlan?.crossfadeInSec ?? 0,
          nextArcPlan?.crossfadeInSec ?? 0
        );
        scheduleRegionalStepOnContext(
          ctx,
          musicBus,
          baseFreq,
          beat.raag,
          st,
          effEnergy,
          tNote,
          synthGainScale * xfadeGain,
          arcPlan
            ? { octaveLift: arcPlan.octaveLift, percussionEmphasis: arcPlan.percussionEmphasis }
            : undefined
        );
      }
    }

    cursor = beatEnd;
  }

  // Smooth tail fade-out on final 0.2s
  master.gain.setValueAtTime(0.84, Math.max(0, totalDur - 0.18));
  master.gain.linearRampToValueAtTime(0.0001, totalDur + 0.12);

  return ctx.startRendering();
}

/**
 * Multi-Region Procedural Folklore Music Engine + Continuous Ambience + Real Voiceover Auto-Ducking Mixer.
 */
export class KathaAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  private musicBus: GainNode | null = null;
  private ambienceBus: GainNode | null = null;
  private ambienceFilter: BiquadFilterNode | null = null;
  private ambienceGain: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private voiceBus: GainNode | null = null;
  private voiceAnalyser: AnalyserNode | null = null;
  private voiceTimeData: Uint8Array<ArrayBuffer> | null = null;
  private droneGain: GainNode | null = null;
  public recordDest: MediaStreamAudioDestinationNode | null = null;

  public unlocked = false;
  public muted = false;
  public autoDuck = true;
  public spatialAudio = true;
  public musicLevel = 0.62;

  private readonly MAX_DECODED_VOICE_BUFFERS = 36;
  private voiceClips = new Map<string, VoiceClipEntry>();
  private voiceLruOrder: string[] = [];
  private decodingVoiceIds = new Set<string>();
  private activeVoiceSource: AudioBufferSourceNode | null = null;
  private activeVoiceBeatId: string | null = null;
  private pendingStingTimers: number[] = [];

  // Optional Real Acoustic Music Stem Bed
  private musicStemBuffer: AudioBuffer | null = null;
  private musicStemMeta: MusicStemMeta | null = null;
  private activeStemSource: AudioBufferSourceNode | null = null;

  private lastStep = -1;
  private lastBeatId = '';
  private lastRaag: RaagId | null = null;
  private lastMood: StoryBeat['mood'] | null = null;
  private beatMusicArcById = new Map<string, BeatMusicArcPlan>();
  private sfxFiredBeatId = '';
  private preTriggeredVoiceBeatId: string | null = null;
  private delayedVoiceTriggeredBeatId: string | null = null;
  private firedActionCueIndices = new Set<number>();
  private firedFoleyIndices = new Set<number>();
  private activeAmbience: Exclude<AmbienceId, 'auto'> = 'none';
  private baseFreq = 293.6648; // D4 tonic

  public setSpatialAudio(enabled: boolean): void {
    this.spatialAudio = enabled;
  }

  public setEpisodeMusicArc(episode: EpisodeScript): void {
    const arc = computeEpisodeMusicArc(episode);
    this.beatMusicArcById.clear();
    for (const plan of arc.beats) {
      this.beatMusicArcById.set(plan.beatId, plan);
    }
  }

  public unlock(): boolean {
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();

      // Broadcast master limiter prevents digital clipping when loud SFX + Raag + voiceover overlap
      this.masterLimiter = this.ctx.createDynamicsCompressor();
      this.masterLimiter.threshold.value = -10;
      this.masterLimiter.knee.value = 12;
      this.masterLimiter.ratio.value = 8;
      this.masterLimiter.attack.value = 0.004;
      this.masterLimiter.release.value = 0.14;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.78;
      this.masterLimiter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      if (this.ctx.createMediaStreamDestination) {
        this.recordDest = this.ctx.createMediaStreamDestination();
        this.masterGain.connect(this.recordDest);
      }

      // Music underscore bus (ducks automatically under voiceover)
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = this.musicLevel;
      this.musicBus.connect(this.masterLimiter);

      // Continuous Procedural Ambient Soundscape Bus
      this.ambienceBus = this.ctx.createGain();
      this.ambienceBus.gain.value = 1.0;
      this.ambienceBus.connect(this.masterLimiter);

      this.ambienceFilter = this.ctx.createBiquadFilter();
      this.ambienceFilter.type = 'bandpass';
      this.ambienceFilter.frequency.value = 1100;
      this.ambienceFilter.Q.value = 1.2;

      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.value = 0;

      const ambSrc = this.ctx.createBufferSource();
      ambSrc.buffer = createDeterministicNoiseBuffer(this.ctx, 3.0, 2027);
      ambSrc.loop = true;
      ambSrc.connect(this.ambienceFilter);
      this.ambienceFilter.connect(this.ambienceGain);
      this.ambienceGain.connect(this.ambienceBus);
      ambSrc.start(this.ctx.currentTime);

      // Subtle slow organic wind/breeze LFO on ambience filter
      const ambLfo = this.ctx.createOscillator();
      const ambLfoGain = this.ctx.createGain();
      ambLfo.frequency.value = 0.16;
      ambLfoGain.gain.value = 85;
      ambLfo.connect(ambLfoGain);
      ambLfoGain.connect(this.ambienceFilter.frequency);
      ambLfo.start(this.ctx.currentTime);

      // Procedural folklore SFX bus (baked directly into WebM exports)
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.85;
      this.sfxBus.connect(this.masterLimiter);

      // Voiceover bus + Analyser for real lip-sync visemes -> shared Broadcast Vocal Chain!
      this.voiceBus = this.ctx.createGain();
      this.voiceBus.gain.value = 1.08;
      this.voiceAnalyser = this.ctx.createAnalyser();
      this.voiceAnalyser.fftSize = 256;
      this.voiceTimeData = new Uint8Array(new ArrayBuffer(this.voiceAnalyser.fftSize));
      const liveVocalIn = buildBroadcastVocalChain(this.ctx, this.masterLimiter);
      this.voiceBus.connect(this.voiceAnalyser);
      this.voiceAnalyser.connect(liveVocalIn);

      // Tanpura drone (auto-crossfades to 0 during non-Indian World Music modes or custom acoustic stem)
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.value = 0;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 390;
      this.droneGain.connect(lp);
      lp.connect(this.musicBus);

      const now = this.ctx.currentTime;
      for (const f of [73.42, 110.0, 146.83]) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now);
        osc.connect(this.droneGain);
        osc.start(now);
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.unlocked = true;
    return true;
  }

  public setAutoDuck(enabled: boolean): void {
    this.autoDuck = enabled;
  }

  public setMusicLevel(level: number): void {
    this.musicLevel = Math.max(0, Math.min(1, level));
  }

  private touchVoiceLru(beatId: string): void {
    const idx = this.voiceLruOrder.indexOf(beatId);
    if (idx >= 0) this.voiceLruOrder.splice(idx, 1);
    this.voiceLruOrder.push(beatId);
  }

  private evictExcessDecodedVoiceBuffers(): void {
    while (this.voiceLruOrder.length > this.MAX_DECODED_VOICE_BUFFERS) {
      const oldestId = this.voiceLruOrder.shift();
      if (!oldestId || oldestId === this.activeVoiceBeatId) {
        if (oldestId) this.voiceLruOrder.push(oldestId);
        break;
      }
      const oldEntry = this.voiceClips.get(oldestId);
      // Only evict PCM buffer when compressed Blob backing is available for instant re-decoding
      if (oldEntry && oldEntry.blob) {
        oldEntry.buffer = null;
      }
    }
  }

  /**
   * Registers a voice clip lazily with zero immediate PCM RAM cost (ideal when loading
   * 100–250 beat long-form episodes or multi-story anthologies from the Vault).
   */
  public registerLazyVoiceBlob(
    beatId: string,
    blob: Blob,
    fileName: string,
    duration: number
  ): VoiceClipEntry {
    const entry: VoiceClipEntry = {
      beatId,
      fileName,
      buffer: null,
      duration: Math.max(0.2, duration || 3.5),
      blob,
    };
    this.voiceClips.set(beatId, entry);
    return entry;
  }

  public async ensureVoiceClipDecoded(beatId: string): Promise<AudioBuffer | null> {
    const entry = this.voiceClips.get(beatId);
    if (!entry) return null;
    if (entry.buffer) {
      this.touchVoiceLru(beatId);
      return entry.buffer;
    }
    if (!entry.blob || this.decodingVoiceIds.has(beatId)) return null;
    this.unlock();
    if (!this.ctx) return null;
    this.decodingVoiceIds.add(beatId);
    try {
      const arr = await entry.blob.arrayBuffer();
      const buffer = await this.ctx.decodeAudioData(arr);
      const latest = this.voiceClips.get(beatId);
      if (latest && latest.blob === entry.blob) {
        latest.buffer = buffer;
        latest.duration = buffer.duration;
        this.touchVoiceLru(beatId);
        this.evictExcessDecodedVoiceBuffers();
      }
      return buffer;
    } catch {
      return null;
    } finally {
      this.decodingVoiceIds.delete(beatId);
    }
  }

  /**
   * Gently pre-decodes upcoming beat voice clips (up to 4 ahead) so long-form playback
   * across 200+ beats stays glitch-free while keeping RAM bounded to 36 decoded clips.
   */
  public prefetchVoiceBeats(beatIds: string[]): void {
    const slice = beatIds.slice(0, 4);
    for (const id of slice) {
      const entry = this.voiceClips.get(id);
      if (entry && !entry.buffer && entry.blob && !this.decodingVoiceIds.has(id)) {
        void this.ensureVoiceClipDecoded(id);
      }
    }
  }

  public async loadVoiceClip(beatId: string, file: File): Promise<VoiceClipEntry> {
    return this.loadVoiceBlob(beatId, file, file.name);
  }

  public async loadVoiceBlob(
    beatId: string,
    blob: Blob,
    fileName: string
  ): Promise<VoiceClipEntry> {
    this.unlock();
    if (!this.ctx) throw new Error('WebAudio unavailable');
    const arr = await blob.arrayBuffer();
    const buffer = await this.ctx.decodeAudioData(arr);
    const entry: VoiceClipEntry = {
      beatId,
      fileName,
      buffer,
      duration: buffer.duration,
      blob,
    };
    this.voiceClips.set(beatId, entry);
    this.touchVoiceLru(beatId);
    this.evictExcessDecodedVoiceBuffers();
    return entry;
  }

  /**
   * Registers an already-decoded AudioBuffer directly (used by headless Playwright CLI
   * where OfflineAudioContext decodes audio without requiring a user gesture).
   */
  public setDecodedVoiceClip(
    beatId: string,
    buffer: AudioBuffer,
    fileName: string,
    blob?: Blob
  ): VoiceClipEntry {
    const entry: VoiceClipEntry = {
      beatId,
      fileName,
      buffer,
      duration: buffer.duration,
      blob,
    };
    this.voiceClips.set(beatId, entry);
    this.touchVoiceLru(beatId);
    return entry;
  }

  public removeVoiceClip(beatId: string): void {
    this.voiceClips.delete(beatId);
    const idx = this.voiceLruOrder.indexOf(beatId);
    if (idx >= 0) this.voiceLruOrder.splice(idx, 1);
    if (this.activeVoiceBeatId === beatId) {
      this.stopActiveVoice();
    }
  }

  public clearAllVoiceClips(): void {
    this.stopActiveVoice();
    this.voiceClips.clear();
    this.voiceLruOrder = [];
    this.decodingVoiceIds.clear();
  }

  public getVoiceClip(beatId: string): VoiceClipEntry | undefined {
    return this.voiceClips.get(beatId);
  }

  public getAllVoiceClips(): Map<string, VoiceClipEntry> {
    return new Map(this.voiceClips);
  }

  // ---- OPTIONAL ACOUSTIC MUSIC STEM BED ----
  public async loadMusicStem(blob: Blob, fileName: string): Promise<MusicStemMeta> {
    this.unlock();
    if (!this.ctx) throw new Error('WebAudio unavailable');
    const arr = await blob.arrayBuffer();
    const buffer = await this.ctx.decodeAudioData(arr);
    this.stopMusicStemPlayback();
    this.musicStemBuffer = buffer;
    this.musicStemMeta = { fileName, duration: buffer.duration };
    return this.musicStemMeta;
  }

  public setDecodedMusicStem(buffer: AudioBuffer, fileName: string): MusicStemMeta {
    this.stopMusicStemPlayback();
    this.musicStemBuffer = buffer;
    this.musicStemMeta = { fileName, duration: buffer.duration };
    return this.musicStemMeta;
  }

  public clearMusicStem(): void {
    this.stopMusicStemPlayback();
    this.musicStemBuffer = null;
    this.musicStemMeta = null;
  }

  public getMusicStemMeta(): MusicStemMeta | null {
    return this.musicStemMeta;
  }

  public getMusicStemBuffer(): AudioBuffer | null {
    return this.musicStemBuffer;
  }

  private startMusicStemPlayback(globalT: number): void {
    if (!this.ctx || !this.musicBus || !this.musicStemBuffer || this.activeStemSource) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.musicStemBuffer;
    src.loop = true;
    const offset = this.musicStemBuffer.duration > 0.1 ? globalT % this.musicStemBuffer.duration : 0;
    src.connect(this.musicBus);
    src.start(0, Math.max(0, offset));
    this.activeStemSource = src;
  }

  private stopMusicStemPlayback(): void {
    if (this.activeStemSource) {
      try {
        this.activeStemSource.stop();
      } catch {
        // already stopped
      }
      this.activeStemSource.disconnect();
      this.activeStemSource = null;
    }
  }

  public stopActiveVoice(): void {
    if (this.activeVoiceSource) {
      try {
        this.activeVoiceSource.stop();
      } catch {
        // already stopped
      }
      this.activeVoiceSource.disconnect();
      this.activeVoiceSource = null;
    }
    this.activeVoiceBeatId = null;
  }

  private clearPendingStings(): void {
    for (const id of this.pendingStingTimers) {
      window.clearTimeout(id);
    }
    this.pendingStingTimers = [];
  }

  public setMuted(m: boolean): void {
    this.muted = m;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(m ? 0 : 0.78, this.ctx.currentTime, 0.04);
    }
  }

  public setPlaying(playing: boolean): void {
    if (!playing) {
      this.stopActiveVoice();
      this.stopMusicStemPlayback();
      this.clearPendingStings();
      if (this.ambienceGain && this.ctx) {
        this.ambienceGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      }
    }
    if (this.droneGain && this.ctx) {
      this.droneGain.gain.setTargetAtTime(
        playing && !this.musicStemBuffer ? 0.055 : 0,
        this.ctx.currentTime,
        0.08
      );
    }
  }

  public reset(): void {
    this.stopActiveVoice();
    this.stopMusicStemPlayback();
    this.clearPendingStings();
    this.lastStep = -1;
    this.lastBeatId = '';
    this.sfxFiredBeatId = '';
    this.preTriggeredVoiceBeatId = null;
    this.delayedVoiceTriggeredBeatId = null;
    this.firedActionCueIndices.clear();
    this.firedFoleyIndices.clear();
  }

  public dispose(): void {
    this.reset();
    this.voiceClips.clear();
    this.musicStemBuffer = null;
    this.musicStemMeta = null;
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.masterGain = null;
    this.masterLimiter = null;
    this.musicBus = null;
    this.ambienceBus = null;
    this.ambienceFilter = null;
    this.ambienceGain = null;
    this.sfxBus = null;
    this.voiceBus = null;
    this.voiceAnalyser = null;
    this.droneGain = null;
    this.recordDest = null;
    this.unlocked = false;
  }

  /**
   * Returns 0..1 live RMS amplitude if a real uploaded/TTS voiceover clip is playing,
   * otherwise returns null so the renderer smoothly falls back to procedural syllable cadence.
   */
  public getLiveVoiceEnergy(beatId: string): number | null {
    if (
      !this.activeVoiceSource ||
      this.activeVoiceBeatId !== beatId ||
      !this.voiceAnalyser ||
      !this.voiceTimeData
    ) {
      return null;
    }
    this.voiceAnalyser.getByteTimeDomainData(this.voiceTimeData);
    let sumSq = 0;
    for (let i = 0; i < this.voiceTimeData.length; i++) {
      const v = (this.voiceTimeData[i] - 128) / 128;
      sumSq += v * v;
    }
    const rms = Math.sqrt(sumSq / this.voiceTimeData.length);
    return Math.min(1, rms * 4.4);
  }

  public playSfx(
    sfx: SfxId | undefined,
    forcePreview = false,
    spatialBeat?: StoryBeat,
    spatialCastId?: string
  ): void {
    if (!sfx || sfx === 'none') return;
    if (forcePreview) this.unlock();
    if (!this.ctx || !this.sfxBus) return;
    if (this.muted && !forcePreview) return;
    if (spatialBeat && this.spatialAudio) {
      const pan = computeSpatialPanForBeat(
        spatialBeat,
        spatialCastId ? 'action_cue' : 'sfx',
        spatialCastId
      );
      const route = createSpatialRoute(
        this.ctx,
        this.sfxBus,
        pan,
        spatialBeat.stage,
        true,
        0.72
      );
      scheduleSfxOnContext(this.ctx, route.input, sfx, this.ctx.currentTime);
      return;
    }
    scheduleSfxOnContext(this.ctx, this.sfxBus, sfx, this.ctx.currentTime);
  }

  private startVoiceClipAtOffset(beatId: string, offsetSec: number, beat?: StoryBeat): void {
    if (!this.ctx || !this.voiceBus) return;
    const clip = this.voiceClips.get(beatId);
    if (!clip || offsetSec >= clip.duration - 0.05) return;
    const safeOffset = Math.max(0, offsetSec);
    const connectVoice = (src: AudioBufferSourceNode) => {
      if (!this.ctx || !this.voiceBus) return;
      if (beat && this.spatialAudio) {
        const pan = computeSpatialPanForBeat(beat, 'voice');
        const route = createSpatialRoute(
          this.ctx,
          this.voiceBus,
          pan,
          beat.stage,
          true,
          0.85
        );
        src.connect(route.input);
      } else {
        src.connect(this.voiceBus);
      }
    };
    if (clip.buffer) {
      this.touchVoiceLru(beatId);
      const src = this.ctx.createBufferSource();
      src.buffer = clip.buffer;
      connectVoice(src);
      src.onended = () => {
        if (this.activeVoiceSource === src) {
          this.activeVoiceSource = null;
          this.activeVoiceBeatId = null;
        }
      };
      src.start(0, safeOffset);
      this.activeVoiceSource = src;
      this.activeVoiceBeatId = beatId;
    } else if (clip.blob) {
      const targetBeatId = beatId;
      const startedAtMs = performance.now();
      void this.ensureVoiceClipDecoded(targetBeatId).then((decoded) => {
        if (!decoded || !this.ctx || !this.voiceBus) return;
        if (this.lastBeatId !== targetBeatId && this.preTriggeredVoiceBeatId !== targetBeatId) return;
        const elapsedSec = (performance.now() - startedAtMs) / 1000;
        const offset = Math.max(0, safeOffset + elapsedSec);
        if (offset >= decoded.duration - 0.05) return;
        this.stopActiveVoice();
        const src = this.ctx.createBufferSource();
        src.buffer = decoded;
        connectVoice(src);
        src.onended = () => {
          if (this.activeVoiceSource === src) {
            this.activeVoiceSource = null;
            this.activeVoiceBeatId = null;
          }
        };
        src.start(0, offset);
        this.activeVoiceSource = src;
        this.activeVoiceBeatId = targetBeatId;
      });
    }
  }

  public update(
    globalT: number,
    beat: StoryBeat,
    beatLocalT: number,
    isPlaying: boolean,
    speechEnergy: number,
    nextBeat?: StoryBeat | null,
    episodeRenderStyle?: RenderStyleId
  ): void {
    if (!this.unlocked || !this.ctx || !isPlaying) return;

    // Start custom acoustic music stem bed if loaded
    if (this.musicStemBuffer && !this.activeStemSource) {
      this.startMusicStemPlayback(globalT);
    }

    // Auto-crossfade Tanpura drone ON for Indian Raags, OFF for World Music or custom acoustic stem
    if (this.droneGain) {
      const wantDrone = !this.musicStemBuffer && isIndianRaag(beat.raag) ? 0.055 : 0;
      this.droneGain.gain.setTargetAtTime(wantDrone, this.ctx.currentTime, 0.18);
    }

    // Continuous Ambient Soundscape Bed morphing
    const desiredAmb = resolveBeatAmbience(beat);
    if (this.ambienceFilter && this.ambienceGain) {
      const spec = getAmbienceSpec(desiredAmb);
      if (desiredAmb !== this.activeAmbience) {
        this.activeAmbience = desiredAmb;
        this.ambienceFilter.type = spec.type;
        this.ambienceFilter.frequency.setTargetAtTime(spec.freq, this.ctx.currentTime, 0.25);
        this.ambienceFilter.Q.setTargetAtTime(spec.q, this.ctx.currentTime, 0.25);
      }
      this.ambienceGain.gain.setTargetAtTime(this.muted ? 0 : spec.gain, this.ctx.currentTime, 0.22);
    }

    const curLead =
      typeof beat.audioLeadSec === 'number' && Number.isFinite(beat.audioLeadSec)
        ? Math.max(-0.6, Math.min(0.6, beat.audioLeadSec))
        : 0;

    // Trigger real uploaded/TTS voiceover clip on beat entry (respecting J-Cut pre-roll & L-Cut delay!)
    if (beat.id !== this.lastBeatId) {
      const wasPreTriggered = this.preTriggeredVoiceBeatId === beat.id && this.activeVoiceBeatId === beat.id;
      this.lastBeatId = beat.id;
      this.sfxFiredBeatId = '';
      this.delayedVoiceTriggeredBeatId = null;
      this.firedActionCueIndices.clear();
      this.firedFoleyIndices.clear();

      if (wasPreTriggered) {
        // Voice already started seamlessly via J-Cut on the previous beat's tail!
        this.preTriggeredVoiceBeatId = null;
        this.delayedVoiceTriggeredBeatId = beat.id;
      } else {
        this.preTriggeredVoiceBeatId = null;
        this.stopActiveVoice();
        if (curLead >= 0) {
          this.startVoiceClipAtOffset(beat.id, Math.max(0, beatLocalT + curLead), beat);
          this.delayedVoiceTriggeredBeatId = beat.id;
        } else if (beatLocalT >= -curLead) {
          this.startVoiceClipAtOffset(beat.id, Math.max(0, beatLocalT + curLead), beat);
          this.delayedVoiceTriggeredBeatId = beat.id;
        }
      }

      // Dramatic transition chord stings if no explicit beat SFX is scheduled
      if ((!beat.sfx || beat.sfx === 'none') && this.musicBus) {
        if (beat.transition === 'crimson_flash' || beat.fx === 'crimson_impact') {
          scheduleRegionalStepOnContext(
            this.ctx,
            this.musicBus,
            this.baseFreq,
            beat.raag,
            0,
            1.0,
            this.ctx.currentTime,
            this.musicStemBuffer ? 0.2 : 1.0
          );
        } else if (beat.fx === 'smear_swoop') {
          this.clearPendingStings();
          [2, 4, 5, 7].forEach((d, idx) => {
            const tid = window.setTimeout(() => {
              if (!this.ctx || !this.musicBus) return;
              scheduleRegionalStepOnContext(
                this.ctx,
                this.musicBus,
                this.baseFreq,
                beat.raag,
                d,
                0.8,
                this.ctx.currentTime,
                this.musicStemBuffer ? 0.2 : 0.9
              );
            }, idx * 60);
            this.pendingStingTimers.push(tid);
          });
        }
      }
    }

    // L-Cut delayed voice entry for current beat (when audioLeadSec < 0)
    if (curLead < 0 && this.delayedVoiceTriggeredBeatId !== beat.id && beatLocalT >= -curLead) {
      this.delayedVoiceTriggeredBeatId = beat.id;
      this.startVoiceClipAtOffset(beat.id, Math.max(0, beatLocalT + curLead), beat);
    }

    // J-Cut seamless pre-roll for the UPCOMING beat's voice clip
    if (
      nextBeat &&
      nextBeat.id !== beat.id &&
      this.preTriggeredVoiceBeatId !== nextBeat.id &&
      typeof nextBeat.audioLeadSec === 'number' &&
      nextBeat.audioLeadSec > 0.02
    ) {
      const nextLead = Math.min(0.6, nextBeat.audioLeadSec);
      const beatDur = Math.max(1.2, beat.duration || 4);
      const triggerAt = Math.max(0.2, beatDur - nextLead);
      if (beatLocalT >= triggerAt && this.voiceClips.has(nextBeat.id)) {
        this.preTriggeredVoiceBeatId = nextBeat.id;
        this.startVoiceClipAtOffset(nextBeat.id, Math.max(0, beatLocalT - triggerAt), nextBeat);
      }
    }

    // Mid-Beat SFX Trigger (supports sfxOffsetSec anywhere inside the beat!)
    if (beat.sfx && beat.sfx !== 'none' && this.sfxFiredBeatId !== beat.id) {
      const offset = Math.max(0, Math.min(beat.duration - 0.12, beat.sfxOffsetSec ?? 0));
      if (beatLocalT >= offset) {
        this.sfxFiredBeatId = beat.id;
        // Avoid blasting an already-passed mid-beat SFX if user scrubbed far past it
        if (beatLocalT - offset < 0.45) {
          this.playSfx(beat.sfx, false, beat);
        }
      }
    }

    // Sub-Beat Action Cues SFX Trigger (frame-locked mid-beat choreography sounds)
    if (beat.actionCues && beat.actionCues.length > 0) {
      const cueEvents = resolveBeatActionSfxEvents(beat);
      for (const cueEv of cueEvents) {
        if (this.firedActionCueIndices.has(cueEv.cueIndex)) continue;
        if (beatLocalT >= cueEv.offsetSec) {
          this.firedActionCueIndices.add(cueEv.cueIndex);
          if (beatLocalT - cueEv.offsetSec < 0.45) {
            const cueCastId = beat.actionCues?.[cueEv.cueIndex]?.castId;
            this.playSfx(cueEv.sfx, false, beat, cueCastId);
          }
        }
      }
    }

    // Procedural Stride Footsteps, Attack/Leap Whooshes, Weather & Paper-Theatre Foley
    if (!this.muted && this.sfxBus) {
      const foleyEvents = planBeatFoleyEvents(beat, beat.renderStyle || episodeRenderStyle);
      for (let fIdx = 0; fIdx < foleyEvents.length; fIdx++) {
        if (this.firedFoleyIndices.has(fIdx)) continue;
        const fEv = foleyEvents[fIdx];
        if (beatLocalT >= fEv.offsetSec) {
          this.firedFoleyIndices.add(fIdx);
          if (beatLocalT - fEv.offsetSec < 0.35) {
            scheduleFoleyEventOnContext(
              this.ctx,
              this.sfxBus,
              fEv,
              this.ctx.currentTime,
              beat.stage,
              this.spatialAudio
            );
          }
        }
      }
    }

    // Broadcast-grade sidechain Auto-Ducking (fast attack 55ms when speaking, warm release 340ms in pauses)
    if (this.musicBus) {
      const liveRms = this.getLiveVoiceEnergy(beat.id) ?? 0;
      const speaking = liveRms > 0.08 || speechEnergy > 0.16;
      const baseLevel = this.musicLevel;
      const targetGain = this.autoDuck && speaking ? baseLevel * 0.32 : baseLevel;
      const timeConst = speaking ? 0.055 : 0.34;
      this.musicBus.gain.setTargetAtTime(targetGain, this.ctx.currentTime, timeConst);
    }

    // Regional phrase sequencer scaled by Episode Harmonic Tension Arc + beat-boundary crossfades
    if (!this.muted && this.musicBus) {
      const arcPlan =
        this.beatMusicArcById.get(beat.id) ||
        computeLiveBeatTensionFallback(beat, this.lastRaag, this.lastMood);
      const nextArcPlan = nextBeat ? this.beatMusicArcById.get(nextBeat.id) : null;
      const nextCrossfadeSec =
        nextArcPlan?.crossfadeInSec ??
        (nextBeat && nextBeat.raag !== beat.raag
          ? 0.42
          : nextBeat && nextBeat.mood !== beat.mood
            ? 0.28
            : 0);

      const baseStepDur =
        beat.raag === 'kora_griot' || beat.raag === 'gamelan_wayang'
          ? 0.2
          : beat.raag === 'guqin_bamboo' || beat.raag === 'cedar_flute'
            ? 0.26
            : 0.23;
      const effEnergy = arcPlan.effectiveEnergy;
      const stepDur = Math.max(
        0.13,
        (baseStepDur - effEnergy * 0.03) / Math.max(0.75, Math.min(1.35, arcPlan.phraseDensity))
      );
      const step = Math.floor(globalT / stepDur);
      if (step !== this.lastStep) {
        this.lastStep = step;
        const synthScale = this.musicStemBuffer ? 0.12 : 1.0;
        const xfadeGain = computeBoundaryCrossfadeGain(
          beatLocalT,
          Math.max(1.2, beat.duration || 4),
          arcPlan.crossfadeInSec,
          nextCrossfadeSec
        );
        scheduleRegionalStepOnContext(
          this.ctx,
          this.musicBus,
          this.baseFreq,
          beat.raag,
          step,
          effEnergy,
          this.ctx.currentTime,
          synthScale * xfadeGain,
          { octaveLift: arcPlan.octaveLift, percussionEmphasis: arcPlan.percussionEmphasis }
        );
      }
      this.lastRaag = beat.raag;
      this.lastMood = beat.mood;
    }
  }
}
