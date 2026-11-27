/**
 * Stagecraft Studio — Calibrated 0-3 Visual Craft Scorecard (Upgrade 26)
 *
 * Pure deterministic rubric evaluating an EpisodeScript across 6 AAA visual-craft
 * dimensions on a calibrated 0..3 integer scale:
 *   0 = Placeholder
 *   1 = Basic
 *   2 = Studio Polished
 *   3 = Showcase
 *
 * Consumed by StoryboardQaModal.tsx AND scripts/determinism-audit.mjs JSON/Markdown reports.
 */

import { evaluateMemberUniqueness, computeDnaFingerprint } from './characterDna';
import {
  EpisodeScript,
  resolveVisualStyle,
} from './types';

export type CraftCategoryId =
  | 'art_direction'
  | 'silhouette_contrast'
  | 'world_depth'
  | 'lighting_atmosphere'
  | 'motion_impact'
  | 'caption_readability';

export type CraftBandLabel = 'Placeholder' | 'Basic' | 'Studio Polished' | 'Showcase';

export interface CraftCategoryScore {
  id: CraftCategoryId;
  label: string;
  score: 0 | 1 | 2 | 3;
  maxScore: 3;
  band: CraftBandLabel;
  rationale: string;
  suggestion: string | null;
}

export interface EpisodeVisualScorecard {
  totalScore: number; // 0 .. 18
  maxScore: 18;
  averageScore: number; // 0 .. 3
  gradeLabel: CraftBandLabel;
  categories: CraftCategoryScore[];
}

function toBand(score: 0 | 1 | 2 | 3): CraftBandLabel {
  if (score >= 3) return 'Showcase';
  if (score === 2) return 'Studio Polished';
  if (score === 1) return 'Basic';
  return 'Placeholder';
}

function clampScore(points: number): 0 | 1 | 2 | 3 {
  if (points >= 3) return 3;
  if (points >= 2) return 2;
  if (points >= 1) return 1;
  return 0;
}

/**
 * Evaluates an EpisodeScript across 6 calibrated 0-3 visual craft categories.
 * 100% deterministic pure function — zero DOM or canvas dependencies.
 */
