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
  | 'golden_sun_temple';

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
];

export type CustomPropPresetId =
  | 'crystal_orb'
  | 'relic_chest'
  | 'ancient_key'
  | 'paper_lantern'
  | 'ritual_dagger'
  | 'lotus_chalice'
  | 'rune_scroll'
  | 'spirit_mask';

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
];

export type ActArcPresetId =
  | 'mythic_odyssey'
  | 'noir_mystery'
  | 'royal_chronicle'
  | 'fable_journey'
  | 'elemental_storm';

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
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${pal.skyTop}"/><stop offset="55%" stop-color="${pal.skyMid}"/><stop offset="100%" stop-color="${pal.skyLow}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><circle cx="${Math.round(w * 0.5)}" cy="${Math.round(h * 0.34)}" r="${Math.round(h * 0.16)}" fill="${pal.glow}" opacity="0.85"/><rect y="${Math.round(h * 0.76)}" width="${w}" height="${Math.round(h * 0.24)}" fill="${pal.ground}"/></svg>`;
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
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${Math.round(size * 0.34)}" fill="${tint}" stroke="#f2c85b" stroke-width="10"/></svg>`;
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
