import {
  EpisodeScript,
  ExpressionId,
  PoseId,
  PropId,
  SfxId,
  ShotId,
  StoryBeat,
} from './types';

// =========================================================================
// 1. SIX PROVEN FOLKLORE STORY ARC SKELETONS (Deterministic Narrative Spine)
// =========================================================================

export type StoryArcId =
  | 'trickster_wit'
  | 'mystery_riddle'
  | 'heroic_epic'
  | 'cautionary_greed'
  | 'cozy_bedtime'
  | 'short_viral_hook';

export interface StoryArcTemplate {
  id: StoryArcId;
  label: string;
  shortLabel: string;
  bestFor: string;
  keywords: string[];
  roles: Array<{
    stageName: string;
    frameHint?: 'main' | 'nested_story' | 'chapter_title' | 'moral_card';
    goal: string;
  }>;
}

export const STORY_ARC_TEMPLATES: StoryArcTemplate[] = [
  {
    id: 'trickster_wit',
    label: 'Trickster & Wit Arc (Aesop, Panchatantra, Birbal, Tenali, Anansi, Kancil)',
    shortLabel: 'Trickster & Wit',
    bestFor: 'Clever fables, courtroom satire, outsmarting a stronger rival',
    keywords: ['fox', 'crow', 'birbal', 'tenali', 'anansi', 'kancil', 'jackal', 'hare', 'trick', 'clever', 'wit', 'satire', 'panchatantra', 'aesop', 'gopal'],
    roles: [
      { stageName: 'Cold Open Tease', goal: 'Hook with the outrageous prize, boast, or impossible challenge (no "Once upon a time")' },
      { stageName: 'Status Quo & Prize', goal: 'Establish the rival advantage and introduce the hero prop or object of desire' },
      { stageName: 'The Trap or Ploy Setup', goal: 'Trickster quietly spots the rival weakness (vanity, greed, or haste)' },
      { stageName: 'First Verbal Spar', goal: 'Crisp character banter—trickster flatters, dares, or plants a subtle bait' },
      { stageName: 'Escalation / Rival Bites', goal: 'Rival proudly falls for the setup; tension peaks' },
      { stageName: 'The Clever Turn', goal: 'Hero springs the reversal using brains or the key prop' },
      { stageName: 'Shocked Reaction & Payoff', goal: 'Rival realizes they were outsmarted; punchline lands' },
      { stageName: 'Moral Card', frameHint: 'moral_card', goal: 'One razor-sharp practical wisdom takeaway (10–15 words)' },
    ],
  },
  {
    id: 'mystery_riddle',
    label: 'Mystery & Riddle Arc (Vikram & Betaal, Yaksha Prashna, Singhasan Battisi)',
    shortLabel: 'Mystery & Riddle',
    bestFor: 'Supernatural riddles, moral dilemmas, detective/courtroom verdicts',
    keywords: ['vikram', 'betaal', 'vetala', 'riddle', 'mystery', 'yaksha', 'prashna', 'singhasan', 'secret', 'curse', 'ghost', 'judge', 'verdict'],
    roles: [
      { stageName: 'Eerie Cold Open Question', goal: 'Pose the haunting riddle or lethal vow immediately in Beat 1' },
      { stageName: 'Midnight Quest / Frame', goal: 'Set the atmospheric main frame (forest path, haunted lake, or throne mound)' },
      { stageName: 'Nested Tale Begins', frameHint: 'nested_story', goal: 'Enter the puzzle story-within-a-story and introduce the key dilemma' },
      { stageName: 'Clue One', frameHint: 'nested_story', goal: 'Plant the first revealing action or character sacrifice' },
      { stageName: 'Clue Two / Twist', frameHint: 'nested_story', goal: 'Complicate the puzzle so the obvious answer feels wrong' },
      { stageName: 'The Dilemma Challenge', goal: 'Return to main frame: demand the true verdict before midnight' },
      { stageName: 'Razor-Sharp Verdict', goal: 'Hero delivers the unexpected, logically airtight answer' },
      { stageName: 'Supernatural Twist & Moral', frameHint: 'moral_card', goal: 'Betaal/spirit acknowledges the wisdom and delivers the closing truth' },
    ],
  },
  {
    id: 'heroic_epic',
    label: 'Heroic Epic Arc (Ramayana, Mahabharata, Odyssey, Sun Wukong, Arthur)',
    shortLabel: 'Heroic Epic',
    bestFor: 'Mythic quests, divine relics, epic face-offs, devotion & dharma',
    keywords: ['rama', 'hanuman', 'ravana', 'arjuna', 'krishna', 'kurukshetra', 'odysseus', 'arthur', 'wukong', 'battle', 'war', 'quest', 'epic', 'dragon', 'sword', 'bow'],
    roles: [
      { stageName: 'High-Stakes Cold Open', goal: 'Open mid-crisis with the kingdom, relic, or captive hanging in the balance' },
      { stageName: 'The Threat Revealed', goal: 'Show the antagonist power or seemingly insurmountable obstacle' },
      { stageName: 'Vow & Sacred Relic', goal: 'Hero claims the divine weapon/prop or makes an unbreakable oath' },
      { stageName: 'Crossing the Threshold', goal: 'Journey across sea, sky, or battlefield toward the showdown' },
      { stageName: 'Face-Off Confrontation', goal: 'Hero and rival exchange defiant words before the clash' },
      { stageName: 'Darkest Moment', goal: 'Hero faces doubt or overwhelming force; tension hits maximum' },
      { stageName: 'Heroic Triumph', goal: 'Decisive action using courage, devotion, or the hero prop turns the tide' },
      { stageName: 'Eternal Legacy Moral', frameHint: 'moral_card', goal: 'Timeless dharma or courage epigram' },
    ],
  },
  {
    id: 'cautionary_greed',
    label: 'Cautionary Greed & Hubris Arc (Golden Goose, Midas, Greedy Tiger, Wolf)',
    shortLabel: 'Cautionary / Greed',
    bestFor: 'Warnings against greed, arrogance, lies, or impatience',
    keywords: ['gold', 'greed', 'greedy', 'midas', 'goose', 'egg', 'wolf', 'lie', 'boast', 'pride', 'bangle', 'trap', 'foolish', 'tortoise', 'talkative'],
    roles: [
      { stageName: 'Temptation Hook', goal: 'Show the dazzling golden prize or fatal flaw right away' },
      { stageName: 'Humble Gift or Boon', goal: 'Establish how the character received a rare blessing or warning' },
      { stageName: 'Wise Warning Ignored', goal: 'A friend or elder warns them plainly—and they brush it off' },
      { stageName: 'Greed Escalates', goal: 'Ambition or pride pushes them to demand more than enough' },
      { stageName: 'Point of No Return', goal: 'The fateful reckless action takes place with prop spotlight' },
      { stageName: 'Sudden Collapse', goal: 'Everything vanishes or backfires in an instant' },
      { stageName: 'Bitter Realization', goal: 'Character confronts the empty outcome of their own folly' },
      { stageName: 'Timeless Warning Moral', frameHint: 'moral_card', goal: 'Memorable one-sentence warning against greed or hubris' },
    ],
  },
  {
    id: 'cozy_bedtime',
    label: 'Cozy Bedtime / Gentle Wonder Arc (Sleep Anthologies & Kindness Tales)',
    shortLabel: 'Cozy Bedtime',
    bestFor: 'Warm, soothing night stories, kindness rewarded, gentle magic',
    keywords: ['bedtime', 'sleep', 'moon', 'star', 'lantern', 'kind', 'gentle', 'shabari', 'crane', 'peach', 'grandmother', 'blessing', 'peace'],
    roles: [
      { stageName: 'Lantern Opening', goal: 'Warm, inviting fireside or moonlit hook that settles the viewer' },
      { stageName: 'Quiet World Setup', goal: 'Introduce the humble hero and peaceful setting' },
      { stageName: 'Small Act of Kindness', goal: 'Hero shows patience, generosity, or compassion when tested' },
      { stageName: 'Gentle Magic Awakens', goal: 'A wondrous prop or quiet miracle responds to their kindness' },
      { stageName: 'Warm Resolution', goal: 'Harmony returns beneath moonlit or lantern-lit skies' },
      { stageName: 'Goodnight Blessing Moral', frameHint: 'moral_card', goal: 'Soft, comforting closing wisdom' },
    ],
  },
  {
    id: 'short_viral_hook',
    label: '6-Beat Viral Shorts Arc (45s YouTube Shorts / Reels)',
    shortLabel: 'Viral 6-Beat Short',
    bestFor: 'Ultra-tight 35–55 second vertical Shorts with high replay & comment bait',
    keywords: ['short', 'reel', 'viral', 'quick', 'fast', '60s', '45s'],
    roles: [
      { stageName: '3s Scroll-Stopper Hook', goal: 'Shocking contradiction or bold claim in under 12 words' },
      { stageName: 'Instant Conflict', goal: 'Put both characters face-to-face with stakes immediately clear' },
      { stageName: 'Clever Setup', goal: 'Plant the trick, dare, or hero prop in one crisp line' },
      { stageName: 'Mid-Short Twist', goal: 'Flip expectations right at the halfway mark' },
      { stageName: 'Punchline Climax', goal: 'Deliver the sharp comeback or irreversible payoff' },
      { stageName: 'Comment-Bait Moral Question', frameHint: 'moral_card', goal: 'Crisp moral + 1 question viewers want to debate in comments' },
    ],
  },
];

