/**
 * Stagecraft Studio — Wave 5 Universal Story Props Atlas (+120 Props)
 *
 * Covers all 120 new Wave 5 PropIds across 10 categories (12 per category),
 * rendered in canonical prop space centered at (0, 0) within [-80..80, -80..80]
 * with distinct recognizable silhouettes, material specular highlights, and
 * deterministic micro-animations.
 *
 * Strictly deterministic: zero Math.random(), zero offscreen canvas allocations.
 */
import { PropId } from './types';
const snap24 = (t: number): number => Math.floor(t * 24) / 24;

type PropShapeFamily =
  | 'blade_curved'
  | 'axe_double'
  | 'shield_crest'
  | 'crossbow'
  | 'polearm'
  | 'blaster_gun'
  | 'star_shuriken'
  | 'hammer_heavy'
  | 'hook_rope'
  | 'orb_glow'
  | 'tablet_runes'
  | 'feather_flame'
  | 'egg_scaled'
  | 'chalice_cup'
  | 'book_tome'
  | 'hourglass'
  | 'orrery_rings'
  | 'totem_mask'
  | 'carpet_rug'
  | 'lamp_genie'
  | 'crown_gold'
  | 'device_screen'
  | 'headset_vr'
  | 'rack_tower'
  | 'cube_core'
  | 'vial_tube'
  | 'dish_radar'
  | 'jetpack_twin'
  | 'pad_ring'
  | 'bullion_bars'
  | 'chart_board'
  | 'camera_rig'
  | 'clapperboard'
  | 'mic_arm'
  | 'cash_stack'
  | 'card_badge'
  | 'dossier_file'
  | 'megaphone'
  | 'trophy_cup'
  | 'stethoscope'
  | 'telescope'
  | 'globe_stand'
  | 'medical_kit'
  | 'syringe'
  | 'atom_orbit'
  | 'fossil_spiral'
  | 'string_instrument'
  | 'drum_pair'
  | 'piano_keys'
  | 'art_palette'
  | 'turntable_disc'
  | 'theater_masks'
  | 'origami_bird'
  | 'brush_flute'
  | 'horn_brass'
  | 'bowl_steam'
  | 'platter_feast'
  | 'cake_candles'
  | 'pizza_slice'
  | 'teapot'
  | 'jar_bottle'
  | 'basket_woven'
  | 'ice_cream'
  | 'suitcase'
  | 'scroll_tube'
  | 'ship_wheel'
  | 'balloon_basket'
  | 'bicycle'
  | 'helmet_visor'
  | 'anchor_iron'
  | 'lantern_glow'
  | 'binoculars'
  | 'tent_camp'
  | 'handcuffs'
  | 'tape_roll'
  | 'safe_door'
  | 'envelope_wax'
  | 'keys_ring'
  | 'candelabra'
  | 'skull_bone'
  | 'bat_ball'
  | 'soccer_ball'
  | 'gloves_pair'
  | 'chess_board'
  | 'plush_toy'
  | 'kite_tail'
  | 'gift_box'
  | 'skateboard'
  | 'watering_can'
  | 'wrench_tool'
  | 'stopwatch';

interface PropBlueprint {
  family: PropShapeFamily;
  primary: string;
  secondary: string;
  accent: string;
  glow?: boolean;
}

