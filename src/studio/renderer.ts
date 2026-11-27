import { SpeechWindow } from './voiceEnvelope';
import {
  ActorPlacement,
  AspectMode,
  CaptionStyleId,
  CastMember,
  CrowdId,
  EpisodeScript,
  EpisodeVisualStyle,
  FxId,
  MoodId,
  MotionCadenceId,
  MotionCardConfig,
  MotionProfileId,
  RenderStyleId,
  RIM_LIGHT_CATALOG,
  STUDIO_FPS,
  StoryBeat,
  SurfaceTextureId,
  WeatherId,
  frameIndexToTime,
  resolveActorExpressionAtTime,
  resolveBeatActionStateAtFrame,
  resolveVisualStyle,
  timeToFrameIndex,
} from './types';
import {
  MOOD_PALETTES,
  drawActorCloseUp,
  drawActorFullBody,
  drawStageBackdrop,
  drawStoryProp,
  snap24,
} from './renderAssets';
import {
  drawUniversalBeatFx,
  drawUniversalCrowdLayer,
  drawUniversalWeather,
} from './renderAssetsUniversal';
import {
  drawAtlasBeatFx,
  drawAtlasCrowdLayer,
  drawAtlasWeather,
} from './renderAssetsAtmosphereAtlas';
import { resolvePhonemeViseme } from './facialExpressions';
import { applyPooledBackdropDof, computeBeatDepthOfFieldSpec } from './depthOfField';
import { composeCameraWithKeyframes } from './cameraKeyframes';
import { drawVolumetricLightShafts } from './volumetricLighting';
import { computePropPhysics } from './propPhysics';
import {
  computeKineticWordPop,
  parseEmphasisTokens,
  resolveSpeakerAccentColor,
  stripEmphasisMarkup,
} from './kineticCaptions';
import { drawLocationLowerThird } from './lowerThirds';
import { computeHitstopState, drawImpactShockOverlay } from './impactVfx';
import { computeSpriteSheetFrameRect } from './spriteSheetSlicer';
import {
  ReflectedActorSnapshot,
  drawGroundedShadowAndReflection,
} from './surfaceReflections';
import { drawForegroundParallaxLayer } from './foregroundParallax';
import {
  SfxChoreographyState,
  applyParallaxCamera,
  computeActorArmRig,
  computeCameraTransform,
  computeDeterministicFlicker,
  computePoseEnvelope,
  computeSceneLighting,
  computeSfxChoreography,
  drawDynamicSceneRelighting,
  drawSfxVisualEffects,
  drawStageForegroundDepthLayer,
  getArchetypeKinematics,
  getStyleAnimationGrammar,
  resolveEffectiveMotionFps,
  snapStyleTime,
} from './animationEngine';
import {
  computeCaptionLowerThirdMotion,
  computeStageMotionArc,
  cubicBezier,
  dampedOvershoot,
  resolveMotionProfileSpec,
} from './animationPrinciples';
import {
  applyComposablePostFxPass,
  composeStyledScene,
  drawTaperedMotionArcs,
  getCachedPattern,
} from './styleEngines';
import {
  LanguageSpec,
  isRtlText,
  resolveEpisodeLanguage,
  safeUppercase,
} from './i18n';
import { ChannelBrandKit, loadBrandKit } from './brandKit';

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function smoothstep(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}
function easeOutCubic(t: number): number {
  const x = clamp(t, 0, 1);
  return 1 - Math.pow(1 - x, 3);
}

// Bounded LRU cache for uploaded raster images (custom props, backdrops, brand logos).
// Strictly blocks SVG/HTML/script data URLs and caps payload length.
const safeRasterImageCache = new Map<string, HTMLImageElement>();
const MAX_SAFE_RASTER_CACHE = 32;
const MAX_SAFE_RASTER_DATA_URL_LEN = 5_500_000;
const SAFE_RASTER_DATA_URL_RE = /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=\s]+$/;

