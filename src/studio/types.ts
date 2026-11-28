/**
 * Katha Studio — Encyclopedic Indian Folklore & Epics Machinima Schema
 * Deterministic full-chapter engine covering 12+ classical collections:
 * Vikram & Betaal, Singhasan Battisi, Kathasaritsagara, Panchatantra, Hitopadesha,
 * Jataka Tales, Tenali Rama, Akbar & Birbal, Gopal Bhar, Ramayana, Mahabharata, & Puranas.
 */

export const STUDIO_FPS = 60;

/**
 * Canonical Integer Frame-Index Clock (Motion Canvas determinism lock).
 * All interactive previews, offline WebCodecs renders, and headless Playwright exports
 * snap timestamps to exact integer studio frames so preview === export bit-for-bit.
 */
export function timeToFrameIndex(timeSec: number, fps = STUDIO_FPS): number {
  const safeFps = Number.isFinite(fps) && fps > 0 ? Math.round(fps) : STUDIO_FPS;
  const safeT = Number.isFinite(timeSec) ? Math.max(0, timeSec) : 0;
  return Math.max(0, Math.round(safeT * safeFps));
}

export function frameIndexToTime(frameIndex: number, fps = STUDIO_FPS): number {
  const safeFps = Number.isFinite(fps) && fps > 0 ? Math.round(fps) : STUDIO_FPS;
  const safeFrame = Number.isFinite(frameIndex) ? Math.max(0, Math.floor(frameIndex)) : 0;
  return safeFrame / safeFps;
}

export function quantizeTimeToStudioFrame(timeSec: number, fps = STUDIO_FPS): number {
  return frameIndexToTime(timeToFrameIndex(timeSec, fps), fps);
}

export type AspectMode = '16:9' | '9:16';

export type StorybookShelf =
  | 'Modern Multi-Genre Showcases'
  | 'Supernatural & Royal Legends'
  | 'Animal Fables & Strategy'
  | 'Royal Court Wit & Satire'
  | 'Sacred Epics & Puranas'
  | 'Western Folklore & Fables'
  | 'East Asian Tales & Epics'
  | 'Southeast Asian Folklore'
  | 'Americas & Indigenous Legends'
  | 'African Griot & Trickster Tales';

import { CharacterDNA, validateAndNormalizeDna } from './characterDna';
export type { CharacterDNA } from './characterDna';

export type ArchetypeGroup =
  | 'Epic & Divine'
  | 'Royalty & Folk'
  | 'Fable Fauna'
  | 'World Legends'
  | 'Modern & Sci-Fi'
  | 'Fantasy & Creatures'
  | 'Historical Eras'
  | 'Civic & Media'
  | 'Gothic & Horror'
  | 'Wildlife & Mythic'
  | 'Sports & Kids';

export type ArchetypeId =
  | 'deva'
  | 'goddess'
  | 'demon_king'
  | 'vanara_hero'
  | 'spirit'
  | 'yaksha'
  | 'statue_apsara'
  | 'king'
  | 'emperor'
  | 'queen'
  | 'sage'
  | 'courtier'
  | 'warrior'
  | 'ascetic'
  | 'merchant'
  | 'child'
  | 'elder_woman'
  | 'guard'
  | 'monkey'
  | 'lion'
  | 'tiger'
  | 'jackal'
  | 'serpent'
  | 'elephant'
  | 'deer'
  | 'crow'
  | 'crocodile'
  | 'tortoise'
  | 'owl'
  | 'bull'
  | 'hare'
  | 'crane'
  | 'mouse'
  | 'dog'
  | 'fox'
  | 'wolf'
  | 'spider'
  | 'knight'
  | 'samurai'
  | 'raven'
  // Wave 3: Modern, Sci-Fi, Fantasy, Historical, Noir & Creatures (+20 -> 60 total)
  | 'detective'
  | 'scientist'
  | 'astronaut'
  | 'cyber_hacker'
  | 'android'
  | 'mech_pilot'
  | 'wizard'
  | 'pirate_captain'
  | 'ninja'
  | 'viking'
  | 'pharaoh'
  | 'vampire_lord'
  | 'dragon_kin'
  | 'elf_archer'
  | 'dwarf_smith'
  | 'ghost_phantom'
  | 'journalist'
  | 'street_musician'
  | 'cat_mascot'
  | 'robot_companion'
  // Wave 5: 5x Universal Visual World Pack (+100 -> 160 total)
  // World Mythology & Legends (10)
  | 'zeus_thunderer'
  | 'athena_strategist'
  | 'anubis_guardian'
  | 'valkyrie_shieldmaiden'
  | 'kitsune_foxspirit'
  | 'sun_wukong_trickster'
  | 'quetzal_priest'
  | 'celtic_druid'
  | 'djinn_genie'
  | 'poseidon_tideking'
  // Historical & Cultural Eras (10)
  | 'roman_centurion'
  | 'spartan_hoplite'
  | 'renaissance_painter'
  | 'victorian_inventor'
  | 'wild_west_sheriff'
  | 'outlaw_bandit'
  | 'feudal_shogun'
  | 'maratha_commander'
  | 'silk_road_nomad'
  | 'caveman_hunter'
  // Modern Everyday & Civic (10)
  | 'doctor_surgeon'
  | 'firefighter_rescuer'
  | 'police_officer'
  | 'judge_magistrate'
  | 'lawyer_advocate'
  | 'school_teacher'
  | 'chef_culinary'
  | 'delivery_courier'
  | 'construction_engineer'
  | 'farmer_grower'
  // Media, Business & Explainer (10)
  | 'ceo_founder'
  | 'podcast_host'
  | 'news_anchor'
  | 'stock_trader'
  | 'tech_developer'
  | 'influencer_vlogger'
  | 'historian_professor'
  | 'coach_mentor'
  | 'film_director'
  | 'esports_gamer'
  // Sci-Fi, Cyberpunk & Space (10)
  | 'bounty_hunter'
  | 'alien_diplomat'
  | 'cyborg_enforcer'
  | 'time_traveler'
  | 'space_admiral'
  | 'drone_operator'
  | 'bio_geneticist'
  | 'wasteland_scavenger'
  | 'quantum_physicist'
  | 'ai_hologram'
  // High Fantasy & RPG Classes (10)
  | 'paladin_crusader'
  | 'necromancer_mage'
  | 'alchemist_brewer'
  | 'shadow_rogue'
  | 'tavern_bard'
  | 'beast_ranger'
  | 'archmage_oracle'
  | 'goblin_tinkerer'
  | 'orc_warlord'
  | 'celestial_angel'
  // Dark Gothic, Horror & Folklore (10)
  | 'werewolf_stalker'
  | 'plague_doctor'
  | 'mummy_sovereign'
  | 'witch_herbalist'
  | 'grim_reaper'
  | 'gargoyle_sentinel'
  | 'banshee_wraith'
  | 'mad_scientist'
  | 'occult_investigator'
  | 'pumpkin_scarecrow'
  // Wildlife & Prehistoric (10)
  | 'trex_dinosaur'
  | 'triceratops_dino'
  | 'grizzly_bear'
  | 'polar_penguin'
  | 'giant_panda'
  | 'bald_eagle'
  | 'silverback_gorilla'
  | 'desert_camel'
  | 'great_white_shark'
  | 'giant_octopus'
  // Mythic Beasts & Companions (10)
  | 'fire_phoenix'
  | 'frost_unicorn'
  | 'winged_griffin'
  | 'sea_mermaid'
  | 'sky_pegasus'
  | 'forest_treant'
  | 'stone_golem'
  | 'crystal_slime'
  | 'baby_dragon'
  | 'clockwork_automaton'
  // Kids, Sports & Entertainment (10)
  | 'soccer_striker'
  | 'cricket_batter'
  | 'martial_artist'
  | 'circus_ringmaster'
  | 'stage_magician'
  | 'orchestra_conductor'
  | 'ballet_dancer'
  | 'skateboard_kid'
  | 'explorer_scout'
  | 'toy_nutcracker';

export type StageId =
  | 'banyan_clearing'
  | 'royal_durbar'
  | 'mughal_courtyard'
  | 'kali_temple'
  | 'throne_mound'
  | 'moonlit_terrace'
  | 'royal_bedchamber'
  | 'palace_garden'
  | 'river_ghat'
  | 'enchanted_lake'
  | 'bamboo_forest'
  | 'himalayan_hermitage'
  | 'cloud_skies'
  | 'kurukshetra_field'
  | 'village_chowk'
  | 'cremation_ground'
  | 'cave_den'
  | 'ocean_ship'
  | 'bazaar_lane'
  | 'courtyard_well'
  | 'royal_dungeon'
  | 'desert_caravan'
  | 'ashoka_vatika'
  | 'golden_lanka'
  | 'olympus_acropolis'
  | 'bamboo_pagoda'
  | 'enchanted_cottage'
  | 'savanna_baobab'
  | 'red_canyon_mesa'
  | 'tropical_archipelago'
  // Wave 3: Multi-Genre Stages (+20 -> 50 total)
  | 'neon_cyber_alley'
  | 'orbital_starship_bridge'
  | 'mars_colony_dome'
  | 'noir_rainy_street'
  | 'modern_news_studio'
  | 'cozy_bookshop_cafe'
  | 'high_tech_lab'
  | 'courtroom_hall'
  | 'ancient_egypt_temple'
  | 'roman_colosseum'
  | 'nordic_fjord_hall'
  | 'gothic_cathedral'
  | 'steampunk_clocktower'
  | 'pirate_galleon_deck'
  | 'underwater_atlantis'
  | 'volcanic_citadel'
  | 'snowy_mountain_pass'
  | 'cherry_blossom_shrine'
  | 'vintage_train_car'
  | 'astral_observatory'
  // Wave 5: +100 New Stages / Environments (50 -> 150 total)
  // Ancient & Sacred World (10)
  | 'babylon_hanging_gardens'
  | 'mayan_step_pyramid'
  | 'stonehenge_circle'
  | 'great_wall_watchtower'
  | 'angkor_jungle_ruins'
  | 'petra_canyon_temple'
  | 'spartan_mountain_pass'
  | 'persian_rose_palace'
  | 'vedic_gurukul'
  | 'tibetan_monastery'
  // Historical Towns & Eras (10)
  | 'wild_west_saloon'
  | 'victorian_fog_alley'
  | 'renaissance_plaza'
  | 'medieval_castle_keep'
  | 'medieval_tavern_inn'
  | 'roaring_twenties_jazz'
  | 'ancient_silk_caravanserai'
  | 'viking_longship_fjord'
  | 'feudal_dojo_hall'
  | 'industrial_foundry'
  // Modern City & Street (10)
  | 'downtown_skyline_roof'
  | 'subway_metro_platform'
  | 'busy_crosswalk_plaza'
  | 'suburban_cul_de_sac'
  | 'neon_arcade_hall'
  | 'airport_departure_gate'
  | 'highway_overpass_night'
  | 'harbor_container_dock'
  | 'rooftop_helipad'
  | 'public_park_fountain'
  // Workplaces, Civic & Media (10)
  | 'startup_war_room'
  | 'stock_exchange_floor'
  | 'hospital_operating_room'
  | 'university_lecture_hall'
  | 'elementary_classroom'
  | 'podcast_recording_booth'
  | 'restaurant_open_kitchen'
  | 'science_cleanroom'
  | 'police_precinct_desk'
  | 'city_library_atrium'
  // Interiors & Cozy Spaces (10)
  | 'luxury_penthouse_lounge'
  | 'warm_family_livingroom'
  | 'attic_inventor_workshop'
  | 'art_gallery_hall'
  | 'grand_opera_theater'
  | 'cozy_bakery_counter'
  | 'greenhouse_conservatory'
  | 'museum_dinosaur_hall'
  | 'fitness_boxing_gym'
  | 'retro_diner_booth'
  // Sci-Fi & Cyberpunk (10)
  | 'orbital_space_station'
  | 'alien_bioluminescent_forest'
  | 'dyson_sphere_vista'
  | 'cyber_megamall_atrium'
  | 'mech_hangar_bay'
  | 'vr_cyberspace_grid'
  | 'post_apoc_ruined_highway'
  | 'underground_fallout_bunker'
  | 'solarpunk_sky_garden'
  | 'quantum_collider_chamber'
  // High Fantasy & Magic (10)
  | 'floating_sky_citadel'
  | 'wizard_arcane_tower'
  | 'dragon_hoard_cavern'
  | 'elven_canopy_city'
  | 'dwarven_forge_hall'
  | 'enchanted_mushroom_grove'
  | 'crystal_prism_cave'
  | 'alchemist_apothecary'
  | 'fairy_glade_bridge'
  | 'cloud_coliseum'
  // Horror, Mystery & Noir (10)
  | 'haunted_manor_foyer'
  | 'misty_graveyard_gates'
  | 'abandoned_asylum_ward'
  | 'lighthouse_storm_cliff'
  | 'underground_catacombs'
  | 'detective_noir_office'
  | 'locked_bank_vault'
  | 'foggy_london_pier'
  | 'cursed_carnival_tent'
  | 'prison_cellblock'
  // Nature, Biomes & Prehistoric (10)
  | 'coral_reef_lagoon'
  | 'amazon_rainforest_canopy'
  | 'arctic_glacier_icebergs'
  | 'african_sunset_savanna'
  | 'grand_canyon_overlook'
  | 'jurassic_fern_valley'
  | 'sahara_starlit_dunes'
  | 'alpine_meadow_lake'
  | 'bioluminescent_sea_cave'
  | 'autumn_maple_river'
  // Sports, Travel & Kids Worlds (10)
  | 'floodlit_cricket_stadium'
  | 'championship_soccer_pitch'
  | 'racing_circuit_paddock'
  | 'cruise_liner_promenade'
  | 'hot_air_balloon_skies'
  | 'treehouse_clubhouse'
  | 'giant_toybox_playroom'
  | 'circus_big_top_ring'
  | 'amusement_ferris_boardwalk'
  | 'candy_kingdom_bridge';

export type MoodId =
  | 'midnight_banyan'
  | 'crimson_wrath'
  | 'golden_durbar'
  | 'sandstone_dusk'
  | 'twilight_temple'
  | 'moonlit_marble'
  | 'emerald_jungle'
  | 'mystic_teal'
  // Wave 3: +8 Mood Palettes (16 total)
  | 'cyber_magenta'
  | 'noir_monochrome'
  | 'arctic_aurora'
  | 'sunlit_morning'
  | 'volcanic_inferno'
  | 'deep_abyss'
  | 'sakura_dawn'
  | 'sepia_archive'
  // Wave 5: +24 Mood Palettes (16 -> 40 total)
  | 'golden_hour_cinema'
  | 'neon_tokyo_blue'
  | 'pastel_storybook'
  | 'desert_mirage'
  | 'toxic_wasteland'
  | 'lavender_twilight'
  | 'cobalt_midnight'
  | 'autumn_amber'
  | 'spring_meadow'
  | 'blood_moon_crimson'
  | 'ice_palace_cyan'
  | 'vintage_kodachrome'
  | 'emerald_matrix'
  | 'royal_amethyst'
  | 'storm_slate'
  | 'sunset_coral'
  | 'candyland_pop'
  | 'deep_space_void'
  | 'copper_steampunk'
  | 'candlelit_parchment'
  | 'ocean_turquoise'
  | 'monsoon_indigo'
  | 'solarpunk_lime'
  | 'obsidian_gold';

export type PropId =
  | 'none'
  | 'khanda_sword'
  | 'bow_arrow'
  | 'gada_mace'
  | 'sudarshana_chakra'
  | 'trishul'
  | 'sanjevani_mountain'
  | 'signet_ring'
  | 'saffron_feast'
  | 'seven_mattresses'
  | 'lotus_petal'
  | 'diya_lamp'
  | 'treasure_chest'
  | 'royal_scroll'
  | 'kali_idol'
  | 'magic_chariot'
  | 'earthen_pot'
  | 'sacred_fire'
  | 'banyan_bough'
  | 'peacock_throne'
  | 'gold_bangle'
  | 'hanging_khichdi_pot'
  | 'golden_statue'
  | 'lotus_pond'
  | 'measuring_stake'
  | 'wooden_garuda'
  | 'royal_scales'
  | 'conch_shell'
  | 'stone_well'
  | 'wooden_cage'
  | 'flying_stick'
  | 'royal_palanquin'
  | 'poison_chalice'
  | 'golden_egg'
  | 'hand_mirror'
  | 'story_box'
  | 'magic_staff'
  | 'golden_fleece'
  | 'sun_orb'
  | 'magic_peach'
  | 'kris_dagger'
  // Wave 3: Multi-Genre Story Props (+24 -> 65 total)
  | 'magnifying_glass'
  | 'holo_tablet'
  | 'energy_blade'
  | 'neon_drone'
  | 'vintage_camera'
  | 'microphone_stand'
  | 'briefcase'
  | 'newspaper_frontpage'
  | 'coffee_mug'
  | 'laptop_screen'
  | 'potion_flask'
  | 'spellbook_tome'
  | 'wizard_staff'
  | 'crystal_amulet'
  | 'brass_compass'
  | 'antique_pocketwatch'
  | 'violin_bow'
  | 'electric_guitar'
  | 'golden_trophy'
  | 'judge_gavel'
  | 'microscope'
  | 'rocket_model'
  | 'pirate_map'
  | 'key_ornate'
  // Wave 5: +120 Story Props (65 -> 185 total)
  // Weapons & Armor (12)
  | 'katana_blade'
  | 'viking_battleaxe'
  | 'knight_shield'
  | 'crossbow_bolts'
  | 'spear_halberd'
  | 'flintlock_pistol'
  | 'laser_rifle'
  | 'plasma_cannon'
  | 'shuriken_star'
  | 'war_hammer'
  | 'roman_gladius'
  | 'grappling_hook'
  // Magic & Mythic Relics (12)
  | 'crystal_ball'
  | 'runestone_tablet'
  | 'phoenix_feather'
  | 'dragon_egg'
  | 'enchanted_chalice'
  | 'grimoire_chained'
  | 'hourglass_sands'
  | 'astral_orrery'
  | 'voodoo_totem'
  | 'magic_carpet'
  | 'genie_lamp'
  | 'crown_jeweled'
  // Sci-Fi & Tech Gadgets (12)
  | 'smartphone_glow'
  | 'vr_headset'
  | 'cyber_deck'
  | 'server_rack'
  | 'ai_core_cube'
  | 'dna_helix_vial'
  | 'sat_dish_mini'
  | 'jetpack_thruster'
  | 'teleport_pad'
  | 'mech_battery'
  | 'radar_scanner'
  | 'hologram_globe'
  // Modern Office, Media & Finance (12)
  | 'gold_bullion_bars'
  | 'stock_chart_board'
  | 'studio_camera_rig'
  | 'clapperboard_slate'
  | 'podcast_mic_arm'
  | 'whiteboard_diagram'
  | 'stack_of_cash'
  | 'credit_card_gold'
  | 'contract_dossier'
  | 'megaphone_bullhorn'
  | 'press_badge'
  | 'trophy_cup_silver'
  // Science, Medical & Lab (12)
  | 'stethoscope_med'
  | 'beaker_bubbling'
  | 'telescope_brass'
  | 'globe_terrestrial'
  | 'skeleton_model'
  | 'first_aid_kit'
  | 'syringe_serum'
  | 'x_ray_lightbox'
  | 'chalkboard_equations'
  | 'atom_model'
  | 'geiger_counter'
  | 'fossil_ammonite'
  // Music, Art & Culture (12)
  | 'sitar_instrument'
  | 'tabla_drums'
  | 'grand_piano_mini'
  | 'paintbrush_palette'
  | 'movie_projector'
  | 'vinyl_turntable'
  | 'dj_mixer_deck'
  | 'theater_masks'
  | 'origami_crane'
  | 'calligraphy_brush'
  | 'bamboo_flute'
  | 'war_horn_brass'
  // Food, Feast & Tavern (12)
  | 'steaming_ramen_bowl'
  | 'royal_thali_platter'
  | 'birthday_cake_lit'
  | 'pizza_slice_box'
  | 'teapot_porcelain'
  | 'spice_jar_rack'
  | 'fruit_basket'
  | 'campfire_kettle'
  | 'goblet_wine'
  | 'honey_jar'
  | 'bread_loaf_basket'
  | 'ice_cream_cone'
  // Vehicles & Travel Gear (12)
  | 'vintage_suitcase'
  | 'treasure_map_tube'
  | 'ship_wheel_helm'
  | 'hot_air_basket'
  | 'bicycle_classic'
  | 'motorcycle_helmet'
  | 'astronaut_helmet'
  | 'anchor_iron'
  | 'lantern_storm'
  | 'boarding_pass'
  | 'binoculars_field'
  | 'tent_camping'
  // Mystery, Crime & Noir (12)
  | 'handcuffs_steel'
  | 'evidence_bag'
  | 'fingerprint_card'
  | 'crime_tape_roll'
  | 'revolver_noir'
  | 'safe_dial_door'
  | 'red_string_board'
  | 'secret_envelope'
  | 'skeleton_key_ring'
  | 'poison_vial_green'
  | 'candle_candelabra'
  | 'skull_relic'
  // Sports, Kids & Everyday (12)
  | 'cricket_bat_ball'
  | 'soccer_ball_classic'
  | 'boxing_gloves'
  | 'chess_board_set'
  | 'rubber_ducky'
  | 'teddy_bear'
  | 'kite_diamond'
  | 'gift_box_ribbon'
  | 'skateboard_deck'
  | 'watering_can'
  | 'hammer_wrench'
  | 'stopwatch_sport';

export type ShotId =
  | 'wide_stage'
  | 'two_shot'
  | 'closeup_left'
  | 'closeup_right'
  | 'split_faceoff'
  | 'eye_strip'
  | 'low_angle_swoop'
  | 'prop_spotlight'
  | 'motion_card';

export type TransitionId =
  | 'hard_cut'
  | 'diagonal_slash'
  | 'crimson_flash'
  | 'silhouette_wipe'
  | 'ink_fade'
  | 'popup_fold';

export type ExpressionId =
  | 'calm'
  | 'warm'
  | 'joy'
  | 'curious'
  | 'awe'
  | 'sly'
  | 'shocked'
  | 'grief'
  | 'stern'
  | 'angry';

export type PoseId =
  | 'stand'
  | 'walk'
  | 'sit'
  | 'kneel'
  | 'recoil'
  | 'gesture'
  | 'hang_upside_down'
  | 'soar'
  | 'attack';

export type MotionId =
  | 'still'
  | 'enter_left'
  | 'enter_right'
  | 'cross_stage'
  | 'step_forward'
  | 'retreat'
  | 'leap_arc';

export type FrameMode = 'main' | 'nested_story' | 'chapter_title' | 'moral_card' | 'end_screen';

export type CrowdId =
  | 'none'
  | 'courtiers'
  | 'villagers'
  | 'army'
  | 'forest_herd'
  | 'monks'
  // Wave 3: +6 Crowds (12 total)
  | 'city_commuters'
  | 'cyber_drones'
  | 'pirate_crew'
  | 'scholars_hall'
  | 'spectral_flock'
  | 'masquerade_ball'
  // Wave 5: +18 Crowds (12 -> 30 total)
  | 'stadium_fans'
  | 'festival_dancers'
  | 'bazaar_merchants'
  | 'press_paparazzi'
  | 'protest_rally'
  | 'mech_squadron'
  | 'fairy_wisps'
  | 'undead_horde'
  | 'safari_herd'
  | 'ballroom_waltz'
  | 'courtroom_gallery'
  | 'orchestra_pit'
  | 'space_dock_crew'
  | 'tavern_patrons'
  | 'school_hallway'
  | 'roman_legion'
  | 'ninja_clan'
  | 'circus_audience';

export type CameraMoveId =
  | 'still'
  | 'slow_push'
  | 'slow_pull'
  | 'pan_left'
  | 'pan_right'
  | 'impact_shake';

export type FxId =
  | 'none'
  | 'shock_burst'
  | 'question_mark'
  | 'smear_swoop'
  | 'crimson_impact'
  | 'divine_aura'
  // Wave 3: +8 Beat FX (14 total)
  | 'speed_lines'
  | 'magic_runes'
  | 'glitch_tear'
  | 'sparkle_burst'
  | 'spotlight_beam'
  | 'shatter_glass'
  | 'heartbeat_pulse'
  | 'comic_pow'
  // Wave 5: +22 Beat FX (14 -> 36 total)
  | 'anime_impact_frame'
  | 'chromatic_split'
  | 'lens_flare_sweep'
  | 'portal_vortex'
  | 'time_freeze_ripple'
  | 'sonic_boom_rings'
  | 'ink_splatter_burst'
  | 'holographic_scan'
  | 'lightning_web'
  | 'petal_cyclone'
  | 'fire_breath_cone'
  | 'frost_crystallize'
  | 'shadow_tendrils'
  | 'golden_halo_burst'
  | 'crt_scan_flash'
  | 'blood_moon_eclipse'
  | 'laser_grid'
  | 'starlight_nova'
  | 'comic_speed_zoom'
  | 'water_splash_arc'
  | 'dust_shockwave'
  | 'radar_ping';

export type WeatherId =
  | 'fireflies'
  | 'embers'
  | 'rain'
  | 'mist'
  | 'petals'
  | 'none'
  // Wave 3: +6 Weathers (12 total)
  | 'snow'
  | 'lightning_storm'
  | 'sandstorm'
  | 'starfall'
  | 'sakura_blossoms'
  | 'data_matrix'
  // Wave 5: +18 Weathers (12 -> 30 total)
  | 'autumn_leaves'
  | 'floating_lanterns'
  | 'underwater_bubbles'
  | 'confetti_shower'
  | 'ash_fallout'
  | 'acid_rain'
  | 'aurora_ribbons'
  | 'dandelion_seeds'
  | 'meteor_shower'
  | 'neon_sparks'
  | 'golden_pollen'
  | 'plasma_arcs'
  | 'hailstorm'
  | 'blizzard_gale'
  | 'fog_bank'
  | 'locust_swarm'
  | 'volcanic_cinders'
  | 'starlight_dust';

export type RaagId =
  | 'bhairavi'
  | 'yaman'
  | 'marwa'
  | 'darbari'
  | 'bhoopali'
  | 'malkauns'
  | 'desh'
  | 'greek_lyre'
  | 'medieval_lute'
  | 'guqin_bamboo'
  | 'gamelan_wayang'
  | 'cedar_flute'
  | 'kora_griot';

export type SfxId =
  | 'none'
  | 'temple_bell'
  | 'shankha_conch'
  | 'sword_clash'
  | 'thunder_crack'
  | 'arrow_whoosh'
  | 'mystic_chime'
  | 'court_gasp'
  | 'wooden_gavel'
  | 'fire_crackle';

export type AmbienceId =
  | 'auto'
  | 'none'
  | 'night_forest'
  | 'hearth_fire'
  | 'monsoon_rain'
  | 'river_stream'
  | 'temple_wind'
  | 'royal_hall';

export type PropAnchorId = 'stage' | 'actor_left_hand' | 'actor_right_hand';

export const AMBIENCE_CATALOG: Array<{ id: AmbienceId; label: string }> = [
  { id: 'auto', label: 'Auto (Match Stage & Weather)' },
  { id: 'none', label: 'Off (Silence)' },
  { id: 'night_forest', label: 'Night Forest & Crickets' },
  { id: 'hearth_fire', label: 'Crackling Hearth / Pyre' },
  { id: 'monsoon_rain', label: 'Soft Monsoon Rain' },
  { id: 'river_stream', label: 'Flowing River / Lake' },
  { id: 'temple_wind', label: 'Temple & Mountain Breeze' },
  { id: 'royal_hall', label: 'Warm Palace Room Tone' },
];

export const PROP_ANCHOR_CATALOG: Array<{ id: PropAnchorId; label: string }> = [
  { id: 'stage', label: 'Stage Pedestal / Slot' },
  { id: 'actor_left_hand', label: 'Held by Left Actor' },
  { id: 'actor_right_hand', label: 'Held by Right Actor' },
];

export type VoiceSourceMode = 'mic' | 'upload' | 'cloud_tts' | 'local_tts' | 'browser_tts';
export type CloudTtsProviderId = 'gemini' | 'openai' | 'elevenlabs' | 'custom_server';

export interface CharacterVoiceAssignment {
  voiceId: string;
  style: string;
}

export interface VoiceStudioSettings {
  source: VoiceSourceMode;
  cloudProvider: CloudTtsProviderId;
  cloudModel: string;
  localEndpoint: string;
  localModel: string;
  speed: number;
  browserVoiceUri: string;
  autoSyncDuration: boolean;
}

export type RenderStyleId =
  | 'chiaroscuro'
  | 'shadow_puppetry'
  | 'lineless_vector'
  | 'woodblock_print'
  | 'stained_glass'
  | 'papercraft_diorama'
  | 'sumi_e_wash'
  | 'greek_amphora'
  | 'kente_tapestry'
  | 'illuminated_codex'
  | 'anime_cel'
  | 'manga_screentone'
  | 'blueprint_technical'
  | 'gouache_storybook'
  | 'neon_cybernoir'
  | 'felt_puppet'
  | 'risograph_print'
  | 'backlit_sand'
  | 'scratchboard_noir'
  | 'byzantine_mosaic';

export type RenderStyleCategory =
  | 'Editorial, Anime & Explainers'
  | 'Tactile & Handcrafted'
  | 'Mystery, Manga & Sci-Fi'
  | 'World Heritage & Epics';

export type MotionCadenceId = 'auto' | '60fps' | '24fps' | '12fps';

export type MotionProfileId =
  | 'auto'
  | 'cinematic_drama'
  | 'naturalistic'
  | 'snappy_cartoon'
  | 'motion_graphics';

