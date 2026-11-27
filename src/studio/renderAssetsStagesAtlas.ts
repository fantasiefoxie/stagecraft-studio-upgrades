/**
 * Stagecraft Studio — Wave 5 Universal Stages & Environments Atlas (+100 Stages)
 *
 * Uses a 5-Plane Compositional Stage Composer:
 *   Plane 1: Sky / Vault / Ceiling Structure
 *   Plane 2: Far Horizon / Skyline / Mountain / Wall Backdrop
 *   Plane 3: Midground Iconic Architecture & Landmarks
 *   Plane 4: Grounded Floor / Surface / Pitch / Water / Road
 *   Plane 5: Ambient Environmental Details & Deterministic Micro-Motion
 *
 * Covers all 100 Wave 5 StageIds across 10 environmental families.
 * Strictly deterministic: zero Math.random(), zero offscreen canvas allocations.
 */
import { StageId } from './types';
import type { MoodPalette } from './renderAssets';
const snap24 = (t: number): number => Math.floor(t * 24) / 24;

type PlaneSky =
  | 'open_sky'
  | 'vault_arch'
  | 'dome_glass'
  | 'industrial_truss'
  | 'cozy_ceiling'
  | 'space_window'
  | 'cavern_roof'
  | 'tent_canopy'
  | 'underwater_caustics'
  | 'cyber_ceiling';

type PlaneHorizon =
  | 'mountains'
  | 'city_skyline'
  | 'ruins_ridge'
  | 'forest_canopy'
  | 'desert_dunes'
  | 'ocean_horizon'
  | 'space_nebula'
  | 'interior_wall'
  | 'stadium_stands'
  | 'canyon_buttes'
  | 'glacier_peaks'
  | 'floating_isles';

type PlaneLandmark =
  | 'hanging_gardens'
  | 'step_pyramid'
  | 'stonehenge'
  | 'great_wall'
  | 'jungle_temple'
  | 'canyon_facade'
  | 'spartan_cliffs'
  | 'persian_arches'
  | 'gurukul_hut'
  | 'monastery_tiers'
  | 'saloon_front'
  | 'victorian_lamps'
  | 'renaissance_dome'
  | 'castle_keep'
  | 'tavern_hearth'
  | 'jazz_stage'
  | 'caravanserai_arch'
  | 'viking_longship'
  | 'dojo_shoji'
  | 'foundry_vats'
  | 'rooftop_watertower'
  | 'subway_pillars'
  | 'crosswalk_billboards'
  | 'suburban_houses'
  | 'arcade_cabinets'
  | 'airport_jetbridge'
  | 'highway_overpass'
  | 'shipping_cranes'
  | 'helipad_beacon'
  | 'park_fountain'
  | 'startup_screens'
  | 'stock_ticker_wall'
  | 'operating_lamp'
  | 'lecture_chalkboard'
  | 'classroom_desks'
  | 'podcast_acoustic'
  | 'kitchen_hoods'
  | 'cleanroom_pods'
  | 'precinct_glass'
  | 'library_stacks'
  | 'penthouse_window'
  | 'livingroom_hearth'
  | 'attic_gears'
  | 'gallery_frames'
  | 'opera_curtains'
  | 'bakery_display'
  | 'greenhouse_arches'
  | 'dino_skeleton'
  | 'boxing_ring'
  | 'diner_jukebox'
  | 'station_ring'
  | 'alien_glowtrees'
  | 'dyson_rings'
  | 'cyber_escalators'
  | 'mech_gantry'
  | 'vr_monoliths'
  | 'ruined_overpass'
  | 'bunker_blastdoor'
  | 'solarpunk_towers'
  | 'collider_torus'
  | 'sky_citadel'
  | 'wizard_orbs'
  | 'dragon_gold_mound'
  | 'elven_treecity'
  | 'dwarven_anvil'
  | 'giant_mushrooms'
  | 'prism_crystals'
  | 'apothecary_shelves'
  | 'fairy_bridge'
  | 'cloud_pillars'
  | 'manor_staircase'
  | 'graveyard_iron'
  | 'asylum_corridor'
  | 'storm_lighthouse'
  | 'catacomb_arches'
  | 'noir_blinds'
  | 'bank_vault_wheel'
  | 'london_pier'
  | 'cursed_tent'
  | 'cellblock_bars'
  | 'coral_garden'
  | 'rainforest_vines'
  | 'iceberg_floes'
  | 'savanna_acacias'
  | 'canyon_gorge'
  | 'jurassic_ferns'
  | 'sahara_oasis'
  | 'alpine_chalet'
  | 'sea_cave_glow'
  | 'maple_bridge'
  | 'cricket_floodlights'
  | 'soccer_goal_stands'
  | 'paddock_garages'
  | 'cruise_railing'
  | 'hot_air_balloons'
  | 'treehouse_deck'
  | 'giant_toyblocks'
  | 'circus_ring'
  | 'ferris_wheel'
  | 'candy_canes';

type PlaneFloor =
  | 'stone_flag'
  | 'marble_tile'
  | 'wood_planks'
  | 'asphalt_road'
  | 'grass_pitch'
  | 'water_reflect'
  | 'metal_deck'
  | 'sand_earth'
  | 'snow_ice'
  | 'neon_grid'
  | 'carpet_plush'
  | 'cloud_bank';

interface StageBlueprint {
  sky: PlaneSky;
  horizon: PlaneHorizon;
  landmark: PlaneLandmark;
  floor: PlaneFloor;
  accentTint: string;
  secondaryTint: string;
  indoor?: boolean;
}

