import { AspectMode, EpisodeScript, frameIndexToTime } from './types';
import {
  VoiceClipEntry,
  renderEpisodeAudioOffline,
} from './audioEngine';
import { evaluateEpisodeAtTime, renderEpisodeFrame } from './renderer';
import { EpisodeChapterSlice } from './longFormEngine';
import { getVoiceSpeechProfile, sampleVoiceProfileAtTime } from './voiceEnvelope';
import {
  LoudnessNormalizationResult,
  measureAudioBufferLufs,
  normalizeAudioBufferLufs,
} from './loudnessMeter';

// =========================================================================
// 1. ZERO-DEPENDENCY SPEC-COMPLIANT EBML / WEBM MUXER (VP8/VP9 + OPUS)
// =========================================================================

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const c of chunks) total += c.byteLength;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

function encodeEbmlVintSize(value: number): Uint8Array {
  if (value < 0x7f) {
    return new Uint8Array([0x80 | value]);
  }
  if (value < 0x3fff) {
    return new Uint8Array([0x40 | (value >> 8), value & 0xff]);
  }
  if (value < 0x1fffff) {
    return new Uint8Array([0x20 | (value >> 16), (value >> 8) & 0xff, value & 0xff]);
  }
  if (value < 0x0fffffff) {
    return new Uint8Array([
      0x10 | (value >>> 24),
      (value >>> 16) & 0xff,
      (value >>> 8) & 0xff,
      value & 0xff,
    ]);
  }
  // 8-byte VINT for very large segments
  const hi = Math.floor(value / 0x100000000);
  const lo = value >>> 0;
  return new Uint8Array([
    0x01,
    (hi >>> 16) & 0xff,
    (hi >>> 8) & 0xff,
    hi & 0xff,
    (lo >>> 24) & 0xff,
    (lo >>> 16) & 0xff,
    (lo >>> 8) & 0xff,
    lo & 0xff,
  ]);
}

function ebmlIdBytes(id: number): Uint8Array {
  if (id <= 0xff) return new Uint8Array([id]);
  if (id <= 0xffff) return new Uint8Array([(id >>> 8) & 0xff, id & 0xff]);
  if (id <= 0xffffff) return new Uint8Array([(id >>> 16) & 0xff, (id >>> 8) & 0xff, id & 0xff]);
  return new Uint8Array([
    (id >>> 24) & 0xff,
    (id >>> 16) & 0xff,
    (id >>> 8) & 0xff,
    id & 0xff,
  ]);
}

function ebmlElement(id: number, payload: Uint8Array): Uint8Array {
  return concatBytes([ebmlIdBytes(id), encodeEbmlVintSize(payload.byteLength), payload]);
}

function ebmlMaster(id: number, children: Uint8Array[]): Uint8Array {
  return ebmlElement(id, concatBytes(children));
}

function ebmlUint(id: number, value: number): Uint8Array {
  const bytes: number[] = [];
  let v = Math.max(0, Math.floor(value));
  do {
    bytes.unshift(v & 0xff);
    v = Math.floor(v / 256);
  } while (v > 0);
  return ebmlElement(id, new Uint8Array(bytes));
}

function ebmlFloat64(id: number, value: number): Uint8Array {
  const buf = new ArrayBuffer(8);
  new DataView(buf).setFloat64(0, value, false);
  return ebmlElement(id, new Uint8Array(buf));
}

function ebmlAscii(id: number, str: string): Uint8Array {
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 0x7f;
  return ebmlElement(id, out);
}

/** Standard 19-byte RFC 7845 OpusHead header for Matroska/WebM CodecPrivate */
function buildOpusHead(channels: number, sampleRate: number): Uint8Array {
  const buf = new Uint8Array(19);
  const dv = new DataView(buf.buffer);
  const sig = 'OpusHead';
  for (let i = 0; i < sig.length; i++) buf[i] = sig.charCodeAt(i);
  buf[8] = 1; // version
  buf[9] = channels;
  dv.setUint16(10, 312, true); // pre-skip samples (standard 6.5ms at 48kHz)
  dv.setUint32(12, sampleRate, true);
  dv.setInt16(16, 0, true); // output gain
  buf[18] = 0; // channel mapping family
  return buf;
}

interface MuxPacket {
  trackNumber: 1 | 2;
  timestampMs: number;
  isKey: boolean;
  data: Uint8Array;
}

