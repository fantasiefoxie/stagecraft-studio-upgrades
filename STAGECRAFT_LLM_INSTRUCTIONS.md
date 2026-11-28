# Stagecraft Studio — Master LLM Episode & Character Authoring Instructions

> **Auto-Generated Living Document** · Catalog Fingerprint: `eec2ee463dfa4c76`  
> Sync command: `npm run sync-docs` · Drift audit: `npm run sync-docs -- --check` (enforced by Test 61).

---

## 1. Mission & Non-Negotiable Determinism Rules
- Output **strict, valid JSON** conforming to `EpisodeScript` (or Lite Storyboard JSON for fast multi-genre drafting).
- Every visual element renders deterministically across all **20 Art Engines** (`RenderStyleId`) in both `16:9` and `9:16`.
- Never invent unregistered enum IDs—use only the live catalog IDs listed below.
- Keep dialogue crisp (**8–22 words**, `<= 145 chars`, `<= 3.8 words/sec`) so kinetic captions never cover faces.
- Separate every cast silhouette with distinct `archetype`, `primaryColor`, and optional `dna` (headwear, outerwear, eyewear, face/body marks, and back gear).

## 2. Live World Catalogs (Auto-Synced)
- **Art Engines (20)**: `chiaroscuro`, `lineless_vector`, `anime_cel`, `gouache_storybook`, `risograph_print`, `felt_puppet`, `papercraft_diorama`, `backlit_sand`, `woodblock_print`, `shadow_puppetry`, `manga_screentone`, `scratchboard_noir`, `blueprint_technical`, `neon_cybernoir`, `byzantine_mosaic`, `stained_glass`, `sumi_e_wash`, `greek_amphora`, `kente_tapestry`, `illuminated_codex`
- **Cast Archetypes (160)**: `deva`, `goddess`, `demon_king`, `vanara_hero`, `spirit`, `yaksha`, `statue_apsara`, `king`, `emperor`, `queen`, `sage`, `courtier`, `warrior`, `ascetic`, `merchant`, `child`, `elder_woman`, `guard`, `monkey`, `lion`, `tiger`, `bull`, `hare`, `jackal`, `serpent`, `elephant`, `deer`, `crow`, `crane`, `crocodile`, `tortoise`, `owl`, `mouse`, `dog`, `fox`, `wolf`, `spider`, `knight`, `samurai`, `raven`, `detective`, `scientist`, `astronaut`, `cyber_hacker`, `android`, `mech_pilot`, `journalist`, `street_musician`, `cat_mascot`, `robot_companion`, `wizard`, `pirate_captain`, `ninja`, `viking`, `pharaoh`, `vampire_lord`, `dragon_kin`, `elf_archer`, `dwarf_smith`, `ghost_phantom`, `zeus_thunderer`, `athena_strategist`, `anubis_guardian`, `valkyrie_shieldmaiden`, `kitsune_foxspirit`, `sun_wukong_trickster`, `quetzal_priest`, `celtic_druid`, `djinn_genie`, `poseidon_tideking`, `roman_centurion`, `spartan_hoplite`, `renaissance_painter`, `victorian_inventor`, `wild_west_sheriff`, `outlaw_bandit`, `feudal_shogun`, `maratha_commander`, `silk_road_nomad`, `caveman_hunter`, `doctor_surgeon`, `firefighter_rescuer`, `police_officer`, `judge_magistrate`, `lawyer_advocate`, `school_teacher`, `chef_culinary`, `delivery_courier`, `construction_engineer`, `farmer_grower`, `ceo_founder`, `podcast_host`, `news_anchor`, `stock_trader`, `tech_developer`, `influencer_vlogger`, `historian_professor`, `coach_mentor`, `film_director`, `esports_gamer`, `bounty_hunter`, `alien_diplomat`, `cyborg_enforcer`, `time_traveler`, `space_admiral`, `drone_operator`, `bio_geneticist`, `wasteland_scavenger`, `quantum_physicist`, `ai_hologram`, `paladin_crusader`, `necromancer_mage`, `alchemist_brewer`, `shadow_rogue`, `tavern_bard`, `beast_ranger`, `archmage_oracle`, `goblin_tinkerer`, `orc_warlord`, `celestial_angel`, `werewolf_stalker`, `plague_doctor`, `mummy_sovereign`, `witch_herbalist`, `grim_reaper`, `gargoyle_sentinel`, `banshee_wraith`, `mad_scientist`, `occult_investigator`, `pumpkin_scarecrow`, `trex_dinosaur`, `triceratops_dino`, `grizzly_bear`, `polar_penguin`, `giant_panda`, `bald_eagle`, `silverback_gorilla`, `desert_camel`, `great_white_shark`, `giant_octopus`, `fire_phoenix`, `frost_unicorn`, `winged_griffin`, `sea_mermaid`, `sky_pegasus`, `forest_treant`, `stone_golem`, `crystal_slime`, `baby_dragon`, `clockwork_automaton`, `soccer_striker`, `cricket_batter`, `martial_artist`, `circus_ringmaster`, `stage_magician`, `orchestra_conductor`, `ballet_dancer`, `skateboard_kid`, `explorer_scout`, `toy_nutcracker`
- **Stage Backdrops (150)**: `banyan_clearing`, `royal_durbar`, `mughal_courtyard`, `ashoka_vatika`, `golden_lanka`, `kali_temple`, `throne_mound`, `moonlit_terrace`, `royal_bedchamber`, `palace_garden`, `river_ghat`, `enchanted_lake`, `bamboo_forest`, `cave_den`, `ocean_ship`, `bazaar_lane`, `courtyard_well`, `royal_dungeon`, `desert_caravan`, `himalayan_hermitage`, `cloud_skies`, `kurukshetra_field`, `village_chowk`, `cremation_ground`, `olympus_acropolis`, `bamboo_pagoda`, `enchanted_cottage`, `savanna_baobab`, `red_canyon_mesa`, `tropical_archipelago`, `neon_cyber_alley`, `orbital_starship_bridge`, `mars_colony_dome`, `noir_rainy_street`, `modern_news_studio`, `cozy_bookshop_cafe`, `high_tech_lab`, `courtroom_hall`, `ancient_egypt_temple`, `roman_colosseum`, `nordic_fjord_hall`, `gothic_cathedral`, `steampunk_clocktower`, `pirate_galleon_deck`, `underwater_atlantis`, `volcanic_citadel`, `snowy_mountain_pass`, `cherry_blossom_shrine`, `vintage_train_car`, `astral_observatory`, `babylon_hanging_gardens`, `mayan_step_pyramid`, `stonehenge_circle`, `great_wall_watchtower`, `angkor_jungle_ruins`, `petra_canyon_temple`, `spartan_mountain_pass`, `persian_rose_palace`, `vedic_gurukul`, `tibetan_monastery`, `wild_west_saloon`, `victorian_fog_alley`, `renaissance_plaza`, `medieval_castle_keep`, `medieval_tavern_inn`, `roaring_twenties_jazz`, `ancient_silk_caravanserai`, `viking_longship_fjord`, `feudal_dojo_hall`, `industrial_foundry`, `downtown_skyline_roof`, `subway_metro_platform`, `busy_crosswalk_plaza`, `suburban_cul_de_sac`, `neon_arcade_hall`, `airport_departure_gate`, `highway_overpass_night`, `harbor_container_dock`, `rooftop_helipad`, `public_park_fountain`, `startup_war_room`, `stock_exchange_floor`, `hospital_operating_room`, `university_lecture_hall`, `elementary_classroom`, `podcast_recording_booth`, `restaurant_open_kitchen`, `science_cleanroom`, `police_precinct_desk`, `city_library_atrium`, `luxury_penthouse_lounge`, `warm_family_livingroom`, `attic_inventor_workshop`, `art_gallery_hall`, `grand_opera_theater`, `cozy_bakery_counter`, `greenhouse_conservatory`, `museum_dinosaur_hall`, `fitness_boxing_gym`, `retro_diner_booth`, `orbital_space_station`, `alien_bioluminescent_forest`, `dyson_sphere_vista`, `cyber_megamall_atrium`, `mech_hangar_bay`, `vr_cyberspace_grid`, `post_apoc_ruined_highway`, `underground_fallout_bunker`, `solarpunk_sky_garden`, `quantum_collider_chamber`, `floating_sky_citadel`, `wizard_arcane_tower`, `dragon_hoard_cavern`, `elven_canopy_city`, `dwarven_forge_hall`, `enchanted_mushroom_grove`, `crystal_prism_cave`, `alchemist_apothecary`, `fairy_glade_bridge`, `cloud_coliseum`, `haunted_manor_foyer`, `misty_graveyard_gates`, `abandoned_asylum_ward`, `lighthouse_storm_cliff`, `underground_catacombs`, `detective_noir_office`, `locked_bank_vault`, `foggy_london_pier`, `cursed_carnival_tent`, `prison_cellblock`, `coral_reef_lagoon`, `amazon_rainforest_canopy`, `arctic_glacier_icebergs`, `african_sunset_savanna`, `grand_canyon_overlook`, `jurassic_fern_valley`, `sahara_starlit_dunes`, `alpine_meadow_lake`, `bioluminescent_sea_cave`, `autumn_maple_river`, `floodlit_cricket_stadium`, `championship_soccer_pitch`, `racing_circuit_paddock`, `cruise_liner_promenade`, `hot_air_balloon_skies`, `treehouse_clubhouse`, `giant_toybox_playroom`, `circus_big_top_ring`, `amusement_ferris_boardwalk`, `candy_kingdom_bridge`
- **Story Props (185: 184 + `none`)**: `khanda_sword`, `bow_arrow`, `gada_mace`, `sudarshana_chakra`, `trishul`, `sanjevani_mountain`, `signet_ring`, `stone_well`, `wooden_cage`, `flying_stick`, `royal_palanquin`, `poison_chalice`, `golden_egg`, `hand_mirror`, `saffron_feast`, `seven_mattresses`, `lotus_petal`, `diya_lamp`, `treasure_chest`, `royal_scroll`, `kali_idol`, `magic_chariot`, `earthen_pot`, `sacred_fire`, `banyan_bough`, `peacock_throne`, `gold_bangle`, `hanging_khichdi_pot`, `golden_statue`, `lotus_pond`, `measuring_stake`, `wooden_garuda`, `royal_scales`, `conch_shell`, `story_box`, `magic_staff`, `golden_fleece`, `sun_orb`, `magic_peach`, `kris_dagger`, `magnifying_glass`, `holo_tablet`, `energy_blade`, `neon_drone`, `vintage_camera`, `microphone_stand`, `briefcase`, `newspaper_frontpage`, `coffee_mug`, `laptop_screen`, `potion_flask`, `spellbook_tome`, `wizard_staff`, `crystal_amulet`, `brass_compass`, `antique_pocketwatch`, `violin_bow`, `electric_guitar`, `golden_trophy`, `judge_gavel`, `microscope`, `rocket_model`, `pirate_map`, `key_ornate`, `katana_blade`, `viking_battleaxe`, `knight_shield`, `crossbow_bolts`, `spear_halberd`, `flintlock_pistol`, `laser_rifle`, `plasma_cannon`, `shuriken_star`, `war_hammer`, `roman_gladius`, `grappling_hook`, `crystal_ball`, `runestone_tablet`, `phoenix_feather`, `dragon_egg`, `enchanted_chalice`, `grimoire_chained`, `hourglass_sands`, `astral_orrery`, `voodoo_totem`, `magic_carpet`, `genie_lamp`, `crown_jeweled`, `smartphone_glow`, `vr_headset`, `cyber_deck`, `server_rack`, `ai_core_cube`, `dna_helix_vial`, `sat_dish_mini`, `jetpack_thruster`, `teleport_pad`, `mech_battery`, `radar_scanner`, `hologram_globe`, `gold_bullion_bars`, `stock_chart_board`, `studio_camera_rig`, `clapperboard_slate`, `podcast_mic_arm`, `whiteboard_diagram`, `stack_of_cash`, `credit_card_gold`, `contract_dossier`, `megaphone_bullhorn`, `press_badge`, `trophy_cup_silver`, `stethoscope_med`, `beaker_bubbling`, `telescope_brass`, `globe_terrestrial`, `skeleton_model`, `first_aid_kit`, `syringe_serum`, `x_ray_lightbox`, `chalkboard_equations`, `atom_model`, `geiger_counter`, `fossil_ammonite`, `sitar_instrument`, `tabla_drums`, `grand_piano_mini`, `paintbrush_palette`, `movie_projector`, `vinyl_turntable`, `dj_mixer_deck`, `theater_masks`, `origami_crane`, `calligraphy_brush`, `bamboo_flute`, `war_horn_brass`, `steaming_ramen_bowl`, `royal_thali_platter`, `birthday_cake_lit`, `pizza_slice_box`, `teapot_porcelain`, `spice_jar_rack`, `fruit_basket`, `campfire_kettle`, `goblet_wine`, `honey_jar`, `bread_loaf_basket`, `ice_cream_cone`, `vintage_suitcase`, `treasure_map_tube`, `ship_wheel_helm`, `hot_air_basket`, `bicycle_classic`, `motorcycle_helmet`, `astronaut_helmet`, `anchor_iron`, `lantern_storm`, `boarding_pass`, `binoculars_field`, `tent_camping`, `handcuffs_steel`, `evidence_bag`, `fingerprint_card`, `crime_tape_roll`, `revolver_noir`, `safe_dial_door`, `red_string_board`, `secret_envelope`, `skeleton_key_ring`, `poison_vial_green`, `candle_candelabra`, `skull_relic`, `cricket_bat_ball`, `soccer_ball_classic`, `boxing_gloves`, `chess_board_set`, `rubber_ducky`, `teddy_bear`, `kite_diamond`, `gift_box_ribbon`, `skateboard_deck`, `watering_can`, `hammer_wrench`, `stopwatch_sport`
- **Lighting Moods (40)**: `midnight_banyan`, `crimson_wrath`, `golden_durbar`, `sandstone_dusk`, `twilight_temple`, `moonlit_marble`, `emerald_jungle`, `mystic_teal`, `cyber_magenta`, `noir_monochrome`, `arctic_aurora`, `sunlit_morning`, `volcanic_inferno`, `deep_abyss`, `sakura_dawn`, `sepia_archive`, `golden_hour_cinema`, `neon_tokyo_blue`, `pastel_storybook`, `desert_mirage`, `toxic_wasteland`, `lavender_twilight`, `cobalt_midnight`, `autumn_amber`, `spring_meadow`, `blood_moon_crimson`, `ice_palace_cyan`, `vintage_kodachrome`, `emerald_matrix`, `royal_amethyst`, `storm_slate`, `sunset_coral`, `candyland_pop`, `deep_space_void`, `copper_steampunk`, `candlelit_parchment`, `ocean_turquoise`, `monsoon_indigo`, `solarpunk_lime`, `obsidian_gold`
- **Weather Systems (30)**: `fireflies`, `embers`, `rain`, `mist`, `petals`, `none`, `snow`, `lightning_storm`, `sandstorm`, `starfall`, `sakura_blossoms`, `data_matrix`, `autumn_leaves`, `floating_lanterns`, `underwater_bubbles`, `confetti_shower`, `ash_fallout`, `acid_rain`, `aurora_ribbons`, `dandelion_seeds`, `meteor_shower`, `neon_sparks`, `golden_pollen`, `plasma_arcs`, `hailstorm`, `blizzard_gale`, `fog_bank`, `locust_swarm`, `volcanic_cinders`, `starlight_dust`
- **Crowd Layers (30)**: `none`, `courtiers`, `villagers`, `army`, `forest_herd`, `monks`, `city_commuters`, `cyber_drones`, `pirate_crew`, `scholars_hall`, `spectral_flock`, `masquerade_ball`, `stadium_fans`, `festival_dancers`, `bazaar_merchants`, `press_paparazzi`, `protest_rally`, `mech_squadron`, `fairy_wisps`, `undead_horde`, `safari_herd`, `ballroom_waltz`, `courtroom_gallery`, `orchestra_pit`, `space_dock_crew`, `tavern_patrons`, `school_hallway`, `roman_legion`, `ninja_clan`, `circus_audience`
- **Kinetic Beat FX (36)**: `none`, `shock_burst`, `question_mark`, `smear_swoop`, `crimson_impact`, `divine_aura`, `speed_lines`, `magic_runes`, `glitch_tear`, `sparkle_burst`, `spotlight_beam`, `shatter_glass`, `heartbeat_pulse`, `comic_pow`, `anime_impact_frame`, `chromatic_split`, `lens_flare_sweep`, `portal_vortex`, `time_freeze_ripple`, `sonic_boom_rings`, `ink_splatter_burst`, `holographic_scan`, `lightning_web`, `petal_cyclone`, `fire_breath_cone`, `frost_crystallize`, `shadow_tendrils`, `golden_halo_burst`, `crt_scan_flash`, `blood_moon_eclipse`, `laser_grid`, `starlight_nova`, `comic_speed_zoom`, `water_splash_arc`, `dust_shockwave`, `radar_ping`
- **Transitions (6)**: `hard_cut`, `diagonal_slash`, `crimson_flash`, `silhouette_wipe`, `ink_fade`, `popup_fold`
- **Procedural SFX (10)**: `none`, `temple_bell`, `shankha_conch`, `sword_clash`, `thunder_crack`, `arrow_whoosh`, `mystic_chime`, `court_gasp`, `wooden_gavel`, `fire_crackle`
- **Music Raag / World Engines (13)**: `bhairavi`, `yaman`, `marwa`, `darbari`, `bhoopali`, `malkauns`, `desh`, `greek_lyre`, `medieval_lute`, `guqin_bamboo`, `gamelan_wayang`, `cedar_flute`, `kora_griot`
- **Shot Framings (9)**: `wide_stage`, `two_shot`, `closeup_left`, `closeup_right`, `split_faceoff`, `eye_strip`, `low_angle_swoop`, `prop_spotlight`, `motion_card`
- **Actor Poses (9)**: `stand`, `walk`, `sit`, `kneel`, `recoil`, `gesture`, `hang_upside_down`, `soar`, `attack`
- **FACS Expressions (10)**: `calm`, `warm`, `joy`, `curious`, `awe`, `sly`, `shocked`, `grief`, `stern`, `angry`
- **Motion Cadences (4)**: `auto`, `60fps`, `24fps`, `12fps`
- **12-Principles Motion Profiles (5)**: `auto`, `cinematic_drama`, `naturalistic`, `snappy_cartoon`, `motion_graphics`
- **Post-FX Passes (6)**: `none`, `bayer_dither`, `pixel_grid_16bit`, `crisp_outline`, `chromatic_pop`, `halftone_zine`
- **Caption Styles (6)**: `classic_cinema`, `gold_manuscript`, `shorts_bold_pop`, `minimal_clean`, `comic_speech_pop`, `minimal_editorial`
- **Character Acting Macros (12)**: `dramatic_realization`, `sword_draw_clash`, `whispered_conspiracy`, `shocked_recoil`, `triumphant_proclamation`, `sly_scheme`, `solemn_bow`, `sudden_ambush`, `mystic_invocation`, `courtroom_verdict`, `heartfelt_plea`, `comic_double_take`
- **Curated CharacterDNA Sprite Presets (192)**: `preset_senior_detective`, `preset_lab_scientist`, `preset_broadcast_anchor`, `preset_indie_musician`, `preset_explainer_host`, `preset_bookshop_curator`, `preset_orbital_astronaut`, `preset_neon_hacker`, `preset_android_envoy`, `preset_mech_pilot`, `preset_starship_captain`, `preset_holo_scout_bot`, `preset_arcane_archmage`, `preset_elven_ranger`, `preset_forge_dwarf`, `preset_crimson_dragonkin`, `preset_shadow_shinobi`, `preset_vampire_count`, `preset_golden_pharaoh`, `preset_nordic_jarl`, `preset_corsair_captain`, `preset_samurai_ronin`, `preset_sun_sovereign`, `preset_raincoat_gumshoe`, `preset_midnight_informant`, `preset_spectral_phantom`, `preset_masquerade_duchess`, `preset_studio_cat_mascot`, `preset_buddy_bot`, `preset_kitsune_trickster`, `preset_celestial_owl`, `preset_thunder_wolf`, `w5_zeus_olympus`, `w5_athena_aegis`, `w5_anubis_scales`, `w5_valkyrie_freyja`, `w5_kitsune_inari`, `w5_sun_wukong`, `w5_quetzal_sun`, `w5_celtic_taliesin`, `w5_djinn_marid`, `w5_poseidon_reef`, `w5_apollo_lyre`, `w5_artemis_moon`, `w5_thor_mjolnir`, `w5_ra_horizon`, `w5_amaterasu_dawn`, `w5_roman_maximus`, `w5_spartan_leonidas`, `w5_leonardo_artist`, `w5_victorian_ada`, `w5_sheriff_wyatt`, `w5_outlaw_jesse`, `w5_shogun_ieyasu`, `w5_maratha_sardar`, `w5_silk_road_tariq`, `w5_caveman_korg`, `w5_jazz_singer`, `w5_musketeer_art`, `w5_highland_clan`, `w5_deep_diver`, `w5_empress_wu`, `w5_dr_chen`, `w5_fire_chief`, `w5_officer_patel`, `w5_judge_sterling`, `w5_attorney_priya`, `w5_prof_claire`, `w5_chef_marco`, `w5_courier_kai`, `w5_engineer_omar`, `w5_farmer_hannah`, `w5_ceo_devon`, `w5_podcast_leo`, `w5_anchor_sofia`, `w5_trader_max`, `w5_dev_meera`, `w5_vlogger_zoe`, `w5_historian_arthur`, `w5_coach_ray`, `w5_esports_nova`, `w5_nurse_lin`, `w5_chef_amara`, `w5_climate_sci`, `w5_startup_cofounder`, `w5_art_curator`, `w5_wildlife_host`, `w5_economics_host`, `w5_indie_chef`, `w5_bounty_mando`, `w5_alien_envoy`, `w5_cyborg_valkyrie`, `w5_chrononaut`, `w5_admiral_vance`, `w5_drone_ace`, `w5_biogen_maya`, `w5_wasteland_jax`, `w5_quantum_niels`, `w5_ai_aria`, `w5_exo_marine`, `w5_cyber_ronin`, `w5_solarpunk_botanist`, `w5_deep_sea_scout`, `w5_paladin_solaris`, `w5_necro_malakor`, `w5_alchemist_pip`, `w5_rogue_nyx`, `w5_bard_lyra`, `w5_ranger_thorn`, `w5_archmage_veyra`, `w5_goblin_zog`, `w5_orc_grom`, `w5_angel_seraphina`, `w5_dragon_knight`, `w5_elf_queen`, `w5_dwarf_king`, `w5_fey_monarch`, `w5_werewolf_fenris`, `w5_plague_corvus`, `w5_mummy_imhotep`, `w5_witch_morgana`, `w5_reaper_thanatos`, `w5_gargoyle_granite`, `w5_banshee_aisling`, `w5_mad_dr_victor`, `w5_occult_vanhelsing`, `w5_pumpkin_jack`, `w5_countess_carmilla`, `w5_phantom_opera`, `w5_swamp_alchemist`, `w5_cursed_captain`, `w5_trex_rex`, `w5_tricera_horn`, `w5_grizzly_koda`, `w5_penguin_pippin`, `w5_panda_bao`, `w5_eagle_aquila`, `w5_gorilla_kongo`, `w5_camel_sahara`, `w5_shark_mako`, `w5_octopus_kraken`, `w5_snow_leopard`, `w5_arctic_fox`, `w5_savanna_lioness`, `w5_phoenix_ignis`, `w5_unicorn_glacier`, `w5_griffin_aerie`, `w5_mermaid_nerissa`, `w5_pegasus_zephyr`, `w5_treant_elderbark`, `w5_golem_obsidian`, `w5_slime_prism`, `w5_baby_dragon`, `w5_clockwork_bot`, `w5_astro_cat`, `w5_studio_bot`, `w5_soccer_mateo`, `w5_cricket_aarav`, `w5_martial_ren`, `w5_ringmaster_barnum`, `w5_magician_houdini`, `w5_conductor_clara`, `w5_ballet_anastasia`, `w5_skater_ollie`, `w5_scout_sam`, `w5_toy_nutcracker`, `w5_boxer_ali`, `w5_racer_val`, `w5_candy_princess`, `w5_jr_astronaut`, `w5_tenali_wit`, `w5_birbal_court`, `w5_anansi_weaver`, `w5_scheherazade`, `w5_robin_sherwood`, `w5_mulan_general`, `w5_sinbad_voyager`, `w5_baba_yaga`, `w5_king_arthur`, `w5_merlin_amber`, `w5_cleopatra_nile`, `w5_griot_sundiata`, `w5_noir_sam_spade`, `w5_noir_femme_fatale`, `w5_noir_inspector`, `w5_noir_heist_queen`, `w5_noir_reporter`, `w5_noir_mob_boss`, `w5_noir_forensic`, `w5_noir_safecracker`, `w5_noir_cryptographer`, `w5_noir_clockmaker`

