/**
 * Katha Studio — Upgrade #9: Persistent "Channel Universe" Cast Bible & Recurring Host
 * Saves locked character visual identities (palette, headgear, marks, scale, signature voice)
 * across episodes in localStorage so recurring heroes stay 100% consistent across your channel!
 */
import { CastMember, EpisodeScript, StoryBeat } from './types';

export interface CastBibleEntry {
  key: string; // normalized lowercase character name or canonical key
  name: string;
  roleNote: string;
  isHost?: boolean;
  member: Omit<CastMember, 'id'>;
  preferredVoice?: string;
}

const STORAGE_KEY = 'katha_studio_cast_bible_v1';
export const CAST_BIBLE_UPDATED_EVENT = 'katha:cast-bible-updated';

export const DEFAULT_CAST_BIBLE: CastBibleEntry[] = [
  {
    key: 'channel_host',
    name: 'Sutradhar (Channel Host)',
    roleNote: 'Recurring fireside host for episode intros & moral outros',
    isHost: true,
    member: {
      name: 'Sutradhar',
      archetype: 'sage',
      primaryColor: '#8c2432',
      accentColor: '#f2c85b',
      skinColor: '#dca076',
      headgear: 'royal_turban',
      mark: 'vermilion_tilak',
      scale: 1.0,
    },
    preferredVoice: 'Charon',
  },
  {
    key: 'king vikramaditya',
    name: 'King Vikramaditya',
    roleNote: 'Vikram & Betaal / Singhasan Battisi recurring royal hero',
    member: {
      name: 'King Vikramaditya',
      archetype: 'king',
      primaryColor: '#d91a36',
      accentColor: '#ffd04d',
      skinColor: '#e09a6e',
      headgear: 'golden_mukut',
      mark: 'royal_mustache',
      scale: 1.04,
    },
    preferredVoice: 'Fenrir',
  },
  {
    key: 'betaal',
    name: 'Betaal',
    roleNote: 'Iconic moonlit riddle spirit',
    member: {
      name: 'Betaal',
      archetype: 'spirit',
      primaryColor: '#1d2747',
      accentColor: '#ff173d',
      skinColor: '#cfe2f7',
      scale: 1.0,
    },
    preferredVoice: 'Puck',
  },
  {
    key: 'tenali rama',
    name: 'Tenali Rama',
    roleNote: 'Vijayanagara court jester & master strategist',
    member: {
      name: 'Tenali Rama',
      archetype: 'courtier',
      primaryColor: '#e8792c',
      accentColor: '#ffd04d',
      skinColor: '#e09d70',
      mark: 'vermilion_tilak',
      scale: 1.0,
    },
    preferredVoice: 'Puck',
  },
  {
    key: 'anansi the spider',
    name: 'Anansi the Spider',
    roleNote: 'West African Akan griot trickster hero',
    member: {
      name: 'Anansi the Spider',
      archetype: 'spider',
      primaryColor: '#1e1624',
      accentColor: '#f2be38',
      skinColor: '#2d2236',
      scale: 1.0,
    },
    preferredVoice: 'Puck',
  },
  {
    key: 'sun wukong',
    name: 'Sun Wukong',
    roleNote: 'The Monkey King from Journey to the West',
    member: {
      name: 'Sun Wukong',
      archetype: 'vanara_hero',
      primaryColor: '#cf3822',
      accentColor: '#f5c747',
      skinColor: '#e0a26e',
      scale: 1.04,
    },
    preferredVoice: 'Fenrir',
  },
  {
    key: 'trickster raven',
    name: 'Trickster Raven',
    roleNote: 'Pacific NW Indigenous mythic hero',
    member: {
      name: 'Trickster Raven',
      archetype: 'raven',
      primaryColor: '#161d2e',
      accentColor: '#3ec7c4',
      skinColor: '#242c42',
      scale: 1.02,
    },
    preferredVoice: 'Charon',
  },
];

export function loadCastBible(): CastBibleEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CAST_BIBLE;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CAST_BIBLE;
    return parsed as CastBibleEntry[];
  } catch {
    return DEFAULT_CAST_BIBLE;
  }
}

export function saveCastBible(entries: CastBibleEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CAST_BIBLE_UPDATED_EVENT, { detail: entries }));
    }
  } catch {
    // ignore storage quota errors
  }
}

