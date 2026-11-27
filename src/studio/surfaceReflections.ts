/**
 * Stagecraft Studio — Directional 2D Ground Shadows & Wet-Surface / Water Reflections (Upgrade 24)
 *
 * Pure deterministic classifier and zero-allocation Canvas 2D shadow + surface reflection pass
 * covering all 50 StageId environments across all 20 RenderStyleId engines.
 */

import type { MoodPalette } from './renderAssets';
import type { StageId, StoryBeat, WeatherId } from './types';

export type SurfaceReflectionKind = 'water' | 'wet_street' | 'polished_marble' | 'none';

export interface StageReflectionProfile {
  kind: SurfaceReflectionKind;
  horizonYFrac: number; // 0.68 .. 0.86
  opacity: number; // 0 .. 0.45
  rippleAmp: number; // px multiplier for horizontal ripple bands
  skewDir: number; // -1 or +1 default bias
}

export interface ReflectedActorSnapshot {
  x: number;
  y: number;
  scale: number;
  primaryColor: string;
  accentColor: string;
  isAirborne?: boolean;
}

const WATER_STAGES = new Set<StageId>([
  'river_ghat',
  'enchanted_lake',
  'ocean_ship',
  'pirate_galleon_deck',
  'underwater_atlantis',
  'tropical_archipelago',
  'nordic_fjord_hall',
  'courtyard_well',
]);

const WET_STREET_STAGES = new Set<StageId>([
  'neon_cyber_alley',
  'noir_rainy_street',
  'bazaar_lane',
]);

const POLISHED_MARBLE_STAGES = new Set<StageId>([
  'royal_durbar',
  'mughal_courtyard',
  'moonlit_terrace',
  'royal_bedchamber',
  'golden_lanka',
  'gothic_cathedral',
  'orbital_starship_bridge',
  'high_tech_lab',
  'modern_news_studio',
  'courtroom_hall',
  'ancient_egypt_temple',
  'astral_observatory',
  'bamboo_pagoda',
  'olympus_acropolis',
  'kali_temple',
  'steampunk_clocktower',
]);

const INDOOR_NO_RAIN_STAGES = new Set<StageId>([
  'royal_durbar',
  'kali_temple',
  'royal_bedchamber',
  'royal_dungeon',
  'cave_den',
  'orbital_starship_bridge',
  'mars_colony_dome',
  'modern_news_studio',
  'cozy_bookshop_cafe',
  'high_tech_lab',
  'courtroom_hall',
  'gothic_cathedral',
  'vintage_train_car',
  'astral_observatory',
]);

/**
 * Classifies every StageId + WeatherId into a deterministic ground reflection profile.
 */
export function getStageReflectionProfile(
  stage: StageId,
  weather: WeatherId = 'none'
): StageReflectionProfile {
  if (WATER_STAGES.has(stage)) {
    return {
      kind: 'water',
      horizonYFrac: stage === 'underwater_atlantis' ? 0.72 : 0.78,
      opacity: stage === 'underwater_atlantis' ? 0.32 : 0.36,
      rippleAmp: 6.5,
      skewDir: 1,
    };
  }

  if (WET_STREET_STAGES.has(stage)) {
    return {
      kind: 'wet_street',
      horizonYFrac: 0.76,
      opacity: 0.34,
      rippleAmp: 4.0,
      skewDir: 1,
    };
  }

  // Outdoor stages during rain or lightning storm turn reflective!
  if ((weather === 'rain' || weather === 'lightning_storm') && !INDOOR_NO_RAIN_STAGES.has(stage)) {
    return {
      kind: 'wet_street',
      horizonYFrac: 0.77,
      opacity: 0.28,
      rippleAmp: 4.5,
      skewDir: 1,
    };
  }

  if (POLISHED_MARBLE_STAGES.has(stage)) {
    return {
      kind: 'polished_marble',
      horizonYFrac: 0.77,
      opacity: 0.22,
      rippleAmp: 1.2,
      skewDir: 1,
    };
  }

  return {
    kind: 'none',
    horizonYFrac: 0.78,
    opacity: 0,
    rippleAmp: 0,
    skewDir: 1,
  };
}

