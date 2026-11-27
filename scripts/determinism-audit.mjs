#!/usr/bin/env node
/**
 * Stagecraft Studio — Automated Determinism, Manifest & Visual Craft Audit CLI (Upgrades 10 & 26)
 *
 * Standalone Node ESM + Playwright script that drives `window.__STAGECRAFT_HEADLESS__`
 * across all 20 RenderStyleId art engines (and optional multi-viewport `--manifest` matrices):
 *   1. Renders fixed integer frames twice per engine/viewport and compares SHA-256 hashes of
 *      PNG buffers to assert 100% bit-exact determinism.
 *   2. Checks pixel luminance variance & color diversity to catch blank/solid frames.
 *   3. Measures average and peak render latency (ms/frame) and enforces optional `--max-frame-ms` budget.
 *   4. Captures browser `console` errors and uncaught `pageerror` exceptions.
 *   5. Embeds the calibrated 0-3 Visual Craft Scorecard (`scoreVisualCraft`) in JSON & Markdown reports.
 *   6. Writes clean JSON + Markdown reports (zero PNGs committed or written).
 *
 * Usage:
 *   node scripts/determinism-audit.mjs [--url http://localhost:3000] [--out ./out]
 *     [--frames 12,90,180] [--fps 60] [--aspect 16:9] [--styles all]
 *     [--episode ./ep.json] [--manifest ./audit-manifest.json]
 *     [--max-frame-ms 45] [--no-autostart]
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
      lightShafts: 0.4,
      hitstopEnabled: true,
      foregroundFraming: 0.35,
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
        stage: 'kali_temple',
        mood: 'midnight_banyan',
        weather: 'fireflies',
        shot: 'wide_stage',
        transition: 'hard_cut',
        lightSide: 'right',
        prop: 'khanda_sword',
        propSlot: 'center',
        cameraMove: 'slow_zoom_in',
        fx: 'none',
        sfx: 'none',
        raag: 'bhairavi',
        musicEnergy: 0.65,
        actors: [
          { castId: 'hero', slot: 'left', pose: 'stand', expression: 'calm', facing: 'right', motion: 'still' },
          { castId: 'sage', slot: 'right', pose: 'soar', expression: 'sly', facing: 'left', motion: 'hover' },
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
        mood: 'golden_durbar',
        weather: 'embers',
        shot: 'closeup_left',
        transition: 'hard_cut',
        lightSide: 'left',
        prop: 'royal_scroll',
        propSlot: 'right',
        cameraMove: 'still',
        cameraKeyframes: [
          { atFrac: 0, zoom: 1.0, panX: 0, panY: 0, ease: 'ease_in_out' },
          { atFrac: 0.5, zoom: 1.14, panX: 0.04, panY: -0.02, ease: 'overshoot' },
          { atFrac: 1, zoom: 1.1, panX: 0.02, panY: 0, ease: 'linear' },
        ],
        fx: 'divine_aura',
        sfx: 'none',
        raag: 'yaman',
        musicEnergy: 0.72,
        actors: [
          { castId: 'hero', slot: 'left', pose: 'gesture', expression: 'angry', facing: 'right', motion: 'still' },
          { castId: 'sage', slot: 'right', pose: 'stand', expression: 'shocked', facing: 'left', motion: 'still' },
        ],
        speakerId: 'sage',
        speakerLabel: 'Betaal',
        dialogue: 'Depth of field, camera splines, and procedural ink strokes remain strictly deterministic.',
      },
    ],
  };
}

/**
 * Loads an optional `--manifest <file.json>` defining a multi-viewport (16:9 + 9:16),
 * multi-style, frame-index verification matrix.
 */
