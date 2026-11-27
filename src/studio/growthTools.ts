/**
 * Katha Studio — Channel Growth & Production Engines
 * Powers:
 *  - #5 Cold Open & Retention Auditor (score + 1-click Cold Open & Pacing Auto-Fix)
 *  - #7 Long-Form Compilation & Cozy Bedtime Anthology Stitcher
 *  - #10 YouTube Launch Packager (5 CTR Titles, Timestamps, .SRT Captions, Tags, Community Poll)
 *  - #4 Multi-Language Localization payload builder & applier
 */
import {
  CameraMoveId,
  CastMember,
  EpisodeScript,
  ShotId,
  StoryBeat,
} from './types';
import {
  AudienceTarget,
  buildTransformativeAttributionFooter,
  buildYppUploadChecklist,
  sanitizeAdSafeText,
} from './monetizationShield';
import {
  LANGUAGE_CATALOG,
  estimateMultilingualDuration,
  getLanguageSpec,
  resolveEpisodeLanguage,
} from './i18n';

// =========================================================================
// #5. COLD OPEN & RETENTION AUDITOR
// =========================================================================
export interface RetentionIssue {
  id: string;
  severity: 'high' | 'medium' | 'tip';
  beatIdx?: number;
  title: string;
  detail: string;
}

export interface MidRollRecommendation {
  timeSec: number;
  formattedTime: string;
  reason: string;
  beatIdx: number;
}

export interface RetentionAuditReport {
  score: number;
  grade: 'S' | 'A' | 'B' | 'C';
  totalDurationSec: number;
  isLongForm: boolean;
  hasColdOpen: boolean;
  stagnantBeats: number[];
  repeatedShotRuns: number[];
  recommendedMidRolls: MidRollRecommendation[];
  issues: RetentionIssue[];
}

