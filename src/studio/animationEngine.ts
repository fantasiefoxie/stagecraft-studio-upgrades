/**
 * Katha Studio — Transformative Animation, Kinematics & Style-Grammar Engine
 *
 * Powers all 10 evolution pillars deterministically (pure functions of t, u, beat, style):
 *  - Step 1: 3-Plane Depth Parallax camera math & foreground framing elements
 *  - Step 3: Per-archetype Kinematic Profiles across all 40 cast archetypes
 *  - Step 4: 12-Principles Pose Curves (anticipation, action smear, overshoot, settle)
 *  - Step 5: 2-Bone Articulated Arm Kinematics & live wrist-anchor transform export
 *  - Step 7: Style-Native Animation Grammars across all 10 art engines
 *  - Step 8: SFX-Synced Micro-Choreography (hit-stop, lightning, clash sparks, acoustic rings)
 *  - Step 9: Dynamic Environmental Lighting & grounded actor shadows
 */
import {
  ArchetypeId,
  CameraMoveId,
  ExpressionId,
  MoodId,
  MotionCadenceId,
  MotionId,
  MotionProfileId,
  PoseId,
  RenderStyleId,
  StageId,
  StoryBeat,
} from './types';
import type { MoodPalette } from './renderAssets';
import {
  computeFollowThroughTime,
  cubicBezier,
  dampedOvershoot,
  resolveMotionProfileSpec,
  volumeConservingSquash,
} from './animationPrinciples';

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

// =========================================================================
// STEP 7: STYLE-NATIVE ANIMATION GRAMMARS (All 10 Art Engines Move Uniquely)
// =========================================================================
export interface StyleAnimationGrammar {
  fps: number;
  lineBoilPx: number;
  rodPuppetMode: boolean;
  lampFlicker: number;
  inkBloom: number;
  paperSlideTrack: boolean;
  sunbeamSweep: boolean;
  giltShimmer: number;
  snappyPoseBlend: number; // 0 = fluid, 1 = stepped puppet snap
}

const STYLE_GRAMMARS: Record<RenderStyleId, StyleAnimationGrammar> = {
  chiaroscuro: {
    fps: 24,
    lineBoilPx: 0,
    rodPuppetMode: false,
    lampFlicker: 0,
    inkBloom: 0,
    paperSlideTrack: false,
    sunbeamSweep: false,
    giltShimmer: 0,
    snappyPoseBlend: 0,
  },
  shadow_puppetry: {
    fps: 16,
    lineBoilPx: 0.6,
    rodPuppetMode: true,
    lampFlicker: 0.24,
    inkBloom: 0,
    paperSlideTrack: false,
    sunbeamSweep: false,
    giltShimmer: 0,
    snappyPoseBlend: 0.65,
  },
  lineless_vector: {
    fps: 30,
    lineBoilPx: 0,
    rodPuppetMode: false,
    lampFlicker: 0,
    inkBloom: 0,
    paperSlideTrack: false,
    sunbeamSweep: false,
    giltShimmer: 0,
    snappyPoseBlend: 0,
  },
  woodblock_print: {
    fps: 10,
    lineBoilPx: 1.45,
    rodPuppetMode: false,
    lampFlicker: 0,
    inkBloom: 0,
    paperSlideTrack: false,
    sunbeamSweep: false,
    giltShimmer: 0,
    snappyPoseBlend: 0.4,
  },
  stained_glass: {
    fps: 18,
    lineBoilPx: 0,
    rodPuppetMode: false,
    lampFlicker: 0,
    inkBloom: 0,
    paperSlideTrack: false,
    sunbeamSweep: true,
    giltShimmer: 0.35,
    snappyPoseBlend: 0.2,
  },
  papercraft_diorama: {
    fps: 18,
    lineBoilPx: 0.35,
    rodPuppetMode: false,
    lampFlicker: 0,
    inkBloom: 0,
    paperSlideTrack: true,
    sunbeamSweep: false,
    giltShimmer: 0,
    snappyPoseBlend: 0.45,
  },
  sumi_e_wash: {
    fps: 20,
    lineBoilPx: 0.8,
    rodPuppetMode: false,
    lampFlicker: 0,
    inkBloom: 0.85,
    paperSlideTrack: false,
    sunbeamSweep: false,
    giltShimmer: 0,
    snappyPoseBlend: 0.1,
  },
  greek_amphora: {
    fps: 14,
    lineBoilPx: 0.65,
    rodPuppetMode: false,
    lampFlicker: 0.08,
    inkBloom: 0,
    paperSlideTrack: false,
    sunbeamSweep: false,
    giltShimmer: 0.2,
    snappyPoseBlend: 0.5,
  },
  kente_tapestry: {
    fps: 15,
    lineBoilPx: 0.55,
    rodPuppetMode: false,
    lampFlicker: 0,
    inkBloom: 0,
    paperSlideTrack: false,
    sunbeamSweep: false,
    giltShimmer: 0.3,
    snappyPoseBlend: 0.35,
  },
  illuminated_codex: {
    fps: 12,
    lineBoilPx: 0.7,
    rodPuppetMode: false,
    lampFlicker: 0,
    inkBloom: 0,
    paperSlideTrack: false,
    sunbeamSweep: false,
    giltShimmer: 0.72,
    snappyPoseBlend: 0.35,
  },
  anime_cel: {
    fps: 24,
    lineBoilPx: 0.4,
    rodPuppetMode: false,
    lampFlicker: 0,
    inkBloom: 0.12,
    paperSlideTrack: false,
    sunbeamSweep: true,
    giltShimmer: 0.18,
    snappyPoseBlend: 0.65,
  },
  manga_screentone: {
    fps: 24,
    lineBoilPx: 1.1,
    rodPuppetMode: false,
    lampFlicker: 0,
    inkBloom: 0.25,
    paperSlideTrack: false,
    sunbeamSweep: false,
    giltShimmer: 0,
    snappyPoseBlend: 0.85,
  },
  blueprint_technical: {
    fps: 60,
    lineBoilPx: 0,
    rodPuppetMode: false,
    lampFlicker: 0,
    inkBloom: 0,
    paperSlideTrack: false,
    sunbeamSweep: false,
    giltShimmer: 0,
    snappyPoseBlend: 0.5,
  },
  gouache_storybook: {
    fps: 24,
    lineBoilPx: 0.75,
    rodPuppetMode: false,
    lampFlicker: 0.08,
    inkBloom: 0.15,
    paperSlideTrack: false,
    sunbeamSweep: true,
    giltShimmer: 0.12,
    snappyPoseBlend: 0.3,
  },
  neon_cybernoir: {
    fps: 60,
    lineBoilPx: 0,
    rodPuppetMode: false,
    lampFlicker: 0.28,
    inkBloom: 0,
    paperSlideTrack: false,
    sunbeamSweep: true,
    giltShimmer: 0.32,
    snappyPoseBlend: 0.55,
  },
  felt_puppet: {
    fps: 12,
    lineBoilPx: 0.65,
    rodPuppetMode: true,
    lampFlicker: 0.06,
    inkBloom: 0,
    paperSlideTrack: true,
    sunbeamSweep: false,
    giltShimmer: 0,
    snappyPoseBlend: 0.78,
  },
  risograph_print: {
    fps: 12,
    lineBoilPx: 1.25,
    rodPuppetMode: false,
    lampFlicker: 0,
    inkBloom: 0.18,
    paperSlideTrack: false,
    sunbeamSweep: false,
    giltShimmer: 0,
    snappyPoseBlend: 0.8,
  },
  backlit_sand: {
    fps: 15,
    lineBoilPx: 0.5,
    rodPuppetMode: false,
    lampFlicker: 0.34,
    inkBloom: 0.3,
    paperSlideTrack: false,
    sunbeamSweep: true,
    giltShimmer: 0.22,
    snappyPoseBlend: 0.25,
  },
  scratchboard_noir: {
    fps: 15,
    lineBoilPx: 1.05,
    rodPuppetMode: false,
    lampFlicker: 0.22,
    inkBloom: 0.15,
    paperSlideTrack: false,
    sunbeamSweep: false,
    giltShimmer: 0.15,
    snappyPoseBlend: 0.72,
  },
  byzantine_mosaic: {
    fps: 24,
    lineBoilPx: 0.35,
    rodPuppetMode: false,
    lampFlicker: 0.14,
    inkBloom: 0,
    paperSlideTrack: false,
    sunbeamSweep: true,
    giltShimmer: 0.88,
    snappyPoseBlend: 0.38,
  },
};

