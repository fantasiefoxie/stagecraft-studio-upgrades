import {
  ArchetypeId,
  CastMember,
  ExpressionId,
  MoodId,
  MotionId,
  MotionProfileId,
  PoseId,
  PropId,
  RenderStyleId,
  StageId,
} from './types';
import {
  SceneLightingState,
  computeActorArmRig,
  computePoseEnvelope,
  getArchetypeKinematics,
  getStyleAnimationGrammar,
  snapStyleTime,
} from './animationEngine';
import {
  drawExpandedActorCloseUp,
  drawExpandedActorFullBody,
  drawExpandedStageBackdrop,
  drawExpandedStoryProp,
} from './renderAssetsExpanded';
import {
  drawEncyclopedicActorCloseUp,
  drawEncyclopedicActorFullBody,
  drawEncyclopedicStageBackdrop,
  drawEncyclopedicStoryProp,
} from './renderAssetsEncyclopedia';
import {
  drawWorldActorCloseUp,
  drawWorldActorFullBody,
  drawWorldStageBackdrop,
  drawWorldStoryProp,
} from './renderAssetsWorld';
import {
  drawUniversalActorCloseUp,
  drawUniversalActorFullBody,
  drawUniversalStageBackdrop,
  drawUniversalStoryProp,
} from './renderAssetsUniversal';
import { ATLAS_MOOD_PALETTES } from './renderAssetsAtmosphereAtlas';
import { drawAtlasActorCloseUp, drawAtlasActorFullBody } from './renderAssetsArchetypesAtlas';
import { ATLAS_INDOOR_STAGES, drawAtlasStageBackdrop } from './renderAssetsStagesAtlas';
import { drawAtlasStoryProp } from './renderAssetsPropsAtlas';
import {
  drawModularEntityCloseUp,
  drawModularEntityFullBody,
  setHeldPropRenderer,
} from './modularEntityRenderer';
import type { ActorRigRenderOptions } from './characterRigging';
import {
  drawUnifiedEyePair,
  drawUnifiedMouth,
  getExpressionHeadTilt,
} from './facialExpressions';

export interface MoodPalette {
  skyTop: string;
  skyMid: string;
  skyLow: string;
  farSil: string;
  ground: string;
  path: string;
  moon: string;
  rimLight: string;
  accent: string;
  shadowTint: string;
}

export const MOOD_PALETTES: Record<MoodId, MoodPalette> = {
  midnight_banyan: {
    skyTop: '#060a18',
    skyMid: '#0d1633',
    skyLow: '#14234d',
    farSil: '#091124',
    ground: '#08121f',
    path: '#1f2d4d',
    moon: '#edf4ff',
    rimLight: '#7da5db',
    accent: '#ff1c42',
    shadowTint: '#141e3d',
  },
  crimson_wrath: {
    skyTop: '#17060d',
    skyMid: '#360b18',
    skyLow: '#5c1225',
    farSil: '#210710',
    ground: '#12060c',
    path: '#33111d',
    moon: '#ffd9d6',
    rimLight: '#ff5268',
    accent: '#ffd04d',
    shadowTint: '#2b0b18',
  },
  golden_durbar: {
    skyTop: '#1a1009',
    skyMid: '#382112',
    skyLow: '#5c3419',
    farSil: '#26140c',
    ground: '#1c100a',
    path: '#54321c',
    moon: '#fff2bf',
    rimLight: '#ffd15c',
    accent: '#e6223c',
    shadowTint: '#301a10',
  },
  twilight_temple: {
    skyTop: '#100a1f',
    skyMid: '#231442',
    skyLow: '#3a2063',
    farSil: '#160d29',
    ground: '#0f0a1c',
    path: '#2b1e45',
    moon: '#f0e2ff',
    rimLight: '#a97ff0',
    accent: '#ff7b29',
    shadowTint: '#1f1338',
  },
  moonlit_marble: {
    skyTop: '#070d1f',
    skyMid: '#122042',
    skyLow: '#1d3263',
    farSil: '#0e1933',
    ground: '#182442',
    path: '#cedaf0',
    moon: '#f5f9ff',
    rimLight: '#c4dbfa',
    accent: '#ff3b8d',
    shadowTint: '#162445',
  },
  emerald_jungle: {
    skyTop: '#061414',
    skyMid: '#0d2b26',
    skyLow: '#17473c',
    farSil: '#091f1c',
    ground: '#071715',
    path: '#1b3d33',
    moon: '#ebffe8',
    rimLight: '#6ad1a3',
    accent: '#ffd04d',
    shadowTint: '#0e2924',
  },
  sandstone_dusk: {
    skyTop: '#1c0c12',
    skyMid: '#471a20',
    skyLow: '#7d3024',
    farSil: '#2e1116',
    ground: '#210e10',
    path: '#6b3224',
    moon: '#ffe6b8',
    rimLight: '#ffb85c',
    accent: '#ffd04d',
    shadowTint: '#36141a',
  },
  mystic_teal: {
    skyTop: '#04121a',
    skyMid: '#092736',
    skyLow: '#104457',
    farSil: '#071d29',
    ground: '#061924',
    path: '#154659',
    moon: '#dffaff',
    rimLight: '#6ef2ff',
    accent: '#ffd04d',
    shadowTint: '#0a2d3d',
  },
  cyber_magenta: {
    skyTop: '#0a041c',
    skyMid: '#24093d',
    skyLow: '#4a1163',
    farSil: '#140624',
    ground: '#0b0518',
    path: '#2e104d',
    moon: '#ffd1fa',
    rimLight: '#ff2bd6',
    accent: '#00f0ff',
    shadowTint: '#1a082e',
  },
  noir_monochrome: {
    skyTop: '#08090c',
    skyMid: '#181b22',
    skyLow: '#2b303a',
    farSil: '#0e1015',
    ground: '#0a0b0f',
    path: '#242830',
    moon: '#f1f5f9',
    rimLight: '#cbd5e1',
    accent: '#f8fafc',
    shadowTint: '#14171d',
  },
  arctic_aurora: {
    skyTop: '#041322',
    skyMid: '#0c2c44',
    skyLow: '#144c5e',
    farSil: '#0a2033',
    ground: '#0b1e2e',
    path: '#2b4f69',
    moon: '#e8fffb',
    rimLight: '#5eead4',
    accent: '#38bdf8',
    shadowTint: '#0f283b',
  },
  sunlit_morning: {
    skyTop: '#1d4d82',
    skyMid: '#4f8ec9',
    skyLow: '#f2c785',
    farSil: '#2e4e70',
    ground: '#365446',
    path: '#c49b6c',
    moon: '#fff8db',
    rimLight: '#ffe082',
    accent: '#f97316',
    shadowTint: '#2b4766',
  },
  volcanic_inferno: {
    skyTop: '#1a0605',
    skyMid: '#4a120a',
    skyLow: '#8a2711',
    farSil: '#260907',
    ground: '#1c0a08',
    path: '#541a10',
    moon: '#ffd6a5',
    rimLight: '#ff6b2b',
    accent: '#facc15',
    shadowTint: '#360d09',
  },
  deep_abyss: {
    skyTop: '#020b17',
    skyMid: '#061d33',
    skyLow: '#0b3452',
    farSil: '#041424',
    ground: '#041321',
    path: '#0f3652',
    moon: '#b8f2ff',
    rimLight: '#38bdf8',
    accent: '#2dd4bf',
    shadowTint: '#061a2e',
  },
  sakura_dawn: {
    skyTop: '#241436',
    skyMid: '#632c5c',
    skyLow: '#e695b3',
    farSil: '#331c3d',
    ground: '#291a2e',
    path: '#87556d',
    moon: '#fff0f6',
    rimLight: '#f9a8d4',
    accent: '#fb7185',
    shadowTint: '#3b1f40',
  },
  sepia_archive: {
    skyTop: '#1f160f',
    skyMid: '#3d2c1e',
    skyLow: '#6b5036',
    farSil: '#291d14',
    ground: '#21170f',
    path: '#5e462e',
    moon: '#f7ebd2',
    rimLight: '#e0c088',
    accent: '#d97706',
    shadowTint: '#302217',
  },
  ...ATLAS_MOOD_PALETTES,
};

export function snap24(t: number): number {
  return Math.floor(t * 24) / 24;
}

function darkenHex(hex: string, factor = 0.55): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#151a2e';
  const r = Math.round(parseInt(clean.slice(0, 2), 16) * factor);
  const g = Math.round(parseInt(clean.slice(2, 4), 16) * factor);
  const b = Math.round(parseInt(clean.slice(4, 6), 16) * factor);
  return `rgb(${r},${g},${b})`;
}