export const MOTION_CADENCE_CATALOG: Array<{
  id: MotionCadenceId;
  label: string;
  shortLabel: string;
  note: string;
}> = [
  { id: 'auto', label: 'Auto (Style Native)', shortLabel: 'Auto', note: 'Matches each art medium (12/15/24/60fps)' },
  { id: '60fps', label: '60fps Smooth Fluid', shortLabel: '60fps', note: 'Silky modern explainer & broadcast motion' },
  { id: '24fps', label: '24fps Cinema Cadence', shortLabel: '24fps', note: 'Theatrical anime & feature film rhythm' },
  { id: '12fps', label: '12fps Handcrafted Twos', shortLabel: '12fps', note: 'Tactile stop-motion, felt & printmaker feel' },
];

export const MOTION_PROFILE_CATALOG: Array<{
  id: MotionProfileId;
  label: string;
  shortLabel: string;
  note: string;
}> = [
  { id: 'auto', label: 'Auto (Style Matched)', shortLabel: 'Auto', note: 'Matches 12-Principles feel to active Art Engine' },
  { id: 'cinematic_drama', label: 'Cinematic Drama', shortLabel: 'Cinema', note: 'Deliberate anticipation, cushioned slow-in/out & dramatic settle' },
  { id: 'naturalistic', label: 'Naturalistic Life', shortLabel: 'Natural', note: 'Subtle organic breathing, 7-frame overlap & asymmetric weight shifts' },
  { id: 'snappy_cartoon', label: 'Snappy Cartoon', shortLabel: 'Cartoon', note: 'Bold volume-conserving squash/stretch, high arcs & spring overshoot' },
  { id: 'motion_graphics', label: 'Motion Graphics', shortLabel: 'MoGraph', note: 'Crisp cubic-bezier ease-out reveals & snappy lower-third timing' },
];

export type PostFxPassId =
  | 'none'
  | 'bayer_dither'
  | 'pixel_grid_16bit'
  | 'crisp_outline'
  | 'chromatic_pop'
  | 'halftone_zine';

export const POST_FX_PASS_CATALOG: Array<{
  id: PostFxPassId;
  label: string;
  shortLabel: string;
  note: string;
}> = [
  { id: 'none', label: 'Off (Engine Native)', shortLabel: 'Off', note: 'Pure Art Engine finish with zero extra post-pass' },
  { id: 'bayer_dither', label: 'Bayer 4×4 Dither', shortLabel: 'Bayer', note: 'Ordered 4×4 pixel-composer dither matrix across shadows & tones' },
  { id: 'pixel_grid_16bit', label: '16-Bit Pixel Grid', shortLabel: '16-Bit', note: 'Integer-snapped nearest-neighbor pixel grid + subtle Bayer grain' },
  { id: 'crisp_outline', label: 'Crisp Graphic Edge', shortLabel: 'Edge', note: 'High-contrast graphic edge sharpening & cel-ink punch' },
  { id: 'chromatic_pop', label: 'Chromatic Split', shortLabel: 'RGB', note: 'Subtle prism RGB channel separation for kinetic/cyber impact' },
  { id: 'halftone_zine', label: 'Halftone Zine', shortLabel: 'Halftone', note: 'Duotone comic/risograph Ben-Day dot screen overlay' },
];

export const RENDER_STYLE_CATEGORIES: RenderStyleCategory[] = [
  'Editorial, Anime & Explainers',
  'Tactile & Handcrafted',
  'Mystery, Manga & Sci-Fi',
  'World Heritage & Epics',
];

export type LookPresetId =
  | 'classic_chiaroscuro'
  | 'gilded_epic'
  | 'sunlit_storybook'
  | 'moonlit_noir'
  | 'palm_leaf_manuscript';

export type ColorGradeId =
  | 'default'
  | 'warm_gold'
  | 'indigo_noir'
  | 'vermilion_royal'
  | 'emerald_fable'
  | 'sepia_manuscript';

export type SurfaceTextureId =
  | 'clean'
  | 'parchment_grain'
  | 'palm_leaf_fibers'
  | 'woodblock_halftone'
  | 'cinema_35mm';

export type RimLightId = 'auto' | 'gold' | 'moon_silver' | 'fire_crimson' | 'divine_cyan' | 'none';

export type CaptionStyleId =
  | 'classic_cinema'
  | 'gold_manuscript'
  | 'shorts_bold_pop'
  | 'minimal_clean'
  | 'comic_speech_pop'
  | 'minimal_editorial';

export type FrameBorderId = 'clean_letterbox' | 'gold_filigree' | 'manuscript_margin' | 'full_bleed';

export type CastMarkId =
  | 'default'
  | 'none'
  | 'vermilion_tilak'
  | 'tripundra_ash'
  | 'royal_mustache'
  | 'full_beard'
  | 'divine_halo';

export type CastHeadgearId =
  | 'default'
  | 'none'
  | 'royal_turban'
  | 'golden_mukut'
  | 'sage_topknot'
  | 'battle_helm';

export interface EpisodeVisualStyle {
  renderStyle: RenderStyleId;
  lookPreset: LookPresetId;
  colorGrade: ColorGradeId;
  texture: SurfaceTextureId;
  shadowContrast: number; // 0.6 (airy storybook) .. 1.0 (default) .. 1.4 (deep noir)
  inkWeight: number; // 0.7 (fine miniature) .. 1.0 (default) .. 1.5 (heavy woodcut)
  rimLight: RimLightId;
  captionStyle: CaptionStyleId;
  frameBorder: FrameBorderId;
  vignette: number; // 0 .. 1 (default 0.35)
  motionCadence?: MotionCadenceId; // 'auto' | '60fps' | '24fps' | '12fps' stepped animation feel
  motionProfile?: MotionProfileId; // 12-Principles physics profile ('auto' | 'cinematic_drama' | 'naturalistic' | 'snappy_cartoon' | 'motion_graphics')
  postFxPass?: PostFxPassId; // Composable Pixel-Composer-inspired post-FX pass ('none' | 'bayer_dither' | 'pixel_grid_16bit' | 'crisp_outline' | 'chromatic_pop' | 'halftone_zine')
  expressionsEnabled?: boolean; // Episode-level toggle (true = dynamic facial expressions, false = neutral calm)
  karaokeCaptions?: boolean; // Word-by-word kinetic active caption highlighting (Latin, Indic, RTL & CJK)
  autoTrackSpeaker?: boolean; // Automatically frame active speaker in 9:16 vertical Shorts (default true)
  depthOfField?: number; // 0 .. 1 subtle 2.5D multi-plane rack focus / backdrop defocus (default 0.35)
  lightShafts?: number; // 0 .. 1 volumetric light shafts & dust-mote atmosphere (default 0.4)
  spatialAudio?: boolean; // Deterministic stereo panning & stage room acoustics (default true)
  hitstopEnabled?: boolean; // Deterministic 2-4 frame impact freeze + shock envelope on peak strikes (default true)
  foregroundFraming?: number; // 0 .. 1 near-camera foreground parallax silhouette framing (default 0.35)
  vfxIntensity?: number; // 0 .. 1 analytical 2D particle/ribbon/ring VFX & shockwave refraction intensity (default 0.75)
  tiltShiftAmount?: number; // 0 .. 1 miniature macro lens tilt-shift blur band (default 0 globally; auto 0.55 in papercraft_diorama)
}

export interface CastMember {
  id: string;
  name: string;
  archetype: ArchetypeId;
  primaryColor: string;
  accentColor: string;
  skinColor?: string;
  mark?: CastMarkId;
  headgear?: CastHeadgearId;
  scale?: number; // 0.82 .. 1.25 (default 1.0)
  /** Optional Sims-style parametric Modular Character / Animal / Entity DNA genome */
  dna?: CharacterDNA;
}

/**
 * Per-frame or frame-range expression keyframe for a specific character.
 * Provide any of:
 * - `frame` (0-based 60fps start frame) + optional `endFrame` (inclusive end frame for a bounded set of frames)
 * - `triggerPhrase` (exact words from `beat.dialogue` where this facial shift triggers — auto-aligned to 60fps!)
 * - `timeSec` (seconds within beat) or `at` (normalized 0..1 beat progress)
 * Plus optional `reason` explaining *why* the character feels this emotion (subtext/motivation).
 */
export interface ExpressionKeyframe {
  at?: number; // 0 .. 1 normalized beat progress
  frame?: number; // 0-based start frame index within beat at STUDIO_FPS (60fps)
  endFrame?: number; // Optional inclusive end frame for an explicit set-of-frames segment
  timeSec?: number; // Seconds offset within beat
  triggerPhrase?: string; // Spoken phrase in beat.dialogue anchoring this emotional shift
  reason?: string; // Short subtext / motivation note explaining why the character feels this emotion
  expression: ExpressionId;
}

/** Beat-level per-frame per-character expression cue (convenient for AI scripting). */
export interface BeatExpressionCue extends ExpressionKeyframe {
  castId: string;
}

/**
 * Declarative Sub-Beat Action Cue (O(1) stateless Motion-Canvas-style choreography).
 * Triggers mid-beat pose/motion switches, camera impact punches, hero prop pulses,
 * or FX bursts at an exact 60fps frame, normalized beat progress, or spoken triggerPhrase.
 */
export interface BeatActionCue {
  frame?: number;
  endFrame?: number;
  timeSec?: number;
  at?: number;
  triggerPhrase?: string;
  castId?: string;
  pose?: PoseId;
  motion?: MotionId;
  cameraPunch?: number; // 0 .. 1 zoom/shake impulse
  propPulse?: number; // 0 .. 1 radial highlight & scale impulse on hero prop
  fx?: FxId;
  sfx?: SfxId;
  label?: string;
}

export type CameraKeyframeEase = 'linear' | 'ease_in_out' | 'overshoot';

/**
 * Optional per-beat camera spline keyframe evaluated deterministically over beat progress u (0..1).
 * Composes cleanly with base cameraMove and speaker auto-framing.
 */
export interface CameraKeyframe {
  atFrac: number; // 0 .. 1 normalized beat progress
  zoom: number; // 0.7 .. 2.2 relative zoom multiplier (1.0 = neutral)
  panX: number; // -0.45 .. 0.45 normalized horizontal pan offset
  panY: number; // -0.35 .. 0.35 normalized vertical pan offset
  ease?: CameraKeyframeEase;
}

export type MotionCardLayoutId = 'hero_stat' | 'split_callout' | 'morph_bar';

/**
 * Declarative Kinetic Motion-Graphics Card specification for `shot: 'motion_card'`.
 * Renders staggered kinetic typography, morphing prompt/accent bars, and spring stat counters
 * through the active 20-Style Art Engine with zero per-video code generation.
 */
export interface MotionCardConfig {
  layout?: MotionCardLayoutId;
  kicker?: string;
  headline?: string;
  metric?: string;
  metricUnit?: string;
  bullets?: string[];
  highlightBar?: string;
  accentColor?: string;
}

export type ActorGazeTargetId = 'auto' | 'camera' | 'partner' | 'left' | 'right' | 'up' | 'down';
export type ActorHeadAngleId = 'auto' | 'front' | 'three_quarter' | 'profile';
export type ActorHeldHandId = 'front' | 'back' | 'both';

export const ACTOR_GAZE_TARGET_LIST: ActorGazeTargetId[] = [
  'auto',
  'camera',
  'partner',
  'left',
  'right',
  'up',
  'down',
];
export const ACTOR_HEAD_ANGLE_LIST: ActorHeadAngleId[] = [
  'auto',
  'front',
  'three_quarter',
  'profile',
];
export const ACTOR_HELD_HAND_LIST: ActorHeldHandId[] = ['front', 'back', 'both'];

export interface ActorPlacement {
  castId: string;
  slot: 'left' | 'center' | 'right' | 'overhead';
  pose: PoseId;
  expression: ExpressionId;
  /** Optional per-frame / mid-beat expression keyframes for this specific character */
  expressionTrack?: ExpressionKeyframe[];
  facing?: 'left' | 'right';
  motion?: MotionId;
  /** Optional fine stage nudge (-0.35 .. +0.35 normalized stage width/height) from interactive drag */
  offsetX?: number;
  offsetY?: number;
  /** Wave 9 (Upgrade 47): Optional dynamic eye-gaze target ('auto' tracks partner in multi-actor shots or camera on close-ups) */
  gazeTarget?: ActorGazeTargetId;
  /** Wave 9 (Upgrade 47/48): Optional head & torso orientation ('auto' adapts to shot & movement) */
  headAngle?: ActorHeadAngleId;
  /** Wave 9 (Upgrade 49): Optional prop rigged directly to the articulated 2-bone wrist/hand joint */
  heldProp?: PropId | 'none';
  /** Wave 9 (Upgrade 49): Which articulated hand holds heldProp (default 'front') */
  heldHand?: ActorHeldHandId;
}

export type LocationCardPosition = 'top_left' | 'bottom_left' | 'top_right';
export type LocationCardStyle = 'cinematic_bar' | 'scroll_ribbon' | 'minimal_tag';

export interface LocationCardConfig {
  title: string;
  subtitle?: string;
  position?: LocationCardPosition;
  style?: LocationCardStyle;
}

export interface SpriteSheetConfig {
  cols: number; // 1 .. 16 columns
  rows: number; // 1 .. 16 rows
  frameCount: number; // 1 .. 256 active frames
  fps: number; // 2 .. 30 playback frames per second
  loop?: boolean; // default true
}

export interface StoryBeat {
  id: string;
  title: string;
  duration: number;
  stage: StageId;
  mood: MoodId;
  weather: WeatherId;
  shot: ShotId;
  transition: TransitionId;
  lightSide: 'left' | 'right';
  prop: PropId;
  propSlot?: 'left' | 'center' | 'right' | 'overhead';
  propAnchor?: PropAnchorId; // Attach hero prop to stage pedestal OR directly in left/right actor's hand
  propOffsetX?: number; // Optional fine stage nudge (-0.35 .. +0.35)
  propOffsetY?: number; // Optional fine stage nudge (-0.35 .. +0.35)
  customPropDataUrl?: string; // Optional user-uploaded PNG/JPEG/WebP cutout prop for one-off chapter objects
  customPropLabel?: string;
  /** Optional frame-locked sprite sheet slicer grid for animated custom props */
  customPropSheet?: SpriteSheetConfig;
  customBackdropDataUrl?: string; // Optional user-uploaded PNG/JPEG/WebP painted backdrop plate
  customBackdropLabel?: string;
  frame?: FrameMode;
  crowd?: CrowdId;
  cameraMove?: CameraMoveId;
  /** Optional manual horizontal camera framing offset (-0.45 .. +0.45 stage width; + = focus right) */
  cameraFocusX?: number;
  /** Optional manual vertical camera framing offset (-0.3 .. +0.3 stage height; + = focus lower) */
  cameraFocusY?: number;
  /** Optional per-beat camera keyframe spline nodes evaluated deterministically across beat progress */
  cameraKeyframes?: CameraKeyframe[];
  flipStage?: boolean; // Mirror stage left-to-right for instant location variety
  haze?: number; // 0 .. 1 atmospheric depth mist
  backdropZoom?: number; // 0.9 .. 1.25 stage crop zoom
  renderStyle?: RenderStyleId; // Optional per-beat Art Engine override (e.g. flashback in Shadow Puppetry or Stained Glass)
  fx: FxId;
  sfx?: SfxId;
  sfxOffsetSec?: number; // Optional 0 .. duration delay so SFX lands right on the mid-beat punchline/action
  /** Optional audio cut lead/lag in seconds (-0.6 .. +0.6): + = J-cut pre-roll before visual cut, - = L-cut delayed voice entry */
  audioLeadSec?: number;
  ambience?: AmbienceId; // Continuous ambient soundscape bed (defaults to 'auto' matching stage/weather)
  raag: RaagId;
  musicEnergy: number;
  actors: ActorPlacement[];
  /** Optional per-frame character expression cues (merged with actor.expressionTrack at render time) */
  expressionCues?: BeatExpressionCue[];
  /** Optional declarative sub-beat choreography cues (pose, motion, cameraPunch, propPulse, fx, sfx) */
  actionCues?: BeatActionCue[];
  /** Optional kinetic motion-graphics card content when shot === 'motion_card' */
  motionCard?: MotionCardConfig;
  /** Optional animated location / time-jump lower-third banner */
  locationCard?: LocationCardConfig;
  speakerId: string;
  speakerLabel: string;
  dialogue: string;
}

export interface EpisodeScript {
  id: string;
  series: string;
  shelf?: StorybookShelf;
  language?: string;
  title: string;
  subtitle: string;
  defaultRaag: RaagId;
  visualStyle?: Partial<EpisodeVisualStyle>;
  cast: CastMember[];
  beats: StoryBeat[];
}