export function getStyleAnimationGrammar(style?: RenderStyleId): StyleAnimationGrammar {
  return STYLE_GRAMMARS[style || 'chiaroscuro'] || STYLE_GRAMMARS.chiaroscuro;
}

export function resolveEffectiveMotionFps(
  style?: RenderStyleId,
  cadence: MotionCadenceId = 'auto'
): number {
  if (cadence === '60fps') return 60;
  if (cadence === '24fps') return 24;
  if (cadence === '12fps') return 12;
  return getStyleAnimationGrammar(style).fps;
}

export function snapStyleTime(
  t: number,
  style?: RenderStyleId,
  cadence: MotionCadenceId = 'auto'
): number {
  const fps = resolveEffectiveMotionFps(style, cadence);
  if (fps >= 60) return t;
  return Math.floor(t * fps) / fps;
}

/**
 * Deterministic low-frequency atmospheric light modulation borrowed from Vetala Theatre:
 * gently breathes oil-lamp / lightbox warmth on classical/sand stages or subtle neon hum on cybernoir.
 */
export function computeDeterministicFlicker(
  timeSec: number,
  style?: RenderStyleId,
  mood?: MoodId
): number {
  const baseAmp = getStyleAnimationGrammar(style).lampFlicker;
  const moodBoost =
    mood === 'twilight_temple' || mood === 'crimson_wrath' || mood === 'midnight_banyan' ? 0.08 : 0;
  const amp = Math.min(0.42, baseAmp + moodBoost);
  if (amp <= 0.01) return 1;
  const wave =
    Math.sin(timeSec * 4.7) * 0.55 +
    Math.sin(timeSec * 11.3 + 1.4) * 0.3 +
    Math.cos(timeSec * 2.1 + 0.7) * 0.15;
  return 1 + wave * amp * 0.18;
}

// =========================================================================
// STEP 3: PER-ARCHETYPE KINEMATIC PROFILES (All 40 Cast Archetypes)
// =========================================================================
export type GaitClass = 'heavy' | 'predator' | 'agile' | 'ethereal' | 'martial' | 'regal' | 'folk';

export interface ArchetypeKinematics {
  gait: GaitClass;
  strideHz: number;
  strideAmp: number;
  bobAmp: number;
  squashAmp: number;
  breathHz: number;
  breathAmp: number;
  swayAmp: number;
  hoverAmp: number;
  capeDrag: number;
  armSwingAmp: number;
  postureLean: number;
}

const GAIT_DEFAULTS: Record<GaitClass, ArchetypeKinematics> = {
  heavy: {
    gait: 'heavy',
    strideHz: 4.3,
    strideAmp: 11,
    bobAmp: 4.5,
    squashAmp: 0.085,
    breathHz: 1.4,
    breathAmp: 2.6,
    swayAmp: 0.014,
    hoverAmp: 0,
    capeDrag: 1.2,
    armSwingAmp: 0.24,
    postureLean: 0.04,
  },
  predator: {
    gait: 'predator',
    strideHz: 6.4,
    strideAmp: 20,
    bobAmp: 3.2,
    squashAmp: 0.065,
    breathHz: 2.4,
    breathAmp: 2.0,
    swayAmp: 0.025,
    hoverAmp: 0,
    capeDrag: 1.0,
    armSwingAmp: 0.35,
    postureLean: 0.08,
  },
  agile: {
    gait: 'agile',
    strideHz: 9.2,
    strideAmp: 19,
    bobAmp: 9.5,
    squashAmp: 0.09,
    breathHz: 3.1,
    breathAmp: 1.8,
    swayAmp: 0.036,
    hoverAmp: 0,
    capeDrag: 1.35,
    armSwingAmp: 0.48,
    postureLean: 0.05,
  },
  ethereal: {
    gait: 'ethereal',
    strideHz: 4.8,
    strideAmp: 10,
    bobAmp: 2.5,
    squashAmp: 0.025,
    breathHz: 1.5,
    breathAmp: 2.4,
    swayAmp: 0.028,
    hoverAmp: 9.5,
    capeDrag: 1.55,
    armSwingAmp: 0.22,
    postureLean: -0.02,
  },
  martial: {
    gait: 'martial',
    strideHz: 7.4,
    strideAmp: 17,
    bobAmp: 5.8,
    squashAmp: 0.055,
    breathHz: 2.2,
    breathAmp: 1.9,
    swayAmp: 0.016,
    hoverAmp: 0,
    capeDrag: 1.25,
    armSwingAmp: 0.38,
    postureLean: 0.045,
  },
  regal: {
    gait: 'regal',
    strideHz: 5.8,
    strideAmp: 13,
    bobAmp: 3.6,
    squashAmp: 0.035,
    breathHz: 1.8,
    breathAmp: 1.9,
    swayAmp: 0.012,
    hoverAmp: 0,
    capeDrag: 1.3,
    armSwingAmp: 0.28,
    postureLean: -0.015,
  },
  folk: {
    gait: 'folk',
    strideHz: 7.1,
    strideAmp: 15,
    bobAmp: 6.2,
    squashAmp: 0.05,
    breathHz: 2.3,
    breathAmp: 1.8,
    swayAmp: 0.024,
    hoverAmp: 0,
    capeDrag: 0.9,
    armSwingAmp: 0.36,
    postureLean: 0.02,
  },
};

