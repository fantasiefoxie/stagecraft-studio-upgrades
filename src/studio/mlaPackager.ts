/**
 * Katha Studio — Multi-Language Audio (MLA) Packager & Binary PKZIP 2.0 Writer (Upgrade 6)
 * Packages multiple translated episode variants (synced .WAV audio mixes, .SRT subtitles,
 * episode .JSON scripts, and localized YouTube Launch Packs) into a single valid PKZIP archive.
 */
import { EpisodeScript } from './types';
import { getLanguageSpec, resolveEpisodeLanguage } from './i18n';
import {
  YoutubeLaunchPack,
  buildYoutubeLaunchPack,
  generateSrtCaptions,
} from './growthTools';

function formatLaunchPackAsText(pack: YoutubeLaunchPack): string {
  return [
    '=== TITLE OPTIONS ===',
    ...pack.titles.map((t, i) => `${i + 1}. ${t}`),
    '',
    '=== DESCRIPTION ===',
    pack.description,
    '',
    '=== TAGS ===',
    pack.tags.join(', '),
    '',
    '=== PINNED COMMENT ===',
    pack.pinnedComment,
    '',
    '=== COMMUNITY POLL ===',
    pack.communityPoll.question,
    ...pack.communityPoll.options.map((o, i) => `  ${i + 1}) ${o}`),
    '',
    '=== YPP MONETIZATION CHECKLIST ===',
    pack.yppChecklistText,
  ].join('\n');
}

// Standard IEEE 802.3 CRC-32 lookup table
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

export function computeCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface BinaryZipEntry {
  path: string;
  data: Uint8Array | string;
}

/**
 * Sanitizes a single path segment so generated ZIP archives never contain traversal sequences
 * or OS-incompatible characters.
 */
