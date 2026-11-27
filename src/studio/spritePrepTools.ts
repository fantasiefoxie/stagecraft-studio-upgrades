/**
 * Stagecraft Studio — Pure Pixel-Buffer Custom Sprite & Prop Prep Tools (Upgrade 22)
 *
 * 100% deterministic, zero-dependency RGBA Uint8ClampedArray processors that run identically
 * in browser HTML5 Canvas and headless Node unit tests:
 *  1. removeFlatBackgroundRgba — BFS corner flood-fill cutout (preserves interior matching colors)
 *  2. addSpriteOutlineRgba — crisp ink / pixel-snapped silhouette outline
 *  3. quantizeAndPixelizeRgba — nearest-neighbor pixel grid + nearest-color palette quantization
 */

import { MOOD_PALETTES } from './renderAssets';
import type { MoodId } from './types';

export interface RemoveFlatBgOptions {
  /** Euclidean RGB distance tolerance (0 .. 180, default 36) */
  tolerance?: number;
  /** Sample all 4 image corners as background seeds (default true) */
  cornerSamples?: boolean;
  /** Softly feather 1px silhouette fringe pixels near tolerance threshold (default true) */
  feather?: boolean;
}

export interface SpriteOutlineOptions {
  /** Hex outline color (default '#14121d') */
  colorHex?: string;
  /** Outline thickness in pixels (1 .. 10, default 2) */
  thicknessPx?: number;
  /** Snap outline to square 8-connected Chebyshev pixels for retro/pixel art (default false) */
  pixelSnap?: boolean;
}

export interface QuantizePixelizeOptions {
  /** Pixel block size (1 = keep resolution, 2..16 = crisp pixel grid, default 1) */
  pixelSize?: number;
  /** Optional hex color palette to snap every opaque pixel toward */
  paletteHex?: string[];
}

export interface SpritePrepPipelineOptions {
  removeBackground?: boolean;
  bgTolerance?: number;
  bgFeather?: boolean;
  outlineEnabled?: boolean;
  outlineColorHex?: string;
  outlineThicknessPx?: number;
  outlinePixelSnap?: boolean;
  pixelSize?: number;
  paletteHex?: string[];
}

export function parseHexRgb(hex: string): [number, number, number] {
  const cleaned = String(hex || '#14121d').trim().replace(/^#/, '');
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return [Number.isFinite(r) ? r : 20, Number.isFinite(g) ? g : 18, Number.isFinite(b) ? b : 29];
  }
  const full = cleaned.slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return [Number.isFinite(r) ? r : 20, Number.isFinite(g) ? g : 18, Number.isFinite(b) ? b : 29];
}

/**
 * Extracts a curated 8-color palette from any Stagecraft MoodId for palette-locked sprite prep.
 */
export function getMoodPaletteHexes(mood: MoodId): string[] {
  const pal = MOOD_PALETTES[mood] || MOOD_PALETTES.midnight_banyan;
  return [
    '#0f111a',
    pal.skyTop,
    pal.skyMid,
    pal.skyLow,
    pal.ground,
    pal.accent,
    pal.rimLight,
    '#f8f5ec',
  ];
}

/**
 * BFS flood-fill from image corners to strip solid/flat backgrounds cleanly into transparency
 * without eating interior pixels that happen to share the background color.
 */