function loadAuditManifest(manifestPath, fallbackOpts) {
  const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const entries = Array.isArray(raw) ? raw : Array.isArray(raw?.matrix) ? raw.matrix : [];
  if (entries.length === 0) {
    throw new Error(`Manifest "${manifestPath}" must contain a non-empty array or { "matrix": [...] }.`);
  }
  const baseDir = path.dirname(manifestPath);
  return entries.map((item, idx) => {
    const aspect = item?.aspect === '9:16' ? '9:16' : '16:9';
    const styles =
      Array.isArray(item?.styles) && item.styles.length > 0
        ? item.styles.filter((s) => ALL_20_RENDER_STYLES.includes(s))
        : typeof item?.style === 'string' && ALL_20_RENDER_STYLES.includes(item.style)
          ? [item.style]
          : [...fallbackOpts.styles];
    const frames =
      Array.isArray(item?.frames) && item.frames.length > 0
        ? item.frames
            .map((n) => Math.max(0, Math.round(Number(n))))
            .filter((n) => Number.isFinite(n))
        : [...fallbackOpts.frameIndices];
    const fps = Number.isFinite(Number(item?.fps))
      ? Math.max(12, Math.min(60, Math.round(Number(item.fps))))
      : fallbackOpts.fps;
    const episodePath = item?.episode
      ? path.resolve(baseDir, String(item.episode))
      : fallbackOpts.episodePath;
    return {
      label: String(item?.label || `entry_${idx + 1}_${aspect}`),
      aspect,
      styles: styles.length > 0 ? styles : ['chiaroscuro'],
      frameIndices: frames.length > 0 ? frames : [12, 90, 180],
      fps,
      episodePath,
    };
  });
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

function formatScorecardBlock(scorecard) {
  if (!scorecard || !Array.isArray(scorecard.categories)) return [];
  const lines = [
    '',
    '## Visual Craft Scorecard (0–3 Scale)',
    '',
    `- **Total**: **${scorecard.totalScore}/${scorecard.maxScore}** (${scorecard.gradeLabel}, avg ${Number(scorecard.averageScore).toFixed(2)}/3)`,
    '',
    '| Dimension | Score | Band | Rationale | Actionable Suggestion |',
    '| --- | :---: | --- | --- | --- |',
  ];
  for (const cat of scorecard.categories) {
    lines.push(
      `| ${cat.label} | **${cat.score}/3** | ${cat.band} | ${cat.rationale} | ${cat.suggestion || '—'} |`
    );
  }
  return lines;
}

function formatMarkdownReport(report) {
  const lines = [
    '# Stagecraft Studio — Determinism, Performance & Visual Craft Audit Report',
    '',
    `- **Timestamp**: ${report.timestamp}`,
    `- **Aspect(s) / FPS**: ${report.aspects.join(', ')} @ ${report.fps}fps`,
    `- **Probed Frame Indices**: ${report.frameIndices.join(', ')}`,
    `- **Rows Passed**: ${report.summary.passedEngines}/${report.summary.totalEngines}`,
    `- **Bit-Exact Determinism**: ${report.summary.deterministic ? 'PASS (100% SHA-256 match)' : 'FAIL'}`,
    `- **Non-Blank Visual Sanity**: ${report.summary.allNonBlank ? 'PASS' : 'FAIL'}`,
    `- **Runtime Errors (Console + PageError)**: ${report.runtimeErrors.length} (${report.summary.zeroRuntimeErrors ? 'PASS' : 'FAIL'})`,
    `- **Overall Avg Render Time**: ${report.summary.overallAvgMs.toFixed(2)} ms/frame${report.maxFrameMs ? ` (Budget <= ${report.maxFrameMs} ms: ${report.summary.withinFrameBudget ? 'PASS' : 'FAIL'})` : ''}`,
    '',
    '| Art Engine | Aspect | Determinism | Non-Blank | Budget | Avg ms/frame | Max ms/frame | Sample SHA-256 (first 12) |',
    '| --- | :---: | :---: | :---: | :---: | ---: | ---: | --- |',
  ];

  for (const row of report.engines) {
    lines.push(
      `| \`${row.style}\` | ${row.aspect || report.aspect} | ${row.deterministic ? 'PASS' : 'FAIL'} | ${row.nonBlank ? 'PASS' : 'FAIL'} | ${row.withinBudget === false ? 'OVER' : 'OK'} | ${row.avgMs.toFixed(2)} | ${row.maxMs.toFixed(2)} | \`${row.sampleHash.slice(0, 12)}\` |`
    );
  }

  if (report.scorecard) {
    lines.push(...formatScorecardBlock(report.scorecard));
  }

  if (report.runtimeErrors.length > 0) {
    lines.push('', '## Captured Browser Runtime Errors', '');
    for (const err of report.runtimeErrors) {
      lines.push(`- \`[${err.type}]\` ${err.message}`);
    }
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
  let manifestPath = null;
  let maxFrameMs = null;
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
    } else if (arg === '--manifest' && argv[i + 1]) {
      manifestPath = path.resolve(argv[++i]);
    } else if (arg === '--max-frame-ms' && argv[i + 1]) {
      const n = Number(argv[++i]);
      if (Number.isFinite(n) && n > 0) maxFrameMs = n;
    } else if (arg === '--no-autostart') {
      autoStart = false;
    } else if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: node scripts/determinism-audit.mjs [--url http://localhost:3000] [--out ./out] [--frames 12,90,180] [--fps 60] [--aspect 16:9|9:16] [--styles all|chiaroscuro,...] [--episode ./ep.json] [--manifest ./manifest.json] [--max-frame-ms 45] [--no-autostart]'
      );
      process.exit(0);
    }
  }

  return {
    url,
    outDir,
    frameIndices,
    fps,
    aspect,
    styles,
    episodePath,
    manifestPath,
    maxFrameMs,
    autoStart,
  };
}