## 3. Cinematic Direction & Visual Craft Levers (Waves 4–6)
- `visualStyle.vfxIntensity` (`0..1`, default `0.75`): controls Effekseer-inspired analytical 2D ribbons, particles, rings, and pooled shockwave refraction.
- `visualStyle.tiltShiftAmount` (`0..1`, default `0`, auto `0.55` in `papercraft_diorama`): miniature macro tilt-shift focus band.
- `beat.transition: "popup_fold"`: cardstock horizon hinge fold + staggered spring-hinge pop-up entrance with procedural paper foley.
- `visualStyle.hitstopEnabled: true`: deterministic 2–4 frame strike freeze + shockwave ring.
- `visualStyle.depthOfField`, `visualStyle.lightShafts`, `visualStyle.foregroundFraming`, `visualStyle.spatialAudio`.
- Per-beat `audioLeadSec` (`-0.6..+0.6`), `cameraKeyframes`, `actionCues`, `expressionCues`, `locationCard`, `customPropSheet`.

## 4. Cast Member Schema & Natural-Language `traits` Auto-Mapping
Every entry in `episode.cast[]` accepts either:
1. A base `archetype` + `primaryColor` + `accentColor` (with optional `traits` string parsed deterministically via `parseNaturalLanguageDnaTraits` into eyewear, outerwear, scars, tattoos, fangs, back gear, headwear, etc.), **OR**
2. An explicit modular `dna` object (`CharacterDNA`, `version: 1`) for Sims-grade precision.

