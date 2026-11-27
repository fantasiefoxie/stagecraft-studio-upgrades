/**
 * Katha Studio — Native Long-Form Production Engine (8–25+ Minute Episodes)
 *
 * Powers:
 * 1. Multi-Act Sequential AI Director (Pass 1 Master Outline + Locked Cast DNA -> Pass 2..N Act Storyboards -> Unified Stitch)
 * 2. Smart Episode Chapter Partitioning (aligned to chapter_title beats or ~3.3-minute clean segments)
 * 3. Lossless FFmpeg Chapter Concat Script Generator (macOS/Linux .sh + Windows .bat + chapters.txt)
 */
import { CastBibleEntry } from './castBible';
import {
  compileLiteOrFullToEpisode,
  detectPlaybookFromText,
  getPlaybookById,
  PlaybookId,
  RegionalPlaybook,
  resolveArchetype,
  resolveRenderStyle,
  resolveStage,
} from './llmDirectorKit';
import { getLanguageSpec, LanguageCode } from './i18n';
import {
  ArchetypeId,
  CastMember,
  EpisodeScript,
  EXPRESSION_LIST,
  RaagId,
  RenderStyleId,
  StageId,
  StoryBeat,
} from './types';

export type DirectorLengthTarget =
  | 'short_6'
  | 'standard_12'
  | 'deep_20'
  | 'long_8m'
  | 'long_12m'
  | 'long_20m';

export interface DirectorLengthPreset {
  id: DirectorLengthTarget;
  label: string;
  shortLabel: string;
  approxDurationLabel: string;
  isLongForm: boolean;
  totalBeats: number;
  actCount: number;
  beatsPerAct: number;
}

export const DIRECTOR_LENGTH_PRESETS: DirectorLengthPreset[] = [
  {
    id: 'short_6',
    label: '6 scenes (~30s · YouTube Short)',
    shortLabel: 'Short (6)',
    approxDurationLabel: '~30s',
    isLongForm: false,
    totalBeats: 6,
    actCount: 1,
    beatsPerAct: 6,
  },
  {
    id: 'standard_12',
    label: '12 scenes (~1m · Classic Tale)',
    shortLabel: 'Standard (12)',
    approxDurationLabel: '~1m',
    isLongForm: false,
    totalBeats: 12,
    actCount: 1,
    beatsPerAct: 12,
  },
  {
    id: 'deep_20',
    label: '20 scenes (~1.7m · Deep Story)',
    shortLabel: 'Deep (20)',
    approxDurationLabel: '~1.7m',
    isLongForm: false,
    totalBeats: 20,
    actCount: 1,
    beatsPerAct: 20,
  },
  {
    id: 'long_8m',
    label: 'Long-Form 8m (~100 scenes · 5 Acts)',
    shortLabel: 'Long 8m (5 Acts)',
    approxDurationLabel: '~8m',
    isLongForm: true,
    totalBeats: 100,
    actCount: 5,
    beatsPerAct: 20,
  },
  {
    id: 'long_12m',
    label: 'Long-Form 12m (~147 scenes · 7 Acts)',
    shortLabel: 'Long 12m (7 Acts)',
    approxDurationLabel: '~12m',
    isLongForm: true,
    totalBeats: 147,
    actCount: 7,
    beatsPerAct: 21,
  },
  {
    id: 'long_20m',
    label: 'Long-Form 20m (~220 scenes · 10 Acts)',
    shortLabel: 'Long 20m (10 Acts)',
    approxDurationLabel: '~20m',
    isLongForm: true,
    totalBeats: 220,
    actCount: 10,
    beatsPerAct: 22,
  },
];

export function getDirectorLengthPreset(id: DirectorLengthTarget): DirectorLengthPreset {
  return DIRECTOR_LENGTH_PRESETS.find((p) => p.id === id) || DIRECTOR_LENGTH_PRESETS[1];
}

// =========================================================================
// 1. MULTI-ACT LONG-FORM OUTLINE & PROMPT BUILDERS
// =========================================================================

export interface LongFormOutlineCast {
  id: string;
  name: string;
  archetype: ArchetypeId;
  traits?: string;
  dna?: Record<string, unknown>;
}

export interface LongFormActPlan {
  actNumber: number;
  title: string;
  summary: string;
  cliffhanger: string;
  stageIds: StageId[];
  targetBeats: number;
}

export interface MasterLongFormOutline {
  title: string;
  subtitle: string;
  series: string;
  region: PlaybookId;
  renderStyle: RenderStyleId;
  defaultRaag: RaagId;
  moral: string;
  language: LanguageCode;
  cast: LongFormOutlineCast[];
  stages: StageId[];
  acts: LongFormActPlan[];
}

