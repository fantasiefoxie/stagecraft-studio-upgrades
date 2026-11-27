/**
 * Katha Studio — Season / Series Production Board & "Previously On..." Recap Builder (Upgrade 7)
 * Tracks episodes across a season pipeline (Idea -> Scripted -> Voiced -> Rendered -> Published)
 * and builds 1-click "Previously On..." Cold Open Recap beats linking sequential episodes.
 */
import { EpisodeScript, StoryBeat, getEpisodeDuration } from './types';
import { resolveEpisodeLanguage } from './i18n';

export type ProductionStatus = 'idea' | 'scripted' | 'voiced' | 'rendered' | 'published';

export const PRODUCTION_STATUS_ORDER: ProductionStatus[] = [
  'idea',
  'scripted',
  'voiced',
  'rendered',
  'published',
];

export const PRODUCTION_STATUS_LABELS: Record<ProductionStatus, string> = {
  idea: 'Idea',
  scripted: 'Scripted',
  voiced: 'Voiced',
  rendered: 'Rendered',
  published: 'Published',
};

export interface SeasonEpisodeCard {
  id: string;
  episodeNumber: number;
  series: string;
  title: string;
  subtitle: string;
  language: string;
  status: ProductionStatus;
  beatCount: number;
  durationSec: number;
  recapSummary: string;
  notes: string;
  updatedAt: number;
}

export const SEASON_BOARD_STORAGE_KEY = 'katha_studio_season_board_v1';

export function loadSeasonBoard(): SeasonEpisodeCard[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(SEASON_BOARD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is SeasonEpisodeCard => Boolean(item && typeof item.id === 'string' && typeof item.title === 'string'))
      .sort((a, b) => a.episodeNumber - b.episodeNumber);
  } catch {
    return [];
  }
}

export function saveSeasonBoard(cards: SeasonEpisodeCard[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(SEASON_BOARD_STORAGE_KEY, JSON.stringify(cards));
  } catch {
    // ignore storage quota errors
  }
}

export function upsertEpisodeInSeasonBoard(
  cards: SeasonEpisodeCard[],
  episode: EpisodeScript,
  status: ProductionStatus = 'scripted'
): SeasonEpisodeCard[] {
  const existing = cards.find((c) => c.id === episode.id);
  const lang = resolveEpisodeLanguage(episode);
  const durationSec = Math.round(getEpisodeDuration(episode));
  const lastDialogue =
    episode.beats.find((b) => b.frame === 'moral_card')?.dialogue ||
    episode.beats[episode.beats.length - 1]?.dialogue ||
    episode.subtitle ||
    episode.title;

  const nextCard: SeasonEpisodeCard = {
    id: episode.id,
    episodeNumber: existing ? existing.episodeNumber : cards.length + 1,
    series: episode.series || 'Folklore Chronicles',
    title: episode.title,
    subtitle: episode.subtitle || '',
    language: lang.code,
    status: existing ? existing.status : status,
    beatCount: episode.beats.length,
    durationSec,
    recapSummary: existing?.recapSummary || lastDialogue.slice(0, 180),
    notes: existing?.notes || '',
    updatedAt: Date.now(),
  };

  const next = existing
    ? cards.map((c) => (c.id === episode.id ? nextCard : c))
    : [...cards, nextCard];
  saveSeasonBoard(next);
  return next;
}

export function advanceCardStatus(
  cards: SeasonEpisodeCard[],
  id: string,
  status: ProductionStatus
): SeasonEpisodeCard[] {
  const next = cards.map((c) =>
    c.id === id ? { ...c, status, updatedAt: Date.now() } : c
  );
  saveSeasonBoard(next);
  return next;
}

export function removeCardFromSeasonBoard(
  cards: SeasonEpisodeCard[],
  id: string
): SeasonEpisodeCard[] {
  const next = cards.filter((c) => c.id !== id);
  saveSeasonBoard(next);
  return next;
}

/**
 * Generates a 1-click "Previously On..." Cold Open Recap beat linking a prior season episode
 * directly into the opening of the current episode.
 */
export function buildPreviouslyOnRecapBeat(
  previousCard: Pick<SeasonEpisodeCard, 'episodeNumber' | 'series' | 'title' | 'recapSummary'>,
  currentEpisode: EpisodeScript
): StoryBeat {
  const firstBeat = currentEpisode.beats[0];
  const leadActor = currentEpisode.cast[0];
  const summary = previousCard.recapSummary.trim()
    ? previousCard.recapSummary.trim()
    : `our heroes faced the trial of "${previousCard.title}".`;

  const dialogue = `Previously on ${previousCard.series || currentEpisode.series}, Episode ${previousCard.episodeNumber} — ${previousCard.title}: ${summary}`;

  return {
    id: `recap_ep${previousCard.episodeNumber}_${Date.now().toString(36)}`,
    title: `Previously On: Ep ${previousCard.episodeNumber}`,
    duration: 5.2,
    stage: firstBeat?.stage || 'banyan_clearing',
    mood: 'twilight_temple',
    weather: 'mist',
    shot: 'wide_stage',
    frame: 'nested_story',
    transition: 'ink_fade',
    lightSide: 'left',
    prop: firstBeat?.prop || 'royal_scroll',
    propSlot: 'center',
    fx: 'none',
    sfx: 'temple_bell',
    raag: currentEpisode.defaultRaag,
    musicEnergy: 0.48,
    cameraMove: 'slow_push',
    actors: leadActor
      ? [{ castId: leadActor.id, slot: 'left', pose: 'stand', expression: 'calm', facing: 'right' }]
      : [],
    speakerId: 'narrator',
    speakerLabel: 'Previously On',
    dialogue,
  };
}
