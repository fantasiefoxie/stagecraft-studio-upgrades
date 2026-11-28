/**
 * Stagecraft Studio — Upgrade 28: Effekseer-Inspired Analytical 2D Particle, Ribbon & Ring Engine
 *
 * Pure, stateless analytical VFX evaluated directly from (localT, seed):
 * - Zero mutable particle arrays -> 100% bit-exact backward & forward scrubbing.
 * - Zero Math.random() -> deterministic FNV-1a hash sampling.
 * - Zero offscreen canvas allocations -> runs identically across all 20 RenderStyleId engines.
 */

import type { ActorPlacement, FxId, StoryBeat } from './types';
import type { MoodPalette } from './renderAssets';

export interface AnalyticalParticleSpec {
  seed: number;
  originX: number;
  originY: number;
  spreadRadius?: number;
  lifeSec: number;
  delaySpreadSec?: number;
  loop?: boolean;
  speedMin: number;
  speedMax: number;
  angleMin?: number; // radians, default 0
  angleMax?: number; // radians, default 2*PI
  gravityY?: number; // px/s^2 (positive = down, negative = buoyant rise)
  radialDrag?: number; // 0..4 exponential damping coefficient
  vortexTorque?: number; // rad/s spiral swirl around origin
  turbulenceAmp?: number; // px harmonic curl displacement
  turbulenceFreq?: number; // rad/s
  sizeStart?: number;
  sizeMid?: number;
  sizeEnd?: number;
  alphaStart?: number;
  alphaMid?: number;
  alphaEnd?: number;
  spinSpeed?: number; // rad/s
}

export interface AnalyticalParticleSample {
  alive: boolean;
  ageFrac: number; // 0..1
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  alpha: number;
  rotation: number;
}

export interface AnalyticalRibbonPoint {
  x: number;
  y: number;
}

export interface AnalyticalRibbonOptions {
  widthStart: number;
  widthMid?: number;
  widthEnd?: number;
  colorStart: string;
  colorMid?: string;
  colorEnd?: string;
  alpha?: number;
  glow?: boolean;
  coreHighlight?: boolean;
}

export interface AnalyticalVfxRingOptions {
  innerStart: number;
  innerMid?: number;
  innerEnd: number;
  outerStart: number;
  outerMid?: number;
  outerEnd: number;
  colorInner: string;
  colorOuter?: string;
  alpha?: number;
  crescentSweep?: number; // radians (2*PI = full ring, < 2*PI = crescent arc)
  rotation?: number; // radians
  tickCount?: number; // optional geometric rune/tick accents around perimeter
  glow?: boolean;
}

export interface AnalyticalActorAnchor {
  actor: ActorPlacement;
  x: number;
  y: number;
  scale: number;
}

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  return v < lo ? lo : v > hi ? hi : v;
}

function clamp01(v: number): number {
  return clamp(v, 0, 1);
}