function slugToken(val: unknown, fallback: string): string {
  const s = String(val ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return s || fallback;
}

export function buildLongFormOutlinePrompt(params: {
  storyPrompt: string;
  preset: DirectorLengthPreset;
  playbookOverride: PlaybookId | 'auto';
  preferredRenderStyle?: RenderStyleId;
  targetLanguage?: LanguageCode;
  castBible?: CastBibleEntry[];
}): { systemPrompt: string; userPrompt: string; playbook: RegionalPlaybook } {
  const playbook =
    params.playbookOverride === 'auto'
      ? detectPlaybookFromText(params.storyPrompt)
      : getPlaybookById(params.playbookOverride);

  const langInfo = getLanguageSpec(params.targetLanguage || 'en');
  const styleHint = params.preferredRenderStyle || playbook.renderStyle;

  const bibleHint =
    params.castBible && params.castBible.length > 0
      ? `\nLOCKED CHANNEL CAST BIBLE (reuse exact names & archetypes if relevant):\n${params.castBible
          .slice(0, 8)
          .map((c) => `- "${c.name}" (archetype: ${c.member.archetype})`)
          .join('\n')}`
      : '';

  const systemPrompt = `You are a Master Showrunner architecting a serialized ${params.preset.approxDurationLabel} animated folklore/mythology episode (${params.preset.actCount} distinct Acts, ~${params.preset.totalBeats} total scenes) for Katha Studio.

TASK (PASS 1 OF ${params.preset.actCount + 1}):
Output ONLY a strict, valid raw JSON Master Outline object (no markdown fences, no commentary).
Design:
1. A cohesive ${params.preset.actCount}-Act narrative arc where EVERY Act escalates stakes, explores fresh settings, and ends on a mini cliffhanger or dramatic turn so viewers keep watching for 8-20+ minutes.
2. A memorable, visually diverse Cast (3 to 7 characters) with distinct plain-English "traits" so our Entity DNA Workshop gives each character a unique non-template silhouette (humans, animals, mythic creatures, or spirits).
3. Use ONLY these verified engine tokens:
   - region: "${playbook.id}"
   - renderStyle: "${styleHint}"
   - allowed archetypes: ${playbook.archetypes.join(', ')}, king, queen, minister, warrior, sage, elder_woman, merchant, child, guard, spirit, goddess, deva, lion, tiger, fox, wolf, crow, raven, crane, deer, monkey, elephant, serpent, spider, knight, samurai
   - allowed stages: ${playbook.stages.join(', ')}, royal_durbar, bamboo_forest, banyan_clearing, river_ghat, bazaar_lane, village_chowk, cave_den, ocean_ship, enchanted_lake, moonlit_terrace, himalayan_hermitage, desert_caravan, olympus_acropolis, bamboo_pagoda, enchanted_cottage, savanna_baobab, red_canyon_mesa
   - allowed raags: ${playbook.defaultRaag}, darbari, yaman, malkauns, bhairavi, bhoopali, greek_lyre, medieval_lute, guqin_bamboo, gamelan_wayang, cedar_flute, kora_griot
4. Language: Write title, subtitle, series, cast names, act titles, summaries, cliffhangers, and moral in ${langInfo.label} (${langInfo.nativeName}). Keep ALL JSON keys and enum IDs in lowercase ASCII English.${bibleHint}

RETURN EXACT JSON SCHEMA:
{
  "title": "Episode Title",
  "subtitle": "Short atmospheric hook subtitle",
  "series": "${playbook.defaultSeries}",
  "region": "${playbook.id}",
  "renderStyle": "${styleHint}",
  "defaultRaag": "${playbook.defaultRaag}",
  "moral": "Timeless 1-sentence closing wisdom",
  "cast": [
    {
      "id": "snake_case_id",
      "name": "Character Display Name",
      "archetype": "valid_archetype_id",
      "traits": "distinctive appearance, silhouette, headwear, animal/mythic details, colors"
    }
  ],
  "stages": ["stage_id_1", "stage_id_2", "stage_id_3"],
  "acts": [
    {
      "actNumber": 1,
      "title": "Act I: Evocative Chapter Title",
      "summary": "2-3 sentences detailing exact events, conflict, and character beats in this act.",
      "cliffhanger": "1 sentence ending hook that propels viewers into the next act.",
      "stageIds": ["stage_id_1", "stage_id_2"]
    }
  ]
}`;

  const userPrompt = `Architect a full ${params.preset.actCount}-Act long-form episode (~${params.preset.approxDurationLabel}) based on this premise/source:\n\n${params.storyPrompt.trim()}\n\nEnsure all ${params.preset.actCount} acts are distinct, vivid, dramatic, and lead cleanly to the final climax and moral. Return ONLY valid JSON.`;

  return { systemPrompt, userPrompt, playbook };
}

export function normalizeLongFormOutline(
  raw: unknown,
  params: {
    preset: DirectorLengthPreset;
    playbook: RegionalPlaybook;
    preferredRenderStyle?: RenderStyleId;
    targetLanguage?: LanguageCode;
  }
): MasterLongFormOutline {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const pb = params.playbook;

  const title =
    typeof obj.title === 'string' && obj.title.trim() ? obj.title.trim() : 'The Grand Folklore Chronicle';
  const subtitle =
    typeof obj.subtitle === 'string' && obj.subtitle.trim()
      ? obj.subtitle.trim()
      : `A ${params.preset.actCount}-Act ${pb.shortLabel} Epic`;
  const series =
    typeof obj.series === 'string' && obj.series.trim() ? obj.series.trim() : pb.defaultSeries;
  const moral =
    typeof obj.moral === 'string' && obj.moral.trim()
      ? obj.moral.trim()
      : 'Courage and wisdom endure long after pride fades.';

  const renderStyle = params.preferredRenderStyle
    ? params.preferredRenderStyle
    : resolveRenderStyle(obj.renderStyle, pb.renderStyle);

  // Normalize cast
  const rawCast = Array.isArray(obj.cast)
    ? obj.cast
    : Array.isArray(obj.characters)
      ? obj.characters
      : [];

  const cast: LongFormOutlineCast[] = [];
  const seenCastIds = new Set<string>();
  rawCast.forEach((item, idx) => {
    if (!item || typeof item !== 'object') return;
    const c = item as Record<string, unknown>;
    const name =
      typeof c.name === 'string' && c.name.trim()
        ? c.name.trim()
        : typeof c.id === 'string' && c.id.trim()
          ? c.id.trim()
          : `Character ${idx + 1}`;
    let id = slugToken(c.id ?? name, `char_${idx + 1}`);
    while (seenCastIds.has(id)) id = `${id}_${idx + 1}`;
    seenCastIds.add(id);

    const arch = resolveArchetype(c.archetype ?? c.role, name, pb).id;
    const traits = typeof c.traits === 'string' && c.traits.trim() ? c.traits.trim() : undefined;
    const dna = c.dna && typeof c.dna === 'object' ? (c.dna as Record<string, unknown>) : undefined;
    cast.push({ id, name, archetype: arch, ...(traits ? { traits } : {}), ...(dna ? { dna } : {}) });
  });

  if (cast.length === 0) {
    cast.push(
      { id: 'hero', name: 'The Seeker', archetype: pb.archetypes[0] || 'merchant' },
      { id: 'rival', name: 'The Rival', archetype: pb.archetypes[1] || 'king' }
    );
  }

  // Normalize stages
  const rawStages = Array.isArray(obj.stages) ? obj.stages : [];
  const stageSet = new Set<StageId>();
  for (const st of rawStages) {
    stageSet.add(resolveStage(st, pb).id);
  }
  for (const fallbackStage of pb.stages.slice(0, 3)) {
    if (stageSet.size >= 3) break;
    stageSet.add(fallbackStage);
  }
  const stages = Array.from(stageSet);

  // Normalize acts
  const rawActs = Array.isArray(obj.acts) ? obj.acts : [];
  const acts: LongFormActPlan[] = [];
  for (let i = 0; i < params.preset.actCount; i++) {
    const rawAct =
      rawActs[i] && typeof rawActs[i] === 'object' ? (rawActs[i] as Record<string, unknown>) : {};
    const actTitle =
      typeof rawAct.title === 'string' && rawAct.title.trim()
        ? rawAct.title.trim()
        : `Act ${i + 1}: ${i === 0 ? 'The Awakening' : i === params.preset.actCount - 1 ? 'The Reckoning' : `Trial ${i}`}`;
    const summary =
      typeof rawAct.summary === 'string' && rawAct.summary.trim()
        ? rawAct.summary.trim()
        : `Act ${i + 1} deepens the conflict between ${cast[0].name} and ${cast[1]?.name || 'fate'}.`;
    const cliffhanger =
      typeof rawAct.cliffhanger === 'string' && rawAct.cliffhanger.trim()
        ? rawAct.cliffhanger.trim()
        : i === params.preset.actCount - 1
          ? 'The truth is revealed and the moral resonates.'
          : 'A sudden revelation changes everything for the next act.';

    const actStageIdsRaw = Array.isArray(rawAct.stageIds) ? rawAct.stageIds : [];
    const actStages: StageId[] = actStageIdsRaw
      .map((s) => resolveStage(s, pb).id)
      .filter((s, idx, arr) => arr.indexOf(s) === idx);
    if (actStages.length === 0) {
      actStages.push(stages[i % stages.length], stages[(i + 1) % stages.length]);
    }

    acts.push({
      actNumber: i + 1,
      title: actTitle,
      summary,
      cliffhanger,
      stageIds: Array.from(new Set(actStages)),
      targetBeats: params.preset.beatsPerAct,
    });
  }

  return {
    title,
    subtitle,
    series,
    region: pb.id,
    renderStyle,
    defaultRaag: pb.defaultRaag,
    moral,
    language: params.targetLanguage || 'en',
    cast,
    stages,
    acts,
  };
}

export function buildLongFormActBeatsPrompt(params: {
  outline: MasterLongFormOutline;
  actIndex: number;
  previousRecap: string;
}): { systemPrompt: string; userPrompt: string } {
  const { outline, actIndex, previousRecap } = params;
  const act = outline.acts[actIndex];
  const isFirstAct = actIndex === 0;
  const isFinalAct = actIndex === outline.acts.length - 1;
  const langInfo = getLanguageSpec(outline.language);
  const pb = getPlaybookById(outline.region);

  const lockedCastLines = outline.cast
    .map((c) => `- id: "${c.id}" | name: "${c.name}" | archetype: "${c.archetype}"`)
    .join('\n');

  const stageMenu = Array.from(new Set([...act.stageIds, ...outline.stages])).join(', ');
  const propMenu = pb.props.join(', ');

  const openingRule = isFirstAct
    ? `- Beat 1 MUST be an explosive Cold Open Hook (NEVER "Once upon a time"!).`
    : `- Beat 1 MUST be a Chapter Title Slate with "frame": "chapter_title", "speaker": "narrator", "title": "${act.title}", and a poetic 8-14 word chapter intro line.`;

  const closingRule = isFinalAct
    ? `- The FINAL beat MUST have "frame": "moral_card", "speaker": "narrator", delivering the timeless moral: "${outline.moral}".`
    : `- Do NOT end with a moral_card yet (more acts follow!). End the final beat of this Act on a gripping bridge/cliffhanger: "${act.cliffhanger}".`;

  const systemPrompt = `You are a Master Episode Director writing ACT ${act.actNumber} OF ${outline.acts.length} for the long-form Katha Studio series "${outline.title}".

LOCKED CAST IDS (use ONLY these exact IDs in "who" and "speaker", plus "narrator"):
${lockedCastLines}

ALLOWED STAGE IDS FOR THIS ACT: ${stageMenu}
ALLOWED PROP IDS: none, ${propMenu}
ALLOWED EXPRESSIONS (10): ${EXPRESSION_LIST.join(' | ')}

STORYTELLING RULES FOR LONG-FORM RETENTION:
1. Return ONLY raw valid JSON: { "beats": [ ... ] } (no markdown fences, no commentary).
2. Generate EXACTLY ${act.targetBeats} crisp, cinematic scenes in "beats".
3. ${openingRule}
4. ${closingRule}
5. Dialogue MUST be vivid, spoken storytelling in ${langInfo.label} (${langInfo.nativeName}), 12-20 words per beat (about 4.5-6.5 seconds spoken). NO "(parentheticals)" or "Name:" prefixes inside dialogue!
6. At least 60% of beats must be characters speaking directly to each other (not just narrator) with lively back-and-forth conflict, wit, and emotional turns.
7. Include "actorExpressions": { "castId": "expression" } on dramatic turns to drive silent listener reactions. Vary expressions naturally (calm, warm, joy, curious, awe, sly, shocked, grief, stern, angry).
8. Shift stages naturally across the Act so visuals stay fresh every 4-6 beats.

BEAT OBJECT FORMAT:
{
  "title": "Short 2-4 word scene title",
  "stage": "allowed_stage_id",
  "who": ["cast_id_1", "cast_id_2"],
  "speaker": "cast_id_1 or narrator",
  "emotion": "curious",
  "actorExpressions": { "cast_id_1": "curious", "cast_id_2": "sly" },
  "prop": "none_or_prop_id",
  "frame": "main",
  "dialogue": "Crisp spoken dialogue in ${langInfo.label} (12-20 words)."
}`;

  const userPrompt = `EPISODE: "${outline.title}" — ${outline.subtitle}
ACT ${act.actNumber}/${outline.acts.length}: "${act.title}"
ACT GOAL: ${act.summary}
ACT CLIFFHANGER / TURN: ${act.cliffhanger}
${previousRecap ? `\nCONTINUITY FROM PREVIOUS ACTS:\n${previousRecap}\n` : ''}
Write all ${act.targetBeats} scenes for Act ${act.actNumber} now. Return ONLY { "beats": [...] }.`;

  return { systemPrompt, userPrompt };
}

/**
 * Extracts a concise rolling continuity recap from a compiled act's beats so Act N+1
 * remembers key dialogue and plot events without blowing up context tokens.
 */
export function summarizeActForContinuity(act: LongFormActPlan, beats: StoryBeat[]): string {
  const closingLines = beats
    .slice(-3)
    .map((b) => `${b.speakerLabel}: "${b.dialogue}"`)
    .join(' | ');
  return `Act ${act.actNumber} (${act.title}): ${act.summary} Ended with -> ${closingLines}`;
}

/**
 * Stitches compiled Act beat batches + Master Outline into one cohesive EpisodeScript
 * with locked Cast DNA, unique sequential beat IDs, chapter title cards, and anti-twin protection.
 */
export function stitchLongFormActsIntoEpisode(params: {
  outline: MasterLongFormOutline;
  actBeatBatches: unknown[][];
  castBible?: CastBibleEntry[];
}): { ok: true; script: EpisodeScript; autoFixes: string[] } | { ok: false; error: string } {
  const { outline, actBeatBatches, castBible } = params;
  const combinedRawBeats: Record<string, unknown>[] = [];

  actBeatBatches.forEach((rawActBeats, actIdx) => {
    const actPlan = outline.acts[actIdx];
    const validArr = Array.isArray(rawActBeats) ? rawActBeats : [];
    if (validArr.length === 0) return;

    // Guarantee a clean chapter_title card at the start of Act 2+ (and optionally Act 1 if desired,
    // though Act 1 starts with a cold open hook and Act 2..N get chapter cards for clean YouTube chapters!)
    const firstObj =
      validArr[0] && typeof validArr[0] === 'object'
        ? (validArr[0] as Record<string, unknown>)
        : {};
    if (actIdx > 0 && firstObj.frame !== 'chapter_title' && actPlan) {
      combinedRawBeats.push({
        id: `act${actIdx + 1}_title`,
        title: actPlan.title,
        stage: actPlan.stageIds[0] || outline.stages[0],
        who: [outline.cast[0]?.id].filter(Boolean),
        speaker: 'narrator',
        emotion: 'awe',
        frame: 'chapter_title',
        duration: 3.8,
        dialogue: actPlan.title,
      });
    }

    validArr.forEach((item, beatIdx) => {
      if (!item || typeof item !== 'object') return;
      const b = { ...(item as Record<string, unknown>) };
      // Prevent premature moral_card on non-final acts
      if (actIdx < actBeatBatches.length - 1 && b.frame === 'moral_card') {
        b.frame = 'main';
      }
      b.id = `act${actIdx + 1}_b${beatIdx + 1}`;
      combinedRawBeats.push(b);
    });
  });

  if (combinedRawBeats.length === 0) {
    return { ok: false, error: 'No beats were generated across the acts.' };
  }

  const unifiedRawPayload = {
    id: slugToken(outline.title, `longform_${Date.now().toString().slice(-4)}`),
    title: outline.title,
    subtitle: outline.subtitle,
    series: outline.series,
    region: outline.region,
    renderStyle: outline.renderStyle,
    defaultRaag: outline.defaultRaag,
    language: outline.language,
    moral: outline.moral,
    cast: outline.cast.map((c) => ({
      id: c.id,
      name: c.name,
      archetype: c.archetype,
      ...(c.traits ? { traits: c.traits } : {}),
      ...(c.dna ? { dna: c.dna } : {}),
    })),
    beats: combinedRawBeats,
  };

  const compiled = compileLiteOrFullToEpisode(unifiedRawPayload, {
    playbookOverride: outline.region,
    preferredRenderStyle: outline.renderStyle,
    storyHint: outline.title,
    castBible,
    ensureBookends: true,
    targetLanguage: outline.language,
  });

  if (!compiled.ok) return compiled;

  // Ensure every beat has a globally unique ID even after autoSplitLongDialogueBeats
  const usedIds = new Set<string>();
  const dedupedBeats = compiled.script.beats.map((b, i) => {
    let id = b.id || `b_${i + 1}`;
    if (usedIds.has(id)) {
      id = `${id}_${i + 1}`;
    }
    usedIds.add(id);
    return { ...b, id };
  });

  return {
    ok: true,
    script: {
      ...compiled.script,
      beats: dedupedBeats,
    },
    autoFixes: [
      `stitched ${actBeatBatches.filter((a) => a.length > 0).length} acts (${dedupedBeats.length} total scenes)`,
      ...compiled.autoFixes,
    ],
  };
}

// =========================================================================
// 2. SMART CHAPTER PARTITIONING (Timeline Grouping, Batch TTS, Chapter Render)
// =========================================================================

export interface EpisodeChapterSlice {
  index: number; // 0-based
  chapterNumber: number; // 1-based
  title: string;
  startBeatIdx: number; // inclusive
  endBeatIdx: number; // inclusive
  beatCount: number;
  startSec: number;
  durationSec: number;
  subEpisode: EpisodeScript;
}

/**
 * Splits any EpisodeScript into clean chapters for:
 * - Act-grouped timeline navigation (when beats.length > 24 or chapter_title beats exist)
 * - Chapter-by-chapter Voice Studio TTS
 * - Memory-safe Chaptered WebCodecs Offline Rendering (keeps every chapter < 150 MB & < 100 MB Audio RAM!)
 *
 * Strategy:
 * 1. Respect explicit `frame === 'chapter_title'` beats as natural chapter breaks.
 * 2. If any single chapter exceeds `maxChapterSec` (default 200s = 3m 20s), subdivide it cleanly
 *    at beat boundaries so no single render chunk exceeds browser memory or MP4 converter limits.
 */
export function partitionEpisodeIntoChapters(
  episode: EpisodeScript,
  maxChapterSec = 200
): EpisodeChapterSlice[] {
  const beats = episode.beats;
  if (beats.length === 0) return [];

  // Compute global start times for every beat
  const starts: number[] = [];
  let cursor = 0;
  for (const b of beats) {
    starts.push(cursor);
    cursor += Math.max(0.5, b.duration || 4);
  }

  // First pass: collect explicit chapter_title segments
  interface RawSpan {
    title: string;
    startIdx: number;
    endIdx: number;
  }

  const rawSpans: RawSpan[] = [];
  let spanStart = 0;
  let spanTitle =
    beats[0].frame === 'chapter_title' && beats[0].title.trim()
      ? beats[0].title.trim()
      : 'Act 1 · Opening';

  for (let i = 1; i < beats.length; i++) {
    if (beats[i].frame === 'chapter_title') {
      rawSpans.push({ title: spanTitle, startIdx: spanStart, endIdx: i - 1 });
      spanStart = i;
      spanTitle = beats[i].title.trim() || `Chapter ${rawSpans.length + 2}`;
    }
  }
  rawSpans.push({ title: spanTitle, startIdx: spanStart, endIdx: beats.length - 1 });

  // Second pass: subdivide any span longer than maxChapterSec into clean parts
  const finalSpans: RawSpan[] = [];
  for (const sp of rawSpans) {
    let partStart = sp.startIdx;
    let partDur = 0;
    let partNum = 1;

    for (let i = sp.startIdx; i <= sp.endIdx; i++) {
      const bDur = Math.max(0.5, beats[i].duration || 4);
      if (partDur > 0 && partDur + bDur > maxChapterSec && i > partStart) {
        finalSpans.push({
          title: partNum === 1 ? sp.title : `${sp.title} (Part ${partNum})`,
          startIdx: partStart,
          endIdx: i - 1,
        });
        partStart = i;
        partDur = bDur;
        partNum++;
      } else {
        partDur += bDur;
      }
    }

    finalSpans.push({
      title: partNum === 1 ? sp.title : `${sp.title} (Part ${partNum})`,
      startIdx: partStart,
      endIdx: sp.endIdx,
    });
  }

  // Build EpisodeChapterSlice objects with standalone subEpisode scripts
  const cleanCast: CastMember[] = episode.cast;
  return finalSpans.map((sp, idx) => {
    const sliceBeats = beats.slice(sp.startIdx, sp.endIdx + 1);
    const startSec = starts[sp.startIdx] ?? 0;
    const durationSec = sliceBeats.reduce((sum, b) => sum + Math.max(0.5, b.duration || 4), 0);
    const chNum = idx + 1;
    const subEpisode: EpisodeScript = {
      ...episode,
      id: `${episode.id}_ch${String(chNum).padStart(2, '0')}`,
      title: finalSpans.length === 1 ? episode.title : `${episode.title} — ${sp.title}`,
      cast: cleanCast,
      beats: sliceBeats,
    };

    return {
      index: idx,
      chapterNumber: chNum,
      title: finalSpans.length === 1 ? episode.title : sp.title,
      startBeatIdx: sp.startIdx,
      endBeatIdx: sp.endIdx,
      beatCount: sliceBeats.length,
      startSec,
      durationSec,
      subEpisode,
    };
  });
}

/**
 * Formats seconds cleanly as `MM:SS` or `H:MM:SS` for long-form displays.
 */
export function formatLongDuration(totalSeconds: number): string {
  const sec = Math.max(0, Math.round(totalSeconds));
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const rem = sec % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  }
  return `${mins}:${String(rem).padStart(2, '0')}`;
}