// =========================================================================
// 1. ALL 10 GRAPHIC-NOVEL INDIAN STORY STAGES (Lineless Chiaroscuro)
// =========================================================================
export function drawStageBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stage: StageId,
  mood: MoodId,
  t: number
): void {
  const pal = MOOD_PALETTES[mood] || MOOD_PALETTES.midnight_banyan;
  const s = Math.min(w, h) / 620;
  const ts = snap24(t);

  // Atmospheric layered sky gradient + graphic chiaroscuro bands
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.78);
  skyGrad.addColorStop(0, pal.skyTop);
  skyGrad.addColorStop(0.54, pal.skyMid);
  skyGrad.addColorStop(1, pal.skyLow);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle horizon atmospheric bounce band for cinematic depth separation
  const horizonGlow = ctx.createLinearGradient(0, h * 0.48, 0, h * 0.78);
  horizonGlow.addColorStop(0, 'rgba(0,0,0,0)');
  horizonGlow.addColorStop(0.75, pal.rimLight);
  horizonGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = horizonGlow;
  ctx.fillRect(0, h * 0.48, w, h * 0.3);
  ctx.restore();

  const isIndoorStage =
    stage === 'royal_durbar' ||
    stage === 'royal_bedchamber' ||
    stage === 'royal_dungeon' ||
    stage === 'cave_den' ||
    stage === 'orbital_starship_bridge' ||
    stage === 'modern_news_studio' ||
    stage === 'cozy_bookshop_cafe' ||
    stage === 'high_tech_lab' ||
    stage === 'courtroom_hall' ||
    stage === 'nordic_fjord_hall' ||
    stage === 'gothic_cathedral' ||
    stage === 'steampunk_clocktower' ||
    stage === 'vintage_train_car' ||
    ATLAS_INDOOR_STAGES.has(stage);

  // Crisp twinkling starfield on nocturnal outdoor moods
  if (
    !isIndoorStage &&
    (mood === 'midnight_banyan' ||
      mood === 'twilight_temple' ||
      mood === 'moonlit_marble' ||
      mood === 'mystic_teal' ||
      mood === 'cyber_magenta' ||
      mood === 'arctic_aurora' ||
      mood === 'deep_abyss')
  ) {
    ctx.save();
    for (let i = 0; i < 20; i++) {
      const sx = (((i * 151 + 29) % 96) + 2) * 0.01 * w;
      const sy = (((i * 67 + 13) % 44) + 4) * 0.01 * h;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(ts * 1.8 + i * 1.7));
      const sr = (1.2 + (i % 3) * 0.7) * s;
      ctx.fillStyle = pal.moon;
      ctx.globalAlpha = tw * 0.55;
      ctx.fillRect(sx, sy, sr, sr);
    }
    ctx.restore();
  }

  // Graphic celestial orb (Moon / Sun depending on mood) with dual radial halo bloom
  const moonX = stage === 'kurukshetra_field' ? w * 0.5 : w * 0.25;
  const moonY = stage === 'kurukshetra_field' ? h * 0.42 : h * 0.24;
  const moonR = (stage === 'kurukshetra_field' ? 128 : 74) * s;
  if (!isIndoorStage) {
    ctx.save();
    const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 2.4);
    moonGlow.addColorStop(0, pal.moon);
    moonGlow.addColorStop(0.45, pal.rimLight);
    moonGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 1.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = pal.moon;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (drawExpandedStageBackdrop(ctx, w, h, stage, pal, t)) {
    return;
  }
  if (drawEncyclopedicStageBackdrop(ctx, w, h, stage, pal, t)) {
    return;
  }
  if (drawWorldStageBackdrop(ctx, w, h, stage, pal, t)) {
    return;
  }
  if (drawUniversalStageBackdrop(ctx, w, h, stage, pal, t)) {
    return;
  }
  if (drawAtlasStageBackdrop(ctx, w, h, stage, pal, t)) {
    return;
  }

  if (stage === 'banyan_clearing') {
    // Distant treeline ridges
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.68);
    ctx.lineTo(w * 0.22, h * 0.56);
    ctx.lineTo(w * 0.46, h * 0.65);
    ctx.lineTo(w * 0.72, h * 0.55);
    ctx.lineTo(w, h * 0.63);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Ground + curved path
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = pal.path;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.86);
    ctx.lineTo(w * 0.52, h * 0.79);
    ctx.lineTo(w, h * 0.85);
    ctx.lineTo(w, h * 0.94);
    ctx.lineTo(w * 0.52, h * 0.89);
    ctx.lineTo(0, h * 0.96);
    ctx.closePath();
    ctx.fill();

    // Iconic Graphic Banyan Silhouette on Right
    ctx.save();
    ctx.translate(w * 0.77, h * 0.78);
    ctx.scale(s * 1.15, s * 1.15);
    ctx.fillStyle = '#050712';
    ctx.beginPath();
    ctx.moveTo(-58, 16);
    ctx.lineTo(-28, -135);
    ctx.lineTo(-200, -144);
    ctx.lineTo(-190, -162);
    ctx.lineTo(-22, -172);
    ctx.lineTo(14, -242);
    ctx.lineTo(44, -134);
    ctx.lineTo(74, 16);
    ctx.closePath();
    ctx.fill();
    // Rim highlight on bough
    ctx.fillStyle = pal.rimLight;
    ctx.fillRect(-190, -162, 168, 5);
    // Hanging roots
    ctx.fillStyle = '#050712';
    for (let i = 0; i < 4; i++) {
      const rx = -168 + i * 42;
      const sway = Math.sin(ts * 2 + i) * 3;
      ctx.beginPath();
      ctx.moveTo(rx, -148);
      ctx.lineTo(rx + 4, -148);
      ctx.lineTo(rx + 2 + sway, -12);
      ctx.lineTo(rx - 1 + sway, -12);
      ctx.closePath();
      ctx.fill();
    }
    // Faceted Canopy
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.moveTo(-215, -175);
    ctx.lineTo(-125, -245);
    ctx.lineTo(18, -285);
    ctx.lineTo(145, -230);
    ctx.lineTo(190, -170);
    ctx.lineTo(80, -148);
    ctx.lineTo(-105, -155);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (stage === 'royal_durbar') {
    // Towering carved Rajasthani pillars & Mughal arches
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    // Royal carpet runner
    ctx.fillStyle = '#851329';
    ctx.beginPath();
    ctx.moveTo(w * 0.14, h);
    ctx.lineTo(w * 0.28, h * 0.72);
    ctx.lineTo(w * 0.72, h * 0.72);
    ctx.lineTo(w * 0.86, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f5bf38';
    ctx.fillRect(w * 0.28, h * 0.72, w * 0.44, 4 * s);

    // 4 Monumental Columns + Top Archways + Animated Wall Braziers
    const cols = [0.08, 0.3, 0.7, 0.92];
    const torchPulse = 0.82 + 0.18 * Math.sin(ts * 11.5);
    for (let idx = 0; idx < cols.length; idx++) {
      const cx = cols[idx];
      const px = w * cx;
      ctx.fillStyle = pal.farSil;
      ctx.fillRect(px - 26 * s, 0, 52 * s, h * 0.74);
      ctx.fillStyle = pal.rimLight;
      ctx.globalAlpha = 0.75 + 0.25 * Math.sin(ts * 9.5 + idx * 1.4);
      ctx.fillRect(px - 26 * s, 0, 6 * s, h * 0.74);
      ctx.globalAlpha = 1;
      // Pillar capital & base
      ctx.fillStyle = '#f5bf38';
      ctx.fillRect(px - 34 * s, h * 0.16, 68 * s, 10 * s);
      ctx.fillRect(px - 34 * s, h * 0.7, 68 * s, 12 * s);
      // Flickering brass torch sconce mounted on inner pillars
      if (idx === 1 || idx === 2) {
        const tx = px + (idx === 1 ? 30 * s : -30 * s);
        const ty = h * 0.42;
        const fl = (18 + Math.sin(ts * 14 + idx * 2.1) * 5) * s;
        ctx.fillStyle = `rgba(255, 192, 72, ${0.22 * torchPulse})`;
        ctx.beginPath();
        ctx.arc(tx, ty - 6 * s, 34 * s * torchPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff6a26';
        ctx.beginPath();
        ctx.moveTo(tx - 7 * s, ty);
        ctx.lineTo(tx + Math.sin(ts * 17 + idx) * 2.5 * s, ty - fl);
        ctx.lineTo(tx + 7 * s, ty);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffe585';
        ctx.beginPath();
        ctx.moveTo(tx - 3.5 * s, ty);
        ctx.lineTo(tx, ty - fl * 0.62);
        ctx.lineTo(tx + 3.5 * s, ty);
        ctx.closePath();
        ctx.fill();
      }
    }
    // Overhead palace arch soffit
    ctx.fillStyle = '#09070d';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h * 0.16);
    ctx.lineTo(w * 0.5, h * 0.08);
    ctx.lineTo(0, h * 0.16);
    ctx.closePath();
    ctx.fill();
  } else if (stage === 'kali_temple') {
    // Dramatic Temple Shikhara silhouette & stepped stone sanctum
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.moveTo(w * 0.32, h * 0.72);
    ctx.lineTo(w * 0.42, h * 0.22);
    ctx.lineTo(w * 0.5, h * 0.08);
    ctx.lineTo(w * 0.58, h * 0.22);
    ctx.lineTo(w * 0.68, h * 0.72);
    ctx.closePath();
    ctx.fill();
    // Stepped shikhara horizontal ribs
    ctx.fillStyle = pal.rimLight;
    for (let i = 0; i < 6; i++) {
      const y = h * (0.24 + i * 0.07);
      const rw = (50 + i * 24) * s;
      ctx.fillRect(w * 0.5 - rw, y, rw * 2, 4 * s);
    }
    // Rising curling temple incense plumes from sanctum steps
    for (let i = 0; i < 4; i++) {
      const p = (ts * 0.28 + i * 0.25) % 1;
      const ix = w * (i % 2 === 0 ? 0.38 : 0.62) + Math.sin(p * 5 + i) * 14 * s;
      const iy = h * 0.7 - p * h * 0.34;
      ctx.fillStyle = `rgba(255, 224, 178, ${Math.sin(p * Math.PI) * 0.2})`;
      ctx.beginPath();
      ctx.arc(ix, iy, (8 + p * 18) * s, 0, Math.PI * 2);
      ctx.fill();
    }
    // Gently swinging hanging brass temple bells left & right
    for (let bIdx = 0; bIdx < 2; bIdx++) {
      const bx = bIdx === 0 ? w * 0.2 : w * 0.8;
      const swing = Math.sin(ts * 1.9 + bIdx * 1.6) * 0.09;
      ctx.save();
      ctx.translate(bx, 0);
      ctx.rotate(swing);
      ctx.fillStyle = '#07060d';
      ctx.fillRect(-2 * s, 0, 4 * s, h * 0.24);
      ctx.fillStyle = '#f2be38';
      ctx.beginPath();
      ctx.moveTo(-18 * s, h * 0.3);
      ctx.lineTo(-8 * s, h * 0.22);
      ctx.lineTo(8 * s, h * 0.22);
      ctx.lineTo(18 * s, h * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // Stone temple steps
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = pal.path;
    ctx.fillRect(w * 0.18, h * 0.72, w * 0.64, 14 * s);
    ctx.fillRect(w * 0.12, h * 0.78, w * 0.76, 14 * s);
  } else if (stage === 'moonlit_terrace') {
    // Slowly breathing diagonal moonlight shaft sweeping across palace terrace
    const shaftPulse = 0.13 + 0.04 * Math.sin(ts * 1.4);
    const shaftDrift = Math.sin(ts * 0.6) * 14 * s;
    ctx.fillStyle = `rgba(235, 244, 255, ${shaftPulse})`;
    ctx.beginPath();
    ctx.moveTo(w * 0.16 + shaftDrift, 0);
    ctx.lineTo(w * 0.45 + shaftDrift, 0);
    ctx.lineTo(w * 0.86 + shaftDrift, h);
    ctx.lineTo(w * 0.42 + shaftDrift, h);
    ctx.closePath();
    ctx.fill();
    // Drifting silver moonlight dust motes inside the shaft
    ctx.fillStyle = 'rgba(240, 248, 255, 0.48)';
    for (let i = 0; i < 6; i++) {
      const mx = w * (0.28 + i * 0.08) + Math.sin(ts * 1.3 + i * 2) * 18 * s;
      const my = ((h * 0.72 - ((ts * 16 * s + i * 74) % (h * 0.65))) + h) % (h * 0.72);
      ctx.beginPath();
      ctx.arc(mx, my, 2.2 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    // Distant palace domes skyline
    ctx.fillStyle = pal.farSil;
    for (const [dx, dr] of [[0.14, 48], [0.74, 62], [0.88, 38]]) {
      ctx.beginPath();
      ctx.arc(w * dx, h * 0.62, dr * s, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(w * dx - dr * s, h * 0.62, dr * 2 * s, h * 0.12);
    }
    // Marble balustrade + terrace floor
    ctx.fillStyle = pal.path;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = pal.farSil;
    ctx.fillRect(0, h * 0.64, w, 10 * s);
    for (let x = 24 * s; x < w; x += 48 * s) {
      ctx.fillRect(x, h * 0.64, 12 * s, h * 0.08);
    }
  } else if (stage === 'royal_bedchamber') {
    // Softly billowing crimson silk drapes framing walls + gilded alcove
    const billow = Math.sin(ts * 1.7) * 9 * s;
    ctx.fillStyle = '#5c0f22';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.14, 0);
    ctx.quadraticCurveTo(w * 0.14 + billow, h * 0.45, w * 0.13 - billow * 0.5, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w * 0.86, 0);
    ctx.quadraticCurveTo(w * 0.86 - billow, h * 0.45, w * 0.87 + billow * 0.5, h);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8f1934';
    ctx.fillRect(0, 0, w * 0.055, h);
    ctx.fillRect(w * 0.945, 0, w * 0.055, h);
    // Warm geometric wall alcove + breathing candlelit wall aura
    ctx.fillStyle = pal.farSil;
    ctx.fillRect(w * 0.2, h * 0.12, w * 0.6, h * 0.6);
    const glow = 0.14 + 0.05 * Math.sin(ts * 8.5);
    const alcGrad = ctx.createRadialGradient(w * 0.5, h * 0.48, 12 * s, w * 0.5, h * 0.48, 180 * s);
    alcGrad.addColorStop(0, `rgba(255, 202, 92, ${glow})`);
    alcGrad.addColorStop(1, 'rgba(255, 202, 92, 0)');
    ctx.fillStyle = alcGrad;
    ctx.fillRect(w * 0.2, h * 0.12, w * 0.6, h * 0.6);
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = '#f5bf38';
    ctx.fillRect(w * 0.2, h * 0.12, w * 0.6, 4 * s);
  } else if (stage === 'river_ghat') {
    // Rippling nocturnal river with shimmering moon reflection + floating diyas
    ctx.fillStyle = '#091529';
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    // Shimmering horizontal reflection bars
    ctx.fillStyle = pal.rimLight;
    for (let i = 0; i < 8; i++) {
      const rw = (90 - i * 8) * s;
      const rx = moonX + Math.sin(ts * 3 + i) * 14 * s - rw / 2;
      ctx.fillRect(rx, h * (0.65 + i * 0.036), rw, 4 * s);
    }
    // Stone ghat steps descending on left & right foreground
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.7);
    ctx.lineTo(w * 0.42, h * 0.7);
    ctx.lineTo(w * 0.56, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = pal.path;
    ctx.fillRect(0, h * 0.7, w * 0.42, 8 * s);
    ctx.fillRect(0, h * 0.8, w * 0.48, 8 * s);
    // Floating glowing river diyas
    for (let i = 0; i < 5; i++) {
      const dx = ((w * (0.58 + i * 0.09) + t * 14 * s) % (w * 0.46)) + w * 0.54;
      const dy = h * (0.72 + (i % 3) * 0.08);
      ctx.fillStyle = '#ffd147';
      ctx.beginPath();
      ctx.moveTo(dx, dy - 12 * s);
      ctx.lineTo(dx + 5 * s, dy);
      ctx.lineTo(dx - 5 * s, dy);
      ctx.closePath();
      ctx.fill();
    }
  } else if (stage === 'bamboo_forest') {
    // Tall swaying graphic bamboo stalks & jungle fronds (Panchatantra!)
    const stalks = [0.06, 0.14, 0.22, 0.38, 0.62, 0.76, 0.84, 0.93];
    for (let i = 0; i < stalks.length; i++) {
      const bx = w * stalks[i];
      const bw = (12 + (i % 3) * 6) * s;
      const sway = Math.sin(ts * 1.55 + i * 0.9) * 11 * s;
      const tilt = (i % 2 === 0 ? 1 : -1) * 18 * s + sway;
      ctx.fillStyle = i % 2 === 0 ? pal.farSil : '#0b241f';
      ctx.beginPath();
      ctx.moveTo(bx, h);
      ctx.lineTo(bx + tilt, 0);
      ctx.lineTo(bx + tilt + bw, 0);
      ctx.lineTo(bx + bw, h);
      ctx.closePath();
      ctx.fill();
      // Crisp rim light edge swaying with stalk
      ctx.fillStyle = pal.rimLight;
      ctx.fillRect(bx + tilt * 0.5, h * 0.2, 2.5 * s, h * 0.6);
    }
    // Gently breathing diagonal sun/moon jungle light rays
    const rayShift = Math.sin(ts * 0.9) * 16 * s;
    ctx.fillStyle = `rgba(180, 255, 214, ${0.07 + 0.03 * Math.sin(ts * 1.7)})`;
    ctx.beginPath();
    ctx.moveTo(w * 0.28 + rayShift, 0);
    ctx.lineTo(w * 0.46 + rayShift, 0);
    ctx.lineTo(w * 0.74 + rayShift, h);
    ctx.lineTo(w * 0.46 + rayShift, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.74, w, h * 0.26);
  } else if (stage === 'kurukshetra_field') {
    // Epic dusty battlefield horizon with distant war banners & silhouettes
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.7);
    ctx.lineTo(w * 0.3, h * 0.64);
    ctx.lineTo(w * 0.65, h * 0.68);
    ctx.lineTo(w, h * 0.62);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    // Fluttering distant battle flags
    for (const fx of [0.15, 0.28, 0.72, 0.85]) {
      const x = w * fx;
      const y = h * 0.65;
      ctx.fillStyle = '#070408';
      ctx.fillRect(x, y - 82 * s, 4 * s, 86 * s);
      ctx.fillStyle = pal.accent;
      ctx.beginPath();
      ctx.moveTo(x + 4 * s, y - 80 * s);
      ctx.lineTo(x + 48 * s + Math.sin(ts * 8 + fx * 10) * 6 * s, y - 68 * s);
      ctx.lineTo(x + 4 * s, y - 56 * s);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.74, w, h * 0.26);
  } else if (stage === 'village_chowk') {
    // Graphic Indian village silhouettes with pitched roofs, breathing lantern windows & hearth smoke
    ctx.fillStyle = pal.farSil;
    const huts = [
      [0.05, 0.52, 0.22],
      [0.72, 0.5, 0.24],
    ];
    for (let hIdx = 0; hIdx < huts.length; hIdx++) {
      const [hx, hy, hw] = huts[hIdx];
      // Rising evening hearth smoke curl
      for (let p = 0; p < 3; p++) {
        const sp = (ts * 0.35 + p * 0.33 + hIdx * 0.2) % 1;
        ctx.fillStyle = `rgba(220, 224, 240, ${Math.sin(sp * Math.PI) * 0.16})`;
        ctx.beginPath();
        ctx.arc(w * (hx + hw * 0.7) + Math.sin(sp * 5 + p) * 10 * s, h * (hy - 0.12) - sp * 68 * s, (7 + sp * 11) * s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = pal.farSil;
      ctx.fillRect(w * hx, h * hy, w * hw, h * 0.25);
      ctx.beginPath();
      ctx.moveTo(w * (hx - 0.03), h * hy);
      ctx.lineTo(w * (hx + hw / 2), h * (hy - 0.14));
      ctx.lineTo(w * (hx + hw + 0.03), h * hy);
      ctx.closePath();
      ctx.fill();
      // Warm breathing lantern window
      const winFlick = 0.8 + 0.2 * Math.sin(ts * 7.5 + hIdx * 2.1);
      ctx.fillStyle = `rgba(255, 209, 71, ${winFlick})`;
      ctx.fillRect(w * (hx + hw * 0.38), h * (hy + 0.07), w * 0.05, h * 0.07);
      ctx.fillStyle = pal.farSil;
    }
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.74, w, h * 0.26);
    ctx.fillStyle = pal.path;
    ctx.fillRect(0, h * 0.8, w, h * 0.12);
  } else {
    // cremation_ground: Jagged pyres, swirling smoke ribbons, eerie horizon
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.74);
    ctx.lineTo(w * 0.16, h * 0.56);
    ctx.lineTo(w * 0.32, h * 0.7);
    ctx.lineTo(w * 0.76, h * 0.62);
    ctx.lineTo(w * 0.9, h * 0.5);
    ctx.lineTo(w, h * 0.72);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    // Glowing funeral pyre flames on distant horizon
    for (const px of [0.18, 0.84]) {
      const fH = (36 + Math.sin(ts * 12 + px * 20) * 10) * s;
      ctx.fillStyle = '#ff4d2e';
      ctx.beginPath();
      ctx.moveTo(w * px - 18 * s, h * 0.72);
      ctx.lineTo(w * px, h * 0.72 - fH);
      ctx.lineTo(w * px + 18 * s, h * 0.72);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.74, w, h * 0.26);
  }
}

// =========================================================================
// 2. ALL 12 PARAMETRIC CAST ARCHETYPES (Full-Body + Dramatic Close-Up Rig)
// =========================================================================
function drawHeadwear(
  ctx: CanvasRenderingContext2D,
  arch: ArchetypeId,
  accent: string,
  primary: string,
  lightRight: boolean
): void {
  const shadow = darkenHex(accent, 0.55);
  if (arch === 'king' || arch === 'queen') {
    // Tiered Golden Mukut / Royal Crown
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-46, -42);
    ctx.lineTo(-38, -74);
    ctx.lineTo(-22, -78);
    ctx.lineTo(0, arch === 'king' ? -118 : -102);
    ctx.lineTo(22, -78);
    ctx.lineTo(38, -74);
    ctx.lineTo(46, -42);
    ctx.closePath();
    ctx.fill();
    // Hard Chiaroscuro shadow half
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.moveTo(lightRight ? -46 : 0, -42);
    ctx.lineTo(lightRight ? -38 : 38, -74);
    ctx.lineTo(lightRight ? -22 : 22, -78);
    ctx.lineTo(0, arch === 'king' ? -118 : -102);
    ctx.lineTo(0, -42);
    ctx.closePath();
    ctx.fill();
    // Center ruby jewel
    ctx.fillStyle = '#ff173d';
    ctx.beginPath();
    ctx.moveTo(0, -72);
    ctx.lineTo(9, -58);
    ctx.lineTo(0, -45);
    ctx.lineTo(-9, -58);
    ctx.closePath();
    ctx.fill();
  } else if (arch === 'courtier' || arch === 'merchant') {
    // Ornate Pagri Turban
    ctx.fillStyle = arch === 'courtier' ? '#f5eedc' : '#d6c3a5';
    ctx.beginPath();
    ctx.moveTo(-50, -34);
    ctx.lineTo(-42, -72);
    ctx.lineTo(0, -86);
    ctx.lineTo(44, -70);
    ctx.lineTo(48, -34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = darkenHex(arch === 'courtier' ? '#f5eedc' : '#d6c3a5', 0.65);
    ctx.fillRect(lightRight ? -50 : 0, -78, 50, 44);
    if (arch === 'courtier') {
      // Royal turban crest gem + plume
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(6, -80);
      ctx.lineTo(24, -104);
      ctx.lineTo(14, -70);
      ctx.closePath();
      ctx.fill();
    }
  } else if (arch === 'sage') {
    // Matted Jata Topknot
    ctx.fillStyle = '#18141e';
    ctx.beginPath();
    ctx.arc(0, -68, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(-24, -52, 48, 7);
  } else if (arch === 'warrior') {
    // Angular War Helmet & Crest
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-48, -32);
    ctx.lineTo(-34, -84);
    ctx.lineTo(0, -106);
    ctx.lineTo(34, -84);
    ctx.lineTo(48, -32);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(-8, -102);
    ctx.lineTo(8, -102);
    ctx.lineTo(28, -134);
    ctx.lineTo(-14, -124);
    ctx.closePath();
    ctx.fill();
  } else if (arch === 'ascetic') {
    // Deep Shadowed Tantrik Hood
    ctx.fillStyle = '#090714';
    ctx.beginPath();
    ctx.moveTo(-64, 34);
    ctx.lineTo(-56, -72);
    ctx.lineTo(0, -108);
    ctx.lineTo(56, -72);
    ctx.lineTo(64, 34);
    ctx.lineTo(44, 34);
    ctx.lineTo(40, -48);
    ctx.lineTo(-40, -48);
    ctx.lineTo(-44, 34);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCastIdentityBehind(
  ctx: CanvasRenderingContext2D,
  cast: CastMember,
  t: number
): void {
  if (cast.mark !== 'divine_halo') return;
  const ts = snap24(t);
  ctx.save();
  ctx.rotate(ts * 0.35);
  const grad = ctx.createRadialGradient(0, -18, 22, 0, -18, 128);
  grad.addColorStop(0, 'rgba(255, 222, 102, 0.42)');
  grad.addColorStop(0.7, 'rgba(255, 192, 54, 0.16)');
  grad.addColorStop(1, 'rgba(255, 192, 54, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, -18, 128, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 224, 102, 0.72)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, -18, 96, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 96, -18 + Math.sin(a) * 96);
    ctx.lineTo(Math.cos(a) * 116, -18 + Math.sin(a) * 116);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCastIdentityOverlays(
  ctx: CanvasRenderingContext2D,
  cast: CastMember,
  lightSide: 'left' | 'right'
): void {
  const lightRight = lightSide === 'right';
  const mark = cast.mark;
  if (mark && mark !== 'default' && mark !== 'none' && mark !== 'divine_halo') {
    ctx.save();
    if (mark === 'vermilion_tilak') {
      ctx.fillStyle = '#ff2442';
      ctx.beginPath();
      ctx.moveTo(0, -48);
      ctx.lineTo(6, -24);
      ctx.lineTo(0, -16);
      ctx.lineTo(-6, -24);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd954';
      ctx.beginPath();
      ctx.arc(0, -24, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (mark === 'tripundra_ash') {
      ctx.fillStyle = '#edf2fa';
      ctx.fillRect(-26, -42, 52, 4);
      ctx.fillRect(-24, -34, 48, 4);
      ctx.fillRect(-20, -26, 40, 4);
      ctx.fillStyle = '#ff2442';
      ctx.beginPath();
      ctx.arc(0, -32, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (mark === 'royal_mustache') {
      ctx.fillStyle = '#070914';
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.quadraticCurveTo(-24, 18, -46, 28);
      ctx.quadraticCurveTo(-26, 39, 0, 27);
      ctx.quadraticCurveTo(26, 39, 46, 28);
      ctx.quadraticCurveTo(24, 18, 0, 18);
      ctx.closePath();
      ctx.fill();
    } else if (mark === 'full_beard') {
      ctx.fillStyle = '#181c2b';
      ctx.beginPath();
      ctx.moveTo(-48, 22);
      ctx.lineTo(48, 22);
      ctx.lineTo(36, 76);
      ctx.lineTo(0, 108);
      ctx.lineTo(-36, 76);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#2d354d';
      ctx.fillRect(lightRight ? 2 : -22, 34, 18, 42);
    }
    ctx.restore();
  }

  const hg = cast.headgear;
  if (hg && hg !== 'default' && hg !== 'none') {
    ctx.save();
    if (hg === 'royal_turban') {
      ctx.fillStyle = cast.primaryColor;
      ctx.beginPath();
      ctx.moveTo(-76, -44);
      ctx.quadraticCurveTo(-82, -108, 0, -118);
      ctx.quadraticCurveTo(82, -108, 76, -44);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = darkenHex(cast.primaryColor, 0.56);
      ctx.fillRect(lightRight ? -76 : 0, -110, 76, 66);
      ctx.fillStyle = cast.accentColor;
      ctx.fillRect(-72, -56, 144, 10);
      ctx.beginPath();
      ctx.moveTo(14, -74);
      ctx.lineTo(32, -124);
      ctx.lineTo(40, -76);
      ctx.closePath();
      ctx.fill();
    } else if (hg === 'golden_mukut') {
      ctx.fillStyle = '#f5be38';
      ctx.beginPath();
      ctx.moveTo(-66, -46);
      ctx.lineTo(-56, -98);
      ctx.lineTo(-26, -78);
      ctx.lineTo(0, -148);
      ctx.lineTo(26, -78);
      ctx.lineTo(56, -98);
      ctx.lineTo(66, -46);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#996412';
      ctx.beginPath();
      ctx.moveTo(0, -148);
      ctx.lineTo(lightRight ? -66 : 66, -46);
      ctx.lineTo(0, -46);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ff2442';
      ctx.beginPath();
      ctx.arc(0, -82, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (hg === 'sage_topknot') {
      ctx.fillStyle = '#141724';
      ctx.beginPath();
      ctx.arc(0, -86, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -122, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = cast.accentColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-30, -82);
      ctx.lineTo(30, -82);
      ctx.stroke();
    } else if (hg === 'battle_helm') {
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(-72, -38);
      ctx.quadraticCurveTo(-70, -112, 0, -122);
      ctx.quadraticCurveTo(70, -112, 72, -38);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = cast.accentColor;
      ctx.fillRect(-70, -52, 140, 9);
      ctx.beginPath();
      ctx.moveTo(-8, -118);
      ctx.lineTo(0, -148);
      ctx.lineTo(8, -118);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

/**
 * Dramatic Half-Face Chiaroscuro Close-Up Rig for ALL 34 Cast Archetypes!
 * Supports 6 expressions + 4-shape real voiceover lip-sync visemes + cast customizer overlays!
 */
export function drawActorCloseUp(
  ctx: CanvasRenderingContext2D,
  cast: CastMember,
  expression: ExpressionId,
  viseme: number,
  speechEnergy: number,
  lightSide: 'left' | 'right',
  t: number,
  rig?: ActorRigRenderOptions
): void {
  if (cast.dna) {
    drawModularEntityCloseUp(ctx, cast, cast.dna, expression, viseme, speechEnergy, lightSide, t, rig);
    return;
  }

  drawCastIdentityBehind(ctx, cast, t);

  if (drawExpandedActorCloseUp(ctx, cast, expression, viseme, speechEnergy, lightSide, t)) {
    drawCastIdentityOverlays(ctx, cast, lightSide);
    return;
  }
  if (drawEncyclopedicActorCloseUp(ctx, cast, expression, viseme, speechEnergy, lightSide, t)) {
    drawCastIdentityOverlays(ctx, cast, lightSide);
    return;
  }
  if (drawWorldActorCloseUp(ctx, cast, expression, viseme, speechEnergy, lightSide, t)) {
    drawCastIdentityOverlays(ctx, cast, lightSide);
    return;
  }
  if (drawUniversalActorCloseUp(ctx, cast, expression, viseme, speechEnergy, lightSide, t)) {
    drawCastIdentityOverlays(ctx, cast, lightSide);
    return;
  }
  if (drawAtlasActorCloseUp(ctx, cast, expression, viseme, speechEnergy, lightSide, t)) {
    drawCastIdentityOverlays(ctx, cast, lightSide);
    return;
  }

  const ts = snap24(t);
  const lightRight = lightSide === 'right';
  const skin = cast.skinColor || (cast.archetype === 'spirit' ? '#d4e6fa' : '#e4a276');
  const skinShadow = cast.archetype === 'spirit' ? '#182447' : darkenHex(skin, 0.58);
  const arch = cast.archetype;

  // Per-character deterministic acting seed (prevents robotic twin blinking/nodding!)
  let castSeed = 0;
  for (let i = 0; i < cast.id.length; i++) {
    castSeed = (castSeed * 31 + cast.id.charCodeAt(i)) % 997;
  }
  const breath = Math.sin(ts * 2.1 + castSeed * 0.13);
  const speechNod = speechEnergy > 0.18 ? Math.sin(ts * 9.5 + castSeed) * 0.032 * speechEnergy : 0;
  const exprTilt = getExpressionHeadTilt(expression);

  // Lively breathing lift + expressive head tilt synced to dialogue cadence
  ctx.save();
  ctx.translate(0, breath * -2.2 - speechEnergy * 2.8);
  ctx.rotate(Math.sin(ts * 1.9 + castSeed * 0.2) * 0.022 + speechNod + exprTilt);

  // Broad Graphic Shoulders / Mane / Hood behind head
  if (arch === 'lion') {
    // Dramatic Geometric Sunburst Lion Mane!
    ctx.fillStyle = '#6b2c0c';
    ctx.beginPath();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const r = i % 2 === 0 ? 156 : 112;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r - 10;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (arch === 'serpent') {
    // Flared Geometric Cobra Hood!
    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.moveTo(0, -135);
    ctx.lineTo(138, -28);
    ctx.lineTo(106, 98);
    ctx.lineTo(42, 185);
    ctx.lineTo(-42, 185);
    ctx.lineTo(-106, 98);
    ctx.lineTo(-138, -28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.55);
    ctx.beginPath();
    ctx.moveTo(0, -135);
    ctx.lineTo(lightRight ? -138 : 138, -28);
    ctx.lineTo(lightRight ? -106 : 106, 98);
    ctx.lineTo(lightRight ? -42 : 42, 185);
    ctx.lineTo(0, 185);
    ctx.closePath();
    ctx.fill();
    // Iconic spectacle mark
    ctx.strokeStyle = cast.accentColor;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(-44, 48, 22, 0, Math.PI * 2);
    ctx.arc(44, 48, 22, 0, Math.PI * 2);
    ctx.stroke();
  } else if (arch === 'spirit') {
    // Wild angular spiky Betaal hair framing head
    const spike = Math.sin(ts * 5) * 8;
    ctx.fillStyle = '#060814';
    ctx.beginPath();
    ctx.moveTo(-105, -135);
    ctx.lineTo(105, -135);
    ctx.lineTo(138 + spike, -20);
    ctx.lineTo(108, 66);
    ctx.lineTo(124 - spike, 155);
    ctx.lineTo(0, 115);
    ctx.lineTo(-124 + spike, 155);
    ctx.lineTo(-108, 66);
    ctx.lineTo(-138 - spike, -20);
    ctx.closePath();
    ctx.fill();
  } else {
    // Standard Heroic/Folklore Shoulders
    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.moveTo(-185, 220);
    ctx.lineTo(-125, 76);
    ctx.lineTo(125, 76);
    ctx.lineTo(185, 220);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.52);
    ctx.beginPath();
    ctx.moveTo(lightRight ? -185 : 0, 220);
    ctx.lineTo(lightRight ? -125 : 0, 76);
    ctx.lineTo(lightRight ? 0 : 125, 76);
    ctx.lineTo(lightRight ? 0 : 185, 220);
    ctx.closePath();
    ctx.fill();

    // Flowing hair block for humanoids
    if (arch !== 'monkey' && arch !== 'jackal') {
      ctx.fillStyle = '#080a14';
      ctx.beginPath();
      ctx.moveTo(-78, -50);
      ctx.lineTo(78, -50);
      ctx.lineTo(arch === 'queen' ? 98 : 84, 88);
      ctx.lineTo(arch === 'queen' ? -98 : -84, 88);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Animal Ears (Monkey / Jackal / Lion)
  if (arch === 'monkey' || arch === 'lion') {
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(-68, -14, arch === 'monkey' ? 28 : 22, 0, Math.PI * 2);
    ctx.arc(68, -14, arch === 'monkey' ? 28 : 22, 0, Math.PI * 2);
    ctx.fill();
  } else if (arch === 'jackal') {
    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.moveTo(-54, -42); ctx.lineTo(-76, -124); ctx.lineTo(-16, -64); ctx.closePath();
    ctx.moveTo(54, -42); ctx.lineTo(76, -124); ctx.lineTo(16, -64); ctx.closePath();
    ctx.fill();
  }

  // Chiseled Geometric Head Base + HARD CHIAROSCURO SHADOW SPLIT
  ctx.fillStyle = arch === 'jackal' ? cast.primaryColor : skin;
  ctx.beginPath();
  if (arch === 'jackal') {
    ctx.moveTo(-64, -56); ctx.lineTo(64, -56); ctx.lineTo(54, 16); ctx.lineTo(0, 88); ctx.lineTo(-54, 16);
  } else if (arch === 'serpent') {
    ctx.moveTo(-48, -68); ctx.lineTo(48, -68); ctx.lineTo(58, 12); ctx.lineTo(0, 62); ctx.lineTo(-58, 12);
  } else {
    ctx.moveTo(-64, -54); ctx.lineTo(64, -54); ctx.lineTo(58, 22); ctx.lineTo(24, 72); ctx.lineTo(-24, 72); ctx.lineTo(-58, 22);
  }
  ctx.closePath();
  ctx.fill();

  // Hard shadow half split
  ctx.save();
  ctx.clip();
  ctx.fillStyle = arch === 'jackal' ? darkenHex(cast.primaryColor, 0.55) : skinShadow;
  ctx.fillRect(lightRight ? -90 : 0, -90, 90, 200);
  ctx.restore();

  // Facial markings (Tilak / Ash Tripundra / Maang Tikka)
  if (arch === 'king' || arch === 'warrior') {
    ctx.fillStyle = '#ff1c42';
    ctx.fillRect(-4, -42, 8, 22);
  } else if (arch === 'ascetic' || arch === 'sage') {
    ctx.fillStyle = '#e8ecf5';
    ctx.fillRect(-26, -38, 52, 4);
    ctx.fillRect(-22, -30, 44, 4);
    ctx.fillStyle = '#ff3855';
    ctx.beginPath();
    ctx.arc(0, -32, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (arch === 'queen') {
    ctx.fillStyle = cast.accentColor;
    ctx.beginPath();
    ctx.moveTo(0, -46); ctx.lineTo(8, -32); ctx.lineTo(0, -20); ctx.lineTo(-8, -32); ctx.closePath();
    ctx.fill();
  }

  // Expressive Eyes & Brows (Unified FACS Engine — ZERO default angry V-slant!)
  const isSpiritEye = arch === 'spirit' || arch === 'ascetic' || arch === 'serpent' || arch === 'lion';
  drawUnifiedEyePair(ctx, expression, cast.accentColor, t, speechEnergy, {
    glowing: isSpiritEye,
    eyeX: 28,
    eyeY: -8,
    noBrows: arch === 'serpent',
    castSeed,
    lookX: rig?.lookX,
    lookY: rig?.lookY,
    yawBias: rig?.yawBias,
  });

  // Beard / Mustache
  if (arch === 'sage') {
    ctx.fillStyle = '#dfe6f2';
    ctx.beginPath();
    ctx.moveTo(-42, 26);
    ctx.lineTo(42, 26);
    ctx.lineTo(0, 114);
    ctx.closePath();
    ctx.fill();
  } else if (arch === 'king' || arch === 'warrior' || arch === 'merchant') {
    ctx.fillStyle = '#080a14';
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(-40, 32);
    ctx.lineTo(-26, 37);
    ctx.lineTo(0, 28);
    ctx.lineTo(26, 37);
    ctx.lineTo(40, 32);
    ctx.closePath();
    ctx.fill();
  }

  // Expressive 4-Shape Voiceover-Synced Mouth Viseme (Unified FACS Engine)
  drawUnifiedMouth(ctx, expression, viseme, {
    y: arch === 'jackal' ? 46 : 38,
    fanged: arch === 'spirit' || arch === 'lion' || arch === 'jackal' || arch === 'serpent',
  });

  // Headwear / Crown / Turban / Hood (skipped when user explicitly selects 'none')
  if (cast.headgear !== 'none') {
    drawHeadwear(ctx, arch, cast.accentColor, cast.primaryColor, lightRight);
  }
  drawCastIdentityOverlays(ctx, cast, lightSide);

  ctx.restore();
}

/**
 * Full-Body Lineless Chiaroscuro Rig for ALL 40 Cast Archetypes!
 * Powered by Archetype Kinematic Profiles, 12-Principles Pose Envelopes, 2-Bone Arm Rig,
 * Style-Native Cadence (including Shadow Puppetry rods), and Grounded Dynamic Shadows.
 */
export function drawActorFullBody(
  ctx: CanvasRenderingContext2D,
  cast: CastMember,
  x: number,
  y: number,
  scale: number,
  pose: PoseId,
  expression: ExpressionId,
  facing: 'left' | 'right',
  viseme: number,
  speechEnergy: number,
  t: number,
  beatU = 0.5,
  motion?: MotionId,
  renderStyle?: RenderStyleId,
  lighting?: SceneLightingState,
  motionProfile?: MotionProfileId,
  rig?: ActorRigRenderOptions
): void {
  if (cast.dna) {
    drawModularEntityFullBody(
      ctx,
      cast,
      cast.dna,
      x,
      y,
      scale,
      pose,
      expression,
      facing,
      viseme,
      speechEnergy,
      t,
      beatU,
      motion,
      renderStyle,
      lighting,
      motionProfile,
      rig
    );
    return;
  }

  const ts = snapStyleTime(t, renderStyle);
  const styleGrammar = getStyleAnimationGrammar(renderStyle);
  const flip = facing === 'left' ? -1 : 1;
  const arch = cast.archetype;
  const skin = cast.skinColor || (arch === 'spirit' ? '#cfe2f7' : '#e09b70');
  const kin = getArchetypeKinematics(arch);

  let bodySeed = 0;
  for (let i = 0; i < cast.id.length; i++) {
    bodySeed = (bodySeed * 31 + cast.id.charCodeAt(i)) % 997;
  }

  const env = computePoseEnvelope(
    pose,
    motion,
    beatU,
    ts,
    speechEnergy,
    kin,
    bodySeed,
    motionProfile,
    renderStyle
  );
  const buildScale = cast.scale ?? 1.0;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * buildScale * flip, scale * buildScale);

  // Subtle hand-crafted line-boil micro-jitter for Woodblock / Codex / Sumi-e engines
  if (styleGrammar.lineBoilPx > 0) {
    const boilX = Math.sin(ts * 41.3 + bodySeed) * styleGrammar.lineBoilPx;
    const boilY = Math.cos(ts * 37.7 + bodySeed * 1.7) * styleGrammar.lineBoilPx * 0.7;
    ctx.translate(boilX, boilY);
  }

  // Dynamic Grounded Contact Shadow (scales & softens with elevation/hover, skews with lightSide)
  if (pose !== 'hang_upside_down') {
    const elevation = Math.max(0, -(env.offsetY + env.bob));
    const airborneShrink = pose === 'soar' ? 0.55 : Math.max(0.42, 1 - elevation / 180);
    const shadowAlpha = pose === 'soar' ? 0.25 : 0.56 * airborneShrink;
    const skewX = (lighting?.shadowSkewX ?? 0.35) * flip;
    ctx.save();
    ctx.fillStyle = `rgba(4, 6, 14, ${shadowAlpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(skewX * 14, 4, 36 * airborneShrink, 8.5 * airborneShrink, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Apply 12-principles pose envelope: translation, squash-and-stretch, anticipation/strike tilt
  ctx.translate(env.offsetX, env.offsetY + env.bob);
  ctx.rotate(env.bodyTilt);
  ctx.scale(env.scaleX, env.scaleY);

  const stride = env.stride;

  if (drawExpandedActorFullBody(ctx, cast, pose, expression, viseme, speechEnergy, stride, ts)) {
    ctx.restore();
    return;
  }
  if (drawEncyclopedicActorFullBody(ctx, cast, pose, expression, viseme, speechEnergy, stride, ts)) {
    ctx.restore();
    return;
  }
  if (drawWorldActorFullBody(ctx, cast, pose, expression, viseme, speechEnergy, stride, ts)) {
    ctx.restore();
    return;
  }
  if (drawUniversalActorFullBody(ctx, cast, pose, expression, viseme, speechEnergy, stride, ts)) {
    ctx.restore();
    return;
  }
  if (drawAtlasActorFullBody(ctx, cast, pose, expression, viseme, speechEnergy, stride, ts)) {
    ctx.restore();
    return;
  }

  // Special Quadruped / Coiled Silhouettes for Lion, Jackal, Serpent
  if (arch === 'lion' || arch === 'jackal') {
    const isLion = arch === 'lion';
    const bodyCol = cast.primaryColor;
    // Expressive prowling tail with phase-delayed whip
    ctx.strokeStyle = bodyCol;
    ctx.lineWidth = isLion ? 6 : 12;
    ctx.beginPath();
    ctx.moveTo(-42, -46);
    ctx.quadraticCurveTo(-78, -68 + Math.sin(ts * 5.2 + bodySeed) * 12, -72 + Math.cos(ts * 4.5) * 6, -96);
    ctx.stroke();
    // Legs
    ctx.fillStyle = darkenHex(bodyCol, 0.68);
    ctx.fillRect(-38 - stride * 0.55, -44, 14, 44);
    ctx.fillRect(16 + stride * 0.55, -44, 14, 44);
    // Muscular graphic torso with breathing flex
    const chestFlex = Math.sin(ts * kin.breathHz + bodySeed) * 2.2;
    ctx.fillStyle = bodyCol;
    ctx.beginPath();
    ctx.moveTo(-46, -40);
    ctx.lineTo(-32, -82 - chestFlex);
    ctx.lineTo(36, -86 - chestFlex);
    ctx.lineTo(44, -40);
    ctx.closePath();
    ctx.fill();
    // Head & Mane
    ctx.save();
    ctx.translate(38, -86 - chestFlex);
    ctx.scale(0.38, 0.38);
    drawActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', ts);
    ctx.restore();
    ctx.restore();
    return;
  }

  if (arch === 'serpent') {
    // Sinuous Swaying Coiled Sacred Cobra
    const sway = Math.sin(ts * 2.8 + bodySeed) * 9;
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.65);
    ctx.beginPath();
    ctx.ellipse(0, -14, 48 + Math.sin(ts * 2.4) * 2.5, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.ellipse(sway * 0.25, -32, 36, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = cast.primaryColor;
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.quadraticCurveTo(sway * 1.1, -72, 4 + sway * 0.7, -110);
    ctx.stroke();
    ctx.save();
    ctx.translate(4 + sway * 0.7, -112);
    ctx.rotate(sway * 0.012);
    ctx.scale(0.36, 0.36);
    drawActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', ts);
    ctx.restore();
    ctx.restore();
    return;
  }

  // Humanoid & Monkey Full-Body Skeletal Rig with Archetype Kinematics & 2-Bone Arm Rig
  const breath = Math.sin(ts * kin.breathHz + bodySeed * 0.17);
  const chestRise = breath * -kin.breathAmp - speechEnergy * 2.2;
  const talkPulse = speechEnergy > 0.15 ? Math.sin(ts * 8.4 + bodySeed) * speechEnergy : 0;
  const armRig = computeActorArmRig(
    pose,
    expression,
    env,
    ts,
    speechEnergy,
    kin,
    bodySeed,
    chestRise,
    motionProfile,
    renderStyle
  );

  // Fluid Secondary-Motion Trailing Cape (Multi-Wave Bezier Follow-Through scaled by archetype capeDrag!)
  if (
    arch === 'king' ||
    arch === 'emperor' ||
    arch === 'deva' ||
    arch === 'goddess' ||
    arch === 'demon_king' ||
    arch === 'warrior' ||
    arch === 'knight' ||
    arch === 'samurai' ||
    arch === 'spirit' ||
    arch === 'yaksha' ||
    arch === 'ascetic'
  ) {
    const motionDrag =
      (pose === 'walk' ? 18 : pose === 'soar' ? 30 : pose === 'attack' ? 18 + env.strikePhase * 10 : 6) *
      kin.capeDrag;
    const waveMid = Math.sin(ts * 4.8 + bodySeed) * 8 * kin.capeDrag + motionDrag * 0.5;
    const waveTip = Math.sin(ts * 4.8 - 1.15 + bodySeed) * 14 * kin.capeDrag + motionDrag;
    ctx.fillStyle =
      arch === 'king' ||
      arch === 'emperor' ||
      arch === 'deva' ||
      arch === 'goddess' ||
      arch === 'knight'
        ? cast.primaryColor
        : darkenHex(cast.primaryColor, 0.65);
    ctx.beginPath();
    ctx.moveTo(-12, -122 + chestRise);
    ctx.quadraticCurveTo(-48 - waveMid, -72, -68 - waveTip, -18 + Math.sin(ts * 5.2) * 4);
    ctx.quadraticCurveTo(-40 - waveTip * 0.55, -8, 4, -26);
    ctx.lineTo(8, -120 + chestRise);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = cast.accentColor;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-66 - waveTip, -18 + Math.sin(ts * 5.2) * 4);
    ctx.quadraticCurveTo(-38 - waveTip * 0.55, -9, 2, -26);
    ctx.stroke();
  }

  // Curled Monkey / Vanara Hero Tail with Phase-Delayed Tip Whip!
  if (arch === 'monkey' || arch === 'vanara_hero') {
    const tailWave1 = Math.sin(ts * 4.6 + bodySeed) * 9;
    const tailWave2 = Math.sin(ts * 4.6 - 1.1 + bodySeed) * 16;
    ctx.strokeStyle = arch === 'vanara_hero' ? cast.accentColor : cast.primaryColor;
    ctx.lineWidth = arch === 'vanara_hero' ? 8 : 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-16, -42);
    ctx.bezierCurveTo(-72, -32 + tailWave1, -78, -112 + tailWave1, -40 + tailWave2 * 0.4, -118 + tailWave2);
    ctx.stroke();
  }

  // Articulated 2-Segment Back Arm (from shared 2-bone solver)
  ctx.save();
  ctx.translate(armRig.back.shoulderX, armRig.back.shoulderY);
  ctx.rotate(armRig.back.shoulderAngle);
  ctx.fillStyle = darkenHex(skin, 0.72);
  ctx.fillRect(-4, 0, 8, armRig.back.upperLen + 2);
  ctx.translate(0, armRig.back.upperLen);
  ctx.rotate(armRig.back.elbowAngle);
  ctx.fillRect(-3.5, 0, 7, armRig.back.forearmLen);
  ctx.beginPath();
  ctx.arc(0, armRig.back.forearmLen + 1, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Lower Body (Dhoti / Saree / Armor / Legs)
  if (pose === 'sit' || pose === 'kneel') {
    ctx.fillStyle = arch === 'king' ? '#f2be38' : darkenHex(cast.primaryColor, 0.78);
    ctx.beginPath();
    ctx.moveTo(-44, -22);
    ctx.lineTo(44, -22);
    ctx.lineTo(32, -52);
    ctx.lineTo(-32, -52);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = '#0e1120';
    ctx.fillRect(-16 - stride * 0.52, -24, 11, 24);
    ctx.fillRect(6 + stride * 0.52, -24, 11, 24);

    ctx.fillStyle =
      arch === 'king'
        ? '#f2be38'
        : arch === 'queen' || arch === 'sage' || arch === 'knight' || arch === 'samurai'
          ? cast.primaryColor
          : '#d6ccb8';
    ctx.beginPath();
    ctx.moveTo(-20, -64);
    ctx.lineTo(20, -64);
    ctx.lineTo(25 + stride * 0.35, -12);
    ctx.lineTo(0, arch === 'queen' ? -8 : -22);
    ctx.lineTo(-24 - stride * 0.35, -12);
    ctx.closePath();
    ctx.fill();
  }

  // Torso Wedge with Subtle Breathing Chest Expansion
  const chestW = 23 + breath * 0.9 + speechEnergy * 0.8;
  ctx.fillStyle = cast.primaryColor;
  ctx.beginPath();
  ctx.moveTo(-chestW, -122 + chestRise);
  ctx.lineTo(chestW, -122 + chestRise);
  ctx.lineTo(18, -62);
  ctx.lineTo(-18, -62);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = darkenHex(cast.primaryColor, 0.55);
  ctx.beginPath();
  ctx.moveTo(-chestW, -122 + chestRise);
  ctx.lineTo(-2, -122 + chestRise);
  ctx.lineTo(-2, -62);
  ctx.lineTo(-18, -62);
  ctx.closePath();
  ctx.fill();

  // Accent Royal Sash / Armor Band
  ctx.fillStyle = cast.accentColor;
  ctx.beginPath();
  ctx.moveTo(-19, -122 + chestRise);
  ctx.lineTo(-9, -122 + chestRise);
  ctx.lineTo(18, -66);
  ctx.lineTo(8, -66);
  ctx.closePath();
  ctx.fill();

  // Attack Action Motion-Smear Arc during peak strike frames!
  if (env.smearAlpha > 0.05) {
    ctx.save();
    ctx.strokeStyle = `rgba(255, 232, 152, ${(env.smearAlpha * 0.55).toFixed(2)})`;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(armRig.front.shoulderX, armRig.front.shoulderY, 54, -Math.PI * 0.82, 0.25);
    ctx.stroke();
    ctx.restore();
  }

  // Articulated 2-Segment Front Arm (exact 2-bone wrist solver matching hand-mounted props!)
  ctx.save();
  ctx.translate(armRig.front.shoulderX, armRig.front.shoulderY);
  ctx.rotate(armRig.front.shoulderAngle);
  ctx.fillStyle = cast.primaryColor;
  ctx.fillRect(-6, -2, 12, 12);
  ctx.fillStyle = skin;
  ctx.fillRect(-4.5, 8, 9, armRig.front.upperLen - 5);
  ctx.translate(0, armRig.front.upperLen);
  ctx.rotate(armRig.front.elbowAngle);
  ctx.fillStyle = skin;
  ctx.fillRect(-4, 0, 8, armRig.front.forearmLen);
  ctx.fillStyle = cast.accentColor;
  ctx.fillRect(-4.5, armRig.front.forearmLen - 6, 9, 3.5);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, armRig.front.forearmLen + 2, 5.8, 0, Math.PI * 2);
  ctx.fill();
  if (rig?.heldProp && rig.heldProp !== 'none' && rig.heldHand !== 'back') {
    ctx.save();
    ctx.translate(0, armRig.front.forearmLen + 4);
    ctx.rotate(pose === 'attack' ? -0.95 : -0.58);
    drawStoryProp(ctx, rig.heldProp, 16, 0, 0.36, ts, beatU);
    ctx.restore();
  }
  ctx.restore();

  // Style-Native Shadow Puppetry Bamboo Control Rods extending downward from live wrists!
  if (styleGrammar.rodPuppetMode) {
    ctx.save();
    ctx.strokeStyle = 'rgba(20, 14, 10, 0.72)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(armRig.front.wristX, armRig.front.wristY + 4);
    ctx.lineTo(armRig.front.wristX + 10, 48);
    ctx.moveTo(armRig.back.wristX, armRig.back.wristY + 4);
    ctx.lineTo(armRig.back.wristX - 10, 48);
    ctx.stroke();
    ctx.restore();
  }

  // Scaled Sculpted Head (with breathing lift + subtle speaking nod)
  ctx.save();
  ctx.translate(2, -148 + chestRise * 1.15);
  ctx.rotate(talkPulse * 0.055);
  ctx.scale(0.32, 0.32);
  drawActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', ts, rig);
  ctx.restore();

  ctx.restore();
}

// =========================================================================
// 3. ALL 14 BUILT-IN ANIMATED STORYTELLING PROPS (Graphic-Novel Geometry)
// =========================================================================
export function drawStoryProp(
  ctx: CanvasRenderingContext2D,
  prop: PropId,
  x: number,
  y: number,
  scale: number,
  t: number,
  beatU: number
): void {
  if (prop === 'none') return;
  const ts = snap24(t);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (prop === 'khanda_sword') {
    // Sweeping metallic specular sheen along the sacred Khanda blade
    ctx.rotate(-0.45 + Math.sin(ts * 2.2) * 0.03);
    ctx.fillStyle = '#f5bf38';
    ctx.fillRect(-18, -5, 24, 10);
    ctx.fillRect(4, -22, 7, 44);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(11, -7); ctx.lineTo(116, -15); ctx.lineTo(132, 0); ctx.lineTo(116, 15); ctx.lineTo(11, 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8faed6';
    ctx.beginPath();
    ctx.moveTo(11, 0); ctx.lineTo(132, 0); ctx.lineTo(116, 15); ctx.lineTo(11, 7);
    ctx.closePath();
    ctx.fill();
    const glintX = 18 + ((ts * 95) % 106);
    ctx.fillStyle = 'rgba(255, 250, 220, 0.78)';
    ctx.beginPath();
    ctx.moveTo(glintX, -11); ctx.lineTo(glintX + 12, -11); ctx.lineTo(glintX + 4, 11); ctx.lineTo(glintX - 8, 11);
    ctx.closePath();
    ctx.fill();
  } else if (prop === 'bow_arrow') {
    // Golden Divine Dhanush + Taut Vibrating Bowstring & Pulsing Energy Arrowhead
    const drawTension = Math.sin(ts * 4.5) * 6;
    ctx.strokeStyle = '#ffd147';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(-20, 0, 74, -Math.PI * 0.42, Math.PI * 0.42);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, -70);
    ctx.lineTo(-32 - drawTension, 0);
    ctx.lineTo(-2, 70);
    ctx.stroke();
    const tipGlow = 0.25 + 0.2 * Math.sin(ts * 10);
    ctx.fillStyle = `rgba(255, 90, 110, ${tipGlow})`;
    ctx.beginPath();
    ctx.arc(98 - drawTension, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff3855';
    ctx.fillRect(-32 - drawTension, -3, 124, 6);
    ctx.beginPath();
    ctx.moveTo(110 - drawTension, 0); ctx.lineTo(86 - drawTension, -12); ctx.lineTo(86 - drawTension, 12); ctx.closePath();
    ctx.fill();
  } else if (prop === 'saffron_feast') {
    // Carved Chowki Table + Banana Leaf + Saffron Rice + Animated Rising Graveyard Mist!
    ctx.fillStyle = '#5c2e19';
    ctx.fillRect(-72, 0, 144, 20);
    ctx.fillRect(-66, 20, 16, 20);
    ctx.fillRect(50, 20, 16, 20);
    ctx.fillStyle = '#99532e';
    ctx.fillRect(-72, 0, 144, 7);
    ctx.fillStyle = '#1f7a44';
    ctx.beginPath();
    ctx.ellipse(0, -4, 58, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5be38';
    ctx.beginPath();
    ctx.arc(0, -6, 36, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#e6223c';
    ctx.fillRect(-14, -22, 8, 3);
    ctx.fillRect(8, -26, 8, 3);
    ctx.fillRect(2, -14, 9, 3);
    for (let i = 0; i < 6; i++) {
      const p = (t * 0.55 + i * 0.17) % 1;
      const mx = Math.sin(p * 6 + i) * 28;
      const my = -32 - p * 110;
      ctx.fillStyle = `rgba(110, 240, 165, ${Math.sin(p * Math.PI) * 0.55})`;
      ctx.beginPath();
      ctx.arc(mx, my, 10 + p * 16, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (prop === 'seven_mattresses') {
    const colors = ['#f2e7ce', '#cf3854', '#2b8a7a', '#f2bd38', '#684ca8', '#d96941', '#faf2df'];
    ctx.fillStyle = '#592d19';
    ctx.fillRect(-94, 24, 188, 16);
    for (let i = 0; i < 7; i++) {
      const my = 10 - i * 16;
      ctx.fillStyle = colors[i];
      ctx.fillRect(-84, my, 168, 13);
      ctx.fillStyle = darkenHex(colors[i], 0.72);
      ctx.fillRect(-84, my + 8, 168, 5);
    }
    const pulse = 0.6 + 0.4 * Math.sin(t * 9);
    ctx.fillStyle = `rgba(255, 28, 66, ${0.28 + pulse * 0.35})`;
    ctx.beginPath();
    ctx.arc(0, 23, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff173d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-22, 24);
    ctx.quadraticCurveTo(-6, 18, 6, 26);
    ctx.quadraticCurveTo(16, 30, 26, 20);
    ctx.stroke();
  } else if (prop === 'lotus_petal') {
    const fallU = Math.min(1, beatU / 0.62);
    const breeze = Math.sin(ts * 3.4) * 3.5;
    const px = Math.sin(fallU * Math.PI * 3) * 44 * (1 - fallU) + breeze;
    const py = -120 + fallU * 124 + Math.cos(ts * 2.8) * 1.8;
    if (fallU >= 1) {
      const imp = (beatU - 0.62) / 0.38;
      ctx.strokeStyle = `rgba(255, 36, 94, ${Math.max(0, 1 - imp)})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 8, 18 + imp * 85, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate((fallU >= 1 ? 0.18 : Math.sin(fallU * Math.PI * 3) * 0.55) + Math.sin(ts * 3.1) * 0.05);
    ctx.fillStyle = '#ff3b8d';
    ctx.beginPath();
    ctx.moveTo(-36, 0);
    ctx.quadraticCurveTo(0, -26, 36, 0);
    ctx.quadraticCurveTo(0, 20, -36, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffc7e0';
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.quadraticCurveTo(0, -14, 24, -2);
    ctx.quadraticCurveTo(0, 4, -26, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (prop === 'diya_lamp') {
    const flick = 0.88 + 0.12 * Math.sin(ts * 16);
    ctx.fillStyle = 'rgba(255, 198, 64, 0.2)';
    ctx.beginPath();
    ctx.arc(0, -24, 72 * flick, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c45e31';
    ctx.beginPath();
    ctx.moveTo(-42, 0); ctx.lineTo(48, 0); ctx.lineTo(28, 22); ctx.lineTo(-28, 22); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd147';
    ctx.beginPath();
    ctx.moveTo(0, -64 * flick); ctx.lineTo(18, -4); ctx.lineTo(-18, -4); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -38 * flick); ctx.lineTo(7, -6); ctx.lineTo(-7, -6); ctx.closePath();
    ctx.fill();
  } else if (prop === 'treasure_chest') {
    // Shimmering treasure glow + glinting gold & ruby crown jewel
    const glow = 0.2 + 0.12 * Math.sin(ts * 5.2);
    ctx.fillStyle = `rgba(255, 218, 86, ${glow})`;
    ctx.beginPath();
    ctx.arc(0, -18, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#73381c';
    ctx.fillRect(-62, -12, 124, 52);
    ctx.fillStyle = '#f5bf38';
    ctx.fillRect(-62, -12, 124, 10);
    ctx.fillRect(-10, -12, 20, 52);
    ctx.fillStyle = '#ffe066';
    ctx.beginPath();
    ctx.arc(0, -12, 48, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#ff173d';
    ctx.beginPath();
    ctx.moveTo(0, -44); ctx.lineTo(12, -30); ctx.lineTo(0, -16); ctx.lineTo(-12, -30); ctx.closePath();
    ctx.fill();
    const sp = 7 + Math.sin(ts * 9) * 5;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-28 - sp * 0.5, -34, sp, 2.5);
    ctx.fillRect(-28 - 1.2, -34 - sp * 0.5, 2.5, sp);
  } else if (prop === 'royal_scroll') {
    // Gently breathing unfurled parchment & gilded calligraphy sweep
    const unfurl = 0.85 + 0.15 * Math.min(1, beatU * 2.5) + Math.sin(ts * 2.4) * 0.025;
    const hw = 64 * unfurl;
    ctx.fillStyle = '#f5e4bc';
    ctx.fillRect(-hw, -44, hw * 2, 88);
    ctx.fillStyle = '#d49d35';
    ctx.fillRect(-hw - 10, -50, 14, 100);
    ctx.fillRect(hw - 4, -50, 14, 100);
    ctx.fillStyle = '#5e341c';
    for (let i = 0; i < 4; i++) ctx.fillRect(-hw * 0.7, -26 + i * 18, hw * 1.4, 5);
    const sweep = -hw + ((ts * 54) % (hw * 2));
    ctx.fillStyle = 'rgba(255, 232, 150, 0.25)';
    ctx.fillRect(sweep, -44, 18, 88);
  } else if (prop === 'kali_idol') {
    // Pulsing vermilion aura & flickering sacred third-eye gleam
    const aura = 0.22 + 0.12 * Math.sin(ts * 6.5);
    ctx.fillStyle = `rgba(255, 42, 68, ${aura})`;
    ctx.beginPath();
    ctx.arc(0, -44, 78, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#090714';
    ctx.beginPath();
    ctx.moveTo(-54, 48); ctx.lineTo(-42, -52); ctx.lineTo(0, -108); ctx.lineTo(42, -52); ctx.lineTo(54, 48);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffd04d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -64, 44 + Math.sin(ts * 4) * 2.5, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#ff173d';
    ctx.beginPath();
    ctx.moveTo(0, -76); ctx.lineTo(7, -60); ctx.lineTo(0, -44); ctx.lineTo(-7, -60); ctx.closePath();
    ctx.fill();
  } else if (prop === 'magic_chariot') {
    // Rolling spoked wheel + subtle suspension bounce + fluttering war pennant
    const bounce = Math.sin(ts * 8) * 3;
    ctx.translate(0, bounce);
    ctx.fillStyle = '#f2be38';
    ctx.beginPath();
    ctx.moveTo(-78, 12); ctx.lineTo(-56, -42); ctx.lineTo(68, -42); ctx.lineTo(84, 12); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c91832';
    ctx.fillRect(-52, -36, 112, 26);
    // Fluttering chariot banner
    ctx.fillStyle = '#d49d35';
    ctx.fillRect(-54, -92, 5, 52);
    ctx.fillStyle = '#ff2a44';
    ctx.beginPath();
    ctx.moveTo(-49, -90);
    ctx.lineTo(-96 + Math.sin(ts * 10) * 8, -78);
    ctx.lineTo(-49, -66);
    ctx.closePath();
    ctx.fill();
    // Spinning 8-spoke chariot wheel
    ctx.save();
    ctx.translate(0, 20);
    ctx.rotate(ts * 4.2);
    ctx.strokeStyle = '#ffd966';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 3.5;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * -32, Math.sin(a) * -32);
      ctx.lineTo(Math.cos(a) * 32, Math.sin(a) * 32);
      ctx.stroke();
    }
    ctx.restore();
  } else if (prop === 'earthen_pot') {
    // Gentle vine sprout sway + rising warm steam wisps
    const sway = Math.sin(ts * 3.2) * 7;
    ctx.fillStyle = '#c76138';
    ctx.beginPath();
    ctx.arc(0, 6, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8c3f22';
    ctx.beginPath();
    ctx.arc(0, 6, 46, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();
    ctx.fillStyle = '#d97648';
    ctx.fillRect(-26, -48, 52, 14);
    ctx.strokeStyle = '#4ad682';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.quadraticCurveTo(18 + sway * 0.5, -76, 42 + sway, -62 + sway * 0.3);
    ctx.stroke();
  } else if (prop === 'sacred_fire') {
    const fH = 74 + Math.sin(ts * 15) * 14;
    ctx.fillStyle = '#5c2e19';
    ctx.fillRect(-62, 14, 124, 24);
    ctx.fillStyle = '#ff4d1a';
    ctx.beginPath();
    ctx.moveTo(-42, 14); ctx.lineTo(0, -fH); ctx.lineTo(42, 14); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd147';
    ctx.beginPath();
    ctx.moveTo(-22, 14); ctx.lineTo(0, -fH * 0.65); ctx.lineTo(22, 14); ctx.closePath();
    ctx.fill();
  } else if (prop === 'banyan_bough') {
    // Gently swaying aerial roots beneath heavy banyan bough
    ctx.fillStyle = '#060814';
    ctx.fillRect(-160, -14, 320, 24);
    ctx.fillStyle = '#3f5c99';
    ctx.fillRect(-160, -14, 320, 5);
    ctx.strokeStyle = '#0a0e20';
    ctx.lineWidth = 4;
    for (let i = -2; i <= 2; i++) {
      const rx = i * 56;
      const sway = Math.sin(ts * 2.1 + i) * 7;
      ctx.beginPath();
      ctx.moveTo(rx, 8);
      ctx.quadraticCurveTo(rx + sway * 0.5, 42, rx + sway, 76);
      ctx.stroke();
    }
  } else if (prop === 'peacock_throne') {
    // Iridescent Peacock Fan Jewel Shimmer Sweep
    ctx.fillStyle = '#f2be38';
    ctx.beginPath();
    ctx.arc(0, -56, 68, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#1b5e63';
    ctx.beginPath();
    ctx.arc(0, -56, 52, Math.PI, 0);
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      const a = Math.PI + ((i + 1) / 6) * Math.PI;
      const glow = 0.55 + 0.45 * Math.sin(ts * 5 - i * 0.9);
      ctx.fillStyle = `rgba(255, 224, 102, ${glow})`;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 38, -56 + Math.sin(a) * 38, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f2be38';
    ctx.fillRect(-58, -56, 116, 92);
    ctx.fillStyle = '#99182e';
    ctx.fillRect(-46, -46, 92, 68);
  } else if (!drawExpandedStoryProp(ctx, prop, t)) {
    if (!drawEncyclopedicStoryProp(ctx, prop, t)) {
      if (!drawWorldStoryProp(ctx, prop, t)) {
        if (!drawUniversalStoryProp(ctx, prop, t)) {
          drawAtlasStoryProp(ctx, prop, t);
        }
      }
    }
  }

  ctx.restore();
}

// Register drawStoryProp with modularEntityRenderer for Wave 9 hand-held prop rigging (zero circular imports)
setHeldPropRenderer(drawStoryProp);

