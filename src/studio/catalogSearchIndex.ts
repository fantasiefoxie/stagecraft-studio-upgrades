/**
 * Stagecraft Studio — Upgrade 34: Deterministic In-Browser BM25 + Synonym Semantic Catalog Search
 *
 * Pure-TypeScript lazily-cached Okapi BM25 inverted index (k1 = 1.5, b = 0.75)
 * covering ALL 1,150+ live Stagecraft Studio visual, audio, motion, and preset catalogs:
 * - 160 archetypes, 150 stages, 185 props, 40 moods, 30 weathers, 30 crowds, 36 FX
 * - 192 CharacterDNA sprite presets, 84 backdrop themes, 84 custom prop presets, 25 4-Act Visual Arcs
 * - 20 art engines, 12 acting macros, CharacterDNA headwear/tops/patterns, SFX, raags, shots & look presets
 *
 * Strictly deterministic: zero Math.random(), zero external dependencies, instant O(matches) lookup.
 */

import { ACTING_MACRO_CATALOG } from './actingMacros';
import { ACT_ARC_PRESETS, BACKDROP_THEMES, CUSTOM_PROP_PRESETS } from './backdropGenerator';
import {
  BACK_GEAR_CATALOG,
  BODY_MARK_CATALOG,
  EAR_JEWELRY_CATALOG,
  EYEBROW_STYLE_CATALOG,
  EYELASH_STYLE_CATALOG,
  EYEWEAR_CATALOG,
  FACE_MARK_CATALOG,
  FACIAL_HAIR_CATALOG,
  FOOTWEAR_CATALOG,
  GLOVE_CATALOG,
  HAIR_STYLE_CATALOG,
  HEADWEAR_CATALOG,
  MOUTH_STYLE_CATALOG,
  NECKWEAR_CATALOG,
  OUTERWEAR_CATALOG,
  PUPIL_STYLE_CATALOG,
  SLEEVE_CATALOG,
  SURFACE_PATTERN_CATALOG,
  TOP_STYLE_CATALOG,
  WAIST_CATALOG,
  WRISTWEAR_CATALOG,
} from './characterDna';
import { SPRITE_WORKSHOP_PRESETS } from './spriteWorkshopPresets';
import {
  ARCHETYPE_CATALOG,
  CROWD_CATALOG,
  FX_LIST,
  LOOK_PRESETS,
  MOOD_CATALOG,
  PROP_CATALOG,
  RAAG_CATALOG,
  RENDER_STYLE_CATALOG,
  SFX_CATALOG,
  SHOT_CATALOG,
  STAGE_CATALOG,
  WEATHER_LIST,
  type ArchetypeId,
  type CrowdId,
  type FxId,
  type MoodId,
  type PropId,
  type RenderStyleId,
  type StageId,
  type WeatherId,
} from './types';

export type CatalogItemKind =
  | 'archetype'
  | 'stage'
  | 'prop'
  | 'mood'
  | 'weather'
  | 'crowd'
  | 'fx'
  | 'sprite_preset'
  | 'render_style'
  | 'acting_macro'
  | 'act_arc'
  | 'backdrop_theme'
  | 'prop_preset'
  | 'dna_part'
  | 'sfx'
  | 'raag'
  | 'shot'
  | 'look_preset';

export interface CatalogSearchDocument {
  id: string;
  kind: CatalogItemKind;
  label: string;
  category: string;
  description: string;
  /** Token frequency map built once at index time */
  tf: Map<string, number>;
  /** Total token length for BM25 length normalization */
  docLen: number;
}

export interface CatalogSearchResult {
  id: string;
  kind: CatalogItemKind;
  label: string;
  category: string;
  description: string;
  score: number;
  matchedTerms: string[];
}

export interface RecommendedScenePalette {
  stage: StageId;
  secondaryStage: StageId;
  archetype: ArchetypeId;
  secondaryArchetype: ArchetypeId;
  prop: PropId;
  mood: MoodId;
  secondaryMood: MoodId;
  weather: WeatherId;
  crowd: CrowdId;
  fx: FxId;
  renderStyle: RenderStyleId;
  spritePresetId: string;
}

/**
 * Deterministic bidirectional domain synonym / concept expansion table.
 * Bridges natural-language story pitches to exact Wave 1-5 catalog terminology.
 */