// =========================================================================
// ENCYCLOPEDIC DETERMINISTIC CATALOG METADATA (34 Cast | 24 Stages | 34 Props)
// =========================================================================
export const ARCHETYPE_CATALOG: Array<{
  id: ArchetypeId;
  label: string;
  group: ArchetypeGroup;
  stories: string;
}> = [
  // Epic & Divine (7)
  { id: 'deva', label: 'Celestial Deva / Avatar', group: 'Epic & Divine', stories: 'Lord Rama, Krishna, Vishnu, Shiva, Indra' },
  { id: 'goddess', label: 'Divine Devi / Shakti', group: 'Epic & Divine', stories: 'Goddess Durga, Sita, Saraswati, Lakshmi' },
  { id: 'demon_king', label: 'Ten-Crowned Asura', group: 'Epic & Divine', stories: 'Ravana, Mahishasura, Bakasura, Rakshasas' },
  { id: 'vanara_hero', label: 'Vanara Hero (Hanuman)', group: 'Epic & Divine', stories: 'Hanuman, Sugriva, Angada, Ramayana' },
  { id: 'spirit', label: 'Betaal / Spirit', group: 'Epic & Divine', stories: 'Betaal, Ghosts, Cursed Souls' },
  { id: 'yaksha', label: 'Forest Yaksha', group: 'Epic & Divine', stories: 'Mahabharata Yaksha Prashna, Nature Guardians' },
  { id: 'statue_apsara', label: 'Golden Throne Apsara', group: 'Epic & Divine', stories: 'Singhasan Battisi Statues, Celestial Nymphs' },

  // Royalty & Folk (11)
  { id: 'king', label: 'Royal King', group: 'Royalty & Folk', stories: 'Vikramaditya, Bhoja, Krishna Deva Raya, Dasharatha' },
  { id: 'emperor', label: 'Mughal Emperor', group: 'Royalty & Folk', stories: 'Emperor Akbar, Imperial Courts, Nawabs' },
  { id: 'queen', label: 'Queen / Princess', group: 'Royalty & Folk', stories: 'Draupadi, Somaprabha, Kaikeyi, Noblewomen' },
  { id: 'sage', label: 'Rishi / Sage', group: 'Royalty & Folk', stories: 'Valmiki, Vishwamitra, Chanakya, Brahmin' },
  { id: 'courtier', label: 'Witty Courtier', group: 'Royalty & Folk', stories: 'Birbal, Tenali Rama, Gopal Bhar, Ministers' },
  { id: 'warrior', label: 'Epic Warrior / Prince', group: 'Royalty & Folk', stories: 'Arjuna, Lakshmana, Yudhishthira, Karna' },
  { id: 'ascetic', label: 'Mystic / Tantrik', group: 'Royalty & Folk', stories: 'Tantrik, Sorcerers, Rival Mystics' },
  { id: 'merchant', label: 'Merchant / Traveler', group: 'Royalty & Folk', stories: 'Seth, Sea Traders, Villagers, Travelers' },
  { id: 'child', label: 'Clever Child / Disciple', group: 'Royalty & Folk', stories: 'Ekalavya, Prahlada, Nachiketa, Luv-Kush' },
  { id: 'elder_woman', label: 'Wise Elder / Shabari', group: 'Royalty & Folk', stories: 'Shabari, Kunti, Grandmothers, Folk Elders' },
  { id: 'guard', label: 'Royal Guard / Bandit', group: 'Royalty & Folk', stories: 'Palace Sentinels, Dacoits, Soldiers' },

  // Fable Fauna (16)
  { id: 'monkey', label: 'Clever Monkey', group: 'Fable Fauna', stories: 'Panchatantra, Jataka Monkey King' },
  { id: 'lion', label: 'Forest Lion', group: 'Fable Fauna', stories: 'Panchatantra King of Beasts' },
  { id: 'tiger', label: 'Bengal Tiger', group: 'Fable Fauna', stories: 'Hitopadesha Greedy Tiger, Jungle Fables' },
  { id: 'bull', label: 'Noble Bull / Ox', group: 'Fable Fauna', stories: 'Panchatantra Book 1 Sanjivaka, Nandi' },
  { id: 'hare', label: 'Clever Hare / Rabbit', group: 'Fable Fauna', stories: 'Lion & Clever Hare, Jataka Moon Rabbit' },
  { id: 'jackal', label: 'Cunning Jackal', group: 'Fable Fauna', stories: 'Panchatantra, Blue Jackal, Hitopadesha' },
  { id: 'serpent', label: 'Sacred Naga', group: 'Fable Fauna', stories: 'Panchatantra, Kaliya, Shesha, Folk Tales' },
  { id: 'elephant', label: 'Temple Elephant', group: 'Fable Fauna', stories: 'Panchatantra, Jataka, Airavata' },
  { id: 'deer', label: 'Golden Deer', group: 'Fable Fauna', stories: 'Jataka Banyan Deer, Ramayana Maricha' },
  { id: 'crow', label: 'Clever Crow', group: 'Fable Fauna', stories: 'Panchatantra, Hitopadesha, Birbal Crows' },
  { id: 'crane', label: 'River Crane / Swan', group: 'Fable Fauna', stories: 'Crane & Crab, Talkative Tortoise, Hamsa' },
  { id: 'crocodile', label: 'River Crocodile', group: 'Fable Fauna', stories: 'Monkey & Crocodile, River Fables' },
  { id: 'tortoise', label: 'Wise Tortoise', group: 'Fable Fauna', stories: 'Talkative Tortoise, Jataka & Panchatantra' },
  { id: 'owl', label: 'Counsellor Owl', group: 'Fable Fauna', stories: 'Panchatantra Crows & Owls, Night Seers' },
  { id: 'mouse', label: 'Clever Mouse / Rat', group: 'Fable Fauna', stories: 'Panchatantra, Aesop Lion & Mouse' },
  { id: 'dog', label: 'Loyal Dog / Hound', group: 'Fable Fauna', stories: 'Yudhishthira’s Dog, Aesop, Folk Tales' },
  // World Legends & Folklore (6)
  { id: 'fox', label: 'Cunning Fox / Kitsune', group: 'World Legends', stories: 'Aesop Fox & Crow / Sour Grapes, Kitsune, Reynard' },
  { id: 'wolf', label: 'Timber Wolf / Coyote', group: 'World Legends', stories: 'Grimm Fairy Tales, Aesop, Indigenous Coyote' },
  { id: 'spider', label: 'Anansi Trickster Spider', group: 'World Legends', stories: 'West African Akan Anansi Stories' },
  { id: 'knight', label: 'Knight / Nordic Hero', group: 'World Legends', stories: 'King Arthur, Grimm Heroes, Greek & Norse Epics' },
  { id: 'samurai', label: 'Samurai / Eastern Hero', group: 'World Legends', stories: 'Momotaro, Japanese Yokai, Chinese Martial Epics' },
  { id: 'raven', label: 'Spirit Raven / Thunderbird', group: 'World Legends', stories: 'Pacific NW Raven Steals the Sun, Norse Ravens' },
  // Modern & Sci-Fi (10)
  { id: 'detective', label: 'Noir Detective', group: 'Modern & Sci-Fi', stories: 'Mystery, True Crime, 1940s Noir Investigations' },
  { id: 'scientist', label: 'Lead Scientist', group: 'Modern & Sci-Fi', stories: 'Science Explainers, Space Labs, Discoveries' },
  { id: 'astronaut', label: 'EVA Astronaut', group: 'Modern & Sci-Fi', stories: 'Orbital Missions, Mars Colonies, Deep Space' },
  { id: 'cyber_hacker', label: 'Cyberpunk Hacker', group: 'Modern & Sci-Fi', stories: 'Neon Thrillers, Netrunner Heists, Tech Noir' },
  { id: 'android', label: 'Synthetic Android', group: 'Modern & Sci-Fi', stories: 'AI Ethics, Sci-Fi Dramas, Future Worlds' },
  { id: 'mech_pilot', label: 'Starfighter / Mech Pilot', group: 'Modern & Sci-Fi', stories: 'Mecha Anime, Starship Squadrons, Space Operas' },
  { id: 'journalist', label: 'Investigative Journalist', group: 'Modern & Sci-Fi', stories: 'Documentaries, Newsroom Explainers, History' },
  { id: 'street_musician', label: 'Indie Street Musician', group: 'Modern & Sci-Fi', stories: 'Slice of Life, Urban Stories, Music Shorts' },
  { id: 'cat_mascot', label: 'Stylized Cat Mascot', group: 'Modern & Sci-Fi', stories: 'Channel Host, Cozy Explainers, Fables' },
  { id: 'robot_companion', label: 'Helper Bot Companion', group: 'Modern & Sci-Fi', stories: 'Tech Tutorials, Sci-Fi Sidekick, Kids STEM' },
  // Fantasy & Creatures (10)
  { id: 'wizard', label: 'Arcane Wizard', group: 'Fantasy & Creatures', stories: 'High Fantasy, Spellcraft, Merlin & Lore' },
  { id: 'pirate_captain', label: 'Pirate Captain', group: 'Fantasy & Creatures', stories: 'High Seas Adventures, Treasure Hunts' },
  { id: 'ninja', label: 'Shadow Shinobi', group: 'Fantasy & Creatures', stories: 'Feudal Stealth, Martial Arts, Eastern Lore' },
  { id: 'viking', label: 'Nordic Viking', group: 'Fantasy & Creatures', stories: 'Norse Sagas, Fjord Expeditions, Mythology' },
  { id: 'pharaoh', label: 'Ancient Pharaoh', group: 'Fantasy & Creatures', stories: 'Egyptian History, Pyramid Mysteries, Empires' },
  { id: 'vampire_lord', label: 'Gothic Vampire Lord', group: 'Fantasy & Creatures', stories: 'Gothic Horror, Victorian Mystery, Dark Fantasy' },
  { id: 'dragon_kin', label: 'Dragon-Kin Champion', group: 'Fantasy & Creatures', stories: 'Draconic Epics, RPG Campaigns, Fantasy' },
  { id: 'elf_archer', label: 'Sylvan Elf Archer', group: 'Fantasy & Creatures', stories: 'Elven Kingdoms, Woodland Quests, RPG' },
  { id: 'dwarf_smith', label: 'Mountain Dwarf Smith', group: 'Fantasy & Creatures', stories: 'Forge Legends, Underground Citadels, RPG' },
  { id: 'ghost_phantom', label: 'Luminous Phantom', group: 'Fantasy & Creatures', stories: 'Ghost Stories, Haunted Halls, Supernatural' },
  // Wave 5: World Mythology & Legends (10)
  { id: 'zeus_thunderer', label: 'Zeus Thunderer', group: 'World Legends', stories: 'Greek Mythology, Olympus Epics, Lightning King' },
  { id: 'athena_strategist', label: 'Athena Strategist', group: 'World Legends', stories: 'Greek Wisdom, Odyssey Counsel, Aegis Shield' },
  { id: 'anubis_guardian', label: 'Anubis Guardian', group: 'World Legends', stories: 'Egyptian Underworld, Duat Scales, Pyramid Lore' },
  { id: 'valkyrie_shieldmaiden', label: 'Valkyrie Shieldmaiden', group: 'World Legends', stories: 'Norse Mythology, Valhalla Riders, Saga Epics' },
  { id: 'kitsune_foxspirit', label: 'Kitsune Nine-Tail Spirit', group: 'World Legends', stories: 'Japanese Yokai, Shrine Spirits, Fox Tricksters' },
  { id: 'sun_wukong_trickster', label: 'Sun Wukong Monkey King', group: 'World Legends', stories: 'Journey to the West, Cloud Somersault, Staff' },
  { id: 'quetzal_priest', label: 'Quetzal Feathered Priest', group: 'World Legends', stories: 'Mesoamerican Lore, Aztec & Mayan Sun Temples' },
  { id: 'celtic_druid', label: 'Celtic Oak Druid', group: 'World Legends', stories: 'Stonehenge Rituals, Irish Folklore, Grove Seers' },
  { id: 'djinn_genie', label: 'Astral Djinn / Genie', group: 'World Legends', stories: '1001 Nights, Lamp Spirits, Desert Wonders' },
  { id: 'poseidon_tideking', label: 'Poseidon Tide King', group: 'World Legends', stories: 'Atlantis, Sea Voyages, Trident Storms' },
  // Wave 5: Historical & Cultural Eras (10)
  { id: 'roman_centurion', label: 'Roman Centurion', group: 'Historical Eras', stories: 'Roman Legions, Colosseum, Empire Campaigns' },
  { id: 'spartan_hoplite', label: 'Spartan Hoplite', group: 'Historical Eras', stories: 'Thermopylae, Classical Greece, Phalanx' },
  { id: 'renaissance_painter', label: 'Renaissance Master', group: 'Historical Eras', stories: 'Florence Studios, Art History, Da Vinci Era' },
  { id: 'victorian_inventor', label: 'Victorian Inventor', group: 'Historical Eras', stories: 'Steampunk, Industrial Revolution, Clockwork' },
  { id: 'wild_west_sheriff', label: 'Wild West Sheriff', group: 'Historical Eras', stories: 'Frontier Duels, Saloon Justice, Westerns' },
  { id: 'outlaw_bandit', label: 'Frontier Outlaw Bandit', group: 'Historical Eras', stories: 'Train Heists, Wild West Legends, Rogues' },
  { id: 'feudal_shogun', label: 'Feudal Shogun Warlord', group: 'Historical Eras', stories: 'Edo Period, Sengoku Epics, Samurai Clans' },
  { id: 'maratha_commander', label: 'Maratha Fort Commander', group: 'Historical Eras', stories: 'Deccan Forts, Indian Historical Epics, Cavalry' },
  { id: 'silk_road_nomad', label: 'Silk Road Nomad', group: 'Historical Eras', stories: 'Steppe Caravans, Marco Polo, Desert Trade' },
  { id: 'caveman_hunter', label: 'Prehistoric Cave Hunter', group: 'Historical Eras', stories: 'Ice Age, Origins of Fire, Anthropology' },
  // Wave 5: Modern Everyday & Civic (10)
  { id: 'doctor_surgeon', label: 'Doctor & Surgeon', group: 'Civic & Media', stories: 'Medical Dramas, Health Explainers, ER Heroes' },
  { id: 'firefighter_rescuer', label: 'Firefighter Rescuer', group: 'Civic & Media', stories: 'Emergency Rescue, Civic Courage, Safety' },
  { id: 'police_officer', label: 'Police Officer', group: 'Civic & Media', stories: 'Crime Dramas, Precinct Cases, City Patrol' },
  { id: 'judge_magistrate', label: 'Court Judge / Magistrate', group: 'Civic & Media', stories: 'Courtroom Trials, Legal History, Justice' },
  { id: 'lawyer_advocate', label: 'Trial Lawyer / Advocate', group: 'Civic & Media', stories: 'Legal Debates, Famous Cases, Civics' },
  { id: 'school_teacher', label: 'School Teacher', group: 'Civic & Media', stories: 'Classroom Lessons, EdTech, Kids Stories' },
  { id: 'chef_culinary', label: 'Culinary Master Chef', group: 'Civic & Media', stories: 'Food History, Kitchen Dramas, Recipe Shorts' },
  { id: 'delivery_courier', label: 'City Delivery Courier', group: 'Civic & Media', stories: 'Urban Slice-of-Life, Hustle Stories, Comedy' },
  { id: 'construction_engineer', label: 'Construction Engineer', group: 'Civic & Media', stories: 'Megastructures, Engineering Explainers, Cities' },
  { id: 'farmer_grower', label: 'Modern Farmer & Grower', group: 'Civic & Media', stories: 'Agriculture, Rural Tales, Sustainability' },
  // Wave 5: Media, Business & Explainer (10)
  { id: 'ceo_founder', label: 'Tech CEO / Founder', group: 'Civic & Media', stories: 'Startup Stories, Business Case Studies, Keynotes' },
  { id: 'podcast_host', label: 'Podcast Studio Host', group: 'Civic & Media', stories: 'Interview Shows, Audio Essays, Creator Lore' },
  { id: 'news_anchor', label: 'Broadcast News Anchor', group: 'Civic & Media', stories: 'Breaking Bulletins, Documentary Intros, Satire' },
  { id: 'stock_trader', label: 'Wall Street Trader', group: 'Civic & Media', stories: 'Finance Explainers, Market Crashes, Economics' },
  { id: 'tech_developer', label: 'Software Developer', group: 'Civic & Media', stories: 'Coding Tutorials, Startup Culture, AI Demos' },
  { id: 'influencer_vlogger', label: 'Creator & Vlogger', group: 'Civic & Media', stories: 'Social Media Commentary, Travel Vlogs, Trends' },
  { id: 'historian_professor', label: 'Historian Professor', group: 'Civic & Media', stories: 'Deep-Dive History, Museum Lectures, Timelines' },
  { id: 'coach_mentor', label: 'Strategy Coach / Mentor', group: 'Civic & Media', stories: 'Sports Dramas, Self-Improvement, Leadership' },
  { id: 'film_director', label: 'Cinema Film Director', group: 'Civic & Media', stories: 'Behind-the-Scenes, Movie Essays, Production' },
  { id: 'esports_gamer', label: 'Esports Pro Gamer', group: 'Civic & Media', stories: 'Gaming Lore, Tournament Arcs, Tech Culture' },
  // Wave 5: Sci-Fi, Cyberpunk & Space (10)
  { id: 'bounty_hunter', label: 'Galactic Bounty Hunter', group: 'Modern & Sci-Fi', stories: 'Space Westerns, Cyber Hunts, Sci-Fi Action' },
  { id: 'alien_diplomat', label: 'Alien Envoys & Diplomat', group: 'Modern & Sci-Fi', stories: 'First Contact, Galactic Senate, Exoplanets' },
  { id: 'cyborg_enforcer', label: 'Cyborg Enforcer', group: 'Modern & Sci-Fi', stories: 'Cyberpunk Action, Augmentations, Neon Noir' },
  { id: 'time_traveler', label: 'Chrono Time Traveler', group: 'Modern & Sci-Fi', stories: 'Paradox Mysteries, Era Hopping, Sci-Fi' },
  { id: 'space_admiral', label: 'Starfleet Space Admiral', group: 'Modern & Sci-Fi', stories: 'Orbital Fleets, Space Operas, Command Decks' },
  { id: 'drone_operator', label: 'Tactical Drone Operator', group: 'Modern & Sci-Fi', stories: 'Recon Missions, Autonomous Tech, Thrillers' },
  { id: 'bio_geneticist', label: 'Bio-Geneticist', group: 'Modern & Sci-Fi', stories: 'CRISPR Explainers, Biotech Mysteries, Labs' },
  { id: 'wasteland_scavenger', label: 'Wasteland Scavenger', group: 'Modern & Sci-Fi', stories: 'Post-Apocalyptic Survival, Desert Ruins' },
  { id: 'quantum_physicist', label: 'Quantum Physicist', group: 'Modern & Sci-Fi', stories: 'Physics Explainers, Multiverse, Colliders' },
  { id: 'ai_hologram', label: 'Sentient AI Hologram', group: 'Modern & Sci-Fi', stories: 'Digital Consciousness, Virtual Worlds, Guides' },
  // Wave 5: High Fantasy & RPG Classes (10)
  { id: 'paladin_crusader', label: 'Radiant Paladin Crusader', group: 'Fantasy & Creatures', stories: 'Sacred Oaths, Castle Sieges, RPG Parties' },
  { id: 'necromancer_mage', label: 'Shadow Necromancer', group: 'Fantasy & Creatures', stories: 'Dark Citadels, Undead Legions, Forbidden Lore' },
  { id: 'alchemist_brewer', label: 'Master Alchemist', group: 'Fantasy & Creatures', stories: 'Potion Shops, Elixir Quests, Arcane Science' },
  { id: 'shadow_rogue', label: 'Guild Shadow Rogue', group: 'Fantasy & Creatures', stories: 'Thieves Guilds, Rooftop Heists, Stealth RPG' },
  { id: 'tavern_bard', label: 'Minstrel Tavern Bard', group: 'Fantasy & Creatures', stories: 'Tavern Ballads, Storytelling Quests, Comedy' },
  { id: 'beast_ranger', label: 'Woodland Beast Ranger', group: 'Fantasy & Creatures', stories: 'Wilderness Trackers, Forest Quests, Archers' },
  { id: 'archmage_oracle', label: 'Celestial Archmage Oracle', group: 'Fantasy & Creatures', stories: 'Prophecies, Arcane Towers, Astral Magic' },
  { id: 'goblin_tinkerer', label: 'Goblin Gear Tinkerer', group: 'Fantasy & Creatures', stories: 'Fantasy Comedy, Contraptions, Cave Markets' },
  { id: 'orc_warlord', label: 'Ironclad Orc Warlord', group: 'Fantasy & Creatures', stories: 'Fantasy Battles, Rival Clans, Sieges' },
  { id: 'celestial_angel', label: 'Winged Celestial Angel', group: 'Fantasy & Creatures', stories: 'Sky Citadels, Divine Messengers, Epics' },
  // Wave 5: Dark Gothic, Horror & Folklore (10)
  { id: 'werewolf_stalker', label: 'Moonlit Werewolf Stalker', group: 'Gothic & Horror', stories: 'Full Moon Curses, Dark Woods, Folklore Horror' },
  { id: 'plague_doctor', label: 'Beaked Plague Doctor', group: 'Gothic & Horror', stories: 'Gothic Mystery, Medieval Epidemics, Alchemists' },
  { id: 'mummy_sovereign', label: 'Cursed Mummy Sovereign', group: 'Gothic & Horror', stories: 'Tomb Raiders, Ancient Curses, Crypt Horror' },
  { id: 'witch_herbalist', label: 'Moonlight Witch Herbalist', group: 'Gothic & Horror', stories: 'Cauldron Spells, Forest Cottages, Halloween' },
  { id: 'grim_reaper', label: 'Cloaked Grim Reaper', group: 'Gothic & Horror', stories: 'Underworld Bargains, Ghost Lore, Parables' },
  { id: 'gargoyle_sentinel', label: 'Stone Gargoyle Sentinel', group: 'Gothic & Horror', stories: 'Cathedral Rooftops, Awakened Statues, Gothic' },
  { id: 'banshee_wraith', label: 'Celtic Banshee Wraith', group: 'Gothic & Horror', stories: 'Irish Ghost Lore, Misty Moors, Hauntings' },
  { id: 'mad_scientist', label: 'Gothic Mad Scientist', group: 'Gothic & Horror', stories: 'Frankenstein Labs, Lightning Experiments' },
  { id: 'occult_investigator', label: 'Occult Investigator', group: 'Gothic & Horror', stories: 'Paranormal Files, Eldritch Mysteries, Noir' },
  { id: 'pumpkin_scarecrow', label: 'Lantern Pumpkin Scarecrow', group: 'Gothic & Horror', stories: 'Autumn Folklore, Harvest Fables, Spooky Kids' },
  // Wave 5: Wildlife & Prehistoric (10)
  { id: 'trex_dinosaur', label: 'T-Rex Apex Dinosaur', group: 'Wildlife & Mythic', stories: 'Jurassic Valleys, Dino Science, Kids Epics' },
  { id: 'triceratops_dino', label: 'Horned Triceratops', group: 'Wildlife & Mythic', stories: 'Prehistoric Herds, Paleontology, Kids Tales' },
  { id: 'grizzly_bear', label: 'Mountain Grizzly Bear', group: 'Wildlife & Mythic', stories: 'Wilderness Survival, Forest Fables, Wildlife' },
  { id: 'polar_penguin', label: 'Emperor Polar Penguin', group: 'Wildlife & Mythic', stories: 'Antarctic Expeditions, Kids Comedy, Climate' },
  { id: 'giant_panda', label: 'Bamboo Giant Panda', group: 'Wildlife & Mythic', stories: 'Eastern Bamboo Groves, Martial Fables, Kids' },
  { id: 'bald_eagle', label: 'Soaring Bald Eagle', group: 'Wildlife & Mythic', stories: 'Mountain Peaks, Sky Scouts, Wildlife Docs' },
  { id: 'silverback_gorilla', label: 'Silverback Jungle Gorilla', group: 'Wildlife & Mythic', stories: 'Rainforest Guardians, Wildlife Stories' },
  { id: 'desert_camel', label: 'Caravan Desert Camel', group: 'Wildlife & Mythic', stories: 'Sahara Expeditions, Silk Road Fables' },
  { id: 'great_white_shark', label: 'Great White Ocean Shark', group: 'Wildlife & Mythic', stories: 'Deep Reef Docs, Sea Adventures, Ocean Lore' },
  { id: 'giant_octopus', label: 'Kraken Giant Octopus', group: 'Wildlife & Mythic', stories: 'Deep Sea Mysteries, Sunken Ships, Marine Bio' },
  // Wave 5: Mythic Beasts & Companions (10)
  { id: 'fire_phoenix', label: 'Reborn Fire Phoenix', group: 'Wildlife & Mythic', stories: 'Resurrection Myths, Flame Guardians, Fantasy' },
  { id: 'frost_unicorn', label: 'Starlight Frost Unicorn', group: 'Wildlife & Mythic', stories: 'Enchanted Glades, Fairy Tales, Kids Magic' },
  { id: 'winged_griffin', label: 'Royal Winged Griffin', group: 'Wildlife & Mythic', stories: 'Sky Citadels, Treasure Guardians, Heraldry' },
  { id: 'sea_mermaid', label: 'Coral Sea Mermaid', group: 'Wildlife & Mythic', stories: 'Ocean Kingdoms, Lagoon Folklore, Fairy Tales' },
  { id: 'sky_pegasus', label: 'Cloud Sky Pegasus', group: 'Wildlife & Mythic', stories: 'Olympus Skies, Hero Mounts, Mythic Flight' },
  { id: 'forest_treant', label: 'Ancient Forest Treant', group: 'Wildlife & Mythic', stories: 'Living Woods, Nature Spirits, High Fantasy' },
  { id: 'stone_golem', label: 'Runic Stone Golem', group: 'Wildlife & Mythic', stories: 'Temple Guardians, Dwarven Halls, Constructs' },
  { id: 'crystal_slime', label: 'Glowing Crystal Slime', group: 'Wildlife & Mythic', stories: 'RPG Companions, Dungeon Comedy, Cute Mascots' },
  { id: 'baby_dragon', label: 'Ember Baby Dragon', group: 'Wildlife & Mythic', stories: 'Kids Fantasy, Sidekick Hatchling, Quests' },
  { id: 'clockwork_automaton', label: 'Brass Clockwork Automaton', group: 'Wildlife & Mythic', stories: 'Steampunk Workshops, Mechanical Lore, Sci-Fi' },
  // Wave 5: Kids, Sports & Entertainment (10)
  { id: 'soccer_striker', label: 'Championship Soccer Striker', group: 'Sports & Kids', stories: 'World Cup Moments, Sports Shorts, Teamwork' },
  { id: 'cricket_batter', label: 'Stadium Cricket Batter', group: 'Sports & Kids', stories: 'Final-Over Thrillers, Cricket Legends, Sports' },
  { id: 'martial_artist', label: 'Dojo Martial Artist', group: 'Sports & Kids', stories: 'Kung Fu & Karate Training, Discipline Stories' },
  { id: 'circus_ringmaster', label: 'Big-Top Circus Ringmaster', group: 'Sports & Kids', stories: 'Carnival Showtime, Variety Acts, Spectacles' },
  { id: 'stage_magician', label: 'Illusionist Stage Magician', group: 'Sports & Kids', stories: 'Magic Tricks, Theater Mysteries, Kids Shows' },
  { id: 'orchestra_conductor', label: 'Symphony Conductor', group: 'Sports & Kids', stories: 'Music History, Opera Halls, Classical Shorts' },
  { id: 'ballet_dancer', label: 'Principal Ballet Dancer', group: 'Sports & Kids', stories: 'Swan Lake, Dance Stories, Stage Arts' },
  { id: 'skateboard_kid', label: 'Street Skateboard Kid', group: 'Sports & Kids', stories: 'Suburban Adventures, Kids Comedy, Urban Fun' },
  { id: 'explorer_scout', label: 'Junior Explorer Scout', group: 'Sports & Kids', stories: 'Campfire Quests, Nature Science, Treehouse' },
  { id: 'toy_nutcracker', label: 'Clockwork Toy Nutcracker', group: 'Sports & Kids', stories: 'Holiday Tales, Playroom Magic, Fairy Tales' },
];

export const STAGE_CATALOG: Array<{ id: StageId; label: string; useCase: string; category?: string }> = [
  { id: 'banyan_clearing', label: 'Banyan Forest Clearing', useCase: 'Vikram & Betaal, Jataka groves', category: 'Mythic & Sacred' },
  { id: 'royal_durbar', label: 'Royal Durbar Hall', useCase: 'Tenali Rama, Gopal Bhar, Ayodhya court', category: 'Historical & Eras' },
  { id: 'mughal_courtyard', label: 'Mughal Sandstone Courtyard', useCase: 'Akbar & Birbal Fatehpur court', category: 'Historical & Eras' },
  { id: 'ashoka_vatika', label: 'Ashoka Vatika Grove', useCase: 'Ramayana Sita & Hanuman in Lanka', category: 'Mythic & Sacred' },
  { id: 'golden_lanka', label: 'Golden Spires of Lanka', useCase: 'Ramayana Ravana citadel & celestial cities', category: 'Mythic & Sacred' },
  { id: 'kali_temple', label: 'Shadowed Kali Temple', useCase: 'Singhasan Battisi vows, divine boons', category: 'Mythic & Sacred' },
  { id: 'throne_mound', label: 'Buried Throne Mound', useCase: 'Singhasan Battisi ancient excavation', category: 'Mythic & Sacred' },
  { id: 'moonlit_terrace', label: 'Moonlit Marble Terrace', useCase: 'Palace nights, lotus clues, intrigue', category: 'Historical & Eras' },
  { id: 'royal_bedchamber', label: 'Royal Bedchamber', useCase: 'Palace secrets, seven mattresses', category: 'Interiors & Cozy' },
  { id: 'palace_garden', label: 'Lantern Palace Garden', useCase: 'Tenali Rama, Gopal Bhar, nocturnal strolls', category: 'Historical & Eras' },
  { id: 'river_ghat', label: 'Lantern River Ghat', useCase: 'Yamuna crossings, Sarayu, crocodile banks', category: 'Mythic & Sacred' },
  { id: 'enchanted_lake', label: 'Enchanted Lotus Lake', useCase: 'Yaksha Prashna, Hitopadesha pond', category: 'Nature & Biomes' },
  { id: 'bamboo_forest', label: 'Dense Jungle Grove', useCase: 'Panchatantra, Dandaka forest, Jataka', category: 'Nature & Biomes' },
  { id: 'cave_den', label: 'Mountain Cave & Den', useCase: 'Talking Cave, Kishkindha, lion’s den', category: 'Nature & Biomes' },
  { id: 'ocean_ship', label: 'Ocean Crossing & Ram Setu', useCase: 'Sea voyages, Odyssey, Lanka crossing', category: 'Nature & Biomes' },
  { id: 'bazaar_lane', label: 'Lantern Bazaar Street', useCase: 'Tenali, Birbal, Arabian Nights & merchants', category: 'Historical & Eras' },
  { id: 'courtyard_well', label: 'Stone Courtyard Well', useCase: 'Lion & Clever Hare, Frog in the Well', category: 'Historical & Eras' },
  { id: 'royal_dungeon', label: 'Iron-Barred Dungeon', useCase: 'Captive princes, twists, courtroom rescues', category: 'Horror & Noir' },
  { id: 'desert_caravan', label: 'Starlit Caravan Dunes', useCase: '1001 Nights, Silk Road & desert parables', category: 'Nature & Biomes' },
  { id: 'himalayan_hermitage', label: 'Himalayan Hermitage', useCase: 'Rishi ashrams, Valmiki, mountain sages', category: 'Mythic & Sacred' },
  { id: 'cloud_skies', label: 'Moonlit Cloud Skies', useCase: 'Hanuman, Sun Wukong, Raven & Icarus flight', category: 'High Fantasy' },
  { id: 'kurukshetra_field', label: 'Epic Battlefield', useCase: 'Mahabharata, Ramayana, Troy & Arthurian battles', category: 'Mythic & Sacred' },
  { id: 'village_chowk', label: 'Lantern Village Square', useCase: 'Folk comedy, merchants, thieves', category: 'Historical & Eras' },
  { id: 'cremation_ground', label: 'Smoldering Cremation Ground', useCase: 'Betaal & eerie Tantrik rituals', category: 'Horror & Noir' },
  { id: 'olympus_acropolis', label: 'Greek Acropolis & Olive Grove', useCase: 'Aesop’s Fables, Greek Mythology & Odyssey', category: 'Mythic & Sacred' },
  { id: 'bamboo_pagoda', label: 'Misty Pagoda & Torii Shrine', useCase: 'Journey to the West, Japanese & Chinese Tales', category: 'Mythic & Sacred' },
  { id: 'enchanted_cottage', label: 'Nordic Pine Woods & Cottage', useCase: 'Grimm’s Fairy Tales, Celtic & Norse Folklore', category: 'High Fantasy' },
  { id: 'savanna_baobab', label: 'African Savanna & Great Baobab', useCase: 'Anansi the Spider & African Griot Fables', category: 'Nature & Biomes' },
  { id: 'red_canyon_mesa', label: 'Red Rock Canyon & Starry Mesa', useCase: 'Indigenous American & Mesoamerican Legends', category: 'Nature & Biomes' },
  { id: 'tropical_archipelago', label: 'Javanese Banyan & Volcano Bay', useCase: 'Sang Kancil, Wayang & Southeast Asian Tales', category: 'Nature & Biomes' },
  // Wave 3: +20 Multi-Genre Stages (50 total)
  { id: 'neon_cyber_alley', label: 'Neon Cyber Alley', useCase: 'Cyberpunk thrillers, rain-slicked sci-fi noir', category: 'Sci-Fi & Cyber' },
  { id: 'orbital_starship_bridge', label: 'Orbital Starship Bridge', useCase: 'Deep space command deck, sci-fi dramas', category: 'Sci-Fi & Cyber' },
  { id: 'mars_colony_dome', label: 'Mars Colony Dome', useCase: 'Planetary exploration, future frontiers', category: 'Sci-Fi & Cyber' },
  { id: 'noir_rainy_street', label: '1940s Noir Rainy Street', useCase: 'Detective mysteries, true crime, art-deco', category: 'Horror & Noir' },
  { id: 'modern_news_studio', label: 'Modern Broadcast Studio', useCase: 'News explainers, tech briefings, commentary', category: 'Workplaces & Civic' },
  { id: 'cozy_bookshop_cafe', label: 'Cozy Bookshop Café', useCase: 'Slice-of-life, literary essays, warm talks', category: 'Interiors & Cozy' },
  { id: 'high_tech_lab', label: 'High-Tech Research Lab', useCase: 'STEM explainers, biotech, AI experiments', category: 'Workplaces & Civic' },
  { id: 'courtroom_hall', label: 'Grand Courtroom Hall', useCase: 'Legal dramas, debates, historical trials', category: 'Workplaces & Civic' },
  { id: 'ancient_egypt_temple', label: 'Ancient Egypt Temple', useCase: 'Pharaoh chronicles, pyramid mysteries', category: 'Mythic & Sacred' },
  { id: 'roman_colosseum', label: 'Roman Colosseum Arena', useCase: 'Classical history, gladiator epics, Rome', category: 'Mythic & Sacred' },
  { id: 'nordic_fjord_hall', label: 'Nordic Fjord Longhouse', useCase: 'Viking sagas, aurora legends, Norse lore', category: 'Historical & Eras' },
  { id: 'gothic_cathedral', label: 'Gothic Rose Cathedral', useCase: 'Victorian horror, vampire tales, dark fantasy', category: 'Horror & Noir' },
  { id: 'steampunk_clocktower', label: 'Steampunk Clocktower', useCase: 'Brass gearworks, time-travel adventures', category: 'Historical & Eras' },
  { id: 'pirate_galleon_deck', label: 'Pirate Galleon Deck', useCase: 'High-seas battles, treasure voyages', category: 'Historical & Eras' },
  { id: 'underwater_atlantis', label: 'Sunken Atlantis Ruins', useCase: 'Oceanic myths, underwater exploration', category: 'High Fantasy' },
  { id: 'volcanic_citadel', label: 'Obsidian Volcanic Citadel', useCase: 'Dark fantasy climaxes, dragon lairs', category: 'High Fantasy' },
  { id: 'snowy_mountain_pass', label: 'Snowy Alpine Pass', useCase: 'Survival treks, Himalayan & Nordic quests', category: 'Nature & Biomes' },
  { id: 'cherry_blossom_shrine', label: 'Cherry Blossom Shrine', useCase: 'Anime romance, samurai duels, sakura spring', category: 'Mythic & Sacred' },
  { id: 'vintage_train_car', label: 'Vintage Express Train Car', useCase: 'Murder mysteries, cross-country journeys', category: 'Historical & Eras' },
  { id: 'astral_observatory', label: 'Astral Cosmos Observatory', useCase: 'Astronomy explainers, arcane starlore', category: 'Sci-Fi & Cyber' },
  // Wave 5: Ancient & Sacred World (10)
  { id: 'babylon_hanging_gardens', label: 'Babylon Hanging Gardens', useCase: 'Ancient Mesopotamia terraced wonders & waterfalls', category: 'Mythic & Sacred' },
  { id: 'mayan_step_pyramid', label: 'Mayan Step Pyramid', useCase: 'Mesoamerican sun temples & jungle plazas', category: 'Mythic & Sacred' },
  { id: 'stonehenge_circle', label: 'Stonehenge Megalith Circle', useCase: 'Solstice druids, Celtic mystery & ancient stars', category: 'Mythic & Sacred' },
  { id: 'great_wall_watchtower', label: 'Great Wall Watchtower', useCase: 'Imperial frontier beacons & mountain ridges', category: 'Mythic & Sacred' },
  { id: 'angkor_jungle_ruins', label: 'Angkor Jungle Ruins', useCase: 'Banyan-wrapped sandstone shrines & lost temples', category: 'Mythic & Sacred' },
  { id: 'petra_canyon_temple', label: 'Petra Rose Canyon Temple', useCase: 'Carved desert treasury cliff & torchlit siq', category: 'Mythic & Sacred' },
  { id: 'spartan_mountain_pass', label: 'Spartan Thermopylae Pass', useCase: 'Narrow sea cliffs, phalanx shields & epics', category: 'Mythic & Sacred' },
  { id: 'persian_rose_palace', label: 'Persian Rose Palace', useCase: 'Persepolis arches, turquoise tiles & courtyards', category: 'Mythic & Sacred' },
  { id: 'vedic_gurukul', label: 'Vedic Forest Gurukul', useCase: 'Sacred ashram huts, banyan study & havan fire', category: 'Mythic & Sacred' },
  { id: 'tibetan_monastery', label: 'Tibetan Cliff Monastery', useCase: 'Prayer flags, snow peaks & golden stupas', category: 'Mythic & Sacred' },
  // Wave 5: Historical Towns & Eras (10)
  { id: 'wild_west_saloon', label: 'Wild West Saloon', useCase: 'Swinging wooden doors, frontier showdown & piano', category: 'Historical & Eras' },
  { id: 'victorian_fog_alley', label: 'Victorian Fog Alley', useCase: 'Gaslamps, cobblestones, Sherlock & steampunk', category: 'Historical & Eras' },
  { id: 'renaissance_plaza', label: 'Renaissance Florence Plaza', useCase: 'Marble dome, sunlit colonnade & guild banners', category: 'Historical & Eras' },
  { id: 'medieval_castle_keep', label: 'Medieval Castle Keep', useCase: 'Battlements, drawbridge, knightly sieges', category: 'Historical & Eras' },
  { id: 'medieval_tavern_inn', label: 'Medieval Tavern Inn', useCase: 'Hearth fire, timber beams, bards & quests', category: 'Historical & Eras' },
  { id: 'roaring_twenties_jazz', label: '1920s Art-Deco Jazz Club', useCase: 'Golden sunburst stage, speakeasy & brass band', category: 'Historical & Eras' },
  { id: 'ancient_silk_caravanserai', label: 'Silk Road Caravanserai', useCase: 'Vaulted oasis courtyard, spice carts & lanterns', category: 'Historical & Eras' },
  { id: 'viking_longship_fjord', label: 'Viking Longship Fjord', useCase: 'Dragon-prow sails, icy cliffs & northern lights', category: 'Historical & Eras' },
  { id: 'feudal_dojo_hall', label: 'Feudal Tatami Dojo Hall', useCase: 'Shoji screens, calligraphy scroll & sword rack', category: 'Historical & Eras' },
  { id: 'industrial_foundry', label: 'Industrial Steam Foundry', useCase: 'Molten crucible, iron gears & Victorian steam', category: 'Historical & Eras' },
  // Wave 5: Modern City & Street (10)
  { id: 'downtown_skyline_roof', label: 'Downtown Skyline Rooftop', useCase: 'Metropolis towers, water tank & twilight skyline', category: 'Modern City' },
  { id: 'subway_metro_platform', label: 'Subway Metro Platform', useCase: 'Tiled station, incoming rail lights & urban commute', category: 'Modern City' },
  { id: 'busy_crosswalk_plaza', label: 'Busy Neon Crosswalk Plaza', useCase: 'Shibuya/Times Square billboards & pedestrian zebra', category: 'Modern City' },
  { id: 'suburban_cul_de_sac', label: 'Suburban Cul-de-Sac', useCase: 'Tree-lined homes, porches & neighborhood stories', category: 'Modern City' },
  { id: 'neon_arcade_hall', label: 'Retro Neon Arcade Hall', useCase: 'Glowing cabinet rows, synth grid & esports vibes', category: 'Modern City' },
  { id: 'airport_departure_gate', label: 'Airport Departure Gate', useCase: 'Glass concourse, runway jetliner & travel drama', category: 'Modern City' },
  { id: 'highway_overpass_night', label: 'Night Highway Overpass', useCase: 'City light trails, streetlamps & midnight chase', category: 'Modern City' },
  { id: 'harbor_container_dock', label: 'Harbor Container Dock', useCase: 'Gantry cranes, stacked freight & seafront mystery', category: 'Modern City' },
  { id: 'rooftop_helipad', label: 'Skyscraper Rooftop Helipad', useCase: 'H-pad beacons, action evac & skyline wind', category: 'Modern City' },
  { id: 'public_park_fountain', label: 'City Park Fountain Plaza', useCase: 'Tiered stone fountain, benches & autumn trees', category: 'Modern City' },
  // Wave 5: Workplaces, Civic & Media (10)
  { id: 'startup_war_room', label: 'Startup Glass War Room', useCase: 'Whiteboards, sticky notes, product launch sprint', category: 'Workplaces & Civic' },
  { id: 'stock_exchange_floor', label: 'Stock Exchange Trading Floor', useCase: 'LED market tickers, trading pods & finance drama', category: 'Workplaces & Civic' },
  { id: 'hospital_operating_room', label: 'Hospital Operating Room', useCase: 'Surgical lamps, telemetry monitors & medical story', category: 'Workplaces & Civic' },
  { id: 'university_lecture_hall', label: 'University Lecture Hall', useCase: 'Tiered seating, chalkboard equations & academia', category: 'Workplaces & Civic' },
  { id: 'elementary_classroom', label: 'Bright Elementary Classroom', useCase: 'ABC board, desks, globe & kids educational tales', category: 'Workplaces & Civic' },
  { id: 'podcast_recording_booth', label: 'Podcast Recording Booth', useCase: 'Acoustic foam, ON AIR sign & warm studio mics', category: 'Workplaces & Civic' },
  { id: 'restaurant_open_kitchen', label: 'Chef Open Kitchen Pass', useCase: 'Copper pans, flame burners & culinary showdowns', category: 'Workplaces & Civic' },
  { id: 'science_cleanroom', label: 'Biotech Science Cleanroom', useCase: 'Sterile glass pods, laser optics & lab discoveries', category: 'Workplaces & Civic' },
  { id: 'police_precinct_desk', label: 'Police Precinct Bullpen', useCase: 'Case boards, desk lamps & detective briefings', category: 'Workplaces & Civic' },
  { id: 'city_library_atrium', label: 'Grand City Library Atrium', useCase: 'Towering book galleries, reading lamps & skylight', category: 'Workplaces & Civic' },
  // Wave 5: Interiors & Cozy Spaces (10)
  { id: 'luxury_penthouse_lounge', label: 'Luxury Penthouse Lounge', useCase: 'Floor-to-ceiling skyline glass & fireplace sofa', category: 'Interiors & Cozy' },
  { id: 'warm_family_livingroom', label: 'Warm Family Living Room', useCase: 'Cozy hearth, bookshelf, armchair & storytelling', category: 'Interiors & Cozy' },
  { id: 'attic_inventor_workshop', label: 'Attic Inventor Workshop', useCase: 'Blueprints, brass gears, skylights & tinkering', category: 'Interiors & Cozy' },
  { id: 'art_gallery_hall', label: 'Modern Art Gallery Hall', useCase: 'Spotlit framed masterpieces & polished floor', category: 'Interiors & Cozy' },
  { id: 'grand_opera_theater', label: 'Grand Opera Theater', useCase: 'Velvet curtains, gilded balconies & proscenium', category: 'Interiors & Cozy' },
  { id: 'cozy_bakery_counter', label: 'Cozy Patisserie Bakery', useCase: 'Pastry display, brick oven & morning aroma', category: 'Interiors & Cozy' },
  { id: 'greenhouse_conservatory', label: 'Botanical Greenhouse', useCase: 'Glass Victorian dome, hanging vines & rare palms', category: 'Interiors & Cozy' },
  { id: 'museum_dinosaur_hall', label: 'Natural History Dino Hall', useCase: 'Towering fossil skeleton & vaulted museum arches', category: 'Interiors & Cozy' },
  { id: 'fitness_boxing_gym', label: 'Championship Boxing Gym', useCase: 'Roped ring, heavy bags & training montage', category: 'Interiors & Cozy' },
  { id: 'retro_diner_booth', label: '1950s Retro Neon Diner', useCase: 'Checkered floor, red booths & neon jukebox', category: 'Interiors & Cozy' },
  // Wave 5: Sci-Fi & Cyberpunk (10)
  { id: 'orbital_space_station', label: 'Orbital Ring Space Station', useCase: 'Curved viewport over planet & zero-G corridor', category: 'Sci-Fi & Cyber' },
  { id: 'alien_bioluminescent_forest', label: 'Alien Bioluminescent Forest', useCase: 'Glowing exoplanet flora, twin moons & spores', category: 'Sci-Fi & Cyber' },
  { id: 'dyson_sphere_vista', label: 'Dyson Sphere Megastructure', useCase: 'Star-encircling orbital rings & cosmic scale', category: 'Sci-Fi & Cyber' },
  { id: 'cyber_megamall_atrium', label: 'Cyberpunk Megamall Atrium', useCase: 'Floating holo-ads, skybridges & neon balconies', category: 'Sci-Fi & Cyber' },
  { id: 'mech_hangar_bay', label: 'Giant Mech Hangar Bay', useCase: 'Gantry cranes, armored titan bay & launch lights', category: 'Sci-Fi & Cyber' },
  { id: 'vr_cyberspace_grid', label: 'VR Cyberspace Laser Grid', useCase: 'Perspective neon horizon, data monoliths & synth', category: 'Sci-Fi & Cyber' },
  { id: 'post_apoc_ruined_highway', label: 'Post-Apoc Ruined Highway', useCase: 'Broken overpass pillars, dust haze & wasteland', category: 'Sci-Fi & Cyber' },
  { id: 'underground_fallout_bunker', label: 'Underground Vault Bunker', useCase: 'Blast gear door, amber emergency lights & pipes', category: 'Sci-Fi & Cyber' },
  { id: 'solarpunk_sky_garden', label: 'Solarpunk Sky Garden', useCase: 'Solar glass spires, cascading terraces & turbines', category: 'Sci-Fi & Cyber' },
  { id: 'quantum_collider_chamber', label: 'Quantum Collider Chamber', useCase: 'Concentric superconducting torus & plasma glow', category: 'Sci-Fi & Cyber' },
  // Wave 5: High Fantasy & Magic (10)
  { id: 'floating_sky_citadel', label: 'Floating Sky Citadel', useCase: 'Levitation islands, waterfalls into clouds & spires', category: 'High Fantasy' },
  { id: 'wizard_arcane_tower', label: 'Wizard Arcane Tower', useCase: 'Floating runes, spiral library & starry dome', category: 'High Fantasy' },
  { id: 'dragon_hoard_cavern', label: 'Dragon Hoard Gold Cavern', useCase: 'Glittering treasure mounds, lava cracks & pillars', category: 'High Fantasy' },
  { id: 'elven_canopy_city', label: 'Elven Treetop Canopy City', useCase: 'Luminous swan-bridges among giant ancient trees', category: 'High Fantasy' },
  { id: 'dwarven_forge_hall', label: 'Dwarven Runic Forge Hall', useCase: 'Colossal carved stone pillars & molten anvil', category: 'High Fantasy' },
  { id: 'enchanted_mushroom_grove', label: 'Enchanted Mushroom Grove', useCase: 'Giant glowing toadstools, fireflies & fae mist', category: 'High Fantasy' },
  { id: 'crystal_prism_cave', label: 'Crystal Prism Cavern', useCase: 'Refracting giant amethyst & cyan quartz spires', category: 'High Fantasy' },
  { id: 'alchemist_apothecary', label: 'Alchemist Apothecary Shop', useCase: 'Shelves of glowing potions, alembics & herbs', category: 'High Fantasy' },
  { id: 'fairy_glade_bridge', label: 'Fairy Glade Stone Bridge', useCase: 'Arching moss bridge, moonlit creek & willow', category: 'High Fantasy' },
  { id: 'cloud_coliseum', label: 'Celestial Cloud Coliseum', useCase: 'Marble sky arena, golden rings & mythic duels', category: 'High Fantasy' },
  // Wave 5: Horror, Mystery & Noir (10)
  { id: 'haunted_manor_foyer', label: 'Haunted Manor Grand Foyer', useCase: 'Twin staircase, chandelier, lightning window', category: 'Horror & Noir' },
  { id: 'misty_graveyard_gates', label: 'Misty Graveyard Iron Gates', useCase: 'Wrought-iron arch, headstones & full moon mist', category: 'Horror & Noir' },
  { id: 'abandoned_asylum_ward', label: 'Abandoned Gothic Ward', useCase: 'Flickering corridor, arched bars & eerie shadows', category: 'Horror & Noir' },
  { id: 'lighthouse_storm_cliff', label: 'Storm Cliff Lighthouse', useCase: 'Sweeping beacon beam, crashing waves & rocks', category: 'Horror & Noir' },
  { id: 'underground_catacombs', label: 'Torchlit Stone Catacombs', useCase: 'Vaulted crypt tunnels, sconces & hidden passages', category: 'Horror & Noir' },
  { id: 'detective_noir_office', label: '1940s Detective Noir Office', useCase: 'Venetian blind shadows, frosted door & city rain', category: 'Horror & Noir' },
  { id: 'locked_bank_vault', label: 'Locked Steel Bank Vault', useCase: 'Giant circular vault door, safe boxes & laser alarm', category: 'Horror & Noir' },
  { id: 'foggy_london_pier', label: 'Foggy Victorian Pier', useCase: 'Wooden pilings, moored ship & gaslamp harbor fog', category: 'Horror & Noir' },
  { id: 'cursed_carnival_tent', label: 'Cursed Midnight Carnival', useCase: 'Striped midway tent, eerie bulbs & dark ferris', category: 'Horror & Noir' },
  { id: 'prison_cellblock', label: 'Iron-Tiered Prison Cellblock', useCase: 'Barred galleries, spotlight sweep & breakout drama', category: 'Horror & Noir' },
  // Wave 5: Nature, Biomes & Prehistoric (10)
  { id: 'coral_reef_lagoon', label: 'Sunlit Coral Reef Lagoon', useCase: 'Underwater caustics, staghorn coral & reef fish', category: 'Nature & Biomes' },
  { id: 'amazon_rainforest_canopy', label: 'Amazon Rainforest Canopy', useCase: 'Layered emerald jungle, liana vines & mist sunbeams', category: 'Nature & Biomes' },
  { id: 'arctic_glacier_icebergs', label: 'Arctic Glacier Icebergs', useCase: 'Towering blue ice floes, frozen sea & polar sky', category: 'Nature & Biomes' },
  { id: 'african_sunset_savanna', label: 'African Sunset Savanna', useCase: 'Acacia silhouettes, giant crimson sun & golden grass', category: 'Nature & Biomes' },
  { id: 'grand_canyon_overlook', label: 'Grand Canyon Rim Overlook', useCase: 'Layered red-rock mesas & winding gorge river', category: 'Nature & Biomes' },
  { id: 'jurassic_fern_valley', label: 'Jurassic Fern Volcano Valley', useCase: 'Prehistoric ferns, smoking volcano & misty lake', category: 'Nature & Biomes' },
  { id: 'sahara_starlit_dunes', label: 'Sahara Starlit Sand Dunes', useCase: 'Sweeping wind-carved erg dunes & Milky Way arc', category: 'Nature & Biomes' },
  { id: 'alpine_meadow_lake', label: 'Alpine Wildflower Meadow', useCase: 'Snow-capped peaks, mirror lake & pine slopes', category: 'Nature & Biomes' },
  { id: 'bioluminescent_sea_cave', label: 'Bioluminescent Sea Cave', useCase: 'Glowing cyan surf inside basalt sea-arch grotto', category: 'Nature & Biomes' },
  { id: 'autumn_maple_river', label: 'Autumn Maple Footbridge', useCase: 'Crimson Japanese maples, stepping stones & stream', category: 'Nature & Biomes' },
  // Wave 5: Sports, Travel & Kids Worlds (10)
  { id: 'floodlit_cricket_stadium', label: 'Floodlit Cricket Stadium', useCase: 'Towering light pylons, green oval & packed stands', category: 'Sports & Kids' },
  { id: 'championship_soccer_pitch', label: 'Championship Soccer Pitch', useCase: 'Striped turf, goal net, stadium bowl & spotlights', category: 'Sports & Kids' },
  { id: 'racing_circuit_paddock', label: 'Grand Prix Racing Paddock', useCase: 'Checkered start gantry, pit garages & speedway', category: 'Sports & Kids' },
  { id: 'cruise_liner_promenade', label: 'Ocean Cruise Promenade', useCase: 'Teak railing, sunset wake, lifeboats & deck lights', category: 'Sports & Kids' },
  { id: 'hot_air_balloon_skies', label: 'Hot-Air Balloon Festival Skies', useCase: 'Cappadocia valleys & colorful drifting balloons', category: 'Sports & Kids' },
  { id: 'treehouse_clubhouse', label: 'Backyard Treehouse Clubhouse', useCase: 'Oak boughs, rope ladder, fairy lights & kids quest', category: 'Sports & Kids' },
  { id: 'giant_toybox_playroom', label: 'Giant Toybox Playroom', useCase: 'Oversized wooden blocks, bunting & storybook floor', category: 'Sports & Kids' },
  { id: 'circus_big_top_ring', label: 'Circus Big-Top Center Ring', useCase: 'Red-and-cream canopy, spotlights & sawdust ring', category: 'Sports & Kids' },
  { id: 'amusement_ferris_boardwalk', label: 'Amusement Ferris Boardwalk', useCase: 'Illuminated Ferris wheel, pier planks & twilight sea', category: 'Sports & Kids' },
  { id: 'candy_kingdom_bridge', label: 'Candy Kingdom Rainbow Bridge', useCase: 'Peppermint spires, pastel hills & wafer archway', category: 'Sports & Kids' },
];

