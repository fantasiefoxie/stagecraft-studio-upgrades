import React, { useState } from 'react';
import { Plus, Trash2, Sparkles, Volume2, ChevronDown, ChevronRight, Zap } from 'lucide-react';
import {
  BeatActionCue,
  CastMember,
  FX_LIST,
  FxId,
  MOTION_LIST,
  MotionCardConfig,
  MotionCardLayoutId,
  MotionId,
  POSE_LIST,
  PoseId,
  SFX_CATALOG,
  SfxId,
  STUDIO_FPS,
  StoryBeat,
} from './types';
import {
  ACTING_MACRO_CATALOG,
  ActingMacroId,
  applyActingMacroToBeat,
} from './actingMacros';
import { CameraCurveMiniEditor } from './CameraCurveMiniEditor';

interface BeatMotionAndCuesEditorProps {
  beat: StoryBeat;
  cast: CastMember[];
  onUpdateBeat: (patch: Partial<StoryBeat>, historyLabel?: string) => void;
  onPreviewSfx: (sfx: SfxId) => void;
}

const MOTION_CARD_LAYOUTS: Array<{ id: MotionCardLayoutId; label: string }> = [
  { id: 'hero_stat', label: 'Hero Stat' },
  { id: 'split_callout', label: 'Split Callout' },
  { id: 'morph_bar', label: 'Morph Bar' },
];

