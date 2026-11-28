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

export type EyebrowStyleId =
  | 'natural_arch'
  | 'thick_bold'
  | 'thin_curved'
  | 'straight_stoic'
  | 'angled_fierce'
  | 'high_arched'
  | 'bushy_elder'
  | 'slit_notched'
  | 'feathered'
  | 'none';

export type PupilStyleId =
  | 'round'
  | 'slit_cat'
  | 'star_sparkle'
  | 'ring_cyber'
  | 'crosshair'
  | 'blank_glow'
  | 'spiral_hypno'
  | 'heart_cute';

export type EyelashStyleId =
  | 'none'
  | 'natural'
  | 'winged_liner'
  | 'dramatic_long'
  | 'kohl_kajal';

export type MouthStyleId =
  | 'classic'
  | 'full_lips'
  | 'thin_stern'
  | 'wide_grin'
  | 'fangs_vampire'
  | 'tusks_boar'
  | 'beak_line'
  | 'stitched_gothic';

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
  | 'hooded_cowl'
  | 'bob_cut'
  | 'pixie_short'
  | 'curly_afro'
  | 'ponytail_high'
  | 'side_shave_undercut'
  | 'wavy_shoulder'
  | 'twin_buns'
  | 'mohawk_punk'
  | 'messy_anime'
  | 'silver_bun_elder'
  | 'side_part_classic'
  | 'curtain_bangs'
  | 'wolf_cut';

export type FacialHairId =
  | 'none'
  | 'royal_mustache'
  | 'handlebar'
  | 'short_trimmed'
  | 'sage_long_beard'
  | 'goatee'
  | 'whiskers'
  | 'stubble_5oclock'
  | 'full_viking_beard'
  | 'van_dyke'
  | 'mutton_chops'
  | 'soul_patch'
  | 'braided_dwarf_beard';

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
  | 'tribal_lines'
  | 'nose_bridge_scar'
  | 'brow_slash_scar'
  | 'beauty_mole'
  | 'vitiligo_patch'
  | 'cyber_cheek_circuit'
  | 'tear_tattoos'
  | 'star_freckles'
  | 'glow_runes'
  | 'nose_bandage'
  | 'clown_diamond'
  | 'gold_leaf_forehead'
  | 'dark_undereye';

export type BodyMarkId =
  | 'none'
  | 'tribal_arm_bands'
  | 'sleeve_tattoo_ink'
  | 'cyber_circuit_veins'
  | 'glowing_magic_runes'
  | 'battle_scars_chest'
  | 'vitiligo_body'
  | 'henna_mehndi_hands'
  | 'dragon_coil_tattoo'
  | 'sacred_ash_stripes'
  | 'tiger_body_stripes'
  | 'starlight_freckles'
  | 'stitch_seams'
  | 'cracked_stone_veins'
  | 'biolum_spots'
  | 'anchor_sailor_tattoo';

export type OuterwearStyleId =
  | 'none'
  | 'leather_biker'
  | 'denim_vest'
  | 'royal_sherwani_coat'
  | 'bomber_jacket'
  | 'puffer_vest'
  | 'tactical_rig'
  | 'fur_collared_coat'
  | 'academic_blazer'
  | 'shawl_wrap'
  | 'chainmail_hauberk'
  | 'cyber_exovest'
  | 'hooded_poncho'
  | 'apron_artisan';

export type SleeveStyleId =
  | 'auto'
  | 'sleeveless'
  | 'short_sleeve'
  | 'rolled_cuff'
  | 'long_fitted'
  | 'bell_wide'
  | 'puffed_royal';

export type WaistStyleId =
  | 'none'
  | 'leather_buckle'
  | 'royal_kamarband'
  | 'utility_pouches'
  | 'obi_sash'
  | 'chain_belt'
  | 'rope_cord'
  | 'champion_belt'
  | 'ammo_bandolier'
  | 'jeweled_girdle';

export type GloveStyleId =
  | 'none'
  | 'fingerless_biker'
  | 'leather_gloves'
  | 'steel_gauntlets'
  | 'silk_opera_gloves'
  | 'wrapped_bandages'
  | 'boxing_wraps'
  | 'cyber_hands'
  | 'gold_bangles_stack';

export type FootwearStyleId =
  | 'auto'
  | 'barefoot'
  | 'royal_mojari'
  | 'leather_boots'
  | 'combat_boots'
  | 'sneakers_high'
  | 'dress_oxfords'
  | 'sandals_strappy'
  | 'armored_sabatons'
  | 'cyber_greaves'
  | 'heels_classic'
  | 'tabi_ninja';

export type EyewearStyleId =
  | 'none'
  | 'round_scholar'
  | 'rectangular_modern'
  | 'aviator_shades'
  | 'cat_eye_chic'
  | 'monocle_brass'
  | 'steampunk_goggles'
  | 'cyber_holo_visor'
  | 'tactical_hud'
  | 'heart_shades'
  | 'pirate_eyepatch'
  | 'blindfold_mystic';

export type EarJewelryId =
  | 'none'
  | 'gold_studs'
  | 'hoop_earrings'
  | 'royal_jhumkas'
  | 'feather_drop'
  | 'elf_ear_cuffs'
  | 'cyber_comms_earpiece'
  | 'nose_ring_nath'
  | 'brow_piercing';

export type NeckwearStyleId =
  | 'none'
  | 'locket_pendant'
  | 'crystal_amulet_chain'
  | 'choker_velvet'
  | 'dog_tags'
  | 'tie_necktie'
  | 'bow_tie'
  | 'pearl_strand'
  | 'stethoscope_drape'
  | 'scarf_bandana';

export type WristwearStyleId =
  | 'none'
  | 'smartwatch'
  | 'gold_kadas'
  | 'leather_bracers'
  | 'spiked_cuffs'
  | 'bead_bracelets'
  | 'holo_wristpad';

export type BackGearStyleId =
  | 'none'
  | 'adventure_backpack'
  | 'archer_quiver'
  | 'crossed_katanas'
  | 'electric_guitar_sling'
  | 'jetpack_twin'
  | 'scroll_cylinder'
  | 'shield_slung'
  | 'oxygen_tanks'
  | 'lantern_pole'
  | 'cyber_halo_ring'
  | 'plush_satchel';

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
  | 'mystic_vest'
  | 'trench_coat'
  | 'lab_coat'
  | 'cyber_jacket'
  | 'space_suit'
  | 'business_suit'
  | 'space_exo'
  | 'kimono_robe'
  | 'hoodie_street'
  | 'medieval_plate'
  | 'pirate_coat'
  | 'sports_jersey';

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
  | 'straw_conical'
  | 'fedora'
  | 'cyber_visor'
  | 'astronaut_helmet'
  | 'tricorn_hat'
  | 'samurai_kabuto'
  | 'chef_toque'
  | 'grad_cap'
  | 'viking_horns'
  | 'nurse_cap'
  | 'cowboy_hat'
  | 'diver_helmet'
  | 'elf_circlet'
  | 'baseball_cap'
  | 'beanie_knit'
  | 'beret_artist';

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
  | 'stone_cracks'
  | 'circuit_trace'
  | 'pinstripe'
  | 'camo_hex'
  | 'starfield_speckle'
  | 'circuit_traces'
  | 'starfield_constellation'
  | 'camo_tactical'
  | 'dragon_scales'
  | 'plaid_tartan'
  | 'wave_seigaiha'
  | 'honeycomb_hex'
  | 'floral_botanical';

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

export interface CharacterFaceMorph {
  jawWidth: number; // 0.72 .. 1.32 (default 1.0)
  chinLength: number; // 0.75 .. 1.30 (default 1.0)
  cheekboneWidth: number; // 0.75 .. 1.30 (default 1.0)
  eyeSize: number; // 0.75 .. 1.35 (default 1.0)
  eyeSpacing: number; // 0.78 .. 1.28 (default 1.0)
  eyeTilt: number; // -0.35 .. +0.35 (default 0)
  browHeight: number; // -0.30 .. +0.30 (default 0)
  browThickness: number; // 0.65 .. 1.55 (default 1.0)
  noseScale: number; // 0.70 .. 1.35 (default 1.0)
  mouthWidth: number; // 0.75 .. 1.30 (default 1.0)
  earScale: number; // 0.70 .. 1.40 (default 1.0)
  neckLength: number; // 0.75 .. 1.30 (default 1.0)
}

export const DEFAULT_FACE_MORPH: CharacterFaceMorph = {
  jawWidth: 1.0,
  chinLength: 1.0,
  cheekboneWidth: 1.0,
  eyeSize: 1.0,
  eyeSpacing: 1.0,
  eyeTilt: 0,
  browHeight: 0,
  browThickness: 1.0,
  noseScale: 1.0,
  mouthWidth: 1.0,
  earScale: 1.0,
  neckLength: 1.0,
};

export interface CharacterAccessoriesSpec {
  eyewear: EyewearStyleId;
  earJewelry: EarJewelryId;
  neckwear: NeckwearStyleId;
  wristwear: WristwearStyleId;
  backGear: BackGearStyleId;
}

export const DEFAULT_ACCESSORIES: CharacterAccessoriesSpec = {
  eyewear: 'none',
  earJewelry: 'none',
  neckwear: 'none',
  wristwear: 'none',
  backGear: 'none',
};

export interface CharacterHeadSpec {
  headShape: HeadShapeId;
  eyeStyle: EyeStyleId;
  noseStyle: NoseStyleId;
  ears: EarStyleId;
  horns: HornStyleId;
  hairStyle: HairStyleId;
  facialHair: FacialHairId;
  faceMark: FaceMarkId;
  /** Wave 7 optional granular facial features */
  eyebrowStyle?: EyebrowStyleId;
  pupilStyle?: PupilStyleId;
  eyelashStyle?: EyelashStyleId;
  mouthStyle?: MouthStyleId;
  secondaryFaceMark?: FaceMarkId;
  blushIntensity?: number; // 0 .. 1
}

export interface CharacterOutfitSpec {
  topStyle: TopStyleId;
  bottomStyle: BottomStyleId;
  collarAccessory: CollarAccessoryId;
  capeStyle: CapeStyleId;
  headwear: HeadwearStyleId;
  surfacePattern: SurfacePatternId;
  /** Wave 7 optional layered clothing sub-slots */
  outerwear?: OuterwearStyleId;
  sleeveStyle?: SleeveStyleId;
  waistStyle?: WaistStyleId;
  gloves?: GloveStyleId;
  footwear?: FootwearStyleId;
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
  /** Wave 7 optional extra palette channels */
  eyeSecondary?: string; // heterochromia second eye color
  lip?: string;
  brow?: string;
  markTint?: string;
}