function getSafeRasterImage(dataUrl: string): HTMLImageElement | null {
  if (
    typeof Image === 'undefined' ||
    !dataUrl ||
    dataUrl.length > MAX_SAFE_RASTER_DATA_URL_LEN ||
    !SAFE_RASTER_DATA_URL_RE.test(dataUrl)
  ) {
    return null;
  }
  let img = safeRasterImageCache.get(dataUrl);
  if (!img) {
    if (safeRasterImageCache.size >= MAX_SAFE_RASTER_CACHE) {
      const oldestKey = safeRasterImageCache.keys().next().value;
      if (oldestKey) safeRasterImageCache.delete(oldestKey);
    }
    img = new Image();
    img.src = dataUrl;
    safeRasterImageCache.set(dataUrl, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

function drawGroundContactShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  alpha = 0.42
): void {
  if (rx <= 1 || ry <= 1 || alpha <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  const grad = ctx.createRadialGradient(0, 0, rx * 0.1, 0, 0, rx);
  grad.addColorStop(0, `rgba(4, 6, 14, ${clamp(alpha, 0, 0.72)})`);
  grad.addColorStop(0.65, `rgba(4, 6, 14, ${clamp(alpha * 0.45, 0, 0.4)})`);
  grad.addColorStop(1, 'rgba(4, 6, 14, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Procedural offscreen texture cache for zero-cost 60fps surface finishes
const texturePatternCache = new Map<SurfaceTextureId, HTMLCanvasElement>();
function getSurfaceTextureTile(kind: SurfaceTextureId): HTMLCanvasElement | null {
  if (kind === 'clean' || typeof document === 'undefined') return null;
  let tile = texturePatternCache.get(kind);
  if (tile) return tile;

  tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const g = tile.getContext('2d');
  if (!g) return null;

  let seed = kind === 'parchment_grain' ? 11 : kind === 'palm_leaf_fibers' ? 29 : kind === 'woodblock_halftone' ? 47 : 73;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  if (kind === 'parchment_grain') {
    for (let i = 0; i < 900; i++) {
      const x = rnd() * 128;
      const y = rnd() * 128;
      const warm = rnd() > 0.45;
      g.fillStyle = warm ? 'rgba(245, 224, 178, 0.14)' : 'rgba(42, 26, 12, 0.14)';
      g.fillRect(x, y, 2, 2);
    }
  } else if (kind === 'palm_leaf_fibers') {
    g.strokeStyle = 'rgba(230, 198, 138, 0.14)';
    g.lineWidth = 1;
    for (let y = 2; y < 128; y += 4) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(128, y + (rnd() - 0.5) * 2.5);
      g.stroke();
    }
    for (let i = 0; i < 320; i++) {
      g.fillStyle = 'rgba(54, 34, 14, 0.16)';
      g.fillRect(rnd() * 128, rnd() * 128, 3, 1);
    }
  } else if (kind === 'woodblock_halftone') {
    g.fillStyle = 'rgba(6, 8, 18, 0.24)';
    for (let y = 0; y < 128; y += 8) {
      for (let x = 0; x < 128; x += 8) {
        const ox = (y / 8) % 2 === 0 ? 0 : 4;
        g.beginPath();
        g.arc(x + ox, y, 1.5, 0, Math.PI * 2);
        g.fill();
      }
    }
  } else if (kind === 'cinema_35mm') {
    for (let i = 0; i < 1400; i++) {
      const v = rnd() > 0.5 ? 255 : 0;
      g.fillStyle = `rgba(${v},${v},${v},0.09)`;
      g.fillRect(rnd() * 128, rnd() * 128, 1.5, 1.5);
    }
  }

  texturePatternCache.set(kind, tile);
  return tile;
}

function drawTransformedBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  beat: StoryBeat,
  globalT: number
): void {
  const flip = beat.flipStage === true;
  const bz = beat.backdropZoom && beat.backdropZoom !== 1 ? beat.backdropZoom : 1;
  ctx.save();
  if (flip || bz !== 1) {
    ctx.translate(w / 2, h / 2);
    ctx.scale(flip ? -bz : bz, bz);
    ctx.translate(-w / 2, -h / 2);
  }
  const customBg = beat.customBackdropDataUrl
    ? getSafeRasterImage(beat.customBackdropDataUrl)
    : null;
  if (customBg) {
    // Aspect-preserving cover crop so uploaded stage artwork fills 16:9 or 9:16 cleanly
    const imgRatio = customBg.naturalWidth / Math.max(1, customBg.naturalHeight);
    const canvasRatio = w / Math.max(1, h);
    let dw = w;
    let dh = h;
    if (imgRatio > canvasRatio) {
      dh = h;
      dw = h * imgRatio;
    } else {
      dw = w;
      dh = w / imgRatio;
    }
    ctx.drawImage(customBg, (w - dw) / 2, (h - dh) / 2, dw, dh);
    // Subtle mood tint veil so procedural cast & weather sit cohesively inside custom plates
    const pal = MOOD_PALETTES[beat.mood] || MOOD_PALETTES.midnight_banyan;
    const tint = ctx.createLinearGradient(0, 0, 0, h);
    tint.addColorStop(0, pal.skyTop);
    tint.addColorStop(1, pal.skyLow);
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  } else {
    drawStageBackdrop(ctx, w, h, beat.stage, beat.mood, globalT);
  }
  ctx.restore();
}

function drawStageHaze(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  beat: StoryBeat
): void {
  const haze = beat.haze ?? 0;
  if (haze <= 0.01) return;
  const pal = MOOD_PALETTES[beat.mood] || MOOD_PALETTES.midnight_banyan;
  ctx.save();
  const grad = ctx.createLinearGradient(0, h * 0.22, 0, h);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.55, pal.skyLow);
  grad.addColorStop(1, pal.rimLight);
  ctx.globalAlpha = clamp(haze * 0.48, 0, 0.52);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawVisualFinishOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  beat: StoryBeat,
  style: EpisodeVisualStyle,
  aspect: AspectMode
): void {
  const s = Math.min(w, h) / 620;

  // 1. Directional Rim-Light Tint Sweep (when overridden from 'auto')
  if (style.rimLight !== 'auto' && style.rimLight !== 'none') {
    const rimMeta = RIM_LIGHT_CATALOG.find((r) => r.id === style.rimLight);
    if (rimMeta?.hex) {
      ctx.save();
      const fromRight = beat.lightSide === 'right';
      const gx0 = fromRight ? w : 0;
      const gx1 = fromRight ? w * 0.35 : w * 0.65;
      const grad = ctx.createLinearGradient(gx0, h * 0.15, gx1, h * 0.75);
      grad.addColorStop(0, rimMeta.hex);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  // 2. Episode Color Grade / LUT Tint
  if (style.colorGrade !== 'default') {
    ctx.save();
    if (style.colorGrade === 'warm_gold') {
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = 'rgba(255, 192, 72, 0.34)';
      ctx.fillRect(0, 0, w, h);
    } else if (style.colorGrade === 'indigo_noir') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(130, 156, 224, 0.34)';
      ctx.fillRect(0, 0, w, h);
    } else if (style.colorGrade === 'vermilion_royal') {
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = 'rgba(235, 58, 86, 0.32)';
      ctx.fillRect(0, 0, w, h);
    } else if (style.colorGrade === 'emerald_fable') {
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = 'rgba(72, 212, 152, 0.26)';
      ctx.fillRect(0, 0, w, h);
    } else if (style.colorGrade === 'sepia_manuscript') {
      ctx.globalCompositeOperation = 'color';
      ctx.fillStyle = 'rgba(186, 138, 82, 0.42)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(245, 224, 184, 0.22)';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  // 3. Shadow Contrast Knob (0.6 airy storybook .. 1.0 default .. 1.4 deep noir)
  if (Math.abs(style.shadowContrast - 1.0) > 0.02) {
    ctx.save();
    if (style.shadowContrast > 1.0) {
      const amt = clamp((style.shadowContrast - 1.0) * 0.52, 0, 0.28);
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = `rgba(12, 16, 36, ${amt})`;
      ctx.fillRect(0, 0, w, h);
    } else {
      const amt = clamp((1.0 - style.shadowContrast) * 0.42, 0, 0.22);
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(255, 232, 198, ${amt})`;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  // 4. Ink Weight Graphic Edge Accent (subtle crisp ink border when boosted > 1.0)
  if (style.inkWeight > 1.04 && beat.frame !== 'chapter_title' && beat.frame !== 'moral_card') {
    ctx.save();
    const lw = Math.round((style.inkWeight - 0.85) * 8 * s);
    ctx.strokeStyle = 'rgba(4, 5, 12, 0.88)';
    ctx.lineWidth = lw;
    ctx.strokeRect(lw / 2, lw / 2, w - lw, h - lw);
    ctx.restore();
  }

  // 5. Procedural Surface Texture Overlay (Parchment / Palm-Leaf / Woodblock / 35mm)
  const tile = getSurfaceTextureTile(style.texture);
  if (tile) {
    ctx.save();
    const pat = getCachedPattern(ctx, tile);
    if (pat) {
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  // 6. Configurable Vignette
  if (style.vignette > 0.02) {
    ctx.save();
    const rOuter = Math.hypot(w, h) * 0.62;
    const vg = ctx.createRadialGradient(w / 2, h / 2, rOuter * 0.42, w / 2, h / 2, rOuter);
    vg.addColorStop(0, 'rgba(4, 6, 14, 0)');
    vg.addColorStop(1, `rgba(4, 6, 14, ${clamp(style.vignette * 0.78, 0, 0.78)})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // 7. Frame Border / Cinema Bars Chrome
  if (beat.frame === 'chapter_title' || beat.frame === 'moral_card') return;

  if (style.frameBorder === 'clean_letterbox') {
    if (aspect === '16:9') {
      const barH = Math.round(h * 0.028);
      ctx.fillStyle = '#04050c';
      ctx.fillRect(0, 0, w, barH);
      ctx.fillRect(0, h - barH, w, barH);
    }
  } else if (style.frameBorder === 'gold_filigree') {
    const m = Math.round(14 * s);
    ctx.save();
    ctx.strokeStyle = 'rgba(242, 200, 91, 0.72)';
    ctx.lineWidth = 2.6 * s;
    ctx.strokeRect(m, m, w - m * 2, h - m * 2);
    ctx.strokeStyle = 'rgba(242, 200, 91, 0.28)';
    ctx.lineWidth = 1.2 * s;
    ctx.strokeRect(m + 6 * s, m + 6 * s, w - (m + 6 * s) * 2, h - (m + 6 * s) * 2);
    ctx.fillStyle = '#f2c85b';
    for (const [cx, cy] of [
      [m, m],
      [w - m, m],
      [m, h - m],
      [w - m, h - m],
    ]) {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 7 * s);
      ctx.lineTo(cx + 7 * s, cy);
      ctx.lineTo(cx, cy + 7 * s);
      ctx.lineTo(cx - 7 * s, cy);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  } else if (style.frameBorder === 'manuscript_margin') {
    const m = Math.round(18 * s);
    ctx.save();
    ctx.strokeStyle = '#362312';
    ctx.lineWidth = m * 2;
    ctx.strokeRect(0, 0, w, h);
    ctx.strokeStyle = '#d9a441';
    ctx.lineWidth = 2.5 * s;
    ctx.strokeRect(m, m, w - m * 2, h - m * 2);
    ctx.restore();
  }
}

export interface EvaluatedBeat {
  beat: StoryBeat;
  beatIndex: number;
  beatStart: number;
  localT: number;
  u: number;
  speechEnergy: number;
  viseme: number;
  /** Canonical integer episode frame index at STUDIO_FPS (60fps) */
  frameIndex: number;
  /** Canonical integer beat-local frame index at STUDIO_FPS (60fps) */
  localFrame: number;
}

/**
 * Pure deterministic Speech-Window Lip-Sync Lock & Viseme Smoothing.
 * Maps phoneme progression cleanly over the detected active speech window
 * `[speechWindow.startSec, speechWindow.endSec]`, holds closed rest viseme (0)
 * during breath pads/pauses, and quantizes viseme switching to ~18 Hz so mouths
 * hold cleanly for 3-4 frames instead of chattering at 60fps.
 */
export function computeSpeechWindowViseme(
  dialogue: string,
  localT: number,
  beatDuration: number,
  speechEnergy: number,
  speechWindow?: { startSec: number; endSec: number } | null
): number {
  const cleanDialogue = (dialogue || '').trim();
  if (!cleanDialogue) return 0;
  if (speechEnergy < 0.045) return 0;

  const safeDur = Math.max(0.2, Number.isFinite(beatDuration) ? beatDuration : 4);
  // Quantize time to ~18 Hz (~3.3 frames at 60fps) to prevent 60fps mouth-shape micro-chatter
  const steppedLocalT = Math.floor(Math.max(0, localT) * 18) / 18;

  if (
    speechWindow &&
    Number.isFinite(speechWindow.startSec) &&
    Number.isFinite(speechWindow.endSec) &&
    speechWindow.endSec > speechWindow.startSec + 0.04
  ) {
    if (localT < speechWindow.startSec - 0.025 || localT > speechWindow.endSec + 0.035) {
      return 0;
    }
    const span = Math.max(0.08, speechWindow.endSec - speechWindow.startSec);
    const speechU = clamp((steppedLocalT - speechWindow.startSec) / span, 0, 1);
    return resolvePhonemeViseme(cleanDialogue, speechU, speechEnergy);
  }

  const steppedU = clamp(steppedLocalT / safeDur, 0, 1);
  return resolvePhonemeViseme(cleanDialogue, steppedU, speechEnergy);
}

export function evaluateEpisodeAtTime(
  episode: EpisodeScript,
  globalT: number,
  liveVoiceEnergy: number | null = null,
  speechWindow?: { startSec: number; endSec: number } | null
): EvaluatedBeat {
  const frameIndex = timeToFrameIndex(globalT, STUDIO_FPS);
  const safeT = frameIndexToTime(frameIndex, STUDIO_FPS);
  const beats = episode.beats || [];
  if (beats.length === 0) {
    const fallbackBeat: StoryBeat = {
      id: 'fallback_beat',
      title: 'Empty Stage',
      duration: 4,
      stage: 'banyan_clearing',
      mood: 'midnight_banyan',
      weather: 'none',
      shot: 'wide_stage',
      transition: 'hard_cut',
      lightSide: 'right',
      prop: 'none',
      fx: 'none',
      raag: 'bhairavi',
      musicEnergy: 0.5,
      actors: [],
      speakerId: 'narrator',
      speakerLabel: 'Narrator',
      dialogue: '',
    };
    return {
      beat: fallbackBeat,
      beatIndex: 0,
      beatStart: 0,
      localT: 0,
      u: 0,
      speechEnergy: 0,
      viseme: 0,
      frameIndex,
      localFrame: 0,
    };
  }

  let acc = 0;
  let chosen = beats[beats.length - 1];
  let chosenIdx = beats.length - 1;
  let chosenStart = 0;

  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    const dur = Math.max(1.2, Number.isFinite(b.duration) ? b.duration : 4);
    if (safeT < acc + dur || i === beats.length - 1) {
      chosen = b;
      chosenIdx = i;
      chosenStart = acc;
      break;
    }
    acc += dur;
  }

  const dur = Math.max(1.2, Number.isFinite(chosen.duration) ? chosen.duration : 4);
  const localT = clamp(safeT - chosenStart, 0, dur);
  const localFrame = Math.max(0, Math.round(localT * STUDIO_FPS));
  const u = clamp(localT / dur, 0, 1);

  let speechEnergy = 0;
  if (typeof liveVoiceEnergy === 'number' && Number.isFinite(liveVoiceEnergy)) {
    speechEnergy = clamp(liveVoiceEnergy, 0, 1);
  } else if (chosen.dialogue.trim().length > 0) {
    const fade =
      smoothstep(clamp(localT / 0.16, 0, 1)) *
      smoothstep(clamp((dur - localT) / 0.22, 0, 1));
    const wave =
      0.5 +
      0.34 * Math.sin(localT * 36) +
      0.22 * Math.sin(localT * 19 + 1.2) +
      0.14 * Math.cos(localT * 51);
    const pauseDip = 1 - 0.68 * Math.exp(-Math.pow((u - 0.48) / 0.08, 2));
    speechEnergy = clamp(wave * fade * pauseDip, 0, 1);
  }

  const viseme = computeSpeechWindowViseme(
    chosen.dialogue,
    localT,
    dur,
    speechEnergy,
    speechWindow
  );

  return {
    beat: chosen,
    beatIndex: chosenIdx,
    beatStart: chosenStart,
    localT,
    u,
    speechEnergy,
    viseme,
    frameIndex,
    localFrame,
  };
}

// =========================================================================
// FULL-CHAPTER CROWD SILHOUETTES (Chiaroscuro Depth Layer)
// =========================================================================
function drawCrowdLayer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  crowd: CrowdId | undefined,
  mood: MoodId,
  t: number,
  beat?: StoryBeat,
  sfxChoreo?: SfxChoreographyState
): void {
  if (!crowd || crowd === 'none') return;
  const s = Math.min(w, h) / 620;
  const ts = snap24(t);
  const pal = MOOD_PALETTES[mood] || MOOD_PALETTES.midnight_banyan;

  // Step 10: Reactive living crowds respond to beat mood, attack poses, shock bursts, and SFX startle!
  const hasAttack = Boolean(beat?.actors?.some((a) => a.pose === 'attack'));
  const isTense =
    mood === 'crimson_wrath' ||
    mood === 'twilight_temple' ||
    beat?.fx === 'shock_burst' ||
    beat?.fx === 'crimson_impact';
  const startle = sfxChoreo?.crowdStartle || (beat?.fx === 'shock_burst' ? 0.55 : 0);

  if (drawUniversalCrowdLayer(ctx, w, h, crowd, pal, ts, beat, startle)) {
    return;
  }
  if (drawAtlasCrowdLayer(ctx, w, h, crowd, pal, ts, beat, startle)) {
    return;
  }

  ctx.save();
  ctx.fillStyle = pal.farSil;
  ctx.globalAlpha = 0.78;

  const baseY = h * 0.77;
  const positions = [0.06, 0.14, 0.22, 0.36, 0.64, 0.78, 0.86, 0.94];

  for (let i = 0; i < positions.length; i++) {
    const sideDir = positions[i] < 0.5 ? -1 : 1;
    // Domino reaction wave spreading outward from stage center on gasp/thunder/clash
    const waveDelay = Math.abs(positions[i] - 0.5) * 2.2;
    const domino = clamp(startle * 1.25 - waveDelay * 0.18, 0, 1);
    const leanBack = domino * 0.18 * sideDir;
    const stepBackX = domino * 10 * s * sideDir;
    const cx = w * positions[i] + stepBackX;
    const bob = Math.sin(ts * (isTense ? 3.8 : 2.2) + i * 1.4) * (isTense ? 3.5 : 2.5) * s - domino * 5 * s;
    const figH = (86 + (i % 3) * 10) * s;

    ctx.save();
    ctx.translate(cx, baseY);
    ctx.rotate(leanBack);

    if (crowd === 'army') {
      // Helmeted soldiers + spears that thrust upward during battle/wrath & fluttering war pennants
      const spearLift = (hasAttack || isTense ? 16 + Math.sin(ts * 8 + i) * 6 : 0) * s;
      ctx.fillRect(-12 * s, -figH + bob, 24 * s, figH);
      ctx.beginPath();
      ctx.arc(0, -figH - 10 * s + bob, 11 * s, 0, Math.PI * 2);
      ctx.fill();
      // Vertical lance spear
      ctx.fillRect(12 * s, -figH - 64 * s - spearLift + bob, 3 * s, figH + 64 * s);
      ctx.beginPath();
      ctx.moveTo(13.5 * s, -figH - 80 * s - spearLift + bob);
      ctx.lineTo(18 * s, -figH - 62 * s - spearLift + bob);
      ctx.lineTo(9 * s, -figH - 62 * s - spearLift + bob);
      ctx.closePath();
      ctx.fill();
      if (i % 2 === 0) {
        const flagWave = Math.sin(ts * 7.5 + i * 1.3) * 6 * s;
        ctx.fillStyle = pal.accent;
        ctx.globalAlpha = 0.62;
        ctx.beginPath();
        ctx.moveTo(15 * s, -figH - 62 * s - spearLift + bob);
        ctx.lineTo(36 * s + flagWave, -figH - 54 * s - spearLift + bob);
        ctx.lineTo(15 * s, -figH - 46 * s - spearLift + bob);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = pal.farSil;
        ctx.globalAlpha = 0.78;
      }
    } else if (crowd === 'courtiers' || crowd === 'villagers') {
      // Turbaned courtier / villager silhouettes that recoil & raise hands on gasp/shock
      ctx.beginPath();
      ctx.moveTo(-16 * s, bob);
      ctx.lineTo(-12 * s, -figH * 0.82 + bob);
      ctx.lineTo(12 * s, -figH * 0.82 + bob);
      ctx.lineTo(16 * s, bob);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -figH * 0.94 + bob, crowd === 'courtiers' ? 13 * s : 11 * s, 0, Math.PI * 2);
      ctx.fill();
      if (domino > 0.25) {
        // Raised startled hands during court gasp or thunder
        ctx.strokeStyle = pal.farSil;
        ctx.lineWidth = 4.5 * s;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-10 * s, -figH * 0.72 + bob);
        ctx.lineTo(-18 * s, -figH * (0.9 + domino * 0.16) + bob);
        ctx.moveTo(10 * s, -figH * 0.72 + bob);
        ctx.lineTo(18 * s, -figH * (0.9 + domino * 0.16) + bob);
        ctx.stroke();
      }
    } else if (crowd === 'monks') {
      // Seated meditating sages with gently rising sacred golden prayer lanterns
      ctx.beginPath();
      ctx.moveTo(-22 * s, 4 * s);
      ctx.lineTo(-12 * s, -figH * 0.56);
      ctx.lineTo(12 * s, -figH * 0.56);
      ctx.lineTo(22 * s, 4 * s);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -figH * 0.68, 11 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -figH * 0.82, 5 * s, 0, Math.PI * 2);
      ctx.fill();
      // Floating devotional ember/lantern above every second monk
      if (i % 2 === 1) {
        const floatY = -figH * 0.95 - ((ts * 18 + i * 19) % 48) * s;
        ctx.fillStyle = '#ffd452';
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        ctx.arc(Math.sin(ts * 2.2 + i) * 7 * s, floatY, 3.2 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pal.farSil;
        ctx.globalAlpha = 0.78;
      }
    } else if (crowd === 'forest_herd') {
      // Antlered deer / forest animals that bound & startle on loud SFX
      const boundY = domino > 0.15 ? -Math.abs(Math.sin(ts * 12 + i)) * 18 * s * domino : 0;
      ctx.fillRect(-16 * s, -38 * s + bob + boundY, 32 * s, 18 * s);
      ctx.fillRect(-14 * s, -22 * s + bob + boundY, 4 * s, 24 * s);
      ctx.fillRect(10 * s, -22 * s + bob + boundY, 4 * s, 24 * s);
      ctx.fillRect(10 * s, -56 * s + bob + boundY, 7 * s, 20 * s);
      ctx.beginPath();
      ctx.arc(15 * s, -58 * s + bob + boundY, 7 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

export function computeActorPosition(
  a: ActorPlacement,
  w: number,
  h: number,
  s: number,
  u: number,
  isVert: boolean,
  motionProfile?: MotionProfileId,
  renderStyle?: RenderStyleId
): { x: number; y: number } {
  const su = smoothstep(u);
  let baseX = w * 0.5;
  let baseY = h * 0.84;

  if (a.slot === 'left') {
    baseX = w * (isVert ? 0.3 : 0.28);
  } else if (a.slot === 'right') {
    baseX = w * (isVert ? 0.7 : 0.72);
  } else if (a.slot === 'overhead') {
    baseX = w * 0.62;
    baseY = h * 0.44;
  }

  const offX = typeof a.offsetX === 'number' && Number.isFinite(a.offsetX)
    ? clamp(a.offsetX, -0.35, 0.35) * w
    : 0;
  const offY = typeof a.offsetY === 'number' && Number.isFinite(a.offsetY)
    ? clamp(a.offsetY, -0.35, 0.35) * h
    : 0;

  let x = baseX;
  let y = baseY;
  const mot = a.motion || 'still';
  const profileSpec = resolveMotionProfileSpec(motionProfile, renderStyle);
  const arc = mot !== 'still' ? computeStageMotionArc(mot, u, profileSpec) : null;

  if (mot === 'enter_left' && arc) {
    x = lerp(-w * 0.12, baseX, arc.progress);
    y = baseY + arc.arcOffsetY * s;
  } else if (mot === 'enter_right' && arc) {
    x = lerp(w * 1.12, baseX, arc.progress);
    y = baseY + arc.arcOffsetY * s;
  } else if (mot === 'cross_stage' && arc) {
    const startX = a.slot === 'right' ? w * 0.85 : w * 0.15;
    const endX = a.slot === 'right' ? w * 0.18 : w * 0.82;
    x = lerp(startX, endX, arc.progress);
    y = baseY + arc.arcOffsetY * s;
  } else if (mot === 'step_forward' && arc) {
    const dir = a.slot === 'right' ? -1 : 1;
    x = baseX + dir * lerp(0, w * 0.11, arc.progress);
    y = baseY + arc.arcOffsetY * s;
  } else if (mot === 'retreat' && arc) {
    const dir = a.slot === 'right' ? 1 : -1;
    x = baseX + dir * lerp(0, w * 0.14, arc.progress);
    y = baseY + arc.arcOffsetY * s;
  } else if (mot === 'leap_arc' && arc) {
    const dir = a.slot === 'right' ? -1 : 1;
    x = lerp(baseX, baseX + dir * w * 0.26, arc.progress);
    y = baseY + arc.arcOffsetY * s;
  } else if (a.pose === 'walk' && a.slot === 'left') {
    x = w * lerp(0.16, 0.34, su);
  } else if (a.pose === 'walk' && a.slot === 'right') {
    x = w * lerp(0.84, 0.66, su);
  }

  return { x: x + offX, y: y + offY };
}

export interface SpeakerCameraOffset {
  /** Normalized horizontal pan offset (-0.45..+0.45); + shifts stage right (focuses left actor), - shifts stage left (focuses right actor) */
  panXNorm: number;
  /** Normalized vertical pan offset (-0.3..+0.3); + shifts stage down (focuses higher), - shifts stage up (focuses lower) */
  panYNorm: number;
  /** Safe extra zoom added so camera pans never expose empty canvas edges */
  zoomBoost: number;
}

/**
 * Pure deterministic 9:16 Auto-Track Speaker & per-beat Camera Focus framing offset.
 * - Explicit `beat.cameraFocusX` / `beat.cameraFocusY` always take precedence (works in 16:9 & 9:16).
 * - Otherwise, in `9:16` vertical Shorts when `autoTrackSpeaker !== false` on `wide_stage` or `two_shot`,
 *   smoothly eases camera framing toward the active speaking actor's stage slot.
 */
export function computeSpeakerCameraOffset(
  beat: StoryBeat,
  aspect: AspectMode,
  u: number,
  autoTrackSpeaker = true,
  motionProfile: MotionProfileId = 'auto',
  renderStyle?: RenderStyleId
): SpeakerCameraOffset {
  const manualX =
    typeof beat.cameraFocusX === 'number' && Number.isFinite(beat.cameraFocusX)
      ? Math.max(-0.45, Math.min(0.45, beat.cameraFocusX))
      : 0;
  const manualY =
    typeof beat.cameraFocusY === 'number' && Number.isFinite(beat.cameraFocusY)
      ? Math.max(-0.3, Math.min(0.3, beat.cameraFocusY))
      : 0;

  if (Math.abs(manualX) > 0.001 || Math.abs(manualY) > 0.001) {
    const zoomBoost = Math.min(0.28, Math.abs(manualX) * 0.55 + Math.abs(manualY) * 0.55);
    return {
      panXNorm: Number((-manualX).toFixed(4)),
      panYNorm: Number((-manualY).toFixed(4)),
      zoomBoost: Number(zoomBoost.toFixed(4)),
    };
  }

  if (
    aspect !== '9:16' ||
    autoTrackSpeaker === false ||
    (beat.shot !== 'wide_stage' && beat.shot !== 'two_shot')
  ) {
    return { panXNorm: 0, panYNorm: 0, zoomBoost: 0 };
  }

  if (!beat.speakerId || beat.speakerId === 'narrator') {
    return { panXNorm: 0, panYNorm: 0, zoomBoost: 0 };
  }

  const speakerActor = (beat.actors || []).find((a) => a.castId === beat.speakerId);
  if (!speakerActor) {
    return { panXNorm: 0, panYNorm: 0, zoomBoost: 0 };
  }

  let targetPanX = 0;
  if (speakerActor.slot === 'left') {
    targetPanX = 0.16;
  } else if (speakerActor.slot === 'right') {
    targetPanX = -0.16;
  }

  if (typeof speakerActor.offsetX === 'number' && Number.isFinite(speakerActor.offsetX)) {
    targetPanX = Math.max(-0.26, Math.min(0.26, targetPanX - speakerActor.offsetX * 0.55));
  }

  if (Math.abs(targetPanX) < 0.005) {
    return { panXNorm: 0, panYNorm: 0, zoomBoost: 0 };
  }

  const spec = resolveMotionProfileSpec(motionProfile, renderStyle);
  const clampedU = Math.max(0, Math.min(1, Number.isFinite(u) ? u : 0));
  const settleFrac = spec.id === 'snappy_cartoon' ? 0.15 : spec.id === 'motion_graphics' ? 0.18 : 0.24;
  const tNorm = Math.min(1, clampedU / settleFrac);
  const eased = cubicBezier(tNorm, 0.22, 1, 0.36, 1);

  const panXNorm = targetPanX * eased;
  const zoomBoost = Math.min(0.22, Math.abs(targetPanX) * 0.9 * eased);
  return {
    panXNorm: Number(panXNorm.toFixed(4)),
    panYNorm: 0,
    zoomBoost: Number(zoomBoost.toFixed(4)),
  };
}

function resolveHandAnchoredProp(
  beat: StoryBeat,
  w: number,
  h: number,
  s: number,
  u: number,
  isVert: boolean,
  actorScale: number,
  getCast: (id: string) => CastMember,
  animT = 0,
  speechEnergy = 0,
  renderStyle?: RenderStyleId,
  motionCadence?: MotionCadenceId,
  motionProfile?: MotionProfileId
): { px: number; py: number; scale: number; isHeld: boolean; rotation: number } {
  const anchor = beat.propAnchor || 'stage';
  if (anchor === 'actor_left_hand' || anchor === 'actor_right_hand') {
    const actors = beat.actors || [];
    const targetActor =
      actors.find((a) => a.castId === beat.speakerId) ||
      actors.find((a) => a.slot === beat.propSlot) ||
      actors[0];
    if (targetActor) {
      // Step 5: Compute exact live 2-bone wrist coordinates & hand rotation matching drawActorFullBody!
      const pos = computeActorPosition(targetActor, w, h, s, u, isVert, motionProfile, renderStyle);
      const cast = getCast(targetActor.castId);
      const dnaMorph = cast.dna?.morph;
      const cScale = actorScale * (dnaMorph ? dnaMorph.height : (cast.scale ?? 1));
      const facing = targetActor.facing || (targetActor.slot === 'right' ? 'left' : 'right');
      const flip = facing === 'left' ? -1 : 1;
      const isFrontHand =
        (anchor === 'actor_right_hand' && flip === 1) ||
        (anchor === 'actor_left_hand' && flip === -1);

      let bodySeed = 0;
      for (let i = 0; i < cast.id.length; i++) {
        bodySeed = (bodySeed * 31 + cast.id.charCodeAt(i)) % 997;
      }
      const ts = snapStyleTime(animT, renderStyle, motionCadence);
      const kin = getArchetypeKinematics(cast.archetype);
      const env = computePoseEnvelope(
        targetActor.pose,
        targetActor.motion,
        u,
        ts,
        beat.speakerId === targetActor.castId ? speechEnergy : 0,
        kin,
        bodySeed,
        motionProfile,
        renderStyle
      );
      const breath = Math.sin(ts * kin.breathHz + bodySeed * 0.17);
      const chestRise = breath * -kin.breathAmp - (beat.speakerId === targetActor.castId ? speechEnergy : 0) * 2.2;
      const armRig = computeActorArmRig(
        targetActor.pose,
        targetActor.expression,
        env,
        ts,
        beat.speakerId === targetActor.castId ? speechEnergy : 0,
        kin,
        bodySeed,
        chestRise,
        motionProfile,
        renderStyle
      );
      const arm = isFrontHand ? armRig.front : armRig.back;
      const shScale = dnaMorph ? dnaMorph.shoulderWidth : 1;
      const limbScale = dnaMorph ? dnaMorph.limbLength : 1;
      const totalTilt = env.bodyTilt + (dnaMorph ? dnaMorph.posture * 0.45 : 0);
      const lx = arm.wristX * shScale * env.scaleX;
      const ly = arm.wristY * limbScale * env.scaleY;
      const cosT = Math.cos(totalTilt);
      const sinT = Math.sin(totalTilt);
      const rx = lx * cosT - ly * sinT;
      const ry = lx * sinT + ly * cosT;

      const worldX = pos.x + (rx + env.offsetX) * cScale * flip;
      const worldY = pos.y + (ry + env.offsetY + env.bob) * cScale;
      const swingRot = (arm.handAngle + totalTilt + Math.PI * 0.42) * 0.48 * flip;

      return {
        px: worldX,
        py: worldY,
        scale: s * 0.44,
        isHeld: true,
        rotation: swingRot,
      };
    }
  }

  const offX = typeof beat.propOffsetX === 'number' && Number.isFinite(beat.propOffsetX)
    ? clamp(beat.propOffsetX, -0.35, 0.35) * w
    : 0;
  const offY = typeof beat.propOffsetY === 'number' && Number.isFinite(beat.propOffsetY)
    ? clamp(beat.propOffsetY, -0.35, 0.35) * h
    : 0;
  const px =
    (beat.propSlot === 'left'
      ? w * 0.28
      : beat.propSlot === 'right'
        ? w * 0.72
        : w * 0.5) + offX;
  const py = (beat.propSlot === 'overhead' ? h * 0.25 : h * 0.74) + offY;
  return { px, py, scale: s * 0.78, isHeld: false, rotation: 0 };
}

export interface StageInteractiveTarget {
  kind: 'actor' | 'prop';
  index: number;
  label: string;
  x: number;
  y: number;
  radius: number;
}

/**
 * Computes canvas-space hit targets for interactive click/drag staging of actors and props.
 */
export function getStageInteractiveTargets(
  beat: StoryBeat,
  episode: EpisodeScript,
  w: number,
  h: number,
  aspect: AspectMode,
  u: number
): StageInteractiveTarget[] {
  const targets: StageInteractiveTarget[] = [];
  if (beat.shot !== 'wide_stage' && beat.shot !== 'two_shot' && beat.shot !== 'prop_spotlight') {
    return targets;
  }
  const s = Math.min(w, h) / 620;
  const isVert = aspect === '9:16';
  const castMap = new Map<string, CastMember>();
  for (const c of episode.cast || []) castMap.set(c.id, c);
  const getCast = (id: string) =>
    castMap.get(id) ||
    episode.cast?.[0] || {
      id: 'fallback',
      name: 'Actor',
      archetype: 'sage' as const,
      primaryColor: '#d96c1f',
      accentColor: '#ffd452',
      skinColor: '#d9986c',
    };

  const actorScale = s * (beat.shot === 'two_shot' ? 1.02 : 0.92);
  (beat.actors || []).forEach((a, idx) => {
    const pos = computeActorPosition(a, w, h, s, u, isVert);
    const cast = getCast(a.castId);
    const cScale = actorScale * (cast.scale || 1);
    targets.push({
      kind: 'actor',
      index: idx,
      label: cast.name,
      x: pos.x,
      y: pos.y - 115 * cScale,
      radius: Math.max(44 * s, 68 * cScale),
    });
  });

  if (
    (beat.prop !== 'none' || beat.customPropDataUrl) &&
    (beat.propAnchor || 'stage') === 'stage'
  ) {
    const propSpec = resolveHandAnchoredProp(beat, w, h, s, u, isVert, actorScale, getCast);
    targets.push({
      kind: 'prop',
      index: 0,
      label: beat.customPropLabel || beat.prop.replace(/_/g, ' '),
      x: propSpec.px,
      y: propSpec.py,
      radius: 56 * s,
    });
  }
  return targets;
}

function drawCustomOrHeroProp(
  ctx: CanvasRenderingContext2D,
  beat: StoryBeat,
  px: number,
  py: number,
  scale: number,
  globalT: number,
  u: number,
  rotation = 0,
  localT = 0,
  cadenceFps?: number
): void {
  if (beat.customPropDataUrl) {
    const img = getSafeRasterImage(beat.customPropDataUrl);
    if (img) {
      const maxDim = 220 * scale;
      ctx.save();
      ctx.translate(px, py);
      if (rotation) ctx.rotate(rotation);
      ctx.shadowColor = 'rgba(255, 212, 82, 0.4)';
      ctx.shadowBlur = 22;
      if (beat.customPropSheet) {
        const rect = computeSpriteSheetFrameRect(
          beat.customPropSheet,
          img.naturalWidth,
          img.naturalHeight,
          localT,
          cadenceFps
        );
        const ratio = Math.min(maxDim / Math.max(1, rect.sw), maxDim / Math.max(1, rect.sh));
        const dw = rect.sw * ratio;
        const dh = rect.sh * ratio;
        ctx.drawImage(img, rect.sx, rect.sy, rect.sw, rect.sh, -dw / 2, -dh / 2, dw, dh);
      } else {
        const ratio = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight);
        const dw = img.naturalWidth * ratio;
        const dh = img.naturalHeight * ratio;
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      }
      ctx.restore();
      return;
    }
  }
  if (beat.prop !== 'none') {
    if (rotation) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rotation);
      drawStoryProp(ctx, beat.prop, 0, 0, scale, globalT, u);
      ctx.restore();
    } else {
      drawStoryProp(ctx, beat.prop, px, py, scale, globalT, u);
    }
  }
}

function drawWeather(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  weather: WeatherId,
  mood: MoodId,
  t: number
): void {
  if (weather === 'none') return;
  const s = Math.min(w, h) / 620;
  const pal = MOOD_PALETTES[mood] || MOOD_PALETTES.midnight_banyan;

  if (drawUniversalWeather(ctx, w, h, weather, pal, t)) {
    return;
  }
  if (drawAtlasWeather(ctx, w, h, weather, pal, t)) {
    return;
  }

  if (weather === 'fireflies' || weather === 'embers') {
    for (let i = 0; i < 16; i++) {
      const fx =
        (((i * 93) % 100) / 100) * w + Math.sin(t * (0.9 + (i % 3) * 0.3) + i) * 18 * s;
      const fy =
        weather === 'embers'
          ? ((h * 1.05 - ((t * 48 * s + i * 74) % (h * 1.1))) + h) % h
          : h * 0.25 + (((i * 61) % 60) / 100) * h + Math.cos(t * 1.2 + i) * 12 * s;
      const r = (weather === 'embers' ? 3.5 : 3) * s;
      ctx.fillStyle =
        weather === 'embers'
          ? i % 2 === 0
            ? '#ff4d2e'
            : '#ffd147'
          : i % 3 === 0
            ? pal.rimLight
            : '#f5ffb8';
      ctx.beginPath();
      ctx.moveTo(fx, fy - r);
      ctx.lineTo(fx + r, fy);
      ctx.lineTo(fx, fy + r);
      ctx.lineTo(fx - r, fy);
      ctx.closePath();
      ctx.fill();
    }
  } else if (weather === 'rain') {
    ctx.strokeStyle = 'rgba(204, 226, 255, 0.34)';
    ctx.lineWidth = 1.6 * s;
    for (let i = 0; i < 42; i++) {
      const rx = ((i * 79 + t * 180) % (w + 100)) - 50;
      const ry = ((i * 113 + t * 920) % (h + 120)) - 60;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 10 * s, ry + 34 * s);
      ctx.stroke();
    }
  } else if (weather === 'mist') {
    for (let i = 0; i < 5; i++) {
      const mx = ((i * 260 + t * (16 + i * 5)) % (w + 320)) - 160;
      const my = h * (0.64 + (i % 3) * 0.1);
      ctx.fillStyle = 'rgba(210, 228, 255, 0.08)';
      ctx.fillRect(mx - 140 * s, my, 280 * s, 26 * s);
    }
  } else if (weather === 'petals') {
    for (let i = 0; i < 14; i++) {
      const px = ((i * 107 + Math.sin(t * 1.5 + i) * 45) % w + w) % w;
      const py = ((t * 58 * s + i * 89) % (h + 40)) - 20;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(t * 1.6 + i);
      ctx.fillStyle = i % 2 === 0 ? '#ff4f9a' : '#ffc2de';
      ctx.beginPath();
      ctx.moveTo(-9 * s, 0);
      ctx.quadraticCurveTo(0, -6 * s, 9 * s, 0);
      ctx.quadraticCurveTo(0, 6 * s, -9 * s, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawBeatFx(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  fx: FxId,
  u: number,
  t: number
): void {
  if (fx === 'none') return;
  if (drawUniversalBeatFx(ctx, w, h, fx, u, t)) {
    return;
  }
  if (drawAtlasBeatFx(ctx, w, h, fx, u, t)) {
    return;
  }
  const s = Math.min(w, h) / 620;

  if (fx === 'shock_burst') {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 3 * s;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 + Math.floor(t * 12) * 0.04;
      const r0 = Math.max(w, h) * 0.34;
      const r1 = Math.max(w, h) * 0.65;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.stroke();
    }
    ctx.restore();
  } else if (fx === 'question_mark') {
    const bob = Math.sin(t * 6) * 8 * s;
    ctx.save();
    ctx.font = `900 ${Math.round(86 * s)}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 208, 77, 0.25)';
    ctx.fillText('?', w * 0.84, h * 0.24 + bob);
    ctx.fillStyle = '#ffd04d';
    ctx.fillText('?', w * 0.84 - 4 * s, h * 0.24 - 4 * s + bob);
    ctx.restore();
  } else if (fx === 'crimson_impact' && u > 0.55 && u < 0.72) {
    ctx.fillStyle = 'rgba(255, 24, 68, 0.2)';
    ctx.fillRect(0, 0, w, h);
  } else if (fx === 'divine_aura') {
    ctx.save();
    const grad = ctx.createRadialGradient(w / 2, h * 0.44, 20 * s, w / 2, h * 0.44, 280 * s);
    grad.addColorStop(0, 'rgba(255, 212, 82, 0.24)');
    grad.addColorStop(1, 'rgba(255, 212, 82, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

function segmentGraphemes(text: string): string[] {
  const Seg = (Intl as unknown as {
    Segmenter?: new (
      locale?: string,
      opts?: { granularity: 'grapheme' | 'word' }
    ) => { segment: (s: string) => Iterable<{ segment: string }> };
  }).Segmenter;
  if (Seg) {
    try {
      const seg = new Seg(undefined, { granularity: 'grapheme' });
      const out: string[] = [];
      for (const item of seg.segment(text)) out.push(item.segment);
      return out;
    } catch {
      // fallback below
    }
  }
  return Array.from(text);
}

/**
 * Grapheme-safe multi-script text wrapper for English, Indic, Arabic, and space-free CJK (Japanese/Chinese).
 * Preserves spaces for space-delimited scripts while safely breaking long tokens or CJK runs within maxW.
 */
export function wrapCanvasLines(
  ctx: Pick<CanvasRenderingContext2D, 'measureText'>,
  text: string,
  maxW: number,
  maxLines = 3
): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  const safeMaxW = Math.max(40, maxW);
  const words = normalized.split(' ');
  const lines: string[] = [];
  let line = '';

  const pushOversizedToken = (token: string) => {
    const graphemes = segmentGraphemes(token);
    for (const g of graphemes) {
      const next = line + g;
      if (ctx.measureText(next).width > safeMaxW && line) {
        lines.push(line);
        line = g;
      } else {
        line = next;
      }
    }
  };

  for (const word of words) {
    if (!word) continue;
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= safeMaxW) {
      line = candidate;
    } else if (ctx.measureText(word).width > safeMaxW) {
      if (line) {
        lines.push(line);
        line = '';
      }
      pushOversizedToken(word);
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, Math.max(1, maxLines));
}

function drawWrappedCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  maxW: number,
  lineH: number,
  maxLines = 4
): void {
  const shown = wrapCanvasLines(ctx, text, maxW, maxLines);
  const startY = cy - ((shown.length - 1) * lineH) / 2;
  for (let i = 0; i < shown.length; i++) {
    ctx.fillText(shown[i], cx, startY + i * lineH);
  }
}

function drawFrameOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  episode: EpisodeScript,
  beat: StoryBeat,
  u: number,
  aspect: AspectMode,
  lang: LanguageSpec
): void {
  const frame = beat.frame || 'main';
  if (frame === 'main') return;
  const s = Math.min(w, h) / 620;
  const isVert = aspect === '9:16';

  if (frame === 'nested_story') {
    // Antique-Gold Double Chiaroscuro Border for Story-Within-a-Story Flashbacks!
    const m = Math.round(22 * s);
    ctx.save();
    ctx.direction = lang.dir;
    ctx.strokeStyle = 'rgba(242, 200, 91, 0.72)';
    ctx.lineWidth = 3 * s;
    ctx.strokeRect(m, m, w - m * 2, h - m * 2);
    ctx.strokeStyle = 'rgba(242, 200, 91, 0.3)';
    ctx.lineWidth = 1.5 * s;
    ctx.strokeRect(m + 8 * s, m + 8 * s, w - (m + 8 * s) * 2, h - (m + 8 * s) * 2);
    ctx.font = `700 ${Math.round(13 * s)}px ${lang.fontFamily}`;
    const badgeLabel = lang.storyWithinStory;
    const badgeW = Math.min(w - m * 3, Math.max(150 * s, ctx.measureText(badgeLabel).width + 26 * s));
    ctx.fillStyle = '#0a0d1a';
    ctx.fillRect(m + 22 * s, m - 10 * s, badgeW, 22 * s);
    ctx.fillStyle = '#f2c85b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeLabel, m + 22 * s + badgeW / 2, m + 1 * s);
    ctx.restore();
    return;
  }

  if (frame === 'chapter_title' || frame === 'moral_card') {
    // Full Graphic-Novel Chapter Opening Slate OR Closing Wisdom Epigram!
    const fadeIn = smoothstep(clamp(u / 0.2, 0, 1));
    ctx.save();
    ctx.direction = lang.dir;
    const slateGrad = ctx.createRadialGradient(w / 2, h / 2, 24 * s, w / 2, h / 2, Math.hypot(w, h) * 0.62);
    slateGrad.addColorStop(0, `rgba(18, 16, 30, ${0.72 * fadeIn})`);
    slateGrad.addColorStop(1, `rgba(4, 6, 14, ${0.9 * fadeIn})`);
    ctx.fillStyle = slateGrad;
    ctx.fillRect(0, 0, w, h);

    // Double ornamental gilded frame with corner filigree diamonds
    const pad = Math.round((isVert ? 36 : 48) * s);
    ctx.strokeStyle = `rgba(242, 200, 91, ${0.72 * fadeIn})`;
    ctx.lineWidth = 2.5 * s;
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
    ctx.strokeStyle = `rgba(242, 200, 91, ${0.28 * fadeIn})`;
    ctx.lineWidth = 1.2 * s;
    ctx.strokeRect(pad + 8 * s, pad + 8 * s, w - (pad + 8 * s) * 2, h - (pad + 8 * s) * 2);

    ctx.fillStyle = `rgba(242, 200, 91, ${0.88 * fadeIn})`;
    for (const [cx, cy] of [
      [pad, pad],
      [w - pad, pad],
      [pad, h - pad],
      [w - pad, h - pad],
    ]) {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 8 * s);
      ctx.lineTo(cx + 8 * s, cy);
      ctx.lineTo(cx, cy + 8 * s);
      ctx.lineTo(cx - 8 * s, cy);
      ctx.closePath();
      ctx.fill();
    }

    ctx.globalAlpha = fadeIn;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(2, 4, 12, 0.85)';
    ctx.shadowBlur = 12 * s;
    ctx.shadowOffsetY = 3 * s;

    if (frame === 'chapter_title') {
      ctx.font = `700 ${Math.round(18 * s)}px ${lang.fontFamily}`;
      ctx.fillStyle = '#f2c85b';
      ctx.fillText(safeUppercase(episode.series, lang), w / 2, h * 0.34, w * 0.78);

      // Gold ornamental rule + center diamond
      ctx.fillRect(w / 2 - 74 * s, h * 0.39, 148 * s, 2.2 * s);
      ctx.beginPath();
      ctx.moveTo(w / 2, h * 0.39 - 5 * s);
      ctx.lineTo(w / 2 + 6 * s, h * 0.39 + 1 * s);
      ctx.lineTo(w / 2, h * 0.39 + 7 * s);
      ctx.lineTo(w / 2 - 6 * s, h * 0.39 + 1 * s);
      ctx.closePath();
      ctx.fill();

      ctx.font = `700 ${Math.round((isVert ? 42 : 54) * s)}px ${lang.displayFontFamily}`;
      ctx.fillStyle = '#ffffff';
      drawWrappedCenteredText(ctx, episode.title, w / 2, h * 0.51, w * 0.78, (isVert ? 54 : 66) * s, 3);

      if (episode.subtitle) {
        ctx.font = `500 ${Math.round(20 * s)}px ${lang.fontFamily}`;
        ctx.fillStyle = '#d3dcf0';
        drawWrappedCenteredText(ctx, episode.subtitle, w / 2, h * 0.67, w * 0.72, 30 * s, 2);
      }
    } else {
      ctx.font = `700 ${Math.round(16 * s)}px ${lang.fontFamily}`;
      ctx.fillStyle = '#f2c85b';
      const headerLabel = beat.title.trim() ? safeUppercase(beat.title, lang) : lang.moralHeader;
      ctx.fillText(headerLabel, w / 2, h * 0.31, w * 0.78);

      ctx.fillRect(w / 2 - 64 * s, h * 0.365, 128 * s, 2.2 * s);

      const moralItalic = lang.scriptType === 'latin' ? 'italic ' : '';
      ctx.font = `600 ${moralItalic}${Math.round((isVert ? 30 : 38) * s)}px ${lang.displayFontFamily}`;
      ctx.fillStyle = '#fdf7ea';
      const quoteBody = beat.dialogue || episode.subtitle;
      const framedQuote = lang.scriptType === 'cjk' ? `「${quoteBody}」` : `“${quoteBody}”`;
      drawWrappedCenteredText(
        ctx,
        framedQuote,
        w / 2,
        h * 0.52,
        w * 0.76,
        (isVert ? 44 : 54) * s,
        4
      );

      ctx.font = `600 ${Math.round(15 * s)}px ${lang.fontFamily}`;
      ctx.fillStyle = '#b4c0dc';
      ctx.fillText(`— ${episode.series}`, w / 2, h * 0.72, w * 0.76);
    }
    ctx.restore();
    return;
  }

  if (frame === 'end_screen') {
    // YouTube 12s End-Screen Safe-Zone Outro Card (16:9 native card zones + 9:16 CTA layout)
    const brand = loadBrandKit();
    const fadeIn = smoothstep(clamp(u / 0.16, 0, 1));
    ctx.save();
    ctx.direction = lang.dir;
    const bgGrad = ctx.createRadialGradient(w / 2, h * 0.35, 30 * s, w / 2, h * 0.5, Math.hypot(w, h) * 0.65);
    bgGrad.addColorStop(0, `rgba(18, 16, 32, ${0.84 * fadeIn})`);
    bgGrad.addColorStop(1, `rgba(4, 6, 14, ${0.95 * fadeIn})`);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const pad = Math.round(28 * s);
    ctx.strokeStyle = `rgba(242, 200, 91, ${0.55 * fadeIn})`;
    ctx.lineWidth = 2 * s;
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

    ctx.globalAlpha = fadeIn;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const drawRoundedSlot = (x: number, y: number, sw: number, sh: number, r: number, label: string) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + sw - r, y);
      ctx.quadraticCurveTo(x + sw, y, x + sw, y + r);
      ctx.lineTo(x + sw, y + sh - r);
      ctx.quadraticCurveTo(x + sw, y + sh, x + sw - r, y + sh);
      ctx.lineTo(x + r, y + sh);
      ctx.quadraticCurveTo(x, y + sh, x, y + sh - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(10, 12, 24, 0.72)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(242, 200, 91, 0.85)';
      ctx.lineWidth = 2.4 * s;
      ctx.stroke();

      ctx.font = `700 ${Math.round(14 * s)}px ${lang.fontFamily}`;
      ctx.fillStyle = '#f2c85b';
      ctx.fillText(safeUppercase(label, lang), x + sw / 2, y - 16 * s, sw);
      ctx.restore();
    };

    if (!isVert) {
      // 16:9 YouTube End-Screen safe zones: top headline, center circular Subscribe, two 16:9 cards
      ctx.font = `700 ${Math.round(28 * s)}px ${lang.displayFontFamily}`;
      ctx.fillStyle = '#fdf7ea';
      ctx.fillText(brand.endScreenHeadline || episode.series, w / 2, h * 0.13, w * 0.82);

      // Center Subscribe circle slot
      const subCx = w / 2;
      const subCy = h * 0.34;
      const subR = 54 * s;
      ctx.save();
      ctx.beginPath();
      ctx.arc(subCx, subCy, subR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(12, 14, 28, 0.82)';
      ctx.fill();
      ctx.strokeStyle = '#f2c85b';
      ctx.lineWidth = 3 * s;
      ctx.stroke();
      const logoImg = brand.logoDataUrl ? getSafeRasterImage(brand.logoDataUrl) : null;
      if (logoImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(subCx, subCy, subR - 4 * s, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, subCx - subR, subCy - subR, subR * 2, subR * 2);
        ctx.restore();
      } else {
        ctx.font = `800 ${Math.round(22 * s)}px ${lang.displayFontFamily}`;
        ctx.fillStyle = '#ffd452';
        const initials = (brand.channelName || episode.series || 'KS')
          .split(/\s+/)
          .slice(0, 2)
          .map((p) => p[0] || '')
          .join('')
          .toUpperCase();
        ctx.fillText(initials || 'KS', subCx, subCy);
      }
      ctx.font = `700 ${Math.round(13 * s)}px ${lang.fontFamily}`;
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(brand.channelName || episode.series, subCx, subCy + subR + 18 * s, w * 0.4);
      ctx.restore();

      const cardW = w * 0.33;
      const cardH = cardW * (9 / 16);
      const cardY = h * 0.56;
      drawRoundedSlot(w * 0.08, cardY, cardW, cardH, 12 * s, brand.nextVideoLabel || 'Next Tale');
      drawRoundedSlot(w * 0.59, cardY, cardW, cardH, 12 * s, brand.playlistLabel || 'Full Folklore Playlist');

      if (beat.dialogue.trim()) {
        ctx.font = `500 ${Math.round(16 * s)}px ${lang.fontFamily}`;
        ctx.fillStyle = '#d3dcf0';
        ctx.fillText(beat.dialogue, w / 2, h * 0.92, w * 0.84);
      }
    } else {
      // 9:16 Vertical Shorts Outro CTA layout
      ctx.font = `700 ${Math.round(28 * s)}px ${lang.displayFontFamily}`;
      ctx.fillStyle = '#fdf7ea';
      drawWrappedCenteredText(ctx, brand.endScreenHeadline || episode.series, w / 2, h * 0.22, w * 0.8, 36 * s, 2);

      const subR = 58 * s;
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.39, subR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(12, 14, 28, 0.84)';
      ctx.fill();
      ctx.strokeStyle = '#f2c85b';
      ctx.lineWidth = 3 * s;
      ctx.stroke();
      ctx.font = `700 ${Math.round(15 * s)}px ${lang.fontFamily}`;
      ctx.fillStyle = '#ffd452';
      ctx.fillText(brand.channelName || episode.series, w / 2, h * 0.39 + subR + 22 * s, w * 0.78);

      const cardW = w * 0.74;
      const cardH = cardW * (9 / 16);
      drawRoundedSlot((w - cardW) / 2, h * 0.57, cardW, cardH, 14 * s, brand.nextVideoLabel || 'Watch Full Story');

      if (beat.dialogue.trim()) {
        ctx.font = `600 ${Math.round(17 * s)}px ${lang.fontFamily}`;
        ctx.fillStyle = '#d3dcf0';
        drawWrappedCenteredText(ctx, beat.dialogue, w / 2, h * 0.84, w * 0.78, 25 * s, 3);
      }
    }
    ctx.restore();
  }
}

function drawBrandWatermark(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  brand: ChannelBrandKit,
  aspect: AspectMode,
  lang: LanguageSpec
): void {
  if (!brand.showWatermark) return;
  const s = Math.min(w, h) / 620;
  const isVert = aspect === '9:16';
  const marginX = (isVert ? 24 : 30) * s;
  const marginY = (isVert ? 34 : 24) * s;
  const maxDim = (isVert ? 48 : 54) * s;
  const img = brand.logoDataUrl ? getSafeRasterImage(brand.logoDataUrl) : null;

  ctx.save();
  ctx.globalAlpha = clamp(brand.logoOpacity, 0.15, 1);

  if (img) {
    const ratio = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight);
    const dw = img.naturalWidth * ratio;
    const dh = img.naturalHeight * ratio;
    let x = marginX;
    let y = marginY;
    if (brand.logoCorner === 'top_right') {
      x = w - marginX - dw;
      y = marginY;
    } else if (brand.logoCorner === 'bottom_left') {
      x = marginX;
      y = h - marginY - dh - (isVert ? 95 * s : 24 * s);
    } else if (brand.logoCorner === 'bottom_right') {
      x = w - marginX - dw;
      y = h - marginY - dh - (isVert ? 95 * s : 24 * s);
    }
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = 10 * s;
    ctx.drawImage(img, x, y, dw, dh);
  } else if (brand.channelName.trim()) {
    ctx.font = `700 ${Math.round(12 * s)}px ${lang.fontFamily}`;
    const label = safeUppercase(brand.channelName.trim().slice(0, 24), lang);
    const padX = 10 * s;
    const bw = Math.min(w * 0.42, ctx.measureText(label).width + padX * 2);
    const bh = 24 * s;
    let x = marginX;
    let y = marginY;
    if (brand.logoCorner === 'top_right') {
      x = w - marginX - bw;
    } else if (brand.logoCorner === 'bottom_left') {
      y = h - marginY - bh - (isVert ? 95 * s : 24 * s);
    } else if (brand.logoCorner === 'bottom_right') {
      x = w - marginX - bw;
      y = h - marginY - bh - (isVert ? 95 * s : 24 * s);
    }
    ctx.fillStyle = 'rgba(7, 9, 20, 0.66)';
    ctx.fillRect(x, y, bw, bh);
    ctx.strokeStyle = 'rgba(242, 200, 91, 0.65)';
    ctx.lineWidth = 1.2 * s;
    ctx.strokeRect(x, y, bw, bh);
    ctx.fillStyle = '#f2c85b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + bw / 2, y + bh / 2, bw - 8 * s);
  }
  ctx.restore();
}

function drawTransitionOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  beat: StoryBeat,
  localT: number,
  renderStyle: RenderStyleId = 'chiaroscuro'
): void {
  const dur = 0.36;
  if (localT >= dur || beat.transition === 'hard_cut') return;
  const p = clamp(localT / dur, 0, 1);
  const ep = easeOutCubic(p);

  // Step 10: Style-aware & asset-aware cinematic transitions
  if (beat.transition === 'diagonal_slash') {
    const x = lerp(w * 1.25, -w * 0.35, ep);
    ctx.save();
    ctx.fillStyle = renderStyle === 'sumi_e_wash' ? '#1c1814' : '#060814';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(x + w * 0.24, 0);
    ctx.lineTo(x, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    // Multi-layered gleaming steel / gold slash edge
    ctx.strokeStyle = renderStyle === 'sumi_e_wash' ? '#c92a24' : '#ffd04d';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.24, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.24 + 5, 0);
    ctx.lineTo(x + 5, h);
    ctx.stroke();
    ctx.restore();
  } else if (beat.transition === 'crimson_flash') {
    const alpha = Math.max(0, 1 - p * 1.45);
    ctx.fillStyle = `rgba(235, 24, 62, ${alpha * 0.85})`;
    ctx.fillRect(0, 0, w, h);
  } else if (beat.transition === 'silhouette_wipe') {
    ctx.save();
    if (renderStyle === 'shadow_puppetry') {
      // Parting backlit theatre curtains opening from center
      const halfW = (w * 0.52) * (1 - ep);
      ctx.fillStyle = '#140804';
      ctx.fillRect(0, 0, halfW, h);
      ctx.fillRect(w - halfW, 0, halfW, h);
      ctx.fillStyle = '#d49a2a';
      ctx.fillRect(halfW - 4, 0, 4, h);
      ctx.fillRect(w - halfW, 0, 4, h);
    } else if (renderStyle === 'woodblock_print' || renderStyle === 'illuminated_codex') {
      // Gilded parchment folio page-turn sweep
      const pageW = w * (1 - ep);
      ctx.fillStyle = '#e8d8b0';
      ctx.fillRect(0, 0, pageW, h);
      const foldGrad = ctx.createLinearGradient(pageW - 36, 0, pageW + 18, 0);
      foldGrad.addColorStop(0, 'rgba(30, 18, 8, 0)');
      foldGrad.addColorStop(0.65, 'rgba(30, 18, 8, 0.45)');
      foldGrad.addColorStop(1, 'rgba(30, 18, 8, 0)');
      ctx.fillStyle = foldGrad;
      ctx.fillRect(pageW - 36, 0, 54, h);
    } else if (renderStyle === 'sumi_e_wash') {
      // Organic bristle sumi-e ink brush sweep across rice paper
      const edgeX = w * (1 - ep);
      ctx.fillStyle = '#181615';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let i = 0; i <= 10; i++) {
        const y = (i / 10) * h;
        const jag = Math.sin(i * 2.7 + p * 6) * 28 * (1 - ep * 0.4);
        ctx.lineTo(edgeX + jag, y);
      }
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
    } else {
      const barW = w * (1 - ep);
      ctx.fillStyle = '#04050c';
      ctx.fillRect(0, 0, barW, h);
    }
    ctx.restore();
  } else if (beat.transition === 'ink_fade') {
    const fadeColor =
      renderStyle === 'sumi_e_wash' || renderStyle === 'woodblock_print'
        ? `rgba(24, 19, 14, ${1 - smoothstep(p)})`
        : `rgba(5, 7, 15, ${1 - smoothstep(p)})`;
    ctx.fillStyle = fadeColor;
    ctx.fillRect(0, 0, w, h);
  }
}

/**
 * Tokenizes dialogue into spoken kinetic units across Latin, Indic, RTL Arabic/Urdu, and space-free CJK.
 */
export function tokenizeKineticWords(text: string, lang: LanguageSpec): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (lang.scriptType === 'cjk' && !/\s/.test(trimmed)) {
    // Group CJK characters into natural 2-3 character rhythmic chunks, breaking cleanly after punctuation
    const chars = Array.from(trimmed);
    const chunks: string[] = [];
    let buf = '';
    const breakAfter = /[。！？、，；：!?,.;:]/;
    for (const ch of chars) {
      buf += ch;
      if (breakAfter.test(ch) || buf.length >= 3) {
        chunks.push(buf);
        buf = '';
      }
    }
    if (buf) chunks.push(buf);
    return chunks;
  }
  return trimmed.split(/\s+/).filter(Boolean);
}

/**
 * Computes which spoken token index is active at `localT` inside a beat of length `duration`.
 * Weights longer words and clause-ending punctuation slightly longer for natural reading cadence.
 */
export function computeActiveWordIndex(
  words: string[],
  localT: number,
  duration: number,
  speechWindow?: SpeechWindow | null
): number {
  if (!words.length) return -1;
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  const safeT = Number.isFinite(localT) ? clamp(localT, 0, duration) : 0;

  let progress: number;
  if (
    speechWindow &&
    Number.isFinite(speechWindow.startSec) &&
    Number.isFinite(speechWindow.endSec) &&
    speechWindow.endSec > speechWindow.startSec + 0.08
  ) {
    if (safeT < speechWindow.startSec) {
      return -1;
    }
    const span = speechWindow.endSec - speechWindow.startSec;
    progress = clamp((safeT - speechWindow.startSec) / span, 0, 1);
  } else {
    progress = clamp(safeT / duration, 0, 1);
  }

  if (words.length === 1) return 0;
  const weights = words.map((w) => {
    const base = Math.max(2, Array.from(w).length);
    const pause = /[.!?।۔。！？]$/.test(w) ? 3.2 : /[,;:،、，]$/.test(w) ? 1.6 : 0;
    return base + pause;
  });
  let totalW = 0;
  for (const wt of weights) totalW += wt;
  const target = progress * totalW;
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (target <= acc) return i;
  }
  return words.length - 1;
}

interface KineticLineToken {
  word: string;
  wordIdx: number;
  width: number;
}

function wrapKineticTokenLines(
  ctx: CanvasRenderingContext2D,
  tokens: string[],
  maxW: number,
  spaceWidth: number,
  maxLines = 3
): KineticLineToken[][] {
  const safeMaxW = Math.max(80, maxW);
  const lines: KineticLineToken[][] = [];
  let curLine: KineticLineToken[] = [];
  let curW = 0;

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    const w = ctx.measureText(word).width;
    const gap = curLine.length > 0 ? spaceWidth : 0;
    if (curLine.length > 0 && curW + gap + w > safeMaxW) {
      lines.push(curLine);
      curLine = [{ word, wordIdx: i, width: w }];
      curW = w;
    } else {
      curLine.push({ word, wordIdx: i, width: w });
      curW += gap + w;
    }
  }
  if (curLine.length > 0) lines.push(curLine);
  return lines.slice(0, Math.max(1, maxLines));
}

function drawCaptions(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  beat: StoryBeat,
  aspect: AspectMode,
  captionStyle: CaptionStyleId,
  lang: LanguageSpec,
  localT: number,
  karaokeEnabled: boolean,
  motionProfile?: MotionProfileId,
  renderStyle?: RenderStyleId,
  speechWindow?: SpeechWindow | null,
  cast?: CastMember[]
): void {
  if (!beat.dialogue.trim()) return;
  if (beat.frame === 'chapter_title' || beat.frame === 'moral_card' || beat.frame === 'end_screen') return;

  const isVert = aspect === '9:16';
  const s = Math.min(w, h) / 620;
  const padX = isVert ? w * 0.08 : w * 0.12;
  const maxW = w - padX * 2;
  const fontSize = Math.round(
    (isVert ? w * 0.044 : h * 0.042) *
      (captionStyle === 'shorts_bold_pop' || captionStyle === 'comic_speech_pop' ? 1.1 : captionStyle === 'minimal_editorial' ? 0.94 : 1.0)
  );
  const labelSize = Math.round(fontSize * 0.56);

  const fontFamily =
    captionStyle === 'gold_manuscript' || captionStyle === 'minimal_editorial'
      ? lang.displayFontFamily
      : lang.fontFamily;
  const fontWeight =
    captionStyle === 'shorts_bold_pop' || captionStyle === 'comic_speech_pop'
      ? '900'
      : captionStyle === 'minimal_editorial'
        ? '600'
        : '700';

  const emphasisTokens = parseEmphasisTokens(beat.dialogue);
  const cleanDialogue = stripEmphasisMarkup(beat.dialogue);
  const speakerAccent = resolveSpeakerAccentColor(
    beat,
    cast,
    beat.speakerId === 'narrator' ? '#c8d7f5' : '#ffd04d'
  );

  const rtl = isRtlText(cleanDialogue, lang.code);
  const profileSpec = resolveMotionProfileSpec(motionProfile, renderStyle);
  const lowerThird = computeCaptionLowerThirdMotion(
    localT,
    Math.max(1.2, Number.isFinite(beat.duration) ? beat.duration : 4),
    profileSpec
  );
  if (lowerThird.alpha <= 0.01) return;

  ctx.save();
  ctx.direction = rtl ? 'rtl' : 'ltr';
  ctx.globalAlpha *= lowerThird.alpha;
  const slideY = lowerThird.translateYNorm * (fontSize * 2.2);
  ctx.translate(w / 2, h - slideY);
  ctx.scale(lowerThird.scale, lowerThird.scale);
  ctx.translate(-w / 2, -h);

  if (captionStyle === 'classic_cinema') {
    const scrimH = h * (isVert ? 0.25 : 0.26);
    const grad = ctx.createLinearGradient(0, h - scrimH, 0, h);
    grad.addColorStop(0, 'rgba(4, 6, 14, 0)');
    grad.addColorStop(0.55, 'rgba(4, 6, 14, 0.78)');
    grad.addColorStop(1, 'rgba(4, 6, 14, 0.94)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, h - scrimH, w, scrimH);
  }

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const tokens = karaokeEnabled ? tokenizeKineticWords(cleanDialogue, lang) : [];
  const spaceGap = lang.scriptType === 'cjk' && !/\s/.test(cleanDialogue.trim())
    ? 0
    : ctx.measureText(' ').width;
  const kineticLines = karaokeEnabled && tokens.length > 0
    ? wrapKineticTokenLines(ctx, tokens, maxW, spaceGap, 3)
    : [];
  const shown = karaokeEnabled && kineticLines.length > 0
    ? kineticLines.map((ln) => ln.map((t) => t.word).join(spaceGap > 0 ? ' ' : ''))
    : wrapCanvasLines(ctx, cleanDialogue, maxW, 3);

  const lineH = fontSize * (lang.scriptType === 'indic' || lang.scriptType === 'arabic' ? 1.34 : 1.24);
  const bottomY = h - (isVert ? h * 0.075 : h * 0.062);
  const startY = bottomY - (shown.length - 1) * lineH;

  if (captionStyle === 'gold_manuscript') {
    const boxW = Math.min(w * 0.86, maxW + 48 * s);
    const boxH = shown.length * lineH + fontSize * 1.65;
    const bx = (w - boxW) / 2;
    const by = startY - fontSize * 1.55;
    ctx.save();
    ctx.fillStyle = 'rgba(12, 10, 18, 0.88)';
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = 'rgba(242, 200, 91, 0.78)';
    ctx.lineWidth = 2.2 * s;
    ctx.strokeRect(bx, by, boxW, boxH);
    ctx.restore();
  } else if (captionStyle === 'comic_speech_pop') {
    const boxW = Math.min(w * 0.88, maxW + 44 * s);
    const boxH = shown.length * lineH + fontSize * 1.55;
    const bx = (w - boxW) / 2;
    const by = startY - fontSize * 1.5;
    ctx.save();
    ctx.fillStyle = 'rgba(8, 10, 18, 0.9)';
    ctx.beginPath();
    ctx.roundRect(bx + 5 * s, by + 5 * s, boxW, boxH, 14 * s);
    ctx.fill();
    ctx.fillStyle = '#fffdf5';
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 14 * s);
    ctx.fill();
    ctx.strokeStyle = '#090b16';
    ctx.lineWidth = Math.max(3, 3.2 * s);
    ctx.stroke();
    ctx.restore();
  } else if (captionStyle === 'minimal_editorial') {
    const boxW = Math.min(w * 0.84, maxW + 32 * s);
    const boxH = shown.length * lineH + fontSize * 1.5;
    const bx = (w - boxW) / 2;
    const by = startY - fontSize * 1.48;
    ctx.save();
    ctx.fillStyle = 'rgba(9, 12, 20, 0.76)';
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.fillStyle = speakerAccent;
    ctx.fillRect(bx, by, Math.max(3, 4 * s), boxH);
    ctx.restore();
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 ${labelSize}px ${lang.fontFamily}`;
  const speakerBadge = safeUppercase(beat.speakerLabel, lang);
  if (captionStyle === 'comic_speech_pop') {
    const badgeW = Math.min(maxW, ctx.measureText(speakerBadge).width + 22 * s);
    const badgeH = labelSize * 1.55;
    const badgeX = w / 2 - badgeW / 2;
    const badgeY = startY - fontSize * 1.82;
    ctx.save();
    ctx.fillStyle = speakerAccent;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6 * s);
    ctx.fill();
    ctx.strokeStyle = '#090b16';
    ctx.lineWidth = Math.max(2, 2.2 * s);
    ctx.stroke();
    ctx.fillStyle = '#090b16';
    ctx.fillText(speakerBadge, w / 2, badgeY + badgeH * 0.74, maxW);
    ctx.restore();
  } else {
    ctx.strokeStyle = 'rgba(5, 7, 18, 0.92)';
    ctx.lineWidth = Math.max(3.5, labelSize * 0.2);
    ctx.lineJoin = 'round';
    ctx.strokeText(speakerBadge, w / 2, startY - fontSize * 0.92, maxW);
    ctx.fillStyle = speakerAccent;
    ctx.fillText(speakerBadge, w / 2, startY - fontSize * 0.92, maxW);
  }

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

  if (karaokeEnabled && kineticLines.length > 0) {
    const activeIdx = computeActiveWordIndex(tokens, localT, beat.duration, speechWindow);
    const effStart = speechWindow ? speechWindow.startSec : 0.14;
    const effEnd = speechWindow ? speechWindow.endSec : Math.max(effStart + 0.4, beat.duration - 0.18);
    const wordSpanSec = Math.max(0.12, (effEnd - effStart) / Math.max(1, tokens.length));
    const activeWordStart = effStart + Math.max(0, activeIdx) * wordSpanSec;
    const wordLocalU = clamp((localT - activeWordStart) / wordSpanSec, 0, 1);

    for (let i = 0; i < kineticLines.length; i++) {
      const lineTokens = kineticLines[i];
      const ly = startY + i * lineH;
      let lineWidth = 0;
      for (let j = 0; j < lineTokens.length; j++) {
        lineWidth += lineTokens[j].width + (j > 0 ? spaceGap : 0);
      }
      // Lay out tokens centered on the line; RTL starts on right edge and advances leftward
      let cursorX = rtl ? w / 2 + lineWidth / 2 : w / 2 - lineWidth / 2;
      for (const tok of lineTokens) {
        const cx = rtl ? cursorX - tok.width / 2 : cursorX + tok.width / 2;
        const isActive = tok.wordIdx === activeIdx;
        const isSpoken = tok.wordIdx < activeIdx;
        const isEmphasized = Boolean(emphasisTokens[tok.wordIdx]?.isEmphasized);
        const pop = computeKineticWordPop(wordLocalU, isEmphasized, isActive);

        ctx.save();
        ctx.textAlign = 'center';
        if (pop.scaleX !== 1 || pop.scaleY !== 1 || pop.liftPx !== 0) {
          ctx.translate(cx, ly - pop.liftPx * s);
          ctx.scale(pop.scaleX, pop.scaleY);
          ctx.translate(-cx, -ly);
        }

        if (captionStyle === 'shorts_bold_pop') {
          if (isActive) {
            const padW = 7 * s;
            const boxH = fontSize * 1.18;
            const bx = cx - tok.width / 2 - padW;
            const by = ly - fontSize * 0.9;
            ctx.fillStyle = speakerAccent;
            ctx.beginPath();
            ctx.roundRect(bx, by, tok.width + padW * 2, boxH, 6 * s);
            ctx.fill();
            ctx.fillStyle = '#090b16';
            ctx.fillText(tok.word, cx, ly);
          } else {
            ctx.strokeStyle = '#050712';
            ctx.lineWidth = Math.max(6, fontSize * 0.22);
            ctx.lineJoin = 'round';
            ctx.strokeText(tok.word, cx, ly);
            ctx.fillStyle = isEmphasized
              ? speakerAccent
              : isSpoken
                ? '#ffffff'
                : 'rgba(255, 255, 255, 0.72)';
            ctx.fillText(tok.word, cx, ly);
          }
        } else if (captionStyle === 'comic_speech_pop') {
          if (isActive || isEmphasized) {
            ctx.fillStyle = isActive ? speakerAccent : 'rgba(242, 200, 91, 0.35)';
            ctx.beginPath();
            ctx.roundRect(cx - tok.width / 2 - 4 * s, ly - fontSize * 0.86, tok.width + 8 * s, fontSize * 1.08, 4 * s);
            ctx.fill();
          }
          ctx.fillStyle = '#0b0e19';
          ctx.fillText(tok.word, cx, ly);
        } else if (captionStyle === 'minimal_editorial') {
          ctx.fillStyle = isActive
            ? speakerAccent
            : isEmphasized
              ? '#ffffff'
              : isSpoken
                ? '#eef2f9'
                : 'rgba(232, 236, 244, 0.66)';
          ctx.fillText(tok.word, cx, ly);
          if (isActive) {
            ctx.fillStyle = speakerAccent;
            ctx.fillRect(cx - tok.width / 2, ly + 4 * s, tok.width, Math.max(2, 2.4 * s));
          }
        } else if (captionStyle === 'minimal_clean') {
          ctx.strokeStyle = 'rgba(5, 7, 16, 0.94)';
          ctx.lineWidth = Math.max(4, fontSize * 0.14);
          ctx.lineJoin = 'round';
          ctx.strokeText(tok.word, cx, ly);
          if (isActive || isEmphasized) {
            ctx.shadowColor = speakerAccent;
            ctx.shadowBlur = (isActive ? 10 : 6) * s;
          }
          ctx.fillStyle = isActive
            ? speakerAccent
            : isEmphasized
              ? '#ffe799'
              : isSpoken
                ? '#fbf8f1'
                : 'rgba(251, 248, 241, 0.74)';
          ctx.fillText(tok.word, cx, ly);
        } else {
          ctx.fillStyle = 'rgba(4, 6, 14, 0.94)';
          ctx.fillText(tok.word, cx + 2.2, ly + 2.2);
          if (isActive || isEmphasized) {
            ctx.shadowColor = speakerAccent;
            ctx.shadowBlur = (isActive ? 10 : 5) * s;
          }
          ctx.fillStyle = isActive
            ? speakerAccent
            : isEmphasized
              ? '#ffe58f'
              : isSpoken
                ? (captionStyle === 'gold_manuscript' ? '#fdf4df' : '#ffffff')
                : 'rgba(245, 244, 240, 0.74)';
          ctx.fillText(tok.word, cx, ly);
        }
        ctx.restore();

        cursorX = rtl
          ? cursorX - tok.width - spaceGap
          : cursorX + tok.width + spaceGap;
      }
    }
  } else {
    for (let i = 0; i < shown.length; i++) {
      const ly = startY + i * lineH;
      if (captionStyle === 'shorts_bold_pop') {
        ctx.strokeStyle = '#050712';
        ctx.lineWidth = Math.max(6, fontSize * 0.22);
        ctx.lineJoin = 'round';
        ctx.strokeText(shown[i], w / 2, ly);
        ctx.fillStyle = i === 0 ? speakerAccent : '#ffffff';
        ctx.fillText(shown[i], w / 2, ly);
      } else if (captionStyle === 'comic_speech_pop') {
        ctx.fillStyle = '#0b0e19';
        ctx.fillText(shown[i], w / 2, ly);
      } else if (captionStyle === 'minimal_editorial') {
        ctx.fillStyle = '#f3f6fc';
        ctx.fillText(shown[i], w / 2, ly);
      } else if (captionStyle === 'minimal_clean') {
        // Crisp dark ink contour guarantees 100% readability even on pale sumi-e & cotton-paper engines
        ctx.strokeStyle = 'rgba(5, 7, 16, 0.92)';
        ctx.lineWidth = Math.max(4, fontSize * 0.14);
        ctx.lineJoin = 'round';
        ctx.strokeText(shown[i], w / 2, ly);
        ctx.fillStyle = '#fbf8f1';
        ctx.fillText(shown[i], w / 2, ly);
      } else {
        ctx.fillStyle = 'rgba(4, 6, 14, 0.94)';
        ctx.fillText(shown[i], w / 2 + 2.2, ly + 2.2);
        ctx.fillStyle = captionStyle === 'gold_manuscript' ? '#fdf4df' : '#ffffff';
        ctx.fillText(shown[i], w / 2, ly);
      }
    }
  }
  ctx.restore();
}

/**
 * Master 60fps Machinima Frame Renderer for ANY EpisodeScript.
 */
export function renderEpisodeFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  episode: EpisodeScript,
  ev: EvaluatedBeat,
  globalT: number,
  aspect: AspectMode,
  showCaptions: boolean,
  expressionsEnabled = true,
  speechWindow?: SpeechWindow | null
): void {
  if (!Number.isFinite(w) || !Number.isFinite(h) || w < 16 || h < 16) return;
  const lang = resolveEpisodeLanguage(episode);
  const { beat, u, localT, speechEnergy, viseme } = ev;
  const fallbackCast: CastMember = {
    id: 'fallback_cast',
    name: 'Storyteller',
    archetype: 'sage',
    primaryColor: '#d96c1f',
    accentColor: '#ffd452',
    skinColor: '#d9986c',
  };
  const castMap = new Map<string, CastMember>();
  for (const c of episode.cast || []) castMap.set(c.id, c);
  const getCast = (id: string) => castMap.get(id) || episode.cast?.[0] || fallbackCast;

  const pal = MOOD_PALETTES[beat.mood] || MOOD_PALETTES.midnight_banyan;
  const style = resolveVisualStyle(episode.visualStyle);
  const activeExpressions = expressionsEnabled && style.expressionsEnabled !== false;
  const exprFor = (actor: ActorPlacement) =>
    resolveActorExpressionAtTime(actor, beat, localT, activeExpressions);
  const activeRenderStyle = beat.renderStyle || style.renderStyle;
  const s = Math.min(w, h) / 620;
  const isVert = aspect === '9:16';

  // Steps 7, 8, 9: Compute deterministic Style Grammar, Motion Cadence, Motion Profile, Sub-Beat Action Cues, SFX & Dynamic Lighting
  const styleGrammar = getStyleAnimationGrammar(activeRenderStyle);
  const motionCadence = style.motionCadence || 'auto';
  const motionProfile = style.motionProfile || 'auto';
  const actionState = resolveBeatActionStateAtFrame(beat, ev.localFrame);
  const hitstop = computeHitstopState(
    beat,
    ev.localFrame,
    STUDIO_FPS,
    style.hitstopEnabled !== false
  );
  const effectiveCadenceFps = resolveEffectiveMotionFps(activeRenderStyle, motionCadence);
  const sfxChoreo = computeSfxChoreography(beat, localT, globalT);
  const rawAnimT = sfxChoreo.effectiveTime;
  const steppedT = snapStyleTime(rawAnimT, activeRenderStyle, motionCadence);
  const animT = motionCadence === '60fps' ? rawAnimT : motionCadence === 'auto' ? rawAnimT : steppedT;
  const beatDur = Math.max(1.2, Number.isFinite(beat.duration) ? beat.duration : 4);
  const motionU =
    motionCadence === '12fps' || motionCadence === '24fps'
      ? clamp(snapStyleTime(localT, activeRenderStyle, motionCadence) / beatDur, 0, 1)
      : u;
  // Upgrade 21: During deterministic hitstop freeze, lock actor limb/pose clock to frozenLocalFrame
  const frozenLocalT = hitstop.frozenLocalFrame / STUDIO_FPS;
  const actorAnimT = hitstop.isFrozen
    ? snapStyleTime(
        Math.max(0, globalT - (localT - frozenLocalT)),
        activeRenderStyle,
        motionCadence
      )
    : animT;
  const actorMotionU = hitstop.isFrozen
    ? clamp(frozenLocalT / beatDur, 0, 1)
    : motionU;
  const lighting = computeSceneLighting(beat, animT, sfxChoreo, styleGrammar);
  const showDepthForeground =
    beat.frame !== 'chapter_title' &&
    beat.frame !== 'moral_card' &&
    beat.frame !== 'end_screen';
  const fgFramingIntensity = style.foregroundFraming ?? 0.35;

  const effectiveActors: ActorPlacement[] = (beat.actors || []).map((a) => {
    const poseOvr = actionState.actorPoseOverrides[a.castId];
    const motOvr = actionState.actorMotionOverrides[a.castId];
    if (!poseOvr && !motOvr) return a;
    return {
      ...a,
      ...(poseOvr ? { pose: poseOvr } : {}),
      ...(motOvr ? { motion: motOvr } : {}),
    };
  });
  const applyActionCameraPunch = (baseCam: { zoom: number; panX: number; panY: number }) => {
    const p = actionState.cameraPunch;
    const hsActive = hitstop.isFrozen || Math.abs(hitstop.shakeX) > 0.001 || Math.abs(hitstop.shakeY) > 0.001;
    if (p <= 0.005 && !hsActive) return baseCam;
    return {
      zoom: baseCam.zoom + p * 0.095 + (hitstop.isFrozen ? 0.025 * hitstop.impactEnvelope : 0),
      panX: baseCam.panX + Math.sin(ev.localFrame * 2.1) * p * 10 * s + hitstop.shakeX * 6 * s,
      panY: baseCam.panY + Math.cos(ev.localFrame * 2.7) * p * 7 * s + hitstop.shakeY * 5 * s,
    };
  };

  // Anchor point for SFX sparks / acoustic shockwaves (defaults to active speaker or stage center)
  let sfxAnchorX = w * 0.5;
  let sfxAnchorY = h * 0.52;

  ctx.save();

  const fallbackPlacement: ActorPlacement = {
    castId: getCast('').id,
    slot: 'center',
    pose: 'stand',
    expression: 'calm',
    facing: 'right',
    motion: 'still',
  };
  const actor0 = effectiveActors[0] || fallbackPlacement;
  const actor1 = effectiveActors[1] || actor0;

  const dofSpec = computeBeatDepthOfFieldSpec(beat, style, u);
  const hasCameraKeyframes = Boolean(beat.cameraKeyframes && beat.cameraKeyframes.length > 0);

  if (beat.shot === 'wide_stage' || beat.shot === 'two_shot') {
    const baseZoom = beat.shot === 'two_shot' ? 1.18 : 1.0;
    const baseCam = applyActionCameraPunch(
      computeCameraTransform(
        w,
        h,
        baseZoom,
        beat.cameraMove,
        u,
        animT,
        sfxChoreo,
        motionProfile,
        activeRenderStyle
      )
    );
    const speakerOffset = computeSpeakerCameraOffset(
      beat,
      aspect,
      u,
      style.autoTrackSpeaker !== false,
      motionProfile,
      activeRenderStyle
    );
    const hasSpeakerCameraOffset =
      Math.abs(speakerOffset.panXNorm) > 0.001 ||
      Math.abs(speakerOffset.panYNorm) > 0.001 ||
      speakerOffset.zoomBoost > 0.001;
    const speakerCam = hasSpeakerCameraOffset
      ? {
          zoom: baseCam.zoom + speakerOffset.zoomBoost,
          panX: baseCam.panX + speakerOffset.panXNorm * w,
          panY: baseCam.panY + speakerOffset.panYNorm * h,
        }
      : baseCam;
    const cam = hasCameraKeyframes
      ? composeCameraWithKeyframes(speakerCam, beat.cameraKeyframes, u, w, h)
      : speakerCam;
    const fgDepthFactor = activeRenderStyle === 'papercraft_diorama' ? 1.08 : 1.0;
    const actorScale = s * (beat.shot === 'two_shot' ? 1.02 : 0.92);
    const propSpec = resolveHandAnchoredProp(
      beat,
      w,
      h,
      s,
      motionU,
      isVert,
      actorScale,
      getCast,
      animT,
      speechEnergy,
      activeRenderStyle,
      motionCadence,
      motionProfile
    );
    if (beat.prop !== 'none' || beat.customPropDataUrl) {
      sfxAnchorX = propSpec.px;
      sfxAnchorY = propSpec.py;
    } else if (actor0) {
      const a0Pos = computeActorPosition(actor0, w, h, s, motionU, isVert, motionProfile, activeRenderStyle);
      sfxAnchorX = a0Pos.x;
      sfxAnchorY = a0Pos.y - 120 * actorScale;
    }

    const staticCamKey =
      (beat.cameraMove === 'still' || !beat.cameraMove) &&
      !hasSpeakerCameraOffset &&
      !hasCameraKeyframes &&
      sfxChoreo.shakeX === 0 &&
      sfxChoreo.shakeY === 0 &&
      sfxChoreo.rimBoost <= 0.01 &&
      !beat.actors?.some((a) => a.motion && a.motion !== 'still')
        ? `wide|${beat.id}|${beat.stage}|${beat.mood}|${beat.crowd || 'none'}|${beat.haze || 0}|${beat.flipStage ? 1 : 0}|${beat.backdropZoom || 1}|${dofSpec.cacheTag}|${Math.floor(animT * 6)}`
        : undefined;

    composeStyledScene(ctx, w, h, activeRenderStyle, beat.mood, animT, {
      drawBackdrop: (bCtx) => {
        // Step 1: Far Parallax Plane (0.55x pan/zoom) for true multi-plane 2.5D depth
        bCtx.save();
        applyParallaxCamera(bCtx, w, h, cam, 0.55);
        drawTransformedBackdrop(bCtx, w, h, beat, animT);
        bCtx.restore();

        // Midground Plane (1.0x): reactive living crowds, haze & grounded shadows
        bCtx.save();
        applyParallaxCamera(bCtx, w, h, cam, 1.0);
        drawCrowdLayer(bCtx, w, h, beat.crowd, beat.mood, animT, beat, sfxChoreo);
        drawStageHaze(bCtx, w, h, beat);
        if ((beat.prop !== 'none' || beat.customPropDataUrl) && !propSpec.isHeld && beat.propSlot !== 'overhead') {
          drawGroundContactShadow(bCtx, propSpec.px, propSpec.py + 42 * s, 54 * s, 14 * s, 0.34);
        }
        const reflectedActors: ReflectedActorSnapshot[] = [];
        for (const a of effectiveActors) {
          const isAirborne =
            a.slot === 'overhead' || a.pose === 'soar' || a.pose === 'hang_upside_down';
          const c = getCast(a.castId);
          const pos = computeActorPosition(a, w, h, s, actorMotionU, isVert, motionProfile, activeRenderStyle);
          reflectedActors.push({
            x: pos.x,
            y: a.motion === 'leap_arc' ? h * 0.84 : pos.y,
            scale: actorScale * (c.scale || 1),
            primaryColor: c.primaryColor,
            accentColor: c.accentColor,
            isAirborne,
          });
          if (isAirborne) continue;
          const leapShrink = a.motion === 'leap_arc' ? 1 - Math.sin(actorMotionU * Math.PI) * 0.45 : 1;
          const shadowY = a.motion === 'leap_arc' ? h * 0.84 : pos.y;
          drawGroundContactShadow(
            bCtx,
            pos.x + lighting.shadowSkewX * 14 * s,
            shadowY + 4 * s,
            46 * actorScale * (c.scale || 1) * leapShrink,
            12 * actorScale * leapShrink,
            0.46 * leapShrink
          );
        }
        // Upgrade 24: Directional cast ground shadows + wet-surface/water reflections
        drawGroundedShadowAndReflection(bCtx, w, h, beat, reflectedActors, animT, pal);
        bCtx.restore();
        if (dofSpec.enabled) {
          applyPooledBackdropDof(bCtx, w, h, dofSpec);
        }
      },
      drawForeground: (fCtx) => {
        fCtx.save();
        applyParallaxCamera(fCtx, w, h, cam, fgDepthFactor);

        // Stage-grounded props render behind actors; hand-held props render in front of actor's live wrist!
        const propCarrier =
          beat.propAnchor === 'actor_right_hand'
            ? effectiveActors[1] || effectiveActors[0]
            : beat.propAnchor === 'actor_left_hand'
              ? effectiveActors[0]
              : undefined;
        const propPhys = computePropPhysics(
          beat,
          animT,
          motionU,
          s,
          propCarrier,
          actionState.propPulse
        );
        if ((beat.prop !== 'none' || beat.customPropDataUrl) && !propSpec.isHeld) {
          const pxPhys = propSpec.px + propPhys.offsetX;
          const pyPhys = propSpec.py + propPhys.offsetY;
          const pulseScale = propSpec.scale * propPhys.scalePulse * (1 + actionState.propPulse * 0.22);
          if (propPhys.glowBoost > 0.12) {
            fCtx.save();
            const haloRad = (48 + propPhys.glowBoost * 24) * s;
            const halo = fCtx.createRadialGradient(pxPhys, pyPhys, 0, pxPhys, pyPhys, haloRad);
            halo.addColorStop(0, pal.accent);
            halo.addColorStop(1, 'rgba(0,0,0,0)');
            fCtx.globalCompositeOperation = 'screen';
            fCtx.globalAlpha = propPhys.glowBoost * 0.34;
            fCtx.fillStyle = halo;
            fCtx.beginPath();
            fCtx.arc(pxPhys, pyPhys, haloRad, 0, Math.PI * 2);
            fCtx.fill();
            fCtx.restore();
          }
          if (actionState.propPulse > 0.04) {
            fCtx.save();
            fCtx.strokeStyle = pal.accent;
            fCtx.globalAlpha = actionState.propPulse * 0.72;
            fCtx.lineWidth = 3.5 * s;
            fCtx.beginPath();
            fCtx.arc(pxPhys, pyPhys, (44 + (1 - actionState.propPulse) * 48) * s, 0, Math.PI * 2);
            fCtx.stroke();
            fCtx.restore();
          }
          drawCustomOrHeroProp(
            fCtx,
            beat,
            pxPhys,
            pyPhys,
            pulseScale,
            animT,
            motionU,
            propSpec.rotation + propPhys.rotationRad,
            localT,
            effectiveCadenceFps
          );
        }

        // Draw Actors with Archetype Kinematics, 12-Principles Envelopes, Tapered Motion Arcs & 2-Bone Arms
        for (const a of effectiveActors) {
          const c = getCast(a.castId);
          const isSpeaking = beat.speakerId === a.castId;
          const pos = computeActorPosition(a, w, h, s, actorMotionU, isVert, motionProfile, activeRenderStyle);
          if (
            a.motion === 'enter_left' ||
            a.motion === 'enter_right' ||
            a.motion === 'cross_stage' ||
            a.motion === 'leap_arc' ||
            a.pose === 'attack' ||
            a.pose === 'recoil' ||
            a.pose === 'soar'
          ) {
            const prevU = clamp(actorMotionU - 0.06, 0, 1);
            const prevPos = computeActorPosition(a, w, h, s, prevU, isVert, motionProfile, activeRenderStyle);
            let dx = pos.x - prevPos.x;
            let dy = pos.y - prevPos.y;
            if (Math.hypot(dx, dy) < 6 * s && (a.pose === 'attack' || a.pose === 'recoil')) {
              const dir = (a.facing || (a.slot === 'right' ? 'left' : 'right')) === 'left' ? -1 : 1;
              dx = (a.pose === 'attack' ? dir : -dir) * 28 * s;
              dy = -6 * s;
            }
            drawTaperedMotionArcs(
              fCtx,
              pos.x,
              pos.y - 105 * actorScale,
              dx,
              dy,
              actorScale,
              pal.rimLight,
              activeRenderStyle
            );
          }
          drawActorFullBody(
            fCtx,
            c,
            pos.x,
            pos.y,
            actorScale,
            a.pose,
            exprFor(a),
            a.facing || (a.slot === 'right' ? 'left' : 'right'),
            isSpeaking ? viseme : 0,
            isSpeaking ? speechEnergy : 0,
            actorAnimT,
            actorMotionU,
            a.motion,
            activeRenderStyle,
            lighting,
            motionProfile
          );
        }

        if ((beat.prop !== 'none' || beat.customPropDataUrl) && propSpec.isHeld) {
          const pxPhys = propSpec.px + propPhys.offsetX;
          const pyPhys = propSpec.py + propPhys.offsetY;
          const pulseScale = propSpec.scale * propPhys.scalePulse * (1 + actionState.propPulse * 0.22);
          if (propPhys.glowBoost > 0.14) {
            fCtx.save();
            const haloRad = (42 + propPhys.glowBoost * 20) * s;
            const halo = fCtx.createRadialGradient(pxPhys, pyPhys, 0, pxPhys, pyPhys, haloRad);
            halo.addColorStop(0, pal.accent);
            halo.addColorStop(1, 'rgba(0,0,0,0)');
            fCtx.globalCompositeOperation = 'screen';
            fCtx.globalAlpha = propPhys.glowBoost * 0.3;
            fCtx.fillStyle = halo;
            fCtx.beginPath();
            fCtx.arc(pxPhys, pyPhys, haloRad, 0, Math.PI * 2);
            fCtx.fill();
            fCtx.restore();
          }
          drawCustomOrHeroProp(
            fCtx,
            beat,
            pxPhys,
            pyPhys,
            pulseScale,
            animT,
            u,
            propSpec.rotation + propPhys.rotationRad,
            localT,
            effectiveCadenceFps
          );
        }
        fCtx.restore();

        // Step 1: Close Foreground Depth Framing Plane (1.38x parallax) + Upgrade 25 Corner Framing Silhouettes (1.28x parallax)
        if (showDepthForeground) {
          fCtx.save();
          applyParallaxCamera(fCtx, w, h, cam, 1.38);
          drawStageForegroundDepthLayer(fCtx, w, h, beat.stage, pal, animT);
          fCtx.restore();
          if (fgFramingIntensity > 0.01) {
            drawForegroundParallaxLayer(
              fCtx,
              w,
              h,
              beat.stage,
              beat.mood,
              cam.panX,
              cam.zoom,
              animT,
              fgFramingIntensity
            );
          }
        }
      },
    }, staticCamKey);
  } else if (beat.shot === 'closeup_left' || beat.shot === 'closeup_right') {
    const focusActor = beat.shot === 'closeup_right' ? actor1 : actor0;
    const c = getCast(focusActor.castId);
    const isSpeaking = beat.speakerId === focusActor.castId;
    const rawCuCam = computeCameraTransform(
      w,
      h,
      1.0,
      beat.cameraMove,
      u,
      animT,
      sfxChoreo,
      motionProfile,
      activeRenderStyle
    );
    const cam = hasCameraKeyframes
      ? composeCameraWithKeyframes(rawCuCam, beat.cameraKeyframes, u, w, h)
      : rawCuCam;
    const cuSteppedT = snapStyleTime(rawAnimT, activeRenderStyle, motionCadence);

    const cuBgKey =
      (beat.cameraMove === 'still' || !beat.cameraMove) &&
      !hasCameraKeyframes &&
      sfxChoreo.shakeX === 0 &&
      sfxChoreo.rimBoost <= 0.01
        ? `cu|${beat.id}|${beat.mood}|${dofSpec.cacheTag}`
        : undefined;

    composeStyledScene(ctx, w, h, activeRenderStyle, beat.mood, animT, {
      drawBackdrop: (bCtx) => {
        bCtx.save();
        applyParallaxCamera(bCtx, w, h, cam, 0.55);
        const bgGrad = bCtx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, pal.skyTop);
        bgGrad.addColorStop(0.65, pal.skyMid);
        bgGrad.addColorStop(1, pal.skyLow);
        bCtx.fillStyle = bgGrad;
        bCtx.fillRect(0, 0, w, h);

        // Graphic diagonal chiaroscuro key-light beam behind portrait
        bCtx.fillStyle = pal.skyLow;
        bCtx.beginPath();
        bCtx.moveTo(w * 0.52, 0);
        bCtx.lineTo(w, 0);
        bCtx.lineTo(w * 0.74, h);
        bCtx.lineTo(w * 0.28, h);
        bCtx.closePath();
        bCtx.fill();

        // Radial rim-light portrait halo separating silhouette from background
        const halo = bCtx.createRadialGradient(w * 0.5, h * 0.45, 24 * s, w * 0.5, h * 0.45, 290 * s);
        halo.addColorStop(0, sfxChoreo.rimBoost > 0.2 ? lighting.rimColor : pal.rimLight);
        halo.addColorStop(0.55, 'rgba(255,255,255,0.08)');
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        bCtx.globalAlpha = 0.28 + sfxChoreo.rimBoost * 0.22;
        bCtx.fillStyle = halo;
        bCtx.fillRect(0, 0, w, h);
        bCtx.globalAlpha = 1;
        bCtx.restore();
        if (dofSpec.enabled) {
          applyPooledBackdropDof(bCtx, w, h, dofSpec);
        }
      },
      drawForeground: (fCtx) => {
        fCtx.save();
        applyParallaxCamera(fCtx, w, h, cam, 1.0);
        fCtx.translate(w * 0.5, h * (isVert ? 0.46 : 0.52));
        fCtx.scale(s * 1.45, s * 1.45);
        drawActorCloseUp(
          fCtx,
          c,
          exprFor(focusActor),
          isSpeaking ? viseme : 0,
          isSpeaking ? speechEnergy : 0,
          beat.lightSide,
          cuSteppedT
        );
        fCtx.restore();
      },
    }, cuBgKey);
  } else if (beat.shot === 'split_faceoff') {
    const cL = getCast(actor0.castId);
    const cR = getCast(actor1.castId);
    const speakL = beat.speakerId === actor0.castId;
    const speakR = beat.speakerId === actor1.castId;
    const cam = computeCameraTransform(
      w,
      h,
      1.0,
      beat.cameraMove === 'impact_shake' ? 'impact_shake' : 'still',
      u,
      animT,
      sfxChoreo,
      motionProfile,
      activeRenderStyle
    );
    const splitSteppedT = snapStyleTime(rawAnimT, activeRenderStyle, motionCadence);

    composeStyledScene(ctx, w, h, activeRenderStyle, beat.mood, animT, {
      drawBackdrop: (bCtx) => {
        bCtx.save();
        if (beat.cameraMove === 'impact_shake' || sfxChoreo.shakeX !== 0 || sfxChoreo.shakeY !== 0) {
          applyParallaxCamera(bCtx, w, h, cam, 0.7);
        }
        const gradL = bCtx.createLinearGradient(0, 0, w * 0.5, h);
        gradL.addColorStop(0, pal.skyTop);
        gradL.addColorStop(1, pal.skyMid);
        bCtx.fillStyle = gradL;
        bCtx.beginPath();
        bCtx.moveTo(0, 0);
        bCtx.lineTo(w * 0.54, 0);
        bCtx.lineTo(w * 0.46, h);
        bCtx.lineTo(0, h);
        bCtx.closePath();
        bCtx.fill();

        const gradR = bCtx.createLinearGradient(w * 0.5, 0, w, h);
        gradR.addColorStop(0, pal.skyMid);
        gradR.addColorStop(1, pal.skyLow);
        bCtx.fillStyle = gradR;
        bCtx.beginPath();
        bCtx.moveTo(w * 0.54, 0);
        bCtx.lineTo(w, 0);
        bCtx.lineTo(w, h);
        bCtx.lineTo(w * 0.46, h);
        bCtx.closePath();
        bCtx.fill();

        // Subtle speaker rim spotlight on active side of split face-off
        const activeSideX = speakR && !speakL ? w * 0.74 : w * 0.26;
        const spot = bCtx.createRadialGradient(activeSideX, h * 0.48, 20 * s, activeSideX, h * 0.48, 240 * s);
        spot.addColorStop(0, pal.rimLight);
        spot.addColorStop(1, 'rgba(0,0,0,0)');
        bCtx.globalAlpha = 0.22;
        bCtx.fillStyle = spot;
        bCtx.fillRect(0, 0, w, h);
        bCtx.globalAlpha = 1;
        bCtx.restore();
      },
      drawForeground: (fCtx) => {
        fCtx.save();
        if (beat.cameraMove === 'impact_shake' || sfxChoreo.shakeX !== 0 || sfxChoreo.shakeY !== 0) {
          applyParallaxCamera(fCtx, w, h, cam, 1.0);
        }
        // Left panel actor
        fCtx.save();
        fCtx.beginPath();
        fCtx.moveTo(0, 0);
        fCtx.lineTo(w * 0.54, 0);
        fCtx.lineTo(w * 0.46, h);
        fCtx.lineTo(0, h);
        fCtx.closePath();
        fCtx.clip();
        fCtx.translate(w * 0.26, h * 0.52);
        fCtx.scale(s * (isVert ? 0.92 : 1.24), s * (isVert ? 0.92 : 1.24));
        drawActorCloseUp(fCtx, cL, exprFor(actor0), speakL ? viseme : 0, speakL ? speechEnergy : 0, 'right', splitSteppedT);
        fCtx.restore();

        // Right panel actor
        fCtx.save();
        fCtx.beginPath();
        fCtx.moveTo(w * 0.54, 0);
        fCtx.lineTo(w, 0);
        fCtx.lineTo(w, h);
        fCtx.lineTo(w * 0.46, h);
        fCtx.closePath();
        fCtx.clip();
        fCtx.translate(w * 0.74, h * 0.52);
        fCtx.scale(s * (isVert ? 0.92 : 1.24), s * (isVert ? 0.92 : 1.24));
        drawActorCloseUp(fCtx, cR, exprFor(actor1), speakR ? viseme : 0, speakR ? speechEnergy : 0, 'left', splitSteppedT);
        fCtx.restore();

        // Golden diagonal clash divider with subtle outer dark contour
        fCtx.strokeStyle = 'rgba(4, 6, 14, 0.85)';
        fCtx.lineWidth = 10 * s;
        fCtx.beginPath();
        fCtx.moveTo(w * 0.54, 0);
        fCtx.lineTo(w * 0.46, h);
        fCtx.stroke();
        fCtx.strokeStyle = '#ffd04d';
        fCtx.lineWidth = 5 * s;
        fCtx.beginPath();
        fCtx.moveTo(w * 0.54, 0);
        fCtx.lineTo(w * 0.46, h);
        fCtx.stroke();
        fCtx.restore();
      },
    });
  } else if (beat.shot === 'eye_strip') {
    const focus = actor0;
    const c = getCast(focus.castId);
    const stripH = h * (isVert ? 0.26 : 0.34);
    const stripY = h * 0.45 - stripH / 2;
    const eyeSteppedT = snapStyleTime(rawAnimT, activeRenderStyle, motionCadence);

    composeStyledScene(ctx, w, h, activeRenderStyle, beat.mood, animT, {
      drawBackdrop: (bCtx) => {
        bCtx.fillStyle = '#04050c';
        bCtx.fillRect(0, 0, w, h);
        bCtx.fillStyle = pal.skyLow;
        bCtx.fillRect(0, stripY, w, stripH);
      },
      drawForeground: (fCtx) => {
        fCtx.save();
        fCtx.beginPath();
        fCtx.rect(0, stripY, w, stripH);
        fCtx.clip();
        fCtx.translate(w * 0.5 + sfxChoreo.shakeX * 0.6, stripY + stripH * 0.62 + sfxChoreo.shakeY * 0.6);
        const zoom = lerp(2.2, 2.48, smoothstep(u));
        fCtx.scale(s * zoom, s * zoom);
        drawActorCloseUp(fCtx, c, exprFor(focus), 0, speechEnergy, beat.lightSide, eyeSteppedT);
        fCtx.restore();

        fCtx.fillStyle = pal.accent;
        fCtx.fillRect(0, stripY - 3, w, 3);
        fCtx.fillRect(0, stripY + stripH, w, 3);
      },
    }, `eye|${beat.id}|${beat.mood}`);
  } else if (beat.shot === 'low_angle_swoop') {
    const groundActor = actor0;
    const flyActor = actor1;
    const cG = getCast(groundActor.castId);
    const cF = getCast(flyActor.castId);
    const rawSwoopCam = computeCameraTransform(
      w,
      h,
      1.0,
      beat.cameraMove,
      u,
      animT,
      sfxChoreo,
      motionProfile,
      activeRenderStyle
    );
    const cam = hasCameraKeyframes
      ? composeCameraWithKeyframes(rawSwoopCam, beat.cameraKeyframes, u, w, h)
      : rawSwoopCam;

    composeStyledScene(ctx, w, h, activeRenderStyle, beat.mood, animT, {
      drawBackdrop: (bCtx) => {
        bCtx.save();
        applyParallaxCamera(bCtx, w, h, cam, 0.55);
        drawTransformedBackdrop(bCtx, w, h, beat, animT);
        bCtx.restore();
        bCtx.save();
        applyParallaxCamera(bCtx, w, h, cam, 1.0);
        drawCrowdLayer(bCtx, w, h, beat.crowd, beat.mood, animT, beat, sfxChoreo);
        drawStageHaze(bCtx, w, h, beat);
        bCtx.restore();
        if (dofSpec.enabled) {
          applyPooledBackdropDof(bCtx, w, h, dofSpec);
        }
      },
      drawForeground: (fCtx) => {
        fCtx.save();
        applyParallaxCamera(fCtx, w, h, cam, 1.0);
        drawActorFullBody(
          fCtx,
          cG,
          w * 0.22,
          h * 0.85,
          s * 0.88,
          groundActor.pose,
          exprFor(groundActor),
          'right',
          0,
          0,
          animT,
          u,
          groundActor.motion,
          activeRenderStyle,
          lighting,
          motionProfile
        );

        const eu = easeOutCubic(u);
        const fx = lerp(w * 0.3, w * 0.8, eu);
        const fy = lerp(h * 0.58, h * 0.24, eu) - Math.sin(eu * Math.PI) * 95 * s;

        if (beat.fx === 'smear_swoop' || flyActor.pose === 'soar') {
          const tailU = Math.max(0, eu - 0.32);
          const tx = lerp(w * 0.3, w * 0.8, tailU);
          const ty = lerp(h * 0.58, h * 0.24, tailU) - Math.sin(tailU * Math.PI) * 95 * s;
          const mx = (tx + fx) / 2;
          const my = (ty + fy) / 2 - 24 * s;
          fCtx.strokeStyle = pal.accent;
          fCtx.lineWidth = 10 * s;
          fCtx.lineCap = 'round';
          fCtx.beginPath();
          fCtx.moveTo(tx, ty);
          fCtx.quadraticCurveTo(mx, my, fx, fy);
          fCtx.stroke();
          fCtx.strokeStyle = '#ffffff';
          fCtx.lineWidth = 3 * s;
          fCtx.beginPath();
          fCtx.moveTo(lerp(tx, fx, 0.3), lerp(ty, fy, 0.3));
          fCtx.quadraticCurveTo(mx, my, fx, fy);
          fCtx.stroke();
        }

        drawActorFullBody(
          fCtx,
          cF,
          fx,
          fy,
          s * lerp(0.9, 0.62, eu),
          'soar',
          exprFor(flyActor),
          'right',
          beat.speakerId === flyActor.castId ? viseme : 0,
          speechEnergy,
          animT,
          u,
          flyActor.motion,
          activeRenderStyle,
          lighting,
          motionProfile
        );
        fCtx.restore();

        if (showDepthForeground) {
          fCtx.save();
          applyParallaxCamera(fCtx, w, h, cam, 1.38);
          drawStageForegroundDepthLayer(fCtx, w, h, beat.stage, pal, animT);
          fCtx.restore();
          if (fgFramingIntensity > 0.01) {
            drawForegroundParallaxLayer(
              fCtx,
              w,
              h,
              beat.stage,
              beat.mood,
              cam.panX,
              cam.zoom,
              animT,
              fgFramingIntensity
            );
          }
        }
      },
    });
  } else if (beat.shot === 'prop_spotlight') {
    const rawPropCam = computeCameraTransform(
      w,
      h,
      1.0,
      beat.cameraMove,
      u,
      animT,
      sfxChoreo,
      motionProfile,
      activeRenderStyle
    );
    const cam = hasCameraKeyframes
      ? composeCameraWithKeyframes(rawPropCam, beat.cameraKeyframes, u, w, h)
      : rawPropCam;
    sfxAnchorX = w * 0.6;
    sfxAnchorY = h * (isVert ? 0.56 : 0.62);

    composeStyledScene(ctx, w, h, activeRenderStyle, beat.mood, animT, {
      drawBackdrop: (bCtx) => {
        bCtx.save();
        applyParallaxCamera(bCtx, w, h, cam, 0.55);
        drawTransformedBackdrop(bCtx, w, h, beat, animT);
        bCtx.restore();
        bCtx.save();
        applyParallaxCamera(bCtx, w, h, cam, 1.0);
        drawCrowdLayer(bCtx, w, h, beat.crowd, beat.mood, animT, beat, sfxChoreo);
        drawStageHaze(bCtx, w, h, beat);
        bCtx.fillStyle = 'rgba(4, 6, 15, 0.38)';
        bCtx.fillRect(0, 0, w, h);
        bCtx.restore();
        if (dofSpec.enabled) {
          applyPooledBackdropDof(bCtx, w, h, dofSpec);
        }
      },
      drawForeground: (fCtx) => {
        fCtx.save();
        applyParallaxCamera(fCtx, w, h, cam, 1.0);
        if (actor0) {
          const c = getCast(actor0.castId);
          const isSpeaking = beat.speakerId === actor0.castId;
          drawActorFullBody(
            fCtx,
            c,
            w * 0.26,
            h * 0.82,
            s * 0.92,
            actor0.pose,
            exprFor(actor0),
            'right',
            isSpeaking ? viseme : 0,
            isSpeaking ? speechEnergy : 0,
            animT,
            u,
            actor0.motion,
            activeRenderStyle,
            lighting,
            motionProfile
          );
        }

        if (beat.prop !== 'none' || beat.customPropDataUrl) {
          const spotPhys = computePropPhysics(beat, animT, u, s, actor0, actionState.propPulse);
          const pxSpot = w * 0.6 + spotPhys.offsetX;
          const pySpot = h * (isVert ? 0.56 : 0.62) + spotPhys.offsetY;
          const zoom = lerp(1.0, 1.12, smoothstep(u)) * spotPhys.scalePulse * (1 + actionState.propPulse * 0.2);
          if (spotPhys.glowBoost > 0.12) {
            fCtx.save();
            const haloRad = (62 + spotPhys.glowBoost * 28) * s;
            const halo = fCtx.createRadialGradient(pxSpot, pySpot, 0, pxSpot, pySpot, haloRad);
            halo.addColorStop(0, pal.accent);
            halo.addColorStop(1, 'rgba(0,0,0,0)');
            fCtx.globalCompositeOperation = 'screen';
            fCtx.globalAlpha = spotPhys.glowBoost * 0.36;
            fCtx.fillStyle = halo;
            fCtx.beginPath();
            fCtx.arc(pxSpot, pySpot, haloRad, 0, Math.PI * 2);
            fCtx.fill();
            fCtx.restore();
          }
          drawCustomOrHeroProp(
            fCtx,
            beat,
            pxSpot,
            pySpot,
            s * 1.25 * zoom,
            animT,
            u,
            spotPhys.rotationRad,
            localT,
            effectiveCadenceFps
          );
        }
        fCtx.restore();

        if (showDepthForeground) {
          fCtx.save();
          applyParallaxCamera(fCtx, w, h, cam, 1.38);
          drawStageForegroundDepthLayer(fCtx, w, h, beat.stage, pal, animT);
          fCtx.restore();
          if (fgFramingIntensity > 0.01) {
            drawForegroundParallaxLayer(
              fCtx,
              w,
              h,
              beat.stage,
              beat.mood,
              cam.panX,
              cam.zoom,
              animT,
              fgFramingIntensity
            );
          }
        }
      },
    });
  } else if (beat.shot === 'motion_card') {
    // Declarative Kinetic Motion-Graphics Shot (`@0xnicc0`-inspired morphing bar, hero stat & staggered typography)
    const rawCardCam = applyActionCameraPunch(
      computeCameraTransform(w, h, 1.0, beat.cameraMove, u, animT, sfxChoreo, motionProfile, activeRenderStyle)
    );
    const cam = hasCameraKeyframes
      ? composeCameraWithKeyframes(rawCardCam, beat.cameraKeyframes, u, w, h)
      : rawCardCam;
    const mc: MotionCardConfig = beat.motionCard || {};
    const layout = mc.layout || 'hero_stat';
    const accent = mc.accentColor || pal.accent;
    const kicker = safeUppercase(mc.kicker || episode.series || 'KEY INSIGHT', lang);
    const headline = mc.headline || beat.title || episode.title;
    const metricRaw = mc.metric || '';
    const metricUnit = mc.metricUnit || '';
    const bullets = mc.bullets && mc.bullets.length > 0 ? mc.bullets : [];
    const highlightBar = mc.highlightBar || beat.dialogue;
    const profileSpec = resolveMotionProfileSpec(motionProfile, activeRenderStyle);

    // Animate numeric metrics smoothly with cubic-bezier ease-out when numeric prefix exists
    const metricDisplay = (() => {
      if (!metricRaw) return '';
      const m = metricRaw.match(/^([+-]?\d+(?:\.\d+)?)(.*)$/);
      if (!m) return metricRaw;
      const target = Number(m[1]);
      if (!Number.isFinite(target)) return metricRaw;
      const decimals = (m[1].split('.')[1] || '').length;
      const countP = cubicBezier(0.16, 1.0, 0.3, 1.0, clamp(localT / 0.95, 0, 1));
      const cur = target * countP;
      return `${cur.toFixed(decimals)}${m[2]}`;
    })();

    const drawRoundedRect = (
      g: CanvasRenderingContext2D,
      rx: number,
      ry: number,
      rw: number,
      rh: number,
      rad: number
    ) => {
      const r = Math.min(rad, rw / 2, rh / 2);
      g.beginPath();
      g.moveTo(rx + r, ry);
      g.lineTo(rx + rw - r, ry);
      g.quadraticCurveTo(rx + rw, ry, rx + rw, ry + r);
      g.lineTo(rx + rw, ry + rh - r);
      g.quadraticCurveTo(rx + rw, ry + rh, rx + rw - r, ry + rh);
      g.lineTo(rx + r, ry + rh);
      g.quadraticCurveTo(rx, ry + rh, rx, ry + rh - r);
      g.lineTo(rx, ry + r);
      g.quadraticCurveTo(rx, ry, rx + r, ry);
      g.closePath();
    };

    composeStyledScene(ctx, w, h, activeRenderStyle, beat.mood, animT, {
      drawBackdrop: (bCtx) => {
        bCtx.save();
        applyParallaxCamera(bCtx, w, h, cam, 0.55);
        const bgGrad = bCtx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, pal.skyTop);
        bgGrad.addColorStop(0.55, pal.skyMid);
        bgGrad.addColorStop(1, pal.skyLow);
        bCtx.fillStyle = bgGrad;
        bCtx.fillRect(0, 0, w, h);

        // Crisp architectural coordinate grid
        const step = Math.round(44 * s);
        bCtx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        bCtx.lineWidth = Math.max(1, 1 * s);
        for (let gx = (w % step) * 0.5; gx < w; gx += step) {
          bCtx.beginPath();
          bCtx.moveTo(gx, 0);
          bCtx.lineTo(gx, h);
          bCtx.stroke();
        }
        for (let gy = (h % step) * 0.5; gy < h; gy += step) {
          bCtx.beginPath();
          bCtx.moveTo(0, gy);
          bCtx.lineTo(w, gy);
          bCtx.stroke();
        }

        // Ambient radial focal glow anchored to accent
        const glow = bCtx.createRadialGradient(w * 0.5, h * 0.44, 18 * s, w * 0.5, h * 0.44, Math.max(w, h) * 0.55);
        glow.addColorStop(0, accent);
        glow.addColorStop(0.5, 'rgba(255, 255, 255, 0.04)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        bCtx.globalAlpha = 0.24;
        bCtx.fillStyle = glow;
        bCtx.fillRect(0, 0, w, h);
        bCtx.restore();
      },
      drawForeground: (fCtx) => {
        fCtx.save();
        applyParallaxCamera(fCtx, w, h, cam, 1.0);

        const enterP = cubicBezier(0.22, 1.0, 0.36, 1.0, clamp(localT / 0.55, 0, 1));
        const springSettle = dampedOvershoot(
          Math.max(0, localT - 0.18),
          profileSpec.overshootFreq,
          profileSpec.overshootDecay,
          profileSpec.overshootAmp * 0.08
        );
        const cardW = w * (isVert ? 0.86 : 0.78);
        const cardX = (w - cardW) * 0.5;
        const centerY = h * (isVert ? 0.42 : 0.45);

        // Animated Kicker Tag
        fCtx.save();
        const kickerY = centerY - (isVert ? 155 : 132) * s + (1 - enterP) * 18 * s;
        fCtx.globalAlpha = enterP;
        fCtx.font = `700 ${Math.round(14 * s)}px ${lang.fontFamily}`;
        fCtx.textAlign = 'center';
        fCtx.textBaseline = 'middle';
        const kickerMetrics = fCtx.measureText(kicker);
        const pillW = Math.min(cardW, kickerMetrics.width + 32 * s);
        const pillH = 30 * s;
        fCtx.fillStyle = 'rgba(8, 12, 26, 0.78)';
        drawRoundedRect(fCtx, w * 0.5 - pillW * 0.5, kickerY - pillH * 0.5, pillW, pillH, 6 * s);
        fCtx.fill();
        fCtx.strokeStyle = accent;
        fCtx.lineWidth = 1.6 * s;
        fCtx.stroke();
        fCtx.fillStyle = accent;
        fCtx.fillText(kicker, w * 0.5, kickerY + 0.5 * s);
        fCtx.restore();

        if (layout === 'morph_bar') {
          // Morphing kinetic prompt / highlight bar with spring width expansion
          const barExpand = cubicBezier(0.16, 1.0, 0.3, 1.0, clamp((localT - 0.1) / 0.65, 0, 1));
          const barW = lerp(120 * s, cardW * 0.92, barExpand) * (1 + springSettle * 0.35);
          const barH = (isVert ? 92 : 76) * s;
          const barX = w * 0.5 - barW * 0.5;
          const barY = centerY - barH * 0.5;

          // Headline above bar
          fCtx.save();
          const headP = cubicBezier(0.22, 1.0, 0.36, 1.0, clamp((localT - 0.06) / 0.5, 0, 1));
          fCtx.globalAlpha = headP;
          fCtx.font = `800 ${Math.round((isVert ? 34 : 42) * s)}px ${lang.displayFontFamily}`;
          fCtx.fillStyle = '#ffffff';
          fCtx.textAlign = 'center';
          fCtx.textBaseline = 'middle';
          fCtx.fillText(headline, w * 0.5, barY - 46 * s + (1 - headP) * 20 * s, cardW);
          fCtx.restore();

          // Luminous Morphing Capsule Bar
          fCtx.save();
          fCtx.shadowColor = accent;
          fCtx.shadowBlur = 22 * s;
          fCtx.fillStyle = 'rgba(10, 15, 32, 0.9)';
          drawRoundedRect(fCtx, barX, barY, barW, barH, barH * 0.45);
          fCtx.fill();
          fCtx.strokeStyle = accent;
          fCtx.lineWidth = 2.6 * s;
          fCtx.stroke();

          // Typing/sweeping kinetic text inside morph bar
          const textP = clamp((localT - 0.32) / 0.85, 0, 1);
          const shownChars = Math.max(1, Math.round(highlightBar.length * textP));
          const snippet = highlightBar.slice(0, shownChars);
          fCtx.shadowBlur = 0;
          fCtx.font = `600 ${Math.round((isVert ? 18 : 22) * s)}px ${lang.fontFamily}`;
          fCtx.fillStyle = '#f8fafc';
          fCtx.textAlign = 'center';
          fCtx.textBaseline = 'middle';
          fCtx.fillText(snippet, w * 0.5, centerY, barW - 44 * s);
          fCtx.restore();
        } else if (layout === 'split_callout') {
          // Two-column kinetic callout: headline left/top + staggered bullet card right/bottom
          const headP = cubicBezier(0.22, 1.0, 0.36, 1.0, clamp((localT - 0.08) / 0.5, 0, 1));
          const panelH = (isVert ? 240 : 210) * s;
          const panelY = centerY - panelH * 0.5 + 16 * s;

          fCtx.save();
          fCtx.globalAlpha = headP;
          fCtx.fillStyle = 'rgba(8, 12, 26, 0.84)';
          drawRoundedRect(fCtx, cardX, panelY, cardW, panelH, 14 * s);
          fCtx.fill();
          fCtx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
          fCtx.lineWidth = 1.6 * s;
          fCtx.stroke();

          // Left accent spine
          fCtx.fillStyle = accent;
          drawRoundedRect(fCtx, cardX, panelY, 7 * s, panelH, 4 * s);
          fCtx.fill();

          // Headline
          fCtx.font = `800 ${Math.round((isVert ? 26 : 32) * s)}px ${lang.displayFontFamily}`;
          fCtx.fillStyle = '#ffffff';
          fCtx.textAlign = 'left';
          fCtx.textBaseline = 'top';
          fCtx.fillText(headline, cardX + 28 * s, panelY + 24 * s, cardW - 56 * s);

          // Staggered kinetic bullet rows
          const items = bullets.length > 0 ? bullets : [highlightBar];
          items.slice(0, 3).forEach((item, idx) => {
            const rowDelay = 0.24 + idx * 0.16;
            const rowP = cubicBezier(0.22, 1.0, 0.36, 1.0, clamp((localT - rowDelay) / 0.42, 0, 1));
            const ry = panelY + (84 + idx * 40) * s + (1 - rowP) * 14 * s;
            fCtx.save();
            fCtx.globalAlpha = rowP;
            fCtx.fillStyle = accent;
            fCtx.beginPath();
            fCtx.arc(cardX + 36 * s, ry + 10 * s, 4.5 * s, 0, Math.PI * 2);
            fCtx.fill();
            fCtx.font = `600 ${Math.round((isVert ? 16 : 19) * s)}px ${lang.fontFamily}`;
            fCtx.fillStyle = '#e2e8f0';
            fCtx.fillText(item, cardX + 52 * s, ry, cardW - 76 * s);
            fCtx.restore();
          });
          fCtx.restore();
        } else {
          // Default 'hero_stat': Dramatic oversized spring metric + kinetic staggered headline + accent wipe rule
          const statP = cubicBezier(0.16, 1.0, 0.3, 1.0, clamp((localT - 0.08) / 0.55, 0, 1));
          const statScale = (0.84 + 0.16 * statP) * (1 + springSettle * 0.4);

          if (metricDisplay) {
            fCtx.save();
            fCtx.translate(w * 0.5, centerY - 26 * s);
            fCtx.scale(statScale, statScale);
            fCtx.globalAlpha = statP;
            fCtx.shadowColor = accent;
            fCtx.shadowBlur = 24 * s;
            fCtx.font = `900 ${Math.round((isVert ? 74 : 92) * s)}px ${lang.displayFontFamily}`;
            fCtx.fillStyle = accent;
            fCtx.textAlign = 'center';
            fCtx.textBaseline = 'middle';
            fCtx.fillText(metricDisplay, 0, 0, cardW);
            if (metricUnit) {
              fCtx.shadowBlur = 0;
              fCtx.font = `700 ${Math.round((isVert ? 16 : 20) * s)}px ${lang.fontFamily}`;
              fCtx.fillStyle = '#cbd5e1';
              fCtx.fillText(metricUnit, 0, (isVert ? 48 : 56) * s, cardW);
            }
            fCtx.restore();
          }

          // Staggered kinetic headline words
          const words = headline.split(/\s+/).filter(Boolean);
          const headY = metricDisplay ? centerY + (isVert ? 78 : 82) * s : centerY - 6 * s;
          fCtx.save();
          fCtx.font = `800 ${Math.round((isVert ? 30 : 40) * s)}px ${lang.displayFontFamily}`;
          fCtx.textAlign = 'center';
          fCtx.textBaseline = 'middle';
          const wordP = cubicBezier(0.22, 1.0, 0.36, 1.0, clamp((localT - 0.22) / 0.52, 0, 1));
          fCtx.globalAlpha = wordP;
          fCtx.fillStyle = '#ffffff';
          const shownWords = Math.max(1, Math.ceil(words.length * clamp((localT - 0.16) / 0.45, 0.2, 1)));
          fCtx.fillText(words.slice(0, shownWords).join(' '), w * 0.5, headY + (1 - wordP) * 18 * s, cardW);
          fCtx.restore();

          // Morphing horizontal accent rule
          const ruleP = cubicBezier(0.22, 1.0, 0.36, 1.0, clamp((localT - 0.3) / 0.45, 0, 1));
          const ruleW = cardW * 0.42 * ruleP;
          fCtx.save();
          fCtx.fillStyle = accent;
          fCtx.fillRect(w * 0.5 - ruleW * 0.5, headY + 34 * s, ruleW, 3.5 * s);
          fCtx.restore();
        }
        fCtx.restore();
      },
    });
  }

  // Step 9: Dynamic Environmental Relighting (warm firelight flicker & aquatic caustic shimmer)
  drawDynamicSceneRelighting(ctx, w, h, lighting, beat, animT, s);

  // Volumetric Light Shafts & Stage Rim Atmosphere (zero allocations, unified across all 20 engines)
  drawVolumetricLightShafts(ctx, w, h, beat, style, animT, activeRenderStyle);

  // Subtle deterministic lamp/neon exposure warmth modulation (borrowed from Prototype M)
  const sceneFlicker = computeDeterministicFlicker(animT, activeRenderStyle, beat.mood);
  if (Math.abs(sceneFlicker - 1) > 0.008) {
    ctx.save();
    if (sceneFlicker > 1) {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(255, 224, 152, ${clamp((sceneFlicker - 1) * 1.4, 0, 0.12).toFixed(3)})`;
    } else {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = `rgba(14, 10, 24, ${clamp((1 - sceneFlicker) * 1.35, 0, 0.12).toFixed(3)})`;
    }
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Weather, Beat FX (with sub-beat actionCue override) & Step 8 SFX-Synced Micro-Choreography
  drawWeather(ctx, w, h, beat.weather, beat.mood, animT);
  drawBeatFx(ctx, w, h, actionState.fxOverride || beat.fx, u, animT);
  drawSfxVisualEffects(ctx, w, h, sfxChoreo, sfxAnchorX, sfxAnchorY, s);
  drawImpactShockOverlay(ctx, w, h, hitstop, sfxAnchorX, sfxAnchorY, pal.accent, s);

  // Episode Visual Look Finish (Rim Light, Color Grade, Contrast, Ink Weight, Texture, Vignette, Frame Border)
  drawVisualFinishOverlay(ctx, w, h, beat, style, aspect);

  // Composable Post-FX Pass (Pixel Composer Bayer 4x4 Dither, 16-Bit Pixel Grid, Crisp Edge, Chromatic Split, Halftone Zine)
  applyComposablePostFxPass(ctx, w, h, style.postFxPass, animT);

  // Full-Chapter Framing (Nested Flashback Border / Chapter Title Card / Moral Card / YouTube End Screen)
  drawFrameOverlay(ctx, w, h, episode, beat, u, aspect, lang);

  // Persistent Channel Brand Watermark (skipped on title & end-screen slates to keep slates clean)
  if (beat.frame !== 'chapter_title' && beat.frame !== 'end_screen') {
    drawBrandWatermark(ctx, w, h, loadBrandKit(), aspect, lang);
  }

  // Animated Location & Time-Jump Lower-Third Banner
  drawLocationLowerThird(ctx, w, h, beat, localT, pal.accent, isVert);

  // Captions (Styled via EpisodeVisualStyle.captionStyle + optional kinetic word-by-word karaoke + 12-Principles lower-third timing)
  if (showCaptions) {
    drawCaptions(
      ctx,
      w,
      h,
      beat,
      aspect,
      style.captionStyle,
      lang,
      localT,
      style.karaokeCaptions !== false,
      motionProfile,
      activeRenderStyle,
      speechWindow,
      episode.cast
    );
  }

  // Step 10: Style-Aware Beat Entry Graphic Transition
  drawTransitionOverlay(ctx, w, h, beat, localT, activeRenderStyle);

  ctx.restore();
}

/**
 * Editor-only Broadcast Safe-Zone & YouTube Shorts / Reels / TikTok UI Danger-Zone Overlay.
 * Never drawn during WebM recording, WebCodecs MP4 export, or headless Playwright renders.
 * Zero per-frame canvas allocations.
 */
export function drawSafeZoneOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  aspect: AspectMode
): void {
  const s = Math.min(w, h) / 1080;
  ctx.save();

  // Rule of Thirds subtle composition grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = Math.max(1, 1.5 * s);
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(w / 3, 0);
  ctx.lineTo(w / 3, h);
  ctx.moveTo((2 * w) / 3, 0);
  ctx.lineTo((2 * w) / 3, h);
  ctx.moveTo(0, h / 3);
  ctx.lineTo(w, h / 3);
  ctx.moveTo(0, (2 * h) / 3);
  ctx.lineTo(w, (2 * h) / 3);
  ctx.stroke();

  if (aspect === '9:16') {
    const topH = h * 0.11;
    const bottomY = h * 0.78;
    const rightX = w * 0.82;
    const railTop = h * 0.44;
    const leftPad = w * 0.05;

    // Platform UI Danger Zones (Shorts / Reels / TikTok)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
    // Top header / status bar
    ctx.fillRect(0, 0, w, topH);
    // Bottom channel handle / title / progress bar
    ctx.fillRect(0, bottomY, w, h - bottomY);
    // Right action column (Like / Comment / Share / Remix)
    ctx.fillRect(rightX, railTop, w - rightX, bottomY - railTop);

    // Safe framing boundary
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = Math.max(2, 2.5 * s);
    ctx.setLineDash([12 * s, 8 * s]);
    ctx.strokeRect(leftPad, topH, rightX - leftPad, bottomY - topH);
    ctx.setLineDash([]);

    // Clean zone labels
    ctx.font = `700 ${Math.round(22 * s)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(254, 202, 202, 0.92)';
    ctx.fillText('SHORTS / REELS TOP UI DANGER ZONE', w * 0.5, topH * 0.52);
    ctx.fillText('BOTTOM CHANNEL & CAPTION UI ZONE', w * 0.5, bottomY + (h - bottomY) * 0.48);

    ctx.save();
    ctx.translate(rightX + (w - rightX) * 0.5, railTop + (bottomY - railTop) * 0.5);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('LIKE / COMMENT / SHARE RAIL', 0, 0);
    ctx.restore();

    // Safe badge
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.95)';
    ctx.fillText('9:16 SAFE FRAME', leftPad + 14 * s, topH + 26 * s);
  } else {
    // 16:9 Broadcast Action Safe (5%) & Title Safe (10%)
    const ax = w * 0.05;
    const ay = h * 0.05;
    const tx = w * 0.1;
    const ty = h * 0.1;

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.72)';
    ctx.lineWidth = Math.max(2, 2 * s);
    ctx.setLineDash([12 * s, 8 * s]);
    ctx.strokeRect(ax, ay, w - ax * 2, h - ay * 2);

    ctx.strokeStyle = 'rgba(242, 200, 91, 0.78)';
    ctx.strokeRect(tx, ty, w - tx * 2, h - ty * 2);
    ctx.setLineDash([]);

    // YouTube bottom-right duration/scrub corner danger zone
    const ytX = w * 0.84;
    const ytY = h * 0.86;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
    ctx.fillRect(ytX, ytY, w * 0.14, h * 0.1);
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.75)';
    ctx.strokeRect(ytX, ytY, w * 0.14, h * 0.1);

    ctx.font = `700 ${Math.round(18 * s)}px system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.95)';
    ctx.fillText('ACTION SAFE (90%)', ax + 10 * s, ay + 8 * s);
    ctx.fillStyle = 'rgba(242, 200, 91, 0.95)';
    ctx.fillText('TITLE SAFE (80%)', tx + 10 * s, ty + 8 * s);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(254, 202, 202, 0.92)';
    ctx.fillText('YT BADGE', ytX + w * 0.07, ytY + h * 0.05);
  }

  ctx.restore();
}

