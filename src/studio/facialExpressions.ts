/**
 * Katha Studio — Unified FACS Facial Expression Engine
 * Single source of truth for eyes, eyebrows, cheek warmth, and mouths across all 40 archetypes.
 * Eliminates the default angry V-brow slant so every expression (calm, warm, joy, curious, awe,
 * sly, shocked, grief, stern, angry) reads clearly and distinctly at both closeup and full-body scales.
 */
import { ExpressionId, StoryBeat, resolveActorExpressionAtTime } from './types';

/**
 * Viseme codes (backward-compatible 0..5):
 * 0 = Rest / Closed (emotion shape)
 * 1 = M / B / P (pressed bilabial lips)
 * 2 = E / I (wide stretched vowel + upper teeth)
 * 3 = A / AA (tall open jaw + tongue)
 * 4 = O / U (rounded pursed oval lips)
 * 5 = F / V / S / TH (narrow dental-lip / sibilant)
 */
export function getVisemeAperture(viseme: number): number {
  const v = Math.max(0, Math.min(5, Math.round(viseme)));
  return [0, 0.7, 1.8, 3.0, 2.2, 1.1][v] ?? 0;
}

/**
 * Maps beat dialogue + normalized beat progress `u` (0..1) + live speech energy (0..1)
 * to one of 6 anatomical lip-sync viseme shapes (0..5), supporting Latin, Devanagari/Indic,
 * Arabic, and CJK scripts with punctuation-weighted syllable cadence.
 */
export function resolvePhonemeViseme(
  dialogue: string,
  u: number,
  speechEnergy: number
): number {
  if (speechEnergy < 0.13) return 0;
  const cleanText = String(dialogue || '').trim();
  if (!cleanText) {
    if (speechEnergy >= 0.72) return 3;
    if (speechEnergy >= 0.48) return 4;
    if (speechEnergy >= 0.28) return 2;
    return 1;
  }

  // Punctuation-weighted character position so pauses align with commas/dashes/periods
  const weights: number[] = new Array(cleanText.length);
  let totalWeight = 0;
  for (let i = 0; i < cleanText.length; i++) {
    const c = cleanText[i];
    const w = /[—–]/.test(c)
      ? 4.8
      : /[.!?।。！？؟]/.test(c)
        ? 4.4
        : /[,;:、،؛]/.test(c)
          ? 2.6
          : /\s/.test(c)
            ? 0.65
            : 1.0;
    totalWeight += w;
    weights[i] = totalWeight;
  }
  const targetWeight = Math.max(0, Math.min(1, u)) * Math.max(1, totalWeight);
  let chIdx = 0;
  while (chIdx < cleanText.length - 1 && weights[chIdx] < targetWeight) {
    chIdx++;
  }

  const ch = cleanText[chIdx].toLowerCase();
  const nextCh = cleanText[chIdx + 1]?.toLowerCase() || '';
  const pair = ch + nextCh;

  // Silence on pauses & whitespace
  if (/[\s,.;:!?—–।。！？؟،؛]/.test(ch)) {
    return speechEnergy >= 0.7 ? 1 : 0;
  }

  // Digraphs first (English & transliterated Indic)
  if (pair === 'oo' || pair === 'ou' || pair === 'ow') return 4; // Rounded O/U
  if (pair === 'ee' || pair === 'ea' || pair === 'ie') return 2; // Wide E/I
  if (pair === 'aa' || pair === 'ah') return 3; // Wide open A
  if (pair === 'th' || pair === 'sh' || pair === 'ch') return 5; // Dental/sibilant

  // Bilabial M / B / P (Latin + Devanagari प फ ब भ म + Arabic ب م)
  if ('mbpपफबभमبم'.includes(ch)) {
    return speechEnergy >= 0.62 ? 1 : 0;
  }
  // Dental / Fricative / Sibilant F / V / S / Z (Latin + Devanagari व स श ष फ + Arabic ف س ش ز)
  if ('fvszθðवसशषفسشز'.includes(ch)) {
    return 5;
  }
  // Rounded O / U / W (Latin + Devanagari ओ औ उ ऊ ो ौ ु ू + Arabic و)
  if ('ouōūöüwओऔउऊोौुूو'.includes(ch)) {
    return speechEnergy >= 0.2 ? 4 : 1;
  }
  // Wide stretched E / I / Y (Latin + Devanagari इ ई ए ऐ ि ी े ै + Arabic ي)
  if ('eiyēīéèíìइईएऐिीेैي'.includes(ch)) {
    return speechEnergy >= 0.2 ? 2 : 1;
  }
  // Open A (Latin + Devanagari अ आ ा + Arabic ا)
  if ('aāáàäअआाا'.includes(ch)) {
    return speechEnergy >= 0.34 ? 3 : 2;
  }

  // Fallback for consonants / CJK ideographs modulated smoothly by live audio energy
  if (speechEnergy >= 0.72) return 3;
  if (speechEnergy >= 0.45) return 2;
  if (speechEnergy >= 0.26) return 4;
  return 1;
}

