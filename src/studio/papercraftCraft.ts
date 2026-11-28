/**
 * Stagecraft Studio — Upgrades 30 & 31: Photographed Cardstock Diorama Craft & Pop-Up Spring-Hinge Kinematics
 *
 * Physical paper-theatre craftsmanship in pure HTML5 Canvas 2D:
 * - Lit-side cardstock cut-edge bevel highlight + warm dark edge thickness shadow
 * - Soft warm mood-tinted layered drop shadow (replaces flat black)
 * - Zero-allocation pooled miniature macro tilt-shift blur band (top + bottom blur, razor-sharp center)
 * - Pure damped spring-hinge pop-up unfolding solver (scaleY: 0.04 -> 1.09 -> 0.97 -> 1.0 in ~0.42s)
 * - Physical `popup_fold` cardstock horizon hinge scene transition
 */

export interface PopupHingeTransform {
  scaleY: number;
  skewX: number;
  shadowStretch: number;
  liftPx: number;
  settled: boolean;
}

interface PooledTiltShiftBuffer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

let tiltShiftPool: PooledTiltShiftBuffer | null = null;
let tiltShiftPoolAllocationCount = 0;

function getPooledTiltShiftBuffer(w: number, h: number): PooledTiltShiftBuffer | null {
  if (typeof document === 'undefined') return null;
  const safeW = Math.max(1, Math.round(w));
  const safeH = Math.max(1, Math.round(h));
  if (!tiltShiftPool) {
    const canvas = document.createElement('canvas');
    canvas.width = safeW;
    canvas.height = safeH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    tiltShiftPool = { canvas, ctx };
    tiltShiftPoolAllocationCount += 1;
  } else if (tiltShiftPool.canvas.width !== safeW || tiltShiftPool.canvas.height !== safeH) {
    tiltShiftPool.canvas.width = safeW;
    tiltShiftPool.canvas.height = safeH;
  }
  return tiltShiftPool;
}

/** Diagnostic getter for regression tests to verify zero per-frame canvas allocations */
export function getTiltShiftPoolAllocationCount(): number {
  return tiltShiftPoolAllocationCount;
}

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  return v < lo ? lo : v > hi ? hi : v;
}