export const ATLAS_STAGE_BLUEPRINTS: Partial<Record<StageId, StageBlueprint>> = {
  // 1. Ancient & Sacred World (10)
  babylon_hanging_gardens: { sky: 'open_sky', horizon: 'desert_dunes', landmark: 'hanging_gardens', floor: 'stone_flag', accentTint: '#22c55e', secondaryTint: '#d97706' },
  mayan_step_pyramid: { sky: 'open_sky', horizon: 'forest_canopy', landmark: 'step_pyramid', floor: 'stone_flag', accentTint: '#f59e0b', secondaryTint: '#15803d' },
  stonehenge_circle: { sky: 'open_sky', horizon: 'mountains', landmark: 'stonehenge', floor: 'grass_pitch', accentTint: '#94a3b8', secondaryTint: '#38bdf8' },
  great_wall_watchtower: { sky: 'open_sky', horizon: 'mountains', landmark: 'great_wall', floor: 'stone_flag', accentTint: '#f97316', secondaryTint: '#94a3b8' },
  angkor_jungle_ruins: { sky: 'open_sky', horizon: 'forest_canopy', landmark: 'jungle_temple', floor: 'stone_flag', accentTint: '#16a34a', secondaryTint: '#a16207' },
  petra_canyon_temple: { sky: 'open_sky', horizon: 'canyon_buttes', landmark: 'canyon_facade', floor: 'sand_earth', accentTint: '#ea580c', secondaryTint: '#9a3412' },
  spartan_mountain_pass: { sky: 'open_sky', horizon: 'mountains', landmark: 'spartan_cliffs', floor: 'sand_earth', accentTint: '#dc2626', secondaryTint: '#78716c' },
  persian_rose_palace: { sky: 'vault_arch', horizon: 'interior_wall', landmark: 'persian_arches', floor: 'marble_tile', accentTint: '#f43f5e', secondaryTint: '#0284c7', indoor: true },
  vedic_gurukul: { sky: 'open_sky', horizon: 'forest_canopy', landmark: 'gurukul_hut', floor: 'sand_earth', accentTint: '#f59e0b', secondaryTint: '#15803d' },
  tibetan_monastery: { sky: 'open_sky', horizon: 'glacier_peaks', landmark: 'monastery_tiers', floor: 'snow_ice', accentTint: '#dc2626', secondaryTint: '#facc15' },

  // 2. Historical Towns & Eras (10)
  wild_west_saloon: { sky: 'open_sky', horizon: 'desert_dunes', landmark: 'saloon_front', floor: 'sand_earth', accentTint: '#d97706', secondaryTint: '#78350f' },
  victorian_fog_alley: { sky: 'open_sky', horizon: 'city_skyline', landmark: 'victorian_lamps', floor: 'stone_flag', accentTint: '#f59e0b', secondaryTint: '#475569' },
  renaissance_plaza: { sky: 'open_sky', horizon: 'city_skyline', landmark: 'renaissance_dome', floor: 'stone_flag', accentTint: '#ea580c', secondaryTint: '#facc15' },
  medieval_castle_keep: { sky: 'open_sky', horizon: 'mountains', landmark: 'castle_keep', floor: 'stone_flag', accentTint: '#ef4444', secondaryTint: '#64748b' },
  medieval_tavern_inn: { sky: 'cozy_ceiling', horizon: 'interior_wall', landmark: 'tavern_hearth', floor: 'wood_planks', accentTint: '#f97316', secondaryTint: '#78350f', indoor: true },
  roaring_twenties_jazz: { sky: 'vault_arch', horizon: 'interior_wall', landmark: 'jazz_stage', floor: 'marble_tile', accentTint: '#facc15', secondaryTint: '#7e22ce', indoor: true },
  ancient_silk_caravanserai: { sky: 'open_sky', horizon: 'desert_dunes', landmark: 'caravanserai_arch', floor: 'sand_earth', accentTint: '#f59e0b', secondaryTint: '#0ea5e9' },
  viking_longship_fjord: { sky: 'open_sky', horizon: 'glacier_peaks', landmark: 'viking_longship', floor: 'water_reflect', accentTint: '#dc2626', secondaryTint: '#38bdf8' },
  feudal_dojo_hall: { sky: 'cozy_ceiling', horizon: 'interior_wall', landmark: 'dojo_shoji', floor: 'wood_planks', accentTint: '#fef3c7', secondaryTint: '#b91c1c', indoor: true },
  industrial_foundry: { sky: 'industrial_truss', horizon: 'interior_wall', landmark: 'foundry_vats', floor: 'metal_deck', accentTint: '#f97316', secondaryTint: '#475569', indoor: true },

  // 3. Modern City & Street (10)
  downtown_skyline_roof: { sky: 'open_sky', horizon: 'city_skyline', landmark: 'rooftop_watertower', floor: 'asphalt_road', accentTint: '#38bdf8', secondaryTint: '#f43f5e' },
  subway_metro_platform: { sky: 'industrial_truss', horizon: 'interior_wall', landmark: 'subway_pillars', floor: 'stone_flag', accentTint: '#facc15', secondaryTint: '#38bdf8', indoor: true },
  busy_crosswalk_plaza: { sky: 'open_sky', horizon: 'city_skyline', landmark: 'crosswalk_billboards', floor: 'asphalt_road', accentTint: '#ff2bd6', secondaryTint: '#00f0ff' },
  suburban_cul_de_sac: { sky: 'open_sky', horizon: 'forest_canopy', landmark: 'suburban_houses', floor: 'asphalt_road', accentTint: '#22c55e', secondaryTint: '#f59e0b' },
  neon_arcade_hall: { sky: 'cyber_ceiling', horizon: 'interior_wall', landmark: 'arcade_cabinets', floor: 'neon_grid', accentTint: '#ec4899', secondaryTint: '#22d3ee', indoor: true },
  airport_departure_gate: { sky: 'dome_glass', horizon: 'city_skyline', landmark: 'airport_jetbridge', floor: 'marble_tile', accentTint: '#38bdf8', secondaryTint: '#94a3b8', indoor: true },
  highway_overpass_night: { sky: 'open_sky', horizon: 'city_skyline', landmark: 'highway_overpass', floor: 'asphalt_road', accentTint: '#fb923c', secondaryTint: '#38bdf8' },
  harbor_container_dock: { sky: 'open_sky', horizon: 'ocean_horizon', landmark: 'shipping_cranes', floor: 'asphalt_road', accentTint: '#ef4444', secondaryTint: '#0284c7' },
  rooftop_helipad: { sky: 'open_sky', horizon: 'city_skyline', landmark: 'helipad_beacon', floor: 'asphalt_road', accentTint: '#facc15', secondaryTint: '#38bdf8' },
  public_park_fountain: { sky: 'open_sky', horizon: 'city_skyline', landmark: 'park_fountain', floor: 'stone_flag', accentTint: '#38bdf8', secondaryTint: '#22c55e' },

  // 4. Workplaces, Civic & Media (10)
  startup_war_room: { sky: 'cozy_ceiling', horizon: 'interior_wall', landmark: 'startup_screens', floor: 'wood_planks', accentTint: '#38bdf8', secondaryTint: '#a855f7', indoor: true },
  stock_exchange_floor: { sky: 'industrial_truss', horizon: 'interior_wall', landmark: 'stock_ticker_wall', floor: 'marble_tile', accentTint: '#22c55e', secondaryTint: '#ef4444', indoor: true },
  hospital_operating_room: { sky: 'cozy_ceiling', horizon: 'interior_wall', landmark: 'operating_lamp', floor: 'marble_tile', accentTint: '#38bdf8', secondaryTint: '#e2e8f0', indoor: true },
  university_lecture_hall: { sky: 'cozy_ceiling', horizon: 'interior_wall', landmark: 'lecture_chalkboard', floor: 'wood_planks', accentTint: '#15803d', secondaryTint: '#d97706', indoor: true },
  elementary_classroom: { sky: 'cozy_ceiling', horizon: 'interior_wall', landmark: 'classroom_desks', floor: 'wood_planks', accentTint: '#facc15', secondaryTint: '#38bdf8', indoor: true },
  podcast_recording_booth: { sky: 'cozy_ceiling', horizon: 'interior_wall', landmark: 'podcast_acoustic', floor: 'carpet_plush', accentTint: '#a855f7', secondaryTint: '#ec4899', indoor: true },
  restaurant_open_kitchen: { sky: 'industrial_truss', horizon: 'interior_wall', landmark: 'kitchen_hoods', floor: 'marble_tile', accentTint: '#f97316', secondaryTint: '#cbd5e1', indoor: true },
  science_cleanroom: { sky: 'cyber_ceiling', horizon: 'interior_wall', landmark: 'cleanroom_pods', floor: 'marble_tile', accentTint: '#22d3ee', secondaryTint: '#e2e8f0', indoor: true },
  police_precinct_desk: { sky: 'cozy_ceiling', horizon: 'interior_wall', landmark: 'precinct_glass', floor: 'stone_flag', accentTint: '#3b82f6', secondaryTint: '#f59e0b', indoor: true },
  city_library_atrium: { sky: 'vault_arch', horizon: 'interior_wall', landmark: 'library_stacks', floor: 'wood_planks', accentTint: '#f59e0b', secondaryTint: '#78350f', indoor: true },

  // 5. Interiors & Cozy Spaces (10)
  luxury_penthouse_lounge: { sky: 'cozy_ceiling', horizon: 'city_skyline', landmark: 'penthouse_window', floor: 'marble_tile', accentTint: '#facc15', secondaryTint: '#38bdf8', indoor: true },
  warm_family_livingroom: { sky: 'cozy_ceiling', horizon: 'interior_wall', landmark: 'livingroom_hearth', floor: 'carpet_plush', accentTint: '#fb923c', secondaryTint: '#a16207', indoor: true },
  attic_inventor_workshop: { sky: 'cozy_ceiling', horizon: 'interior_wall', landmark: 'attic_gears', floor: 'wood_planks', accentTint: '#f59e0b', secondaryTint: '#38bdf8', indoor: true },
  art_gallery_hall: { sky: 'vault_arch', horizon: 'interior_wall', landmark: 'gallery_frames', floor: 'marble_tile', accentTint: '#f43f5e', secondaryTint: '#facc15', indoor: true },
  grand_opera_theater: { sky: 'vault_arch', horizon: 'interior_wall', landmark: 'opera_curtains', floor: 'wood_planks', accentTint: '#dc2626', secondaryTint: '#facc15', indoor: true },
  cozy_bakery_counter: { sky: 'cozy_ceiling', horizon: 'interior_wall', landmark: 'bakery_display', floor: 'wood_planks', accentTint: '#f59e0b', secondaryTint: '#f472b6', indoor: true },
  greenhouse_conservatory: { sky: 'dome_glass', horizon: 'forest_canopy', landmark: 'greenhouse_arches', floor: 'stone_flag', accentTint: '#22c55e', secondaryTint: '#38bdf8', indoor: true },
  museum_dinosaur_hall: { sky: 'vault_arch', horizon: 'interior_wall', landmark: 'dino_skeleton', floor: 'marble_tile', accentTint: '#fde68a', secondaryTint: '#94a3b8', indoor: true },
  fitness_boxing_gym: { sky: 'industrial_truss', horizon: 'interior_wall', landmark: 'boxing_ring', floor: 'wood_planks', accentTint: '#ef4444', secondaryTint: '#3b82f6', indoor: true },
  retro_diner_booth: { sky: 'cozy_ceiling', horizon: 'interior_wall', landmark: 'diner_jukebox', floor: 'marble_tile', accentTint: '#f43f5e', secondaryTint: '#22d3ee', indoor: true },

  // 6. Sci-Fi & Cyberpunk (10)
  orbital_space_station: { sky: 'space_window', horizon: 'space_nebula', landmark: 'station_ring', floor: 'metal_deck', accentTint: '#38bdf8', secondaryTint: '#a855f7', indoor: true },
  alien_bioluminescent_forest: { sky: 'open_sky', horizon: 'forest_canopy', landmark: 'alien_glowtrees', floor: 'sand_earth', accentTint: '#22d3ee', secondaryTint: '#c084fc' },
  dyson_sphere_vista: { sky: 'space_window', horizon: 'space_nebula', landmark: 'dyson_rings', floor: 'metal_deck', accentTint: '#facc15', secondaryTint: '#38bdf8' },
  cyber_megamall_atrium: { sky: 'cyber_ceiling', horizon: 'city_skyline', landmark: 'cyber_escalators', floor: 'neon_grid', accentTint: '#ff2bd6', secondaryTint: '#00f0ff', indoor: true },
  mech_hangar_bay: { sky: 'industrial_truss', horizon: 'interior_wall', landmark: 'mech_gantry', floor: 'metal_deck', accentTint: '#f59e0b', secondaryTint: '#38bdf8', indoor: true },
  vr_cyberspace_grid: { sky: 'cyber_ceiling', horizon: 'space_nebula', landmark: 'vr_monoliths', floor: 'neon_grid', accentTint: '#00f0ff', secondaryTint: '#ec4899' },
  post_apoc_ruined_highway: { sky: 'open_sky', horizon: 'ruins_ridge', landmark: 'ruined_overpass', floor: 'sand_earth', accentTint: '#ea580c', secondaryTint: '#78716c' },
  underground_fallout_bunker: { sky: 'industrial_truss', horizon: 'interior_wall', landmark: 'bunker_blastdoor', floor: 'metal_deck', accentTint: '#84cc16', secondaryTint: '#f59e0b', indoor: true },
  solarpunk_sky_garden: { sky: 'open_sky', horizon: 'city_skyline', landmark: 'solarpunk_towers', floor: 'grass_pitch', accentTint: '#4ade80', secondaryTint: '#facc15' },
  quantum_collider_chamber: { sky: 'cyber_ceiling', horizon: 'interior_wall', landmark: 'collider_torus', floor: 'metal_deck', accentTint: '#38bdf8', secondaryTint: '#c084fc', indoor: true },

  // 7. High Fantasy & Magic (10)
  floating_sky_citadel: { sky: 'open_sky', horizon: 'floating_isles', landmark: 'sky_citadel', floor: 'cloud_bank', accentTint: '#facc15', secondaryTint: '#38bdf8' },
  wizard_arcane_tower: { sky: 'vault_arch', horizon: 'interior_wall', landmark: 'wizard_orbs', floor: 'stone_flag', accentTint: '#a855f7', secondaryTint: '#38bdf8', indoor: true },
  dragon_hoard_cavern: { sky: 'cavern_roof', horizon: 'interior_wall', landmark: 'dragon_gold_mound', floor: 'stone_flag', accentTint: '#facc15', secondaryTint: '#ef4444', indoor: true },
  elven_canopy_city: { sky: 'open_sky', horizon: 'forest_canopy', landmark: 'elven_treecity', floor: 'wood_planks', accentTint: '#4ade80', secondaryTint: '#fde047' },
  dwarven_forge_hall: { sky: 'cavern_roof', horizon: 'interior_wall', landmark: 'dwarven_anvil', floor: 'stone_flag', accentTint: '#f97316', secondaryTint: '#facc15', indoor: true },
  enchanted_mushroom_grove: { sky: 'open_sky', horizon: 'forest_canopy', landmark: 'giant_mushrooms', floor: 'grass_pitch', accentTint: '#ec4899', secondaryTint: '#22d3ee' },
  crystal_prism_cave: { sky: 'cavern_roof', horizon: 'interior_wall', landmark: 'prism_crystals', floor: 'stone_flag', accentTint: '#22d3ee', secondaryTint: '#c084fc', indoor: true },
  alchemist_apothecary: { sky: 'cozy_ceiling', horizon: 'interior_wall', landmark: 'apothecary_shelves', floor: 'wood_planks', accentTint: '#4ade80', secondaryTint: '#a855f7', indoor: true },
  fairy_glade_bridge: { sky: 'open_sky', horizon: 'forest_canopy', landmark: 'fairy_bridge', floor: 'water_reflect', accentTint: '#f472b6', secondaryTint: '#34d399' },
  cloud_coliseum: { sky: 'open_sky', horizon: 'floating_isles', landmark: 'cloud_pillars', floor: 'cloud_bank', accentTint: '#fde047', secondaryTint: '#e2e8f0' },

  // 8. Horror, Mystery & Noir (10)
  haunted_manor_foyer: { sky: 'vault_arch', horizon: 'interior_wall', landmark: 'manor_staircase', floor: 'wood_planks', accentTint: '#a855f7', secondaryTint: '#f59e0b', indoor: true },
  misty_graveyard_gates: { sky: 'open_sky', horizon: 'forest_canopy', landmark: 'graveyard_iron', floor: 'stone_flag', accentTint: '#94a3b8', secondaryTint: '#38bdf8' },
  abandoned_asylum_ward: { sky: 'industrial_truss', horizon: 'interior_wall', landmark: 'asylum_corridor', floor: 'stone_flag', accentTint: '#94a3b8', secondaryTint: '#84cc16', indoor: true },
  lighthouse_storm_cliff: { sky: 'open_sky', horizon: 'ocean_horizon', landmark: 'storm_lighthouse', floor: 'stone_flag', accentTint: '#fef08a', secondaryTint: '#38bdf8' },
  underground_catacombs: { sky: 'cavern_roof', horizon: 'interior_wall', landmark: 'catacomb_arches', floor: 'stone_flag', accentTint: '#f97316', secondaryTint: '#94a3b8', indoor: true },
  detective_noir_office: { sky: 'cozy_ceiling', horizon: 'city_skyline', landmark: 'noir_blinds', floor: 'wood_planks', accentTint: '#f59e0b', secondaryTint: '#94a3b8', indoor: true },
  locked_bank_vault: { sky: 'industrial_truss', horizon: 'interior_wall', landmark: 'bank_vault_wheel', floor: 'metal_deck', accentTint: '#facc15', secondaryTint: '#94a3b8', indoor: true },
  foggy_london_pier: { sky: 'open_sky', horizon: 'ocean_horizon', landmark: 'london_pier', floor: 'wood_planks', accentTint: '#f59e0b', secondaryTint: '#64748b' },
  cursed_carnival_tent: { sky: 'tent_canopy', horizon: 'interior_wall', landmark: 'cursed_tent', floor: 'sand_earth', accentTint: '#dc2626', secondaryTint: '#a855f7', indoor: true },
  prison_cellblock: { sky: 'industrial_truss', horizon: 'interior_wall', landmark: 'cellblock_bars', floor: 'stone_flag', accentTint: '#f97316', secondaryTint: '#64748b', indoor: true },

  // 9. Nature, Biomes & Prehistoric (10)
  coral_reef_lagoon: { sky: 'underwater_caustics', horizon: 'ocean_horizon', landmark: 'coral_garden', floor: 'sand_earth', accentTint: '#f43f5e', secondaryTint: '#22d3ee' },
  amazon_rainforest_canopy: { sky: 'open_sky', horizon: 'forest_canopy', landmark: 'rainforest_vines', floor: 'grass_pitch', accentTint: '#22c55e', secondaryTint: '#facc15' },
  arctic_glacier_icebergs: { sky: 'open_sky', horizon: 'glacier_peaks', landmark: 'iceberg_floes', floor: 'snow_ice', accentTint: '#38bdf8', secondaryTint: '#e0f2fe' },
  african_sunset_savanna: { sky: 'open_sky', horizon: 'desert_dunes', landmark: 'savanna_acacias', floor: 'sand_earth', accentTint: '#f97316', secondaryTint: '#facc15' },
  grand_canyon_overlook: { sky: 'open_sky', horizon: 'canyon_buttes', landmark: 'canyon_gorge', floor: 'sand_earth', accentTint: '#ea580c', secondaryTint: '#f59e0b' },
  jurassic_fern_valley: { sky: 'open_sky', horizon: 'mountains', landmark: 'jurassic_ferns', floor: 'grass_pitch', accentTint: '#4ade80', secondaryTint: '#f97316' },
  sahara_starlit_dunes: { sky: 'open_sky', horizon: 'desert_dunes', landmark: 'sahara_oasis', floor: 'sand_earth', accentTint: '#facc15', secondaryTint: '#38bdf8' },
  alpine_meadow_lake: { sky: 'open_sky', horizon: 'glacier_peaks', landmark: 'alpine_chalet', floor: 'water_reflect', accentTint: '#22c55e', secondaryTint: '#38bdf8' },
  bioluminescent_sea_cave: { sky: 'cavern_roof', horizon: 'ocean_horizon', landmark: 'sea_cave_glow', floor: 'water_reflect', accentTint: '#22d3ee', secondaryTint: '#38bdf8', indoor: true },
  autumn_maple_river: { sky: 'open_sky', horizon: 'mountains', landmark: 'maple_bridge', floor: 'water_reflect', accentTint: '#ea580c', secondaryTint: '#dc2626' },

  // 10. Sports, Travel & Kids Worlds (10)
  floodlit_cricket_stadium: { sky: 'open_sky', horizon: 'stadium_stands', landmark: 'cricket_floodlights', floor: 'grass_pitch', accentTint: '#fef08a', secondaryTint: '#22c55e' },
  championship_soccer_pitch: { sky: 'open_sky', horizon: 'stadium_stands', landmark: 'soccer_goal_stands', floor: 'grass_pitch', accentTint: '#ffffff', secondaryTint: '#22c55e' },
  racing_circuit_paddock: { sky: 'open_sky', horizon: 'stadium_stands', landmark: 'paddock_garages', floor: 'asphalt_road', accentTint: '#ef4444', secondaryTint: '#facc15' },
  cruise_liner_promenade: { sky: 'open_sky', horizon: 'ocean_horizon', landmark: 'cruise_railing', floor: 'wood_planks', accentTint: '#38bdf8', secondaryTint: '#facc15' },
  hot_air_balloon_skies: { sky: 'open_sky', horizon: 'floating_isles', landmark: 'hot_air_balloons', floor: 'cloud_bank', accentTint: '#f43f5e', secondaryTint: '#facc15' },
  treehouse_clubhouse: { sky: 'open_sky', horizon: 'forest_canopy', landmark: 'treehouse_deck', floor: 'wood_planks', accentTint: '#f59e0b', secondaryTint: '#22c55e' },
  giant_toybox_playroom: { sky: 'cozy_ceiling', horizon: 'interior_wall', landmark: 'giant_toyblocks', floor: 'carpet_plush', accentTint: '#ef4444', secondaryTint: '#3b82f6', indoor: true },
  circus_big_top_ring: { sky: 'tent_canopy', horizon: 'stadium_stands', landmark: 'circus_ring', floor: 'sand_earth', accentTint: '#ef4444', secondaryTint: '#facc15', indoor: true },
  amusement_ferris_boardwalk: { sky: 'open_sky', horizon: 'ocean_horizon', landmark: 'ferris_wheel', floor: 'wood_planks', accentTint: '#f43f5e', secondaryTint: '#38bdf8' },
  candy_kingdom_bridge: { sky: 'open_sky', horizon: 'floating_isles', landmark: 'candy_canes', floor: 'carpet_plush', accentTint: '#ec4899', secondaryTint: '#38bdf8' },
};

