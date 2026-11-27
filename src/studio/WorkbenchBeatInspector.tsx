import React from 'react';
import {
  Columns2,
  Copy,
  FlipHorizontal2,
  ImagePlus,
  Mic,
  Plus,
  Trash2,
  Upload,
  Volume2,
} from 'lucide-react';
import {
  AMBIENCE_CATALOG,
  AmbienceId,
  CAMERA_MOVE_CATALOG,
  CROWD_CATALOG,
  EXPRESSION_CATALOG,
  EpisodeScript,
  EpisodeVisualStyle,
  ExpressionId,
  ExpressionKeyframe,
  FRAME_CATALOG,
  FX_LIST,
  MOOD_CATALOG,
  MOTION_LIST,
  POSE_LIST,
  PROP_ANCHOR_CATALOG,
  PROP_CATALOG,
  PropAnchorId,
  RAAG_CATALOG,
  RENDER_STYLE_CATALOG,
  RenderStyleId,
  SFX_CATALOG,
  SHOT_CATALOG,
  STAGE_CATALOG,
  STUDIO_FPS,
  SfxId,
  StoryBeat,
  TRANSITION_CATALOG,
  WEATHER_LIST,
  computePhraseTriggerFrame,
} from './types';
import {
  EXPRESSION_COLORS,
  LISTENER_REACTION_LAG_FRAMES,
} from './emotionChoreographer';
import { BeatMotionAndCuesEditor } from './BeatMotionAndCuesEditor';
import { BeatWaveformBar } from './BeatWaveformBar';