const SYNONYM_GROUPS: readonly (readonly string[])[] = [
  ['cyberpunk', 'neon', 'hacker', 'cyber', 'synth', 'futuristic', 'dystopia', 'alley', 'drone', 'matrix', 'hologram', 'tech'],
  ['noir', 'detective', 'crime', 'mystery', 'forensic', 'clue', 'rain', 'alley', 'court', 'evidence', 'investigator', 'fedora', 'shadow', 'murder', 'heist'],
  ['mythology', 'myth', 'god', 'deity', 'deva', 'zeus', 'olympus', 'temple', 'ancient', 'epic', 'divine', 'legend', 'sacred', 'goddess', 'pantheon'],
  ['thunder', 'lightning', 'storm', 'bolt', 'zeus', 'tempest', 'electric', 'spark', 'shock'],
  ['space', 'scifi', 'orbital', 'starship', 'alien', 'galaxy', 'cosmos', 'astronaut', 'nebula', 'planet', 'station', 'quantum', 'laser', 'admiral'],
  ['cozy', 'cafe', 'bookshop', 'warm', 'storybook', 'bedtime', 'papercraft', 'pastel', 'cabin', 'tea', 'bakery', 'lantern', 'autumn', 'gentle'],
  ['horror', 'haunted', 'ghost', 'vampire', 'gothic', 'spooky', 'graveyard', 'werewolf', 'witch', 'reaper', 'mummy', 'zombie', 'banshee', 'crypt', 'blood', 'nightmare'],
  ['kids', 'fable', 'toy', 'animal', 'candy', 'playground', 'cartoon', 'fairy', 'storybook', 'princess', 'dragon', 'unicorn', 'whimsical'],
  ['sports', 'stadium', 'cricket', 'soccer', 'football', 'boxing', 'arena', 'athlete', 'match', 'champion', 'goal', 'pitch', 'ring'],
  ['fantasy', 'magic', 'wizard', 'mage', 'paladin', 'knight', 'castle', 'dungeon', 'dragon', 'elf', 'orc', 'goblin', 'tavern', 'spell', 'rune', 'sword', 'quest'],
  ['historical', 'history', 'roman', 'spartan', 'victorian', 'medieval', 'feudal', 'shogun', 'samurai', 'renaissance', 'wild', 'west', 'sheriff', 'outlaw', 'empire', 'war'],
  ['business', 'startup', 'founder', 'ceo', 'office', 'boardroom', 'finance', 'stock', 'trader', 'pitch', 'podcast', 'news', 'studio', 'explainer', 'corporate'],
  ['courtroom', 'judge', 'lawyer', 'trial', 'verdict', 'legal', 'justice', 'gavel', 'witness', 'magistrate', 'attorney'],
  ['ocean', 'sea', 'underwater', 'pirate', 'ship', 'shark', 'mermaid', 'octopus', 'poseidon', 'coral', 'reef', 'harbor', 'island', 'wave'],
  ['jungle', 'forest', 'nature', 'safari', 'wildlife', 'dinosaur', 'trex', 'bear', 'lion', 'tiger', 'monkey', 'eagle', 'panda', 'banyan', 'woods'],
  ['fire', 'flame', 'volcano', 'lava', 'phoenix', 'ember', 'inferno', 'forge', 'blaze', 'magma'],
  ['ice', 'snow', 'frost', 'arctic', 'glacier', 'winter', 'blizzard', 'penguin', 'polar', 'crystal'],
  ['desert', 'sand', 'egypt', 'pyramid', 'anubis', 'mummy', 'camel', 'oasis', 'mirage', 'canyon', 'dune', 'djinn'],
  ['music', 'orchestra', 'concert', 'opera', 'bard', 'ballet', 'dance', 'circus', 'stage', 'theater', 'theatre', 'festival'],
  ['indian', 'folk', 'panchatantra', 'vikram', 'betaal', 'ramayana', 'mahabharata', 'maratha', 'bazaar', 'palace', 'sage', 'king', 'queen', 'courtier'],
];

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'into', 'that', 'this', 'over', 'under', 'about', 'of', 'in', 'on', 'to', 'a', 'an', 'at', 'by', 'or', 'as', 'is', 'be',
]);