export function removeFlatBackgroundRgba(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  opts: RemoveFlatBgOptions = {}
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data);
  if (width <= 0 || height <= 0 || out.length < width * height * 4) return out;

  const tolerance = Math.max(0, Math.min(180, Number.isFinite(opts.tolerance) ? Number(opts.tolerance) : 36));
  const tolSq = tolerance * tolerance;
  const featherTolSq = (tolerance + 18) * (tolerance + 18);
  const useAllCorners = opts.cornerSamples !== false;
  const feather = opts.feather !== false;

  const totalPx = width * height;
  const visited = new Uint8Array(totalPx);
  const removed = new Uint8Array(totalPx);

  // Collect reference colors from corners
  const cornerCoords: Array<[number, number]> = useAllCorners
    ? [
        [0, 0],
        [width - 1, 0],
        [0, height - 1],
        [width - 1, height - 1],
      ]
    : [[0, 0]];

  const seeds: Array<{ idx: number; r: number; g: number; b: number }> = [];
  for (const [cx, cy] of cornerCoords) {
    const pIdx = cy * width + cx;
    const o = pIdx * 4;
    if (out[o + 3] === 0) {
      // Already transparent corner — still seed BFS to reach adjacent flat background if needed
      seeds.push({ idx: pIdx, r: out[o], g: out[o + 1], b: out[o + 2] });
    } else {
      seeds.push({ idx: pIdx, r: out[o], g: out[o + 1], b: out[o + 2] });
    }
  }

  // BFS queue using pre-allocated typed array (zero GC churn)
  const queue = new Int32Array(totalPx);

  for (const seed of seeds) {
    if (visited[seed.idx]) continue;
    let head = 0;
    let tail = 0;
    queue[tail++] = seed.idx;
    visited[seed.idx] = 1;

    while (head < tail) {
      const cur = queue[head++];
      const o = cur * 4;
      const a = out[o + 3];
      const dr = out[o] - seed.r;
      const dg = out[o + 1] - seed.g;
      const db = out[o + 2] - seed.b;
      const distSq = dr * dr + dg * dg + db * db;

      if (a > 0 && distSq > tolSq) {
        continue;
      }

      removed[cur] = 1;
      out[o + 3] = 0;

      const x = cur % width;
      const y = (cur - x) / width;

      if (x > 0) {
        const n = cur - 1;
        if (!visited[n]) {
          visited[n] = 1;
          queue[tail++] = n;
        }
      }
      if (x + 1 < width) {
        const n = cur + 1;
        if (!visited[n]) {
          visited[n] = 1;
          queue[tail++] = n;
        }
      }
      if (y > 0) {
        const n = cur - width;
        if (!visited[n]) {
          visited[n] = 1;
          queue[tail++] = n;
        }
      }
      if (y + 1 < height) {
        const n = cur + width;
        if (!visited[n]) {
          visited[n] = 1;
          queue[tail++] = n;
        }
      }
    }
  }

  // Optional 1px edge feather on pixels directly touching removed background
  if (feather && seeds.length > 0) {
    const ref = seeds[0];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (removed[idx]) continue;
        const o = idx * 4;
        if (out[o + 3] === 0) continue;

        const touchesBg =
          (x > 0 && removed[idx - 1]) ||
          (x + 1 < width && removed[idx + 1]) ||
          (y > 0 && removed[idx - width]) ||
          (y + 1 < height && removed[idx + width]);

        if (!touchesBg) continue;
        const dr = out[o] - ref.r;
        const dg = out[o + 1] - ref.g;
        const db = out[o + 2] - ref.b;
        const distSq = dr * dr + dg * dg + db * db;
        if (distSq <= featherTolSq) {
          const factor = Math.max(0.25, Math.min(1, (Math.sqrt(distSq) - tolerance) / 18));
          out[o + 3] = Math.round(out[o + 3] * factor);
        }
      }
    }
  }

  return out;
}

/**
 * Adds a crisp ink or pixel-snapped silhouette outline around opaque pixels in an RGBA buffer.
 */
export function addSpriteOutlineRgba(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  opts: SpriteOutlineOptions = {}
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data);
  if (width <= 0 || height <= 0 || out.length < width * height * 4) return out;

  const thickness = Math.max(1, Math.min(10, Math.round(opts.thicknessPx ?? 2)));
  const pixelSnap = opts.pixelSnap === true;
  const [or, og, ob] = parseHexRgb(opts.colorHex || '#14121d');

  // Precompute stencil offsets
  const offsets: Array<[number, number]> = [];
  const radSq = thickness * thickness + 0.35;
  for (let dy = -thickness; dy <= thickness; dy++) {
    for (let dx = -thickness; dx <= thickness; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (pixelSnap) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) <= thickness) {
          offsets.push([dx, dy]);
        }
      } else if (dx * dx + dy * dy <= radSq) {
        offsets.push([dx, dy]);
      }
    }
  }

  const alphaThreshold = 96;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx + 3] >= alphaThreshold) continue;

      let nearOpaque = false;
      for (let k = 0; k < offsets.length; k++) {
        const nx = x + offsets[k][0];
        const ny = y + offsets[k][1];
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        if (data[(ny * width + nx) * 4 + 3] >= alphaThreshold) {
          nearOpaque = true;
          break;
        }
      }

      if (nearOpaque) {
        out[idx] = or;
        out[idx + 1] = og;
        out[idx + 2] = ob;
        out[idx + 3] = 255;
      }
    }
  }

  return out;
}