export interface CharacterDNA {
  version: 1;
  chassis: EntityChassisId;
  morph: CharacterMorph;
  head: CharacterHeadSpec;
  outfit: CharacterOutfitSpec;
  appendages: CharacterAppendagesSpec;
  palette: CharacterPaletteSpec;
  /** Wave 7 optional Sims-grade face sculpting morphs */
  faceMorph?: Partial<CharacterFaceMorph>;
  /** Wave 7 optional combinable body marks (up to 3) */
  bodyMarks?: BodyMarkId[];
  /** Wave 7 optional 5-slot combinable accessories */
  accessories?: Partial<CharacterAccessoriesSpec>;
  seedTag?: string;
}

export function resolveFaceMorph(dna?: CharacterDNA): CharacterFaceMorph {
  const fm = dna?.faceMorph;
  if (!fm) return { ...DEFAULT_FACE_MORPH };
  return {
    jawWidth: clampNum(fm.jawWidth, 0.72, 1.32, DEFAULT_FACE_MORPH.jawWidth),
    chinLength: clampNum(fm.chinLength, 0.75, 1.3, DEFAULT_FACE_MORPH.chinLength),
    cheekboneWidth: clampNum(fm.cheekboneWidth, 0.75, 1.3, DEFAULT_FACE_MORPH.cheekboneWidth),
    eyeSize: clampNum(fm.eyeSize, 0.75, 1.35, DEFAULT_FACE_MORPH.eyeSize),
    eyeSpacing: clampNum(fm.eyeSpacing, 0.78, 1.28, DEFAULT_FACE_MORPH.eyeSpacing),
    eyeTilt: clampNum(fm.eyeTilt, -0.35, 0.35, DEFAULT_FACE_MORPH.eyeTilt),
    browHeight: clampNum(fm.browHeight, -0.3, 0.3, DEFAULT_FACE_MORPH.browHeight),
    browThickness: clampNum(fm.browThickness, 0.65, 1.55, DEFAULT_FACE_MORPH.browThickness),
    noseScale: clampNum(fm.noseScale, 0.7, 1.35, DEFAULT_FACE_MORPH.noseScale),
    mouthWidth: clampNum(fm.mouthWidth, 0.75, 1.3, DEFAULT_FACE_MORPH.mouthWidth),
    earScale: clampNum(fm.earScale, 0.7, 1.4, DEFAULT_FACE_MORPH.earScale),
    neckLength: clampNum(fm.neckLength, 0.75, 1.3, DEFAULT_FACE_MORPH.neckLength),
  };
}

export function resolveAccessories(dna?: CharacterDNA): CharacterAccessoriesSpec {
  const acc = dna?.accessories;
  if (!acc) return { ...DEFAULT_ACCESSORIES };
  return {
    eyewear: acc.eyewear && VALID_EYEWEAR.has(acc.eyewear) ? acc.eyewear : 'none',
    earJewelry: acc.earJewelry && VALID_EAR_JEWELRY.has(acc.earJewelry) ? acc.earJewelry : 'none',
    neckwear: acc.neckwear && VALID_NECKWEAR.has(acc.neckwear) ? acc.neckwear : 'none',
    wristwear: acc.wristwear && VALID_WRISTWEAR.has(acc.wristwear) ? acc.wristwear : 'none',
    backGear: acc.backGear && VALID_BACK_GEAR.has(acc.backGear) ? acc.backGear : 'none',
  };
}

export function resolveBodyMarks(dna?: CharacterDNA): BodyMarkId[] {
  if (!Array.isArray(dna?.bodyMarks) || dna.bodyMarks.length === 0) return [];
  const out: BodyMarkId[] = [];
  for (const m of dna.bodyMarks) {
    if (m !== 'none' && VALID_BODY_MARKS.has(m) && !out.includes(m)) {
      out.push(m);
      if (out.length >= 3) break;
    }
  }
  return out;
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
  /** Wave 7 granular silhouette differentiation fields */
  eyebrowStyle?: EyebrowStyleId;
  pupilStyle?: PupilStyleId;
  mouthStyle?: MouthStyleId;
  faceMark?: FaceMarkId;
  secondaryFaceMark?: FaceMarkId;
  bodyMarksKey?: string;
  outerwear?: OuterwearStyleId;
  waistStyle?: WaistStyleId;
  gloves?: GloveStyleId;
  footwear?: FootwearStyleId;
  eyewear?: EyewearStyleId;
  earJewelry?: EarJewelryId;
  neckwear?: NeckwearStyleId;
  wristwear?: WristwearStyleId;
  backGear?: BackGearStyleId;
  faceMorphSignature?: number;
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

export const EYEBROW_STYLE_CATALOG: Array<{ id: EyebrowStyleId; label: string }> = [
  { id: 'natural_arch', label: 'Natural Arch' },
  { id: 'thick_bold', label: 'Thick Bold' },
  { id: 'thin_curved', label: 'Thin Curved' },
  { id: 'straight_stoic', label: 'Straight Stoic' },
  { id: 'angled_fierce', label: 'Angled Fierce' },
  { id: 'high_arched', label: 'High Arched' },
  { id: 'bushy_elder', label: 'Bushy Elder' },
  { id: 'slit_notched', label: 'Slit Notched' },
  { id: 'feathered', label: 'Feathered Soft' },
  { id: 'none', label: 'No Eyebrows' },
];

export const PUPIL_STYLE_CATALOG: Array<{ id: PupilStyleId; label: string }> = [
  { id: 'round', label: 'Classic Round' },
  { id: 'slit_cat', label: 'Feline Slit' },
  { id: 'star_sparkle', label: 'Starlight Sparkle' },
  { id: 'ring_cyber', label: 'Cyber Ring' },
  { id: 'crosshair', label: 'Tactical Crosshair' },
  { id: 'blank_glow', label: 'Mystic Blank Glow' },
  { id: 'spiral_hypno', label: 'Hypno Spiral' },
  { id: 'heart_cute', label: 'Heart Shine' },
];

export const EYELASH_STYLE_CATALOG: Array<{ id: EyelashStyleId; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'natural', label: 'Natural Lashes' },
  { id: 'winged_liner', label: 'Winged Liner' },
  { id: 'dramatic_long', label: 'Dramatic Long' },
  { id: 'kohl_kajal', label: 'Royal Kohl / Kajal' },
];

export const MOUTH_STYLE_CATALOG: Array<{ id: MouthStyleId; label: string }> = [
  { id: 'classic', label: 'Classic Line' },
  { id: 'full_lips', label: 'Full Sculpted Lips' },
  { id: 'thin_stern', label: 'Thin Stern' },
  { id: 'wide_grin', label: 'Wide Grin' },
  { id: 'fangs_vampire', label: 'Vampire Fangs' },
  { id: 'tusks_boar', label: 'Boar / Orc Tusks' },
  { id: 'beak_line', label: 'Beak Seam' },
  { id: 'stitched_gothic', label: 'Stitched Gothic' },
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
  { id: 'bob_cut', label: 'Sleek Bob Cut' },
  { id: 'pixie_short', label: 'Pixie Crop' },
  { id: 'curly_afro', label: 'Curly Afro Crown' },
  { id: 'ponytail_high', label: 'High Ponytail' },
  { id: 'side_shave_undercut', label: 'Side-Shave Undercut' },
  { id: 'wavy_shoulder', label: 'Wavy Shoulder' },
  { id: 'twin_buns', label: 'Twin Odango Buns' },
  { id: 'mohawk_punk', label: 'Punk Mohawk' },
  { id: 'messy_anime', label: 'Messy Shonen Spikes' },
  { id: 'silver_bun_elder', label: 'Elder Chignon Bun' },
  { id: 'side_part_classic', label: 'Classic Side Part' },
  { id: 'curtain_bangs', label: 'Curtain Bangs' },
  { id: 'wolf_cut', label: 'Layered Wolf Cut' },
];

export const FACIAL_HAIR_CATALOG: Array<{ id: FacialHairId; label: string }> = [
  { id: 'none', label: 'Clean' },
  { id: 'royal_mustache', label: 'Royal Mustache' },
  { id: 'handlebar', label: 'Curled Handlebar' },
  { id: 'short_trimmed', label: 'Trimmed Beard' },
  { id: 'sage_long_beard', label: 'Long Sage Beard' },
  { id: 'goatee', label: 'Witty Goatee' },
  { id: 'whiskers', label: 'Feline / Fox Whiskers' },
  { id: 'stubble_5oclock', label: "5 O'Clock Stubble" },
  { id: 'full_viking_beard', label: 'Full Viking Beard' },
  { id: 'van_dyke', label: 'Van Dyke' },
  { id: 'mutton_chops', label: 'Mutton Chops' },
  { id: 'soul_patch', label: 'Soul Patch' },
  { id: 'braided_dwarf_beard', label: 'Braided Dwarf Beard' },
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
  { id: 'nose_bridge_scar', label: 'Nose Bridge Scar' },
  { id: 'brow_slash_scar', label: 'Brow Slash Scar' },
  { id: 'beauty_mole', label: 'Classic Beauty Mole' },
  { id: 'vitiligo_patch', label: 'Vitiligo Face Patch' },
  { id: 'cyber_cheek_circuit', label: 'Cyber Cheek Circuit' },
  { id: 'tear_tattoos', label: 'Teardrop Ink' },
  { id: 'star_freckles', label: 'Starlight Freckles' },
  { id: 'glow_runes', label: 'Glowing Arcane Runes' },
  { id: 'nose_bandage', label: 'Hero Nose Bandage' },
  { id: 'clown_diamond', label: 'Harlequin Diamonds' },
  { id: 'gold_leaf_forehead', label: 'Gold Leaf Brow Seal' },
  { id: 'dark_undereye', label: 'Sleepless Undereye' },
];

export const BODY_MARK_CATALOG: Array<{ id: BodyMarkId; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'tribal_arm_bands', label: 'Tribal Arm Bands' },
  { id: 'sleeve_tattoo_ink', label: 'Full Ink Sleeve' },
  { id: 'cyber_circuit_veins', label: 'Cyber Circuit Veins' },
  { id: 'glowing_magic_runes', label: 'Glowing Magic Runes' },
  { id: 'battle_scars_chest', label: 'Battle Scars (Chest)' },
  { id: 'vitiligo_body', label: 'Vitiligo Body Pattern' },
  { id: 'henna_mehndi_hands', label: 'Henna / Mehndi Hands' },
  { id: 'dragon_coil_tattoo', label: 'Dragon Coil Tattoo' },
  { id: 'sacred_ash_stripes', label: 'Sacred Ash Stripes' },
  { id: 'tiger_body_stripes', label: 'Tiger Body Stripes' },
  { id: 'starlight_freckles', label: 'Starlight Body Freckles' },
  { id: 'stitch_seams', label: 'Gothic Stitch Seams' },
  { id: 'cracked_stone_veins', label: 'Cracked Stone Veins' },
  { id: 'biolum_spots', label: 'Bioluminescent Spots' },
  { id: 'anchor_sailor_tattoo', label: 'Sailor Anchor Tattoo' },
];