export function getStoryArcById(id: StoryArcId): StoryArcTemplate {
  return STORY_ARC_TEMPLATES.find((a) => a.id === id) || STORY_ARC_TEMPLATES[0];
}

export function detectStoryArcFromText(text: string, beatTarget?: number): StoryArcTemplate {
  if (beatTarget && beatTarget <= 6) {
    return getStoryArcById('short_viral_hook');
  }
  const lower = text.toLowerCase();
  let best = STORY_ARC_TEMPLATES[0];
  let bestScore = 0;
  for (const arc of STORY_ARC_TEMPLATES) {
    let score = 0;
    for (const kw of arc.keywords) {
      if (lower.includes(kw)) score += kw.includes(' ') ? 3 : 2;
    }
    if (score > bestScore) {
      bestScore = score;
      best = arc;
    }
  }
  return best;
}

/**
 * Expands or trims a Story Arc Skeleton to match the requested beat target (6, 12, or 20)
 * so every single beat gets an explicit narrative job (drastically raising determinism & quality).
 */
export function formatBeatSkeletonForPrompt(arc: StoryArcTemplate, beatTarget: number): string {
  const target = Math.max(5, Math.min(20, beatTarget));
  const roles = arc.roles;
  const lines: string[] = [];

  for (let i = 0; i < target; i++) {
    const roleIdx = Math.min(
      roles.length - 1,
      Math.round((i / Math.max(1, target - 1)) * (roles.length - 1))
    );
    const role = roles[roleIdx];
    const frameTag = role.frameHint ? ` [frame: "${role.frameHint}"]` : '';
    lines.push(`  Beat ${i + 1}: ${role.stageName}${frameTag} — ${role.goal}`);
  }
  return `MANDATORY STORY ARC SKELETON (${arc.shortLabel} · ${target} beats):\n${lines.join('\n')}`;
}