export const MOOD_CATALOG: Array<{ id: MoodId; label: string; category?: string }> = [
  { id: 'midnight_banyan', label: 'Midnight Indigo', category: 'Classic Folklore' },
  { id: 'crimson_wrath', label: 'Crimson Wrath', category: 'Classic Folklore' },
  { id: 'golden_durbar', label: 'Golden Durbar', category: 'Classic Folklore' },
  { id: 'sandstone_dusk', label: 'Mughal Sandstone', category: 'Classic Folklore' },
  { id: 'twilight_temple', label: 'Twilight Violet', category: 'Classic Folklore' },
  { id: 'moonlit_marble', label: 'Silver Moonlight', category: 'Classic Folklore' },
  { id: 'emerald_jungle', label: 'Emerald Jungle', category: 'Nature & Biomes' },
  { id: 'mystic_teal', label: 'Mystic Lake Teal', category: 'Fantasy & Magic' },
  // Wave 3: +8 Mood Palettes (16 total)
  { id: 'cyber_magenta', label: 'Cyberpunk Neon Magenta', category: 'Sci-Fi & Neon' },
  { id: 'noir_monochrome', label: 'Silver Noir Monochrome', category: 'Noir & Vintage' },
  { id: 'arctic_aurora', label: 'Arctic Aurora Glow', category: 'Nature & Biomes' },
  { id: 'sunlit_morning', label: 'Crisp Sunlit Morning', category: 'Cinematic & Daylight' },
  { id: 'volcanic_inferno', label: 'Volcanic Molten Inferno', category: 'Horror & Drama' },
  { id: 'deep_abyss', label: 'Deep Ocean Abyss', category: 'Nature & Biomes' },
  { id: 'sakura_dawn', label: 'Sakura Blossom Dawn', category: 'Cinematic & Daylight' },
  { id: 'sepia_archive', label: 'Vintage Sepia Archive', category: 'Noir & Vintage' },
  // Wave 5: +24 Mood Palettes (40 total)
  { id: 'golden_hour_cinema', label: 'Golden Hour Cinema', category: 'Cinematic & Daylight' },
  { id: 'neon_tokyo_blue', label: 'Neon Tokyo Electric Blue', category: 'Sci-Fi & Neon' },
  { id: 'pastel_storybook', label: 'Pastel Storybook Morning', category: 'Kids & Whimsical' },
  { id: 'desert_mirage', label: 'Desert Sun Mirage', category: 'Nature & Biomes' },
  { id: 'toxic_wasteland', label: 'Toxic Acid Wasteland', category: 'Sci-Fi & Neon' },
  { id: 'lavender_twilight', label: 'Lavender Dream Twilight', category: 'Fantasy & Magic' },
  { id: 'cobalt_midnight', label: 'Cobalt Noir Midnight', category: 'Noir & Vintage' },
  { id: 'autumn_amber', label: 'Autumn Maple Amber', category: 'Nature & Biomes' },
  { id: 'spring_meadow', label: 'Spring Meadow Breeze', category: 'Cinematic & Daylight' },
  { id: 'blood_moon_crimson', label: 'Blood Moon Eclipse Crimson', category: 'Horror & Drama' },
  { id: 'ice_palace_cyan', label: 'Ice Palace Glacial Cyan', category: 'Fantasy & Magic' },
  { id: 'vintage_kodachrome', label: 'Vintage 1970s Kodachrome', category: 'Noir & Vintage' },
  { id: 'emerald_matrix', label: 'Emerald Code Matrix', category: 'Sci-Fi & Neon' },
  { id: 'royal_amethyst', label: 'Royal Velvet Amethyst', category: 'Fantasy & Magic' },
  { id: 'storm_slate', label: 'Tempest Storm Slate', category: 'Horror & Drama' },
  { id: 'sunset_coral', label: 'Tropical Sunset Coral', category: 'Cinematic & Daylight' },
  { id: 'candyland_pop', label: 'Candyland Sugar Pop', category: 'Kids & Whimsical' },
  { id: 'deep_space_void', label: 'Deep Space Nebula Void', category: 'Sci-Fi & Neon' },
  { id: 'copper_steampunk', label: 'Copper Brass Steampunk', category: 'Noir & Vintage' },
  { id: 'candlelit_parchment', label: 'Candlelit Parchment Warmth', category: 'Classic Folklore' },
  { id: 'ocean_turquoise', label: 'Lagoon Ocean Turquoise', category: 'Nature & Biomes' },
  { id: 'monsoon_indigo', label: 'Monsoon Cloud Indigo', category: 'Nature & Biomes' },
  { id: 'solarpunk_lime', label: 'Solarpunk Botanical Lime', category: 'Sci-Fi & Neon' },
  { id: 'obsidian_gold', label: 'Obsidian & Liquid Gold', category: 'Horror & Drama' },
];