async function runAudit() {
  const opts = parseCliArgs(process.argv.slice(2));
  const targetUrl = validateAuditUrl(opts.url);
  const baseHealthUrl = new URL(opts.url).origin;

  const matrix = opts.manifestPath
    ? loadAuditManifest(opts.manifestPath, opts)
    : [
        {
          label: `default_${opts.aspect}`,
          aspect: opts.aspect,
          styles: opts.styles,
          frameIndices: opts.frameIndices,
          fps: opts.fps,
          episodePath: opts.episodePath,
        },
      ];

  let serverChild = null;
  const alreadyUp = await waitForServer(baseHealthUrl, 1200);
  if (!alreadyUp) {
    if (!opts.autoStart) {
      throw new Error(
        `Stagecraft Studio is not reachable at ${baseHealthUrl}. Start dev server or omit --no-autostart.`
      );
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
  const runtimeErrors = [];
  try {
    browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport:
        matrix[0].aspect === '9:16'
          ? { width: 1080, height: 1920 }
          : { width: 1920, height: 1080 },
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        runtimeErrors.push({ type: 'console.error', message: msg.text() });
      }
    });
    page.on('pageerror', (err) => {
      runtimeErrors.push({
        type: 'pageerror',
        message: err instanceof Error ? err.message : String(err),
      });
    });

    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForFunction(() => Boolean(window.__STAGECRAFT_HEADLESS__), { timeout: 15_000 });

    const engineReports = [];
    let primaryScorecard = null;

    for (const runSpec of matrix) {
      let baseEpisode = buildDefaultAuditEpisode();
      if (runSpec.episodePath) {
        const raw = JSON.parse(fs.readFileSync(runSpec.episodePath, 'utf8'));
        if (raw && Array.isArray(raw.beats) && raw.beats.length > 0) {
          baseEpisode = raw;
        }
      }

      await page.setViewportSize(
        runSpec.aspect === '9:16'
          ? { width: 1080, height: 1920 }
          : { width: 1920, height: 1080 }
      );

      for (const styleId of runSpec.styles) {
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

        const loadedScorecard = await page.evaluate(
          ({ ep, aspect }) => {
            const drv = window.__STAGECRAFT_HEADLESS__;
            drv.loadEpisode(ep, aspect, true);
            return typeof drv.scoreVisualCraft === 'function' ? drv.scoreVisualCraft() : null;
          },
          { ep: styledEp, aspect: runSpec.aspect }
        );
        if (!primaryScorecard && loadedScorecard) {
          primaryScorecard = loadedScorecard;
        }

        const frameResults = [];

        for (const frameIdx of runSpec.frameIndices) {
          const probe = await page.evaluate(
            ({ fIdx, fps }) => {
              const drv = window.__STAGECRAFT_HEADLESS__;
              const t0 = performance.now();
              const resA = drv.renderFrameAtIndex(fIdx, fps);
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
                      const px = Math.min(
                        canvas.width - 1,
                        Math.floor(((cx + 0.5) / cols) * canvas.width)
                      );
                      const py = Math.min(
                        canvas.height - 1,
                        Math.floor(((ry + 0.5) / rows) * canvas.height)
                      );
                      const d = c2d.getImageData(px, py, 1, 1).data;
                      lumas.push(0.299 * d[0] + 0.587 * d[1] + 0.114 * d[2]);
                      buckets.add(`${d[0] >> 4}_${d[1] >> 4}_${d[2] >> 4}`);
                    }
                  }
                  const mean = lumas.reduce((a, b) => a + b, 0) / Math.max(1, lumas.length);
                  const variance =
                    lumas.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) /
                    Math.max(1, lumas.length);
                  lumaStdDev = Math.sqrt(variance);
                  uniqueColorBuckets = buckets.size;
                }
              }

              const t1 = performance.now();
              const resB = drv.renderFrameAtIndex(fIdx, fps);
              const msB = performance.now() - t1;

              const pngA = typeof resA === 'string' ? resA : resA?.pngBase64 || '';
              const pngB = typeof resB === 'string' ? resB : resB?.pngBase64 || '';
              return { pngA, pngB, msA, msB, lumaStdDev, uniqueColorBuckets };
            },
            { fIdx: frameIdx, fps: runSpec.fps }
          );

          const stripPrefix = (dataUrl) =>
            String(dataUrl || '').replace(/^data:image\/png;base64,/, '');
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
        const withinBudget = opts.maxFrameMs ? maxMs <= opts.maxFrameMs : true;

        engineReports.push({
          label: runSpec.label,
          aspect: runSpec.aspect,
          style: styleId,
          deterministic,
          nonBlank,
          withinBudget,
          avgMs: Number(avgMs.toFixed(2)),
          maxMs: Number(maxMs.toFixed(2)),
          sampleHash: frameResults[0]?.hashA || '',
          frames: frameResults,
        });

        console.log(
          `[${deterministic && nonBlank && withinBudget ? 'PASS' : 'FAIL'}] ${styleId.padEnd(20)} (${runSpec.aspect}) | det=${deterministic} | nonBlank=${nonBlank} | avg=${avgMs.toFixed(1)}ms | max=${maxMs.toFixed(1)}ms`
        );
      }
    }

    const totalEngines = engineReports.length;
    const passedEngines = engineReports.filter(
      (e) => e.deterministic && e.nonBlank && e.withinBudget
    ).length;
    const overallAvgMs =
      engineReports.reduce((s, e) => s + e.avgMs, 0) / Math.max(1, totalEngines);
    const aspects = Array.from(new Set(matrix.map((m) => m.aspect)));

    const report = {
      schemaVersion: 2,
      timestamp: new Date().toISOString(),
      aspect: aspects[0] || opts.aspect,
      aspects,
      fps: opts.fps,
      frameIndices: opts.frameIndices,
      maxFrameMs: opts.maxFrameMs,
      manifestPath: opts.manifestPath,
      runtimeErrors,
      scorecard: primaryScorecard,
      summary: {
        totalEngines,
        passedEngines,
        deterministic: engineReports.every((e) => e.deterministic),
        allNonBlank: engineReports.every((e) => e.nonBlank),
        withinFrameBudget: engineReports.every((e) => e.withinBudget),
        zeroRuntimeErrors: runtimeErrors.length === 0,
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
    if (passedEngines < totalEngines || runtimeErrors.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (serverChild) serverChild.kill('SIGTERM');
  }
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isDirectRun) {
  runAudit().catch((err) => {
    console.error(`[FAIL] determinism-audit -> ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}