const EXPRESSION_TTS_CUES: Record<
  ExpressionId,
  { cue: string; speedMult: number }
> = {
  calm: { cue: 'serene, poised, unhurried storytelling cadence', speedMult: 0.98 },
  warm: { cue: 'warm, affectionate, gentle smiling tone', speedMult: 0.97 },
  joy: { cue: 'bright, upbeat, joyful and animated delivery', speedMult: 1.04 },
  curious: { cue: 'inquisitive, intrigued, slightly lifted questioning inflection', speedMult: 1.0 },
  awe: { cue: 'hushed, breathy wonder and reverent amazement', speedMult: 0.92 },
  sly: { cue: 'playful, clever, mischievous sly undertone with knowing grin', speedMult: 1.01 },
  shocked: { cue: 'urgent, breathless, startled gasp and heightened alarm', speedMult: 1.07 },
  grief: { cue: 'soft, heavy, sorrowful, tender emotional ache', speedMult: 0.9 },
  stern: { cue: 'grave, commanding, authoritative firm tone', speedMult: 0.96 },
  angry: { cue: 'fierce, intense, forceful dramatic projection', speedMult: 1.05 },
};

/**
 * Derives expression-aware TTS delivery instructions and subtle speaking-rate modulation
 * from the active beat's speaking character, FACS expression cues, mood, and punctuation.
 */
export function buildExpressiveTtsProsody(
  beat: Pick<
    StoryBeat,
    'speakerId' | 'actors' | 'expressionCues' | 'dialogue' | 'duration' | 'mood' | 'fx'
  >,
  baseStyle: string,
  baseSpeed = 1.0
): { style: string; speed: number; expression: ExpressionId; summary: string } {
  const speakingActor =
    beat.actors.find((a) => a.castId === beat.speakerId) ||
    (beat.speakerId === 'narrator' ? beat.actors[0] : undefined);

  let expression: ExpressionId = speakingActor
    ? resolveActorExpressionAtTime(
        speakingActor,
        beat,
        Math.max(0.1, (beat.duration || 4) * 0.25),
        true
      )
    : 'calm';

  // If narrator has no direct actor placement, infer subtle tone from mood/fx/punctuation
  const dlg = (beat.dialogue || '').trim();
  if (!speakingActor || beat.speakerId === 'narrator') {
    if (beat.fx === 'shock_burst' || beat.fx === 'crimson_impact') expression = 'shocked';
    else if (beat.mood === 'crimson_wrath') expression = 'angry';
    else if (beat.fx === 'divine_aura') expression = 'awe';
    else if (beat.fx === 'question_mark' || dlg.endsWith('?')) expression = 'curious';
    else if (dlg.endsWith('!')) expression = 'joy';
  }

  const spec = EXPRESSION_TTS_CUES[expression] || EXPRESSION_TTS_CUES.calm;
  const extras: string[] = [spec.cue];
  if (dlg.includes('...') || dlg.includes('…')) {
    extras.push('with dramatic suspenseful pauses');
  } else if (dlg.endsWith('!')) {
    extras.push('with crisp vocal emphasis');
  } else if (dlg.endsWith('?')) {
    extras.push('ending with a clear curious lift');
  }

  const trimmedBase = (baseStyle || '').trim();
  const combinedStyle = `${trimmedBase ? `${trimmedBase}; ` : ''}${extras.join(', ')}`.slice(0, 180);
  const tunedSpeed = Math.max(
    0.75,
    Math.min(1.35, Number((baseSpeed * spec.speedMult).toFixed(2)))
  );

  return {
    style: combinedStyle,
    speed: tunedSpeed,
    expression,
    summary: `${expression} (${tunedSpeed.toFixed(2)}×)`,
  };
}