export const PROP_CATALOG: Array<{ id: PropId; label: string; note: string; category?: string }> = [
  { id: 'none', label: 'None', note: 'Clear stage focus', category: 'General' },
  { id: 'khanda_sword', label: 'Khanda Broadsword', note: 'Gleaming royal steel', category: 'Weapons & Armor' },
  { id: 'bow_arrow', label: 'Divine Bow & Arrow', note: 'Rama Kodanda, Arjuna, Robin Hood', category: 'Weapons & Armor' },
  { id: 'gada_mace', label: 'Golden Gada Mace', note: 'Hanuman & Bhima war mace', category: 'Weapons & Armor' },
  { id: 'sudarshana_chakra', label: 'Sudarshana Chakra', note: 'Spinning golden celestial disc', category: 'Magic & Relics' },
  { id: 'trishul', label: 'Sacred Trishul', note: 'Shiva, Devi & Poseidon trident', category: 'Weapons & Armor' },
  { id: 'sanjevani_mountain', label: 'Sanjeevani Peak', note: 'Glowing herb mountain carried aloft', category: 'Magic & Relics' },
  { id: 'signet_ring', label: 'Royal Signet Ring', note: 'Rama’s Chudamani token & Shakuntala', category: 'Magic & Relics' },
  { id: 'stone_well', label: 'Stone Reflection Well', note: 'Lion & Clever Hare water reflection', category: 'Folklore & World' },
  { id: 'wooden_cage', label: 'Hunter’s Wooden Cage', note: 'Panchatantra, Aesop & Jataka rescues', category: 'Folklore & World' },
  { id: 'flying_stick', label: 'Carried Bamboo Pole', note: 'Talkative Tortoise mid-air flight', category: 'Folklore & World' },
  { id: 'royal_palanquin', label: 'Royal Palki Palanquin', note: 'Royal processions & palanquin riddles', category: 'Vehicles & Travel' },
  { id: 'poison_chalice', label: 'Smoking Poison Chalice', note: 'Palace intrigue & devotion trials', category: 'Mystery & Noir' },
  { id: 'golden_egg', label: 'Glowing Golden Egg', note: 'Aesop Goose & Folk boon fables', category: 'Magic & Relics' },
  { id: 'hand_mirror', label: 'Ornate Brass Mirror', note: 'Vanity, reflections & fairy tales', category: 'Folklore & World' },
  { id: 'saffron_feast', label: 'Saffron Rice & Mist', note: 'Chowki, banana leaf, rising mist', category: 'Food & Feast' },
  { id: 'seven_mattresses', label: 'Seven Mattresses', note: '7 layers + red hair marker', category: 'Folklore & World' },
  { id: 'lotus_petal', label: 'Falling Lotus Petal', note: 'Animated drift + impact ring', category: 'Folklore & World' },
  { id: 'diya_lamp', label: 'Brass Diya / Oil Lamp', note: 'Warm flickering flame cone (Aladdin / Diya)', category: 'Magic & Relics' },
  { id: 'treasure_chest', label: 'Treasure Chest', note: 'Gold coins & rubies', category: 'Magic & Relics' },
  { id: 'royal_scroll', label: 'Palm-Leaf / Parchment Scroll', note: 'Riddles, decrees, wisdom', category: 'Folklore & World' },
  { id: 'kali_idol', label: 'Temple Shrine Idol', note: 'Glowing third-eye silhouette', category: 'Magic & Relics' },
  { id: 'magic_chariot', label: 'Golden Chariot', note: 'Pushpaka Vimana, Helios & Epic war chariots', category: 'Vehicles & Travel' },
  { id: 'earthen_pot', label: 'Terracotta Matka / Jar', note: 'Village, Tenali, Birbal & Folk pots', category: 'Food & Feast' },
  { id: 'sacred_fire', label: 'Sacred Campfire / Havan', note: 'Ritual flames & storytelling fire', category: 'Folklore & World' },
  { id: 'banyan_bough', label: 'Hanging Banyan Bough', note: 'Perch for Betaal / monkeys', category: 'Folklore & World' },
  { id: 'peacock_throne', label: 'Royal Throne', note: 'King seat for durbar & palace scenes', category: 'Folklore & World' },
  { id: 'gold_bangle', label: 'Golden Bangle', note: 'Hitopadesha gleaming gold trap', category: 'Magic & Relics' },
  { id: 'hanging_khichdi_pot', label: 'Birbal Khichdi Tripod', note: 'Clay pot hung high over tiny fire', category: 'Food & Feast' },
  { id: 'golden_statue', label: 'Singhasan Putli Statue', note: 'Glowing golden guardian maiden', category: 'Magic & Relics' },
  { id: 'lotus_pond', label: 'Sacred Lotus Pool', note: 'Moonlit ripples & blooming lotus', category: 'Folklore & World' },
  { id: 'measuring_stake', label: 'Earth-Measure Stake', note: 'Gopal Bhar survey peg & rope', category: 'Folklore & World' },
  { id: 'wooden_garuda', label: 'Mechanical Garuda', note: 'Kathasaritsagara winged automaton', category: 'Vehicles & Travel' },
  { id: 'royal_scales', label: 'Scales of Justice', note: 'Tipping brass balance beam', category: 'Office & Media' },
  { id: 'conch_shell', label: 'Sacred Shankha Conch', note: 'Epic proclamation soundwaves', category: 'Music & Culture' },
  { id: 'story_box', label: 'Nyame’s Golden Story Box', note: 'Anansi’s radiant African tale chest', category: 'Magic & Relics' },
  { id: 'magic_staff', label: 'Ruyi Iron Staff / Wizard Staff', note: 'Sun Wukong’s gilded crimson staff', category: 'Weapons & Armor' },
  { id: 'golden_fleece', label: 'Greek Amphora & Laurel', note: 'Classical Attic vessel & victory wreath', category: 'Music & Culture' },
  { id: 'sun_orb', label: 'Radiant Stolen Sun Orb', note: 'Raven Steals the Sun & sky myths', category: 'Magic & Relics' },
  { id: 'magic_peach', label: 'Giant Immortal Peach', note: 'Journey to the West, Momotaro & Grimm', category: 'Food & Feast' },
  { id: 'kris_dagger', label: 'Javanese Golden Kris', note: 'Southeast Asian Wayang & archipelago blade', category: 'Weapons & Armor' },
  // Wave 3: +24 Multi-Genre Props (65 total)
  { id: 'magnifying_glass', label: 'Detective Magnifying Glass', note: 'Noir clue lens with glint', category: 'Mystery & Noir' },
  { id: 'holo_tablet', label: 'Holographic Data Tablet', note: 'Glowing sci-fi projection slate', category: 'Sci-Fi & Tech' },
  { id: 'energy_blade', label: 'Plasma Energy Blade', note: 'Luminous sci-fi laser saber', category: 'Weapons & Armor' },
  { id: 'neon_drone', label: 'Hovering Neon Drone', note: 'Orbiting recon drone with optic beam', category: 'Sci-Fi & Tech' },
  { id: 'vintage_camera', label: 'Vintage Press Camera', note: 'Classic flash-bulb journalism camera', category: 'Office & Media' },
  { id: 'microphone_stand', label: 'Studio Broadcast Mic', note: 'Chrome podcast & stage condenser mic', category: 'Office & Media' },
  { id: 'briefcase', label: 'Executive Leather Briefcase', note: 'Noir dossier & business mystery case', category: 'Office & Media' },
  { id: 'newspaper_frontpage', label: 'Breaking News Frontpage', note: 'Extra! Extra! printed headline sheet', category: 'Office & Media' },
  { id: 'coffee_mug', label: 'Steaming Coffee Mug', note: 'Cozy café & late-night desk cup', category: 'Food & Feast' },
  { id: 'laptop_screen', label: 'Glowing Code Laptop', note: 'Modern hacker & creator workstation', category: 'Sci-Fi & Tech' },
  { id: 'potion_flask', label: 'Bubbling Alchemy Flask', note: 'Glowing emerald/violet elixir bottle', category: 'Magic & Relics' },
  { id: 'spellbook_tome', label: 'Arcane Spellbook Tome', note: 'Floating leather grimoire with runes', category: 'Magic & Relics' },
  { id: 'wizard_staff', label: 'Crystal-Tipped Wizard Staff', note: 'Gnarled oak staff with pulsing orb', category: 'Magic & Relics' },
  { id: 'crystal_amulet', label: 'Radiant Crystal Amulet', note: 'Enchanted prism pendant with halo', category: 'Magic & Relics' },
  { id: 'brass_compass', label: 'Nautical Brass Compass', note: 'Spinning expedition needle & dial', category: 'Vehicles & Travel' },
  { id: 'antique_pocketwatch', label: 'Antique Pocket Watch', note: 'Steampunk ticking timepiece & chain', category: 'Mystery & Noir' },
  { id: 'violin_bow', label: 'Concert Violin & Bow', note: 'Classical strings & noir melody', category: 'Music & Culture' },
  { id: 'electric_guitar', label: 'Electric Rock Guitar', note: 'Indie stage & cyber-band riff axe', category: 'Music & Culture' },
  { id: 'golden_trophy', label: 'Championship Golden Trophy', note: 'Gleaming victory cup & laurel base', category: 'Sports & Kids' },
  { id: 'judge_gavel', label: 'Courtroom Judge Gavel', note: 'Mahogany verdict mallet & sound block', category: 'Office & Media' },
  { id: 'microscope', label: 'Laboratory Microscope', note: 'Precision optical STEM instrument', category: 'Science & Lab' },
  { id: 'rocket_model', label: 'Orbital Launch Rocket', note: 'Retro-futurist spacecraft model', category: 'Sci-Fi & Tech' },
  { id: 'pirate_map', label: 'Weathered Treasure Map', note: 'Parchment sea chart with crimson X', category: 'Vehicles & Travel' },
  { id: 'key_ornate', label: 'Ornate Skeleton Key', note: 'Gilded gothic vault & mystery key', category: 'Mystery & Noir' },
  // Wave 5: Weapons & Armor (12)
  { id: 'katana_blade', label: 'Curved Samurai Katana', note: 'Folded steel blade with silk-wrapped hilt', category: 'Weapons & Armor' },
  { id: 'viking_battleaxe', label: 'Nordic Runic Battleaxe', note: 'Bearded iron war axe with ash haft', category: 'Weapons & Armor' },
  { id: 'knight_shield', label: 'Heraldic Knight Shield', note: 'Steel heater shield with golden crest', category: 'Weapons & Armor' },
  { id: 'crossbow_bolts', label: 'Arbalest Crossbow', note: 'Heavy medieval crossbow loaded with bolt', category: 'Weapons & Armor' },
  { id: 'spear_halberd', label: 'Royal Halberd Polearm', note: 'Long axe-spear with crimson tassel', category: 'Weapons & Armor' },
  { id: 'flintlock_pistol', label: 'Brass Flintlock Pistol', note: 'Pirate & frontier engraved flintlock', category: 'Weapons & Armor' },
  { id: 'laser_rifle', label: 'Tactical Laser Rifle', note: 'Sci-fi pulse carbine with cyan emitter', category: 'Weapons & Armor' },
  { id: 'plasma_cannon', label: 'Heavy Plasma Cannon', note: 'Glowing twin-coil energy launcher', category: 'Weapons & Armor' },
  { id: 'shuriken_star', label: 'Spinning Ninja Shuriken', note: 'Four-point razor throwing star', category: 'Weapons & Armor' },
  { id: 'war_hammer', label: 'Runic War Hammer', note: 'Massive forged battle hammer with lightning', category: 'Weapons & Armor' },
  { id: 'roman_gladius', label: 'Roman Legion Gladius', note: 'Short legionary sword with brass pommel', category: 'Weapons & Armor' },
  { id: 'grappling_hook', label: 'Steel Grappling Hook', note: 'Tri-prong climbing hook & coiled rope', category: 'Weapons & Armor' },
  // Wave 5: Magic & Mythic Relics (12)
  { id: 'crystal_ball', label: 'Fortune Crystal Ball', note: 'Swirling nebula orb on brass claw stand', category: 'Magic & Relics' },
  { id: 'runestone_tablet', label: 'Glowing Runestone Tablet', note: 'Ancient carved slab pulsing with runes', category: 'Magic & Relics' },
  { id: 'phoenix_feather', label: 'Blazing Phoenix Feather', note: 'Radiant golden-crimson rebirth plume', category: 'Magic & Relics' },
  { id: 'dragon_egg', label: 'Scaled Dragon Egg', note: 'Glowing ember-veined mythical egg', category: 'Magic & Relics' },
  { id: 'enchanted_chalice', label: 'Enchanted Holy Chalice', note: 'Jeweled golden goblet with rising glow', category: 'Magic & Relics' },
  { id: 'grimoire_chained', label: 'Chained Dark Grimoire', note: 'Iron-bound forbidden spellbook with lock', category: 'Magic & Relics' },
  { id: 'hourglass_sands', label: 'Chrono Hourglass Sands', note: 'Brass timekeeper with shimmering gold sand', category: 'Magic & Relics' },
  { id: 'astral_orrery', label: 'Brass Astral Orrery', note: 'Orbiting mechanical solar system model', category: 'Magic & Relics' },
  { id: 'voodoo_totem', label: 'Carved Spirit Totem', note: 'Painted folklore wooden mask idol', category: 'Magic & Relics' },
  { id: 'magic_carpet', label: 'Floating Magic Carpet', note: 'Tasseled Persian rug hovering aloft', category: 'Magic & Relics' },
  { id: 'genie_lamp', label: 'Arabian Genie Lamp', note: 'Curved gold lamp trailing cyan smoke', category: 'Magic & Relics' },
  { id: 'crown_jeweled', label: 'Imperial Jeweled Crown', note: 'Velvet-lined royal crown with rubies', category: 'Magic & Relics' },
  // Wave 5: Sci-Fi & Tech Gadgets (12)
  { id: 'smartphone_glow', label: 'Glowing Smartphone', note: 'Modern notification screen & sleek bezel', category: 'Sci-Fi & Tech' },
  { id: 'vr_headset', label: 'VR Cyberspace Headset', note: 'Visor goggles with neon optic strip', category: 'Sci-Fi & Tech' },
  { id: 'cyber_deck', label: 'Netrunner Cyberdeck', note: 'Tactical portable hacking console', category: 'Sci-Fi & Tech' },
  { id: 'server_rack', label: 'Data Center Server Rack', note: 'Blinking blade tower with status LEDs', category: 'Sci-Fi & Tech' },
  { id: 'ai_core_cube', label: 'Sentient AI Core Cube', note: 'Levitating neural lattice energy cube', category: 'Sci-Fi & Tech' },
  { id: 'dna_helix_vial', label: 'DNA Double-Helix Vial', note: 'Glowing cyan genetic containment tube', category: 'Sci-Fi & Tech' },
  { id: 'sat_dish_mini', label: 'Orbital Satellite Dish', note: 'Parabolic comms dish with signal arcs', category: 'Sci-Fi & Tech' },
  { id: 'jetpack_thruster', label: 'Twin Jetpack Thruster', note: 'Rocket pack with blue ion exhaust', category: 'Sci-Fi & Tech' },
  { id: 'teleport_pad', label: 'Quantum Teleport Pad', note: 'Glowing ring emitter with beam column', category: 'Sci-Fi & Tech' },
  { id: 'mech_battery', label: 'Fusion Mech Battery', note: 'Heavy industrial plasma power cell', category: 'Sci-Fi & Tech' },
  { id: 'radar_scanner', label: 'Tactical Radar Scanner', note: 'Sweeping green sonar & motion tracker', category: 'Sci-Fi & Tech' },
  { id: 'hologram_globe', label: 'Hologram Wireframe Globe', note: 'Spinning projected planetary wireframe', category: 'Sci-Fi & Tech' },
  // Wave 5: Modern Office, Media & Finance (12)
  { id: 'gold_bullion_bars', label: 'Stacked Gold Bullion', note: 'Gleaming vault pyramid of gold ingots', category: 'Office & Media' },
  { id: 'stock_chart_board', label: 'Bull & Bear Stock Chart', note: 'Glowing candlestick & upward green trend', category: 'Office & Media' },
  { id: 'studio_camera_rig', label: 'Cinema Studio Camera', note: 'Matte box lens rig with red tally light', category: 'Office & Media' },
  { id: 'clapperboard_slate', label: 'Director Clapperboard', note: 'Striped film production take slate', category: 'Office & Media' },
  { id: 'podcast_mic_arm', label: 'Podcast Boom Mic Arm', note: 'Articulated studio arm & pop filter', category: 'Office & Media' },
  { id: 'whiteboard_diagram', label: 'Strategy Whiteboard', note: 'Flowchart arrows & sticky note clusters', category: 'Office & Media' },
  { id: 'stack_of_cash', label: 'Banded Stack of Cash', note: 'Crisp bank bundles with gold paper strap', category: 'Office & Media' },
  { id: 'credit_card_gold', label: 'Gold Executive Card', note: 'Metallic EMV chip card with sheen', category: 'Office & Media' },
  { id: 'contract_dossier', label: 'Signed Legal Contract', note: 'Fountain pen & official stamped dossier', category: 'Office & Media' },
  { id: 'megaphone_bullhorn', label: 'Rally Bullhorn Megaphone', note: 'Loudspeaker with acoustic sound waves', category: 'Office & Media' },
  { id: 'press_badge', label: 'VIP Press Lanyard Badge', note: 'Official media pass with photo ID', category: 'Office & Media' },
  { id: 'trophy_cup_silver', label: 'Silver Championship Cup', note: 'Polished chrome award chalice on plinth', category: 'Office & Media' },
  // Wave 5: Science, Medical & Lab (12)
  { id: 'stethoscope_med', label: 'Clinical Stethoscope', note: 'Doctor acoustic diaphragm & coiled tube', category: 'Science & Lab' },
  { id: 'beaker_bubbling', label: 'Bubbling Chemistry Beaker', note: 'Graduated flask with rising neon bubbles', category: 'Science & Lab' },
  { id: 'telescope_brass', label: 'Brass Refractor Telescope', note: 'Tripod-mounted astronomical spyglass', category: 'Science & Lab' },
  { id: 'globe_terrestrial', label: 'Classroom World Globe', note: 'Tilted meridian stand & ocean continents', category: 'Science & Lab' },
  { id: 'skeleton_model', label: 'Anatomy Skeleton Model', note: 'Lab ribcage & skull teaching display', category: 'Science & Lab' },
  { id: 'first_aid_kit', label: 'Emergency First Aid Kit', note: 'White medical case with bold red cross', category: 'Science & Lab' },
  { id: 'syringe_serum', label: 'Glowing Serum Syringe', note: 'Precision glass medical injector', category: 'Science & Lab' },
  { id: 'x_ray_lightbox', label: 'Medical X-Ray Lightbox', note: 'Backlit diagnostic scan film display', category: 'Science & Lab' },
  { id: 'chalkboard_equations', label: 'Chalkboard Equations', note: 'Slate board with E=mc² & geometry', category: 'Science & Lab' },
  { id: 'atom_model', label: 'Orbiting Atom Model', note: 'Glowing nucleus & spinning electron rings', category: 'Science & Lab' },
  { id: 'geiger_counter', label: 'Yellow Geiger Counter', note: 'Radiation meter dial with wand probe', category: 'Science & Lab' },
  { id: 'fossil_ammonite', label: 'Spiral Ammonite Fossil', note: 'Prehistoric stone spiral shell specimen', category: 'Science & Lab' },
  // Wave 5: Music, Art & Culture (12)
  { id: 'sitar_instrument', label: 'Classical Indian Sitar', note: 'Carved gourd resonator & fretted neck', category: 'Music & Culture' },
  { id: 'tabla_drums', label: 'Concert Tabla Pair', note: 'Bayan copper drum & Dayan wooden treble', category: 'Music & Culture' },
  { id: 'grand_piano_mini', label: 'Concert Grand Piano', note: 'Ebony open-lid piano with ivory keys', category: 'Music & Culture' },
  { id: 'paintbrush_palette', label: 'Artist Paint Palette', note: 'Wooden thumb palette with vivid daubs', category: 'Music & Culture' },
  { id: 'movie_projector', label: 'Vintage Film Projector', note: 'Spinning twin reels & flickering light cone', category: 'Music & Culture' },
  { id: 'vinyl_turntable', label: 'Retro Vinyl Turntable', note: 'Spinning LP record & tonearm needle', category: 'Music & Culture' },
  { id: 'dj_mixer_deck', label: 'Neon DJ Mixer Deck', note: 'Dual jog wheels & glowing EQ faders', category: 'Music & Culture' },
  { id: 'theater_masks', label: 'Comedy & Tragedy Masks', note: 'Twin classical stage drama masks', category: 'Music & Culture' },
  { id: 'origami_crane', label: 'Folded Origami Crane', note: 'Crisp faceted paper crane hovering softly', category: 'Music & Culture' },
  { id: 'calligraphy_brush', label: 'Ink Calligraphy Brush', note: 'Bamboo brush over dark stone inkwell', category: 'Music & Culture' },
  { id: 'bamboo_flute', label: 'Bansuri Bamboo Flute', note: 'Golden bamboo flute with peacock tassel', category: 'Music & Culture' },
  { id: 'war_horn_brass', label: 'Curved Brass War Horn', note: 'Viking & epic signaling horn with rings', category: 'Music & Culture' },
  // Wave 5: Food, Feast & Tavern (12)
  { id: 'steaming_ramen_bowl', label: 'Steaming Ramen Bowl', note: 'Noodles, egg, chopsticks & rising steam', category: 'Food & Feast' },
  { id: 'royal_thali_platter', label: 'Royal Brass Thali', note: 'Feast platter with bowls, flatbread & sweets', category: 'Food & Feast' },
  { id: 'birthday_cake_lit', label: 'Lit Birthday Cake', note: 'Frosted celebration cake with glowing candles', category: 'Food & Feast' },
  { id: 'pizza_slice_box', label: 'Hot Pizza Box & Slice', note: 'Open delivery box with cheesy pepperoni slice', category: 'Food & Feast' },
  { id: 'teapot_porcelain', label: 'Porcelain Tea Pot', note: 'Blue-and-white ceramic teapot with steam', category: 'Food & Feast' },
  { id: 'spice_jar_rack', label: 'Artisan Spice Jar Rack', note: 'Saffron, turmeric & chili glass jars', category: 'Food & Feast' },
  { id: 'fruit_basket', label: 'Woven Harvest Fruit Basket', note: 'Apples, mangoes & grapes in wicker basket', category: 'Food & Feast' },
  { id: 'campfire_kettle', label: 'Cast-Iron Camp Kettle', note: 'Boiling trail kettle over glowing coals', category: 'Food & Feast' },
  { id: 'goblet_wine', label: 'Ruby Banquet Goblet', note: 'Ornate silver stemware for royal feasts', category: 'Food & Feast' },
  { id: 'honey_jar', label: 'Golden Honey Jar & Dipper', note: 'Amber glass jar with wooden honey wand', category: 'Food & Feast' },
  { id: 'bread_loaf_basket', label: 'Warm Bakery Bread Basket', note: 'Crusty sourdough & baguettes on linen', category: 'Food & Feast' },
  { id: 'ice_cream_cone', label: 'Triple-Scoop Ice Cream', note: 'Waffle cone with pastel scoops & cherry', category: 'Food & Feast' },
  // Wave 5: Vehicles & Travel Gear (12)
  { id: 'vintage_suitcase', label: 'Stickered Travel Suitcase', note: 'Leather trunk with brass clasps & tags', category: 'Vehicles & Travel' },
  { id: 'treasure_map_tube', label: 'Brass Map Scroll Tube', note: 'Explorer leather case with protruding chart', category: 'Vehicles & Travel' },
  { id: 'ship_wheel_helm', label: 'Wooden Ship Helm Wheel', note: 'Eight-spoke captain’s steering wheel', category: 'Vehicles & Travel' },
  { id: 'hot_air_basket', label: 'Mini Hot-Air Balloon', note: 'Striped envelope & wicker gondola basket', category: 'Vehicles & Travel' },
  { id: 'bicycle_classic', label: 'Classic Touring Bicycle', note: 'Spoked twin wheels & front wicker basket', category: 'Vehicles & Travel' },
  { id: 'motorcycle_helmet', label: 'Racing Motorcycle Helmet', note: 'Glossy visor shell with speed stripes', category: 'Vehicles & Travel' },
  { id: 'astronaut_helmet', label: 'Gold-Visor EVA Helmet', note: 'Reflective orbital spacewalk helmet', category: 'Vehicles & Travel' },
  { id: 'anchor_iron', label: 'Heavy Iron Ship Anchor', note: 'Nautical fluke anchor with coiled chain', category: 'Vehicles & Travel' },
  { id: 'lantern_storm', label: 'Brass Storm Lantern', note: 'Caged glass kerosene lamp with warm glow', category: 'Vehicles & Travel' },
  { id: 'boarding_pass', label: 'Flight Boarding Pass', note: 'Airport ticket stub with jet icon & barcode', category: 'Vehicles & Travel' },
  { id: 'binoculars_field', label: 'Safari Field Binoculars', note: 'Dual-lens scout optics with teal glint', category: 'Vehicles & Travel' },
  { id: 'tent_camping', label: 'Expedition Camp Tent', note: 'Glowing A-frame trail tent under stars', category: 'Vehicles & Travel' },
  // Wave 5: Mystery, Crime & Noir (12)
  { id: 'handcuffs_steel', label: 'Linked Steel Handcuffs', note: 'Polished police restraint cuffs & chain', category: 'Mystery & Noir' },
  { id: 'evidence_bag', label: 'Tagged Evidence Bag', note: 'Clear forensic pouch with numbered tag', category: 'Mystery & Noir' },
  { id: 'fingerprint_card', label: 'Forensic Fingerprint Card', note: 'Magnified whorl print & case file stamp', category: 'Mystery & Noir' },
  { id: 'crime_tape_roll', label: 'Yellow Crime Scene Tape', note: 'Caution barrier ribbon roll', category: 'Mystery & Noir' },
  { id: 'revolver_noir', label: 'Classic Noir Revolver', note: 'Snub-nose detective prop silhouette', category: 'Mystery & Noir' },
  { id: 'safe_dial_door', label: 'Steel Combination Safe', note: 'Heavy lockbox with spinning brass dial', category: 'Mystery & Noir' },
  { id: 'red_string_board', label: 'Conspiracy Cork Board', note: 'Pinned clue photos linked by red yarn', category: 'Mystery & Noir' },
  { id: 'secret_envelope', label: 'Wax-Sealed Secret Letter', note: 'Top-secret dossier with crimson wax seal', category: 'Mystery & Noir' },
  { id: 'skeleton_key_ring', label: 'Jailer Skeleton Key Ring', note: 'Iron ring jingling with antique keys', category: 'Mystery & Noir' },
  { id: 'poison_vial_green', label: 'Emerald Poison Vial', note: 'Skull-labeled glowing green apothecary vial', category: 'Mystery & Noir' },
  { id: 'candle_candelabra', label: 'Gothic Brass Candelabra', note: 'Three-branch manor candlestick with flames', category: 'Mystery & Noir' },
  { id: 'skull_relic', label: 'Ancient Catacomb Skull', note: 'Dramatic gothic memento mori relic', category: 'Mystery & Noir' },
  // Wave 5: Sports, Kids & Everyday (12)
  { id: 'cricket_bat_ball', label: 'Willow Cricket Bat & Ball', note: 'Classic leather seam ball & cricket bat', category: 'Sports & Kids' },
  { id: 'soccer_ball_classic', label: 'Classic Soccer Football', note: 'Pentagon-panel championship match ball', category: 'Sports & Kids' },
  { id: 'boxing_gloves', label: 'Laced Red Boxing Gloves', note: 'Hanging pair of heavyweight ring gloves', category: 'Sports & Kids' },
  { id: 'chess_board_set', label: 'Royal Chess Board & King', note: 'Checkered strategy board & carved pieces', category: 'Sports & Kids' },
  { id: 'rubber_ducky', label: 'Cheerful Rubber Ducky', note: 'Bright yellow kids mascot & coder duck', category: 'Sports & Kids' },
  { id: 'teddy_bear', label: 'Plush Storybook Teddy', note: 'Stitched brown teddy bear with ribbon', category: 'Sports & Kids' },
  { id: 'kite_diamond', label: 'Fluttering Diamond Kite', note: 'Festival paper kite with ribbon tail', category: 'Sports & Kids' },
  { id: 'gift_box_ribbon', label: 'Wrapped Gift Box', note: 'Festive parcel with golden satin bow', category: 'Sports & Kids' },
  { id: 'skateboard_deck', label: 'Graphic Skateboard Deck', note: 'Street cruiser deck with colorful wheels', category: 'Sports & Kids' },
  { id: 'watering_can', label: 'Garden Watering Can', note: 'Tin garden spout with gentle water drops', category: 'Sports & Kids' },
  { id: 'hammer_wrench', label: 'Workshop Hammer & Wrench', note: 'Crossed builder & maker hand tools', category: 'Sports & Kids' },
  { id: 'stopwatch_sport', label: 'Precision Sports Stopwatch', note: 'Chrome lap timer with sweeping dial hand', category: 'Sports & Kids' },
];

export const SHOT_CATALOG: Array<{ id: ShotId; label: string }> = [
  { id: 'wide_stage', label: 'Wide Stage' },
  { id: 'two_shot', label: 'Medium Two-Shot' },
  { id: 'closeup_left', label: 'Close-Up · Actor 1' },
  { id: 'closeup_right', label: 'Close-Up · Actor 2' },
  { id: 'split_faceoff', label: 'Split-Screen Face-Off' },
  { id: 'eye_strip', label: 'Cinematic Eye Strip' },
  { id: 'low_angle_swoop', label: 'Low-Angle Swoop' },
  { id: 'prop_spotlight', label: 'Prop Spotlight Cutaway' },
  { id: 'motion_card', label: 'Kinetic Motion Card' },
];

export const TRANSITION_CATALOG: Array<{ id: TransitionId; label: string }> = [
  { id: 'hard_cut', label: 'Hard Cut' },
  { id: 'diagonal_slash', label: 'Diagonal Panel Slash' },
  { id: 'crimson_flash', label: 'Crimson Shock Flash' },
  { id: 'silhouette_wipe', label: 'Silhouette Wipe' },
  { id: 'ink_fade', label: 'Obsidian Fade' },
  { id: 'popup_fold', label: 'Pop-Up Cardstock Fold' },
];

export const FRAME_CATALOG: Array<{ id: FrameMode; label: string }> = [
  { id: 'main', label: 'Main Story' },
  { id: 'nested_story', label: 'Nested Flashback' },
  { id: 'chapter_title', label: 'Chapter Title Card' },
  { id: 'moral_card', label: 'Closing Moral Card' },
  { id: 'end_screen', label: 'YouTube End Screen' },
];

export const CROWD_CATALOG: Array<{ id: CrowdId; label: string; category?: string }> = [
  { id: 'none', label: 'No Crowd', category: 'General' },
  { id: 'courtiers', label: 'Royal Courtiers', category: 'Historical & Epic' },
  { id: 'villagers', label: 'Village Folk', category: 'Historical & Epic' },
  { id: 'army', label: 'Epic Army & Spears', category: 'Historical & Epic' },
  { id: 'forest_herd', label: 'Forest Herd', category: 'Nature & Mythic' },
  { id: 'monks', label: 'Sages & Monks', category: 'Historical & Epic' },
  // Wave 3: +6 Crowds (12 total)
  { id: 'city_commuters', label: 'City Commuters & Umbrellas', category: 'Modern & Civic' },
  { id: 'cyber_drones', label: 'Patrol Cyber Drones', category: 'Sci-Fi & Fantasy' },
  { id: 'pirate_crew', label: 'Pirate Deck Crew', category: 'Historical & Epic' },
  { id: 'scholars_hall', label: 'Scholars & Senate Hall', category: 'Historical & Epic' },
  { id: 'spectral_flock', label: 'Spectral Flock & Bats', category: 'Sci-Fi & Fantasy' },
  { id: 'masquerade_ball', label: 'Masquerade Ballroom Guests', category: 'Historical & Epic' },
  // Wave 5: +18 Crowds (30 total)
  { id: 'stadium_fans', label: 'Cheering Stadium Fans', category: 'Modern & Civic' },
  { id: 'festival_dancers', label: 'Festival Lantern Dancers', category: 'Historical & Epic' },
  { id: 'bazaar_merchants', label: 'Bustling Bazaar Merchants', category: 'Historical & Epic' },
  { id: 'press_paparazzi', label: 'Press & Flashing Paparazzi', category: 'Modern & Civic' },
  { id: 'protest_rally', label: 'Civic March & Placards', category: 'Modern & Civic' },
  { id: 'mech_squadron', label: 'Armored Mech Squadron', category: 'Sci-Fi & Fantasy' },
  { id: 'fairy_wisps', label: 'Glowing Fairy Wisps', category: 'Sci-Fi & Fantasy' },
  { id: 'undead_horde', label: 'Rising Undead Horde', category: 'Sci-Fi & Fantasy' },
  { id: 'safari_herd', label: 'Savanna Safari Herd', category: 'Nature & Mythic' },
  { id: 'ballroom_waltz', label: 'Grand Ballroom Waltz', category: 'Historical & Epic' },
  { id: 'courtroom_gallery', label: 'Courtroom Jury & Gallery', category: 'Modern & Civic' },
  { id: 'orchestra_pit', label: 'Symphony Orchestra Pit', category: 'Modern & Civic' },
  { id: 'space_dock_crew', label: 'Space Dock Flight Crew', category: 'Sci-Fi & Fantasy' },
  { id: 'tavern_patrons', label: 'Rowdy Tavern Patrons', category: 'Historical & Epic' },
  { id: 'school_hallway', label: 'Campus & School Hallway', category: 'Modern & Civic' },
  { id: 'roman_legion', label: 'Roman Shield Legion', category: 'Historical & Epic' },
  { id: 'ninja_clan', label: 'Rooftop Ninja Clan', category: 'Historical & Epic' },
  { id: 'circus_audience', label: 'Big-Top Circus Audience', category: 'Modern & Civic' },
];

export const CAMERA_MOVE_CATALOG: Array<{ id: CameraMoveId; label: string }> = [
  { id: 'still', label: 'Default Drift' },
  { id: 'slow_push', label: 'Slow Push-In' },
  { id: 'slow_pull', label: 'Slow Pull-Out' },
  { id: 'pan_left', label: 'Pan Left' },
  { id: 'pan_right', label: 'Pan Right' },
  { id: 'impact_shake', label: 'Impact Shake' },
];

export const MOTION_LIST: MotionId[] = [
  'still',
  'enter_left',
  'enter_right',
  'cross_stage',
  'step_forward',
  'retreat',
  'leap_arc',
];

export const RAAG_CATALOG: Array<{ id: RaagId; label: string; vibe: string }> = [
  { id: 'bhairavi', label: 'Raag Bhairavi', vibe: 'Nocturnal Indian folklore & pathos' },
  { id: 'yaman', label: 'Raag Yaman', vibe: 'Noble durbar & devotion' },
  { id: 'marwa', label: 'Raag Marwa', vibe: 'Eerie tension & twilight' },
  { id: 'darbari', label: 'Raag Darbari', vibe: 'Solemn royal court & epic weight' },
  { id: 'bhoopali', label: 'Raag Bhoopali', vibe: 'Playful wit & Panchatantra' },
  { id: 'malkauns', label: 'Raag Malkauns', vibe: 'Deep midnight mystery & Yaksha riddles' },
  { id: 'desh', label: 'Raag Desh', vibe: 'Lively folk satire & monsoon tales' },
  { id: 'greek_lyre', label: 'Greek Lyre & Frame Drum', vibe: 'Aeolian kithara pluck for Aesop & Olympus' },
  { id: 'medieval_lute', label: 'Medieval Lute & Harp', vibe: 'Dorian woodland ballad for Grimm & Knights' },
  { id: 'guqin_bamboo', label: 'Guqin & Shakuhachi', vibe: 'East Asian pentatonic silk strings & bamboo flute' },
  { id: 'gamelan_wayang', label: 'Javanese Gamelan', vibe: 'Shimmering bronze Pelog metallophones & Wayang gong' },
  { id: 'cedar_flute', label: 'Cedar Flute & Canyon Drum', vibe: 'Americas warm wood-flute & steady heartbeat tom' },
  { id: 'kora_griot', label: 'African Kora & Talking Drum', vibe: 'West African 21-string harp & gliding djembe pulse' },
];

export const EXPRESSION_LIST: ExpressionId[] = [
  'calm',
  'warm',
  'joy',
  'curious',
  'awe',
  'sly',
  'shocked',
  'grief',
  'stern',
  'angry',
];

export const EXPRESSION_CATALOG: Array<{ id: ExpressionId; label: string; note: string }> = [
  { id: 'calm', label: 'Calm / Serene', note: 'Relaxed arched brows, gentle expression' },
  { id: 'warm', label: 'Warm / Kind', note: 'Friendly soft smile & warm eyes' },
  { id: 'joy', label: 'Joy / Happy', note: 'Bright smiling eyes & cheerful smile' },
  { id: 'curious', label: 'Curious / Thinking', note: 'One raised inquisitive brow & alert gaze' },
  { id: 'awe', label: 'Awe / Wonder', note: 'Lifted brows, luminous starry eyes' },
  { id: 'sly', label: 'Sly / Mischievous', note: 'Playful raised brow & crooked smirk' },
  { id: 'shocked', label: 'Shocked / Alarmed', note: 'High brows, wide eyes & O-mouth' },
  { id: 'grief', label: 'Sad / Worried', note: 'Upturned inner brows & downcast eyes' },
  { id: 'stern', label: 'Stern / Focused', note: 'Composed straight brows, serious focus' },
  { id: 'angry', label: 'Angry / Fierce', note: 'V-furrowed brows & fierce intense gaze' },
];

export function normalizeExpressionId(raw: unknown): ExpressionId {
  const norm = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (EXPRESSION_LIST.includes(norm as ExpressionId)) return norm as ExpressionId;
  if (/angr|furi|rage|wrath|fierce|mad|enrag|scowl|glare|hostil/.test(norm)) return 'angry';
  if (/stern|serious|determin|solemn|firm|stoic|resolut|focus|grave/.test(norm)) return 'stern';
  if (/warm|kind|tender|gentle|lov|affection|fond|friendly|compassion|sooth/.test(norm)) return 'warm';
  if (/joy|happy|laugh|smile|delight|triumph|proud|cheer|elated|glee/.test(norm)) return 'joy';
  if (/curio|think|ponder|wonder_?ing|puzzl|question|inquisit|thoughtful|intrig/.test(norm)) return 'curious';
  if (/awe|amaz|marvel|rever|enchant|mesmer|starry|magic/.test(norm)) return 'awe';
  if (/sly|smug|cunn|trick|mischiev|grin|sneak|wicked|clever|playful|teas/.test(norm)) return 'sly';
  if (/shock|surpris|fear|scare|alarm|gasp|terrifi|panick|startl|astonish/.test(norm)) return 'shocked';
  if (/grief|sad|cry|sorrow|weep|mourn|despair|regret|worr|anxious|tired|hurt|heartbroken/.test(norm)) return 'grief';
  return 'calm';
}

/**
 * Deterministically maps a spoken phrase inside `dialogue` to a 60fps frame index within a beat,
 * weighting spoken character length plus natural punctuation pauses (em-dash, comma, exclamation, etc.).
 * Optionally adds a human reaction lag (e.g. +12 frames / 0.2s) for listening characters.
 */
