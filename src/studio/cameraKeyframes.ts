/**
 * Stagecraft Studio — Per-Beat Camera Keyframe Splines Evaluator & Presets
 *
 * Pure deterministic spline evaluator supporting linear, ease_in_out, and overshoot
 * easing curves. Composes seamlessly with base cameraMove and speaker auto-framing.
 */

import type { CameraKeyframe, CameraKeyframeEase } from './types';

export interface EvaluatedCameraKeyframe {
  active: boolean;
  zoom: number;
  panX: number;
  panY: number;
}

export interface CameraKeyframePreset {
  id: string;
  label: string;
  keyframes: CameraKeyframe[];
}

export const CAMERA_KEYFRAME_PRESETS: CameraKeyframePreset[] = [
  {
    id: 'dramatic_push_hold',
    label: 'Push-In & Hold',
    keyframes: [
      { atFrac: 0.0, zoom: 1.0, panX: 0, panY: 0, ease: 'ease_in_out' },
      { atFrac: 0.45, zoom: 1.18, panX: 0, panY: -0.02, ease: 'ease_in_out' },
      { atFrac: 1.0, zoom: 1.2, panX: 0, panY: -0.02, ease: 'linear' },
    ],
  },
  {
    id: 'whip_pan_lr',
    label: 'Whip Pan L -> R',
    keyframes: [
      { atFrac: 0.0, zoom: 1.08, panX: -0.18, panY: 0, ease: 'ease_in_out' },
      { atFrac: 0.48, zoom: 1.12, panX: 0.18, panY: 0, ease: 'overshoot' },
      { atFrac: 1.0, zoom: 1.1, panX: 0.16, panY: 0, ease: 'linear' },
    ],
  },
  {
    id: 'reveal_pullback',
    label: 'Reveal Pullback',
    keyframes: [
      { atFrac: 0.0, zoom: 1.28, panX: 0, panY: -0.04, ease: 'ease_in_out' },
      { atFrac: 0.72, zoom: 1.0, panX: 0, panY: 0, ease: 'ease_in_out' },
      { atFrac: 1.0, zoom: 0.98, panX: 0, panY: 0, ease: 'linear' },
    ],
  },
  {
    id: 'impact_overshoot',
    label: 'Overshoot Punch',
    keyframes: [
      { atFrac: 0.0, zoom: 1.0, panX: 0, panY: 0, ease: 'linear' },
      { atFrac: 0.35, zoom: 1.02, panX: 0, panY: 0, ease: 'overshoot' },
      { atFrac: 0.62, zoom: 1.24, panX: 0, panY: -0.03, ease: 'ease_in_out' },
      { atFrac: 1.0, zoom: 1.16, panX: 0, panY: -0.01, ease: 'linear' },
    ],
  },
];

function applySegmentEase(t: number, ease: CameraKeyframeEase = 'ease_in_out'): number {
  const x = Math.max(0, Math.min(1, t));
  if (ease === 'linear') return x;
  if (ease === 'overshoot') {
    // Smooth back-out spring with subtle cinematic overshoot (~8%)
    const c1 = 1.42;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }
  // ease_in_out cubic
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function normalizeCameraKeyframes(keyframes: CameraKeyframe[] | undefined): CameraKeyframe[] {
  if (!Array.isArray(keyframes) || keyframes.length === 0) return [];
  return keyframes
    .filter((k) => k && Number.isFinite(k.atFrac))
    .map((k) => ({
      atFrac: Math.max(0, Math.min(1, k.atFrac)),
      zoom: Math.max(0.7, Math.min(2.2, Number.isFinite(k.zoom) ? k.zoom : 1)),
      panX: Math.max(-0.45, Math.min(0.45, Number.isFinite(k.panX) ? k.panX : 0)),
      panY: Math.max(-0.35, Math.min(0.35, Number.isFinite(k.panY) ? k.panY : 0)),
      ease:
        k.ease === 'linear' || k.ease === 'ease_in_out' || k.ease === 'overshoot'
          ? k.ease
          : 'ease_in_out',
    }))
    .sort((a, b) => a.atFrac - b.atFrac);
}

/**
 * Evaluates a beat's optional `cameraKeyframes[]` deterministically at normalized beat progress `u` (0..1).
 */
export function evaluateCameraKeyframes(
  keyframes: CameraKeyframe[] | undefined,
  u: number
): EvaluatedCameraKeyframe {
  const sorted = normalizeCameraKeyframes(keyframes);
  if (sorted.length === 0) {
    return { active: false, zoom: 1, panX: 0, panY: 0 };
  }

  const clampedU = Math.max(0, Math.min(1, Number.isFinite(u) ? u : 0));

  if (sorted.length === 1 || clampedU <= sorted[0].atFrac) {
    const k = sorted[0];
    return { active: true, zoom: k.zoom, panX: k.panX, panY: k.panY };
  }

  const last = sorted[sorted.length - 1];
  if (clampedU >= last.atFrac) {
    return { active: true, zoom: last.zoom, panX: last.panX, panY: last.panY };
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (clampedU >= a.atFrac && clampedU <= b.atFrac) {
      const span = Math.max(1e-5, b.atFrac - a.atFrac);
      const localT = (clampedU - a.atFrac) / span;
      const eased = applySegmentEase(localT, a.ease || 'ease_in_out');
      const zoom = Math.max(0.65, Math.min(2.35, a.zoom + (b.zoom - a.zoom) * eased));
      const panX = Math.max(-0.5, Math.min(0.5, a.panX + (b.panX - a.panX) * eased));
      const panY = Math.max(-0.4, Math.min(0.4, a.panY + (b.panY - a.panY) * eased));
      return { active: true, zoom, panX, panY };
    }
  }

  return { active: true, zoom: last.zoom, panX: last.panX, panY: last.panY };
}

/**
 * Composes evaluated camera keyframe spline cleanly onto an existing camera transform.
 */
export function composeCameraWithKeyframes<T extends { zoom: number; panX: number; panY: number }>(
  baseCam: T,
  keyframes: CameraKeyframe[] | undefined,
  u: number,
  w: number,
  h: number
): T {
  const ev = evaluateCameraKeyframes(keyframes, u);
  if (!ev.active) return baseCam;
  return {
    ...baseCam,
    zoom: Math.max(0.75, Math.min(2.35, baseCam.zoom * ev.zoom)),
    panX: baseCam.panX - ev.panX * w * 0.42,
    panY: baseCam.panY - ev.panY * h * 0.42,
  };
}
