/**
 * Stagecraft Studio — Foreground Framing Parallax Silhouettes (Upgrade 25)
 *
 * Pure deterministic near-camera corner framing silhouettes moving at 1.28x camera parallax
 * across all 50 StageId worlds. Zero per-frame canvas allocations, zero non-deterministic RNG,
 * and strictly kept out of center face/caption zones.
 */

import { MOOD_PALETTES } from './renderAssets';
import type { MoodId, StageId } from './types';

export type ForegroundMotifId =
  | 'banyan_foliage'
  | 'temple_pillars'
  | 'bamboo_stalks'
  | 'cyber_cables'
  | 'noir_blinds'
  | 'gothic_arch'
  | 'ship_rigging'
  | 'alpine_pines'
  | 'sakura_branch'
  | 'starship_struts'
  | 'none';

const STAGE_TO_FOREGROUND: Record<StageId, ForegroundMotifId> = {
  banyan_clearing: 'banyan_foliage',
  palace_garden: 'banyan_foliage',
  ashoka_vatika: 'banyan_foliage',
  savanna_baobab: 'banyan_foliage',
  enchanted_lake: 'banyan_foliage',
  enchanted_cottage: 'banyan_foliage',
  tropical_archipelago: 'banyan_foliage',
  village_chowk: 'banyan_foliage',
  courtyard_well: 'banyan_foliage',
  cremation_ground: 'banyan_foliage',

  kali_temple: 'temple_pillars',
  royal_durbar: 'temple_pillars',
  mughal_courtyard: 'temple_pillars',
  throne_mound: 'temple_pillars',
  royal_bedchamber: 'temple_pillars',
  moonlit_terrace: 'temple_pillars',
  golden_lanka: 'temple_pillars',
  ancient_egypt_temple: 'temple_pillars',
  roman_colosseum: 'temple_pillars',
  olympus_acropolis: 'temple_pillars',
  river_ghat: 'temple_pillars',
  courtroom_hall: 'temple_pillars',
  bazaar_lane: 'temple_pillars',

  bamboo_forest: 'bamboo_stalks',
  bamboo_pagoda: 'bamboo_stalks',

  neon_cyber_alley: 'cyber_cables',
  high_tech_lab: 'cyber_cables',
  steampunk_clocktower: 'cyber_cables',

  noir_rainy_street: 'noir_blinds',
  cozy_bookshop_cafe: 'noir_blinds',
  vintage_train_car: 'noir_blinds',

  gothic_cathedral: 'gothic_arch',
  volcanic_citadel: 'gothic_arch',
  cave_den: 'gothic_arch',
  royal_dungeon: 'gothic_arch',
  nordic_fjord_hall: 'gothic_arch',
  desert_caravan: 'gothic_arch',

  ocean_ship: 'ship_rigging',
  pirate_galleon_deck: 'ship_rigging',
  underwater_atlantis: 'ship_rigging',

  himalayan_hermitage: 'alpine_pines',
  snowy_mountain_pass: 'alpine_pines',
  red_canyon_mesa: 'alpine_pines',

  cherry_blossom_shrine: 'sakura_branch',

  orbital_starship_bridge: 'starship_struts',
  mars_colony_dome: 'starship_struts',
  astral_observatory: 'starship_struts',
  modern_news_studio: 'starship_struts',

  kurukshetra_field: 'none',
  cloud_skies: 'none',
  // Wave 5: Ancient & Sacred World (10)
  babylon_hanging_gardens: 'banyan_foliage',
  mayan_step_pyramid: 'banyan_foliage',
  stonehenge_circle: 'temple_pillars',
  great_wall_watchtower: 'alpine_pines',
  angkor_jungle_ruins: 'banyan_foliage',
  petra_canyon_temple: 'temple_pillars',
  spartan_mountain_pass: 'alpine_pines',
  persian_rose_palace: 'temple_pillars',
  vedic_gurukul: 'banyan_foliage',
  tibetan_monastery: 'alpine_pines',
  // Wave 5: Historical Towns & Eras (10)
  wild_west_saloon: 'noir_blinds',
  victorian_fog_alley: 'gothic_arch',
  renaissance_plaza: 'temple_pillars',
  medieval_castle_keep: 'gothic_arch',
  medieval_tavern_inn: 'noir_blinds',
  roaring_twenties_jazz: 'noir_blinds',
  ancient_silk_caravanserai: 'temple_pillars',
  viking_longship_fjord: 'ship_rigging',
  feudal_dojo_hall: 'bamboo_stalks',
  industrial_foundry: 'cyber_cables',
  // Wave 5: Modern City & Street (10)
  downtown_skyline_roof: 'starship_struts',
  subway_metro_platform: 'cyber_cables',
  busy_crosswalk_plaza: 'noir_blinds',
  suburban_cul_de_sac: 'banyan_foliage',
  neon_arcade_hall: 'cyber_cables',
  airport_departure_gate: 'starship_struts',
  highway_overpass_night: 'cyber_cables',
  harbor_container_dock: 'ship_rigging',
  rooftop_helipad: 'none',
  public_park_fountain: 'banyan_foliage',
  // Wave 5: Workplaces, Civic & Media (10)
  startup_war_room: 'starship_struts',
  stock_exchange_floor: 'starship_struts',
  hospital_operating_room: 'starship_struts',
  university_lecture_hall: 'temple_pillars',
  elementary_classroom: 'noir_blinds',
  podcast_recording_booth: 'noir_blinds',
  restaurant_open_kitchen: 'noir_blinds',
  science_cleanroom: 'starship_struts',
  police_precinct_desk: 'noir_blinds',
  city_library_atrium: 'temple_pillars',
  // Wave 5: Interiors & Cozy Spaces (10)
  luxury_penthouse_lounge: 'noir_blinds',
  warm_family_livingroom: 'noir_blinds',
  attic_inventor_workshop: 'cyber_cables',
  art_gallery_hall: 'temple_pillars',
  grand_opera_theater: 'gothic_arch',
  cozy_bakery_counter: 'noir_blinds',
  greenhouse_conservatory: 'banyan_foliage',
  museum_dinosaur_hall: 'temple_pillars',
  fitness_boxing_gym: 'cyber_cables',
  retro_diner_booth: 'noir_blinds',
  // Wave 5: Sci-Fi & Cyberpunk (10)
  orbital_space_station: 'starship_struts',
  alien_bioluminescent_forest: 'banyan_foliage',
  dyson_sphere_vista: 'starship_struts',
  cyber_megamall_atrium: 'cyber_cables',
  mech_hangar_bay: 'starship_struts',
  vr_cyberspace_grid: 'cyber_cables',
  post_apoc_ruined_highway: 'gothic_arch',
  underground_fallout_bunker: 'cyber_cables',
  solarpunk_sky_garden: 'banyan_foliage',
  quantum_collider_chamber: 'starship_struts',
  // Wave 5: High Fantasy & Magic (10)
  floating_sky_citadel: 'temple_pillars',
  wizard_arcane_tower: 'gothic_arch',
  dragon_hoard_cavern: 'gothic_arch',
  elven_canopy_city: 'banyan_foliage',
  dwarven_forge_hall: 'gothic_arch',
  enchanted_mushroom_grove: 'banyan_foliage',
  crystal_prism_cave: 'gothic_arch',
  alchemist_apothecary: 'noir_blinds',
  fairy_glade_bridge: 'sakura_branch',
  cloud_coliseum: 'temple_pillars',
  // Wave 5: Horror, Mystery & Noir (10)
  haunted_manor_foyer: 'gothic_arch',
  misty_graveyard_gates: 'gothic_arch',
  abandoned_asylum_ward: 'gothic_arch',
  lighthouse_storm_cliff: 'ship_rigging',
  underground_catacombs: 'gothic_arch',
  detective_noir_office: 'noir_blinds',
  locked_bank_vault: 'cyber_cables',
  foggy_london_pier: 'ship_rigging',
  cursed_carnival_tent: 'gothic_arch',
  prison_cellblock: 'gothic_arch',
  // Wave 5: Nature, Biomes & Prehistoric (10)
  coral_reef_lagoon: 'ship_rigging',
  amazon_rainforest_canopy: 'banyan_foliage',
  arctic_glacier_icebergs: 'alpine_pines',
  african_sunset_savanna: 'banyan_foliage',
  grand_canyon_overlook: 'alpine_pines',
  jurassic_fern_valley: 'banyan_foliage',
  sahara_starlit_dunes: 'none',
  alpine_meadow_lake: 'alpine_pines',
  bioluminescent_sea_cave: 'gothic_arch',
  autumn_maple_river: 'sakura_branch',
  // Wave 5: Sports, Travel & Kids Worlds (10)
  floodlit_cricket_stadium: 'none',
  championship_soccer_pitch: 'none',
  racing_circuit_paddock: 'starship_struts',
  cruise_liner_promenade: 'ship_rigging',
  hot_air_balloon_skies: 'none',
  treehouse_clubhouse: 'banyan_foliage',
  giant_toybox_playroom: 'noir_blinds',
  circus_big_top_ring: 'gothic_arch',
  amusement_ferris_boardwalk: 'ship_rigging',
  candy_kingdom_bridge: 'sakura_branch',
};

