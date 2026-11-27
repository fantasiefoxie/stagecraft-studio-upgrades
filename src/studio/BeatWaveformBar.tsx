import React, { useEffect, useRef, useState } from 'react';
import {
  ActorPlacement,
  BeatActionCue,
  BeatExpressionCue,
  ExpressionKeyframe,
  STUDIO_FPS,
  resolveActionCueStartFrame,
} from './types';
import { getVoiceSpeechProfile } from './voiceEnvelope';

type WaveformClickMode = 'sfx' | 'scrub' | 'action_cue';

interface BeatWaveformBarProps {
  audioBuffer: AudioBuffer;
  duration: number;
  dialogue?: string;
  localT?: number;
  sfxOffsetSec?: number;
  expressionCues?: BeatExpressionCue[];
  actionCues?: BeatActionCue[];
  actors?: ActorPlacement[];
  onSetSfxOffset?: (sec: number) => void;
  onScrubLocalTime?: (sec: number) => void;
  onAddActionCueAt?: (frame: number) => void;
}

const PEAK_COUNT = 96;
const waveformPeakCache = new WeakMap<AudioBuffer, Float32Array>();

function resolveKeyframeSec(kf: ExpressionKeyframe, duration: number): number | null {
  if (typeof kf.timeSec === 'number' && Number.isFinite(kf.timeSec)) {
    return Math.max(0, Math.min(duration, kf.timeSec));
  }
  if (typeof kf.frame === 'number' && Number.isFinite(kf.frame)) {
    return Math.max(0, Math.min(duration, kf.frame / STUDIO_FPS));
  }
  if (typeof kf.at === 'number' && Number.isFinite(kf.at)) {
    return Math.max(0, Math.min(duration, kf.at * duration));
  }
  return null;
}

function getNormalizedPeaks(buffer: AudioBuffer): Float32Array {
  const cached = waveformPeakCache.get(buffer);
  if (cached) return cached;

  const peaks = new Float32Array(PEAK_COUNT);
  const ch0 = buffer.getChannelData(0);
  const step = Math.max(1, Math.floor(ch0.length / PEAK_COUNT));
  let globalMax = 0.001;

  for (let i = 0; i < PEAK_COUNT; i++) {
    const start = i * step;
    const end = Math.min(ch0.length, start + step);
    let peak = 0;
    for (let j = start; j < end; j += 4) {
      const a = Math.abs(ch0[j]);
      if (a > peak) peak = a;
    }
    peaks[i] = peak;
    if (peak > globalMax) globalMax = peak;
  }
  for (let i = 0; i < PEAK_COUNT; i++) {
    peaks[i] = peaks[i] / globalMax;
  }
  waveformPeakCache.set(buffer, peaks);
  return peaks;
}