export function auditEpisodeRetention(episode: EpisodeScript): RetentionAuditReport {
  const beats = episode.beats || [];
  const issues: RetentionIssue[] = [];
  let score = 100;

  const totalDurationSec = beats.reduce((sum, b) => sum + Math.max(1.2, b.duration), 0);
  const isLongForm = totalDurationSec >= 420; // >= 7 min (approaching / inside 8+ min YouTube Mid-Roll zone)

  // 1. Cold Open Hook Check (First 5 seconds decide 45% of YouTube retention)
  const firstBeat = beats[0];
  const hasColdOpen = Boolean(firstBeat && firstBeat.frame !== 'chapter_title');
  if (!hasColdOpen) {
    score -= 18;
    issues.push({
      id: 'missing_cold_open',
      severity: 'high',
      beatIdx: 0,
      title: 'Opens with static Title Card instead of Cold Open Hook',
      detail:
        'Viewers drop off if the first 3 seconds show a title card. Inject a 3.5s visual cliffhanger beat before the Chapter Title.',
    });
  }

  // 2. Stagnant / Long Beats without camera motion
  const stagnantBeats: number[] = [];
  beats.forEach((b, idx) => {
    const cam = b.cameraMove || 'still';
    if (b.duration >= 4.4 && cam === 'still' && b.frame !== 'moral_card') {
      stagnantBeats.push(idx);
    }
  });
  if (stagnantBeats.length > 0) {
    score -= Math.min(24, stagnantBeats.length * 6);
    issues.push({
      id: 'stagnant_beats',
      severity: stagnantBeats.length >= 2 ? 'high' : 'medium',
      beatIdx: stagnantBeats[0],
      title: `${stagnantBeats.length} scene${stagnantBeats.length > 1 ? 's' : ''} run >4.4s with static camera`,
      detail: `Scenes ${stagnantBeats.slice(0, 12).map((i) => i + 1).join(', ')}${stagnantBeats.length > 12 ? '...' : ''} have no camera push/pan. Adding slow push-ins or pattern-interrupt cuts lifts AVD.`,
    });
  }

  // 3. Consecutive identical shot types (visual monotony)
  const repeatedShotRuns: number[] = [];
  for (let i = 1; i < beats.length; i++) {
    if (beats[i].shot === beats[i - 1].shot && beats[i].frame !== 'moral_card') {
      repeatedShotRuns.push(i);
    }
  }
  if (repeatedShotRuns.length >= 2) {
    score -= Math.min(18, repeatedShotRuns.length * 4);
    issues.push({
      id: 'repeated_shots',
      severity: 'medium',
      beatIdx: repeatedShotRuns[0],
      title: `${repeatedShotRuns.length} back-to-back identical camera framing cuts`,
      detail:
        'Alternating Wide → Close-Up → Two-Shot / Eye-Strip every beat keeps viewers visually locked in.',
    });
  }

  // 4. Audio SFX Punctuation Check
  const sfxCount = beats.filter((b) => b.sfx && b.sfx !== 'none').length;
  if (sfxCount < Math.max(2, Math.floor(beats.length * 0.3))) {
    score -= 12;
    issues.push({
      id: 'low_sfx',
      severity: 'medium',
      title: `Sparse SFX punctuation (${sfxCount}/${beats.length} scenes)`,
      detail:
        'Adding temple bells, sword clashes, thunder, or mystic chimes on turns & reveals acts as an audio pattern interrupt.',
    });
  }

  // 5. Long-Form Stage, Mood & Chapter Rotation Checks (for 7–25+ min episodes)
  if (isLongForm) {
    let maxSameStageRun = 1;
    let curStageRun = 1;
    let longestRunStart = 0;
    for (let i = 1; i < beats.length; i++) {
      if (beats[i].stage === beats[i - 1].stage) {
        curStageRun++;
        if (curStageRun > maxSameStageRun) {
          maxSameStageRun = curStageRun;
          longestRunStart = i - curStageRun + 1;
        }
      } else {
        curStageRun = 1;
      }
    }
    if (maxSameStageRun >= 22) {
      score -= 10;
      issues.push({
        id: 'longform_stage_monotony',
        severity: 'medium',
        beatIdx: longestRunStart,
        title: `Long-Form Stage Fatigue (${maxSameStageRun} consecutive scenes on "${beats[longestRunStart]?.stage.replace(/_/g, ' ')}")`,
        detail:
          'In 8–20 minute stories, shifting stage backdrops every 2–3 minutes (or per Act) resets viewer attention and prevents mid-video drop-off.',
      });
    }

    const uniqueMoods = new Set(beats.map((b) => b.mood));
    if (uniqueMoods.size <= 1 && beats.length >= 25) {
      score -= 8;
      issues.push({
        id: 'longform_mood_monotony',
        severity: 'medium',
        title: 'Single lighting mood across entire Long-Form runtime',
        detail:
          'Click "Auto-Fix Pacing & Pattern Interrupts" to add subtle Act-level mood and atmospheric shifts across chapters.',
      });
    }

    const chapterCardCount = beats.filter((b) => b.frame === 'chapter_title').length;
    if (totalDurationSec >= 480 && chapterCardCount < 2) {
      issues.push({
        id: 'longform_missing_chapters',
        severity: 'tip',
        title: 'Add Act / Chapter Title cards for 8+ min YouTube scrubbing',
        detail:
          'Chapter cards create clean YouTube timeline chapters and natural cliffhanger positions for Mid-Roll Ad Breaks.',
      });
    }
  }

  // 6. Moral / Engagement Payoff Ending Check
  const lastBeat = beats[beats.length - 1];
  if (lastBeat && lastBeat.frame !== 'moral_card') {
    score -= 8;
    issues.push({
      id: 'missing_moral',
      severity: 'tip',
      beatIdx: beats.length - 1,
      title: 'No Moral / Discussion Card at ending',
      detail:
        'Ending on a crisp Moral Card increases end-screen click-throughs and sparks viewer comments.',
    });
  }

  // 7. Compute Cliffhanger-Safe Mid-Roll Ad-Break Timestamps (YouTube enables Mid-Rolls at >= 8:00 / 480s)
  const recommendedMidRolls: MidRollRecommendation[] = [];
  if (totalDurationSec >= 450) {
    let cursor = 0;
    let lastMidRollSec = 0;
    const minFirstAdSec = 105; // Let hook + Act 1 settle before first mid-roll
    const minSpacingSec = 155; // ~2.5 min spacing avoids viewer fatigue
    const tailGuardSec = Math.max(60, totalDurationSec - 65);

    beats.forEach((b, idx) => {
      const beatStart = cursor;
      const dur = Math.max(1.2, b.duration);
      const isActBoundary = idx > 2 && b.frame === 'chapter_title';
      const isDramaticCliffhanger =
        idx > 4 &&
        (b.fx === 'crimson_impact' ||
          b.fx === 'shock_burst' ||
          b.transition === 'crimson_flash' ||
          b.transition === 'diagonal_slash');

      const enoughGap =
        beatStart >= minFirstAdSec &&
        beatStart <= tailGuardSec &&
        (lastMidRollSec === 0 || beatStart - lastMidRollSec >= minSpacingSec);

      if (enoughGap && isActBoundary) {
        recommendedMidRolls.push({
          timeSec: beatStart,
          formattedTime: formatYoutubeTime(beatStart),
          reason: `Before ${b.title || `Scene ${idx + 1}`} (Act transition pause)`,
          beatIdx: idx,
        });
        lastMidRollSec = beatStart;
      } else if (
        enoughGap &&
        isDramaticCliffhanger &&
        beatStart - lastMidRollSec >= minSpacingSec + 30
      ) {
        recommendedMidRolls.push({
          timeSec: beatStart,
          formattedTime: formatYoutubeTime(beatStart),
          reason: `Cliffhanger beat "${b.title || `Scene ${idx + 1}`}"`,
          beatIdx: idx,
        });
        lastMidRollSec = beatStart;
      } else if (
        beatStart >= minFirstAdSec &&
        beatStart <= tailGuardSec &&
        beatStart - lastMidRollSec >= 220
      ) {
        // Fallback natural scene cut every ~3.6 min if no chapter title or FX trigger occurred
        recommendedMidRolls.push({
          timeSec: beatStart,
          formattedTime: formatYoutubeTime(beatStart),
          reason: `Natural scene pause before "${b.title || `Scene ${idx + 1}`}"`,
          beatIdx: idx,
        });
        lastMidRollSec = beatStart;
      }

      cursor += dur;
    });
  }

  const clamped = Math.max(25, Math.min(100, score));
  const grade: RetentionAuditReport['grade'] =
    clamped >= 90 ? 'S' : clamped >= 78 ? 'A' : clamped >= 62 ? 'B' : 'C';

  return {
    score: clamped,
    grade,
    totalDurationSec,
    isLongForm,
    hasColdOpen,
    stagnantBeats,
    repeatedShotRuns,
    recommendedMidRolls,
    issues,
  };
}