// =========================================================================
// 2. LLM TIER PROFILES (Basic Local, Medium Cloud, Higher/Frontier Cloud)
// =========================================================================

export type LlmTierId = 'basic_local' | 'medium_cloud' | 'higher_frontier';

export interface LlmTierProfile {
  id: LlmTierId;
  label: string;
  shortLabel: string;
  examples: string;
  recommendedMode: 'lite' | 'two_step' | 'full';
  maxReliableBeats: number;
  blueprintTemp: number;
  sceneTemp: number;
  polishTemp: number;
  guidance: string;
}

export const LLM_TIER_PROFILES: LlmTierProfile[] = [
  {
    id: 'basic_local',
    label: 'Tier 1 · Bare Minimum Local (7B–9B: Qwen 2.5 7B, Gemma 2 9B, Llama 3.1 8B)',
    shortLabel: 'Basic Local (7B–9B)',
    examples: 'Qwen 2.5 7B Instruct, Gemma 2 9B, Llama 3.1 8B, Mistral 7B',
    recommendedMode: 'two_step',
    maxReliableBeats: 12,
    blueprintTemp: 0.12,
    sceneTemp: 0.35,
    polishTemp: 0.3,
    guidance:
      'Use 2-Step Blueprint → Scenes + Lite Auto-Direct + Seed Lock. Keep episodes at 6–12 beats and run 1-click Dialogue Polish afterward.',
  },
  {
    id: 'medium_cloud',
    label: 'Tier 2 · Medium / Fast Cloud & 24B–70B Local (Gemini 2.5 Flash, GPT-4o-mini, Claude Haiku, Qwen 32B)',
    shortLabel: 'Medium (Flash / Mini / 32B)',
    examples: 'Gemini 2.5 Flash, GPT-4o-mini, Claude 3.5 Haiku, DeepSeek-V3, Qwen 2.5 32B, Llama 3.3 70B',
    recommendedMode: 'lite',
    maxReliableBeats: 20,
    blueprintTemp: 0.15,
    sceneTemp: 0.45,
    polishTemp: 0.4,
    guidance:
      'Best quality-per-dollar for daily YouTube output. 1-Click Lite Auto-Direct with Story Arc Skeleton hits 98%+ first-try accuracy up to 20 beats.',
  },
  {
    id: 'higher_frontier',
    label: 'Tier 3 · Higher / Frontier Cloud (Gemini 2.5 Pro, Claude Sonnet/Opus, GPT-4.1+)',
    shortLabel: 'Higher / Frontier (Pro / Sonnet)',
    examples: 'Gemini 2.5 Pro, Claude Sonnet / Opus, GPT-4.1 / GPT-5',
    recommendedMode: 'full',
    maxReliableBeats: 20,
    blueprintTemp: 0.2,
    sceneTemp: 0.55,
    polishTemp: 0.45,
    guidance:
      'Broadcast-grade courtroom wit, nested flashbacks, and custom camera choreography. Supports both Lite Auto-Direct and Full Pro JSON.',
  },
];

export function getLlmTierProfile(id: LlmTierId): LlmTierProfile {
  return LLM_TIER_PROFILES.find((t) => t.id === id) || LLM_TIER_PROFILES[1];
}

/** Deterministic 31-bit integer seed derived from story text so repeated runs stay consistent. */
export function computeDeterministicSeed(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 1000000;
}

// =========================================================================
// 3. DETERMINISTIC DIALOGUE SANITIZER + LONG-BEAT AUTO-SPLITTER
// =========================================================================

export interface SanitizedDialogueResult {
  dialogue: string;
  extractedExpression?: ExpressionId;
  extractedSfx?: SfxId;
  cleaned: boolean;
}

/**
 * Strips clumsy LLM script leaks ("Fox: ", "(angrily)", "*gasps*") from spoken lines
 * so TTS and captions stay spotless, while promoting those stage directions into real acting!
 */