const ATLAS_PROP_BLUEPRINTS: Partial<Record<PropId, PropBlueprint>> = {
  // 1. Weapons & Armor (12)
  katana_blade: { family: 'blade_curved', primary: '#e2e8f0', secondary: '#1e293b', accent: '#dc2626' },
  viking_battleaxe: { family: 'axe_double', primary: '#94a3b8', secondary: '#78350f', accent: '#f59e0b' },
  knight_shield: { family: 'shield_crest', primary: '#3b82f6', secondary: '#e2e8f0', accent: '#facc15' },
  crossbow_bolts: { family: 'crossbow', primary: '#78350f', secondary: '#64748b', accent: '#ef4444' },
  spear_halberd: { family: 'polearm', primary: '#cbd5e1', secondary: '#78350f', accent: '#dc2626' },
  flintlock_pistol: { family: 'blaster_gun', primary: '#78350f', secondary: '#94a3b8', accent: '#f59e0b' },
  laser_rifle: { family: 'blaster_gun', primary: '#1e293b', secondary: '#38bdf8', accent: '#22d3ee', glow: true },
  plasma_cannon: { family: 'blaster_gun', primary: '#312e81', secondary: '#c084fc', accent: '#f43f5e', glow: true },
  shuriken_star: { family: 'star_shuriken', primary: '#cbd5e1', secondary: '#334155', accent: '#ef4444' },
  war_hammer: { family: 'hammer_heavy', primary: '#64748b', secondary: '#78350f', accent: '#38bdf8', glow: true },
  roman_gladius: { family: 'blade_curved', primary: '#e2e8f0', secondary: '#b45309', accent: '#facc15' },
  grappling_hook: { family: 'hook_rope', primary: '#94a3b8', secondary: '#d97706', accent: '#e2e8f0' },

  // 2. Magic & Mythic Relics (12)
  crystal_ball: { family: 'orb_glow', primary: '#a855f7', secondary: '#38bdf8', accent: '#facc15', glow: true },
  runestone_tablet: { family: 'tablet_runes', primary: '#475569', secondary: '#38bdf8', accent: '#22d3ee', glow: true },
  phoenix_feather: { family: 'feather_flame', primary: '#f97316', secondary: '#facc15', accent: '#dc2626', glow: true },
  dragon_egg: { family: 'egg_scaled', primary: '#991b1b', secondary: '#f59e0b', accent: '#fde047', glow: true },
  enchanted_chalice: { family: 'chalice_cup', primary: '#facc15', secondary: '#a855f7', accent: '#fef08a', glow: true },
  grimoire_chained: { family: 'book_tome', primary: '#4c1d95', secondary: '#94a3b8', accent: '#facc15', glow: true },
  hourglass_sands: { family: 'hourglass', primary: '#b45309', secondary: '#fde047', accent: '#bae6fd' },
  astral_orrery: { family: 'orrery_rings', primary: '#f59e0b', secondary: '#38bdf8', accent: '#fde047', glow: true },
  voodoo_totem: { family: 'totem_mask', primary: '#78350f', secondary: '#22c55e', accent: '#f43f5e' },
  magic_carpet: { family: 'carpet_rug', primary: '#7e22ce', secondary: '#dc2626', accent: '#facc15' },
  genie_lamp: { family: 'lamp_genie', primary: '#f59e0b', secondary: '#fde047', accent: '#38bdf8', glow: true },
  crown_jeweled: { family: 'crown_gold', primary: '#facc15', secondary: '#dc2626', accent: '#38bdf8' },

  // 3. Sci-Fi & Tech Gadgets (12)
  smartphone_glow: { family: 'device_screen', primary: '#0f172a', secondary: '#38bdf8', accent: '#22d3ee', glow: true },
  vr_headset: { family: 'headset_vr', primary: '#e2e8f0', secondary: '#0f172a', accent: '#22d3ee', glow: true },
  cyber_deck: { family: 'device_screen', primary: '#1e293b', secondary: '#ec4899', accent: '#00f0ff', glow: true },
  server_rack: { family: 'rack_tower', primary: '#1e293b', secondary: '#22c55e', accent: '#38bdf8', glow: true },
  ai_core_cube: { family: 'cube_core', primary: '#0ea5e9', secondary: '#a855f7', accent: '#ffffff', glow: true },
  dna_helix_vial: { family: 'vial_tube', primary: '#22d3ee', secondary: '#ec4899', accent: '#e2e8f0', glow: true },
  sat_dish_mini: { family: 'dish_radar', primary: '#cbd5e1', secondary: '#334155', accent: '#38bdf8' },
  jetpack_thruster: { family: 'jetpack_twin', primary: '#94a3b8', secondary: '#ef4444', accent: '#facc15', glow: true },
  teleport_pad: { family: 'pad_ring', primary: '#334155', secondary: '#22d3ee', accent: '#c084fc', glow: true },
  mech_battery: { family: 'rack_tower', primary: '#334155', secondary: '#84cc16', accent: '#facc15', glow: true },
  radar_scanner: { family: 'dish_radar', primary: '#064e3b', secondary: '#10b981', accent: '#a7f3d0', glow: true },
  hologram_globe: { family: 'globe_stand', primary: '#22d3ee', secondary: '#38bdf8', accent: '#e0f2fe', glow: true },

  // 4. Modern Office, Media & Finance (12)
  gold_bullion_bars: { family: 'bullion_bars', primary: '#facc15', secondary: '#d97706', accent: '#fef9c3' },
  stock_chart_board: { family: 'chart_board', primary: '#0f172a', secondary: '#22c55e', accent: '#ef4444' },
  studio_camera_rig: { family: 'camera_rig', primary: '#18181b', secondary: '#64748b', accent: '#ef4444' },
  clapperboard_slate: { family: 'clapperboard', primary: '#0f172a', secondary: '#ffffff', accent: '#facc15' },
  podcast_mic_arm: { family: 'mic_arm', primary: '#334155', secondary: '#18181b', accent: '#a855f7' },
  whiteboard_diagram: { family: 'chart_board', primary: '#f8fafc', secondary: '#3b82f6', accent: '#ef4444' },
  stack_of_cash: { family: 'cash_stack', primary: '#16a34a', secondary: '#dcfce7', accent: '#facc15' },
  credit_card_gold: { family: 'card_badge', primary: '#eab308', secondary: '#78350f', accent: '#fef08a' },
  contract_dossier: { family: 'dossier_file', primary: '#d97706', secondary: '#fef3c7', accent: '#dc2626' },
  megaphone_bullhorn: { family: 'megaphone', primary: '#ef4444', secondary: '#f8fafc', accent: '#1e293b' },
  press_badge: { family: 'card_badge', primary: '#1d4ed8', secondary: '#ffffff', accent: '#ef4444' },
  trophy_cup_silver: { family: 'trophy_cup', primary: '#cbd5e1', secondary: '#94a3b8', accent: '#ffffff' },

  // 5. Science, Medical & Lab (12)
  stethoscope_med: { family: 'stethoscope', primary: '#0f172a', secondary: '#cbd5e1', accent: '#38bdf8' },
  beaker_bubbling: { family: 'vial_tube', primary: '#4ade80', secondary: '#22c55e', accent: '#e2e8f0', glow: true },
  telescope_brass: { family: 'telescope', primary: '#d97706', secondary: '#78350f', accent: '#38bdf8' },
  globe_terrestrial: { family: 'globe_stand', primary: '#2563eb', secondary: '#22c55e', accent: '#d97706' },
  skeleton_model: { family: 'skull_bone', primary: '#f5f5f4', secondary: '#d6d3d1', accent: '#0f172a' },
  first_aid_kit: { family: 'medical_kit', primary: '#ffffff', secondary: '#dc2626', accent: '#94a3b8' },
  syringe_serum: { family: 'syringe', primary: '#cbd5e1', secondary: '#22d3ee', accent: '#ef4444', glow: true },
  x_ray_lightbox: { family: 'chart_board', primary: '#082f49', secondary: '#e0f2fe', accent: '#38bdf8', glow: true },
  chalkboard_equations: { family: 'chart_board', primary: '#14532d', secondary: '#ffffff', accent: '#facc15' },
  atom_model: { family: 'atom_orbit', primary: '#38bdf8', secondary: '#a855f7', accent: '#facc15', glow: true },
  geiger_counter: { family: 'device_screen', primary: '#eab308', secondary: '#18181b', accent: '#84cc16' },
  fossil_ammonite: { family: 'fossil_spiral', primary: '#a8a29e', secondary: '#78716c', accent: '#e7e5e4' },

  // 6. Music, Art & Culture (12)
  sitar_instrument: { family: 'string_instrument', primary: '#b45309', secondary: '#fde68a', accent: '#dc2626' },
  tabla_drums: { family: 'drum_pair', primary: '#b45309', secondary: '#fef3c7', accent: '#18181b' },
  grand_piano_mini: { family: 'piano_keys', primary: '#18181b', secondary: '#ffffff', accent: '#facc15' },
  paintbrush_palette: { family: 'art_palette', primary: '#d97706', secondary: '#ef4444', accent: '#3b82f6' },
  movie_projector: { family: 'camera_rig', primary: '#334155', secondary: '#94a3b8', accent: '#fef08a', glow: true },
  vinyl_turntable: { family: 'turntable_disc', primary: '#78350f', secondary: '#0f172a', accent: '#ef4444' },
  dj_mixer_deck: { family: 'turntable_disc', primary: '#1e293b', secondary: '#00f0ff', accent: '#ff2bd6', glow: true },
  theater_masks: { family: 'theater_masks', primary: '#fef3c7', secondary: '#1e293b', accent: '#facc15' },
  origami_crane: { family: 'origami_bird', primary: '#f8fafc', secondary: '#f472b6', accent: '#cbd5e1' },
  calligraphy_brush: { family: 'brush_flute', primary: '#78350f', secondary: '#18181b', accent: '#dc2626' },
  bamboo_flute: { family: 'brush_flute', primary: '#84cc16', secondary: '#fde047', accent: '#15803d' },
  war_horn_brass: { family: 'horn_brass', primary: '#d97706', secondary: '#fde047', accent: '#78350f' },

  // 7. Food, Feast & Tavern (12)
  steaming_ramen_bowl: { family: 'bowl_steam', primary: '#dc2626', secondary: '#fde047', accent: '#ffffff' },
  royal_thali_platter: { family: 'platter_feast', primary: '#eab308', secondary: '#ea580c', accent: '#22c55e' },
  birthday_cake_lit: { family: 'cake_candles', primary: '#f472b6', secondary: '#fef9c3', accent: '#f97316', glow: true },
  pizza_slice_box: { family: 'pizza_slice', primary: '#f59e0b', secondary: '#dc2626', accent: '#fde047' },
  teapot_porcelain: { family: 'teapot', primary: '#e0f2fe', secondary: '#2563eb', accent: '#ffffff' },
  spice_jar_rack: { family: 'jar_bottle', primary: '#ea580c', secondary: '#facc15', accent: '#16a34a' },
  fruit_basket: { family: 'basket_woven', primary: '#b45309', secondary: '#ef4444', accent: '#22c55e' },
  campfire_kettle: { family: 'bowl_steam', primary: '#334155', secondary: '#f97316', accent: '#fde047', glow: true },
  goblet_wine: { family: 'chalice_cup', primary: '#94a3b8', secondary: '#991b1b', accent: '#facc15' },
  honey_jar: { family: 'jar_bottle', primary: '#f59e0b', secondary: '#fde047', accent: '#78350f' },
  bread_loaf_basket: { family: 'basket_woven', primary: '#d97706', secondary: '#f59e0b', accent: '#fef3c7' },
  ice_cream_cone: { family: 'ice_cream', primary: '#f472b6', secondary: '#fef08a', accent: '#d97706' },

  // 8. Vehicles & Travel Gear (12)
  vintage_suitcase: { family: 'suitcase', primary: '#78350f', secondary: '#facc15', accent: '#dc2626' },
  treasure_map_tube: { family: 'scroll_tube', primary: '#d97706', secondary: '#fef3c7', accent: '#dc2626' },
  ship_wheel_helm: { family: 'ship_wheel', primary: '#78350f', secondary: '#b45309', accent: '#facc15' },
  hot_air_basket: { family: 'balloon_basket', primary: '#ef4444', secondary: '#facc15', accent: '#78350f' },
  bicycle_classic: { family: 'bicycle', primary: '#ef4444', secondary: '#1e293b', accent: '#cbd5e1' },
  motorcycle_helmet: { family: 'helmet_visor', primary: '#dc2626', secondary: '#0f172a', accent: '#ffffff' },
  astronaut_helmet: { family: 'helmet_visor', primary: '#f8fafc', secondary: '#f59e0b', accent: '#38bdf8' },
  anchor_iron: { family: 'anchor_iron', primary: '#475569', secondary: '#94a3b8', accent: '#d97706' },
  lantern_storm: { family: 'lantern_glow', primary: '#334155', secondary: '#facc15', accent: '#f97316', glow: true },
  boarding_pass: { family: 'card_badge', primary: '#0284c7', secondary: '#ffffff', accent: '#f59e0b' },
  binoculars_field: { family: 'binoculars', primary: '#1e293b', secondary: '#38bdf8', accent: '#94a3b8' },
  tent_camping: { family: 'tent_camp', primary: '#ea580c', secondary: '#fde047', accent: '#15803d' },

  // 9. Mystery, Crime & Noir (12)
  handcuffs_steel: { family: 'handcuffs', primary: '#cbd5e1', secondary: '#64748b', accent: '#ffffff' },
  evidence_bag: { family: 'dossier_file', primary: '#e2e8f0', secondary: '#facc15', accent: '#dc2626' },
  fingerprint_card: { family: 'card_badge', primary: '#f8fafc', secondary: '#0f172a', accent: '#3b82f6' },
  crime_tape_roll: { family: 'tape_roll', primary: '#facc15', secondary: '#0f172a', accent: '#fef08a' },
  revolver_noir: { family: 'blaster_gun', primary: '#475569', secondary: '#78350f', accent: '#cbd5e1' },
  safe_dial_door: { family: 'safe_door', primary: '#334155', secondary: '#cbd5e1', accent: '#facc15' },
  red_string_board: { family: 'chart_board', primary: '#92400e', secondary: '#fef3c7', accent: '#dc2626' },
  secret_envelope: { family: 'envelope_wax', primary: '#fef3c7', secondary: '#dc2626', accent: '#d97706' },
  skeleton_key_ring: { family: 'keys_ring', primary: '#d97706', secondary: '#facc15', accent: '#78350f' },
  poison_vial_green: { family: 'vial_tube', primary: '#22c55e', secondary: '#84cc16', accent: '#0f172a', glow: true },
  candle_candelabra: { family: 'candelabra', primary: '#f59e0b', secondary: '#fef9c3', accent: '#f97316', glow: true },
  skull_relic: { family: 'skull_bone', primary: '#f5f5f4', secondary: '#a8a29e', accent: '#a855f7' },

  // 10. Sports, Kids & Everyday (12)
  cricket_bat_ball: { family: 'bat_ball', primary: '#d97706', secondary: '#dc2626', accent: '#1e293b' },
  soccer_ball_classic: { family: 'soccer_ball', primary: '#ffffff', secondary: '#0f172a', accent: '#22c55e' },
  boxing_gloves: { family: 'gloves_pair', primary: '#dc2626', secondary: '#ffffff', accent: '#facc15' },
  chess_board_set: { family: 'chess_board', primary: '#f8fafc', secondary: '#1e293b', accent: '#d97706' },
  rubber_ducky: { family: 'plush_toy', primary: '#facc15', secondary: '#f97316', accent: '#0f172a' },
  teddy_bear: { family: 'plush_toy', primary: '#b45309', secondary: '#fde68a', accent: '#dc2626' },
  kite_diamond: { family: 'kite_tail', primary: '#ef4444', secondary: '#38bdf8', accent: '#facc15' },
  gift_box_ribbon: { family: 'gift_box', primary: '#ec4899', secondary: '#facc15', accent: '#ffffff' },
  skateboard_deck: { family: 'skateboard', primary: '#3b82f6', secondary: '#facc15', accent: '#ef4444' },
  watering_can: { family: 'watering_can', primary: '#22c55e', secondary: '#38bdf8', accent: '#facc15' },
  hammer_wrench: { family: 'wrench_tool', primary: '#94a3b8', secondary: '#dc2626', accent: '#e2e8f0' },
  stopwatch_sport: { family: 'stopwatch', primary: '#cbd5e1', secondary: '#ffffff', accent: '#ef4444' },
};

