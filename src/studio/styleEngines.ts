import { MoodId, PostFxPassId, RenderStyleId } from './types';
import { MOOD_PALETTES } from './renderAssets';
import { computeDeterministicFlicker } from './animationEngine';

// =========================================================================
// REUSABLE OFFSCREEN LAYER BUFFERS (Zero Per-Frame Allocation)
// =========================================================================
interface LayerBuffer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

const layerPool = new Map<string, LayerBuffer>();

function getLayer(key: string, w: number, h: number): LayerBuffer | null {
  if (typeof document === 'undefined') return null;
  let entry = layerPool.get(key);
  if (!entry) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    entry = { canvas, ctx };
    layerPool.set(key, entry);
  }
  if (entry.canvas.width !== w || entry.canvas.height !== h) {
    entry.canvas.width = w;
    entry.canvas.height = h;
  }
  entry.ctx.setTransform(1, 0, 0, 1, 0, 0);
  entry.ctx.globalAlpha = 1;
  entry.ctx.globalCompositeOperation = 'source-over';
  entry.ctx.filter = 'none';
  entry.ctx.shadowColor = 'transparent';
  entry.ctx.shadowBlur = 0;
  entry.ctx.shadowOffsetX = 0;
  entry.ctx.shadowOffsetY = 0;
  entry.ctx.clearRect(0, 0, w, h);
  return entry;
}

// =========================================================================
// ZERO-ALLOCATION WEAKMAP CANVAS PATTERN CACHE (Per-Context, Per-Tile)
// =========================================================================
const patternCache = new WeakMap<
  CanvasRenderingContext2D,
  WeakMap<HTMLCanvasElement, CanvasPattern | null>
>();

export function getCachedPattern(
  ctx: CanvasRenderingContext2D,
  tile: HTMLCanvasElement | null
): CanvasPattern | null {
  if (!tile) return null;
  let byTile = patternCache.get(ctx);
  if (!byTile) {
    byTile = new WeakMap();
    patternCache.set(ctx, byTile);
  }
  if (byTile.has(tile)) {
    return byTile.get(tile) ?? null;
  }
  const pat = ctx.createPattern(tile, 'repeat');
  byTile.set(tile, pat);
  return pat;
}

// Persistent Backdrop Layer Cache (skips redrawing static/slow backdrops across consecutive 60fps frames)
let lastCachedBgKey = '';
function prepareBackdropBuffer(
  bgBuf: LayerBuffer,
  w: number,
  h: number,
  renderStyle: RenderStyleId,
  backdropCacheKey: string | undefined,
  drawBackdrop: (ctx: CanvasRenderingContext2D) => void
): HTMLCanvasElement {
  const fullKey = backdropCacheKey ? `${renderStyle}|${w}x${h}|${backdropCacheKey}` : '';
  const cachedBuf = fullKey ? layerPool.get('style_bg_cached') : undefined;
  if (fullKey && cachedBuf && cachedBuf.canvas.width === w && cachedBuf.canvas.height === h && lastCachedBgKey === fullKey) {
    return cachedBuf.canvas;
  }
  const bgProxy = createStyledContext(bgBuf.ctx, renderStyle);
  drawBackdrop(bgProxy);
  if (fullKey) {
    const store = getLayer('style_bg_cached', w, h);
    if (store) {
      store.ctx.drawImage(bgBuf.canvas, 0, 0);
      lastCachedBgKey = fullKey;
      return store.canvas;
    }
  }
  return bgBuf.canvas;
}

// =========================================================================
// DETERMINISTIC PRNG & PRE-BAKED ART PATTERN TILES (Built Once)
// =========================================================================
function makeSeededRng(seedInit: number): () => number {
  let seed = seedInit >>> 0;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
}

let cachedFiligreeTile: HTMLCanvasElement | null = null;
function getFiligreeTile(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedFiligreeTile) return cachedFiligreeTile;

  const c = document.createElement('canvas');
  c.width = 72;
  c.height = 72;
  const g = c.getContext('2d');
  if (!g) return null;

  // Traditional Tholu Bommalata pierced-leather dot-ring & lotus perforation motif
  g.fillStyle = 'rgba(255, 222, 134, 0.72)';
  const drawRing = (cx: number, cy: number, r: number, count: number, dotR: number) => {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      g.beginPath();
      g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, dotR, 0, Math.PI * 2);
      g.fill();
    }
  };
  drawRing(36, 36, 13, 8, 1.8);
  g.beginPath();
  g.arc(36, 36, 2.8, 0, Math.PI * 2);
  g.fill();

  // Corner filigree diamonds
  g.fillStyle = 'rgba(255, 198, 92, 0.55)';
  for (const [x, y] of [
    [0, 0],
    [72, 0],
    [0, 72],
    [72, 72],
    [36, 0],
    [36, 72],
    [0, 36],
    [72, 36],
  ]) {
    g.beginPath();
    g.moveTo(x, y - 4);
    g.lineTo(x + 4, y);
    g.lineTo(x, y + 4);
    g.lineTo(x - 4, y);
    g.closePath();
    g.fill();
  }

  cachedFiligreeTile = c;
  return c;
}

let cachedWoodblockHatchTile: HTMLCanvasElement | null = null;
function getWoodblockHatchTile(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedWoodblockHatchTile) return cachedWoodblockHatchTile;

  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  if (!g) return null;
  const rnd = makeSeededRng(4049);

  // Rhythmic hand-carved diagonal woodcut gouge strokes
  g.strokeStyle = 'rgba(20, 15, 11, 0.34)';
  g.lineWidth = 1.6;
  for (let i = -128; i < 256; i += 7) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + 128, 128 + (rnd() - 0.5) * 4);
    g.stroke();
  }
  // Subtle horizontal ink tooth
  g.strokeStyle = 'rgba(28, 22, 16, 0.14)';
  g.lineWidth = 1;
  for (let y = 3; y < 128; y += 9) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(128, y + (rnd() - 0.5) * 2);
    g.stroke();
  }
  // Organic rag paper specks
  for (let i = 0; i < 360; i++) {
    g.fillStyle = rnd() > 0.5 ? 'rgba(248, 236, 210, 0.18)' : 'rgba(24, 18, 12, 0.14)';
    g.fillRect(rnd() * 128, rnd() * 128, 2, 1.5);
  }

  cachedWoodblockHatchTile = c;
  return c;
}

let cachedCardstockTile: HTMLCanvasElement | null = null;
function getCardstockTile(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedCardstockTile) return cachedCardstockTile;

  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  if (!g) return null;
  const rnd = makeSeededRng(8821);

  for (let i = 0; i < 1100; i++) {
    const light = rnd() > 0.48;
    g.fillStyle = light ? 'rgba(255, 245, 224, 0.08)' : 'rgba(14, 18, 30, 0.08)';
    g.fillRect(rnd() * 128, rnd() * 128, 2, 2);
  }
  // Short paper pulp fibers
  g.strokeStyle = 'rgba(245, 232, 206, 0.09)';
  g.lineWidth = 0.8;
  for (let i = 0; i < 90; i++) {
    const x = rnd() * 128;
    const y = rnd() * 128;
    const a = rnd() * Math.PI * 2;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6);
    g.stroke();
  }

  cachedCardstockTile = c;
  return c;
}

let cachedKenteLoomTile: HTMLCanvasElement | null = null;
function getKenteLoomTile(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedKenteLoomTile) return cachedKenteLoomTile;

  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  if (!g) return null;

  // Fine woven warp & weft loom fabric grain
  g.strokeStyle = 'rgba(255, 226, 148, 0.08)';
  g.lineWidth = 1;
  for (let i = 0; i < 64; i += 4) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, 64);
    g.stroke();
  }
  g.strokeStyle = 'rgba(18, 12, 8, 0.11)';
  for (let j = 0; j < 64; j += 4) {
    g.beginPath();
    g.moveTo(0, j);
    g.lineTo(64, j);
    g.stroke();
  }

  cachedKenteLoomTile = c;
  return c;
}

let cachedParchmentScrim: HTMLCanvasElement | null = null;
function getParchmentScrimTile(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedParchmentScrim) return cachedParchmentScrim;

  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  if (!g) return null;
  const rnd = makeSeededRng(1947);

  for (let i = 0; i < 160; i++) {
    const x = rnd() * 256;
    const y = rnd() * 256;
    const r = 8 + rnd() * 34;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const dark = rnd() > 0.5;
    grad.addColorStop(0, dark ? 'rgba(128, 72, 22, 0.11)' : 'rgba(255, 232, 166, 0.12)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  cachedParchmentScrim = c;
  return c;
}

// Deterministic faceted Stained-Glass Lattice cached per aspect key ('16:9' | '9:16')
const stainedGlassCache = new Map<string, HTMLCanvasElement>();
function getStainedGlassLattice(isVert: boolean): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const key = isVert ? 'vert' : 'wide';
  const existing = stainedGlassCache.get(key);
  if (existing) return existing;

  const w = isVert ? 540 : 960;
  const h = isVert ? 960 : 540;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  if (!g) return null;

  const rnd = makeSeededRng(isVert ? 7711 : 5503);
  const cols = isVert ? 8 : 13;
  const rows = isVert ? 13 : 8;
  const cellW = w / cols;
  const cellH = h / rows;

  // Jittered vertex grid for clean faceted mosaic triangles/quads
  const pts: Array<Array<{ x: number; y: number }>> = [];
  for (let r = 0; r <= rows; r++) {
    const row: Array<{ x: number; y: number }> = [];
    for (let col = 0; col <= cols; col++) {
      const edgeX = col === 0 || col === cols;
      const edgeY = r === 0 || r === rows;
      const jx = edgeX ? 0 : (rnd() - 0.5) * cellW * 0.62;
      const jy = edgeY ? 0 : (rnd() - 0.5) * cellH * 0.62;
      row.push({ x: col * cellW + jx, y: r * cellH + jy });
    }
    pts.push(row);
  }

  const jewelTints = [
    'rgba(48, 128, 255, 0.16)',
    'rgba(255, 196, 62, 0.14)',
    'rgba(220, 44, 98, 0.14)',
    'rgba(52, 214, 178, 0.14)',
    'rgba(148, 76, 255, 0.15)',
  ];

  const drawFacet = (p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) => {
    g.beginPath();
    g.moveTo(p1.x, p1.y);
    g.lineTo(p2.x, p2.y);
    g.lineTo(p3.x, p3.y);
    g.closePath();
    g.fillStyle = jewelTints[Math.floor(rnd() * jewelTints.length)];
    g.fill();
    g.strokeStyle = 'rgba(18, 13, 8, 0.72)';
    g.lineWidth = 2.6;
    g.stroke();
    g.strokeStyle = 'rgba(255, 222, 128, 0.24)';
    g.lineWidth = 0.9;
    g.stroke();
  };

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const tl = pts[r][col];
      const tr = pts[r][col + 1];
      const bl = pts[r + 1][col];
      const br = pts[r + 1][col + 1];
      if ((r + col) % 2 === 0) {
        drawFacet(tl, tr, br);
        drawFacet(tl, br, bl);
      } else {
        drawFacet(tl, tr, bl);
        drawFacet(tr, br, bl);
      }
    }
  }

  // Ornate central temple arch rose-window medallion lead lines
  const cx = w * 0.5;
  const cy = h * 0.36;
  const archR = Math.min(w, h) * 0.34;
  g.save();
  g.strokeStyle = 'rgba(24, 16, 8, 0.85)';
  g.lineWidth = 5;
  g.beginPath();
  g.arc(cx, cy, archR, Math.PI, Math.PI * 2);
  g.stroke();
  g.strokeStyle = 'rgba(245, 200, 92, 0.65)';
  g.lineWidth = 2;
  g.beginPath();
  g.arc(cx, cy, archR - 4, Math.PI, Math.PI * 2);
  g.stroke();

  // Radial rose ribs
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI + (i / 12) * Math.PI;
    g.strokeStyle = 'rgba(18, 12, 8, 0.55)';
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * (archR * 0.35), cy + Math.sin(a) * (archR * 0.35));
    g.lineTo(cx + Math.cos(a) * archR, cy + Math.sin(a) * archR);
    g.stroke();
  }
  g.restore();

  stainedGlassCache.set(key, c);
  return c;
}