function normalizeToken(raw: string): string {
  const s = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s.length <= 2) return s;
  if (s.endsWith('ies') && s.length > 4) return `${s.slice(0, -3)}y`;
  if (s.endsWith('es') && s.length > 4 && /(sh|ch|x|z|s)es$/.test(s)) return s.slice(0, -2);
  if (s.endsWith('s') && s.length > 3 && !s.endsWith('ss') && !s.endsWith('us')) return s.slice(0, -1);
  return s;
}

function tokenizeText(text: string): string[] {
  const parts = (text || '')
    .toLowerCase()
    .replace(/[_/.-]+/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    const norm = normalizeToken(p);
    if (norm.length >= 2 && !STOP_WORDS.has(norm)) {
      out.push(norm);
    }
  }
  return out;
}

const SYNONYM_MAP: Map<string, Set<string>> = (() => {
  const map = new Map<string, Set<string>>();
  for (const group of SYNONYM_GROUPS) {
    const normalized = group.map(normalizeToken).filter((t) => t.length >= 2);
    for (const term of normalized) {
      let bucket = map.get(term);
      if (!bucket) {
        bucket = new Set<string>();
        map.set(term, bucket);
      }
      for (const peer of normalized) {
        if (peer !== term) bucket.add(peer);
      }
    }
  }
  return map;
})();

interface Bm25Index {
  docs: CatalogSearchDocument[];
  /** term -> list of doc indices */
  postings: Map<string, number[]>;
  /** term -> IDF weight */
  idf: Map<string, number>;
  avgDocLen: number;
}

let cachedIndex: Bm25Index | null = null;

