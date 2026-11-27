import React, { useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Video } from 'lucide-react';
import type { CameraKeyframe, CameraKeyframeEase } from './types';
import {
  CAMERA_KEYFRAME_PRESETS,
  evaluateCameraKeyframes,
  normalizeCameraKeyframes,
} from './cameraKeyframes';

interface CameraCurveMiniEditorProps {
  keyframes: CameraKeyframe[] | undefined;
  beatDuration: number;
  onChange: (next: CameraKeyframe[] | undefined) => void;
}

const SVG_W = 280;
const SVG_H = 88;
const PAD_X = 12;
const PAD_Y = 10;
const PLOT_W = SVG_W - PAD_X * 2;
const PLOT_H = SVG_H - PAD_Y * 2;

const ZOOM_MIN = 0.75;
const ZOOM_MAX = 1.65;

function fracToX(frac: number): number {
  return PAD_X + Math.max(0, Math.min(1, frac)) * PLOT_W;
}

function zoomToY(zoom: number): number {
  const norm = (Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom)) - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN);
  return PAD_Y + (1 - norm) * PLOT_H;
}

function panToY(panX: number): number {
  const norm = (Math.max(-0.45, Math.min(0.45, panX)) + 0.45) / 0.9;
  return PAD_Y + (1 - norm) * PLOT_H;
}

function xToFrac(x: number): number {
  return Number(Math.max(0, Math.min(1, (x - PAD_X) / PLOT_W)).toFixed(3));
}

function yToZoom(y: number): number {
  const norm = 1 - Math.max(0, Math.min(1, (y - PAD_Y) / PLOT_H));
  return Number((ZOOM_MIN + norm * (ZOOM_MAX - ZOOM_MIN)).toFixed(2));
}