export interface WorkbenchBeatInspectorProps {
  episode: EpisodeScript;
  selectedBeat: StoryBeat;
  selectedBeatIdx: number;
  activeBeatIdx: number;
  beatStarts: number[];
  currentTime: number;
  resolvedStyle: EpisodeVisualStyle;
  autoDuck: boolean;
  voiceMeta: Record<string, { fileName: string; duration: number }>;
  activeVoiceBuffer: AudioBuffer | null;
  batchVoiceFeedback: string | null;
  customPropInputRef: React.RefObject<HTMLInputElement | null>;
  onDuplicateSelectedBeat: () => void;
  onSplitSelectedBeat: () => void;
  onDeleteSelectedBeat: () => void;
  onUpdateSelectedBeat: (patch: Partial<StoryBeat>, historyLabel?: string) => void;
  onTriggerVoiceUpload: () => void;
  onTriggerBatchVoiceUpload: () => void;
  onClearVoiceClip: (beatId: string) => void;
  onScrubBeatLocalTime: (beatStart: number, localSec: number) => void;
  onAddActionCueOnWave: (frame: number) => void;
  onToggleAutoDuck: () => void;
  onPreviewSfx: (sfx: SfxId) => void;
  onCustomPropUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const WorkbenchBeatInspector: React.FC<WorkbenchBeatInspectorProps> = React.memo(
  ({
    episode,
    selectedBeat,
    selectedBeatIdx,
    activeBeatIdx,
    beatStarts,
    currentTime,
    resolvedStyle,
    autoDuck,
    voiceMeta,
    activeVoiceBuffer,
    batchVoiceFeedback,
    customPropInputRef,
    onDuplicateSelectedBeat,
    onSplitSelectedBeat,
    onDeleteSelectedBeat,
    onUpdateSelectedBeat,
    onTriggerVoiceUpload,
    onTriggerBatchVoiceUpload,
    onClearVoiceClip,
    onScrubBeatLocalTime,
    onAddActionCueOnWave,
    onToggleAutoDuck,
    onPreviewSfx,
    onCustomPropUpload,
  }) => {
    const beatStart = beatStarts[selectedBeatIdx] ?? 0;
    const beatLocalT =
      activeBeatIdx === selectedBeatIdx
        ? Math.max(0, Math.min(selectedBeat.duration, currentTime - beatStart))
        : 0;

    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#f2c85b]">
            Editing Scene {selectedBeatIdx + 1} of {episode.beats.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDuplicateSelectedBeat}
              title="Duplicate this scene immediately after it"
              className="text-[11px] text-[#b4bcd4] hover:text-[#f2c85b] inline-flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>Dup</span>
            </button>
            <button
              type="button"
              onClick={onSplitSelectedBeat}
              title="Split this scene cleanly at the dialogue midpoint into two cuts"
              className="text-[11px] text-[#b4bcd4] hover:text-[#f2c85b] inline-flex items-center gap-1 cursor-pointer"
            >
              <Columns2 className="w-3 h-3" />
              <span>Split</span>
            </button>
            {episode.beats.length > 1 && (
              <button
                type="button"
                onClick={onDeleteSelectedBeat}
                className="text-[11px] text-[#9aa3bd] hover:text-[#ff4d6d] inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>

        {/* Title + Duration */}
        <div className="grid grid-cols-3 gap-2.5">
          <label className="col-span-2 block">
            <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Scene Title</span>
            <input
              type="text"
              value={selectedBeat.title}
              onChange={(e) => onUpdateSelectedBeat({ title: e.target.value })}
              className="w-full h-9 px-2.5 rounded-md bg-[#14192b] border border-white/12 text-xs text-white focus:outline-none focus:border-[#f2c85b]"
            />
          </label>
          <label className="block">
            <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Duration (s)</span>
            <input
              type="number"
              min={1.5}
              max={18}
              step={0.2}
              value={selectedBeat.duration}
              onChange={(e) =>
                onUpdateSelectedBeat({
                  duration: Math.max(1.5, Math.min(18, Number(e.target.value) || 4)),
                })
              }
              className="w-full h-9 px-2.5 rounded-md bg-[#14192b] border border-white/12 text-xs font-mono-tabular text-white focus:outline-none focus:border-[#f2c85b]"
            />
          </label>
        </div>

        {/* Voiceover Audio Upload & Batch Auto-Bind */}
        <div className="p-3 rounded-lg bg-[#13182b] border border-white/10 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-white">Voiceover &amp; Lip-Sync</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onTriggerVoiceUpload}
                className="h-8 px-2.5 rounded-md bg-[#1f2947] hover:bg-[#2a365e] border border-[#f2c85b]/35 text-[11px] font-semibold text-[#f7e7bc] inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{voiceMeta[selectedBeat.id] ? 'Replace' : 'Scene Audio'}</span>
              </button>
              <button
                type="button"
                onClick={onTriggerBatchVoiceUpload}
                title="Select multiple numbered MP3/WAV files (01_..., 02_...) to auto-bind sequentially to every beat and auto-sync durations"
                className="h-8 px-2.5 rounded-md bg-[#161d36] hover:bg-[#222c4f] border border-white/15 text-[11px] font-semibold text-[#d6dcf0] inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Batch Bind</span>
              </button>
            </div>
          </div>
          {batchVoiceFeedback && (
            <div className="text-[11px] font-medium text-[#86efac]">{batchVoiceFeedback}</div>
          )}
          {voiceMeta[selectedBeat.id] ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#aeb6cc]">
                <span className="truncate">
                  {voiceMeta[selectedBeat.id].fileName} · {voiceMeta[selectedBeat.id].duration.toFixed(1)}s
                </span>
                <button
                  type="button"
                  onClick={() => onClearVoiceClip(selectedBeat.id)}
                  className="text-[#ff6b81] hover:underline ml-2 shrink-0 cursor-pointer"
                >
                  Clear
                </button>
              </div>
              {activeVoiceBuffer && (
                <BeatWaveformBar
                  audioBuffer={activeVoiceBuffer}
                  duration={selectedBeat.duration}
                  dialogue={selectedBeat.dialogue}
                  localT={beatLocalT}
                  sfxOffsetSec={selectedBeat.sfxOffsetSec ?? 0}
                  expressionCues={selectedBeat.expressionCues}
                  actionCues={selectedBeat.actionCues}
                  actors={selectedBeat.actors}
                  onSetSfxOffset={(sec) => onUpdateSelectedBeat({ sfxOffsetSec: sec })}
                  onScrubLocalTime={(sec) => onScrubBeatLocalTime(beatStart, sec)}
                  onAddActionCueAt={onAddActionCueOnWave}
                />
              )}
            </div>
          ) : (
            <p className="text-[11px] text-[#848da8] leading-relaxed">
              Upload one clip for this scene or Batch Bind numbered MP3/WAV files across the entire chapter to drive lip-sync &amp; auto-sync durations.
            </p>
          )}
        </div>

        {/* Speaker & Dialogue */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2.5">
            <label className="block">
              <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Active Speaker</span>
              <select
                value={selectedBeat.speakerId}
                onChange={(e) => {
                  const val = e.target.value;
                  const found = episode.cast.find((c) => c.id === val);
                  onUpdateSelectedBeat({
                    speakerId: val,
                    speakerLabel: found ? found.name : 'Narrator',
                  });
                }}
                className="w-full h-9 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
              >
                <option value="narrator">Narrator</option>
                {episode.cast.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-[#8e97b0]">Regional Score / Raag</span>
                <button
                  type="button"
                  onClick={onToggleAutoDuck}
                  title="Automatically duck music -10dB underneath dialogue & voiceovers"
                  className={`text-[10px] font-semibold cursor-pointer ${
                    autoDuck ? 'text-[#f2c85b]' : 'text-[#6c7694] line-through'
                  }`}
                >
                  Auto-Duck {autoDuck ? 'ON' : 'OFF'}
                </button>
              </div>
              <select
                value={selectedBeat.raag}
                onChange={(e) => onUpdateSelectedBeat({ raag: e.target.value as StoryBeat['raag'] })}
                className="w-full h-9 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
              >
                {RAAG_CATALOG.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Spoken Dialogue / Caption</span>
            <textarea
              rows={2}
              value={selectedBeat.dialogue}
              onChange={(e) => onUpdateSelectedBeat({ dialogue: e.target.value })}
              className="w-full p-2.5 rounded-md bg-[#14192b] border border-white/12 text-xs text-white leading-relaxed focus:outline-none focus:border-[#f2c85b] resize-none"
            />
          </label>
        </div>

        {/* Camera, Stage, Mood, Transition */}
        <div className="grid grid-cols-2 gap-2.5">
          <label className="block">
            <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Camera Shot</span>
            <select
              value={selectedBeat.shot}
              onChange={(e) => onUpdateSelectedBeat({ shot: e.target.value as StoryBeat['shot'] })}
              className="w-full h-9 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
            >
              {SHOT_CATALOG.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Transition</span>
            <select
              value={selectedBeat.transition}
              onChange={(e) =>
                onUpdateSelectedBeat({ transition: e.target.value as StoryBeat['transition'] })
              }
              className="w-full h-9 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
            >
              {TRANSITION_CATALOG.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tr.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Stage Backdrop</span>
            <select
              value={selectedBeat.stage}
              onChange={(e) => onUpdateSelectedBeat({ stage: e.target.value as StoryBeat['stage'] })}
              className="w-full h-9 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
            >
              {STAGE_CATALOG.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Lighting Mood</span>
            <select
              value={selectedBeat.mood}
              onChange={(e) => onUpdateSelectedBeat({ mood: e.target.value as StoryBeat['mood'] })}
              className="w-full h-9 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
            >
              {MOOD_CATALOG.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Story Prop</span>
            <select
              value={selectedBeat.prop}
              onChange={(e) => onUpdateSelectedBeat({ prop: e.target.value as StoryBeat['prop'] })}
              className="w-full h-9 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
            >
              {PROP_CATALOG.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Weather / FX</span>
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={selectedBeat.weather}
                onChange={(e) =>
                  onUpdateSelectedBeat({ weather: e.target.value as StoryBeat['weather'] })
                }
                className="w-full h-9 px-1.5 rounded-md bg-[#14192b] border border-white/12 text-[11px] text-white"
              >
                {WEATHER_LIST.map((wId) => (
                  <option key={wId} value={wId}>
                    {wId}
                  </option>
                ))}
              </select>
              <select
                value={selectedBeat.fx}
                onChange={(e) => onUpdateSelectedBeat({ fx: e.target.value as StoryBeat['fx'] })}
                className="w-full h-9 px-1.5 rounded-md bg-[#14192b] border border-white/12 text-[11px] text-white"
              >
                {FX_LIST.map((fId) => (
                  <option key={fId} value={fId}>
                    {fId}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="block">
            <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Prop Anchor</span>
            <select
              value={selectedBeat.propAnchor || 'stage'}
              disabled={selectedBeat.prop === 'none'}
              onChange={(e) =>
                onUpdateSelectedBeat({ propAnchor: e.target.value as PropAnchorId })
              }
              className="w-full h-9 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white disabled:opacity-45"
            >
              {PROP_ANCHOR_CATALOG.map((pa) => (
                <option key={pa.id} value={pa.id}>
                  {pa.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">
              Ambient Soundscape
            </span>
            <select
              value={selectedBeat.ambience || 'auto'}
              onChange={(e) =>
                onUpdateSelectedBeat({ ambience: e.target.value as AmbienceId })
              }
              className="w-full h-9 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
            >
              {AMBIENCE_CATALOG.map((amb) => (
                <option key={amb.id} value={amb.id}>
                  {amb.label}
                </option>
              ))}
            </select>
          </label>

          <div className="block col-span-2 space-y-1.5">
            <span className="block text-[11px] font-medium text-[#8e97b0]">
              Folklore SFX (Procedural Foley + Mid-Beat Delay)
            </span>
            <div className="flex items-center gap-1.5">
              <select
                value={selectedBeat.sfx || 'none'}
                onChange={(e) => onUpdateSelectedBeat({ sfx: e.target.value as SfxId })}
                className="flex-1 min-w-0 h-9 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
              >
                {SFX_CATALOG.map((fxItem) => (
                  <option key={fxItem.id} value={fxItem.id}>
                    {fxItem.label} — {fxItem.note}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                max={Number(Math.max(0, selectedBeat.duration - 0.2).toFixed(1))}
                step={0.1}
                disabled={!selectedBeat.sfx || selectedBeat.sfx === 'none'}
                value={selectedBeat.sfxOffsetSec ?? 0}
                onChange={(e) =>
                  onUpdateSelectedBeat({
                    sfxOffsetSec: Math.max(
                      0,
                      Math.min(
                        Math.max(0, selectedBeat.duration - 0.2),
                        Number(e.target.value) || 0
                      )
                    ),
                  })
                }
                title="Delay in seconds before firing SFX within this scene"
                className="w-16 h-9 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs font-mono-tabular text-white disabled:opacity-40"
              />
              <button
                type="button"
                disabled={!selectedBeat.sfx || selectedBeat.sfx === 'none'}
                onClick={() => onPreviewSfx(selectedBeat.sfx || 'none')}
                title="Audition procedural SFX"
                className="h-9 px-2.5 rounded-md bg-[#161d36] hover:bg-[#222c4f] disabled:opacity-40 border border-white/12 text-xs font-semibold text-[#f7e7bc] inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Test</span>
              </button>
            </div>
          </div>

          <div className="col-span-2">
            <BeatMotionAndCuesEditor
              beat={selectedBeat}
              cast={episode.cast}
              onUpdateBeat={onUpdateSelectedBeat}
              onPreviewSfx={onPreviewSfx}
            />
          </div>

          <label className="block">
            <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Narrative Frame</span>
            <select
              value={selectedBeat.frame || 'main'}
              onChange={(e) =>
                onUpdateSelectedBeat({ frame: e.target.value as StoryBeat['frame'] })
              }
              className="w-full h-9 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
            >
              {FRAME_CATALOG.map((fr) => (
                <option key={fr.id} value={fr.id}>
                  {fr.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Background Crowd</span>
            <select
              value={selectedBeat.crowd || 'none'}
              onChange={(e) =>
                onUpdateSelectedBeat({ crowd: e.target.value as StoryBeat['crowd'] })
              }
              className="w-full h-9 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
            >
              {CROWD_CATALOG.map((cr) => (
                <option key={cr.id} value={cr.id}>
                  {cr.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Camera Move</span>
            <select
              value={selectedBeat.cameraMove || 'still'}
              onChange={(e) =>
                onUpdateSelectedBeat({ cameraMove: e.target.value as StoryBeat['cameraMove'] })
              }
              className="w-full h-9 px-2 rounded-md bg-[#14192b] border border-white/12 text-xs text-white"
            >
              {CAMERA_MOVE_CATALOG.map((cm) => (
                <option key={cm.id} value={cm.id}>
                  {cm.label}
                </option>
              ))}
            </select>
          </label>

          <div className="block">
            <span className="block text-[11px] font-medium text-[#8e97b0] mb-1">Custom Cutout Prop</span>
            <input
              ref={customPropInputRef}
              type="file"
              accept="image/png,image/svg+xml,image/webp"
              onChange={onCustomPropUpload}
              className="hidden"
            />
            {selectedBeat.customPropDataUrl ? (
              <div className="h-9 px-2 rounded-md bg-[#19223d] border border-[#f2c85b]/45 flex items-center justify-between gap-1.5">
                <span className="text-[11px] text-[#f7e7bc] truncate">
                  {selectedBeat.customPropLabel || 'Custom PNG'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSelectedBeat({ customPropDataUrl: undefined, customPropLabel: undefined })
                  }
                  className="text-[11px] text-[#ff6b81] hover:underline shrink-0 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => customPropInputRef.current?.click()}
                className="w-full h-9 px-2.5 rounded-md bg-[#14192b] hover:bg-[#1c233c] border border-white/12 text-[11px] font-medium text-[#cfd6ea] inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <ImagePlus className="w-3.5 h-3.5 text-[#f2c85b]" />
                <span>Upload PNG / SVG</span>
              </button>
            )}
          </div>
        </div>

        {/* Stage Mirror, Haze & Backdrop Zoom */}
        <div className="p-3 rounded-lg bg-[#13182b] border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-[#aeb6cc]">
              Stage Mirror &amp; Atmosphere
            </span>
            <button
              type="button"
              onClick={() => onUpdateSelectedBeat({ flipStage: !selectedBeat.flipStage })}
              className={`h-7 px-2.5 rounded-md border text-[11px] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                selectedBeat.flipStage
                  ? 'bg-[#212b4a] border-[#f2c85b]/60 text-[#f7e7bc]'
                  : 'bg-[#0e1324] hover:bg-[#192038] border-white/12 text-[#b4bcd4]'
              }`}
            >
              <FlipHorizontal2 className="w-3.5 h-3.5" />
              <span>{selectedBeat.flipStage ? 'Mirrored' : 'Flip Stage'}</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="flex items-center justify-between text-[10px] text-[#8e97b0] mb-1">
                <span>Mist / Haze</span>
                <span className="font-mono-tabular text-[#d6dcf0]">
                  {Math.round((selectedBeat.haze ?? 0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={selectedBeat.haze ?? 0}
                onChange={(e) => onUpdateSelectedBeat({ haze: Number(e.target.value) })}
                className="w-full accent-[#f2c85b] cursor-pointer"
              />
            </label>
            <label className="block">
              <div className="flex items-center justify-between text-[10px] text-[#8e97b0] mb-1">
                <span>Stage Zoom</span>
                <span className="font-mono-tabular text-[#d6dcf0]">
                  {(selectedBeat.backdropZoom ?? 1).toFixed(2)}×
                </span>
              </div>
              <input
                type="range"
                min={0.9}
                max={1.25}
                step={0.05}
                value={selectedBeat.backdropZoom ?? 1}
                onChange={(e) => onUpdateSelectedBeat({ backdropZoom: Number(e.target.value) })}
                className="w-full accent-[#f2c85b] cursor-pointer"
              />
            </label>
          </div>

          {/* Per-Beat Art Engine Override */}
          <label className="block pt-1 border-t border-white/8">
            <span className="block text-[10px] font-medium text-[#8e97b0] mb-1">
              Scene Art Engine Override (Mid-Episode Style Cut)
            </span>
            <select
              value={selectedBeat.renderStyle || ''}
              onChange={(e) =>
                onUpdateSelectedBeat({
                  renderStyle: (e.target.value || undefined) as RenderStyleId | undefined,
                })
              }
              className="w-full h-8 px-2 rounded-md bg-[#0e1324] border border-white/12 text-[11px] text-white"
            >
              <option value="">
                Inherit Episode Engine (
                {RENDER_STYLE_CATALOG.find((r) => r.id === resolvedStyle.renderStyle)?.shortLabel ||
                  'Chiaroscuro'}
                )
              </option>
              {RENDER_STYLE_CATALOG.map((rs) => (
                <option key={rs.id} value={rs.id}>
                  Override: {rs.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Actor Blocking, Expressions & Motion */}
        <div className="space-y-2 pt-1 border-t border-white/10">
          <span className="block text-[11px] font-semibold text-[#aeb6cc]">
            Actor Blocking, Expressions &amp; Motion
          </span>
          {selectedBeat.actors.map((act, aIdx) => (
            <div
              key={aIdx}
              className="p-2.5 rounded-md bg-[#13182b] border border-white/8 grid grid-cols-2 gap-2"
            >
              <select
                value={act.castId}
                onChange={(e) => {
                  const next = selectedBeat.actors.map((a, i) =>
                    i === aIdx ? { ...a, castId: e.target.value } : a
                  );
                  onUpdateSelectedBeat({ actors: next });
                }}
                className="h-8 px-1.5 rounded bg-[#0c0f1b] border border-white/10 text-[11px] text-white"
              >
                {episode.cast.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={act.pose}
                onChange={(e) => {
                  const next = selectedBeat.actors.map((a, i) =>
                    i === aIdx ? { ...a, pose: e.target.value as StoryBeat['actors'][0]['pose'] } : a
                  );
                  onUpdateSelectedBeat({ actors: next });
                }}
                className="h-8 px-1.5 rounded bg-[#0c0f1b] border border-white/10 text-[11px] text-white"
              >
                {POSE_LIST.map((p) => (
                  <option key={p} value={p}>
                    pose: {p}
                  </option>
                ))}
              </select>

              <select
                value={act.expression}
                onChange={(e) => {
                  const next = selectedBeat.actors.map((a, i) =>
                    i === aIdx
                      ? { ...a, expression: e.target.value as ExpressionId }
                      : a
                  );
                  onUpdateSelectedBeat({ actors: next });
                }}
                className="h-8 px-1.5 rounded bg-[#0c0f1b] border border-white/10 text-[11px] text-white"
              >
                {EXPRESSION_CATALOG.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    face: {ex.label}
                  </option>
                ))}
              </select>

              <select
                value={act.motion || 'still'}
                onChange={(e) => {
                  const next = selectedBeat.actors.map((a, i) =>
                    i === aIdx
                      ? { ...a, motion: e.target.value as StoryBeat['actors'][0]['motion'] }
                      : a
                  );
                  onUpdateSelectedBeat({ actors: next });
                }}
                className="h-8 px-1.5 rounded bg-[#0c0f1b] border border-white/10 text-[11px] text-white"
              >
                {MOTION_LIST.map((mo) => (
                  <option key={mo} value={mo}>
                    move: {mo.replace('_', ' ')}
                  </option>
                ))}
              </select>

              {/* Per-Frame Expression Keyframes & Live Frame-Range Strip (60fps) */}
              {(() => {
                const totalBeatFrames = Math.max(1, Math.round(selectedBeat.duration * STUDIO_FPS));
                const isListenerActor =
                  selectedBeat.speakerId !== 'narrator' && selectedBeat.speakerId !== act.castId;
                const track = act.expressionTrack || [];
                const beatStartSec = beatStarts[selectedBeatIdx] ?? 0;
                const beatPlayPct =
                  activeBeatIdx === selectedBeatIdx
                    ? Math.max(
                        0,
                        Math.min(100, ((currentTime - beatStartSec) / Math.max(1.2, selectedBeat.duration)) * 100)
                      )
                    : null;

                const normalizedBars =
                  track.length > 0
                    ? track.map((kf, idx) => {
                        const startF =
                          kf.frame !== undefined
                            ? Math.round(kf.frame)
                            : kf.timeSec !== undefined
                              ? Math.round(kf.timeSec * STUDIO_FPS)
                              : Math.round((kf.at ?? 0) * totalBeatFrames);
                        const nextKf = track[idx + 1];
                        const nextStart = nextKf
                          ? nextKf.frame !== undefined
                            ? Math.round(nextKf.frame)
                            : nextKf.timeSec !== undefined
                              ? Math.round(nextKf.timeSec * STUDIO_FPS)
                              : Math.round((nextKf.at ?? 1) * totalBeatFrames)
                          : totalBeatFrames;
                        const endF = Math.min(totalBeatFrames, kf.endFrame ?? nextStart);
                        return {
                          startF: Math.max(0, startF),
                          endF: Math.max(startF + 1, endF),
                          expression: kf.expression,
                          reason: kf.reason,
                        };
                      })
                    : [{ startF: 0, endF: totalBeatFrames, expression: act.expression, reason: undefined }];

                return (
                  <div className="col-span-2 pt-1.5 border-t border-white/8 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-medium text-[#9aa5c4]">
                        Frame-Range Emotions (60fps · {totalBeatFrames}f ·{' '}
                        {isListenerActor ? 'Listener' : selectedBeat.speakerId === act.castId ? 'Speaker' : 'On Stage'})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const maxFrame = Math.max(0, totalBeatFrames - 1);
                          const lastFrame =
                            track.length > 0
                              ? (track[track.length - 1].frame ??
                                Math.round(
                                  (track[track.length - 1].timeSec ??
                                    (track[track.length - 1].at ?? 0) * selectedBeat.duration) *
                                    STUDIO_FPS
                                ))
                              : -45;
                          const nextFrame = Math.min(maxFrame, Math.max(0, lastFrame + 45));
                          const nextTrack: ExpressionKeyframe[] = [
                            ...track,
                            {
                              frame: nextFrame,
                              endFrame: totalBeatFrames,
                              expression: act.expression === 'calm' ? 'curious' : 'calm',
                            },
                          ];
                          const next = selectedBeat.actors.map((a, i) =>
                            i === aIdx ? { ...a, expressionTrack: nextTrack } : a
                          );
                          onUpdateSelectedBeat({ actors: next });
                        }}
                        className="h-5 px-1.5 rounded bg-[#1d2540] hover:bg-[#2a355c] border border-[#c084fc]/35 text-[10px] font-semibold text-[#e9d5ff] inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Frame Cue</span>
                      </button>
                    </div>

                    {/* Live Color-Coded Frame-Range Strip */}
                    <div
                      className="relative h-4 rounded bg-[#0a0d18] border border-white/10 overflow-hidden flex"
                      title="Color-coded 60fps emotion ranges across this beat"
                    >
                      {normalizedBars.map((seg, sIdx) => {
                        const leftPct = (seg.startF / totalBeatFrames) * 100;
                        const widthPct = Math.max(4, ((seg.endF - seg.startF) / totalBeatFrames) * 100);
                        return (
                          <div
                            key={sIdx}
                            style={{
                              position: 'absolute',
                              left: `${leftPct}%`,
                              width: `${Math.min(100 - leftPct, widthPct)}%`,
                              backgroundColor: EXPRESSION_COLORS[seg.expression] || '#64748b',
                            }}
                            className="h-full border-r border-[#0a0d18]/70 px-1 flex items-center overflow-hidden"
                            title={`f${seg.startF}–f${seg.endF}: ${seg.expression}${seg.reason ? ` (${seg.reason})` : ''}`}
                          >
                            <span className="text-[9px] font-bold text-[#090c14] truncate leading-none">
                              {seg.expression}
                            </span>
                          </div>
                        );
                      })}
                      {beatPlayPct !== null && (
                        <div
                          style={{ left: `${beatPlayPct}%` }}
                          className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_6px_#fff] pointer-events-none"
                        />
                      )}
                    </div>

                    {track.length > 0 && (
                      <div className="space-y-1.5">
                        {track.map((kf, kfIdx) => {
                          const frameVal =
                            kf.frame !== undefined
                              ? Math.round(kf.frame)
                              : kf.timeSec !== undefined
                                ? Math.round(kf.timeSec * STUDIO_FPS)
                                : Math.round((kf.at ?? 0) * totalBeatFrames);
                          const nextKf = track[kfIdx + 1];
                          const inferredEnd = nextKf
                            ? nextKf.frame !== undefined
                              ? Math.round(nextKf.frame)
                              : totalBeatFrames
                            : totalBeatFrames;
                          const endFrameVal = Math.min(totalBeatFrames, kf.endFrame ?? inferredEnd);

                          return (
                            <div
                              key={kfIdx}
                              className="p-1.5 rounded bg-[#0c0f1b] border border-white/8 space-y-1"
                            >
                              <div className="flex items-center gap-1">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: EXPRESSION_COLORS[kf.expression] || '#64748b' }}
                                />
                                <span className="text-[10px] text-[#7f8aa8] font-mono">f</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={totalBeatFrames}
                                  step={5}
                                  value={frameVal}
                                  onChange={(e) => {
                                    const f = Math.max(0, Math.round(Number(e.target.value) || 0));
                                    const nextTrack = track.map((item, j) =>
                                      j === kfIdx ? { ...item, frame: f } : item
                                    );
                                    const next = selectedBeat.actors.map((a, i) =>
                                      i === aIdx ? { ...a, expressionTrack: nextTrack } : a
                                    );
                                    onUpdateSelectedBeat({ actors: next });
                                  }}
                                  className="w-12 h-6 px-1 rounded bg-[#13182b] border border-white/10 text-[10px] text-white font-mono"
                                  title="Start frame (60fps)"
                                />
                                <span className="text-[10px] text-[#6f7894]">–</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={totalBeatFrames}
                                  step={5}
                                  value={endFrameVal}
                                  onChange={(e) => {
                                    const ef = Math.max(
                                      frameVal + 1,
                                      Math.min(totalBeatFrames, Math.round(Number(e.target.value) || totalBeatFrames))
                                    );
                                    const nextTrack = track.map((item, j) =>
                                      j === kfIdx ? { ...item, frame: frameVal, endFrame: ef } : item
                                    );
                                    const next = selectedBeat.actors.map((a, i) =>
                                      i === aIdx ? { ...a, expressionTrack: nextTrack } : a
                                    );
                                    onUpdateSelectedBeat({ actors: next });
                                  }}
                                  className="w-12 h-6 px-1 rounded bg-[#13182b] border border-white/10 text-[10px] text-[#b4bcd4] font-mono"
                                  title="End frame (60fps)"
                                />
                                <select
                                  value={kf.expression}
                                  onChange={(e) => {
                                    const nextTrack = track.map((item, j) =>
                                      j === kfIdx
                                        ? { ...item, frame: frameVal, expression: e.target.value as ExpressionId }
                                        : item
                                    );
                                    const next = selectedBeat.actors.map((a, i) =>
                                      i === aIdx ? { ...a, expressionTrack: nextTrack } : a
                                    );
                                    onUpdateSelectedBeat({ actors: next });
                                  }}
                                  className="flex-1 min-w-0 h-6 px-1 rounded bg-[#13182b] border border-white/10 text-[10px] text-white"
                                >
                                  {EXPRESSION_CATALOG.map((ex) => (
                                    <option key={ex.id} value={ex.id}>
                                      {ex.label}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextTrack = track.filter((_, j) => j !== kfIdx);
                                    const next = selectedBeat.actors.map((a, i) =>
                                      i === aIdx
                                        ? { ...a, expressionTrack: nextTrack.length > 0 ? nextTrack : undefined }
                                        : a
                                    );
                                    onUpdateSelectedBeat({ actors: next });
                                  }}
                                  className="h-6 w-6 shrink-0 rounded bg-[#1a1f33] hover:bg-[#3a1f2d] text-[#9aa5c4] hover:text-[#fda4af] inline-flex items-center justify-center cursor-pointer"
                                  title="Remove frame cue"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={kf.triggerPhrase || ''}
                                  placeholder="on words (auto-aligns frame)..."
                                  onChange={(e) => {
                                    const phrase = e.target.value;
                                    const aligned = phrase.trim()
                                      ? computePhraseTriggerFrame(
                                          selectedBeat.dialogue,
                                          phrase,
                                          selectedBeat.duration,
                                          isListenerActor ? LISTENER_REACTION_LAG_FRAMES : 0
                                        )
                                      : null;
                                    const nextTrack = track.map((item, j) =>
                                      j === kfIdx
                                        ? {
                                            ...item,
                                            triggerPhrase: phrase || undefined,
                                            ...(aligned !== null ? { frame: aligned } : {}),
                                          }
                                        : item
                                    );
                                    const next = selectedBeat.actors.map((a, i) =>
                                      i === aIdx ? { ...a, expressionTrack: nextTrack } : a
                                    );
                                    onUpdateSelectedBeat({ actors: next });
                                  }}
                                  className="w-1/2 h-5 px-1.5 rounded bg-[#13182b] border border-white/8 text-[9px] text-[#bae6fd] placeholder:text-[#5c6582]"
                                  title="Spoken words from this beat's dialogue that trigger this shift (auto-aligns frame & stays synced when TTS duration changes!)"
                                />
                                <input
                                  type="text"
                                  value={kf.reason || ''}
                                  placeholder="subtext / why..."
                                  onChange={(e) => {
                                    const nextTrack = track.map((item, j) =>
                                      j === kfIdx ? { ...item, reason: e.target.value || undefined } : item
                                    );
                                    const next = selectedBeat.actors.map((a, i) =>
                                      i === aIdx ? { ...a, expressionTrack: nextTrack } : a
                                    );
                                    onUpdateSelectedBeat({ actors: next });
                                  }}
                                  className="w-1/2 h-5 px-1.5 rounded bg-[#13182b] border border-white/8 text-[9px] text-[#d8b4fe] placeholder:text-[#5c6582]"
                                  title="Why the character feels this emotion in these frames"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

WorkbenchBeatInspector.displayName = 'WorkbenchBeatInspector';
