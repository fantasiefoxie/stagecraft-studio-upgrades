/**
 * Stagecraft Studio — Wave 5 Atmospheric, Crowd, Weather & Beat FX Atlas (+82 Elements)
 *
 * Adds:
 * - +24 Mood Palettes (MoodId: 16 -> 40 total)
 * - +18 Weather Systems (WeatherId: 12 -> 30 total)
 * - +18 Reactive Crowd Silhouette Layers (CrowdId: 12 -> 30 total)
 * - +22 Kinetic Beat FX Overlays (FxId: 14 -> 36 total)
 *
 * Strictly deterministic pure Canvas 2D functions of (ctx, w, h, id, ..., t).
 * Zero Math.random(), zero offscreen canvas allocations.
 */
import { CrowdId, FxId, MoodId, StoryBeat, WeatherId } from './types';
import type { MoodPalette } from './renderAssets';

export type AtlasMoodId = Extract<
  MoodId,
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
  | 'obsidian_gold'
>;

export const ATLAS_MOOD_PALETTES: Record<AtlasMoodId, MoodPalette> = {
  golden_hour_cinema: {
    skyTop: '#2c1622',
    skyMid: '#9a3d26',
    skyLow: '#f59e0b',
    farSil: '#3b1d1e',
    ground: '#261414',
    path: '#5e3224',
    moon: '#fffbeb',
    rimLight: '#fde047',
    accent: '#fb923c',
    shadowTint: '#36161d',
  },
  neon_tokyo_blue: {
    skyTop: '#03071e',
    skyMid: '#0a194e',
    skyLow: '#113c7d',
    farSil: '#060c26',
    ground: '#050819',
    path: '#142754',
    moon: '#7dd3fc',
    rimLight: '#38bdf8',
    accent: '#ff2bd6',
    shadowTint: '#081236',
  },
  pastel_storybook: {
    skyTop: '#7c93d6',
    skyMid: '#b5b8ec',
    skyLow: '#fce7f3',
    farSil: '#6366a8',
    ground: '#4a5580',
    path: '#838bbf',
    moon: '#fffef5',
    rimLight: '#fbcfe8',
    accent: '#f472b6',
    shadowTint: '#4f558a',
  },
  desert_mirage: {
    skyTop: '#451a03',
    skyMid: '#b45309',
    skyLow: '#fcd34d',
    farSil: '#5c280b',
    ground: '#3d1c0a',
    path: '#92400e',
    moon: '#fef9c3',
    rimLight: '#fde68a',
    accent: '#f97316',
    shadowTint: '#47210c',
  },
  toxic_wasteland: {
    skyTop: '#0c1409',
    skyMid: '#1e3314',
    skyLow: '#4d7c0f',
    farSil: '#14210c',
    ground: '#0f170a',
    path: '#2b3d17',
    moon: '#bef264',
    rimLight: '#a3e635',
    accent: '#84cc16',
    shadowTint: '#15240b',
  },
  lavender_twilight: {
    skyTop: '#1e1038',
    skyMid: '#4c1d95',
    skyLow: '#c084fc',
    farSil: '#2e1065',
    ground: '#1d0d36',
    path: '#44226e',
    moon: '#f5f3ff',
    rimLight: '#e9d5ff',
    accent: '#f472b6',
    shadowTint: '#2b1252',
  },
  cobalt_midnight: {
    skyTop: '#020617',
    skyMid: '#0f2557',
    skyLow: '#1d4ed8',
    farSil: '#091536',
    ground: '#071026',
    path: '#172e66',
    moon: '#dbeafe',
    rimLight: '#60a5fa',
    accent: '#38bdf8',
    shadowTint: '#0b1a40',
  },
  autumn_amber: {
    skyTop: '#291009',
    skyMid: '#7c2d12',
    skyLow: '#ea580c',
    farSil: '#3f170a',
    ground: '#2b1109',
    path: '#6b2c15',
    moon: '#ffedd5',
    rimLight: '#fdba74',
    accent: '#f59e0b',
    shadowTint: '#3b1509',
  },
  spring_meadow: {
    skyTop: '#1e6091',
    skyMid: '#52b788',
    skyLow: '#d8f3dc',
    farSil: '#2d6a4f',
    ground: '#1b4332',
    path: '#40916c',
    moon: '#ffffff',
    rimLight: '#b7e4c7',
    accent: '#facc15',
    shadowTint: '#234f3c',
  },
  blood_moon_crimson: {
    skyTop: '#120205',
    skyMid: '#450a0a',
    skyLow: '#991b1b',
    farSil: '#1f0507',
    ground: '#140305',
    path: '#3d0c11',
    moon: '#ef4444',
    rimLight: '#fca5a5',
    accent: '#dc2626',
    shadowTint: '#290509',
  },
  ice_palace_cyan: {
    skyTop: '#082f49',
    skyMid: '#0284c7',
    skyLow: '#bae6fd',
    farSil: '#0c4a6e',
    ground: '#0a3350',
    path: '#38bdf8',
    moon: '#f0f9ff',
    rimLight: '#e0f2fe',
    accent: '#22d3ee',
    shadowTint: '#0d3e5e',
  },
  vintage_kodachrome: {
    skyTop: '#263842',
    skyMid: '#5c7a7c',
    skyLow: '#e0b973',
    farSil: '#2d3b3e',
    ground: '#29241e',
    path: '#6e5c45',
    moon: '#fef3c7',
    rimLight: '#f3d08a',
    accent: '#d9483b',
    shadowTint: '#2d2822',
  },
  emerald_matrix: {
    skyTop: '#021208',
    skyMid: '#064e3b',
    skyLow: '#059669',
    farSil: '#042f24',
    ground: '#031c15',
    path: '#0a4031',
    moon: '#a7f3d0',
    rimLight: '#34d399',
    accent: '#10b981',
    shadowTint: '#052b20',
  },
  royal_amethyst: {
    skyTop: '#170626',
    skyMid: '#3b0764',
    skyLow: '#7e22ce',
    farSil: '#220938',
    ground: '#160624',
    path: '#4a1773',
    moon: '#f3e8ff',
    rimLight: '#d8b4fe',
    accent: '#facc15',
    shadowTint: '#250a3d',
  },
  storm_slate: {
    skyTop: '#0f172a',
    skyMid: '#334155',
    skyLow: '#64748b',
    farSil: '#1e293b',
    ground: '#111827',
    path: '#374151',
    moon: '#e2e8f0',
    rimLight: '#94a3b8',
    accent: '#38bdf8',
    shadowTint: '#1e293b',
  },
  sunset_coral: {
    skyTop: '#31102f',
    skyMid: '#be185d',
    skyLow: '#fb7185',
    farSil: '#4a153b',
    ground: '#2b0d24',
    path: '#6e2347',
    moon: '#ffe4e6',
    rimLight: '#fda4af',
    accent: '#fbbf24',
    shadowTint: '#3d1230',
  },
  candyland_pop: {
    skyTop: '#ec4899',
    skyMid: '#f472b6',
    skyLow: '#fef08a',
    farSil: '#a21caf',
    ground: '#701a75',
    path: '#f9a8d4',
    moon: '#ffffff',
    rimLight: '#fef08a',
    accent: '#38bdf8',
    shadowTint: '#86198f',
  },
  deep_space_void: {
    skyTop: '#010208',
    skyMid: '#070b1e',
    skyLow: '#111936',
    farSil: '#050814',
    ground: '#03050d',
    path: '#141e3d',
    moon: '#c7d2fe',
    rimLight: '#818cf8',
    accent: '#22d3ee',
    shadowTint: '#060a1c',
  },
  copper_steampunk: {
    skyTop: '#1f120b',
    skyMid: '#59301c',
    skyLow: '#b45309',
    farSil: '#2e190f',
    ground: '#1c100a',
    path: '#5c341d',
    moon: '#fde68a',
    rimLight: '#f59e0b',
    accent: '#38bdf8',
    shadowTint: '#2b170e',
  },
  candlelit_parchment: {
    skyTop: '#261b12',
    skyMid: '#57412c',
    skyLow: '#c29b61',
    farSil: '#362719',
    ground: '#241a11',
    path: '#6b5136',
    moon: '#fef3c7',
    rimLight: '#fde68a',
    accent: '#d97706',
    shadowTint: '#332417',
  },
  ocean_turquoise: {
    skyTop: '#042f2e',
    skyMid: '#0f766e',
    skyLow: '#5eead4',
    farSil: '#064e4b',
    ground: '#042b2a',
    path: '#115e59',
    moon: '#ccfbf1',
    rimLight: '#99f6e4',
    accent: '#fbbf24',
    shadowTint: '#083b3a',
  },
  monsoon_indigo: {
    skyTop: '#090d24',
    skyMid: '#1e2759',
    skyLow: '#3b4a8c',
    farSil: '#111738',
    ground: '#0c1129',
    path: '#253166',
    moon: '#c7d2fe',
    rimLight: '#818cf8',
    accent: '#38bdf8',
    shadowTint: '#141b40',
  },
  solarpunk_lime: {
    skyTop: '#0f4c5c',
    skyMid: '#2a9d8f',
    skyLow: '#d9ed92',
    farSil: '#1b5e57',
    ground: '#16423c',
    path: '#52b788',
    moon: '#fefae0',
    rimLight: '#d9ed92',
    accent: '#f4a261',
    shadowTint: '#1b4d46',
  },
  obsidian_gold: {
    skyTop: '#050507',
    skyMid: '#171412',
    skyLow: '#3b2c15',
    farSil: '#0c0b0d',
    ground: '#09080a',
    path: '#2e2414',
    moon: '#fef08a',
    rimLight: '#facc15',
    accent: '#eab308',
    shadowTint: '#14110f',
  },
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// =========================================================================
// 2. ATLAS WEATHER SYSTEMS (+18 NEW WEATHERS -> 30 TOTAL)
// =========================================================================
export function drawAtlasWeather(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  weather: WeatherId,
  pal: MoodPalette,
  t: number
): boolean {
  const s = Math.min(w, h) / 620;

  if (weather === 'autumn_leaves') {
    const colors = ['#ea580c', '#dc2626', '#f59e0b', '#b45309'];
    for (let i = 0; i < 28; i++) {
      const lx = (((i * 97 + Math.sin(t * 1.5 + i) * 60 + t * 32) % w) + w) % w;
      const ly = ((t * (38 + (i % 4) * 10) * s + i * 71) % (h + 40)) - 20;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(t * 2.1 + i * 0.7);
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.moveTo(0, -9 * s);
      ctx.quadraticCurveTo(8 * s, -2 * s, 0, 9 * s);
      ctx.quadraticCurveTo(-8 * s, -2 * s, 0, -9 * s);
      ctx.fill();
      ctx.restore();
    }
    return true;
  }

  if (weather === 'floating_lanterns') {
    for (let i = 0; i < 16; i++) {
      const lx = (((i * 127 + Math.sin(t * 0.7 + i * 1.3) * 34) % w) + w) % w;
      const ly = h - (((t * (18 + (i % 4) * 5) * s + i * 95) % (h + 80)) - 20);
      const sc = (0.65 + (i % 3) * 0.25) * s;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.fillStyle = 'rgba(251, 146, 60, 0.24)';
      ctx.beginPath(); ctx.arc(0, 0, 22 * sc, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.beginPath(); ctx.roundRect(-9 * sc, -13 * sc, 18 * sc, 24 * sc, 5 * sc); ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.arc(0, 5 * sc, 5 * sc, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    return true;
  }

  if (weather === 'underwater_bubbles') {
    for (let i = 0; i < 32; i++) {
      const bx = (((i * 83 + Math.sin(t * 2.2 + i) * 18) % w) + w) % w;
      const by = h - ((t * (48 + (i % 5) * 14) * s + i * 67) % (h + 40));
      const r = (3 + (i % 5) * 2.1) * s;
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
      ctx.lineWidth = 1.6 * s;
      ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.arc(bx - r * 0.3, by - r * 0.3, r * 0.28, 0, Math.PI * 2); ctx.fill();
    }
    return true;
  }

  if (weather === 'confetti_shower') {
    const palette = ['#f43f5e', '#38bdf8', '#facc15', '#34d399', '#a855f7', '#fb923c'];
    for (let i = 0; i < 42; i++) {
      const cx = (((i * 71 + Math.sin(t * 2.8 + i) * 44) % w) + w) % w;
      const cy = ((t * (68 + (i % 5) * 18) * s + i * 53) % (h + 40)) - 20;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 4.5 + i);
      ctx.fillStyle = palette[i % palette.length];
      ctx.fillRect(-5 * s, -2.6 * s, 10 * s, 5.2 * s);
      ctx.restore();
    }
    return true;
  }

  if (weather === 'ash_fallout') {
    for (let i = 0; i < 38; i++) {
      const ax = (((i * 89 + t * 22 + Math.sin(t * 1.4 + i) * 28) % w) + w) % w;
      const ay = ((t * (30 + (i % 4) * 9) * s + i * 61) % (h + 30)) - 15;
      ctx.fillStyle = i % 5 === 0 ? 'rgba(249, 115, 22, 0.65)' : 'rgba(148, 163, 184, 0.52)';
      ctx.beginPath();
      ctx.ellipse(ax, ay, (2.2 + (i % 3)) * s, 1.5 * s, t + i, 0, Math.PI * 2);
      ctx.fill();
    }
    return true;
  }

  if (weather === 'acid_rain') {
    ctx.strokeStyle = 'rgba(163, 230, 53, 0.62)';
    ctx.lineWidth = 2 * s;
    for (let i = 0; i < 46; i++) {
      const rx = ((i * 79 + t * 180) % (w + 100)) - 50;
      const ry = ((i * 113 + t * 920) % (h + 100)) - 50;
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 9 * s, ry + 30 * s); ctx.stroke();
    }
    return true;
  }

  if (weather === 'aurora_ribbons') {
    ctx.save();
    for (let band = 0; band < 3; band++) {
      ctx.beginPath();
      const baseY = h * (0.14 + band * 0.09);
      ctx.moveTo(0, baseY);
      for (let x = 0; x <= w; x += Math.max(24, w / 24)) {
        const wy = baseY + Math.sin(x * 0.008 + t * (0.7 + band * 0.25) + band * 2) * 34 * s;
        ctx.lineTo(x, wy);
      }
      ctx.strokeStyle = band === 0 ? 'rgba(52, 211, 153, 0.28)' : band === 1 ? 'rgba(56, 189, 248, 0.24)' : 'rgba(192, 132, 252, 0.22)';
      ctx.lineWidth = 36 * s;
      ctx.stroke();
    }
    ctx.restore();
    return true;
  }

  if (weather === 'dandelion_seeds') {
    for (let i = 0; i < 24; i++) {
      const dx = (((i * 101 + t * 34 + Math.sin(t * 1.1 + i) * 38) % w) + w) % w;
      const dy = (((i * 73 + Math.cos(t * 0.9 + i * 1.2) * 42) % (h * 0.85)) + h * 0.85) % (h * 0.85);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx, dy + 8 * s); ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.beginPath(); ctx.arc(dx, dy, 3.4 * s, 0, Math.PI * 2); ctx.fill();
    }
    return true;
  }

  if (weather === 'meteor_shower') {
    for (let i = 0; i < 12; i++) {
      const ph = (t * 0.85 + i * 0.29) % 1;
      const mx = w * (0.05 + ((i * 37) % 90) * 0.01) + ph * w * 0.42;
      const my = h * (0.02 + (i % 4) * 0.08) + ph * h * 0.56;
      ctx.save();
      ctx.globalAlpha = Math.sin(ph * Math.PI);
      ctx.strokeStyle = i % 3 === 0 ? '#fb923c' : '#fef08a';
      ctx.lineWidth = 3.2 * s;
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx - 68 * s, my - 42 * s); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(mx, my, 4 * s, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    return true;
  }

  if (weather === 'neon_sparks') {
    for (let i = 0; i < 34; i++) {
      const sx = (((i * 89 + Math.sin(t * 6 + i * 2.1) * 40) % w) + w) % w;
      const sy = ((t * (140 + (i % 5) * 35) * s + i * 83) % (h + 40)) - 20;
      ctx.strokeStyle = i % 2 === 0 ? '#00f0ff' : '#ff2bd6';
      ctx.lineWidth = 2.2 * s;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 6 * s, sy - 14 * s); ctx.stroke();
    }
    return true;
  }

  if (weather === 'golden_pollen') {
    for (let i = 0; i < 36; i++) {
      const px = (((i * 93 + Math.sin(t * 1.1 + i * 1.7) * 48 + t * 18) % w) + w) % w;
      const py = (((i * 67 + Math.cos(t * 1.3 + i) * 36) % h) + h) % h;
      const a = 0.35 + 0.55 * Math.abs(Math.sin(t * 2 + i));
      ctx.fillStyle = `rgba(253, 224, 71, ${a.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(px, py, (2.2 + (i % 3) * 1.3) * s, 0, Math.PI * 2); ctx.fill();
    }
    return true;
  }

  if (weather === 'plasma_arcs') {
    for (let i = 0; i < 5; i++) {
      const pulse = Math.sin(t * 7 + i * 1.9);
      if (pulse < 0.25) continue;
      const x0 = w * (0.1 + i * 0.2);
      const y0 = h * (0.12 + (i % 2) * 0.14);
      ctx.strokeStyle = i % 2 === 0 ? '#38bdf8' : '#c084fc';
      ctx.lineWidth = 2.6 * s;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + 26 * s, y0 + 48 * s);
      ctx.lineTo(x0 - 18 * s, y0 + 96 * s);
      ctx.lineTo(x0 + 32 * s, y0 + 144 * s);
      ctx.stroke();
    }
    return true;
  }

  if (weather === 'hailstorm') {
    ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
    for (let i = 0; i < 42; i++) {
      const hx = ((i * 73 + t * 260) % (w + 80)) - 40;
      const hy = ((i * 101 + t * 880) % (h + 80)) - 40;
      ctx.beginPath(); ctx.arc(hx, hy, (3.2 + (i % 3)) * s, 0, Math.PI * 2); ctx.fill();
    }
    return true;
  }

  if (weather === 'blizzard_gale') {
    for (let i = 0; i < 52; i++) {
      const sx = ((i * 67 + t * 440) % (w + 100)) - 50;
      const sy = ((i * 89 + t * 240 + Math.sin(t * 3 + i) * 20) % (h + 60)) - 30;
      ctx.fillStyle = 'rgba(241, 245, 249, 0.82)';
      ctx.fillRect(sx, sy, (8 + (i % 4) * 3) * s, 2.5 * s);
    }
    return true;
  }

  if (weather === 'fog_bank') {
    for (let i = 0; i < 7; i++) {
      const fx = (((i * 210 + t * (16 + i * 4)) % (w + 420)) - 210);
      const fy = h * (0.48 + i * 0.08);
      ctx.fillStyle = 'rgba(226, 232, 240, 0.14)';
      ctx.beginPath(); ctx.ellipse(fx, fy, 220 * s, 46 * s, 0, 0, Math.PI * 2); ctx.fill();
    }
    return true;
  }

  if (weather === 'locust_swarm') {
    ctx.fillStyle = 'rgba(69, 43, 18, 0.72)';
    for (let i = 0; i < 48; i++) {
      const lx = ((i * 61 + t * 340) % (w + 80)) - 40;
      const ly = h * 0.15 + ((i * 47 + Math.sin(t * 9 + i) * 26) % (h * 0.65));
      ctx.beginPath(); ctx.ellipse(lx, ly, 5.5 * s, 2.2 * s, -0.25, 0, Math.PI * 2); ctx.fill();
    }
    return true;
  }

  if (weather === 'volcanic_cinders') {
    for (let i = 0; i < 36; i++) {
      const cx = (((i * 83 + Math.sin(t * 2.4 + i) * 38) % w) + w) % w;
      const cy = h - ((t * (72 + (i % 4) * 22) * s + i * 67) % (h + 50));
      ctx.fillStyle = i % 2 === 0 ? '#f97316' : '#facc15';
      ctx.beginPath(); ctx.arc(cx, cy, (2.4 + (i % 3) * 1.4) * s, 0, Math.PI * 2); ctx.fill();
    }
    return true;
  }

  if (weather === 'starlight_dust') {
    for (let i = 0; i < 40; i++) {
      const sx = (((i * 107 + Math.sin(t * 0.6 + i) * 24) % w) + w) % w;
      const sy = (((i * 59 + Math.cos(t * 0.5 + i) * 20) % h) + h) % h;
      const tw = 0.25 + 0.75 * Math.abs(Math.sin(t * 3.1 + i * 1.3));
      ctx.fillStyle = i % 3 === 0 ? pal.rimLight : '#ffffff';
      ctx.globalAlpha = tw;
      ctx.beginPath(); ctx.arc(sx, sy, (1.8 + (i % 3)) * s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    return true;
  }

  return false;
}

// =========================================================================
// 3. ATLAS REACTIVE CROWD SILHOUETTES (+18 NEW CROWDS -> 30 TOTAL)
// =========================================================================
const ATLAS_CROWDS: ReadonlySet<CrowdId> = new Set<CrowdId>([
  'stadium_fans',
  'festival_dancers',
  'bazaar_merchants',
  'press_paparazzi',
  'protest_rally',
  'mech_squadron',
  'fairy_wisps',
  'undead_horde',
  'safari_herd',
  'ballroom_waltz',
  'courtroom_gallery',
  'orchestra_pit',
  'space_dock_crew',
  'tavern_patrons',
  'school_hallway',
  'roman_legion',
  'ninja_clan',
  'circus_audience',
]);

export function drawAtlasCrowdLayer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  crowd: CrowdId,
  pal: MoodPalette,
  ts: number,
  _beat: StoryBeat | undefined,
  startle: number
): boolean {
  if (!ATLAS_CROWDS.has(crowd)) return false;

  const s = Math.min(w, h) / 620;
  const baseY = h * 0.77;
  const positions = [0.05, 0.13, 0.21, 0.31, 0.69, 0.79, 0.87, 0.95];

  ctx.save();
  ctx.fillStyle = pal.farSil;
  ctx.globalAlpha = 0.8;

  for (let i = 0; i < positions.length; i++) {
    const sideDir = positions[i] < 0.5 ? -1 : 1;
    const domino = clamp(startle * 1.25 - Math.abs(positions[i] - 0.5) * 0.35, 0, 1);
    const cx = w * positions[i] + domino * 10 * s * sideDir;
    const figH = (82 + (i % 3) * 11) * s;
    const bob = Math.sin(ts * 2.8 + i * 1.3) * 3.2 * s;

    ctx.save();
    ctx.translate(cx, baseY);
    ctx.rotate(domino * 0.14 * sideDir);

    if (crowd === 'stadium_fans' || crowd === 'circus_audience') {
      const cheer = Math.abs(Math.sin(ts * 5.2 + i * 0.8)) * 9 * s;
      ctx.fillRect(-13 * s, -figH - cheer, 26 * s, figH + cheer);
      ctx.beginPath(); ctx.arc(0, -figH - 11 * s - cheer, 10 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(-22 * s, -figH - 22 * s - cheer, 6 * s, 26 * s);
      ctx.fillRect(16 * s, -figH - 22 * s - cheer, 6 * s, 26 * s);
      if (crowd === 'stadium_fans' && i % 2 === 0) {
        ctx.fillStyle = pal.accent;
        ctx.fillRect(-20 * s, -figH - 34 * s - cheer, 40 * s, 11 * s);
        ctx.fillStyle = pal.farSil;
      }
    } else if (crowd === 'festival_dancers' || crowd === 'ballroom_waltz') {
      const sway = Math.sin(ts * 3.6 + i) * 7 * s;
      ctx.beginPath();
      ctx.moveTo(-20 * s + sway, bob);
      ctx.lineTo(-9 * s, -figH * 0.85 + bob);
      ctx.lineTo(9 * s, -figH * 0.85 + bob);
      ctx.lineTo(20 * s + sway, bob);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath(); ctx.arc(0, -figH * 0.96 + bob, 10 * s, 0, Math.PI * 2); ctx.fill();
      if (crowd === 'festival_dancers') {
        ctx.fillStyle = pal.accent;
        ctx.beginPath(); ctx.arc(16 * s, -figH * 0.72 + sway, 5 * s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = pal.farSil;
      }
    } else if (crowd === 'press_paparazzi') {
      ctx.fillRect(-12 * s, -figH + bob, 24 * s, figH);
      ctx.beginPath(); ctx.arc(0, -figH - 10 * s + bob, 10 * s, 0, Math.PI * 2); ctx.fill();
      // Camera flash strobe deterministically
      if (((Math.floor(ts * 4) + i * 3) % 7) === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath(); ctx.arc(10 * s, -figH + 6 * s, 18 * s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = pal.farSil;
      }
    } else if (crowd === 'protest_rally') {
      ctx.fillRect(-12 * s, -figH + bob, 24 * s, figH);
      ctx.beginPath(); ctx.arc(0, -figH - 10 * s + bob, 10 * s, 0, Math.PI * 2); ctx.fill();
      // Picket sign
      const signBob = Math.sin(ts * 4.2 + i) * 5 * s;
      ctx.fillRect(10 * s, -figH - 46 * s + signBob, 4 * s, 56 * s);
      ctx.fillRect(-6 * s, -figH - 64 * s + signBob, 36 * s, 22 * s);
    } else if (crowd === 'mech_squadron' || crowd === 'space_dock_crew') {
      const mh = figH * 1.18;
      ctx.fillRect(-18 * s, -mh + bob, 36 * s, mh * 0.6);
      ctx.fillRect(-14 * s, -mh * 0.4, 10 * s, mh * 0.4);
      ctx.fillRect(4 * s, -mh * 0.4, 10 * s, mh * 0.4);
      ctx.fillStyle = pal.accent;
      ctx.fillRect(-10 * s, -mh + 10 * s + bob, 20 * s, 5 * s);
      ctx.fillStyle = pal.farSil;
    } else if (crowd === 'fairy_wisps') {
      const wy = -figH * 0.9 + Math.sin(ts * 3.4 + i * 1.7) * 22 * s;
      ctx.fillStyle = i % 2 === 0 ? '#a7f3d0' : '#f9a8d4';
      ctx.globalAlpha = 0.65;
      ctx.beginPath(); ctx.arc(0, wy, 12 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, wy, 4 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pal.farSil;
      ctx.globalAlpha = 0.8;
    } else if (crowd === 'undead_horde') {
      const lurch = Math.sin(ts * 2.1 + i * 1.4) * 0.16;
      ctx.rotate(lurch);
      ctx.fillRect(-11 * s, -figH * 0.9, 22 * s, figH * 0.9);
      ctx.beginPath(); ctx.arc(3 * s, -figH * 0.98, 9 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(8 * s, -figH * 0.78, 22 * s, 6 * s);
    } else if (crowd === 'safari_herd') {
      // Quadruped animal silhouettes
      ctx.beginPath(); ctx.ellipse(0, -34 * s + bob * 0.5, 28 * s, 15 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(-20 * s, -24 * s, 6 * s, 24 * s);
      ctx.fillRect(14 * s, -24 * s, 6 * s, 24 * s);
      ctx.beginPath(); ctx.arc(24 * s * -sideDir, -46 * s + bob * 0.5, 10 * s, 0, Math.PI * 2); ctx.fill();
    } else if (crowd === 'roman_legion' || crowd === 'ninja_clan') {
      ctx.fillRect(-14 * s, -figH + bob, 28 * s, figH);
      ctx.beginPath(); ctx.arc(0, -figH - 10 * s + bob, 10 * s, 0, Math.PI * 2); ctx.fill();
      if (crowd === 'roman_legion') {
        // Plumed crest + spear
        ctx.fillStyle = pal.accent;
        ctx.fillRect(-4 * s, -figH - 28 * s + bob, 8 * s, 14 * s);
        ctx.fillStyle = pal.farSil;
        ctx.fillRect(16 * s, -figH - 52 * s, 3 * s, figH + 52 * s);
      } else {
        // Ninja katana hilt across back
        ctx.save();
        ctx.rotate(0.45);
        ctx.fillRect(-2 * s, -figH - 26 * s, 4 * s, 42 * s);
        ctx.restore();
      }
    } else if (crowd === 'orchestra_pit') {
      // Seated musicians with violin bows / music stands
      ctx.fillRect(-11 * s, -figH * 0.65 + bob, 22 * s, figH * 0.65);
      ctx.beginPath(); ctx.arc(0, -figH * 0.74 + bob, 9 * s, 0, Math.PI * 2); ctx.fill();
      const bow = Math.sin(ts * 5 + i) * 8 * s;
      ctx.strokeStyle = pal.rimLight;
      ctx.lineWidth = 2 * s;
      ctx.beginPath(); ctx.moveTo(-14 * s, -figH * 0.56); ctx.lineTo(14 * s, -figH * 0.62 + bow); ctx.stroke();
    } else {
      // bazaar_merchants, courtroom_gallery, tavern_patrons, school_hallway
      ctx.fillRect(-13 * s, -figH * 0.92 + bob, 26 * s, figH * 0.92);
      ctx.beginPath(); ctx.arc(0, -figH - 8 * s + bob, 10 * s, 0, Math.PI * 2); ctx.fill();
      if (crowd === 'bazaar_merchants') {
        ctx.beginPath(); ctx.arc(0, -figH - 14 * s + bob, 14 * s, Math.PI, 0); ctx.fill();
      } else if (crowd === 'tavern_patrons') {
        ctx.fillStyle = pal.accent;
        ctx.fillRect(14 * s, -figH * 0.68 + bob, 9 * s, 12 * s);
        ctx.fillStyle = pal.farSil;
      }
    }

    ctx.restore();
  }

  ctx.restore();
  return true;
}

// =========================================================================
// 4. ATLAS KINETIC BEAT FX (+22 NEW FX -> 36 TOTAL)
// =========================================================================
export function drawAtlasBeatFx(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  fx: FxId,
  u: number,
  t: number
): boolean {
  const s = Math.min(w, h) / 620;
  const cx = w / 2;
  const cy = h * 0.5;
  const fade = Math.sin(clamp(u, 0, 1) * Math.PI);

  if (fx === 'anime_impact_frame') {
    const spike = u < 0.25 ? 1 - u / 0.25 : 0.25 * fade;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = `rgba(255,255,255,${(spike * 0.55).toFixed(3)})`;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 90 * s, Math.sin(a) * 90 * s);
      ctx.lineTo(Math.cos(a + 0.06) * w * 0.7, Math.sin(a + 0.06) * w * 0.7);
      ctx.lineTo(Math.cos(a - 0.06) * w * 0.7, Math.sin(a - 0.06) * w * 0.7);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    return true;
  }

  if (fx === 'chromatic_split') {
    const shift = (8 + Math.sin(t * 28) * 6) * s * Math.max(0.25, fade);
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 40, 100, 0.45)';
    ctx.lineWidth = 6 * s;
    ctx.strokeRect(shift, shift * 0.5, w - shift * 2, h - shift);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.strokeRect(-shift, -shift * 0.5, w, h);
    ctx.restore();
    return true;
  }

  if (fx === 'lens_flare_sweep') {
    const fxPos = w * (0.1 + u * 0.8);
    ctx.save();
    ctx.globalAlpha = 0.6 * Math.max(0.3, fade);
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(0, cy - 3 * s, w, 6 * s);
    for (let i = 0; i < 4; i++) {
      const ox = fxPos + (i - 1.5) * 90 * s;
      ctx.beginPath(); ctx.arc(ox, cy, (14 + i * 10) * s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    return true;
  }

  if (fx === 'portal_vortex') {
    ctx.save();
    ctx.translate(cx, cy);
    for (let r = 0; r < 6; r++) {
      ctx.rotate(t * 1.4 + r * 0.5);
      ctx.strokeStyle = r % 2 === 0 ? 'rgba(168, 85, 247, 0.58)' : 'rgba(56, 189, 248, 0.52)';
      ctx.lineWidth = (5 - r * 0.6) * s;
      ctx.beginPath();
      ctx.arc(0, 0, (42 + r * 28) * s, 0, Math.PI * 1.45);
      ctx.stroke();
    }
    ctx.restore();
    return true;
  }

  if (fx === 'time_freeze_ripple') {
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const rad = ((u * 420 + i * 85) % 440) * s;
      ctx.strokeStyle = `rgba(125, 211, 252, ${(0.55 - i * 0.1).toFixed(2)})`;
      ctx.lineWidth = 4 * s;
      ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
    return true;
  }

  if (fx === 'sonic_boom_rings') {
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const prog = (u + i * 0.22) % 1;
      ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - prog) * 0.7})`;
      ctx.lineWidth = (8 - i * 2) * s;
      ctx.beginPath();
      ctx.ellipse(cx, cy, prog * w * 0.48, prog * h * 0.36, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    return true;
  }

  if (fx === 'ink_splatter_burst') {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.62)';
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const dist = (70 + ((i * 37) % 150)) * s * (0.5 + u * 0.6);
      const rad = (8 + (i % 5) * 4) * s;
      ctx.beginPath(); ctx.arc(Math.cos(a) * dist, Math.sin(a) * dist, rad, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    return true;
  }

  if (fx === 'holographic_scan') {
    const scanY = (t * 220 * s) % h;
    ctx.save();
    ctx.fillStyle = 'rgba(34, 211, 238, 0.25)';
    ctx.fillRect(0, scanY - 14 * s, w, 28 * s);
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(0, scanY, w, 3 * s);
    ctx.restore();
    return true;
  }

  if (fx === 'lightning_web') {
    ctx.save();
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.85)';
    ctx.lineWidth = 3 * s;
    for (let b = 0; b < 6; b++) {
      const a = (b / 6) * Math.PI * 2 + Math.floor(t * 10) * 0.15;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let step = 1; step <= 4; step++) {
        const j = Math.sin(step * 4.3 + b * 2.1 + t * 14) * 22 * s;
        ctx.lineTo(cx + Math.cos(a) * step * 70 * s + j, cy + Math.sin(a) * step * 70 * s - j);
      }
      ctx.stroke();
    }
    ctx.restore();
    return true;
  }

  if (fx === 'petal_cyclone') {
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 24; i++) {
      const a = t * 3.2 + (i / 24) * Math.PI * 2;
      const rad = (60 + (i % 6) * 34) * s;
      ctx.fillStyle = i % 2 === 0 ? '#f472b6' : '#fce7f3';
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * rad, Math.sin(a) * rad * 0.65, 9 * s, 4.5 * s, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return true;
  }

  if (fx === 'fire_breath_cone') {
    ctx.save();
    const grad = ctx.createLinearGradient(w * 0.12, cy, w * 0.88, cy);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.75)');
    grad.addColorStop(0.5, 'rgba(249, 115, 22, 0.55)');
    grad.addColorStop(1, 'rgba(220, 38, 38, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(w * 0.12, cy);
    ctx.lineTo(w * 0.9, cy - 150 * s);
    ctx.lineTo(w * 0.9, cy + 150 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return true;
  }

  if (fx === 'frost_crystallize') {
    ctx.save();
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.72)';
    ctx.lineWidth = 3 * s;
    const corners = [[0, 0], [w, 0], [0, h], [w, h]];
    for (let c = 0; c < corners.length; c++) {
      const [ox, oy] = corners[c];
      const sx = ox === 0 ? 1 : -1;
      const sy = oy === 0 ? 1 : -1;
      for (let k = 0; k < 5; k++) {
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + sx * (60 + k * 28) * s, oy + sy * (130 - k * 22) * s);
        ctx.stroke();
      }
    }
    ctx.restore();
    return true;
  }

  if (fx === 'shadow_tendrils') {
    ctx.save();
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.lineWidth = 10 * s;
    for (let i = 0; i < 8; i++) {
      const startX = i < 4 ? 0 : w;
      const dir = i < 4 ? 1 : -1;
      const sy = h * (0.2 + (i % 4) * 0.2);
      ctx.beginPath();
      ctx.moveTo(startX, sy);
      ctx.quadraticCurveTo(startX + dir * 130 * s, sy + Math.sin(t * 4 + i) * 48 * s, startX + dir * 240 * s, sy);
      ctx.stroke();
    }
    ctx.restore();
    return true;
  }

  if (fx === 'golden_halo_burst') {
    ctx.save();
    ctx.translate(cx, h * 0.36);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.65)';
    ctx.lineWidth = 5 * s;
    ctx.beginPath(); ctx.arc(0, 0, (110 + Math.sin(t * 4) * 10) * s, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + t * 0.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 120 * s, Math.sin(a) * 120 * s);
      ctx.lineTo(Math.cos(a) * 200 * s, Math.sin(a) * 200 * s);
      ctx.stroke();
    }
    ctx.restore();
    return true;
  }

  if (fx === 'crt_scan_flash') {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    for (let y = 0; y < h; y += Math.max(6, Math.round(8 * s))) {
      ctx.fillRect(0, y, w, 2 * s);
    }
    ctx.fillStyle = 'rgba(125, 211, 252, 0.28)';
    ctx.fillRect(0, ((t * 320) % h), w, 24 * s);
    ctx.restore();
    return true;
  }

  if (fx === 'blood_moon_eclipse') {
    ctx.save();
    ctx.fillStyle = 'rgba(220, 38, 38, 0.32)';
    ctx.beginPath(); ctx.arc(cx, h * 0.28, 94 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath(); ctx.arc(cx, h * 0.28, 68 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#090205';
    ctx.beginPath(); ctx.arc(cx + 8 * s, h * 0.28, 60 * s, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return true;
  }

  if (fx === 'laser_grid') {
    ctx.save();
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.55)';
    ctx.lineWidth = 2.4 * s;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath(); ctx.moveTo(0, h * (i / 8)); ctx.lineTo(w, h * (1 - i / 8)); ctx.stroke();
    }
    ctx.restore();
    return true;
  }

  if (fx === 'starlight_nova') {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.8);
    ctx.fillStyle = 'rgba(254, 249, 195, 0.58)';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a - 0.08) * 32 * s, Math.sin(a - 0.08) * 32 * s);
      ctx.lineTo(Math.cos(a) * 180 * s, Math.sin(a) * 180 * s);
      ctx.lineTo(Math.cos(a + 0.08) * 32 * s, Math.sin(a + 0.08) * 32 * s);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    return true;
  }

  if (fx === 'comic_speed_zoom') {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2 + Math.floor(t * 12) * 0.05;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 150 * s, Math.sin(a) * 150 * s);
      ctx.lineTo(Math.cos(a - 0.05) * w * 0.72, Math.sin(a - 0.05) * w * 0.72);
      ctx.lineTo(Math.cos(a + 0.05) * w * 0.72, Math.sin(a + 0.05) * w * 0.72);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    return true;
  }

  if (fx === 'water_splash_arc') {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.72)';
    ctx.lineWidth = 7 * s;
    ctx.beginPath();
    ctx.arc(cx, h * 0.78, (110 + u * 120) * s, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
    ctx.fillStyle = '#bae6fd';
    for (let i = 0; i < 12; i++) {
      const a = Math.PI * (1.1 + (i / 11) * 0.8);
      const r = (130 + u * 130 + (i % 3) * 18) * s;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, h * 0.78 + Math.sin(a) * r, 5 * s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    return true;
  }

  if (fx === 'dust_shockwave') {
    ctx.save();
    const rad = (60 + u * 260) * s;
    ctx.strokeStyle = `rgba(217, 179, 130, ${(0.72 * (1 - u * 0.7)).toFixed(2)})`;
    ctx.lineWidth = 14 * s;
    ctx.beginPath(); ctx.ellipse(cx, h * 0.78, rad, rad * 0.28, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    return true;
  }

  if (fx === 'radar_ping') {
    ctx.save();
    ctx.translate(cx, cy);
    const rad = ((t * 140) % 240) * s;
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.65)';
    ctx.lineWidth = 3 * s;
    ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 140 * s, 0, Math.PI * 2); ctx.stroke();
    const sweep = t * 2.4;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(sweep) * 140 * s, Math.sin(sweep) * 140 * s); ctx.stroke();
    ctx.restore();
    return true;
  }

  return false;
}
