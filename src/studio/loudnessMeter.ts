/**
 * Stagecraft Studio — Browser-Native EBU R128 / ITU-R BS.1770-4 Loudness Meter
 * & True-Peak (-1.5 dBTP) Soft-Clip Normalizer
 *
 * 100% pure TypeScript, zero external dependencies, deterministic on PCM Float32Arrays
 * and WebAudio AudioBuffers. Ensures even pure-browser WebCodecs/WebM exports without
 * server FFmpeg hit YouTube's broadcast -14 LUFS loudness standard safely.
 */

export interface LoudnessMeasurement {
  integratedLufs: number;
  momentaryMaxLufs: number;
  truePeakLinear: number;
  truePeakDbtp: number;
  samplePeakDbfs: number;
  gatedBlocks: number;
  totalBlocks: number;
  durationSec: number;
}

export interface LoudnessNormalizeOptions {
  /** Target integrated loudness in LUFS (YouTube standard: -14.0) */
  targetLufs?: number;
  /** Maximum true-peak ceiling in dBTP (EBU R128 / YouTube standard: -1.5) */
  truePeakCeilingDb?: number;
  /** Maximum upward makeup gain in dB to prevent boosting near-silent tracks */
  maxBoostDb?: number;
  /** Maximum downward attenuation in dB */
  maxCutDb?: number;
}

export interface LoudnessNormalizationResult {
  before: LoudnessMeasurement;
  after: LoudnessMeasurement;
  appliedGainDb: number;
  targetLufs: number;
  truePeakCeilingDb: number;
  normalized: boolean;
  limiterEngaged: boolean;
}

