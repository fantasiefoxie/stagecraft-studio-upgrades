/**
 * Stagecraft Studio — Wave 3 Universal Multi-Genre Procedural Canvas 2D Assets
 *
 * Adds:
 * - +20 Multi-Layer Stage Backdrops (StageId: 30 -> 50)
 * - +20 Multi-Genre Character Archetypes (ArchetypeId: 40 -> 60)
 * - +24 Iconic Story Props (PropId: 41 -> 65)
 * - +6 Weather Systems (WeatherId: 6 -> 12)
 * - +6 Reactive Crowd Silhouette Layers (CrowdId: 6 -> 12)
 * - +8 Kinetic Beat FX Overlays (FxId: 6 -> 14)
 *
 * Strictly deterministic: zero offscreen allocations, zero non-deterministic RNG.
 * Every visual plugs into the single unified Canvas 2D pipeline so all 20 art engines
 * automatically stylize every asset.
 */
import {
  ArchetypeId,
  CastMember,
  CrowdId,
  ExpressionId,
  FxId,
  PoseId,
  PropId,
  StageId,
  StoryBeat,
  WeatherId,
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
  const r = Math.max(0, Math.min(255, Math.round(parseInt(clean.slice(0, 2), 16) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(parseInt(clean.slice(2, 4), 16) * factor)));
  const b = Math.max(0, Math.min(255, Math.round(parseInt(clean.slice(4, 6), 16) * factor)));
  return `rgb(${r},${g},${b})`;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function hashSeed(str: string): number {
  let h = 17;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) % 997;
  }
  return h;
}

const UNIVERSAL_ARCHETYPES: ReadonlySet<ArchetypeId> = new Set<ArchetypeId>([
  'detective',
  'scientist',
  'astronaut',
  'cyber_hacker',
  'android',
  'mech_pilot',
  'wizard',
  'pirate_captain',
  'ninja',
  'viking',
  'pharaoh',
  'vampire_lord',
  'dragon_kin',
  'elf_archer',
  'dwarf_smith',
  'ghost_phantom',
  'journalist',
  'street_musician',
  'cat_mascot',
  'robot_companion',
]);