/**
 * Injects a punchy 3.5-second high-drama Cold Open cliffhanger beat at index 0
 * by teasing the episode's climax beat with a dramatic close-up + SFX sting!
 */
export function autoInjectColdOpen(episode: EpisodeScript): EpisodeScript {
  if (episode.beats.length === 0) return episode;
  if (episode.beats[0].id.startsWith('cold_open_')) return episode;

  const climax =
    episode.beats.find(
      (b) =>
        b.fx === 'crimson_impact' ||
        b.fx === 'shock_burst' ||
        b.mood === 'crimson_wrath' ||
        b.shot === 'split_faceoff'
    ) ||
    episode.beats[Math.min(episode.beats.length - 1, Math.max(1, Math.floor(episode.beats.length * 0.6)))];

  const coldOpenBeat: StoryBeat = {
    ...climax,
    id: `cold_open_${Date.now().toString(36)}`,
    title: 'Cold Open Hook',
    duration: 3.4,
    frame: 'main',
    shot: climax.actors.length >= 2 ? 'split_faceoff' : 'eye_strip',
    transition: 'diagonal_slash',
    cameraMove: 'slow_push',
    fx: climax.fx !== 'none' ? climax.fx : 'shock_burst',
    sfx: climax.sfx && climax.sfx !== 'none' ? climax.sfx : 'thunder_crack',
    musicEnergy: Math.max(0.82, climax.musicEnergy),
    speakerId: 'narrator',
    speakerLabel: 'Hook',
    dialogue: `Wait until you see how one fatal choice in "${episode.title}" changed everything...`,
  };

  return {
    ...episode,
    beats: [coldOpenBeat, ...episode.beats],
  };
}