## 5. CharacterDNA Anatomy & Wave 7 Sims-Grade Customization
### 5.1 Chassis & Body Morphs
- **Chassis (6)**: `humanoid`, `quadruped`, `avian`, `serpentine`, `arachnid`, `ethereal`
- **Gait (8)**: `auto`, `regal`, `martial`, `folk`, `predator`, `agile`, `heavy`, `ethereal`
- **Body Morphs (`dna.morph`)**: `height` (`0.72..1.32`), `shoulderWidth` (`0.72..1.38`), `torsoBulk` (`0.72..1.38`), `headRatio` (`0.8..1.28`), `limbLength` (`0.78..1.28`), `posture` (`-0.25..0.25`).

### 5.2 Head, Hair, Facial Hair & Appendages
- **Head Shapes (15)**: `chiseled`, `oval`, `round`, `angular`, `gaunt`, `broad_jaw`, `canine_snout`, `feline_muzzle`, `equine_snout`, `elephant_trunk`, `croc_snout`, `curved_beak`, `raptor_beak`, `serpent_hood`, `arachnid_mandible`
- **Eye Geometry (8)**: `almond`, `wide_fable`, `narrow_sharp`, `heavy_lidded`, `glowing_orb`, `slit_reptile`, `owl_disc`, `multi_eyes`
- **Nose / Snout / Beak (6)**: `classic`, `aquiline`, `button`, `broad`, `snout_bridge`, `none`
- **Ears (9)**: `human`, `pointed_elf`, `fox_tall`, `lion_round`, `elephant_fan`, `hare_long`, `cow_side`, `fin_frill`, `none`
- **Horns / Antlers (7)**: `none`, `curved_ram`, `bull_horns`, `deer_antlers`, `demon_crown_horns`, `unicorn_spire`, `oni_twin`
- **Wings (7)**: `none`, `feathered_angel`, `raven_dark`, `bat_demon`, `butterfly_fey`, `dragon_leathery`, `celestial_flame`
- **Tails (8)**: `none`, `monkey_curled`, `fox_bushy`, `lion_tufted`, `dragon_spiked`, `peacock_fan`, `serpent_whip`, `deer_short`
- **Auras (6)**: `none`, `solar_halo`, `lunar_crescent`, `ember_sparks`, `shadow_wisps`, `petal_orbit`