// =========================================================================
// 3. FFMPEG CHAPTER CONCAT SCRIPT BUNDLE (Zero-Quality-Loss Long-Form Join)
// =========================================================================

export interface FfmpegConcatBundle {
  chaptersListTxt: string;
  shellScriptSh: string;
  windowsScriptBat: string;
  youtubeChaptersTxt: string;
}

export function buildFfmpegChapterConcatBundle(params: {
  baseName: string;
  chapterFilenames: string[];
  chapters: EpisodeChapterSlice[];
  isMp4Inputs?: boolean;
}): FfmpegConcatBundle {
  const safeBase = params.baseName.replace(/[^a-zA-Z0-9_-]+/g, '_');
  const chaptersListTxt = params.chapterFilenames
    .map((fname) => `file '${fname.replace(/'/g, "'\\''")}'`)
    .join('\n');

  const outMp4 = `${safeBase}_FULL_YOUTUBE_1080P.mp4`;
  const concatCmd = params.isMp4Inputs
    ? `ffmpeg -y -f concat -safe 0 -i chapters.txt -c copy "${outMp4}"`
    : `ffmpeg -y -f concat -safe 0 -i chapters.txt -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -af "loudnorm=I=-14:TP=-1.5:LRA=11" -movflags +faststart "${outMp4}"`;

  const shellScriptSh = `#!/usr/bin/env bash
# Katha Studio — 1-Click Long-Form Chapter Stitcher
# Place all downloaded chapter files + chapters.txt in the same folder and run:
#   bash stitch_${safeBase}.sh
set -e

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "FFmpeg not found. Install via: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)"
  exit 1
fi

echo "Stitching ${params.chapterFilenames.length} chapters into ${outMp4}..."
${concatCmd}
echo "Done! YouTube-ready master saved to: ${outMp4}"
`;

  const windowsScriptBat = `@echo off
REM Katha Studio — 1-Click Long-Form Chapter Stitcher (Windows)
REM Place all downloaded chapter files + chapters.txt in the same folder and double-click.
echo Stitching ${params.chapterFilenames.length} chapters into ${outMp4}...
${concatCmd}
echo Done! Master saved to ${outMp4}
pause
`;

  const youtubeChaptersTxt = params.chapters
    .map((ch) => `${formatLongDuration(ch.startSec)} ${ch.title}`)
    .join('\n');

  return {
    chaptersListTxt,
    shellScriptSh,
    windowsScriptBat,
    youtubeChaptersTxt,
  };
}

