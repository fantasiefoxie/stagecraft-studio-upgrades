/**
 * AI Emotion Comprehension, Phrase-to-Frame Aligner & Anti-Flicker Choreographer.
 *
 * Ensures every character on stage (both speaker AND silent listeners) understands
 * what they feel across every frame / set of frames in the script—handling dramatic
 * irony, subtext, clause-turn reactions, cross-beat emotional continuity, and
 * automatic 60fps frame re-sync whenever beat durations change (e.g. real TTS audio).
 */
import {
  ActorPlacement,
  ArchetypeId,
  CastMember,
  EpisodeScript,
  EXPRESSION_LIST,
  ExpressionId,
  ExpressionKeyframe,
  STUDIO_FPS,
  StoryBeat,
  computePhraseTriggerFrame,
  normalizeExpressionId,
} from './types';

/** Minimum readable facial hold in 2D animation (0.60s = 36 frames @ 60fps). */
export const MIN_EXPRESSION_HOLD_FRAMES = 36;

/** Natural human reaction delay for a listening character reacting to a spoken turn (0.20s = 12 frames). */
export const LISTENER_REACTION_LAG_FRAMES = 12;

export const EXPRESSION_COLORS: Record<ExpressionId, string> = {
  calm: '#64748b',
  warm: '#f59e0b',
  joy: '#22c55e',
  curious: '#38bdf8',
  awe: '#a855f7',
  sly: '#ec4899',
  shocked: '#f97316',
  grief: '#6366f1',
  stern: '#94a3b8',
  angry: '#ef4444',
};

export interface EmotionAuditReport {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  totalSegments: number;
  multiCueBeats: number;
  listenerAlivePct: number;
  angrySternPct: number;
  withReasonCount: number;
  issues: string[];
}

export interface EmotionChoreographResult {
  episode: EpisodeScript;
  updatedActors: number;
  totalSegments: number;
}

type CharacterTemperament = 'trickster' | 'mentor' | 'hero' | 'comic_or_folk';

const TRICKSTER_ARCHETYPES = new Set<ArchetypeId>([
  'spirit',
  'yaksha',
  'fox',
  'wolf',
  'jackal',
  'spider',
  'raven',
  'crow',
  'monkey',
  'serpent',
  'crocodile',
  'demon_king',
]);

const MENTOR_ARCHETYPES = new Set<ArchetypeId>([
  'sage',
  'ascetic',
  'deva',
  'goddess',
  'elephant',
  'owl',
  'elder_woman',
]);

const HERO_ARCHETYPES = new Set<ArchetypeId>([
  'king',
  'emperor',
  'queen',
  'warrior',
  'knight',
  'samurai',
  'vanara_hero',
  'lion',
  'statue_apsara',
]);

function classifyCharacter(member?: CastMember): CharacterTemperament {
  if (!member) return 'comic_or_folk';
  if (TRICKSTER_ARCHETYPES.has(member.archetype)) return 'trickster';
  if (MENTOR_ARCHETYPES.has(member.archetype)) return 'mentor';
  if (HERO_ARCHETYPES.has(member.archetype)) return 'hero';
  return 'comic_or_folk';
}

/**
 * Normalizes a raw list of expression keyframes into contiguous, flicker-free
 * 60fps `frame..endFrame` sets of frames anchored to `beat.dialogue`.
 */