// =========================================================================
// 1. UNIVERSAL STAGE BACKDROPS (+20 NEW STAGES -> 50 TOTAL)
// =========================================================================
export function drawUniversalStageBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stage: StageId,
  pal: MoodPalette,
  t: number
): boolean {
  const s = Math.min(w, h) / 620;
  const ts = snap24(t);

  if (stage === 'neon_cyber_alley') {
    // Towering megacity silhouettes + glowing neon signs + rain-slicked reflections
    ctx.fillStyle = pal.farSil;
    const towers = [0.02, 0.14, 0.28, 0.42, 0.58, 0.72, 0.86];
    for (let i = 0; i < towers.length; i++) {
      const tw = (68 + (i % 3) * 28) * s;
      const th = h * (0.42 + ((i * 19) % 28) * 0.01);
      ctx.fillRect(w * towers[i], h * 0.72 - th, tw, th);
    }
    // Alley flanking walls
    ctx.fillStyle = '#090918';
    ctx.fillRect(0, 0, w * 0.24, h * 0.78);
    ctx.fillRect(w * 0.76, 0, w * 0.24, h * 0.78);
    // Vertical glowing neon kanji/cyber signs
    const signs = [
      { x: w * 0.18, y: h * 0.16, bw: 24 * s, bh: 118 * s, col: '#ff2bd6' },
      { x: w * 0.08, y: h * 0.34, bw: 32 * s, bh: 64 * s, col: '#00f0ff' },
      { x: w * 0.79, y: h * 0.18, bw: 26 * s, bh: 132 * s, col: '#00f0ff' },
      { x: w * 0.87, y: h * 0.4, bw: 34 * s, bh: 54 * s, col: '#ffbe0b' },
    ];
    for (let i = 0; i < signs.length; i++) {
      const sg = signs[i];
      const flick = 0.75 + 0.25 * Math.sin(ts * (8 + i * 3) + i * 2.1);
      ctx.save();
      ctx.globalAlpha = flick * 0.24;
      ctx.fillStyle = sg.col;
      ctx.fillRect(sg.x - 10 * s, sg.y - 10 * s, sg.bw + 20 * s, sg.bh + 20 * s);
      ctx.globalAlpha = flick;
      ctx.strokeStyle = sg.col;
      ctx.lineWidth = 3 * s;
      ctx.strokeRect(sg.x, sg.y, sg.bw, sg.bh);
      for (let g = 0; g < 4; g++) {
        ctx.fillRect(sg.x + 5 * s, sg.y + 10 * s + g * (sg.bh * 0.22), sg.bw - 10 * s, 4 * s);
      }
      ctx.restore();
    }
    // Wet asphalt alley floor with colorful puddle reflections
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = pal.path;
    ctx.beginPath();
    ctx.moveTo(w * 0.24, h * 0.72);
    ctx.lineTo(w * 0.76, h * 0.72);
    ctx.lineTo(w * 0.96, h);
    ctx.lineTo(w * 0.04, h);
    ctx.closePath();
    ctx.fill();
    for (let p = 0; p < 6; p++) {
      const px = w * (0.28 + p * 0.085);
      const col = p % 2 === 0 ? 'rgba(255,43,214,0.22)' : 'rgba(0,240,255,0.22)';
      ctx.fillStyle = col;
      ctx.fillRect(px, h * 0.76 + (p % 3) * 18 * s, 28 * s, 6 * s);
    }
    return true;
  }

  if (stage === 'orbital_starship_bridge') {
    // Deep space panoramic viewport with planet horizon + sleek bridge deck & holo-console
    ctx.fillStyle = '#030612';
    ctx.fillRect(0, 0, w, h * 0.65);
    // Starfield outside bridge viewport
    ctx.fillStyle = '#d8f3ff';
    for (let i = 0; i < 36; i++) {
      const sx = (((i * 137 + 19) % 98) + 1) * 0.01 * w;
      const sy = (((i * 59 + 11) % 52) + 4) * 0.01 * h;
      const r = (1 + (i % 3) * 0.6) * s;
      ctx.globalAlpha = 0.4 + 0.55 * Math.abs(Math.sin(ts * 1.6 + i));
      ctx.fillRect(sx, sy, r, r);
    }
    ctx.globalAlpha = 1;
    // Curved blue-amber exoplanet limb
    const pGrad = ctx.createRadialGradient(w * 0.5, h * 1.15, h * 0.52, w * 0.5, h * 1.15, h * 0.85);
    pGrad.addColorStop(0, '#10284d');
    pGrad.addColorStop(0.84, '#2aa8ff');
    pGrad.addColorStop(0.92, pal.rimLight);
    pGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 1.15, h * 0.85, Math.PI * 1.1, Math.PI * 1.9);
    ctx.fill();
    // Bulkhead ribs & angled steel viewport framing
    ctx.fillStyle = '#121b2b';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h * 0.14); ctx.lineTo(w * 0.82, h * 0.22);
    ctx.lineTo(w * 0.18, h * 0.22); ctx.lineTo(0, h * 0.14); ctx.closePath();
    ctx.fill();
    for (const sx of [0.16, 0.84]) {
      ctx.fillRect(w * sx - 14 * s, 0, 28 * s, h * 0.72);
    }
    // Bridge deck floor & illuminated tactical strip
    ctx.fillStyle = '#0e1624';
    ctx.fillRect(0, h * 0.64, w, h * 0.36);
    ctx.fillStyle = '#19263d';
    ctx.beginPath();
    ctx.moveTo(w * 0.22, h * 0.64); ctx.lineTo(w * 0.78, h * 0.64);
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    ctx.fill();
    // Glowing holo-console arcs
    ctx.strokeStyle = pal.rimLight;
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(w * 0.12, h * 0.67); ctx.lineTo(w * 0.88, h * 0.67);
    ctx.stroke();
    ctx.fillStyle = 'rgba(72, 232, 255, 0.22)';
    const scanY = h * 0.5 + Math.sin(ts * 2.5) * 6 * s;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, scanY, 68 * s, 18 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    return true;
  }

  if (stage === 'mars_colony_dome') {
    // Red Martian mesa horizon + geodesic pressurized dome struts + solar habitat pods
    ctx.fillStyle = '#5c2119';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.68);
    ctx.lineTo(w * 0.18, h * 0.54); ctx.lineTo(w * 0.34, h * 0.56);
    ctx.lineTo(w * 0.52, h * 0.63); ctx.lineTo(w * 0.74, h * 0.5);
    ctx.lineTo(w * 0.89, h * 0.53); ctx.lineTo(w, h * 0.64);
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    ctx.fill();
    // Geodesic dome glass arch
    ctx.save();
    ctx.strokeStyle = 'rgba(220, 240, 255, 0.35)';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.72, Math.min(w * 0.44, h * 0.54), Math.PI, 0);
    ctx.stroke();
    for (let i = 1; i <= 5; i++) {
      const ang = Math.PI + (i / 6) * Math.PI;
      const rad = Math.min(w * 0.44, h * 0.54);
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.72);
      ctx.lineTo(w * 0.5 + Math.cos(ang) * rad, h * 0.72 + Math.sin(ang) * rad);
      ctx.stroke();
    }
    ctx.restore();
    // Rusty Martian regolith & colony platform
    ctx.fillStyle = '#471a14';
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
    ctx.fillStyle = '#242c3d';
    ctx.fillRect(w * 0.14, h * 0.73, w * 0.72, h * 0.18);
    ctx.fillStyle = pal.accent;
    ctx.fillRect(w * 0.16, h * 0.74, w * 0.68, 4 * s);
    return true;
  }

  if (stage === 'noir_rainy_street') {
    // 1940s noir brick tenements, streetlamp halo, jazz marquee & wet cobblestones
    ctx.fillStyle = '#0c0e14';
    ctx.fillRect(0, h * 0.1, w * 0.28, h * 0.64);
    ctx.fillRect(w * 0.72, h * 0.06, w * 0.28, h * 0.68);
    // Warm lit apartment windows
    ctx.fillStyle = 'rgba(255, 224, 152, 0.48)';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 2; c++) {
        if ((r + c) % 2 === 0) {
          ctx.fillRect(w * 0.05 + c * 42 * s, h * 0.18 + r * 52 * s, 20 * s, 28 * s);
          ctx.fillRect(w * 0.78 + c * 42 * s, h * 0.14 + r * 52 * s, 20 * s, 28 * s);
        }
      }
    }
    // Iconic iron streetlamp + misty cone of light
    const lx = w * 0.26;
    const ly = h * 0.28;
    ctx.fillStyle = '#181c24';
    ctx.fillRect(lx - 4 * s, ly, 8 * s, h * 0.46);
    ctx.fillRect(lx - 4 * s, ly, 36 * s, 6 * s);
    const lampGrad = ctx.createRadialGradient(lx + 28 * s, ly + 12 * s, 4 * s, lx + 28 * s, ly + 160 * s, 175 * s);
    lampGrad.addColorStop(0, 'rgba(255, 244, 210, 0.42)');
    lampGrad.addColorStop(1, 'rgba(255, 244, 210, 0)');
    ctx.fillStyle = lampGrad;
    ctx.beginPath();
    ctx.moveTo(lx + 20 * s, ly + 8 * s);
    ctx.lineTo(lx + 150 * s, h * 0.84);
    ctx.lineTo(lx - 80 * s, h * 0.84);
    ctx.closePath();
    ctx.fill();
    // Wet cobblestone road
    ctx.fillStyle = '#0e1118';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = 'rgba(215, 225, 240, 0.12)';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(w * (0.1 + i * 0.1), h * (0.76 + (i % 3) * 0.06), 44 * s, 3 * s);
    }
    return true;
  }

  if (stage === 'modern_news_studio') {
    // Sleek broadcast cyclorama, animated world-map ticker wall & curved anchor desk
    ctx.fillStyle = '#0b1630';
    ctx.fillRect(0, 0, w, h * 0.72);
    // Vertical studio light columns
    for (let i = 0; i < 7; i++) {
      const cx = w * (0.08 + i * 0.14);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 59, 92, 0.12)';
      ctx.fillRect(cx - 8 * s, 0, 16 * s, h * 0.72);
    }
    // World grid broadcast screen behind anchor
    ctx.strokeStyle = 'rgba(94, 212, 255, 0.25)';
    ctx.lineWidth = 1.5 * s;
    const bx = w * 0.18;
    const by = h * 0.12;
    const bw = w * 0.64;
    const bh = h * 0.44;
    ctx.strokeRect(bx, by, bw, bh);
    for (let g = 1; g < 6; g++) {
      ctx.beginPath();
      ctx.moveTo(bx + (bw * g) / 6, by); ctx.lineTo(bx + (bw * g) / 6, by + bh);
      ctx.stroke();
    }
    for (let r = 1; r < 4; r++) {
      ctx.beginPath();
      ctx.moveTo(bx, by + (bh * r) / 4); ctx.lineTo(bx + bw, by + (bh * r) / 4);
      ctx.stroke();
    }
    // Pulsing LIVE radar dot
    const pulse = 1 + Math.sin(ts * 6) * 0.3;
    ctx.fillStyle = '#ff2a4d';
    ctx.beginPath();
    ctx.arc(bx + 26 * s, by + 24 * s, 7 * s * pulse, 0, Math.PI * 2);
    ctx.fill();
    // Glossy studio floor & curved anchor riser
    ctx.fillStyle = '#091022';
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
    ctx.fillStyle = '#182b52';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.82, w * 0.38, 36 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4 * s;
    ctx.stroke();
    return true;
  }

  if (stage === 'cozy_bookshop_cafe') {
    // Warm timber bookshelves, hanging Edison bulbs & sunlit cafe window
    ctx.fillStyle = '#24150e';
    ctx.fillRect(0, 0, w, h * 0.74);
    // Bookshelf bays left & right
    const bookColors = ['#c94c38', '#d99b38', '#2d6a5c', '#3c588c', '#8c3b5e', '#d9c598'];
    for (const sideX of [0.03, 0.71]) {
      ctx.fillStyle = '#3b2216';
      ctx.fillRect(w * sideX, h * 0.08, w * 0.26, h * 0.64);
      for (let shelf = 0; shelf < 4; shelf++) {
        const sy = h * 0.18 + shelf * 68 * s;
        ctx.fillStyle = '#593422';
        ctx.fillRect(w * sideX, sy, w * 0.26, 7 * s);
        for (let b = 0; b < 8; b++) {
          ctx.fillStyle = bookColors[(shelf * 5 + b) % bookColors.length];
          const bh = (32 + ((b * 7 + shelf * 3) % 16)) * s;
          ctx.fillRect(w * sideX + 8 * s + b * 17 * s, sy - bh, 13 * s, bh);
        }
      }
    }
    // Center cafe mullion window
    ctx.fillStyle = pal.skyMid;
    ctx.fillRect(w * 0.34, h * 0.1, w * 0.32, h * 0.48);
    ctx.strokeStyle = '#4a2b1b';
    ctx.lineWidth = 7 * s;
    ctx.strokeRect(w * 0.34, h * 0.1, w * 0.32, h * 0.48);
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.1); ctx.lineTo(w * 0.5, h * 0.58);
    ctx.moveTo(w * 0.34, h * 0.34); ctx.lineTo(w * 0.66, h * 0.34);
    ctx.stroke();
    // Hanging warm pendant bulbs
    for (const px of [0.38, 0.5, 0.62]) {
      ctx.strokeStyle = '#1b110c';
      ctx.lineWidth = 2 * s;
      ctx.beginPath(); ctx.moveTo(w * px, 0); ctx.lineTo(w * px, h * 0.18); ctx.stroke();
      ctx.fillStyle = 'rgba(255, 212, 112, 0.28)';
      ctx.beginPath(); ctx.arc(w * px, h * 0.2, 26 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffe599';
      ctx.beginPath(); ctx.arc(w * px, h * 0.2, 7 * s, 0, Math.PI * 2); ctx.fill();
    }
    // Warm wooden floorboards
    ctx.fillStyle = '#331d12';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    return true;
  }

  if (stage === 'high_tech_lab') {
    // Clean-room hex wall panels, glowing containment cylinders & animated DNA/wave monitor
    ctx.fillStyle = '#0d1a26';
    ctx.fillRect(0, 0, w, h * 0.74);
    // Vertical containment tubes with floating bubbles
    for (const tx of [0.16, 0.84]) {
      ctx.fillStyle = 'rgba(56, 232, 214, 0.18)';
      ctx.fillRect(w * tx - 26 * s, h * 0.12, 52 * s, h * 0.56);
      ctx.strokeStyle = '#4de8d8';
      ctx.lineWidth = 3 * s;
      ctx.strokeRect(w * tx - 26 * s, h * 0.12, 52 * s, h * 0.56);
      for (let b = 0; b < 5; b++) {
        const by = h * 0.66 - (((ts * 28 + b * 48) % (h * 0.5)));
        ctx.fillStyle = 'rgba(180, 255, 248, 0.55)';
        ctx.beginPath();
        ctx.arc(w * tx + Math.sin(ts * 2 + b) * 10 * s, by, 4 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Center holographic lab waveform monitor
    ctx.fillStyle = '#08121c';
    ctx.fillRect(w * 0.3, h * 0.16, w * 0.4, h * 0.32);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.5 * s;
    ctx.strokeRect(w * 0.3, h * 0.16, w * 0.4, h * 0.32);
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const wx = w * 0.32 + (i / 24) * w * 0.36;
      const wy = h * 0.32 + Math.sin(i * 0.55 + ts * 3.2) * 28 * s;
      if (i === 0) ctx.moveTo(wx, wy);
      else ctx.lineTo(wx, wy);
    }
    ctx.stroke();
    // Glossy lab floor tiles
    ctx.fillStyle = '#132638';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    return true;
  }

  if (stage === 'courtroom_hall') {
    // Oak paneled courtroom, tall arched windows, scales emblem & judge bench
    ctx.fillStyle = '#2b1910';
    ctx.fillRect(0, 0, w, h * 0.74);
    // Wooden wall pilasters
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = '#402516';
      ctx.fillRect(w * (0.06 + i * 0.17), h * 0.06, 22 * s, h * 0.66);
    }
    // Golden scales of justice relief on center oak wall
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.16); ctx.lineTo(w * 0.5, h * 0.42);
    ctx.moveTo(w * 0.41, h * 0.22); ctx.lineTo(w * 0.59, h * 0.22);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w * 0.41, h * 0.31, 14 * s, 0, Math.PI);
    ctx.arc(w * 0.59, h * 0.31, 14 * s, 0, Math.PI);
    ctx.stroke();
    // Elevated mahogany bench & marble floor
    ctx.fillStyle = '#4d2b18';
    ctx.fillRect(w * 0.24, h * 0.54, w * 0.52, h * 0.2);
    ctx.fillStyle = '#d4a348';
    ctx.fillRect(w * 0.24, h * 0.54, w * 0.52, 6 * s);
    ctx.fillStyle = '#1f130d';
    ctx.fillRect(0, h * 0.73, w, h * 0.27);
    return true;
  }

  if (stage === 'ancient_egypt_temple') {
    // Great pyramids in twilight distance + colossal Karnak papyrus columns + sandstone causeway
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.moveTo(w * 0.18, h * 0.72); ctx.lineTo(w * 0.42, h * 0.34); ctx.lineTo(w * 0.66, h * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w * 0.54, h * 0.72); ctx.lineTo(w * 0.72, h * 0.44); ctx.lineTo(w * 0.9, h * 0.72);
    ctx.closePath();
    ctx.fill();
    // Flanking monumental lotus columns
    for (const cx of [0.1, 0.24, 0.76, 0.9]) {
      ctx.fillStyle = '#c48d48';
      ctx.fillRect(w * cx - 18 * s, h * 0.12, 36 * s, h * 0.62);
      ctx.fillStyle = '#875724';
      ctx.fillRect(w * cx, h * 0.12, 18 * s, h * 0.62);
      ctx.fillStyle = '#dfb068';
      ctx.beginPath();
      ctx.moveTo(w * cx - 28 * s, h * 0.12);
      ctx.lineTo(w * cx + 28 * s, h * 0.12);
      ctx.lineTo(w * cx + 18 * s, h * 0.2);
      ctx.lineTo(w * cx - 18 * s, h * 0.2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#a36c33';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    return true;
  }

  if (stage === 'roman_colosseum') {
    // Curved three-tier Roman travertine amphitheatre arches + sunlit sandy arena
    ctx.fillStyle = '#8c694a';
    ctx.fillRect(0, h * 0.26, w, h * 0.46);
    // Two rows of arched colonnade alcoves
    ctx.fillStyle = pal.farSil;
    for (let row = 0; row < 2; row++) {
      const ry = h * (0.33 + row * 0.18);
      for (let i = 0; i < 8; i++) {
        const ax = w * (0.06 + i * 0.125);
        ctx.beginPath();
        ctx.arc(ax, ry, 18 * s, Math.PI, 0);
        ctx.lineTo(ax + 18 * s, ry + 36 * s);
        ctx.lineTo(ax - 18 * s, ry + 36 * s);
        ctx.closePath();
        ctx.fill();
      }
    }
    // Red imperial banners
    for (const bx of [0.22, 0.5, 0.78]) {
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(w * bx - 10 * s, h * 0.28, 20 * s, 54 * s);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(w * bx - 10 * s, h * 0.28, 20 * s, 5 * s);
    }
    ctx.fillStyle = '#cfa26b';
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
    return true;
  }

  if (stage === 'nordic_fjord_hall') {
    // Timber Viking mead-hall rafters, carved dragon-head beams, hanging shields & hearth glow
    ctx.fillStyle = '#1b1412';
    ctx.fillRect(0, 0, w, h * 0.74);
    // Sloping timber roof beams
    ctx.strokeStyle = '#3d281d';
    ctx.lineWidth = 14 * s;
    for (let i = 0; i < 4; i++) {
      const yOff = i * 44 * s;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.04 + yOff * 0.3);
      ctx.lineTo(0, h * 0.34 + yOff * 0.5);
      ctx.moveTo(w * 0.5, h * 0.04 + yOff * 0.3);
      ctx.lineTo(w, h * 0.34 + yOff * 0.5);
      ctx.stroke();
    }
    // Round painted Viking shields on hall walls
    const shieldCols = ['#b91c1c', '#1d4ed8', '#ca8a04', '#15803d'];
    for (let i = 0; i < 4; i++) {
      const sx = w * (0.14 + i * 0.24);
      ctx.fillStyle = shieldCols[i];
      ctx.beginPath(); ctx.arc(sx, h * 0.44, 24 * s, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4 * s;
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath(); ctx.arc(sx, h * 0.44, 7 * s, 0, Math.PI * 2); ctx.fill();
    }
    // Warm hearth fire pit glow on stone floor
    const flk = 1 + Math.sin(ts * 12) * 0.14;
    const hGrad = ctx.createRadialGradient(w * 0.5, h * 0.74, 8 * s, w * 0.5, h * 0.74, 150 * s * flk);
    hGrad.addColorStop(0, 'rgba(255, 145, 42, 0.48)');
    hGrad.addColorStop(1, 'rgba(255, 145, 42, 0)');
    ctx.fillStyle = '#291e1a';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = hGrad;
    ctx.fillRect(0, h * 0.52, w, h * 0.48);
    return true;
  }

  if (stage === 'gothic_cathedral') {
    // Pointed gothic stone ribs + luminous stained-glass rose window + candlelit nave
    ctx.fillStyle = '#0d0c18';
    ctx.fillRect(0, 0, w, h * 0.74);
    // Rose window
    const rx = w * 0.5;
    const ry = h * 0.3;
    const rr = 88 * s;
    const roseGrad = ctx.createRadialGradient(rx, ry, 8 * s, rx, ry, rr);
    roseGrad.addColorStop(0, '#ffd166');
    roseGrad.addColorStop(0.5, '#e11d48');
    roseGrad.addColorStop(1, '#312e81');
    ctx.fillStyle = roseGrad;
    ctx.beginPath(); ctx.arc(rx, ry, rr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#090912';
    ctx.lineWidth = 5 * s;
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + Math.cos(a) * rr, ry + Math.sin(a) * rr);
      ctx.stroke();
    }
    // Flanking pointed nave columns
    ctx.fillStyle = '#1b1a2e';
    for (const cx of [0.12, 0.28, 0.72, 0.88]) {
      ctx.fillRect(w * cx - 14 * s, 0, 28 * s, h * 0.74);
    }
    ctx.fillStyle = '#161526';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    return true;
  }

  if (stage === 'steampunk_clocktower') {
    // Giant illuminated clockface + rotating brass cogwheels + steam pipes
    ctx.fillStyle = '#1c1410';
    ctx.fillRect(0, 0, w, h * 0.74);
    // Glowing clockface backdrop
    const cx = w * 0.5;
    const cy = h * 0.36;
    const cr = 112 * s;
    ctx.fillStyle = 'rgba(255, 224, 148, 0.24)';
    ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d99a38';
    ctx.lineWidth = 8 * s;
    ctx.stroke();
    // Moving clock hands
    ctx.strokeStyle = '#291a10';
    ctx.lineWidth = 6 * s;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(ts * 0.4) * cr * 0.65, cy + Math.sin(ts * 0.4) * cr * 0.65);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(ts * 0.08 - 1.2) * cr * 0.45, cy + Math.sin(ts * 0.08 - 1.2) * cr * 0.45);
    ctx.stroke();
    // Rotating interlocking brass gears
    const gears = [
      { x: w * 0.18, y: h * 0.34, r: 58 * s, dir: 1 },
      { x: w * 0.82, y: h * 0.42, r: 66 * s, dir: -1 },
    ];
    for (const g of gears) {
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(ts * 0.55 * g.dir);
      ctx.fillStyle = '#9c6621';
      ctx.beginPath(); ctx.arc(0, 0, g.r, 0, Math.PI * 2); ctx.fill();
      for (let tIdx = 0; tIdx < 10; tIdx++) {
        ctx.rotate((Math.PI * 2) / 10);
        ctx.fillRect(-7 * s, -g.r - 12 * s, 14 * s, 16 * s);
      }
      ctx.fillStyle = '#1c1410';
      ctx.beginPath(); ctx.arc(0, 0, g.r * 0.38, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#291c14';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    return true;
  }

  if (stage === 'pirate_galleon_deck') {
    // Ocean horizon swells, billowing canvas sail, wooden ship railing & mast
    const sway = Math.sin(ts * 1.6) * 6 * s;
    // Rolling ocean horizon
    ctx.fillStyle = '#0c2c4a';
    ctx.fillRect(0, h * 0.54, w, h * 0.22);
    // Main mast & billowing cream sail
    ctx.fillStyle = '#4a2b17';
    ctx.fillRect(w * 0.49, h * 0.04, 16 * s, h * 0.68);
    ctx.fillRect(w * 0.2, h * 0.16, w * 0.6, 10 * s);
    ctx.fillStyle = 'rgba(242, 230, 200, 0.85)';
    ctx.beginPath();
    ctx.moveTo(w * 0.24, h * 0.18);
    ctx.lineTo(w * 0.76, h * 0.18);
    ctx.quadraticCurveTo(w * 0.78 + sway, h * 0.36, w * 0.72, h * 0.52);
    ctx.lineTo(w * 0.28, h * 0.52);
    ctx.quadraticCurveTo(w * 0.22 + sway, h * 0.36, w * 0.24, h * 0.18);
    ctx.closePath();
    ctx.fill();
    // Timber galleon deck & bulwark railing
    ctx.fillStyle = '#5c3318';
    ctx.fillRect(0, h * 0.66, w, h * 0.34);
    ctx.fillStyle = '#3d200e';
    ctx.fillRect(0, h * 0.63, w, 12 * s);
    return true;
  }

  if (stage === 'underwater_atlantis') {
    // Sunlit caustic shafts, sunken marble temple arches, swaying kelp & rising bubbles
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = 'rgba(110, 242, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(w * (0.14 + i * 0.24), 0);
      ctx.lineTo(w * (0.24 + i * 0.24), 0);
      ctx.lineTo(w * (0.1 + i * 0.24), h * 0.85);
      ctx.lineTo(w * (0.0 + i * 0.24), h * 0.85);
      ctx.closePath();
      ctx.fill();
    }
    // Sunken coral-draped columns
    ctx.fillStyle = '#1b4d5e';
    for (const cx of [0.16, 0.32, 0.68, 0.84]) {
      const ch = cx === 0.32 ? h * 0.34 : h * 0.52;
      ctx.fillRect(w * cx - 16 * s, h * 0.72 - ch, 32 * s, ch);
    }
    // Swaying bioluminescent kelp fronds
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 6 * s;
    for (let k = 0; k < 6; k++) {
      const kx = w * (0.08 + k * 0.17);
      const sw = Math.sin(ts * 2.1 + k) * 14 * s;
      ctx.beginPath();
      ctx.moveTo(kx, h * 0.82);
      ctx.quadraticCurveTo(kx + sw, h * 0.66, kx - sw * 0.6, h * 0.5);
      ctx.stroke();
    }
    // Rising deterministic bubbles
    ctx.fillStyle = 'rgba(186, 250, 255, 0.38)';
    for (let b = 0; b < 12; b++) {
      const bx = ((b * 89 + 21) % 94) * 0.01 * w + Math.sin(ts * 2 + b) * 8 * s;
      const by = h - (((ts * 38 + b * 64) % (h * 0.95)));
      ctx.beginPath(); ctx.arc(bx, by, (2.5 + (b % 3)) * s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#0b2c3b';
    ctx.fillRect(0, h * 0.74, w, h * 0.26);
    return true;
  }

  if (stage === 'volcanic_citadel') {
    // Jagged basalt fortress spires + glowing magma river + heat shimmer
    ctx.fillStyle = '#1a0a0d';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.72);
    ctx.lineTo(w * 0.14, h * 0.26); ctx.lineTo(w * 0.26, h * 0.58);
    ctx.lineTo(w * 0.44, h * 0.18); ctx.lineTo(w * 0.56, h * 0.18);
    ctx.lineTo(w * 0.74, h * 0.56); ctx.lineTo(w * 0.88, h * 0.24);
    ctx.lineTo(w, h * 0.72); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    ctx.fill();
    // Glowing lava veins
    const lavaGlow = 0.78 + Math.sin(ts * 5.2) * 0.22;
    ctx.fillStyle = `rgba(255, 92, 24, ${lavaGlow.toFixed(3)})`;
    ctx.fillRect(0, h * 0.72, w, h * 0.1);
    ctx.fillStyle = '#ffcf40';
    ctx.fillRect(0, h * 0.75, w, h * 0.03);
    // Obsidian bridge deck
    ctx.fillStyle = '#140c10';
    ctx.fillRect(0, h * 0.79, w, h * 0.21);
    return true;
  }

  if (stage === 'snowy_mountain_pass') {
    // Crisp Alpine/Himalayan snow-capped peaks + pine treeline + frosted trail
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.74);
    ctx.lineTo(w * 0.2, h * 0.34); ctx.lineTo(w * 0.38, h * 0.58);
    ctx.lineTo(w * 0.58, h * 0.26); ctx.lineTo(w * 0.82, h * 0.54);
    ctx.lineTo(w, h * 0.36); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    ctx.fill();
    // Bright snow caps
    ctx.fillStyle = '#e2effc';
    ctx.beginPath();
    ctx.moveTo(w * 0.2, h * 0.34); ctx.lineTo(w * 0.26, h * 0.45); ctx.lineTo(w * 0.14, h * 0.46); ctx.closePath();
    ctx.moveTo(w * 0.58, h * 0.26); ctx.lineTo(w * 0.66, h * 0.4); ctx.lineTo(w * 0.5, h * 0.41); ctx.closePath();
    ctx.fill();
    // Snowbank foreground
    ctx.fillStyle = '#cbdcf0';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = '#8faac9';
    ctx.beginPath();
    ctx.moveTo(w * 0.36, h * 0.72); ctx.lineTo(w * 0.64, h * 0.72);
    ctx.lineTo(w * 0.84, h); ctx.lineTo(w * 0.16, h); ctx.closePath();
    ctx.fill();
    return true;
  }

  if (stage === 'cherry_blossom_shrine') {
    // Vermilion Torii shrine gate, sweeping pink sakura canopy & stone lantern steps
    // Distant hills
    ctx.fillStyle = pal.farSil;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.72);
    ctx.quadraticCurveTo(w * 0.35, h * 0.5, w * 0.65, h * 0.62);
    ctx.quadraticCurveTo(w * 0.85, h * 0.54, w, h * 0.66);
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    ctx.fill();
    // Vermilion Torii Gate
    const tx = w * 0.5;
    ctx.fillStyle = '#d92638';
    ctx.fillRect(tx - 78 * s, h * 0.28, 16 * s, h * 0.44);
    ctx.fillRect(tx + 62 * s, h * 0.28, 16 * s, h * 0.44);
    ctx.fillRect(tx - 110 * s, h * 0.25, 220 * s, 16 * s);
    ctx.fillRect(tx - 92 * s, h * 0.34, 184 * s, 10 * s);
    ctx.fillStyle = '#18141c';
    ctx.fillRect(tx - 116 * s, h * 0.23, 232 * s, 7 * s);
    // Framing pink sakura blossom boughs
    const sway = Math.sin(ts * 2.1) * 5 * s;
    for (const [bx, by, br] of [
      [w * 0.08 + sway, h * 0.18, 86 * s],
      [w * 0.22 + sway * 0.7, h * 0.12, 68 * s],
      [w * 0.92 - sway, h * 0.2, 88 * s],
      [w * 0.78 - sway * 0.6, h * 0.13, 64 * s],
    ]) {
      ctx.fillStyle = '#f9a8d4';
      ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath(); ctx.arc(bx - br * 0.2, by - br * 0.18, br * 0.55, 0, Math.PI * 2); ctx.fill();
    }
    // Stone shrine path
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = pal.path;
    ctx.beginPath();
    ctx.moveTo(w * 0.38, h * 0.72); ctx.lineTo(w * 0.62, h * 0.72);
    ctx.lineTo(w * 0.76, h); ctx.lineTo(w * 0.24, h); ctx.closePath();
    ctx.fill();
    return true;
  }

  if (stage === 'vintage_train_car') {
    // Mahogany sleeper-car interior with moving moonlit countryside outside arched windows
    ctx.fillStyle = '#291710';
    ctx.fillRect(0, 0, w, h * 0.76);
    // Brass-framed panoramic coach windows with scrolling silhouettes
    const scrollX = (ts * 95) % (w * 0.4);
    for (let i = 0; i < 3; i++) {
      const wx = w * (0.08 + i * 0.3);
      const wy = h * 0.16;
      const ww = w * 0.24;
      const wh = h * 0.36;
      ctx.save();
      ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
      ctx.fillStyle = pal.skyMid;
      ctx.fillRect(wx, wy, ww, wh);
      ctx.fillStyle = pal.farSil;
      for (let tIdx = -1; tIdx < 4; tIdx++) {
        const px = wx + tIdx * 80 * s - (scrollX % (80 * s));
        ctx.beginPath();
        ctx.moveTo(px, wy + wh);
        ctx.lineTo(px + 26 * s, wy + wh * 0.45);
        ctx.lineTo(px + 52 * s, wy + wh);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      ctx.strokeStyle = '#d49d35';
      ctx.lineWidth = 5 * s;
      ctx.strokeRect(wx, wy, ww, wh);
    }
    // Velvet booth seats & carpeted aisle
    ctx.fillStyle = '#6b1829';
    ctx.fillRect(0, h * 0.58, w * 0.22, h * 0.2);
    ctx.fillRect(w * 0.78, h * 0.58, w * 0.22, h * 0.2);
    ctx.fillStyle = '#3b151e';
    ctx.fillRect(0, h * 0.74, w, h * 0.26);
    return true;
  }

  if (stage === 'astral_observatory') {
    // Open observatory dome slit revealing celestial constellation wheel + brass telescope
    ctx.fillStyle = '#070b1e';
    ctx.fillRect(0, 0, w, h * 0.74);
    // Rotating golden zodiac / astrolabe rings in sky
    const cx = w * 0.5;
    const cy = h * 0.34;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ts * 0.18);
    ctx.strokeStyle = 'rgba(255, 214, 102, 0.34)';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath(); ctx.arc(0, 0, 128 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 88 * s, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 88 * s, Math.sin(a) * 88 * s);
      ctx.lineTo(Math.cos(a) * 128 * s, Math.sin(a) * 128 * s);
      ctx.stroke();
    }
    ctx.restore();
    // Slanted brass refractor telescope silhouette
    ctx.save();
    ctx.translate(w * 0.72, h * 0.68);
    ctx.rotate(-0.68);
    ctx.fillStyle = '#c28f36';
    ctx.fillRect(-16 * s, -180 * s, 32 * s, 190 * s);
    ctx.fillStyle = '#ffd56b';
    ctx.fillRect(-20 * s, -184 * s, 40 * s, 12 * s);
    ctx.restore();
    // Stone star-map observatory terrace
    ctx.fillStyle = '#141933';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    return true;
  }

  return false;
}

