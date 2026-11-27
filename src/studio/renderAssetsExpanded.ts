/**
 * Katha Studio — Expanded Bold Chiaroscuro Assets
 * Adds 6 iconic Indian stages, 10 expressive cast archetypes (including full Indian fable fauna),
 * and 8 deterministic animated storytelling props in matching lineless graphic-novel chiaroscuro.
 */
import {
  ArchetypeId,
  CastMember,
  ExpressionId,
  PoseId,
  PropId,
  StageId,
} from './types';
import { MoodPalette, snap24 } from './renderAssets';
import {
  drawUnifiedEyePair,
  drawUnifiedMouth,
  getExpressionHeadTilt,
  getVisemeAperture,
} from './facialExpressions';

function darkenHex(hex: string, factor = 0.55): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#151a2e';
  const r = Math.round(parseInt(clean.slice(0, 2), 16) * factor);
  const g = Math.round(parseInt(clean.slice(2, 4), 16) * factor);
  const b = Math.round(parseInt(clean.slice(4, 6), 16) * factor);
  return `rgb(${r},${g},${b})`;
}

// =========================================================================
// 1. EXPANDED GRAPHIC-NOVEL STAGES (6 NEW STAGES)
// =========================================================================
export function drawExpandedStageBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stage: StageId,
  pal: MoodPalette,
  t: number
): boolean {
  const s = Math.min(w, h) / 620;
  const ts = snap24(t);

  if (stage === 'mughal_courtyard') {
    // Fatehpur-inspired Mughal sandstone arched colonnade + reflecting courtyard pool
    ctx.fillStyle = pal.farSil;
    ctx.fillRect(0, h * 0.2, w, h * 0.54);

    // Three grand pointed cusped Mughal arches opening onto night sky
    const archCenters = [0.2, 0.5, 0.8];
    for (const ac of archCenters) {
      const cx = w * ac;
      const aw = w * 0.22;
      ctx.fillStyle = pal.skyMid;
      ctx.beginPath();
      ctx.moveTo(cx - aw * 0.5, h * 0.72);
      ctx.lineTo(cx - aw * 0.5, h * 0.36);
      ctx.quadraticCurveTo(cx - aw * 0.28, h * 0.24, cx, h * 0.21);
      ctx.quadraticCurveTo(cx + aw * 0.28, h * 0.24, cx + aw * 0.5, h * 0.36);
      ctx.lineTo(cx + aw * 0.5, h * 0.72);
      ctx.closePath();
      ctx.fill();

      // Golden arch trim rim
      ctx.strokeStyle = pal.rimLight;
      ctx.lineWidth = 3 * s;
      ctx.stroke();

      // Hanging brass Mughal lantern inside arch
      ctx.fillStyle = '#0c080a';
      ctx.fillRect(cx - 1.5 * s, h * 0.21, 3 * s, 44 * s);
      ctx.fillStyle = '#ffd15c';
      ctx.beginPath();
      ctx.moveTo(cx, h * 0.21 + 42 * s);
      ctx.lineTo(cx + 11 * s, h * 0.21 + 58 * s);
      ctx.lineTo(cx, h * 0.21 + 74 * s);
      ctx.lineTo(cx - 11 * s, h * 0.21 + 58 * s);
      ctx.closePath();
      ctx.fill();
    }

    // Courtyard sandstone deck + central reflecting channel
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = pal.path;
    ctx.fillRect(0, h * 0.72, w, 10 * s);
    ctx.fillStyle = '#0d2236';
    ctx.beginPath();
    ctx.moveTo(w * 0.34, h * 0.78);
    ctx.lineTo(w * 0.66, h * 0.78);
    ctx.lineTo(w * 0.76, h);
    ctx.lineTo(w * 0.24, h);
    ctx.closePath();
    ctx.fill();
    // Pool shimmer
    ctx.fillStyle = 'rgba(255, 214, 107, 0.35)';
    for (let i = 0; i < 4; i++) {
      const sw = (72 - i * 10) * s;
      ctx.fillRect(w * 0.5 - sw / 2 + Math.sin(ts * 2.5 + i) * 8 * s, h * (0.82 + i * 0.042), sw, 3 * s);
    }
    return true;
  }

  if (stage === 'throne_mound') {
    // Singhasan Battisi: Ancient overgrown earthen mound revealing gleaming golden throne steps
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.76);
    ctx.lineTo(w * 0.24, h * 0.44);
    ctx.lineTo(w * 0.5, h * 0.38);
    ctx.lineTo(w * 0.76, h * 0.44);
    ctx.lineTo(w, h * 0.76);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Radiating golden aura emerging from the buried dais (breathing harmonic pulse)
    const auraPulse = 0.85 + 0.15 * Math.sin(ts * 3.1);
    const grad = ctx.createRadialGradient(
      w * 0.5,
      h * 0.52,
      16 * s,
      w * 0.5,
      h * 0.52,
      (224 + Math.sin(ts * 2.2) * 18) * s
    );
    grad.addColorStop(0, `rgba(255, 216, 92, ${(0.34 * auraPulse).toFixed(3)})`);
    grad.addColorStop(1, 'rgba(255, 216, 92, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Rising sacred golden dust motes around the buried throne
    ctx.fillStyle = 'rgba(255, 224, 120, 0.55)';
    for (let m = 0; m < 10; m++) {
      const mx = w * (0.28 + ((m * 0.097) % 0.44)) + Math.sin(ts * 1.8 + m * 1.7) * 14 * s;
      const my = h * 0.72 - (((ts * 26 + m * 31) % 190) * s);
      const mr = (1.6 + (m % 3) * 0.9) * s;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Carved stepped golden staircase ascending the center of the mound
    for (let i = 0; i < 5; i++) {
      const sw = (260 - i * 32) * s;
      const sy = h * 0.74 - i * 24 * s;
      ctx.fillStyle = i % 2 === 0 ? '#d99a26' : '#f5c84c';
      ctx.fillRect(w * 0.5 - sw / 2, sy, sw, 18 * s);
      ctx.fillStyle = '#5c360d';
      ctx.fillRect(w * 0.5 - sw / 2, sy + 14 * s, sw, 5 * s);
      // Glint sweeping up the golden steps
      const glintU = (ts * 0.7 + i * 0.19) % 1;
      ctx.fillStyle = 'rgba(255, 248, 196, 0.42)';
      ctx.fillRect(w * 0.5 - sw / 2 + glintU * (sw - 26 * s), sy + 2 * s, 26 * s, 4 * s);
    }

    // Flanking stone pillars with tiny golden statue silhouettes
    for (const side of [-1, 1]) {
      const px = w * 0.5 + side * 168 * s;
      ctx.fillStyle = '#120d17';
      ctx.fillRect(px - 18 * s, h * 0.48, 36 * s, h * 0.28);
      const statGlow = 0.75 + 0.25 * Math.sin(ts * 4.2 + side);
      ctx.fillStyle = `rgba(255, 210, 77, ${(0.22 * statGlow).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(px, h * 0.48, 28 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd24d';
      ctx.beginPath();
      ctx.arc(px, h * 0.45, 11 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(px - 8 * s, h * 0.46, 16 * s, 26 * s);
    }

    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.74, w, h * 0.26);
    return true;
  }

  if (stage === 'palace_garden') {
    // Moonlit Indian royal cypress & mango orchard with lantern-lit stone walkway
    const cypresses = [0.08, 0.19, 0.81, 0.92];
    for (const cx of cypresses) {
      const x = w * cx;
      ctx.fillStyle = pal.farSil;
      ctx.beginPath();
      ctx.moveTo(x - 32 * s, h * 0.74);
      ctx.quadraticCurveTo(x - 28 * s, h * 0.36, x, h * 0.2);
      ctx.quadraticCurveTo(x + 28 * s, h * 0.36, x + 32 * s, h * 0.74);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = pal.rimLight;
      ctx.fillRect(x - 2 * s, h * 0.24, 3 * s, h * 0.44);
    }

    // Carved marble pavilion silhouette in center background
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.46, 56 * s, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(w * 0.5 - 64 * s, h * 0.46, 128 * s, 10 * s);
    ctx.fillRect(w * 0.5 - 52 * s, h * 0.46, 12 * s, h * 0.26);
    ctx.fillRect(w * 0.5 + 40 * s, h * 0.46, 12 * s, h * 0.26);

    // Festoon of glowing garden lanterns swaying gently
    ctx.strokeStyle = '#0b0e1c';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(w * 0.16, h * 0.26);
    ctx.quadraticCurveTo(w * 0.5, h * 0.38, w * 0.84, h * 0.26);
    ctx.stroke();
    for (let i = 1; i <= 5; i++) {
      const u = i / 6;
      const lx = w * (0.16 + 0.68 * u);
      const ly = h * (0.26 + Math.sin(u * Math.PI) * 0.06);
      const flick = 0.9 + 0.1 * Math.sin(ts * 10 + i);
      ctx.fillStyle = '#ffd15c';
      ctx.beginPath();
      ctx.arc(lx, ly + 8 * s, 7 * s * flick, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = pal.path;
    ctx.beginPath();
    ctx.moveTo(w * 0.36, h * 0.72);
    ctx.lineTo(w * 0.64, h * 0.72);
    ctx.lineTo(w * 0.82, h);
    ctx.lineTo(w * 0.18, h);
    ctx.closePath();
    ctx.fill();
    return true;
  }

  if (stage === 'enchanted_lake') {
    // Yaksha Prashna / Hitopadesha: Luminous sacred forest lake ringed by monolithic boulders & lotuses
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.62);
    ctx.lineTo(w * 0.18, h * 0.48);
    ctx.lineTo(w * 0.38, h * 0.58);
    ctx.lineTo(w * 0.66, h * 0.5);
    ctx.lineTo(w * 0.86, h * 0.45);
    ctx.lineTo(w, h * 0.6);
    ctx.lineTo(w, h * 0.72);
    ctx.lineTo(0, h * 0.72);
    ctx.closePath();
    ctx.fill();

    // Still mystic mirror lake
    ctx.fillStyle = '#07222e';
    ctx.fillRect(0, h * 0.62, w, h * 0.38);

    // Concentric glowing cyan ripples
    ctx.strokeStyle = 'rgba(110, 242, 255, 0.28)';
    ctx.lineWidth = 2.5 * s;
    for (let i = 0; i < 4; i++) {
      const r = ((ts * 32 + i * 55) % 210) * s;
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.74, r * 1.6, r * 0.32, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Floating emerald lotus pads & pink blossoms gently bobbing on the water
    const lotuses: [number, number][] = [
      [0.24, 0.74],
      [0.74, 0.72],
      [0.62, 0.82],
    ];
    for (let li = 0; li < lotuses.length; li++) {
      const [lx, ly] = lotuses[li];
      const bobY = Math.sin(ts * 2.1 + li * 2.1) * 2.5 * s;
      const driftX = Math.cos(ts * 1.1 + li * 1.7) * 3.5 * s;
      ctx.fillStyle = '#145946';
      ctx.beginPath();
      ctx.ellipse(w * lx + driftX, h * ly + bobY, 34 * s, 9 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff4d94';
      ctx.beginPath();
      ctx.moveTo(w * lx + driftX - 12 * s, h * ly + bobY - 2 * s);
      ctx.lineTo(w * lx + driftX, h * ly + bobY - 16 * s);
      ctx.lineTo(w * lx + driftX + 12 * s, h * ly + bobY - 2 * s);
      ctx.closePath();
      ctx.fill();
    }

    // Foreground shore banks left & right
    ctx.fillStyle = pal.ground;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.72);
    ctx.lineTo(w * 0.3, h * 0.78);
    ctx.lineTo(w * 0.22, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w, h * 0.72);
    ctx.lineTo(w * 0.7, h * 0.78);
    ctx.lineTo(w * 0.78, h);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    return true;
  }

  if (stage === 'himalayan_hermitage') {
    // Jagged snow-lit Himalayan peaks + tall cedar pines + ashram stone terrace
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.68);
    ctx.lineTo(w * 0.2, h * 0.26);
    ctx.lineTo(w * 0.38, h * 0.56);
    ctx.lineTo(w * 0.56, h * 0.22);
    ctx.lineTo(w * 0.78, h * 0.52);
    ctx.lineTo(w * 0.92, h * 0.3);
    ctx.lineTo(w, h * 0.62);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Crisp illuminated snow facets on right slopes
    ctx.fillStyle = pal.rimLight;
    for (const [px, py] of [
      [0.2, 0.26],
      [0.56, 0.22],
      [0.92, 0.3],
    ]) {
      ctx.beginPath();
      ctx.moveTo(w * px, h * py);
      ctx.lineTo(w * (px + 0.055), h * (py + 0.14));
      ctx.lineTo(w * (px + 0.01), h * (py + 0.11));
      ctx.closePath();
      ctx.fill();
    }

    // Drifting Himalayan valley cloud veil & fluttering mountain prayer flags
    const cloudDrift = (ts * 14) % (w * 0.45);
    ctx.fillStyle = 'rgba(232, 242, 255, 0.14)';
    for (let c = -1; c < 4; c++) {
      const cx = c * w * 0.36 + cloudDrift;
      ctx.beginPath();
      ctx.ellipse(cx, h * 0.56 + Math.sin(ts * 0.8 + c) * 5 * s, 140 * s, 26 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pine silhouettes framing edges (swaying gently in alpine wind)
    const pines = [0.09, 0.16, 0.85, 0.93];
    for (let pi = 0; pi < pines.length; pi++) {
      const tx = pines[pi];
      const x = w * tx;
      const tipSway = Math.sin(ts * 1.9 + pi * 1.4) * 5 * s;
      ctx.fillStyle = '#070c18';
      ctx.beginPath();
      ctx.moveTo(x + tipSway, h * 0.38);
      ctx.lineTo(x + 28 * s, h * 0.74);
      ctx.lineTo(x - 28 * s, h * 0.74);
      ctx.closePath();
      ctx.fill();
    }

    // Fluttering Himalayan prayer-flag cord strung across left pine to center
    const flagColors = ['#e63946', '#ffd166', '#2a9d8f', '#f4f1de', '#457b9d'];
    ctx.strokeStyle = 'rgba(240, 232, 210, 0.45)';
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath();
    ctx.moveTo(w * 0.14, h * 0.46);
    ctx.quadraticCurveTo(w * 0.5, h * 0.55, w * 0.86, h * 0.45);
    ctx.stroke();
    for (let f = 1; f <= 7; f++) {
      const fu = f / 8;
      const fx = w * (0.14 + 0.72 * fu);
      const fy = h * (0.46 - 0.01 * fu + Math.sin(fu * Math.PI) * 0.045);
      const flutter = Math.sin(ts * 7.5 + f * 1.3) * 4 * s;
      ctx.fillStyle = flagColors[f % flagColors.length];
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + 14 * s, fy + 2 * s + flutter * 0.4);
      ctx.lineTo(fx + 12 * s + flutter, fy + 16 * s);
      ctx.lineTo(fx - 2 * s + flutter * 0.6, fy + 14 * s);
      ctx.closePath();
      ctx.fill();
    }

    // Stone ashram shelf
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = pal.path;
    ctx.fillRect(0, h * 0.72, w, 10 * s);
    return true;
  }

  if (stage === 'cloud_skies') {
    // Soaring graphic chiaroscuro cloud banks above distant silver-rimmed peaks
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w * 0.18, h * 0.78);
    ctx.lineTo(w * 0.44, h * 0.9);
    ctx.lineTo(w * 0.72, h * 0.74);
    ctx.lineTo(w, h * 0.86);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Breathing celestial sunbeams piercing the clouds
    for (let r = 0; r < 3; r++) {
      const rx = w * (0.24 + r * 0.26) + Math.sin(ts * 0.9 + r) * 18 * s;
      const alpha = 0.06 + 0.04 * Math.sin(ts * 1.8 + r * 1.5);
      ctx.fillStyle = `rgba(255, 240, 198, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(rx - 22 * s, 0);
      ctx.lineTo(rx + 28 * s, 0);
      ctx.lineTo(rx + 96 * s, h * 0.76);
      ctx.lineTo(rx - 12 * s, h * 0.76);
      ctx.closePath();
      ctx.fill();
    }

    // Sweeping stylized Indian cloud layers drifting & swelling gently
    const drift = (ts * 18) % (w * 0.4);
    for (let layer = 0; layer < 2; layer++) {
      ctx.fillStyle = layer === 0 ? pal.shadowTint : pal.path;
      const baseY = h * (0.68 + layer * 0.14) + Math.sin(ts * 1.4 + layer * 2) * 4 * s;
      for (let i = -1; i < 6; i++) {
        const cx = i * (w * 0.24) + (layer === 0 ? drift : -drift * 0.6);
        const r = (74 + (i % 2) * 24) * s;
        ctx.beginPath();
        ctx.arc(cx, baseY, r, Math.PI, 0);
        ctx.fill();
      }
      ctx.fillRect(0, baseY, w, h - baseY);
    }
    return true;
  }

  return false;
}

// =========================================================================
// 2. EXPANDED CAST ARCHETYPES (10 NEW RIGS — CLOSE-UP + FULL-BODY)
// =========================================================================
export function isExpandedArchetype(arch: ArchetypeId): boolean {
  return (
    arch === 'emperor' ||
    arch === 'statue_apsara' ||
    arch === 'yaksha' ||
    arch === 'tiger' ||
    arch === 'elephant' ||
    arch === 'deer' ||
    arch === 'crow' ||
    arch === 'crocodile' ||
    arch === 'tortoise' ||
    arch === 'owl'
  );
}

function drawEyePair(
  ctx: CanvasRenderingContext2D,
  expression: ExpressionId,
  accent: string,
  t: number,
  speechEnergy: number,
  options: {
    glowing?: boolean;
    roundOwl?: boolean;
    eyeX?: number;
    eyeY?: number;
    noBrows?: boolean;
  } = {}
): void {
  drawUnifiedEyePair(ctx, expression, accent, t, speechEnergy, options);
}

export function drawExpandedActorCloseUp(
  ctx: CanvasRenderingContext2D,
  cast: CastMember,
  expression: ExpressionId,
  viseme: number,
  speechEnergy: number,
  lightSide: 'left' | 'right',
  t: number
): boolean {
  const arch = cast.archetype;
  if (!isExpandedArchetype(arch)) return false;

  const ts = snap24(t);
  const lightRight = lightSide === 'right';
  const skin = cast.skinColor || '#e09a6e';
  const skinShadow = darkenHex(skin, 0.56);
  const mouthH = Math.round(4 + getVisemeAperture(viseme) * 9.5);

  ctx.save();
  ctx.rotate(Math.sin(ts * 2.2) * 0.025 + (speechEnergy > 0.5 ? 0.02 : 0));

  if (arch === 'emperor' || arch === 'statue_apsara' || arch === 'yaksha') {
    // 1. Dramatic Backing Aura / Halo / Antlers / Shoulders
    if (arch === 'statue_apsara') {
      // Radiating sculpted golden prabhamandala halo
      ctx.fillStyle = 'rgba(255, 224, 102, 0.25)';
      ctx.beginPath();
      ctx.arc(0, -10, 128, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = cast.accentColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, -10, 104, 0, Math.PI * 2);
      ctx.stroke();
    } else if (arch === 'yaksha') {
      // Sacred branching forest antlers
      ctx.strokeStyle = cast.accentColor;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * 30, -54);
        ctx.lineTo(side * 76, -124);
        ctx.lineTo(side * 108, -148);
        ctx.moveTo(side * 58, -96);
        ctx.lineTo(side * 42, -142);
        ctx.stroke();
      }
    }

    // Shoulders
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

    // Necklaces / Imperial Brocade Collar
    ctx.strokeStyle = cast.accentColor;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 72, 48, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    // Head Base + Chiaroscuro Half-Shadow
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.moveTo(-62, -54);
    ctx.lineTo(62, -54);
    ctx.lineTo(56, 22);
    ctx.lineTo(22, 72);
    ctx.lineTo(-22, 72);
    ctx.lineTo(-56, 22);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = skinShadow;
    ctx.fillRect(lightRight ? -90 : 0, -90, 90, 200);
    ctx.restore();

    drawEyePair(ctx, expression, cast.accentColor, t, speechEnergy, {
      glowing: arch === 'yaksha' || arch === 'statue_apsara',
    });

    // Imperial trimmed mustache & beard for Emperor
    if (arch === 'emperor') {
      ctx.fillStyle = '#090a12';
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(-42, 30);
      ctx.lineTo(-26, 36);
      ctx.lineTo(0, 26);
      ctx.lineTo(26, 36);
      ctx.lineTo(42, 30);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-24, 62);
      ctx.lineTo(24, 62);
      ctx.lineTo(0, 88);
      ctx.closePath();
      ctx.fill();
    }

    // Expressive Mouth Viseme (Unified FACS Engine)
    drawUnifiedMouth(ctx, expression, viseme, { y: 38 });
    void getExpressionHeadTilt;

    // Iconic Headwear
    if (arch === 'emperor') {
      // Sculpted Mughal Turban + Jeweled Sarpech Plume
      ctx.fillStyle = cast.primaryColor;
      ctx.beginPath();
      ctx.moveTo(-58, -32);
      ctx.lineTo(-54, -76);
      ctx.lineTo(-14, -96);
      ctx.lineTo(48, -82);
      ctx.lineTo(58, -32);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = cast.accentColor;
      ctx.fillRect(-52, -48, 104, 10);
      // Sarpech plume & ruby
      ctx.beginPath();
      ctx.moveTo(14, -84);
      ctx.quadraticCurveTo(38, -138, 10, -144);
      ctx.quadraticCurveTo(-2, -110, 4, -80);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ff173d';
      ctx.beginPath();
      ctx.arc(10, -76, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (arch === 'statue_apsara') {
      // Tall temple Mukut diadem
      ctx.fillStyle = cast.accentColor;
      ctx.beginPath();
      ctx.moveTo(-48, -40);
      ctx.lineTo(-28, -88);
      ctx.lineTo(0, -124);
      ctx.lineTo(28, -88);
      ctx.lineTo(48, -40);
      ctx.closePath();
      ctx.fill();
    } else if (arch === 'yaksha') {
      // Glowing forehead mystic crest
      ctx.fillStyle = cast.accentColor;
      ctx.beginPath();
      ctx.moveTo(0, -48);
      ctx.lineTo(10, -28);
      ctx.lineTo(0, -12);
      ctx.lineTo(-10, -28);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
    return true;
  }

  if (arch === 'tiger') {
    // Bold Bengal Tiger Close-Up with Graphic Black Stripes!
    ctx.fillStyle = cast.primaryColor;
    // Rounded ears
    ctx.beginPath();
    ctx.arc(-62, -56, 24, 0, Math.PI * 2);
    ctx.arc(62, -56, 24, 0, Math.PI * 2);
    ctx.fill();
    // Angular wide feline head
    ctx.beginPath();
    ctx.moveTo(-78, -48);
    ctx.lineTo(78, -48);
    ctx.lineTo(94, 14);
    ctx.lineTo(52, 68);
    ctx.lineTo(-52, 68);
    ctx.lineTo(-94, 14);
    ctx.closePath();
    ctx.fill();

    // Chiaroscuro shadow half
    ctx.save();
    ctx.clip();
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.58);
    ctx.fillRect(lightRight ? -110 : 0, -90, 110, 200);
    // Bold graphic tiger stripes
    ctx.fillStyle = '#09070c';
    for (const sy of [-40, -16, 12, 36]) {
      ctx.beginPath();
      ctx.moveTo(-98, sy);
      ctx.lineTo(-42, sy + 8);
      ctx.lineTo(-98, sy + 18);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(98, sy);
      ctx.lineTo(42, sy + 8);
      ctx.lineTo(98, sy + 18);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillRect(-10, -56, 20, 24);
    ctx.restore();

    // Cream cheek ruff & muzzle
    ctx.fillStyle = '#f5e6cc';
    ctx.beginPath();
    ctx.moveTo(-42, 18);
    ctx.lineTo(42, 18);
    ctx.lineTo(28, 62);
    ctx.lineTo(-28, 62);
    ctx.closePath();
    ctx.fill();
    // Nose
    ctx.fillStyle = '#1a0a0d';
    ctx.beginPath();
    ctx.moveTo(-16, 18);
    ctx.lineTo(16, 18);
    ctx.lineTo(0, 34);
    ctx.closePath();
    ctx.fill();

    drawEyePair(ctx, expression, cast.accentColor, t, speechEnergy, { glowing: true, eyeX: 34, eyeY: -12 });

    // Snarling fanged mouth
    ctx.fillStyle = '#17050a';
    ctx.fillRect(-26, 38, 52, Math.max(6, mouthH * 0.85));
    if (viseme >= 1) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-20, 38); ctx.lineTo(-14, 54); ctx.lineTo(-8, 38);
      ctx.moveTo(8, 38); ctx.lineTo(14, 54); ctx.lineTo(20, 38);
      ctx.fill();
    }
    ctx.restore();
    return true;
  }

  if (arch === 'elephant') {
    // Monumental Indian Elephant with Sweeping Ears, Ivory Tusks, Golden Tilak & Trunk
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.72);
    // Broad geometric ears
    ctx.beginPath();
    ctx.moveTo(-58, -54); ctx.lineTo(-156, -72); ctx.lineTo(-144, 58); ctx.lineTo(-64, 48); ctx.closePath();
    ctx.moveTo(58, -54); ctx.lineTo(156, -72); ctx.lineTo(144, 58); ctx.lineTo(64, 48); ctx.closePath();
    ctx.fill();

    // Sculpted domed head
    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.moveTo(-68, -74);
    ctx.quadraticCurveTo(0, -112, 68, -74);
    ctx.lineTo(74, 34);
    ctx.lineTo(36, 74);
    ctx.lineTo(-36, 74);
    ctx.lineTo(-74, 34);
    ctx.closePath();
    ctx.fill();

    // Chiaroscuro half shadow
    ctx.save();
    ctx.clip();
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.56);
    ctx.fillRect(lightRight ? -90 : 0, -120, 90, 220);
    ctx.restore();

    // Ceremonial forehead gold & vermilion mark
    ctx.fillStyle = cast.accentColor;
    ctx.fillRect(-24, -64, 48, 8);
    ctx.fillStyle = '#e6223c';
    ctx.beginPath();
    ctx.arc(0, -44, 7, 0, Math.PI * 2);
    ctx.fill();

    drawEyePair(ctx, expression, cast.accentColor, t, speechEnergy, { eyeX: 38, eyeY: -12 });

    // Sweeping white ivory tusks
    ctx.fillStyle = '#f7f1dc';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 24, 32);
      ctx.quadraticCurveTo(side * 72, 64, side * 94, 14);
      ctx.quadraticCurveTo(side * 64, 86, side * 18, 54);
      ctx.closePath();
      ctx.fill();
    }

    // Articulated speaking trunk swaying with speechEnergy!
    const sway = Math.sin(ts * 4) * 10 + speechEnergy * 18;
    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.moveTo(-22, 18);
    ctx.lineTo(22, 18);
    ctx.quadraticCurveTo(26 + sway, 92, 10 + sway * 1.4, 142);
    ctx.lineTo(-14 + sway * 1.2, 138);
    ctx.quadraticCurveTo(-18 + sway * 0.6, 88, -22, 18);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
    return true;
  }

  if (arch === 'deer') {
    // Luminous Golden Banyan Deer with Branching Golden Antlers
    ctx.strokeStyle = cast.accentColor;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 22, -52);
      ctx.lineTo(side * 66, -118);
      ctx.lineTo(side * 96, -140);
      ctx.moveTo(side * 50, -92);
      ctx.lineTo(side * 34, -138);
      ctx.moveTo(side * 66, -118);
      ctx.lineTo(side * 102, -104);
      ctx.stroke();
    }

    // Slender ears
    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.moveTo(-42, -46); ctx.lineTo(-98, -74); ctx.lineTo(-54, -18); ctx.closePath();
    ctx.moveTo(42, -46); ctx.lineTo(98, -74); ctx.lineTo(54, -18); ctx.closePath();
    ctx.fill();

    // Graceful tapered deer head
    ctx.beginPath();
    ctx.moveTo(-52, -52);
    ctx.lineTo(52, -52);
    ctx.lineTo(44, 12);
    ctx.lineTo(18, 76);
    ctx.lineTo(-18, 76);
    ctx.lineTo(-44, 12);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.6);
    ctx.fillRect(lightRight ? -80 : 0, -80, 80, 180);
    ctx.restore();

    drawEyePair(ctx, expression, cast.accentColor, t, speechEnergy, { eyeX: 28, eyeY: -12 });

    // Gentle dark nose & mouth
    ctx.fillStyle = '#18100d';
    ctx.beginPath();
    ctx.moveTo(-14, 52); ctx.lineTo(14, 52); ctx.lineTo(0, 66); ctx.closePath();
    ctx.fill();
    if (viseme > 0) {
      ctx.fillRect(-12, 68, 24, Math.max(4, mouthH * 0.45));
    }
    ctx.restore();
    return true;
  }

  if (arch === 'crow') {
    // Clever Forest Crow / Raven with Articulated Chattering Beak!
    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.moveTo(-130, 190);
    ctx.lineTo(-84, 58);
    ctx.lineTo(84, 58);
    ctx.lineTo(130, 190);
    ctx.closePath();
    ctx.fill();

    // Sleek angular crow head
    ctx.beginPath();
    ctx.arc(0, -14, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.52);
    ctx.fillRect(lightRight ? -80 : 0, -90, 80, 170);
    ctx.restore();

    drawEyePair(ctx, expression, cast.accentColor, t, speechEnergy, {
      glowing: true,
      eyeX: 26,
      eyeY: -22,
    });

    // Articulated upper & lower amber-obsidian beak synced to viseme!
    const beakGap = getVisemeAperture(viseme) * 7;
    ctx.fillStyle = cast.accentColor;
    ctx.beginPath();
    ctx.moveTo(-24, 6);
    ctx.lineTo(24, 6);
    ctx.lineTo(0, 48 - beakGap * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = darkenHex(cast.accentColor, 0.65);
    ctx.beginPath();
    ctx.moveTo(-18, 16 + beakGap);
    ctx.lineTo(18, 16 + beakGap);
    ctx.lineTo(0, 46 + beakGap);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return true;
  }

  if (arch === 'crocodile') {
    // Armored River Crocodile with Hinged Serrated Jaw!
    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.moveTo(-88, -32);
    ctx.lineTo(88, -32);
    ctx.lineTo(76, 26);
    ctx.lineTo(-76, 26);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.56);
    ctx.fillRect(lightRight ? -100 : 0, -60, 100, 120);
    ctx.restore();

    // Raised armored eye ridges
    drawEyePair(ctx, expression, cast.accentColor, t, speechEnergy, {
      glowing: true,
      eyeX: 38,
      eyeY: -24,
    });

    // Articulated snapping lower jaw + jagged white teeth!
    const jawDrop = 10 + getVisemeAperture(viseme) * 11;
    ctx.fillStyle = '#14050a';
    ctx.fillRect(-68, 22, 136, jawDrop);
    ctx.fillStyle = '#ffffff';
    for (let tx = -54; tx <= 54; tx += 18) {
      ctx.beginPath();
      ctx.moveTo(tx - 6, 22);
      ctx.lineTo(tx, 34);
      ctx.lineTo(tx + 6, 22);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.78);
    ctx.fillRect(-66, 22 + jawDrop, 132, 26);
    ctx.restore();
    return true;
  }

  if (arch === 'tortoise') {
    // Wise Pond Tortoise peeking over its faceted domed shell
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.62);
    ctx.beginPath();
    ctx.arc(0, 118, 132, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = cast.accentColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 118, 126, Math.PI, 0);
    ctx.stroke();

    // Gentle rounded tortoise head
    ctx.fillStyle = cast.skinColor || '#6e8c58';
    ctx.beginPath();
    ctx.arc(0, -4, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = darkenHex(cast.skinColor || '#6e8c58', 0.58);
    ctx.fillRect(lightRight ? -70 : 0, -70, 70, 150);
    ctx.restore();

    drawEyePair(ctx, expression, cast.accentColor, t, speechEnergy, { eyeX: 26, eyeY: -14 });

    ctx.fillStyle = '#182414';
    ctx.fillRect(-24, 24, 48, Math.max(4, mouthH * 0.65));
    ctx.restore();
    return true;
  }

  if (arch === 'owl') {
    // Nocturnal Counsellor Owl with Big Golden Eyes & Horned Ear Tufts
    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.moveTo(-140, 200);
    ctx.lineTo(-96, 56);
    ctx.lineTo(96, 56);
    ctx.lineTo(140, 200);
    ctx.closePath();
    ctx.fill();

    // Horned ear tufts
    ctx.beginPath();
    ctx.moveTo(-58, -44); ctx.lineTo(-92, -108); ctx.lineTo(-18, -62); ctx.closePath();
    ctx.moveTo(58, -44); ctx.lineTo(92, -108); ctx.lineTo(18, -62); ctx.closePath();
    ctx.fill();

    // Broad facial disc
    ctx.beginPath();
    ctx.arc(0, -6, 74, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.56);
    ctx.fillRect(lightRight ? -90 : 0, -90, 90, 190);
    ctx.restore();

    drawEyePair(ctx, expression, cast.accentColor, t, speechEnergy, {
      roundOwl: true,
      eyeX: 30,
      eyeY: -12,
      noBrows: true,
    });

    // Curved gold owl beak
    ctx.fillStyle = cast.accentColor;
    ctx.beginPath();
    ctx.moveTo(-14, 14);
    ctx.lineTo(14, 14);
    ctx.lineTo(0, 44 + getVisemeAperture(viseme) * 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return true;
  }

  ctx.restore();
  return false;
}