export function normalizeAndGuardExpressionTrack(
  rawTrack: ExpressionKeyframe[],
  beat: Pick<StoryBeat, 'duration' | 'dialogue'>,
  isListener = false
): ExpressionKeyframe[] {
  const dur = Math.max(1.2, beat.duration);
  const totalFrames = Math.max(24, Math.round(dur * STUDIO_FPS));
  const lag = isListener ? LISTENER_REACTION_LAG_FRAMES : 0;

  if (!Array.isArray(rawTrack) || rawTrack.length === 0) return [];

  // 1. Resolve every keyframe's start frame (preferring triggerPhrase alignment if frame wasn't locked, or honoring explicit frame)
  const resolved = rawTrack
    .map((kf, order) => {
      let startFrame = 0;
      if (typeof kf.frame === 'number' && Number.isFinite(kf.frame)) {
        startFrame = Math.max(0, Math.min(totalFrames - 1, Math.round(kf.frame)));
      } else if (kf.triggerPhrase && beat.dialogue) {
        const aligned = computePhraseTriggerFrame(beat.dialogue, kf.triggerPhrase, dur, lag);
        startFrame = aligned !== null ? aligned : 0;
      } else if (typeof kf.timeSec === 'number' && Number.isFinite(kf.timeSec)) {
        startFrame = Math.max(0, Math.min(totalFrames - 1, Math.round(kf.timeSec * STUDIO_FPS)));
      } else if (typeof kf.at === 'number' && Number.isFinite(kf.at)) {
        startFrame = Math.max(0, Math.min(totalFrames - 1, Math.round(kf.at * totalFrames)));
      }
      return {
        frame: startFrame,
        explicitEndFrame:
          typeof kf.endFrame === 'number' && Number.isFinite(kf.endFrame)
            ? Math.max(startFrame + 1, Math.min(totalFrames, Math.round(kf.endFrame)))
            : undefined,
        expression: normalizeExpressionId(kf.expression),
        triggerPhrase: kf.triggerPhrase?.trim() || undefined,
        reason: kf.reason?.trim() || undefined,
        order,
      };
    })
    .sort((a, b) => (a.frame !== b.frame ? a.frame - b.frame : a.order - b.order));

  // Ensure track begins cleanly at frame 0
  if (resolved[0].frame > 0 && resolved[0].frame < 24) {
    resolved[0].frame = 0;
  }

  // 2. Anti-flicker guard & deduplication (enforce MIN_EXPRESSION_HOLD_FRAMES between shifts)
  const guarded: typeof resolved = [];
  for (const item of resolved) {
    if (guarded.length === 0) {
      guarded.push(item);
      continue;
    }
    const prev = guarded[guarded.length - 1];
    // Collapse consecutive duplicate expressions
    if (prev.expression === item.expression) {
      if (!prev.reason && item.reason) prev.reason = item.reason;
      continue;
    }
    const gap = item.frame - prev.frame;
    if (gap < MIN_EXPRESSION_HOLD_FRAMES) {
      // Too fast to read! Either push this shift forward if room exists, or supersede if at frame 0
      if (prev.frame === 0 && item.frame <= 10) {
        guarded[guarded.length - 1] = { ...item, frame: 0 };
      } else {
        const nudged = prev.frame + MIN_EXPRESSION_HOLD_FRAMES;
        if (nudged <= totalFrames - 20) {
          guarded.push({ ...item, frame: nudged });
        } else {
          // Beat is almost over; skip micro-flicker
          continue;
        }
      }
    } else {
      guarded.push(item);
    }
  }

  // 3. Assign clean contiguous `endFrame` sets of frames
  return guarded.map((item, idx) => {
    const next = guarded[idx + 1];
    const endFrame = next ? next.frame : item.explicitEndFrame ?? totalFrames;
    const out: ExpressionKeyframe = {
      frame: item.frame,
      endFrame: Math.max(item.frame + 1, Math.min(totalFrames, endFrame)),
      expression: item.expression,
    };
    if (item.triggerPhrase) out.triggerPhrase = item.triggerPhrase;
    if (item.reason) out.reason = item.reason;
    return out;
  });
}

/**
 * Automatically re-syncs a beat's per-frame expression tracks whenever its duration changes
 * (for example, when attaching a real TTS voiceover audio clip or adjusting beat duration).
 * - Keyframes anchored by `triggerPhrase` re-align to the exact spoken words at the new duration.
 * - Purely numeric keyframes scale proportionally so the acting rhythm never drifts out of sync!
 */
export function retimeBeatExpressionTracks(beat: StoryBeat, newDurationSec: number): StoryBeat {
  const oldDur = Math.max(1.2, beat.duration);
  const nextDur = Math.max(1.2, newDurationSec);
  const ratio = nextDur / oldDur;
  const oldTotalFrames = Math.max(1, Math.round(oldDur * STUDIO_FPS));
  const newTotalFrames = Math.max(24, Math.round(nextDur * STUDIO_FPS));

  const retimeList = (list: ExpressionKeyframe[], isListener: boolean): ExpressionKeyframe[] => {
    const lag = isListener ? LISTENER_REACTION_LAG_FRAMES : 0;
    const rescaled = list.map((kf) => {
      if (kf.triggerPhrase && beat.dialogue) {
        const aligned = computePhraseTriggerFrame(beat.dialogue, kf.triggerPhrase, nextDur, lag);
        if (aligned !== null) {
          return { ...kf, frame: aligned, endFrame: undefined };
        }
      }
      const oldFrame =
        typeof kf.frame === 'number' && Number.isFinite(kf.frame)
          ? kf.frame
          : typeof kf.timeSec === 'number' && Number.isFinite(kf.timeSec)
            ? kf.timeSec * STUDIO_FPS
            : typeof kf.at === 'number' && Number.isFinite(kf.at)
              ? kf.at * oldTotalFrames
              : 0;
      const scaledFrame = Math.max(0, Math.min(newTotalFrames - 1, Math.round(oldFrame * ratio)));
      return {
        ...kf,
        frame: scaledFrame,
        endFrame: undefined,
        timeSec: undefined,
      };
    });
    return normalizeAndGuardExpressionTrack(rescaled, { duration: nextDur, dialogue: beat.dialogue }, isListener);
  };

  const nextActors = beat.actors.map((a) => {
    if (!a.expressionTrack || a.expressionTrack.length === 0) return a;
    const isListener = beat.speakerId !== 'narrator' && beat.speakerId !== a.castId;
    return {
      ...a,
      expressionTrack: retimeList(a.expressionTrack, isListener),
    };
  });

  const nextCues = beat.expressionCues
    ? beat.expressionCues.map((cue) => {
        const isListener = beat.speakerId !== 'narrator' && beat.speakerId !== cue.castId;
        const lag = isListener ? LISTENER_REACTION_LAG_FRAMES : 0;
        if (cue.triggerPhrase && beat.dialogue) {
          const aligned = computePhraseTriggerFrame(beat.dialogue, cue.triggerPhrase, nextDur, lag);
          if (aligned !== null) {
            return { ...cue, frame: aligned, endFrame: undefined };
          }
        }
        const oldFrame =
          typeof cue.frame === 'number' && Number.isFinite(cue.frame)
            ? cue.frame
            : typeof cue.timeSec === 'number' && Number.isFinite(cue.timeSec)
              ? cue.timeSec * STUDIO_FPS
              : typeof cue.at === 'number' && Number.isFinite(cue.at)
                ? cue.at * oldTotalFrames
                : 0;
        return {
          ...cue,
          frame: Math.max(0, Math.min(newTotalFrames - 1, Math.round(oldFrame * ratio))),
          endFrame:
            typeof cue.endFrame === 'number' && Number.isFinite(cue.endFrame)
              ? Math.max(1, Math.min(newTotalFrames, Math.round(cue.endFrame * ratio)))
              : undefined,
        };
      })
    : undefined;

  return {
    ...beat,
    duration: nextDur,
    actors: nextActors,
    ...(nextCues ? { expressionCues: nextCues } : {}),
  };
}