// =========================================================================
// 4. ACT-LEVEL REGENERATION & EPISODE EXTENSION (+ APPEND NEXT ACT)
// =========================================================================

export function buildRegenerateActPrompt(params: {
  episode: EpisodeScript;
  chapter: EpisodeChapterSlice;
  directionNote?: string;
}): { systemPrompt: string; userPrompt: string } {
  const { episode, chapter, directionNote } = params;
  const langInfo = getLanguageSpec(episode.language || 'en');
  const castLines = episode.cast
    .map((c) => `- id: "${c.id}" | name: "${c.name}" | archetype: "${c.archetype}"`)
    .join('\n');
  const usedStages = Array.from(new Set(episode.beats.map((b) => b.stage)));
  const stageMenu = usedStages.slice(0, 8).join(', ');

  const prevBeats = episode.beats
    .slice(Math.max(0, chapter.startBeatIdx - 3), chapter.startBeatIdx)
    .map((b) => `[${b.speakerLabel}]: "${b.dialogue}"`)
    .join('\n');
  const nextBeats = episode.beats
    .slice(chapter.endBeatIdx + 1, Math.min(episode.beats.length, chapter.endBeatIdx + 4))
    .map((b) => `[${b.speakerLabel}]: "${b.dialogue}"`)
    .join('\n');
  const currentBeatsSummary = chapter.subEpisode.beats
    .slice(0, 6)
    .map((b) => `${b.title}: "${b.dialogue}"`)
    .join(' | ');

  const isFirstChapter = chapter.index === 0;
  const isFinalChapter = chapter.endBeatIdx >= episode.beats.length - 1;
  const targetCount = Math.max(12, Math.min(24, chapter.beatCount));

  const systemPrompt = `You are a Master Episode Director rewriting ONLY Chapter ${chapter.chapterNumber} ("${chapter.title}") of the Katha Studio episode "${episode.title}".

LOCKED CAST IDS (use ONLY these IDs in "who" and "speaker", plus "narrator"):
${castLines}

PREFERRED STAGE IDS: ${stageMenu}
VALID EXPRESSIONS (10): ${EXPRESSION_LIST.join(' | ')}

RULES:
1. Return ONLY raw valid JSON: { "beats": [ ... ] } (no markdown fences).
2. Generate ${targetCount} crisp, high-retention scenes in ${langInfo.label} (${langInfo.nativeName}).
3. ${isFirstChapter ? 'Beat 1 MUST be a gripping Cold Open hook.' : `Beat 1 MUST use "frame": "chapter_title", "title": "${chapter.title}".`}
4. ${isFinalChapter ? 'Final beat MUST use "frame": "moral_card" delivering the episode moral.' : 'Do NOT use moral_card (more chapters follow!). Bridge cleanly into the next chapter.'}
5. Keep dialogue punchy (12-18 words per beat), at least 60% direct character banter, NO "(parentheticals)" or "Name:" prefixes.`;

  const userPrompt = `EPISODE: "${episode.title}" (${episode.series})
REWRITING CHAPTER ${chapter.chapterNumber}: "${chapter.title}"
${prevBeats ? `\nIMMEDIATELY PRECEDING SCENES:\n${prevBeats}\n` : ''}
PREVIOUS DRAFT OF THIS CHAPTER (replace & elevate this):
${currentBeatsSummary}
${nextBeats ? `\nIMMEDIATELY FOLLOWING SCENES (must connect smoothly into these):\n${nextBeats}\n` : ''}
${directionNote?.trim() ? `\nDIRECTOR NOTE FOR THIS REWRITE:\n${directionNote.trim()}\n` : ''}
Write the ${targetCount} upgraded scenes now. Return ONLY { "beats": [...] }.`;

  return { systemPrompt, userPrompt };
}

