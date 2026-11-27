/**
 * Katha Studio — World Folklore Procedural Canvas 2D Assets
 * Adds 6 Global Stages (30 total), 6 World Cast Archetypes (40 total),
 * and 6 World Storytelling Props (40 total) engineered for bold graphic silhouettes
 * that look crisp across all 10 Deterministic Art Engines.
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
// 1. WORLD STAGES (6 NEW STAGES -> 30 TOTAL)
// =========================================================================
export function drawWorldStageBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stage: StageId,
  pal: MoodPalette,
  t: number
): boolean {
  const s = Math.min(w, h) / 620;
  const ts = snap24(t);

  if (stage === 'olympus_acropolis') {
    // Classical Greek Acropolis Bluff, Doric Parthenon Colonnade & Cypress Trees
    // Distant Aegean mountain ridge
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.72);
    ctx.lineTo(w * 0.16, h * 0.56);
    ctx.lineTo(w * 0.36, h * 0.64);
    ctx.lineTo(w * 0.64, h * 0.5);
    ctx.lineTo(w * 0.85, h * 0.58);
    ctx.lineTo(w, h * 0.52);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Acropolis Marble Temple Pediment on upper hill
    const tx = w * 0.52;
    const ty = h * 0.44;
    const tw = 240 * s;
    ctx.fillStyle = '#d9b98b';
    // Stepped stylobate base
    ctx.fillRect(tx - tw * 0.58, ty + 62 * s, tw * 1.16, 12 * s);
    ctx.fillRect(tx - tw * 0.54, ty + 52 * s, tw * 1.08, 10 * s);
    // Triangular pediment roof
    ctx.beginPath();
    ctx.moveTo(tx - tw * 0.58, ty - 14 * s);
    ctx.lineTo(tx, ty - 52 * s);
    ctx.lineTo(tx + tw * 0.58, ty - 14 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3d2817';
    ctx.beginPath();
    ctx.moveTo(tx - tw * 0.45, ty - 17 * s);
    ctx.lineTo(tx, ty - 42 * s);
    ctx.lineTo(tx + tw * 0.45, ty - 17 * s);
    ctx.closePath();
    ctx.fill();
    // Entablature frieze
    ctx.fillStyle = '#c89b62';
    ctx.fillRect(tx - tw * 0.54, ty - 14 * s, tw * 1.08, 14 * s);
    // 6 Fluted Doric Columns
    for (let i = 0; i < 6; i++) {
      const cx = tx - tw * 0.44 + (i / 5) * tw * 0.88;
      ctx.fillStyle = '#e5cfa9';
      ctx.fillRect(cx - 7 * s, ty, 14 * s, 54 * s);
      ctx.fillStyle = '#9c7344';
      ctx.fillRect(cx + 1 * s, ty, 6 * s, 54 * s);
      // Capital
      ctx.fillStyle = '#eedab6';
      ctx.fillRect(cx - 10 * s, ty - 3 * s, 20 * s, 6 * s);
    }

    // Drifting golden Aegean clouds behind Olympus
    const cloudShift = (ts * 12) % (w * 0.45);
    ctx.fillStyle = 'rgba(255, 232, 188, 0.14)';
    for (let c = -1; c < 4; c++) {
      ctx.beginPath();
      ctx.ellipse(c * w * 0.34 + cloudShift, h * (0.2 + (c % 2) * 0.05), 110 * s, 20 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Twin flickering bronze temple braziers flanking Parthenon steps
    for (const side of [-1, 1]) {
      const bx = tx + side * (tw * 0.56);
      const by = ty + 48 * s;
      const flk = 1 + Math.sin(ts * 14 + side * 2) * 0.22;
      ctx.fillStyle = '#4a2c16';
      ctx.fillRect(bx - 7 * s, by, 14 * s, 16 * s);
      ctx.fillStyle = '#ff6a26';
      ctx.beginPath();
      ctx.moveTo(bx - 8 * s, by);
      ctx.lineTo(bx + Math.sin(ts * 10 + side) * 2.5 * s, by - 22 * s * flk);
      ctx.lineTo(bx + 8 * s, by);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.moveTo(bx - 4 * s, by);
      ctx.lineTo(bx, by - 12 * s * flk);
      ctx.lineTo(bx + 4 * s, by);
      ctx.closePath();
      ctx.fill();
    }

    // Tall Cypress Trees flanking left & right (gently swaying in Mediterranean breeze)
    ctx.fillStyle = pal.shadowTint;
    const cypressList: [number, number][] = [
      [0.12, 0.34],
      [0.18, 0.42],
      [0.84, 0.36],
      [0.9, 0.44],
    ];
    for (let ci = 0; ci < cypressList.length; ci++) {
      const [cx, ch] = cypressList[ci];
      const tipSway = Math.sin(ts * 1.8 + ci * 1.5) * 5.5 * s;
      ctx.beginPath();
      ctx.moveTo(w * cx + tipSway, h * ch);
      ctx.quadraticCurveTo(w * cx + tipSway * 0.4 + 22 * s, h * (ch + 0.16), w * cx + 12 * s, h * 0.78);
      ctx.lineTo(w * cx - 12 * s, h * 0.78);
      ctx.quadraticCurveTo(w * cx + tipSway * 0.4 - 22 * s, h * (ch + 0.16), w * cx + tipSway, h * ch);
      ctx.closePath();
      ctx.fill();
    }

    // Foreground marble paved path & olive terrace
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.74, w, h * 0.26);
    ctx.fillStyle = 'rgba(255, 224, 172, 0.16)';
    ctx.fillRect(0, h * 0.74, w, 6 * s);
    return true;
  }

  if (stage === 'bamboo_pagoda') {
    // East Asian Misty Karst Peaks, Curved-Eave Pagoda & Swaying Bamboo Grove
    // Layered misty karst spires
    ctx.fillStyle = pal.farSil;
    for (const [px, pw, ph] of [
      [0.16, 150, 0.42],
      [0.42, 180, 0.34],
      [0.74, 170, 0.38],
      [0.92, 140, 0.48],
    ]) {
      ctx.beginPath();
      ctx.moveTo(w * px - pw * s, h * 0.8);
      ctx.quadraticCurveTo(w * px - pw * 0.35 * s, h * ph, w * px, h * ph);
      ctx.quadraticCurveTo(w * px + pw * 0.35 * s, h * ph, w * px + pw * s, h * 0.8);
      ctx.closePath();
      ctx.fill();
    }

    // Drifting mountain valley mist ribbon
    const mistGrad = ctx.createLinearGradient(0, h * 0.56, 0, h * 0.78);
    mistGrad.addColorStop(0, 'rgba(236, 240, 232, 0)');
    mistGrad.addColorStop(0.5, 'rgba(236, 240, 232, 0.2)');
    mistGrad.addColorStop(1, 'rgba(236, 240, 232, 0)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, h * 0.56, w, h * 0.22);

    // Three-Tier Curved-Eave Pagoda Silhouette on right-center cliff
    const px = w * 0.66;
    const baseY = h * 0.72;
    ctx.fillStyle = pal.shadowTint;
    ctx.fillRect(px - 44 * s, baseY - 120 * s, 88 * s, 120 * s);
    // Warm golden paper-screen lantern windows inside pagoda
    ctx.fillStyle = '#ffcb6b';
    ctx.fillRect(px - 12 * s, baseY - 46 * s, 24 * s, 26 * s);
    ctx.fillRect(px - 9 * s, baseY - 88 * s, 18 * s, 20 * s);
    // Curved swept eaves (3 tiers)
    for (let tier = 0; tier < 3; tier++) {
      const ty = baseY - (tier + 1) * 42 * s;
      const rw = (78 - tier * 15) * s;
      ctx.fillStyle = '#121821';
      ctx.beginPath();
      ctx.moveTo(px - rw - 14 * s, ty + 2 * s);
      ctx.quadraticCurveTo(px - rw * 0.4, ty + 14 * s, px, ty - 16 * s);
      ctx.quadraticCurveTo(px + rw * 0.4, ty + 14 * s, px + rw + 14 * s, ty + 2 * s);
      ctx.lineTo(px + rw * 0.8, ty + 16 * s);
      ctx.lineTo(px - rw * 0.8, ty + 16 * s);
      ctx.closePath();
      ctx.fill();
    }
    // Pagoda finial spire
    ctx.fillStyle = '#d9a441';
    ctx.fillRect(px - 3 * s, baseY - 168 * s, 6 * s, 32 * s);

    // Swaying Bamboo Stalks & Sharp Leaf Clusters on left and far right
    const sway = Math.sin(ts * 1.6) * 8 * s;
    const stalks = [
      { x: w * 0.08, thick: 12 * s },
      { x: w * 0.14, thick: 9 * s },
      { x: w * 0.21, thick: 7 * s },
      { x: w * 0.91, thick: 11 * s },
    ];
    for (const st of stalks) {
      ctx.strokeStyle = '#101c16';
      ctx.lineWidth = st.thick;
      ctx.beginPath();
      ctx.moveTo(st.x, h * 0.88);
      ctx.quadraticCurveTo(st.x + sway * 0.5, h * 0.46, st.x + sway, h * 0.05);
      ctx.stroke();
      // Bamboo nodes
      ctx.strokeStyle = '#3a5943';
      ctx.lineWidth = 2.5 * s;
      for (let n = 1; n <= 5; n++) {
        const ny = h * (0.82 - n * 0.13);
        const nx = st.x + sway * (n / 6);
        ctx.beginPath();
        ctx.moveTo(nx - st.thick * 0.7, ny);
        ctx.lineTo(nx + st.thick * 0.7, ny);
        ctx.stroke();
      }
      // Sharp calligraphic bamboo leaves
      ctx.fillStyle = '#14241a';
      for (let l = 0; l < 4; l++) {
        const ly = h * (0.18 + l * 0.14);
        const lx = st.x + sway * (1 - l * 0.16);
        ctx.beginPath();
        ctx.ellipse(lx + 28 * s, ly, 34 * s, 5.5 * s, 0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(lx - 22 * s, ly + 10 * s, 26 * s, 4.5 * s, -0.42, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Courtyard stone ground
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.75, w, h * 0.25);
    return true;
  }

  if (stage === 'enchanted_cottage') {
    // Grimm Dark Pine Forest & Glowing Half-Timbered Fairytale Cottage
    // Layered silhouette pine canopy
    ctx.fillStyle = pal.farSil;
    for (let i = 0; i < 11; i++) {
      const tx = (i / 10) * w;
      const topY = h * (0.24 + (i % 3) * 0.07);
      ctx.beginPath();
      ctx.moveTo(tx, topY);
      ctx.lineTo(tx + 56 * s, h * 0.76);
      ctx.lineTo(tx - 56 * s, h * 0.76);
      ctx.closePath();
      ctx.fill();
    }

    // Half-timbered fairytale cottage on right-center
    const cx = w * 0.68;
    const cy = h * 0.74;
    // Chimney + curling smoke puffs
    ctx.fillStyle = '#2d2324';
    ctx.fillRect(cx + 38 * s, cy - 164 * s, 24 * s, 58 * s);
    ctx.fillStyle = 'rgba(232, 224, 210, 0.28)';
    for (let p = 0; p < 4; p++) {
      const drift = ((ts * 18 + p * 26) % 90) * s;
      ctx.beginPath();
      ctx.arc(cx + 50 * s + Math.sin(ts * 2 + p) * 12 * s, cy - 170 * s - drift, (10 + p * 4) * s, 0, Math.PI * 2);
      ctx.fill();
    }
    // Cottage wall
    ctx.fillStyle = '#d4be96';
    ctx.fillRect(cx - 72 * s, cy - 92 * s, 144 * s, 92 * s);
    // Dark oak timber beams
    ctx.strokeStyle = '#2a1c14';
    ctx.lineWidth = 6 * s;
    ctx.strokeRect(cx - 72 * s, cy - 92 * s, 144 * s, 92 * s);
    ctx.beginPath();
    ctx.moveTo(cx - 72 * s, cy - 46 * s); ctx.lineTo(cx + 72 * s, cy - 46 * s);
    ctx.moveTo(cx, cy - 92 * s); ctx.lineTo(cx, cy);
    ctx.stroke();
    // Steep gabled fairytale roof
    ctx.fillStyle = '#471e24';
    ctx.beginPath();
    ctx.moveTo(cx - 94 * s, cy - 86 * s);
    ctx.lineTo(cx, cy - 168 * s);
    ctx.lineTo(cx + 94 * s, cy - 86 * s);
    ctx.closePath();
    ctx.fill();
    // Warm glowing mullioned window & arched oak door
    const glowPulse = 0.85 + Math.sin(ts * 4) * 0.1;
    ctx.fillStyle = `rgba(255, 198, 72, ${glowPulse})`;
    ctx.fillRect(cx - 52 * s, cy - 74 * s, 32 * s, 28 * s);
    ctx.fillStyle = '#3a2216';
    ctx.beginPath();
    ctx.arc(cx + 34 * s, cy - 36 * s, 18 * s, Math.PI, 0);
    ctx.lineTo(cx + 52 * s, cy);
    ctx.lineTo(cx + 16 * s, cy);
    ctx.closePath();
    ctx.fill();

    // Framing foreground gnarled oak tree on left
    ctx.fillStyle = '#090d14';
    ctx.fillRect(0, 0, w * 0.08, h * 0.82);
    ctx.beginPath();
    ctx.moveTo(w * 0.06, h * 0.25);
    ctx.lineTo(w * 0.26, h * 0.14);
    ctx.lineTo(w * 0.24, h * 0.21);
    ctx.lineTo(w * 0.06, h * 0.34);
    ctx.closePath();
    ctx.fill();

    // Forest floor & winding cobblestone path
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.74, w, h * 0.26);
    ctx.fillStyle = 'rgba(218, 196, 152, 0.22)';
    ctx.beginPath();
    ctx.moveTo(cx + 16 * s, h * 0.74);
    ctx.quadraticCurveTo(w * 0.45, h * 0.82, w * 0.18, h);
    ctx.lineTo(w * 0.34, h);
    ctx.quadraticCurveTo(w * 0.56, h * 0.84, cx + 52 * s, h * 0.74);
    ctx.closePath();
    ctx.fill();
    return true;
  }

  if (stage === 'savanna_baobab') {
    // African Savanna Horizon, Monumental Baobab Tree & Flat-Top Acacia Silhouettes
    // Distant savanna kopje rock ridge
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.74);
    ctx.lineTo(w * 0.18, h * 0.64);
    ctx.lineTo(w * 0.36, h * 0.65);
    ctx.lineTo(w * 0.5, h * 0.72);
    ctx.lineTo(w * 0.78, h * 0.68);
    ctx.lineTo(w, h * 0.72);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Distant Flat-Top Acacia Tree on left
    ctx.fillStyle = pal.shadowTint;
    ctx.fillRect(w * 0.17, h * 0.56, 8 * s, h * 0.19);
    ctx.beginPath();
    ctx.ellipse(w * 0.175, h * 0.55, 68 * s, 14 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Monumental Sacred Baobab Tree on right-center
    const bx = w * 0.66;
    const by = h * 0.76;
    ctx.fillStyle = '#180d0b';
    // Massive sculpted bottle-trunk
    ctx.beginPath();
    ctx.moveTo(bx - 64 * s, by);
    ctx.quadraticCurveTo(bx - 52 * s, by - 95 * s, bx - 44 * s, by - 195 * s);
    ctx.lineTo(bx + 44 * s, by - 195 * s);
    ctx.quadraticCurveTo(bx + 54 * s, by - 95 * s, bx + 68 * s, by);
    ctx.closePath();
    ctx.fill();
    // Root-like sprawling branches reaching skyward
    ctx.strokeStyle = '#180d0b';
    ctx.lineCap = 'round';
    const branches: [number, number, number, number][] = [
      [-32, -188, -148, -284],
      [-12, -192, -74, -315],
      [10, -192, 62, -318],
      [34, -188, 152, -276],
      [-74, -240, -168, -238],
      [82, -236, 178, -228],
    ];
    for (const [x1, y1, x2, y2] of branches) {
      ctx.lineWidth = 14 * s;
      ctx.beginPath();
      ctx.moveTo(bx + x1 * s, by + y1 * s);
      ctx.lineTo(bx + x2 * s, by + y2 * s);
      ctx.stroke();
    }
    // Stylized canopy clusters
    ctx.fillStyle = pal.shadowTint;
    for (const [cx, cy, rx, ry] of [
      [-128, -280, 62, 24],
      [-42, -314, 72, 26],
      [62, -312, 74, 26],
      [146, -268, 60, 22],
    ]) {
      ctx.beginPath();
      ctx.ellipse(bx + cx * s, by + cy * s, rx * s, ry * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Golden-ochre savanna ground & tall grass blades
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.74, w, h * 0.26);
    ctx.strokeStyle = '#d48d28';
    ctx.lineWidth = 2.5 * s;
    for (let i = 0; i < 24; i++) {
      const gx = (i / 23) * w;
      const sway = Math.sin(ts * 2.2 + i) * 5 * s;
      ctx.beginPath();
      ctx.moveTo(gx, h * 0.78);
      ctx.quadraticCurveTo(gx + sway, h * 0.72, gx + sway * 1.4, h * 0.69);
      ctx.stroke();
    }
    return true;
  }

  if (stage === 'red_canyon_mesa') {
    // Americas Dramatic Stepped Red-Ochre Mesas, Canyon River & Carved Cedar Totem
    // Distant stepped buttes
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.74);
    ctx.lineTo(w * 0.08, h * 0.44);
    ctx.lineTo(w * 0.28, h * 0.44);
    ctx.lineTo(w * 0.34, h * 0.58);
    ctx.lineTo(w * 0.56, h * 0.58);
    ctx.lineTo(w * 0.63, h * 0.38);
    ctx.lineTo(w * 0.86, h * 0.38);
    ctx.lineTo(w * 0.94, h * 0.62);
    ctx.lineTo(w, h * 0.62);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Terracotta horizontal strata bands on mesas
    ctx.fillStyle = 'rgba(226, 114, 58, 0.28)';
    ctx.fillRect(w * 0.09, h * 0.48, w * 0.19, 10 * s);
    ctx.fillRect(w * 0.63, h * 0.43, w * 0.23, 12 * s);
    ctx.fillRect(w * 0.61, h * 0.52, w * 0.27, 8 * s);

    // Carved Indigenous Cedar Totem Pillar on left bluff
    const tx = w * 0.14;
    const ty = h * 0.76;
    ctx.fillStyle = '#24140e';
    ctx.fillRect(tx - 16 * s, ty - 210 * s, 32 * s, 210 * s);
    // Outstretched Thunderbird/Raven carved wooden wings on totem
    ctx.beginPath();
    ctx.moveTo(tx - 16 * s, ty - 178 * s);
    ctx.lineTo(tx - 78 * s, ty - 196 * s);
    ctx.lineTo(tx - 64 * s, ty - 156 * s);
    ctx.lineTo(tx - 16 * s, ty - 156 * s);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(tx + 16 * s, ty - 178 * s);
    ctx.lineTo(tx + 78 * s, ty - 196 * s);
    ctx.lineTo(tx + 64 * s, ty - 156 * s);
    ctx.lineTo(tx + 16 * s, ty - 156 * s);
    ctx.closePath();
    ctx.fill();
    // Carved geometric turquoise & ochre totem markings
    ctx.fillStyle = '#3cb7a8';
    ctx.fillRect(tx - 9 * s, ty - 172 * s, 18 * s, 12 * s);
    ctx.fillStyle = '#e89b32';
    ctx.fillRect(tx - 10 * s, ty - 122 * s, 20 * s, 14 * s);
    ctx.fillStyle = '#d4452b';
    ctx.fillRect(tx - 9 * s, ty - 72 * s, 18 * s, 12 * s);

    // Soaring distant canyon hawk silhouette & shimmering canyon river ripples
    const hawkX = w * 0.32 + ((ts * 22) % (w * 0.56));
    const hawkY = h * 0.22 + Math.sin(ts * 1.4) * 14 * s;
    const wingBeat = Math.sin(ts * 5.2) * 5 * s;
    ctx.strokeStyle = pal.shadowTint;
    ctx.lineWidth = 2.6 * s;
    ctx.beginPath();
    ctx.moveTo(hawkX - 16 * s, hawkY + wingBeat);
    ctx.quadraticCurveTo(hawkX - 6 * s, hawkY - 6 * s, hawkX, hawkY);
    ctx.quadraticCurveTo(hawkX + 6 * s, hawkY - 6 * s, hawkX + 16 * s, hawkY + wingBeat);
    ctx.stroke();

    // Winding canyon river ribbon + canyon floor
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.74, w, h * 0.26);
    ctx.fillStyle = 'rgba(62, 168, 178, 0.35)';
    ctx.beginPath();
    ctx.moveTo(w * 0.44, h * 0.74);
    ctx.quadraticCurveTo(w * 0.56, h * 0.84, w * 0.38, h);
    ctx.lineTo(w * 0.54, h);
    ctx.quadraticCurveTo(w * 0.68, h * 0.85, w * 0.52, h * 0.74);
    ctx.closePath();
    ctx.fill();
    // Rippling sunlit water glints along canyon river
    ctx.fillStyle = 'rgba(255, 232, 178, 0.42)';
    for (let r = 0; r < 4; r++) {
      const ry = h * (0.78 + r * 0.052);
      const rx = w * (0.48 + Math.sin(ts * 2.4 + r * 1.3) * 0.025);
      ctx.fillRect(rx - 14 * s, ry, 28 * s, 2.5 * s);
    }
    return true;
  }

  if (stage === 'tropical_archipelago') {
    // Southeast Asian River Delta, Distant Volcano Cone, Curved Stilt House & Palm Fronds
    // Distant volcanic island silhouette
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.moveTo(w * 0.46, h * 0.68);
    ctx.lineTo(w * 0.66, h * 0.34);
    ctx.lineTo(w * 0.72, h * 0.34);
    ctx.lineTo(w * 0.94, h * 0.68);
    ctx.closePath();
    ctx.fill();

    // Tropical river water band with gliding ripples
    const waterGrad = ctx.createLinearGradient(0, h * 0.64, 0, h * 0.84);
    waterGrad.addColorStop(0, '#0f3b3e');
    waterGrad.addColorStop(1, '#081f24');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, h * 0.64, w, h * 0.22);
    ctx.strokeStyle = 'rgba(130, 235, 210, 0.24)';
    ctx.lineWidth = 2.5 * s;
    for (let i = 0; i < 6; i++) {
      const rx = ((w * 0.14 * i + ts * 24) % (w + 120)) - 60;
      const ry = h * (0.69 + (i % 3) * 0.045);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + 64 * s, ry);
      ctx.stroke();
    }

    // Traditional Minangkabau / Archipelago Swept-Roof Stilt House on right bank
    const hx = w * 0.78;
    const hy = h * 0.68;
    ctx.fillStyle = '#14191e';
    for (const sx of [-38, -14, 14, 38]) {
      ctx.fillRect(hx + sx * s - 3 * s, hy - 22 * s, 6 * s, 32 * s);
    }
    ctx.fillStyle = '#4a2b1c';
    ctx.fillRect(hx - 46 * s, hy - 68 * s, 92 * s, 46 * s);
    ctx.fillStyle = '#ffbe4d';
    ctx.fillRect(hx - 12 * s, hy - 54 * s, 24 * s, 18 * s);
    // Swept buffalo-horn saddle roof
    ctx.fillStyle = '#18141a';
    ctx.beginPath();
    ctx.moveTo(hx - 74 * s, hy - 102 * s);
    ctx.quadraticCurveTo(hx, hy - 68 * s, hx + 74 * s, hy - 102 * s);
    ctx.lineTo(hx + 56 * s, hy - 64 * s);
    ctx.lineTo(hx - 56 * s, hy - 64 * s);
    ctx.closePath();
    ctx.fill();

    // Curving Coconut Palm Tree Silhouette on left bank
    ctx.strokeStyle = '#0c1a16';
    ctx.lineWidth = 14 * s;
    ctx.beginPath();
    ctx.moveTo(w * 0.06, h * 0.84);
    ctx.quadraticCurveTo(w * 0.13, h * 0.52, w * 0.18, h * 0.24);
    ctx.stroke();
    const sway = Math.sin(ts * 1.8) * 6 * s;
    ctx.fillStyle = '#0e261c';
    for (let f = 0; f < 6; f++) {
      const ang = -Math.PI * 0.85 + (f / 5) * Math.PI * 1.5;
      ctx.save();
      ctx.translate(w * 0.18, h * 0.24);
      ctx.rotate(ang + sway * 0.008);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(48 * s, -22 * s, 96 * s, 10 * s);
      ctx.quadraticCurveTo(46 * s, -2 * s, 0, 0);
      ctx.fill();
      ctx.restore();
    }

    // Lush mossy foreground river bank
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.78, w, h * 0.22);
    return true;
  }

  return false;
}

// =========================================================================
// 2. WORLD CAST ARCHETYPES (6 NEW ARCHETYPES -> 40 TOTAL)
// =========================================================================
function isWorldArchetype(arch: ArchetypeId): boolean {
  return (
    arch === 'fox' ||
    arch === 'wolf' ||
    arch === 'spider' ||
    arch === 'knight' ||
    arch === 'samurai' ||
    arch === 'raven'
  );
}

export function drawWorldActorCloseUp(
  ctx: CanvasRenderingContext2D,
  cast: CastMember,
  expression: ExpressionId,
  viseme: number,
  speechEnergy: number,
  lightSide: 'left' | 'right',
  t: number
): boolean {
  const arch = cast.archetype;
  if (!isWorldArchetype(arch)) return false;

  const ts = snap24(t);
  const lightRight = lightSide === 'right';
  const skin = cast.skinColor || '#e4a276';
  const skinShadow = darkenHex(skin, 0.55);
  const mouthOpen = [0, 8, 16, 24][Math.min(3, Math.max(0, viseme))] || 0;

  let worldSeed = 0;
  for (let i = 0; i < cast.id.length; i++) {
    worldSeed = (worldSeed * 31 + cast.id.charCodeAt(i)) % 997;
  }
  const breath = Math.sin(ts * 2.1 + worldSeed * 0.17);
  const talkNod = speechEnergy > 0.18 ? Math.sin(ts * 9.0 + worldSeed) * 0.03 * speechEnergy : 0;
  const blinkCycle = (t + (worldSeed % 37) * 0.19) % 3.9;
  const blinkScaleY = blinkCycle < 0.13 ? 0.1 : 1;

  ctx.save();
  ctx.translate(0, breath * -2.2 - speechEnergy * 2.6);
  ctx.rotate(
    Math.sin(ts * 2.0 + worldSeed * 0.15) * 0.022 + talkNod + getExpressionHeadTilt(expression)
  );
  void blinkScaleY;

  // ---- FOX (Cunning Trickster) ----
  if (arch === 'fox') {
    const fur = cast.primaryColor || '#d6521e';
    const furDark = darkenHex(fur, 0.58);
    // Shoulders
    ctx.fillStyle = furDark;
    ctx.beginPath();
    ctx.moveTo(-140, 210); ctx.lineTo(-80, 96); ctx.lineTo(80, 96); ctx.lineTo(140, 210); ctx.closePath();
    ctx.fill();
    // Large pointed triangular fox ears with black tips
    for (const sgn of [-1, 1]) {
      ctx.fillStyle = sgn > 0 ? fur : furDark;
      ctx.beginPath();
      ctx.moveTo(sgn * 28, -98);
      ctx.lineTo(sgn * 102, -198);
      ctx.lineTo(sgn * 96, -54);
      ctx.closePath();
      ctx.fill();
      // Black ear tip
      ctx.fillStyle = '#141418';
      ctx.beginPath();
      ctx.moveTo(sgn * 74, -162);
      ctx.lineTo(sgn * 102, -198);
      ctx.lineTo(sgn * 100, -142);
      ctx.closePath();
      ctx.fill();
      // Cream inner ear
      ctx.fillStyle = cast.accentColor || '#fff2dc';
      ctx.beginPath();
      ctx.moveTo(sgn * 44, -92);
      ctx.lineTo(sgn * 84, -158);
      ctx.lineTo(sgn * 82, -70);
      ctx.closePath();
      ctx.fill();
    }
    // Sleek diamond fox head (chiaroscuro split)
    ctx.fillStyle = lightRight ? fur : furDark;
    ctx.beginPath();
    ctx.moveTo(0, -112); ctx.lineTo(106, -24); ctx.lineTo(0, 96); ctx.lineTo(-106, -24); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = lightRight ? furDark : fur;
    ctx.beginPath();
    ctx.moveTo(0, -112); ctx.lineTo(lightRight ? -106 : 106, -24); ctx.lineTo(0, 96); ctx.closePath();
    ctx.fill();
    // Cream cheek fur tufts
    ctx.fillStyle = cast.accentColor || '#fff2dc';
    ctx.beginPath();
    ctx.moveTo(-106, -24); ctx.lineTo(-56, 42); ctx.lineTo(0, 96); ctx.lineTo(56, 42); ctx.lineTo(106, -24);
    ctx.lineTo(44, 14); ctx.lineTo(0, 30); ctx.lineTo(-44, 14); ctx.closePath();
    ctx.fill();
    // Expressive amber eyes & brows (honors all 10 expressions!)
    drawUnifiedEyePair(ctx, expression, '#ffd24d', t, speechEnergy, {
      glowing: expression === 'angry' || expression === 'sly',
      eyeX: 38,
      eyeY: -22,
      castSeed: worldSeed,
      eyeScale: 0.95,
    });
    // Glossy black nose + expressive snout mouth
    ctx.fillStyle = '#121216';
    ctx.beginPath();
    ctx.arc(0, 44, 14, 0, Math.PI * 2);
    ctx.fill();
    drawUnifiedMouth(ctx, expression, viseme, { y: 66, scale: 0.88 });
    ctx.restore();
    return true;
  }

  // ---- WOLF (Fierce Timber Wolf) ----
  if (arch === 'wolf') {
    const fur = cast.primaryColor || '#5e6b7c';
    const furDark = darkenHex(fur, 0.5);
    // Shaggy ruff shoulders
    ctx.fillStyle = furDark;
    ctx.beginPath();
    ctx.moveTo(-158, 210); ctx.lineTo(-106, 76); ctx.lineTo(106, 76); ctx.lineTo(158, 210); ctx.closePath();
    ctx.fill();
    // Pointed wolf ears
    for (const sgn of [-1, 1]) {
      ctx.fillStyle = sgn > 0 ? fur : furDark;
      ctx.beginPath();
      ctx.moveTo(sgn * 36, -96); ctx.lineTo(sgn * 94, -188); ctx.lineTo(sgn * 98, -62); ctx.closePath();
      ctx.fill();
    }
    // Angular wolf head with bristled cheek ruffs
    ctx.fillStyle = lightRight ? fur : furDark;
    ctx.beginPath();
    ctx.moveTo(0, -118); ctx.lineTo(86, -86); ctx.lineTo(118, -8); ctx.lineTo(66, 62);
    ctx.lineTo(0, 102); ctx.lineTo(-66, 62); ctx.lineTo(-118, -8); ctx.lineTo(-86, -86); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = lightRight ? furDark : fur;
    ctx.beginPath();
    ctx.moveTo(0, -118);
    ctx.lineTo(lightRight ? -86 : 86, -86);
    ctx.lineTo(lightRight ? -118 : 118, -8);
    ctx.lineTo(lightRight ? -66 : 66, 62);
    ctx.lineTo(0, 102);
    ctx.closePath();
    ctx.fill();
    // Pale muzzle bridge
    ctx.fillStyle = cast.skinColor || '#cad3de';
    ctx.beginPath();
    ctx.moveTo(-36, 12); ctx.lineTo(36, 12); ctx.lineTo(28, 76); ctx.lineTo(0, 96); ctx.lineTo(-28, 76); ctx.closePath();
    ctx.fill();
    // Expressive wolf eyes & brows (only fierce glowing slits when angry!)
    drawUnifiedEyePair(ctx, expression, cast.accentColor || '#f2b830', t, speechEnergy, {
      glowing: true,
      eyeX: 40,
      eyeY: -24,
      castSeed: worldSeed,
      eyeScale: 0.98,
    });
    // Snout nose & expressive jaw (fangs shown on angry/sly, friendly smile on calm/warm/joy)
    ctx.fillStyle = '#0d0e12';
    ctx.beginPath();
    ctx.moveTo(-18, 36); ctx.lineTo(18, 36); ctx.lineTo(0, 56); ctx.closePath();
    ctx.fill();
    drawUnifiedMouth(ctx, expression, viseme, { y: 72, scale: 1.0, fanged: true });
    ctx.restore();
    return true;
  }

  // ---- SPIDER (Anansi Folklore Trickster) ----
  if (arch === 'spider') {
    const shell = cast.primaryColor || '#1e1624';
    const gold = cast.accentColor || '#f2b830';
    // Expressive articulated spider legs framing behind portrait
    ctx.strokeStyle = shell;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < 3; i++) {
      const wiggle = Math.sin(ts * 4 + i * 1.4) * 8;
      for (const sgn of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(sgn * 58, 12 + i * 30);
        ctx.lineTo(sgn * (148 + i * 16), -44 + i * 44 + wiggle);
        ctx.lineTo(sgn * (186 + i * 10), 70 + i * 38);
        ctx.stroke();
      }
    }
    // Sculptural Akan patterned round cephalothorax head
    ctx.fillStyle = shell;
    ctx.beginPath();
    ctx.arc(0, -10, 96, 0, Math.PI * 2);
    ctx.fill();
    // Woven golden Kente brow crown & markings
    ctx.strokeStyle = gold;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, -10, 96, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.fillStyle = '#c83428';
    ctx.beginPath();
    ctx.moveTo(0, -96); ctx.lineTo(22, -68); ctx.lineTo(0, -48); ctx.lineTo(-22, -68); ctx.closePath();
    ctx.fill();
    // Cluster of charming expressive eyes (2 large main + 4 smaller gleaming eyes)
    for (const [ex, ey, er] of [
      [-32, -16, 20],
      [32, -16, 20],
      [-64, -26, 9],
      [64, -26, 9],
      [-52, -48, 7],
      [52, -48, 7],
    ]) {
      ctx.fillStyle = '#fff5d6';
      ctx.beginPath();
      ctx.arc(ex, ey, er, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#120d16';
      ctx.beginPath();
      ctx.arc(ex + (lightRight ? 3 : -3), ey, er * 0.52, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - er * 0.25, ey - er * 0.25, er * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
    // Expressive gold brows over main eyes so Anansi clearly emotes every expression!
    ctx.strokeStyle = gold;
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    for (const sgn of [-1, 1]) {
      const innerY =
        expression === 'angry' ? -30 : expression === 'grief' ? -46 : expression === 'shocked' || expression === 'awe' ? -48 : -40;
      const outerY =
        expression === 'angry' ? -46 : expression === 'grief' ? -34 : expression === 'sly' && sgn === 1 ? -50 : -40;
      ctx.beginPath();
      ctx.moveTo(sgn * 16, innerY);
      ctx.quadraticCurveTo(sgn * 34, Math.min(innerY, outerY) - 6, sgn * 50, outerY);
      ctx.stroke();
    }
    // Expressive mouth honoring all 10 expressions
    drawUnifiedMouth(ctx, expression, viseme, { y: 36, scale: 0.95 });
    ctx.restore();
    return true;
  }

  // ---- RAVEN (Pacific NW Mythic Trickster) ----
  if (arch === 'raven') {
    const feather = cast.primaryColor || '#141926';
    const sheen = cast.accentColor || '#38b5c4';
    // Sweeping dark feathered shoulders
    ctx.fillStyle = feather;
    ctx.beginPath();
    ctx.moveTo(-162, 210); ctx.quadraticCurveTo(-96, 56, 0, 44); ctx.quadraticCurveTo(96, 56, 162, 210);
    ctx.closePath();
    ctx.fill();
    // Sleek sculpted raven crown
    ctx.fillStyle = feather;
    ctx.beginPath();
    ctx.arc(0, -34, 86, 0, Math.PI * 2);
    ctx.fill();
    // Iridescent turquoise Pacific NW formline rim accent
    ctx.strokeStyle = sheen;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, -34, 78, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    // Expressive mythic raven eyes & brows
    drawUnifiedEyePair(ctx, expression, sheen, t, speechEnergy, {
      eyeX: 36,
      eyeY: -42,
      castSeed: worldSeed,
      eyeScale: 0.95,
    });
    // Iconic powerful curved Raven beak (upper + lower animated jaw)
    ctx.fillStyle = '#252b3b';
    ctx.beginPath();
    ctx.moveTo(-36, -12);
    ctx.quadraticCurveTo(0, -28, 36, -12);
    ctx.lineTo(0, 62);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = sheen;
    ctx.beginPath();
    ctx.moveTo(0, -22); ctx.lineTo(18, -10); ctx.lineTo(0, 46); ctx.closePath();
    ctx.fill();
    // Lower talking mandible
    ctx.fillStyle = '#12151f';
    ctx.beginPath();
    ctx.moveTo(-22, 24);
    ctx.lineTo(22, 24);
    ctx.lineTo(0, 56 + mouthOpen * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return true;
  }

  // ---- KNIGHT (Medieval Armored Hero) ----
  if (arch === 'knight') {
    const steel = '#8b99ab';
    const steelDark = '#3a4657';
    // Heraldic cape & steel pauldrons
    ctx.fillStyle = cast.primaryColor || '#b8252a';
    ctx.beginPath();
    ctx.moveTo(-168, 210); ctx.lineTo(-104, 84); ctx.lineTo(104, 84); ctx.lineTo(168, 210); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = steel;
    ctx.beginPath();
    ctx.ellipse(-98, 128, 48, 34, -0.35, 0, Math.PI * 2);
    ctx.ellipse(98, 128, 48, 34, 0.35, 0, Math.PI * 2);
    ctx.fill();
    // Flowing helmet plume crest
    ctx.fillStyle = cast.primaryColor || '#b8252a';
    ctx.beginPath();
    ctx.moveTo(-14, -126);
    ctx.quadraticCurveTo(10, -206, 98, -162 + Math.sin(ts * 4) * 6);
    ctx.quadraticCurveTo(38, -138, 18, -118);
    ctx.closePath();
    ctx.fill();
    // Open-visor armored helm framing expressive chiaroscuro face
    ctx.fillStyle = lightRight ? skin : skinShadow;
    ctx.beginPath();
    ctx.ellipse(0, -14, 78, 96, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = lightRight ? skinShadow : skin;
    ctx.beginPath();
    ctx.ellipse(0, -14, 78, 96, 0, lightRight ? Math.PI * 0.5 : -Math.PI * 0.5, lightRight ? Math.PI * 1.5 : Math.PI * 0.5);
    ctx.fill();
    // Steel sallet helmet dome & cheek guards
    ctx.fillStyle = lightRight ? steel : steelDark;
    ctx.beginPath();
    ctx.arc(0, -34, 88, Math.PI * 0.92, Math.PI * 2.08);
    ctx.closePath();
    ctx.fill();
    // Golden visor brow trim
    ctx.fillStyle = cast.accentColor || '#f2c144';
    ctx.fillRect(-86, -42, 172, 12);
    // Expressive knight eyes, brows & mouth (Unified FACS Engine)
    drawUnifiedEyePair(ctx, expression, cast.accentColor || '#f2c144', t, speechEnergy, {
      eyeX: 28,
      eyeY: -6,
      castSeed: worldSeed,
      eyeScale: 0.95,
    });
    drawUnifiedMouth(ctx, expression, viseme, { y: 42, scale: 0.92 });
    ctx.restore();
    return true;
  }

  // ---- SAMURAI (Horned Kabuto Warrior) ----
  if (arch === 'samurai') {
    const lacquer = cast.primaryColor || '#9e1c26';
    const gold = cast.accentColor || '#f2c144';
    // Lacquered lamellar shoulder armor (Sode)
    ctx.fillStyle = lacquer;
    ctx.beginPath();
    ctx.moveTo(-170, 210); ctx.lineTo(-108, 86); ctx.lineTo(108, 86); ctx.lineTo(170, 210); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = gold;
    ctx.lineWidth = 4;
    for (let row = 0; row < 3; row++) {
      ctx.beginPath();
      ctx.moveTo(-132, 118 + row * 24);
      ctx.lineTo(132, 118 + row * 24);
      ctx.stroke();
    }
    // Kabuto flared neck guard (Shikoro) behind head
    ctx.fillStyle = '#191d28';
    ctx.beginPath();
    ctx.moveTo(-114, 38); ctx.lineTo(-92, -62); ctx.lineTo(92, -62); ctx.lineTo(114, 38); ctx.closePath();
    ctx.fill();
    // Expressive chiaroscuro face
    ctx.fillStyle = lightRight ? skin : skinShadow;
    ctx.beginPath();
    ctx.ellipse(0, -10, 74, 92, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = lightRight ? skinShadow : skin;
    ctx.beginPath();
    ctx.ellipse(0, -10, 74, 92, 0, lightRight ? Math.PI * 0.5 : -Math.PI * 0.5, lightRight ? Math.PI * 1.5 : Math.PI * 0.5);
    ctx.fill();
    // Kabuto helmet dome
    ctx.fillStyle = '#1b202e';
    ctx.beginPath();
    ctx.arc(0, -34, 86, Math.PI * 0.96, Math.PI * 2.04);
    ctx.closePath();
    ctx.fill();
    // Iconic Golden Crescent Maedate Horns on Kabuto
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.moveTo(0, -74);
    ctx.quadraticCurveTo(-86, -110, -76, -182);
    ctx.quadraticCurveTo(-48, -114, 0, -96);
    ctx.quadraticCurveTo(48, -114, 76, -182);
    ctx.quadraticCurveTo(86, -110, 0, -74);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -92, 14, 0, Math.PI * 2);
    ctx.fill();
    // Expressive samurai eyes, brows & mouth (Unified FACS Engine — kabuki fury ONLY when angry!)
    drawUnifiedEyePair(ctx, expression, gold, t, speechEnergy, {
      eyeX: 30,
      eyeY: -6,
      castSeed: worldSeed,
      eyeScale: 0.96,
    });
    drawUnifiedMouth(ctx, expression, viseme, { y: 42, scale: 0.92 });
    ctx.restore();
    return true;
  }

  ctx.restore();
  return false;
}

export function drawWorldActorFullBody(
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
  if (!isWorldArchetype(arch)) return false;
  const ts = snap24(t);

  // Knight & Samurai delegate to the articulated humanoid body rig in renderAssets.ts
  // (which draws their flowing robes/armor legs + calls drawWorldActorCloseUp for their iconic helm/kabuto head!)
  if (arch === 'knight' || arch === 'samurai') {
    return false;
  }

  if (arch === 'fox' || arch === 'wolf') {
    const isFox = arch === 'fox';
    const bodyCol = cast.primaryColor || (isFox ? '#d6521e' : '#5e6b7c');
    // Bushy sweeping tail
    ctx.fillStyle = bodyCol;
    ctx.beginPath();
    ctx.moveTo(-42, -52);
    ctx.quadraticCurveTo(-96, -78 + Math.sin(ts * 5) * 12, -98, -28);
    ctx.quadraticCurveTo(-68, -22, -38, -36);
    ctx.closePath();
    ctx.fill();
    if (isFox) {
      // Iconic white fox tail tip
      ctx.fillStyle = cast.accentColor || '#fff2dc';
      ctx.beginPath();
      ctx.arc(-92, -34, 14, 0, Math.PI * 2);
      ctx.fill();
    }
    // Agile legs
    ctx.fillStyle = darkenHex(bodyCol, 0.55);
    ctx.fillRect(-36 - stride * 0.6, -46, isFox ? 10 : 13, 46);
    ctx.fillRect(18 + stride * 0.6, -46, isFox ? 10 : 13, 46);
    ctx.fillStyle = '#18181f';
    ctx.fillRect(-38 - stride * 0.6, -12, isFox ? 12 : 15, 12);
    ctx.fillRect(18 + stride * 0.6, -12, isFox ? 12 : 15, 12);
    // Sleek torso
    ctx.fillStyle = bodyCol;
    ctx.beginPath();
    ctx.ellipse(0, -56, isFox ? 44 : 50, isFox ? 22 : 27, -0.06, 0, Math.PI * 2);
    ctx.fill();
    // Expressive head
    ctx.save();
    ctx.translate(42, isFox ? -84 : -90);
    ctx.scale(0.35, 0.35);
    drawWorldActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', t);
    ctx.restore();
    return true;
  }

  if (arch === 'spider') {
    const shell = cast.primaryColor || '#1e1624';
    const gold = cast.accentColor || '#f2b830';
    // 6-8 rhythmic folkloric puppet legs
    ctx.strokeStyle = shell;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < 4; i++) {
      const step = Math.sin(ts * 6 + i * 1.3) * (pose === 'walk' ? 12 : 3);
      for (const sgn of [-1, 1]) {
        const yOff = -46 + i * 10;
        ctx.beginPath();
        ctx.moveTo(sgn * 18, yOff);
        ctx.lineTo(sgn * (54 + i * 8), yOff - 28 + step);
        ctx.lineTo(sgn * (70 + i * 6), 0 + step * 0.4);
        ctx.stroke();
      }
    }
    // Patterned Anansi abdomen behind
    ctx.fillStyle = shell;
    ctx.beginPath();
    ctx.ellipse(-28, -68, 34, 28, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = gold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-46, -68); ctx.lineTo(-10, -68);
    ctx.moveTo(-28, -86); ctx.lineTo(-28, -50);
    ctx.stroke();
    // Expressive head
    ctx.save();
    ctx.translate(18, -62);
    ctx.scale(0.32, 0.32);
    drawWorldActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', t);
    ctx.restore();
    return true;
  }

  if (arch === 'raven') {
    const feather = cast.primaryColor || '#141926';
    const sheen = cast.accentColor || '#38b5c4';
    const isFlying = pose === 'soar';
    const flap = isFlying ? Math.sin(ts * 13) * 38 : Math.sin(ts * 2) * 4;

    // Claws
    if (!isFlying) {
      ctx.strokeStyle = '#383d4d';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-10, -36); ctx.lineTo(-12 - stride * 0.4, 0);
      ctx.moveTo(10, -36); ctx.lineTo(12 + stride * 0.4, 0);
      ctx.stroke();
    }
    // Wide sculptural Raven wings
    ctx.fillStyle = feather;
    ctx.beginPath();
    ctx.moveTo(-10, -64);
    ctx.lineTo(-96, -108 - flap);
    ctx.lineTo(-78, -48 - flap * 0.4);
    ctx.closePath();
    ctx.fill();
    if (isFlying) {
      ctx.beginPath();
      ctx.moveTo(10, -64);
      ctx.lineTo(96, -108 - flap);
      ctx.lineTo(78, -48 - flap * 0.4);
      ctx.closePath();
      ctx.fill();
    }
    // Tail fan + torso
    ctx.beginPath();
    ctx.moveTo(-24, -46); ctx.lineTo(-68, -26); ctx.lineTo(-56, -12); ctx.lineTo(-12, -34); ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -62, 34, 24, -0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = sheen;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -62, 24, -0.5, 0.9);
    ctx.stroke();
    // Expressive head
    ctx.save();
    ctx.translate(22, -96);
    ctx.scale(0.32, 0.32);
    drawWorldActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', t);
    ctx.restore();
    return true;
  }

  return false;
}

// =========================================================================
// 3. WORLD STORYTELLING PROPS (6 NEW PROPS -> 40 TOTAL)
// =========================================================================
export function drawWorldStoryProp(
  ctx: CanvasRenderingContext2D,
  prop: PropId,
  t: number
): boolean {
  const ts = snap24(t);

  if (prop === 'story_box') {
    // Nyame's Golden Story Box with glowing escaping story-sparks
    const lidLift = Math.abs(Math.sin(ts * 2.2)) * 14;
    // Warm golden story glow from inside
    ctx.fillStyle = 'rgba(255, 214, 92, 0.35)';
    ctx.beginPath();
    ctx.arc(0, -24, 68, 0, Math.PI * 2);
    ctx.fill();
    // Cedar chest base
    ctx.fillStyle = '#5c2c16';
    ctx.fillRect(-54, -18, 108, 56);
    // Gold Kente bands & Adinkra diamond clasp
    ctx.fillStyle = '#f2be38';
    ctx.fillRect(-54, -18, 108, 10);
    ctx.fillRect(-54, 28, 108, 10);
    ctx.fillRect(-38, -18, 10, 56);
    ctx.fillRect(28, -18, 10, 56);
    // Slightly lifted chest lid
    ctx.fillStyle = '#78391c';
    ctx.beginPath();
    ctx.moveTo(-58, -18 - lidLift);
    ctx.lineTo(-48, -46 - lidLift);
    ctx.lineTo(48, -46 - lidLift);
    ctx.lineTo(58, -18 - lidLift);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffd55e';
    ctx.lineWidth = 4;
    ctx.stroke();
    // Floating golden story sparks
    ctx.fillStyle = '#fff3b8';
    for (let i = 0; i < 5; i++) {
      const sx = Math.sin(ts * 2.8 + i * 1.6) * 32;
      const sy = -36 - ((ts * 32 + i * 18) % 58);
      ctx.beginPath();
      ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    return true;
  }

  if (prop === 'magic_staff') {
    // Sun Wukong's Ruyi Jingu Bang (Golden-Banded Celestial Iron Staff)
    ctx.rotate(-0.42 + Math.sin(ts * 3) * 0.06);
    // Swirling golden aura
    ctx.fillStyle = 'rgba(255, 210, 72, 0.22)';
    ctx.fillRect(-16, -124, 32, 248);
    // Crimson lacquered iron core
    ctx.fillStyle = '#b31b24';
    ctx.fillRect(-8, -112, 16, 224);
    // Ornate golden end caps & auspicious rings
    ctx.fillStyle = '#ffd452';
    ctx.fillRect(-11, -118, 22, 34);
    ctx.fillRect(-11, 84, 22, 34);
    ctx.fillStyle = '#fff2b0';
    ctx.fillRect(-13, -88, 26, 7);
    ctx.fillRect(-13, 81, 26, 7);
    return true;
  }

  if (prop === 'golden_fleece') {
    // Radiant Classical Golden Fleece Ram Pelt
    const shimmer = 0.24 + Math.sin(ts * 4) * 0.08;
    ctx.fillStyle = `rgba(255, 214, 84, ${shimmer})`;
    ctx.beginPath();
    ctx.arc(0, -10, 78, 0, Math.PI * 2);
    ctx.fill();
    // Hanging fleece body
    ctx.fillStyle = '#e8ae2c';
    ctx.beginPath();
    ctx.moveTo(-48, -46);
    ctx.lineTo(48, -46);
    ctx.lineTo(58, 38);
    ctx.lineTo(28, 58);
    ctx.lineTo(0, 44);
    ctx.lineTo(-28, 58);
    ctx.lineTo(-58, 38);
    ctx.closePath();
    ctx.fill();
    // Highlight wool tufts
    ctx.fillStyle = '#ffe588';
    ctx.beginPath();
    ctx.arc(-18, -14, 18, 0, Math.PI * 2);
    ctx.arc(16, -12, 18, 0, Math.PI * 2);
    ctx.arc(0, 14, 22, 0, Math.PI * 2);
    ctx.fill();
    // Coiled golden ram horns at top
    ctx.strokeStyle = '#ffd862';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(-34, -54, 18, 0, Math.PI * 1.45);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(34, -54, 18, -Math.PI * 0.45, Math.PI);
    ctx.stroke();
    return true;
  }

  if (prop === 'sun_orb') {
    // Mythic Stolen Sun Sphere with rotating geometric corona rays & pulsing flare aura
    const flareR = 82 + Math.sin(ts * 4.8) * 10;
    ctx.fillStyle = 'rgba(255, 198, 62, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, flareR, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.rotate(ts * 0.8);
    ctx.fillStyle = '#f5a623';
    for (let i = 0; i < 12; i++) {
      ctx.save();
      ctx.rotate((i / 12) * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(46, -10); ctx.lineTo(74, 0); ctx.lineTo(46, 10); ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    ctx.fillStyle = '#ffd859';
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff7cc';
    ctx.beginPath();
    ctx.arc(-10, -10, 22, 0, Math.PI * 2);
    ctx.fill();
    return true;
  }

  if (prop === 'magic_peach') {
    // Celestial Peach of Immortality levitating with orbiting immortal dew sparkles
    const hoverY = Math.sin(ts * 3.1) * 7;
    ctx.save();
    ctx.translate(0, hoverY);
    ctx.fillStyle = `rgba(255, 178, 196, ${(0.24 + 0.08 * Math.sin(ts * 4.2)).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(0, 0, 68, 0, Math.PI * 2);
    ctx.fill();
    // Jade leaves beneath
    ctx.fillStyle = '#2d8c5a';
    ctx.beginPath();
    ctx.ellipse(-34, 24, 34, 14, -0.35 + Math.sin(ts * 3) * 0.05, 0, Math.PI * 2);
    ctx.ellipse(34, 24, 34, 14, 0.35 - Math.sin(ts * 3) * 0.05, 0, Math.PI * 2);
    ctx.fill();
    // Plump pointed celestial peach
    const pGrad = ctx.createRadialGradient(-12, -16, 6, 0, 4, 48);
    pGrad.addColorStop(0, '#fff2c2');
    pGrad.addColorStop(0.55, '#ff8aa3');
    pGrad.addColorStop(1, '#d92954');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.moveTo(0, -54);
    ctx.bezierCurveTo(54, -22, 52, 46, 0, 44);
    ctx.bezierCurveTo(-52, 46, -54, -22, 0, -54);
    ctx.closePath();
    ctx.fill();
    // Orbiting dew sparkles
    ctx.fillStyle = '#fff7d6';
    for (let sp = 0; sp < 3; sp++) {
      const ang = ts * 2.4 + sp * ((Math.PI * 2) / 3);
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * 56, Math.sin(ang) * 44, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return true;
  }

  if (prop === 'kris_dagger') {
    // Traditional Southeast Asian Wavy-Bladed Keris Dagger with rippling steel glint
    ctx.rotate(-0.4 + Math.sin(ts * 3.2) * 0.045);
    // Ornate carved golden hilt
    ctx.fillStyle = '#f2be38';
    ctx.beginPath();
    ctx.moveTo(-14, 44);
    ctx.quadraticCurveTo(-24, 68, -6, 86);
    ctx.quadraticCurveTo(18, 86, 12, 58);
    ctx.lineTo(14, 44);
    ctx.closePath();
    ctx.fill();
    // Asymmetrical wide cross-guard (Ganja)
    ctx.fillStyle = '#d49a2a';
    ctx.beginPath();
    ctx.moveTo(-36, 36); ctx.lineTo(28, 30); ctx.lineTo(20, 46); ctx.lineTo(-28, 46); ctx.closePath();
    ctx.fill();
    // Iconic undulating 5-wave steel blade
    ctx.fillStyle = '#cfd8e3';
    ctx.beginPath();
    ctx.moveTo(-11, 34);
    ctx.quadraticCurveTo(-22, 12, -6, -8);
    ctx.quadraticCurveTo(10, -28, -10, -48);
    ctx.quadraticCurveTo(-20, -68, 0, -104);
    ctx.quadraticCurveTo(12, -66, 2, -46);
    ctx.quadraticCurveTo(22, -26, 6, -6);
    ctx.quadraticCurveTo(-6, 14, 11, 34);
    ctx.closePath();
    ctx.fill();
    // Damask steel center ridge
    ctx.strokeStyle = '#6d7c8f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 30); ctx.quadraticCurveTo(-8, -10, 0, -96);
    ctx.stroke();
    // Rippling specular steel glint travelling up the wavy blade
    const glintY = 26 - ((ts * 75) % 124);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(Math.sin(glintY * 0.12) * 5, glintY, 6, 0, Math.PI * 2);
    ctx.fill();
    return true;
  }

  return false;
}