// =========================================================================
// CLAUSE & SUBTEXT ANALYZER (Deterministic Zero-Key Script Comprehension)
// =========================================================================

interface ClauseSegment {
  text: string;
  triggerPhrase: string;
  charStart: number;
}

/** Splits spoken dialogue into 1–3 dramatic clauses along rhetorical pivots (em-dash, wait/yet/but, !/?). */
function splitDialogueIntoDramaticClauses(dialogue: string): ClauseSegment[] {
  const clean = String(dialogue || '').trim();
  if (!clean) return [{ text: '', triggerPhrase: '', charStart: 0 }];

  // Find natural dramatic pivot positions (em-dash, semicolon, sentence boundary, or contrastive conjunction)
  const pivotRegex = /(?:[—–]\s*|[!?]\s+|;\s+|,\s+(?:but|yet|wait|until|suddenly|only|instead|however|stop)\b)/gi;
  const cuts: number[] = [0];
  let match: RegExpExecArray | null;
  while ((match = pivotRegex.exec(clean)) !== null) {
    const afterSep =
      match[0].startsWith(',')
        ? match.index + 2
        : match.index + match[0].length;
    if (afterSep > cuts[cuts.length - 1] + 12 && afterSep < clean.length - 8) {
      cuts.push(afterSep);
    }
  }

  // Keep at most 3 well-spaced clauses so faces never feel busy
  const trimmedCuts = cuts.length <= 3 ? cuts : [cuts[0], cuts[1], cuts[cuts.length - 1]];
  const segments: ClauseSegment[] = [];
  for (let i = 0; i < trimmedCuts.length; i++) {
    const start = trimmedCuts[i];
    const end = i + 1 < trimmedCuts.length ? trimmedCuts[i + 1] : clean.length;
    const text = clean.slice(start, end).trim();
    if (!text) continue;
    const words = text.split(/\s+/).slice(0, 3).join(' ').replace(/^[,;—–\-\s]+/, '');
    segments.push({ text, triggerPhrase: words, charStart: start });
  }
  return segments.length > 0 ? segments : [{ text: clean, triggerPhrase: clean.split(/\s+/).slice(0, 3).join(' '), charStart: 0 }];
}

