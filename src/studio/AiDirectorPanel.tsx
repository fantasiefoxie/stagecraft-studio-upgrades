import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Compass, Copy, Globe, Layers, Lock, Meh, Plus, RefreshCw, Smile, Sparkles, Square, Unlock, Wand2 } from 'lucide-react';
import {
  ARCHETYPE_CATALOG,
  ArchetypeId,
  EpisodeScript,
  RENDER_STYLE_CATALOG,
  RenderStyleId,
  STAGE_CATALOG,
  StageId,
} from './types';
import { LANGUAGE_CATALOG, LanguageCode, resolveEpisodeLanguage } from './i18n';
import { CAST_BIBLE_UPDATED_EVENT, loadCastBible } from './castBible';
import {
  PlaybookId,
  REGIONAL_PLAYBOOKS,
  StageBlueprint,
  analyzeStoryReadiness,
  buildGuidedDirectorPrompt,
  compileLiteOrFullToEpisode,
  healAndParseLlmJson,
  normalizeStageBlueprint,
} from './llmDirectorKit';
import {
  LLM_TIER_PROFILES,
  LlmTierId,
  STORY_ARC_TEMPLATES,
  StoryArcId,
  applyDialoguePunchUp,
  auditScriptWriting,
  auditStoryContinuity,
  autoFixStoryContinuity,
  buildDialoguePunchUpPrompt,
  computeDeterministicSeed,
  detectStoryArcFromText,
  getLlmTierProfile,
  getStoryArcById,
} from './scriptCraft';
import {
  applyAiEmotionDirection,
  auditEpisodeEmotions,
  buildEmotionDirectionPrompt,
  choreographEpisodeEmotions,
} from './emotionChoreographer';
import {
  DIRECTOR_LENGTH_PRESETS,
  DirectorLengthTarget,
  appendActBeatsToEpisode,
  buildAppendActPrompt,
  buildLongFormActBeatsPrompt,
  buildLongFormOutlinePrompt,
  buildRegenerateActPrompt,
  formatLongDuration,
  getDirectorLengthPreset,
  normalizeLongFormOutline,
  partitionEpisodeIntoChapters,
  replaceChapterBeatsInEpisode,
  stitchLongFormActsIntoEpisode,
  summarizeActForContinuity,
} from './longFormEngine';

interface AiDirectorPanelProps {
  currentEpisode: EpisodeScript;
  onGeneratedEpisode: (episode: EpisodeScript) => void;
}

type DirectorWorkflowMode = 'lite' | 'two_step' | 'full';
type LlmProviderChoice = 'gemini' | 'openai' | 'anthropic' | 'custom_server' | 'ollama';