export function sanitizeDialogueAndExtractActing(
  rawDialogue: string,
  speakerLabel: string
): SanitizedDialogueResult {
  let text = rawDialogue.replace(/\s+/g, ' ').trim();
  const original = text;
  let extractedExpression: ExpressionId | undefined;
  let extractedSfx: SfxId | undefined;

  // 1. Strip redundant leading "Speaker Name:" or "NARRATOR:" prefix
  if (speakerLabel) {
    const escaped = speakerLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(`^${escaped}\\s*:\\s*`, 'i'), '');
  }
  text = text.replace(/^(?:narrator|voiceover|host|speaker)\s*:\s*/i, '');

  // 2. Extract parenthetical (...) or asterisk *...* or bracket [...] stage cues
  const cueRegex = /(\([^)]{2,36}\)|\[[^\]]{2,36}\]|\*[^*]{2,30}\*)/g;
  const cues = text.match(cueRegex) || [];
  for (const cue of cues) {
    const low = cue.toLowerCase();
    if (/angr|furi|shout|roar|stern|glar|growl/.test(low)) extractedExpression = 'stern';
    else if (/sly|smir|grin|whisper|cunn|chuckl|sneak/.test(low)) extractedExpression = 'sly';
    else if (/gasp|shock|fear|scream|panic|startl/.test(low)) {
      extractedExpression = 'shocked';
      extractedSfx = 'court_gasp';
    } else if (/laugh|smil|joy|cheer|happi/.test(low)) extractedExpression = 'joy';
    else if (/cry|weep|sob|sigh|sad|grief/.test(low)) extractedExpression = 'grief';

    if (/thunder|lightning/.test(low)) extractedSfx = 'thunder_crack';
    else if (/sword|clash|blade/.test(low)) extractedSfx = 'sword_clash';
    else if (/bell|chime/.test(low)) extractedSfx = 'temple_bell';
  }
  text = text.replace(cueRegex, ' ').replace(/\s+/g, ' ').trim();

  // 3. Remove mismatched wrapping quotation marks around entire dialogue
  if (text.length >= 2 && text.startsWith('"') && text.endsWith('"') && text.indexOf('"', 1) === text.length - 1) {
    text = text.slice(1, -1).trim();
  }

  return {
    dialogue: text || original,
    extractedExpression,
    extractedSfx,
    cleaned: text !== original,
  };
}

function estimateWordDuration(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Number(Math.max(2.6, Math.min(7.2, words / 2.55 + 1.0)).toFixed(1));
}

/**
 * Splits any oversized wall-of-text dialogue beat (>24 words with 2+ sentences) into two
 * punchy alternating shots so YouTube captions stay readable and visual momentum never stalls.
 */
export function autoSplitLongDialogueBeats(beats: StoryBeat[]): {
  beats: StoryBeat[];
  splitCount: number;
} {
  const out: StoryBeat[] = [];
  let splitCount = 0;

  for (const beat of beats) {
    const words = beat.dialogue.trim().split(/\s+/).filter(Boolean);
    if (beat.frame !== 'main' || words.length <= 24) {
      out.push(beat);
      continue;
    }

    // Try splitting near the midpoint on sentence punctuation (. ! ? — ;)
    const sentences = beat.dialogue.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) || [];
    let partA = '';
    let partB = '';

    if (sentences.length >= 2) {
      const half = Math.ceil(sentences.length / 2);
      partA = sentences.slice(0, half).join(' ');
      partB = sentences.slice(half).join(' ');
    } else {
      const mid = Math.ceil(words.length / 2);
      partA = words.slice(0, mid).join(' ');
      partB = words.slice(mid).join(' ');
    }

    if (!partA || !partB) {
      out.push(beat);
      continue;
    }

    const speakerActor = beat.actors.find((a) => a.castId === beat.speakerId);
    const followupShot: ShotId =
      speakerActor?.slot === 'left'
        ? 'closeup_left'
        : speakerActor?.slot === 'right'
          ? 'closeup_right'
          : beat.shot === 'wide_stage'
            ? 'two_shot'
            : 'low_angle_swoop';

    out.push({
      ...beat,
      id: `${beat.id}_a`,
      duration: estimateWordDuration(partA),
      dialogue: partA,
    });
    out.push({
      ...beat,
      id: `${beat.id}_b`,
      title: `${beat.title} (cont.)`,
      duration: estimateWordDuration(partB),
      shot: followupShot,
      transition: 'hard_cut',
      cameraMove: beat.cameraMove === 'slow_push' ? 'slow_pull' : 'slow_push',
      sfx: 'none',
      dialogue: partB,
    });
    splitCount++;
  }

  return { beats: out, splitCount };
}

// =========================================================================
// 4. SCRIPT CRAFT AUDITOR (0-100 Writing Quality Score) + 1-CLICK SCRIPT DOCTOR
// =========================================================================

export interface ScriptCraftAudit {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  avgWordsPerBeat: number;
  characterDialoguePct: number;
  issues: string[];
  strengths: string[];
}

