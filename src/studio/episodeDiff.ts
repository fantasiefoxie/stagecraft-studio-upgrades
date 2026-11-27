import { EpisodeScript, StoryBeat } from './types';

export type BeatDiffStatus = 'unchanged' | 'modified' | 'added' | 'removed' | 'reordered';

export interface BeatDiffEntry {
  beatId: string;
  status: BeatDiffStatus;
  baseIndex: number | null;
  targetIndex: number | null;
  title: string;
  changedFields: string[];
  durationDeltaSec: number;
  baseBeat: StoryBeat | null;
  targetBeat: StoryBeat | null;
}

export interface VisualStyleFieldDiff {
  field: string;
  baseValue: unknown;
  targetValue: unknown;
}

export interface EpisodeDiffResult {
  beatDiffs: BeatDiffEntry[];
  visualStyleDiffs: VisualStyleFieldDiff[];
  totalBaseDurationSec: number;
  totalTargetDurationSec: number;
  durationDeltaSec: number;
  summary: {
    added: number;
    removed: number;
    modified: number;
    reordered: number;
    unchanged: number;
    visualStyleChanges: number;
  };
  hasChanges: boolean;
}

function deepEqualJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (typeof a !== typeof b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

const COMPARED_BEAT_FIELDS: Array<{ key: keyof StoryBeat; label: string }> = [
  { key: 'title', label: 'title' },
  { key: 'dialogue', label: 'dialogue' },
  { key: 'speakerId', label: 'speaker' },
  { key: 'duration', label: 'duration' },
  { key: 'shot', label: 'shot' },
  { key: 'stage', label: 'stage' },
  { key: 'mood', label: 'mood' },
  { key: 'cameraMove', label: 'cameraMove' },
  { key: 'cameraKeyframes', label: 'cameraKeyframes' },
  { key: 'audioLeadSec', label: 'audioLeadSec' },
  { key: 'transition', label: 'transition' },
  { key: 'fx', label: 'fx' },
  { key: 'sfx', label: 'sfx' },
  { key: 'prop', label: 'prop' },
  { key: 'propAnchor', label: 'propAnchor' },
  { key: 'raag', label: 'raag' },
  { key: 'musicEnergy', label: 'musicEnergy' },
  { key: 'actors', label: 'actors' },
  { key: 'actionCues', label: 'actionCues' },
  { key: 'expressionCues', label: 'expressionCues' },
  { key: 'locationCard', label: 'locationCard' },
  { key: 'renderStyle', label: 'renderStyle' },
];

function diffBeatFields(base: StoryBeat, target: StoryBeat): string[] {
  const changed: string[] = [];
  for (const { key, label } of COMPARED_BEAT_FIELDS) {
    if (!deepEqualJson(base[key], target[key])) {
      changed.push(label);
    }
  }
  return changed;
}

function sumDuration(beats: StoryBeat[]): number {
  return Number(
    beats.reduce((acc, b) => acc + Math.max(1.2, Number.isFinite(b.duration) ? b.duration : 4), 0).toFixed(2)
  );
}

/**
 * Pure deterministic episode diff engine comparing `base` (e.g. a saved checkpoint)
 * against `target` (e.g. the current working episode).
 */
export function computeEpisodeDiff(base: EpisodeScript, target: EpisodeScript): EpisodeDiffResult {
  const baseBeats = base.beats || [];
  const targetBeats = target.beats || [];

  const baseMap = new Map<string, { beat: StoryBeat; idx: number }>();
  baseBeats.forEach((b, idx) => {
    if (!baseMap.has(b.id)) baseMap.set(b.id, { beat: b, idx });
  });

  const targetMap = new Map<string, { beat: StoryBeat; idx: number }>();
  targetBeats.forEach((b, idx) => {
    if (!targetMap.has(b.id)) targetMap.set(b.id, { beat: b, idx });
  });

  const beatDiffs: BeatDiffEntry[] = [];
  const seenBaseIds = new Set<string>();

  targetBeats.forEach((tBeat, tIdx) => {
    const match = baseMap.get(tBeat.id);
    if (!match) {
      beatDiffs.push({
        beatId: tBeat.id,
        status: 'added',
        baseIndex: null,
        targetIndex: tIdx,
        title: tBeat.title || `Scene ${tIdx + 1}`,
        changedFields: ['added'],
        durationDeltaSec: Number(Math.max(1.2, tBeat.duration || 4).toFixed(2)),
        baseBeat: null,
        targetBeat: tBeat,
      });
      return;
    }

    seenBaseIds.add(tBeat.id);
    const changedFields = diffBeatFields(match.beat, tBeat);
    const moved = match.idx !== tIdx;
    const status: BeatDiffStatus =
      changedFields.length > 0 ? 'modified' : moved ? 'reordered' : 'unchanged';
    const dDelta = Number(((tBeat.duration || 4) - (match.beat.duration || 4)).toFixed(2));

    beatDiffs.push({
      beatId: tBeat.id,
      status,
      baseIndex: match.idx,
      targetIndex: tIdx,
      title: tBeat.title || match.beat.title || `Scene ${tIdx + 1}`,
      changedFields: moved && !changedFields.includes('order') ? [...changedFields, 'order'] : changedFields,
      durationDeltaSec: dDelta,
      baseBeat: match.beat,
      targetBeat: tBeat,
    });
  });

  baseBeats.forEach((bBeat, bIdx) => {
    if (seenBaseIds.has(bBeat.id) || targetMap.has(bBeat.id)) return;
    beatDiffs.push({
      beatId: bBeat.id,
      status: 'removed',
      baseIndex: bIdx,
      targetIndex: null,
      title: bBeat.title || `Scene ${bIdx + 1}`,
      changedFields: ['removed'],
      durationDeltaSec: Number((-Math.max(1.2, bBeat.duration || 4)).toFixed(2)),
      baseBeat: bBeat,
      targetBeat: null,
    });
  });

  // Compare visualStyle fields
  const baseVs = (base.visualStyle || {}) as Record<string, unknown>;
  const targetVs = (target.visualStyle || {}) as Record<string, unknown>;
  const vsKeys = Array.from(new Set([...Object.keys(baseVs), ...Object.keys(targetVs)])).sort();
  const visualStyleDiffs: VisualStyleFieldDiff[] = [];
  for (const key of vsKeys) {
    if (!deepEqualJson(baseVs[key], targetVs[key])) {
      visualStyleDiffs.push({
        field: key,
        baseValue: baseVs[key],
        targetValue: targetVs[key],
      });
    }
  }

  const totalBaseDurationSec = sumDuration(baseBeats);
  const totalTargetDurationSec = sumDuration(targetBeats);
  const durationDeltaSec = Number((totalTargetDurationSec - totalBaseDurationSec).toFixed(2));

  const summary = {
    added: beatDiffs.filter((d) => d.status === 'added').length,
    removed: beatDiffs.filter((d) => d.status === 'removed').length,
    modified: beatDiffs.filter((d) => d.status === 'modified').length,
    reordered: beatDiffs.filter((d) => d.status === 'reordered').length,
    unchanged: beatDiffs.filter((d) => d.status === 'unchanged').length,
    visualStyleChanges: visualStyleDiffs.length,
  };

  const hasChanges =
    summary.added > 0 ||
    summary.removed > 0 ||
    summary.modified > 0 ||
    summary.reordered > 0 ||
    summary.visualStyleChanges > 0;

  return {
    beatDiffs,
    visualStyleDiffs,
    totalBaseDurationSec,
    totalTargetDurationSec,
    durationDeltaSec,
    summary,
    hasChanges,
  };
}

/**
 * Pure helper: cherry-picks a single beat snapshot from a historical checkpoint back into `current`.
 * - If a beat with `beatId` exists in `current`, replaces it in-place with a deep copy from `checkpoint`.
 * - If it was removed from `current`, re-inserts it near its original checkpoint index.
 */
export function restoreSingleBeatFromCheckpoint(
  current: EpisodeScript,
  checkpoint: EpisodeScript,
  beatId: string
): EpisodeScript {
  const cpIdx = checkpoint.beats.findIndex((b) => b.id === beatId);
  if (cpIdx < 0) return current;
  const restoredBeat: StoryBeat = JSON.parse(JSON.stringify(checkpoint.beats[cpIdx]));
  const curIdx = current.beats.findIndex((b) => b.id === beatId);

  if (curIdx >= 0) {
    const nextBeats = current.beats.map((b, i) => (i === curIdx ? restoredBeat : b));
    return { ...current, beats: nextBeats };
  }

  const insertAt = Math.min(current.beats.length, cpIdx);
  const nextBeats = [...current.beats];
  nextBeats.splice(insertAt, 0, restoredBeat);
  return { ...current, beats: nextBeats };
}
