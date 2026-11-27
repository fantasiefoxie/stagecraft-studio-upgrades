/**
 * Stagecraft Studio — One-Click Character Acting & Choreography Macro Library
 *
 * 12 deterministic multi-frame acting presets that generate frame-locked
 * `expressionCues[]`, `actionCues[]`, and matched `sfx` / `sfxOffsetSec` scaled
 * cleanly to any beat's `duration` and `STUDIO_FPS` (60fps).
 */

import {
  STUDIO_FPS,
  type BeatActionCue,
  type BeatExpressionCue,
  type ExpressionId,
  type FxId,
  type MotionId,
  type PoseId,
  type SfxId,
  type StoryBeat,
} from './types';

export type ActingMacroId =
  | 'dramatic_realization'
  | 'sword_draw_clash'
  | 'whispered_conspiracy'
  | 'shocked_recoil'
  | 'triumphant_proclamation'
  | 'sly_scheme'
  | 'solemn_bow'
  | 'sudden_ambush'
  | 'mystic_invocation'
  | 'courtroom_verdict'
  | 'heartfelt_plea'
  | 'comic_double_take';

export interface ActingMacroSpec {
  id: ActingMacroId;
  label: string;
  category: 'drama' | 'action' | 'intrigue' | 'comedy' | 'ceremony';
  summary: string;
  sfx: SfxId;
  sfxAtFrac: number;
  fx?: FxId;
}

export const ACTING_MACRO_CATALOG: ActingMacroSpec[] = [
  {
    id: 'dramatic_realization',
    label: 'Dramatic Realization',
    category: 'drama',
    summary: 'Calm study -> sudden widening shock -> stern conviction with subtle camera punch',
    sfx: 'mystic_chime',
    sfxAtFrac: 0.34,
    fx: 'shock_burst',
  },
  {
    id: 'sword_draw_clash',
    label: 'Sword Draw & Clash',
    category: 'action',
    summary: 'Steely gaze -> fierce lunge & blade strike -> rival recoils with impact shake',
    sfx: 'sword_clash',
    sfxAtFrac: 0.42,
    fx: 'crimson_impact',
  },
  {
    id: 'whispered_conspiracy',
    label: 'Whispered Conspiracy',
    category: 'intrigue',
    summary: 'Curious glance -> hushed conspiratorial lean -> sly knowing smirk',
    sfx: 'arrow_whoosh',
    sfxAtFrac: 0.25,
  },
  {
    id: 'shocked_recoil',
    label: 'Shocked Recoil',
    category: 'drama',
    summary: 'Unaware beat -> startled jolt & step back -> wide-eyed dread',
    sfx: 'court_gasp',
    sfxAtFrac: 0.28,
    fx: 'shock_burst',
  },
  {
    id: 'triumphant_proclamation',
    label: 'Triumphant Proclamation',
    category: 'ceremony',
    summary: 'Stern poise -> raised-arm declaration -> radiant victorious joy',
    sfx: 'shankha_conch',
    sfxAtFrac: 0.36,
    fx: 'divine_aura',
  },
  {
    id: 'sly_scheme',
    label: 'Sly Scheme',
    category: 'intrigue',
    summary: 'Innocent facade -> narrow-eyed calculation -> wicked scheming grin',
    sfx: 'mystic_chime',
    sfxAtFrac: 0.48,
    fx: 'question_mark',
  },
  {
    id: 'solemn_bow',
    label: 'Solemn Bow',
    category: 'ceremony',
    summary: 'Reverent pause -> graceful kneel & salute -> warm blessing composure',
    sfx: 'temple_bell',
    sfxAtFrac: 0.3,
    fx: 'divine_aura',
  },
  {
    id: 'sudden_ambush',
    label: 'Sudden Ambush',
    category: 'action',
    summary: 'Quiet stillness -> explosive leap attack -> fierce standoff punch',
    sfx: 'thunder_crack',
    sfxAtFrac: 0.32,
    fx: 'smear_swoop',
  },
  {
    id: 'mystic_invocation',
    label: 'Mystic Invocation',
    category: 'ceremony',
    summary: 'Calm meditation -> soaring power surge -> celestial awe',
    sfx: 'mystic_chime',
    sfxAtFrac: 0.4,
    fx: 'divine_aura',
  },
  {
    id: 'courtroom_verdict',
    label: 'Courtroom Verdict',
    category: 'drama',
    summary: 'Stern scrutiny -> commanding gesture -> resounding gavel impact',
    sfx: 'wooden_gavel',
    sfxAtFrac: 0.45,
    fx: 'shock_burst',
  },
  {
    id: 'heartfelt_plea',
    label: 'Heartfelt Plea',
    category: 'drama',
    summary: 'Sorrowful hesitation -> kneeling appeal -> warm earnest hope',
    sfx: 'temple_bell',
    sfxAtFrac: 0.52,
  },
  {
    id: 'comic_double_take',
    label: 'Comic Double-Take',
    category: 'comedy',
    summary: 'Casual calm -> snap disbelief -> sheepish wry smirk with playful bounce',
    sfx: 'court_gasp',
    sfxAtFrac: 0.3,
    fx: 'question_mark',
  },
];

