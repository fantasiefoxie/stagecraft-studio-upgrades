import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Scissors,
  Image as ImageIcon,
  Download,
  Circle,
  Smartphone,
  Layers,
  Sparkles,
  Zap,
  Archive,
} from 'lucide-react';
import {
  EpisodeScript,
  EXPRESSION_LIST,
  ExpressionId,
  MOOD_CATALOG,
  MoodId,
  PROP_CATALOG,
  PropId,
  RENDER_STYLE_CATALOG,
  RenderStyleId,
  STAGE_CATALOG,
  StageId,
  resolveVisualStyle,
} from './types';
import {
  ThumbnailAbcVariant,
  ThumbnailConfig,
  ThumbnailLayoutId,
  buildAbcThumbnailVariants,
  renderYoutubeThumbnail,
} from './thumbnailRenderer';
import { recommendTopShortSlices } from './shortsRecommender';

interface ShortsAndThumbnailModalProps {
  episode: EpisodeScript;
  onClose: () => void;
  onExportShortSlice: (
    startIdx: number,
    endIdx: number,
    hookTitle: string,
    useShortsPopCaptions: boolean
  ) => void;
  onFastRenderShortSlice?: (
    startIdx: number,
    endIdx: number,
    hookTitle: string,
    useShortsPopCaptions: boolean
  ) => void;
  onExportShortKatha?: (
    startIdx: number,
    endIdx: number,
    hookTitle: string,
    useShortsPopCaptions: boolean
  ) => void;
}

const VariantMiniThumb: React.FC<{
  episode: EpisodeScript;
  variant: ThumbnailAbcVariant;
  active: boolean;
  onSelect: () => void;
}> = ({ episode, variant, active, onSelect }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    renderYoutubeThumbnail(ctx, 320, 180, episode, variant.config);
  }, [episode, variant.config]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-lg overflow-hidden border transition-all cursor-pointer ${
        active
          ? 'border-[#f2c85b] bg-[#1b223b] ring-1 ring-[#f2c85b]/50'
          : 'border-white/10 bg-[#12172a] hover:border-white/25'
      }`}
    >
      <div className="relative aspect-video w-full bg-[#050712]">
        <canvas ref={ref} width={320} height={180} className="w-full h-full object-cover block" />
        <span
          className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
            active ? 'bg-[#f2c85b] text-[#110e0a]' : 'bg-black/75 text-white'
          }`}
        >
          {variant.key}
        </span>
      </div>
      <div className="px-2 py-1.5">
        <div className="text-[11px] font-semibold text-white truncate">{variant.name}</div>
        <div className="text-[10px] text-[#8e97b0] truncate">{variant.angle}</div>
      </div>
    </button>
  );
};

