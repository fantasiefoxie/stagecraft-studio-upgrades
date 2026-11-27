import React, { useMemo, useRef, useState } from 'react';
import {
  Activity,
  Film,
  LayoutGrid,
  Plus,
  Scissors,
  Sparkles,
  Tv,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { EpisodeScript, RENDER_STYLE_CATALOG, STUDIO_FPS } from './types';
import { EpisodeChapterSlice, formatLongDuration } from './longFormEngine';
import { analyzeEpisodePacing } from './pacingAnalyzer';

interface StoryboardTimelineStripProps {
  episode: EpisodeScript;
  episodeChapters: EpisodeChapterSlice[];
  activeChapterIdx: number | 'all';
  selectedBeatIdx: number;
  activeBeatIdx: number;
  beatStarts: number[];
  currentTime?: number;
  totalDuration?: number;
  voiceMeta: Record<string, { fileName: string; duration: number }>;
  dragBeatIdx: number | null;
  dragOverBeatIdx: number | null;
  onSelectChapter: (chapterIdx: number | 'all') => void;
  onSelectBeat: (idx: number) => void;
  onSeekTime?: (timeSec: number) => void;
  onResizeBeatDuration?: (idx: number, newDuration: number) => void;
  onApplyCinematicJCuts?: () => void;
  onBoostFlatBeats?: () => void;
  onDragStartBeat: (idx: number) => void;
  onDragOverBeat: (idx: number) => void;
  onDragLeaveBeat: (idx: number) => void;
  onDropBeat: (fromIdx: number, toIdx: number) => void;
  onDragEndBeat: () => void;
  onAddBeat: () => void;
  onAddEndScreenBeat: () => void;
}

function formatTickSec(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export const StoryboardTimelineStrip: React.FC<StoryboardTimelineStripProps> = React.memo(
  ({
    episode,
    episodeChapters,
    activeChapterIdx,
    selectedBeatIdx,
    activeBeatIdx,
    beatStarts,
    currentTime = 0,
    totalDuration = 0,
    voiceMeta,
    dragBeatIdx,
    dragOverBeatIdx,
    onSelectChapter,
    onSelectBeat,
    onSeekTime,
    onResizeBeatDuration,
    onApplyCinematicJCuts,
    onBoostFlatBeats,
    onDragStartBeat,
    onDragOverBeat,
    onDragLeaveBeat,
    onDropBeat,
    onDragEndBeat,
    onAddBeat,
    onAddEndScreenBeat,
  }) => {
    const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('cards');
    const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
    const [pxPerSec, setPxPerSec] = useState<number>(28);
    const pacingReport = useMemo(() => analyzeEpisodePacing(episode), [episode]);
    const [resizingState, setResizingState] = useState<{
      idx: number;
      previewDur: number;
    } | null>(null);
    const trackContainerRef = useRef<HTMLDivElement | null>(null);

    const visibleBeats = useMemo(() => {
      return episode.beats
        .map((b, idx) => ({ b, idx }))
        .filter(({ idx }) => {
          if (activeChapterIdx === 'all') return true;
          const ch = episodeChapters[activeChapterIdx];
          if (!ch) return true;
          return idx >= ch.startBeatIdx && idx <= ch.endBeatIdx;
        });
    }, [episode.beats, activeChapterIdx, episodeChapters]);

    const visibleOriginSec = visibleBeats.length > 0 ? beatStarts[visibleBeats[0].idx] ?? 0 : 0;
    const visibleSpanSec = useMemo(() => {
      let sum = 0;
      for (const { b, idx } of visibleBeats) {
        const d =
          resizingState && resizingState.idx === idx
            ? resizingState.previewDur
            : Math.max(1.2, b.duration || 4);
        sum += d;
      }
      return Math.max(2, sum);
    }, [visibleBeats, resizingState]);

    const totalTimelineWidth = Math.max(420, Math.round(visibleSpanSec * pxPerSec));
    const tickIntervalSec = pxPerSec >= 36 ? 2 : pxPerSec >= 24 ? 5 : 10;

    const rulerTicks = useMemo(() => {
      const ticks: number[] = [];
      const firstTick = Math.ceil(visibleOriginSec / tickIntervalSec) * tickIntervalSec;
      const endSec = visibleOriginSec + visibleSpanSec;
      for (let t = firstTick; t <= endSec + 0.01; t += tickIntervalSec) {
        ticks.push(t);
      }
      return ticks;
    }, [visibleOriginSec, visibleSpanSec, tickIntervalSec]);

    const handleRulerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!onSeekTime) return;
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const seekFromClientX = (clientX: number) => {
        const relX = Math.max(0, Math.min(totalTimelineWidth, clientX - rect.left));
        const targetSec = Math.max(
          0,
          Math.min(
            Math.max(totalDuration, visibleOriginSec + visibleSpanSec),
            visibleOriginSec + relX / pxPerSec
          )
        );
        onSeekTime(targetSec);
      };
      seekFromClientX(e.clientX);
      const onMove = (ev: PointerEvent) => seekFromClientX(ev.clientX);
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };

    const startEdgeResize = (
      e: React.PointerEvent<HTMLDivElement>,
      beatIdx: number,
      baseDuration: number
    ) => {
      if (!onResizeBeatDuration) return;
      e.stopPropagation();
      e.preventDefault();
      const startX = e.clientX;
      let latestDur = baseDuration;
      setResizingState({ idx: beatIdx, previewDur: baseDuration });

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const rawDur = baseDuration + dx / pxPerSec;
        latestDur = Number(Math.max(1.5, Math.min(18, rawDur)).toFixed(1));
        setResizingState({ idx: beatIdx, previewDur: latestDur });
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        setResizingState(null);
        if (Math.abs(latestDur - baseDuration) >= 0.05) {
          onResizeBeatDuration(beatIdx, latestDur);
        }
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };

    const jCutCount = useMemo(
      () => episode.beats.filter((b) => typeof b.audioLeadSec === 'number' && Math.abs(b.audioLeadSec) >= 0.02).length,
      [episode.beats]
    );

    const playheadX = Math.max(
      0,
      Math.min(totalTimelineWidth, (currentTime - visibleOriginSec) * pxPerSec)
    );

    return (
      <>
        {/* Mode Switcher + Act / Chapter Jump Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 min-w-0">
            <div className="inline-flex items-center rounded bg-[#101425] border border-white/10 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`h-5 px-2 rounded text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-[#1e2745] text-[#f2c85b]'
                    : 'text-[#9aa3bd] hover:text-white'
                }`}
                title="Compact drag-to-reorder scene cards"
              >
                <LayoutGrid className="w-3 h-3" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`h-5 px-2 rounded text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-[#1e2745] text-[#f2c85b]'
                    : 'text-[#9aa3bd] hover:text-white'
                }`}
                title="Proportional multi-track timeline with draggable playhead, voice coverage, cue pins & duration trimming"
              >
                <Film className="w-3 h-3" />
                <span>Timeline</span>
              </button>
            </div>

            {onApplyCinematicJCuts && episode.beats.length > 1 && (
              <button
                type="button"
                onClick={onApplyCinematicJCuts}
                className={`h-6 px-2 rounded text-[10px] font-semibold whitespace-nowrap shrink-0 border inline-flex items-center gap-1 cursor-pointer transition-colors ${
                  jCutCount > 0
                    ? 'bg-[#132030] border-[#38bdf8]/45 text-[#bae6fd]'
                    : 'bg-[#101425] border-white/10 text-[#9aa3bd] hover:text-white hover:border-[#38bdf8]/40'
                }`}
                title="Apply cinematic +0.25s–0.35s J-Cut dialogue pre-roll across consecutive spoken scenes"
              >
                <Scissors className="w-3 h-3 text-[#38bdf8]" />
                <span>{jCutCount > 0 ? `J-Cuts (${jCutCount})` : 'Auto J-Cuts'}</span>
              </button>
            )}

            {(episodeChapters.length > 1 || episode.beats.length > 24) && (
              <>
                <button
                  type="button"
                  onClick={() => onSelectChapter('all')}
                  className={`h-6 px-2 rounded text-[10px] font-semibold whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                    activeChapterIdx === 'all'
                      ? 'bg-[#1e2745] border-[#f2c85b] text-[#f2c85b]'
                      : 'bg-[#101425] border-white/10 text-[#9aa3bd] hover:text-white'
                  }`}
                >
                  All ({episode.beats.length})
                </button>
                {episodeChapters.map((ch) => {
                  const isActive = activeChapterIdx === ch.index;
                  const containsLive =
                    activeBeatIdx >= ch.startBeatIdx && activeBeatIdx <= ch.endBeatIdx;
                  return (
                    <button
                      key={ch.index}
                      type="button"
                      onClick={() => onSelectChapter(ch.index)}
                      title={`Jump to ${ch.title} (${formatLongDuration(ch.startSec)} · ${ch.beatCount} scenes)`}
                      className={`h-6 px-2 rounded text-[10px] font-semibold whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#1e2745] border-[#f2c85b] text-[#f2c85b]'
                          : containsLive
                            ? 'bg-[#151d36] border-white/25 text-white'
                            : 'bg-[#101425] border-white/10 text-[#9aa3bd] hover:text-white'
                      }`}
                    >
                      Ch {ch.chapterNumber}: {ch.title.slice(0, 22)} ({ch.beatCount})
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {viewMode === 'timeline' && (
            <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-[#8e97b0]">
              <span className="hidden sm:inline">Drag right edge to trim · Click ruler to scrub</span>
              <button
                type="button"
                onClick={() => setPxPerSec((z) => Math.max(16, z - 6))}
                className="h-5 w-5 rounded bg-[#101425] border border-white/10 hover:text-white inline-flex items-center justify-center cursor-pointer"
                title="Zoom out timeline"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="font-mono text-[10px] text-[#c7d0e8] w-9 text-center">
                {pxPerSec}px/s
              </span>
              <button
                type="button"
                onClick={() => setPxPerSec((z) => Math.min(52, z + 6))}
                className="h-5 w-5 rounded bg-[#101425] border border-white/10 hover:text-white inline-flex items-center justify-center cursor-pointer"
                title="Zoom in timeline"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Upgrade 16: Retention & Pacing Heatmap Toggle + 1-Click Boost Flat Beats */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowHeatmap((v) => !v)}
              title={`Toggle Retention & Pacing Heatmap (Overall Score ${pacingReport.overallScore}/100 · ${pacingReport.dropOffZones.length} drop-off zone${pacingReport.dropOffZones.length === 1 ? '' : 's'})`}
              className={`h-6 px-2 rounded text-[10px] font-semibold inline-flex items-center gap-1 border cursor-pointer transition-colors ${
                showHeatmap
                  ? 'bg-[#1a223d] border-[#f2c85b]/60 text-[#f2c85b]'
                  : 'bg-[#101425] border-white/10 text-[#9aa3bd] hover:text-white'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>Retention {pacingReport.overallScore}</span>
              {pacingReport.dropOffZones.length > 0 && (
                <span className="px-1 rounded bg-[#ff4d6d]/20 text-[#fda4af] font-mono">
                  {pacingReport.dropOffZones.length}!
                </span>
              )}
            </button>
            {onBoostFlatBeats && pacingReport.flatBeatIndices.length > 0 && (
              <button
                type="button"
                onClick={onBoostFlatBeats}
                title={`Auto-boost ${pacingReport.flatBeatIndices.length} flat beat(s) with camera moves, reaction cuts & SFX (preserves voice durations)`}
                className="h-6 px-2 rounded bg-[#231e12] hover:bg-[#332a17] border border-[#f2c85b]/45 text-[10px] font-semibold text-[#f2c85b] inline-flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Boost Flat Beats ({pacingReport.flatBeatIndices.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Toggleable Retention Sparkline Bar (clickable to jump straight to any beat or drop-off zone) */}
        {showHeatmap && pacingReport.beatScores.length > 0 && (
          <div className="px-2 py-1.5 rounded-lg bg-[#0a0d18] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-[#8e97b0]">
              <span>
                Retention Heatmap · Overall{' '}
                <strong className="text-white">{pacingReport.overallScore}/100</strong>
                {pacingReport.dropOffZones.length > 0
                  ? ` · ${pacingReport.dropOffZones.length} drop-off zone (>12s low energy)`
                  : ' · Crisp pacing (0 drop-off zones)'}
              </span>
              <span className="text-[9px]">Click any bar to jump</span>
            </div>
            <div className="flex items-end gap-0.5 h-8">
              {pacingReport.beatScores.map((bs) => {
                const isSel = bs.beatIndex === selectedBeatIdx;
                const barColor =
                  bs.score >= 76
                    ? 'bg-[#22c55e]'
                    : bs.score >= 60
                      ? 'bg-[#f2c85b]'
                      : 'bg-[#ff4d6d]';
                return (
                  <button
                    key={bs.beatId}
                    type="button"
                    onClick={() => onSelectBeat(bs.beatIndex)}
                    title={`Scene ${bs.beatIndex + 1} (${bs.durationSec.toFixed(1)}s): Score ${bs.score}/100${bs.reasons.length ? ` — ${bs.reasons.join(', ')}` : ''}`}
                    className={`flex-1 min-w-[6px] h-full flex items-end cursor-pointer rounded-sm transition-opacity ${
                      isSel ? 'ring-1 ring-white opacity-100' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`w-full rounded-t-sm ${barColor}`}
                      style={{ height: `${Math.max(18, bs.score)}%` }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'cards' ? (
          /* Horizontal Beat Storyboard Strip (Drag-and-drop reorderable) */
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            {visibleBeats.map(({ b, idx }) => {
              const isSelected = idx === selectedBeatIdx;
              const isLive = idx === activeBeatIdx;
              const hasVoice = !!voiceMeta[b.id];
              const cueCount = b.actionCues?.length || 0;
              const lead = typeof b.audioLeadSec === 'number' ? b.audioLeadSec : 0;
              const isDropTarget =
                dragOverBeatIdx === idx && dragBeatIdx !== null && dragBeatIdx !== idx;
              return (
                <button
                  key={b.id}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    onDragStartBeat(idx);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', String(idx));
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverBeatIdx !== idx) onDragOverBeat(idx);
                  }}
                  onDragLeave={() => {
                    if (dragOverBeatIdx === idx) onDragLeaveBeat(idx);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragBeatIdx !== null && dragBeatIdx !== idx) {
                      onDropBeat(dragBeatIdx, idx);
                    }
                    onDragEndBeat();
                  }}
                  onDragEnd={onDragEndBeat}
                  onClick={() => onSelectBeat(idx)}
                  title={`Click to edit scene (${(beatStarts[idx] ?? 0).toFixed(1)}s) · Drag & drop to reorder timeline`}
                  className={`min-w-[146px] max-w-[184px] px-3 py-2 rounded-md text-left border transition-colors shrink-0 cursor-pointer ${
                    isDropTarget
                      ? 'bg-[#282212] border-[#f2c85b] ring-2 ring-[#f2c85b]/50 text-white'
                      : isSelected
                        ? 'bg-[#1b233d] border-[#f2c85b] text-white'
                        : isLive
                          ? 'bg-[#151c33] border-white/30 text-[#eef1f8]'
                          : 'bg-[#111526] border-white/8 text-[#9aa3bd] hover:border-white/20 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                    <span className="truncate">
                      {String(idx + 1).padStart(2, '0')}. {b.title}
                    </span>
                    <span className="font-mono-tabular text-[11px] text-[#848da8] shrink-0">
                      {b.duration.toFixed(1)}s
                    </span>
                  </div>
                  <div className="text-[11px] text-[#7f88a3] truncate mt-0.5">
                    {b.frame === 'end_screen'
                      ? 'end screen'
                      : b.frame === 'chapter_title'
                        ? 'chapter title'
                        : b.shot.replace('_', ' ')}
                    {b.renderStyle
                      ? ` · ${RENDER_STYLE_CATALOG.find((r) => r.id === b.renderStyle)?.shortLabel || b.renderStyle}`
                      : ''}
                    {cueCount > 0 ? ` · ${cueCount}c` : ''}
                    {hasVoice ? ' · VO' : ''}
                    {lead > 0.02 ? ' · J' : lead < -0.02 ? ' · L' : ''}
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              onClick={onAddBeat}
              className="h-[52px] px-3.5 rounded-md border border-dashed border-white/20 hover:border-[#f2c85b]/60 text-xs font-semibold text-[#aeb6cc] hover:text-white inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Scene</span>
            </button>

            <button
              type="button"
              onClick={onAddEndScreenBeat}
              title="Append a 12-second YouTube End-Screen safe-zone outro card with Subscribe & Next Video slots"
              className="h-[52px] px-3 rounded-md border border-dashed border-[#f2c85b]/35 hover:border-[#f2c85b] text-xs font-semibold text-[#f2c85b] hover:bg-[#1a1f36] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>+ End Screen</span>
            </button>
          </div>
        ) : (
          /* Proportional Multi-Track Timeline Mode (Ruler + Scenes + Voice/Cue/SFX Tracks) */
          <div className="flex items-stretch gap-2">
            <div
              ref={trackContainerRef}
              className="flex-1 overflow-x-auto rounded-md bg-[#0b0e19] border border-white/10 select-none"
            >
              <div
                className="relative"
                style={{ width: `${totalTimelineWidth + 16}px`, minWidth: '100%' }}
              >
                {/* Interactive Time Ruler */}
                <div
                  onPointerDown={handleRulerPointerDown}
                  className="relative h-5 bg-[#111526] border-b border-white/10 cursor-ew-resize"
                  title="Click or drag to scrub exact episode time"
                >
                  {rulerTicks.map((tSec) => {
                    const leftPx = (tSec - visibleOriginSec) * pxPerSec;
                    return (
                      <div
                        key={tSec}
                        className="absolute top-0 bottom-0 border-l border-white/15 pl-1 text-[9px] font-mono text-[#8e97b0] pointer-events-none leading-5"
                        style={{ left: `${leftPx}px` }}
                      >
                        {formatTickSec(tSec)}
                      </div>
                    );
                  })}
                </div>

                {/* Track 1: Duration-Proportional Scene Clips with Right-Edge Trim Handles */}
                <div className="relative h-9 flex items-center border-b border-white/8 bg-[#0e1222]">
                  {visibleBeats.map(({ b, idx }) => {
                    const effDur =
                      resizingState && resizingState.idx === idx
                        ? resizingState.previewDur
                        : Math.max(1.2, b.duration || 4);
                    const widthPx = Math.max(28, effDur * pxPerSec);
                    const isSelected = idx === selectedBeatIdx;
                    const isLive = idx === activeBeatIdx;
                    const lead = typeof b.audioLeadSec === 'number' ? b.audioLeadSec : 0;

                    return (
                      <div
                        key={b.id}
                        onClick={() => onSelectBeat(idx)}
                        style={{ width: `${widthPx}px` }}
                        className={`relative h-8 shrink-0 px-1.5 py-0.5 border-r border-white/15 overflow-hidden cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#222d52] ring-1 ring-inset ring-[#f2c85b] text-white'
                            : isLive
                              ? 'bg-[#18213d] text-[#eef1f8]'
                              : 'bg-[#13182b] text-[#9aa3bd] hover:bg-[#192038] hover:text-white'
                        }`}
                        title={`${idx + 1}. ${b.title} (${effDur.toFixed(1)}s · ${b.shot.replace('_', ' ')})${lead !== 0 ? ` · ${lead > 0 ? `J-Cut +${lead.toFixed(2)}s` : `L-Cut ${lead.toFixed(2)}s`}` : ''}`}
                      >
                        {lead > 0.02 && (
                          <span
                            className="absolute left-0 top-0 bottom-0 w-1 bg-[#38bdf8]"
                            title={`J-Cut +${lead.toFixed(2)}s audio pre-roll`}
                          />
                        )}
                        {lead < -0.02 && (
                          <span
                            className="absolute left-0 top-0 bottom-0 w-1 bg-[#f59e0b]"
                            title={`L-Cut ${lead.toFixed(2)}s voice delay`}
                          />
                        )}
                        <div className="flex items-center justify-between gap-1 text-[10px] font-semibold leading-tight truncate pr-1.5">
                          <span className="truncate">
                            {idx + 1}. {b.title}
                          </span>
                          <span className="font-mono text-[9px] text-[#8e97b0] shrink-0">
                            {effDur.toFixed(1)}s
                          </span>
                        </div>
                        <div className="text-[9px] text-[#7f88a3] truncate leading-tight">
                          {b.frame === 'end_screen'
                            ? 'end screen'
                            : b.frame === 'chapter_title'
                              ? 'title card'
                              : b.shot.replace('_', ' ')}
                        </div>

                        {/* Right-edge duration drag handle */}
                        {onResizeBeatDuration && (
                          <div
                            onPointerDown={(e) => startEdgeResize(e, idx, Math.max(1.2, b.duration || 4))}
                            className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-[#f2c85b]/60 transition-colors"
                            title="Drag to trim scene duration"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Track 2: Voice Coverage Bars + Action Cue Diamonds + SFX Pins */}
                <div className="relative h-6 flex items-center bg-[#0a0d17]">
                  {visibleBeats.map(({ b, idx }) => {
                    const effDur =
                      resizingState && resizingState.idx === idx
                        ? resizingState.previewDur
                        : Math.max(1.2, b.duration || 4);
                    const widthPx = Math.max(28, effDur * pxPerSec);
                    const vo = voiceMeta[b.id];
                    const voFrac = vo ? Math.min(1, Math.max(0.08, vo.duration / effDur)) : 0;
                    const voOverflow = vo ? vo.duration > effDur + 0.15 : false;
                    const lead = typeof b.audioLeadSec === 'number' ? b.audioLeadSec : 0;
                    const voShiftPx = Math.max(-18, Math.min(18, -lead * pxPerSec));

                    return (
                      <div
                        key={`${b.id}_track2`}
                        onClick={() => onSelectBeat(idx)}
                        style={{ width: `${widthPx}px` }}
                        className="relative h-full shrink-0 border-r border-white/8 cursor-pointer overflow-visible"
                      >
                        {vo && (
                          <div
                            className={`absolute top-1.5 h-3 rounded-sm border ${
                              voOverflow
                                ? 'bg-amber-500/35 border-amber-400/70'
                                : 'bg-emerald-500/30 border-emerald-400/65'
                            }`}
                            style={{
                              left: `${Math.max(0, voShiftPx)}px`,
                              width: `${Math.max(6, widthPx * voFrac)}px`,
                            }}
                            title={`Voice: ${vo.fileName} (${vo.duration.toFixed(1)}s)`}
                          />
                        )}
                        {/* Beat SFX pin */}
                        {b.sfx && b.sfx !== 'none' && (
                          <span
                            className="absolute top-1 w-2 h-2 rounded-full bg-[#f59e0b] ring-1 ring-[#0a0d17]"
                            style={{
                              left: `${Math.min(widthPx - 6, Math.max(2, (b.sfxOffsetSec ?? 0) * pxPerSec))}px`,
                            }}
                            title={`SFX: ${b.sfx} @ ${(b.sfxOffsetSec ?? 0).toFixed(2)}s`}
                          />
                        )}
                        {/* Sub-beat Action Cue diamonds */}
                        {(b.actionCues || []).map((cue, cIdx) => {
                          const cueSec =
                            typeof cue.frame === 'number' && Number.isFinite(cue.frame)
                              ? cue.frame / STUDIO_FPS
                              : 0;
                          const leftPx = Math.min(widthPx - 6, Math.max(2, cueSec * pxPerSec));
                          return (
                            <span
                              key={cIdx}
                              className="absolute bottom-1 w-2 h-2 rotate-45 bg-[#38bdf8] ring-1 ring-[#0a0d17]"
                              style={{ left: `${leftPx}px` }}
                              title={`Cue ${cIdx + 1}: ${cue.label || cue.pose || cue.sfx || 'action'} @ ${cueSec.toFixed(2)}s`}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Live Playhead Vertical Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-[#f2c85b] pointer-events-none z-10 shadow-[0_0_8px_rgba(242,200,91,0.85)]"
                  style={{ left: `${playheadX}px` }}
                >
                  <div className="w-2.5 h-2.5 -ml-[4px] bg-[#f2c85b] rotate-45 -mt-1" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 shrink-0">
              <button
                type="button"
                onClick={onAddBeat}
                className="flex-1 px-2.5 rounded border border-dashed border-white/20 hover:border-[#f2c85b]/60 text-[10px] font-semibold text-[#aeb6cc] hover:text-white inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Scene</span>
              </button>
              <button
                type="button"
                onClick={onAddEndScreenBeat}
                className="flex-1 px-2.5 rounded border border-dashed border-[#f2c85b]/35 hover:border-[#f2c85b] text-[10px] font-semibold text-[#f2c85b] inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <Tv className="w-3 h-3" />
                <span>Outro</span>
              </button>
            </div>
          </div>
        )}
      </>
    );
  }
);

StoryboardTimelineStrip.displayName = 'StoryboardTimelineStrip';
