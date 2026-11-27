import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  LayoutGrid,
  Wand2,
} from 'lucide-react';
import { AspectMode, EpisodeScript } from './types';
import {
  ContactSheetRenderResult,
  autoFixEpisodeVisualQa,
  renderStoryboardContactSheetCanvas,
} from './storyboardQa';
import {
  auditEpisodeContinuity,
  autoFixEpisodeContinuity,
} from './continuityAuditor';
import { scoreEpisodeVisualCraft } from './visualScorecard';

interface StoryboardQaModalProps {
  open: boolean;
  episode: EpisodeScript;
  aspect: AspectMode;
  showCaptions: boolean;
  expressionsEnabled: boolean;
  onClose: () => void;
  onJumpToBeat: (beatIndex: number) => void;
  onApplyFixedEpisode?: (fixedEpisode: EpisodeScript, summary: string) => void;
}

const AUTO_FIXABLE_CODES = new Set([
  'caption_overflow',
  'pacing_fast',
  'motion_card_empty',
  'action_cue_orphan_cast',
  'action_cue_out_of_range',
  'static_shot_streak',
]);

export const StoryboardQaModal: React.FC<StoryboardQaModalProps> = ({
  open,
  episode,
  aspect,
  showCaptions,
  expressionsEnabled,
  onClose,
  onJumpToBeat,
  onApplyFixedEpisode,
}) => {
  const [result, setResult] = useState<ContactSheetRenderResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFixNote, setLastFixNote] = useState<string | null>(null);

  const runScan = () => {
    setBusy(true);
    setError(null);
    // Yield a frame so modal mounts smoothly before synchronous canvas rasterization
    window.setTimeout(() => {
      try {
        const res = renderStoryboardContactSheetCanvas(episode, aspect, {
          showCaptions,
          expressionsEnabled,
        });
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render storyboard contact sheet.');
      } finally {
        setBusy(false);
      }
    }, 30);
  };

  useEffect(() => {
    if (!open) {
      setLastFixNote(null);
      return;
    }
    runScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, episode, aspect, showCaptions, expressionsEnabled]);

  if (!open) return null;

  const handleDownloadPng = () => {
    if (!result) return;
    const safeId = episode.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60) || 'episode';
    const a = document.createElement('a');
    a.href = result.dataUrl;
    a.download = `${safeId}_contact_sheet_${aspect.replace(':', 'x')}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleAutoFix = () => {
    if (!onApplyFixedEpisode) return;
    const fixed = autoFixEpisodeVisualQa(episode, aspect);
    if (fixed.fixedCount === 0) {
      setLastFixNote('No auto-fixable layout or cue issues found.');
      return;
    }
    const summary = `QA Auto-Fix (${fixed.fixedCount} ${fixed.fixedCount === 1 ? 'fix' : 'fixes'})`;
    setLastFixNote(`Applied ${fixed.fixedCount} safe fix(es): ${fixed.fixesApplied.slice(0, 3).join(' · ')}`);
    onApplyFixedEpisode(fixed.episode, summary);
  };

  const continuityReport = useMemo(() => auditEpisodeContinuity(episode), [episode]);
  const visualScorecard = useMemo(() => scoreEpisodeVisualCraft(episode), [episode]);

  const handleAutoFixContinuity = () => {
    if (!onApplyFixedEpisode) return;
    const fixed = autoFixEpisodeContinuity(episode);
    if (fixed.fixedCount === 0) {
      setLastFixNote('No continuity or pacing issues needed fixing.');
      return;
    }
    const summary = `Continuity Auto-Fix (${fixed.fixedCount} ${fixed.fixedCount === 1 ? 'fix' : 'fixes'})`;
    setLastFixNote(`Continuity repaired (${fixed.fixedCount}): ${fixed.fixesApplied.slice(0, 3).join(' · ')}`);
    onApplyFixedEpisode(fixed.episode, summary);
  };

  const report = result?.qaReport;
  const fixableCount = report
    ? report.issues.filter((iss) => AUTO_FIXABLE_CODES.has(iss.code)).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[90vh] rounded-xl bg-[#0e1222] border border-white/15 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 bg-[#12172b] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <LayoutGrid className="w-4 h-4 text-[#f2c85b] shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate">
                Storyboard Contact Sheet &amp; Pre-Render Visual QA
              </h2>
              <p className="text-[11px] text-[#8e97b0] truncate">
                Deterministic midpoint keyframe scan across all scenes ({aspect}) — catches blank/frozen frames, caption overflow, and cue errors before MP4 export.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onApplyFixedEpisode && fixableCount > 0 && (
              <button
                type="button"
                disabled={busy}
                onClick={handleAutoFix}
                className="h-8 px-3 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/45 text-xs font-bold text-emerald-200 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Automatically repair safe caption density, pacing, empty motion cards, invalid cues, and repeated shots (Undoable via Ctrl+Z)"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Fix Visual QA ({fixableCount})</span>
              </button>
            )}
            {onApplyFixedEpisode && continuityReport.counts.autoFixable > 0 && (
              <button
                type="button"
                disabled={busy}
                onClick={handleAutoFixContinuity}
                className="h-8 px-3 rounded-md bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/45 text-xs font-bold text-sky-200 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Auto-fix 180° axis flips, flat pacing stretches, reading-speed mismatches, and missing stage speakers"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Fix Continuity ({continuityReport.counts.autoFixable})</span>
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={runScan}
              className="h-8 px-2.5 rounded-md bg-[#181f38] hover:bg-[#222c4f] border border-white/12 text-xs font-semibold text-[#eef1f8] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
              <span>Rescan</span>
            </button>
            <button
              type="button"
              disabled={!result || busy}
              onClick={handleDownloadPng}
              className="h-8 px-3 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] disabled:opacity-45 text-[#110e0a] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close QA modal"
              className="h-8 w-8 rounded-md bg-white/6 hover:bg-white/12 text-[#b4bcd4] inline-flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {lastFixNote && (
          <div className="px-5 py-2 bg-emerald-500/12 border-b border-emerald-400/25 text-[11px] text-emerald-200 flex items-center justify-between gap-2 shrink-0">
            <span className="truncate">{lastFixNote} (Undo anytime with Ctrl/Cmd+Z)</span>
            <button
              type="button"
              onClick={() => setLastFixNote(null)}
              className="text-emerald-300/80 hover:text-emerald-100 text-[10px] font-semibold cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Contact Sheet Preview */}
          <div className="lg:col-span-8 flex flex-col gap-2">
            <div className="rounded-lg bg-[#090b14] border border-white/10 p-2 min-h-[300px] flex items-center justify-center overflow-auto">
              {busy ? (
                <div className="text-xs text-[#9aa3bd] flex items-center gap-2 py-12">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#f2c85b]" />
                  <span>Rendering deterministic keyframes &amp; scanning luminance deltas…</span>
                </div>
              ) : error ? (
                <div className="text-xs text-[#fca5a5] p-4">{error}</div>
              ) : result ? (
                <img
                  src={result.dataUrl}
                  alt={`${episode.title} storyboard contact sheet`}
                  className="w-full h-auto rounded border border-white/10"
                />
              ) : null}
            </div>
          </div>

          {/* QA Gate Diagnostics Panel */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            {report && (
              <>
                <div className="rounded-lg bg-[#13182c] border border-white/10 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#9aa3bd]">Pre-Render QA Gate</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold inline-flex items-center gap-1 ${
                        report.passed
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-400/35'
                      }`}
                    >
                      {report.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      {report.score}/100 · {report.passed ? 'READY' : 'REVIEW'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="rounded bg-[#0d1120] p-2 border border-white/6">
                      <div className="text-sm font-bold text-white font-mono">{report.beatCount}</div>
                      <div className="text-[10px] text-[#8e97b0]">Scenes</div>
                    </div>
                    <div className="rounded bg-[#0d1120] p-2 border border-white/6">
                      <div className="text-sm font-bold text-red-300 font-mono">{report.errorCount}</div>
                      <div className="text-[10px] text-[#8e97b0]">Errors</div>
                    </div>
                    <div className="rounded bg-[#0d1120] p-2 border border-white/6">
                      <div className="text-sm font-bold text-amber-300 font-mono">{report.warnCount}</div>
                      <div className="text-[10px] text-[#8e97b0]">Warnings</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-[#13182c] border border-white/10 p-3 flex-1 flex flex-col min-h-[220px]">
                  <div className="text-xs font-semibold text-white mb-2">
                    Findings ({report.issues.length})
                  </div>
                  {report.issues.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6 gap-1.5">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      <div className="text-xs font-semibold text-emerald-200">All scenes passed Visual QA</div>
                      <div className="text-[11px] text-[#8e97b0]">
                        Zero blank frames, healthy contrast, clean captions &amp; valid cues.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                      {report.issues.map((iss, idx) => (
                        <button
                          key={`${iss.beatId}_${iss.code}_${idx}`}
                          type="button"
                          onClick={() => {
                            if (iss.beatIndex >= 0) {
                              onJumpToBeat(iss.beatIndex);
                              onClose();
                            }
                          }}
                          className="w-full text-left rounded-md bg-[#0c101e] hover:bg-[#19213c] border border-white/8 p-2 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                            {iss.severity === 'error' ? (
                              <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            ) : iss.severity === 'warn' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            ) : (
                              <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            )}
                            <span className="text-white truncate">
                              Scene {iss.beatIndex + 1}: {iss.beatTitle}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#9aa3bd] mt-0.5 leading-snug">
                            {iss.message}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Upgrade 5: Director's Continuity & Pacing Auditor */}
            <div className="rounded-lg bg-[#13182c] border border-white/10 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-white">
                  Director&apos;s Continuity &amp; Pacing
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono-tabular ${
                    continuityReport.passed
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-400/35'
                  }`}
                >
                  {continuityReport.score}/100
                </span>
              </div>
              <p className="text-[10px] text-[#9aa3bd] leading-snug">{continuityReport.summary}</p>
              {continuityReport.issues.length > 0 && (
                <div className="space-y-1.5 max-h-[210px] overflow-y-auto pr-1">
                  {continuityReport.issues.map((ci) => (
                    <button
                      key={ci.id}
                      type="button"
                      onClick={() => {
                        onJumpToBeat(ci.beatIdx);
                        onClose();
                      }}
                      className="w-full text-left rounded-md bg-[#0c101e] hover:bg-[#19213c] border border-white/8 p-2 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                        {ci.severity === 'error' ? (
                          <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                        ) : ci.severity === 'warning' ? (
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                        ) : (
                          <Info className="w-3 h-3 text-sky-400 shrink-0" />
                        )}
                        <span className="text-white truncate">
                          Scene {ci.beatIdx + 1}: {ci.beatTitle}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#9aa3bd] mt-0.5 leading-snug">{ci.message}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Upgrade 26: Calibrated 0-3 Visual Craft Scorecard */}
            <div className="rounded-lg bg-[#13182c] border border-white/10 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-white">
                  Visual Craft Scorecard (0–3)
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono-tabular ${
                    visualScorecard.totalScore >= 14
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
                      : visualScorecard.totalScore >= 9
                        ? 'bg-sky-500/15 text-sky-300 border border-sky-400/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-400/35'
                  }`}
                >
                  {visualScorecard.totalScore}/{visualScorecard.maxScore} · {visualScorecard.gradeLabel}
                </span>
              </div>
              <div className="space-y-1.5">
                {visualScorecard.categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="rounded-md bg-[#0c101e] border border-white/8 p-2 space-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <span className="font-semibold text-white truncate">{cat.label}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono-tabular font-bold shrink-0 ${
                          cat.score >= 3
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : cat.score === 2
                              ? 'bg-sky-500/20 text-sky-300'
                              : cat.score === 1
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {cat.score}/3 · {cat.band}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8e97b0] leading-snug">{cat.rationale}</p>
                    {cat.score < 2 && cat.suggestion && (
                      <p className="text-[10px] text-amber-200/90 leading-snug">
                        Tip: {cat.suggestion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
