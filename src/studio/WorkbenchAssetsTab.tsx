import React, { useMemo, useState } from 'react';
import {
  ImagePlus,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import {
  ARCHETYPE_CATALOG,
  ArchetypeGroup,
  ArchetypeId,
  EpisodeScript,
  PROP_CATALOG,
  PropId,
  STAGE_CATALOG,
  StageId,
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
import {
  SPRITE_PRESET_CATEGORIES,
  SPRITE_WORKSHOP_PRESETS,
  SpritePresetCategory,
  SpriteWorkshopPreset,
  buildCastMemberFromSpritePreset,
} from './spriteWorkshopPresets';
import { AssetThumb } from './AssetThumb';

export type AssetCatalogTab = 'cast' | 'stages' | 'props';

const ALL_ARCHETYPE_GROUPS: readonly ArchetypeGroup[] = [
  'Epic & Divine',
  'Royalty & Folk',
  'Fable Fauna',
  'World Legends',
  'Modern & Sci-Fi',
  'Fantasy & Creatures',
];

const MODERN_SCIFI_STAGES = new Set<StageId>([
  'neon_cyber_alley',
  'orbital_starship_bridge',
  'mars_colony_dome',
  'noir_rainy_street',
  'modern_news_studio',
  'cozy_bookshop_cafe',
  'high_tech_lab',
  'courtroom_hall',
  'vintage_train_car',
]);

const FANTASY_HISTORIC_STAGES = new Set<StageId>([
  'ancient_egypt_temple',
  'roman_colosseum',
  'nordic_fjord_hall',
  'gothic_cathedral',
  'steampunk_clocktower',
  'pirate_galleon_deck',
  'underwater_atlantis',
  'volcanic_citadel',
  'snowy_mountain_pass',
  'cherry_blossom_shrine',
  'astral_observatory',
]);

const MODERN_SCIFI_PROPS = new Set<PropId>([
  'magnifying_glass',
  'holo_tablet',
  'energy_blade',
  'neon_drone',
  'vintage_camera',
  'microphone_stand',
  'briefcase',
  'newspaper_frontpage',
  'coffee_mug',
  'laptop_screen',
  'electric_guitar',
  'golden_trophy',
  'judge_gavel',
  'microscope',
  'rocket_model',
]);

const FANTASY_MAGIC_PROPS = new Set<PropId>([
  'potion_flask',
  'spellbook_tome',
  'wizard_staff',
  'crystal_amulet',
  'brass_compass',
  'antique_pocketwatch',
  'violin_bow',
  'pirate_map',
  'key_ornate',
  'treasure_chest',
]);

type StageCategoryFilter = 'All' | 'Modern & Sci-Fi' | 'Fantasy & Historic' | 'Folklore & World';
type PropCategoryFilter = 'All' | 'Modern & Sci-Fi' | 'Fantasy & Magic' | 'Folklore & Historic';
type CastCategoryFilter = 'All' | 'Quick Sprites' | ArchetypeGroup;

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
  onAddSpritePresetToEpisode?: (preset: SpriteWorkshopPreset) => void;
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
    onAddSpritePresetToEpisode,
    onUpdateSelectedBeat,
  }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [castFilter, setCastFilter] = useState<CastCategoryFilter>('All');
    const [spriteGenre, setSpriteGenre] = useState<'All' | SpritePresetCategory>('All');
    const [stageFilter, setStageFilter] = useState<StageCategoryFilter>('All');
    const [propFilter, setPropFilter] = useState<PropCategoryFilter>('All');

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredSpritePresets = useMemo(() => {
      return SPRITE_WORKSHOP_PRESETS.filter((p) => {
        if (spriteGenre !== 'All' && p.category !== spriteGenre) return false;
        if (!normalizedQuery) return true;
        return (
          p.name.toLowerCase().includes(normalizedQuery) ||
          p.tagline.toLowerCase().includes(normalizedQuery) ||
          p.category.toLowerCase().includes(normalizedQuery) ||
          p.archetype.toLowerCase().includes(normalizedQuery)
        );
      });
    }, [spriteGenre, normalizedQuery]);

    const filteredArchetypesByGroup = useMemo(() => {
      const groupsToShow =
        castFilter === 'All'
          ? ALL_ARCHETYPE_GROUPS
          : castFilter === 'Quick Sprites'
          ? []
          : [castFilter];
      return groupsToShow
        .map((group) => ({
          group,
          items: ARCHETYPE_CATALOG.filter((a) => {
            if (a.group !== group) return false;
            if (!normalizedQuery) return true;
            return (
              a.label.toLowerCase().includes(normalizedQuery) ||
              a.stories.toLowerCase().includes(normalizedQuery) ||
              a.id.toLowerCase().includes(normalizedQuery) ||
              a.group.toLowerCase().includes(normalizedQuery)
            );
          }),
        }))
        .filter((g) => g.items.length > 0);
    }, [castFilter, normalizedQuery]);

    const filteredStages = useMemo(() => {
      return STAGE_CATALOG.filter((st) => {
        if (stageFilter === 'Modern & Sci-Fi' && !MODERN_SCIFI_STAGES.has(st.id)) return false;
        if (stageFilter === 'Fantasy & Historic' && !FANTASY_HISTORIC_STAGES.has(st.id))
          return false;
        if (
          stageFilter === 'Folklore & World' &&
          (MODERN_SCIFI_STAGES.has(st.id) || FANTASY_HISTORIC_STAGES.has(st.id))
        ) {
          return false;
        }
        if (!normalizedQuery) return true;
        return (
          st.label.toLowerCase().includes(normalizedQuery) ||
          st.useCase.toLowerCase().includes(normalizedQuery) ||
          st.id.toLowerCase().includes(normalizedQuery)
        );
      });
    }, [stageFilter, normalizedQuery]);

    const filteredProps = useMemo(() => {
      return PROP_CATALOG.filter((p) => {
        if (p.id === 'none') return false;
        if (propFilter === 'Modern & Sci-Fi' && !MODERN_SCIFI_PROPS.has(p.id)) return false;
        if (propFilter === 'Fantasy & Magic' && !FANTASY_MAGIC_PROPS.has(p.id)) return false;
        if (
          propFilter === 'Folklore & Historic' &&
          (MODERN_SCIFI_PROPS.has(p.id) || FANTASY_MAGIC_PROPS.has(p.id))
        ) {
          return false;
        }
        if (!normalizedQuery) return true;
        return (
          p.label.toLowerCase().includes(normalizedQuery) ||
          p.note.toLowerCase().includes(normalizedQuery) ||
          p.id.toLowerCase().includes(normalizedQuery)
        );
      });
    }, [propFilter, normalizedQuery]);

    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-3 border-b border-white/10 space-y-2 shrink-0">
          <div className="flex items-center gap-1.5">
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

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#7f89a6] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                assetCat === 'cast'
                  ? 'Search 60 archetypes & 32 DNA sprites...'
                  : assetCat === 'stages'
                  ? 'Search 50 stages (cyber, mars, shrine, temple...)'
                  : 'Search 64 story props (blade, laptop, potion...)'
              }
              className="w-full h-8 pl-8 pr-7 rounded-md bg-[#111629] border border-white/12 text-xs text-white placeholder:text-[#6f7894] focus:outline-none focus:border-[#f2c85b]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8e97b0] hover:text-white cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
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
                    Open Entity DNA Workshop (6 chassis · 32 curated presets · morph sliders)
                  </div>
                </div>
                <Plus className="w-4 h-4 text-[#f2c85b] shrink-0" />
              </button>

              {/* Category filter strip */}
              <div className="flex flex-wrap gap-1">
                {(['All', 'Quick Sprites', ...ALL_ARCHETYPE_GROUPS] as const).map((cat) => {
                  const active = castFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCastFilter(cat)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#1c2440] border-[#f2c85b] text-[#f2c85b]'
                          : 'bg-[#13182b] border-white/10 text-[#9aa3bd] hover:text-white'
                      }`}
                    >
                      {cat === 'Quick Sprites'
                        ? `Quick Sprites (${SPRITE_WORKSHOP_PRESETS.length})`
                        : cat}
                    </button>
                  );
                })}
              </div>

              {/* Quick Sprite DNA Gallery (32 curated multi-genre sprites) */}
              {(castFilter === 'Quick Sprites' ||
                (castFilter === 'All' && normalizedQuery.length > 0)) && (
                <div className="space-y-2.5 p-2.5 rounded-lg bg-[#11172a] border border-cyan-400/20">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                      Quick Sprite DNA Gallery ({filteredSpritePresets.length})
                    </div>
                    <span className="text-[9px] text-[#848da8]">1-click spawn</span>
                  </div>

                  {castFilter === 'Quick Sprites' && (
                    <div className="flex flex-wrap gap-1">
                      {(['All', ...SPRITE_PRESET_CATEGORIES] as const).map((genre) => (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => setSpriteGenre(genre)}
                          className={`px-2 py-0.5 rounded text-[9px] font-semibold border cursor-pointer ${
                            spriteGenre === genre
                              ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                              : 'bg-[#13182b] border-white/10 text-[#8e97b0] hover:text-white'
                          }`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  )}

                  {filteredSpritePresets.length === 0 ? (
                    <div className="text-[11px] text-[#848da8] py-2">
                      No sprite presets match &ldquo;{searchQuery}&rdquo;.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {filteredSpritePresets.map((preset) => {
                        const thumbMember = buildCastMemberFromSpritePreset(preset, 0);
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              if (onAddSpritePresetToEpisode) {
                                onAddSpritePresetToEpisode(preset);
                              } else {
                                onAddArchetypeToEpisode(preset.archetype, preset.name);
                              }
                            }}
                            className="p-2 rounded-lg bg-[#13182b] border border-white/10 hover:border-cyan-400/60 text-left transition-colors cursor-pointer"
                          >
                            <AssetThumb
                              kind="member"
                              id={thumbMember.id}
                              member={thumbMember}
                              mood={selectedBeat?.mood}
                            />
                            <div className="mt-1.5 text-xs font-semibold text-white truncate">
                              {preset.name}
                            </div>
                            <div className="text-[10px] text-[#848da8] truncate">
                              {preset.tagline}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Quick access card to open 32-Sprite Gallery when viewing All without search */}
              {castFilter === 'All' && !normalizedQuery && (
                <button
                  type="button"
                  onClick={() => setCastFilter('Quick Sprites')}
                  className="w-full p-2.5 rounded-lg bg-[#11192e] hover:bg-[#17223f] border border-cyan-400/30 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-cyan-200 inline-flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                      <span>Quick Sprite DNA Gallery ({SPRITE_WORKSHOP_PRESETS.length} Multi-Genre Sprites)</span>
                    </div>
                    <div className="text-[10px] text-[#8e97b0] mt-0.5 truncate">
                      Sci-Fi, Noir, Fantasy RPG, Modern Explainer, History &amp; Creatures — 1-click spawn
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-cyan-300 shrink-0">Browse</span>
                </button>
              )}

              {/* Archetype groups */}
              {filteredArchetypesByGroup.map(({ group, items }) => (
                <div key={group}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#f2c85b]/80">
                      {group}
                    </span>
                    <span className="text-[10px] font-mono-tabular text-[#6f7894]">
                      {items.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {items.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => onAddArchetypeToEpisode(a.id, a.label)}
                        className="p-2 rounded-lg bg-[#13182b] border border-white/10 hover:border-[#f2c85b]/60 text-left transition-colors cursor-pointer"
                      >
                        <AssetThumb kind="archetype" id={a.id} mood={selectedBeat?.mood} />
                        <div className="mt-1.5 text-xs font-semibold text-white truncate">
                          {a.label}
                        </div>
                        <div className="text-[10px] text-[#848da8] truncate">{a.stories}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {castFilter !== 'Quick Sprites' && filteredArchetypesByGroup.length === 0 && (
                <div className="text-xs text-[#848da8] py-4 text-center">
                  No cast archetypes match &ldquo;{searchQuery}&rdquo;.
                </div>
              )}
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
                    <span>Procedural Backdrop Studio ({BACKDROP_THEMES.length} Themes)</span>
                  </div>
                  <button
                    type="button"
                    onClick={onCycleProcBackdropSeed}
                    title="Cycle composition seed"
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
                  <span>4-Act Visual Arc ({ACT_ARC_PRESETS.length} Presets)</span>
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

              {/* Stage category filter strip */}
              <div className="flex flex-wrap gap-1">
                {(['All', 'Modern & Sci-Fi', 'Fantasy & Historic', 'Folklore & World'] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setStageFilter(cat)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                        stageFilter === cat
                          ? 'bg-[#1c2440] border-[#f2c85b] text-[#f2c85b]'
                          : 'bg-[#13182b] border-white/10 text-[#9aa3bd] hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>

              {filteredStages.length === 0 ? (
                <div className="text-xs text-[#848da8] py-4 text-center">
                  No stages match &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredStages.map((st) => {
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
                        <div className="mt-1.5 text-xs font-semibold text-white truncate">
                          {st.label}
                        </div>
                        <div className="text-[10px] text-[#848da8] truncate">{st.useCase}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {assetCat === 'props' && (
            <div className="space-y-3">
              <div className="p-2.5 rounded-lg bg-[#12192f] border border-cyan-400/25 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-semibold text-cyan-200 inline-flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Procedural Prop Cutout ({CUSTOM_PROP_PRESETS.length} Presets)</span>
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

              {/* Prop category filter strip */}
              <div className="flex flex-wrap gap-1">
                {(['All', 'Modern & Sci-Fi', 'Fantasy & Magic', 'Folklore & Historic'] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setPropFilter(cat)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                        propFilter === cat
                          ? 'bg-[#1c2440] border-[#f2c85b] text-[#f2c85b]'
                          : 'bg-[#13182b] border-white/10 text-[#9aa3bd] hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>

              {filteredProps.length === 0 ? (
                <div className="text-xs text-[#848da8] py-4 text-center">
                  No story props match &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredProps.map((p) => {
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
                        <div className="mt-1.5 text-xs font-semibold text-white truncate">
                          {p.label}
                        </div>
                        <div className="text-[10px] text-[#848da8] truncate">{p.note}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

WorkbenchAssetsTab.displayName = 'WorkbenchAssetsTab';
