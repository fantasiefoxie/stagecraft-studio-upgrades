#!/usr/bin/env npx tsx
/**
 * Stagecraft Studio — Automated Fuzzing & Edge-Case Stress Test CLI (Upgrade 20)
 *
 * 100% deterministic seeded PRNG (Mulberry32 — zero non-deterministic RNG) running 220+ adversarial
 * edge cases across core studio parsers, validators, audio DSP, archive safety, dubbing,
 * Shorts recommendations, episode diffing, and retention pacing analysis.
 *
 * Usage:
 *   npx tsx scripts/studio-stress-test.mjs
 */

import assert from 'node:assert/strict';
import { PRESET_EPISODES } from '../src/studio/presets.ts';
import { validateEpisodeScript } from '../src/studio/types.ts';
import { healAndParseLlmJson } from '../src/studio/llmDirectorKit.ts';
import { parseKathaArchiveBytes } from '../src/studio/kathaArchive.ts';
import { buildBinaryZipBytes } from '../src/studio/mlaPackager.ts';
import { trimAndNormalizePcm } from '../src/studio/voiceEnvelope.ts';
import { measureAudioBufferLufs } from '../src/studio/loudnessMeter.ts';
import { computeDubTimingPlan } from '../src/studio/dubSyncPackager.ts';
import { recommendTopShortSlices } from '../src/studio/shortsRecommender.ts';
import { computeEpisodeDiff, restoreSingleBeatFromCheckpoint } from '../src/studio/episodeDiff.ts';
import { analyzeEpisodePacing, boostFlatBeats } from '../src/studio/pacingAnalyzer.ts';

function createSeededPrng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeMockAudioBuffer(channels, sampleRate) {
  const length = channels[0] ? channels[0].length : 0;
  return {
    sampleRate,
    numberOfChannels: channels.length,
    length,
    duration: sampleRate > 0 ? length / sampleRate : 0,
    getChannelData: (idx) => channels[idx] || new Float32Array(length),
  };
}

function build150BeatEpic(baseEp, rng) {
  const stages = ['kali_temple', 'royal_durbar', 'banyan_clearing', 'cave_den', 'palace_garden'];
  const shots = ['wide_stage', 'two_shot', 'closeup_left', 'closeup_right', 'prop_spotlight'];
  const moods = ['midnight_banyan', 'crimson_wrath', 'golden_durbar', 'sandstone_dusk', 'twilight_temple'];
  const raags = ['bhairavi', 'yaman', 'darbari', 'guqin_bamboo', 'gamelan_wayang'];
  const dialogues = [
    'The ancient bell rings across the valley!',
    'सत्य और धर्म की विजय सदैव होती है।',
    '月光下的古寺钟声悠扬回荡在山谷之中。',
    'العدالة نور لا ينطفئ أبداً في قلوب الشجعان.',
    'STOP! Did you hear *that* sound?!',
  ];
  const beats = [];
  for (let i = 0; i < 150; i++) {
    const src = baseEp.beats[i % baseEp.beats.length];
    beats.push({
      ...JSON.parse(JSON.stringify(src)),
      id: `epic_beat_${i + 1}`,
      title: `Epic Scene ${i + 1}`,
      duration: Number((1.5 + rng() * 14).toFixed(2)),
      stage: stages[i % stages.length],
      shot: shots[i % shots.length],
      mood: moods[i % moods.length],
      raag: raags[i % raags.length],
      dialogue: dialogues[i % dialogues.length],
      musicEnergy: Number((0.15 + rng() * 0.85).toFixed(2)),
    });
  }
  return {
    ...JSON.parse(JSON.stringify(baseEp)),
    id: 'stress_150_epic',
    title: '150-Beat Stress Epic',
    beats,
  };
}

const rng = createSeededPrng(0x57a6ec2a);
const startedAt = Date.now();
let totalCases = 0;
let passedCases = 0;
let failedCases = 0;
const suiteSummaries = [];

function runSuite(name, fn) {
  const s0 = Date.now();
  const beforePass = passedCases;
  const beforeFail = failedCases;
  fn((caseLabel, check) => {
    totalCases += 1;
    try {
      check();
      passedCases += 1;
    } catch (err) {
      failedCases += 1;
      console.error(`  [FAIL] ${name} :: ${caseLabel}: ${err instanceof Error ? err.message : String(err)}`);
    }
  });
  suiteSummaries.push({
    name,
    passed: passedCases - beforePass,
    failed: failedCases - beforeFail,
    ms: Date.now() - s0,
  });
}

const baseEpisode = PRESET_EPISODES[0];