const ARCHETYPE_GAIT_MAP: Record<ArchetypeId, GaitClass> = {
  // Heavy titans & grounded figures
  elephant: 'heavy',
  bull: 'heavy',
  demon_king: 'heavy',
  yaksha: 'heavy',
  guard: 'heavy',
  tortoise: 'heavy',
  // Sinuous predators & reptiles
  lion: 'predator',
  tiger: 'predator',
  jackal: 'predator',
  fox: 'predator',
  wolf: 'predator',
  crocodile: 'predator',
  serpent: 'predator',
  // Agile / springy / winged fauna & nimble heroes
  monkey: 'agile',
  vanara_hero: 'agile',
  deer: 'agile',
  hare: 'agile',
  crow: 'agile',
  owl: 'agile',
  crane: 'agile',
  raven: 'agile',
  mouse: 'agile',
  dog: 'agile',
  spider: 'agile',
  child: 'agile',
  // Ethereal / divine / hovering
  spirit: 'ethereal',
  deva: 'ethereal',
  goddess: 'ethereal',
  statue_apsara: 'ethereal',
  // Martial warriors
  warrior: 'martial',
  knight: 'martial',
  samurai: 'martial',
  // Regal nobility
  king: 'regal',
  emperor: 'regal',
  queen: 'regal',
  // Folk, sages & court
  sage: 'folk',
  ascetic: 'folk',
  courtier: 'folk',
  merchant: 'folk',
  elder_woman: 'folk',
  // Wave 3: +20 Universal Archetypes
  detective: 'folk',
  scientist: 'folk',
  astronaut: 'heavy',
  cyber_hacker: 'agile',
  android: 'martial',
  mech_pilot: 'martial',
  wizard: 'regal',
  pirate_captain: 'martial',
  ninja: 'agile',
  viking: 'heavy',
  pharaoh: 'regal',
  vampire_lord: 'ethereal',
  dragon_kin: 'heavy',
  elf_archer: 'agile',
  dwarf_smith: 'heavy',
  ghost_phantom: 'ethereal',
  journalist: 'folk',
  street_musician: 'agile',
  cat_mascot: 'agile',
  robot_companion: 'ethereal',
  // Wave 5: World Mythology & Legends (10)
  zeus_thunderer: 'regal',
  athena_strategist: 'martial',
  anubis_guardian: 'regal',
  valkyrie_shieldmaiden: 'martial',
  kitsune_foxspirit: 'ethereal',
  sun_wukong_trickster: 'agile',
  quetzal_priest: 'regal',
  celtic_druid: 'folk',
  djinn_genie: 'ethereal',
  poseidon_tideking: 'regal',
  // Wave 5: Historical & Cultural Eras (10)
  roman_centurion: 'martial',
  spartan_hoplite: 'martial',
  renaissance_painter: 'folk',
  victorian_inventor: 'folk',
  wild_west_sheriff: 'martial',
  outlaw_bandit: 'agile',
  feudal_shogun: 'regal',
  maratha_commander: 'martial',
  silk_road_nomad: 'folk',
  caveman_hunter: 'heavy',
  // Wave 5: Modern Everyday & Civic (10)
  doctor_surgeon: 'folk',
  firefighter_rescuer: 'heavy',
  police_officer: 'martial',
  judge_magistrate: 'regal',
  lawyer_advocate: 'folk',
  school_teacher: 'folk',
  chef_culinary: 'agile',
  delivery_courier: 'agile',
  construction_engineer: 'heavy',
  farmer_grower: 'folk',
  // Wave 5: Media, Business & Explainer (10)
  ceo_founder: 'regal',
  podcast_host: 'folk',
  news_anchor: 'folk',
  stock_trader: 'agile',
  tech_developer: 'folk',
  influencer_vlogger: 'agile',
  historian_professor: 'folk',
  coach_mentor: 'martial',
  film_director: 'folk',
  esports_gamer: 'agile',
  // Wave 5: Sci-Fi, Cyberpunk & Space (10)
  bounty_hunter: 'martial',
  alien_diplomat: 'ethereal',
  cyborg_enforcer: 'heavy',
  time_traveler: 'agile',
  space_admiral: 'regal',
  drone_operator: 'folk',
  bio_geneticist: 'folk',
  wasteland_scavenger: 'agile',
  quantum_physicist: 'folk',
  ai_hologram: 'ethereal',
  // Wave 5: High Fantasy & RPG Classes (10)
  paladin_crusader: 'heavy',
  necromancer_mage: 'ethereal',
  alchemist_brewer: 'folk',
  shadow_rogue: 'agile',
  tavern_bard: 'agile',
  beast_ranger: 'agile',
  archmage_oracle: 'regal',
  goblin_tinkerer: 'agile',
  orc_warlord: 'heavy',
  celestial_angel: 'ethereal',
  // Wave 5: Dark Gothic, Horror & Folklore (10)
  werewolf_stalker: 'predator',
  plague_doctor: 'folk',
  mummy_sovereign: 'regal',
  witch_herbalist: 'ethereal',
  grim_reaper: 'ethereal',
  gargoyle_sentinel: 'heavy',
  banshee_wraith: 'ethereal',
  mad_scientist: 'agile',
  occult_investigator: 'folk',
  pumpkin_scarecrow: 'agile',
  // Wave 5: Wildlife & Prehistoric (10)
  trex_dinosaur: 'heavy',
  triceratops_dino: 'heavy',
  grizzly_bear: 'heavy',
  polar_penguin: 'folk',
  giant_panda: 'heavy',
  bald_eagle: 'agile',
  silverback_gorilla: 'heavy',
  desert_camel: 'folk',
  great_white_shark: 'predator',
  giant_octopus: 'predator',
  // Wave 5: Mythic Beasts & Companions (10)
  fire_phoenix: 'ethereal',
  frost_unicorn: 'regal',
  winged_griffin: 'predator',
  sea_mermaid: 'ethereal',
  sky_pegasus: 'ethereal',
  forest_treant: 'heavy',
  stone_golem: 'heavy',
  crystal_slime: 'agile',
  baby_dragon: 'agile',
  clockwork_automaton: 'heavy',
  // Wave 5: Kids, Sports & Entertainment (10)
  soccer_striker: 'agile',
  cricket_batter: 'agile',
  martial_artist: 'martial',
  circus_ringmaster: 'regal',
  stage_magician: 'agile',
  orchestra_conductor: 'regal',
  ballet_dancer: 'ethereal',
  skateboard_kid: 'agile',
  explorer_scout: 'agile',
  toy_nutcracker: 'martial',
};

export function getArchetypeKinematics(arch: ArchetypeId): ArchetypeKinematics {
  const gait = ARCHETYPE_GAIT_MAP[arch] || 'folk';
  const base = GAIT_DEFAULTS[gait];
  // Fine per-species signature overrides
  if (arch === 'elephant') {
    return { ...base, strideHz: 3.4, bobAmp: 5.5, squashAmp: 0.11 };
  }
  if (arch === 'tortoise') {
    return { ...base, strideHz: 2.8, strideAmp: 7, bobAmp: 2.2, squashAmp: 0.04 };
  }
  if (arch === 'spirit') {
    return { ...base, hoverAmp: 13.5, swayAmp: 0.045, capeDrag: 1.75 };
  }
  if (arch === 'vanara_hero' || arch === 'monkey') {
    return { ...base, strideHz: 9.8, bobAmp: 11.5, squashAmp: 0.105 };
  }
  if (arch === 'sage' || arch === 'elder_woman' || arch === 'ascetic') {
    return { ...base, strideHz: 4.9, strideAmp: 10, bobAmp: 3.2, breathHz: 1.45, postureLean: 0.05 };
  }
  if (arch === 'samurai') {
    return { ...base, strideHz: 6.6, bobAmp: 3.2, swayAmp: 0.008, postureLean: 0.06 };
  }
  if (arch === 'crow' || arch === 'owl' || arch === 'crane' || arch === 'raven') {
    return { ...base, hoverAmp: 6.5, bobAmp: 7.5, strideHz: 8.6 };
  }
  return base;
}

