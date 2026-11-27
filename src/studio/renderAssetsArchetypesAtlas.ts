/**
 * Stagecraft Studio — Wave 5 Universal Character Archetypes Atlas (+100 Archetypes)
 *
 * Uses a high-craft Compositional Layered Character Rig (chassis build, layered
 * garment/armor/uniform, headgear/hair/horns/helmet, face/eyes/mask/visor,
 * back silhouette like wings/cape/pack/tail, held emblem/tool, and micro-motion)
 * so every single one of the 100 new ArchetypeIds renders with a distinct,
 * immediately recognizable silhouette across all 20 RenderStyleId engines.
 *
 * Strictly deterministic: zero Math.random(), zero offscreen canvas allocations.
 */
import { ArchetypeId, CastMember, ExpressionId, PoseId } from './types';
import {
  drawUnifiedEyePair,
  drawUnifiedMouth,
  getExpressionHeadTilt,
} from './facialExpressions';

const snap24 = (t: number): number => Math.floor(t * 24) / 24;

type BodyBuild =
  | 'heroic'
  | 'humanoid'
  | 'slim'
  | 'stocky'
  | 'floating'
  | 'quadruped'
  | 'biped_dino'
  | 'avian'
  | 'aquatic'
  | 'mermaid'
  | 'golem'
  | 'slime'
  | 'octopus'
  | 'penguin';

type HeadgearKind =
  | 'none'
  | 'crown_laurel'
  | 'spartan_crest'
  | 'roman_galea'
  | 'jackal_ears'
  | 'valkyrie_wings'
  | 'fox_ears'
  | 'gold_headband'
  | 'feathered_headdress'
  | 'antler_wreath'
  | 'turban_gem'
  | 'trident_crown'
  | 'beret_cap'
  | 'top_hat_goggles'
  | 'cowboy_hat'
  | 'bandana_hat'
  | 'kabuto_helmet'
  | 'maratha_pagadi'
  | 'nomad_hood'
  | 'wild_mane'
  | 'surgical_cap'
  | 'fire_helmet'
  | 'police_cap'
  | 'judge_wig'
  | 'chef_toque'
  | 'delivery_cap'
  | 'hard_hat'
  | 'straw_hat'
  | 'headphones'
  | 'beanie_cap'
  | 'bounty_helmet'
  | 'alien_antennae'
  | 'cyber_visor_helm'
  | 'admiral_cap'
  | 'gasmask_hood'
  | 'paladin_helm'
  | 'dark_hood'
  | 'tricorn_feather'
  | 'wizard_hat'
  | 'goblin_ears'
  | 'orc_tusks'
  | 'angel_halo'
  | 'wolf_ears'
  | 'plague_hat'
  | 'mummy_wraps'
  | 'witch_hat'
  | 'stone_horns'
  | 'pumpkin_head'
  | 'karate_headband'
  | 'ringmaster_hat'
  | 'magician_tophat'
  | 'scout_hat'
  | 'nutcracker_shako'
  | 'dino_crest'
  | 'bear_ears'
  | 'panda_ears'
  | 'unicorn_horn'
  | 'dragon_horns'
  | 'leaf_crown'
  | 'clockwork_key';

type GarmentKind =
  | 'toga_gold'
  | 'plate_armor'
  | 'egypt_collar'
  | 'kimono_sash'
  | 'monk_tunic'
  | 'druid_cloak'
  | 'western_vest'
  | 'shogun_armor'
  | 'maratha_angarkha'
  | 'fur_pelt'
  | 'scrubs_coat'
  | 'fire_turnout'
  | 'police_uniform'
  | 'judge_robe'
  | 'business_suit'
  | 'chef_double'
  | 'hi_vis_vest'
  | 'denim_overalls'
  | 'tech_hoodie'
  | 'esports_jersey'
  | 'space_armor'
  | 'admiral_coat'
  | 'lab_coat'
  | 'wasteland_rag'
  | 'holo_grid'
  | 'dark_robe'
  | 'bard_doublet'
  | 'ranger_leather'
  | 'plague_coat'
  | 'mummy_bandages'
  | 'scarecrow_patch'
  | 'sports_jersey'
  | 'cricket_whites'
  | 'karate_gi'
  | 'ringmaster_coat'
  | 'tuxedo_tails'
  | 'ballet_tutu'
  | 'scout_uniform'
  | 'nutcracker_tunic'
  | 'natural_hide';

type BackAccessory =
  | 'none'
  | 'cape_royal'
  | 'cape_tattered'
  | 'wings_angel'
  | 'wings_flame'
  | 'wings_stone'
  | 'wings_dragon'
  | 'nine_tails'
  | 'jetpack'
  | 'quiver'
  | 'treant_branches'
  | 'djinn_smoke'
  | 'aura_ring'
  | 'backpack'
  | 'clockwork_gears';

type FaceOverlay =
  | 'none'
  | 'beard_white'
  | 'beard_dark'
  | 'beard_mustache'
  | 'glasses_round'
  | 'cyber_visor'
  | 'plague_beak'
  | 'bandana_mask'
  | 'surgical_mask'
  | 'gas_mask'
  | 'glowing_eyes'
  | 'skull_face'
  | 'feline_snout'
  | 'canine_snout'
  | 'beak_raptor'
  | 'dino_jaws'
  | 'shark_teeth'
  | 'hologram_scan'
  | 'nutcracker_jaw';

type EmblemKind =
  | 'none'
  | 'lightning'
  | 'spear'
  | 'scales'
  | 'staff'
  | 'trident'
  | 'sword'
  | 'shield'
  | 'brush'
  | 'wrench'
  | 'star_badge'
  | 'stethoscope'
  | 'axe'
  | 'gavel'
  | 'book'
  | 'spatula'
  | 'parcel'
  | 'mic'
  | 'laptop'
  | 'camera'
  | 'controller'
  | 'blaster'
  | 'flask'
  | 'lute'
  | 'scythe'
  | 'lantern'
  | 'ball'
  | 'bat'
  | 'wand'
  | 'baton'
  | 'skateboard';

interface ArchetypeBlueprint {
  build: BodyBuild;
  headgear: HeadgearKind;
  garment: GarmentKind;
  back: BackAccessory;
  face: FaceOverlay;
  emblem: EmblemKind;
  hairColor?: string;
  secondaryColor?: string;
  skinOverride?: string;
  glowingEyes?: boolean;
}

