/**
 * Katha Studio — Unified Parametric Modular Entity Renderer
 *
 * Renders ANY `CharacterDNA` combination across all 6 anatomical chassis:
 *   - humanoid, quadruped, avian, serpentine, arachnid, ethereal
 * in both dramatic close-ups (`drawModularEntityCloseUp`) and full-body articulated
 * shots (`drawModularEntityFullBody`), seamlessly inheriting:
 *   - 12-Principles pose envelopes & archetype/gait kinematics
 *   - 2-Bone articulated arm rig (+ optional extra divine/asura arms)
 *   - Unified FACS 10-emotion eyes/brows + 4-shape lip-sync visemes
 *   - Style-native animation grammars (including Shadow Puppetry bamboo rods & line boil)
 *   - Clipped procedural surface patterns (stripes, spots, scales, feathers, brocade, kente, etc.)
 *   - Live part thumbnail rendering for the Sims-style Entity Workshop Modal
 */

import {
  ArchetypeKinematics,
  SceneLightingState,
  computeActorArmRig,
  computePoseEnvelope,
  getArchetypeKinematics,
  getStyleAnimationGrammar,
  snapStyleTime,
} from './animationEngine';
import {
  AuraStyleId,
  CapeStyleId,
  CharacterDNA,
  CollarAccessoryId,
  EarStyleId,
  FacialHairId,
  FaceMarkId,
  HairStyleId,
  HeadShapeId,
  HeadwearStyleId,
  HornStyleId,
  SurfacePatternId,
  TailStyleId,
  TopStyleId,
  WingStyleId,
  resolveAccessories,
  resolveBodyMarks,
  resolveFaceMorph,
} from './characterDna';
import {
  drawUnifiedEyePair,
  drawUnifiedMouth,
  getExpressionHeadTilt,
  getVisemeAperture,
} from './facialExpressions';
import {
  drawArmBodyMarksOverlay,
  drawBackGearLayer,
  drawBodyMarksLayer,
  drawEarAndFaceJewelryLayer,
  drawEyewearLayer,
  drawFootwearLayer,
  drawGlovesLayer,
  drawGranularEyesLayer,
  drawGranularFaceMarksLayer,
  drawGranularFacialHair,
  drawGranularHairBehind,
  drawGranularHairFront,
  drawGranularMouthLayer,
  drawNeckwearLayer,
  drawOuterwearCloseUpLayer,
  drawOuterwearLayer,
  drawSleeveOverlay,
  drawWaistLayer,
  drawWristwearLayer,
  hasGranularFaceOverrides,
} from './granularCharacterLayers';
import type {
  CastMember,
  ExpressionId,
  MotionId,
  MotionProfileId,
  PoseId,
  RenderStyleId,
} from './types';

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function darkenHex(hex: string, factor = 0.56): string {
  const clean = (hex || '#445577').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0');
  const r = Math.max(0, Math.min(255, Math.round(parseInt(full.slice(0, 2), 16) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(parseInt(full.slice(2, 4), 16) * factor)));
  const b = Math.max(0, Math.min(255, Math.round(parseInt(full.slice(4, 6), 16) * factor)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function lightenHex(hex: string, amount = 0.25): string {
  const clean = (hex || '#445577').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0');
  const r = Math.min(255, Math.round(parseInt(full.slice(0, 2), 16) + (255 - parseInt(full.slice(0, 2), 16)) * amount));
  const g = Math.min(255, Math.round(parseInt(full.slice(2, 4), 16) + (255 - parseInt(full.slice(2, 4), 16)) * amount));
  const b = Math.min(255, Math.round(parseInt(full.slice(4, 6), 16) + (255 - parseInt(full.slice(4, 6), 16)) * amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function snap24(t: number): number {
  return Math.floor(t * 24) / 24;
}

function resolveDnaKinematics(cast: CastMember, dna: CharacterDNA): ArchetypeKinematics {
  const base = getArchetypeKinematics(cast.archetype);
  const gait = dna.morph.gait;
  if (!gait || gait === 'auto') {
    if (dna.chassis === 'ethereal') {
      return { ...base, gait: 'ethereal', hoverAmp: Math.max(base.hoverAmp, 9), capeDrag: 1.5 };
    }
    if (dna.chassis === 'avian') {
      return { ...base, gait: 'agile', strideHz: 7.4, bobAmp: 6.5 };
    }
    if (dna.chassis === 'quadruped') {
      return { ...base, gait: 'predator', strideHz: 6.2, strideAmp: 19 };
    }
    if (dna.chassis === 'arachnid') {
      return { ...base, gait: 'agile', strideHz: 9.4, bobAmp: 5.2 };
    }
    if (dna.morph.height >= 1.18 || dna.morph.torsoBulk >= 1.22) {
      return { ...base, gait: 'heavy', strideHz: 4.5, squashAmp: 0.085 };
    }
    return base;
  }
  const gaitMap: Record<Exclude<typeof gait, 'auto'>, Partial<ArchetypeKinematics>> = {
    heavy: { gait: 'heavy', strideHz: 4.3, strideAmp: 11, bobAmp: 4.4, squashAmp: 0.085, breathHz: 1.4 },
    predator: { gait: 'predator', strideHz: 6.4, strideAmp: 20, bobAmp: 3.2, postureLean: 0.08 },
    agile: { gait: 'agile', strideHz: 9.2, strideAmp: 19, bobAmp: 9.2, swayAmp: 0.036 },
    ethereal: { gait: 'ethereal', strideHz: 4.8, hoverAmp: 9.5, capeDrag: 1.55, bobAmp: 2.5 },
    martial: { gait: 'martial', strideHz: 6.6, strideAmp: 17, armSwingAmp: 0.45, capeDrag: 1.3 },
    regal: { gait: 'regal', strideHz: 5.0, strideAmp: 13, bobAmp: 3.0, capeDrag: 1.35 },
    folk: { gait: 'folk', strideHz: 6.8, strideAmp: 15, bobAmp: 5.2, swayAmp: 0.024 },
  };
  return { ...base, ...(gaitMap[gait] || {}) };
}

// =========================================================================
// PROCEDURAL SURFACE COAT / TEXTILE PATTERNS (Clipped to current ctx path)
// =========================================================================

function paintSurfacePatternClipped(
  ctx: CanvasRenderingContext2D,
  pattern: SurfacePatternId,
  tint: string,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  if (pattern === 'solid') return;
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.55;

  if (pattern === 'tiger_stripes') {
    ctx.fillStyle = tint;
    for (let sy = y - 10; sy < y + h + 10; sy += 16) {
      ctx.beginPath();
      ctx.moveTo(x - 6, sy);
      ctx.lineTo(x + w * 0.44, sy + 5);
      ctx.lineTo(x - 6, sy + 9);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + w + 6, sy + 6);
      ctx.lineTo(x + w * 0.56, sy + 11);
      ctx.lineTo(x + w + 6, sy + 15);
      ctx.closePath();
      ctx.fill();
    }
  } else if (pattern === 'leopard_spots') {
    ctx.fillStyle = tint;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 6; col++) {
        const sx = x + ((col + (row % 2) * 0.5) / 5.5) * w;
        const sy = y + (row / 7.5) * h;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 5.2, 3.8, (row + col) * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (pattern === 'serpent_scales') {
    ctx.strokeStyle = tint;
    ctx.lineWidth = 2;
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 8; col++) {
        const sx = x + (col + (row % 2) * 0.5) * 18;
        const sy = y + row * 14;
        ctx.beginPath();
        ctx.arc(sx, sy, 9, 0, Math.PI);
        ctx.stroke();
      }
    }
  } else if (pattern === 'feather_layers') {
    ctx.strokeStyle = tint;
    ctx.lineWidth = 1.8;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 7; col++) {
        const sx = x + col * 20 + (row % 2) * 10;
        const sy = y + row * 15;
        ctx.beginPath();
        ctx.moveTo(sx - 8, sy);
        ctx.quadraticCurveTo(sx, sy + 13, sx + 8, sy);
        ctx.stroke();
      }
    }
  } else if (pattern === 'royal_brocade') {
    ctx.strokeStyle = tint;
    ctx.lineWidth = 1.6;
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 6; col++) {
        const sx = x + col * 24 + (row % 2) * 12;
        const sy = y + row * 22;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 7);
        ctx.lineTo(sx + 6, sy);
        ctx.lineTo(sx, sy + 7);
        ctx.lineTo(sx - 6, sy);
        ctx.closePath();
        ctx.stroke();
      }
    }
  } else if (pattern === 'kente_weave') {
    ctx.fillStyle = tint;
    for (let sy = y; sy < y + h; sy += 20) {
      ctx.fillRect(x, sy, w, 4);
      for (let sx = x; sx < x + w; sx += 16) {
        ctx.fillRect(sx, sy + 6, 7, 7);
      }
    }
  } else if (pattern === 'bark_grain') {
    ctx.strokeStyle = tint;
    ctx.lineWidth = 2;
    for (let sx = x + 6; sx < x + w; sx += 14) {
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.quadraticCurveTo(sx + 5, y + h * 0.5, sx - 3, y + h);
      ctx.stroke();
    }
  } else if (pattern === 'starfield_cosmic') {
    ctx.fillStyle = tint;
    for (let i = 0; i < 18; i++) {
      const sx = x + ((i * 53) % 97) * 0.01 * w;
      const sy = y + ((i * 37) % 93) * 0.01 * h;
      const r = i % 3 === 0 ? 3.2 : 1.8;
      ctx.beginPath();
      ctx.moveTo(sx, sy - r * 1.5);
      ctx.lineTo(sx + r, sy);
      ctx.lineTo(sx, sy + r * 1.5);
      ctx.lineTo(sx - r, sy);
      ctx.closePath();
      ctx.fill();
    }
  } else if (pattern === 'stone_cracks') {
    ctx.strokeStyle = tint;
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 6; i++) {
      const sx = x + ((i * 41) % 85) * 0.01 * w;
      const sy = y + ((i * 29) % 75) * 0.01 * h;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 10, sy + 14);
      ctx.lineTo(sx + 2, sy + 28);
      ctx.stroke();
    }
  } else if (pattern === 'circuit_trace') {
    ctx.strokeStyle = tint;
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const sx = x + ((i * 23 + 8) % 88) * 0.01 * w;
      const sy = y + ((i * 19 + 6) % 72) * 0.01 * h;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 16, sy);
      ctx.lineTo(sx + 22, sy + 14);
      ctx.stroke();
      ctx.fillStyle = tint;
      ctx.beginPath(); ctx.arc(sx + 22, sy + 14, 3, 0, Math.PI * 2); ctx.fill();
    }
  } else if (pattern === 'pinstripe') {
    ctx.strokeStyle = tint;
    ctx.lineWidth = 1.4;
    for (let sx = x + 6; sx < x + w; sx += 10) {
      ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx, y + h); ctx.stroke();
    }
  } else if (pattern === 'camo_hex') {
    ctx.strokeStyle = tint;
    ctx.lineWidth = 1.6;
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 5; col++) {
        const cx = x + col * 24 + (row % 2) * 12;
        const cy = y + row * 20;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          const px = cx + Math.cos(a) * 9;
          const py = cy + Math.sin(a) * 9;
          if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  } else if (pattern === 'starfield_speckle') {
    ctx.fillStyle = tint;
    for (let i = 0; i < 26; i++) {
      const sx = x + ((i * 47 + 11) % 95) * 0.01 * w;
      const sy = y + ((i * 31 + 7) % 91) * 0.01 * h;
      ctx.beginPath(); ctx.arc(sx, sy, i % 4 === 0 ? 2.6 : 1.3, 0, Math.PI * 2); ctx.fill();
    }
  } else if (pattern === 'circuit_traces') {
    ctx.strokeStyle = tint;
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const lx = x + (i / 6) * w + 8;
      const ly = y + ((i * 23) % 70) * 0.01 * h;
      ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(lx, ly); ctx.lineTo(lx + 18, ly + 18); ctx.stroke();
      ctx.fillStyle = tint; ctx.beginPath(); ctx.arc(lx + 18, ly + 18, 3.2, 0, Math.PI * 2); ctx.fill();
    }
  } else if (pattern === 'starfield_constellation') {
    ctx.strokeStyle = tint; ctx.fillStyle = tint; ctx.lineWidth = 1.4;
    let prevX = x + w * 0.2; let prevY = y + h * 0.2;
    for (let i = 0; i < 8; i++) {
      const sx = x + ((i * 37 + 15) % 88) * 0.01 * w;
      const sy = y + ((i * 29 + 11) % 86) * 0.01 * h;
      ctx.beginPath(); ctx.arc(sx, sy, 2.8, 0, Math.PI * 2); ctx.fill();
      if (i > 0) { ctx.beginPath(); ctx.moveTo(prevX, prevY); ctx.lineTo(sx, sy); ctx.stroke(); }
      prevX = sx; prevY = sy;
    }
  } else if (pattern === 'camo_tactical') {
    ctx.fillStyle = tint;
    for (let i = 0; i < 10; i++) {
      const cx = x + ((i * 41 + 9) % 92) * 0.01 * w;
      const cy = y + ((i * 33 + 13) % 88) * 0.01 * h;
      ctx.beginPath(); ctx.ellipse(cx, cy, 14 + (i % 3) * 6, 8 + (i % 2) * 4, i * 0.6, 0, Math.PI * 2); ctx.fill();
    }
  } else if (pattern === 'dragon_scales' || pattern === 'wave_seigaiha') {
    ctx.strokeStyle = tint; ctx.lineWidth = 2;
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        const cx = x + col * 20 + (row % 2) * 10;
        const cy = y + row * 16;
        ctx.beginPath();
        ctx.arc(cx, cy, 10, pattern === 'wave_seigaiha' ? Math.PI : 0, pattern === 'wave_seigaiha' ? 0 : Math.PI);
        ctx.stroke();
      }
    }
  } else if (pattern === 'plaid_tartan') {
    ctx.strokeStyle = tint; ctx.lineWidth = 3;
    for (let gx = x; gx < x + w; gx += 18) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke(); }
    for (let gy = y; gy < y + h; gy += 18) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke(); }
  } else if (pattern === 'honeycomb_hex') {
    ctx.strokeStyle = tint; ctx.lineWidth = 1.8;
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 5; col++) {
        const cx = x + col * 24 + (row % 2) * 12;
        const cy = y + row * 18;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          const px = cx + Math.cos(a) * 9; const py = cy + Math.sin(a) * 9;
          if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.stroke();
      }
    }
  } else if (pattern === 'floral_botanical') {
    ctx.fillStyle = tint;
    for (let i = 0; i < 8; i++) {
      const fx = x + ((i * 43 + 12) % 86) * 0.01 * w;
      const fy = y + ((i * 31 + 14) % 84) * 0.01 * h;
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(fx + Math.cos(a) * 6, fy + Math.sin(a) * 6, 3.6, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  ctx.restore();
}

// =========================================================================
// AURAS, WINGS, TAILS & CAPES (Animated Secondary Motion!)
// =========================================================================

function drawModularAuraBehind(
  ctx: CanvasRenderingContext2D,
  aura: AuraStyleId,
  accent: string,
  t: number,
  radius = 128
): void {
  if (aura === 'none') return;
  ctx.save();
  if (aura === 'solar_halo') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.arc(0, -14, radius, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + t * 0.35;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (radius + 2), -14 + Math.sin(a) * (radius + 2));
      ctx.lineTo(Math.cos(a) * (radius + 18), -14 + Math.sin(a) * (radius + 18));
      ctx.stroke();
    }
  } else if (aura === 'lunar_crescent') {
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.42;
    ctx.beginPath();
    ctx.arc(0, -20, radius * 0.96, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    // Fallback clean crescent without eroding canvas background
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 10;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.arc(0, -18, radius * 0.9, Math.PI * 0.15, Math.PI * 1.45);
    ctx.stroke();
  } else if (aura === 'ember_sparks') {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + t * 0.9;
      const dist = radius * (0.72 + Math.sin(t * 3 + i) * 0.18);
      const px = Math.cos(a) * dist;
      const py = -12 + Math.sin(a) * dist - ((t * 35 + i * 17) % 36);
      ctx.fillStyle = i % 2 === 0 ? accent : '#ff5e3a';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(px, py - 8);
      ctx.lineTo(px + 5, py);
      ctx.lineTo(px, py + 8);
      ctx.lineTo(px - 5, py);
      ctx.closePath();
      ctx.fill();
    }
  } else if (aura === 'shadow_wisps') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.45;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.sin(t * 1.6 + i) * 0.3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * radius * 0.55, -10 + Math.sin(a) * radius * 0.55);
      ctx.quadraticCurveTo(
        Math.cos(a + 0.4) * radius * 0.9,
        -18 + Math.sin(a + 0.4) * radius * 0.9,
        Math.cos(a + 0.1) * radius * 1.15,
        -24 + Math.sin(a + 0.1) * radius * 1.15
      );
      ctx.stroke();
    }
  } else if (aura === 'petal_orbit') {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + t * 0.7;
      const px = Math.cos(a) * radius * 0.95;
      const py = -14 + Math.sin(a) * radius * 0.85;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(a + Math.PI * 0.5);
      ctx.fillStyle = i % 2 === 0 ? '#f472b6' : accent;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawModularWings(
  ctx: CanvasRenderingContext2D,
  wings: WingStyleId,
  primary: string,
  accent: string,
  pose: PoseId,
  t: number,
  seed: number,
  originY: number,
  spanScale = 1
): void {
  if (wings === 'none') return;
  const flapHz = pose === 'soar' ? 7.2 : pose === 'attack' ? 5.6 : 2.3;
  const flapAmp = pose === 'soar' ? 0.42 : 0.14;
  const flap = Math.sin(t * flapHz + seed) * flapAmp;

  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 10, originY);
    ctx.scale(side * spanScale, spanScale);
    ctx.rotate(flap);

    if (wings === 'feathered_angel' || wings === 'raven_dark') {
      const col = wings === 'raven_dark' ? darkenHex(primary, 0.42) : lightenHex(accent, 0.35);
      const tipCol = wings === 'raven_dark' ? accent : primary;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(38, -44, 92, -32);
      ctx.lineTo(74, -8);
      ctx.lineTo(84, 8);
      ctx.lineTo(54, 18);
      ctx.lineTo(62, 32);
      ctx.lineTo(14, 24);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = tipCol;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(14, -4);
      ctx.lineTo(84, -26);
      ctx.moveTo(14, 8);
      ctx.lineTo(72, 6);
      ctx.stroke();
    } else if (wings === 'bat_demon' || wings === 'dragon_leathery') {
      ctx.fillStyle = wings === 'bat_demon' ? '#161326' : darkenHex(primary, 0.65);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(44, -46);
      ctx.lineTo(94, -30);
      ctx.quadraticCurveTo(68, -6, 76, 18);
      ctx.quadraticCurveTo(46, 4, 42, 28);
      ctx.quadraticCurveTo(22, 10, 0, 22);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(44, -46);
      ctx.lineTo(94, -30);
      ctx.moveTo(44, -46);
      ctx.lineTo(76, 18);
      ctx.moveTo(44, -46);
      ctx.lineTo(42, 28);
      ctx.stroke();
    } else if (wings === 'butterfly_fey') {
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(42, -22, 36, 22, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = primary;
      ctx.beginPath();
      ctx.ellipse(30, 14, 24, 16, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(54, -26, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (wings === 'celestial_flame') {
      ctx.fillStyle = '#ff6b2b';
      ctx.globalAlpha = 0.86;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(48, -54, 96, -24 + Math.sin(t * 9) * 8);
      ctx.quadraticCurveTo(54, 4, 72, 24);
      ctx.quadraticCurveTo(32, 10, 0, 18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(4, 2);
      ctx.quadraticCurveTo(36, -34, 68, -14);
      ctx.quadraticCurveTo(36, 4, 4, 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawModularTail(
  ctx: CanvasRenderingContext2D,
  tail: TailStyleId,
  primary: string,
  accent: string,
  t: number,
  seed: number,
  ox: number,
  oy: number
): void {
  if (tail === 'none') return;
  const w1 = Math.sin(t * 4.4 + seed) * 10;
  const w2 = Math.sin(t * 4.4 - 1.1 + seed) * 17;

  ctx.save();
  if (tail === 'monkey_curled') {
    ctx.strokeStyle = primary;
    ctx.lineWidth = 7.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.bezierCurveTo(ox - 54, oy + 10 + w1, ox - 62, oy - 70 + w1, ox - 24 + w2 * 0.4, oy - 76 + w2);
    ctx.stroke();
  } else if (tail === 'fox_bushy') {
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.quadraticCurveTo(ox - 36, oy - 38 + w1, ox - 66, oy - 22 + w2);
    ctx.quadraticCurveTo(ox - 54, oy + 16 + w1, ox, oy + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(ox - 60, oy - 14 + w2 * 0.8, 12, 0, Math.PI * 2);
    ctx.fill();
  } else if (tail === 'lion_tufted') {
    ctx.strokeStyle = primary;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.quadraticCurveTo(ox - 38, oy - 20 + w1, ox - 48 + w2 * 0.3, oy - 54 + w2 * 0.4);
    ctx.stroke();
    ctx.fillStyle = darkenHex(primary, 0.48);
    ctx.beginPath();
    ctx.ellipse(ox - 48 + w2 * 0.3, oy - 56 + w2 * 0.4, 9, 13, 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (tail === 'dragon_spiked') {
    ctx.strokeStyle = primary;
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.quadraticCurveTo(ox - 44, oy + 14 + w1, ox - 74, oy - 24 + w2);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(ox - 74, oy - 24 + w2);
    ctx.lineTo(ox - 92, oy - 34 + w2);
    ctx.lineTo(ox - 78, oy - 12 + w2);
    ctx.closePath();
    ctx.fill();
  } else if (tail === 'peacock_fan') {
    for (let i = -3; i <= 3; i++) {
      const a = -Math.PI * 0.72 + i * 0.16 + w1 * 0.008;
      const ex = ox + Math.cos(a) * 66;
      const ey = oy + Math.sin(a) * 66;
      ctx.strokeStyle = primary;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(ex, ey, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f2f4f';
      ctx.beginPath();
      ctx.arc(ex, ey, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (tail === 'serpent_whip') {
    ctx.strokeStyle = primary;
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.bezierCurveTo(ox - 30, oy + 12 + w1, ox - 58, oy - 28 + w2, ox - 78, oy + w2 * 0.7);
    ctx.stroke();
  } else if (tail === 'deer_short') {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.ellipse(ox - 10, oy - 6 + w1 * 0.2, 11, 7, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawModularCape(
  ctx: CanvasRenderingContext2D,
  cape: CapeStyleId,
  primary: string,
  secondary: string,
  accent: string,
  pose: PoseId,
  capeDrag: number,
  t: number,
  seed: number,
  shoulderY: number
): void {
  if (cape === 'none') return;
  const motionDrag = (pose === 'walk' ? 18 : pose === 'soar' ? 32 : pose === 'attack' ? 24 : 6) * capeDrag;
  const waveMid = Math.sin(t * 4.8 + seed) * 8 * capeDrag + motionDrag * 0.5;
  const waveTip = Math.sin(t * 4.8 - 1.15 + seed) * 14 * capeDrag + motionDrag;

  ctx.save();
  if (cape === 'royal_cape' || cape === 'feather_mantle') {
    ctx.fillStyle = cape === 'feather_mantle' ? secondary : primary;
    ctx.beginPath();
    ctx.moveTo(-14, shoulderY);
    ctx.quadraticCurveTo(-50 - waveMid, shoulderY + 52, -70 - waveTip, shoulderY + 104);
    ctx.quadraticCurveTo(-36 - waveTip * 0.5, shoulderY + 114, 8, shoulderY + 96);
    ctx.lineTo(12, shoulderY + 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-68 - waveTip, shoulderY + 104);
    ctx.quadraticCurveTo(-36 - waveTip * 0.5, shoulderY + 112, 6, shoulderY + 96);
    ctx.stroke();
  } else if (cape === 'tattered_cloak') {
    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.moveTo(-14, shoulderY);
    ctx.quadraticCurveTo(-48 - waveMid, shoulderY + 52, -74 - waveTip, shoulderY + 98);
    ctx.lineTo(-52 - waveTip * 0.7, shoulderY + 86);
    ctx.lineTo(-42 - waveTip * 0.6, shoulderY + 108);
    ctx.lineTo(-22 - waveTip * 0.4, shoulderY + 90);
    ctx.lineTo(-4, shoulderY + 104);
    ctx.lineTo(10, shoulderY + 4);
    ctx.closePath();
    ctx.fill();
  } else if (cape === 'flowing_dupatta') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(8, shoulderY + 6);
    ctx.bezierCurveTo(-28 - waveMid, shoulderY + 26, -54 - waveTip, shoulderY + 56, -42 - waveTip, shoulderY + 102);
    ctx.stroke();
  } else if (cape === 'celestial_ribbon') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-26, shoulderY + 18);
    ctx.bezierCurveTo(-56 - waveMid, shoulderY - 38, 56 + waveMid, shoulderY - 38, 34, shoulderY + 24);
    ctx.stroke();
  }
  ctx.restore();
}

// =========================================================================
// HEAD, EARS, HORNS, HAIR, FACIAL HAIR, MARKS & HEADWEAR (Close-Up & Full-Body)
// =========================================================================

function buildHeadPath(ctx: CanvasRenderingContext2D, shape: HeadShapeId): void {
  ctx.beginPath();
  switch (shape) {
    case 'oval':
      ctx.ellipse(0, 6, 56, 68, 0, 0, Math.PI * 2);
      break;
    case 'round':
      ctx.arc(0, 4, 62, 0, Math.PI * 2);
      break;
    case 'angular':
      ctx.moveTo(-62, -54);
      ctx.lineTo(62, -54);
      ctx.lineTo(52, 18);
      ctx.lineTo(0, 78);
      ctx.lineTo(-52, 18);
      ctx.closePath();
      break;
    case 'gaunt':
      ctx.moveTo(-52, -56);
      ctx.lineTo(52, -56);
      ctx.lineTo(44, 24);
      ctx.lineTo(14, 76);
      ctx.lineTo(-14, 76);
      ctx.lineTo(-44, 24);
      ctx.closePath();
      break;
    case 'broad_jaw':
      ctx.moveTo(-68, -54);
      ctx.lineTo(68, -54);
      ctx.lineTo(66, 36);
      ctx.lineTo(42, 72);
      ctx.lineTo(-42, 72);
      ctx.lineTo(-66, 36);
      ctx.closePath();
      break;
    case 'canine_snout':
      ctx.moveTo(-62, -56);
      ctx.lineTo(62, -56);
      ctx.lineTo(54, 14);
      ctx.lineTo(14, 86);
      ctx.lineTo(-14, 86);
      ctx.lineTo(-54, 14);
      ctx.closePath();
      break;
    case 'feline_muzzle':
      ctx.moveTo(-66, -48);
      ctx.lineTo(66, -48);
      ctx.lineTo(72, 18);
      ctx.lineTo(36, 68);
      ctx.lineTo(-36, 68);
      ctx.lineTo(-72, 18);
      ctx.closePath();
      break;
    case 'equine_snout':
      ctx.moveTo(-56, -58);
      ctx.lineTo(56, -58);
      ctx.lineTo(46, 34);
      ctx.lineTo(28, 86);
      ctx.lineTo(-28, 86);
      ctx.lineTo(-46, 34);
      ctx.closePath();
      break;
    case 'elephant_trunk':
      ctx.moveTo(-72, -56);
      ctx.lineTo(72, -56);
      ctx.lineTo(66, 26);
      ctx.lineTo(24, 52);
      ctx.lineTo(18, 126);
      ctx.quadraticCurveTo(0, 140, -16, 122);
      ctx.lineTo(-18, 52);
      ctx.lineTo(-66, 26);
      ctx.closePath();
      break;
    case 'croc_snout':
      ctx.moveTo(-58, -44);
      ctx.lineTo(58, -44);
      ctx.lineTo(74, 14);
      ctx.lineTo(46, 78);
      ctx.lineTo(-46, 78);
      ctx.lineTo(-74, 14);
      ctx.closePath();
      break;
    case 'curved_beak':
    case 'raptor_beak':
      ctx.arc(0, -4, 58, 0, Math.PI * 2);
      break;
    case 'serpent_hood':
      ctx.moveTo(-48, -68);
      ctx.lineTo(48, -68);
      ctx.lineTo(58, 12);
      ctx.lineTo(0, 66);
      ctx.lineTo(-58, 12);
      ctx.closePath();
      break;
    case 'arachnid_mandible':
      ctx.ellipse(0, 0, 62, 54, 0, 0, Math.PI * 2);
      break;
    case 'chiseled':
    default:
      ctx.moveTo(-64, -54);
      ctx.lineTo(64, -54);
      ctx.lineTo(58, 22);
      ctx.lineTo(24, 72);
      ctx.lineTo(-24, 72);
      ctx.lineTo(-58, 22);
      ctx.closePath();
      break;
  }
}

function drawModularEars(
  ctx: CanvasRenderingContext2D,
  ears: EarStyleId,
  skin: string,
  primary: string,
  accent: string
): void {
  if (ears === 'none') return;
  ctx.save();
  if (ears === 'human') {
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(-62, 2, 12, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(62, 2, 12, 20, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (ears === 'pointed_elf') {
    ctx.fillStyle = skin;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 56, -10);
      ctx.lineTo(s * 98, -28);
      ctx.lineTo(s * 58, 18);
      ctx.closePath();
      ctx.fill();
    }
  } else if (ears === 'fox_tall') {
    for (const s of [-1, 1]) {
      ctx.fillStyle = primary;
      ctx.beginPath();
      ctx.moveTo(s * 54, -36);
      ctx.lineTo(s * 76, -124);
      ctx.lineTo(s * 14, -58);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(s * 48, -46);
      ctx.lineTo(s * 66, -104);
      ctx.lineTo(s * 24, -58);
      ctx.closePath();
      ctx.fill();
    }
  } else if (ears === 'lion_round') {
    ctx.fillStyle = skin;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(s * 62, -26, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = darkenHex(skin, 0.68);
      ctx.beginPath();
      ctx.arc(s * 62, -26, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = skin;
    }
  } else if (ears === 'elephant_fan') {
    ctx.fillStyle = primary;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 60, -48);
      ctx.quadraticCurveTo(s * 144, -64, s * 134, 24);
      ctx.quadraticCurveTo(s * 114, 72, s * 56, 32);
      ctx.closePath();
      ctx.fill();
    }
  } else if (ears === 'hare_long') {
    for (const s of [-1, 1]) {
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.ellipse(s * 34, -104, 18, 56, s * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2a2a8';
      ctx.beginPath();
      ctx.ellipse(s * 34, -104, 9, 40, s * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ears === 'cow_side') {
    ctx.fillStyle = skin;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(s * 76, -24, 24, 12, s * -0.22, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ears === 'fin_frill') {
    ctx.fillStyle = accent;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 54, -36);
      ctx.lineTo(s * 108, -48);
      ctx.lineTo(s * 96, -10);
      ctx.lineTo(s * 108, 22);
      ctx.lineTo(s * 52, 26);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawModularHorns(
  ctx: CanvasRenderingContext2D,
  horns: HornStyleId,
  accent: string
): void {
  if (horns === 'none') return;
  ctx.save();
  if (horns === 'curved_ram') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(s * 62, -46, 36, s === 1 ? -Math.PI * 0.7 : -Math.PI * 0.3, s === 1 ? Math.PI * 0.75 : Math.PI * 1.25, s === -1);
      ctx.stroke();
    }
  } else if (horns === 'bull_horns') {
    ctx.fillStyle = '#f5ecd7';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 42, -52);
      ctx.quadraticCurveTo(s * 106, -58, s * 98, -124);
      ctx.quadraticCurveTo(s * 76, -78, s * 36, -68);
      ctx.closePath();
      ctx.fill();
    }
  } else if (horns === 'deer_antlers') {
    ctx.strokeStyle = '#d4b483';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 28, -54);
      ctx.lineTo(s * 52, -128);
      ctx.lineTo(s * 76, -158);
      ctx.moveTo(s * 42, -96);
      ctx.lineTo(s * 18, -132);
      ctx.moveTo(s * 52, -124);
      ctx.lineTo(s * 86, -122);
      ctx.stroke();
    }
  } else if (horns === 'demon_crown_horns' || horns === 'oni_twin') {
    ctx.fillStyle = horns === 'oni_twin' ? '#f5ecd7' : accent;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 34, -52);
      ctx.lineTo(s * 66, horns === 'oni_twin' ? -114 : -134);
      ctx.lineTo(s * 14, -60);
      ctx.closePath();
      ctx.fill();
    }
  } else if (horns === 'unicorn_spire') {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-12, -56);
    ctx.lineTo(0, -152);
    ctx.lineTo(12, -56);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawModularHairBehind(
  ctx: CanvasRenderingContext2D,
  hair: HairStyleId,
  hairColor: string,
  t: number
): void {
  if (hair === 'none') return;
  ctx.save();
  ctx.fillStyle = hairColor;

  if (hair === 'lion_mane') {
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const r = i % 2 === 0 ? 150 : 108;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r - 6;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (hair === 'wild_spiky') {
    const spike = Math.sin(t * 5) * 6;
    ctx.beginPath();
    ctx.moveTo(-98, -118);
    ctx.lineTo(98, -118);
    ctx.lineTo(132 + spike, -18);
    ctx.lineTo(100, 62);
    ctx.lineTo(116 - spike, 136);
    ctx.lineTo(0, 102);
    ctx.lineTo(-116 + spike, 136);
    ctx.lineTo(-100, 62);
    ctx.lineTo(-132 - spike, -18);
    ctx.closePath();
    ctx.fill();
  } else if (hair === 'long_flowing') {
    ctx.beginPath();
    ctx.moveTo(-78, -56);
    ctx.lineTo(78, -56);
    ctx.quadraticCurveTo(106, 40, 96, 136);
    ctx.lineTo(-96, 136);
    ctx.quadraticCurveTo(-106, 40, -78, -56);
    ctx.closePath();
    ctx.fill();
  } else if (hair === 'braided_twin') {
    for (const s of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(s * (72 + i * 3), -12 + i * 28, 17 - i * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (hair === 'dreadlocks') {
    ctx.strokeStyle = hairColor;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 16, -54);
      ctx.quadraticCurveTo(i * 22, 26, i * 24 + Math.sin(t * 3 + i) * 5, 118);
      ctx.stroke();
    }
  } else if (hair === 'hooded_cowl') {
    ctx.beginPath();
    ctx.moveTo(-108, 116);
    ctx.quadraticCurveTo(-112, -96, 0, -124);
    ctx.quadraticCurveTo(112, -96, 108, 116);
    ctx.closePath();
    ctx.fill();
  } else if (hair === 'swept_royal' || hair === 'short_crop') {
    ctx.beginPath();
    ctx.moveTo(-74, -56);
    ctx.lineTo(74, -56);
    ctx.lineTo(hair === 'swept_royal' ? 84 : 74, hair === 'swept_royal' ? 54 : 18);
    ctx.lineTo(hair === 'swept_royal' ? -84 : -74, hair === 'swept_royal' ? 54 : 18);
    ctx.closePath();
    ctx.fill();
  } else if (hair === 'topknot_bun') {
    ctx.beginPath();
    ctx.arc(0, -92, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-68, -62, 136, 40);
  } else if (hair === 'feather_crest') {
    for (let i = -2; i <= 2; i++) {
      ctx.save();
      ctx.translate(i * 12, -56);
      ctx.rotate(i * 0.22);
      ctx.beginPath();
      ctx.ellipse(0, -32, 10, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else {
    drawGranularHairBehind(ctx, hair, hairColor, t);
  }
  ctx.restore();
}

function drawModularHeadwear(
  ctx: CanvasRenderingContext2D,
  headwear: HeadwearStyleId,
  primary: string,
  accent: string
): void {
  if (headwear === 'none') return;
  ctx.save();
  if (headwear === 'golden_mukut') {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-66, -48);
    ctx.lineTo(-54, -104);
    ctx.lineTo(-26, -78);
    ctx.lineTo(0, -148);
    ctx.lineTo(26, -78);
    ctx.lineTo(54, -104);
    ctx.lineTo(66, -48);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(0, -76, 10, 0, Math.PI * 2);
    ctx.fill();
  } else if (headwear === 'royal_turban' || headwear === 'mughal_pagri') {
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.ellipse(0, -68, 76, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-62, -52);
    ctx.quadraticCurveTo(0, -86, 62, -52);
    ctx.stroke();
    if (headwear === 'mughal_pagri') {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(-8, -94);
      ctx.quadraticCurveTo(10, -146, 26, -138);
      ctx.quadraticCurveTo(12, -110, 8, -90);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, -82, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (headwear === 'ten_crown') {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-78, -46);
    for (let i = -3; i <= 3; i++) {
      ctx.lineTo(i * 22, -102 - (3 - Math.abs(i)) * 16);
      ctx.lineTo(i * 22 + 11, -66);
    }
    ctx.lineTo(78, -46);
    ctx.closePath();
    ctx.fill();
  } else if (headwear === 'battle_helm') {
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(-72, -36);
    ctx.quadraticCurveTo(-70, -116, 0, -124);
    ctx.quadraticCurveTo(70, -116, 72, -36);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(-70, -52, 140, 9);
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(-10, -118);
    ctx.quadraticCurveTo(0, -162, 26, -146);
    ctx.lineTo(10, -116);
    ctx.closePath();
    ctx.fill();
  } else if (headwear === 'kabuto_crest') {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-84, -36);
    ctx.quadraticCurveTo(-68, -112, 0, -118);
    ctx.quadraticCurveTo(68, -112, 84, -36);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, -96, 40, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  } else if (headwear === 'wizard_hat') {
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.ellipse(0, -50, 96, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-56, -52);
    ctx.lineTo(14, -172);
    ctx.lineTo(56, -52);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(-52, -62, 104, 10);
  } else if (headwear === 'laurel_wreath') {
    ctx.fillStyle = accent;
    for (const s of [-1, 1]) {
      for (let i = 0; i < 6; i++) {
        const a = -0.3 - i * 0.24;
        ctx.save();
        ctx.translate(s * (62 - i * 9), -42 - i * 8);
        ctx.rotate(s * a);
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  } else if (headwear === 'floral_tiara') {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-58, -48);
    ctx.quadraticCurveTo(0, -98, 58, -48);
    ctx.quadraticCurveTo(0, -64, -58, -48);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f472b6';
    for (const x of [-28, 0, 28]) {
      ctx.beginPath();
      ctx.arc(x, x === 0 ? -74 : -62, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (headwear === 'bandana') {
    ctx.fillStyle = primary;
    ctx.fillRect(-66, -58, 132, 18);
    ctx.fillStyle = accent;
    ctx.fillRect(-66, -50, 132, 4);
  } else if (headwear === 'straw_conical') {
    ctx.fillStyle = '#e5c17b';
    ctx.beginPath();
    ctx.moveTo(-116, -42);
    ctx.lineTo(0, -118);
    ctx.lineTo(116, -42);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#92692b';
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (headwear === 'fedora') {
    ctx.fillStyle = darkenHex(primary, 0.65);
    ctx.beginPath(); ctx.ellipse(0, -52, 92, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(-60, -52); ctx.lineTo(-42, -108); ctx.lineTo(0, -96); ctx.lineTo(42, -108); ctx.lineTo(60, -52);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(-56, -62, 112, 10);
  } else if (headwear === 'cyber_visor') {
    ctx.fillStyle = 'rgba(0, 240, 255, 0.34)';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.roundRect(-62, -26, 124, 30, 10); ctx.fill(); ctx.stroke();
  } else if (headwear === 'astronaut_helmet') {
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(0, -4, 86, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(186, 230, 253, 0.16)';
    ctx.beginPath(); ctx.arc(0, -4, 82, 0, Math.PI * 2); ctx.fill();
  } else if (headwear === 'tricorn_hat') {
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(-98, -46); ctx.quadraticCurveTo(0, -134, 98, -46); ctx.lineTo(66, -38); ctx.lineTo(-66, -38);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(0, -76, 11, 0, Math.PI * 2); ctx.fill();
  } else if (headwear === 'samurai_kabuto') {
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.arc(0, -44, 72, Math.PI, 0); ctx.fill();
    ctx.fillRect(-86, -48, 172, 16);
    ctx.strokeStyle = accent; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(0, -98, 42, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  } else if (headwear === 'chef_toque') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-54, -92, 108, 42);
    ctx.beginPath(); ctx.arc(-34, -102, 28, 0, Math.PI * 2); ctx.arc(0, -116, 34, 0, Math.PI * 2); ctx.arc(34, -102, 28, 0, Math.PI * 2); ctx.fill();
  } else if (headwear === 'grad_cap') {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.moveTo(-92, -74); ctx.lineTo(0, -104); ctx.lineTo(92, -74); ctx.lineTo(0, -48); ctx.closePath(); ctx.fill();
    ctx.fillRect(-48, -62, 96, 18);
    ctx.strokeStyle = accent; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, -76); ctx.lineTo(74, -68); ctx.lineTo(74, -26); ctx.stroke();
  } else if (headwear === 'viking_horns') {
    ctx.fillStyle = '#64748b';
    ctx.beginPath(); ctx.arc(0, -44, 68, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#fef9c3';
    for (const sgn of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(sgn * 54, -64); ctx.quadraticCurveTo(sgn * 116, -98, sgn * 92, -138); ctx.quadraticCurveTo(sgn * 84, -84, sgn * 48, -46); ctx.closePath(); ctx.fill();
    }
  } else if (headwear === 'nurse_cap') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(-58, -54); ctx.lineTo(-44, -98); ctx.lineTo(44, -98); ctx.lineTo(58, -54); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-5, -88, 10, 26); ctx.fillRect(-13, -80, 26, 10);
  } else if (headwear === 'cowboy_hat') {
    ctx.fillStyle = '#78350f';
    ctx.beginPath(); ctx.ellipse(0, -56, 104, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(-52, -110, 104, 56, 16); ctx.fill();
    ctx.fillStyle = accent; ctx.fillRect(-52, -70, 104, 10);
  } else if (headwear === 'diver_helmet') {
    ctx.strokeStyle = '#b45309'; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.arc(0, -4, 86, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-80, -4); ctx.lineTo(80, -4); ctx.moveTo(0, -84); ctx.lineTo(0, 76); ctx.stroke();
  } else if (headwear === 'elf_circlet') {
    ctx.strokeStyle = accent; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(0, -34, 68, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.moveTo(0, -74); ctx.lineTo(10, -58); ctx.lineTo(0, -42); ctx.lineTo(-10, -58); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawModularFaceMarks(
  ctx: CanvasRenderingContext2D,
  mark: FaceMarkId,
  accent: string
): void {
  if (mark === 'none') return;
  ctx.save();
  if (mark === 'vermilion_tilak') {
    ctx.fillStyle = '#ef233c';
    ctx.fillRect(-4.5, -44, 9, 24);
  } else if (mark === 'tripundra_ash') {
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-28, -42, 56, 4);
    ctx.fillRect(-24, -34, 48, 4);
    ctx.fillRect(-20, -26, 40, 4);
    ctx.fillStyle = '#ef233c';
    ctx.beginPath();
    ctx.arc(0, -34, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (mark === 'maang_tikka') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -60);
    ctx.lineTo(0, -36);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(0, -44);
    ctx.lineTo(9, -32);
    ctx.lineTo(0, -20);
    ctx.lineTo(-9, -32);
    ctx.closePath();
    ctx.fill();
  } else if (mark === 'third_eye') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, -34, 13, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(0, -34, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (mark === 'war_paint') {
    ctx.fillStyle = accent;
    ctx.fillRect(-48, 12, 22, 6);
    ctx.fillRect(-46, 22, 18, 4);
    ctx.fillRect(26, 12, 22, 6);
    ctx.fillRect(28, 22, 18, 4);
  } else if (mark === 'cheek_scar') {
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(16, -24);
    ctx.lineTo(42, 28);
    ctx.stroke();
  } else if (mark === 'eye_patch') {
    ctx.strokeStyle = '#090b12';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-62, -32);
    ctx.lineTo(62, 4);
    ctx.stroke();
    ctx.fillStyle = '#0f1322';
    ctx.beginPath();
    ctx.ellipse(28, -8, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (mark === 'freckles') {
    ctx.fillStyle = 'rgba(110, 52, 28, 0.55)';
    for (const [fx, fy] of [[-32, 12], [-24, 16], [-36, 19], [32, 12], [24, 16], [36, 19]]) {
      ctx.beginPath();
      ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (mark === 'tribal_lines') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 24, 14);
      ctx.lineTo(s * 48, 10);
      ctx.moveTo(s * 24, 22);
      ctx.lineTo(s * 44, 22);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawModularFacialHair(
  ctx: CanvasRenderingContext2D,
  facialHair: FacialHairId,
  hairColor: string
): void {
  if (facialHair === 'none') return;
  ctx.save();
  ctx.fillStyle = hairColor;
  ctx.strokeStyle = hairColor;

  if (facialHair === 'royal_mustache') {
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(-42, 32);
    ctx.lineTo(-24, 37);
    ctx.lineTo(0, 28);
    ctx.lineTo(24, 37);
    ctx.lineTo(42, 32);
    ctx.closePath();
    ctx.fill();
  } else if (facialHair === 'handlebar') {
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-48, 22);
    ctx.quadraticCurveTo(-24, 36, 0, 24);
    ctx.quadraticCurveTo(24, 36, 48, 22);
    ctx.stroke();
  } else if (facialHair === 'short_trimmed') {
    ctx.beginPath();
    ctx.moveTo(-54, 16);
    ctx.lineTo(-34, 68);
    ctx.lineTo(0, 82);
    ctx.lineTo(34, 68);
    ctx.lineTo(54, 16);
    ctx.lineTo(38, 26);
    ctx.lineTo(0, 34);
    ctx.lineTo(-38, 26);
    ctx.closePath();
    ctx.fill();
  } else if (facialHair === 'sage_long_beard') {
    ctx.beginPath();
    ctx.moveTo(-44, 24);
    ctx.lineTo(44, 24);
    ctx.quadraticCurveTo(32, 92, 0, 128);
    ctx.quadraticCurveTo(-32, 92, -44, 24);
    ctx.closePath();
    ctx.fill();
  } else if (facialHair === 'goatee') {
    ctx.beginPath();
    ctx.moveTo(-18, 48);
    ctx.lineTo(18, 48);
    ctx.lineTo(0, 86);
    ctx.closePath();
    ctx.fill();
  } else if (facialHair === 'whiskers') {
    ctx.lineWidth = 2.6;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 24, 24);
      ctx.lineTo(s * 76, 16);
      ctx.moveTo(s * 24, 32);
      ctx.lineTo(s * 80, 32);
      ctx.moveTo(s * 24, 40);
      ctx.lineTo(s * 72, 48);
      ctx.stroke();
    }
  } else {
    drawGranularFacialHair(ctx, facialHair, hairColor);
  }
  ctx.restore();
}

// =========================================================================
// 1. MODULAR CLOSE-UP PORTRAIT RENDERER (All 6 Chassis & All Features!)
// =========================================================================

export function drawModularEntityCloseUp(
  ctx: CanvasRenderingContext2D,
  cast: CastMember,
  dna: CharacterDNA,
  expression: ExpressionId,
  viseme: number,
  speechEnergy: number,
  lightSide: 'left' | 'right',
  t: number
): void {
  const ts = snap24(t);
  const lightRight = lightSide === 'right';
  const pal = dna.palette;
  const skinShadow = dna.chassis === 'ethereal' ? darkenHex(pal.primary, 0.55) : darkenHex(pal.skin, 0.58);

  let castSeed = 0;
  for (let i = 0; i < cast.id.length; i++) {
    castSeed = (castSeed * 31 + cast.id.charCodeAt(i)) % 997;
  }

  const breath = Math.sin(ts * 2.1 + castSeed * 0.13);
  const speechNod = speechEnergy > 0.18 ? Math.sin(ts * 9.5 + castSeed) * 0.032 * speechEnergy : 0;
  const exprTilt = getExpressionHeadTilt(expression);

  ctx.save();
  drawModularAuraBehind(ctx, dna.appendages.aura, pal.accent, ts, 134);

  ctx.translate(0, breath * -2.2 - speechEnergy * 2.8);
  ctx.rotate(Math.sin(ts * 1.9 + castSeed * 0.2) * 0.02 + speechNod + exprTilt);

  const fm = resolveFaceMorph(dna);
  const acc = resolveAccessories(dna);
  const useGranularFace = hasGranularFaceOverrides(dna);

  // Shoulders / Hood / Collar bust base
  const shW = 128 * clamp(dna.morph.shoulderWidth, 0.78, 1.38);
  if (dna.head.headShape === 'serpent_hood') {
    ctx.fillStyle = pal.primary;
    ctx.beginPath();
    ctx.moveTo(0, -135);
    ctx.lineTo(138, -28);
    ctx.lineTo(106, 102);
    ctx.lineTo(44, 190);
    ctx.lineTo(-44, 190);
    ctx.lineTo(-106, 102);
    ctx.lineTo(-138, -28);
    ctx.closePath();
    ctx.fill();
    paintSurfacePatternClipped(ctx, dna.outfit.surfacePattern, pal.patternTint, -140, -140, 280, 330);
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(-44, 52, 20, 0, Math.PI * 2);
    ctx.arc(44, 52, 20, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = dna.outfit.topStyle === 'none_fur' ? pal.primary : pal.primary;
    ctx.beginPath();
    ctx.moveTo(-shW * 1.4, 224);
    ctx.lineTo(-shW, 74);
    ctx.lineTo(shW, 74);
    ctx.lineTo(shW * 1.4, 224);
    ctx.closePath();
    ctx.fill();
    paintSurfacePatternClipped(ctx, dna.outfit.surfacePattern, pal.patternTint, -shW * 1.4, 70, shW * 2.8, 160);
    // Chiaroscuro shoulder shadow half
    ctx.fillStyle = darkenHex(pal.primary, 0.54);
    ctx.beginPath();
    ctx.moveTo(lightRight ? -shW * 1.4 : 0, 224);
    ctx.lineTo(lightRight ? -shW : 0, 74);
    ctx.lineTo(lightRight ? 0 : shW, 74);
    ctx.lineTo(lightRight ? 0 : shW * 1.4, 224);
    ctx.closePath();
    ctx.fill();

    // Wave 7 Outerwear collar/lapels preview in close-up
    drawOuterwearCloseUpLayer(ctx, dna.outfit.outerwear, pal, shW);

    // Collar accessory preview in close-up!
    if (dna.outfit.collarAccessory === 'gold_necklace') {
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(0, 70, 56, 0.15, Math.PI - 0.15);
      ctx.stroke();
    } else if (dna.outfit.collarAccessory === 'rudraksha_beads') {
      ctx.fillStyle = '#78350f';
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(i * 15, 92 + (9 - i * i) * 2.5, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (dna.outfit.collarAccessory === 'fur_mantle') {
      ctx.fillStyle = lightenHex(pal.secondary, 0.45);
      ctx.beginPath();
      ctx.ellipse(0, 88, shW * 0.96, 30, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (dna.outfit.collarAccessory === 'scarf_muffler') {
      ctx.fillStyle = pal.accent;
      ctx.fillRect(-74, 74, 148, 28);
    } else if (dna.outfit.collarAccessory === 'pauldron_plates') {
      ctx.fillStyle = pal.secondary;
      ctx.beginPath();
      ctx.ellipse(-shW * 0.85, 86, 44, 28, -0.2, 0, Math.PI * 2);
      ctx.ellipse(shW * 0.85, 86, 44, 28, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wave 7 Neckwear accessory in close-up
    drawNeckwearLayer(ctx, acc.neckwear, pal, true);
  }

  // Apply Wave 7 neckLength morph offset cleanly
  const neckLift = (fm.neckLength - 1) * -18;
  ctx.save();
  ctx.translate(0, neckLift);

  // Hair / Mane behind head
  drawModularHairBehind(ctx, dna.head.hairStyle, pal.hair, ts);

  // Horns & Antlers
  drawModularHorns(ctx, dna.head.horns, pal.accent);

  // Ears (scaled by Wave 7 earScale morph)
  ctx.save();
  ctx.scale(fm.earScale, fm.earScale);
  drawModularEars(ctx, dna.head.ears, pal.skin, pal.primary, pal.accent);
  ctx.restore();

  // Head silhouette + Surface pattern + Chiaroscuro shadow split (sculpted by Wave 7 jawWidth/cheekboneWidth/chinLength)
  const headMorphX = clamp(fm.cheekboneWidth * 0.52 + fm.jawWidth * 0.48, 0.74, 1.32);
  const headMorphY = clamp(0.62 + fm.chinLength * 0.38, 0.82, 1.24);
  const isFurHead =
    dna.head.headShape === 'canine_snout' ||
    dna.head.headShape === 'feline_muzzle' ||
    dna.head.headShape === 'equine_snout' ||
    dna.head.headShape === 'elephant_trunk' ||
    dna.head.headShape === 'croc_snout' ||
    dna.head.headShape === 'curved_beak' ||
    dna.head.headShape === 'raptor_beak' ||
    dna.head.headShape === 'serpent_hood' ||
    dna.head.headShape === 'arachnid_mandible';

  ctx.save();
  ctx.scale(headMorphX, headMorphY);
  const headFill = isFurHead ? pal.skin : pal.skin;
  ctx.fillStyle = headFill;
  buildHeadPath(ctx, dna.head.headShape);
  ctx.fill();

  if (isFurHead && dna.outfit.surfacePattern !== 'solid') {
    buildHeadPath(ctx, dna.head.headShape);
    paintSurfacePatternClipped(ctx, dna.outfit.surfacePattern, pal.patternTint, -80, -80, 160, 220);
  }

  // Hard half-face Chiaroscuro shadow split
  ctx.save();
  buildHeadPath(ctx, dna.head.headShape);
  ctx.clip();
  ctx.fillStyle = skinShadow;
  ctx.globalAlpha = 0.72;
  ctx.fillRect(lightRight ? -100 : 0, -100, 100, 260);
  ctx.restore();
  ctx.restore();

  // Elephant tusks if elephant_trunk
  if (dna.head.headShape === 'elephant_trunk') {
    ctx.fillStyle = '#fffbeb';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 24, 34);
      ctx.quadraticCurveTo(s * 54, 58, s * 42, 92);
      ctx.quadraticCurveTo(s * 34, 62, s * 16, 44);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Arachnid mandibles
  if (dna.head.headShape === 'arachnid_mandible') {
    ctx.fillStyle = darkenHex(pal.skin, 0.5);
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 18, 42);
      ctx.quadraticCurveTo(s * 34, 68, s * 10, 82);
      ctx.quadraticCurveTo(s * 18, 62, s * 8, 46);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Forehead / Cheek Marks (Primary + Wave 7 Secondary + Blush!)
  drawGranularFaceMarksLayer(ctx, dna, drawModularFaceMarks);

  // Eyes & Eyebrows
  const baseEyeX = dna.head.headShape === 'serpent_hood' ? 24 : 28;
  const baseEyeY = -8;
  if (useGranularFace) {
    drawGranularEyesLayer(ctx, dna, expression, ts, speechEnergy, castSeed, baseEyeX, baseEyeY);
  } else {
    const isGlowing = dna.head.eyeStyle === 'glowing_orb' || dna.head.eyeStyle === 'slit_reptile';
    const eyeScale =
      dna.head.eyeStyle === 'wide_fable'
        ? 1.18
        : dna.head.eyeStyle === 'narrow_sharp'
          ? 0.88
          : 1.0;

    drawUnifiedEyePair(ctx, expression, pal.eye || pal.accent, ts, speechEnergy, {
      glowing: isGlowing,
      roundOwl: dna.head.eyeStyle === 'owl_disc',
      eyeX: baseEyeX,
      eyeY: baseEyeY,
      noBrows: dna.head.headShape === 'serpent_hood' || dna.head.headShape === 'arachnid_mandible',
      castSeed,
      eyeScale,
    });

    // Extra spider eyes if multi_eyes
    if (dna.head.eyeStyle === 'multi_eyes') {
      ctx.fillStyle = pal.eye || pal.accent;
      for (const [ex, ey, r] of [[-12, -28, 6], [12, -28, 6], [-42, -24, 5], [42, -24, 5]]) {
        ctx.beginPath();
        ctx.arc(ex, ey, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Reptile vertical slit pupil accent
    if (dna.head.eyeStyle === 'slit_reptile') {
      ctx.fillStyle = '#070914';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(s * 26, -8, 2.5, 9, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Nose / Snout Tip / Beak (scaled by Wave 7 noseScale morph)
  if (dna.head.headShape === 'curved_beak' || dna.head.headShape === 'raptor_beak') {
    const beakOpen = getVisemeAperture(viseme) * 5;
    ctx.fillStyle = pal.accent;
    ctx.beginPath();
    ctx.moveTo(-16, 4);
    ctx.quadraticCurveTo(0, dna.head.headShape === 'raptor_beak' ? 46 : 58, 16, 4);
    ctx.closePath();
    ctx.fill();
    if (beakOpen > 0) {
      ctx.fillStyle = '#2d0a12';
      ctx.beginPath();
      ctx.moveTo(-10, 18);
      ctx.lineTo(10, 18);
      ctx.lineTo(0, 24 + beakOpen * 1.4);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // Nose bridge
    if (dna.head.noseStyle !== 'none') {
      ctx.save();
      ctx.translate(0, 14);
      ctx.scale(fm.noseScale, fm.noseScale);
      ctx.translate(0, -14);
      ctx.fillStyle = darkenHex(pal.skin, 0.72);
      if (dna.head.noseStyle === 'snout_bridge') {
        ctx.fillStyle = '#12151f';
        ctx.beginPath();
        ctx.ellipse(0, 26, 14, 9, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (dna.head.noseStyle === 'button') {
        ctx.beginPath();
        ctx.arc(0, 16, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (dna.head.noseStyle === 'broad') {
        ctx.beginPath();
        ctx.ellipse(0, 16, 11, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(dna.head.noseStyle === 'aquiline' ? 9 : 6, 18);
        ctx.lineTo(-4, 18);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // Facial hair / Whiskers
    drawModularFacialHair(ctx, dna.head.facialHair, pal.hair);

    // Unified 6-shape phoneme lip-sync mouth
    const mouthY =
      dna.head.headShape === 'canine_snout' || dna.head.headShape === 'equine_snout'
        ? 52
        : dna.head.headShape === 'elephant_trunk'
          ? 44
          : 40;
    if (useGranularFace) {
      drawGranularMouthLayer(ctx, dna, expression, viseme, mouthY);
    } else {
      const fanged =
        dna.chassis === 'ethereal' ||
        dna.head.headShape === 'canine_snout' ||
        dna.head.headShape === 'feline_muzzle' ||
        dna.head.headShape === 'croc_snout' ||
        dna.head.headShape === 'serpent_hood';

      drawUnifiedMouth(ctx, expression, viseme, {
        y: mouthY,
        fanged,
      });
    }
  }

  // Front hair bangs / ties for Wave 7 hair styles
  drawGranularHairFront(ctx, dna.head.hairStyle, pal.hair, pal.accent);

  // Wave 7 Eyewear & Ear/Face Jewelry
  drawEyewearLayer(ctx, acc.eyewear, pal, baseEyeX * fm.eyeSpacing, baseEyeY, fm.eyeSize);
  drawEarAndFaceJewelryLayer(ctx, acc.earJewelry, pal, fm.earScale, fm.noseScale);

  // Headwear / Crown / Turban / Helm
  drawModularHeadwear(ctx, dna.outfit.headwear, pal.primary, pal.accent);

  ctx.restore(); // end neckLift
  ctx.restore();
}

// =========================================================================
// 2. FULL-BODY MODULAR RIG (ALL 6 CHASSIS + 2-BONE ARMS + MORPHS)
// =========================================================================

export function drawModularEntityFullBody(
  ctx: CanvasRenderingContext2D,
  cast: CastMember,
  dna: CharacterDNA,
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
  motionProfile?: MotionProfileId
): void {
  const ts = snapStyleTime(t, renderStyle);
  const styleGrammar = getStyleAnimationGrammar(renderStyle);
  const flip = facing === 'left' ? -1 : 1;
  const kin = resolveDnaKinematics(cast, dna);
  const pal = dna.palette;

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
  const heightScale = clamp(dna.morph.height, 0.72, 1.32);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * heightScale * flip, scale * heightScale);

  // Hand-crafted style line-boil jitter (Woodblock / Codex / Sumi-e)
  if (styleGrammar.lineBoilPx > 0) {
    ctx.translate(
      Math.sin(ts * 41.3 + bodySeed) * styleGrammar.lineBoilPx,
      Math.cos(ts * 37.7 + bodySeed * 1.7) * styleGrammar.lineBoilPx * 0.7
    );
  }

  // Grounded Dynamic Contact Shadow
  if (pose !== 'hang_upside_down') {
    const elevation = Math.max(0, -(env.offsetY + env.bob));
    const airborneShrink =
      pose === 'soar' || dna.chassis === 'ethereal'
        ? 0.54
        : Math.max(0.42, 1 - elevation / 180);
    const shadowAlpha = pose === 'soar' ? 0.25 : 0.55 * airborneShrink;
    const skewX = (lighting?.shadowSkewX ?? 0.35) * flip;
    const baseShadowW = dna.chassis === 'quadruped' || dna.chassis === 'arachnid' ? 48 : 36;
    ctx.save();
    ctx.fillStyle = `rgba(4, 6, 14, ${shadowAlpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(skewX * 14, 4, baseShadowW * airborneShrink, 8.5 * airborneShrink, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Apply 12-principles pose envelope + morph posture
  ctx.translate(env.offsetX, env.offsetY + env.bob);
  ctx.rotate(env.bodyTilt + dna.morph.posture * 0.45);
  ctx.scale(env.scaleX, env.scaleY);

  const stride = env.stride;
  const breath = Math.sin(ts * kin.breathHz + bodySeed * 0.17);
  const chestRise = breath * -kin.breathAmp - speechEnergy * 2.2;
  const talkPulse = speechEnergy > 0.15 ? Math.sin(ts * 8.4 + bodySeed) * speechEnergy : 0;

  const shScale = clamp(dna.morph.shoulderWidth, 0.7, 1.45);
  const bulkScale = clamp(dna.morph.torsoBulk, 0.72, 1.4);
  const headScale = 0.32 * clamp(dna.morph.headRatio, 0.78, 1.3);
  const limbScale = clamp(dna.morph.limbLength, 0.78, 1.28);

  // -----------------------------------------------------------------------
  // CHASSIS A: QUADRUPED BEAST (Lions, Foxes, Elephants, Wolves, Deer, Crocs)
  // -----------------------------------------------------------------------
  if (dna.chassis === 'quadruped') {
    const legH = 44 * limbScale;
    const bodyW = 46 * bulkScale;
    const bodyH = 42 * shScale;

    drawModularWings(ctx, dna.appendages.wings, pal.primary, pal.accent, pose, ts, bodySeed, -legH - bodyH * 0.75, 0.85);
    drawModularTail(ctx, dna.appendages.tail, pal.primary, pal.accent, ts, bodySeed, -bodyW * 0.9, -legH - bodyH * 0.4);

    // Back legs
    ctx.fillStyle = darkenHex(pal.primary, 0.62);
    ctx.fillRect(-bodyW * 0.72 - stride * 0.5, -legH, 13 * bulkScale, legH);
    ctx.fillRect(bodyW * 0.32 + stride * 0.5, -legH, 13 * bulkScale, legH);

    // Muscular beast torso
    ctx.fillStyle = pal.primary;
    ctx.beginPath();
    ctx.moveTo(-bodyW, -legH + 4);
    ctx.lineTo(-bodyW * 0.72, -legH - bodyH - chestRise * 0.6);
    ctx.lineTo(bodyW * 0.82, -legH - bodyH * 1.06 - chestRise);
    ctx.lineTo(bodyW * 0.96, -legH + 4);
    ctx.closePath();
    ctx.fill();
    paintSurfacePatternClipped(
      ctx,
      dna.outfit.surfacePattern,
      pal.patternTint,
      -bodyW,
      -legH - bodyH - 8,
      bodyW * 2,
      bodyH + 16
    );

    // Optional saddle/cape/garment blanket on quadruped
    if (dna.outfit.capeStyle !== 'none') {
      drawModularCape(ctx, dna.outfit.capeStyle, pal.secondary, pal.primary, pal.accent, pose, kin.capeDrag, ts, bodySeed, -legH - bodyH);
    }
    if (dna.outfit.collarAccessory !== 'none') {
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(bodyW * 0.35, -legH - bodyH * 0.92);
      ctx.lineTo(bodyW * 0.68, -legH - 2);
      ctx.stroke();
    }

    // Front legs
    ctx.fillStyle = pal.primary;
    ctx.fillRect(-bodyW * 0.5 + stride * 0.5, -legH, 14 * bulkScale, legH);
    ctx.fillRect(bodyW * 0.52 - stride * 0.5, -legH, 14 * bulkScale, legH);

    // Head
    ctx.save();
    ctx.translate(bodyW * 0.85, -legH - bodyH * 1.04 - chestRise);
    ctx.rotate(talkPulse * 0.06);
    ctx.scale(headScale * 1.15, headScale * 1.15);
    drawModularEntityCloseUp(ctx, cast, dna, expression, viseme, speechEnergy, 'right', ts);
    ctx.restore();

    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // CHASSIS B: AVIAN & WINGED (Ravens, Owls, Cranes, Eagles, Mythic Birds)
  // -----------------------------------------------------------------------
  if (dna.chassis === 'avian') {
    const legH = 42 * limbScale;
    const bodyRx = 26 * bulkScale;
    const bodyRy = 38 * shScale;

    drawModularTail(ctx, dna.appendages.tail, pal.primary, pal.accent, ts, bodySeed, -bodyRx * 0.7, -legH - 12);
    drawModularWings(
      ctx,
      dna.appendages.wings === 'none' ? 'raven_dark' : dna.appendages.wings,
      pal.primary,
      pal.accent,
      pose,
      ts,
      bodySeed,
      -legH - bodyRy * 1.1 + chestRise,
      1.05
    );

    // Bird legs & talons
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-10 - stride * 0.35, -legH);
    ctx.lineTo(-10 - stride * 0.35, -4);
    ctx.moveTo(10 + stride * 0.35, -legH);
    ctx.lineTo(10 + stride * 0.35, -4);
    ctx.stroke();

    // Sculpted avian torso
    ctx.fillStyle = pal.primary;
    ctx.beginPath();
    ctx.ellipse(0, -legH - bodyRy * 0.85 + chestRise, bodyRx, bodyRy, 0.14, 0, Math.PI * 2);
    ctx.fill();
    paintSurfacePatternClipped(
      ctx,
      dna.outfit.surfacePattern,
      pal.patternTint,
      -bodyRx - 8,
      -legH - bodyRy * 2,
      bodyRx * 2 + 16,
      bodyRy * 2 + 16
    );

    // Head
    ctx.save();
    ctx.translate(10, -legH - bodyRy * 1.85 + chestRise);
    ctx.rotate(talkPulse * 0.06);
    ctx.scale(headScale * 1.05, headScale * 1.05);
    drawModularEntityCloseUp(ctx, cast, dna, expression, viseme, speechEnergy, 'right', ts);
    ctx.restore();

    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // CHASSIS C: SERPENTINE (Nagas, Cobras, Wyrms, Sea Serpents)
  // -----------------------------------------------------------------------
  if (dna.chassis === 'serpentine') {
    const sway = Math.sin(ts * 2.8 + bodySeed) * 10;
    const coilW = 48 * bulkScale;

    drawModularWings(ctx, dna.appendages.wings, pal.primary, pal.accent, pose, ts, bodySeed, -92 + chestRise, 0.9);

    ctx.fillStyle = darkenHex(pal.primary, 0.62);
    ctx.beginPath();
    ctx.ellipse(0, -14, coilW + Math.sin(ts * 2.4) * 2.5, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = pal.primary;
    ctx.beginPath();
    ctx.ellipse(sway * 0.25, -34, coilW * 0.76, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = pal.primary;
    ctx.lineWidth = 22 * bulkScale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.quadraticCurveTo(sway * 1.15, -76 * limbScale, 4 + sway * 0.7, -114 * limbScale);
    ctx.stroke();

    // Accent belly ridge
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(4, -34);
    ctx.quadraticCurveTo(sway * 1.15 + 6, -76 * limbScale, 8 + sway * 0.7, -108 * limbScale);
    ctx.stroke();

    ctx.save();
    ctx.translate(4 + sway * 0.7, -116 * limbScale);
    ctx.rotate(sway * 0.012 + talkPulse * 0.05);
    ctx.scale(headScale * 1.12, headScale * 1.12);
    drawModularEntityCloseUp(ctx, cast, dna, expression, viseme, speechEnergy, 'right', ts);
    ctx.restore();

    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // CHASSIS D: ARACHNID (Anansi Spiders & Multi-Limbed Folklore Tricksters)
  // -----------------------------------------------------------------------
  if (dna.chassis === 'arachnid') {
    const legSwing = Math.sin(ts * 8.5 + bodySeed) * 8;
    // 8 articulated spider legs (4 left, 4 right)
    ctx.strokeStyle = darkenHex(pal.primary, 0.45);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const kneeX = s * (34 + i * 11);
        const kneeY = -66 + i * 10 + (i % 2 === 0 ? legSwing : -legSwing) * 0.5;
        const footX = s * (46 + i * 14);
        const footY = -2 - (i % 2 === 0 ? Math.max(0, legSwing) : Math.max(0, -legSwing));
        ctx.beginPath();
        ctx.moveTo(s * 14, -52 + i * 5);
        ctx.lineTo(kneeX, kneeY);
        ctx.lineTo(footX, footY);
        ctx.stroke();
      }
    }

    // Abdomen + patterned thorax
    ctx.fillStyle = pal.secondary;
    ctx.beginPath();
    ctx.ellipse(-26, -54, 28 * bulkScale, 22 * bulkScale, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = pal.primary;
    ctx.beginPath();
    ctx.ellipse(4, -64 + chestRise, 24 * shScale, 26 * bulkScale, 0, 0, Math.PI * 2);
    ctx.fill();
    paintSurfacePatternClipped(ctx, dna.outfit.surfacePattern, pal.patternTint, -24, -92, 56, 56);

    ctx.save();
    ctx.translate(12, -104 + chestRise);
    ctx.rotate(talkPulse * 0.05);
    ctx.scale(headScale * 1.05, headScale * 1.05);
    drawModularEntityCloseUp(ctx, cast, dna, expression, viseme, speechEnergy, 'right', ts);
    ctx.restore();

    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------------
  // CHASSIS E & F: HUMANOID & ETHEREAL SPIRIT (Full 2-Bone Arm Rig + Outfits!)
  // -----------------------------------------------------------------------
  const isEthereal = dna.chassis === 'ethereal';
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
  const chestW = 23 * shScale + breath * 0.8 + speechEnergy * 0.7;
  const waistW = 18 * bulkScale;
  const torsoTopY = -122 * limbScale + chestRise;
  const waistY = -62 * limbScale;

  const fullAcc = resolveAccessories(dna);
  const fullBodyMarks = resolveBodyMarks(dna);

  // Behind: Back Gear, Wings, Cape & Tail (Z-order)
  drawBackGearLayer(ctx, fullAcc.backGear, pal, torsoTopY, waistY, chestW, ts, bodySeed);
  drawModularWings(ctx, dna.appendages.wings, pal.primary, pal.accent, pose, ts, bodySeed, torsoTopY + 14, 1.0);
  drawModularCape(ctx, dna.outfit.capeStyle, pal.primary, pal.secondary, pal.accent, pose, kin.capeDrag, ts, bodySeed, torsoTopY);
  drawModularTail(ctx, dna.appendages.tail, pal.primary, pal.accent, ts, bodySeed, -14, waistY + 16);

  // Optional Extra Divine/Asura Arms behind torso!
  if (dna.appendages.extraArms === 2) {
    const wave = Math.sin(ts * 3.4 + bodySeed) * 0.16;
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(s * (chestW * 0.8), torsoTopY + 18);
      ctx.rotate(s * (-1.35 + wave));
      ctx.fillStyle = darkenHex(pal.skin, 0.82);
      ctx.fillRect(-4, 0, 8, 22 * limbScale);
      ctx.translate(0, 22 * limbScale);
      ctx.rotate(s * -0.55);
      ctx.fillRect(-3.5, 0, 7, 20 * limbScale);
      ctx.fillStyle = pal.accent;
      ctx.fillRect(-4, 14 * limbScale, 8, 3.5);
      ctx.fillStyle = pal.skin;
      ctx.beginPath();
      ctx.arc(0, 21 * limbScale, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Back 2-bone articulated arm
  ctx.save();
  ctx.translate(armRig.back.shoulderX * shScale, torsoTopY + 10);
  ctx.rotate(armRig.back.shoulderAngle);
  ctx.fillStyle = darkenHex(pal.skin, 0.72);
  ctx.fillRect(-4, 0, 8, armRig.back.upperLen * limbScale + 2);
  drawSleeveOverlay(ctx, dna.outfit.sleeveStyle, pal, armRig.back.upperLen * limbScale, armRig.back.forearmLen * limbScale, true);
  ctx.translate(0, armRig.back.upperLen * limbScale);
  ctx.rotate(armRig.back.elbowAngle);
  ctx.fillStyle = darkenHex(pal.skin, 0.72);
  ctx.fillRect(-3.5, 0, 7, armRig.back.forearmLen * limbScale);
  drawArmBodyMarksOverlay(ctx, fullBodyMarks, pal, armRig.back.forearmLen * limbScale);
  drawSleeveOverlay(ctx, dna.outfit.sleeveStyle, pal, armRig.back.upperLen * limbScale, armRig.back.forearmLen * limbScale, false);
  ctx.fillStyle = darkenHex(pal.skin, 0.72);
  ctx.beginPath();
  ctx.arc(0, armRig.back.forearmLen * limbScale + 1, 5, 0, Math.PI * 2);
  ctx.fill();
  drawGlovesLayer(ctx, dna.outfit.gloves, pal, armRig.back.forearmLen * limbScale);
  ctx.restore();

  // Lower Body (Ethereal Wisp | Dhoti | Skirt | Greaves | Trousers | Robe)
  if (isEthereal || dna.outfit.bottomStyle === 'ethereal_wisp') {
    const wispSway = Math.sin(ts * 4.2 + bodySeed) * 14;
    ctx.fillStyle = pal.secondary;
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.moveTo(-waistW, waistY);
    ctx.lineTo(waistW, waistY);
    ctx.quadraticCurveTo(waistW + wispSway * 0.4, waistY * 0.45, wispSway, -4);
    ctx.quadraticCurveTo(-waistW + wispSway * 0.4, waistY * 0.45, -waistW, waistY);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (pose === 'sit' || pose === 'kneel') {
    ctx.fillStyle = pal.secondary;
    ctx.beginPath();
    ctx.moveTo(-42 * bulkScale, -20);
    ctx.lineTo(42 * bulkScale, -20);
    ctx.lineTo(30 * bulkScale, waistY + 8);
    ctx.lineTo(-30 * bulkScale, waistY + 8);
    ctx.closePath();
    ctx.fill();
  } else {
    // Feet / boots (Wave 7 Footwear override or default auto)
    const drewCustomFootwear = drawFootwearLayer(ctx, dna.outfit.footwear, pal, stride, bulkScale);
    if (!drewCustomFootwear) {
      ctx.fillStyle = dna.outfit.bottomStyle === 'armored_greaves' ? '#475569' : '#0e1120';
      ctx.fillRect(-16 - stride * 0.52, -24, 11 * bulkScale, 24);
      ctx.fillRect(6 + stride * 0.52, -24, 11 * bulkScale, 24);
    }

    // Garment lower silhouette
    const botCol =
      dna.outfit.bottomStyle === 'dhoti'
        ? lightenHex(pal.accent, 0.25)
        : dna.outfit.bottomStyle === 'armored_greaves'
          ? '#334155'
          : dna.outfit.bottomStyle === 'animal_legs'
            ? pal.skin
            : pal.secondary;
    ctx.fillStyle = botCol;
    ctx.beginPath();
    if (dna.outfit.bottomStyle === 'flowing_skirt' || dna.outfit.bottomStyle === 'robe_hem') {
      ctx.moveTo(-waistW, waistY);
      ctx.lineTo(waistW, waistY);
      ctx.lineTo(waistW * 1.6 + stride * 0.25, -8);
      ctx.lineTo(-waistW * 1.6 - stride * 0.25, -8);
    } else if (dna.outfit.bottomStyle === 'trousers' || dna.outfit.bottomStyle === 'armored_greaves') {
      ctx.moveTo(-waistW, waistY);
      ctx.lineTo(waistW, waistY);
      ctx.lineTo(18 + stride * 0.48, -14);
      ctx.lineTo(4, -14);
      ctx.lineTo(0, waistY + 18);
      ctx.lineTo(-4, -14);
      ctx.lineTo(-18 - stride * 0.48, -14);
    } else {
      ctx.moveTo(-waistW - 2, waistY);
      ctx.lineTo(waistW + 2, waistY);
      ctx.lineTo(waistW + 7 + stride * 0.35, -14);
      ctx.lineTo(0, -24);
      ctx.lineTo(-waistW - 6 - stride * 0.35, -14);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Torso (Top Style + Pattern + Chiaroscuro shadow)
  const torsoCol = dna.outfit.topStyle === 'none_fur' ? pal.skin : pal.primary;
  ctx.fillStyle = torsoCol;
  ctx.beginPath();
  ctx.moveTo(-chestW, torsoTopY);
  ctx.lineTo(chestW, torsoTopY);
  ctx.lineTo(waistW, waistY);
  ctx.lineTo(-waistW, waistY);
  ctx.closePath();
  ctx.fill();

  // Apply procedural textile/coat pattern clipped to torso
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-chestW, torsoTopY);
  ctx.lineTo(chestW, torsoTopY);
  ctx.lineTo(waistW, waistY);
  ctx.lineTo(-waistW, waistY);
  ctx.closePath();
  paintSurfacePatternClipped(
    ctx,
    dna.outfit.surfacePattern,
    pal.patternTint,
    -chestW - 4,
    torsoTopY,
    chestW * 2 + 8,
    waistY - torsoTopY
  );
  ctx.restore();

  // Half-body chiaroscuro shadow plane
  ctx.fillStyle = darkenHex(torsoCol, 0.56);
  ctx.beginPath();
  ctx.moveTo(-chestW, torsoTopY);
  ctx.lineTo(-2, torsoTopY);
  ctx.lineTo(-2, waistY);
  ctx.lineTo(-waistW, waistY);
  ctx.closePath();
  ctx.fill();

  // Wave 7 Body Marks Layer on torso
  drawBodyMarksLayer(ctx, fullBodyMarks, pal, chestW, waistW, torsoTopY, waistY, ts);

  // Distinct Top Details (Plate Armor ridges | Samurai Cuirass | Saree Drape | Sash | Collar)
  if (dna.outfit.topStyle === 'plate_armor' || dna.outfit.topStyle === 'samurai_cuirass') {
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 2.6;
    for (let r = 1; r <= 3; r++) {
      const ry = torsoTopY + ((waistY - torsoTopY) * r) / 4;
      ctx.beginPath();
      ctx.moveTo(-chestW * 0.85, ry);
      ctx.lineTo(chestW * 0.85, ry);
      ctx.stroke();
    }
  } else if (dna.outfit.topStyle === 'saree_drape' || dna.outfit.topStyle === 'toga_chiton' || dna.outfit.collarAccessory === 'royal_sash') {
    ctx.fillStyle = pal.accent;
    ctx.beginPath();
    ctx.moveTo(-chestW * 0.82, torsoTopY);
    ctx.lineTo(-chestW * 0.36, torsoTopY);
    ctx.lineTo(waistW, waistY - 4);
    ctx.lineTo(waistW * 0.45, waistY - 4);
    ctx.closePath();
    ctx.fill();
  } else if (dna.outfit.topStyle === 'trench_coat' || dna.outfit.topStyle === 'lab_coat') {
    // Crisp coat lapels & shirt V-panel
    ctx.fillStyle = dna.outfit.topStyle === 'lab_coat' ? '#f8fafc' : '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(-10, torsoTopY); ctx.lineTo(10, torsoTopY); ctx.lineTo(0, torsoTopY + 34); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = pal.accent;
    ctx.fillRect(-3, torsoTopY + 8, 6, 28);
    if (dna.outfit.topStyle === 'trench_coat') {
      ctx.fillStyle = pal.accent;
      ctx.fillRect(-waistW - 2, waistY - 12, (waistW + 2) * 2, 5);
    }
  } else if (dna.outfit.topStyle === 'cyber_jacket') {
    // Neon high-collar jacket piping & glowing chest chevron
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-chestW * 0.72, torsoTopY + 8);
    ctx.lineTo(0, torsoTopY + 26);
    ctx.lineTo(chestW * 0.72, torsoTopY + 8);
    ctx.stroke();
  } else if (dna.outfit.topStyle === 'space_suit' || dna.outfit.topStyle === 'space_exo') {
    // EVA chest control pack & exo-frame ribs
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-13, torsoTopY + 12, 26, 20);
    ctx.fillStyle = pal.accent;
    ctx.fillRect(-9, torsoTopY + 16, 8, 6);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(2, torsoTopY + 16, 7, 6);
    if (dna.outfit.topStyle === 'space_exo') {
      ctx.strokeStyle = pal.accent; ctx.lineWidth = 3;
      ctx.strokeRect(-chestW * 0.8, torsoTopY + 6, chestW * 1.6, 34);
    }
  } else if (dna.outfit.topStyle === 'business_suit') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(-10, torsoTopY); ctx.lineTo(10, torsoTopY); ctx.lineTo(0, torsoTopY + 26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = pal.accent; ctx.fillRect(-2.5, torsoTopY + 6, 5, 22);
  } else if (dna.outfit.topStyle === 'kimono_robe') {
    ctx.strokeStyle = pal.accent; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-14, torsoTopY); ctx.lineTo(6, torsoTopY + 24); ctx.moveTo(14, torsoTopY); ctx.lineTo(-6, torsoTopY + 24); ctx.stroke();
    ctx.fillStyle = pal.accent; ctx.fillRect(-waistW - 2, waistY - 14, (waistW + 2) * 2, 10);
  } else if (dna.outfit.topStyle === 'hoodie_street') {
    ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-7, torsoTopY + 4); ctx.lineTo(-7, torsoTopY + 24); ctx.moveTo(7, torsoTopY + 4); ctx.lineTo(7, torsoTopY + 24); ctx.stroke();
    ctx.fillStyle = pal.secondary; ctx.beginPath(); ctx.roundRect(-16, waistY - 22, 32, 16, 5); ctx.fill();
  } else if (dna.outfit.topStyle === 'medieval_plate') {
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-chestW * 0.78, torsoTopY + 16); ctx.lineTo(0, torsoTopY + 28); ctx.lineTo(chestW * 0.78, torsoTopY + 16); ctx.stroke();
    ctx.fillStyle = pal.accent; ctx.fillRect(-4, torsoTopY + 8, 8, 28);
  } else if (dna.outfit.topStyle === 'pirate_coat') {
    ctx.fillStyle = pal.accent;
    for (let b = 0; b < 3; b++) {
      ctx.beginPath(); ctx.arc(-9, torsoTopY + 12 + b * 11, 2.5, 0, Math.PI * 2); ctx.arc(9, torsoTopY + 12 + b * 11, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillRect(-waistW - 2, waistY - 12, (waistW + 2) * 2, 7);
  } else if (dna.outfit.topStyle === 'sports_jersey') {
    ctx.fillStyle = pal.accent;
    ctx.fillRect(-chestW * 0.85, torsoTopY + 6, chestW * 1.7, 6);
    ctx.fillRect(-10, torsoTopY + 18, 20, 18);
  }

  // Wave 7 Layered Outerwear & Waist Belt/Sash
  drawOuterwearLayer(ctx, dna.outfit.outerwear, pal, chestW, waistW, torsoTopY, waistY);
  drawWaistLayer(ctx, dna.outfit.waistStyle, pal, waistW, waistY);

  // Collar Accessories on full-body torso
  if (dna.outfit.collarAccessory === 'gold_necklace') {
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, torsoTopY + 4, 15, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else if (dna.outfit.collarAccessory === 'fur_mantle') {
    ctx.fillStyle = lightenHex(pal.secondary, 0.42);
    ctx.beginPath();
    ctx.ellipse(0, torsoTopY + 4, chestW * 1.15, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (dna.outfit.collarAccessory === 'pauldron_plates') {
    ctx.fillStyle = pal.secondary;
    ctx.beginPath();
    ctx.ellipse(-chestW, torsoTopY + 6, 13, 9, -0.2, 0, Math.PI * 2);
    ctx.ellipse(chestW, torsoTopY + 6, 13, 9, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wave 7 Neckwear Layer
  drawNeckwearLayer(ctx, fullAcc.neckwear, pal, false, torsoTopY, chestW);

  // Attack Action Motion-Smear Arc
  if (env.smearAlpha > 0.05) {
    ctx.save();
    ctx.strokeStyle = `rgba(255, 232, 152, ${(env.smearAlpha * 0.55).toFixed(2)})`;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(armRig.front.shoulderX * shScale, torsoTopY + 10, 54 * limbScale, -Math.PI * 0.82, 0.25);
    ctx.stroke();
    ctx.restore();
  }

  // Front 2-bone articulated arm
  ctx.save();
  ctx.translate(armRig.front.shoulderX * shScale, torsoTopY + 10);
  ctx.rotate(armRig.front.shoulderAngle);
  if (dna.outfit.topStyle !== 'none_fur' && (!dna.outfit.sleeveStyle || dna.outfit.sleeveStyle === 'auto')) {
    ctx.fillStyle = pal.primary;
    ctx.fillRect(-6, -2, 12, 12);
  }
  ctx.fillStyle = pal.skin;
  ctx.fillRect(-4.5, 8, 9, armRig.front.upperLen * limbScale - 5);
  drawSleeveOverlay(ctx, dna.outfit.sleeveStyle, pal, armRig.front.upperLen * limbScale, armRig.front.forearmLen * limbScale, true);
  ctx.translate(0, armRig.front.upperLen * limbScale);
  ctx.rotate(armRig.front.elbowAngle);
  ctx.fillStyle = pal.skin;
  ctx.fillRect(-4, 0, 8, armRig.front.forearmLen * limbScale);
  drawArmBodyMarksOverlay(ctx, fullBodyMarks, pal, armRig.front.forearmLen * limbScale);
  drawSleeveOverlay(ctx, dna.outfit.sleeveStyle, pal, armRig.front.upperLen * limbScale, armRig.front.forearmLen * limbScale, false);
  if (fullAcc.wristwear === 'none') {
    ctx.fillStyle = pal.accent;
    ctx.fillRect(-4.5, armRig.front.forearmLen * limbScale - 6, 9, 3.5);
  } else {
    drawWristwearLayer(ctx, fullAcc.wristwear, pal, armRig.front.forearmLen * limbScale);
  }
  ctx.fillStyle = pal.skin;
  ctx.beginPath();
  ctx.arc(0, armRig.front.forearmLen * limbScale + 2, 5.8, 0, Math.PI * 2);
  ctx.fill();
  drawGlovesLayer(ctx, dna.outfit.gloves, pal, armRig.front.forearmLen * limbScale);
  ctx.restore();

  // Style-Native Shadow Puppetry Bamboo Control Rods!
  if (styleGrammar.rodPuppetMode) {
    ctx.save();
    ctx.strokeStyle = 'rgba(20, 14, 10, 0.72)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(armRig.front.wristX * shScale, armRig.front.wristY * limbScale + 4);
    ctx.lineTo(armRig.front.wristX * shScale + 10, 48);
    ctx.moveTo(armRig.back.wristX * shScale, armRig.back.wristY * limbScale + 4);
    ctx.lineTo(armRig.back.wristX * shScale - 10, 48);
    ctx.stroke();
    ctx.restore();
  }

  // Scaled Sculpted Modular Head
  ctx.save();
  ctx.translate(2, torsoTopY - 26 + chestRise * 0.15);
  ctx.rotate(talkPulse * 0.055);
  ctx.scale(headScale, headScale);
  drawModularEntityCloseUp(ctx, cast, dna, expression, viseme, speechEnergy, 'right', ts);
  ctx.restore();

  ctx.restore();
}

// =========================================================================
// 3. LIVE PART THUMBNAIL RENDERER (For Sims-Style Workshop Grid Tiles!)
// =========================================================================

export type PartThumbnailCategory =
  | 'headShape'
  | 'ears'
  | 'horns'
  | 'hairStyle'
  | 'facialHair'
  | 'faceMark'
  | 'headwear'
  | 'surfacePattern'
  | 'wings'
  | 'tail'
  | 'aura';

export function drawDnaPartThumbnail(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  category: PartThumbnailCategory,
  optionId: string,
  dna: CharacterDNA
): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0c1020';
  ctx.fillRect(0, 0, w, h);

  const pal = dna.palette;

  if (category === 'surfacePattern') {
    ctx.fillStyle = pal.primary;
    ctx.fillRect(6, 6, w - 12, h - 12);
    ctx.save();
    ctx.beginPath();
    ctx.rect(6, 6, w - 12, h - 12);
    paintSurfacePatternClipped(ctx, optionId as SurfacePatternId, pal.patternTint, 6, 6, w - 12, h - 12);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(w / 2, h * 0.56);

  if (category === 'headShape') {
    ctx.scale(0.24, 0.24);
    ctx.fillStyle = pal.skin;
    buildHeadPath(ctx, optionId as HeadShapeId);
    ctx.fill();
  } else if (category === 'ears') {
    ctx.scale(0.22, 0.22);
    drawModularEars(ctx, optionId as EarStyleId, pal.skin, pal.primary, pal.accent);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.22)';
    ctx.beginPath();
    ctx.arc(0, 0, 52, 0, Math.PI * 2);
    ctx.fill();
  } else if (category === 'horns') {
    ctx.translate(0, 10);
    ctx.scale(0.2, 0.2);
    drawModularHorns(ctx, optionId as HornStyleId, pal.accent);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.22)';
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fill();
  } else if (category === 'hairStyle') {
    ctx.scale(0.21, 0.21);
    drawModularHairBehind(ctx, optionId as HairStyleId, pal.hair === '#111422' ? '#64748b' : pal.hair, 0);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.28)';
    ctx.beginPath();
    ctx.arc(0, 4, 48, 0, Math.PI * 2);
    ctx.fill();
  } else if (category === 'facialHair') {
    ctx.scale(0.24, 0.24);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.22)';
    ctx.beginPath();
    ctx.arc(0, 0, 54, 0, Math.PI * 2);
    ctx.fill();
    drawModularFacialHair(ctx, optionId as FacialHairId, pal.hair === '#111422' ? '#cbd5e1' : pal.hair);
  } else if (category === 'faceMark') {
    ctx.scale(0.28, 0.28);
    ctx.fillStyle = pal.skin;
    ctx.beginPath();
    ctx.arc(0, 0, 54, 0, Math.PI * 2);
    ctx.fill();
    drawGranularFaceMarksLayer(
      ctx,
      { ...dna, head: { ...dna.head, faceMark: optionId as FaceMarkId, secondaryFaceMark: 'none', blushIntensity: 0 } },
      drawModularFaceMarks
    );
  } else if (category === 'headwear') {
    ctx.translate(0, 12);
    ctx.scale(0.21, 0.21);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fill();
    drawModularHeadwear(ctx, optionId as HeadwearStyleId, pal.primary, pal.accent);
  } else if (category === 'wings') {
    ctx.scale(0.26, 0.26);
    drawModularWings(ctx, optionId as WingStyleId, pal.primary, pal.accent, 'stand', 0.4, 1, 0, 1);
  } else if (category === 'tail') {
    ctx.translate(14, 10);
    ctx.scale(0.32, 0.32);
    drawModularTail(ctx, optionId as TailStyleId, pal.primary, pal.accent, 0.4, 1, 0, 0);
  } else if (category === 'aura') {
    ctx.scale(0.18, 0.18);
    drawModularAuraBehind(ctx, optionId as AuraStyleId, pal.accent, 0.6, 118);
  }

  ctx.restore();
}