function detectClauseEmotion(
  clauseText: string,
  role: {
    temperament: CharacterTemperament;
    isSpeaker: boolean;
    isNarratorBeat: boolean;
    beat: StoryBeat;
    isMoral: boolean;
    isTitle: boolean;
    isClimax: boolean;
    fallback: ExpressionId;
  }
): { expression: ExpressionId; reason: string } {
  const t = clauseText.toLowerCase();

  if (role.isMoral) {
    if (/never|beware|folly|greed|fool|ruin/.test(t)) {
      return { expression: 'warm', reason: 'reflective moral takeaway' };
    }
    return { expression: 'calm', reason: 'serene closing wisdom' };
  }
  if (role.isTitle) {
    return { expression: 'calm', reason: 'opening storybook composure' };
  }

  // Dramatic irony: Trickster flattering or setting a trap feels SLY, not warm!
  const isFlatteryOrBait =
    /sweet|glorious|beautiful|magnificent|golden voice|precious|dear friend|gift for you|taste this|sing|riddle|silence|dare|bet|bargain|clever/.test(
      t
    );
  const isShockOrTrap =
    /wait,|my prize|stop|thief|trap|betray|impossible|recoil|cried out|blister|vanish|dropped|fell|stolen|shock|gasp|broken|broke your vow|curse|cremation|bruised/.test(
      t
    );
  const isGenuineRage =
    /fury|wrath|destroy|slay|avenge|how dare|traitor|vengeance|burn them|furious|rage/.test(t);
  const isGriefOrLoss =
    /wept|tears|sorrow|empty|lost everything|regret|alas|mourning|alone|starving|poor|plead|forgive|sorry|broken heart/.test(
      t
    );
  const isWonderOrMagic =
    /miracle|moonlight|lotus|golden|glow|divine|radiant|starlight|magic|sacred|blessing|heaven|phoenix|sunlight|shimmer/.test(
      t
    );
  const isQuestionOrPuzzle = /\?|which|who|why|how|secret|judge|clue|wonder|listen|think/.test(t);
  const isJoyOrTriumph =
    /laugh|haha|wise as ever|victory|triumph|behold|celebrate|delight|rejoice|cheered|free|fly|won|feast|proud|happy/.test(
      t
    );
  const isKindOrWarm =
    /kind|gentle|welcome|friend|thank|share|peace|bless|heart|help|warm|smile|care/.test(t);
  const isDecisiveVerdict =
    /the third|the truth|verdict|i vow|swear|order|command|must|stand firm|never yield|justice/.test(t);

  if (role.isSpeaker) {
    if (role.temperament === 'trickster' && isFlatteryOrBait) {
      return { expression: 'sly', reason: 'planting clever bait or flattery' };
    }
    if (isGenuineRage || (role.beat.fx === 'crimson_impact' && /thief|traitor|dare|slay|attack/.test(t))) {
      return { expression: 'angry', reason: 'erupts in genuine fury' };
    }
    if (isShockOrTrap) {
      return { expression: 'shocked', reason: 'startled by sudden turn' };
    }
    if (isGriefOrLoss) {
      return { expression: 'grief', reason: 'feels sorrow or loss' };
    }
    if (isJoyOrTriumph) {
      return { expression: role.temperament === 'trickster' ? 'sly' : 'joy', reason: 'delights in triumph' };
    }
    if (isDecisiveVerdict) {
      return { expression: 'stern', reason: 'delivers firm decisive verdict' };
    }
    if (isQuestionOrPuzzle) {
      return {
        expression: role.temperament === 'trickster' ? 'sly' : 'curious',
        reason: role.temperament === 'trickster' ? 'poses playful riddle' : 'asks probing question',
      };
    }
    if (isWonderOrMagic) {
      return { expression: 'awe', reason: 'struck by wonder' };
    }
    if (isKindOrWarm) {
      return { expression: 'warm', reason: 'speaks with genuine warmth' };
    }
    return { expression: role.fallback, reason: 'natural spoken delivery' };
  }

  // LISTENER (or Narrator beat) — reacts to what is happening to them!
  if (role.isNarratorBeat) {
    if (isShockOrTrap) {
      return {
        expression: role.temperament === 'trickster' ? 'sly' : 'shocked',
        reason: role.temperament === 'trickster' ? 'amused by unfolding twist' : 'caught off guard by event',
      };
    }
    if (isGriefOrLoss) return { expression: 'grief', reason: 'weighed down by hardship' };
    if (isWonderOrMagic) return { expression: 'awe', reason: 'beholds wondrous sight' };
    if (isJoyOrTriumph) return { expression: 'joy', reason: 'shares moment of triumph' };
    if (isKindOrWarm) return { expression: 'warm', reason: 'warm storybook moment' };
    if (isQuestionOrPuzzle) return { expression: 'curious', reason: 'takes in the mystery' };
    return { expression: role.fallback, reason: 'present in scene' };
  }

  // Silent listener watching another character speak!
  if (isFlatteryOrBait) {
    if (role.temperament === 'trickster') {
      return { expression: 'sly', reason: 'amused by rival ploy' };
    }
    return { expression: 'curious', reason: 'intrigued by speaker offer' };
  }
  if (isShockOrTrap) {
    if (role.temperament === 'trickster') {
      return { expression: 'joy', reason: 'delighted the trap worked' };
    }
    return { expression: 'shocked', reason: 'stunned by speaker reveal' };
  }
  if (isGenuineRage) {
    return { expression: role.temperament === 'hero' ? 'stern' : 'shocked', reason: 'braces against outburst' };
  }
  if (isDecisiveVerdict) {
    return {
      expression: role.temperament === 'trickster' ? 'shocked' : 'awe',
      reason: role.temperament === 'trickster' ? 'caught off guard by sharp answer' : 'impressed by verdict',
    };
  }
  if (isQuestionOrPuzzle) {
    return { expression: 'curious', reason: 'ponders the question intently' };
  }
  if (isGriefOrLoss) {
    return { expression: role.temperament === 'trickster' ? 'sly' : 'warm', reason: 'empathetic listening' };
  }
  if (isJoyOrTriumph) {
    return {
      expression: role.temperament === 'hero' && role.isClimax ? 'stern' : 'warm',
      reason: 'responds to speaker victory',
    };
  }
  if (isWonderOrMagic) {
    return { expression: 'awe', reason: 'wide-eyed wonder at tale' };
  }
  return { expression: role.fallback === 'angry' ? 'curious' : role.fallback, reason: 'attentive listening' };
}

/**
 * Deterministic Full-Episode Emotion Choreographer (Zero API Key).
 * Analyzes every beat's dialogue clauses, speaker vs. listener subtext, character archetypes,
 * and cross-beat emotional continuity to build readable, non-angry per-frame expression tracks.
 */