// =========================================================================
// STEP 4: 12-PRINCIPLES POSE ENVELOPES (Anticipation, Action Arc, Settle)
// =========================================================================
export interface PoseEnvelope {
  scaleX: number;
  scaleY: number;
  bodyTilt: number;
  offsetX: number;
  offsetY: number;
  strikePhase: number; // 0 = neutral, <0 = wind-up anticipation, >0 = forward strike
  smearAlpha: number;
  walkCycle: number;
  stride: number;
  bob: number;
}

export function computePoseEnvelope(
  pose: PoseId,
  motion: MotionId | undefined,
  u: number,
  ts: number,
  speechEnergy: number,
  kin: ArchetypeKinematics,
  seed: number,
  motionProfile?: MotionProfileId,
  renderStyle?: RenderStyleId
): PoseEnvelope {
  const cu = clamp(u, 0, 1);
  const spec = resolveMotionProfileSpec(motionProfile, renderStyle);
  const exag = spec.exaggeration;

  // Principle #1: accumulate stretchY cleanly and solve strict constant-volume (scaleX * scaleY === 1)
  let stretchY = 0;
  let bodyTilt =
    kin.postureLean +
    Math.sin(ts * kin.breathHz + seed * 0.19) * kin.swayAmp * (0.85 + 0.15 * exag);
  let offsetX = 0;
  let offsetY = 0;
  let strikePhase = 0;
  let smearAlpha = 0;

  // Naturalistic micro weight-shift (Principle #8 Secondary Action — living characters are never frozen)
  const weightShift = Math.sin(ts * (kin.breathHz * 0.45) + seed * 0.73);
  offsetX += weightShift * 1.6;
  bodyTilt += weightShift * 0.008;

  // Ethereal hover float (even in stand/gesture)
  if (kin.hoverAmp > 0 && pose !== 'hang_upside_down') {
    offsetY += Math.sin(ts * 2.3 + seed * 0.3) * kin.hoverAmp - kin.hoverAmp * 0.45;
  }

  // Walk cycle with volume-conserving squash-and-stretch on heel strike
  const isWalking =
    pose === 'walk' ||
    motion === 'enter_left' ||
    motion === 'enter_right' ||
    motion === 'cross_stage';
  const walkCycle = isWalking ? ts * kin.strideHz + seed * 0.2 : 0;
  const stride = isWalking ? Math.sin(walkCycle) * kin.strideAmp : 0;
  const rawStep = isWalking ? Math.abs(Math.sin(walkCycle)) : 0;
  const bob = isWalking ? -rawStep * kin.bobAmp : 0;

  if (isWalking) {
    // Contact squash at bottom of stride (-stretchY), vertical stretch at passing apex (+stretchY)
    const contactSquash = (0.42 - rawStep) * kin.squashAmp * exag;
    stretchY -= contactSquash * 0.72;
    bodyTilt += 0.055 + Math.cos(walkCycle) * 0.032;
  }

  // Attack: Principle #2 Anticipation wind-up -> Explosive smear strike -> Principle #5 Damped elastic overshoot & settle
  if (pose === 'attack') {
    const windupEnd = clamp(0.2 + spec.anticipationRatio * 0.35, 0.2, 0.27);
    const strikeEnd = windupEnd + 0.16;
    if (cu < windupEnd) {
      const p = cubicBezier(0.4, 0.0, 0.2, 1.0, cu / windupEnd);
      strikePhase = -p;
      bodyTilt -= 0.24 * p * exag;
      offsetX -= 14 * p * exag;
      stretchY -= 0.07 * p * exag;
    } else if (cu < strikeEnd) {
      const p = cubicBezier(0.18, 0.9, 0.3, 1.0, (cu - windupEnd) / (strikeEnd - windupEnd));
      strikePhase = lerp(-1, 1.25, p);
      bodyTilt += lerp(-0.24 * exag, 0.26 * exag, p);
      offsetX += lerp(-14 * exag, 24 * exag, p);
      stretchY += 0.08 * Math.sin(p * Math.PI) * exag;
      smearAlpha = Math.sin(p * Math.PI) * clamp(0.75 * exag, 0.45, 0.95);
    } else {
      const p = (cu - strikeEnd) / (1 - strikeEnd);
      const eased = cubicBezier(0.22, 1.0, 0.36, 1.0, p);
      const elastic = dampedOvershoot(
        p * 1.15,
        spec.overshootFreq,
        spec.overshootDecay,
        spec.overshootAmp * 1.4
      );
      strikePhase = lerp(1.25, 0.68, eased) + elastic * 0.85;
      bodyTilt += lerp(0.26, 0.14, eased) * exag + elastic * 0.38;
      offsetX += lerp(24, 12, eased) * exag + elastic * 10;
      stretchY -= elastic * 0.09;
    }
  } else if (pose === 'recoil') {
    // Sharp defensive jolt back (0..0.22) then cushioned stagger recovery with elastic settle
    if (cu < 0.22) {
      const p = cubicBezier(0.16, 1.0, 0.3, 1.0, cu / 0.22);
      bodyTilt -= 0.28 * p * exag;
      offsetX -= 22 * p * exag;
      stretchY -= 0.08 * p * exag;
    } else {
      const p = (cu - 0.22) / 0.78;
      const eased = cubicBezier(0.25, 0.1, 0.25, 1.0, p);
      const wobble = dampedOvershoot(p * 1.0, spec.overshootFreq * 0.85, spec.overshootDecay, spec.overshootAmp * 0.4);
      bodyTilt -= lerp(0.28, 0.14, eased) * exag - wobble * 0.25;
      offsetX -= lerp(22, 10, eased) * exag;
      stretchY -= lerp(0.08, 0.02, eased) * exag;
    }
  } else if (pose === 'soar') {
    bodyTilt = -0.36 + Math.sin(ts * 3.8 + seed) * 0.06;
    offsetY += Math.sin(ts * 4.4 + seed) * 10;
    stretchY += 0.045 * exag;
  } else if (pose === 'hang_upside_down') {
    bodyTilt = Math.PI + Math.sin(ts * 2.4 + seed) * 0.095;
    offsetY = -110;
  } else if (pose === 'kneel' || pose === 'sit') {
    const settle = cubicBezier(0.22, 1.0, 0.36, 1.0, clamp(cu / 0.22, 0, 1));
    const bounce =
      cu > 0.16
        ? dampedOvershoot((cu - 0.16) * 1.4, spec.overshootFreq, spec.overshootDecay, spec.overshootAmp * 0.35)
        : 0;
    offsetY += 26 * settle + bounce * 10;
    stretchY -= (0.045 * (1 - settle) + Math.abs(bounce) * 0.05) * exag;
  } else if (pose === 'gesture') {
    // Expressive dialogue accent tilt & volume-conserving pulse synced to voice peaks
    const pulse = speechEnergy > 0.15 ? Math.sin(ts * 8.2 + seed) * speechEnergy : 0;
    bodyTilt += 0.045 + pulse * 0.048 * exag;
    stretchY += pulse * 0.032 * exag;
  }

  // Leap anticipation crouch -> airborne stretch -> landing compression + elastic recovery
  if (motion === 'leap_arc') {
    const crouchEnd = clamp(spec.anticipationRatio, 0.08, 0.15);
    if (cu < crouchEnd) {
      const p = Math.sin((cu / crouchEnd) * Math.PI);
      stretchY -= 0.14 * p * exag;
      offsetY += 11 * p * exag;
    } else if (cu > 0.85) {
      const landU = (cu - 0.85) / 0.15;
      const p = Math.sin(landU * Math.PI);
      const rebound = dampedOvershoot(landU * 0.9, spec.overshootFreq, spec.overshootDecay, spec.overshootAmp * 0.5);
      stretchY -= (0.15 * p - rebound * 0.08) * exag;
      offsetY += 12 * p * exag;
    } else {
      const airU = (cu - crouchEnd) / (0.85 - crouchEnd);
      stretchY += (0.075 * Math.sin(airU * Math.PI) + 0.02) * exag;
      bodyTilt += lerp(-0.15, 0.17, airU);
    }
  }

  // Subtle breathing volume conservation
  const breath = Math.sin(ts * kin.breathHz + seed * 0.17);
  stretchY += breath * 0.013;

  const { scaleX, scaleY } = volumeConservingSquash(stretchY);

  return {
    scaleX,
    scaleY,
    bodyTilt,
    offsetX,
    offsetY,
    strikePhase,
    smearAlpha,
    walkCycle,
    stride,
    bob,
  };
}