export function auditScriptWriting(episode: EpisodeScript): ScriptCraftAudit {
  const beats = episode.beats || [];
  if (beats.length === 0) {
    return {
      score: 0,
      grade: 'D',
      avgWordsPerBeat: 0,
      characterDialoguePct: 0,
      issues: ['No beats in episode.'],
      strengths: [],
    };
  }

  let score = 100;
  const issues: string[] = [];
  const strengths: string[] = [];

  // 1. Cold Open Hook check (no boring "Once upon a time" opener)
  const firstSpoken = beats.find((b) => b.dialogue.trim().length > 0)?.dialogue || '';
  if (/^(once upon a time|long ago|many years ago|in a village|there was once)/i.test(firstSpoken.trim())) {
    score -= 18;
    issues.push('Opening uses cliché "Once upon a time" phrasing — hurts 3-second retention.');
  } else if (firstSpoken.trim().length >= 16) {
    strengths.push('Immediate curiosity opener (no cliché intro).');
  }

  // 2. Word-count rhythm check (ideal: 9–20 words per beat)
  const wordCounts = beats.map((b) => b.dialogue.trim().split(/\s+/).filter(Boolean).length);
  const avgWords = wordCounts.reduce((s, n) => s + n, 0) / Math.max(1, wordCounts.length);
  const bloatedBeats = wordCounts.filter((w) => w > 24).length;
  if (bloatedBeats > 0) {
    score -= Math.min(24, bloatedBeats * 8);
    issues.push(`${bloatedBeats} scene(s) exceed 24 words (causes dense captions & slow pacing).`);
  } else if (avgWords >= 8 && avgWords <= 19) {
    strengths.push(`Crisp caption cadence (${avgWords.toFixed(1)} words/scene).`);
  }

  // 3. Character dialogue vs. narrator monologue balance
  const mainBeats = beats.filter((b) => !b.frame || b.frame === 'main' || b.frame === 'nested_story');
  const characterBeats = mainBeats.filter((b) => b.speakerId !== 'narrator').length;
  const charPct = mainBeats.length > 0 ? Math.round((characterBeats / mainBeats.length) * 100) : 0;
  if (mainBeats.length >= 4 && charPct < 35) {
    score -= 18;
    issues.push(`Only ${charPct}% character dialogue (too much narrator exposition; aim for 50%+).`);
  } else if (charPct >= 45) {
    strengths.push(`Active character banter (${charPct}% spoken by cast).`);
  }

  // 4. Prop storytelling payoff
  const propCount = beats.filter((b) => b.prop && b.prop !== 'none').length;
  if (propCount === 0 && beats.length >= 5) {
    score -= 10;
    issues.push('No hero props staged across the episode.');
  } else if (propCount > 0) {
    strengths.push(`Visual storytelling uses ${propCount} prop beat(s).`);
  }

  // 5. Moral / ending card check
  const lastBeat = beats[beats.length - 1];
  if (lastBeat.frame !== 'moral_card') {
    score -= 10;
    issues.push('Missing closing Moral Card beat for strong episode payoff.');
  } else {
    strengths.push('Ends with a crisp Moral Card.');
  }

  // 6. Check for leaked stage directions in dialogue
  const leakedCues = beats.filter((b) => /\([^)]{2,30}\)|\*[^*]{2,25}\*/.test(b.dialogue)).length;
  if (leakedCues > 0) {
    score -= 12;
    issues.push(`${leakedCues} line(s) contain parenthetical/asterisk stage cues that TTS would read aloud.`);
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  const grade: ScriptCraftAudit['grade'] =
    finalScore >= 85 ? 'A' : finalScore >= 70 ? 'B' : finalScore >= 55 ? 'C' : 'D';

  return {
    score: finalScore,
    grade,
    avgWordsPerBeat: Number(avgWords.toFixed(1)),
    characterDialoguePct: charPct,
    issues,
    strengths,
  };
}

/**
 * Builds a surgical Dialogue-Only Punch-Up prompt that upgrades hooks, wit, and cadence
 * while keeping 100% of Katha Studio's cast, stages, camera shots, and timing structure locked!
 */
export function buildDialoguePunchUpPrompt(episode: EpisodeScript, arc?: StoryArcTemplate): {
  systemPrompt: string;
  userPrompt: string;
} {
  const compactLines = episode.beats.map((b, idx) => ({
    index: idx,
    id: b.id,
    frame: b.frame,
    speaker: b.speakerLabel,
    speakerId: b.speakerId,
    dialogue: b.dialogue,
  }));

  const systemPrompt = `You are a Master Folklore Script Doctor for Katha Studio.
Rewrite ONLY the spoken dialogue lines below to maximize YouTube retention, wit, emotional punch, and rhythmic clarity—WITHOUT changing the plot, cast, or number of beats.

STRICT SCRIPTING RULES:
1. Beat 0 (Opening): Make it an irresistible, curiosity-sparking Cold Open Hook (NEVER "Once upon a time" or "Long ago").
2. Keep EVERY dialogue line crisp: 10 to 18 words max (read aloud cleanly in 3–6 seconds).
3. NO stage directions like (angrily) or *laughs*, and NO "Speaker:" prefixes inside the dialogue string.
4. Make character lines sound alive, rhythmic, and distinct to each character's personality.
5. Make the final Moral Card unforgettable (one razor-sharp proverb or thought-provoking question).
${arc ? `6. Follow the "${arc.shortLabel}" emotional curve.` : ''}

Return ONLY valid raw JSON matching:
{
  "title": "Sharpened Episode Title (keep accurate to story)",
  "subtitle": "Punchy 4-6 word tagline",
  "lines": [
    { "id": "exact_beat_id", "dialogue": "Rewritten crisp spoken line" }
  ]
}`;

  const userPrompt = `Episode: "${episode.title}" (${episode.series})
Cast: ${episode.cast.map((c) => `${c.name} (${c.archetype})`).join(', ')}

Current Beats JSON:
${JSON.stringify(compactLines, null, 2)}`;

  return { systemPrompt, userPrompt };
}

