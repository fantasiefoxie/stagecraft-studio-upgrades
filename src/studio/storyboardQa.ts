import {
  AspectMode,
  EpisodeScript,
  STUDIO_FPS,
  getEpisodeDuration,
  resolveVisualStyle,
  timeToFrameIndex,
  frameIndexToTime,
} from './types';
import { evaluateEpisodeAtTime, renderEpisodeFrame } from './renderer';

export type QaSeverity = 'error' | 'warn' | 'info';

export interface QaIssue {
  beatIndex: number; // -1 for episode-level
  beatId: string;
  beatTitle: string;
  severity: QaSeverity;
  code:
    | 'caption_overflow'
    | 'pacing_fast'
    | 'pacing_slow'
    | 'motion_card_empty'
    | 'action_cue_orphan_cast'
    | 'action_cue_out_of_range'
    | 'static_shot_streak'
    | 'blank_frame'
    | 'frozen_adjacent'
    | 'contrast_extreme';
  message: string;
}

export interface BeatFramePixelSample {
  beatIndex: number;
  meanLuma: number; // 0..255
  lumaStdDev: number; // 0..128
  /** Downsampled 8x8 grayscale fingerprint for deterministic adjacent-beat delta checks */
  fingerprint64?: number[];
}

export interface BeatQaSummary {
  beatIndex: number;
  beatId: string;
  title: string;
  startSec: number;
  durationSec: number;
  wordCount: number;
  shot: string;
  status: 'pass' | 'warn' | 'fail';
  issueCount: number;
  meanLuma?: number;
  lumaStdDev?: number;
}

export interface StoryboardQaReport {
  score: number; // 0..100
  passed: boolean;
  aspect: AspectMode;
  beatCount: number;
  totalDurationSec: number;
  errorCount: number;
  warnCount: number;
  issues: QaIssue[];
  beats: BeatQaSummary[];
}

/**
 * Pure deterministic Pre-Render Visual & Pacing QA Auditor.
 * Works identically in Node CI (layout/script/cue checks) and Browser Canvas (with pixel samples
 * checking for blank/flat frames, extreme dark/blown contrast, and frozen adjacent scenes).
 */
