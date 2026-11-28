/**
 * Stagecraft Studio — Wave 7: Sims-Grade Granular Character & Entity Layers (Upgrade 40)
 *
 * 100% pure-function deterministic HTML5 Canvas 2D compositor layers invoked in
 * anatomical Z-order from `modularEntityRenderer.ts`.
 *
 * Hard Invariants:
 * - Zero Math.random(), zero offscreen canvas allocations, zero external dependencies
 * - Zero asset duplication across art engines (inherits all 20 RenderStyleId styles)
 * - Full 10-expression FACS modulation + 6-shape phoneme viseme lip-sync (0..5)
 */

import type { ExpressionId } from './types';
import {
  resolveAccessories,
  resolveFaceMorph,
  type BackGearStyleId,
  type BodyMarkId,
  type CharacterDNA,
  type CharacterPaletteSpec,
  type EarJewelryId,
  type EyebrowStyleId,
  type EyelashStyleId,
  type EyewearStyleId,
  type FaceMarkId,
  type FacialHairId,
  type FootwearStyleId,
  type GloveStyleId,
  type HairStyleId,
  type MouthStyleId,
  type NeckwearStyleId,
  type OuterwearStyleId,
  type PupilStyleId,
  type SleeveStyleId,
  type WaistStyleId,
  type WristwearStyleId,
} from './characterDna';
import { getExpressionRecipe, getVisemeAperture, shouldBlink } from './facialExpressions';

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number.isFinite(v) ? v : min));
}

