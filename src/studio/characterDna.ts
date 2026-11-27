/**
 * Katha Studio — Sims-Style Modular Character, Animal & Entity DNA System
 *
 * Replaces static template silhouettes with a parametric, JSON-serializable
 * CharacterDNA genome across 6 anatomical chassis:
 *   1. humanoid   (humans, gods, royals, warriors, sages, children, giants)
 *   2. quadruped  (lions, tigers, foxes, wolves, elephants, bulls, deer, dogs, hares, crocs)
 *   3. avian      (crows, ravens, cranes, owls, eagles, mythic birds)
 *   4. serpentine (nagas, cobras, wyrms, sea serpents)
 *   5. arachnid   (Anansi spiders, multi-legged folklore creatures)
 *   6. ethereal   (floating spirits, Betaal, forest yakshas, celestial wisps)
 *
 * Supports:
 * - Deterministic hydration of all 40 legacy ArchetypeIds -> rich editable DNA
 * - Compact LLM DNA recipe & natural-language trait parsing
 * - Deterministic silhouette fingerprinting & structural distance math (0..1)
 * - Anti-twin mutation engine (intra-cast + cross-upload Publish Ledger guard)
 */

import type { ArchetypeId, CastMember } from './types';

export type EntityChassisId =
  | 'humanoid'
  | 'quadruped'
  | 'avian'
  | 'serpentine'
  | 'arachnid'
  | 'ethereal';

export type DnaGaitId =
  | 'auto'
  | 'heavy'
  | 'predator'
  | 'agile'
  | 'ethereal'
  | 'martial'
  | 'regal'
  | 'folk';

export type HeadShapeId =
  | 'chiseled'
  | 'oval'
  | 'round'
  | 'angular'
  | 'gaunt'
  | 'broad_jaw'
  | 'canine_snout'
  | 'feline_muzzle'
  | 'equine_snout'
  | 'elephant_trunk'
  | 'croc_snout'
  | 'curved_beak'
  | 'raptor_beak'
  | 'serpent_hood'
  | 'arachnid_mandible';

export type EyeStyleId =
  | 'almond'
  | 'wide_fable'
  | 'narrow_sharp'
  | 'heavy_lidded'
  | 'glowing_orb'
  | 'slit_reptile'
  | 'owl_disc'
  | 'multi_eyes';

export type NoseStyleId =
  | 'classic'
  | 'aquiline'
  | 'button'
  | 'broad'
  | 'snout_bridge'
  | 'none';

export type EarStyleId =
  | 'human'
  | 'pointed_elf'
  | 'fox_tall'
  | 'lion_round'
  | 'elephant_fan'
  | 'hare_long'
  | 'cow_side'
  | 'fin_frill'
  | 'none';

export type HornStyleId =
  | 'none'
  | 'curved_ram'
  | 'bull_horns'
  | 'deer_antlers'
  | 'demon_crown_horns'
  | 'unicorn_spire'
  | 'oni_twin';

export type HairStyleId =
  | 'none'
  | 'short_crop'
  | 'swept_royal'
  | 'long_flowing'
  | 'topknot_bun'
  | 'braided_twin'
  | 'wild_spiky'
  | 'lion_mane'
  | 'feather_crest'
  | 'dreadlocks'
  | 'hooded_cowl';

export type FacialHairId =
  | 'none'
  | 'royal_mustache'
  | 'handlebar'
  | 'short_trimmed'
  | 'sage_long_beard'
  | 'goatee'
  | 'whiskers';

export type FaceMarkId =
  | 'none'
  | 'vermilion_tilak'
  | 'tripundra_ash'
  | 'maang_tikka'
  | 'third_eye'
  | 'war_paint'
  | 'cheek_scar'
  | 'eye_patch'
  | 'freckles'
  | 'tribal_lines';

export type TopStyleId =
  | 'none_fur'
  | 'royal_angarkha'
  | 'saree_drape'
  | 'sage_wrap'
  | 'plate_armor'
  | 'samurai_cuirass'
  | 'peasant_tunic'
  | 'scholar_robe'
  | 'toga_chiton'
  | 'kente_wrap'
  | 'mystic_vest';

export type BottomStyleId =
  | 'dhoti'
  | 'flowing_skirt'
  | 'armored_greaves'
  | 'trousers'
  | 'loincloth'
  | 'robe_hem'
  | 'animal_legs'
  | 'coiled_tail'
  | 'ethereal_wisp';

export type CollarAccessoryId =
  | 'none'
  | 'gold_necklace'
  | 'rudraksha_beads'
  | 'scarf_muffler'
  | 'fur_mantle'
  | 'royal_sash'
  | 'pauldron_plates'
  | 'cobra_garland';

export type CapeStyleId =
  | 'none'
  | 'royal_cape'
  | 'tattered_cloak'
  | 'flowing_dupatta'
  | 'feather_mantle'
  | 'celestial_ribbon';

export type HeadwearStyleId =
  | 'none'
  | 'golden_mukut'
  | 'royal_turban'
  | 'mughal_pagri'
  | 'ten_crown'
  | 'battle_helm'
  | 'kabuto_crest'
  | 'wizard_hat'
  | 'laurel_wreath'
  | 'floral_tiara'
  | 'bandana'
  | 'straw_conical';

export type SurfacePatternId =
  | 'solid'
  | 'tiger_stripes'
  | 'leopard_spots'
  | 'serpent_scales'
  | 'feather_layers'
  | 'royal_brocade'
  | 'kente_weave'
  | 'bark_grain'
  | 'starfield_cosmic'
  | 'stone_cracks';

export type WingStyleId =
  | 'none'
  | 'feathered_angel'
  | 'raven_dark'
  | 'bat_demon'
  | 'butterfly_fey'
  | 'dragon_leathery'
  | 'celestial_flame';

export type TailStyleId =
  | 'none'
  | 'monkey_curled'
  | 'fox_bushy'
  | 'lion_tufted'
  | 'dragon_spiked'
  | 'peacock_fan'
  | 'serpent_whip'
  | 'deer_short';

export type AuraStyleId =
  | 'none'
  | 'solar_halo'
  | 'lunar_crescent'
  | 'ember_sparks'
  | 'shadow_wisps'
  | 'petal_orbit';

export interface CharacterMorph {
  height: number; // 0.72 .. 1.32
  shoulderWidth: number; // 0.70 .. 1.45
  torsoBulk: number; // 0.72 .. 1.40
  headRatio: number; // 0.78 .. 1.30
  limbLength: number; // 0.78 .. 1.28
  posture: number; // -0.25 .. +0.35
  gait?: DnaGaitId;
}

export interface CharacterHeadSpec {
  headShape: HeadShapeId;
  eyeStyle: EyeStyleId;
  noseStyle: NoseStyleId;
  ears: EarStyleId;
  horns: HornStyleId;
  hairStyle: HairStyleId;
  facialHair: FacialHairId;
  faceMark: FaceMarkId;
}

export interface CharacterOutfitSpec {
  topStyle: TopStyleId;
  bottomStyle: BottomStyleId;
  collarAccessory: CollarAccessoryId;
  capeStyle: CapeStyleId;
  headwear: HeadwearStyleId;
  surfacePattern: SurfacePatternId;
}

export interface CharacterAppendagesSpec {
  wings: WingStyleId;
  tail: TailStyleId;
  extraArms: 0 | 2;
  aura: AuraStyleId;
}

export interface CharacterPaletteSpec {
  primary: string;
  secondary: string;
  accent: string;
  skin: string;
  hair: string;
  eye: string;
  patternTint: string;
}

export interface CharacterDNA {
  version: 1;
  chassis: EntityChassisId;
  morph: CharacterMorph;
  head: CharacterHeadSpec;
  outfit: CharacterOutfitSpec;
  appendages: CharacterAppendagesSpec;
  palette: CharacterPaletteSpec;
  seedTag?: string;
}

export interface CharacterSilhouetteFingerprint {
  castId: string;
  name: string;
  archetype: ArchetypeId;
  chassis: EntityChassisId;
  headShape: HeadShapeId;
  hairStyle: HairStyleId;
  headwear: HeadwearStyleId;
  horns: HornStyleId;
  ears: EarStyleId;
  topStyle: TopStyleId;
  capeStyle: CapeStyleId;
  surfacePattern: SurfacePatternId;
  wings: WingStyleId;
  tail: TailStyleId;
  extraArms: 0 | 2;
  aura: AuraStyleId;
  height: number;
  shoulderWidth: number;
  torsoBulk: number;
  primaryHex: string;
  skinHex: string;
  hasCustomDna: boolean;
}

// =========================================================================
// OPTION CATALOGS (Used by Workshop UI, Validator & Randomizer)
// =========================================================================

export const CHASSIS_CATALOG: Array<{ id: EntityChassisId; label: string; note: string }> = [
  { id: 'humanoid', label: 'Humanoid', note: 'Humans, gods, royals, warriors, sages & folk' },
  { id: 'quadruped', label: 'Quadruped Beast', note: 'Lions, foxes, elephants, wolves, deer & beasts' },
  { id: 'avian', label: 'Avian & Winged', note: 'Ravens, owls, cranes, eagles & mythic birds' },
  { id: 'serpentine', label: 'Serpentine', note: 'Nagas, cobras, wyrms & river serpents' },
  { id: 'arachnid', label: 'Arachnid', note: 'Anansi spiders & multi-limbed tricksters' },
  { id: 'ethereal', label: 'Ethereal Spirit', note: 'Betaal, ghosts, forest yakshas & celestial wisps' },
];

export const GAIT_CATALOG: Array<{ id: DnaGaitId; label: string }> = [
  { id: 'auto', label: 'Auto (Match Chassis)' },
  { id: 'regal', label: 'Regal & Poised' },
  { id: 'martial', label: 'Martial & Driven' },
  { id: 'folk', label: 'Lively Folk' },
  { id: 'predator', label: 'Prowling Predator' },
  { id: 'agile', label: 'Agile & Darting' },
  { id: 'heavy', label: 'Heavy & Towering' },
  { id: 'ethereal', label: 'Floating Ethereal' },
];

export const HEAD_SHAPE_CATALOG: Array<{ id: HeadShapeId; label: string; family: 'human' | 'animal' | 'creature' }> = [
  { id: 'chiseled', label: 'Chiseled Hero', family: 'human' },
  { id: 'oval', label: 'Graceful Oval', family: 'human' },
  { id: 'round', label: 'Warm Round', family: 'human' },
  { id: 'angular', label: 'Sharp Angular', family: 'human' },
  { id: 'gaunt', label: 'Gaunt Elder', family: 'human' },
  { id: 'broad_jaw', label: 'Broad Titan', family: 'human' },
  { id: 'canine_snout', label: 'Canine Snout', family: 'animal' },
  { id: 'feline_muzzle', label: 'Feline Muzzle', family: 'animal' },
  { id: 'equine_snout', label: 'Deer / Bull Snout', family: 'animal' },
  { id: 'elephant_trunk', label: 'Elephant Trunk', family: 'animal' },
  { id: 'croc_snout', label: 'Crocodile Jaw', family: 'animal' },
  { id: 'curved_beak', label: 'Crow / Raven Beak', family: 'animal' },
  { id: 'raptor_beak', label: 'Owl / Hawk Beak', family: 'animal' },
  { id: 'serpent_hood', label: 'Cobra Hood', family: 'creature' },
  { id: 'arachnid_mandible', label: 'Spider Mandible', family: 'creature' },
];