export function analyzeEpisodeVisualQa(
  episode: EpisodeScript,
  aspect: AspectMode = '16:9',
  pixelSamples?: BeatFramePixelSample[]
): StoryboardQaReport {
  const issues: QaIssue[] = [];
  const castIds = new Set(episode.cast.map((c) => c.id));
  const sampleByBeat = new Map<number, BeatFramePixelSample>();
  if (pixelSamples) {
    for (const s of pixelSamples) sampleByBeat.set(s.beatIndex, s);
  }

  const maxChars = aspect === '9:16' ? 105 : 155;
  const maxWords = aspect === '9:16' ? 20 : 28;
  const beatSummaries: BeatQaSummary[] = [];

  let cursor = 0;
  let sameShotStreak = 1;
  let prevShot = '';

  for (let i = 0; i < episode.beats.length; i++) {
    const beat = episode.beats[i];
    const dur = Math.max(1.2, Number(beat.duration) || 4);
    const dialogue = (beat.dialogue || '').trim();
    const words = dialogue ? dialogue.split(/\s+/).filter(Boolean) : [];
    const wordCount = words.length;
    const totalBeatFrames = Math.max(1, Math.round(dur * STUDIO_FPS));

    const beatIssuesStart = issues.length;

    // 1. Caption overflow / wall-of-text guard
    if (beat.frame !== 'end_screen' && (dialogue.length > maxChars || wordCount > maxWords)) {
      issues.push({
        beatIndex: i,
        beatId: beat.id,
        beatTitle: beat.title,
        severity: 'warn',
        code: 'caption_overflow',
        message: `Caption density high (${wordCount}w / ${dialogue.length}ch for ${aspect}) — consider splitting this scene.`,
      });
    }

    // 2. Pacing & reading speed checks
    if (beat.frame === 'main' || !beat.frame) {
      if (wordCount >= 14 && dur < wordCount / 4.2) {
        issues.push({
          beatIndex: i,
          beatId: beat.id,
          beatTitle: beat.title,
          severity: 'warn',
          code: 'pacing_fast',
          message: `Duration (${dur.toFixed(1)}s) is tight for ${wordCount} words — captions may rush.`,
        });
      } else if (wordCount > 0 && wordCount <= 5 && dur > 8.5) {
        issues.push({
          beatIndex: i,
          beatId: beat.id,
          beatTitle: beat.title,
          severity: 'info',
          code: 'pacing_slow',
          message: `Long ${dur.toFixed(1)}s hold for only ${wordCount} words — check retention pacing.`,
        });
      }
    }

    // 3. Motion Card completeness check
    if (beat.shot === 'motion_card') {
      const mc = beat.motionCard;
      const hasHeadline = Boolean(mc?.headline?.trim() || beat.title?.trim());
      const hasContent = Boolean(
        mc?.metric?.trim() ||
          mc?.highlightBar?.trim() ||
          (mc?.bullets && mc.bullets.some((b) => b.trim().length > 0)) ||
          dialogue.length > 0
      );
      if (!hasHeadline || !hasContent) {
        issues.push({
          beatIndex: i,
          beatId: beat.id,
          beatTitle: beat.title,
          severity: 'error',
          code: 'motion_card_empty',
          message: `Motion Card shot has no headline/metric/bullets configured.`,
        });
      }
    }

    // 4. Action Cue integrity checks
    if (Array.isArray(beat.actionCues)) {
      beat.actionCues.forEach((cue, cIdx) => {
        if (cue.castId && !castIds.has(cue.castId)) {
          issues.push({
            beatIndex: i,
            beatId: beat.id,
            beatTitle: beat.title,
            severity: 'error',
            code: 'action_cue_orphan_cast',
            message: `Action cue #${cIdx + 1} targets unknown castId "${cue.castId}".`,
          });
        }
        if (typeof cue.frame === 'number' && cue.frame > totalBeatFrames + 2) {
          issues.push({
            beatIndex: i,
            beatId: beat.id,
            beatTitle: beat.title,
            severity: 'warn',
            code: 'action_cue_out_of_range',
            message: `Action cue #${cIdx + 1} starts at frame ${cue.frame}, past beat end (${totalBeatFrames}f).`,
          });
        }
      });
    }

    // 5. Shot monotony check (3+ identical consecutive main shots)
    if (beat.frame === 'main' || !beat.frame) {
      if (beat.shot === prevShot) {
        sameShotStreak++;
        if (sameShotStreak === 3) {
          issues.push({
            beatIndex: i,
            beatId: beat.id,
            beatTitle: beat.title,
            severity: 'info',
            code: 'static_shot_streak',
            message: `3+ consecutive "${beat.shot}" shots — vary camera framing for stronger retention.`,
          });
        }
      } else {
        sameShotStreak = 1;
        prevShot = beat.shot;
      }
    } else {
      sameShotStreak = 1;
      prevShot = '';
    }

    // 6. Optional Canvas Pixel Inspection checks (blank/flat frame, extreme contrast, frozen adjacent beat)
    const sample = sampleByBeat.get(i);
    if (sample) {
      if (sample.lumaStdDev < 4.5) {
        issues.push({
          beatIndex: i,
          beatId: beat.id,
          beatTitle: beat.title,
          severity: 'error',
          code: 'blank_frame',
          message: `Rendered keyframe appears blank or flat (luminance spread ${sample.lumaStdDev.toFixed(1)}).`,
        });
      } else if (sample.meanLuma < 14 || sample.meanLuma > 246) {
        issues.push({
          beatIndex: i,
          beatId: beat.id,
          beatTitle: beat.title,
          severity: 'warn',
          code: 'contrast_extreme',
          message:
            sample.meanLuma < 14
              ? `Frame is very dark (avg luma ${sample.meanLuma.toFixed(0)}/255) — check mood/haze.`
              : `Frame is overexposed (avg luma ${sample.meanLuma.toFixed(0)}/255).`,
        });
      }

      if (i > 0 && sample.fingerprint64 && sample.fingerprint64.length === 64) {
        const prevSample = sampleByBeat.get(i - 1);
        if (prevSample?.fingerprint64 && prevSample.fingerprint64.length === 64) {
          let diffSum = 0;
          for (let k = 0; k < 64; k++) {
            diffSum += Math.abs(sample.fingerprint64[k] - prevSample.fingerprint64[k]);
          }
          const avgDiff = diffSum / 64;
          if (avgDiff < 2.2 && beat.stage === episode.beats[i - 1].stage) {
            issues.push({
              beatIndex: i,
              beatId: beat.id,
              beatTitle: beat.title,
              severity: 'warn',
              code: 'frozen_adjacent',
              message: `Visual delta from Scene ${i} is near-zero (${avgDiff.toFixed(1)}) — consider changing shot or pose.`,
            });
          }
        }
      }
    }

    const beatIssues = issues.slice(beatIssuesStart);
    const hasErr = beatIssues.some((x) => x.severity === 'error');
    const hasWarn = beatIssues.some((x) => x.severity === 'warn');

    beatSummaries.push({
      beatIndex: i,
      beatId: beat.id,
      title: beat.title,
      startSec: cursor,
      durationSec: dur,
      wordCount,
      shot: beat.shot,
      status: hasErr ? 'fail' : hasWarn ? 'warn' : 'pass',
      issueCount: beatIssues.length,
      meanLuma: sample?.meanLuma,
      lumaStdDev: sample?.lumaStdDev,
    });

    cursor += dur;
  }

  let errorCount = 0;
  let warnCount = 0;
  let penalty = 0;
  for (const iss of issues) {
    if (iss.severity === 'error') {
      errorCount++;
      penalty += 18;
    } else if (iss.severity === 'warn') {
      warnCount++;
      penalty += 7;
    } else {
      penalty += 2;
    }
  }

  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  return {
    score,
    passed: errorCount === 0 && score >= 70,
    aspect,
    beatCount: episode.beats.length,
    totalDurationSec: getEpisodeDuration(episode),
    errorCount,
    warnCount,
    issues,
    beats: beatSummaries,
  };
}

