import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Film,
  Grid,
  ImagePlus,
  Layers,
  Pause,
  Play,
  Scissors,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { MoodId, SpriteSheetConfig } from './types';
import {
  getMoodPaletteHexes,
  processSpriteRgbaPipeline,
} from './spritePrepTools';
import {
  computeSpriteSheetFrameRect,
  detectGridHint,
  normalizeSpriteSheetConfig,
} from './spriteSheetSlicer';

type PrepTab = 'cutout' | 'sheet';

interface SpritePrepModalProps {
  open: boolean;
  activeMood: MoodId;
  sceneNumber: number;
  initialPropDataUrl?: string;
  initialPropLabel?: string;
  initialSheet?: SpriteSheetConfig;
  onApplyProp: (dataUrl: string, label: string, sheet?: SpriteSheetConfig) => void;
  onApplyBackdrop: (dataUrl: string, label: string) => void;
  onClose: () => void;
}

const MAX_WORK_DIM = 512;

/**
 * Generates a deterministic sample geometric relic or 4-frame animated flame sprite sheet
 * so creators can test Cutout Prep & Sprite Sheet Slicer immediately with zero uploads.
 */
function buildDeterministicDemoDataUrl(kind: 'relic' | 'sheet'): {
  dataUrl: string;
  label: string;
} {
  const c = document.createElement('canvas');
  if (kind === 'relic') {
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');
    if (ctx) {
      // Solid studio chroma backdrop for testing flat-background removal
      ctx.fillStyle = '#d7f4e8';
      ctx.fillRect(0, 0, 256, 256);

      // Golden crescent lantern relic
      ctx.fillStyle = '#3b2416';
      ctx.fillRect(114, 44, 28, 18);
      ctx.beginPath();
      ctx.arc(128, 138, 70, 0, Math.PI * 2);
      ctx.fillStyle = '#e59a24';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(128, 138, 48, 0, Math.PI * 2);
      ctx.fillStyle = '#fff1b8';
      ctx.fill();
      // Interior highlight that shares the pale tint to prove flood-fill preserves interiors
      ctx.beginPath();
      ctx.arc(128, 138, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#d7f4e8';
      ctx.fill();
      ctx.fillStyle = '#8b2635';
      ctx.fillRect(92, 198, 72, 22);
    }
    return { dataUrl: c.toDataURL('image/png'), label: 'Demo Lantern Relic' };
  }

  // 4-frame (512x128) animated mystic flame orb sprite sheet
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 512, 128);
    for (let f = 0; f < 4; f++) {
      const cx = f * 128 + 64;
      const cy = 72;
      const phase = (f / 4) * Math.PI * 2;
      const stretch = 1 + Math.sin(phase) * 0.14;
      const lean = Math.cos(phase) * 9;

      // Outer aura
      const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, 52);
      grad.addColorStop(0, 'rgba(255, 226, 118, 0.95)');
      grad.addColorStop(0.55, 'rgba(249, 115, 22, 0.78)');
      grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 52, 0, Math.PI * 2);
      ctx.fill();

      // Flame tear silhouette
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.moveTo(cx + lean, cy - 48 * stretch);
      ctx.quadraticCurveTo(cx + 34, cy - 4, cx, cy + 36);
      ctx.quadraticCurveTo(cx - 34, cy - 4, cx + lean, cy - 48 * stretch);
      ctx.fill();

      // Inner bright core
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(cx + lean * 0.35, cy + 4, 14, 24 * stretch, 0, 0, Math.PI * 2);
      ctx.fill();

      // Orbiting sparks
      for (let k = 0; k < 3; k++) {
        const ang = phase + k * 2.09;
        const sx = cx + Math.cos(ang) * 34;
        const sy = cy - 6 + Math.sin(ang) * 26;
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  return { dataUrl: c.toDataURL('image/png'), label: 'Animated Flame Orb (4f)' };
}

function drawCheckerboard(ctx: CanvasRenderingContext2D, w: number, h: number, cell = 12): void {
  ctx.fillStyle = '#181e30';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#232b42';
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      if (((x / cell + y / cell) & 1) === 0) {
        ctx.fillRect(x, y, cell, cell);
      }
    }
  }
}

