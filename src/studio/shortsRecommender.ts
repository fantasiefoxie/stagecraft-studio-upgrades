import { EpisodeScript, StoryBeat, resolveVisualStyle } from './types';

export interface RecommendedShortSlice {
  id: string;
  startIdx: number;
  endIdx: number;
  beatCount: number;
  durationSec: number;
  score: number;
  suggestedHook: string;
  reasonTag: string;
  summary: string;
}

const HOOK_KEYWORDS = [
  'never',
  'secret',
  'truth',
  'why',
  'how',
  'stop',
  'wait',
  'betray',
  'curse',
  'riddle',
  'trap',
  'kill',
  'dead',
  'gold',
  'king',
  'god',
  'shock',
  'prove',
  'mistake',
  'rule',
  'warning',
  'promise',
];

const HIGH_INTENSITY_EXPRESSIONS = new Set([
  'angry',
  'fierce',
  'shocked',
  'afraid',
  'determined',
  'scheming',
  'mischievous',
  'triumphant',
]);

function beatHookStrength(beat: StoryBeat): number {
  let pts = 0;
  const text = (beat.dialogue || '').trim();
  const lower = text.toLowerCase();
  if (text.includes('?')) pts += 14;
  if (text.includes('!')) pts += 10;
  if (text.length >= 20 && text.length <= 145) pts += 8;
  for (const kw of HOOK_KEYWORDS) {
    if (lower.includes(kw)) {
      pts += 5;
      break;
    }
  }
  if (
    beat.shot === 'closeup_left' ||
    beat.shot === 'closeup_right' ||
    beat.shot === 'motion_card' ||
    beat.shot === 'prop_spotlight' ||
    beat.shot === 'split_faceoff'
  ) {
    pts += 7;
  }
  if (beat.fx && beat.fx !== 'none') pts += 6;
  if (beat.sfx && beat.sfx !== 'none') pts += 5;
  if (beat.frame === 'chapter_title') pts -= 14;
  return pts;
}

function buildSuggestedHook(beats: StoryBeat[], episodeTitle: string): string {
  const firstSpoken = beats.find((b) => b.dialogue.trim().length > 8) || beats[0];
  if (!firstSpoken) return episodeTitle.toUpperCase().slice(0, 42);
  const raw = firstSpoken.dialogue.trim();
  // Prefer a punchy question or exclamation sentence if short enough
  const sentences = raw
    .split(/(?<=[?!.])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const punchy = sentences.find((s) => (s.includes('?') || s.includes('!')) && s.length <= 54);
  if (punchy) return punchy.toUpperCase();
  const titleSeed = firstSpoken.title?.trim() || episodeTitle;
  return titleSeed.toUpperCase().slice(0, 44);
}

/**
 * Deterministic Viral Shorts Auto-Recommender.
 * Scans every contiguous beat window (18s..58s, or best fallback for short episodes),
 * scores windows on hook punch, action cues/FX/SFX variety, 28..48s Shorts sweet-spot pacing,
 * and emotional expression arc, then returns top non-overlapping candidates.
 */
export function recommendTopShortSlices(
  episode: EpisodeScript,
  maxResults = 3
): RecommendedShortSlice[] {
  const beats = episode.beats || [];
  if (beats.length === 0) return [];

  const totalEpisodeDur = beats.reduce((s, b) => s + Math.max(1.2, b.duration), 0);
  const minTargetDur = totalEpisodeDur < 20 ? Math.max(3, totalEpisodeDur * 0.45) : 18;
  const maxTargetDur = 58;

  interface RawCandidate {
    startIdx: number;
    endIdx: number;
    durationSec: number;
    score: number;
    reasonTag: string;
  }

  const candidates: RawCandidate[] = [];

  for (let start = 0; start < beats.length; start++) {
    let dur = 0;
    for (let end = start; end < beats.length; end++) {
      dur += Math.max(1.2, beats[end].duration);
      if (dur > maxTargetDur && end > start) break;
      if (dur < minTargetDur && end < beats.length - 1) continue;

      const slice = beats.slice(start, end + 1);
      let score = 40;

      // 1. Duration sweet-spot (28..48s performs best for YouTube Shorts / Reels retention)
      if (dur >= 28 && dur <= 48) {
        score += 22;
      } else if (dur >= 18 && dur <= 56) {
        score += 14;
      } else if (dur <= 60) {
        score += 6;
      }

      // 2. Opening hook strength (first beat of slice)
      const hookPts = beatHookStrength(slice[0]);
      score += hookPts;

      // 3. Visual & audio kinetic density (action cues, FX, SFX, shot variety)
      const uniqueShots = new Set<string>();
      const uniqueStages = new Set<string>();
      const uniqueExpressions = new Set<string>();
      let cueCount = 0;
      let fxCount = 0;
      let sfxCount = 0;
      let highIntensityCount = 0;

      for (const b of slice) {
        uniqueShots.add(b.shot);
        uniqueStages.add(b.stage);
        if (b.actionCues && b.actionCues.length > 0) cueCount += b.actionCues.length;
        if (b.fx && b.fx !== 'none') fxCount++;
        if (b.sfx && b.sfx !== 'none') sfxCount++;
        for (const a of b.actors) {
          uniqueExpressions.add(a.expression);
          if (HIGH_INTENSITY_EXPRESSIONS.has(a.expression)) highIntensityCount++;
        }
      }

      score += Math.min(18, uniqueShots.size * 5);
      score += Math.min(10, uniqueStages.size * 4);
      score += Math.min(16, cueCount * 5 + fxCount * 3 + sfxCount * 3);
      score += Math.min(14, uniqueExpressions.size * 3 + Math.min(4, highIntensityCount * 2));

      // 4. Closing punchline/payoff bonus
      const lastBeat = slice[slice.length - 1];
      if (
        lastBeat.dialogue.includes('!') ||
        lastBeat.dialogue.includes('?') ||
        lastBeat.fx !== 'none' ||
        lastBeat.shot === 'closeup_left' ||
        lastBeat.shot === 'closeup_right' ||
        lastBeat.shot === 'motion_card' ||
        lastBeat.shot === 'prop_spotlight'
      ) {
        score += 8;
      }

      // Avoid starting cleanly on a chapter title divider if a spoken beat is right next
      if (slice[0].frame === 'chapter_title' && slice.length > 1) {
        score -= 10;
      }

      let reasonTag = 'Balanced Pacing';
      if (hookPts >= 18) reasonTag = 'Strong Hook';
      else if (cueCount >= 2 || fxCount + sfxCount >= 3) reasonTag = 'High Action / FX';
      else if (uniqueExpressions.size >= 3) reasonTag = 'Dramatic Arc';
      else if (dur >= 28 && dur <= 48) reasonTag = 'Ideal 30–45s Sweet Spot';

      candidates.push({
        startIdx: start,
        endIdx: end,
        durationSec: Number(dur.toFixed(1)),
        score: Math.round(score),
        reasonTag,
      });
    }
  }

  // Fallback for ultra-short single-beat episodes
  if (candidates.length === 0) {
    candidates.push({
      startIdx: 0,
      endIdx: beats.length - 1,
      durationSec: Number(totalEpisodeDur.toFixed(1)),
      score: 60,
      reasonTag: 'Full Highlight',
    });
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.startIdx !== b.startIdx) return a.startIdx - b.startIdx;
    return a.endIdx - b.endIdx;
  });

  // Pick top non-heavily-overlapping windows (<50% beat overlap)
  const picked: RecommendedShortSlice[] = [];
  for (const cand of candidates) {
    if (picked.length >= Math.max(1, maxResults)) break;
    const candLen = cand.endIdx - cand.startIdx + 1;
    const tooClose = picked.some((p) => {
      const ovStart = Math.max(p.startIdx, cand.startIdx);
      const ovEnd = Math.min(p.endIdx, cand.endIdx);
      const overlap = Math.max(0, ovEnd - ovStart + 1);
      const minLen = Math.min(candLen, p.endIdx - p.startIdx + 1);
      return overlap / Math.max(1, minLen) > 0.5;
    });
    if (tooClose) continue;

    const sliceBeats = beats.slice(cand.startIdx, cand.endIdx + 1);
    const first = sliceBeats[0];
    const last = sliceBeats[sliceBeats.length - 1];
    picked.push({
      id: `short_${cand.startIdx + 1}_${cand.endIdx + 1}`,
      startIdx: cand.startIdx,
      endIdx: cand.endIdx,
      beatCount: sliceBeats.length,
      durationSec: cand.durationSec,
      score: Math.min(99, Math.max(1, cand.score)),
      suggestedHook: buildSuggestedHook(sliceBeats, episode.title),
      reasonTag: cand.reasonTag,
      summary:
        first.id === last.id
          ? first.title
          : `${first.title} → ${last.title}`,
    });
  }

  return picked;
}