export interface QaAutoFixResult {
  episode: EpisodeScript;
  fixedCount: number;
  fixesApplied: string[];
}

const COMPLEMENTARY_SHOTS: Array<EpisodeScript['beats'][number]['shot']> = [
  'closeup_left',
  'closeup_right',
  'two_shot',
  'low_angle_swoop',
  'wide_stage',
];

function splitDialogueDeterministically(dialogue: string): [string, string] {
  const trimmed = dialogue.trim();
  if (!trimmed) return ['', ''];
  const mid = Math.floor(trimmed.length / 2);

  // Prefer sentence boundary near the midpoint
  const punctMatches = [...trimmed.matchAll(/[.!?।۔。！？]\s+/g)];
  let bestIdx = -1;
  let bestDist = Infinity;
  for (const m of punctMatches) {
    if (typeof m.index !== 'number') continue;
    const cut = m.index + m[0].length;
    if (cut < trimmed.length * 0.28 || cut > trimmed.length * 0.72) continue;
    const dist = Math.abs(cut - mid);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = cut;
    }
  }
  if (bestIdx > 0) {
    return [trimmed.slice(0, bestIdx).trim(), trimmed.slice(bestIdx).trim()];
  }

  // Fallback: split cleanly on word midpoint
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= 2) return [trimmed, ''];
  const half = Math.ceil(words.length / 2);
  return [words.slice(0, half).join(' '), words.slice(half).join(' ')];
}

/**
 * Pure deterministic 1-Click Visual QA Auto-Fixer.
 * Safely repairs script/layout/cue defects without altering narrative intent:
 *  1. Populates empty `motion_card` shots with structured headline/metric/bullets.
 *  2. Removes orphan `castId` targets on `actionCues` and clamps out-of-range cue frames.
 *  3. Splits `caption_overflow` scenes at natural sentence/word midpoints with alternating shots.
 *  4. Expands `pacing_fast` durations to comfortable reading speed (~3.4 words/sec).
 *  5. Breaks 3+ identical consecutive `static_shot_streak` shots for visual variety.
 */
