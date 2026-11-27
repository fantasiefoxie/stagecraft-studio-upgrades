import React from 'react';
import {
  ImagePlus,
  Layers,
  Plus,
  RefreshCw,
  Sparkles,
  Wand2,
} from 'lucide-react';
import {
  ARCHETYPE_CATALOG,
  ArchetypeId,
  EpisodeScript,
  PROP_CATALOG,
  STAGE_CATALOG,
  StoryBeat,
} from './types';
import {
  ACT_ARC_PRESETS,
  ActArcPresetId,
  BACKDROP_THEMES,
  BackdropThemeId,
  CUSTOM_PROP_PRESETS,
  CustomPropPresetId,
} from './backdropGenerator';
import { AssetThumb } from './AssetThumb';

export type AssetCatalogTab = 'cast' | 'stages' | 'props';

interface WorkbenchAssetsTabProps {
  assetCat: AssetCatalogTab;
  onSelectAssetCat: (cat: AssetCatalogTab) => void;
  episode: EpisodeScript;
  selectedBeat: StoryBeat | undefined;
  selectedBeatIdx: number;
  customBackdropInputRef: React.RefObject<HTMLInputElement | null>;
  onCustomBackdropUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  procBackdropTheme: BackdropThemeId;
  onChangeProcBackdropTheme: (theme: BackdropThemeId) => void;
  procBackdropSeed: number;
  onCycleProcBackdropSeed: () => void;
  onGenerateProceduralBackdrop: (scope: 'scene' | 'act') => void;
  actArcPreset: ActArcPresetId;
  onChangeActArcPreset: (preset: ActArcPresetId) => void;
  onApplyActVisualArc: () => void;
  procPropPreset: CustomPropPresetId;
  onChangeProcPropPreset: (preset: CustomPropPresetId) => void;
  procPropSeed: number;
  onCycleProcPropSeed: () => void;
  onGenerateProceduralProp: () => void;
  onOpenWorkshopForNewEntity: () => void;
  onAddArchetypeToEpisode: (archetype: ArchetypeId, label: string) => void;
  onUpdateSelectedBeat: (patch: Partial<StoryBeat>) => void;
}