export function choreographEpisodeEmotions(
  episode: EpisodeScript,
  options?: { preserveExisting?: boolean }
): EmotionChoreographResult {
  const preserveExisting = options?.preserveExisting === true;
  const castMap = new Map<string, CastMember>();
  for (const c of episode.cast) castMap.set(c.id, c);

  // Track each character's ending emotion from the previous beat for cross-beat continuity
  const prevEndEmotion = new Map<string, ExpressionId>();
  let prevStage = '';
  let updatedActors = 0;
  let totalSegments = 0;

  const nextBeats: StoryBeat[] = episode.beats.map((beat, bIdx) => {
    const isMoral = beat.frame === 'moral_card';
    const isTitle = beat.frame === 'chapter_title';
    const isClimax = bIdx >= Math.floor(episode.beats.length * 0.65) && !isMoral;
    const sameStageContinuity = bIdx > 0 && beat.stage === prevStage && beat.frame !== 'nested_story';
    prevStage = beat.stage;

    const clauses = splitDialogueIntoDramaticClauses(beat.dialogue);
    const totalFrames = Math.max(24, Math.round(Math.max(1.2, beat.duration) * STUDIO_FPS));

    const nextActors: ActorPlacement[] = beat.actors.map((actor) => {
      const hasExistingTrack = Array.isArray(actor.expressionTrack) && actor.expressionTrack.length > 0;
      const hasBeatCues = Boolean(beat.expressionCues?.some((c) => c.castId === actor.castId));
      if (preserveExisting && (hasExistingTrack || hasBeatCues)) {
        const cleaned = hasExistingTrack
          ? normalizeAndGuardExpressionTrack(
              actor.expressionTrack!,
              beat,
              beat.speakerId !== 'narrator' && beat.speakerId !== actor.castId
            )
          : actor.expressionTrack;
        if (cleaned && cleaned.length > 0) {
          prevEndEmotion.set(actor.castId, cleaned[cleaned.length - 1].expression);
          totalSegments += cleaned.length;
        } else {
          prevEndEmotion.set(actor.castId, actor.expression);
        }
        return cleaned ? { ...actor, expressionTrack: cleaned } : actor;
      }

      const member = castMap.get(actor.castId);
      const temperament = classifyCharacter(member);
      const isSpeaker = beat.speakerId === actor.castId;
      const isNarratorBeat = beat.speakerId === 'narrator';
      const carriedEmotion = sameStageContinuity ? prevEndEmotion.get(actor.castId) : undefined;

      // Soften legacy over-angry/over-stern defaults unless beat truly calls for it
      let safeBase: ExpressionId = actor.expression;
      if (safeBase === 'stern' && !isClimax && !/verdict|vow|command|battle|truth|judge/i.test(beat.dialogue)) {
        safeBase = temperament === 'trickster' ? 'sly' : 'calm';
      }
      if (safeBase === 'angry' && !/fury|rage|thief|traitor|slay|attack|destroy/i.test(beat.dialogue)) {
        safeBase = 'stern';
      }

      const rawKeyframes: ExpressionKeyframe[] = [];

      if (clauses.length === 1) {
        const first = detectClauseEmotion(clauses[0].text, {
          temperament,
          isSpeaker,
          isNarratorBeat,
          beat,
          isMoral,
          isTitle,
          isClimax,
          fallback: carriedEmotion || safeBase,
        });

        // Opening frame: carry previous beat's emotion briefly if same continuous scene & different
        if (carriedEmotion && carriedEmotion !== first.expression && beat.duration >= 3.2 && !isMoral && !isTitle) {
          rawKeyframes.push({
            frame: 0,
            expression: carriedEmotion,
            reason: 'carries reaction from prior moment',
          });
          rawKeyframes.push({
            frame: Math.min(totalFrames - MIN_EXPRESSION_HOLD_FRAMES, isSpeaker ? 36 : 48),
            expression: first.expression,
            reason: first.reason,
          });
        } else {
          rawKeyframes.push({
            frame: 0,
            expression: first.expression,
            reason: first.reason,
          });
        }

        // Listener micro-arc on longer single-clause beats (>= 3.8s)
        if (!isSpeaker && !isNarratorBeat && !isMoral && !isTitle && beat.duration >= 3.8 && rawKeyframes.length === 1) {
          const midExpr: ExpressionId =
            first.expression === 'calm'
              ? 'curious'
              : first.expression === 'curious'
                ? temperament === 'trickster'
                  ? 'sly'
                  : 'warm'
                : first.expression;
          if (midExpr !== first.expression) {
            rawKeyframes.push({
              frame: Math.round(totalFrames * 0.52),
              expression: midExpr,
              reason: 'active listening shift',
            });
          }
        }
      } else {
        // Multi-clause beat: map every dramatic pivot to its exact spoken phrase!
        clauses.forEach((clause, cIdx) => {
          const detected = detectClauseEmotion(clause.text, {
            temperament,
            isSpeaker,
            isNarratorBeat,
            beat,
            isMoral,
            isTitle,
            isClimax,
            fallback: cIdx === 0 ? carriedEmotion || safeBase : rawKeyframes[rawKeyframes.length - 1]?.expression || safeBase,
          });

          if (cIdx === 0) {
            rawKeyframes.push({
              frame: 0,
              expression: detected.expression,
              reason: detected.reason,
            });
          } else {
            const aligned = computePhraseTriggerFrame(
              beat.dialogue,
              clause.triggerPhrase,
              beat.duration,
              !isSpeaker && !isNarratorBeat ? LISTENER_REACTION_LAG_FRAMES : 0
            );
            rawKeyframes.push({
              frame: aligned !== null ? aligned : Math.round((cIdx / clauses.length) * totalFrames),
              triggerPhrase: clause.triggerPhrase,
              expression: detected.expression,
              reason: detected.reason,
            });
          }
        });
      }

      const finalTrack = normalizeAndGuardExpressionTrack(rawKeyframes, beat, !isSpeaker && !isNarratorBeat);
      const startExpr = finalTrack[0]?.expression || safeBase;
      const endExpr = finalTrack[finalTrack.length - 1]?.expression || startExpr;
      prevEndEmotion.set(actor.castId, endExpr);
      updatedActors++;
      totalSegments += finalTrack.length;

      return {
        ...actor,
        expression: startExpr,
        expressionTrack: finalTrack,
      };
    });

    return {
      ...beat,
      actors: nextActors,
    };
  });

  return {
    episode: { ...episode, beats: nextBeats },
    updatedActors,
    totalSegments,
  };
}

