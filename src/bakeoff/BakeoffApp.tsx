/**
 * 10-Second Animation Style Bake-Off UI
 * Compares Style 1 (Illuminated Indian Miniature) vs Style 2 (Bold Chiaroscuro Graphic Novel)
 * running in lockstep from the exact same shared 60fps Director Script.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Volume2, VolumeX, Subtitles, MoveHorizontal } from 'lucide-react';
import {
  AspectMode,
  BAKEOFF_CUTS,
  BAKEOFF_DURATION,
  BAKEOFF_FPS,
  BAKEOFF_TOTAL_FRAMES,
  BakeoffAudioEngine,
  clamp,
  evaluateDirectorFrame,
} from './script';
import { renderStyle1Miniature } from './renderStyle1Miniature';
import { renderStyle2Chiaroscuro } from './renderStyle2Chiaroscuro';

type ViewMode = 'side_by_side' | 'split' | 'style1' | 'style2';

export default function BakeoffApp() {
  const [viewMode, setViewMode] = useState<ViewMode>('side_by_side');
  const [aspect, setAspect] = useState<AspectMode>('16:9');
  const [isPlaying, setIsPlaying] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [muted, setMuted] = useState(true);
  const [splitPos, setSplitPos] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeCutIndex, setActiveCutIndex] = useState(1);

  const canvas1Ref = useRef<HTMLCanvasElement | null>(null);
  const canvas2Ref = useRef<HTMLCanvasElement | null>(null);
  const splitCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const splitContainerRef = useRef<HTMLDivElement | null>(null);
  const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<BakeoffAudioEngine | null>(null);

  const frameRef = useRef(0);
  const isPlayingRef = useRef(true);
  const showCaptionsRef = useRef(true);
  const aspectRef = useRef<AspectMode>('16:9');
  const viewModeRef = useRef<ViewMode>('side_by_side');
  const splitPosRef = useRef(0.5);
  const isDraggingSplitRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    audioRef.current?.setPlaying(isPlaying);
  }, [isPlaying]);
  useEffect(() => { showCaptionsRef.current = showCaptions; }, [showCaptions]);
  useEffect(() => { aspectRef.current = aspect; }, [aspect]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
  useEffect(() => { splitPosRef.current = splitPos; }, [splitPos]);

  const toggleSound = useCallback(() => {
    if (!audioRef.current) audioRef.current = new BakeoffAudioEngine();
    if (!audioRef.current.unlocked) audioRef.current.unlock();
    setMuted((prev) => {
      const next = !prev;
      audioRef.current?.setMuted(next);
      audioRef.current?.setPlaying(isPlayingRef.current);
      return next;
    });
  }, []);

  const jumpToTime = useCallback((sec: number) => {
    const clamped = clamp(sec, 0, BAKEOFF_DURATION - 0.02);
    frameRef.current = clamped * BAKEOFF_FPS;
    audioRef.current?.reset();
    setCurrentTime(clamped);
    const st = evaluateDirectorFrame(clamped, showCaptionsRef.current, aspectRef.current);
    setActiveCutIndex(st.cut.index);
  }, []);

  useEffect(() => {
    let rafId = 0;
    let lastTs = 0;
    let uiAcc = 0;

    const tick = (ts: number) => {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(0.08, (ts - lastTs) / 1000);
      lastTs = ts;

      if (isPlayingRef.current) {
        frameRef.current = (frameRef.current + dt * BAKEOFF_FPS) % BAKEOFF_TOTAL_FRAMES;
      }

      const t = frameRef.current / BAKEOFF_FPS;
      const curAspect = aspectRef.current;
      const cw = curAspect === '16:9' ? 1280 : 608;
      const ch = curAspect === '16:9' ? 720 : 1080;
      const state = evaluateDirectorFrame(t, showCaptionsRef.current, curAspect);
      audioRef.current?.update(state, isPlayingRef.current);

      const mode = viewModeRef.current;
      if (mode === 'side_by_side' || mode === 'style1') {
        const c1 = canvas1Ref.current;
        if (c1) {
          if (c1.width !== cw || c1.height !== ch) { c1.width = cw; c1.height = ch; }
          const ctx1 = c1.getContext('2d');
          if (ctx1) renderStyle1Miniature(ctx1, cw, ch, state);
        }
      }
      if (mode === 'side_by_side' || mode === 'style2') {
        const c2 = canvas2Ref.current;
        if (c2) {
          if (c2.width !== cw || c2.height !== ch) { c2.width = cw; c2.height = ch; }
          const ctx2 = c2.getContext('2d');
          if (ctx2) renderStyle2Chiaroscuro(ctx2, cw, ch, state);
        }
      }
      if (mode === 'split') {
        const sc = splitCanvasRef.current;
        if (sc) {
          if (sc.width !== cw || sc.height !== ch) { sc.width = cw; sc.height = ch; }
          if (!scratchCanvasRef.current) scratchCanvasRef.current = document.createElement('canvas');
          const scratch = scratchCanvasRef.current;
          if (scratch.width !== cw || scratch.height !== ch) { scratch.width = cw; scratch.height = ch; }
          const g = sc.getContext('2d');
          const sg = scratch.getContext('2d');
          if (g && sg) {
            renderStyle2Chiaroscuro(g, cw, ch, state);
            renderStyle1Miniature(sg, cw, ch, state);
            const cutX = Math.round(cw * splitPosRef.current);
            g.save();
            g.beginPath();
            g.rect(0, 0, cutX, ch);
            g.clip();
            g.drawImage(scratch, 0, 0);
            g.restore();
            g.fillStyle = '#f2c85b';
            g.fillRect(cutX - 1.5, 0, 3, ch);
          }
        }
      }

      uiAcc += dt;
      if (uiAcc >= 0.05) {
        uiAcc = 0;
        setCurrentTime(t);
        setActiveCutIndex(state.cut.index);
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const aspectClass = aspect === '16:9' ? 'aspect-video' : 'aspect-[9/16]';

  return (
    <div className="h-screen w-screen flex flex-col bg-[#080a12] text-[#f3efe6] overflow-hidden">
      <header className="h-14 px-5 border-b border-white/10 bg-[#0c0f1b] flex items-center justify-between gap-4 shrink-0">
        <span className="font-display text-lg font-semibold text-[#f7f1e3]">Style Bake-Off · 1 vs 2</span>
        <div className="flex items-center gap-1 p-1 bg-[#14182a] border border-white/8 rounded-lg">
          {([['side_by_side', 'Side-by-Side'], ['split', 'Split Curtain'], ['style1', 'Style 1'], ['style2', 'Style 2']] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setViewMode(id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${viewMode === id ? 'bg-[#f2c85b] text-[#110e0a]' : 'text-[#aeb6cc]'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 p-1 bg-[#14182a] border border-white/8 rounded-lg">
          {(['16:9', '9:16'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setAspect(r)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${aspect === r ? 'bg-white/15 text-white' : 'text-[#8e97b0]'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 min-h-0 p-4 flex items-center justify-center overflow-hidden">
        {viewMode === 'side_by_side' && (
          <div className="w-full h-full max-w-[1440px] grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            <div className={`w-full ${aspectClass} max-h-full rounded-lg overflow-hidden border border-white/12 bg-black`}>
              <canvas ref={canvas1Ref} className="w-full h-full object-contain block" />
            </div>
            <div className={`w-full ${aspectClass} max-h-full rounded-lg overflow-hidden border border-white/12 bg-black`}>
              <canvas ref={canvas2Ref} className="w-full h-full object-contain block" />
            </div>
          </div>
        )}
        {viewMode === 'split' && (
          <div
            ref={splitContainerRef}
            onPointerDown={(e) => {
              isDraggingSplitRef.current = true;
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              const rect = e.currentTarget.getBoundingClientRect();
              setSplitPos(clamp((e.clientX - rect.left) / rect.width, 0.04, 0.96));
            }}
            onPointerMove={(e) => {
              if (!isDraggingSplitRef.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              setSplitPos(clamp((e.clientX - rect.left) / rect.width, 0.04, 0.96));
            }}
            onPointerUp={() => { isDraggingSplitRef.current = false; }}
            className={`relative ${aspectClass} h-full max-h-full rounded-lg overflow-hidden border border-white/15 cursor-ew-resize`}
          >
            <canvas ref={splitCanvasRef} className="w-full h-full object-contain block" />
            <div style={{ left: `${splitPos * 100}%` }} className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#f2c85b] text-[#110e0a] flex items-center justify-center">
              <MoveHorizontal className="w-4 h-4" />
            </div>
          </div>
        )}
        {(viewMode === 'style1' || viewMode === 'style2') && (
          <div className={`${aspectClass} h-full max-h-full rounded-lg overflow-hidden border border-white/15`}>
            <canvas ref={viewMode === 'style1' ? canvas1Ref : canvas2Ref} className="w-full h-full object-contain block" />
          </div>
        )}
      </main>

      <footer className="px-5 py-3 border-t border-white/10 bg-[#0c0f1b] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setIsPlaying((p) => !p)} className="h-9 px-4 rounded-md bg-[#f2c85b] text-[#110e0a] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button type="button" onClick={() => jumpToTime(0)} className="h-9 px-3 rounded-md bg-[#161b2e] border border-white/10 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay</span>
          </button>
          <button type="button" onClick={toggleSound} className="h-9 px-3 rounded-md bg-[#161b2e] border border-white/10 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{muted ? 'Audio Off' : 'Raag On'}</span>
          </button>
          <button type="button" onClick={() => setShowCaptions((c) => !c)} className="h-9 px-3 rounded-md bg-[#161b2e] border border-white/10 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
            <Subtitles className="w-3.5 h-3.5" />
            <span>Captions</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          {BAKEOFF_CUTS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => jumpToTime(c.start)}
              className={`px-2.5 py-1.5 rounded text-xs font-semibold border cursor-pointer ${activeCutIndex === c.index ? 'border-[#f2c85b] text-white bg-[#192038]' : 'border-white/10 text-[#9aa3bd]'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <span className="font-mono-tabular text-xs text-[#d6dcf0]">{currentTime.toFixed(1)}s / 10.0s</span>
      </footer>
    </div>
  );
}