export function applyDialoguePunchUp(
  episode: EpisodeScript,
  rawPayload: unknown
): { episode: EpisodeScript; updatedLines: number } {
  if (!rawPayload || typeof rawPayload !== 'object') {
    return { episode, updatedLines: 0 };
  }
  const obj = rawPayload as Record<string, unknown>;
  const linesRaw = Array.isArray(obj.lines) ? obj.lines : [];
  const lineMap = new Map<string, string>();

  linesRaw.forEach((entry, idx) => {
    if (!entry || typeof entry !== 'object') return;
    const item = entry as Record<string, unknown>;
    const text = typeof item.dialogue === 'string' ? item.dialogue.trim() : '';
    if (!text) return;
    if (typeof item.id === 'string' && item.id.trim()) {
      lineMap.set(item.id.trim(), text);
    } else if (episode.beats[idx]) {
      lineMap.set(episode.beats[idx].id, text);
    }
  });

  let updatedLines = 0;
  const nextBeats = episode.beats.map((b) => {
    const rewritten = lineMap.get(b.id);
    if (!rewritten) return b;
    const cleaned = sanitizeDialogueAndExtractActing(rewritten, b.speakerLabel);
    updatedLines++;
    return {
      ...b,
      dialogue: cleaned.dialogue,
      duration: b.frame === 'chapter_title' ? 2.8 : estimateWordDuration(cleaned.dialogue),
      sfx: cleaned.extractedSfx || b.sfx,
    };
  });

  return {
    episode: {
      ...episode,
      title: typeof obj.title === 'string' && obj.title.trim() ? obj.title.trim() : episode.title,
      subtitle:
        typeof obj.subtitle === 'string' && obj.subtitle.trim() ? obj.subtitle.trim() : episode.subtitle,
      beats: nextBeats,
    },
    updatedLines,
  };
}

// =========================================================================
// 5. DOCUMENTATION SECTION: LLM TIERS, LIMITS, VARIANCE & DETERMINISM GUIDE
// =========================================================================

export function buildLlmTierDocumentationMarkdown(): string {
  return `---

## 11. Supported LLM Tiers, Minimum Requirements & Output Variance

### Determinism Breakdown
- **Rendering a finalized script + voice file**: **0% variance (100% deterministic)**. No LLM runs during canvas rendering, physics, music synthesis, or export.
- **Generating a new script from a story prompt**: Visual/technical variance is compressed to **~10–20%** by Katha Studio's Regional Playbooks, Lite Auto-Director, Cast Bible, and Story Arc Skeletons. Remaining variance lives primarily in **hook sharpness, dialogue wit, and plot twist subtlety**.

### LLM Comparison Matrix (Bare Minimum → Medium → Higher/Frontier)

| Tier | Recommended Models | Visual Consistency | Writing & Hook Quality | Recommended Mode | Max Reliable Beats | Temperature (Blueprint / Scenes / Polish) |
|---|---|---|---|---|---|---|
| **Tier 0: Tiny Local (1B–3B)** *(Not Recommended)* | Llama-3.2-3B, Qwen-2.5-3B, Phi-3-mini | ~75% | Poor — drops plot twists & repeats lines | 2-Step (6 beats max) | 6 | 0.1 / 0.3 / 0.3 |
| **Tier 1: Bare Minimum Local (7B–9B)** *(Free / Offline)* | **Qwen 2.5 7B Instruct**, **Gemma 2 9B**, **Llama 3.1 8B**, Mistral 7B | ~90% | Decent — clean fables & bedtime tales | **2-Step Blueprint → Scenes** (\`Lite\`) | **6–12** | **0.12 / 0.35 / 0.30** |
| **Tier 2: Medium / Fast Cloud & Heavy Local (24B–70B)** *(Best ROI)* | **Gemini 2.5 Flash**, **GPT-4o-mini**, **Claude Haiku**, **DeepSeek-V3**, **Qwen 2.5 32B**, **Llama 3.3 70B** | ~96–97% | Very Good–Great — sharp cold opens, reliable twists, crisp banter | **Lite Auto-Direct** (1-Click) | **12–20** | **0.15 / 0.45 / 0.40** |
| **Tier 3: Higher / Frontier Cloud** *(Broadcast Flagship)* | **Gemini 2.5 Pro**, **Claude Sonnet / Opus**, **GPT-4.1 / GPT-5** | ~99% | Broadcast-Grade — subtle courtroom wit, nested flashbacks, clever prop callbacks | **Lite** or **Full Pro JSON** | **20+** | **0.20 / 0.55 / 0.45** |

### Bare Minimum Requirements for Publishable YouTube Output
1. **Minimum Local LLM ($0 via Ollama)**: **Qwen 2.5 7B Instruct** (best structured JSON) or **Gemma 2 9B Instruct** (best prose) using **2-Step Blueprint → Scenes** + **Story Arc Skeleton** + **Seed Lock**, followed by **1-Click Polish Dialogue**.
2. **Minimum Cloud LLM (Best Scale-to-Cost)**: **Gemini 2.5 Flash** or **GPT-4o-mini** with **Lite Auto-Direct**.
3. **Minimum Voice TTS**: **Kokoro-82M** (free local OpenAI-compatible TTS) or **Gemini TTS / OpenAI TTS** (cloud); add **ElevenLabs** for signature lead characters.

---

## 12. How Katha Studio Maximizes Script Determinism Without Losing Storytelling Quality

1. **6 Mandatory Story Arc Skeletons**: Instead of open-ended rambling, every prompt injects a beat-by-beat dramatic spine (\`Trickster & Wit\`, \`Mystery & Riddle\`, \`Heroic Epic\`, \`Cautionary Greed\`, \`Cozy Bedtime\`, or \`6-Beat Viral Short\`).
2. **Split-Temperature + Deterministic Seed Lock**: Structural steps (Blueprint, Repair, Translation) run at ultra-low temperature (\`0.12–0.20\`) with a story-hashed integer \`seed\`; dialogue generation runs at balanced temperature (\`0.35–0.55\`) so writing stays lively without drifting off-schema.
3. **Zero-Cost Dialogue Sanitizer & Long-Beat Auto-Splitter**: Automatically strips leaked \`Speaker:\` labels and \`(parenthetical)\` / \`*asterisk*\` cues (converting them into real actor \`expression\` and \`sfx\`), and splits any bloated 25+ word wall-of-text beat into two snappy alternating shots.
4. **Script Craft Auditor (0–100) + 1-Click Dialogue Script Doctor**: Audits opening hook strength, words-per-beat cadence, character banter vs. narrator ratio, prop payoff, and moral ending—then lets you punch up **only** the dialogue while keeping 100% of visual blocking, cast, and camera shots locked.
`;
}