/**
 * Maps every one of the 150 StageId worlds into a curated near-camera framing motif.
 */
export function classifyForegroundFrame(stage: StageId): ForegroundMotifId {
  return STAGE_TO_FOREGROUND[stage] ?? 'none';
}

/**
 * Draws soft dark near-camera corner framing silhouettes moving at 1.28x camera parallax
 * without obstructing center faces or lower-third captions. Zero allocations.
 */
export function drawForegroundParallaxLayer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stage: StageId,
  mood: MoodId,
  camPanX: number,
  camZoom: number,
  animT: number,
  intensity = 0.35
): void {
  const clampedIntensity = Math.max(0, Math.min(1, Number.isFinite(intensity) ? intensity : 0.35));
  if (clampedIntensity <= 0.01) return;

  const motif = classifyForegroundFrame(stage);
  if (motif === 'none') return;

  const pal = MOOD_PALETTES[mood] || MOOD_PALETTES.midnight_banyan;
  const s = Math.min(w, h) / 620;
  // 1.28x near-camera parallax offset (clamped safely so edges never reveal gaps)
  const px = Math.max(-w * 0.14, Math.min(w * 0.14, camPanX * 1.28));
  const zScale = 1 + (Math.max(0.85, Math.min(1.6, camZoom)) - 1) * 1.28;

  ctx.save();
  ctx.translate(w * 0.5 + px, h * 0.5);
  ctx.scale(zScale, zScale);
  ctx.translate(-w * 0.5, -h * 0.5);

  const darkFill = '#070912';
  const baseAlpha = 0.28 + clampedIntensity * 0.44;
  ctx.fillStyle = darkFill;
  ctx.strokeStyle = darkFill;
  ctx.globalAlpha = baseAlpha;

  const sway = Math.sin(animT * 1.35) * 6 * s;

  if (motif === 'banyan_foliage' || motif === 'sakura_branch') {
    // Top-left & top-right overhanging branch silhouettes (never enter middle 65% face zone)
    for (const side of [-1, 1] as const) {
      const originX = side === -1 ? -16 * s : w + 16 * s;
      const dir = -side;
      ctx.beginPath();
      ctx.moveTo(originX, -10 * s);
      ctx.quadraticCurveTo(originX + dir * w * 0.14, h * 0.06 + sway, originX + dir * w * 0.24, h * 0.14 + sway * 1.3);
      ctx.quadraticCurveTo(originX + dir * w * 0.13, h * 0.16 + sway * 0.6, originX, h * 0.19);
      ctx.closePath();
      ctx.fill();

      // Leaf / petal clusters along outer upper edge
      const clusters = 5;
      for (let i = 0; i < clusters; i++) {
        const cx = originX + dir * (30 + i * 38) * s + sway * (0.4 + i * 0.15);
        const cy = (18 + i * 20 + Math.sin(i * 1.8) * 10) * s;
        ctx.beginPath();
        ctx.ellipse(cx, cy, (26 - i * 2.5) * s, (14 - i * 1.1) * s, dir * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      // Soft sakura blossom accent glints for cherry_blossom_shrine
      if (motif === 'sakura_branch') {
        ctx.save();
        ctx.fillStyle = pal.accent || '#f9a8d4';
        ctx.globalAlpha = baseAlpha * 0.45;
        for (let i = 0; i < 4; i++) {
          const bx = originX + dir * (48 + i * 42) * s + sway * 0.8;
          const by = (28 + i * 24) * s;
          ctx.beginPath();
          ctx.arc(bx, by, 5.5 * s, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  } else if (motif === 'temple_pillars') {
    // Slim carved silhouette column edges on extreme left & right 6% margins
    const colW = w * 0.055;
    ctx.fillRect(-10 * s, -10 * s, colW, h + 20 * s);
    ctx.fillRect(w - colW + 10 * s, -10 * s, colW, h + 20 * s);
    // Decorative corbel capitals at top corners
    ctx.fillRect(-10 * s, -10 * s, colW * 1.65, h * 0.1);
    ctx.fillRect(w - colW * 1.65 + 10 * s, -10 * s, colW * 1.65, h * 0.1);
  } else if (motif === 'bamboo_stalks') {
    const stalks = [
      { x: w * 0.03, tilt: 0.05, r: 10 },
      { x: w * 0.075, tilt: -0.04, r: 7 },
      { x: w * 0.925, tilt: 0.04, r: 8 },
      { x: w * 0.968, tilt: -0.06, r: 11 },
    ];
    for (let i = 0; i < stalks.length; i++) {
      const st = stalks[i];
      ctx.save();
      ctx.translate(st.x, h);
      ctx.rotate(st.tilt + Math.sin(animT * 1.1 + i) * 0.015);
      ctx.fillRect(-st.r * s * 0.5, -h * 1.05, st.r * s, h * 1.08);
      ctx.restore();
    }
  } else if (motif === 'cyber_cables') {
    // Draped overhead neon-lit cables in upper corners
    ctx.lineWidth = 4.5 * s;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-20 * s, (16 + i * 24) * s);
      ctx.quadraticCurveTo(w * 0.25, (68 + i * 28) * s + sway * 0.4, w * 0.52, -14 * s);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w + 20 * s, (22 + i * 22) * s);
      ctx.quadraticCurveTo(w * 0.76, (72 + i * 26) * s - sway * 0.4, w * 0.48, -14 * s);
      ctx.stroke();
    }
    // Subtle neon cable glint
    ctx.strokeStyle = pal.rimLight;
    ctx.globalAlpha = baseAlpha * 0.35;
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.moveTo(-20 * s, 16 * s);
    ctx.quadraticCurveTo(w * 0.25, 68 * s + sway * 0.4, w * 0.52, -14 * s);
    ctx.stroke();
  } else if (motif === 'noir_blinds') {
    // Venetian blind edge slats tucked cleanly along top-left & top-right corners
    const slatCount = 5;
    for (let i = 0; i < slatCount; i++) {
      const y = (12 + i * 22) * s;
      const len = (145 - i * 18) * s;
      ctx.fillRect(-14 * s, y, len, 8 * s);
      ctx.fillRect(w - len + 14 * s, y, len, 8 * s);
    }
  } else if (motif === 'gothic_arch') {
    // Pointed gothic spandrels framing upper left and upper right corners
    ctx.beginPath();
    ctx.moveTo(-14 * s, -14 * s);
    ctx.lineTo(w * 0.26, -14 * s);
    ctx.quadraticCurveTo(w * 0.08, h * 0.08, -14 * s, h * 0.36);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w + 14 * s, -14 * s);
    ctx.lineTo(w * 0.74, -14 * s);
    ctx.quadraticCurveTo(w * 0.92, h * 0.08, w + 14 * s, h * 0.36);
    ctx.closePath();
    ctx.fill();
  } else if (motif === 'ship_rigging') {
    // Diagonal ship ropes & mast edge along outer margins
    ctx.lineWidth = 5 * s;
    ctx.beginPath();
    ctx.moveTo(w * 0.06, -10 * s);
    ctx.lineTo(-10 * s, h * 0.48);
    ctx.moveTo(w * 0.94, -10 * s);
    ctx.lineTo(w + 10 * s, h * 0.48);
    ctx.stroke();

    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.moveTo(-10 * s, h * 0.14);
    ctx.quadraticCurveTo(w * 0.12, h * 0.22 + sway * 0.6, w * 0.22, -10 * s);
    ctx.moveTo(w + 10 * s, h * 0.14);
    ctx.quadraticCurveTo(w * 0.88, h * 0.22 - sway * 0.6, w * 0.78, -10 * s);
    ctx.stroke();
  } else if (motif === 'alpine_pines') {
    // Dark evergreen bough tips along bottom-left & bottom-right corners (below actor horizon, clear of center)
    for (const side of [-1, 1] as const) {
      const bx = side === -1 ? w * 0.04 : w * 0.96;
      const dir = -side;
      for (let tier = 0; tier < 3; tier++) {
        const ty = h * (0.72 + tier * 0.09);
        const tw = (70 + tier * 26) * s;
        ctx.beginPath();
        ctx.moveTo(bx - dir * 24 * s, ty - 34 * s);
        ctx.lineTo(bx + dir * tw, ty + 16 * s);
        ctx.lineTo(bx - dir * 32 * s, ty + 22 * s);
        ctx.closePath();
        ctx.fill();
      }
    }
  } else if (motif === 'starship_struts') {
    // Clean beveled cockpit / viewport chamfered corner struts
    const cw = w * 0.14;
    const ch = h * 0.16;
    ctx.beginPath();
    ctx.moveTo(-12 * s, -12 * s);
    ctx.lineTo(cw, -12 * s);
    ctx.lineTo(-12 * s, ch);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w + 12 * s, -12 * s);
    ctx.lineTo(w - cw, -12 * s);
    ctx.lineTo(w + 12 * s, ch);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = pal.rimLight;
    ctx.globalAlpha = baseAlpha * 0.4;
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(cw, -12 * s);
    ctx.lineTo(-12 * s, ch);
    ctx.moveTo(w - cw, -12 * s);
    ctx.lineTo(w + 12 * s, ch);
    ctx.stroke();
  }

  ctx.restore();
}