export const WorkbenchAssetsTab: React.FC<WorkbenchAssetsTabProps> = React.memo(
  ({
    assetCat,
    onSelectAssetCat,
    episode,
    selectedBeat,
    selectedBeatIdx,
    customBackdropInputRef,
    onCustomBackdropUpload,
    procBackdropTheme,
    onChangeProcBackdropTheme,
    procBackdropSeed,
    onCycleProcBackdropSeed,
    onGenerateProceduralBackdrop,
    actArcPreset,
    onChangeActArcPreset,
    onApplyActVisualArc,
    procPropPreset,
    onChangeProcPropPreset,
    procPropSeed,
    onCycleProcPropSeed,
    onGenerateProceduralProp,
    onOpenWorkshopForNewEntity,
    onAddArchetypeToEpisode,
    onUpdateSelectedBeat,
  }) => {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-3 border-b border-white/10 flex items-center gap-1.5 shrink-0">
          {(
            [
              ['cast', `Cast (${ARCHETYPE_CATALOG.length})`],
              ['stages', `Stages (${STAGE_CATALOG.length})`],
              ['props', `Props (${PROP_CATALOG.length - 1})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onSelectAssetCat(id)}
              className={`flex-1 h-8 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                assetCat === id
                  ? 'bg-white/15 text-white'
                  : 'text-[#8e97b0] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-[11px] text-[#848da8] mb-3">
            Click any asset to apply it directly to Scene {selectedBeatIdx + 1}.
          </p>

          {assetCat === 'cast' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={onOpenWorkshopForNewEntity}
                className="w-full p-3 rounded-lg bg-[#161e36] hover:bg-[#1e2948] border border-[#f2c85b]/45 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#f2c85b]">
                    Build Custom Character, Animal or Spirit
                  </div>
                  <div className="text-[10px] text-[#9aa3bd] mt-0.5">
                    Open the Sims-style Entity DNA Workshop (6 body chassis · modular parts · morph sliders)
                  </div>
                </div>
                <Plus className="w-4 h-4 text-[#f2c85b] shrink-0" />
              </button>

              {(['Epic & Divine', 'Royalty & Folk', 'Fable Fauna', 'World Legends'] as const).map((group) => (
                <div key={group}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#f2c85b]/80 mb-2">
                    {group}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {ARCHETYPE_CATALOG.filter((a) => a.group === group).map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => onAddArchetypeToEpisode(a.id, a.label)}
                        className="p-2 rounded-lg bg-[#13182b] border border-white/10 hover:border-[#f2c85b]/60 text-left transition-colors cursor-pointer"
                      >
                        <AssetThumb kind="archetype" id={a.id} />
                        <div className="mt-1.5 text-xs font-semibold text-white truncate">{a.label}</div>
                        <div className="text-[10px] text-[#848da8] truncate">{a.stories}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {assetCat === 'stages' && (
            <div className="space-y-3">
              <input
                ref={customBackdropInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={onCustomBackdropUpload}
                className="hidden"
              />
              <div className="p-2.5 rounded-lg bg-[#13182b] border border-[#f2c85b]/25 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-[#f2c85b] truncate">
                    {selectedBeat?.customBackdropDataUrl
                      ? `Custom Plate: ${selectedBeat.customBackdropLabel || 'Uploaded'}`
                      : 'Custom Stage Backdrop'}
                  </div>
                  <div className="text-[10px] text-[#848da8]">
                    Upload a painted PNG/JPG/WebP backdrop (≤4 MB) for Scene {selectedBeatIdx + 1}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => customBackdropInputRef.current?.click()}
                    className="h-7 px-2.5 rounded bg-[#1f2947] hover:bg-[#2a365e] border border-[#f2c85b]/35 text-[10px] font-semibold text-[#f7e7bc] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ImagePlus className="w-3 h-3" />
                    <span>{selectedBeat?.customBackdropDataUrl ? 'Replace' : 'Upload'}</span>
                  </button>
                  {selectedBeat?.customBackdropDataUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSelectedBeat({
                          customBackdropDataUrl: undefined,
                          customBackdropLabel: undefined,
                        })
                      }
                      className="h-7 px-2 rounded bg-rose-500/15 hover:bg-rose-500/25 text-[10px] font-semibold text-rose-200 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Procedural 1920x1080 Backdrop Plate Generator */}
              <div className="p-2.5 rounded-lg bg-[#12192f] border border-cyan-400/25 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-semibold text-cyan-200 inline-flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Procedural Backdrop Studio (1080p)</span>
                  </div>
                  <button
                    type="button"
                    onClick={onCycleProcBackdropSeed}
                    title="Randomize composition seed"
                    className="h-6 px-2 rounded bg-[#1b2442] hover:bg-[#243058] border border-white/10 text-[10px] font-semibold text-[#d6dcf0] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>#{procBackdropSeed}</span>
                  </button>
                </div>
                <select
                  value={procBackdropTheme}
                  onChange={(e) => onChangeProcBackdropTheme(e.target.value as BackdropThemeId)}
                  className="w-full h-8 px-2 rounded bg-[#0c1020] border border-white/15 text-[11px] text-white"
                >
                  {BACKDROP_THEMES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label} — {t.vibe}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onGenerateProceduralBackdrop('scene')}
                    className="h-7 px-2 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/35 text-[10px] font-semibold text-cyan-100 inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Paint Scene {selectedBeatIdx + 1}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onGenerateProceduralBackdrop('act')}
                    className="h-7 px-2 rounded bg-[#1e2948] hover:bg-[#28365e] border border-white/15 text-[10px] font-semibold text-[#e2e8f5] inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Paint Current Act</span>
                  </button>
                </div>
              </div>

              {/* 4-Act Visual Progression Director */}
              <div className="p-2.5 rounded-lg bg-[#161529] border border-amber-400/25 space-y-2">
                <div className="text-[11px] font-semibold text-amber-200 inline-flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-300" />
                  <span>4-Act Visual Arc (Long-Form Variety)</span>
                </div>
                <select
                  value={actArcPreset}
                  onChange={(e) => onChangeActArcPreset(e.target.value as ActArcPresetId)}
                  className="w-full h-8 px-2 rounded bg-[#0c1020] border border-white/15 text-[11px] text-white"
                >
                  {ACT_ARC_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={onApplyActVisualArc}
                  className="w-full h-7 px-2.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-[10px] font-bold text-amber-100 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Apply 4-Act Mood, Weather &amp; Transitions ({episode.beats.length} Scenes)</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {STAGE_CATALOG.map((st) => {
                  const active = !selectedBeat?.customBackdropDataUrl && selectedBeat?.stage === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() =>
                        onUpdateSelectedBeat({
                          stage: st.id,
                          customBackdropDataUrl: undefined,
                          customBackdropLabel: undefined,
                        })
                      }
                      className={`p-2 rounded-lg text-left border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#1c2440] border-[#f2c85b]'
                          : 'bg-[#13182b] border-white/10 hover:border-[#f2c85b]/60'
                      }`}
                    >
                      <AssetThumb kind="stage" id={st.id} mood={selectedBeat?.mood} />
                      <div className="mt-1.5 text-xs font-semibold text-white truncate">{st.label}</div>
                      <div className="text-[10px] text-[#848da8] truncate">{st.useCase}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {assetCat === 'props' && (
            <div className="space-y-3">
              <div className="p-2.5 rounded-lg bg-[#12192f] border border-cyan-400/25 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-semibold text-cyan-200 inline-flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Procedural Prop Cutout (PNG)</span>
                  </div>
                  <button
                    type="button"
                    onClick={onCycleProcPropSeed}
                    className="h-6 px-2 rounded bg-[#1b2442] hover:bg-[#243058] border border-white/10 text-[10px] font-semibold text-[#d6dcf0] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>#{procPropSeed}</span>
                  </button>
                </div>
                <select
                  value={procPropPreset}
                  onChange={(e) => onChangeProcPropPreset(e.target.value as CustomPropPresetId)}
                  className="w-full h-8 px-2 rounded bg-[#0c1020] border border-white/15 text-[11px] text-white"
                >
                  {CUSTOM_PROP_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} — {p.note}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onGenerateProceduralProp}
                    className="flex-1 h-7 px-2 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/35 text-[10px] font-semibold text-cyan-100 inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Cutout for Scene {selectedBeatIdx + 1}</span>
                  </button>
                  {selectedBeat?.customPropDataUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSelectedBeat({
                          customPropDataUrl: undefined,
                          customPropLabel: undefined,
                        })
                      }
                      className="h-7 px-2 rounded bg-rose-500/15 hover:bg-rose-500/25 text-[10px] font-semibold text-rose-200 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {PROP_CATALOG.filter((p) => p.id !== 'none').map((p) => {
                  const active = !selectedBeat?.customPropDataUrl && selectedBeat?.prop === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        onUpdateSelectedBeat({
                          prop: p.id,
                          customPropDataUrl: undefined,
                          customPropLabel: undefined,
                        })
                      }
                      className={`p-2 rounded-lg text-left border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#1c2440] border-[#f2c85b]'
                          : 'bg-[#13182b] border-white/10 hover:border-[#f2c85b]/60'
                      }`}
                    >
                      <AssetThumb kind="prop" id={p.id} />
                      <div className="mt-1.5 text-xs font-semibold text-white truncate">{p.label}</div>
                      <div className="text-[10px] text-[#848da8] truncate">{p.note}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

WorkbenchAssetsTab.displayName = 'WorkbenchAssetsTab';
