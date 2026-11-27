/**
 * Stagecraft Studio — Frame-Locked Sprite Sheet Slicer & Animated Custom Props (Upgrade 23)
 *
 * Pure deterministic helpers to slice multi-frame PNG/WebP sprite sheets in lockstep
 * with STUDIO_FPS and active motionCadence (60fps / 24fps / 12fps).
 */

import { STUDIO_FPS, SpriteSheetConfig } from './types';

export interface SpriteSheetFrameRect {
  frameIndex: number;
  col: number;
  row: number;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export interface SpriteSheetGridHint {
  cols: number;
  rows: number;
  frameCount: number;
  fps: number;
  confidence: 'high' | 'medium' | 'fallback';
}

export function normalizeSpriteSheetConfig(raw?: Partial<SpriteSheetConfig> | null): SpriteSheetConfig {
  const cols = Math.max(1, Math.min(16, Math.round(Number(raw?.cols) || 1)));
  const rows = Math.max(1, Math.min(16, Math.round(Number(raw?.rows) || 1)));
  const maxCells = Math.min(256, cols * rows);
  const frameCount = Math.max(
    1,
    Math.min(maxCells, Math.round(Number(raw?.frameCount) || maxCells))
  );
  const fps = Math.max(2, Math.min(30, Math.round(Number(raw?.fps) || 12)));
  const loop = typeof raw?.loop === 'boolean' ? raw.loop : true;
  return { cols, rows, frameCount, fps, loop };
}

/**
 * Computes exact source rectangle `(sx, sy, sw, sh)` for a sprite sheet at `localT` seconds.
 * Optionally quantizes time to `cadenceFps` (e.g., 12fps or 24fps) before selecting frame index
 * so animated custom props obey the active art engine's stepped motion cadence.
 */
export function computeSpriteSheetFrameRect(
  sheet: SpriteSheetConfig,
  imgW: number,
  imgH: number,
  localT: number,
  cadenceFps?: number
): SpriteSheetFrameRect {
  const cfg = normalizeSpriteSheetConfig(sheet);
  const safeW = Math.max(1, Math.floor(Number.isFinite(imgW) ? imgW : 1));
  const safeH = Math.max(1, Math.floor(Number.isFinite(imgH) ? imgH : 1));
  const safeT = Math.max(0, Number.isFinite(localT) ? localT : 0);

  // Quantize to STUDIO_FPS first, then optionally step to cadenceFps
  let qTime = Math.floor(safeT * STUDIO_FPS + 1e-6) / STUDIO_FPS;
  if (typeof cadenceFps === 'number' && Number.isFinite(cadenceFps) && cadenceFps > 0 && cadenceFps < STUDIO_FPS) {
    qTime = Math.floor(qTime * cadenceFps + 1e-6) / cadenceFps;
  }

  const rawIndex = Math.floor(qTime * cfg.fps + 1e-6);
  const frameIndex =
    cfg.loop !== false
      ? ((rawIndex % cfg.frameCount) + cfg.frameCount) % cfg.frameCount
      : Math.max(0, Math.min(cfg.frameCount - 1, rawIndex));

  const col = frameIndex % cfg.cols;
  const row = Math.min(cfg.rows - 1, Math.floor(frameIndex / cfg.cols));
  const sw = safeW / cfg.cols;
  const sh = safeH / cfg.rows;

  return {
    frameIndex,
    col,
    row,
    sx: Math.round(col * sw),
    sy: Math.round(row * sh),
    sw: Math.max(1, Math.round(sw)),
    sh: Math.max(1, Math.round(sh)),
  };
}

/**
 * Heuristically suggests sensible `(cols, rows)` for standard square-tile horizontal strips
 * or balanced grid sheets (e.g. 512x128 => 4x1, 512x256 => 4x2, 512x512 => 4x4 or 2x2).
 */
export function detectGridHint(imgW: number, imgH: number): SpriteSheetGridHint {
  const w = Math.max(1, Math.round(imgW));
  const h = Math.max(1, Math.round(imgH));

  // Case 1: Clean horizontal strip of square tiles (e.g., 4x1, 6x1, 8x1)
  if (w > h) {
    const ratio = w / h;
    const rounded = Math.round(ratio);
    // Standard 2:1 sheets >= 256px tall (e.g., 512x256) are almost always 4x2 (8-frame) grids
    if (rounded === 2 && Math.abs(ratio - 2) <= 0.06 && h >= 256 && w % 4 === 0 && h % 2 === 0) {
      return {
        cols: 4,
        rows: 2,
        frameCount: 8,
        fps: 12,
        confidence: 'medium',
      };
    }
    if (rounded >= 2 && rounded <= 16 && Math.abs(ratio - rounded) <= 0.08) {
      return {
        cols: rounded,
        rows: 1,
        frameCount: rounded,
        fps: rounded >= 8 ? 12 : 8,
        confidence: 'high',
      };
    }

    // Check 2-row or 3-row square-tile sheets (e.g., 4x2 = 2:1 ratio with divisible dims)
    for (const rows of [2, 3, 4]) {
      const cell = h / rows;
      const colsFloat = w / cell;
      const cols = Math.round(colsFloat);
      if (cols >= 2 && cols <= 16 && Math.abs(colsFloat - cols) <= 0.06 && cell >= 24) {
        return {
          cols,
          rows,
          frameCount: Math.min(256, cols * rows),
          fps: 12,
          confidence: 'medium',
        };
      }
    }
  }

  // Case 2: Vertical strip of square tiles
  if (h > w) {
    const ratio = h / w;
    const rounded = Math.round(ratio);
    if (rounded >= 2 && rounded <= 16 && Math.abs(ratio - rounded) <= 0.08) {
      return {
        cols: 1,
        rows: rounded,
        frameCount: rounded,
        fps: rounded >= 8 ? 12 : 8,
        confidence: 'high',
      };
    }
  }

  // Case 3: Square sheet — detect clean 4x4 (if >= 256px) or 2x2 (if >= 128px)
  if (Math.abs(w - h) <= Math.max(2, w * 0.04)) {
    if (w >= 256 && w % 4 === 0) {
      return { cols: 4, rows: 4, frameCount: 16, fps: 12, confidence: 'medium' };
    }
    if (w >= 128 && w % 2 === 0) {
      return { cols: 2, rows: 2, frameCount: 4, fps: 8, confidence: 'medium' };
    }
  }

  return { cols: 1, rows: 1, frameCount: 1, fps: 12, confidence: 'fallback' };
}