export const OUTERWEAR_CATALOG: Array<{ id: OuterwearStyleId; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'leather_biker', label: 'Leather Biker Jacket' },
  { id: 'denim_vest', label: 'Denim Street Vest' },
  { id: 'royal_sherwani_coat', label: 'Royal Sherwani Coat' },
  { id: 'bomber_jacket', label: 'Aviator Bomber Jacket' },
  { id: 'puffer_vest', label: 'Quilted Puffer Vest' },
  { id: 'tactical_rig', label: 'Tactical Chest Rig' },
  { id: 'fur_collared_coat', label: 'Fur-Collared Greatcoat' },
  { id: 'academic_blazer', label: 'Academic Blazer' },
  { id: 'shawl_wrap', label: 'Woven Shawl Wrap' },
  { id: 'chainmail_hauberk', label: 'Chainmail Hauberk' },
  { id: 'cyber_exovest', label: 'Cyber Exo-Vest' },
  { id: 'hooded_poncho', label: 'Traveler Hooded Poncho' },
  { id: 'apron_artisan', label: 'Artisan Work Apron' },
];

export const SLEEVE_CATALOG: Array<{ id: SleeveStyleId; label: string }> = [
  { id: 'auto', label: 'Auto (Match Top)' },
  { id: 'sleeveless', label: 'Sleeveless' },
  { id: 'short_sleeve', label: 'Short Sleeve' },
  { id: 'rolled_cuff', label: 'Rolled Cuff' },
  { id: 'long_fitted', label: 'Long Fitted' },
  { id: 'bell_wide', label: 'Wide Bell Sleeve' },
  { id: 'puffed_royal', label: 'Puffed Royal Sleeve' },
];

export const WAIST_CATALOG: Array<{ id: WaistStyleId; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'leather_buckle', label: 'Leather Buckle Belt' },
  { id: 'royal_kamarband', label: 'Royal Kamarband' },
  { id: 'utility_pouches', label: 'Utility Pouch Belt' },
  { id: 'obi_sash', label: 'Folded Obi Sash' },
  { id: 'chain_belt', label: 'Punk Chain Belt' },
  { id: 'rope_cord', label: 'Monk Rope Cord' },
  { id: 'champion_belt', label: 'Champion Title Belt' },
  { id: 'ammo_bandolier', label: 'Cross Bandolier' },
  { id: 'jeweled_girdle', label: 'Jeweled Girdle' },
];

export const GLOVE_CATALOG: Array<{ id: GloveStyleId; label: string }> = [
  { id: 'none', label: 'Bare Hands' },
  { id: 'fingerless_biker', label: 'Fingerless Biker' },
  { id: 'leather_gloves', label: 'Tailored Leather' },
  { id: 'steel_gauntlets', label: 'Steel Gauntlets' },
  { id: 'silk_opera_gloves', label: 'Silk Opera Gloves' },
  { id: 'wrapped_bandages', label: 'Fighter Bandages' },
  { id: 'boxing_wraps', label: 'Boxing Hand Wraps' },
  { id: 'cyber_hands', label: 'Cybernetic Hands' },
  { id: 'gold_bangles_stack', label: 'Royal Gold Bangles' },
];

export const FOOTWEAR_CATALOG: Array<{ id: FootwearStyleId; label: string }> = [
  { id: 'auto', label: 'Auto (Match Outfit)' },
  { id: 'barefoot', label: 'Barefoot' },
  { id: 'royal_mojari', label: 'Curled Royal Mojari' },
  { id: 'leather_boots', label: 'Riding Leather Boots' },
  { id: 'combat_boots', label: 'Laced Combat Boots' },
  { id: 'sneakers_high', label: 'High-Top Sneakers' },
  { id: 'dress_oxfords', label: 'Polished Oxfords' },
  { id: 'sandals_strappy', label: 'Strappy Sandals' },
  { id: 'armored_sabatons', label: 'Armored Sabatons' },
  { id: 'cyber_greaves', label: 'Neon Cyber Greaves' },
  { id: 'heels_classic', label: 'Classic Heels' },
  { id: 'tabi_ninja', label: 'Shinobi Tabi Boots' },
];

export const EYEWEAR_CATALOG: Array<{ id: EyewearStyleId; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'round_scholar', label: 'Round Scholar Glasses' },
  { id: 'rectangular_modern', label: 'Modern Rectangular' },
  { id: 'aviator_shades', label: 'Aviator Shades' },
  { id: 'cat_eye_chic', label: 'Cat-Eye Chic' },
  { id: 'monocle_brass', label: 'Brass Monocle' },
  { id: 'steampunk_goggles', label: 'Steampunk Goggles' },
  { id: 'cyber_holo_visor', label: 'Cyber Holo-Visor' },
  { id: 'tactical_hud', label: 'Tactical HUD Lens' },
  { id: 'heart_shades', label: 'Heart Shades' },
  { id: 'pirate_eyepatch', label: 'Corsair Eyepatch' },
  { id: 'blindfold_mystic', label: 'Mystic Blindfold' },
];

export const EAR_JEWELRY_CATALOG: Array<{ id: EarJewelryId; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'gold_studs', label: 'Gold Ear Studs' },
  { id: 'hoop_earrings', label: 'Hoop Earrings' },
  { id: 'royal_jhumkas', label: 'Royal Jhumka Drops' },
  { id: 'feather_drop', label: 'Feather Drop Earrings' },
  { id: 'elf_ear_cuffs', label: 'Elven Ear Cuffs' },
  { id: 'cyber_comms_earpiece', label: 'Cyber Comms Earpiece' },
  { id: 'nose_ring_nath', label: 'Royal Nose Ring (Nath)' },
  { id: 'brow_piercing', label: 'Twin Brow Piercing' },
];

export const NECKWEAR_CATALOG: Array<{ id: NeckwearStyleId; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'locket_pendant', label: 'Gold Locket Pendant' },
  { id: 'crystal_amulet_chain', label: 'Crystal Amulet Chain' },
  { id: 'choker_velvet', label: 'Velvet Choker' },
  { id: 'dog_tags', label: 'Tactical Dog Tags' },
  { id: 'tie_necktie', label: 'Tailored Necktie' },
  { id: 'bow_tie', label: 'Classic Bow Tie' },
  { id: 'pearl_strand', label: 'Pearl Strand' },
  { id: 'stethoscope_drape', label: 'Clinical Stethoscope' },
  { id: 'scarf_bandana', label: 'Neck Bandana Scarf' },
];

export const WRISTWEAR_CATALOG: Array<{ id: WristwearStyleId; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'smartwatch', label: 'Smartwatch' },
  { id: 'gold_kadas', label: 'Royal Gold Kadas' },
  { id: 'leather_bracers', label: 'Leather Bracers' },
  { id: 'spiked_cuffs', label: 'Spiked Punk Cuffs' },
  { id: 'bead_bracelets', label: 'Woven Bead Bracelets' },
  { id: 'holo_wristpad', label: 'Cyber Holo-Wristpad' },
];

