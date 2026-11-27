/**
 * Katha Studio — YouTube Monetization & YPP Policy Shield
 *
 * Addresses the 5 highest-ROI policy pillars that keep animated folklore
 * channels approved and earning full RPM under YouTube Partner Program (YPP)
 * and Advertiser-Friendly Content Guidelines:
 *   1. Anti-Repetitious / Anti-"Inauthentic Mass-Produced" Diversity Ledger
 *   2. Transformative Editorial Commentary & Cultural Context Defense
 *   3. First-30s & Full-Script Ad-Safe Vocabulary Shield (Yellow-Icon Guard)
 *   4. COPPA / Accidental "Made for Kids" RPM-Cliff Guard
 *   5. Altered/Synthetic Disclosure & Public-Domain Provenance Checklist
 */
import {
  ColorGradeId,
  EpisodeScript,
  LookPresetId,
  RaagId,
  RenderStyleId,
  ShotId,
  StageId,
  SurfaceTextureId,
  getRecommendedRenderStyle,
} from './types';
import { resolveEpisodeLanguage } from './i18n';
import {
  CharacterSilhouetteFingerprint,
  SILHOUETTE_TWIN_THRESHOLD,
  computeDnaFingerprint,
  computeSilhouetteDistance,
  mutateDnaForUniqueness,
  syncMemberWithDna,
} from './characterDna';
import { CastBibleEntry, loadCastBible } from './castBible';

export type AudienceTarget = 'general_audience' | 'made_for_kids';
export type YppCategory = 'repetitious' | 'transformative' | 'ad_safety' | 'coppa' | 'disclosure';
export type YppSeverity = 'high' | 'medium' | 'info';

export interface PublishLedgerEntry {
  id: string;
  title: string;
  series: string;
  renderStyle: RenderStyleId;
  primaryStage: StageId;
  defaultRaag: RaagId;
  firstBeatShot: ShotId;
  openingSignature: string;
  exportedAt: string;
  /** Compact structural character silhouette fingerprints for anti-template clone auditing */
  castFingerprints?: CharacterSilhouetteFingerprint[];
}

export interface AdTriggerMatch {
  term: string;
  replacement: string;
  location: string;
  beatIndex: number | null;
  inFirst30s: boolean;
}

export interface YppIssue {
  id: string;
  category: YppCategory;
  severity: YppSeverity;
  title: string;
  detail: string;
  actionHint?: 'soften_ads' | 'inject_editorial' | 'differentiate_look' | 'diversify_cast' | 'add_voices';
}

export interface YppPolicyReport {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  status: 'monetization_ready' | 'review_recommended' | 'high_risk';
  audience: AudienceTarget;
  issues: YppIssue[];
  adTriggers: AdTriggerMatch[];
  kidsTriggers: string[];
  hasEditorialCommentary: boolean;
  characterDialogueRatio: number;
  uniqueStageCount: number;
  uniqueShotCount: number;
  ledgerCollisionCount: number;
  ledgerCollisions: string[];
  /** Structural cast distinctiveness score (0..100%) across intra-episode & recent uploads */
  castUniquenessScore: number;
  castTwinWarnings: string[];
  estimatedVoiceCoverage: number;
  summaryLine: string;
}

const PUBLISH_LEDGER_STORAGE_KEY = 'katha_channel_publish_ledger_v1';
const MAX_LEDGER_ENTRIES = 15;

// =========================================================================
// 1. CHANNEL UPLOAD DIVERSITY LEDGER (localStorage, SSR/Node-safe)
// =========================================================================

function getPrimaryStage(episode: EpisodeScript): StageId {
  const counts = new Map<StageId, number>();
  for (const b of episode.beats) {
    if (b.frame === 'chapter_title' || b.frame === 'moral_card') continue;
    counts.set(b.stage, (counts.get(b.stage) || 0) + 1);
  }
  let best: StageId = episode.beats[0]?.stage || 'banyan_clearing';
  let max = -1;
  for (const [st, c] of counts.entries()) {
    if (c > max) {
      max = c;
      best = st;
    }
  }
  return best;
}

function getOpeningSignature(episode: EpisodeScript): string {
  const firstSpoken =
    episode.beats.find((b) => b.frame !== 'chapter_title' && b.dialogue.trim().length > 0) ||
    episode.beats[0];
  return (firstSpoken?.dialogue || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(' ');
}

export function buildLedgerEntryFromEpisode(episode: EpisodeScript): PublishLedgerEntry {
  return {
    id: episode.id,
    title: episode.title,
    series: episode.series,
    renderStyle: episode.visualStyle?.renderStyle || getRecommendedRenderStyle(episode),
    primaryStage: getPrimaryStage(episode),
    defaultRaag: episode.defaultRaag,
    firstBeatShot: episode.beats[0]?.shot || 'wide_stage',
    openingSignature: getOpeningSignature(episode),
    exportedAt: new Date().toISOString(),
    castFingerprints: (episode.cast || []).map((m) => computeDnaFingerprint(m)),
  };
}

export function loadPublishLedger(): PublishLedgerEntry[] {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(PUBLISH_LEDGER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is PublishLedgerEntry =>
        Boolean(x && typeof x.id === 'string' && typeof x.renderStyle === 'string')
    );
  } catch {
    return [];
  }
}

export function savePublishLedger(entries: PublishLedgerEntry[]): void {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
  try {
    window.localStorage.setItem(
      PUBLISH_LEDGER_STORAGE_KEY,
      JSON.stringify(entries.slice(0, MAX_LEDGER_ENTRIES))
    );
  } catch {
    // Ignore quota errors
  }
}

