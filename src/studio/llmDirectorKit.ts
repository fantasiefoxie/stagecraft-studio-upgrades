import { buildAnimationPrinciplesPromptBlock } from './animationPrinciples';
import {
  ARCHETYPE_CATALOG,
  ARCHETYPE_DEFAULT_COLORS,
  ActorPlacement,
  ArchetypeId,
  BeatActionCue,
  BeatExpressionCue,
  CAMERA_MOVE_CATALOG,
  CROWD_CATALOG,
  CameraMoveId,
  CastHeadgearId,
  CastMarkId,
  CastMember,
  CrowdId,
  DEFAULT_VISUAL_STYLE,
  EXPRESSION_LIST,
  EpisodeScript,
  ExpressionId,
  ExpressionKeyframe,
  FRAME_CATALOG,
  FX_LIST,
  FrameMode,
  FxId,
  LookPresetId,
  MOOD_CATALOG,
  MOTION_LIST,
  MoodId,
  MotionCardConfig,
  MotionCardLayoutId,
  MotionId,
  MotionProfileId,
  POSE_LIST,
  PROP_CATALOG,
  PoseId,
  PropId,
  RAAG_CATALOG,
  RENDER_STYLE_CATALOG,
  RaagId,
  RenderStyleId,
  SFX_CATALOG,
  SHOT_CATALOG,
  STAGE_CATALOG,
  SfxId,
  ShotId,
  StageId,
  StoryBeat,
  StorybookShelf,
  TRANSITION_CATALOG,
  TransitionId,
  WEATHER_LIST,
  WeatherId,
  normalizeExpressionId,
  resolveVisualStyle,
  validateEpisodeScript,
} from './types';
import { CastBibleEntry, applyCastBibleToEpisode } from './castBible';
import { choreographEpisodeEmotions } from './emotionChoreographer';
import {
  CharacterSilhouetteFingerprint,
  SILHOUETTE_TWIN_THRESHOLD,
  computeDnaFingerprint,
  computeSilhouetteDistance,
  hydrateArchetypeToDna,
  mutateDnaForUniqueness,
  syncMemberWithDna,
  validateAndNormalizeDna,
} from './characterDna';
import { collectLedgerCastFingerprints, loadPublishLedger } from './monetizationShield';
import {
  StoryArcTemplate,
  autoSplitLongDialogueBeats,
  buildLlmTierDocumentationMarkdown,
  formatBeatSkeletonForPrompt,
  sanitizeDialogueAndExtractActing,
} from './scriptCraft';
import {
  LanguageCode,
  buildLanguageDirectorInstruction,
  detectLanguageFromText,
  estimateMultilingualDuration,
  getLanguageSpec,
  isValidLanguageCode,
} from './i18n';

export type PlaybookId =
  | 'indian_supernatural'
  | 'indian_fables'
  | 'indian_court_wit'
  | 'indian_epics'
  | 'western_fables_myth'
  | 'east_asian_tales'
  | 'southeast_asian_folklore'
  | 'americas_indigenous'
  | 'african_griot';

export interface RegionalPlaybook {
  id: PlaybookId;
  label: string;
  shortLabel: string;
  shelf: StorybookShelf;
  defaultSeries: string;
  renderStyle: RenderStyleId;
  altRenderStyles: RenderStyleId[];
  lookPreset: LookPresetId;
  defaultRaag: RaagId;
  defaultMood: MoodId;
  defaultWeather: WeatherId;
  stages: StageId[];
  archetypes: ArchetypeId[];
  props: PropId[];
  keywords: string[];
  directingNote: string;
}

export const REGIONAL_PLAYBOOKS: RegionalPlaybook[] = [
  {
    id: 'indian_supernatural',
    label: 'Indian Supernatural & Royal Legends (Vikram & Betaal, Singhasan Battisi)',
    shortLabel: 'Indian Supernatural',
    shelf: 'Supernatural & Royal Legends',
    defaultSeries: 'Vikram & Betaal',
    renderStyle: 'chiaroscuro',
    altRenderStyles: ['shadow_puppetry', 'woodblock_print'],
    lookPreset: 'moonlit_noir',
    defaultRaag: 'bhairavi',
    defaultMood: 'midnight_banyan',
    defaultWeather: 'fireflies',
    stages: [
      'banyan_clearing',
      'cremation_ground',
      'kali_temple',
      'throne_mound',
      'moonlit_terrace',
      'royal_bedchamber',
      'royal_durbar',
      'river_ghat',
    ],
    archetypes: ['king', 'spirit', 'ascetic', 'queen', 'statue_apsara', 'sage', 'merchant', 'guard'],
    props: [
      'khanda_sword',
      'banyan_bough',
      'kali_idol',
      'golden_statue',
      'seven_mattresses',
      'lotus_petal',
      'diya_lamp',
      'royal_palanquin',
      'royal_scroll',
    ],
    keywords: [
      'vikram',
      'betaal',
      'vetala',
      'singhasan',
      'battisi',
      'bhoja',
      'tantrik',
      'banyan',
      'cremation',
      'ghost',
      'riddle',
      'kathasaritsagara',
      'apsara',
      'kali',
    ],
    directingNote:
      'Use moonlit chiaroscuro framing, Betaal perched overhead or hanging upside down, and finish with a sharp moral riddle.',
  },
  {
    id: 'indian_fables',
    label: 'Indian Animal Fables (Panchatantra, Hitopadesha, Jataka Tales)',
    shortLabel: 'Indian Animal Fables',
    shelf: 'Animal Fables & Strategy',
    defaultSeries: 'Panchatantra',
    renderStyle: 'lineless_vector',
    altRenderStyles: ['papercraft_diorama', 'chiaroscuro'],
    lookPreset: 'sunlit_storybook',
    defaultRaag: 'bhoopali',
    defaultMood: 'emerald_jungle',
    defaultWeather: 'fireflies',
    stages: [
      'bamboo_forest',
      'banyan_clearing',
      'enchanted_lake',
      'river_ghat',
      'cave_den',
      'courtyard_well',
      'village_chowk',
    ],
    archetypes: [
      'monkey',
      'lion',
      'tiger',
      'jackal',
      'hare',
      'tortoise',
      'crocodile',
      'crow',
      'crane',
      'owl',
      'mouse',
      'deer',
      'elephant',
      'bull',
      'serpent',
      'sage',
    ],
    props: [
      'stone_well',
      'wooden_cage',
      'flying_stick',
      'gold_bangle',
      'lotus_pond',
      'earthen_pot',
      'treasure_chest',
      'banyan_bough',
      'royal_scroll',
    ],
    keywords: [
      'panchatantra',
      'hitopadesha',
      'jataka',
      'jackal',
      'crocodile',
      'monkey',
      'banyan deer',
      'lion',
      'hare',
      'tortoise',
      'crane',
      'blue jackal',
      'talking cave',
      'greedy tiger',
    ],
    directingNote:
      'Use lively woodland pacing, clear left-vs-right trickster exchanges, and a crisp practical wisdom moral card.',
  },
  {
    id: 'indian_court_wit',
    label: 'Indian Royal Court Wit (Tenali Rama, Akbar & Birbal, Gopal Bhar)',
    shortLabel: 'Indian Court Wit',
    shelf: 'Royal Court Wit & Satire',
    defaultSeries: 'Akbar & Birbal',
    renderStyle: 'papercraft_diorama',
    altRenderStyles: ['lineless_vector', 'chiaroscuro'],
    lookPreset: 'classic_chiaroscuro',
    defaultRaag: 'desh',
    defaultMood: 'golden_durbar',
    defaultWeather: 'none',
    stages: [
      'royal_durbar',
      'mughal_courtyard',
      'palace_garden',
      'bazaar_lane',
      'village_chowk',
      'royal_dungeon',
      'courtyard_well',
    ],
    archetypes: ['emperor', 'king', 'courtier', 'merchant', 'guard', 'queen', 'elder_woman', 'child', 'crow'],
    props: [
      'peacock_throne',
      'hanging_khichdi_pot',
      'royal_scales',
      'measuring_stake',
      'earthen_pot',
      'treasure_chest',
      'royal_scroll',
      'diya_lamp',
      'hand_mirror',
      'saffron_feast',
    ],
    keywords: [
      'birbal',
      'akbar',
      'tenali',
      'rama',
      'krishnadevaraya',
      'gopal bhar',
      'durbar',
      'khichdi',
      'courtier',
      'emperor',
      'witty',
      'satire',
      'bazaar',
    ],
    directingNote:
      'Use royal durbar crowds on wide shots, snappy closeup reactions for punchlines, and court_gasp or wooden_gavel on the reveal.',
  },
  {
    id: 'indian_epics',
    label: 'Indian Sacred Epics & Puranas (Ramayana, Mahabharata, Puranas)',
    shortLabel: 'Indian Epics',
    shelf: 'Sacred Epics & Puranas',
    defaultSeries: 'Ramayana',
    renderStyle: 'stained_glass',
    altRenderStyles: ['chiaroscuro', 'shadow_puppetry'],
    lookPreset: 'gilded_epic',
    defaultRaag: 'darbari',
    defaultMood: 'twilight_temple',
    defaultWeather: 'embers',
    stages: [
      'ashoka_vatika',
      'golden_lanka',
      'kurukshetra_field',
      'himalayan_hermitage',
      'enchanted_lake',
      'ocean_ship',
      'cloud_skies',
      'royal_durbar',
      'kali_temple',
    ],
    archetypes: [
      'deva',
      'goddess',
      'warrior',
      'vanara_hero',
      'demon_king',
      'sage',
      'yaksha',
      'queen',
      'king',
      'child',
      'elder_woman',
      'deer',
      'dog',
    ],
    props: [
      'bow_arrow',
      'gada_mace',
      'sudarshana_chakra',
      'trishul',
      'sanjevani_mountain',
      'signet_ring',
      'magic_chariot',
      'conch_shell',
      'sacred_fire',
      'lotus_pond',
    ],
    keywords: [
      'ramayana',
      'mahabharata',
      'purana',
      'rama',
      'sita',
      'hanuman',
      'ravana',
      'arjuna',
      'krishna',
      'yudhishthira',
      'yaksha',
      'kurukshetra',
      'ekalavya',
      'shabari',
      'prahlada',
      'shiva',
      'durga',
      'lanka',
    ],
    directingNote:
      'Use grand mythic composition, divine_aura on avatars, army or monks crowds for epic scale, and shankha_conch or temple_bell stings.',
  },
  {
    id: 'western_fables_myth',
    label: "Western Folklore, Aesop's Fables, Grimm & Greek/Norse Myths",
    shortLabel: 'Western / Aesop / Myth',
    shelf: 'Western Folklore & Fables',
    defaultSeries: "Aesop's Fables",
    renderStyle: 'greek_amphora',
    altRenderStyles: ['illuminated_codex', 'woodblock_print', 'stained_glass'],
    lookPreset: 'palm_leaf_manuscript',
    defaultRaag: 'greek_lyre',
    defaultMood: 'sandstone_dusk',
    defaultWeather: 'petals',
    stages: [
      'olympus_acropolis',
      'enchanted_cottage',
      'ocean_ship',
      'cave_den',
      'cloud_skies',
      'kurukshetra_field',
      'village_chowk',
      'royal_dungeon',
    ],
    archetypes: [
      'fox',
      'wolf',
      'crow',
      'hare',
      'tortoise',
      'lion',
      'mouse',
      'dog',
      'knight',
      'queen',
      'king',
      'elder_woman',
      'child',
      'merchant',
      'deva',
    ],
    props: [
      'golden_fleece',
      'golden_egg',
      'hand_mirror',
      'wooden_cage',
      'magic_chariot',
      'bow_arrow',
      'trishul',
      'diya_lamp',
      'treasure_chest',
      'royal_scales',
      'royal_scroll',
    ],
    keywords: [
      'aesop',
      'grimm',
      'greek',
      'olympus',
      'odyssey',
      'odysseus',
      'icarus',
      'midas',
      'athena',
      'zeus',
      'poseidon',
      'hercules',
      'norse',
      'odin',
      'thor',
      'loki',
      'arthur',
      'cinderella',
      'hansel',
      'red riding',
      'fox',
      'wolf',
      'sour grapes',
      'goose',
      'tortoise and the hare',
      'boy who cried wolf',
      'andersen',
      'medieval',
      'knight',
      'arabian',
      'aladdin',
      'sinbad',
    ],
    directingNote:
      'Pair Aesop/Greek tales with greek_amphora + greek_lyre + olympus_acropolis; pair Grimm/Arthurian tales with illuminated_codex + medieval_lute + enchanted_cottage.',
  },
  {
    id: 'east_asian_tales',
    label: 'East Asian Tales & Epics (Journey to the West, Japanese Folktales)',
    shortLabel: 'East Asian Tales',
    shelf: 'East Asian Tales & Epics',
    defaultSeries: 'Journey to the West',
    renderStyle: 'sumi_e_wash',
    altRenderStyles: ['woodblock_print', 'chiaroscuro'],
    lookPreset: 'moonlit_noir',
    defaultRaag: 'guqin_bamboo',
    defaultMood: 'moonlit_marble',
    defaultWeather: 'petals',
    stages: [
      'bamboo_pagoda',
      'bamboo_forest',
      'cloud_skies',
      'himalayan_hermitage',
      'enchanted_lake',
      'ocean_ship',
      'cave_den',
      'village_chowk',
    ],
    archetypes: [
      'samurai',
      'vanara_hero',
      'monkey',
      'fox',
      'crane',
      'tortoise',
      'serpent',
      'sage',
      'queen',
      'elder_woman',
      'child',
      'demon_king',
      'spirit',
    ],
    props: [
      'magic_staff',
      'magic_peach',
      'khanda_sword',
      'hand_mirror',
      'diya_lamp',
      'royal_scroll',
      'lotus_petal',
      'treasure_chest',
      'sacred_fire',
    ],
    keywords: [
      'wukong',
      'journey to the west',
      'monkey king',
      'momotaro',
      'peach boy',
      'kaguya',
      'bamboo cutter',
      'urashima',
      'kitsune',
      'crane wife',
      'samurai',
      'yokai',
      'japan',
      'japanese',
      'china',
      'chinese',
      'pagoda',
      'shogun',
      'tanuki',
      'dragon king',
      'mulan',
      'korean',
    ],
    directingNote:
      'Use sumi_e_wash or woodblock_print with guqin_bamboo music, bamboo_pagoda or cloud_skies stages, and petals/mist atmosphere.',
  },
  {
    id: 'southeast_asian_folklore',
    label: 'Southeast Asian Folklore (Sang Kancil, Wayang Kulit, Archipelago Tales)',
    shortLabel: 'Southeast Asian',
    shelf: 'Southeast Asian Folklore',
    defaultSeries: 'Sang Kancil Tales',
    renderStyle: 'shadow_puppetry',
    altRenderStyles: ['woodblock_print', 'papercraft_diorama'],
    lookPreset: 'gilded_epic',
    defaultRaag: 'gamelan_wayang',
    defaultMood: 'emerald_jungle',
    defaultWeather: 'fireflies',
    stages: [
      'tropical_archipelago',
      'river_ghat',
      'bamboo_forest',
      'ocean_ship',
      'enchanted_lake',
      'village_chowk',
    ],
    archetypes: ['deer', 'crocodile', 'tiger', 'monkey', 'tortoise', 'king', 'queen', 'warrior', 'merchant', 'elder_woman'],
    props: ['kris_dagger', 'diya_lamp', 'earthen_pot', 'wooden_cage', 'sacred_fire', 'treasure_chest', 'royal_scroll'],
    keywords: [
      'kancil',
      'mouse deer',
      'wayang',
      'java',
      'javanese',
      'bali',
      'balinese',
      'malay',
      'indonesia',
      'thai',
      'vietnam',
      'philippine',
      'archipelago',
      'kris',
      'gamelan',
      'garuda',
    ],
    directingNote:
      'Use shadow_puppetry (Wayang Kulit) with gamelan_wayang music and tropical_archipelago or river_ghat backdrops.',
  },
  {
    id: 'americas_indigenous',
    label: 'Americas & Indigenous Legends (Raven, Coyote, Mesoamerican & Folk Tales)',
    shortLabel: 'Americas & Indigenous',
    shelf: 'Americas & Indigenous Legends',
    defaultSeries: 'Legends of the Americas',
    renderStyle: 'woodblock_print',
    altRenderStyles: ['lineless_vector', 'chiaroscuro'],
    lookPreset: 'classic_chiaroscuro',
    defaultRaag: 'cedar_flute',
    defaultMood: 'sandstone_dusk',
    defaultWeather: 'embers',
    stages: [
      'red_canyon_mesa',
      'cloud_skies',
      'enchanted_cottage',
      'river_ghat',
      'cave_den',
      'enchanted_lake',
      'himalayan_hermitage',
    ],
    archetypes: ['raven', 'wolf', 'deer', 'tortoise', 'owl', 'serpent', 'elder_woman', 'child', 'warrior', 'sage', 'fox'],
    props: ['sun_orb', 'sacred_fire', 'bow_arrow', 'story_box', 'earthen_pot', 'magic_staff', 'diya_lamp'],
    keywords: [
      'raven',
      'coyote',
      'thunderbird',
      'iroquois',
      'cherokee',
      'navajo',
      'lakota',
      'inuit',
      'aztec',
      'mayan',
      'inca',
      'quetzalcoatl',
      'steals the sun',
      'turtle island',
      'paul bunyan',
      'john henry',
      'brer rabbit',
      'mesa',
      'canyon',
    ],
    directingNote:
      'Use woodblock_print or lineless_vector with cedar_flute music, red_canyon_mesa or cloud_skies, and sun_orb / sacred_fire props.',
  },
  {
    id: 'african_griot',
    label: 'African Griot & Trickster Tales (Anansi the Spider, Yoruba & Savanna Fables)',
    shortLabel: 'African Griot',
    shelf: 'African Griot & Trickster Tales',
    defaultSeries: 'Anansi the Spider',
    renderStyle: 'kente_tapestry',
    altRenderStyles: ['papercraft_diorama', 'lineless_vector'],
    lookPreset: 'gilded_epic',
    defaultRaag: 'kora_griot',
    defaultMood: 'golden_durbar',
    defaultWeather: 'fireflies',
    stages: ['savanna_baobab', 'village_chowk', 'river_ghat', 'banyan_clearing', 'cave_den', 'cloud_skies'],
    archetypes: [
      'spider',
      'lion',
      'elephant',
      'hare',
      'tortoise',
      'serpent',
      'monkey',
      'king',
      'elder_woman',
      'child',
      'merchant',
      'sage',
    ],
    props: ['story_box', 'earthen_pot', 'sacred_fire', 'golden_egg', 'treasure_chest', 'diya_lamp', 'royal_scales'],
    keywords: [
      'anansi',
      'nyame',
      'ashanti',
      'akan',
      'griot',
      'baobab',
      'savanna',
      'africa',
      'african',
      'yoruba',
      'zulu',
      'ethiopian',
      'nigerian',
      'ghana',
      'kente',
      'kora',
      'spider',
      'sundiata',
      'tortoise shell',
    ],
    directingNote:
      'Use kente_tapestry with kora_griot music, savanna_baobab backdrop, spider archetype for Anansi, and story_box / earthen_pot props.',
  },
];