export function drawExpandedActorFullBody(
  ctx: CanvasRenderingContext2D,
  cast: CastMember,
  pose: PoseId,
  expression: ExpressionId,
  viseme: number,
  speechEnergy: number,
  stride: number,
  t: number
): boolean {
  const arch = cast.archetype;
  if (!isExpandedArchetype(arch)) return false;
  const ts = snap24(t);

  // Humanoid new archetypes (emperor, statue_apsara, yaksha) return false so main humanoid rig handles them!
  if (arch === 'emperor' || arch === 'statue_apsara' || arch === 'yaksha') {
    return false;
  }

  if (arch === 'tiger') {
    const bodyCol = cast.primaryColor;
    // Striped curling tail
    ctx.strokeStyle = bodyCol;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-44, -46);
    ctx.quadraticCurveTo(-86, -64 + Math.sin(ts * 5) * 10, -76, -98);
    ctx.stroke();
    // Legs
    ctx.fillStyle = darkenHex(bodyCol, 0.68);
    ctx.fillRect(-38 - stride * 0.5, -46, 15, 46);
    ctx.fillRect(16 + stride * 0.5, -46, 15, 46);
    // Muscular striped body
    ctx.fillStyle = bodyCol;
    ctx.beginPath();
    ctx.moveTo(-48, -42);
    ctx.lineTo(-34, -86);
    ctx.lineTo(38, -88);
    ctx.lineTo(46, -42);
    ctx.closePath();
    ctx.fill();
    // Bold tiger back stripes
    ctx.fillStyle = '#09070c';
    for (const sx of [-24, -6, 12, 28]) {
      ctx.beginPath();
      ctx.moveTo(sx - 4, -86);
      ctx.lineTo(sx + 5, -86);
      ctx.lineTo(sx, -56);
      ctx.closePath();
      ctx.fill();
    }
    ctx.save();
    ctx.translate(42, -88);
    ctx.scale(0.36, 0.36);
    drawExpandedActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', t);
    ctx.restore();
    return true;
  }

  if (arch === 'elephant') {
    // Monumental Pillar-Legged Indian Elephant with Royal Caparison Rug
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.65);
    ctx.fillRect(-52 - stride * 0.4, -56, 22, 56);
    ctx.fillRect(16 + stride * 0.4, -56, 22, 56);
    // Massive arched body
    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.arc(-8, -76, 58, Math.PI, 0);
    ctx.lineTo(50, -44);
    ctx.lineTo(-66, -44);
    ctx.closePath();
    ctx.fill();
    // Ceremonial crimson & gold saddle blanket
    ctx.fillStyle = '#99182e';
    ctx.fillRect(-36, -120, 56, 54);
    ctx.fillStyle = cast.accentColor;
    ctx.fillRect(-36, -72, 56, 7);
    // Head
    ctx.save();
    ctx.translate(46, -98);
    ctx.scale(0.42, 0.42);
    drawExpandedActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', t);
    ctx.restore();
    return true;
  }

  if (arch === 'deer') {
    // Graceful Slender Golden Deer Silhouette
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.68);
    ctx.fillRect(-30 - stride * 0.5, -56, 8, 56);
    ctx.fillRect(18 + stride * 0.5, -56, 8, 56);
    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.moveTo(-38, -50);
    ctx.lineTo(-28, -82);
    ctx.lineTo(28, -86);
    ctx.lineTo(34, -50);
    ctx.closePath();
    ctx.fill();
    // Slender upright neck
    ctx.fillRect(14, -124, 16, 44);
    ctx.save();
    ctx.translate(28, -130);
    ctx.scale(0.32, 0.32);
    drawExpandedActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', t);
    ctx.restore();
    return true;
  }

  if (arch === 'crow' || arch === 'owl') {
    const isOwl = arch === 'owl';
    const flap = pose === 'soar' ? Math.sin(ts * 16) * 28 : Math.sin(ts * 3) * 4;
    // Feet
    ctx.strokeStyle = cast.accentColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-10, -24); ctx.lineTo(-10, 0);
    ctx.moveTo(10, -24); ctx.lineTo(10, 0);
    ctx.stroke();
    // Spread or folded graphic wings
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.72);
    ctx.beginPath();
    ctx.moveTo(-18, -76);
    ctx.lineTo(-74, -84 - flap);
    ctx.lineTo(-54, -40 - flap * 0.4);
    ctx.lineTo(-14, -46);
    ctx.closePath();
    ctx.fill();
    if (pose === 'soar') {
      ctx.beginPath();
      ctx.moveTo(18, -76);
      ctx.lineTo(74, -84 - flap);
      ctx.lineTo(54, -40 - flap * 0.4);
      ctx.lineTo(14, -46);
      ctx.closePath();
      ctx.fill();
    }
    // Rounded avian torso
    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.ellipse(0, -56, isOwl ? 30 : 24, isOwl ? 38 : 32, isOwl ? 0 : 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(isOwl ? 0 : 12, -100);
    ctx.scale(0.35, 0.35);
    drawExpandedActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', t);
    ctx.restore();
    return true;
  }

  if (arch === 'crocodile') {
    // Low Armored River Crocodile Silhouette
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.65);
    // Serrated long tail
    ctx.beginPath();
    ctx.moveTo(-36, -24);
    ctx.lineTo(-112, -10 + Math.sin(ts * 4) * 6);
    ctx.lineTo(-36, -4);
    ctx.closePath();
    ctx.fill();
    // Body & armored scutes
    ctx.fillStyle = cast.primaryColor;
    ctx.fillRect(-42, -34, 88, 26);
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.52);
    ctx.fillRect(-34, -12, 14, 12);
    ctx.fillRect(22, -12, 14, 12);
    ctx.save();
    ctx.translate(48, -32);
    ctx.scale(0.36, 0.36);
    drawExpandedActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', t);
    ctx.restore();
    return true;
  }

  if (arch === 'tortoise') {
    // Wise Faceted Domed Tortoise
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.58);
    ctx.fillRect(-34, -16, 16, 16);
    ctx.fillRect(16, -16, 16, 16);
    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.arc(0, -14, 46, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = cast.accentColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-46, -14);
    ctx.lineTo(46, -14);
    ctx.stroke();
    ctx.save();
    ctx.translate(46, -34);
    ctx.scale(0.3, 0.3);
    drawExpandedActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', t);
    ctx.restore();
    return true;
  }

  return false;
}