export function scoreEpisodeVisualCraft(episode: EpisodeScript): EpisodeVisualScorecard {
  const beats = Array.isArray(episode.beats) ? episode.beats : [];
  const cast = Array.isArray(episode.cast) ? episode.cast : [];
  const style = resolveVisualStyle(episode.visualStyle);

  // 1. Art Direction & Cohesive Look
  let artPts = 0;
  if (style.renderStyle) artPts += 1;
  const hasIntentionalFinish =
    style.colorGrade !== 'default' ||
    style.texture !== 'clean' ||
    style.rimLight !== 'auto' ||
    (style.postFxPass && style.postFxPass !== 'none') ||
    style.vignette >= 0.2;
  if (hasIntentionalFinish) artPts += 1;
  const distinctMoods = new Set(beats.map((b) => b.mood)).size;
  const hasStyledFlashbackOrRichFinish =
    distinctMoods >= 2 ||
    beats.some((b) => Boolean(b.renderStyle)) ||
    (style.colorGrade !== 'default' && style.texture !== 'clean');
  if (hasStyledFlashbackOrRichFinish && beats.length >= 2) artPts += 1;
  const artScore = clampScore(artPts);

  // 2. Silhouette & Cast Contrast
  let silPts = 0;
  if (cast.length >= 1) silPts += 1;
  const distinctArchetypes = new Set(cast.map((c) => c.archetype)).size;
  const distinctPrimaries = new Set(cast.map((c) => (c.primaryColor || '').toLowerCase())).size;
  const hasCustomDna = cast.some((c) => Boolean(c.dna));
  let twinCount = 0;
  if (cast.length >= 2) {
    for (let i = 0; i < cast.length; i++) {
      const others = cast.filter((_, idx) => idx !== i).map((m) => computeDnaFingerprint(m));
      const uniq = evaluateMemberUniqueness(cast[i], others);
      if (uniq.isTwinRisk) twinCount++;
    }
  }
  if (cast.length === 1 || (distinctPrimaries >= Math.min(2, cast.length) && twinCount === 0)) {
    silPts += 1;
  }
  if ((hasCustomDna || distinctArchetypes >= 2) && twinCount === 0 && cast.length >= 2) {
    silPts += 1;
  } else if (cast.length === 1 && hasCustomDna) {
    silPts += 1;
  }
  const silScore = clampScore(silPts);

  // 3. Layered World Depth
  let depthPts = 0;
  const distinctStages = new Set(beats.map((b) => b.stage)).size;
  const hasWeatherOrCrowd = beats.some(
    (b) => (b.weather && b.weather !== 'none') || (b.crowd && b.crowd !== 'none')
  );
  const dofActive = (style.depthOfField ?? 0.35) >= 0.15;
  const shaftsActive = (style.lightShafts ?? 0.4) >= 0.15;
  const fgFramingActive = (style.foregroundFraming ?? 0.35) >= 0.15;

  if (beats.length >= 1 && (hasWeatherOrCrowd || distinctStages >= 1)) depthPts += 1;
  if ((dofActive && shaftsActive) || (distinctStages >= 2 && hasWeatherOrCrowd)) depthPts += 1;
  if (distinctStages >= 2 && hasWeatherOrCrowd && dofActive && shaftsActive && fgFramingActive) {
    depthPts += 1;
  }
  const depthScore = clampScore(depthPts);

  // 4. Lighting & Atmosphere Discipline
  let lightPts = 0;
  const hasHealthyContrast = style.shadowContrast >= 0.72 && style.shadowContrast <= 1.32;
  const hasReasonableVignette = style.vignette >= 0.12 && style.vignette <= 0.72;
  const hasLightDirection = beats.some((b) => b.lightSide === 'left' || b.lightSide === 'right');
  const hasHazeOrShafts = (style.lightShafts ?? 0.4) > 0.1 || beats.some((b) => (b.haze || 0) > 0);
  if (hasLightDirection) lightPts += 1;
  if (hasHealthyContrast && hasReasonableVignette) lightPts += 1;
  if (hasHealthyContrast && hasReasonableVignette && hasHazeOrShafts && style.rimLight !== 'none') {
    lightPts += 1;
  }
  const lightScore = clampScore(lightPts);

  // 5. Motion & Impact Polish
  let motionPts = 0;
  const hasCameraMotion = beats.some(
    (b) =>
      (b.cameraMove && b.cameraMove !== 'still') ||
      (Array.isArray(b.cameraKeyframes) && b.cameraKeyframes.length >= 2)
  );
  const distinctShots = new Set(beats.map((b) => b.shot)).size;
  const hasActingOrCues = beats.some(
    (b) =>
      (Array.isArray(b.actionCues) && b.actionCues.length > 0) ||
      (Array.isArray(b.expressionCues) && b.expressionCues.length > 0) ||
      b.actors.some((a) => (a.motion && a.motion !== 'still') || a.pose !== 'stand')
  );
  const hitstopReady = style.hitstopEnabled !== false;

  if (hasCameraMotion || distinctShots >= 2) motionPts += 1;
  if (hasCameraMotion && hasActingOrCues && distinctShots >= 2) motionPts += 1;
  if (
    hasCameraMotion &&
    hasActingOrCues &&
    distinctShots >= 3 &&
    hitstopReady &&
    beats.some((b) => (b.actionCues && b.actionCues.length > 0) || (b.cameraKeyframes && b.cameraKeyframes.length >= 2))
  ) {
    motionPts += 1;
  }
  const motionScore = clampScore(motionPts);

  // 6. Caption & Safe-Zone Readability
  let capPts = 0;
  const spokenBeats = beats.filter((b) => (b.dialogue || '').trim().length > 0);
  const overlongCount = spokenBeats.filter((b) => b.dialogue.trim().length > 145).length;
  const highDensityCount = spokenBeats.filter((b) => {
    const words = b.dialogue.trim().split(/\s+/).filter(Boolean).length;
    const dur = Math.max(1.2, b.duration || 4);
    return words / dur > 4.2;
  }).length;

  if (spokenBeats.length > 0 && overlongCount <= Math.floor(spokenBeats.length * 0.4)) capPts += 1;
  if (overlongCount === 0 && highDensityCount === 0 && spokenBeats.length > 0) capPts += 1;
  if (
    overlongCount === 0 &&
    highDensityCount === 0 &&
    style.karaokeCaptions !== false &&
    style.autoTrackSpeaker !== false &&
    spokenBeats.length > 0
  ) {
    capPts += 1;
  }
  const capScore = clampScore(capPts);

  const categories: CraftCategoryScore[] = [
    {
      id: 'art_direction',
      label: 'Art Direction & Cohesive Look',
      score: artScore,
      maxScore: 3,
      band: toBand(artScore),
      rationale: `${style.renderStyle} engine, ${distinctMoods} mood(s), grade=${style.colorGrade}, texture=${style.texture}.`,
      suggestion:
        artScore < 2
          ? 'Apply a cohesive Color Grade, Surface Texture, or Look Preset in the Look tab to elevate visual identity.'
          : null,
    },
    {
      id: 'silhouette_contrast',
      label: 'Silhouette & Cast Contrast',
      score: silScore,
      maxScore: 3,
      band: toBand(silScore),
      rationale: `${cast.length} cast member(s), ${distinctArchetypes} archetype(s), ${twinCount} twin risk(s)${hasCustomDna ? ', custom DNA active' : ''}.`,
      suggestion:
        silScore < 2
          ? 'Diversify cast primary colors or sculpt distinct silhouettes in the Entity DNA Workshop (avoid twin silhouettes).'
          : null,
    },
    {
      id: 'world_depth',
      label: 'Layered World Depth',
      score: depthScore,
      maxScore: 3,
      band: toBand(depthScore),
      rationale: `${distinctStages} stage(s), DoF=${Math.round((style.depthOfField ?? 0.35) * 100)}%, LightShafts=${Math.round((style.lightShafts ?? 0.4) * 100)}%, FG Framing=${Math.round((style.foregroundFraming ?? 0.35) * 100)}%.`,
      suggestion:
        depthScore < 2
          ? 'Enable 2.5D Depth of Field, Volumetric Light Shafts, Foreground Framing, and add weather/crowd layers for multi-plane depth.'
          : null,
    },
    {
      id: 'lighting_atmosphere',
      label: 'Lighting & Atmosphere Discipline',
      score: lightScore,
      maxScore: 3,
      band: toBand(lightScore),
      rationale: `Contrast=${style.shadowContrast.toFixed(2)}x, Vignette=${Math.round(style.vignette * 100)}%, Rim=${style.rimLight}.`,
      suggestion:
        lightScore < 2
          ? 'Keep Shadow Contrast within 0.72x–1.32x, Vignette within 12%–72%, and enable Rim Light + Volumetric Shafts for clean figure separation.'
          : null,
    },
    {
      id: 'motion_impact',
      label: 'Motion & Impact Polish',
      score: motionScore,
      maxScore: 3,
      band: toBand(motionScore),
      rationale: `${distinctShots} shot type(s), camera motion=${hasCameraMotion ? 'active' : 'static'}, Hit Stop=${hitstopReady ? 'on' : 'off'}.`,
      suggestion:
        motionScore < 2
          ? 'Vary shot framing across beats, add slow zoom/pan or Camera Keyframes, and trigger Acting Macros / Action Cues.'
          : null,
    },
    {
      id: 'caption_readability',
      label: 'Caption & Safe-Zone Readability',
      score: capScore,
      maxScore: 3,
      band: toBand(capScore),
      rationale: `${spokenBeats.length} spoken scene(s), ${overlongCount} overlong (>145 chars), ${highDensityCount} fast-pacing.`,
      suggestion:
        capScore < 2
          ? 'Trim dialogues under 145 characters (<4.2 words/sec) and enable Kinetic Karaoke + 9:16 Auto-Track Speaker.'
          : null,
    },
  ];

  const totalScore = categories.reduce((sum, c) => sum + c.score, 0);
  const averageScore = Number((totalScore / categories.length).toFixed(2));
  const gradeLabel: CraftBandLabel =
    averageScore >= 2.5
      ? 'Showcase'
      : averageScore >= 1.75
        ? 'Studio Polished'
        : averageScore >= 0.9
          ? 'Basic'
          : 'Placeholder';

  return {
    totalScore,
    maxScore: 18,
    averageScore,
    gradeLabel,
    categories,
  };
}

/**
 * Formats an EpisodeVisualScorecard as a concise Markdown table for CLI audit reports.
 */
export function formatVisualScorecardMarkdown(scorecard: EpisodeVisualScorecard): string {
  const lines = [
    `## Visual Craft Scorecard — ${scorecard.totalScore}/${scorecard.maxScore} (Avg ${scorecard.averageScore.toFixed(2)}/3 · ${scorecard.gradeLabel})`,
    '',
    '| Craft Dimension | Score | Band | Notes |',
    '| --- | :---: | :---: | --- |',
  ];
  for (const c of scorecard.categories) {
    lines.push(`| ${c.label} | **${c.score}/3** | ${c.band} | ${c.rationale} |`);
  }
  const suggestions = scorecard.categories.filter((c) => c.suggestion);
  if (suggestions.length > 0) {
    lines.push('', '### Recommended Polish');
    for (const c of suggestions) {
      lines.push(`- **${c.label} (${c.score}/3)**: ${c.suggestion}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}