export class SimpleWebMMuxer {
  private packets: MuxPacket[] = [];
  private width: number;
  private height: number;
  private videoCodecId: 'V_VP8' | 'V_VP9';
  private hasAudio: boolean;
  private audioSampleRate: number;
  private audioChannels: number;

  constructor(opts: {
    width: number;
    height: number;
    videoCodecId: 'V_VP8' | 'V_VP9';
    hasAudio: boolean;
    audioSampleRate: number;
    audioChannels: number;
  }) {
    this.width = opts.width;
    this.height = opts.height;
    this.videoCodecId = opts.videoCodecId;
    this.hasAudio = opts.hasAudio;
    this.audioSampleRate = opts.audioSampleRate;
    this.audioChannels = opts.audioChannels;
  }

  public addPacket(
    trackNumber: 1 | 2,
    timestampUs: number,
    isKey: boolean,
    data: Uint8Array
  ): void {
    this.packets.push({
      trackNumber,
      timestampMs: Math.max(0, Math.round(timestampUs / 1000)),
      isKey,
      data,
    });
  }

  public finalize(durationMs: number): Blob {
    // Sort interleaved video & audio packets monotonically by timestamp
    this.packets.sort((a, b) => a.timestampMs - b.timestampMs || a.trackNumber - b.trackNumber);

    // 1. EBML Header (starts with 0x1A 0x45 0xDF 0xA3)
    const ebmlHeader = ebmlMaster(0x1a45dfa3, [
      ebmlUint(0x4286, 1), // EBMLVersion
      ebmlUint(0x42f7, 1), // EBMLReadVersion
      ebmlUint(0x42f2, 4), // EBMLMaxIDLength
      ebmlUint(0x42f3, 8), // EBMLMaxSizeLength
      ebmlAscii(0x4282, 'webm'), // DocType
      ebmlUint(0x4287, 4), // DocTypeVersion
      ebmlUint(0x4285, 2), // DocTypeReadVersion
    ]);

    // 2. Segment Info (TimecodeScale = 1,000,000 ns = 1ms)
    const info = ebmlMaster(0x1549a966, [
      ebmlUint(0x2ad7b1, 1000000),
      ebmlAscii(0x4d80, 'KathaStudio'),
      ebmlAscii(0x5741, 'KathaStudio'),
      ebmlFloat64(0x4489, Math.max(1, durationMs)),
    ]);

    // 3. Tracks
    const trackEntries: Uint8Array[] = [];
    const videoTrack = ebmlMaster(0xae, [
      ebmlUint(0xd7, 1), // TrackNumber = 1
      ebmlUint(0x73c5, 1), // TrackUID = 1
      ebmlUint(0x83, 1), // TrackType = video
      ebmlAscii(0x86, this.videoCodecId),
      ebmlMaster(0xe0, [
        ebmlUint(0xb0, this.width), // PixelWidth
        ebmlUint(0xba, this.height), // PixelHeight
        ebmlUint(0x54b0, this.width), // DisplayWidth
        ebmlUint(0x54ba, this.height), // DisplayHeight
      ]),
    ]);
    trackEntries.push(videoTrack);

    if (this.hasAudio) {
      const audioTrack = ebmlMaster(0xae, [
        ebmlUint(0xd7, 2), // TrackNumber = 2
        ebmlUint(0x73c5, 2), // TrackUID = 2
        ebmlUint(0x83, 2), // TrackType = audio
        ebmlAscii(0x86, 'A_OPUS'),
        ebmlElement(0x63a2, buildOpusHead(this.audioChannels, this.audioSampleRate)),
        ebmlMaster(0xe1, [
          ebmlFloat64(0xb5, this.audioSampleRate), // SamplingFrequency
          ebmlUint(0x9f, this.audioChannels), // Channels
        ]),
      ]);
      trackEntries.push(audioTrack);
    }

    const tracks = ebmlMaster(0x1654ae6b, trackEntries);

    // 4. Clusters (start a fresh Cluster on video keyframes or every 2500ms)
    const clusters: Uint8Array[] = [];
    let clusterTimecode = -1;
    let clusterBlocks: Uint8Array[] = [];

    const flushCluster = () => {
      if (clusterBlocks.length === 0 || clusterTimecode < 0) return;
      clusters.push(
        ebmlMaster(0x1f43b675, [ebmlUint(0xe7, clusterTimecode), ...clusterBlocks])
      );
      clusterBlocks = [];
    };

    for (const pkt of this.packets) {
      const needsNewCluster =
        clusterTimecode < 0 ||
        (pkt.trackNumber === 1 && pkt.isKey && pkt.timestampMs - clusterTimecode >= 1500) ||
        pkt.timestampMs - clusterTimecode >= 30000;

      if (needsNewCluster) {
        flushCluster();
        clusterTimecode = pkt.timestampMs;
      }

      const relMs = Math.max(-32768, Math.min(32767, pkt.timestampMs - clusterTimecode));
      const header = new Uint8Array(4);
      header[0] = 0x80 | pkt.trackNumber; // Track number VINT (1 or 2)
      header[1] = (relMs >> 8) & 0xff;
      header[2] = relMs & 0xff;
      header[3] = pkt.isKey ? 0x80 : 0x00;

      const blockPayload = concatBytes([header, pkt.data]);
      clusterBlocks.push(ebmlElement(0xa3, blockPayload));
    }
    flushCluster();
    // Free raw packet references before finalizing Blob so peak JS heap stays minimal on 8-25 min videos
    this.packets = [];

    // Zero-copy WebM Blob assembly: compute total Segment payload size and stream chunks
    // directly into BlobPart[] instead of allocating 2x-3x giant contiguous Uint8Array copies!
    let segmentPayloadSize = info.byteLength + tracks.byteLength;
    for (const c of clusters) {
      segmentPayloadSize += c.byteLength;
    }
    const segmentHeader = concatBytes([
      ebmlIdBytes(0x18538067),
      encodeEbmlVintSize(segmentPayloadSize),
    ]);

    const parts: BlobPart[] = [
      ebmlHeader as BlobPart,
      segmentHeader as BlobPart,
      info as BlobPart,
      tracks as BlobPart,
    ];
    for (const c of clusters) {
      parts.push(c as BlobPart);
    }

    return new Blob(parts, { type: 'video/webm' });
  }
}