export function computePhraseTriggerFrame(
  dialogue: string,
  phrase: string,
  beatDuration: number,
  reactionLagFrames = 0
): number | null {
  const cleanDlg = String(dialogue || '').trim();
  const cleanPhrase = String(phrase || '').trim();
  if (!cleanDlg || !cleanPhrase) return null;

  const lowerDlg = cleanDlg.toLowerCase();
  const lowerPhrase = cleanPhrase.toLowerCase().replace(/^["'“”]+|["'“”]+$/g, '').trim();
  if (!lowerPhrase) return null;

  let matchIdx = lowerDlg.indexOf(lowerPhrase);
  if (matchIdx < 0) {
    // Fallback: match first distinctive Unicode token(s) of phrase (supports Latin, Indic, Arabic & CJK)
    const tokens = lowerPhrase
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 2);
    if (tokens.length > 0) {
      for (let len = Math.min(tokens.length, 3); len >= 1 && matchIdx < 0; len--) {
        const probe = tokens.slice(0, len).join(' ');
        const idx = lowerDlg.indexOf(probe);
        if (idx >= 0) matchIdx = idx;
      }
    }
  }
  if (matchIdx < 0) return null;

  // Build cumulative spoken-weight curve across characters (includes Latin, Indic, Arabic & CJK pauses)
  const weights: number[] = new Array(cleanDlg.length + 1).fill(0);
  let acc = 0;
  for (let i = 0; i < cleanDlg.length; i++) {
    const ch = cleanDlg[i];
    if (/[—–]/.test(ch)) acc += 5.5;
    else if (/[.!?।。！？؟]/.test(ch)) acc += 5.0;
    else if (/[,;:、،؛]/.test(ch)) acc += 3.0;
    else if (/\s/.test(ch)) acc += 0.6;
    else acc += 1.0;
    weights[i + 1] = acc;
  }
  const totalWeight = Math.max(1, acc);
  const progress = Math.max(0, Math.min(0.95, weights[matchIdx] / totalWeight));
  // Spoken speech occupies roughly 5%..92% of beat duration (subtle lead-in and tail breath)
  const spokenT = Math.max(1.2, beatDuration) * (0.04 + progress * 0.86);
  const totalFrames = Math.max(1, Math.round(Math.max(1.2, beatDuration) * STUDIO_FPS));
  const rawFrame = Math.round(spokenT * STUDIO_FPS) + reactionLagFrames;
  return Math.max(0, Math.min(totalFrames - 1, rawFrame));
}

function keyframeTimeSec(
  kf: ExpressionKeyframe,
  beatDuration: number,
  dialogue?: string,
  reactionLagFrames = 0
): number {
  const dur = Math.max(1.2, beatDuration);
  if (typeof kf.frame === 'number' && Number.isFinite(kf.frame)) {
    return Math.max(0, kf.frame / STUDIO_FPS);
  }
  if (typeof kf.timeSec === 'number' && Number.isFinite(kf.timeSec)) {
    return Math.max(0, kf.timeSec);
  }
  if (typeof kf.at === 'number' && Number.isFinite(kf.at)) {
    return Math.max(0, Math.min(1, kf.at)) * dur;
  }
  if (kf.triggerPhrase && dialogue) {
    const aligned = computePhraseTriggerFrame(dialogue, kf.triggerPhrase, dur, reactionLagFrames);
    if (aligned !== null) return aligned / STUDIO_FPS;
  }
  return 0;
}

/**
 * Deterministically resolves a character's active facial expression at an exact beat-local
 * timestamp / frame, honoring the system-wide expressions toggle, per-actor expressionTrack,
 * beat-level expressionCues, phrase triggers, and bounded `frame..endFrame` sets of frames.
 */
export function resolveActorExpressionAtTime(
  actor: ActorPlacement,
  beat: Pick<StoryBeat, 'duration' | 'expressionCues'> & Partial<Pick<StoryBeat, 'dialogue' | 'speakerId'>>,
  localT: number,
  expressionsEnabled = true
): ExpressionId {
  if (!expressionsEnabled) return 'calm';

  const isListener = Boolean(beat.speakerId && beat.speakerId !== 'narrator' && beat.speakerId !== actor.castId);
  const lag = isListener ? 12 : 0;

  const combined: Array<{ t: number; endT?: number; expression: ExpressionId; order: number }> = [];
  let ord = 0;

  if (Array.isArray(actor.expressionTrack)) {
    for (const kf of actor.expressionTrack) {
      if (!kf || !kf.expression) continue;
      combined.push({
        t: keyframeTimeSec(kf, beat.duration, beat.dialogue, lag),
        endT:
          typeof kf.endFrame === 'number' && Number.isFinite(kf.endFrame) && kf.endFrame >= 0
            ? kf.endFrame / STUDIO_FPS
            : undefined,
        expression: normalizeExpressionId(kf.expression),
        order: ord++,
      });
    }
  }

  if (Array.isArray(beat.expressionCues)) {
    for (const cue of beat.expressionCues) {
      if (!cue || cue.castId !== actor.castId || !cue.expression) continue;
      combined.push({
        t: keyframeTimeSec(cue, beat.duration, beat.dialogue, lag),
        endT:
          typeof cue.endFrame === 'number' && Number.isFinite(cue.endFrame) && cue.endFrame >= 0
            ? cue.endFrame / STUDIO_FPS
            : undefined,
        expression: normalizeExpressionId(cue.expression),
        order: ord++,
      });
    }
  }

  if (combined.length === 0) {
    return normalizeExpressionId(actor.expression);
  }

  combined.sort((a, b) => (a.t !== b.t ? a.t - b.t : a.order - b.order));
  const baseExpr: ExpressionId = normalizeExpressionId(actor.expression);
  let resolved: ExpressionId = baseExpr;
  const epsT = Math.max(0, localT) + 0.002;

  for (let i = 0; i < combined.length; i++) {
    const item = combined[i];
    if (item.t <= epsT) {
      const next = combined[i + 1];
      // If this cue has an explicit endFrame and we have passed it (with no newer cue active yet), revert cleanly to baseExpr
      if (item.endT !== undefined && localT > item.endT + 0.002 && (!next || next.t > epsT)) {
        resolved = baseExpr;
      } else {
        resolved = item.expression;
      }
    } else {
      break;
    }
  }
  return resolved;
}
export const POSE_LIST: PoseId[] = [
  'stand',
  'walk',
  'sit',
  'kneel',
  'recoil',
  'gesture',
  'hang_upside_down',
  'soar',
  'attack',
];
export const WEATHER_LIST: WeatherId[] = [
  'fireflies',
  'embers',
  'rain',
  'mist',
  'petals',
  'none',
  'snow',
  'lightning_storm',
  'sandstorm',
  'starfall',
  'sakura_blossoms',
  'data_matrix',
  // Wave 5: +18 Weathers (30 total)
  'autumn_leaves',
  'floating_lanterns',
  'underwater_bubbles',
  'confetti_shower',
  'ash_fallout',
  'acid_rain',
  'aurora_ribbons',
  'dandelion_seeds',
  'meteor_shower',
  'neon_sparks',
  'golden_pollen',
  'plasma_arcs',
  'hailstorm',
  'blizzard_gale',
  'fog_bank',
  'locust_swarm',
  'volcanic_cinders',
  'starlight_dust',
];
export const FX_LIST: FxId[] = [
  'none',
  'shock_burst',
  'question_mark',
  'smear_swoop',
  'crimson_impact',
  'divine_aura',
  'speed_lines',
  'magic_runes',
  'glitch_tear',
  'sparkle_burst',
  'spotlight_beam',
  'shatter_glass',
  'heartbeat_pulse',
  'comic_pow',
  // Wave 5: +22 Beat FX (36 total)
  'anime_impact_frame',
  'chromatic_split',
  'lens_flare_sweep',
  'portal_vortex',
  'time_freeze_ripple',
  'sonic_boom_rings',
  'ink_splatter_burst',
  'holographic_scan',
  'lightning_web',
  'petal_cyclone',
  'fire_breath_cone',
  'frost_crystallize',
  'shadow_tendrils',
  'golden_halo_burst',
  'crt_scan_flash',
  'blood_moon_eclipse',
  'laser_grid',
  'starlight_nova',
  'comic_speed_zoom',
  'water_splash_arc',
  'dust_shockwave',
  'radar_ping',
];

export const SFX_CATALOG: Array<{ id: SfxId; label: string; note: string }> = [
  { id: 'none', label: 'No SFX', note: 'Pure Raag & dialogue' },
  { id: 'temple_bell', label: 'Temple Bell', note: 'Resonant brass ghanta chime' },
  { id: 'shankha_conch', label: 'Shankha Conch', note: 'Epic battlefield & sacred conch' },
  { id: 'sword_clash', label: 'Sword Unsheathe / Clash', note: 'Metallic steel ring' },
  { id: 'thunder_crack', label: 'Storm Thunder', note: 'Dramatic midnight lightning rumble' },
  { id: 'arrow_whoosh', label: 'Arrow / Leap Whoosh', note: 'High-speed wind sweep' },
  { id: 'mystic_chime', label: 'Mystic Reveal Chime', note: 'Shimmering boon / twist arpeggio' },
  { id: 'court_gasp', label: 'Durbar Impact Hit', note: 'Low drama drum & crowd swell' },
  { id: 'wooden_gavel', label: 'Verdict Strike', note: 'Sharp court judgment double knock' },
  { id: 'fire_crackle', label: 'Havan Fire Burst', note: 'Sacred flame crackle & flare' },
];

// =========================================================================
// =========================================================================
// 20 DETERMINISTIC MULTI-GENRE ART ENGINES + VISUAL VARIATION LEVERS
// =========================================================================
export const RENDER_STYLE_CATALOG: Array<{
  id: RenderStyleId;
  category: RenderStyleCategory;
  label: string;
  shortLabel: string;
  note: string;
  bestFor: string;
}> = [
  // Editorial, Anime & Explainers (5)
  {
    id: 'chiaroscuro',
    category: 'Editorial, Anime & Explainers',
    label: 'Chiaroscuro Graphic Novel',
    shortLabel: 'Chiaroscuro',
    note: 'Bold ink contours, deep indigo shadows & golden rim-light (Default)',
    bestFor: 'Drama · History · Graphic Storytelling',
  },
  {
    id: 'lineless_vector',
    category: 'Editorial, Anime & Explainers',
    label: 'Lineless Geometric Vector',
    shortLabel: 'Editorial Vector',
    note: 'Zero black ink outlines, crisp flat color planes & atmospheric depth',
    bestFor: 'Science Explainers · Essays · Modern Epics',
  },
  {
    id: 'anime_cel',
    category: 'Editorial, Anime & Explainers',
    label: 'Sakuga Anime Cel',
    shortLabel: 'Anime Cel',
    note: 'Crisp 3-tone cel shadows, luminous sky gradients & glowing rim bloom',
    bestFor: 'Anime Storytime · Action · Sci-Fi Drama',
  },
  {
    id: 'gouache_storybook',
    category: 'Editorial, Anime & Explainers',
    label: 'Matte Editorial Gouache',
    shortLabel: 'Matte Gouache',
    note: 'Velvety opaque matte brushwork with warm magazine-illustration finish',
    bestFor: 'Psychology · Philosophy · TED-Ed Essays',
  },
  {
    id: 'risograph_print',
    category: 'Editorial, Anime & Explainers',
    label: '3-Plate Risograph Print',
    shortLabel: 'Risograph Print',
    note: 'Soy-ink plate separation, sub-pixel misregistration, Ben-Day halftone & 12fps',
    bestFor: 'Satire · Pop Culture · Indie Shorts',
  },

  // Tactile & Handcrafted (5)
  {
    id: 'felt_puppet',
    category: 'Tactile & Handcrafted',
    label: 'Stitched Felt Puppetry',
    shortLabel: 'Felt Puppet',
    note: 'Layered wool-felt texture, dashed blanket-stitch seams & tapered pencil arcs',
    bestFor: 'Cozy Fables · Kids & Family · Bedtime Stories',
  },
  {
    id: 'papercraft_diorama',
    category: 'Tactile & Handcrafted',
    label: '2.5D Paper-Craft Diorama',
    shortLabel: 'Paper Diorama',
    note: 'Stacked matte cardstock depth planes, cut-paper edge rims & cast shadows',
    bestFor: 'Animal Fables · Nature · Craft Explainers',
  },
  {
    id: 'backlit_sand',
    category: 'Tactile & Handcrafted',
    label: 'Backlit Kinetic Sand',
    shortLabel: 'Backlit Sand',
    note: 'Warm amber lightbox backlighting, sculpted dark sand & mineral stipple',
    bestFor: 'Flashbacks · Desert Legends · Meditative Tales',
  },
  {
    id: 'woodblock_print',
    category: 'Tactile & Handcrafted',
    label: 'Carved Relief Woodblock',
    shortLabel: 'Woodblock Print',
    note: 'Heavy carved ink lines, engraving hatching & 4-ink cotton paper print',
    bestFor: 'Court Wit · Satire · Folk Chronicles',
  },
  {
    id: 'shadow_puppetry',
    category: 'Tactile & Handcrafted',
    label: 'Backlit Shadow Puppetry',
    shortLabel: 'Shadow Puppet',
    note: 'Backlit oil-lamp parchment scrim, pierced filigree & articulated pins',
    bestFor: 'Riddles · Nested Tales · Wayang & Folklore',
  },

  // Mystery, Manga & Sci-Fi (4)
  {
    id: 'manga_screentone',
    category: 'Mystery, Manga & Sci-Fi',
    label: 'Monochrome Manga Screentone',
    shortLabel: 'Manga Tone',
    note: 'High-contrast G-pen ink, halftone screentone dots, speedlines & crimson pop',
    bestFor: 'Mysteries · True Stories · High-Stakes Drama',
  },
  {
    id: 'scratchboard_noir',
    category: 'Mystery, Manga & Sci-Fi',
    label: 'Inverted Clay Scratchboard',
    shortLabel: 'Scratchboard',
    note: 'Pitch-black India-ink board carved with luminous ivory & gold hatch strokes',
    bestFor: 'Thrillers · Supernatural · Dark Suspense',
  },
  {
    id: 'blueprint_technical',
    category: 'Mystery, Manga & Sci-Fi',
    label: 'Architectural Technical Blueprint',
    shortLabel: 'Tech Blueprint',
    note: 'Prussian-blue cyanotype grid, crisp white-ink schematics & registration marks',
    bestFor: 'Engineering · Tech · Finance · How-It-Works',
  },
  {
    id: 'neon_cybernoir',
    category: 'Mystery, Manga & Sci-Fi',
    label: 'Cyber-Noir Neon',
    shortLabel: 'Cyber-Noir',
    note: 'Nocturnal neon cyan/magenta rims, subtle RGB chromatic edge split & wet glow',
    bestFor: 'AI & Tech · Cyberpunk · Urban Legends',
  },

  // World Heritage & Epics (6)
  {
    id: 'byzantine_mosaic',
    category: 'World Heritage & Epics',
    label: 'Gilded Tesserae Mosaic',
    shortLabel: 'Gold Mosaic',
    note: 'Grout-separated ceramic & gold-smalti mosaic tiles with ornamental arch frame',
    bestFor: 'Ancient History · Sacred Epics · Chapter Openers',
  },
  {
    id: 'stained_glass',
    category: 'World Heritage & Epics',
    label: 'Stained Glass Cloisonné',
    shortLabel: 'Stained Glass',
    note: 'Faceted jewel-tone Voronoi mosaic sky, gilded lead lines & light shafts',
    bestFor: 'Divine Reveals · Cathedral Myths · Puranas',
  },
  {
    id: 'sumi_e_wash',
    category: 'World Heritage & Epics',
    label: 'Sumi-e Ink Wash Scroll',
    shortLabel: 'Sumi-e Scroll',
    note: 'Rice-paper ink-wash mist, soft charcoal brushwork & cinnabar red chop seal',
    bestFor: 'East Asian Epics · Zen Philosophy · Martial Tales',
  },
  {
    id: 'greek_amphora',
    category: 'World Heritage & Epics',
    label: 'Greek Amphora Terracotta',
    shortLabel: 'Greek Amphora',
    note: 'Classical Attic red-figure terracotta clay, obsidian silhouettes & meander frieze',
    bestFor: 'Aesop’s Fables · Classical Antiquity · Odyssey',
  },
  {
    id: 'kente_tapestry',
    category: 'World Heritage & Epics',
    label: 'Kente & Ndebele Tapestry',
    shortLabel: 'Kente Tapestry',
    note: 'Woven African loom texture, vibrant ochre/cobalt rims & geometric Kente border',
    bestFor: 'Anansi · African Griot & Savanna Legends',
  },
  {
    id: 'illuminated_codex',
    category: 'World Heritage & Epics',
    label: 'Illuminated Medieval Codex',
    shortLabel: 'Gilded Codex',
    note: 'Aged vellum manuscript, sepia iron-gall ink & 24k gilded knotwork frame',
    bestFor: 'Medieval History · Grimm · Arthurian & Norse',
  },
];

export function getRecommendedRenderStyle(episode: Pick<EpisodeScript, 'series' | 'shelf'>): RenderStyleId {
  const s = episode.series.toLowerCase();
  if (s.includes('aesop') || s.includes('greek') || s.includes('odyssey')) return 'greek_amphora';
  if (s.includes('grimm') || s.includes('arthur') || s.includes('celtic') || s.includes('norse')) return 'illuminated_codex';
  if (s.includes('journey to the west') || s.includes('japanese') || s.includes('chinese') || s.includes('momotaro')) return 'sumi_e_wash';
  if (s.includes('anansi') || s.includes('african') || s.includes('sunjata')) return 'kente_tapestry';
  if (s.includes('kancil') || s.includes('wayang') || s.includes('javanese')) return 'shadow_puppetry';
  if (s.includes('raven') || s.includes('coyote') || s.includes('indigenous') || s.includes('mayan')) return 'lineless_vector';
  if (s.includes('kathasarit')) return 'shadow_puppetry';
  if (s.includes('ramayana') || s.includes('mahabharata')) return 'lineless_vector';
  if (s.includes('purana') || s.includes('shakti')) return 'stained_glass';
  if (s.includes('tenali') || s.includes('birbal') || s.includes('akbar') || s.includes('gopal')) {
    return 'woodblock_print';
  }
  if (s.includes('panchatantra') || s.includes('hitopadesha') || s.includes('jataka')) {
    return 'papercraft_diorama';
  }
  if (s.includes('quantum') || s.includes('explainer') || s.includes('blueprint')) return 'blueprint_technical';
  if (s.includes('sector 9') || s.includes('cyber') || s.includes('neon')) return 'neon_cybernoir';
  if (s.includes('casebook') || s.includes('detective') || s.includes('manga')) return 'manga_screentone';
  if (s.includes('thimblewood') || s.includes('lantern') || s.includes('puppet')) return 'felt_puppet';
  if (episode.shelf === 'Modern Multi-Genre Showcases') return 'blueprint_technical';
  if (episode.shelf === 'Western Folklore & Fables') return 'greek_amphora';
  if (episode.shelf === 'East Asian Tales & Epics') return 'sumi_e_wash';
  if (episode.shelf === 'Southeast Asian Folklore') return 'shadow_puppetry';
  if (episode.shelf === 'Americas & Indigenous Legends') return 'lineless_vector';
  if (episode.shelf === 'African Griot & Trickster Tales') return 'kente_tapestry';
  if (episode.shelf === 'Animal Fables & Strategy') return 'papercraft_diorama';
  if (episode.shelf === 'Royal Court Wit & Satire') return 'woodblock_print';
  if (episode.shelf === 'Sacred Epics & Puranas') return 'lineless_vector';
  return 'chiaroscuro';
}

export const DEFAULT_VISUAL_STYLE: EpisodeVisualStyle = {
  renderStyle: 'chiaroscuro',
  lookPreset: 'classic_chiaroscuro',
  colorGrade: 'default',
  texture: 'clean',
  shadowContrast: 1.0,
  inkWeight: 1.0,
  rimLight: 'auto',
  captionStyle: 'classic_cinema',
  frameBorder: 'clean_letterbox',
  vignette: 0.3,
  motionCadence: 'auto',
  motionProfile: 'auto',
  postFxPass: 'none',
  expressionsEnabled: true,
  karaokeCaptions: true,
  autoTrackSpeaker: true,
  depthOfField: 0.35,
  lightShafts: 0.4,
  spatialAudio: true,
  hitstopEnabled: true,
  foregroundFraming: 0.35,
  vfxIntensity: 0.75,
  tiltShiftAmount: 0,
};

export const LOOK_PRESETS: Array<{
  id: LookPresetId;
  label: string;
  note: string;
  style: EpisodeVisualStyle;
}> = [
  {
    id: 'classic_chiaroscuro',
    label: 'Classic Chiaroscuro',
    note: 'Signature default graphic-novel look',
    style: { ...DEFAULT_VISUAL_STYLE },
  },
  {
    id: 'gilded_epic',
    label: 'Gilded Epic',
    note: 'Warm saffron gold & filigree — Ramayana / Mahabharata',
    style: {
      renderStyle: 'chiaroscuro',
      lookPreset: 'gilded_epic',
      colorGrade: 'warm_gold',
      texture: 'cinema_35mm',
      shadowContrast: 1.12,
      inkWeight: 1.15,
      rimLight: 'gold',
      captionStyle: 'gold_manuscript',
      frameBorder: 'gold_filigree',
      vignette: 0.42,
    },
  },
  {
    id: 'sunlit_storybook',
    label: 'Sunlit Fable',
    note: 'Softer shadows & parchment — Panchatantra / Jataka',
    style: {
      renderStyle: 'papercraft_diorama',
      lookPreset: 'sunlit_storybook',
      colorGrade: 'emerald_fable',
      texture: 'parchment_grain',
      shadowContrast: 0.78,
      inkWeight: 0.9,
      rimLight: 'gold',
      captionStyle: 'classic_cinema',
      frameBorder: 'clean_letterbox',
      vignette: 0.22,
    },
  },
  {
    id: 'moonlit_noir',
    label: 'Moonlit Noir',
    note: 'Deep indigo contrast & silver rim — Vikram & Betaal',
    style: {
      renderStyle: 'chiaroscuro',
      lookPreset: 'moonlit_noir',
      colorGrade: 'indigo_noir',
      texture: 'woodblock_halftone',
      shadowContrast: 1.28,
      inkWeight: 1.32,
      rimLight: 'moon_silver',
      captionStyle: 'shorts_bold_pop',
      frameBorder: 'clean_letterbox',
      vignette: 0.62,
    },
  },
  {
    id: 'palm_leaf_manuscript',
    label: 'Palm-Leaf Classic',
    note: 'Sepia parchment & margin frame — Puranas / Hitopadesha',
    style: {
      renderStyle: 'woodblock_print',
      lookPreset: 'palm_leaf_manuscript',
      colorGrade: 'sepia_manuscript',
      texture: 'palm_leaf_fibers',
      shadowContrast: 0.92,
      inkWeight: 0.85,
      rimLight: 'gold',
      captionStyle: 'gold_manuscript',
      frameBorder: 'manuscript_margin',
      vignette: 0.48,
    },
  },
];

export const COLOR_GRADE_CATALOG: Array<{ id: ColorGradeId; label: string }> = [
  { id: 'default', label: 'Default (Mood Native)' },
  { id: 'warm_gold', label: 'Warm Saffron Gold' },
  { id: 'indigo_noir', label: 'Deep Indigo Noir' },
  { id: 'vermilion_royal', label: 'Royal Vermilion' },
  { id: 'emerald_fable', label: 'Emerald Storybook' },
  { id: 'sepia_manuscript', label: 'Sepia Palm-Leaf' },
];

export const TEXTURE_CATALOG: Array<{ id: SurfaceTextureId; label: string }> = [
  { id: 'clean', label: 'Clean Graphic Ink' },
  { id: 'parchment_grain', label: 'Handmade Parchment' },
  { id: 'palm_leaf_fibers', label: 'Palm-Leaf Fibers' },
  { id: 'woodblock_halftone', label: 'Woodblock Halftone' },
  { id: 'cinema_35mm', label: '35mm Cinema Grain' },
];

export const RIM_LIGHT_CATALOG: Array<{ id: RimLightId; label: string; hex: string | null }> = [
  { id: 'auto', label: 'Auto (Mood Rim)', hex: null },
  { id: 'gold', label: 'Temple Gold', hex: '#ffd452' },
  { id: 'moon_silver', label: 'Moonlight Silver', hex: '#cfe4ff' },
  { id: 'fire_crimson', label: 'Crimson Fire', hex: '#ff425e' },
  { id: 'divine_cyan', label: 'Celestial Cyan', hex: '#6ef2ff' },
  { id: 'none', label: 'Off', hex: '' },
];

export const CAPTION_STYLE_CATALOG: Array<{ id: CaptionStyleId; label: string }> = [
  { id: 'classic_cinema', label: 'Classic Cinema Bar' },
  { id: 'gold_manuscript', label: 'Gold Manuscript Plate' },
  { id: 'shorts_bold_pop', label: 'Shorts Bold Pop' },
  { id: 'minimal_clean', label: 'Minimal Clean' },
  { id: 'comic_speech_pop', label: 'Comic Speech Pop' },
  { id: 'minimal_editorial', label: 'Minimal Editorial' },
];

export const FRAME_BORDER_CATALOG: Array<{ id: FrameBorderId; label: string }> = [
  { id: 'clean_letterbox', label: 'Classic Cinema Bars' },
  { id: 'gold_filigree', label: 'Gilded Filigree Frame' },
  { id: 'manuscript_margin', label: 'Manuscript Border' },
  { id: 'full_bleed', label: 'Full Bleed (No Bars)' },
];

export const CAST_MARK_CATALOG: Array<{ id: CastMarkId; label: string }> = [
  { id: 'default', label: 'Archetype Default' },
  { id: 'none', label: 'Clean Face' },
  { id: 'vermilion_tilak', label: 'Vermilion Tilak' },
  { id: 'tripundra_ash', label: 'Shiva Tripundra Ash' },
  { id: 'royal_mustache', label: 'Royal Mustache' },
  { id: 'full_beard', label: 'Sage / Noble Beard' },
  { id: 'divine_halo', label: 'Golden Divine Halo' },
];

export const CAST_HEADGEAR_CATALOG: Array<{ id: CastHeadgearId; label: string }> = [
  { id: 'default', label: 'Archetype Default' },
  { id: 'none', label: 'No Extra Headgear' },
  { id: 'royal_turban', label: 'Royal Pagri Turban' },
  { id: 'golden_mukut', label: 'Golden Epic Mukut' },
  { id: 'sage_topknot', label: 'Rishi Jata Topknot' },
  { id: 'battle_helm', label: 'Warrior Battle Helm' },
];

export function resolveVisualStyle(partial?: Partial<EpisodeVisualStyle>): EpisodeVisualStyle {
  if (!partial) return { ...DEFAULT_VISUAL_STYLE };
  return {
    renderStyle: partial.renderStyle || DEFAULT_VISUAL_STYLE.renderStyle,
    lookPreset: partial.lookPreset || DEFAULT_VISUAL_STYLE.lookPreset,
    colorGrade: partial.colorGrade || DEFAULT_VISUAL_STYLE.colorGrade,
    texture: partial.texture || DEFAULT_VISUAL_STYLE.texture,
    shadowContrast:
      typeof partial.shadowContrast === 'number' && Number.isFinite(partial.shadowContrast)
        ? Math.max(0.6, Math.min(1.4, partial.shadowContrast))
        : DEFAULT_VISUAL_STYLE.shadowContrast,
    inkWeight:
      typeof partial.inkWeight === 'number' && Number.isFinite(partial.inkWeight)
        ? Math.max(0.7, Math.min(1.5, partial.inkWeight))
        : DEFAULT_VISUAL_STYLE.inkWeight,
    rimLight: partial.rimLight || DEFAULT_VISUAL_STYLE.rimLight,
    captionStyle: partial.captionStyle || DEFAULT_VISUAL_STYLE.captionStyle,
    frameBorder: partial.frameBorder || DEFAULT_VISUAL_STYLE.frameBorder,
    vignette:
      typeof partial.vignette === 'number' && Number.isFinite(partial.vignette)
        ? Math.max(0, Math.min(1, partial.vignette))
        : DEFAULT_VISUAL_STYLE.vignette,
    motionCadence:
      partial.motionCadence === 'auto' ||
      partial.motionCadence === '60fps' ||
      partial.motionCadence === '24fps' ||
      partial.motionCadence === '12fps'
        ? partial.motionCadence
        : DEFAULT_VISUAL_STYLE.motionCadence,
    motionProfile:
      partial.motionProfile === 'auto' ||
      partial.motionProfile === 'cinematic_drama' ||
      partial.motionProfile === 'naturalistic' ||
      partial.motionProfile === 'snappy_cartoon' ||
      partial.motionProfile === 'motion_graphics'
        ? partial.motionProfile
        : DEFAULT_VISUAL_STYLE.motionProfile,
    postFxPass:
      partial.postFxPass === 'none' ||
      partial.postFxPass === 'bayer_dither' ||
      partial.postFxPass === 'pixel_grid_16bit' ||
      partial.postFxPass === 'crisp_outline' ||
      partial.postFxPass === 'chromatic_pop' ||
      partial.postFxPass === 'halftone_zine'
        ? partial.postFxPass
        : DEFAULT_VISUAL_STYLE.postFxPass,
    expressionsEnabled:
      typeof partial.expressionsEnabled === 'boolean'
        ? partial.expressionsEnabled
        : DEFAULT_VISUAL_STYLE.expressionsEnabled,
    karaokeCaptions:
      typeof partial.karaokeCaptions === 'boolean'
        ? partial.karaokeCaptions
        : DEFAULT_VISUAL_STYLE.karaokeCaptions,
    autoTrackSpeaker:
      typeof partial.autoTrackSpeaker === 'boolean'
        ? partial.autoTrackSpeaker
        : DEFAULT_VISUAL_STYLE.autoTrackSpeaker,
    depthOfField:
      typeof partial.depthOfField === 'number' && Number.isFinite(partial.depthOfField)
        ? Math.max(0, Math.min(1, partial.depthOfField))
        : DEFAULT_VISUAL_STYLE.depthOfField,
    lightShafts:
      typeof partial.lightShafts === 'number' && Number.isFinite(partial.lightShafts)
        ? Math.max(0, Math.min(1, partial.lightShafts))
        : DEFAULT_VISUAL_STYLE.lightShafts,
    spatialAudio:
      typeof partial.spatialAudio === 'boolean'
        ? partial.spatialAudio
        : DEFAULT_VISUAL_STYLE.spatialAudio,
    hitstopEnabled:
      typeof partial.hitstopEnabled === 'boolean'
        ? partial.hitstopEnabled
        : DEFAULT_VISUAL_STYLE.hitstopEnabled,
    foregroundFraming:
      typeof partial.foregroundFraming === 'number' && Number.isFinite(partial.foregroundFraming)
        ? Math.max(0, Math.min(1, partial.foregroundFraming))
        : DEFAULT_VISUAL_STYLE.foregroundFraming,
    vfxIntensity:
      typeof partial.vfxIntensity === 'number' && Number.isFinite(partial.vfxIntensity)
        ? Math.max(0, Math.min(1, partial.vfxIntensity))
        : DEFAULT_VISUAL_STYLE.vfxIntensity,
    tiltShiftAmount:
      typeof partial.tiltShiftAmount === 'number' && Number.isFinite(partial.tiltShiftAmount)
        ? Math.max(0, Math.min(1, partial.tiltShiftAmount))
        : DEFAULT_VISUAL_STYLE.tiltShiftAmount,
  };
}

export const ARCHETYPE_DEFAULT_COLORS: Record<
  ArchetypeId,
  { primary: string; accent: string; skin?: string }
> = {
  deva: { primary: '#d97b16', accent: '#ffd954', skin: '#6ca4d9' },
  goddess: { primary: '#c9183c', accent: '#ffd954', skin: '#edb186' },
  demon_king: { primary: '#2b1224', accent: '#ff2b45', skin: '#544a63' },
  vanara_hero: { primary: '#e65c19', accent: '#ffd452', skin: '#d68f5c' },
  spirit: { primary: '#1d2747', accent: '#ff173d', skin: '#cfe2f7' },
  yaksha: { primary: '#114a57', accent: '#6ef2ff', skin: '#9adce8' },
  statue_apsara: { primary: '#d99a26', accent: '#fff0a6', skin: '#f5cb5c' },
  king: { primary: '#d91a36', accent: '#ffd04d', skin: '#e09a6e' },
  emperor: { primary: '#6b1236', accent: '#ffd452', skin: '#d89b72' },
  queen: { primary: '#a61c5c', accent: '#ffd452', skin: '#e6a882' },
  sage: { primary: '#d96c1f', accent: '#ffe380', skin: '#d19269' },
  courtier: { primary: '#1f7a68', accent: '#ffd452', skin: '#d9986c' },
  warrior: { primary: '#264d8f', accent: '#f5bf38', skin: '#d99268' },
  ascetic: { primary: '#2b1945', accent: '#ff3855', skin: '#c4b8c9' },
  merchant: { primary: '#8c6239', accent: '#f0c24b', skin: '#d4956b' },
  child: { primary: '#2e7d62', accent: '#ffd452', skin: '#e3a57d' },
  elder_woman: { primary: '#8c3b52', accent: '#f2e4c9', skin: '#cc8f68' },
  guard: { primary: '#3d4c6b', accent: '#f5bf38', skin: '#cf8e67' },
  monkey: { primary: '#9c5b34', accent: '#ffd04d', skin: '#d99e75' },
  lion: { primary: '#d68a24', accent: '#ff3b30', skin: '#e8ad4a' },
  tiger: { primary: '#e86f1c', accent: '#ffd04d', skin: '#f28735' },
  bull: { primary: '#d6cfc2', accent: '#f5bf38', skin: '#e8e2d5' },
  hare: { primary: '#d4c8b8', accent: '#ff8da1', skin: '#ebe1d5' },
  jackal: { primary: '#7a4f38', accent: '#6be5b8', skin: '#b37a56' },
  serpent: { primary: '#1b6e4d', accent: '#ffd04d', skin: '#2d8a64' },
  elephant: { primary: '#56647a', accent: '#f5d26b', skin: '#6b7a94' },
  deer: { primary: '#d49a2a', accent: '#fff0a6', skin: '#f0ba48' },
  crow: { primary: '#1c2438', accent: '#f5be38', skin: '#25304a' },
  crane: { primary: '#e8eef5', accent: '#f5a623', skin: '#f5f8fc' },
  crocodile: { primary: '#2b5e40', accent: '#f5c242', skin: '#397852' },
  tortoise: { primary: '#4a6b3d', accent: '#d9a441', skin: '#6e8c58' },
  owl: { primary: '#6e4c36', accent: '#ffd147', skin: '#946b4d' },
  mouse: { primary: '#706b7a', accent: '#f5a3b5', skin: '#948fa1' },
  dog: { primary: '#8c5d38', accent: '#ffd04d', skin: '#b88256' },
  fox: { primary: '#d95b26', accent: '#fff4de', skin: '#eb7438' },
  wolf: { primary: '#4d586b', accent: '#ffd866', skin: '#6b788f' },
  spider: { primary: '#1a1829', accent: '#ffd04d', skin: '#2a2640' },
  knight: { primary: '#2d4b82', accent: '#f2c85b', skin: '#dfb18c' },
  samurai: { primary: '#9e1b2c', accent: '#ffd04d', skin: '#e6b894' },
  raven: { primary: '#161b2e', accent: '#56e8ff', skin: '#202842' },
  // Wave 3: +20 Universal Archetype Palettes
  detective: { primary: '#4a433b', accent: '#f0b84c', skin: '#dfb18c' },
  scientist: { primary: '#e2e8f0', accent: '#38bdf8', skin: '#d89b72' },
  astronaut: { primary: '#e8eef5', accent: '#fb923c', skin: '#dfb18c' },
  cyber_hacker: { primary: '#1e1b4b', accent: '#22d3ee', skin: '#e6b894' },
  android: { primary: '#64748b', accent: '#38bdf8', skin: '#cbd5e1' },
  mech_pilot: { primary: '#b91c1c', accent: '#facc15', skin: '#e0a580' },
  wizard: { primary: '#312e81', accent: '#fbbf24', skin: '#e6b894' },
  pirate_captain: { primary: '#7f1d1d', accent: '#f5be38', skin: '#d4956b' },
  ninja: { primary: '#111827', accent: '#ef4444', skin: '#e0a580' },
  viking: { primary: '#3f4e63', accent: '#d99a26', skin: '#e8bc99' },
  pharaoh: { primary: '#1d4ed8', accent: '#f5be38', skin: '#cc8f62' },
  vampire_lord: { primary: '#18181b', accent: '#dc2626', skin: '#e2e8f0' },
  dragon_kin: { primary: '#991b1b', accent: '#fbbf24', skin: '#b45309' },
  elf_archer: { primary: '#166534', accent: '#fde047', skin: '#f1c7a5' },
  dwarf_smith: { primary: '#78350f', accent: '#f59e0b', skin: '#dca077' },
  ghost_phantom: { primary: '#1e3a5f', accent: '#67e8f9', skin: '#cfefff' },
  journalist: { primary: '#1e3a8a', accent: '#f59e0b', skin: '#d9986c' },
  street_musician: { primary: '#4c1d95', accent: '#f472b6', skin: '#c9885b' },
  cat_mascot: { primary: '#ea580c', accent: '#fde047', skin: '#fb923c' },
  robot_companion: { primary: '#0ea5e9', accent: '#fde047', skin: '#e0f2fe' },
  // Wave 5: +100 Universal Archetype Palettes
  // World Mythology & Legends (10)
  zeus_thunderer: { primary: '#f1f5f9', accent: '#facc15', skin: '#e6b894' },
  athena_strategist: { primary: '#1d4ed8', accent: '#f5be38', skin: '#e8bc99' },
  anubis_guardian: { primary: '#1e293b', accent: '#facc15', skin: '#18181b' },
  valkyrie_shieldmaiden: { primary: '#cbd5e1', accent: '#38bdf8', skin: '#f1c7a5' },
  kitsune_foxspirit: { primary: '#b91c1c', accent: '#fef08a', skin: '#f8fafc' },
  sun_wukong_trickster: { primary: '#dc2626', accent: '#facc15', skin: '#d9986c' },
  quetzal_priest: { primary: '#047857', accent: '#fbbf24', skin: '#c9885b' },
  celtic_druid: { primary: '#166534', accent: '#a3e635', skin: '#e6b894' },
  djinn_genie: { primary: '#0284c7', accent: '#facc15', skin: '#38bdf8' },
  poseidon_tideking: { primary: '#0e7490', accent: '#67e8f9', skin: '#d49d78' },
  // Historical & Cultural Eras (10)
  roman_centurion: { primary: '#991b1b', accent: '#f5be38', skin: '#dfb18c' },
  spartan_hoplite: { primary: '#b91c1c', accent: '#d97706', skin: '#d4956b' },
  renaissance_painter: { primary: '#5b21b6', accent: '#fbbf24', skin: '#e6b894' },
  victorian_inventor: { primary: '#78350f', accent: '#f59e0b', skin: '#ebd0b8' },
  wild_west_sheriff: { primary: '#92400e', accent: '#facc15', skin: '#dca077' },
  outlaw_bandit: { primary: '#27272a', accent: '#ef4444', skin: '#d4956b' },
  feudal_shogun: { primary: '#7f1d1d', accent: '#facc15', skin: '#e8bc99' },
  maratha_commander: { primary: '#ea580c', accent: '#ffd452', skin: '#cf8e67' },
  silk_road_nomad: { primary: '#0f766e', accent: '#fbbf24', skin: '#d19269' },
  caveman_hunter: { primary: '#7c2d12', accent: '#d6d3d1', skin: '#c9885b' },
  // Modern Everyday & Civic (10)
  doctor_surgeon: { primary: '#0ea5e9', accent: '#f8fafc', skin: '#dca077' },
  firefighter_rescuer: { primary: '#dc2626', accent: '#facc15', skin: '#d9986c' },
  police_officer: { primary: '#1e3a8a', accent: '#facc15', skin: '#dfb18c' },
  judge_magistrate: { primary: '#18181b', accent: '#f8fafc', skin: '#d89b72' },
  lawyer_advocate: { primary: '#1e293b', accent: '#dc2626', skin: '#e0a580' },
  school_teacher: { primary: '#0f766e', accent: '#fde047', skin: '#e6b894' },
  chef_culinary: { primary: '#f8fafc', accent: '#ef4444', skin: '#dca077' },
  delivery_courier: { primary: '#f97316', accent: '#f8fafc', skin: '#d4956b' },
  construction_engineer: { primary: '#eab308', accent: '#1e293b', skin: '#cf8e67' },
  farmer_grower: { primary: '#15803d', accent: '#facc15', skin: '#d19269' },
  // Media, Business & Explainer (10)
  ceo_founder: { primary: '#0f172a', accent: '#38bdf8', skin: '#e0a580' },
  podcast_host: { primary: '#4c1d95', accent: '#f472b6', skin: '#d9986c' },
  news_anchor: { primary: '#1d4ed8', accent: '#ef4444', skin: '#e6b894' },
  stock_trader: { primary: '#065f46', accent: '#34d399', skin: '#dfb18c' },
  tech_developer: { primary: '#312e81', accent: '#22d3ee', skin: '#d89b72' },
  influencer_vlogger: { primary: '#db2777', accent: '#fde047', skin: '#e8bc99' },
  historian_professor: { primary: '#78350f', accent: '#fcd34d', skin: '#d4956b' },
  coach_mentor: { primary: '#b91c1c', accent: '#f8fafc', skin: '#c9885b' },
  film_director: { primary: '#18181b', accent: '#f59e0b', skin: '#dfb18c' },
  esports_gamer: { primary: '#6d28d9', accent: '#00f0ff', skin: '#e6b894' },
  // Sci-Fi, Cyberpunk & Space (10)
  bounty_hunter: { primary: '#3f3f46', accent: '#f97316', skin: '#c9885b' },
  alien_diplomat: { primary: '#4f46e5', accent: '#5eead4', skin: '#7dd3fc' },
  cyborg_enforcer: { primary: '#334155', accent: '#ef4444', skin: '#cbd5e1' },
  time_traveler: { primary: '#1e3a8a', accent: '#38bdf8', skin: '#e6b894' },
  space_admiral: { primary: '#0f172a', accent: '#facc15', skin: '#d89b72' },
  drone_operator: { primary: '#1e293b', accent: '#22c55e', skin: '#d9986c' },
  bio_geneticist: { primary: '#f1f5f9', accent: '#10b981', skin: '#e0a580' },
  wasteland_scavenger: { primary: '#78350f', accent: '#fb923c', skin: '#c9885b' },
  quantum_physicist: { primary: '#312e81', accent: '#a855f7', skin: '#dfb18c' },
  ai_hologram: { primary: '#0284c7', accent: '#67e8f9', skin: '#bae6fd' },
  // High Fantasy & RPG Classes (10)
  paladin_crusader: { primary: '#e2e8f0', accent: '#facc15', skin: '#e8bc99' },
  necromancer_mage: { primary: '#1e1b4b', accent: '#4ade80', skin: '#cbd5e1' },
  alchemist_brewer: { primary: '#065f46', accent: '#a855f7', skin: '#dfb18c' },
  shadow_rogue: { primary: '#18181b', accent: '#a855f7', skin: '#d4956b' },
  tavern_bard: { primary: '#be123c', accent: '#facc15', skin: '#e6b894' },
  beast_ranger: { primary: '#14532d', accent: '#d97706', skin: '#d19269' },
  archmage_oracle: { primary: '#4338ca', accent: '#fde047', skin: '#e8bc99' },
  goblin_tinkerer: { primary: '#78350f', accent: '#f59e0b', skin: '#65a30d' },
  orc_warlord: { primary: '#451a03', accent: '#ef4444', skin: '#4d7c0f' },
  celestial_angel: { primary: '#f8fafc', accent: '#fde047', skin: '#f5d0b5' },
  // Dark Gothic, Horror & Folklore (10)
  werewolf_stalker: { primary: '#3f3f46', accent: '#facc15', skin: '#52525b' },
  plague_doctor: { primary: '#18181b', accent: '#d97706', skin: '#e2e8f0' },
  mummy_sovereign: { primary: '#d6d3d1', accent: '#facc15', skin: '#a8a29e' },
  witch_herbalist: { primary: '#3b0764', accent: '#4ade80', skin: '#e2e8f0' },
  grim_reaper: { primary: '#09090b', accent: '#38bdf8', skin: '#f1f5f9' },
  gargoyle_sentinel: { primary: '#475569', accent: '#f59e0b', skin: '#64748b' },
  banshee_wraith: { primary: '#1e293b', accent: '#67e8f9', skin: '#e0f2fe' },
  mad_scientist: { primary: '#e2e8f0', accent: '#a3e635', skin: '#ebd0b8' },
  occult_investigator: { primary: '#3f2e21', accent: '#a855f7', skin: '#dfb18c' },
  pumpkin_scarecrow: { primary: '#9a3412', accent: '#facc15', skin: '#f97316' },
  // Wildlife & Prehistoric (10)
  trex_dinosaur: { primary: '#15803d', accent: '#facc15', skin: '#166534' },
  triceratops_dino: { primary: '#9a3412', accent: '#fef3c7', skin: '#b45309' },
  grizzly_bear: { primary: '#78350f', accent: '#d6b48a', skin: '#92400e' },
  polar_penguin: { primary: '#0f172a', accent: '#f97316', skin: '#f8fafc' },
  giant_panda: { primary: '#18181b', accent: '#22c55e', skin: '#f8fafc' },
  bald_eagle: { primary: '#5c3317', accent: '#facc15', skin: '#f8fafc' },
  silverback_gorilla: { primary: '#27272a', accent: '#cbd5e1', skin: '#3f3f46' },
  desert_camel: { primary: '#b45309', accent: '#dc2626', skin: '#d97706' },
  great_white_shark: { primary: '#475569', accent: '#f8fafc', skin: '#64748b' },
  giant_octopus: { primary: '#9333ea', accent: '#f472b6', skin: '#a855f7' },
  // Mythic Beasts & Companions (10)
  fire_phoenix: { primary: '#dc2626', accent: '#fde047', skin: '#f97316' },
  frost_unicorn: { primary: '#e0f2fe', accent: '#38bdf8', skin: '#f8fafc' },
  winged_griffin: { primary: '#b45309', accent: '#facc15', skin: '#e5c17b' },
  sea_mermaid: { primary: '#0d9488', accent: '#f472b6', skin: '#ebbc9e' },
  sky_pegasus: { primary: '#f8fafc', accent: '#facc15', skin: '#e2e8f0' },
  forest_treant: { primary: '#5c3317', accent: '#4ade80', skin: '#78350f' },
  stone_golem: { primary: '#475569', accent: '#38bdf8', skin: '#64748b' },
  crystal_slime: { primary: '#06b6d4', accent: '#f0abfc', skin: '#22d3ee' },
  baby_dragon: { primary: '#dc2626', accent: '#facc15', skin: '#ef4444' },
  clockwork_automaton: { primary: '#b45309', accent: '#38bdf8', skin: '#d97706' },
  // Kids, Sports & Entertainment (10)
  soccer_striker: { primary: '#2563eb', accent: '#facc15', skin: '#dca077' },
  cricket_batter: { primary: '#1d4ed8', accent: '#f97316', skin: '#cf8e67' },
  martial_artist: { primary: '#f8fafc', accent: '#18181b', skin: '#e0a580' },
  circus_ringmaster: { primary: '#dc2626', accent: '#facc15', skin: '#e6b894' },
  stage_magician: { primary: '#18181b', accent: '#a855f7', skin: '#e8bc99' },
  orchestra_conductor: { primary: '#0f172a', accent: '#facc15', skin: '#dfb18c' },
  ballet_dancer: { primary: '#f472b6', accent: '#fef08a', skin: '#f1c7a5' },
  skateboard_kid: { primary: '#0ea5e9', accent: '#facc15', skin: '#dca077' },
  explorer_scout: { primary: '#65a30d', accent: '#f59e0b', skin: '#d9986c' },
  toy_nutcracker: { primary: '#b91c1c', accent: '#facc15', skin: '#f5d0b5' },
};

export function getEpisodeDuration(ep: EpisodeScript): number {
  return ep.beats.reduce((sum, b) => sum + Math.max(1.2, b.duration), 0);
}

export function getEpisodeTotalFrames(ep: EpisodeScript, fps = STUDIO_FPS): number {
  const safeFps = Number.isFinite(fps) && fps > 0 ? Math.round(fps) : STUDIO_FPS;
  return Math.max(1, Math.round(getEpisodeDuration(ep) * safeFps));
}

export interface ResolvedBeatActionState {
  actorPoseOverrides: Record<string, PoseId>;
  actorMotionOverrides: Record<string, MotionId>;
  cameraPunch: number; // 0 .. 1 damped impulse
  propPulse: number; // 0 .. 1 damped impulse
  fxOverride: FxId | null;
  activeSfx: SfxId | null;
  activeSfxOffsetSec: number | null;
}

export interface ResolvedBeatActionSfxEvent {
  cueIndex: number;
  sfx: SfxId;
  startFrame: number;
  offsetSec: number;
}

export function resolveActionCueStartFrame(
  cue: BeatActionCue,
  dialogue: string,
  dur: number,
  totalFrames: number
): number {
  if (typeof cue.frame === 'number' && Number.isFinite(cue.frame)) {
    return Math.max(0, Math.round(cue.frame));
  }
  if (typeof cue.timeSec === 'number' && Number.isFinite(cue.timeSec)) {
    return Math.max(0, Math.round(cue.timeSec * STUDIO_FPS));
  }
  if (typeof cue.at === 'number' && Number.isFinite(cue.at)) {
    return Math.max(0, Math.round(Math.max(0, Math.min(1, cue.at)) * totalFrames));
  }
  if (cue.triggerPhrase && dialogue) {
    const aligned = computePhraseTriggerFrame(dialogue, cue.triggerPhrase, dur, 0);
    if (aligned !== null) return aligned;
  }
  return 0;
}

/**
 * Resolves all sub-beat action cue SFX triggers to exact frame-locked beat-local offsets.
 * Shared by both live KathaAudioEngine playback and OfflineAudioContext WAV mixdown.
 */
export function resolveBeatActionSfxEvents(
  beat: Pick<StoryBeat, 'duration' | 'dialogue' | 'actionCues'>
): ResolvedBeatActionSfxEvent[] {
  const cues = beat.actionCues;
  if (!Array.isArray(cues) || cues.length === 0) return [];

  const dur = Math.max(1.2, Number.isFinite(beat.duration) ? beat.duration : 4);
  const totalFrames = Math.max(1, Math.round(dur * STUDIO_FPS));
  const out: ResolvedBeatActionSfxEvent[] = [];

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    if (!cue?.sfx || cue.sfx === 'none') continue;
    const startFrame = Math.min(totalFrames, resolveActionCueStartFrame(cue, beat.dialogue || '', dur, totalFrames));
    const offsetSec = Math.max(0, Math.min(dur - 0.08, startFrame / STUDIO_FPS));
    out.push({ cueIndex: i, sfx: cue.sfx, startFrame, offsetSec });
  }

  out.sort((a, b) => (a.startFrame !== b.startFrame ? a.startFrame - b.startFrame : a.cueIndex - b.cueIndex));
  return out;
}

