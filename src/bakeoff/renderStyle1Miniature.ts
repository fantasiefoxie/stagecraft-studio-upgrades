import {
  DirectorFrameState,
  clamp,
  drawCaptionOverlay,
  easeOutBack,
  easeOutCubic,
  lerp,
  smoothstep,
} from './script';

// Pre-baked subtle handmade cotton-paper grain pattern (cached once)
let paperPatternCanvas: HTMLCanvasElement | null = null;
function getPaperGrain(): HTMLCanvasElement {
  if (paperPatternCanvas) return paperPatternCanvas;
  const c = document.createElement('canvas');
  c.width = 160;
  c.height = 160;
  const g = c.getContext('2d')!;
  const img = g.createImageData(160, 160);
  let s = 918273;
  const rnd = () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 218 + Math.floor((rnd() - 0.5) * 34);
    img.data[i] = v;
    img.data[i + 1] = v - 6;
    img.data[i + 2] = v - 16;
    img.data[i + 3] = 28;
  }
  g.putImageData(img, 0, 0);
  // Subtle horizontal laid-paper fibers
  g.strokeStyle = 'rgba(245, 224, 178, 0.06)';
  g.lineWidth = 1;
  for (let y = 0; y < 160; y += 6) {
    g.beginPath();
    g.moveTo(0, y + 0.5);
    g.lineTo(160, y + 0.5);
    g.stroke();
  }
  paperPatternCanvas = c;
  return c;
}

// Helper: scalloped Rajput / Mughal architectural arch path
function traceRajputArch(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number
): void {
  ctx.beginPath();
  ctx.moveTo(cx - rx, cy + ry);
  ctx.lineTo(cx - rx, cy - ry * 0.2);
  // Left scalloped lobes climbing to ogee apex
  ctx.quadraticCurveTo(cx - rx * 1.02, cy - ry * 0.58, cx - rx * 0.68, cy - ry * 0.68);
  ctx.quadraticCurveTo(cx - rx * 0.55, cy - ry * 0.92, cx - rx * 0.24, cy - ry * 0.88);
  ctx.quadraticCurveTo(cx - rx * 0.1, cy - ry * 1.02, cx, cy - ry * 1.08);
  // Right scalloped lobes mirrored
  ctx.quadraticCurveTo(cx + rx * 0.1, cy - ry * 1.02, cx + rx * 0.24, cy - ry * 0.88);
  ctx.quadraticCurveTo(cx + rx * 0.55, cy - ry * 0.92, cx + rx * 0.68, cy - ry * 0.68);
  ctx.quadraticCurveTo(cx + rx * 1.02, cy - ry * 0.58, cx + rx, cy - ry * 0.2);
  ctx.lineTo(cx + rx, cy + ry);
  ctx.closePath();
}

// Draw illuminated warm parchment full moon with miniature ring motifs
function drawIlluminatedMoon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  t: number
): void {
  ctx.save();
  // Warm golden-indigo watercolor halo
  const halo = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 3.1);
  halo.addColorStop(0, 'rgba(255, 234, 173, 0.36)');
  halo.addColorStop(0.45, 'rgba(235, 192, 118, 0.14)');
  halo.addColorStop(1, 'rgba(23, 35, 68, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, r * 3.1, 0, Math.PI * 2);
  ctx.fill();

  // Concentric fine gold-leaf celestial ring (classic miniature illumination)
  ctx.strokeStyle = 'rgba(245, 206, 112, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.24, 0, Math.PI * 2);
  ctx.stroke();

  // Moon disc with painterly parchment warmth
  const disc = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.1, x, y, r);
  disc.addColorStop(0, '#fff7dc');
  disc.addColorStop(0.7, '#eedcb0');
  disc.addColorStop(1, '#c9af7b');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Soft decorative craters & cloud scroll
  ctx.fillStyle = 'rgba(156, 128, 80, 0.22)';
  ctx.beginPath();
  ctx.arc(x - r * 0.28, y - r * 0.12, r * 0.22, 0, Math.PI * 2);
  ctx.arc(x + r * 0.25, y + r * 0.24, r * 0.18, 0, Math.PI * 2);
  ctx.arc(x + r * 0.16, y - r * 0.32, r * 0.11, 0, Math.PI * 2);
  ctx.fill();

  // Delicate curled Pahari cloud ribbon drifting gently past moon
  const cx = x + Math.sin(t * 0.4) * r * 0.15;
  const cy = y + r * 0.62;
  ctx.fillStyle = 'rgba(26, 36, 66, 0.72)';
  ctx.strokeStyle = 'rgba(245, 209, 128, 0.42)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - r * 1.5, cy);
  ctx.bezierCurveTo(cx - r * 1.1, cy - r * 0.32, cx - r * 0.5, cy - r * 0.3, cx - r * 0.2, cy - r * 0.08);
  ctx.bezierCurveTo(cx + r * 0.2, cy - r * 0.36, cx + r * 0.9, cy - r * 0.34, cx + r * 1.4, cy + r * 0.02);
  ctx.bezierCurveTo(cx + r * 0.9, cy + r * 0.24, cx - r * 0.8, cy + r * 0.24, cx - r * 1.5, cy);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

