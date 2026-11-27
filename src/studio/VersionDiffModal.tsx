import React, { useMemo, useState } from 'react';
import { GitCompare, RotateCcw, X } from 'lucide-react';
import { EpisodeScript } from './types';
import { BeatDiffEntry, computeEpisodeDiff } from './episodeDiff';

export interface HistoryCheckpointItem {
  episode: EpisodeScript;
  label: string;
  savedAt: number;
}

export interface VersionDiffModalProps {
  currentEpisode: EpisodeScript;
  checkpoints: HistoryCheckpointItem[];
  onRestoreBeatFromCheckpoint: (checkpoint: HistoryCheckpointItem, beatId: string) => void;
  onRestoreEntireCheckpoint: (checkpointIndex: number) => void;
  onClose: () => void;
}

export const VersionDiffModal: React.FC<VersionDiffModalProps> = ({
  currentEpisode,
  checkpoints,
  onRestoreBeatFromCheckpoint,
  onRestoreEntireCheckpoint,
  onClose,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(() => Math.max(0, checkpoints.length - 1));
  const [onlyChanged, setOnlyChanged] = useState(true);

  const selectedCheckpoint = checkpoints[selectedIdx] || null;

  const diff = useMemo(() => {
    if (!selectedCheckpoint) return null;
    return computeEpisodeDiff(selectedCheckpoint.episode, currentEpisode);
  }, [currentEpisode, selectedCheckpoint]);

  const visibleEntries = useMemo(() => {
    if (!diff) return [];
    return onlyChanged
      ? diff.beatDiffs.filter((d) => d.status !== 'unchanged')
      : diff.beatDiffs;
  }, [diff, onlyChanged]);

  const statusBadge = (status: BeatDiffEntry['status']) => {
    switch (status) {
      case 'added':
        return 'bg-[#102e20] text-[#86efac] border-[#22c55e]/40';
      case 'removed':
        return 'bg-[#361420] text-[#fda4af] border-[#ff4d6d]/40';
      case 'modified':
        return 'bg-[#2c2210] text-[#f2c85b] border-[#f2c85b]/40';
      case 'reordered':
        return 'bg-[#172342] text-[#93c5fd] border-[#60a5fa]/40';
      default:
        return 'bg-[#14182a] text-[#8e97b0] border-white/10';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[88vh] rounded-2xl bg-[#0b0e19] border border-white/15 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 bg-[#101528] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <GitCompare className="w-4 h-4 text-[#f2c85b]" />
            <div>
              <div className="text-sm font-bold text-white">Compare History Checkpoints</div>
              <div className="text-[11px] text-[#8e97b0]">
                Inspect scene-level changes and cherry-pick individual beats back into your timeline
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-white/8 hover:bg-white/15 text-[#cbd3e8] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {checkpoints.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8e97b0]">
            No history checkpoints saved yet. Make edits in the studio to compare against earlier snapshots.
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex overflow-hidden">
            {/* Checkpoint Selector Rail */}
            <div className="w-64 border-r border-white/10 bg-[#0d1120] overflow-y-auto p-2 space-y-1 shrink-0">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7f8aa8]">
                Saved Checkpoints ({checkpoints.length})
              </div>
              {[...checkpoints]
                .map((cp, idx) => ({ cp, idx }))
                .reverse()
                .map(({ cp, idx }) => {
                  const active = idx === selectedIdx;
                  return (
                    <button
                      key={`${cp.savedAt}_${idx}`}
                      type="button"
                      onClick={() => setSelectedIdx(idx)}
                      className={`w-full px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#1c2440] border border-[#f2c85b]/50'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="text-xs font-semibold text-white truncate">{cp.label}</div>
                      <div className="text-[10px] text-[#8e97b0] flex items-center justify-between mt-0.5">
                        <span>{cp.episode.beats.length} scenes</span>
                        <span className="font-mono">
                          {new Date(cp.savedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Diff Inspector Pane */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedCheckpoint && diff && (
                <>
                  {/* Summary Strip */}
                  <div className="p-3 rounded-xl bg-[#12172a] border border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="font-semibold text-white">vs Current:</span>
                      <span className="px-2 py-0.5 rounded bg-[#2c2210] text-[#f2c85b]">
                        {diff.summary.modified} modified
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#102e20] text-[#86efac]">
                        +{diff.summary.added} added
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#361420] text-[#fda4af]">
                        -{diff.summary.removed} removed
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#172342] text-[#93c5fd] font-mono-tabular">
                        Δ {diff.durationDeltaSec >= 0 ? '+' : ''}
                        {diff.durationDeltaSec.toFixed(1)}s
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 text-[11px] text-[#aeb7d0] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={onlyChanged}
                          onChange={(e) => setOnlyChanged(e.target.checked)}
                          className="accent-[#f2c85b]"
                        />
                        <span>Changed only</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          onRestoreEntireCheckpoint(selectedIdx);
                          onClose();
                        }}
                        className="h-7 px-2.5 rounded-md bg-[#1d2542] hover:bg-[#283359] border border-[#f2c85b]/40 text-[11px] font-semibold text-[#f7e7bc] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore Whole Snapshot</span>
                      </button>
                    </div>
                  </div>

                  {/* Visual Style Diffs */}
                  {diff.visualStyleDiffs.length > 0 && (
                    <div className="p-3 rounded-xl bg-[#111629] border border-white/10 space-y-1.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#f2c85b]">
                        Look &amp; Visual Style Changes ({diff.visualStyleDiffs.length})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                        {diff.visualStyleDiffs.map((vs) => (
                          <div
                            key={vs.field}
                            className="px-2.5 py-1.5 rounded bg-[#0c101d] border border-white/8 flex items-center justify-between gap-2"
                          >
                            <span className="text-[#9aa5c4] font-mono">{vs.field}</span>
                            <span className="text-white truncate">
                              <span className="text-[#fda4af] line-through mr-1.5">
                                {String(vs.baseValue ?? 'default')}
                              </span>
                              <span className="text-[#86efac]">{String(vs.targetValue ?? 'default')}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Per-Beat Diff List */}
                  {visibleEntries.length === 0 ? (
                    <div className="p-6 rounded-xl bg-[#101425] border border-white/8 text-center text-xs text-[#8e97b0]">
                      No scene differences between this checkpoint and the current episode.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {visibleEntries.map((entry) => (
                        <div
                          key={`${entry.beatId}_${entry.status}`}
                          className="p-3 rounded-xl bg-[#12172a] border border-white/10 space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${statusBadge(
                                  entry.status
                                )}`}
                              >
                                {entry.status}
                              </span>
                              <span className="text-xs font-semibold text-white truncate">
                                {entry.title}
                              </span>
                              <span className="text-[10px] font-mono text-[#7f8aa8]">
                                {entry.baseIndex !== null ? `#${entry.baseIndex + 1}` : 'new'} →{' '}
                                {entry.targetIndex !== null ? `#${entry.targetIndex + 1}` : 'removed'}
                              </span>
                            </div>

                            {entry.baseBeat && entry.status !== 'unchanged' && (
                              <button
                                type="button"
                                onClick={() =>
                                  onRestoreBeatFromCheckpoint(selectedCheckpoint, entry.beatId)
                                }
                                className="h-7 px-2.5 rounded-md bg-[#1f2947] hover:bg-[#2b3963] border border-[#f2c85b]/45 text-[11px] font-semibold text-[#f7e7bc] inline-flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore This Beat</span>
                              </button>
                            )}
                          </div>

                          {entry.changedFields.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {entry.changedFields.map((f) => (
                                <span
                                  key={f}
                                  className="px-1.5 py-0.5 rounded bg-[#0c101d] border border-white/8 text-[10px] font-mono text-[#cbd3e8]"
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                          )}

                          {entry.baseBeat &&
                            entry.targetBeat &&
                            entry.baseBeat.dialogue !== entry.targetBeat.dialogue && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                                <div className="p-2 rounded bg-[#1d1016] border border-[#ff4d6d]/25 text-[#fecdd3]">
                                  <div className="text-[9px] uppercase font-bold text-[#fb7185] mb-0.5">
                                    Checkpoint
                                  </div>
                                  {entry.baseBeat.dialogue || '(empty)'}
                                </div>
                                <div className="p-2 rounded bg-[#0f2119] border border-[#22c55e]/25 text-[#bbf7d0]">
                                  <div className="text-[9px] uppercase font-bold text-[#4ade80] mb-0.5">
                                    Current
                                  </div>
                                  {entry.targetBeat.dialogue || '(empty)'}
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