### 5.7 Sims-Grade Granular Character Customization (Wave 7 — Optional, 100% Backward Compatible)
All fields below are **optional** on `CharacterDNA` (`version: 1`). Omit any field to inherit clean neutral defaults. All layers work automatically across all 20 Art Engines, all 10 `ExpressionId`s, and all 6 phoneme lip-sync visemes (`0..5`).

#### Granular Face, Eyes, Eyebrows & Mouth (`dna.head` & `dna.faceMorph`)
- **Eyebrow Styles (10)** (`dna.head.eyebrowStyle`): `natural_arch`, `thick_bold`, `thin_curved`, `straight_stoic`, `angled_fierce`, `high_arched`, `bushy_elder`, `slit_notched`, `feathered`, `none`
- **Pupil / Iris Styles (8)** (`dna.head.pupilStyle`): `round`, `slit_cat`, `star_sparkle`, `ring_cyber`, `crosshair`, `blank_glow`, `spiral_hypno`, `heart_cute`
- **Eyelash / Liner Styles (5)** (`dna.head.eyelashStyle`): `none`, `natural`, `winged_liner`, `dramatic_long`, `kohl_kajal`
- **Mouth & Lip Styles (8)** (`dna.head.mouthStyle`): `classic`, `full_lips`, `thin_stern`, `wide_grin`, `fangs_vampire`, `tusks_boar`, `beak_line`, `stitched_gothic`
- **Expanded Hair / Mane (21)** (`dna.head.hairStyle`): `none`, `short_crop`, `swept_royal`, `long_flowing`, `topknot_bun`, `braided_twin`, `wild_spiky`, `lion_mane`, `feather_crest`, `dreadlocks`, `hooded_cowl`, `bob_cut`, `pixie_short`, `curly_afro`, `ponytail_high`, `side_shave_undercut`, `wavy_shoulder`, `twin_buns`, `mohawk_punk`, `messy_anime`, `silver_bun_elder`
- **Expanded Facial Hair (13)** (`dna.head.facialHair`): `none`, `royal_mustache`, `handlebar`, `short_trimmed`, `sage_long_beard`, `goatee`, `whiskers`, `stubble_5oclock`, `full_viking_beard`, `van_dyke`, `mutton_chops`, `soul_patch`, `braided_dwarf_beard`
- **12 Face Sculpt Morphs (`dna.faceMorph`)**:
  - `jawWidth` (`0.7..1.3`, default `1`), `chinLength` (`0.7..1.3`, default `1`), `cheekboneWidth` (`0.75..1.3`, default `1`)
  - `eyeSize` (`0.7..1.35`, default `1`), `eyeSpacing` (`0.75..1.3`, default `1`), `eyeTilt` (`-0.35..0.35`, default `0`)
  - `browHeight` (`-0.3..0.3`, default `0`), `browThickness` (`0.5..1.8`, default `1`), `noseScale` (`0.65..1.45`, default `1`)
  - `mouthWidth` (`0.7..1.35`, default `1`), `earScale` (`0.65..1.5`, default `1`), `neckLength` (`0.75..1.3`, default `1`)