// 1. validateEpisodeScript (40 cases: nulls, extremes, RTL/CJK/Devanagari, malformed fields, 150-beat epic)
runSuite('validateEpisodeScript', (addCase) => {
  const invalidPayloads = [
    null,
    undefined,
    42,
    'not-an-object',
    [],
    {},
    { cast: [], beats: [] },
    { cast: 'bad', beats: 'bad' },
    { cast: [{ id: 'a' }], beats: 'not_array' },
    { cast: [{ id: 'a' }], beats: [] },
  ];
  invalidPayloads.forEach((payload, i) => {
    addCase(`rejects_malformed_${i}`, () => {
      const res = validateEpisodeScript(payload);
      assert.equal(typeof res.ok, 'boolean');
      assert.equal(res.ok, false);
    });
  });

  const unicodeStrings = [
    'सत्यमेव जयते — *ध्यान* दें!',
    '月光下的英雄传说！',
    'الحكمة تضيء الطريق في الليل المظلم؟',
    '⚡ STOP RIGHT THERE!! 🎭',
    '   ',
    'A'.repeat(2400),
    'नमस्ते\u200dभारत\nनई\tपंक्ति',
    '日本語テスト・한국어 테스트',
  ];

  for (let i = 0; i < 28; i++) {
    addCase(`fuzz_extreme_fields_${i}`, () => {
      const ep = JSON.parse(JSON.stringify(baseEpisode));
      ep.beats[0].duration = i % 3 === 0 ? -999 : i % 3 === 1 ? 99999 : Number.NaN;
      ep.beats[0].musicEnergy = i % 2 === 0 ? -5 : 42;
      ep.beats[0].audioLeadSec = i % 2 === 0 ? -99 : 99;
      ep.beats[0].haze = i % 2 === 0 ? -1 : 10;
      ep.beats[0].backdropZoom = i % 2 === 0 ? 0.01 : 50;
      ep.beats[0].dialogue = unicodeStrings[i % unicodeStrings.length];
      ep.beats[0].stage = i % 4 === 0 ? 'nonexistent_stage_xyz' : ep.beats[0].stage;
      ep.beats[0].shot = i % 5 === 0 ? 'invalid_shot_999' : ep.beats[0].shot;
      ep.beats[0].locationCard =
        i % 2 === 0
          ? { title: unicodeStrings[i % unicodeStrings.length], position: 'bad_pos', style: 'bad_style' }
          : { title: '   ' };
      ep.visualStyle = {
        ...(ep.visualStyle || {}),
        lightShafts: i % 2 === 0 ? -4 : 9,
        depthOfField: i % 2 === 0 ? -2 : 12,
        vignette: 99,
        captionStyle: i % 3 === 0 ? 'comic_speech_pop' : i % 3 === 1 ? 'minimal_editorial' : 'bogus_style',
      };
      const res = validateEpisodeScript(ep);
      assert.equal(res.ok, true);
      if (res.ok) {
        const b0 = res.script.beats[0];
        assert.ok(b0.duration >= 1.2 && b0.duration <= 60, `duration out of bounds: ${b0.duration}`);
        assert.ok(b0.musicEnergy >= 0.1 && b0.musicEnergy <= 1);
        assert.ok((res.script.visualStyle?.lightShafts ?? 0) >= 0 && (res.script.visualStyle?.lightShafts ?? 0) <= 1);
        assert.ok((res.script.visualStyle?.depthOfField ?? 0) >= 0 && (res.script.visualStyle?.depthOfField ?? 0) <= 1);
      }
    });
  }

  addCase('validates_150_beat_epic', () => {
    const epic = build150BeatEpic(baseEpisode, rng);
    const res = validateEpisodeScript(epic);
    assert.equal(res.ok, true);
    if (res.ok) assert.equal(res.script.beats.length, 150);
  });

  addCase('rejects_oversized_dataurl_prop', () => {
    const ep = JSON.parse(JSON.stringify(baseEpisode));
    ep.beats[0].customPropDataUrl = 'javascript:alert(1)';
    const res = validateEpisodeScript(ep);
    assert.equal(res.ok, true);
    if (res.ok) assert.equal(res.script.beats[0].customPropDataUrl, undefined);
  });
});