export const CameraCurveMiniEditor: React.FC<CameraCurveMiniEditorProps> = ({
  keyframes,
  beatDuration,
  onChange,
}) => {
  const sorted = useMemo(() => normalizeCameraKeyframes(keyframes), [keyframes]);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const safeSelIdx = sorted.length > 0 ? Math.min(selectedIdx, sorted.length - 1) : -1;
  const selectedKf = safeSelIdx >= 0 ? sorted[safeSelIdx] : null;

  const { zoomPath, panPath } = useMemo(() => {
    if (sorted.length === 0) return { zoomPath: '', panPath: '' };
    const samples = 44;
    const zPts: string[] = [];
    const pPts: string[] = [];
    for (let i = 0; i <= samples; i++) {
      const u = i / samples;
      const ev = evaluateCameraKeyframes(sorted, u);
      const x = fracToX(u).toFixed(1);
      zPts.push(`${i === 0 ? 'M' : 'L'}${x},${zoomToY(ev.zoom).toFixed(1)}`);
      pPts.push(`${i === 0 ? 'M' : 'L'}${x},${panToY(ev.panX).toFixed(1)}`);
    }
    return { zoomPath: zPts.join(' '), panPath: pPts.join(' ') };
  }, [sorted]);

  const commit = (list: CameraKeyframe[]) => {
    if (list.length === 0) {
      onChange(undefined);
      return;
    }
    const next = normalizeCameraKeyframes(list);
    onChange(next);
  };

  const getSvgCoords = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return { x: PAD_X, y: SVG_H / 2 };
    return {
      x: ((e.clientX - rect.left) / rect.width) * SVG_W,
      y: ((e.clientY - rect.top) / rect.height) * SVG_H,
    };
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (draggingIdx === null || !sorted[draggingIdx]) return;
    const { x, y } = getSvgCoords(e);
    const updated = sorted.map((k, idx) =>
      idx === draggingIdx ? { ...k, atFrac: xToFrac(x), zoom: yToZoom(y) } : k
    );
    commit(updated);
  };

  const handleSvgPointerUp = () => {
    if (draggingIdx !== null) setDraggingIdx(null);
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as HTMLElement).dataset.kfNode === '1') return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    const x = ((e.clientX - rect.left) / rect.width) * SVG_W;
    const y = ((e.clientY - rect.top) / rect.height) * SVG_H;
    const atFrac = xToFrac(x);
    const zoom = yToZoom(y);
    const nextList: CameraKeyframe[] = [
      ...sorted,
      { atFrac, zoom, panX: 0, panY: 0, ease: 'ease_in_out' },
    ];
    const normalized = normalizeCameraKeyframes(nextList);
    const insertedIdx = normalized.findIndex(
      (k) => Math.abs(k.atFrac - atFrac) < 0.002 && Math.abs(k.zoom - zoom) < 0.02
    );
    setSelectedIdx(Math.max(0, insertedIdx));
    onChange(normalized);
  };

  const updateSelected = (patch: Partial<CameraKeyframe>) => {
    if (safeSelIdx < 0) return;
    const updated = sorted.map((k, i) => (i === safeSelIdx ? { ...k, ...patch } : k));
    commit(updated);
  };

  const removeSelected = () => {
    if (safeSelIdx < 0) return;
    const next = sorted.filter((_, i) => i !== safeSelIdx);
    commit(next);
    setSelectedIdx(Math.max(0, safeSelIdx - 1));
  };

  const addKeyframe = () => {
    const base: CameraKeyframe[] =
      sorted.length === 0
        ? [
            { atFrac: 0, zoom: 1.0, panX: 0, panY: 0, ease: 'ease_in_out' },
            { atFrac: 1, zoom: 1.18, panX: 0, panY: 0, ease: 'ease_in_out' },
          ]
        : [
            ...sorted,
            {
              atFrac: 0.5,
              zoom: Number(evaluateCameraKeyframes(sorted, 0.5).zoom.toFixed(2)),
              panX: Number(evaluateCameraKeyframes(sorted, 0.5).panX.toFixed(2)),
              panY: Number(evaluateCameraKeyframes(sorted, 0.5).panY.toFixed(2)),
              ease: 'ease_in_out',
            },
          ];
    commit(base);
    setSelectedIdx(base.length - 1);
  };

  return (
    <div className="p-2.5 rounded-lg bg-[#0d1222] border border-white/10 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-[#f2c85b] inline-flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5" />
          <span>Camera Keyframe Spline ({sorted.length})</span>
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={addKeyframe}
            className="h-6 px-2 rounded bg-[#182038] hover:bg-[#232f52] border border-white/10 text-[10px] font-semibold text-[#eef1f8] inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add Key</span>
          </button>
          {sorted.length > 0 && (
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="h-6 px-2 rounded bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/25 text-[10px] font-semibold text-rose-200 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Quick Curve Presets */}
      <div className="flex flex-wrap gap-1">
        {CAMERA_KEYFRAME_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => {
              onChange(preset.keyframes.map((k) => ({ ...k })));
              setSelectedIdx(1);
            }}
            className="px-2 py-0.5 rounded bg-[#141b30] hover:bg-[#1f2947] border border-white/10 text-[10px] text-[#c8d2ea] cursor-pointer"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Interactive SVG Curve Canvas */}
      <div className="rounded bg-[#070a14] border border-white/10 p-1">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full h-[88px] block select-none cursor-crosshair"
          onClick={handleSvgClick}
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handleSvgPointerUp}
          onPointerLeave={handleSvgPointerUp}
        >
          {/* Baseline 1.0x zoom gridline */}
          <line
            x1={PAD_X}
            y1={zoomToY(1.0)}
            x2={SVG_W - PAD_X}
            y2={zoomToY(1.0)}
            stroke="rgba(255,255,255,0.14)"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <line
            x1={PAD_X + PLOT_W * 0.5}
            y1={PAD_Y}
            x2={PAD_X + PLOT_W * 0.5}
            y2={SVG_H - PAD_Y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />

          {/* Pan X curve (subtle cyan) */}
          {panPath && (
            <path
              d={panPath}
              fill="none"
              stroke="rgba(56,189,248,0.65)"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
          )}

          {/* Zoom curve (warm gold) */}
          {zoomPath && (
            <path
              d={zoomPath}
              fill="none"
              stroke="#f2c85b"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          )}

          {/* Draggable keyframe nodes */}
          {sorted.map((k, idx) => {
            const cx = fracToX(k.atFrac);
            const cy = zoomToY(k.zoom);
            const isSel = idx === safeSelIdx;
            return (
              <g key={`${idx}_${k.atFrac}`}>
                <circle
                  data-kf-node="1"
                  cx={cx}
                  cy={cy}
                  r={isSel ? 6 : 4.5}
                  fill={isSel ? '#f2c85b' : '#1b2440'}
                  stroke="#ffffff"
                  strokeWidth={isSel ? 2 : 1.3}
                  className="cursor-grab"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSelectedIdx(idx);
                    setDraggingIdx(idx);
                  }}
                />
              </g>
            );
          })}

          {sorted.length === 0 && (
            <text
              x={SVG_W / 2}
              y={SVG_H / 2 + 3}
              textAnchor="middle"
              fill="rgba(148,163,184,0.75)"
              fontSize="9.5"
            >
              Click curve or choose a preset to keyframe Zoom &amp; Pan
            </text>
          )}
        </svg>
        <div className="flex items-center justify-between px-1 pt-0.5 text-[9px] text-[#7c87a3]">
          <span>0.0s · Gold = Zoom · Blue = Pan X</span>
          <span>{beatDuration.toFixed(1)}s</span>
        </div>
      </div>

      {/* Selected Keyframe Fine Controls */}
      {selectedKf && (
        <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-[10px]">
          <label className="flex flex-col gap-0.5 text-[#9aa3bd]">
            <span>Time ({(selectedKf.atFrac * beatDuration).toFixed(2)}s)</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={selectedKf.atFrac}
              onChange={(e) => updateSelected({ atFrac: Number(e.target.value) })}
              className="accent-[#f2c85b]"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[#9aa3bd]">
            <span>Zoom ({selectedKf.zoom.toFixed(2)}x)</span>
            <input
              type="range"
              min={0.75}
              max={1.85}
              step={0.02}
              value={selectedKf.zoom}
              onChange={(e) => updateSelected({ zoom: Number(e.target.value) })}
              className="accent-[#f2c85b]"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[#9aa3bd]">
            <span>Pan X ({selectedKf.panX.toFixed(2)})</span>
            <input
              type="range"
              min={-0.4}
              max={0.4}
              step={0.02}
              value={selectedKf.panX}
              onChange={(e) => updateSelected({ panX: Number(e.target.value) })}
              className="accent-sky-400"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[#9aa3bd]">
            <span>Pan Y ({selectedKf.panY.toFixed(2)})</span>
            <input
              type="range"
              min={-0.3}
              max={0.3}
              step={0.02}
              value={selectedKf.panY}
              onChange={(e) => updateSelected({ panY: Number(e.target.value) })}
              className="accent-sky-400"
            />
          </label>
          <div className="col-span-2 flex items-center justify-between gap-2 pt-0.5">
            <select
              value={selectedKf.ease || 'ease_in_out'}
              onChange={(e) => updateSelected({ ease: e.target.value as CameraKeyframeEase })}
              className="flex-1 h-7 px-2 rounded bg-[#090d1a] border border-white/12 text-[10px] text-[#eef1f8]"
            >
              <option value="ease_in_out">Ease In-Out (Smooth)</option>
              <option value="linear">Linear (Constant)</option>
              <option value="overshoot">Overshoot (Spring Punch)</option>
            </select>
            <button
              type="button"
              onClick={removeSelected}
              className="h-7 px-2 rounded bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/25 text-rose-200 inline-flex items-center gap-1 cursor-pointer"
              title="Delete selected keyframe"
            >
              <Trash2 className="w-3 h-3" />
              <span>Del</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
