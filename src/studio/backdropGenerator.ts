/**
 * Katha Studio — Procedural Custom Backdrop Plate, Transparent Prop Cutout & 4-Act Visual Arc Studio
 *
 * Gives creators and AI directors instant, zero-cost, offline-ready visual variety across long-form
 * 10–30 minute episodes without hitting paid image-model walls:
 *  1. 10 painted 1920x1080 procedural backdrop plates with mood tinting + deterministic seed variation
 *  2. 8 transparent 512x512 procedural prop cutouts ready for `beat.customPropDataUrl`
 *  3. 5 curated 4-Act Visual Progression arcs that evolve lighting, weather, haze, framing & act transitions
 */

import {
  CameraMoveId,
  EpisodeScript,
  MoodId,
  StoryBeat,
  TransitionId,
  WeatherId,
} from './types';
import { ATLAS_MOOD_PALETTES } from './renderAssetsAtmosphereAtlas';

export type BackdropThemeId =
  | 'eclipse_lotus_courtyard'
  | 'floating_cloud_citadel'
  | 'lantern_monsoon_market'
  | 'coral_sea_cavern'
  | 'snow_monastery'
  | 'starlit_desert_oasis'
  | 'ancient_banyan_ruins'
  | 'bamboo_mist_bridge'
  | 'crimson_volcano_citadel'
  | 'golden_sun_temple'
  | 'cyber_rain_skyline'
  | 'deep_space_nebula'
  | 'aurora_glacier_peaks'
  | 'noir_wet_boulevard'
  | 'sunlit_botanical_atrium'
  | 'sunken_coral_ruins'
  | 'volcanic_caldera_bridge'
  | 'golden_pyramids_dusk'
  | 'sakura_temple_stairs'
  | 'steampunk_airship_dock'
  | 'gothic_moon_castle'
  | 'vintage_library_vault'
  | 'minimal_explainer_grid'
  | 'broadcast_studio_backdrop'
  // Wave 5: +60 Procedural Backdrop Themes (24 -> 84 total)
  | 'taj_moonlight_reflection'
  | 'kyoto_autumn_torii'
  | 'paris_eiffel_twilight'
  | 'cairo_nile_felucca'
  | 'venice_canal_gondola'
  | 'machu_picchu_clouds'
  | 'athens_parthenon_dawn'
  | 'petra_rose_canyon'
  | 'angkor_sunrise_towers'
  | 'santorini_cobalt_cliffs'
  | 'wild_west_mesa_town'
  | 'victorian_clock_fog'
  | 'medieval_keep_banners'
  | 'viking_fjord_aurora'
  | 'renaissance_canal_plaza'
  | 'silk_road_dunes_camp'
  | 'edo_castle_moat'
  | 'industrial_steam_yard'
  | 'tokyo_shibuya_neon'
  | 'manhattan_rooftop_dusk'
  | 'subway_express_tunnel'
  | 'harbor_bridge_fog'
  | 'highway_sunset_viaduct'
  | 'retro_arcade_neon'
  | 'suburban_autumn_lane'
  | 'airport_tarmac_twilight'
  | 'startup_glass_skyline'
  | 'wall_street_trading_hall'
  | 'cleanroom_quantum_lab'
  | 'podcast_acoustic_studio'
  | 'university_oak_quad'
  | 'modern_hospital_atrium'
  | 'penthouse_city_lights'
  | 'grand_opera_velvet'
  | 'botanical_rain_dome'
  | 'museum_fossil_rotunda'
  | 'orbital_ring_horizon'
  | 'alien_biolum_canopy'
  | 'dyson_star_megastructure'
  | 'cyber_megamall_neon'
  | 'mech_bay_gantry'
  | 'vr_synthwave_grid'
  | 'solarpunk_waterfall_city'
  | 'wasteland_scrap_canyon'
  | 'elven_canopy_walkway'
  | 'dwarven_magma_forge'
  | 'dragon_gold_cavern'
  | 'crystal_amethyst_grotto'
  | 'wizard_spire_library'
  | 'fairy_mushroom_glade'
  | 'haunted_manor_gates'
  | 'stormy_cliff_lighthouse'
  | 'misty_catacombs_arch'
  | 'noir_venetian_blinds'
  | 'coral_lagoon_sunbeams'
  | 'arctic_iceberg_bay'
  | 'african_acacia_sunset'
  | 'jurassic_volcano_valley'
  | 'cricket_stadium_floodlights'
  | 'candy_rainbow_kingdom';

export interface BackdropThemeMeta {
  id: BackdropThemeId;
  label: string;
  vibe: string;
  defaultMood: MoodId;
  accentHex: string;
}

export const BACKDROP_THEMES: BackdropThemeMeta[] = [
  {
    id: 'eclipse_lotus_courtyard',
    label: 'Eclipse Lotus Courtyard',
    vibe: 'Mughal arches, solar eclipse & mirror pool',
    defaultMood: 'twilight_temple',
    accentHex: '#f5b841',
  },
  {
    id: 'floating_cloud_citadel',
    label: 'Floating Cloud Citadel',
    vibe: 'Celestial golden spires above rose clouds',
    defaultMood: 'golden_durbar',
    accentHex: '#ffd77a',
  },
  {
    id: 'lantern_monsoon_market',
    label: 'Lantern Monsoon Market',
    vibe: 'Warm paper lanterns & rain-slicked eaves',
    defaultMood: 'sandstone_dusk',
    accentHex: '#ff8a47',
  },
  {
    id: 'coral_sea_cavern',
    label: 'Sunken Coral Cavern',
    vibe: 'Bioluminescent sea arches & sunbeams',
    defaultMood: 'mystic_teal',
    accentHex: '#3ce0d0',
  },
  {
    id: 'snow_monastery',
    label: 'Himalayan Snow Monastery',
    vibe: 'Stepped alpine peaks, prayer flags & stupa',
    defaultMood: 'moonlit_marble',
    accentHex: '#9fd4ff',
  },
  {
    id: 'starlit_desert_oasis',
    label: 'Starlit Desert Oasis',
    vibe: 'Crescent dunes, palms & glowing spring',
    defaultMood: 'midnight_banyan',
    accentHex: '#f2c85b',
  },
  {
    id: 'ancient_banyan_ruins',
    label: 'Ancient Banyan Ruins',
    vibe: 'Sacred aerial roots over temple stones',
    defaultMood: 'emerald_jungle',
    accentHex: '#6ee7a8',
  },
  {
    id: 'bamboo_mist_bridge',
    label: 'Bamboo Mist Bridge',
    vibe: 'Vermilion arch bridge in emerald fog',
    defaultMood: 'emerald_jungle',
    accentHex: '#f0544f',
  },
  {
    id: 'crimson_volcano_citadel',
    label: 'Crimson Volcano Citadel',
    vibe: 'Obsidian fortress & magma rivers',
    defaultMood: 'crimson_wrath',
    accentHex: '#ff5232',
  },
  {
    id: 'golden_sun_temple',
    label: 'Golden Sun Temple',
    vibe: 'Stepped sandstone sanctum & sunbeams',
    defaultMood: 'golden_durbar',
    accentHex: '#f7b944',
  },
  {
    id: 'cyber_rain_skyline',
    label: 'Cyber Rain Skyline',
    vibe: 'Neon megatowers, holograms & rain reflections',
    defaultMood: 'cyber_magenta',
    accentHex: '#ff2bd6',
  },
  {
    id: 'deep_space_nebula',
    label: 'Deep Space Nebula',
    vibe: 'Cosmic starclouds, ringed planet & starship',
    defaultMood: 'deep_abyss',
    accentHex: '#38bdf8',
  },
  {
    id: 'aurora_glacier_peaks',
    label: 'Aurora Glacier Peaks',
    vibe: 'Shimmering polar aurora ribbons over ice spires',
    defaultMood: 'arctic_aurora',
    accentHex: '#5eead4',
  },
  {
    id: 'noir_wet_boulevard',
    label: 'Noir Wet Boulevard',
    vibe: 'High-contrast 1940s lamp-lit misty avenue',
    defaultMood: 'noir_monochrome',
    accentHex: '#cbd5e1',
  },
  {
    id: 'sunlit_botanical_atrium',
    label: 'Sunlit Botanical Atrium',
    vibe: 'Wrought-iron glass conservatory & warm foliage',
    defaultMood: 'sunlit_morning',
    accentHex: '#4ade80',
  },
  {
    id: 'sunken_coral_ruins',
    label: 'Sunken Coral Ruins',
    vibe: 'Submerged marble arches & glowing reef flora',
    defaultMood: 'deep_abyss',
    accentHex: '#2dd4bf',
  },
  {
    id: 'volcanic_caldera_bridge',
    label: 'Volcanic Caldera Bridge',
    vibe: 'Basalt suspension bridge above glowing magma',
    defaultMood: 'volcanic_inferno',
    accentHex: '#ff6b2b',
  },
  {
    id: 'golden_pyramids_dusk',
    label: 'Golden Pyramids Dusk',
    vibe: 'Monumental Giza pyramids & twilight sphinx glow',
    defaultMood: 'sandstone_dusk',
    accentHex: '#f5b841',
  },
  {
    id: 'sakura_temple_stairs',
    label: 'Sakura Temple Stairs',
    vibe: 'Vermilion shrine steps under pink blossom canopy',
    defaultMood: 'sakura_dawn',
    accentHex: '#f9a8d4',
  },
  {
    id: 'steampunk_airship_dock',
    label: 'Steampunk Airship Dock',
    vibe: 'Brass mooring tower, zeppelins & clockwork gears',
    defaultMood: 'sepia_archive',
    accentHex: '#d99a38',
  },
  {
    id: 'gothic_moon_castle',
    label: 'Gothic Moon Castle',
    vibe: 'Spired mountaintop fortress & giant harvest moon',
    defaultMood: 'twilight_temple',
    accentHex: '#a78bfa',
  },
  {
    id: 'vintage_library_vault',
    label: 'Vintage Library Vault',
    vibe: 'Arched scholar shelves & hanging brass lamps',
    defaultMood: 'sepia_archive',
    accentHex: '#e0c088',
  },
  {
    id: 'minimal_explainer_grid',
    label: 'Minimal Explainer Grid',
    vibe: 'Clean editorial blueprint & geometric studio grid',
    defaultMood: 'sunlit_morning',
    accentHex: '#38bdf8',
  },
  {
    id: 'broadcast_studio_backdrop',
    label: 'Broadcast Studio Backdrop',
    vibe: 'Modern newsroom cyclorama & crisp LED light bars',
    defaultMood: 'mystic_teal',
    accentHex: '#0ea5e9',
  },
  // Wave 5: +60 Procedural Backdrop Themes (24 -> 84 total)
  { id: 'taj_moonlight_reflection', label: 'Taj Moonlight Reflection', vibe: 'Marble dome silhouette & mirror canal', defaultMood: 'moonlit_marble', accentHex: '#e0f2fe' },
  { id: 'kyoto_autumn_torii', label: 'Kyoto Autumn Torii', vibe: 'Vermilion gates & crimson maple slopes', defaultMood: 'autumn_amber', accentHex: '#ea580c' },
  { id: 'paris_eiffel_twilight', label: 'Paris Twilight Tower', vibe: 'Iron lattice spire & lavender boulevard', defaultMood: 'lavender_twilight', accentHex: '#facc15' },
  { id: 'cairo_nile_felucca', label: 'Cairo Nile Felucca', vibe: 'Sail silhouettes & golden desert dusk', defaultMood: 'desert_mirage', accentHex: '#f59e0b' },
  { id: 'venice_canal_gondola', label: 'Venice Canal Lanterns', vibe: 'Arched stone bridges & water shimmer', defaultMood: 'golden_hour_cinema', accentHex: '#fb923c' },
  { id: 'machu_picchu_clouds', label: 'Andes Cloud Terraces', vibe: 'Stone mountain steps above silver mist', defaultMood: 'spring_meadow', accentHex: '#4ade80' },
  { id: 'athens_parthenon_dawn', label: 'Athens Parthenon Dawn', vibe: 'Doric marble colonnade & coral sunrise', defaultMood: 'sunset_coral', accentHex: '#fda4af' },
  { id: 'petra_rose_canyon', label: 'Petra Rose Canyon', vibe: 'Carved sandstone facade in narrow gorge', defaultMood: 'sandstone_dusk', accentHex: '#ea580c' },
  { id: 'angkor_sunrise_towers', label: 'Angkor Sunrise Towers', vibe: 'Lotus temple spires & jungle mirror pond', defaultMood: 'golden_hour_cinema', accentHex: '#f59e0b' },
  { id: 'santorini_cobalt_cliffs', label: 'Santorini Cobalt Cliffs', vibe: 'Whitewashed domes & turquoise Aegean sea', defaultMood: 'ocean_turquoise', accentHex: '#38bdf8' },
  { id: 'wild_west_mesa_town', label: 'Wild West Mesa Town', vibe: 'Timber frontier boardwalk & red buttes', defaultMood: 'desert_mirage', accentHex: '#d97706' },
  { id: 'victorian_clock_fog', label: 'Victorian Clock Fog', vibe: 'Gaslamp silhouettes & gothic clocktower', defaultMood: 'storm_slate', accentHex: '#f59e0b' },
  { id: 'medieval_keep_banners', label: 'Medieval Keep Banners', vibe: 'Stone battlements & heraldic pennants', defaultMood: 'candlelit_parchment', accentHex: '#dc2626' },
  { id: 'viking_fjord_aurora', label: 'Viking Fjord Aurora', vibe: 'Dragonship prow under emerald northern lights', defaultMood: 'arctic_aurora', accentHex: '#34d399' },
  { id: 'renaissance_canal_plaza', label: 'Renaissance Dome Plaza', vibe: 'Terracotta cupola & warm sunlit piazza', defaultMood: 'vintage_kodachrome', accentHex: '#ea580c' },
  { id: 'silk_road_dunes_camp', label: 'Silk Road Dunes Camp', vibe: 'Caravan tents under deep indigo stars', defaultMood: 'cobalt_midnight', accentHex: '#facc15' },
  { id: 'edo_castle_moat', label: 'Edo Castle Moat', vibe: 'Layered pagoda roofs & pine reflection', defaultMood: 'sakura_dawn', accentHex: '#f472b6' },
  { id: 'industrial_steam_yard', label: 'Industrial Steam Yard', vibe: 'Riveted iron viaducts & furnace amber', defaultMood: 'copper_steampunk', accentHex: '#f97316' },
  { id: 'tokyo_shibuya_neon', label: 'Tokyo Neon Crossing', vibe: 'Electric blue billboards & rain gloss', defaultMood: 'neon_tokyo_blue', accentHex: '#00f0ff' },
  { id: 'manhattan_rooftop_dusk', label: 'Manhattan Rooftop Dusk', vibe: 'Art-deco skyline & amber sunset haze', defaultMood: 'golden_hour_cinema', accentHex: '#fb923c' },
  { id: 'subway_express_tunnel', label: 'Subway Express Tunnel', vibe: 'Tiled metro arches & streaking train lights', defaultMood: 'storm_slate', accentHex: '#facc15' },
  { id: 'harbor_bridge_fog', label: 'Harbor Bridge Fog', vibe: 'Suspension cables emerging from sea mist', defaultMood: 'monsoon_indigo', accentHex: '#f43f5e' },
  { id: 'highway_sunset_viaduct', label: 'Highway Sunset Viaduct', vibe: 'Sweeping freeway ramps & taillight trails', defaultMood: 'sunset_coral', accentHex: '#fb7185' },
  { id: 'retro_arcade_neon', label: 'Retro Arcade Neon', vibe: 'Synthwave cabinets & magenta grid floor', defaultMood: 'cyber_magenta', accentHex: '#ff2bd6' },
  { id: 'suburban_autumn_lane', label: 'Suburban Autumn Lane', vibe: 'Warm porchlights & amber maple avenue', defaultMood: 'autumn_amber', accentHex: '#f59e0b' },
  { id: 'airport_tarmac_twilight', label: 'Airport Tarmac Twilight', vibe: 'Runway beacons & cobalt horizon glow', defaultMood: 'cobalt_midnight', accentHex: '#38bdf8' },
  { id: 'startup_glass_skyline', label: 'Startup Glass Skyline', vibe: 'Minimalist glass loft & crisp cyan view', defaultMood: 'sunlit_morning', accentHex: '#38bdf8' },
  { id: 'wall_street_trading_hall', label: 'Trading Floor Tickers', vibe: 'Market monitors & dramatic architectural columns', defaultMood: 'obsidian_gold', accentHex: '#22c55e' },
  { id: 'cleanroom_quantum_lab', label: 'Quantum Cleanroom Lab', vibe: 'Cryo-chandeliers & crisp blue telemetry', defaultMood: 'ice_palace_cyan', accentHex: '#22d3ee' },
  { id: 'podcast_acoustic_studio', label: 'Podcast Acoustic Studio', vibe: 'Warm LED wall panels & sound baffles', defaultMood: 'royal_amethyst', accentHex: '#c084fc' },
  { id: 'university_oak_quad', label: 'University Oak Quad', vibe: 'Ivy brick arches & sunlit lecture courtyard', defaultMood: 'vintage_kodachrome', accentHex: '#eab308' },
  { id: 'modern_hospital_atrium', label: 'Modern Clinical Atrium', vibe: 'Clean white skylights & calm teal accents', defaultMood: 'ice_palace_cyan', accentHex: '#0ea5e9' },
  { id: 'penthouse_city_lights', label: 'Penthouse City Lights', vibe: 'Panoramic bokeh skyline & gold interior', defaultMood: 'obsidian_gold', accentHex: '#facc15' },
  { id: 'grand_opera_velvet', label: 'Grand Opera Velvet', vibe: 'Crimson drapery & gilded chandelier tiers', defaultMood: 'blood_moon_crimson', accentHex: '#facc15' },
  { id: 'botanical_rain_dome', label: 'Botanical Rain Dome', vibe: 'Emerald fern canopy under glass ribs', defaultMood: 'solarpunk_lime', accentHex: '#4ade80' },
  { id: 'museum_fossil_rotunda', label: 'Museum Fossil Rotunda', vibe: 'Vaulted skylights & dramatic bone silhouette', defaultMood: 'candlelit_parchment', accentHex: '#fde68a' },
  { id: 'orbital_ring_horizon', label: 'Orbital Ring Horizon', vibe: 'Curved planetary atmosphere & station spokes', defaultMood: 'deep_space_void', accentHex: '#38bdf8' },
  { id: 'alien_biolum_canopy', label: 'Alien Biolum Canopy', vibe: 'Glowing violet fronds & floating spores', defaultMood: 'lavender_twilight', accentHex: '#22d3ee' },
  { id: 'dyson_star_megastructure', label: 'Dyson Star Megastructure', vibe: 'Colossal orbital rings cradling a golden sun', defaultMood: 'obsidian_gold', accentHex: '#facc15' },
  { id: 'cyber_megamall_neon', label: 'Cyber Megamall Atrium', vibe: 'Holographic escalators & neon skybridges', defaultMood: 'neon_tokyo_blue', accentHex: '#ff2bd6' },
  { id: 'mech_bay_gantry', label: 'Mech Hangar Gantry', vibe: 'Steel catwalks & hazard warning floodlights', defaultMood: 'storm_slate', accentHex: '#f97316' },
  { id: 'vr_synthwave_grid', label: 'VR Synthwave Horizon', vibe: 'Retro segmented sun & glowing wireframe plain', defaultMood: 'cyber_magenta', accentHex: '#00f0ff' },
  { id: 'solarpunk_waterfall_city', label: 'Solarpunk Waterfall City', vibe: 'Terraced white eco-spires & lush cascades', defaultMood: 'solarpunk_lime', accentHex: '#4ade80' },
  { id: 'wasteland_scrap_canyon', label: 'Wasteland Scrap Canyon', vibe: 'Broken highway pillars & acid-green horizon', defaultMood: 'toxic_wasteland', accentHex: '#a3e635' },
  { id: 'elven_canopy_walkway', label: 'Elven Canopy Walkway', vibe: 'Luminous silver bridges in giant ancient boughs', defaultMood: 'emerald_matrix', accentHex: '#34d399' },
  { id: 'dwarven_magma_forge', label: 'Dwarven Magma Forge', vibe: 'Carved basalt pillars & molten gold channels', defaultMood: 'volcanic_inferno', accentHex: '#f97316' },
  { id: 'dragon_gold_cavern', label: 'Dragon Gold Cavern', vibe: 'Glittering treasure dunes & vaulted stone roof', defaultMood: 'obsidian_gold', accentHex: '#facc15' },
  { id: 'crystal_amethyst_grotto', label: 'Crystal Amethyst Grotto', vibe: 'Faceted glowing quartz clusters & calm pool', defaultMood: 'royal_amethyst', accentHex: '#c084fc' },
  { id: 'wizard_spire_library', label: 'Wizard Spire Library', vibe: 'Floating candles & spiraling arcane shelves', defaultMood: 'cobalt_midnight', accentHex: '#a855f7' },
  { id: 'fairy_mushroom_glade', label: 'Fairy Mushroom Glade', vibe: 'Luminous giant caps & firefly brook', defaultMood: 'pastel_storybook', accentHex: '#f472b6' },
  { id: 'haunted_manor_gates', label: 'Haunted Manor Gates', vibe: 'Wrought-iron arch & twisted midnight oaks', defaultMood: 'blood_moon_crimson', accentHex: '#ef4444' },
  { id: 'stormy_cliff_lighthouse', label: 'Stormy Cliff Lighthouse', vibe: 'Sweeping beacon beam over crashing waves', defaultMood: 'monsoon_indigo', accentHex: '#fef08a' },
  { id: 'misty_catacombs_arch', label: 'Misty Catacombs Arch', vibe: 'Torchlit vaulted stone passageways', defaultMood: 'copper_steampunk', accentHex: '#fb923c' },
  { id: 'noir_venetian_blinds', label: 'Noir Venetian Blinds', vibe: 'Diagonal window slats & moody neon glow', defaultMood: 'noir_monochrome', accentHex: '#f59e0b' },
  { id: 'coral_lagoon_sunbeams', label: 'Coral Lagoon Sunbeams', vibe: 'Turquoise reef arches & dancing water caustics', defaultMood: 'ocean_turquoise', accentHex: '#2dd4bf' },
  { id: 'arctic_iceberg_bay', label: 'Arctic Iceberg Bay', vibe: 'Crystalline glacial floes & crisp cyan sky', defaultMood: 'ice_palace_cyan', accentHex: '#7dd3fc' },
  { id: 'african_acacia_sunset', label: 'African Acacia Sunset', vibe: 'Flat-top tree silhouettes & giant amber sun', defaultMood: 'golden_hour_cinema', accentHex: '#f97316' },
  { id: 'jurassic_volcano_valley', label: 'Jurassic Volcano Valley', vibe: 'Smoking caldera & prehistoric fern basin', defaultMood: 'spring_meadow', accentHex: '#fb923c' },
  { id: 'cricket_stadium_floodlights', label: 'Stadium Night Floodlights', vibe: 'Towering light pylons & lush emerald outfield', defaultMood: 'cobalt_midnight', accentHex: '#fef08a' },
  { id: 'candy_rainbow_kingdom', label: 'Candy Rainbow Kingdom', vibe: 'Pastel frosted hills & lollipop archways', defaultMood: 'candyland_pop', accentHex: '#f472b6' },
];