interface BiquadCoeffs {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

const LOG10_INV = 1 / Math.LN10;

function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

function linearToDb(lin: number): number {
  if (!Number.isFinite(lin) || lin <= 1e-12) return -120;
  return 20 * Math.log(lin) * LOG10_INV;
}

/**
 * Computes exact ITU-R BS.1770-4 K-weighting Stage 1 (pre-filter high-shelf)
 * and Stage 2 (RLB high-pass) digital biquad coefficients for any sample rate
 * (44.1 kHz, 48 kHz, 96 kHz, etc.) using bilinear transform.
 */
function computeKWeightingBiquads(sampleRate: number): {
  shelf: BiquadCoeffs;
  highpass: BiquadCoeffs;
} {
  const fs = Math.max(8000, Number.isFinite(sampleRate) ? sampleRate : 48000);

  // Stage 1: High-shelf acoustic head model (+4 dB shelf around 1681.97 Hz)
  const f0Shelf = 1681.974450955533;
  const gDb = 3.999843853973347;
  const qShelf = 0.7071752369554196;
  const k1 = Math.tan((Math.PI * f0Shelf) / fs);
  const vh = Math.pow(10, gDb / 20);
  const vb = Math.pow(vh, 0.4996667741545416);
  const a0s = 1 + k1 / qShelf + k1 * k1;
  const shelf: BiquadCoeffs = {
    b0: (vh + (vb * k1) / qShelf + k1 * k1) / a0s,
    b1: (2 * (k1 * k1 - vh)) / a0s,
    b2: (vh - (vb * k1) / qShelf + k1 * k1) / a0s,
    a1: (2 * (k1 * k1 - 1)) / a0s,
    a2: (1 - k1 / qShelf + k1 * k1) / a0s,
  };

  // Stage 2: Revised Low-frequency B-weighting (RLB) high-pass (~38.14 Hz)
  const f0Hp = 38.13547087602444;
  const qHp = 0.5003270373238773;
  const k2 = Math.tan((Math.PI * f0Hp) / fs);
  const a0h = 1 + k2 / qHp + k2 * k2;
  const highpass: BiquadCoeffs = {
    b0: 1 / a0h,
    b1: -2 / a0h,
    b2: 1 / a0h,
    a1: (2 * (k2 * k2 - 1)) / a0h,
    a2: (1 - k2 / qHp + k2 * k2) / a0h,
  };

  return { shelf, highpass };
}

/**
 * Applies Stage 1 + Stage 2 K-weighting filter in a single pass and returns
 * per-sample squared weighted energy for memory-efficient block integration.
 */
function filterKWeightedChannel(
  input: Float32Array,
  shelf: BiquadCoeffs,
  hp: BiquadCoeffs
): Float32Array {
  const len = input.length;
  const out = new Float32Array(len);

  let sX1 = 0;
  let sX2 = 0;
  let sY1 = 0;
  let sY2 = 0;

  let hX1 = 0;
  let hX2 = 0;
  let hY1 = 0;
  let hY2 = 0;

  const sb0 = shelf.b0;
  const sb1 = shelf.b1;
  const sb2 = shelf.b2;
  const sa1 = shelf.a1;
  const sa2 = shelf.a2;

  const hb0 = hp.b0;
  const hb1 = hp.b1;
  const hb2 = hp.b2;
  const ha1 = hp.a1;
  const ha2 = hp.a2;

  for (let i = 0; i < len; i++) {
    const x = input[i];
    const sy = sb0 * x + sb1 * sX1 + sb2 * sX2 - sa1 * sY1 - sa2 * sY2;
    sX2 = sX1;
    sX1 = x;
    sY2 = sY1;
    sY1 = sy;

    const hy = hb0 * sy + hb1 * hX1 + hb2 * hX2 - ha1 * hY1 - ha2 * hY2;
    hX2 = hX1;
    hX1 = sy;
    hY2 = hY1;
    hY1 = hy;

    out[i] = hy;
  }
  return out;
}

/**
 * 4x oversampled true-peak estimator via Catmull-Rom cubic interpolation across
 * each sample interval (catches inter-sample overs accurately without FFT overhead).
 */
export function measureTruePeakLinear(channels: Float32Array[]): {
  truePeakLinear: number;
  samplePeakLinear: number;
} {
  let samplePeak = 0;
  let truePeak = 0;

  for (let c = 0; c < channels.length; c++) {
    const ch = channels[c];
    const n = ch.length;
    if (n === 0) continue;

    for (let i = 0; i < n; i++) {
      const a = Math.abs(ch[i]);
      if (a > samplePeak) samplePeak = a;
      if (a > truePeak) truePeak = a;

      if (i >= 1 && i + 2 < n) {
        const y0 = ch[i - 1];
        const y1 = ch[i];
        const y2 = ch[i + 1];
        const y3 = ch[i + 2];

        // Evaluate 3 interior sub-sample phases: t = 0.25, 0.5, 0.75
        const c0 = y1;
        const c1 = 0.5 * (y2 - y0);
        const c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3;
        const c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);

        const p25 = Math.abs(c0 + 0.25 * (c1 + 0.25 * (c2 + 0.25 * c3)));
        const p50 = Math.abs(c0 + 0.5 * (c1 + 0.5 * (c2 + 0.5 * c3)));
        const p75 = Math.abs(c0 + 0.75 * (c1 + 0.75 * (c2 + 0.75 * c3)));
        const subMax = p25 > p50 ? (p25 > p75 ? p25 : p75) : p50 > p75 ? p50 : p75;
        if (subMax > truePeak) truePeak = subMax;
      }
    }
  }

  return { truePeakLinear: truePeak, samplePeakLinear: samplePeak };
}

/**
 * Measures ITU-R BS.1770-4 / EBU R128 integrated loudness (LUFS), momentary max,
 * and 4x oversampled true peak (dBTP) across mono/stereo PCM float channels.
 */