export function getPlaybookById(id: PlaybookId): RegionalPlaybook {
  return REGIONAL_PLAYBOOKS.find((p) => p.id === id) || REGIONAL_PLAYBOOKS[0];
}

export function detectPlaybookFromText(text: string): RegionalPlaybook {
  const lower = text.toLowerCase();
  let best = REGIONAL_PLAYBOOKS[0];
  let bestScore = 0;

  for (const pb of REGIONAL_PLAYBOOKS) {
    let score = 0;
    for (const kw of pb.keywords) {
      if (lower.includes(kw)) {
        score += kw.includes(' ') ? 3 : 2;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = pb;
    }
  }

  // Fallback heuristic for general European/animal fables
  if (bestScore === 0) {
    if (/\b(prince|princess|castle|witch|forest|magic|giant)\b/i.test(lower)) {
      return getPlaybookById('western_fables_myth');
    }
    if (/\b(fox|lion|wolf|crow|hare|tortoise|mouse)\b/i.test(lower)) {
      return getPlaybookById('indian_fables');
    }
  }
  return best;
}

// =========================================================================
// SEMANTIC ALIAS & FUZZY RESOLVERS (Zero Dumb Fallbacks!)
// =========================================================================

const ARCHETYPE_ALIASES: Record<string, ArchetypeId> = {
  // Divine & Epic
  god: 'deva',
  deity: 'deva',
  rama: 'deva',
  krishna: 'deva',
  vishnu: 'deva',
  shiva: 'deva',
  zeus: 'deva',
  odin: 'deva',
  nyame: 'deva',
  sky_god: 'deva',
  angel: 'deva',
  devi: 'goddess',
  sita: 'goddess',
  durga: 'goddess',
  lakshmi: 'goddess',
  saraswati: 'goddess',
  athena: 'goddess',
  hera: 'goddess',
  fairy: 'goddess',
  demon: 'demon_king',
  asura: 'demon_king',
  rakshasa: 'demon_king',
  ravana: 'demon_king',
  ogre: 'demon_king',
  giant: 'demon_king',
  oni: 'demon_king',
  monster: 'demon_king',
  hanuman: 'vanara_hero',
  monkey_king: 'vanara_hero',
  sun_wukong: 'vanara_hero',
  wukong: 'vanara_hero',
  vanara: 'vanara_hero',
  ghost: 'spirit',
  betaal: 'spirit',
  vetala: 'spirit',
  phantom: 'spirit',
  specter: 'spirit',
  yokai: 'spirit',
  genie: 'yaksha',
  djinn: 'yaksha',
  forest_spirit: 'yaksha',
  guardian: 'yaksha',
  nymph: 'statue_apsara',
  apsara: 'statue_apsara',
  statue: 'statue_apsara',
  // Royalty & Folk
  raja: 'king',
  monarch: 'king',
  chief: 'king',
  vikram: 'king',
  vikramaditya: 'king',
  midas: 'king',
  pharaoh: 'king',
  akbar: 'emperor',
  sultan: 'emperor',
  caliph: 'emperor',
  shogun: 'emperor',
  shah: 'emperor',
  princess: 'queen',
  empress: 'queen',
  lady: 'queen',
  maiden: 'queen',
  cinderella: 'queen',
  draupadi: 'queen',
  rishi: 'sage',
  monk: 'sage',
  hermit: 'sage',
  wizard: 'sage',
  prophet: 'sage',
  brahmin: 'sage',
  teacher: 'sage',
  guru: 'sage',
  priest: 'sage',
  scholar: 'sage',
  birbal: 'courtier',
  tenali: 'courtier',
  minister: 'courtier',
  advisor: 'courtier',
  jester: 'courtier',
  trickster_human: 'courtier',
  prince: 'warrior',
  hero: 'warrior',
  archer: 'warrior',
  arjuna: 'warrior',
  soldier: 'warrior',
  tantrik: 'ascetic',
  sorcerer: 'ascetic',
  witch: 'ascetic',
  magician: 'ascetic',
  necromancer: 'ascetic',
  villager: 'merchant',
  farmer: 'merchant',
  woodcutter: 'merchant',
  fisherman: 'merchant',
  traveler: 'merchant',
  trader: 'merchant',
  shepherd: 'merchant',
  aladdin: 'merchant',
  boy: 'child',
  girl: 'child',
  youth: 'child',
  kid: 'child',
  disciple: 'child',
  momotaro: 'child',
  grandmother: 'elder_woman',
  old_woman: 'elder_woman',
  elder: 'elder_woman',
  mother: 'elder_woman',
  shabari: 'elder_woman',
  storyteller: 'elder_woman',
  griot: 'elder_woman',
  bandit: 'guard',
  thief: 'guard',
  robber: 'guard',
  hunter: 'guard',
  sentinel: 'guard',
  // Fauna
  ape: 'monkey',
  chimp: 'monkey',
  baboon: 'monkey',
  big_cat: 'lion',
  panther: 'tiger',
  leopard: 'tiger',
  jaguar: 'tiger',
  ox: 'bull',
  cow: 'bull',
  buffalo: 'bull',
  ram: 'bull',
  goat: 'bull',
  rabbit: 'hare',
  bunny: 'hare',
  brer_rabbit: 'hare',
  hyena: 'jackal',
  snake: 'serpent',
  cobra: 'serpent',
  dragon: 'serpent',
  python: 'serpent',
  naga: 'serpent',
  mammoth: 'elephant',
  kancil: 'deer',
  mouse_deer: 'deer',
  stag: 'deer',
  antelope: 'deer',
  gazelle: 'deer',
  bird: 'crow',
  magpie: 'crow',
  sparrow: 'crow',
  pigeon: 'crow',
  eagle: 'raven',
  hawk: 'raven',
  thunderbird: 'raven',
  swan: 'crane',
  heron: 'crane',
  stork: 'crane',
  goose: 'crane',
  duck: 'crane',
  peacock: 'crane',
  alligator: 'crocodile',
  gator: 'crocodile',
  turtle: 'tortoise',
  terrapin: 'tortoise',
  rat: 'mouse',
  squirrel: 'mouse',
  hound: 'dog',
  puppy: 'dog',
  // World Legends
  kitsune: 'fox',
  reynard: 'fox',
  coyote: 'wolf',
  werewolf: 'wolf',
  anansi: 'spider',
  arachnid: 'spider',
  odysseus: 'knight',
  arthur: 'knight',
  paladin: 'knight',
  viking: 'knight',
  spartan: 'knight',
  ronin: 'samurai',
  ninja: 'samurai',
  swordsman: 'samurai',
};

const STAGE_ALIASES: Record<string, StageId> = {
  forest: 'bamboo_forest',
  jungle: 'bamboo_forest',
  woods: 'enchanted_cottage',
  dark_forest: 'banyan_clearing',
  grove: 'banyan_clearing',
  tree: 'banyan_clearing',
  palace: 'royal_durbar',
  throne_room: 'royal_durbar',
  court: 'royal_durbar',
  castle: 'royal_durbar',
  hall: 'royal_durbar',
  courtyard: 'mughal_courtyard',
  garden: 'palace_garden',
  orchard: 'ashoka_vatika',
  temple: 'kali_temple',
  shrine: 'kali_temple',
  terrace: 'moonlit_terrace',
  balcony: 'moonlit_terrace',
  bedroom: 'royal_bedchamber',
  chamber: 'royal_bedchamber',
  river: 'river_ghat',
  riverbank: 'river_ghat',
  stream: 'river_ghat',
  bridge: 'river_ghat',
  lake: 'enchanted_lake',
  pond: 'enchanted_lake',
  pool: 'enchanted_lake',
  cave: 'cave_den',
  den: 'cave_den',
  cavern: 'cave_den',
  lair: 'cave_den',
  sea: 'ocean_ship',
  ocean: 'ocean_ship',
  ship: 'ocean_ship',
  boat: 'ocean_ship',
  island: 'tropical_archipelago',
  beach: 'tropical_archipelago',
  market: 'bazaar_lane',
  bazaar: 'bazaar_lane',
  street: 'bazaar_lane',
  town: 'village_chowk',
  village: 'village_chowk',
  square: 'village_chowk',
  well: 'courtyard_well',
  prison: 'royal_dungeon',
  dungeon: 'royal_dungeon',
  cell: 'royal_dungeon',
  desert: 'desert_caravan',
  dunes: 'desert_caravan',
  oasis: 'desert_caravan',
  mountain: 'himalayan_hermitage',
  ashram: 'himalayan_hermitage',
  hermitage: 'himalayan_hermitage',
  peak: 'himalayan_hermitage',
  sky: 'cloud_skies',
  clouds: 'cloud_skies',
  heaven: 'cloud_skies',
  battlefield: 'kurukshetra_field',
  war: 'kurukshetra_field',
  graveyard: 'cremation_ground',
  cemetery: 'cremation_ground',
  greece: 'olympus_acropolis',
  olympus: 'olympus_acropolis',
  acropolis: 'olympus_acropolis',
  athens: 'olympus_acropolis',
  vineyard: 'olympus_acropolis',
  pagoda: 'bamboo_pagoda',
  torii: 'bamboo_pagoda',
  kyoto: 'bamboo_pagoda',
  cottage: 'enchanted_cottage',
  hut: 'enchanted_cottage',
  cabin: 'enchanted_cottage',
  savanna: 'savanna_baobab',
  baobab: 'savanna_baobab',
  plains: 'savanna_baobab',
  canyon: 'red_canyon_mesa',
  mesa: 'red_canyon_mesa',
  cliff: 'red_canyon_mesa',
  volcano: 'tropical_archipelago',
  bay: 'tropical_archipelago',
};

const PROP_ALIASES: Record<string, PropId> = {
  sword: 'khanda_sword',
  blade: 'khanda_sword',
  excalibur: 'khanda_sword',
  bow: 'bow_arrow',
  arrow: 'bow_arrow',
  mace: 'gada_mace',
  club: 'gada_mace',
  hammer: 'gada_mace',
  chakra: 'sudarshana_chakra',
  disc: 'sudarshana_chakra',
  trident: 'trishul',
  spear: 'trishul',
  mountain: 'sanjevani_mountain',
  ring: 'signet_ring',
  well: 'stone_well',
  cage: 'wooden_cage',
  trap: 'wooden_cage',
  net: 'wooden_cage',
  stick: 'flying_stick',
  pole: 'flying_stick',
  palanquin: 'royal_palanquin',
  chalice: 'poison_chalice',
  cup: 'poison_chalice',
  goblet: 'poison_chalice',
  potion: 'poison_chalice',
  egg: 'golden_egg',
  gold_egg: 'golden_egg',
  mirror: 'hand_mirror',
  food: 'saffron_feast',
  feast: 'saffron_feast',
  cheese: 'saffron_feast',
  bread: 'saffron_feast',
  grapes: 'magic_peach',
  fruit: 'magic_peach',
  peach: 'magic_peach',
  apple: 'magic_peach',
  bed: 'seven_mattresses',
  mattress: 'seven_mattresses',
  flower: 'lotus_petal',
  lotus: 'lotus_petal',
  lamp: 'diya_lamp',
  lantern: 'diya_lamp',
  torch: 'diya_lamp',
  candle: 'diya_lamp',
  gold: 'treasure_chest',
  coins: 'treasure_chest',
  treasure: 'treasure_chest',
  chest: 'treasure_chest',
  jewels: 'treasure_chest',
  scroll: 'royal_scroll',
  book: 'royal_scroll',
  letter: 'royal_scroll',
  map: 'royal_scroll',
  idol: 'kali_idol',
  chariot: 'magic_chariot',
  cart: 'magic_chariot',
  pot: 'earthen_pot',
  jar: 'earthen_pot',
  pitcher: 'earthen_pot',
  jug: 'earthen_pot',
  vase: 'golden_fleece',
  amphora: 'golden_fleece',
  wreath: 'golden_fleece',
  laurel: 'golden_fleece',
  fire: 'sacred_fire',
  campfire: 'sacred_fire',
  bonfire: 'sacred_fire',
  branch: 'banyan_bough',
  throne: 'peacock_throne',
  bangle: 'gold_bangle',
  bracelet: 'gold_bangle',
  necklace: 'gold_bangle',
  khichdi: 'hanging_khichdi_pot',
  statue: 'golden_statue',
  pond: 'lotus_pond',
  scales: 'royal_scales',
  balance: 'royal_scales',
  conch: 'conch_shell',
  horn: 'conch_shell',
  box: 'story_box',
  story: 'story_box',
  staff: 'magic_staff',
  wand: 'magic_staff',
  rod: 'magic_staff',
  sun: 'sun_orb',
  orb: 'sun_orb',
  moon: 'sun_orb',
  dagger: 'kris_dagger',
  knife: 'kris_dagger',
  kris: 'kris_dagger',
};

const VALID_ARCHETYPES = new Set(ARCHETYPE_CATALOG.map((a) => a.id));
const VALID_STAGES = new Set(STAGE_CATALOG.map((s) => s.id));
const VALID_PROPS = new Set(PROP_CATALOG.map((p) => p.id));
const VALID_MOODS = new Set(MOOD_CATALOG.map((m) => m.id));
const VALID_RAAGS = new Set(RAAG_CATALOG.map((r) => r.id));
const VALID_SFX = new Set(SFX_CATALOG.map((s) => s.id));
const VALID_SHOTS = new Set(SHOT_CATALOG.map((s) => s.id));
const VALID_FRAMES = new Set(FRAME_CATALOG.map((f) => f.id));
const VALID_CROWDS = new Set(CROWD_CATALOG.map((c) => c.id));
const VALID_CAMERA_MOVES = new Set(CAMERA_MOVE_CATALOG.map((c) => c.id));
const VALID_TRANSITIONS = new Set(TRANSITION_CATALOG.map((t) => t.id));
const VALID_RENDER_STYLES = new Set(RENDER_STYLE_CATALOG.map((r) => r.id));

function normalizeToken(val: unknown): string {
  return String(val ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function resolveArchetype(
  raw: unknown,
  fallbackName: string,
  playbook: RegionalPlaybook
): { id: ArchetypeId; fuzzy: boolean } {
  const norm = normalizeToken(raw);
  if (VALID_ARCHETYPES.has(norm as ArchetypeId)) return { id: norm as ArchetypeId, fuzzy: false };
  if (norm && ARCHETYPE_ALIASES[norm]) return { id: ARCHETYPE_ALIASES[norm], fuzzy: true };

  // Token scan across both raw role and character name
  const combined = `${norm}_${normalizeToken(fallbackName)}`;
  for (const arch of ARCHETYPE_CATALOG) {
    if (combined.includes(arch.id)) return { id: arch.id, fuzzy: true };
  }
  for (const [alias, target] of Object.entries(ARCHETYPE_ALIASES)) {
    if (alias.length >= 3 && combined.split('_').includes(alias)) {
      return { id: target, fuzzy: true };
    }
  }
  return { id: playbook.archetypes[0] || 'merchant', fuzzy: true };
}

export function resolveStage(
  raw: unknown,
  playbook: RegionalPlaybook
): { id: StageId; fuzzy: boolean } {
  const norm = normalizeToken(raw);
  if (VALID_STAGES.has(norm as StageId)) return { id: norm as StageId, fuzzy: false };

  // Region-aware forest / woods / grove disambiguation
  if (norm.includes('grove')) {
    if (playbook.id === 'western_fables_myth') return { id: 'olympus_acropolis', fuzzy: true };
    if (playbook.id === 'east_asian_tales') return { id: 'bamboo_pagoda', fuzzy: true };
    if (playbook.id === 'indian_epics') return { id: 'ashoka_vatika', fuzzy: true };
    return { id: 'banyan_clearing', fuzzy: true };
  }
  if (norm.includes('forest') || norm.includes('woods') || norm.includes('jungle')) {
    if (playbook.id === 'western_fables_myth') return { id: 'enchanted_cottage', fuzzy: true };
    if (playbook.id === 'indian_supernatural') return { id: 'banyan_clearing', fuzzy: true };
    if (playbook.id === 'african_griot') return { id: 'savanna_baobab', fuzzy: true };
    if (playbook.id === 'americas_indigenous') return { id: 'red_canyon_mesa', fuzzy: true };
    return { id: 'bamboo_forest', fuzzy: true };
  }

  if (norm && STAGE_ALIASES[norm]) return { id: STAGE_ALIASES[norm], fuzzy: true };
  for (const st of STAGE_CATALOG) {
    if (norm && (norm.includes(st.id) || st.id.includes(norm))) {
      return { id: st.id, fuzzy: true };
    }
  }
  for (const [alias, target] of Object.entries(STAGE_ALIASES)) {
    if (norm.split('_').includes(alias)) return { id: target, fuzzy: true };
  }
  return { id: playbook.stages[0] || 'banyan_clearing', fuzzy: true };
}

export function resolveProp(raw: unknown): { id: PropId; fuzzy: boolean } {
  const norm = normalizeToken(raw);
  if (!norm || norm === 'none' || norm === 'null' || norm === 'nothing') {
    return { id: 'none', fuzzy: false };
  }
  if (VALID_PROPS.has(norm as PropId)) return { id: norm as PropId, fuzzy: false };
  if (PROP_ALIASES[norm]) return { id: PROP_ALIASES[norm], fuzzy: true };
  for (const p of PROP_CATALOG) {
    if (p.id !== 'none' && norm.includes(p.id)) return { id: p.id, fuzzy: true };
  }
  for (const [alias, target] of Object.entries(PROP_ALIASES)) {
    if (alias.length >= 3 && norm.split('_').includes(alias)) {
      return { id: target, fuzzy: true };
    }
  }
  return { id: 'none', fuzzy: true };
}

export function resolveExpression(raw: unknown): ExpressionId {
  return normalizeExpressionId(raw);
}

export function resolvePose(raw: unknown, expression: ExpressionId, archetype: ArchetypeId): PoseId {
  const norm = normalizeToken(raw);
  if (POSE_LIST.includes(norm as PoseId)) return norm as PoseId;
  if (/hang|upside/.test(norm)) return 'hang_upside_down';
  if (/fly|soar|float|glide|hover|leap/.test(norm)) return 'soar';
  if (/attack|strike|fight|slash|lunge|charge/.test(norm)) return 'attack';
  if (/kneel|bow|pray|beg|plead/.test(norm)) return 'kneel';
  if (/sit|seat|perch|throne/.test(norm)) return 'sit';
  if (/walk|march|stride|stroll|run|flee/.test(norm)) return 'walk';
  if (/recoil|dodge|cower|stumble|flinch/.test(norm)) return 'recoil';
  if (/point|speak|gestur|explain|present|hold/.test(norm)) return 'gesture';
  if (archetype === 'spirit' && expression === 'sly') return 'soar';
  if (expression === 'shocked') return 'recoil';
  if (expression === 'stern') return 'gesture';
  return 'stand';
}

export function resolveRaag(raw: unknown, playbook: RegionalPlaybook): RaagId {
  const norm = normalizeToken(raw);
  if (VALID_RAAGS.has(norm as RaagId)) return norm as RaagId;
  if (/greek|lyre|aesop|olymp/.test(norm)) return 'greek_lyre';
  if (/lute|harp|medieval|grimm|knight|celtic/.test(norm)) return 'medieval_lute';
  if (/guqin|bamboo|china|japan|east|flute_east|shakuhachi/.test(norm)) return 'guqin_bamboo';
  if (/gamelan|wayang|java|bali|indonesia/.test(norm)) return 'gamelan_wayang';
  if (/cedar|native|indigenous|canyon|america/.test(norm)) return 'cedar_flute';
  if (/kora|griot|africa|anansi|drum/.test(norm)) return 'kora_griot';
  if (/myster|dark|night|ghost/.test(norm)) return 'malkauns';
  if (/happy|play|funny|comedy|wit/.test(norm)) return 'bhoopali';
  if (/royal|epic|grand|war/.test(norm)) return 'darbari';
  return playbook.defaultRaag;
}

export function resolveMood(raw: unknown, playbook: RegionalPlaybook): MoodId {
  const norm = normalizeToken(raw);
  if (VALID_MOODS.has(norm as MoodId)) return norm as MoodId;
  if (/night|dark|midnight|spooky/.test(norm)) return 'midnight_banyan';
  if (/anger|blood|war|wrath|crimson|fire|danger/.test(norm)) return 'crimson_wrath';
  if (/gold|royal|palace|bright|day|sun/.test(norm)) return 'golden_durbar';
  if (/dusk|desert|sand|sunset|canyon/.test(norm)) return 'sandstone_dusk';
  if (/temple|twilight|violet|sacred/.test(norm)) return 'twilight_temple';
  if (/moon|silver|calm|sleep|snow/.test(norm)) return 'moonlit_marble';
  if (/jungle|forest|green|nature/.test(norm)) return 'emerald_jungle';
  if (/water|lake|mystic|ocean|river/.test(norm)) return 'mystic_teal';
  return playbook.defaultMood;
}

export function resolveSfx(raw: unknown): SfxId {
  const norm = normalizeToken(raw);
  if (!norm || norm === 'none') return 'none';
  if (VALID_SFX.has(norm as SfxId)) return norm as SfxId;
  if (/bell|chime_temple|gong/.test(norm)) return 'temple_bell';
  if (/conch|horn|trumpet/.test(norm)) return 'shankha_conch';
  if (/sword|clash|blade|metal|fight/.test(norm)) return 'sword_clash';
  if (/thunder|lightning|storm|boom/.test(norm)) return 'thunder_crack';
  if (/whoosh|arrow|wind|swoop|jump|fly/.test(norm)) return 'arrow_whoosh';
  if (/magic|mystic|sparkle|chime|reveal|boon/.test(norm)) return 'mystic_chime';
  if (/gasp|shock|crowd|drum|dramatic/.test(norm)) return 'court_gasp';
  if (/gavel|verdict|knock|hammer/.test(norm)) return 'wooden_gavel';
  if (/fire|flame|crackle|burn/.test(norm)) return 'fire_crackle';
  return 'none';
}

export function resolveRenderStyle(raw: unknown, fallback: RenderStyleId): RenderStyleId {
  const norm = normalizeToken(raw);
  if (VALID_RENDER_STYLES.has(norm as RenderStyleId)) return norm as RenderStyleId;
  if (/anime|sakuga|cel|ghibli/.test(norm)) return 'anime_cel';
  if (/manga|screentone|comic|gpen/.test(norm)) return 'manga_screentone';
  if (/blueprint|technical|cyanotype|schematic|patent|diagram|explainer/.test(norm)) return 'blueprint_technical';
  if (/gouache|matte|editorial|painterly/.test(norm)) return 'gouache_storybook';
  if (/cyber|neon|synthwave|scifi|cybernoir/.test(norm)) return 'neon_cybernoir';
  if (/felt|applique|stitch|plush|wool/.test(norm)) return 'felt_puppet';
  if (/riso|risograph|halftone|ben_day|poster/.test(norm)) return 'risograph_print';
  if (/sand|lightbox|desert_art/.test(norm)) return 'backlit_sand';
  if (/scratch|scratchboard|engrav|etch|noir_cut/.test(norm)) return 'scratchboard_noir';
  if (/mosaic|byzantine|tessera|nouveau/.test(norm)) return 'byzantine_mosaic';
  if (/shadow|wayang|puppet/.test(norm)) return 'shadow_puppetry';
  if (/vector|flat|storybook|clean/.test(norm)) return 'lineless_vector';
  if (/wood|block|print|ukiyo|linocut/.test(norm)) return 'woodblock_print';
  if (/glass|stained/.test(norm)) return 'stained_glass';
  if (/paper|diorama|cutout/.test(norm)) return 'papercraft_diorama';
  if (/sumi|ink|wash|watercolor|brush/.test(norm)) return 'sumi_e_wash';
  if (/greek|amphora|pottery|vase|attic/.test(norm)) return 'greek_amphora';
  if (/kente|tapestry|woven|textile|africa/.test(norm)) return 'kente_tapestry';
  if (/codex|illuminat|manuscript|medieval/.test(norm)) return 'illuminated_codex';
  return fallback;
}

// =========================================================================
// STORY-TO-STAGE READINESS ANALYZER (Zero-Latency Pre-Flight Guidance)
// =========================================================================

export interface StoryReadinessReport {
  playbook: RegionalPlaybook;
  matchedArchetypes: ArchetypeId[];
  matchedStages: StageId[];
  matchedProps: PropId[];
  matchedBibleNames: string[];
  standInTips: string[];
}

const STAND_IN_HINTS: Array<{ pattern: RegExp; tip: string }> = [
  { pattern: /\b(odysseus|achilles|hercules|perseus|arthur|thor|loki)\b/i, tip: 'Mythic hero -> use archetype "knight" (or "warrior") + headgear "battle_helm"' },
  { pattern: /\b(zeus|odin|poseidon|apollo|nyame)\b/i, tip: 'Sky/chief god -> use archetype "deva" + mark "divine_halo"' },
  { pattern: /\b(athena|hera|freya|aphrodite|fairy)\b/i, tip: 'Goddess/fairy -> use archetype "goddess" + headgear "golden_mukut"' },
  { pattern: /\b(aladdin|sinbad|ali baba)\b/i, tip: 'Arabian folk hero -> use "merchant" + headgear "royal_turban" + prop "diya_lamp" on "bazaar_lane" / "desert_caravan"' },
  { pattern: /\b(dragon|hydra|wyrm|quetzalcoatl)\b/i, tip: 'Dragon/serpent -> use archetype "serpent" at scale 1.2 + weather "embers"' },
  { pattern: /\b(witch|sorcerer|wizard|merlin)\b/i, tip: 'Sorcerer/witch -> use archetype "ascetic" or "sage" + prop "magic_staff"' },
  { pattern: /\b(cheese|grapes|bread|pie|feast)\b/i, tip: 'Story food object -> use prop "saffron_feast" or "magic_peach" (or upload a Custom Cutout Prop in Assets)' },
];

export function analyzeStoryReadiness(
  storyText: string,
  playbookOverride: PlaybookId | 'auto' = 'auto',
  bible: CastBibleEntry[] = []
): StoryReadinessReport {
  const playbook =
    playbookOverride === 'auto' ? detectPlaybookFromText(storyText) : getPlaybookById(playbookOverride);
  const lower = storyText.toLowerCase();

  const archSet = new Set<ArchetypeId>();
  const stageSet = new Set<StageId>();
  const propSet = new Set<PropId>();

  for (const a of ARCHETYPE_CATALOG) {
    if (lower.includes(a.id.replace(/_/g, ' ')) || lower.includes(a.id)) archSet.add(a.id);
  }
  for (const [alias, id] of Object.entries(ARCHETYPE_ALIASES)) {
    const word = alias.replace(/_/g, ' ');
    if (word.length >= 3 && new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lower)) {
      archSet.add(id);
    }
  }
  for (const s of STAGE_CATALOG) {
    if (lower.includes(s.id.replace(/_/g, ' '))) stageSet.add(s.id);
  }
  for (const [alias] of Object.entries(STAGE_ALIASES)) {
    const word = alias.replace(/_/g, ' ');
    if (word.length >= 3 && new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lower)) {
      stageSet.add(resolveStage(alias, playbook).id);
    }
  }
  if (stageSet.size === 0 && playbook.stages.length > 0) {
    stageSet.add(playbook.stages[0]);
  }
  for (const p of PROP_CATALOG) {
    if (p.id !== 'none' && lower.includes(p.id.replace(/_/g, ' '))) propSet.add(p.id);
  }
  for (const [alias, id] of Object.entries(PROP_ALIASES)) {
    const word = alias.replace(/_/g, ' ');
    if (word.length >= 3 && new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lower)) {
      propSet.add(id);
    }
  }

  const matchedBibleNames = bible
    .filter((entry) => {
      const nameLower = entry.member.name.toLowerCase();
      const keyLower = entry.key.toLowerCase();
      const words = keyLower.split(/\s+/).filter((w) => w.length >= 4 && w !== 'king' && w !== 'host');
      return (
        lower.includes(nameLower) ||
        lower.includes(keyLower) ||
        words.some((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lower))
      );
    })
    .map((e) => e.member.name);

  const standInTips = STAND_IN_HINTS.filter((h) => h.pattern.test(storyText)).map((h) => h.tip);

  return {
    playbook,
    matchedArchetypes: Array.from(archSet).slice(0, 6),
    matchedStages: Array.from(stageSet).slice(0, 4),
    matchedProps: Array.from(propSet).slice(0, 5),
    matchedBibleNames,
    standInTips: standInTips.slice(0, 3),
  };
}