// =========================================================================
// 2. UNIVERSAL CHARACTER CLOSE-UPS (+20 NEW ARCHETYPES -> 60 TOTAL)
// =========================================================================
export function drawUniversalActorCloseUp(
  ctx: CanvasRenderingContext2D,
  cast: CastMember,
  expression: ExpressionId,
  viseme: number,
  speechEnergy: number,
  lightSide: 'left' | 'right',
  t: number
): boolean {
  const arch = cast.archetype;
  if (!UNIVERSAL_ARCHETYPES.has(arch)) return false;

  const ts = snap24(t);
  const lightRight = lightSide === 'right';
  const seed = hashSeed(cast.id);
  const breath = Math.sin(ts * 2.1 + seed * 0.13);
  const speechNod = speechEnergy > 0.18 ? Math.sin(ts * 9.5 + seed) * 0.03 * speechEnergy : 0;
  const exprTilt = getExpressionHeadTilt(expression);

  const skin = cast.skinColor || '#e2a882';
  const skinShadow = darkenHex(skin, 0.58);
  const primary = cast.primaryColor || '#3b82f6';
  const primaryDark = darkenHex(primary, 0.54);
  const accent = cast.accentColor || '#ffd04d';

  ctx.save();
  ctx.translate(0, breath * -2.2 - speechEnergy * 2.6);
  ctx.rotate(Math.sin(ts * 1.9 + seed * 0.2) * 0.02 + speechNod + exprTilt);

  // ---- SPECIAL NON-HUMANOID MASCOTS & ROBOTS ----
  if (arch === 'cat_mascot') {
    const fur = primary;
    const furDark = primaryDark;
    // Shoulders
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-140, 210); ctx.lineTo(-96, 78); ctx.lineTo(96, 78); ctx.lineTo(140, 210); ctx.closePath();
    ctx.fill();
    // Pointed cat ears with pink inner triangles
    for (const sgn of [-1, 1]) {
      ctx.fillStyle = sgn > 0 ? fur : furDark;
      ctx.beginPath();
      ctx.moveTo(sgn * 28, -68); ctx.lineTo(sgn * 84, -158); ctx.lineTo(sgn * 92, -46); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.moveTo(sgn * 40, -72); ctx.lineTo(sgn * 74, -132); ctx.lineTo(sgn * 78, -56); ctx.closePath();
      ctx.fill();
    }
    // Rounded feline head
    ctx.fillStyle = fur;
    ctx.beginPath(); ctx.ellipse(0, -4, 88, 76, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = furDark;
    ctx.fillRect(lightRight ? -98 : 0, -90, 98, 190);
    ctx.restore();
    // Cream muzzle cheeks
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.ellipse(0, 32, 46, 30, 0, 0, Math.PI * 2); ctx.fill();
    // Whiskers
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 3.5;
    for (const sgn of [-1, 1]) {
      for (const dy of [-6, 4, 14]) {
        ctx.beginPath(); ctx.moveTo(sgn * 34, 24 + dy); ctx.lineTo(sgn * 98, 18 + dy * 1.3); ctx.stroke();
      }
    }
    drawUnifiedEyePair(ctx, expression, accent, t, speechEnergy, {
      glowing: true, eyeX: 34, eyeY: -14, castSeed: seed, eyeScale: 1.15,
    });
    // Pink triangle nose
    ctx.fillStyle = '#fb7185';
    ctx.beginPath(); ctx.moveTo(-12, 16); ctx.lineTo(12, 16); ctx.lineTo(0, 28); ctx.closePath(); ctx.fill();
    drawUnifiedMouth(ctx, expression, viseme, { y: 44, scale: 0.9 });
    ctx.restore();
    return true;
  }

  if (arch === 'robot_companion') {
    // Cute rounded companion bot chassis with antenna + glowing LED visor screen
    ctx.fillStyle = primaryDark;
    ctx.beginPath();
    ctx.moveTo(-136, 210); ctx.lineTo(-92, 82); ctx.lineTo(92, 82); ctx.lineTo(136, 210); ctx.closePath();
    ctx.fill();
    // Antenna with pulsing beacon
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, -82); ctx.lineTo(0, -138); ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(0, -142, 12 + Math.sin(ts * 7) * 2.5, 0, Math.PI * 2); ctx.fill();
    // Metallic rounded monitor head
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.roundRect(-86, -86, 172, 152, 34); ctx.fill();
    ctx.fillStyle = '#09111f';
    ctx.beginPath(); ctx.roundRect(-68, -62, 136, 104, 20); ctx.fill();
    // Expressive glowing digital eyes & equalizer mouth
    drawUnifiedEyePair(ctx, expression, accent, t, speechEnergy, {
      glowing: true, eyeX: 30, eyeY: -18, castSeed: seed, noBrows: false,
    });
    const eqAmp = 6 + speechEnergy * 18 + viseme * 3;
    ctx.fillStyle = accent;
    for (let i = -2; i <= 2; i++) {
      const barH = clamp(eqAmp * (1 - Math.abs(i) * 0.22), 4, 24);
      ctx.fillRect(i * 14 - 4, 22 - barH * 0.5, 8, barH);
    }
    ctx.restore();
    return true;
  }

  if (arch === 'ghost_phantom') {
    // Translucent floating spectral cowl & glowing soul eyes
    ctx.save();
    ctx.globalAlpha = 0.86 + Math.sin(ts * 3.5) * 0.08;
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(-150, 215);
    ctx.quadraticCurveTo(-120, -108, 0, -132);
    ctx.quadraticCurveTo(120, -108, 150, 215);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#070b18';
    ctx.beginPath(); ctx.ellipse(0, -4, 62, 76, 0, 0, Math.PI * 2); ctx.fill();
    drawUnifiedEyePair(ctx, expression, accent, t, speechEnergy, {
      glowing: true, eyeX: 26, eyeY: -12, castSeed: seed,
    });
    drawUnifiedMouth(ctx, expression, viseme, { y: 34, scale: 0.85 });
    ctx.restore();
    ctx.restore();
    return true;
  }

  // ---- HUMANOID / SCI-FI / FANTASY CLOSE-UPS ----
  // Heroic shoulders / collar / cloak
  ctx.fillStyle = primary;
  ctx.beginPath();
  ctx.moveTo(-185, 220); ctx.lineTo(-125, 76); ctx.lineTo(125, 76); ctx.lineTo(185, 220); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = primaryDark;
  ctx.beginPath();
  ctx.moveTo(lightRight ? -185 : 0, 220);
  ctx.lineTo(lightRight ? -125 : 0, 76);
  ctx.lineTo(lightRight ? 0 : 125, 76);
  ctx.lineTo(lightRight ? 0 : 185, 220);
  ctx.closePath();
  ctx.fill();

  // Archetype-specific collars & neck gear
  if (arch === 'vampire_lord') {
    // High dramatic crimson-lined Dracula collar
    ctx.fillStyle = '#0e0a14';
    ctx.beginPath();
    ctx.moveTo(-136, 92); ctx.lineTo(-112, -52); ctx.lineTo(-42, 68); ctx.closePath();
    ctx.moveTo(136, 92); ctx.lineTo(112, -52); ctx.lineTo(42, 68); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-122, 82); ctx.lineTo(-104, -30); ctx.lineTo(-54, 70); ctx.closePath();
    ctx.moveTo(122, 82); ctx.lineTo(104, -30); ctx.lineTo(54, 70); ctx.closePath();
    ctx.fill();
  } else if (arch === 'detective' || arch === 'scientist' || arch === 'journalist') {
    // Crisp white shirt + tie / upturned trench lapels
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.moveTo(-36, 78); ctx.lineTo(36, 78); ctx.lineTo(0, 152); ctx.closePath(); ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.moveTo(-10, 86); ctx.lineTo(10, 86); ctx.lineTo(14, 148); ctx.lineTo(0, 166); ctx.lineTo(-14, 148); ctx.closePath(); ctx.fill();
  } else if (arch === 'pharaoh') {
    // Striped Nemes headdress wings behind head
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(-126, 92); ctx.lineTo(-98, -76); ctx.lineTo(98, -76); ctx.lineTo(126, 92); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = accent;
    for (let st = -62; st <= 72; st += 22) {
      ctx.fillRect(-114, st, 228, 9);
    }
  } else if (arch === 'dragon_kin') {
    // Swept draconic horns behind head
    ctx.fillStyle = accent;
    for (const sgn of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sgn * 42, -52);
      ctx.quadraticCurveTo(sgn * 112, -120, sgn * 84, -172);
      ctx.quadraticCurveTo(sgn * 68, -110, sgn * 22, -60);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Pointed Elf ears
  if (arch === 'elf_archer') {
    ctx.fillStyle = skin;
    for (const sgn of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sgn * 58, -16); ctx.lineTo(sgn * 114, -44); ctx.lineTo(sgn * 58, 12); ctx.closePath();
      ctx.fill();
    }
  }

  // Hair silhouette behind head (for unhelmeted humanoids)
  if (arch !== 'astronaut' && arch !== 'mech_pilot' && arch !== 'pharaoh' && arch !== 'ninja') {
    ctx.fillStyle =
      arch === 'wizard' ? '#e2e8f0' :
      arch === 'dwarf_smith' ? '#9a3412' :
      arch === 'viking' ? '#d97706' :
      arch === 'elf_archer' ? '#fde68a' :
      arch === 'cyber_hacker' ? accent :
      '#111827';
    ctx.beginPath();
    ctx.moveTo(-76, -56); ctx.lineTo(76, -56); ctx.lineTo(84, 82); ctx.lineTo(-84, 82); ctx.closePath();
    ctx.fill();
  }

  // Chiseled Head Base + Chiaroscuro Half Shadow
  ctx.fillStyle = arch === 'android' ? '#d8e4f0' : skin;
  ctx.beginPath();
  ctx.moveTo(-64, -56); ctx.lineTo(64, -56); ctx.lineTo(58, 22);
  ctx.lineTo(24, 74); ctx.lineTo(-24, 74); ctx.lineTo(-58, 22); ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = arch === 'android' ? '#7b93ab' : skinShadow;
  ctx.fillRect(lightRight ? -90 : 0, -90, 90, 190);
  ctx.restore();

  // Android metallic seam lines
  if (arch === 'android') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-48, 8); ctx.lineTo(-22, 24); ctx.lineTo(-22, 64);
    ctx.moveTo(48, 8); ctx.lineTo(22, 24); ctx.lineTo(22, 64);
    ctx.stroke();
  }

  // Ninja lower-face mask + headband
  if (arch === 'ninja') {
    ctx.fillStyle = '#0b0e18';
    ctx.beginPath();
    ctx.moveTo(-68, -60); ctx.lineTo(68, -60); ctx.lineTo(68, -24); ctx.lineTo(-68, -24); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(-64, 6); ctx.lineTo(64, 6); ctx.lineTo(56, 78); ctx.lineTo(-56, 78); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(-68, -44, 136, 11);
  }

  // Eyes (with special visors/glows)
  const glowingEyes =
    arch === 'android' || arch === 'vampire_lord' || arch === 'dragon_kin' || arch === 'wizard';
  drawUnifiedEyePair(ctx, expression, accent, t, speechEnergy, {
    glowing: glowingEyes,
    eyeX: 28,
    eyeY: -8,
    castSeed: seed,
  });

  // Archetype eyewear (cyber visor, scientist spectacles, pirate eyepatch)
  if (arch === 'cyber_hacker' || arch === 'mech_pilot') {
    ctx.fillStyle = 'rgba(0, 240, 255, 0.34)';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-56, -24, 112, 28, 8);
    ctx.fill();
    ctx.stroke();
  } else if (arch === 'scientist') {
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(-28, -8, 19, 0, Math.PI * 2);
    ctx.arc(28, -8, 19, 0, Math.PI * 2);
    ctx.moveTo(-9, -8); ctx.lineTo(9, -8);
    ctx.stroke();
  } else if (arch === 'pirate_captain') {
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-62, -32); ctx.lineTo(62, 6); ctx.stroke();
    ctx.fillStyle = '#09090b';
    ctx.beginPath(); ctx.ellipse(-28, -8, 18, 15, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Beards for Wizard, Viking, Dwarf Smith
  if (arch === 'wizard' || arch === 'viking' || arch === 'dwarf_smith') {
    ctx.fillStyle =
      arch === 'wizard' ? '#f1f5f9' : arch === 'dwarf_smith' ? '#9a3412' : '#d97706';
    ctx.beginPath();
    ctx.moveTo(-48, 22);
    ctx.lineTo(48, 22);
    ctx.lineTo(arch === 'wizard' ? 0 : 28, arch === 'wizard' ? 128 : 108);
    if (arch !== 'wizard') ctx.lineTo(-28, 108);
    ctx.closePath();
    ctx.fill();
  }

  // Mouth (hidden behind ninja mask)
  if (arch !== 'ninja') {
    drawUnifiedMouth(ctx, expression, viseme, {
      y: 36,
      scale: 0.94,
      fanged: arch === 'vampire_lord' || arch === 'dragon_kin',
    });
  }

  // Iconic Headgear (Fedora, Wizard Hat, Tricorn, Viking Horned Helm, Astronaut Dome, Pharaoh Cobra, Musician Beanie)
  if (arch === 'detective') {
    ctx.fillStyle = primaryDark;
    ctx.beginPath(); ctx.ellipse(0, -52, 92, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(-62, -52); ctx.lineTo(-44, -108); ctx.lineTo(0, -96); ctx.lineTo(44, -108); ctx.lineTo(62, -52);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(-58, -62, 116, 10);
  } else if (arch === 'wizard') {
    ctx.fillStyle = primaryDark;
    ctx.beginPath(); ctx.ellipse(0, -54, 104, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(-68, -54); ctx.lineTo(18, -172); ctx.lineTo(66, -54); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(-62, -64, 124, 11);
  } else if (arch === 'pirate_captain') {
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(-98, -46); ctx.quadraticCurveTo(0, -134, 98, -46); ctx.lineTo(68, -38); ctx.lineTo(-68, -38);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(0, -76, 12, 0, Math.PI * 2); ctx.fill();
  } else if (arch === 'viking') {
    ctx.fillStyle = '#64748b';
    ctx.beginPath(); ctx.arc(0, -52, 68, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#f8fafc';
    for (const sgn of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sgn * 58, -70);
      ctx.quadraticCurveTo(sgn * 108, -94, sgn * 88, -148);
      ctx.quadraticCurveTo(sgn * 72, -100, sgn * 48, -86);
      ctx.closePath();
      ctx.fill();
    }
  } else if (arch === 'astronaut' || arch === 'mech_pilot') {
    // Bubble glass EVA helmet rim
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(0, -4, 88, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(186, 230, 253, 0.16)';
    ctx.beginPath(); ctx.arc(0, -4, 84, 0, Math.PI * 2); ctx.fill();
  } else if (arch === 'pharaoh') {
    // Golden Uraeus cobra crest
    ctx.fillStyle = accent;
    ctx.fillRect(-68, -68, 136, 16);
    ctx.beginPath(); ctx.arc(0, -84, 14, 0, Math.PI * 2); ctx.fill();
  } else if (arch === 'street_musician') {
    // Knit beanie + headphones
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.arc(0, -52, 66, Math.PI, 0); ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(-66, -60, 132, 12);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(-78, -26, 14, 42);
    ctx.fillRect(64, -26, 14, 42);
  }

  ctx.restore();
  return true;
}

// =========================================================================
// 3. UNIVERSAL FULL-BODY RIGS (+20 NEW ARCHETYPES -> 60 TOTAL)
// =========================================================================
export function drawUniversalActorFullBody(
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
  if (!UNIVERSAL_ARCHETYPES.has(arch)) return false;

  const ts = snap24(t);
  const seed = hashSeed(cast.id);
  const primary = cast.primaryColor || '#3b82f6';
  const primaryDark = darkenHex(primary, 0.56);
  const accent = cast.accentColor || '#ffd04d';
  const skin = cast.skinColor || '#e2a882';
  const breath = Math.sin(ts * 2.2 + seed * 0.2) * 2.4;

  // Hovering Ghost Phantom
  if (arch === 'ghost_phantom') {
    const hover = Math.sin(ts * 3.1 + seed) * 10;
    ctx.save();
    ctx.translate(0, hover - 18);
    ctx.globalAlpha = 0.84;
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(-36, -124);
    ctx.lineTo(36, -124);
    ctx.lineTo(48, -16);
    ctx.lineTo(24, 0);
    ctx.lineTo(0, -14);
    ctx.lineTo(-24, 0);
    ctx.lineTo(-48, -16);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.translate(0, -138);
    ctx.scale(0.32, 0.32);
    drawUniversalActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', ts);
    ctx.restore();
    ctx.restore();
    return true;
  }

  // Hovering / Rolling Robot Companion
  if (arch === 'robot_companion') {
    const bob = Math.sin(ts * 3.8 + seed) * 7;
    ctx.save();
    ctx.translate(0, bob - 8);
    // Thruster glow ring underneath
    ctx.fillStyle = 'rgba(56, 232, 255, 0.32)';
    ctx.beginPath(); ctx.ellipse(0, -6, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
    // Compact rounded torso
    ctx.fillStyle = primaryDark;
    ctx.beginPath(); ctx.roundRect(-28, -82, 56, 62, 16); ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(0, -52, 11, 0, Math.PI * 2); ctx.fill();
    // Articulated mini arms
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    const armWave = Math.sin(ts * 4 + seed) * 12;
    ctx.beginPath();
    ctx.moveTo(-28, -68); ctx.lineTo(-50, -48 + armWave);
    ctx.moveTo(28, -68); ctx.lineTo(50, -48 - armWave);
    ctx.stroke();
    ctx.save();
    ctx.translate(0, -116);
    ctx.scale(0.36, 0.36);
    drawUniversalActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', ts);
    ctx.restore();
    ctx.restore();
    return true;
  }

  // Cat Mascot Full Body with wagging tail
  if (arch === 'cat_mascot') {
    const tailWag = Math.sin(ts * 4.5 + seed) * 14;
    ctx.strokeStyle = primary;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-18, -32);
    ctx.quadraticCurveTo(-56, -42 + tailWag, -48, -86 + tailWag * 0.5);
    ctx.stroke();
    // Legs
    ctx.fillStyle = primaryDark;
    ctx.fillRect(-16 - stride * 0.45, -36, 12, 36);
    ctx.fillRect(6 + stride * 0.45, -36, 12, 36);
    // Vest torso
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.roundRect(-24, -96 + breath, 48, 66, 14); ctx.fill();
    ctx.save();
    ctx.translate(0, -124 + breath);
    ctx.scale(0.36, 0.36);
    drawUniversalActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', ts);
    ctx.restore();
    return true;
  }

  // Standard Multi-Genre Humanoid Full-Body Silhouette
  const isDwarf = arch === 'dwarf_smith';
  const hScale = isDwarf ? 0.84 : 1.0;

  ctx.save();
  ctx.scale(1, hScale);

  // Flowing cloak / wings / trench tail behind torso
  if (arch === 'vampire_lord' || arch === 'wizard' || arch === 'detective' || arch === 'elf_archer' || arch === 'dragon_kin') {
    const sway = Math.sin(ts * 4.2 + seed) * 10;
    ctx.fillStyle = arch === 'dragon_kin' ? accent : primaryDark;
    ctx.beginPath();
    if (arch === 'dragon_kin') {
      // Swept bat/dragon wings
      ctx.moveTo(-10, -110); ctx.lineTo(-78, -142 + sway); ctx.lineTo(-56, -54); ctx.closePath();
      ctx.moveTo(10, -110); ctx.lineTo(78, -142 - sway); ctx.lineTo(56, -54); ctx.closePath();
    } else {
      ctx.moveTo(-18, -118); ctx.lineTo(-58 - sway, -12); ctx.lineTo(28, -16); ctx.lineTo(18, -118); ctx.closePath();
    }
    ctx.fill();
  }

  // Legs
  if (pose === 'sit' || pose === 'kneel') {
    ctx.fillStyle = primaryDark;
    ctx.fillRect(-26, -34, 52, 34);
  } else {
    ctx.fillStyle = '#111827';
    ctx.fillRect(-16 - stride * 0.5, -52, 13, 52);
    ctx.fillRect(4 + stride * 0.5, -52, 13, 52);
  }

  // Torso tunic / coat / space suit / armor
  const torsoW = arch === 'astronaut' || arch === 'mech_pilot' || arch === 'dwarf_smith' ? 34 : 26;
  ctx.fillStyle = primary;
  ctx.beginPath();
  ctx.moveTo(-torsoW, -124 + breath);
  ctx.lineTo(torsoW, -124 + breath);
  ctx.lineTo(torsoW + 6, -44);
  ctx.lineTo(-torsoW - 6, -44);
  ctx.closePath();
  ctx.fill();

  // Accent chest detail (belt / tie / EVA chest pack / rune trim)
  ctx.fillStyle = accent;
  ctx.fillRect(-torsoW - 3, -64, (torsoW + 3) * 2, 8);
  if (arch === 'astronaut' || arch === 'mech_pilot') {
    ctx.fillRect(-14, -108 + breath, 28, 22);
  } else if (arch === 'scientist' || arch === 'detective' || arch === 'journalist') {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-8, -122 + breath, 16, 48);
  }

  // Arms
  const armSwing =
    pose === 'attack' || pose === 'recoil'
      ? -1.1
      : pose === 'gesture' || pose === 'soar'
        ? -0.75 + Math.sin(ts * 6 + seed) * 0.16
        : Math.sin(ts * 3.2 + seed) * 0.18 + stride * 0.03;

  ctx.save();
  ctx.translate(torsoW - 4, -114 + breath);
  ctx.rotate(armSwing);
  ctx.fillStyle = primary;
  ctx.fillRect(-6, 0, 12, 46);
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(0, 48, 7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(-torsoW + 4, -114 + breath);
  ctx.rotate(-armSwing * 0.6);
  ctx.fillStyle = primaryDark;
  ctx.fillRect(-6, 0, 12, 46);
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(0, 48, 7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Detailed Close-Up Head mounted on body
  ctx.save();
  ctx.translate(0, -152 + breath);
  ctx.scale(0.32, 0.32);
  drawUniversalActorCloseUp(ctx, cast, expression, viseme, speechEnergy, 'right', ts);
  ctx.restore();

  ctx.restore();
  return true;
}

// =========================================================================
// 4. UNIVERSAL STORY PROPS (+24 NEW PROPS -> 65 TOTAL)
// =========================================================================
export function drawUniversalStoryProp(
  ctx: CanvasRenderingContext2D,
  prop: PropId,
  t: number
): boolean {
  const ts = snap24(t);

  if (prop === 'magnifying_glass') {
    ctx.rotate(-0.45 + Math.sin(ts * 2.6) * 0.06);
    ctx.fillStyle = '#5c3317';
    ctx.fillRect(-7, 28, 14, 62);
    ctx.fillStyle = 'rgba(186, 230, 253, 0.42)';
    ctx.beginPath(); ctx.arc(0, -14, 42, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d49d35';
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath(); ctx.arc(-14, -26, 10, 0, Math.PI * 2); ctx.fill();
    return true;
  }

  if (prop === 'holo_tablet') {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.roundRect(-58, -42, 116, 84, 10); ctx.fill();
    ctx.fillStyle = '#082f49';
    ctx.fillRect(-50, -34, 100, 68);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) {
      const wBar = 32 + ((i * 23) % 48);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-40, -24 + i * 14, wBar, 6);
    }
    const scanY = -30 + ((ts * 42) % 60);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.fillRect(-50, scanY, 100, 6);
    return true;
  }

  if (prop === 'energy_blade') {
    ctx.rotate(-0.52);
    const pulse = 1 + Math.sin(ts * 18) * 0.12;
    ctx.fillStyle = 'rgba(34, 211, 238, 0.32)';
    ctx.beginPath(); ctx.roundRect(-16 * pulse, -118, 32 * pulse, 152, 14); ctx.fill();
    ctx.fillStyle = '#ecfeff';
    ctx.beginPath(); ctx.roundRect(-6, -112, 12, 144, 6); ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.fillRect(-10, 32, 20, 46);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-5, 44, 10, 8);
    return true;
  }

  if (prop === 'neon_drone') {
    const hover = Math.sin(ts * 4.5) * 9;
    ctx.translate(0, hover);
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff2bd6';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, 44, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
    return true;
  }

  if (prop === 'vintage_camera') {
    ctx.fillStyle = '#18181b';
    ctx.beginPath(); ctx.roundRect(-54, -32, 108, 68, 8); ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-54, -32, 108, 18);
    ctx.fillRect(-22, -46, 44, 14);
    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.arc(0, 4, 26, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(-6, -2, 8, 0, Math.PI * 2); ctx.fill();
    return true;
  }

  if (prop === 'microphone_stand') {
    ctx.fillStyle = '#334155';
    ctx.fillRect(-4, 14, 8, 68);
    ctx.fillRect(-28, 76, 56, 10);
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath(); ctx.roundRect(-22, -48, 44, 62, 22); ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    for (let y = -34; y <= 0; y += 8) {
      ctx.beginPath(); ctx.moveTo(-20, y); ctx.lineTo(20, y); ctx.stroke();
    }
    return true;
  }

  if (prop === 'briefcase') {
    ctx.fillStyle = '#5c3317';
    ctx.beginPath(); ctx.roundRect(-58, -32, 116, 74, 8); ctx.fill();
    ctx.strokeStyle = '#3b200e';
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(0, -32, 20, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-34, -8, 14, 12);
    ctx.fillRect(20, -8, 14, 12);
    return true;
  }

  if (prop === 'newspaper_frontpage') {
    ctx.rotate(-0.08);
    ctx.fillStyle = '#f1ead8';
    ctx.fillRect(-52, -62, 104, 124);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(-42, -50, 84, 16);
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(-42, -26, 44, 38);
    ctx.fillStyle = '#4b5563';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(8, -24 + i * 10, 34, 4);
      ctx.fillRect(-42, 20 + i * 10, 84, 4);
    }
    return true;
  }

  if (prop === 'coffee_mug') {
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.arc(34, 4, 18, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.roundRect(-34, -26, 68, 66, 10); ctx.fill();
    ctx.fillStyle = '#78350f';
    ctx.beginPath(); ctx.ellipse(0, -24, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
    // Rising deterministic steam curls
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3.5;
    for (const sx of [-12, 0, 12]) {
      const sw = Math.sin(ts * 3 + sx) * 6;
      ctx.beginPath();
      ctx.moveTo(sx, -34);
      ctx.quadraticCurveTo(sx + sw, -54, sx - sw, -74);
      ctx.stroke();
    }
    return true;
  }

  if (prop === 'laptop_screen') {
    ctx.fillStyle = '#334155';
    ctx.fillRect(-54, -44, 108, 70);
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(-48, -38, 96, 58);
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(-66, 26); ctx.lineTo(66, 26); ctx.lineTo(76, 42); ctx.lineTo(-76, 42); ctx.closePath();
    ctx.fill();
    return true;
  }

  if (prop === 'potion_flask') {
    const glow = 0.25 + Math.sin(ts * 5) * 0.1;
    ctx.fillStyle = `rgba(168, 85, 247, ${glow.toFixed(3)})`;
    ctx.beginPath(); ctx.arc(0, 14, 58, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9333ea';
    ctx.beginPath(); ctx.arc(0, 18, 38, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-12, -44, 24, 30);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-10, -56, 20, 14);
    return true;
  }

  if (prop === 'spellbook_tome') {
    ctx.fillStyle = '#581c87';
    ctx.beginPath(); ctx.roundRect(-52, -62, 104, 124, 8); ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 5;
    ctx.strokeRect(-42, -52, 84, 104);
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath(); ctx.arc(0, 0, 7 + Math.sin(ts * 4) * 2, 0, Math.PI * 2); ctx.fill();
    return true;
  }

  if (prop === 'wizard_staff') {
    ctx.rotate(-0.32);
    ctx.fillStyle = '#5c3317';
    ctx.fillRect(-6, -68, 12, 168);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, -82, 24, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(0, -82, 13 + Math.sin(ts * 6) * 2, 0, Math.PI * 2); ctx.fill();
    return true;
  }

  if (prop === 'crystal_amulet') {
    const hover = Math.sin(ts * 3.4) * 6;
    ctx.translate(0, hover);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, -44, 26, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.beginPath(); ctx.arc(0, 8, 52, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.moveTo(0, -36); ctx.lineTo(28, 8); ctx.lineTo(0, 52); ctx.lineTo(-28, 8); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ecfeff';
    ctx.beginPath();
    ctx.moveTo(0, -24); ctx.lineTo(12, 8); ctx.lineTo(0, 32); ctx.closePath();
    ctx.fill();
    return true;
  }

  if (prop === 'brass_compass') {
    ctx.fillStyle = '#b45309';
    ctx.beginPath(); ctx.arc(0, 0, 48, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath(); ctx.arc(0, 0, 38, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.rotate(Math.sin(ts * 2.2) * 0.45);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(8, 0); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(8, 0); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
    return true;
  }

  if (prop === 'antique_pocketwatch') {
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(0, -56, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(0, 0, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath(); ctx.arc(0, 0, 36, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ts * 1.8) * 24, Math.sin(ts * 1.8) * 24);
    ctx.moveTo(0, 0); ctx.lineTo(0, -18);
    ctx.stroke();
    return true;
  }

  if (prop === 'violin_bow') {
    ctx.rotate(-0.35);
    ctx.fillStyle = '#9a3412';
    ctx.beginPath(); ctx.ellipse(0, 22, 28, 36, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -14, 22, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-5, -82, 10, 86);
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-46, 36); ctx.lineTo(54, -56); ctx.stroke();
    return true;
  }

  if (prop === 'electric_guitar') {
    ctx.rotate(-0.42);
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.moveTo(-36, 48); ctx.lineTo(-24, -12); ctx.lineTo(24, -18); ctx.lineTo(38, 48); ctx.lineTo(0, 62);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-6, -98, 12, 118);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(-16, 12, 32, 10);
    ctx.fillRect(-16, 28, 32, 10);
    return true;
  }

  if (prop === 'golden_trophy') {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-32, 42, 64, 18);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-10, 12, 20, 32);
    ctx.beginPath();
    ctx.moveTo(-42, -52); ctx.lineTo(42, -52); ctx.quadraticCurveTo(36, 18, 0, 18); ctx.quadraticCurveTo(-36, 18, -42, -52);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(-42, -26, 16, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(42, -26, 16, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
    return true;
  }

  if (prop === 'judge_gavel') {
    ctx.rotate(-0.4 + Math.sin(ts * 4) * 0.14);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-6, -12, 12, 86);
    ctx.fillStyle = '#451a03';
    ctx.beginPath(); ctx.roundRect(-42, -40, 84, 34, 8); ctx.fill();
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-34, -40, 8, 34);
    ctx.fillRect(26, -40, 8, 34);
    return true;
  }

  if (prop === 'microscope') {
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-36, 44, 72, 14);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(12, 6, 36, -Math.PI * 0.6, Math.PI * 0.45); ctx.stroke();
    ctx.save();
    ctx.rotate(-0.35);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-10, -56, 20, 62);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-8, -62, 16, 8);
    ctx.restore();
    return true;
  }

  if (prop === 'rocket_model') {
    const hover = Math.sin(ts * 6) * 5;
    ctx.translate(0, hover);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.moveTo(-24, 20); ctx.lineTo(-44, 48); ctx.lineTo(-16, 42); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(24, 20); ctx.lineTo(44, 48); ctx.lineTo(16, 42); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(0, -76); ctx.quadraticCurveTo(32, -24, 22, 42); ctx.lineTo(-22, 42); ctx.quadraticCurveTo(-32, -24, 0, -76);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(0, -14, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.beginPath(); ctx.moveTo(-12, 44); ctx.lineTo(0, 74 + Math.sin(ts * 18) * 10); ctx.lineTo(12, 44); ctx.closePath(); ctx.fill();
    return true;
  }

  if (prop === 'pirate_map') {
    ctx.fillStyle = '#e7d3a7';
    ctx.fillRect(-62, -46, 124, 92);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(-42, 22); ctx.quadraticCurveTo(-6, -26, 32, 6);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(22, -8); ctx.lineTo(42, 16);
    ctx.moveTo(42, -8); ctx.lineTo(22, 16);
    ctx.stroke();
    return true;
  }

  if (prop === 'key_ornate') {
    ctx.rotate(-0.35 + Math.sin(ts * 2.5) * 0.05);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.arc(0, -44, 22, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-6, -22, 12, 92);
    ctx.fillRect(6, 36, 22, 10);
    ctx.fillRect(6, 54, 16, 10);
    return true;
  }

  return false;
}

// =========================================================================
// 5. UNIVERSAL WEATHER SYSTEMS (+6 NEW WEATHERS -> 12 TOTAL)
// =========================================================================
export function drawUniversalWeather(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  weather: WeatherId,
  pal: MoodPalette,
  t: number
): boolean {
  const s = Math.min(w, h) / 620;

  if (weather === 'snow') {
    ctx.fillStyle = 'rgba(240, 248, 255, 0.85)';
    for (let i = 0; i < 48; i++) {
      const sx = (((i * 83 + Math.sin(t * 1.1 + i) * 34 + t * 14) % (w + 40)) + w + 40) % (w + 40) - 20;
      const sy = ((t * (38 + (i % 4) * 14) * s + i * 71) % (h + 30)) - 15;
      const r = (2.2 + (i % 3) * 1.3) * s;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
    }
    return true;
  }

  if (weather === 'lightning_storm') {
    // Driving rain streaks + deterministic periodic lightning bolt & sky flash
    ctx.strokeStyle = 'rgba(196, 222, 255, 0.42)';
    ctx.lineWidth = 1.8 * s;
    for (let i = 0; i < 48; i++) {
      const rx = ((i * 73 + t * 240) % (w + 120)) - 60;
      const ry = ((i * 109 + t * 1080) % (h + 120)) - 60;
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 14 * s, ry + 38 * s); ctx.stroke();
    }
    const cycle = (t * 0.7) % 1;
    if (cycle < 0.08) {
      const flashA = (1 - cycle / 0.08) * 0.34;
      ctx.fillStyle = `rgba(220, 238, 255, ${flashA.toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
      const bx = w * (0.28 + (Math.floor(t * 0.7) % 3) * 0.22);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4 * s;
      ctx.beginPath();
      ctx.moveTo(bx, 0); ctx.lineTo(bx - 22 * s, h * 0.22);
      ctx.lineTo(bx + 18 * s, h * 0.44); ctx.lineTo(bx - 12 * s, h * 0.72);
      ctx.stroke();
    }
    return true;
  }

  if (weather === 'sandstorm') {
    // Sweeping horizontal ochre dust bands + fast grit specks
    for (let i = 0; i < 6; i++) {
      const sx = ((i * 220 + t * (140 + i * 24)) % (w + 360)) - 180;
      const sy = h * (0.18 + i * 0.13);
      ctx.fillStyle = 'rgba(217, 154, 78, 0.14)';
      ctx.fillRect(sx - 180 * s, sy, 360 * s, 28 * s);
    }
    ctx.fillStyle = 'rgba(245, 198, 128, 0.55)';
    for (let i = 0; i < 36; i++) {
      const gx = ((i * 97 + t * 380) % (w + 40)) - 20;
      const gy = ((i * 53 + Math.sin(t * 3 + i) * 18) % h + h) % h;
      ctx.fillRect(gx, gy, 5 * s, 2 * s);
    }
    return true;
  }

  if (weather === 'starfall') {
    // Diagonal shooting meteors with luminous tapered tails
    for (let i = 0; i < 8; i++) {
      const phase = ((t * 0.65 + i * 0.37) % 1);
      const sx = w * (0.1 + ((i * 29) % 85) * 0.01) + phase * w * 0.35;
      const sy = h * (0.04 + (i % 3) * 0.12) + phase * h * 0.48;
      const len = 54 * s;
      ctx.strokeStyle = i % 2 === 0 ? '#fffbeb' : pal.rimLight;
      ctx.lineWidth = 2.6 * s;
      ctx.globalAlpha = Math.sin(phase * Math.PI);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - len, sy - len * 0.55);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(sx, sy, 3 * s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    return true;
  }

  if (weather === 'sakura_blossoms') {
    for (let i = 0; i < 24; i++) {
      const px = (((i * 113 + Math.sin(t * 1.4 + i) * 52 + t * 24) % w) + w) % w;
      const py = ((t * (42 + (i % 3) * 12) * s + i * 79) % (h + 36)) - 18;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(t * 1.8 + i * 0.9);
      ctx.fillStyle = i % 2 === 0 ? '#f9a8d4' : '#fce7f3';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8 * s, 4.5 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    return true;
  }

  if (weather === 'data_matrix') {
    ctx.fillStyle = 'rgba(16, 185, 129, 0.55)';
    for (let c = 0; c < 18; c++) {
      const cx = (c + 0.5) * (w / 18);
      const headY = ((t * (110 + (c % 5) * 28) * s + c * 91) % (h + 160)) - 80;
      for (let k = 0; k < 6; k++) {
        ctx.globalAlpha = Math.max(0.08, 0.72 - k * 0.11);
        ctx.fillStyle = k === 0 ? '#a7f3d0' : '#10b981';
        ctx.fillRect(cx - 3 * s, headY - k * 14 * s, 6 * s, 9 * s);
      }
    }
    ctx.globalAlpha = 1;
    return true;
  }

  return false;
}

// =========================================================================
// 6. UNIVERSAL CROWD SILHOUETTE LAYERS (+6 NEW CROWDS -> 12 TOTAL)
// =========================================================================
export function drawUniversalCrowdLayer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  crowd: CrowdId,
  pal: MoodPalette,
  ts: number,
  _beat: StoryBeat | undefined,
  startle: number
): boolean {
  const s = Math.min(w, h) / 620;
  const baseY = h * 0.77;
  const positions = [0.06, 0.14, 0.22, 0.36, 0.64, 0.78, 0.86, 0.94];

  if (
    crowd !== 'city_commuters' &&
    crowd !== 'cyber_drones' &&
    crowd !== 'pirate_crew' &&
    crowd !== 'scholars_hall' &&
    crowd !== 'spectral_flock' &&
    crowd !== 'masquerade_ball'
  ) {
    return false;
  }

  ctx.save();
  ctx.fillStyle = pal.farSil;
  ctx.globalAlpha = 0.78;

  for (let i = 0; i < positions.length; i++) {
    const sideDir = positions[i] < 0.5 ? -1 : 1;
    const domino = clamp(startle * 1.2 - Math.abs(positions[i] - 0.5) * 0.35, 0, 1);
    const cx = w * positions[i] + domino * 10 * s * sideDir;
    const figH = (84 + (i % 3) * 10) * s;
    const bob = Math.sin(ts * 2.4 + i * 1.4) * 2.8 * s;

    ctx.save();
    ctx.translate(cx, baseY);
    ctx.rotate(domino * 0.14 * sideDir);

    if (crowd === 'city_commuters') {
      // Coat-wearing commuters with umbrellas / briefcases
      ctx.fillRect(-12 * s, -figH + bob, 24 * s, figH);
      ctx.beginPath(); ctx.arc(0, -figH - 10 * s + bob, 10 * s, 0, Math.PI * 2); ctx.fill();
      if (i % 2 === 0) {
        ctx.beginPath(); ctx.arc(0, -figH - 22 * s + bob, 26 * s, Math.PI, 0); ctx.fill();
      }
    } else if (crowd === 'cyber_drones') {
      // Hovering security drones with scanning cyan/magenta eyes
      const droneY = -figH * 1.15 + Math.sin(ts * 3.2 + i * 1.7) * 12 * s;
      ctx.beginPath(); ctx.arc(0, droneY, 15 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = i % 2 === 0 ? '#00f0ff' : '#ff2bd6';
      ctx.beginPath(); ctx.arc(0, droneY, 5 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pal.farSil;
    } else if (crowd === 'pirate_crew') {
      // Buccaneer silhouettes with tricorn hats & cutlasses
      ctx.fillRect(-13 * s, -figH + bob, 26 * s, figH);
      ctx.beginPath(); ctx.arc(0, -figH - 10 * s + bob, 11 * s, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-20 * s, -figH - 16 * s + bob);
      ctx.lineTo(0, -figH - 30 * s + bob);
      ctx.lineTo(20 * s, -figH - 16 * s + bob);
      ctx.closePath();
      ctx.fill();
    } else if (crowd === 'scholars_hall') {
      // Robed academics holding glowing scrolls/books
      ctx.beginPath();
      ctx.moveTo(-17 * s, bob); ctx.lineTo(-11 * s, -figH * 0.86 + bob);
      ctx.lineTo(11 * s, -figH * 0.86 + bob); ctx.lineTo(17 * s, bob); ctx.closePath();
      ctx.fill();
      ctx.beginPath(); ctx.arc(0, -figH * 0.96 + bob, 10 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(-14 * s, -figH * 1.07 + bob, 28 * s, 4 * s);
    } else if (crowd === 'spectral_flock') {
      // Soaring shadowy ravens / spirit wisps
      const wy = -figH * 1.25 + Math.sin(ts * 3.8 + i) * 18 * s;
      const flap = Math.sin(ts * 8 + i * 1.5) * 10 * s;
      ctx.beginPath();
      ctx.moveTo(-22 * s, wy - flap);
      ctx.quadraticCurveTo(0, wy + 8 * s, 22 * s, wy - flap);
      ctx.quadraticCurveTo(0, wy - 4 * s, -22 * s, wy - flap);
      ctx.fill();
    } else if (crowd === 'masquerade_ball') {
      // Gown & feathered mask gala silhouettes
      ctx.beginPath();
      ctx.moveTo(-22 * s, bob); ctx.lineTo(-9 * s, -figH * 0.82 + bob);
      ctx.lineTo(9 * s, -figH * 0.82 + bob); ctx.lineTo(22 * s, bob); ctx.closePath();
      ctx.fill();
      ctx.beginPath(); ctx.arc(0, -figH * 0.94 + bob, 10 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pal.accent;
      ctx.beginPath(); ctx.ellipse(7 * s, -figH * 1.08 + bob, 4 * s, 11 * s, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pal.farSil;
    }

    ctx.restore();
  }

  ctx.restore();
  return true;
}

// =========================================================================
// 7. UNIVERSAL KINETIC BEAT FX (+8 NEW FX -> 14 TOTAL)
// =========================================================================
export function drawUniversalBeatFx(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  fx: FxId,
  u: number,
  t: number
): boolean {
  const s = Math.min(w, h) / 620;

  if (fx === 'speed_lines') {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
    const diag = Math.hypot(w, h) * 0.56;
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2 + Math.floor(t * 16) * 0.03;
      const r0 = diag * (0.56 + ((i * 17) % 15) * 0.012);
      ctx.lineWidth = (1.6 + (i % 3) * 1.2) * s;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * diag, Math.sin(a) * diag);
      ctx.stroke();
    }
    ctx.restore();
    return true;
  }

  if (fx === 'magic_runes') {
    ctx.save();
    ctx.translate(w / 2, h * 0.48);
    ctx.rotate(t * 0.45);
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.48)';
    ctx.lineWidth = 3 * s;
    const rad = 168 * s;
    ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, rad * 0.82, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const b = ((i + 2) / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * rad * 0.82, Math.sin(a) * rad * 0.82);
      ctx.lineTo(Math.cos(b) * rad * 0.82, Math.sin(b) * rad * 0.82);
      ctx.stroke();
    }
    ctx.restore();
    return true;
  }

  if (fx === 'glitch_tear') {
    ctx.save();
    const tick = Math.floor(t * 14);
    for (let i = 0; i < 6; i++) {
      const gy = (((tick * 47 + i * 97) % 86) + 6) * 0.01 * h;
      const gh = (4 + (i % 3) * 5) * s;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(0, 240, 255, 0.24)' : 'rgba(255, 43, 214, 0.24)';
      ctx.fillRect(0, gy, w, gh);
    }
    ctx.restore();
    return true;
  }

  if (fx === 'sparkle_burst') {
    ctx.save();
    for (let i = 0; i < 16; i++) {
      const sx = (((i * 89 + 17) % 88) + 6) * 0.01 * w;
      const sy = (((i * 61 + 11) % 74) + 10) * 0.01 * h;
      const sp = (6 + 10 * Math.abs(Math.sin(t * 4.2 + i * 1.3))) * s;
      ctx.fillStyle = i % 2 === 0 ? '#fef08a' : '#ffffff';
      ctx.fillRect(sx - sp, sy - 1.5 * s, sp * 2, 3 * s);
      ctx.fillRect(sx - 1.5 * s, sy - sp, 3 * s, sp * 2);
    }
    ctx.restore();
    return true;
  }

  if (fx === 'spotlight_beam') {
    ctx.save();
    const grad = ctx.createLinearGradient(w * 0.5, 0, w * 0.5, h);
    grad.addColorStop(0, 'rgba(255, 248, 220, 0.32)');
    grad.addColorStop(1, 'rgba(255, 248, 220, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(w * 0.42, 0);
    ctx.lineTo(w * 0.58, 0);
    ctx.lineTo(w * 0.82, h);
    ctx.lineTo(w * 0.18, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return true;
  }

  if (fx === 'shatter_glass') {
    ctx.save();
    ctx.translate(w * 0.5, h * 0.48);
    ctx.strokeStyle = 'rgba(226, 244, 255, 0.45)';
    ctx.lineWidth = 2.5 * s;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + 0.12;
      const r = (95 + (i % 4) * 58) * s;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.stroke();
    }
    ctx.restore();
    return true;
  }

  if (fx === 'heartbeat_pulse') {
    const beatPulse = Math.pow(Math.abs(Math.sin(t * 3.8)), 4);
    ctx.save();
    const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.28, w / 2, h / 2, Math.max(w, h) * 0.62);
    vig.addColorStop(0, 'rgba(225, 29, 72, 0)');
    vig.addColorStop(1, `rgba(225, 29, 72, ${(0.12 + beatPulse * 0.28).toFixed(3)})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    return true;
  }

  if (fx === 'comic_pow') {
    const pop = 0.88 + Math.sin(u * Math.PI) * 0.24;
    ctx.save();
    ctx.translate(w * 0.78, h * 0.25);
    ctx.scale(pop, pop);
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 5 * s;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const r = (i % 2 === 0 ? 54 : 32) * s;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#dc2626';
    ctx.font = `900 ${Math.round(28 * s)}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 0, 2 * s);
    ctx.restore();
    return true;
  }

  return false;
}
