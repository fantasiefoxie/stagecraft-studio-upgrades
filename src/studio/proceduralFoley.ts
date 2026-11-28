/**
 * Stagecraft Studio — Procedural Stride & Weather Foley Synthesizer
 *
 * Deterministic WebAudio foley event planner & synthesizer:
 * - Subtle footsteps locked to walk / enter_left / enter_right / cross_stage motion cycles
 * - Cloth/air whooshes on attack / leap_arc poses & action cues
 * - Weather accents (distant thunder rumbles in rain, ember crackles in embers)
 *
 * Zero Math.random(): 100% deterministic across live KathaAudioEngine preview
 * and renderEpisodeAudioOffline.
 */

import { STUDIO_FPS, type RenderStyleId, type StageId, type StoryBeat } from './types';
import { createSpatialRoute } from './spatialAudio';

export type FoleyKind =
  | 'footstep'
  | 'whoosh'
  | 'thunder_rumble'
  | 'ember_crackle'
  | 'paper_turn'
  | 'cardstock_fold'
  | 'hinge_pop';

export interface FoleyEvent {
  /** Offset in seconds from the start of the beat */
  offsetSec: number;
  kind: FoleyKind;
  /** Deterministic stereo pan (-0.35 .. +0.35) */
  pan: number;
  /** Subtle normalized gain (0.04 .. 0.32) */
  gain: number;
  /** Pitch multiplier (0.75 .. 1.35) for organic variation */
  pitch: number;
}