// =========================================================================
// PASS-2 DEDICATED AI EMOTION DIRECTOR (Deep Narrative & Subtext Pass)
// =========================================================================

/**
 * Builds a dedicated Pass-2 LLM prompt that feeds the ENTIRE episode script
 * (cast roles + every beat's dialogue, speaker, listeners, and 60fps frame budget)
 * so the LLM truly understands what EVERY character feels in EVERY set of frames
 * (subtext, dramatic irony, listener reactions, and cross-beat continuity) without
 * risking a single change to stages, shots, cast, or dialogue.
 */
export function buildEmotionDirectionPrompt(episode: EpisodeScript): {
  systemPrompt: string;
  userPrompt: string;
} {
  const castSummary = episode.cast
    .map((c) => `- "${c.id}": ${c.name} (archetype: ${c.archetype})`)
    .join('\n');

  const beatLines = episode.beats.map((b, idx) => {
    const totalFrames = Math.round(Math.max(1.2, b.duration) * STUDIO_FPS);
    const onStage = b.actors.map((a) => `"${a.castId}" (${a.slot})`).join(', ');
    return `${idx + 1}. id="${b.id}" | ${b.duration.toFixed(1)}s (${totalFrames} frames @ 60fps) | stage=${b.stage} | frame=${b.frame || 'main'} | speaker="${b.speakerId}" | onStage=[${onStage}]
   dialogue: "${b.dialogue}"`;
  });

  const systemPrompt = `You are a Pixar/Disney-caliber Facial Acting & Emotion Director for Katha Studio (60fps 2D Folklore Animation).
Your ONLY job is to read the ENTIRE episode script, deeply understand what EVERY on-stage character (both the speaker AND every silent listener!) truly feels in every set of frames, and output a clean JSON emotion direction sheet.

THE 10 VALID EXPRESSIONS (use ONLY these exact IDs):
- calm: serene, relaxed, peaceful composure
- warm: kind, affectionate, gentle empathy
- joy: cheerful, smiling triumph, delight
- curious: inquisitive, thinking, puzzled, weighing a claim
- awe: wide-eyed wonder, reverence, amazement
- sly: mischievous, scheming, flattering with hidden motive, smug
- shocked: startled, alarmed, caught off guard
- grief: sad, worried, remorseful, heartbroken
- stern: composed determination, firm verdict, solemn focus (NOT furious)
- angry: true rage/fury ONLY (use sparingly — never make everyone look angry!)

MASTER ACTING RULES:
1. UNDERSTAND SUBTEXT & DRAMATIC IRONY: A trickster flattering a victim ("Your golden voice is divine!") feels "sly", NOT "warm", while the victim listening shifts "curious" -> "joy"!
2. DIRECT SILENT LISTENERS TOO: On multi-character beats, direct EVERY on-stage actor so listeners react naturally as the speaker's words land.
3. USE SETS OF FRAMES ANCHORED TO SPOKEN WORDS: For each actor in a beat, output 1 to 3 segments covering the beat's frames.
   - Start segment 1 at frame 0.
   - For mid-beat emotional turns, specify "triggerPhrase" (exact 2–4 words from that beat's dialogue where the shift happens!) AND/OR "frameRange": [startFrame, endFrame] (at 60fps).
   - Hold every expression at least 36 frames (0.6s) so audiences can clearly read it.
4. CROSS-BEAT CONTINUITY: Remember how each character felt at the end of Beat N when opening Beat N+1 on the same stage.
5. INCLUDE A SHORT "reason" (3–7 words) explaining WHY the character feels that emotion in those frames.
6. NEVER alter dialogue, cast IDs, stages, or shots. Return ONLY valid raw JSON (no markdown fences).

EXACT JSON OUTPUT SHAPE:
{
  "beats": [
    {
      "id": "exact_beat_id",
      "actors": [
        {
          "castId": "exact_cast_id",
          "segments": [
            { "frameRange": [0, 110], "expression": "curious", "reason": "weighs the stranger's bold offer" },
            { "frameRange": [110, 240], "triggerPhrase": "wait, my prize", "expression": "shocked", "reason": "realizes the trick too late" }
          ]
        }
      ]
    }
  ]
}`;

  const userPrompt = `EPISODE: "${episode.title}" (${episode.subtitle})
MORAL / THEME: ${episode.beats[episode.beats.length - 1]?.dialogue || episode.subtitle}

CAST:
${castSummary}

FULL SCRIPT (${episode.beats.length} beats):
${beatLines.join('\n')}

Direct the exact frame-range facial expressions for EVERY on-stage actor in EVERY beat. Return ONLY valid raw JSON.`;

  return { systemPrompt, userPrompt };
}