function formatSnakeLabel(id: string): string {
  return id
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function addDocument(
  docs: CatalogSearchDocument[],
  id: string,
  kind: CatalogItemKind,
  label: string,
  category: string,
  description: string,
  extraKeywords = ''
): void {
  const tf = new Map<string, number>();
  // Weight ID and label tokens higher (3x), category (2x), description/extra (1x)
  const addWeighted = (text: string, weight: number) => {
    for (const tok of tokenizeText(text)) {
      tf.set(tok, (tf.get(tok) || 0) + weight);
    }
  };

  addWeighted(id, 3);
  addWeighted(label, 3);
  addWeighted(category, 2);
  addWeighted(description, 1);
  if (extraKeywords) addWeighted(extraKeywords, 1);

  let docLen = 0;
  for (const v of tf.values()) docLen += v;

  docs.push({
    id,
    kind,
    label,
    category,
    description,
    tf,
    docLen: Math.max(1, docLen),
  });
}

function buildCatalogIndex(): Bm25Index {
  const docs: CatalogSearchDocument[] = [];

  // 1. 160 Character Archetypes
  for (const a of ARCHETYPE_CATALOG) {
    addDocument(docs, a.id, 'archetype', a.label, a.group, a.stories, 'character cast actor');
  }

  // 2. 150 Stages / Environments
  for (const st of STAGE_CATALOG) {
    addDocument(
      docs,
      st.id,
      'stage',
      st.label,
      st.category || 'World & Folklore',
      st.useCase,
      'stage backdrop environment location scene'
    );
  }

  // 3. 185 Story Props
  for (const p of PROP_CATALOG) {
    addDocument(
      docs,
      p.id,
      'prop',
      p.label,
      p.category || 'Folklore & World',
      p.note,
      'prop item object artifact'
    );
  }

  // 4. 40 Lighting Moods
  for (const m of MOOD_CATALOG) {
    addDocument(
      docs,
      m.id,
      'mood',
      m.label,
      m.category || 'Atmosphere',
      `${m.label} lighting mood color palette`,
      'mood palette lighting tone'
    );
  }

  // 5. 30 Weather Systems
  for (const w of WEATHER_LIST) {
    const label = formatSnakeLabel(w);
    addDocument(docs, w, 'weather', label, 'Weather', `${label} atmospheric weather layer`, 'weather climate sky');
  }

  // 6. 30 Crowd Layers
  for (const c of CROWD_CATALOG) {
    addDocument(
      docs,
      c.id,
      'crowd',
      c.label,
      c.category || 'Crowd',
      `${c.label} background crowd silhouette layer`,
      'crowd people audience silhouettes'
    );
  }

  // 7. 36 Kinetic Beat FX
  for (const fx of FX_LIST) {
    const label = formatSnakeLabel(fx);
    addDocument(docs, fx, 'fx', label, 'Beat FX', `${label} kinetic visual effect overlay`, 'fx vfx effect overlay');
  }

  // 8. 192 Curated CharacterDNA Sprite Presets
  for (const sp of SPRITE_WORKSHOP_PRESETS) {
    addDocument(
      docs,
      sp.id,
      'sprite_preset',
      sp.name,
      sp.category,
      sp.tagline,
      `sprite dna preset ${sp.archetype}`
    );
  }

  // 9. 20 Art Engines
  for (const rs of RENDER_STYLE_CATALOG) {
    addDocument(
      docs,
      rs.id,
      'render_style',
      rs.label,
      rs.category,
      rs.note,
      `art engine style ${rs.shortLabel}`
    );
  }

  // 10. 12 Acting Macros
  for (const am of ACTING_MACRO_CATALOG) {
    addDocument(
      docs,
      am.id,
      'acting_macro',
      am.label,
      am.category,
      am.summary,
      'acting macro choreography animation'
    );
  }

  // 11. 25 4-Act Visual Arc Presets
  for (const arc of ACT_ARC_PRESETS) {
    addDocument(
      docs,
      arc.id,
      'act_arc',
      arc.label,
      '4-Act Visual Arc',
      arc.description,
      'act arc progression story mood'
    );
  }

  // 12. 84 Procedural Backdrop Themes
  for (const bt of BACKDROP_THEMES) {
    addDocument(
      docs,
      bt.id,
      'backdrop_theme',
      bt.label,
      'Procedural Backdrop',
      bt.vibe,
      'procedural backdrop generator theme'
    );
  }

  // 13. 84 Procedural Prop Presets
  for (const pp of CUSTOM_PROP_PRESETS) {
    addDocument(
      docs,
      pp.id,
      'prop_preset',
      pp.label,
      'Procedural Prop',
      pp.note,
      'procedural prop generator icon'
    );
  }

  // 14. CharacterDNA Modular & Wave 7 Granular Parts
  for (const hw of HEADWEAR_CATALOG) {
    addDocument(docs, `headwear:${hw.id}`, 'dna_part', hw.label, 'DNA Headwear', `${hw.label} character headwear`, 'dna headwear hat helmet');
  }
  for (const top of TOP_STYLE_CATALOG) {
    addDocument(docs, `top:${top.id}`, 'dna_part', top.label, 'DNA Outfit Top', `${top.label} character outfit top`, 'dna outfit armor coat robe');
  }
  for (const pat of SURFACE_PATTERN_CATALOG) {
    addDocument(docs, `pattern:${pat.id}`, 'dna_part', pat.label, 'DNA Pattern', `${pat.label} garment surface pattern`, 'dna pattern texture');
  }
  for (const item of EYEBROW_STYLE_CATALOG) {
    addDocument(docs, `eyebrow:${item.id}`, 'dna_part', item.label, 'DNA Eyebrows', `${item.label} character eyebrow style`, 'dna face eyebrow brow');
  }
  for (const item of PUPIL_STYLE_CATALOG) {
    addDocument(docs, `pupil:${item.id}`, 'dna_part', item.label, 'DNA Pupils', `${item.label} character eye pupil iris`, 'dna face eye pupil iris');
  }
  for (const item of EYELASH_STYLE_CATALOG) {
    if (item.id === 'none') continue;
    addDocument(docs, `eyelash:${item.id}`, 'dna_part', item.label, 'DNA Eyelashes', `${item.label} eyelash eyeliner makeup`, 'dna face eyelash liner');
  }
  for (const item of MOUTH_STYLE_CATALOG) {
    addDocument(docs, `mouth:${item.id}`, 'dna_part', item.label, 'DNA Mouth & Lips', `${item.label} mouth lips fangs expression`, 'dna face mouth lips fangs');
  }
  for (const item of HAIR_STYLE_CATALOG) {
    if (item.id === 'none') continue;
    addDocument(docs, `hair:${item.id}`, 'dna_part', item.label, 'DNA Hair', `${item.label} hairstyle hair mane`, 'dna hair hairstyle cut');
  }
  for (const item of FACIAL_HAIR_CATALOG) {
    if (item.id === 'none') continue;
    addDocument(docs, `facial_hair:${item.id}`, 'dna_part', item.label, 'DNA Facial Hair', `${item.label} beard mustache stubble`, 'dna facial hair beard mustache');
  }
  for (const item of FACE_MARK_CATALOG) {
    if (item.id === 'none') continue;
    addDocument(docs, `face_mark:${item.id}`, 'dna_part', item.label, 'DNA Face Mark', `${item.label} face scar tattoo freckles paint`, 'dna face mark scar tattoo paint');
  }
  for (const item of BODY_MARK_CATALOG) {
    if (item.id === 'none') continue;
    addDocument(docs, `body_mark:${item.id}`, 'dna_part', item.label, 'DNA Body Mark', `${item.label} body tattoo scar cyber implant henna`, 'dna body mark tattoo scar implant');
  }
  for (const item of OUTERWEAR_CATALOG) {
    if (item.id === 'none') continue;
    addDocument(docs, `outerwear:${item.id}`, 'dna_part', item.label, 'DNA Outerwear', `${item.label} jacket coat cloak vest outerwear`, 'dna outfit outerwear jacket coat');
  }
  for (const item of SLEEVE_CATALOG) {
    if (item.id === 'auto') continue;
    addDocument(docs, `sleeve:${item.id}`, 'dna_part', item.label, 'DNA Sleeves', `${item.label} sleeve cut arm garment`, 'dna outfit sleeve');
  }
  for (const item of WAIST_CATALOG) {
    if (item.id === 'none') continue;
    addDocument(docs, `waist:${item.id}`, 'dna_part', item.label, 'DNA Waist & Belt', `${item.label} belt sash obi corset holster`, 'dna outfit waist belt sash');
  }
  for (const item of GLOVE_CATALOG) {
    if (item.id === 'none') continue;
    addDocument(docs, `glove:${item.id}`, 'dna_part', item.label, 'DNA Gloves', `${item.label} gloves gauntlet bracer hand wraps`, 'dna outfit glove handwear');
  }
  for (const item of FOOTWEAR_CATALOG) {
    if (item.id === 'auto') continue;
    addDocument(docs, `footwear:${item.id}`, 'dna_part', item.label, 'DNA Footwear', `${item.label} boots sandals sneakers greaves shoes`, 'dna outfit footwear boots shoes');
  }
  for (const item of EYEWEAR_CATALOG) {
    if (item.id === 'none') continue;
    addDocument(docs, `eyewear:${item.id}`, 'dna_part', item.label, 'DNA Eyewear', `${item.label} glasses shades monocle visor eyepatch goggles`, 'dna accessory eyewear glasses shades');
  }
  for (const item of EAR_JEWELRY_CATALOG) {
    if (item.id === 'none') continue;
    addDocument(docs, `ear_jewelry:${item.id}`, 'dna_part', item.label, 'DNA Ear & Face Jewelry', `${item.label} earrings hoops nose ring piercing cuff`, 'dna accessory jewelry earrings piercing');
  }
  for (const item of NECKWEAR_CATALOG) {
    if (item.id === 'none') continue;
    addDocument(docs, `neckwear:${item.id}`, 'dna_part', item.label, 'DNA Neckwear', `${item.label} pendant choker chain scarf amulet bow tie`, 'dna accessory neckwear necklace');
  }
  for (const item of WRISTWEAR_CATALOG) {
    if (item.id === 'none') continue;
    addDocument(docs, `wristwear:${item.id}`, 'dna_part', item.label, 'DNA Wristwear', `${item.label} watch bangles cuff bracelet holo wristband`, 'dna accessory wristwear watch bracelet');
  }
  for (const item of BACK_GEAR_CATALOG) {
    if (item.id === 'none') continue;
    addDocument(docs, `back_gear:${item.id}`, 'dna_part', item.label, 'DNA Back Gear', `${item.label} backpack katana quiver jetpack shield guitar wings`, 'dna accessory back gear weapon pack');
  }

  // 15. SFX, Music Raag Engines, Shots & Look Presets
  for (const sfx of SFX_CATALOG) {
    addDocument(docs, sfx.id, 'sfx', sfx.label, 'Sound FX', `${sfx.label} procedural audio sound effect`, 'sfx sound audio');
  }
  for (const raag of RAAG_CATALOG) {
    addDocument(docs, raag.id, 'raag', raag.label, 'Music Engine', raag.vibe, 'music raag score soundtrack');
  }
  for (const shot of SHOT_CATALOG) {
    addDocument(docs, shot.id, 'shot', shot.label, 'Camera Shot', `${shot.label} framing shot`, 'shot camera framing');
  }
  for (const lp of LOOK_PRESETS) {
    addDocument(docs, lp.id, 'look_preset', lp.label, 'Look Preset', lp.note, `look preset ${lp.style.renderStyle}`);
  }

  // Build inverted postings & Okapi BM25 IDF table
  const postings = new Map<string, number[]>();
  let totalLen = 0;
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    totalLen += doc.docLen;
    for (const term of doc.tf.keys()) {
      let list = postings.get(term);
      if (!list) {
        list = [];
        postings.set(term, list);
      }
      list.push(i);
    }
  }

  const N = Math.max(1, docs.length);
  const idf = new Map<string, number>();
  for (const [term, list] of postings.entries()) {
    const df = list.length;
    idf.set(term, Math.log(1 + (N - df + 0.5) / (df + 0.5)));
  }

  return {
    docs,
    postings,
    idf,
    avgDocLen: totalLen / N,
  };
}