// Draw layered cutout Banyan tree with warm paper-cut shadows and aerial roots
function drawMiniatureBanyan(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  t: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  // Subtle paper-cutout drop shadow
  ctx.shadowColor = 'rgba(7, 5, 16, 0.62)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;

  // Main gnarled trunk & sweeping left bough
  const barkGrad = ctx.createLinearGradient(-120, -240, 90, 20);
  barkGrad.addColorStop(0, '#5c3c2e');
  barkGrad.addColorStop(0.55, '#3b241d');
  barkGrad.addColorStop(1, '#241513');
  ctx.fillStyle = barkGrad;
  ctx.strokeStyle = '#140c0d';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(-58, 12);
  ctx.quadraticCurveTo(-34, -45, -30, -140);
  // Sweeping hanging bough to left
  ctx.quadraticCurveTo(-90, -155, -182, -142);
  ctx.quadraticCurveTo(-195, -156, -172, -166);
  ctx.quadraticCurveTo(-94, -182, -24, -178);
  ctx.quadraticCurveTo(-10, -230, 12, -238);
  ctx.quadraticCurveTo(45, -210, 40, -130);
  ctx.quadraticCurveTo(50, -40, 74, 12);
  ctx.quadraticCurveTo(10, 22, -58, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Hanging aerial prop roots swaying very gently
  ctx.shadowBlur = 4;
  ctx.strokeStyle = '#4e3124';
  ctx.lineWidth = 3.5;
  const roots = [
    [-148, -146, -154, -42],
    [-116, -154, -120, -24],
    [-82, -158, -86, 4],
    [52, -144, 62, 6],
    [76, -138, 86, -18],
  ];
  for (let i = 0; i < roots.length; i++) {
    const [rx0, ry0, rx1, ry1] = roots[i];
    const sway = Math.sin(t * 1.4 + i * 1.1) * 4;
    ctx.beginPath();
    ctx.moveTo(rx0, ry0);
    ctx.quadraticCurveTo((rx0 + rx1) / 2 + sway, (ry0 + ry1) / 2, rx1 + sway * 1.3, ry1);
    ctx.stroke();
  }

  // Ornamental miniature foliage clusters (scalloped lotus-leaf domes with gold moonlit rims!)
  ctx.shadowBlur = 14;
  const domes = [
    { cx: -120, cy: -206, rx: 92, ry: 54, c0: '#2e6b54', c1: '#15362d' },
    { cx: 74, cy: -196, rx: 98, ry: 58, c0: '#275c49', c1: '#122e28' },
    { cx: -18, cy: -234, rx: 118, ry: 66, c0: '#398061', c1: '#193d33' },
    { cx: -168, cy: -176, rx: 46, ry: 30, c0: '#327559', c1: '#183b31' },
  ];
  for (const d of domes) {
    const g = ctx.createRadialGradient(d.cx - d.rx * 0.25, d.cy - d.ry * 0.35, 10, d.cx, d.cy, d.rx);
    g.addColorStop(0, d.c0);
    g.addColorStop(1, d.c1);
    ctx.fillStyle = g;
    ctx.strokeStyle = '#111d1c';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(d.cx, d.cy, d.rx, d.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Subtle miniature-painting leaf scallops & gilded moonlit rim highlights
    ctx.strokeStyle = 'rgba(242, 214, 138, 0.32)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(d.cx, d.cy, d.rx * 0.78, Math.PI * 1.12, Math.PI * 1.68);
    ctx.stroke();
  }

  ctx.restore();
}

// Draw Vikramaditya Full-Body Articulated Cutout Puppet (Cut 1 & Cut 4)
function drawMiniatureVikramFull(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  t: number,
  walking: boolean,
  lookUpAmt: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  const cycle = walking ? t * 7.2 : 0;
  const stride = walking ? Math.sin(cycle) * 16 : 0;
  const bob = walking ? Math.abs(Math.sin(cycle)) * -6 : Math.sin(t * 2.2) * -1.5;

  // Ground shadow
  ctx.fillStyle = 'rgba(8, 6, 16, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 36, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(0, bob);

  // Flowing multi-curve crimson brocade cape with golden border
  const capeWave = Math.sin(t * 4.5) * 10 + (walking ? 12 : 3);
  ctx.save();
  ctx.shadowColor = 'rgba(8, 5, 16, 0.45)';
  ctx.shadowBlur = 8;
  const capeGrad = ctx.createLinearGradient(-56, -120, 10, -10);
  capeGrad.addColorStop(0, '#b51f36');
  capeGrad.addColorStop(1, '#5e0e1e');
  ctx.fillStyle = capeGrad;
  ctx.strokeStyle = '#1b0d12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, -122);
  ctx.quadraticCurveTo(-50 - capeWave * 0.5, -72, -58 - capeWave, -16);
  ctx.quadraticCurveTo(-24, -8, -4, -20);
  ctx.lineTo(8, -118);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Gold embroidered cape trim
  ctx.strokeStyle = '#f2c44d';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-56 - capeWave, -18);
  ctx.quadraticCurveTo(-24, -10, -4, -22);
  ctx.stroke();
  ctx.restore();

  // Legs & Pleated Golden Dhoti
  ctx.strokeStyle = '#1b0d12';
  ctx.lineWidth = 2;
  // Back foot
  ctx.fillStyle = '#5c2d20';
  ctx.beginPath();
  ctx.ellipse(-8 - stride * 0.7, 0, 12, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Front foot
  ctx.fillStyle = '#753927';
  ctx.beginPath();
  ctx.ellipse(10 + stride * 0.7, 2, 13, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pleated Dhoti cutout
  const dhotiGrad = ctx.createLinearGradient(-22, -64, 24, -6);
  dhotiGrad.addColorStop(0, '#f5d273');
  dhotiGrad.addColorStop(1, '#b57b24');
  ctx.fillStyle = dhotiGrad;
  ctx.beginPath();
  ctx.moveTo(-20, -64);
  ctx.lineTo(20, -64);
  ctx.lineTo(24 + stride * 0.35, -8);
  ctx.lineTo(2, -16);
  ctx.lineTo(-22 - stride * 0.35, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Crimson Royal Angarkha Tunic + Gold Sash
  ctx.shadowColor = 'rgba(8, 5, 16, 0.35)';
  ctx.shadowBlur = 6;
  const tunicGrad = ctx.createLinearGradient(-22, -124, 24, -60);
  tunicGrad.addColorStop(0, '#cf2942');
  tunicGrad.addColorStop(1, '#7a1226');
  ctx.fillStyle = tunicGrad;
  ctx.beginPath();
  ctx.roundRect(-21, -124, 42, 64, 12);
  ctx.fill();
  ctx.stroke();

  // Diagonal gilded royal sash
  ctx.fillStyle = '#f5ca54';
  ctx.beginPath();
  ctx.moveTo(-18, -120);
  ctx.lineTo(-8, -122);
  ctx.lineTo(20, -68);
  ctx.lineTo(10, -64);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Articulated Front Arm + Gleaming Curved Steel Khanda Sword
  ctx.save();
  ctx.translate(14, -112);
  ctx.rotate(walking ? Math.sin(cycle) * 0.22 - 0.1 : -0.25 - lookUpAmt * 0.25);
  // Brass puppet rivet on shoulder
  ctx.fillStyle = '#cf2942';
  ctx.beginPath();
  ctx.roundRect(-7, -4, 14, 42, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f5ca54';
  ctx.beginPath();
  ctx.arc(0, 2, 3, 0, Math.PI * 2);
  ctx.fill();
  // Hand
  ctx.fillStyle = '#d49065';
  ctx.beginPath();
  ctx.arc(2, 42, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Khanda Sword (broad-tipped Indian royal blade)
  ctx.save();
  ctx.translate(4, 42);
  ctx.rotate(-0.62);
  const bladeGrad = ctx.createLinearGradient(0, 0, 74, 0);
  bladeGrad.addColorStop(0, '#a6bad4');
  bladeGrad.addColorStop(0.6, '#eef6ff');
  bladeGrad.addColorStop(1, '#ffffff');
  ctx.fillStyle = bladeGrad;
  ctx.beginPath();
  ctx.moveTo(8, -4);
  ctx.lineTo(66, -8);
  ctx.lineTo(76, 0);
  ctx.lineTo(66, 7);
  ctx.lineTo(8, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Gold hilt & knuckle guard
  ctx.fillStyle = '#f5ca54';
  ctx.fillRect(-6, -3, 14, 6);
  ctx.fillRect(6, -10, 4, 20);
  ctx.restore();
  ctx.restore();

  // Articulated Head + Tiered Golden Mukut Crown
  ctx.save();
  ctx.translate(2, -130);
  ctx.rotate(-lookUpAmt * 0.28);

  // Flowing dark hair behind head
  ctx.fillStyle = '#1b1526';
  ctx.beginPath();
  ctx.ellipse(-6, -12, 20, 22, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Sculpted Miniature Profile Face
  const skinGrad = ctx.createLinearGradient(-12, -32, 18, 2);
  skinGrad.addColorStop(0, '#e3a276');
  skinGrad.addColorStop(1, '#ad6b44');
  ctx.fillStyle = skinGrad;
  ctx.beginPath();
  ctx.ellipse(2, -16, 16, 19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Lotus eye & noble curved mustache
  ctx.fillStyle = '#181018';
  ctx.beginPath();
  ctx.ellipse(9, -19, 3.5, 2, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff5e0';
  ctx.beginPath();
  ctx.arc(10, -19.5, 1, 0, Math.PI * 2);
  ctx.fill();
  // Mustache
  ctx.strokeStyle = '#181018';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(6, -10);
  ctx.quadraticCurveTo(13, -11, 18, -13);
  ctx.stroke();

  // Ornate Tiered Gold-Leaf Mukut Crown with Ruby Gem!
  const crownGrad = ctx.createLinearGradient(-16, -64, 18, -28);
  crownGrad.addColorStop(0, '#fff0a8');
  crownGrad.addColorStop(0.5, '#f2bc38');
  crownGrad.addColorStop(1, '#a86b14');
  ctx.fillStyle = crownGrad;
  ctx.strokeStyle = '#1b0d12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-17, -28);
  ctx.lineTo(-14, -44);
  ctx.lineTo(-9, -46);
  ctx.lineTo(-6, -58);
  ctx.lineTo(0, -68);
  ctx.lineTo(6, -58);
  ctx.lineTo(9, -46);
  ctx.lineTo(15, -44);
  ctx.lineTo(17, -28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glowing Ruby Gem
  ctx.fillStyle = '#ff214d';
  ctx.beginPath();
  ctx.ellipse(6, -37, 4, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffa6b8';
  ctx.beginPath();
  ctx.arc(5, -39, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

// Draw Betaal Close-Up Acting Rig (Cut 2 — Lip-Sync + Brow Acting + Mudra Gesture!)
function drawMiniatureBetaalCU(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: DirectorFrameState
): void {
  const { t, cutU, viseme, speechEnergy } = state;
  const cx = w * 0.5;
  const cy = h * (state.aspect === '9:16' ? 0.44 : 0.48);
  const s = Math.min(w, h) / 620;

  // Deep indigo nocturnal watercolor backdrop with backlit moon glow behind Betaal
  const bg = ctx.createRadialGradient(cx, cy - 30 * s, 20 * s, cx, cy, Math.max(w, h) * 0.72);
  bg.addColorStop(0, '#2a3763');
  bg.addColorStop(0.45, '#151c3b');
  bg.addColorStop(1, '#090b1a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Illuminated Moon framing behind Betaal's head
  drawIlluminatedMoon(ctx, cx + 115 * s, cy - 110 * s, 96 * s, t);

  // Subtle slow dramatic push-in during Betaal's riddle
  const zoom = lerp(1.0, 1.07, smoothstep(cutU));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s * zoom, s * zoom);

  // Hanging banyan branch & roots framing top of shot
  ctx.fillStyle = '#38221b';
  ctx.strokeStyle = '#140c0d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-420, -255);
  ctx.quadraticCurveTo(0, -225, 420, -260);
  ctx.lineTo(420, -295);
  ctx.lineTo(-420, -295);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Gentle upside-down pendulum sway + lively voiceover head nod!
  const swayAngle = Math.sin(t * 2.1) * 0.055 + speechEnergy * 0.035;
  ctx.rotate(swayAngle);

  // Betaal's shoulders & tattered indigo-violet shroud entering from top
  ctx.shadowColor = 'rgba(5, 4, 14, 0.55)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#363a5c';
  ctx.strokeStyle = '#140f21';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-110, -245);
  ctx.quadraticCurveTo(-96, -120, -56, -78);
  ctx.lineTo(56, -78);
  ctx.quadraticCurveTo(96, -120, 110, -245);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wild swirling charcoal-violet miniature hair cascading downward (upside-down!)
  const hairWave = Math.sin(t * 3.4) * 10;
  const hairGrad = ctx.createLinearGradient(0, -40, 0, 215);
  hairGrad.addColorStop(0, '#2a2147');
  hairGrad.addColorStop(1, '#120d21');
  ctx.fillStyle = hairGrad;
  ctx.beginPath();
  ctx.moveTo(-98, -68);
  ctx.bezierCurveTo(-132, 30, -112 + hairWave, 140, -68 + hairWave, 205);
  ctx.quadraticCurveTo(-34 + hairWave * 0.5, 160, -12, 216);
  ctx.quadraticCurveTo(22 - hairWave * 0.5, 162, 54 - hairWave, 204);
  ctx.bezierCurveTo(114 - hairWave, 140, 132, 30, 98, -68);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Pale moonlit spirit face (upside-down! Chin near bottom-top, forehead near bottom?
  // Note: Betaal hangs upside down, tilting his head slyly so his face reads clearly!)
  // Let's render him angled slyly upside-down with eyes lower & grin above OR tilting upright-sideways
  // Actually, hanging with head tilted at a dramatic 150°–165° sly angle or classic upright-readable
  // upside-down orientation: let's keep eyes & grin super clear and instantly readable!
  ctx.save();
  ctx.translate(0, 14);

  // Sculpted angular cutout head with warm rim-light wash
  const faceGrad = ctx.createRadialGradient(-20, -20, 12, 0, 0, 118);
  faceGrad.addColorStop(0, '#e3effa');
  faceGrad.addColorStop(0.65, '#a6bdd6');
  faceGrad.addColorStop(1, '#687f9e');
  ctx.fillStyle = faceGrad;
  ctx.strokeStyle = '#181124';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -108);
  ctx.bezierCurveTo(68, -104, 88, -32, 74, 42);
  ctx.bezierCurveTo(60, 94, 24, 114, 0, 116);
  ctx.bezierCurveTo(-24, 114, -60, 94, -74, 42);
  ctx.bezierCurveTo(-88, -32, -68, -104, 0, -108);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Warm amber diya rim highlight on right cheekbone
  ctx.strokeStyle = 'rgba(255, 205, 110, 0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(10, 8, 72, -0.35, 0.75);
  ctx.stroke();

  // Ornate miniature ear ornaments
  ctx.fillStyle = '#e8b648';
  ctx.beginPath();
  ctx.arc(-78, 4, 10, 0, Math.PI * 2);
  ctx.arc(78, 4, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Expressive Arched Eyebrows (animated with voiceover emphasis!)
  const browLift = speechEnergy * 10 + Math.sin(cutU * Math.PI * 2) * 4;
  ctx.strokeStyle = '#1b142e';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  // Left sly brow
  ctx.beginPath();
  ctx.moveTo(-58, -26 - browLift * 0.6);
  ctx.quadraticCurveTo(-32, -46 - browLift, -12, -22);
  ctx.stroke();
  // Right raised mischievous brow
  ctx.beginPath();
  ctx.moveTo(12, -22);
  ctx.quadraticCurveTo(36, -50 - browLift * 1.2, 60, -28 - browLift * 0.5);
  ctx.stroke();

  // Iconic Illuminated Lotus-Shaped Glowing Crimson Eyes!
  const blink = cutU > 0.44 && cutU < 0.49 ? 0.12 : 1.0;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 34, -8);
    ctx.scale(1, blink);
    // Eye socket shadow
    ctx.fillStyle = 'rgba(34, 22, 58, 0.42)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 14, side * -0.12, 0, Math.PI * 2);
    ctx.fill();
    // Lotus eye outline
    ctx.fillStyle = '#1f0b18';
    ctx.beginPath();
    ctx.moveTo(-22, 2);
    ctx.quadraticCurveTo(0, -16, 22, 0);
    ctx.quadraticCurveTo(0, 14, -22, 2);
    ctx.closePath();
    ctx.fill();
    // Glowing crimson iris
    const eyeGlow = ctx.createRadialGradient(side * -2, 0, 2, 0, 0, 14);
    eyeGlow.addColorStop(0, '#ff8599');
    eyeGlow.addColorStop(0.55, '#ff1c42');
    eyeGlow.addColorStop(1, '#850a20');
    ctx.fillStyle = eyeGlow;
    ctx.beginPath();
    ctx.arc(Math.sin(t * 1.4) * 3, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    // Crisp specular pinpoint
    ctx.fillStyle = '#fff5f7';
    ctx.beginPath();
    ctx.arc(Math.sin(t * 1.4) * 3 - 3, -3, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Sculpted nose bridge line (miniature art style)
  ctx.strokeStyle = '#5c728f';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(-4, 24);
  ctx.quadraticCurveTo(2, 30, 8, 24);
  ctx.stroke();

  // REAL VOICEOVER-DRIVEN 4-SHAPE VISEME MOUTH (Wicked Fanged Grin!)
  const openH = [5, 14, 24, 34][viseme];
  const mouthW = [42, 46, 48, 44][viseme];
  ctx.save();
  ctx.translate(0, 56);
  ctx.fillStyle = '#290d1b';
  ctx.strokeStyle = '#140b14';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-mouthW, -4);
  ctx.quadraticCurveTo(0, -10, mouthW, -4);
  ctx.quadraticCurveTo(0, openH + 10, -mouthW, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (viseme >= 1) {
    // Crisp pointed spirit fangs & tongue visible during open syllables
    ctx.fillStyle = '#f5f0e4';
    ctx.beginPath();
    ctx.moveTo(-24, -4);
    ctx.lineTo(-19, 8);
    ctx.lineTo(-14, -4);
    ctx.moveTo(14, -4);
    ctx.lineTo(19, 8);
    ctx.lineTo(24, -4);
    ctx.fill();
  }
  ctx.restore();

  // Articulated Mischievous Cutout Hand gesturing upward on riddle beat!
  const handLift = Math.sin(cutU * Math.PI) * 34 + speechEnergy * 14;
  ctx.save();
  ctx.translate(-128, 130 - handLift);
  ctx.rotate(-0.22 + speechEnergy * 0.14);
  ctx.fillStyle = '#b4c9e0';
  ctx.strokeStyle = '#181124';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.roundRect(-22, -26, 44, 48, 16);
  ctx.fill();
  ctx.stroke();
  // Pointing index finger (mudra riddle gesture)
  ctx.beginPath();
  ctx.roundRect(6, -68, 12, 48, 6);
  ctx.fill();
  ctx.stroke();
  // Gold bangle on wrist
  ctx.strokeStyle = '#f2c24b';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-20, 18);
  ctx.lineTo(20, 18);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
  ctx.restore();
}

// Draw Vikram Reaction Close-Up + Illuminated Rajput Arch Lotus Petal Flashback (Cut 3)
function drawMiniatureVikramAndFlashback(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: DirectorFrameState
): void {
  const { t, cutT, viseme, speechEnergy, flashbackMix, petalImpact } = state;
  const cx = w * 0.5;
  const cy = h * 0.5;
  const s = Math.min(w, h) / 620;

  // 1. Base Layer: Vikram Determined Close-Up
  const bg = ctx.createRadialGradient(cx - 60 * s, cy, 30 * s, cx, cy, Math.max(w, h) * 0.7);
  bg.addColorStop(0, '#362336');
  bg.addColorStop(0.5, '#191a33');
  bg.addColorStop(1, '#0a0b17');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Warm flickering diya firelight rim from lower left
  const fireGrad = ctx.createRadialGradient(cx - 220 * s, cy + 160 * s, 10, cx - 200 * s, cy + 140 * s, 380 * s);
  fireGrad.addColorStop(0, 'rgba(255, 178, 62, 0.36)');
  fireGrad.addColorStop(1, 'rgba(255, 140, 32, 0)');
  ctx.fillStyle = fireGrad;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(cx, cy + 36 * s);
  ctx.scale(s * (1.02 + cutT * 0.03), s * (1.02 + cutT * 0.03));

  // Royal Crimson Shoulders & Gilded Necklace
  ctx.fillStyle = '#9e1b32';
  ctx.strokeStyle = '#1b0d12';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-190, 260);
  ctx.quadraticCurveTo(-150, 120, -68, 94);
  ctx.lineTo(68, 94);
  ctx.quadraticCurveTo(150, 120, 190, 260);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Golden bead necklace
  ctx.strokeStyle = '#f5ca54';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 92, 62, 0.25, Math.PI - 0.25);
  ctx.stroke();

  // Flowing dark hair behind shoulders
  ctx.fillStyle = '#181224';
  ctx.beginPath();
  ctx.ellipse(0, -10, 114, 132, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sculpted Heroic Face
  const skinG = ctx.createRadialGradient(-28, -20, 16, 0, 0, 118);
  skinG.addColorStop(0, '#ebb086');
  skinG.addColorStop(0.65, '#c47f56');
  skinG.addColorStop(1, '#8c5132');
  ctx.fillStyle = skinG;
  ctx.strokeStyle = '#1b0d12';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -8, 82, 98, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Crimson Royal Tilak
  ctx.fillStyle = '#e6223c';
  ctx.beginPath();
  ctx.moveTo(0, -64);
  ctx.quadraticCurveTo(7, -42, 0, -32);
  ctx.quadraticCurveTo(-7, -42, 0, -64);
  ctx.fill();

  // Furrowed heroic brows & focused lotus eyes
  const browFurrow = 4 + speechEnergy * 5;
  ctx.strokeStyle = '#181018';
  ctx.lineWidth = 6.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-54, -30);
  ctx.quadraticCurveTo(-28, -36, -12, -24 + browFurrow * 0.4);
  ctx.moveTo(54, -30);
  ctx.quadraticCurveTo(28, -36, 12, -24 + browFurrow * 0.4);
  ctx.stroke();

  for (const side of [-1, 1]) {
    ctx.fillStyle = '#fff6e8';
    ctx.beginPath();
    ctx.moveTo(side * 16, -12);
    ctx.quadraticCurveTo(side * 34, -24, side * 52, -12);
    ctx.quadraticCurveTo(side * 34, -1, side * 16, -12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1d1218';
    ctx.beginPath();
    ctx.arc(side * 34, -12, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(side * 32, -14, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sculpted Royal Mustache
  ctx.fillStyle = '#171121';
  ctx.beginPath();
  ctx.moveTo(0, 26);
  ctx.quadraticCurveTo(-24, 22, -48, 36);
  ctx.quadraticCurveTo(-24, 38, 0, 34);
  ctx.quadraticCurveTo(24, 38, 48, 36);
  ctx.quadraticCurveTo(24, 22, 0, 26);
  ctx.fill();

  // Animated Voiceover Lip-Sync Mouth
  const vOpen = [3, 10, 17, 23][viseme];
  ctx.fillStyle = '#4f121e';
  ctx.beginPath();
  ctx.ellipse(0, 46, 20, vOpen * 0.55 + 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ornate Gilded Tiered Mukut Crown with Ruby & Gold Filigree
  const mukutG = ctx.createLinearGradient(-90, -220, 90, -80);
  mukutG.addColorStop(0, '#fff2b0');
  mukutG.addColorStop(0.5, '#f0ba37');
  mukutG.addColorStop(1, '#995e12');
  ctx.fillStyle = mukutG;
  ctx.strokeStyle = '#1b0d12';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-88, -76);
  ctx.lineTo(-76, -134);
  ctx.lineTo(-48, -142);
  ctx.lineTo(-34, -186);
  ctx.lineTo(0, -224);
  ctx.lineTo(34, -186);
  ctx.lineTo(48, -142);
  ctx.lineTo(76, -134);
  ctx.lineTo(88, -76);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Center Ruby Jewel
  ctx.fillStyle = '#ff1f4b';
  ctx.beginPath();
  ctx.ellipse(0, -112, 14, 19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffb3c4';
  ctx.beginPath();
  ctx.ellipse(-4, -118, 4, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Seamless Illuminated Rajasthani Arch Wipe into Lotus Petal Flashback!
  if (flashbackMix > 0.01) {
    const archScale = easeOutBack(flashbackMix);
    const archRx = (state.aspect === '9:16' ? w * 0.44 : w * 0.36) * archScale;
    const archRy = (state.aspect === '9:16' ? h * 0.34 : h * 0.41) * archScale;
    const archCy = h * (state.aspect === '9:16' ? 0.46 : 0.49);

    ctx.save();
    // Dim Vikram slightly behind the illuminated manuscript portal
    ctx.fillStyle = `rgba(8, 10, 22, ${0.62 * flashbackMix})`;
    ctx.fillRect(0, 0, w, h);

    traceRajputArch(ctx, cx, archCy, archRx, archRy);
    ctx.save();
    ctx.clip();

    // Moonlit Marble Palace Terrace interior inside the arch
    const fbBg = ctx.createLinearGradient(cx, archCy - archRy, cx, archCy + archRy);
    fbBg.addColorStop(0, '#131b40');
    fbBg.addColorStop(0.65, '#223063');
    fbBg.addColorStop(1, '#182147');
    ctx.fillStyle = fbBg;
    ctx.fillRect(cx - archRx, archCy - archRy * 1.15, archRx * 2, archRy * 2.25);

    // Silvery Diagonal Moonlight Shaft
    ctx.fillStyle = 'rgba(240, 236, 214, 0.16)';
    ctx.beginPath();
    ctx.moveTo(cx - archRx * 0.7, archCy - archRy);
    ctx.lineTo(cx - archRx * 0.15, archCy - archRy);
    ctx.lineTo(cx + archRx * 0.85, archCy + archRy);
    ctx.lineTo(cx - archRx * 0.1, archCy + archRy);
    ctx.closePath();
    ctx.fill();

    // Carved marble terrace floor
    ctx.fillStyle = '#c8c4b8';
    ctx.fillRect(cx - archRx, archCy + archRy * 0.52, archRx * 2, archRy * 0.55);
    ctx.strokeStyle = '#8f8b80';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - archRx, archCy + archRy * 0.52, archRx * 2, 12);

    // Seated Brother 3 in Illuminated Miniature Silk Shawl (shoulder exposed to moonlight!)
    const bx = cx - 8 * s;
    const by = archCy + archRy * 0.52;
    const winceRecoil = petalImpact > 0 ? Math.sin(clamp(petalImpact * 3, 0, 1) * Math.PI * 0.5) * -14 * s : 0;

    ctx.save();
    ctx.translate(bx + winceRecoil, by);
    ctx.scale(s * 0.92, s * 0.92);
    // Seated silk dhoti & royal purple angarkha
    ctx.fillStyle = '#5e3282';
    ctx.strokeStyle = '#18101e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, -14, 78, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Torso with exposed right moonlit shoulder
    ctx.fillStyle = '#d99970';
    ctx.beginPath();
    ctx.roundRect(-42, -118, 84, 96, 28);
    ctx.fill();
    ctx.stroke();
    // Diagonal silk shawl leaving right shoulder bare
    ctx.fillStyle = '#733d9e';
    ctx.beginPath();
    ctx.moveTo(-44, -110);
    ctx.lineTo(14, -116);
    ctx.lineTo(44, -26);
    ctx.lineTo(-44, -26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Head + royal pastel turban
    ctx.fillStyle = '#d99970';
    ctx.beginPath();
    ctx.ellipse(-6, -156, 36, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f2e3f7';
    ctx.beginPath();
    ctx.ellipse(-8, -184, 44, 24, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Expression: serene -> wincing shock!
    ctx.strokeStyle = '#1c1118';
    ctx.lineWidth = 3;
    if (petalImpact > 0) {
      ctx.beginPath();
      ctx.moveTo(-20, -160); ctx.lineTo(-8, -154); ctx.lineTo(-20, -148);
      ctx.moveTo(14, -160); ctx.lineTo(2, -154); ctx.lineTo(14, -148);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(-14, -155, 5, 0.2, Math.PI - 0.2);
      ctx.arc(8, -155, 5, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    // Drifting Luminous Pink Lotus Petal landing gently on his shoulder!
    const fallU = clamp((cutT - 1.05) / 0.93, 0, 1);
    const shX = 28;
    const shY = -108;
    const px = fallU >= 1 ? shX : lerp(88, shX, fallU) + Math.sin(fallU * Math.PI * 3) * 28 * (1 - fallU);
    const py = fallU >= 1 ? shY : lerp(-270, shY, smoothstep(fallU));
    const pRot = fallU >= 1 ? 0.25 : Math.sin(fallU * Math.PI * 3) * 0.55;

    // Crimson bruise halo bloom on impact!
    if (petalImpact > 0) {
      const bloom = ctx.createRadialGradient(shX, shY + 4, 2, shX, shY + 4, 42 * petalImpact + 10);
      bloom.addColorStop(0, 'rgba(235, 34, 72, 0.85)');
      bloom.addColorStop(0.55, 'rgba(255, 92, 138, 0.35)');
      bloom.addColorStop(1, 'rgba(255, 92, 138, 0)');
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(shX, shY + 4, 42 * petalImpact + 10, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(pRot);
    const petalG = ctx.createLinearGradient(-22, -8, 22, 8);
    petalG.addColorStop(0, '#ffd4e7');
    petalG.addColorStop(0.6, '#f26ba6');
    petalG.addColorStop(1, '#c92e70');
    ctx.fillStyle = petalG;
    ctx.strokeStyle = '#3b1024';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.quadraticCurveTo(0, -16, 22, 0);
    ctx.quadraticCurveTo(0, 14, -22, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();
    ctx.restore();

    // Ornate Gilded Rajput Arch Rim
    traceRajputArch(ctx, cx, archCy, archRx, archRy);
    ctx.strokeStyle = '#f5cb5c';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = '#1b0f14';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}

// Draw Cut 4 Climax Escape Swoop (Low-angle Illuminated Banyan + Betaal soaring across Moon)
function drawMiniatureEscape(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: DirectorFrameState
): void {
  const { t, cutU } = state;
  const s = Math.min(w, h) / 620;

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0a0f26');
  sky.addColorStop(0.55, '#19264d');
  sky.addColorStop(1, '#121c2e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Huge illuminated moon rising center-left
  const moonX = w * (state.aspect === '9:16' ? 0.44 : 0.36);
  const moonY = h * 0.32;
  drawIlluminatedMoon(ctx, moonX, moonY, 118 * s, t);

  // Towering Banyan silhouette on the right
  drawMiniatureBanyan(ctx, w * 0.84, h * 0.88, s * 1.48, t);

  // Ground bank & Vikram gazing up heroically
  ctx.fillStyle = '#132624';
  ctx.fillRect(0, h * 0.78, w, h * 0.22);
  drawMiniatureVikramFull(ctx, w * 0.24, h * 0.84, s * 0.85, t, false, 1.0);

  // Betaal soaring in a graceful illuminated arc toward the banyan canopy!
  const u = easeOutCubic(cutU);
  const bx = lerp(w * 0.32, w * 0.76, u);
  const by = lerp(h * 0.56, h * 0.28, u) - Math.sin(u * Math.PI) * 95 * s;

  // Golden-indigo watercolor ember trail behind Betaal
  for (let i = 0; i < 18; i++) {
    const tu = clamp(u - i * 0.025, 0, 1);
    const tx = lerp(w * 0.32, w * 0.76, tu);
    const ty = lerp(h * 0.56, h * 0.28, tu) - Math.sin(tu * Math.PI) * 95 * s;
    const life = 1 - i / 18;
    ctx.fillStyle = i % 2 === 0 ? `rgba(247, 206, 104, ${life * 0.55})` : `rgba(196, 220, 245, ${life * 0.45})`;
    ctx.beginPath();
    ctx.arc(tx + Math.sin(i * 2.1 + t * 10) * 8 * s, ty + Math.cos(i * 1.7 + t * 9) * 8 * s, (8 * life + 2) * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soaring Betaal Cutout Puppet
  ctx.save();
  ctx.translate(bx, by);
  ctx.scale(s * lerp(0.95, 0.62, u), s * lerp(0.95, 0.62, u));
  ctx.rotate(-0.35 + u * 0.25);
  // Flowing wild hair
  ctx.fillStyle = '#1c1533';
  ctx.strokeStyle = '#0c0917';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.quadraticCurveTo(-55, -24, -84, 8);
  ctx.quadraticCurveTo(-48, 12, -10, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Tattered drape & pale limbs
  ctx.fillStyle = '#3b4266';
  ctx.beginPath();
  ctx.moveTo(-18, -6);
  ctx.lineTo(-68, 22);
  ctx.lineTo(-26, 36);
  ctx.lineTo(14, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c4daf0';
  ctx.beginPath();
  ctx.ellipse(12, -8, 18, 22, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Glowing red eyes
  ctx.fillStyle = '#ff1c42';
  ctx.beginPath();
  ctx.arc(19, -12, 3.5, 0, Math.PI * 2);
  ctx.arc(10, -10, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// =========================================================================
// MAIN ENTRY POINT FOR STYLE 1: ILLUMINATED INDIAN MINIATURE & CUTOUT PUPPET
// =========================================================================
export function renderStyle1Miniature(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: DirectorFrameState
): void {
  ctx.save();
  const s = Math.min(w, h) / 620;

  if (state.cut.id === 'establishing') {
    const { t, cutU } = state;
    // Slow parallax push-in
    const camZoom = lerp(1.0, 1.09, smoothstep(cutU));

    // Painterly nocturnal indigo sky wash
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#0a0f24');
    sky.addColorStop(0.5, '#19264c');
    sky.addColorStop(0.85, '#1f364a');
    sky.addColorStop(1, '#122424');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(camZoom, camZoom);
    ctx.translate(-w / 2, -h / 2);

    // Moon in upper-left third
    drawIlluminatedMoon(ctx, w * 0.24, h * 0.24, 64 * s, t);

    // Distant miniature scalloped hills
    ctx.fillStyle = '#132138';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.68);
    ctx.quadraticCurveTo(w * 0.25, h * 0.56, w * 0.55, h * 0.65);
    ctx.quadraticCurveTo(w * 0.8, h * 0.54, w, h * 0.64);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Forest floor & warm ochre dirt clearing
    const floorG = ctx.createLinearGradient(0, h * 0.68, 0, h);
    floorG.addColorStop(0, '#183831');
    floorG.addColorStop(1, '#0d1f1e');
    ctx.fillStyle = floorG;
    ctx.fillRect(0, h * 0.68, w, h * 0.32);

    // Curved dirt footpath
    ctx.fillStyle = '#5c4132';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.86);
    ctx.quadraticCurveTo(w * 0.48, h * 0.76, w, h * 0.84);
    ctx.lineTo(w, h * 0.94);
    ctx.quadraticCurveTo(w * 0.48, h * 0.87, 0, h * 0.97);
    ctx.closePath();
    ctx.fill();

    // Towering Cutout Banyan Tree on right
    const banyanX = w * (state.aspect === '9:16' ? 0.76 : 0.74);
    const banyanY = h * 0.78;
    drawMiniatureBanyan(ctx, banyanX, banyanY, s * 1.25, t);

    // Upside-down Betaal silhouette dangling gently from the left bough!
    const bx = banyanX - 158 * s;
    const by = banyanY - 190 * s;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(Math.sin(t * 2.1) * 0.08);
    ctx.scale(s * 0.72, s * 0.72);
    ctx.fillStyle = '#a8bed6';
    ctx.strokeStyle = '#151021';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-14, 0, 28, 56, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1d1633';
    ctx.beginPath();
    ctx.ellipse(0, 74, 24, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c4daf0';
    ctx.beginPath();
    ctx.ellipse(0, 62, 16, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Glowing crimson eyes peeking from the bough
    ctx.fillStyle = '#ff1c42';
    ctx.beginPath();
    ctx.arc(-5, 65, 2.8, 0, Math.PI * 2);
    ctx.arc(5, 65, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Glowing Diya oil lamps casting warm golden watercolor pools
    const diyas = [
      [w * 0.22, h * 0.83],
      [w * 0.56, h * 0.81],
    ];
    for (let i = 0; i < diyas.length; i++) {
      const [dx, dy] = diyas[i];
      const flick = 0.9 + 0.1 * Math.sin(t * 14 + i * 2);
      const glow = ctx.createRadialGradient(dx, dy - 8 * s, 2, dx, dy - 8 * s, 90 * s * flick);
      glow.addColorStop(0, 'rgba(255, 210, 96, 0.55)');
      glow.addColorStop(0.5, 'rgba(245, 140, 42, 0.18)');
      glow.addColorStop(1, 'rgba(245, 140, 42, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(dx, dy - 8 * s, 90 * s * flick, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#a85332';
      ctx.beginPath();
      ctx.ellipse(dx, dy, 12 * s, 5 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe680';
      ctx.beginPath();
      ctx.ellipse(dx, dy - 8 * s, 4 * s, 9 * s * flick, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Vikram strides into the clearing and halts looking up at Betaal!
    const walkU = smoothstep(clamp(cutU / 0.72, 0, 1));
    const vx = lerp(w * 0.14, w * (state.aspect === '9:16' ? 0.34 : 0.36), walkU);
    const vy = h * 0.85;
    const isWalking = cutU < 0.72;
    const lookUp = smoothstep(clamp((cutU - 0.68) / 0.26, 0, 1));
    drawMiniatureVikramFull(ctx, vx, vy, s * 0.95, t, isWalking, lookUp);

    // Floating warm fireflies
    for (let i = 0; i < 14; i++) {
      const fx = ((i * 97) % 100) / 100 * w + Math.sin(t * 0.9 + i) * 18 * s;
      const fy = h * 0.35 + ((i * 61) % 50) / 100 * h + Math.cos(t * 1.1 + i) * 12 * s;
      const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 3.2 + i * 1.7));
      ctx.fillStyle = `rgba(255, 232, 130, ${a})`;
      ctx.beginPath();
      ctx.arc(fx, fy, 3 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  } else if (state.cut.id === 'betaal_cu') {
    drawMiniatureBetaalCU(ctx, w, h, state);
  } else if (state.cut.id === 'vikram_flashback') {
    drawMiniatureVikramAndFlashback(ctx, w, h, state);
  } else {
    drawMiniatureEscape(ctx, w, h, state);
  }

  // Tactile handmade cotton-paper grain overlay across the entire frame
  const grain = ctx.createPattern(getPaperGrain(), 'repeat');
  if (grain) {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grain;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Subtle gilded illuminated-manuscript hairline border
  const inset = Math.round(12 * s);
  ctx.strokeStyle = 'rgba(242, 203, 108, 0.38)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);

  // Subtle corner gilt diamonds
  const cs = 6 * s;
  ctx.fillStyle = 'rgba(242, 203, 108, 0.6)';
  for (const [cx, cy] of [
    [inset, inset],
    [w - inset, inset],
    [inset, h - inset],
    [w - inset, h - inset],
  ]) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - cs);
    ctx.lineTo(cx + cs, cy);
    ctx.lineTo(cx, cy + cs);
    ctx.lineTo(cx - cs, cy);
    ctx.closePath();
    ctx.fill();
  }

  // Clean subtitles (optional toggle)
  drawCaptionOverlay(ctx, w, h, state, 'miniature');

  ctx.restore();
}