export function autoFixEpisodeVisualQa(
  episode: EpisodeScript,
  aspect: AspectMode = '16:9'
): QaAutoFixResult {
  const castIds = new Set(episode.cast.map((c) => c.id));
  const usedBeatIds = new Set(episode.beats.map((b) => b.id));
  const maxChars = aspect === '9:16' ? 105 : 155;
  const maxWords = aspect === '9:16' ? 20 : 28;
  const fixesApplied: string[] = [];

  const nextBeats: EpisodeScript['beats'] = [];

  for (let i = 0; i < episode.beats.length; i++) {
    const orig = episode.beats[i];
    let beat = {
      ...orig,
      actors: orig.actors.map((a) => ({ ...a })),
      actionCues: orig.actionCues ? orig.actionCues.map((c) => ({ ...c })) : undefined,
      expressionCues: orig.expressionCues ? orig.expressionCues.map((c) => ({ ...c })) : undefined,
      motionCard: orig.motionCard ? { ...orig.motionCard, bullets: orig.motionCard.bullets ? [...orig.motionCard.bullets] : undefined } : undefined,
    };

    const dialogue = (beat.dialogue || '').trim();
    const words = dialogue ? dialogue.split(/\s+/).filter(Boolean) : [];
    const wordCount = words.length;
    let dur = Math.max(1.2, Number(beat.duration) || 4);

    // Fix 1: Empty motion_card configuration
    if (beat.shot === 'motion_card') {
      const mc = beat.motionCard;
      const hasHeadline = Boolean(mc?.headline?.trim() || beat.title?.trim());
      const hasContent = Boolean(
        mc?.metric?.trim() ||
          mc?.highlightBar?.trim() ||
          (mc?.bullets && mc.bullets.some((b) => b.trim().length > 0)) ||
          dialogue.length > 0
      );
      if (!hasHeadline || !hasContent) {
        const headline = (mc?.headline?.trim() || beat.title?.trim() || `Scene ${i + 1}`).slice(0, 64);
        const statMatch = dialogue.match(/\b(\d+(?:[.,]\d+)?(?:\s?%|\s?[xXkKmMbB]\b)?)/);
        beat.motionCard = {
          layout: mc?.layout || (statMatch ? 'hero_stat' : 'split_callout'),
          kicker: mc?.kicker || episode.series || 'KEY INSIGHT',
          headline,
          metric: mc?.metric || (statMatch ? statMatch[1] : undefined),
          highlightBar: mc?.highlightBar || dialogue.slice(0, 88) || headline,
          bullets:
            mc?.bullets && mc.bullets.some((b) => b.trim())
              ? mc.bullets
              : [dialogue.slice(0, 72) || headline],
          accentColor: mc?.accentColor || '#f2c85b',
        };
        fixesApplied.push(`Populated empty Motion Card on Scene ${i + 1} ("${beat.title}")`);
      }
    }

    // Fix 2: Action Cue orphan castId & out-of-range frames
    if (Array.isArray(beat.actionCues) && beat.actionCues.length > 0) {
      const totalBeatFrames = Math.max(1, Math.round(dur * STUDIO_FPS));
      let cueFixed = false;
      const cleanedCues: NonNullable<EpisodeScript['beats'][number]['actionCues']> = [];

      for (const cue of beat.actionCues) {
        const nextCue = { ...cue };
        if (nextCue.castId && !castIds.has(nextCue.castId)) {
          delete nextCue.castId;
          delete nextCue.pose;
          delete nextCue.motion;
          cueFixed = true;
        }
        if (typeof nextCue.frame === 'number' && nextCue.frame > totalBeatFrames + 2) {
          nextCue.frame = Math.max(0, totalBeatFrames - 6);
          cueFixed = true;
        }
        const hasAnyAction = Boolean(
          nextCue.castId ||
            nextCue.cameraPunch ||
            nextCue.propPulse ||
            (nextCue.fx && nextCue.fx !== 'none') ||
            (nextCue.sfx && nextCue.sfx !== 'none')
        );
        if (hasAnyAction) {
          cleanedCues.push(nextCue);
        } else {
          cueFixed = true;
        }
      }

      if (cueFixed) {
        beat.actionCues = cleanedCues.length > 0 ? cleanedCues : undefined;
        fixesApplied.push(`Cleaned invalid/out-of-range Action Cues on Scene ${i + 1}`);
      }
    }

    // Fix 3: Caption overflow -> deterministic split into 2 cleanly paced beats
    if (beat.frame !== 'end_screen' && (dialogue.length > maxChars || wordCount > maxWords)) {
      const [partA, partB] = splitDialogueDeterministically(dialogue);
      if (partA && partB) {
        const totalWords = Math.max(1, wordCount);
        const wordsA = partA.split(/\s+/).filter(Boolean).length;
        const wordsB = partB.split(/\s+/).filter(Boolean).length;
        const safeTotalDur = Math.max(dur, Number((totalWords / 3.2).toFixed(1)));
        const durA = Math.max(1.8, Number(Math.max(safeTotalDur * (wordsA / totalWords), wordsA / 3.4).toFixed(1)));
        const durB = Math.max(1.8, Number(Math.max(safeTotalDur * (wordsB / totalWords), wordsB / 3.4).toFixed(1)));

        let secondId = `${beat.id}_pt2`;
        let suffix = 2;
        while (usedBeatIds.has(secondId)) {
          suffix++;
          secondId = `${beat.id}_pt${suffix}`;
        }
        usedBeatIds.add(secondId);

        const nextShot =
          beat.shot === 'two_shot'
            ? 'closeup_left'
            : beat.shot === 'closeup_left'
              ? 'closeup_right'
              : beat.shot === 'closeup_right'
                ? 'wide_stage'
                : 'two_shot';

        const beatA = {
          ...beat,
          duration: durA,
          dialogue: partA,
          sfxOffsetSec:
            typeof beat.sfxOffsetSec === 'number'
              ? Math.min(beat.sfxOffsetSec, Math.max(0, Number((durA - 0.1).toFixed(2))))
              : beat.sfxOffsetSec,
        };
        const beatB = {
          ...beat,
          id: secondId,
          title: `${beat.title} (Part 2)`,
          duration: durB,
          dialogue: partB,
          shot: nextShot as EpisodeScript['beats'][number]['shot'],
          transition: 'hard_cut' as const,
          sfx: 'none' as const,
          sfxOffsetSec: undefined,
          actionCues: undefined,
          expressionCues: undefined,
        };

        // Clamp beatA actionCues to durA
        if (beatA.actionCues) {
          const maxA = Math.max(1, Math.round(durA * STUDIO_FPS) - 4);
          beatA.actionCues = beatA.actionCues.map((c) =>
            typeof c.frame === 'number' && c.frame > maxA ? { ...c, frame: Math.max(0, maxA) } : c
          );
        }

        nextBeats.push(beatA, beatB);
        fixesApplied.push(`Split dense captions on Scene ${i + 1} ("${beat.title}") into 2 scenes`);
        continue;
      }
    }

    // Fix 4: Pacing too fast -> comfortably expand duration
    if ((beat.frame === 'main' || !beat.frame) && wordCount >= 14 && dur < wordCount / 4.2) {
      const targetDur = Number(Math.max(dur, wordCount / 3.4).toFixed(1));
      beat.duration = targetDur;
      dur = targetDur;
      fixesApplied.push(`Extended rushed duration on Scene ${i + 1} to ${targetDur.toFixed(1)}s`);
    }

    nextBeats.push(beat);
  }

  // Fix 5: Break 3+ consecutive identical main shots
  let streak = 1;
  let prevShot = '';
  for (let i = 0; i < nextBeats.length; i++) {
    const b = nextBeats[i];
    if (b.frame === 'main' || !b.frame) {
      if (b.shot === prevShot) {
        streak++;
        if (streak >= 3) {
          const alt =
            COMPLEMENTARY_SHOTS.find((s) => s !== b.shot && s !== nextBeats[i + 1]?.shot) ||
            COMPLEMENTARY_SHOTS.find((s) => s !== b.shot) ||
            'two_shot';
          b.shot = alt;
          streak = 1;
          prevShot = alt;
          fixesApplied.push(`Varied repeated shot on Scene ${i + 1} to "${alt}"`);
        }
      } else {
        streak = 1;
        prevShot = b.shot;
      }
    } else {
      streak = 1;
      prevShot = '';
    }
  }

  return {
    episode: {
      ...episode,
      beats: nextBeats,
    },
    fixedCount: fixesApplied.length,
    fixesApplied,
  };
}