export interface ApplyActingMacroOptions {
  /** Override primary acting character (defaults to active speaker or first stage actor) */
  primaryCastId?: string;
  /** Override secondary reacting character (defaults to another actor on stage if present) */
  secondaryCastId?: string;
  /** If true (default), replaces existing cues on the beat; if false, merges & sorts */
  replaceExisting?: boolean;
}

interface RelativeExpressionStep {
  role: 'primary' | 'secondary';
  startFrac: number;
  endFrac: number;
  expression: ExpressionId;
  reason: string;
}

interface RelativeActionStep {
  role: 'primary' | 'secondary' | 'stage';
  atFrac: number;
  endFrac?: number;
  pose?: PoseId;
  motion?: MotionId;
  cameraPunch?: number;
  propPulse?: number;
  fx?: FxId;
  sfx?: SfxId;
  label: string;
}

interface MacroChoreographyBlueprint {
  expressions: RelativeExpressionStep[];
  actions: RelativeActionStep[];
}

const MACRO_BLUEPRINTS: Record<ActingMacroId, MacroChoreographyBlueprint> = {
  dramatic_realization: {
    expressions: [
      { role: 'primary', startFrac: 0.0, endFrac: 0.28, expression: 'curious', reason: 'piecing clues together' },
      { role: 'primary', startFrac: 0.32, endFrac: 0.64, expression: 'shocked', reason: 'truth clicks suddenly' },
      { role: 'primary', startFrac: 0.68, endFrac: 0.98, expression: 'stern', reason: 'resolves to act' },
      { role: 'secondary', startFrac: 0.38, endFrac: 0.95, expression: 'curious', reason: 'notices the realization' },
    ],
    actions: [
      { role: 'primary', atFrac: 0.33, endFrac: 0.62, pose: 'recoil', cameraPunch: 0.48, propPulse: 0.55, fx: 'shock_burst', label: 'Realization Jolt' },
      { role: 'primary', atFrac: 0.68, endFrac: 0.98, pose: 'gesture', motion: 'step_forward', label: 'Resolute Focus' },
    ],
  },
  sword_draw_clash: {
    expressions: [
      { role: 'primary', startFrac: 0.0, endFrac: 0.34, expression: 'stern', reason: 'hand on hilt' },
      { role: 'primary', startFrac: 0.38, endFrac: 0.85, expression: 'angry', reason: 'strikes forward' },
      { role: 'secondary', startFrac: 0.42, endFrac: 0.88, expression: 'shocked', reason: 'parries sudden blow' },
    ],
    actions: [
      { role: 'primary', atFrac: 0.14, endFrac: 0.36, pose: 'gesture', motion: 'step_forward', label: 'Draw Stance' },
      { role: 'primary', atFrac: 0.4, endFrac: 0.72, pose: 'attack', motion: 'leap_arc', cameraPunch: 0.78, fx: 'crimson_impact', sfx: 'sword_clash', label: 'Blade Clash' },
      { role: 'secondary', atFrac: 0.44, endFrac: 0.78, pose: 'recoil', motion: 'retreat', label: 'Rival Recoil' },
    ],
  },
  whispered_conspiracy: {
    expressions: [
      { role: 'primary', startFrac: 0.0, endFrac: 0.3, expression: 'curious', reason: 'checks surroundings' },
      { role: 'primary', startFrac: 0.32, endFrac: 0.72, expression: 'sly', reason: 'whispers secret plan' },
      { role: 'primary', startFrac: 0.75, endFrac: 0.98, expression: 'warm', reason: 'confident in scheme' },
      { role: 'secondary', startFrac: 0.25, endFrac: 0.92, expression: 'curious', reason: 'listens intently' },
    ],
    actions: [
      { role: 'primary', atFrac: 0.22, endFrac: 0.72, pose: 'gesture', motion: 'step_forward', sfx: 'arrow_whoosh', label: 'Hushed Lean-In' },
      { role: 'secondary', atFrac: 0.32, endFrac: 0.85, pose: 'stand', motion: 'still', label: 'Attentive Listener' },
    ],
  },
  shocked_recoil: {
    expressions: [
      { role: 'primary', startFrac: 0.0, endFrac: 0.24, expression: 'calm', reason: 'caught off guard' },
      { role: 'primary', startFrac: 0.26, endFrac: 0.66, expression: 'shocked', reason: 'sudden alarm' },
      { role: 'primary', startFrac: 0.68, endFrac: 0.98, expression: 'grief', reason: 'lingering dread' },
    ],
    actions: [
      { role: 'primary', atFrac: 0.27, endFrac: 0.68, pose: 'recoil', motion: 'retreat', cameraPunch: 0.62, fx: 'shock_burst', sfx: 'court_gasp', label: 'Startled Recoil' },
      { role: 'primary', atFrac: 0.7, endFrac: 0.96, pose: 'stand', motion: 'still', label: 'Shaken Hold' },
    ],
  },
  triumphant_proclamation: {
    expressions: [
      { role: 'primary', startFrac: 0.0, endFrac: 0.3, expression: 'stern', reason: 'gathers voice' },
      { role: 'primary', startFrac: 0.34, endFrac: 0.98, expression: 'joy', reason: 'declares victory' },
      { role: 'secondary', startFrac: 0.42, endFrac: 0.98, expression: 'awe', reason: 'inspired by proclamation' },
    ],
    actions: [
      { role: 'primary', atFrac: 0.14, endFrac: 0.32, pose: 'stand', motion: 'step_forward', label: 'Commanding Step' },
      { role: 'primary', atFrac: 0.34, endFrac: 0.92, pose: 'gesture', motion: 'still', cameraPunch: 0.38, propPulse: 0.65, fx: 'divine_aura', sfx: 'shankha_conch', label: 'Triumphant Raise' },
    ],
  },
  sly_scheme: {
    expressions: [
      { role: 'primary', startFrac: 0.0, endFrac: 0.32, expression: 'calm', reason: 'feigns innocence' },
      { role: 'primary', startFrac: 0.35, endFrac: 0.65, expression: 'curious', reason: 'weighs leverage' },
      { role: 'primary', startFrac: 0.68, endFrac: 0.98, expression: 'sly', reason: 'locks in clever trap' },
    ],
    actions: [
      { role: 'primary', atFrac: 0.18, endFrac: 0.4, pose: 'stand', motion: 'still', label: 'Innocent Pause' },
      { role: 'primary', atFrac: 0.42, endFrac: 0.85, pose: 'gesture', propPulse: 0.4, fx: 'question_mark', sfx: 'mystic_chime', label: 'Scheme Reveal' },
    ],
  },
  solemn_bow: {
    expressions: [
      { role: 'primary', startFrac: 0.0, endFrac: 0.25, expression: 'warm', reason: 'enters with respect' },
      { role: 'primary', startFrac: 0.28, endFrac: 0.72, expression: 'calm', reason: 'bows head deeply' },
      { role: 'primary', startFrac: 0.75, endFrac: 0.98, expression: 'warm', reason: 'rises in peace' },
      { role: 'secondary', startFrac: 0.32, endFrac: 0.95, expression: 'warm', reason: 'accepts salute' },
    ],
    actions: [
      { role: 'primary', atFrac: 0.26, endFrac: 0.74, pose: 'kneel', motion: 'still', fx: 'divine_aura', sfx: 'temple_bell', label: 'Reverent Bow' },
      { role: 'secondary', atFrac: 0.52, endFrac: 0.92, pose: 'gesture', label: 'Bestow Blessing' },
    ],
  },
  sudden_ambush: {
    expressions: [
      { role: 'primary', startFrac: 0.0, endFrac: 0.25, expression: 'sly', reason: 'stalks target' },
      { role: 'primary', startFrac: 0.28, endFrac: 0.92, expression: 'angry', reason: 'springs ambush' },
      { role: 'secondary', startFrac: 0.3, endFrac: 0.92, expression: 'shocked', reason: 'surprised by ambush' },
    ],
    actions: [
      { role: 'primary', atFrac: 0.28, endFrac: 0.68, pose: 'attack', motion: 'leap_arc', cameraPunch: 0.82, fx: 'smear_swoop', sfx: 'thunder_crack', label: 'Ambush Leap' },
      { role: 'secondary', atFrac: 0.34, endFrac: 0.82, pose: 'recoil', motion: 'retreat', label: 'Target Staggers' },
    ],
  },
  mystic_invocation: {
    expressions: [
      { role: 'primary', startFrac: 0.0, endFrac: 0.35, expression: 'calm', reason: 'channels inner focus' },
      { role: 'primary', startFrac: 0.38, endFrac: 0.98, expression: 'awe', reason: 'energy manifests' },
      { role: 'secondary', startFrac: 0.44, endFrac: 0.98, expression: 'awe', reason: 'beholds miracle' },
    ],
    actions: [
      { role: 'primary', atFrac: 0.12, endFrac: 0.38, pose: 'sit', motion: 'still', label: 'Deep Focus' },
      { role: 'primary', atFrac: 0.4, endFrac: 0.92, pose: 'soar', motion: 'leap_arc', cameraPunch: 0.32, propPulse: 0.85, fx: 'divine_aura', sfx: 'mystic_chime', label: 'Mystic Surge' },
    ],
  },
  courtroom_verdict: {
    expressions: [
      { role: 'primary', startFrac: 0.0, endFrac: 0.36, expression: 'stern', reason: 'weighs testimony' },
      { role: 'primary', startFrac: 0.4, endFrac: 0.98, expression: 'angry', reason: 'pronounces verdict' },
      { role: 'secondary', startFrac: 0.46, endFrac: 0.98, expression: 'shocked', reason: 'stunned by judgment' },
    ],
    actions: [
      { role: 'primary', atFrac: 0.42, endFrac: 0.88, pose: 'gesture', cameraPunch: 0.65, fx: 'shock_burst', sfx: 'wooden_gavel', label: 'Commanding Verdict' },
      { role: 'secondary', atFrac: 0.5, endFrac: 0.9, pose: 'recoil', label: 'Accused Reacts' },
    ],
  },
  heartfelt_plea: {
    expressions: [
      { role: 'primary', startFrac: 0.0, endFrac: 0.32, expression: 'grief', reason: 'carries heavy sorrow' },
      { role: 'primary', startFrac: 0.35, endFrac: 0.72, expression: 'grief', reason: 'begs earnestly' },
      { role: 'primary', startFrac: 0.75, endFrac: 0.98, expression: 'warm', reason: 'awaits mercy' },
      { role: 'secondary', startFrac: 0.4, endFrac: 0.95, expression: 'curious', reason: 'moved by plea' },
    ],
    actions: [
      { role: 'primary', atFrac: 0.16, endFrac: 0.33, pose: 'walk', motion: 'step_forward', label: 'Humble Approach' },
      { role: 'primary', atFrac: 0.34, endFrac: 0.9, pose: 'kneel', motion: 'still', sfx: 'temple_bell', label: 'Earnest Kneel' },
    ],
  },
  comic_double_take: {
    expressions: [
      { role: 'primary', startFrac: 0.0, endFrac: 0.25, expression: 'calm', reason: 'nonchalant beat' },
      { role: 'primary', startFrac: 0.28, endFrac: 0.58, expression: 'shocked', reason: 'wait—what?!' },
      { role: 'primary', startFrac: 0.62, endFrac: 0.98, expression: 'joy', reason: 'playful recovery' },
    ],
    actions: [
      { role: 'primary', atFrac: 0.28, endFrac: 0.56, pose: 'recoil', motion: 'retreat', cameraPunch: 0.34, fx: 'question_mark', sfx: 'court_gasp', label: 'Snap Double-Take' },
      { role: 'primary', atFrac: 0.62, endFrac: 0.92, pose: 'gesture', motion: 'step_forward', label: 'Cheeky Recovery' },
    ],
  },
};