/**
 * Safely applies the Pass-2 AI Emotion Director JSON onto an existing EpisodeScript,
 * locking 100% of visuals, cast, stages, shots, props, and dialogue while aligning
 * every `triggerPhrase` / `frameRange` to flicker-free 60fps `expressionTrack` segments.
 */
export function applyAiEmotionDirection(
  episode: EpisodeScript,
  rawJson: unknown
): { episode: EpisodeScript; directedBeats: number; directedActors: number; totalSegments: number } {
  if (!rawJson || typeof rawJson !== 'object') {
    return { episode, directedBeats: 0, directedActors: 0, totalSegments: 0 };
  }
  const obj = rawJson as Record<string, unknown>;
  const rawBeats = Array.isArray(obj.beats)
    ? obj.beats
    : Array.isArray(obj.directions)
      ? obj.directions
      : [];

  const byId = new Map<string, Record<string, unknown>>();
  rawBeats.forEach((b, idx) => {
    if (!b || typeof b !== 'object') return;
    const bo = b as Record<string, unknown>;
    const idKey = typeof bo.id === 'string' && bo.id.trim() ? bo.id.trim() : episode.beats[idx]?.id;
    if (idKey) byId.set(idKey, bo);
  });

  let directedBeats = 0;
  let directedActors = 0;
  let totalSegments = 0;

  const nextBeats: StoryBeat[] = episode.beats.map((beat) => {
    const dir = byId.get(beat.id);
    if (!dir) return beat;

    const rawActors = Array.isArray(dir.actors)
      ? dir.actors
      : Array.isArray(dir.characters)
        ? dir.characters
        : [];
    const actorDirMap = new Map<string, ExpressionKeyframe[]>();

    for (const aItem of rawActors) {
      if (!aItem || typeof aItem !== 'object') continue;
      const ao = aItem as Record<string, unknown>;
      const cid = String(ao.castId ?? ao.id ?? ao.character ?? '').trim();
      if (!cid) continue;
      const rawSegs = Array.isArray(ao.segments)
        ? ao.segments
        : Array.isArray(ao.expressionTrack)
          ? ao.expressionTrack
          : Array.isArray(ao.frames)
            ? ao.frames
            : [];
      const parsed: ExpressionKeyframe[] = [];
      for (const sItem of rawSegs) {
        if (!sItem || typeof sItem !== 'object') continue;
        const so = sItem as Record<string, unknown>;
        const kf: ExpressionKeyframe = {
          expression: normalizeExpressionId(so.expression ?? so.emotion),
        };
        if (typeof so.triggerPhrase === 'string' && so.triggerPhrase.trim()) {
          kf.triggerPhrase = so.triggerPhrase.trim().slice(0, 80);
        }
        if (typeof so.reason === 'string' && so.reason.trim()) {
          kf.reason = so.reason.trim().slice(0, 120);
        }
        // Prefer phrase-aligned frame when triggerPhrase is found in dialogue (far more accurate than LLM math!)
        const isListener = beat.speakerId !== 'narrator' && beat.speakerId !== cid;
        const alignedFromPhrase =
          kf.triggerPhrase && beat.dialogue
            ? computePhraseTriggerFrame(
                beat.dialogue,
                kf.triggerPhrase,
                beat.duration,
                isListener ? LISTENER_REACTION_LAG_FRAMES : 0
              )
            : null;

        if (alignedFromPhrase !== null && parsed.length > 0) {
          kf.frame = alignedFromPhrase;
        } else if (Array.isArray(so.frameRange) && so.frameRange.length >= 2) {
          const sf = Number(so.frameRange[0]);
          const ef = Number(so.frameRange[1]);
          if (Number.isFinite(sf)) kf.frame = Math.max(0, Math.round(sf));
          if (Number.isFinite(ef)) kf.endFrame = Math.max(1, Math.round(ef));
        } else if (so.startFrame !== undefined && Number.isFinite(Number(so.startFrame))) {
          kf.frame = Math.max(0, Math.round(Number(so.startFrame)));
          if (so.endFrame !== undefined && Number.isFinite(Number(so.endFrame))) {
            kf.endFrame = Math.max(1, Math.round(Number(so.endFrame)));
          }
        } else if (so.frame !== undefined && Number.isFinite(Number(so.frame))) {
          kf.frame = Math.max(0, Math.round(Number(so.frame)));
          if (so.endFrame !== undefined && Number.isFinite(Number(so.endFrame))) {
            kf.endFrame = Math.max(1, Math.round(Number(so.endFrame)));
          }
        } else if (so.at !== undefined && Number.isFinite(Number(so.at))) {
          kf.at = Math.max(0, Math.min(1, Number(so.at)));
        } else if (so.timeSec !== undefined && Number.isFinite(Number(so.timeSec))) {
          kf.timeSec = Math.max(0, Number(so.timeSec));
        } else if (alignedFromPhrase !== null) {
          kf.frame = alignedFromPhrase;
        } else {
          kf.frame = 0;
        }
        parsed.push(kf);
      }

      if (parsed.length > 0) {
        actorDirMap.set(cid, parsed);
      }
    }

    if (actorDirMap.size === 0) return beat;

    let beatTouched = false;
    const nextActors = beat.actors.map((actor) => {
      const rawTrack = actorDirMap.get(actor.castId);
      if (!rawTrack || rawTrack.length === 0) return actor;
      const isListener = beat.speakerId !== 'narrator' && beat.speakerId !== actor.castId;
      const guarded = normalizeAndGuardExpressionTrack(rawTrack, beat, isListener);
      if (guarded.length === 0) return actor;
      beatTouched = true;
      directedActors++;
      totalSegments += guarded.length;
      return {
        ...actor,
        expression: guarded[0].expression,
        expressionTrack: guarded,
      };
    });

    if (beatTouched) directedBeats++;
    return {
      ...beat,
      actors: nextActors,
      // Clear stale beat-level cues on directed beats so per-actor tracks are the single clean source of truth
      expressionCues: beatTouched ? undefined : beat.expressionCues,
    };
  });

  return {
    episode: { ...episode, beats: nextBeats },
    directedBeats,
    directedActors,
    totalSegments,
  };
}