export const BACK_GEAR_CATALOG: Array<{ id: BackGearStyleId; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'adventure_backpack', label: 'Adventure Backpack' },
  { id: 'archer_quiver', label: 'Archer Arrow Quiver' },
  { id: 'crossed_katanas', label: 'Crossed Katanas' },
  { id: 'electric_guitar_sling', label: 'Slung Electric Guitar' },
  { id: 'jetpack_twin', label: 'Twin Thruster Jetpack' },
  { id: 'scroll_cylinder', label: 'Master Scroll Cylinder' },
  { id: 'shield_slung', label: 'Back-Slung Heater Shield' },
  { id: 'oxygen_tanks', label: 'Twin EVA Oxygen Tanks' },
  { id: 'lantern_pole', label: 'Spirit Lantern Pole' },
  { id: 'cyber_halo_ring', label: 'Cyber Halo Ring' },
  { id: 'plush_satchel', label: 'Cozy Messenger Satchel' },
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
  { id: 'trench_coat', label: 'Noir Trench Coat' },
  { id: 'lab_coat', label: 'Research Lab Coat' },
  { id: 'cyber_jacket', label: 'Neon Cyber Jacket' },
  { id: 'space_suit', label: 'Orbital EVA Space Suit' },
  { id: 'business_suit', label: 'Executive Business Suit' },
  { id: 'space_exo', label: 'Exo-Frame Armor Suit' },
  { id: 'kimono_robe', label: 'Silk Kimono & Obi' },
  { id: 'hoodie_street', label: 'Streetwear Hoodie' },
  { id: 'medieval_plate', label: 'Medieval Knight Plate' },
  { id: 'pirate_coat', label: 'Captain Buccaneer Coat' },
  { id: 'sports_jersey', label: 'Pro Athletic Jersey' },
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
  { id: 'fedora', label: 'Noir Detective Fedora' },
  { id: 'cyber_visor', label: 'Neon Cyber Visor' },
  { id: 'astronaut_helmet', label: 'EVA Astronaut Helmet' },
  { id: 'tricorn_hat', label: 'Corsair Tricorn Hat' },
  { id: 'samurai_kabuto', label: 'Samurai War Kabuto' },
  { id: 'chef_toque', label: 'Culinary Chef Toque' },
  { id: 'grad_cap', label: 'Academic Mortarboard' },
  { id: 'viking_horns', label: 'Nordic Horned Helm' },
  { id: 'nurse_cap', label: 'Clinical Med Cap' },
  { id: 'cowboy_hat', label: 'Frontier Cowboy Hat' },
  { id: 'diver_helmet', label: 'Deep-Sea Brass Helmet' },
  { id: 'elf_circlet', label: 'Elven Starlight Circlet' },
  { id: 'baseball_cap', label: 'Classic Baseball Cap' },
  { id: 'beanie_knit', label: 'Knit Beanie' },
  { id: 'beret_artist', label: 'Artist Beret' },
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
  { id: 'circuit_trace', label: 'Cyber Circuit Trace' },
  { id: 'pinstripe', label: 'Tailored Pinstripe' },
  { id: 'camo_hex', label: 'Tactical Camo Hex' },
  { id: 'starfield_speckle', label: 'Nebula Starfield Speckle' },
  { id: 'circuit_traces', label: 'Microchip Circuit Traces' },
  { id: 'starfield_constellation', label: 'Constellation Starlines' },
  { id: 'camo_tactical', label: 'Woodland Tactical Camo' },
  { id: 'dragon_scales', label: 'Imperial Dragon Scales' },
  { id: 'plaid_tartan', label: 'Heritage Tartan Plaid' },
  { id: 'wave_seigaiha', label: 'Seigaiha Ocean Waves' },
  { id: 'honeycomb_hex', label: 'Sci-Fi Honeycomb Mesh' },
  { id: 'floral_botanical', label: 'Botanical Floral Motif' },
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
const VALID_EYEBROWS = new Set<EyebrowStyleId>(EYEBROW_STYLE_CATALOG.map((c) => c.id));
const VALID_PUPILS = new Set<PupilStyleId>(PUPIL_STYLE_CATALOG.map((c) => c.id));
const VALID_EYELASHES = new Set<EyelashStyleId>(EYELASH_STYLE_CATALOG.map((c) => c.id));
const VALID_MOUTHS = new Set<MouthStyleId>(MOUTH_STYLE_CATALOG.map((c) => c.id));
const VALID_BODY_MARKS = new Set<BodyMarkId>(BODY_MARK_CATALOG.map((c) => c.id));
const VALID_OUTERWEAR = new Set<OuterwearStyleId>(OUTERWEAR_CATALOG.map((c) => c.id));
const VALID_SLEEVES = new Set<SleeveStyleId>(SLEEVE_CATALOG.map((c) => c.id));
const VALID_WAISTS = new Set<WaistStyleId>(WAIST_CATALOG.map((c) => c.id));
const VALID_GLOVES = new Set<GloveStyleId>(GLOVE_CATALOG.map((c) => c.id));
const VALID_FOOTWEAR = new Set<FootwearStyleId>(FOOTWEAR_CATALOG.map((c) => c.id));
const VALID_EYEWEAR = new Set<EyewearStyleId>(EYEWEAR_CATALOG.map((c) => c.id));
const VALID_EAR_JEWELRY = new Set<EarJewelryId>(EAR_JEWELRY_CATALOG.map((c) => c.id));
const VALID_NECKWEAR = new Set<NeckwearStyleId>(NECKWEAR_CATALOG.map((c) => c.id));
const VALID_WRISTWEAR = new Set<WristwearStyleId>(WRISTWEAR_CATALOG.map((c) => c.id));
const VALID_BACK_GEAR = new Set<BackGearStyleId>(BACK_GEAR_CATALOG.map((c) => c.id));

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
    case 'detective':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.02, 0.72, 1.32, 1.02), shoulderWidth: 1.06, gait: 'folk' },
        head: { headShape: 'chiseled', hairStyle: 'short_crop', facialHair: 'short_trimmed' },
        outfit: { topStyle: 'trench_coat', bottomStyle: 'trousers', collarAccessory: 'scarf_muffler', headwear: 'fedora', surfacePattern: 'pinstripe' },
        palette: basePal,
      });
      break;
    case 'scientist':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.0, 0.72, 1.32, 1.0), shoulderWidth: 0.96, gait: 'folk' },
        head: { headShape: 'oval', hairStyle: 'wild_spiky', eyeStyle: 'wide_fable' },
        outfit: { topStyle: 'lab_coat', bottomStyle: 'trousers', collarAccessory: 'none', headwear: 'none', surfacePattern: 'solid' },
        palette: basePal,
      });
      break;
    case 'astronaut':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.06, 0.72, 1.32, 1.06), shoulderWidth: 1.2, torsoBulk: 1.16, gait: 'heavy' },
        head: { headShape: 'round', hairStyle: 'none' },
        outfit: { topStyle: 'space_suit', bottomStyle: 'armored_greaves', headwear: 'astronaut_helmet', surfacePattern: 'starfield_speckle' },
        palette: basePal,
      });
      break;
    case 'cyber_hacker':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 0.98, 0.72, 1.32, 0.98), shoulderWidth: 0.96, gait: 'agile' },
        head: { headShape: 'angular', hairStyle: 'wild_spiky', eyeStyle: 'narrow_sharp' },
        outfit: { topStyle: 'cyber_jacket', bottomStyle: 'trousers', headwear: 'cyber_visor', surfacePattern: 'circuit_trace' },
        palette: basePal,
      });
      break;
    case 'android':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.04, 0.72, 1.32, 1.04), shoulderWidth: 1.08, gait: 'regal' },
        head: { headShape: 'angular', eyeStyle: 'glowing_orb', hairStyle: 'short_crop' },
        outfit: { topStyle: 'cyber_jacket', bottomStyle: 'armored_greaves', headwear: 'none', surfacePattern: 'circuit_trace' },
        palette: { ...basePal, skin: '#d8e4f0', eye: accent },
      });
      break;
    case 'mech_pilot':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.05, 0.72, 1.32, 1.05), shoulderWidth: 1.18, torsoBulk: 1.1, gait: 'martial' },
        head: { headShape: 'chiseled', hairStyle: 'short_crop' },
        outfit: { topStyle: 'space_suit', bottomStyle: 'armored_greaves', headwear: 'cyber_visor', surfacePattern: 'camo_hex' },
        palette: basePal,
      });
      break;
    case 'wizard':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.02, 0.72, 1.32, 1.02), shoulderWidth: 0.94, gait: 'ethereal' },
        head: { headShape: 'gaunt', hairStyle: 'long_flowing', facialHair: 'sage_long_beard', eyeStyle: 'glowing_orb' },
        outfit: { topStyle: 'scholar_robe', bottomStyle: 'robe_hem', capeStyle: 'royal_cape', headwear: 'wizard_hat', surfacePattern: 'starfield_speckle' },
        appendages: { aura: 'lunar_crescent' },
        palette: { ...basePal, hair: '#e2e8f0' },
      });
      break;
    case 'pirate_captain':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.06, 0.72, 1.32, 1.06), shoulderWidth: 1.14, gait: 'martial' },
        head: { headShape: 'broad_jaw', hairStyle: 'dreadlocks', facialHair: 'handlebar', faceMark: 'eye_patch' },
        outfit: { topStyle: 'trench_coat', bottomStyle: 'trousers', capeStyle: 'royal_cape', headwear: 'tricorn_hat' },
        palette: basePal,
      });
      break;
    case 'ninja':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 0.98, 0.72, 1.32, 0.98), shoulderWidth: 1.0, torsoBulk: 0.9, gait: 'agile' },
        head: { headShape: 'angular', eyeStyle: 'narrow_sharp', hairStyle: 'hooded_cowl' },
        outfit: { topStyle: 'mystic_vest', bottomStyle: 'trousers', headwear: 'bandana', surfacePattern: 'camo_hex' },
        palette: basePal,
      });
      break;
    case 'viking':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.14, 0.72, 1.32, 1.14), shoulderWidth: 1.28, torsoBulk: 1.22, gait: 'heavy' },
        head: { headShape: 'broad_jaw', horns: 'bull_horns', facialHair: 'sage_long_beard', faceMark: 'war_paint' },
        outfit: { topStyle: 'plate_armor', bottomStyle: 'armored_greaves', collarAccessory: 'fur_mantle', headwear: 'battle_helm' },
        palette: { ...basePal, hair: '#d97706' },
      });
      break;
    case 'pharaoh':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.08, 0.72, 1.32, 1.08), shoulderWidth: 1.12, gait: 'regal' },
        head: { headShape: 'chiseled', facialHair: 'goatee' },
        outfit: { topStyle: 'royal_angarkha', bottomStyle: 'dhoti', collarAccessory: 'gold_necklace', headwear: 'golden_mukut', surfacePattern: 'royal_brocade' },
        appendages: { aura: 'solar_halo' },
        palette: basePal,
      });
      break;
    case 'vampire_lord':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.1, 0.72, 1.32, 1.1), shoulderWidth: 1.08, torsoBulk: 0.9, gait: 'regal' },
        head: { headShape: 'gaunt', eyeStyle: 'glowing_orb', ears: 'pointed_elf', hairStyle: 'swept_royal' },
        outfit: { topStyle: 'trench_coat', bottomStyle: 'trousers', capeStyle: 'royal_cape', surfacePattern: 'pinstripe' },
        appendages: { wings: 'bat_demon', aura: 'shadow_wisps' },
        palette: { ...basePal, eye: '#ef4444' },
      });
      break;
    case 'dragon_kin':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.14, 0.72, 1.32, 1.14), shoulderWidth: 1.24, torsoBulk: 1.16, gait: 'martial' },
        head: { headShape: 'angular', eyeStyle: 'slit_reptile', horns: 'demon_crown_horns' },
        outfit: { topStyle: 'plate_armor', bottomStyle: 'armored_greaves', surfacePattern: 'serpent_scales' },
        appendages: { wings: 'dragon_leathery', tail: 'dragon_spiked', aura: 'ember_sparks' },
        palette: basePal,
      });
      break;
    case 'elf_archer':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.04, 0.72, 1.32, 1.04), shoulderWidth: 0.92, torsoBulk: 0.86, gait: 'agile' },
        head: { headShape: 'oval', ears: 'pointed_elf', hairStyle: 'long_flowing' },
        outfit: { topStyle: 'peasant_tunic', bottomStyle: 'trousers', capeStyle: 'tattered_cloak', headwear: 'laurel_wreath' },
        palette: { ...basePal, hair: '#fde68a' },
      });
      break;
    case 'dwarf_smith':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 0.82, 0.72, 1.32, 0.82), shoulderWidth: 1.32, torsoBulk: 1.3, gait: 'heavy' },
        head: { headShape: 'broad_jaw', facialHair: 'sage_long_beard', hairStyle: 'braided_twin' },
        outfit: { topStyle: 'plate_armor', bottomStyle: 'armored_greaves', collarAccessory: 'fur_mantle' },
        palette: { ...basePal, hair: '#9a3412' },
      });
      break;
    case 'ghost_phantom':
      dna = createBaseDna('ethereal', {
        morph: { height: clampNum(scale * 1.04, 0.72, 1.32, 1.04), shoulderWidth: 0.92, torsoBulk: 0.84, gait: 'ethereal' },
        head: { headShape: 'gaunt', eyeStyle: 'glowing_orb', hairStyle: 'hooded_cowl' },
        outfit: { topStyle: 'mystic_vest', bottomStyle: 'ethereal_wisp', capeStyle: 'tattered_cloak', surfacePattern: 'starfield_speckle' },
        appendages: { aura: 'shadow_wisps' },
        palette: basePal,
      });
      break;
    case 'journalist':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 1.0, 0.72, 1.32, 1.0), shoulderWidth: 0.98, gait: 'folk' },
        head: { headShape: 'oval', hairStyle: 'swept_royal' },
        outfit: { topStyle: 'trench_coat', bottomStyle: 'trousers', surfacePattern: 'pinstripe' },
        palette: basePal,
      });
      break;
    case 'street_musician':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 0.98, 0.72, 1.32, 0.98), shoulderWidth: 0.96, gait: 'agile' },
        head: { headShape: 'round', hairStyle: 'dreadlocks' },
        outfit: { topStyle: 'cyber_jacket', bottomStyle: 'trousers', collarAccessory: 'scarf_muffler', headwear: 'bandana' },
        palette: basePal,
      });
      break;
    case 'cat_mascot':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 0.86, 0.72, 1.32, 0.86), shoulderWidth: 0.94, headRatio: 1.24, gait: 'agile' },
        head: { headShape: 'feline_muzzle', eyeStyle: 'wide_fable', ears: 'fox_tall', facialHair: 'whiskers' },
        outfit: { topStyle: 'peasant_tunic', bottomStyle: 'trousers', surfacePattern: 'tiger_stripes' },
        appendages: { tail: 'fox_bushy' },
        palette: basePal,
      });
      break;
    case 'robot_companion':
      dna = createBaseDna('humanoid', {
        morph: { height: clampNum(scale * 0.84, 0.72, 1.32, 0.84), shoulderWidth: 1.06, headRatio: 1.26, gait: 'ethereal' },
        head: { headShape: 'round', eyeStyle: 'glowing_orb', ears: 'none', hairStyle: 'none' },
        outfit: { topStyle: 'space_suit', bottomStyle: 'armored_greaves', headwear: 'cyber_visor', surfacePattern: 'circuit_trace' },
        palette: basePal,
      });
      break;
    default: {
      const aStr = String(arch);
      const isQuad = /dino|bear|panda|camel|unicorn|griffin|pegasus|werewolf/.test(aStr);
      const isAvian = /eagle|phoenix|penguin/.test(aStr);
      const isFloat = /djinn|hologram|angel|reaper|banshee|slime/.test(aStr);
      const chassis: EntityChassisId = isQuad ? 'quadruped' : isAvian ? 'avian' : isFloat ? 'ethereal' : 'humanoid';
      const topStyle: TopStyleId =
        /ceo|lawyer|anchor|trader|historian|judge|conductor/.test(aStr) ? 'business_suit' :
        /bounty|cyborg|admiral|drone|wasteland/.test(aStr) ? 'space_exo' :
        /kitsune|shogun|martial/.test(aStr) ? 'kimono_robe' :
        /developer|vlogger|skateboard|courier|podcast|director/.test(aStr) ? 'hoodie_street' :
        /paladin|roman|spartan|valkyrie|orc|golem|automaton/.test(aStr) ? 'medieval_plate' :
        /doctor|geneticist|physicist|mad_scientist|teacher/.test(aStr) ? 'lab_coat' :
        /soccer|cricket|esports|coach/.test(aStr) ? 'sports_jersey' :
        /sheriff|outlaw|ringmaster|bard/.test(aStr) ? 'pirate_coat' :
        isQuad || isAvian ? 'none_fur' : 'royal_angarkha';
      const headwear: HeadwearStyleId =
        /shogun/.test(aStr) ? 'samurai_kabuto' :
        /chef/.test(aStr) ? 'chef_toque' :
        /historian|teacher|judge/.test(aStr) ? 'grad_cap' :
        /valkyrie|orc/.test(aStr) ? 'viking_horns' :
        /doctor/.test(aStr) ? 'nurse_cap' :
        /sheriff|outlaw|farmer|scout/.test(aStr) ? 'cowboy_hat' :
        /bounty|cyborg/.test(aStr) ? 'cyber_visor' :
        /athena|angel|mermaid|kitsune|zeus|poseidon/.test(aStr) ? 'elf_circlet' : 'none';
      const surfacePattern: SurfacePatternId =
        /cyborg|hologram|drone|developer|esports/.test(aStr) ? 'circuit_traces' :
        /zeus|angel|oracle|physicist|alien/.test(aStr) ? 'starfield_constellation' :
        /dragon|trex|triceratops|shark/.test(aStr) ? 'dragon_scales' :
        /kitsune|shogun|poseidon|mermaid/.test(aStr) ? 'wave_seigaiha' :
        /ceo|lawyer|anchor|trader/.test(aStr) ? 'pinstripe' : 'solid';
      dna = createBaseDna(chassis, {
        outfit: { topStyle, headwear, surfacePattern },
        palette: basePal,
      });
      break;
    }
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

  // Wave 7 Granular Hair & Facial Hair Hints
  if (/\bbob\s*cut\b/.test(t)) dna.head.hairStyle = 'bob_cut';
  else if (/\bpixie\b/.test(t)) dna.head.hairStyle = 'pixie_short';
  else if (/\bafro\b/.test(t)) dna.head.hairStyle = 'curly_afro';
  else if (/\bponytail\b/.test(t)) dna.head.hairStyle = 'ponytail_high';
  else if (/\bundercut|side\s*shave\b/.test(t)) dna.head.hairStyle = 'side_shave_undercut';
  else if (/\bwavy\s*hair\b/.test(t)) dna.head.hairStyle = 'wavy_shoulder';
  else if (/\btwin\s*buns|odango\b/.test(t)) dna.head.hairStyle = 'twin_buns';
  else if (/\bmohawk\b/.test(t)) dna.head.hairStyle = 'mohawk_punk';
  else if (/\bmessy\s*(anime|hair)\b/.test(t)) dna.head.hairStyle = 'messy_anime';
  else if (/\bside[\s-]*part\b/.test(t)) dna.head.hairStyle = 'side_part_classic';
  else if (/\bcurtain\s*bangs?\b/.test(t)) dna.head.hairStyle = 'curtain_bangs';
  else if (/\bwolf\s*cut\b/.test(t)) dna.head.hairStyle = 'wolf_cut';

  // Wave 9 Casual Global Headwear Hints
  if (/\bbaseball\s*cap|ball\s*cap|snapback\b/.test(t)) dna.outfit.headwear = 'baseball_cap';
  else if (/\bknit\s*beanie|beanie|toque\s*knit\b/.test(t)) dna.outfit.headwear = 'beanie_knit';
  else if (/\bartist\s*beret|beret\b/.test(t)) dna.outfit.headwear = 'beret_artist';

  if (/\bstubble\b/.test(t)) dna.head.facialHair = 'stubble_5oclock';
  else if (/\bviking\s*beard\b/.test(t)) dna.head.facialHair = 'full_viking_beard';
  else if (/\bbraided\s*beard|dwarf\s*beard\b/.test(t)) dna.head.facialHair = 'braided_dwarf_beard';
  else if (/\bvan\s*dyke\b/.test(t)) dna.head.facialHair = 'van_dyke';
  else if (/\bmutton\s*chops\b/.test(t)) dna.head.facialHair = 'mutton_chops';

  // Wave 7 Eyes, Eyebrows, Lashes & Mouth Hints
  if (/\bcat\s*eyes?|feline\s*pupils?\b/.test(t)) dna.head.pupilStyle = 'slit_cat';
  else if (/\bstar\s*(eyes?|pupils?)\b/.test(t)) dna.head.pupilStyle = 'star_sparkle';
  else if (/\bcyber\s*(eyes?|pupils?)\b/.test(t)) dna.head.pupilStyle = 'ring_cyber';
  else if (/\bcrosshair\b/.test(t)) dna.head.pupilStyle = 'crosshair';
  else if (/\bheart\s*(eyes?|pupils?)\b/.test(t)) dna.head.pupilStyle = 'heart_cute';
  else if (/\bglowing\s*blank|blank\s*eyes?\b/.test(t)) dna.head.pupilStyle = 'blank_glow';

  if (/\bthick\s*brows?|bushy\s*brows?\b/.test(t)) dna.head.eyebrowStyle = /\bbushy\b/.test(t) ? 'bushy_elder' : 'thick_bold';
  else if (/\bnotched\s*brow|slit\s*brow\b/.test(t)) dna.head.eyebrowStyle = 'slit_notched';
  else if (/\bfierce\s*brows?\b/.test(t)) dna.head.eyebrowStyle = 'angled_fierce';

  if (/\bwinged\s*(liner|eyeliner)\b/.test(t)) dna.head.eyelashStyle = 'winged_liner';
  else if (/\bkohl|kajal\b/.test(t)) dna.head.eyelashStyle = 'kohl_kajal';
  else if (/\blong\s*lashes\b/.test(t)) dna.head.eyelashStyle = 'dramatic_long';

  if (/\bvampire|fangs?\b/.test(t)) dna.head.mouthStyle = 'fangs_vampire';
  else if (/\btusks?|boar\b/.test(t)) dna.head.mouthStyle = 'tusks_boar';
  else if (/\bstitched\s*(mouth|lips?)\b/.test(t)) dna.head.mouthStyle = 'stitched_gothic';
  else if (/\bfull\s*lips?\b/.test(t)) dna.head.mouthStyle = 'full_lips';
  else if (/\bwide\s*grin\b/.test(t)) dna.head.mouthStyle = 'wide_grin';

  if (/\bheterochromia\b/.test(t)) {
    dna.palette.eyeSecondary = dna.palette.accent || '#38bdf8';
  }

  // Wave 7 Face Marks & Body Marks Hints
  const addFaceMark = (mark: FaceMarkId) => {
    if (dna.head.faceMark === 'none') dna.head.faceMark = mark;
    else if (dna.head.faceMark !== mark) dna.head.secondaryFaceMark = mark;
  };
  if (/\bnose\s*(bridge\s*)?scar\b/.test(t)) addFaceMark('nose_bridge_scar');
  else if (/\bbrow\s*(slash\s*)?scar\b/.test(t)) addFaceMark('brow_slash_scar');
  if (/\bbeauty\s*mole|mole\b/.test(t)) addFaceMark('beauty_mole');
  if (/\bstar\s*freckles?\b/.test(t)) addFaceMark('star_freckles');
  else if (/\bfreckles?\b/.test(t)) addFaceMark('freckles');
  if (/\bvitiligo\b/.test(t)) {
    addFaceMark('vitiligo_patch');
    dna.bodyMarks = Array.from(new Set([...(dna.bodyMarks || []), 'vitiligo_body' as BodyMarkId])).slice(0, 3);
  }
  if (/\bnose\s*bandage\b/.test(t)) addFaceMark('nose_bandage');
  if (/\bcyber\s*(cheek|circuit|implant)\b/.test(t)) addFaceMark('cyber_cheek_circuit');
  if (/\bglow(ing)?\s*runes?\b/.test(t)) {
    addFaceMark('glow_runes');
    dna.bodyMarks = Array.from(new Set([...(dna.bodyMarks || []), 'glowing_magic_runes' as BodyMarkId])).slice(0, 3);
  }
  if (/\bblush|rosy\s*cheeks?\b/.test(t)) dna.head.blushIntensity = 0.55;

  const pushBodyMark = (bm: BodyMarkId) => {
    const cur = dna.bodyMarks ? [...dna.bodyMarks] : [];
    if (!cur.includes(bm) && cur.length < 3) cur.push(bm);
    dna.bodyMarks = cur;
  };
  if (/\bdragon\s*tattoo\b/.test(t)) pushBodyMark('dragon_coil_tattoo');
  else if (/\bsleeve\s*tattoo|tattoos?|inked\b/.test(t)) pushBodyMark('sleeve_tattoo_ink');
  if (/\btribal\s*(arm|tattoo|bands?)\b/.test(t)) pushBodyMark('tribal_arm_bands');
  if (/\bhenna|mehndi\b/.test(t)) pushBodyMark('henna_mehndi_hands');
  if (/\bchest\s*scars?|battle\s*scars?\b/.test(t)) pushBodyMark('battle_scars_chest');
  if (/\bcyber\s*veins?\b/.test(t)) pushBodyMark('cyber_circuit_veins');
  if (/\banchor\s*tattoo\b/.test(t)) pushBodyMark('anchor_sailor_tattoo');

  // Wave 7 Layered Clothing (Outerwear, Sleeves, Waist, Gloves, Footwear)
  if (/\bleather\s*(biker|jacket)\b/.test(t)) dna.outfit.outerwear = 'leather_biker';
  else if (/\bdenim\s*vest\b/.test(t)) dna.outfit.outerwear = 'denim_vest';
  else if (/\bsherwani\b/.test(t)) dna.outfit.outerwear = 'royal_sherwani_coat';
  else if (/\bbomber\s*jacket\b/.test(t)) dna.outfit.outerwear = 'bomber_jacket';
  else if (/\bpuffer\s*vest\b/.test(t)) dna.outfit.outerwear = 'puffer_vest';
  else if (/\btactical\s*rig\b/.test(t)) dna.outfit.outerwear = 'tactical_rig';
  else if (/\bfur[\s-]collar(ed)?\s*coat\b/.test(t)) dna.outfit.outerwear = 'fur_collared_coat';
  else if (/\bblazer\b/.test(t)) dna.outfit.outerwear = 'academic_blazer';
  else if (/\bshawl\b/.test(t)) dna.outfit.outerwear = 'shawl_wrap';
  else if (/\bchainmail\b/.test(t)) dna.outfit.outerwear = 'chainmail_hauberk';
  else if (/\bexo[\s-]?vest\b/.test(t)) dna.outfit.outerwear = 'cyber_exovest';
  else if (/\bponcho\b/.test(t)) dna.outfit.outerwear = 'hooded_poncho';
  else if (/\bapron\b/.test(t)) dna.outfit.outerwear = 'apron_artisan';

  if (/\bsleeveless\b/.test(t)) dna.outfit.sleeveStyle = 'sleeveless';
  else if (/\brolled\s*(cuff|sleeves?)\b/.test(t)) dna.outfit.sleeveStyle = 'rolled_cuff';
  else if (/\bbell\s*sleeves?\b/.test(t)) dna.outfit.sleeveStyle = 'bell_wide';
  else if (/\bpuffed\s*sleeves?\b/.test(t)) dna.outfit.sleeveStyle = 'puffed_royal';

  if (/\bkamarband\b/.test(t)) dna.outfit.waistStyle = 'royal_kamarband';
  else if (/\butility\s*(belt|pouches)\b/.test(t)) dna.outfit.waistStyle = 'utility_pouches';
  else if (/\bobi\s*sash\b/.test(t)) dna.outfit.waistStyle = 'obi_sash';
  else if (/\bchain\s*belt\b/.test(t)) dna.outfit.waistStyle = 'chain_belt';
  else if (/\bbandolier\b/.test(t)) dna.outfit.waistStyle = 'ammo_bandolier';
  else if (/\bchampion\s*belt\b/.test(t)) dna.outfit.waistStyle = 'champion_belt';
  else if (/\bbuckle\s*belt|leather\s*belt\b/.test(t)) dna.outfit.waistStyle = 'leather_buckle';

  if (/\bfingerless\s*gloves?\b/.test(t)) dna.outfit.gloves = 'fingerless_biker';
  else if (/\bgauntlets?\b/.test(t)) dna.outfit.gloves = 'steel_gauntlets';
  else if (/\bopera\s*gloves?\b/.test(t)) dna.outfit.gloves = 'silk_opera_gloves';
  else if (/\bboxing\s*wraps?\b/.test(t)) dna.outfit.gloves = 'boxing_wraps';
  else if (/\bwrapped\s*bandages|hand\s*bandages?\b/.test(t)) dna.outfit.gloves = 'wrapped_bandages';
  else if (/\bcyber\s*hands?\b/.test(t)) dna.outfit.gloves = 'cyber_hands';
  else if (/\bgold\s*bangles?\b/.test(t)) dna.outfit.gloves = 'gold_bangles_stack';
  else if (/\bgloves?\b/.test(t)) dna.outfit.gloves = 'leather_gloves';

  if (/\bcombat\s*boots?\b/.test(t)) dna.outfit.footwear = 'combat_boots';
  else if (/\bsneakers?\b/.test(t)) dna.outfit.footwear = 'sneakers_high';
  else if (/\bmojari\b/.test(t)) dna.outfit.footwear = 'royal_mojari';
  else if (/\bsabatons?\b/.test(t)) dna.outfit.footwear = 'armored_sabatons';
  else if (/\bcyber\s*greaves?\b/.test(t)) dna.outfit.footwear = 'cyber_greaves';
  else if (/\bheels?\b/.test(t)) dna.outfit.footwear = 'heels_classic';
  else if (/\btabi\b/.test(t)) dna.outfit.footwear = 'tabi_ninja';
  else if (/\bsandals?\b/.test(t)) dna.outfit.footwear = 'sandals_strappy';
  else if (/\bbarefoot\b/.test(t)) dna.outfit.footwear = 'barefoot';
  else if (/\bboots?\b/.test(t)) dna.outfit.footwear = 'leather_boots';

  // Wave 7 5-Slot Accessories
  const acc: Partial<CharacterAccessoriesSpec> = { ...(dna.accessories || {}) };
  let accDirty = false;
  if (/\baviator|sunglasses|shades\b/.test(t)) { acc.eyewear = /\bheart\b/.test(t) ? 'heart_shades' : 'aviator_shades'; accDirty = true; }
  else if (/\bmonocle\b/.test(t)) { acc.eyewear = 'monocle_brass'; accDirty = true; }
  else if (/\bgoggles\b/.test(t)) { acc.eyewear = 'steampunk_goggles'; accDirty = true; }
  else if (/\bholo[\s-]?visor|cyber\s*visor\b/.test(t)) { acc.eyewear = 'cyber_holo_visor'; accDirty = true; }
  else if (/\btactical\s*hud\b/.test(t)) { acc.eyewear = 'tactical_hud'; accDirty = true; }
  else if (/\bcat[\s-]?eye\b/.test(t)) { acc.eyewear = 'cat_eye_chic'; accDirty = true; }
  else if (/\bblindfold\b/.test(t)) { acc.eyewear = 'blindfold_mystic'; accDirty = true; }
  else if (/\beye\s*patch\b/.test(t)) { acc.eyewear = 'pirate_eyepatch'; accDirty = true; }
  else if (/\bglasses|spectacles\b/.test(t)) { acc.eyewear = /\brectangular|square\b/.test(t) ? 'rectangular_modern' : 'round_scholar'; accDirty = true; }

  if (/\bjhumkas?\b/.test(t)) { acc.earJewelry = 'royal_jhumkas'; accDirty = true; }
  else if (/\bhoop\s*earrings?\b/.test(t)) { acc.earJewelry = 'hoop_earrings'; accDirty = true; }
  else if (/\bnose\s*ring|nath\b/.test(t)) { acc.earJewelry = 'nose_ring_nath'; accDirty = true; }
  else if (/\bcomms?\s*earpiece|earpiece\b/.test(t)) { acc.earJewelry = 'cyber_comms_earpiece'; accDirty = true; }
  else if (/\bear\s*cuffs?\b/.test(t)) { acc.earJewelry = 'elf_ear_cuffs'; accDirty = true; }
  else if (/\bearrings?|studs?\b/.test(t)) { acc.earJewelry = 'gold_studs'; accDirty = true; }

  if (/\bstethoscope\b/.test(t)) { acc.neckwear = 'stethoscope_drape'; accDirty = true; }
  else if (/\bbow\s*tie\b/.test(t)) { acc.neckwear = 'bow_tie'; accDirty = true; }
  else if (/\bnecktie|tie\b/.test(t)) { acc.neckwear = 'tie_necktie'; accDirty = true; }
  else if (/\bchoker\b/.test(t)) { acc.neckwear = 'choker_velvet'; accDirty = true; }
  else if (/\bdog\s*tags?\b/.test(t)) { acc.neckwear = 'dog_tags'; accDirty = true; }
  else if (/\bpearl\b/.test(t)) { acc.neckwear = 'pearl_strand'; accDirty = true; }
  else if (/\bamulet\b/.test(t)) { acc.neckwear = 'crystal_amulet_chain'; accDirty = true; }
  else if (/\blocket|pendant\b/.test(t)) { acc.neckwear = 'locket_pendant'; accDirty = true; }

  if (/\bsmartwatch\b/.test(t)) { acc.wristwear = 'smartwatch'; accDirty = true; }
  else if (/\bkadas?\b/.test(t)) { acc.wristwear = 'gold_kadas'; accDirty = true; }
  else if (/\bbracers?\b/.test(t)) { acc.wristwear = 'leather_bracers'; accDirty = true; }
  else if (/\bspiked\s*cuffs?\b/.test(t)) { acc.wristwear = 'spiked_cuffs'; accDirty = true; }
  else if (/\bwristpad\b/.test(t)) { acc.wristwear = 'holo_wristpad'; accDirty = true; }

  if (/\bbackpack\b/.test(t)) { acc.backGear = 'adventure_backpack'; accDirty = true; }
  else if (/\bquiver\b/.test(t)) { acc.backGear = 'archer_quiver'; accDirty = true; }
  else if (/\bkatanas?\b/.test(t)) { acc.backGear = 'crossed_katanas'; accDirty = true; }
  else if (/\bguitar\b/.test(t)) { acc.backGear = 'electric_guitar_sling'; accDirty = true; }
  else if (/\bjetpack\b/.test(t)) { acc.backGear = 'jetpack_twin'; accDirty = true; }
  else if (/\bscroll\s*cylinder\b/.test(t)) { acc.backGear = 'scroll_cylinder'; accDirty = true; }
  else if (/\bshield\b/.test(t)) { acc.backGear = 'shield_slung'; accDirty = true; }
  else if (/\boxygen\s*tanks?\b/.test(t)) { acc.backGear = 'oxygen_tanks'; accDirty = true; }
  else if (/\bsatchel\b/.test(t)) { acc.backGear = 'plush_satchel'; accDirty = true; }

  if (accDirty) {
    dna.accessories = { ...DEFAULT_ACCESSORIES, ...acc };
  }
}