#### Combinable Face & Body Marks (`dna.head.faceMark`, `dna.head.secondaryFaceMark`, `dna.head.blushIntensity`, `dna.bodyMarks`)
- **Face Marks (22)** (combinable primary + secondary): `none`, `vermilion_tilak`, `tripundra_ash`, `maang_tikka`, `third_eye`, `war_paint`, `cheek_scar`, `eye_patch`, `freckles`, `tribal_lines`, `nose_bridge_scar`, `brow_slash_scar`, `beauty_mole`, `vitiligo_patch`, `cyber_cheek_circuit`, `tear_tattoos`, `star_freckles`, `glow_runes`, `nose_bandage`, `clown_diamond`, `gold_leaf_forehead`, `dark_undereye`
- **Cheek Blush (`dna.head.blushIntensity`)**: `0..1` (default `0`)
- **Body Marks (16)** (`dna.bodyMarks`, array of up to 3 active IDs excluding `none`): `none`, `tribal_arm_bands`, `sleeve_tattoo_ink`, `cyber_circuit_veins`, `glowing_magic_runes`, `battle_scars_chest`, `vitiligo_body`, `henna_mehndi_hands`, `dragon_coil_tattoo`, `sacred_ash_stripes`, `tiger_body_stripes`, `starlight_freckles`, `stitch_seams`, `cracked_stone_veins`, `biolum_spots`, `anchor_sailor_tattoo`

