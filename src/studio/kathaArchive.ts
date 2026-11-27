/**
 * Katha Studio — Portable `.katha` Self-Contained Project Bundle (Upgrade 7)
 * Exports and imports an entire episode (validated script JSON, per-beat voice clips,
 * uploaded music stem, channel brand kit, and cast voice assignments) in a single
 * CRC-32 verified binary ZIP archive with strict path-traversal & size-cap hardening.
 */
import {
  AspectMode,
  CharacterVoiceAssignment,
  EpisodeScript,
  validateEpisodeScript,
} from './types';
import { ChannelBrandKit, normalizeBrandKit } from './brandKit';
import { LookLabRecipe, sanitizeLookRecipe } from './lookPresets';
import {
  BinaryZipEntry,
  buildBinaryZipBytes,
  computeCrc32,
  sanitizeArchiveSegment,
} from './mlaPackager';

export const KATHA_ARCHIVE_VERSION = 1;
export const MAX_KATHA_ENTRIES = 250;
export const MAX_KATHA_TOTAL_BYTES = 180 * 1024 * 1024; // 180 MB hard ceiling

export interface KathaVoiceAsset {
  slotKey: string; // beatId or `${langCode}::${beatId}`
  fileName: string;
  mimeType: string;
  duration: number;
  bytes: Uint8Array;
}

export interface KathaMusicStemAsset {
  fileName: string;
  mimeType: string;
  duration: number;
  bytes: Uint8Array;
}

export interface KathaProjectBundle {
  version: number;
  exportedAt: number;
  aspect: AspectMode;
  episode: EpisodeScript;
  brandKit?: ChannelBrandKit;
  castVoices?: Record<string, CharacterVoiceAssignment>;
  lookRecipes?: LookLabRecipe[];
  voices: KathaVoiceAsset[];
  musicStem?: KathaMusicStemAsset | null;
}

interface KathaManifestFile {
  format: 'katha-project-bundle';
  version: number;
  exportedAt: number;
  aspect: AspectMode;
  brandKit?: ChannelBrandKit;
  castVoices?: Record<string, CharacterVoiceAssignment>;
  lookRecipes?: LookLabRecipe[];
  voices: Array<{
    slotKey: string;
    fileName: string;
    mimeType: string;
    duration: number;
    entryPath: string;
  }>;
  musicStem?: {
    fileName: string;
    mimeType: string;
    duration: number;
    entryPath: string;
  } | null;
}

/**
 * Validates that a ZIP entry path is strictly relative and free of traversal or control chars.
 */
export function isSafeArchiveEntryPath(rawPath: string): boolean {
  if (!rawPath || rawPath.length > 260) return false;
  if (rawPath.startsWith('/') || rawPath.startsWith('\\')) return false;
  if (rawPath.includes('\\') || rawPath.includes('\0')) return false;
  if (/^[A-Za-z]:/.test(rawPath)) return false;
  const parts = rawPath.split('/');
  for (const part of parts) {
    if (!part || part === '.' || part === '..') return false;
  }
  return true;
}

/**
 * Zero-dependency hardened PKZIP 2.0 reader for STORE (method 0) archives.
 * Enforces entry count caps, total byte caps, path safety, and IEEE 802.3 CRC-32 verification.
 */