function sampleCanvasLuma(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  beatIndex: number
): BeatFramePixelSample {
  const img = ctx.getImageData(0, 0, width, height).data;
  const cols = 8;
  const rows = 8;
  const fingerprint64: number[] = new Array(64).fill(0);

  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let r = 0; r < rows; r++) {
    const y0 = Math.floor((r / rows) * height);
    const y1 = Math.max(y0 + 1, Math.floor(((r + 1) / rows) * height));
    for (let c = 0; c < cols; c++) {
      const x0 = Math.floor((c / cols) * width);
      const x1 = Math.max(x0 + 1, Math.floor(((c + 1) / cols) * width));
      let cellSum = 0;
      let cellCount = 0;
      const stepY = Math.max(1, Math.floor((y1 - y0) / 4));
      const stepX = Math.max(1, Math.floor((x1 - x0) / 4));
      for (let y = y0; y < y1; y += stepY) {
        for (let x = x0; x < x1; x += stepX) {
          const idx = (y * width + x) * 4;
          const luma = 0.2126 * img[idx] + 0.7152 * img[idx + 1] + 0.0722 * img[idx + 2];
          cellSum += luma;
          cellCount++;
          sum += luma;
          sumSq += luma * luma;
          count++;
        }
      }
      fingerprint64[r * cols + c] = cellCount > 0 ? cellSum / cellCount : 0;
    }
  }

  const meanLuma = count > 0 ? sum / count : 0;
  const variance = count > 0 ? Math.max(0, sumSq / count - meanLuma * meanLuma) : 0;
  return {
    beatIndex,
    meanLuma,
    lumaStdDev: Math.sqrt(variance),
    fingerprint64,
  };
}