// =========================================================================
// 2. LOSSLESS 16-BIT PCM .WAV MASTER ENCODER
// =========================================================================

export function encodeAudioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = Math.min(2, buffer.numberOfChannels);
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const ab = new ArrayBuffer(44 + dataSize);
  const view = new DataView(ab);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  let pos = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      pos += 2;
    }
  }

  return new Blob([ab], { type: 'audio/wav' });
}

// =========================================================================
// 3. DETERMINISTIC OFFLINE FAST RENDERER (WEBCODECS + OFFLINE AUDIO)
// =========================================================================

export function supportsWebCodecsFastRender(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as { VideoEncoder?: unknown }).VideoEncoder === 'function' &&
    typeof (window as unknown as { VideoFrame?: unknown }).VideoFrame === 'function'
  );
}

export interface FastRenderProgress {
  phase: 'audio' | 'video' | 'muxing' | 'done';
  frame: number;
  totalFrames: number;
  percent: number;
  elapsedSec: number;
  speedMultiplier: number;
  message: string;
}

export type RenderBitrateMode = 'standard' | 'longform_cinema';

export interface FastRenderOptions {
  episode: EpisodeScript;
  aspect: AspectMode;
  fps: 30 | 60;
  bitrateMode?: RenderBitrateMode;
  skipWav?: boolean;
  showCaptions: boolean;
  expressionsEnabled?: boolean;
  voiceClips: Map<string, VoiceClipEntry>;
  musicStemBuffer?: AudioBuffer | null;
  musicLevel?: number;
  autoDuck?: boolean;
  /** Apply browser-native EBU R128 / -14 LUFS loudness & -1.5 dBTP true-peak normalization (default true) */
  normalizeLufs?: boolean;
  /** Enable deterministic stereo spatial panning & stage room acoustics (default episode style or true) */
  spatialAudio?: boolean;
  signal?: AbortSignal;
  onProgress?: (p: FastRenderProgress) => void;
}

export interface FastRenderResult {
  webmBlob: Blob;
  wavBlob: Blob | null;
  elapsedSec: number;
  frameCount: number;
  durationSec: number;
  speedMultiplier: number;
  videoCodec: string;
  hasOpusAudio: boolean;
  loudnessMetrics?: LoudnessNormalizationResult;
}

