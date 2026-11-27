import { STUDIO_FPS } from './types';

export interface SpeechWindow {
  startSec: number;
  endSec: number;
}

export interface VoiceSpeechProfile {
  /** Deterministic 60fps RMS amplitude envelope (0..1) */
  rms60fps: Float32Array;
  durationSec: number;
  /** Active spoken bounds excluding leading/trailing breath silence */
  speechWindow: SpeechWindow;
}

const profileCache = new WeakMap<AudioBuffer, VoiceSpeechProfile>();

/**
 * Pure deterministic PCM -> 60fps RMS envelope & active speech-window extractor.
 * Works identically in Node tests, Browser WebCodecs offline render, live preview,
 * and Headless Playwright MP4 exports.
 */
export function computeVoiceEnvelopeFromPcm(
  samples: Float32Array,
  sampleRate: number,
  durationSec?: number
): VoiceSpeechProfile {
  const safeRate = Math.max(8000, Number.isFinite(sampleRate) ? sampleRate : 48000);
  const rawDur = samples.length / safeRate;
  const dur = Math.max(0.05, Number.isFinite(durationSec) && (durationSec ?? 0) > 0 ? durationSec! : rawDur);
  const totalFrames = Math.max(1, Math.ceil(dur * STUDIO_FPS));
  const rms60fps = new Float32Array(totalFrames);

  if (samples.length === 0) {
    return {
      rms60fps,
      durationSec: dur,
      speechWindow: { startSec: 0, endSec: dur },
    };
  }

  const halfWin = Math.max(1, Math.floor((safeRate * 0.042) / 2));

  for (let f = 0; f < totalFrames; f++) {
    const centerTime = (f + 0.5) / STUDIO_FPS;
    const centerSample = Math.floor(centerTime * safeRate);
    if (centerSample >= samples.length) {
      rms60fps[f] = 0;
      continue;
    }
    const start = Math.max(0, centerSample - halfWin);
    const end = Math.min(samples.length, centerSample + halfWin);
    if (end <= start) {
      rms60fps[f] = 0;
      continue;
    }
    let sumSq = 0;
    for (let i = start; i < end; i++) {
      const v = samples[i];
      sumSq += v * v;
    }
    const rms = Math.sqrt(sumSq / (end - start));
    rms60fps[f] = Math.min(1, rms * 4.4);
  }

  // Detect active spoken window above noise floor (0.055), ignoring isolated 1-frame clicks
  const THRESH = 0.055;
  let firstActive = -1;
  let lastActive = -1;

  for (let f = 0; f < totalFrames; f++) {
    const cur = rms60fps[f];
    const next = f + 1 < totalFrames ? rms60fps[f + 1] : 0;
    const prev = f > 0 ? rms60fps[f - 1] : 0;
    const isSpeech = cur >= THRESH && (next >= THRESH * 0.7 || prev >= THRESH * 0.7 || cur >= 0.14);
    if (isSpeech) {
      if (firstActive === -1) firstActive = f;
      lastActive = f;
    }
  }

  let speechStartSec = 0;
  let speechEndSec = dur;
  if (firstActive >= 0 && lastActive >= firstActive) {
    speechStartSec = Math.max(0, firstActive / STUDIO_FPS - 0.03);
    speechEndSec = Math.min(dur, (lastActive + 1) / STUDIO_FPS + 0.05);
    // Guarantee a reasonable minimum span so karaoke never collapses to 0
    if (speechEndSec - speechStartSec < 0.25) {
      speechStartSec = 0;
      speechEndSec = dur;
    }
  }

  return {
    rms60fps,
    durationSec: dur,
    speechWindow: {
      startSec: Number(speechStartSec.toFixed(3)),
      endSec: Number(speechEndSec.toFixed(3)),
    },
  };
}

/**
 * WeakMap-cached 60fps VoiceSpeechProfile accessor for decoded AudioBuffers.
 * Zero per-frame allocations inside render loops.
 */
export function getVoiceSpeechProfile(
  buffer: AudioBuffer | null | undefined
): VoiceSpeechProfile | null {
  if (!buffer || buffer.length === 0) return null;
  const cached = profileCache.get(buffer);
  if (cached) return cached;
  const profile = computeVoiceEnvelopeFromPcm(
    buffer.getChannelData(0),
    buffer.sampleRate,
    buffer.duration
  );
  profileCache.set(buffer, profile);
  return profile;
}