// =========================================================================
// RESILIENT JSON HEALER (Handles Thinking Tags, Markdown, Trailing Commas & Truncation)
// =========================================================================

export function healAndParseLlmJson(rawText: string): {
  ok: true;
  data: unknown;
  healedNotes: string[];
} | {
  ok: false;
  error: string;
} {
  const healedNotes: string[] = [];
  let text = String(rawText ?? '').trim();
  if (!text) return { ok: false, error: 'LLM returned an empty response.' };

  // 1. Strip <think>...</think> blocks from reasoning models (DeepSeek-R1, QwQ, etc.)
  if (/<think>[\s\S]*?<\/think>/i.test(text)) {
    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    healedNotes.push('stripped reasoning tags');
  }

  // 2. Strip markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    text = fenceMatch[1].trim();
    healedNotes.push('extracted fenced JSON');
  }

  // 3. Slice from first '{' to last '}' (or end if truncated)
  const firstBrace = text.indexOf('{');
  if (firstBrace === -1) {
    return { ok: false, error: 'No JSON object "{" found in LLM output.' };
  }
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace > 0 || (lastBrace !== -1 && lastBrace < text.length - 1)) {
    text = lastBrace > firstBrace ? text.slice(firstBrace, lastBrace + 1) : text.slice(firstBrace);
    healedNotes.push('trimmed surrounding prose');
  }

  // Fast-path clean JSON
  try {
    return { ok: true, data: JSON.parse(text), healedNotes };
  } catch {
    // Continue to surgical healing
  }

  // 4. Remove JS comments outside strings & fix unescaped newlines inside strings
  let sanitized = '';
  let inString = false;
  let escapeNext = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escapeNext) {
        sanitized += ch;
        escapeNext = false;
      } else if (ch === '\\') {
        sanitized += ch;
        escapeNext = true;
      } else if (ch === '"') {
        sanitized += ch;
        inString = false;
      } else if (ch === '\n' || ch === '\r') {
        sanitized += ' ';
      } else {
        sanitized += ch;
      }
    } else {
      if (ch === '"') {
        inString = true;
        sanitized += ch;
      } else if (ch === '/' && text[i + 1] === '/') {
        while (i < text.length && text[i] !== '\n') i++;
      } else if (ch === '“' || ch === '”') {
        inString = !inString;
        sanitized += '"';
      } else {
        sanitized += ch;
      }
    }
  }

  // 5. Remove trailing commas before } or ]
  const noTrailing = sanitized.replace(/,\s*([}\]])/g, '$1');
  if (noTrailing !== text) healedNotes.push('repaired commas/newlines');

  try {
    return { ok: true, data: JSON.parse(noTrailing), healedNotes };
  } catch {
    // 6. Attempt truncation recovery: trim back to last complete '}' and balance open brackets/braces
    let candidate = noTrailing;
    for (let attempt = 0; attempt < 6; attempt++) {
      const cut = candidate.lastIndexOf('}');
      if (cut <= 0) break;
      const prefix = candidate.slice(0, cut + 1).replace(/,\s*$/, '');
      const stack: string[] = [];
      let str = false;
      let esc = false;
      for (let i = 0; i < prefix.length; i++) {
        const c = prefix[i];
        if (str) {
          if (esc) esc = false;
          else if (c === '\\') esc = true;
          else if (c === '"') str = false;
        } else {
          if (c === '"') str = true;
          else if (c === '{') stack.push('}');
          else if (c === '[') stack.push(']');
          else if ((c === '}' || c === ']') && stack.length > 0) stack.pop();
        }
      }
      const closed = prefix + stack.reverse().join('');
      try {
        const parsed = JSON.parse(closed);
        healedNotes.push('recovered truncated ending');
        return { ok: true, data: parsed, healedNotes };
      } catch {
        candidate = candidate.slice(0, cut);
      }
    }
    return { ok: false, error: 'Malformed JSON could not be auto-repaired.' };
  }
}