function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeLcg(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function slotBasePan(slot?: string): number {
  if (slot === 'left') return -0.28;
  if (slot === 'right') return 0.28;
  return 0;
}

/**
 * Pure deterministic planner returning all scheduled foley events within a single beat.
 */
export function planBeatFoleyEvents(
  beat: StoryBeat,
  renderStyle?: RenderStyleId
): FoleyEvent[] {
  const dur = Math.max(0.8, Number.isFinite(beat.duration) ? beat.duration : 4);
  const events: FoleyEvent[] = [];
  const effectiveStyle = beat.renderStyle || renderStyle;
  const rand = makeLcg(
    hashString(`foley_${beat.id}_${beat.stage}_${beat.weather}_${beat.transition || 'hard_cut'}_${effectiveStyle || 'default'}`)
  );

  // 1. Stride footsteps & attack/leap whooshes from actor base motions/poses
  for (let aIdx = 0; aIdx < beat.actors.length; aIdx++) {
    const actor = beat.actors[aIdx];
    const motion = actor.motion || 'still';

    if (
      actor.pose === 'walk' ||
      motion === 'enter_left' ||
      motion === 'enter_right' ||
      motion === 'cross_stage' ||
      motion === 'step_forward'
    ) {
      const strideSec = 0.44;
      const startSec = 0.16 + aIdx * 0.08;
      const maxSteps = Math.min(12, Math.floor((dur - startSec - 0.12) / strideSec) + 1);
      for (let step = 0; step < maxSteps; step++) {
        const t = startSec + step * strideSec;
        if (t >= dur - 0.1) break;
        const frac = Math.max(0, Math.min(1, t / dur));
        let pan = slotBasePan(actor.slot);
        if (motion === 'enter_left') {
          pan = -0.34 + (slotBasePan(actor.slot) + 0.34) * Math.min(1, frac * 1.45);
        } else if (motion === 'enter_right') {
          pan = 0.34 + (slotBasePan(actor.slot) - 0.34) * Math.min(1, frac * 1.45);
        } else if (motion === 'cross_stage') {
          pan = -0.3 + 0.6 * frac;
        }
        events.push({
          offsetSec: Number(t.toFixed(3)),
          kind: 'footstep',
          pan: Number(Math.max(-0.35, Math.min(0.35, pan)).toFixed(3)),
          gain: step % 2 === 0 ? 0.12 : 0.095,
          pitch: Number((0.9 + (step % 2) * 0.12 + (rand() - 0.5) * 0.08).toFixed(3)),
        });
      }
    }

    if (actor.pose === 'attack' || motion === 'leap_arc') {
      events.push({
        offsetSec: Number(Math.min(dur - 0.15, 0.22 + aIdx * 0.12).toFixed(3)),
        kind: 'whoosh',
        pan: slotBasePan(actor.slot),
        gain: 0.18,
        pitch: Number((0.95 + rand() * 0.18).toFixed(3)),
      });
    }
  }

  // 2. Action-cue whooshes & stride bursts
  if (Array.isArray(beat.actionCues)) {
    for (const cue of beat.actionCues) {
      const offsetSec =
        typeof cue.timeSec === 'number' && Number.isFinite(cue.timeSec)
          ? cue.timeSec
          : typeof cue.frame === 'number' && Number.isFinite(cue.frame)
            ? cue.frame / STUDIO_FPS
            : typeof cue.at === 'number' && Number.isFinite(cue.at)
              ? cue.at * dur
              : 0.25 * dur;
      if (offsetSec < 0 || offsetSec > dur - 0.08) continue;

      const actor = cue.castId ? beat.actors.find((a) => a.castId === cue.castId) : undefined;
      const pan = slotBasePan(actor?.slot);

      if (cue.pose === 'attack' || cue.motion === 'leap_arc') {
        events.push({
          offsetSec: Number(offsetSec.toFixed(3)),
          kind: 'whoosh',
          pan,
          gain: 0.2,
          pitch: Number((0.92 + rand() * 0.22).toFixed(3)),
        });
      } else if (
        cue.pose === 'walk' ||
        cue.motion === 'enter_left' ||
        cue.motion === 'enter_right' ||
        cue.motion === 'cross_stage' ||
        cue.motion === 'step_forward'
      ) {
        events.push({
          offsetSec: Number(offsetSec.toFixed(3)),
          kind: 'footstep',
          pan,
          gain: 0.11,
          pitch: Number((0.92 + rand() * 0.16).toFixed(3)),
        });
      }
    }
  }

  // 3. Deterministic weather accents
  if (beat.weather === 'rain' && dur >= 2.8) {
    // Distant thunder rumble once per qualifying rain beat
    const thunderAt = Number((dur * (0.24 + rand() * 0.42)).toFixed(3));
    if (thunderAt < dur - 0.4) {
      events.push({
        offsetSec: thunderAt,
        kind: 'thunder_rumble',
        pan: Number(((rand() - 0.5) * 0.46).toFixed(3)),
        gain: 0.16,
        pitch: Number((0.82 + rand() * 0.25).toFixed(3)),
      });
    }
  } else if (beat.weather === 'embers') {
    const crackleCount = Math.max(1, Math.min(5, Math.floor(dur / 1.45)));
    for (let k = 0; k < crackleCount; k++) {
      const slotCenter = ((k + 0.35 + rand() * 0.45) / crackleCount) * (dur - 0.2);
      if (slotCenter < 0.08 || slotCenter >= dur - 0.12) continue;
      events.push({
        offsetSec: Number(slotCenter.toFixed(3)),
        kind: 'ember_crackle',
        pan: Number(((rand() - 0.5) * 0.52).toFixed(3)),
        gain: Number((0.08 + rand() * 0.06).toFixed(3)),
        pitch: Number((0.88 + rand() * 0.36).toFixed(3)),
      });
    }
  }

  // 4. Upgrade 32: Tactile Paper, Crease & Pop-Up Hinge Foley for popup_fold & papercraft_diorama
  const isPaperScene =
    beat.transition === 'popup_fold' || effectiveStyle === 'papercraft_diorama';
  const isSlate = beat.frame === 'chapter_title' || beat.frame === 'end_screen';
  if (isPaperScene && !isSlate) {
    // Soft cardstock page-turn swoosh right on the scene cut
    events.push({
      offsetSec: 0.02,
      kind: 'paper_turn',
      pan: 0,
      gain: beat.transition === 'popup_fold' ? 0.2 : 0.14,
      pitch: Number((0.94 + rand() * 0.14).toFixed(3)),
    });

    // Staggered cardstock fold & spring-hinge pop for entering actors
    const actorCount = Math.min(3, beat.actors.length);
    for (let aIdx = 0; aIdx < actorCount; aIdx++) {
      const actor = beat.actors[aIdx];
      const pan = slotBasePan(actor.slot);
      const foldAt = Number(Math.min(dur - 0.18, 0.065 + aIdx * 0.075).toFixed(3));
      const popAt = Number(Math.min(dur - 0.12, 0.145 + aIdx * 0.075).toFixed(3));
      events.push({
        offsetSec: foldAt,
        kind: 'cardstock_fold',
        pan,
        gain: 0.12,
        pitch: Number((0.92 + rand() * 0.18).toFixed(3)),
      });
      events.push({
        offsetSec: popAt,
        kind: 'hinge_pop',
        pan,
        gain: 0.11,
        pitch: Number((0.96 + aIdx * 0.06 + (rand() - 0.5) * 0.08).toFixed(3)),
      });
    }

    // Subtle hinge pop for hero prop emergence
    if ((beat.prop && beat.prop !== 'none') || beat.customPropDataUrl) {
      const propPan = slotBasePan(beat.propSlot);
      events.push({
        offsetSec: Number(Math.min(dur - 0.12, 0.21).toFixed(3)),
        kind: 'hinge_pop',
        pan: propPan,
        gain: 0.1,
        pitch: Number((1.05 + rand() * 0.14).toFixed(3)),
      });
    }
  }

  events.sort((a, b) => a.offsetSec - b.offsetSec);
  return events;
}

const foleyNoiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();

function getDeterministicFoleyNoise(ctx: BaseAudioContext): AudioBuffer {
  const cached = foleyNoiseCache.get(ctx);
  if (cached) return cached;
  const len = Math.max(1024, Math.round(ctx.sampleRate * 1.5));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  const rand = makeLcg(0x51a6ec4f);
  for (let i = 0; i < len; i++) {
    data[i] = rand() * 2 - 1;
  }
  foleyNoiseCache.set(ctx, buf);
  return buf;
}

/**
 * Schedules a single procedural foley sound deterministically on either live AudioContext
 * or OfflineAudioContext, optionally routed through stereo pan + stage acoustics.
 */
export function scheduleFoleyEventOnContext(
  ctx: BaseAudioContext,
  dest: AudioNode,
  event: FoleyEvent,
  atTime: number,
  stage: StageId | string,
  spatialEnabled = true
): void {
  const t = Math.max(ctx.currentTime, atTime);
  const route = createSpatialRoute(ctx, dest, event.pan, stage, spatialEnabled, 0.55);
  const target = route.input;
  const noiseBuf = getDeterministicFoleyNoise(ctx);

  if (event.kind === 'footstep') {
    // Crisp soft gravel/floor heel-toe burst + low body tap
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(420 * event.pitch, t);
    bp.Q.value = 1.6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(event.gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.068);
    src.connect(bp);
    bp.connect(g);
    g.connect(target);
    src.start(t, 0.04, 0.08);
    src.stop(t + 0.085);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(112 * event.pitch, t);
    osc.frequency.exponentialRampToValueAtTime(52 * event.pitch, t + 0.055);
    const og = ctx.createGain();
    og.gain.setValueAtTime(event.gain * 0.55, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    osc.connect(og);
    og.connect(target);
    osc.start(t);
    osc.stop(t + 0.065);
    return;
  }

  if (event.kind === 'whoosh') {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 2.2;
    bp.frequency.setValueAtTime(280 * event.pitch, t);
    bp.frequency.exponentialRampToValueAtTime(1650 * event.pitch, t + 0.11);
    bp.frequency.exponentialRampToValueAtTime(340 * event.pitch, t + 0.27);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(event.gain, t + 0.09);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    src.connect(bp);
    bp.connect(g);
    g.connect(target);
    src.start(t, 0.15, 0.3);
    src.stop(t + 0.3);
    return;
  }

  if (event.kind === 'thunder_rumble') {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(165 * event.pitch, t);
    lp.frequency.exponentialRampToValueAtTime(58 * event.pitch, t + 1.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(event.gain, t + 0.16);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.35);
    src.connect(lp);
    lp.connect(g);
    g.connect(target);
    src.start(t, 0, 1.4);
    src.stop(t + 1.4);
    return;
  }

  if (event.kind === 'paper_turn') {
    // Soft tactile cardstock page-turn swoosh (dual bandpass sweep over deterministic noise)
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.45;
    bp.frequency.setValueAtTime(760 * event.pitch, t);
    bp.frequency.exponentialRampToValueAtTime(2350 * event.pitch, t + 0.09);
    bp.frequency.exponentialRampToValueAtTime(920 * event.pitch, t + 0.24);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(event.gain, t + 0.055);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    src.connect(bp);
    bp.connect(g);
    g.connect(target);
    src.start(t, 0.22, 0.27);
    src.stop(t + 0.27);
    return;
  }

  if (event.kind === 'cardstock_fold') {
    // Crisp matte cardstock crease snap (high-Q paper rustle + warm body fold thump)
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 2.8;
    bp.frequency.setValueAtTime(1750 * event.pitch, t);
    bp.frequency.exponentialRampToValueAtTime(3600 * event.pitch, t + 0.055);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(event.gain, t + 0.009);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);
    src.connect(bp);
    bp.connect(g);
    g.connect(target);
    src.start(t, 0.41, 0.085);
    src.stop(t + 0.09);
    return;
  }

  if (event.kind === 'hinge_pop') {
    // Gentle damped pop-up paper hinge settle (wooden/cardstock resonant pop + tiny rustle tail)
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(285 * event.pitch, t);
    osc.frequency.exponentialRampToValueAtTime(132 * event.pitch, t + 0.068);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.linearRampToValueAtTime(event.gain * 0.72, t + 0.006);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.082);
    osc.connect(og);
    og.connect(target);
    osc.start(t);
    osc.stop(t + 0.09);

    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2400 * event.pitch, t);
    bp.Q.value = 2.1;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.linearRampToValueAtTime(event.gain * 0.42, t + 0.008);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
    src.connect(bp);
    bp.connect(ng);
    ng.connect(target);
    src.start(t, 0.56, 0.065);
    src.stop(t + 0.07);
    return;
  }

  // ember_crackle: delicate high-frequency wood/fire snap
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'bandpass';
  hp.frequency.setValueAtTime(3200 * event.pitch, t);
  hp.Q.value = 3.2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(event.gain, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.026);
  src.connect(hp);
  hp.connect(g);
  g.connect(target);
  src.start(t, 0.32, 0.032);
  src.stop(t + 0.035);
}