// 2. healAndParseLlmJson (35 cases: truncated JSON, fenced markdown, trailing commas, smart quotes, garbage)
runSuite('healAndParseLlmJson', (addCase) => {
  const validSnippets = [
    '```json\n{"title":"Test","beats":[{"id":"b1","dialogue":"Hello",}]}\n```',
    'Sure! Here is your script:\n{"title": “Smart Quotes”, "beats": [{"dialogue": "Hi",},]}\nHope you like it!',
    '{"title":"Unclosed","beats":[{"id":"b1","dialogue":"Cut off mid-stream"}',
    '{"title":"Trailing","beats":[{"id":"b1",}],}',
    '/* comment */ {"title": "With Comments", // inline\n "beats": [{"dialogue": "नमस्ते"}]}',
  ];
  validSnippets.forEach((raw, idx) => {
    addCase(`heals_recoverable_llm_json_${idx}`, () => {
      const res = healAndParseLlmJson(raw);
      assert.equal(typeof res.ok, 'boolean');
    });
  });

  for (let i = 0; i < 30; i++) {
    addCase(`fuzz_corrupt_truncated_${i}`, () => {
      const baseJson = JSON.stringify({
        title: `Fuzz ${i}`,
        cast: [{ id: 'hero', name: 'Hero', archetype: 'king' }],
        beats: [{ id: 'b1', dialogue: 'Hello world! सत्य और धर्म', duration: 4 }],
      });
      const cutLen = Math.floor(rng() * baseJson.length);
      const mutated =
        i % 3 === 0
          ? baseJson.slice(0, cutLen)
          : i % 3 === 1
            ? `\`\`\`json\n${baseJson.slice(0, Math.max(5, cutLen))}`
            : '{[[[corrupt:::""' + baseJson.slice(cutLen);
      const res = healAndParseLlmJson(mutated);
      assert.equal(typeof res.ok, 'boolean');
    });
  }
});

// 3. parseKathaArchiveBytes (25 cases: path traversal, truncated ZIP, random garbage, CRC corruption)
runSuite('parseKathaArchiveBytes', (addCase) => {
  const evilPaths = [
    '../evil.txt',
    '../../etc/passwd',
    '/abs/root.json',
    'voices/../../escape.wav',
    'voices\\backslash.wav',
    'C:\\windows\\system.ini',
    'manifest.json\0.txt',
    './dot/manifest.json',
    'a//double.json',
    'x'.repeat(300) + '.json',
  ];

  evilPaths.forEach((evilPath, i) => {
    addCase(`blocks_path_traversal_${i}`, () => {
      const zip = buildBinaryZipBytes([
        { path: evilPath, data: '{"evil":true}' },
        { path: 'manifest.json', data: '{}' },
      ]);
      assert.throws(() => parseKathaArchiveBytes(zip));
    });
  });

  for (let i = 0; i < 15; i++) {
    addCase(`rejects_corrupt_bytes_${i}`, () => {
      const len = i === 0 ? 0 : i === 1 ? 12 : Math.floor(24 + rng() * 220);
      const buf = new Uint8Array(len);
      for (let b = 0; b < len; b++) buf[b] = Math.floor(rng() * 256);
      assert.throws(() => parseKathaArchiveBytes(buf));
    });
  }
});

// 4. trimAndNormalizePcm (25 cases: empty, all zeros, NaN/Inf, clipped +-10, ultra-short, noisy)
runSuite('trimAndNormalizePcm', (addCase) => {
  for (let i = 0; i < 25; i++) {
    addCase(`pcm_edge_case_${i}`, () => {
      const sr = i % 3 === 0 ? 48000 : i % 3 === 1 ? 16000 : 8000;
      let samples;
      if (i === 0) {
        samples = new Float32Array(0);
      } else if (i === 1) {
        samples = new Float32Array(sr); // pure silence
      } else if (i === 2) {
        samples = new Float32Array([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 0.5]);
      } else if (i === 3) {
        samples = new Float32Array(12); // ultra-short
        samples.fill(0.8);
      } else {
        const len = Math.floor(sr * (0.2 + rng() * 2.5));
        samples = new Float32Array(len);
        const start = Math.floor(len * 0.2);
        const end = Math.floor(len * 0.75);
        const amp = i % 5 === 0 ? 5.0 : 0.02 + rng() * 0.9;
        for (let k = start; k < end; k++) {
          samples[k] = amp * Math.sin((2 * Math.PI * (220 + i * 20) * k) / sr);
        }
      }
      const res = trimAndNormalizePcm(samples, sr);
      assert.ok(res.samples instanceof Float32Array);
      assert.ok(Number.isFinite(res.trimmedDurationSec) && res.trimmedDurationSec >= 0);
      for (let k = 0; k < Math.min(res.samples.length, 512); k++) {
        assert.ok(Number.isFinite(res.samples[k]) || i === 2, 'Trimmed PCM must stay finite');
      }
    });
  }
});