/**
 * Pure deterministic natural-language trait parser — maps descriptive phrases
 * (e.g. "glasses, nose scar, leather jacket, backpack, vampire fangs, sleeve tattoo")
 * into a validated CharacterDNA genome without any LLM call or Math.random().
 */
export function parseNaturalLanguageDnaTraits(
  traitsText: string,
  baseDna?: CharacterDNA
): CharacterDNA {
  const working: CharacterDNA = baseDna ? structuredClone(baseDna) : createBaseDna('humanoid');
  applyNaturalTraitHints(working, traitsText);
  return validateAndNormalizeDna(working) || working;
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
  const fmRaw = (obj.faceMorph && typeof obj.faceMorph === 'object' ? obj.faceMorph : null) as Record<string, unknown> | null;
  const accRaw = (obj.accessories && typeof obj.accessories === 'object' ? obj.accessories : obj) as Record<string, unknown>;

  const primary = cleanHex(pRaw.primary ?? fallbackMember?.primaryColor, base.palette.primary);
  const secondary = cleanHex(pRaw.secondary, darkenHexSimple(primary, 0.56));
  const accent = cleanHex(pRaw.accent ?? fallbackMember?.accentColor, base.palette.accent);
  const skin = cleanHex(pRaw.skin ?? fallbackMember?.skinColor, base.palette.skin);
  const hair = cleanHex(pRaw.hair, base.palette.hair);
  const eye = cleanHex(pRaw.eye, base.palette.eye);
  const patternTint = cleanHex(pRaw.patternTint, accent);

  const eyeSecondaryVal = pRaw.eyeSecondary ?? base.palette.eyeSecondary;
  const lipVal = pRaw.lip ?? base.palette.lip;
  const browVal = pRaw.brow ?? base.palette.brow;
  const markTintVal = pRaw.markTint ?? base.palette.markTint;

  const extraArmsNum = Number(aRaw.extraArms);

  // Optional Wave 7 head fields (only populated when set or non-default)
  const eyebrowStyle = hRaw.eyebrowStyle !== undefined || base.head.eyebrowStyle
    ? normEnum(hRaw.eyebrowStyle, VALID_EYEBROWS, base.head.eyebrowStyle || 'natural_arch')
    : undefined;
  const pupilStyle = hRaw.pupilStyle !== undefined || base.head.pupilStyle
    ? normEnum(hRaw.pupilStyle, VALID_PUPILS, base.head.pupilStyle || 'round')
    : undefined;
  const eyelashStyle = hRaw.eyelashStyle !== undefined || base.head.eyelashStyle
    ? normEnum(hRaw.eyelashStyle, VALID_EYELASHES, base.head.eyelashStyle || 'none')
    : undefined;
  const mouthStyle = hRaw.mouthStyle !== undefined || base.head.mouthStyle
    ? normEnum(hRaw.mouthStyle, VALID_MOUTHS, base.head.mouthStyle || 'classic')
    : undefined;
  const secondaryFaceMark = hRaw.secondaryFaceMark !== undefined || base.head.secondaryFaceMark
    ? normEnum(hRaw.secondaryFaceMark, VALID_FACE_MARKS, base.head.secondaryFaceMark || 'none')
    : undefined;
  const blushIntensity = hRaw.blushIntensity !== undefined || base.head.blushIntensity !== undefined
    ? clampNum(hRaw.blushIntensity, 0, 1, base.head.blushIntensity ?? 0)
    : undefined;

  // Optional Wave 7 outfit sub-layers
  const outerwear = oRaw.outerwear !== undefined || base.outfit.outerwear
    ? normEnum(oRaw.outerwear, VALID_OUTERWEAR, base.outfit.outerwear || 'none')
    : undefined;
  const sleeveStyle = oRaw.sleeveStyle !== undefined || base.outfit.sleeveStyle
    ? normEnum(oRaw.sleeveStyle, VALID_SLEEVES, base.outfit.sleeveStyle || 'auto')
    : undefined;
  const waistStyle = oRaw.waistStyle !== undefined || base.outfit.waistStyle
    ? normEnum(oRaw.waistStyle, VALID_WAISTS, base.outfit.waistStyle || 'none')
    : undefined;
  const gloves = oRaw.gloves !== undefined || base.outfit.gloves
    ? normEnum(oRaw.gloves, VALID_GLOVES, base.outfit.gloves || 'none')
    : undefined;
  const footwear = oRaw.footwear !== undefined || base.outfit.footwear
    ? normEnum(oRaw.footwear, VALID_FOOTWEAR, base.outfit.footwear || 'auto')
    : undefined;

  // Optional Wave 7 faceMorph (strictly clamped)
  let faceMorph: CharacterFaceMorph | undefined;
  if (fmRaw || base.faceMorph) {
    const src = fmRaw || (base.faceMorph as Record<string, unknown>);
    faceMorph = {
      jawWidth: clampNum(src.jawWidth, 0.72, 1.32, DEFAULT_FACE_MORPH.jawWidth),
      chinLength: clampNum(src.chinLength, 0.75, 1.3, DEFAULT_FACE_MORPH.chinLength),
      cheekboneWidth: clampNum(src.cheekboneWidth, 0.75, 1.3, DEFAULT_FACE_MORPH.cheekboneWidth),
      eyeSize: clampNum(src.eyeSize, 0.75, 1.35, DEFAULT_FACE_MORPH.eyeSize),
      eyeSpacing: clampNum(src.eyeSpacing, 0.78, 1.28, DEFAULT_FACE_MORPH.eyeSpacing),
      eyeTilt: clampNum(src.eyeTilt, -0.35, 0.35, DEFAULT_FACE_MORPH.eyeTilt),
      browHeight: clampNum(src.browHeight, -0.3, 0.3, DEFAULT_FACE_MORPH.browHeight),
      browThickness: clampNum(src.browThickness, 0.65, 1.55, DEFAULT_FACE_MORPH.browThickness),
      noseScale: clampNum(src.noseScale, 0.7, 1.35, DEFAULT_FACE_MORPH.noseScale),
      mouthWidth: clampNum(src.mouthWidth, 0.75, 1.3, DEFAULT_FACE_MORPH.mouthWidth),
      earScale: clampNum(src.earScale, 0.7, 1.4, DEFAULT_FACE_MORPH.earScale),
      neckLength: clampNum(src.neckLength, 0.75, 1.3, DEFAULT_FACE_MORPH.neckLength),
    };
  }

  // Optional Wave 7 bodyMarks (validated, deduped, excludes 'none', capped at 3)
  let bodyMarks: BodyMarkId[] | undefined;
  const rawBm = obj.bodyMarks ?? base.bodyMarks;
  if (Array.isArray(rawBm) || typeof rawBm === 'string') {
    const list = Array.isArray(rawBm) ? rawBm : rawBm.split(',');
    const deduped: BodyMarkId[] = [];
    for (const item of list) {
      const bm = normEnum(item, VALID_BODY_MARKS, 'none');
      if (bm !== 'none' && !deduped.includes(bm)) {
        deduped.push(bm);
        if (deduped.length >= 3) break;
      }
    }
    if (deduped.length > 0 || Array.isArray(obj.bodyMarks)) {
      bodyMarks = deduped;
    }
  }

  // Optional Wave 7 5-slot accessories
  const hasExplicitAcc =
    (obj.accessories && typeof obj.accessories === 'object') ||
    base.accessories ||
    obj.eyewear !== undefined ||
    obj.earJewelry !== undefined ||
    obj.neckwear !== undefined ||
    obj.wristwear !== undefined ||
    obj.backGear !== undefined;

  let accessories: CharacterAccessoriesSpec | undefined;
  if (hasExplicitAcc) {
    accessories = {
      eyewear: normEnum(accRaw.eyewear, VALID_EYEWEAR, base.accessories?.eyewear || 'none'),
      earJewelry: normEnum(accRaw.earJewelry, VALID_EAR_JEWELRY, base.accessories?.earJewelry || 'none'),
      neckwear: normEnum(accRaw.neckwear, VALID_NECKWEAR, base.accessories?.neckwear || 'none'),
      wristwear: normEnum(accRaw.wristwear, VALID_WRISTWEAR, base.accessories?.wristwear || 'none'),
      backGear: normEnum(accRaw.backGear, VALID_BACK_GEAR, base.accessories?.backGear || 'none'),
    };
  }

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
      ...(eyebrowStyle ? { eyebrowStyle } : {}),
      ...(pupilStyle ? { pupilStyle } : {}),
      ...(eyelashStyle ? { eyelashStyle } : {}),
      ...(mouthStyle ? { mouthStyle } : {}),
      ...(secondaryFaceMark ? { secondaryFaceMark } : {}),
      ...(blushIntensity !== undefined ? { blushIntensity } : {}),
    },
    outfit: {
      topStyle: normEnum(oRaw.topStyle, VALID_TOP_STYLES, base.outfit.topStyle),
      bottomStyle: normEnum(oRaw.bottomStyle, VALID_BOTTOM_STYLES, base.outfit.bottomStyle),
      collarAccessory: normEnum(oRaw.collarAccessory, VALID_COLLARS, base.outfit.collarAccessory),
      capeStyle: normEnum(oRaw.capeStyle, VALID_CAPES, base.outfit.capeStyle),
      headwear: normEnum(oRaw.headwear, VALID_HEADWEAR, base.outfit.headwear),
      surfacePattern: normEnum(oRaw.surfacePattern ?? oRaw.pattern, VALID_PATTERNS, base.outfit.surfacePattern),
      ...(outerwear ? { outerwear } : {}),
      ...(sleeveStyle ? { sleeveStyle } : {}),
      ...(waistStyle ? { waistStyle } : {}),
      ...(gloves ? { gloves } : {}),
      ...(footwear ? { footwear } : {}),
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
      ...(typeof eyeSecondaryVal === 'string' && HEX_RE.test(eyeSecondaryVal.trim())
        ? { eyeSecondary: cleanHex(eyeSecondaryVal, eye) }
        : {}),
      ...(typeof lipVal === 'string' && HEX_RE.test(lipVal.trim())
        ? { lip: cleanHex(lipVal, '#b85d63') }
        : {}),
      ...(typeof browVal === 'string' && HEX_RE.test(browVal.trim())
        ? { brow: cleanHex(browVal, hair) }
        : {}),
      ...(typeof markTintVal === 'string' && HEX_RE.test(markTintVal.trim())
        ? { markTint: cleanHex(markTintVal, accent) }
        : {}),
    },
    ...(faceMorph ? { faceMorph } : {}),
    ...(bodyMarks ? { bodyMarks } : {}),
    ...(accessories ? { accessories } : {}),
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
  const acc = resolveAccessories(dna);
  const fm = resolveFaceMorph(dna);
  const bms = resolveBodyMarks(dna);
  const faceMorphSignature = Number(
    (
      Math.abs(fm.jawWidth - 1) +
      Math.abs(fm.chinLength - 1) +
      Math.abs(fm.cheekboneWidth - 1) +
      Math.abs(fm.eyeSize - 1) +
      Math.abs(fm.eyeSpacing - 1) +
      Math.abs(fm.eyeTilt) * 2 +
      Math.abs(fm.browHeight) * 2 +
      Math.abs(fm.browThickness - 1) +
      Math.abs(fm.noseScale - 1) +
      Math.abs(fm.mouthWidth - 1) +
      Math.abs(fm.earScale - 1) +
      Math.abs(fm.neckLength - 1)
    ).toFixed(3)
  );
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
    eyebrowStyle: dna.head.eyebrowStyle || 'natural_arch',
    pupilStyle: dna.head.pupilStyle || 'round',
    mouthStyle: dna.head.mouthStyle || 'classic',
    faceMark: dna.head.faceMark,
    secondaryFaceMark: dna.head.secondaryFaceMark || 'none',
    bodyMarksKey: [...bms].sort().join(','),
    outerwear: dna.outfit.outerwear || 'none',
    waistStyle: dna.outfit.waistStyle || 'none',
    gloves: dna.outfit.gloves || 'none',
    footwear: dna.outfit.footwear || 'auto',
    eyewear: acc.eyewear,
    earJewelry: acc.earJewelry,
    neckwear: acc.neckwear,
    wristwear: acc.wristwear,
    backGear: acc.backGear,
    faceMorphSignature,
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

  // Wave 7 granular feature differentiation (only contributes when at least one side sets a non-default trait so legacy distances stay stable!)
  const addOptCat = <T,>(va: T | undefined, vb: T | undefined, neutral: T, weight: number) => {
    const na = va ?? neutral;
    const nb = vb ?? neutral;
    if (na === neutral && nb === neutral) return;
    addCat(na === nb, weight);
  };
  addOptCat(a.outerwear, b.outerwear, 'none' as OuterwearStyleId, 1.15);
  addOptCat(a.eyewear, b.eyewear, 'none' as EyewearStyleId, 0.95);
  addOptCat(a.backGear, b.backGear, 'none' as BackGearStyleId, 1.1);
  addOptCat(a.faceMark, b.faceMark, 'none' as FaceMarkId, 0.65);
  addOptCat(a.secondaryFaceMark, b.secondaryFaceMark, 'none' as FaceMarkId, 0.5);
  addOptCat(a.bodyMarksKey, b.bodyMarksKey, '', 0.8);
  addOptCat(a.eyebrowStyle, b.eyebrowStyle, 'natural_arch' as EyebrowStyleId, 0.45);
  addOptCat(a.pupilStyle, b.pupilStyle, 'round' as PupilStyleId, 0.55);
  addOptCat(a.mouthStyle, b.mouthStyle, 'classic' as MouthStyleId, 0.55);
  addOptCat(a.waistStyle, b.waistStyle, 'none' as WaistStyleId, 0.55);
  addOptCat(a.gloves, b.gloves, 'none' as GloveStyleId, 0.45);
  addOptCat(a.footwear, b.footwear, 'auto' as FootwearStyleId, 0.5);
  addOptCat(a.earJewelry, b.earJewelry, 'none' as EarJewelryId, 0.4);
  addOptCat(a.neckwear, b.neckwear, 'none' as NeckwearStyleId, 0.5);
  addOptCat(a.wristwear, b.wristwear, 'none' as WristwearStyleId, 0.35);
  if ((a.faceMorphSignature ?? 0) > 0.01 || (b.faceMorphSignature ?? 0) > 0.01) {
    addNum(a.faceMorphSignature ?? 0, b.faceMorphSignature ?? 0, 1.8, 0.65);
  }

  addNum(a.height, b.height, 0.35, 1.1);
  addNum(a.shoulderWidth, b.shoulderWidth, 0.45, 1.0);
  addNum(a.torsoBulk, b.torsoBulk, 0.42, 0.9);

  // Palette contributes moderately (so palette swap alone NEVER tricks the twin detector!)
  totalWeight += 1.4;
  diff += colorDistance(a.primaryHex, b.primaryHex) * 0.9 + colorDistance(a.skinHex, b.skinHex) * 0.5;

  return Number(Math.max(0, Math.min(1, diff / Math.max(1, totalWeight))).toFixed(3));
}

