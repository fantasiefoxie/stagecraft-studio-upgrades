#!/usr/bin/env tsx
/**
 * Katha Studio — Headless Episode Compiler & YPP/Retention Auditor CLI
 *
 * Designed for external LLM agents, CI pipelines, and batch creators!
 * Compiles Lite Director JSON (or Full Episode JSON, or markdown-wrapped LLM output)
 * into a validated, production-ready Katha Studio EpisodeScript with deterministic
 * modular Entity DNA, YPP Monetization Audit, Retention & Mid-Roll Ad-Break Report,
 * Chapter Partitioning, and optional .SRT subtitles.
 *
 * Usage:
 *   npm run compile-episode -- story.json --out compiled.json --audit --fix-ypp --srt story.srt
 *   cat story.json | npx tsx scripts/compile-episode.ts --stdin --fix-ypp --fix-retention
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import {
  compileLiteOrFullToEpisode,
  healAndParseLlmJson,
  PlaybookId,
} from '../src/studio/llmDirectorKit';
import {
  applyFullYppAutoShield,
  auditEpisodeYppCompliance,
} from '../src/studio/monetizationShield';
import {
  auditEpisodeRetention,
  autoFixRetentionPacing,
  autoInjectColdOpen,
  buildYoutubeLaunchPack,
  generateSrtCaptions,
} from '../src/studio/growthTools';
import { formatLongDuration, partitionEpisodeIntoChapters } from '../src/studio/longFormEngine';
import type { EpisodeScript } from '../src/studio/types';
import type { LanguageCode } from '../src/studio/i18n';

interface CliOptions {
  inputPath?: string;
  outPath?: string;
  srtPath?: string;
  stdin: boolean;
  audit: boolean;
  fixYpp: boolean;
  fixRetention: boolean;
  injectColdOpen: boolean;
  playbook?: PlaybookId | 'auto';
  language?: LanguageCode;
  compact: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    stdin: false,
    audit: false,
    fixYpp: false,
    fixRetention: false,
    injectColdOpen: false,
    compact: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--stdin') opts.stdin = true;
    else if (a === '--audit') opts.audit = true;
    else if (a === '--fix-ypp') opts.fixYpp = true;
    else if (a === '--fix-retention') opts.fixRetention = true;
    else if (a === '--cold-open') opts.injectColdOpen = true;
    else if (a === '--compact') opts.compact = true;
    else if (a === '--out' && argv[i + 1]) opts.outPath = argv[++i];
    else if (a === '--srt' && argv[i + 1]) opts.srtPath = argv[++i];
    else if (a === '--playbook' && argv[i + 1]) opts.playbook = argv[++i] as PlaybookId;
    else if (a === '--lang' && argv[i + 1]) opts.language = argv[++i] as LanguageCode;
    else if (!a.startsWith('--') && !opts.inputPath) opts.inputPath = a;
  }
  return opts;
}

async function readAllStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function compileRawPayload(
  rawInput: unknown,
  opts: {
    fixYpp: boolean;
    fixRetention: boolean;
    injectColdOpen: boolean;
    playbook?: PlaybookId | 'auto';
    language?: LanguageCode;
  }
) {
  let payload: unknown = rawInput;
  const healedNotes: string[] = [];

  if (typeof rawInput === 'string') {
    const healed = healAndParseLlmJson(rawInput);
    if (healed.ok === false) {
      return { ok: false as const, error: healed.error };
    }
    payload = healed.data;
    healedNotes.push(...healed.healedNotes);
  }

  const compiled = compileLiteOrFullToEpisode(payload, {
    playbookOverride: opts.playbook || 'auto',
    targetLanguage: opts.language,
  });
  if (compiled.ok === false) {
    return { ok: false as const, error: compiled.error };
  }

  let ep: EpisodeScript = compiled.script;
  const appliedTransforms: string[] = [...healedNotes, ...compiled.autoFixes];

  if (opts.injectColdOpen) {
    ep = autoInjectColdOpen(ep);
    appliedTransforms.push('Injected 3.4s Cold Open Hook');
  }
  if (opts.fixRetention) {
    ep = autoFixRetentionPacing(ep);
    appliedTransforms.push('Applied Retention Pacing & Long-Form Mood Variety Optimizer');
  }
  if (opts.fixYpp) {
    const shield = applyFullYppAutoShield(ep);
    ep = shield.episode;
    if (shield.changed) appliedTransforms.push(...shield.summary);
  }

  const yppAudit = auditEpisodeYppCompliance(ep, { voiceClipCount: 0 });
  const retentionAudit = auditEpisodeRetention(ep);
  const chapters = partitionEpisodeIntoChapters(ep, 200);
  const launchPack = buildYoutubeLaunchPack(ep);

  return {
    ok: true as const,
    episode: ep,
    summary: {
      id: ep.id,
      title: ep.title,
      series: ep.series,
      language: ep.language || 'en',
      castCount: ep.cast.length,
      beatCount: ep.beats.length,
      totalDurationSec: Number(retentionAudit.totalDurationSec.toFixed(1)),
      formattedDuration: formatLongDuration(retentionAudit.totalDurationSec),
      chapterCount: chapters.length,
      yppScore: yppAudit.score,
      yppGrade: yppAudit.grade,
      yppStatus: yppAudit.status,
      retentionScore: retentionAudit.score,
      retentionGrade: retentionAudit.grade,
      recommendedMidRolls: retentionAudit.recommendedMidRolls,
      appliedTransforms,
    },
    yppAudit,
    retentionAudit,
    chapters: chapters.map((c) => ({
      chapterNumber: c.chapterNumber,
      title: c.title,
      beatCount: c.beatCount,
      durationSec: Number(c.durationSec.toFixed(1)),
      startSec: Number(c.startSec.toFixed(1)),
    })),
    youtubeChaptersText: launchPack.chaptersText,
    midRollTimestampsText: launchPack.midRollTimestampsText,
    srt: generateSrtCaptions(ep),
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.stdin) {
    const stdinRaw = await readAllStdin();
    if (!stdinRaw.trim()) {
      process.stdout.write(JSON.stringify({ ok: false, error: 'Empty stdin payload.' }));
      process.exit(1);
    }

    // Support either raw Lite/Full episode text OR structured wrapper { input, fixYpp, fixRetention, injectColdOpen, playbook, language }
    let targetInput: unknown = stdinRaw;
    let fixYpp = opts.fixYpp;
    let fixRetention = opts.fixRetention;
    let injectColdOpen = opts.injectColdOpen;
    let playbook = opts.playbook;
    let language = opts.language;

    try {
      const parsed = JSON.parse(stdinRaw) as Record<string, unknown>;
      if (parsed && typeof parsed === 'object' && 'input' in parsed) {
        targetInput = parsed.input;
        if (typeof parsed.fixYpp === 'boolean') fixYpp = parsed.fixYpp;
        if (typeof parsed.fixRetention === 'boolean') fixRetention = parsed.fixRetention;
        if (typeof parsed.injectColdOpen === 'boolean') injectColdOpen = parsed.injectColdOpen;
        if (typeof parsed.playbook === 'string') playbook = parsed.playbook as PlaybookId;
        if (typeof parsed.language === 'string') language = parsed.language as LanguageCode;
      } else {
        targetInput = parsed;
      }
    } catch {
      // Let healAndParseLlmJson handle fenced/raw LLM text
      targetInput = stdinRaw;
    }

    const result = compileRawPayload(targetInput, {
      fixYpp,
      fixRetention,
      injectColdOpen,
      playbook,
      language,
    });
    process.stdout.write(JSON.stringify(result));
    process.exit(result.ok ? 0 : 1);
  }

  if (!opts.inputPath) {
    console.error(
      'Usage: npx tsx scripts/compile-episode.ts <story.json> [--out compiled.json] [--srt out.srt] [--audit] [--fix-ypp] [--fix-retention] [--cold-open]'
    );
    process.exit(1);
  }

  const resolvedIn = path.resolve(process.cwd(), opts.inputPath);
  const rawText = await fs.readFile(resolvedIn, 'utf8');
  const result = compileRawPayload(rawText, {
    fixYpp: opts.fixYpp,
    fixRetention: opts.fixRetention,
    injectColdOpen: opts.injectColdOpen,
    playbook: opts.playbook,
    language: opts.language,
  });

  if (result.ok === false) {
    console.error(`Compile failed: ${result.error}`);
    process.exit(1);
  }

  if (opts.outPath) {
    const resolvedOut = path.resolve(process.cwd(), opts.outPath);
    await fs.mkdir(path.dirname(resolvedOut), { recursive: true });
    await fs.writeFile(
      resolvedOut,
      JSON.stringify(result.episode, null, opts.compact ? 0 : 2),
      'utf8'
    );
  }

  if (opts.srtPath) {
    const resolvedSrt = path.resolve(process.cwd(), opts.srtPath);
    await fs.mkdir(path.dirname(resolvedSrt), { recursive: true });
    await fs.writeFile(resolvedSrt, result.srt, 'utf8');
  }

  if (opts.audit || (!opts.outPath && !opts.srtPath)) {
    const s = result.summary;
    console.log(`Compiled: ${s.title} (${s.series})`);
    console.log(
      `Runtime: ${s.formattedDuration} (${s.beatCount} scenes, ${s.castCount} cast, ${s.chapterCount} chapter${s.chapterCount === 1 ? '' : 's'})`
    );
    console.log(`YPP Shield: ${s.yppScore}/100 (Grade ${s.yppGrade} · ${s.yppStatus})`);
    console.log(`Retention:  ${s.retentionScore}/100 (Grade ${s.retentionGrade})`);
    if (s.recommendedMidRolls.length > 0) {
      console.log(`Mid-Roll Ad Breaks (${s.recommendedMidRolls.length}):`);
      for (const m of s.recommendedMidRolls) {
        console.log(`  ${m.formattedTime} — ${m.reason}`);
      }
    }
    if (result.yppAudit.issues.length > 0) {
      console.log('YPP Notes:');
      for (const iss of result.yppAudit.issues) {
        console.log(`  [${iss.severity.toUpperCase()}] ${iss.title}`);
      }
    }
    if (opts.outPath) {
      console.log(`Saved compiled episode -> ${opts.outPath}`);
    }
    if (opts.srtPath) {
      console.log(`Saved .SRT captions -> ${opts.srtPath}`);
    }
  } else {
    console.log(
      `OK: ${result.summary.title} (${result.summary.formattedDuration}, ${result.summary.beatCount} scenes, YPP ${result.summary.yppScore}/100)`
    );
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