/**
 * One-Click Pacing & Pattern-Interrupt Optimizer:
 * Eliminates stagnant camera stretches, varies consecutive identical shots,
 * and adds rhythmic camera pushes & SFX stings without touching dialogue.
 */
export function autoFixRetentionPacing(episode: EpisodeScript): EpisodeScript {
  const shotCycle: ShotId[] = ['wide_stage', 'two_shot', 'closeup_left', 'closeup_right', 'split_faceoff'];
  const camCycle: CameraMoveId[] = ['slow_push', 'pan_right', 'slow_pull', 'pan_left'];
  const longFormMoodCycle: StoryBeat['mood'][] = [
    'twilight_temple',
    'midnight_banyan',
    'golden_durbar',
    'sandstone_dusk',
    'moonlit_marble',
  ];
  const uniqueMoods = new Set(episode.beats.map((b) => b.mood));
  const needsLongFormMoodVariety = episode.beats.length >= 25 && uniqueMoods.size <= 1;

  let actBucket = 0;
  const nextBeats = episode.beats.map((b, idx, arr) => {
    const updated: StoryBeat = { ...b };

    if (idx > 0 && (b.frame === 'chapter_title' || idx % 22 === 0)) {
      actBucket++;
    }

    // Fix static camera on beats >= 3.8s
    if ((!updated.cameraMove || updated.cameraMove === 'still') && updated.duration >= 3.8) {
      updated.cameraMove = camCycle[idx % camCycle.length];
    }

    // Break repeated consecutive shots (except title/moral slates)
    if (
      idx > 0 &&
      updated.frame !== 'moral_card' &&
      updated.frame !== 'chapter_title' &&
      updated.shot === arr[idx - 1].shot
    ) {
      const nextShot = shotCycle.find(
        (s) => s !== updated.shot && (s !== 'split_faceoff' || updated.actors.length >= 2)
      );
      if (nextShot) updated.shot = nextShot;
    }

    // Add subtle audio stings every 3rd beat if missing
    if ((!updated.sfx || updated.sfx === 'none') && idx % 3 === 1) {
      updated.sfx = updated.fx === 'crimson_impact' ? 'sword_clash' : 'mystic_chime';
    }

    // Long-Form Act-level lighting variety so 8–20 minute stories don't stay visually monotone
    if (needsLongFormMoodVariety && actBucket > 0 && updated.frame !== 'moral_card') {
      updated.mood = longFormMoodCycle[actBucket % longFormMoodCycle.length];
    }

    return updated;
  });

  return {
    ...episode,
    beats: nextBeats,
  };
}

// =========================================================================
// #7. LONG-FORM COMPILATION & COZY BEDTIME ANTHOLOGY STITCHER
// =========================================================================
export interface ChapterTimestamp {
  chapterNum: number;
  title: string;
  series: string;
  startSec: number;
  formattedTime: string;
}

export interface AnthologyBeatOrigin {
  sourceEpisodeIdx: number;
  oldBeatId: string;
  newBeatId: string;
}

export interface CompilationResult {
  episode: EpisodeScript;
  timestamps: ChapterTimestamp[];
  totalDurationSec: number;
  beatOriginMap: AnthologyBeatOrigin[];
}