// =========================================================================
// PRE-BAKED STATIC TILES FOR BORROWED & MULTI-GENRE ART ENGINES (Zero GC)
// =========================================================================
let cachedFeltWeaveTile: HTMLCanvasElement | null = null;
function getFeltWeaveTile(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedFeltWeaveTile) return cachedFeltWeaveTile;

  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 96;
  const g = c.getContext('2d');
  if (!g) return null;
  const rnd = makeSeededRng(3109);

  // Soft wool-felt micro-fibers & cozy mottled fuzz
  for (let i = 0; i < 650; i++) {
    const x = rnd() * 96;
    const y = rnd() * 96;
    const light = rnd() > 0.45;
    g.fillStyle = light ? 'rgba(255, 248, 232, 0.11)' : 'rgba(24, 18, 12, 0.10)';
    g.fillRect(x, y, 2, 1.5);
  }
  g.lineWidth = 0.85;
  for (let i = 0; i < 140; i++) {
    const x = rnd() * 96;
    const y = rnd() * 96;
    const a = rnd() * Math.PI * 2;
    const len = 3 + rnd() * 5;
    g.strokeStyle = i % 2 === 0 ? 'rgba(255, 245, 224, 0.12)' : 'rgba(28, 20, 14, 0.11)';
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    g.stroke();
  }

  cachedFeltWeaveTile = c;
  return c;
}

let cachedRisographTile: HTMLCanvasElement | null = null;
function getRisographHalftoneTile(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedRisographTile) return cachedRisographTile;

  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  if (!g) return null;
  const rnd = makeSeededRng(6217);

  // Authentic Ben-Day offset dot screen + soy-ink speckle
  g.fillStyle = 'rgba(22, 34, 82, 0.16)';
  for (let y = 0; y < 64; y += 6) {
    for (let x = 0; x < 64; x += 6) {
      const ox = (y / 6) % 2 === 0 ? 0 : 3;
      g.beginPath();
      g.arc(x + ox, y, 1.15, 0, Math.PI * 2);
      g.fill();
    }
  }
  for (let i = 0; i < 240; i++) {
    g.fillStyle = rnd() > 0.5 ? 'rgba(242, 86, 78, 0.08)' : 'rgba(28, 150, 162, 0.08)';
    g.fillRect(rnd() * 64, rnd() * 64, 1.5, 1.5);
  }

  cachedRisographTile = c;
  return c;
}

let cachedMangaScreentoneTile: HTMLCanvasElement | null = null;
function getMangaScreentoneTile(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedMangaScreentoneTile) return cachedMangaScreentoneTile;

  const c = document.createElement('canvas');
  c.width = 48;
  c.height = 48;
  const g = c.getContext('2d');
  if (!g) return null;

  // Classic 45-degree manga dot screentone mesh
  g.fillStyle = 'rgba(12, 12, 16, 0.22)';
  for (let y = 0; y < 48; y += 5) {
    for (let x = 0; x < 48; x += 5) {
      const shift = (y / 5) % 2 === 0 ? 0 : 2.5;
      g.beginPath();
      g.arc(x + shift, y, 1.1, 0, Math.PI * 2);
      g.fill();
    }
  }

  cachedMangaScreentoneTile = c;
  return c;
}

let cachedBlueprintGridTile: HTMLCanvasElement | null = null;
function getBlueprintGridTile(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedBlueprintGridTile) return cachedBlueprintGridTile;

  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  if (!g) return null;

  // Precision minor 16px & major 64px cyanotype drafting lines
  g.strokeStyle = 'rgba(140, 214, 255, 0.14)';
  g.lineWidth = 1;
  for (let p = 16; p < 64; p += 16) {
    g.beginPath();
    g.moveTo(p + 0.5, 0);
    g.lineTo(p + 0.5, 64);
    g.moveTo(0, p + 0.5);
    g.lineTo(64, p + 0.5);
    g.stroke();
  }
  g.strokeStyle = 'rgba(196, 238, 255, 0.30)';
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(0.5, 0);
  g.lineTo(0.5, 64);
  g.moveTo(0, 0.5);
  g.lineTo(64, 0.5);
  g.stroke();

  cachedBlueprintGridTile = c;
  return c;
}

let cachedSandStippleTile: HTMLCanvasElement | null = null;
function getSandStippleTile(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedSandStippleTile) return cachedSandStippleTile;

  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  if (!g) return null;
  const rnd = makeSeededRng(7331);

  for (let i = 0; i < 1600; i++) {
    const x = rnd() * 128;
    const y = rnd() * 128;
    const pick = rnd();
    g.fillStyle =
      pick > 0.66
        ? 'rgba(255, 224, 156, 0.16)'
        : pick > 0.33
          ? 'rgba(96, 46, 12, 0.18)'
          : 'rgba(28, 12, 4, 0.15)';
    g.fillRect(x, y, 1.6, 1.6);
  }

  cachedSandStippleTile = c;
  return c;
}

let cachedScratchboardTile: HTMLCanvasElement | null = null;
function getScratchboardHatchTile(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedScratchboardTile) return cachedScratchboardTile;

  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 96;
  const g = c.getContext('2d');
  if (!g) return null;
  const rnd = makeSeededRng(9127);

  // Fine ivory white-on-black scraperboard needle cross-hatching
  g.strokeStyle = 'rgba(246, 236, 208, 0.14)';
  g.lineWidth = 0.9;
  for (let i = -96; i < 192; i += 6) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + 96, 96 + (rnd() - 0.5) * 2);
    g.stroke();
  }
  g.strokeStyle = 'rgba(246, 236, 208, 0.08)';
  for (let i = -96; i < 192; i += 10) {
    g.beginPath();
    g.moveTo(i + 96, 0);
    g.lineTo(i, 96);
    g.stroke();
  }

  cachedScratchboardTile = c;
  return c;
}

let cachedMosaicTesseraeTile: HTMLCanvasElement | null = null;
function getMosaicTesseraeTile(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedMosaicTesseraeTile) return cachedMosaicTesseraeTile;

  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  if (!g) return null;
  const rnd = makeSeededRng(5011);

  const step = 16;
  for (let y = 0; y < 64; y += step) {
    for (let x = 0; x < 64; x += step) {
      const shimmer = rnd();
      if (shimmer > 0.72) {
        g.fillStyle = 'rgba(255, 214, 96, 0.14)';
        g.fillRect(x + 1.5, y + 1.5, step - 3, step - 3);
      } else if (shimmer < 0.25) {
        g.fillStyle = 'rgba(22, 16, 10, 0.12)';
        g.fillRect(x + 1.5, y + 1.5, step - 3, step - 3);
      }
      g.strokeStyle = 'rgba(26, 18, 10, 0.38)';
      g.lineWidth = 1.4;
      g.strokeRect(x + 0.5, y + 0.5, step - 1, step - 1);
    }
  }

  cachedMosaicTesseraeTile = c;
  return c;
}

let cachedGouacheToothTile: HTMLCanvasElement | null = null;
function getGouacheToothTile(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedGouacheToothTile) return cachedGouacheToothTile;

  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  if (!g) return null;
  const rnd = makeSeededRng(2459);

  // Cold-pressed matte gouache paper tooth + soft dry-brush mottling
  for (let i = 0; i < 850; i++) {
    const x = rnd() * 128;
    const y = rnd() * 128;
    g.fillStyle = rnd() > 0.5 ? 'rgba(255, 248, 234, 0.10)' : 'rgba(52, 40, 32, 0.08)';
    g.fillRect(x, y, 2.5, 2);
  }
  for (let i = 0; i < 36; i++) {
    const x = rnd() * 128;
    const y = rnd() * 128;
    const r = 10 + rnd() * 18;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, rnd() > 0.5 ? 'rgba(255, 242, 212, 0.07)' : 'rgba(42, 30, 22, 0.06)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }

  cachedGouacheToothTile = c;
  return c;
}

// =========================================================================
// STYLE-AWARE CANVAS 2D CONTEXT PROXY (Zero Asset Duplication!)
// =========================================================================
function isDarkInkColor(style: string | CanvasGradient | CanvasPattern): boolean {
  if (typeof style !== 'string') return false;
  const s = style.trim().toLowerCase();
  if (s === 'black' || s === '#000' || s === '#000000') return true;
  if (s.startsWith('#')) {
    let hex = s.slice(1);
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
        return r < 56 && g < 56 && b < 78;
      }
    }
  }
  const rgb = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) {
    const r = Number(rgb[1]);
    const g = Number(rgb[2]);
    const b = Number(rgb[3]);
    return r < 56 && g < 56 && b < 78;
  }
  return false;
}

const styledContextCache = new WeakMap<
  CanvasRenderingContext2D,
  Map<RenderStyleId, CanvasRenderingContext2D>
>();