export function replaceChapterBeatsInEpisode(params: {
  episode: EpisodeScript;
  chapter: EpisodeChapterSlice;
  rawNewBeats: unknown[];
  castBible?: CastBibleEntry[];
}): { ok: true; script: EpisodeScript; replacedCount: number } | { ok: false; error: string } {
  const { episode, chapter, rawNewBeats, castBible } = params;
  if (!Array.isArray(rawNewBeats) || rawNewBeats.length === 0) {
    return { ok: false, error: 'Regenerated chapter returned 0 scenes.' };
  }

  const isFinalChapter = chapter.endBeatIdx >= episode.beats.length - 1;
  const compiled = compileLiteOrFullToEpisode(
    {
      id: episode.id,
      title: episode.title,
      subtitle: episode.subtitle,
      series: episode.series,
      defaultRaag: episode.defaultRaag,
      language: episode.language,
      visualStyle: episode.visualStyle,
      cast: episode.cast,
      beats: rawNewBeats,
    },
    {
      preferredRenderStyle: episode.visualStyle?.renderStyle,
      castBible,
      ensureBookends: isFinalChapter,
      targetLanguage: getLanguageSpec(episode.language).code,
    }
  );
  if (!compiled.ok) return compiled;

  const before = episode.beats.slice(0, chapter.startBeatIdx);
  const after = episode.beats.slice(chapter.endBeatIdx + 1);
  const existingIds = new Set([...before.map((b) => b.id), ...after.map((b) => b.id)]);
  const stamp = Date.now().toString(36).slice(-4);

  const normalizedNewBeats = compiled.script.beats.map((b, i) => {
    let id = `ch${chapter.chapterNumber}_${stamp}_${i + 1}`;
    while (existingIds.has(id)) id = `${id}_x`;
    existingIds.add(id);
    return {
      ...b,
      id,
      frame: !isFinalChapter && b.frame === 'moral_card' ? 'main' : b.frame,
    };
  });

  // Preserve original locked cast (plus any brand-new characters if introduced)
  const knownCastIds = new Set(episode.cast.map((c) => c.id));
  const extraCast = compiled.script.cast.filter((c) => !knownCastIds.has(c.id));

  return {
    ok: true,
    script: {
      ...episode,
      cast: [...episode.cast, ...extraCast],
      beats: [...before, ...normalizedNewBeats, ...after],
    },
    replacedCount: normalizedNewBeats.length,
  };
}