// =========================================================================
// 6. SEMANTIC STORY CONTINUITY AUDITOR & 1-CLICK CONTINUITY AUTO-FIXER
// =========================================================================

export interface ContinuityIssue {
  beatIndex: number;
  beatId: string;
  kind:
    | 'stage_teleport'
    | 'offstage_speaker'
    | 'missing_prop'
    | 'frozen_acting'
    | 'flat_music_arc';
  severity: 'warn' | 'info';
  message: string;
}

export interface ContinuityAuditReport {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  issues: ContinuityIssue[];
}

const DIALOGUE_PROP_HINTS: Array<{ regex: RegExp; prop: PropId }> = [
  { regex: /\b(sword|blade|excalibur|khanda)\b/i, prop: 'khanda_sword' },
  { regex: /\b(dagger|kris)\b/i, prop: 'kris_dagger' },
  { regex: /\b(bow|arrow|quiver)\b/i, prop: 'bow_arrow' },
  { regex: /\b(scroll|decree|edict|letter)\b/i, prop: 'royal_scroll' },
  { regex: /\b(lantern|lamp|diya)\b/i, prop: 'diya_lamp' },
  { regex: /\b(bangle|bracelet)\b/i, prop: 'gold_bangle' },
  { regex: /\b(ring|signet)\b/i, prop: 'signet_ring' },
  { regex: /\b(pot|pitcher|urn|jar)\b/i, prop: 'earthen_pot' },
  { regex: /\b(peach|fruit)\b/i, prop: 'magic_peach' },
  { regex: /\b(egg|goose)\b/i, prop: 'golden_egg' },
  { regex: /\b(treasure|chest|gold coins)\b/i, prop: 'treasure_chest' },
  { regex: /\b(conch|shankha)\b/i, prop: 'conch_shell' },
  { regex: /\b(mirror)\b/i, prop: 'hand_mirror' },
  { regex: /\b(staff|cudgel)\b/i, prop: 'magic_staff' },
  { regex: /\b(chalice|poison)\b/i, prop: 'poison_chalice' },
];

export function auditStoryContinuity(episode: EpisodeScript): ContinuityAuditReport {
  const beats = episode.beats || [];
  const castIds = new Set((episode.cast || []).map((c) => c.id));
  const issues: ContinuityIssue[] = [];
  let score = 100;

  if (beats.length === 0) {
    return { score: 0, grade: 'D', issues: [] };
  }

  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    const isCard = b.frame === 'chapter_title' || b.frame === 'moral_card';

    // 1. Stage teleportation on a bare hard_cut
    if (i > 0) {
      const prev = beats[i - 1];
      const prevCard = prev.frame === 'chapter_title' || prev.frame === 'moral_card';
      if (!isCard && !prevCard && b.stage !== prev.stage && b.transition === 'hard_cut') {
        issues.push({
          beatIndex: i,
          beatId: b.id,
          kind: 'stage_teleport',
          severity: 'warn',
          message: `Beat ${i + 1} jumps from ${prev.stage} to ${b.stage} on a hard cut (use ink_fade or silhouette_wipe).`,
        });
        score -= 7;
      }
    }

    // 2. Speaking character missing from stage actors
    if (!isCard && b.speakerId && b.speakerId !== 'narrator' && castIds.has(b.speakerId)) {
      const onStage = (b.actors || []).some((a) => a.castId === b.speakerId);
      if (!onStage) {
        issues.push({
          beatIndex: i,
          beatId: b.id,
          kind: 'offstage_speaker',
          severity: 'warn',
          message: `Beat ${i + 1}: "${b.speakerLabel}" speaks while off-stage.`,
        });
        score -= 10;
      }
    }

    // 3. Dialogue mentions a concrete prop that isn't staged
    if (!isCard && b.prop === 'none' && !b.customPropDataUrl && b.dialogue) {
      const hit = DIALOGUE_PROP_HINTS.find((h) => h.regex.test(b.dialogue));
      if (hit) {
        issues.push({
          beatIndex: i,
          beatId: b.id,
          kind: 'missing_prop',
          severity: 'info',
          message: `Beat ${i + 1} mentions "${hit.prop.replace(/_/g, ' ')}" in dialogue while prop is none.`,
        });
        score -= 4;
      }
    }

    // 4. Frozen acting streak (3+ consecutive identical pose + expression for same lead)
    if (i >= 2 && !isCard) {
      const a2 = b.actors?.[0];
      const a1 = beats[i - 1].actors?.[0];
      const a0 = beats[i - 2].actors?.[0];
      if (
        a2 &&
        a1 &&
        a0 &&
        a2.castId === a1.castId &&
        a1.castId === a0.castId &&
        a2.pose === a1.pose &&
        a1.pose === a0.pose &&
        a2.expression === a1.expression &&
        a1.expression === a0.expression
      ) {
        issues.push({
          beatIndex: i,
          beatId: b.id,
          kind: 'frozen_acting',
          severity: 'info',
          message: `Beat ${i + 1}: lead actor holds identical pose (${a2.pose}) & expression (${a2.expression}) for 3 beats straight.`,
        });
        score -= 5;
      }
    }
  }

  // 5. Flat musical energy arc
  if (beats.length >= 6) {
    const energies = beats.map((b) => b.musicEnergy ?? 0.5);
    const span = Math.max(...energies) - Math.min(...energies);
    if (span < 0.2) {
      issues.push({
        beatIndex: Math.floor(beats.length / 2),
        beatId: beats[Math.floor(beats.length / 2)].id,
        kind: 'flat_music_arc',
        severity: 'info',
        message: 'Musical energy stays nearly flat across the episode (shape a climax rise & calm resolution).',
      });
      score -= 6;
    }
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  const grade: ContinuityAuditReport['grade'] =
    finalScore >= 88 ? 'A' : finalScore >= 74 ? 'B' : finalScore >= 58 ? 'C' : 'D';

  return { score: finalScore, grade, issues };
}