export interface EyePairOptions {
  glowing?: boolean;
  roundOwl?: boolean;
  eyeX?: number;
  eyeY?: number;
  noBrows?: boolean;
  castSeed?: number;
  eyeScale?: number;
}

export interface MouthOptions {
  y?: number;
  scale?: number;
  fanged?: boolean;
}

/** Expressive subtle head tilt per emotion (radians). */
export function getExpressionHeadTilt(expression: ExpressionId): number {
  switch (expression) {
    case 'curious':
      return 0.055;
    case 'warm':
      return 0.025;
    case 'joy':
      return -0.02;
    case 'awe':
      return -0.03;
    case 'sly':
      return -0.045;
    case 'grief':
      return 0.065;
    case 'stern':
      return -0.015;
    case 'angry':
      return -0.035;
    default:
      return 0;
  }
}

/**
 * Draws anatomically readable eyebrows & eyes for all 10 ExpressionIds.
 * Key fix: `calm`, `warm`, `joy`, `curious`, `awe`, `grief`, `shocked`, `sly`, and `stern`
 * NEVER use a downward-inner V-scowl; ONLY `angry` furrows the inner brow below the outer brow.
 */
export function drawUnifiedEyePair(
  ctx: CanvasRenderingContext2D,
  expression: ExpressionId,
  accent: string,
  t: number,
  speechEnergy: number,
  options: EyePairOptions = {}
): void {
  const seed = options.castSeed ?? 11;
  const eyeX = options.eyeX ?? 28;
  const eyeY = options.eyeY ?? -8;
  const sc = options.eyeScale ?? 1;

  // Natural staggered blink + occasional double blink
  const blinkCycle = (t + (seed % 37) * 0.19) % 3.85;
  const isDoubleBlink = seed % 3 === 0 && blinkCycle > 0.22 && blinkCycle < 0.34;
  const blink =
    expression === 'shocked' || expression === 'awe'
      ? 1
      : blinkCycle < 0.13 || isDoubleBlink
        ? 0.08
        : 1;

  // Organic saccadic micro-gaze
  const gazeBucket = Math.floor((t + (seed % 17) * 0.31) / 1.85);
  const autoGaze =
    (gazeBucket * 13 + seed) % 5 === 0 ? -2.2 : (gazeBucket * 7 + seed) % 4 === 0 ? 2.2 : 0;
  const gazeX =
    expression === 'sly'
      ? 3.8
      : expression === 'curious'
        ? 2.6
        : expression === 'angry' || expression === 'stern'
          ? 0
          : autoGaze;
  const gazeY =
    expression === 'grief'
      ? 2.2
      : expression === 'awe'
        ? -1.6
        : expression === 'shocked'
          ? -0.8
          : 0;

  // Subtle rosy cheek warmth on joyful / warm / awe expressions
  if (expression === 'joy' || expression === 'warm') {
    ctx.save();
    ctx.fillStyle = expression === 'joy' ? 'rgba(242, 108, 114, 0.24)' : 'rgba(242, 128, 122, 0.16)';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * (eyeX + 8), eyeY + 20 * sc, 13 * sc, 7 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * eyeX, eyeY);
    ctx.scale(sc, sc * blink);

    if (options.roundOwl) {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(0, 0, 21, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#070914';
      const pupilR = expression === 'shocked' ? 6.5 : expression === 'awe' ? 12 : 9.5;
      ctx.beginPath();
      ctx.arc(gazeX * 0.4, gazeY * 0.4, pupilR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4 + gazeX * 0.3, -4, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (options.glowing) {
      // Glowing supernatural/predator eyes now honor expression instead of always snarling!
      if (expression === 'joy') {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 5.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 5, 12, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      } else if (expression === 'angry') {
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.moveTo(-18 * side, 2);
        ctx.lineTo(18 * side, -11);
        ctx.lineTo(12 * side, 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(side * 2 - 3, -4, 6, 6);
      } else {
        const ry = expression === 'shocked' || expression === 'awe' ? 11.5 : expression === 'sly' ? 6.5 : 9;
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(gazeX * 0.5, gazeY * 0.5, expression === 'shocked' ? 3.5 : 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (expression === 'shocked') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 12.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#070914';
      ctx.beginPath();
      ctx.arc(gazeX * 0.5, gazeY * 0.5, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(gazeX * 0.5 - 1.5, gazeY * 0.5 - 1.5, 1.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (expression === 'awe') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 13.5, 11.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#070914';
      ctx.beginPath();
      ctx.arc(gazeX * 0.4, gazeY * 0.4, 7.2, 0, Math.PI * 2);
      ctx.fill();
      // Twin luminous star catchlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-2.5 + gazeX * 0.3, -2.8, 2.5, 0, Math.PI * 2);
      ctx.arc(3 + gazeX * 0.3, 2, 1.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (expression === 'joy') {
      ctx.strokeStyle = '#070914';
      ctx.lineWidth = 4.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 5, 11, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else if (expression === 'warm') {
      // Bright kind almond eyes with gentle smiling lower lid
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 13, 8.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#070914';
      ctx.beginPath();
      ctx.arc(gazeX * 0.6, gazeY * 0.4, 5.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-2 + gazeX * 0.5, -2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (expression === 'sly') {
      // Relaxed half-lidded mischievous eyes (upper lid slightly lowered, NOT angry)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 1, 13, 6.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#070914';
      ctx.beginPath();
      ctx.arc(gazeX, 1, 4.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1.5 + gazeX, -1.5, 2, 2);
    } else if (expression === 'grief') {
      // Soft downcast sorrowful eyes with tiny tear sheen
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 1, 12.5, 8, side * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#070914';
      ctx.beginPath();
      ctx.arc(gazeX * 0.4, 2.2, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c8ecff';
      ctx.beginPath();
      ctx.arc(side * 4, 6.5, 2.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (expression === 'angry') {
      // Narrowed fierce focused eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-13, -3 + (side === -1 ? -2 : 2));
      ctx.lineTo(13, -3 + (side === 1 ? -2 : 2));
      ctx.lineTo(12, 5);
      ctx.lineTo(-12, 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#070914';
      ctx.beginPath();
      ctx.arc(0, 1, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1.5, -1, 2, 2);
    } else {
      // calm / curious / stern: crisp open almond eyes with catchlight
      const ry = expression === 'curious' ? 9.2 : expression === 'stern' ? 7.2 : 8.5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 13, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#070914';
      ctx.beginPath();
      ctx.arc(gazeX * 0.7, gazeY * 0.5, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-1.8 + gazeX * 0.7, -2 + gazeY * 0.4, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ---- ANATOMICALLY ACCURATE CURVED EYEBROWS (ZERO DEFAULT ANGER!) ----
    if (!options.noBrows) {
      const speechLift = speechEnergy > 0.35 ? -3.2 * speechEnergy : 0;
      const innerX = side * Math.max(8, eyeX - 18) * sc;
      const midX = side * (eyeX + 1) * sc;
      const outerX = side * (eyeX + 18) * sc;

      // Base brow Y sits gracefully above the eye; innerY, midY, outerY define exact emotion!
      let innerY = eyeY - 17 * sc;
      let midY = eyeY - 21 * sc;
      let outerY = eyeY - 16 * sc;
      let thickness = 4.6 * sc;

      if (expression === 'calm') {
        // Soft serene gentle arch (inner & outer level, gentle middle lift)
        innerY = eyeY - 17 * sc;
        midY = eyeY - 21 * sc;
        outerY = eyeY - 16.5 * sc;
        thickness = 4.2 * sc;
      } else if (expression === 'warm') {
        // Warm friendly raised gentle arch
        innerY = eyeY - 19 * sc;
        midY = eyeY - 24 * sc;
        outerY = eyeY - 18 * sc;
        thickness = 4.0 * sc;
      } else if (expression === 'joy') {
        // Happy lifted curved brows
        innerY = eyeY - 20 * sc;
        midY = eyeY - 26 * sc;
        outerY = eyeY - 19 * sc;
        thickness = 4.2 * sc;
      } else if (expression === 'curious') {
        // Classic inquisitive asymmetry: right brow arches high, left stays relaxed!
        if (side === 1) {
          innerY = eyeY - 20 * sc;
          midY = eyeY - 29 * sc;
          outerY = eyeY - 21 * sc;
        } else {
          innerY = eyeY - 16 * sc;
          midY = eyeY - 19 * sc;
          outerY = eyeY - 16 * sc;
        }
        thickness = 4.2 * sc;
      } else if (expression === 'awe') {
        // Smooth high wonder arches
        innerY = eyeY - 23 * sc;
        midY = eyeY - 30 * sc;
        outerY = eyeY - 21 * sc;
        thickness = 4.0 * sc;
      } else if (expression === 'shocked') {
        // High alarmed brows well above wide eyes
        innerY = eyeY - 25 * sc;
        midY = eyeY - 32 * sc;
        outerY = eyeY - 23 * sc;
        thickness = 4.2 * sc;
      } else if (expression === 'sly') {
        // Mischievous asymmetric arch (playful, NOT furious V!)
        if (side === 1) {
          innerY = eyeY - 18 * sc;
          midY = eyeY - 28 * sc;
          outerY = eyeY - 20 * sc;
        } else {
          innerY = eyeY - 15 * sc;
          midY = eyeY - 16.5 * sc;
          outerY = eyeY - 15.5 * sc;
        }
        thickness = 4.6 * sc;
      } else if (expression === 'grief') {
        // Classic FACS AU1+AU4: INNER brow lifted HIGHER than outer brow (/ \)!
        innerY = eyeY - 24 * sc;
        midY = eyeY - 20 * sc;
        outerY = eyeY - 12 * sc;
        thickness = 4.2 * sc;
      } else if (expression === 'stern') {
        // Composed serious authority: flat level straight brows (NO angry V-tilt!)
        innerY = eyeY - 14.5 * sc;
        midY = eyeY - 15.5 * sc;
        outerY = eyeY - 15 * sc;
        thickness = 5.4 * sc;
      } else if (expression === 'angry') {
        // True FACS AU4 angry V-scowl: INNER dipped sharply BELOW outer (\ /)!
        innerY = eyeY - 8.5 * sc;
        midY = eyeY - 15.5 * sc;
        outerY = eyeY - 23 * sc;
        thickness = 6.2 * sc;
      }

      ctx.save();
      ctx.strokeStyle = '#070914';
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(innerX, innerY + speechLift);
      ctx.quadraticCurveTo(midX, midY + speechLift, outerX, outerY + speechLift);
      ctx.stroke();
      ctx.restore();
    }
  }
}

/**
 * Draws an anatomically expressive resting & lip-syncing mouth for all 10 ExpressionIds.
 * Fixes the flat dark bar so `calm`, `warm`, `joy`, `sly`, `curious`, `awe`, `grief`,
 * `shocked`, `stern`, and `angry` are all immediately unmistakable.
 */
export function drawUnifiedMouth(
  ctx: CanvasRenderingContext2D,
  expression: ExpressionId,
  viseme: number,
  options: MouthOptions = {}
): void {
  const y = options.y ?? 38;
  const sc = options.scale ?? 1;
  const v = Math.max(0, Math.min(5, Math.round(viseme)));
  const mouthH = [0, 6, 16, 29, 20, 11][v] * sc;

  ctx.save();
  ctx.translate(0, y);

  // ---- RESTING MOUTH (viseme === 0) ----
  if (v === 0) {
    ctx.strokeStyle = '#1b0910';
    ctx.lineCap = 'round';
    ctx.lineWidth = 4.2 * sc;

    if (expression === 'joy') {
      // Bright cheerful open smile crescent
      ctx.fillStyle = '#240812';
      ctx.beginPath();
      ctx.moveTo(-24 * sc, -3 * sc);
      ctx.quadraticCurveTo(0, 3 * sc, 24 * sc, -3 * sc);
      ctx.quadraticCurveTo(0, 20 * sc, -24 * sc, -3 * sc);
      ctx.closePath();
      ctx.fill();
      // Subtle upper smile highlight (teeth)
      ctx.fillStyle = '#fff7e8';
      ctx.beginPath();
      ctx.moveTo(-18 * sc, -1.5 * sc);
      ctx.quadraticCurveTo(0, 2.5 * sc, 18 * sc, -1.5 * sc);
      ctx.lineTo(14 * sc, 4 * sc);
      ctx.quadraticCurveTo(0, 7 * sc, -14 * sc, 4 * sc);
      ctx.closePath();
      ctx.fill();
    } else if (expression === 'warm') {
      ctx.beginPath();
      ctx.moveTo(-20 * sc, -1 * sc);
      ctx.quadraticCurveTo(0, 12 * sc, 20 * sc, -1 * sc);
      ctx.stroke();
    } else if (expression === 'calm') {
      // Gentle relaxed serene smile (NEVER a harsh scowl bar!)
      ctx.beginPath();
      ctx.moveTo(-16 * sc, 0);
      ctx.quadraticCurveTo(0, 6.5 * sc, 16 * sc, 0);
      ctx.stroke();
    } else if (expression === 'curious') {
      // Compact thoughtful curve
      ctx.beginPath();
      ctx.moveTo(-11 * sc, 2 * sc);
      ctx.quadraticCurveTo(2 * sc, 5 * sc, 13 * sc, -2 * sc);
      ctx.stroke();
    } else if (expression === 'awe') {
      // Soft amazed parted oval
      ctx.fillStyle = '#240812';
      ctx.beginPath();
      ctx.ellipse(0, 4 * sc, 9.5 * sc, 7.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (expression === 'sly') {
      // Confident one-sided mischievous smirk
      ctx.beginPath();
      ctx.moveTo(-18 * sc, 3 * sc);
      ctx.quadraticCurveTo(4 * sc, 6 * sc, 23 * sc, -7 * sc);
      ctx.stroke();
    } else if (expression === 'shocked') {
      // Distinct surprised vertical "O" mouth
      ctx.fillStyle = '#1b070f';
      ctx.beginPath();
      ctx.ellipse(0, 6 * sc, 11 * sc, 14 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (expression === 'grief') {
      // Gentle downturned sad curve
      ctx.beginPath();
      ctx.moveTo(-17 * sc, 7 * sc);
      ctx.quadraticCurveTo(0, -4 * sc, 17 * sc, 7 * sc);
      ctx.stroke();
    } else if (expression === 'stern') {
      // Composed firm straight line
      ctx.beginPath();
      ctx.moveTo(-17 * sc, 2 * sc);
      ctx.lineTo(17 * sc, 2 * sc);
      ctx.stroke();
    } else if (expression === 'angry') {
      // Tense clenched angry grimace
      ctx.fillStyle = '#1d060c';
      ctx.beginPath();
      ctx.moveTo(-22 * sc, 7 * sc);
      ctx.quadraticCurveTo(0, -6 * sc, 22 * sc, 7 * sc);
      ctx.lineTo(18 * sc, 12 * sc);
      ctx.quadraticCurveTo(0, 1 * sc, -18 * sc, 12 * sc);
      ctx.closePath();
      ctx.fill();
      if (options.fanged) {
        ctx.fillStyle = '#fff9ec';
        ctx.beginPath();
        ctx.moveTo(-14 * sc, 4 * sc); ctx.lineTo(-10 * sc, 12 * sc); ctx.lineTo(-6 * sc, 4 * sc);
        ctx.moveTo(6 * sc, 4 * sc); ctx.lineTo(10 * sc, 12 * sc); ctx.lineTo(14 * sc, 4 * sc);
        ctx.fill();
      }
    }

    ctx.restore();
    return;
  }

  // ---- SPEAKING 6-SHAPE PHONEME VISEME MOUTHS (1..5) ----
  const isSmileTone = expression === 'joy' || expression === 'warm';
  const isSadOrAngry = expression === 'grief' || expression === 'angry';
  const isRoundExpr = expression === 'shocked' || expression === 'awe';

  // Viseme 1: Bilabial pressed lips (M / B / P)
  if (v === 1) {
    ctx.strokeStyle = '#1b060e';
    ctx.lineCap = 'round';
    ctx.lineWidth = 5.0 * sc;
    ctx.beginPath();
    if (isSmileTone) {
      ctx.moveTo(-20 * sc, 0);
      ctx.quadraticCurveTo(0, 7 * sc, 20 * sc, 0);
    } else if (isSadOrAngry) {
      ctx.moveTo(-19 * sc, 5 * sc);
      ctx.quadraticCurveTo(0, -1 * sc, 19 * sc, 5 * sc);
    } else {
      ctx.moveTo(-18 * sc, 2 * sc);
      ctx.quadraticCurveTo(0, 4.5 * sc, 18 * sc, 2 * sc);
    }
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Viseme 4: Rounded pursed lips (O / U / W)
  if (v === 4 || (isRoundExpr && v === 2)) {
    const rx = (isRoundExpr ? 11.5 : 12.5) * sc;
    const ry = (isRoundExpr ? 15.5 : 14.0) * sc;
    ctx.fillStyle = '#1b060e';
    ctx.beginPath();
    ctx.ellipse(0, 7 * sc, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    // Subtle inner lip/tongue warmth
    ctx.fillStyle = '#a82942';
    ctx.beginPath();
    ctx.ellipse(0, 12 * sc, rx * 0.48, ry * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Viseme 5: Dental / Fricative / Sibilant (F / V / S / TH) — crisp upper teeth over narrow lower lip
  if (v === 5) {
    const w5 = (isSmileTone ? 23 : 19) * sc;
    ctx.fillStyle = '#1b060e';
    ctx.beginPath();
    ctx.ellipse(0, 4 * sc, w5, 6.2 * sc, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff7e8';
    ctx.beginPath();
    ctx.roundRect(-w5 * 0.72, -1 * sc, w5 * 1.44, 5.2 * sc, 2 * sc);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Viseme 2 (Wide E/I) & Viseme 3 (Tall Open A/AA)
  const isWideEI = v === 2;
  const mouthW = (isWideEI ? (isSmileTone ? 28 : 25) : isRoundExpr ? 17 : isSmileTone || expression === 'sly' ? 25 : 21) * sc;

  ctx.fillStyle = '#1b060e';
  ctx.beginPath();
  if (isWideEI) {
    // Broad stretched E/I vowel mouth
    const cornerY = isSmileTone ? -3 * sc : isSadOrAngry ? 4 * sc : 0;
    ctx.moveTo(-mouthW, cornerY);
    ctx.quadraticCurveTo(0, cornerY + 2 * sc, mouthW, cornerY);
    ctx.quadraticCurveTo(mouthW * 0.7, mouthH + 3 * sc, 0, mouthH + 2 * sc);
    ctx.quadraticCurveTo(-mouthW * 0.7, mouthH + 3 * sc, -mouthW, cornerY);
    ctx.closePath();
  } else if (isSmileTone) {
    ctx.moveTo(-mouthW, -3 * sc);
    ctx.quadraticCurveTo(0, 2 * sc, mouthW, -3 * sc);
    ctx.quadraticCurveTo(0, mouthH + 8 * sc, -mouthW, -3 * sc);
    ctx.closePath();
  } else if (isSadOrAngry) {
    ctx.moveTo(-mouthW, 5 * sc);
    ctx.quadraticCurveTo(0, -4 * sc, mouthW, 5 * sc);
    ctx.quadraticCurveTo(mouthW * 0.7, mouthH + 3 * sc, 0, mouthH);
    ctx.quadraticCurveTo(-mouthW * 0.7, mouthH + 3 * sc, -mouthW, 5 * sc);
    ctx.closePath();
  } else if (expression === 'sly') {
    ctx.moveTo(-mouthW * 0.85, 1 * sc);
    ctx.lineTo(mouthW, -5 * sc);
    ctx.quadraticCurveTo(mouthW * 0.5, mouthH, -mouthW * 0.65, mouthH * 0.85);
    ctx.closePath();
  } else {
    ctx.ellipse(0, mouthH * 0.34, mouthW * 0.9, Math.max(7 * sc, mouthH * 0.54), 0, 0, Math.PI * 2);
  }
  ctx.fill();

  // Crisp upper teeth band on wide E/I and open A vowels
  ctx.fillStyle = '#fff7e8';
  ctx.beginPath();
  ctx.moveTo(-mouthW * 0.68, isSadOrAngry ? 3 * sc : -0.5 * sc);
  ctx.quadraticCurveTo(0, isSadOrAngry ? 0 : 2.5 * sc, mouthW * 0.68, isSadOrAngry ? 3 * sc : -0.5 * sc);
  ctx.lineTo(mouthW * 0.56, (isSadOrAngry ? 7 : 4.5) * sc);
  ctx.quadraticCurveTo(0, (isSadOrAngry ? 4.5 : 6.8) * sc, -mouthW * 0.56, (isSadOrAngry ? 7 : 4.5) * sc);
  ctx.closePath();
  ctx.fill();

  // Subtle warm tongue accent on wide open syllables
  if (v === 3 || v === 2) {
    ctx.fillStyle = '#cf3550';
    ctx.beginPath();
    ctx.ellipse(0, mouthH * 0.66, mouthW * 0.42, Math.max(3 * sc, mouthH * 0.22), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fangs ONLY when character is fanged AND expressing angry or sly (not friendly calm/joy!)
  if (options.fanged && (expression === 'angry' || expression === 'sly')) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-14 * sc, -1 * sc); ctx.lineTo(-10 * sc, 9 * sc); ctx.lineTo(-6 * sc, -1 * sc);
    ctx.moveTo(6 * sc, -1 * sc); ctx.lineTo(10 * sc, 9 * sc); ctx.lineTo(14 * sc, -1 * sc);
    ctx.fill();
  }

  ctx.restore();
}