export const EYE_STYLE_CATALOG: Array<{ id: EyeStyleId; label: string }> = [
  { id: 'almond', label: 'Classic Almond' },
  { id: 'wide_fable', label: 'Wide Fable' },
  { id: 'narrow_sharp', label: 'Narrow Sharp' },
  { id: 'heavy_lidded', label: 'Wise Heavy-Lid' },
  { id: 'glowing_orb', label: 'Spirit Glow' },
  { id: 'slit_reptile', label: 'Reptile Slit' },
  { id: 'owl_disc', label: 'Owl Facial Disc' },
  { id: 'multi_eyes', label: 'Multi-Eyes (Spider)' },
];

export const NOSE_STYLE_CATALOG: Array<{ id: NoseStyleId; label: string }> = [
  { id: 'classic', label: 'Classic Bridge' },
  { id: 'aquiline', label: 'Aquiline Sharp' },
  { id: 'button', label: 'Soft Button' },
  { id: 'broad', label: 'Broad Strong' },
  { id: 'snout_bridge', label: 'Animal Nose' },
  { id: 'none', label: 'None (Beak/Mask)' },
];

export const EAR_STYLE_CATALOG: Array<{ id: EarStyleId; label: string }> = [
  { id: 'human', label: 'Human Ears' },
  { id: 'pointed_elf', label: 'Pointed Fae' },
  { id: 'fox_tall', label: 'Fox / Wolf Tall' },
  { id: 'lion_round', label: 'Lion / Monkey Round' },
  { id: 'elephant_fan', label: 'Elephant Fan' },
  { id: 'hare_long', label: 'Long Hare Ears' },
  { id: 'cow_side', label: 'Bull / Deer Side' },
  { id: 'fin_frill', label: 'Aquatic / Naga Fin' },
  { id: 'none', label: 'No External Ears' },
];

export const HORN_STYLE_CATALOG: Array<{ id: HornStyleId; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'curved_ram', label: 'Curved Ram' },
  { id: 'bull_horns', label: 'Noble Bull' },
  { id: 'deer_antlers', label: 'Forest Antlers' },
  { id: 'demon_crown_horns', label: 'Asura Crown Horns' },
  { id: 'unicorn_spire', label: 'Celestial Spire' },
  { id: 'oni_twin', label: 'Twin Oni Spikes' },
];

export const HAIR_STYLE_CATALOG: Array<{ id: HairStyleId; label: string }> = [
  { id: 'none', label: 'None / Bald' },
  { id: 'short_crop', label: 'Short Crop' },
  { id: 'swept_royal', label: 'Swept Royal' },
  { id: 'long_flowing', label: 'Long Flowing' },
  { id: 'topknot_bun', label: 'Sage Jata Topknot' },
  { id: 'braided_twin', label: 'Twin Braids' },
  { id: 'wild_spiky', label: 'Wild Spiky' },
  { id: 'lion_mane', label: 'Sunburst Mane' },
  { id: 'feather_crest', label: 'Plumed Crest' },
  { id: 'dreadlocks', label: 'Mystic Locks' },
  { id: 'hooded_cowl', label: 'Shadowed Cowl' },
];

export const FACIAL_HAIR_CATALOG: Array<{ id: FacialHairId; label: string }> = [
  { id: 'none', label: 'Clean' },
  { id: 'royal_mustache', label: 'Royal Mustache' },
  { id: 'handlebar', label: 'Curled Handlebar' },
  { id: 'short_trimmed', label: 'Trimmed Beard' },
  { id: 'sage_long_beard', label: 'Long Sage Beard' },
  { id: 'goatee', label: 'Witty Goatee' },
  { id: 'whiskers', label: 'Feline / Fox Whiskers' },
];

export const FACE_MARK_CATALOG: Array<{ id: FaceMarkId; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'vermilion_tilak', label: 'Vermilion Tilak' },
  { id: 'tripundra_ash', label: 'Tripundra Ash' },
  { id: 'maang_tikka', label: 'Golden Maang Tikka' },
  { id: 'third_eye', label: 'Radiant Third Eye' },
  { id: 'war_paint', label: 'Battle War Paint' },
  { id: 'cheek_scar', label: 'Veteran Cheek Scar' },
  { id: 'eye_patch', label: 'Corsair Eye Patch' },
  { id: 'freckles', label: 'Folk Freckles' },
  { id: 'tribal_lines', label: 'Griot / Tribal Lines' },
];

export const TOP_STYLE_CATALOG: Array<{ id: TopStyleId; label: string }> = [
  { id: 'none_fur', label: 'Natural Fur / Scales' },
  { id: 'royal_angarkha', label: 'Royal Angarkha' },
  { id: 'saree_drape', label: 'Silk Saree Drape' },
  { id: 'sage_wrap', label: 'Ascetic Uttariya' },
  { id: 'plate_armor', label: 'Knight Plate Armor' },
  { id: 'samurai_cuirass', label: 'Samurai O-Yoroi' },
  { id: 'peasant_tunic', label: 'Folk Tunic' },
  { id: 'scholar_robe', label: 'Court Scholar Robe' },
  { id: 'toga_chiton', label: 'Classical Chiton' },
  { id: 'kente_wrap', label: 'Kente Woven Wrap' },
  { id: 'mystic_vest', label: 'Mystic Shadow Vest' },
];

export const BOTTOM_STYLE_CATALOG: Array<{ id: BottomStyleId; label: string }> = [
  { id: 'dhoti', label: 'Classic Dhoti' },
  { id: 'flowing_skirt', label: 'Flowing Lehenga / Gown' },
  { id: 'armored_greaves', label: 'Armored Greaves' },
  { id: 'trousers', label: 'Tapered Churidar' },
  { id: 'loincloth', label: 'Warrior Wrap' },
  { id: 'robe_hem', label: 'Full Robe Hem' },
  { id: 'animal_legs', label: 'Beast Legs' },
  { id: 'coiled_tail', label: 'Coiled Serpent Body' },
  { id: 'ethereal_wisp', label: 'Spectral Wisp Tail' },
];

export const COLLAR_CATALOG: Array<{ id: CollarAccessoryId; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'gold_necklace', label: 'Royal Gold Haar' },
  { id: 'rudraksha_beads', label: 'Rudraksha Mala' },
  { id: 'scarf_muffler', label: 'Traveler Scarf' },
  { id: 'fur_mantle', label: 'Northern Fur Mantle' },
  { id: 'royal_sash', label: 'Diagonal Sash' },
  { id: 'pauldron_plates', label: 'War Pauldrons' },
  { id: 'cobra_garland', label: 'Serpent Garland' },
];

export const CAPE_CATALOG: Array<{ id: CapeStyleId; label: string }> = [
  { id: 'none', label: 'No Cape' },
  { id: 'royal_cape', label: 'Royal Mantle' },
  { id: 'tattered_cloak', label: 'Tattered Cloak' },
  { id: 'flowing_dupatta', label: 'Silk Dupatta / Stole' },
  { id: 'feather_mantle', label: 'Plumed Mantle' },
  { id: 'celestial_ribbon', label: 'Celestial Ribbon' },
];

export const HEADWEAR_CATALOG: Array<{ id: HeadwearStyleId; label: string }> = [
  { id: 'none', label: 'Bare Head' },
  { id: 'golden_mukut', label: 'Golden Mukut Crown' },
  { id: 'royal_turban', label: 'Royal Pagdi Turban' },
  { id: 'mughal_pagri', label: 'Jeweled Imperial Pagri' },
  { id: 'ten_crown', label: 'Spired Asura Crown' },
  { id: 'battle_helm', label: 'Plumed Battle Helm' },
  { id: 'kabuto_crest', label: 'Crescent Kabuto' },
  { id: 'wizard_hat', label: 'Pointed Mystic Hat' },
  { id: 'laurel_wreath', label: 'Golden Laurel Wreath' },
  { id: 'floral_tiara', label: 'Lotus Tiara' },
  { id: 'bandana', label: 'Traveler Headband' },
  { id: 'straw_conical', label: 'Conical Kasa Hat' },
];

export const SURFACE_PATTERN_CATALOG: Array<{ id: SurfacePatternId; label: string }> = [
  { id: 'solid', label: 'Clean Matte' },
  { id: 'tiger_stripes', label: 'Tiger Stripes' },
  { id: 'leopard_spots', label: 'Spotted Coat' },
  { id: 'serpent_scales', label: 'Iridescent Scales' },
  { id: 'feather_layers', label: 'Layered Feathers' },
  { id: 'royal_brocade', label: 'Gold Brocade' },
  { id: 'kente_weave', label: 'Kente Geometric' },
  { id: 'bark_grain', label: 'Forest Bark Grain' },
  { id: 'starfield_cosmic', label: 'Cosmic Starfield' },
  { id: 'stone_cracks', label: 'Ancient Carved Stone' },
];

export const WING_STYLE_CATALOG: Array<{ id: WingStyleId; label: string }> = [
  { id: 'none', label: 'No Wings' },
  { id: 'feathered_angel', label: 'Celestial Feathered' },
  { id: 'raven_dark', label: 'Shadow Raven' },
  { id: 'bat_demon', label: 'Asura Bat Wings' },
  { id: 'butterfly_fey', label: 'Forest Fey Wings' },
  { id: 'dragon_leathery', label: 'Dragon Wings' },
  { id: 'celestial_flame', label: 'Solar Flame Wings' },
];

export const TAIL_STYLE_CATALOG: Array<{ id: TailStyleId; label: string }> = [
  { id: 'none', label: 'No Tail' },
  { id: 'monkey_curled', label: 'Curled Vanara Tail' },
  { id: 'fox_bushy', label: 'Bushy Kitsune Tail' },
  { id: 'lion_tufted', label: 'Tufted Lion Tail' },
  { id: 'dragon_spiked', label: 'Spiked Dragon Tail' },
  { id: 'peacock_fan', label: 'Peacock Plume Fan' },
  { id: 'serpent_whip', label: 'Serpent Whip Tail' },
  { id: 'deer_short', label: 'Short Forest Tail' },
];

export const AURA_STYLE_CATALOG: Array<{ id: AuraStyleId; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'solar_halo', label: 'Solar Divine Halo' },
  { id: 'lunar_crescent', label: 'Lunar Crescent Glow' },
  { id: 'ember_sparks', label: 'Rising Embers' },
  { id: 'shadow_wisps', label: 'Phantom Shadow Wisps' },
  { id: 'petal_orbit', label: 'Orbiting Lotus Petals' },
];