// =========================================================================
// EMOTION QUALITY & CONTINUITY AUDITOR
// =========================================================================

export function auditEpisodeEmotions(episode: EpisodeScript): EmotionAuditReport {
  let totalActorSlots = 0;
  let angrySternSlots = 0;
  let totalSegments = 0;
  let multiCueBeats = 0;
  let multiActorBeats = 0;
  let listenerAliveBeats = 0;
  let withReasonCount = 0;
  let flickerCount = 0;
  const usedExpressions = new Set<ExpressionId>();

  for (const beat of episode.beats) {
    let beatHasMulti = false;
    let beatHasAliveListener = false;
    const isMultiActor = beat.actors.length >= 2 && beat.speakerId !== 'narrator';
    if (isMultiActor) multiActorBeats++;

    for (const actor of beat.actors) {
      totalActorSlots++;
      const track = actor.expressionTrack || [];
      const beatCues = (beat.expressionCues || []).filter((c) => c.castId === actor.castId);
      const count = track.length + beatCues.length;
      totalSegments += Math.max(1, count);

      if (count >= 2) beatHasMulti = true;

      const isListener = beat.speakerId !== 'narrator' && beat.speakerId !== actor.castId;
      if (isListener && (count >= 2 || actor.expression !== 'calm')) {
        beatHasAliveListener = true;
      }

      if (track.length > 0) {
        for (let i = 0; i < track.length; i++) {
          const kf = track[i];
          usedExpressions.add(kf.expression);
          if (kf.reason) withReasonCount++;
          const prevFrame = i > 0 ? track[i - 1].frame : undefined;
          if (typeof kf.frame === 'number' && typeof prevFrame === 'number') {
            if (kf.frame - prevFrame < 30) flickerCount++;
          }
        }
        const angryInTrack = track.filter((k) => k.expression === 'angry' || k.expression === 'stern').length;
        if (angryInTrack / track.length >= 0.7) angrySternSlots++;
      } else {
        usedExpressions.add(actor.expression);
        if (actor.expression === 'angry' || actor.expression === 'stern') angrySternSlots++;
      }
    }

    if (beatHasMulti) multiCueBeats++;
    if (isMultiActor && beatHasAliveListener) listenerAliveBeats++;
  }

  const angrySternPct = totalActorSlots > 0 ? Math.round((angrySternSlots / totalActorSlots) * 100) : 0;
  const listenerAlivePct =
    multiActorBeats > 0 ? Math.round((listenerAliveBeats / multiActorBeats) * 100) : 100;
  const multiCuePct =
    episode.beats.length > 0 ? Math.round((multiCueBeats / episode.beats.length) * 100) : 0;

  let score = 100;
  const issues: string[] = [];

  if (angrySternPct > 42) {
    score -= Math.min(28, Math.round((angrySternPct - 35) * 0.7));
    issues.push(`${angrySternPct}% of faces are stern/angry — run Auto-Direct or AI Direct Emotions for richer warmth & range.`);
  }
  if (multiActorBeats >= 2 && listenerAlivePct < 60) {
    score -= 18;
    issues.push(`Only ${listenerAlivePct}% of silent listeners react on stage — direct listener reactions too.`);
  }
  if (episode.beats.length >= 4 && multiCuePct < 30) {
    score -= 18;
    issues.push(`Only ${multiCueBeats}/${episode.beats.length} scenes have mid-beat frame-range shifts — add phrase-anchored cues.`);
  }
  if (usedExpressions.size < Math.min(4, EXPRESSION_LIST.length) && episode.beats.length >= 4) {
    score -= 10;
    issues.push(`Only ${usedExpressions.size} distinct emotions used across the episode.`);
  }
  if (flickerCount > 0) {
    score -= Math.min(14, flickerCount * 5);
    issues.push(`${flickerCount} expression shift(s) hold <0.5s and may flicker.`);
  }

  score = Math.max(20, Math.min(100, score));
  const grade: EmotionAuditReport['grade'] =
    score >= 88 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : 'D';

  return {
    score,
    grade,
    totalSegments,
    multiCueBeats,
    listenerAlivePct,
    angrySternPct,
    withReasonCount,
    issues,
  };
}