const ATLAS_BLUEPRINTS: Partial<Record<ArchetypeId, ArchetypeBlueprint>> = {
  // 1. World Mythology & Legends (10)
  zeus_thunderer: { build: 'heroic', headgear: 'crown_laurel', garment: 'toga_gold', back: 'cape_royal', face: 'beard_white', emblem: 'lightning', hairColor: '#f1f5f9', glowingEyes: true },
  athena_strategist: { build: 'slim', headgear: 'spartan_crest', garment: 'plate_armor', back: 'cape_royal', face: 'none', emblem: 'spear', hairColor: '#3b2416' },
  anubis_guardian: { build: 'heroic', headgear: 'jackal_ears', garment: 'egypt_collar', back: 'aura_ring', face: 'canine_snout', emblem: 'scales', skinOverride: '#1e1b2e', glowingEyes: true },
  valkyrie_shieldmaiden: { build: 'heroic', headgear: 'valkyrie_wings', garment: 'plate_armor', back: 'wings_angel', face: 'none', emblem: 'shield', hairColor: '#fde047' },
  kitsune_foxspirit: { build: 'slim', headgear: 'fox_ears', garment: 'kimono_sash', back: 'nine_tails', face: 'none', emblem: 'lantern', hairColor: '#fef3c7', glowingEyes: true },
  sun_wukong_trickster: { build: 'humanoid', headgear: 'gold_headband', garment: 'monk_tunic', back: 'cape_royal', face: 'none', emblem: 'staff', hairColor: '#b45309', skinOverride: '#e6b88a' },
  quetzal_priest: { build: 'humanoid', headgear: 'feathered_headdress', garment: 'egypt_collar', back: 'cape_royal', face: 'none', emblem: 'staff', hairColor: '#111827' },
  celtic_druid: { build: 'humanoid', headgear: 'antler_wreath', garment: 'druid_cloak', back: 'cape_tattered', face: 'beard_white', emblem: 'staff', hairColor: '#cbd5e1' },
  djinn_genie: { build: 'floating', headgear: 'turban_gem', garment: 'egypt_collar', back: 'djinn_smoke', face: 'beard_dark', emblem: 'lantern', skinOverride: '#38bdf8', glowingEyes: true },
  poseidon_tideking: { build: 'heroic', headgear: 'trident_crown', garment: 'toga_gold', back: 'cape_royal', face: 'beard_white', emblem: 'trident', hairColor: '#e0f2fe', glowingEyes: true },

  // 2. Historical & Cultural Eras (10)
  roman_centurion: { build: 'heroic', headgear: 'roman_galea', garment: 'plate_armor', back: 'cape_royal', face: 'none', emblem: 'shield', hairColor: '#291c14' },
  spartan_hoplite: { build: 'heroic', headgear: 'spartan_crest', garment: 'plate_armor', back: 'cape_royal', face: 'beard_dark', emblem: 'spear', hairColor: '#1f1610' },
  renaissance_painter: { build: 'humanoid', headgear: 'beret_cap', garment: 'bard_doublet', back: 'none', face: 'beard_mustache', emblem: 'brush', hairColor: '#451a03' },
  victorian_inventor: { build: 'humanoid', headgear: 'top_hat_goggles', garment: 'business_suit', back: 'clockwork_gears', face: 'beard_mustache', emblem: 'wrench', hairColor: '#3f2e22' },
  wild_west_sheriff: { build: 'humanoid', headgear: 'cowboy_hat', garment: 'western_vest', back: 'none', face: 'beard_mustache', emblem: 'star_badge', hairColor: '#451a03' },
  outlaw_bandit: { build: 'humanoid', headgear: 'cowboy_hat', garment: 'western_vest', back: 'cape_tattered', face: 'bandana_mask', emblem: 'blaster', hairColor: '#18181b' },
  feudal_shogun: { build: 'heroic', headgear: 'kabuto_helmet', garment: 'shogun_armor', back: 'cape_royal', face: 'beard_mustache', emblem: 'sword', hairColor: '#0f172a' },
  maratha_commander: { build: 'heroic', headgear: 'maratha_pagadi', garment: 'maratha_angarkha', back: 'cape_royal', face: 'beard_mustache', emblem: 'sword', hairColor: '#111827' },
  silk_road_nomad: { build: 'humanoid', headgear: 'nomad_hood', garment: 'druid_cloak', back: 'backpack', face: 'beard_dark', emblem: 'lantern', hairColor: '#1c1917' },
  caveman_hunter: { build: 'stocky', headgear: 'wild_mane', garment: 'fur_pelt', back: 'none', face: 'beard_dark', emblem: 'spear', hairColor: '#291c14' },

  // 3. Modern Everyday & Civic (10)
  doctor_surgeon: { build: 'humanoid', headgear: 'surgical_cap', garment: 'scrubs_coat', back: 'none', face: 'surgical_mask', emblem: 'stethoscope', hairColor: '#1e293b' },
  firefighter_rescuer: { build: 'heroic', headgear: 'fire_helmet', garment: 'fire_turnout', back: 'backpack', face: 'none', emblem: 'axe', hairColor: '#291c14' },
  police_officer: { build: 'humanoid', headgear: 'police_cap', garment: 'police_uniform', back: 'none', face: 'none', emblem: 'star_badge', hairColor: '#1e293b' },
  judge_magistrate: { build: 'humanoid', headgear: 'judge_wig', garment: 'judge_robe', back: 'none', face: 'glasses_round', emblem: 'gavel', hairColor: '#f1f5f9' },
  lawyer_advocate: { build: 'slim', headgear: 'none', garment: 'business_suit', back: 'none', face: 'glasses_round', emblem: 'book', hairColor: '#1e1b2e' },
  school_teacher: { build: 'humanoid', headgear: 'none', garment: 'lab_coat', back: 'none', face: 'glasses_round', emblem: 'book', hairColor: '#5c3b28' },
  chef_culinary: { build: 'stocky', headgear: 'chef_toque', garment: 'chef_double', back: 'none', face: 'beard_mustache', emblem: 'spatula', hairColor: '#291c14' },
  delivery_courier: { build: 'slim', headgear: 'delivery_cap', garment: 'tech_hoodie', back: 'backpack', face: 'none', emblem: 'parcel', hairColor: '#18181b' },
  construction_engineer: { build: 'stocky', headgear: 'hard_hat', garment: 'hi_vis_vest', back: 'none', face: 'none', emblem: 'wrench', hairColor: '#291c14' },
  farmer_grower: { build: 'humanoid', headgear: 'straw_hat', garment: 'denim_overalls', back: 'none', face: 'none', emblem: 'lantern', hairColor: '#6b3e26' },

  // 4. Media, Business & Explainer (10)
  ceo_founder: { build: 'slim', headgear: 'none', garment: 'business_suit', back: 'none', face: 'none', emblem: 'laptop', hairColor: '#1e293b' },
  podcast_host: { build: 'humanoid', headgear: 'headphones', garment: 'tech_hoodie', back: 'none', face: 'none', emblem: 'mic', hairColor: '#27272a' },
  news_anchor: { build: 'humanoid', headgear: 'none', garment: 'business_suit', back: 'none', face: 'none', emblem: 'mic', hairColor: '#1f2937' },
  stock_trader: { build: 'humanoid', headgear: 'none', garment: 'business_suit', back: 'none', face: 'none', emblem: 'laptop', hairColor: '#334155' },
  tech_developer: { build: 'slim', headgear: 'beanie_cap', garment: 'tech_hoodie', back: 'backpack', face: 'glasses_round', emblem: 'laptop', hairColor: '#18181b' },
  influencer_vlogger: { build: 'slim', headgear: 'beret_cap', garment: 'tech_hoodie', back: 'none', face: 'none', emblem: 'camera', hairColor: '#ec4899' },
  historian_professor: { build: 'humanoid', headgear: 'none', garment: 'business_suit', back: 'none', face: 'beard_white', emblem: 'book', hairColor: '#cbd5e1' },
  coach_mentor: { build: 'heroic', headgear: 'delivery_cap', garment: 'sports_jersey', back: 'none', face: 'none', emblem: 'star_badge', hairColor: '#374151' },
  film_director: { build: 'humanoid', headgear: 'beret_cap', garment: 'tech_hoodie', back: 'none', face: 'glasses_round', emblem: 'camera', hairColor: '#18181b' },
  esports_gamer: { build: 'slim', headgear: 'headphones', garment: 'esports_jersey', back: 'none', face: 'cyber_visor', emblem: 'controller', hairColor: '#38bdf8' },

  // 5. Sci-Fi, Cyberpunk & Space (10)
  bounty_hunter: { build: 'heroic', headgear: 'bounty_helmet', garment: 'space_armor', back: 'jetpack', face: 'cyber_visor', emblem: 'blaster' },
  alien_diplomat: { build: 'slim', headgear: 'alien_antennae', garment: 'toga_gold', back: 'aura_ring', face: 'glowing_eyes', emblem: 'staff', skinOverride: '#86efac', glowingEyes: true },
  cyborg_enforcer: { build: 'heroic', headgear: 'cyber_visor_helm', garment: 'space_armor', back: 'none', face: 'cyber_visor', emblem: 'blaster', skinOverride: '#94a3b8', glowingEyes: true },
  time_traveler: { build: 'humanoid', headgear: 'top_hat_goggles', garment: 'admiral_coat', back: 'clockwork_gears', face: 'none', emblem: 'lantern', hairColor: '#451a03' },
  space_admiral: { build: 'heroic', headgear: 'admiral_cap', garment: 'admiral_coat', back: 'cape_royal', face: 'none', emblem: 'star_badge', hairColor: '#cbd5e1' },
  drone_operator: { build: 'slim', headgear: 'headphones', garment: 'tech_hoodie', back: 'backpack', face: 'cyber_visor', emblem: 'controller', hairColor: '#0f172a' },
  bio_geneticist: { build: 'slim', headgear: 'none', garment: 'lab_coat', back: 'none', face: 'glasses_round', emblem: 'flask', hairColor: '#1e293b' },
  wasteland_scavenger: { build: 'humanoid', headgear: 'gasmask_hood', garment: 'wasteland_rag', back: 'backpack', face: 'gas_mask', emblem: 'wrench' },
  quantum_physicist: { build: 'humanoid', headgear: 'none', garment: 'lab_coat', back: 'aura_ring', face: 'glasses_round', emblem: 'flask', hairColor: '#e2e8f0' },
  ai_hologram: { build: 'floating', headgear: 'none', garment: 'holo_grid', back: 'aura_ring', face: 'hologram_scan', emblem: 'none', skinOverride: '#67e8f9', glowingEyes: true },

  // 6. High Fantasy & RPG Classes (10)
  paladin_crusader: { build: 'heroic', headgear: 'paladin_helm', garment: 'plate_armor', back: 'cape_royal', face: 'none', emblem: 'shield', glowingEyes: true },
  necromancer_mage: { build: 'slim', headgear: 'dark_hood', garment: 'dark_robe', back: 'cape_tattered', face: 'skull_face', emblem: 'staff', skinOverride: '#cbd5e1', glowingEyes: true },
  alchemist_brewer: { build: 'humanoid', headgear: 'top_hat_goggles', garment: 'ranger_leather', back: 'backpack', face: 'none', emblem: 'flask', hairColor: '#7c2d12' },
  shadow_rogue: { build: 'slim', headgear: 'dark_hood', garment: 'ranger_leather', back: 'cape_tattered', face: 'bandana_mask', emblem: 'sword' },
  tavern_bard: { build: 'slim', headgear: 'tricorn_feather', garment: 'bard_doublet', back: 'cape_royal', face: 'none', emblem: 'lute', hairColor: '#b45309' },
  beast_ranger: { build: 'humanoid', headgear: 'nomad_hood', garment: 'ranger_leather', back: 'quiver', face: 'none', emblem: 'spear', hairColor: '#3f2e22' },
  archmage_oracle: { build: 'humanoid', headgear: 'wizard_hat', garment: 'dark_robe', back: 'aura_ring', face: 'beard_white', emblem: 'staff', hairColor: '#f8fafc', glowingEyes: true },
  goblin_tinkerer: { build: 'stocky', headgear: 'goblin_ears', garment: 'wasteland_rag', back: 'clockwork_gears', face: 'none', emblem: 'wrench', skinOverride: '#65a30d' },
  orc_warlord: { build: 'heroic', headgear: 'orc_tusks', garment: 'plate_armor', back: 'cape_tattered', face: 'none', emblem: 'axe', skinOverride: '#4d7c0f' },
  celestial_angel: { build: 'floating', headgear: 'angel_halo', garment: 'toga_gold', back: 'wings_angel', face: 'none', emblem: 'sword', hairColor: '#fef08a', glowingEyes: true },

  // 7. Dark Gothic, Horror & Folklore (10)
  werewolf_stalker: { build: 'heroic', headgear: 'wolf_ears', garment: 'wasteland_rag', back: 'none', face: 'canine_snout', emblem: 'none', skinOverride: '#57534e', glowingEyes: true },
  plague_doctor: { build: 'humanoid', headgear: 'plague_hat', garment: 'plague_coat', back: 'cape_tattered', face: 'plague_beak', emblem: 'lantern' },
  mummy_sovereign: { build: 'humanoid', headgear: 'mummy_wraps', garment: 'mummy_bandages', back: 'cape_tattered', face: 'glowing_eyes', emblem: 'staff', skinOverride: '#d6d3d1', glowingEyes: true },
  witch_herbalist: { build: 'slim', headgear: 'witch_hat', garment: 'dark_robe', back: 'cape_tattered', face: 'none', emblem: 'flask', hairColor: '#3b0764' },
  grim_reaper: { build: 'floating', headgear: 'dark_hood', garment: 'dark_robe', back: 'cape_tattered', face: 'skull_face', emblem: 'scythe', skinOverride: '#e2e8f0', glowingEyes: true },
  gargoyle_sentinel: { build: 'golem', headgear: 'stone_horns', garment: 'natural_hide', back: 'wings_stone', face: 'glowing_eyes', emblem: 'none', skinOverride: '#64748b', glowingEyes: true },
  banshee_wraith: { build: 'floating', headgear: 'wild_mane', garment: 'dark_robe', back: 'djinn_smoke', face: 'glowing_eyes', emblem: 'none', skinOverride: '#cbd5e1', hairColor: '#e0f2fe', glowingEyes: true },
  mad_scientist: { build: 'humanoid', headgear: 'wild_mane', garment: 'lab_coat', back: 'none', face: 'glasses_round', emblem: 'flask', hairColor: '#f8fafc' },
  occult_investigator: { build: 'humanoid', headgear: 'plague_hat', garment: 'plague_coat', back: 'none', face: 'none', emblem: 'lantern', hairColor: '#1f2937' },
  pumpkin_scarecrow: { build: 'humanoid', headgear: 'pumpkin_head', garment: 'scarecrow_patch', back: 'none', face: 'glowing_eyes', emblem: 'lantern', skinOverride: '#ea580c', glowingEyes: true },

  // 8. Wildlife & Prehistoric (10)
  trex_dinosaur: { build: 'biped_dino', headgear: 'dino_crest', garment: 'natural_hide', back: 'none', face: 'dino_jaws', emblem: 'none', skinOverride: '#3f6212' },
  triceratops_dino: { build: 'quadruped', headgear: 'dino_crest', garment: 'natural_hide', back: 'none', face: 'dino_jaws', emblem: 'none', skinOverride: '#854d0e' },
  grizzly_bear: { build: 'stocky', headgear: 'bear_ears', garment: 'natural_hide', back: 'none', face: 'canine_snout', emblem: 'none', skinOverride: '#78350f' },
  polar_penguin: { build: 'penguin', headgear: 'none', garment: 'natural_hide', back: 'none', face: 'beak_raptor', emblem: 'none', skinOverride: '#0f172a' },
  giant_panda: { build: 'stocky', headgear: 'panda_ears', garment: 'natural_hide', back: 'none', face: 'canine_snout', emblem: 'none', skinOverride: '#f8fafc' },
  bald_eagle: { build: 'avian', headgear: 'none', garment: 'natural_hide', back: 'wings_angel', face: 'beak_raptor', emblem: 'none', skinOverride: '#ffffff' },
  silverback_gorilla: { build: 'golem', headgear: 'none', garment: 'natural_hide', back: 'none', face: 'none', emblem: 'none', skinOverride: '#27272a' },
  desert_camel: { build: 'quadruped', headgear: 'none', garment: 'natural_hide', back: 'backpack', face: 'none', emblem: 'none', skinOverride: '#d97706' },
  great_white_shark: { build: 'aquatic', headgear: 'none', garment: 'natural_hide', back: 'none', face: 'shark_teeth', emblem: 'none', skinOverride: '#64748b' },
  giant_octopus: { build: 'octopus', headgear: 'none', garment: 'natural_hide', back: 'none', face: 'glowing_eyes', emblem: 'none', skinOverride: '#be185d' },

  // 9. Mythic Beasts & Companions (10)
  fire_phoenix: { build: 'avian', headgear: 'feathered_headdress', garment: 'natural_hide', back: 'wings_flame', face: 'beak_raptor', emblem: 'none', skinOverride: '#f97316', glowingEyes: true },
  frost_unicorn: { build: 'quadruped', headgear: 'unicorn_horn', garment: 'natural_hide', back: 'aura_ring', face: 'none', emblem: 'none', skinOverride: '#e0f2fe', glowingEyes: true },
  winged_griffin: { build: 'quadruped', headgear: 'none', garment: 'natural_hide', back: 'wings_angel', face: 'beak_raptor', emblem: 'none', skinOverride: '#d97706' },
  sea_mermaid: { build: 'mermaid', headgear: 'trident_crown', garment: 'toga_gold', back: 'none', face: 'none', emblem: 'trident', hairColor: '#06b6d4' },
  sky_pegasus: { build: 'quadruped', headgear: 'none', garment: 'natural_hide', back: 'wings_angel', face: 'none', emblem: 'none', skinOverride: '#f8fafc' },
  forest_treant: { build: 'golem', headgear: 'leaf_crown', garment: 'natural_hide', back: 'treant_branches', face: 'glowing_eyes', emblem: 'none', skinOverride: '#713f12', glowingEyes: true },
  stone_golem: { build: 'golem', headgear: 'stone_horns', garment: 'natural_hide', back: 'none', face: 'glowing_eyes', emblem: 'none', skinOverride: '#475569', glowingEyes: true },
  crystal_slime: { build: 'slime', headgear: 'none', garment: 'natural_hide', back: 'aura_ring', face: 'none', emblem: 'none', skinOverride: '#22d3ee', glowingEyes: true },
  baby_dragon: { build: 'biped_dino', headgear: 'dragon_horns', garment: 'natural_hide', back: 'wings_dragon', face: 'dino_jaws', emblem: 'none', skinOverride: '#dc2626', glowingEyes: true },
  clockwork_automaton: { build: 'humanoid', headgear: 'clockwork_key', garment: 'plate_armor', back: 'clockwork_gears', face: 'glowing_eyes', emblem: 'wrench', skinOverride: '#b45309', glowingEyes: true },

  // 10. Kids, Sports & Entertainment (10)
  soccer_striker: { build: 'slim', headgear: 'none', garment: 'sports_jersey', back: 'none', face: 'none', emblem: 'ball', hairColor: '#1e1b2e' },
  cricket_batter: { build: 'humanoid', headgear: 'delivery_cap', garment: 'cricket_whites', back: 'none', face: 'none', emblem: 'bat', hairColor: '#18181b' },
  martial_artist: { build: 'humanoid', headgear: 'karate_headband', garment: 'karate_gi', back: 'none', face: 'none', emblem: 'none', hairColor: '#111827' },
  circus_ringmaster: { build: 'heroic', headgear: 'ringmaster_hat', garment: 'ringmaster_coat', back: 'cape_royal', face: 'beard_mustache', emblem: 'wand', hairColor: '#18181b' },
  stage_magician: { build: 'slim', headgear: 'magician_tophat', garment: 'tuxedo_tails', back: 'cape_royal', face: 'none', emblem: 'wand', hairColor: '#0f172a' },
  orchestra_conductor: { build: 'humanoid', headgear: 'none', garment: 'tuxedo_tails', back: 'none', face: 'beard_white', emblem: 'baton', hairColor: '#e2e8f0' },
  ballet_dancer: { build: 'slim', headgear: 'crown_laurel', garment: 'ballet_tutu', back: 'none', face: 'none', emblem: 'none', hairColor: '#3b2416' },
  skateboard_kid: { build: 'slim', headgear: 'delivery_cap', garment: 'tech_hoodie', back: 'backpack', face: 'none', emblem: 'skateboard', hairColor: '#451a03' },
  explorer_scout: { build: 'slim', headgear: 'scout_hat', garment: 'scout_uniform', back: 'backpack', face: 'none', emblem: 'lantern', hairColor: '#5c3b28' },
  toy_nutcracker: { build: 'humanoid', headgear: 'nutcracker_shako', garment: 'nutcracker_tunic', back: 'none', face: 'nutcracker_jaw', emblem: 'sword', skinOverride: '#fde68a' },
};