export function measurePcmLoudness(
  channels: Float32Array[],
  sampleRate: number
): LoudnessMeasurement {
  const numChannels = channels.length;
  const totalSamples = numChannels > 0 ? channels[0].length : 0;
  const fs = Math.max(8000, Number.isFinite(sampleRate) ? sampleRate : 48000);
  const durationSec = totalSamples / fs;

  if (numChannels === 0 || totalSamples === 0) {
    return {
      integratedLufs: -120,
      momentaryMaxLufs: -120,
      truePeakLinear: 0,
      truePeakDbtp: -120,
      samplePeakDbfs: -120,
      gatedBlocks: 0,
      totalBlocks: 0,
      durationSec: 0,
    };
  }

  const { truePeakLinear, samplePeakLinear } = measureTruePeakLinear(channels);
  const { shelf, highpass } = computeKWeightingBiquads(fs);

  // Filter each channel (ITU-R BS.1770 channel weights: 1.0 for L/R/C)
  const filtered: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    filtered.push(filterKWeightedChannel(channels[c], shelf, highpass));
  }

  // 400ms block window with 100ms hop (75% overlap per EBU R128)
  const blockSamples = Math.max(1, Math.round(fs * 0.4));
  const hopSamples = Math.max(1, Math.round(fs * 0.1));

  const blockEnergies: number[] = [];
  const blockLufs: number[] = [];

  if (totalSamples < blockSamples) {
    // Short clip fallback: integrate across entire clip
    let energySum = 0;
    for (let c = 0; c < numChannels; c++) {
      const arr = filtered[c];
      let chSum = 0;
      for (let i = 0; i < totalSamples; i++) {
        chSum += arr[i] * arr[i];
      }
      energySum += chSum / totalSamples;
    }
    const lufs = energySum > 1e-12 ? -0.691 + 10 * Math.log(energySum) * LOG10_INV : -120;
    blockEnergies.push(energySum);
    blockLufs.push(lufs);
  } else {
    for (let start = 0; start + blockSamples <= totalSamples; start += hopSamples) {
      let energySum = 0;
      for (let c = 0; c < numChannels; c++) {
        const arr = filtered[c];
        let chSum = 0;
        const end = start + blockSamples;
        for (let i = start; i < end; i++) {
          chSum += arr[i] * arr[i];
        }
        energySum += chSum / blockSamples;
      }
      const lufs = energySum > 1e-12 ? -0.691 + 10 * Math.log(energySum) * LOG10_INV : -120;
      blockEnergies.push(energySum);
      blockLufs.push(lufs);
    }
  }

  let momentaryMaxLufs = -120;
  for (let i = 0; i < blockLufs.length; i++) {
    if (blockLufs[i] > momentaryMaxLufs) momentaryMaxLufs = blockLufs[i];
  }

  // Gate 1: Absolute gate > -70 LUFS
  let absSum = 0;
  let absCount = 0;
  for (let i = 0; i < blockLufs.length; i++) {
    if (blockLufs[i] > -70) {
      absSum += blockEnergies[i];
      absCount++;
    }
  }

  if (absCount === 0) {
    return {
      integratedLufs: -120,
      momentaryMaxLufs,
      truePeakLinear,
      truePeakDbtp: linearToDb(truePeakLinear),
      samplePeakDbfs: linearToDb(samplePeakLinear),
      gatedBlocks: 0,
      totalBlocks: blockLufs.length,
      durationSec,
    };
  }

  const ungatedLufs = -0.691 + 10 * Math.log(absSum / absCount) * LOG10_INV;
  const relativeThreshold = ungatedLufs - 10;

  // Gate 2: Relative gate > (ungatedLufs - 10 LU)
  let relSum = 0;
  let relCount = 0;
  for (let i = 0; i < blockLufs.length; i++) {
    if (blockLufs[i] > -70 && blockLufs[i] > relativeThreshold) {
      relSum += blockEnergies[i];
      relCount++;
    }
  }

  const integratedLufs =
    relCount > 0 && relSum > 1e-12
      ? -0.691 + 10 * Math.log(relSum / relCount) * LOG10_INV
      : ungatedLufs;

  return {
    integratedLufs: Number(integratedLufs.toFixed(2)),
    momentaryMaxLufs: Number(momentaryMaxLufs.toFixed(2)),
    truePeakLinear,
    truePeakDbtp: Number(linearToDb(truePeakLinear).toFixed(2)),
    samplePeakDbfs: Number(linearToDb(samplePeakLinear).toFixed(2)),
    gatedBlocks: relCount,
    totalBlocks: blockLufs.length,
    durationSec: Number(durationSec.toFixed(3)),
  };
}

/**
 * Smooth C1-continuous soft-clipper with a transparent knee starting at 88% of
 * the ceiling so true-peak transients are rounded cleanly without harsh digital
 * hard-clipping artifacts.
 */
