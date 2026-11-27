import { CastMember, EpisodeScript, ExpressionId, StoryBeat } from './types';

export interface TeleprompterBeatCue {
  beatIndex: number;
  beatId: string;
  title: string;
  speakerId: string;
  speakerLabel: string;
  speakerColor: string;
  expression: ExpressionId;
  dialogue: string;
  wordCount: number;
  targetDurationSec: number;
  recommendedWpm: number;
  nextPreview: string | null;
}

export interface TeleprompterTake {
  id: string;
  beatId: string;
  takeNumber: number;
  blob: Blob;
  objectUrl: string;
  durationSec: number;
  createdAt: number;
  fileName: string;
}

export type PacingVerdict = 'short' | 'on_target' | 'long';

/**
 * Resolves the primary acting expression cue for a beat's active speaker.
 */
export function resolveBeatSpeakerExpression(beat: StoryBeat): ExpressionId {
  const actor = beat.actors.find((a) => a.castId === beat.speakerId) || beat.actors[0];
  return actor?.expression || 'calm';
}

/**
 * Pure deterministic teleprompter cue sheet builder for every beat in an episode.
 */
export function buildTeleprompterCueSheet(episode: EpisodeScript): TeleprompterBeatCue[] {
  const castMap = new Map<string, CastMember>(episode.cast.map((c) => [c.id, c]));
  const beats = episode.beats || [];

  return beats.map((beat, idx) => {
    const member = castMap.get(beat.speakerId);
    const speakerColor = member?.accentColor || member?.primaryColor || '#f2c85b';
    const dialogue = (beat.dialogue || '').trim();
    const words = dialogue ? dialogue.split(/\s+/).filter(Boolean) : [];
    const targetDurationSec = Math.max(1.2, Number.isFinite(beat.duration) ? beat.duration : 4);
    const recommendedWpm =
      words.length > 0 ? Math.round((words.length / targetDurationSec) * 60) : 0;
    const nextBeat = beats[idx + 1];
    const nextPreview = nextBeat
      ? `${nextBeat.speakerLabel || 'Narrator'}: ${(nextBeat.dialogue || nextBeat.title || '').trim()}`
      : null;

    return {
      beatIndex: idx,
      beatId: beat.id,
      title: beat.title || `Scene ${idx + 1}`,
      speakerId: beat.speakerId,
      speakerLabel: beat.speakerLabel || member?.name || 'Narrator',
      speakerColor,
      expression: resolveBeatSpeakerExpression(beat),
      dialogue,
      wordCount: words.length,
      targetDurationSec: Number(targetDurationSec.toFixed(2)),
      recommendedWpm,
      nextPreview,
    };
  });
}

/**
 * Classifies how close a recorded take's duration is to the beat's target duration.
 */
export function evaluateTakePacing(recordedSec: number, targetSec: number): PacingVerdict {
  const safeTarget = Math.max(1.0, Number.isFinite(targetSec) ? targetSec : 4);
  const safeRec = Math.max(0, Number.isFinite(recordedSec) ? recordedSec : 0);
  if (safeRec < safeTarget * 0.72) return 'short';
  if (safeRec > safeTarget * 1.25) return 'long';
  return 'on_target';
}

/**
 * Computes countdown bar progress (0..1) and remaining seconds cleanly.
 */
export function computeTeleprompterProgress(
  elapsedSec: number,
  targetDurationSec: number
): { progressFrac: number; remainingSec: number; isOvertime: boolean } {
  const target = Math.max(0.5, Number.isFinite(targetDurationSec) ? targetDurationSec : 4);
  const elapsed = Math.max(0, Number.isFinite(elapsedSec) ? elapsedSec : 0);
  return {
    progressFrac: Math.min(1, elapsed / target),
    remainingSec: Number((target - elapsed).toFixed(2)),
    isOvertime: elapsed > target,
  };
}

/**
 * Generates a clean deterministic take filename for binding into the studio voice store.
 */
export function formatTakeFileName(beatIndex: number, beatId: string, takeNumber: number): string {
  const num = String(beatIndex + 1).padStart(2, '0');
  const cleanId = beatId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 28) || 'scene';
  return `${num}_${cleanId}_take${takeNumber}.wav`;
}