export function formatYoutubeTime(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function compileEpisodesIntoAnthology(
  episodes: EpisodeScript[],
  options: {
    anthologyTitle: string;
    bedtimeMode: boolean;
    includeBumpers: boolean;
  }
): CompilationResult {
  const mergedCast: CastMember[] = [];
  const mergedBeats: StoryBeat[] = [];
  const timestamps: ChapterTimestamp[] = [];
  const beatOriginMap: AnthologyBeatOrigin[] = [];
  let cursorSec = 0;

  episodes.forEach((ep, epIdx) => {
    const prefix = `ch${epIdx + 1}_`;
    const epStyle = ep.visualStyle?.renderStyle;

    // Namespace cast IDs cleanly so two episodes with cast id 'king' never overwrite each other
    const idMap = new Map<string, string>();
    for (const c of ep.cast) {
      const nextId = `${prefix}${c.id}`;
      idMap.set(c.id, nextId);
      mergedCast.push({ ...c, id: nextId });
    }

    timestamps.push({
      chapterNum: epIdx + 1,
      title: ep.title,
      series: ep.series,
      startSec: cursorSec,
      formattedTime: formatYoutubeTime(cursorSec),
    });

    // Optional smooth Anthology Chapter Bumper between stories
    if (options.includeBumpers && epIdx > 0) {
      const firstBeat = ep.beats[0];
      const bumperDur = options.bedtimeMode ? 4.2 : 3.2;
      mergedBeats.push({
        id: `${prefix}bumper`,
        title: `Chapter ${epIdx + 1}: ${ep.series}`,
        duration: bumperDur,
        stage: firstBeat?.stage || 'banyan_clearing',
        mood: options.bedtimeMode ? 'midnight_banyan' : firstBeat?.mood || 'midnight_banyan',
        weather: options.bedtimeMode ? 'fireflies' : 'petals',
        shot: 'wide_stage',
        frame: 'chapter_title',
        transition: 'ink_fade',
        lightSide: 'right',
        prop: firstBeat?.prop || 'diya_lamp',
        propSlot: 'center',
        fx: 'none',
        sfx: 'temple_bell',
        raag: ep.defaultRaag,
        musicEnergy: options.bedtimeMode ? 0.32 : 0.45,
        renderStyle: epStyle,
        actors: firstBeat?.actors.slice(0, 1).map((a) => ({
          ...a,
          slot: 'center',
          castId: idMap.get(a.castId) || a.castId,
        })) || [],
        speakerId: 'narrator',
        speakerLabel: `Chapter ${epIdx + 1}`,
        dialogue: `Chapter ${epIdx + 1} — ${ep.series}: ${ep.title}.`,
        cameraMove: 'slow_push',
      });
      cursorSec += bumperDur;
    }

    // Append all beats from this chapter with namespaced IDs & preserved per-chapter art engine!
    for (const b of ep.beats) {
      const dur = options.bedtimeMode ? Number((b.duration * 1.18).toFixed(1)) : b.duration;
      const mappedActors = b.actors.map((a) => ({
        ...a,
        castId: idMap.get(a.castId) || a.castId,
      }));
      const mappedSpeaker = b.speakerId === 'narrator' ? 'narrator' : idMap.get(b.speakerId) || 'narrator';
      const nextBeatId = `${prefix}${b.id}`;
      beatOriginMap.push({
        sourceEpisodeIdx: epIdx,
        oldBeatId: b.id,
        newBeatId: nextBeatId,
      });
      mergedBeats.push({
        ...b,
        id: nextBeatId,
        duration: dur,
        actors: mappedActors,
        speakerId: mappedSpeaker,
        // Keep each chapter's signature regional Art Engine intact inside the compilation!
        renderStyle: b.renderStyle || epStyle,
        // Cozy Bedtime Mode overrides: softer lighting, fireflies/mist, calmer music & transitions
        ...(options.bedtimeMode
          ? {
              mood: b.mood === 'crimson_wrath' ? 'twilight_temple' : b.mood,
              weather: b.weather === 'embers' ? 'fireflies' : b.weather === 'none' ? 'fireflies' : b.weather,
              transition: b.transition === 'crimson_flash' || b.transition === 'diagonal_slash' ? 'ink_fade' : b.transition,
              musicEnergy: Math.min(0.45, b.musicEnergy * 0.65),
              cameraMove: b.cameraMove === 'impact_shake' ? 'slow_push' : b.cameraMove,
              sfx: b.sfx === 'thunder_crack' || b.sfx === 'sword_clash' ? 'mystic_chime' : b.sfx,
            }
          : {}),
      });
      cursorSec += dur;
    }
  });

  const firstEp = episodes[0];
  const compiled: EpisodeScript = {
    id: `anthology_${Date.now().toString(36)}`,
    series: options.bedtimeMode ? 'Cozy Folklore Bedtime Anthology' : 'World Folklore Anthology',
    shelf: firstEp?.shelf || 'Supernatural & Royal Legends',
    title: options.anthologyTitle.trim() || `${episodes.length} Classic Folklore Tales`,
    subtitle: options.bedtimeMode
      ? 'Warm moonlit stories for sleep, calm & reflection'
      : `${episodes.length}-chapter uninterrupted animated compilation`,
    defaultRaag: firstEp?.defaultRaag || 'bhairavi',
    visualStyle: options.bedtimeMode
      ? {
          renderStyle: firstEp?.visualStyle?.renderStyle || 'chiaroscuro',
          colorGrade: 'warm_gold',
          texture: 'parchment_grain',
          vignette: 0.48,
          shadowContrast: 0.85,
          captionStyle: 'gold_manuscript',
          frameBorder: 'manuscript_margin',
        }
      : firstEp?.visualStyle,
    cast: mergedCast,
    beats: mergedBeats,
  };

  return {
    episode: compiled,
    timestamps,
    totalDurationSec: cursorSec,
    beatOriginMap,
  };
}

// =========================================================================
// #10. YOUTUBE LAUNCH PACKAGER & .SRT SUBTITLE GENERATOR
// =========================================================================
function formatSrtTimestamp(sec: number): string {
  const msTotal = Math.max(0, Math.round(sec * 1000));
  const hrs = Math.floor(msTotal / 3600000);
  const mins = Math.floor((msTotal % 3600000) / 60000);
  const secs = Math.floor((msTotal % 60000) / 1000);
  const ms = msTotal % 1000;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

export function generateSrtCaptions(episode: EpisodeScript): string {
  let cursor = 0;
  let cueIdx = 1;
  const lines: string[] = [];

  for (const beat of episode.beats) {
    const dur = Math.max(1.2, beat.duration);
    const text = (beat.dialogue || '').trim();
    if (text) {
      const start = formatSrtTimestamp(cursor + 0.08);
      const end = formatSrtTimestamp(cursor + dur - 0.08);
      const prefix = beat.speakerLabel && beat.speakerId !== 'narrator' ? `${beat.speakerLabel}: ` : '';
      lines.push(`${cueIdx}\n${start} --> ${end}\n${prefix}${text}\n`);
      cueIdx++;
    }
    cursor += dur;
  }
  return lines.join('\n');
}

export interface YoutubeLaunchPack {
  titles: string[];
  description: string;
  chaptersText: string;
  midRollTimestampsText: string;
  tags: string[];
  hashtags: string[];
  pinnedComment: string;
  communityPoll: {
    question: string;
    options: string[];
  };
  srtContent: string;
  yppChecklistText: string;
}

export function buildYoutubeLaunchPack(
  episode: EpisodeScript,
  options: { audience?: AudienceTarget; voiceClipCount?: number } = {}
): YoutubeLaunchPack {
  const audience: AudienceTarget = options.audience ?? 'general_audience';
  const voiceClipCount = options.voiceClipCount ?? 0;
  const lang = resolveEpisodeLanguage(episode);

  const safeTitle = sanitizeAdSafeText(episode.title).text;
  const safeSubtitle = sanitizeAdSafeText(episode.subtitle || '').text;
  const lead = episode.cast[0]?.name || 'the Hero';
  const rival = episode.cast[1]?.name || 'a Cunning Rival';
  const moralBeat =
    [...episode.beats].reverse().find((b) => b.frame === 'moral_card') ||
    episode.beats[episode.beats.length - 1];
  const safeMoral = moralBeat?.dialogue ? sanitizeAdSafeText(moralBeat.dialogue).text : '';

  // Auto-generate chapter timestamps from title beats or evenly spaced scene markers
  let cursor = 0;
  const chapterRows: string[] = [];
  episode.beats.forEach((b, idx) => {
    if (
      idx === 0 ||
      b.frame === 'chapter_title' ||
      b.frame === 'moral_card' ||
      b.id.startsWith('editorial_') ||
      episode.beats.length <= 10 ||
      idx % Math.max(2, Math.floor(episode.beats.length / 8)) === 0
    ) {
      chapterRows.push(`${formatYoutubeTime(cursor)} ${sanitizeAdSafeText(b.title).text}`);
    }
    cursor += Math.max(1.2, b.duration);
  });
  const chaptersText = chapterRows.join('\n');

  const titles = [
    `${safeTitle} | ${episode.series} (Animated Folklore & Analysis)`,
    `How ${lead} Outsmarted ${rival} — ${safeTitle}`,
    `The Ancient Philosophy Inside "${safeTitle}" (${episode.series})`,
    `${episode.series}: ${safeTitle} — Full Animated Adaptation`,
    `Why Historians Still Study "${safeTitle}" (${episode.series})`,
  ];

  const langExtraTags =
    lang.code !== 'en'
      ? [`${lang.label.toLowerCase()} folklore`, `${lang.label.toLowerCase()} stories`, lang.nativeName]
      : [];

  const baseTags =
    audience === 'made_for_kids'
      ? [
          episode.series.toLowerCase(),
          safeTitle.toLowerCase(),
          (episode.shelf || 'folklore').toLowerCase(),
          'animated folklore',
          'ancient fables',
          'moral stories',
          'world folklore',
          ...langExtraTags,
          lead.toLowerCase(),
          rival.toLowerCase(),
        ]
      : [
          episode.series.toLowerCase(),
          safeTitle.toLowerCase(),
          (episode.shelf || 'folklore').toLowerCase(),
          'animated folklore',
          'mythology documentary',
          'folklore analysis',
          'ancient philosophy',
          'world mythology',
          'cultural storytelling',
          'classical literature',
          ...langExtraTags,
          lead.toLowerCase(),
          rival.toLowerCase(),
        ];

  const tags = Array.from(new Set(baseTags.map((t) => sanitizeAdSafeText(t).text)));

  const cleanTag = (s: string) => {
    const cleaned = s.replace(/[^\p{L}\p{N}]+/gu, '');
    return cleaned ? `#${cleaned}` : '#Folklore';
  };
  const hashtags = [
    cleanTag(episode.series),
    '#AnimatedFolklore',
    '#WorldMythology',
    ...(lang.code !== 'en' ? [cleanTag(lang.label)] : []),
    audience === 'made_for_kids' ? '#ClassicFables' : '#CulturalHistory',
  ];

  const pinnedComment =
    audience === 'made_for_kids'
      ? '(Comments are disabled by YouTube on Made-for-Kids uploads.)'
      : lang.pinnedCommentPrompt(lead, rival);

  const attributionBlock = buildTransformativeAttributionFooter(episode);

  const description = [
    `${safeTitle} — ${safeSubtitle || episode.series}`,
    '',
    lang.code === 'en'
      ? `Watch as ${lead} confronts ${rival} in this original animated adaptation featuring custom 2D staging, expressive acting, authentic regional music, and modern cultural commentary.`
      : `${episode.series} · ${lead} & ${rival} (${lang.nativeName})`,
    '',
    lang.chaptersHeading,
    chaptersText,
    '',
    safeMoral ? `${lang.keyTakeawayHeading}\n"${safeMoral}"\n` : '',
    attributionBlock,
    '',
    audience === 'made_for_kids' ? lang.kidsCta : lang.subscribeCta,
    '',
    hashtags.join(' '),
  ]
    .filter((line) => line !== undefined)
    .join('\n');

  const communityPoll = {
    question: `In "${safeTitle}" (${episode.series}), who showed the sharper strategy?`,
    options: [
      `${lead} — wisdom & patience won the day`,
      `${rival} — clever bold move, almost worked`,
      'Both revealed a timeless psychological truth',
      'Animate another tale from this shelf next!',
    ],
  };

  const yppChecklistText = buildYppUploadChecklist(episode, audience, voiceClipCount);
  const retentionCheck = auditEpisodeRetention(episode);
  const midRollTimestampsText =
    retentionCheck.recommendedMidRolls.length > 0
      ? retentionCheck.recommendedMidRolls
          .map((m) => `${m.formattedTime} — ${m.reason}`)
          .join('\n')
      : '';

  return {
    titles,
    description,
    chaptersText,
    midRollTimestampsText,
    tags,
    hashtags,
    pinnedComment,
    communityPoll,
    srtContent: generateSrtCaptions(episode),
    yppChecklistText,
  };
}

// =========================================================================
// #4. MULTI-LANGUAGE LOCALIZATION ENGINE
// =========================================================================
export interface TargetLanguageOption {
  code: string;
  label: string;
  nativeName: string;
  voiceHint: string;
  dir: 'ltr' | 'rtl';
}

export const TARGET_LANGUAGES: TargetLanguageOption[] = LANGUAGE_CATALOG.map((spec) => ({
  code: spec.code,
  label: spec.label,
  nativeName: spec.nativeName,
  voiceHint: spec.voiceHint,
  dir: spec.dir,
}));

export interface LocalizationPayload {
  language?: string;
  title: string;
  subtitle: string;
  series: string;
  cast?: Array<{
    id: string;
    name: string;
  }>;
  beats: Array<{
    id: string;
    title: string;
    speakerLabel: string;
    dialogue: string;
  }>;
}

export function extractLocalizationPayload(episode: EpisodeScript): LocalizationPayload {
  const lang = resolveEpisodeLanguage(episode);
  return {
    language: lang.code,
    title: episode.title,
    subtitle: episode.subtitle || '',
    series: episode.series,
    cast: episode.cast.map((c) => ({ id: c.id, name: c.name })),
    beats: episode.beats.map((b) => ({
      id: b.id,
      title: b.title,
      speakerLabel: b.speakerLabel,
      dialogue: b.dialogue,
    })),
  };
}

export function applyLocalizedPayload(
  episode: EpisodeScript,
  translated: Partial<LocalizationPayload>,
  langCode: string
): EpisodeScript {
  const normalizedLang = getLanguageSpec(langCode).code;
  const beatMap = new Map<string, { title?: string; speakerLabel?: string; dialogue?: string }>();
  if (Array.isArray(translated.beats)) {
    for (const item of translated.beats) {
      if (item && typeof item.id === 'string') {
        beatMap.set(item.id, item);
      }
    }
  }

  const castNameMap = new Map<string, string>();
  if (Array.isArray(translated.cast)) {
    for (const c of translated.cast) {
      if (c && typeof c.id === 'string' && typeof c.name === 'string' && c.name.trim()) {
        castNameMap.set(c.id, c.name.trim());
      }
    }
  }

  return {
    ...episode,
    id: `${episode.id.replace(/_[a-z]{2}$/, '')}_${normalizedLang}`,
    language: normalizedLang,
    series: typeof translated.series === 'string' && translated.series.trim() ? translated.series.trim() : episode.series,
    title: typeof translated.title === 'string' && translated.title.trim() ? translated.title.trim() : episode.title,
    subtitle:
      typeof translated.subtitle === 'string' && translated.subtitle.trim()
        ? translated.subtitle.trim()
        : episode.subtitle,
    cast: episode.cast.map((c) => {
      const nextName = castNameMap.get(c.id);
      return nextName ? { ...c, name: nextName } : c;
    }),
    beats: episode.beats.map((b) => {
      const match = beatMap.get(b.id);
      if (!match) return b;
      const nextDialogue =
        typeof match.dialogue === 'string' && match.dialogue.trim()
          ? match.dialogue.trim()
          : b.dialogue;
      // Smoothly adjust duration for CJK/Indic/Romance length shifts when translated text differs
      const est = estimateMultilingualDuration(nextDialogue, b.frame);
      const nextDuration =
        nextDialogue !== b.dialogue && Math.abs(est - b.duration) > 0.65
          ? est
          : b.duration;
      return {
        ...b,
        duration: nextDuration,
        title: typeof match.title === 'string' && match.title.trim() ? match.title.trim() : b.title,
        speakerLabel:
          typeof match.speakerLabel === 'string' && match.speakerLabel.trim()
            ? match.speakerLabel.trim()
            : b.speakerLabel,
        dialogue: nextDialogue,
      };
    }),
  };
}