// =========================================================================
// DETERMINISTIC AUTO-DIRECTOR (Compiles Lite OR Full JSON -> Broadcast Episode)
// =========================================================================

const DISTINCT_PALETTES: Array<{ primary: string; accent: string }> = [
  { primary: '#c83e37', accent: '#f2c85b' },
  { primary: '#2d6a8e', accent: '#f4d35e' },
  { primary: '#3d7a5a', accent: '#e8b954' },
  { primary: '#7a4488', accent: '#f6d186' },
  { primary: '#b5652a', accent: '#f0e2c2' },
  { primary: '#394b75', accent: '#e59866' },
];

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function isValidHex(c: unknown): c is string {
  return typeof c === 'string' && HEX_COLOR_RE.test(c.trim());
}

function estimateSpokenDuration(dialogue: string, frame: FrameMode): number {
  return estimateMultilingualDuration(dialogue, frame);
}

function inferSfxFromBeat(dialogue: string, expression: ExpressionId, frame: FrameMode, prop: PropId): SfxId {
  const lower = dialogue.toLowerCase();
  if (frame === 'chapter_title') return 'temple_bell';
  if (frame === 'moral_card') return 'mystic_chime';
  if (/thunder|storm|lightning|curse/.test(lower)) return 'thunder_crack';
  if (/sword|blade|strike|battle|clash|fight/.test(lower) || prop === 'khanda_sword' || prop === 'kris_dagger') {
    return 'sword_clash';
  }
  if (/arrow|leap|flew|soar|swift|whoosh/.test(lower)) return 'arrow_whoosh';
  if (/fire|flame|burn|blaze/.test(lower) || prop === 'sacred_fire') return 'fire_crackle';
  if (/verdict|guilty|decree|judge|court|proclaim/.test(lower)) return 'wooden_gavel';
  if (/conch|army|march|war|victory/.test(lower) || prop === 'conch_shell') return 'shankha_conch';
  if (/magic|boon|glow|shimmer|miracle|secret|reveal|trick/.test(lower)) return 'mystic_chime';
  if (expression === 'shocked') return 'court_gasp';
  return 'none';
}

function inferFxFromBeat(expression: ExpressionId, dialogue: string, archetype?: ArchetypeId): FxId {
  const lower = dialogue.toLowerCase();
  if (archetype === 'deva' || archetype === 'goddess' || /divine|blessing|radiant|celestial/.test(lower)) {
    return 'divine_aura';
  }
  if (expression === 'shocked' || /what!|impossible|betrayed|trap/.test(lower)) return 'shock_burst';
  if (/\?/.test(dialogue) && /riddle|why|who|how|which/.test(lower)) return 'question_mark';
  if (/strike|smash|crash|clash|wrath/.test(lower)) return 'crimson_impact';
  return 'none';
}

export interface CompileDirectorOptions {
  playbookOverride?: PlaybookId | 'auto';
  preferredRenderStyle?: RenderStyleId;
  storyHint?: string;
  castBible?: CastBibleEntry[];
  ensureBookends?: boolean;
  targetLanguage?: LanguageCode;
}