#### Layered Clothing & Footwear (`dna.outfit`)
- **Headwear (24)** (`dna.outfit.headwear`): `none`, `golden_mukut`, `royal_turban`, `mughal_pagri`, `ten_crown`, `battle_helm`, `kabuto_crest`, `wizard_hat`, `laurel_wreath`, `floral_tiara`, `bandana`, `straw_conical`, `fedora`, `cyber_visor`, `astronaut_helmet`, `tricorn_hat`, `samurai_kabuto`, `chef_toque`, `grad_cap`, `viking_horns`, `nurse_cap`, `cowboy_hat`, `diver_helmet`, `elf_circlet`
- **Upper Garments (22)** (`dna.outfit.topStyle`): `none_fur`, `royal_angarkha`, `saree_drape`, `sage_wrap`, `plate_armor`, `samurai_cuirass`, `peasant_tunic`, `scholar_robe`, `toga_chiton`, `kente_wrap`, `mystic_vest`, `trench_coat`, `lab_coat`, `cyber_jacket`, `space_suit`, `business_suit`, `space_exo`, `kimono_robe`, `hoodie_street`, `medieval_plate`, `pirate_coat`, `sports_jersey`
- **Outerwear Layers (14)** (`dna.outfit.outerwear`): `none`, `leather_biker`, `denim_vest`, `royal_sherwani_coat`, `bomber_jacket`, `puffer_vest`, `tactical_rig`, `fur_collared_coat`, `academic_blazer`, `shawl_wrap`, `chainmail_hauberk`, `cyber_exovest`, `hooded_poncho`, `apron_artisan`
- **Sleeve Cuts (7)** (`dna.outfit.sleeveStyle`): `auto`, `sleeveless`, `short_sleeve`, `rolled_cuff`, `long_fitted`, `bell_wide`, `puffed_royal`
- **Lower Garments (9)** (`dna.outfit.bottomStyle`): `dhoti`, `flowing_skirt`, `armored_greaves`, `trousers`, `loincloth`, `robe_hem`, `animal_legs`, `coiled_tail`, `ethereal_wisp`
- **Waist / Belts (10)** (`dna.outfit.waistStyle`): `none`, `leather_buckle`, `royal_kamarband`, `utility_pouches`, `obi_sash`, `chain_belt`, `rope_cord`, `champion_belt`, `ammo_bandolier`, `jeweled_girdle`
- **Gloves / Handwear (9)** (`dna.outfit.gloves`): `none`, `fingerless_biker`, `leather_gloves`, `steel_gauntlets`, `silk_opera_gloves`, `wrapped_bandages`, `boxing_wraps`, `cyber_hands`, `gold_bangles_stack`
- **Footwear (12)** (`dna.outfit.footwear`): `auto`, `barefoot`, `royal_mojari`, `leather_boots`, `combat_boots`, `sneakers_high`, `dress_oxfords`, `sandals_strappy`, `armored_sabatons`, `cyber_greaves`, `heels_classic`, `tabi_ninja`
- **Collars (8)** (`dna.outfit.collarAccessory`): `none`, `gold_necklace`, `rudraksha_beads`, `scarf_muffler`, `fur_mantle`, `royal_sash`, `pauldron_plates`, `cobra_garland`
- **Capes (6)** (`dna.outfit.capeStyle`): `none`, `royal_cape`, `tattered_cloak`, `flowing_dupatta`, `feather_mantle`, `celestial_ribbon`
- **Surface Patterns (22)** (`dna.outfit.surfacePattern`): `solid`, `tiger_stripes`, `leopard_spots`, `serpent_scales`, `feather_layers`, `royal_brocade`, `kente_weave`, `bark_grain`, `starfield_cosmic`, `stone_cracks`, `circuit_trace`, `pinstripe`, `camo_hex`, `starfield_speckle`, `circuit_traces`, `starfield_constellation`, `camo_tactical`, `dragon_scales`, `plaid_tartan`, `wave_seigaiha`, `honeycomb_hex`, `floral_botanical`