/**
 * Samples the deterministic 60fps voice RMS amplitude (0..1) at beat-local time `localT`.
 * Returns `0` once `localT` passes the clip's duration so lips close naturally during tail pauses.
 */
export function sampleVoiceProfileAtTime(
  profile: VoiceSpeechProfile | null | undefined,
  localT: number
): number | null {
  if (!profile) return null;
  if (!Number.isFinite(localT) || localT < 0 || localT >= profile.durationSec) {
    return 0;
  }
  const idx = Math.floor(localT * STUDIO_FPS);
  if (idx < 0 || idx >= profile.rms60fps.length) return 0;
  return profile.rms60fps[idx];
}

export interface VoiceTrimOptions {
  /** Breathing room kept before speech starts (default 0.08s) */
  leadPadSec?: number;
  /** Natural tail kept after speech ends (default 0.14s) */
  tailPadSec?: number;
  /** Target peak amplitude for normalization (default 0.89 = -1 dBFS) */
  targetPeak?: number;
  /** Maximum gain multiplier to avoid amplifying pure noise floor (default 6.0) */
  maxGain?: number;
  /** Linear micro-fade duration at head & tail to prevent clicks (default 0.012s) */
  fadeSec?: number;
  /** Minimum dead-air saved before trimming kicks in (default 0.05s) */
  minSavedSec?: number;
}

export interface VoiceTrimResult {
  samples: Float32Array;
  sampleRate: number;
  originalDurationSec: number;
  trimmedDurationSec: number;
  trimmedLeadSec: number;
  trimmedTailSec: number;
  gainApplied: number;
  didTrim: boolean;
}

/**
 * Pure deterministic silence auto-trim & -1 dBFS peak normalization for voice PCM.
 * Trims leading/trailing dead air to crisp breathing pads, normalizes vocal loudness,
 * and applies 12ms anti-click head/tail linear micro-fades.
 */
export function trimAndNormalizePcm(
  samples: Float32Array,
  sampleRate: number,
  opts?: VoiceTrimOptions
): VoiceTrimResult {
  const safeRate = Math.max(8000, Number.isFinite(sampleRate) ? Math.round(sampleRate) : 48000);
  const origDur = samples.length / safeRate;
  if (samples.length === 0) {
    return {
      samples: new Float32Array(0),
      sampleRate: safeRate,
      originalDurationSec: 0,
      trimmedDurationSec: 0,
      trimmedLeadSec: 0,
      trimmedTailSec: 0,
      gainApplied: 1,
      didTrim: false,
    };
  }

  const leadPadSec = Math.max(0.02, opts?.leadPadSec ?? 0.08);
  const tailPadSec = Math.max(0.04, opts?.tailPadSec ?? 0.14);
  const targetPeak = Math.min(0.96, Math.max(0.25, opts?.targetPeak ?? 0.89));
  const maxGain = Math.min(12, Math.max(1, opts?.maxGain ?? 6.0));
  const fadeSec = Math.min(0.04, Math.max(0.002, opts?.fadeSec ?? 0.012));
  const minSavedSec = Math.max(0.01, opts?.minSavedSec ?? 0.05);

  const profile = computeVoiceEnvelopeFromPcm(samples, safeRate, origDur);
  const desiredStartSec = Math.max(0, profile.speechWindow.startSec - leadPadSec);
  const desiredEndSec = Math.min(origDur, profile.speechWindow.endSec + tailPadSec);
  const desiredDur = desiredEndSec - desiredStartSec;
  const savedSec = origDur - desiredDur;

  // Measure overall peak first so completely silent clips are not distorted
  let wholePeak = 0;
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i]);
    if (a > wholePeak) wholePeak = a;
  }

  const shouldTrim = wholePeak > 0.004 && savedSec >= minSavedSec && desiredDur >= 0.25;
  const startSample = shouldTrim
    ? Math.max(0, Math.min(samples.length - 1, Math.floor(desiredStartSec * safeRate)))
    : 0;
  const endSample = shouldTrim
    ? Math.max(startSample + 1, Math.min(samples.length, Math.ceil(desiredEndSec * safeRate)))
    : samples.length;

  const outLen = Math.max(1, endSample - startSample);
  const out = new Float32Array(outLen);

  let slicePeak = 0;
  for (let i = 0; i < outLen; i++) {
    const v = samples[startSample + i];
    const a = Math.abs(v);
    if (a > slicePeak) slicePeak = a;
  }

  const gainApplied =
    slicePeak > 0.004 ? Math.min(maxGain, targetPeak / slicePeak) : 1.0;

  for (let i = 0; i < outLen; i++) {
    const scaled = samples[startSample + i] * gainApplied;
    out[i] = scaled > 0.99 ? 0.99 : scaled < -0.99 ? -0.99 : scaled;
  }

  // Apply anti-click linear head/tail micro-fades
  const fadeSamples = Math.min(Math.floor(outLen * 0.25), Math.max(1, Math.round(fadeSec * safeRate)));
  for (let i = 0; i < fadeSamples; i++) {
    const w = fadeSamples > 1 ? i / (fadeSamples - 1) : 0;
    out[i] *= w;
    out[outLen - 1 - i] *= w;
  }

  const trimmedLeadSec = Number((startSample / safeRate).toFixed(3));
  const trimmedTailSec = Number(((samples.length - endSample) / safeRate).toFixed(3));
  const trimmedDurationSec = Number((outLen / safeRate).toFixed(3));

  return {
    samples: out,
    sampleRate: safeRate,
    originalDurationSec: Number(origDur.toFixed(3)),
    trimmedDurationSec,
    trimmedLeadSec,
    trimmedTailSec,
    gainApplied: Number(gainApplied.toFixed(3)),
    didTrim: shouldTrim,
  };
}