export const ATLAS_INDOOR_STAGES: ReadonlySet<StageId> = new Set<StageId>(
  (Object.entries(ATLAS_STAGE_BLUEPRINTS) as Array<[StageId, StageBlueprint]>)
    .filter(([, bp]) => bp.indoor)
    .map(([id]) => id)
);

function drawPlane1Sky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  sky: PlaneSky,
  bp: StageBlueprint,
  pal: MoodPalette,
  s: number,
  ts: number
) {
  if (sky === 'vault_arch' || sky === 'dome_glass') {
    ctx.strokeStyle = sky === 'dome_glass' ? 'rgba(186,230,253,0.4)' : pal.farSil;
    ctx.lineWidth = (sky === 'dome_glass' ? 4 : 14) * s;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(w * (0.2 + i * 0.2), h * 0.42, 130 * s, Math.PI, 0);
      ctx.stroke();
    }
  } else if (sky === 'industrial_truss' || sky === 'cyber_ceiling') {
    ctx.fillStyle = pal.farSil;
    ctx.fillRect(0, 0, w, h * 0.12);
    ctx.strokeStyle = sky === 'cyber_ceiling' ? bp.accentTint : 'rgba(148,163,184,0.35)';
    ctx.lineWidth = 3 * s;
    for (let x = 0; x < w; x += 64 * s) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 32 * s, h * 0.12); ctx.lineTo(x + 64 * s, 0); ctx.stroke();
    }
  } else if (sky === 'cozy_ceiling') {
    ctx.fillStyle = pal.farSil;
    ctx.fillRect(0, 0, w, h * 0.1);
    ctx.fillStyle = bp.accentTint;
    ctx.globalAlpha = 0.25;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath(); ctx.arc(w * (i * 0.25), h * 0.12, 52 * s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (sky === 'cavern_roof') {
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h * 0.22);
    for (let i = 8; i >= 0; i--) {
      const px = (i / 8) * w;
      const py = h * (0.1 + (i % 2) * 0.11 + ((i * 7) % 5) * 0.015);
      ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
  } else if (sky === 'tent_canopy') {
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i % 2 === 0 ? bp.accentTint : '#fef3c7';
      ctx.globalAlpha = 0.42;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, 0);
      ctx.lineTo((i / 10) * w, h * 0.28);
      ctx.lineTo(((i + 1) / 10) * w, h * 0.28);
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (sky === 'underwater_caustics') {
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.22)';
    ctx.lineWidth = 14 * s;
    for (let i = 0; i < 6; i++) {
      const rx = w * (0.12 + i * 0.16) + Math.sin(ts * 1.4 + i) * 18 * s;
      ctx.beginPath(); ctx.moveTo(rx, 0); ctx.lineTo(rx - 52 * s, h * 0.72); ctx.stroke();
    }
  } else if (sky === 'space_window') {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 36; i++) {
      const sx = ((i * 137) % 100) * 0.01 * w;
      const sy = ((i * 73) % 62) * 0.01 * h;
      ctx.globalAlpha = 0.35 + 0.55 * Math.abs(Math.sin(ts * 1.5 + i));
      ctx.fillRect(sx, sy, 2.5 * s, 2.5 * s);
    }
    ctx.globalAlpha = 1;
  }
}