export function buildAppendActPrompt(params: {
  episode: EpisodeScript;
  nextActNumber: number;
  directionNote?: string;
  targetBeats?: number;
}): { systemPrompt: string; userPrompt: string } {
  const { episode, nextActNumber, directionNote, targetBeats = 20 } = params;
  const langInfo = getLanguageSpec(episode.language || 'en');
  const castLines = episode.cast
    .map((c) => `- id: "${c.id}" | name: "${c.name}" | archetype: "${c.archetype}"`)
    .join('\n');
  const stageMenu = Array.from(new Set(episode.beats.map((b) => b.stage))).slice(0, 8).join(', ');
  const closingRecap = episode.beats
    .slice(-5)
    .map((b) => `[${b.title} · ${b.speakerLabel}]: "${b.dialogue}"`)
    .join('\n');

  const systemPrompt = `You are a Master Showrunner extending the Katha Studio episode "${episode.title}" with a brand-new ACT ${nextActNumber} (~2 minutes, ${targetBeats} scenes).

LOCKED CAST IDS (use ONLY these IDs in "who" and "speaker", plus "narrator"):
${castLines}

PREFERRED STAGE IDS: ${stageMenu}
VALID EXPRESSIONS (10): ${EXPRESSION_LIST.join(' | ')}

RULES:
1. Return ONLY raw valid JSON: { "beats": [ ... ] } (no markdown fences).
2. Beat 1 MUST be a Chapter Title card: "frame": "chapter_title", "title": "Act ${nextActNumber}: <Evocative Title>".
3. Write ${targetBeats} escalating scenes in ${langInfo.label} (${langInfo.nativeName}) with 12-18 words per beat and >=60% direct character dialogue.
4. End the final beat with "frame": "moral_card" delivering a fresh closing reflection.`;

  const userPrompt = `EPISODE SO FAR: "${episode.title}" (${episode.series})
RECENT CLOSING SCENES TO CONTINUE FROM:
${closingRecap}
${directionNote?.trim() ? `\nWHAT HAPPENS IN ACT ${nextActNumber}:\n${directionNote.trim()}\n` : `\nEscalate the stakes with a fresh twist or deeper trial for ${episode.cast[0]?.name || 'the protagonist'}.\n`}
Write all ${targetBeats} scenes for Act ${nextActNumber}. Return ONLY { "beats": [...] }.`;

  return { systemPrompt, userPrompt };
}