function darken(hex: string, factor = 0.65): string {
  const c = (hex || '#334155').replace('#', '');
  const full = c.length === 3 ? `${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}` : c.padEnd(6, '0');
  const r = clamp(Math.round(parseInt(full.slice(0, 2), 16) * factor), 0, 255);
  const g = clamp(Math.round(parseInt(full.slice(2, 4), 16) * factor), 0, 255);
  const b = clamp(Math.round(parseInt(full.slice(4, 6), 16) * factor), 0, 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function lighten(hex: string, amount = 0.25): string {
  const c = (hex || '#334155').replace('#', '');
  const full = c.length === 3 ? `${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}` : c.padEnd(6, '0');
  const r = clamp(Math.round(parseInt(full.slice(0, 2), 16) + (255 - parseInt(full.slice(0, 2), 16)) * amount), 0, 255);
  const g = clamp(Math.round(parseInt(full.slice(2, 4), 16) + (255 - parseInt(full.slice(2, 4), 16)) * amount), 0, 255);
  const b = clamp(Math.round(parseInt(full.slice(4, 6), 16) + (255 - parseInt(full.slice(4, 6), 16)) * amount), 0, 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// =========================================================================
// 1. BACK GEAR LAYER (Rendered behind torso / wings / cape)
// =========================================================================

export function drawBackGearLayer(
  ctx: CanvasRenderingContext2D,
  backGear: BackGearStyleId | undefined,
  pal: CharacterPaletteSpec,
  torsoTopY: number,
  waistY: number,
  chestW: number,
  t: number,
  seed: number
): void {
  if (!backGear || backGear === 'none') return;
  const midY = (torsoTopY + waistY) * 0.5;
  const h = Math.max(24, waistY - torsoTopY);

  ctx.save();
  switch (backGear) {
    case 'adventure_backpack': {
      ctx.fillStyle = darken(pal.secondary, 0.85);
      ctx.beginPath();
      ctx.roundRect(-chestW - 16, torsoTopY + 4, 24, h * 0.78, 6);
      ctx.fill();
      ctx.fillStyle = pal.accent;
      ctx.fillRect(-chestW - 15, torsoTopY + 14, 22, 5);
      ctx.fillStyle = lighten(pal.secondary, 0.18);
      ctx.beginPath();
      ctx.roundRect(-chestW - 14, torsoTopY + 24, 18, 16, 3);
      ctx.fill();
      break;
    }
    case 'archer_quiver': {
      ctx.save();
      ctx.translate(-chestW * 0.65, torsoTopY + 12);
      ctx.rotate(-0.34);
      ctx.fillStyle = '#5c3a21';
      ctx.beginPath();
      ctx.roundRect(-7, -8, 14, 46, 3);
      ctx.fill();
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(-7, 2, 14, 6);
      for (let i = -1; i <= 1; i++) {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(i * 4, -8);
        ctx.lineTo(i * 5, -24);
        ctx.stroke();
        ctx.fillStyle = i === 0 ? pal.accent : '#ef4444';
        ctx.beginPath();
        ctx.moveTo(i * 5, -24);
        ctx.lineTo(i * 5 - 4, -18);
        ctx.lineTo(i * 5 + 4, -18);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      break;
    }
    case 'crossed_katanas': {
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(0, midY - 6);
        ctx.rotate(side * 0.62);
        // Scabbard
        ctx.fillStyle = '#111827';
        ctx.fillRect(-3, -46, 6, 92);
        // Guard (tsuba) & wrapped hilt
        ctx.fillStyle = pal.accent;
        ctx.fillRect(-7, -34, 14, 4);
        ctx.fillStyle = pal.primary;
        ctx.fillRect(-2.5, -52, 5, 18);
        ctx.restore();
      }
      break;
    }
    case 'electric_guitar_sling': {
      ctx.save();
      ctx.translate(0, midY);
      ctx.rotate(-0.55);
      // Neck & headstock
      ctx.fillStyle = '#334155';
      ctx.fillRect(-3, -64, 6, 48);
      ctx.fillStyle = pal.accent;
      ctx.beginPath();
      ctx.moveTo(-4, -64);
      ctx.lineTo(6, -74);
      ctx.lineTo(5, -62);
      ctx.closePath();
      ctx.fill();
      // Cutaway body
      ctx.fillStyle = pal.primary;
      ctx.beginPath();
      ctx.ellipse(0, 6, 17, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(4, 8, 7, 11, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'jetpack_twin': {
      const flame = 8 + Math.sin(t * 24 + seed) * 3.5;
      for (const sx of [-1, 1]) {
        const px = sx * (chestW + 3);
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.roundRect(px - 7, torsoTopY + 8, 14, 38, 5);
        ctx.fill();
        ctx.fillStyle = pal.accent;
        ctx.fillRect(px - 6, torsoTopY + 18, 12, 5);
        // Exhaust glow
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(px - 4, torsoTopY + 46);
        ctx.lineTo(px + 4, torsoTopY + 46);
        ctx.lineTo(px, torsoTopY + 46 + flame);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'scroll_cylinder': {
      ctx.save();
      ctx.translate(0, torsoTopY + 14);
      ctx.rotate(-0.42);
      ctx.fillStyle = '#7c2d12';
      ctx.beginPath();
      ctx.roundRect(-26, -7, 52, 14, 5);
      ctx.fill();
      ctx.fillStyle = pal.accent;
      ctx.fillRect(-26, -7, 6, 14);
      ctx.fillRect(20, -7, 6, 14);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(-10, -7, 20, 14);
      ctx.restore();
      break;
    }
    case 'shield_slung': {
      ctx.fillStyle = darken(pal.primary, 0.72);
      ctx.beginPath();
      ctx.moveTo(-24, torsoTopY + 6);
      ctx.lineTo(24, torsoTopY + 6);
      ctx.lineTo(22, midY + 14);
      ctx.quadraticCurveTo(0, waistY + 10, -22, midY + 14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 3.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, midY + 2, 7, 0, Math.PI * 2);
      ctx.fillStyle = pal.accent;
      ctx.fill();
      break;
    }
    case 'oxygen_tanks': {
      for (const ox of [-9, 9]) {
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.roundRect(ox - 6, torsoTopY + 6, 12, 42, 6);
        ctx.fill();
        ctx.fillStyle = pal.accent;
        ctx.fillRect(ox - 6, torsoTopY + 14, 12, 4);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(ox - 3, torsoTopY + 1, 6, 6);
      }
      break;
    }
    case 'lantern_pole': {
      const sway = Math.sin(t * 3.1 + seed) * 4;
      ctx.strokeStyle = '#5c3a21';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-chestW - 2, waistY);
      ctx.lineTo(-chestW - 12, torsoTopY - 36);
      ctx.lineTo(-chestW + 6, torsoTopY - 40);
      ctx.stroke();
      // Glowing spirit lantern
      const lx = -chestW + 6 + sway;
      const ly = torsoTopY - 26;
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-chestW + 6, torsoTopY - 40);
      ctx.lineTo(lx, ly - 8);
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.ellipse(lx, ly, 8, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }
    case 'cyber_halo_ring': {
      const spin = t * 0.9 + seed;
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(0, torsoTopY - 2, 34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.arc(0, torsoTopY - 2, 40, spin, spin + Math.PI * 1.65);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    }
    case 'plush_satchel': {
      ctx.fillStyle = lighten(pal.secondary, 0.22);
      ctx.beginPath();
      ctx.roundRect(-chestW - 14, midY - 2, 22, 26, 7);
      ctx.fill();
      ctx.fillStyle = pal.accent;
      ctx.beginPath();
      ctx.roundRect(-chestW - 14, midY - 2, 22, 10, 5);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-chestW - 3, midY + 9, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}

// =========================================================================
// 2. BODY MARKS LAYER (Torso + Arms/Hands — up to 3 combinable marks)
// =========================================================================

export function drawBodyMarksLayer(
  ctx: CanvasRenderingContext2D,
  bodyMarks: readonly BodyMarkId[],
  pal: CharacterPaletteSpec,
  chestW: number,
  waistW: number,
  torsoTopY: number,
  waistY: number,
  t: number
): void {
  if (!bodyMarks || bodyMarks.length === 0) return;
  const ink = pal.markTint || pal.accent;
  const midY = (torsoTopY + waistY) * 0.5;
  const h = Math.max(20, waistY - torsoTopY);

  ctx.save();
  // Clip cleanly to torso silhouette
  ctx.beginPath();
  ctx.moveTo(-chestW, torsoTopY);
  ctx.lineTo(chestW, torsoTopY);
  ctx.lineTo(waistW, waistY);
  ctx.lineTo(-waistW, waistY);
  ctx.closePath();
  ctx.clip();

  for (const mark of bodyMarks) {
    if (mark === 'none') continue;
    ctx.save();
    switch (mark) {
      case 'tribal_arm_bands': {
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.4;
        for (const sx of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(sx * (chestW - 2), torsoTopY + 12);
          ctx.lineTo(sx * (chestW - 10), torsoTopY + 18);
          ctx.lineTo(sx * (chestW - 3), torsoTopY + 24);
          ctx.stroke();
        }
        break;
      }
      case 'sleeve_tattoo_ink': {
        ctx.strokeStyle = darken(ink, 0.55);
        ctx.lineWidth = 1.8;
        ctx.globalAlpha = 0.72;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(chestW * 0.62, torsoTopY + 12 + i * 10, 6, 0.3, Math.PI * 1.4);
          ctx.stroke();
        }
        break;
      }
      case 'cyber_circuit_veins': {
        ctx.strokeStyle = pal.markTint || '#22d3ee';
        ctx.lineWidth = 1.8;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(-chestW * 0.65, torsoTopY + 8);
        ctx.lineTo(-4, torsoTopY + 20);
        ctx.lineTo(-4, waistY - 8);
        ctx.moveTo(chestW * 0.65, torsoTopY + 14);
        ctx.lineTo(7, torsoTopY + 26);
        ctx.lineTo(7, waistY - 12);
        ctx.stroke();
        ctx.fillStyle = pal.markTint || '#22d3ee';
        ctx.beginPath();
        ctx.arc(-4, torsoTopY + 20, 2.6, 0, Math.PI * 2);
        ctx.arc(7, torsoTopY + 26, 2.6, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'glowing_magic_runes': {
        const pulse = 0.62 + 0.32 * Math.sin(t * 3.4);
        ctx.strokeStyle = pal.markTint || '#a855f7';
        ctx.globalAlpha = pulse;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, torsoTopY + 10);
        ctx.lineTo(8, midY);
        ctx.lineTo(0, waistY - 10);
        ctx.lineTo(-8, midY);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, midY, 4.5, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'battle_scars_chest': {
        ctx.strokeStyle = pal.markTint || '#991b1b';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-12, torsoTopY + 10);
        ctx.lineTo(13, midY + 8);
        ctx.moveTo(-6, torsoTopY + 26);
        ctx.lineTo(9, torsoTopY + 14);
        ctx.stroke();
        break;
      }
      case 'vitiligo_body': {
        ctx.fillStyle = pal.markTint || lighten(pal.skin, 0.45);
        ctx.globalAlpha = 0.72;
        ctx.beginPath();
        ctx.ellipse(-chestW * 0.42, torsoTopY + 18, 9, 12, 0.3, 0, Math.PI * 2);
        ctx.ellipse(chestW * 0.34, midY + 10, 7, 10, -0.4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'henna_mehndi_hands': {
        ctx.strokeStyle = pal.markTint || '#7c2d12';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, torsoTopY + 12, 7, 0.2, Math.PI - 0.2);
        ctx.stroke();
        break;
      }
      case 'dragon_coil_tattoo': {
        ctx.strokeStyle = pal.markTint || '#dc2626';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-chestW * 0.55, waistY - 6);
        ctx.bezierCurveTo(-12, midY + 8, 18, midY - 6, 4, torsoTopY + 10);
        ctx.stroke();
        ctx.fillStyle = pal.accent;
        ctx.beginPath();
        ctx.arc(4, torsoTopY + 10, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'sacred_ash_stripes': {
        ctx.strokeStyle = pal.markTint || '#f8fafc';
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = 2.2;
        for (let i = 0; i < 3; i++) {
          const y = torsoTopY + 14 + i * 5.5;
          ctx.beginPath();
          ctx.moveTo(-12, y);
          ctx.lineTo(12, y);
          ctx.stroke();
        }
        break;
      }
      case 'tiger_body_stripes': {
        ctx.fillStyle = pal.markTint || '#111827';
        ctx.globalAlpha = 0.7;
        for (let i = 0; i < 4; i++) {
          const y = torsoTopY + 10 + i * (h * 0.2);
          ctx.beginPath();
          ctx.moveTo(-chestW, y);
          ctx.lineTo(-4, y + 3);
          ctx.lineTo(-chestW, y + 6);
          ctx.moveTo(chestW, y + 2);
          ctx.lineTo(4, y + 5);
          ctx.lineTo(chestW, y + 8);
          ctx.fill();
        }
        break;
      }
      case 'starlight_freckles': {
        ctx.fillStyle = pal.markTint || '#fef08a';
        ctx.globalAlpha = 0.85;
        const pts: [number, number][] = [
          [-10, torsoTopY + 14],
          [8, torsoTopY + 18],
          [-4, midY],
          [11, midY + 9],
          [-9, waistY - 12],
          [3, waistY - 14],
        ];
        for (const [px, py] of pts) {
          ctx.beginPath();
          ctx.arc(px, py, 1.7, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'stitch_seams': {
        ctx.strokeStyle = pal.markTint || '#111827';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-10, torsoTopY + 8);
        ctx.lineTo(10, waistY - 8);
        ctx.stroke();
        for (let i = 0; i < 5; i++) {
          const u = (i + 0.5) / 5;
          const sx = -10 + 20 * u;
          const sy = torsoTopY + 8 + (h - 16) * u;
          ctx.beginPath();
          ctx.moveTo(sx - 4, sy + 2);
          ctx.lineTo(sx + 4, sy - 2);
          ctx.stroke();
        }
        break;
      }
      case 'cracked_stone_veins': {
        ctx.strokeStyle = pal.markTint || '#334155';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-14, torsoTopY + 6);
        ctx.lineTo(-3, midY - 4);
        ctx.lineTo(7, midY + 4);
        ctx.lineTo(2, waistY - 6);
        ctx.moveTo(-3, midY - 4);
        ctx.lineTo(-12, midY + 10);
        ctx.stroke();
        break;
      }
      case 'biolum_spots': {
        ctx.fillStyle = pal.markTint || '#38bdf8';
        ctx.globalAlpha = 0.72 + 0.2 * Math.sin(t * 2.8);
        for (const [bx, by, br] of [
          [-9, torsoTopY + 14, 3.2],
          [9, torsoTopY + 20, 2.8],
          [0, midY + 4, 3.6],
          [-7, waistY - 14, 2.4],
          [8, waistY - 12, 2.6],
        ] as [number, number, number][]) {
          ctx.beginPath();
          ctx.arc(bx, by, br, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'anchor_sailor_tattoo': {
        ctx.strokeStyle = pal.markTint || '#1e3a8a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(7, torsoTopY + 13);
        ctx.lineTo(7, torsoTopY + 27);
        ctx.moveTo(2, torsoTopY + 17);
        ctx.lineTo(12, torsoTopY + 17);
        ctx.arc(7, torsoTopY + 23, 5, 0.15, Math.PI - 0.15);
        ctx.stroke();
        break;
      }
    }
    ctx.restore();
  }
  ctx.restore();
}

export function drawArmBodyMarksOverlay(
  ctx: CanvasRenderingContext2D,
  bodyMarks: readonly BodyMarkId[],
  pal: CharacterPaletteSpec,
  forearmLen: number
): void {
  if (!bodyMarks || bodyMarks.length === 0) return;
  const ink = pal.markTint || pal.accent;
  ctx.save();
  for (const mark of bodyMarks) {
    if (mark === 'tribal_arm_bands') {
      ctx.fillStyle = ink;
      ctx.fillRect(-4.2, forearmLen * 0.28, 8.4, 3);
      ctx.fillRect(-4.2, forearmLen * 0.48, 8.4, 2.4);
    } else if (mark === 'sleeve_tattoo_ink' || mark === 'dragon_coil_tattoo') {
      ctx.strokeStyle = darken(ink, 0.55);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-3, 2);
      ctx.quadraticCurveTo(4, forearmLen * 0.4, -3, forearmLen * 0.8);
      ctx.stroke();
    } else if (mark === 'henna_mehndi_hands') {
      ctx.strokeStyle = pal.markTint || '#7c2d12';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, forearmLen + 1, 4.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-3.5, forearmLen - 5);
      ctx.lineTo(3.5, forearmLen - 5);
      ctx.stroke();
    } else if (mark === 'cyber_circuit_veins' || mark === 'glowing_magic_runes') {
      ctx.strokeStyle = pal.markTint || '#22d3ee';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(0, forearmLen - 3);
      ctx.stroke();
    } else if (mark === 'vitiligo_body') {
      ctx.fillStyle = pal.markTint || lighten(pal.skin, 0.45);
      ctx.beginPath();
      ctx.ellipse(0, forearmLen * 0.55, 3.8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (mark === 'anchor_sailor_tattoo') {
      ctx.strokeStyle = pal.markTint || '#1e3a8a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, forearmLen * 0.25);
      ctx.lineTo(0, forearmLen * 0.65);
      ctx.moveTo(-3, forearmLen * 0.4);
      ctx.lineTo(3, forearmLen * 0.4);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// =========================================================================
// 3. LAYERED CLOTHING (Outerwear, Sleeves, Waist, Gloves, Footwear)
// =========================================================================

export function drawOuterwearLayer(
  ctx: CanvasRenderingContext2D,
  outerwear: OuterwearStyleId | undefined,
  pal: CharacterPaletteSpec,
  chestW: number,
  waistW: number,
  torsoTopY: number,
  waistY: number
): void {
  if (!outerwear || outerwear === 'none') return;
  const midY = (torsoTopY + waistY) * 0.5;
  ctx.save();
  switch (outerwear) {
    case 'leather_biker': {
      ctx.fillStyle = '#18181b';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * chestW, torsoTopY);
        ctx.lineTo(s * 5, torsoTopY + 14);
        ctx.lineTo(s * 3, waistY);
        ctx.lineTo(s * waistW, waistY);
        ctx.closePath();
        ctx.fill();
      }
      // Asymmetric silver lapels & zipper
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-9, torsoTopY + 2);
      ctx.lineTo(-16, torsoTopY + 16);
      ctx.lineTo(-5, torsoTopY + 20);
      ctx.moveTo(9, torsoTopY + 2);
      ctx.lineTo(16, torsoTopY + 16);
      ctx.lineTo(5, torsoTopY + 20);
      ctx.moveTo(4, torsoTopY + 18);
      ctx.lineTo(4, waistY - 2);
      ctx.stroke();
      break;
    }
    case 'denim_vest': {
      ctx.fillStyle = '#2563eb';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * (chestW + 1), torsoTopY);
        ctx.lineTo(s * 6, torsoTopY + 8);
        ctx.lineTo(s * 5, waistY);
        ctx.lineTo(s * waistW, waistY);
        ctx.closePath();
        ctx.fill();
      }
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-chestW + 4, torsoTopY + 14, 9, 8);
      ctx.strokeRect(chestW - 13, torsoTopY + 14, 9, 8);
      break;
    }
    case 'royal_sherwani_coat': {
      ctx.fillStyle = darken(pal.primary, 0.78);
      ctx.beginPath();
      ctx.moveTo(-chestW - 1, torsoTopY);
      ctx.lineTo(chestW + 1, torsoTopY);
      ctx.lineTo(waistW + 5, waistY + 18);
      ctx.lineTo(-waistW - 5, waistY + 18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(0, torsoTopY);
      ctx.lineTo(0, waistY + 18);
      ctx.stroke();
      for (let b = 0; b < 5; b++) {
        ctx.fillStyle = pal.accent;
        ctx.beginPath();
        ctx.arc(0, torsoTopY + 10 + b * 11, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'bomber_jacket': {
      ctx.fillStyle = darken(pal.secondary, 0.85);
      ctx.beginPath();
      ctx.roundRect(-chestW - 2, torsoTopY, (chestW + 2) * 2, waistY - torsoTopY, 6);
      ctx.fill();
      // Ribbed collar & waist cuff
      ctx.fillStyle = pal.accent;
      ctx.fillRect(-10, torsoTopY - 2, 20, 6);
      ctx.fillRect(-waistW - 2, waistY - 6, (waistW + 2) * 2, 6);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, torsoTopY + 4);
      ctx.lineTo(0, waistY - 6);
      ctx.stroke();
      break;
    }
    case 'puffer_vest': {
      ctx.fillStyle = pal.accent;
      ctx.beginPath();
      ctx.roundRect(-chestW, torsoTopY + 2, chestW * 2, waistY - torsoTopY - 2, 5);
      ctx.fill();
      ctx.strokeStyle = darken(pal.accent, 0.65);
      ctx.lineWidth = 1.6;
      for (let i = 1; i <= 3; i++) {
        const y = torsoTopY + ((waistY - torsoTopY) * i) / 4;
        ctx.beginPath();
        ctx.moveTo(-chestW + 2, y);
        ctx.lineTo(chestW - 2, y);
        ctx.stroke();
      }
      break;
    }
    case 'tactical_rig': {
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(-chestW * 0.78, torsoTopY + 10, chestW * 1.56, 30);
      // Shoulder straps
      ctx.fillRect(-chestW * 0.68, torsoTopY, 6, 12);
      ctx.fillRect(chestW * 0.68 - 6, torsoTopY, 6, 12);
      // Molle pouches
      ctx.fillStyle = '#374151';
      for (let i = -1; i <= 1; i++) {
        ctx.fillRect(i * 11 - 4.5, torsoTopY + 24, 9, 13);
      }
      ctx.fillStyle = pal.accent;
      ctx.fillRect(-4, torsoTopY + 14, 8, 5);
      break;
    }
    case 'fur_collared_coat': {
      ctx.fillStyle = darken(pal.secondary, 0.76);
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * (chestW + 2), torsoTopY + 4);
        ctx.lineTo(s * 6, torsoTopY + 10);
        ctx.lineTo(s * 6, waistY + 16);
        ctx.lineTo(s * (waistW + 6), waistY + 16);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.ellipse(0, torsoTopY + 5, chestW * 1.05, 8.5, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'academic_blazer': {
      ctx.fillStyle = '#1e293b';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * (chestW + 1), torsoTopY);
        ctx.lineTo(s * 8, torsoTopY);
        ctx.lineTo(s * 2, torsoTopY + 26);
        ctx.lineTo(s * 2, waistY + 6);
        ctx.lineTo(s * (waistW + 2), waistY + 6);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = pal.accent;
      ctx.fillRect(chestW * 0.35, torsoTopY + 14, 6, 6);
      break;
    }
    case 'shawl_wrap': {
      ctx.fillStyle = pal.accent;
      ctx.beginPath();
      ctx.moveTo(-chestW - 4, torsoTopY + 2);
      ctx.quadraticCurveTo(0, torsoTopY + 28, chestW + 4, torsoTopY + 2);
      ctx.lineTo(chestW + 6, torsoTopY + 22);
      ctx.quadraticCurveTo(0, torsoTopY + 44, -chestW - 6, torsoTopY + 22);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'chainmail_hauberk': {
      ctx.fillStyle = '#64748b';
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(-chestW, torsoTopY);
      ctx.lineTo(chestW, torsoTopY);
      ctx.lineTo(waistW + 3, waistY + 10);
      ctx.lineTo(-waistW - 3, waistY + 10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.2;
      for (let y = torsoTopY + 6; y < waistY + 6; y += 7) {
        ctx.beginPath();
        ctx.moveTo(-waistW, y);
        ctx.lineTo(waistW, y);
        ctx.stroke();
      }
      break;
    }
    case 'cyber_exovest': {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-chestW - 2, torsoTopY + 2);
      ctx.lineTo(chestW + 2, torsoTopY + 2);
      ctx.lineTo(waistW + 2, midY + 14);
      ctx.lineTo(-waistW - 2, midY + 14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-chestW * 0.7, torsoTopY + 10);
      ctx.lineTo(0, midY);
      ctx.lineTo(chestW * 0.7, torsoTopY + 10);
      ctx.stroke();
      ctx.fillStyle = pal.accent;
      ctx.beginPath();
      ctx.arc(0, midY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'hooded_poncho': {
      ctx.fillStyle = darken(pal.primary, 0.82);
      ctx.beginPath();
      ctx.moveTo(-chestW - 6, torsoTopY + 4);
      ctx.lineTo(chestW + 6, torsoTopY + 4);
      ctx.lineTo(waistW + 14, waistY + 6);
      ctx.lineTo(0, waistY + 18);
      ctx.lineTo(-waistW - 14, waistY + 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-waistW - 10, waistY + 2);
      ctx.lineTo(0, waistY + 13);
      ctx.lineTo(waistW + 10, waistY + 2);
      ctx.stroke();
      break;
    }
    case 'apron_artisan': {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-13, torsoTopY + 12, 26, waistY - torsoTopY + 12);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-10, torsoTopY + 12);
      ctx.lineTo(-6, torsoTopY);
      ctx.moveTo(10, torsoTopY + 12);
      ctx.lineTo(6, torsoTopY);
      ctx.stroke();
      ctx.fillStyle = pal.accent;
      ctx.fillRect(-9, midY + 4, 18, 12);
      break;
    }
  }
  ctx.restore();
}

export function drawOuterwearCloseUpLayer(
  ctx: CanvasRenderingContext2D,
  outerwear: OuterwearStyleId | undefined,
  pal: CharacterPaletteSpec,
  shW: number
): void {
  if (!outerwear || outerwear === 'none') return;
  ctx.save();
  if (outerwear === 'leather_biker') {
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(-shW * 1.15, 224);
    ctx.lineTo(-shW, 74);
    ctx.lineTo(-34, 74);
    ctx.lineTo(-22, 224);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(shW * 1.15, 224);
    ctx.lineTo(shW, 74);
    ctx.lineTo(34, 74);
    ctx.lineTo(22, 224);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-34, 76);
    ctx.lineTo(-68, 130);
    ctx.lineTo(-28, 152);
    ctx.moveTo(34, 76);
    ctx.lineTo(68, 130);
    ctx.lineTo(28, 152);
    ctx.stroke();
  } else if (outerwear === 'fur_collared_coat') {
    ctx.fillStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.ellipse(0, 92, shW * 1.02, 34, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (outerwear === 'shawl_wrap' || outerwear === 'hooded_poncho') {
    ctx.fillStyle = outerwear === 'shawl_wrap' ? pal.accent : darken(pal.primary, 0.78);
    ctx.beginPath();
    ctx.moveTo(-shW * 1.15, 86);
    ctx.quadraticCurveTo(0, 174, shW * 1.15, 86);
    ctx.lineTo(shW * 1.25, 165);
    ctx.quadraticCurveTo(0, 224, -shW * 1.25, 165);
    ctx.closePath();
    ctx.fill();
  } else if (outerwear === 'cyber_exovest' || outerwear === 'tactical_rig') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-shW * 0.75, 82, 28, 130);
    ctx.fillRect(shW * 0.75 - 28, 82, 28, 130);
    ctx.strokeStyle = outerwear === 'cyber_exovest' ? '#22d3ee' : pal.accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-shW * 0.6, 118);
    ctx.lineTo(0, 168);
    ctx.lineTo(shW * 0.6, 118);
    ctx.stroke();
  } else if (outerwear === 'royal_sherwani_coat' || outerwear === 'academic_blazer') {
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-42, 74);
    ctx.lineTo(0, 175);
    ctx.lineTo(42, 74);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawSleeveOverlay(
  ctx: CanvasRenderingContext2D,
  sleeveStyle: SleeveStyleId | undefined,
  pal: CharacterPaletteSpec,
  upperLen: number,
  forearmLen: number,
  isUpperSegment: boolean
): void {
  if (!sleeveStyle || sleeveStyle === 'auto' || sleeveStyle === 'sleeveless') return;
  ctx.save();
  ctx.fillStyle = pal.primary;
  if (isUpperSegment) {
    if (sleeveStyle === 'short_sleeve') {
      ctx.fillRect(-6, -2, 12, upperLen * 0.65);
    } else if (sleeveStyle === 'puffed_royal') {
      ctx.beginPath();
      ctx.ellipse(0, upperLen * 0.35, 9, upperLen * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    } else {
      ctx.fillRect(-5.8, -2, 11.6, upperLen + 2);
    }
  } else {
    if (sleeveStyle === 'rolled_cuff') {
      ctx.fillRect(-5, 0, 10, forearmLen * 0.42);
      ctx.fillStyle = pal.accent;
      ctx.fillRect(-5.6, forearmLen * 0.36, 11.2, 4);
    } else if (sleeveStyle === 'long_fitted') {
      ctx.fillRect(-4.8, 0, 9.6, forearmLen - 2);
      ctx.fillStyle = pal.accent;
      ctx.fillRect(-5, forearmLen - 5, 10, 3);
    } else if (sleeveStyle === 'bell_wide') {
      ctx.beginPath();
      ctx.moveTo(-4.8, 0);
      ctx.lineTo(4.8, 0);
      ctx.lineTo(9.5, forearmLen - 1);
      ctx.lineTo(-9.5, forearmLen - 1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-9.5, forearmLen - 1);
      ctx.lineTo(9.5, forearmLen - 1);
      ctx.stroke();
    } else if (sleeveStyle === 'puffed_royal') {
      ctx.fillRect(-4.5, 0, 9, forearmLen - 2);
    }
  }
  ctx.restore();
}

export function drawWaistLayer(
  ctx: CanvasRenderingContext2D,
  waistStyle: WaistStyleId | undefined,
  pal: CharacterPaletteSpec,
  waistW: number,
  waistY: number
): void {
  if (!waistStyle || waistStyle === 'none') return;
  const w = waistW + 2;
  ctx.save();
  switch (waistStyle) {
    case 'leather_buckle':
      ctx.fillStyle = '#3f2314';
      ctx.fillRect(-w, waistY - 6, w * 2, 7);
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 2.2;
      ctx.strokeRect(-5, waistY - 6.5, 10, 8);
      break;
    case 'royal_kamarband':
      ctx.fillStyle = pal.accent;
      ctx.fillRect(-w - 1, waistY - 9, (w + 1) * 2, 11);
      ctx.fillStyle = pal.primary;
      ctx.beginPath();
      ctx.moveTo(0, waistY + 2);
      ctx.lineTo(7, waistY + 18);
      ctx.lineTo(-7, waistY + 18);
      ctx.closePath();
      ctx.fill();
      break;
    case 'utility_pouches':
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(-w, waistY - 6, w * 2, 7);
      ctx.fillStyle = '#4b5563';
      for (const px of [-w + 2, -6, w - 10]) {
        ctx.fillRect(px, waistY - 7, 8, 10);
      }
      break;
    case 'obi_sash':
      ctx.fillStyle = pal.accent;
      ctx.fillRect(-w - 1, waistY - 12, (w + 1) * 2, 14);
      ctx.strokeStyle = pal.secondary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-w - 1, waistY - 5);
      ctx.lineTo(w + 1, waistY - 5);
      ctx.stroke();
      break;
    case 'chain_belt':
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(-w, waistY - 4);
      ctx.quadraticCurveTo(0, waistY + 5, w, waistY - 4);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    case 'rope_cord':
      ctx.strokeStyle = '#d6b478';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-w, waistY - 4);
      ctx.lineTo(w, waistY - 4);
      ctx.moveTo(4, waistY - 4);
      ctx.lineTo(8, waistY + 14);
      ctx.stroke();
      break;
    case 'champion_belt':
      ctx.fillStyle = '#111827';
      ctx.fillRect(-w - 1, waistY - 8, (w + 1) * 2, 10);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.ellipse(0, waistY - 3, 11, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'ammo_bandolier':
      ctx.strokeStyle = '#3f2314';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-w - 3, waistY - 48);
      ctx.lineTo(w + 2, waistY);
      ctx.stroke();
      ctx.fillStyle = pal.accent;
      for (let i = 0; i < 5; i++) {
        const u = (i + 0.5) / 5;
        ctx.fillRect(-w - 3 + (w * 2 + 5) * u - 1.5, waistY - 48 + 48 * u - 3, 3, 6);
      }
      break;
    case 'jeweled_girdle':
      ctx.fillStyle = pal.accent;
      ctx.fillRect(-w, waistY - 6, w * 2, 6);
      ctx.fillStyle = '#ef4444';
      for (const gx of [-10, 0, 10]) {
        ctx.beginPath();
        ctx.arc(gx, waistY - 3, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
  }
  ctx.restore();
}

export function drawGlovesLayer(
  ctx: CanvasRenderingContext2D,
  gloves: GloveStyleId | undefined,
  pal: CharacterPaletteSpec,
  forearmLen: number
): void {
  if (!gloves || gloves === 'none') return;
  ctx.save();
  switch (gloves) {
    case 'fingerless_biker':
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-4.6, forearmLen - 5, 9.2, 6.5);
      break;
    case 'leather_gloves':
      ctx.fillStyle = '#3f2314';
      ctx.fillRect(-4.6, forearmLen - 7, 9.2, 8);
      ctx.beginPath();
      ctx.arc(0, forearmLen + 2, 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'steel_gauntlets':
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-5.4, forearmLen - 11, 10.8, 12);
      ctx.beginPath();
      ctx.arc(0, forearmLen + 2, 6.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(-5.4, forearmLen - 11, 10.8, 4);
      break;
    case 'silk_opera_gloves':
      ctx.fillStyle = lighten(pal.primary, 0.25);
      ctx.fillRect(-4.5, 2, 9, forearmLen);
      ctx.beginPath();
      ctx.arc(0, forearmLen + 2, 5.8, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'wrapped_bandages':
    case 'boxing_wraps':
      ctx.fillStyle = gloves === 'boxing_wraps' ? '#dc2626' : '#f1f5f9';
      ctx.fillRect(-4.8, forearmLen - 10, 9.6, 11);
      ctx.beginPath();
      ctx.arc(0, forearmLen + 2, gloves === 'boxing_wraps' ? 7.2 : 5.8, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'cyber_hands':
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-4.8, forearmLen - 8, 9.6, 9);
      ctx.beginPath();
      ctx.arc(0, forearmLen + 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(0, forearmLen + 2, 2.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'gold_bangles_stack':
      ctx.fillStyle = '#facc15';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(-5, forearmLen - 4 - i * 3.2, 10, 2);
      }
      break;
  }
  ctx.restore();
}

export function drawFootwearLayer(
  ctx: CanvasRenderingContext2D,
  footwear: FootwearStyleId | undefined,
  pal: CharacterPaletteSpec,
  stride: number,
  bulkScale: number
): boolean {
  if (!footwear || footwear === 'auto') return false;
  const footPositions = [-16 - stride * 0.52, 6 + stride * 0.52];
  const fw = 11 * bulkScale;

  ctx.save();
  for (const fx of footPositions) {
    switch (footwear) {
      case 'barefoot':
        ctx.fillStyle = pal.skin;
        ctx.fillRect(fx, -22, fw, 20);
        ctx.beginPath();
        ctx.ellipse(fx + fw * 0.65, -2, fw * 0.65, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'royal_mojari':
        ctx.fillStyle = pal.accent;
        ctx.fillRect(fx, -14, fw, 14);
        ctx.beginPath();
        ctx.moveTo(fx + fw, -10);
        ctx.quadraticCurveTo(fx + fw + 8, -14, fx + fw + 6, -18);
        ctx.lineTo(fx + fw + 2, -2);
        ctx.lineTo(fx, -2);
        ctx.closePath();
        ctx.fill();
        break;
      case 'leather_boots':
      case 'combat_boots':
        ctx.fillStyle = footwear === 'combat_boots' ? '#111827' : '#5c3a21';
        ctx.fillRect(fx - 0.5, -26, fw + 1, 26);
        ctx.fillRect(fx, -6, fw + 5, 6);
        if (footwear === 'combat_boots') {
          ctx.fillStyle = '#334155';
          ctx.fillRect(fx - 0.5, -3, fw + 6, 3);
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.2;
          for (let l = 0; l < 3; l++) {
            ctx.beginPath();
            ctx.moveTo(fx + 2, -21 + l * 4);
            ctx.lineTo(fx + fw - 1, -21 + l * 4);
            ctx.stroke();
          }
        }
        break;
      case 'sneakers_high':
        ctx.fillStyle = pal.primary;
        ctx.fillRect(fx, -18, fw, 15);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(fx - 0.5, -4, fw + 6, 4);
        ctx.fillRect(fx + fw * 0.6, -11, 5, 7);
        break;
      case 'dress_oxfords':
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(fx, -12, fw + 5, 12);
        ctx.fillStyle = '#334155';
        ctx.fillRect(fx + 2, -10, 4, 2);
        break;
      case 'sandals_strappy':
        ctx.fillStyle = pal.skin;
        ctx.fillRect(fx, -22, fw, 19);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(fx - 0.5, -3.5, fw + 4, 3.5);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(fx, -16);
        ctx.lineTo(fx + fw, -11);
        ctx.moveTo(fx + fw, -16);
        ctx.lineTo(fx, -11);
        ctx.stroke();
        break;
      case 'armored_sabatons':
        ctx.fillStyle = '#64748b';
        ctx.fillRect(fx - 1, -26, fw + 2, 26);
        ctx.fillStyle = pal.accent;
        ctx.fillRect(fx - 1, -18, fw + 2, 4);
        ctx.fillStyle = '#475569';
        ctx.fillRect(fx, -6, fw + 6, 6);
        break;
      case 'cyber_greaves':
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(fx - 1, -26, fw + 2, 26);
        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(fx + fw * 0.35, -24, 2.5, 18);
        ctx.fillRect(fx, -3, fw + 6, 3);
        break;
      case 'heels_classic':
        ctx.fillStyle = pal.primary;
        ctx.beginPath();
        ctx.moveTo(fx, -12);
        ctx.lineTo(fx + fw + 4, -5);
        ctx.lineTo(fx + fw + 4, 0);
        ctx.lineTo(fx + fw * 0.5, 0);
        ctx.lineTo(fx + 3, -7);
        ctx.lineTo(fx + 3, 0);
        ctx.lineTo(fx, 0);
        ctx.closePath();
        ctx.fill();
        break;
      case 'tabi_ninja':
        ctx.fillStyle = '#18181b';
        ctx.fillRect(fx, -22, fw, 22);
        ctx.fillRect(fx, -5, fw + 4, 5);
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(fx, -16);
        ctx.lineTo(fx + fw, -12);
        ctx.moveTo(fx, -10);
        ctx.lineTo(fx + fw, -14);
        ctx.stroke();
        break;
    }
  }
  ctx.restore();
  return true;
}

// =========================================================================
// 4. EXPANDED HAIR (+10) & FACIAL HAIR (+6)
// =========================================================================

export function drawGranularHairBehind(
  ctx: CanvasRenderingContext2D,
  hairStyle: HairStyleId,
  hairHex: string,
  t: number
): boolean {
  const sway = Math.sin(t * 2.5) * 3.5;
  ctx.save();
  ctx.fillStyle = hairHex;
  switch (hairStyle) {
    case 'bob_cut':
      ctx.beginPath();
      ctx.moveTo(-78, -52);
      ctx.quadraticCurveTo(0, -102, 78, -52);
      ctx.lineTo(84, 58);
      ctx.quadraticCurveTo(64, 72, 46, 56);
      ctx.lineTo(-46, 56);
      ctx.quadraticCurveTo(-64, 72, -84, 58);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return true;
    case 'pixie_short':
      ctx.beginPath();
      ctx.arc(0, -28, 76, Math.PI * 0.9, Math.PI * 2.1);
      ctx.lineTo(66, -12);
      ctx.lineTo(-66, -12);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return true;
    case 'curly_afro':
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 62, -26 + Math.sin(a) * 58, 34, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(0, -28, 78, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return true;
    case 'ponytail_high':
      ctx.beginPath();
      ctx.arc(0, -26, 74, Math.PI * 0.95, Math.PI * 2.05);
      ctx.fill();
      // High flowing tail
      ctx.beginPath();
      ctx.moveTo(-12, -88);
      ctx.quadraticCurveTo(-84 + sway, -108, -96 + sway * 1.4, 34);
      ctx.quadraticCurveTo(-64 + sway, 16, -42, -56);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return true;
    case 'side_shave_undercut':
      ctx.beginPath();
      ctx.moveTo(-64, -56);
      ctx.quadraticCurveTo(10, -106, 86, -48);
      ctx.lineTo(74, 24);
      ctx.lineTo(36, 12);
      ctx.lineTo(-64, -22);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return true;
    case 'wavy_shoulder':
      ctx.beginPath();
      ctx.moveTo(-78, -48);
      ctx.quadraticCurveTo(0, -102, 78, -48);
      ctx.bezierCurveTo(96, 12, 74 + sway, 54, 88 + sway, 118);
      ctx.lineTo(-88 + sway, 118);
      ctx.bezierCurveTo(-74 + sway, 54, -96, 12, -78, -48);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return true;
    case 'twin_buns':
      ctx.beginPath();
      ctx.arc(0, -28, 72, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-62, -78, 28, 0, Math.PI * 2);
      ctx.arc(62, -78, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return true;
    case 'mohawk_punk':
      ctx.beginPath();
      ctx.moveTo(-18, -58);
      ctx.lineTo(-28, -124);
      ctx.lineTo(-4, -104);
      ctx.lineTo(0, -136);
      ctx.lineTo(10, -104);
      ctx.lineTo(28, -120);
      ctx.lineTo(18, -58);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return true;
    case 'messy_anime':
      ctx.beginPath();
      ctx.moveTo(-76, -24);
      ctx.lineTo(-98, -54);
      ctx.lineTo(-64, -66);
      ctx.lineTo(-76, -106);
      ctx.lineTo(-26, -86);
      ctx.lineTo(0, -120);
      ctx.lineTo(28, -88);
      ctx.lineTo(78, -108);
      ctx.lineTo(66, -64);
      ctx.lineTo(98, -50);
      ctx.lineTo(76, -20);
      ctx.lineTo(72, 24);
      ctx.lineTo(-72, 24);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return true;
    case 'silver_bun_elder':
      ctx.fillStyle = hairHex === '#111422' ? '#d1d5db' : hairHex;
      ctx.beginPath();
      ctx.arc(0, -28, 74, Math.PI * 0.92, Math.PI * 2.08);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -96, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return true;
    default:
      ctx.restore();
      return false;
  }
}

export function drawGranularHairFront(
  ctx: CanvasRenderingContext2D,
  hairStyle: HairStyleId,
  hairHex: string,
  accentHex: string
): void {
  ctx.save();
  ctx.fillStyle = hairHex;
  if (hairStyle === 'bob_cut') {
    ctx.beginPath();
    ctx.moveTo(-66, -54);
    ctx.quadraticCurveTo(0, -82, 66, -54);
    ctx.lineTo(64, -30);
    ctx.lineTo(-64, -30);
    ctx.closePath();
    ctx.fill();
  } else if (hairStyle === 'pixie_short' || hairStyle === 'side_shave_undercut') {
    ctx.beginPath();
    ctx.moveTo(-58, -58);
    ctx.quadraticCurveTo(6, -88, 66, -46);
    ctx.quadraticCurveTo(18, -32, -26, -40);
    ctx.closePath();
    ctx.fill();
  } else if (hairStyle === 'messy_anime') {
    ctx.beginPath();
    ctx.moveTo(-66, -48);
    ctx.lineTo(-34, -22);
    ctx.lineTo(-14, -44);
    ctx.lineTo(4, -18);
    ctx.lineTo(24, -44);
    ctx.lineTo(52, -24);
    ctx.lineTo(66, -48);
    ctx.quadraticCurveTo(0, -88, -66, -48);
    ctx.closePath();
    ctx.fill();
  } else if (hairStyle === 'twin_buns' || hairStyle === 'ponytail_high') {
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 5;
    if (hairStyle === 'twin_buns') {
      ctx.beginPath();
      ctx.arc(-62, -78, 22, 0.2, Math.PI - 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(62, -78, 22, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-18, -84);
      ctx.lineTo(14, -84);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawGranularFacialHair(
  ctx: CanvasRenderingContext2D,
  facialHair: FacialHairId,
  hairHex: string
): boolean {
  ctx.save();
  ctx.fillStyle = hairHex;
  switch (facialHair) {
    case 'stubble_5oclock':
      ctx.globalAlpha = 0.28;
      ctx.beginPath();
      ctx.moveTo(-54, 18);
      ctx.quadraticCurveTo(0, 74, 54, 18);
      ctx.quadraticCurveTo(44, 82, 0, 86);
      ctx.quadraticCurveTo(-44, 82, -54, 18);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return true;
    case 'full_viking_beard':
      ctx.beginPath();
      ctx.moveTo(-62, 16);
      ctx.quadraticCurveTo(-68, 92, -24, 146);
      ctx.lineTo(0, 162);
      ctx.lineTo(24, 146);
      ctx.quadraticCurveTo(68, 92, 62, 16);
      ctx.quadraticCurveTo(32, 46, 0, 44);
      ctx.quadraticCurveTo(-32, 46, -62, 16);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return true;
    case 'van_dyke':
      ctx.beginPath();
      ctx.moveTo(-30, 32);
      ctx.quadraticCurveTo(0, 22, 30, 32);
      ctx.quadraticCurveTo(0, 38, -30, 32);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-16, 52);
      ctx.lineTo(16, 52);
      ctx.lineTo(0, 86);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return true;
    case 'mutton_chops':
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * 60, -8);
        ctx.lineTo(s * 66, 48);
        ctx.quadraticCurveTo(s * 42, 64, s * 28, 42);
        ctx.lineTo(s * 46, 4);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      return true;
    case 'soul_patch':
      ctx.beginPath();
      ctx.moveTo(-8, 52);
      ctx.lineTo(8, 52);
      ctx.lineTo(0, 68);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return true;
    case 'braided_dwarf_beard':
      ctx.beginPath();
      ctx.moveTo(-60, 18);
      ctx.lineTo(-42, 134);
      ctx.lineTo(-16, 120);
      ctx.lineTo(0, 152);
      ctx.lineTo(16, 120);
      ctx.lineTo(42, 134);
      ctx.lineTo(60, 18);
      ctx.quadraticCurveTo(0, 48, -60, 18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f2c85b';
      ctx.fillRect(-36, 98, 16, 7);
      ctx.fillRect(20, 98, 16, 7);
      ctx.fillRect(-8, 124, 16, 7);
      ctx.restore();
      return true;
    default:
      ctx.restore();
      return false;
  }
}

// =========================================================================
// 5. GRANULAR EYES, PUPILS, LASHES, HETEROCHROMIA & EYEBROWS (10 Expressions)
// =========================================================================

function drawPupilShape(
  ctx: CanvasRenderingContext2D,
  pupilStyle: PupilStyleId,
  r: number,
  irisColor: string
): void {
  const pr = Math.max(2, r);
  ctx.save();
  switch (pupilStyle) {
    case 'round':
      ctx.fillStyle = '#090b12';
      ctx.beginPath();
      ctx.arc(0, 0, pr, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'slit_cat':
      ctx.fillStyle = '#090b12';
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(1.5, pr * 0.34), pr * 1.45, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'star_sparkle':
      ctx.fillStyle = '#090b12';
      ctx.beginPath();
      ctx.arc(0, 0, pr * 1.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rad = i % 2 === 0 ? pr * 1.15 : pr * 0.42;
        const a = (i * Math.PI) / 4;
        if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
        else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.fill();
      break;
    case 'ring_cyber':
      ctx.strokeStyle = irisColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, pr * 1.25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#090b12';
      ctx.beginPath();
      ctx.arc(0, 0, pr * 0.65, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'crosshair':
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, pr * 1.2, 0, Math.PI * 2);
      ctx.moveTo(-pr * 1.5, 0);
      ctx.lineTo(pr * 1.5, 0);
      ctx.moveTo(0, -pr * 1.5);
      ctx.lineTo(0, pr * 1.5);
      ctx.stroke();
      break;
    case 'blank_glow':
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(0, 0, pr * 1.35, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'spiral_hypno':
      ctx.strokeStyle = '#090b12';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let k = 0; k <= 24; k++) {
        const ang = k * 0.55;
        const rad = (k / 24) * pr * 1.45;
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      break;
    case 'heart_cute':
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.moveTo(0, pr * 0.9);
      ctx.bezierCurveTo(-pr * 1.3, 0, -pr * 0.9, -pr * 1.1, 0, -pr * 0.35);
      ctx.bezierCurveTo(pr * 0.9, -pr * 1.1, pr * 1.3, 0, 0, pr * 0.9);
      ctx.fill();
      break;
  }
  ctx.restore();
}

export function drawGranularEyesLayer(
  ctx: CanvasRenderingContext2D,
  dna: CharacterDNA,
  expression: ExpressionId,
  t: number,
  speechEnergy: number,
  castSeed: number,
  baseEyeX: number,
  baseEyeY: number
): void {
  const fm = resolveFaceMorph(dna);
  const recipe = getExpressionRecipe(expression);
  const pal = dna.palette;
  const eyeX = baseEyeX * fm.eyeSpacing;
  const eyeY = baseEyeY;
  const baseScale =
    (dna.head.eyeStyle === 'wide_fable'
      ? 1.16
      : dna.head.eyeStyle === 'narrow_sharp'
        ? 0.88
        : 1.0) * fm.eyeSize;
  const pupilStyle: PupilStyleId =
    dna.head.pupilStyle || (dna.head.eyeStyle === 'slit_reptile' ? 'slit_cat' : 'round');
  const lashStyle: EyelashStyleId = dna.head.eyelashStyle || 'none';
  const isGlowing = dna.head.eyeStyle === 'glowing_orb' || pupilStyle === 'blank_glow';
  const blink = shouldBlink(t, castSeed, expression);

  for (const side of [-1, 1] as const) {
    const cx = side * eyeX;
    const irisColor = side === 1 && pal.eyeSecondary ? pal.eyeSecondary : pal.eye || pal.accent;
    const rx = Math.max(4, 15.5 * baseScale);
    const ry = Math.max(2, (dna.head.eyeStyle === 'owl_disc' ? 14 : 9.5) * baseScale * recipe.eyeOpen);
    const tilt = side * fm.eyeTilt;

    ctx.save();
    ctx.translate(cx, eyeY);
    ctx.rotate(tilt);

    if (dna.head.eyeStyle === 'owl_disc') {
      ctx.strokeStyle = darken(pal.skin, 0.72);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, rx * 1.38, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (blink) {
      ctx.strokeStyle = '#0c0f1a';
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-rx, 1);
      ctx.quadraticCurveTo(0, 5, rx, 1);
      ctx.stroke();
      ctx.restore();
      continue;
    }

    // Sclera
    ctx.fillStyle = isGlowing ? irisColor : '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Clip iris + pupil inside eye opening
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();

    const irisR = Math.max(3, Math.min(rx, ry) * 0.78);
    if (!isGlowing) {
      ctx.fillStyle = irisColor;
      ctx.beginPath();
      ctx.arc(0, 0, irisR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pupil
    drawPupilShape(ctx, pupilStyle, irisR * 0.56 * recipe.pupilScale, irisColor);

    // Upper eyelid cover for expression & heavy-lidded eye style
    const lidCover = clamp(
      recipe.topLidCover + (dna.head.eyeStyle === 'heavy_lidded' ? 0.24 : 0),
      0,
      0.72
    );
    if (lidCover > 0.02) {
      ctx.fillStyle = darken(pal.skin, 0.8);
      ctx.fillRect(-rx - 2, -ry - 2, (rx + 2) * 2, ry * 2 * lidCover);
    }
    if (recipe.bottomCheekLift > 0.02) {
      ctx.fillStyle = pal.skin;
      ctx.fillRect(-rx - 2, ry - ry * 1.3 * recipe.bottomCheekLift, (rx + 2) * 2, ry * 1.5);
    }

    // Catchlight sparkle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(side * -2.8, -ry * 0.34, Math.max(1.6, irisR * 0.28), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Crisp upper lid line + Eyelashes / Kohl
    ctx.strokeStyle = '#090b12';
    ctx.lineWidth = lashStyle === 'kohl_kajal' ? 3.6 : lashStyle === 'winged_liner' ? 3.2 : 2.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, Math.PI * 1.04, Math.PI * 1.96);
    ctx.stroke();

    if (lashStyle === 'kohl_kajal') {
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, Math.PI * 0.08, Math.PI * 0.92);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(side * rx, 0);
      ctx.lineTo(side * (rx + 6.5), -3);
      ctx.stroke();
    } else if (lashStyle === 'winged_liner') {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(side * (rx - 2), -2);
      ctx.lineTo(side * (rx + 8), -7);
      ctx.stroke();
    } else if (lashStyle === 'natural' || lashStyle === 'dramatic_long') {
      const lashLen = lashStyle === 'dramatic_long' ? 7.5 : 4.2;
      const count = lashStyle === 'dramatic_long' ? 4 : 3;
      ctx.lineWidth = lashStyle === 'dramatic_long' ? 2.1 : 1.5;
      for (let i = 0; i < count; i++) {
        const a = Math.PI * (1.2 + (i / (count - 1)) * 0.65);
        const lx = Math.cos(a) * rx;
        const ly = Math.sin(a) * ry;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + Math.cos(a) * lashLen + side * 1.5, ly + Math.sin(a) * lashLen - 1);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // Extra spider eyes if multi_eyes
  if (dna.head.eyeStyle === 'multi_eyes') {
    ctx.fillStyle = pal.eye || pal.accent;
    for (const [ex, ey, r] of [[-12, -28, 5.5], [12, -28, 5.5], [-42, -24, 4.8], [42, -24, 4.8]]) {
      ctx.beginPath();
      ctx.arc(ex, ey, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Render granular eyebrows unless serpent/arachnid or 'none'
  const suppressBrows =
    dna.head.headShape === 'serpent_hood' || dna.head.headShape === 'arachnid_mandible';
  if (!suppressBrows) {
    drawGranularEyebrowsLayer(ctx, dna, expression, speechEnergy, baseEyeX, baseEyeY);
  }
}

export function drawGranularEyebrowsLayer(
  ctx: CanvasRenderingContext2D,
  dna: CharacterDNA,
  expression: ExpressionId,
  speechEnergy: number,
  baseEyeX: number,
  baseEyeY: number
): void {
  const browStyle: EyebrowStyleId = dna.head.eyebrowStyle || 'natural_arch';
  if (browStyle === 'none') return;

  const fm = resolveFaceMorph(dna);
  const recipe = getExpressionRecipe(expression);
  const browCol = dna.palette.brow || dna.palette.hair || '#111827';
  const eyeX = baseEyeX * fm.eyeSpacing;
  const baseY = baseEyeY - 19 - fm.browHeight * 24 - speechEnergy * 2.2;
  const thick = clamp(4.2 * fm.browThickness, 2, 10);

  ctx.save();
  ctx.strokeStyle = browCol;
  ctx.fillStyle = browCol;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const side of [-1, 1] as const) {
    const isRight = side === 1;
    const bx = side * eyeX;
    const lift = (isRight ? recipe.rightBrowLift : recipe.leftBrowLift) * 1.1;
    const angle = (isRight ? recipe.rightBrowAngle : recipe.leftBrowAngle) * 1.0;

    ctx.save();
    ctx.translate(bx, baseY + lift);
    ctx.rotate(angle);

    switch (browStyle) {
      case 'natural_arch':
        ctx.lineWidth = thick;
        ctx.beginPath();
        ctx.moveTo(-15 * side, 2);
        ctx.quadraticCurveTo(0, -5, 16 * side, 1);
        ctx.stroke();
        break;
      case 'thick_bold':
        ctx.lineWidth = thick * 1.45;
        ctx.beginPath();
        ctx.moveTo(-16 * side, 2);
        ctx.quadraticCurveTo(0, -3.5, 16 * side, 1);
        ctx.stroke();
        break;
      case 'thin_curved':
        ctx.lineWidth = Math.max(1.8, thick * 0.58);
        ctx.beginPath();
        ctx.moveTo(-15 * side, 3);
        ctx.quadraticCurveTo(0, -7, 16 * side, 2);
        ctx.stroke();
        break;
      case 'straight_stoic':
        ctx.lineWidth = thick * 1.1;
        ctx.beginPath();
        ctx.moveTo(-16 * side, 0);
        ctx.lineTo(16 * side, 0);
        ctx.stroke();
        break;
      case 'angled_fierce':
        ctx.lineWidth = thick * 1.15;
        ctx.beginPath();
        ctx.moveTo(-16 * side, 4);
        ctx.lineTo(4 * side, -5);
        ctx.lineTo(17 * side, 2);
        ctx.stroke();
        break;
      case 'high_arched':
        ctx.lineWidth = thick * 0.85;
        ctx.beginPath();
        ctx.moveTo(-15 * side, 4);
        ctx.quadraticCurveTo(2 * side, -11, 16 * side, 2);
        ctx.stroke();
        break;
      case 'bushy_elder':
        ctx.beginPath();
        ctx.moveTo(-17 * side, 4);
        ctx.quadraticCurveTo(-4 * side, -8, 17 * side, 2);
        ctx.quadraticCurveTo(4 * side, 8, -17 * side, 4);
        ctx.closePath();
        ctx.fill();
        break;
      case 'slit_notched':
        ctx.lineWidth = thick * 1.15;
        ctx.beginPath();
        ctx.moveTo(-16 * side, 2);
        ctx.lineTo(4 * side, -2.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(9 * side, -1.5);
        ctx.lineTo(17 * side, 2);
        ctx.stroke();
        break;
      case 'feathered':
        ctx.lineWidth = Math.max(1.6, thick * 0.52);
        for (let f = -2; f <= 2; f++) {
          ctx.beginPath();
          ctx.moveTo((f * 6 - 3) * side, 2 - Math.abs(f) * 0.5);
          ctx.lineTo((f * 6 + 3) * side, -3.5);
          ctx.stroke();
        }
        break;
    }
    ctx.restore();
  }
  ctx.restore();
}

// =========================================================================
// 6. GRANULAR MOUTH & LIPS LAYER (8 Styles + 6 Phonemes 0..5 + 10 Expressions)
// =========================================================================

export function drawGranularMouthLayer(
  ctx: CanvasRenderingContext2D,
  dna: CharacterDNA,
  expression: ExpressionId,
  viseme: number,
  yBase: number
): void {
  const fm = resolveFaceMorph(dna);
  const recipe = getExpressionRecipe(expression);
  const mouthStyle: MouthStyleId = dna.head.mouthStyle || 'classic';
  const lipCol = dna.palette.lip || '#a84b52';
  const ap = clamp(getVisemeAperture(viseme) / 3, 0, 1); // normalized 0..1 across 6 shapes (0..5)
  const vInt = clamp(Math.round(viseme), 0, 5);
  const baseW = (mouthStyle === 'wide_grin' ? 28 : mouthStyle === 'thin_stern' ? 17 : 22) * fm.mouthWidth;
  // Narrow O/U shape for viseme 4, wide E/I for viseme 2
  const shapeW = vInt === 4 ? baseW * 0.58 : vInt === 2 ? baseW * 1.16 : baseW;
  const openH = ap * (vInt === 4 ? 16 : 19) * (expression === 'shocked' ? 1.25 : 1);
  const curve = recipe.mouthCurve * 10;

  ctx.save();
  ctx.translate(0, yBase);

  if (openH > 1.8) {
    // Open talking cavity
    ctx.fillStyle = '#3b0a12';
    ctx.beginPath();
    ctx.ellipse(0, openH * 0.32, Math.max(4, shapeW * 0.82), Math.max(2.5, openH * 0.72), 0, 0, Math.PI * 2);
    ctx.fill();

    // Tongue accent
    ctx.fillStyle = '#be3a4c';
    ctx.beginPath();
    ctx.ellipse(0, openH * 0.65, Math.max(2, shapeW * 0.48), Math.max(1.5, openH * 0.28), 0, 0, Math.PI * 2);
    ctx.fill();

    // Upper teeth bar for classic/wide/full/fangs
    if (mouthStyle !== 'beak_line' && mouthStyle !== 'stitched_gothic') {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-shapeW * 0.58, -openH * 0.12, shapeW * 1.16, Math.min(5, openH * 0.32));
    }

    // Full lips surround when speaking
    if (mouthStyle === 'full_lips') {
      ctx.strokeStyle = lipCol;
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.ellipse(0, openH * 0.32, Math.max(4, shapeW * 0.88), Math.max(2.5, openH * 0.78), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    // Closed expressive mouth
    if (mouthStyle === 'full_lips') {
      ctx.fillStyle = lipCol;
      ctx.beginPath();
      ctx.moveTo(-shapeW, 0);
      ctx.quadraticCurveTo(-shapeW * 0.35, -7 + curve * 0.2, 0, -4 + curve * 0.2);
      ctx.quadraticCurveTo(shapeW * 0.35, -7 + curve * 0.2, shapeW, 0);
      ctx.quadraticCurveTo(0, 10 + curve * 0.7, -shapeW, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1f1014';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-shapeW, 0);
      ctx.quadraticCurveTo(0, curve * 0.65, shapeW, 0);
      ctx.stroke();
    } else if (mouthStyle === 'beak_line') {
      ctx.strokeStyle = '#141724';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-shapeW * 0.9, 2);
      ctx.lineTo(0, -4 + curve * 0.25);
      ctx.lineTo(shapeW * 0.9, 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = mouthStyle === 'thin_stern' ? '#0f121d' : darken(lipCol, 0.45);
      ctx.lineWidth = mouthStyle === 'thin_stern' ? 2.2 : 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-shapeW, 0);
      ctx.quadraticCurveTo(0, curve, shapeW, 0);
      ctx.stroke();
    }
  }

  // Signature mouth overlays (persist across both closed & open viseme states!)
  if (mouthStyle === 'fangs_vampire') {
    ctx.fillStyle = '#ffffff';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * (shapeW * 0.48), -1);
      ctx.lineTo(s * (shapeW * 0.64), -1);
      ctx.lineTo(s * (shapeW * 0.56), 9 + openH * 0.2);
      ctx.closePath();
      ctx.fill();
    }
  } else if (mouthStyle === 'tusks_boar') {
    ctx.fillStyle = '#fef3c7';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * (shapeW * 0.52), 4 + openH * 0.4);
      ctx.lineTo(s * (shapeW * 0.78), 4 + openH * 0.4);
      ctx.lineTo(s * (shapeW * 0.74), -11);
      ctx.closePath();
      ctx.fill();
    }
  } else if (mouthStyle === 'stitched_gothic') {
    ctx.strokeStyle = '#090b12';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      const sx = i * (shapeW * 0.36);
      ctx.beginPath();
      ctx.moveTo(sx, -5);
      ctx.lineTo(sx, 6 + openH * 0.3);
      ctx.stroke();
    }
  }

  ctx.restore();
}

// =========================================================================
// 7. GRANULAR FACE MARKS (+12 New -> 22 Total, Primary + Secondary + Blush)
// =========================================================================

function drawSingleNewFaceMark(
  ctx: CanvasRenderingContext2D,
  mark: FaceMarkId,
  tint: string,
  skinHex: string
): boolean {
  if (mark === 'none') return true;
  ctx.save();
  switch (mark) {
    case 'nose_bridge_scar':
      ctx.strokeStyle = tint;
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-14, 4);
      ctx.lineTo(14, 9);
      ctx.stroke();
      ctx.restore();
      return true;
    case 'brow_slash_scar':
      ctx.strokeStyle = tint;
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(22, -38);
      ctx.lineTo(36, 12);
      ctx.stroke();
      ctx.restore();
      return true;
    case 'beauty_mole':
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(28, 24, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return true;
    case 'vitiligo_patch':
      ctx.fillStyle = lighten(skinHex, 0.48);
      ctx.globalAlpha = 0.78;
      ctx.beginPath();
      ctx.ellipse(-28, 12, 18, 14, -0.25, 0, Math.PI * 2);
      ctx.ellipse(-18, -22, 12, 9, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return true;
    case 'cyber_cheek_circuit':
      ctx.strokeStyle = tint || '#22d3ee';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(52, 8);
      ctx.lineTo(34, 16);
      ctx.lineTo(24, 16);
      ctx.moveTo(50, 22);
      ctx.lineTo(32, 26);
      ctx.stroke();
      ctx.fillStyle = tint || '#22d3ee';
      ctx.beginPath();
      ctx.arc(24, 16, 3.2, 0, Math.PI * 2);
      ctx.arc(32, 26, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return true;
    case 'tear_tattoos':
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-28, 8);
      ctx.quadraticCurveTo(-33, 18, -28, 22);
      ctx.quadraticCurveTo(-23, 18, -28, 8);
      ctx.fill();
      ctx.restore();
      return true;
    case 'star_freckles':
      ctx.fillStyle = tint || '#fef08a';
      for (const [sx, sy] of [[-32, 12], [-22, 16], [-38, 18], [32, 12], [22, 16], [38, 18]]) {
        ctx.beginPath();
        ctx.arc(sx, sy, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return true;
    case 'glow_runes':
      ctx.strokeStyle = tint || '#a855f7';
      ctx.lineWidth = 2.6;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * 34, 6);
        ctx.lineTo(s * 42, 16);
        ctx.lineTo(s * 34, 26);
        ctx.lineTo(s * 26, 16);
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
      return true;
    case 'nose_bandage':
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(-22, 1, 44, 14, 4);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-7, 2, 14, 12);
      ctx.restore();
      return true;
    case 'clown_diamond':
      ctx.fillStyle = tint || '#dc2626';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * 28, -24);
        ctx.lineTo(s * 35, -15);
        ctx.lineTo(s * 28, -6);
        ctx.lineTo(s * 21, -15);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s * 28, 4);
        ctx.lineTo(s * 35, 14);
        ctx.lineTo(s * 28, 24);
        ctx.lineTo(s * 21, 14);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      return true;
    case 'gold_leaf_forehead':
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(0, -52);
      ctx.lineTo(14, -36);
      ctx.lineTo(0, -24);
      ctx.lineTo(-14, -36);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-24, -36);
      ctx.lineTo(24, -36);
      ctx.stroke();
      ctx.restore();
      return true;
    case 'dark_undereye':
      ctx.fillStyle = 'rgba(30, 27, 75, 0.34)';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(s * 28, 4, 15, 6, 0, 0, Math.PI);
        ctx.fill();
      }
      ctx.restore();
      return true;
    default:
      ctx.restore();
      return false;
  }
}

export function drawGranularFaceMarksLayer(
  ctx: CanvasRenderingContext2D,
  dna: CharacterDNA,
  legacyDrawer: (ctx: CanvasRenderingContext2D, mark: FaceMarkId, accent: string) => void
): void {
  const pal = dna.palette;
  const tint = pal.markTint || pal.accent;

  // Soft cheek blush
  const blush = clamp(dna.head.blushIntensity ?? 0, 0, 1);
  if (blush > 0.02) {
    ctx.save();
    ctx.fillStyle = `rgba(244, 114, 134, ${(blush * 0.45).toFixed(3)})`;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(s * 34, 16, 16, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  const marks: FaceMarkId[] = [dna.head.faceMark];
  if (dna.head.secondaryFaceMark && dna.head.secondaryFaceMark !== 'none' && dna.head.secondaryFaceMark !== dna.head.faceMark) {
    marks.push(dna.head.secondaryFaceMark);
  }

  for (const m of marks) {
    if (m === 'none') continue;
    const handled = drawSingleNewFaceMark(ctx, m, tint, pal.skin);
    if (!handled) {
      legacyDrawer(ctx, m, tint);
    }
  }
}

// =========================================================================
// 8. 5-SLOT COMBINABLE ACCESSORIES (Eyewear, Ear/Face Jewelry, Neckwear, Wristwear)
// =========================================================================

export function drawEyewearLayer(
  ctx: CanvasRenderingContext2D,
  eyewear: EyewearStyleId | undefined,
  pal: CharacterPaletteSpec,
  eyeX: number,
  eyeY: number,
  eyeScale: number
): void {
  if (!eyewear || eyewear === 'none') return;
  const r = Math.max(12, 18 * eyeScale);
  ctx.save();
  ctx.translate(0, eyeY);
  switch (eyewear) {
    case 'round_scholar':
      ctx.strokeStyle = pal.accent || '#d97706';
      ctx.lineWidth = 3.2;
      ctx.fillStyle = 'rgba(226, 232, 240, 0.16)';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(s * eyeX, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-eyeX + r, 0);
      ctx.lineTo(eyeX - r, 0);
      ctx.stroke();
      break;
    case 'rectangular_modern':
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3.6;
      ctx.fillStyle = 'rgba(186, 230, 253, 0.16)';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.roundRect(s * eyeX - r * 1.05, -r * 0.65, r * 2.1, r * 1.3, 4);
        ctx.fill();
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-eyeX + r * 1.05, -2);
      ctx.lineTo(eyeX - r * 1.05, -2);
      ctx.stroke();
      break;
    case 'aviator_shades':
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * (eyeX - r), -r * 0.65);
        ctx.lineTo(s * (eyeX + r), -r * 0.65);
        ctx.quadraticCurveTo(s * (eyeX + r), r * 0.95, s * eyeX, r * 0.95);
        ctx.quadraticCurveTo(s * (eyeX - r), r * 0.95, s * (eyeX - r), -r * 0.65);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-eyeX + r * 0.7, -r * 0.6);
      ctx.lineTo(eyeX - r * 0.7, -r * 0.6);
      ctx.stroke();
      break;
    case 'cat_eye_chic':
      ctx.strokeStyle = pal.primary;
      ctx.lineWidth = 3.8;
      ctx.fillStyle = 'rgba(244, 114, 182, 0.22)';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * (eyeX - r * 0.9), -r * 0.4);
        ctx.lineTo(s * (eyeX + r * 1.25), -r * 0.95);
        ctx.quadraticCurveTo(s * (eyeX + r * 0.9), r * 0.8, s * eyeX, r * 0.75);
        ctx.quadraticCurveTo(s * (eyeX - r), r * 0.65, s * (eyeX - r * 0.9), -r * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      break;
    case 'monocle_brass':
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3.6;
      ctx.fillStyle = 'rgba(254, 240, 138, 0.18)';
      ctx.beginPath();
      ctx.arc(eyeX, 0, r * 1.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(eyeX + r, 4);
      ctx.quadraticCurveTo(eyeX + r + 14, 34, eyeX + 6, 68);
      ctx.stroke();
      break;
    case 'steampunk_goggles':
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-68, -6, 136, 12);
      for (const s of [-1, 1]) {
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(s * eyeX, 0, r * 1.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(103, 232, 249, 0.55)';
        ctx.beginPath();
        ctx.arc(s * eyeX, 0, r * 0.82, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'cyber_holo_visor':
      ctx.fillStyle = 'rgba(34, 211, 238, 0.58)';
      ctx.beginPath();
      ctx.moveTo(-64, -12);
      ctx.lineTo(64, -12);
      ctx.lineTo(54, 14);
      ctx.lineTo(0, 8);
      ctx.lineTo(-54, 14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 2.6;
      ctx.stroke();
      break;
    case 'tactical_hud':
      ctx.fillStyle = 'rgba(16, 185, 129, 0.42)';
      ctx.beginPath();
      ctx.roundRect(eyeX - r * 1.1, -r * 0.72, r * 2.3, r * 1.4, 4);
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      break;
    case 'heart_shades':
      ctx.fillStyle = 'rgba(236, 72, 153, 0.78)';
      ctx.strokeStyle = '#fdf2f8';
      ctx.lineWidth = 2.6;
      for (const s of [-1, 1]) {
        ctx.save();
        ctx.translate(s * eyeX, 0);
        ctx.beginPath();
        ctx.moveTo(0, r * 0.95);
        ctx.bezierCurveTo(-r * 1.35, 0, -r * 0.9, -r * 1.05, 0, -r * 0.3);
        ctx.bezierCurveTo(r * 0.9, -r * 1.05, r * 1.35, 0, 0, r * 0.95);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      break;
    case 'pirate_eyepatch':
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(-66, -24);
      ctx.lineTo(66, 16);
      ctx.stroke();
      ctx.fillStyle = '#090b12';
      ctx.beginPath();
      ctx.ellipse(-eyeX, 0, r * 1.05, r * 0.88, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'blindfold_mystic':
      ctx.fillStyle = pal.primary;
      ctx.beginPath();
      ctx.roundRect(-72, -16, 144, 32, 4);
      ctx.fill();
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-70, 0);
      ctx.lineTo(70, 0);
      ctx.stroke();
      break;
  }
  ctx.restore();
}

export function drawEarAndFaceJewelryLayer(
  ctx: CanvasRenderingContext2D,
  earJewelry: EarJewelryId | undefined,
  pal: CharacterPaletteSpec,
  earScale = 1,
  noseScale = 1
): void {
  if (!earJewelry || earJewelry === 'none') return;
  const ex = 66 * clamp(earScale, 0.7, 1.4);
  const gold = pal.accent || '#facc15';
  ctx.save();
  switch (earJewelry) {
    case 'gold_studs':
      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.arc(-ex, 16, 4.5, 0, Math.PI * 2);
      ctx.arc(ex, 16, 4.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'hoop_earrings':
      ctx.strokeStyle = gold;
      ctx.lineWidth = 3.2;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(s * ex, 24, 11, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    case 'royal_jhumkas':
      ctx.fillStyle = gold;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(s * ex, 16, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s * ex, 20);
        ctx.lineTo(s * (ex + 9), 34);
        ctx.lineTo(s * (ex - 9), 34);
        ctx.closePath();
        ctx.fill();
      }
      break;
    case 'feather_drop':
      for (const s of [-1, 1]) {
        ctx.fillStyle = pal.primary;
        ctx.beginPath();
        ctx.ellipse(s * ex, 30, 5.5, 14, s * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = gold;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(s * ex, 16);
        ctx.lineTo(s * ex, 42);
        ctx.stroke();
      }
      break;
    case 'elf_ear_cuffs':
      ctx.strokeStyle = gold;
      ctx.lineWidth = 4;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(s * ex, 2, 10, -Math.PI * 0.4, Math.PI * 0.5);
        ctx.stroke();
      }
      break;
    case 'cyber_comms_earpiece':
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(ex - 7, -2, 14, 24, 4);
      ctx.fill();
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(ex, 6, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(ex - 2, 18);
      ctx.quadraticCurveTo(ex - 16, 36, 26, 40);
      ctx.stroke();
      break;
    case 'nose_ring_nath':
      ctx.strokeStyle = gold;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(10 * noseScale, 18 * noseScale, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(19 * noseScale, 18 * noseScale);
      ctx.quadraticCurveTo(42, 24, ex, 14);
      ctx.stroke();
      break;
    case 'brow_piercing':
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(40, -32, 3, 0, Math.PI * 2);
      ctx.arc(44, -22, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  ctx.restore();
}

export function drawNeckwearLayer(
  ctx: CanvasRenderingContext2D,
  neckwear: NeckwearStyleId | undefined,
  pal: CharacterPaletteSpec,
  isCloseUp: boolean,
  torsoTopY = -120,
  chestW = 24
): void {
  if (!neckwear || neckwear === 'none') return;
  ctx.save();
  if (isCloseUp) {
    const y0 = 76;
    switch (neckwear) {
      case 'locket_pendant':
      case 'crystal_amulet_chain':
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, y0 - 8, 52, 0.25, Math.PI - 0.25);
        ctx.stroke();
        ctx.fillStyle = neckwear === 'crystal_amulet_chain' ? '#22d3ee' : '#facc15';
        ctx.beginPath();
        if (neckwear === 'crystal_amulet_chain') {
          ctx.moveTo(0, y0 + 30);
          ctx.lineTo(12, y0 + 48);
          ctx.lineTo(0, y0 + 66);
          ctx.lineTo(-12, y0 + 48);
          ctx.closePath();
        } else {
          ctx.arc(0, y0 + 48, 12, 0, Math.PI * 2);
        }
        ctx.fill();
        break;
      case 'choker_velvet':
        ctx.fillStyle = '#18181b';
        ctx.fillRect(-44, y0 - 12, 88, 16);
        ctx.fillStyle = pal.accent;
        ctx.beginPath();
        ctx.arc(0, y0 - 4, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'dog_tags':
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, y0, 40, 0.3, Math.PI - 0.3);
        ctx.stroke();
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-10, y0 + 36, 12, 18);
        ctx.fillRect(-2, y0 + 40, 12, 18);
        break;
      case 'tie_necktie':
        ctx.fillStyle = pal.accent;
        ctx.beginPath();
        ctx.moveTo(-12, y0);
        ctx.lineTo(12, y0);
        ctx.lineTo(18, y0 + 96);
        ctx.lineTo(0, y0 + 116);
        ctx.lineTo(-18, y0 + 96);
        ctx.closePath();
        ctx.fill();
        break;
      case 'bow_tie':
        ctx.fillStyle = pal.accent;
        ctx.beginPath();
        ctx.moveTo(0, y0 + 8);
        ctx.lineTo(-28, y0 - 6);
        ctx.lineTo(-28, y0 + 22);
        ctx.closePath();
        ctx.moveTo(0, y0 + 8);
        ctx.lineTo(28, y0 - 6);
        ctx.lineTo(28, y0 + 22);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = darken(pal.accent, 0.72);
        ctx.beginPath();
        ctx.arc(0, y0 + 8, 7, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'pearl_strand':
        ctx.fillStyle = '#f8fafc';
        for (let i = -4; i <= 4; i++) {
          ctx.beginPath();
          ctx.arc(i * 12, y0 + 22 - Math.abs(i) * 3.5, 6.2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'stethoscope_drape':
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(-48, y0 + 80);
        ctx.quadraticCurveTo(-56, y0 - 10, 0, y0 - 12);
        ctx.quadraticCurveTo(56, y0 - 10, 48, y0 + 80);
        ctx.stroke();
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(48, y0 + 86, 12, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'scarf_bandana':
        ctx.fillStyle = pal.accent;
        ctx.beginPath();
        ctx.moveTo(-66, y0 - 6);
        ctx.lineTo(66, y0 - 6);
        ctx.lineTo(0, y0 + 58);
        ctx.closePath();
        ctx.fill();
        break;
    }
  } else {
    // Full-body neckwear scale
    const y0 = torsoTopY + 3;
    switch (neckwear) {
      case 'locket_pendant':
      case 'crystal_amulet_chain':
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, y0, 12, 0.25, Math.PI - 0.25);
        ctx.stroke();
        ctx.fillStyle = neckwear === 'crystal_amulet_chain' ? '#22d3ee' : '#facc15';
        ctx.beginPath();
        ctx.arc(0, y0 + 13, 3.6, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'choker_velvet':
        ctx.fillStyle = '#18181b';
        ctx.fillRect(-9, y0 - 4, 18, 4);
        break;
      case 'dog_tags':
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-3, y0 + 9, 4, 6);
        ctx.fillRect(0, y0 + 11, 4, 6);
        break;
      case 'tie_necktie':
        ctx.fillStyle = pal.accent;
        ctx.beginPath();
        ctx.moveTo(-3, y0);
        ctx.lineTo(3, y0);
        ctx.lineTo(5, y0 + 26);
        ctx.lineTo(0, y0 + 32);
        ctx.lineTo(-5, y0 + 26);
        ctx.closePath();
        ctx.fill();
        break;
      case 'bow_tie':
        ctx.fillStyle = pal.accent;
        ctx.beginPath();
        ctx.moveTo(0, y0 + 2);
        ctx.lineTo(-8, y0 - 2);
        ctx.lineTo(-8, y0 + 6);
        ctx.closePath();
        ctx.moveTo(0, y0 + 2);
        ctx.lineTo(8, y0 - 2);
        ctx.lineTo(8, y0 + 6);
        ctx.closePath();
        ctx.fill();
        break;
      case 'pearl_strand':
        ctx.fillStyle = '#f8fafc';
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.arc(i * 3.8, y0 + 7 - Math.abs(i) * 1.1, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'stethoscope_drape':
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-chestW * 0.55, y0 + 22);
        ctx.quadraticCurveTo(-chestW * 0.58, y0 - 2, 0, y0 - 2);
        ctx.quadraticCurveTo(chestW * 0.58, y0 - 2, chestW * 0.55, y0 + 22);
        ctx.stroke();
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(chestW * 0.55, y0 + 24, 3.6, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'scarf_bandana':
        ctx.fillStyle = pal.accent;
        ctx.beginPath();
        ctx.moveTo(-chestW * 0.65, y0);
        ctx.lineTo(chestW * 0.65, y0);
        ctx.lineTo(0, y0 + 18);
        ctx.closePath();
        ctx.fill();
        break;
    }
  }
  ctx.restore();
}

export function drawWristwearLayer(
  ctx: CanvasRenderingContext2D,
  wristwear: WristwearStyleId | undefined,
  pal: CharacterPaletteSpec,
  forearmLen: number
): void {
  if (!wristwear || wristwear === 'none') return;
  const wy = forearmLen - 7;
  ctx.save();
  switch (wristwear) {
    case 'smartwatch':
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-5, wy, 10, 4.5);
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(-2.5, wy + 0.8, 5, 3);
      break;
    case 'gold_kadas':
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-5.2, wy - 1, 10.4, 3);
      ctx.fillRect(-5.2, wy + 3, 10.4, 2.5);
      break;
    case 'leather_bracers':
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(-5.4, wy - 7, 10.8, 12);
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-5.4, wy - 7, 10.8, 12);
      break;
    case 'spiked_cuffs':
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-5.2, wy - 1, 10.4, 5.5);
      ctx.fillStyle = '#e2e8f0';
      for (const sx of [-4, 0, 4]) {
        ctx.beginPath();
        ctx.arc(sx, wy + 1.8, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'bead_bracelets':
      ctx.fillStyle = pal.accent;
      for (const sx of [-3.5, 0, 3.5]) {
        ctx.beginPath();
        ctx.arc(sx, wy + 1.5, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'holo_wristpad':
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-5.5, wy - 6, 11, 10);
      ctx.fillStyle = 'rgba(34, 211, 238, 0.78)';
      ctx.fillRect(-4, wy - 4.5, 8, 6);
      break;
  }
  ctx.restore();
}

/**
 * Convenience resolver used by modularEntityRenderer to check whether a DNA
 * object has any Wave 7 granular overrides active.
 */
export function hasGranularFaceOverrides(dna: CharacterDNA): boolean {
  const acc = resolveAccessories(dna);
  return Boolean(
    dna.faceMorph ||
      dna.head.eyebrowStyle ||
      dna.head.pupilStyle ||
      dna.head.eyelashStyle ||
      dna.head.mouthStyle ||
      dna.head.secondaryFaceMark ||
      (dna.head.blushIntensity && dna.head.blushIntensity > 0) ||
      dna.palette.eyeSecondary ||
      dna.palette.lip ||
      dna.palette.brow ||
      dna.palette.markTint ||
      acc.eyewear !== 'none' ||
      acc.earJewelry !== 'none' ||
      acc.neckwear !== 'none'
  );
}