// =========================================================================
// STEP 5: 2-BONE ARTICULATED ARM KINEMATICS & LIVE WRIST EXPORT
// =========================================================================
export interface ArticulatedArmPose {
  shoulderX: number;
  shoulderY: number;
  shoulderAngle: number;
  elbowAngle: number;
  upperLen: number;
  forearmLen: number;
  elbowX: number;
  elbowY: number;
  wristX: number;
  wristY: number;
  handAngle: number;
}

export interface ActorArmRig {
  front: ArticulatedArmPose;
  back: ArticulatedArmPose;
}

function solveTwoBoneArm(
  sx: number,
  sy: number,
  shoulderAngle: number,
  elbowAngle: number,
  upperLen: number,
  forearmLen: number
): ArticulatedArmPose {
  // Local arm segments point down (+Y) at angle 0, rotating via Canvas ctx.rotate(angle)
  const ex = sx - Math.sin(shoulderAngle) * upperLen;
  const ey = sy + Math.cos(shoulderAngle) * upperLen;
  const totalAngle = shoulderAngle + elbowAngle;
  const wx = ex - Math.sin(totalAngle) * forearmLen;
  const wy = ey + Math.cos(totalAngle) * forearmLen;
  return {
    shoulderX: sx,
    shoulderY: sy,
    shoulderAngle,
    elbowAngle,
    upperLen,
    forearmLen,
    elbowX: ex,
    elbowY: ey,
    wristX: wx,
    wristY: wy,
    handAngle: totalAngle,
  };
}

export function computeActorArmRig(
  pose: PoseId,
  expression: ExpressionId,
  envelope: PoseEnvelope,
  ts: number,
  speechEnergy: number,
  kin: ArchetypeKinematics,
  seed: number,
  chestRise: number,
  motionProfile?: MotionProfileId,
  renderStyle?: RenderStyleId
): ActorArmRig {
  const spec = resolveMotionProfileSpec(motionProfile, renderStyle);
  // Principle #5 Follow-Through & Overlapping Action (4-8 frame lag on forearms & back arm)
  const lagTs = computeFollowThroughTime(ts, spec.followThroughFrames, 60);
  const breath = Math.sin(ts * kin.breathHz + seed * 0.17);
  const lagBreath = Math.sin(lagTs * kin.breathHz + seed * 0.17 + spec.asymmetryRad);
  const talkPulse = speechEnergy > 0.14 ? Math.sin(ts * 8.4 + seed) * speechEnergy : 0;
  const lagTalkPulse =
    speechEnergy > 0.14 ? Math.sin(lagTs * 8.4 + seed + spec.asymmetryRad) * speechEnergy : 0;
  const isWalking = envelope.walkCycle !== 0;

  // Back arm (intentionally offset in phase to eliminate robotic twinning — Principle #11)
  let backShoulder = 0.2 + lagBreath * 0.05;
  let backElbow = -0.22 - lagBreath * 0.04;
  if (isWalking) {
    backShoulder = -Math.sin(envelope.walkCycle - 0.16) * kin.armSwingAmp + 0.18;
    backElbow = -0.35 - Math.max(0, -Math.sin(envelope.walkCycle - 0.35)) * 0.22;
  } else if (pose === 'attack') {
    // Counter-balance arm pulls back during strike
    backShoulder = lerp(-0.4, 0.55, clamp((envelope.strikePhase + 1) * 0.5, 0, 1));
    backElbow = -0.5;
  } else if (pose === 'gesture') {
    backShoulder = 0.24 + lagTalkPulse * 0.16;
    backElbow = -0.35 - Math.abs(lagTalkPulse) * 0.22;
  } else if (pose === 'recoil') {
    backShoulder = -1.45;
    backElbow = -0.9;
  } else if (pose === 'soar') {
    backShoulder = 0.72 + Math.sin(lagTs * 3.8 + seed) * 0.06;
    backElbow = -0.25;
  }

  // Front arm (primary acting & prop-wielding hand with forearm follow-through lag!)
  let frontShoulder = -0.22 - breath * 0.04 - speechEnergy * 0.12;
  let frontElbow = -0.34 - speechEnergy * 0.16 - lagBreath * 0.03;

  if (pose === 'attack') {
    // Full wind-up overhead (-2.35 rad) -> blazing diagonal cleave (-0.42 rad)
    const p = clamp((envelope.strikePhase + 1) / 2.25, 0, 1);
    frontShoulder = lerp(-2.35, -0.52, p);
    frontElbow = lerp(-0.85, -0.14, p);
  } else if (pose === 'gesture') {
    const expressBoost = expression === 'angry' || expression === 'shocked' ? -0.35 : 0;
    frontShoulder = -1.18 + expressBoost + talkPulse * 0.34 + Math.sin(ts * 3.1 + seed) * 0.1;
    frontElbow = -0.52 - Math.abs(lagTalkPulse) * 0.4;
  } else if (pose === 'recoil') {
    frontShoulder = -1.78 + Math.sin(ts * 9 + seed) * 0.08;
    frontElbow = -1.15 + Math.sin(lagTs * 9 + seed) * 0.06;
  } else if (pose === 'soar') {
    frontShoulder = -2.15 + Math.sin(ts * 4 + seed) * 0.08;
    frontElbow = -0.22 + Math.sin(lagTs * 4 + seed) * 0.05;
  } else if (isWalking) {
    frontShoulder = Math.sin(envelope.walkCycle) * kin.armSwingAmp - 0.15;
    frontElbow = -0.32 - Math.max(0, Math.sin(envelope.walkCycle - 0.35)) * 0.28;
  } else if (pose === 'sit' || pose === 'kneel') {
    frontShoulder = -0.42 + talkPulse * 0.2;
    frontElbow = -0.82 - lagTalkPulse * 0.2;
  }

  return {
    back: solveTwoBoneArm(-15, -112 + chestRise, backShoulder, backElbow, 22, 22),
    front: solveTwoBoneArm(16, -112 + chestRise, frontShoulder, frontElbow, 23, 22),
  };
}