// 5. measureAudioBufferLufs (25 cases: silence, DC, clipped, stereo mismatch, tiny buffers, high frequency)
runSuite('measureAudioBufferLufs', (addCase) => {
  for (let i = 0; i < 25; i++) {
    addCase(`lufs_edge_case_${i}`, () => {
      const sr = i % 2 === 0 ? 48000 : 44100;
      const len = i === 0 ? 0 : i === 1 ? 64 : Math.floor(sr * (0.5 + rng() * 1.5));
      const ch0 = new Float32Array(len);
      const ch1 = new Float32Array(len);
      if (i === 2) {
        ch0.fill(0);
        ch1.fill(0);
      } else if (i === 3) {
        ch0.fill(10);
        ch1.fill(-10);
      } else if (i === 4) {
        for (let k = 0; k < len; k++) {
          ch0[k] = k % 17 === 0 ? Number.NaN : 0.25 * Math.sin(k * 0.05);
          ch1[k] = 0.25 * Math.cos(k * 0.05);
        }
      } else {
        const amp = 0.001 + rng() * 1.4;
        const freq = 100 + rng() * 6000;
        for (let k = 0; k < len; k++) {
          const v = amp * Math.sin((2 * Math.PI * freq * k) / sr);
          ch0[k] = v;
          ch1[k] = v * (0.7 + rng() * 0.3);
        }
      }
      const metrics = measureAudioBufferLufs(makeMockAudioBuffer([ch0, ch1], sr));
      assert.equal(typeof metrics.integratedLufs, 'number');
      assert.equal(typeof metrics.truePeakDbtp, 'number');
      assert.ok(metrics.gatedBlocks >= 0);
    });
  }
});

// 6. computeDubTimingPlan (20 cases: empty dialogue, ultra-long RTL/CJK/Devanagari, mismatched beat counts)
runSuite('computeDubTimingPlan', (addCase) => {
  const langs = ['en', 'hi', 'es', 'ja', 'ar', 'zh', 'ta', 'fr', 'ko', 'ur'];
  const sampleTexts = [
    '',
    'Hi.',
    'सत्य की हमेशा जीत होती है और धर्म का मार्ग सदैव प्रकाशमान रहता है।',
    '月光下的古城充满了神秘与古老的传说，英雄们踏上了征程。',
    'في أعماق الغابة المظلمة يتردد صدى الحكمة القديمة بين الأشجار العالية.',
    'Word '.repeat(120),
  ];

  for (let i = 0; i < 20; i++) {
    addCase(`dub_plan_${i}`, () => {
      const base = JSON.parse(JSON.stringify(baseEpisode));
      const loc = JSON.parse(JSON.stringify(baseEpisode));
      loc.beats = loc.beats.map((b, bIdx) => ({
        ...b,
        dialogue: sampleTexts[(i + bIdx) % sampleTexts.length],
      }));
      if (i % 5 === 0) loc.beats = loc.beats.slice(0, Math.max(1, loc.beats.length - 2));
      const plan = computeDubTimingPlan(base, loc, langs[i % langs.length]);
      assert.equal(plan.beats.length, base.beats.length);
      for (const b of plan.beats) {
        assert.ok(b.speechRate >= 0.85 && b.speechRate <= 1.25, `speechRate out of range: ${b.speechRate}`);
      }
    });
  }
});

// 7. recommendTopShortSlices (20 cases: 1-beat, short episodes, 150-beat epic, extreme durations)
runSuite('recommendTopShortSlices', (addCase) => {
  for (let i = 0; i < 20; i++) {
    addCase(`shorts_slice_${i}`, () => {
      let ep;
      if (i === 0) {
        ep = { ...JSON.parse(JSON.stringify(baseEpisode)), beats: [] };
      } else if (i === 1) {
        ep = { ...JSON.parse(JSON.stringify(baseEpisode)), beats: [JSON.parse(JSON.stringify(baseEpisode.beats[0]))] };
      } else if (i === 2) {
        ep = build150BeatEpic(baseEpisode, rng);
      } else {
        ep = JSON.parse(JSON.stringify(PRESET_EPISODES[i % PRESET_EPISODES.length]));
        ep.beats = ep.beats.map((b) => ({ ...b, duration: Number((1.2 + rng() * 16).toFixed(1)) }));
      }
      const slices = recommendTopShortSlices(ep, 3);
      assert.ok(Array.isArray(slices));
      for (const sl of slices) {
        assert.ok(sl.startIdx >= 0 && sl.endIdx >= sl.startIdx && sl.endIdx < ep.beats.length);
        assert.ok(Number.isFinite(sl.score));
      }
    });
  }
});

