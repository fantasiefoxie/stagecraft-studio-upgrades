/**
 * Stagecraft Studio — Wave 3 Curated 32-Sprite CharacterDNA Preset Gallery
 *
 * Provides 32 hand-tuned, immediately recognizable CharacterDNA sprite presets
 * spanning 6 genres (`Modern & Explainer`, `Sci-Fi & Cyber`, `Fantasy & RPG`,
 * `Folklore & History`, `Noir & Mystery`, `Creatures & Mascots`) ready for
 * 1-click loading in EntityWorkshopModal or 1-click beat spawning in WorkbenchAssetsTab.
 */

import { CharacterDNA, createBaseDna } from './characterDna';
import type { ArchetypeId, CastMember } from './types';

export type SpritePresetCategory =
  | 'Modern & Explainer'
  | 'Sci-Fi & Cyber'
  | 'Fantasy & RPG'
  | 'Folklore & History'
  | 'Noir & Mystery'
  | 'Creatures & Mascots';

export const SPRITE_PRESET_CATEGORIES: SpritePresetCategory[] = [
  'Modern & Explainer',
  'Sci-Fi & Cyber',
  'Fantasy & RPG',
  'Folklore & History',
  'Noir & Mystery',
  'Creatures & Mascots',
];

export interface SpriteWorkshopPreset {
  id: string;
  name: string;
  role: string;
  category: SpritePresetCategory;
  archetype: ArchetypeId;
  voicePreset: string;
  tagline: string;
  dna: CharacterDNA;
}

