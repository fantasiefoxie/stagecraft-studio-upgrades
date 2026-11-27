/**
 * Stagecraft Studio — Deterministic Hit Stop (Impact Freeze) & Attack-Hold-Decay VFX Envelopes (Upgrade 21)
 *
 * Pure zero-allocation timing and Canvas 2D impact shock overlay helpers.
 * Detects peak strike moments from beat action cues, high-impact SFX, or kinetic impact FX,
 * freezes actor pose/limb clocks for 2-4 integer frames at STUDIO_FPS, and drives
 * smooth attack-hold-decay shock rings + chromatic kick flashes with 100% determinism.
 */

import {
  FxId,
  STUDIO_FPS,
  SfxId,
  StoryBeat,
} from './types';

export interface HitstopState {
  isFrozen: boolean;
  frozenLocalFrame: number;
  impactEnvelope: number; // 0 .. 1 smooth Attack-Hold-Decay amplitude
  chromaticKickPx: number; // 0 .. 8 px crisp impact split offset
  flashAlpha: number; // 0 .. 0.35 brief white/accent flash alpha
  hitstopFrames: number; // 0 or 2..4 integer frames at fps
  shakeX: number; // deterministic micro-shake X (-1..1 normalized)
  shakeY: number; // deterministic micro-shake Y (-1..1 normalized)
  impactAnchorFrame: number; // -1 if none active
}

const IMPACT_SFX = new Set<SfxId>(['sword_clash', 'thunder_crack']);
const IMPACT_FX = new Set<FxId>([
  'crimson_impact',
  'shock_burst',
  'shatter_glass',
  'comic_pow',
]);

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * Smooth deterministic Attack-Hold-Decay VFX envelope returning [0..1].
 * - t < start => 0
 * - Attack: smooth ease-out rise from 0 -> 1 over attackDur
 * - Hold: constant 1.0 over holdDur
 * - Decay: smooth ease-in-out fall from 1 -> 0 over decayDur
 */
export function attackHoldDecay(
  t: number,
  start: number,
  attackDur: number,
  holdDur: number,
  decayDur: number
): number {
  if (!Number.isFinite(t) || !Number.isFinite(start)) return 0;
  const elapsed = t - start;
  if (elapsed < 0) return 0;

  const aDur = Math.max(0, attackDur);
  const hDur = Math.max(0, holdDur);
  const dDur = Math.max(0, decayDur);

  if (aDur > 0 && elapsed < aDur) {
    const p = clamp01(elapsed / aDur);
    // Ease-out cubic for snappy impact onset
    return 1 - Math.pow(1 - p, 3);
  }
  const afterAttack = elapsed - aDur;
  if (afterAttack <= hDur) {
    return 1;
  }
  const afterHold = afterAttack - hDur;
  if (dDur > 0 && afterHold < dDur) {
    const p = clamp01(afterHold / dDur);
    // Smooth cosine decay back to 0
    return 0.5 * (1 + Math.cos(Math.PI * p));
  }
  return 0;
}

interface ImpactEvent {
  startFrame: number;
  hitstopFrames: number;
  intensity: number; // 0.5 .. 1.0
}

function resolveCueStartFrame(beat: StoryBeat, cue: NonNullable<StoryBeat['actionCues']>[number], fps: number): number {
  const beatDur = Math.max(1.2, Number.isFinite(beat.duration) ? beat.duration : 4);
  const maxFrame = Math.max(1, Math.round(beatDur * fps) - 1);
  if (typeof cue.frame === 'number' && Number.isFinite(cue.frame)) {
    return Math.max(0, Math.min(maxFrame, Math.round(cue.frame)));
  }
  if (typeof cue.timeSec === 'number' && Number.isFinite(cue.timeSec)) {
    return Math.max(0, Math.min(maxFrame, Math.round(cue.timeSec * fps)));
  }
  if (typeof cue.at === 'number' && Number.isFinite(cue.at)) {
    return Math.max(0, Math.min(maxFrame, Math.round(clamp01(cue.at) * beatDur * fps)));
  }
  if (typeof cue.triggerPhrase === 'string' && cue.triggerPhrase.trim() && beat.dialogue) {
    const idx = beat.dialogue.toLowerCase().indexOf(cue.triggerPhrase.trim().toLowerCase());
    if (idx >= 0) {
      const frac = idx / Math.max(1, beat.dialogue.length);
      return Math.max(0, Math.min(maxFrame, Math.round(frac * beatDur * fps)));
    }
  }
  return Math.round(beatDur * 0.35 * fps);
}