export const SpritePrepModal: React.FC<SpritePrepModalProps> = ({
  open,
  activeMood,
  sceneNumber,
  initialPropDataUrl,
  initialPropLabel,
  initialSheet,
  onApplyProp,
  onApplyBackdrop,
  onClose,
}) => {
  const [tab, setTab] = useState<PrepTab>(initialSheet ? 'sheet' : 'cutout');
  const [sourceDataUrl, setSourceDataUrl] = useState<string>(initialPropDataUrl || '');
  const [assetLabel, setAssetLabel] = useState<string>(initialPropLabel || 'Custom Sprite');
  const [sourceDims, setSourceDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  // Cutout & Pixel Prep Controls
  const [removeBg, setRemoveBg] = useState(true);
  const [bgTolerance, setBgTolerance] = useState(40);
  const [bgFeather, setBgFeather] = useState(true);
  const [outlineEnabled, setOutlineEnabled] = useState(true);
  const [outlineThickness, setOutlineThickness] = useState(3);
  const [outlineColor, setOutlineColor] = useState('#14121d');
  const [outlinePixelSnap, setOutlinePixelSnap] = useState(false);
  const [pixelSize, setPixelSize] = useState(1);
  const [matchMoodPalette, setMatchMoodPalette] = useState(false);

  // Sprite Sheet Slicer Controls
  const [cols, setCols] = useState(initialSheet?.cols ?? 4);
  const [rows, setRows] = useState(initialSheet?.rows ?? 1);
  const [frameCount, setFrameCount] = useState(initialSheet?.frameCount ?? 4);
  const [sheetFps, setSheetFps] = useState(initialSheet?.fps ?? 10);
  const [sheetLoop, setSheetLoop] = useState(initialSheet?.loop !== false);
  const [sheetPlaying, setSheetPlaying] = useState(true);
  const [previewFrameIdx, setPreviewFrameIdx] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const beforeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const afterCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processedDataUrlRef = useRef<string>('');
  const sheetGridCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sheetAnimCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const moodPalette = useMemo(() => getMoodPaletteHexes(activeMood), [activeMood]);

  // Seed default demo image if user opens modal with no existing custom prop
  useEffect(() => {
    if (!open) return;
    setStatusNote(null);
    if (initialPropDataUrl) {
      setSourceDataUrl(initialPropDataUrl);
      setAssetLabel(initialPropLabel || 'Custom Sprite');
      if (initialSheet) {
        setCols(initialSheet.cols);
        setRows(initialSheet.rows);
        setFrameCount(initialSheet.frameCount);
        setSheetFps(initialSheet.fps);
        setSheetLoop(initialSheet.loop !== false);
        setTab('sheet');
      }
    } else if (!sourceDataUrl) {
      const demo = buildDeterministicDemoDataUrl(tab === 'sheet' ? 'sheet' : 'relic');
      setSourceDataUrl(demo.dataUrl);
      setAssetLabel(demo.label);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Decode sourceDataUrl into an HTMLImageElement
  useEffect(() => {
    if (!open || !sourceDataUrl) {
      setLoadedImage(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      setLoadedImage(img);
      setSourceDims({ w: img.naturalWidth, h: img.naturalHeight });
      // Auto-suggest sprite sheet grid if no explicit initialSheet matches
      const hint = detectGridHint(img.naturalWidth, img.naturalHeight);
      if (hint.confidence !== 'fallback' && !initialSheet) {
        setCols(hint.cols);
        setRows(hint.rows);
        setFrameCount(hint.frameCount);
        setSheetFps(hint.fps);
      }
    };
    img.src = sourceDataUrl;
    return () => {
      cancelled = true;
    };
  }, [open, sourceDataUrl, initialSheet]);

  // Re-run pure RGBA cutout / outline / pixelize pipeline whenever image or controls change
  useEffect(() => {
    if (!open || tab !== 'cutout' || !loadedImage) return;
    const beforeC = beforeCanvasRef.current;
    const afterC = afterCanvasRef.current;
    if (!beforeC || !afterC) return;

    const scale = Math.min(
      1,
      MAX_WORK_DIM / Math.max(1, loadedImage.naturalWidth),
      MAX_WORK_DIM / Math.max(1, loadedImage.naturalHeight)
    );
    const w = Math.max(1, Math.round(loadedImage.naturalWidth * scale));
    const h = Math.max(1, Math.round(loadedImage.naturalHeight * scale));

    // Work buffer for clean RGBA extraction
    const work = document.createElement('canvas');
    work.width = w;
    work.height = h;
    const wCtx = work.getContext('2d');
    if (!wCtx) return;
    wCtx.clearRect(0, 0, w, h);
    wCtx.drawImage(loadedImage, 0, 0, w, h);
    const srcImgData = wCtx.getImageData(0, 0, w, h);

    // Draw Before preview
    beforeC.width = 240;
    beforeC.height = 240;
    const bCtx = beforeC.getContext('2d');
    if (bCtx) {
      drawCheckerboard(bCtx, 240, 240, 12);
      const fit = Math.min(216 / w, 216 / h);
      const dw = w * fit;
      const dh = h * fit;
      bCtx.drawImage(work, (240 - dw) / 2, (240 - dh) / 2, dw, dh);
    }

    // Run pure RGBA pipeline
    const outBytes = processSpriteRgbaPipeline(srcImgData.data, w, h, {
      removeBackground: removeBg,
      bgTolerance,
      bgFeather,
      outlineEnabled,
      outlineColorHex: outlineColor,
      outlineThicknessPx: outlineThickness,
      outlinePixelSnap,
      pixelSize,
      paletteHex: matchMoodPalette ? moodPalette : undefined,
    });

    const outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h;
    const oCtx = outCanvas.getContext('2d');
    if (!oCtx) return;
    const outImgData = oCtx.createImageData(w, h);
    outImgData.data.set(outBytes);
    oCtx.putImageData(outImgData, 0, 0);
    processedDataUrlRef.current = outCanvas.toDataURL('image/png');

    // Draw After preview
    afterC.width = 240;
    afterC.height = 240;
    const aCtx = afterC.getContext('2d');
    if (aCtx) {
      drawCheckerboard(aCtx, 240, 240, 12);
      const fit = Math.min(216 / w, 216 / h);
      const dw = w * fit;
      const dh = h * fit;
      aCtx.imageSmoothingEnabled = pixelSize <= 1;
      aCtx.drawImage(outCanvas, (240 - dw) / 2, (240 - dh) / 2, dw, dh);
    }
  }, [
    open,
    tab,
    loadedImage,
    removeBg,
    bgTolerance,
    bgFeather,
    outlineEnabled,
    outlineThickness,
    outlineColor,
    outlinePixelSnap,
    pixelSize,
    matchMoodPalette,
    moodPalette,
  ]);

  // Sprite Sheet Slicer live playback timer + canvas renderer
  useEffect(() => {
    if (!open || tab !== 'sheet' || !loadedImage) return;
    const sheetCfg = normalizeSpriteSheetConfig({
      cols,
      rows,
      frameCount,
      fps: sheetFps,
      loop: sheetLoop,
    });

    let rafId = 0;
    const startMs = performance.now();

    const drawFrame = (localT: number) => {
      const rect = computeSpriteSheetFrameRect(
        sheetCfg,
        loadedImage.naturalWidth,
        loadedImage.naturalHeight,
        localT
      );
      setPreviewFrameIdx(rect.frameIndex);

      // 1. Draw full sheet with grid overlay + active cell highlight
      const gridC = sheetGridCanvasRef.current;
      if (gridC) {
        gridC.width = 340;
        gridC.height = 200;
        const gCtx = gridC.getContext('2d');
        if (gCtx) {
          drawCheckerboard(gCtx, 340, 200, 10);
          const fit = Math.min(
            320 / Math.max(1, loadedImage.naturalWidth),
            180 / Math.max(1, loadedImage.naturalHeight)
          );
          const dw = loadedImage.naturalWidth * fit;
          const dh = loadedImage.naturalHeight * fit;
          const ox = (340 - dw) / 2;
          const oy = (200 - dh) / 2;
          gCtx.drawImage(loadedImage, ox, oy, dw, dh);

          // Grid lines
          gCtx.strokeStyle = 'rgba(255,255,255,0.32)';
          gCtx.lineWidth = 1;
          for (let cIdx = 0; cIdx <= sheetCfg.cols; cIdx++) {
            const x = ox + (cIdx / sheetCfg.cols) * dw;
            gCtx.beginPath();
            gCtx.moveTo(x, oy);
            gCtx.lineTo(x, oy + dh);
            gCtx.stroke();
          }
          for (let rIdx = 0; rIdx <= sheetCfg.rows; rIdx++) {
            const y = oy + (rIdx / sheetCfg.rows) * dh;
            gCtx.beginPath();
            gCtx.moveTo(ox, y);
            gCtx.lineTo(ox + dw, y);
            gCtx.stroke();
          }

          // Active frame highlight box
          gCtx.strokeStyle = '#f2c85b';
          gCtx.lineWidth = 2.5;
          gCtx.strokeRect(
            ox + rect.sx * fit,
            oy + rect.sy * fit,
            rect.sw * fit,
            rect.sh * fit
          );
        }
      }

      // 2. Draw sliced animated frame preview
      const animC = sheetAnimCanvasRef.current;
      if (animC) {
        animC.width = 200;
        animC.height = 200;
        const pCtx = animC.getContext('2d');
        if (pCtx) {
          drawCheckerboard(pCtx, 200, 200, 12);
          const fit = Math.min(172 / Math.max(1, rect.sw), 172 / Math.max(1, rect.sh));
          const dw = rect.sw * fit;
          const dh = rect.sh * fit;
          pCtx.drawImage(
            loadedImage,
            rect.sx,
            rect.sy,
            rect.sw,
            rect.sh,
            (200 - dw) / 2,
            (200 - dh) / 2,
            dw,
            dh
          );
        }
      }
    };

    if (!sheetPlaying) {
      drawFrame(0);
      return;
    }

    const tick = (now: number) => {
      const elapsedSec = (now - startMs) / 1000;
      drawFrame(elapsedSec);
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [open, tab, loadedImage, cols, rows, frameCount, sheetFps, sheetLoop, sheetPlaying]);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setStatusNote('Image must be 4 MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && reader.result.startsWith('data:image/')) {
        setSourceDataUrl(reader.result);
        setAssetLabel(file.name.replace(/\.[^.]+$/, '').slice(0, 48) || 'Custom Sprite');
        setStatusNote(`Loaded "${file.name}"`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLoadDemo = (kind: 'relic' | 'sheet') => {
    const demo = buildDeterministicDemoDataUrl(kind);
    setSourceDataUrl(demo.dataUrl);
    setAssetLabel(demo.label);
    if (kind === 'sheet') {
      setCols(4);
      setRows(1);
      setFrameCount(4);
      setSheetFps(10);
      setSheetLoop(true);
      setTab('sheet');
      setStatusNote('Loaded 4-frame animated flame sprite sheet demo.');
    } else {
      setTab('cutout');
      setStatusNote('Loaded flat-backdrop relic demo for cutout testing.');
    }
  };

  const handleApplyCutoutToProp = () => {
    const url = processedDataUrlRef.current || sourceDataUrl;
    if (!url) return;
    onApplyProp(url, assetLabel.trim() || 'Prepared Prop', undefined);
    onClose();
  };

  const handleApplyCutoutToBackdrop = () => {
    const url = processedDataUrlRef.current || sourceDataUrl;
    if (!url) return;
    onApplyBackdrop(url, assetLabel.trim() || 'Prepared Backdrop');
    onClose();
  };

  const handleBindAnimatedSheet = () => {
    if (!sourceDataUrl) return;
    const cfg = normalizeSpriteSheetConfig({
      cols,
      rows,
      frameCount,
      fps: sheetFps,
      loop: sheetLoop,
    });
    onApplyProp(sourceDataUrl, assetLabel.trim() || 'Animated Prop Sheet', cfg);
    onClose();
  };

  const maxCells = Math.min(256, Math.max(1, cols * rows));

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[92vh] rounded-xl bg-[#0e1222] border border-white/15 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 bg-[#12172b] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Scissors className="w-4 h-4 text-[#f2c85b] shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate">
                Sprite Prep Studio &amp; Frame-Locked Sheet Slicer
              </h2>
              <p className="text-[11px] text-[#8e97b0] truncate">
                Remove flat backgrounds, add crisp ink outlines, quantize to mood palettes, or slice animated sprite sheets for Scene {sceneNumber}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Sprite Prep Studio"
            className="h-8 w-8 rounded-md bg-white/6 hover:bg-white/12 text-[#b4bcd4] inline-flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs & Upload Toolbar */}
        <div className="px-5 py-2.5 border-b border-white/10 bg-[#101528] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTab('cutout')}
              className={`h-8 px-3 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                tab === 'cutout'
                  ? 'bg-[#f2c85b] text-[#110e0a]'
                  : 'bg-[#181f38] text-[#b4bcd4] hover:text-white'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Cutout &amp; Pixel Prep</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('sheet')}
              className={`h-8 px-3 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                tab === 'sheet'
                  ? 'bg-[#f2c85b] text-[#110e0a]'
                  : 'bg-[#181f38] text-[#b4bcd4] hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Sprite Sheet Slicer</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 px-3 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-xs font-semibold text-cyan-100 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload PNG/JPG/WebP</span>
            </button>
            <button
              type="button"
              onClick={() => handleLoadDemo(tab === 'sheet' ? 'sheet' : 'relic')}
              className="h-8 px-2.5 rounded-md bg-[#1a223d] hover:bg-[#232e52] border border-white/12 text-[11px] font-semibold text-[#dce4f7] inline-flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#f2c85b]" />
              <span>{tab === 'sheet' ? 'Demo 4f Sheet' : 'Demo Relic'}</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Asset Name & Dimensions Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#13182b] border border-white/10">
            <label className="flex items-center gap-2 flex-1 min-w-[200px]">
              <span className="text-[11px] font-semibold text-[#9aa3bd] whitespace-nowrap">
                Prop Label
              </span>
              <input
                type="text"
                value={assetLabel}
                onChange={(e) => setAssetLabel(e.target.value)}
                className="flex-1 h-8 px-2.5 rounded bg-[#0c1020] border border-white/12 text-xs text-white focus:outline-none focus:border-[#f2c85b]"
              />
            </label>
            <div className="text-[11px] font-mono-tabular text-[#9aa3bd]">
              {sourceDims.w > 0 ? `${sourceDims.w} × ${sourceDims.h} px` : 'No image loaded'}
            </div>
            {statusNote && <div className="text-[11px] text-emerald-300">{statusNote}</div>}
          </div>

          {tab === 'cutout' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Before / After Live Canvases */}
              <div className="lg:col-span-7 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#12172a] border border-white/10 flex flex-col items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9aa3bd]">
                    Before (Source)
                  </span>
                  <canvas
                    ref={beforeCanvasRef}
                    className="w-full max-w-[240px] aspect-square rounded-md border border-white/10"
                  />
                </div>
                <div className="p-3 rounded-lg bg-[#12172a] border border-[#f2c85b]/30 flex flex-col items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#f2c85b]">
                    After (Prepared Cutout)
                  </span>
                  <canvas
                    ref={afterCanvasRef}
                    className="w-full max-w-[240px] aspect-square rounded-md border border-[#f2c85b]/30"
                  />
                </div>
              </div>

              {/* Cutout, Outline & Pixelize Controls */}
              <div className="lg:col-span-5 space-y-3">
                <div className="p-3 rounded-lg bg-[#13182b] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">
                      1. Corner Flood-Fill Cutout
                    </span>
                    <button
                      type="button"
                      onClick={() => setRemoveBg((v) => !v)}
                      className={`h-6 px-2.5 rounded text-[10px] font-bold border cursor-pointer ${
                        removeBg
                          ? 'bg-emerald-500/20 border-emerald-400/45 text-emerald-200'
                          : 'bg-[#0c1020] border-white/12 text-[#8e97b0]'
                      }`}
                    >
                      {removeBg ? 'Enabled' : 'Off'}
                    </button>
                  </div>

                  <label className="block">
                    <div className="flex justify-between text-[11px] text-[#9aa3bd] mb-1">
                      <span>Background Tolerance</span>
                      <span className="font-mono-tabular text-white">{bgTolerance}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={160}
                      step={2}
                      disabled={!removeBg}
                      value={bgTolerance}
                      onChange={(e) => setBgTolerance(Number(e.target.value))}
                      className="w-full accent-[#f2c85b] cursor-pointer disabled:opacity-40"
                    />
                  </label>

                  <label className="flex items-center gap-2 text-[11px] text-[#c5cde0] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bgFeather}
                      disabled={!removeBg}
                      onChange={(e) => setBgFeather(e.target.checked)}
                      className="accent-[#f2c85b]"
                    />
                    <span>Soft 1px edge fringe feathering</span>
                  </label>
                </div>

                <div className="p-3 rounded-lg bg-[#13182b] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">
                      2. Ink Silhouette Outline
                    </span>
                    <button
                      type="button"
                      onClick={() => setOutlineEnabled((v) => !v)}
                      className={`h-6 px-2.5 rounded text-[10px] font-bold border cursor-pointer ${
                        outlineEnabled
                          ? 'bg-emerald-500/20 border-emerald-400/45 text-emerald-200'
                          : 'bg-[#0c1020] border-white/12 text-[#8e97b0]'
                      }`}
                    >
                      {outlineEnabled ? 'Enabled' : 'Off'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 items-center">
                    <label className="block">
                      <div className="flex justify-between text-[11px] text-[#9aa3bd] mb-1">
                        <span>Thickness</span>
                        <span className="font-mono-tabular text-white">{outlineThickness}px</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={8}
                        step={1}
                        disabled={!outlineEnabled}
                        value={outlineThickness}
                        onChange={(e) => setOutlineThickness(Number(e.target.value))}
                        className="w-full accent-[#f2c85b] cursor-pointer disabled:opacity-40"
                      />
                    </label>
                    <label className="flex items-center gap-2 px-2.5 h-8 rounded bg-[#0c1020] border border-white/12 cursor-pointer">
                      <input
                        type="color"
                        disabled={!outlineEnabled}
                        value={outlineColor}
                        onChange={(e) => setOutlineColor(e.target.value)}
                        className="w-5 h-5 bg-transparent border-0 p-0 cursor-pointer"
                      />
                      <span className="text-[11px] text-[#dce4f7] font-mono-tabular">
                        {outlineColor}
                      </span>
                    </label>
                  </div>

                  <label className="flex items-center gap-2 text-[11px] text-[#c5cde0] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={outlinePixelSnap}
                      disabled={!outlineEnabled}
                      onChange={(e) => setOutlinePixelSnap(e.target.checked)}
                      className="accent-[#f2c85b]"
                    />
                    <span>Pixel-snapped square outline (retro RPG look)</span>
                  </label>
                </div>

                <div className="p-3 rounded-lg bg-[#13182b] border border-white/10 space-y-2.5">
                  <span className="block text-xs font-semibold text-white">
                    3. Pixel Grid &amp; Mood Palette Lock
                  </span>
                  <label className="block">
                    <div className="flex justify-between text-[11px] text-[#9aa3bd] mb-1">
                      <span>Pixel Block Size</span>
                      <span className="font-mono-tabular text-white">
                        {pixelSize === 1 ? 'Off (Native)' : `${pixelSize}×${pixelSize}`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={12}
                      step={1}
                      value={pixelSize}
                      onChange={(e) => setPixelSize(Number(e.target.value))}
                      className="w-full accent-[#38bdf8] cursor-pointer"
                    />
                  </label>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <label className="flex items-center gap-2 text-[11px] text-[#c5cde0] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={matchMoodPalette}
                        onChange={(e) => setMatchMoodPalette(e.target.checked)}
                        className="accent-[#f2c85b]"
                      />
                      <span>Match Mood ({activeMood.replace(/_/g, ' ')})</span>
                    </label>
                    <div className="flex items-center gap-1">
                      {moodPalette.slice(1, 7).map((hex, i) => (
                        <span
                          key={`${hex}_${i}`}
                          className="w-3.5 h-3.5 rounded-sm border border-white/25"
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Sheet Grid Overlay + Live Animated Preview */}
              <div className="lg:col-span-7 space-y-3">
                <div className="p-3 rounded-lg bg-[#12172a] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9aa3bd] inline-flex items-center gap-1.5">
                      <Grid className="w-3.5 h-3.5 text-[#f2c85b]" />
                      <span>Source Sheet Grid ({cols}×{rows})</span>
                    </span>
                    <span className="text-[11px] font-mono-tabular text-[#f2c85b]">
                      Frame {previewFrameIdx + 1}/{Math.min(frameCount, maxCells)}
                    </span>
                  </div>
                  <canvas
                    ref={sheetGridCanvasRef}
                    className="w-full h-auto rounded border border-white/10"
                  />
                </div>

                <div className="p-3 rounded-lg bg-[#12172a] border border-[#f2c85b]/30 flex items-center justify-between gap-4">
                  <canvas
                    ref={sheetAnimCanvasRef}
                    className="w-[160px] h-[160px] rounded-md border border-[#f2c85b]/30 shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="text-xs font-bold text-white">
                      Live Frame-Locked Preview
                    </div>
                    <p className="text-[11px] text-[#9aa3bd] leading-relaxed">
                      In the studio renderer, this sprite sheet automatically locks to 60fps STUDIO_FPS and obeys your active Art Engine&apos;s 12fps/24fps stepped motion cadence.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSheetPlaying((p) => !p)}
                      className="h-8 px-3 rounded-md bg-[#1d2642] hover:bg-[#27345a] border border-white/12 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {sheetPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 text-[#f2c85b]" />
                          <span>Pause Preview</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Play Preview</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sprite Sheet Grid Controls */}
              <div className="lg:col-span-5 p-4 rounded-lg bg-[#13182b] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Grid &amp; Playback Spec</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (sourceDims.w > 0 && sourceDims.h > 0) {
                        const hint = detectGridHint(sourceDims.w, sourceDims.h);
                        setCols(hint.cols);
                        setRows(hint.rows);
                        setFrameCount(hint.frameCount);
                        setSheetFps(hint.fps);
                        setStatusNote(
                          `Detected ${hint.cols}×${hint.rows} grid (${hint.confidence} confidence).`
                        );
                      }
                    }}
                    className="h-6 px-2 rounded bg-[#1b233d] hover:bg-[#253052] border border-white/12 text-[10px] font-semibold text-cyan-200 cursor-pointer"
                  >
                    Auto-Detect Grid
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-[11px] text-[#9aa3bd] mb-1">Columns (1–16)</span>
                    <input
                      type="number"
                      min={1}
                      max={16}
                      value={cols}
                      onChange={(e) => {
                        const nextCols = Math.max(1, Math.min(16, Number(e.target.value) || 1));
                        setCols(nextCols);
                        setFrameCount(Math.min(256, nextCols * rows));
                      }}
                      className="w-full h-9 px-2.5 rounded bg-[#0c1020] border border-white/15 text-xs text-white font-mono-tabular"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-[11px] text-[#9aa3bd] mb-1">Rows (1–16)</span>
                    <input
                      type="number"
                      min={1}
                      max={16}
                      value={rows}
                      onChange={(e) => {
                        const nextRows = Math.max(1, Math.min(16, Number(e.target.value) || 1));
                        setRows(nextRows);
                        setFrameCount(Math.min(256, cols * nextRows));
                      }}
                      className="w-full h-9 px-2.5 rounded bg-[#0c1020] border border-white/15 text-xs text-white font-mono-tabular"
                    />
                  </label>
                </div>

                <label className="block">
                  <div className="flex justify-between text-[11px] text-[#9aa3bd] mb-1">
                    <span>Active Frame Count</span>
                    <span className="font-mono-tabular text-white">
                      {Math.min(frameCount, maxCells)} / {maxCells}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={maxCells}
                    step={1}
                    value={Math.min(frameCount, maxCells)}
                    onChange={(e) => setFrameCount(Number(e.target.value))}
                    className="w-full accent-[#f2c85b] cursor-pointer"
                  />
                </label>

                <label className="block">
                  <div className="flex justify-between text-[11px] text-[#9aa3bd] mb-1">
                    <span>Playback Rate</span>
                    <span className="font-mono-tabular text-white">{sheetFps} fps</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={30}
                    step={1}
                    value={sheetFps}
                    onChange={(e) => setSheetFps(Number(e.target.value))}
                    className="w-full accent-[#38bdf8] cursor-pointer"
                  />
                </label>

                <label className="flex items-center gap-2 text-xs text-[#dce4f7] pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sheetLoop}
                    onChange={(e) => setSheetLoop(e.target.checked)}
                    className="accent-[#f2c85b]"
                  />
                  <span>Loop continuously across beat duration</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-[#12172b] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-[#8e97b0]">
            100% client-side deterministic RGBA processing · zero uploads leave your browser.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3 rounded-md bg-white/6 hover:bg-white/12 text-xs font-semibold text-[#c5cde0] cursor-pointer"
            >
              Cancel
            </button>
            {tab === 'cutout' ? (
              <>
                <button
                  type="button"
                  disabled={!loadedImage}
                  onClick={handleApplyCutoutToBackdrop}
                  className="h-9 px-3.5 rounded-md bg-[#1f2947] hover:bg-[#2a3860] disabled:opacity-40 border border-white/15 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Apply to Scene Backdrop</span>
                </button>
                <button
                  type="button"
                  disabled={!loadedImage}
                  onClick={handleApplyCutoutToProp}
                  className="h-9 px-4 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] disabled:opacity-40 text-[#110e0a] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply to Scene Prop</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={!loadedImage}
                onClick={handleBindAnimatedSheet}
                className="h-9 px-4 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] disabled:opacity-40 text-[#110e0a] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                <span>Bind Animated Prop to Scene</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