/**
 * Pure deterministic builder that extracts a standalone 9:16 Short EpisodeScript
 * from any contiguous beat range `[startIdx..endIdx]`, with optional 2s hook title slate
 * and Shorts Bold Pop caption styling.
 */
export function buildShortSliceEpisode(
  episode: EpisodeScript,
  startIdx: number,
  endIdx: number,
  hookTitle: string,
  useShortsPopCaptions: boolean
): EpisodeScript {
  const total = episode.beats.length;
  const safeStart = Math.max(0, Math.min(startIdx, Math.max(0, total - 1)));
  const safeEnd = Math.max(safeStart, Math.min(endIdx, Math.max(0, total - 1)));
  const slicedBeats = episode.beats.slice(safeStart, safeEnd + 1);
  const firstBeat = slicedBeats[0] || episode.beats[0];

  const cleanHook = hookTitle.trim();
  const finalBeats: StoryBeat[] = [];
  if (cleanHook && firstBeat) {
    finalBeats.push({
      ...firstBeat,
      id: `short_hook_${safeStart + 1}`,
      title: cleanHook.slice(0, 48),
      duration: 2.0,
      frame: 'chapter_title',
      shot: 'wide_stage',
      transition: 'crimson_flash',
      fx: 'shock_burst',
      sfx: 'temple_bell',
      sfxOffsetSec: 0,
      speakerId: 'narrator',
      speakerLabel: episode.series,
      dialogue: cleanHook,
      actionCues: undefined,
    });
  }
  finalBeats.push(...slicedBeats);

  const resolvedLook = resolveVisualStyle(episode.visualStyle);

  return {
    ...episode,
    id: `${episode.id}_short_${safeStart + 1}_${safeEnd + 1}`,
    title: cleanHook || `${episode.title} (Short)`,
    visualStyle: {
      ...resolvedLook,
      captionStyle: useShortsPopCaptions ? 'shorts_bold_pop' : resolvedLook.captionStyle,
      autoTrackSpeaker: true,
    },
    beats: finalBeats,
  };
}