function collectImpactEvents(beat: StoryBeat, fps: number): ImpactEvent[] {
  const events: ImpactEvent[] = [];
  const beatDur = Math.max(1.2, Number.isFinite(beat.duration) ? beat.duration : 4);
  const maxFrame = Math.max(1, Math.round(beatDur * fps) - 1);

  // 1. Sub-beat action cues
  if (Array.isArray(beat.actionCues)) {
    for (const cue of beat.actionCues) {
      const isAttack = cue.pose === 'attack';
      const isHeavyPunch = typeof cue.cameraPunch === 'number' && cue.cameraPunch >= 0.5;
      const isImpactSfx = Boolean(cue.sfx && IMPACT_SFX.has(cue.sfx));
      const isImpactFx = Boolean(cue.fx && IMPACT_FX.has(cue.fx));

      if (!isAttack && !isHeavyPunch && !isImpactSfx && !isImpactFx) continue;

      const startFrame = resolveCueStartFrame(beat, cue, fps);
      let weight = 0;
      if (isAttack) weight += 0.45;
      if (isHeavyPunch) weight += Math.min(0.6, (cue.cameraPunch || 0.5) * 0.65);
      if (isImpactSfx) weight += 0.4;
      if (isImpactFx) weight += 0.45;

      const intensity = Math.max(0.55, Math.min(1, weight));
      const hitstopFrames = intensity >= 0.9 ? 4 : intensity >= 0.72 ? 3 : 2;
      events.push({ startFrame, hitstopFrames, intensity });
    }
  }

  // 2. Beat-level impact SFX or FX (only if no cue already sits within 8 frames)
  const beatHasImpactSfx = Boolean(beat.sfx && IMPACT_SFX.has(beat.sfx));
  const beatHasImpactFx = Boolean(beat.fx && IMPACT_FX.has(beat.fx));
  if (beatHasImpactSfx || beatHasImpactFx) {
    const startSec =
      beatHasImpactSfx && typeof beat.sfxOffsetSec === 'number' && Number.isFinite(beat.sfxOffsetSec)
        ? Math.max(0, Math.min(beatDur - 0.1, beat.sfxOffsetSec))
        : Math.min(beatDur * 0.22, 0.45);
    const startFrame = Math.max(0, Math.min(maxFrame, Math.round(startSec * fps)));
    const nearby = events.some((e) => Math.abs(e.startFrame - startFrame) <= 8);
    if (!nearby) {
      const intensity = beatHasImpactSfx && beatHasImpactFx ? 0.92 : 0.7;
      const hitstopFrames = intensity >= 0.9 ? 4 : 3;
      events.push({ startFrame, hitstopFrames, intensity });
    }
  }

  events.sort((a, b) => a.startFrame - b.startFrame);
  return events;
}

/**
 * Pure deterministic Hit Stop & Impact Envelope evaluator.
 * When `enabled === false`, returns a neutral inactive HitstopState cleanly.
 */
export function computeHitstopState(
  beat: StoryBeat,
  localFrame: number,
  fps = STUDIO_FPS,
  enabled = true
): HitstopState {
  const safeFrame = Math.max(0, Math.floor(Number.isFinite(localFrame) ? localFrame : 0));
  const safeFps = Math.max(12, Math.min(120, Math.round(fps || STUDIO_FPS)));

  if (!enabled || beat.frame === 'chapter_title' || beat.frame === 'end_screen' || beat.shot === 'motion_card') {
    return {
      isFrozen: false,
      frozenLocalFrame: safeFrame,
      impactEnvelope: 0,
      chromaticKickPx: 0,
      flashAlpha: 0,
      hitstopFrames: 0,
      shakeX: 0,
      shakeY: 0,
      impactAnchorFrame: -1,
    };
  }

  const events = collectImpactEvents(beat, safeFps);
  if (events.length === 0) {
    return {
      isFrozen: false,
      frozenLocalFrame: safeFrame,
      impactEnvelope: 0,
      chromaticKickPx: 0,
      flashAlpha: 0,
      hitstopFrames: 0,
      shakeX: 0,
      shakeY: 0,
      impactAnchorFrame: -1,
    };
  }

  const tSec = safeFrame / safeFps;
  let activeFrozen = false;
  let frozenLocalFrame = safeFrame;
  let bestEnvelope = 0;
  let bestIntensity = 0;
  let bestHitstopFrames = 0;
  let bestAnchorFrame = -1;

  for (const ev of events) {
    const startSec = ev.startFrame / safeFps;
    const holdSec = ev.hitstopFrames / safeFps;
    // Instant strike impact peak on anchor frame, hold across freeze window, crisp 0.22s decay
    const env = attackHoldDecay(tSec, startSec, 0, holdSec, 0.22) * ev.intensity;
    if (env > bestEnvelope) {
      bestEnvelope = env;
      bestIntensity = ev.intensity;
      bestHitstopFrames = ev.hitstopFrames;
      bestAnchorFrame = ev.startFrame;
    }

    if (safeFrame >= ev.startFrame && safeFrame < ev.startFrame + ev.hitstopFrames) {
      activeFrozen = true;
      frozenLocalFrame = ev.startFrame;
      bestHitstopFrames = ev.hitstopFrames;
      bestAnchorFrame = ev.startFrame;
      bestIntensity = Math.max(bestIntensity, ev.intensity);
    }
  }

  if (bestEnvelope <= 0.004 && !activeFrozen) {
    return {
      isFrozen: false,
      frozenLocalFrame: safeFrame,
      impactEnvelope: 0,
      chromaticKickPx: 0,
      flashAlpha: 0,
      hitstopFrames: 0,
      shakeX: 0,
      shakeY: 0,
      impactAnchorFrame: -1,
    };
  }

  const envClamped = clamp01(bestEnvelope);
  const chromaticKickPx = Number((envClamped * (activeFrozen ? 6.5 : 3.8) * bestIntensity).toFixed(2));
  const flashAlpha = Number((envClamped * (activeFrozen ? 0.28 : 0.14) * bestIntensity).toFixed(3));

  // Deterministic high-frequency micro-shake during freeze & initial decay
  const shakeAmp = envClamped * (activeFrozen ? 1.0 : 0.45);
  const shakeX = Number((Math.sin(safeFrame * 3.7 + bestAnchorFrame * 1.1) * shakeAmp).toFixed(4));
  const shakeY = Number((Math.cos(safeFrame * 4.3 + bestAnchorFrame * 0.7) * shakeAmp).toFixed(4));

  return {
    isFrozen: activeFrozen,
    frozenLocalFrame,
    impactEnvelope: Number(envClamped.toFixed(4)),
    chromaticKickPx,
    flashAlpha,
    hitstopFrames: bestHitstopFrames,
    shakeX,
    shakeY,
    impactAnchorFrame: bestAnchorFrame,
  };
}