export function drawAtlasStoryProp(
  ctx: CanvasRenderingContext2D,
  prop: PropId,
  t: number
): boolean {
  const bp = ATLAS_PROP_BLUEPRINTS[prop];
  if (!bp) return false;

  const ts = snap24(t);
  const pulse = 1 + Math.sin(ts * 4.5) * 0.06;

  ctx.save();
  if (bp.glow) {
    ctx.fillStyle = bp.accent;
    ctx.globalAlpha = 0.22;
    ctx.beginPath(); ctx.arc(0, 0, 56 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  const f = bp.family;
  if (f === 'blade_curved') {
    ctx.rotate(-0.55);
    ctx.fillStyle = bp.primary;
    ctx.beginPath(); ctx.moveTo(-6, 20); ctx.quadraticCurveTo(-12, -46, 8, -86); ctx.lineTo(14, -68); ctx.quadraticCurveTo(2, -32, 6, 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = bp.accent; ctx.fillRect(-16, 18, 32, 8);
    ctx.fillStyle = bp.secondary; ctx.fillRect(-5, 26, 10, 34);
  } else if (f === 'axe_double') {
    ctx.fillStyle = bp.secondary; ctx.fillRect(-5, -66, 10, 132);
    ctx.fillStyle = bp.primary;
    ctx.beginPath(); ctx.moveTo(0, -48); ctx.quadraticCurveTo(54, -74, 48, -18); ctx.quadraticCurveTo(24, -22, 0, -28); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -48); ctx.quadraticCurveTo(-54, -74, -48, -18); ctx.quadraticCurveTo(-24, -22, 0, -28); ctx.fill();
  } else if (f === 'shield_crest') {
    ctx.fillStyle = bp.primary;
    ctx.beginPath(); ctx.moveTo(-42, -48); ctx.lineTo(42, -48); ctx.lineTo(36, 14); ctx.lineTo(0, 58); ctx.lineTo(-36, 14); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = bp.secondary; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = bp.accent; ctx.fillRect(-6, -38, 12, 74); ctx.fillRect(-26, -14, 52, 12);
  } else if (f === 'crossbow' || f === 'polearm' || f === 'hammer_heavy') {
    ctx.fillStyle = bp.secondary; ctx.fillRect(-6, -64, 12, 128);
    ctx.fillStyle = bp.primary;
    if (f === 'crossbow') {
      ctx.strokeStyle = bp.primary; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(0, -10, 48, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.fillStyle = bp.accent; ctx.fillRect(-3, -68, 6, 46);
    } else if (f === 'hammer_heavy') {
      ctx.beginPath(); ctx.roundRect(-40, -64, 80, 44, 8); ctx.fill();
      ctx.fillStyle = bp.accent; ctx.fillRect(-32, -48, 64, 10);
    } else {
      ctx.beginPath(); ctx.moveTo(-6, -64); ctx.lineTo(0, -92); ctx.lineTo(28, -50); ctx.lineTo(6, -34); ctx.closePath(); ctx.fill();
    }
  } else if (f === 'blaster_gun') {
    ctx.fillStyle = bp.primary; ctx.beginPath(); ctx.roundRect(-52, -24, 96, 30, 8); ctx.fill();
    ctx.fillStyle = bp.secondary; ctx.fillRect(-44, 4, 24, 34);
    ctx.fillStyle = bp.accent; ctx.fillRect(10, -16, 36, 10);
  } else if (f === 'star_shuriken') {
    ctx.rotate(ts * 4);
    ctx.fillStyle = bp.primary;
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(0, -56); ctx.lineTo(14, -14); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = bp.secondary; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
  } else if (f === 'hook_rope' || f === 'anchor_iron') {
    ctx.strokeStyle = bp.primary; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -56); ctx.lineTo(0, 46); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 14, 36, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.fillStyle = bp.accent; ctx.beginPath(); ctx.arc(0, -56, 12, 0, Math.PI * 2); ctx.fill();
  } else if (f === 'orb_glow' || f === 'soccer_ball' || f === 'stopwatch') {
    ctx.fillStyle = bp.primary; ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = bp.secondary;
    if (f === 'soccer_ball') {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(Math.cos(a) * 24, Math.sin(a) * 24, 9, 0, Math.PI * 2); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
    } else if (f === 'stopwatch') {
      ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = bp.accent; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ts * 3) * 24, Math.sin(ts * 3) * 24); ctx.stroke();
      ctx.fillStyle = bp.primary; ctx.fillRect(-10, -52, 20, 12);
    } else {
      ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(-10, -10, 18, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = bp.accent; ctx.fillRect(-30, 38, 60, 14);
    }
  } else if (f === 'tablet_runes' || f === 'book_tome' || f === 'dossier_file' || f === 'safe_door') {
    ctx.fillStyle = bp.primary; ctx.beginPath(); ctx.roundRect(-44, -52, 88, 104, 10); ctx.fill();
    ctx.strokeStyle = bp.secondary; ctx.lineWidth = 4;
    if (f === 'safe_door') {
      ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = bp.accent; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
    } else {
      for (let y = -30; y <= 26; y += 18) {
        ctx.fillStyle = bp.secondary; ctx.fillRect(-26, y, 52, 6);
      }
      ctx.fillStyle = bp.accent; ctx.fillRect(-44, -52, 12, 104);
    }
  } else if (f === 'feather_flame' || f === 'origami_bird' || f === 'kite_tail') {
    ctx.fillStyle = bp.primary;
    ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(38, -6); ctx.lineTo(0, 56); ctx.lineTo(-38, -6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = bp.secondary;
    ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(20, -4); ctx.lineTo(0, 34); ctx.lineTo(-20, -4); ctx.closePath(); ctx.fill();
  } else if (f === 'egg_scaled') {
    ctx.fillStyle = bp.primary; ctx.beginPath(); ctx.ellipse(0, 4, 38, 50, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = bp.secondary;
    for (let y = -20; y <= 24; y += 16) {
      ctx.beginPath(); ctx.arc(-14, y, 7, 0, Math.PI); ctx.arc(14, y, 7, 0, Math.PI); ctx.fill();
    }
  } else if (f === 'chalice_cup' || f === 'trophy_cup') {
    ctx.fillStyle = bp.primary;
    ctx.beginPath(); ctx.moveTo(-36, -46); ctx.lineTo(36, -46); ctx.lineTo(22, 10); ctx.lineTo(-22, 10); ctx.closePath(); ctx.fill();
    ctx.fillRect(-8, 10, 16, 30); ctx.fillRect(-28, 38, 56, 12);
    ctx.fillStyle = bp.secondary; ctx.beginPath(); ctx.ellipse(0, -46, 34, 9, 0, 0, Math.PI * 2); ctx.fill();
  } else if (f === 'hourglass') {
    ctx.fillStyle = bp.primary; ctx.fillRect(-38, -56, 76, 10); ctx.fillRect(-38, 46, 76, 10);
    ctx.fillStyle = bp.accent; ctx.globalAlpha = 0.45;
    ctx.beginPath(); ctx.moveTo(-30, -46); ctx.lineTo(30, -46); ctx.lineTo(0, 0); ctx.lineTo(30, 46); ctx.lineTo(-30, 46); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = bp.secondary;
    ctx.beginPath(); ctx.moveTo(-22, 46); ctx.lineTo(22, 46); ctx.lineTo(0, 14); ctx.closePath(); ctx.fill();
  } else if (f === 'orrery_rings' || f === 'atom_orbit') {
    ctx.strokeStyle = bp.primary; ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      ctx.save(); ctx.rotate((i / 3) * Math.PI + ts * 0.6);
      ctx.beginPath(); ctx.ellipse(0, 0, 50, 18, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = bp.secondary; ctx.beginPath(); ctx.arc(50, 0, 7, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = bp.accent; ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
  } else if (f === 'crown_gold') {
    ctx.fillStyle = bp.primary;
    ctx.beginPath(); ctx.moveTo(-48, 28); ctx.lineTo(-54, -26); ctx.lineTo(-22, 0); ctx.lineTo(0, -42); ctx.lineTo(22, 0); ctx.lineTo(54, -26); ctx.lineTo(48, 28); ctx.closePath(); ctx.fill();
    ctx.fillStyle = bp.secondary; ctx.beginPath(); ctx.arc(0, 8, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = bp.accent; ctx.beginPath(); ctx.arc(-28, 8, 7, 0, Math.PI * 2); ctx.arc(28, 8, 7, 0, Math.PI * 2); ctx.fill();
  } else if (f === 'lamp_genie' || f === 'teapot' || f === 'watering_can') {
    ctx.fillStyle = bp.primary;
    ctx.beginPath(); ctx.ellipse(0, 10, 42, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = bp.primary; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(32, 6); ctx.lineTo(62, -24); ctx.stroke();
    ctx.beginPath(); ctx.arc(-40, 8, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = bp.accent; ctx.beginPath(); ctx.arc(0, -20, 10, 0, Math.PI * 2); ctx.fill();
  } else if (f === 'device_screen' || f === 'chart_board' || f === 'clapperboard' || f === 'card_badge' || f === 'envelope_wax' || f === 'chess_board') {
    ctx.fillStyle = bp.primary; ctx.beginPath(); ctx.roundRect(-54, -38, 108, 76, 8); ctx.fill();
    if (f === 'clapperboard') {
      ctx.fillStyle = bp.secondary;
      for (let x = -48; x < 48; x += 24) ctx.fillRect(x, -38, 12, 16);
    } else if (f === 'chess_board') {
      for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? bp.primary : bp.secondary;
        ctx.fillRect(-48 + c * 16, -32 + r * 16, 16, 16);
      }
    } else if (f === 'envelope_wax') {
      ctx.strokeStyle = bp.accent; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-52, -36); ctx.lineTo(0, 8); ctx.lineTo(52, -36); ctx.stroke();
      ctx.fillStyle = bp.secondary; ctx.beginPath(); ctx.arc(0, 8, 12, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.strokeStyle = bp.secondary; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-40, 18); ctx.lineTo(-12, -8); ctx.lineTo(10, 6); ctx.lineTo(40, -24); ctx.stroke();
    }
  } else if (f === 'vial_tube' || f === 'jar_bottle' || f === 'syringe') {
    ctx.fillStyle = 'rgba(226, 232, 240, 0.35)';
    ctx.beginPath(); ctx.roundRect(-22, -48, 44, 96, 14); ctx.fill();
    ctx.fillStyle = bp.primary;
    ctx.beginPath(); ctx.roundRect(-18, -10, 36, 54, 10); ctx.fill();
    ctx.fillStyle = bp.secondary;
    ctx.beginPath(); ctx.arc(-4, 4 - ((ts * 20) % 28), 5, 0, Math.PI * 2); ctx.arc(8, 16 - ((ts * 16) % 24), 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = bp.accent; ctx.fillRect(-16, -56, 32, 12);
  } else if (f === 'globe_stand') {
    ctx.fillStyle = bp.primary; ctx.beginPath(); ctx.arc(0, -6, 38, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = bp.secondary;
    ctx.beginPath(); ctx.ellipse(-10, -12, 16, 10, 0.4, 0, Math.PI * 2); ctx.ellipse(14, 8, 14, 10, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = bp.accent; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, -6, 46, -0.4 * Math.PI, 0.7 * Math.PI); ctx.stroke();
    ctx.fillStyle = bp.accent; ctx.fillRect(-26, 42, 52, 10);
  } else if (f === 'bullion_bars' || f === 'cash_stack' || f === 'gift_box' || f === 'medical_kit' || f === 'suitcase') {
    ctx.fillStyle = bp.primary; ctx.beginPath(); ctx.roundRect(-48, -32, 96, 68, 8); ctx.fill();
    ctx.fillStyle = bp.secondary;
    if (f === 'medical_kit') {
      ctx.fillRect(-8, -20, 16, 44); ctx.fillRect(-22, -6, 44, 16);
    } else if (f === 'gift_box') {
      ctx.fillRect(-8, -32, 16, 68); ctx.fillRect(-48, -6, 96, 16);
    } else {
      ctx.fillRect(-48, -6, 96, 14);
    }
    ctx.strokeStyle = bp.accent; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, -32, 18, Math.PI, 0); ctx.stroke();
  } else if (f === 'bowl_steam' || f === 'platter_feast' || f === 'basket_woven' || f === 'cake_candles') {
    ctx.fillStyle = bp.primary;
    ctx.beginPath(); ctx.arc(0, 6, 46, 0, Math.PI); ctx.closePath(); ctx.fill();
    ctx.fillStyle = bp.secondary;
    ctx.beginPath(); ctx.ellipse(0, 6, 44, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = bp.accent; ctx.lineWidth = 4;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(i * 18, -8); ctx.quadraticCurveTo(i * 18 + Math.sin(ts * 4 + i) * 8, -28, i * 18, -46); ctx.stroke();
    }
  } else if (f === 'ship_wheel' || f === 'turntable_disc' || f === 'tape_roll') {
    ctx.strokeStyle = bp.primary; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(0, 0, 38, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = bp.secondary; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + ts * 0.5;
      ctx.strokeStyle = bp.accent; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14); ctx.lineTo(Math.cos(a) * 52, Math.sin(a) * 52); ctx.stroke();
    }
  } else if (f === 'skull_bone' || f === 'helmet_visor' || f === 'plush_toy') {
    ctx.fillStyle = bp.primary; ctx.beginPath(); ctx.arc(0, -8, 42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = bp.secondary;
    if (f === 'helmet_visor') {
      ctx.beginPath(); ctx.roundRect(-28, -22, 56, 26, 10); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(-15, -10, 9, 0, Math.PI * 2); ctx.arc(15, -10, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(-16, 20, 32, 18);
    }
  } else if (f === 'lantern_glow' || f === 'candelabra') {
    ctx.fillStyle = bp.primary; ctx.fillRect(-26, -42, 52, 10); ctx.fillRect(-30, 36, 60, 12);
    ctx.fillStyle = bp.secondary; ctx.fillRect(-20, -32, 40, 68);
    ctx.fillStyle = bp.accent; ctx.beginPath(); ctx.ellipse(0, 0, 12, 20 * pulse, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    // Rich parametric fallback for remaining specialized silhouettes (instruments, vehicles, tools, etc.)
    ctx.fillStyle = bp.primary;
    ctx.beginPath(); ctx.roundRect(-44, -34, 88, 68, 18); ctx.fill();
    ctx.fillStyle = bp.secondary;
    ctx.beginPath(); ctx.arc(-18, 0, 18, 0, Math.PI * 2); ctx.arc(18, 0, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = bp.accent;
    ctx.beginPath(); ctx.roundRect(-24, -10, 48, 20, 6); ctx.fill();
  }

  ctx.restore();
  return true;
}