function getIndex(): Bm25Index {
  if (!cachedIndex) {
    cachedIndex = buildCatalogIndex();
  }
  return cachedIndex;
}

/** Returns total number of indexed studio items across all live catalogs (1,150+) */
export function getCatalogIndexSize(): number {
  return getIndex().docs.length;
}

const BM25_K1 = 1.5;
const BM25_B = 0.75;

/**
 * Deterministic Okapi BM25 + synonym expansion search across Stagecraft Studio's live catalogs.
 */
export function searchStudioCatalog(
  query: string,
  options?: { kinds?: CatalogItemKind[]; limit?: number }
): CatalogSearchResult[] {
  const idx = getIndex();
  const limit = Math.max(1, Math.min(200, Math.floor(options?.limit ?? 24)));
  const kindFilter = options?.kinds && options.kinds.length > 0 ? new Set(options.kinds) : null;
  const rawQuery = (query || '').trim().toLowerCase();

  if (!rawQuery) {
    const out: CatalogSearchResult[] = [];
    for (const doc of idx.docs) {
      if (kindFilter && !kindFilter.has(doc.kind)) continue;
      out.push({
        id: doc.id,
        kind: doc.kind,
        label: doc.label,
        category: doc.category,
        description: doc.description,
        score: 0,
        matchedTerms: [],
      });
      if (out.length >= limit) break;
    }
    return out;
  }

  const primaryTerms = Array.from(new Set(tokenizeText(rawQuery)));
  if (primaryTerms.length === 0) return [];

  // Build weighted query term map: direct query terms = 1.0, domain synonym expansions = 0.42
  const queryWeights = new Map<string, number>();
  for (const t of primaryTerms) {
    queryWeights.set(t, 1.0);
    const syns = SYNONYM_MAP.get(t);
    if (syns) {
      for (const s of syns) {
        if (!queryWeights.has(s)) {
          queryWeights.set(s, 0.42);
        }
      }
    }
  }

  // Collect candidate doc indices via postings + deterministic prefix matching for direct query terms
  const scores = new Map<number, number>();
  const matchedByDoc = new Map<number, Set<string>>();

  const addTermScore = (docIdx: number, term: string, weight: number, idfVal: number) => {
    const doc = idx.docs[docIdx];
    if (kindFilter && !kindFilter.has(doc.kind)) return;
    const tf = doc.tf.get(term) || 0;
    if (tf <= 0) return;
    const denom = tf + BM25_K1 * (1 - BM25_B + BM25_B * (doc.docLen / idx.avgDocLen));
    const bm25 = idfVal * ((tf * (BM25_K1 + 1)) / denom) * weight;
    scores.set(docIdx, (scores.get(docIdx) || 0) + bm25);
    let mset = matchedByDoc.get(docIdx);
    if (!mset) {
      mset = new Set<string>();
      matchedByDoc.set(docIdx, mset);
    }
    mset.add(term);
  };

  for (const [qTerm, qWeight] of queryWeights.entries()) {
    const exactDocs = idx.postings.get(qTerm);
    if (exactDocs) {
      const idfVal = idx.idf.get(qTerm) ?? 1;
      for (const docIdx of exactDocs) {
        addTermScore(docIdx, qTerm, qWeight, idfVal);
      }
    }
    // Prefix bonus for direct user terms (e.g. "cyber" -> "cyberpunk", "detec" -> "detective")
    if (qWeight >= 0.99 && qTerm.length >= 3) {
      for (const [vocabTerm, postingList] of idx.postings.entries()) {
        if (vocabTerm !== qTerm && vocabTerm.startsWith(qTerm)) {
          const idfVal = idx.idf.get(vocabTerm) ?? 1;
          for (const docIdx of postingList) {
            addTermScore(docIdx, vocabTerm, 0.68, idfVal);
          }
        }
      }
    }
  }

  // Direct ID / Label exact-substring boost + multi-term coverage bonus
  const ranked: CatalogSearchResult[] = [];
  for (const [docIdx, baseScore] of scores.entries()) {
    const doc = idx.docs[docIdx];
    const idL = doc.id.toLowerCase();
    const labelL = doc.label.toLowerCase();
    let boost = 0;

    if (idL === rawQuery || labelL === rawQuery) {
      boost += 8.0;
    } else if (idL.includes(rawQuery) || labelL.includes(rawQuery)) {
      boost += 3.2;
    }

    let directHits = 0;
    for (const pt of primaryTerms) {
      if (doc.tf.has(pt) || idL.includes(pt) || labelL.includes(pt)) {
        directHits += 1;
      }
    }
    if (primaryTerms.length > 1 && directHits >= 2) {
      boost += directHits * 1.45;
    }

    const finalScore = Number((baseScore + boost).toFixed(4));
    const matchedTerms = Array.from(matchedByDoc.get(docIdx) || []).sort();

    ranked.push({
      id: doc.id,
      kind: doc.kind,
      label: doc.label,
      category: doc.category,
      description: doc.description,
      score: finalScore,
      matchedTerms,
    });
  }

  // Deterministic tie-breaking: score DESC -> label ASC -> id ASC
  ranked.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
  return ranked.slice(0, limit);
}