export function compileLiteOrFullToEpisode(
  raw: unknown,
  options: CompileDirectorOptions = {}
): { ok: true; script: EpisodeScript; autoFixes: string[] } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Root JSON must be an object.' };
  }
  const obj = raw as Record<string, unknown>;
  const autoFixes: string[] = [];

  // Determine playbook from region field, title/series, or story hint
  const regionHintText = [
    typeof obj.region === 'string' ? obj.region : '',
    typeof obj.series === 'string' ? obj.series : '',
    typeof obj.title === 'string' ? obj.title : '',
    typeof obj.shelf === 'string' ? obj.shelf : '',
    options.storyHint || '',
  ].join(' ');

  let playbook: RegionalPlaybook;
  if (options.playbookOverride && options.playbookOverride !== 'auto') {
    playbook = getPlaybookById(options.playbookOverride);
  } else if (typeof obj.region === 'string' && REGIONAL_PLAYBOOKS.some((p) => p.id === obj.region)) {
    playbook = getPlaybookById(obj.region as PlaybookId);
  } else {
    playbook = detectPlaybookFromText(regionHintText);
  }

  // Support alternate beat array names weak LLMs sometimes invent ("scenes", "storyboard")
  const rawBeats = Array.isArray(obj.beats)
    ? obj.beats
    : Array.isArray(obj.scenes)
      ? obj.scenes
      : Array.isArray(obj.storyboard)
        ? obj.storyboard
        : [];
  if (rawBeats.length === 0) {
    return { ok: false, error: 'Episode JSON must contain a non-empty "beats" (or "scenes") array.' };
  }
  if (!Array.isArray(obj.beats)) autoFixes.push('mapped scenes -> beats');

  // Support alternate cast array names ("characters", "cast")
  const rawCast = Array.isArray(obj.cast)
    ? obj.cast
    : Array.isArray(obj.characters)
      ? obj.characters
      : [];

  let fuzzyAssetCount = 0;
  const cast: CastMember[] = [];
  const usedArchetypeColors = new Set<string>();

  const registerCastMember = (item: Record<string, unknown>, idx: number): CastMember => {
    const rawName =
      typeof item.name === 'string' && item.name.trim()
        ? item.name.trim()
        : typeof item.id === 'string' && item.id.trim()
          ? item.id.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
          : `Character ${idx + 1}`;
    const rawId =
      typeof item.id === 'string' && item.id.trim()
        ? normalizeToken(item.id)
        : normalizeToken(rawName) || `char_${idx + 1}`;
    const resolvedArch = resolveArchetype(item.archetype ?? item.role ?? item.type, rawName, playbook);
    if (resolvedArch.fuzzy && item.archetype) fuzzyAssetCount++;

    const defaults = ARCHETYPE_DEFAULT_COLORS[resolvedArch.id];
    let primaryColor = isValidHex(item.primaryColor) ? item.primaryColor.trim() : defaults.primary;
    let accentColor = isValidHex(item.accentColor) ? item.accentColor.trim() : defaults.accent;
    const skinColor = isValidHex(item.skinColor) ? item.skinColor.trim() : defaults.skin;

    // Ensure visual distinctness when two cast members share an archetype & color
    const colorKey = `${resolvedArch.id}:${primaryColor.toLowerCase()}`;
    let scale = Number(item.scale);
    if (!Number.isFinite(scale) || scale <= 0) scale = 1.0;
    if (usedArchetypeColors.has(colorKey)) {
      const alt = DISTINCT_PALETTES[idx % DISTINCT_PALETTES.length];
      primaryColor = alt.primary;
      accentColor = alt.accent;
      scale = idx % 2 === 0 ? 0.94 : 1.06;
      autoFixes.push(`differentiated look for ${rawName}`);
    }
    usedArchetypeColors.add(`${resolvedArch.id}:${primaryColor.toLowerCase()}`);

    let member: CastMember = {
      id: rawId,
      name: rawName,
      archetype: resolvedArch.id,
      primaryColor,
      accentColor,
      skinColor,
      mark: typeof item.mark === 'string' ? (item.mark as CastMarkId) : undefined,
      headgear: typeof item.headgear === 'string' ? (item.headgear as CastHeadgearId) : undefined,
      scale: Math.max(0.82, Math.min(1.25, scale)),
    };

    // Parse explicit AI modular DNA or natural-language trait recipe (`dna` or `traits`),
    // otherwise auto-synthesize a bespoke deterministic DNA genome so AI episodes look non-template!
    const rawDnaInput =
      item.dna && typeof item.dna === 'object'
        ? item.dna
        : typeof item.traits === 'string' && item.traits.trim()
          ? { traits: item.traits.trim() }
          : null;

    const synthesizedDna = rawDnaInput
      ? validateAndNormalizeDna(rawDnaInput, member) || hydrateArchetypeToDna(member, `${rawName}_${idx}`)
      : hydrateArchetypeToDna(member, `${String(obj.title || 'ep')}_${rawName}_${idx}`);

    member = syncMemberWithDna(member, synthesizedDna);
    cast.push(member);
    return member;
  };

  rawCast.forEach((entry, idx) => {
    if (entry && typeof entry === 'object') {
      registerCastMember(entry as Record<string, unknown>, idx);
    } else if (typeof entry === 'string' && entry.trim()) {
      registerCastMember({ id: entry, name: entry, role: entry }, idx);
    }
  });

  const findOrCreateCastId = (rawRef: unknown): string => {
    const rawStr = String(rawRef ?? '').trim();
    const norm = normalizeToken(rawStr);
    if (!norm) return cast[0]?.id || 'hero_1';
    const exact = cast.find((c) => c.id === rawStr || c.id === norm);
    if (exact) return exact.id;
    const byName = cast.find(
      (c) => normalizeToken(c.name) === norm || c.name.toLowerCase().includes(rawStr.toLowerCase())
    );
    if (byName) return byName.id;
    // Auto-synthesize undeclared actor!
    const created = registerCastMember({ id: norm, name: rawStr, role: rawStr }, cast.length);
    autoFixes.push(`auto-cast "${created.name}" as ${created.archetype}`);
    return created.id;
  };

  // If LLM completely omitted cast[], seed one from playbook so compilation never crashes
  if (cast.length === 0) {
    registerCastMember({ id: 'hero', name: 'Storyteller', archetype: playbook.archetypes[0] }, 0);
    autoFixes.push('auto-created starter cast');
  }

  const rawStyleObjEarly = (obj.visualStyle && typeof obj.visualStyle === 'object'
    ? obj.visualStyle
    : {}) as Record<string, unknown>;
  const chosenRenderStyle = options.preferredRenderStyle
    ? options.preferredRenderStyle
    : rawStyleObjEarly.renderStyle || obj.renderStyle || obj.artStyle || obj.style
      ? resolveRenderStyle(
          rawStyleObjEarly.renderStyle ?? obj.renderStyle ?? obj.artStyle ?? obj.style,
          playbook.renderStyle
        )
      : playbook.renderStyle;

  let lastSfxBeatIdx = -3;
  let lastShot: ShotId = 'wide_stage';
  let blockingFixCount = 0;
  let dialogueCleanCount = 0;
  let autoActionCueCount = 0;
  let autoMotionCardCount = 0;

  const beats: StoryBeat[] = rawBeats.map((bRaw: unknown, idx: number) => {
    const b = (bRaw && typeof bRaw === 'object' ? bRaw : {}) as Record<string, unknown>;
    const isFirst = idx === 0;
    const isLast = idx === rawBeats.length - 1;
    const isClimax = rawBeats.length >= 5 && idx === Math.floor(rawBeats.length * 0.72);

    const rawDialogueText =
      typeof b.dialogue === 'string'
        ? b.dialogue.trim()
        : typeof b.line === 'string'
          ? b.line.trim()
          : typeof b.narration === 'string'
            ? b.narration.trim()
            : '';

    // Resolve speakerId cleanly (accepts castId, character name, or narrator)
    const rawSpeaker = b.speakerId ?? b.speaker ?? 'narrator';
    const rawSpeakerNorm = normalizeToken(rawSpeaker);
    let speakerId = 'narrator';
    let speakerLabel = typeof b.speakerLabel === 'string' && b.speakerLabel.trim() ? b.speakerLabel.trim() : 'Narrator';
    if (rawSpeakerNorm && rawSpeakerNorm !== 'narrator' && rawSpeakerNorm !== 'voiceover') {
      const resolvedId = findOrCreateCastId(rawSpeaker);
      speakerId = resolvedId;
      const member = cast.find((c) => c.id === resolvedId);
      if (member && (!b.speakerLabel || speakerLabel === 'Narrator')) {
        speakerLabel = member.name;
      }
    }

    // Strip leaked "Speaker:" prefixes and (stage cues) while promoting cues to real acting!
    const sanitized = sanitizeDialogueAndExtractActing(rawDialogueText, speakerLabel);
    if (sanitized.cleaned) dialogueCleanCount++;
    const dialogue = sanitized.dialogue;

    const rawFrame = normalizeToken(b.frame);
    let frame: FrameMode = VALID_FRAMES.has(rawFrame as FrameMode) ? (rawFrame as FrameMode) : 'main';
    if (!b.frame && isLast && /moral|lesson|wisdom|never|always|true/i.test(dialogue)) {
      frame = 'moral_card';
    }

    const stageRes = resolveStage(b.stage ?? b.setting ?? b.location, playbook);
    if (stageRes.fuzzy && (b.stage || b.setting || b.location)) fuzzyAssetCount++;

    const propRes = resolveProp(b.prop ?? b.object);
    if (propRes.fuzzy && (b.prop || b.object) && propRes.id !== 'none') fuzzyAssetCount++;

    const beatEmotion =
      sanitized.extractedExpression || resolveExpression(b.emotion ?? b.expression ?? 'calm');

    // Optional per-character base expression map for Lite beats: { "vikram": "curious", "betaal": "sly" }
    const actorExprMap = new Map<string, ExpressionId>();
    if (b.actorExpressions && typeof b.actorExpressions === 'object' && !Array.isArray(b.actorExpressions)) {
      for (const [rawCid, rawExpr] of Object.entries(b.actorExpressions as Record<string, unknown>)) {
        const resolvedCid = findOrCreateCastId(rawCid);
        actorExprMap.set(resolvedCid, resolveExpression(rawExpr));
      }
    }

    const parseExpressionTrack = (rawTrack: unknown): ExpressionKeyframe[] | undefined => {
      if (!Array.isArray(rawTrack)) return undefined;
      const out: ExpressionKeyframe[] = [];
      for (const item of rawTrack) {
        if (!item || typeof item !== 'object') continue;
        const ko = item as Record<string, unknown>;
        const kf: ExpressionKeyframe = {
          expression: resolveExpression(ko.expression ?? ko.emotion),
        };
        if (Array.isArray(ko.frameRange) && ko.frameRange.length >= 2) {
          if (Number.isFinite(Number(ko.frameRange[0]))) kf.frame = Math.max(0, Math.round(Number(ko.frameRange[0])));
          if (Number.isFinite(Number(ko.frameRange[1]))) kf.endFrame = Math.max(1, Math.round(Number(ko.frameRange[1])));
        }
        if (ko.frame !== undefined && Number.isFinite(Number(ko.frame))) {
          kf.frame = Math.max(0, Math.round(Number(ko.frame)));
        }
        if (ko.endFrame !== undefined && Number.isFinite(Number(ko.endFrame))) {
          kf.endFrame = Math.max(1, Math.round(Number(ko.endFrame)));
        }
        if (ko.timeSec !== undefined && Number.isFinite(Number(ko.timeSec))) {
          kf.timeSec = Math.max(0, Number(ko.timeSec));
        }
        if (ko.at !== undefined && Number.isFinite(Number(ko.at))) {
          kf.at = Math.max(0, Math.min(1, Number(ko.at)));
        }
        if (typeof ko.triggerPhrase === 'string' && ko.triggerPhrase.trim()) {
          kf.triggerPhrase = ko.triggerPhrase.trim().slice(0, 80);
        }
        if (typeof ko.reason === 'string' && ko.reason.trim()) {
          kf.reason = ko.reason.trim().slice(0, 120);
        }
        if (kf.frame === undefined && kf.timeSec === undefined && kf.at === undefined && !kf.triggerPhrase) {
          kf.frame = 0;
        }
        out.push(kf);
      }
      return out.length > 0 ? out : undefined;
    };

    const parsedExpressionCues: BeatExpressionCue[] | undefined = Array.isArray(b.expressionCues)
      ? b.expressionCues
          .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
          .map((co) => {
            const cue: BeatExpressionCue = {
              castId: findOrCreateCastId(co.castId ?? co.actor ?? co.character ?? co.id ?? cast[0].id),
              expression: resolveExpression(co.expression ?? co.emotion),
            };
            if (Array.isArray(co.frameRange) && co.frameRange.length >= 2) {
              if (Number.isFinite(Number(co.frameRange[0]))) cue.frame = Math.max(0, Math.round(Number(co.frameRange[0])));
              if (Number.isFinite(Number(co.frameRange[1]))) cue.endFrame = Math.max(1, Math.round(Number(co.frameRange[1])));
            }
            if (co.frame !== undefined && Number.isFinite(Number(co.frame))) {
              cue.frame = Math.max(0, Math.round(Number(co.frame)));
            }
            if (co.endFrame !== undefined && Number.isFinite(Number(co.endFrame))) {
              cue.endFrame = Math.max(1, Math.round(Number(co.endFrame)));
            }
            if (co.timeSec !== undefined && Number.isFinite(Number(co.timeSec))) {
              cue.timeSec = Math.max(0, Number(co.timeSec));
            }
            if (co.at !== undefined && Number.isFinite(Number(co.at))) {
              cue.at = Math.max(0, Math.min(1, Number(co.at)));
            }
            if (typeof co.triggerPhrase === 'string' && co.triggerPhrase.trim()) {
              cue.triggerPhrase = co.triggerPhrase.trim().slice(0, 80);
            }
            if (typeof co.reason === 'string' && co.reason.trim()) {
              cue.reason = co.reason.trim().slice(0, 120);
            }
            if (cue.frame === undefined && cue.timeSec === undefined && cue.at === undefined && !cue.triggerPhrase) {
              cue.frame = 0;
            }
            return cue;
          })
      : undefined;

    const parsedActionCues: BeatActionCue[] | undefined = Array.isArray(b.actionCues)
      ? b.actionCues
          .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
          .map((co): BeatActionCue | null => {
            const cue: BeatActionCue = {};
            if (co.frame !== undefined && Number.isFinite(Number(co.frame))) {
              cue.frame = Math.max(0, Math.round(Number(co.frame)));
            } else if (co.timeSec !== undefined && Number.isFinite(Number(co.timeSec))) {
              cue.timeSec = Math.max(0, Number(co.timeSec));
            } else if (co.at !== undefined && Number.isFinite(Number(co.at))) {
              cue.at = Math.max(0, Math.min(1, Number(co.at)));
            }
            if (co.endFrame !== undefined && Number.isFinite(Number(co.endFrame))) {
              cue.endFrame = Math.max(0, Math.round(Number(co.endFrame)));
            }
            if (typeof co.triggerPhrase === 'string' && co.triggerPhrase.trim()) {
              cue.triggerPhrase = co.triggerPhrase.trim().slice(0, 80);
            }
            if (co.castId ?? co.actor ?? co.character) {
              cue.castId = findOrCreateCastId(co.castId ?? co.actor ?? co.character);
            }
            if (POSE_LIST.includes(co.pose as PoseId)) {
              cue.pose = co.pose as PoseId;
            }
            if (MOTION_LIST.includes(co.motion as MotionId)) {
              cue.motion = co.motion as MotionId;
            }
            if (co.cameraPunch !== undefined && Number.isFinite(Number(co.cameraPunch))) {
              const punch = Math.max(0, Math.min(1, Number(co.cameraPunch)));
              if (punch > 0) cue.cameraPunch = Number(punch.toFixed(2));
            }
            if (co.propPulse !== undefined && Number.isFinite(Number(co.propPulse))) {
              const pulse = Math.max(0, Math.min(1, Number(co.propPulse)));
              if (pulse > 0) cue.propPulse = Number(pulse.toFixed(2));
            }
            if (FX_LIST.includes(co.fx as FxId) && co.fx !== 'none') {
              cue.fx = co.fx as FxId;
            }
            if (co.sfx) {
              const rsfx = resolveSfx(co.sfx);
              if (rsfx !== 'none') cue.sfx = rsfx;
            }
            if (typeof co.label === 'string' && co.label.trim()) {
              cue.label = co.label.trim().slice(0, 60);
            }
            const hasAction = Boolean(
              cue.pose || cue.motion || cue.cameraPunch || cue.propPulse || cue.fx || cue.sfx
            );
            return hasAction ? cue : null;
          })
          .filter((x): x is BeatActionCue => x !== null)
      : undefined;

    const parseMotionCard = (rawMc: unknown): MotionCardConfig | undefined => {
      if (!rawMc || typeof rawMc !== 'object') return undefined;
      const mo = rawMc as Record<string, unknown>;
      const validLayouts: MotionCardLayoutId[] = ['hero_stat', 'split_callout', 'morph_bar'];
      const mc: MotionCardConfig = {};
      if (validLayouts.includes(mo.layout as MotionCardLayoutId)) {
        mc.layout = mo.layout as MotionCardLayoutId;
      }
      if (typeof mo.kicker === 'string' && mo.kicker.trim()) mc.kicker = mo.kicker.trim().slice(0, 48);
      if (typeof mo.headline === 'string' && mo.headline.trim()) mc.headline = mo.headline.trim().slice(0, 96);
      if (typeof mo.metric === 'string' && mo.metric.trim()) mc.metric = mo.metric.trim().slice(0, 32);
      if (typeof mo.metricUnit === 'string' && mo.metricUnit.trim()) mc.metricUnit = mo.metricUnit.trim().slice(0, 40);
      if (Array.isArray(mo.bullets)) {
        const bullets = mo.bullets
          .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
          .map((x) => x.trim().slice(0, 72))
          .slice(0, 4);
        if (bullets.length > 0) mc.bullets = bullets;
      }
      if (typeof mo.highlightBar === 'string' && mo.highlightBar.trim()) {
        mc.highlightBar = mo.highlightBar.trim().slice(0, 72);
      }
      if (isValidHex(mo.accentColor)) {
        mc.accentColor = mo.accentColor.trim();
      }
      return Object.keys(mc).length > 0 ? mc : undefined;
    };

    let motionCard = parseMotionCard(b.motionCard);

    // Parse actors (supports full ActorPlacement objects OR compact strings ["fox", "crow"] OR b.who)
    const rawActorsInput = Array.isArray(b.actors)
      ? b.actors
      : Array.isArray(b.who)
        ? b.who
        : typeof b.who === 'string'
          ? b.who.split(',').map((s) => s.trim()).filter(Boolean)
          : [];

    const parsedActors: ActorPlacement[] = [];
    for (const aItem of rawActorsInput) {
      if (typeof aItem === 'string' && aItem.trim()) {
        const cid = findOrCreateCastId(aItem);
        const member = cast.find((c) => c.id === cid);
        const expr = actorExprMap.get(cid) ?? (cid === speakerId ? beatEmotion : 'calm');
        parsedActors.push({
          castId: cid,
          slot: 'left',
          pose: resolvePose(undefined, expr, member?.archetype || 'merchant'),
          expression: expr,
          facing: 'right',
          motion: 'still',
        });
      } else if (aItem && typeof aItem === 'object') {
        const ao = aItem as Record<string, unknown>;
        const cid = findOrCreateCastId(ao.castId ?? ao.id ?? ao.name ?? cast[0].id);
        const member = cast.find((c) => c.id === cid);
        const expr =
          ao.expression !== undefined || ao.emotion !== undefined
            ? resolveExpression(ao.expression ?? ao.emotion)
            : actorExprMap.get(cid) ?? (cid === speakerId ? beatEmotion : 'calm');
        const pose = resolvePose(ao.pose, expr, member?.archetype || 'merchant');
        const slotVal = ['left', 'center', 'right', 'overhead'].includes(String(ao.slot))
          ? (ao.slot as ActorPlacement['slot'])
          : 'left';
        const motionVal = MOTION_LIST.includes(ao.motion as MotionId) ? (ao.motion as MotionId) : 'still';
        const expressionTrack = parseExpressionTrack(ao.expressionTrack);
        parsedActors.push({
          castId: cid,
          slot: slotVal,
          pose,
          expression: expr,
          facing: ao.facing === 'left' ? 'left' : 'right',
          motion: motionVal,
          ...(expressionTrack ? { expressionTrack } : {}),
        });
      }
    }

    // Ensure speaker (if not narrator) is actually on stage
    if (speakerId !== 'narrator' && !parsedActors.some((a) => a.castId === speakerId)) {
      const member = cast.find((c) => c.id === speakerId);
      parsedActors.unshift({
        castId: speakerId,
        slot: 'left',
        pose: resolvePose(undefined, beatEmotion, member?.archetype || 'merchant'),
        expression: beatEmotion,
        facing: 'right',
        motion: 'still',
      });
    }
    if (parsedActors.length === 0) {
      parsedActors.push({
        castId: cast[0].id,
        slot: 'center',
        pose: 'stand',
        expression: beatEmotion,
        facing: 'right',
        motion: 'still',
      });
    }

    // Deduplicate same castId & enforce collision-free blocking + eye-line facing
    const uniqueActors: ActorPlacement[] = [];
    const seenCast = new Set<string>();
    for (const a of parsedActors) {
      if (!seenCast.has(a.castId)) {
        seenCast.add(a.castId);
        uniqueActors.push(a);
      }
    }

    const usedSlots = new Set<string>();
    const hasCollision = uniqueActors.some((a) => {
      if (usedSlots.has(a.slot)) return true;
      usedSlots.add(a.slot);
      return false;
    });

    if (hasCollision || rawActorsInput.every((x) => typeof x === 'string')) {
      if (uniqueActors.length === 1) {
        const only = uniqueActors[0];
        const arch = cast.find((c) => c.id === only.castId)?.archetype;
        only.slot = arch === 'spirit' || arch === 'raven' ? 'overhead' : 'center';
        only.facing = 'right';
      } else if (uniqueActors.length === 2) {
        uniqueActors[0].slot = 'left';
        uniqueActors[0].facing = 'right';
        const arch1 = cast.find((c) => c.id === uniqueActors[1].castId)?.archetype;
        uniqueActors[1].slot = arch1 === 'spirit' ? 'overhead' : 'right';
        uniqueActors[1].facing = 'left';
      } else {
        const order: ActorPlacement['slot'][] = ['left', 'right', 'center', 'overhead'];
        uniqueActors.forEach((a, ai) => {
          a.slot = order[Math.min(ai, order.length - 1)];
          a.facing = a.slot === 'right' ? 'left' : 'right';
        });
      }
      if (hasCollision) blockingFixCount++;
    } else if (uniqueActors.length === 2) {
      // Fix backs-turned eye-lines
      const leftA = uniqueActors.find((a) => a.slot === 'left');
      const rightA = uniqueActors.find((a) => a.slot === 'right');
      if (leftA && rightA) {
        if (leftA.facing !== 'right') {
          leftA.facing = 'right';
          blockingFixCount++;
        }
        if (rightA.facing !== 'left') {
          rightA.facing = 'left';
          blockingFixCount++;
        }
      }
    }

    // Context-aware shot selection (prevents flat wide_stage monotony)
    let shot: ShotId;
    if (VALID_SHOTS.has(b.shot as ShotId)) {
      shot = b.shot as ShotId;
    } else if (frame === 'chapter_title' || frame === 'moral_card' || isFirst) {
      shot = 'wide_stage';
    } else if (isClimax && uniqueActors.length >= 2) {
      shot = 'split_faceoff';
    } else if (propRes.id !== 'none' && speakerId === 'narrator' && lastShot !== 'prop_spotlight') {
      shot = 'prop_spotlight';
    } else {
      const speakerActor = uniqueActors.find((a) => a.castId === speakerId);
      if (speakerActor?.slot === 'left' && lastShot !== 'closeup_left') {
        shot = 'closeup_left';
      } else if (speakerActor?.slot === 'right' && lastShot !== 'closeup_right') {
        shot = 'closeup_right';
      } else if (uniqueActors.length >= 2 && lastShot !== 'two_shot') {
        shot = 'two_shot';
      } else {
        shot = idx % 2 === 0 ? 'low_angle_swoop' : 'wide_stage';
      }
    }
    lastShot = shot;

    // Camera move & transition rhythm
    const cameraMove: CameraMoveId = VALID_CAMERA_MOVES.has(b.cameraMove as CameraMoveId)
      ? (b.cameraMove as CameraMoveId)
      : isClimax
        ? 'impact_shake'
        : shot === 'closeup_left' || shot === 'closeup_right'
          ? 'slow_push'
          : isFirst
            ? 'slow_pull'
            : idx % 3 === 0
              ? 'pan_right'
              : 'still';

    const transition: TransitionId = VALID_TRANSITIONS.has(b.transition as TransitionId)
      ? (b.transition as TransitionId)
      : isFirst || frame === 'moral_card'
        ? 'ink_fade'
        : isClimax
          ? 'crimson_flash'
          : idx % 3 === 1
            ? 'diagonal_slash'
            : 'hard_cut';

    // SFX with cooldown (never spam loud stings back-to-back)
    let sfx: SfxId = b.sfx ? resolveSfx(b.sfx) : inferSfxFromBeat(dialogue, beatEmotion, frame, propRes.id);
    if (sfx !== 'none' && idx - lastSfxBeatIdx < 2 && frame === 'main') {
      sfx = 'none';
    } else if (sfx !== 'none') {
      lastSfxBeatIdx = idx;
    }

    const speakerMember = cast.find((c) => c.id === speakerId);
    const fx: FxId = FX_LIST.includes(b.fx as FxId)
      ? (b.fx as FxId)
      : inferFxFromBeat(beatEmotion, dialogue, speakerMember?.archetype);

    // Duration calibration: use explicit duration if sensible, else compute from dialogue word count
    const explicitDur = Number(b.duration);
    const estimatedDur = estimateSpokenDuration(dialogue, frame);
    const duration =
      Number.isFinite(explicitDur) && explicitDur >= 2.0 && explicitDur <= 14.0
        ? explicitDur
        : estimatedDur;

    const crowd: CrowdId = VALID_CROWDS.has(b.crowd as CrowdId)
      ? (b.crowd as CrowdId)
      : stageRes.id === 'royal_durbar' || stageRes.id === 'mughal_courtyard'
        ? 'courtiers'
        : stageRes.id === 'kurukshetra_field'
          ? 'army'
          : stageRes.id === 'village_chowk' || stageRes.id === 'bazaar_lane'
            ? 'villagers'
            : 'none';

    const propSlot: StoryBeat['propSlot'] = ['left', 'center', 'right', 'overhead'].includes(String(b.propSlot))
      ? (b.propSlot as StoryBeat['propSlot'])
      : propRes.id === 'banyan_bough' || propRes.id === 'sun_orb' || propRes.id === 'flying_stick'
        ? 'overhead'
        : 'center';

    // Auto-promote explainer stat beats to `motion_card` when in blueprint/explainer style & no explicit shot given
    const statMatch = dialogue.match(/\b(\d+(?:[.,]\d+)?(?:\s?%|\s?[xXkKmMbB]\b)?)/);
    if (
      !b.shot &&
      frame === 'main' &&
      !isFirst &&
      chosenRenderStyle === 'blueprint_technical' &&
      statMatch &&
      lastShot !== 'motion_card' &&
      autoMotionCardCount < 2
    ) {
      shot = 'motion_card';
      lastShot = shot;
    }

    // Ensure every `motion_card` beat has rich structured MotionCardConfig fields
    if (shot === 'motion_card' && !motionCard) {
      const clauses = dialogue
        .split(/[.;—–]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 3);
      motionCard = {
        layout: statMatch ? 'hero_stat' : clauses.length >= 2 ? 'split_callout' : 'morph_bar',
        kicker: (typeof b.title === 'string' && b.title.trim() ? b.title.trim() : `KEY INSIGHT`).toUpperCase().slice(0, 34),
        headline: (clauses[0] || dialogue || 'Key Breakthrough').slice(0, 72),
        ...(statMatch ? { metric: statMatch[1].trim(), metricUnit: 'MEASURED FACTOR' } : {}),
        ...(clauses.length >= 2 ? { bullets: clauses.slice(1, 4).map((c) => c.slice(0, 64)) } : {}),
        highlightBar: (clauses[clauses.length - 1] || dialogue).slice(0, 58),
      };
      autoMotionCardCount++;
    }

    // Auto-choreograph subtle sub-beat Action Cues on climax or high-impact beats if LLM omitted them
    let beatActionCues = parsedActionCues && parsedActionCues.length > 0 ? parsedActionCues : undefined;
    if (!beatActionCues && frame === 'main' && shot !== 'motion_card') {
      const dramaMatch = dialogue.match(
        /\b(strike|strikes|struck|shatter|shatters|vanish|vanishes|suddenly|behold|impossible|thunder|roar|leap|leaps|reveal|revealed|trap|falls|fell|victory|escape)\b/i
      );
      if (isClimax || (dramaMatch && autoActionCueCount < 3)) {
        const triggerWord = dramaMatch?.[1];
        const primaryActorId =
          speakerId !== 'narrator' && uniqueActors.some((a) => a.castId === speakerId)
            ? speakerId
            : uniqueActors[0]?.castId;
        const autoCue: BeatActionCue = {
          ...(triggerWord ? { triggerPhrase: triggerWord } : { at: 0.45 }),
          ...(primaryActorId
            ? {
                castId: primaryActorId,
                pose: isClimax ? 'attack' : 'gesture',
              }
            : {}),
          cameraPunch: isClimax ? 0.65 : 0.42,
          ...(propRes.id !== 'none' ? { propPulse: 0.72 } : {}),
          ...(isClimax && fx === 'none' ? { fx: 'shock_burst' } : {}),
          label: isClimax ? 'Climax impact' : 'Dramatic emphasis',
        };
        beatActionCues = [autoCue];
        autoActionCueCount++;
      }
    }

    return {
      id: typeof b.id === 'string' && b.id.trim() ? b.id.trim() : `b${idx + 1}`,
      title: typeof b.title === 'string' && b.title.trim() ? b.title.trim() : `Scene ${idx + 1}`,
      duration,
      frame,
      renderStyle: b.renderStyle ? resolveRenderStyle(b.renderStyle, playbook.renderStyle) : undefined,
      stage: stageRes.id,
      mood: resolveMood(b.mood, playbook),
      crowd,
      cameraMove,
      flipStage: b.flipStage === true ? true : undefined,
      haze: Number.isFinite(Number(b.haze)) && Number(b.haze) > 0 ? Math.min(1, Number(b.haze)) : undefined,
      backdropZoom:
        Number.isFinite(Number(b.backdropZoom)) && Number(b.backdropZoom) > 0
          ? Math.max(0.9, Math.min(1.25, Number(b.backdropZoom)))
          : undefined,
      weather: WEATHER_LIST.includes(b.weather as WeatherId) ? (b.weather as WeatherId) : playbook.defaultWeather,
      shot,
      transition,
      lightSide: b.lightSide === 'left' ? 'left' : idx % 2 === 0 ? 'right' : 'left',
      prop: propRes.id,
      propSlot,
      fx,
      sfx,
      raag: resolveRaag(b.raag ?? obj.defaultRaag, playbook),
      musicEnergy: Number.isFinite(Number(b.musicEnergy))
        ? Math.max(0.15, Math.min(1, Number(b.musicEnergy)))
        : isClimax
          ? 0.92
          : frame === 'moral_card'
            ? 0.45
            : 0.65,
      actors: uniqueActors,
      ...(parsedExpressionCues && parsedExpressionCues.length > 0
        ? { expressionCues: parsedExpressionCues }
        : {}),
      ...(beatActionCues && beatActionCues.length > 0 ? { actionCues: beatActionCues } : {}),
      ...(motionCard ? { motionCard } : {}),
      speakerId,
      speakerLabel,
      dialogue: dialogue || 'The tale unfolds beneath ancient skies.',
    };
  });

  // Optional moral bookend when requested & missing
  if (options.ensureBookends && beats.length >= 4 && beats[beats.length - 1].frame !== 'moral_card') {
    const last = beats[beats.length - 1];
    beats.push({
      ...last,
      id: `b_moral`,
      title: 'The Moral',
      duration: 4.0,
      frame: 'moral_card',
      shot: 'wide_stage',
      transition: 'ink_fade',
      cameraMove: 'slow_pull',
      sfx: 'mystic_chime',
      fx: 'none',
      musicEnergy: 0.42,
      speakerId: 'narrator',
      speakerLabel: 'Moral',
      dialogue:
        typeof obj.moral === 'string' && obj.moral.trim()
          ? obj.moral.trim()
          : `Wisdom endures longer than pride or force.`,
    });
    autoFixes.push('added closing Moral Card');
  }

  // Split any bloated wall-of-text dialogue beat (>24 words) into crisp alternating shots
  const splitRes = autoSplitLongDialogueBeats(beats);
  const finalBeats = splitRes.beats;
  if (splitRes.splitCount > 0) autoFixes.push(`split ${splitRes.splitCount} long monologue beat(s)`);
  if (dialogueCleanCount > 0) autoFixes.push(`cleaned ${dialogueCleanCount} leaked stage cue(s)`);

  const rawStyleObj = rawStyleObjEarly;

  const inferDefaultMotionProfile = (styleId: RenderStyleId): MotionProfileId => {
    if (styleId === 'blueprint_technical') return 'motion_graphics';
    if (
      styleId === 'anime_cel' ||
      styleId === 'manga_screentone' ||
      styleId === 'felt_puppet' ||
      styleId === 'risograph_print'
    ) {
      return 'snappy_cartoon';
    }
    if (
      styleId === 'chiaroscuro' ||
      styleId === 'neon_cybernoir' ||
      styleId === 'scratchboard_noir'
    ) {
      return 'cinematic_drama';
    }
    return 'auto';
  };

  const visualStyle = resolveVisualStyle({
    ...DEFAULT_VISUAL_STYLE,
    lookPreset: playbook.lookPreset,
    motionProfile: inferDefaultMotionProfile(chosenRenderStyle),
    ...(rawStyleObj as Partial<EpisodeScript['visualStyle']>),
    renderStyle: chosenRenderStyle,
  });

  if (autoActionCueCount > 0) {
    autoFixes.push(`choreographed ${autoActionCueCount} sub-beat action cue(s)`);
  }
  if (autoMotionCardCount > 0) {
    autoFixes.push(`generated ${autoMotionCardCount} kinetic motion card(s)`);
  }

  const sampleTextForLang = [
    typeof obj.title === 'string' ? obj.title : '',
    ...finalBeats.slice(0, 3).map((b) => b.dialogue || ''),
  ].join(' ');
  const resolvedLanguage: LanguageCode =
    options.targetLanguage && isValidLanguageCode(options.targetLanguage)
      ? options.targetLanguage
      : isValidLanguageCode(obj.language)
        ? obj.language.trim().toLowerCase() as LanguageCode
        : detectLanguageFromText(sampleTextForLang);

  const candidate: EpisodeScript = {
    id:
      typeof obj.id === 'string' && obj.id.trim()
        ? normalizeToken(obj.id)
        : normalizeToken(obj.title) || `episode_${Date.now().toString().slice(-4)}`,
    language: resolvedLanguage,
    series:
      typeof obj.series === 'string' && obj.series.trim() ? obj.series.trim() : playbook.defaultSeries,
    shelf: playbook.shelf,
    title:
      typeof obj.title === 'string' && obj.title.trim() ? obj.title.trim() : 'Untitled Folklore Episode',
    subtitle:
      typeof obj.subtitle === 'string' && obj.subtitle.trim()
        ? obj.subtitle.trim()
        : `A ${playbook.shortLabel} Classic`,
    defaultRaag: resolveRaag(obj.defaultRaag ?? obj.music, playbook),
    visualStyle,
    cast,
    beats: finalBeats,
  };

  if (fuzzyAssetCount > 0) autoFixes.push(`matched ${fuzzyAssetCount} fuzzy asset IDs`);
  if (blockingFixCount > 0) autoFixes.push(`fixed ${blockingFixCount} eye-line/slot collisions`);

  // Apply Cast Bible identity locks if provided
  let finalEpisode = candidate;
  const lockedNames = new Set<string>();
  if (options.castBible && options.castBible.length > 0) {
    for (const b of options.castBible) {
      lockedNames.add(b.name.trim().toLowerCase());
      lockedNames.add(b.key.trim().toLowerCase());
    }
    const synced = applyCastBibleToEpisode(candidate, options.castBible);
    finalEpisode = synced.episode;
    if (synced.matchedCount > 0) {
      autoFixes.push(`locked ${synced.matchedCount} Cast Bible visual identities`);
    }
  }

  // Anti-Twin Silhouette Mutation Pass: ensure every non-recurring character has a unique
  // silhouette compared to fellow episode cast members AND the last 15 exported uploads!
  const ledgerFps = collectLedgerCastFingerprints(loadPublishLedger(), finalEpisode.id);
  const seenFps: CharacterSilhouetteFingerprint[] = [...ledgerFps];
  let mutatedCount = 0;
  const diversifiedCast = finalEpisode.cast.map((member, idx) => {
    const isLocked = lockedNames.has(member.name.trim().toLowerCase());
    const avoidPool = isLocked ? seenFps.slice(ledgerFps.length) : seenFps;
    const fp = computeDnaFingerprint(member);
    const minDist = avoidPool.reduce((min, other) => Math.min(min, computeSilhouetteDistance(fp, other)), 1);
    if (minDist < SILHOUETTE_TWIN_THRESHOLD) {
      const nextDna = mutateDnaForUniqueness(member, avoidPool, {
        salt: idx * 733 + finalEpisode.title.length * 19,
        preserveSpecies: true,
      });
      const updated = syncMemberWithDna(member, nextDna);
      seenFps.push(computeDnaFingerprint(updated));
      mutatedCount++;
      return updated;
    }
    seenFps.push(fp);
    return member;
  });
  if (mutatedCount > 0) {
    finalEpisode = { ...finalEpisode, cast: diversifiedCast };
    autoFixes.push(`mutated ${mutatedCount} unique modular character DNA silhouette(s)`);
  }

  // Fill in missing speaker/listener frame-range emotional tracks while preserving any explicit AI cues!
  const choreo = choreographEpisodeEmotions(finalEpisode, { preserveExisting: true });
  finalEpisode = choreo.episode;
  if (choreo.updatedActors > 0) {
    autoFixes.push(`choreographed ${choreo.totalSegments} frame-range emotion segments`);
  }

  const verified = validateEpisodeScript(finalEpisode);
  if (verified.ok === false) {
    return { ok: false, error: verified.error };
  }
  return { ok: true, script: verified.script, autoFixes };
}