/**
 * Encodes mono Float32 PCM samples into a standard 16-bit RIFF/WAVE Blob (zero external deps).
 */
export function encodeMonoPcmToWavBlob(samples: Float32Array, sampleRate: number): Blob {
  const safeRate = Math.max(8000, Math.round(sampleRate));
  const numSamples = samples.length;
  const dataBytes = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, safeRate, true);
  view.setUint32(28, safeRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, dataBytes, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const int16 = clamped < 0 ? Math.round(clamped * 0x8000) : Math.round(clamped * 0x7fff);
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Browser helper: decodes an audio Blob, trims leading/trailing silence,
 * peak-normalizes to -1 dBFS with anti-click fades, and re-encodes as crisp 16-bit WAV.
 */
export async function trimAndNormalizeVoiceBlob(
  blob: Blob,
  opts?: VoiceTrimOptions
): Promise<{
  blob: Blob;
  originalDurationSec: number;
  trimmedDurationSec: number;
  savedSec: number;
  didModify: boolean;
}> {
  if (typeof window === 'undefined') {
    return {
      blob,
      originalDurationSec: 0,
      trimmedDurationSec: 0,
      savedSec: 0,
      didModify: false,
    };
  }
  const OfflineCtx =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;
  if (!OfflineCtx) {
    return {
      blob,
      originalDurationSec: 0,
      trimmedDurationSec: 0,
      savedSec: 0,
      didModify: false,
    };
  }

  try {
    const arr = await blob.arrayBuffer();
    const decoderCtx = new OfflineCtx(1, 1, 44100);
    const decoded = await decoderCtx.decodeAudioData(arr.slice(0));
    const len = decoded.length;
    const mono = new Float32Array(len);
    const chCount = decoded.numberOfChannels;
    for (let c = 0; c < chCount; c++) {
      const chData = decoded.getChannelData(c);
      for (let i = 0; i < len; i++) {
        mono[i] += chData[i] / chCount;
      }
    }

    const res = trimAndNormalizePcm(mono, decoded.sampleRate, opts);
    const savedSec = Math.max(0, Number((res.originalDurationSec - res.trimmedDurationSec).toFixed(3)));
    const gainDelta = Math.abs(res.gainApplied - 1);
    const didModify = res.didTrim || gainDelta >= 0.06;
    if (!didModify) {
      return {
        blob,
        originalDurationSec: res.originalDurationSec,
        trimmedDurationSec: res.originalDurationSec,
        savedSec: 0,
        didModify: false,
      };
    }

    const wavBlob = encodeMonoPcmToWavBlob(res.samples, res.sampleRate);
    return {
      blob: wavBlob,
      originalDurationSec: res.originalDurationSec,
      trimmedDurationSec: res.trimmedDurationSec,
      savedSec,
      didModify: true,
    };
  } catch {
    return {
      blob,
      originalDurationSec: 0,
      trimmedDurationSec: 0,
      savedSec: 0,
      didModify: false,
    };
  }
}

