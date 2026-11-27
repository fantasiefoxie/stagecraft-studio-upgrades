import { CastMember, StoryBeat } from './types';

export type EmphasisKind = 'none' | 'all_caps' | 'asterisk' | 'punch_punct';

export interface EmphasisToken {
  raw: string;
  text: string; // display text with `*` markers stripped
  emphasis: EmphasisKind;
  isEmphasized: boolean;
}

export interface WordKineticMotion {
  scaleX: number;
  scaleY: number;
  liftPx: number;
  glowAlpha: number;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function isAllCapsWord(clean: string): boolean {
  const letters = clean.replace(/[^A-Za-z]/g, '');
  if (letters.length < 2) return false;
  return letters === letters.toUpperCase() && letters !== letters.toLowerCase();
}

/**
 * Pure deterministic dialogue token emphasis parser.
 * Detects:
 *  - `*emphasized*` (or `**bold**`) words -> strips asterisks for clean display
 *  - ALL-CAPS words (2+ Latin uppercase letters like "STOP", "NEVER", "BEWARE")
 *  - Exclamation / question punch words ending in `!` or `?`
 */
export function parseEmphasisTokens(dialogue: string): EmphasisToken[] {
  const trimmed = (dialogue || '').trim();
  if (!trimmed) return [];

  const rawWords = trimmed.split(/\s+/);
  let insideAsteriskSpan = false;

  return rawWords.map((raw) => {
    let text = raw;
    let emphasis: EmphasisKind = 'none';

    const startsStar = /^\*+/.test(text);
    const endsStar = /\*+[.,!?;:'"”’]*$/.test(text);

    if (startsStar && endsStar && text.replace(/\*/g, '').length > 0) {
      text = text.replace(/^\*+/, '').replace(/\*+([.,!?;:'"”’]*)$/, '$1');
      emphasis = 'asterisk';
    } else if (startsStar) {
      insideAsteriskSpan = true;
      text = text.replace(/^\*+/, '');
      emphasis = 'asterisk';
    } else if (insideAsteriskSpan) {
      emphasis = 'asterisk';
      if (endsStar) {
        text = text.replace(/\*+([.,!?;:'"”’]*)$/, '$1');
        insideAsteriskSpan = false;
      }
    }

    if (emphasis === 'none') {
      if (isAllCapsWord(text)) {
        emphasis = 'all_caps';
      } else if (/[!?]["'”’)]*$/.test(text)) {
        emphasis = 'punch_punct';
      }
    }

    return {
      raw,
      text: text || raw,
      emphasis,
      isEmphasized: emphasis !== 'none',
    };
  });
}

/**
 * Strips `*emphasized*` markdown markers cleanly for caption wrapping & accessibility.
 */
export function stripEmphasisMarkup(dialogue: string): string {
  return parseEmphasisTokens(dialogue)
    .map((t) => t.text)
    .join(' ');
}

/**
 * Computes 12-Principles squash-overshoot pop transform on an active karaoke word.
 * `wordLocalU` is 0..1 progress within the currently spoken word.
 * - Initial 0..0.28: quick squash-and-stretch pop overshoot peaking at ~1.18x (or 1.24x for emphasized words)
 * - 0.28..1.0: smooth damped settle back toward 1.04x elevated read state.
 */
export function computeKineticWordPop(
  wordLocalU: number,
  isEmphasized: boolean,
  isActive: boolean
): WordKineticMotion {
  if (!isActive) {
    if (isEmphasized) {
      return { scaleX: 1.04, scaleY: 1.04, liftPx: 0.8, glowAlpha: 0.25 };
    }
    return { scaleX: 1, scaleY: 1, liftPx: 0, glowAlpha: 0 };
  }

  const u = clamp(Number.isFinite(wordLocalU) ? wordLocalU : 0.25, 0, 1);
  const boost = isEmphasized ? 1.38 : 1.0;

  // Damped spring overshoot curve: peaks around u=0.14-0.18, settles smoothly
  const popEnv = Math.exp(-u * 3.8) * Math.sin(Math.min(1, u * 3.4) * Math.PI);
  const settleLift = 0.045 * boost;

  const scaleY = 1 + settleLift + popEnv * 0.16 * boost;
  // Volume-preserving subtle horizontal counterbalance during peak pop
  const scaleX = 1 + settleLift * 0.85 + popEnv * 0.09 * boost;
  const liftPx = (1.6 + popEnv * 5.2) * boost;
  const glowAlpha = clamp(0.42 + popEnv * 0.55 + (isEmphasized ? 0.18 : 0), 0, 1);

  return {
    scaleX: Number(scaleX.toFixed(4)),
    scaleY: Number(scaleY.toFixed(4)),
    liftPx: Number(liftPx.toFixed(2)),
    glowAlpha: Number(glowAlpha.toFixed(3)),
  };
}

/**
 * Resolves a speaker-colored accent hex from `episode.cast` (falling back to palette accent for Narrator).
 */
export function resolveSpeakerAccentColor(
  beat: Pick<StoryBeat, 'speakerId'>,
  cast: CastMember[] | undefined,
  fallbackAccent: string
): string {
  if (!beat.speakerId || beat.speakerId === 'narrator' || !cast || cast.length === 0) {
    return fallbackAccent;
  }
  const member = cast.find((c) => c.id === beat.speakerId);
  if (!member) return fallbackAccent;
  const candidate = member.accentColor || member.primaryColor;
  if (typeof candidate === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(candidate.trim())) {
    return candidate.trim();
  }
  return fallbackAccent;
}