// =========================================================================
// STEP 8: SFX-SYNCED MICRO-CHOREOGRAPHY (Hit-Stop, Lightning, Clash Sparks)
// =========================================================================
export interface SfxChoreographyState {
  active: boolean;
  sfx: StoryBeat['sfx'];
  deltaSec: number; // time since SFX trigger (negative before trigger)
  hitStopActive: boolean;
  effectiveTime: number;
  flashAlpha: number;
  flashColor: string;
  shockwaveProgress: number; // 0..1 or -1
  sparkBurstProgress: number; // 0..1 or -1
  lightningAlpha: number;
  shakeX: number;
  shakeY: number;
  crowdStartle: number; // 0..1
  rimBoost: number; // 0..1
}

export function computeSfxChoreography(
  beat: StoryBeat,
  localT: number,
  globalT: number
): SfxChoreographyState {
  const sfx = beat.sfx || 'none';
  const base: SfxChoreographyState = {
    active: false,
    sfx,
    deltaSec: -1,
    hitStopActive: false,
    effectiveTime: globalT,
    flashAlpha: 0,
    flashColor: '#ffffff',
    shockwaveProgress: -1,
    sparkBurstProgress: -1,
    lightningAlpha: 0,
    shakeX: 0,
    shakeY: 0,
    crowdStartle: 0,
    rimBoost: 0,
  };
  if (sfx === 'none') return base;

  const dur = Math.max(1.2, beat.duration);
  const triggerSec =
    typeof beat.sfxOffsetSec === 'number' && Number.isFinite(beat.sfxOffsetSec) && beat.sfxOffsetSec > 0
      ? clamp(beat.sfxOffsetSec, 0, Math.max(0.1, dur - 0.15))
      : Math.min(0.65, dur * 0.22);

  const dt = localT - triggerSec;
  if (dt < 0 || dt > 1.35) return base;

  base.active = true;
  base.deltaSec = dt;

  if (sfx === 'sword_clash') {
    // 3-frame hit-stop (0.05s) + sparks + metallic flash + punchy shake
    if (dt < 0.055) {
      base.hitStopActive = true;
      base.effectiveTime = globalT - dt;
      base.flashAlpha = 0.28;
      base.flashColor = '#fff2c2';
    }
    if (dt < 0.42) {
      base.sparkBurstProgress = dt / 0.42;
      base.rimBoost = 1 - dt / 0.42;
      const decay = 1 - dt / 0.42;
      base.shakeX = Math.sin(dt * 95) * 10 * decay;
      base.shakeY = Math.cos(dt * 110) * 6 * decay;
    }
    base.crowdStartle = dt < 0.65 ? Math.sin((dt / 0.65) * Math.PI) * 0.75 : 0;
  } else if (sfx === 'thunder_crack') {
    // Double-pulse lightning fork + sky/actor silhouette flash + rumble
    if (dt < 0.14 || (dt > 0.2 && dt < 0.29)) {
      base.lightningAlpha = dt < 0.14 ? 1 - dt / 0.14 : 0.75 * (1 - (dt - 0.2) / 0.09);
      base.flashAlpha = base.lightningAlpha * 0.34;
      base.flashColor = '#dceeff';
      base.rimBoost = base.lightningAlpha;
    }
    if (dt < 0.65) {
      const decay = 1 - dt / 0.65;
      base.shakeX = Math.sin(dt * 72) * 12 * decay;
      base.shakeY = Math.cos(dt * 84) * 9 * decay;
    }
    base.crowdStartle = dt < 0.85 ? Math.sin((dt / 0.85) * Math.PI) : 0;
  } else if (sfx === 'temple_bell' || sfx === 'shankha_conch' || sfx === 'mystic_chime') {
    if (dt < 0.95) {
      base.shockwaveProgress = dt / 0.95;
      base.rimBoost = (1 - dt / 0.95) * 0.65;
    }
  } else if (sfx === 'court_gasp') {
    base.crowdStartle = dt < 0.9 ? Math.sin((dt / 0.9) * Math.PI) : 0;
    if (dt < 0.28) {
      base.shakeY = -Math.sin((dt / 0.28) * Math.PI) * 4;
    }
  } else if (sfx === 'arrow_whoosh') {
    if (dt < 0.35) {
      base.sparkBurstProgress = dt / 0.35;
    }
    base.crowdStartle = dt < 0.5 ? Math.sin((dt / 0.5) * Math.PI) * 0.6 : 0;
  } else if (sfx === 'wooden_gavel') {
    if (dt < 0.04) {
      base.hitStopActive = true;
      base.effectiveTime = globalT - dt;
    }
    if (dt < 0.3) {
      const decay = 1 - dt / 0.3;
      base.shakeY = Math.cos(dt * 90) * 8 * decay;
      base.shockwaveProgress = dt / 0.3;
    }
  } else if (sfx === 'fire_crackle') {
    base.rimBoost = 0.45 * Math.sin((dt / 1.35) * Math.PI);
  }

  return base;
}