export function upsertMemberInBible(
  entries: CastBibleEntry[],
  cast: CastMember,
  roleNote = 'Locked Channel Cast Member'
): CastBibleEntry[] {
  const key = cast.name.trim().toLowerCase();
  const nextEntry: CastBibleEntry = {
    key,
    name: cast.name,
    roleNote,
    member: {
      name: cast.name,
      archetype: cast.archetype,
      primaryColor: cast.primaryColor,
      accentColor: cast.accentColor,
      skinColor: cast.skinColor,
      mark: cast.mark,
      headgear: cast.headgear,
      scale: cast.scale,
      ...(cast.dna ? { dna: JSON.parse(JSON.stringify(cast.dna)) } : {}),
    },
  };
  const exists = entries.some((e) => e.key === key);
  const next = exists ? entries.map((e) => (e.key === key ? { ...e, ...nextEntry } : e)) : [...entries, nextEntry];
  saveCastBible(next);
  return next;
}

/**
 * Syncs matching characters in the current episode with your locked Cast Bible visual identity!
 */
export function applyCastBibleToEpisode(
  episode: EpisodeScript,
  bible: CastBibleEntry[]
): { episode: EpisodeScript; matchedCount: number } {
  let matchedCount = 0;
  const nextCast = episode.cast.map((c) => {
    const nameKey = c.name.trim().toLowerCase();
    const match = bible.find(
      (b) => !b.isHost && (b.key === nameKey || nameKey.includes(b.key) || b.key.includes(nameKey))
    );
    if (!match) return c;
    matchedCount++;
    return {
      ...c,
      archetype: match.member.archetype,
      primaryColor: match.member.primaryColor,
      accentColor: match.member.accentColor,
      skinColor: match.member.skinColor ?? c.skinColor,
      mark: match.member.mark ?? c.mark,
      headgear: match.member.headgear ?? c.headgear,
      scale: match.member.scale ?? c.scale,
      ...(match.member.dna ? { dna: JSON.parse(JSON.stringify(match.member.dna)) } : {}),
    };
  });

  return {
    episode: { ...episode, cast: nextCast },
    matchedCount,
  };
}

/**
 * Injects your Recurring Channel Host as a fireside Intro & Outro bookend
 * so every video on your channel feels like a cohesive signature series!
 */
export function injectChannelHostBookends(
  episode: EpisodeScript,
  hostEntry: CastBibleEntry
): EpisodeScript {
  const hostId = 'channel_host';
  const hasHost = episode.cast.some((c) => c.id === hostId);
  const nextCast: CastMember[] = hasHost
    ? episode.cast
    : [...episode.cast, { id: hostId, ...hostEntry.member }];

  const firstBeat = episode.beats[0];
  const lastBeat = episode.beats[episode.beats.length - 1];

  const introBeat: StoryBeat = {
    id: `host_intro_${Date.now().toString(36)}`,
    title: `${hostEntry.member.name} Intro`,
    duration: 4.0,
    stage: firstBeat?.stage || 'banyan_clearing',
    mood: 'twilight_temple',
    weather: 'fireflies',
    shot: 'closeup_left',
    transition: 'ink_fade',
    lightSide: 'right',
    prop: 'diya_lamp',
    propSlot: 'right',
    fx: 'none',
    sfx: 'temple_bell',
    raag: episode.defaultRaag,
    musicEnergy: 0.45,
    cameraMove: 'slow_push',
    actors: [{ castId: hostId, slot: 'left', pose: 'gesture', expression: 'calm', facing: 'right' }],
    speakerId: hostId,
    speakerLabel: hostEntry.member.name,
    dialogue: `Welcome back, traveler. Gather close tonight for a timeless legend from ${episode.series}: ${episode.title}.`,
  };

  const outroBeat: StoryBeat = {
    id: `host_outro_${Date.now().toString(36)}`,
    title: `${hostEntry.member.name} Sign-Off`,
    duration: 4.0,
    stage: lastBeat?.stage || 'banyan_clearing',
    mood: 'golden_durbar',
    weather: 'fireflies',
    shot: 'closeup_left',
    transition: 'ink_fade',
    lightSide: 'right',
    prop: 'diya_lamp',
    propSlot: 'right',
    fx: 'divine_aura',
    sfx: 'mystic_chime',
    raag: episode.defaultRaag,
    musicEnergy: 0.42,
    cameraMove: 'slow_pull',
    actors: [{ castId: hostId, slot: 'left', pose: 'gesture', expression: 'joy', facing: 'right' }],
    speakerId: hostId,
    speakerLabel: hostEntry.member.name,
    dialogue: `What lesson stays with you tonight? Share your thoughts below, and subscribe for our next fireside tale.`,
  };

  const filteredBeats = episode.beats.filter(
    (b) => !b.id.startsWith('host_intro_') && !b.id.startsWith('host_outro_')
  );

  return {
    ...episode,
    cast: nextCast,
    beats: [introBeat, ...filteredBeats, outroBeat],
  };
}