/**
 * Pure O(1) Stateless Sub-Beat Action Cue Resolver.
 * Evaluates declarative `beat.actionCues` at an exact integer `localFrame` (60fps)
 * so mid-beat pose switches, camera punches, prop highlights, and FX bursts scrub
 * instantaneously with zero stateful generator replay.
 */
export function resolveBeatActionStateAtFrame(
  beat: Pick<StoryBeat, 'duration' | 'dialogue' | 'actionCues'>,
  localFrame: number
): ResolvedBeatActionState {
  const state: ResolvedBeatActionState = {
    actorPoseOverrides: {},
    actorMotionOverrides: {},
    cameraPunch: 0,
    propPulse: 0,
    fxOverride: null,
    activeSfx: null,
    activeSfxOffsetSec: null,
  };

  const cues = beat.actionCues;
  if (!Array.isArray(cues) || cues.length === 0) return state;

  const dur = Math.max(1.2, Number.isFinite(beat.duration) ? beat.duration : 4);
  const totalFrames = Math.max(1, Math.round(dur * STUDIO_FPS));
  const f = Math.max(0, Math.min(totalFrames, Math.round(localFrame)));

  const resolved = cues.map((cue, order) => {
    const startFrame = resolveActionCueStartFrame(cue, beat.dialogue || '', dur, totalFrames);
    const endFrame =
      typeof cue.endFrame === 'number' && Number.isFinite(cue.endFrame) && cue.endFrame >= startFrame
        ? Math.round(cue.endFrame)
        : undefined;
    return { cue, startFrame, endFrame, order };
  });

  resolved.sort((a, b) => (a.startFrame !== b.startFrame ? a.startFrame - b.startFrame : a.order - b.order));

  for (const { cue, startFrame, endFrame } of resolved) {
    if (f < startFrame) continue;
    const elapsed = f - startFrame;
    const withinRange = endFrame === undefined || f <= endFrame;

    if (withinRange && cue.castId) {
      if (cue.pose) state.actorPoseOverrides[cue.castId] = cue.pose;
      if (cue.motion) state.actorMotionOverrides[cue.castId] = cue.motion;
    }

    if (typeof cue.cameraPunch === 'number' && cue.cameraPunch > 0 && elapsed < 22) {
      const env = Math.sin(Math.min(1, elapsed / 4) * Math.PI * 0.5) * Math.exp(-elapsed / 7.5);
      state.cameraPunch = Math.max(state.cameraPunch, Math.min(1, cue.cameraPunch) * env);
    }

    if (typeof cue.propPulse === 'number' && cue.propPulse > 0 && elapsed < 30) {
      const env = Math.sin(Math.min(1, elapsed / 5) * Math.PI * 0.5) * Math.exp(-elapsed / 10);
      state.propPulse = Math.max(state.propPulse, Math.min(1, cue.propPulse) * env);
    }

    if (cue.fx && cue.fx !== 'none') {
      const fxWindowEnd = endFrame ?? startFrame + 42;
      if (f <= fxWindowEnd) {
        state.fxOverride = cue.fx;
      }
    }

    if (cue.sfx && cue.sfx !== 'none' && elapsed <= 45) {
      state.activeSfx = cue.sfx;
      state.activeSfxOffsetSec = startFrame / STUDIO_FPS;
    }
  }

  return state;
}

/**
 * Generates a copy-pasteable AI Director System Prompt so ANY external LLM
 * (Gemini, Claude, GPT) can author deterministic full-chapter JSON scripts across Indian & World Folklore.
 */
export function buildAiDirectorPrompt(): string {
  return `You are an Episode & Full-Chapter Director for "Katha Studio", a deterministic 10-Engine 2D Graphic-Novel Machinima Studio for Public-Domain World Folklore, Fables & Epics (Indian Epics & Folklore, Aesop's Fables, Grimm's Fairy Tales, Greek & Norse Myths, Journey to the West, Japanese Folktales, Southeast Asian Sang Kancil & Wayang, Indigenous American Raven/Coyote & Mesoamerican Myths, and West African Anansi & Griot Legends).

Return ONLY valid JSON matching this EpisodeScript schema (no markdown fences):
{
  "id": "slug",
  "series": "Storybook Name (e.g. Ramayana | Mahabharata | Puranas | Panchatantra | Vikram & Betaal | Singhasan Battisi | Hitopadesha | Jataka Tales | Tenali Rama | Akbar & Birbal | Gopal Bhar | Kathasaritsagara | Aesop's Fables | Grimm's Fairy Tales | Journey to the West | Sang Kancil Folklore | Indigenous Legends | Anansi the Spider)",
  "shelf": "Modern Multi-Genre Showcases | Supernatural & Royal Legends | Animal Fables & Strategy | Royal Court Wit & Satire | Sacred Epics & Puranas | Western Folklore & Fables | East Asian Tales & Epics | Southeast Asian Folklore | Americas & Indigenous Legends | African Griot & Trickster Tales",
  "title": "Chapter / Episode Title",
  "subtitle": "Short evocative tagline",
  "defaultRaag": "${RAAG_CATALOG.map((r) => r.id).join(' | ')}",
  "visualStyle": {
    "lookPreset": "${LOOK_PRESETS.map((l) => l.id).join(' | ')}",
    "colorGrade": "${COLOR_GRADE_CATALOG.map((c) => c.id).join(' | ')}",
    "texture": "${TEXTURE_CATALOG.map((t) => t.id).join(' | ')}",
    "shadowContrast": 1.0,
    "inkWeight": 1.0,
    "rimLight": "${RIM_LIGHT_CATALOG.map((r) => r.id).join(' | ')}",
    "captionStyle": "${CAPTION_STYLE_CATALOG.map((c) => c.id).join(' | ')}",
    "frameBorder": "${FRAME_BORDER_CATALOG.map((f) => f.id).join(' | ')}",
    "renderStyle": "${RENDER_STYLE_CATALOG.map((r) => r.id).join(' | ')}",
    "motionProfile": "${MOTION_PROFILE_CATALOG.map((p) => p.id).join(' | ')}",
    "vignette": 0.3
  },
  "cast": [
    {
      "id": "short_id",
      "name": "Display Name",
      "archetype": "${ARCHETYPE_CATALOG.map((a) => a.id).join(' | ')}",
      "primaryColor": "#hex garment/fur color",
      "accentColor": "#hex trim/crown/eye color",
      "skinColor": "#hex optional skin/fur tone",
      "mark": "${CAST_MARK_CATALOG.map((m) => m.id).join(' | ')}",
      "headgear": "${CAST_HEADGEAR_CATALOG.map((h) => h.id).join(' | ')}",
      "scale": 1.0
    }
  ],
  "beats": [
    {
      "id": "b1",
      "title": "Short Scene Label",
      "duration": 4.2,
      "frame": "${FRAME_CATALOG.map((f) => f.id).join(' | ')}",
      "renderStyle": "optional per-beat override: ${RENDER_STYLE_CATALOG.map((r) => r.id).join(' | ')}",
      "stage": "${STAGE_CATALOG.map((s) => s.id).join(' | ')}",
      "mood": "${MOOD_CATALOG.map((m) => m.id).join(' | ')}",
      "crowd": "${CROWD_CATALOG.map((c) => c.id).join(' | ')}",
      "cameraMove": "${CAMERA_MOVE_CATALOG.map((c) => c.id).join(' | ')}",
      "flipStage": false,
      "haze": 0,
      "backdropZoom": 1.0,
      "weather": "${WEATHER_LIST.join(' | ')}",
      "shot": "${SHOT_CATALOG.map((s) => s.id).join(' | ')}",
      "transition": "${TRANSITION_CATALOG.map((t) => t.id).join(' | ')}",
      "lightSide": "left | right",
      "prop": "${PROP_CATALOG.map((p) => p.id).join(' | ')}",
      "propSlot": "left | center | right | overhead",
      "fx": "${FX_LIST.join(' | ')}",
      "sfx": "${SFX_CATALOG.map((x) => x.id).join(' | ')}",
      "raag": "${RAAG_CATALOG.map((r) => r.id).join(' | ')}",
      "musicEnergy": 0.65,
      "actors": [
        {
          "castId": "matches cast[].id",
          "slot": "left | center | right | overhead",
          "pose": "${POSE_LIST.join(' | ')}",
          "expression": "${EXPRESSION_LIST.join(' | ')}",
          "expressionTrack": [
            { "frame": 0, "endFrame": 120, "expression": "curious", "reason": "weighing the speaker's claim" },
            { "frame": 120, "endFrame": 240, "triggerPhrase": "key turning words", "expression": "shocked", "reason": "reacts to sudden reveal" }
          ],
          "facing": "left | right",
          "motion": "${MOTION_LIST.join(' | ')}"
        }
      ],
      "expressionCues": [
        { "frame": 0, "endFrame": 110, "castId": "castId", "expression": "calm", "reason": "opening composure" },
        { "frame": 110, "endFrame": 240, "castId": "castId", "triggerPhrase": "spoken turn", "expression": "joy", "reason": "delighted realization" }
      ],
      "speakerId": "castId or narrator",
      "speakerLabel": "Speaker Name",
      "dialogue": "Punchy spoken line (10-18 words for crisp pacing)"
    }
  ]
}

FULL-CHAPTER DETERMINISTIC DIRECTING RULES:
- Match the tradition's signature "renderStyle" & "defaultRaag": chiaroscuro (Vikram & Betaal), lineless_vector (Ramayana/Mahabharata/Indigenous), papercraft_diorama (Panchatantra/Jataka/Hitopadesha), woodblock_print (Tenali/Birbal/Gopal Bhar), stained_glass (Puranas), shadow_puppetry (Kathasaritsagara/Sang Kancil), greek_amphora (Aesop), illuminated_codex (Grimm/Arthur), sumi_e_wash (Journey to the West/East Asia), kente_tapestry (Anansi/African Griot).
- EXPRESSION COMPREHENSION & SUBTEXT: Understand what EVERY on-stage character (both speaker AND silent listener!) feels across each set of frames. Account for dramatic irony (a flatterer feels "sly" while the listener shifts "curious -> joy"). Default friendly/narrative beats to "calm", "warm", "curious", "joy", or "awe"; reserve "angry" strictly for genuine rage/fury. Anchor mid-beat shifts with "triggerPhrase" (exact 2-4 spoken words from dialogue) and/or 60fps "frame"/"endFrame" plus a brief "reason"!
- Structure every episode with punchy 8-18 word spoken dialogue lines (zero narration dumps), alternate shots every beat (never repeat the same shot twice in a row), pair "cameraMove" + actor "motion" on beats >= 4.0s, punctuate key turns with "sfx", and close with a crisp "frame": "moral_card" wisdom epigram.
- Differentiate recurring archetypes with cast "primaryColor", "skinColor", "mark", "headgear", and "scale", and toggle "flipStage": true or "haze" when visiting rival kingdoms or return journeys.
- Use "crowd" ("courtiers", "army", "villagers", "forest_herd", "monks") on wide durbars, bazaars, and epic battlefields.
- 12 ANIMATION PRINCIPLES CRAFT: Choose a matching "visualStyle.motionProfile" (auto | cinematic_drama | naturalistic | snappy_cartoon | motion_graphics) and optional "visualStyle.postFxPass" (none | bayer_dither | pixel_grid_16bit | crisp_outline | chromatic_pop | halftone_zine), contrast short snappy action beats (2.6–3.4s) against slower emotional holds (4.4–5.6s), telegraph big payoffs with anticipation beats, and layer secondary atmospheric motion (weather + props + asymmetric poses) so characters never mirror each other like twins.
- SUB-BEAT CHOREOGRAPHY & KINETIC CARDS: You may add optional "actionCues": [{ "triggerPhrase": "key words", "castId": "hero", "pose": "attack", "cameraPunch": 0.7, "propPulse": 0.8 }] for multi-step timing inside a beat, and use "shot": "motion_card" with "motionCard": { "layout": "hero_stat | split_callout | morph_bar", "kicker": "...", "headline": "...", "metric": "99%", "bullets": ["..."] } for crisp explainer/title motion-graphics beats.`;
}

/**
 * Validates and sanitizes arbitrary AI-generated JSON into a guaranteed-safe EpisodeScript.
 */