export function readBinaryZipEntries(bytes: Uint8Array): Map<string, Uint8Array> {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 22) {
    throw new Error('Archive is empty or truncated.');
  }
  if (bytes.byteLength > MAX_KATHA_TOTAL_BYTES) {
    throw new Error('Archive exceeds maximum allowed size (180 MB).');
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder('utf-8');

  // Locate End of Central Directory record (0x06054b50) scanning backward up to 64KB comment window
  const minOffset = Math.max(0, bytes.byteLength - 65557);
  let eocdOffset = -1;
  for (let i = bytes.byteLength - 22; i >= minOffset; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) {
    throw new Error('Invalid .katha archive: missing ZIP directory signature.');
  }

  const entryCount = view.getUint16(eocdOffset + 10, true);
  const centralSize = view.getUint32(eocdOffset + 12, true);
  const centralOffset = view.getUint32(eocdOffset + 16, true);

  if (entryCount > MAX_KATHA_ENTRIES) {
    throw new Error(`Archive contains too many entries (${entryCount} > ${MAX_KATHA_ENTRIES}).`);
  }
  if (centralOffset + centralSize > eocdOffset) {
    throw new Error('Archive directory bounds are corrupted.');
  }

  const files = new Map<string, Uint8Array>();
  let cursor = centralOffset;
  let totalUncompressed = 0;

  for (let idx = 0; idx < entryCount; idx++) {
    if (cursor + 46 > centralOffset + centralSize) {
      throw new Error('Truncated central directory header.');
    }
    const sig = view.getUint32(cursor, true);
    if (sig !== 0x02014b50) {
      throw new Error('Invalid central directory entry signature.');
    }
    const compression = view.getUint16(cursor + 10, true);
    if (compression !== 0) {
      throw new Error(`Unsupported compression method (${compression}); expected STORE (0).`);
    }
    const expectedCrc = view.getUint32(cursor + 16, true);
    const compSize = view.getUint32(cursor + 20, true);
    const uncompSize = view.getUint32(cursor + 24, true);
    const nameLen = view.getUint16(cursor + 28, true);
    const extraLen = view.getUint16(cursor + 30, true);
    const commentLen = view.getUint16(cursor + 32, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);

    if (compSize !== uncompSize) {
      throw new Error('Archive entry size mismatch.');
    }
    totalUncompressed += uncompSize;
    if (totalUncompressed > MAX_KATHA_TOTAL_BYTES) {
      throw new Error('Archive uncompressed size exceeds 180 MB limit.');
    }

    const nameStart = cursor + 46;
    if (nameStart + nameLen > bytes.byteLength) {
      throw new Error('Truncated archive filename.');
    }
    const entryName = decoder.decode(bytes.subarray(nameStart, nameStart + nameLen));
    if (!isSafeArchiveEntryPath(entryName)) {
      throw new Error(`Unsafe archive entry path rejected: "${entryName}"`);
    }

    // Verify corresponding Local File Header
    if (localHeaderOffset + 30 > bytes.byteLength) {
      throw new Error('Local file header out of bounds.');
    }
    if (view.getUint32(localHeaderOffset, true) !== 0x04034b50) {
      throw new Error(`Corrupt local header for "${entryName}".`);
    }
    const lhNameLen = view.getUint16(localHeaderOffset + 26, true);
    const lhExtraLen = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + lhNameLen + lhExtraLen;
    const dataEnd = dataStart + uncompSize;
    if (dataEnd > bytes.byteLength) {
      throw new Error(`Entry payload out of bounds for "${entryName}".`);
    }

    const payload = bytes.slice(dataStart, dataEnd);
    const actualCrc = computeCrc32(payload);
    if (actualCrc !== expectedCrc) {
      throw new Error(`CRC-32 checksum mismatch for "${entryName}".`);
    }

    files.set(entryName, payload);
    cursor = nameStart + nameLen + extraLen + commentLen;
  }

  return files;
}

/**
 * Exports a complete studio project into a portable `.katha` binary archive.
 */
export function exportKathaArchiveBytes(bundle: KathaProjectBundle): Uint8Array {
  const entries: BinaryZipEntry[] = [];
  const manifestVoices: KathaManifestFile['voices'] = [];

  bundle.voices.forEach((v, idx) => {
    const safeName = sanitizeArchiveSegment(v.slotKey, `clip_${idx}`);
    const entryPath = `voices/${String(idx).padStart(3, '0')}_${safeName}.bin`;
    manifestVoices.push({
      slotKey: v.slotKey,
      fileName: v.fileName || `${safeName}.wav`,
      mimeType: v.mimeType || 'audio/wav',
      duration: Number.isFinite(v.duration) ? v.duration : 0,
      entryPath,
    });
    entries.push({ path: entryPath, data: v.bytes });
  });

  let manifestMusic: KathaManifestFile['musicStem'] = null;
  if (bundle.musicStem && bundle.musicStem.bytes.byteLength > 0) {
    const entryPath = 'music/stem.bin';
    manifestMusic = {
      fileName: bundle.musicStem.fileName || 'music_stem.wav',
      mimeType: bundle.musicStem.mimeType || 'audio/wav',
      duration: Number.isFinite(bundle.musicStem.duration) ? bundle.musicStem.duration : 0,
      entryPath,
    };
    entries.push({ path: entryPath, data: bundle.musicStem.bytes });
  }

  const sanitizedRecipes = Array.isArray(bundle.lookRecipes)
    ? bundle.lookRecipes
        .map((r) => sanitizeLookRecipe(r))
        .filter((r): r is LookLabRecipe => r !== null)
    : undefined;

  const manifest: KathaManifestFile = {
    format: 'katha-project-bundle',
    version: KATHA_ARCHIVE_VERSION,
    exportedAt: bundle.exportedAt || Date.now(),
    aspect: bundle.aspect === '9:16' ? '9:16' : '16:9',
    brandKit: bundle.brandKit ? normalizeBrandKit(bundle.brandKit) : undefined,
    castVoices: bundle.castVoices,
    ...(sanitizedRecipes && sanitizedRecipes.length > 0 ? { lookRecipes: sanitizedRecipes } : {}),
    voices: manifestVoices,
    musicStem: manifestMusic,
  };

  entries.unshift(
    { path: 'manifest.json', data: JSON.stringify(manifest, null, 2) },
    { path: 'episode.json', data: JSON.stringify(bundle.episode, null, 2) }
  );

  return buildBinaryZipBytes(entries);
}