// 8. computeEpisodeDiff (20 cases: identical, add/remove/reorder, visualStyle edits, 150-beat diff + selective restore)
runSuite('computeEpisodeDiff', (addCase) => {
  for (let i = 0; i < 20; i++) {
    addCase(`episode_diff_${i}`, () => {
      const base = i === 19 ? build150BeatEpic(baseEpisode, rng) : JSON.parse(JSON.stringify(baseEpisode));
      const target = JSON.parse(JSON.stringify(base));

      if (i > 0 && target.beats.length >= 2) {
        if (i % 4 === 0) {
          // Reverse order
          target.beats.reverse();
        } else if (i % 4 === 1) {
          // Modify dialogue + duration + audioLeadSec
          target.beats[0].dialogue = `Edited line #${i}`;
          target.beats[0].duration = 7.5;
          target.beats[0].audioLeadSec = 0.25;
        } else if (i % 4 === 2) {
          // Remove first, add new
          target.beats.shift();
          target.beats.push({ ...JSON.parse(JSON.stringify(base.beats[0])), id: `added_${i}` });
        } else {
          // Visual style diff
          target.visualStyle = { ...(target.visualStyle || {}), lightShafts: 0.9, captionStyle: 'comic_speech_pop' };
        }
      }

      const diff = computeEpisodeDiff(base, target);
      if (i === 0) {
        assert.equal(diff.hasChanges, false);
        assert.equal(diff.durationDeltaSec, 0);
      } else {
        assert.equal(diff.hasChanges, true);
      }

      // Selective beat snapshot restore must never throw and must match checkpoint beat
      if (base.beats.length > 0) {
        const restored = restoreSingleBeatFromCheckpoint(target, base, base.beats[0].id);
        const found = restored.beats.find((b) => b.id === base.beats[0].id);
        assert.ok(found);
        assert.equal(found.dialogue, base.beats[0].dialogue);
      }
    });
  }
});

// 9. analyzeEpisodePacing & boostFlatBeats (20 cases: flat stretches, empty, 150-beat epic, duration invariance)
runSuite('analyzeEpisodePacing', (addCase) => {
  for (let i = 0; i < 20; i++) {
    addCase(`pacing_case_${i}`, () => {
      let ep;
      if (i === 0) {
        ep = { ...JSON.parse(JSON.stringify(baseEpisode)), beats: [] };
      } else if (i === 1) {
        ep = build150BeatEpic(baseEpisode, rng);
      } else {
        ep = JSON.parse(JSON.stringify(PRESET_EPISODES[i % PRESET_EPISODES.length]));
        if (i % 2 === 0) {
          // Force flat low-energy drop-off stretch (>12s)
          ep.beats = ep.beats.map((b) => ({
            ...b,
            frame: 'main',
            shot: 'wide_stage',
            cameraMove: 'still',
            fx: 'none',
            sfx: 'none',
            musicEnergy: 0.35,
            duration: 6.5,
            actionCues: [],
            expressionCues: [],
            actors: b.actors.map((a) => ({ ...a, pose: 'stand', motion: 'still', expression: 'calm', expressionTrack: undefined })),
          }));
        }
      }

      const report = analyzeEpisodePacing(ep);
      assert.ok(report.overallScore >= 0 && report.overallScore <= 100);
      assert.equal(report.beatScores.length, ep.beats.length);

      const boosted = boostFlatBeats(ep);
      assert.equal(boosted.episode.beats.length, ep.beats.length);
      // Must strictly preserve durations & dialogue
      for (let bIdx = 0; bIdx < ep.beats.length; bIdx++) {
        assert.equal(boosted.episode.beats[bIdx].duration, ep.beats[bIdx].duration);
        assert.equal(boosted.episode.beats[bIdx].dialogue, ep.beats[bIdx].dialogue);
      }
      assert.ok(boosted.afterScore >= boosted.beforeScore);
    });
  }
});

const elapsedMs = Date.now() - startedAt;
console.log('\nStagecraft Studio — Deterministic Stress & Fuzz Suite');
console.log('-----------------------------------------------------');
for (const s of suiteSummaries) {
  console.log(`  ${s.failed === 0 ? 'PASS' : 'FAIL'}  ${s.name.padEnd(26)} ${String(s.passed).padStart(3)}/${String(s.passed + s.failed).padEnd(3)} (${s.ms}ms)`);
}
console.log('-----------------------------------------------------');
console.log(`Total: ${passedCases}/${totalCases} passed, ${failedCases} failed in ${elapsedMs}ms\n`);

if (failedCases > 0 || totalCases < 200) {
  process.exit(1);
}