function applySoftCeiling(sample: number, ceiling: number): { value: number; limited: boolean } {
  const abs = Math.abs(sample);
  const knee = ceiling * 0.88;
  if (abs <= knee) return { value: sample, limited: false };
  const headroom = Math.max(1e-5, ceiling - knee);
  const excess = (abs - knee) / headroom;
  const shaped = knee + headroom * Math.tanh(excess);
  return {
    value: sample >= 0 ? Math.min(ceiling, shaped) : Math.max(-ceiling, -shaped),
    limited: true,
  };
}

/**
 * Normalizes PCM Float32Array channels in-place to EBU R128 integrated loudness
 * (default -14.0 LUFS) with a -1.5 dBTP true-peak soft-clip ceiling.
 */
export function normalizePcmLufs(
  channels: Float32Array[],
  sampleRate: number,
  options: LoudnessNormalizeOptions = {}
): LoudnessNormalizationResult {
  const targetLufs = Number.isFinite(options.targetLufs) ? Number(options.targetLufs) : -14.0;
  const truePeakCeilingDb = Number.isFinite(options.truePeakCeilingDb)
    ? Number(options.truePeakCeilingDb)
    : -1.5;
  const maxBoostDb = Number.isFinite(options.maxBoostDb) ? Number(options.maxBoostDb) : 18;
  const maxCutDb = Number.isFinite(options.maxCutDb) ? Number(options.maxCutDb) : -24;

  const before = measurePcmLoudness(channels, sampleRate);

  // Do not amplify dead-silent tracks
  if (before.integratedLufs <= -69 || before.gatedBlocks === 0) {
    return {
      before,
      after: before,
      appliedGainDb: 0,
      targetLufs,
      truePeakCeilingDb,
      normalized: false,
      limiterEngaged: false,
    };
  }

  const rawDeltaDb = targetLufs - before.integratedLufs;
  const appliedGainDb = Math.max(maxCutDb, Math.min(maxBoostDb, rawDeltaDb));
  const linearGain = dbToLinear(appliedGainDb);
  // Leave a tiny 0.08 dB margin for inter-sample overshoot on cubic reconstruction
  const softCeiling = dbToLinear(truePeakCeilingDb - 0.08);
  const hardCeiling = dbToLinear(truePeakCeilingDb);

  let limiterEngaged = false;

  for (let c = 0; c < channels.length; c++) {
    const ch = channels[c];
    for (let i = 0; i < ch.length; i++) {
      const scaled = ch[i] * linearGain;
      const res = applySoftCeiling(scaled, softCeiling);
      if (res.limited) limiterEngaged = true;
      ch[i] = res.value;
    }
  }

  // Verify 4x oversampled true peak; if inter-sample peaks exceed ceiling, apply a clean micro-trim
  let after = measurePcmLoudness(channels, sampleRate);
  if (after.truePeakLinear > hardCeiling && after.truePeakLinear > 1e-6) {
    const trim = (hardCeiling * 0.994) / after.truePeakLinear;
    limiterEngaged = true;
    for (let c = 0; c < channels.length; c++) {
      const ch = channels[c];
      for (let i = 0; i < ch.length; i++) {
        ch[i] *= trim;
      }
    }
    after = measurePcmLoudness(channels, sampleRate);
  }

  return {
    before,
    after,
    appliedGainDb: Number(appliedGainDb.toFixed(2)),
    targetLufs,
    truePeakCeilingDb,
    normalized: true,
    limiterEngaged,
  };
}

/**
 * Convenience wrapper for WebAudio AudioBuffer: measures and normalizes all
 * channels in-place to YouTube -14 LUFS / -1.5 dBTP.
 */
export function normalizeAudioBufferLufs(
  buffer: AudioBuffer,
  options: LoudnessNormalizeOptions = {}
): LoudnessNormalizationResult {
  const channels: Float32Array[] = [];
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }
  return normalizePcmLufs(channels, buffer.sampleRate, options);
}

/**
 * Measures loudness of a WebAudio AudioBuffer without mutating it.
 */
export function measureAudioBufferLufs(buffer: AudioBuffer): LoudnessMeasurement {
  const channels: Float32Array[] = [];
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }
  return measurePcmLoudness(channels, buffer.sampleRate);
}