function drawPlane2Horizon(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  horizon: PlaneHorizon,
  bp: StageBlueprint,
  pal: MoodPalette,
  s: number
) {
  ctx.fillStyle = pal.farSil;
  if (horizon === 'mountains' || horizon === 'glacier_peaks') {
    ctx.beginPath(); ctx.moveTo(0, h * 0.72);
    for (let i = 0; i <= 6; i++) {
      ctx.lineTo((i / 6) * w, h * (i % 2 === 0 ? 0.42 : 0.56));
    }
    ctx.lineTo(w, h * 0.72); ctx.closePath(); ctx.fill();
    if (horizon === 'glacier_peaks') {
      ctx.fillStyle = 'rgba(224,242,254,0.45)';
      for (let i = 0; i <= 6; i += 2) {
        const px = (i / 6) * w;
        ctx.beginPath(); ctx.moveTo(px, h * 0.42); ctx.lineTo(px - 42 * s, h * 0.52); ctx.lineTo(px + 42 * s, h * 0.52); ctx.closePath(); ctx.fill();
      }
    }
  } else if (horizon === 'city_skyline') {
    for (let i = 0; i < 12; i++) {
      const bw = w / 11;
      const bh = h * (0.24 + ((i * 19) % 28) * 0.01);
      ctx.fillRect(i * bw * 0.92, h * 0.72 - bh, bw * 0.82, bh);
      ctx.fillStyle = bp.accentTint;
      ctx.globalAlpha = 0.32;
      ctx.fillRect(i * bw * 0.92 + 8 * s, h * 0.72 - bh + 12 * s, bw * 0.5, 6 * s);
      ctx.globalAlpha = 1;
      ctx.fillStyle = pal.farSil;
    }
  } else if (horizon === 'forest_canopy') {
    for (let i = 0; i < 14; i++) {
      ctx.beginPath(); ctx.arc((i / 13) * w, h * 0.64 - (i % 3) * 18 * s, (42 + (i % 4) * 12) * s, 0, Math.PI * 2); ctx.fill();
    }
  } else if (horizon === 'desert_dunes' || horizon === 'canyon_buttes') {
    ctx.beginPath(); ctx.moveTo(0, h * 0.72);
    if (horizon === 'canyon_buttes') {
      ctx.lineTo(w * 0.14, h * 0.44); ctx.lineTo(w * 0.32, h * 0.44); ctx.lineTo(w * 0.4, h * 0.64);
      ctx.lineTo(w * 0.62, h * 0.64); ctx.lineTo(w * 0.7, h * 0.4); ctx.lineTo(w * 0.9, h * 0.4); ctx.lineTo(w, h * 0.72);
    } else {
      ctx.quadraticCurveTo(w * 0.25, h * 0.5, w * 0.5, h * 0.62);
      ctx.quadraticCurveTo(w * 0.78, h * 0.48, w, h * 0.68);
      ctx.lineTo(w, h * 0.72);
    }
    ctx.closePath(); ctx.fill();
  } else if (horizon === 'stadium_stands') {
    ctx.fillRect(0, h * 0.42, w, h * 0.3);
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 2 * s;
    for (let r = 0; r < 5; r++) {
      ctx.beginPath(); ctx.moveTo(0, h * (0.46 + r * 0.05)); ctx.lineTo(w, h * (0.46 + r * 0.05)); ctx.stroke();
    }
  } else if (horizon === 'floating_isles') {
    for (let i = 0; i < 4; i++) {
      const ix = w * (0.15 + i * 0.24);
      const iy = h * (0.34 + (i % 2) * 0.12);
      ctx.beginPath(); ctx.moveTo(ix - 56 * s, iy); ctx.lineTo(ix + 56 * s, iy); ctx.lineTo(ix, iy + 52 * s); ctx.closePath(); ctx.fill();
    }
  } else if (horizon === 'interior_wall') {
    ctx.fillStyle = pal.shadowTint;
    ctx.fillRect(0, h * 0.1, w, h * 0.62);
  } else if (horizon === 'space_nebula') {
    ctx.fillStyle = bp.secondaryTint;
    ctx.globalAlpha = 0.22;
    ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.36, 260 * s, 96 * s, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    ctx.fillRect(0, h * 0.62, w, h * 0.1);
  }
}

