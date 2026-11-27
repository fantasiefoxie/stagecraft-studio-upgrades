import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  EpisodeScript,
  MOTION_CADENCE_CATALOG,
  MOTION_PROFILE_CATALOG,
  MotionCadenceId,
  MotionProfileId,
  POST_FX_PASS_CATALOG,
  PostFxPassId,
  RENDER_STYLE_CATALOG,
  RENDER_STYLE_CATEGORIES,
  RenderStyleId,
  getRecommendedRenderStyle,
} from './types';
import { auditEpisodeAnimationPrinciples } from './animationPrinciples';
import { evaluateEpisodeAtTime, renderEpisodeFrame } from './renderer';

interface StyleEngineSwatchPickerProps {
  episode: EpisodeScript;
  selectedBeatIdx: number;
  activeRenderStyle: RenderStyleId;
  activeMotionCadence: MotionCadenceId;
  activeMotionProfile: MotionProfileId;
  activePostFxPass: PostFxPassId;
  onSelectStyle: (style: RenderStyleId) => void;
  onSelectCadence: (cadence: MotionCadenceId) => void;
  onSelectMotionProfile: (profile: MotionProfileId) => void;
  onSelectPostFxPass: (pass: PostFxPassId) => void;
  onPolishAnimationPrinciples: () => void;
  onMatchShelfStyle: () => void;
}

const SWATCH_W = 192;
const SWATCH_H = 108;

/**
 * Memoized 20-Style Art Engine Swatch Picker + Motion Cadence Selector.
 * Renders crisp live 16:9 mini-canvas thumbnails of the active scene across all 20
 * deterministic Art Engines using staggered idle slices so panel mount stays 60fps.
 */
