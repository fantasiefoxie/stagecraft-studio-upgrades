import React, { Suspense, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileJson,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react';
import {
  ARCHETYPE_CATALOG,
  AspectMode,
  EpisodeScript,
  PROP_CATALOG,
  RENDER_STYLE_CATALOG,
  RenderStyleId,
  STAGE_CATALOG,
} from './types';
import {
  buildRoutedDirectorSkillMd,
  buildStagecraftDirectorSkillMd,
} from './directorSkillExport';
import {
  STORY_REMIX_BLUEPRINTS,
  StoryRemixBlueprintId,
  remixStoryBlueprint,
} from './storyRemixEngine';

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

async function copyTextSafe(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
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
    const [copiedSkill, setCopiedSkill] = useState(false);
    const [copiedRoutedSkill, setCopiedRoutedSkill] = useState(false);
    const [routeQuery, setRouteQuery] = useState('cyberpunk rain detective');

    // Upgrade 35: Story Remix Blueprint quick-generator drawer
    const [remixOpen, setRemixOpen] = useState(false);
    const [remixBlueprintId, setRemixBlueprintId] = useState<StoryRemixBlueprintId>('cozy_bedtime_fable');
    const [remixTitle, setRemixTitle] = useState('');
    const [remixThemeQuery, setRemixThemeQuery] = useState('cozy storybook forest fable lantern woodland');
    const [remixAspect, setRemixAspect] = useState<AspectMode>('16:9');
    const [remixRenderStyle, setRemixRenderStyle] = useState<RenderStyleId | 'auto'>('auto');
    const [remixGeneratedNotice, setRemixGeneratedNotice] = useState(false);

    const activeBlueprint =
      STORY_REMIX_BLUEPRINTS.find((b) => b.id === remixBlueprintId) || STORY_REMIX_BLUEPRINTS[0];

    const handleCopySkillMd = async () => {
      await copyTextSafe(buildStagecraftDirectorSkillMd());
      setCopiedSkill(true);
      window.setTimeout(() => setCopiedSkill(false), 2200);
    };

    const handleCopyRoutedSkillMd = async () => {
      const md = buildRoutedDirectorSkillMd({
        query: routeQuery.trim() || episode.title || 'cinematic drama',
        renderStyle: episode.visualStyle?.renderStyle,
      });
      await copyTextSafe(md);
      setCopiedRoutedSkill(true);
      window.setTimeout(() => setCopiedRoutedSkill(false), 2200);
    };

    const handleDownloadSkillMd = () => {
      const md = buildStagecraftDirectorSkillMd();
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SKILL.md';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    };

    const handleGenerateRemix = () => {
      const nextEp = remixStoryBlueprint({
        blueprintId: remixBlueprintId,
        topicTitle: remixTitle.trim() || `${activeBlueprint.label}: ${remixThemeQuery.trim() || 'New Story'}`,
        themeQuery: remixThemeQuery.trim() || activeBlueprint.defaultThemeQuery,
        aspect: remixAspect,
        renderStyle: remixRenderStyle === 'auto' ? undefined : remixRenderStyle,
      });
      onGeneratedEpisode(nextEp);
      setRemixGeneratedNotice(true);
      window.setTimeout(() => setRemixGeneratedNotice(false), 2200);
    };

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

        {/* Upgrade 35: Instant Offline Story Remix Blueprint Generator */}
        <div className="rounded-lg bg-[#13182b] border border-white/10 shrink-0 overflow-hidden">
          <button
            type="button"
            onClick={() => setRemixOpen((v) => !v)}
            className="w-full px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
              <Wand2 className="w-3.5 h-3.5 text-[#f2c85b]" />
              <span>Remix Blueprint Generator (12 Offline Templates)</span>
            </span>
            {remixOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#9aa3bd]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#9aa3bd]" />
            )}
          </button>

          {remixOpen && (
            <div className="px-3 pb-3 pt-1 space-y-2 border-t border-white/10">
              <p className="text-[11px] text-[#8e97b0] leading-relaxed">
                Zero-API deterministic episode builder: pick a proven narrative blueprint + theme prompt and BM25 auto-casts distinct archetypes, stages, props, moods &amp; visual polish.
              </p>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#9aa3bd]">
                  Story Blueprint
                </label>
                <select
                  value={remixBlueprintId}
                  onChange={(e) => {
                    const nextId = e.target.value as StoryRemixBlueprintId;
                    setRemixBlueprintId(nextId);
                    const bp = STORY_REMIX_BLUEPRINTS.find((b) => b.id === nextId);
                    if (bp) setRemixThemeQuery(bp.defaultThemeQuery);
                  }}
                  className="w-full h-8 px-2 rounded-md bg-[#090c16] border border-white/12 text-xs text-white focus:outline-none focus:border-[#f2c85b]"
                >
                  {STORY_REMIX_BLUEPRINTS.map((bp) => (
                    <option key={bp.id} value={bp.id}>
                      {bp.label} ({bp.beatArcLabels.length} beats · {bp.defaultAspect})
                    </option>
                  ))}
                </select>
                <div className="text-[10px] text-[#7e89a8]">{activeBlueprint.tagline}</div>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                <input
                  type="text"
                  value={remixTitle}
                  onChange={(e) => setRemixTitle(e.target.value)}
                  placeholder="Episode Title (optional, e.g. The Clockwork Heist)"
                  className="w-full h-8 px-2.5 rounded-md bg-[#090c16] border border-white/12 text-xs text-white placeholder-[#6f7894] focus:outline-none focus:border-[#f2c85b]"
                />
                <input
                  type="text"
                  value={remixThemeQuery}
                  onChange={(e) => setRemixThemeQuery(e.target.value)}
                  placeholder="Theme / World Prompt (e.g. cyberpunk rain detective, thunder god olympus)"
                  className="w-full h-8 px-2.5 rounded-md bg-[#090c16] border border-white/12 text-xs text-white placeholder-[#6f7894] focus:outline-none focus:border-[#f2c85b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex rounded-md overflow-hidden border border-white/12 bg-[#090c16] h-8">
                  {(['16:9', '9:16'] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setRemixAspect(a)}
                      className={`flex-1 text-[11px] font-bold transition-colors cursor-pointer ${
                        remixAspect === a
                          ? 'bg-[#f2c85b] text-[#110e0a]'
                          : 'text-[#9aa3bd] hover:text-white'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <select
                  value={remixRenderStyle}
                  onChange={(e) => setRemixRenderStyle(e.target.value as RenderStyleId | 'auto')}
                  className="h-8 px-2 rounded-md bg-[#090c16] border border-white/12 text-[11px] text-white focus:outline-none focus:border-[#f2c85b]"
                >
                  <option value="auto">Auto Art Engine ({activeBlueprint.recommendedStyle})</option>
                  {RENDER_STYLE_CATALOG.map((rs) => (
                    <option key={rs.id} value={rs.id}>
                      {rs.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerateRemix}
                className="h-8 w-full rounded-md bg-[#f2c85b] hover:bg-[#f7d577] text-[#110e0a] text-[11px] font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {remixGeneratedNotice ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Remix Episode Loaded on Stage!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Remix Episode</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Manual AI Orchestration + Full & Lean Routed SKILL.md */}
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
            Zero-key option: export a full coding-agent <code className="text-[#f2c85b]">SKILL.md</code> ({ARCHETYPE_CATALOG.length} archetypes, {STAGE_CATALOG.length} stages, {PROP_CATALOG.length - 1} props &amp; {RENDER_STYLE_CATALOG.length} art engines) or copy a token-saving BM25-routed skill for your topic.
          </p>
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={handleCopySkillMd}
              className="h-7 px-2.5 rounded-md bg-[#161f38] hover:bg-[#202d50] border border-[#f2c85b]/35 text-[#f7e7bc] text-[10px] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedSkill ? <Check className="w-3 h-3 text-[#4ade80]" /> : <BookOpen className="w-3 h-3 text-[#f2c85b]" />}
              <span>{copiedSkill ? 'Copied SKILL.md' : 'Copy Director SKILL.md'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadSkillMd}
              className="h-7 px-2.5 rounded-md bg-[#161f38] hover:bg-[#202d50] border border-cyan-400/30 text-cyan-100 text-[10px] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3 h-3 text-cyan-300" />
              <span>Download SKILL.md</span>
            </button>
          </div>

          {/* Upgrade 33: Compact Lean Routed SKILL.md row */}
          <div className="flex items-center gap-1.5 pt-1 border-t border-white/8">
            <input
              type="text"
              value={routeQuery}
              onChange={(e) => setRouteQuery(e.target.value)}
              placeholder="Story topic / genre (e.g. samurai temple duel)"
              className="flex-1 min-w-0 h-7 px-2 rounded-md bg-[#090c16] border border-white/12 text-[11px] text-white placeholder-[#6f7894] focus:outline-none focus:border-emerald-400"
            />
            <button
              type="button"
              onClick={handleCopyRoutedSkillMd}
              className="h-7 px-2.5 rounded-md bg-[#122624] hover:bg-[#193532] border border-emerald-400/35 text-emerald-100 text-[10px] font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedRoutedSkill ? (
                <Check className="w-3 h-3 text-[#4ade80]" />
              ) : (
                <Sparkles className="w-3 h-3 text-emerald-300" />
              )}
              <span>{copiedRoutedSkill ? 'Copied Lean' : 'Copy Lean Routed SKILL.md'}</span>
            </button>
          </div>
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