// =========================================================================
// STAGE & CAST BLUEPRINT (Step 1 of 2-Step Guided Generation)
// =========================================================================

export interface StageBlueprint {
  title: string;
  subtitle: string;
  series: string;
  region: PlaybookId;
  renderStyle: RenderStyleId;
  defaultRaag: RaagId;
  moral: string;
  stages: StageId[];
  cast: Array<{
    id: string;
    name: string;
    archetype: ArchetypeId;
    primaryColor?: string;
    accentColor?: string;
  }>;
}

export function normalizeStageBlueprint(
  raw: unknown,
  playbookOverride: PlaybookId | 'auto',
  storyText: string
): StageBlueprint {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const pb =
    playbookOverride !== 'auto'
      ? getPlaybookById(playbookOverride)
      : typeof obj.region === 'string' && REGIONAL_PLAYBOOKS.some((p) => p.id === obj.region)
        ? getPlaybookById(obj.region as PlaybookId)
        : detectPlaybookFromText(storyText);

  const rawStages = Array.isArray(obj.stages) ? obj.stages : [];
  const stages: StageId[] = Array.from(
    new Set(
      (rawStages.length > 0 ? rawStages : pb.stages.slice(0, 2)).map((s) => resolveStage(s, pb).id)
    )
  ).slice(0, 4);

  const rawCast = Array.isArray(obj.cast) ? obj.cast : [];
  const cast = (rawCast.length > 0 ? rawCast : [{ id: 'hero', name: 'Hero', archetype: pb.archetypes[0] }]).map(
    (c: unknown, i: number) => {
      const co = (c && typeof c === 'object' ? c : {}) as Record<string, unknown>;
      const name = typeof co.name === 'string' && co.name.trim() ? co.name.trim() : `Character ${i + 1}`;
      const arch = resolveArchetype(co.archetype ?? co.role, name, pb).id;
      const def = ARCHETYPE_DEFAULT_COLORS[arch];
      return {
        id: typeof co.id === 'string' && co.id.trim() ? normalizeToken(co.id) : normalizeToken(name) || `c${i + 1}`,
        name,
        archetype: arch,
        primaryColor: isValidHex(co.primaryColor) ? co.primaryColor : def.primary,
        accentColor: isValidHex(co.accentColor) ? co.accentColor : def.accent,
      };
    }
  );

  return {
    title: typeof obj.title === 'string' && obj.title.trim() ? obj.title.trim() : 'Folklore Tale',
    subtitle: typeof obj.subtitle === 'string' && obj.subtitle.trim() ? obj.subtitle.trim() : `A ${pb.shortLabel} Story`,
    series: typeof obj.series === 'string' && obj.series.trim() ? obj.series.trim() : pb.defaultSeries,
    region: pb.id,
    renderStyle: resolveRenderStyle(obj.renderStyle ?? obj.artStyle ?? obj.style, pb.renderStyle),
    defaultRaag: resolveRaag(obj.defaultRaag ?? obj.music, pb),
    moral:
      typeof obj.moral === 'string' && obj.moral.trim()
        ? obj.moral.trim()
        : 'True wisdom outshines boastful strength.',
    stages,
    cast,
  };
}

// =========================================================================
// ULTRA-CLEAR GUIDED PROMPTS (Regional Playbooks + 6-Field Lite Schema + Worked Example)
// =========================================================================

const GOLD_LITE_EXAMPLE = `{
  "title": "The Fox and the Crow",
  "subtitle": "Flattery Always Has a Price",
  "series": "Aesop's Fables",
  "region": "western_fables_myth",
  "renderStyle": "greek_amphora",
  "defaultRaag": "greek_lyre",
  "moral": "Never trust a flatterer who praises what they want to steal.",
  "cast": [
    { "id": "fox", "name": "Clever Fox", "archetype": "fox" },
    { "id": "crow", "name": "Proud Crow", "archetype": "crow" }
  ],
  "beats": [
    {
      "title": "Cold Open Hook",
      "stage": "olympus_acropolis",
      "who": ["crow", "fox"],
      "speaker": "narrator",
      "emotion": "sly",
      "prop": "saffron_feast",
      "dialogue": "One single compliment was all it took to steal a feast from the treetops."
    },
    {
      "title": "The Sweet Trap",
      "stage": "olympus_acropolis",
      "who": ["fox", "crow"],
      "speaker": "fox",
      "emotion": "sly",
      "dialogue": "Surely a bird with feathers this radiant must have the sweetest singing voice in Greece!"
    },
    {
      "title": "The Fatal Song",
      "stage": "olympus_acropolis",
      "who": ["fox", "crow"],
      "speaker": "crow",
      "emotion": "joy",
      "prop": "saffron_feast",
      "dialogue": "CAW! Behold my glorious voice—wait, my prize! Stop, you thief!"
    },
    {
      "title": "The Moral",
      "frame": "moral_card",
      "stage": "olympus_acropolis",
      "who": ["fox"],
      "speaker": "narrator",
      "emotion": "calm",
      "dialogue": "Never trust a flatterer who praises what they secretly want to steal."
    }
  ]
}`;

export interface GuidedPromptOptions {
  mode: 'lite' | 'full' | 'blueprint' | 'beats' | 'repair';
  playbook?: RegionalPlaybook;
  storyArc?: StoryArcTemplate;
  beatTarget?: number;
  preferredRenderStyle?: RenderStyleId;
  castBible?: CastBibleEntry[];
  blueprint?: StageBlueprint;
  repairContext?: { rawOutput: string; errorMessage: string };
  enablePerFrameExpressions?: boolean;
  targetLanguage?: LanguageCode;
}