export const BeatWaveformBar: React.FC<BeatWaveformBarProps> = ({
  audioBuffer,
  duration,
  dialogue = '',
  localT = 0,
  sfxOffsetSec = 0,
  expressionCues = [],
  actionCues = [],
  actors = [],
  onSetSfxOffset,
  onScrubLocalTime,
  onAddActionCueAt,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [clickMode, setClickMode] = useState<WaveformClickMode>('sfx');
  const safeDur = Math.max(0.2, duration || audioBuffer.duration || 1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const midY = h / 2;
    const peaks = getNormalizedPeaks(audioBuffer);
    const profile = getVoiceSpeechProfile(audioBuffer);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#090b15';
    ctx.fillRect(0, 0, w, h);

    // Subtle shaded active speech window band (aligned with kinetic karaoke)
    if (profile && profile.speechWindow.endSec > profile.speechWindow.startSec + 0.08) {
      const sx0 = Math.max(0, Math.min(w, (profile.speechWindow.startSec / safeDur) * w));
      const sx1 = Math.max(sx0, Math.min(w, (profile.speechWindow.endSec / safeDur) * w));
      ctx.fillStyle = 'rgba(242, 200, 91, 0.07)';
      ctx.fillRect(sx0, 0, sx1 - sx0, h);
    }

    // Subtle center axis
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    const playRatio = Math.max(0, Math.min(1, localT / safeDur));
    const barW = w / PEAK_COUNT;

    for (let i = 0; i < PEAK_COUNT; i++) {
      const ratio = i / PEAK_COUNT;
      const barH = Math.max(3, peaks[i] * (h * 0.78));
      const x = i * barW;
      ctx.fillStyle =
        ratio <= playRatio ? 'rgba(242, 200, 91, 0.92)' : 'rgba(124, 155, 214, 0.45)';
      ctx.fillRect(x + 0.5, midY - barH / 2, Math.max(1.5, barW - 1.5), barH);
    }

    // Expression cue markers (purple circles at top)
    const cueTimes: number[] = [];
    for (const cue of expressionCues) {
      const t = resolveKeyframeSec(cue, safeDur);
      if (t !== null) cueTimes.push(t);
    }
    for (const actor of actors) {
      if (!Array.isArray(actor.expressionTrack)) continue;
      for (const kf of actor.expressionTrack) {
        const t = resolveKeyframeSec(kf, safeDur);
        if (t !== null) cueTimes.push(t);
      }
    }
    for (const atSec of cueTimes) {
      const cx = Math.max(2, Math.min(w - 2, (atSec / safeDur) * w));
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, h);
      ctx.stroke();
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(cx, 5, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sub-beat Action Cue markers (amber diamond pins + duration span bar)
    const totalFrames = Math.max(1, Math.round(safeDur * STUDIO_FPS));
    for (const cue of actionCues) {
      const startFrame = resolveActionCueStartFrame(cue, dialogue, safeDur, totalFrames);
      const startSec = Math.max(0, Math.min(safeDur, startFrame / STUDIO_FPS));
      const spanFrames =
        typeof cue.endFrame === 'number' && Number.isFinite(cue.endFrame) && cue.endFrame > startFrame
          ? cue.endFrame - startFrame
          : 36;
      const durSec = Math.max(0.15, spanFrames / STUDIO_FPS);
      const ax = Math.max(3, Math.min(w - 3, (startSec / safeDur) * w));
      const axEnd = Math.min(w, ((startSec + durSec) / safeDur) * w);

      // Subtle top ribbon for cue active duration
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.fillRect(ax, 0, Math.max(4, axEnd - ax), 4);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ax, 0);
      ctx.lineTo(ax, h);
      ctx.stroke();

      // Amber diamond pin
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(ax, 2);
      ctx.lineTo(ax + 4, 6.5);
      ctx.lineTo(ax, 11);
      ctx.lineTo(ax - 4, 6.5);
      ctx.closePath();
      ctx.fill();
    }

    // SFX hit timing marker (emerald triangle pin at bottom)
    if (sfxOffsetSec >= 0 && sfxOffsetSec <= safeDur) {
      const sx = Math.max(3, Math.min(w - 3, (sfxOffsetSec / safeDur) * w));
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.moveTo(sx, h - 2);
      ctx.lineTo(sx - 4.5, h - 9);
      ctx.lineTo(sx + 4.5, h - 9);
      ctx.closePath();
      ctx.fill();
    }

    // Active playhead hairline
    const px = playRatio * w;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, h);
    ctx.stroke();
  }, [audioBuffer, safeDur, dialogue, localT, sfxOffsetSec, expressionCues, actionCues, actors]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const rel = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const clickedSec = Number((rel * safeDur).toFixed(2));
    const clickedFrame = Math.max(0, Math.round(clickedSec * STUDIO_FPS));

    if (clickMode === 'scrub' && onScrubLocalTime) {
      onScrubLocalTime(clickedSec);
    } else if (clickMode === 'action_cue' && onAddActionCueAt) {
      onAddActionCueAt(clickedFrame);
    } else if (onSetSfxOffset) {
      onSetSfxOffset(clickedSec);
    }
  };

  const modeHint =
    clickMode === 'scrub'
      ? 'Click wave to scrub playhead'
      : clickMode === 'action_cue'
        ? `Click wave to place Action Cue (${actionCues.length})`
        : `Click wave to set SFX @ ${sfxOffsetSec.toFixed(1)}s`;

  return (
    <div className="rounded-lg border border-white/10 bg-[#090b15] p-1.5 space-y-1">
      <div className="flex items-center justify-between gap-1 text-[9px] text-slate-400 px-0.5 flex-wrap">
        <span className="font-semibold text-amber-300">
          Voice ({audioBuffer.duration.toFixed(1)}s)
        </span>
        <div className="inline-flex items-center rounded bg-[#12172a] border border-white/10 p-0.5 gap-0.5">
          <button
            type="button"
            onClick={() => setClickMode('sfx')}
            className={`px-1.5 py-0.5 rounded text-[9px] font-semibold cursor-pointer ${
              clickMode === 'sfx'
                ? 'bg-emerald-500/25 text-emerald-200'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Click waveform to move the beat's green SFX hit pin"
          >
            SFX
          </button>
          {onScrubLocalTime && (
            <button
              type="button"
              onClick={() => setClickMode('scrub')}
              className={`px-1.5 py-0.5 rounded text-[9px] font-semibold cursor-pointer ${
                clickMode === 'scrub'
                  ? 'bg-sky-500/25 text-sky-200'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Click waveform to jump the playhead directly to that vocal moment"
            >
              Scrub
            </button>
          )}
          {onAddActionCueAt && (
            <button
              type="button"
              onClick={() => setClickMode('action_cue')}
              className={`px-1.5 py-0.5 rounded text-[9px] font-semibold cursor-pointer ${
                clickMode === 'action_cue'
                  ? 'bg-amber-500/25 text-amber-200'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Click waveform to drop a frame-locked Action Cue (camera punch / pose / SFX) right on a vocal peak"
            >
              +Cue
            </button>
          )}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={320}
        height={42}
        onClick={handleClick}
        className="w-full h-10 rounded cursor-crosshair block"
        title={modeHint}
      />
      <div className="flex items-center justify-between text-[8.5px] text-slate-400/90 px-0.5">
        <span>{modeHint}</span>
        <span className="inline-flex items-center gap-2">
          <span className="text-emerald-300">▲ SFX</span>
          <span className="text-amber-300">◆ Cue ({actionCues.length})</span>
          <span className="text-purple-300">● Expr</span>
        </span>
      </div>
    </div>
  );
};