export function getActingMacroSpec(macroId: ActingMacroId): ActingMacroSpec {
  return ACTING_MACRO_CATALOG.find((m) => m.id === macroId) || ACTING_MACRO_CATALOG[0];
}

/**
 * Generates frame-locked `expressionCues[]`, `actionCues[]`, and matched `sfx`/`sfxOffsetSec`
 * scaled cleanly to `beat.duration` and `STUDIO_FPS` (60fps).
 */
export function applyActingMacroToBeat(
  beat: StoryBeat,
  macroId: ActingMacroId,
  options: ApplyActingMacroOptions = {}
): Partial<StoryBeat> {
  const spec = getActingMacroSpec(macroId);
  const blueprint = MACRO_BLUEPRINTS[spec.id];
  const totalFrames = Math.max(12, Math.round(Math.max(1.2, beat.duration || 4) * STUDIO_FPS));

  const primaryCastId =
    options.primaryCastId ||
    (beat.speakerId && beat.speakerId !== 'narrator' && beat.actors.some((a) => a.castId === beat.speakerId)
      ? beat.speakerId
      : beat.actors[0]?.castId) ||
    '';

  const secondaryCastId =
    options.secondaryCastId ||
    beat.actors.find((a) => a.castId !== primaryCastId)?.castId ||
    '';

  const toFrame = (frac: number) =>
    Math.max(0, Math.min(totalFrames - 1, Math.round(Math.max(0, Math.min(1, frac)) * (totalFrames - 1))));

  const generatedExprCues: BeatExpressionCue[] = [];
  for (const step of blueprint.expressions) {
    const cid = step.role === 'primary' ? primaryCastId : secondaryCastId;
    if (!cid) continue;
    const frame = toFrame(step.startFrac);
    const endFrame = Math.max(frame, toFrame(step.endFrac));
    generatedExprCues.push({
      castId: cid,
      frame,
      endFrame,
      expression: step.expression,
      reason: step.reason,
    });
  }

  const generatedActionCues: BeatActionCue[] = [];
  for (const step of blueprint.actions) {
    const cid =
      step.role === 'stage'
        ? undefined
        : step.role === 'primary'
          ? primaryCastId
          : secondaryCastId;
    if (step.role !== 'stage' && !cid) continue;
    const frame = toFrame(step.atFrac);
    const endFrame = typeof step.endFrac === 'number' ? Math.max(frame, toFrame(step.endFrac)) : undefined;
    generatedActionCues.push({
      frame,
      ...(endFrame !== undefined ? { endFrame } : {}),
      ...(cid ? { castId: cid } : {}),
      ...(step.pose ? { pose: step.pose } : {}),
      ...(step.motion ? { motion: step.motion } : {}),
      ...(typeof step.cameraPunch === 'number' ? { cameraPunch: step.cameraPunch } : {}),
      ...(typeof step.propPulse === 'number' ? { propPulse: step.propPulse } : {}),
      ...(step.fx ? { fx: step.fx } : {}),
      ...(step.sfx ? { sfx: step.sfx } : {}),
      label: step.label,
    });
  }

  const replace = options.replaceExisting !== false;
  const expressionCues = replace
    ? generatedExprCues
    : [...(beat.expressionCues || []), ...generatedExprCues].sort(
        (a, b) => (a.frame ?? 0) - (b.frame ?? 0)
      );
  const actionCues = replace
    ? generatedActionCues
    : [...(beat.actionCues || []), ...generatedActionCues].sort(
        (a, b) => (a.frame ?? 0) - (b.frame ?? 0)
      );

  const sfxOffsetSec = Number(
    Math.max(0, Math.min(Math.max(0.2, beat.duration - 0.15), beat.duration * spec.sfxAtFrac)).toFixed(2)
  );

  return {
    expressionCues,
    actionCues,
    sfx: spec.sfx,
    sfxOffsetSec,
  };
}