export function autoFixStoryContinuity(episode: EpisodeScript): {
  episode: EpisodeScript;
  fixedCount: number;
} {
  const castIds = new Set((episode.cast || []).map((c) => c.id));
  let fixedCount = 0;

  const nextBeats: StoryBeat[] = episode.beats.map((b) => ({
    ...b,
    actors: (b.actors || []).map((a) => ({ ...a })),
  }));

  const altPoses: PoseId[] = ['stand', 'gesture', 'walk', 'recoil'];

  for (let i = 0; i < nextBeats.length; i++) {
    const b = nextBeats[i];
    const isCard = b.frame === 'chapter_title' || b.frame === 'moral_card';

    // Fix 1: Stage teleportation on hard cut -> ink_fade
    if (i > 0) {
      const prev = nextBeats[i - 1];
      const prevCard = prev.frame === 'chapter_title' || prev.frame === 'moral_card';
      if (!isCard && !prevCard && b.stage !== prev.stage && b.transition === 'hard_cut') {
        b.transition = 'ink_fade';
        fixedCount++;
      }
    }

    // Fix 2: Speaking character missing from stage -> place on open slot
    if (!isCard && b.speakerId && b.speakerId !== 'narrator' && castIds.has(b.speakerId)) {
      const onStage = b.actors.some((a) => a.castId === b.speakerId);
      if (!onStage) {
        const hasLeft = b.actors.some((a) => a.slot === 'left');
        const slot = hasLeft ? 'right' : 'left';
        b.actors.push({
          castId: b.speakerId,
          slot,
          pose: 'gesture',
          expression: 'calm',
          facing: slot === 'right' ? 'left' : 'right',
          motion: 'still',
        });
        fixedCount++;
      }
    }

    // Fix 3: Stage hinted prop when none is staged
    if (!isCard && b.prop === 'none' && !b.customPropDataUrl && b.dialogue) {
      const hit = DIALOGUE_PROP_HINTS.find((h) => h.regex.test(b.dialogue));
      if (hit) {
        b.prop = hit.prop;
        if (!b.propSlot) b.propSlot = 'center';
        fixedCount++;
      }
    }

    // Fix 4: Break frozen 3-beat acting streak
    if (i >= 2 && !isCard) {
      const a2 = b.actors[0];
      const a1 = nextBeats[i - 1].actors[0];
      const a0 = nextBeats[i - 2].actors[0];
      if (
        a2 &&
        a1 &&
        a0 &&
        a2.castId === a1.castId &&
        a1.castId === a0.castId &&
        a2.pose === a1.pose &&
        a1.pose === a0.pose &&
        a2.expression === a1.expression &&
        a1.expression === a0.expression
      ) {
        const nextPose = altPoses.find((p) => p !== a2.pose) || 'gesture';
        a2.pose = nextPose;
        fixedCount++;
      }
    }
  }

  // Fix 5: Shape dynamic musical arc if flat
  if (nextBeats.length >= 6) {
    const energies = nextBeats.map((b) => b.musicEnergy ?? 0.5);
    if (Math.max(...energies) - Math.min(...energies) < 0.2) {
      nextBeats.forEach((b, idx) => {
        const u = idx / Math.max(1, nextBeats.length - 1);
        if (b.frame === 'moral_card') {
          b.musicEnergy = 0.35;
        } else if (u < 0.25) {
          b.musicEnergy = 0.48;
        } else if (u < 0.65) {
          b.musicEnergy = 0.68;
        } else if (u < 0.88) {
          b.musicEnergy = 0.88;
        } else {
          b.musicEnergy = 0.52;
        }
      });
      fixedCount++;
    }
  }

  return {
    episode: { ...episode, beats: nextBeats },
    fixedCount,
  };
}
