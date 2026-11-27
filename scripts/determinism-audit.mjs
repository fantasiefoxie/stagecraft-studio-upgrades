#!/usr/bin/env node
/**
 * Stagecraft Studio — Automated Determinism & Performance Audit CLI (Upgrade 10)
 *
 * Standalone Node ESM + Playwright script that drives `window.__STAGECRAFT_HEADLESS__`
 * across all 20 RenderStyleId art engines:
 *   1. Renders fixed integer frames twice per engine and compares SHA-256 hashes of
 *      PNG buffers to assert 100% bit-exact determinism.
 *   2. Checks pixel luminance variance & color diversity to catch blank/solid frames.
 *   3. Measures average and peak render latency (ms/frame) per engine.
 *   4. Writes clean JSON + Markdown reports (zero PNGs committed or written).
 *
 * Usage:
 *   node scripts/determinism-audit.mjs [--url http://localhost:3000] [--out ./out]
 *     [--frames 12,90,180] [--fps 60] [--aspect 16:9] [--styles all] [--no-autostart]
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

export const ALL_20_RENDER_STYLES = [
  'chiaroscuro',
  'shadow_puppetry',
  'stained_glass',
  'papercraft_diorama',
  'woodblock_print',
  'lineless_vector',
  'sumi_e_wash',
  'greek_amphora',
  'kente_tapestry',
  'illuminated_codex',
  'anime_cel',
  'manga_screentone',
  'blueprint_technical',
  'gouache_storybook',
  'neon_cybernoir',
  'felt_puppet',
  'risograph_print',
  'backlit_sand',
  'scratchboard_noir',
  'byzantine_mosaic',
];

function validateAuditUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid --url "${rawUrl}"`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Unsupported URL protocol "${parsed.protocol}"`);
  }
  const allowedHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
  if (!allowedHosts.has(parsed.hostname)) {
    throw new Error(`Refusing non-local --url host "${parsed.hostname}" for determinism audit.`);
  }
  parsed.searchParams.set('headless', '1');
  return parsed.toString();
}

function buildDefaultAuditEpisode() {
  return {
    id: 'determinism_audit_probe',
    series: 'Stagecraft Audit',
    title: 'Determinism & Performance Probe',
    subtitle: 'Automated 20-Engine Verification',
    defaultRaag: 'bhairavi',
    visualStyle: {
      renderStyle: 'chiaroscuro',
      lookPreset: 'classic_chiaroscuro',
      colorGrade: 'default',
      texture: 'clean',
      shadowContrast: 1.0,
      inkWeight: 1.0,
      rimLight: 'auto',
      captionStyle: 'classic_cinema',
      frameBorder: 'clean_letterbox',
      vignette: 0.3,
      motionCadence: '60fps',
      motionProfile: 'cinematic_drama',
      postFxPass: 'none',
      depthOfField: 0.35,
      spatialAudio: true,
    },
    cast: [
      {
        id: 'hero',
        name: 'Vikram',
        archetype: 'king',
        primaryColor: '#d97706',
        accentColor: '#f2c85b',
        skinColor: '#d9a06c',
      },
      {
        id: 'sage',
        name: 'Betaal',
        archetype: 'spirit',
        primaryColor: '#4f46e5',
        accentColor: '#38bdf8',
        skinColor: '#94a3b8',
      },
    ],
    beats: [
      {
        id: 'audit_b1',
        title: 'Moonlit Confrontation',
        duration: 4.0,
        stage: 'temple_sanctum',
        mood: 'midnight_banyan',
        weather: 'fireflies',
        shot: 'wide_stage',
        transition: 'hard_cut',
        lightSide: 'right',
        prop: 'sword',
        propSlot: 'center',
        cameraMove: 'slow_zoom_in',
        fx: 'none',
        sfx: 'none',
        raag: 'bhairavi',
        musicEnergy: 0.65,
        actors: [
          { castId: 'hero', slot: 'left', pose: 'heroic', expression: 'determined', facing: 'right', motion: 'breathe' },
          { castId: 'sage', slot: 'right', pose: 'float', expression: 'sly', facing: 'left', motion: 'hover' },
        ],
        speakerId: 'hero',
        speakerLabel: 'Vikram',
        dialogue: 'Every frame must render bit-for-bit identically across all twenty art engines.',
      },
      {
        id: 'audit_b2',
        title: 'Close-Up Rack Focus',
        duration: 4.0,
        stage: 'royal_durbar',
        mood: 'royal_gold',
        weather: 'embers',
        shot: 'closeup_left',
        transition: 'hard_cut',
        lightSide: 'left',
        prop: 'crown',
        propSlot: 'right',
        cameraMove: 'still',
        cameraKeyframes: [
          { atFrac: 0, zoom: 1.0, panX: 0, panY: 0, ease: 'ease_in_out' },
          { atFrac: 0.5, zoom: 1.14, panX: 0.04, panY: -0.02, ease: 'overshoot' },
          { atFrac: 1, zoom: 1.1, panX: 0.02, panY: 0, ease: 'linear' },
        ],
        fx: 'golden_glow',
        sfx: 'none',
        raag: 'yaman',
        musicEnergy: 0.72,
        actors: [
          { castId: 'hero', slot: 'left', pose: 'point', expression: 'fierce', facing: 'right', motion: 'breathe' },
          { castId: 'sage', slot: 'right', pose: 'stand', expression: 'shocked', facing: 'left', motion: 'breathe' },
        ],
        speakerId: 'sage',
        speakerLabel: 'Betaal',
        dialogue: 'Depth of field, camera splines, and procedural ink strokes remain strictly deterministic.',
      },
    ],
  };
}

async function waitForServer(url, timeoutMs = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return true;
    } catch {
      // retry until timeout
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  return false;
}

function formatMarkdownReport(report) {
  const lines = [
    '# Stagecraft Studio — Determinism & Performance Audit Report',
    '',
    `- **Timestamp**: ${report.timestamp}`,
    `- **Aspect / FPS**: ${report.aspect} @ ${report.fps}fps`,
    `- **Probed Frame Indices**: ${report.frameIndices.join(', ')}`,
    `- **Engines Passed**: ${report.summary.passedEngines}/${report.summary.totalEngines}`,
    `- **Bit-Exact Determinism**: ${report.summary.deterministic ? 'PASS (100% SHA-256 match)' : 'FAIL'}`,
    `- **Non-Blank Visual Sanity**: ${report.summary.allNonBlank ? 'PASS' : 'FAIL'}`,
    `- **Overall Avg Render Time**: ${report.summary.overallAvgMs.toFixed(2)} ms/frame`,
    '',
    '| Art Engine | Determinism | Non-Blank | Avg ms/frame | Max ms/frame | Sample SHA-256 (first 12) |',
    '| --- | :---: | :---: | ---: | ---: | --- |',
  ];

  for (const row of report.engines) {
    lines.push(
      `| \`${row.style}\` | ${row.deterministic ? 'PASS' : 'FAIL'} | ${row.nonBlank ? 'PASS' : 'FAIL'} | ${row.avgMs.toFixed(2)} | ${row.maxMs.toFixed(2)} | \`${row.sampleHash.slice(0, 12)}\` |`
    );
  }
  lines.push('');
  return lines.join('\n');
}

function parseCliArgs(argv) {
  let url = process.env.STAGECRAFT_URL || 'http://localhost:3000';
  let outDir = path.resolve('./out');
  let frameIndices = [12, 90, 180];
  let fps = 60;
  let aspect = '16:9';
  let styles = [...ALL_20_RENDER_STYLES];
  let episodePath = null;
  let autoStart = true;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--url' && argv[i + 1]) {
      url = argv[++i].trim();
    } else if (arg === '--out' && argv[i + 1]) {
      outDir = path.resolve(argv[++i]);
    } else if (arg === '--frames' && argv[i + 1]) {
      const parsed = argv[++i]
        .split(',')
        .map((n) => Math.max(0, Math.round(Number(n.trim()))))
        .filter((n) => Number.isFinite(n));
      if (parsed.length > 0) frameIndices = parsed;
    } else if (arg === '--fps' && argv[i + 1]) {
      const n = Number(argv[++i]);
      if (Number.isFinite(n)) fps = Math.max(12, Math.min(60, Math.round(n)));
    } else if (arg === '--aspect' && argv[i + 1]) {
      aspect = argv[++i].trim() === '9:16' ? '9:16' : '16:9';
    } else if (arg === '--styles' && argv[i + 1]) {
      const raw = argv[++i].trim();
      if (raw !== 'all') {
        const requested = raw
          .split(',')
          .map((s) => s.trim())
          .filter((s) => ALL_20_RENDER_STYLES.includes(s));
        if (requested.length > 0) styles = requested;
      }
    } else if (arg === '--episode' && argv[i + 1]) {
      episodePath = path.resolve(argv[++i]);
    } else if (arg === '--no-autostart') {
      autoStart = false;
    } else if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: node scripts/determinism-audit.mjs [--url http://localhost:3000] [--out ./out] [--frames 12,90,180] [--fps 60] [--aspect 16:9|9:16] [--styles all|chiaroscuro,...] [--episode ./ep.json] [--no-autostart]'
      );
      process.exit(0);
    }
  }

  return { url, outDir, frameIndices, fps, aspect, styles, episodePath, autoStart };
}

async function runAudit() {
  const opts = parseCliArgs(process.argv.slice(2));
  const targetUrl = validateAuditUrl(opts.url);
  const baseHealthUrl = new URL(opts.url).origin;

  let baseEpisode = buildDefaultAuditEpisode();
  if (opts.episodePath) {
    const raw = JSON.parse(fs.readFileSync(opts.episodePath, 'utf8'));
    if (raw && Array.isArray(raw.beats) && raw.beats.length > 0) {
      baseEpisode = raw;
    }
  }

  let serverChild = null;
  const alreadyUp = await waitForServer(baseHealthUrl, 1200);
  if (!alreadyUp) {
    if (!opts.autoStart) {
      throw new Error(`Stagecraft Studio is not reachable at ${baseHealthUrl}. Start dev server or omit --no-autostart.`);
    }
    const tsxBin = path.resolve('node_modules/.bin/tsx');
    if (fs.existsSync(tsxBin)) {
      serverChild = spawn(tsxBin, ['server.ts'], { stdio: 'ignore' });
    } else {
      serverChild = spawn('npx', ['tsx', 'server.ts'], { stdio: 'ignore' });
    }
    const ready = await waitForServer(baseHealthUrl, 25_000);
    if (!ready) {
      throw new Error(`Timed out waiting for Stagecraft Studio server at ${baseHealthUrl}`);
    }
  }

  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    if (serverChild) serverChild.kill('SIGTERM');
    throw new Error(
      'Playwright is required to run determinism-audit.mjs. Install once with:\n' +
        '  npm install -D playwright && npx playwright install chromium'
    );
  }

  let browser = null;
  try {
    browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: opts.aspect === '9:16' ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 },
    });
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForFunction(() => Boolean(window.__STAGECRAFT_HEADLESS__), { timeout: 15_000 });

    const engineReports = [];

    for (const styleId of opts.styles) {
      const styledEp = {
        ...baseEpisode,
        visualStyle: {
          ...(baseEpisode.visualStyle || {}),
          renderStyle: styleId,
        },
        beats: (baseEpisode.beats || []).map((b) => ({
          ...b,
          renderStyle: undefined,
        })),
      };

      await page.evaluate(
        ({ ep, aspect }) => {
          window.__STAGECRAFT_HEADLESS__.loadEpisode(ep, aspect, true);
        },
        { ep: styledEp, aspect: opts.aspect }
      );

      const frameResults = [];

      for (const frameIdx of opts.frameIndices) {
        const probe = await page.evaluate(
          ({ fIdx, fps }) => {
            const drv = window.__STAGECRAFT_HEADLESS__;
            const t0 = performance.now();
            const pngA = drv.renderFrameAtIndex(fIdx, fps);
            const msA = performance.now() - t0;

            // Sample canvas pixels deterministically on a 16x9 grid to verify non-blank content
            const canvas = document.querySelector('canvas');
            let lumaStdDev = 0;
            let uniqueColorBuckets = 0;
            if (canvas) {
              const c2d = canvas.getContext('2d');
              if (c2d) {
                const cols = 16;
                const rows = 9;
                const lumas = [];
                const buckets = new Set();
                for (let ry = 0; ry < rows; ry++) {
                  for (let cx = 0; cx < cols; cx++) {
                    const px = Math.min(canvas.width - 1, Math.floor(((cx + 0.5) / cols) * canvas.width));
                    const py = Math.min(canvas.height - 1, Math.floor(((ry + 0.5) / rows) * canvas.height));
                    const d = c2d.getImageData(px, py, 1, 1).data;
                    lumas.push(0.299 * d[0] + 0.587 * d[1] + 0.114 * d[2]);
                    buckets.add(`${d[0] >> 4}_${d[1] >> 4}_${d[2] >> 4}`);
                  }
                }
                const mean = lumas.reduce((a, b) => a + b, 0) / Math.max(1, lumas.length);
                const variance =
                  lumas.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / Math.max(1, lumas.length);
                lumaStdDev = Math.sqrt(variance);
                uniqueColorBuckets = buckets.size;
              }
            }

            const t1 = performance.now();
            const pngB = drv.renderFrameAtIndex(fIdx, fps);
            const msB = performance.now() - t1;

            return { pngA, pngB, msA, msB, lumaStdDev, uniqueColorBuckets };
          },
          { fIdx: frameIdx, fps: opts.fps }
        );

        const stripPrefix = (dataUrl) => String(dataUrl || '').replace(/^data:image\/png;base64,/, '');
        const bufA = Buffer.from(stripPrefix(probe.pngA), 'base64');
        const bufB = Buffer.from(stripPrefix(probe.pngB), 'base64');
        const hashA = crypto.createHash('sha256').update(bufA).digest('hex');
        const hashB = crypto.createHash('sha256').update(bufB).digest('hex');

        const deterministic = bufA.length > 256 && hashA === hashB;
        const nonBlank = probe.lumaStdDev >= 3.5 && probe.uniqueColorBuckets >= 6;
        const avgMs = (probe.msA + probe.msB) * 0.5;

        frameResults.push({
          frameIndex: frameIdx,
          bytes: bufA.length,
          hashA,
          hashB,
          deterministic,
          nonBlank,
          lumaStdDev: Number(probe.lumaStdDev.toFixed(2)),
          uniqueColorBuckets: probe.uniqueColorBuckets,
          msA: Number(probe.msA.toFixed(2)),
          msB: Number(probe.msB.toFixed(2)),
          avgMs: Number(avgMs.toFixed(2)),
        });
      }

      const avgMs =
        frameResults.reduce((sum, f) => sum + f.avgMs, 0) / Math.max(1, frameResults.length);
      const maxMs = frameResults.reduce((m, f) => Math.max(m, f.msA, f.msB), 0);
      const deterministic = frameResults.every((f) => f.deterministic);
      const nonBlank = frameResults.every((f) => f.nonBlank);

      engineReports.push({
        style: styleId,
        deterministic,
        nonBlank,
        avgMs: Number(avgMs.toFixed(2)),
        maxMs: Number(maxMs.toFixed(2)),
        sampleHash: frameResults[0]?.hashA || '',
        frames: frameResults,
      });

      console.log(
        `[${deterministic && nonBlank ? 'PASS' : 'FAIL'}] ${styleId.padEnd(20)} | det=${deterministic} | nonBlank=${nonBlank} | avg=${avgMs.toFixed(1)}ms | max=${maxMs.toFixed(1)}ms`
      );
    }

    const totalEngines = engineReports.length;
    const passedEngines = engineReports.filter((e) => e.deterministic && e.nonBlank).length;
    const overallAvgMs =
      engineReports.reduce((s, e) => s + e.avgMs, 0) / Math.max(1, totalEngines);

    const report = {
      schemaVersion: 1,
      timestamp: new Date().toISOString(),
      aspect: opts.aspect,
      fps: opts.fps,
      frameIndices: opts.frameIndices,
      summary: {
        totalEngines,
        passedEngines,
        deterministic: engineReports.every((e) => e.deterministic),
        allNonBlank: engineReports.every((e) => e.nonBlank),
        overallAvgMs: Number(overallAvgMs.toFixed(2)),
      },
      engines: engineReports,
    };

    fs.mkdirSync(opts.outDir, { recursive: true });
    const jsonPath = path.join(opts.outDir, 'determinism-audit.json');
    const mdPath = path.join(opts.outDir, 'determinism-audit.md');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
    fs.writeFileSync(mdPath, formatMarkdownReport(report), 'utf8');

    console.log(`\nReport written:\n  JSON: ${jsonPath}\n  MD:   ${mdPath}`);
    if (passedEngines < totalEngines) {
      process.exitCode = 1;
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (serverChild) serverChild.kill('SIGTERM');
  }
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isDirectRun) {
  runAudit().catch((err) => {
    console.error(`[FAIL] determinism-audit -> ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}