export const CURATED_DNA_PALETTES: Array<{
  id: string;
  label: string;
  palette: CharacterPaletteSpec;
}> = [
  {
    id: 'royal_vermilion',
    label: 'Ayodhya Gold & Crimson',
    palette: {
      primary: '#b92b27',
      secondary: '#7a1919',
      accent: '#f2c85b',
      skin: '#e09b70',
      hair: '#131622',
      eye: '#f8fafc',
      patternTint: '#ffd978',
    },
  },
  {
    id: 'celestial_indigo',
    label: 'Celestial Indigo & Lotus',
    palette: {
      primary: '#234b8e',
      secondary: '#152e5c',
      accent: '#ffd04d',
      skin: '#5fa4e6',
      hair: '#0c1020',
      eye: '#fff1b8',
      patternTint: '#93c5fd',
    },
  },
  {
    id: 'emerald_forest',
    label: 'Jataka Forest & Ochre',
    palette: {
      primary: '#2d6a4f',
      secondary: '#1b4332',
      accent: '#e9c46a',
      skin: '#c9885b',
      hair: '#1e1612',
      eye: '#fef08a',
      patternTint: '#95d5b2',
    },
  },
  {
    id: 'saffron_sage',
    label: 'Himalayan Saffron',
    palette: {
      primary: '#d96b1f',
      secondary: '#8f3e0e',
      accent: '#f7d577',
      skin: '#d9986c',
      hair: '#dfe6f2',
      eye: '#ffffff',
      patternTint: '#fed7aa',
    },
  },
  {
    id: 'kitsune_autumn',
    label: 'Autumn Fox & Ivory',
    palette: {
      primary: '#c85a28',
      secondary: '#7c2d12',
      accent: '#f8ebd2',
      skin: '#e27d42',
      hair: '#3b1508',
      eye: '#fde047',
      patternTint: '#431407',
    },
  },
  {
    id: 'midnight_spirit',
    label: 'Moonlit Phantom Teal',
    palette: {
      primary: '#1f3252',
      secondary: '#0f1a2e',
      accent: '#67e8f9',
      skin: '#cde6fa',
      hair: '#090d1a',
      eye: '#38bdf8',
      patternTint: '#7dd3fc',
    },
  },
  {
    id: 'kente_sun',
    label: 'Akan Sun & Terracotta',
    palette: {
      primary: '#b45309',
      secondary: '#1e293b',
      accent: '#facc15',
      skin: '#7c4a2d',
      hair: '#0c0a09',
      eye: '#fef9c3',
      patternTint: '#16a34a',
    },
  },
  {
    id: 'imperial_jade',
    label: 'East Asian Jade & Plum',
    palette: {
      primary: '#4a2545',
      secondary: '#261224',
      accent: '#34d399',
      skin: '#eab896',
      hair: '#11131a',
      eye: '#f8fafc',
      patternTint: '#6ee7b7',
    },
  },
];

// =========================================================================
// VALIDATION SETS & HASH HELPERS
// =========================================================================

const VALID_CHASSIS = new Set<EntityChassisId>(CHASSIS_CATALOG.map((c) => c.id));
const VALID_GAITS = new Set<DnaGaitId>(GAIT_CATALOG.map((c) => c.id));
const VALID_HEAD_SHAPES = new Set<HeadShapeId>(HEAD_SHAPE_CATALOG.map((c) => c.id));
const VALID_EYE_STYLES = new Set<EyeStyleId>(EYE_STYLE_CATALOG.map((c) => c.id));
const VALID_NOSE_STYLES = new Set<NoseStyleId>(NOSE_STYLE_CATALOG.map((c) => c.id));
const VALID_EAR_STYLES = new Set<EarStyleId>(EAR_STYLE_CATALOG.map((c) => c.id));
const VALID_HORN_STYLES = new Set<HornStyleId>(HORN_STYLE_CATALOG.map((c) => c.id));
const VALID_HAIR_STYLES = new Set<HairStyleId>(HAIR_STYLE_CATALOG.map((c) => c.id));
const VALID_FACIAL_HAIR = new Set<FacialHairId>(FACIAL_HAIR_CATALOG.map((c) => c.id));
const VALID_FACE_MARKS = new Set<FaceMarkId>(FACE_MARK_CATALOG.map((c) => c.id));
const VALID_TOP_STYLES = new Set<TopStyleId>(TOP_STYLE_CATALOG.map((c) => c.id));
const VALID_BOTTOM_STYLES = new Set<BottomStyleId>(BOTTOM_STYLE_CATALOG.map((c) => c.id));
const VALID_COLLARS = new Set<CollarAccessoryId>(COLLAR_CATALOG.map((c) => c.id));
const VALID_CAPES = new Set<CapeStyleId>(CAPE_CATALOG.map((c) => c.id));
const VALID_HEADWEAR = new Set<HeadwearStyleId>(HEADWEAR_CATALOG.map((c) => c.id));
const VALID_PATTERNS = new Set<SurfacePatternId>(SURFACE_PATTERN_CATALOG.map((c) => c.id));
const VALID_WINGS = new Set<WingStyleId>(WING_STYLE_CATALOG.map((c) => c.id));
const VALID_TAILS = new Set<TailStyleId>(TAIL_STYLE_CATALOG.map((c) => c.id));
const VALID_AURAS = new Set<AuraStyleId>(AURA_STYLE_CATALOG.map((c) => c.id));

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function clampNum(v: unknown, min: number, max: number, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Number(Math.max(min, Math.min(max, n)).toFixed(2));
}