export type CustomPropPresetId =
  | 'crystal_orb'
  | 'relic_chest'
  | 'ancient_key'
  | 'paper_lantern'
  | 'ritual_dagger'
  | 'lotus_chalice'
  | 'rune_scroll'
  | 'spirit_mask'
  | 'hologram_cube'
  | 'neon_katana'
  | 'detective_dossier'
  | 'antique_globe'
  | 'enchanted_hourglass'
  | 'crystal_potion'
  | 'floating_crown'
  | 'brass_astrolabe'
  | 'vintage_typewriter'
  | 'studio_mic'
  | 'starship_shuttle'
  | 'ancient_relic_mask'
  | 'golden_scales'
  | 'sealed_wax_letter'
  | 'cyber_visor_deck'
  | 'bonsai_lantern'
  // Wave 5: +60 Procedural Prop Cutouts (24 -> 84 total)
  | 'cutout_katana_sheathed'
  | 'cutout_viking_axe'
  | 'cutout_heraldic_shield'
  | 'cutout_plasma_blaster'
  | 'cutout_shuriken_burst'
  | 'cutout_warhammer_rune'
  | 'cutout_phoenix_plume'
  | 'cutout_dragon_egg_gem'
  | 'cutout_chained_grimoire'
  | 'cutout_genie_oil_lamp'
  | 'cutout_voodoo_mask'
  | 'cutout_astral_orrery'
  | 'cutout_smartphone_hud'
  | 'cutout_vr_goggles'
  | 'cutout_ai_neural_core'
  | 'cutout_dna_helix'
  | 'cutout_jetpack_wings'
  | 'cutout_radar_dish'
  | 'cutout_gold_bullion'
  | 'cutout_stock_ticker'
  | 'cutout_cinema_clapper'
  | 'cutout_podcast_condenser'
  | 'cutout_cash_bundle'
  | 'cutout_megaphone_red'
  | 'cutout_silver_trophy'
  | 'cutout_med_stethoscope'
  | 'cutout_bubbling_beaker'
  | 'cutout_brass_telescope'
  | 'cutout_first_aid_box'
  | 'cutout_atom_orbitals'
  | 'cutout_ammonite_fossil'
  | 'cutout_classical_sitar'
  | 'cutout_tabla_pair'
  | 'cutout_artist_palette'
  | 'cutout_vinyl_record'
  | 'cutout_dj_deck'
  | 'cutout_comedy_tragedy'
  | 'cutout_origami_bird'
  | 'cutout_bamboo_flute'
  | 'cutout_ramen_steaming'
  | 'cutout_festive_thali'
  | 'cutout_birthday_cake'
  | 'cutout_pizza_slice'
  | 'cutout_porcelain_teapot'
  | 'cutout_honey_pot'
  | 'cutout_vintage_trunk'
  | 'cutout_ship_helm'
  | 'cutout_hot_air_balloon'
  | 'cutout_classic_bicycle'
  | 'cutout_iron_anchor'
  | 'cutout_storm_lantern'
  | 'cutout_field_binoculars'
  | 'cutout_steel_handcuffs'
  | 'cutout_bank_safe_dial'
  | 'cutout_skeleton_keys'
  | 'cutout_skull_crystal'
  | 'cutout_cricket_bat'
  | 'cutout_soccer_ball'
  | 'cutout_boxing_gloves'
  | 'cutout_gift_ribbon';

export interface CustomPropPresetMeta {
  id: CustomPropPresetId;
  label: string;
  note: string;
  defaultTint: string;
}