#### 5 Independent Accessory Slots (`dna.accessories`)
- **Eyewear (12)** (`dna.accessories.eyewear`): `none`, `round_scholar`, `rectangular_modern`, `aviator_shades`, `cat_eye_chic`, `monocle_brass`, `steampunk_goggles`, `cyber_holo_visor`, `tactical_hud`, `heart_shades`, `pirate_eyepatch`, `blindfold_mystic`
- **Ear & Face Jewelry (9)** (`dna.accessories.earJewelry`): `none`, `gold_studs`, `hoop_earrings`, `royal_jhumkas`, `feather_drop`, `elf_ear_cuffs`, `cyber_comms_earpiece`, `nose_ring_nath`, `brow_piercing`
- **Neckwear (10)** (`dna.accessories.neckwear`): `none`, `locket_pendant`, `crystal_amulet_chain`, `choker_velvet`, `dog_tags`, `tie_necktie`, `bow_tie`, `pearl_strand`, `stethoscope_drape`, `scarf_bandana`
- **Wristwear (7)** (`dna.accessories.wristwear`): `none`, `smartwatch`, `gold_kadas`, `leather_bracers`, `spiked_cuffs`, `bead_bracelets`, `holo_wristpad`
- **Back Gear (12)** (`dna.accessories.backGear`): `none`, `adventure_backpack`, `archer_quiver`, `crossed_katanas`, `electric_guitar_sling`, `jetpack_twin`, `scroll_cylinder`, `shield_slung`, `oxygen_tanks`, `lantern_pole`, `cyber_halo_ring`, `plush_satchel`