function drawPlane3Landmark(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  lm: PlaneLandmark,
  bp: StageBlueprint,
  pal: MoodPalette,
  s: number,
  ts: number
) {
  const cx = w * 0.5;
  const horizonY = h * 0.72;
  ctx.save();

  if (lm === 'step_pyramid' || lm === 'hanging_gardens' || lm === 'monastery_tiers') {
    for (let step = 0; step < 5; step++) {
      const sw = (340 - step * 54) * s;
      const sh = 38 * s;
      ctx.fillStyle = step % 2 === 0 ? pal.farSil : bp.secondaryTint;
      ctx.fillRect(cx - sw / 2, horizonY - (step + 1) * sh, sw, sh);
      if (lm === 'hanging_gardens') {
        ctx.fillStyle = bp.accentTint;
        ctx.fillRect(cx - sw / 2, horizonY - (step + 1) * sh, sw, 9 * s);
      }
    }
  } else if (lm === 'stonehenge' || lm === 'cloud_pillars') {
    ctx.fillStyle = lm === 'cloud_pillars' ? '#e2e8f0' : '#475569';
    for (let i = -2; i <= 2; i++) {
      const px = cx + i * 92 * s;
      ctx.fillRect(px - 14 * s, horizonY - 132 * s, 28 * s, 132 * s);
      if (i < 2 && i % 2 === 0) ctx.fillRect(px - 18 * s, horizonY - 150 * s, 128 * s, 22 * s);
    }
  } else if (lm === 'castle_keep' || lm === 'great_wall' || lm === 'sky_citadel') {
    ctx.fillStyle = pal.farSil;
    ctx.fillRect(cx - 180 * s, horizonY - 140 * s, 360 * s, 140 * s);
    for (const ox of [-160, 0, 160]) {
      ctx.fillRect(cx + ox * s - 34 * s, horizonY - 210 * s, 68 * s, 210 * s);
      ctx.fillStyle = bp.accentTint;
      ctx.beginPath(); ctx.moveTo(cx + ox * s - 40 * s, horizonY - 210 * s); ctx.lineTo(cx + ox * s, horizonY - 262 * s); ctx.lineTo(cx + ox * s + 40 * s, horizonY - 210 * s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = pal.farSil;
    }
  } else if (lm === 'ferris_wheel' || lm === 'collider_torus' || lm === 'station_ring' || lm === 'dyson_rings' || lm === 'bank_vault_wheel') {
    const rad = 132 * s;
    const wy = horizonY - 148 * s;
    ctx.strokeStyle = bp.accentTint;
    ctx.lineWidth = 8 * s;
    ctx.beginPath(); ctx.arc(cx, wy, rad, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 3 * s;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + ts * 0.25;
      ctx.beginPath(); ctx.moveTo(cx, wy); ctx.lineTo(cx + Math.cos(a) * rad, wy + Math.sin(a) * rad); ctx.stroke();
      ctx.fillStyle = bp.secondaryTint;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rad, wy + Math.sin(a) * rad, 8 * s, 0, Math.PI * 2); ctx.fill();
    }
  } else if (lm === 'storm_lighthouse' || lm === 'rooftop_watertower' || lm === 'solarpunk_towers') {
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath(); ctx.moveTo(cx - 32 * s, horizonY); ctx.lineTo(cx - 18 * s, horizonY - 220 * s); ctx.lineTo(cx + 18 * s, horizonY - 220 * s); ctx.lineTo(cx + 32 * s, horizonY); ctx.closePath(); ctx.fill();
    ctx.fillStyle = bp.accentTint;
    ctx.globalAlpha = 0.34;
    const sweep = Math.sin(ts * 1.6) * 80 * s;
    ctx.beginPath(); ctx.moveTo(cx, horizonY - 210 * s); ctx.lineTo(w, horizonY - 260 * s + sweep); ctx.lineTo(w, horizonY - 140 * s + sweep); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
  } else if (lm === 'giant_mushrooms' || lm === 'alien_glowtrees' || lm === 'elven_treecity' || lm === 'savanna_acacias' || lm === 'jurassic_ferns') {
    for (let i = -2; i <= 2; i++) {
      const mx = cx + i * 115 * s;
      const mh = (110 + Math.abs(i) * 24) * s;
      ctx.fillStyle = pal.farSil;
      ctx.fillRect(mx - 10 * s, horizonY - mh, 20 * s, mh);
      ctx.fillStyle = i % 2 === 0 ? bp.accentTint : bp.secondaryTint;
      ctx.beginPath(); ctx.ellipse(mx, horizonY - mh, (56 - Math.abs(i) * 6) * s, 26 * s, 0, Math.PI, 0); ctx.fill();
    }
  } else if (lm === 'prism_crystals' || lm === 'dragon_gold_mound') {
    for (let i = -3; i <= 3; i++) {
      const px = cx + i * 68 * s;
      const ph = (90 + ((i + 4) % 3) * 44) * s;
      ctx.fillStyle = i % 2 === 0 ? bp.accentTint : bp.secondaryTint;
      ctx.beginPath(); ctx.moveTo(px - 24 * s, horizonY); ctx.lineTo(px, horizonY - ph); ctx.lineTo(px + 24 * s, horizonY); ctx.closePath(); ctx.fill();
    }
  } else if (lm === 'hot_air_balloons') {
    for (let i = -2; i <= 2; i++) {
      const bx = cx + i * 115 * s;
      const by = h * (0.28 + (Math.abs(i) % 2) * 0.1) + Math.sin(ts * 1.4 + i) * 12 * s;
      ctx.fillStyle = i % 2 === 0 ? bp.accentTint : bp.secondaryTint;
      ctx.beginPath(); ctx.arc(bx, by, 34 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(bx - 10 * s, by + 42 * s, 20 * s, 14 * s);
    }
  } else if (lm === 'cricket_floodlights' || lm === 'soccer_goal_stands' || lm === 'boxing_ring') {
    for (const sgn of [-1, 1]) {
      const lx = cx + sgn * 220 * s;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 6 * s;
      ctx.beginPath(); ctx.moveTo(lx, horizonY); ctx.lineTo(lx, horizonY - 220 * s); ctx.stroke();
      ctx.fillStyle = bp.accentTint;
      ctx.fillRect(lx - 26 * s, horizonY - 242 * s, 52 * s, 24 * s);
    }
    if (lm === 'soccer_goal_stands' || lm === 'boxing_ring') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4 * s;
      ctx.strokeRect(cx - 120 * s, horizonY - 96 * s, 240 * s, 96 * s);
    }
  } else if (lm === 'opera_curtains' || lm === 'cursed_tent' || lm === 'circus_ring') {
    ctx.fillStyle = bp.accentTint;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(w * 0.18, h * 0.45, w * 0.08, horizonY); ctx.lineTo(0, horizonY); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(w, 0); ctx.quadraticCurveTo(w * 0.82, h * 0.45, w * 0.92, horizonY); ctx.lineTo(w, horizonY); ctx.closePath(); ctx.fill();
  } else if (lm === 'cellblock_bars' || lm === 'graveyard_iron') {
    ctx.fillStyle = '#1e293b';
    for (let x = w * 0.08; x < w * 0.94; x += 42 * s) {
      ctx.fillRect(x, h * 0.14, 7 * s, horizonY - h * 0.14);
    }
    ctx.fillRect(0, h * 0.32, w, 9 * s);
  } else if (lm === 'dino_skeleton') {
    ctx.strokeStyle = '#f5f5f4';
    ctx.lineWidth = 7 * s;
    ctx.beginPath(); ctx.arc(cx, horizonY - 120 * s, 88 * s, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    for (let r = -3; r <= 3; r++) {
      ctx.beginPath(); ctx.moveTo(cx + r * 24 * s, horizonY - 196 * s); ctx.lineTo(cx + r * 28 * s, horizonY - 110 * s); ctx.stroke();
    }
  } else if (lm === 'startup_screens' || lm === 'stock_ticker_wall' || lm === 'arcade_cabinets' || lm === 'crosswalk_billboards' || lm === 'vr_monoliths') {
    for (let i = -2; i <= 2; i++) {
      const sx = cx + i * 116 * s;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(sx - 44 * s, horizonY - 160 * s, 88 * s, 118 * s);
      ctx.fillStyle = i % 2 === 0 ? bp.accentTint : bp.secondaryTint;
      ctx.globalAlpha = 0.72;
      ctx.fillRect(sx - 36 * s, horizonY - 150 * s, 72 * s, 72 * s);
      ctx.globalAlpha = 1;
    }
  } else if (lm === 'candy_canes' || lm === 'giant_toyblocks') {
    for (let i = -2; i <= 2; i++) {
      const bx = cx + i * 110 * s;
      ctx.fillStyle = i % 2 === 0 ? bp.accentTint : bp.secondaryTint;
      ctx.fillRect(bx - 30 * s, horizonY - 96 * s, 60 * s, 96 * s);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx - 30 * s, horizonY - 64 * s, 60 * s, 14 * s);
    }
  } else {
    // Rich compositional architectural facade (arches, columns, glowing windows/lamps)
    ctx.fillStyle = pal.farSil;
    for (let i = -2; i <= 2; i++) {
      const ax = cx + i * 118 * s;
      ctx.fillRect(ax - 16 * s, h * 0.2, 32 * s, horizonY - h * 0.2);
      ctx.fillStyle = i % 2 === 0 ? bp.accentTint : bp.secondaryTint;
      ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.roundRect(ax - 38 * s, horizonY - 148 * s, 76 * s, 94 * s, 18 * s); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = pal.farSil;
    }
  }

  ctx.restore();
}