export const CUSTOM_PROP_PRESETS: CustomPropPresetMeta[] = [
  { id: 'crystal_orb', label: 'Celestial Crystal Orb', note: 'Glowing nebula sphere in brass rings', defaultTint: '#48e5d8' },
  { id: 'relic_chest', label: 'Jeweled Relic Chest', note: 'Gilded chest radiating treasure light', defaultTint: '#f5c04a' },
  { id: 'ancient_key', label: 'Ornate Lotus Key', note: 'Carved brass temple vault key', defaultTint: '#f2c85b' },
  { id: 'paper_lantern', label: 'Enchanted Paper Lantern', note: 'Warm silk festival lantern with tassel', defaultTint: '#ff6b4a' },
  { id: 'ritual_dagger', label: 'Jeweled Ritual Dagger', note: 'Wavy ceremonial blade with ruby hilt', defaultTint: '#e84855' },
  { id: 'lotus_chalice', label: 'Mystic Lotus Chalice', note: 'Golden nectar goblet & petals', defaultTint: '#ff90c2' },
  { id: 'rune_scroll', label: 'Floating Rune Scroll', note: 'Illuminated manuscript with glowing sigils', defaultTint: '#7dd3fc' },
  { id: 'spirit_mask', label: 'Carved Spirit Mask', note: 'Theatrical folklore mask with golden crown', defaultTint: '#c084fc' },
  { id: 'hologram_cube', label: 'Hologram Data Cube', note: 'Wireframe sci-fi data prism with cyan core', defaultTint: '#00f0ff' },
  { id: 'neon_katana', label: 'Neon Energy Katana', note: 'Plasma-edged cyber katana blade', defaultTint: '#ff2bd6' },
  { id: 'detective_dossier', label: 'Confidential Dossier', note: 'Top-secret manila case file with red stamp', defaultTint: '#dc2626' },
  { id: 'antique_globe', label: 'Antique Brass Globe', note: 'Cartographer meridian globe on oak pedestal', defaultTint: '#38bdf8' },
  { id: 'enchanted_hourglass', label: 'Enchanted Hourglass', note: 'Gilded chronometer with luminous stardust sand', defaultTint: '#facc15' },
  { id: 'crystal_potion', label: 'Crystal Elixir Vial', note: 'Faceted alchemist phial with glowing elixir', defaultTint: '#a855f7' },
  { id: 'floating_crown', label: 'Floating Royal Crown', note: 'Jeweled sovereign diadem radiating gold aura', defaultTint: '#fbbf24' },
  { id: 'brass_astrolabe', label: 'Brass Celestial Astrolabe', note: 'Concentric star-navigation rings & pointer', defaultTint: '#eab308' },
  { id: 'vintage_typewriter', label: 'Vintage Typewriter', note: 'Classic noir reporter typewriter with paper', defaultTint: '#64748b' },
  { id: 'studio_mic', label: 'Broadcast Studio Mic', note: 'Chrome condenser microphone with LED ring', defaultTint: '#38bdf8' },
  { id: 'starship_shuttle', label: 'Orbital Shuttle Craft', note: 'Sleek delta-wing starship with ion thrusters', defaultTint: '#22d3ee' },
  { id: 'ancient_relic_mask', label: 'Pharaoh Relic Mask', note: 'Gold & lapis ceremonial funerary mask', defaultTint: '#eab308' },
  { id: 'golden_scales', label: 'Golden Scales of Justice', note: 'Balanced brass courtroom scales emblem', defaultTint: '#f59e0b' },
  { id: 'sealed_wax_letter', label: 'Wax-Sealed Letter', note: 'Parchment envelope stamped with crimson seal', defaultTint: '#e11d48' },
  { id: 'cyber_visor_deck', label: 'Cyber Deck & Visor', note: 'Hacker neural console with glowing keycaps', defaultTint: '#10b981' },
  { id: 'bonsai_lantern', label: 'Sakura Bonsai Lantern', note: 'Miniature blooming bonsai & stone shrine lamp', defaultTint: '#f472b6' },
  // Wave 5: +60 Procedural Prop Cutouts (24 -> 84 total)
  { id: 'cutout_katana_sheathed', label: 'Imperial Katana Cutout', note: 'Curved steel blade with crimson cord hilt', defaultTint: '#dc2626' },
  { id: 'cutout_viking_axe', label: 'Nordic Battleaxe', note: 'Twin-bearded etched iron war axe', defaultTint: '#f59e0b' },
  { id: 'cutout_heraldic_shield', label: 'Heraldic Knight Shield', note: 'Crested heater shield with gold cross', defaultTint: '#3b82f6' },
  { id: 'cutout_plasma_blaster', label: 'Plasma Pulse Rifle', note: 'Sci-fi energy carbine with cyan coil', defaultTint: '#22d3ee' },
  { id: 'cutout_shuriken_burst', label: 'Steel Shuriken Star', note: 'Four-point ninja throwing star', defaultTint: '#cbd5e1' },
  { id: 'cutout_warhammer_rune', label: 'Runic Warhammer', note: 'Engraved lightning hammer head', defaultTint: '#38bdf8' },
  { id: 'cutout_phoenix_plume', label: 'Blazing Phoenix Plume', note: 'Glowing golden-orange ember feather', defaultTint: '#f97316' },
  { id: 'cutout_dragon_egg_gem', label: 'Scaled Dragon Egg', note: 'Ruby-scaled hatching relic egg', defaultTint: '#dc2626' },
  { id: 'cutout_chained_grimoire', label: 'Chained Spell Grimoire', note: 'Arcane tome bound in silver chains', defaultTint: '#a855f7' },
  { id: 'cutout_genie_oil_lamp', label: 'Golden Genie Lamp', note: 'Burnished brass oil lamp with blue wisp', defaultTint: '#facc15' },
  { id: 'cutout_voodoo_mask', label: 'Carved Ritual Totem', note: 'Painted folklore guardian mask', defaultTint: '#22c55e' },
  { id: 'cutout_astral_orrery', label: 'Astral Planetary Orrery', note: 'Spinning brass solar system model', defaultTint: '#eab308' },
  { id: 'cutout_smartphone_hud', label: 'Glowing Smartphone HUD', note: 'Glass phone emitting floating notifications', defaultTint: '#38bdf8' },
  { id: 'cutout_vr_goggles', label: 'VR Spatial Headset', note: 'Sleek visor with glowing cyan strip', defaultTint: '#06b6d4' },
  { id: 'cutout_ai_neural_core', label: 'AI Quantum Core', note: 'Levitating octahedron processor crystal', defaultTint: '#c084fc' },
  { id: 'cutout_dna_helix', label: 'DNA Double Helix', note: 'Luminous cyan-magenta genetic strand', defaultTint: '#ec4899' },
  { id: 'cutout_jetpack_wings', label: 'Twin-Thruster Jetpack', note: 'Rocket pack with glowing ignition nozzles', defaultTint: '#f97316' },
  { id: 'cutout_radar_dish', label: 'Orbital Radar Dish', note: 'Parabolic satellite dish with ping waves', defaultTint: '#34d399' },
  { id: 'cutout_gold_bullion', label: 'Gold Bullion Stack', note: 'Stacked 24k stamped vault ingots', defaultTint: '#facc15' },
  { id: 'cutout_stock_ticker', label: 'Market Rally Chart', note: 'Rising green candlestick breakout display', defaultTint: '#22c55e' },
  { id: 'cutout_cinema_clapper', label: 'Director Clapperboard', note: 'Classic black-and-white film slate', defaultTint: '#f8fafc' },
  { id: 'cutout_podcast_condenser', label: 'Podcast Boom Mic', note: 'Studio condenser mic with pop filter', defaultTint: '#a855f7' },
  { id: 'cutout_cash_bundle', label: 'Banknote Cash Stack', note: 'Banded emerald currency bundle', defaultTint: '#16a34a' },
  { id: 'cutout_megaphone_red', label: 'Rally Megaphone', note: 'Crisp red-and-white acoustic bullhorn', defaultTint: '#ef4444' },
  { id: 'cutout_silver_trophy', label: 'Championship Cup', note: 'Polished silver two-handled trophy', defaultTint: '#e2e8f0' },
  { id: 'cutout_med_stethoscope', label: 'Clinical Stethoscope', note: 'Coiled medical acoustic chestpiece', defaultTint: '#0ea5e9' },
  { id: 'cutout_bubbling_beaker', label: 'Bubbling Lab Flask', note: 'Erlenmeyer beaker with neon green brew', defaultTint: '#4ade80' },
  { id: 'cutout_brass_telescope', label: 'Observatory Telescope', note: 'Extendable brass refractor scope', defaultTint: '#d97706' },
  { id: 'cutout_first_aid_box', label: 'First-Aid Medkit', note: 'Emergency case with bold crimson cross', defaultTint: '#dc2626' },
  { id: 'cutout_atom_orbitals', label: 'Atomic Nucleus Model', note: 'Three intersecting electron rings', defaultTint: '#38bdf8' },
  { id: 'cutout_ammonite_fossil', label: 'Ammonite Shell Fossil', note: 'Ancient spiral limestone specimen', defaultTint: '#a8a29e' },
  { id: 'cutout_classical_sitar', label: 'Classical Sitar', note: 'Resonating gourd & carved rosewood neck', defaultTint: '#d97706' },
  { id: 'cutout_tabla_pair', label: 'Concert Tabla Drums', note: 'Paired dayan & bayan percussion set', defaultTint: '#f59e0b' },
  { id: 'cutout_artist_palette', label: 'Painter Palette & Brush', note: 'Wooden palette dotted with vivid pigments', defaultTint: '#f43f5e' },
  { id: 'cutout_vinyl_record', label: 'Spinning Vinyl LP', note: 'Grooved black disc with crimson center label', defaultTint: '#ef4444' },
  { id: 'cutout_dj_deck', label: 'Neon DJ Turntable', note: 'Dual-platter mixer with glowing faders', defaultTint: '#ff2bd6' },
  { id: 'cutout_comedy_tragedy', label: 'Theater Masks Pair', note: 'Golden comedy & cobalt tragedy masks', defaultTint: '#facc15' },
  { id: 'cutout_origami_bird', label: 'Folded Origami Crane', note: 'Crisp paper-folded peace crane', defaultTint: '#f472b6' },
  { id: 'cutout_bamboo_flute', label: 'Bansuri Bamboo Flute', note: 'Carved woodland flute with silk tassel', defaultTint: '#84cc16' },
  { id: 'cutout_ramen_steaming', label: 'Steaming Ramen Bowl', note: 'Lacquered bowl with chopsticks & steam curls', defaultTint: '#dc2626' },
  { id: 'cutout_festive_thali', label: 'Royal Feast Thali', note: 'Brass platter with saffron & emerald bowls', defaultTint: '#eab308' },
  { id: 'cutout_birthday_cake', label: 'Lit Celebration Cake', note: 'Frosted tiered cake with glowing candles', defaultTint: '#f472b6' },
  { id: 'cutout_pizza_slice', label: 'Artisan Pizza Slice', note: 'Cheesy triangular slice with basil garnish', defaultTint: '#f59e0b' },
  { id: 'cutout_porcelain_teapot', label: 'Blue Porcelain Teapot', note: 'Delicate ceramic teapot with curved spout', defaultTint: '#2563eb' },
  { id: 'cutout_honey_pot', label: 'Golden Honey Jar', note: 'Amber glass jar with wooden dipper', defaultTint: '#f59e0b' },
  { id: 'cutout_vintage_trunk', label: 'Traveler Suitcase', note: 'Leather-strapped vintage steamer case', defaultTint: '#92400e' },
  { id: 'cutout_ship_helm', label: 'Galleon Ship Wheel', note: 'Eight-spoked oak captain helm', defaultTint: '#b45309' },
  { id: 'cutout_hot_air_balloon', label: 'Hot-Air Balloon', note: 'Striped festival envelope & wicker basket', defaultTint: '#ef4444' },
  { id: 'cutout_classic_bicycle', label: 'Classic City Bicycle', note: 'Spoked wheels & retro curved handlebars', defaultTint: '#0284c7' },
  { id: 'cutout_iron_anchor', label: 'Maritime Iron Anchor', note: 'Heavy forged ship anchor with rope coil', defaultTint: '#64748b' },
  { id: 'cutout_storm_lantern', label: 'Brass Storm Lantern', note: 'Caged glass oil lantern radiating warm light', defaultTint: '#facc15' },
  { id: 'cutout_field_binoculars', label: 'Explorer Binoculars', note: 'Twin-lens optical field glasses', defaultTint: '#38bdf8' },
  { id: 'cutout_steel_handcuffs', label: 'Noir Steel Handcuffs', note: 'Linked brushed-steel detective cuffs', defaultTint: '#cbd5e1' },
  { id: 'cutout_bank_safe_dial', label: 'Vault Combination Dial', note: 'Heavy circular steel vault wheel', defaultTint: '#94a3b8' },
  { id: 'cutout_skeleton_keys', label: 'Ring of Skeleton Keys', note: 'Antique brass keys on an iron hoop', defaultTint: '#d97706' },
  { id: 'cutout_skull_crystal', label: 'Mystic Crystal Skull', note: 'Faceted translucent amethyst skull relic', defaultTint: '#a855f7' },
  { id: 'cutout_cricket_bat', label: 'Willow Cricket Bat & Ball', note: 'Match willow blade with leather seam ball', defaultTint: '#dc2626' },
  { id: 'cutout_soccer_ball', label: 'Classic Match Soccer Ball', note: 'Hex-paneled black-and-white football', defaultTint: '#22c55e' },
  { id: 'cutout_boxing_gloves', label: 'Championship Gloves', note: 'Laced crimson leather boxing gloves', defaultTint: '#dc2626' },
  { id: 'cutout_gift_ribbon', label: 'Ribboned Gift Box', note: 'Festive wrapped parcel with golden bow', defaultTint: '#ec4899' },
];

export type ActArcPresetId =
  | 'mythic_odyssey'
  | 'noir_mystery'
  | 'royal_chronicle'
  | 'fable_journey'
  | 'elemental_storm'
  | 'cyber_thriller'
  | 'noir_investigation'
  | 'epic_space_odyssey'
  | 'documentary_explainer'
  // Wave 5: +16 4-Act Visual Arc Presets (9 -> 25 total)
  | 'cyberpunk_heist'
  | 'horror_descent'
  | 'romcom_seasons'
  | 'sports_underdog'
  | 'startup_journey'
  | 'space_odyssey'
  | 'murder_mystery'
  | 'fantasy_quest'
  | 'historical_empire'
  | 'nature_documentary'
  | 'kids_storybook'
  | 'time_travel_loop'
  | 'superhero_origin'
  | 'courtroom_verdict'
  | 'survival_expedition'
  | 'festival_celebration';

interface ActStageSpec {
  label: string;
  mood: MoodId;
  weather: WeatherId;
  haze: number;
  boundaryTransition: TransitionId;
  preferredCameras: CameraMoveId[];
}

export interface ActArcPresetMeta {
  id: ActArcPresetId;
  label: string;
  description: string;
  acts: [ActStageSpec, ActStageSpec, ActStageSpec, ActStageSpec];
}

