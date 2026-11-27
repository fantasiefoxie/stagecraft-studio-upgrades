import React, { useRef, useState } from 'react';
import {
  Copy,
  Download,
  Focus,
  ImagePlus,
  Meh,
  Plus,
  Save,
  Smile,
  Subtitles,
  Trash2,
  Upload,
  Volume2,
} from 'lucide-react';
import {
  ARCHETYPE_DEFAULT_COLORS,
  CAPTION_STYLE_CATALOG,
  CAST_HEADGEAR_CATALOG,
  CAST_MARK_CATALOG,
  COLOR_GRADE_CATALOG,
  CastMember,
  DEFAULT_VISUAL_STYLE,
  EpisodeScript,
  EpisodeVisualStyle,
  FRAME_BORDER_CATALOG,
  LOOK_PRESETS,
  MotionCadenceId,
  MotionProfileId,
  PostFxPassId,
  RIM_LIGHT_CATALOG,
  RenderStyleId,
  TEXTURE_CATALOG,
} from './types';
import { ChannelBrandKit, WatermarkCorner } from './brandKit';
import { AssetThumb } from './AssetThumb';
import { StyleEngineSwatchPicker } from './StyleEngineSwatchPicker';
import {
  LookLabRecipe,
  createLookRecipe,
  duplicateLookRecipe,
  exportLookRecipesJson,
  importLookRecipesJson,
  loadLookRecipes,
  mergeLookRecipes,
  saveLookRecipes,
} from './lookPresets';

export interface WorkbenchLookTabProps {
  episode: EpisodeScript;
  selectedBeatIdx: number;
  resolvedStyle: EpisodeVisualStyle;
  expressionsEnabled: boolean;
  brandKit: ChannelBrandKit;
  brandLogoInputRef: React.RefObject<HTMLInputElement | null>;
  onSelectRenderStyle: (style: RenderStyleId) => void;
  onSelectMotionCadence: (cadence: MotionCadenceId) => void;
  onSelectMotionProfile: (profile: MotionProfileId) => void;
  onSelectPostFxPass: (pass: PostFxPassId) => void;
  onPolishAnimationPrinciples: () => void;
  onMatchShelfStyle: () => void;
  onAutoStyleNestedFlashbacks: () => void;
  onApplyLookPreset: (style: EpisodeVisualStyle) => void;
  onUpdateVisualStyle: (patch: Partial<EpisodeVisualStyle>) => void;
  onUpdateBrandKit: (patch: Partial<ChannelBrandKit>) => void;
  onBrandLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenWorkshopForNewEntity: () => void;
  onEditCastMemberWorkshop: (member: CastMember) => void;
  onUpdateCastMember: (castId: string, patch: Partial<CastMember>) => void;
}