export function createStyledContext(
  target: CanvasRenderingContext2D,
  renderStyle: RenderStyleId
): CanvasRenderingContext2D {
  if (renderStyle === 'chiaroscuro') return target;

  let byStyle = styledContextCache.get(target);
  if (!byStyle) {
    byStyle = new Map();
    styledContextCache.set(target, byStyle);
  }
  const existing = byStyle.get(renderStyle);
  if (existing) return existing;

  const boundMethods = new Map<PropertyKey, unknown>();
  const rawStroke = target.stroke.bind(target);
  const rawStrokeRect = target.strokeRect.bind(target);

  const styledStroke = (...args: unknown[]) => {
    const dark = isDarkInkColor(target.strokeStyle);
    if (renderStyle === 'lineless_vector') {
      if (dark) return;
      return (rawStroke as (...a: unknown[]) => void)(...args);
    }
    if (renderStyle === 'woodblock_print') {
      const prevW = target.lineWidth;
      const prevStyle = target.strokeStyle;
      const prevJoin = target.lineJoin;
      const prevCap = target.lineCap;
      if (dark) {
        target.strokeStyle = '#15100c';
        target.lineWidth = Math.max(prevW * 1.48, 2.4);
        target.lineJoin = 'round';
        target.lineCap = 'round';
      }
      const res = (rawStroke as (...a: unknown[]) => void)(...args);
      target.lineWidth = prevW;
      target.strokeStyle = prevStyle;
      target.lineJoin = prevJoin;
      target.lineCap = prevCap;
      return res;
    }
    if (renderStyle === 'stained_glass') {
      const prevW = target.lineWidth;
      const prevStyle = target.strokeStyle;
      if (dark) {
        target.strokeStyle = '#1c140a';
        target.lineWidth = Math.max(prevW * 1.25, 2.2);
      }
      const res = (rawStroke as (...a: unknown[]) => void)(...args);
      target.lineWidth = prevW;
      target.strokeStyle = prevStyle;
      return res;
    }
    if (renderStyle === 'papercraft_diorama') {
      if (dark) {
        const prevA = target.globalAlpha;
        const prevW = target.lineWidth;
        target.globalAlpha = prevA * 0.36;
        target.lineWidth = Math.max(1, prevW * 0.55);
        const res = (rawStroke as (...a: unknown[]) => void)(...args);
        target.globalAlpha = prevA;
        target.lineWidth = prevW;
        return res;
      }
      return (rawStroke as (...a: unknown[]) => void)(...args);
    }
    if (renderStyle === 'shadow_puppetry') {
      const prevStyle = target.strokeStyle;
      if (dark) target.strokeStyle = '#140904';
      const res = (rawStroke as (...a: unknown[]) => void)(...args);
      target.strokeStyle = prevStyle;
      return res;
    }
    if (renderStyle === 'sumi_e_wash') {
      const prevStyle = target.strokeStyle;
      const prevA = target.globalAlpha;
      const prevCap = target.lineCap;
      if (dark) {
        target.strokeStyle = '#1e1f24';
        target.globalAlpha = prevA * 0.72;
        target.lineCap = 'round';
      }
      const res = (rawStroke as (...a: unknown[]) => void)(...args);
      target.strokeStyle = prevStyle;
      target.globalAlpha = prevA;
      target.lineCap = prevCap;
      return res;
    }
    if (renderStyle === 'greek_amphora') {
      const prevStyle = target.strokeStyle;
      const prevW = target.lineWidth;
      if (dark) {
        target.strokeStyle = '#120d0a';
        target.lineWidth = Math.max(prevW * 1.35, 2.2);
      }
      const res = (rawStroke as (...a: unknown[]) => void)(...args);
      target.strokeStyle = prevStyle;
      target.lineWidth = prevW;
      return res;
    }
    if (renderStyle === 'kente_tapestry') {
      const prevStyle = target.strokeStyle;
      const prevW = target.lineWidth;
      if (dark) {
        target.strokeStyle = '#110d0a';
        target.lineWidth = Math.max(prevW * 1.25, 2.2);
      }
      const res = (rawStroke as (...a: unknown[]) => void)(...args);
      target.strokeStyle = prevStyle;
      target.lineWidth = prevW;
      return res;
    }
    if (renderStyle === 'illuminated_codex') {
      const prevStyle = target.strokeStyle;
      const prevW = target.lineWidth;
      if (dark) {
        target.strokeStyle = '#2c1b12';
        target.lineWidth = Math.max(prevW * 0.9, 1.4);
      }
      const res = (rawStroke as (...a: unknown[]) => void)(...args);
      target.strokeStyle = prevStyle;
      target.lineWidth = prevW;
      return res;
    }
    if (renderStyle === 'anime_cel') {
      const prevStyle = target.strokeStyle;
      const prevW = target.lineWidth;
      if (dark) {
        target.strokeStyle = '#121629';
        target.lineWidth = Math.max(prevW * 1.12, 1.8);
      }
      const res = (rawStroke as (...a: unknown[]) => void)(...args);
      target.strokeStyle = prevStyle;
      target.lineWidth = prevW;
      return res;
    }
    if (renderStyle === 'manga_screentone') {
      const prevStyle = target.strokeStyle;
      const prevW = target.lineWidth;
      const prevJoin = target.lineJoin;
      if (dark) {
        target.strokeStyle = '#09090d';
        target.lineWidth = Math.max(prevW * 1.38, 2.2);
        target.lineJoin = 'round';
      }
      const res = (rawStroke as (...a: unknown[]) => void)(...args);
      target.strokeStyle = prevStyle;
      target.lineWidth = prevW;
      target.lineJoin = prevJoin;
      return res;
    }
    if (renderStyle === 'blueprint_technical') {
      const prevStyle = target.strokeStyle;
      const prevW = target.lineWidth;
      if (dark) {
        target.strokeStyle = '#e8f7ff';
        target.lineWidth = Math.max(prevW * 0.95, 1.5);
      }
      const res = (rawStroke as (...a: unknown[]) => void)(...args);
      target.strokeStyle = prevStyle;
      target.lineWidth = prevW;
      return res;
    }
    if (renderStyle === 'gouache_storybook') {
      const prevStyle = target.strokeStyle;
      const prevA = target.globalAlpha;
      const prevCap = target.lineCap;
      if (dark) {
        target.strokeStyle = '#332824';
        target.globalAlpha = prevA * 0.56;
        target.lineCap = 'round';
      }
      const res = (rawStroke as (...a: unknown[]) => void)(...args);
      target.strokeStyle = prevStyle;
      target.globalAlpha = prevA;
      target.lineCap = prevCap;
      return res;
    }
    if (renderStyle === 'neon_cybernoir') {
      const prevStyle = target.strokeStyle;
      const prevW = target.lineWidth;
      if (dark) {
        target.strokeStyle = '#2cf2ff';
        target.lineWidth = Math.max(prevW * 1.05, 1.7);
      }
      const res = (rawStroke as (...a: unknown[]) => void)(...args);
      target.strokeStyle = prevStyle;
      target.lineWidth = prevW;
      return res;
    }
    if (renderStyle === 'felt_puppet') {
      const prevStyle = target.strokeStyle;
      const prevW = target.lineWidth;
      const prevA = target.globalAlpha;
      const prevDash = target.getLineDash();
      if (dark) {
        target.strokeStyle = '#f6eedb';
        target.lineWidth = Math.max(prevW * 0.85, 1.5);
        target.globalAlpha = prevA * 0.68;
        target.setLineDash([4, 3]);
      }
      const res = (rawStroke as (...a: unknown[]) => void)(...args);
      target.strokeStyle = prevStyle;
      target.lineWidth = prevW;
      target.globalAlpha = prevA;
      target.setLineDash(prevDash);
      return res;
    }
    if (renderStyle === 'risograph_print') {
      const prevStyle = target.strokeStyle;
      const prevW = target.lineWidth;
      if (dark) {
        target.strokeStyle = '#1d2452';
        target.lineWidth = Math.max(prevW * 1.15, 1.8);
      }
      const res = (rawStroke as (...a: unknown[]) => void)(...args);
      target.strokeStyle = prevStyle;
      target.lineWidth = prevW;
      return res;
    }
    if (renderStyle === 'backlit_sand') {
      const prevStyle = target.strokeStyle;
      const prevA = target.globalAlpha;
      if (dark) {
        target.strokeStyle = '#2b1507';
        target.globalAlpha = prevA * 0.65;
      }
      const res = (rawStroke as (...a: unknown[]) => void)(...args);
      target.strokeStyle = prevStyle;
      target.globalAlpha = prevA;
      return res;
    }
    if (renderStyle === 'scratchboard_noir') {
      const prevStyle = target.strokeStyle;
      const prevW = target.lineWidth;
      if (dark) {
        target.strokeStyle = '#f4e7c3';
        target.lineWidth = Math.max(prevW * 1.05, 1.6);
      }
      const res = (rawStroke as (...a: unknown[]) => void)(...args);
      target.strokeStyle = prevStyle;
      target.lineWidth = prevW;
      return res;
    }
    if (renderStyle === 'byzantine_mosaic') {
      const prevStyle = target.strokeStyle;
      const prevW = target.lineWidth;
      if (dark) {
        target.strokeStyle = '#1e160c';
        target.lineWidth = Math.max(prevW * 1.32, 2.3);
      }
      const res = (rawStroke as (...a: unknown[]) => void)(...args);
      target.strokeStyle = prevStyle;
      target.lineWidth = prevW;
      return res;
    }
    return (rawStroke as (...a: unknown[]) => void)(...args);
  };

  const styledStrokeRect = (x: number, y: number, w: number, h: number) => {
    if (renderStyle === 'lineless_vector' && isDarkInkColor(target.strokeStyle)) return;
    return rawStrokeRect(x, y, w, h);
  };

  const proxy = new Proxy(target, {
    get(obj, prop) {
      if (prop === 'stroke') return styledStroke;
      if (prop === 'strokeRect') return styledStrokeRect;
      const cached = boundMethods.get(prop);
      if (cached !== undefined) return cached;
      const val = Reflect.get(obj, prop);
      if (typeof val === 'function') {
        const bound = val.bind(obj);
        boundMethods.set(prop, bound);
        return bound;
      }
      return val;
    },
    set(obj, prop, value) {
      return Reflect.set(obj, prop, value);
    },
  });

  byStyle.set(renderStyle, proxy);
  return proxy;
}

// =========================================================================
// MASTER 6-ENGINE LAYERED SCENE COMPOSITOR (60fps Deterministic)
// =========================================================================
export interface SceneLayerCallbacks {
  drawBackdrop: (ctx: CanvasRenderingContext2D) => void;
  drawForeground: (ctx: CanvasRenderingContext2D) => void;
}

