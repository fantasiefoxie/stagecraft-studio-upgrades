/**
 * Katha Studio — Persistent Channel Brand Kit & YouTube End-Screen Builder
 * Stores channel identity, raster-validated corner watermark logo, and End-Screen
 * safe-zone card copy across all episodes and exports.
 */
import type { EpisodeScript, StoryBeat } from './types';
import { resolveEpisodeLanguage } from './i18n';

export type WatermarkCorner = 'top_right' | 'top_left' | 'bottom_right' | 'bottom_left';

export interface ChannelBrandKit {
  channelName: string;
  tagline: string;
  logoDataUrl?: string;
  logoCorner: WatermarkCorner;
  logoOpacity: number; // 0.15 .. 1.0
  showWatermark: boolean;
  endScreenHeadline: string;
  nextVideoLabel: string;
  playlistLabel: string;
}

export const BRAND_KIT_STORAGE_KEY = 'katha_studio_brand_kit_v1';
export const BRAND_KIT_UPDATED_EVENT = 'katha-brand-kit-updated';
const SAFE_RASTER_DATA_URL_RE = /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=\s]+$/;
const MAX_LOGO_DATA_URL_LEN = 5_500_000;

export const DEFAULT_BRAND_KIT: ChannelBrandKit = {
  channelName: 'Katha Chronicles',
  tagline: 'Timeless Indian & World Folklore Animated',
  logoDataUrl: undefined,
  logoCorner: 'top_right',
  logoOpacity: 0.72,
  showWatermark: false,
  endScreenHeadline: 'Continue the Journey',
  nextVideoLabel: 'WATCH NEXT TALE',
  playlistLabel: 'FULL FOLKLORE SERIES',
};

export function sanitizeRasterDataUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_LOGO_DATA_URL_LEN) return undefined;
  return SAFE_RASTER_DATA_URL_RE.test(trimmed) ? trimmed : undefined;
}

export function normalizeBrandKit(raw: unknown): ChannelBrandKit {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_BRAND_KIT };
  const obj = raw as Partial<ChannelBrandKit>;
  const validCorners: WatermarkCorner[] = ['top_right', 'top_left', 'bottom_right', 'bottom_left'];
  const opacity = Number(obj.logoOpacity);
  return {
    channelName:
      typeof obj.channelName === 'string' && obj.channelName.trim()
        ? obj.channelName.trim().slice(0, 60)
        : DEFAULT_BRAND_KIT.channelName,
    tagline:
      typeof obj.tagline === 'string' && obj.tagline.trim()
        ? obj.tagline.trim().slice(0, 100)
        : DEFAULT_BRAND_KIT.tagline,
    logoDataUrl: sanitizeRasterDataUrl(obj.logoDataUrl),
    logoCorner: validCorners.includes(obj.logoCorner as WatermarkCorner)
      ? (obj.logoCorner as WatermarkCorner)
      : DEFAULT_BRAND_KIT.logoCorner,
    logoOpacity: Number.isFinite(opacity)
      ? Number(Math.max(0.15, Math.min(1, opacity)).toFixed(2))
      : DEFAULT_BRAND_KIT.logoOpacity,
    showWatermark: Boolean(obj.showWatermark),
    endScreenHeadline:
      typeof obj.endScreenHeadline === 'string' && obj.endScreenHeadline.trim()
        ? obj.endScreenHeadline.trim().slice(0, 60)
        : DEFAULT_BRAND_KIT.endScreenHeadline,
    nextVideoLabel:
      typeof obj.nextVideoLabel === 'string' && obj.nextVideoLabel.trim()
        ? obj.nextVideoLabel.trim().slice(0, 40)
        : DEFAULT_BRAND_KIT.nextVideoLabel,
    playlistLabel:
      typeof obj.playlistLabel === 'string' && obj.playlistLabel.trim()
        ? obj.playlistLabel.trim().slice(0, 40)
        : DEFAULT_BRAND_KIT.playlistLabel,
  };
}

let cachedBrandKit: ChannelBrandKit | null = null;

export function loadBrandKit(): ChannelBrandKit {
  if (cachedBrandKit) return cachedBrandKit;
  if (typeof localStorage === 'undefined') {
    cachedBrandKit = { ...DEFAULT_BRAND_KIT };
    return cachedBrandKit;
  }
  try {
    const raw = localStorage.getItem(BRAND_KIT_STORAGE_KEY);
    cachedBrandKit = raw ? normalizeBrandKit(JSON.parse(raw)) : { ...DEFAULT_BRAND_KIT };
  } catch {
    cachedBrandKit = { ...DEFAULT_BRAND_KIT };
  }
  return cachedBrandKit;
}

export function saveBrandKit(next: Partial<ChannelBrandKit>): ChannelBrandKit {
  const merged = normalizeBrandKit({ ...loadBrandKit(), ...next });
  cachedBrandKit = merged;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(BRAND_KIT_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // Ignore quota errors cleanly
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BRAND_KIT_UPDATED_EVENT, { detail: merged }));
  }
  return merged;
}

/**
 * Creates a YouTube-compliant 12-second animated End-Screen Outro beat whose layout
 * aligns directly with YouTube Studio's 2x 16:9 video card slots + center Subscribe circle.
 */
export function createYoutubeEndScreenBeat(
  episode: EpisodeScript,
  brandKit: ChannelBrandKit = loadBrandKit()
): StoryBeat {
  const lastBeat = episode.beats[episode.beats.length - 1];
  const lang = resolveEpisodeLanguage(episode);
  const leadActor = lastBeat?.actors?.[0] || {
    castId: episode.cast[0]?.id || 'hero',
    slot: 'center' as const,
    pose: 'stand' as const,
    expression: 'warm' as const,
    facing: 'right' as const,
    motion: 'still' as const,
  };

  return {
    id: `end_screen_${Date.now().toString(36)}`,
    title: brandKit.endScreenHeadline || 'Continue the Journey',
    duration: 12.0,
    stage: lastBeat?.stage || 'banyan_clearing',
    mood: lastBeat?.mood || 'midnight_banyan',
    weather: 'fireflies',
    shot: 'wide_stage',
    frame: 'end_screen',
    transition: 'ink_fade',
    lightSide: 'right',
    prop: 'diya_lamp',
    propSlot: 'center',
    fx: 'none',
    sfx: 'temple_bell',
    raag: episode.defaultRaag,
    musicEnergy: 0.36,
    cameraMove: 'slow_pull',
    actors: [{ ...leadActor, slot: 'center', expression: 'warm', motion: 'still' }],
    speakerId: 'narrator',
    speakerLabel: brandKit.channelName,
    dialogue: lang.subscribeCta,
  };
}