export function appendActBeatsToEpisode(params: {
  episode: EpisodeScript;
  nextActNumber: number;
  rawNewBeats: unknown[];
  castBible?: CastBibleEntry[];
}): { ok: true; script: EpisodeScript; appendedCount: number } | { ok: false; error: string } {
  const { episode, nextActNumber, rawNewBeats, castBible } = params;
  if (!Array.isArray(rawNewBeats) || rawNewBeats.length === 0) {
    return { ok: false, error: 'New act returned 0 scenes.' };
  }

  const compiled = compileLiteOrFullToEpisode(
    {
      id: episode.id,
      title: episode.title,
      subtitle: episode.subtitle,
      series: episode.series,
      defaultRaag: episode.defaultRaag,
      language: episode.language,
      visualStyle: episode.visualStyle,
      cast: episode.cast,
      beats: rawNewBeats,
    },
    {
      preferredRenderStyle: episode.visualStyle?.renderStyle,
      castBible,
      ensureBookends: true,
      targetLanguage: getLanguageSpec(episode.language).code,
    }
  );
  if (!compiled.ok) return compiled;

  // Demote previous closing moral_card (if any) so the new act flows naturally
  const baseBeats = episode.beats.map((b, idx) =>
    idx === episode.beats.length - 1 && b.frame === 'moral_card'
      ? { ...b, frame: 'main' as const, title: 'Cliffhanger Bridge' }
      : b
  );

  const existingIds = new Set(baseBeats.map((b) => b.id));
  const stamp = Date.now().toString(36).slice(-4);
  const appendedBeats = compiled.script.beats.map((b, i) => {
    let id = `act${nextActNumber}_${stamp}_${i + 1}`;
    while (existingIds.has(id)) id = `${id}_x`;
    existingIds.add(id);
    return { ...b, id };
  });

  // Guarantee Act opener has chapter_title
  if (appendedBeats.length > 0 && appendedBeats[0].frame !== 'chapter_title') {
    appendedBeats[0] = {
      ...appendedBeats[0],
      frame: 'chapter_title',
      title: appendedBeats[0].title || `Act ${nextActNumber}`,
    };
  }

  const knownCastIds = new Set(episode.cast.map((c) => c.id));
  const extraCast = compiled.script.cast.filter((c) => !knownCastIds.has(c.id));

  return {
    ok: true,
    script: {
      ...episode,
      cast: [...episode.cast, ...extraCast],
      beats: [...baseBeats, ...appendedBeats],
    },
    appendedCount: appendedBeats.length,
  };
}