export const WorkbenchLookTab: React.FC<WorkbenchLookTabProps> = React.memo(
  ({
    episode,
    selectedBeatIdx,
    resolvedStyle,
    expressionsEnabled,
    brandKit,
    brandLogoInputRef,
    onSelectRenderStyle,
    onSelectMotionCadence,
    onSelectMotionProfile,
    onSelectPostFxPass,
    onPolishAnimationPrinciples,
    onMatchShelfStyle,
    onAutoStyleNestedFlashbacks,
    onApplyLookPreset,
    onUpdateVisualStyle,
    onUpdateBrandKit,
    onBrandLogoUpload,
    onOpenWorkshopForNewEntity,
    onEditCastMemberWorkshop,
    onUpdateCastMember,
  }) => {
    const [savedLooks, setSavedLooks] = useState<LookLabRecipe[]>(() => loadLookRecipes());
    const [newLookName, setNewLookName] = useState('');
    const [lookNotice, setLookNotice] = useState<string | null>(null);
    const lookImportInputRef = useRef<HTMLInputElement | null>(null);

    const handleSaveCurrentLook = () => {
      const name = newLookName.trim() || `${episode.series || 'Series'} Look ${savedLooks.length + 1}`;
      const recipe = createLookRecipe(name, resolvedStyle);
      const next = saveLookRecipes([recipe, ...savedLooks]);
      setSavedLooks(next);
      setNewLookName('');
      setLookNotice(`Saved "${recipe.name}"`);
    };

    const handleDuplicateLook = (recipe: LookLabRecipe) => {
      const dup = duplicateLookRecipe(recipe);
      const next = saveLookRecipes([dup, ...savedLooks]);
      setSavedLooks(next);
      setLookNotice(`Duplicated "${dup.name}"`);
    };

    const handleDeleteLook = (id: string) => {
      const next = saveLookRecipes(savedLooks.filter((r) => r.id !== id));
      setSavedLooks(next);
    };

    const handleExportLooks = () => {
      const json = exportLookRecipesJson(savedLooks);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'stagecraft_look_recipes.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      setLookNotice(`Exported ${savedLooks.length} recipe(s).`);
    };

    const handleImportLooksFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      try {
        const txt = await file.text();
        const res = importLookRecipesJson(txt);
        if (!res.ok) {
          setLookNotice(res.error);
          return;
        }
        const merged = saveLookRecipes(mergeLookRecipes(savedLooks, res.recipes));
        setSavedLooks(merged);
        setLookNotice(`Imported ${res.recipes.length} look recipe(s).`);
      } catch {
        setLookNotice('Failed to read JSON file.');
      }
    };

    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* 20 Multi-Genre Deterministic Animation Art Engines */}
        <div className="space-y-3">
          <StyleEngineSwatchPicker
            episode={episode}
            selectedBeatIdx={selectedBeatIdx}
            activeRenderStyle={resolvedStyle.renderStyle}
            activeMotionCadence={resolvedStyle.motionCadence || 'auto'}
            activeMotionProfile={resolvedStyle.motionProfile || 'auto'}
            activePostFxPass={resolvedStyle.postFxPass || 'none'}
            onSelectStyle={onSelectRenderStyle}
            onSelectCadence={onSelectMotionCadence}
            onSelectMotionProfile={onSelectMotionProfile}
            onSelectPostFxPass={onSelectPostFxPass}
            onPolishAnimationPrinciples={onPolishAnimationPrinciples}
            onMatchShelfStyle={onMatchShelfStyle}
          />

          {episode.beats.some((b) => b.frame === 'nested_story') && (
            <button
              type="button"
              onClick={onAutoStyleNestedFlashbacks}
              className="w-full h-8 px-2.5 rounded-md bg-[#161c33] hover:bg-[#1f2847] border border-white/10 text-[11px] font-medium text-[#d6dcf0] cursor-pointer transition-colors"
            >
              Auto-style Nested Flashback Scenes as Shadow Puppetry
            </button>
          )}
        </div>

        {/* 1-Click Series Look Presets */}
        <div className="space-y-2 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-white">Series Look Presets</span>
            <button
              type="button"
              onClick={() => onApplyLookPreset(DEFAULT_VISUAL_STYLE)}
              className="text-[11px] text-[#9aa3bd] hover:text-white cursor-pointer"
            >
              Reset Defaults
            </button>
          </div>
          <div className="space-y-1.5">
            {LOOK_PRESETS.map((preset) => {
              const active = resolvedStyle.lookPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onApplyLookPreset(preset.style)}
                  className={`w-full px-3 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#1c2440] border-[#f2c85b]'
                      : 'bg-[#13182b] border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-semibold ${active ? 'text-[#f2c85b]' : 'text-white'}`}>
                      {preset.label}
                    </span>
                    {preset.id === 'classic_chiaroscuro' && (
                      <span className="text-[10px] text-[#8e97b0]">Default</span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#848da8] mt-0.5">{preset.note}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fine-Tune Visual Finish Knobs */}
        <div className="space-y-3 pt-3 border-t border-white/10">
          <span className="block text-xs font-semibold text-white">Visual Finish &amp; Framing</span>
          <div className="grid grid-cols-2 gap-2.5">
            <label className="block">
              <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Color Grade</span>
              <select
                value={resolvedStyle.colorGrade}
                onChange={(e) =>
                  onUpdateVisualStyle({ colorGrade: e.target.value as EpisodeVisualStyle['colorGrade'] })
                }
                className="w-full h-9 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
              >
                {COLOR_GRADE_CATALOG.map((cg) => (
                  <option key={cg.id} value={cg.id}>
                    {cg.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Surface Texture</span>
              <select
                value={resolvedStyle.texture}
                onChange={(e) =>
                  onUpdateVisualStyle({ texture: e.target.value as EpisodeVisualStyle['texture'] })
                }
                className="w-full h-9 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
              >
                {TEXTURE_CATALOG.map((tx) => (
                  <option key={tx.id} value={tx.id}>
                    {tx.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Rim Light Tint</span>
              <select
                value={resolvedStyle.rimLight}
                onChange={(e) =>
                  onUpdateVisualStyle({ rimLight: e.target.value as EpisodeVisualStyle['rimLight'] })
                }
                className="w-full h-9 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
              >
                {RIM_LIGHT_CATALOG.map((rl) => (
                  <option key={rl.id} value={rl.id}>
                    {rl.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Caption Style</span>
              <select
                value={resolvedStyle.captionStyle}
                onChange={(e) =>
                  onUpdateVisualStyle({
                    captionStyle: e.target.value as EpisodeVisualStyle['captionStyle'],
                  })
                }
                className="w-full h-9 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
              >
                {CAPTION_STYLE_CATALOG.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    {cs.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="col-span-2 block">
              <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Frame Chrome</span>
              <select
                value={resolvedStyle.frameBorder}
                onChange={(e) =>
                  onUpdateVisualStyle({
                    frameBorder: e.target.value as EpisodeVisualStyle['frameBorder'],
                  })
                }
                className="w-full h-9 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
              >
                {FRAME_BORDER_CATALOG.map((fb) => (
                  <option key={fb.id} value={fb.id}>
                    {fb.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="col-span-2 flex items-center justify-between gap-2 p-2.5 rounded-md bg-[#14192b] border border-white/10">
              <div>
                <div className="text-[11px] font-semibold text-white">Episode Facial Expressions</div>
                <div className="text-[10px] text-[#8e97b0]">
                  {!expressionsEnabled
                    ? 'Overridden to Neutral by system-wide toolbar toggle'
                    : resolvedStyle.expressionsEnabled !== false
                      ? 'Per-character & per-frame FACS facial acting active'
                      : 'Serene neutral faces (keeps blinking & lip-sync)'}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateVisualStyle({
                    expressionsEnabled: !(resolvedStyle.expressionsEnabled !== false),
                  })
                }
                className={`h-7 px-2.5 rounded border text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer ${
                  resolvedStyle.expressionsEnabled !== false && expressionsEnabled
                    ? 'bg-[#251f3d] border-[#c084fc]/45 text-[#f3e8ff]'
                    : 'bg-[#0e1324] border-white/12 text-[#8e97b0]'
                }`}
              >
                {resolvedStyle.expressionsEnabled !== false ? (
                  <Smile className="w-3.5 h-3.5" />
                ) : (
                  <Meh className="w-3.5 h-3.5" />
                )}
                <span>{resolvedStyle.expressionsEnabled !== false ? 'On' : 'Neutral'}</span>
              </button>
            </div>

            {/* Word-by-Word Kinetic Karaoke Captions Toggle */}
            <div className="col-span-2 flex items-center justify-between gap-2 p-2.5 rounded-md bg-[#14192b] border border-white/10">
              <div>
                <div className="text-[11px] font-semibold text-white">Kinetic Karaoke Captions</div>
                <div className="text-[10px] text-[#8e97b0]">
                  {resolvedStyle.karaokeCaptions !== false
                    ? 'Highlights each spoken word in sync (Latin, Indic, RTL & CJK)'
                    : 'Classic static full-line subtitles'}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateVisualStyle({
                    karaokeCaptions: !(resolvedStyle.karaokeCaptions !== false),
                  })
                }
                className={`h-7 px-2.5 rounded border text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer ${
                  resolvedStyle.karaokeCaptions !== false
                    ? 'bg-[#2a2315] border-[#f2c85b]/50 text-[#f2c85b]'
                    : 'bg-[#0e1324] border-white/12 text-[#8e97b0]'
                }`}
              >
                <Subtitles className="w-3.5 h-3.5" />
                <span>{resolvedStyle.karaokeCaptions !== false ? 'Karaoke' : 'Static'}</span>
              </button>
            </div>

            {/* 9:16 Auto-Track Speaker Framing Toggle */}
            <div className="col-span-2 flex items-center justify-between gap-2 p-2.5 rounded-md bg-[#14192b] border border-white/10">
              <div>
                <div className="text-[11px] font-semibold text-white">9:16 Auto-Track Speaker</div>
                <div className="text-[10px] text-[#8e97b0]">
                  {resolvedStyle.autoTrackSpeaker !== false
                    ? 'Smoothly pans vertical Shorts framing toward the active speaker'
                    : 'Static center crop in 9:16 unless overridden per-scene'}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateVisualStyle({
                    autoTrackSpeaker: !(resolvedStyle.autoTrackSpeaker !== false),
                  })
                }
                className={`h-7 px-2.5 rounded border text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer ${
                  resolvedStyle.autoTrackSpeaker !== false
                    ? 'bg-[#122633] border-[#38bdf8]/50 text-[#7dd3fc]'
                    : 'bg-[#0e1324] border-white/12 text-[#8e97b0]'
                }`}
              >
                <Focus className="w-3.5 h-3.5" />
                <span>{resolvedStyle.autoTrackSpeaker !== false ? 'Track' : 'Off'}</span>
              </button>
            </div>
          </div>

          {/* Channel Brand Kit & Watermark */}
          <div className="p-3 rounded-lg bg-[#13182b] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#f2c85b]">
                Channel Brand Kit &amp; Watermark
              </span>
              <button
                type="button"
                onClick={() => onUpdateBrandKit({ showWatermark: !brandKit.showWatermark })}
                className={`h-6 px-2 rounded border text-[10px] font-semibold cursor-pointer ${
                  brandKit.showWatermark
                    ? 'bg-[#2a2315] border-[#f2c85b]/60 text-[#f2c85b]'
                    : 'bg-[#0e1324] border-white/12 text-[#8e97b0]'
                }`}
              >
                {brandKit.showWatermark ? 'Watermark ON' : 'Watermark OFF'}
              </button>
            </div>

            <input
              ref={brandLogoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={onBrandLogoUpload}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={brandKit.channelName}
                onChange={(e) => onUpdateBrandKit({ channelName: e.target.value })}
                placeholder="Channel Name..."
                className="h-8 px-2 rounded bg-[#0c0f1b] border border-white/10 text-[11px] text-white"
              />
              <select
                value={brandKit.logoCorner}
                onChange={(e) =>
                  onUpdateBrandKit({ logoCorner: e.target.value as WatermarkCorner })
                }
                className="h-8 px-2 rounded bg-[#0c0f1b] border border-white/10 text-[11px] text-white"
              >
                <option value="top_right">Top Right</option>
                <option value="top_left">Top Left</option>
                <option value="bottom_right">Bottom Right</option>
                <option value="bottom_left">Bottom Left</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => brandLogoInputRef.current?.click()}
                className="flex-1 h-8 px-2.5 rounded bg-[#1b233d] hover:bg-[#253052] border border-white/12 text-[11px] font-semibold text-[#eef1f8] inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ImagePlus className="w-3.5 h-3.5 text-[#f2c85b]" />
                <span>{brandKit.logoDataUrl ? 'Replace Logo PNG' : 'Upload Logo PNG'}</span>
              </button>
              {brandKit.logoDataUrl && (
                <button
                  type="button"
                  onClick={() => onUpdateBrandKit({ logoDataUrl: undefined })}
                  className="h-8 px-2.5 rounded bg-rose-500/15 hover:bg-rose-500/25 text-[10px] font-semibold text-rose-200 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <label className="block">
              <div className="flex items-center justify-between text-[10px] text-[#9aa3bd] mb-0.5">
                <span>Watermark Opacity</span>
                <span className="font-mono-tabular text-white">
                  {Math.round(brandKit.logoOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.15}
                max={1}
                step={0.05}
                value={brandKit.logoOpacity}
                onChange={(e) => onUpdateBrandKit({ logoOpacity: Number(e.target.value) })}
                className="w-full accent-[#f2c85b] cursor-pointer"
              />
            </label>
          </div>

          {/* Contrast, Ink Weight & Vignette Sliders */}
          <div className="p-3 rounded-lg bg-[#13182b] border border-white/10 space-y-2.5">
            <label className="block">
              <div className="flex items-center justify-between text-[11px] text-[#9aa3bd] mb-1">
                <span>Shadow Contrast</span>
                <span className="font-mono-tabular text-white">
                  {resolvedStyle.shadowContrast.toFixed(2)}×
                </span>
              </div>
              <input
                type="range"
                min={0.6}
                max={1.4}
                step={0.04}
                value={resolvedStyle.shadowContrast}
                onChange={(e) => onUpdateVisualStyle({ shadowContrast: Number(e.target.value) })}
                className="w-full accent-[#f2c85b] cursor-pointer"
              />
            </label>

            <label className="block">
              <div className="flex items-center justify-between text-[11px] text-[#9aa3bd] mb-1">
                <span>Ink Panel Weight</span>
                <span className="font-mono-tabular text-white">
                  {resolvedStyle.inkWeight.toFixed(2)}×
                </span>
              </div>
              <input
                type="range"
                min={0.7}
                max={1.5}
                step={0.05}
                value={resolvedStyle.inkWeight}
                onChange={(e) => onUpdateVisualStyle({ inkWeight: Number(e.target.value) })}
                className="w-full accent-[#f2c85b] cursor-pointer"
              />
            </label>

            <label className="block">
              <div className="flex items-center justify-between text-[11px] text-[#9aa3bd] mb-1">
                <span>Vignette Depth</span>
                <span className="font-mono-tabular text-white">
                  {Math.round(resolvedStyle.vignette * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={resolvedStyle.vignette}
                onChange={(e) => onUpdateVisualStyle({ vignette: Number(e.target.value) })}
                className="w-full accent-[#f2c85b] cursor-pointer"
              />
            </label>

            {/* Upgrade 3: 2.5D Multi-Plane Depth-of-Field / Rack Focus */}
            <label className="block">
              <div className="flex items-center justify-between text-[11px] text-[#9aa3bd] mb-1">
                <span>2.5D Depth of Field (Rack Focus)</span>
                <span className="font-mono-tabular text-white">
                  {Math.round((resolvedStyle.depthOfField ?? 0.35) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={resolvedStyle.depthOfField ?? 0.35}
                onChange={(e) => onUpdateVisualStyle({ depthOfField: Number(e.target.value) })}
                className="w-full accent-[#38bdf8] cursor-pointer"
              />
            </label>

            {/* Upgrade 11: Volumetric Light Shafts & Stage Rim Atmosphere */}
            <label className="block">
              <div className="flex items-center justify-between text-[11px] text-[#9aa3bd] mb-1">
                <span>Volumetric Light Shafts &amp; Dust Motes</span>
                <span className="font-mono-tabular text-white">
                  {Math.round((resolvedStyle.lightShafts ?? 0.4) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={resolvedStyle.lightShafts ?? 0.4}
                onChange={(e) => onUpdateVisualStyle({ lightShafts: Number(e.target.value) })}
                className="w-full accent-[#f2c85b] cursor-pointer"
              />
            </label>

            {/* Upgrade 2: Deterministic Stereo Spatial Audio & Room Acoustics */}
            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/8">
              <div>
                <div className="text-[11px] font-semibold text-white">
                  Stereo Spatial Audio &amp; Room Acoustics
                </div>
                <div className="text-[10px] text-[#848da8]">
                  Left/Right stage panning + temple/cave/outdoor acoustics
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateVisualStyle({
                    spatialAudio: !(resolvedStyle.spatialAudio !== false),
                  })
                }
                className={`h-7 px-2.5 rounded border text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer ${
                  resolvedStyle.spatialAudio !== false
                    ? 'bg-[#122633] border-[#38bdf8]/50 text-[#7dd3fc]'
                    : 'bg-[#0e1324] border-white/12 text-[#8e97b0]'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{resolvedStyle.spatialAudio !== false ? 'Spatial' : 'Mono'}</span>
              </button>
            </div>
          </div>

          {/* Upgrade 9: Custom "Look Lab" Series Recipe Presets */}
          <div className="p-3 rounded-lg bg-[#13182b] border border-[#f2c85b]/25 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#f2c85b]">
                Saved Looks ({savedLooks.length})
              </span>
              <div className="flex items-center gap-1">
                <input
                  ref={lookImportInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImportLooksFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => lookImportInputRef.current?.click()}
                  className="h-6 px-2 rounded bg-[#1b233d] hover:bg-[#253052] border border-white/10 text-[10px] font-semibold text-[#dce4f7] inline-flex items-center gap-1 cursor-pointer"
                  title="Import Look Recipes JSON"
                >
                  <Upload className="w-3 h-3" />
                  <span>Import</span>
                </button>
                <button
                  type="button"
                  disabled={savedLooks.length === 0}
                  onClick={handleExportLooks}
                  className="h-6 px-2 rounded bg-[#1b233d] hover:bg-[#253052] disabled:opacity-40 border border-white/10 text-[10px] font-semibold text-[#dce4f7] inline-flex items-center gap-1 cursor-pointer"
                  title="Export Look Recipes JSON"
                >
                  <Download className="w-3 h-3" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={newLookName}
                onChange={(e) => setNewLookName(e.target.value)}
                placeholder="Name current look recipe..."
                className="flex-1 min-w-0 h-7 px-2 rounded bg-[#0c0f1b] border border-white/10 text-[11px] text-white"
              />
              <button
                type="button"
                onClick={handleSaveCurrentLook}
                className="h-7 px-2.5 rounded bg-[#f2c85b] hover:bg-[#f7d577] text-[#110e0a] text-[10px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Save className="w-3 h-3" />
                <span>Save Look</span>
              </button>
            </div>

            {lookNotice && (
              <div className="text-[10px] text-emerald-300">{lookNotice}</div>
            )}

            {savedLooks.length === 0 ? (
              <div className="text-[10px] text-[#848da8]">
                Save your current art engine, color grade, rim light, post-FX, cadence, DoF &amp; captions as a reusable Series Look.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                {savedLooks.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="flex items-center justify-between gap-1.5 px-2 py-1.5 rounded bg-[#0c1020] border border-white/8"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateVisualStyle({ ...recipe.style });
                        setLookNotice(`Applied "${recipe.name}"`);
                      }}
                      className="flex-1 min-w-0 text-left cursor-pointer"
                      title="Click to apply this Series Look recipe"
                    >
                      <div className="text-[11px] font-semibold text-white truncate">
                        {recipe.name}
                      </div>
                      <div className="text-[9px] text-[#8e97b0] truncate">
                        {recipe.style.renderStyle} · {recipe.style.colorGrade} · DoF{' '}
                        {Math.round(recipe.style.depthOfField * 100)}%
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicateLook(recipe)}
                      className="p-1 rounded text-[#9aa3bd] hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
                      title="Duplicate recipe"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLook(recipe.id)}
                      className="p-1 rounded text-[#9aa3bd] hover:text-rose-300 hover:bg-rose-500/15 cursor-pointer shrink-0"
                      title="Delete recipe"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cast Wardrobe, Tilak, Headgear & Scale Customizer */}
        <div className="space-y-2.5 pt-3 border-t border-white/10">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="block text-xs font-semibold text-white">Cast Wardrobe &amp; Entity DNA</span>
              <p className="text-[11px] text-[#848da8] mt-0.5">
                Sculpt humans, animals, creatures &amp; spirits from scratch or fine-tune colors and scale.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenWorkshopForNewEntity}
              className="h-7 px-2.5 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] text-[#110e0a] text-[11px] font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Entity</span>
            </button>
          </div>
          {episode.cast.map((member) => {
            const defColors =
              ARCHETYPE_DEFAULT_COLORS[member.archetype] || ARCHETYPE_DEFAULT_COLORS.king;
            return (
              <div
                key={member.id}
                className="p-3 rounded-lg bg-[#13182b] border border-white/10 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AssetThumb
                      kind="member"
                      id={member.id}
                      member={member}
                      className="w-12 h-9 rounded bg-[#080b16] border border-white/10 shrink-0 block object-cover"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{member.name}</div>
                      <div className="text-[10px] text-[#8e97b0] truncate">
                        {member.dna
                          ? `DNA · ${member.dna.chassis} · ${member.dna.head.headShape.replace(/_/g, ' ')}`
                          : member.archetype.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEditCastMemberWorkshop(member)}
                    className="h-7 px-2.5 rounded-md bg-[#1d2642] hover:bg-[#27345a] border border-[#f2c85b]/35 text-[10px] font-semibold text-[#f2c85b] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Workshop
                  </button>
                </div>

                {/* 3 Native Color Pickers: Garment | Accent | Skin/Fur */}
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-1.5 px-2 h-8 rounded bg-[#0c0f1b] border border-white/10 cursor-pointer">
                    <input
                      type="color"
                      value={member.primaryColor}
                      onChange={(e) => onUpdateCastMember(member.id, { primaryColor: e.target.value })}
                      className="w-4 h-4 bg-transparent border-0 p-0 cursor-pointer"
                    />
                    <span className="text-[10px] text-[#c5cde0]">Garment</span>
                  </label>
                  <label className="flex items-center gap-1.5 px-2 h-8 rounded bg-[#0c0f1b] border border-white/10 cursor-pointer">
                    <input
                      type="color"
                      value={member.accentColor}
                      onChange={(e) => onUpdateCastMember(member.id, { accentColor: e.target.value })}
                      className="w-4 h-4 bg-transparent border-0 p-0 cursor-pointer"
                    />
                    <span className="text-[10px] text-[#c5cde0]">Accent</span>
                  </label>
                  <label className="flex items-center gap-1.5 px-2 h-8 rounded bg-[#0c0f1b] border border-white/10 cursor-pointer">
                    <input
                      type="color"
                      value={member.skinColor || defColors.skin || '#e09a6e'}
                      onChange={(e) => onUpdateCastMember(member.id, { skinColor: e.target.value })}
                      className="w-4 h-4 bg-transparent border-0 p-0 cursor-pointer"
                    />
                    <span className="text-[10px] text-[#c5cde0]">Skin/Fur</span>
                  </label>
                </div>

                {/* Mark + Headgear Overrides */}
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={member.mark || 'default'}
                    onChange={(e) =>
                      onUpdateCastMember(member.id, { mark: e.target.value as CastMember['mark'] })
                    }
                    className="h-8 px-1.5 rounded bg-[#0c0f1b] border border-white/10 text-[11px] text-white"
                  >
                    {CAST_MARK_CATALOG.map((mk) => (
                      <option key={mk.id} value={mk.id}>
                        {mk.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={member.headgear || 'default'}
                    onChange={(e) =>
                      onUpdateCastMember(member.id, {
                        headgear: e.target.value as CastMember['headgear'],
                      })
                    }
                    className="h-8 px-1.5 rounded bg-[#0c0f1b] border border-white/10 text-[11px] text-white"
                  >
                    {CAST_HEADGEAR_CATALOG.map((hg) => (
                      <option key={hg.id} value={hg.id}>
                        {hg.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actor Build / Scale Slider */}
                <label className="block">
                  <div className="flex items-center justify-between text-[10px] text-[#8e97b0] mb-0.5">
                    <span>Character Build / Scale</span>
                    <span className="font-mono-tabular text-[#d6dcf0]">
                      {(member.scale ?? 1.0).toFixed(2)}×
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.82}
                    max={1.25}
                    step={0.03}
                    value={member.scale ?? 1.0}
                    onChange={(e) => onUpdateCastMember(member.id, { scale: Number(e.target.value) })}
                    className="w-full accent-[#f2c85b] cursor-pointer"
                  />
                </label>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

WorkbenchLookTab.displayName = 'WorkbenchLookTab';