export interface ChapterRenderArtifact {
  chapterIndex: number;
  chapterNumber: number;
  title: string;
  filenameBase: string;
  webmBlob: Blob | null;
  uploadedToServer?: boolean;
  durationSec: number;
  sizeBytes: number;
  elapsedSec: number;
  videoCodec: string;
  hasOpusAudio: boolean;
}

export interface ChapteredRenderProgress {
  chapterIndex: number;
  chapterCount: number;
  chapterTitle: string;
  overallPercent: number;
  chapterProgress: FastRenderProgress;
}

export interface ChapteredRenderResult {
  chapters: ChapterRenderArtifact[];
  totalDurationSec: number;
  totalElapsedSec: number;
  totalSizeBytes: number;
}

function sampleVoiceEnergyAtTime(
  clip: VoiceClipEntry | undefined,
  localT: number
): number | null {
  if (!clip || !clip.buffer) return null;
  if (localT < 0 || localT >= clip.duration) return 0;
  const data = clip.buffer.getChannelData(0);
  const sr = clip.buffer.sampleRate;
  const center = Math.floor(localT * sr);
  const win = Math.min(512, Math.floor(sr * 0.02));
  const start = Math.max(0, center - (win >> 1));
  const end = Math.min(data.length, start + win);
  if (end <= start) return 0;
  let sumSq = 0;
  for (let i = start; i < end; i++) {
    const v = data[i];
    sumSq += v * v;
  }
  const rms = Math.sqrt(sumSq / (end - start));
  return Math.min(1, rms * 4.4);
}

async function selectSupportedVideoCodec(
  width: number,
  height: number,
  fps: number,
  bitrate: number
): Promise<{ webCodecsString: string; webmCodecId: 'V_VP8' | 'V_VP9' }> {
  const candidates: Array<{ webCodecsString: string; webmCodecId: 'V_VP8' | 'V_VP9' }> = [
    { webCodecsString: 'vp09.00.10.08', webmCodecId: 'V_VP9' },
    { webCodecsString: 'vp8', webmCodecId: 'V_VP8' },
  ];
  for (const c of candidates) {
    try {
      const support = await VideoEncoder.isConfigSupported({
        codec: c.webCodecsString,
        width,
        height,
        framerate: fps,
        bitrate,
      });
      if (support.supported) return c;
    } catch {
      // try next codec
    }
  }
  return { webCodecsString: 'vp8', webmCodecId: 'V_VP8' };
}

async function supportsOpusAudioEncoder(sampleRate: number, channels: number): Promise<boolean> {
  if (typeof AudioEncoder !== 'function' || typeof AudioData !== 'function') return false;
  try {
    const support = await AudioEncoder.isConfigSupported({
      codec: 'opus',
      sampleRate,
      numberOfChannels: channels,
      bitrate: 128000,
    });
    return Boolean(support.supported);
  } catch {
    return false;
  }
}

