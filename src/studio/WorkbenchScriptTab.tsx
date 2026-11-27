import React, { Suspense } from 'react';
import { Check, Copy, FileJson, Upload } from 'lucide-react';
import { EpisodeScript } from './types';

const AiDirectorPanel = React.lazy(() =>
  import('./AiDirectorPanel').then((m) => ({ default: m.AiDirectorPanel }))
);

interface WorkbenchScriptTabProps {
  episode: EpisodeScript;
  copiedPrompt: boolean;
  jsonError: string | null;
  jsonDraft: string;
  jsonAppliedMsg: boolean;
  jsonImportInputRef: React.RefObject<HTMLInputElement | null>;
  onGeneratedEpisode: (nextEp: EpisodeScript) => void;
  onCopyPrompt: () => void;
  onChangeJsonDraft: (next: string) => void;
  onImportChapterJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportChapterJson: () => void;
  onApplyJson: () => void;
}

export const WorkbenchScriptTab: React.FC<WorkbenchScriptTabProps> = React.memo(
  ({
    episode,
    copiedPrompt,
    jsonError,
    jsonDraft,
    jsonAppliedMsg,
    jsonImportInputRef,
    onGeneratedEpisode,
    onCopyPrompt,
    onChangeJsonDraft,
    onImportChapterJson,
    onExportChapterJson,
    onApplyJson,
  }) => {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 gap-3">
        <Suspense
          fallback={
            <div className="p-3 rounded-lg bg-[#13182b] border border-white/10 text-xs text-[#9aa3bd]">
              Loading AI Director…
            </div>
          }
        >
          <AiDirectorPanel
            currentEpisode={episode}
            onGeneratedEpisode={onGeneratedEpisode}
          />
        </Suspense>

        <div className="p-3 rounded-lg bg-[#13182b] border border-white/10 space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-white">Or Orchestrate Manually With Any AI</span>
            <button
              type="button"
              onClick={onCopyPrompt}
              className="h-8 px-3 rounded-md bg-[#1a2138] hover:bg-[#232c4a] border border-white/15 text-[#eef1f8] text-[11px] font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5 text-[#4ade80]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPrompt ? 'Copied Prompt' : 'Copy AI Prompt'}</span>
            </button>
          </div>
          <p className="text-[11px] text-[#8e97b0] leading-relaxed">
            Zero-key option: copy the Director System Prompt into any AI chat for Indian or World public-domain folklore, then paste or import the JSON below.
          </p>
        </div>

        {jsonError && (
          <div className="px-3 py-2 rounded-md bg-[#3d1220] border border-[#ff4d6d]/50 text-xs text-[#ffb3c1] shrink-0">
            {jsonError}
          </div>
        )}

        <textarea
          value={jsonDraft}
          onChange={(e) => onChangeJsonDraft(e.target.value)}
          spellCheck={false}
          className="flex-1 min-h-[200px] w-full p-3 rounded-lg bg-[#090c16] border border-white/12 font-mono-tabular text-[11px] leading-relaxed text-[#d9e2f5] focus:outline-none focus:border-[#f2c85b] resize-none"
        />

        <div className="grid grid-cols-2 gap-2 shrink-0">
          <input
            ref={jsonImportInputRef}
            type="file"
            accept=".json,application/json"
            onChange={onImportChapterJson}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => jsonImportInputRef.current?.click()}
            className="h-9 px-3 rounded-md bg-[#161b2e] hover:bg-[#202742] border border-white/12 text-xs font-semibold text-[#eef1f8] inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import .json</span>
          </button>
          <button
            type="button"
            onClick={onExportChapterJson}
            className="h-9 px-3 rounded-md bg-[#161b2e] hover:bg-[#202742] border border-white/12 text-xs font-semibold text-[#eef1f8] inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Save .json</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onApplyJson}
          className="h-10 w-full rounded-md bg-[#f2c85b] hover:bg-[#f7d577] text-[#110e0a] text-xs font-bold transition-colors shrink-0 cursor-pointer"
        >
          {jsonAppliedMsg ? 'Episode Script Loaded' : 'Validate & Load Episode JSON'}
        </button>
      </div>
    );
  }
);

WorkbenchScriptTab.displayName = 'WorkbenchScriptTab';