export function sanitizeArchiveSegment(name: string, fallback = 'item'): string {
  const cleaned = String(name || '')
    .normalize('NFKC')
    .replace(/\.\.+/g, '')
    .replace(/[/\\:*?"<>|\x00-\x1f]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[._]+|[._]+$/g, '')
    .slice(0, 64);
  return cleaned || fallback;
}

function sanitizeArchivePath(rawPath: string): string {
  const parts = String(rawPath || '')
    .replace(/\\/g, '/')
    .split('/')
    .map((p) => p.trim())
    .filter((p) => p && p !== '.' && p !== '..');
  return parts.length > 0 ? parts.join('/') : 'file.bin';
}

/**
 * Zero-dependency spec-compliant PKZIP 2.0 (STORE method 0, UTF-8 flag 0x0800) binary writer.
 */
export function buildBinaryZipBytes(entries: BinaryZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const safePath = sanitizeArchivePath(entry.path);
    const nameBytes = encoder.encode(safePath);
    const dataBytes =
      typeof entry.data === 'string' ? encoder.encode(entry.data) : entry.data;
    const crc = computeCrc32(dataBytes);
    const size = dataBytes.byteLength;

    // Local File Header (30 bytes + name)
    const lh = new Uint8Array(30 + nameBytes.length);
    const lhv = new DataView(lh.buffer);
    lhv.setUint32(0, 0x04034b50, true);
    lhv.setUint16(4, 20, true); // version needed 2.0
    lhv.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lhv.setUint16(8, 0, true); // STORE (uncompressed)
    lhv.setUint16(10, 0, true);
    lhv.setUint16(12, 0x5821, true);
    lhv.setUint32(14, crc, true);
    lhv.setUint32(18, size, true);
    lhv.setUint32(22, size, true);
    lhv.setUint16(26, nameBytes.length, true);
    lhv.setUint16(28, 0, true);
    lh.set(nameBytes, 30);

    localParts.push(lh, dataBytes);

    // Central Directory Header (46 bytes + name)
    const ch = new Uint8Array(46 + nameBytes.length);
    const chv = new DataView(ch.buffer);
    chv.setUint32(0, 0x02014b50, true);
    chv.setUint16(4, 20, true);
    chv.setUint16(6, 20, true);
    chv.setUint16(8, 0x0800, true);
    chv.setUint16(10, 0, true);
    chv.setUint16(12, 0, true);
    chv.setUint16(14, 0x5821, true);
    chv.setUint32(16, crc, true);
    chv.setUint32(20, size, true);
    chv.setUint32(24, size, true);
    chv.setUint16(28, nameBytes.length, true);
    chv.setUint16(30, 0, true);
    chv.setUint16(32, 0, true);
    chv.setUint16(34, 0, true);
    chv.setUint16(36, 0, true);
    chv.setUint32(38, 0, true);
    chv.setUint32(42, offset, true);
    ch.set(nameBytes, 46);

    centralParts.push(ch);
    offset += lh.byteLength + dataBytes.byteLength;
  }

  let centralSize = 0;
  for (const c of centralParts) centralSize += c.byteLength;

  // End of Central Directory (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdv = new DataView(eocd.buffer);
  eocdv.setUint32(0, 0x06054b50, true);
  eocdv.setUint16(4, 0, true);
  eocdv.setUint16(6, 0, true);
  eocdv.setUint16(8, entries.length, true);
  eocdv.setUint16(10, entries.length, true);
  eocdv.setUint32(12, centralSize, true);
  eocdv.setUint32(16, offset, true);
  eocdv.setUint16(20, 0, true);

  const totalLen = offset + centralSize + eocd.byteLength;
  const out = new Uint8Array(totalLen);
  let pos = 0;
  for (const p of localParts) {
    out.set(p, pos);
    pos += p.byteLength;
  }
  for (const p of centralParts) {
    out.set(p, pos);
    pos += p.byteLength;
  }
  out.set(eocd, pos);
  return out;
}

export interface MlaLanguageVariant {
  langCode: string;
  episode: EpisodeScript;
  wavBytes?: Uint8Array;
  audioBytes?: Uint8Array;
  audioExt?: 'm4a' | 'wav';
}

/**
 * Builds a YouTube Studio Multi-Language Audio (MLA) & Subtitles distribution ZIP
 * from one or more language variants of an episode.
 */
export function buildMlaLanguagePackZip(variants: MlaLanguageVariant[]): Uint8Array {
  const entries: BinaryZipEntry[] = [];
  const manifestLines: string[] = [
    'KATHA STUDIO — YOUTUBE MULTI-LANGUAGE AUDIO (MLA) & SUBTITLES PACK',
    '====================================================================',
    '',
    'HOW TO UPLOAD IN YOUTUBE STUDIO:',
    '1. Upload your primary rendered .MP4 master video once to YouTube.',
    '2. Open YouTube Studio -> Subtitles -> Add Language for each track below.',
    '3. For each language, upload the matching <lang>_subtitles.srt and <lang>_audio_mix.m4a (or .wav) Audio Track.',
    '4. Copy the localized Title, Description & Tags from <lang>_youtube_launch_pack.txt.',
    '',
    'INCLUDED LANGUAGE TRACKS:',
  ];

  for (const variant of variants) {
    const spec = getLanguageSpec(variant.langCode || resolveEpisodeLanguage(variant.episode).code);
    const folder = sanitizeArchiveSegment(`${spec.code}_${spec.label}`, spec.code);
    const slug = sanitizeArchiveSegment(variant.episode.id || 'episode', 'episode');

    const audioData = variant.audioBytes || variant.wavBytes;
    const ext = variant.audioBytes ? (variant.audioExt || 'm4a') : 'wav';
    const audioLabel = audioData && audioData.byteLength > 0 ? `${ext.toUpperCase()} + ` : '';

    manifestLines.push(
      `- ${spec.label} (${spec.nativeName}, ${spec.bcp47}): ${folder}/ (${audioLabel}SRT + JSON + Launch Pack)`
    );

    const srt = generateSrtCaptions(variant.episode);
    const pack = buildYoutubeLaunchPack(variant.episode);
    const packTxt = formatLaunchPackAsText(pack);

    entries.push({
      path: `${folder}/${slug}_${spec.code}_episode.json`,
      data: JSON.stringify(variant.episode, null, 2),
    });
    entries.push({
      path: `${folder}/${slug}_${spec.code}_subtitles.srt`,
      data: srt,
    });
    entries.push({
      path: `${folder}/${slug}_${spec.code}_youtube_launch_pack.txt`,
      data: packTxt,
    });

    if (audioData && audioData.byteLength > 0) {
      entries.push({
        path: `${folder}/${slug}_${spec.code}_audio_mix.${ext}`,
        data: audioData,
      });
    }
  }

  entries.unshift({
    path: 'README_YOUTUBE_MLA.txt',
    data: manifestLines.join('\n') + '\n',
  });

  return buildBinaryZipBytes(entries);
}