export const ACT_ARC_PRESETS: ActArcPresetMeta[] = [
  {
    id: 'mythic_odyssey',
    label: 'Mythic Odyssey (Dawn → Trial → Wrath → Moonlit Peace)',
    description: 'Classic 4-act epic arc from golden setup through twilight mystery and crimson climax to silver resolution.',
    acts: [
      { label: 'Act I · Golden Setup', mood: 'golden_durbar', weather: 'petals', haze: 0.14, boundaryTransition: 'ink_fade', preferredCameras: ['slow_push', 'pan_right'] },
      { label: 'Act II · Twilight Inquiry', mood: 'twilight_temple', weather: 'mist', haze: 0.28, boundaryTransition: 'silhouette_wipe', preferredCameras: ['pan_left', 'slow_push'] },
      { label: 'Act III · Crimson Climax', mood: 'crimson_wrath', weather: 'embers', haze: 0.22, boundaryTransition: 'diagonal_slash', preferredCameras: ['slow_push', 'impact_shake'] },
      { label: 'Act IV · Moonlit Resolution', mood: 'moonlit_marble', weather: 'fireflies', haze: 0.18, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'noir_mystery',
    label: 'Folklore Noir (Dusk → Midnight → Temple → Teal Reveal)',
    description: 'High-contrast suspense arc ideal for Vikram-Betaal, riddles, and supernatural mysteries.',
    acts: [
      { label: 'Act I · Dusk Omen', mood: 'sandstone_dusk', weather: 'mist', haze: 0.24, boundaryTransition: 'ink_fade', preferredCameras: ['slow_push', 'pan_right'] },
      { label: 'Act II · Midnight Shadows', mood: 'midnight_banyan', weather: 'fireflies', haze: 0.34, boundaryTransition: 'silhouette_wipe', preferredCameras: ['pan_left', 'slow_push'] },
      { label: 'Act III · Sanctum Confrontation', mood: 'twilight_temple', weather: 'rain', haze: 0.3, boundaryTransition: 'diagonal_slash', preferredCameras: ['slow_push', 'impact_shake'] },
      { label: 'Act IV · Mystic Revelation', mood: 'mystic_teal', weather: 'fireflies', haze: 0.2, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'royal_chronicle',
    label: 'Royal Court Chronicle (Durbar → Quest → Crisis → Triumph)',
    description: 'Warm jewel-toned progression built for court wit, Tenali Rama, Akbar-Birbal, and royal sagas.',
    acts: [
      { label: 'Act I · Royal Court', mood: 'golden_durbar', weather: 'none', haze: 0.1, boundaryTransition: 'ink_fade', preferredCameras: ['pan_right', 'still'] },
      { label: 'Act II · Journey & Scheme', mood: 'emerald_jungle', weather: 'petals', haze: 0.2, boundaryTransition: 'silhouette_wipe', preferredCameras: ['pan_left', 'slow_push'] },
      { label: 'Act III · Royal Reckoning', mood: 'crimson_wrath', weather: 'embers', haze: 0.18, boundaryTransition: 'diagonal_slash', preferredCameras: ['slow_push', 'impact_shake'] },
      { label: 'Act IV · Crowned Resolution', mood: 'golden_durbar', weather: 'petals', haze: 0.12, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'fable_journey',
    label: 'Forest Fable (Emerald → Amber Dusk → Deep Night → Silver Moral)',
    description: 'Playful-to-wise progression for Panchatantra, Jataka, Aesop, and animal trickster tales.',
    acts: [
      { label: 'Act I · Sunlit Forest', mood: 'emerald_jungle', weather: 'petals', haze: 0.14, boundaryTransition: 'ink_fade', preferredCameras: ['pan_right', 'slow_push'] },
      { label: 'Act II · Amber Deception', mood: 'sandstone_dusk', weather: 'mist', haze: 0.22, boundaryTransition: 'silhouette_wipe', preferredCameras: ['pan_left', 'slow_push'] },
      { label: 'Act III · Midnight Peril', mood: 'midnight_banyan', weather: 'rain', haze: 0.3, boundaryTransition: 'diagonal_slash', preferredCameras: ['slow_push', 'impact_shake'] },
      { label: 'Act IV · Silver Wisdom', mood: 'moonlit_marble', weather: 'fireflies', haze: 0.16, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'elemental_storm',
    label: 'Elemental Tempest (Teal Calm → Mist → Storm Wrath → Golden Dawn)',
    description: 'Atmospheric weather-driven arc shifting from calm mist into full tempest and clear sunrise.',
    acts: [
      { label: 'Act I · Quiet Waters', mood: 'mystic_teal', weather: 'mist', haze: 0.24, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'pan_right'] },
      { label: 'Act II · Gathering Squall', mood: 'twilight_temple', weather: 'rain', haze: 0.36, boundaryTransition: 'silhouette_wipe', preferredCameras: ['pan_left', 'slow_push'] },
      { label: 'Act III · Fury of the Sky', mood: 'crimson_wrath', weather: 'embers', haze: 0.28, boundaryTransition: 'diagonal_slash', preferredCameras: ['impact_shake', 'slow_push'] },
      { label: 'Act IV · Golden Aftermath', mood: 'golden_durbar', weather: 'petals', haze: 0.12, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'cyber_thriller',
    label: 'Cyber Thriller (Neon Grid → Data Breach → Firewall → Dawn)',
    description: 'High-voltage cyberpunk progression with neon magenta, digital matrix rain, and lightning climax.',
    acts: [
      { label: 'Act I · Neon Underbelly', mood: 'cyber_magenta', weather: 'rain', haze: 0.24, boundaryTransition: 'ink_fade', preferredCameras: ['slow_push', 'pan_right'] },
      { label: 'Act II · Neural Infiltration', mood: 'deep_abyss', weather: 'data_matrix', haze: 0.2, boundaryTransition: 'silhouette_wipe', preferredCameras: ['pan_left', 'slow_push'] },
      { label: 'Act III · Core Overload', mood: 'crimson_wrath', weather: 'lightning_storm', haze: 0.28, boundaryTransition: 'diagonal_slash', preferredCameras: ['impact_shake', 'slow_push'] },
      { label: 'Act IV · Arctic Reboot', mood: 'arctic_aurora', weather: 'starfall', haze: 0.14, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'noir_investigation',
    label: 'Noir Investigation (Rainy Clue → Archive → Storm → Reveal)',
    description: 'Classic detective pacing shifting from monochrome rain to sepia clues and dramatic reveal.',
    acts: [
      { label: 'Act I · Cold Case Rain', mood: 'noir_monochrome', weather: 'rain', haze: 0.3, boundaryTransition: 'ink_fade', preferredCameras: ['slow_push', 'still'] },
      { label: 'Act II · Sepia Archive', mood: 'sepia_archive', weather: 'mist', haze: 0.22, boundaryTransition: 'silhouette_wipe', preferredCameras: ['pan_right', 'slow_push'] },
      { label: 'Act III · Midnight Ambush', mood: 'noir_monochrome', weather: 'lightning_storm', haze: 0.34, boundaryTransition: 'diagonal_slash', preferredCameras: ['impact_shake', 'slow_push'] },
      { label: 'Act IV · Sunlit Verdict', mood: 'sunlit_morning', weather: 'none', haze: 0.1, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'epic_space_odyssey',
    label: 'Epic Space Odyssey (Orbit → Nebula → Inferno → Aurora)',
    description: 'Widescreen sci-fi voyage from starfield silence through deep-space peril to alien aurora.',
    acts: [
      { label: 'Act I · Orbital Launch', mood: 'deep_abyss', weather: 'starfall', haze: 0.12, boundaryTransition: 'ink_fade', preferredCameras: ['slow_push', 'pan_right'] },
      { label: 'Act II · Red Frontier', mood: 'sandstone_dusk', weather: 'sandstorm', haze: 0.28, boundaryTransition: 'silhouette_wipe', preferredCameras: ['pan_left', 'slow_push'] },
      { label: 'Act III · Solar Flare', mood: 'volcanic_inferno', weather: 'embers', haze: 0.24, boundaryTransition: 'diagonal_slash', preferredCameras: ['impact_shake', 'slow_push'] },
      { label: 'Act IV · New Horizon', mood: 'arctic_aurora', weather: 'starfall', haze: 0.16, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'documentary_explainer',
    label: 'Documentary Explainer (Morning → Archive → Insight → Sakura)',
    description: 'Clean, bright pacing tailored for educational explainers, video essays, and historical deep dives.',
    acts: [
      { label: 'Act I · Hook & Context', mood: 'sunlit_morning', weather: 'none', haze: 0.08, boundaryTransition: 'ink_fade', preferredCameras: ['slow_push', 'still'] },
      { label: 'Act II · Historical Evidence', mood: 'sepia_archive', weather: 'mist', haze: 0.14, boundaryTransition: 'silhouette_wipe', preferredCameras: ['pan_right', 'pan_left'] },
      { label: 'Act III · Core Mechanism', mood: 'mystic_teal', weather: 'data_matrix', haze: 0.12, boundaryTransition: 'ink_fade', preferredCameras: ['slow_push', 'still'] },
      { label: 'Act IV · Key Takeaway', mood: 'sakura_dawn', weather: 'sakura_blossoms', haze: 0.1, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  // Wave 5: +16 4-Act Visual Arc Presets (9 -> 25 total)
  {
    id: 'cyberpunk_heist',
    label: 'Cyberpunk Heist (Neon Prep → Infiltration → Alarm → Rain Escape)',
    description: 'High-voltage neon-blue to magenta-spark progression for futuristic heist thrillers.',
    acts: [
      { label: 'Act I · Crew Briefing', mood: 'neon_tokyo_blue', weather: 'neon_sparks', haze: 0.16, boundaryTransition: 'ink_fade', preferredCameras: ['slow_push', 'pan_right'] },
      { label: 'Act II · Vault Infiltration', mood: 'emerald_matrix', weather: 'data_matrix', haze: 0.22, boundaryTransition: 'silhouette_wipe', preferredCameras: ['pan_left', 'slow_push'] },
      { label: 'Act III · Laser Breach', mood: 'cyber_magenta', weather: 'plasma_arcs', haze: 0.26, boundaryTransition: 'diagonal_slash', preferredCameras: ['impact_shake', 'slow_push'] },
      { label: 'Act IV · Neon Getaway', mood: 'cobalt_midnight', weather: 'rain', haze: 0.18, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'horror_descent',
    label: 'Horror Descent (Foggy Arrival → Catacombs → Blood Moon → Cold Dawn)',
    description: 'Chilling tension arc spiraling from creeping fog into blood-moon dread.',
    acts: [
      { label: 'Act I · Eerie Arrival', mood: 'storm_slate', weather: 'fog_bank', haze: 0.28, boundaryTransition: 'ink_fade', preferredCameras: ['slow_push', 'pan_left'] },
      { label: 'Act II · Creeping Dread', mood: 'midnight_banyan', weather: 'ash_fallout', haze: 0.34, boundaryTransition: 'silhouette_wipe', preferredCameras: ['pan_right', 'slow_push'] },
      { label: 'Act III · Blood Moon Terror', mood: 'blood_moon_crimson', weather: 'lightning_storm', haze: 0.3, boundaryTransition: 'crimson_flash', preferredCameras: ['impact_shake', 'slow_push'] },
      { label: 'Act IV · Pale Survival', mood: 'noir_monochrome', weather: 'mist', haze: 0.22, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'romcom_seasons',
    label: 'Rom-Com Seasons (Spring → Golden Summer → Autumn → Winter Glow)',
    description: 'Heartwarming four-season emotional arc with petals, golden hour, autumn leaves, and snow.',
    acts: [
      { label: 'Act I · Spring Meet-Cute', mood: 'spring_meadow', weather: 'dandelion_seeds', haze: 0.1, boundaryTransition: 'ink_fade', preferredCameras: ['pan_right', 'slow_push'] },
      { label: 'Act II · Golden Sparks', mood: 'golden_hour_cinema', weather: 'golden_pollen', haze: 0.14, boundaryTransition: 'ink_fade', preferredCameras: ['slow_push', 'still'] },
      { label: 'Act III · Autumn Misunderstanding', mood: 'autumn_amber', weather: 'autumn_leaves', haze: 0.2, boundaryTransition: 'silhouette_wipe', preferredCameras: ['pan_left', 'slow_pull'] },
      { label: 'Act IV · Starlit Reunion', mood: 'lavender_twilight', weather: 'snow', haze: 0.14, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'sports_underdog',
    label: 'Sports Underdog (Training → Setback → Championship → Confetti)',
    description: 'Inspiring athletic arc culminating under stadium floodlights and confetti.',
    acts: [
      { label: 'Act I · Early Drills', mood: 'sunlit_morning', weather: 'none', haze: 0.08, boundaryTransition: 'ink_fade', preferredCameras: ['pan_right', 'slow_push'] },
      { label: 'Act II · Rainy Setback', mood: 'storm_slate', weather: 'rain', haze: 0.22, boundaryTransition: 'silhouette_wipe', preferredCameras: ['slow_pull', 'pan_left'] },
      { label: 'Act III · Match Point', mood: 'cobalt_midnight', weather: 'neon_sparks', haze: 0.16, boundaryTransition: 'diagonal_slash', preferredCameras: ['impact_shake', 'slow_push'] },
      { label: 'Act IV · Trophy Victory', mood: 'golden_hour_cinema', weather: 'confetti_shower', haze: 0.12, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'startup_journey',
    label: 'Startup Journey (Garage Spark → Crunch → Pivot Crisis → Launch)',
    description: 'Founder documentary visual progression from garage prototypes to keynote triumph.',
    acts: [
      { label: 'Act I · Garage Spark', mood: 'candlelit_parchment', weather: 'none', haze: 0.1, boundaryTransition: 'ink_fade', preferredCameras: ['slow_push', 'still'] },
      { label: 'Act II · Late-Night Code', mood: 'neon_tokyo_blue', weather: 'data_matrix', haze: 0.16, boundaryTransition: 'silhouette_wipe', preferredCameras: ['pan_right', 'slow_push'] },
      { label: 'Act III · Market Storm', mood: 'crimson_wrath', weather: 'lightning_storm', haze: 0.2, boundaryTransition: 'diagonal_slash', preferredCameras: ['impact_shake', 'pan_left'] },
      { label: 'Act IV · Keynote Launch', mood: 'solarpunk_lime', weather: 'confetti_shower', haze: 0.1, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'space_odyssey',
    label: 'Space Odyssey (Launch → Deep Void → Meteor Crisis → Nebula Dawn)',
    description: 'Cosmic voyage from orbital launch through meteor storms to alien sunrise.',
    acts: [
      { label: 'Act I · Orbital Launch', mood: 'cobalt_midnight', weather: 'starlight_dust', haze: 0.12, boundaryTransition: 'ink_fade', preferredCameras: ['slow_push', 'pan_right'] },
      { label: 'Act II · Deep Void Drift', mood: 'deep_space_void', weather: 'aurora_ribbons', haze: 0.18, boundaryTransition: 'silhouette_wipe', preferredCameras: ['pan_left', 'slow_pull'] },
      { label: 'Act III · Meteor Impact', mood: 'volcanic_inferno', weather: 'meteor_shower', haze: 0.22, boundaryTransition: 'diagonal_slash', preferredCameras: ['impact_shake', 'slow_push'] },
      { label: 'Act IV · New World Horizon', mood: 'ice_palace_cyan', weather: 'starfall', haze: 0.14, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'murder_mystery',
    label: 'Murder Mystery (Parlor → Clues → Blackout → Spotlight Reveal)',
    description: 'Classic whodunit arc moving from warm manor parlors to stark noir revelations.',
    acts: [
      { label: 'Act I · Manor Gathering', mood: 'candlelit_parchment', weather: 'none', haze: 0.14, boundaryTransition: 'ink_fade', preferredCameras: ['pan_right', 'still'] },
      { label: 'Act II · Foggy Clues', mood: 'noir_monochrome', weather: 'fog_bank', haze: 0.26, boundaryTransition: 'silhouette_wipe', preferredCameras: ['slow_push', 'pan_left'] },
      { label: 'Act III · Storm Blackout', mood: 'monsoon_indigo', weather: 'lightning_storm', haze: 0.3, boundaryTransition: 'crimson_flash', preferredCameras: ['impact_shake', 'slow_push'] },
      { label: 'Act IV · Truth Unmasked', mood: 'obsidian_gold', weather: 'starlight_dust', haze: 0.14, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'fantasy_quest',
    label: 'Fantasy Quest (Shire → Arcane Woods → Dragon Lair → Crowned)',
    description: 'High-fantasy fellowship journey across meadows, enchanted groves, and volcanic peaks.',
    acts: [
      { label: 'Act I · Peaceful Glade', mood: 'spring_meadow', weather: 'golden_pollen', haze: 0.12, boundaryTransition: 'ink_fade', preferredCameras: ['pan_right', 'slow_push'] },
      { label: 'Act II · Mystic Canopy', mood: 'royal_amethyst', weather: 'fireflies', haze: 0.22, boundaryTransition: 'silhouette_wipe', preferredCameras: ['pan_left', 'slow_push'] },
      { label: 'Act III · Dragon Crucible', mood: 'volcanic_inferno', weather: 'volcanic_cinders', haze: 0.24, boundaryTransition: 'diagonal_slash', preferredCameras: ['impact_shake', 'slow_push'] },
      { label: 'Act IV · Golden Return', mood: 'golden_durbar', weather: 'floating_lanterns', haze: 0.14, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'historical_empire',
    label: 'Historical Empire (Chronicle → Campaign → Siege → Legacy)',
    description: 'Archival-to-epic progression crafted for world history and empire documentaries.',
    acts: [
      { label: 'Act I · Archival Rise', mood: 'vintage_kodachrome', weather: 'none', haze: 0.12, boundaryTransition: 'ink_fade', preferredCameras: ['pan_right', 'slow_push'] },
      { label: 'Act II · Desert March', mood: 'desert_mirage', weather: 'sandstorm', haze: 0.22, boundaryTransition: 'silhouette_wipe', preferredCameras: ['pan_left', 'slow_push'] },
      { label: 'Act III · Imperial Siege', mood: 'crimson_wrath', weather: 'ash_fallout', haze: 0.24, boundaryTransition: 'diagonal_slash', preferredCameras: ['impact_shake', 'slow_push'] },
      { label: 'Act IV · Monumental Legacy', mood: 'obsidian_gold', weather: 'golden_pollen', haze: 0.14, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'nature_documentary',
    label: 'Nature Documentary (Coral Reef → Savanna → Monsoon → Aurora)',
    description: 'Planet-Earth style biome showcase transitioning across ocean, grassland, storm, and poles.',
    acts: [
      { label: 'Act I · Living Reef', mood: 'ocean_turquoise', weather: 'underwater_bubbles', haze: 0.12, boundaryTransition: 'ink_fade', preferredCameras: ['pan_right', 'slow_push'] },
      { label: 'Act II · Golden Savanna', mood: 'golden_hour_cinema', weather: 'golden_pollen', haze: 0.16, boundaryTransition: 'ink_fade', preferredCameras: ['pan_left', 'slow_push'] },
      { label: 'Act III · Monsoon Surge', mood: 'monsoon_indigo', weather: 'rain', haze: 0.24, boundaryTransition: 'silhouette_wipe', preferredCameras: ['slow_push', 'still'] },
      { label: 'Act IV · Polar Wonder', mood: 'arctic_aurora', weather: 'aurora_ribbons', haze: 0.14, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'kids_storybook',
    label: 'Kids Storybook (Pastel Morning → Candy Adventure → Oops! → Party)',
    description: 'Bright, friendly color progression with bubbles, confetti, and floating lanterns.',
    acts: [
      { label: 'Act I · Sunny Hello', mood: 'pastel_storybook', weather: 'dandelion_seeds', haze: 0.08, boundaryTransition: 'ink_fade', preferredCameras: ['pan_right', 'still'] },
      { label: 'Act II · Candyland Quest', mood: 'candyland_pop', weather: 'golden_pollen', haze: 0.1, boundaryTransition: 'silhouette_wipe', preferredCameras: ['slow_push', 'pan_left'] },
      { label: 'Act III · Silly Storm', mood: 'lavender_twilight', weather: 'rain', haze: 0.16, boundaryTransition: 'ink_fade', preferredCameras: ['slow_push', 'still'] },
      { label: 'Act IV · Happy Celebration', mood: 'sunset_coral', weather: 'confetti_shower', haze: 0.08, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'time_travel_loop',
    label: 'Time-Travel Loop (Clockwork → Glitch Rift → Ancient Past → Future)',
    description: 'Temporal whiplash arc bridging Victorian steampunk, plasma rifts, and solarpunk futures.',
    acts: [
      { label: 'Act I · Brass Lab', mood: 'copper_steampunk', weather: 'golden_pollen', haze: 0.14, boundaryTransition: 'ink_fade', preferredCameras: ['slow_push', 'still'] },
      { label: 'Act II · Quantum Rift', mood: 'royal_amethyst', weather: 'plasma_arcs', haze: 0.24, boundaryTransition: 'diagonal_slash', preferredCameras: ['impact_shake', 'slow_push'] },
      { label: 'Act III · Lost Era', mood: 'sepia_archive', weather: 'ash_fallout', haze: 0.2, boundaryTransition: 'silhouette_wipe', preferredCameras: ['pan_left', 'slow_push'] },
      { label: 'Act IV · Tomorrow Restored', mood: 'solarpunk_lime', weather: 'starlight_dust', haze: 0.12, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'superhero_origin',
    label: 'Superhero Origin (City Night → Awakening → Showdown → Rooftop)',
    description: 'Comic-book cinematic arc from gritty city night to lightning-charged rooftop triumph.',
    acts: [
      { label: 'Act I · Ordinary Night', mood: 'storm_slate', weather: 'rain', haze: 0.18, boundaryTransition: 'ink_fade', preferredCameras: ['pan_right', 'slow_push'] },
      { label: 'Act II · Power Surge', mood: 'neon_tokyo_blue', weather: 'plasma_arcs', haze: 0.2, boundaryTransition: 'diagonal_slash', preferredCameras: ['slow_push', 'impact_shake'] },
      { label: 'Act III · Villain Clash', mood: 'crimson_wrath', weather: 'lightning_storm', haze: 0.24, boundaryTransition: 'crimson_flash', preferredCameras: ['impact_shake', 'slow_push'] },
      { label: 'Act IV · Heroic Dawn', mood: 'golden_hour_cinema', weather: 'starlight_dust', haze: 0.12, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'courtroom_verdict',
    label: 'Courtroom Verdict (Opening → Cross-Exam → Bombshell → Justice)',
    description: 'High-stakes legal drama lighting progression for courtroom debates and reveals.',
    acts: [
      { label: 'Act I · Opening Statement', mood: 'candlelit_parchment', weather: 'none', haze: 0.08, boundaryTransition: 'ink_fade', preferredCameras: ['still', 'slow_push'] },
      { label: 'Act II · Cross-Examination', mood: 'storm_slate', weather: 'none', haze: 0.14, boundaryTransition: 'silhouette_wipe', preferredCameras: ['pan_right', 'pan_left'] },
      { label: 'Act III · Shocking Exhibit', mood: 'obsidian_gold', weather: 'neon_sparks', haze: 0.18, boundaryTransition: 'diagonal_slash', preferredCameras: ['slow_push', 'impact_shake'] },
      { label: 'Act IV · Final Verdict', mood: 'sunlit_morning', weather: 'golden_pollen', haze: 0.1, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'survival_expedition',
    label: 'Survival Expedition (Basecamp → Blizzard → Toxic Ruins → Rescue)',
    description: 'Extreme-environment survival arc pushing through hail, blizzards, and wasteland hazards.',
    acts: [
      { label: 'Act I · Frontier Camp', mood: 'autumn_amber', weather: 'mist', haze: 0.16, boundaryTransition: 'ink_fade', preferredCameras: ['pan_right', 'slow_push'] },
      { label: 'Act II · Whiteout Pass', mood: 'ice_palace_cyan', weather: 'blizzard_gale', haze: 0.28, boundaryTransition: 'silhouette_wipe', preferredCameras: ['pan_left', 'slow_push'] },
      { label: 'Act III · Hazard Zone', mood: 'toxic_wasteland', weather: 'acid_rain', haze: 0.3, boundaryTransition: 'diagonal_slash', preferredCameras: ['impact_shake', 'slow_push'] },
      { label: 'Act IV · Signal Flare Rescue', mood: 'sunset_coral', weather: 'floating_lanterns', haze: 0.14, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
  {
    id: 'festival_celebration',
    label: 'Festival Celebration (Lantern Dusk → Parade → Fireworks → Starlight)',
    description: 'Joyous cultural festival arc brimming with warm lanterns, blossoms, and confetti.',
    acts: [
      { label: 'Act I · Dusk Preparation', mood: 'sunset_coral', weather: 'petals', haze: 0.12, boundaryTransition: 'ink_fade', preferredCameras: ['pan_right', 'slow_push'] },
      { label: 'Act II · Grand Procession', mood: 'golden_durbar', weather: 'floating_lanterns', haze: 0.14, boundaryTransition: 'silhouette_wipe', preferredCameras: ['pan_left', 'slow_push'] },
      { label: 'Act III · Midnight Finale', mood: 'royal_amethyst', weather: 'confetti_shower', haze: 0.16, boundaryTransition: 'diagonal_slash', preferredCameras: ['slow_push', 'still'] },
      { label: 'Act IV · Starlit Blessing', mood: 'cobalt_midnight', weather: 'starlight_dust', haze: 0.12, boundaryTransition: 'ink_fade', preferredCameras: ['slow_pull', 'still'] },
    ],
  },
];

// Deterministic PRNG (Mulberry32) so every seed reproduces the exact same plate/prop
function createSeededRng(seed: number): () => number {
  let a = (Math.floor(seed) ^ 0x9e3779b9) >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface MoodPalette {
  skyTop: string;
  skyMid: string;
  skyLow: string;
  glow: string;
  silhouetteFar: string;
  silhouetteMid: string;
  ground: string;
  accent: string;
}

const MOOD_PALETTES: Record<MoodId, MoodPalette> = {
  midnight_banyan: {
    skyTop: '#070b1a',
    skyMid: '#131d3a',
    skyLow: '#263459',
    glow: '#8fb4ff',
    silhouetteFar: '#0f1730',
    silhouetteMid: '#0a1022',
    ground: '#060a14',
    accent: '#f2c85b',
  },
  crimson_wrath: {
    skyTop: '#160508',
    skyMid: '#4c1118',
    skyLow: '#9e2a1e',
    glow: '#ff7040',
    silhouetteFar: '#2b0a10',
    silhouetteMid: '#1a060a',
    ground: '#0f0407',
    accent: '#ffb347',
  },
  golden_durbar: {
    skyTop: '#231326',
    skyMid: '#7d4128',
    skyLow: '#e59a42',
    glow: '#ffe08a',
    silhouetteFar: '#402124',
    silhouetteMid: '#281318',
    ground: '#170b10',
    accent: '#ffd86b',
  },
  sandstone_dusk: {
    skyTop: '#1d1834',
    skyMid: '#683b4a',
    skyLow: '#d47e4f',
    glow: '#ffbe7d',
    silhouetteFar: '#392234',
    silhouetteMid: '#241422',
    ground: '#140c14',
    accent: '#f5b25b',
  },
  twilight_temple: {
    skyTop: '#100c24',
    skyMid: '#2e1d4c',
    skyLow: '#7a3f6b',
    glow: '#f3a6ff',
    silhouetteFar: '#1f1436',
    silhouetteMid: '#140c24',
    ground: '#0b0714',
    accent: '#f5c25b',
  },
  moonlit_marble: {
    skyTop: '#0b1424',
    skyMid: '#1e3554',
    skyLow: '#5a82a8',
    glow: '#d4ecff',
    silhouetteFar: '#172740',
    silhouetteMid: '#0f1b2e',
    ground: '#08101c',
    accent: '#bce3ff',
  },
  emerald_jungle: {
    skyTop: '#081c1a',
    skyMid: '#16463c',
    skyLow: '#42876b',
    glow: '#a5f5c6',
    silhouetteFar: '#0f3028',
    silhouetteMid: '#091f1a',
    ground: '#05120f',
    accent: '#8cf2a8',
  },
  mystic_teal: {
    skyTop: '#061520',
    skyMid: '#0e3c4c',
    skyLow: '#2b7d8a',
    glow: '#7cf5ea',
    silhouetteFar: '#0b2b36',
    silhouetteMid: '#071c24',
    ground: '#041016',
    accent: '#5ef2e6',
  },
  cyber_magenta: {
    skyTop: '#0a041c',
    skyMid: '#290a47',
    skyLow: '#5e147a',
    glow: '#ff5ce8',
    silhouetteFar: '#19062e',
    silhouetteMid: '#10041f',
    ground: '#080212',
    accent: '#00f0ff',
  },
  noir_monochrome: {
    skyTop: '#07080a',
    skyMid: '#1c2028',
    skyLow: '#3a414f',
    glow: '#e2e8f0',
    silhouetteFar: '#14171e',
    silhouetteMid: '#0d0f14',
    ground: '#07080b',
    accent: '#f8fafc',
  },
  arctic_aurora: {
    skyTop: '#031221',
    skyMid: '#0b324a',
    skyLow: '#1b6b7a',
    glow: '#6ee7d8',
    silhouetteFar: '#092438',
    silhouetteMid: '#061926',
    ground: '#04111c',
    accent: '#38bdf8',
  },
  sunlit_morning: {
    skyTop: '#1c4d82',
    skyMid: '#5596d4',
    skyLow: '#f5ce8a',
    glow: '#fff3b8',
    silhouetteFar: '#2f5478',
    silhouetteMid: '#223e57',
    ground: '#182b3b',
    accent: '#f97316',
  },
  volcanic_inferno: {
    skyTop: '#170504',
    skyMid: '#4f130a',
    skyLow: '#9c2d12',
    glow: '#ff8a3d',
    silhouetteFar: '#2b0907',
    silhouetteMid: '#1a0605',
    ground: '#0f0404',
    accent: '#facc15',
  },
  deep_abyss: {
    skyTop: '#020a17',
    skyMid: '#061f38',
    skyLow: '#0d3e61',
    glow: '#67e8f9',
    silhouetteFar: '#051729',
    silhouetteMid: '#03101d',
    ground: '#020a12',
    accent: '#2dd4bf',
  },
  sakura_dawn: {
    skyTop: '#231336',
    skyMid: '#6b2f63',
    skyLow: '#eb9bb8',
    glow: '#ffd6e8',
    silhouetteFar: '#381d45',
    silhouetteMid: '#24122e',
    ground: '#170b1f',
    accent: '#f9a8d4',
  },
  sepia_archive: {
    skyTop: '#1c130d',
    skyMid: '#422f1f',
    skyLow: '#7d5c3d',
    glow: '#f2dfb8',
    silhouetteFar: '#2e2015',
    silhouetteMid: '#1f150e',
    ground: '#140d09',
    accent: '#d99a38',
  },
  ...(Object.fromEntries(
    Object.entries(ATLAS_MOOD_PALETTES).map(([k, p]) => [
      k,
      {
        skyTop: p.skyTop,
        skyMid: p.skyMid,
        skyLow: p.skyLow,
        glow: p.moon,
        silhouetteFar: p.farSil,
        silhouetteMid: p.shadowTint,
        ground: p.ground,
        accent: p.accent,
      },
    ])
  ) as Record<keyof typeof ATLAS_MOOD_PALETTES, MoodPalette>),
};

export interface ProceduralBackdropOptions {
  theme: BackdropThemeId;
  mood?: MoodId;
  seed?: number;
  width?: number;
  height?: number;
}

/**
 * Generates a rich painted 1920x1080 PNG data URL in the browser (or lightweight SVG data URL in Node/SSR).
 */
export function generateProceduralBackdropDataUrl(opts: ProceduralBackdropOptions): {
  dataUrl: string;
  label: string;
} {
  const meta = BACKDROP_THEMES.find((t) => t.id === opts.theme) || BACKDROP_THEMES[0];
  const mood: MoodId = opts.mood || meta.defaultMood;
  const seed = Number.isFinite(opts.seed) ? Math.floor(opts.seed!) : 101;
  const w = Math.max(640, Math.min(1920, opts.width || 1920));
  const h = Math.max(360, Math.min(1080, opts.height || 1080));
  const pal = MOOD_PALETTES[mood] || MOOD_PALETTES.twilight_temple;
  const label = `${meta.label} #${Math.abs(seed) % 1000}`;

  if (typeof document === 'undefined') {
    const rngNode = createSeededRng(seed * 31 + meta.id.length * 997 + meta.id.charCodeAt(0) * 17);
    const orbCx = Math.round(w * (0.28 + rngNode() * 0.44));
    const orbCy = Math.round(h * (0.24 + rngNode() * 0.16));
    const peakY = Math.round(h * (0.44 + rngNode() * 0.16));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" data-theme="${meta.id}" data-seed="${seed}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${pal.skyTop}"/><stop offset="55%" stop-color="${pal.skyMid}"/><stop offset="100%" stop-color="${pal.skyLow}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><circle cx="${orbCx}" cy="${orbCy}" r="${Math.round(h * 0.14)}" fill="${pal.glow}" opacity="0.85"/><polygon points="0,${Math.round(h * 0.76)} ${Math.round(w * 0.32)},${peakY} ${Math.round(w * 0.68)},${Math.round(peakY + h * 0.08)} ${w},${Math.round(h * 0.76)}" fill="${pal.silhouetteFar}"/><rect y="${Math.round(h * 0.76)}" width="${w}" height="${Math.round(h * 0.24)}" fill="${pal.ground}"/><circle cx="${orbCx}" cy="${Math.round(h * 0.76)}" r="26" fill="${meta.accentHex}" opacity="0.55"/></svg>`;
    const encoded = typeof Buffer !== 'undefined'
      ? Buffer.from(svg, 'utf8').toString('base64')
      : btoa(unescape(encodeURIComponent(svg)));
    return { dataUrl: `data:image/svg+xml;base64,${encoded}`, label };
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { dataUrl: '', label };
  }

  const rng = createSeededRng(seed * 31 + meta.id.length * 997);

  // 1. Multi-stop painterly sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.85);
  skyGrad.addColorStop(0, pal.skyTop);
  skyGrad.addColorStop(0.54, pal.skyMid);
  skyGrad.addColorStop(1, pal.skyLow);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Subtle starfield / atmospheric dust in upper sky
  const starCount = opts.theme === 'starlit_desert_oasis' ? 160 : 65;
  for (let i = 0; i < starCount; i++) {
    const sx = rng() * w;
    const sy = rng() * h * 0.55;
    const sr = 0.8 + rng() * 2.1;
    ctx.fillStyle = `rgba(255,250,235,${(0.18 + rng() * 0.65).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Celestial focal orb (eclipse, moon, or sun glow)
  const orbX = w * (0.34 + rng() * 0.32);
  const orbY = h * (0.24 + rng() * 0.12);
  const orbR = h * (opts.theme === 'eclipse_lotus_courtyard' ? 0.125 : 0.11);
  const halo = ctx.createRadialGradient(orbX, orbY, orbR * 0.25, orbX, orbY, orbR * 3.8);
  halo.addColorStop(0, pal.glow);
  halo.addColorStop(0.45, `${pal.glow}44`);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.fillStyle = pal.glow;
  ctx.beginPath();
  ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
  ctx.fill();
  if (opts.theme === 'eclipse_lotus_courtyard') {
    ctx.fillStyle = pal.skyTop;
    ctx.beginPath();
    ctx.arc(orbX, orbY, orbR * 0.84, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 4. Layered distant mountains / cloud banks
  const drawRidge = (baseY: number, amp: number, color: string, jagged: boolean) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    const steps = jagged ? 16 : 10;
    for (let i = 0; i <= steps; i++) {
      const px = (i / steps) * w;
      const py = baseY - (rng() * amp + Math.sin(i * 0.9 + seed) * amp * 0.45);
      if (i === 0) ctx.lineTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  };

  drawRidge(h * 0.66, h * 0.15, pal.silhouetteFar, opts.theme === 'snow_monastery' || opts.theme === 'crimson_volcano_citadel');
  drawRidge(h * 0.74, h * 0.1, pal.silhouetteMid, opts.theme === 'crimson_volcano_citadel');

  // 5. Theme-specific architectural & scenic midground layer
  const horizonY = h * 0.77;
  ctx.save();
  if (opts.theme === 'eclipse_lotus_courtyard' || opts.theme === 'golden_sun_temple') {
    // Scalloped Mughal/temple colonnade silhouettes + glowing sanctum doorway
    const archCount = 5;
    const archW = w / archCount;
    ctx.fillStyle = pal.silhouetteMid;
    for (let i = 0; i < archCount; i++) {
      const ax = i * archW;
      ctx.fillRect(ax, h * 0.2, archW * 0.16, h * 0.6);
      ctx.beginPath();
      ctx.moveTo(ax, h * 0.22);
      ctx.quadraticCurveTo(ax + archW * 0.5, h * 0.34, ax + archW, h * 0.22);
      ctx.lineTo(ax + archW, 0);
      ctx.lineTo(ax, 0);
      ctx.closePath();
      ctx.fill();
    }
    // Central temple shikharas in silhouette
    const cx = w * 0.5;
    ctx.fillStyle = pal.silhouetteFar;
    for (let tier = 0; tier < 5; tier++) {
      const tw = w * (0.28 - tier * 0.045);
      const ty = horizonY - h * 0.08 * (tier + 1);
      ctx.fillRect(cx - tw / 2, ty, tw, h * 0.085);
    }
    // Mirror lotus water reflection
    const poolGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    poolGrad.addColorStop(0, `${pal.glow}66`);
    poolGrad.addColorStop(0.5, pal.skyMid);
    poolGrad.addColorStop(1, pal.ground);
    ctx.fillStyle = poolGrad;
    ctx.fillRect(0, horizonY, w, h - horizonY);
    for (let i = 0; i < 14; i++) {
      const lx = w * (0.08 + rng() * 0.84);
      const ly = horizonY + (h - horizonY) * (0.2 + rng() * 0.7);
      ctx.fillStyle = i % 3 === 0 ? meta.accentHex : '#2d6a54';
      ctx.beginPath();
      ctx.ellipse(lx, ly, 24 + rng() * 22, 6 + rng() * 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (opts.theme === 'floating_cloud_citadel') {
    // Cloud pillows
    for (let i = 0; i < 18; i++) {
      const cx = rng() * w;
      const cy = h * (0.58 + rng() * 0.32);
      const rx = 120 + rng() * 220;
      const ry = 42 + rng() * 68;
      ctx.fillStyle = i % 2 === 0 ? `${pal.glow}55` : `${pal.skyLow}88`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Floating palace spires
    for (let s = 0; s < 3; s++) {
      const ix = w * (0.22 + s * 0.28);
      const iy = h * (0.56 - (s === 1 ? 0.1 : 0));
      ctx.fillStyle = pal.silhouetteMid;
      ctx.beginPath();
      ctx.moveTo(ix - 130, iy);
      ctx.lineTo(ix + 130, iy);
      ctx.lineTo(ix, iy + 115);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = pal.accent;
      ctx.fillRect(ix - 70, iy - 95, 140, 95);
      ctx.beginPath();
      ctx.moveTo(ix - 85, iy - 95);
      ctx.lineTo(ix, iy - 195);
      ctx.lineTo(ix + 85, iy - 95);
      ctx.closePath();
      ctx.fill();
    }
  } else if (opts.theme === 'lantern_monsoon_market') {
    // Tiered market awnings + warm glowing lanterns
    ctx.fillStyle = pal.silhouetteMid;
    ctx.fillRect(0, h * 0.34, w * 0.26, h * 0.45);
    ctx.fillRect(w * 0.74, h * 0.3, w * 0.26, h * 0.49);
    // Catenary lantern strings
    ctx.strokeStyle = 'rgba(20,12,16,0.75)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w * 0.15, h * 0.24);
    ctx.quadraticCurveTo(w * 0.5, h * 0.42, w * 0.85, h * 0.22);
    ctx.stroke();
    for (let i = 0; i < 9; i++) {
      const t = (i + 0.5) / 9;
      const lx = w * (0.15 + t * 0.7);
      const ly = h * (0.24 + Math.sin(t * Math.PI) * 0.11);
      const lg = ctx.createRadialGradient(lx, ly + 18, 6, lx, ly + 18, 66);
      lg.addColorStop(0, '#ffd875');
      lg.addColorStop(0.45, 'rgba(255,120,56,0.45)');
      lg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(lx - 70, ly - 52, 140, 140);
      ctx.fillStyle = i % 2 === 0 ? '#ff6a3d' : '#ffbd4a';
      ctx.beginPath();
      ctx.ellipse(lx, ly + 18, 18, 25, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (opts.theme === 'coral_sea_cavern') {
    // Sunbeam shafts from water surface
    for (let i = 0; i < 6; i++) {
      const bx = w * (0.15 + i * 0.14);
      const grad = ctx.createLinearGradient(bx, 0, bx + 120, h * 0.85);
      grad.addColorStop(0, `${pal.glow}45`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(bx - 35, 0);
      ctx.lineTo(bx + 55, 0);
      ctx.lineTo(bx + 190, h * 0.88);
      ctx.lineTo(bx + 20, h * 0.88);
      ctx.closePath();
      ctx.fill();
    }
    // Branching coral pillars
    ctx.fillStyle = pal.silhouetteMid;
    for (let i = 0; i < 10; i++) {
      const cx = rng() * w;
      const ch = h * (0.22 + rng() * 0.3);
      ctx.beginPath();
      ctx.roundRect(cx - 18, horizonY - ch, 36, ch + 40, 18);
      ctx.fill();
      ctx.fillStyle = i % 2 === 0 ? '#3ce0d0' : '#ff7b89';
      ctx.beginPath();
      ctx.arc(cx, horizonY - ch, 12 + rng() * 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.silhouetteMid;
    }
  } else if (opts.theme === 'snow_monastery') {
    // Snow caps & cliffside monastery + prayer flags
    ctx.fillStyle = 'rgba(230,244,255,0.22)';
    for (let i = 0; i < 4; i++) {
      const px = w * (0.12 + i * 0.25);
      ctx.beginPath();
      ctx.moveTo(px - 180, h * 0.65);
      ctx.lineTo(px, h * (0.22 + (i % 2) * 0.08));
      ctx.lineTo(px + 180, h * 0.65);
      ctx.closePath();
      ctx.fill();
    }
    // Monastery walls & warm windows
    ctx.fillStyle = pal.silhouetteMid;
    ctx.fillRect(w * 0.62, h * 0.44, w * 0.24, h * 0.34);
    ctx.fillStyle = '#ffcf6b';
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        ctx.fillRect(w * 0.645 + c * 74, h * 0.49 + r * 68, 22, 34);
      }
    }
    // Prayer flag string
    const flagColors = ['#3b82f6', '#f8fafc', '#ef4444', '#22c55e', '#facc15'];
    for (let i = 0; i < 16; i++) {
      const t = i / 15;
      const fx = w * (0.04 + t * 0.62);
      const fy = h * (0.24 + Math.sin(t * Math.PI) * 0.14);
      ctx.fillStyle = flagColors[i % flagColors.length];
      ctx.fillRect(fx, fy, 28, 34);
    }
  } else if (opts.theme === 'starlit_desert_oasis') {
    // Sweeping dunes + oasis + silhouettes of date palms
    ctx.fillStyle = pal.silhouetteMid;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.72);
    ctx.quadraticCurveTo(w * 0.3, h * 0.56, w * 0.62, h * 0.74);
    ctx.quadraticCurveTo(w * 0.84, h * 0.6, w, h * 0.7);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    // Glowing oasis pool
    ctx.fillStyle = `${pal.glow}66`;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.84, w * 0.28, h * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    // Date palm silhouettes
    const palmXs = [w * 0.18, w * 0.26, w * 0.76, w * 0.84];
    ctx.strokeStyle = pal.ground;
    for (const px of palmXs) {
      const topY = h * (0.4 + rng() * 0.1);
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(px, h * 0.82);
      ctx.quadraticCurveTo(px + 22, h * 0.62, px - 10, topY);
      ctx.stroke();
      for (let f = 0; f < 6; f++) {
        const ang = -Math.PI + (f / 5) * Math.PI * 1.4;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(px - 10, topY);
        ctx.quadraticCurveTo(px + Math.cos(ang) * 75, topY + Math.sin(ang) * 35 - 20, px + Math.cos(ang) * 125, topY + Math.sin(ang) * 65 + 25);
        ctx.stroke();
      }
    }
  } else if (opts.theme === 'ancient_banyan_ruins') {
    // Massive sacred banyan canopy + aerial roots framing ancient stones
    ctx.fillStyle = pal.silhouetteMid;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.14, w * 0.56, h * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = pal.ground;
    for (let i = 0; i < 14; i++) {
      const rx = w * (0.06 + i * 0.068 + rng() * 0.02);
      ctx.lineWidth = 5 + rng() * 11;
      ctx.beginPath();
      ctx.moveTo(rx, h * 0.18);
      ctx.quadraticCurveTo(rx + (rng() - 0.5) * 36, h * 0.5, rx + (rng() - 0.5) * 24, horizonY + 30);
      ctx.stroke();
    }
  } else if (opts.theme === 'bamboo_mist_bridge') {
    // Tall bamboo stalks left & right
    for (let i = 0; i < 22; i++) {
      const side = i < 11 ? 0 : 1;
      const bx = side === 0 ? rng() * w * 0.28 : w * 0.72 + rng() * w * 0.28;
      ctx.strokeStyle = i % 2 === 0 ? pal.silhouetteMid : '#194d3b';
      ctx.lineWidth = 10 + rng() * 14;
      ctx.beginPath();
      ctx.moveTo(bx, h);
      ctx.lineTo(bx + (rng() - 0.5) * 35, 0);
      ctx.stroke();
    }
    // Vermilion arched lacquer bridge
    ctx.strokeStyle = '#d93d3a';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(w * 0.18, horizonY + 35);
    ctx.quadraticCurveTo(w * 0.5, horizonY - 145, w * 0.82, horizonY + 35);
    ctx.stroke();
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(w * 0.2, horizonY - 10);
    ctx.quadraticCurveTo(w * 0.5, horizonY - 190, w * 0.8, horizonY - 10);
    ctx.stroke();
  } else if (opts.theme === 'crimson_volcano_citadel') {
    // Obsidian jagged spires + glowing magma stream
    ctx.fillStyle = pal.ground;
    const spires = [0.14, 0.28, 0.74, 0.86];
    for (const sx of spires) {
      ctx.beginPath();
      ctx.moveTo(w * sx - 85, horizonY + 30);
      ctx.lineTo(w * sx, h * (0.22 + rng() * 0.14));
      ctx.lineTo(w * sx + 85, horizonY + 30);
      ctx.closePath();
      ctx.fill();
    }
    // Glowing lava river cutting across stage floor
    const lava = ctx.createLinearGradient(0, horizonY, 0, h);
    lava.addColorStop(0, '#ff8e3c');
    lava.addColorStop(0.6, '#e63917');
    lava.addColorStop(1, '#5e0b08');
    ctx.fillStyle = lava;
    ctx.beginPath();
    ctx.moveTo(w * 0.44, horizonY);
    ctx.lineTo(w * 0.56, horizonY);
    ctx.lineTo(w * 0.72, h);
    ctx.lineTo(w * 0.28, h);
    ctx.closePath();
    ctx.fill();
  } else if (opts.theme === 'cyber_rain_skyline') {
    for (let i = 0; i < 12; i++) {
      const bx = (i / 12) * w;
      const bw = w / 11;
      const bh = h * (0.28 + rng() * 0.36);
      ctx.fillStyle = i % 2 === 0 ? pal.silhouetteMid : pal.silhouetteFar;
      ctx.fillRect(bx, horizonY - bh, bw, bh);
      ctx.fillStyle = i % 3 === 0 ? '#ff2bd6' : '#00f0ff';
      for (let r = 0; r < 5; r++) {
        ctx.fillRect(bx + bw * 0.2, horizonY - bh + 28 + r * 36, bw * 0.6, 8);
      }
    }
  } else if (opts.theme === 'deep_space_nebula') {
    const neb = ctx.createRadialGradient(w * 0.62, h * 0.42, 40, w * 0.62, h * 0.42, w * 0.44);
    neb.addColorStop(0, 'rgba(236, 72, 153, 0.35)');
    neb.addColorStop(0.5, 'rgba(56, 189, 248, 0.22)');
    neb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.ellipse(w * 0.34, h * 0.42, 240, 56, -0.22, 0, Math.PI * 2);
    ctx.stroke();
  } else if (opts.theme === 'aurora_glacier_peaks') {
    for (let b = 0; b < 3; b++) {
      const ag = ctx.createLinearGradient(0, h * 0.08, 0, h * 0.45);
      ag.addColorStop(0, 'rgba(94, 234, 212, 0)');
      ag.addColorStop(0.5, b % 2 === 0 ? 'rgba(94, 234, 212, 0.32)' : 'rgba(56, 189, 248, 0.28)');
      ag.addColorStop(1, 'rgba(94, 234, 212, 0)');
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.moveTo(0, h * (0.28 + b * 0.05));
      ctx.bezierCurveTo(w * 0.33, h * 0.1, w * 0.66, h * 0.38, w, h * 0.18);
      ctx.lineTo(w, h * 0.48);
      ctx.lineTo(0, h * 0.48);
      ctx.closePath();
      ctx.fill();
    }
  } else if (opts.theme === 'noir_wet_boulevard') {
    ctx.fillStyle = '#0d0f15';
    ctx.fillRect(0, h * 0.14, w * 0.26, h * 0.65);
    ctx.fillRect(w * 0.74, h * 0.1, w * 0.26, h * 0.69);
    const cone = ctx.createLinearGradient(w * 0.28, h * 0.25, w * 0.28, h * 0.9);
    cone.addColorStop(0, 'rgba(241, 245, 249, 0.38)');
    cone.addColorStop(1, 'rgba(241, 245, 249, 0)');
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(w * 0.27, h * 0.24);
    ctx.lineTo(w * 0.44, h * 0.92);
    ctx.lineTo(w * 0.12, h * 0.92);
    ctx.closePath();
    ctx.fill();
  } else if (opts.theme === 'sunlit_botanical_atrium') {
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(w * 0.5, horizonY, w * 0.46, Math.PI, 0);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = Math.PI + (i / 7) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, horizonY);
      ctx.lineTo(w * 0.5 + Math.cos(a) * w * 0.46, horizonY + Math.sin(a) * w * 0.46);
      ctx.stroke();
    }
  } else if (opts.theme === 'sunken_coral_ruins') {
    ctx.fillStyle = pal.silhouetteMid;
    for (let i = 0; i < 5; i++) {
      const cx = w * (0.14 + i * 0.18);
      ctx.fillRect(cx - 24, h * 0.34 + (i % 2) * 80, 48, horizonY - h * 0.34);
    }
  } else if (opts.theme === 'volcanic_caldera_bridge') {
    ctx.fillStyle = '#ff6b2b';
    ctx.fillRect(0, horizonY - 24, w, 64);
    ctx.strokeStyle = pal.ground;
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(0, horizonY - 40);
    ctx.quadraticCurveTo(w * 0.5, horizonY + 45, w, horizonY - 40);
    ctx.stroke();
  } else if (opts.theme === 'golden_pyramids_dusk') {
    ctx.fillStyle = pal.silhouetteMid;
    ctx.beginPath();
    ctx.moveTo(w * 0.14, horizonY); ctx.lineTo(w * 0.42, h * 0.28); ctx.lineTo(w * 0.7, horizonY); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = pal.silhouetteFar;
    ctx.beginPath();
    ctx.moveTo(w * 0.52, horizonY); ctx.lineTo(w * 0.74, h * 0.4); ctx.lineTo(w * 0.96, horizonY); ctx.closePath();
    ctx.fill();
  } else if (opts.theme === 'sakura_temple_stairs') {
    ctx.fillStyle = '#d92638';
    ctx.fillRect(w * 0.38, h * 0.3, 28, horizonY - h * 0.3);
    ctx.fillRect(w * 0.62 - 28, h * 0.3, 28, horizonY - h * 0.3);
    ctx.fillRect(w * 0.32, h * 0.28, w * 0.36, 26);
    ctx.fillStyle = 'rgba(249, 168, 212, 0.78)';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(w * (i < 3 ? 0.08 + i * 0.09 : 0.74 + (i - 3) * 0.09), h * 0.16, 110, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (opts.theme === 'steampunk_airship_dock') {
    ctx.fillStyle = pal.silhouetteMid;
    ctx.beginPath(); ctx.ellipse(w * 0.64, h * 0.34, 210, 74, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(w * 0.54, h * 0.41, 140, 26);
    ctx.fillRect(w * 0.18, h * 0.26, 76, horizonY - h * 0.26);
  } else if (opts.theme === 'gothic_moon_castle') {
    ctx.fillStyle = pal.ground;
    const towers = [0.24, 0.36, 0.5, 0.64, 0.76];
    for (let i = 0; i < towers.length; i++) {
      const tx = w * towers[i];
      const th = h * (i === 2 ? 0.52 : 0.36);
      ctx.fillRect(tx - 34, horizonY - th, 68, th);
      ctx.beginPath();
      ctx.moveTo(tx - 44, horizonY - th); ctx.lineTo(tx, horizonY - th - 110); ctx.lineTo(tx + 44, horizonY - th);
      ctx.closePath(); ctx.fill();
    }
  } else if (opts.theme === 'vintage_library_vault') {
    ctx.fillStyle = '#29170f';
    ctx.fillRect(0, 0, w, horizonY);
    ctx.strokeStyle = '#d49d35';
    ctx.lineWidth = 6;
    for (let i = 0; i < 4; i++) {
      ctx.strokeRect(w * (0.06 + i * 0.23), h * 0.12, w * 0.19, horizonY - h * 0.16);
    }
  } else if (opts.theme === 'minimal_explainer_grid') {
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 80) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  } else if (opts.theme === 'broadcast_studio_backdrop') {
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(56, 189, 248, 0.22)' : 'rgba(244, 63, 94, 0.14)';
      ctx.fillRect(w * (0.06 + i * 0.11), 0, 26, horizonY);
    }
  } else {
    // Parametric Wave 5 architectural / biome horizon composition tailored to each theme ID
    const themeHash = meta.id.split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 997, 17);
    const kind = themeHash % 5;
    ctx.fillStyle = pal.silhouetteMid;
    if (kind === 0) {
      // Iconic skyline / towers / neon spires
      for (let i = 0; i < 11; i++) {
        const bw = w / 10;
        const bh = h * (0.22 + (((i * 23 + themeHash) % 34) * 0.01));
        ctx.fillRect(i * bw * 0.94, horizonY - bh, bw * 0.78, bh);
        ctx.fillStyle = meta.accentHex;
        ctx.globalAlpha = 0.42;
        ctx.fillRect(i * bw * 0.94 + 12, horizonY - bh + 18, bw * 0.48, 12);
        ctx.globalAlpha = 1;
        ctx.fillStyle = pal.silhouetteMid;
      }
    } else if (kind === 1) {
      // Sacred arches, domes & mirror reflection
      for (let i = 0; i < 5; i++) {
        const ax = w * (0.12 + i * 0.19);
        ctx.beginPath(); ctx.arc(ax, horizonY - h * 0.22, w * 0.07, Math.PI, 0); ctx.lineTo(ax + w * 0.07, horizonY); ctx.lineTo(ax - w * 0.07, horizonY); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = meta.accentHex; ctx.lineWidth = 4; ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.arc(w * 0.5, horizonY - h * 0.28, h * 0.16, Math.PI, 0); ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (kind === 2) {
      // Layered peaks, canyon mesas & glowing accent bands
      ctx.beginPath(); ctx.moveTo(0, horizonY);
      for (let i = 0; i <= 8; i++) {
        const py = horizonY - h * (0.14 + (((i * 19 + themeHash) % 28) * 0.01));
        ctx.lineTo((i / 8) * w, py);
      }
      ctx.lineTo(w, horizonY); ctx.closePath(); ctx.fill();
    } else if (kind === 3) {
      // Sci-fi orbital ring / Ferris wheel / stadium floodlights
      ctx.strokeStyle = meta.accentHex; ctx.lineWidth = 10; ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.arc(w * 0.5, horizonY - h * 0.22, h * 0.26, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      // Lush canopy / mystical grove / festive banners
      for (let i = 0; i < 9; i++) {
        const tx = (i / 8) * w;
        ctx.fillRect(tx - 12, horizonY - h * 0.34, 24, h * 0.34);
        ctx.fillStyle = i % 2 === 0 ? pal.silhouetteFar : meta.accentHex;
        ctx.globalAlpha = i % 2 === 0 ? 0.9 : 0.45;
        ctx.beginPath(); ctx.arc(tx, horizonY - h * 0.36, 74 + (i % 3) * 18, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = pal.silhouetteMid;
      }
    }
  }
  ctx.restore();

  // 6. Stage ground plane + subtle atmospheric horizon mist so characters read with high contrast
  if (opts.theme !== 'eclipse_lotus_courtyard' && opts.theme !== 'golden_sun_temple') {
    const floorGrad = ctx.createLinearGradient(0, horizonY - 24, 0, h);
    floorGrad.addColorStop(0, `${pal.silhouetteMid}dd`);
    floorGrad.addColorStop(0.25, pal.ground);
    floorGrad.addColorStop(1, '#04060c');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, horizonY, w, h - horizonY);
  }

  const mist = ctx.createLinearGradient(0, horizonY - 150, 0, horizonY + 80);
  mist.addColorStop(0, 'rgba(0,0,0,0)');
  mist.addColorStop(0.55, `${pal.glow}2e`);
  mist.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = mist;
  ctx.fillRect(0, horizonY - 150, w, 230);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    label,
  };
}

export interface ProceduralPropOptions {
  preset: CustomPropPresetId;
  tintHex?: string;
  seed?: number;
  size?: number;
}

/**
 * Generates a crisp transparent-background 512x512 PNG prop cutout for `beat.customPropDataUrl`.
 */
export function generateProceduralPropDataUrl(opts: ProceduralPropOptions): {
  dataUrl: string;
  label: string;
} {
  const meta = CUSTOM_PROP_PRESETS.find((p) => p.id === opts.preset) || CUSTOM_PROP_PRESETS[0];
  const tint = opts.tintHex || meta.defaultTint;
  const seed = Number.isFinite(opts.seed) ? Math.floor(opts.seed!) : 1;
  const size = Math.max(256, Math.min(512, opts.size || 512));
  const label = `${meta.label}`;

  if (typeof document === 'undefined') {
    const pHash = meta.id.split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 997, 29);
    const rOuter = Math.round(size * (0.28 + (pHash % 10) * 0.01));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" data-preset="${meta.id}" data-seed="${seed}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${rOuter}" fill="${tint}" stroke="#f2c85b" stroke-width="10"/><rect x="${Math.round(size * 0.36)}" y="${Math.round(size * 0.36)}" width="${Math.round(size * 0.28)}" height="${Math.round(size * 0.28)}" rx="${(pHash % 18) + 6}" fill="#ffffff" opacity="0.32"/></svg>`;
    const encoded = typeof Buffer !== 'undefined'
      ? Buffer.from(svg, 'utf8').toString('base64')
      : btoa(unescape(encodeURIComponent(svg)));
    return { dataUrl: `data:image/svg+xml;base64,${encoded}`, label };
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { dataUrl: '', label };

  const rng = createSeededRng(seed * 41 + meta.id.length * 313);
  const cx = size * 0.5;
  const cy = size * 0.5;

  // Soft outer aura glow
  const aura = ctx.createRadialGradient(cx, cy, size * 0.06, cx, cy, size * 0.44);
  aura.addColorStop(0, `${tint}66`);
  aura.addColorStop(0.6, `${tint}22`);
  aura.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (opts.preset === 'crystal_orb') {
    const orbGrad = ctx.createRadialGradient(cx - 35, cy - 45, 16, cx, cy, 130);
    orbGrad.addColorStop(0, '#ffffff');
    orbGrad.addColorStop(0.35, tint);
    orbGrad.addColorStop(1, '#102138');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 125, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f2c85b';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 178, 52, -0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, 172, 48, 0.45, 0, Math.PI * 2);
    ctx.stroke();
  } else if (opts.preset === 'relic_chest') {
    ctx.fillStyle = '#4e2716';
    ctx.strokeStyle = '#f2c85b';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.roundRect(cx - 145, cy - 30, 290, 145, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#68341c';
    ctx.beginPath();
    ctx.roundRect(cx - 155, cy - 110, 310, 88, [64, 64, 12, 12]);
    ctx.fill();
    ctx.stroke();
    // Glowing treasure seam + lock gem
    ctx.fillStyle = tint;
    ctx.fillRect(cx - 135, cy - 34, 270, 12);
    ctx.fillStyle = '#f2c85b';
    ctx.fillRect(cx - 24, cy - 46, 48, 58);
    ctx.fillStyle = tint;
    ctx.beginPath();
    ctx.arc(cx, cy - 16, 13, 0, Math.PI * 2);
    ctx.fill();
  } else if (opts.preset === 'ancient_key') {
    ctx.strokeStyle = '#f2c85b';
    ctx.fillStyle = '#c88c24';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(cx - 95, cy, 68, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = tint;
    ctx.beginPath();
    ctx.arc(cx - 95, cy, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2c85b';
    ctx.fillRect(cx - 26, cy - 14, 200, 28);
    ctx.fillRect(cx + 110, cy + 14, 24, 52);
    ctx.fillRect(cx + 148, cy + 14, 24, 68);
  } else if (opts.preset === 'paper_lantern') {
    ctx.fillStyle = '#291a14';
    ctx.fillRect(cx - 54, cy - 150, 108, 22);
    ctx.fillRect(cx - 46, cy + 92, 92, 20);
    const lGrad = ctx.createRadialGradient(cx, cy - 22, 20, cx, cy - 22, 130);
    lGrad.addColorStop(0, '#fff2b2');
    lGrad.addColorStop(0.55, tint);
    lGrad.addColorStop(1, '#7a1c14');
    ctx.fillStyle = lGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 22, 110, 122, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f2c85b';
    ctx.lineWidth = 5;
    ctx.stroke();
    // Silk tassel
    ctx.strokeStyle = '#f2c85b';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 112);
    ctx.lineTo(cx, cy + 190);
    ctx.stroke();
  } else if (opts.preset === 'ritual_dagger') {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI * 0.22);
    ctx.fillStyle = '#dbe4f0';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, -190);
    ctx.quadraticCurveTo(38, -110, 14, -40);
    ctx.quadraticCurveTo(32, 10, 24, 55);
    ctx.lineTo(-24, 55);
    ctx.quadraticCurveTo(-32, 10, -14, -40);
    ctx.quadraticCurveTo(-38, -110, 0, -190);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f2c85b';
    ctx.beginPath();
    ctx.roundRect(-72, 48, 144, 26, 12);
    ctx.fill();
    ctx.fillStyle = '#4a1c1a';
    ctx.beginPath();
    ctx.roundRect(-20, 72, 40, 96, 14);
    ctx.fill();
    ctx.fillStyle = tint;
    ctx.beginPath();
    ctx.arc(0, 61, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (opts.preset === 'lotus_chalice') {
    ctx.fillStyle = '#f2c85b';
    ctx.strokeStyle = '#996515';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(cx - 112, cy - 85);
    ctx.quadraticCurveTo(cx - 95, cy + 45, cx, cy + 52);
    ctx.quadraticCurveTo(cx + 95, cy + 45, cx + 112, cy - 85);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(cx - 18, cy + 48, 36, 98);
    ctx.beginPath();
    ctx.ellipse(cx, cy + 150, 78, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Glowing lotus petals above chalice
    for (let i = -2; i <= 2; i++) {
      ctx.fillStyle = tint;
      ctx.beginPath();
      ctx.ellipse(cx + i * 32, cy - 102 + Math.abs(i) * 10, 22, 44, i * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (opts.preset === 'rune_scroll') {
    ctx.fillStyle = '#f3e1b9';
    ctx.strokeStyle = '#8b5e34';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.roundRect(cx - 112, cy - 135, 224, 270, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#6f3d1e';
    ctx.beginPath();
    ctx.roundRect(cx - 148, cy - 155, 296, 30, 14);
    ctx.roundRect(cx - 148, cy + 125, 296, 30, 14);
    ctx.fill();
    // Glowing mystic runes
    ctx.strokeStyle = tint;
    ctx.lineWidth = 8;
    for (let r = 0; r < 4; r++) {
      const ry = cy - 75 + r * 52;
      ctx.beginPath();
      ctx.moveTo(cx - 65, ry);
      ctx.lineTo(cx + 65, ry);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + (rng() - 0.5) * 40, ry, 10, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (opts.preset === 'spirit_mask') {
    ctx.fillStyle = '#251a38';
    ctx.strokeStyle = '#f2c85b';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 165);
    ctx.quadraticCurveTo(cx + 145, cy - 110, cx + 110, cy + 75);
    ctx.quadraticCurveTo(cx, cy + 185, cx - 110, cy + 75);
    ctx.quadraticCurveTo(cx - 145, cy - 110, cx, cy - 165);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Glowing slit eyes & forehead jewel
    ctx.fillStyle = tint;
    ctx.beginPath();
    ctx.ellipse(cx - 48, cy - 22, 28, 13, 0.2, 0, Math.PI * 2);
    ctx.ellipse(cx + 48, cy - 22, 28, 13, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy - 88, 18, 0, Math.PI * 2);
    ctx.fill();
    // Ornate carved smile
    ctx.strokeStyle = '#f2c85b';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(cx, cy + 42, 48, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else if (opts.preset === 'hologram_cube') {
    ctx.strokeStyle = tint;
    ctx.lineWidth = 10;
    ctx.strokeRect(cx - 108, cy - 108, 216, 216);
    ctx.strokeRect(cx - 64, cy - 64, 128, 128);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.fill();
  } else if (opts.preset === 'neon_katana') {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.68);
    ctx.fillStyle = tint; ctx.fillRect(-10, -210, 20, 290);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-4, -204, 8, 280);
    ctx.fillStyle = '#1e293b'; ctx.fillRect(-34, 76, 68, 16); ctx.fillRect(-12, 92, 24, 96);
    ctx.restore();
  } else if (opts.preset === 'detective_dossier') {
    ctx.fillStyle = '#d6b98c';
    ctx.beginPath(); ctx.roundRect(cx - 132, cy - 154, 264, 308, 14); ctx.fill();
    ctx.strokeStyle = tint; ctx.lineWidth = 10;
    ctx.strokeRect(cx - 92, cy - 38, 184, 72);
    ctx.fillStyle = tint;
    ctx.fillRect(cx - 72, cy - 8, 144, 16);
  } else if (opts.preset === 'antique_globe') {
    ctx.fillStyle = tint; ctx.beginPath(); ctx.arc(cx, cy - 22, 122, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#eab308'; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.arc(cx, cy - 22, 142, -Math.PI * 0.4, Math.PI * 0.6); ctx.stroke();
    ctx.fillStyle = '#78350f'; ctx.fillRect(cx - 18, cy + 120, 36, 56); ctx.fillRect(cx - 88, cy + 166, 176, 24);
  } else if (opts.preset === 'enchanted_hourglass') {
    ctx.fillStyle = '#eab308';
    ctx.fillRect(cx - 108, cy - 166, 216, 24);
    ctx.fillRect(cx - 108, cy + 142, 216, 24);
    ctx.fillStyle = tint;
    ctx.beginPath();
    ctx.moveTo(cx - 82, cy - 142); ctx.lineTo(cx + 82, cy - 142); ctx.lineTo(cx, cy);
    ctx.lineTo(cx + 82, cy + 142); ctx.lineTo(cx - 82, cy + 142); ctx.lineTo(cx, cy); ctx.closePath();
    ctx.fill();
  } else if (opts.preset === 'crystal_potion') {
    ctx.fillStyle = tint;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 72); ctx.lineTo(cx + 104, cy + 36); ctx.lineTo(cx, cy + 152); ctx.lineTo(cx - 104, cy + 36);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 10; ctx.stroke();
    ctx.fillStyle = '#d97706'; ctx.fillRect(cx - 32, cy - 144, 64, 58);
  } else if (opts.preset === 'floating_crown') {
    ctx.fillStyle = tint;
    ctx.beginPath();
    ctx.moveTo(cx - 144, cy + 84); ctx.lineTo(cx - 156, cy - 72); ctx.lineTo(cx - 64, cy + 8);
    ctx.lineTo(cx, cy - 124); ctx.lineTo(cx + 64, cy + 8); ctx.lineTo(cx + 156, cy - 72);
    ctx.lineTo(cx + 144, cy + 84); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(cx, cy + 28, 22, 0, Math.PI * 2); ctx.fill();
  } else if (opts.preset === 'brass_astrolabe') {
    ctx.strokeStyle = tint; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.arc(cx, cy, 148, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 98, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 148, cy); ctx.lineTo(cx + 148, cy); ctx.moveTo(cx, cy - 148); ctx.lineTo(cx, cy + 148); ctx.stroke();
  } else if (opts.preset === 'vintage_typewriter') {
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(cx - 88, cy - 168, 176, 120);
    ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.roundRect(cx - 148, cy - 52, 296, 178, 22); ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 7; c++) {
        ctx.beginPath(); ctx.arc(cx - 102 + c * 34, cy + 16 + r * 34, 10, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (opts.preset === 'studio_mic') {
    ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.roundRect(cx - 64, cy - 148, 128, 188, 64); ctx.fill();
    ctx.strokeStyle = tint; ctx.lineWidth = 10; ctx.stroke();
    ctx.fillStyle = '#334155'; ctx.fillRect(cx - 14, cy + 40, 28, 128); ctx.fillRect(cx - 88, cy + 156, 176, 24);
  } else if (opts.preset === 'starship_shuttle') {
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 178); ctx.lineTo(cx + 148, cy + 112); ctx.lineTo(cx, cy + 56); ctx.lineTo(cx - 148, cy + 112);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = tint;
    ctx.beginPath(); ctx.ellipse(cx, cy - 28, 26, 62, 0, 0, Math.PI * 2); ctx.fill();
  } else if (opts.preset === 'ancient_relic_mask') {
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath(); ctx.moveTo(cx - 156, cy + 132); ctx.lineTo(cx - 112, cy - 142); ctx.lineTo(cx + 112, cy - 142); ctx.lineTo(cx + 156, cy + 132); ctx.closePath(); ctx.fill();
    ctx.fillStyle = tint;
    ctx.beginPath(); ctx.ellipse(cx, cy - 12, 84, 112, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0f172a'; ctx.fillRect(cx - 54, cy - 32, 34, 14); ctx.fillRect(cx + 20, cy - 32, 34, 14);
  } else if (opts.preset === 'golden_scales') {
    ctx.strokeStyle = tint; ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 148); ctx.lineTo(cx, cy + 148);
    ctx.moveTo(cx - 142, cy - 92); ctx.lineTo(cx + 142, cy - 92);
    ctx.moveTo(cx - 82, cy + 148); ctx.lineTo(cx + 82, cy + 148);
    ctx.stroke();
    ctx.fillStyle = tint;
    ctx.beginPath(); ctx.arc(cx - 126, cy + 28, 48, 0, Math.PI); ctx.arc(cx + 126, cy + 28, 48, 0, Math.PI); ctx.fill();
  } else if (opts.preset === 'sealed_wax_letter') {
    ctx.fillStyle = '#f5e7c8';
    ctx.beginPath(); ctx.roundRect(cx - 156, cy - 108, 312, 216, 14); ctx.fill();
    ctx.strokeStyle = '#92400e'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(cx - 156, cy - 108); ctx.lineTo(cx, cy + 20); ctx.lineTo(cx + 156, cy - 108); ctx.stroke();
    ctx.fillStyle = tint; ctx.beginPath(); ctx.arc(cx, cy + 20, 36, 0, Math.PI * 2); ctx.fill();
  } else if (opts.preset === 'cyber_visor_deck') {
    ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.roundRect(cx - 156, cy - 88, 312, 176, 20); ctx.fill();
    ctx.strokeStyle = tint; ctx.lineWidth = 10; ctx.stroke();
    ctx.fillStyle = tint; ctx.fillRect(cx - 122, cy - 46, 244, 42);
    for (let i = 0; i < 6; i++) ctx.fillRect(cx - 118 + i * 42, cy + 22, 28, 28);
  } else if (opts.preset === 'bonsai_lantern') {
    ctx.fillStyle = '#5c3317'; ctx.fillRect(cx - 72, cy + 96, 144, 52);
    ctx.strokeStyle = '#451a03'; ctx.lineWidth = 22;
    ctx.beginPath(); ctx.moveTo(cx, cy + 96); ctx.quadraticCurveTo(cx - 48, cy + 8, cx + 22, cy - 52); ctx.stroke();
    ctx.fillStyle = tint;
    ctx.beginPath(); ctx.arc(cx + 22, cy - 72, 82, 0, Math.PI * 2); ctx.arc(cx - 56, cy - 28, 62, 0, Math.PI * 2); ctx.fill();
  } else {
    // Parametric Wave 5 cutout silhouette tailored deterministically to each preset ID
    const pHash = meta.id.split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 997, 13);
    const mode = pHash % 4;
    ctx.fillStyle = tint;
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 9;
    if (mode === 0) {
      // Emblematic crest / shield / medallion
      ctx.beginPath(); ctx.moveTo(cx - 120, cy - 120); ctx.lineTo(cx + 120, cy - 120); ctx.lineTo(cx + 102, cy + 40); ctx.lineTo(cx, cy + 150); ctx.lineTo(cx - 102, cy + 40); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(cx, cy - 16, 42, 0, Math.PI * 2); ctx.fill();
    } else if (mode === 1) {
      // Sleek tech / media / instrument frame
      ctx.beginPath(); ctx.roundRect(cx - 146, cy - 104, 292, 208, 26); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.roundRect(cx - 116, cy - 74, 232, 120, 14); ctx.fill();
      ctx.fillStyle = '#fef08a'; ctx.fillRect(cx - 88, cy - 22, 176, 22);
    } else if (mode === 2) {
      // Radial artifact / wheel / star / orbital prop
      ctx.beginPath(); ctx.arc(cx, cy, 128, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 8;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 124, cy + Math.sin(a) * 124); ctx.stroke();
      }
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, 34, 0, Math.PI * 2); ctx.fill();
    } else {
      // Faceted crystal / blade / vessel silhouette
      ctx.beginPath(); ctx.moveTo(cx, cy - 156); ctx.lineTo(cx + 112, cy - 20); ctx.lineTo(cx + 76, cy + 146); ctx.lineTo(cx - 76, cy + 146); ctx.lineTo(cx - 112, cy - 20); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.34)';
      ctx.beginPath(); ctx.moveTo(cx, cy - 134); ctx.lineTo(cx + 66, cy - 14); ctx.lineTo(cx, cy + 114); ctx.closePath(); ctx.fill();
    }
  }
  ctx.restore();

  return {
    dataUrl: canvas.toDataURL('image/png'),
    label,
  };
}

/**
 * Applies a cohesive 4-Act Visual Progression across an episode's narrative beats:
 * shifts lighting mood, weather particles, atmospheric haze, light side, subtle stage framing/flips,
 * and act-boundary transitions so 10–30 minute episodes stay visually dynamic from start to finish.
 */
export function applyActVisualProgression(
  episode: EpisodeScript,
  presetId: ActArcPresetId = 'mythic_odyssey'
): {
  episode: EpisodeScript;
  preset: ActArcPresetMeta;
  actCounts: [number, number, number, number];
  summary: string;
} {
  const preset = ACT_ARC_PRESETS.find((p) => p.id === presetId) || ACT_ARC_PRESETS[0];
  const actCounts: [number, number, number, number] = [0, 0, 0, 0];

  const sceneIndices: number[] = [];
  episode.beats.forEach((b, idx) => {
    if (b.frame !== 'chapter_title' && b.frame !== 'moral_card' && b.frame !== 'end_screen') {
      sceneIndices.push(idx);
    }
  });
  const totalScenes = Math.max(1, sceneIndices.length);
  const sceneOrderMap = new Map<number, number>();
  sceneIndices.forEach((beatIdx, order) => sceneOrderMap.set(beatIdx, order));

  let prevAct = -1;
  const nextBeats: StoryBeat[] = episode.beats.map((beat, idx) => {
    const order = sceneOrderMap.get(idx);
    if (order === undefined) {
      // Preserve title/moral/end card framing while harmonizing mood with nearby act
      const approxAct = Math.min(3, Math.floor((idx / Math.max(1, episode.beats.length)) * 4));
      return {
        ...beat,
        mood: preset.acts[approxAct].mood,
      };
    }

    const ratio = order / totalScenes;
    const actIdx: 0 | 1 | 2 | 3 =
      ratio < 0.25 ? 0 : ratio < 0.55 ? 1 : ratio < 0.82 ? 2 : 3;
    actCounts[actIdx] += 1;

    const spec = preset.acts[actIdx];
    const isActBoundary = prevAct !== -1 && actIdx !== prevAct;
    prevAct = actIdx;

    // Gentle deterministic stage crop & mirror variety on alternating scenes so repeated stages feel fresh
    const cameraMove = spec.preferredCameras[order % spec.preferredCameras.length];
    const subtleZoom = Number((1.0 + ((order % 3) * 0.04)).toFixed(2));
    const flipStage = order % 4 === 2 ? !beat.flipStage : beat.flipStage;

    return {
      ...beat,
      mood: spec.mood,
      weather: spec.weather,
      haze: spec.haze,
      lightSide: actIdx % 2 === 0 ? 'left' : 'right',
      cameraMove,
      backdropZoom: subtleZoom,
      flipStage,
      transition: isActBoundary ? spec.boundaryTransition : beat.transition,
    };
  });

  const updated: EpisodeScript = {
    ...episode,
    beats: nextBeats,
  };

  return {
    episode: updated,
    preset,
    actCounts,
    summary: `Applied "${preset.label}" across ${totalScenes} scenes (Acts: ${actCounts.join(' / ')}).`,
  };
}