#### 10-Channel Color Palette (`dna.palette`)
- Base 7 channels: `primary`, `secondary`, `accent`, `skin`, `hair`, `eye`, `patternTint`
- Wave 7 optional channels: `eyeSecondary` (heterochromia), `lip`, `brow`, `markTint`

#### Compact Wave 7 CharacterDNA JSON Recipe
```json
{
  "id": "kira_ronin",
  "name": "Kira",
  "archetype": "cyber_hacker",
  "primaryColor": "#1e293b",
  "accentColor": "#22d3ee",
  "dna": {
    "version": 1,
    "chassis": "humanoid",
    "head": {
      "headShape": "oval_classic",
      "eyeStyle": "narrow_sharp",
      "pupilStyle": "ring_cyber",
      "eyelashStyle": "winged_liner",
      "eyebrowStyle": "slit_notched",
      "noseStyle": "aquiline",
      "mouthStyle": "classic",
      "ears": "human",
      "hairStyle": "side_shave_undercut",
      "facialHair": "none",
      "horns": "none",
      "faceMark": "cyber_cheek_circuit",
      "secondaryFaceMark": "brow_slash_scar",
      "blushIntensity": 0.15
    },
    "faceMorph": { "jawWidth": 0.94, "eyeTilt": 0.14, "browThickness": 1.1 },
    "bodyMarks": ["cyber_circuit_veins", "dragon_coil_tattoo"],
    "outfit": {
      "headwear": "none",
      "topStyle": "cyber_jacket",
      "outerwear": "leather_biker",
      "sleeveStyle": "rolled_cuff",
      "bottomStyle": "trousers",
      "waistStyle": "utility_pouches",
      "gloves": "fingerless_biker",
      "footwear": "combat_boots",
      "collarAccessory": "none",
      "capeStyle": "none",
      "surfacePattern": "circuit_traces"
    },
    "accessories": {
      "eyewear": "cyber_holo_visor",
      "earJewelry": "cyber_comms_earpiece",
      "neckwear": "dog_tags",
      "wristwear": "holo_wristpad",
      "backGear": "crossed_katanas"
    },
    "palette": {
      "primary": "#1e293b",
      "secondary": "#0f172a",
      "accent": "#22d3ee",
      "skin": "#d6a481",
      "hair": "#0f172a",
      "eye": "#22d3ee",
      "eyeSecondary": "#f59e0b",
      "lip": "#9d4e5a",
      "brow": "#0f172a",
      "markTint": "#38bdf8",
      "patternTint": "#22d3ee"
    }
  }
}
```

## 6. Shot-Inspector QA Bridge, Telemetry Bundle & RFC 6902 Patches (Wave 8)
- **Deterministic QA Bundle (`stagecraft-shot-inspector/v1`)**: Export via Storyboard QA -> Shot-Inspector Bridge -> `Export QA Bundle` (or CLI `node scripts/render-batch.mjs <ep.json> --out ./renders --qa-bundle [--shot-inspector-dir ../shot-inspector]`).
- Contains 60fps integer beat timings, `effectiveCadenceFps` (`12 | 24 | 60`), `hitstopWindows`, `vfxBurstWindows`, `speechWindow` (with `audioLeadSec` J/L-cut offsets & `estimatedCps`), `locationCard`, per-actor `hasGranularDna` & `dnaSilhouetteSignature`, and broadcast audio targets (`-14 LUFS`, `-1.5 dBTP`).
- **Safe RFC 6902 Auto-Patch Format (`stagecraft-patch/v1`)**: Import either `{ "schema": "stagecraft-patch/v1", "summary": "...", "patch": [ ... ] }` or a raw RFC 6902 array (`add` / `replace` / `remove`). Only `/beats/<index>/...` and `/visualStyle/<field>` paths are permitted; prototype-pollution keys and out-of-bounds indices are rejected atomically before `validateEpisodeScript()`.
- **Live Bidirectional Bridge (`cutscene-qa-bridge/v1`)**: Origin-verified `postMessage` host handling `QA_PING` -> `QA_PONG`, `QA_RUN_AUDIT` -> `QA_PUSH_STAGECRAFT_BUNDLE`, `QA_SEEK_TIME`, and `QA_APPLY_PATCH` (dry-run & Undo-preserving commit -> `QA_PATCH_RESULT`).

## 7. Mandatory Quality & Verification Gate
- Sync living docs: `npm run sync-docs && npm run sync-docs -- --check`
- Lint + Test + Build: `npm run lint && npm test && npm run build`