export const StyleEngineSwatchPicker: React.FC<StyleEngineSwatchPickerProps> = React.memo(
  function StyleEngineSwatchPicker({
    episode,
    selectedBeatIdx,
    activeRenderStyle,
    activeMotionCadence,
    activeMotionProfile,
    activePostFxPass,
    onSelectStyle,
    onSelectCadence,
    onSelectMotionProfile,
    onSelectPostFxPass,
    onPolishAnimationPrinciples,
    onMatchShelfStyle,
  }) {
    const [swatches, setSwatches] = useState<Partial<Record<RenderStyleId, string>>>({});
    const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const recommendedStyle = useMemo(() => getRecommendedRenderStyle(episode), [episode]);

    // Compute representative preview time at the midpoint of the selected beat
    const previewTimeSec = useMemo(() => {
      let cursor = 0;
      const clampedIdx = Math.max(0, Math.min(episode.beats.length - 1, selectedBeatIdx));
      for (let i = 0; i < clampedIdx; i++) {
        cursor += Math.max(1.2, episode.beats[i]?.duration || 4);
      }
      const beatDur = Math.max(1.2, episode.beats[clampedIdx]?.duration || 4);
      return cursor + beatDur * 0.45;
    }, [episode.beats, selectedBeatIdx]);

    // Stable fingerprint so swatches only refresh when scene stage/mood/cast/shot changes
    const sceneFingerprint = useMemo(() => {
      const b = episode.beats[Math.max(0, Math.min(episode.beats.length - 1, selectedBeatIdx))];
      if (!b) return episode.id;
      return `${episode.id}|${b.id}|${b.stage}|${b.mood}|${b.shot}|${b.prop}|${b.actors.map((a) => `${a.castId}:${a.pose}`).join(',')}`;
    }, [episode.id, episode.beats, selectedBeatIdx]);

    useEffect(() => {
      if (typeof document === 'undefined') return;
      let cancelled = false;
      let timerId: number | null = null;

      if (!scratchCanvasRef.current) {
        const c = document.createElement('canvas');
        c.width = SWATCH_W;
        c.height = SWATCH_H;
        scratchCanvasRef.current = c;
      }
      const scratch = scratchCanvasRef.current;
      const ctx = scratch.getContext('2d');
      if (!ctx) return;

      const styles = RENDER_STYLE_CATALOG.map((e) => e.id);
      let cursor = 0;

      const renderNextBatch = () => {
        if (cancelled) return;
        const batchEnd = Math.min(styles.length, cursor + 2);
        const batchUpdates: Partial<Record<RenderStyleId, string>> = {};

        for (let i = cursor; i < batchEnd; i++) {
          const styleId = styles[i];
          try {
            const tempEpisode: EpisodeScript = {
              ...episode,
              visualStyle: {
                ...(episode.visualStyle || {}),
                renderStyle: styleId,
                frameBorder: 'full_bleed',
              },
            };
            const evalState = evaluateEpisodeAtTime(tempEpisode, previewTimeSec, null);
            renderEpisodeFrame(
              ctx,
              SWATCH_W,
              SWATCH_H,
              tempEpisode,
              evalState,
              previewTimeSec,
              '16:9',
              false,
              true
            );
            batchUpdates[styleId] = scratch.toDataURL('image/jpeg', 0.72);
          } catch {
            // Skip gracefully if canvas export fails in restricted environment
          }
        }

        if (!cancelled && Object.keys(batchUpdates).length > 0) {
          setSwatches((prev) => ({ ...prev, ...batchUpdates }));
        }

        cursor = batchEnd;
        if (cursor < styles.length && !cancelled) {
          timerId = window.setTimeout(renderNextBatch, 24);
        }
      };

      // Yield briefly so tab switch animation completes before baking swatches
      timerId = window.setTimeout(renderNextBatch, 30);

      return () => {
        cancelled = true;
        if (timerId !== null) window.clearTimeout(timerId);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sceneFingerprint, previewTimeSec]);

    const activeCadenceMeta = useMemo(
      () =>
        MOTION_CADENCE_CATALOG.find((m) => m.id === activeMotionCadence) ||
        MOTION_CADENCE_CATALOG[0],
      [activeMotionCadence]
    );

    const activeProfileMeta = useMemo(
      () =>
        MOTION_PROFILE_CATALOG.find((m) => m.id === activeMotionProfile) ||
        MOTION_PROFILE_CATALOG[0],
      [activeMotionProfile]
    );

    const principlesAudit = useMemo(
      () => auditEpisodeAnimationPrinciples(episode),
      [episode]
    );

    const firstPrincipleWarn = useMemo(
      () => principlesAudit.checks.find((c) => c.status === 'warn'),
      [principlesAudit]
    );

    const activePostFxMeta = useMemo(
      () =>
        POST_FX_PASS_CATALOG.find((p) => p.id === activePostFxPass) ||
        POST_FX_PASS_CATALOG[0],
      [activePostFxPass]
    );

    return (
      <>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#f2c85b]">
            Animation Art Engine ({RENDER_STYLE_CATALOG.length} Styles)
          </span>
          <button
            type="button"
            onClick={onMatchShelfStyle}
            title="Apply the signature anthology style recommended for this storybook shelf"
            className="text-[11px] text-[#f7e7bc] hover:text-[#f2c85b] underline underline-offset-2 cursor-pointer"
          >
            Match Shelf Style
          </button>
        </div>

        <div className="space-y-3">
          {RENDER_STYLE_CATEGORIES.map((category) => {
            const stylesInCategory = RENDER_STYLE_CATALOG.filter(
              (engine) => engine.category === category
            );
            if (stylesInCategory.length === 0) return null;
            return (
              <div key={category} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9aa3bd]">
                    {category}
                  </span>
                  <span className="text-[10px] text-[#6d7694]">{stylesInCategory.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {stylesInCategory.map((engine) => {
                    const active = activeRenderStyle === engine.id;
                    const isShelfRec = recommendedStyle === engine.id;
                    const thumbUrl = swatches[engine.id];
                    return (
                      <button
                        key={engine.id}
                        type="button"
                        onClick={() => onSelectStyle(engine.id)}
                        className={`p-1.5 rounded-lg border text-left transition-colors cursor-pointer overflow-hidden ${
                          active
                            ? 'bg-[#1c2440] border-[#f2c85b]'
                            : 'bg-[#13182b] border-white/10 hover:border-white/25'
                        }`}
                      >
                        <div className="relative w-full aspect-video rounded overflow-hidden bg-[#0a0d18] mb-1.5 border border-white/5">
                          {thumbUrl ? (
                            <img
                              src={thumbUrl}
                              alt={`${engine.shortLabel} preview`}
                              className="w-full h-full object-cover block"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] text-[#5e6885]">
                              Preview…
                            </div>
                          )}
                          {isShelfRec && (
                            <span className="absolute top-1 right-1 px-1 py-0.5 rounded bg-[#0c1020]/85 text-[8px] font-bold uppercase tracking-wider text-[#f7d577]">
                              Shelf
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-1 px-0.5">
                          <span
                            className={`text-[11px] font-semibold truncate ${
                              active ? 'text-[#f2c85b]' : 'text-white'
                            }`}
                          >
                            {engine.shortLabel}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#848da8] leading-snug mt-0.5 px-0.5 line-clamp-2">
                          {engine.bestFor}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Motion Cadence Selector (Auto / 60fps / 24fps / 12fps On-Twos) */}
        <div className="space-y-1.5 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-white">Motion Cadence</span>
            <span className="text-[10px] text-[#848da8] truncate">{activeCadenceMeta.note}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {MOTION_CADENCE_CATALOG.map((cadence) => {
              const active = activeMotionCadence === cadence.id;
              return (
                <button
                  key={cadence.id}
                  type="button"
                  onClick={() => onSelectCadence(cadence.id as MotionCadenceId)}
                  title={`${cadence.label} — ${cadence.note}`}
                  className={`h-8 px-2 rounded-md border text-[11px] font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#1c2440] border-[#f2c85b] text-[#f2c85b]'
                      : 'bg-[#13182b] border-white/10 text-[#c9d2ea] hover:border-white/25'
                  }`}
                >
                  {cadence.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* 12 Principles of Animation Motion Philosophy & 1-Click Auto-Polish */}
        <div className="space-y-1.5 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11px] font-semibold text-white truncate">
                12 Animation Principles
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  principlesAudit.overallScore >= 80
                    ? 'bg-[#17352a] text-[#6be5b8]'
                    : 'bg-[#352a14] text-[#f2c85b]'
                }`}
                title="Live 12-Principles audit score (Timing, Staging, Anticipation, Secondary Action & Appeal)"
              >
                {principlesAudit.overallScore}/100
              </span>
            </div>
            <button
              type="button"
              onClick={onPolishAnimationPrinciples}
              title="Auto-polish static camera moves, opening anticipation arcs, focal close-ups, secondary weather motion & timing contrast"
              className="text-[10px] font-semibold text-[#f7e7bc] hover:text-[#f2c85b] underline underline-offset-2 cursor-pointer shrink-0"
            >
              1-Click Polish
            </button>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {MOTION_PROFILE_CATALOG.map((prof) => {
              const active = activeMotionProfile === prof.id;
              return (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => onSelectMotionProfile(prof.id as MotionProfileId)}
                  title={`${prof.label} — ${prof.note}`}
                  className={`h-8 px-1 rounded-md border text-[10px] font-semibold transition-colors cursor-pointer truncate ${
                    active
                      ? 'bg-[#1c2440] border-[#f2c85b] text-[#f2c85b]'
                      : 'bg-[#13182b] border-white/10 text-[#c9d2ea] hover:border-white/25'
                  }`}
                >
                  {prof.shortLabel}
                </button>
              );
            })}
          </div>
          <div className="text-[10px] text-[#848da8] leading-snug">
            {firstPrincipleWarn
              ? `Tip (${firstPrincipleWarn.principle}): ${firstPrincipleWarn.note}`
              : activeProfileMeta.note}
          </div>
        </div>

        {/* Composable Post-FX Pass (Bayer 4x4 Dither, 16-Bit Pixel Grid, Edge, RGB, Halftone) */}
        <div className="space-y-1.5 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-white">Post-FX Pass</span>
            <span className="text-[10px] text-[#848da8] truncate">{activePostFxMeta.note}</span>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {POST_FX_PASS_CATALOG.map((fxPass) => {
              const active = activePostFxPass === fxPass.id;
              return (
                <button
                  key={fxPass.id}
                  type="button"
                  onClick={() => onSelectPostFxPass(fxPass.id as PostFxPassId)}
                  title={`${fxPass.label} — ${fxPass.note}`}
                  className={`h-8 px-1 rounded-md border text-[10px] font-semibold transition-colors cursor-pointer truncate ${
                    active
                      ? 'bg-[#1c2440] border-[#f2c85b] text-[#f2c85b]'
                      : 'bg-[#13182b] border-white/10 text-[#c9d2ea] hover:border-white/25'
                  }`}
                >
                  {fxPass.shortLabel}
                </button>
              );
            })}
          </div>
        </div>
      </>
    );
  }
);