/**
 * Zero-allocation deterministic impact flash, radial shockwave ring & chromatic edge kicks.
 */
export function drawImpactShockOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  hitstop: HitstopState,
  anchorX: number,
  anchorY: number,
  accentHex: string,
  s: number
): void {
  if (hitstop.impactEnvelope <= 0.01 && !hitstop.isFrozen) return;

  const env = hitstop.impactEnvelope;
  ctx.save();

  // 1. Brief impact flash wash
  if (hitstop.flashAlpha > 0.01) {
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(255, 250, 238, ${Math.min(0.32, hitstop.flashAlpha).toFixed(3)})`;
    ctx.fillRect(0, 0, w, h);
  }

  // 2. Expanding radial shock ring centered on strike anchor
  const expansion = 1 - env;
  const ringR = (38 + expansion * 240) * s;
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = accentHex || '#ffd452';
  ctx.globalAlpha = Math.min(0.85, env * 0.82);
  ctx.lineWidth = Math.max(1.5, (hitstop.isFrozen ? 7 : 3.5) * env * s);
  ctx.beginPath();
  ctx.arc(anchorX, anchorY, ringR, 0, Math.PI * 2);
  ctx.stroke();

  // Inner sharp white core ring during hitstop freeze
  if (hitstop.isFrozen) {
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = Math.min(0.9, env * 0.9);
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.arc(anchorX, anchorY, ringR * 0.62, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 3. Deterministic impact speed-ticks around strike origin
  const tickCount = 12;
  ctx.strokeStyle = '#ffffff';
  ctx.globalAlpha = Math.min(0.75, env * 0.68);
  ctx.lineWidth = 2 * s;
  for (let i = 0; i < tickCount; i++) {
    const ang = (i / tickCount) * Math.PI * 2 + (hitstop.impactAnchorFrame % 7) * 0.19;
    const r0 = ringR * 0.85;
    const r1 = ringR + (24 + (i % 3) * 14) * env * s;
    ctx.beginPath();
    ctx.moveTo(anchorX + Math.cos(ang) * r0, anchorY + Math.sin(ang) * r0);
    ctx.lineTo(anchorX + Math.cos(ang) * r1, anchorY + Math.sin(ang) * r1);
    ctx.stroke();
  }

  // 4. Chromatic kick edge bars (simulates RGB split punch without allocating offscreen buffers)
  if (hitstop.chromaticKickPx >= 1) {
    const k = hitstop.chromaticKickPx * s;
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = Math.min(0.24, env * 0.22);
    ctx.fillStyle = '#ff2a5f';
    ctx.fillRect(0, 0, k * 2.4, h);
    ctx.fillStyle = '#22e5ff';
    ctx.fillRect(w - k * 2.4, 0, k * 2.4, h);
  }

  ctx.restore();
}