function cleanHex(v: unknown, fallback: string): string {
  if (typeof v === 'string' && HEX_RE.test(v.trim())) {
    const s = v.trim();
    if (s.length === 4) {
      return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`.toLowerCase();
    }
    return s.toLowerCase();
  }
  return fallback;
}

export function hashDnaSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) >>> 0;
}

function seededPick<T>(arr: readonly T[], seed: number, offset = 0): T {
  const idx = Math.abs(seed + offset * 7919) % arr.length;
  return arr[idx];
}

function seededRange(seed: number, offset: number, min: number, max: number): number {
  const frac = ((Math.imul(seed ^ (offset * 2654435761), 1597334677) >>> 0) % 1000) / 1000;
  return Number((min + frac * (max - min)).toFixed(2));
}

function darkenHexSimple(hex: string, factor = 0.58): string {
  const h = cleanHex(hex, '#2b3556').slice(1);
  const r = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(0, 2), 16) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(2, 4), 16) * factor)));
  const b = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(4, 6), 16) * factor)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = cleanHex(hex, '#808080').slice(1);
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const dr = (r1 - r2) / 255;
  const dg = (g1 - g2) / 255;
  const db = (b1 - b2) / 255;
  return Math.min(1, Math.sqrt((dr * dr + dg * dg + db * db) / 3));
}

// =========================================================================
// DETERMINISTIC ARCHETYPE -> CHARACTER DNA HYDRATOR (All 40 Archetypes!)
// =========================================================================

export function createBaseDna(
  chassis: EntityChassisId = 'humanoid',
  overrides?: Partial<{
    morph: Partial<CharacterMorph>;
    head: Partial<CharacterHeadSpec>;
    outfit: Partial<CharacterOutfitSpec>;
    appendages: Partial<CharacterAppendagesSpec>;
    palette: Partial<CharacterPaletteSpec>;
  }>
): CharacterDNA {
  const base: CharacterDNA = {
    version: 1,
    chassis,
    morph: {
      height: 1.0,
      shoulderWidth: 1.0,
      torsoBulk: 1.0,
      headRatio: 1.0,
      limbLength: 1.0,
      posture: 0,
      gait: 'auto',
      ...(overrides?.morph || {}),
    },
    head: {
      headShape:
        chassis === 'quadruped'
          ? 'feline_muzzle'
          : chassis === 'avian'
            ? 'curved_beak'
            : chassis === 'serpentine'
              ? 'serpent_hood'
              : chassis === 'arachnid'
                ? 'arachnid_mandible'
                : 'chiseled',
      eyeStyle:
        chassis === 'serpentine'
          ? 'slit_reptile'
          : chassis === 'arachnid'
            ? 'multi_eyes'
            : chassis === 'ethereal'
              ? 'glowing_orb'
              : 'almond',
      noseStyle:
        chassis === 'avian' || chassis === 'serpentine' || chassis === 'arachnid'
          ? 'none'
          : chassis === 'quadruped'
            ? 'snout_bridge'
            : 'classic',
      ears:
        chassis === 'quadruped'
          ? 'fox_tall'
          : chassis === 'avian' || chassis === 'serpentine' || chassis === 'arachnid'
            ? 'none'
            : chassis === 'ethereal'
              ? 'pointed_elf'
              : 'human',
      horns: 'none',
      hairStyle:
        chassis === 'quadruped' || chassis === 'serpentine' || chassis === 'arachnid'
          ? 'none'
          : chassis === 'avian'
            ? 'feather_crest'
            : chassis === 'ethereal'
              ? 'wild_spiky'
              : 'swept_royal',
      facialHair: 'none',
      faceMark: 'none',
      ...(overrides?.head || {}),
    },
    outfit: {
      topStyle:
        chassis === 'humanoid'
          ? 'royal_angarkha'
          : chassis === 'ethereal'
            ? 'mystic_vest'
            : 'none_fur',
      bottomStyle:
        chassis === 'quadruped' || chassis === 'avian' || chassis === 'arachnid'
          ? 'animal_legs'
          : chassis === 'serpentine'
            ? 'coiled_tail'
            : chassis === 'ethereal'
              ? 'ethereal_wisp'
              : 'dhoti',
      collarAccessory: chassis === 'humanoid' ? 'royal_sash' : 'none',
      capeStyle: chassis === 'ethereal' ? 'tattered_cloak' : 'none',
      headwear: 'none',
      surfacePattern:
        chassis === 'serpentine'
          ? 'serpent_scales'
          : chassis === 'avian'
            ? 'feather_layers'
            : 'solid',
      ...(overrides?.outfit || {}),
    },
    appendages: {
      wings: chassis === 'avian' ? 'raven_dark' : 'none',
      tail:
        chassis === 'quadruped'
          ? 'fox_bushy'
          : chassis === 'serpentine'
            ? 'serpent_whip'
            : 'none',
      extraArms: 0,
      aura: chassis === 'ethereal' ? 'shadow_wisps' : 'none',
      ...(overrides?.appendages || {}),
    },
    palette: {
      primary: '#b92b27',
      secondary: '#6e1918',
      accent: '#f2c85b',
      skin: chassis === 'ethereal' ? '#cde6fa' : '#e09b70',
      hair: '#131622',
      eye: chassis === 'ethereal' ? '#67e8f9' : '#f8fafc',
      patternTint: '#ffd978',
      ...(overrides?.palette || {}),
    },
  };
  return base;
}

/**
 * Hydrates any legacy CastMember (all 40 archetypes) into a rich, editable CharacterDNA
 * matching its visual identity and optionally applying subtle deterministic individuality.
 */
export function hydrateArchetypeToDna(member: Partial<CastMember>, seedSalt = ''): CharacterDNA {
  const arch: ArchetypeId = (member.archetype as ArchetypeId) || 'king';
  const primary = cleanHex(member.primaryColor, '#b92b27');
  const accent = cleanHex(member.accentColor, '#f2c85b');
  const skin = cleanHex(member.skinColor, arch === 'spirit' ? '#cde6fa' : '#e09b70');
  const secondary = darkenHexSimple(primary, 0.56);
  const scale = clampNum(member.scale ?? 1.0, 0.78, 1.28, 1.0);
  const basePal: Partial<CharacterPaletteSpec> = {
    primary,
    secondary,
    accent,
    skin,
    hair: '#111422',
    eye: '#f8fafc',
    patternTint: accent,
  };

  let dna: CharacterDNA;

  switch (arch) {
    case 'deva':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.08, 0.72, 1.32, 1.08), shoulderWidth: 1.12, gait: 'regal' },
        head: { headShape: 'chiseled', hairStyle: 'long_flowing', faceMark: 'vermilion_tilak' },
        outfit: {
          topStyle: 'royal_angarkha',
          bottomStyle: 'dhoti',
          collarAccessory: 'gold_necklace',
          capeStyle: 'celestial_ribbon',
          headwear: 'golden_mukut',
          surfacePattern: 'royal_brocade',
        },
        appendages: { aura: 'solar_halo', extraArms: 2 },
        palette: { ...basePal, eye: '#fff3c4' },
      });
      break;
    case 'goddess':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.04, 0.72, 1.32, 1.04), shoulderWidth: 0.9, torsoBulk: 0.88, gait: 'regal' },
        head: { headShape: 'oval', hairStyle: 'long_flowing', faceMark: 'maang_tikka' },
        outfit: {
          topStyle: 'saree_drape',
          bottomStyle: 'flowing_skirt',
          collarAccessory: 'gold_necklace',
          capeStyle: 'flowing_dupatta',
          headwear: 'golden_mukut',
          surfacePattern: 'royal_brocade',
        },
        appendages: { aura: 'petal_orbit', extraArms: 2 },
        palette: { ...basePal, eye: '#fff3c4' },
      });
      break;
    case 'demon_king':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.22, 0.72, 1.32, 1.22), shoulderWidth: 1.34, torsoBulk: 1.26, gait: 'heavy' },
        head: {
          headShape: 'broad_jaw',
          eyeStyle: 'glowing_orb',
          horns: 'demon_crown_horns',
          hairStyle: 'wild_spiky',
          facialHair: 'handlebar',
          faceMark: 'war_paint',
        },
        outfit: {
          topStyle: 'plate_armor',
          bottomStyle: 'armored_greaves',
          collarAccessory: 'pauldron_plates',
          capeStyle: 'royal_cape',
          headwear: 'ten_crown',
          surfacePattern: 'stone_cracks',
        },
        appendages: { extraArms: 2, aura: 'ember_sparks' },
        palette: { ...basePal, eye: '#ff5e4d' },
      });
      break;
    case 'vanara_hero':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.08, 0.72, 1.32, 1.08), shoulderWidth: 1.24, torsoBulk: 1.15, gait: 'martial' },
        head: { headShape: 'broad_jaw', ears: 'lion_round', noseStyle: 'broad', hairStyle: 'short_crop', faceMark: 'vermilion_tilak' },
        outfit: {
          topStyle: 'sage_wrap',
          bottomStyle: 'dhoti',
          collarAccessory: 'gold_necklace',
          capeStyle: 'none',
          headwear: 'golden_mukut',
        },
        appendages: { tail: 'monkey_curled', aura: 'solar_halo' },
        palette: basePal,
      });
      break;
    case 'spirit':
      dna = createBaseDna('ethereal', {
        morph: { height: clampNum(scale * 1.02, 0.72, 1.32, 1.02), shoulderWidth: 0.94, torsoBulk: 0.85, posture: 0.14, gait: 'ethereal' },
        head: {
          headShape: 'gaunt',
          eyeStyle: 'glowing_orb',
          ears: 'pointed_elf',
          hairStyle: 'wild_spiky',
          faceMark: 'tripundra_ash',
        },
        outfit: {
          topStyle: 'mystic_vest',
          bottomStyle: 'ethereal_wisp',
          capeStyle: 'tattered_cloak',
          headwear: 'none',
          surfacePattern: 'starfield_cosmic',
        },
        appendages: { wings: 'bat_demon', aura: 'shadow_wisps' },
        palette: { ...basePal, eye: '#67e8f9' },
      });
      break;
    case 'yaksha':
      dna = createBaseDna('ethereal', {
        morph: { height: clampNum(scale * 1.18, 0.72, 1.32, 1.18), shoulderWidth: 1.22, torsoBulk: 1.18, gait: 'ethereal' },
        head: {
          headShape: 'angular',
          eyeStyle: 'glowing_orb',
          ears: 'pointed_elf',
          horns: 'deer_antlers',
          hairStyle: 'dreadlocks',
          faceMark: 'tribal_lines',
        },
        outfit: {
          topStyle: 'sage_wrap',
          bottomStyle: 'ethereal_wisp',
          collarAccessory: 'rudraksha_beads',
          capeStyle: 'feather_mantle',
          surfacePattern: 'bark_grain',
        },
        appendages: { aura: 'lunar_crescent' },
        palette: { ...basePal, eye: '#5eead4' },
      });
      break;
    case 'statue_apsara':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.02, 0.72, 1.32, 1.02), shoulderWidth: 0.86, torsoBulk: 0.84, gait: 'ethereal' },
        head: { headShape: 'oval', hairStyle: 'topknot_bun', faceMark: 'maang_tikka' },
        outfit: {
          topStyle: 'saree_drape',
          bottomStyle: 'flowing_skirt',
          collarAccessory: 'gold_necklace',
          capeStyle: 'celestial_ribbon',
          headwear: 'floral_tiara',
          surfacePattern: 'royal_brocade',
        },
        appendages: { wings: 'feathered_angel', aura: 'solar_halo' },
        palette: { ...basePal, skin: '#f5cf6e', eye: '#fff8dc' },
      });
      break;
    case 'king':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.06, 0.72, 1.32, 1.06), shoulderWidth: 1.16, torsoBulk: 1.06, gait: 'regal' },
        head: { headShape: 'chiseled', hairStyle: 'swept_royal', facialHair: 'royal_mustache', faceMark: 'vermilion_tilak' },
        outfit: {
          topStyle: 'royal_angarkha',
          bottomStyle: 'dhoti',
          collarAccessory: 'gold_necklace',
          capeStyle: 'royal_cape',
          headwear: 'golden_mukut',
          surfacePattern: 'royal_brocade',
        },
        palette: basePal,
      });
      break;
    case 'emperor':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.08, 0.72, 1.32, 1.08), shoulderWidth: 1.18, torsoBulk: 1.12, gait: 'regal' },
        head: { headShape: 'broad_jaw', hairStyle: 'short_crop', facialHair: 'handlebar' },
        outfit: {
          topStyle: 'royal_angarkha',
          bottomStyle: 'trousers',
          collarAccessory: 'gold_necklace',
          capeStyle: 'royal_cape',
          headwear: 'mughal_pagri',
          surfacePattern: 'royal_brocade',
        },
        palette: basePal,
      });
      break;
    case 'queen':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 0.98, 0.72, 1.32, 0.98), shoulderWidth: 0.86, torsoBulk: 0.86, gait: 'regal' },
        head: { headShape: 'oval', hairStyle: 'long_flowing', faceMark: 'maang_tikka' },
        outfit: {
          topStyle: 'saree_drape',
          bottomStyle: 'flowing_skirt',
          collarAccessory: 'gold_necklace',
          capeStyle: 'flowing_dupatta',
          headwear: 'floral_tiara',
          surfacePattern: 'royal_brocade',
        },
        palette: basePal,
      });
      break;
    case 'sage':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 0.98, 0.72, 1.32, 0.98), shoulderWidth: 0.92, torsoBulk: 0.9, posture: 0.08, gait: 'folk' },
        head: {
          headShape: 'gaunt',
          hairStyle: 'topknot_bun',
          facialHair: 'sage_long_beard',
          faceMark: 'tripundra_ash',
        },
        outfit: {
          topStyle: 'sage_wrap',
          bottomStyle: 'dhoti',
          collarAccessory: 'rudraksha_beads',
          capeStyle: 'none',
          headwear: 'none',
        },
        palette: { ...basePal, hair: '#dfe6f2' },
      });
      break;
    case 'courtier':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 0.98, 0.72, 1.32, 0.98), shoulderWidth: 0.96, torsoBulk: 0.96, gait: 'folk' },
        head: { headShape: 'oval', hairStyle: 'short_crop', facialHair: 'goatee' },
        outfit: {
          topStyle: 'scholar_robe',
          bottomStyle: 'trousers',
          collarAccessory: 'royal_sash',
          capeStyle: 'none',
          headwear: 'royal_turban',
        },
        palette: basePal,
      });
      break;
    case 'warrior':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.1, 0.72, 1.32, 1.1), shoulderWidth: 1.24, torsoBulk: 1.1, gait: 'martial' },
        head: { headShape: 'chiseled', hairStyle: 'swept_royal', facialHair: 'royal_mustache', faceMark: 'vermilion_tilak' },
        outfit: {
          topStyle: 'plate_armor',
          bottomStyle: 'dhoti',
          collarAccessory: 'pauldron_plates',
          capeStyle: 'royal_cape',
          headwear: 'battle_helm',
        },
        palette: basePal,
      });
      break;
    case 'ascetic':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.02, 0.72, 1.32, 1.02), shoulderWidth: 0.94, torsoBulk: 0.86, posture: 0.14, gait: 'ethereal' },
        head: {
          headShape: 'angular',
          eyeStyle: 'glowing_orb',
          hairStyle: 'dreadlocks',
          facialHair: 'short_trimmed',
          faceMark: 'tripundra_ash',
        },
        outfit: {
          topStyle: 'mystic_vest',
          bottomStyle: 'robe_hem',
          collarAccessory: 'rudraksha_beads',
          capeStyle: 'tattered_cloak',
          headwear: 'none',
        },
        appendages: { aura: 'ember_sparks' },
        palette: { ...basePal, eye: '#fbbf24' },
      });
      break;
    case 'merchant':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 0.96, 0.72, 1.32, 0.96), shoulderWidth: 1.06, torsoBulk: 1.18, gait: 'folk' },
        head: { headShape: 'round', hairStyle: 'short_crop', facialHair: 'royal_mustache' },
        outfit: {
          topStyle: 'peasant_tunic',
          bottomStyle: 'dhoti',
          collarAccessory: 'scarf_muffler',
          capeStyle: 'none',
          headwear: 'royal_turban',
        },
        palette: basePal,
      });
      break;
    case 'child':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 0.78, 0.72, 1.32, 0.78), shoulderWidth: 0.82, torsoBulk: 0.84, headRatio: 1.22, gait: 'agile' },
        head: { headShape: 'round', eyeStyle: 'wide_fable', noseStyle: 'button', hairStyle: 'short_crop', faceMark: 'freckles' },
        outfit: {
          topStyle: 'peasant_tunic',
          bottomStyle: 'dhoti',
          collarAccessory: 'none',
          headwear: 'bandana',
        },
        palette: basePal,
      });
      break;
    case 'elder_woman':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 0.9, 0.72, 1.32, 0.9), shoulderWidth: 0.86, torsoBulk: 0.92, posture: 0.2, gait: 'folk' },
        head: { headShape: 'gaunt', eyeStyle: 'heavy_lidded', hairStyle: 'topknot_bun' },
        outfit: {
          topStyle: 'saree_drape',
          bottomStyle: 'flowing_skirt',
          capeStyle: 'flowing_dupatta',
          headwear: 'none',
        },
        palette: { ...basePal, hair: '#cbd5e1' },
      });
      break;
    case 'guard':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.06, 0.72, 1.32, 1.06), shoulderWidth: 1.18, torsoBulk: 1.12, gait: 'martial' },
        head: { headShape: 'broad_jaw', facialHair: 'handlebar', faceMark: 'cheek_scar' },
        outfit: {
          topStyle: 'plate_armor',
          bottomStyle: 'armored_greaves',
          collarAccessory: 'pauldron_plates',
          headwear: 'battle_helm',
        },
        palette: basePal,
      });
      break;
    case 'knight':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.1, 0.72, 1.32, 1.1), shoulderWidth: 1.24, torsoBulk: 1.12, gait: 'martial' },
        head: { headShape: 'chiseled', hairStyle: 'short_crop', facialHair: 'short_trimmed' },
        outfit: {
          topStyle: 'plate_armor',
          bottomStyle: 'armored_greaves',
          collarAccessory: 'fur_mantle',
          capeStyle: 'royal_cape',
          headwear: 'battle_helm',
        },
        palette: basePal,
      });
      break;
    case 'samurai':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.06, 0.72, 1.32, 1.06), shoulderWidth: 1.16, torsoBulk: 1.04, gait: 'martial' },
        head: { headShape: 'angular', eyeStyle: 'narrow_sharp', hairStyle: 'topknot_bun', facialHair: 'goatee' },
        outfit: {
          topStyle: 'samurai_cuirass',
          bottomStyle: 'armored_greaves',
          collarAccessory: 'pauldron_plates',
          capeStyle: 'royal_cape',
          headwear: 'kabuto_crest',
        },
        palette: basePal,
      });
      break;
    case 'monkey':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 0.88, 0.72, 1.32, 0.88), shoulderWidth: 0.9, torsoBulk: 0.9, headRatio: 1.12, posture: 0.14, gait: 'agile' },
        head: { headShape: 'round', ears: 'lion_round', noseStyle: 'broad', hairStyle: 'none' },
        outfit: { topStyle: 'none_fur', bottomStyle: 'animal_legs', collarAccessory: 'none', headwear: 'none' },
        appendages: { tail: 'monkey_curled' },
        palette: basePal,
      });
      break;
    case 'lion':
      dna = createBaseDna('quadruped', {
        morph: { height: clampNum(scale * 1.08, 0.72, 1.32, 1.08), shoulderWidth: 1.24, torsoBulk: 1.18, gait: 'predator' },
        head: { headShape: 'feline_muzzle', eyeStyle: 'glowing_orb', ears: 'lion_round', hairStyle: 'lion_mane', facialHair: 'whiskers' },
        outfit: { topStyle: 'none_fur', bottomStyle: 'animal_legs', surfacePattern: 'solid' },
        appendages: { tail: 'lion_tufted' },
        palette: { ...basePal, hair: '#6b2c0c', eye: '#fde047' },
      });
      break;
    case 'tiger':
      dna = createBaseDna('quadruped', {
        morph: { height: clampNum(scale * 1.08, 0.72, 1.32, 1.08), shoulderWidth: 1.18, torsoBulk: 1.1, gait: 'predator' },
        head: { headShape: 'feline_muzzle', eyeStyle: 'narrow_sharp', ears: 'lion_round', hairStyle: 'none', facialHair: 'whiskers' },
        outfit: { topStyle: 'none_fur', bottomStyle: 'animal_legs', surfacePattern: 'tiger_stripes' },
        appendages: { tail: 'lion_tufted' },
        palette: { ...basePal, patternTint: '#11131a', eye: '#fbbf24' },
      });
      break;
    case 'bull':
      dna = createBaseDna('quadruped', {
        morph: { height: clampNum(scale * 1.12, 0.72, 1.32, 1.12), shoulderWidth: 1.3, torsoBulk: 1.28, gait: 'heavy' },
        head: { headShape: 'equine_snout', ears: 'cow_side', horns: 'bull_horns' },
        outfit: { topStyle: 'none_fur', bottomStyle: 'animal_legs', collarAccessory: 'gold_necklace' },
        appendages: { tail: 'lion_tufted' },
        palette: basePal,
      });
      break;
    case 'hare':
      dna = createBaseDna('quadruped', {
        morph: { height: clampNum(scale * 0.78, 0.72, 1.32, 0.78), shoulderWidth: 0.82, torsoBulk: 0.88, headRatio: 1.18, gait: 'agile' },
        head: { headShape: 'round', eyeStyle: 'wide_fable', noseStyle: 'button', ears: 'hare_long', facialHair: 'whiskers' },
        outfit: { topStyle: 'none_fur', bottomStyle: 'animal_legs' },
        appendages: { tail: 'deer_short' },
        palette: basePal,
      });
      break;
    case 'jackal':
    case 'fox':
      dna = createBaseDna('quadruped', {
        morph: { height: clampNum(scale * 0.94, 0.72, 1.32, 0.94), shoulderWidth: 0.94, torsoBulk: 0.9, gait: 'agile' },
        head: { headShape: 'canine_snout', eyeStyle: 'narrow_sharp', ears: 'fox_tall', facialHair: 'whiskers' },
        outfit: { topStyle: 'none_fur', bottomStyle: 'animal_legs' },
        appendages: { tail: 'fox_bushy' },
        palette: basePal,
      });
      break;
    case 'wolf':
      dna = createBaseDna('quadruped', {
        morph: { height: clampNum(scale * 1.06, 0.72, 1.32, 1.06), shoulderWidth: 1.12, torsoBulk: 1.06, gait: 'predator' },
        head: { headShape: 'canine_snout', eyeStyle: 'glowing_orb', ears: 'fox_tall', hairStyle: 'wild_spiky' },
        outfit: { topStyle: 'none_fur', bottomStyle: 'animal_legs' },
        appendages: { tail: 'fox_bushy' },
        palette: { ...basePal, eye: '#fde047' },
      });
      break;
    case 'dog':
      dna = createBaseDna('quadruped', {
        morph: { height: clampNum(scale * 0.96, 0.72, 1.32, 0.96), shoulderWidth: 1.0, torsoBulk: 1.0, gait: 'folk' },
        head: { headShape: 'canine_snout', eyeStyle: 'wide_fable', ears: 'cow_side' },
        outfit: { topStyle: 'none_fur', bottomStyle: 'animal_legs', collarAccessory: 'scarf_muffler' },
        appendages: { tail: 'fox_bushy' },
        palette: basePal,
      });
      break;
    case 'elephant':
      dna = createBaseDna('quadruped', {
        morph: { height: clampNum(scale * 1.28, 0.72, 1.32, 1.28), shoulderWidth: 1.4, torsoBulk: 1.38, gait: 'heavy' },
        head: { headShape: 'elephant_trunk', ears: 'elephant_fan', faceMark: 'vermilion_tilak' },
        outfit: { topStyle: 'none_fur', bottomStyle: 'animal_legs', collarAccessory: 'gold_necklace', surfacePattern: 'royal_brocade' },
        appendages: { tail: 'deer_short' },
        palette: basePal,
      });
      break;
    case 'deer':
      dna = createBaseDna('quadruped', {
        morph: { height: clampNum(scale * 1.02, 0.72, 1.32, 1.02), shoulderWidth: 0.88, torsoBulk: 0.86, limbLength: 1.22, gait: 'agile' },
        head: { headShape: 'equine_snout', eyeStyle: 'wide_fable', ears: 'cow_side', horns: 'deer_antlers' },
        outfit: { topStyle: 'none_fur', bottomStyle: 'animal_legs', surfacePattern: 'leopard_spots' },
        appendages: { tail: 'deer_short' },
        palette: basePal,
      });
      break;
    case 'crocodile':
      dna = createBaseDna('quadruped', {
        morph: { height: clampNum(scale * 0.96, 0.72, 1.32, 0.96), shoulderWidth: 1.22, torsoBulk: 1.24, limbLength: 0.82, posture: 0.25, gait: 'predator' },
        head: { headShape: 'croc_snout', eyeStyle: 'slit_reptile', ears: 'none' },
        outfit: { topStyle: 'none_fur', bottomStyle: 'animal_legs', surfacePattern: 'serpent_scales' },
        appendages: { tail: 'dragon_spiked' },
        palette: { ...basePal, eye: '#facc15' },
      });
      break;
    case 'tortoise':
      dna = createBaseDna('quadruped', {
        morph: { height: clampNum(scale * 0.84, 0.72, 1.32, 0.84), shoulderWidth: 1.26, torsoBulk: 1.34, limbLength: 0.78, gait: 'heavy' },
        head: { headShape: 'round', eyeStyle: 'heavy_lidded', ears: 'none' },
        outfit: { topStyle: 'none_fur', bottomStyle: 'animal_legs', surfacePattern: 'stone_cracks' },
        appendages: { tail: 'deer_short' },
        palette: basePal,
      });
      break;
    case 'mouse':
      dna = createBaseDna('quadruped', {
        morph: { height: clampNum(scale * 0.74, 0.72, 1.32, 0.74), shoulderWidth: 0.8, torsoBulk: 0.82, headRatio: 1.24, gait: 'agile' },
        head: { headShape: 'canine_snout', eyeStyle: 'wide_fable', ears: 'lion_round', facialHair: 'whiskers' },
        outfit: { topStyle: 'none_fur', bottomStyle: 'animal_legs' },
        appendages: { tail: 'serpent_whip' },
        palette: basePal,
      });
      break;
    case 'crow':
    case 'raven':
      dna = createBaseDna('avian', {
        morph: { height: clampNum(scale * 0.96, 0.72, 1.32, 0.96), shoulderWidth: 1.0, torsoBulk: 0.92, gait: 'agile' },
        head: { headShape: 'curved_beak', eyeStyle: 'narrow_sharp', hairStyle: 'feather_crest' },
        outfit: { topStyle: 'none_fur', bottomStyle: 'animal_legs', surfacePattern: 'feather_layers' },
        appendages: { wings: 'raven_dark', tail: 'peacock_fan' },
        palette: { ...basePal, eye: '#fde047' },
      });
      break;
    case 'crane':
      dna = createBaseDna('avian', {
        morph: { height: clampNum(scale * 1.1, 0.72, 1.32, 1.1), shoulderWidth: 0.86, torsoBulk: 0.82, limbLength: 1.26, gait: 'regal' },
        head: { headShape: 'curved_beak', eyeStyle: 'almond', hairStyle: 'feather_crest' },
        outfit: { topStyle: 'none_fur', bottomStyle: 'animal_legs', surfacePattern: 'feather_layers' },
        appendages: { wings: 'feathered_angel', tail: 'peacock_fan' },
        palette: basePal,
      });
      break;
    case 'owl':
      dna = createBaseDna('avian', {
        morph: { height: clampNum(scale * 0.96, 0.72, 1.32, 0.96), shoulderWidth: 1.1, torsoBulk: 1.16, headRatio: 1.16, gait: 'folk' },
        head: { headShape: 'raptor_beak', eyeStyle: 'owl_disc', ears: 'fox_tall', hairStyle: 'feather_crest' },
        outfit: { topStyle: 'none_fur', bottomStyle: 'animal_legs', surfacePattern: 'feather_layers' },
        appendages: { wings: 'feathered_angel', tail: 'deer_short' },
        palette: { ...basePal, eye: '#fbbf24' },
      });
      break;
    case 'serpent':
      dna = createBaseDna('serpentine', {
        morph: { height: clampNum(scale * 1.08, 0.72, 1.32, 1.08), shoulderWidth: 1.12, torsoBulk: 1.04, gait: 'predator' },
        head: { headShape: 'serpent_hood', eyeStyle: 'slit_reptile', ears: 'fin_frill', faceMark: 'third_eye' },
        outfit: { topStyle: 'none_fur', bottomStyle: 'coiled_tail', surfacePattern: 'serpent_scales' },
        appendages: { tail: 'serpent_whip', aura: 'lunar_crescent' },
        palette: { ...basePal, eye: '#facc15' },
      });
      break;
    case 'spider':
      dna = createBaseDna('arachnid', {
        morph: { height: clampNum(scale * 0.96, 0.72, 1.32, 0.96), shoulderWidth: 1.16, torsoBulk: 1.12, gait: 'agile' },
        head: { headShape: 'arachnid_mandible', eyeStyle: 'multi_eyes', faceMark: 'tribal_lines' },
        outfit: { topStyle: 'kente_wrap', bottomStyle: 'animal_legs', headwear: 'bandana', surfacePattern: 'kente_weave' },
        appendages: { extraArms: 2 },
        palette: { ...basePal, eye: '#facc15' },
      });
      break;
    default:
      dna = createBaseDna('humanoid', { palette: basePal });
  }

  // Respect explicit legacy mark/headgear overrides if present
  if (member.headgear && member.headgear !== 'default') {
    if (member.headgear === 'none') dna.outfit.headwear = 'none';
    else if (member.headgear === 'golden_mukut') dna.outfit.headwear = 'golden_mukut';
    else if (member.headgear === 'royal_turban') dna.outfit.headwear = 'royal_turban';
    else if (member.headgear === 'battle_helm') dna.outfit.headwear = 'battle_helm';
    else if (member.headgear === 'sage_topknot') dna.head.hairStyle = 'topknot_bun';
  }
  if (member.mark && member.mark !== 'default') {
    if (member.mark === 'none') dna.head.faceMark = 'none';
    else if (member.mark === 'vermilion_tilak') dna.head.faceMark = 'vermilion_tilak';
    else if (member.mark === 'tripundra_ash') dna.head.faceMark = 'tripundra_ash';
    else if (member.mark === 'royal_mustache') dna.head.facialHair = 'royal_mustache';
    else if (member.mark === 'full_beard') dna.head.facialHair = 'sage_long_beard';
    else if (member.mark === 'divine_halo') dna.appendages.aura = 'solar_halo';
  }

  // Apply gentle deterministic seed variation if requested (gives every new AI character natural individuality)
  if (seedSalt) {
    const seed = hashDnaSeed(`${member.id || ''}:${member.name || ''}:${seedSalt}`);
    dna.seedTag = `${arch}_${seed.toString(36).slice(0, 6)}`;
    dna.morph.height = clampNum(dna.morph.height + seededRange(seed, 1, -0.06, 0.08), 0.72, 1.32, dna.morph.height);
    dna.morph.shoulderWidth = clampNum(
      dna.morph.shoulderWidth + seededRange(seed, 2, -0.08, 0.1),
      0.7,
      1.45,
      dna.morph.shoulderWidth
    );
    dna.morph.torsoBulk = clampNum(
      dna.morph.torsoBulk + seededRange(seed, 3, -0.07, 0.09),
      0.72,
      1.4,
      dna.morph.torsoBulk
    );
    dna.morph.headRatio = clampNum(
      dna.morph.headRatio + seededRange(seed, 4, -0.05, 0.06),
      0.78,
      1.3,
      dna.morph.headRatio
    );
  }

  return dna;
}

// =========================================================================
// COMPACT & FULL DNA PARSER + VALIDATOR (Supports Human UI + LLM Recipes!)
// =========================================================================

function applyNaturalTraitHints(dna: CharacterDNA, traitsText: string): void {
  const t = traitsText.toLowerCase();
  if (!t) return;

  // Proportions
  if (/\b(giant|tall|towering|huge|colossal)\b/.test(t)) {
    dna.morph.height = 1.24;
    dna.morph.shoulderWidth = Math.max(dna.morph.shoulderWidth, 1.26);
  } else if (/\b(tiny|small|short|little|dwarf|young|child|imp)\b/.test(t)) {
    dna.morph.height = 0.78;
    dna.morph.headRatio = Math.max(dna.morph.headRatio, 1.16);
  }
  if (/\b(plump|stout|chubby|heavy|stocky|burly|broad)\b/.test(t)) {
    dna.morph.torsoBulk = 1.28;
    dna.morph.shoulderWidth = Math.max(dna.morph.shoulderWidth, 1.22);
  } else if (/\b(slender|thin|gaunt|lanky|wiry|slim|graceful)\b/.test(t)) {
    dna.morph.torsoBulk = 0.8;
    dna.morph.shoulderWidth = 0.84;
  }
  if (/\b(hunched|elderly|stooped|old|ancient|prowling)\b/.test(t)) {
    dna.morph.posture = 0.22;
  }

  // Chassis & creatures
  if (/\b(spider|arachnid|anansi)\b/.test(t)) dna.chassis = 'arachnid';
  else if (/\b(serpent|cobra|naga|snake|wyrm)\b/.test(t)) dna.chassis = 'serpentine';
  else if (/\b(bird|owl|crow|raven|eagle|crane|phoenix|garuda|hawk)\b/.test(t)) dna.chassis = 'avian';
  else if (/\b(spirit|ghost|phantom|wraith|wisp|betaal|yaksha)\b/.test(t)) dna.chassis = 'ethereal';

  // Horns & Antlers
  if (/\bantlers?\b/.test(t)) dna.head.horns = 'deer_antlers';
  else if (/\bram horns?\b/.test(t)) dna.head.horns = 'curved_ram';
  else if (/\buni?corn\b/.test(t)) dna.head.horns = 'unicorn_spire';
  else if (/\bhorns?|horned\b/.test(t)) dna.head.horns = 'oni_twin';

  // Wings & Tails & Arms
  if (/\b(angel|feather|white)\s+wings?\b/.test(t)) dna.appendages.wings = 'feathered_angel';
  else if (/\b(bat|demon|dark)\s+wings?\b/.test(t)) dna.appendages.wings = 'bat_demon';
  else if (/\bdragon\s+wings?\b/.test(t)) dna.appendages.wings = 'dragon_leathery';
  else if (/\b(butterfly|fey|fairy)\s+wings?\b/.test(t)) dna.appendages.wings = 'butterfly_fey';
  else if (/\b(flame|fire|solar)\s+wings?\b/.test(t)) dna.appendages.wings = 'celestial_flame';
  else if (/\bwings?|winged\b/.test(t) && dna.appendages.wings === 'none') dna.appendages.wings = 'feathered_angel';

  if (/\bfour[\s-]arm|4[\s-]arm|multi[\s-]arm\b/.test(t)) dna.appendages.extraArms = 2;
  if (/\bpeacock\b/.test(t)) dna.appendages.tail = 'peacock_fan';
  else if (/\bdragon\s+tail\b/.test(t)) dna.appendages.tail = 'dragon_spiked';
  else if (/\bbushy\s+tail|fox\s+tail\b/.test(t)) dna.appendages.tail = 'fox_bushy';

  // Hair & Facial Hair & Marks
  if (/\b(white|silver|grey|gray)\s+(hair|beard)\b/.test(t)) dna.palette.hair = '#dfe6f2';
  if (/\blong\s+beard|bearded\b/.test(t)) dna.head.facialHair = 'sage_long_beard';
  else if (/\bmustache|moustache\b/.test(t)) dna.head.facialHair = 'royal_mustache';
  else if (/\bgoatee\b/.test(t)) dna.head.facialHair = 'goatee';

  if (/\beye\s*patch\b/.test(t)) dna.head.faceMark = 'eye_patch';
  else if (/\bscar|scarred\b/.test(t)) dna.head.faceMark = 'cheek_scar';
  else if (/\bthird\s*eye\b/.test(t)) dna.head.faceMark = 'third_eye';
  else if (/\bwar\s*paint\b/.test(t)) dna.head.faceMark = 'war_paint';

  if (/\bbraids?|braided\b/.test(t)) dna.head.hairStyle = 'braided_twin';
  else if (/\bhood|hooded|cowl\b/.test(t)) dna.head.hairStyle = 'hooded_cowl';
  else if (/\bmane\b/.test(t)) dna.head.hairStyle = 'lion_mane';
  else if (/\btopknot|bun\b/.test(t)) dna.head.hairStyle = 'topknot_bun';

  // Headwear & Capes & Patterns
  if (/\bwizard\s*hat|pointed\s*hat\b/.test(t)) dna.outfit.headwear = 'wizard_hat';
  else if (/\blaurel\b/.test(t)) dna.outfit.headwear = 'laurel_wreath';
  else if (/\bstraw\s*hat|conical\b/.test(t)) dna.outfit.headwear = 'straw_conical';
  else if (/\bkabuto\b/.test(t)) dna.outfit.headwear = 'kabuto_crest';
  else if (/\btiara\b/.test(t)) dna.outfit.headwear = 'floral_tiara';
  else if (/\bturban|pagdi\b/.test(t)) dna.outfit.headwear = 'royal_turban';
  else if (/\bcrown|mukut\b/.test(t)) dna.outfit.headwear = 'golden_mukut';

  if (/\btattered\s*(cloak|cape)\b/.test(t)) dna.outfit.capeStyle = 'tattered_cloak';
  else if (/\bcloak|cape|mantle\b/.test(t) && dna.outfit.capeStyle === 'none') dna.outfit.capeStyle = 'royal_cape';

  if (/\bstriped|stripes\b/.test(t)) dna.outfit.surfacePattern = 'tiger_stripes';
  else if (/\bspotted|spots\b/.test(t)) dna.outfit.surfacePattern = 'leopard_spots';
  else if (/\bscaled|scales\b/.test(t)) dna.outfit.surfacePattern = 'serpent_scales';
  else if (/\bkente\b/.test(t)) dna.outfit.surfacePattern = 'kente_weave';
  else if (/\bstarfield|cosmic|celestial\b/.test(t)) dna.outfit.surfacePattern = 'starfield_cosmic';
  else if (/\bstone|statue|golem\b/.test(t)) dna.outfit.surfacePattern = 'stone_cracks';

  if (/\bhalo|radiant\b/.test(t)) dna.appendages.aura = 'solar_halo';
  else if (/\blunar|moon\b/.test(t)) dna.appendages.aura = 'lunar_crescent';
  else if (/\bember|fiery|flaming\b/.test(t)) dna.appendages.aura = 'ember_sparks';
}

function normEnum<T extends string>(val: unknown, validSet: Set<T>, fallback: T): T {
  if (typeof val !== 'string') return fallback;
  const tok = val.trim().toLowerCase().replace(/[\s-]+/g, '_') as T;
  return validSet.has(tok) ? tok : fallback;
}

/**
 * Validates and normalizes either a full CharacterDNA object OR a compact LLM DNA recipe
 * (e.g. `{ chassis: "quadruped", traits: "tall fox with antlers", headwear: "wizard_hat" }`).
 */
export function validateAndNormalizeDna(
  raw: unknown,
  fallbackMember?: Partial<CastMember>
): CharacterDNA | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const obj = raw as Record<string, unknown>;

  const seed = hydrateArchetypeToDna(fallbackMember || {});
  const chassis = normEnum(obj.chassis ?? obj.bodyType ?? obj.body, VALID_CHASSIS, seed.chassis);
  const base = chassis === seed.chassis ? seed : createBaseDna(chassis, { palette: seed.palette });

  // Apply optional natural-language traits first so explicit fields override them
  if (typeof obj.traits === 'string' && obj.traits.trim()) {
    applyNaturalTraitHints(base, obj.traits);
  }
  if (typeof obj.build === 'string' && obj.build.trim()) {
    applyNaturalTraitHints(base, obj.build);
  }

  const mRaw = (obj.morph && typeof obj.morph === 'object' ? obj.morph : obj) as Record<string, unknown>;
  const hRaw = (obj.head && typeof obj.head === 'object' ? obj.head : obj) as Record<string, unknown>;
  const oRaw = (obj.outfit && typeof obj.outfit === 'object' ? obj.outfit : obj) as Record<string, unknown>;
  const aRaw = (obj.appendages && typeof obj.appendages === 'object' ? obj.appendages : obj) as Record<string, unknown>;
  const pRaw = (obj.palette && typeof obj.palette === 'object' ? obj.palette : obj) as Record<string, unknown>;

  const primary = cleanHex(pRaw.primary ?? fallbackMember?.primaryColor, base.palette.primary);
  const secondary = cleanHex(pRaw.secondary, darkenHexSimple(primary, 0.56));
  const accent = cleanHex(pRaw.accent ?? fallbackMember?.accentColor, base.palette.accent);
  const skin = cleanHex(pRaw.skin ?? fallbackMember?.skinColor, base.palette.skin);
  const hair = cleanHex(pRaw.hair, base.palette.hair);
  const eye = cleanHex(pRaw.eye, base.palette.eye);
  const patternTint = cleanHex(pRaw.patternTint, accent);

  const extraArmsNum = Number(aRaw.extraArms);

  return {
    version: 1,
    chassis: normEnum(obj.chassis ?? obj.bodyType ?? base.chassis, VALID_CHASSIS, base.chassis),
    morph: {
      height: clampNum(mRaw.height, 0.72, 1.32, base.morph.height),
      shoulderWidth: clampNum(mRaw.shoulderWidth, 0.7, 1.45, base.morph.shoulderWidth),
      torsoBulk: clampNum(mRaw.torsoBulk, 0.72, 1.4, base.morph.torsoBulk),
      headRatio: clampNum(mRaw.headRatio, 0.78, 1.3, base.morph.headRatio),
      limbLength: clampNum(mRaw.limbLength, 0.78, 1.28, base.morph.limbLength),
      posture: clampNum(mRaw.posture, -0.25, 0.35, base.morph.posture),
      gait: normEnum(mRaw.gait, VALID_GAITS, base.morph.gait || 'auto'),
    },
    head: {
      headShape: normEnum(hRaw.headShape, VALID_HEAD_SHAPES, base.head.headShape),
      eyeStyle: normEnum(hRaw.eyeStyle, VALID_EYE_STYLES, base.head.eyeStyle),
      noseStyle: normEnum(hRaw.noseStyle, VALID_NOSE_STYLES, base.head.noseStyle),
      ears: normEnum(hRaw.ears, VALID_EAR_STYLES, base.head.ears),
      horns: normEnum(hRaw.horns, VALID_HORN_STYLES, base.head.horns),
      hairStyle: normEnum(hRaw.hairStyle, VALID_HAIR_STYLES, base.head.hairStyle),
      facialHair: normEnum(hRaw.facialHair, VALID_FACIAL_HAIR, base.head.facialHair),
      faceMark: normEnum(hRaw.faceMark, VALID_FACE_MARKS, base.head.faceMark),
    },
    outfit: {
      topStyle: normEnum(oRaw.topStyle, VALID_TOP_STYLES, base.outfit.topStyle),
      bottomStyle: normEnum(oRaw.bottomStyle, VALID_BOTTOM_STYLES, base.outfit.bottomStyle),
      collarAccessory: normEnum(oRaw.collarAccessory, VALID_COLLARS, base.outfit.collarAccessory),
      capeStyle: normEnum(oRaw.capeStyle, VALID_CAPES, base.outfit.capeStyle),
      headwear: normEnum(oRaw.headwear, VALID_HEADWEAR, base.outfit.headwear),
      surfacePattern: normEnum(oRaw.surfacePattern ?? oRaw.pattern, VALID_PATTERNS, base.outfit.surfacePattern),
    },
    appendages: {
      wings: normEnum(aRaw.wings, VALID_WINGS, base.appendages.wings),
      tail: normEnum(aRaw.tail, VALID_TAILS, base.appendages.tail),
      extraArms: extraArmsNum === 2 || extraArmsNum >= 4 ? 2 : base.appendages.extraArms,
      aura: normEnum(aRaw.aura, VALID_AURAS, base.appendages.aura),
    },
    palette: {
      primary,
      secondary,
      accent,
      skin,
      hair,
      eye,
      patternTint,
    },
    ...(typeof obj.seedTag === 'string' && obj.seedTag.trim()
      ? { seedTag: obj.seedTag.trim().slice(0, 48) }
      : {}),
  };
}

/** Keeps legacy CastMember fields synchronized with modular CharacterDNA. */
export function syncMemberWithDna(member: CastMember, dna: CharacterDNA): CastMember {
  return {
    ...member,
    primaryColor: dna.palette.primary,
    accentColor: dna.palette.accent,
    skinColor: dna.palette.skin,
    scale: clampNum(dna.morph.height, 0.82, 1.25, member.scale ?? 1.0),
    dna,
  };
}

// =========================================================================
// SILHOUETTE FINGERPRINTING & STRUCTURAL DISTANCE ENGINE (Anti-Template Guard)
// =========================================================================

export function computeDnaFingerprint(member: CastMember): CharacterSilhouetteFingerprint {
  const dna = member.dna || hydrateArchetypeToDna(member);
  return {
    castId: member.id,
    name: member.name,
    archetype: member.archetype,
    chassis: dna.chassis,
    headShape: dna.head.headShape,
    hairStyle: dna.head.hairStyle,
    headwear: dna.outfit.headwear,
    horns: dna.head.horns,
    ears: dna.head.ears,
    topStyle: dna.outfit.topStyle,
    capeStyle: dna.outfit.capeStyle,
    surfacePattern: dna.outfit.surfacePattern,
    wings: dna.appendages.wings,
    tail: dna.appendages.tail,
    extraArms: dna.appendages.extraArms,
    aura: dna.appendages.aura,
    height: dna.morph.height,
    shoulderWidth: dna.morph.shoulderWidth,
    torsoBulk: dna.morph.torsoBulk,
    primaryHex: dna.palette.primary,
    skinHex: dna.palette.skin,
    hasCustomDna: Boolean(member.dna),
  };
}

/**
 * Returns deterministic structural silhouette distance in [0, 1]:
 *   0.00 = identical template twin
 *   0.35 = minimum safe distinctiveness threshold
 *   0.70+ = radically distinct silhouette & styling
 */
export function computeSilhouetteDistance(
  a: CharacterSilhouetteFingerprint,
  b: CharacterSilhouetteFingerprint
): number {
  let diff = 0;
  let totalWeight = 0;

  const addCat = (same: boolean, weight: number) => {
    totalWeight += weight;
    if (!same) diff += weight;
  };
  const addNum = (va: number, vb: number, span: number, weight: number) => {
    totalWeight += weight;
    diff += Math.min(1, Math.abs(va - vb) / span) * weight;
  };

  addCat(a.chassis === b.chassis, 2.6);
  addCat(a.headShape === b.headShape, 1.5);
  addCat(a.headwear === b.headwear, 1.5);
  addCat(a.hairStyle === b.hairStyle, 1.2);
  addCat(a.horns === b.horns, 1.1);
  addCat(a.ears === b.ears, 0.9);
  addCat(a.topStyle === b.topStyle, 1.3);
  addCat(a.capeStyle === b.capeStyle, 1.0);
  addCat(a.surfacePattern === b.surfacePattern, 1.1);
  addCat(a.wings === b.wings, 1.3);
  addCat(a.tail === b.tail, 1.0);
  addCat(a.extraArms === b.extraArms, 0.8);
  addCat(a.aura === b.aura, 0.7);

  addNum(a.height, b.height, 0.35, 1.1);
  addNum(a.shoulderWidth, b.shoulderWidth, 0.45, 1.0);
  addNum(a.torsoBulk, b.torsoBulk, 0.42, 0.9);

  // Palette contributes moderately (so palette swap alone NEVER tricks the twin detector!)
  totalWeight += 1.4;
  diff += colorDistance(a.primaryHex, b.primaryHex) * 0.9 + colorDistance(a.skinHex, b.skinHex) * 0.5;

  return Number(Math.max(0, Math.min(1, diff / Math.max(1, totalWeight))).toFixed(3));
}

export const SILHOUETTE_TWIN_THRESHOLD = 0.34;

export interface UniquenessAssessment {
  minDistance: number; // 0..1
  uniquenessPercent: number; // 0..100
  closestMatchName: string | null;
  isTwinRisk: boolean;
}

export function evaluateMemberUniqueness(
  member: CastMember,
  comparisons: CharacterSilhouetteFingerprint[]
): UniquenessAssessment {
  if (comparisons.length === 0) {
    return {
      minDistance: 1,
      uniquenessPercent: 100,
      closestMatchName: null,
      isTwinRisk: false,
    };
  }
  const fp = computeDnaFingerprint(member);
  let minDist = 1;
  let closestName: string | null = null;
  for (const other of comparisons) {
    const d = computeSilhouetteDistance(fp, other);
    if (d < minDist) {
      minDist = d;
      closestName = other.name;
    }
  }
  return {
    minDistance: minDist,
    uniquenessPercent: Math.round(minDist * 100),
    closestMatchName: closestName,
    isTwinRisk: minDist < SILHOUETTE_TWIN_THRESHOLD,
  };
}

// =========================================================================
// ANTI-TWIN MUTATOR & SIMS-STYLE RANDOMIZER
// =========================================================================

const HUMAN_HEADS: HeadShapeId[] = ['chiseled', 'oval', 'round', 'angular', 'gaunt', 'broad_jaw'];
const HUMAN_HAIR: HairStyleId[] = [
  'short_crop',
  'swept_royal',
  'long_flowing',
  'topknot_bun',
  'braided_twin',
  'wild_spiky',
  'dreadlocks',
  'hooded_cowl',
];
const HUMAN_TOPS: TopStyleId[] = [
  'royal_angarkha',
  'saree_drape',
  'sage_wrap',
  'plate_armor',
  'samurai_cuirass',
  'peasant_tunic',
  'scholar_robe',
  'toga_chiton',
  'kente_wrap',
  'mystic_vest',
];
const HUMAN_HEADWEAR: HeadwearStyleId[] = [
  'none',
  'golden_mukut',
  'royal_turban',
  'mughal_pagri',
  'battle_helm',
  'kabuto_crest',
  'wizard_hat',
  'laurel_wreath',
  'floral_tiara',
  'bandana',
  'straw_conical',
];
const HUMAN_CAPES: CapeStyleId[] = [
  'none',
  'royal_cape',
  'tattered_cloak',
  'flowing_dupatta',
  'feather_mantle',
  'celestial_ribbon',
];
const ANIMAL_PATTERNS: SurfacePatternId[] = [
  'solid',
  'tiger_stripes',
  'leopard_spots',
  'bark_grain',
  'stone_cracks',
  'royal_brocade',
];
const HUMAN_PATTERNS: SurfacePatternId[] = [
  'solid',
  'royal_brocade',
  'kente_weave',
  'starfield_cosmic',
  'feather_layers',
];

/**
 * Structurally mutates a character's DNA until its silhouette distance exceeds
 * the YouTube anti-template threshold against every fingerprint in `avoidList`,
 * while preserving the character's fundamental species/chassis!
 */
export function mutateDnaForUniqueness(
  member: CastMember,
  avoidList: CharacterSilhouetteFingerprint[],
  options: { salt?: number; preserveSpecies?: boolean } = {}
): CharacterDNA {
  const baseDna = member.dna ? structuredClone(member.dna) : hydrateArchetypeToDna(member);
  const preserveSpecies = options.preserveSpecies !== false;
  const startSeed = hashDnaSeed(`${member.id}:${member.name}:${options.salt ?? 1}`);

  let bestDna = baseDna;
  let bestMinDist = -1;

  for (let attempt = 0; attempt < 12; attempt++) {
    const s = startSeed + attempt * 104729;
    const cand: CharacterDNA = structuredClone(baseDna);

    // Distinct proportion shift
    cand.morph.height = seededRange(s, 1, 0.82, 1.24);
    cand.morph.shoulderWidth = seededRange(s, 2, 0.82, 1.34);
    cand.morph.torsoBulk = seededRange(s, 3, 0.82, 1.28);
    cand.morph.headRatio = seededRange(s, 4, 0.88, 1.16);
    cand.morph.posture = seededRange(s, 5, -0.1, 0.22);

    // Palette shift from curated cultural palettes
    const pal = seededPick(CURATED_DNA_PALETTES, s, 6).palette;
    cand.palette = {
      ...pal,
      // Keep non-human fur/skin tones plausible when preserving species
      skin:
        preserveSpecies && cand.chassis !== 'humanoid'
          ? attempt % 2 === 0
            ? baseDna.palette.skin
            : pal.primary
          : pal.skin,
    };

    if (cand.chassis === 'humanoid') {
      cand.head.headShape = seededPick(HUMAN_HEADS, s, 7);
      cand.head.hairStyle = seededPick(HUMAN_HAIR, s, 8);
      cand.head.faceMark = seededPick(FACE_MARK_CATALOG, s, 9).id;
      cand.head.facialHair =
        member.archetype === 'queen' || member.archetype === 'goddess' || member.archetype === 'elder_woman' || member.archetype === 'child'
          ? 'none'
          : seededPick(['none', 'royal_mustache', 'handlebar', 'short_trimmed', 'goatee', 'sage_long_beard'] as FacialHairId[], s, 10);
      cand.outfit.topStyle = seededPick(HUMAN_TOPS, s, 11);
      cand.outfit.headwear = seededPick(HUMAN_HEADWEAR, s, 12);
      cand.outfit.capeStyle = seededPick(HUMAN_CAPES, s, 13);
      cand.outfit.collarAccessory = seededPick(COLLAR_CATALOG, s, 14).id;
      cand.outfit.surfacePattern = seededPick(HUMAN_PATTERNS, s, 15);
    } else if (cand.chassis === 'quadruped') {
      cand.outfit.surfacePattern = seededPick(ANIMAL_PATTERNS, s, 11);
      cand.outfit.collarAccessory = seededPick(['none', 'gold_necklace', 'scarf_muffler', 'fur_mantle', 'rudraksha_beads'] as CollarAccessoryId[], s, 12);
      cand.outfit.headwear = seededPick(['none', 'bandana', 'floral_tiara', 'laurel_wreath', 'golden_mukut', 'straw_conical'] as HeadwearStyleId[], s, 13);
      cand.head.faceMark = seededPick(['none', 'vermilion_tilak', 'war_paint', 'cheek_scar', 'tribal_lines'] as FaceMarkId[], s, 14);
      cand.head.eyeStyle = seededPick(['wide_fable', 'narrow_sharp', 'glowing_orb', 'almond'] as EyeStyleId[], s, 15);
      cand.outfit.capeStyle = attempt >= 4 ? seededPick(['none', 'tattered_cloak', 'royal_cape'] as CapeStyleId[], s, 16) : cand.outfit.capeStyle;
      if (attempt >= 5 && cand.head.horns === 'none') {
        cand.head.horns = seededPick(['none', 'deer_antlers', 'curved_ram', 'unicorn_spire'] as HornStyleId[], s, 17);
      }
    } else if (cand.chassis === 'avian') {
      cand.head.headShape = seededPick(['curved_beak', 'raptor_beak'] as HeadShapeId[], s, 7);
      cand.head.hairStyle = seededPick(['feather_crest', 'none', 'wild_spiky'] as HairStyleId[], s, 8);
      cand.outfit.headwear = seededPick(['none', 'laurel_wreath', 'golden_mukut', 'bandana', 'wizard_hat'] as HeadwearStyleId[], s, 9);
      cand.outfit.collarAccessory = seededPick(['none', 'scarf_muffler', 'gold_necklace', 'royal_sash'] as CollarAccessoryId[], s, 10);
      cand.appendages.wings = seededPick(['feathered_angel', 'raven_dark', 'celestial_flame'] as WingStyleId[], s, 11);
      cand.appendages.tail = seededPick(['peacock_fan', 'deer_short', 'dragon_spiked'] as TailStyleId[], s, 12);
      cand.outfit.surfacePattern = seededPick(['feather_layers', 'starfield_cosmic', 'royal_brocade', 'kente_weave'] as SurfacePatternId[], s, 13);
    } else if (cand.chassis === 'serpentine') {
      cand.head.horns = seededPick(['none', 'oni_twin', 'unicorn_spire', 'curved_ram'] as HornStyleId[], s, 8);
      cand.head.ears = seededPick(['fin_frill', 'none', 'pointed_elf'] as EarStyleId[], s, 9);
      cand.head.faceMark = seededPick(['third_eye', 'vermilion_tilak', 'tribal_lines', 'war_paint'] as FaceMarkId[], s, 10);
      cand.outfit.headwear = seededPick(['none', 'golden_mukut', 'floral_tiara', 'ten_crown'] as HeadwearStyleId[], s, 11);
      cand.outfit.surfacePattern = seededPick(['serpent_scales', 'starfield_cosmic', 'royal_brocade', 'tiger_stripes'] as SurfacePatternId[], s, 12);
      cand.appendages.aura = seededPick(['none', 'lunar_crescent', 'ember_sparks', 'shadow_wisps'] as AuraStyleId[], s, 13);
    } else if (cand.chassis === 'arachnid') {
      cand.outfit.topStyle = seededPick(['kente_wrap', 'mystic_vest', 'scholar_robe', 'royal_angarkha'] as TopStyleId[], s, 8);
      cand.outfit.headwear = seededPick(['bandana', 'royal_turban', 'wizard_hat', 'straw_conical', 'none'] as HeadwearStyleId[], s, 9);
      cand.outfit.surfacePattern = seededPick(['kente_weave', 'leopard_spots', 'starfield_cosmic', 'royal_brocade'] as SurfacePatternId[], s, 10);
      cand.head.faceMark = seededPick(['tribal_lines', 'war_paint', 'third_eye', 'none'] as FaceMarkId[], s, 11);
      cand.outfit.capeStyle = seededPick(['none', 'tattered_cloak', 'royal_cape'] as CapeStyleId[], s, 12);
    } else {
      // ethereal
      cand.head.horns = seededPick(['none', 'deer_antlers', 'oni_twin', 'curved_ram', 'unicorn_spire'] as HornStyleId[], s, 8);
      cand.head.hairStyle = seededPick(['wild_spiky', 'dreadlocks', 'long_flowing', 'hooded_cowl', 'none'] as HairStyleId[], s, 9);
      cand.outfit.capeStyle = seededPick(['tattered_cloak', 'celestial_ribbon', 'feather_mantle', 'royal_cape'] as CapeStyleId[], s, 10);
      cand.outfit.surfacePattern = seededPick(['starfield_cosmic', 'bark_grain', 'stone_cracks', 'solid'] as SurfacePatternId[], s, 11);
      cand.appendages.wings = seededPick(['none', 'bat_demon', 'feathered_angel', 'butterfly_fey', 'celestial_flame'] as WingStyleId[], s, 12);
      cand.appendages.aura = seededPick(['shadow_wisps', 'lunar_crescent', 'solar_halo', 'ember_sparks', 'petal_orbit'] as AuraStyleId[], s, 13);
    }

    cand.seedTag = `mut_${s.toString(36).slice(0, 6)}`;

    const testMember: CastMember = syncMemberWithDna(member, cand);
    const assessment = evaluateMemberUniqueness(testMember, avoidList);
    if (assessment.minDistance > bestMinDist) {
      bestMinDist = assessment.minDistance;
      bestDna = cand;
    }
    if (assessment.minDistance >= 0.44) {
      return cand;
    }
  }

  return bestDna;
}

/**
 * Sims-style creative randomizer — generates a cohesive, expressive character/animal/creature/spirit
 * from scratch for the requested chassis (or picks a surprise chassis if omitted).
 */
export function randomizeCharacterDna(chassis?: EntityChassisId, seed = Date.now()): CharacterDNA {
  const s = Math.abs(Math.floor(seed)) || 1337;
  const chosenChassis = chassis || seededPick(CHASSIS_CATALOG, s, 1).id;
  const pal = seededPick(CURATED_DNA_PALETTES, s, 2).palette;

  const base = createBaseDna(chosenChassis, { palette: pal });
  const stubMember: CastMember = {
    id: `rnd_${s.toString(36)}`,
    name: 'Custom Entity',
    archetype:
      chosenChassis === 'quadruped'
        ? 'fox'
        : chosenChassis === 'avian'
          ? 'raven'
          : chosenChassis === 'serpentine'
            ? 'serpent'
            : chosenChassis === 'arachnid'
              ? 'spider'
              : chosenChassis === 'ethereal'
                ? 'spirit'
                : 'warrior',
    primaryColor: pal.primary,
    accentColor: pal.accent,
    skinColor: pal.skin,
    dna: base,
  };

  const mutated = mutateDnaForUniqueness(stubMember, [computeDnaFingerprint(stubMember)], {
    salt: s,
    preserveSpecies: false,
  });

  // Allow fun quadruped head variety during full randomizer!
  if (chosenChassis === 'quadruped') {
    mutated.head.headShape = seededPick(
      ['canine_snout', 'feline_muzzle', 'equine_snout', 'elephant_trunk', 'croc_snout'] as HeadShapeId[],
      s,
      21
    );
    mutated.head.ears =
      mutated.head.headShape === 'elephant_trunk'
        ? 'elephant_fan'
        : seededPick(['fox_tall', 'lion_round', 'hare_long', 'cow_side'] as EarStyleId[], s, 22);
    mutated.appendages.tail = seededPick(
      ['fox_bushy', 'lion_tufted', 'dragon_spiked', 'deer_short', 'monkey_curled'] as TailStyleId[],
      s,
      23
    );
  } else if (chosenChassis === 'humanoid') {
    if (s % 5 === 0) {
      mutated.appendages.wings = seededPick(
        ['feathered_angel', 'butterfly_fey', 'bat_demon', 'celestial_flame'] as WingStyleId[],
        s,
        24
      );
    }
    if (s % 6 === 0) {
      mutated.head.horns = seededPick(['deer_antlers', 'curved_ram', 'oni_twin'] as HornStyleId[], s, 25);
    }
    if (s % 7 === 0) {
      mutated.appendages.extraArms = 2;
    }
  }

  return mutated;
}