// =========================================================================
// 3. EXPANDED ANIMATED STORYTELLING PROPS (8 NEW PROPS)
// =========================================================================
export function drawExpandedStoryProp(
  ctx: CanvasRenderingContext2D,
  prop: PropId,
  t: number
): boolean {
  const ts = snap24(t);

  if (prop === 'gold_bangle') {
    // Hitopadesha: Gleaming Heavy Gold Bangle + Orbiting Glint Star
    ctx.fillStyle = 'rgba(255, 212, 82, 0.18)';
    ctx.beginPath();
    ctx.arc(0, 0, 74, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffd24d';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.ellipse(0, 0, 54, 42, -0.25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#996515';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(0, 4, 46, 34, -0.25, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Ruby clasp + animated 4-point sparkle
    ctx.fillStyle = '#ff173d';
    ctx.beginPath();
    ctx.arc(38, -24, 9, 0, Math.PI * 2);
    ctx.fill();
    const sp = 10 + Math.sin(ts * 10) * 6;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(42, -32 - sp); ctx.lineTo(45, -32); ctx.lineTo(42 + sp, -32); ctx.lineTo(45, -29);
    ctx.lineTo(42, -32 + sp); ctx.lineTo(39, -29); ctx.lineTo(42 - sp, -32); ctx.lineTo(39, -32);
    ctx.closePath();
    ctx.fill();
    return true;
  }

  if (prop === 'hanging_khichdi_pot') {
    // Akbar & Birbal: Tall Bamboo Tripod with Clay Pot Hanging Absurdly High over Tiny Campfire!
    ctx.strokeStyle = '#8c5a32';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, -108); ctx.lineTo(-74, 52);
    ctx.moveTo(0, -108); ctx.lineTo(74, 52);
    ctx.moveTo(0, -108); ctx.lineTo(0, 44);
    ctx.stroke();
    // Rope + swaying terracotta khichdi pot up high
    const sway = Math.sin(ts * 3.5) * 6;
    ctx.strokeStyle = '#e8d4a2';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -108);
    ctx.lineTo(sway, -62);
    ctx.stroke();
    ctx.fillStyle = '#c76138';
    ctx.beginPath();
    ctx.arc(sway, -42, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8c3f22';
    ctx.fillRect(sway - 14, -68, 28, 8);
    // Tiny comical campfire way down at the base!
    const flick = 1 + Math.sin(ts * 16) * 0.2;
    ctx.fillStyle = '#4a2614';
    ctx.fillRect(-26, 44, 52, 8);
    ctx.fillStyle = '#ff4d1a';
    ctx.beginPath();
    ctx.moveTo(-14, 44); ctx.lineTo(0, 44 - 22 * flick); ctx.lineTo(14, 44); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd147';
    ctx.beginPath();
    ctx.moveTo(-7, 44); ctx.lineTo(0, 44 - 13 * flick); ctx.lineTo(7, 44); ctx.closePath();
    ctx.fill();
    return true;
  }

  if (prop === 'golden_statue') {
    // Singhasan Battisi: Carved Glowing Golden Apsara Statue on Pedestal
    const pulse = 0.85 + 0.15 * Math.sin(ts * 6);
    ctx.fillStyle = `rgba(255, 214, 92, ${0.22 * pulse})`;
    ctx.beginPath();
    ctx.arc(0, -28, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8c5c12';
    ctx.fillRect(-44, 24, 88, 22);
    ctx.fillStyle = '#f5c242';
    ctx.beginPath();
    ctx.moveTo(-26, 24);
    ctx.lineTo(-14, -44);
    ctx.lineTo(14, -44);
    ctx.lineTo(26, 24);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -64, 18, 0, Math.PI * 2);
    ctx.fill();
    // Pointed crown + halo ring
    ctx.beginPath();
    ctx.moveTo(-14, -76); ctx.lineTo(0, -104); ctx.lineTo(14, -76); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff0a6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -66, 30, 0, Math.PI * 2);
    ctx.stroke();
    return true;
  }

  if (prop === 'lotus_pond') {
    // Yaksha Prashna / Jataka: Luminous Rippling Pool + Sculpted Pink Sacred Lotus
    ctx.fillStyle = '#0c3547';
    ctx.beginPath();
    ctx.ellipse(0, 18, 96, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    const rPulse = ((ts * 34) % 58);
    ctx.strokeStyle = 'rgba(110, 242, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 18, 36 + rPulse, 10 + rPulse * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Lotus petals gently breathing open and closed
    const bloom = 1 + Math.sin(ts * 2.6) * 0.09;
    const lotusBob = Math.sin(ts * 2.2) * 2.5;
    for (const a of [-0.7, -0.35, 0, 0.35, 0.7]) {
      ctx.save();
      ctx.translate(0, 8 + lotusBob);
      ctx.rotate(a * bloom);
      ctx.fillStyle = Math.abs(a) < 0.2 ? '#ff69a8' : '#d9266d';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-18, -28, 0, -56);
      ctx.quadraticCurveTo(18, -28, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#ffd452';
    ctx.beginPath();
    ctx.arc(0, -4 + lotusBob, 10, 0, Math.PI * 2);
    ctx.fill();
    return true;
  }

  if (prop === 'measuring_stake') {
    // Gopal Bhar: Driven Survey Stake + Knotted Rope + Gold Plumb Weight
    ctx.fillStyle = '#6e3f1d';
    ctx.beginPath();
    ctx.moveTo(-10, -78);
    ctx.lineTo(10, -78);
    ctx.lineTo(14, 34);
    ctx.lineTo(0, 56);
    ctx.lineTo(-14, 34);
    ctx.closePath();
    ctx.fill();
    // Red royal flag pennant at top
    ctx.fillStyle = '#e6223c';
    ctx.beginPath();
    ctx.moveTo(10, -76);
    ctx.lineTo(64 + Math.sin(ts * 8) * 6, -62);
    ctx.lineTo(10, -48);
    ctx.closePath();
    ctx.fill();
    // Taut gold survey cord & brass plumb bob
    ctx.strokeStyle = '#ffd147';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-10, -40);
    ctx.quadraticCurveTo(-56, -24, -76, 30);
    ctx.stroke();
    ctx.fillStyle = '#ffd147';
    ctx.beginPath();
    ctx.moveTo(-84, 24); ctx.lineTo(-68, 24); ctx.lineTo(-76, 46); ctx.closePath();
    ctx.fill();
    return true;
  }

  if (prop === 'wooden_garuda') {
    // Kathasaritsagara: Mechanical Golden-Wood Flying Garuda Automaton!
    const wingY = Math.sin(ts * 9) * 26;
    ctx.fillStyle = '#b57028';
    // Articulated carved wings
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 12, -6);
      ctx.lineTo(side * 96, -34 + wingY);
      ctx.lineTo(side * 76, 12 + wingY * 0.5);
      ctx.lineTo(side * 14, 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd04d';
      ctx.fillRect(side > 0 ? 16 : -88, -14 + wingY * 0.4, 72, 5);
      ctx.fillStyle = '#b57028';
    }
    // Mechanical Garuda hull & beak
    ctx.fillStyle = '#e09a38';
    ctx.beginPath();
    ctx.moveTo(0, -46);
    ctx.lineTo(24, 18);
    ctx.lineTo(0, 38);
    ctx.lineTo(-24, 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff173d';
    ctx.beginPath();
    ctx.arc(0, -24, 7, 0, Math.PI * 2);
    ctx.fill();
    return true;
  }

  if (prop === 'royal_scales') {
    // Scales of Justice tipping rhythmically
    const tilt = Math.sin(ts * 3.2) * 0.18;
    ctx.fillStyle = '#d49d35';
    ctx.fillRect(-28, 42, 56, 10);
    ctx.fillRect(-5, -62, 10, 104);
    ctx.save();
    ctx.translate(0, -56);
    ctx.rotate(tilt);
    ctx.fillStyle = '#ffd147';
    ctx.fillRect(-76, -4, 152, 8);
    for (const side of [-1, 1]) {
      const px = side * 66;
      ctx.strokeStyle = '#fff0b3';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(px, 0); ctx.lineTo(px - 22, 48);
      ctx.moveTo(px, 0); ctx.lineTo(px + 22, 48);
      ctx.stroke();
      ctx.fillStyle = '#ffd147';
      ctx.beginPath();
      ctx.arc(px, 48, 22, 0, Math.PI);
      ctx.fill();
    }
    ctx.restore();
    return true;
  }

  if (prop === 'conch_shell') {
    // Sacred White Shankha Conch + Expanding Golden Sound Waves + Harmonic Vibration
    const vibX = Math.sin(ts * 18) * 1.4;
    const vibRot = Math.sin(ts * 12) * 0.03;
    for (let i = 0; i < 3; i++) {
      const p = (ts * 0.9 + i * 0.33) % 1;
      ctx.strokeStyle = `rgba(255, 212, 82, ${1 - p})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(46, -12, 18 + p * 68, -0.75, 0.75);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(vibX, 0);
    ctx.rotate(vibRot);
    ctx.fillStyle = '#f5eedc';
    ctx.beginPath();
    ctx.moveTo(-66, 10);
    ctx.quadraticCurveTo(-24, -46, 32, -26);
    ctx.quadraticCurveTo(54, -14, 42, 14);
    ctx.quadraticCurveTo(10, 44, -66, 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d4a359';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(8, -2, 16, 0, Math.PI * 1.4);
    ctx.stroke();
    ctx.restore();
    return true;
  }

  return false;
}
