import { EpisodeVisualStyle, MoodId, RenderStyleId, StageId, StoryBeat } from './types';

export type VolumetricBeamKind =
  | 'temple_godrays'
  | 'moonlight_shafts'
  | 'window_sunbeams'
  | 'hearth_glow'
  | 'mist_canopy';

export interface VolumetricBeam {
  originXNorm: number; // 0..1 top/edge origin X
  originYNorm: number; // -0.1..0.4 origin Y
  spreadTopNorm: number; // width fraction at origin
  spreadBottomNorm: number; // width fraction at floor
  targetXNorm: number; // 0..1 floor X
  targetYNorm: number; // 0.65..1.05 floor Y
  alpha: number; // 0..0.35 peak opacity
  phase: number; // deterministic shimmer phase
}

export interface VolumetricDustMote {
  xNorm: number;
  yNorm: number;
  radiusPx: number;
  alpha: number;
}

export interface VolumetricLightPlan {
  enabled: boolean;
  kind: VolumetricBeamKind;
  intensity: number; // 0..1 effective intensity
  beamColorRgb: [number, number, number];
  rimGlowRgb: [number, number, number];
  beams: VolumetricBeam[];
  motes: VolumetricDustMote[];
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function deterministicHash(seed: number): number {
  let x = (seed | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967295;
}

function stringSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Classifies stage + mood into a cohesive atmospheric lighting archetype.
 */
export function resolveVolumetricBeamKind(stage: StageId, mood: MoodId): VolumetricBeamKind {
  const s = String(stage);
  if (
    s.includes('temple') ||
    s.includes('sanctum') ||
    s.includes('ashram') ||
    s.includes('shrine') ||
    s.includes('monastery') ||
    s.includes('pagoda') ||
    s.includes('acropolis') ||
    mood === 'twilight_temple'
  ) {
    return 'temple_godrays';
  }
  if (
    s.includes('palace') ||
    s.includes('court') ||
    s.includes('durbar') ||
    s.includes('throne') ||
    s.includes('bedchamber') ||
    s.includes('golden_lanka') ||
    mood === 'golden_durbar'
  ) {
    return mood === 'crimson_wrath' || mood === 'sandstone_dusk' ? 'hearth_glow' : 'window_sunbeams';
  }
  if (
    s.includes('cave') ||
    s.includes('cremation') ||
    s.includes('dungeon') ||
    s.includes('desert') ||
    mood === 'sandstone_dusk' ||
    mood === 'crimson_wrath'
  ) {
    return 'hearth_glow';
  }
  if (
    mood === 'midnight_banyan' ||
    mood === 'moonlit_marble' ||
    mood === 'mystic_teal' ||
    s.includes('moonlit') ||
    s.includes('banyan')
  ) {
    return 'moonlight_shafts';
  }
  return 'mist_canopy';
}

function resolveBeamPalette(
  kind: VolumetricBeamKind,
  mood: MoodId
): { beamColorRgb: [number, number, number]; rimGlowRgb: [number, number, number] } {
  if (mood === 'crimson_wrath') {
    return { beamColorRgb: [255, 118, 84], rimGlowRgb: [255, 76, 98] };
  }
  if (mood === 'golden_durbar') {
    return { beamColorRgb: [255, 224, 132], rimGlowRgb: [255, 240, 178] };
  }
  if (mood === 'mystic_teal') {
    return { beamColorRgb: [122, 238, 248], rimGlowRgb: [168, 250, 255] };
  }
  if (mood === 'sandstone_dusk') {
    return { beamColorRgb: [255, 176, 96], rimGlowRgb: [255, 132, 74] };
  }
  if (mood === 'emerald_jungle') {
    return { beamColorRgb: [224, 248, 186], rimGlowRgb: [255, 232, 162] };
  }
  if (mood === 'twilight_temple') {
    return { beamColorRgb: [255, 212, 138], rimGlowRgb: [242, 198, 255] };
  }
  if (kind === 'moonlight_shafts' || mood === 'midnight_banyan' || mood === 'moonlit_marble') {
    return { beamColorRgb: [176, 210, 255], rimGlowRgb: [212, 232, 255] };
  }
  if (kind === 'hearth_glow') {
    return { beamColorRgb: [255, 178, 92], rimGlowRgb: [255, 140, 68] };
  }
  if (kind === 'temple_godrays') {
    return { beamColorRgb: [255, 218, 126], rimGlowRgb: [255, 236, 176] };
  }
  return { beamColorRgb: [255, 232, 176], rimGlowRgb: [255, 242, 204] };
}

/**
 * Pure deterministic volumetric light-shaft & dust-mote planner.
 * Zero Math.random(), zero allocations beyond small descriptor arrays.
 */
export function computeVolumetricLightPlan(
  beat: Pick<StoryBeat, 'id' | 'stage' | 'mood' | 'lightSide' | 'frame' | 'shot'>,
  style: Partial<EpisodeVisualStyle> | undefined,
  animT: number,
  renderStyle?: RenderStyleId
): VolumetricLightPlan {
  const rawIntensity =
    typeof style?.lightShafts === 'number' && Number.isFinite(style.lightShafts)
      ? clamp(style.lightShafts, 0, 1)
      : 0.4;

  const skipSlate =
    beat.frame === 'chapter_title' ||
    beat.frame === 'moral_card' ||
    beat.frame === 'end_screen' ||
    beat.shot === 'motion_card';

  const kind = resolveVolumetricBeamKind(beat.stage, beat.mood);
  const { beamColorRgb, rimGlowRgb } = resolveBeamPalette(kind, beat.mood);

  if (skipSlate || rawIntensity <= 0.01) {
    return {
      enabled: false,
      kind,
      intensity: 0,
      beamColorRgb,
      rimGlowRgb,
      beams: [],
      motes: [],
    };
  }

  // Respect high-contrast flat/graphic styles gently so art engines stay faithful
  const styleFactor =
    renderStyle === 'shadow_puppetry'
      ? 1.15
      : renderStyle === 'stained_glass' || renderStyle === 'chiaroscuro' || renderStyle === 'gouache_storybook'
        ? 1.05
        : renderStyle === 'manga_screentone' || renderStyle === 'woodblock_print' || renderStyle === 'lineless_vector'
          ? 0.72
          : 0.9;

  const intensity = clamp(rawIntensity * styleFactor, 0, 1);
  const fromLeft = beat.lightSide === 'left';
  const dir = fromLeft ? 1 : -1;
  const seedBase = stringSeed(`${beat.id}|${beat.stage}|${beat.mood}`);

  const beamCount = kind === 'hearth_glow' ? 2 : kind === 'window_sunbeams' ? 4 : 3;
  const beams: VolumetricBeam[] = [];

  for (let i = 0; i < beamCount; i++) {
    const h0 = deterministicHash(seedBase + i * 97 + 13);
    const h1 = deterministicHash(seedBase + i * 193 + 41);
    const slotFrac = i / Math.max(1, beamCount - 1);

    const originXNorm = fromLeft
      ? clamp(0.06 + slotFrac * 0.36 + (h0 - 0.5) * 0.06, 0.02, 0.58)
      : clamp(0.94 - slotFrac * 0.36 + (h0 - 0.5) * 0.06, 0.42, 0.98);
    const originYNorm = kind === 'hearth_glow' ? 0.86 : -0.06;
    const slant = kind === 'window_sunbeams' ? 0.34 : kind === 'temple_godrays' ? 0.28 : 0.22;
    const targetXNorm = clamp(originXNorm + dir * (slant + h1 * 0.14), 0.04, 0.96);
    const targetYNorm = kind === 'hearth_glow' ? 0.18 : 0.98;
    const shimmer = 0.84 + 0.16 * Math.sin(animT * (0.65 + i * 0.23) + h0 * Math.PI * 2);

    beams.push({
      originXNorm,
      originYNorm,
      spreadTopNorm: kind === 'window_sunbeams' ? 0.048 : 0.062 + h1 * 0.03,
      spreadBottomNorm: kind === 'window_sunbeams' ? 0.16 : 0.2 + h0 * 0.08,
      targetXNorm,
      targetYNorm,
      alpha: clamp((0.085 + 0.065 * h1) * intensity * shimmer, 0.01, 0.26),
      phase: h0 * Math.PI * 2,
    });
  }

  const moteCount = Math.round(10 + intensity * 14);
  const motes: VolumetricDustMote[] = [];
  for (let i = 0; i < moteCount; i++) {
    const m0 = deterministicHash(seedBase + i * 311 + 7);
    const m1 = deterministicHash(seedBase + i * 521 + 19);
    const m2 = deterministicHash(seedBase + i * 733 + 53);
    const driftSpeed = 0.016 + m2 * 0.022;
    const rawX = (m0 + animT * driftSpeed * dir * 0.65 + Math.sin(animT * 0.9 + m1 * 6.28) * 0.018) % 1;
    const rawY = (m1 - animT * driftSpeed * (kind === 'hearth_glow' ? 0.9 : 0.32)) % 1;
    const xNorm = rawX < 0 ? rawX + 1 : rawX;
    const yNorm = rawY < 0 ? rawY + 1 : rawY;
    const twinkle = 0.45 + 0.55 * Math.sin(animT * (1.4 + m2 * 1.8) + m0 * 6.28);

    motes.push({
      xNorm,
      yNorm: 0.08 + yNorm * 0.82,
      radiusPx: 1.1 + m2 * 2.1,
      alpha: clamp(0.18 + 0.42 * intensity * twinkle, 0.05, 0.72),
    });
  }

  return {
    enabled: true,
    kind,
    intensity,
    beamColorRgb,
    rimGlowRgb,
    beams,
    motes,
  };
}

/**
 * Draws volumetric light shafts, edge atmospheric rim glow, and floating dust motes directly
 * onto `ctx` with zero offscreen canvas allocations and zero `Math.random()`.
 */
export function drawVolumetricLightShafts(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  beat: Pick<StoryBeat, 'id' | 'stage' | 'mood' | 'lightSide' | 'frame' | 'shot'>,
  style: Partial<EpisodeVisualStyle> | undefined,
  animT: number,
  renderStyle?: RenderStyleId
): VolumetricLightPlan {
  const plan = computeVolumetricLightPlan(beat, style, animT, renderStyle);
  if (!plan.enabled || plan.beams.length === 0) return plan;

  const [br, bg, bb] = plan.beamColorRgb;
  const [rr, rg, rb] = plan.rimGlowRgb;
  const s = Math.min(w, h) / 720;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  // 1. Directional diagonal volumetric cones / hearth upward glow pools
  for (const b of plan.beams) {
    const ox = b.originXNorm * w;
    const oy = b.originYNorm * h;
    const tx = b.targetXNorm * w;
    const ty = b.targetYNorm * h;
    const topHalf = b.spreadTopNorm * w * 0.5;
    const botHalf = b.spreadBottomNorm * w * 0.5;

    const grad = ctx.createLinearGradient(ox, oy, tx, ty);
    grad.addColorStop(0, `rgba(${br}, ${bg}, ${bb}, ${(b.alpha * 1.15).toFixed(3)})`);
    grad.addColorStop(0.55, `rgba(${br}, ${bg}, ${bb}, ${(b.alpha * 0.55).toFixed(3)})`);
    grad.addColorStop(1, `rgba(${br}, ${bg}, ${bb}, 0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ox - topHalf, oy);
    ctx.lineTo(ox + topHalf, oy);
    ctx.lineTo(tx + botHalf, ty);
    ctx.lineTo(tx - botHalf, ty);
    ctx.closePath();
    ctx.fill();
  }

  // 2. Soft edge rim bloom on lightSide (or hearth base pool)
  const rimX = beat.lightSide === 'left' ? w * 0.08 : w * 0.92;
  const rimY = plan.kind === 'hearth_glow' ? h * 0.88 : h * 0.18;
  const rimRad = Math.max(w, h) * (plan.kind === 'hearth_glow' ? 0.52 : 0.44);
  const rimGrad = ctx.createRadialGradient(rimX, rimY, 0, rimX, rimY, rimRad);
  const rimAlpha = clamp(0.14 * plan.intensity, 0.02, 0.22);
  rimGrad.addColorStop(0, `rgba(${rr}, ${rg}, ${rb}, ${rimAlpha.toFixed(3)})`);
  rimGrad.addColorStop(0.5, `rgba(${rr}, ${rg}, ${rb}, ${(rimAlpha * 0.35).toFixed(3)})`);
  rimGrad.addColorStop(1, `rgba(${rr}, ${rg}, ${rb}, 0)`);
  ctx.fillStyle = rimGrad;
  ctx.fillRect(0, 0, w, h);

  // 3. Deterministic drifting dust motes caught inside the light rays
  for (const m of plan.motes) {
    const mx = m.xNorm * w;
    const my = m.yNorm * h;
    const r = Math.max(0.8, m.radiusPx * s);
    ctx.fillStyle = `rgba(${rr}, ${rg}, ${rb}, ${m.alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  return plan;
}