export const ShortsAndThumbnailModal: React.FC<ShortsAndThumbnailModalProps> = ({
  episode,
  onClose,
  onExportShortSlice,
  onFastRenderShortSlice,
  onExportShortKatha,
}) => {
  const [activeTab, setActiveTab] = useState<'shorts' | 'thumbnail'>('shorts');

  // Auto-detected Viral Shorts candidates (deterministic)
  const recommendedSlices = useMemo(
    () => recommendTopShortSlices(episode, 3),
    [episode]
  );

  // Shorts Slicer State
  const [startIdx, setStartIdx] = useState(() => recommendedSlices[0]?.startIdx ?? 0);
  const [endIdx, setEndIdx] = useState(
    () => recommendedSlices[0]?.endIdx ?? Math.min(episode.beats.length - 1, 2)
  );
  const [hookTitle, setHookTitle] = useState('');
  const [useShortsPop, setUseShortsPop] = useState(true);

  const safeStart = Math.min(startIdx, episode.beats.length - 1);
  const safeEnd = Math.max(safeStart, Math.min(endIdx, episode.beats.length - 1));
  const sliceDuration = useMemo(() => {
    const beatsDur = episode.beats
      .slice(safeStart, safeEnd + 1)
      .reduce((sum, b) => sum + Math.max(1.2, b.duration), 0);
    return beatsDur + (hookTitle.trim() ? 2.0 : 0);
  }, [episode.beats, safeStart, safeEnd, hookTitle]);

  const totalEpisodeDur = useMemo(() => {
    const secs = Math.round(
      episode.beats.reduce((sum, b) => sum + Math.max(1.2, b.duration), 0)
    );
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }, [episode.beats]);

  // 3-Variant A/B/C YouTube Thumbnail State
  const [variants, setVariants] = useState<ThumbnailAbcVariant[]>(() =>
    buildAbcThumbnailVariants(episode)
  );
  const [activeVariantIdx, setActiveVariantIdx] = useState<number>(0);

  useEffect(() => {
    setVariants(buildAbcThumbnailVariants(episode));
    setActiveVariantIdx(0);
  }, [episode.id]);

  const activeVariant = variants[activeVariantIdx] || variants[0];
  const thumbCfg = activeVariant.config;

  const updateActiveThumb = (updater: (prev: ThumbnailConfig) => ThumbnailConfig) => {
    setVariants((prev) =>
      prev.map((v, idx) => (idx === activeVariantIdx ? { ...v, config: updater(v.config) } : v))
    );
  };

  const thumbCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mobileCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (activeTab !== 'thumbnail') return;
    const canvas = thumbCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) renderYoutubeThumbnail(ctx, 1280, 720, episode, thumbCfg);
    }
    const mob = mobileCanvasRef.current;
    if (mob) {
      const mctx = mob.getContext('2d');
      if (mctx) renderYoutubeThumbnail(mctx, 336, 188, episode, thumbCfg);
    }
  }, [activeTab, episode, thumbCfg]);

  const downloadSingleVariant = (variant: ThumbnailAbcVariant) => {
    const off = document.createElement('canvas');
    off.width = 1280;
    off.height = 720;
    const ctx = off.getContext('2d');
    if (!ctx) return;
    renderYoutubeThumbnail(ctx, 1280, 720, episode, variant.config);
    const url = off.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${episode.id}_thumb_${variant.key}_1280x720.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownloadAllAbc = () => {
    variants.forEach((variant, idx) => {
      setTimeout(() => downloadSingleVariant(variant), idx * 240);
    });
  };

  const resolvedLook = resolveVisualStyle(episode.visualStyle);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[1020px] max-h-[92vh] bg-[#0e1222] border border-white/15 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 h-14 border-b border-white/10 flex items-center justify-between gap-4 shrink-0 bg-[#0b0e19]">
          <div className="flex items-center gap-3">
            <span className="font-display text-base font-semibold text-white">
              Shorts Slicer &amp; A/B/C Thumbnail Studio
            </span>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#14192d] border border-white/8">
              <button
                type="button"
                onClick={() => setActiveTab('shorts')}
                className={`px-3 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'shorts'
                    ? 'bg-[#1f2947] text-[#f2c85b]'
                    : 'text-[#8e97b0] hover:text-white'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Shorts Slicer (9:16)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('thumbnail')}
                className={`px-3 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'thumbnail'
                    ? 'bg-[#1f2947] text-[#f2c85b]'
                    : 'text-[#8e97b0] hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>A/B/C Thumbnails (PNG)</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-white/10 flex items-center justify-center text-[#9aa3bd] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'shorts' ? (
            <div className="space-y-4">
              <p className="text-xs text-[#9aa3bd] leading-relaxed">
                Pick any recommended viral highlight or custom scene range from{' '}
                <span className="text-white font-semibold">{episode.title}</span> to export as a
                standalone vertical <span className="text-white">9:16 Short</span> with Auto-Track
                Speaker framing, voiceovers, regional music score, and SFX intact.
              </p>

              {/* Top 3 Auto-Detected Viral Shorts */}
              {recommendedSlices.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#f2c85b]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Top Auto-Detected Viral Shorts</span>
                    </span>
                    <span className="text-[10px] text-[#848da8]">
                      Click any card to load scenes &amp; hook
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {recommendedSlices.map((rec, idx) => {
                      const isSelected = safeStart === rec.startIdx && safeEnd === rec.endIdx;
                      return (
                        <button
                          key={rec.id}
                          type="button"
                          onClick={() => {
                            setStartIdx(rec.startIdx);
                            setEndIdx(rec.endIdx);
                            setHookTitle(rec.suggestedHook);
                            setUseShortsPop(true);
                          }}
                          className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer space-y-1 ${
                            isSelected
                              ? 'bg-[#1d2542] border-[#f2c85b] ring-1 ring-[#f2c85b]/40'
                              : 'bg-[#12172a] border-white/10 hover:border-white/25'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-[#f2c85b]">
                              #{idx + 1} · {rec.reasonTag}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-[#0c1020] font-mono-tabular text-[10px] font-bold text-[#4ade80]">
                              {rec.score}/99
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-white truncate">
                            Scenes {rec.startIdx + 1}–{rec.endIdx + 1} ({rec.durationSec.toFixed(1)}s)
                          </div>
                          <div className="text-[10px] text-[#9aa3bd] truncate">{rec.summary}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Beat Range Selector */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">
                    Start Scene
                  </span>
                  <select
                    value={safeStart}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      setStartIdx(next);
                      if (next > endIdx) setEndIdx(next);
                    }}
                    className="w-full h-9 px-2.5 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
                  >
                    {episode.beats.map((b, i) => (
                      <option key={b.id} value={i}>
                        {String(i + 1).padStart(2, '0')}. {b.title} ({b.duration.toFixed(1)}s)
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">
                    End Scene
                  </span>
                  <select
                    value={safeEnd}
                    onChange={(e) => setEndIdx(Math.max(safeStart, Number(e.target.value)))}
                    className="w-full h-9 px-2.5 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
                  >
                    {episode.beats.map((b, i) => (
                      <option key={b.id} value={i} disabled={i < safeStart}>
                        {String(i + 1).padStart(2, '0')}. {b.title} ({b.duration.toFixed(1)}s)
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Optional 2s Hook Title & Bold Pop Captions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">
                    Optional 2s Hook Title Slate (leave blank to skip)
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. CAN YOU SOLVE BETAAL'S RIDDLE?"
                    value={hookTitle}
                    onChange={(e) => setHookTitle(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-md bg-[#14192b] border border-white/12 text-xs text-white focus:outline-none focus:border-[#f2c85b]"
                  />
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg bg-[#13182b] border border-white/10 cursor-pointer self-end">
                  <input
                    type="checkbox"
                    checked={useShortsPop}
                    onChange={(e) => setUseShortsPop(e.target.checked)}
                    className="w-4 h-4 accent-[#f2c85b]"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Auto-Apply Shorts Bold Pop Captions
                    </div>
                    <div className="text-[10px] text-[#848da8]">
                      Currently using {resolvedLook.captionStyle.replace('_', ' ')}
                    </div>
                  </div>
                </label>
              </div>

              {/* Included Beats Preview List */}
              <div className="p-3 rounded-lg bg-[#111526] border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">
                    Selected Slice: Scenes {safeStart + 1}–{safeEnd + 1} (
                    {safeEnd - safeStart + 1} scenes)
                  </span>
                  <span className="font-mono-tabular text-[#f2c85b] font-semibold">
                    Total {sliceDuration.toFixed(1)}s · 1080×1920 60fps
                  </span>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {episode.beats.slice(safeStart, safeEnd + 1).map((b, idx) => (
                    <div
                      key={b.id}
                      className="px-2.5 py-1.5 rounded bg-[#161c33] flex items-center justify-between gap-3 text-[11px]"
                    >
                      <span className="text-white font-medium truncate">
                        {String(safeStart + idx + 1).padStart(2, '0')}. {b.title} —{' '}
                        <span className="text-[#9aa3bd] font-normal">
                          {b.dialogue || '(Visual beat)'}
                        </span>
                      </span>
                      <span className="font-mono-tabular text-[#8e97b0] shrink-0">
                        {b.duration.toFixed(1)}s
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 px-3.5 rounded-md bg-[#161b2e] hover:bg-[#202742] border border-white/12 text-xs font-semibold text-[#d6dcf0] cursor-pointer"
                >
                  Cancel
                </button>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {onExportShortKatha && (
                    <button
                      type="button"
                      onClick={() => {
                        onExportShortKatha(safeStart, safeEnd, hookTitle.trim(), useShortsPop);
                      }}
                      className="h-9 px-3 rounded-md bg-[#141c33] hover:bg-[#1c2747] border border-white/15 text-[#d6dcf0] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      title="Save this Short + matching voice clips as a standalone .katha archive for CLI/batch rendering"
                    >
                      <Archive className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span>Export Short .katha</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onExportShortSlice(safeStart, safeEnd, hookTitle.trim(), useShortsPop);
                      onClose();
                    }}
                    className="h-9 px-3 rounded-md bg-[#182038] hover:bg-[#222d4f] border border-white/15 text-[#eef1f8] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    title="Real-time canvas MediaRecorder fallback (.webm)"
                  >
                    <Circle className="w-3 h-3 fill-current text-[#ff4d6d]" />
                    <span>Real-Time .webm</span>
                  </button>
                  {onFastRenderShortSlice && (
                    <button
                      type="button"
                      onClick={() => {
                        onFastRenderShortSlice(safeStart, safeEnd, hookTitle.trim(), useShortsPop);
                        onClose();
                      }}
                      className="h-9 px-4 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] text-[#110e0a] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      title="Render 9:16 Short 10x faster via WebCodecs Offline Engine / MP4 Broadcast Master"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Fast Export 9:16 Short (WebCodecs / MP4)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* YouTube Test & Compare 3-Variant A/B/C Strip */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-[#f2c85b]">
                      YouTube Test &amp; Compare · 3 Psychologically Distinct Variants
                    </div>
                    <div className="text-[11px] text-[#8e97b0]">
                      Click A, B, or C to fine-tune each concept, then export all 3 PNGs at 1280×720.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadAllAbc}
                    className="h-8 px-3.5 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] text-[#110e0a] text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Download All 3 A/B/C PNGs</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {variants.map((variant, idx) => (
                    <VariantMiniThumb
                      key={variant.key}
                      episode={episode}
                      variant={variant}
                      active={idx === activeVariantIdx}
                      onSelect={() => setActiveVariantIdx(idx)}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Live 1280x720 Preview + 168px Mobile Feed Legibility Checker */}
                <div className="lg:col-span-3 space-y-3">
                  <div className="aspect-video w-full rounded-lg overflow-hidden border border-white/15 bg-[#050712] shadow-xl">
                    <canvas
                      ref={thumbCanvasRef}
                      width={1280}
                      height={720}
                      className="w-full h-full object-contain block"
                    />
                  </div>

                  {/* 168px YouTube Mobile Feed Legibility Preview */}
                  <div className="p-3 rounded-lg bg-[#0b0f1d] border border-white/10 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="relative w-[168px] h-[94px] shrink-0 rounded-md overflow-hidden border border-white/15 bg-[#050712]">
                        <canvas
                          ref={mobileCanvasRef}
                          width={336}
                          height={188}
                          className="w-full h-full object-cover block"
                        />
                        <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/85 text-[9px] font-mono-tabular font-semibold text-white">
                          {totalEpisodeDur}
                        </span>
                      </div>
                      <div className="min-w-0 pt-0.5 space-y-1">
                        <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#f2c85b]">
                          <Smartphone className="w-3 h-3" />
                          <span>168px Mobile Feed Check ({activeVariant.key})</span>
                        </div>
                        <div className="text-xs font-semibold text-white leading-snug line-clamp-2">
                          {episode.title} — {episode.series}
                        </div>
                        <div className="text-[10px] text-[#848da8]">
                          Katha Studio · 142K views · 2 hours ago
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => downloadSingleVariant(activeVariant)}
                      className="h-9 px-3.5 rounded-md bg-[#1c2440] hover:bg-[#273258] border border-white/12 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download {activeVariant.key}</span>
                    </button>
                  </div>
                </div>

                {/* Active Variant Controls */}
                <div className="lg:col-span-2 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">
                        Layout Style
                      </span>
                      <select
                        value={thumbCfg.layout}
                        onChange={(e) =>
                          updateActiveThumb((prev) => ({
                            ...prev,
                            layout: e.target.value as ThumbnailLayoutId,
                          }))
                        }
                        className="w-full h-9 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
                      >
                        <option value="split_faceoff">Split Face-Off</option>
                        <option value="hero_prop">Hero + Relic</option>
                        <option value="mystery_silhouette">Mystery Silhouette</option>
                        <option value="center_epic">Center Epic</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">
                        Art Engine
                      </span>
                      <select
                        value={thumbCfg.renderStyle}
                        onChange={(e) =>
                          updateActiveThumb((prev) => ({
                            ...prev,
                            renderStyle: e.target.value as RenderStyleId,
                          }))
                        }
                        className="w-full h-9 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
                      >
                        {RENDER_STYLE_CATALOG.map((rs) => (
                          <option key={rs.id} value={rs.id}>
                            {rs.shortLabel}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">
                        Series Kicker
                      </span>
                      <input
                        type="text"
                        value={thumbCfg.kicker}
                        onChange={(e) =>
                          updateActiveThumb((p) => ({ ...p, kicker: e.target.value }))
                        }
                        className="w-full h-8 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
                      />
                    </label>
                    <label className="block">
                      <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">
                        Hero Prop
                      </span>
                      <select
                        value={thumbCfg.prop}
                        onChange={(e) =>
                          updateActiveThumb((p) => ({ ...p, prop: e.target.value as PropId }))
                        }
                        className="w-full h-8 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
                      >
                        {PROP_CATALOG.map((pr) => (
                          <option key={pr.id} value={pr.id}>
                            {pr.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">
                      Headline Top (White)
                    </span>
                    <input
                      type="text"
                      value={thumbCfg.headlineTop}
                      onChange={(e) =>
                        updateActiveThumb((p) => ({ ...p, headlineTop: e.target.value }))
                      }
                      className="w-full h-8 px-2.5 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">
                      Headline Accent (Gold)
                    </span>
                    <input
                      type="text"
                      value={thumbCfg.headlineAccent}
                      onChange={(e) =>
                        updateActiveThumb((p) => ({ ...p, headlineAccent: e.target.value }))
                      }
                      className="w-full h-8 px-2.5 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">
                        Stage
                      </span>
                      <select
                        value={thumbCfg.stage}
                        onChange={(e) =>
                          updateActiveThumb((p) => ({ ...p, stage: e.target.value as StageId }))
                        }
                        className="w-full h-8 px-1.5 rounded-md bg-[#14192b] border border-white/12 text-[11px] text-white"
                      >
                        {STAGE_CATALOG.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">
                        Mood
                      </span>
                      <select
                        value={thumbCfg.mood}
                        onChange={(e) =>
                          updateActiveThumb((p) => ({ ...p, mood: e.target.value as MoodId }))
                        }
                        className="w-full h-8 px-1.5 rounded-md bg-[#14192b] border border-white/12 text-[11px] text-white"
                      >
                        {MOOD_CATALOG.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">
                        Actor 1
                      </span>
                      <select
                        value={thumbCfg.leftCastId}
                        onChange={(e) =>
                          updateActiveThumb((p) => ({ ...p, leftCastId: e.target.value }))
                        }
                        className="w-full h-8 px-1.5 rounded-md bg-[#14192b] border border-white/12 text-[11px] text-white"
                      >
                        {episode.cast.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">
                        Face 1
                      </span>
                      <select
                        value={thumbCfg.leftExpression}
                        onChange={(e) =>
                          updateActiveThumb((p) => ({
                            ...p,
                            leftExpression: e.target.value as ExpressionId,
                          }))
                        }
                        className="w-full h-8 px-1.5 rounded-md bg-[#14192b] border border-white/12 text-[11px] text-white"
                      >
                        {EXPRESSION_LIST.map((ex) => (
                          <option key={ex} value={ex}>
                            {ex}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {thumbCfg.layout === 'split_faceoff' && (
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">
                          Actor 2
                        </span>
                        <select
                          value={thumbCfg.rightCastId}
                          onChange={(e) =>
                            updateActiveThumb((p) => ({ ...p, rightCastId: e.target.value }))
                          }
                          className="w-full h-8 px-1.5 rounded-md bg-[#14192b] border border-white/12 text-[11px] text-white"
                        >
                          {episode.cast.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">
                          Face 2
                        </span>
                        <select
                          value={thumbCfg.rightExpression}
                          onChange={(e) =>
                            updateActiveThumb((p) => ({
                              ...p,
                              rightExpression: e.target.value as ExpressionId,
                            }))
                          }
                          className="w-full h-8 px-1.5 rounded-md bg-[#14192b] border border-white/12 text-[11px] text-white"
                        >
                          {EXPRESSION_LIST.map((ex) => (
                            <option key={ex} value={ex}>
                              {ex}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