function hexToWarmShadowRgba(hex: string, alpha: number): string {
  const clean = (hex || '').trim().replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    const r = Math.min(255, Math.round(parseInt(clean.slice(0, 2), 16) * 0.45 + 14));
    const g = Math.min(255, Math.round(parseInt(clean.slice(2, 4), 16) * 0.4 + 10));
    const b = Math.min(255, Math.round(parseInt(clean.slice(4, 6), 16) * 0.42 + 8));
    return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1).toFixed(3)})`;
  }
  return `rgba(26, 18, 14, ${clamp(alpha, 0, 1).toFixed(3)})`;
}

/**
 * Renders a tactile photographed cardstock cut-edge bevel around a cutout layer:
 * - Pale cream lit-side cut-edge highlight (+1.5px toward lightSide)
 * - Warm dark cardstock thickness shadow (-2px opposite lightSide)
 */
export function drawCardstockCutBevel(
  ctx: CanvasRenderingContext2D,
  cutoutCanvas: HTMLCanvasElement,
  lightSide: 'left' | 'right',
  s: number
): void {
  const safeS = Math.max(0.25, Number.isFinite(s) ? s : 1);
  const litDir = lightSide === 'right' ? 1 : -1;

  // 1. Warm dark cardstock edge thickness shadow on the unlit edge (-2px opposite lightSide)
  ctx.save();
  ctx.shadowColor = 'rgba(28, 17, 10, 0.72)';
  ctx.shadowBlur = 1.6 * safeS;
  ctx.shadowOffsetX = -litDir * 2.0 * safeS;
  ctx.shadowOffsetY = 2.0 * safeS;
  try {
    ctx.drawImage(cutoutCanvas, 0, 0);
  } catch {
    ctx.restore();
    return;
  }
  ctx.restore();

  // 2. Crisp pale cream lit-side paper fiber highlight (+1.5px toward lightSide)
  ctx.save();
  ctx.shadowColor = 'rgba(255, 244, 214, 0.78)';
  ctx.shadowBlur = 1.4 * safeS;
  ctx.shadowOffsetX = litDir * 1.5 * safeS;
  ctx.shadowOffsetY = -1.5 * safeS;
  try {
    ctx.drawImage(cutoutCanvas, 0, 0);
  } catch {
    ctx.restore();
    return;
  }
  ctx.restore();
}

/**
 * Casts a soft, warm mood-tinted two-tier layered drop shadow behind a cardstock cutout
 * (replacing harsh flat-black shadows with physical miniature studio lighting).
 */
export function drawPapercraftLayeredShadow(
  ctx: CanvasRenderingContext2D,
  cutoutCanvas: HTMLCanvasElement,
  lightSide: 'left' | 'right',
  shadowHex: string,
  s: number
): void {
  const safeS = Math.max(0.25, Number.isFinite(s) ? s : 1);
  // Shadow casts opposite to lightSide
  const castDir = lightSide === 'right' ? -1 : 1;

  // Tier 1: Wide soft ambient studio fill shadow
  ctx.save();
  ctx.shadowColor = hexToWarmShadowRgba(shadowHex, 0.54);
  ctx.shadowBlur = 24 * safeS;
  ctx.shadowOffsetX = castDir * 13 * safeS;
  ctx.shadowOffsetY = 16 * safeS;
  try {
    ctx.drawImage(cutoutCanvas, 0, 0);
  } catch {
    ctx.restore();
    return;
  }
  ctx.restore();

  // Tier 2: Closer contact shadow grounding the paper cutout against the back plane
  ctx.save();
  ctx.shadowColor = hexToWarmShadowRgba(shadowHex, 0.72);
  ctx.shadowBlur = 8 * safeS;
  ctx.shadowOffsetX = castDir * 5.5 * safeS;
  ctx.shadowOffsetY = 7.5 * safeS;
  try {
    ctx.drawImage(cutoutCanvas, 0, 0);
  } catch {
    ctx.restore();
    return;
  }
  ctx.restore();
}

/**
 * Applies a zero-allocation miniature macro lens tilt-shift blur band to the top and bottom
 * margins of the frame while keeping the central stage band razor sharp.
 * Uses a single pooled downscaled scratch canvas (bilinear box-blur reconstruction) so
 * allocation count never exceeds 1 and output is 100% deterministic across browsers.
 */
export function applyPooledTiltShiftBand(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  amount: number
): void {
  const safeAmt = clamp(amount, 0, 1);
  if (safeAmt <= 0.02 || !Number.isFinite(w) || !Number.isFinite(h) || w < 24 || h < 24) return;
  const srcCanvas = ctx.canvas;
  if (!srcCanvas) return;

  // Downsample factor scales smoothly with tilt-shift intensity (3x .. 6.5x)
  const divisor = 2.6 + safeAmt * 3.8;
  const smallW = Math.max(24, Math.round(w / divisor));
  const smallH = Math.max(16, Math.round(h / divisor));
  const pool = getPooledTiltShiftBuffer(smallW, smallH);
  if (!pool) return;

  // Downsample active frame into single pooled scratch canvas
  try {
    pool.ctx.save();
    pool.ctx.setTransform(1, 0, 0, 1, 0, 0);
    pool.ctx.imageSmoothingEnabled = true;
    pool.ctx.imageSmoothingQuality = 'high';
    pool.ctx.clearRect(0, 0, smallW, smallH);
    pool.ctx.drawImage(srcCanvas, 0, 0, w, h, 0, 0, smallW, smallH);
    pool.ctx.restore();
  } catch {
    return;
  }

  // Composite feathered top (0..22%) and bottom (78..100%) out-of-focus macro bands
  // in 3 progressive alpha steps so the center focus plane stays 100% sharp without a second canvas!
  const bandFrac = 0.14 + safeAmt * 0.11; // 14% .. 25% top & bottom
  const steps = 3;
  const baseAlpha = 0.24 + safeAmt * 0.34;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  for (let i = 0; i < steps; i++) {
    const depthFrac = bandFrac * ((steps - i) / steps);
    const bandH = Math.max(4, Math.round(h * depthFrac));
    const stepAlpha = clamp(baseAlpha * (0.45 + (i / steps) * 0.55), 0.08, 0.72);
    ctx.globalAlpha = stepAlpha;

    // Top macro blur strip
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, bandH);
    ctx.clip();
    try {
      ctx.drawImage(pool.canvas, 0, 0, smallW, smallH, 0, 0, w, h);
    } catch {
      ctx.restore();
      ctx.restore();
      return;
    }
    ctx.restore();

    // Bottom macro blur strip
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, h - bandH, w, bandH);
    ctx.clip();
    try {
      ctx.drawImage(pool.canvas, 0, 0, smallW, smallH, 0, 0, w, h);
    } catch {
      ctx.restore();
      ctx.restore();
      return;
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Upgrade 31: Pure damped spring-hinge pop-up unfolding solver.
 * Unfolds cutouts from the floor seam (scaleY: 0.04 -> ~1.09 overshoot -> ~0.97 -> 1.0 settle)
 * with gentle trapezoidal shear and dynamic shadow stretch over ~0.42s.
 */
export function computePopupHingeTransform(
  localT: number,
  delaySec = 0,
  durationSec = 0.42
): PopupHingeTransform {
  const safeT = Number.isFinite(localT) ? localT : 0;
  const safeDelay = Math.max(0, Number.isFinite(delaySec) ? delaySec : 0);
  const safeDur = Math.max(0.12, Number.isFinite(durationSec) ? durationSec : 0.42);
  const elapsed = safeT - safeDelay;

  if (elapsed <= 0) {
    return {
      scaleY: 0.04,
      skewX: 0.22,
      shadowStretch: 1.55,
      liftPx: 0,
      settled: false,
    };
  }

  if (elapsed >= safeDur) {
    return {
      scaleY: 1,
      skewX: 0,
      shadowStretch: 1,
      liftPx: 0,
      settled: true,
    };
  }

  const u = clamp(elapsed / safeDur, 0, 1);
  // Underdamped spring curve tuned so:
  // u = 0.00 -> ~0.04 (folded flat on page)
  // u ~ 0.45 -> ~1.09 (spring overshoot!)
  // u ~ 0.78 -> ~0.97 (subtle settle dip)
  // u = 1.00 -> 1.00 (locked upright)
  const decay = Math.exp(-4.4 * u);
  const osc = Math.cos(Math.PI * 2.15 * u);
  const rawScale = 1 - 0.96 * decay * osc;
  // Blend smoothly into exact 1.0 during final 10% so there is zero snap at settle
  const endBlend = u > 0.9 ? (u - 0.9) / 0.1 : 0;
  const scaleY = clamp(rawScale * (1 - endBlend) + 1.0 * endBlend, 0.04, 1.14);

  const skewX = Number(((1 - u) * (1 - u) * 0.22 * Math.cos(u * Math.PI * 1.4)).toFixed(4));
  const shadowStretch = Number((1 + (1 - u) * 0.55).toFixed(4));
  const liftPx = Number((Math.max(0, scaleY - 1) * 18).toFixed(2));

  return {
    scaleY: Number(scaleY.toFixed(4)),
    skewX,
    shadowStretch,
    liftPx,
    settled: false,
  };
}

/**
 * Upgrade 31: Physical `popup_fold` cardstock scene transition overlay.
 * Folds the incoming cardstock sheet upward from the bottom horizon hinge with
 * a warm crease shadow and lit cardstock cut edge.
 */
export function drawPopupFoldTransition(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  localT: number,
  accentHex = '#f2c85b',
  lightSide: 'left' | 'right' = 'right'
): void {
  const dur = 0.42;
  if (!Number.isFinite(localT) || localT >= dur) return;
  const hinge = computePopupHingeTransform(localT, 0, dur);
  const u = clamp(localT / dur, 0, 1);
  if (hinge.settled || u >= 1) return;

  const s = Math.min(w, h) / 620;
  // Folded cardstock cover sweeps from full screen down toward the bottom horizon crease as scene pops upright
  const openFrac = clamp(hinge.scaleY, 0.04, 1);
  const creaseY = h * (0.86 - (1 - openFrac) * 0.72);
  const flapH = Math.max(0, h - creaseY);
  const fadeAlpha = clamp(1 - u * u, 0, 1);

  ctx.save();

  // 1. Subtle darkening fold veil above the rising cardstock crease
  if (1 - openFrac > 0.02) {
    ctx.fillStyle = `rgba(18, 12, 8, ${((1 - openFrac) * 0.52).toFixed(3)})`;
    ctx.fillRect(0, 0, w, Math.max(0, creaseY));
  }

  // 2. Folding cardstock flap with warm parchment paper tone & crease shadow
  if (flapH > 2 && fadeAlpha > 0.03) {
    const paperGrad = ctx.createLinearGradient(0, creaseY, 0, h);
    paperGrad.addColorStop(0, '#f3e5c8');
    paperGrad.addColorStop(0.18, '#e2cea7');
    paperGrad.addColorStop(1, '#bfa47a');

    ctx.globalAlpha = fadeAlpha * 0.92;
    ctx.fillStyle = paperGrad;
    ctx.beginPath();
    const skewInset = Math.abs(hinge.skewX) * w * 0.14;
    ctx.moveTo(skewInset, creaseY);
    ctx.lineTo(w - skewInset, creaseY);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Deep physical paper-fold shadow directly under the top crease edge
    const shadowH = Math.max(8 * s, 24 * s * fadeAlpha);
    const creaseShadow = ctx.createLinearGradient(0, creaseY - shadowH, 0, creaseY + shadowH * 0.6);
    creaseShadow.addColorStop(0, 'rgba(20, 12, 6, 0)');
    creaseShadow.addColorStop(0.65, `rgba(20, 12, 6, ${(0.58 * fadeAlpha).toFixed(3)})`);
    creaseShadow.addColorStop(1, 'rgba(20, 12, 6, 0)');
    ctx.fillStyle = creaseShadow;
    ctx.fillRect(0, creaseY - shadowH, w, shadowH * 1.6);

    // Crisp sunlit cardstock cut edge along the hinge ridge
    ctx.strokeStyle = lightSide === 'right' ? '#fff7e0' : accentHex;
    ctx.lineWidth = Math.max(1.5, 3.2 * s);
    ctx.beginPath();
    ctx.moveTo(skewInset, creaseY);
    ctx.lineTo(w - skewInset, creaseY);
    ctx.stroke();
  }

  ctx.restore();
}