export function drawSfxVisualEffects(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  choreo: SfxChoreographyState,
  anchorX: number,
  anchorY: number,
  s: number
): void {
  if (!choreo.active) return;

  ctx.save();

  // 1. Lightning Fork (thunder_crack)
  if (choreo.lightningAlpha > 0.02) {
    const lx = w * 0.68;
    ctx.strokeStyle = `rgba(235, 248, 255, ${choreo.lightningAlpha})`;
    ctx.shadowColor = '#8fd0ff';
    ctx.shadowBlur = 24 * s;
    ctx.lineWidth = 4.2 * s;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx - 26 * s, h * 0.16);
    ctx.lineTo(lx + 14 * s, h * 0.28);
    ctx.lineTo(lx - 38 * s, h * 0.46);
    ctx.lineTo(lx + 4 * s, h * 0.62);
    ctx.stroke();

    // Branch fork
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(lx + 14 * s, h * 0.28);
    ctx.lineTo(lx + 62 * s, h * 0.44);
    ctx.stroke();
  }

  // 2. Concentric Golden Acoustic Rings (temple_bell / shankha_conch / mystic_chime / wooden_gavel)
  if (choreo.shockwaveProgress >= 0 && choreo.shockwaveProgress <= 1) {
    const p = choreo.shockwaveProgress;
    const alpha = (1 - p) * 0.55;
    const isMystic = choreo.sfx === 'mystic_chime' || choreo.sfx === 'shankha_conch';
    ctx.strokeStyle = isMystic
      ? `rgba(142, 232, 255, ${alpha})`
      : `rgba(255, 214, 92, ${alpha})`;
    ctx.lineWidth = (3.5 * (1 - p) + 1) * s;
    for (let ring = 0; ring < 2; ring++) {
      const rp = clamp(p - ring * 0.14, 0, 1);
      if (rp <= 0) continue;
      ctx.beginPath();
      ctx.arc(anchorX, anchorY, (22 + rp * 260) * s, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 3. Directional Clash Spark Burst / Arrow Wind Streak
  if (choreo.sparkBurstProgress >= 0 && choreo.sparkBurstProgress <= 1) {
    const p = choreo.sparkBurstProgress;
    const alpha = 1 - p;
    if (choreo.sfx === 'arrow_whoosh') {
      const sx = lerp(-w * 0.1, w * 1.1, p);
      const sy = h * 0.46;
      const grad = ctx.createLinearGradient(sx - 180 * s, sy, sx, sy);
      grad.addColorStop(0, 'rgba(255, 240, 200, 0)');
      grad.addColorStop(1, `rgba(255, 242, 210, ${alpha * 0.85})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 4 * s;
      ctx.beginPath();
      ctx.moveTo(sx - 180 * s, sy);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    } else {
      // Crisp 10-ray metallic impact sparks radiating from contact point
      ctx.strokeStyle = `rgba(255, 230, 128, ${alpha})`;
      ctx.lineWidth = 2.6 * s;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + 0.23;
        const r0 = (12 + p * 65) * s;
        const r1 = (38 + p * 145) * s;
        ctx.beginPath();
        ctx.moveTo(anchorX + Math.cos(a) * r0, anchorY + Math.sin(a) * r0);
        ctx.lineTo(anchorX + Math.cos(a) * r1, anchorY + Math.sin(a) * r1);
        ctx.stroke();
      }
      // Bright impact core star
      if (p < 0.4) {
        ctx.fillStyle = `rgba(255, 252, 224, ${(1 - p / 0.4) * 0.9})`;
        ctx.beginPath();
        ctx.arc(anchorX, anchorY, (18 * (1 - p / 0.4)) * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 4. Brief Exposure Flash
  if (choreo.flashAlpha > 0.01) {
    ctx.globalAlpha = choreo.flashAlpha;
    ctx.fillStyle = choreo.flashColor;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.restore();
}

// =========================================================================
// STEP 9: DYNAMIC ENVIRONMENTAL LIGHTING & GROUNDED ACTOR SHADOWS
// =========================================================================
export interface SceneLightingState {
  warmFlicker: number; // 0..1
  causticShimmer: number; // 0..1
  lightningBoost: number; // 0..1
  shadowSkewX: number; // directional ground shadow slant
  rimColor: string;
}

export function computeSceneLighting(
  beat: StoryBeat,
  t: number,
  sfxChoreo: SfxChoreographyState,
  styleGrammar: StyleAnimationGrammar
): SceneLightingState {
  const hasFire =
    beat.prop === 'sacred_fire' ||
    beat.prop === 'diya_lamp' ||
    beat.prop === 'sun_orb' ||
    beat.weather === 'embers' ||
    beat.stage === 'cremation_ground' ||
    beat.stage === 'royal_durbar' ||
    beat.stage === 'cave_den' ||
    beat.stage === 'royal_dungeon' ||
    beat.stage === 'kali_temple';

  const hasWater =
    beat.stage === 'enchanted_lake' ||
    beat.stage === 'river_ghat' ||
    beat.stage === 'ocean_ship' ||
    beat.stage === 'tropical_archipelago' ||
    beat.stage === 'mughal_courtyard' ||
    beat.prop === 'lotus_pond';

  const fireWave = 0.55 + 0.25 * Math.sin(t * 9.3) + 0.2 * Math.sin(t * 17.1);
  const warmFlicker = clamp(
    (hasFire ? fireWave * 0.52 : 0) + styleGrammar.lampFlicker * (0.6 + 0.4 * Math.sin(t * 11.4)),
    0,
    1
  );
  const causticShimmer = hasWater ? 0.35 + 0.25 * Math.sin(t * 3.6) : 0;
  const shadowSkewX = beat.lightSide === 'right' ? -0.42 : 0.42;

  return {
    warmFlicker,
    causticShimmer,
    lightningBoost: sfxChoreo.lightningAlpha,
    shadowSkewX,
    rimColor:
      sfxChoreo.lightningAlpha > 0.1
        ? '#d9f0ff'
        : warmFlicker > 0.25
          ? '#ffb84d'
          : causticShimmer > 0.2
            ? '#7ce6ff'
            : '#f2c85b',
  };
}

export function drawDynamicSceneRelighting(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  lighting: SceneLightingState,
  beat: StoryBeat,
  t: number,
  s: number
): void {
  // Subtle reactive warm firelight bounce from floor/hearth
  if (lighting.warmFlicker > 0.08) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const fx = beat.propSlot === 'left' ? w * 0.28 : beat.propSlot === 'right' ? w * 0.72 : w * 0.5;
    const fy = h * 0.78;
    const r = (240 + Math.sin(t * 11.3) * 26) * s;
    const grad = ctx.createRadialGradient(fx, fy, 12 * s, fx, fy, r);
    grad.addColorStop(0, `rgba(255, 168, 64, ${lighting.warmFlicker * 0.22})`);
    grad.addColorStop(0.55, `rgba(255, 110, 32, ${lighting.warmFlicker * 0.08})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Cool aquatic caustic shimmer bands rising from water stages
  if (lighting.causticShimmer > 0.08) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const grad = ctx.createLinearGradient(0, h * 0.58, 0, h);
    grad.addColorStop(0, 'rgba(110, 224, 255, 0)');
    grad.addColorStop(1, `rgba(110, 224, 255, ${lighting.causticShimmer * 0.16})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, h * 0.58, w, h * 0.42);
    ctx.restore();
  }
}

// =========================================================================
// STEP 1: 3-PLANE CAMERA PARALLAX MATH & FOREGROUND FRAMING SILHOUETTES
// =========================================================================
export interface CameraTransform {
  zoom: number;
  panX: number;
  panY: number;
}

export function computeCameraTransform(
  w: number,
  h: number,
  baseZoom: number,
  move: CameraMoveId | undefined,
  u: number,
  t: number,
  sfxChoreo?: SfxChoreographyState,
  motionProfile?: MotionProfileId,
  renderStyle?: RenderStyleId
): CameraTransform {
  const m = move || 'still';
  const spec = resolveMotionProfileSpec(motionProfile, renderStyle);
  const [cx1, cy1, cx2, cy2] = spec.cameraBezier;
  // Principle #6 Slow In / Slow Out cubic-bezier camera cushion (replaces uniform/flat ramps)
  const su = cubicBezier(cx1, cy1, cx2, cy2, clamp(u, 0, 1));
  let zoom = lerp(baseZoom, baseZoom + 0.06, su);
  let panX = 0;
  let panY = 0;

  if (m === 'slow_push') {
    zoom = lerp(baseZoom, baseZoom + 0.18, su);
  } else if (m === 'slow_pull') {
    zoom = lerp(baseZoom + 0.16, baseZoom, su);
  } else if (m === 'pan_left') {
    zoom = baseZoom + 0.12;
    panX = lerp(-w * 0.055, w * 0.055, su);
  } else if (m === 'pan_right') {
    zoom = baseZoom + 0.12;
    panX = lerp(w * 0.055, -w * 0.055, su);
  } else if (m === 'impact_shake') {
    const decay = Math.max(0, 1 - u * 1.9);
    const amp = 14 * decay;
    panX = Math.sin(t * 62) * amp;
    panY = Math.cos(t * 78) * amp * 0.7;
    zoom = baseZoom + 0.06 * decay;
  }

  if (sfxChoreo) {
    panX += sfxChoreo.shakeX;
    panY += sfxChoreo.shakeY;
  }

  return { zoom, panX, panY };
}

export function applyParallaxCamera(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cam: CameraTransform,
  depthFactor: number
): void {
  const planeZoom = 1 + (cam.zoom - 1) * depthFactor;
  const planePanX = cam.panX * depthFactor;
  const planePanY = cam.panY * depthFactor;
  ctx.translate(w / 2 + planePanX, h / 2 + planePanY);
  ctx.scale(planeZoom, planeZoom);
  ctx.translate(-w / 2, -h / 2);
}

/**
 * Draws stage-specific foreground depth silhouettes on the 1.38x parallax plane
 * (overhanging banyan leaves, palace columns, bamboo fronds, temple chains, rock arches, etc.)
 * so camera pushes/pans create unmistakable 2.5D depth without ever obscuring center actors.
 */
export function drawStageForegroundDepthLayer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stage: StageId,
  pal: MoodPalette,
  t: number
): void {
  const s = Math.min(w, h) / 620;
  const sway = Math.sin(t * 1.65) * 9 * s;
  const sway2 = Math.cos(t * 1.35 + 1.1) * 7 * s;

  ctx.save();
  ctx.fillStyle = '#04060e';
  ctx.globalAlpha = 0.78;

  if (
    stage === 'banyan_clearing' ||
    stage === 'ashoka_vatika' ||
    stage === 'palace_garden' ||
    stage === 'enchanted_cottage' ||
    stage === 'savanna_baobab'
  ) {
    // Overhanging organic foliage bough upper-left + low corner fern/grass tufts
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.24 + sway, 0);
    ctx.quadraticCurveTo(w * 0.14 + sway * 0.7, h * 0.14, 0, h * 0.22 + sway2 * 0.5);
    ctx.closePath();
    ctx.fill();

    // Lower foreground grass/fern blades sweeping bottom corners
    for (const side of [-1, 1]) {
      const bx = side < 0 ? w * 0.03 : w * 0.97;
      for (let i = 0; i < 4; i++) {
        const lean = side * (16 + i * 11) * s + sway * (0.4 + i * 0.12);
        ctx.beginPath();
        ctx.moveTo(bx - 10 * s, h + 6);
        ctx.quadraticCurveTo(bx + lean * 0.5, h - (46 + i * 14) * s, bx + lean, h - (74 + i * 16) * s);
        ctx.quadraticCurveTo(bx + lean * 0.3, h - (32 + i * 10) * s, bx + 10 * s, h + 6);
        ctx.closePath();
        ctx.fill();
      }
    }
  } else if (stage === 'bamboo_forest' || stage === 'bamboo_pagoda') {
    // Bold close-up foreground bamboo stalks swaying faster on extreme edges
    for (const [bx, thick] of [
      [w * 0.025, 18 * s],
      [w * 0.97, 20 * s],
    ]) {
      ctx.strokeStyle = '#050a08';
      ctx.lineWidth = thick;
      ctx.beginPath();
      ctx.moveTo(bx, h + 10);
      ctx.quadraticCurveTo(bx + sway * 0.8, h * 0.5, bx + sway * 1.5, -10);
      ctx.stroke();
    }
  } else if (
    stage === 'royal_durbar' ||
    stage === 'mughal_courtyard' ||
    stage === 'royal_bedchamber' ||
    stage === 'golden_lanka' ||
    stage === 'olympus_acropolis'
  ) {
    // Monumental framing pillar edges + draped silk valance corners
    ctx.fillRect(0, 0, w * 0.032, h);
    ctx.fillRect(w * 0.968, 0, w * 0.032, h);
    ctx.fillStyle = pal.rimLight;
    ctx.globalAlpha = 0.22;
    ctx.fillRect(w * 0.032, 0, 3 * s, h);
    ctx.fillRect(w * 0.968 - 3 * s, 0, 3 * s, h);
  } else if (stage === 'cave_den' || stage === 'royal_dungeon' || stage === 'red_canyon_mesa') {
    // Jagged framing cave stalactites / canyon rock outcrops on upper corners
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.16, 0);
    ctx.lineTo(w * 0.09, h * 0.13);
    ctx.lineTo(w * 0.04, h * 0.08);
    ctx.lineTo(0, h * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w * 0.84, 0);
    ctx.lineTo(w * 0.91, h * 0.15);
    ctx.lineTo(w * 0.96, h * 0.09);
    ctx.lineTo(w, h * 0.22);
    ctx.closePath();
    ctx.fill();
  } else if (stage === 'kali_temple' || stage === 'throne_mound') {
    // Swaying foreground temple bell chain silhouettes at extreme upper corners
    for (const cx of [w * 0.06, w * 0.94]) {
      const bellX = cx + sway * 0.55;
      ctx.strokeStyle = '#06050b';
      ctx.lineWidth = 3.5 * s;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(bellX, h * 0.16);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bellX - 15 * s, h * 0.22);
      ctx.lineTo(bellX - 7 * s, h * 0.15);
      ctx.lineTo(bellX + 7 * s, h * 0.15);
      ctx.lineTo(bellX + 15 * s, h * 0.22);
      ctx.closePath();
      ctx.fill();
    }
  } else if (stage === 'ocean_ship' || stage === 'tropical_archipelago' || stage === 'river_ghat' || stage === 'enchanted_lake') {
    // Gentle foreground water-edge reeds or ship rigging ropes swaying with swell
    ctx.strokeStyle = '#050810';
    ctx.lineWidth = 3.5 * s;
    ctx.beginPath();
    ctx.moveTo(w * 0.04, 0);
    ctx.quadraticCurveTo(w * 0.07 + sway * 0.7, h * 0.35, 0, h * 0.65);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.96, 0);
    ctx.quadraticCurveTo(w * 0.93 - sway * 0.7, h * 0.35, w, h * 0.65);
    ctx.stroke();
  } else if (stage === 'cloud_skies' || stage === 'himalayan_hermitage') {
    // Soft foreground drifting cloud wisps along the bottom corners
    ctx.fillStyle = pal.moon;
    ctx.globalAlpha = 0.16;
    const drift = ((t * 28 * s) % (w + 260 * s)) - 130 * s;
    ctx.beginPath();
    ctx.ellipse(drift, h * 0.96, 150 * s, 34 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(w - drift * 0.7, h * 0.94, 130 * s, 28 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Subtle corner framing architectural/landscape anchors for village, bazaar, kurukshetra, etc.
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w * 0.09, h);
    ctx.lineTo(w * 0.03, h * 0.88 + sway2 * 0.3);
    ctx.lineTo(0, h * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w, h);
    ctx.lineTo(w * 0.91, h);
    ctx.lineTo(w * 0.97, h * 0.88 - sway2 * 0.3);
    ctx.lineTo(w, h * 0.85);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}