export function recordEpisodeExportInLedger(episode: EpisodeScript): PublishLedgerEntry[] {
  const current = loadPublishLedger();
  const nextEntry = buildLedgerEntryFromEpisode(episode);
  const filtered = current.filter((e) => e.id !== episode.id);
  const updated = [nextEntry, ...filtered].slice(0, MAX_LEDGER_ENTRIES);
  savePublishLedger(updated);
  return updated;
}

export function clearPublishLedger(): void {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
  try {
    window.localStorage.removeItem(PUBLISH_LEDGER_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

// =========================================================================
// 2. AD-SAFE VOCABULARY & FIRST-30s YELLOW-DOLLAR-SIGN SHIELD
// =========================================================================

interface AdSafeRule {
  pattern: RegExp;
  label: string;
  replacement: string;
}

const AD_SAFE_RULES: AdSafeRule[] = [
  { pattern: /\bcremation grounds?\b/gi, label: 'cremation ground', replacement: 'moonlit banyan clearing' },
  { pattern: /\bdead bod(?:y|ies)\b/gi, label: 'dead body', replacement: 'slumbering spirit' },
  { pattern: /\bcorpses\b/gi, label: 'corpses', replacement: 'restless spirits' },
  { pattern: /\bcorpse\b/gi, label: 'corpse', replacement: 'restless spirit' },
  { pattern: /\bbeheaded\b/gi, label: 'beheaded', replacement: 'vanquished' },
  { pattern: /\bbeheading\b/gi, label: 'beheading', replacement: 'defeating' },
  { pattern: /\bbeheads?\b/gi, label: 'behead', replacement: 'vanquish' },
  { pattern: /\bdecapitat(?:e|ed|ing|ion)\b/gi, label: 'decapitate', replacement: 'vanquish' },
  { pattern: /\bmurdered\b/gi, label: 'murdered', replacement: 'betrayed' },
  { pattern: /\bmurderer\b/gi, label: 'murderer', replacement: 'traitor' },
  { pattern: /\bmurdering\b/gi, label: 'murder', replacement: 'betraying' },
  { pattern: /\bmurders?\b/gi, label: 'murder', replacement: 'betrayal' },
  { pattern: /\bslaughter(?:ed|ing|s)?\b/gi, label: 'slaughter', replacement: 'defeat' },
  { pattern: /\bkilled\b/gi, label: 'killed', replacement: 'defeated' },
  { pattern: /\bkilling\b/gi, label: 'killing', replacement: 'defeating' },
  { pattern: /\bkills\b/gi, label: 'kills', replacement: 'defeats' },
  { pattern: /\bkill\b/gi, label: 'kill', replacement: 'defeat' },
  { pattern: /\bslaying\b/gi, label: 'slaying', replacement: 'vanquishing' },
  { pattern: /\bslays\b/gi, label: 'slays', replacement: 'vanquishes' },
  { pattern: /\bslay\b/gi, label: 'slay', replacement: 'vanquish' },
  { pattern: /\bslew\b/gi, label: 'slew', replacement: 'vanquished' },
  { pattern: /\bbloody\b/gi, label: 'bloody', replacement: 'crimson' },
  { pattern: /\bblood\b/gi, label: 'blood', replacement: 'crimson mark' },
  { pattern: /\bsuicid(?:e|al)\b/gi, label: 'suicide', replacement: 'despair' },
  { pattern: /\btortured\b/gi, label: 'tortured', replacement: 'tormented' },
  { pattern: /\btorturing\b/gi, label: 'torturing', replacement: 'tormenting' },
  { pattern: /\btortures?\b/gi, label: 'torture', replacement: 'torment' },
  { pattern: /\bpoisoned\b/gi, label: 'poisoned', replacement: 'cursed' },
  { pattern: /\bpoisonous\b/gi, label: 'poisonous', replacement: 'venomous' },
  { pattern: /\bpoisons?\b/gi, label: 'poison', replacement: 'cursed elixir' },
  { pattern: /\bskulls\b/gi, label: 'skulls', replacement: 'ancient relics' },
  { pattern: /\bskull\b/gi, label: 'skull', replacement: 'ancient relic' },
  { pattern: /\bdemons\b/gi, label: 'demons', replacement: 'shadow titans' },
  { pattern: /\bdemonic\b/gi, label: 'demonic', replacement: 'shadow-born' },
  { pattern: /\bdemon\b/gi, label: 'demon', replacement: 'shadow titan' },
];

function matchWordCase(original: string, replacement: string): string {
  if (!original) return replacement;
  if (original === original.toUpperCase() && /[A-Z]/.test(original)) {
    return replacement.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

export function findAdSafetyTriggers(
  text: string,
  location: string,
  beatIndex: number | null,
  inFirst30s: boolean
): AdTriggerMatch[] {
  const hits: AdTriggerMatch[] = [];
  if (!text) return hits;
  for (const rule of AD_SAFE_RULES) {
    rule.pattern.lastIndex = 0;
    const match = rule.pattern.exec(text);
    if (match) {
      hits.push({
        term: match[0],
        replacement: matchWordCase(match[0], rule.replacement),
        location,
        beatIndex,
        inFirst30s,
      });
    }
  }
  return hits;
}

export function sanitizeAdSafeText(text: string): { text: string; count: number; replacedTerms: string[] } {
  let out = String(text || '');
  let count = 0;
  const replacedTerms: string[] = [];

  for (const rule of AD_SAFE_RULES) {
    rule.pattern.lastIndex = 0;
    out = out.replace(rule.pattern, (matched) => {
      count++;
      if (!replacedTerms.includes(matched.toLowerCase())) {
        replacedTerms.push(matched.toLowerCase());
      }
      return matchWordCase(matched, rule.replacement);
    });
  }

  return { text: out, count, replacedTerms };
}

export function applyAdSafeSoftener(episode: EpisodeScript): {
  episode: EpisodeScript;
  replacementsCount: number;
  replacedTerms: string[];
} {
  const terms = new Set<string>();
  let total = 0;

  const titleRes = sanitizeAdSafeText(episode.title);
  total += titleRes.count;
  titleRes.replacedTerms.forEach((t) => terms.add(t));

  const subRes = sanitizeAdSafeText(episode.subtitle);
  total += subRes.count;
  subRes.replacedTerms.forEach((t) => terms.add(t));

  const nextBeats = episode.beats.map((b) => {
    const bt = sanitizeAdSafeText(b.title);
    const bd = sanitizeAdSafeText(b.dialogue);
    total += bt.count + bd.count;
    bt.replacedTerms.forEach((t) => terms.add(t));
    bd.replacedTerms.forEach((t) => terms.add(t));
    if (bt.count === 0 && bd.count === 0) return b;
    return {
      ...b,
      title: bt.text,
      dialogue: bd.text,
    };
  });

  return {
    episode: {
      ...episode,
      title: titleRes.text,
      subtitle: subRes.text,
      beats: nextBeats,
    },
    replacementsCount: total,
    replacedTerms: Array.from(terms),
  };
}

// =========================================================================
// 3. COPPA / ACCIDENTAL "MADE FOR KIDS" DETECTOR
// =========================================================================

const KIDS_TRIGGER_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bfor kids\b/i, label: '"for kids"' },
  { pattern: /\bkids cartoon\b/i, label: '"kids cartoon"' },
  { pattern: /\bfor children\b/i, label: '"for children"' },
  { pattern: /\bnursery rhyme\b/i, label: '"nursery rhyme"' },
  { pattern: /\bbedtime cartoon\b/i, label: '"bedtime cartoon"' },
  { pattern: /\btoddlers?\b/i, label: '"toddler"' },
  { pattern: /\bpreschool\b/i, label: '"preschool"' },
  { pattern: /\bkids stor(?:y|ies)\b/i, label: '"kids stories"' },
];

export function detectKidsTargetingCues(text: string): string[] {
  const found: string[] = [];
  for (const item of KIDS_TRIGGER_PATTERNS) {
    if (item.pattern.test(text) && !found.includes(item.label)) {
      found.push(item.label);
    }
  }
  return found;
}

// =========================================================================
// 4. TRANSFORMATIVE EDITORIAL COMMENTARY INJECTOR
// =========================================================================

const EDITORIAL_TITLE_RE =
  /cultural context|editorial|historical note|why this tale|storyteller'?s note|behind the tale|modern reflection/i;
const EDITORIAL_DIALOGUE_RE =
  /centuries ago|today this tale|psychological|why does this|ancient wisdom|reminds us today|modern life|cultural heritage|historically|oral tradition/i;

export function hasTransformativeEditorialCommentary(episode: EpisodeScript): boolean {
  return episode.beats.some(
    (b) =>
      b.id.startsWith('editorial_') ||
      EDITORIAL_TITLE_RE.test(b.title) ||
      (b.speakerId === 'narrator' && EDITORIAL_DIALOGUE_RE.test(b.dialogue))
  );
}

function buildCulturalContextLine(episode: EpisodeScript): string {
  const lang = resolveEpisodeLanguage(episode);
  const lead = episode.cast[0]?.name || 'the protagonist';
  if (lang.code !== 'en') {
    return lang.culturalContextLine(episode.series, lead);
  }
  const shelf = episode.shelf || 'World Folklore';

  if (shelf === 'Royal Court Wit & Satire') {
    return `In classical royal courts, stories of ${lead} served as sharp political satire—proving quick wit could speak truth to power where force failed.`;
  }
  if (shelf === 'Animal Fables & Strategy') {
    return `Composed centuries ago as an oral handbook of statecraft, this fable uses ${lead} to show how foresight outmaneuvers brute strength even in modern life.`;
  }
  if (shelf === 'Sacred Epics & Puranas') {
    return `Preserved across generations of epic oral tradition, this episode explores duty, humility, and the quiet psychological discipline behind ${lead}'s choice.`;
  }
  if (shelf === 'Modern Multi-Genre Showcases') {
    return `Designed as a visual essay and animated short, this showcase uses ${lead}'s arc to pair crisp pacing with distinctive 2D art direction.`;
  }
  if (shelf === 'Supernatural & Royal Legends') {
    return `In ancient Indian riddle-cycles, tales of ${lead} were never mere ghost stories—they were ethical debates testing whether wisdom outweighs raw courage.`;
  }
  return lang.culturalContextLine(episode.series, lead);
}

export function injectTransformativeCommentaryBeat(episode: EpisodeScript): {
  episode: EpisodeScript;
  added: boolean;
} {
  if (hasTransformativeEditorialCommentary(episode)) {
    return { episode, added: false };
  }

  const lang = resolveEpisodeLanguage(episode);
  const refBeat =
    episode.beats[Math.max(0, episode.beats.length - 2)] || episode.beats[0];
  const lead = episode.cast[0];

  const editorialBeat = {
    id: `editorial_context_${episode.id.slice(0, 16)}`,
    title: lang.culturalNoteTitle,
    duration: 5.4,
    stage: refBeat?.stage || ('banyan_clearing' as StageId),
    mood: refBeat?.mood || ('moonlit_marble' as const),
    weather: 'fireflies' as const,
    shot: 'wide_stage' as ShotId,
    transition: 'ink_fade' as const,
    lightSide: 'left' as const,
    prop: 'royal_scroll' as const,
    propSlot: 'right' as const,
    frame: 'nested_story' as const,
    crowd: 'none' as const,
    cameraMove: 'slow_pull' as const,
    fx: 'divine_aura' as const,
    sfx: 'mystic_chime' as const,
    raag: episode.defaultRaag,
    musicEnergy: 0.42,
    actors: lead
      ? [
          {
            castId: lead.id,
            slot: 'left' as const,
            pose: 'stand' as const,
            expression: 'warm' as const,
            facing: 'right' as const,
            motion: 'still' as const,
          },
        ]
      : [],
    speakerId: 'narrator',
    speakerLabel: lang.culturalNoteLabel,
    dialogue: buildCulturalContextLine(episode),
  };

  const moralIdx = episode.beats.findIndex((b) => b.frame === 'moral_card');
  const nextBeats = [...episode.beats];
  if (moralIdx >= 0) {
    nextBeats.splice(moralIdx, 0, editorialBeat);
  } else {
    nextBeats.push(editorialBeat);
  }

  return {
    episode: {
      ...episode,
      beats: nextBeats,
    },
    added: true,
  };
}

// =========================================================================
// 5. ANTI-TEMPLATE VISUAL & STRUCTURAL DIFFERENTIATOR
// =========================================================================

const SHELF_STYLE_ROTATIONS: Record<string, RenderStyleId[]> = {
  'Modern Multi-Genre Showcases': ['blueprint_technical', 'neon_cybernoir', 'manga_screentone', 'felt_puppet', 'risograph_print', 'anime_cel'],
  'Supernatural & Royal Legends': ['chiaroscuro', 'shadow_puppetry', 'stained_glass', 'woodblock_print'],
  'Animal Fables & Strategy': ['papercraft_diorama', 'woodblock_print', 'lineless_vector', 'shadow_puppetry'],
  'Royal Court Wit & Satire': ['woodblock_print', 'chiaroscuro', 'papercraft_diorama', 'illuminated_codex'],
  'Sacred Epics & Puranas': ['lineless_vector', 'stained_glass', 'chiaroscuro', 'shadow_puppetry'],
  'Western Folklore & Fables': ['greek_amphora', 'illuminated_codex', 'woodblock_print', 'papercraft_diorama'],
  'East Asian Tales & Epics': ['sumi_e_wash', 'woodblock_print', 'lineless_vector', 'shadow_puppetry'],
  'Southeast Asian Folklore': ['shadow_puppetry', 'papercraft_diorama', 'stained_glass', 'chiaroscuro'],
  'Americas & Indigenous Legends': ['lineless_vector', 'chiaroscuro', 'woodblock_print', 'papercraft_diorama'],
  'African Griot & Trickster Tales': ['kente_tapestry', 'papercraft_diorama', 'woodblock_print', 'chiaroscuro'],
};

const LOOK_ROTATIONS: Array<{
  lookPreset: LookPresetId;
  colorGrade: ColorGradeId;
  texture: SurfaceTextureId;
}> = [
  { lookPreset: 'gilded_epic', colorGrade: 'warm_gold', texture: 'parchment_grain' },
  { lookPreset: 'moonlit_noir', colorGrade: 'indigo_noir', texture: 'cinema_35mm' },
  { lookPreset: 'palm_leaf_manuscript', colorGrade: 'sepia_manuscript', texture: 'palm_leaf_fibers' },
  { lookPreset: 'sunlit_storybook', colorGrade: 'emerald_fable', texture: 'woodblock_halftone' },
  { lookPreset: 'classic_chiaroscuro', colorGrade: 'vermilion_royal', texture: 'parchment_grain' },
];

const CLICHE_OPENING_RE = /^(once upon a time|long ago in a|in ancient times there|a long time ago)/i;

export function applyAntiTemplateDifferentiator(
  episode: EpisodeScript,
  ledger: PublishLedgerEntry[]
): { episode: EpisodeScript; changes: string[] } {
  const changes: string[] = [];
  const otherRecent = ledger.filter((e) => e.id !== episode.id).slice(0, 5);
  const recentStyles = new Set(otherRecent.slice(0, 2).map((e) => e.renderStyle));
  const currentStyle = episode.visualStyle?.renderStyle || getRecommendedRenderStyle(episode);

  const rotation =
    SHELF_STYLE_ROTATIONS[episode.shelf || ''] || [
      'chiaroscuro',
      'anime_cel',
      'gouache_storybook',
      'risograph_print',
      'felt_puppet',
      'manga_screentone',
      'blueprint_technical',
      'backlit_sand',
      'scratchboard_noir',
      'neon_cybernoir',
      'byzantine_mosaic',
      'shadow_puppetry',
      'lineless_vector',
      'woodblock_print',
      'papercraft_diorama',
      'stained_glass',
    ];

  let nextStyle: RenderStyleId = currentStyle;
  if (recentStyles.has(currentStyle) || otherRecent.some((e) => e.renderStyle === currentStyle)) {
    const fresh = rotation.find((s) => !recentStyles.has(s) && s !== currentStyle);
    if (fresh) {
      nextStyle = fresh;
      changes.push(`Switched Art Engine to ${fresh.replace(/_/g, ' ')}`);
    }
  }

  const lookIdx = (otherRecent.length + episode.title.length) % LOOK_ROTATIONS.length;
  const nextLook = LOOK_ROTATIONS[lookIdx];

  const shotCycle: ShotId[] = [
    'wide_stage',
    'two_shot',
    'closeup_left',
    'closeup_right',
    'prop_spotlight',
    'split_faceoff',
  ];
  let flippedCount = 0;
  let shotVariedCount = 0;

  const nextBeats = episode.beats.map((b, idx) => {
    const updated = { ...b };
    // Break static identical shots across consecutive narrative scenes
    if (
      idx > 0 &&
      b.frame !== 'chapter_title' &&
      b.frame !== 'moral_card' &&
      b.shot === episode.beats[idx - 1]?.shot
    ) {
      const candidate =
        b.prop !== 'none'
          ? 'prop_spotlight'
          : b.actors.length >= 2
            ? idx % 2 === 0
              ? 'two_shot'
              : 'closeup_left'
            : shotCycle[(idx + 2) % shotCycle.length];
      if (candidate !== updated.shot) {
        updated.shot = candidate;
        shotVariedCount++;
      }
    }
    // Mirror alternating recurring stages so backdrop silhouette feels fresh vs previous uploads
    if (idx % 3 === 1 && !updated.flipStage && b.frame !== 'chapter_title') {
      updated.flipStage = true;
      flippedCount++;
    }
    if (!updated.cameraMove || updated.cameraMove === 'still') {
      updated.cameraMove = idx % 2 === 0 ? 'slow_push' : 'slow_pull';
    }
    return updated;
  });

  if (shotVariedCount > 0) changes.push(`Varied ${shotVariedCount} consecutive camera shot(s)`);
  if (flippedCount > 0) changes.push(`Mirrored ${flippedCount} stage composition(s) for visual novelty`);
  if (changes.length === 0) {
    changes.push(`Applied fresh ${nextLook.lookPreset.replace(/_/g, ' ')} color & texture grade`);
  }

  return {
    episode: {
      ...episode,
      visualStyle: {
        ...episode.visualStyle,
        renderStyle: nextStyle,
        lookPreset: nextLook.lookPreset,
        colorGrade: nextLook.colorGrade,
        texture: nextLook.texture,
      },
      beats: nextBeats,
    },
    changes,
  };
}

// =========================================================================
// 6. COMPREHENSIVE YPP & MONETIZATION COMPLIANCE AUDITOR
// =========================================================================

export function collectLedgerCastFingerprints(
  ledger: PublishLedgerEntry[],
  excludeEpisodeId?: string
): CharacterSilhouetteFingerprint[] {
  const out: CharacterSilhouetteFingerprint[] = [];
  for (const entry of ledger) {
    if (excludeEpisodeId && entry.id === excludeEpisodeId) continue;
    if (Array.isArray(entry.castFingerprints)) {
      out.push(...entry.castFingerprints);
    }
  }
  return out;
}

function isCastBibleLocked(name: string, bible: CastBibleEntry[]): boolean {
  const norm = name.trim().toLowerCase();
  if (!norm) return false;
  return bible.some(
    (b) => b.name.trim().toLowerCase() === norm || b.key.trim().toLowerCase() === norm
  );
}

/**
 * 1-Click Cast Visual Diversifier:
 * Upgrades and mutates any twin or template-cloned cast members into structurally distinct
 * modular CharacterDNA silhouettes while preserving locked recurring Cast Bible heroes.
 */
export function applyCastVisualDiversifier(
  episode: EpisodeScript,
  ledger: PublishLedgerEntry[] = loadPublishLedger(),
  castBible: CastBibleEntry[] = loadCastBible()
): { episode: EpisodeScript; diversifiedNames: string[] } {
  const externalFingerprints = collectLedgerCastFingerprints(ledger, episode.id);
  const acceptedFingerprints: CharacterSilhouetteFingerprint[] = [...externalFingerprints];
  const diversifiedNames: string[] = [];

  const nextCast = episode.cast.map((member, idx) => {
    const locked = isCastBibleLocked(member.name, castBible);
    const fp = computeDnaFingerprint(member);

    // Check against earlier cast members in this episode AND against external ledger (if not a locked recurring lead)
    const relevantAvoid = locked
      ? acceptedFingerprints.slice(externalFingerprints.length)
      : acceptedFingerprints;

    const minDist = relevantAvoid.reduce(
      (min, other) => Math.min(min, computeSilhouetteDistance(fp, other)),
      1
    );

    if (minDist < SILHOUETTE_TWIN_THRESHOLD || (!member.dna && !locked)) {
      const mutatedDna = mutateDnaForUniqueness(member, relevantAvoid, {
        salt: Date.now() + idx * 977,
        preserveSpecies: true,
      });
      const updated = syncMemberWithDna(member, mutatedDna);
      acceptedFingerprints.push(computeDnaFingerprint(updated));
      diversifiedNames.push(member.name);
      return updated;
    }

    acceptedFingerprints.push(fp);
    return member;
  });

  return {
    episode: {
      ...episode,
      cast: nextCast,
    },
    diversifiedNames,
  };
}

export function auditEpisodeYppCompliance(
  episode: EpisodeScript,
  options: {
    audience?: AudienceTarget;
    voiceClipCount?: number;
    ledger?: PublishLedgerEntry[];
    castBible?: CastBibleEntry[];
  } = {}
): YppPolicyReport {
  const audience: AudienceTarget = options.audience ?? 'general_audience';
  const ledger = options.ledger ?? loadPublishLedger();
  const castBible = options.castBible ?? loadCastBible();
  const voiceClipCount = options.voiceClipCount ?? 0;

  const issues: YppIssue[] = [];
  let score = 100;

  // --- A. Ad-Safe Vocabulary & First-30s Yellow-Icon Scan ---
  const adTriggers: AdTriggerMatch[] = [];
  adTriggers.push(...findAdSafetyTriggers(episode.title, 'Episode Title', null, true));
  adTriggers.push(...findAdSafetyTriggers(episode.subtitle, 'Episode Subtitle', null, true));

  let elapsedSec = 0;
  episode.beats.forEach((b, idx) => {
    const inFirst30s = elapsedSec < 30;
    const loc = `Scene ${idx + 1} (${b.title})`;
    adTriggers.push(...findAdSafetyTriggers(b.title, `${loc} title`, idx, inFirst30s));
    adTriggers.push(...findAdSafetyTriggers(b.dialogue, loc, idx, inFirst30s));
    elapsedSec += Math.max(1.2, b.duration);
  });

  const first30sHits = adTriggers.filter((t) => t.inFirst30s);
  const laterHits = adTriggers.filter((t) => !t.inFirst30s);

  if (first30sHits.length > 0) {
    const penalty = Math.min(28, 14 + (first30sHits.length - 1) * 7);
    score -= penalty;
    const sample = Array.from(new Set(first30sHits.map((h) => `"${h.term}"`)))
      .slice(0, 4)
      .join(', ');
    issues.push({
      id: 'ad_first_30s',
      category: 'ad_safety',
      severity: 'high',
      title: `First-30s Yellow-Icon Risk (${first30sHits.length} trigger${first30sHits.length === 1 ? '' : 's'})`,
      detail: `YouTube's automated ad-suitability scan weights title and the opening 30 seconds heavily. Found ${sample}. Use 1-Click Ad-Safe Softener to swap for mythic equivalents.`,
      actionHint: 'soften_ads',
    });
  } else if (laterHits.length > 0) {
    const penalty = Math.min(14, 6 + (laterHits.length - 1) * 3);
    score -= penalty;
    const sample = Array.from(new Set(laterHits.map((h) => `"${h.term}"`)))
      .slice(0, 4)
      .join(', ');
    issues.push({
      id: 'ad_mid_script',
      category: 'ad_safety',
      severity: 'medium',
      title: `Advertiser-Sensitive Terms in Body (${laterHits.length})`,
      detail: `Found ${sample} after 0:30. Softening harsh folklore terms protects full green-dollar-sign AdSense eligibility.`,
      actionHint: 'soften_ads',
    });
  }

  // --- B. Transformative Editorial Commentary (Reused-Content Defense) ---
  const hasEditorialCommentary = hasTransformativeEditorialCommentary(episode);
  if (!hasEditorialCommentary) {
    score -= 14;
    issues.push({
      id: 'missing_editorial',
      category: 'transformative',
      severity: 'medium',
      title: 'Add Transformative Editorial / Cultural Context',
      detail:
        'Public-domain retellings stay safest in YPP when paired with original cultural commentary or modern reflection—not just raw verbatim story text.',
      actionHint: 'inject_editorial',
    });
  }

  // --- C. Anti-Repetitious / Cross-Upload Template Audit ---
  const otherRecent = ledger.filter((e) => e.id !== episode.id).slice(0, 5);
  const currentEntry = buildLedgerEntryFromEpisode(episode);
  const ledgerCollisions: string[] = [];

  const exactVisualMatch = otherRecent.find(
    (e) =>
      e.renderStyle === currentEntry.renderStyle &&
      e.primaryStage === currentEntry.primaryStage
  );
  if (exactVisualMatch) {
    score -= 18;
    ledgerCollisions.push(
      `Shares Art Engine (${currentEntry.renderStyle.replace(/_/g, ' ')}) + Primary Stage (${currentEntry.primaryStage.replace(/_/g, ' ')}) with "${exactVisualMatch.title}"`
    );
  }

  const sameStyleStreak = otherRecent
    .slice(0, 3)
    .filter((e) => e.renderStyle === currentEntry.renderStyle).length;
  if (sameStyleStreak >= 2) {
    score -= 10;
    ledgerCollisions.push(
      `Same Art Engine (${currentEntry.renderStyle.replace(/_/g, ' ')}) used in ${sameStyleStreak} of your last 3 exports`
    );
  }

  const sameOpeningMatch =
    currentEntry.openingSignature.length >= 10
      ? otherRecent.find((e) => e.openingSignature === currentEntry.openingSignature)
      : undefined;
  if (sameOpeningMatch) {
    score -= 8;
    ledgerCollisions.push(`Identical opening phrase as "${sameOpeningMatch.title}"`);
  }

  if (ledgerCollisions.length > 0) {
    issues.push({
      id: 'ledger_repetition',
      category: 'repetitious',
      severity: exactVisualMatch ? 'high' : 'medium',
      title: 'Cross-Upload Template Similarity Detected',
      detail: `${ledgerCollisions.join(' • ')}. Rotate Art Engine or stage composition so automated YPP "Inauthentic Content" sweeps see distinct creative work.`,
      actionHint: 'differentiate_look',
    });
  }

  // --- C2. Character Silhouette Uniqueness & Anti-Template Cast Audit ---
  const castTwinWarnings: string[] = [];
  const episodeFps = (episode.cast || []).map((m) => computeDnaFingerprint(m));
  const externalFps = collectLedgerCastFingerprints(ledger, episode.id);
  let worstCastDist = 1;

  // Intra-episode twin check
  for (let i = 0; i < episodeFps.length; i++) {
    for (let j = i + 1; j < episodeFps.length; j++) {
      const dist = computeSilhouetteDistance(episodeFps[i], episodeFps[j]);
      if (dist < worstCastDist) worstCastDist = dist;
      if (dist < SILHOUETTE_TWIN_THRESHOLD) {
        castTwinWarnings.push(
          `"${episodeFps[i].name}" & "${episodeFps[j].name}" share a near-identical silhouette (${Math.round((1 - dist) * 100)}% overlap)`
        );
      }
    }
  }

  // Cross-upload template clone check (exempts intentionally recurring Cast Bible heroes)
  for (const fp of episodeFps) {
    if (isCastBibleLocked(fp.name, castBible)) continue;
    let closest: { fp: CharacterSilhouetteFingerprint; dist: number } | null = null;
    for (const ext of externalFps) {
      if (ext.name.trim().toLowerCase() === fp.name.trim().toLowerCase()) continue;
      const dist = computeSilhouetteDistance(fp, ext);
      if (!closest || dist < closest.dist) closest = { fp: ext, dist };
    }
    if (closest) {
      if (closest.dist < worstCastDist) worstCastDist = closest.dist;
      if (closest.dist < SILHOUETTE_TWIN_THRESHOLD) {
        castTwinWarnings.push(
          `"${fp.name}" mirrors previous upload character "${closest.fp.name}" (${Math.round((1 - closest.dist) * 100)}% silhouette match)`
        );
      }
    }
  }

  const uncustomizedTemplateCount = (episode.cast || []).filter(
    (m) => !m.dna && !isCastBibleLocked(m.name, castBible)
  ).length;

  const castUniquenessScore =
    episodeFps.length === 0
      ? 100
      : Math.round(
          Math.max(
            0,
            Math.min(
              100,
              worstCastDist * 100 - (castTwinWarnings.length === 0 && uncustomizedTemplateCount >= 2 ? 12 : 0)
            )
          )
        );

  if (castTwinWarnings.length > 0) {
    score -= Math.min(20, 12 + (castTwinWarnings.length - 1) * 4);
    issues.push({
      id: 'cast_twin_silhouettes',
      category: 'repetitious',
      severity: 'high',
      title: `Twin / Template Character Silhouettes (${castTwinWarnings.length})`,
      detail: `${castTwinWarnings.slice(0, 2).join(' • ')}. Use 1-Click Diversify Cast or open the Entity Workshop to sculpt unique modular proportions, garments, and traits.`,
      actionHint: 'diversify_cast',
    });
  } else if (uncustomizedTemplateCount >= 2) {
    score -= 6;
    issues.push({
      id: 'cast_using_raw_templates',
      category: 'repetitious',
      severity: 'info',
      title: `${uncustomizedTemplateCount} Cast Members Using Default Archetype Silhouettes`,
      detail:
        'Upgrading default archetypes into custom modular Entity DNA (proportions, headwear, patterns, traits) prevents template detection across uploads.',
      actionHint: 'diversify_cast',
    });
  }

  // Internal visual/dialogue diversity (guards against "static slideshow" misclassification)
  const narrativeBeats = episode.beats.filter(
    (b) => b.frame !== 'chapter_title' && b.frame !== 'moral_card'
  );
  const characterBeats = narrativeBeats.filter((b) => b.speakerId !== 'narrator');
  const characterDialogueRatio =
    narrativeBeats.length > 0 ? characterBeats.length / narrativeBeats.length : 0;

  if (narrativeBeats.length >= 4 && characterDialogueRatio < 0.35) {
    score -= 12;
    issues.push({
      id: 'narrator_monologue',
      category: 'repetitious',
      severity: 'medium',
      title: `Low Character Acting Ratio (${Math.round(characterDialogueRatio * 100)}%)`,
      detail:
        'Episodes dominated by narrator monologue look closer to low-effort slideshows. Aim for 45%+ direct character dialogue with distinct voices.',
    });
  }

  const uniqueStageCount = new Set(episode.beats.map((b) => b.stage)).size;
  const uniqueShotCount = new Set(episode.beats.map((b) => b.shot)).size;

  if (episode.beats.length >= 6 && uniqueShotCount < 3) {
    score -= 10;
    issues.push({
      id: 'static_camera',
      category: 'repetitious',
      severity: 'medium',
      title: `Low Camera Variety (${uniqueShotCount} shot type${uniqueShotCount === 1 ? '' : 's'})`,
      detail:
        'Using fewer than 3 camera framings across a full episode feels static. Click Differentiate to inject dynamic close-ups and prop cutaways.',
      actionHint: 'differentiate_look',
    });
  }

  const firstSpoken = narrativeBeats[0]?.dialogue || '';
  if (CLICHE_OPENING_RE.test(firstSpoken.trim())) {
    score -= 6;
    issues.push({
      id: 'cliche_opening',
      category: 'repetitious',
      severity: 'info',
      title: 'Generic Folklore Opening Cliché',
      detail:
        'Opening with "Once upon a time" or "Long ago" hurts both retention and YPP originality checks. Lead with an immediate dramatic dilemma.',
    });
  }

  // --- D. COPPA / "Made for Kids" RPM-Cliff Guard ---
  const combinedMetadata = [
    episode.title,
    episode.subtitle,
    ...episode.beats.slice(0, 3).map((b) => b.dialogue),
  ].join(' ');
  const kidsTriggers = detectKidsTargetingCues(combinedMetadata);

  if (audience === 'general_audience' && kidsTriggers.length > 0) {
    score -= 14;
    issues.push({
      id: 'coppa_kids_cue',
      category: 'coppa',
      severity: 'high',
      title: `Accidental "Made for Kids" Keyword Risk (${kidsTriggers.join(', ')})`,
      detail:
        'Phrases targeting kids can trigger YouTube auto-reclassification as Made for Kids—cutting RPM by 60–85% and disabling comments & notifications.',
    });
  } else if (audience === 'made_for_kids') {
    issues.push({
      id: 'coppa_mfk_mode',
      category: 'coppa',
      severity: 'info',
      title: 'COPPA "Made for Kids" Mode Selected',
      detail:
        'Launch Pack will omit personalized calls-to-action (comments/notifications are disabled on MFK uploads, and personalized ads are restricted).',
    });
  }

  // --- E. Voice Originality & Altered/Synthetic Disclosure ---
  const spokenBeats = episode.beats.filter((b) => b.dialogue.trim().length > 0).length;
  const estimatedVoiceCoverage =
    spokenBeats > 0 ? Math.min(1, voiceClipCount / spokenBeats) : 0;

  if (voiceClipCount === 0) {
    score -= 8;
    issues.push({
      id: 'no_recorded_voices',
      category: 'disclosure',
      severity: 'info',
      title: 'No Recorded / Dubbed Voice Clips Attached Yet',
      detail:
        'Adding expressive human mic narration or distinct multi-character voices significantly improves YPP approval odds over silent caption-only videos.',
      actionHint: 'add_voices',
    });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const grade: YppPolicyReport['grade'] =
    score >= 88 ? 'A' : score >= 74 ? 'B' : score >= 58 ? 'C' : 'D';
  const status: YppPolicyReport['status'] =
    score >= 82 && !issues.some((i) => i.severity === 'high')
      ? 'monetization_ready'
      : score >= 60
        ? 'review_recommended'
        : 'high_risk';

  const summaryLine =
    status === 'monetization_ready'
      ? 'Strong YPP originality, ad-safe vocabulary, and clean General Audience positioning.'
      : status === 'review_recommended'
        ? 'Mostly safe, but 1–2 quick fixes will harden AdSense & YPP originality protection.'
        : 'High yellow-icon or template-repetition risk detected — run 1-Click Auto-Shield before export.';

  return {
    score,
    grade,
    status,
    audience,
    issues,
    adTriggers,
    kidsTriggers,
    hasEditorialCommentary,
    characterDialogueRatio,
    uniqueStageCount,
    uniqueShotCount,
    ledgerCollisionCount: ledgerCollisions.length,
    ledgerCollisions,
    castUniquenessScore,
    castTwinWarnings,
    estimatedVoiceCoverage,
    summaryLine,
  };
}

// =========================================================================
// 7. ONE-CLICK FULL YPP AUTO-SHIELD
// =========================================================================

export function applyFullYppAutoShield(
  episode: EpisodeScript,
  ledger: PublishLedgerEntry[] = loadPublishLedger()
): { episode: EpisodeScript; summary: string[]; changed: boolean } {
  let current = episode;
  const summary: string[] = [];

  const adRes = applyAdSafeSoftener(current);
  if (adRes.replacementsCount > 0) {
    current = adRes.episode;
    summary.push(
      `Softened ${adRes.replacementsCount} ad-risk term(s): ${adRes.replacedTerms.slice(0, 4).join(', ')}`
    );
  }

  const edRes = injectTransformativeCommentaryBeat(current);
  if (edRes.added) {
    current = edRes.episode;
    summary.push('Injected Cultural Context & Modern Reflection editorial beat');
  }

  const preAudit = auditEpisodeYppCompliance(current, { ledger });
  if (
    preAudit.ledgerCollisionCount > 0 ||
    (current.beats.length >= 6 && preAudit.uniqueShotCount < 3)
  ) {
    const diffRes = applyAntiTemplateDifferentiator(current, ledger);
    current = diffRes.episode;
    summary.push(...diffRes.changes);
  }

  if (preAudit.castTwinWarnings.length > 0 || preAudit.castUniquenessScore < 72) {
    const divRes = applyCastVisualDiversifier(current, ledger);
    if (divRes.diversifiedNames.length > 0) {
      current = divRes.episode;
      summary.push(`Diversified modular DNA for ${divRes.diversifiedNames.join(', ')}`);
    }
  }

  return {
    episode: current,
    summary:
      summary.length > 0
        ? summary
        : ['Episode already passes all automated YPP & Ad-Safety checks!'],
    changed: summary.length > 0,
  };
}

// =========================================================================
// 8. YOUTUBE STUDIO DISCLOSURE & PUBLIC-DOMAIN PROVENANCE CHECKLIST
// =========================================================================

export function buildTransformativeAttributionFooter(episode: EpisodeScript): string {
  const lang = resolveEpisodeLanguage(episode);
  return lang.attributionFooter(episode.series);
}

export function buildYppUploadChecklist(
  episode: EpisodeScript,
  audience: AudienceTarget = 'general_audience',
  voiceClipCount = 0
): string {
  const audienceSetting =
    audience === 'made_for_kids'
      ? 'Audience -> YES, made for kids (COPPA mode: comments & personalized ads off)'
      : 'Audience -> NO, not made for kids (General Audience cultural & mythology storytelling — preserves full RPM & comments)';

  const syntheticGuidance =
    voiceClipCount > 0
      ? 'Altered / Synthetic Content -> Stylized 2D animation does NOT require the realistic-synthetic label. Only check "Yes" if you used realistic AI voice cloning that sounds like a real living person or lifelike synthetic video.'
      : 'Altered / Synthetic Content -> Stylized 2D animation does NOT require the realistic-synthetic label. Record your own voiceover or use expressive character voices in the Voice tab for strongest YPP originality.';

  return [
    '=== YOUTUBE STUDIO POLICY & YPP CHECKLIST ===',
    `1. ${audienceSetting}`,
    `2. ${syntheticGuidance}`,
    '3. Paid Promotion -> Leave unchecked unless sponsored.',
    '4. Public-Domain Provenance -> Keep the "ABOUT THIS ADAPTATION" block in your description so human YPP reviewers immediately see your transformative screenplay, original visual direction, and cultural commentary.',
    `5. Channel Diversity -> Log "${episode.title}" in the Upload Diversity Ledger (auto-logged on studio export) and rotate Art Engines every 1–2 uploads.`,
  ].join('\n');
}