/** Direct deterministic distance helper between two CharacterDNA objects (0..1). */
export function computeDnaDistance(a: CharacterDNA, b: CharacterDNA): number {
  const stubA: CastMember = {
    id: 'dna_a',
    name: 'A',
    archetype: 'warrior',
    primaryColor: a.palette.primary,
    accentColor: a.palette.accent,
    skinColor: a.palette.skin,
    dna: a,
  };
  const stubB: CastMember = {
    id: 'dna_b',
    name: 'B',
    archetype: 'warrior',
    primaryColor: b.palette.primary,
    accentColor: b.palette.accent,
    skinColor: b.palette.skin,
    dna: b,
  };
  return computeSilhouetteDistance(computeDnaFingerprint(stubA), computeDnaFingerprint(stubB));
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

/**
 * Wave 7 Deterministic Focused Sub-Randomizer — Face, Eyes, Brows, Mouth, Marks & Sculpt Morphs.
 * Zero Math.random(): bit-exact function of (dna, seed).
 */
export function randomizeDnaFace(dna: CharacterDNA, seed: number): CharacterDNA {
  const s = Math.abs(Math.floor(seed)) || 701;
  const next: CharacterDNA = structuredClone(dna);
  if (next.chassis === 'humanoid' || next.chassis === 'ethereal') {
    next.head.headShape = seededPick(HUMAN_HEADS, s, 1);
    next.head.hairStyle = seededPick(HAIR_STYLE_CATALOG, s, 2).id;
    next.head.facialHair = s % 3 === 0 ? seededPick(FACIAL_HAIR_CATALOG, s, 3).id : 'none';
  }
  next.head.eyeStyle = seededPick(EYE_STYLE_CATALOG, s, 4).id;
  next.head.noseStyle = seededPick(NOSE_STYLE_CATALOG, s, 5).id;
  next.head.eyebrowStyle = seededPick(EYEBROW_STYLE_CATALOG, s, 6).id;
  next.head.pupilStyle = seededPick(PUPIL_STYLE_CATALOG, s, 7).id;
  next.head.eyelashStyle = seededPick(EYELASH_STYLE_CATALOG, s, 8).id;
  next.head.mouthStyle = seededPick(MOUTH_STYLE_CATALOG, s, 9).id;
  next.head.faceMark = s % 2 === 0 ? seededPick(FACE_MARK_CATALOG, s, 10).id : 'none';
  next.head.secondaryFaceMark = s % 4 === 0 ? seededPick(FACE_MARK_CATALOG, s, 11).id : 'none';
  next.head.blushIntensity = s % 3 === 0 ? seededRange(s, 12, 0.15, 0.55) : 0;
  next.faceMorph = {
    jawWidth: seededRange(s, 20, 0.84, 1.18),
    chinLength: seededRange(s, 21, 0.85, 1.18),
    cheekboneWidth: seededRange(s, 22, 0.86, 1.18),
    eyeSize: seededRange(s, 23, 0.86, 1.2),
    eyeSpacing: seededRange(s, 24, 0.88, 1.16),
    eyeTilt: seededRange(s, 25, -0.2, 0.2),
    browHeight: seededRange(s, 26, -0.18, 0.18),
    browThickness: seededRange(s, 27, 0.8, 1.35),
    noseScale: seededRange(s, 28, 0.84, 1.2),
    mouthWidth: seededRange(s, 29, 0.86, 1.18),
    earScale: seededRange(s, 30, 0.85, 1.2),
    neckLength: seededRange(s, 31, 0.86, 1.16),
  };
  return next;
}

/**
 * Wave 7 Deterministic Focused Sub-Randomizer — Layered Clothing (Top, Outerwear, Sleeves, Waist, Gloves, Footwear, Pattern).
 */
export function randomizeDnaOutfit(dna: CharacterDNA, seed: number): CharacterDNA {
  const s = Math.abs(Math.floor(seed)) || 809;
  const next: CharacterDNA = structuredClone(dna);
  next.outfit.topStyle = seededPick(TOP_STYLE_CATALOG, s, 1).id;
  next.outfit.bottomStyle = seededPick(BOTTOM_STYLE_CATALOG, s, 2).id;
  next.outfit.outerwear = s % 4 === 0 ? 'none' : seededPick(OUTERWEAR_CATALOG, s, 3).id;
  next.outfit.sleeveStyle = seededPick(SLEEVE_CATALOG, s, 4).id;
  next.outfit.waistStyle = s % 3 === 0 ? 'none' : seededPick(WAIST_CATALOG, s, 5).id;
  next.outfit.gloves = s % 3 === 0 ? 'none' : seededPick(GLOVE_CATALOG, s, 6).id;
  next.outfit.footwear = seededPick(FOOTWEAR_CATALOG, s, 7).id;
  next.outfit.capeStyle = s % 3 === 0 ? seededPick(CAPE_CATALOG, s, 8).id : 'none';
  next.outfit.collarAccessory = s % 3 === 0 ? seededPick(COLLAR_CATALOG, s, 9).id : 'none';
  next.outfit.surfacePattern = seededPick(SURFACE_PATTERN_CATALOG, s, 10).id;
  return next;
}

/**
 * Wave 7 Deterministic Focused Sub-Randomizer — 5 Combinable Accessories + Body Marks.
 */
export function randomizeDnaAccessories(dna: CharacterDNA, seed: number): CharacterDNA {
  const s = Math.abs(Math.floor(seed)) || 911;
  const next: CharacterDNA = structuredClone(dna);
  next.accessories = {
    eyewear: s % 3 === 0 ? 'none' : seededPick(EYEWEAR_CATALOG, s, 1).id,
    earJewelry: s % 3 === 1 ? 'none' : seededPick(EAR_JEWELRY_CATALOG, s, 2).id,
    neckwear: s % 3 === 2 ? 'none' : seededPick(NECKWEAR_CATALOG, s, 3).id,
    wristwear: s % 2 === 0 ? seededPick(WRISTWEAR_CATALOG, s, 4).id : 'none',
    backGear: s % 4 === 0 ? 'none' : seededPick(BACK_GEAR_CATALOG, s, 5).id,
  };
  const bm1 = seededPick(BODY_MARK_CATALOG, s, 6).id;
  const bm2 = seededPick(BODY_MARK_CATALOG, s, 7).id;
  const marks: BodyMarkId[] = [];
  if (bm1 !== 'none') marks.push(bm1);
  if (bm2 !== 'none' && bm2 !== bm1 && s % 2 === 0) marks.push(bm2);
  next.bodyMarks = marks;
  return next;
}