export function buildGuidedDirectorPrompt(options: GuidedPromptOptions): string {
  const pb = options.playbook || REGIONAL_PLAYBOOKS[0];
  const targetBeats = options.beatTarget || 10;
  const styleId = options.preferredRenderStyle || pb.renderStyle;
  const perFrameCuesOn = options.enablePerFrameExpressions !== false;
  const langSpec = getLanguageSpec(options.targetLanguage || 'en');
  const langBlock = `\n\n${buildLanguageDirectorInstruction(langSpec)}`;
  const arcBlock = options.storyArc
    ? `\n\n${formatBeatSkeletonForPrompt(options.storyArc, targetBeats)}`
    : '';
  const principlesBlock = `\n\n${buildAnimationPrinciplesPromptBlock()}`;
  const expressionGuidanceBlock = perFrameCuesOn
    ? `\nFACIAL ACTING, SUBTEXT & PER-FRAME EXPRESSION RULES (60fps):
- Valid expressions (10): ${EXPRESSION_LIST.join(' | ')}
- UNDERSTAND SUBTEXT & BOTH CHARACTERS: Think about what BOTH the speaker AND every silent listener truly feel in each set of frames! A flatterer or trickster feels "sly" (NOT "warm"), while the listener shifts "curious" -> "joy" or "shocked".
- NEVER default everyone to angry or stern! Use calm, warm, curious, joy, awe, sly naturally; reserve "angry" strictly for genuine rage/fury.
- Set per-character base feelings via "actorExpressions": { "cast_id_1": "curious", "cast_id_2": "sly" }.
- For mid-beat reactions across sets of frames, anchor shifts to exact spoken words using "triggerPhrase" + "reason" (Katha Studio aligns "triggerPhrase" to exact 60fps frame ranges automatically, even after TTS retiming!):
  "expressionCues": [{ "castId": "hero", "frame": 0, "expression": "calm", "reason": "listening intently" }, { "castId": "hero", "triggerPhrase": "wait, my prize", "expression": "shocked", "reason": "realizes trap sprung" }]`
    : `\nFACIAL EXPRESSIONS:
- Keep faces serene and natural ("calm" or "warm"). Valid expressions: ${EXPRESSION_LIST.join(' | ')}.`;

  const bibleHints =
    options.castBible && options.castBible.length > 0
      ? `\nCHANNEL CAST BIBLE (Reuse these exact IDs/archetypes if these recurring heroes appear):\n${options.castBible
          .slice(0, 8)
          .map(
            (e) =>
              `- id: "${normalizeToken(e.key)}" | name: "${e.member.name}" | archetype: "${e.member.archetype}"`
          )
          .join('\n')}`
      : '';

  const paletteMenu = [
    `RECOMMENDED REGION PLAYBOOK: ${pb.label}`,
    `- region: "${pb.id}" | renderStyle: "${styleId}" | defaultRaag: "${pb.defaultRaag}"`,
    `- BEST STAGES (pick 1-3): ${pb.stages.join(', ')}`,
    `- BEST CAST ARCHETYPES (pick 2-4): ${pb.archetypes.join(', ')}`,
    `- MODULAR CHARACTER/CREATURE DNA (anti-template YouTube uniqueness): On each cast[] entry you may include an optional "dna" object to sculpt unique humans, animals, mythic creatures & spirits from scratch!`,
    `  * chassis: humanoid | quadruped | avian | serpentine | arachnid | ethereal`,
    `  * traits: plain-English description auto-parsed into anatomy (e.g. "tall gaunt elder with deer antlers, tattered cloak, third eye, and starfield robe")`,
    `  * optional exact tokens: headwear (none|golden_mukut|royal_turban|bandana|wizard_hat|battle_helm|straw_conical|floral_tiara|laurel_wreath|ten_crown|jester_cap|veil_drape), wings (none|feathered_angel|bat_demon|butterfly_fey|raven_dark|celestial_flame|bone_wyvern), horns (none|curved_ram|deer_antlers|oni_twin|unicorn_spire|bull_horns|crown_spines), tail (none|monkey_curl|fox_fluffy|lion_tuft|serpent_long|peacock_fan|dragon_spiked|deer_short), surfacePattern (solid|tiger_stripes|leopard_spots|serpent_scales|feather_layers|royal_brocade|kente_weave|bark_grain|starfield_cosmic|stone_cracks), aura (none|solar_halo|lunar_crescent|ember_sparks|shadow_wisps|petal_orbit), extraArms (0|2)`,
    `- BEST PROPS (optional): none, ${pb.props.join(', ')} (optional propAnchor: stage | left_hand | right_hand | actor_0_hand | actor_1_hand)`,
    `- DIRECTING NOTE: ${pb.directingNote}`,
  ].join('\n');

  if (options.mode === 'blueprint') {
    return `You are a Stage & Cast Designer for Katha Studio (2D Folklore Machinima).
Output ONLY a small, valid JSON blueprint (no markdown, no explanation).

${paletteMenu}${bibleHints}${langBlock}

Return this exact JSON shape:
{
  "language": "${langSpec.code}",
  "title": "Catchy Episode Title",
  "subtitle": "Short 4-6 word hook",
  "series": "${pb.defaultSeries}",
  "region": "${pb.id}",
  "renderStyle": "${styleId}",
  "defaultRaag": "${pb.defaultRaag}",
  "moral": "One crisp closing wisdom sentence",
  "stages": ["stage_id_1", "stage_id_2"],
  "cast": [
    {
      "id": "short_id",
      "name": "Display Name",
      "archetype": "valid_archetype_id",
      "dna": { "chassis": "humanoid", "traits": "brief distinct silhouette, hair/horns/outfit/pattern cue" }
    }
  ]
}

Rules:
- Pick 2 to 4 cast members using ONLY archetype IDs from the menu above.
- Give each new character a distinct "dna" (chassis + traits) so no two cast members look like twins.
- Pick 1 to 3 stages using ONLY stage IDs from the menu above.`;
  }

  if (options.mode === 'beats' && options.blueprint) {
    const bp = options.blueprint;
    return `You are a Storyboard Writer for Katha Studio.
Katha Studio's Auto-Director handles camera angles, facing, colors, timing, and SFX automatically.
Your ONLY job is to write ${targetBeats} vivid, punchy story beats using the LOCKED cast and stages below.

LOCKED BLUEPRINT (use ONLY these exact IDs):
- Title: "${bp.title}" | Series: "${bp.series}" | Region: "${bp.region}"
- LOCKED CAST IDs: ${bp.cast.map((c) => `"${c.id}" (${c.name})`).join(', ')}
- LOCKED STAGE IDs: ${bp.stages.map((s) => `"${s}"`).join(', ')}
- AVAILABLE PROPS: none, ${pb.props.join(', ')}
- EMOTIONS: ${EXPRESSION_LIST.join(' | ')}${langBlock}${expressionGuidanceBlock}${principlesBlock}${arcBlock}

Return ONLY valid JSON:
{
  "language": "${langSpec.code}",
  "title": "${bp.title}",
  "subtitle": "${bp.subtitle}",
  "series": "${bp.series}",
  "region": "${bp.region}",
  "renderStyle": "${bp.renderStyle}",
  "defaultRaag": "${bp.defaultRaag}",
  "moral": "${bp.moral}",
  "cast": ${JSON.stringify(bp.cast)},
  "beats": [
    {
      "title": "2-4 word scene title",
      "frame": "main (or 'nested_story' / 'chapter_title' / 'moral_card')",
      "stage": "one of the LOCKED STAGE IDs",
      "who": ["locked_cast_id_1", "locked_cast_id_2"],
      "speaker": "locked_cast_id or narrator",
      "emotion": "calm | warm | joy | curious | awe | sly | shocked | grief | stern | angry",
      "actorExpressions": { "locked_cast_id_1": "curious", "locked_cast_id_2": "sly" },
      "expressionCues": [{ "castId": "locked_cast_id_1", "triggerPhrase": "key words", "expression": "shocked", "reason": "reacts to twist" }],
      "prop": "optional prop id or none",
      "dialogue": "Punchy spoken line (10-18 words max, NO stage cues like (angrily) or 'Name:')"
    }
  ]
}

Story Craft Rules:
1. Follow the Beat-by-Beat Story Arc Skeleton above closely.
2. Beat 1 MUST be a scroll-stopping Cold Open Hook (NEVER "Once upon a time" or "Long ago").
3. At least 50% of main beats MUST be characters speaking directly to each other (not just narrator summary).
4. Keep every dialogue line crisp (10-18 words max) with NO parentheticals or "Speaker:" prefixes.
5. Stage a hero prop on at least 2 key beats and end with "frame": "moral_card".`;
  }

  if (options.mode === 'repair' && options.repairContext) {
    return `Fix the broken JSON below so it is 100% valid JSON matching Katha Studio's Lite Storyboard schema.
Error encountered: ${options.repairContext.errorMessage}
Return ONLY the repaired JSON object (no markdown fences, no commentary).

BROKEN OUTPUT:
${options.repairContext.rawOutput.slice(0, 12000)}`;
  }

  if (options.mode === 'full') {
    return `You are a Pro Episode Director for Katha Studio (Deterministic 10-Engine 2D Folklore Machinima).
Return ONLY valid raw JSON (no markdown fences).

${paletteMenu}${bibleHints}${langBlock}${expressionGuidanceBlock}${principlesBlock}${arcBlock}

ALL SUPPORTED ENUMS:
- frame: main | nested_story | chapter_title | moral_card
- shot: wide_stage | two_shot | closeup_left | closeup_right | split_faceoff | eye_strip | low_angle_swoop | prop_spotlight | motion_card
- cameraMove: still | slow_push | slow_pull | pan_left | pan_right | impact_shake
- transition: hard_cut | diagonal_slash | crimson_flash | silhouette_wipe | ink_fade
- mood: ${MOOD_CATALOG.map((m) => m.id).join(' | ')}
- weather: ${WEATHER_LIST.join(' | ')}
- pose: ${POSE_LIST.join(' | ')}
- expression: ${EXPRESSION_LIST.join(' | ')} (also supports per-actor \`expressionTrack: [{ frame, expression }]\` and beat-level \`expressionCues: [{ castId, triggerPhrase, expression, reason }]\`)
- actionCues (optional sub-beat choreography): \`[{ triggerPhrase, castId, pose, cameraPunch, propPulse, fx }]\`
- motionCard (when shot is \`motion_card\`): \`{ layout: "hero_stat | split_callout | morph_bar", kicker, headline, metric, metricUnit, bullets }\`
- motion: ${MOTION_LIST.join(' | ')}
- propAnchor: stage | left_hand | right_hand | actor_0_hand | actor_1_hand
- fx: ${FX_LIST.join(' | ')}
- sfx: ${SFX_CATALOG.map((s) => s.id).join(' | ')}

Direct ${targetBeats} cinematic scenes following the Story Arc Skeleton above. Use 50%+ live character dialogue (10-18 words/line, NO stage directions in dialogue), bespoke non-twin Entity DNA on cast[], strong Cold Open hook, dynamic shot cuts, natural varied facial acting (NOT angry by default), eye-line blocking, and a closing "moral_card".`;
  }

  // Default: LITE AUTO-DIRECT MODE (Best for Basic, Free & Local 7B-8B LLMs!)
  return `You are a Storyboard Writer for Katha Studio (Deterministic 2D Folklore Machinima).
IMPORTANT: Katha Studio's built-in Auto-Director automatically handles camera angles, character eye-lines, hex colors, spoken durations, transitions, and sound effects!
You ONLY need to write the compact Lite Storyboard JSON below.

${paletteMenu}${bibleHints}${langBlock}${expressionGuidanceBlock}${principlesBlock}${arcBlock}

WORKED GOLD-STANDARD EXAMPLE (follow this exact simple structure):
${GOLD_LITE_EXAMPLE}

YOUR RULES:
1. Return ONLY valid raw JSON (no markdown fences, no intro text).
2. Write ${targetBeats} scenes in "beats" following the Story Arc Skeleton above.
3. Use ONLY archetype IDs, stage IDs, and prop IDs from the menu above. Optionally include "dna": { "chassis", "traits" } on cast[] for unique bespoke characters/creatures.
4. Keep "who" to 1 or 2 cast IDs per beat; at least 50% of beats should be characters talking directly (not just narrator).
5. Keep "dialogue" crisp (10-18 words per beat) with NO stage directions like (laughs) or "Name:" prefixes.
6. Beat 1 MUST hook immediately (NEVER "Once upon a time") and final beat MUST use "frame": "moral_card".
7. Valid expressions (10): ${EXPRESSION_LIST.join(' | ')} — vary them naturally (use calm, warm, curious, joy; do NOT overuse stern/angry). Optional mid-beat shifts via "expressionCues" with "triggerPhrase".`;
}

// =========================================================================
// COMPLETE HUMAN + AI OPERATING MANUAL (Bundled in ZIP as LLM_STORY_STAGE_GUIDE.md)
// =========================================================================

export function buildLlmStoryStageGuideMarkdown(): string {
  const playbookSections = REGIONAL_PLAYBOOKS.map(
    (pb, i) => `### ${i + 1}. ${pb.label}
- **Region ID**: \`${pb.id}\` | **Shelf**: \`${pb.shelf}\`
- **Recommended Art Engine**: \`${pb.renderStyle}\` *(alternatives: ${pb.altRenderStyles.map((s) => `\`${s}\``).join(', ')})*
- **Music Engine**: \`${pb.defaultRaag}\` | **Default Mood**: \`${pb.defaultMood}\` | **Weather**: \`${pb.defaultWeather}\`
- **Best Stages**: ${pb.stages.map((s) => `\`${s}\``).join(', ')}
- **Best Cast Archetypes**: ${pb.archetypes.map((a) => `\`${a}\``).join(', ')}
- **Best Props**: ${pb.props.map((p) => `\`${p}\``).join(', ')}
- **Directing Tip**: ${pb.directingNote}`
  ).join('\n\n');

  return `# Katha Studio — Complete Human & AI Operating Manual

Use this guide with **both Humans and LLMs** (from bare-minimum 7B–9B local models to medium cloud models like Gemini 2.5 Flash / GPT-4o-mini up to frontier Pro/Sonnet models) to design unique characters, direct expressive 60fps episodes, and stay safely monetized on YouTube.

---

## 1. Quickstart: Humans vs. LLMs

### For Humans (5-Step Studio Workflow)
1. **Pick or Generate a Story**: Open the **AI / Script** tab, paste a folklore idea or Gutenberg story, choose your **Language (19 supported)**, **Region Playbook**, and **Beat Length**, then click **Generate & Auto-Direct Episode** (or load any of the 20 preset episodes).
2. **Sculpt Unique Characters (Zero Templates)**: Open the **Look** tab -> click **Workshop** on any cast member (or **+ New Entity**) to launch the Sims-style **Entity DNA Workshop**. Build humans, animals, mythic creatures, or spirits across 6 body chassis, modular parts, morph sliders, and 7-channel palettes, then optionally click **Save to Bible** to lock recurring series heroes.
3. **Direct Stage, Expressions & Props**: In the **Direct** tab, toggle **Stage Move Mode** to drag actors/props directly on the canvas, attach props to a character's moving wrist (\`propAnchor\`), and run **Auto-Direct Faces** or **AI Direct Emotions** for subtext-aware speaker + listener facial acting.
4. **Voice & Music**: Open the **Voice** tab to generate multi-character TTS (Gemini, OpenAI, ElevenLabs, or Local Kokoro/Piper), upload custom voice tracks (beat durations auto-sync), or drop in a custom music stem with automatic ducking.
5. **Monetization Audit & Export**: Open **Channel Growth -> YPP Shield** and click **1-Click Full YPP Auto-Shield** (checks Ad-Safety, Transformative Commentary, Upload Diversity, and Cast Silhouette Uniqueness with 1-click **Diversify Cast**), then render via **Fast Render** (WebCodecs WebM + Broadcast H.264 MP4 @ -14 LUFS) or **Shorts & Thumbnails**.

### For LLMs (Zero-Friction 1-Shot Workflow)
- Output ONLY the **6-Field Lite Storyboard JSON** below. You do **not** need to compute coordinates, camera cuts, durations, eye-lines, or hex colors — Katha Studio's **Deterministic Auto-Director** compiles, heals malformed JSON, synthesizes unique **Entity DNA**, mutates lookalike silhouettes, and choreographs camera + FACS expressions automatically.

---

## 2. The 6-Field "Lite Storyboard" Format (Recommended for LLMs)