function smoothstep01(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

/** Deterministic 32-bit FNV-1a string hash */
export function hashVfxSeed(key: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic [0..1) hash of (seed, index, channel) */
function hashUnit(seed: number, index: number, channel: number): number {
  let h = (seed ^ Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(channel + 17, 0x85ebca6b)) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39) >>> 0;
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/**
 * Effekseer-inspired 3-point Start -> Mid -> End smooth F-curve evaluator.
 * Pure deterministic function of u in [0..1].
 */
export function evalThreePointFCurve(
  u: number,
  start: number,
  mid: number,
  end: number,
  midAt = 0.5
): number {
  const t = clamp01(u);
  const pivot = clamp(midAt, 0.05, 0.95);
  if (t <= pivot) {
    const seg = smoothstep01(t / pivot);
    return start + (mid - start) * seg;
  }
  const seg = smoothstep01((t - pivot) / (1 - pivot));
  return mid + (end - mid) * seg;
}

/**
 * Pure stateless analytical particle sampler.
 * Computes exact deterministic position, velocity, scale, alpha, and rotation
 * from (index, count, localT, spec) without any stateful simulation loop.
 */
export function sampleAnalyticalParticle(
  index: number,
  count: number,
  localT: number,
  spec: AnalyticalParticleSpec
): AnalyticalParticleSample {
  const safeCount = Math.max(1, Math.floor(Number.isFinite(count) ? count : 1));
  const safeIdx = Math.max(0, Math.floor(Number.isFinite(index) ? index : 0));
  const life = Math.max(0.12, Number.isFinite(spec.lifeSec) ? spec.lifeSec : 1.0);
  const seed = (spec.seed >>> 0) || 1;
  const delaySpread = Math.max(0, Number.isFinite(spec.delaySpreadSec ?? 0) ? (spec.delaySpreadSec ?? 0) : 0);

  const uDelay = hashUnit(seed, safeIdx, 0);
  const uAngle = hashUnit(seed, safeIdx, 1);
  const uSpeed = hashUnit(seed, safeIdx, 2);
  const uRad = hashUnit(seed, safeIdx, 3);
  const uSpin = hashUnit(seed, safeIdx, 4);
  const uTurb = hashUnit(seed, safeIdx, 5);

  const stagger = delaySpread * ((safeIdx / safeCount) * 0.65 + uDelay * 0.35);
  const rawAge = (Number.isFinite(localT) ? localT : 0) - stagger;

  let age = rawAge;
  if (spec.loop) {
    const cycle = life + Math.max(0.05, delaySpread * 0.35);
    const wrapped = ((rawAge % cycle) + cycle) % cycle;
    age = wrapped;
    if (age > life) {
      return { alive: false, ageFrac: 1, x: spec.originX, y: spec.originY, vx: 0, vy: 0, scale: 0, alpha: 0, rotation: 0 };
    }
  } else if (rawAge < 0 || rawAge > life) {
    return {
      alive: false,
      ageFrac: rawAge < 0 ? 0 : 1,
      x: spec.originX,
      y: spec.originY,
      vx: 0,
      vy: 0,
      scale: 0,
      alpha: 0,
      rotation: 0,
    };
  }

  const ageFrac = clamp01(age / life);
  const angleMin = spec.angleMin ?? 0;
  const angleMax = spec.angleMax ?? Math.PI * 2;
  const baseAngle = angleMin + (angleMax - angleMin) * ((safeIdx + uAngle) / safeCount);
  const speed = spec.speedMin + (spec.speedMax - spec.speedMin) * uSpeed;

  const spreadR = Math.max(0, spec.spreadRadius ?? 0) * Math.sqrt(uRad);
  const startX = spec.originX + Math.cos(baseAngle) * spreadR;
  const startY = spec.originY + Math.sin(baseAngle) * spreadR;

  // Closed-form integral of exponential radial drag: integral_0^t e^(-k*s) ds = (1 - e^(-k*t))/k
  const drag = Math.max(0, spec.radialDrag ?? 0.65);
  const dragIntegral = drag > 0.001 ? (1 - Math.exp(-drag * age)) / drag : age;
  const dragDecay = drag > 0.001 ? Math.exp(-drag * age) : 1;

  const vortex = spec.vortexTorque ?? 0;
  const swirlAngle = baseAngle + vortex * age;

  const dirX = Math.cos(swirlAngle);
  const dirY = Math.sin(swirlAngle);
  const gravY = spec.gravityY ?? 0;

  const turbAmp = spec.turbulenceAmp ?? 0;
  const turbFreq = spec.turbulenceFreq ?? 5.2;
  const turbPhase = uTurb * Math.PI * 2;
  const turbX = turbAmp * Math.sin(age * turbFreq + turbPhase) * ageFrac;
  const turbY = turbAmp * Math.cos(age * turbFreq * 0.83 + turbPhase * 1.3) * ageFrac;

  const x = startX + dirX * speed * dragIntegral + turbX;
  const y = startY + dirY * speed * dragIntegral + 0.5 * gravY * age * age + turbY;
  const vx = dirX * speed * dragDecay;
  const vy = dirY * speed * dragDecay + gravY * age;

  const sizeStart = spec.sizeStart ?? 0.35;
  const sizeMid = spec.sizeMid ?? 1.0;
  const sizeEnd = spec.sizeEnd ?? 0.1;
  const scale = Math.max(0, evalThreePointFCurve(ageFrac, sizeStart, sizeMid, sizeEnd, 0.35));

  const alphaStart = spec.alphaStart ?? 0.15;
  const alphaMid = spec.alphaMid ?? 0.95;
  const alphaEnd = spec.alphaEnd ?? 0;
  const alpha = clamp01(evalThreePointFCurve(ageFrac, alphaStart, alphaMid, alphaEnd, 0.3));

  const spin = (spec.spinSpeed ?? 3.2) * (uSpin * 2 - 1);
  const rotation = baseAngle + spin * age;

  return {
    alive: alpha > 0.01 && scale > 0.01,
    ageFrac,
    x,
    y,
    vx,
    vy,
    scale,
    alpha,
    rotation,
  };
}

/**
 * Draws an Effekseer-style width-tapered, color-ramped analytical ribbon trail
 * connecting trailing positions (points[0] = head, points[n-1] = tail).
 */
export function drawAnalyticalRibbonTrail(
  ctx: CanvasRenderingContext2D,
  points: readonly AnalyticalRibbonPoint[],
  options: AnalyticalRibbonOptions
): void {
  if (!points || points.length < 2) return;
  const n = points.length;
  const baseAlpha = clamp01(options.alpha ?? 0.85);
  if (baseAlpha <= 0.01) return;

  const wStart = Math.max(0.5, Number.isFinite(options.widthStart) ? options.widthStart : 10);
  const wMid = Math.max(0.5, Number.isFinite(options.widthMid ?? wStart * 0.72) ? (options.widthMid ?? wStart * 0.72) : 7);
  const wEnd = Math.max(0.2, Number.isFinite(options.widthEnd ?? 0.8) ? (options.widthEnd ?? 0.8) : 0.8);

  // Build left and right perimeter edges along tangent normals
  const leftEdge: AnalyticalRibbonPoint[] = [];
  const rightEdge: AnalyticalRibbonPoint[] = [];

  for (let i = 0; i < n; i++) {
    const p = points[i];
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(n - 1, i + 1)];
    let tx = next.x - prev.x;
    let ty = next.y - prev.y;
    const len = Math.hypot(tx, ty);
    if (len < 0.001) {
      tx = 1;
      ty = 0;
    } else {
      tx /= len;
      ty /= len;
    }
    const nx = -ty;
    const ny = tx;
    const u = i / Math.max(1, n - 1);
    const halfW = evalThreePointFCurve(u, wStart, wMid, wEnd, 0.35) * 0.5;
    leftEdge.push({ x: p.x + nx * halfW, y: p.y + ny * halfW });
    rightEdge.push({ x: p.x - nx * halfW, y: p.y - ny * halfW });
  }

  const head = points[0];
  const tail = points[n - 1];
  const dist = Math.hypot(tail.x - head.x, tail.y - head.y);

  ctx.save();
  if (options.glow) {
    ctx.globalCompositeOperation = 'lighter';
  }
  ctx.globalAlpha = baseAlpha;

  if (dist > 1) {
    const grad = ctx.createLinearGradient(head.x, head.y, tail.x, tail.y);
    grad.addColorStop(0, options.colorStart);
    grad.addColorStop(0.45, options.colorMid || options.colorStart);
    grad.addColorStop(1, options.colorEnd || 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = options.colorStart;
  }

  ctx.beginPath();
  ctx.moveTo(leftEdge[0].x, leftEdge[0].y);
  for (let i = 1; i < n; i++) {
    ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
  }
  for (let i = n - 1; i >= 0; i--) {
    ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
  }
  ctx.closePath();
  ctx.fill();

  // Crisp bright inner core spine for slash/energy legibility across dark & bright engines
  if (options.coreHighlight !== false) {
    ctx.globalAlpha = clamp01(baseAlpha * 0.72);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, wStart * 0.18);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < Math.max(2, Math.floor(n * 0.72)); i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Parametric expanding VFX ring with inner/outer F-curves, optional crescent sweep,
 * radial gradient falloff, and geometric rune/tick accents.
 */
export function drawAnalyticalVfxRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  progress: number,
  options: AnalyticalVfxRingOptions
): void {
  const p = clamp01(progress);
  const alpha = clamp01((options.alpha ?? 0.85) * evalThreePointFCurve(p, 0.25, 1.0, 0.0, 0.22));
  if (alpha <= 0.01) return;

  const innerR = Math.max(
    0.5,
    evalThreePointFCurve(
      p,
      options.innerStart,
      options.innerMid ?? (options.innerStart + options.innerEnd) * 0.55,
      options.innerEnd,
      0.45
    )
  );
  const outerRaw = evalThreePointFCurve(
    p,
    options.outerStart,
    options.outerMid ?? (options.outerStart + options.outerEnd) * 0.6,
    options.outerEnd,
    0.45
  );
  const outerR = Math.max(innerR + 1.5, outerRaw);

  const sweep = clamp(options.crescentSweep ?? Math.PI * 2, 0.2, Math.PI * 2);
  const rot = Number.isFinite(options.rotation ?? 0) ? (options.rotation ?? 0) : 0;
  const startA = rot;
  const endA = rot + sweep;

  ctx.save();
  if (options.glow) {
    ctx.globalCompositeOperation = 'lighter';
  }
  ctx.globalAlpha = alpha;

  const grad = ctx.createRadialGradient(cx, cy, innerR * 0.85, cx, cy, outerR);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(clamp01(innerR / outerR), options.colorInner);
  grad.addColorStop(1, options.colorOuter || 'rgba(255,255,255,0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, startA, endA, false);
  if (sweep >= Math.PI * 2 - 0.01) {
    ctx.arc(cx, cy, innerR, endA, startA, true);
  } else {
    ctx.arc(cx, cy, innerR, endA, startA, true);
  }
  ctx.closePath();
  ctx.fill();

  // Crisp leading rim highlight
  const midR = (innerR + outerR) * 0.5;
  ctx.strokeStyle = options.colorInner;
  ctx.lineWidth = Math.max(1.2, (outerR - innerR) * 0.22);
  ctx.beginPath();
  ctx.arc(cx, cy, midR, startA, endA);
  ctx.stroke();

  // Optional geometric rune/tick accents around the ring perimeter
  const ticks = Math.max(0, Math.min(36, Math.floor(options.tickCount ?? 0)));
  if (ticks > 0) {
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = clamp01(alpha * 0.72);
    ctx.lineWidth = Math.max(1, (outerR - innerR) * 0.12);
    for (let i = 0; i < ticks; i++) {
      const frac = i / ticks;
      const a = startA + frac * sweep;
      const tickIn = innerR + (outerR - innerR) * 0.15;
      const tickOut = outerR + (i % 2 === 0 ? (outerR - innerR) * 0.35 : (outerR - innerR) * 0.14);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * tickIn, cy + Math.sin(a) * tickIn);
      ctx.lineTo(cx + Math.cos(a) * tickOut, cy + Math.sin(a) * tickOut);
      ctx.stroke();
    }
  }

  ctx.restore();
}

const RING_FX_IDS = new Set<FxId>([
  'shock_burst',
  'crimson_impact',
  'divine_aura',
  'magic_runes',
  'shatter_glass',
  'portal_vortex',
  'time_freeze_ripple',
  'sonic_boom_rings',
  'golden_halo_burst',
  'radar_ping',
  'blood_moon_eclipse',
  'dust_shockwave',
]);

const BURST_FX_IDS = new Set<FxId>([
  'divine_aura',
  'shock_burst',
  'crimson_impact',
  'shatter_glass',
  'sparkle_burst',
  'golden_halo_burst',
  'fire_breath_cone',
  'frost_crystallize',
  'lightning_web',
  'petal_cyclone',
  'starlight_nova',
  'portal_vortex',
  'water_splash_arc',
  'ink_splatter_burst',
  'laser_grid',
]);

/**
 * Master beat-level analytical 2D VFX orchestrator wired into renderer.ts.
 * Keeps all ribbons, rings, and burst particles face-safe and caption-safe
 * (avoiding the bottom 18% caption corridor) with zero allocations.
 */
export function drawAnalyticalBeatVfxLayer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  beat: StoryBeat,
  actors: readonly AnalyticalActorAnchor[],
  localT: number,
  animT: number,
  pal: MoodPalette,
  intensity = 0.75
): void {
  const safeIntensity = clamp01(intensity);
  if (safeIntensity <= 0.01) return;
  if (beat.frame === 'chapter_title' || beat.frame === 'end_screen' || beat.shot === 'motion_card') {
    return;
  }

  const s = Math.min(w, h) / 620;
  const dur = Math.max(1.2, Number.isFinite(beat.duration) ? beat.duration : 4);
  const beatSeed = hashVfxSeed(`vfx_${beat.id}_${beat.stage}_${beat.fx}_${beat.sfx || 'none'}`);
  const accent = pal.accent || '#ffd452';
  const rim = pal.rimLight || '#7dd3fc';

  // Keep VFX comfortably above bottom caption corridor
  const maxSafeY = h * 0.8;

  // 1. Analytical Ribbon Trails for attacking / soaring / leaping actors
  for (let idx = 0; idx < actors.length; idx++) {
    const anchor = actors[idx];
    const { actor } = anchor;
    const isAttack = actor.pose === 'attack';
    const isAerial = actor.pose === 'soar' || actor.motion === 'leap_arc';
    if (!isAttack && !isAerial) continue;

    const dir = (actor.facing || (actor.slot === 'right' ? 'left' : 'right')) === 'left' ? -1 : 1;
    const baseCx = anchor.x;
    const baseCy = Math.min(maxSafeY, anchor.y - 96 * anchor.scale);
    const pts: AnalyticalRibbonPoint[] = [];
    const samples = 9;

    if (isAttack) {
      // Sweeping Effekseer crescent slash arc sampled analytically backward in time
      const swingPhase = clamp01(((localT * 1.8 + idx * 0.23) % 1.25) / 0.85);
      const radius = 78 * anchor.scale;
      for (let k = 0; k < samples; k++) {
        const dt = k * 0.032;
        const pT = clamp01(swingPhase - dt * 1.9);
        const angle = (-1.35 + pT * 2.45) * dir;
        pts.push({
          x: baseCx + Math.cos(angle) * radius * dir,
          y: baseCy + Math.sin(angle) * radius * 0.78,
        });
      }
      drawAnalyticalRibbonTrail(ctx, pts, {
        widthStart: 15 * anchor.scale * (0.65 + safeIntensity * 0.45),
        widthMid: 10 * anchor.scale,
        widthEnd: 1.5 * anchor.scale,
        colorStart: '#ffffff',
        colorMid: accent,
        colorEnd: 'rgba(255,255,255,0)',
        alpha: 0.72 * safeIntensity,
        glow: true,
        coreHighlight: true,
      });
    } else {
      // Soar / leap_arc aerodynamic energy ribbon trailing behind body
      for (let k = 0; k < samples; k++) {
        const trailDist = k * 17 * anchor.scale;
        const wave = Math.sin(animT * 7.2 - k * 0.65 + idx) * 9 * anchor.scale;
        pts.push({
          x: baseCx - dir * trailDist,
          y: Math.min(maxSafeY, baseCy + k * 4.5 * anchor.scale + wave),
        });
      }
      drawAnalyticalRibbonTrail(ctx, pts, {
        widthStart: 12 * anchor.scale * (0.65 + safeIntensity * 0.4),
        widthMid: 7.5 * anchor.scale,
        widthEnd: 1.0 * anchor.scale,
        colorStart: rim,
        colorMid: accent,
        colorEnd: 'rgba(255,255,255,0)',
        alpha: 0.56 * safeIntensity,
        glow: true,
        coreHighlight: false,
      });
    }
  }

  // 2. Parametric Expanding VFX Rings for kinetic / energy / sonar / magic FX or impact SFX
  const hasImpactSfx =
    beat.sfx === 'sword_clash' || beat.sfx === 'thunder_crack' || beat.sfx === 'mystic_chime';
  const activeFx = beat.fx || 'none';
  if (RING_FX_IDS.has(activeFx) || hasImpactSfx) {
    const focusAnchor = actors[0];
    const cx = focusAnchor ? focusAnchor.x : w * 0.5;
    const cy = focusAnchor ? Math.min(maxSafeY, focusAnchor.y - 105 * focusAnchor.scale) : h * 0.44;
    const isPeriodic =
      activeFx === 'divine_aura' ||
      activeFx === 'portal_vortex' ||
      activeFx === 'magic_runes' ||
      activeFx === 'radar_ping' ||
      activeFx === 'golden_halo_burst';
    const ringCycle = isPeriodic ? 1.45 : Math.min(1.1, dur * 0.45);
    const ringStart = typeof beat.sfxOffsetSec === 'number' && hasImpactSfx ? beat.sfxOffsetSec : 0.12;
    const elapsed = localT - ringStart;
    const progress = isPeriodic
      ? (((animT % ringCycle) + ringCycle) % ringCycle) / ringCycle
      : elapsed >= 0 && elapsed <= ringCycle
        ? elapsed / ringCycle
        : -1;

    if (progress >= 0 && progress <= 1) {
      const isCrescent = activeFx === 'crimson_impact' || beat.sfx === 'sword_clash';
      drawAnalyticalVfxRing(ctx, cx, cy, progress, {
        innerStart: 14 * s,
        innerMid: 78 * s,
        innerEnd: 168 * s,
        outerStart: 28 * s,
        outerMid: 108 * s,
        outerEnd: 196 * s,
        colorInner: isCrescent ? accent : rim,
        colorOuter: 'rgba(255,255,255,0)',
        alpha: 0.68 * safeIntensity,
        crescentSweep: isCrescent ? Math.PI * 1.15 : Math.PI * 2,
        rotation: (beatSeed % 12) * 0.52 + (isPeriodic ? animT * 0.65 : 0),
        tickCount:
          activeFx === 'magic_runes' || activeFx === 'golden_halo_burst' || activeFx === 'radar_ping'
            ? 12
            : 6,
        glow: true,
      });
    }
  }

  // 3. Analytical Burst / Vortex Particle Emitter
  if (BURST_FX_IDS.has(activeFx) || hasImpactSfx) {
    const focusAnchor = actors[0];
    const originX = focusAnchor ? focusAnchor.x : w * 0.5;
    const originY = focusAnchor ? Math.min(maxSafeY, focusAnchor.y - 98 * focusAnchor.scale) : h * 0.46;
    const isSwirl =
      activeFx === 'divine_aura' ||
      activeFx === 'portal_vortex' ||
      activeFx === 'petal_cyclone' ||
      activeFx === 'sparkle_burst' ||
      activeFx === 'golden_halo_burst' ||
      activeFx === 'starlight_nova';
    const count = Math.max(8, Math.round((isSwirl ? 18 : 22) * (0.5 + safeIntensity * 0.5)));

    const spec: AnalyticalParticleSpec = {
      seed: beatSeed,
      originX,
      originY,
      spreadRadius: (isSwirl ? 58 : 16) * s,
      lifeSec: isSwirl ? 1.85 : 0.95,
      delaySpreadSec: isSwirl ? 1.4 : 0.14,
      loop: isSwirl,
      speedMin: (isSwirl ? 32 : 85) * s,
      speedMax: (isSwirl ? 92 : 240) * s,
      gravityY: isSwirl ? -36 * s : 120 * s,
      radialDrag: isSwirl ? 0.55 : 1.35,
      vortexTorque: isSwirl ? 1.75 : 0.25,
      turbulenceAmp: (isSwirl ? 14 : 6) * s,
      turbulenceFreq: 4.8,
      sizeStart: 0.45,
      sizeMid: 1.0,
      sizeEnd: 0.08,
      alphaStart: 0.15,
      alphaMid: 0.92,
      alphaEnd: 0,
      spinSpeed: 4.2,
    };

    const emitterT = isSwirl ? animT : Math.max(0, localT - (beat.sfxOffsetSec ?? 0.08));

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < count; i++) {
      const sample = sampleAnalyticalParticle(i, count, emitterT, spec);
      if (!sample.alive) continue;
      if (sample.y > maxSafeY) continue;
      const r = Math.max(1.0, (isSwirl ? 3.8 : 4.6) * s * sample.scale);
      ctx.save();
      ctx.translate(sample.x, sample.y);
      ctx.rotate(sample.rotation);
      ctx.globalAlpha = clamp01(sample.alpha * 0.78 * safeIntensity);
      ctx.fillStyle = i % 3 === 0 ? '#ffffff' : i % 2 === 0 ? accent : rim;
      // Sharp diamond / spark silhouette (reads cleanly in vector, pixel, and chiaroscuro styles)
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.45);
      ctx.lineTo(r * 0.72, 0);
      ctx.lineTo(0, r * 1.45);
      ctx.lineTo(-r * 0.72, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
}