function drawPlane4Floor(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  floor: PlaneFloor,
  bp: StageBlueprint,
  pal: MoodPalette,
  s: number,
  ts: number
) {
  const fy = h * 0.72;
  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, fy, w, h - fy);

  if (floor === 'neon_grid') {
    ctx.strokeStyle = bp.accentTint;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 2 * s;
    for (let y = fy; y < h; y += 26 * s) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    for (let i = -5; i <= 5; i++) {
      ctx.beginPath(); ctx.moveTo(w * 0.5 + i * 48 * s, fy); ctx.lineTo(w * 0.5 + i * 150 * s, h); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (floor === 'grass_pitch') {
    ctx.fillStyle = '#15803d';
    ctx.globalAlpha = 0.45;
    ctx.fillRect(0, fy, w, h - fy);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 3 * s;
    ctx.beginPath(); ctx.moveTo(0, fy + 32 * s); ctx.lineTo(w, fy + 32 * s); ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (floor === 'water_reflect') {
    ctx.fillStyle = bp.secondaryTint;
    ctx.globalAlpha = 0.32;
    ctx.fillRect(0, fy, w, h - fy);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = 0; i < 8; i++) {
      const rx = ((i * 127 + ts * 24) % w);
      ctx.fillRect(rx, fy + 16 * s + (i % 4) * 26 * s, 56 * s, 4 * s);
    }
    ctx.globalAlpha = 1;
  } else if (floor === 'asphalt_road') {
    ctx.fillStyle = '#facc15';
    ctx.globalAlpha = 0.6;
    for (let x = 24 * s; x < w; x += 96 * s) {
      ctx.fillRect(x, fy + 58 * s, 48 * s, 7 * s);
    }
    ctx.globalAlpha = 1;
  } else if (floor === 'cloud_bank') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    for (let i = 0; i < 10; i++) {
      ctx.beginPath(); ctx.arc((i / 9) * w, fy + 26 * s, (52 + (i % 3) * 16) * s, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    // Grounded perspective path / floorboards / tiles
    ctx.fillStyle = pal.path;
    ctx.beginPath();
    ctx.moveTo(w * 0.24, fy); ctx.lineTo(w * 0.76, fy); ctx.lineTo(w * 0.96, h); ctx.lineTo(w * 0.04, h);
    ctx.closePath(); ctx.fill();
  }
}

export function drawAtlasStageBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stage: StageId,
  pal: MoodPalette,
  t: number
): boolean {
  const bp = ATLAS_STAGE_BLUEPRINTS[stage];
  if (!bp) return false;

  const s = Math.min(w, h) / 620;
  const ts = snap24(t);

  // Plane 1: Sky / Ceiling
  drawPlane1Sky(ctx, w, h, bp.sky, bp, pal, s, ts);
  // Plane 2: Far Horizon / Skyline / Backdrop
  drawPlane2Horizon(ctx, w, h, bp.horizon, bp, pal, s);
  // Plane 3: Iconic Midground Landmark
  drawPlane3Landmark(ctx, w, h, bp.landmark, bp, pal, s, ts);
  // Plane 4: Grounded Floor / Surface
  drawPlane4Floor(ctx, w, h, bp.floor, bp, pal, s, ts);

  // Plane 5: Ambient Environmental Accent Lights / Particles
  ctx.save();
  ctx.fillStyle = bp.accentTint;
  for (let i = 0; i < 6; i++) {
    const px = w * (0.1 + i * 0.16);
    const py = h * (0.58 + Math.sin(ts * 1.8 + i * 1.4) * 0.04);
    ctx.globalAlpha = 0.22 + 0.18 * Math.abs(Math.sin(ts * 2.5 + i));
    ctx.beginPath(); ctx.arc(px, py, 9 * s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  return true;
}
