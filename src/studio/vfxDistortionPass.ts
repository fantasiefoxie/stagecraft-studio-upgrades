/**
 * Stagecraft Studio — Upgrade 29: Pooled 2D Shockwave Refraction & Distortion Pass
 *
 * Effekseer-inspired screen-space distortion ring in pure HTML5 Canvas 2D with
 * ZERO per-frame canvas allocations. Copies the active frame once to a module-level
 * pooled scratch canvas, clips concentric expanding ring bands around (anchorX, anchorY),
 * and draws micro-offset refraction slices plus a subtle specular rim.
 *
 * No-ops gracefully in headless/Node mock contexts lacking drawImage(canvas).
 */

import type { FxId, SfxId, StoryBeat } from './types';
import type { HitstopState } from './impactVfx';

export interface ShockwaveDistortionSpec {
  active: boolean;
  anchorX: number;
  anchorY: number;
  progress: number; // 0..1 normalized expansion
  radiusPx: number;
  bandWidthPx: number;
  refractionPx: number;
  rimAlpha: number;
}

interface PooledDistortionBuffer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

let distortionPool: PooledDistortionBuffer | null = null;
let distortionPoolAllocationCount = 0;

function getPooledDistortionBuffer(w: number, h: number): PooledDistortionBuffer | null {
  if (typeof document === 'undefined') return null;
  const safeW = Math.max(1, Math.round(w));
  const safeH = Math.max(1, Math.round(h));
  if (!distortionPool) {
    const canvas = document.createElement('canvas');
    canvas.width = safeW;
    canvas.height = safeH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    distortionPool = { canvas, ctx };
    distortionPoolAllocationCount += 1;
  } else if (distortionPool.canvas.width !== safeW || distortionPool.canvas.height !== safeH) {
    distortionPool.canvas.width = safeW;
    distortionPool.canvas.height = safeH;
  }
  return distortionPool;
}

/** Diagnostic getter for regression tests to verify zero per-frame canvas allocations */
export function getDistortionPoolAllocationCount(): number {
  return distortionPoolAllocationCount;
}

const DISTORTION_FX = new Set<FxId>([
  'shock_burst',
  'crimson_impact',
  'shatter_glass',
  'portal_vortex',
  'time_freeze_ripple',
  'sonic_boom_rings',
]);

const DISTORTION_SFX = new Set<SfxId>(['sword_clash', 'thunder_crack']);

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * Pure deterministic shockwave refraction trigger & geometry solver.
 * Activates on peak impact frames (hitstop.impactEnvelope > 0.08, or distortion FX/SFX)
 * and stays cleanly inactive on calm dialogue beats.
 */
export function computeShockwaveDistortionSpec(
  beat: StoryBeat,
  hitstop: HitstopState,
  localT: number,
  anchorX: number,
  anchorY: number,
  w: number,
  h: number,
  vfxIntensity = 0.75
): ShockwaveDistortionSpec {
  const intensity = clamp01(vfxIntensity);
  const inactive: ShockwaveDistortionSpec = {
    active: false,
    anchorX,
    anchorY,
    progress: 0,
    radiusPx: 0,
    bandWidthPx: 0,
    refractionPx: 0,
    rimAlpha: 0,
  };

  if (intensity <= 0.02 || !Number.isFinite(w) || !Number.isFinite(h) || w < 16 || h < 16) {
    return inactive;
  }
  if (beat.frame === 'chapter_title' || beat.frame === 'end_screen' || beat.shot === 'motion_card') {
    return inactive;
  }

  const s = Math.min(w, h) / 620;
  const maxDim = Math.hypot(w, h) * 0.44;
  const hasImpactEnv = hitstop.impactEnvelope > 0.08;
  const hasDistFx = Boolean(beat.fx && DISTORTION_FX.has(beat.fx));
  const hasDistSfx = Boolean(beat.sfx && DISTORTION_SFX.has(beat.sfx));

  if (!hasImpactEnv && !hasDistFx && !hasDistSfx) {
    return inactive;
  }

  let progress = 0;
  let strength = 0;

  if (hasImpactEnv) {
    progress = clamp01(1 - hitstop.impactEnvelope * 0.85);
    strength = clamp01(hitstop.impactEnvelope * 1.15);
  } else {
    const startSec = hasDistSfx && typeof beat.sfxOffsetSec === 'number' && Number.isFinite(beat.sfxOffsetSec)
      ? Math.max(0, beat.sfxOffsetSec)
      : 0.1;
    const isLoopingRipple = beat.fx === 'portal_vortex' || beat.fx === 'time_freeze_ripple';
    const cycle = isLoopingRipple ? 1.55 : 0.72;
    const elapsed = (Number.isFinite(localT) ? localT : 0) - startSec;
    if (isLoopingRipple) {
      const wrapped = (((Number.isFinite(localT) ? localT : 0) % cycle) + cycle) % cycle;
      progress = wrapped / cycle;
      strength = Math.sin(progress * Math.PI) * 0.72;
    } else if (elapsed >= 0 && elapsed <= cycle) {
      progress = elapsed / cycle;
      strength = (1 - progress) * (1 - progress * 0.35);
    } else {
      return inactive;
    }
  }

  const finalStrength = clamp01(strength * intensity);
  if (finalStrength <= 0.04) return inactive;

  const radiusPx = Math.max(20 * s, 26 * s + progress * maxDim);
  const bandWidthPx = Math.max(8 * s, (16 + 26 * finalStrength) * s);
  const refractionPx = Math.max(1.2, (2.2 + 7.5 * finalStrength) * s);
  const rimAlpha = clamp01(0.18 + 0.38 * finalStrength);

  return {
    active: true,
    anchorX: Number.isFinite(anchorX) ? anchorX : w * 0.5,
    anchorY: Number.isFinite(anchorY) ? anchorY : h * 0.48,
    progress: Number(progress.toFixed(4)),
    radiusPx: Number(radiusPx.toFixed(2)),
    bandWidthPx: Number(bandWidthPx.toFixed(2)),
    refractionPx: Number(refractionPx.toFixed(2)),
    rimAlpha: Number(rimAlpha.toFixed(3)),
  };
}