export function validateEpisodeScript(raw: unknown): { ok: true; script: EpisodeScript } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Root JSON must be an EpisodeScript object.' };
  }
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.cast) || obj.cast.length === 0) {
    return { ok: false, error: 'EpisodeScript must contain a non-empty "cast" array.' };
  }
  if (!Array.isArray(obj.beats) || obj.beats.length === 0) {
    return { ok: false, error: 'EpisodeScript must contain a non-empty "beats" array.' };
  }

  const validArchetypes = new Set(ARCHETYPE_CATALOG.map((a) => a.id));
  const validStages = new Set(STAGE_CATALOG.map((s) => s.id));
  const validMoods = new Set(MOOD_CATALOG.map((m) => m.id));
  const validProps = new Set(PROP_CATALOG.map((p) => p.id));
  const validShots = new Set(SHOT_CATALOG.map((s) => s.id));
  const validTrans = new Set(TRANSITION_CATALOG.map((t) => t.id));
  const validRaags = new Set(RAAG_CATALOG.map((r) => r.id));
  const validFrames = new Set(FRAME_CATALOG.map((f) => f.id));
  const validCrowds = new Set(CROWD_CATALOG.map((c) => c.id));
  const validCameraMoves = new Set(CAMERA_MOVE_CATALOG.map((c) => c.id));
  const validMarks = new Set(CAST_MARK_CATALOG.map((m) => m.id));
  const validHeadgear = new Set(CAST_HEADGEAR_CATALOG.map((h) => h.id));
  const validLookPresets = new Set(LOOK_PRESETS.map((l) => l.id));
  const validGrades = new Set(COLOR_GRADE_CATALOG.map((g) => g.id));
  const validTextures = new Set(TEXTURE_CATALOG.map((t) => t.id));
  const validRimLights = new Set(RIM_LIGHT_CATALOG.map((r) => r.id));
  const validCaptionStyles = new Set(CAPTION_STYLE_CATALOG.map((c) => c.id));
  const validFrameBorders = new Set(FRAME_BORDER_CATALOG.map((f) => f.id));
  const validRenderStyles = new Set(RENDER_STYLE_CATALOG.map((r) => r.id));
  const validSfx = new Set(SFX_CATALOG.map((x) => x.id));
  const validAmbience = new Set(AMBIENCE_CATALOG.map((a) => a.id));
  const validPropAnchors = new Set(PROP_ANCHOR_CATALOG.map((p) => p.id));

  const cast: CastMember[] = obj.cast.map((c: unknown, i: number) => {
    const item = (c && typeof c === 'object' ? c : {}) as Record<string, unknown>;
    const arch = validArchetypes.has(item.archetype as ArchetypeId)
      ? (item.archetype as ArchetypeId)
      : 'courtier';
    const fallback = ARCHETYPE_DEFAULT_COLORS[arch];
    const scaleNum = Number(item.scale);
    const baseMember: CastMember = {
      id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `char_${i + 1}`,
      name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : `Character ${i + 1}`,
      archetype: arch,
      primaryColor: typeof item.primaryColor === 'string' ? item.primaryColor : fallback.primary,
      accentColor: typeof item.accentColor === 'string' ? item.accentColor : fallback.accent,
      skinColor: typeof item.skinColor === 'string' ? item.skinColor : fallback.skin,
      mark: validMarks.has(item.mark as CastMarkId) ? (item.mark as CastMarkId) : undefined,
      headgear: validHeadgear.has(item.headgear as CastHeadgearId)
        ? (item.headgear as CastHeadgearId)
        : undefined,
      scale:
        Number.isFinite(scaleNum) && scaleNum > 0
          ? Math.max(0.82, Math.min(1.25, scaleNum))
          : undefined,
    };
    const validatedDna = item.dna ? validateAndNormalizeDna(item.dna, baseMember) : undefined;
    return validatedDna ? { ...baseMember, dna: validatedDna } : baseMember;
  });

  const castIds = new Set(cast.map((c) => c.id));

  const beats: StoryBeat[] = obj.beats.map((b: unknown, i: number) => {
    const item = (b && typeof b === 'object' ? b : {}) as Record<string, unknown>;
    const actorsRaw = Array.isArray(item.actors) ? item.actors : [];
    const actors: ActorPlacement[] = actorsRaw
      .map((a: unknown): ActorPlacement | null => {
        if (!a || typeof a !== 'object') return null;
        const ao = a as Record<string, unknown>;
        const cid = typeof ao.castId === 'string' && castIds.has(ao.castId) ? ao.castId : cast[0].id;
        const trackRaw = Array.isArray(ao.expressionTrack) ? ao.expressionTrack : [];
        const expressionTrack: ExpressionKeyframe[] = trackRaw
          .map((kf): ExpressionKeyframe | null => {
            if (!kf || typeof kf !== 'object') return null;
            const ko = kf as Record<string, unknown>;
            const frameNum = Number(ko.frame);
            const endFrameNum = Number(ko.endFrame);
            const timeSecNum = Number(ko.timeSec);
            const atNum = Number(ko.at);
            const out: ExpressionKeyframe = {
              expression: normalizeExpressionId(ko.expression ?? ko.emotion),
            };
            if (ko.frame !== undefined && Number.isFinite(frameNum) && frameNum >= 0) {
              out.frame = Math.round(frameNum);
            } else if (ko.timeSec !== undefined && Number.isFinite(timeSecNum) && timeSecNum >= 0) {
              out.timeSec = Number(Math.min(18, timeSecNum).toFixed(2));
            } else if (ko.at !== undefined && Number.isFinite(atNum)) {
              out.at = Number(Math.max(0, Math.min(1, atNum)).toFixed(3));
            } else if (!ko.triggerPhrase) {
              out.at = 0;
            }
            if (ko.endFrame !== undefined && Number.isFinite(endFrameNum) && endFrameNum >= 0) {
              out.endFrame = Math.round(endFrameNum);
            }
            if (typeof ko.triggerPhrase === 'string' && ko.triggerPhrase.trim()) {
              out.triggerPhrase = ko.triggerPhrase.trim().slice(0, 80);
            }
            if (typeof ko.reason === 'string' && ko.reason.trim()) {
              out.reason = ko.reason.trim().slice(0, 120);
            }
            return out;
          })
          .filter((x): x is ExpressionKeyframe => x !== null);

        const offX = Number(ao.offsetX);
        const offY = Number(ao.offsetY);
        const rawGaze = typeof ao.gazeTarget === 'string' ? ao.gazeTarget.trim().toLowerCase() : '';
        const gazeTarget = ACTOR_GAZE_TARGET_LIST.includes(rawGaze as ActorGazeTargetId)
          ? (rawGaze as ActorGazeTargetId)
          : undefined;
        const rawHeadAngle = typeof ao.headAngle === 'string' ? ao.headAngle.trim().toLowerCase() : '';
        const headAngle = ACTOR_HEAD_ANGLE_LIST.includes(rawHeadAngle as ActorHeadAngleId)
          ? (rawHeadAngle as ActorHeadAngleId)
          : undefined;
        const rawHeldProp = typeof ao.heldProp === 'string' ? ao.heldProp.trim() : '';
        const heldProp =
          rawHeldProp === 'none' || validProps.has(rawHeldProp as PropId)
            ? (rawHeldProp as PropId | 'none')
            : undefined;
        const rawHeldHand = typeof ao.heldHand === 'string' ? ao.heldHand.trim().toLowerCase() : '';
        const heldHand = ACTOR_HELD_HAND_LIST.includes(rawHeldHand as ActorHeldHandId)
          ? (rawHeldHand as ActorHeldHandId)
          : undefined;

        return {
          castId: cid,
          slot: (['left', 'center', 'right', 'overhead'].includes(String(ao.slot))
            ? ao.slot
            : 'left') as ActorPlacement['slot'],
          pose: (POSE_LIST.includes(ao.pose as PoseId) ? ao.pose : 'stand') as PoseId,
          expression: normalizeExpressionId(ao.expression ?? ao.emotion),
          ...(expressionTrack.length > 0 ? { expressionTrack } : {}),
          facing: ao.facing === 'left' ? 'left' : 'right',
          motion: MOTION_LIST.includes(ao.motion as MotionId) ? (ao.motion as MotionId) : 'still',
          ...(Number.isFinite(offX) && offX !== 0
            ? { offsetX: Number(Math.max(-0.35, Math.min(0.35, offX)).toFixed(3)) }
            : {}),
          ...(Number.isFinite(offY) && offY !== 0
            ? { offsetY: Number(Math.max(-0.35, Math.min(0.35, offY)).toFixed(3)) }
            : {}),
          ...(gazeTarget ? { gazeTarget } : {}),
          ...(headAngle ? { headAngle } : {}),
          ...(heldProp ? { heldProp } : {}),
          ...(heldHand ? { heldHand } : {}),
        };
      })
      .filter((x): x is ActorPlacement => x !== null);

    const cuesRaw = Array.isArray(item.expressionCues) ? item.expressionCues : [];
    const expressionCues: BeatExpressionCue[] = cuesRaw
      .map((cue): BeatExpressionCue | null => {
        if (!cue || typeof cue !== 'object') return null;
        const co = cue as Record<string, unknown>;
        const cid = typeof co.castId === 'string' && castIds.has(co.castId) ? co.castId : null;
        if (!cid) return null;
        const frameNum = Number(co.frame);
        const endFrameNum = Number(co.endFrame);
        const timeSecNum = Number(co.timeSec);
        const atNum = Number(co.at);
        const out: BeatExpressionCue = {
          castId: cid,
          expression: normalizeExpressionId(co.expression ?? co.emotion),
        };
        if (co.frame !== undefined && Number.isFinite(frameNum) && frameNum >= 0) {
          out.frame = Math.round(frameNum);
        } else if (co.timeSec !== undefined && Number.isFinite(timeSecNum) && timeSecNum >= 0) {
          out.timeSec = Number(Math.min(18, timeSecNum).toFixed(2));
        } else if (co.at !== undefined && Number.isFinite(atNum)) {
          out.at = Number(Math.max(0, Math.min(1, atNum)).toFixed(3));
        } else if (!co.triggerPhrase) {
          out.at = 0;
        }
        if (co.endFrame !== undefined && Number.isFinite(endFrameNum) && endFrameNum >= 0) {
          out.endFrame = Math.round(endFrameNum);
        }
        if (typeof co.triggerPhrase === 'string' && co.triggerPhrase.trim()) {
          out.triggerPhrase = co.triggerPhrase.trim().slice(0, 80);
        }
        if (typeof co.reason === 'string' && co.reason.trim()) {
          out.reason = co.reason.trim().slice(0, 120);
        }
        return out;
      })
      .filter((x): x is BeatExpressionCue => x !== null);

    const actionCuesRaw = Array.isArray(item.actionCues) ? item.actionCues : [];
    const actionCues: BeatActionCue[] = actionCuesRaw
      .map((cue): BeatActionCue | null => {
        if (!cue || typeof cue !== 'object') return null;
        const co = cue as Record<string, unknown>;
        const out: BeatActionCue = {};
        const frameNum = Number(co.frame);
        const endFrameNum = Number(co.endFrame);
        const timeSecNum = Number(co.timeSec);
        const atNum = Number(co.at);
        if (co.frame !== undefined && Number.isFinite(frameNum) && frameNum >= 0) {
          out.frame = Math.round(frameNum);
        } else if (co.timeSec !== undefined && Number.isFinite(timeSecNum) && timeSecNum >= 0) {
          out.timeSec = Number(Math.min(18, timeSecNum).toFixed(2));
        } else if (co.at !== undefined && Number.isFinite(atNum)) {
          out.at = Number(Math.max(0, Math.min(1, atNum)).toFixed(3));
        }
        if (co.endFrame !== undefined && Number.isFinite(endFrameNum) && endFrameNum >= 0) {
          out.endFrame = Math.round(endFrameNum);
        }
        if (typeof co.triggerPhrase === 'string' && co.triggerPhrase.trim()) {
          out.triggerPhrase = co.triggerPhrase.trim().slice(0, 80);
        }
        if (typeof co.castId === 'string' && castIds.has(co.castId)) {
          out.castId = co.castId;
        }
        if (POSE_LIST.includes(co.pose as PoseId)) {
          out.pose = co.pose as PoseId;
        }
        if (MOTION_LIST.includes(co.motion as MotionId)) {
          out.motion = co.motion as MotionId;
        }
        if (co.cameraPunch !== undefined && Number.isFinite(Number(co.cameraPunch))) {
          const punch = Math.max(0, Math.min(1, Number(co.cameraPunch)));
          if (punch > 0) out.cameraPunch = Number(punch.toFixed(2));
        }
        if (co.propPulse !== undefined && Number.isFinite(Number(co.propPulse))) {
          const pulse = Math.max(0, Math.min(1, Number(co.propPulse)));
          if (pulse > 0) out.propPulse = Number(pulse.toFixed(2));
        }
        if (FX_LIST.includes(co.fx as FxId) && co.fx !== 'none') {
          out.fx = co.fx as FxId;
        }
        if (validSfx.has(co.sfx as SfxId) && co.sfx !== 'none') {
          out.sfx = co.sfx as SfxId;
        }
        if (typeof co.label === 'string' && co.label.trim()) {
          out.label = co.label.trim().slice(0, 60);
        }
        const hasAction = Boolean(
          out.pose || out.motion || out.cameraPunch || out.propPulse || out.fx || out.sfx
        );
        return hasAction ? out : null;
      })
      .filter((x): x is BeatActionCue => x !== null);

    let motionCard: MotionCardConfig | undefined;
    if (item.motionCard && typeof item.motionCard === 'object') {
      const mc = item.motionCard as Record<string, unknown>;
      const layout =
        mc.layout === 'hero_stat' || mc.layout === 'split_callout' || mc.layout === 'morph_bar'
          ? mc.layout
          : 'hero_stat';
      const bullets = Array.isArray(mc.bullets)
        ? mc.bullets
            .filter((b): b is string => typeof b === 'string' && b.trim().length > 0)
            .map((b) => b.trim().slice(0, 90))
            .slice(0, 4)
        : undefined;
      motionCard = {
        layout,
        ...(typeof mc.kicker === 'string' && mc.kicker.trim() ? { kicker: mc.kicker.trim().slice(0, 48) } : {}),
        ...(typeof mc.headline === 'string' && mc.headline.trim() ? { headline: mc.headline.trim().slice(0, 96) } : {}),
        ...(typeof mc.metric === 'string' && mc.metric.trim() ? { metric: mc.metric.trim().slice(0, 24) } : {}),
        ...(typeof mc.metricUnit === 'string' && mc.metricUnit.trim()
          ? { metricUnit: mc.metricUnit.trim().slice(0, 32) }
          : {}),
        ...(bullets && bullets.length > 0 ? { bullets } : {}),
        ...(typeof mc.highlightBar === 'string' && mc.highlightBar.trim()
          ? { highlightBar: mc.highlightBar.trim().slice(0, 96) }
          : {}),
        ...(typeof mc.accentColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(mc.accentColor.trim())
          ? { accentColor: mc.accentColor.trim() }
          : {}),
      };
    }

    const dur = Number(item.duration);
    const hazeNum = Number(item.haze);
    const zoomNum = Number(item.backdropZoom);
    return {
      id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `beat_${i + 1}`,
      title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : `Beat ${i + 1}`,
      duration: Number.isFinite(dur) ? Math.min(18, Math.max(1.5, dur)) : 4.0,
      frame: validFrames.has(item.frame as FrameMode) ? (item.frame as FrameMode) : 'main',
      stage: validStages.has(item.stage as StageId) ? (item.stage as StageId) : 'banyan_clearing',
      mood: validMoods.has(item.mood as MoodId) ? (item.mood as MoodId) : 'midnight_banyan',
      crowd: validCrowds.has(item.crowd as CrowdId) ? (item.crowd as CrowdId) : 'none',
      cameraMove: validCameraMoves.has(item.cameraMove as CameraMoveId)
        ? (item.cameraMove as CameraMoveId)
        : 'still',
      cameraFocusX:
        Number.isFinite(Number(item.cameraFocusX)) && Number(item.cameraFocusX) !== 0
          ? Number(Math.max(-0.45, Math.min(0.45, Number(item.cameraFocusX))).toFixed(3))
          : undefined,
      cameraFocusY:
        Number.isFinite(Number(item.cameraFocusY)) && Number(item.cameraFocusY) !== 0
          ? Number(Math.max(-0.3, Math.min(0.3, Number(item.cameraFocusY))).toFixed(3))
          : undefined,
      cameraKeyframes: (() => {
        if (!Array.isArray(item.cameraKeyframes) || item.cameraKeyframes.length === 0) return undefined;
        const parsed: CameraKeyframe[] = [];
        for (const rawKf of item.cameraKeyframes.slice(0, 12)) {
          if (!rawKf || typeof rawKf !== 'object') continue;
          const k = rawKf as Record<string, unknown>;
          const atFrac = Number(k.atFrac);
          const zoom = Number(k.zoom);
          const panX = Number(k.panX);
          const panY = Number(k.panY);
          if (!Number.isFinite(atFrac)) continue;
          const ease: CameraKeyframeEase =
            k.ease === 'linear' || k.ease === 'ease_in_out' || k.ease === 'overshoot'
              ? k.ease
              : 'ease_in_out';
          parsed.push({
            atFrac: Number(Math.max(0, Math.min(1, atFrac)).toFixed(4)),
            zoom: Number(Math.max(0.7, Math.min(2.2, Number.isFinite(zoom) ? zoom : 1)).toFixed(3)),
            panX: Number(Math.max(-0.45, Math.min(0.45, Number.isFinite(panX) ? panX : 0)).toFixed(3)),
            panY: Number(Math.max(-0.35, Math.min(0.35, Number.isFinite(panY) ? panY : 0)).toFixed(3)),
            ease,
          });
        }
        if (parsed.length === 0) return undefined;
        parsed.sort((a, b) => a.atFrac - b.atFrac);
        return parsed;
      })(),
      flipStage: item.flipStage === true ? true : undefined,
      haze: Number.isFinite(hazeNum) && hazeNum > 0 ? Math.max(0, Math.min(1, hazeNum)) : undefined,
      backdropZoom:
        Number.isFinite(zoomNum) && zoomNum > 0 ? Math.max(0.9, Math.min(1.25, zoomNum)) : undefined,
      renderStyle: validRenderStyles.has(item.renderStyle as RenderStyleId)
        ? (item.renderStyle as RenderStyleId)
        : undefined,
      weather: WEATHER_LIST.includes(item.weather as WeatherId) ? (item.weather as WeatherId) : 'fireflies',
      shot: validShots.has(item.shot as ShotId) ? (item.shot as ShotId) : 'wide_stage',
      transition: validTrans.has(item.transition as TransitionId)
        ? (item.transition as TransitionId)
        : 'hard_cut',
      lightSide: item.lightSide === 'left' ? 'left' : 'right',
      prop: validProps.has(item.prop as PropId) ? (item.prop as PropId) : 'none',
      propSlot: (['left', 'center', 'right', 'overhead'].includes(String(item.propSlot))
        ? item.propSlot
        : 'center') as StoryBeat['propSlot'],
      propAnchor: validPropAnchors.has(item.propAnchor as PropAnchorId)
        ? (item.propAnchor as PropAnchorId)
        : undefined,
      propOffsetX:
        Number.isFinite(Number(item.propOffsetX)) && Number(item.propOffsetX) !== 0
          ? Number(Math.max(-0.35, Math.min(0.35, Number(item.propOffsetX))).toFixed(3))
          : undefined,
      propOffsetY:
        Number.isFinite(Number(item.propOffsetY)) && Number(item.propOffsetY) !== 0
          ? Number(Math.max(-0.35, Math.min(0.35, Number(item.propOffsetY))).toFixed(3))
          : undefined,
      customPropDataUrl:
        typeof item.customPropDataUrl === 'string' &&
        item.customPropDataUrl.length <= 5_500_000 &&
        /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(item.customPropDataUrl)
          ? item.customPropDataUrl
          : undefined,
      customPropLabel:
        typeof item.customPropLabel === 'string' ? item.customPropLabel.slice(0, 80) : undefined,
      customPropSheet: (() => {
        if (!item.customPropSheet || typeof item.customPropSheet !== 'object') return undefined;
        const sh = item.customPropSheet as Record<string, unknown>;
        const colsRaw = Number(sh.cols);
        const rowsRaw = Number(sh.rows);
        const fcRaw = Number(sh.frameCount);
        const fpsRaw = Number(sh.fps);
        if (!Number.isFinite(colsRaw) || !Number.isFinite(rowsRaw)) return undefined;
        const cols = Math.max(1, Math.min(16, Math.round(colsRaw)));
        const rows = Math.max(1, Math.min(16, Math.round(rowsRaw)));
        const maxCells = Math.min(256, cols * rows);
        const frameCount = Number.isFinite(fcRaw)
          ? Math.max(1, Math.min(maxCells, Math.round(fcRaw)))
          : maxCells;
        const fps = Number.isFinite(fpsRaw)
          ? Math.max(2, Math.min(30, Math.round(fpsRaw)))
          : 12;
        const loop = typeof sh.loop === 'boolean' ? sh.loop : true;
        return { cols, rows, frameCount, fps, loop };
      })(),
      customBackdropDataUrl:
        typeof item.customBackdropDataUrl === 'string' &&
        item.customBackdropDataUrl.length <= 5_500_000 &&
        /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(item.customBackdropDataUrl)
          ? item.customBackdropDataUrl
          : undefined,
      customBackdropLabel:
        typeof item.customBackdropLabel === 'string'
          ? item.customBackdropLabel.slice(0, 80)
          : undefined,
      fx: FX_LIST.includes(item.fx as FxId) ? (item.fx as FxId) : 'none',
      sfx: validSfx.has(item.sfx as SfxId) ? (item.sfx as SfxId) : 'none',
      sfxOffsetSec:
        Number.isFinite(Number(item.sfxOffsetSec)) && Number(item.sfxOffsetSec) >= 0
          ? Number(Math.min(16, Math.max(0, Number(item.sfxOffsetSec))).toFixed(2))
          : undefined,
      audioLeadSec:
        Number.isFinite(Number(item.audioLeadSec)) && Math.abs(Number(item.audioLeadSec)) >= 0.02
          ? Number(Math.max(-0.6, Math.min(0.6, Number(item.audioLeadSec))).toFixed(2))
          : undefined,
      ambience: validAmbience.has(item.ambience as AmbienceId)
        ? (item.ambience as AmbienceId)
        : undefined,
      raag: validRaags.has(item.raag as RaagId) ? (item.raag as RaagId) : 'bhairavi',
      musicEnergy: Number.isFinite(Number(item.musicEnergy))
        ? Math.min(1, Math.max(0.1, Number(item.musicEnergy)))
        : 0.65,
      actors:
        actors.length > 0
          ? actors
          : [{ castId: cast[0].id, slot: 'center', pose: 'stand', expression: 'calm', facing: 'right', motion: 'still' }],
      ...(expressionCues.length > 0 ? { expressionCues } : {}),
      ...(actionCues.length > 0 ? { actionCues } : {}),
      ...(motionCard ? { motionCard } : {}),
      ...(() => {
        if (!item.locationCard || typeof item.locationCard !== 'object') return {};
        const lc = item.locationCard as Record<string, unknown>;
        const title = typeof lc.title === 'string' ? lc.title.trim().slice(0, 80) : '';
        if (!title) return {};
        const subtitle =
          typeof lc.subtitle === 'string' && lc.subtitle.trim().length > 0
            ? lc.subtitle.trim().slice(0, 90)
            : undefined;
        const position: LocationCardPosition | undefined =
          lc.position === 'top_left' || lc.position === 'bottom_left' || lc.position === 'top_right'
            ? lc.position
            : undefined;
        const style: LocationCardStyle | undefined =
          lc.style === 'cinematic_bar' || lc.style === 'scroll_ribbon' || lc.style === 'minimal_tag'
            ? lc.style
            : undefined;
        const locationCard: LocationCardConfig = {
          title,
          ...(subtitle ? { subtitle } : {}),
          ...(position ? { position } : {}),
          ...(style ? { style } : {}),
        };
        return { locationCard };
      })(),
      speakerId: typeof item.speakerId === 'string' ? item.speakerId : 'narrator',
      speakerLabel: typeof item.speakerLabel === 'string' ? item.speakerLabel : 'Narrator',
      dialogue: typeof item.dialogue === 'string' ? item.dialogue : '',
    };
  });

  const validShelves: StorybookShelf[] = [
    'Modern Multi-Genre Showcases',
    'Supernatural & Royal Legends',
    'Animal Fables & Strategy',
    'Royal Court Wit & Satire',
    'Sacred Epics & Puranas',
    'Western Folklore & Fables',
    'East Asian Tales & Epics',
    'Southeast Asian Folklore',
    'Americas & Indigenous Legends',
    'African Griot & Trickster Tales',
  ];
  const shelf = validShelves.includes(obj.shelf as StorybookShelf)
    ? (obj.shelf as StorybookShelf)
    : undefined;

  let visualStyle: Partial<EpisodeVisualStyle> | undefined;
  if (obj.visualStyle && typeof obj.visualStyle === 'object') {
    const vs = obj.visualStyle as Record<string, unknown>;
    visualStyle = {
      renderStyle: validRenderStyles.has(vs.renderStyle as RenderStyleId)
        ? (vs.renderStyle as RenderStyleId)
        : undefined,
      lookPreset: validLookPresets.has(vs.lookPreset as LookPresetId)
        ? (vs.lookPreset as LookPresetId)
        : undefined,
      colorGrade: validGrades.has(vs.colorGrade as ColorGradeId)
        ? (vs.colorGrade as ColorGradeId)
        : undefined,
      texture: validTextures.has(vs.texture as SurfaceTextureId)
        ? (vs.texture as SurfaceTextureId)
        : undefined,
      shadowContrast: Number.isFinite(Number(vs.shadowContrast))
        ? Math.max(0.6, Math.min(1.4, Number(vs.shadowContrast)))
        : undefined,
      inkWeight: Number.isFinite(Number(vs.inkWeight))
        ? Math.max(0.7, Math.min(1.5, Number(vs.inkWeight)))
        : undefined,
      rimLight: validRimLights.has(vs.rimLight as RimLightId)
        ? (vs.rimLight as RimLightId)
        : undefined,
      captionStyle: validCaptionStyles.has(vs.captionStyle as CaptionStyleId)
        ? (vs.captionStyle as CaptionStyleId)
        : undefined,
      frameBorder: validFrameBorders.has(vs.frameBorder as FrameBorderId)
        ? (vs.frameBorder as FrameBorderId)
        : undefined,
      vignette: Number.isFinite(Number(vs.vignette))
        ? Math.max(0, Math.min(1, Number(vs.vignette)))
        : undefined,
      motionCadence:
        vs.motionCadence === 'auto' ||
        vs.motionCadence === '60fps' ||
        vs.motionCadence === '24fps' ||
        vs.motionCadence === '12fps'
          ? (vs.motionCadence as MotionCadenceId)
          : undefined,
      motionProfile:
        vs.motionProfile === 'auto' ||
        vs.motionProfile === 'cinematic_drama' ||
        vs.motionProfile === 'naturalistic' ||
        vs.motionProfile === 'snappy_cartoon' ||
        vs.motionProfile === 'motion_graphics'
          ? (vs.motionProfile as MotionProfileId)
          : undefined,
      postFxPass:
        vs.postFxPass === 'none' ||
        vs.postFxPass === 'bayer_dither' ||
        vs.postFxPass === 'pixel_grid_16bit' ||
        vs.postFxPass === 'crisp_outline' ||
        vs.postFxPass === 'chromatic_pop' ||
        vs.postFxPass === 'halftone_zine'
          ? (vs.postFxPass as PostFxPassId)
          : undefined,
      expressionsEnabled:
        typeof vs.expressionsEnabled === 'boolean' ? vs.expressionsEnabled : undefined,
      karaokeCaptions:
        typeof vs.karaokeCaptions === 'boolean' ? vs.karaokeCaptions : undefined,
      autoTrackSpeaker:
        typeof vs.autoTrackSpeaker === 'boolean' ? vs.autoTrackSpeaker : undefined,
      depthOfField:
        typeof vs.depthOfField === 'number' && Number.isFinite(vs.depthOfField)
          ? Math.max(0, Math.min(1, vs.depthOfField))
          : undefined,
      lightShafts:
        typeof vs.lightShafts === 'number' && Number.isFinite(vs.lightShafts)
          ? Math.max(0, Math.min(1, vs.lightShafts))
          : undefined,
      spatialAudio:
        typeof vs.spatialAudio === 'boolean' ? vs.spatialAudio : undefined,
      hitstopEnabled:
        typeof vs.hitstopEnabled === 'boolean' ? vs.hitstopEnabled : undefined,
      foregroundFraming:
        typeof vs.foregroundFraming === 'number' && Number.isFinite(vs.foregroundFraming)
          ? Math.max(0, Math.min(1, vs.foregroundFraming))
          : undefined,
      vfxIntensity:
        typeof vs.vfxIntensity === 'number' && Number.isFinite(vs.vfxIntensity)
          ? Math.max(0, Math.min(1, vs.vfxIntensity))
          : undefined,
      tiltShiftAmount:
        typeof vs.tiltShiftAmount === 'number' && Number.isFinite(vs.tiltShiftAmount)
          ? Math.max(0, Math.min(1, vs.tiltShiftAmount))
          : undefined,
    };
  }

  const language =
    typeof obj.language === 'string' && /^[a-z]{2}(?:-[A-Za-z]{2})?$/.test(obj.language.trim())
      ? obj.language.trim().toLowerCase()
      : undefined;

  return {
    ok: true,
    script: {
      id: typeof obj.id === 'string' ? obj.id : 'custom_episode',
      ...(language ? { language } : {}),
      series: typeof obj.series === 'string' ? obj.series : 'Indian Folklore',
      shelf,
      title: typeof obj.title === 'string' ? obj.title : 'Untitled Story',
      subtitle: typeof obj.subtitle === 'string' ? obj.subtitle : '',
      defaultRaag: validRaags.has(obj.defaultRaag as RaagId) ? (obj.defaultRaag as RaagId) : 'bhairavi',
      visualStyle,
      cast,
      beats,
    },
  };
}