/**
 * Parses and validates a `.katha` archive into a strongly typed `KathaProjectBundle`.
 */
export function parseKathaArchiveBytes(bytes: Uint8Array): KathaProjectBundle {
  const files = readBinaryZipEntries(bytes);
  const decoder = new TextDecoder('utf-8');

  const manifestRaw = files.get('manifest.json');
  const episodeRaw = files.get('episode.json');
  if (!manifestRaw || !episodeRaw) {
    throw new Error('Archive is missing required manifest.json or episode.json.');
  }

  let manifest: Partial<KathaManifestFile>;
  let episodeJson: unknown;
  try {
    manifest = JSON.parse(decoder.decode(manifestRaw)) as Partial<KathaManifestFile>;
    episodeJson = JSON.parse(decoder.decode(episodeRaw));
  } catch {
    throw new Error('Archive JSON metadata could not be parsed.');
  }

  if (manifest.format !== 'katha-project-bundle') {
    throw new Error('File is not a valid Katha Studio (.katha) project bundle.');
  }

  const validated = validateEpisodeScript(episodeJson);
  if (!validated.ok) {
    throw new Error(`Episode script inside .katha failed validation: ${validated.error}`);
  }

  const voices: KathaVoiceAsset[] = [];
  if (Array.isArray(manifest.voices)) {
    for (const v of manifest.voices) {
      if (!v || typeof v.entryPath !== 'string' || typeof v.slotKey !== 'string') continue;
      const bin = files.get(v.entryPath);
      if (!bin || bin.byteLength === 0) continue;
      voices.push({
        slotKey: v.slotKey,
        fileName: typeof v.fileName === 'string' ? v.fileName : 'voice.wav',
        mimeType: typeof v.mimeType === 'string' ? v.mimeType : 'audio/wav',
        duration: typeof v.duration === 'number' && Number.isFinite(v.duration) ? v.duration : 0,
        bytes: bin,
      });
    }
  }

  let musicStem: KathaMusicStemAsset | null = null;
  if (manifest.musicStem && typeof manifest.musicStem.entryPath === 'string') {
    const mBin = files.get(manifest.musicStem.entryPath);
    if (mBin && mBin.byteLength > 0) {
      musicStem = {
        fileName: manifest.musicStem.fileName || 'music_stem.wav',
        mimeType: manifest.musicStem.mimeType || 'audio/wav',
        duration:
          typeof manifest.musicStem.duration === 'number' &&
          Number.isFinite(manifest.musicStem.duration)
            ? manifest.musicStem.duration
            : 0,
        bytes: mBin,
      };
    }
  }

  const lookRecipes = Array.isArray(manifest.lookRecipes)
    ? manifest.lookRecipes
        .map((r) => sanitizeLookRecipe(r))
        .filter((r): r is LookLabRecipe => r !== null)
    : undefined;

  return {
    version: typeof manifest.version === 'number' ? manifest.version : KATHA_ARCHIVE_VERSION,
    exportedAt: typeof manifest.exportedAt === 'number' ? manifest.exportedAt : Date.now(),
    aspect: manifest.aspect === '9:16' ? '9:16' : '16:9',
    episode: validated.script,
    brandKit: manifest.brandKit ? normalizeBrandKit(manifest.brandKit) : undefined,
    castVoices:
      manifest.castVoices && typeof manifest.castVoices === 'object'
        ? manifest.castVoices
        : undefined,
    ...(lookRecipes && lookRecipes.length > 0 ? { lookRecipes } : {}),
    voices,
    musicStem,
  };
}