export const BeatMotionAndCuesEditor: React.FC<BeatMotionAndCuesEditorProps> = React.memo(
  ({ beat, cast, onUpdateBeat, onPreviewSfx }) => {
    const cues = beat.actionCues || [];
    const [cuesExpanded, setCuesExpanded] = useState(cues.length > 0);
    const [selectedMacroId, setSelectedMacroId] = useState<ActingMacroId>('dramatic_realization');
    const isMotionCard = beat.shot === 'motion_card';
    const mc: MotionCardConfig = beat.motionCard || {};
    const maxBeatFrames = Math.max(1, Math.round(Math.max(1.2, beat.duration) * STUDIO_FPS));

    const updateMotionCard = (patch: Partial<MotionCardConfig>) => {
      const next: MotionCardConfig = { ...mc, ...patch };
      onUpdateBeat({ motionCard: next }, 'Edit Motion Card');
    };

    const handleAutoFillMotionCard = () => {
      const dialogue = (beat.dialogue || '').trim();
      const statMatch = dialogue.match(/\b(\d+(?:[.,]\d+)?(?:\s?%|\s?[xXkKmMbB]\b)?)/);
      const parts = dialogue
        .split(/[.;—–]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 2);
      onUpdateBeat(
        {
          shot: 'motion_card',
          motionCard: {
            layout: statMatch ? 'hero_stat' : parts.length >= 2 ? 'split_callout' : 'morph_bar',
            kicker: (beat.title || 'KEY INSIGHT').toUpperCase().slice(0, 36),
            headline: (parts[0] || beat.title || 'Kinetic Headline').slice(0, 72),
            metric: statMatch ? statMatch[1].trim() : mc.metric || '100%',
            metricUnit: statMatch ? 'MEASURED' : mc.metricUnit || 'IMPACT',
            bullets: parts.length >= 2 ? parts.slice(1, 4) : mc.bullets || ['Clear takeaway #1', 'Clear takeaway #2'],
            highlightBar: (parts[parts.length - 1] || dialogue || beat.title).slice(0, 60),
            accentColor: mc.accentColor,
          },
        },
        'Auto-fill Motion Card'
      );
    };

    const updateCue = (idx: number, patch: Partial<BeatActionCue>) => {
      const next = cues.map((item, i) => (i === idx ? { ...item, ...patch } : item));
      onUpdateBeat({ actionCues: next }, 'Edit Action Cue');
    };

    const handleAddCue = () => {
      const defaultCastId =
        beat.speakerId !== 'narrator' && beat.actors.some((a) => a.castId === beat.speakerId)
          ? beat.speakerId
          : beat.actors[0]?.castId || cast[0]?.id;
      const midFrame = Math.min(maxBeatFrames - 10, Math.max(15, Math.round(maxBeatFrames * 0.45)));
      const newCue: BeatActionCue = {
        frame: midFrame,
        ...(defaultCastId ? { castId: defaultCastId } : {}),
        cameraPunch: 0.55,
        label: `Cue ${cues.length + 1}`,
      };
      onUpdateBeat({ actionCues: [...cues, newCue] }, 'Add Action Cue');
      setCuesExpanded(true);
    };

    const handleRemoveCue = (idx: number) => {
      const next = cues.filter((_, i) => i !== idx);
      onUpdateBeat({ actionCues: next.length > 0 ? next : undefined }, 'Remove Action Cue');
    };

    const focusX = typeof beat.cameraFocusX === 'number' && Number.isFinite(beat.cameraFocusX) ? beat.cameraFocusX : 0;
    const focusY = typeof beat.cameraFocusY === 'number' && Number.isFinite(beat.cameraFocusY) ? beat.cameraFocusY : 0;
    const hasCustomFocus = Math.abs(focusX) > 0.001 || Math.abs(focusY) > 0.001;

    return (
      <div className="space-y-3 pt-2 border-t border-white/10">
        {/* 0. Per-Beat Camera Focus Framing Nudge (overrides 9:16 Auto-Track Speaker when non-zero) */}
        <div className="rounded-lg bg-[#111526] border border-white/10 p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-white">
              Camera Focus Framing{' '}
              <span className="text-[10px] font-normal text-[#8e97b0]">
                ({hasCustomFocus ? 'Manual Override' : 'Auto-Track Speaker in 9:16'})
              </span>
            </span>
            {hasCustomFocus && (
              <button
                type="button"
                onClick={() =>
                  onUpdateBeat(
                    { cameraFocusX: undefined, cameraFocusY: undefined },
                    'Reset Camera Focus'
                  )
                }
                className="h-5 px-2 rounded bg-[#1b233d] hover:bg-[#253052] border border-white/10 text-[10px] font-semibold text-[#f2c85b] cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <label className="block">
              <span className="flex justify-between text-[9px] text-[#8e97b0]">
                <span>Focus X (Left / Right)</span>
                <span className="font-mono text-white">
                  {focusX === 0 ? 'Auto' : `${focusX > 0 ? '+' : ''}${Math.round(focusX * 100)}%`}
                </span>
              </span>
              <input
                type="range"
                min={-0.45}
                max={0.45}
                step={0.03}
                value={focusX}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onUpdateBeat(
                    { cameraFocusX: Math.abs(v) < 0.01 ? undefined : Number(v.toFixed(2)) },
                    'Adjust Camera Focus X'
                  );
                }}
                className="w-full accent-[#f2c85b] cursor-pointer"
              />
            </label>
            <label className="block">
              <span className="flex justify-between text-[9px] text-[#8e97b0]">
                <span>Focus Y (Up / Down)</span>
                <span className="font-mono text-white">
                  {focusY === 0 ? 'Auto' : `${focusY > 0 ? '+' : ''}${Math.round(focusY * 100)}%`}
                </span>
              </span>
              <input
                type="range"
                min={-0.3}
                max={0.3}
                step={0.03}
                value={focusY}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onUpdateBeat(
                    { cameraFocusY: Math.abs(v) < 0.01 ? undefined : Number(v.toFixed(2)) },
                    'Adjust Camera Focus Y'
                  );
                }}
                className="w-full accent-[#f2c85b] cursor-pointer"
              />
            </label>
          </div>

          {/* Per-beat Audio Cut Overlap (J-Cut / L-Cut) */}
          <div className="pt-2 border-t border-white/8 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold text-[#dbe2f4]">
                Audio Cut Overlap{' '}
                <span className="text-[9px] font-normal text-[#8e97b0]">
                  ({(beat.audioLeadSec ?? 0) > 0.01
                    ? `J-Cut +${(beat.audioLeadSec ?? 0).toFixed(2)}s pre-roll`
                    : (beat.audioLeadSec ?? 0) < -0.01
                      ? `L-Cut ${(beat.audioLeadSec ?? 0).toFixed(2)}s delay`
                      : 'Hard Cut 0.00s'})
                </span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onUpdateBeat({ audioLeadSec: 0.3 }, 'Set J-Cut (+0.3s)')}
                  className={`h-5 px-1.5 rounded text-[9px] font-semibold border cursor-pointer ${
                    (beat.audioLeadSec ?? 0) > 0.05
                      ? 'bg-[#2a2315] border-[#f2c85b] text-[#f2c85b]'
                      : 'bg-[#161c30] border-white/10 text-[#9aa3bd] hover:text-white'
                  }`}
                  title="J-Cut: start this scene's voice 0.30s before the visual cut"
                >
                  J-Cut
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateBeat({ audioLeadSec: undefined }, 'Reset Hard Cut')}
                  className={`h-5 px-1.5 rounded text-[9px] font-semibold border cursor-pointer ${
                    Math.abs(beat.audioLeadSec ?? 0) <= 0.02
                      ? 'bg-[#1f2947] border-white/30 text-white'
                      : 'bg-[#161c30] border-white/10 text-[#9aa3bd] hover:text-white'
                  }`}
                >
                  Hard
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateBeat({ audioLeadSec: -0.3 }, 'Set L-Cut (-0.3s)')}
                  className={`h-5 px-1.5 rounded text-[9px] font-semibold border cursor-pointer ${
                    (beat.audioLeadSec ?? 0) < -0.05
                      ? 'bg-[#132030] border-[#38bdf8] text-[#bae6fd]'
                      : 'bg-[#161c30] border-white/10 text-[#9aa3bd] hover:text-white'
                  }`}
                  title="L-Cut: hold visuals 0.30s before voice begins"
                >
                  L-Cut
                </button>
              </div>
            </div>
            <input
              type="range"
              min={-0.5}
              max={0.5}
              step={0.05}
              value={beat.audioLeadSec ?? 0}
              onChange={(e) => {
                const v = Number(e.target.value);
                onUpdateBeat(
                  { audioLeadSec: Math.abs(v) < 0.02 ? undefined : Number(v.toFixed(2)) },
                  'Adjust J-Cut / L-Cut Overlap'
                );
              }}
              className="w-full accent-[#38bdf8] cursor-pointer"
            />
          </div>
        </div>

        {/* 1. Kinetic Motion-Graphics Card Editor (active when shot === 'motion_card') */}
        {isMotionCard ? (
          <div className="rounded-lg bg-[#11162a] border border-[#f2c85b]/35 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#f2c85b]" />
                <span className="text-[11px] font-bold text-[#f2c85b]">
                  Kinetic Motion Card
                </span>
              </div>
              <button
                type="button"
                onClick={handleAutoFillMotionCard}
                className="h-6 px-2 rounded bg-[#1b2442] hover:bg-[#253159] border border-white/10 text-[10px] font-semibold text-[#eef1f8] cursor-pointer"
                title="Populate card headline, metric & bullets from this scene's dialogue"
              >
                Fill from Dialogue
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1">
              {MOTION_CARD_LAYOUTS.map((l) => {
                const active = (mc.layout || 'hero_stat') === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => updateMotionCard({ layout: l.id })}
                    className={`h-7 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#2a2315] border-[#f2c85b] text-[#f2c85b]'
                        : 'bg-[#14192b] border-white/10 text-[#9aa3bd] hover:text-white'
                    }`}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="block text-[10px] text-[#8e97b0] mb-0.5">Kicker</span>
                <input
                  type="text"
                  value={mc.kicker || ''}
                  placeholder="KEY INSIGHT"
                  onChange={(e) => updateMotionCard({ kicker: e.target.value || undefined })}
                  className="w-full h-8 px-2 rounded bg-[#14192b] border border-white/12 text-[11px] text-white"
                />
              </label>
              <label className="block">
                <span className="block text-[10px] text-[#8e97b0] mb-0.5">Accent Color</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={mc.accentColor || '#f2c85b'}
                    onChange={(e) => updateMotionCard({ accentColor: e.target.value })}
                    className="h-8 w-9 rounded bg-transparent border border-white/12 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={mc.accentColor || ''}
                    placeholder="Auto"
                    onChange={(e) =>
                      updateMotionCard({
                        accentColor: /^#[0-9a-fA-F]{3,8}$/.test(e.target.value.trim())
                          ? e.target.value.trim()
                          : e.target.value === ''
                            ? undefined
                            : mc.accentColor,
                      })
                    }
                    className="w-full h-8 px-2 rounded bg-[#14192b] border border-white/12 text-[11px] font-mono text-white"
                  />
                </div>
              </label>
            </div>

            <label className="block">
              <span className="block text-[10px] text-[#8e97b0] mb-0.5">Headline</span>
              <input
                type="text"
                value={mc.headline || ''}
                placeholder={beat.title}
                onChange={(e) => updateMotionCard({ headline: e.target.value || undefined })}
                className="w-full h-8 px-2 rounded bg-[#14192b] border border-white/12 text-[11px] text-white"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="block text-[10px] text-[#8e97b0] mb-0.5">Metric / Stat</span>
                <input
                  type="text"
                  value={mc.metric || ''}
                  placeholder="99.9%"
                  onChange={(e) => updateMotionCard({ metric: e.target.value || undefined })}
                  className="w-full h-8 px-2 rounded bg-[#14192b] border border-white/12 text-[11px] font-mono text-white"
                />
              </label>
              <label className="block">
                <span className="block text-[10px] text-[#8e97b0] mb-0.5">Metric Unit</span>
                <input
                  type="text"
                  value={mc.metricUnit || ''}
                  placeholder="TUNNEL PROBABILITY"
                  onChange={(e) => updateMotionCard({ metricUnit: e.target.value || undefined })}
                  className="w-full h-8 px-2 rounded bg-[#14192b] border border-white/12 text-[11px] text-white"
                />
              </label>
            </div>

            <label className="block">
              <span className="block text-[10px] text-[#8e97b0] mb-0.5">
                Bullets (one per line, up to 4)
              </span>
              <textarea
                rows={2}
                value={(mc.bullets || []).join('\n')}
                placeholder="Bullet 1&#10;Bullet 2"
                onChange={(e) => {
                  const lines = e.target.value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .slice(0, 4);
                  updateMotionCard({ bullets: lines.length > 0 ? lines : undefined });
                }}
                className="w-full p-2 rounded bg-[#14192b] border border-white/12 text-[11px] text-white resize-none"
              />
            </label>

            <label className="block">
              <span className="block text-[10px] text-[#8e97b0] mb-0.5">Highlight / Prompt Bar</span>
              <input
                type="text"
                value={mc.highlightBar || ''}
                placeholder="Morphing banner callout text"
                onChange={(e) => updateMotionCard({ highlightBar: e.target.value || undefined })}
                className="w-full h-8 px-2 rounded bg-[#14192b] border border-white/12 text-[11px] text-white"
              />
            </label>
          </div>
        ) : null}

        {/* 2. Sub-Beat Action Cues Editor */}
        <div className="rounded-lg bg-[#111526] border border-white/10 p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setCuesExpanded((v) => !v)}
              className="flex items-center gap-1.5 text-left cursor-pointer"
            >
              {cuesExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#f2c85b]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[#8e97b0]" />
              )}
              <Zap className="w-3.5 h-3.5 text-[#f2c85b]" />
              <span className="text-[11px] font-semibold text-white">
                Sub-Beat Action Cues
              </span>
              <span className="text-[10px] font-mono text-[#9aa3bd] px-1.5 py-0.5 rounded bg-white/6">
                {cues.length}
              </span>
            </button>

            <button
              type="button"
              onClick={handleAddCue}
              className="h-6 px-2 rounded bg-[#1b233d] hover:bg-[#253052] border border-[#f2c85b]/35 text-[10px] font-semibold text-[#f2c85b] inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Cue</span>
            </button>
          </div>

          {cuesExpanded && (
            <div className="space-y-2 pt-1">
              {cues.length === 0 ? (
                <p className="text-[10px] text-[#7e87a1] leading-relaxed">
                  Trigger mid-beat pose switches, camera impact punches, prop pulses, FX bursts, or synced SFX at an exact 60fps frame or spoken phrase.
                </p>
              ) : (
                cues.map((cue, idx) => {
                  const triggerMode = cue.triggerPhrase
                    ? 'phrase'
                    : typeof cue.timeSec === 'number'
                      ? 'time'
                      : 'frame';
                  return (
                    <div
                      key={idx}
                      className="rounded-md bg-[#0c101d] border border-white/10 p-2 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <input
                          type="text"
                          value={cue.label || ''}
                          placeholder={`Cue #${idx + 1} label`}
                          onChange={(e) => updateCue(idx, { label: e.target.value || undefined })}
                          className="flex-1 min-w-0 h-6 px-1.5 rounded bg-[#14192b] border border-white/10 text-[10px] font-semibold text-[#f7e7bc]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCue(idx)}
                          title="Delete action cue"
                          className="h-6 w-6 rounded bg-[#2a1520] hover:bg-[#3f1c2d] text-[#fca5a5] inline-flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Timing trigger row */}
                      <div className="grid grid-cols-12 gap-1.5 items-center">
                        <select
                          value={triggerMode}
                          onChange={(e) => {
                            const nextMode = e.target.value;
                            if (nextMode === 'phrase') {
                              updateCue(idx, {
                                frame: undefined,
                                timeSec: undefined,
                                at: undefined,
                                triggerPhrase: beat.dialogue.split(/\s+/).slice(0, 2).join(' ') || 'now',
                              });
                            } else if (nextMode === 'time') {
                              updateCue(idx, {
                                frame: undefined,
                                triggerPhrase: undefined,
                                at: undefined,
                                timeSec: Number(((cue.frame ?? 60) / STUDIO_FPS).toFixed(2)),
                              });
                            } else {
                              updateCue(idx, {
                                timeSec: undefined,
                                triggerPhrase: undefined,
                                at: undefined,
                                frame: Math.round((cue.timeSec ?? 1.0) * STUDIO_FPS),
                              });
                            }
                          }}
                          className="col-span-4 h-7 px-1 rounded bg-[#14192b] border border-white/10 text-[10px] text-white"
                        >
                          <option value="frame">Frame #</option>
                          <option value="phrase">Phrase</option>
                          <option value="time">Seconds</option>
                        </select>

                        {triggerMode === 'phrase' ? (
                          <input
                            type="text"
                            value={cue.triggerPhrase || ''}
                            placeholder="spoken words..."
                            onChange={(e) => updateCue(idx, { triggerPhrase: e.target.value })}
                            className="col-span-8 h-7 px-2 rounded bg-[#14192b] border border-white/10 text-[10px] text-white"
                          />
                        ) : triggerMode === 'time' ? (
                          <input
                            type="number"
                            min={0}
                            max={Number(beat.duration.toFixed(1))}
                            step={0.1}
                            value={cue.timeSec ?? 0}
                            onChange={(e) =>
                              updateCue(idx, {
                                timeSec: Math.max(0, Math.min(beat.duration, Number(e.target.value) || 0)),
                              })
                            }
                            className="col-span-8 h-7 px-2 rounded bg-[#14192b] border border-white/10 text-[10px] font-mono text-white"
                          />
                        ) : (
                          <input
                            type="number"
                            min={0}
                            max={maxBeatFrames}
                            step={5}
                            value={cue.frame ?? 0}
                            onChange={(e) =>
                              updateCue(idx, {
                                frame: Math.max(0, Math.min(maxBeatFrames, Math.round(Number(e.target.value) || 0))),
                              })
                            }
                            className="col-span-8 h-7 px-2 rounded bg-[#14192b] border border-white/10 text-[10px] font-mono text-white"
                          />
                        )}
                      </div>

                      {/* Target Actor + Pose + Motion */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <select
                          value={cue.castId || ''}
                          onChange={(e) => updateCue(idx, { castId: e.target.value || undefined })}
                          className="h-7 px-1 rounded bg-[#14192b] border border-white/10 text-[10px] text-white"
                          title="Optional target actor"
                        >
                          <option value="">No Actor</option>
                          {cast.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={cue.pose || ''}
                          disabled={!cue.castId}
                          onChange={(e) =>
                            updateCue(idx, { pose: (e.target.value || undefined) as PoseId | undefined })
                          }
                          className="h-7 px-1 rounded bg-[#14192b] border border-white/10 text-[10px] text-white disabled:opacity-40"
                          title="Pose override"
                        >
                          <option value="">Pose...</option>
                          {POSE_LIST.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                        <select
                          value={cue.motion || ''}
                          disabled={!cue.castId}
                          onChange={(e) =>
                            updateCue(idx, { motion: (e.target.value || undefined) as MotionId | undefined })
                          }
                          className="h-7 px-1 rounded bg-[#14192b] border border-white/10 text-[10px] text-white disabled:opacity-40"
                          title="Motion override"
                        >
                          <option value="">Motion...</option>
                          {MOTION_LIST.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Camera Punch + Prop Pulse */}
                      <div className="grid grid-cols-2 gap-2">
                        <label className="block">
                          <span className="flex justify-between text-[9px] text-[#8e97b0]">
                            <span>Cam Punch</span>
                            <span className="font-mono">{(cue.cameraPunch ?? 0).toFixed(2)}</span>
                          </span>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={cue.cameraPunch ?? 0}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              updateCue(idx, { cameraPunch: v > 0 ? v : undefined });
                            }}
                            className="w-full accent-[#f2c85b]"
                          />
                        </label>
                        <label className="block">
                          <span className="flex justify-between text-[9px] text-[#8e97b0]">
                            <span>Prop Pulse</span>
                            <span className="font-mono">{(cue.propPulse ?? 0).toFixed(2)}</span>
                          </span>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={cue.propPulse ?? 0}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              updateCue(idx, { propPulse: v > 0 ? v : undefined });
                            }}
                            className="w-full accent-[#f2c85b]"
                          />
                        </label>
                      </div>

                      {/* FX + Synced SFX */}
                      <div className="flex items-center gap-1.5">
                        <select
                          value={cue.fx || 'none'}
                          onChange={(e) => {
                            const val = e.target.value as FxId;
                            updateCue(idx, { fx: val === 'none' ? undefined : val });
                          }}
                          className="w-1/2 h-7 px-1 rounded bg-[#14192b] border border-white/10 text-[10px] text-white"
                          title="FX burst override"
                        >
                          {FX_LIST.map((f) => (
                            <option key={f} value={f}>
                              FX: {f}
                            </option>
                          ))}
                        </select>
                        <select
                          value={cue.sfx || 'none'}
                          onChange={(e) => {
                            const val = e.target.value as SfxId;
                            updateCue(idx, { sfx: val === 'none' ? undefined : val });
                          }}
                          className="flex-1 min-w-0 h-7 px-1 rounded bg-[#14192b] border border-white/10 text-[10px] text-white"
                          title="Frame-locked sub-beat SFX"
                        >
                          {SFX_CATALOG.map((s) => (
                            <option key={s.id} value={s.id}>
                              SFX: {s.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!cue.sfx || cue.sfx === 'none'}
                          onClick={() => cue.sfx && onPreviewSfx(cue.sfx)}
                          title="Audition cue SFX"
                          className="h-7 w-7 rounded bg-[#161d36] hover:bg-[#222c4f] disabled:opacity-35 border border-white/10 text-[#f7e7bc] inline-flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Upgrade 4: One-Click Character Acting & Choreography Macro Library */}
        <div className="p-2.5 rounded-lg bg-[#0d1222] border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-[#f2c85b] inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apply Acting Macro (12 Presets)</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <select
              value={selectedMacroId}
              onChange={(e) => setSelectedMacroId(e.target.value as ActingMacroId)}
              className="flex-1 min-w-0 h-7 px-2 rounded bg-[#14192b] border border-white/10 text-[10px] text-white"
            >
              {ACTING_MACRO_CATALOG.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} ({m.category})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const patch = applyActingMacroToBeat(beat, selectedMacroId);
                onUpdateBeat(patch, `Acting Macro: ${selectedMacroId}`);
                setCuesExpanded(true);
              }}
              className="h-7 px-2.5 rounded bg-[#f2c85b] hover:bg-[#f7d577] text-[#110e0a] text-[10px] font-bold shrink-0 cursor-pointer"
            >
              Apply
            </button>
          </div>
          <p className="text-[10px] text-[#8e97b0] leading-snug">
            {ACTING_MACRO_CATALOG.find((m) => m.id === selectedMacroId)?.summary}
          </p>
        </div>

        {/* Upgrade 7: Per-Beat Camera Keyframe Splines & Mini Curve Editor */}
        <CameraCurveMiniEditor
          keyframes={beat.cameraKeyframes}
          beatDuration={Math.max(1.2, beat.duration || 4)}
          onChange={(nextKfs) => onUpdateBeat({ cameraKeyframes: nextKfs }, 'Edit Camera Spline')}
        />
      </div>
    );
  }
);

BeatMotionAndCuesEditor.displayName = 'BeatMotionAndCuesEditor';