export function composeStyledScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  renderStyle: RenderStyleId,
  mood: MoodId,
  globalT: number,
  layers: SceneLayerCallbacks,
  backdropCacheKey?: string
): void {
  // Fast zero-overhead path for default Chiaroscuro engine (still benefits from backdrop cache on static shots)
  if (renderStyle === 'chiaroscuro') {
    if (backdropCacheKey) {
      const bgBuf = getLayer('style_bg', w, h);
      if (bgBuf) {
        const bgCanvas = prepareBackdropBuffer(bgBuf, w, h, 'chiaroscuro', backdropCacheKey, layers.drawBackdrop);
        ctx.drawImage(bgCanvas, 0, 0);
        layers.drawForeground(ctx);
        return;
      }
    }
    layers.drawBackdrop(ctx);
    layers.drawForeground(ctx);
    return;
  }

  const s = Math.min(w, h) / 620;
  const pal = MOOD_PALETTES[mood] || MOOD_PALETTES.midnight_banyan;
  const bgBuf = getLayer('style_bg', w, h);
  const fgBuf = getLayer('style_fg', w, h);

  if (!bgBuf || !fgBuf) {
    layers.drawBackdrop(ctx);
    layers.drawForeground(ctx);
    return;
  }

  const renderBackdrop = (styleId: RenderStyleId) =>
    prepareBackdropBuffer(bgBuf, w, h, styleId, backdropCacheKey, layers.drawBackdrop);

  // -----------------------------------------------------------------------
  // ENGINE 2: THOLU BOMMALATA SHADOW PUPPETRY (Backlit Oil-Lamp Parchment)
  // -----------------------------------------------------------------------
  if (renderStyle === 'shadow_puppetry') {
    // 1. Warm backlit oil-lamp parchment theatre screen
    const flicker = 0.96 + Math.sin(Math.floor(globalT * 12) * 1.7) * 0.04;
    const lampGrad = ctx.createRadialGradient(
      w * 0.5,
      h * 0.52,
      30 * s,
      w * 0.5,
      h * 0.5,
      Math.hypot(w, h) * 0.62
    );
    lampGrad.addColorStop(0, '#fff3c4');
    lampGrad.addColorStop(0.38, '#f0be68');
    lampGrad.addColorStop(0.75, '#b66924');
    lampGrad.addColorStop(1, '#3d1c0a');
    ctx.save();
    ctx.fillStyle = lampGrad;
    ctx.fillRect(0, 0, w, h);

    // Parchment mottling on backlit cloth
    const scrimTile = getParchmentScrimTile();
    if (scrimTile) {
      const pat = getCachedPattern(ctx, scrimTile);
      if (pat) {
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, w, h);
      }
    }

    // Subtle glowing backlit oil-lamp moon disc
    ctx.save();
    ctx.globalAlpha = 0.35 * flicker;
    const moonG = ctx.createRadialGradient(w * 0.5, h * 0.38, 12 * s, w * 0.5, h * 0.38, 190 * s);
    moonG.addColorStop(0, '#fffbe6');
    moonG.addColorStop(0.65, 'rgba(255, 224, 130, 0.35)');
    moonG.addColorStop(1, 'rgba(255, 200, 90, 0)');
    ctx.fillStyle = moonG;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // 2. Render backdrop as warm dark-amber translucent stage silhouettes
    const bgProxy = createStyledContext(bgBuf.ctx, 'shadow_puppetry');
    layers.drawBackdrop(bgProxy);
    bgBuf.ctx.save();
    bgBuf.ctx.globalCompositeOperation = 'source-atop';
    bgBuf.ctx.fillStyle = 'rgba(32, 14, 5, 0.62)';
    bgBuf.ctx.fillRect(0, 0, w, h);
    bgBuf.ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.78;
    ctx.drawImage(bgBuf.canvas, 0, 0);
    ctx.restore();

    // 3. Render actors & props onto puppet plane, enrich leather translucency + filigree pinholes!
    const fgProxy = createStyledContext(fgBuf.ctx, 'shadow_puppetry');
    layers.drawForeground(fgProxy);

    fgBuf.ctx.save();
    // Stained translucent leather glaze (preserves ruby/emerald/saffron tones while deepening blacks)
    fgBuf.ctx.globalCompositeOperation = 'source-atop';
    fgBuf.ctx.fillStyle = 'rgba(28, 11, 4, 0.34)';
    fgBuf.ctx.fillRect(0, 0, w, h);

    // Traditional Tholu Bommalata pierced-leather filigree pinhole glow inside puppets!
    const fili = getFiligreeTile();
    if (fili) {
      const fPat = getCachedPattern(fgBuf.ctx, fili);
      if (fPat) {
        fgBuf.ctx.globalAlpha = 0.52 * flicker;
        fgBuf.ctx.fillStyle = fPat;
        fgBuf.ctx.fillRect(0, 0, w, h);
      }
    }
    fgBuf.ctx.restore();

    // Stamp puppets with warm backlit edge shadow
    ctx.save();
    ctx.shadowColor = 'rgba(24, 9, 2, 0.78)';
    ctx.shadowBlur = 10 * s;
    ctx.shadowOffsetX = 4 * s;
    ctx.shadowOffsetY = 5 * s;
    ctx.drawImage(fgBuf.canvas, 0, 0);
    ctx.restore();

    // Delicate bamboo puppet control rods descending at subtle angles
    ctx.save();
    ctx.strokeStyle = 'rgba(22, 10, 4, 0.32)';
    ctx.lineWidth = 2.2 * s;
    for (const rx of [0.27, 0.31, 0.69, 0.73]) {
      ctx.beginPath();
      ctx.moveTo(w * rx, h * 0.72);
      ctx.lineTo(w * rx + (rx < 0.5 ? -18 : 18) * s, h);
      ctx.stroke();
    }
    ctx.restore();

    // Carved dark theatre scrim edge frame
    const bm = Math.round(14 * s);
    ctx.strokeStyle = '#1b0b04';
    ctx.lineWidth = bm * 2;
    ctx.strokeRect(0, 0, w, h);
    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // ENGINE 3: LINELESS GEOMETRIC VECTOR (Samurai Jack / Song of the Sea)
  // -----------------------------------------------------------------------
  if (renderStyle === 'lineless_vector') {
    const bgCanvas = renderBackdrop('lineless_vector');

    ctx.save();
    ctx.drawImage(bgCanvas, 0, 0);

    // Atmospheric luminous depth bloom separating background architecture from flat vector characters
    const bloom = ctx.createRadialGradient(w * 0.5, h * 0.42, 20 * s, w * 0.5, h * 0.44, Math.max(w, h) * 0.56);
    bloom.addColorStop(0, pal.rimLight);
    bloom.addColorStop(0.55, 'rgba(255, 255, 255, 0)');
    bloom.addColorStop(1, 'rgba(8, 12, 32, 0.24)');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // Foreground characters & props with zero black ink outlines + soft moonlight rim halo
    const fgProxy = createStyledContext(fgBuf.ctx, 'lineless_vector');
    layers.drawForeground(fgProxy);

    ctx.save();
    ctx.shadowColor = pal.rimLight;
    ctx.shadowBlur = 14 * s;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.drawImage(fgBuf.canvas, 0, 0);
    ctx.restore();

    // Clean crisp pass on top for sharp geometric edges
    ctx.drawImage(fgBuf.canvas, 0, 0);

    // Ultra-fine storybook matte grain
    const paper = getCardstockTile();
    if (paper) {
      const pat = getCachedPattern(ctx, paper);
      if (pat) {
        ctx.globalAlpha = 0.65;
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, w, h);
      }
    }
    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // ENGINE 4: WOODBLOCK & KALIGHAT LINOCUT PRINT (4-Ink Offset Print)
  // -----------------------------------------------------------------------
  if (renderStyle === 'woodblock_print') {
    ctx.save();
    // Handmade cream cotton rag paper base
    ctx.fillStyle = '#f3e7ce';
    ctx.fillRect(0, 0, w, h);

    // Backdrop with thickened carved ink contours
    const bgCanvas = renderBackdrop('woodblock_print');

    ctx.save();
    ctx.globalAlpha = 0.86;
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.restore();

    // Lift highlights onto warm cream rag paper & push shadows toward Prussian indigo
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(244, 224, 178, 0.56)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(242, 228, 198, 0.88)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // Hand-carved woodblock engraving hatching over backdrop
    const hatch = getWoodblockHatchTile();
    if (hatch) {
      const hPat = getCachedPattern(ctx, hatch);
      if (hPat) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.72;
        ctx.fillStyle = hPat;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }

    // Foreground characters & props with bold carved ink outlines
    const fgProxy = createStyledContext(fgBuf.ctx, 'woodblock_print');
    layers.drawForeground(fgProxy);

    // Authentic stepped 10fps woodblock ink-block misregistration echo
    const wbStep = Math.floor(globalT * 10);
    const misX = (2.6 + Math.sin(wbStep * 2.3) * 0.9) * s;
    const misY = (1.8 + Math.cos(wbStep * 1.9) * 0.7) * s;
    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.drawImage(fgBuf.canvas, misX, misY);
    ctx.restore();

    // Main foreground woodcut pass
    ctx.drawImage(fgBuf.canvas, 0, 0);

    // Light engraving texture tied across foreground
    if (hatch) {
      const hPat = getCachedPattern(ctx, hatch);
      if (hPat) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = hPat;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }

    // Carved handmade cotton-paper margin & heavy black woodblock border
    const outerM = Math.round(14 * s);
    ctx.strokeStyle = '#f2e5c9';
    ctx.lineWidth = outerM * 2;
    ctx.strokeRect(0, 0, w, h);
    ctx.strokeStyle = '#15100c';
    ctx.lineWidth = 4.5 * s;
    ctx.strokeRect(outerM, outerM, w - outerM * 2, h - outerM * 2);
    ctx.strokeStyle = 'rgba(182, 42, 34, 0.78)';
    ctx.lineWidth = 1.6 * s;
    ctx.strokeRect(outerM + 5 * s, outerM + 5 * s, w - (outerM + 5 * s) * 2, h - (outerM + 5 * s) * 2);
    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // ENGINE 5: STAINED GLASS & TEMPLE CLOISONNÉ MOSAIC
  // -----------------------------------------------------------------------
  if (renderStyle === 'stained_glass') {
    const isVert = h > w;
    const bgCanvas = renderBackdrop('stained_glass');

    ctx.save();
    ctx.drawImage(bgCanvas, 0, 0);

    // Boost jewel-tone glass radiance on backdrop
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255, 206, 94, 0.22)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // Project cached faceted Voronoi stained-glass lead lattice onto backdrop & sky ONLY
    // (keeping talking actors clean and readable in foreground!)
    const lattice = getStainedGlassLattice(isVert);
    if (lattice) {
      ctx.save();
      ctx.globalAlpha = 0.88;
      ctx.drawImage(lattice, 0, 0, w, h);
      ctx.restore();
    }

    // Sweeping volumetric stained-glass light shafts from arch center
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const rayShift = Math.sin(globalT * 0.45) * 0.08;
    const cx = w * 0.5;
    const cy = h * 0.26;
    for (let i = -2; i <= 2; i++) {
      const a = Math.PI * 0.5 + i * 0.24 + rayShift;
      const spread = 0.065;
      const len = Math.hypot(w, h) * 0.88;
      const rayGrad = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      rayGrad.addColorStop(0, i % 2 === 0 ? 'rgba(255, 226, 130, 0.28)' : 'rgba(130, 218, 255, 0.24)');
      rayGrad.addColorStop(0.6, 'rgba(255, 210, 110, 0.06)');
      rayGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a - spread) * len, cy + Math.sin(a - spread) * len);
      ctx.lineTo(cx + Math.cos(a + spread) * len, cy + Math.sin(a + spread) * len);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Render foreground actors & props with gilded bronze leading + radiant glass halo
    // (faces remain un-gridded so expressions & lip-sync are razor-sharp!)
    const fgProxy = createStyledContext(fgBuf.ctx, 'stained_glass');
    layers.drawForeground(fgProxy);

    ctx.save();
    ctx.shadowColor = 'rgba(255, 214, 102, 0.55)';
    ctx.shadowBlur = 18 * s;
    ctx.drawImage(fgBuf.canvas, 0, 0);
    ctx.restore();
    ctx.drawImage(fgBuf.canvas, 0, 0);

    // Gilded bronze cloisonné border frame
    const bm = Math.round(12 * s);
    ctx.strokeStyle = '#191108';
    ctx.lineWidth = bm * 2;
    ctx.strokeRect(0, 0, w, h);
    ctx.strokeStyle = '#e8b94a';
    ctx.lineWidth = 3.2 * s;
    ctx.strokeRect(bm, bm, w - bm * 2, h - bm * 2);
    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // ENGINE 6: 2.5D PAPER-CRAFT DIORAMA (Kubo Shadowbox Theatre)
  // -----------------------------------------------------------------------
  if (renderStyle === 'papercraft_diorama') {
    const bgCanvas = renderBackdrop('papercraft_diorama');

    ctx.save();
    // Backdrop cardstock layer with warm shadowbox matte depth
    ctx.drawImage(bgCanvas, 0, 0);

    // Subtle warm depth lift between far stage and foreground paper cutouts
    const depthMist = ctx.createLinearGradient(0, h * 0.3, 0, h);
    depthMist.addColorStop(0, 'rgba(255, 232, 188, 0.04)');
    depthMist.addColorStop(1, 'rgba(12, 16, 32, 0.24)');
    ctx.fillStyle = depthMist;
    ctx.fillRect(0, 0, w, h);

    // Foreground characters & props rendered onto matte cutout plane
    const fgProxy = createStyledContext(fgBuf.ctx, 'papercraft_diorama');
    layers.drawForeground(fgProxy);

    // Apply subtle matte cardstock grain strictly inside the cutouts
    const cardTile = getCardstockTile();
    if (cardTile) {
      const cPat = getCachedPattern(fgBuf.ctx, cardTile);
      if (cPat) {
        fgBuf.ctx.save();
        fgBuf.ctx.globalCompositeOperation = 'source-atop';
        fgBuf.ctx.fillStyle = cPat;
        fgBuf.ctx.fillRect(0, 0, w, h);
        fgBuf.ctx.restore();
      }
    }

    // Pass A: Deep directional shadowbox cardstock drop-shadow with subtle theatre lamp drift
    const lampShiftX = Math.sin(globalT * 0.9) * 3.5 * s;
    const lampShiftY = Math.cos(globalT * 0.7) * 2.2 * s;
    ctx.save();
    ctx.shadowColor = 'rgba(2, 4, 12, 0.84)';
    ctx.shadowBlur = 22 * s;
    ctx.shadowOffsetX = 12 * s + lampShiftX;
    ctx.shadowOffsetY = 16 * s + lampShiftY;
    ctx.drawImage(fgBuf.canvas, 0, 0);
    ctx.restore();

    // Pass B: Crisp sunlit golden-cream cut-paper edge bevel (-2px, -2px)
    ctx.save();
    ctx.shadowColor = 'rgba(255, 234, 178, 0.62)';
    ctx.shadowBlur = 2 * s;
    ctx.shadowOffsetX = -2.2 * s;
    ctx.shadowOffsetY = -2.2 * s;
    ctx.drawImage(fgBuf.canvas, 0, 0);
    ctx.restore();

    // Pass C: Clean tactile foreground cutout on top
    ctx.drawImage(fgBuf.canvas, 0, 0);

    // Overall matte cardstock paper texture across the diorama
    if (cardTile) {
      const cPat = getCachedPattern(ctx, cardTile);
      if (cPat) {
        ctx.save();
        ctx.globalAlpha = 0.72;
        ctx.fillStyle = cPat;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }

    // Stacked 2-tier cut-paper shadowbox theatre mat border with real cast shadow!
    const mat1 = Math.round(18 * s);
    ctx.save();
    ctx.shadowColor = 'rgba(2, 4, 12, 0.8)';
    ctx.shadowBlur = 18 * s;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8 * s;
    ctx.strokeStyle = '#181e30';
    ctx.lineWidth = mat1 * 2;
    ctx.strokeRect(0, 0, w, h);
    ctx.restore();

    // Thin cream-gold cut-paper inner rim along the shadowbox mat
    ctx.strokeStyle = 'rgba(246, 224, 174, 0.42)';
    ctx.lineWidth = 1.8 * s;
    ctx.strokeRect(mat1, mat1, w - mat1 * 2, h - mat1 * 2);
    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // ENGINE 7: SUMI-E INK WASH SCROLL (East Asian Rice-Paper Calligraphy)
  // -----------------------------------------------------------------------
  if (renderStyle === 'sumi_e_wash') {
    ctx.save();
    // Warm aged rice-paper scroll ground
    const riceGrad = ctx.createLinearGradient(0, 0, 0, h);
    riceGrad.addColorStop(0, '#f4efe2');
    riceGrad.addColorStop(0.65, '#ece4d0');
    riceGrad.addColorStop(1, '#dfd5bc');
    ctx.fillStyle = riceGrad;
    ctx.fillRect(0, 0, w, h);

    // Draw backdrop via charcoal ink-wash proxy & desaturate into misty sumi-e ink
    const bgCanvas = renderBackdrop('sumi_e_wash');

    ctx.save();
    ctx.globalAlpha = 0.48;
    ctx.filter = 'grayscale(88%) contrast(115%)';
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    // Sweeping translucent rice-paper mountain mist bands
    const mistDrift = Math.sin(globalT * 0.4) * 28 * s;
    const mist1 = ctx.createLinearGradient(0, h * 0.34, 0, h * 0.72);
    mist1.addColorStop(0, 'rgba(244, 239, 226, 0)');
    mist1.addColorStop(0.5, 'rgba(244, 239, 226, 0.62)');
    mist1.addColorStop(1, 'rgba(244, 239, 226, 0)');
    ctx.fillStyle = mist1;
    ctx.fillRect(0, h * 0.34 + mistDrift * 0.25, w, h * 0.38);

    // Foreground characters & props: muted charcoal ink with selective cinnabar/gold warmth
    const fgProxy = createStyledContext(fgBuf.ctx, 'sumi_e_wash');
    layers.drawForeground(fgProxy);

    ctx.save();
    ctx.filter = 'grayscale(52%) contrast(120%) sepia(14%)';
    ctx.shadowColor = 'rgba(24, 26, 32, 0.28)';
    ctx.shadowBlur = (11 + Math.sin(globalT * 1.4) * 3) * s;
    ctx.drawImage(fgBuf.canvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    // Subtle breathing wet-ink wash bloom along scroll margins
    const inkBloomAlpha = 0.06 + 0.03 * Math.sin(globalT * 1.2);
    const bloomGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.28, w * 0.5, h * 0.5, Math.hypot(w, h) * 0.58);
    bloomGrad.addColorStop(0, 'rgba(22, 20, 18, 0)');
    bloomGrad.addColorStop(1, `rgba(22, 20, 18, ${inkBloomAlpha.toFixed(3)})`);
    ctx.fillStyle = bloomGrad;
    ctx.fillRect(0, 0, w, h);

    // Fine fibrous rice-paper texture across scroll
    const paperTile = getCardstockTile();
    if (paperTile) {
      const pPat = getCachedPattern(ctx, paperTile);
      if (pPat) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = pPat;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }

    // Silk brocade scroll mount borders top & bottom + carved cinnabar red Hanko chop seal
    const mountH = Math.round(14 * s);
    ctx.fillStyle = '#332b24';
    ctx.fillRect(0, 0, w, mountH);
    ctx.fillRect(0, h - mountH, w, mountH);
    ctx.fillStyle = '#c8a96e';
    ctx.fillRect(0, mountH, w, 2.5 * s);
    ctx.fillRect(0, h - mountH - 2.5 * s, w, 2.5 * s);

    // Iconic cinnabar-red square calligraphy chop seal in upper-right corner
    const sealSz = Math.round(30 * s);
    const sx = w - sealSz - 24 * s;
    const sy = mountH + 18 * s;
    ctx.fillStyle = '#c92a24';
    ctx.fillRect(sx, sy, sealSz, sealSz);
    ctx.strokeStyle = '#f4efe2';
    ctx.lineWidth = 1.8 * s;
    ctx.strokeRect(sx + 4 * s, sy + 4 * s, sealSz - 8 * s, sealSz - 8 * s);
    ctx.beginPath();
    ctx.moveTo(sx + sealSz * 0.5, sy + 6 * s);
    ctx.lineTo(sx + sealSz * 0.5, sy + sealSz - 6 * s);
    ctx.moveTo(sx + 7 * s, sy + sealSz * 0.48);
    ctx.lineTo(sx + sealSz - 7 * s, sy + sealSz * 0.48);
    ctx.stroke();

    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // ENGINE 8: GREEK AMPHORA & RED-FIGURE POTTERY (Classical Attic Ceramic)
  // -----------------------------------------------------------------------
  if (renderStyle === 'greek_amphora') {
    ctx.save();
    // Baked Attic terracotta clay base
    const clayGrad = ctx.createRadialGradient(w * 0.5, h * 0.48, 40 * s, w * 0.5, h * 0.5, Math.hypot(w, h) * 0.65);
    clayGrad.addColorStop(0, '#e38148');
    clayGrad.addColorStop(0.58, '#bf5728');
    clayGrad.addColorStop(1, '#5e2310');
    ctx.fillStyle = clayGrad;
    ctx.fillRect(0, 0, w, h);

    // Backdrop painted as dark kiln-fired matte obsidian glaze silhouettes
    const bgCanvas = renderBackdrop('greek_amphora');

    ctx.save();
    ctx.filter = 'sepia(88%) saturate(185%) hue-rotate(-24deg) contrast(128%)';
    ctx.globalAlpha = 0.72;
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    // Foreground characters & props in dramatic warm terracotta/gold & incised black-glaze finish
    const fgProxy = createStyledContext(fgBuf.ctx, 'greek_amphora');
    layers.drawForeground(fgProxy);

    ctx.save();
    ctx.filter = 'sepia(55%) saturate(150%) hue-rotate(-14deg) contrast(125%)';
    ctx.shadowColor = 'rgba(18, 10, 6, 0.72)';
    ctx.shadowBlur = 10 * s;
    ctx.shadowOffsetX = 4 * s;
    ctx.shadowOffsetY = 5 * s;
    ctx.drawImage(fgBuf.canvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    // Kiln-fired ceramic grain
    const kilnGrain = getCardstockTile();
    if (kilnGrain) {
      const kPat = getCachedPattern(ctx, kilnGrain);
      if (kPat) {
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = kPat;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }

    // Authentic Classical Greek Meander (Key-Fret) Frieze top & bottom!
    const bandH = Math.round(28 * s);
    for (const by of [0, h - bandH]) {
      ctx.fillStyle = '#140f0c';
      ctx.fillRect(0, by, w, bandH);
      ctx.strokeStyle = '#e0844a';
      ctx.lineWidth = 2.4 * s;
      const step = Math.round(24 * s);
      const pad = Math.round(5 * s);
      ctx.beginPath();
      for (let x = 0; x < w + step; x += step) {
        const y0 = by + pad;
        const y1 = by + bandH - pad;
        const ym = by + bandH * 0.5;
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y0);
        ctx.lineTo(x + step * 0.72, y0);
        ctx.lineTo(x + step * 0.72, ym + 2 * s);
        ctx.lineTo(x + step * 0.34, ym + 2 * s);
        ctx.lineTo(x + step * 0.34, ym - 3 * s);
        ctx.moveTo(x + step * 0.72, y1);
        ctx.lineTo(x + step, y1);
      }
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // ENGINE 9: KENTE & NDEBELE GEOMETRIC FOLK TAPESTRY (African Woven Mural)
  // -----------------------------------------------------------------------
  if (renderStyle === 'kente_tapestry') {
    ctx.save();
    const bgCanvas = renderBackdrop('kente_tapestry');

    // Rich sunlit ochre/cobalt woven mural backdrop boost
    ctx.save();
    ctx.filter = 'saturate(135%) contrast(112%)';
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(245, 174, 42, 0.28)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // Foreground characters & props with bold Ndebele white-and-black double contour rim!
    const fgProxy = createStyledContext(fgBuf.ctx, 'kente_tapestry');
    layers.drawForeground(fgProxy);

    // Crisp Ndebele bright chalk-white outer highlight rim
    ctx.save();
    ctx.shadowColor = 'rgba(255, 246, 220, 0.92)';
    ctx.shadowBlur = 2 * s;
    for (const [ox, oy] of [
      [-3 * s, 0],
      [3 * s, 0],
      [0, -3 * s],
      [0, 3 * s],
    ]) {
      ctx.shadowOffsetX = ox;
      ctx.shadowOffsetY = oy;
      ctx.drawImage(fgBuf.canvas, 0, 0);
    }
    ctx.restore();

    ctx.save();
    ctx.filter = 'saturate(128%) contrast(114%)';
    ctx.drawImage(fgBuf.canvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    // Woven loom fabric warp/weft grain across whole frame
    const loom = getKenteLoomTile();
    if (loom) {
      const lPat = getCachedPattern(ctx, loom);
      if (lPat) {
        ctx.fillStyle = lPat;
        ctx.fillRect(0, 0, w, h);
      }
    }

    // Vibrant Woven Kente Geometric Strip Border top & bottom
    const stripH = Math.round(24 * s);
    const kenteCols = ['#e6a817', '#c4242b', '#197542', '#17428c', '#120e0c'];
    const blockW = Math.round(36 * s);
    for (const sy of [0, h - stripH]) {
      ctx.fillStyle = '#120e0c';
      ctx.fillRect(0, sy, w, stripH);
      for (let x = 0, idx = 0; x < w + blockW; x += blockW, idx++) {
        const col = kenteCols[idx % kenteCols.length];
        ctx.fillStyle = col;
        ctx.fillRect(x + 2 * s, sy + 3 * s, blockW - 4 * s, stripH - 6 * s);
        // Inner geometric diamond / bar motif
        ctx.fillStyle = idx % 2 === 0 ? '#ffd84d' : '#f7f1e3';
        const mx = x + blockW * 0.5;
        const my = sy + stripH * 0.5;
        ctx.beginPath();
        ctx.moveTo(mx, my - 5 * s);
        ctx.lineTo(mx + 7 * s, my);
        ctx.lineTo(mx, my + 5 * s);
        ctx.lineTo(mx - 7 * s, my);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // ENGINE 10: ILLUMINATED MEDIEVAL & CELTIC CODEX (Gilded Vellum)
  // -----------------------------------------------------------------------
  if (renderStyle === 'illuminated_codex') {
    ctx.save();
    // Aged golden calfskin vellum base
    ctx.fillStyle = '#ede0c0';
    ctx.fillRect(0, 0, w, h);

    const bgCanvas = renderBackdrop('illuminated_codex');

    ctx.save();
    ctx.filter = 'sepia(34%) saturate(118%) contrast(106%)';
    ctx.globalAlpha = 0.9;
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    // Warm lapis & gold-leaf manuscript glaze
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(242, 206, 128, 0.36)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    const fgProxy = createStyledContext(fgBuf.ctx, 'illuminated_codex');
    layers.drawForeground(fgProxy);

    // Subtle hammered 24k gold-leaf aura behind illuminated figures + sweeping diagonal gilt shimmer
    ctx.save();
    ctx.shadowColor = 'rgba(245, 204, 82, 0.55)';
    ctx.shadowBlur = 14 * s;
    ctx.filter = 'sepia(18%) saturate(122%)';
    ctx.drawImage(fgBuf.canvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    // Sweeping 24k gold-leaf specular sheen gliding gently across the illuminated vellum folio
    const giltX = ((globalT * 0.22) % 1.6 - 0.3) * w;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const giltGrad = ctx.createLinearGradient(giltX - 110 * s, 0, giltX + 110 * s, h * 0.65);
    giltGrad.addColorStop(0, 'rgba(255, 224, 120, 0)');
    giltGrad.addColorStop(0.5, 'rgba(255, 226, 126, 0.14)');
    giltGrad.addColorStop(1, 'rgba(255, 224, 120, 0)');
    ctx.fillStyle = giltGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // Parchment vellum texture
    const vellum = getParchmentScrimTile();
    if (vellum) {
      const vPat = getCachedPattern(ctx, vellum);
      if (vPat) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = vPat;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }

    // Ornate Illuminated Manuscript Margin + Lapis/Crimson/Gold Corner Rosettes
    const m = Math.round(18 * s);
    ctx.strokeStyle = '#e8d8b0';
    ctx.lineWidth = m * 2;
    ctx.strokeRect(0, 0, w, h);

    ctx.strokeStyle = '#1f3b73';
    ctx.lineWidth = 4 * s;
    ctx.strokeRect(m, m, w - m * 2, h - m * 2);

    ctx.strokeStyle = '#d4a336';
    ctx.lineWidth = 2.2 * s;
    ctx.strokeRect(m + 6 * s, m + 6 * s, w - (m + 6 * s) * 2, h - (m + 6 * s) * 2);

    // Corner illuminated gold-and-crimson rosettes
    for (const [cx, cy] of [
      [m + 3 * s, m + 3 * s],
      [w - m - 3 * s, m + 3 * s],
      [m + 3 * s, h - m - 3 * s],
      [w - m - 3 * s, h - m - 3 * s],
    ]) {
      ctx.fillStyle = '#9e1f2c';
      ctx.beginPath();
      ctx.arc(cx, cy, 11 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f2c85b';
      ctx.lineWidth = 2.2 * s;
      ctx.stroke();
      ctx.fillStyle = '#ffe285';
      ctx.beginPath();
      ctx.arc(cx, cy, 4 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // ENGINE 11: ANIME CEL & SAKUGA SHADED (Crisp Ink & Luminous Rim Bloom)
  // -----------------------------------------------------------------------
  if (renderStyle === 'anime_cel') {
    const bgCanvas = renderBackdrop('anime_cel');

    ctx.save();
    ctx.filter = 'saturate(118%) contrast(106%)';
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.filter = 'none';

    // Luminous anime sky/horizon glow separating painted BG from cel-shaded characters
    const horizonBloom = ctx.createRadialGradient(w * 0.5, h * 0.34, 18 * s, w * 0.5, h * 0.4, Math.max(w, h) * 0.58);
    horizonBloom.addColorStop(0, pal.rimLight);
    horizonBloom.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    horizonBloom.addColorStop(1, 'rgba(10, 14, 34, 0.16)');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = horizonBloom;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    const fgProxy = createStyledContext(fgBuf.ctx, 'anime_cel');
    layers.drawForeground(fgProxy);

    // Subtle crisp anime rim-light separation behind actors
    ctx.save();
    ctx.shadowColor = pal.rimLight;
    ctx.shadowBlur = 10 * s;
    ctx.shadowOffsetX = -2.2 * s;
    ctx.shadowOffsetY = -1.6 * s;
    ctx.filter = 'contrast(112%) saturate(122%)';
    ctx.drawImage(fgBuf.canvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    ctx.drawImage(fgBuf.canvas, 0, 0);
    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // ENGINE 12: MANGA SCREENTONE & G-PEN INK (Monochrome Halftone Comic)
  // -----------------------------------------------------------------------
  if (renderStyle === 'manga_screentone') {
    ctx.save();
    ctx.fillStyle = '#f6f4ee';
    ctx.fillRect(0, 0, w, h);

    const bgCanvas = renderBackdrop('manga_screentone');

    ctx.save();
    ctx.filter = 'grayscale(100%) contrast(155%) brightness(112%)';
    ctx.globalAlpha = 0.72;
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    // 45-degree manga dot screentone overlay on backdrop
    const toneTile = getMangaScreentoneTile();
    if (toneTile) {
      const tPat = getCachedPattern(ctx, toneTile);
      if (tPat) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = tPat;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }

    // Foreground characters in razor-sharp black-and-white G-pen ink with white cutout halo
    const fgProxy = createStyledContext(fgBuf.ctx, 'manga_screentone');
    layers.drawForeground(fgProxy);

    ctx.save();
    ctx.shadowColor = 'rgba(252, 250, 245, 0.96)';
    ctx.shadowBlur = 3 * s;
    for (const [ox, oy] of [
      [-2.5 * s, 0],
      [2.5 * s, 0],
      [0, -2.5 * s],
      [0, 2.5 * s],
    ]) {
      ctx.shadowOffsetX = ox;
      ctx.shadowOffsetY = oy;
      ctx.filter = 'grayscale(100%) contrast(165%) brightness(106%)';
      ctx.drawImage(fgBuf.canvas, 0, 0);
    }
    ctx.filter = 'none';
    ctx.restore();

    ctx.save();
    ctx.filter = 'grayscale(100%) contrast(160%) brightness(106%)';
    ctx.drawImage(fgBuf.canvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    // Crisp manga page gutter & solid black comic panel border
    const m = Math.round(14 * s);
    ctx.strokeStyle = '#f6f4ee';
    ctx.lineWidth = m * 2;
    ctx.strokeRect(0, 0, w, h);
    ctx.strokeStyle = '#0c0c10';
    ctx.lineWidth = 4.5 * s;
    ctx.strokeRect(m, m, w - m * 2, h - m * 2);
    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // ENGINE 13: BLUEPRINT TECHNICAL CYANOTYPE (Drafting Schematic Explainer)
  // -----------------------------------------------------------------------
  if (renderStyle === 'blueprint_technical') {
    ctx.save();
    // Deep Prussian architectural cyanotype sheet
    const bpGrad = ctx.createRadialGradient(w * 0.5, h * 0.48, 30 * s, w * 0.5, h * 0.5, Math.hypot(w, h) * 0.65);
    bpGrad.addColorStop(0, '#103c7a');
    bpGrad.addColorStop(0.6, '#0a2856');
    bpGrad.addColorStop(1, '#061634');
    ctx.fillStyle = bpGrad;
    ctx.fillRect(0, 0, w, h);

    // Precision architectural drafting grid
    const gridTile = getBlueprintGridTile();
    if (gridTile) {
      const gPat = getCachedPattern(ctx, gridTile);
      if (gPat) {
        ctx.fillStyle = gPat;
        ctx.fillRect(0, 0, w, h);
      }
    }

    // Render backdrop tinted into crisp cyanotype blueprint silhouette
    const bgCanvas = renderBackdrop('blueprint_technical');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.42;
    ctx.filter = 'grayscale(100%) sepia(100%) hue-rotate(175deg) saturate(260%) contrast(125%)';
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    // Foreground subjects with crisp luminous blueprint glow
    const fgProxy = createStyledContext(fgBuf.ctx, 'blueprint_technical');
    layers.drawForeground(fgProxy);

    ctx.save();
    ctx.shadowColor = 'rgba(130, 224, 255, 0.72)';
    ctx.shadowBlur = 10 * s;
    ctx.filter = 'sepia(38%) hue-rotate(168deg) saturate(165%) contrast(116%) brightness(108%)';
    ctx.drawImage(fgBuf.canvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    // Technical engineering schematic border + corner registration crosshairs
    const m = Math.round(16 * s);
    ctx.strokeStyle = 'rgba(218, 244, 255, 0.72)';
    ctx.lineWidth = 2.2 * s;
    ctx.strokeRect(m, m, w - m * 2, h - m * 2);
    ctx.strokeStyle = 'rgba(160, 224, 255, 0.34)';
    ctx.lineWidth = 1.1 * s;
    ctx.strokeRect(m + 6 * s, m + 6 * s, w - (m + 6 * s) * 2, h - (m + 6 * s) * 2);

    ctx.strokeStyle = 'rgba(224, 246, 255, 0.62)';
    ctx.lineWidth = 1.4 * s;
    const ch = 9 * s;
    for (const [cx, cy] of [
      [m + 18 * s, m + 18 * s],
      [w - m - 18 * s, m + 18 * s],
      [m + 18 * s, h - m - 18 * s],
      [w - m - 18 * s, h - m - 18 * s],
    ]) {
      ctx.beginPath();
      ctx.moveTo(cx - ch, cy);
      ctx.lineTo(cx + ch, cy);
      ctx.moveTo(cx, cy - ch);
      ctx.lineTo(cx, cy + ch);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // ENGINE 14: GOUACHE MATTE STORYBOOK (Warm Velvety Editorial Painterly)
  // -----------------------------------------------------------------------
  if (renderStyle === 'gouache_storybook') {
    const bgCanvas = renderBackdrop('gouache_storybook');

    ctx.save();
    ctx.filter = 'saturate(96%) contrast(96%) brightness(106%)';
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.filter = 'none';

    // Warm sunlit matte pastel wash lifting deep blacks into velvety gouache shadows
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(255, 234, 202, 0.12)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    const fgProxy = createStyledContext(fgBuf.ctx, 'gouache_storybook');
    layers.drawForeground(fgProxy);

    ctx.save();
    ctx.shadowColor = 'rgba(34, 24, 18, 0.34)';
    ctx.shadowBlur = 12 * s;
    ctx.shadowOffsetY = 4 * s;
    ctx.filter = 'saturate(108%) contrast(102%)';
    ctx.drawImage(fgBuf.canvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    // Cold-pressed matte gouache paper tooth across whole frame
    const tooth = getGouacheToothTile();
    if (tooth) {
      const tPat = getCachedPattern(ctx, tooth);
      if (tPat) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = tPat;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }
    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // ENGINE 15: NEON CYBERNOIR (Chromatic Rim Glow & Deterministic Neon Flicker)
  // -----------------------------------------------------------------------
  if (renderStyle === 'neon_cybernoir') {
    const flicker = computeDeterministicFlicker(globalT, 'neon_cybernoir', mood);
    const bgCanvas = renderBackdrop('neon_cybernoir');

    ctx.save();
    ctx.filter = 'contrast(124%) saturate(138%) hue-rotate(-10deg) brightness(86%)';
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.filter = 'none';

    // Deep synthwave indigo/magenta nocturnal atmosphere
    const cyberWash = ctx.createLinearGradient(0, 0, w, h);
    cyberWash.addColorStop(0, `rgba(28, 224, 255, ${(0.18 * flicker).toFixed(3)})`);
    cyberWash.addColorStop(0.5, 'rgba(18, 10, 42, 0.22)');
    cyberWash.addColorStop(1, `rgba(255, 38, 168, ${(0.22 * flicker).toFixed(3)})`);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = cyberWash;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    const fgProxy = createStyledContext(fgBuf.ctx, 'neon_cybernoir');
    layers.drawForeground(fgProxy);

    // Dual cyan/magenta chromatic neon edge halos
    ctx.save();
    ctx.globalAlpha = 0.52 * flicker;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14 * s;
    ctx.drawImage(fgBuf.canvas, -2.4 * s, 0);
    ctx.shadowColor = '#ff2a9d';
    ctx.shadowBlur = 14 * s;
    ctx.drawImage(fgBuf.canvas, 2.4 * s, 0);
    ctx.restore();

    ctx.save();
    ctx.filter = 'contrast(118%) saturate(130%)';
    ctx.drawImage(fgBuf.canvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    // Subtle holographic horizontal scanlines
    ctx.save();
    ctx.fillStyle = 'rgba(4, 8, 22, 0.14)';
    const scanStep = Math.max(3, Math.round(4 * s));
    for (let y = 0; y < h; y += scanStep) {
      ctx.fillRect(0, y, w, 1);
    }
    ctx.restore();
    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // ENGINE 16: STITCHED FELT PUPPET THEATRE (Borrowed from Prototype J)
  // -----------------------------------------------------------------------
  if (renderStyle === 'felt_puppet') {
    const bgCanvas = renderBackdrop('felt_puppet');

    ctx.save();
    ctx.filter = 'saturate(106%) contrast(98%)';
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.filter = 'none';

    // Warm tabletop stage wool-felt texture on backdrop
    const feltTile = getFeltWeaveTile();
    if (feltTile) {
      const fPat = getCachedPattern(ctx, feltTile);
      if (fPat) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = fPat;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }

    // Foreground puppets rendered with blanket-stitch seams & felt weave inside shapes
    const fgProxy = createStyledContext(fgBuf.ctx, 'felt_puppet');
    layers.drawForeground(fgProxy);

    if (feltTile) {
      const fPat = getCachedPattern(fgBuf.ctx, feltTile);
      if (fPat) {
        fgBuf.ctx.save();
        fgBuf.ctx.globalCompositeOperation = 'source-atop';
        fgBuf.ctx.fillStyle = fPat;
        fgBuf.ctx.fillRect(0, 0, w, h);
        fgBuf.ctx.restore();
      }
    }

    // Soft plush cast shadow onto felt backdrop
    ctx.save();
    ctx.shadowColor = 'rgba(18, 12, 8, 0.68)';
    ctx.shadowBlur = 16 * s;
    ctx.shadowOffsetX = 6 * s;
    ctx.shadowOffsetY = 9 * s;
    ctx.drawImage(fgBuf.canvas, 0, 0);
    ctx.restore();

    // Soft warm wool top-edge rim bevel
    ctx.save();
    ctx.shadowColor = 'rgba(255, 244, 214, 0.52)';
    ctx.shadowBlur = 3 * s;
    ctx.shadowOffsetX = -1.8 * s;
    ctx.shadowOffsetY = -1.8 * s;
    ctx.drawImage(fgBuf.canvas, 0, 0);
    ctx.restore();

    ctx.drawImage(fgBuf.canvas, 0, 0);

    // Hand-stitched fabric proscenium border
    const bm = Math.round(14 * s);
    ctx.strokeStyle = '#261b14';
    ctx.lineWidth = bm * 2;
    ctx.strokeRect(0, 0, w, h);
    ctx.save();
    ctx.strokeStyle = 'rgba(248, 232, 198, 0.72)';
    ctx.lineWidth = 2.2 * s;
    ctx.setLineDash([7 * s, 5 * s]);
    ctx.strokeRect(bm, bm, w - bm * 2, h - bm * 2);
    ctx.restore();
    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // ENGINE 17: RISOGRAPH HALFTONE PRINT (Borrowed from Prototype Z v2)
  // -----------------------------------------------------------------------
  if (renderStyle === 'risograph_print') {
    ctx.save();
    // Warm uncoated zine paper stock
    ctx.fillStyle = '#f6eedb';
    ctx.fillRect(0, 0, w, h);

    const bgCanvas = renderBackdrop('risograph_print');

    ctx.save();
    ctx.globalAlpha = 0.84;
    ctx.filter = 'saturate(135%) contrast(112%)';
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    // Warm paper overprint glaze
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(246, 234, 206, 0.78)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    const fgProxy = createStyledContext(fgBuf.ctx, 'risograph_print');
    layers.drawForeground(fgProxy);

    // Deterministic stepped sub-pixel coral/teal risograph plate misregistration (10fps)
    const risoStep = Math.floor(globalT * 10);
    const rx = (2.4 + Math.sin(risoStep * 1.9) * 0.8) * s;
    const ry = (1.6 + Math.cos(risoStep * 1.5) * 0.6) * s;
    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.filter = 'sepia(100%) saturate(320%) hue-rotate(-35deg)';
    ctx.drawImage(fgBuf.canvas, rx, ry);
    ctx.filter = 'sepia(100%) saturate(260%) hue-rotate(140deg)';
    ctx.drawImage(fgBuf.canvas, -rx * 0.75, -ry * 0.75);
    ctx.filter = 'none';
    ctx.restore();

    // Main risograph soy-ink pass
    ctx.save();
    ctx.filter = 'saturate(128%) contrast(114%)';
    ctx.drawImage(fgBuf.canvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    // Ben-Day halftone dot screen over whole print
    const risoTile = getRisographHalftoneTile();
    if (risoTile) {
      const rPat = getCachedPattern(ctx, risoTile);
      if (rPat) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = rPat;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }

    // Uncoated risograph print paper margin + indigo & coral registration lines
    const m = Math.round(14 * s);
    ctx.strokeStyle = '#f6eedb';
    ctx.lineWidth = m * 2;
    ctx.strokeRect(0, 0, w, h);
    ctx.strokeStyle = '#1d2452';
    ctx.lineWidth = 2.6 * s;
    ctx.strokeRect(m, m, w - m * 2, h - m * 2);
    ctx.strokeStyle = 'rgba(235, 76, 68, 0.72)';
    ctx.lineWidth = 1.4 * s;
    ctx.strokeRect(m + 4 * s, m + 4 * s, w - (m + 4 * s) * 2, h - (m + 4 * s) * 2);
    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // ENGINE 18: BACKLIT SAND ART LIGHTBOX (Warm Glowing Amber Quartz Table)
  // -----------------------------------------------------------------------
  if (renderStyle === 'backlit_sand') {
    const flicker = computeDeterministicFlicker(globalT, 'backlit_sand', mood);
    ctx.save();
    // Illuminated warm amber frosted-glass sand lightbox
    const boxGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 24 * s, w * 0.5, h * 0.5, Math.hypot(w, h) * 0.62);
    boxGrad.addColorStop(0, '#fff4cf');
    boxGrad.addColorStop(0.45, '#f2b85b');
    boxGrad.addColorStop(0.82, '#aa5b1c');
    boxGrad.addColorStop(1, '#3b1907');
    ctx.fillStyle = boxGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle lamp pulse across frosted glass
    ctx.save();
    ctx.globalAlpha = 0.22 * flicker;
    ctx.fillStyle = '#fff8de';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // Backdrop painted as soft translucent dusted-sand dunes
    const bgCanvas = renderBackdrop('backlit_sand');
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.72;
    ctx.filter = 'sepia(96%) saturate(165%) hue-rotate(-14deg) contrast(125%)';
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    // Foreground sculpted sand figures with warm amber glow
    const fgProxy = createStyledContext(fgBuf.ctx, 'backlit_sand');
    layers.drawForeground(fgProxy);

    ctx.save();
    ctx.filter = 'sepia(82%) saturate(155%) hue-rotate(-10deg) contrast(128%)';
    ctx.shadowColor = 'rgba(38, 16, 4, 0.72)';
    ctx.shadowBlur = 12 * s;
    ctx.drawImage(fgBuf.canvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    // Mineral quartz sand stipple texture
    const sandTile = getSandStippleTile();
    if (sandTile) {
      const sPat = getCachedPattern(ctx, sandTile);
      if (sPat) {
        ctx.fillStyle = sPat;
        ctx.fillRect(0, 0, w, h);
      }
    }

    // Wooden lightbox bezel frame
    const bm = Math.round(13 * s);
    ctx.strokeStyle = '#1e0d04';
    ctx.lineWidth = bm * 2;
    ctx.strokeRect(0, 0, w, h);
    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // ENGINE 19: SCRATCHBOARD NOIR ENGRAVING (White-on-Obsidian Clayboard)
  // -----------------------------------------------------------------------
  if (renderStyle === 'scratchboard_noir') {
    ctx.save();
    ctx.fillStyle = '#070709';
    ctx.fillRect(0, 0, w, h);

    const bgCanvas = renderBackdrop('scratchboard_noir');

    ctx.save();
    ctx.globalAlpha = 0.56;
    ctx.filter = 'grayscale(100%) contrast(175%) brightness(78%) sepia(24%)';
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    // Scraperboard white needle cross-hatching over deep obsidian backdrop
    const hatchTile = getScratchboardHatchTile();
    if (hatchTile) {
      const hPat = getCachedPattern(ctx, hatchTile);
      if (hPat) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.72;
        ctx.fillStyle = hPat;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }

    // Foreground subjects etched with luminous ivory-gold rim engraving
    const fgProxy = createStyledContext(fgBuf.ctx, 'scratchboard_noir');
    layers.drawForeground(fgProxy);

    ctx.save();
    ctx.shadowColor = 'rgba(248, 232, 186, 0.78)';
    ctx.shadowBlur = 5 * s;
    ctx.filter = 'grayscale(92%) sepia(28%) contrast(152%) brightness(102%)';
    ctx.drawImage(fgBuf.canvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    // Fine ivory engraving plate double-border
    const m = Math.round(14 * s);
    ctx.strokeStyle = '#070709';
    ctx.lineWidth = m * 2;
    ctx.strokeRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(244, 231, 195, 0.82)';
    ctx.lineWidth = 2.4 * s;
    ctx.strokeRect(m, m, w - m * 2, h - m * 2);
    ctx.strokeStyle = 'rgba(244, 231, 195, 0.34)';
    ctx.lineWidth = 1.1 * s;
    ctx.strokeRect(m + 5 * s, m + 5 * s, w - (m + 5 * s) * 2, h - (m + 5 * s) * 2);
    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // ENGINE 20: BYZANTINE GOLD & ART NOUVEAU MOSAIC (Gilded Tesserae)
  // -----------------------------------------------------------------------
  if (renderStyle === 'byzantine_mosaic') {
    const bgCanvas = renderBackdrop('byzantine_mosaic');

    ctx.save();
    ctx.filter = 'saturate(126%) contrast(112%) sepia(22%)';
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.filter = 'none';

    // Warm gilded gold-leaf halo wash
    const goldWash = ctx.createRadialGradient(w * 0.5, h * 0.38, 20 * s, w * 0.5, h * 0.45, Math.hypot(w, h) * 0.58);
    goldWash.addColorStop(0, 'rgba(255, 218, 102, 0.32)');
    goldWash.addColorStop(0.6, 'rgba(218, 152, 34, 0.14)');
    goldWash.addColorStop(1, 'rgba(20, 12, 6, 0.28)');
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = goldWash;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // Ceramic tesserae tile lattice on backdrop only (faces remain clean)
    const mosaicTile = getMosaicTesseraeTile();
    if (mosaicTile) {
      const mPat = getCachedPattern(ctx, mosaicTile);
      if (mPat) {
        ctx.save();
        ctx.globalAlpha = 0.78;
        ctx.fillStyle = mPat;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }

    const fgProxy = createStyledContext(fgBuf.ctx, 'byzantine_mosaic');
    layers.drawForeground(fgProxy);

    ctx.save();
    ctx.shadowColor = 'rgba(255, 208, 78, 0.62)';
    ctx.shadowBlur = 16 * s;
    ctx.filter = 'saturate(122%) contrast(110%)';
    ctx.drawImage(fgBuf.canvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();
    ctx.drawImage(fgBuf.canvas, 0, 0);

    // Imperial gilded mosaic border with corner emerald/gold tessera medallions
    const m = Math.round(15 * s);
    ctx.strokeStyle = '#1b1208';
    ctx.lineWidth = m * 2;
    ctx.strokeRect(0, 0, w, h);
    ctx.strokeStyle = '#e8b948';
    ctx.lineWidth = 3.6 * s;
    ctx.strokeRect(m, m, w - m * 2, h - m * 2);
    ctx.strokeStyle = '#2c6e63';
    ctx.lineWidth = 1.6 * s;
    ctx.strokeRect(m + 6 * s, m + 6 * s, w - (m + 6 * s) * 2, h - (m + 6 * s) * 2);

    for (const [cx, cy] of [
      [m, m],
      [w - m, m],
      [m, h - m],
      [w - m, h - m],
    ]) {
      ctx.fillStyle = '#f2c85b';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 8 * s);
      ctx.lineTo(cx + 8 * s, cy);
      ctx.lineTo(cx, cy + 8 * s);
      ctx.lineTo(cx - 8 * s, cy);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    return;
  }
}

// =========================================================================
// VELOCITY-DRIVEN TAPERED PENCIL/INK MOTION ARCS (Borrowed from Prototype J)
// =========================================================================
export function drawTaperedMotionArcs(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
  scale: number,
  color: string,
  style: RenderStyleId
): void {
  const speed = Math.hypot(dx, dy);
  if (speed < 6 * scale) return;

  const isGraphicAccent =
    style === 'felt_puppet' ||
    style === 'anime_cel' ||
    style === 'manga_screentone' ||
    style === 'risograph_print' ||
    style === 'woodblock_print' ||
    style === 'scratchboard_noir';

  const baseAlpha = isGraphicAccent ? 0.42 : 0.24;
  const strokeColor =
    style === 'manga_screentone'
      ? '#121218'
      : style === 'blueprint_technical'
        ? '#b8ebff'
        : style === 'scratchboard_noir'
          ? '#f4e7c3'
          : style === 'felt_puppet'
            ? '#f5ebd4'
            : color;

  // Tail extends opposite to motion vector (dx, dy)
  const dirX = dx / speed;
  const dirY = dy / speed;
  const len = Math.min(speed * 1.45, 115 * scale);
  const perpX = -dirY;
  const perpY = dirX;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = strokeColor;

  // Draw 3 restrained tapered whisper arcs behind the moving actor
  const offsets = [
    { lateral: -18 * scale, curve: -12 * scale, width: 2.2 * scale, alpha: baseAlpha * 0.72, factor: 0.78 },
    { lateral: 0, curve: -6 * scale, width: 3.4 * scale, alpha: baseAlpha, factor: 1.0 },
    { lateral: 18 * scale, curve: 10 * scale, width: 2.0 * scale, alpha: baseAlpha * 0.65, factor: 0.72 },
  ];

  for (const arc of offsets) {
    const startX = x + perpX * arc.lateral - dirX * (16 * scale);
    const startY = y + perpY * arc.lateral - dirY * (16 * scale);
    const endX = startX - dirX * len * arc.factor;
    const endY = startY - dirY * len * arc.factor;
    const ctrlX = (startX + endX) * 0.5 + perpX * arc.curve;
    const ctrlY = (startY + endY) * 0.5 + perpY * arc.curve;

    const grad = ctx.createLinearGradient(startX, startY, endX, endY);
    grad.addColorStop(0, strokeColor);
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.globalAlpha = arc.alpha;
    ctx.strokeStyle = grad;
    ctx.lineWidth = arc.width;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    ctx.stroke();
  }
  ctx.restore();
}

// =========================================================================
// COMPOSABLE POST-FX PASS LAYER (Pixel Composer Bayer 4x4 & Integer Grid)
// Zero per-frame canvas allocations: uses pre-baked tiles & pooled buffers.
// =========================================================================

const BAYER_4X4: ReadonlyArray<ReadonlyArray<number>> = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

let cachedBayerTile: HTMLCanvasElement | null = null;
function getBayer4x4Tile(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedBayerTile) return cachedBayerTile;

  const cell = 3;
  const size = 4 * cell;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  if (!g) return null;

  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const v = (BAYER_4X4[y][x] + 0.5) / 16; // 0.03 .. 0.97
      const lum = Math.round(v * 255);
      g.fillStyle = `rgb(${lum}, ${lum}, ${lum})`;
      g.fillRect(x * cell, y * cell, cell, cell);
    }
  }
  cachedBayerTile = c;
  return c;
}

let cachedHalftoneZineTile: HTMLCanvasElement | null = null;
function getHalftoneZineTile(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedHalftoneZineTile) return cachedHalftoneZineTile;

  const size = 16;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  if (!g) return null;

  g.fillStyle = 'rgba(10, 12, 22, 0.42)';
  const pts: Array<[number, number, number]> = [
    [4, 4, 2.1],
    [12, 12, 2.1],
    [12, 4, 1.35],
    [4, 12, 1.35],
  ];
  for (const [px, py, r] of pts) {
    g.beginPath();
    g.arc(px, py, r, 0, Math.PI * 2);
    g.fill();
  }
  cachedHalftoneZineTile = c;
  return c;
}

/**
 * Applies a deterministic, composable post-processing pass onto the composed scene
 * using pooled offscreen buffers and pre-baked static pattern tiles (zero per-frame allocs).
 */
export function applyComposablePostFxPass(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pass: PostFxPassId | undefined,
  globalT: number
): void {
  if (!pass || pass === 'none' || w < 16 || h < 16) return;
  const s = Math.min(w, h) / 620;

  if (pass === 'bayer_dither') {
    const tile = getBayer4x4Tile();
    if (!tile) return;
    const pat = getCachedPattern(ctx, tile);
    if (!pat) return;
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = 0.18;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    return;
  }

  if (pass === 'pixel_grid_16bit') {
    // True integer-grid nearest-neighbor pixel snap (270p vertical resolution)
    const targetH = Math.max(90, Math.min(270, Math.round(h / 4)));
    const targetW = Math.max(120, Math.round((w / h) * targetH));
    const loBuf = getLayer('postfx_pixel_lo', targetW, targetH);
    if (!loBuf) return;

    loBuf.ctx.imageSmoothingEnabled = false;
    loBuf.ctx.drawImage(ctx.canvas, 0, 0, w, h, 0, 0, targetW, targetH);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(loBuf.canvas, 0, 0, targetW, targetH, 0, 0, w, h);

    // Layer ordered Bayer 4x4 dither matrix for crisp 16-bit palette texture
    const bayer = getBayer4x4Tile();
    if (bayer) {
      const pat = getCachedPattern(ctx, bayer);
      if (pat) {
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, w, h);
      }
    }
    ctx.restore();
    return;
  }

  if (pass === 'crisp_outline') {
    const snap = getLayer('postfx_snap', w, h);
    if (!snap) return;
    snap.ctx.drawImage(ctx.canvas, 0, 0, w, h, 0, 0, w, h);

    const d = Math.max(1, Math.round(1.6 * s));
    ctx.save();
    // Subtle dark multi-directional edge punch + graphic contrast lift
    ctx.globalCompositeOperation = 'darken';
    ctx.globalAlpha = 0.28;
    ctx.drawImage(snap.canvas, -d, 0);
    ctx.drawImage(snap.canvas, d, 0);
    ctx.drawImage(snap.canvas, 0, -d);
    ctx.drawImage(snap.canvas, 0, d);

    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.14;
    ctx.drawImage(snap.canvas, 0, 0);
    ctx.restore();
    return;
  }

  if (pass === 'chromatic_pop') {
    const snap = getLayer('postfx_snap', w, h);
    if (!snap) return;
    snap.ctx.drawImage(ctx.canvas, 0, 0, w, h, 0, 0, w, h);

    const shift = Math.max(1.5, (2.4 + Math.sin(globalT * 2.2) * 0.4) * s);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.18;
    ctx.drawImage(snap.canvas, shift, 0);
    ctx.drawImage(snap.canvas, -shift, 0);

    // Subtle prism tint along horizontal edges
    const edgeGrad = ctx.createLinearGradient(0, 0, w, 0);
    edgeGrad.addColorStop(0, 'rgba(0, 240, 255, 0.14)');
    edgeGrad.addColorStop(0.14, 'rgba(0, 0, 0, 0)');
    edgeGrad.addColorStop(0.86, 'rgba(0, 0, 0, 0)');
    edgeGrad.addColorStop(1, 'rgba(255, 42, 133, 0.14)');
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 1;
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    return;
  }

  if (pass === 'halftone_zine') {
    const tile = getHalftoneZineTile();
    if (!tile) return;
    const pat = getCachedPattern(ctx, tile);
    if (!pat) return;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#f6ecd7';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}