/**
 * Recommends a complete, valid, cohesive scene palette (stages, archetypes, prop,
 * moods, weather, crowd, FX, art engine & sprite preset) for any natural-language story prompt.
 */
export function recommendScenePaletteForPrompt(prompt: string): RecommendedScenePalette {
  const q = (prompt || '').trim() || 'ancient royal courtyard drama';

  const pick = <T extends string>(
    kinds: CatalogItemKind[],
    fallback: T,
    exclude?: Set<string>
  ): T => {
    const hits = searchStudioCatalog(q, { kinds, limit: 12 });
    for (const h of hits) {
      if (h.id === 'none') continue;
      if (exclude && exclude.has(h.id)) continue;
      return h.id as T;
    }
    return fallback;
  };

  const stage = pick<StageId>(['stage'], 'banyan_clearing');
  const secondaryStage = pick<StageId>(['stage'], 'royal_durbar', new Set([stage]));
  const archetype = pick<ArchetypeId>(['archetype'], 'king');
  const secondaryArchetype = pick<ArchetypeId>(['archetype'], 'sage', new Set([archetype]));
  const prop = pick<PropId>(['prop'], 'diya_lamp');
  const mood = pick<MoodId>(['mood'], 'midnight_banyan');
  const secondaryMood = pick<MoodId>(['mood'], 'golden_durbar', new Set([mood]));
  const weather = pick<WeatherId>(['weather'], 'fireflies');
  const crowd = pick<CrowdId>(['crowd'], 'none');
  const fx = pick<FxId>(['fx'], 'sparkle_burst');
  const renderStyle = pick<RenderStyleId>(['render_style'], 'chiaroscuro');
  const spritePresetId = pick<string>(['sprite_preset'], SPRITE_WORKSHOP_PRESETS[0]?.id || 'detective_noir');

  return {
    stage,
    secondaryStage,
    archetype,
    secondaryArchetype,
    prop,
    mood,
    secondaryMood,
    weather,
    crowd,
    fx,
    renderStyle,
    spritePresetId,
  };
}