/**
 * Zero-allocation Canvas 2D directional cast ground shadows + horizontal ripple reflection bands
 * aligned to `beat.lightSide` directly beneath stage actors.
 */
export function drawGroundedShadowAndReflection(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  beat: StoryBeat,
  actors: ReflectedActorSnapshot[],
  animT: number,
  pal: MoodPalette
): void {
  if (!actors || actors.length === 0) return;

  const s = Math.min(w, h) / 620;
  const profile = getStageReflectionProfile(beat.stage, beat.weather);
  // Light on right casts shadow to left (-1), light on left casts shadow to right (+1)
  const shadowDir = beat.lightSide === 'left' ? 1 : -1;

  ctx.save();

  // 1. Directional cast ground shadow ellipses per actor
  for (let i = 0; i < actors.length; i++) {
    const a = actors[i];
    if (a.isAirborne) continue;
    const castOffsetX = shadowDir * 28 * a.scale;
    const rx = 56 * a.scale;
    const ry = 13 * a.scale;

    ctx.save();
    ctx.translate(a.x + castOffsetX, a.y + 6 * s);
    ctx.scale(1, ry / Math.max(1, rx));
    const grad = ctx.createRadialGradient(0, 0, rx * 0.12, 0, 0, rx);
    grad.addColorStop(0, 'rgba(6, 8, 16, 0.44)');
    grad.addColorStop(0.55, 'rgba(6, 8, 16, 0.22)');
    grad.addColorStop(1, 'rgba(6, 8, 16, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. Wet-surface / water / polished-marble reflections beneath grounded actors
  if (profile.kind !== 'none' && profile.opacity > 0.01) {
    const bandCount = profile.kind === 'water' ? 9 : profile.kind === 'wet_street' ? 7 : 5;
    for (let i = 0; i < actors.length; i++) {
      const a = actors[i];
      if (a.isAirborne) continue;
      const baseH = 92 * a.scale;
      const baseW = 44 * a.scale;

      for (let b = 0; b < bandCount; b++) {
        const frac = (b + 0.5) / bandCount;
        const by = a.y + 8 * s + frac * baseH;
        if (by > h + 20) break;

        const ripple =
          profile.rippleAmp > 0
            ? Math.sin(animT * (profile.kind === 'water' ? 3.2 : 2.1) + b * 1.15 + i * 1.7) *
              profile.rippleAmp *
              s *
              (0.45 + frac * 0.8)
            : 0;
        const bandW = baseW * (1 - frac * 0.48) * (0.9 + Math.cos(animT * 2.4 + b * 1.9) * 0.1);
        const bandH = Math.max(2 * s, (baseH / bandCount) * (profile.kind === 'polished_marble' ? 0.92 : 0.62));
        const alpha = profile.opacity * (1 - frac * 0.85);

        ctx.fillStyle = b % 3 === 1 ? a.accentColor || pal.accent : a.primaryColor || pal.rimLight;
        ctx.globalAlpha = Math.max(0.02, alpha);
        ctx.beginPath();
        ctx.ellipse(
          a.x + ripple + shadowDir * frac * 6 * s,
          by,
          Math.max(4, bandW),
          Math.max(1.5, bandH * 0.55),
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Subtle rim shimmer line on water/wet surfaces
      if (profile.kind === 'water' || profile.kind === 'wet_street') {
        ctx.strokeStyle = pal.rimLight;
        ctx.globalAlpha = profile.opacity * 0.55;
        ctx.lineWidth = 1.4 * s;
        for (let r = 0; r < 3; r++) {
          const ry = a.y + (16 + r * 22) * a.scale;
          const rw = (36 - r * 8) * a.scale;
          const rxOff = Math.sin(animT * 2.8 + r * 2.1 + i) * 7 * s;
          ctx.beginPath();
          ctx.moveTo(a.x - rw + rxOff, ry);
          ctx.lineTo(a.x + rw + rxOff, ry);
          ctx.stroke();
        }
      }
    }
  }

  ctx.restore();
}