Katha Studio's **Deterministic Auto-Director** automatically computes:
- Eye-line blocking (left actor always faces right, right actor faces left, zero overlaps)
- Shot rhythm (\`wide_stage\`, \`two_shot\`, \`closeup_left\`, \`closeup_right\`, \`split_faceoff\`, \`prop_spotlight\`)
- Spoken duration from word/character count (Latin, Indic, Arabic/Urdu & CJK aware) + auto-splitting of bloated 25+ word monologue beats
- Dialogue sanitization (strips leaked \`Speaker:\` prefixes and \`(parenthetical)\` cues while promoting cues into real actor expressions & SFX)
- Bespoke **Entity DNA synthesis & Anti-Twin Silhouette Mutation** against fellow cast members AND recent Publish Ledger exports (while respecting locked Cast Bible heroes)
- Camera moves, transitions, SFX with cooldowns, and semantic fuzzy matching (e.g. \`"monkey_king"\` -> \`"vanara_hero"\`, \`"olive grove"\` -> \`"olympus_acropolis"\`)

### Copy-Paste Gold Example (Lite JSON with Modular DNA & Phrase-Aligned Acting)
\`\`\`json
${GOLD_LITE_EXAMPLE}
\`\`\`

*Optional enrichment fields any LLM can include per cast member or beat:*
- On \`cast[]\`: \`"dna": { "chassis": "quadruped", "traits": "sleek golden fox with crescent scarf and amber eyes" }\`
- On \`beats[]\`: \`"actorExpressions": { "fox": "sly", "crow": "curious" }\`, \`"expressionCues": [{ "castId": "crow", "triggerPhrase": "wait, my prize", "expression": "shocked", "reason": "feast falls" }]\`, \`"propAnchor": "actor_0_hand"\`

---

## 3. Sims-Style Entity DNA Studio (Humans, Animals, Mythic Creatures & Spirits)

To beat YouTube's anti-template demonetization checks, every cast member supports a modular \`CharacterDNA\` genome (\`cast[].dna\`) rendered across all 10 Art Engines with 2-bone IK arms, animated wings/tails, and full FACS lip-sync:

### 6 Anatomical Body Chassis
- \`humanoid\` — Bipedal humans, royalty, sages, knights, demons, 4-armed deities (\`extraArms: 2\`)
- \`quadruped\` — Four-legged mammals & beasts (lions, tigers, foxes, wolves, deer, elephants, bulls, mythological mounts)
- \`avian\` — Winged birds & mythic raptors (ravens, crows, cranes, owls, Garuda, phoenixes)
- \`serpentine\` — Coiled serpents, nagas, Asian dragons, hydras, river spirits
- \`arachnid\` — Eight-legged spiders & trickster weavers (Anansi, Jorogumo)
- \`ethereal\` — Floating ghosts, lantern wraiths, forest spirits, shadow djinn

### Compact LLM DNA Recipe (Easiest Way for Any AI to Build Custom Entities)
Instead of writing 40 nested properties, an LLM can pass a compact \`dna\` object on any \`cast[]\` entry — Katha Studio parses both plain-English \`traits\` AND exact enum tokens:
\`\`\`json
{
  "id": "forest_warden",
  "name": "Banyan Warden",
  "archetype": "spirit",
  "dna": {
    "chassis": "ethereal",
    "traits": "tall floating moss spirit with deer antlers, third eye, tattered cloak, and bark grain robe",
    "wings": "butterfly_fey",
    "aura": "petal_orbit",
    "palette": { "primary": "#1f4d3a", "accent": "#f2c85b" }
  }
}
\`\`\`

### Exact Modular Part Enum Reference
- **Head Shapes (15)**: \`oval_classic\`, \`square_heroic\`, \`heart_graceful\`, \`round_youth\`, \`angular_sharp\`, \`long_elder\`, \`feline_muzzle\`, \`canine_snout\`, \`curved_beak\`, \`raptor_beak\`, \`serpent_fang\`, \`elephant_trunk\`, \`primate_brow\`, \`spider_mandible\`, \`spirit_skull\`
- **Ears (9)**: \`human_standard\`, \`pointed_elf\`, \`cat_triangular\`, \`fox_tall\`, \`round_bear\`, \`long_hare\`, \`elephant_fan\`, \`fin_frill\`, \`none\`
- **Horns / Antlers (7)**: \`none\`, \`curved_ram\`, \`deer_antlers\`, \`oni_twin\`, \`unicorn_spire\`, \`bull_horns\`, \`crown_spines\`
- **Hair / Mane (11)**: \`none\`, \`short_cropped\`, \`long_flowing\`, \`topknot_bun\`, \`braided_crown\`, \`wild_spiky\`, \`lion_mane\`, \`feather_crest\`, \`dreadlocks\`, \`hooded_cowl\`, \`twin_buns\`
- **Facial Hair (7)**: \`none\`, \`royal_mustache\`, \`sage_long_beard\`, \`short_trimmed\`, \`goatee\`, \`handlebar\`, \`cat_whiskers\`
- **Face Marks (10)**: \`none\`, \`vermilion_tilak\`, \`ash_tripundra\`, \`third_eye\`, \`gold_bindi\`, \`war_paint\`, \`cheek_scar\`, \`freckles\`, \`tribal_lines\`, \`royal_kohl\`
- **Headwear (12)**: \`none\`, \`golden_mukut\`, \`royal_turban\`, \`bandana\`, \`wizard_hat\`, \`battle_helm\`, \`straw_conical\`, \`floral_tiara\`, \`laurel_wreath\`, \`ten_crown\`, \`jester_cap\`, \`veil_drape\`
- **Surface Patterns (10)**: \`solid\`, \`tiger_stripes\`, \`leopard_spots\`, \`serpent_scales\`, \`feather_layers\`, \`royal_brocade\`, \`kente_weave\`, \`bark_grain\`, \`starfield_cosmic\`, \`stone_cracks\`
- **Wings (7)**: \`none\`, \`feathered_angel\`, \`bat_demon\`, \`butterfly_fey\`, \`raven_dark\`, \`celestial_flame\`, \`bone_wyvern\`
- **Tails (8)**: \`none\`, \`monkey_curl\`, \`fox_fluffy\`, \`lion_tuft\`, \`serpent_long\`, \`peacock_fan\`, \`dragon_spiked\`, \`deer_short\`
- **Auras (6)**: \`none\`, \`solar_halo\`, \`lunar_crescent\`, \`ember_sparks\`, \`shadow_wisps\`, \`petal_orbit\`
- **Morph Sliders**: \`height\` (0.72–1.32), \`shoulderWidth\` (0.72–1.38), \`torsoBulk\` (0.72–1.38), \`headRatio\` (0.80–1.28), \`limbLength\` (0.78–1.28), \`posture\` (-0.25..+0.25), \`extraArms\` (\`0\` or \`2\`)

---

## 4. The 9 Regional World Playbooks & 10 Art Engines

Each of the **10 Art Engines** applies its own authentic animation grammar (stepped 12fps/24fps cadence, Tholu Bommalata / Wayang Kulit bamboo control rods, Sumi-e ink brush trails, Kente weave highlights, woodblock gouge grain, stained glass leadwork, and atmospheric particles):
- \`chiaroscuro\`, \`shadow_puppetry\`, \`woodblock_print\`, \`lineless_vector\`, \`stained_glass\`, \`papercraft_diorama\`, \`sumi_e_wash\`, \`kente_tapestry\`, \`greek_amphora\`, \`illuminated_codex\`

${playbookSections}

---

## 5. Character, Prop, Hand-Anchor & Custom Asset Cheat Sheet

| Story Concept | Recommended Archetype / DNA | Staging Tip |
|---|---|---|
| Odysseus / King Arthur / Viking / Spartan | \`knight\` or \`warrior\` + custom \`dna\` | Pair with \`headwear: "battle_helm"\` & \`ocean_ship\` / \`kurukshetra_field\` |
| Zeus / Odin / Nyame / Sky God | \`deva\` + \`aura: "solar_halo"\` | Add \`extraArms: 2\` for multi-armed deities & \`fx: "divine_aura"\` |
| Athena / Fairy Godmother / Devi | \`goddess\` + \`wings: "feathered_angel"\` | Add \`headwear: "golden_mukut"\` or \`"floral_tiara"\` |
| Sun Wukong / Hanuman | \`vanara_hero\` + \`tail: "monkey_curl"\` | Set \`prop: "magic_staff"\` with \`propAnchor: "actor_0_hand"\` |
| Anansi the Spider | \`spider\` (\`chassis: "arachnid"\`) | Pair with \`stage: "savanna_baobab"\`, \`surfacePattern: "kente_weave"\` & \`prop: "story_box"\` |
| Sang Kancil (Mouse Deer) | \`deer\` (\`chassis: "quadruped"\`) | Pair with \`renderStyle: "shadow_puppetry"\` & \`stage: "tropical_archipelago"\` |
| Dragon / Hydra / Quetzalcoatl | \`serpent\` (\`chassis: "serpentine"\`) | Add \`horns: "oni_twin"\`, \`wings: "bat_demon"\` or \`"feathered_angel"\` & \`weather: "embers"\` |
| Forest Ghost / Lantern Wraith / Djinn | \`spirit\` (\`chassis: "ethereal"\`) | Add \`aura: "shadow_wisps"\` or \`"ember_sparks"\` & \`headShape: "spirit_skull"\` |
| Held Weapon, Lamp or Relic | \`propAnchor\` on beat | Use \`"actor_0_hand"\` or \`"actor_1_hand"\` so the prop tracks the actor's moving wrist! |
| Any Unique Custom Prop or Painted Stage | \`customPropDataUrl\` / \`customBackdropDataUrl\` | Upload PNG/JPG/WebP directly in **Assets -> Props** or **Assets -> Stages** |

---

## 6. Two-Step Workflow for Bare-Minimum / Local 7B–9B Models
1. **Step 1 (Blueprint · temp 0.12)**: Ask the LLM for only \`title\`, \`region\`, 2–4 \`cast\` entries (with compact \`dna\` traits), and 1–3 \`stages\`.
2. **Step 2 (Beats · temp 0.35 + Story Arc Skeleton)**: Pass ONLY those locked IDs back and fill the beat-by-beat Story Arc Skeleton with 10–18 word lines.
3. **Step 3 (Optional 1-Click Script Doctor)**: Run **Polish Dialogue (Lock Visuals)** to sharpen the Cold Open hook and character wit without altering a single cast member, stage, or camera angle.

---

## 7. Facial Expressions (10 FACS States), Subtext & Phrase-Aligned Per-Frame Acting (60fps)
All 40 archetypes AND all 6 Entity DNA chassis render through a unified FACS Facial Expression Engine that keeps resting faces approachable and non-angry by default:
- **10 Supported Expressions**: \`calm\`, \`warm\`, \`joy\`, \`curious\`, \`awe\`, \`sly\`, \`shocked\`, \`grief\`, \`stern\`, and \`angry\` (reserve \`angry\` strictly for genuine fury).
- **System-Wide Toggle**: The toolbar **Expressions / Neutral** button (and \`visualStyle.expressionsEnabled\`) toggles facial expressions globally across playback, WebM capture, and Fast Offline rendering while keeping natural blinking and lip-sync.
- **Phrase-Aligned Sets of Frames (Never Drifts After TTS Retiming!)**: Anchor mid-beat shifts to spoken words via \`triggerPhrase\` + \`reason\`:
  - \`actorExpressions: { "fox": "sly", "crow": "curious" }\`
  - \`expressionCues: [{ "castId": "crow", "frame": 0, "expression": "joy", "reason": "boasting proudly" }, { "castId": "crow", "triggerPhrase": "wait, my prize", "expression": "shocked", "reason": "prize drops from beak" }]\`
- **Dedicated Pass-2 "AI Direct Emotions" & Zero-Key Auto-Choreographer**: Click **AI Direct Emotions** in the AI Director panel for a whole-script subtext pass (directing BOTH speakers and silent listeners while locking visuals & dialogue), or click **Auto-Direct Faces** for instant offline choreography with 36-frame anti-flicker protection.

---

## 8. YouTube Monetization, YPP Policy Shield & Anti-Template Guardrails
Katha Studio's **YPP Policy Shield** (**Channel Growth -> YPP Shield** + **Fast Render Pre-Flight Gate**) enforces 6 monetization safeguards:
1. **Beat Template / Twin-Character Crackdowns**: Tracks every exported episode's Art Engine, primary stage, opening hook, AND **cast silhouette DNA fingerprints** in the **Channel Upload Diversity Ledger**. Flags twin characters (distance < 34%) both inside an episode and across recent uploads, with a 1-click **Diversify Cast** fix (while protecting locked Cast Bible heroes).
2. **Add Original Transformative Value**: Public-domain tales stay YPP-safe with original dramatization, expressive multi-character acting (45%+ character dialogue), and brief cultural/historical reflection before the Moral Card.
3. **Keep Titles & First 30 Seconds Ad-Safe**: Automatically softens folklore yellow-icon triggers (\`corpse\`, \`cremation ground\`, \`blood\`, \`behead\`, \`kill\`, \`poison\`, \`suicide\`, \`torture\`) into mythic equivalents.
4. **Avoid the Accidental "Made for Kids" RPM Cliff**: Warns against \`"for kids"\` / \`"kids cartoon"\` wording unless intentionally targeting COPPA.
5. **Honest Studio Disclosures**: Includes an auto-generated **Public-Domain Transformative Attribution** & Studio Disclosure checklist.
6. **Channel Identity & Portability**: Save custom brand watermark logos in **Look -> Channel Brand Kit**, lock recurring characters in the **Cast Bible**, and export full self-contained projects as portable \`.katha\` archives.

---

## 9. Multi-Language Production (19 Global & Indian Languages · CJK & RTL · YouTube MLA)
Katha Studio builds, voices, renders, and packages episodes natively in **19 languages**: English (\`en\`), Hindi (\`hi\`), Tamil (\`ta\`), Telugu (\`te\`), Bengali (\`bn\`), Marathi (\`mr\`), Gujarati (\`gu\`), Kannada (\`kn\`), Malayalam (\`ml\`), Urdu (\`ur\` · RTL), Spanish (\`es\`), Portuguese (\`pt\`), French (\`fr\`), German (\`de\`), Indonesian (\`id\`), Japanese (\`ja\`), Korean (\`ko\`), Chinese (\`zh\`), and Arabic (\`ar\` · RTL).
- **Schema Lock**: Set root \`"language": "hi"\` (or any of the 19 ISO codes). Write all human-readable story text in the target language while keeping **all JSON keys and engine enum IDs** in exact lowercase ASCII English tokens.
- **Kinetic Karaoke Captions & Script Typography**: Automatically loads script-appropriate Noto fonts, switches \`ctx.direction = 'rtl'\` for Arabic/Urdu, highlights spoken words in sync, and handles space-free CJK timing.
- **YouTube Multi-Language Audio (MLA) Packager**: In **Channel Growth -> Dub & MLA**, batch-translate an episode into multiple languages and export a single CRC-32 \`.zip\` with per-language offline WAV tracks, localized \`.srt\` captions, and localized YouTube launch packs.

---

## 10. Short-Form (<60s) vs. Long-Form (8–20+ Minute) Production Playbook

### YouTube Shorts (30–55 seconds · 9:16 Vertical)
- Set **Beat Target = 6–10 beats**, aspect **9:16**, and use **Shorts & Thumbnails** or **Fast Render** directly. Fits comfortably inside a single LLM prompt, browser RAM, and the 150 MB direct MP4 converter.

### Standard Episodes (1.5–4 minutes · 16:9 Landscape)
- Set **Beat Target = 12–20 beats** (or stitch 2–3 short acts). Renders in one pass via **Fast Render** (WebCodecs 1080p60/30).

### Long-Form Videos (8–25+ minutes · Mid-Roll Monetization Tier)
Katha Studio includes a **Native Long-Form Production Engine** engineered end-to-end for 8–25+ minute videos:
1. **Multi-Act Long-Form AI Director + Act Sculptor**: In **AI / Script**, choose **Long 8m (5 Acts · ~100 scenes)**, **Long 12m (7 Acts · ~147 scenes)**, or **Long 20m (10 Acts · ~220 scenes)**. The Director runs **Pass 1 (Master Story Outline + Locked Cast DNA)** followed by **Pass 2..N (Act-by-Act Lite Storyboard generation with rolling continuity)**. Afterward, use the **Act Sculptor** to **Regenerate Act N** (rewriting a single chapter with neighboring-act continuity & locked cast) or **+ Append Next Act** to extend any episode by +2–3 minutes.
2. **Auto-Chunked Long-Form Polish, Emotion Directing & Multi-Language Dubbing**: When an episode exceeds 26 scenes, **Polish Dialogue**, **AI Direct Emotions**, **Translate Episode Now**, and **Batch YouTube MLA** automatically chunk by chapter (~140s / <=24 beats per LLM call) so 100–250 beat scripts never hit the 48 KB prompt limit or suffer output truncation.
3. **Act-Grouped Timeline Navigation & Lazy LRU Voice RAM Cap**: Episodes with 2+ chapters or >24 scenes display an **Act/Chapter Jump Bar** above the storyboard strip with an \`MM:SS\` runtime clock. The audio engine maintains a **36-clip LRU decoded PCM cache** with automatic 4-beat prefetch and chapter-scoped offline decoding so 200+ voiced scenes stay smooth without exhausting browser RAM.
4. **Resumable, Rate-Limit-Safe Voiceover + Anthology Voice Carry-Over**: In **Voice Studio**, **Skip already-voiced scenes** is ON by default with HTTP 429 \`Retry-After\` backoff and **Voice Chapter N Only**. In **Channel Growth -> Anthology**, chaining your **Saved Vault Projects** or the **Current Stage** automatically remaps and carries over all saved voiceover audio clips onto the stitched anthology's new beat IDs!
5. **Long-Form Retention & YouTube Mid-Roll Ad-Break Planner**: In **Channel Growth -> Retention** and **Launch & MP4**, episodes ≥ 7.5–8 minutes automatically run stage/mood monotony checks and compute exact **Cliffhanger-Safe Mid-Roll Ad-Break Timestamps** placed cleanly at Act boundaries and dramatic pauses (included in the downloadable Launch Pack \`.txt\`).
6. **1-Click Server-Side Chapter Auto-Stitch (\`-14 LUFS\` Unified \`.MP4\`)**: In **Fast Render**, long-form episodes (>3.5 min) automatically enable **30 fps · Long-Form Cinema (5 Mbps)** and **Chaptered Long-Form Mode**. When server FFmpeg is ready, leave **1-Click Auto-Stitch into 1 Unified YouTube .MP4** checked to upload each finished chapter via \`/api/render-session/*\` and download one seamless 8–25 minute H.264/AAC \`-14 LUFS\` master directly from the browser (or use the downloadable FFmpeg stitch script / CLI \`node scripts/render-batch.mjs ch01.mp4 ch02.mp4 --concat full.mp4\`).

---

## 11. Headless Compiler CLI & API (For External LLM Agents & Batch Automation)
External AI agents, CI jobs, and power users can compile, heal, YPP-audit, retention-optimize, and generate \`.SRT\` captions from Lite or Full episode JSON programmatically without opening the browser UI:
- **CLI (File Mode)**:
  \`\`\`bash
  npm run compile-episode -- story.json --out compiled.json --srt story.srt --audit --fix-ypp --fix-retention
  \`\`\`
- **CLI (Stdin JSON Mode)**:
  \`\`\`bash
  cat story.json | npx tsx scripts/compile-episode.ts --stdin --fix-ypp --fix-retention
  \`\`\`
- **HTTP API (Dev / Full-Stack Server)**:
  \`POST /api/episodes/compile\` with JSON body \`{ "input": <liteOrFullEpisodeOrRawLlmText>, "fixYpp": true, "fixRetention": true }\` returns \`{ ok, episode, summary, yppAudit, retentionAudit, chapters, youtubeChaptersText, midRollTimestampsText, srt }\`.

${buildLlmTierDocumentationMarkdown()}
`;
}