/**
 * Deterministic nearest-neighbor pixel grid down/upsample + optional nearest-color palette quantization.
 */
export function quantizeAndPixelizeRgba(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  opts: QuantizePixelizeOptions = {}
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.length);
  if (width <= 0 || height <= 0 || data.length < width * height * 4) return out;

  const pixelSize = Math.max(1, Math.min(24, Math.round(opts.pixelSize ?? 1)));
  const paletteRgb: Array<[number, number, number]> =
    Array.isArray(opts.paletteHex) && opts.paletteHex.length > 0
      ? opts.paletteHex.map(parseHexRgb)
      : [];

  const nearestColor = (r: number, g: number, b: number): [number, number, number] => {
    if (paletteRgb.length === 0) return [r, g, b];
    let best = paletteRgb[0];
    let bestDist = Infinity;
    for (let i = 0; i < paletteRgb.length; i++) {
      const pr = paletteRgb[i][0];
      const pg = paletteRgb[i][1];
      const pb = paletteRgb[i][2];
      // Perceptual weighted squared distance
      const dr = r - pr;
      const dg = g - pg;
      const db = b - pb;
      const d = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
      if (d < bestDist) {
        bestDist = d;
        best = paletteRgb[i];
      }
    }
    return best;
  };

  for (let by = 0; by < height; by += pixelSize) {
    const sy = Math.min(height - 1, by + Math.floor(pixelSize / 2));
    for (let bx = 0; bx < width; bx += pixelSize) {
      const sx = Math.min(width - 1, bx + Math.floor(pixelSize / 2));
      const sIdx = (sy * width + sx) * 4;
      const sa = data[sIdx + 3];
      const [qr, qg, qb] = sa > 0 ? nearestColor(data[sIdx], data[sIdx + 1], data[sIdx + 2]) : [0, 0, 0];
      const finalA = pixelSize > 1 ? (sa >= 128 ? 255 : 0) : sa;

      const maxY = Math.min(height, by + pixelSize);
      const maxX = Math.min(width, bx + pixelSize);
      for (let y = by; y < maxY; y++) {
        for (let x = bx; x < maxX; x++) {
          const dIdx = (y * width + x) * 4;
          out[dIdx] = qr;
          out[dIdx + 1] = qg;
          out[dIdx + 2] = qb;
          out[dIdx + 3] = finalA;
        }
      }
    }
  }

  return out;
}

/**
 * Executes the full deterministic sprite prep pipeline in optimal order:
 *   1. Flat background flood-fill cutout
 *   2. Pixelization + palette quantization
 *   3. Crisp silhouette ink outline
 */
export function processSpriteRgbaPipeline(
  sourceData: Uint8ClampedArray,
  width: number,
  height: number,
  options: SpritePrepPipelineOptions
): Uint8ClampedArray {
  let buf: Uint8ClampedArray = new Uint8ClampedArray(sourceData);
  if (options.removeBackground) {
    buf = removeFlatBackgroundRgba(buf, width, height, {
      tolerance: options.bgTolerance ?? 36,
      cornerSamples: true,
      feather: options.bgFeather !== false,
    });
  }
  const hasPixel = (options.pixelSize ?? 1) > 1;
  const hasPalette = Boolean(options.paletteHex && options.paletteHex.length > 0);
  if (hasPixel || hasPalette) {
    buf = quantizeAndPixelizeRgba(buf, width, height, {
      pixelSize: options.pixelSize ?? 1,
      paletteHex: options.paletteHex,
    });
  }
  if (options.outlineEnabled && (options.outlineThicknessPx ?? 2) > 0) {
    buf = addSpriteOutlineRgba(buf, width, height, {
      colorHex: options.outlineColorHex || '#14121d',
      thicknessPx: options.outlineThicknessPx ?? 2,
      pixelSnap: options.outlinePixelSnap === true || hasPixel,
    });
  }
  return buf;
}