export const SPRITE_WORKSHOP_PRESETS: SpriteWorkshopPreset[] = [
  // ===================== 1. MODERN & EXPLAINER (6) =====================
  {
    id: 'preset_senior_detective',
    name: 'Inspector Marlowe',
    role: 'Lead Investigator',
    category: 'Modern & Explainer',
    archetype: 'detective',
    voicePreset: 'hero_baritone',
    tagline: 'Pinstripe trench coat & fedora',
    dna: createBaseDna('humanoid', {
      morph: { height: 1.04, shoulderWidth: 1.08, torsoBulk: 1.0, gait: 'folk' },
      head: { headShape: 'chiseled', hairStyle: 'short_crop', facialHair: 'short_trimmed' },
      outfit: { topStyle: 'trench_coat', bottomStyle: 'trousers', collarAccessory: 'scarf_muffler', headwear: 'fedora', surfacePattern: 'pinstripe' },
      palette: { primary: '#524b44', secondary: '#2f2a26', accent: '#d9a441', skin: '#e0a984', hair: '#1e1b18', eye: '#f8fafc', patternTint: '#94897d' },
    }),
  },
  {
    id: 'preset_lab_scientist',
    name: 'Dr. Ananya Rao',
    role: 'Chief Physicist',
    category: 'Modern & Explainer',
    archetype: 'scientist',
    voicePreset: 'warm_narrator',
    tagline: 'Crisp lab coat & kinetic wild hair',
    dna: createBaseDna('humanoid', {
      morph: { height: 0.98, shoulderWidth: 0.94, torsoBulk: 0.92, gait: 'folk' },
      head: { headShape: 'oval', eyeStyle: 'wide_fable', hairStyle: 'topknot_bun' },
      outfit: { topStyle: 'lab_coat', bottomStyle: 'trousers', headwear: 'none', surfacePattern: 'solid' },
      palette: { primary: '#e2e8f0', secondary: '#94a3b8', accent: '#06b6d4', skin: '#c9885b', hair: '#111827', eye: '#f8fafc', patternTint: '#22d3ee' },
    }),
  },
  {
    id: 'preset_broadcast_anchor',
    name: 'Maya Vance',
    role: 'News Anchor',
    category: 'Modern & Explainer',
    archetype: 'journalist',
    voicePreset: 'queen_alto',
    tagline: 'Broadcast blazer & poised posture',
    dna: createBaseDna('humanoid', {
      morph: { height: 1.0, shoulderWidth: 0.96, torsoBulk: 0.92, gait: 'regal' },
      head: { headShape: 'oval', hairStyle: 'swept_royal' },
      outfit: { topStyle: 'trench_coat', bottomStyle: 'trousers', collarAccessory: 'gold_necklace', surfacePattern: 'pinstripe' },
      palette: { primary: '#1e3a8a', secondary: '#172554', accent: '#f43f5e', skin: '#d89b72', hair: '#18181b', eye: '#f8fafc', patternTint: '#60a5fa' },
    }),
  },
  {
    id: 'preset_indie_musician',
    name: 'Rico Pulse',
    role: 'Street Guitarist',
    category: 'Modern & Explainer',
    archetype: 'street_musician',
    voicePreset: 'trickster_tenor',
    tagline: 'Vibrant cyber-bomber & bandana',
    dna: createBaseDna('humanoid', {
      morph: { height: 0.98, shoulderWidth: 0.98, gait: 'agile' },
      head: { headShape: 'round', hairStyle: 'dreadlocks', facialHair: 'goatee' },
      outfit: { topStyle: 'cyber_jacket', bottomStyle: 'trousers', collarAccessory: 'scarf_muffler', headwear: 'bandana' },
      palette: { primary: '#db2777', secondary: '#831843', accent: '#facc15', skin: '#b37148', hair: '#18181b', eye: '#f8fafc', patternTint: '#f472b6' },
    }),
  },
  {
    id: 'preset_explainer_host',
    name: 'Prof. Julian Reid',
    role: 'Documentary Host',
    category: 'Modern & Explainer',
    archetype: 'journalist',
    voicePreset: 'warm_narrator',
    tagline: 'Editorial presenter for video essays',
    dna: createBaseDna('humanoid', {
      morph: { height: 1.02, shoulderWidth: 1.02, gait: 'folk' },
      head: { headShape: 'chiseled', hairStyle: 'short_crop', facialHair: 'short_trimmed' },
      outfit: { topStyle: 'scholar_robe', bottomStyle: 'trousers', collarAccessory: 'scarf_muffler', surfacePattern: 'pinstripe' },
      palette: { primary: '#0f766e', secondary: '#134e4a', accent: '#f59e0b', skin: '#e8b48e', hair: '#334155', eye: '#f8fafc', patternTint: '#2dd4bf' },
    }),
  },
  {
    id: 'preset_bookshop_curator',
    name: 'Clara Verne',
    role: 'Rare Book Archivist',
    category: 'Modern & Explainer',
    archetype: 'scientist',
    voicePreset: 'queen_alto',
    tagline: 'Warm tweed coat & braided twin hair',
    dna: createBaseDna('humanoid', {
      morph: { height: 0.96, shoulderWidth: 0.9, gait: 'folk' },
      head: { headShape: 'oval', hairStyle: 'braided_twin', faceMark: 'freckles' },
      outfit: { topStyle: 'lab_coat', bottomStyle: 'flowing_skirt', collarAccessory: 'scarf_muffler', surfacePattern: 'pinstripe' },
      palette: { primary: '#92400e', secondary: '#451a03', accent: '#fde68a', skin: '#f0bfa0', hair: '#7c2d12', eye: '#f8fafc', patternTint: '#d97706' },
    }),
  },

  // ===================== 2. SCI-FI & CYBER (6) =====================
  {
    id: 'preset_orbital_astronaut',
    name: 'Cmdr. Elena Solis',
    role: 'Orbital Mission Lead',
    category: 'Sci-Fi & Cyber',
    archetype: 'astronaut',
    voicePreset: 'queen_alto',
    tagline: 'EVA space suit & bubble glass helmet',
    dna: createBaseDna('humanoid', {
      morph: { height: 1.06, shoulderWidth: 1.2, torsoBulk: 1.14, gait: 'heavy' },
      head: { headShape: 'oval', hairStyle: 'short_crop' },
      outfit: { topStyle: 'space_suit', bottomStyle: 'armored_greaves', headwear: 'astronaut_helmet', surfacePattern: 'starfield_speckle' },
      palette: { primary: '#f1f5f9', secondary: '#475569', accent: '#f97316', skin: '#d89b72', hair: '#1e293b', eye: '#f8fafc', patternTint: '#38bdf8' },
    }),
  },
  {
    id: 'preset_neon_hacker',
    name: 'Zero-Bit',
    role: 'Netrunner Hacker',
    category: 'Sci-Fi & Cyber',
    archetype: 'cyber_hacker',
    voicePreset: 'trickster_tenor',
    tagline: 'Glowing cyan visor & circuit jacket',
    dna: createBaseDna('humanoid', {
      morph: { height: 0.98, shoulderWidth: 0.96, torsoBulk: 0.9, gait: 'agile' },
      head: { headShape: 'angular', eyeStyle: 'narrow_sharp', hairStyle: 'wild_spiky' },
      outfit: { topStyle: 'cyber_jacket', bottomStyle: 'trousers', headwear: 'cyber_visor', surfacePattern: 'circuit_trace' },
      palette: { primary: '#1e1b4b', secondary: '#0f172a', accent: '#00f0ff', skin: '#deb08e', hair: '#ff2bd6', eye: '#00f0ff', patternTint: '#ff2bd6' },
    }),
  },
  {
    id: 'preset_android_envoy',
    name: 'Unit AURA-9',
    role: 'Synthetic Diplomat',
    category: 'Sci-Fi & Cyber',
    archetype: 'android',
    voicePreset: 'warm_narrator',
    tagline: 'Porcelain alloy chassis & glowing eyes',
    dna: createBaseDna('humanoid', {
      morph: { height: 1.05, shoulderWidth: 1.06, gait: 'regal' },
      head: { headShape: 'angular', eyeStyle: 'glowing_orb', hairStyle: 'swept_royal' },
      outfit: { topStyle: 'cyber_jacket', bottomStyle: 'armored_greaves', surfacePattern: 'circuit_trace' },
      appendages: { aura: 'lunar_crescent' },
      palette: { primary: '#334155', secondary: '#0f172a', accent: '#22d3ee', skin: '#dbeafe', hair: '#94a3b8', eye: '#22d3ee', patternTint: '#38bdf8' },
    }),
  },
  {
    id: 'preset_mech_pilot',
    name: 'Kai Striker',
    role: 'Valkyrie Mech Pilot',
    category: 'Sci-Fi & Cyber',
    archetype: 'mech_pilot',
    voicePreset: 'hero_baritone',
    tagline: 'Hex-camo flight suit & tactical visor',
    dna: createBaseDna('humanoid', {
      morph: { height: 1.06, shoulderWidth: 1.18, torsoBulk: 1.12, gait: 'martial' },
      head: { headShape: 'chiseled', hairStyle: 'short_crop', faceMark: 'cheek_scar' },
      outfit: { topStyle: 'space_suit', bottomStyle: 'armored_greaves', headwear: 'cyber_visor', surfacePattern: 'camo_hex' },
      palette: { primary: '#991b1b', secondary: '#450a0a', accent: '#facc15', skin: '#e2a882', hair: '#0f172a', eye: '#f8fafc', patternTint: '#f87171' },
    }),
  },
  {
    id: 'preset_starship_captain',
    name: 'Capt. Orion Vale',
    role: 'Bridge Commander',
    category: 'Sci-Fi & Cyber',
    archetype: 'astronaut',
    voicePreset: 'hero_baritone',
    tagline: 'Starfleet cloak & cosmic gold insignia',
    dna: createBaseDna('humanoid', {
      morph: { height: 1.08, shoulderWidth: 1.14, gait: 'regal' },
      head: { headShape: 'chiseled', hairStyle: 'swept_royal', facialHair: 'short_trimmed' },
      outfit: { topStyle: 'cyber_jacket', bottomStyle: 'trousers', capeStyle: 'royal_cape', surfacePattern: 'starfield_speckle' },
      palette: { primary: '#0f172a', secondary: '#020617', accent: '#38bdf8', skin: '#c68b59', hair: '#e2e8f0', eye: '#f8fafc', patternTint: '#7dd3fc' },
    }),
  },
  {
    id: 'preset_holo_scout_bot',
    name: 'BEEP-7',
    role: 'Hologram Recon Bot',
    category: 'Sci-Fi & Cyber',
    archetype: 'robot_companion',
    voicePreset: 'child_bright',
    tagline: 'Compact neon drone chassis',
    dna: createBaseDna('humanoid', {
      morph: { height: 0.82, shoulderWidth: 1.04, headRatio: 1.25, gait: 'ethereal' },
      head: { headShape: 'round', eyeStyle: 'glowing_orb', ears: 'none', hairStyle: 'none' },
      outfit: { topStyle: 'space_suit', bottomStyle: 'armored_greaves', headwear: 'cyber_visor', surfacePattern: 'circuit_trace' },
      palette: { primary: '#0284c7', secondary: '#0c4a6e', accent: '#34d399', skin: '#e0f2fe', hair: '#0284c7', eye: '#34d399', patternTint: '#7dd3fc' },
    }),
  },

  // ===================== 3. FANTASY & RPG (6) =====================
  {
    id: 'preset_arcane_archmage',
    name: 'Archmage Aldric',
    role: 'Keeper of Starlight',
    category: 'Fantasy & RPG',
    archetype: 'wizard',
    voicePreset: 'wise_elder',
    tagline: 'Pointed hat, starfield robe & long beard',
    dna: createBaseDna('humanoid', {
      morph: { height: 1.04, shoulderWidth: 0.96, gait: 'ethereal' },
      head: { headShape: 'gaunt', eyeStyle: 'glowing_orb', hairStyle: 'long_flowing', facialHair: 'sage_long_beard' },
      outfit: { topStyle: 'scholar_robe', bottomStyle: 'robe_hem', capeStyle: 'royal_cape', headwear: 'wizard_hat', surfacePattern: 'starfield_speckle' },
      appendages: { aura: 'lunar_crescent' },
      palette: { primary: '#312e81', secondary: '#1e1b4b', accent: '#facc15', skin: '#e8bc9c', hair: '#f1f5f9', eye: '#38bdf8', patternTint: '#fde047' },
    }),
  },
  {
    id: 'preset_elven_ranger',
    name: 'Sylvara Windbow',
    role: 'Sylvan Archer',
    category: 'Fantasy & RPG',
    archetype: 'elf_archer',
    voicePreset: 'queen_alto',
    tagline: 'Pointed ears, laurel crown & forest cloak',
    dna: createBaseDna('humanoid', {
      morph: { height: 1.04, shoulderWidth: 0.9, torsoBulk: 0.86, gait: 'agile' },
      head: { headShape: 'oval', ears: 'pointed_elf', hairStyle: 'long_flowing' },
      outfit: { topStyle: 'peasant_tunic', bottomStyle: 'trousers', capeStyle: 'tattered_cloak', headwear: 'laurel_wreath', surfacePattern: 'bark_grain' },
      palette: { primary: '#15803d', secondary: '#14532d', accent: '#fde047', skin: '#f3d0b5', hair: '#fef08a', eye: '#4ade80', patternTint: '#86efac' },
    }),
  },
  {
    id: 'preset_forge_dwarf',
    name: 'Thrain Ironanvil',
    role: 'Master Runesmith',
    category: 'Fantasy & RPG',
    archetype: 'dwarf_smith',
    voicePreset: 'hero_baritone',
    tagline: 'Stocky titan build, braided flame beard',
    dna: createBaseDna('humanoid', {
      morph: { height: 0.8, shoulderWidth: 1.34, torsoBulk: 1.32, gait: 'heavy' },
      head: { headShape: 'broad_jaw', hairStyle: 'braided_twin', facialHair: 'sage_long_beard' },
      outfit: { topStyle: 'plate_armor', bottomStyle: 'armored_greaves', collarAccessory: 'fur_mantle', surfacePattern: 'stone_cracks' },
      palette: { primary: '#78350f', secondary: '#451a03', accent: '#f59e0b', skin: '#dda278', hair: '#b45309', eye: '#f8fafc', patternTint: '#fbbf24' },
    }),
  },
  {
    id: 'preset_crimson_dragonkin',
    name: 'Ignis Scaleborn',
    role: 'Draconic Paladin',
    category: 'Fantasy & RPG',
    archetype: 'dragon_kin',
    voicePreset: 'villain_bass',
    tagline: 'Dragon wings, scales & ember aura',
    dna: createBaseDna('humanoid', {
      morph: { height: 1.16, shoulderWidth: 1.28, torsoBulk: 1.18, gait: 'martial' },
      head: { headShape: 'angular', eyeStyle: 'slit_reptile', horns: 'demon_crown_horns' },
      outfit: { topStyle: 'plate_armor', bottomStyle: 'armored_greaves', surfacePattern: 'serpent_scales' },
      appendages: { wings: 'dragon_leathery', tail: 'dragon_spiked', aura: 'ember_sparks' },
      palette: { primary: '#991b1b', secondary: '#450a0a', accent: '#fbbf24', skin: '#b91c1c', hair: '#450a0a', eye: '#facc15', patternTint: '#f97316' },
    }),
  },
  {
    id: 'preset_shadow_shinobi',
    name: 'Kage Mist',
    role: 'Shadow Shinobi',
    category: 'Fantasy & RPG',
    archetype: 'ninja',
    voicePreset: 'trickster_tenor',
    tagline: 'Cowl silhouette, crimson headband & hex gear',
    dna: createBaseDna('humanoid', {
      morph: { height: 0.98, shoulderWidth: 1.0, torsoBulk: 0.88, gait: 'agile' },
      head: { headShape: 'angular', eyeStyle: 'narrow_sharp', hairStyle: 'hooded_cowl' },
      outfit: { topStyle: 'mystic_vest', bottomStyle: 'trousers', headwear: 'bandana', surfacePattern: 'camo_hex' },
      palette: { primary: '#18181b', secondary: '#09090b', accent: '#ef4444', skin: '#e5b28c', hair: '#09090b', eye: '#f8fafc', patternTint: '#3f3f46' },
    }),
  },
  {
    id: 'preset_vampire_count',
    name: 'Lord Valerius',
    role: 'Nocturne Sovereign',
    category: 'Fantasy & RPG',
    archetype: 'vampire_lord',
    voicePreset: 'villain_bass',
    tagline: 'High velvet cloak, bat wings & crimson eyes',
    dna: createBaseDna('humanoid', {
      morph: { height: 1.12, shoulderWidth: 1.06, torsoBulk: 0.88, gait: 'regal' },
      head: { headShape: 'gaunt', eyeStyle: 'glowing_orb', ears: 'pointed_elf', hairStyle: 'swept_royal' },
      outfit: { topStyle: 'trench_coat', bottomStyle: 'trousers', capeStyle: 'royal_cape', surfacePattern: 'pinstripe' },
      appendages: { wings: 'bat_demon', aura: 'shadow_wisps' },
      palette: { primary: '#1f1226', secondary: '#0b060f', accent: '#e11d48', skin: '#e2e8f0', hair: '#09090b', eye: '#f43f5e', patternTint: '#881337' },
    }),
  },

  // ===================== 4. FOLKLORE & HISTORY (5) =====================
  {
    id: 'preset_golden_pharaoh',
    name: 'Pharaoh Khepri',
    role: 'Solar Monarch',
    category: 'Folklore & History',
    archetype: 'pharaoh',
    voicePreset: 'hero_baritone',
    tagline: 'Lapis & gold brocade with solar halo',
    dna: createBaseDna('humanoid', {
      morph: { height: 1.08, shoulderWidth: 1.12, gait: 'regal' },
      head: { headShape: 'chiseled', facialHair: 'goatee' },
      outfit: { topStyle: 'royal_angarkha', bottomStyle: 'dhoti', collarAccessory: 'gold_necklace', headwear: 'golden_mukut', surfacePattern: 'royal_brocade' },
      appendages: { aura: 'solar_halo' },
      palette: { primary: '#1d4ed8', secondary: '#1e3a8a', accent: '#facc15', skin: '#c9885b', hair: '#09090b', eye: '#f8fafc', patternTint: '#fde047' },
    }),
  },
  {
    id: 'preset_nordic_jarl',
    name: 'Jarl Bjorn Frost',
    role: 'Fjord Warlord',
    category: 'Folklore & History',
    archetype: 'viking',
    voicePreset: 'villain_bass',
    tagline: 'Horned helm, fur mantle & storm beard',
    dna: createBaseDna('humanoid', {
      morph: { height: 1.16, shoulderWidth: 1.3, torsoBulk: 1.24, gait: 'heavy' },
      head: { headShape: 'broad_jaw', horns: 'bull_horns', facialHair: 'sage_long_beard', faceMark: 'war_paint' },
      outfit: { topStyle: 'plate_armor', bottomStyle: 'armored_greaves', collarAccessory: 'fur_mantle', capeStyle: 'royal_cape', headwear: 'battle_helm' },
      palette: { primary: '#334155', secondary: '#1e293b', accent: '#38bdf8', skin: '#ecc2a0', hair: '#d97706', eye: '#bae6fd', patternTint: '#94a3b8' },
    }),
  },
  {
    id: 'preset_corsair_captain',
    name: 'Capt. Morgana Red',
    role: 'Galleon Corsair',
    category: 'Folklore & History',
    archetype: 'pirate_captain',
    voicePreset: 'queen_alto',
    tagline: 'Tricorn hat, eye patch & crimson coat',
    dna: createBaseDna('humanoid', {
      morph: { height: 1.04, shoulderWidth: 1.08, gait: 'martial' },
      head: { headShape: 'chiseled', hairStyle: 'dreadlocks', faceMark: 'eye_patch' },
      outfit: { topStyle: 'trench_coat', bottomStyle: 'trousers', capeStyle: 'royal_cape', headwear: 'tricorn_hat' },
      palette: { primary: '#881337', secondary: '#4c0519', accent: '#fbbf24', skin: '#d89b72', hair: '#18181b', eye: '#f8fafc', patternTint: '#f59e0b' },
    }),
  },
  {
    id: 'preset_samurai_ronin',
    name: 'Takeshi Blade',
    role: 'Wandering Ronin',
    category: 'Folklore & History',
    archetype: 'samurai',
    voicePreset: 'hero_baritone',
    tagline: 'Crescent kabuto & crimson O-Yoroi',
    dna: createBaseDna('humanoid', {
      morph: { height: 1.06, shoulderWidth: 1.16, gait: 'martial' },
      head: { headShape: 'angular', eyeStyle: 'narrow_sharp', hairStyle: 'topknot_bun', facialHair: 'goatee' },
      outfit: { topStyle: 'samurai_cuirass', bottomStyle: 'armored_greaves', collarAccessory: 'pauldron_plates', headwear: 'kabuto_crest' },
      palette: { primary: '#991b1b', secondary: '#1f2937', accent: '#facc15', skin: '#e8ba96', hair: '#09090b', eye: '#f8fafc', patternTint: '#f59e0b' },
    }),
  },
  {
    id: 'preset_sun_sovereign',
    name: 'Raja Suryadev',
    role: 'Solar Chronicle King',
    category: 'Folklore & History',
    archetype: 'king',
    voicePreset: 'hero_baritone',
    tagline: 'Imperial gold brocade & radiant halo',
    dna: createBaseDna('humanoid', {
      morph: { height: 1.08, shoulderWidth: 1.16, gait: 'regal' },
      head: { headShape: 'chiseled', facialHair: 'royal_mustache', faceMark: 'vermilion_tilak' },
      outfit: { topStyle: 'royal_angarkha', bottomStyle: 'dhoti', collarAccessory: 'gold_necklace', capeStyle: 'royal_cape', headwear: 'golden_mukut', surfacePattern: 'royal_brocade' },
      appendages: { aura: 'solar_halo' },
      palette: { primary: '#b91c1c', secondary: '#7f1d1d', accent: '#facc15', skin: '#d89668', hair: '#11131a', eye: '#f8fafc', patternTint: '#fde047' },
    }),
  },

  // ===================== 5. NOIR & MYSTERY (4) =====================
  {
    id: 'preset_raincoat_gumshoe',
    name: 'Sam Shade',
    role: 'Midnight Gumshoe',
    category: 'Noir & Mystery',
    archetype: 'detective',
    voicePreset: 'villain_bass',
    tagline: 'High-contrast silver monochrome noir',
    dna: createBaseDna('humanoid', {
      morph: { height: 1.06, shoulderWidth: 1.1, gait: 'folk' },
      head: { headShape: 'angular', faceMark: 'cheek_scar', hairStyle: 'short_crop' },
      outfit: { topStyle: 'trench_coat', bottomStyle: 'trousers', headwear: 'fedora', surfacePattern: 'pinstripe' },
      palette: { primary: '#334155', secondary: '#0f172a', accent: '#e2e8f0', skin: '#cbd5e1', hair: '#09090b', eye: '#f8fafc', patternTint: '#94a3b8' },
    }),
  },
  {
    id: 'preset_midnight_informant',
    name: 'Vesper Silk',
    role: 'Velvet Informant',
    category: 'Noir & Mystery',
    archetype: 'journalist',
    voicePreset: 'queen_alto',
    tagline: 'Fedora, scarlet scarf & emerald eyes',
    dna: createBaseDna('humanoid', {
      morph: { height: 1.0, shoulderWidth: 0.9, torsoBulk: 0.86, gait: 'regal' },
      head: { headShape: 'oval', hairStyle: 'long_flowing' },
      outfit: { topStyle: 'trench_coat', bottomStyle: 'flowing_skirt', collarAccessory: 'scarf_muffler', headwear: 'fedora' },
      palette: { primary: '#1e1b2e', secondary: '#0b0a14', accent: '#f43f5e', skin: '#ecd0bc', hair: '#09090b', eye: '#34d399', patternTint: '#fb7185' },
    }),
  },
  {
    id: 'preset_spectral_phantom',
    name: 'The Clocktower Wraith',
    role: 'Haunting Apparition',
    category: 'Noir & Mystery',
    archetype: 'ghost_phantom',
    voicePreset: 'spirit_eerie',
    tagline: 'Floating spectral cowl & pale wisp tail',
    dna: createBaseDna('ethereal', {
      morph: { height: 1.08, shoulderWidth: 0.94, torsoBulk: 0.84, gait: 'ethereal' },
      head: { headShape: 'gaunt', eyeStyle: 'glowing_orb', hairStyle: 'hooded_cowl' },
      outfit: { topStyle: 'mystic_vest', bottomStyle: 'ethereal_wisp', capeStyle: 'tattered_cloak', surfacePattern: 'starfield_speckle' },
      appendages: { aura: 'shadow_wisps' },
      palette: { primary: '#312e81', secondary: '#1e1b4b', accent: '#67e8f9', skin: '#e0f2fe', hair: '#1e1b4b', eye: '#67e8f9', patternTint: '#a5f3fc' },
    }),
  },
  {
    id: 'preset_masquerade_duchess',
    name: 'Duchess Nocturne',
    role: 'Gala Mastermind',
    category: 'Noir & Mystery',
    archetype: 'queen',
    voicePreset: 'queen_alto',
    tagline: 'Velvet gown, tiara & orbiting petals',
    dna: createBaseDna('humanoid', {
      morph: { height: 1.02, shoulderWidth: 0.88, gait: 'regal' },
      head: { headShape: 'oval', hairStyle: 'topknot_bun', faceMark: 'maang_tikka' },
      outfit: { topStyle: 'saree_drape', bottomStyle: 'flowing_skirt', capeStyle: 'flowing_dupatta', headwear: 'floral_tiara', surfacePattern: 'royal_brocade' },
      appendages: { aura: 'petal_orbit' },
      palette: { primary: '#4c1d95', secondary: '#2e1065', accent: '#f9a8d4', skin: '#f0c4a8', hair: '#18181b', eye: '#f8fafc', patternTint: '#e879f9' },
    }),
  },

  // ===================== 6. CREATURES & MASCOTS (5) =====================
  {
    id: 'preset_studio_cat_mascot',
    name: 'Mochi the Cat',
    role: 'Channel Mascot',
    category: 'Creatures & Mascots',
    archetype: 'cat_mascot',
    voicePreset: 'child_bright',
    tagline: 'Ginger tabby mascot with scarf & bushy tail',
    dna: createBaseDna('humanoid', {
      morph: { height: 0.84, shoulderWidth: 0.94, headRatio: 1.24, gait: 'agile' },
      head: { headShape: 'feline_muzzle', eyeStyle: 'wide_fable', ears: 'fox_tall', facialHair: 'whiskers' },
      outfit: { topStyle: 'peasant_tunic', bottomStyle: 'trousers', collarAccessory: 'scarf_muffler', surfacePattern: 'tiger_stripes' },
      appendages: { tail: 'fox_bushy' },
      palette: { primary: '#f97316', secondary: '#9a3412', accent: '#38bdf8', skin: '#fff7ed', hair: '#ea580c', eye: '#22c55e', patternTint: '#9a3412' },
    }),
  },
  {
    id: 'preset_buddy_bot',
    name: 'Pixel-Bot',
    role: 'Sidekick Helper',
    category: 'Creatures & Mascots',
    archetype: 'robot_companion',
    voicePreset: 'child_bright',
    tagline: 'Friendly teal explainer buddy robot',
    dna: createBaseDna('humanoid', {
      morph: { height: 0.82, shoulderWidth: 1.06, headRatio: 1.26, gait: 'ethereal' },
      head: { headShape: 'round', eyeStyle: 'glowing_orb', ears: 'none', hairStyle: 'none' },
      outfit: { topStyle: 'space_suit', bottomStyle: 'armored_greaves', headwear: 'cyber_visor', surfacePattern: 'circuit_trace' },
      palette: { primary: '#14b8a6', secondary: '#0f766e', accent: '#facc15', skin: '#f0fdfa', hair: '#14b8a6', eye: '#facc15', patternTint: '#99f6e4' },
    }),
  },
  {
    id: 'preset_kitsune_trickster',
    name: 'Kitsune Ember',
    role: 'Mystic Fox Spirit',
    category: 'Creatures & Mascots',
    archetype: 'fox',
    voicePreset: 'trickster_tenor',
    tagline: 'Autumn fox quadruped with ember sparks',
    dna: createBaseDna('quadruped', {
      morph: { height: 0.96, shoulderWidth: 1.02, gait: 'predator' },
      head: { headShape: 'canine_snout', eyeStyle: 'narrow_sharp', ears: 'fox_tall', facialHair: 'whiskers' },
      outfit: { topStyle: 'none_fur', bottomStyle: 'animal_legs', collarAccessory: 'scarf_muffler' },
      appendages: { tail: 'fox_bushy', aura: 'ember_sparks' },
      palette: { primary: '#ea580c', secondary: '#7c2d12', accent: '#fef3c7', skin: '#fdba74', hair: '#9a3412', eye: '#facc15', patternTint: '#fff7ed' },
    }),
  },
  {
    id: 'preset_celestial_owl',
    name: 'Archivist Owl',
    role: 'Nocturnal Scholar',
    category: 'Creatures & Mascots',
    archetype: 'owl',
    voicePreset: 'wise_elder',
    tagline: 'Feathered owl with wizard hat & lunar aura',
    dna: createBaseDna('avian', {
      morph: { height: 0.94, shoulderWidth: 1.08, gait: 'agile' },
      head: { headShape: 'raptor_beak', eyeStyle: 'owl_disc', hairStyle: 'feather_crest' },
      outfit: { topStyle: 'none_fur', bottomStyle: 'animal_legs', headwear: 'wizard_hat', surfacePattern: 'feather_layers' },
      appendages: { wings: 'feathered_angel', aura: 'lunar_crescent' },
      palette: { primary: '#78716c', secondary: '#44403c', accent: '#facc15', skin: '#e7e5e4', hair: '#57534e', eye: '#facc15', patternTint: '#d6d3d1' },
    }),
  },
  {
    id: 'preset_thunder_wolf',
    name: 'Fenrir Gale',
    role: 'Arctic Pack Alpha',
    category: 'Creatures & Mascots',
    archetype: 'wolf',
    voicePreset: 'villain_bass',
    tagline: 'Silver-blue wolf with horned crest & aurora glow',
    dna: createBaseDna('quadruped', {
      morph: { height: 1.08, shoulderWidth: 1.2, torsoBulk: 1.14, gait: 'predator' },
      head: { headShape: 'canine_snout', eyeStyle: 'glowing_orb', ears: 'fox_tall', facialHair: 'whiskers' },
      outfit: { topStyle: 'none_fur', bottomStyle: 'animal_legs', surfacePattern: 'starfield_speckle' },
      appendages: { tail: 'fox_bushy', aura: 'lunar_crescent' },
      palette: { primary: '#475569', secondary: '#1e293b', accent: '#38bdf8', skin: '#cbd5e1', hair: '#334155', eye: '#38bdf8', patternTint: '#bae6fd' },
    }),
  },
];

/**
 * Converts a SpriteWorkshopPreset into a ready-to-stage CastMember.
 */
export function buildCastMemberFromSpritePreset(
  preset: SpriteWorkshopPreset,
  existingCastCount: number
): CastMember {
  return {
    id: `sprite_${preset.id}_${existingCastCount + 1}`,
    name: preset.name,
    archetype: preset.archetype,
    primaryColor: preset.dna.palette.primary,
    accentColor: preset.dna.palette.accent,
    skinColor: preset.dna.palette.skin,
    dna: structuredClone(preset.dna),
  };
}