function darkenHex(hex: string, factor = 0.56): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#1e293b';
  const r = Math.max(0, Math.min(255, Math.round(parseInt(clean.slice(0, 2), 16) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(parseInt(clean.slice(2, 4), 16) * factor)));
  const b = Math.max(0, Math.min(255, Math.round(parseInt(clean.slice(4, 6), 16) * factor)));
  return `rgb(${r},${g},${b})`;
}

function hashSeed(str: string): number {
  let h = 23;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 997;
  return h;
}

function drawHeadgear(
  ctx: CanvasRenderingContext2D,
  kind: HeadgearKind,
  primary: string,
  accent: string,
  skin: string
) {
  if (kind === 'none') return;
  if (kind === 'crown_laurel' || kind === 'leaf_crown') {
    ctx.strokeStyle = kind === 'crown_laurel' ? accent : '#4ade80';
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(0, -48, 66, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.fillStyle = kind === 'crown_laurel' ? '#fde047' : '#22c55e';
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath(); ctx.ellipse(i * 19, -58 - (3 - Math.abs(i)) * 4, 9, 5, i * 0.2, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'spartan_crest' || kind === 'roman_galea') {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-18, -118); ctx.quadraticCurveTo(0, -158, 48, -108); ctx.lineTo(24, -64); ctx.lineTo(-18, -64);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.arc(0, -42, 68, Math.PI, 0); ctx.fill();
    ctx.fillRect(-66, -46, 132, 18);
  } else if (kind === 'jackal_ears' || kind === 'fox_ears' || kind === 'wolf_ears') {
    ctx.fillStyle = kind === 'jackal_ears' ? '#1e1b2e' : primary;
    for (const sgn of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sgn * 26, -52);
      ctx.lineTo(sgn * (kind === 'jackal_ears' ? 42 : 64), kind === 'jackal_ears' ? -156 : -122);
      ctx.lineTo(sgn * 58, -36);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(sgn * 34, -56);
      ctx.lineTo(sgn * (kind === 'jackal_ears' ? 42 : 56), kind === 'jackal_ears' ? -128 : -104);
      ctx.lineTo(sgn * 50, -46);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = kind === 'jackal_ears' ? '#1e1b2e' : primary;
    }
  } else if (kind === 'valkyrie_wings') {
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath(); ctx.arc(0, -42, 66, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ffffff';
    for (const sgn of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sgn * 58, -42); ctx.lineTo(sgn * 116, -98); ctx.lineTo(sgn * 96, -34); ctx.lineTo(sgn * 58, -18);
      ctx.closePath(); ctx.fill();
    }
  } else if (kind === 'gold_headband' || kind === 'karate_headband') {
    ctx.fillStyle = kind === 'gold_headband' ? '#facc15' : accent;
    ctx.fillRect(-66, -54, 132, 16);
    if (kind === 'gold_headband') {
      ctx.beginPath(); ctx.arc(0, -56, 14, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'feathered_headdress') {
    for (let i = -4; i <= 4; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#10b981' : accent;
      ctx.save();
      ctx.translate(0, -54);
      ctx.rotate(i * 0.22);
      ctx.beginPath(); ctx.ellipse(0, -58, 12, 46, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-66, -62, 132, 18);
  } else if (kind === 'antler_wreath') {
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    for (const sgn of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sgn * 34, -56); ctx.lineTo(sgn * 74, -124);
      ctx.moveTo(sgn * 54, -90); ctx.lineTo(sgn * 90, -96);
      ctx.moveTo(sgn * 62, -104); ctx.lineTo(sgn * 48, -138);
      ctx.stroke();
    }
  } else if (kind === 'turban_gem' || kind === 'maratha_pagadi') {
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.ellipse(0, -68, 76, 42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(0, -76, 14, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'trident_crown') {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-64, -52); ctx.lineTo(-48, -112); ctx.lineTo(-22, -72);
    ctx.lineTo(0, -124); ctx.lineTo(22, -72); ctx.lineTo(48, -112); ctx.lineTo(64, -52);
    ctx.closePath(); ctx.fill();
  } else if (kind === 'beret_cap') {
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.ellipse(8, -68, 76, 28, -0.18, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'top_hat_goggles' || kind === 'ringmaster_hat' || kind === 'magician_tophat') {
    ctx.fillStyle = kind === 'ringmaster_hat' ? '#991b1b' : '#18181b';
    ctx.fillRect(-84, -64, 168, 16);
    ctx.fillRect(-54, -144, 108, 84);
    ctx.fillStyle = accent;
    ctx.fillRect(-54, -82, 108, 16);
    if (kind === 'top_hat_goggles') {
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(-26, -74, 16, 0, Math.PI * 2); ctx.arc(26, -74, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  } else if (kind === 'cowboy_hat' || kind === 'plague_hat' || kind === 'scout_hat' || kind === 'straw_hat') {
    ctx.fillStyle = kind === 'straw_hat' ? '#eab308' : kind === 'plague_hat' ? '#18181b' : '#78350f';
    ctx.beginPath(); ctx.ellipse(0, -56, 98, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(-52, -108, 104, 54, 16); ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(-52, -70, 104, 10);
  } else if (kind === 'kabuto_helmet') {
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.arc(0, -44, 72, Math.PI, 0); ctx.fill();
    ctx.fillRect(-84, -48, 168, 16);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(0, -96, 40, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  } else if (kind === 'nomad_hood' || kind === 'dark_hood' || kind === 'gasmask_hood') {
    ctx.fillStyle = darkenHex(primary, 0.72);
    ctx.beginPath();
    ctx.moveTo(-84, 54); ctx.quadraticCurveTo(-82, -108, 0, -112); ctx.quadraticCurveTo(82, -108, 84, 54);
    ctx.lineTo(60, 54); ctx.lineTo(54, -48); ctx.lineTo(-54, -48); ctx.lineTo(-60, 54);
    ctx.closePath(); ctx.fill();
  } else if (kind === 'surgical_cap' || kind === 'beanie_cap') {
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.arc(0, -42, 66, Math.PI, 0); ctx.fill();
    ctx.fillRect(-66, -54, 132, 16);
  } else if (kind === 'fire_helmet' || kind === 'hard_hat') {
    ctx.fillStyle = kind === 'hard_hat' ? '#facc15' : '#dc2626';
    ctx.beginPath(); ctx.arc(0, -48, 68, Math.PI, 0); ctx.fill();
    ctx.fillRect(-82, -52, 164, 14);
    ctx.fillStyle = accent;
    ctx.fillRect(-16, -98, 32, 34);
  } else if (kind === 'police_cap' || kind === 'admiral_cap' || kind === 'delivery_cap') {
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.roundRect(-64, -92, 128, 42, 10); ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-68, -56, 136, 12);
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(0, -72, 10, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'judge_wig') {
    ctx.fillStyle = '#e2e8f0';
    for (let y = -68; y <= 34; y += 22) {
      ctx.beginPath(); ctx.arc(-68, y, 22, 0, Math.PI * 2); ctx.arc(68, y, 22, 0, Math.PI * 2); ctx.fill();
    }
    ctx.beginPath(); ctx.ellipse(0, -68, 72, 30, 0, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'chef_toque') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-54, -92, 108, 42);
    ctx.beginPath();
    ctx.arc(-34, -102, 28, 0, Math.PI * 2);
    ctx.arc(0, -114, 34, 0, Math.PI * 2);
    ctx.arc(34, -102, 28, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'headphones') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(0, -34, 72, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.roundRect(-80, -30, 22, 52, 10); ctx.roundRect(58, -30, 22, 52, 10); ctx.fill();
  } else if (kind === 'bounty_helmet' || kind === 'cyber_visor_helm' || kind === 'paladin_helm') {
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.roundRect(-68, -76, 136, 148, 36); ctx.fill();
    ctx.fillStyle = kind === 'paladin_helm' ? '#0f172a' : accent;
    ctx.fillRect(-50, -24, 100, 22);
    ctx.fillRect(-10, -24, 20, 68);
  } else if (kind === 'alien_antennae') {
    ctx.strokeStyle = skin;
    ctx.lineWidth = 7;
    for (const sgn of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(sgn * 26, -54); ctx.quadraticCurveTo(sgn * 44, -104, sgn * 54, -124); ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath(); ctx.arc(sgn * 54, -124, 11, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'tricorn_feather') {
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.moveTo(-88, -48); ctx.lineTo(0, -112); ctx.lineTo(88, -48); ctx.closePath(); ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.ellipse(48, -96, 14, 38, 0.5, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'wizard_hat' || kind === 'witch_hat') {
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.ellipse(0, -54, 96, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-58, -54); ctx.lineTo(14, -162); ctx.lineTo(58, -54); ctx.closePath(); ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(-54, -68, 108, 12);
  } else if (kind === 'goblin_ears') {
    ctx.fillStyle = skin;
    for (const sgn of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(sgn * 56, -12); ctx.lineTo(sgn * 118, -32); ctx.lineTo(sgn * 58, 18); ctx.closePath(); ctx.fill();
    }
  } else if (kind === 'orc_tusks') {
    ctx.fillStyle = '#fefce8';
    for (const sgn of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(sgn * 24, 48); ctx.lineTo(sgn * 34, 12); ctx.lineTo(sgn * 12, 46); ctx.closePath(); ctx.fill();
    }
  } else if (kind === 'angel_halo') {
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.ellipse(0, -96, 56, 14, 0, 0, Math.PI * 2); ctx.stroke();
  } else if (kind === 'mummy_wraps') {
    ctx.strokeStyle = '#a8a29e';
    ctx.lineWidth = 7;
    for (let y = -52; y <= 62; y += 18) {
      ctx.beginPath(); ctx.moveTo(-64, y); ctx.lineTo(64, y + 6); ctx.stroke();
    }
  } else if (kind === 'stone_horns' || kind === 'dragon_horns' || kind === 'dino_crest') {
    ctx.fillStyle = accent;
    for (const sgn of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sgn * 32, -52); ctx.quadraticCurveTo(sgn * 86, -104, sgn * 62, -138); ctx.lineTo(sgn * 16, -54);
      ctx.closePath(); ctx.fill();
    }
  } else if (kind === 'pumpkin_head') {
    ctx.fillStyle = '#15803d';
    ctx.fillRect(-10, -96, 20, 42);
    ctx.strokeStyle = '#9a3412';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(0, 6, 36, 66, 0, 0, Math.PI * 2); ctx.stroke();
  } else if (kind === 'bear_ears' || kind === 'panda_ears') {
    ctx.fillStyle = kind === 'panda_ears' ? '#0f172a' : skin;
    ctx.beginPath(); ctx.arc(-52, -58, 22, 0, Math.PI * 2); ctx.arc(52, -58, 22, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'unicorn_horn') {
    ctx.fillStyle = '#fde047';
    ctx.beginPath(); ctx.moveTo(-14, -54); ctx.lineTo(0, -148); ctx.lineTo(14, -54); ctx.closePath(); ctx.fill();
  } else if (kind === 'nutcracker_shako') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-58, -142, 116, 92);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-58, -68, 116, 16);
    ctx.beginPath(); ctx.arc(0, -110, 14, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'clockwork_key') {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(0, -56); ctx.lineTo(0, -112); ctx.stroke();
    ctx.beginPath(); ctx.arc(-18, -124, 16, 0, Math.PI * 2); ctx.arc(18, -124, 16, 0, Math.PI * 2); ctx.stroke();
  } else if (kind === 'wild_mane') {
    ctx.fillStyle = primary;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 18, -52); ctx.lineTo(i * 26, -112 - (3 - Math.abs(i)) * 8); ctx.lineTo(i * 18 + 16, -48);
      ctx.closePath(); ctx.fill();
    }
  }
}

export function drawAtlasActorCloseUp(
  ctx: CanvasRenderingContext2D,
  cast: CastMember,
  expression: ExpressionId,
  viseme: number,
  speechEnergy: number,
  lightSide: 'left' | 'right',
  t: number
): boolean {
  const bp = ATLAS_BLUEPRINTS[cast.archetype];
  if (!bp) return false;

  const ts = snap24(t);
  const seed = hashSeed(cast.id);
  const primary = cast.primaryColor || '#3b82f6';
  const accent = cast.accentColor || '#facc15';
  const skin = bp.skinOverride || cast.skinColor || '#e2a882';
  const skinShadow = darkenHex(skin, 0.72);
  const lightRight = lightSide === 'right';
  const tilt = getExpressionHeadTilt(expression);

  ctx.save();
  ctx.rotate(tilt);

  // Back hair for humanoids
  if (bp.hairColor && bp.build !== 'quadruped' && bp.build !== 'aquatic' && bp.build !== 'slime') {
    ctx.fillStyle = bp.hairColor;
    ctx.beginPath();
    ctx.moveTo(-74, -56); ctx.lineTo(74, -56); ctx.lineTo(82, 76); ctx.lineTo(-82, 76);
    ctx.closePath(); ctx.fill();
  }

  // Head silhouette by build
  ctx.fillStyle = skin;
  if (bp.build === 'slime') {
    ctx.globalAlpha = 0.88;
    ctx.beginPath(); ctx.arc(0, 12, 70, Math.PI, 0); ctx.lineTo(76, 68); ctx.lineTo(-76, 68); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
  } else if (bp.build === 'aquatic' || bp.build === 'biped_dino') {
    ctx.beginPath(); ctx.ellipse(0, 4, 72, 58, 0, 0, Math.PI * 2); ctx.fill();
  } else if (bp.build === 'golem') {
    ctx.beginPath(); ctx.roundRect(-68, -62, 136, 136, 16); ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(-64, -56); ctx.lineTo(64, -56); ctx.lineTo(58, 22);
    ctx.lineTo(24, 74); ctx.lineTo(-24, 74); ctx.lineTo(-58, 22);
    ctx.closePath(); ctx.fill();
  }

  // Chiaroscuro half-shadow
  ctx.save();
  ctx.clip();
  ctx.fillStyle = skinShadow;
  ctx.fillRect(lightRight ? -90 : 0, -90, 90, 190);
  if (cast.archetype === 'giant_panda') {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.ellipse(-28, -8, 20, 16, -0.2, 0, Math.PI * 2); ctx.ellipse(28, -8, 20, 16, 0.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // Headgear
  drawHeadgear(ctx, bp.headgear, primary, accent, skin);

  // Eyes (unless fully occluded by solid visor)
  if (bp.face !== 'cyber_visor' && bp.face !== 'gas_mask') {
    drawUnifiedEyePair(ctx, expression, accent, ts, speechEnergy, {
      glowing: Boolean(bp.glowingEyes),
      eyeX: 28,
      eyeY: -8,
      castSeed: seed,
    });
  }

  // Face Overlays
  if (bp.face === 'cyber_visor') {
    ctx.fillStyle = 'rgba(0, 240, 255, 0.42)';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect(-56, -24, 112, 28, 8); ctx.fill(); ctx.stroke();
  } else if (bp.face === 'glasses_round') {
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(-28, -8, 19, 0, Math.PI * 2);
    ctx.arc(28, -8, 19, 0, Math.PI * 2);
    ctx.moveTo(-9, -8); ctx.lineTo(9, -8);
    ctx.stroke();
  } else if (bp.face === 'plague_beak' || bp.face === 'beak_raptor') {
    ctx.fillStyle = bp.face === 'plague_beak' ? '#f5f5f4' : '#f59e0b';
    ctx.beginPath(); ctx.moveTo(-18, 2); ctx.lineTo(68, 24); ctx.lineTo(-14, 34); ctx.closePath(); ctx.fill();
  } else if (bp.face === 'surgical_mask' || bp.face === 'bandana_mask') {
    ctx.fillStyle = bp.face === 'surgical_mask' ? '#bae6fd' : primary;
    ctx.beginPath(); ctx.roundRect(-54, 14, 108, 52, 12); ctx.fill();
  } else if (bp.face === 'gas_mask') {
    ctx.fillStyle = '#334155';
    ctx.beginPath(); ctx.arc(-26, -8, 18, 0, Math.PI * 2); ctx.arc(26, -8, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.arc(0, 32, 22, 0, Math.PI * 2); ctx.fill();
  } else if (bp.face === 'beard_white' || bp.face === 'beard_dark') {
    ctx.fillStyle = bp.face === 'beard_white' ? '#f1f5f9' : '#291c14';
    ctx.beginPath(); ctx.moveTo(-54, 24); ctx.quadraticCurveTo(0, 126, 54, 24); ctx.lineTo(36, 72); ctx.lineTo(-36, 72); ctx.closePath(); ctx.fill();
  } else if (bp.face === 'beard_mustache') {
    ctx.fillStyle = bp.hairColor || '#291c14';
    ctx.beginPath(); ctx.ellipse(-18, 24, 20, 7, -0.15, 0, Math.PI * 2); ctx.ellipse(18, 24, 20, 7, 0.15, 0, Math.PI * 2); ctx.fill();
  } else if (bp.face === 'canine_snout' || bp.face === 'dino_jaws' || bp.face === 'shark_teeth') {
    ctx.fillStyle = darkenHex(skin, 0.82);
    ctx.beginPath(); ctx.ellipse(0, 22, 26, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.arc(0, 14, 8, 0, Math.PI * 2); ctx.fill();
    if (bp.face === 'dino_jaws' || bp.face === 'shark_teeth') {
      ctx.fillStyle = '#ffffff';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(i * 12 - 4, 34); ctx.lineTo(i * 12, 46); ctx.lineTo(i * 12 + 4, 34); ctx.fill();
      }
    }
  } else if (bp.face === 'hologram_scan') {
    ctx.fillStyle = 'rgba(34, 211, 238, 0.36)';
    for (let y = -52; y <= 64; y += 10) ctx.fillRect(-60, y + ((ts * 30) % 10), 120, 3);
  } else if (bp.face === 'nutcracker_jaw') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-24, 30, 48, 22);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.strokeRect(-24, 30, 48, 22);
  }

  // Mouth (if not masked)
  if (bp.face !== 'surgical_mask' && bp.face !== 'bandana_mask' && bp.face !== 'plague_beak' && bp.face !== 'gas_mask') {
    drawUnifiedMouth(ctx, expression, viseme, {
      y: 38,
      scale: 1,
    });
  }

  ctx.restore();
  return true;
}

function drawEmblemInHand(ctx: CanvasRenderingContext2D, kind: EmblemKind, accent: string, ts: number) {
  if (kind === 'none') return;
  ctx.save();
  ctx.translate(42, -74 + Math.sin(ts * 3.5) * 3);
  if (kind === 'lightning') {
    ctx.fillStyle = '#fde047';
    ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(-10, -4); ctx.lineTo(4, -4); ctx.lineTo(-6, 28); ctx.lineTo(14, -10); ctx.lineTo(0, -10); ctx.closePath(); ctx.fill();
  } else if (kind === 'spear' || kind === 'staff' || kind === 'trident' || kind === 'scythe') {
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, 60); ctx.lineTo(0, -64); ctx.stroke();
    ctx.fillStyle = accent;
    if (kind === 'trident') {
      ctx.fillRect(-14, -74, 28, 6);
      ctx.fillRect(-14, -92, 4, 22); ctx.fillRect(-2, -98, 4, 28); ctx.fillRect(10, -92, 4, 22);
    } else if (kind === 'scythe') {
      ctx.beginPath(); ctx.moveTo(0, -64); ctx.quadraticCurveTo(36, -68, 42, -32); ctx.quadraticCurveTo(18, -50, 0, -52); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(0, -70, 10, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'sword' || kind === 'wand' || kind === 'baton') {
    ctx.fillStyle = kind === 'sword' ? '#e2e8f0' : '#f8fafc';
    ctx.fillRect(-3, -58, 6, 54);
    ctx.fillStyle = accent;
    ctx.fillRect(-10, -6, 20, 5);
  } else if (kind === 'shield') {
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.moveTo(-18, -24); ctx.lineTo(18, -24); ctx.lineTo(14, 14); ctx.lineTo(0, 28); ctx.lineTo(-14, 14); ctx.closePath(); ctx.fill();
  } else if (kind === 'lantern' || kind === 'flask' || kind === 'ball') {
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'laptop' || kind === 'book' || kind === 'parcel') {
    ctx.fillStyle = accent;
    ctx.fillRect(-16, -12, 32, 24);
  } else {
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.roundRect(-10, -14, 20, 28, 5); ctx.fill();
  }
  ctx.restore();
}

export function drawAtlasActorFullBody(
  ctx: CanvasRenderingContext2D,
  cast: CastMember,
  pose: PoseId,
  expression: ExpressionId,
  viseme: number,
  speechEnergy: number,
  stride: number,
  t: number
): boolean {
  const bp = ATLAS_BLUEPRINTS[cast.archetype];
  if (!bp) return false;

  const ts = snap24(t);
  const seed = hashSeed(cast.id);
  const primary = cast.primaryColor || '#3b82f6';
  const primaryDark = darkenHex(primary, 0.56);
  const accent = cast.accentColor || '#facc15';
  const skin = bp.skinOverride || cast.skinColor || '#e2a882';
  const breath = Math.sin(ts * 2.3 + seed * 0.2) * 2.5;
  const sway = Math.sin(ts * 3.8 + seed) * 9;

  ctx.save();

  // Special non-humanoid silhouettes
  if (bp.build === 'slime') {
    const squash = 1 + Math.sin(ts * 4.5 + seed) * 0.08;
    ctx.scale(squash, 2 - squash);
    ctx.fillStyle = skin;
    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(0, -34, 48, Math.PI, 0); ctx.lineTo(54, 0); ctx.lineTo(-54, 0); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.translate(0, -44); ctx.scale(0.36, 0.36);
    drawAtlasActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', ts);
    ctx.restore();
    return true;
  }

  if (bp.build === 'octopus') {
    ctx.fillStyle = skin;
    for (let i = 0; i < 6; i++) {
      const ox = (i - 2.5) * 18;
      const wave = Math.sin(ts * 4 + i * 0.9) * 12;
      ctx.beginPath();
      ctx.moveTo(ox * 0.5, -52);
      ctx.quadraticCurveTo(ox + wave, -24, ox * 1.3 - wave * 0.5, 0);
      ctx.lineWidth = 10; ctx.strokeStyle = skin; ctx.lineCap = 'round'; ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(0, -88 + breath, 44, 38, 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(0, -90 + breath); ctx.scale(0.36, 0.36);
    drawAtlasActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', ts);
    ctx.restore();
    return true;
  }

  if (bp.build === 'aquatic') {
    const swim = Math.sin(ts * 4.2 + seed) * 8;
    ctx.translate(0, -44 + swim);
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.ellipse(0, 0, 68, 28, 0, 0, Math.PI * 2); ctx.fill();
    // Dorsal fin + tail
    ctx.beginPath(); ctx.moveTo(-10, -24); ctx.lineTo(8, -58); ctx.lineTo(24, -22); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-64, 0); ctx.lineTo(-96, -28 + sway * 0.4); ctx.lineTo(-96, 28 + sway * 0.4); ctx.closePath(); ctx.fill();
    ctx.translate(36, -6); ctx.scale(0.32, 0.32);
    drawAtlasActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', ts);
    ctx.restore();
    return true;
  }

  if (bp.build === 'quadruped') {
    // Wings if pegasus / griffin
    if (bp.back === 'wings_angel') {
      ctx.fillStyle = accent;
      ctx.beginPath(); ctx.moveTo(-10, -68); ctx.lineTo(-76, -126 + sway); ctx.lineTo(-22, -48); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(10, -68); ctx.lineTo(76, -126 - sway); ctx.lineTo(22, -48); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = darkenHex(skin, 0.72);
    ctx.fillRect(-40 - stride * 0.4, -46, 12, 46);
    ctx.fillRect(-16 + stride * 0.4, -46, 12, 46);
    ctx.fillRect(14 - stride * 0.4, -46, 12, 46);
    ctx.fillRect(34 + stride * 0.4, -46, 12, 46);
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.ellipse(0, -62 + breath, 52, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(42, -96 + breath); ctx.scale(0.34, 0.34);
    drawAtlasActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', ts);
    ctx.restore();
    return true;
  }

  if (bp.build === 'avian' || bp.build === 'penguin') {
    const flap = Math.sin(ts * 6 + seed) * 18;
    ctx.fillStyle = bp.back === 'wings_flame' ? '#f97316' : primary;
    if (bp.build === 'avian') {
      ctx.beginPath(); ctx.moveTo(-18, -82); ctx.lineTo(-92, -112 + flap); ctx.lineTo(-42, -52); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(18, -82); ctx.lineTo(92, -112 - flap); ctx.lineTo(42, -52); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.ellipse(0, -62 + breath, 30, 44, 0, 0, Math.PI * 2); ctx.fill();
    if (bp.build === 'penguin') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(0, -58 + breath, 20, 34, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-16, -18, 12, 18); ctx.fillRect(4, -18, 12, 18);
    ctx.translate(0, -116 + breath); ctx.scale(0.34, 0.34);
    drawAtlasActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', ts);
    ctx.restore();
    return true;
  }

  if (bp.build === 'biped_dino') {
    // Swept dinosaur tail
    ctx.fillStyle = darkenHex(skin, 0.78);
    ctx.beginPath(); ctx.moveTo(-22, -52); ctx.quadraticCurveTo(-84, -44, -98, -72 + sway * 0.5); ctx.lineTo(-18, -28); ctx.closePath(); ctx.fill();
    if (bp.back === 'wings_dragon') {
      ctx.fillStyle = accent;
      ctx.beginPath(); ctx.moveTo(-8, -88); ctx.lineTo(-76, -124 + sway); ctx.lineTo(-36, -54); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(8, -88); ctx.lineTo(76, -124 - sway); ctx.lineTo(36, -54); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = darkenHex(skin, 0.7);
    ctx.fillRect(-20 - stride * 0.45, -48, 16, 48); ctx.fillRect(8 + stride * 0.45, -48, 16, 48);
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.ellipse(4, -76 + breath, 32, 42, 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.translate(22, -124 + breath); ctx.scale(0.36, 0.36);
    drawAtlasActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', ts);
    ctx.restore();
    return true;
  }

  // Humanoid / Heroic / Slim / Stocky / Floating / Mermaid / Golem builds
  const wScale = bp.build === 'golem' ? 1.32 : bp.build === 'heroic' ? 1.12 : bp.build === 'slim' ? 0.88 : bp.build === 'stocky' ? 1.15 : 1.0;
  const hScale = bp.build === 'stocky' ? 0.88 : bp.build === 'golem' ? 1.12 : 1.0;
  const hoverOffset = bp.build === 'floating' ? Math.sin(ts * 3.2 + seed) * 10 - 16 : 0;

  ctx.translate(0, hoverOffset);
  ctx.scale(wScale, hScale);

  // Back accessories
  if (bp.back === 'cape_royal' || bp.back === 'cape_tattered') {
    ctx.fillStyle = primaryDark;
    ctx.beginPath();
    ctx.moveTo(-24, -120); ctx.lineTo(-56 - sway * 0.7, -12); ctx.lineTo(44 - sway * 0.4, -14); ctx.lineTo(24, -120);
    ctx.closePath(); ctx.fill();
  } else if (bp.back === 'wings_angel' || bp.back === 'wings_stone' || bp.back === 'wings_flame' || bp.back === 'wings_dragon') {
    ctx.fillStyle = bp.back === 'wings_stone' ? '#475569' : bp.back === 'wings_flame' ? '#f97316' : '#f8fafc';
    for (const sgn of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(sgn * 14, -112); ctx.lineTo(sgn * 84, -144 + sway * sgn); ctx.lineTo(sgn * 54, -52); ctx.closePath(); ctx.fill();
    }
  } else if (bp.back === 'nine_tails') {
    ctx.fillStyle = '#fef3c7';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.ellipse(i * 22, -52 + Math.abs(i) * 8 + sway * 0.3, 12, 42, i * 0.35, 0, Math.PI * 2); ctx.fill();
    }
  } else if (bp.back === 'aura_ring') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, -104, 54, 0, Math.PI * 2); ctx.stroke();
  } else if (bp.back === 'jetpack' || bp.back === 'backpack') {
    ctx.fillStyle = '#334155';
    ctx.beginPath(); ctx.roundRect(-34, -116, 68, 52, 10); ctx.fill();
  } else if (bp.back === 'treant_branches') {
    ctx.strokeStyle = '#713f12';
    ctx.lineWidth = 8;
    for (const sgn of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(sgn * 18, -112); ctx.lineTo(sgn * 64, -152); ctx.stroke();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath(); ctx.arc(sgn * 64, -152, 18, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Lower body: mermaid tail, floating djinn tail, robe, or legs
  if (bp.build === 'mermaid') {
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(-22, -62); ctx.quadraticCurveTo(-24, -16, 12, 0); ctx.lineTo(36, 12); ctx.lineTo(24, -12); ctx.quadraticCurveTo(20, -40, 22, -62);
    ctx.closePath(); ctx.fill();
  } else if (bp.build === 'floating' && bp.back === 'djinn_smoke') {
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(-24, -64); ctx.quadraticCurveTo(18, -32, -8, 6); ctx.quadraticCurveTo(28, -26, 24, -64);
    ctx.closePath(); ctx.fill();
  } else if (pose === 'sit' || pose === 'kneel') {
    ctx.fillStyle = primaryDark;
    ctx.fillRect(-26, -34, 52, 34);
  } else {
    ctx.fillStyle = primaryDark;
    ctx.fillRect(-20 - stride * 0.5, -54, 15, 54);
    ctx.fillRect(5 + stride * 0.5, -54, 15, 54);
  }

  // Torso / Garment
  ctx.fillStyle = primary;
  ctx.beginPath(); ctx.roundRect(-28, -124 + breath, 56, 74, 14); ctx.fill();
  // Accent sash / trim / belt
  ctx.fillStyle = accent;
  if (bp.garment === 'ballet_tutu') {
    ctx.beginPath(); ctx.ellipse(0, -56 + breath, 44, 14, 0, 0, Math.PI * 2); ctx.fill();
  } else if (bp.garment === 'business_suit' || bp.garment === 'tuxedo_tails') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(-12, -124 + breath); ctx.lineTo(12, -124 + breath); ctx.lineTo(0, -88 + breath); ctx.closePath(); ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(-3, -118 + breath, 6, 30);
  } else {
    ctx.fillRect(-28, -72 + breath, 56, 10);
    ctx.fillRect(-6, -122 + breath, 12, 48);
  }

  // Articulated Arms
  const armLift = pose === 'attack' ? -28 : pose === 'gesture' ? -18 : 0;
  ctx.strokeStyle = primary;
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-26, -112 + breath); ctx.lineTo(-42, -68 + breath);
  ctx.moveTo(26, -112 + breath); ctx.lineTo(42, -74 + armLift + breath);
  ctx.stroke();

  // Held emblem
  drawEmblemInHand(ctx, bp.emblem, accent, ts);

  // Sculpted Head
  ctx.save();
  ctx.translate(0, -150 + breath);
  ctx.scale(0.36 / wScale, 0.36 / hScale);
  drawAtlasActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', ts);
  ctx.restore();

  ctx.restore();
  return true;
}