export interface ContactSheetRenderOptions {
  showCaptions?: boolean;
  expressionsEnabled?: boolean;
  columns?: number;
  maxBeats?: number;
}

export interface ContactSheetRenderResult {
  canvas: HTMLCanvasElement;
  dataUrl: string;
  qaReport: StoryboardQaReport;
  renderedBeats: number;
}

/**
 * Deterministic 1-Click Storyboard Contact Sheet & Visual QA Generator.
 * Reuses a single pooled tile canvas across all beats (zero per-beat canvas allocations)
 * and renders each beat at its exact integer midpoint frame via `renderEpisodeFrame`.
 */
export function renderStoryboardContactSheetCanvas(
  episode: EpisodeScript,
  aspect: AspectMode = '16:9',
  options: ContactSheetRenderOptions = {}
): ContactSheetRenderResult {
  const showCaptions = options.showCaptions ?? true;
  const expressionsEnabled = options.expressionsEnabled ?? true;
  const maxBeats = Math.max(1, Math.min(episode.beats.length, options.maxBeats ?? 48));

  const cols = options.columns ?? (aspect === '9:16' ? 5 : 4);
  const tileW = aspect === '9:16' ? 270 : 440;
  const tileH = aspect === '9:16' ? 480 : 248;
  const renderW = aspect === '9:16' ? 540 : 880;
  const renderH = aspect === '9:16' ? 960 : 496;
  const footerH = 44;
  const pad = 16;
  const headerH = 68;
  const rows = Math.ceil(maxBeats / cols);

  const sheetW = pad + cols * (tileW + pad);
  const sheetH = headerH + pad + rows * (tileH + footerH + pad);

  const sheetCanvas = document.createElement('canvas');
  sheetCanvas.width = sheetW;
  sheetCanvas.height = sheetH;
  const sctx = sheetCanvas.getContext('2d');
  if (!sctx) {
    throw new Error('2D canvas context unavailable for Contact Sheet render.');
  }

  // Single pooled offscreen canvas reused for every beat tile
  const tileCanvas = document.createElement('canvas');
  tileCanvas.width = renderW;
  tileCanvas.height = renderH;
  const tctx = tileCanvas.getContext('2d', { willReadFrequently: true });
  if (!tctx) {
    throw new Error('2D tile canvas context unavailable.');
  }

  // Sheet background
  sctx.fillStyle = '#090b14';
  sctx.fillRect(0, 0, sheetW, sheetH);

  // Compute beat starts & render every midpoint frame once, collecting pixel QA samples
  const pixelSamples: BeatFramePixelSample[] = [];
  const beatStarts: number[] = [];
  let acc = 0;
  for (let i = 0; i < episode.beats.length; i++) {
    beatStarts.push(acc);
    acc += Math.max(1.2, episode.beats[i].duration || 4);
  }

  // First pass: draw tiles & collect pixel telemetry
  for (let i = 0; i < maxBeats; i++) {
    const beat = episode.beats[i];
    const dur = Math.max(1.2, beat.duration || 4);
    const midTime = beatStarts[i] + dur * 0.52;
    const midFrame = timeToFrameIndex(midTime, STUDIO_FPS);
    const lockedTime = frameIndexToTime(midFrame, STUDIO_FPS);

    const ev = evaluateEpisodeAtTime(episode, lockedTime, null);
    renderEpisodeFrame(
      tctx,
      renderW,
      renderH,
      episode,
      ev,
      lockedTime,
      aspect,
      showCaptions,
      expressionsEnabled
    );

    pixelSamples.push(sampleCanvasLuma(tctx, renderW, renderH, i));

    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (tileW + pad);
    const y = headerH + pad + row * (tileH + footerH + pad);

    // Tile card frame
    sctx.fillStyle = '#121628';
    sctx.fillRect(x - 1, y - 1, tileW + 2, tileH + footerH + 2);
    sctx.drawImage(tileCanvas, 0, 0, renderW, renderH, x, y, tileW, tileH);

    // Tile border
    sctx.strokeStyle = 'rgba(255,255,255,0.14)';
    sctx.lineWidth = 1;
    sctx.strokeRect(x + 0.5, y + 0.5, tileW - 1, tileH + footerH - 1);
  }

  // Run full deterministic QA report using both script layout & real pixel samples
  const qaReport = analyzeEpisodeVisualQa(episode, aspect, pixelSamples);
  const style = resolveVisualStyle(episode.visualStyle);

  // Draw top sheet header bar with QA badge
  sctx.fillStyle = '#101425';
  sctx.fillRect(0, 0, sheetW, headerH);
  sctx.fillStyle = 'rgba(242, 200, 91, 0.25)';
  sctx.fillRect(0, headerH - 1, sheetW, 1);

  sctx.fillStyle = '#f2c85b';
  sctx.font = '700 20px system-ui, -apple-system, sans-serif';
  sctx.textBaseline = 'middle';
  sctx.fillText(
    `${episode.title} — Storyboard Contact Sheet (${aspect})`,
    pad,
    24
  );

  sctx.fillStyle = '#9aa3bd';
  sctx.font = '500 12px system-ui, -apple-system, sans-serif';
  sctx.fillText(
    `${episode.series} · ${episode.beats.length} scenes · ${qaReport.totalDurationSec.toFixed(1)}s · Style: ${style.renderStyle} · Profile: ${style.motionProfile || 'auto'}`,
    pad,
    47
  );

  // QA Score pill on right of header
  const badgeText = `QA ${qaReport.score}/100 · ${qaReport.passed ? 'PASS' : 'REVIEW'}`;
  sctx.font = '700 13px system-ui, -apple-system, sans-serif';
  const badgeW = sctx.measureText(badgeText).width + 26;
  const badgeX = sheetW - pad - badgeW;
  sctx.fillStyle = qaReport.passed ? 'rgba(34,197,94,0.18)' : 'rgba(245,158,11,0.22)';
  sctx.fillRect(badgeX, 18, badgeW, 30);
  sctx.strokeStyle = qaReport.passed ? '#4ade80' : '#f59e0b';
  sctx.strokeRect(badgeX + 0.5, 18.5, badgeW - 1, 29);
  sctx.fillStyle = qaReport.passed ? '#bbf7d0' : '#fde68a';
  sctx.fillText(badgeText, badgeX + 13, 34);

  // Draw per-tile footers with QA status indicators
  for (let i = 0; i < maxBeats; i++) {
    const bSummary = qaReport.beats[i];
    const beat = episode.beats[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (tileW + pad);
    const y = headerH + pad + row * (tileH + footerH + pad) + tileH;

    sctx.fillStyle = '#121628';
    sctx.fillRect(x, y, tileW, footerH);

    // Status dot
    const dotColor =
      bSummary.status === 'fail'
        ? '#ef4444'
        : bSummary.status === 'warn'
          ? '#f59e0b'
          : '#4ade80';
    sctx.fillStyle = dotColor;
    sctx.beginPath();
    sctx.arc(x + 12, y + 14, 4, 0, Math.PI * 2);
    sctx.fill();

    // Scene number & title
    sctx.fillStyle = '#eef1f8';
    sctx.font = '600 12px system-ui, -apple-system, sans-serif';
    sctx.textBaseline = 'middle';
    const titleLabel = `${String(i + 1).padStart(2, '0')}. ${beat.title}`;
    sctx.fillText(titleLabel.slice(0, 34), x + 22, y + 14);

    // Metadata row
    sctx.fillStyle = '#8e97b0';
    sctx.font = '500 10px ui-monospace, SFMono-Regular, monospace';
    const meta = `${bSummary.startSec.toFixed(1)}s · ${bSummary.durationSec.toFixed(1)}s · ${beat.shot}${
      beat.actionCues?.length ? ` · ${beat.actionCues.length} cues` : ''
    }`;
    sctx.fillText(meta.slice(0, 50), x + 10, y + 32);
  }

  return {
    canvas: sheetCanvas,
    dataUrl: sheetCanvas.toDataURL('image/png'),
    qaReport,
    renderedBeats: maxBeats,
  };
}