/**
 * Applies the zero-allocation pooled shockwave refraction pass onto `ctx`.
 * Copies the current frame into the single pooled scratch canvas, clips two concentric
 * ring bands around (anchorX, anchorY), draws zoomed/micro-offset refraction slices,
 * and overlays a crisp subtle specular refraction rim.
 */
export function applyPooledShockwaveDistortion(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  spec: ShockwaveDistortionSpec
): void {
  if (!spec.active || spec.radiusPx <= 1 || spec.bandWidthPx <= 0.5) return;
  const srcCanvas = ctx.canvas;
  if (!srcCanvas || w < 16 || h < 16) return;

  const pool = getPooledDistortionBuffer(w, h);
  if (!pool) return;

  // Snapshot active frame into pooled scratch buffer (guarded for headless mock contexts)
  try {
    pool.ctx.save();
    pool.ctx.setTransform(1, 0, 0, 1, 0, 0);
    pool.ctx.clearRect(0, 0, w, h);
    pool.ctx.drawImage(srcCanvas, 0, 0, w, h, 0, 0, w, h);
    pool.ctx.restore();
  } catch {
    return;
  }

  const cx = spec.anchorX;
  const cy = spec.anchorY;
  const outerR = Math.max(4, spec.radiusPx + spec.bandWidthPx * 0.5);
  const innerR = Math.max(0.5, spec.radiusPx - spec.bandWidthPx * 0.5);
  const scaleFactor = 1 + Math.min(0.06, spec.refractionPx / Math.max(120, Math.min(w, h)));

  // Band 1: Outer expanding refraction ring (radial magnification slice)
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2, false);
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
  ctx.clip('evenodd');

  ctx.translate(cx, cy);
  ctx.scale(scaleFactor, scaleFactor);
  ctx.translate(-cx + spec.refractionPx * 0.35, -cy - spec.refractionPx * 0.25);
  try {
    ctx.drawImage(pool.canvas, 0, 0, w, h);
  } catch {
    ctx.restore();
    return;
  }
  ctx.restore();

  // Band 2: Secondary trailing echo ring with gentle compression offset
  const trailOuter = Math.max(2, innerR * 0.96);
  const trailInner = Math.max(0.5, trailOuter - spec.bandWidthPx * 0.42);
  if (trailOuter - trailInner >= 2) {
    const invScale = 1 - Math.min(0.03, (spec.refractionPx * 0.45) / Math.max(140, Math.min(w, h)));
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.beginPath();
    ctx.arc(cx, cy, trailOuter, 0, Math.PI * 2, false);
    ctx.arc(cx, cy, trailInner, 0, Math.PI * 2, true);
    ctx.clip('evenodd');
    ctx.translate(cx, cy);
    ctx.scale(invScale, invScale);
    ctx.translate(-cx - spec.refractionPx * 0.2, -cy + spec.refractionPx * 0.15);
    ctx.globalAlpha = 0.72;
    try {
      ctx.drawImage(pool.canvas, 0, 0, w, h);
    } catch {
      ctx.restore();
      return;
    }
    ctx.restore();
  }

  // Subtle specular air-lens rim highlight along wave crest
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'screen';
  ctx.strokeStyle = `rgba(245, 250, 255, ${spec.rimAlpha.toFixed(3)})`;
  ctx.lineWidth = Math.max(1.2, spec.bandWidthPx * 0.11);
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(1, spec.radiusPx + spec.bandWidthPx * 0.18), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
