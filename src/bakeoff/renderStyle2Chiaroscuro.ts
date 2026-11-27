import {
  DirectorFrameState,
  clamp,
  drawCaptionOverlay,
  easeOutCubic,
  lerp,
  smoothstep,
} from './script';

/**
 * Style 2: Bold Chiaroscuro 2D Graphic-Novel Rig (Samurai Jack × Over the Garden Wall)
 * - Zero fussy outlines: razor-sharp lineless geometric shapes & stark chiaroscuro light splits
 * - Snappy 24fps stepped character animation feel ("on twos/threes") over smooth 60fps cameras
 * - Bold crimson, cobalt-obsidian, ice-silver, and flat burnished gold palette
 */

// Quantize character pose time to crisp 24fps TV animation cadence
function snap24(t: number): number {
  return Math.floor(t * 24) / 24;
}

function drawGraphicMoon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number
): void {
  ctx.save();
  // Hard graphic stepped halo rings (zero muddy blurs)
  ctx.fillStyle = 'rgba(186, 214, 255, 0.06)';
  ctx.beginPath();
  ctx.arc(x, y, r * 1.48, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(210, 230, 255, 0.11)';
  ctx.beginPath();
  ctx.arc(x, y, r * 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Razor-crisp flat ice-white moon disc
  ctx.fillStyle = '#ebf3ff';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Geometric crescent shadow carve
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#c4d8f5';
  ctx.beginPath();
  ctx.arc(x + r * 0.42, y + r * 0.24, r * 0.92, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

function drawGraphicBanyan(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  t: number
): void {
  const ts = snap24(t);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  // Sculptural angular black-indigo silhouette trunk & sweeping bough
  ctx.fillStyle = '#060814';
  ctx.beginPath();
  ctx.moveTo(-64, 16);
  ctx.lineTo(-32, -135);
  ctx.lineTo(-194, -144);
  ctx.lineTo(-186, -162);
  ctx.lineTo(-24, -172);
  ctx.lineTo(14, -242);
  ctx.lineTo(44, -134);
  ctx.lineTo(78, 16);
  ctx.closePath();
  ctx.fill();

  // Razor-sharp cobalt moonlight rim slice on left edge of trunk & top of bough
  ctx.fillStyle = '#3b5796';
  ctx.beginPath();
  ctx.moveTo(-186, -162);
  ctx.lineTo(-24, -172);
  ctx.lineTo(-24, -165);
  ctx.lineTo(-184, -155);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-64, 16);
  ctx.lineTo(-32, -135);
  ctx.lineTo(-24, -135);
  ctx.lineTo(-52, 16);
  ctx.closePath();
  ctx.fill();

  // Crisp vertical hanging root ribbons
  ctx.fillStyle = '#060814';
  const rootXs = [-164, -124, -84, 58, 86];
  for (let i = 0; i < rootXs.length; i++) {
    const sway = Math.sin(ts * 2 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(rootXs[i], -148);
    ctx.lineTo(rootXs[i] + 5, -148);
    ctx.lineTo(rootXs[i] + 2 + sway, -12 + (i % 2) * 20);
    ctx.lineTo(rootXs[i] - 1 + sway, -12 + (i % 2) * 20);
    ctx.closePath();
    ctx.fill();
  }

  // Bold geometric faceted canopy polygons (Samurai Jack woodblock vibe!)
  const shapes: Array<[number[], string]> = [
    [[-210, -176, -134, -242, -32, -238, -96, -154], '#091224'],
    [[-64, -238, 18, -288, 118, -232, 68, -164, -52, -176], '#0d1a33'],
    [[34, -196, 138, -240, 200, -172, 110, -142], '#070e1d'],
    // Sharp moonlight edge facets along top-left canopy
    [[-210, -176, -134, -242, -118, -232, -192, -172], '#6d94cc'],
    [[-64, -238, 18, -288, 22, -276, -50, -230], '#8db4e8'],
  ];
  for (const [pts, col] of shapes) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

// Lineless Geometric Vikramaditya Full-Body Rig (Bold Cape + Razor Silhouette)
function drawGraphicVikramFull(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  t: number,
  walking: boolean,
  lookUpAmt: number
): void {
  const ts = snap24(t);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  const cycle = walking ? ts * 7.2 : 0;
  const stride = walking ? Math.sin(cycle) * 18 : 0;
  const bob = walking ? Math.abs(Math.sin(cycle)) * -6 : 0;

  // Sharp oval ground shadow
  ctx.fillStyle = '#04060d';
  ctx.beginPath();
  ctx.ellipse(0, 4, 34, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(0, bob);

  // Dramatic Sweeping Razor-Crimson Cape (angular graphic polygon)
  const whip = Math.sin(ts * 6.5) * 12 + (walking ? 18 : 4);
  ctx.fillStyle = '#c91832';
  ctx.beginPath();
  ctx.moveTo(-12, -124);
  ctx.lineTo(-68 - whip, -22);
  ctx.lineTo(-42 - whip * 0.5, -10);
  ctx.lineTo(4, -24);
  ctx.lineTo(10, -120);
  ctx.closePath();
  ctx.fill();
  // Hard chiaroscuro cape shadow fold
  ctx.fillStyle = '#69091a';
  ctx.beginPath();
  ctx.moveTo(-12, -124);
  ctx.lineTo(-68 - whip, -22);
  ctx.lineTo(-48 - whip * 0.7, -18);
  ctx.lineTo(-2, -118);
  ctx.closePath();
  ctx.fill();

  // Angular Striding Legs & Golden Dhoti
  ctx.fillStyle = '#121526';
  ctx.fillRect(-16 - stride * 0.5, -18, 12, 20);
  ctx.fillRect(6 + stride * 0.5, -18, 12, 20);

  ctx.fillStyle = '#f2bc38';
  ctx.beginPath();
  ctx.moveTo(-20, -64);
  ctx.lineTo(20, -64);
  ctx.lineTo(25 + stride * 0.35, -10);
  ctx.lineTo(0, -22);
  ctx.lineTo(-24 - stride * 0.35, -10);
  ctx.closePath();
  ctx.fill();
  // Left shadow facet of dhoti
  ctx.fillStyle = '#a87518';
  ctx.beginPath();
  ctx.moveTo(-20, -64);
  ctx.lineTo(-2, -64);
  ctx.lineTo(0, -22);
  ctx.lineTo(-24 - stride * 0.35, -10);
  ctx.closePath();
  ctx.fill();

  // Broad Heroic Wedge Torso (Crimson + Gold Sash)
  ctx.fillStyle = '#e01d3b';
  ctx.beginPath();
  ctx.moveTo(-24, -124);
  ctx.lineTo(24, -124);
  ctx.lineTo(18, -64);
  ctx.lineTo(-18, -64);
  ctx.closePath();
  ctx.fill();
  // Hard shadow half
  ctx.fillStyle = '#870d23';
  ctx.beginPath();
  ctx.moveTo(-24, -124);
  ctx.lineTo(-2, -124);
  ctx.lineTo(-2, -64);
  ctx.lineTo(-18, -64);
  ctx.closePath();
  ctx.fill();
  // Crisp diagonal gold sash
  ctx.fillStyle = '#ffd04d';
  ctx.beginPath();
  ctx.moveTo(-20, -124);
  ctx.lineTo(-10, -124);
  ctx.lineTo(18, -66);
  ctx.lineTo(8, -66);
  ctx.closePath();
  ctx.fill();

  // Articulated Sword Arm + Stark White-Silver Khanda Blade
  ctx.save();
  ctx.translate(18, -116);
  ctx.rotate(walking ? Math.sin(cycle) * 0.28 - 0.12 : -0.2 - lookUpAmt * 0.32);
  ctx.fillStyle = '#d48d63';
  ctx.fillRect(-5, 0, 10, 40);
  // Gleaming geometric Khanda
  ctx.save();
  ctx.translate(2, 38);
  ctx.rotate(-0.65);
  ctx.fillStyle = '#f5bf38';
  ctx.fillRect(-6, -3, 14, 6);
  ctx.fillRect(6, -11, 4, 22);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(10, -4);
  ctx.lineTo(72, -9);
  ctx.lineTo(84, 0);
  ctx.lineTo(72, 8);
  ctx.lineTo(10, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#9bb8db';
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(84, 0);
  ctx.lineTo(72, 8);
  ctx.lineTo(10, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore();

  // Angular Sculpted Head + Sharp Tiered Mukut Crown
  ctx.save();
  ctx.translate(2, -128);
  ctx.rotate(-lookUpAmt * 0.3);

  // Flowing angular hair silhouette
  ctx.fillStyle = '#070914';
  ctx.beginPath();
  ctx.moveTo(-24, -30);
  ctx.lineTo(-28, 4);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-4, -30);
  ctx.closePath();
  ctx.fill();

  // Sharp chiseled face
  ctx.fillStyle = '#e09a6e';
  ctx.beginPath();
  ctx.moveTo(-12, -32);
  ctx.lineTo(16, -32);
  ctx.lineTo(18, -10);
  ctx.lineTo(10, 2);
  ctx.lineTo(-10, 0);
  ctx.closePath();
  ctx.fill();
  // Hard chiaroscuro left face shadow
  ctx.fillStyle = '#965638';
  ctx.beginPath();
  ctx.moveTo(-12, -32);
  ctx.lineTo(2, -32);
  ctx.lineTo(2, 1);
  ctx.lineTo(-10, 0);
  ctx.closePath();
  ctx.fill();
  // Crisp angular eye & mustache
  ctx.fillStyle = '#070914';
  ctx.fillRect(6, -22, 6, 2.5);
  ctx.beginPath();
  ctx.moveTo(4, -10);
  ctx.lineTo(18, -13);
  ctx.lineTo(16, -7);
  ctx.closePath();
  ctx.fill();

  // Stark Geometric Golden Mukut Crown
  ctx.fillStyle = '#ffd04d';
  ctx.beginPath();
  ctx.moveTo(-16, -30);
  ctx.lineTo(-12, -48);
  ctx.lineTo(-6, -50);
  ctx.lineTo(0, -72);
  ctx.lineTo(8, -50);
  ctx.lineTo(14, -48);
  ctx.lineTo(18, -30);
  ctx.closePath();
  ctx.fill();
  // Shadow half of crown
  ctx.fillStyle = '#b57b14';
  ctx.beginPath();
  ctx.moveTo(-16, -30);
  ctx.lineTo(-12, -48);
  ctx.lineTo(-6, -50);
  ctx.lineTo(0, -72);
  ctx.lineTo(0, -30);
  ctx.closePath();
  ctx.fill();
  // Ruby diamond
  ctx.fillStyle = '#ff173d';
  ctx.beginPath();
  ctx.moveTo(4, -45);
  ctx.lineTo(9, -38);
  ctx.lineTo(4, -31);
  ctx.lineTo(-1, -38);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

// Cut 2: Stark Chiaroscuro Graphic-Novel Betaal Close-Up (Half-Face Shadow Split + Sharp Acting!)
function drawGraphicBetaalCU(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: DirectorFrameState
): void {
  const ts = snap24(state.t);
  const { cutU, viseme, speechEnergy } = state;
  const cx = w * 0.5;
  const cy = h * (state.aspect === '9:16' ? 0.45 : 0.49);
  const s = Math.min(w, h) / 620;

  // Deep obsidian-cobalt graphic backdrop
  ctx.fillStyle = '#070b1a';
  ctx.fillRect(0, 0, w, h);

  // Oversized dramatic graphic moon directly behind Betaal (pure Samurai Jack framing!)
  drawGraphicMoon(ctx, cx, cy - 18 * s, 245 * s);

  // Bold diagonal speed/night shadow band slashing across bottom corner
  ctx.fillStyle = '#050814';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.72);
  ctx.lineTo(w, h * 0.58);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  const zoom = lerp(1.0, 1.08, smoothstep(cutU));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s * zoom, s * zoom);

  // Snappy stepped sway & head tilt
  ctx.rotate(Math.sin(ts * 2.4) * 0.05 + (speechEnergy > 0.55 ? 0.03 : 0));

  // Stark black angular hair spikes fanning dramatically against the huge white moon!
  const spikeShift = Math.sin(ts * 5.2) * 8;
  ctx.fillStyle = '#060814';
  ctx.beginPath();
  ctx.moveTo(-110, -250);
  ctx.lineTo(110, -250);
  ctx.lineTo(126, -40);
  ctx.lineTo(154 + spikeShift, 48);
  ctx.lineTo(106, 98);
  ctx.lineTo(118 - spikeShift, 186);
  ctx.lineTo(54, 142);
  ctx.lineTo(18 + spikeShift * 0.5, 218);
  ctx.lineTo(-24, 148);
  ctx.lineTo(-88 - spikeShift, 204);
  ctx.lineTo(-102, 108);
  ctx.lineTo(-152 + spikeShift, 58);
  ctx.lineTo(-124, -40);
  ctx.closePath();
  ctx.fill();

  // Razor-sharp angular Betaal head with HARD CHIAROSCURO HALF-FACE SPLIT!
  ctx.save();
  ctx.translate(0, 10);

  // Lit ice-blue half (full shape base)
  ctx.fillStyle = '#d4e6fa';
  ctx.beginPath();
  ctx.moveTo(0, -108);
  ctx.lineTo(74, -68);
  ctx.lineTo(80, 18);
  ctx.lineTo(44, 86);
  ctx.lineTo(0, 118);
  ctx.lineTo(-44, 86);
  ctx.lineTo(-80, 18);
  ctx.lineTo(-74, -68);
  ctx.closePath();
  ctx.fill();

  // Hard Chiaroscuro Shadow Split covering left side of face!
  ctx.fillStyle = '#182447';
  ctx.beginPath();
  ctx.moveTo(0, -108);
  ctx.lineTo(-4, -22);
  ctx.lineTo(-14, 18);
  ctx.lineTo(4, 34);
  ctx.lineTo(0, 118);
  ctx.lineTo(-44, 86);
  ctx.lineTo(-80, 18);
  ctx.lineTo(-74, -68);
  ctx.closePath();
  ctx.fill();

  // Crisp secondary cheekbone shadow facet on lit right side
  ctx.fillStyle = '#8aa8cc';
  ctx.beginPath();
  ctx.moveTo(80, 18);
  ctx.lineTo(44, 86);
  ctx.lineTo(28, 30);
  ctx.closePath();
  ctx.fill();

  // Dramatic Slanted Glowing Crimson Eyes (stark geometric wedges!)
  const browSnap = speechEnergy > 0.45 ? -10 : 0;
  const blink = cutU > 0.45 && cutU < 0.49 ? 0.1 : 1;

  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 34, -8);
    ctx.scale(1, blink);
    // Razor crimson sclera/eye wedge
    ctx.fillStyle = '#ff173d';
    ctx.beginPath();
    ctx.moveTo(-26 * side, -2);
    ctx.lineTo(22 * side, -16);
    ctx.lineTo(16 * side, 10);
    ctx.closePath();
    ctx.fill();
    // Bright white-hot pinpoint pupil
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(2 * side, -6);
    ctx.lineTo(9 * side, -3);
    ctx.lineTo(2 * side, 2);
    ctx.lineTo(-3 * side, -3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Bold angular eyebrow slash
    ctx.fillStyle = '#050712';
    ctx.beginPath();
    ctx.moveTo(side * 10, -24 + browSnap * 0.3);
    ctx.lineTo(side * 68, -46 + browSnap);
    ctx.lineTo(side * 66, -34 + browSnap);
    ctx.lineTo(side * 12, -16 + browSnap * 0.3);
    ctx.closePath();
    ctx.fill();
  }

  // Snappy Geometric Lip-Sync Grin (4 bold graphic shapes!)
  const openH = [6, 16, 28, 40][viseme];
  ctx.save();
  ctx.translate(0, 56);
  ctx.fillStyle = '#090714';
  ctx.beginPath();
  ctx.moveTo(-46, -8);
  ctx.lineTo(46, -8);
  ctx.lineTo(30, openH);
  ctx.lineTo(0, openH + 8);
  ctx.lineTo(-30, openH);
  ctx.closePath();
  ctx.fill();
  if (viseme >= 1) {
    // Sharp triangular fangs
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-28, -8); ctx.lineTo(-21, 9); ctx.lineTo(-14, -8);
    ctx.moveTo(14, -8); ctx.lineTo(21, 9); ctx.lineTo(28, -8);
    ctx.fill();
    if (viseme >= 2) {
      ctx.fillStyle = '#e61c38';
      ctx.beginPath();
      ctx.moveTo(-18, openH);
      ctx.lineTo(0, openH - 10);
      ctx.lineTo(18, openH);
      ctx.lineTo(0, openH + 6);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();

  // Sharp angular gesturing claw hand entering from left
  const handY = 128 - Math.sin(cutU * Math.PI) * 32 - (speechEnergy > 0.5 ? 14 : 0);
  ctx.save();
  ctx.translate(-134, handY);
  ctx.rotate(-0.18);
  ctx.fillStyle = '#b4cde8';
  ctx.beginPath();
  ctx.moveTo(-18, 28);
  ctx.lineTo(-26, -18);
  ctx.lineTo(2, -74); // sharp pointing finger
  ctx.lineTo(12, -72);
  ctx.lineTo(10, -14);
  ctx.lineTo(26, -10);
  ctx.lineTo(18, 28);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#182447';
  ctx.beginPath();
  ctx.moveTo(-18, 28);
  ctx.lineTo(-26, -18);
  ctx.lineTo(2, -74);
  ctx.lineTo(-2, -16);
  ctx.lineTo(-6, 28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
  ctx.restore();
}

// Cut 3: Sharp Chiaroscuro Vikram CU -> Diagonal Graphic-Novel Panel Slash into Lotus Flashback!
function drawGraphicVikramAndFlashback(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: DirectorFrameState
): void {
  const { cutT, viseme, speechEnergy, flashbackMix, petalImpact } = state;
  const cx = w * 0.5;
  const cy = h * 0.5;
  const s = Math.min(w, h) / 620;

  // 1. Vikram Bold Heroic Close-Up (dramatic crimson-gold chiaroscuro backdrop!)
  ctx.fillStyle = '#090e21';
  ctx.fillRect(0, 0, w, h);
  // Diagonal stark crimson graphic backdrop stripe
  ctx.fillStyle = '#851025';
  ctx.beginPath();
  ctx.moveTo(w * 0.58, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w * 0.78, h);
  ctx.lineTo(w * 0.34, h);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.translate(cx, cy + 38 * s);
  ctx.scale(s * (1.03 + cutT * 0.03), s * (1.03 + cutT * 0.03));

  // Broad graphic crimson shoulders
  ctx.fillStyle = '#d91a36';
  ctx.beginPath();
  ctx.moveTo(-210, 260);
  ctx.lineTo(-140, 98);
  ctx.lineTo(140, 98);
  ctx.lineTo(210, 260);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6e0a1c';
  ctx.beginPath();
  ctx.moveTo(-210, 260);
  ctx.lineTo(-140, 98);
  ctx.lineTo(0, 98);
  ctx.lineTo(0, 260);
  ctx.closePath();
  ctx.fill();

  // Sharp silhouette hair block
  ctx.fillStyle = '#060812';
  ctx.beginPath();
  ctx.moveTo(-104, -76);
  ctx.lineTo(104, -76);
  ctx.lineTo(118, 96);
  ctx.lineTo(-118, 96);
  ctx.closePath();
  ctx.fill();

  // Angular Heroic Face with Crisp Half-Face Chiaroscuro Split!
  ctx.fillStyle = '#e8a57a';
  ctx.beginPath();
  ctx.moveTo(-78, -78);
  ctx.lineTo(78, -78);
  ctx.lineTo(72, 24);
  ctx.lineTo(28, 86);
  ctx.lineTo(-28, 86);
  ctx.lineTo(-72, 24);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#995738';
  ctx.beginPath();
  ctx.moveTo(-78, -78);
  ctx.lineTo(0, -78);
  ctx.lineTo(0, 86);
  ctx.lineTo(-28, 86);
  ctx.lineTo(-72, 24);
  ctx.closePath();
  ctx.fill();

  // Bold Crimson Tilak & Fierce Angular Brows
  ctx.fillStyle = '#ff1c42';
  ctx.fillRect(-5, -62, 10, 28);
  const fDrop = speechEnergy > 0.45 ? 5 : 0;
  ctx.fillStyle = '#060812';
  ctx.beginPath();
  ctx.moveTo(-58, -32); ctx.lineTo(-10, -20 + fDrop); ctx.lineTo(-12, -10 + fDrop); ctx.lineTo(-56, -20); ctx.closePath();
  ctx.moveTo(58, -32); ctx.lineTo(10, -20 + fDrop); ctx.lineTo(12, -10 + fDrop); ctx.lineTo(56, -20); ctx.closePath();
  ctx.fill();

  // Intense narrow graphic eyes
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(side * 34 - 16, -12, 32, 8);
    ctx.fillStyle = '#060812';
    ctx.fillRect(side * 34 - 5, -12, 10, 8);
  }

  // Sculpted angular mustache & speaking jaw
  ctx.fillStyle = '#060812';
  ctx.beginPath();
  ctx.moveTo(0, 22);
  ctx.lineTo(-52, 36);
  ctx.lineTo(-34, 42);
  ctx.lineTo(0, 32);
  ctx.lineTo(34, 42);
  ctx.lineTo(52, 36);
  ctx.closePath();
  ctx.fill();

  const mouthH = [4, 12, 20, 28][viseme];
  ctx.fillStyle = '#290811';
  ctx.fillRect(-20, 42, 40, mouthH * 0.7);

  // Geometric Tiered Gold Mukut with Chiaroscuro Split
  ctx.fillStyle = '#ffd147';
  ctx.beginPath();
  ctx.moveTo(-88, -76);
  ctx.lineTo(-72, -138);
  ctx.lineTo(-42, -142);
  ctx.lineTo(0, -226);
  ctx.lineTo(42, -142);
  ctx.lineTo(72, -138);
  ctx.lineTo(88, -76);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ad7110';
  ctx.beginPath();
  ctx.moveTo(-88, -76);
  ctx.lineTo(-72, -138);
  ctx.lineTo(-42, -142);
  ctx.lineTo(0, -226);
  ctx.lineTo(0, -76);
  ctx.closePath();
  ctx.fill();
  // Stark ruby diamond
  ctx.fillStyle = '#ff173d';
  ctx.beginPath();
  ctx.moveTo(0, -132);
  ctx.lineTo(15, -108);
  ctx.lineTo(0, -84);
  ctx.lineTo(-15, -108);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 2. Snappy Diagonal Graphic-Novel Panel Slash into Stark Monochrome-Indigo + Neon-Pink Lotus Flashback!
  if (flashbackMix > 0.01) {
    const slashX = lerp(w * 1.25, -w * 0.15, easeOutCubic(flashbackMix));
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(slashX + w * 0.2, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h);
    ctx.lineTo(slashX, h);
    ctx.closePath();
    ctx.clip();

    // Stark Cobalt-Indigo Graphic Terrace
    ctx.fillStyle = '#080e24';
    ctx.fillRect(0, 0, w, h);

    // Razor-edged diagonal white moonlight beam!
    ctx.fillStyle = 'rgba(230, 242, 255, 0.18)';
    ctx.beginPath();
    ctx.moveTo(w * 0.14, 0);
    ctx.lineTo(w * 0.44, 0);
    ctx.lineTo(w * 0.88, h);
    ctx.lineTo(w * 0.42, h);
    ctx.closePath();
    ctx.fill();

    // Minimalist stark marble terrace slab
    ctx.fillStyle = '#dce6f7';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = '#1d2d57';
    ctx.fillRect(0, h * 0.72, w, 10 * s);

    // Brother 3 Graphic Silhouette + Exposed Moonlit Shoulder
    const bx = w * 0.52;
    const by = h * 0.72;
    const joltX = petalImpact > 0 ? -18 * s * smoothstep(clamp(petalImpact * 4, 0, 1)) : 0;

    ctx.save();
    ctx.translate(bx + joltX, by);
    ctx.scale(s * 1.12, s * 1.12);

    // Graphic seated robe triangle
    ctx.fillStyle = '#18254d';
    ctx.beginPath();
    ctx.moveTo(-90, 0);
    ctx.lineTo(-42, -124);
    ctx.lineTo(42, -124);
    ctx.lineTo(90, 0);
    ctx.closePath();
    ctx.fill();
    // Exposed moonlit shoulder wedge
    ctx.fillStyle = '#e8a87e';
    ctx.beginPath();
    ctx.moveTo(4, -124);
    ctx.lineTo(46, -120);
    ctx.lineTo(54, -70);
    ctx.lineTo(14, -76);
    ctx.closePath();
    ctx.fill();
    // Chiseled Head + Crisp White Turban
    ctx.fillStyle = '#e8a87e';
    ctx.beginPath();
    ctx.moveTo(-28, -196);
    ctx.lineTo(28, -196);
    ctx.lineTo(24, -132);
    ctx.lineTo(-24, -132);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#18254d';
    ctx.fillRect(-28, -196, 26, 64);
    ctx.fillStyle = '#f2f6ff';
    ctx.beginPath();
    ctx.moveTo(-40, -184);
    ctx.lineTo(0, -214);
    ctx.lineTo(42, -184);
    ctx.lineTo(30, -172);
    ctx.lineTo(-32, -172);
    ctx.closePath();
    ctx.fill();

    // Eye expression: serene -> sharp shock lines!
    ctx.fillStyle = '#070b1a';
    if (petalImpact > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(10, -162, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#070b1a';
      ctx.beginPath();
      ctx.arc(12, -162, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(2, -162, 14, 3);
    }

    // Vivid Neon-Pink Lotus Petal drifting smoothly down onto his shoulder!
    const fallU = clamp((cutT - 1.05) / 0.93, 0, 1);
    const shX = 32;
    const shY = -120;
    const px = fallU >= 1 ? shX : lerp(108, shX, fallU) + Math.sin(fallU * Math.PI * 3) * 34 * (1 - fallU);
    const py = fallU >= 1 ? shY : lerp(-300, shY, smoothstep(fallU));

    // Graphic concentric shock rings & crimson flash on impact!
    if (petalImpact > 0) {
      const r1 = (14 + petalImpact * 78);
      ctx.strokeStyle = `rgba(255, 36, 94, ${clamp(1 - petalImpact, 0, 1)})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(shX, shY, r1, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${clamp(1 - petalImpact * 1.4, 0, 1)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(shX, shY, r1 * 0.55, 0, Math.PI * 2);
      ctx.stroke();

      // Stark crimson bruise mark
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.moveTo(shX - 10, shY + 4);
      ctx.lineTo(shX + 12, shY - 2);
      ctx.lineTo(shX + 8, shY + 12);
      ctx.closePath();
      ctx.fill();
    }

    // Razor-crisp Vivid Pink Lotus Petal
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(fallU >= 1 ? 0.22 : Math.sin(fallU * Math.PI * 3) * 0.65);
    ctx.fillStyle = '#ff3b8d';
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.quadraticCurveTo(0, -18, 26, 0);
    ctx.quadraticCurveTo(0, 14, -26, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffc2dd';
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.quadraticCurveTo(0, -10, 18, -2);
    ctx.quadraticCurveTo(0, 2, -22, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();

    // 2-frame graphic crimson impact flash right when the petal touches!
    if (petalImpact > 0 && petalImpact < 0.14) {
      ctx.fillStyle = 'rgba(255, 30, 86, 0.22)';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();

    // Bold golden-white graphic panel divider blade during wipe
    if (flashbackMix < 0.99) {
      ctx.strokeStyle = '#ffd04d';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(slashX + w * 0.2, 0);
      ctx.lineTo(slashX, h);
      ctx.stroke();
    }
  }
}

// Cut 4: Extreme Low-Angle Graphic Escape Swoop with Animated Crimson-White Smear Arcs!
function drawGraphicEscape(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: DirectorFrameState
): void {
  const { t, cutU } = state;
  const s = Math.min(w, h) / 620;

  ctx.fillStyle = '#060a18';
  ctx.fillRect(0, 0, w, h);

  // Giant graphic full moon dominating center-left sky
  const moonX = w * (state.aspect === '9:16' ? 0.45 : 0.38);
  const moonY = h * 0.34;
  drawGraphicMoon(ctx, moonX, moonY, 155 * s);

  // Bold silhouette Banyan framing right third
  drawGraphicBanyan(ctx, w * 0.85, h * 0.88, s * 1.5, t);

  // Stark foreground ridge + Vikram looking up
  ctx.fillStyle = '#050712';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.8);
  ctx.lineTo(w * 0.45, h * 0.77);
  ctx.lineTo(w, h * 0.84);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  drawGraphicVikramFull(ctx, w * 0.22, h * 0.84, s * 0.86, t, false, 1.0);

  // Betaal streaking across the moon with razor-sharp anime/graphic smear ribbons!
  const u = easeOutCubic(cutU);
  const startX = w * 0.28, startY = h * 0.56;
  const endX = w * 0.78, endY = h * 0.26;
  const bx = lerp(startX, endX, u);
  const by = lerp(startY, endY, u) - Math.sin(u * Math.PI) * 104 * s;

  // Dynamic motion-smear crescent ribbon (Samurai Jack action smear!)
  ctx.save();
  ctx.strokeStyle = '#ff1c42';
  ctx.lineWidth = 10 * s * (1 - u * 0.45);
  ctx.lineCap = 'round';
  ctx.beginPath();
  const tailU = Math.max(0, u - 0.34);
  const tx = lerp(startX, endX, tailU);
  const ty = lerp(startY, endY, tailU) - Math.sin(tailU * Math.PI) * 104 * s;
  const midU = (u + tailU) * 0.5;
  const mx = lerp(startX, endX, midU);
  const my = lerp(startY, endY, midU) - Math.sin(midU * Math.PI) * 104 * s - 16 * s;
  ctx.moveTo(tx, ty);
  ctx.quadraticCurveTo(mx, my, bx, by);
  ctx.stroke();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3.5 * s * (1 - u * 0.4);
  ctx.beginPath();
  ctx.moveTo(lerp(tx, bx, 0.3), lerp(ty, by, 0.3));
  ctx.quadraticCurveTo(mx, my, bx, by);
  ctx.stroke();
  ctx.restore();

  // Stark flying Betaal silhouette darting across the white moon
  ctx.save();
  ctx.translate(bx, by);
  ctx.scale(s * lerp(0.95, 0.58, u), s * lerp(0.95, 0.58, u));
  ctx.rotate(-0.42 + u * 0.28);
  ctx.fillStyle = '#060814';
  ctx.beginPath();
  ctx.moveTo(28, -6);
  ctx.lineTo(-14, -28);
  ctx.lineTo(-86, -4);
  ctx.lineTo(-42, 8);
  ctx.lineTo(-74, 28);
  ctx.lineTo(6, 16);
  ctx.closePath();
  ctx.fill();
  // Razor glowing crimson eyes trailing
  ctx.fillStyle = '#ff173d';
  ctx.beginPath();
  ctx.moveTo(14, -10);
  ctx.lineTo(24, -14);
  ctx.lineTo(20, -4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// =========================================================================
// MAIN ENTRY POINT FOR STYLE 2: BOLD CHIAROSCURO 2D GRAPHIC-NOVEL RIG
// =========================================================================
export function renderStyle2Chiaroscuro(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: DirectorFrameState
): void {
  ctx.save();
  const s = Math.min(w, h) / 620;

  if (state.cut.id === 'establishing') {
    const { t, cutU } = state;
    const camZoom = lerp(1.0, 1.09, smoothstep(cutU));

    // Stark layered cobalt-to-obsidian graphic sky bands
    ctx.fillStyle = '#070b1a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#0d1633';
    ctx.fillRect(0, h * 0.32, w, h * 0.42);
    ctx.fillStyle = '#13224a';
    ctx.fillRect(0, h * 0.54, w, h * 0.22);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(camZoom, camZoom);
    ctx.translate(-w / 2, -h / 2);

    // Oversized razor-clean full moon
    drawGraphicMoon(ctx, w * 0.24, h * 0.25, 76 * s);

    // Geometric angular distant forest ridges
    ctx.fillStyle = '#091124';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.68);
    ctx.lineTo(w * 0.18, h * 0.58);
    ctx.lineTo(w * 0.38, h * 0.65);
    ctx.lineTo(w * 0.66, h * 0.55);
    ctx.lineTo(w, h * 0.64);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Stark silhouette ground plane + razor-edged moonlit path
    ctx.fillStyle = '#08121f';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = '#1e2c4a';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.87);
    ctx.lineTo(w * 0.5, h * 0.8);
    ctx.lineTo(w, h * 0.85);
    ctx.lineTo(w, h * 0.94);
    ctx.lineTo(w * 0.5, h * 0.89);
    ctx.lineTo(0, h * 0.96);
    ctx.closePath();
    ctx.fill();

    // Sculptural Graphic Banyan on right
    const banyanX = w * (state.aspect === '9:16' ? 0.76 : 0.74);
    const banyanY = h * 0.78;
    drawGraphicBanyan(ctx, banyanX, banyanY, s * 1.25, t);

    // Upside-down Betaal silhouette with stark glowing crimson eye slits
    const bx = banyanX - 158 * s;
    const by = banyanY - 190 * s;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(Math.sin(snap24(t) * 2.4) * 0.08);
    ctx.scale(s * 0.74, s * 0.74);
    ctx.fillStyle = '#060814';
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(14, 0);
    ctx.lineTo(22, 62);
    ctx.lineTo(0, 92);
    ctx.lineTo(-22, 62);
    ctx.closePath();
    ctx.fill();
    // Lit pale silver edge on right half
    ctx.fillStyle = '#c4daf2';
    ctx.beginPath();
    ctx.moveTo(0, 44);
    ctx.lineTo(14, 52);
    ctx.lineTo(12, 72);
    ctx.lineTo(0, 78);
    ctx.closePath();
    ctx.fill();
    // Stark glowing crimson eye wedges
    ctx.fillStyle = '#ff173d';
    ctx.fillRect(-9, 62, 6, 3);
    ctx.fillRect(3, 62, 6, 3);
    ctx.restore();

    // Minimalist graphic amber diya flame cones
    for (const [dx, dy] of [
      [w * 0.22, h * 0.83],
      [w * 0.56, h * 0.81],
    ]) {
      ctx.fillStyle = 'rgba(245, 191, 56, 0.14)';
      ctx.beginPath();
      ctx.arc(dx, dy - 6 * s, 54 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd147';
      ctx.beginPath();
      ctx.moveTo(dx, dy - 18 * s);
      ctx.lineTo(dx + 6 * s, dy - 2 * s);
      ctx.lineTo(dx - 6 * s, dy - 2 * s);
      ctx.closePath();
      ctx.fill();
    }

    // Vikram strides cleanly into frame and snaps up to face Betaal!
    const walkU = smoothstep(clamp(cutU / 0.72, 0, 1));
    const vx = lerp(w * 0.14, w * (state.aspect === '9:16' ? 0.34 : 0.36), walkU);
    const vy = h * 0.85;
    const isWalking = cutU < 0.72;
    const lookUp = smoothstep(clamp((cutU - 0.68) / 0.24, 0, 1));
    drawGraphicVikramFull(ctx, vx, vy, s * 0.95, t, isWalking, lookUp);

    // Crisp floating graphic embers (diamond sparks)
    for (let i = 0; i < 12; i++) {
      const fx = ((i * 89) % 100) / 100 * w + Math.sin(t * 1.1 + i) * 14 * s;
      const fy = h * 0.3 + ((i * 53) % 55) / 100 * h + Math.cos(t * 1.3 + i) * 10 * s;
      const r = 3.5 * s;
      ctx.fillStyle = i % 3 === 0 ? '#ff3855' : '#e4efff';
      ctx.beginPath();
      ctx.moveTo(fx, fy - r);
      ctx.lineTo(fx + r, fy);
      ctx.lineTo(fx, fy + r);
      ctx.lineTo(fx - r, fy);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  } else if (state.cut.id === 'betaal_cu') {
    drawGraphicBetaalCU(ctx, w, h, state);
  } else if (state.cut.id === 'vikram_flashback') {
    drawGraphicVikramAndFlashback(ctx, w, h, state);
  } else {
    drawGraphicEscape(ctx, w, h, state);
  }

  // Subtle letterbox cinema hairline bars in 16:9 for graphic-novel prestige polish
  if (state.aspect === '16:9') {
    const barH = Math.round(h * 0.032);
    ctx.fillStyle = '#04050c';
    ctx.fillRect(0, 0, w, barH);
    ctx.fillRect(0, h - barH, w, barH);
  }

  // Clean subtitles (optional toggle)
  drawCaptionOverlay(ctx, w, h, state, 'chiaroscuro');

  ctx.restore();
}