export async function renderEpisodeFastOffline(
  options: FastRenderOptions
): Promise<FastRenderResult> {
  if (!supportsWebCodecsFastRender()) {
    throw new Error('WebCodecs VideoEncoder is not available in this browser.');
  }

  const startMs = performance.now();
  const {
    episode,
    aspect,
    fps,
    showCaptions,
    expressionsEnabled = true,
    voiceClips,
    signal,
    onProgress,
  } = options;
  const width = aspect === '9:16' ? 1080 : 1920;
  const height = aspect === '9:16' ? 1920 : 1080;
  const totalDuration = Math.max(
    1,
    episode.beats.reduce((sum, b) => sum + Math.max(1.2, b.duration || 4), 0)
  );
  const totalFrames = Math.max(1, Math.ceil(totalDuration * fps));

  const checkAbort = () => {
    if (signal?.aborted) {
      throw new DOMException('Render cancelled', 'AbortError');
    }
  };

  // Phase 1: Deterministic OfflineAudioContext Soundtrack + Voiceover Mixdown
  onProgress?.({
    phase: 'audio',
    frame: 0,
    totalFrames,
    percent: 4,
    elapsedSec: 0,
    speedMultiplier: 0,
    message: 'Mixing soundtrack, ambient bed, SFX & voiceovers offline...',
  });

  // Scope voice decoding strictly to beats in THIS episode/chapter so 200+ beat projects
  // never hold all uncompressed PCM buffers in RAM simultaneously during chaptered renders!
  const scopedVoiceClips = new Map<string, VoiceClipEntry>();
  const needsDecode: Array<{ beatId: string; clip: VoiceClipEntry }> = [];
  for (const beat of episode.beats) {
    const c = voiceClips.get(beat.id);
    if (!c) continue;
    if (c.buffer) {
      scopedVoiceClips.set(beat.id, c);
    } else if (c.blob) {
      needsDecode.push({ beatId: beat.id, clip: c });
    }
  }
  if (needsDecode.length > 0) {
    const OfflineAC =
      window.OfflineAudioContext ||
      (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
        .webkitOfflineAudioContext;
    const decodeCtx = new OfflineAC(2, 128, 48000);
    for (const { beatId, clip } of needsDecode) {
      checkAbort();
      if (!clip.blob) continue;
      try {
        const ab = await clip.blob.arrayBuffer();
        const decoded = await decodeCtx.decodeAudioData(ab);
        scopedVoiceClips.set(beatId, {
          ...clip,
          buffer: decoded,
          duration: decoded.duration,
        });
      } catch {
        // Skip unreadable clip cleanly
      }
    }
  }

  const mixedAudio = await renderEpisodeAudioOffline(episode, scopedVoiceClips, {
    sampleRate: 48000,
    musicLevel: options.musicLevel ?? 0.62,
    autoDuck: options.autoDuck ?? true,
    musicStemBuffer: options.musicStemBuffer ?? null,
    spatialAudio: options.spatialAudio ?? episode.visualStyle?.spatialAudio ?? true,
  });
  checkAbort();

  let loudnessMetrics: LoudnessNormalizationResult;
  if (options.normalizeLufs !== false) {
    loudnessMetrics = normalizeAudioBufferLufs(mixedAudio, {
      targetLufs: -14.0,
      truePeakCeilingDb: -1.5,
    });
  } else {
    const measured = measureAudioBufferLufs(mixedAudio);
    loudnessMetrics = {
      before: measured,
      after: measured,
      appliedGainDb: 0,
      targetLufs: -14.0,
      truePeakCeilingDb: -1.5,
      normalized: false,
      limiterEngaged: false,
    };
  }

  const wavBlob = options.skipWav ? null : encodeAudioBufferToWav(mixedAudio);

  // Phase 2: Configure WebCodecs VideoEncoder + AudioEncoder (Opus)
  // Long-Form Cinema mode uses 5 Mbps @ 30fps (razor-sharp for 2D vector/stylized art, ~50% smaller files!)
  const videoBitrate =
    options.bitrateMode === 'longform_cinema'
      ? 5_000_000
      : fps === 60
        ? 11_000_000
        : 8_000_000;
  const codecChoice = await selectSupportedVideoCodec(width, height, fps, videoBitrate);
  const hasOpus = await supportsOpusAudioEncoder(48000, 2);

  const muxer = new SimpleWebMMuxer({
    width,
    height,
    videoCodecId: codecChoice.webmCodecId,
    hasAudio: hasOpus,
    audioSampleRate: 48000,
    audioChannels: 2,
  });

  let encoderError: Error | null = null;

  const videoEncoder = new VideoEncoder({
    output: (chunk) => {
      const bytes = new Uint8Array(chunk.byteLength);
      chunk.copyTo(bytes);
      muxer.addPacket(1, chunk.timestamp, chunk.type === 'key', bytes);
    },
    error: (err) => {
      encoderError = err instanceof Error ? err : new Error(String(err));
    },
  });

  videoEncoder.configure({
    codec: codecChoice.webCodecsString,
    width,
    height,
    bitrate: videoBitrate,
    framerate: fps,
  });

  // Encode Opus Audio in 20ms stereo chunks (960 samples @ 48kHz)
  if (hasOpus) {
    const audioEncoder = new AudioEncoder({
      output: (chunk) => {
        const bytes = new Uint8Array(chunk.byteLength);
        chunk.copyTo(bytes);
        muxer.addPacket(2, chunk.timestamp, true, bytes);
      },
      error: (err) => {
        encoderError = err instanceof Error ? err : new Error(String(err));
      },
    });
    try {
      audioEncoder.configure({
        codec: 'opus',
        sampleRate: 48000,
        numberOfChannels: 2,
        bitrate: 128000,
      });

      const left = mixedAudio.getChannelData(0);
      const right = mixedAudio.numberOfChannels > 1 ? mixedAudio.getChannelData(1) : left;
      const chunkFrames = 960; // 20ms at 48kHz
      const maxSamples = Math.min(mixedAudio.length, Math.ceil(totalDuration * 48000));

      for (let pos = 0; pos < maxSamples; pos += chunkFrames) {
        checkAbort();
        if (encoderError) throw encoderError;
        const count = Math.min(chunkFrames, maxSamples - pos);
        const planar = new Float32Array(count * 2);
        planar.set(left.subarray(pos, pos + count), 0);
        planar.set(right.subarray(pos, pos + count), count);

        const audioData = new AudioData({
          format: 'f32-planar',
          sampleRate: 48000,
          numberOfFrames: count,
          numberOfChannels: 2,
          timestamp: Math.round((pos / 48000) * 1_000_000),
          data: planar,
        });
        try {
          audioEncoder.encode(audioData);
        } finally {
          audioData.close();
        }

        if (audioEncoder.encodeQueueSize > 24) {
          await new Promise((r) => setTimeout(r, 2));
        }
      }
      await audioEncoder.flush();
    } catch (err) {
      try {
        videoEncoder.close();
      } catch {
        // ignore close error
      }
      throw err;
    } finally {
      try {
        if (audioEncoder.state !== 'closed') audioEncoder.close();
      } catch {
        // ignore close error
      }
    }
  }

  // Phase 3: Frame-by-frame Deterministic Offscreen Canvas Render
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    videoEncoder.close();
    throw new Error('Could not acquire 2D canvas context for offline render.');
  }

  const frameDurUs = Math.round(1_000_000 / fps);
  const keyFrameInterval = fps * 2;

  try {
    for (let f = 0; f < totalFrames; f++) {
      checkAbort();
      if (encoderError) throw encoderError;

      const t = frameIndexToTime(f, fps);
      const preEval = evaluateEpisodeAtTime(episode, t, null);
      const voiceClip = scopedVoiceClips.get(preEval.beat.id);
      const voiceProfile = getVoiceSpeechProfile(voiceClip?.buffer);
      const voiceEnergy =
        sampleVoiceProfileAtTime(voiceProfile, preEval.localT) ??
        sampleVoiceEnergyAtTime(voiceClip, preEval.localT);
      const ev =
        voiceEnergy !== null || voiceProfile?.speechWindow
          ? evaluateEpisodeAtTime(episode, t, voiceEnergy, voiceProfile?.speechWindow)
          : preEval;

      renderEpisodeFrame(
        ctx,
        width,
        height,
        episode,
        ev,
        t,
        aspect,
        showCaptions,
        expressionsEnabled,
        voiceProfile?.speechWindow
      );

      const frame = new VideoFrame(canvas, {
        timestamp: Math.round(t * 1_000_000),
        duration: frameDurUs,
      });
      videoEncoder.encode(frame, { keyFrame: f % keyFrameInterval === 0 });
      frame.close();

      // Apply gentle backpressure so GPU/encoder memory stays flat even on 20-beat epics
      while (videoEncoder.encodeQueueSize > 8) {
        await new Promise((r) => setTimeout(r, 3));
      }

      // Yield briefly every 8 frames so progress bar & Cancel button stay responsive
      if (f % 8 === 0 || f === totalFrames - 1) {
        const elapsedSec = (performance.now() - startMs) / 1000;
        const speedMultiplier = elapsedSec > 0.05 ? t / elapsedSec : 0;
        const pct = Math.min(96, Math.round(8 + (f / totalFrames) * 88));
        onProgress?.({
          phase: 'video',
          frame: f + 1,
          totalFrames,
          percent: pct,
          elapsedSec,
          speedMultiplier,
          message: `Rendering frame ${f + 1} / ${totalFrames} (${width}×${height} @ ${fps}fps)`,
        });
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    onProgress?.({
      phase: 'muxing',
      frame: totalFrames,
      totalFrames,
      percent: 98,
      elapsedSec: (performance.now() - startMs) / 1000,
      speedMultiplier: totalDuration / Math.max(0.1, (performance.now() - startMs) / 1000),
      message: 'Flushing WebCodecs & muxing WebM container...',
    });

    await videoEncoder.flush();
    videoEncoder.close();
  } catch (err) {
    try {
      videoEncoder.close();
    } catch {
      // ignore close error
    }
    throw err;
  }

  if (encoderError) throw encoderError;

  const webmBlob = muxer.finalize(Math.round(totalDuration * 1000));
  const elapsedSec = Math.max(0.1, (performance.now() - startMs) / 1000);
  const speedMultiplier = Number((totalDuration / elapsedSec).toFixed(1));

  onProgress?.({
    phase: 'done',
    frame: totalFrames,
    totalFrames,
    percent: 100,
    elapsedSec,
    speedMultiplier,
    message: `Rendered ${totalFrames} frames in ${elapsedSec.toFixed(1)}s (${speedMultiplier}x realtime)`,
  });

  return {
    webmBlob,
    wavBlob,
    elapsedSec,
    frameCount: totalFrames,
    durationSec: totalDuration,
    speedMultiplier,
    videoCodec: codecChoice.webmCodecId === 'V_VP9' ? 'VP9' : 'VP8',
    hasOpusAudio: hasOpus,
    loudnessMetrics,
  };
}

/**
 * Memory-safe Long-Form Chaptered Offline Renderer (8–25+ minute episodes).
 * Renders each chapter sequentially so OfflineAudioContext buffers & offscreen canvases
 * are freed between chapters and every exported chapter stays well under 150 MB for MP4 conversion.
 */
export async function renderEpisodeByChapters(
  chapters: EpisodeChapterSlice[],
  options: Omit<FastRenderOptions, 'episode' | 'onProgress'> & {
    baseName: string;
    skipChapterIndices?: Set<number>;
    releaseBlobAfterCallback?: boolean;
    onChapterProgress?: (p: ChapteredRenderProgress) => void;
    onChapterDone?: (artifact: ChapterRenderArtifact) => void | Promise<void>;
  }
): Promise<ChapteredRenderResult> {
  const startAll = performance.now();
  const safeBase = options.baseName.replace(/[^a-zA-Z0-9_-]+/g, '_');
  const artifacts: ChapterRenderArtifact[] = [];
  const totalDurationSec = chapters.reduce((s, c) => s + c.durationSec, 0);

  for (let i = 0; i < chapters.length; i++) {
    if (options.signal?.aborted) {
      throw new DOMException('Render cancelled', 'AbortError');
    }
    const ch = chapters[i];
    const filenameBase = `${safeBase}_ch${String(ch.chapterNumber).padStart(2, '0')}`;

    if (options.skipChapterIndices?.has(i)) {
      const skippedArtifact: ChapterRenderArtifact = {
        chapterIndex: i,
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        filenameBase,
        webmBlob: null,
        uploadedToServer: true,
        durationSec: ch.durationSec,
        sizeBytes: 0,
        elapsedSec: 0,
        videoCodec: 'VP9',
        hasOpusAudio: true,
      };
      artifacts.push(skippedArtifact);
      continue;
    }

    const chResult = await renderEpisodeFastOffline({
      ...options,
      episode: ch.subEpisode,
      skipWav: true, // Avoid 230MB+ uncompressed PCM WAV allocations across multi-chapter renders
      onProgress: (p) => {
        const overallPercent = Math.min(
          99,
          Math.round(((i + p.percent / 100) / Math.max(1, chapters.length)) * 100)
        );
        options.onChapterProgress?.({
          chapterIndex: i,
          chapterCount: chapters.length,
          chapterTitle: ch.title,
          overallPercent,
          chapterProgress: p,
        });
      },
    });

    const artifact: ChapterRenderArtifact = {
      chapterIndex: i,
      chapterNumber: ch.chapterNumber,
      title: ch.title,
      filenameBase,
      webmBlob: chResult.webmBlob,
      uploadedToServer: false,
      durationSec: chResult.durationSec,
      sizeBytes: chResult.webmBlob.size,
      elapsedSec: chResult.elapsedSec,
      videoCodec: chResult.videoCodec,
      hasOpusAudio: chResult.hasOpusAudio,
    };

    if (options.onChapterDone) {
      await options.onChapterDone(artifact);
    }

    if (options.releaseBlobAfterCallback) {
      artifact.webmBlob = null;
      artifact.uploadedToServer = true;
    }

    artifacts.push(artifact);

    // Yield briefly so browser GC can release the previous chapter's AudioBuffer & WebCodecs buffers
    await new Promise((r) => setTimeout(r, 40));
  }

  return {
    chapters: artifacts,
    totalDurationSec,
    totalElapsedSec: Math.max(0.1, (performance.now() - startAll) / 1000),
    totalSizeBytes: artifacts.reduce((s, a) => s + a.sizeBytes, 0),
  };
}