export const AiDirectorPanel: React.FC<AiDirectorPanelProps> = ({
  currentEpisode,
  onGeneratedEpisode,
}) => {
  const [storyIdea, setStoryIdea] = useState('');
  const [provider, setProvider] = useState<LlmProviderChoice>('gemini');
  const [llmTier, setLlmTier] = useState<LlmTierId>('medium_cloud');
  const [workflowMode, setWorkflowMode] = useState<DirectorWorkflowMode>('lite');
  const [playbookChoice, setPlaybookChoice] = useState<PlaybookId | 'auto'>('auto');
  const [arcChoice, setArcChoice] = useState<StoryArcId | 'auto'>('auto');
  const [lengthTarget, setLengthTarget] = useState<DirectorLengthTarget>('standard_12');
  const [renderStyleOverride, setRenderStyleOverride] = useState<RenderStyleId | 'auto'>('auto');
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>(() =>
    resolveEpisodeLanguage(currentEpisode).code
  );
  const [lockSeed, setLockSeed] = useState(true);
  const [perFrameExpressions, setPerFrameExpressions] = useState(true);
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434/api/chat');
  const [ollamaModel, setOllamaModel] = useState('qwen2.5:7b');

  const [blueprint, setBlueprint] = useState<StageBlueprint | null>(null);
  const [busyStep, setBusyStep] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedGuided, setCopiedGuided] = useState(false);
  const [selectedActIdx, setSelectedActIdx] = useState<number>(0);
  const [actDirectionNote, setActDirectionNote] = useState('');
  const longFormCancelRef = useRef(false);

  const lengthPreset = useMemo(() => getDirectorLengthPreset(lengthTarget), [lengthTarget]);
  const beatTargetNum = lengthPreset.totalBeats;
  const activeChapters = useMemo(
    () => partitionEpisodeIntoChapters(currentEpisode, 200),
    [currentEpisode]
  );

  useEffect(() => {
    if (selectedActIdx >= activeChapters.length) {
      setSelectedActIdx(0);
    }
  }, [activeChapters.length, selectedActIdx]);

  const [providersReady, setProvidersReady] = useState({
    gemini: false,
    openai: false,
    anthropic: false,
    custom_server: false,
  });

  useEffect(() => {
    fetch('/api/llm/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setProvidersReady({
            gemini: Boolean(d.gemini),
            openai: Boolean(d.openai),
            anthropic: Boolean(d.anthropic),
            custom_server: Boolean(d.custom_server),
          });
        }
      })
      .catch(() => {});
  }, []);

  const [castBible, setCastBible] = useState(() => loadCastBible());
  useEffect(() => {
    const syncBible = () => setCastBible(loadCastBible());
    window.addEventListener(CAST_BIBLE_UPDATED_EVENT, syncBible);
    return () => window.removeEventListener(CAST_BIBLE_UPDATED_EVENT, syncBible);
  }, []);
  const tierProfile = useMemo(() => getLlmTierProfile(llmTier), [llmTier]);

  const readiness = useMemo(
    () => analyzeStoryReadiness(storyIdea, playbookChoice, castBible),
    [storyIdea, playbookChoice, castBible]
  );

  const activeArc = useMemo(
    () =>
      arcChoice === 'auto'
        ? detectStoryArcFromText(storyIdea || currentEpisode.title, Math.min(20, beatTargetNum))
        : getStoryArcById(arcChoice),
    [arcChoice, storyIdea, currentEpisode.title, beatTargetNum]
  );

  const scriptCraft = useMemo(() => auditScriptWriting(currentEpisode), [currentEpisode]);
  const continuity = useMemo(() => auditStoryContinuity(currentEpisode), [currentEpisode]);
  const emotionAudit = useMemo(() => auditEpisodeEmotions(currentEpisode), [currentEpisode]);
  const totalExpressionCues = useMemo(
    () =>
      currentEpisode.beats.reduce(
        (sum, b) =>
          sum +
          (b.expressionCues?.length || 0) +
          b.actors.reduce((aSum, a) => aSum + (a.expressionTrack?.length || 0), 0),
        0
      ),
    [currentEpisode]
  );

  const activeRenderStyle: RenderStyleId =
    renderStyleOverride === 'auto' ? readiness.playbook.renderStyle : renderStyleOverride;

  const handleSelectTier = (nextTier: LlmTierId) => {
    setLlmTier(nextTier);
    const prof = getLlmTierProfile(nextTier);
    setWorkflowMode(prof.recommendedMode);
    if (nextTier === 'basic_local' && lengthTarget === 'deep_20') {
      setLengthTarget('standard_12');
    }
  };

  const invokeLlm = async (
    systemPrompt: string,
    userPrompt: string,
    temperature: number,
    seedSourceText: string
  ): Promise<string> => {
    const seed = lockSeed ? computeDeterministicSeed(seedSourceText) : undefined;

    if (provider === 'ollama') {
      let parsedOllama: URL;
      try {
        parsedOllama = new URL(ollamaUrl.trim());
        if (parsedOllama.protocol !== 'http:' && parsedOllama.protocol !== 'https:') {
          throw new Error('Ollama URL must use http:// or https://');
        }
      } catch {
        throw new Error('Enter a valid Local Ollama URL (e.g. http://localhost:11434/api/chat).');
      }
      const res = await fetch(parsedOllama.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaModel,
          stream: false,
          format: 'json',
          options: {
            temperature,
            ...(seed !== undefined ? { seed } : {}),
          },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });
      if (!res.ok) throw new Error(`Local Ollama error (${res.status})`);
      const data = (await res.json()) as { message?: { content?: string } };
      return data.message?.content || '';
    }

    const res = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        systemPrompt,
        userPrompt,
        jsonMode: true,
        temperature,
        ...(seed !== undefined ? { seed } : {}),
      }),
    });
    const data = (await res.json()) as { text?: string; error?: string };
    if (!res.ok) throw new Error(data.error || 'AI Director request failed.');
    return data.text || '';
  };

  const parseAndCompileWithAutoRepair = async (rawText: string, storyHint: string) => {
    const tryCompile = (txt: string) => {
      const healed = healAndParseLlmJson(txt);
      if (healed.ok === false) return { ok: false as const, error: healed.error };
      const compiled = compileLiteOrFullToEpisode(healed.data, {
        playbookOverride: playbookChoice,
        preferredRenderStyle: activeRenderStyle,
        storyHint,
        castBible,
        ensureBookends: true,
        targetLanguage,
      });
      if (compiled.ok === false) return { ok: false as const, error: compiled.error };
      return {
        ok: true as const,
        script: compiled.script,
        notes: [...healed.healedNotes, ...compiled.autoFixes],
      };
    };

    const firstPass = tryCompile(rawText);
    if (firstPass.ok) return firstPass;

    // 1-shot silent self-repair pass at ultra-low temperature (0.12)
    setBusyStep('Auto-repairing JSON structure...');
    const repairSystem = buildGuidedDirectorPrompt({
      mode: 'repair',
      playbook: readiness.playbook,
      repairContext: { rawOutput: rawText, errorMessage: firstPass.error },
    });
    const repairedRaw = await invokeLlm(
      repairSystem,
      'Return the repaired valid JSON object now.',
      tierProfile.blueprintTemp,
      storyHint
    );
    const secondPass = tryCompile(repairedRaw);
    if (secondPass.ok) {
      return {
        ...secondPass,
        notes: ['auto-repaired via 2nd pass', ...secondPass.notes],
      };
    }
    throw new Error(secondPass.error || firstPass.error);
  };

  const handleGenerateBlueprint = async () => {
    const promptInput = storyIdea.trim();
    if (!promptInput) {
      setFeedback('Enter a public-domain folklore title, moral idea, or raw Gutenberg fable first.');
      return;
    }
    setBusyStep(`Step 1 (temp ${tierProfile.blueprintTemp}): Designing Cast & Stage Blueprint...`);
    setFeedback(null);
    try {
      const systemPrompt = buildGuidedDirectorPrompt({
        mode: 'blueprint',
        playbook: readiness.playbook,
        preferredRenderStyle: activeRenderStyle,
        castBible,
        targetLanguage,
      });
      const userPrompt = `Design the Cast & Stage Blueprint JSON for this story:\n"""\n${promptInput}\n"""`;
      const rawText = await invokeLlm(
        systemPrompt,
        userPrompt,
        tierProfile.blueprintTemp,
        promptInput
      );
      const healed = healAndParseLlmJson(rawText);
      if (healed.ok === false) throw new Error(healed.error);
      const bp = normalizeStageBlueprint(healed.data, playbookChoice, promptInput);
      setBlueprint(bp);
      setFeedback(
        `Blueprint locked: ${bp.cast.length} cast & ${bp.stages.length} stages. Tweak below or click Step 2!`
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Blueprint generation failed.');
    } finally {
      setBusyStep(null);
    }
  };

  const handleGenerateFromBlueprint = async () => {
    if (!blueprint) return;
    const promptInput = storyIdea.trim() || blueprint.title;
    setBusyStep(`Step 2 (temp ${tierProfile.sceneTemp}): Writing ${activeArc.shortLabel} beats...`);
    setFeedback(null);
    try {
      const systemPrompt = buildGuidedDirectorPrompt({
        mode: 'beats',
        playbook: readiness.playbook,
        storyArc: activeArc,
        beatTarget: Math.min(24, beatTargetNum),
        preferredRenderStyle: blueprint.renderStyle,
        blueprint,
        enablePerFrameExpressions: perFrameExpressions,
        targetLanguage,
      });
      const userPrompt = `Write ${Math.min(24, beatTargetNum)} cinematic Lite beats following the ${activeArc.shortLabel} skeleton for:\n"""\n${promptInput}\n"""\nUse ONLY the locked cast IDs and locked stage IDs.`;
      const rawText = await invokeLlm(systemPrompt, userPrompt, tierProfile.sceneTemp, promptInput);
      const result = await parseAndCompileWithAutoRepair(rawText, promptInput);
      onGeneratedEpisode(result.script);
      const polishNote =
        result.notes.length > 0 ? ` · Auto-Director: ${result.notes.slice(0, 3).join(', ')}` : '';
      setFeedback(
        `Directed "${result.script.title}" (${result.script.beats.length} scenes)${polishNote}`
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Scene generation failed.');
    } finally {
      setBusyStep(null);
    }
  };

  const handleGenerateLongForm = async (promptInput: string) => {
    longFormCancelRef.current = false;
    setFeedback(null);
    setBusyStep(
      `Pass 1/${lengthPreset.actCount + 1}: Architecting ${lengthPreset.actCount}-Act Master Outline & Cast DNA...`
    );

    try {
      const outlineReq = buildLongFormOutlinePrompt({
        storyPrompt: promptInput,
        preset: lengthPreset,
        playbookOverride: playbookChoice,
        preferredRenderStyle: renderStyleOverride === 'auto' ? undefined : renderStyleOverride,
        targetLanguage,
        castBible,
      });

      const outlineRaw = await invokeLlm(
        outlineReq.systemPrompt,
        outlineReq.userPrompt,
        tierProfile.blueprintTemp,
        `${promptInput}_outline`
      );
      const outlineHealed = healAndParseLlmJson(outlineRaw);
      if (outlineHealed.ok === false) {
        throw new Error(`Master Outline JSON error: ${outlineHealed.error}`);
      }

      const outline = normalizeLongFormOutline(outlineHealed.data, {
        preset: lengthPreset,
        playbook: outlineReq.playbook,
        preferredRenderStyle: renderStyleOverride === 'auto' ? undefined : renderStyleOverride,
        targetLanguage,
      });

      const actBeatBatches: unknown[][] = [];
      const recaps: string[] = [];

      for (let i = 0; i < outline.acts.length; i++) {
        if (longFormCancelRef.current) break;
        const act = outline.acts[i];
        setBusyStep(
          `Pass ${i + 2}/${outline.acts.length + 1}: Directing Act ${act.actNumber}/${outline.acts.length} — "${act.title}" (${act.targetBeats} scenes)...`
        );

        const actPrompt = buildLongFormActBeatsPrompt({
          outline,
          actIndex: i,
          previousRecap: recaps.slice(-3).join('\n'),
        });

        let actRaw = await invokeLlm(
          actPrompt.systemPrompt,
          actPrompt.userPrompt,
          tierProfile.sceneTemp,
          `${promptInput}_act_${i + 1}`
        );
        let parsed = healAndParseLlmJson(actRaw);

        // 1-shot auto-repair if this act returned malformed JSON
        if (parsed.ok === false) {
          setBusyStep(`Repairing Act ${act.actNumber} JSON...`);
          actRaw = await invokeLlm(
            'You are a strict JSON repair tool. Return ONLY valid JSON matching { "beats": [...] } with no markdown.',
            `Fix this malformed JSON (error: ${parsed.error}):\n\n${actRaw.slice(0, 12000)}`,
            0.05,
            `${promptInput}_act_${i + 1}_repair`
          );
          parsed = healAndParseLlmJson(actRaw);
        }

        if (parsed.ok === false) {
          throw new Error(`Act ${act.actNumber} JSON failed: ${parsed.error}`);
        }

        const dataObj = parsed.data as Record<string, unknown>;
        const rawArr = Array.isArray(dataObj?.beats)
          ? dataObj.beats
          : Array.isArray(dataObj?.scenes)
            ? dataObj.scenes
            : Array.isArray(parsed.data)
              ? (parsed.data as unknown[])
              : [];

        if (rawArr.length === 0) {
          throw new Error(`Act ${act.actNumber} returned 0 scenes.`);
        }

        actBeatBatches.push(rawArr);

        // Quick continuity summary from the act's closing dialogue lines
        const previewCompiled = compileLiteOrFullToEpisode(
          {
            title: outline.title,
            region: outline.region,
            cast: outline.cast,
            beats: rawArr,
          },
          { playbookOverride: outline.region, ensureBookends: false, targetLanguage }
        );
        if (previewCompiled.ok) {
          recaps.push(summarizeActForContinuity(act, previewCompiled.script.beats));
        } else {
          recaps.push(`Act ${act.actNumber} (${act.title}): ${act.summary}`);
        }
      }

      if (actBeatBatches.length === 0) {
        setFeedback('Long-form generation cancelled before Act 1 finished.');
        return;
      }

      setBusyStep('Stitching all acts, locking Cast DNA & calibrating pacing...');
      const stitched = stitchLongFormActsIntoEpisode({
        outline,
        actBeatBatches,
        castBible,
      });

      if (stitched.ok === false) {
        throw new Error(stitched.error);
      }

      onGeneratedEpisode(stitched.script);
      const totalDur = stitched.script.beats.reduce((s, b) => s + b.duration, 0);
      const cancelledTag = longFormCancelRef.current
        ? ` (stopped early after ${actBeatBatches.length}/${outline.acts.length} acts)`
        : '';
      setFeedback(
        `Directed Long-Form "${stitched.script.title}" — ${stitched.script.beats.length} scenes (~${formatLongDuration(totalDur)}) across ${actBeatBatches.length} acts${cancelledTag}!`
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Long-form generation failed.');
    } finally {
      setBusyStep(null);
    }
  };

  const handleOneClickDirect = async () => {
    const promptInput = storyIdea.trim();
    if (!promptInput) {
      setFeedback('Enter a public-domain folklore title, moral idea, or raw Gutenberg fable first.');
      return;
    }

    if (lengthPreset.isLongForm) {
      await handleGenerateLongForm(promptInput);
      return;
    }

    setBusyStep(`Directing ${activeArc.shortLabel} (temp ${tierProfile.sceneTemp})...`);
    setFeedback(null);
    try {
      const systemPrompt = buildGuidedDirectorPrompt({
        mode: workflowMode === 'full' ? 'full' : 'lite',
        playbook: readiness.playbook,
        storyArc: activeArc,
        beatTarget: beatTargetNum,
        preferredRenderStyle: activeRenderStyle,
        castBible,
        enablePerFrameExpressions: perFrameExpressions,
        targetLanguage,
      });
      const userPrompt = [
        `Create a vivid ${beatTargetNum}-scene Katha Studio storyboard JSON for this public-domain folklore story:`,
        `"""\n${promptInput}\n"""`,
        `Region playbook: "${readiness.playbook.id}" | Story Arc: "${activeArc.shortLabel}" | Art style: "${activeRenderStyle}"`,
        `Return ONLY valid raw JSON.`,
      ].join('\n\n');

      const rawText = await invokeLlm(systemPrompt, userPrompt, tierProfile.sceneTemp, promptInput);
      const result = await parseAndCompileWithAutoRepair(rawText, promptInput);
      onGeneratedEpisode(result.script);
      const polishNote =
        result.notes.length > 0 ? ` · Auto-Director: ${result.notes.slice(0, 3).join(', ')}` : '';
      setFeedback(
        `Directed "${result.script.title}" (${result.script.beats.length} scenes)${polishNote}`
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Episode generation failed.');
    } finally {
      setBusyStep(null);
    }
  };

  const handlePolishActiveDialogue = async () => {
    longFormCancelRef.current = false;
    setFeedback(null);
    const shouldChunk = currentEpisode.beats.length > 26;
    const chunks = shouldChunk
      ? partitionEpisodeIntoChapters(currentEpisode, 140)
      : [{ index: 0, chapterNumber: 1, title: currentEpisode.title, startBeatIdx: 0, endBeatIdx: currentEpisode.beats.length - 1, beatCount: currentEpisode.beats.length, startSec: 0, durationSec: 0, subEpisode: currentEpisode }];

    let working = currentEpisode;
    let totalUpdated = 0;
    let chaptersDone = 0;

    try {
      for (let i = 0; i < chunks.length; i++) {
        if (longFormCancelRef.current) break;
        const ch = chunks[i];
        setBusyStep(
          chunks.length > 1
            ? `Script Doctor Ch ${i + 1}/${chunks.length} (${ch.title})...`
            : `Script Doctor (temp ${tierProfile.polishTemp}): Polishing hook & banter...`
        );
        const targetSub: EpisodeScript = {
          ...working,
          beats: working.beats.slice(ch.startBeatIdx, ch.endBeatIdx + 1),
        };
        const { systemPrompt, userPrompt } = buildDialoguePunchUpPrompt(targetSub, activeArc);
        const rawText = await invokeLlm(
          systemPrompt,
          userPrompt,
          tierProfile.polishTemp,
          `${currentEpisode.id}_polish_${i}`
        );
        const healed = healAndParseLlmJson(rawText);
        if (healed.ok === false) {
          if (chunks.length > 1 && totalUpdated > 0) break;
          throw new Error(healed.error);
        }
        const applied = applyDialoguePunchUp(working, healed.data);
        working = applied.episode;
        totalUpdated += applied.updatedLines;
        chaptersDone++;
      }

      if (totalUpdated === 0) {
        throw new Error('Script Doctor returned no matching beat lines.');
      }
      onGeneratedEpisode(working);
      setFeedback(
        `Script Doctor polished ${totalUpdated} lines across ${chaptersDone}/${chunks.length} chapter(s) (all visuals, cast & camera shots stayed 100% locked!).`
      );
    } catch (err) {
      if (totalUpdated > 0) {
        onGeneratedEpisode(working);
      }
      setFeedback(err instanceof Error ? err.message : 'Dialogue polish failed.');
    } finally {
      setBusyStep(null);
    }
  };

  const handleAutoChoreographEmotions = () => {
    const res = choreographEpisodeEmotions(currentEpisode, { preserveExisting: false });
    onGeneratedEpisode(res.episode);
    setFeedback(
      `Auto-Directed ${res.totalSegments} flicker-free frame-range expression segments across ${res.updatedActors} actor appearances (speakers + listeners).`
    );
  };

  const handleAiDirectEmotions = async () => {
    longFormCancelRef.current = false;
    setFeedback(null);
    const shouldChunk = currentEpisode.beats.length > 26;
    const chunks = shouldChunk
      ? partitionEpisodeIntoChapters(currentEpisode, 140)
      : [{ index: 0, chapterNumber: 1, title: currentEpisode.title, startBeatIdx: 0, endBeatIdx: currentEpisode.beats.length - 1, beatCount: currentEpisode.beats.length, startSec: 0, durationSec: 0, subEpisode: currentEpisode }];

    let working = currentEpisode;
    let totalSegments = 0;
    let totalDirectedBeats = 0;
    let totalDirectedActors = 0;

    try {
      for (let i = 0; i < chunks.length; i++) {
        if (longFormCancelRef.current) break;
        const ch = chunks[i];
        setBusyStep(
          chunks.length > 1
            ? `Emotion Director Ch ${i + 1}/${chunks.length} (${ch.title})...`
            : `Emotion Director (temp ${tierProfile.polishTemp}): Analyzing character subtext & frame ranges...`
        );
        const targetSub: EpisodeScript = {
          ...working,
          beats: working.beats.slice(ch.startBeatIdx, ch.endBeatIdx + 1),
        };
        const { systemPrompt, userPrompt } = buildEmotionDirectionPrompt(targetSub);
        const rawText = await invokeLlm(
          systemPrompt,
          userPrompt,
          tierProfile.polishTemp,
          `${currentEpisode.id}_emotions_${i}`
        );
        const healed = healAndParseLlmJson(rawText);
        if (healed.ok === false) {
          if (chunks.length > 1 && totalDirectedActors > 0) break;
          throw new Error(healed.error);
        }
        const applied = applyAiEmotionDirection(working, healed.data);
        working = applied.episode;
        totalSegments += applied.totalSegments;
        totalDirectedBeats += applied.directedBeats;
        totalDirectedActors += applied.directedActors;
      }

      if (totalDirectedActors === 0) {
        throw new Error('AI Emotion Director returned no matching actor segments.');
      }
      onGeneratedEpisode(working);
      setFeedback(
        `AI Emotion Director choreographed ${totalSegments} subtext-aware frame ranges across ${totalDirectedBeats} scenes (${chunks.length} chapter pass${chunks.length === 1 ? '' : 'es'} · visuals & dialogue 100% locked!).`
      );
    } catch (err) {
      if (totalDirectedActors > 0) {
        onGeneratedEpisode(working);
      }
      setFeedback(err instanceof Error ? err.message : 'AI Emotion Direction failed.');
    } finally {
      setBusyStep(null);
    }
  };

  const handleRegenerateSelectedAct = async () => {
    const ch = activeChapters[selectedActIdx];
    if (!ch) return;
    setFeedback(null);
    setBusyStep(`Re-directing Ch ${ch.chapterNumber}: "${ch.title}"...`);
    try {
      const { systemPrompt, userPrompt } = buildRegenerateActPrompt({
        episode: currentEpisode,
        chapter: ch,
        directionNote: actDirectionNote,
      });
      const rawText = await invokeLlm(
        systemPrompt,
        userPrompt,
        tierProfile.sceneTemp,
        `${currentEpisode.id}_regen_ch_${ch.chapterNumber}_${Date.now()}`
      );
      const healed = healAndParseLlmJson(rawText);
      if (healed.ok === false) throw new Error(healed.error);
      const obj = healed.data as Record<string, unknown>;
      const rawBeats = Array.isArray(obj?.beats)
        ? obj.beats
        : Array.isArray(obj?.scenes)
          ? obj.scenes
          : Array.isArray(healed.data)
            ? (healed.data as unknown[])
            : [];
      const res = replaceChapterBeatsInEpisode({
        episode: currentEpisode,
        chapter: ch,
        rawNewBeats: rawBeats,
        castBible,
      });
      if (res.ok === false) throw new Error(res.error);
      onGeneratedEpisode(res.script);
      setActDirectionNote('');
      setFeedback(
        `Regenerated Chapter ${ch.chapterNumber} (${res.replacedCount} scenes) while preserving all other chapters & Cast DNA!`
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Chapter regeneration failed.');
    } finally {
      setBusyStep(null);
    }
  };

  const handleAppendNextAct = async () => {
    const nextActNumber = activeChapters.length + 1;
    setFeedback(null);
    setBusyStep(`Directing Act ${nextActNumber} (+~2m continuation)...`);
    try {
      const { systemPrompt, userPrompt } = buildAppendActPrompt({
        episode: currentEpisode,
        nextActNumber,
        directionNote: actDirectionNote,
        targetBeats: 20,
      });
      const rawText = await invokeLlm(
        systemPrompt,
        userPrompt,
        tierProfile.sceneTemp,
        `${currentEpisode.id}_append_act_${nextActNumber}_${Date.now()}`
      );
      const healed = healAndParseLlmJson(rawText);
      if (healed.ok === false) throw new Error(healed.error);
      const obj = healed.data as Record<string, unknown>;
      const rawBeats = Array.isArray(obj?.beats)
        ? obj.beats
        : Array.isArray(obj?.scenes)
          ? obj.scenes
          : Array.isArray(healed.data)
            ? (healed.data as unknown[])
            : [];
      const res = appendActBeatsToEpisode({
        episode: currentEpisode,
        nextActNumber,
        rawNewBeats: rawBeats,
        castBible,
      });
      if (res.ok === false) throw new Error(res.error);
      onGeneratedEpisode(res.script);
      setActDirectionNote('');
      const totalDur = res.script.beats.reduce((s, b) => s + b.duration, 0);
      setFeedback(
        `Appended Act ${nextActNumber} (+${res.appendedCount} scenes)! Total runtime is now ${formatLongDuration(totalDur)}.`
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Appending new act failed.');
    } finally {
      setBusyStep(null);
    }
  };

  const handleCopyGuidedPrompt = () => {
    const prompt = lengthPreset.isLongForm
      ? buildLongFormOutlinePrompt({
          storyPrompt: storyIdea.trim() || 'Insert folklore epic premise here',
          preset: lengthPreset,
          playbookOverride: playbookChoice,
          preferredRenderStyle: renderStyleOverride === 'auto' ? undefined : renderStyleOverride,
          targetLanguage,
          castBible,
        }).systemPrompt
      : buildGuidedDirectorPrompt({
          mode: workflowMode === 'full' ? 'full' : 'lite',
          playbook: readiness.playbook,
          storyArc: activeArc,
          beatTarget: beatTargetNum,
          preferredRenderStyle: activeRenderStyle,
          castBible,
          enablePerFrameExpressions: perFrameExpressions,
          targetLanguage,
        });
    const fullCopy = storyIdea.trim()
      ? `${prompt}\n\nSTORY TO DIRECT:\n"""\n${storyIdea.trim()}\n"""`
      : prompt;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(fullCopy).catch(() => {});
    }
    setCopiedGuided(true);
    setTimeout(() => setCopiedGuided(false), 2000);
  };

  return (
    <div className="p-3 rounded-lg bg-[#13182b] border border-[#f2c85b]/35 space-y-2.5 shrink-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#f2c85b] inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Guided AI Director &amp; Script Doctor</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPerFrameExpressions((v) => !v)}
            className={`h-6 px-1.5 rounded border text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer ${
              perFrameExpressions
                ? 'bg-[#251f3d] border-[#c084fc]/45 text-[#e9d5ff]'
                : 'bg-[#1b233d] border-white/15 text-[#9aa5c4]'
            }`}
            title="Instruct AI Director to write per-frame, per-character facial expression shifts (60fps expressionCues)"
          >
            {perFrameExpressions ? <Smile className="w-3 h-3" /> : <Meh className="w-3 h-3" />}
            <span>{perFrameExpressions ? 'Face AI' : 'Static'}</span>
          </button>
          <button
            type="button"
            onClick={() => setLockSeed((s) => !s)}
            className={`h-6 px-1.5 rounded border text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer ${
              lockSeed
                ? 'bg-[#1a3328] border-[#4ade80]/40 text-[#bbf7d0]'
                : 'bg-[#1b233d] border-white/15 text-[#9aa5c4]'
            }`}
            title="Lock deterministic sampling seed derived from your story text for lower variance across runs"
          >
            {lockSeed ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            <span>{lockSeed ? 'Seed' : 'Free'}</span>
          </button>
          <button
            type="button"
            onClick={handleCopyGuidedPrompt}
            className="h-6 px-2 rounded bg-[#1b233d] hover:bg-[#253054] border border-white/15 text-[10px] font-semibold text-[#eef1f8] inline-flex items-center gap-1 cursor-pointer"
            title="Copy the Region-Filtered Story-Arc Prompt + Gold Example tailored to this story"
          >
            {copiedGuided ? <Check className="w-3 h-3 text-[#4ade80]" /> : <Copy className="w-3 h-3" />}
            <span>{copiedGuided ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <textarea
        rows={2}
        value={storyIdea}
        onChange={(e) => {
          setStoryIdea(e.target.value);
          if (blueprint) setBlueprint(null);
        }}
        placeholder="Paste a folklore title or raw Gutenberg story (e.g. 'Aesop: The Fox and the Crow', 'Anansi & The Pot of Wisdom', 'Sun Wukong Steals the Peaches')..."
        className="w-full p-2 rounded-md bg-[#0b0f1d] border border-white/12 text-[11px] text-white placeholder:text-[#6f7894] focus:outline-none focus:border-[#f2c85b] resize-none"
      />

      {/* Live Story-to-Stage Readiness Preview */}
      <div className="p-2 rounded-md bg-[#0c1120] border border-white/10 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold text-[#f2c85b] inline-flex items-center gap-1">
            <Compass className="w-3 h-3" />
            <span>
              {readiness.playbook.shortLabel} · {activeArc.shortLabel}
            </span>
          </span>
          <span className="text-[10px] text-[#9aa5c4]">
            {activeRenderStyle} · {readiness.playbook.defaultRaag}
          </span>
        </div>

        {storyIdea.trim().length > 2 && (
          <div className="space-y-1 text-[10px] text-[#b9c4de]">
            <div className="flex flex-wrap gap-1">
              {readiness.matchedArchetypes.map((a) => (
                <span
                  key={a}
                  className="px-1.5 py-0.5 rounded bg-[#18223d] border border-[#60a5fa]/30 text-[#bfdbfe]"
                >
                  cast: {a}
                </span>
              ))}
              {readiness.matchedStages.map((s) => (
                <span
                  key={s}
                  className="px-1.5 py-0.5 rounded bg-[#172924] border border-[#4ade80]/30 text-[#bbf7d0]"
                >
                  stage: {s}
                </span>
              ))}
              {readiness.matchedProps.map((p) => (
                <span
                  key={p}
                  className="px-1.5 py-0.5 rounded bg-[#2b2216] border border-[#f2c85b]/30 text-[#fde68a]"
                >
                  prop: {p}
                </span>
              ))}
              {readiness.matchedBibleNames.map((n) => (
                <span
                  key={n}
                  className="px-1.5 py-0.5 rounded bg-[#2a1a38] border border-[#c084fc]/35 text-[#e9d5ff]"
                >
                  bible lock: {n}
                </span>
              ))}
            </div>
            {readiness.standInTips.length > 0 && (
              <div className="text-[10px] text-[#f5d380] leading-snug">
                Stand-in tip: {readiness.standInTips[0]}
              </div>
            )}
          </div>
        )}
      </div>

      {/* LLM Tier Preset & Story Arc Skeleton Row */}
      <div className="grid grid-cols-2 gap-1.5">
        <select
          value={llmTier}
          onChange={(e) => handleSelectTier(e.target.value as LlmTierId)}
          className="h-7 px-1.5 rounded bg-[#0e1324] border border-white/12 text-[10px] text-white"
          title={tierProfile.guidance}
        >
          {LLM_TIER_PROFILES.map((t) => (
            <option key={t.id} value={t.id}>
              Tier: {t.shortLabel}
            </option>
          ))}
        </select>

        <select
          value={arcChoice}
          onChange={(e) => setArcChoice(e.target.value as StoryArcId | 'auto')}
          className="h-7 px-1.5 rounded bg-[#0e1324] border border-white/12 text-[10px] text-white"
          title="Injects a mandatory beat-by-beat narrative spine so LLMs never ramble or skip the twist"
        >
          <option value="auto">Arc: Auto ({activeArc.shortLabel})</option>
          {STORY_ARC_TEMPLATES.map((a) => (
            <option key={a.id} value={a.id}>
              {a.shortLabel}
            </option>
          ))}
        </select>
      </div>

      {/* Playbook & Workflow Mode Row */}
      <div className="grid grid-cols-2 gap-1.5">
        <select
          value={playbookChoice}
          onChange={(e) => setPlaybookChoice(e.target.value as PlaybookId | 'auto')}
          className="h-7 px-1.5 rounded bg-[#0e1324] border border-white/12 text-[10px] text-white"
        >
          <option value="auto">Region: Auto ({readiness.playbook.shortLabel})</option>
          {REGIONAL_PLAYBOOKS.map((pb) => (
            <option key={pb.id} value={pb.id}>
              {pb.shortLabel}
            </option>
          ))}
        </select>

        <select
          value={workflowMode}
          onChange={(e) => setWorkflowMode(e.target.value as DirectorWorkflowMode)}
          className="h-7 px-1.5 rounded bg-[#0e1324] border border-white/12 text-[10px] text-white"
        >
          <option value="lite">Lite Auto-Direct (1-Click)</option>
          <option value="two_step">2-Step Blueprint → Scenes</option>
          <option value="full">Full Pro JSON</option>
        </select>
      </div>

      {/* Provider, Length & Art Engine Row */}
      <div className="grid grid-cols-3 gap-1.5">
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as LlmProviderChoice)}
          className="h-7 px-1.5 rounded bg-[#0e1324] border border-white/12 text-[10px] text-white"
        >
          <option value="gemini">Gemini {providersReady.gemini ? '✓' : '(Key)'}</option>
          <option value="openai">OpenAI {providersReady.openai ? '✓' : '(Key)'}</option>
          <option value="anthropic">Claude {providersReady.anthropic ? '✓' : '(Key)'}</option>
          <option value="custom_server">
            Custom {providersReady.custom_server ? '✓' : '(URL)'}
          </option>
          <option value="ollama">Ollama (Local)</option>
        </select>

        <select
          value={lengthTarget}
          onChange={(e) => setLengthTarget(e.target.value as DirectorLengthTarget)}
          className="h-7 px-1.5 rounded bg-[#0e1324] border border-white/12 text-[10px] text-white"
          title="Select Short (<1m), Standard, Deep, or Multi-Act Long-Form (8m / 12m / 20m)"
        >
          {DIRECTOR_LENGTH_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.shortLabel}
            </option>
          ))}
        </select>

        <select
          value={renderStyleOverride}
          onChange={(e) => setRenderStyleOverride(e.target.value as RenderStyleId | 'auto')}
          className="h-7 px-1.5 rounded bg-[#0e1324] border border-white/12 text-[10px] text-white"
        >
          <option value="auto">Style: Auto</option>
          {RENDER_STYLE_CATALOG.map((r) => (
            <option key={r.id} value={r.id}>
              {r.shortLabel}
            </option>
          ))}
        </select>
      </div>

      {/* Target Story Language Row (19 Global & Indian Languages + RTL/CJK) */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold text-[#9aa5c4] inline-flex items-center gap-1 shrink-0">
          <Globe className="w-3 h-3 text-[#f2c85b]" />
          <span>Language</span>
        </span>
        <select
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value as LanguageCode)}
          className="flex-1 h-7 px-1.5 rounded bg-[#0e1324] border border-white/12 text-[10px] text-white"
          title="Generate native episode titles, dialogue, captions, and launch packs in any of 19 supported languages"
        >
          {LANGUAGE_CATALOG.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.nativeName} ({lang.label}
              {lang.dir === 'rtl' ? ' · RTL' : ''})
            </option>
          ))}
        </select>
      </div>

      {provider === 'ollama' && (
        <div className="grid grid-cols-2 gap-1.5">
          <input
            type="text"
            value={ollamaUrl}
            onChange={(e) => setOllamaUrl(e.target.value)}
            className="h-7 px-2 rounded bg-[#0e1324] border border-white/12 text-[10px] text-white"
            placeholder="http://localhost:11434/api/chat"
          />
          <input
            type="text"
            value={ollamaModel}
            onChange={(e) => setOllamaModel(e.target.value)}
            className="h-7 px-2 rounded bg-[#0e1324] border border-white/12 text-[10px] text-white"
            placeholder="qwen2.5:7b / gemma2:9b"
          />
        </div>
      )}

      {/* Editable Step-1 Blueprint Card (when 2-Step mode is active) */}
      {workflowMode === 'two_step' && blueprint && (
        <div className="p-2.5 rounded-md bg-[#0b1020] border border-[#f2c85b]/30 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-semibold text-[#f2c85b]">
            <span className="inline-flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>Locked Blueprint: {blueprint.title}</span>
            </span>
            <button
              type="button"
              onClick={() => setBlueprint(null)}
              className="text-[#8e97b0] hover:text-white cursor-pointer"
            >
              Reset
            </button>
          </div>

          <div className="space-y-1">
            {blueprint.cast.map((member, idx) => (
              <div key={member.id} className="grid grid-cols-2 gap-1.5 items-center">
                <span className="text-[10px] text-white truncate">
                  {member.name} <span className="text-[#7c87a6]">({member.id})</span>
                </span>
                <select
                  value={member.archetype}
                  onChange={(e) => {
                    const nextCast = blueprint.cast.map((c, i) =>
                      i === idx ? { ...c, archetype: e.target.value as ArchetypeId } : c
                    );
                    setBlueprint({ ...blueprint, cast: nextCast });
                  }}
                  className="h-6 px-1 rounded bg-[#141b31] border border-white/12 text-[10px] text-white"
                >
                  {ARCHETYPE_CATALOG.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-[10px] text-[#8e97b0]">Stages:</span>
            {blueprint.stages.map((st, idx) => (
              <select
                key={`${st}-${idx}`}
                value={st}
                onChange={(e) => {
                  const nextStages = blueprint.stages.map((s, i) =>
                    i === idx ? (e.target.value as StageId) : s
                  );
                  setBlueprint({ ...blueprint, stages: nextStages });
                }}
                className="h-6 px-1 rounded bg-[#141b31] border border-white/12 text-[10px] text-[#bbf7d0]"
              >
                {STAGE_CATALOG.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>
      )}

      {feedback && (
        <div className="text-[10px] text-[#f7e7bc] bg-[#1a2442] px-2.5 py-1.5 rounded border border-white/10 leading-snug">
          {feedback}
        </div>
      )}

      {lengthPreset.isLongForm ? (
        <div className="space-y-1.5">
          <div className="text-[10px] text-[#cfd7ec] bg-[#0e1426] border border-[#f2c85b]/25 rounded px-2.5 py-1.5">
            <span className="font-semibold text-[#f2c85b]">Multi-Act Long-Form Engine:</span> Generates a{' '}
            {lengthPreset.actCount}-Act Master Outline + locked Cast DNA, then directs{' '}
            {lengthPreset.actCount} acts sequentially (~{lengthPreset.totalBeats} scenes ·{' '}
            {lengthPreset.approxDurationLabel}) with rolling continuity &amp; chapter title cards.
          </div>
          {busyStep ? (
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-8 px-2.5 rounded-md bg-[#192342] border border-[#f2c85b]/35 text-[10px] text-[#f7e7bc] flex items-center truncate">
                {busyStep}
              </div>
              <button
                type="button"
                onClick={() => {
                  longFormCancelRef.current = true;
                }}
                className="h-8 px-2.5 rounded-md bg-[#e6223c] hover:bg-[#cc1d34] text-white text-[10px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                title="Stop after current act and keep all completed acts"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleOneClickDirect}
              className="w-full h-8 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] text-[#110e0a] text-[11px] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>
                Direct {lengthPreset.approxDurationLabel} Long-Form ({lengthPreset.actCount} Acts)
              </span>
            </button>
          )}
        </div>
      ) : busyStep ? (
        <div className="flex items-center gap-1.5">
          <div className="flex-1 h-8 px-2.5 rounded-md bg-[#192342] border border-[#f2c85b]/35 text-[10px] text-[#f7e7bc] flex items-center truncate">
            {busyStep}
          </div>
          <button
            type="button"
            onClick={() => {
              longFormCancelRef.current = true;
            }}
            className="h-8 px-2.5 rounded-md bg-[#e6223c] hover:bg-[#cc1d34] text-white text-[10px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
            title="Stop after current chunk and keep all completed progress"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Stop</span>
          </button>
        </div>
      ) : workflowMode === 'two_step' ? (
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            disabled={Boolean(busyStep)}
            onClick={handleGenerateBlueprint}
            className="h-8 rounded-md bg-[#1e2948] hover:bg-[#2a3861] disabled:opacity-50 border border-[#f2c85b]/35 text-white text-[11px] font-semibold inline-flex items-center justify-center gap-1 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#f2c85b]" />
            <span>1. Stage Blueprint</span>
          </button>
          <button
            type="button"
            disabled={Boolean(busyStep) || !blueprint}
            onClick={handleGenerateFromBlueprint}
            className="h-8 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] disabled:opacity-40 text-[#110e0a] text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>2. Direct Scenes</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={Boolean(busyStep)}
          onClick={handleOneClickDirect}
          className="w-full h-8 rounded-md bg-[#f2c85b] hover:bg-[#f7d577] disabled:opacity-50 text-[#110e0a] text-[11px] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Generate &amp; Auto-Direct Episode</span>
        </button>
      )}

      {/* Active Episode Script Craft Meter + 1-Click Dialogue-Only Script Doctor */}
      <div className="pt-2 border-t border-white/10 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] text-[#b9c4de]">
            <span className="font-semibold text-white">Script Craft: </span>
            <span
              className={`font-bold ${
                scriptCraft.score >= 85
                  ? 'text-[#4ade80]'
                  : scriptCraft.score >= 70
                    ? 'text-[#f2c85b]'
                    : 'text-[#fb7185]'
              }`}
            >
              {scriptCraft.score}/100 ({scriptCraft.grade})
            </span>
            <span className="text-[#8e97b0]">
              {' '}
              · {scriptCraft.avgWordsPerBeat}w/beat · {scriptCraft.characterDialoguePct}% banter
            </span>
          </div>
          <button
            type="button"
            disabled={Boolean(busyStep)}
            onClick={handlePolishActiveDialogue}
            className="h-6 px-2 rounded bg-[#1d2746] hover:bg-[#293761] disabled:opacity-50 border border-[#f2c85b]/30 text-[10px] font-semibold text-[#f7e7bc] whitespace-nowrap cursor-pointer"
            title="Rewrites ONLY the spoken hook & dialogue lines for wit and rhythm while keeping 100% of cast, stages, and shots locked"
          >
            Polish Dialogue
          </button>
        </div>
        {scriptCraft.issues.length > 0 && (
          <div className="text-[10px] text-[#fca5a5] leading-snug">
            Tip: {scriptCraft.issues[0]}
          </div>
        )}

        {/* Semantic Story Continuity Audit + 1-Click Auto-Fix */}
        <div className="pt-1.5 border-t border-white/8 flex items-center justify-between gap-2">
          <div className="text-[10px] text-[#b9c4de]">
            <span className="font-semibold text-white">Continuity: </span>
            <span
              className={`font-bold ${
                continuity.score >= 88
                  ? 'text-[#4ade80]'
                  : continuity.score >= 74
                    ? 'text-[#f2c85b]'
                    : 'text-[#fb7185]'
              }`}
            >
              {continuity.score}/100 ({continuity.grade})
            </span>
            <span className="text-[#8e97b0]">
              {' '}
              · {continuity.issues.length === 0 ? 'clean' : `${continuity.issues.length} note(s)`}
              {totalExpressionCues > 0 ? ` · ${totalExpressionCues} face cues` : ''}
            </span>
          </div>
          {continuity.issues.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const { episode: fixed, fixedCount } = autoFixStoryContinuity(currentEpisode);
                if (fixedCount > 0) {
                  onGeneratedEpisode(fixed);
                  setFeedback(`Fixed ${fixedCount} continuity issue(s) across scenes.`);
                }
              }}
              className="h-6 px-2 rounded bg-[#182925] hover:bg-[#213a34] border border-[#4ade80]/35 text-[10px] font-semibold text-[#bbf7d0] whitespace-nowrap cursor-pointer"
              title={continuity.issues[0]?.message}
            >
              Fix Continuity
            </button>
          )}
        </div>
        {continuity.issues.length > 0 && (
          <div className="text-[10px] text-[#fde68a]/90 leading-snug">
            {continuity.issues[0].message}
          </div>
        )}

        {/* Per-Frame Emotion Comprehension & Acting Direction */}
        <div className="pt-1.5 border-t border-white/8 space-y-1.5">
          <div className="flex items-center justify-between gap-1.5">
            <div className="text-[10px] text-[#b9c4de]">
              <span className="font-semibold text-white">Emotion Acting: </span>
              <span
                className={`font-bold ${
                  emotionAudit.score >= 88
                    ? 'text-[#4ade80]'
                    : emotionAudit.score >= 75
                      ? 'text-[#f2c85b]'
                      : 'text-[#fb7185]'
                }`}
              >
                {emotionAudit.score}/100 ({emotionAudit.grade})
              </span>
              <span className="text-[#8e97b0]">
                {' '}
                · {emotionAudit.totalSegments} ranges · {emotionAudit.listenerAlivePct}% listeners
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              disabled={Boolean(busyStep)}
              onClick={handleAutoChoreographEmotions}
              className="h-6 px-2 rounded bg-[#18223d] hover:bg-[#223054] disabled:opacity-50 border border-[#38bdf8]/35 text-[10px] font-semibold text-[#bae6fd] whitespace-nowrap cursor-pointer"
              title="Instant offline script-comprehension choreographer: assigns speaker + listener frame ranges, phrase triggers, and subtext reasons with zero API calls"
            >
              Auto-Direct Faces
            </button>
            <button
              type="button"
              disabled={Boolean(busyStep)}
              onClick={handleAiDirectEmotions}
              className="h-6 px-2 rounded bg-[#251f3d] hover:bg-[#322952] disabled:opacity-50 border border-[#c084fc]/45 text-[10px] font-semibold text-[#f3e8ff] whitespace-nowrap cursor-pointer"
              title="Pass-2 AI Emotion Director: feeds the entire script to your LLM to direct deep subtext, dramatic irony, and speaker/listener frame ranges while keeping visuals locked"
            >
              AI Direct Emotions
            </button>
          </div>
          {emotionAudit.issues.length > 0 && (
            <div className="text-[10px] text-[#d8b4fe]/90 leading-snug">
              {emotionAudit.issues[0]}
            </div>
          )}
        </div>

        {/* Act-Level Sculptor: Regenerate Single Act or Extend Episode (+1 Act / ~2 min) */}
        <div className="pt-1.5 border-t border-white/8 space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-[10px]">
            <span className="font-semibold text-white">Act Sculptor (Long-Form Editing)</span>
            <span className="font-mono-tabular text-[#8e97b0]">
              {activeChapters.length} ch · {currentEpisode.beats.length} scenes
            </span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {activeChapters.length > 0 && (
              <select
                value={selectedActIdx}
                onChange={(e) => setSelectedActIdx(Number(e.target.value))}
                className="h-7 px-2 rounded bg-[#0e1324] border border-white/12 text-[10px] text-white"
              >
                {activeChapters.map((ch) => (
                  <option key={ch.index} value={ch.index}>
                    Ch {ch.chapterNumber}: {ch.title} ({ch.beatCount} scenes · {formatLongDuration(ch.durationSec)})
                  </option>
                ))}
              </select>
            )}
            <input
              type="text"
              value={actDirectionNote}
              onChange={(e) => setActDirectionNote(e.target.value)}
              placeholder="Optional twist or rewrite note (e.g. 'add river storm chase')"
              className="h-7 px-2 rounded bg-[#0e1324] border border-white/12 text-[10px] text-white placeholder:text-[#6f7894]"
            />
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                disabled={Boolean(busyStep) || activeChapters.length === 0}
                onClick={handleRegenerateSelectedAct}
                className="h-7 px-2 rounded bg-[#18223d] hover:bg-[#223054] disabled:opacity-50 border border-white/15 text-[10px] font-semibold text-[#e2e8f8] inline-flex items-center justify-center gap-1 cursor-pointer"
                title="Rewrites ONLY the selected chapter while keeping neighboring acts & Cast DNA locked"
              >
                <RefreshCw className="w-3 h-3 text-[#f2c85b]" />
                <span>Regenerate Ch {selectedActIdx + 1}</span>
              </button>
              <button
                type="button"
                disabled={Boolean(busyStep)}
                onClick={handleAppendNextAct}
                className="h-7 px-2 rounded bg-[#1d2846] hover:bg-[#27365e] disabled:opacity-50 border border-[#f2c85b]/35 text-[10px] font-semibold text-[#f7e7bc] inline-flex items-center justify-center gap-1 cursor-pointer"
                title="Appends a brand-new ~20-scene (~2 min) Act seamlessly continuing from the current ending"
              >
                <Plus className="w-3 h-3 text-[#f2c85b]" />
                <span>+ Append Act {activeChapters.length + 1}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
