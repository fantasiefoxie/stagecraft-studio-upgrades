#!/usr/bin/env node
/**
 * Stagecraft Studio — Offline CLI Batch Packager, Hardware-Accelerated Broadcast MP4 Converter
 * & Optional `shorts-exp` QA Bridge
 *
 * Usage:
 *   node scripts/render-batch.mjs episodes/*.json --out ./renders [--encoder auto] [--shorts-exp-dir ../shorts-exp]
 *
 * What it does automatically for every episode JSON passed on the command line:
 *   1. Generates frame-accurate YouTube SubRip captions (.srt)
 *   2. Generates a ready-to-upload YouTube Launch Pack (.launch_pack.txt: 5 CTR titles,
 *      00:00 chapter timestamps, description, SEO tags, pinned comment & poll)
 *   3. If a matching <episode_id>.webm recording exists alongside the JSON or in --webm-dir,
 *      transcodes it via FFmpeg (auto-detecting h264_nvenc / h264_amf / h264_videotoolbox or
 *      falling back safely to libx264) to YouTube-native 1080p60 H.264 MP4 with -14 LUFS audio
 *      loudness normalization (loudnorm=I=-14:TP=-1.5:LRA=11).
 *   4. Optionally runs a sibling `shorts-exp/scripts/short-qa.py` check on exported MP4s when
 *      `--shorts-exp-dir` or `SHORTS_EXP_DIR` is explicitly provided.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';

const ALLOWED_ENCODERS = new Set([
  'auto',
  'libx264',
  'h264_nvenc',
  'h264_amf',
  'h264_videotoolbox',
]);

const MAX_KATHA_ENTRIES = 250;
const MAX_KATHA_BYTES = 180 * 1024 * 1024;
const AUDIO_EXT_MIME = new Map([
  ['.wav', 'audio/wav'],
  ['.mp3', 'audio/mpeg'],
  ['.ogg', 'audio/ogg'],
  ['.m4a', 'audio/mp4'],
  ['.aac', 'audio/aac'],
  ['.webm', 'audio/webm'],
]);

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function computeCrc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function isSafeArchiveEntryPath(rawPath) {
  if (!rawPath || rawPath.length > 260) return false;
  if (rawPath.startsWith('/') || rawPath.startsWith('\\')) return false;
  if (rawPath.includes('\\') || rawPath.includes('\0')) return false;
  if (/^[A-Za-z]:/.test(rawPath)) return false;
  return rawPath.split('/').every((p) => p && p !== '.' && p !== '..');
}

function readStoreZipEntries(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 22) {
    throw new Error('Invalid .katha archive: empty or truncated.');
  }
  if (buf.length > MAX_KATHA_BYTES) {
    throw new Error('Invalid .katha archive: exceeds 180 MB ceiling.');
  }
  const minOff = Math.max(0, buf.length - 65557);
  let eocd = -1;
  for (let i = buf.length - 22; i >= minOff; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('Invalid .katha archive: missing EOCD signature.');

  const entryCount = buf.readUInt16LE(eocd + 10);
  const centralSize = buf.readUInt32LE(eocd + 12);
  const centralOffset = buf.readUInt32LE(eocd + 16);
  if (entryCount > MAX_KATHA_ENTRIES) {
    throw new Error(`Invalid .katha archive: too many entries (${entryCount}).`);
  }
  if (centralOffset + centralSize > eocd) {
    throw new Error('Invalid .katha archive: corrupt central directory bounds.');
  }

  const entries = new Map();
  let ptr = centralOffset;
  for (let i = 0; i < entryCount; i++) {
    if (ptr + 46 > centralOffset + centralSize || buf.readUInt32LE(ptr) !== 0x02014b50) {
      throw new Error('Invalid .katha archive: corrupt central directory entry.');
    }
    const method = buf.readUInt16LE(ptr + 10);
    if (method !== 0) {
      throw new Error(`Unsupported .katha ZIP compression method (${method}); expected STORE (0).`);
    }
    const expectedCrc = buf.readUInt32LE(ptr + 16);
    const compSize = buf.readUInt32LE(ptr + 20);
    const uncompSize = buf.readUInt32LE(ptr + 24);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const localOffset = buf.readUInt32LE(ptr + 42);
    const entryName = buf.subarray(ptr + 46, ptr + 46 + nameLen).toString('utf8');
    ptr += 46 + nameLen + extraLen + commentLen;

    if (!isSafeArchiveEntryPath(entryName)) {
      throw new Error(`Unsafe archive entry path rejected: ${entryName}`);
    }
    if (compSize !== uncompSize) {
      throw new Error(`Corrupt STORE entry size mismatch: ${entryName}`);
    }
    if (localOffset + 30 > buf.length || buf.readUInt32LE(localOffset) !== 0x04034b50) {
      throw new Error(`Corrupt local header for archive entry: ${entryName}`);
    }
    const localNameLen = buf.readUInt16LE(localOffset + 26);
    const localExtraLen = buf.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const dataEnd = dataStart + uncompSize;
    if (dataEnd > buf.length) {
      throw new Error(`Truncated archive entry payload: ${entryName}`);
    }
    const slice = buf.subarray(dataStart, dataEnd);
    if (computeCrc32(slice) !== expectedCrc) {
      throw new Error(`CRC-32 mismatch for archive entry: ${entryName}`);
    }
    entries.set(entryName, slice);
  }
  return entries;
}

function loadEpisodeInput(inputPath, voicesDir) {
  const ext = path.extname(inputPath).toLowerCase();
  let ep;
  const voices = [];
  let musicStem = null;
  let archiveAspect = null;

  if (ext === '.katha' || ext === '.zip') {
    const rawZip = fs.readFileSync(inputPath);
    const entries = readStoreZipEntries(rawZip);
    const epBuf = entries.get('episode.json');
    const manBuf = entries.get('manifest.json');
    if (!epBuf) throw new Error(`.katha archive missing episode.json: ${inputPath}`);
    ep = JSON.parse(epBuf.toString('utf8'));
    const manifest = manBuf ? JSON.parse(manBuf.toString('utf8')) : null;
    if (manifest?.aspect === '9:16' || manifest?.aspect === '16:9') {
      archiveAspect = manifest.aspect;
    }
    const beatIdSet = new Set((ep.beats || []).map((b) => b.id));
    const epLang = String(ep.language || 'en').trim().toLowerCase();

    if (manifest && Array.isArray(manifest.voices)) {
      for (const v of manifest.voices) {
        if (!v?.entryPath || !v?.slotKey) continue;
        const data = entries.get(v.entryPath);
        if (!data) continue;
        let beatId = null;
        if (beatIdSet.has(v.slotKey)) {
          beatId = v.slotKey;
        } else if (v.slotKey.includes('::')) {
          const [slotLang, rawBeatId] = v.slotKey.split('::');
          if (slotLang.toLowerCase() === epLang && beatIdSet.has(rawBeatId)) {
            beatId = rawBeatId;
          }
        }
        if (beatId) {
          voices.push({
            beatId,
            fileName: String(v.fileName || path.basename(v.entryPath)),
            mimeType: String(v.mimeType || 'audio/wav'),
            base64: data.toString('base64'),
          });
        }
      }
    }
    if (manifest?.musicStem?.entryPath) {
      const stemData = entries.get(manifest.musicStem.entryPath);
      if (stemData) {
        musicStem = {
          fileName: String(manifest.musicStem.fileName || 'music_stem.wav'),
          mimeType: String(manifest.musicStem.mimeType || 'audio/wav'),
          base64: stemData.toString('base64'),
        };
      }
    }
  } else {
    ep = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  }

  if (!ep || !ep.id || !Array.isArray(ep.beats)) {
    throw new Error(`Invalid episode input: ${inputPath}`);
  }

  // Optional --voices-dir directory scan (matches <beatId>.<ext> or 01_*.<ext> + music_stem.<ext>)
  if (voicesDir && fs.existsSync(voicesDir) && fs.statSync(voicesDir).isDirectory()) {
    const resolvedVoicesDir = path.resolve(voicesDir);
    const existingVoiceBeatIds = new Set(voices.map((v) => v.beatId));
    const beatIdSet = new Set(ep.beats.map((b) => b.id));
    const dirEntries = fs.readdirSync(resolvedVoicesDir).sort();

    for (const fname of dirEntries) {
      const fext = path.extname(fname).toLowerCase();
      const mimeType = AUDIO_EXT_MIME.get(fext);
      if (!mimeType) continue;
      const fullPath = path.resolve(resolvedVoicesDir, fname);
      if (!fullPath.startsWith(resolvedVoicesDir + path.sep) || !fs.statSync(fullPath).isFile()) {
        continue;
      }
      const stem = path.basename(fname, fext);
      if (!musicStem && /^(music_stem|music|score|soundtrack)$/i.test(stem)) {
        musicStem = {
          fileName: fname,
          mimeType,
          base64: fs.readFileSync(fullPath).toString('base64'),
        };
        continue;
      }
      let matchedBeatId = null;
      if (beatIdSet.has(stem)) {
        matchedBeatId = stem;
      } else {
        const numMatch = stem.match(/^(?:scene[_-]?|beat[_-]?)?0*(\d+)/i);
        if (numMatch) {
          const idx = Number(numMatch[1]) - 1;
          if (idx >= 0 && idx < ep.beats.length) {
            matchedBeatId = ep.beats[idx].id;
          }
        }
      }
      if (matchedBeatId && !existingVoiceBeatIds.has(matchedBeatId)) {
        existingVoiceBeatIds.add(matchedBeatId);
        voices.push({
          beatId: matchedBeatId,
          fileName: fname,
          mimeType,
          base64: fs.readFileSync(fullPath).toString('base64'),
        });
      }
    }
  }

  return { ep, voices, musicStem, archiveAspect };
}

function formatSrtTime(sec) {
  const msTotal = Math.max(0, Math.round(sec * 1000));
  const hrs = Math.floor(msTotal / 3600000);
  const mins = Math.floor((msTotal % 3600000) / 60000);
  const secs = Math.floor((msTotal % 60000) / 1000);
  const ms = msTotal % 1000;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function formatYtTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function hasFfmpeg() {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function resolveVideoEncoder(requested, ffmpegOk) {
  const safeReq = ALLOWED_ENCODERS.has(requested) ? requested : 'auto';
  if (!ffmpegOk) return 'libx264';
  if (safeReq !== 'auto') return safeReq;

  try {
    const out = execFileSync('ffmpeg', ['-hide_banner', '-encoders'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 15_000,
    });
    for (const candidate of ['h264_nvenc', 'h264_amf', 'h264_videotoolbox']) {
      if (out.includes(candidate)) return candidate;
    }
  } catch {
    // Fall back safely to software libx264
  }
  return 'libx264';
}

function buildVideoCodecArgs(encoder) {
  if (encoder === 'h264_nvenc') {
    return ['-c:v', 'h264_nvenc', '-preset', 'p5', '-cq', '19', '-pix_fmt', 'yuv420p'];
  }
  if (encoder === 'h264_amf') {
    return ['-c:v', 'h264_amf', '-quality', 'balanced', '-rc', 'cqp', '-qp_i', '19', '-qp_p', '19', '-pix_fmt', 'yuv420p'];
  }
  if (encoder === 'h264_videotoolbox') {
    return ['-c:v', 'h264_videotoolbox', '-q:v', '68', '-pix_fmt', 'yuv420p'];
  }
  return ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p'];
}

function runOptionalShortsExpQa(mp4Path, shortsExpDir) {
  if (!shortsExpDir) return null;
  const resolvedDir = path.resolve(shortsExpDir);
  const qaScript = path.resolve(resolvedDir, 'scripts', 'short-qa.py');
  if (!qaScript.startsWith(resolvedDir + path.sep) || !fs.existsSync(qaScript)) {
    return 'shorts-exp QA skipped (scripts/short-qa.py not found)';
  }
  const pyBin = process.platform === 'win32' ? 'python' : 'python3';
  try {
    execFileSync(pyBin, [qaScript, mp4Path], {
      cwd: resolvedDir,
      stdio: 'ignore',
      timeout: 120_000,
    });
    return 'shorts-exp QA PASS';
  } catch {
    return 'shorts-exp QA reported warnings (run short-qa.py directly for details)';
  }
}

const CLI_STUDIO_FPS = 60;
const CLI_IMPACT_SFX = new Set(['sword_clash', 'thunder_crack']);
const CLI_IMPACT_FX = new Set(['crimson_impact', 'shock_burst', 'shatter_glass', 'comic_pow']);
const CLI_STYLE_FPS = {
  chiaroscuro: 24,
  shadow_puppetry: 16,
  lineless_vector: 30,
  woodblock_print: 10,
  stained_glass: 24,
  papercraft_diorama: 12,
  sumi_e_wash: 12,
  greek_amphora: 12,
  kente_tapestry: 15,
  illuminated_codex: 24,
  anime_cel: 24,
  manga_screentone: 15,
  blueprint_technical: 30,
  gouache_storybook: 15,
  neon_cybernoir: 60,
  felt_puppet: 12,
  risograph_print: 12,
  backlit_sand: 15,
  scratchboard_noir: 15,
  byzantine_mosaic: 24,
};

function cliFnv1aHex(input) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function cliHasGranularDna(castMember) {
  const dna = castMember?.dna;
  if (!dna || typeof dna !== 'object') return false;
  if (dna.faceMorph && Object.keys(dna.faceMorph).length > 0) return true;
  if (Array.isArray(dna.bodyMarks) && dna.bodyMarks.some((m) => m && m !== 'none')) return true;
  if (dna.accessories && Object.values(dna.accessories).some((v) => typeof v === 'string' && v !== 'none')) {
    return true;
  }
  if (
    dna.head &&
    ((dna.head.eyebrowStyle && dna.head.eyebrowStyle !== 'natural_arch') ||
      (dna.head.pupilStyle && dna.head.pupilStyle !== 'round') ||
      (dna.head.eyelashStyle && dna.head.eyelashStyle !== 'none') ||
      (dna.head.mouthStyle && dna.head.mouthStyle !== 'classic') ||
      (dna.head.secondaryFaceMark && dna.head.secondaryFaceMark !== 'none') ||
      (typeof dna.head.blushIntensity === 'number' && dna.head.blushIntensity > 0))
  ) {
    return true;
  }
  if (
    dna.outfit &&
    ((dna.outfit.outerwear && dna.outfit.outerwear !== 'none') ||
      (dna.outfit.sleeveStyle && dna.outfit.sleeveStyle !== 'auto') ||
      (dna.outfit.waistStyle && dna.outfit.waistStyle !== 'none') ||
      (dna.outfit.gloves && dna.outfit.gloves !== 'none') ||
      (dna.outfit.footwear && dna.outfit.footwear !== 'auto'))
  ) {
    return true;
  }
  if (dna.palette && Boolean(dna.palette.eyeSecondary || dna.palette.lip || dna.palette.brow || dna.palette.markTint)) {
    return true;
  }
  return false;
}

function cliComputeDnaSilhouetteSignature(castMember) {
  if (!castMember) return 'dna_00000000';
  const dna = castMember.dna;
  const parts = [
    `arch:${castMember.archetype || 'unknown'}`,
    `col:${String(castMember.primaryColor || '').toLowerCase()}`,
    `acc:${String(castMember.accentColor || '').toLowerCase()}`,
  ];
  if (dna && typeof dna === 'object') {
    const morph = dna.morph || {};
    const head = dna.head || {};
    const outfit = dna.outfit || {};
    const acc = dna.accessories || {};
    const app = dna.appendages || {};
    const bodyMarks = Array.isArray(dna.bodyMarks)
      ? dna.bodyMarks.filter((m) => m && m !== 'none').slice().sort().join(',')
      : '';
    parts.push(
      `ch:${dna.chassis || 'humanoid'}`,
      `h:${Number((morph.height ?? 1).toFixed(2))}`,
      `sw:${Number((morph.shoulderWidth ?? 1).toFixed(2))}`,
      `tb:${Number((morph.torsoBulk ?? 1).toFixed(2))}`,
      `hr:${Number((morph.headRatio ?? 1).toFixed(2))}`,
      `hs:${head.headShape || 'oval'}`,
      `hair:${head.hairStyle || 'none'}`,
      `horns:${head.horns || 'none'}`,
      `fm:${head.faceMark || 'none'}+${head.secondaryFaceMark || 'none'}`,
      `hw:${outfit.headwear || 'none'}`,
      `top:${outfit.topStyle || 'none'}`,
      `out:${outfit.outerwear || 'none'}`,
      `cape:${outfit.capeStyle || 'none'}`,
      `eye:${acc.eyewear || 'none'}`,
      `back:${acc.backGear || 'none'}`,
      `wing:${app.wings || 'none'}`,
      `tail:${app.tail || 'none'}`,
      `bm:${bodyMarks}`
    );
  }
  return `dna_${cliFnv1aHex(parts.join('|'))}`;
}

function buildStagecraftQaBundleCli(ep, aspect = '16:9') {
  const safeAspect = aspect === '9:16' ? '9:16' : '16:9';
  const vs = ep.visualStyle && typeof ep.visualStyle === 'object' ? ep.visualStyle : {};
  const renderStyle = vs.renderStyle || 'chiaroscuro';
  const cadence = vs.motionCadence || 'auto';
  const rawFps =
    cadence === '60fps' ? 60 : cadence === '24fps' ? 24 : cadence === '12fps' ? 12 : CLI_STYLE_FPS[renderStyle] || 24;
  const effectiveCadenceFps = rawFps <= 16 ? 12 : rawFps <= 36 ? 24 : 60;
  const hitstopEnabled = vs.hitstopEnabled !== false;
  const vfxIntensity =
    typeof vs.vfxIntensity === 'number' && Number.isFinite(vs.vfxIntensity)
      ? Math.max(0, Math.min(1, vs.vfxIntensity))
      : 0.75;

  const castById = new Map();
  for (const c of ep.cast || []) castById.set(c.id, c);

  let cursorFrame = 0;
  const beatTimeline = [];
  const roundSec = (v) => Number(v.toFixed(4));
  const roundNum = (v, d = 3) => Number(v.toFixed(d));

  for (let i = 0; i < (ep.beats || []).length; i++) {
    const beat = ep.beats[i];
    const safeDur = Math.max(0.5, Number.isFinite(Number(beat.duration)) ? Number(beat.duration) : 4);
    const beatFrames = Math.max(1, Math.round(safeDur * CLI_STUDIO_FPS));
    const startFrame = cursorFrame;
    const endFrame = cursorFrame + beatFrames;
    const startSec = roundSec(startFrame / CLI_STUDIO_FPS);
    const endSec = roundSec(endFrame / CLI_STUDIO_FPS);
    const durationSec = roundSec(beatFrames / CLI_STUDIO_FPS);
    const audioLeadSec =
      typeof beat.audioLeadSec === 'number' && Number.isFinite(beat.audioLeadSec)
        ? roundNum(Math.max(-0.6, Math.min(0.6, beat.audioLeadSec)), 3)
        : 0;

    const resolveCueStart = (cue) => {
      if (typeof cue.frame === 'number' && Number.isFinite(cue.frame)) {
        return Math.max(0, Math.min(beatFrames - 1, Math.round(cue.frame)));
      }
      if (typeof cue.timeSec === 'number' && Number.isFinite(cue.timeSec)) {
        return Math.max(0, Math.min(beatFrames - 1, Math.round(Math.max(0, cue.timeSec) * CLI_STUDIO_FPS)));
      }
      if (typeof cue.at === 'number' && Number.isFinite(cue.at)) {
        return Math.max(0, Math.min(beatFrames - 1, Math.round(Math.max(0, Math.min(0.98, cue.at)) * durationSec * CLI_STUDIO_FPS)));
      }
      return Math.round(beatFrames * 0.25);
    };

    const hitstopRaw = [];
    if (hitstopEnabled) {
      for (const cue of beat.actionCues || []) {
        const isAttack = cue.pose === 'attack';
        const isPunch = typeof cue.cameraPunch === 'number' && cue.cameraPunch >= 0.5;
        const isImpactSfx = Boolean(cue.sfx && CLI_IMPACT_SFX.has(cue.sfx));
        const isImpactFx = Boolean(cue.fx && CLI_IMPACT_FX.has(cue.fx));
        if (!isAttack && !isPunch && !isImpactSfx && !isImpactFx) continue;
        const frames = isImpactSfx || (typeof cue.cameraPunch === 'number' && cue.cameraPunch >= 0.78) ? 4 : isAttack || isImpactFx ? 3 : 2;
        hitstopRaw.push({ localFrame: resolveCueStart(cue), frames });
      }
      if (beat.sfx && CLI_IMPACT_SFX.has(beat.sfx)) {
        const off = typeof beat.sfxOffsetSec === 'number' && Number.isFinite(beat.sfxOffsetSec)
          ? Math.max(0, Math.min(durationSec - 0.08, beat.sfxOffsetSec))
          : 0.12;
        hitstopRaw.push({ localFrame: Math.round(off * CLI_STUDIO_FPS), frames: beat.sfx === 'thunder_crack' ? 4 : 3 });
      }
      if (beat.fx && CLI_IMPACT_FX.has(beat.fx)) {
        hitstopRaw.push({ localFrame: Math.min(beatFrames - 1, Math.round(0.14 * CLI_STUDIO_FPS)), frames: 3 });
      }
      if (Array.isArray(beat.actors) && beat.actors.some((a) => a.pose === 'attack')) {
        hitstopRaw.push({ localFrame: Math.min(beatFrames - 1, Math.round(beatFrames * 0.22)), frames: 3 });
      }
    }
    hitstopRaw.sort((a, b) => a.localFrame - b.localFrame || b.frames - a.frames);
    const hitstopMerged = [];
    for (const item of hitstopRaw) {
      const prev = hitstopMerged[hitstopMerged.length - 1];
      if (prev && item.localFrame - prev.localFrame <= 10) {
        if (item.frames > prev.frames) prev.frames = item.frames;
      } else {
        hitstopMerged.push({ ...item });
      }
    }
    const hitstopWindows = hitstopMerged.map((ev) => {
      const sF = startFrame + ev.localFrame;
      const eF = Math.min(endFrame, sF + ev.frames);
      return {
        startSec: roundSec(sF / CLI_STUDIO_FPS),
        endSec: roundSec(eF / CLI_STUDIO_FPS),
        frames: Math.max(1, eF - sF),
      };
    });

    const vfxBurstWindows = [];
    if (vfxIntensity > 0) {
      if (beat.transition === 'popup_fold') {
        const foldF = Math.min(beatFrames, Math.round(0.65 * CLI_STUDIO_FPS));
        vfxBurstWindows.push({
          startSec,
          endSec: roundSec((startFrame + foldF) / CLI_STUDIO_FPS),
          intensity: roundNum(Math.min(1, Math.max(0.35, vfxIntensity * 0.85)), 3),
        });
      }
      if (beat.fx && beat.fx !== 'none') {
        const sOff = Math.min(beatFrames - 1, Math.round(0.08 * CLI_STUDIO_FPS));
        const span = Math.min(beatFrames - sOff, Math.max(Math.round(0.45 * CLI_STUDIO_FPS), Math.round(beatFrames * 0.65)));
        vfxBurstWindows.push({
          startSec: roundSec((startFrame + sOff) / CLI_STUDIO_FPS),
          endSec: roundSec((startFrame + sOff + span) / CLI_STUDIO_FPS),
          intensity: roundNum(Math.min(1, vfxIntensity * (CLI_IMPACT_FX.has(beat.fx) ? 1.0 : 0.78)), 3),
        });
      }
      for (const cue of beat.actionCues || []) {
        const hasFx = Boolean(cue.fx && cue.fx !== 'none');
        const hasPunch = typeof cue.cameraPunch === 'number' && cue.cameraPunch >= 0.35;
        const hasPulse = typeof cue.propPulse === 'number' && cue.propPulse >= 0.35;
        if (!hasFx && !hasPunch && !hasPulse) continue;
        const lS = resolveCueStart(cue);
        const lE =
          typeof cue.endFrame === 'number' && Number.isFinite(cue.endFrame) && cue.endFrame > lS
            ? Math.min(beatFrames, Math.round(cue.endFrame))
            : Math.min(beatFrames, lS + Math.round(0.45 * CLI_STUDIO_FPS));
        const peak = Math.max(
          hasFx ? vfxIntensity : 0,
          hasPunch ? Math.min(1, cue.cameraPunch * vfxIntensity) : 0,
          hasPulse ? Math.min(1, cue.propPulse * vfxIntensity) : 0
        );
        vfxBurstWindows.push({
          startSec: roundSec((startFrame + lS) / CLI_STUDIO_FPS),
          endSec: roundSec((startFrame + lE) / CLI_STUDIO_FPS),
          intensity: roundNum(Math.max(0.15, Math.min(1, peak)), 3),
        });
      }
      vfxBurstWindows.sort((a, b) => a.startSec - b.startSec || a.endSec - b.endSec);
    }

    const text = typeof beat.dialogue === 'string' ? beat.dialogue.trim() : '';
    let speechWindow = null;
    if (text) {
      const sStart = Math.max(0, roundSec(startSec + 0.08 - audioLeadSec));
      const sEnd = roundSec(Math.min(endSec + 0.6, Math.max(sStart + 0.25, endSec - 0.12 - Math.max(0, audioLeadSec * 0.5))));
      const speakDur = Math.max(0.25, sEnd - sStart);
      const nonSpace = text.replace(/\s+/g, '').length;
      speechWindow = {
        startSec: sStart,
        endSec: sEnd,
        wordCount: text.split(/\s+/).filter(Boolean).length,
        estimatedCps: roundNum(nonSpace / speakDur, 2),
        speakerId: beat.speakerId || 'narrator',
      };
    }

    const locationCard =
      beat.locationCard && typeof beat.locationCard.title === 'string' && beat.locationCard.title.trim()
        ? {
            title: beat.locationCard.title.trim(),
            ...(beat.locationCard.subtitle?.trim() ? { subtitle: beat.locationCard.subtitle.trim() } : {}),
            ...(beat.locationCard.position ? { position: beat.locationCard.position } : {}),
            ...(beat.locationCard.style ? { style: beat.locationCard.style } : {}),
          }
        : null;

    const actors = (beat.actors || []).map((a) => {
      const member = castById.get(a.castId);
      return {
        castId: a.castId,
        slot: a.slot,
        pose: a.pose,
        expression: a.expression,
        offsetX: typeof a.offsetX === 'number' && Number.isFinite(a.offsetX) ? roundNum(a.offsetX, 4) : 0,
        offsetY: typeof a.offsetY === 'number' && Number.isFinite(a.offsetY) ? roundNum(a.offsetY, 4) : 0,
        hasGranularDna: cliHasGranularDna(member),
        dnaSilhouetteSignature: cliComputeDnaSilhouetteSignature(member),
      };
    });

    beatTimeline.push({
      beatIndex: i,
      beatId: beat.id,
      startSec,
      endSec,
      durationSec,
      shot: beat.shot,
      stage: beat.stage,
      renderStyle: beat.renderStyle || renderStyle,
      transition: beat.transition,
      audioLeadSec,
      hitstopWindows,
      vfxBurstWindows,
      speechWindow,
      locationCard,
      actors,
    });
    cursorFrame = endFrame;
  }

  return {
    schema: 'stagecraft-shot-inspector/v1',
    exportedAt: new Date().toISOString(),
    studioVersion: '8.0.0',
    aspect: safeAspect,
    fps: 60,
    episode: JSON.parse(JSON.stringify(ep)),
    telemetry: {
      totalDurationSec: roundSec(cursorFrame / CLI_STUDIO_FPS),
      effectiveCadenceFps,
      beatTimeline,
      audioSummary: {
        targetLufs: -14,
        targetTruePeakDbtp: -1.5,
      },
    },
  };
}

function runOptionalShotInspectorQa(qaBundlePath, mp4Path, shotInspectorDir) {
  if (!shotInspectorDir) return null;
  const resolvedDir = path.resolve(shotInspectorDir);
  if (!fs.existsSync(resolvedDir) || !fs.statSync(resolvedDir).isDirectory()) {
    return 'shot-inspector QA skipped (directory not found)';
  }
  const tsEntry = path.resolve(resolvedDir, 'scripts', 'qa-headless-media.ts');
  const mjsEntry = path.resolve(resolvedDir, 'scripts', 'qa-headless-media.mjs');
  const targetScript = fs.existsSync(tsEntry) ? tsEntry : fs.existsSync(mjsEntry) ? mjsEntry : null;
  if (!targetScript || !targetScript.startsWith(resolvedDir + path.sep)) {
    return 'shot-inspector QA skipped (scripts/qa-headless-media.{ts,mjs} not found)';
  }
  const extraArgs = ['--bundle', qaBundlePath];
  if (mp4Path && fs.existsSync(mp4Path)) {
    extraArgs.push('--media', mp4Path);
  }
  try {
    if (targetScript.endsWith('.mjs')) {
      execFileSync(process.execPath, [targetScript, ...extraArgs], {
        cwd: resolvedDir,
        stdio: 'ignore',
        timeout: 180_000,
      });
    } else {
      const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      execFileSync(npxBin, ['tsx', targetScript, ...extraArgs], {
        cwd: resolvedDir,
        stdio: 'ignore',
        timeout: 180_000,
      });
    }
    return 'shot-inspector QA PASS';
  } catch {
    return 'shot-inspector QA reported findings (run Shot-Inspector directly for patch details)';
  }
}

function validateHeadlessUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid --url value: ${rawUrl}`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`--url must use http:// or https:// (got ${parsed.protocol})`);
  }
  parsed.searchParams.set('headless', '1');
  return parsed.toString();
}

async function pipeFramesToFfmpeg({ page, totalFrames, fps, mp4Path, wavPath, encoder }) {
  const ffArgs = [
    '-y',
    '-f',
    'image2pipe',
    '-vcodec',
    'png',
    '-framerate',
    String(fps),
    '-i',
    '-',
  ];

  if (wavPath) {
    ffArgs.push(
      '-i',
      wavPath,
      '-map',
      '0:v:0',
      '-map',
      '1:a:0',
      ...buildVideoCodecArgs(encoder),
      '-r',
      String(fps),
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-af',
      'loudnorm=I=-14:TP=-1.5:LRA=11',
      '-shortest',
      '-movflags',
      '+faststart',
      mp4Path
    );
  } else {
    ffArgs.push(
      ...buildVideoCodecArgs(encoder),
      '-r',
      String(fps),
      '-movflags',
      '+faststart',
      mp4Path
    );
  }

  const child = spawn('ffmpeg', ffArgs, {
    stdio: ['pipe', 'ignore', 'pipe'],
  });

  let stderrTail = '';
  child.stderr.on('data', (chunk) => {
    stderrTail = (stderrTail + chunk.toString('utf8')).slice(-800);
  });

  const exitPromise = new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg (${encoder}) exited with code ${code}: ${stderrTail.trim()}`));
    });
  });

  try {
    for (let f = 0; f < totalFrames; f++) {
      const frame = await page.evaluate(
        ({ frameIdx, frameRate }) => {
          const drv = window.__STAGECRAFT_HEADLESS__;
          if (typeof drv.renderFrameAtIndex === 'function') {
            return drv.renderFrameAtIndex(frameIdx, frameRate);
          }
          return drv.renderFrameAt(frameIdx / frameRate);
        },
        { frameIdx: f, frameRate: fps }
      );
      const pngBuf = Buffer.from(frame.pngBase64, 'base64');
      if (!child.stdin.write(pngBuf)) {
        await new Promise((resolve) => child.stdin.once('drain', resolve));
      }
    }
    child.stdin.end();
    await exitPromise;
  } catch (err) {
    try {
      child.kill('SIGKILL');
    } catch {
      // ignore kill error
    }
    throw err;
  }
}

async function renderEpisodeHeadlessMp4({
  page,
  ep,
  voices = [],
  musicStem = null,
  mp4Path,
  tempWavPath,
  contactSheetPath,
  fps,
  aspect,
  showCaptions,
  includeAudio,
  videoEncoder,
}) {
  const info = await page.evaluate(
    ({ episode, nextAspect, captions }) => {
      if (!window.__STAGECRAFT_HEADLESS__) {
        throw new Error('window.__STAGECRAFT_HEADLESS__ hook not found. Is Stagecraft Studio running at --url?');
      }
      return window.__STAGECRAFT_HEADLESS__.loadEpisode(episode, nextAspect, captions);
    },
    { episode: ep, nextAspect: aspect, captions: showCaptions }
  );

  // Inject decoded voiceovers & optional custom music stem (from .katha archive or --voices-dir)
  let loadedVoicesCount = 0;
  let hasMusicStem = false;
  if (voices.length > 0 || musicStem) {
    const voiceLoadRes = await page.evaluate(
      async ({ voiceList, stem }) => {
        const drv = window.__STAGECRAFT_HEADLESS__;
        if (typeof drv.loadVoiceAssets !== 'function') {
          return { loadedVoices: 0, hasMusicStem: false };
        }
        return drv.loadVoiceAssets({ voices: voiceList, musicStem: stem });
      },
      { voiceList: voices, stem: musicStem }
    );
    loadedVoicesCount = voiceLoadRes?.loadedVoices ?? 0;
    hasMusicStem = Boolean(voiceLoadRes?.hasMusicStem);
  }

  // Optional deterministic Contact Sheet & Visual QA export
  let qaScore = null;
  if (contactSheetPath) {
    const sheetRes = await page.evaluate(() => {
      const drv = window.__STAGECRAFT_HEADLESS__;
      if (typeof drv.renderContactSheetPng !== 'function') return null;
      return drv.renderContactSheetPng();
    });
    if (sheetRes && sheetRes.pngBase64) {
      fs.writeFileSync(contactSheetPath, Buffer.from(sheetRes.pngBase64, 'base64'));
      qaScore = typeof sheetRes.qaScore === 'number' ? sheetRes.qaScore : null;
    }
  }

  // Render deterministic OfflineAudioContext WAV soundtrack (music + ambience + beat & action-cue SFX)
  let wavPath = null;
  if (includeAudio && tempWavPath) {
    const audioRes = await page.evaluate(async () => {
      const drv = window.__STAGECRAFT_HEADLESS__;
      if (typeof drv.renderAudioWavBase64 !== 'function') return null;
      return drv.renderAudioWavBase64({ sampleRate: 48000 });
    });
    if (audioRes && audioRes.wavBase64) {
      fs.writeFileSync(tempWavPath, Buffer.from(audioRes.wavBase64, 'base64'));
      wavPath = tempWavPath;
    }
  }

  const totalFrames = Math.max(1, Math.ceil(info.duration * fps));
  let usedEncoder = videoEncoder;
  try {
    try {
      await pipeFramesToFfmpeg({ page, totalFrames, fps, mp4Path, wavPath, encoder: usedEncoder });
    } catch (err) {
      if (usedEncoder !== 'libx264') {
        usedEncoder = 'libx264';
        await pipeFramesToFfmpeg({ page, totalFrames, fps, mp4Path, wavPath, encoder: 'libx264' });
      } else {
        throw err;
      }
    }
  } finally {
    if (wavPath && fs.existsSync(wavPath)) {
      try {
        fs.unlinkSync(wavPath);
      } catch {
        // ignore temp WAV cleanup failure
      }
    }
  }
  return {
    usedEncoder,
    totalFrames,
    width: info.width,
    height: info.height,
    hasAudio: Boolean(wavPath),
    loadedVoicesCount,
    hasMusicStem,
    qaScore,
  };
}

async function processEpisode(
  inputPath,
  outDir,
  webmDir,
  voicesDir,
  ffmpegOk,
  videoEncoder,
  shortsExpDir,
  headlessOpts,
  qaOpts = { emitQaBundle: false, shotInspectorDir: '', aspect: '16:9' }
) {
  const { ep, voices, musicStem, archiveAspect } = loadEpisodeInput(inputPath, voicesDir);

  const safeId = String(ep.id).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80) || 'episode';
  const langCode =
    typeof ep.language === 'string' && /^[a-z]{2}(-[A-Za-z]{2})?$/.test(ep.language.trim())
      ? ep.language.trim().toLowerCase()
      : 'en';
  const resolveSafeOut = (filename) => {
    const resolved = path.resolve(outDir, filename);
    if (!resolved.startsWith(path.resolve(outDir) + path.sep)) {
      throw new Error(`Unsafe output path rejected: ${filename}`);
    }
    return resolved;
  };
  let cursor = 0;
  let cue = 1;
  const srtLines = [];
  const chapters = [];

  for (let i = 0; i < ep.beats.length; i++) {
    const b = ep.beats[i];
    const dur = Math.max(1.2, Number(b.duration) || 4);
    chapters.push(`${formatYtTime(cursor)} ${b.title || `Scene ${i + 1}`}`);
    const text = String(b.dialogue || '').trim();
    if (text) {
      const prefix = b.speakerLabel && b.speakerId !== 'narrator' ? `${b.speakerLabel}: ` : '';
      srtLines.push(
        `${cue}\n${formatSrtTime(cursor + 0.08)} --> ${formatSrtTime(cursor + dur - 0.08)}\n${prefix}${text}\n`
      );
      cue++;
    }
    cursor += dur;
  }

  const srtPath = resolveSafeOut(`${safeId}.${langCode}.srt`);
  fs.writeFileSync(srtPath, srtLines.join('\n'), 'utf8');

  const lead = ep.cast?.[0]?.name || 'The Hero';
  const rival = ep.cast?.[1]?.name || 'The Challenger';
  const launchTxt = [
    `=== YOUTUBE LAUNCH PACK: ${ep.title} (${ep.series}) [${langCode.toUpperCase()}] ===`,
    '',
    'TOP 5 HIGH-CTR TITLE OPTIONS:',
    `1. ${ep.title} | ${ep.series} (Animated Story & Analysis)`,
    `2. How ${lead} Outsmarted ${rival} — ${ep.title}`,
    `3. The Hidden Lesson Inside "${ep.title}"`,
    `4. ${ep.series}: ${ep.title} — Full Animated Adaptation`,
    `5. Why Audiences Still Talk About "${ep.title}" (${ep.series})`,
    '',
    'CHAPTER TIMESTAMPS:',
    ...chapters,
    '',
    'ABOUT THIS ADAPTATION (ORIGINAL TRANSFORMATIVE WORK):',
    `Original animated screenplay (${ep.series}) featuring custom-directed 2D visual styling, expressive facial acting, musical scoring, and editorial commentary.`,
    '',
    'PINNED COMMENT HOOK:',
    `What would YOU have done in ${lead}'s place against ${rival}? Comment below!`,
    '',
  ].join('\n');

  const launchPath = resolveSafeOut(`${safeId}.launch_pack.txt`);
  fs.writeFileSync(launchPath, launchTxt, 'utf8');

  let qaBundlePath = null;
  const resolvedBundleAspect = headlessOpts?.explicitAspect
    ? headlessOpts.aspect
    : archiveAspect || qaOpts?.aspect || '16:9';
  if (qaOpts?.emitQaBundle || qaOpts?.shotInspectorDir) {
    qaBundlePath = resolveSafeOut(`${safeId}.qa-bundle.json`);
    const qaBundle = buildStagecraftQaBundleCli(ep, resolvedBundleAspect);
    fs.writeFileSync(qaBundlePath, JSON.stringify(qaBundle, null, 2), 'utf8');
  }

  // Optional WebM -> Broadcast H.264 MP4 (-14 LUFS) conversion if matching .webm exists
  const candidateWebms = [
    path.join(webmDir, `${safeId}.webm`),
    path.join(path.dirname(inputPath), `${safeId}.webm`),
  ];
  const foundWebm = candidateWebms.find((p) => fs.existsSync(p));
  let mp4Note = 'no matching .webm found (record in studio or place in --webm-dir)';
  let emittedMp4Path = null;

  if (headlessOpts?.page && ffmpegOk) {
    const resolvedAspect = headlessOpts.explicitAspect
      ? headlessOpts.aspect
      : archiveAspect || headlessOpts.aspect;
    const aspectTag = resolvedAspect === '9:16' ? 'shorts_9x16' : '1080p';
    const mp4Path = resolveSafeOut(`${safeId}_${aspectTag}_${headlessOpts.fps}fps_headless.mp4`);
    const tempWavPath = headlessOpts.includeAudio
      ? resolveSafeOut(`${safeId}_${aspectTag}_tmp_audio.wav`)
      : null;
    const contactSheetPath = headlessOpts.contactSheet
      ? resolveSafeOut(`${safeId}_${aspectTag}_contact_sheet.png`)
      : null;
    const rendered = await renderEpisodeHeadlessMp4({
      page: headlessOpts.page,
      ep,
      voices,
      musicStem,
      mp4Path,
      tempWavPath,
      contactSheetPath,
      fps: headlessOpts.fps,
      aspect: resolvedAspect,
      showCaptions: headlessOpts.showCaptions,
      includeAudio: headlessOpts.includeAudio,
      videoEncoder,
    });
    const qaNote = runOptionalShortsExpQa(mp4Path, shortsExpDir);
    const voiceTag =
      rendered.loadedVoicesCount > 0 || rendered.hasMusicStem
        ? `, ${rendered.loadedVoicesCount} voice(s)${rendered.hasMusicStem ? ' + stem' : ''}`
        : '';
    const audioTag = rendered.hasAudio ? `, AAC -14 LUFS${voiceTag}` : ', video-only';
    const sheetTag = contactSheetPath
      ? ` | Contact Sheet -> ${path.basename(contactSheetPath)}${rendered.qaScore !== null ? ` (QA ${rendered.qaScore}/100)` : ''}`
      : '';

    // Optional A/B/C YouTube Thumbnail Pack export (1280x720 PNGs)
    let thumbCount = 0;
    if (headlessOpts.thumbnails) {
      const thumbs = await headlessOpts.page.evaluate(() => {
        const drv = window.__STAGECRAFT_HEADLESS__;
        if (typeof drv.renderThumbnailPackPngs !== 'function') return [];
        return drv.renderThumbnailPackPngs(['A', 'B', 'C']);
      });
      for (const th of thumbs || []) {
        if (!th?.pngBase64) continue;
        const thPath = resolveSafeOut(`${safeId}_thumb_${th.key}.png`);
        fs.writeFileSync(thPath, Buffer.from(th.pngBase64, 'base64'));
        thumbCount++;
      }
    }

    // Optional Auto-Detected 9:16 Viral Shorts Batch Render (--auto-shorts [N])
    let shortsRendered = 0;
    if (headlessOpts.autoShortsCount > 0) {
      const recRes = await headlessOpts.page.evaluate((maxN) => {
        const drv = window.__STAGECRAFT_HEADLESS__;
        if (typeof drv.recommendShorts !== 'function') return { slices: [] };
        return drv.recommendShorts(maxN);
      }, headlessOpts.autoShortsCount);
      const slices = Array.isArray(recRes?.slices) ? recRes.slices : [];
      const manifest = [];
      for (let sIdx = 0; sIdx < slices.length; sIdx++) {
        const sl = slices[sIdx];
        if (!sl?.episode) continue;
        const shortTag = String(sIdx + 1).padStart(2, '0');
        const shortMp4 = resolveSafeOut(`${safeId}_short_${shortTag}_9x16.mp4`);
        const shortWav = headlessOpts.includeAudio
          ? resolveSafeOut(`${safeId}_short_${shortTag}_tmp_audio.wav`)
          : null;
        const sliceBeatIds = new Set((sl.episode.beats || []).map((b) => b.id));
        const sliceVoices = voices.filter((v) => sliceBeatIds.has(v.beatId));

        // Write matching .srt for each Short slice
        let sc = 0;
        let sq = 1;
        const shortSrtLines = [];
        for (const sb of sl.episode.beats || []) {
          const sdur = Math.max(1.2, Number(sb.duration) || 4);
          const stxt = String(sb.dialogue || '').trim();
          if (stxt) {
            shortSrtLines.push(
              `${sq}\n${formatSrtTime(sc + 0.08)} --> ${formatSrtTime(sc + sdur - 0.08)}\n${stxt}\n`
            );
            sq++;
          }
          sc += sdur;
        }
        fs.writeFileSync(
          resolveSafeOut(`${safeId}_short_${shortTag}.${langCode}.srt`),
          shortSrtLines.join('\n'),
          'utf8'
        );

        await renderEpisodeHeadlessMp4({
          page: headlessOpts.page,
          ep: sl.episode,
          voices: sliceVoices,
          musicStem,
          mp4Path: shortMp4,
          tempWavPath: shortWav,
          contactSheetPath: null,
          fps: headlessOpts.fps,
          aspect: '9:16',
          showCaptions: headlessOpts.showCaptions,
          includeAudio: headlessOpts.includeAudio,
          videoEncoder,
        });
        runOptionalShortsExpQa(shortMp4, shortsExpDir);
        shortsRendered++;
        manifest.push({
          rank: sIdx + 1,
          file: path.basename(shortMp4),
          score: sl.score,
          durationSec: sl.durationSec,
          reasonTag: sl.reasonTag,
          suggestedHook: sl.suggestedHook,
          summary: sl.summary,
        });
      }
      if (manifest.length > 0) {
        fs.writeFileSync(
          resolveSafeOut(`${safeId}_shorts_manifest.json`),
          JSON.stringify({ episodeId: ep.id, shorts: manifest }, null, 2),
          'utf8'
        );
      }
    }

    const extraTag = [
      thumbCount > 0 ? `${thumbCount} thumbs` : '',
      shortsRendered > 0 ? `${shortsRendered} 9:16 shorts` : '',
    ]
      .filter(Boolean)
      .join(' + ');
    mp4Note = `Headless MP4 (${rendered.usedEncoder}, ${rendered.width}x${rendered.height}@${headlessOpts.fps}fps, ${rendered.totalFrames}f${audioTag}) -> ${path.basename(mp4Path)}${sheetTag}${extraTag ? ` | ${extraTag}` : ''}${qaNote ? ` | ${qaNote}` : ''}`;
    emittedMp4Path = mp4Path;
  } else if (foundWebm && ffmpegOk) {
    const mp4Path = resolveSafeOut(`${safeId}_1080p60_youtube.mp4`);
    let usedEncoder = videoEncoder;
    const runEncode = (enc) => {
      execFileSync(
        'ffmpeg',
        [
          '-y',
          '-i',
          foundWebm,
          ...buildVideoCodecArgs(enc),
          '-r',
          '60',
          '-c:a',
          'aac',
          '-b:a',
          '192k',
          '-af',
          'loudnorm=I=-14:TP=-1.5:LRA=11',
          '-movflags',
          '+faststart',
          mp4Path,
        ],
        { stdio: 'ignore', timeout: 1_800_000 }
      );
    };
    try {
      runEncode(usedEncoder);
    } catch (err) {
      if (usedEncoder !== 'libx264') {
        usedEncoder = 'libx264';
        runEncode('libx264');
      } else {
        throw err;
      }
    }
    const qaNote = runOptionalShortsExpQa(mp4Path, shortsExpDir);
    mp4Note = `MP4 exported (${usedEncoder}) -> ${path.basename(mp4Path)}${qaNote ? ` | ${qaNote}` : ''}`;
    emittedMp4Path = mp4Path;
  } else if (foundWebm && !ffmpegOk) {
    mp4Note = 'found .webm but ffmpeg is not installed on PATH';
  }

  let shotInspectorNote = '';
  if (qaBundlePath && qaOpts?.shotInspectorDir) {
    const siRes = runOptionalShotInspectorQa(qaBundlePath, emittedMp4Path, qaOpts.shotInspectorDir);
    if (siRes) shotInspectorNote = ` | ${siRes}`;
  }

  const warnings = [];
  if (!ep.title) warnings.push('missing title');
  if (!Array.isArray(ep.cast) || ep.cast.length === 0) warnings.push('empty cast');
  if (ep.beats.length < 3) warnings.push(`only ${ep.beats.length} beat(s)`);
  const warnNote = warnings.length > 0 ? ` [WARN: ${warnings.join(', ')}]` : '';

  const qaArtifactTag = qaBundlePath ? ' + .qa-bundle.json' : '';
  console.log(`[OK] ${safeId} [${langCode}] (${ep.beats.length} beats · ${cursor.toFixed(1)}s) -> .srt + .launch_pack.txt${qaArtifactTag} | ${mp4Note}${shotInspectorNote}${warnNote}`);
}

function concatMediaChapters(inputPaths, concatOutPath, ffmpegOk, videoEncoder) {
  if (!ffmpegOk) {
    throw new Error('FFmpeg is required for --concat mode. Install ffmpeg and try again.');
  }
  const missing = inputPaths.filter((p) => !fs.existsSync(p));
  if (missing.length > 0) {
    throw new Error(`Missing chapter file(s): ${missing.join(', ')}`);
  }
  const outResolved = path.resolve(concatOutPath);
  fs.mkdirSync(path.dirname(outResolved), { recursive: true });
  const listFile = `${outResolved}.chapters.txt`;
  const listContent = inputPaths
    .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
    .join('\n');
  fs.writeFileSync(listFile, listContent, 'utf8');

  const allMp4 = inputPaths.every((p) => p.toLowerCase().endsWith('.mp4'));
  const ffArgs = allMp4
    ? ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', '-movflags', '+faststart', outResolved]
    : [
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        listFile,
        ...buildVideoCodecArgs(videoEncoder),
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-af',
        'loudnorm=I=-14:TP=-1.5:LRA=11',
        '-movflags',
        '+faststart',
        outResolved,
      ];

  try {
    console.log(
      `Stitching ${inputPaths.length} chapters (${allMp4 ? 'lossless stream copy' : `broadcast H.264 [${videoEncoder}] -14 LUFS`}) -> ${outResolved}`
    );
    execFileSync('ffmpeg', ffArgs, { stdio: 'inherit', timeout: 1_800_000 });
    console.log(`[OK] Long-form master ready: ${outResolved}`);
  } finally {
    try {
      fs.unlinkSync(listFile);
    } catch {
      // ignore temp cleanup failure
    }
  }
}

const args = process.argv.slice(2);
let outDir = path.resolve('./renders');
let webmDir = path.resolve('./renders');
let voicesDir = null;
let validateOnly = false;
let concatOut = null;
let renderMp4 = false;
let headlessUrl = process.env.STAGECRAFT_URL || 'http://localhost:3000';
let headlessFps = 30;
let headlessAspect = '16:9';
let explicitAspect = false;
let headlessCaptions = true;
let headlessIncludeAudio = true;
let headlessContactSheet = false;
let headlessThumbnails = false;
let headlessAutoShortsCount = 0;
let requestedEncoder = (process.env.FFMPEG_ENCODER || 'auto').trim();
let shortsExpDir = (process.env.SHORTS_EXP_DIR || '').trim();
let emitQaBundle = false;
let shotInspectorDir = (process.env.SHOT_INSPECTOR_DIR || '').trim();
const files = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out' && args[i + 1]) {
    outDir = path.resolve(args[++i]);
  } else if (args[i] === '--webm-dir' && args[i + 1]) {
    webmDir = path.resolve(args[++i]);
  } else if (args[i] === '--voices-dir' && args[i + 1]) {
    voicesDir = path.resolve(args[++i]);
  } else if (args[i] === '--concat' && args[i + 1]) {
    concatOut = args[++i];
  } else if (args[i] === '--encoder' && args[i + 1]) {
    requestedEncoder = args[++i].trim();
  } else if (args[i] === '--shorts-exp-dir' && args[i + 1]) {
    shortsExpDir = args[++i].trim();
  } else if (args[i] === '--qa-bundle') {
    emitQaBundle = true;
  } else if (args[i] === '--shot-inspector-dir' && args[i + 1]) {
    shotInspectorDir = args[++i].trim();
    emitQaBundle = true;
  } else if (args[i] === '--render-mp4') {
    renderMp4 = true;
  } else if (args[i] === '--url' && args[i + 1]) {
    headlessUrl = args[++i].trim();
  } else if (args[i] === '--fps' && args[i + 1]) {
    const parsedFps = Number(args[++i]);
    if (Number.isFinite(parsedFps)) {
      headlessFps = Math.max(12, Math.min(60, Math.round(parsedFps)));
    }
  } else if (args[i] === '--aspect' && args[i + 1]) {
    const a = args[++i].trim();
    headlessAspect = a === '9:16' ? '9:16' : '16:9';
    explicitAspect = true;
  } else if (args[i] === '--no-captions') {
    headlessCaptions = false;
  } else if (args[i] === '--no-audio') {
    headlessIncludeAudio = false;
  } else if (args[i] === '--contact-sheet') {
    headlessContactSheet = true;
  } else if (args[i] === '--thumbnails') {
    headlessThumbnails = true;
  } else if (args[i] === '--auto-shorts') {
    const peek = args[i + 1];
    if (peek && /^\d+$/.test(peek)) {
      headlessAutoShortsCount = Math.max(1, Math.min(5, Number(args[++i])));
    } else {
      headlessAutoShortsCount = 3;
    }
  } else if (args[i] === '--validate') {
    validateOnly = true;
  } else if (!args[i].startsWith('--')) {
    files.push(path.resolve(args[i]));
  }
}

if (files.length === 0) {
  console.log(
    'Usage:\n' +
      '  Batch JSON/.katha: node scripts/render-batch.mjs <ep1.json|ep1.katha> [...] --out ./renders [--qa-bundle] [--shot-inspector-dir ../shot-inspector] [--webm-dir ./recordings] [--voices-dir ./voices] [--encoder auto|libx264|h264_nvenc|h264_amf|h264_videotoolbox] [--shorts-exp-dir ../shorts-exp] [--validate]\n' +
      '  Headless Factory:  node scripts/render-batch.mjs <ep1.json|ep1.katha> --out ./renders --render-mp4 [--qa-bundle] [--shot-inspector-dir ../shot-inspector] [--auto-shorts 3] [--thumbnails] [--contact-sheet] [--voices-dir ./voices] [--url http://localhost:3000] [--fps 30|60] [--aspect 16:9|9:16] [--no-captions] [--no-audio] [--encoder auto]\n' +
      '  Long-Form Join:    node scripts/render-batch.mjs ch01.webm ch02.webm ch03.webm --concat ./renders/full_20min.mp4 [--encoder auto]'
  );
  process.exit(0);
}

const ffmpegOk = hasFfmpeg();
const videoEncoder = resolveVideoEncoder(requestedEncoder, ffmpegOk);

if (concatOut) {
  try {
    concatMediaChapters(files, concatOut, ffmpegOk, videoEncoder);
    process.exit(0);
  } catch (err) {
    console.error(`[FAIL] --concat -> ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

async function main() {
  if (!validateOnly) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  let browser = null;
  let headlessOpts = null;

  if (renderMp4 && !validateOnly) {
    if (!ffmpegOk) {
      console.error('[FAIL] --render-mp4 requires ffmpeg on PATH.');
      process.exit(1);
    }
    const targetUrl = validateHeadlessUrl(headlessUrl);
    let playwright;
    try {
      playwright = await import('playwright');
    } catch {
      console.error(
        '[FAIL] --render-mp4 requires Playwright locally. Install once with:\n' +
          '  npm install -D playwright && npx playwright install chromium'
      );
      process.exit(1);
    }
    browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport:
        headlessAspect === '9:16'
          ? { width: 1080, height: 1920 }
          : { width: 1920, height: 1080 },
    });
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForFunction(() => Boolean(window.__STAGECRAFT_HEADLESS__), {
      timeout: 15_000,
    });
    headlessOpts = {
      page,
      fps: headlessFps,
      aspect: headlessAspect,
      explicitAspect,
      showCaptions: headlessCaptions,
      includeAudio: headlessIncludeAudio,
      contactSheet: headlessContactSheet,
      thumbnails: headlessThumbnails,
      autoShortsCount: headlessAutoShortsCount,
    };
  }

  console.log(
    `Stagecraft Studio Offline Batch Packager | Mode: ${
      validateOnly
        ? 'VALIDATE ONLY'
        : renderMp4
          ? `HEADLESS MP4 (${headlessAspect}@${headlessFps}fps) -> ${outDir}`
          : `EXPORT -> ${outDir}`
    } | FFmpeg: ${ffmpegOk ? `READY (${videoEncoder}, -14 LUFS MP4)` : 'NOT FOUND (SRT & Launch Packs only)'}${voicesDir ? ` | Voices: ${voicesDir}` : ''}${emitQaBundle ? ' | QA Bundle: ON (v1)' : ''}${shotInspectorDir ? ` | Shot-Inspector: ${path.resolve(shotInspectorDir)}` : ''}${shortsExpDir ? ` | shorts-exp QA: ${path.resolve(shortsExpDir)}` : ''}`
  );

  let succeeded = 0;
  let failed = 0;

  try {
    for (const file of files) {
      try {
        if (validateOnly) {
          const { ep, voices, musicStem } = loadEpisodeInput(file, voicesDir);
          if (!ep?.id || !Array.isArray(ep.beats) || ep.beats.length === 0) {
            throw new Error('Missing id or beats[]');
          }
          const totalSec = ep.beats.reduce((s, b) => s + Math.max(1.2, Number(b.duration) || 4), 0);
          console.log(
            `[VALID] ${ep.id} (${ep.beats.length} beats, ${totalSec.toFixed(1)}s, ${ep.cast?.length || 0} cast${voices.length ? `, ${voices.length} voice(s)` : ''}${musicStem ? ' + stem' : ''})`
          );
        } else {
          await processEpisode(
            file,
            outDir,
            webmDir,
            voicesDir,
            ffmpegOk,
            videoEncoder,
            shortsExpDir,
            headlessOpts,
            { emitQaBundle, shotInspectorDir, aspect: headlessAspect }
          );
        }
        succeeded++;
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[FAIL] ${path.basename(file)} -> ${msg}`);
      }
    }
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }

  console.log(`Batch complete: ${succeeded} succeeded, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`[FAIL] ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});

