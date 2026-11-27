/**
 * Katha Studio — Encyclopedic Epics & Full-Chapter Chiaroscuro Assets
 * Adds 8 stages (including Ramayana Ashoka Vatika & Golden Lanka, Cave Den, Ocean Ship,
 * Bazaar Lane, Courtyard Well, Royal Dungeon, Desert Caravan),
 * 12 archetypes (Deva, Goddess, Ten-Crowned Asura, Vanara Hero, Child, Elder Woman, Guard,
 * Bull, Hare, Crane, Mouse, Dog), and 12 animated epic & folklore props.
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
// 1. ENCYCLOPEDIC STAGES (8 NEW STAGES -> 24 TOTAL)
// =========================================================================
export function drawEncyclopedicStageBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stage: StageId,
  pal: MoodPalette,
  t: number
): boolean {
  const s = Math.min(w, h) / 620;
  const ts = snap24(t);

  if (stage === 'ashoka_vatika') {
    // Ramayana: Moonlit Lanka Ashoka Grove with golden spires behind & blossoming crimson Ashoka canopy
    // Distant Golden Lanka towers peeking over garden wall
    ctx.fillStyle = '#3d2810';
    for (const [tx, th] of [
      [0.18, 0.36],
      [0.82, 0.32],
    ]) {
      ctx.beginPath();
      ctx.moveTo(w * tx - 30 * s, h * 0.68);
      ctx.lineTo(w * tx, h * th);
      ctx.lineTo(w * tx + 30 * s, h * 0.68);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd24d';
      ctx.fillRect(w * tx - 3 * s, h * th, 6 * s, 26 * s);
      ctx.fillStyle = '#3d2810';
    }

    // Iconic Ashoka Tree overarching the right/center with glowing crimson-gold blossoms
    ctx.fillStyle = '#070b14';
    ctx.beginPath();
    ctx.moveTo(w * 0.72, h * 0.78);
    ctx.lineTo(w * 0.68, h * 0.32);
    ctx.lineTo(w * 0.38, h * 0.22);
    ctx.lineTo(w * 0.42, h * 0.16);
    ctx.lineTo(w * 0.76, h * 0.24);
    ctx.lineTo(w * 0.84, h * 0.78);
    ctx.closePath();
    ctx.fill();

    // Faceted Ashoka canopy + glowing crimson blossom clusters swaying in night breeze
    const canopySway = Math.sin(ts * 1.7) * 5 * s;
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.ellipse(w * 0.6 + canopySway * 0.4, h * 0.16, 260 * s, 96 * s, -0.08, 0, Math.PI * 2);
    ctx.fill();
    const blossoms: [number, number][] = [
      [0.42, 0.2],
      [0.54, 0.14],
      [0.66, 0.22],
      [0.78, 0.16],
    ];
    for (let bi = 0; bi < blossoms.length; bi++) {
      const [bx, by] = blossoms[bi];
      const sw = Math.sin(ts * 2.2 + bi * 1.3) * 4 * s;
      ctx.fillStyle = '#ff3855';
      ctx.beginPath();
      ctx.arc(w * bx + sw, h * by + sw * 0.25, 14 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd04d';
      ctx.beginPath();
      ctx.arc(w * bx + sw + 4 * s, h * by - 4 * s, 5 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    // Gently drifting crimson Ashoka petals
    ctx.fillStyle = 'rgba(255, 76, 102, 0.72)';
    for (let p = 0; p < 6; p++) {
      const px = w * (0.35 + p * 0.09) + Math.sin(ts * 1.8 + p * 2.1) * 26 * s;
      const py = h * 0.2 + (((ts * 24 + p * 53) % 280) * s);
      ctx.beginPath();
      ctx.ellipse(px, py, 5 * s, 2.5 * s, ts * 1.6 + p, 0, Math.PI * 2);
      ctx.fill();
    }

    // Carved stone dais & moonlit garden floor
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = pal.path;
    ctx.fillRect(w * 0.16, h * 0.72, w * 0.68, 12 * s);
    return true;
  }

  if (stage === 'golden_lanka') {
    // Ramayana / Puranas: Monumental Golden Citadel Spires towering against crimson-indigo sky
    const spires = [
      [0.12, 0.34, 48],
      [0.28, 0.22, 58],
      [0.5, 0.1, 76],
      [0.72, 0.22, 58],
      [0.88, 0.34, 48],
    ];
    for (const [sx, sy, sw] of spires) {
      const cx = w * sx;
      ctx.fillStyle = '#8f5d14';
      ctx.beginPath();
      ctx.moveTo(cx - sw * s, h * 0.74);
      ctx.lineTo(cx - sw * 0.52 * s, h * (sy + 0.14));
      ctx.lineTo(cx, h * sy);
      ctx.lineTo(cx + sw * 0.52 * s, h * (sy + 0.14));
      ctx.lineTo(cx + sw * s, h * 0.74);
      ctx.closePath();
      ctx.fill();
      // Hard chiaroscuro golden illuminated half
      ctx.fillStyle = '#ffd24d';
      ctx.beginPath();
      ctx.moveTo(cx, h * sy);
      ctx.lineTo(cx + sw * 0.52 * s, h * (sy + 0.14));
      ctx.lineTo(cx + sw * s, h * 0.74);
      ctx.lineTo(cx, h * 0.74);
      ctx.closePath();
      ctx.fill();
      // Spire finial + fluttering Lanka crimson war-pennant & shimmering gold star glint
      ctx.fillStyle = '#fff2b2';
      ctx.fillRect(cx - 2 * s, h * sy - 24 * s, 4 * s, 26 * s);
      const flagWave = Math.sin(ts * 6.5 + sx * 12) * 5 * s;
      ctx.fillStyle = '#e6223c';
      ctx.beginPath();
      ctx.moveTo(cx + 2 * s, h * sy - 22 * s);
      ctx.lineTo(cx + 26 * s + flagWave, h * sy - 16 * s + flagWave * 0.3);
      ctx.lineTo(cx + 2 * s, h * sy - 9 * s);
      ctx.closePath();
      ctx.fill();
      const spAlpha = 0.25 + 0.55 * Math.max(0, Math.sin(ts * 3.8 + sx * 17));
      ctx.fillStyle = `rgba(255, 248, 198, ${spAlpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(cx, h * sy - 24 * s, 4.5 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    // Citadel bridge & rampart terrace
    ctx.fillStyle = '#1b1108';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = '#f2be38';
    ctx.fillRect(0, h * 0.72, w, 6 * s);
    return true;
  }

  if (stage === 'cave_den') {
    // Mountain Cave / Lion's Den: Jagged Obsidian Cavern Arch framing distant glowing mouth
    ctx.fillStyle = pal.farSil;
    ctx.fillRect(0, 0, w, h);

    // Bright graphic cave opening in center-back
    ctx.fillStyle = pal.skyLow;
    ctx.beginPath();
    ctx.moveTo(w * 0.28, h * 0.74);
    ctx.lineTo(w * 0.32, h * 0.3);
    ctx.lineTo(w * 0.5, h * 0.18);
    ctx.lineTo(w * 0.68, h * 0.32);
    ctx.lineTo(w * 0.72, h * 0.74);
    ctx.closePath();
    ctx.fill();

    // Overhead stalactites & foreground rocky flanks
    ctx.fillStyle = '#060812';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h * 0.28);
    ctx.lineTo(w * 0.72, h * 0.22);
    ctx.lineTo(w * 0.58, h * 0.32);
    ctx.lineTo(w * 0.48, h * 0.16);
    ctx.lineTo(w * 0.34, h * 0.3);
    ctx.lineTo(0, h * 0.24);
    ctx.closePath();
    ctx.fill();

    // Rim-lit cave floor + flickering cavern hearth glow + dripping stalactite droplet
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = pal.path;
    ctx.beginPath();
    ctx.moveTo(w * 0.24, h * 0.72);
    ctx.lineTo(w * 0.76, h * 0.72);
    ctx.lineTo(w * 0.92, h);
    ctx.lineTo(w * 0.08, h);
    ctx.closePath();
    ctx.fill();

    // Warm flickering cavern bounce light along inner rock wall
    const torchPulse = 0.14 + 0.06 * Math.sin(ts * 9.2) + 0.04 * Math.sin(ts * 17.5);
    const cg = ctx.createRadialGradient(w * 0.22, h * 0.64, 12 * s, w * 0.22, h * 0.64, 210 * s);
    cg.addColorStop(0, `rgba(255, 146, 52, ${torchPulse.toFixed(3)})`);
    cg.addColorStop(1, 'rgba(255, 146, 52, 0)');
    ctx.fillStyle = cg;
    ctx.fillRect(0, 0, w, h);

    // Falling stalactite water droplet + expanding puddle ripple
    const dropPhase = (ts * 0.65) % 1;
    const dropX = w * 0.58;
    if (dropPhase < 0.72) {
      const du = dropPhase / 0.72;
      const dropY = h * 0.32 + du * du * (h * 0.45);
      ctx.fillStyle = 'rgba(182, 228, 255, 0.72)';
      ctx.beginPath();
      ctx.ellipse(dropX, dropY, 2.2 * s, 5.5 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const ru = (dropPhase - 0.72) / 0.28;
      ctx.strokeStyle = `rgba(182, 228, 255, ${(0.55 * (1 - ru)).toFixed(3)})`;
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.ellipse(dropX, h * 0.77, (6 + ru * 34) * s, (2 + ru * 8) * s, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    return true;
  }

  if (stage === 'ocean_ship') {
    // Ocean Crossing / Ram Setu Bridge: Sweeping stylized indigo waves + Wooden Ship Prow / Stone Causeway
    ctx.fillStyle = '#071b2e';
    ctx.fillRect(0, h * 0.56, w, h * 0.44);

    // Animated layered chiaroscuro ocean swells
    for (let layer = 0; layer < 3; layer++) {
      const yBase = h * (0.62 + layer * 0.11);
      ctx.fillStyle = layer === 0 ? '#0d2b45' : layer === 1 ? '#091f36' : '#051221';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w + 40; x += 60 * s) {
        const wy = yBase + Math.sin(x * 0.014 + ts * (2.6 + layer) + layer * 2) * 14 * s;
        ctx.lineTo(x, wy);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    }

    // Wooden Indian ship deck / Ram Setu stone causeway in foreground
    const rock = Math.sin(ts * 2.2) * 4 * s;
    ctx.fillStyle = '#331c10';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.76 + rock);
    ctx.lineTo(w * 0.86, h * 0.76 - rock);
    ctx.lineTo(w * 0.96, h * 0.66 - rock);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    // Billowing sail silhouette on left
    ctx.fillStyle = pal.rimLight;
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.moveTo(w * 0.14, h * 0.18);
    ctx.quadraticCurveTo(w * 0.36, h * 0.42, w * 0.16, h * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    return true;
  }

  if (stage === 'bazaar_lane') {
    // Bustling Ancient Indian Bazaar: Tiered shop awnings, hanging silk pennants & glowing lanterns
    const shops = [
      [0.02, 0.34, 0.24, '#8f1b32'],
      [0.28, 0.4, 0.2, '#215968'],
      [0.54, 0.38, 0.2, '#8c4c1b'],
      [0.76, 0.32, 0.22, '#6b1c4c'],
    ] as const;
    for (const [sx, sy, sw, awning] of shops) {
      ctx.fillStyle = pal.farSil;
      ctx.fillRect(w * sx, h * sy, w * sw, h * (0.74 - sy));
      // Striped scalloped shop awning
      ctx.fillStyle = awning;
      ctx.beginPath();
      ctx.moveTo(w * sx - 8 * s, h * (sy + 0.12));
      ctx.lineTo(w * sx, h * sy);
      ctx.lineTo(w * (sx + sw), h * sy);
      ctx.lineTo(w * (sx + sw) + 8 * s, h * (sy + 0.12));
      ctx.closePath();
      ctx.fill();
      // Warm shop counter glow
      ctx.fillStyle = '#ffd15c';
      ctx.fillRect(w * (sx + sw * 0.18), h * (sy + 0.16), w * sw * 0.64, h * 0.12);
    }

    // Overhead bazaar garland & swaying glowing paper lanterns
    ctx.strokeStyle = '#ffd04d';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.2);
    ctx.quadraticCurveTo(w * 0.5, h * 0.3, w, h * 0.2);
    ctx.stroke();
    for (let li = 1; li <= 7; li++) {
      const lu = li / 8;
      const lx = w * lu;
      const ly = h * (0.2 + Math.sin(lu * Math.PI) * 0.05);
      const sway = Math.sin(ts * 3.1 + li * 1.2) * 5 * s;
      const flick = 0.88 + 0.12 * Math.sin(ts * 10 + li * 2);
      ctx.strokeStyle = '#ffd04d';
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + sway, ly + 14 * s);
      ctx.stroke();
      ctx.fillStyle = li % 2 === 0 ? '#ff6b4a' : '#ffd15c';
      ctx.beginPath();
      ctx.arc(lx + sway, ly + 20 * s, 7.5 * s * flick, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = pal.path;
    ctx.fillRect(0, h * 0.78, w, h * 0.14);
    return true;
  }

  if (stage === 'courtyard_well') {
    // Stone Village Courtyard & Iconic Circular Well (Lion & Clever Hare!)
    ctx.fillStyle = pal.farSil;
    ctx.fillRect(0, h * 0.44, w, h * 0.3);
    // Archway wall openings
    ctx.fillStyle = pal.skyLow;
    for (const ax of [0.22, 0.78]) {
      ctx.beginPath();
      ctx.arc(w * ax, h * 0.58, 52 * s, Math.PI, 0);
      ctx.fillRect(w * ax - 52 * s, h * 0.58, 104 * s, h * 0.16);
      ctx.fill();
    }
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);

    // Central carved stone well silhouette + wooden pulley frame
    const wx = w * 0.5;
    const wy = h * 0.74;
    ctx.fillStyle = '#3c4359';
    ctx.fillRect(wx - 78 * s, wy - 56 * s, 156 * s, 68 * s);
    ctx.fillStyle = pal.rimLight;
    ctx.fillRect(wx - 84 * s, wy - 62 * s, 168 * s, 10 * s);
    // Timber pulley arch + gently swaying bucket rope & shimmering well rim reflection
    ctx.fillStyle = '#24140d';
    ctx.fillRect(wx - 68 * s, wy - 148 * s, 10 * s, 92 * s);
    ctx.fillRect(wx + 58 * s, wy - 148 * s, 10 * s, 92 * s);
    ctx.fillRect(wx - 74 * s, wy - 154 * s, 148 * s, 10 * s);
    const ropeSway = Math.sin(ts * 2.1) * 7 * s;
    ctx.strokeStyle = '#d4b483';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.moveTo(wx, wy - 144 * s);
    ctx.lineTo(wx + ropeSway, wy - 96 * s);
    ctx.stroke();
    ctx.fillStyle = '#7a4522';
    ctx.fillRect(wx + ropeSway - 11 * s, wy - 98 * s, 22 * s, 18 * s);
    const shimmerAlpha = 0.2 + 0.18 * Math.sin(ts * 3.4);
    ctx.fillStyle = `rgba(170, 225, 255, ${shimmerAlpha.toFixed(3)})`;
    ctx.fillRect(wx - 52 * s, wy - 60 * s, 104 * s, 4 * s);
    return true;
  }

  if (stage === 'royal_dungeon') {
    // Iron-Barred Stone Dungeon with dramatic diagonal high-window moonlight beam
    ctx.fillStyle = '#070912';
    ctx.fillRect(0, 0, w, h);
    // Stone brick bands
    ctx.fillStyle = pal.farSil;
    ctx.fillRect(w * 0.08, h * 0.12, w * 0.84, h * 0.62);
    // High barred skylight + breathing slanted moonlight beam + drifting dust motes
    ctx.fillStyle = pal.moon;
    ctx.fillRect(w * 0.42, h * 0.16, w * 0.16, h * 0.12);
    const beamAlpha = 0.12 + 0.04 * Math.sin(ts * 1.9);
    ctx.fillStyle = `rgba(220, 236, 255, ${beamAlpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(w * 0.42, h * 0.28);
    ctx.lineTo(w * 0.58, h * 0.28);
    ctx.lineTo(w * 0.78, h);
    ctx.lineTo(w * 0.26, h);
    ctx.closePath();
    ctx.fill();
    // Drifting dungeon dust specks inside the skylight cone
    ctx.fillStyle = 'rgba(230, 244, 255, 0.52)';
    for (let d = 0; d < 8; d++) {
      const du = (ts * 0.08 + d * 0.13) % 1;
      const dx = w * (0.43 + du * 0.14) + Math.sin(ts * 1.5 + d * 2.3) * 18 * s;
      const dy = h * (0.3 + du * 0.46);
      ctx.beginPath();
      ctx.arc(dx, dy, (1.5 + (d % 2)) * s, 0, Math.PI * 2);
      ctx.fill();
    }
    // Swaying hanging iron chain on left cell wall
    const chainSway = Math.sin(ts * 1.8) * 6 * s;
    ctx.strokeStyle = '#1a2030';
    ctx.lineWidth = 3.5 * s;
    ctx.beginPath();
    ctx.moveTo(w * 0.24, h * 0.14);
    ctx.quadraticCurveTo(w * 0.24 + chainSway, h * 0.28, w * 0.24 + chainSway * 1.4, h * 0.42);
    ctx.stroke();
    // Vertical iron cell bars
    ctx.fillStyle = '#04050a';
    for (let i = 0; i < 9; i++) {
      const bx = w * (0.1 + i * 0.1);
      ctx.fillRect(bx, 0, 8 * s, h * 0.74);
    }
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    return true;
  }

  if (stage === 'desert_caravan') {
    // Sweeping Starlit Thar Dunes & Distant Caravan Silhouette
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.72);
    ctx.quadraticCurveTo(w * 0.28, h * 0.5, w * 0.58, h * 0.66);
    ctx.quadraticCurveTo(w * 0.82, h * 0.76, w, h * 0.58);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Foreground sweeping dune ridge with rim light
    ctx.fillStyle = pal.ground;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.76);
    ctx.quadraticCurveTo(w * 0.45, h * 0.66, w, h * 0.78);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = pal.rimLight;
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.76);
    ctx.quadraticCurveTo(w * 0.45, h * 0.66, w, h * 0.78);
    ctx.stroke();

    // Twinkling desert stars
    ctx.fillStyle = '#fff5d6';
    for (let i = 0; i < 16; i++) {
      const sx = ((i * 137) % 94 + 3) * 0.01 * w;
      const sy = ((i * 53) % 42 + 6) * 0.01 * h;
      const r = (1.5 + (i % 3)) * s * (0.7 + 0.3 * Math.sin(ts * 4 + i));
      ctx.fillRect(sx, sy, r, r);
    }
    return true;
  }

  if (stage === 'cremation_ground') {
    // Haunting Smoldering Cremation Ground (Shamshan Ghat) — Vikram & Betaal / Tantrik Lore
    // 1. Eerie low crimson-amber horizon ember haze
    const emberGrad = ctx.createLinearGradient(0, h * 0.34, 0, h * 0.78);
    emberGrad.addColorStop(0, 'rgba(255, 72, 34, 0)');
    emberGrad.addColorStop(0.65, 'rgba(184, 34, 24, 0.28)');
    emberGrad.addColorStop(1, 'rgba(255, 118, 38, 0.42)');
    ctx.fillStyle = emberGrad;
    ctx.fillRect(0, h * 0.34, w, h * 0.44);

    // 2. Distant dark river bank & stepped stone ghat silhouette
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.64);
    ctx.lineTo(w * 0.24, h * 0.58);
    ctx.lineTo(w * 0.48, h * 0.62);
    ctx.lineTo(w * 0.76, h * 0.56);
    ctx.lineTo(w, h * 0.63);
    ctx.lineTo(w, h * 0.78);
    ctx.lineTo(0, h * 0.78);
    ctx.closePath();
    ctx.fill();

    // 3. Twin ancient gnarled banyan/peepal silhouettes framing the ghat
    ctx.fillStyle = '#06070f';
    // Left gnarled tree
    ctx.beginPath();
    ctx.moveTo(0, h * 0.76);
    ctx.lineTo(w * 0.04, h * 0.28);
    ctx.lineTo(w * 0.22, h * 0.19);
    ctx.lineTo(w * 0.19, h * 0.24);
    ctx.lineTo(w * 0.08, h * 0.36);
    ctx.lineTo(w * 0.12, h * 0.76);
    ctx.closePath();
    ctx.fill();
    // Right twisted deadwood branch
    ctx.beginPath();
    ctx.moveTo(w, h * 0.76);
    ctx.lineTo(w * 0.92, h * 0.32);
    ctx.lineTo(w * 0.75, h * 0.22);
    ctx.lineTo(w * 0.79, h * 0.27);
    ctx.lineTo(w * 0.88, h * 0.4);
    ctx.lineTo(w * 0.88, h * 0.76);
    ctx.closePath();
    ctx.fill();

    // Hanging spectral aerial roots
    ctx.strokeStyle = 'rgba(10, 12, 24, 0.85)';
    ctx.lineWidth = 2.6 * s;
    for (const [rx, ry0, ry1] of [
      [0.14, 0.23, 0.52],
      [0.18, 0.21, 0.45],
      [0.81, 0.25, 0.5],
      [0.85, 0.28, 0.55],
    ]) {
      const sway = Math.sin(ts * 1.9 + rx * 10) * 4 * s;
      ctx.beginPath();
      ctx.moveTo(w * rx, h * ry0);
      ctx.quadraticCurveTo(w * rx + sway, h * ((ry0 + ry1) * 0.5), w * rx + sway * 1.4, h * ry1);
      ctx.stroke();
    }

    // 4. Midground Smoldering Funeral Pyres with animated 24fps flame tongues
    const pyres = [
      { x: w * 0.34, y: h * 0.72, sc: 0.95 },
      { x: w * 0.66, y: h * 0.71, sc: 0.78 },
    ];
    for (let idx = 0; idx < pyres.length; idx++) {
      const p = pyres[idx];
      const flick = Math.sin(ts * 11 + idx * 2.4) * 7 * s * p.sc;
      // Warm radial glow around pyre
      const pg = ctx.createRadialGradient(p.x, p.y - 16 * s, 8 * s, p.x, p.y - 16 * s, 115 * s * p.sc);
      pg.addColorStop(0, 'rgba(255, 168, 56, 0.46)');
      pg.addColorStop(0.5, 'rgba(230, 48, 34, 0.22)');
      pg.addColorStop(1, 'rgba(230, 48, 34, 0)');
      ctx.fillStyle = pg;
      ctx.fillRect(p.x - 120 * s, p.y - 130 * s, 240 * s, 160 * s);

      // Crossed dark wood pyre logs
      ctx.fillStyle = '#140b0a';
      ctx.fillRect(p.x - 42 * s * p.sc, p.y - 10 * s * p.sc, 84 * s * p.sc, 14 * s * p.sc);
      ctx.fillStyle = '#29120e';
      ctx.fillRect(p.x - 34 * s * p.sc, p.y - 18 * s * p.sc, 68 * s * p.sc, 10 * s * p.sc);

      // Outer crimson flame
      ctx.fillStyle = '#e83824';
      ctx.beginPath();
      ctx.moveTo(p.x - 28 * s * p.sc, p.y - 14 * s * p.sc);
      ctx.quadraticCurveTo(p.x - 16 * s * p.sc, p.y - 54 * s * p.sc, p.x + flick * 0.4, p.y - 76 * s * p.sc - Math.abs(flick));
      ctx.quadraticCurveTo(p.x + 22 * s * p.sc, p.y - 48 * s * p.sc, p.x + 28 * s * p.sc, p.y - 14 * s * p.sc);
      ctx.closePath();
      ctx.fill();

      // Inner incandescent amber core
      ctx.fillStyle = '#ffd152';
      ctx.beginPath();
      ctx.moveTo(p.x - 14 * s * p.sc, p.y - 14 * s * p.sc);
      ctx.quadraticCurveTo(p.x - 6 * s * p.sc, p.y - 36 * s * p.sc, p.x - flick * 0.3, p.y - 48 * s * p.sc);
      ctx.quadraticCurveTo(p.x + 10 * s * p.sc, p.y - 32 * s * p.sc, p.x + 14 * s * p.sc, p.y - 14 * s * p.sc);
      ctx.closePath();
      ctx.fill();

      // Rising drifting smoke wisps
      for (let k = 0; k < 3; k++) {
        const sp = (ts * 0.35 + k * 0.33 + idx * 0.19) % 1;
        ctx.fillStyle = `rgba(180, 176, 194, ${Math.sin(sp * Math.PI) * 0.16})`;
        ctx.beginPath();
        ctx.arc(p.x + Math.sin(sp * 5 + k) * 22 * s, p.y - 68 * s - sp * 115 * s, (12 + sp * 20) * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Stepped stone ghat foreground & ash-dusted earth
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = pal.path;
    ctx.fillRect(0, h * 0.72, w, 8 * s);
    ctx.fillStyle = 'rgba(255, 134, 62, 0.24)';
    ctx.fillRect(w * 0.18, h * 0.72, w * 0.64, 3 * s);
    // Scattered carved stone ritual steps
    ctx.fillStyle = 'rgba(18, 22, 38, 0.65)';
    ctx.fillRect(0, h * 0.79, w, 4 * s);
    ctx.fillRect(0, h * 0.87, w, 4 * s);
    return true;
  }

  return false;
}

// =========================================================================
// 2. ENCYCLOPEDIC CAST ARCHETYPES (12 NEW RIGS -> 34 TOTAL)
// =========================================================================
export function isEncyclopedicArchetype(arch: ArchetypeId): boolean {
  return (
    arch === 'deva' ||
    arch === 'goddess' ||
    arch === 'demon_king' ||
    arch === 'vanara_hero' ||
    arch === 'child' ||
    arch === 'elder_woman' ||
    arch === 'guard' ||
    arch === 'bull' ||
    arch === 'hare' ||
    arch === 'crane' ||
    arch === 'mouse' ||
    arch === 'dog'
  );
}

function drawEyesSimple(
  ctx: CanvasRenderingContext2D,
  expression: ExpressionId,
  accent: string,
  t: number,
  speechEnergy: number,
  glowing = false,
  eyeX = 28,
  eyeY = -8
): void {
  drawUnifiedEyePair(ctx, expression, accent, t, speechEnergy, {
    glowing,
    eyeX,
    eyeY,
  });
}

export function drawEncyclopedicActorCloseUp(
  ctx: CanvasRenderingContext2D,
  cast: CastMember,
  expression: ExpressionId,
  viseme: number,
  speechEnergy: number,
  lightSide: 'left' | 'right',
  t: number
): boolean {
  const arch = cast.archetype;
  if (!isEncyclopedicArchetype(arch)) return false;

  const ts = snap24(t);
  const lightRight = lightSide === 'right';
  const skin = cast.skinColor || '#e09a6e';
  const skinShadow = darkenHex(skin, 0.56);
  const mouthH = Math.round(4 + getVisemeAperture(viseme) * 9.5);

  ctx.save();
  ctx.rotate(
    Math.sin(ts * 2.2) * 0.025 + (speechEnergy > 0.5 ? 0.02 : 0) + getExpressionHeadTilt(expression)
  );

  // 1. EPIC & DIVINE + HUMAN ARCHETYPES
  if (
    arch === 'deva' ||
    arch === 'goddess' ||
    arch === 'demon_king' ||
    arch === 'vanara_hero' ||
    arch === 'child' ||
    arch === 'elder_woman' ||
    arch === 'guard'
  ) {
    // Divine Sunburst Halo for Deva & Goddess
    if (arch === 'deva' || arch === 'goddess') {
      ctx.fillStyle = 'rgba(255, 217, 84, 0.22)';
      ctx.beginPath();
      ctx.arc(0, -14, 134, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = cast.accentColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, -14, 108, 0, Math.PI * 2);
      ctx.stroke();
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

    // Hair / Veil behind head
    if (arch === 'goddess' || arch === 'elder_woman') {
      ctx.fillStyle = arch === 'elder_woman' ? '#cfd6e3' : '#080a14';
      ctx.beginPath();
      ctx.moveTo(-84, -46);
      ctx.lineTo(84, -46);
      ctx.lineTo(106, 102);
      ctx.lineTo(-106, 102);
      ctx.closePath();
      ctx.fill();
    } else if (arch === 'vanara_hero') {
      // Heroic Vanara ears
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(-68, -10, 26, 0, Math.PI * 2);
      ctx.arc(68, -10, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    // Head Base + Half Chiaroscuro Shadow
    const hScale = arch === 'child' ? 0.86 : 1;
    ctx.save();
    ctx.scale(hScale, hScale);
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.moveTo(-64, -54);
    ctx.lineTo(64, -54);
    ctx.lineTo(58, 24);
    ctx.lineTo(24, 72);
    ctx.lineTo(-24, 72);
    ctx.lineTo(-58, 24);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = skinShadow;
    ctx.fillRect(lightRight ? -90 : 0, -90, 90, 200);
    ctx.restore();

    // Forehead Tilak / Bindi / Sacred Mark
    if (arch === 'deva' || arch === 'vanara_hero') {
      ctx.fillStyle = '#ff3855';
      ctx.fillRect(-4, -44, 8, 24);
      ctx.fillStyle = '#fff5cc';
      ctx.fillRect(-9, -42, 3, 20);
      ctx.fillRect(6, -42, 3, 20);
    } else if (arch === 'goddess' || arch === 'elder_woman') {
      ctx.fillStyle = '#ff1c42';
      ctx.beginPath();
      ctx.arc(0, -34, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (arch === 'demon_king') {
      ctx.fillStyle = '#ffd04d';
      ctx.fillRect(-30, -40, 60, 5);
      ctx.fillRect(-24, -31, 48, 5);
    }

    drawEyesSimple(ctx, expression, cast.accentColor, t, speechEnergy, arch === 'demon_king');

    // Demon King Mustache & Fangs
    if (arch === 'demon_king') {
      ctx.fillStyle = '#07060d';
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(-52, 34);
      ctx.lineTo(-34, 42);
      ctx.lineTo(0, 28);
      ctx.lineTo(34, 42);
      ctx.lineTo(52, 34);
      ctx.closePath();
      ctx.fill();
    }

    // Expressive Mouth Viseme (Unified FACS Engine)
    drawUnifiedMouth(ctx, expression, viseme, {
      y: 38,
      fanged: arch === 'demon_king',
    });

    // Headwear
    if (arch === 'deva' || arch === 'goddess') {
      ctx.fillStyle = cast.accentColor;
      ctx.beginPath();
      ctx.moveTo(-48, -42);
      ctx.lineTo(-30, -90);
      ctx.lineTo(0, -130);
      ctx.lineTo(30, -90);
      ctx.lineTo(48, -42);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ff173d';
      ctx.beginPath();
      ctx.arc(0, -68, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (arch === 'demon_king') {
      // Iconic Towering Ten-Crest Ravana / Asura Crown!
      ctx.fillStyle = '#d99a26';
      ctx.beginPath();
      ctx.moveTo(-66, -38);
      ctx.lineTo(-78, -96);
      ctx.lineTo(-40, -76);
      ctx.lineTo(-26, -124);
      ctx.lineTo(0, -142);
      ctx.lineTo(26, -124);
      ctx.lineTo(40, -76);
      ctx.lineTo(78, -96);
      ctx.lineTo(66, -38);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ff173d';
      ctx.beginPath();
      ctx.arc(0, -72, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (arch === 'vanara_hero') {
      // Golden Mukut headband with glowing crown jewel
      ctx.fillStyle = cast.accentColor;
      ctx.fillRect(-58, -56, 116, 16);
      ctx.beginPath();
      ctx.moveTo(-22, -56);
      ctx.lineTo(0, -92);
      ctx.lineTo(22, -56);
      ctx.closePath();
      ctx.fill();
    } else if (arch === 'guard') {
      // Turbaned Sentinel Helmet
      ctx.fillStyle = cast.primaryColor;
      ctx.beginPath();
      ctx.moveTo(-54, -34);
      ctx.lineTo(-42, -76);
      ctx.lineTo(0, -92);
      ctx.lineTo(42, -76);
      ctx.lineTo(54, -34);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = cast.accentColor;
      ctx.fillRect(-48, -48, 96, 8);
    } else if (arch === 'elder_woman') {
      // Draped Pallu Hood framing face
      ctx.strokeStyle = cast.primaryColor;
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.arc(0, 6, 72, Math.PI * 0.92, Math.PI * 2.08);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
    return true;
  }

  // 2. LOAD-BEARING FABLE FAUNA (Bull, Hare, Crane, Mouse, Dog)
  if (arch === 'bull') {
    // Noble Bull / Ox (Panchatantra Sanjivaka) with Sweeping Curved Horns!
    ctx.strokeStyle = '#f2ead8';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-42, -46); ctx.quadraticCurveTo(-112, -56, -98, -124);
    ctx.moveTo(42, -46); ctx.quadraticCurveTo(112, -56, 98, -124);
    ctx.stroke();

    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.moveTo(-58, -54);
    ctx.lineTo(58, -54);
    ctx.lineTo(48, 22);
    ctx.lineTo(36, 74);
    ctx.lineTo(-36, 74);
    ctx.lineTo(-48, 22);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.62);
    ctx.fillRect(lightRight ? -80 : 0, -80, 80, 180);
    ctx.restore();

    drawEyesSimple(ctx, expression, cast.accentColor, t, speechEnergy, false, 30, -14);
    // Broad snout & golden nose ring
    ctx.fillStyle = '#292220';
    ctx.fillRect(-34, 42, 68, 26);
    ctx.strokeStyle = cast.accentColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 66, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return true;
  }

  if (arch === 'hare') {
    // Clever Hare / Rabbit with Tall Upright Ears!
    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.ellipse(-28, -104, 18, 62, -0.14, 0, Math.PI * 2);
    ctx.ellipse(28, -104, 18, 62, 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cast.accentColor;
    ctx.beginPath();
    ctx.ellipse(-28, -102, 8, 42, -0.14, 0, Math.PI * 2);
    ctx.ellipse(28, -102, 8, 42, 0.14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.arc(0, 2, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.65);
    ctx.fillRect(lightRight ? -70 : 0, -70, 70, 150);
    ctx.restore();

    drawEyesSimple(ctx, expression, cast.accentColor, t, speechEnergy, false, 24, -12);
    ctx.fillStyle = cast.accentColor;
    ctx.beginPath();
    ctx.arc(0, 16, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#180c12';
    ctx.fillRect(-16, 28, 32, Math.max(4, mouthH * 0.6));
    ctx.restore();
    return true;
  }

  if (arch === 'crane') {
    // Tall River Crane / Swan with Sleek Curved Neck & Long Pointed Golden Beak!
    ctx.fillStyle = cast.primaryColor;
    ctx.fillRect(-24, 24, 48, 160);
    ctx.beginPath();
    ctx.arc(0, -12, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.72);
    ctx.fillRect(lightRight ? -60 : 0, -70, 60, 140);
    ctx.restore();

    // Red crown tuft
    ctx.fillStyle = '#e6223c';
    ctx.beginPath();
    ctx.arc(0, -54, 16, Math.PI, 0);
    ctx.fill();

    drawEyesSimple(ctx, expression, cast.accentColor, t, speechEnergy, false, 22, -20);

    // Articulated long spear beak
    const gap = getVisemeAperture(viseme) * 6;
    ctx.fillStyle = cast.accentColor;
    ctx.beginPath();
    ctx.moveTo(-18, 4); ctx.lineTo(18, 4); ctx.lineTo(0, 78 - gap * 0.2); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = darkenHex(cast.accentColor, 0.7);
    ctx.beginPath();
    ctx.moveTo(-14, 14 + gap); ctx.lineTo(14, 14 + gap); ctx.lineTo(0, 74 + gap); ctx.closePath();
    ctx.fill();
    ctx.restore();
    return true;
  }

  if (arch === 'mouse') {
    // Clever Mouse / Rat with Big Round Ears & Pointed Whiskered Snout!
    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.arc(-62, -52, 40, 0, Math.PI * 2);
    ctx.arc(62, -52, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cast.accentColor;
    ctx.beginPath();
    ctx.arc(-62, -52, 24, 0, Math.PI * 2);
    ctx.arc(62, -52, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.moveTo(-58, -42); ctx.lineTo(58, -42); ctx.lineTo(0, 68); ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.58);
    ctx.fillRect(lightRight ? -70 : 0, -60, 70, 140);
    ctx.restore();

    drawEyesSimple(ctx, expression, cast.accentColor, t, speechEnergy, false, 24, -18);
    ctx.fillStyle = cast.accentColor;
    ctx.beginPath();
    ctx.arc(0, 58, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return true;
  }

  if (arch === 'dog') {
    // Loyal Dog / Wolf with Floppy/Pointed Ears & Expressive Muzzle
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.65);
    ctx.beginPath();
    ctx.moveTo(-54, -44); ctx.lineTo(-84, 12); ctx.lineTo(-42, 16); ctx.closePath();
    ctx.moveTo(54, -44); ctx.lineTo(84, 12); ctx.lineTo(42, 16); ctx.closePath();
    ctx.fill();

    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.moveTo(-58, -50); ctx.lineTo(58, -50); ctx.lineTo(48, 22); ctx.lineTo(22, 70); ctx.lineTo(-22, 70); ctx.lineTo(-48, 22);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.56);
    ctx.fillRect(lightRight ? -70 : 0, -70, 70, 160);
    ctx.restore();

    drawEyesSimple(ctx, expression, cast.accentColor, t, speechEnergy, false, 26, -14);
    ctx.fillStyle = '#120a0d';
    ctx.beginPath();
    ctx.moveTo(-16, 22); ctx.lineTo(16, 22); ctx.lineTo(0, 38); ctx.closePath();
    ctx.fill();
    ctx.fillRect(-20, 42, 40, Math.max(4, mouthH * 0.7));
    ctx.restore();
    return true;
  }

  ctx.restore();
  return false;
}

export function drawEncyclopedicActorFullBody(
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
  if (!isEncyclopedicArchetype(arch)) return false;
  const ts = snap24(t);

  // Humanoid epic/folk archetypes delegate to the shared articulated humanoid body rig in renderAssets.ts!
  if (
    arch === 'deva' ||
    arch === 'goddess' ||
    arch === 'demon_king' ||
    arch === 'vanara_hero' ||
    arch === 'child' ||
    arch === 'elder_woman' ||
    arch === 'guard'
  ) {
    return false;
  }

  if (arch === 'bull' || arch === 'dog') {
    const isBull = arch === 'bull';
    ctx.fillStyle = darkenHex(cast.primaryColor, 0.68);
    ctx.fillRect(-38 - stride * 0.5, -48, isBull ? 16 : 12, 48);
    ctx.fillRect(16 + stride * 0.5, -48, isBull ? 16 : 12, 48);
    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.moveTo(-46, -42);
    ctx.lineTo(-34, isBull ? -96 : -78);
    ctx.lineTo(36, isBull ? -92 : -80);
    ctx.lineTo(44, -42);
    ctx.closePath();
    ctx.fill();
    if (isBull) {
      // Sacred hump
      ctx.beginPath();
      ctx.arc(16, -94, 22, Math.PI, 0);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(42, isBull ? -96 : -84);
    ctx.scale(0.36, 0.36);
    drawEncyclopedicActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', t);
    ctx.restore();
    return true;
  }

  if (arch === 'hare' || arch === 'mouse') {
    const isMouse = arch === 'mouse';
    if (isMouse) {
      ctx.strokeStyle = cast.accentColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-24, -18);
      ctx.quadraticCurveTo(-72, -10 + Math.sin(ts * 6) * 8, -76, -34);
      ctx.stroke();
    }
    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.ellipse(0, -32, isMouse ? 28 : 30, isMouse ? 22 : 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(isMouse ? 24 : 10, isMouse ? -48 : -72);
    ctx.scale(0.32, 0.32);
    drawEncyclopedicActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', t);
    ctx.restore();
    return true;
  }

  if (arch === 'crane') {
    // Tall slender stilt legs + graceful oval body + S-curved neck
    ctx.strokeStyle = cast.accentColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-8, -56); ctx.lineTo(-10 - stride * 0.4, 0);
    ctx.moveTo(8, -56); ctx.lineTo(10 + stride * 0.4, 0);
    ctx.stroke();
    ctx.fillStyle = cast.primaryColor;
    ctx.beginPath();
    ctx.ellipse(0, -76, 36, 24, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(10, -134, 14, 56);
    if (pose === 'soar') {
      const flap = Math.sin(ts * 14) * 26;
      ctx.beginPath();
      ctx.moveTo(-8, -82); ctx.lineTo(-78, -110 - flap); ctx.lineTo(-42, -62); ctx.closePath();
      ctx.fill();
    }
    ctx.save();
    ctx.translate(22, -136);
    ctx.scale(0.3, 0.3);
    drawEncyclopedicActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', t);
    ctx.restore();
    return true;
  }

  return false;
}

// =========================================================================
// 3. ENCYCLOPEDIC STORYTELLING PROPS (12 NEW PROPS -> 34 HERO PROPS)
// =========================================================================
export function drawEncyclopedicStoryProp(
  ctx: CanvasRenderingContext2D,
  prop: PropId,
  t: number
): boolean {
  const ts = snap24(t);

  if (prop === 'gada_mace') {
    // Hanuman / Bhima Golden War Mace with heroic heft sway & gleaming crest pulse
    ctx.rotate(-0.35 + Math.sin(ts * 3.1) * 0.05);
    const glow = 0.16 + 0.1 * Math.sin(ts * 5.2);
    ctx.fillStyle = `rgba(255, 212, 82, ${glow.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(0, -48, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d49d35';
    ctx.fillRect(-7, -26, 14, 96);
    ctx.fillStyle = '#ffd452';
    ctx.beginPath();
    ctx.arc(0, -48, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#996515';
    ctx.beginPath();
    ctx.arc(0, -48, 36, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();
    ctx.fillStyle = '#fff0a6';
    ctx.beginPath();
    ctx.moveTo(-12, -84); ctx.lineTo(0, -108); ctx.lineTo(12, -84); ctx.closePath();
    ctx.fill();
    // Sweeping specular gleam
    const gA = 0.4 + 0.5 * Math.max(0, Math.sin(ts * 4.4));
    ctx.fillStyle = `rgba(255, 255, 230, ${gA.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(14, -60, 7, 0, Math.PI * 2);
    ctx.fill();
    return true;
  }

  if (prop === 'sudarshana_chakra') {
    // Spinning Golden Celestial Disc with Serrated Blades, Pulsing Halo & Orbiting Sparks
    const haloPulse = 78 + Math.sin(ts * 8) * 9;
    ctx.fillStyle = 'rgba(255, 212, 82, 0.26)';
    ctx.beginPath();
    ctx.arc(0, 0, haloPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.rotate(ts * 6.5);
    ctx.fillStyle = '#ffd452';
    for (let i = 0; i < 12; i++) {
      ctx.save();
      ctx.rotate((i / 12) * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(42, -8); ctx.lineTo(74, 0); ctx.lineTo(42, 10); ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = '#fff2b2';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // Orbiting divine sparks
    ctx.fillStyle = '#fff7cc';
    for (let sp = 0; sp < 4; sp++) {
      const ang = -ts * 5.2 + sp * (Math.PI * 0.5);
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * 76, Math.sin(ang) * 76, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    return true;
  }

  if (prop === 'trishul') {
    // Sacred Trident Trishul with Crimson Damaru Ribbon
    ctx.fillStyle = '#ffd452';
    ctx.fillRect(-5, -40, 10, 118);
    // Center prong
    ctx.beginPath();
    ctx.moveTo(-8, -36); ctx.lineTo(0, -106); ctx.lineTo(8, -36); ctx.closePath();
    ctx.fill();
    // Outer curved prongs
    ctx.strokeStyle = '#ffd452';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-36, -82); ctx.quadraticCurveTo(-36, -30, 0, -34);
    ctx.quadraticCurveTo(36, -30, 36, -82);
    ctx.stroke();
    // Crimson ribbon flutter
    ctx.fillStyle = '#ff1c42';
    ctx.beginPath();
    ctx.moveTo(5, -22); ctx.lineTo(42 + Math.sin(ts * 8) * 6, -10); ctx.lineTo(5, -2); ctx.closePath();
    ctx.fill();
    return true;
  }

  if (prop === 'sanjevani_mountain') {
    // Hanuman's Glowing Dronagiri Herb Mountain floating with emerald radiance!
    const hover = Math.sin(ts * 3.5) * 8;
    ctx.translate(0, hover);
    ctx.fillStyle = 'rgba(110, 255, 178, 0.24)';
    ctx.beginPath();
    ctx.arc(0, -24, 92, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#303b54';
    ctx.beginPath();
    ctx.moveTo(-78, 36); ctx.lineTo(-34, -52); ctx.lineTo(0, -86); ctx.lineTo(44, -46); ctx.lineTo(82, 36);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5c729c';
    ctx.beginPath();
    ctx.moveTo(0, -86); ctx.lineTo(44, -46); ctx.lineTo(82, 36); ctx.lineTo(0, 36); ctx.closePath();
    ctx.fill();
    // Glowing Sanjeevani herbs across crest
    for (const [hx, hy] of [[-18, -42], [4, -64], [24, -36], [-6, -24]]) {
      ctx.fillStyle = '#6bffb0';
      ctx.beginPath();
      ctx.arc(hx, hy, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    return true;
  }

  if (prop === 'signet_ring') {
    // Royal Engraved Signet Ring (Rama's Ring to Sita!) with pulsing halo & 4-point star glint
    const haloR = 64 + Math.sin(ts * 4.5) * 8;
    ctx.fillStyle = 'rgba(255, 214, 92, 0.26)';
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffd24d';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(0, 8, 38, 0, Math.PI * 2);
    ctx.stroke();
    // Engraved ruby seal crest
    ctx.fillStyle = '#ffd24d';
    ctx.fillRect(-20, -44, 40, 22);
    ctx.fillStyle = '#ff173d';
    ctx.beginPath();
    ctx.moveTo(0, -48); ctx.lineTo(14, -33); ctx.lineTo(0, -18); ctx.lineTo(-14, -33); ctx.closePath();
    ctx.fill();
    // Twinkling 4-point royal diamond sparkle
    const sp = 9 + Math.sin(ts * 9) * 5;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(10, -42 - sp); ctx.lineTo(13, -42); ctx.lineTo(10 + sp, -42); ctx.lineTo(13, -39);
    ctx.lineTo(10, -42 + sp); ctx.lineTo(7, -39); ctx.lineTo(10 - sp, -42); ctx.lineTo(7, -42);
    ctx.closePath();
    ctx.fill();
    return true;
  }

  if (prop === 'stone_well') {
    // Circular Stone Reflection Well (Lion & Clever Hare!) with dual concentric ripples
    ctx.fillStyle = '#3f4a63';
    ctx.fillRect(-72, -16, 144, 62);
    ctx.fillStyle = '#6c7c9e';
    ctx.beginPath();
    ctx.ellipse(0, -16, 74, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0d2e47';
    ctx.beginPath();
    ctx.ellipse(0, -16, 56, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // Shimmering dual reflection rings
    for (let ri = 0; ri < 2; ri++) {
      const rp = (ts * 24 + ri * 18) % 36;
      const alpha = (1 - rp / 36) * 0.65;
      ctx.strokeStyle = `rgba(170, 225, 255, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, -16, 10 + rp, 2.5 + rp * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    return true;
  }

  if (prop === 'wooden_cage') {
    // Subtle pendulum sway on the wooden trap cage
    ctx.save();
    ctx.rotate(Math.sin(ts * 2.8) * 0.045);
    ctx.fillStyle = '#472814';
    ctx.fillRect(-68, -56, 136, 14);
    ctx.fillRect(-68, 34, 136, 14);
    for (let x = -58; x <= 58; x += 23) {
      ctx.fillStyle = '#7a4a26';
      ctx.fillRect(x, -42, 8, 76);
    }
    ctx.restore();
    return true;
  }

  if (prop === 'flying_stick') {
    // Bamboo pole carried mid-air (Talkative Tortoise!)
    const bob = Math.sin(ts * 6) * 8;
    ctx.translate(0, bob);
    ctx.fillStyle = '#b88a44';
    ctx.fillRect(-108, -6, 216, 12);
    ctx.fillStyle = '#5c421a';
    for (const bx of [-60, 0, 60]) ctx.fillRect(bx - 2, -6, 4, 12);
    return true;
  }

  if (prop === 'royal_palanquin') {
    // Rhythmic bearer march bob + fluttering crimson silk curtain
    const marchBob = Math.abs(Math.sin(ts * 4.2)) * -7;
    const marchTilt = Math.sin(ts * 4.2) * 0.025;
    ctx.save();
    ctx.translate(0, marchBob);
    ctx.rotate(marchTilt);
    ctx.fillStyle = '#d49d35';
    ctx.fillRect(-118, 6, 236, 10);
    ctx.fillStyle = '#99182e';
    ctx.fillRect(-64, -44, 128, 68);
    // Fluttering silk curtain hem
    const hemWave = Math.sin(ts * 7) * 5;
    ctx.fillStyle = '#d42646';
    ctx.beginPath();
    ctx.moveTo(-58, -32);
    ctx.lineTo(58, -32);
    ctx.lineTo(54 + hemWave, 14);
    ctx.lineTo(-54 + hemWave, 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd24d';
    ctx.beginPath();
    ctx.moveTo(-76, -44); ctx.quadraticCurveTo(0, -76, 76, -44); ctx.closePath();
    ctx.fill();
    ctx.restore();
    return true;
  }

  if (prop === 'poison_chalice') {
    ctx.fillStyle = '#d49d35';
    ctx.fillRect(-26, 38, 52, 10);
    ctx.fillRect(-6, 4, 12, 34);
    ctx.beginPath();
    ctx.moveTo(-36, -34); ctx.lineTo(36, -34); ctx.lineTo(18, 8); ctx.lineTo(-18, 8); ctx.closePath();
    ctx.fill();
    // Rising emerald poison fumes
    for (let i = 0; i < 4; i++) {
      const p = (ts * 0.65 + i * 0.25) % 1;
      ctx.fillStyle = `rgba(90, 245, 145, ${Math.sin(p * Math.PI) * 0.65})`;
      ctx.beginPath();
      ctx.arc(Math.sin(p * 6 + i) * 18, -42 - p * 68, 8 + p * 12, 0, Math.PI * 2);
      ctx.fill();
    }
    return true;
  }

  if (prop === 'golden_egg') {
    // Breathing golden radiance + gentle wobble rock
    const auraR = 64 + Math.sin(ts * 4.4) * 9;
    ctx.fillStyle = 'rgba(255, 214, 92, 0.28)';
    ctx.beginPath();
    ctx.arc(0, 0, auraR, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.rotate(Math.sin(ts * 3.2) * 0.055);
    ctx.fillStyle = '#ffd452';
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff5cc';
    ctx.beginPath();
    ctx.ellipse(10, -14, 8, 16, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return true;
  }

  if (prop === 'hand_mirror') {
    // Sweeping diagonal glass gleam + subtle handheld tilt
    ctx.save();
    ctx.rotate(Math.sin(ts * 2.4) * 0.045);
    ctx.fillStyle = '#d49d35';
    ctx.fillRect(-7, 26, 14, 54);
    ctx.beginPath();
    ctx.ellipse(0, -14, 42, 52, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cfe8ff';
    ctx.beginPath();
    ctx.ellipse(0, -14, 32, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    const sweep = ((ts * 38) % 64) - 32;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, -14, 31, 41, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.beginPath();
    ctx.moveTo(sweep - 10, -58);
    ctx.lineTo(sweep + 6, -58);
    ctx.lineTo(sweep - 22, 32);
    ctx.lineTo(sweep - 38, 32);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.restore();
    return true;
  }

  return false;
}
