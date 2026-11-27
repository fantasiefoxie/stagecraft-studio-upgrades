import 'dotenv/config';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import crypto from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const ALLOWED_GEMINI_TTS_MODELS = new Set([
  'gemini-3.8-flash-lite-tts',
  'gemini-3.8-flash-tts',
  'gemini-2.5-flash-preview-tts',
]);
const ALLOWED_GEMINI_VOICES = new Set(['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr']);
const SAFE_MODEL_RE = /^[A-Za-z0-9._:/-]{2,96}$/;
const SAFE_VOICE_RE = /^[A-Za-z0-9._-]{1,64}$/;
const SAFE_LANG_RE = /^[a-z]{2}(?:-[A-Za-z]{2,4})?$/;
const MAX_MP4_UPLOAD_BYTES = 150 * 1024 * 1024; // 150 MB streaming disk cap per file/chapter
const MAX_CONCURRENT_FFMPEG = 2;
const MAX_RENDER_SESSIONS = 4;
const MAX_CHAPTERS_PER_SESSION = 24;
const MAX_SESSION_TOTAL_BYTES = 1200 * 1024 * 1024; // 1.2 GB total per multi-chapter session
const RENDER_SESSION_TTL_MS = 20 * 60_000; // 20 minutes
const SAFE_SESSION_ID_RE = /^[a-f0-9]{32}$/;
const MAX_AUDIO_SESSIONS = 4;
const MAX_AUDIO_CHUNK_BYTES = 80 * 1024 * 1024; // 80 MB per chapter WAV chunk
const MAX_AUDIO_SESSION_BYTES = 500 * 1024 * 1024; // 500 MB per audio stitch session
const RIFF_WAV_MAGIC = Buffer.from([0x52, 0x49, 0x46, 0x46]); // "RIFF"
let activeFfmpegJobs = 0;

interface RenderStitchSession {
  id: string;
  dir: string;
  createdAt: number;
  lastTouchedAt: number;
  totalBytes: number;
  finalizing: boolean;
  chapters: Map<number, { filename: string; bytes: number }>;
}

const renderSessions = new Map<string, RenderStitchSession>();
const audioSessions = new Map<string, RenderStitchSession>();

function cleanupSessionMap(map: Map<string, RenderStitchSession>, sessionId: string): void {
  const session = map.get(sessionId);
  if (!session) return;
  map.delete(sessionId);
  void fs.rm(session.dir, { recursive: true, force: true }).catch(() => {});
}

function cleanupRenderSession(sessionId: string): void {
  cleanupSessionMap(renderSessions, sessionId);
}

function cleanupAudioSession(sessionId: string): void {
  cleanupSessionMap(audioSessions, sessionId);
}

function sweepExpiredRenderSessions(): void {
  const now = Date.now();
  for (const [id, session] of renderSessions.entries()) {
    if (!session.finalizing && now - session.lastTouchedAt > RENDER_SESSION_TTL_MS) {
      cleanupRenderSession(id);
    }
  }
  for (const [id, session] of audioSessions.entries()) {
    if (!session.finalizing && now - session.lastTouchedAt > RENDER_SESSION_TTL_MS) {
      cleanupAudioSession(id);
    }
  }
}

setInterval(sweepExpiredRenderSessions, 60_000).unref();

function isModelNotFoundErr(status: number, msg: string): boolean {
  return (status === 404 || status === 400) && /model|not found|unsupported|deprecated/i.test(msg);
}

function uniqueModels(models: string[]): string[] {
  return Array.from(new Set(models.filter(Boolean)));
}

let cachedFfmpegAvailable: boolean | null = null;
async function checkFfmpegAvailable(): Promise<boolean> {
  if (cachedFfmpegAvailable !== null) return cachedFfmpegAvailable;
  try {
    await execFileAsync('ffmpeg', ['-version'], { timeout: 3000 });
    cachedFfmpegAvailable = true;
  } catch {
    cachedFfmpegAvailable = false;
  }
  return cachedFfmpegAvailable;
}

const ALLOWED_SERVER_VIDEO_ENCODERS = new Set([
  'auto',
  'libx264',
  'h264_nvenc',
  'h264_amf',
  'h264_videotoolbox',
]);
let cachedServerVideoEncoder: string | null = null;

async function detectServerVideoEncoder(): Promise<string> {
  if (cachedServerVideoEncoder) return cachedServerVideoEncoder;
  const envReq = (process.env.FFMPEG_ENCODER || 'auto').trim();
  const safeReq = ALLOWED_SERVER_VIDEO_ENCODERS.has(envReq) ? envReq : 'auto';
  if (safeReq !== 'auto') {
    cachedServerVideoEncoder = safeReq;
    return safeReq;
  }
  try {
    const { stdout } = await execFileAsync('ffmpeg', ['-hide_banner', '-encoders'], {
      timeout: 5000,
      maxBuffer: 2 * 1024 * 1024,
    });
    for (const candidate of ['h264_nvenc', 'h264_amf', 'h264_videotoolbox']) {
      if (stdout.includes(candidate)) {
        cachedServerVideoEncoder = candidate;
        return candidate;
      }
    }
  } catch {
    // Fall back safely to software libx264
  }
  cachedServerVideoEncoder = 'libx264';
  return 'libx264';
}

function buildServerVideoCodecArgs(encoder: string): string[] {
  if (encoder === 'h264_nvenc') {
    return ['-c:v', 'h264_nvenc', '-preset', 'p5', '-cq', '19', '-pix_fmt', 'yuv420p'];
  }
  if (encoder === 'h264_amf') {
    return ['-c:v', 'h264_amf', '-quality', 'balanced', '-rc', 'cqp', '-qp_i', '19', '-qp_p', '19', '-pix_fmt', 'yuv420p'];
  }
  if (encoder === 'h264_videotoolbox') {
    return ['-c:v', 'h264_videotoolbox', '-q:v', '68', '-pix_fmt', 'yuv420p'];
  }
  return ['-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p'];
}

// Bounded SHA-256 keyed in-memory LRU TTS audio cache (avoids repeat synthesis latency & billing)
const MAX_TTS_CACHE_ENTRIES = 128;
const MAX_TTS_CACHE_BYTES = 32 * 1024 * 1024; // 32 MB hard cap
const MAX_SINGLE_TTS_CACHE_ITEM_BYTES = 4 * 1024 * 1024; // 4 MB per clip cap
const ttsAudioCache = new Map<string, { buf: Buffer; contentType: string }>();
let ttsAudioCacheBytes = 0;

function makeTtsCacheKey(parts: Record<string, string | number>): string {
  return crypto.createHash('sha256').update(JSON.stringify(parts)).digest('hex');
}

function getCachedTtsAudio(key: string): { buf: Buffer; contentType: string } | null {
  const hit = ttsAudioCache.get(key);
  if (!hit) return null;
  // Refresh LRU recency
  ttsAudioCache.delete(key);
  ttsAudioCache.set(key, hit);
  return hit;
}

function putCachedTtsAudio(key: string, buf: Buffer, contentType: string): void {
  if (buf.byteLength === 0 || buf.byteLength > MAX_SINGLE_TTS_CACHE_ITEM_BYTES) return;
  const existing = ttsAudioCache.get(key);
  if (existing) {
    ttsAudioCacheBytes -= existing.buf.byteLength;
    ttsAudioCache.delete(key);
  }
  while (
    ttsAudioCache.size >= MAX_TTS_CACHE_ENTRIES ||
    ttsAudioCacheBytes + buf.byteLength > MAX_TTS_CACHE_BYTES
  ) {
    const oldestKey = ttsAudioCache.keys().next().value;
    if (!oldestKey) break;
    const oldestVal = ttsAudioCache.get(oldestKey);
    if (oldestVal) ttsAudioCacheBytes -= oldestVal.buf.byteLength;
    ttsAudioCache.delete(oldestKey);
  }
  ttsAudioCache.set(key, { buf, contentType });
  ttsAudioCacheBytes += buf.byteLength;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const UPSTREAM_FETCH_TIMEOUT_MS = 45_000;
const WEBM_EBML_MAGIC = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);

interface RateBucket {
  count: number;
  resetAt: number;
}

function createRateLimiter(maxPerWindow: number, windowMs = 60_000) {
  const buckets = new Map<string, RateBucket>();
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    // Periodically prune expired buckets to keep memory bounded
    if (buckets.size > 512) {
      for (const [k, v] of buckets.entries()) {
        if (v.resetAt <= now) buckets.delete(k);
      }
    }
    const key = req.ip || req.socket.remoteAddress || 'local';
    let entry = buckets.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      buckets.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > maxPerWindow) {
      const retrySec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retrySec));
      res.status(429).json({
        error: `Too many requests. Please wait ${retrySec}s before trying again.`,
      });
      return;
    }
    next();
  };
}

function isAbortTimeoutError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return err.name === 'TimeoutError' || err.name === 'AbortError' || /timeout/i.test(err.message);
}

function isPrivateOrBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    host === 'metadata.google.internal' ||
    host === 'metadata.goog' ||
    host === '0.0.0.0' ||
    host === '::' ||
    host.startsWith('169.254.') ||
    host.startsWith('fe80:')
  ) {
    return true;
  }
  const allowLocal = process.env.ALLOW_LOCAL_CUSTOM_SERVERS === 'true';
  if (!allowLocal) {
    if (
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host === '::1' ||
      host.startsWith('fc') ||
      host.startsWith('fd') ||
      host.startsWith('::ffff:127.') ||
      host.startsWith('::ffff:10.') ||
      host.startsWith('::ffff:192.168.') ||
      host.startsWith('127.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return true;
    }
  }
  return false;
}

function isValidExternalHttpUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (parsed.username || parsed.password) return null;
    if (isPrivateOrBlockedHost(parsed.hostname)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'camera=(), geolocation=()');
    next();
  });

  app.use(express.json({ limit: '2mb' }));
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'status' in err && (err as { status?: number }).status === 400) {
      res.status(400).json({ error: 'Invalid JSON request body.' });
      return;
    }
    next(err);
  });

  const apiLimiter = createRateLimiter(60, 60_000);
  const mp4Limiter = createRateLimiter(12, 60_000);

  // Report configured server-side TTS providers (booleans only, never exposing secret values)
  app.get('/api/tts/status', (_req: Request, res: Response) => {
    const hasGemini = Boolean(
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
    );
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
    const hasElevenLabs = Boolean(process.env.ELEVENLABS_API_KEY);
    const hasCustomServer = Boolean(isValidExternalHttpUrl(process.env.CUSTOM_TTS_URL));
    res.json({
      gemini: hasGemini,
      openai: hasOpenAI,
      elevenlabs: hasElevenLabs,
      custom_server: hasCustomServer,
    });
  });

  // Report configured server-side LLM providers + FFmpeg MP4 capability (booleans only)
  app.get('/api/llm/status', async (_req: Request, res: Response) => {
    const hasGemini = Boolean(
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
    );
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
    const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);
    const hasCustomLlm = Boolean(isValidExternalHttpUrl(process.env.CUSTOM_LLM_URL));
    const hasFfmpeg = await checkFfmpegAvailable();
    res.json({
      gemini: hasGemini,
      openai: hasOpenAI,
      anthropic: hasAnthropic,
      custom_server: hasCustomLlm,
      ffmpeg: hasFfmpeg,
    });
  });

  // Configurable multi-provider server-side LLM proxy (powers Upgrade #8 Episode Director & #4 Multi-Language Dubbing)
  app.post('/api/llm', apiLimiter, async (req: Request, res: Response) => {
    try {
      const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<
        string,
        unknown
      >;
      const provider = typeof body.provider === 'string' ? body.provider : 'gemini';
      const modelRaw = typeof body.model === 'string' ? body.model.trim() : '';
      const systemPrompt = typeof body.systemPrompt === 'string' ? body.systemPrompt.trim() : '';
      const userPrompt = typeof body.userPrompt === 'string' ? body.userPrompt.trim() : '';
      const jsonMode = body.jsonMode !== false;
      const tempRaw = Number(body.temperature);
      const temperature = Number.isFinite(tempRaw)
        ? Math.max(0, Math.min(1.2, Number(tempRaw.toFixed(2))))
        : undefined;
      const seedRaw = Number(body.seed);
      const seed =
        Number.isInteger(seedRaw) && seedRaw >= 0 && seedRaw <= 2147483647 ? seedRaw : undefined;

      if (!userPrompt || userPrompt.length > 48000 || systemPrompt.length > 36000) {
        res.status(400).json({ error: 'Prompt payload is empty or exceeds size limit.' });
        return;
      }

      if (provider === 'gemini') {
        const ai = getGeminiClient();
        if (!ai) {
          res.status(400).json({
            error: 'GEMINI_API_KEY is not configured in Settings -> Secrets or .env.',
          });
          return;
        }
        const candidates = uniqueModels([
          SAFE_MODEL_RE.test(modelRaw) && !/^gemini-(1\.5|2\.0)-/i.test(modelRaw)
            ? modelRaw
            : 'gemini-4-hydrogen',
          'gemini-4-hydrogen',
          'gemini-2.5-flash',
        ]);
        let lastErr: unknown = null;
        for (const chosenModel of candidates) {
          try {
            const isGemini4 = /^gemini-4-/i.test(chosenModel);
            const response = await ai.models.generateContent({
              model: chosenModel,
              contents: userPrompt,
              config: {
                ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
                ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
                ...(!isGemini4 && temperature !== undefined ? { temperature } : {}),
                ...(seed !== undefined ? { seed } : {}),
              },
            });
            const text = response.text || '';
            if (!text) {
              res.status(502).json({ error: 'Gemini returned an empty response.' });
              return;
            }
            res.json({ text, model: chosenModel });
            return;
          } catch (err) {
            lastErr = err;
            const msg = err instanceof Error ? err.message : String(err);
            if (!/404|not found|model/i.test(msg)) break;
          }
        }
        throw lastErr instanceof Error ? lastErr : new Error('Gemini generation failed.');
      }

      if (provider === 'openai') {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          res.status(400).json({
            error: 'OPENAI_API_KEY is not configured in Settings -> Secrets or .env.',
          });
          return;
        }
        const candidates = uniqueModels([
          SAFE_MODEL_RE.test(modelRaw) ? modelRaw : 'gpt-4o-mini',
          'gpt-4o-mini',
        ]);
        let lastStatus = 500;
        let lastErrText = 'OpenAI request failed.';
        for (const chosenModel of candidates) {
          const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            signal: AbortSignal.timeout(UPSTREAM_FETCH_TIMEOUT_MS),
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: chosenModel,
              ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
              ...(temperature !== undefined ? { temperature } : {}),
              ...(seed !== undefined ? { seed } : {}),
              messages: [
                ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                { role: 'user', content: userPrompt },
              ],
            }),
          });
          if (upstream.ok) {
            const data = (await upstream.json()) as {
              choices?: Array<{ message?: { content?: string } }>;
            };
            res.json({ text: data.choices?.[0]?.message?.content || '', model: chosenModel });
            return;
          }
          lastStatus = upstream.status;
          lastErrText = await upstream.text().catch(() => upstream.statusText);
          if (!isModelNotFoundErr(lastStatus, lastErrText)) break;
        }
        res.status(lastStatus).json({ error: `OpenAI error: ${lastErrText.slice(0, 240)}` });
        return;
      }

      if (provider === 'anthropic') {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          res.status(400).json({
            error: 'ANTHROPIC_API_KEY is not configured in Settings -> Secrets or .env.',
          });
          return;
        }
        const chosenModel = SAFE_MODEL_RE.test(modelRaw) ? modelRaw : 'claude-3-5-sonnet-latest';
        const messages = jsonMode
          ? [
              { role: 'user', content: userPrompt },
              { role: 'assistant', content: '{' },
            ]
          : [{ role: 'user', content: userPrompt }];
        const upstream = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          signal: AbortSignal.timeout(UPSTREAM_FETCH_TIMEOUT_MS),
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: chosenModel,
            max_tokens: 8192,
            ...(temperature !== undefined ? { temperature: Math.min(1, temperature) } : {}),
            ...(systemPrompt ? { system: systemPrompt } : {}),
            messages,
          }),
        });
        if (!upstream.ok) {
          const errText = await upstream.text().catch(() => upstream.statusText);
          res.status(upstream.status).json({ error: `Anthropic error: ${errText.slice(0, 240)}` });
          return;
        }
        const data = (await upstream.json()) as {
          content?: Array<{ type?: string; text?: string }>;
        };
        const rawText = data.content?.find((c) => c.type === 'text')?.text || '';
        const text = jsonMode && !rawText.trimStart().startsWith('{') ? `{${rawText}` : rawText;
        res.json({ text });
        return;
      }

      if (provider === 'custom_server') {
        const customUrl = isValidExternalHttpUrl(process.env.CUSTOM_LLM_URL);
        if (!customUrl) {
          res.status(400).json({
            error: 'CUSTOM_LLM_URL is not configured in server environment variables.',
          });
          return;
        }
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (process.env.CUSTOM_LLM_API_KEY) {
          headers.Authorization = `Bearer ${process.env.CUSTOM_LLM_API_KEY}`;
        }
        const chosenModel = SAFE_MODEL_RE.test(modelRaw) ? modelRaw : 'gpt-4o-mini';
        const basePayload = {
          model: chosenModel,
          ...(temperature !== undefined ? { temperature } : {}),
          ...(seed !== undefined ? { seed } : {}),
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: userPrompt },
          ],
        };
        let upstream = await fetch(customUrl, {
          method: 'POST',
          redirect: 'error',
          signal: AbortSignal.timeout(UPSTREAM_FETCH_TIMEOUT_MS),
          headers,
          body: JSON.stringify(
            jsonMode ? { ...basePayload, response_format: { type: 'json_object' } } : basePayload
          ),
        });
        // Graceful fallback for custom OpenAI-compatible servers that reject response_format
        if (!upstream.ok && jsonMode && (upstream.status === 400 || upstream.status === 422)) {
          upstream = await fetch(customUrl, {
            method: 'POST',
            redirect: 'error',
            signal: AbortSignal.timeout(UPSTREAM_FETCH_TIMEOUT_MS),
            headers,
            body: JSON.stringify(basePayload),
          });
        }
        if (!upstream.ok) {
          res.status(upstream.status).json({ error: `Custom LLM server returned HTTP ${upstream.status}.` });
          return;
        }
        const data = (await upstream.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        res.json({ text: data.choices?.[0]?.message?.content || '' });
        return;
      }

      res.status(400).json({ error: `Unsupported LLM provider: ${provider}` });
    } catch (err) {
      if (isAbortTimeoutError(err)) {
        res.status(504).json({ error: 'Upstream LLM provider timed out. Please retry.' });
        return;
      }
      const msg = err instanceof Error ? err.message.slice(0, 240) : 'LLM request failed.';
      res.status(500).json({ error: msg });
    }
  });

  // Streaming Broadcast H.264 MP4 (-14 LUFS Loudness Normalized) FFmpeg converter (zero RAM buffering!)
  app.post('/api/convert-mp4', mp4Limiter, async (req: Request, res: Response) => {
    const hasFfmpeg = await checkFfmpegAvailable();
    if (!hasFfmpeg) {
      res.status(501).json({
        error:
          'FFmpeg is not installed on this server. Install ffmpeg locally (brew install ffmpeg / apt install ffmpeg) or run scripts/render-batch.mjs on your machine.',
      });
      return;
    }
    if (activeFfmpegJobs >= MAX_CONCURRENT_FFMPEG) {
      res.setHeader('Retry-After', '10');
      res.status(503).json({
        error: 'Video converter is busy with another export. Please retry in a few seconds.',
      });
      return;
    }

    activeFfmpegJobs++;
    let tmpDir = '';
    let streamedCleanupScheduled = false;
    const cleanupTmp = () => {
      if (!tmpDir) return;
      const dir = tmpDir;
      tmpDir = '';
      void fs.rm(dir, { recursive: true, force: true }).catch(() => {});
    };

    try {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'katha-mp4-'));
      const inFile = path.join(tmpDir, 'input.webm');
      const outFile = path.join(tmpDir, 'output.mp4');

      // Stream raw request body straight to disk with early 4-byte EBML magic check + 150MB cap
      const ingestResult = await new Promise<{ ok: true; bytes: number } | { ok: false; status: number; error: string }>((resolve) => {
        const ws = createWriteStream(inFile);
        const magicHead: Buffer[] = [];
        let magicChecked = false;
        let totalBytes = 0;
        let settled = false;

        const fail = (status: number, error: string) => {
          if (settled) return;
          settled = true;
          req.pause();
          ws.destroy();
          resolve({ ok: false, status, error });
        };

        ws.on('error', () => fail(500, 'Failed writing temporary video stream.'));
        req.on('aborted', () => fail(499, 'Upload stream aborted.'));
        req.on('error', () => fail(400, 'Upload stream read failed.'));

        req.on('data', (chunk: Buffer) => {
          if (settled) return;
          totalBytes += chunk.length;
          if (totalBytes > MAX_MP4_UPLOAD_BYTES) {
            fail(413, 'WebM upload exceeds 150 MB maximum limit.');
            return;
          }
          if (!magicChecked) {
            magicHead.push(chunk);
            const joined = Buffer.concat(magicHead);
            if (joined.length >= 4) {
              magicChecked = true;
              if (!joined.subarray(0, 4).equals(WEBM_EBML_MAGIC)) {
                fail(400, 'Upload a valid WebM video recording body.');
                return;
              }
            }
          }
          if (!ws.write(chunk)) {
            req.pause();
            ws.once('drain', () => {
              if (!settled) req.resume();
            });
          }
        });

        req.on('end', () => {
          if (settled) return;
          if (totalBytes < 64 || !magicChecked) {
            fail(400, 'Upload a valid WebM video recording body.');
            return;
          }
          ws.end(() => {
            if (!settled) {
              settled = true;
              resolve({ ok: true, bytes: totalBytes });
            }
          });
        });
      });

      if (ingestResult.ok === false) {
        res.status(ingestResult.status).json({ error: ingestResult.error });
        return;
      }

      let usedEncoder = await detectServerVideoEncoder();
      const runConvert = (encoder: string) =>
        execFileAsync(
          'ffmpeg',
          [
            '-y',
            '-i',
            inFile,
            ...buildServerVideoCodecArgs(encoder),
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
            outFile,
          ],
          { timeout: 150000, maxBuffer: 4 * 1024 * 1024 }
        );

      try {
        await runConvert(usedEncoder);
      } catch (err) {
        if (usedEncoder !== 'libx264') {
          cachedServerVideoEncoder = 'libx264';
          usedEncoder = 'libx264';
          await runConvert('libx264');
        } else {
          throw err;
        }
      }

      const rawName = typeof req.query.filename === 'string' ? req.query.filename : '';
      const safeName = /^[A-Za-z0-9_-]{1,64}$/.test(rawName)
        ? `${rawName}_youtube.mp4`
        : 'katha_broadcast_1080p60.mp4';
      const stat = await fs.stat(outFile);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Length', String(stat.size));
      res.setHeader('X-Video-Encoder', usedEncoder);
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);

      streamedCleanupScheduled = true;
      await new Promise<void>((resolve, reject) => {
        const rs = createReadStream(outFile);
        const done = () => {
          cleanupTmp();
          resolve();
        };
        rs.on('error', (err) => {
          cleanupTmp();
          reject(err);
        });
        res.on('close', done);
        res.on('finish', done);
        rs.pipe(res);
      });
    } catch {
      if (!res.headersSent) {
        res.status(500).json({
          error: 'MP4 conversion failed. Verify that the uploaded recording is a valid WebM video.',
        });
      }
    } finally {
      activeFfmpegJobs = Math.max(0, activeFfmpegJobs - 1);
      if (!streamedCleanupScheduled) {
        cleanupTmp();
      }
    }
  });

  // =========================================================================
  // 1-CLICK SERVER-SIDE LONG-FORM CHAPTER STITCHER (/api/render-session/*)
  // Streams each 3-min WebM chapter to temp disk, validates EBML magic & caps,
  // and joins all chapters via FFmpeg into one unified -14 LUFS broadcast .MP4!
  // =========================================================================
  const chapterUploadLimiter = createRateLimiter(60, 60_000);

  app.post('/api/render-session/start', mp4Limiter, async (_req: Request, res: Response) => {
    sweepExpiredRenderSessions();
    const hasFfmpeg = await checkFfmpegAvailable();
    if (!hasFfmpeg) {
      res.status(501).json({
        error: 'FFmpeg is not installed on this server. Download individual chapters and stitch locally with FFmpeg.',
      });
      return;
    }
    if (renderSessions.size >= MAX_RENDER_SESSIONS) {
      res.setHeader('Retry-After', '15');
      res.status(503).json({
        error: 'Maximum concurrent chapter stitch sessions active. Please retry shortly.',
      });
      return;
    }

    try {
      const sessionId = crypto.randomBytes(16).toString('hex');
      const tmpRoot = path.resolve(os.tmpdir());
      const sessionDir = await fs.mkdtemp(path.join(tmpRoot, `katha-stitch-${sessionId.slice(0, 8)}-`));
      const now = Date.now();
      renderSessions.set(sessionId, {
        id: sessionId,
        dir: path.resolve(sessionDir),
        createdAt: now,
        lastTouchedAt: now,
        totalBytes: 0,
        finalizing: false,
        chapters: new Map(),
      });
      res.json({ sessionId, maxChapters: MAX_CHAPTERS_PER_SESSION });
    } catch {
      res.status(500).json({ error: 'Could not initialize chapter stitch session.' });
    }
  });

  app.post('/api/render-session/:sessionId/chapter', chapterUploadLimiter, async (req: Request, res: Response) => {
    const sessionId = typeof req.params.sessionId === 'string' ? req.params.sessionId : '';
    if (!SAFE_SESSION_ID_RE.test(sessionId)) {
      res.status(400).json({ error: 'Invalid render session ID.' });
      return;
    }
    const session = renderSessions.get(sessionId);
    if (!session || session.finalizing) {
      res.status(404).json({ error: 'Render session not found or already finalizing.' });
      return;
    }

    const indexNum = Number(req.query.index);
    if (!Number.isInteger(indexNum) || indexNum < 0 || indexNum >= MAX_CHAPTERS_PER_SESSION) {
      res.status(400).json({
        error: `Chapter index must be an integer between 0 and ${MAX_CHAPTERS_PER_SESSION - 1}.`,
      });
      return;
    }

    const assignedFilename = `chapter_${String(indexNum).padStart(2, '0')}.webm`;
    const baseDir = path.resolve(session.dir);
    const targetPath = path.resolve(baseDir, assignedFilename);
    if (!targetPath.startsWith(baseDir + path.sep)) {
      res.status(400).json({ error: 'Invalid chapter file target.' });
      return;
    }

    session.lastTouchedAt = Date.now();
    const existingBytes = session.chapters.get(indexNum)?.bytes ?? 0;

    const ingestResult = await new Promise<{ ok: true; bytes: number } | { ok: false; status: number; error: string }>((resolve) => {
      const ws = createWriteStream(targetPath);
      const magicHead: Buffer[] = [];
      let magicChecked = false;
      let totalBytes = 0;
      let settled = false;

      const fail = (status: number, error: string) => {
        if (settled) return;
        settled = true;
        req.pause();
        ws.destroy();
        void fs.rm(targetPath, { force: true }).catch(() => {});
        resolve({ ok: false, status, error });
      };

      ws.on('error', () => fail(500, 'Failed writing temporary chapter stream.'));
      req.on('aborted', () => fail(499, 'Chapter upload aborted.'));
      req.on('error', () => fail(400, 'Chapter upload read failed.'));

      req.on('data', (chunk: Buffer) => {
        if (settled) return;
        totalBytes += chunk.length;
        if (totalBytes > MAX_MP4_UPLOAD_BYTES) {
          fail(413, 'Single chapter exceeds 150 MB upload limit.');
          return;
        }
        if (session.totalBytes - existingBytes + totalBytes > MAX_SESSION_TOTAL_BYTES) {
          fail(413, 'Total multi-chapter session exceeds 1.2 GB limit.');
          return;
        }
        if (!magicChecked) {
          magicHead.push(chunk);
          const joined = Buffer.concat(magicHead);
          if (joined.length >= 4) {
            magicChecked = true;
            if (!joined.subarray(0, 4).equals(WEBM_EBML_MAGIC)) {
              fail(400, 'Uploaded chapter must be a valid WebM video stream.');
              return;
            }
          }
        }
        if (!ws.write(chunk)) {
          req.pause();
          ws.once('drain', () => {
            if (!settled) req.resume();
          });
        }
      });

      req.on('end', () => {
        if (settled) return;
        if (totalBytes < 64 || !magicChecked) {
          fail(400, 'Uploaded chapter must be a valid WebM video stream.');
          return;
        }
        ws.end(() => {
          if (!settled) {
            settled = true;
            resolve({ ok: true, bytes: totalBytes });
          }
        });
      });
    });

    if (ingestResult.ok === false) {
      res.status(ingestResult.status).json({ error: ingestResult.error });
      return;
    }

    session.totalBytes = session.totalBytes - existingBytes + ingestResult.bytes;
    session.chapters.set(indexNum, { filename: assignedFilename, bytes: ingestResult.bytes });
    session.lastTouchedAt = Date.now();
    res.json({
      ok: true,
      index: indexNum,
      bytes: ingestResult.bytes,
      chapterCount: session.chapters.size,
    });
  });

  app.post('/api/render-session/:sessionId/finalize', mp4Limiter, async (req: Request, res: Response) => {
    const sessionId = typeof req.params.sessionId === 'string' ? req.params.sessionId : '';
    if (!SAFE_SESSION_ID_RE.test(sessionId)) {
      res.status(400).json({ error: 'Invalid render session ID.' });
      return;
    }
    const session = renderSessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Render session not found or expired.' });
      return;
    }
    if (session.finalizing) {
      res.status(409).json({ error: 'Render session is already finalizing.' });
      return;
    }
    if (session.chapters.size === 0) {
      res.status(400).json({ error: 'No chapters uploaded to stitch.' });
      return;
    }
    if (activeFfmpegJobs >= MAX_CONCURRENT_FFMPEG) {
      res.setHeader('Retry-After', '10');
      res.status(503).json({
        error: 'Video converter is busy with another export. Please retry in a few seconds.',
      });
      return;
    }

    session.finalizing = true;
    activeFfmpegJobs++;
    let streamedCleanupScheduled = false;

    try {
      const sortedIndices = Array.from(session.chapters.keys()).sort((a, b) => a - b);
      const listLines = sortedIndices.map((idx) => {
        const entry = session.chapters.get(idx)!;
        return `file '${entry.filename}'`;
      });
      const listFile = path.resolve(session.dir, 'chapters.txt');
      const outFile = path.resolve(session.dir, 'master_stitched.mp4');
      await fs.writeFile(listFile, `${listLines.join('\n')}\n`, 'utf8');

      await execFileAsync(
        'ffmpeg',
        [
          '-y',
          '-f',
          'concat',
          '-safe',
          '0',
          '-i',
          listFile,
          '-c:v',
          'libx264',
          '-preset',
          'fast',
          '-crf',
          '19',
          '-pix_fmt',
          'yuv420p',
          '-c:a',
          'aac',
          '-b:a',
          '192k',
          '-af',
          'loudnorm=I=-14:TP=-1.5:LRA=11',
          '-movflags',
          '+faststart',
          outFile,
        ],
        { timeout: 900_000, maxBuffer: 4 * 1024 * 1024 }
      );

      const rawName = typeof req.query.filename === 'string' ? req.query.filename : '';
      const safeName = /^[A-Za-z0-9_-]{1,64}$/.test(rawName)
        ? `${rawName}_full_youtube.mp4`
        : 'katha_longform_master.mp4';
      const stat = await fs.stat(outFile);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Length', String(stat.size));
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);

      streamedCleanupScheduled = true;
      await new Promise<void>((resolve, reject) => {
        const rs = createReadStream(outFile);
        const done = () => {
          cleanupRenderSession(sessionId);
          resolve();
        };
        rs.on('error', (err) => {
          cleanupRenderSession(sessionId);
          reject(err);
        });
        res.on('close', done);
        res.on('finish', done);
        rs.pipe(res);
      });
    } catch {
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Chapter stitching failed. Verify all chapters are valid WebM recordings and retry.',
        });
      }
    } finally {
      activeFfmpegJobs = Math.max(0, activeFfmpegJobs - 1);
      if (!streamedCleanupScheduled) {
        cleanupRenderSession(sessionId);
      }
    }
  });

  app.get('/api/render-session/:sessionId/status', chapterUploadLimiter, (req: Request, res: Response) => {
    sweepExpiredRenderSessions();
    const sessionId = typeof req.params.sessionId === 'string' ? req.params.sessionId : '';
    if (!SAFE_SESSION_ID_RE.test(sessionId)) {
      res.status(400).json({ error: 'Invalid render session ID.' });
      return;
    }
    const session = renderSessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Render session not found or expired.' });
      return;
    }
    session.lastTouchedAt = Date.now();
    const uploadedIndices = Array.from(session.chapters.keys()).sort((a, b) => a - b);
    res.json({
      sessionId: session.id,
      uploadedIndices,
      chapterCount: session.chapters.size,
      totalBytes: session.totalBytes,
      finalizing: session.finalizing,
      createdAt: session.createdAt,
      lastTouchedAt: session.lastTouchedAt,
    });
  });

  app.delete('/api/render-session/:sessionId', chapterUploadLimiter, (req: Request, res: Response) => {
    const sessionId = typeof req.params.sessionId === 'string' ? req.params.sessionId : '';
    if (!SAFE_SESSION_ID_RE.test(sessionId)) {
      res.status(400).json({ error: 'Invalid render session ID.' });
      return;
    }
    cleanupRenderSession(sessionId);
    res.json({ ok: true });
  });

  // =========================================================================
  // LONG-FORM MULTI-LANGUAGE AUDIO (MLA) CHAPTER STITCHER (/api/audio-session/*)
  // Streams ~3-minute WAV chapter chunks to disk and stitches into a single
  // -14 LUFS broadcast .M4A (AAC 192k) or .WAV audio track for YouTube MLA!
  // =========================================================================
  app.post('/api/audio-session/start', mp4Limiter, async (_req: Request, res: Response) => {
    sweepExpiredRenderSessions();
    const hasFfmpeg = await checkFfmpegAvailable();
    if (!hasFfmpeg) {
      res.status(501).json({
        error: 'FFmpeg is not installed on this server for long-form MLA audio stitching.',
      });
      return;
    }
    if (audioSessions.size >= MAX_AUDIO_SESSIONS) {
      res.setHeader('Retry-After', '10');
      res.status(503).json({
        error: 'Maximum concurrent audio stitch sessions active. Please retry shortly.',
      });
      return;
    }
    try {
      const sessionId = crypto.randomBytes(16).toString('hex');
      const tmpRoot = path.resolve(os.tmpdir());
      const sessionDir = await fs.mkdtemp(path.join(tmpRoot, `katha-audio-${sessionId.slice(0, 8)}-`));
      const now = Date.now();
      audioSessions.set(sessionId, {
        id: sessionId,
        dir: path.resolve(sessionDir),
        createdAt: now,
        lastTouchedAt: now,
        totalBytes: 0,
        finalizing: false,
        chapters: new Map(),
      });
      res.json({ sessionId, maxChunks: MAX_CHAPTERS_PER_SESSION });
    } catch {
      res.status(500).json({ error: 'Could not initialize audio stitch session.' });
    }
  });

  app.post('/api/audio-session/:sessionId/chunk', chapterUploadLimiter, async (req: Request, res: Response) => {
    const sessionId = typeof req.params.sessionId === 'string' ? req.params.sessionId : '';
    if (!SAFE_SESSION_ID_RE.test(sessionId)) {
      res.status(400).json({ error: 'Invalid audio session ID.' });
      return;
    }
    const session = audioSessions.get(sessionId);
    if (!session || session.finalizing) {
      res.status(404).json({ error: 'Audio session not found or already finalizing.' });
      return;
    }

    const indexNum = Number(req.query.index);
    if (!Number.isInteger(indexNum) || indexNum < 0 || indexNum >= MAX_CHAPTERS_PER_SESSION) {
      res.status(400).json({
        error: `Chunk index must be an integer between 0 and ${MAX_CHAPTERS_PER_SESSION - 1}.`,
      });
      return;
    }

    const assignedFilename = `chunk_${String(indexNum).padStart(2, '0')}.wav`;
    const baseDir = path.resolve(session.dir);
    const targetPath = path.resolve(baseDir, assignedFilename);
    if (!targetPath.startsWith(baseDir + path.sep)) {
      res.status(400).json({ error: 'Invalid audio chunk target.' });
      return;
    }

    session.lastTouchedAt = Date.now();
    const existingBytes = session.chapters.get(indexNum)?.bytes ?? 0;

    const ingestResult = await new Promise<{ ok: true; bytes: number } | { ok: false; status: number; error: string }>((resolve) => {
      const ws = createWriteStream(targetPath);
      const magicHead: Buffer[] = [];
      let magicChecked = false;
      let totalBytes = 0;
      let settled = false;

      const fail = (status: number, error: string) => {
        if (settled) return;
        settled = true;
        req.pause();
        ws.destroy();
        void fs.rm(targetPath, { force: true }).catch(() => {});
        resolve({ ok: false, status, error });
      };

      ws.on('error', () => fail(500, 'Failed writing temporary audio chunk.'));
      req.on('aborted', () => fail(499, 'Audio chunk upload aborted.'));
      req.on('error', () => fail(400, 'Audio chunk read failed.'));

      req.on('data', (chunk: Buffer) => {
        if (settled) return;
        totalBytes += chunk.length;
        if (totalBytes > MAX_AUDIO_CHUNK_BYTES) {
          fail(413, 'Audio chunk exceeds 80 MB limit.');
          return;
        }
        if (session.totalBytes - existingBytes + totalBytes > MAX_AUDIO_SESSION_BYTES) {
          fail(413, 'Total audio session exceeds 500 MB limit.');
          return;
        }
        if (!magicChecked) {
          magicHead.push(chunk);
          const joined = Buffer.concat(magicHead);
          if (joined.length >= 4) {
            magicChecked = true;
            if (!joined.subarray(0, 4).equals(RIFF_WAV_MAGIC)) {
              fail(400, 'Uploaded audio chunk must be a valid RIFF WAV stream.');
              return;
            }
          }
        }
        if (!ws.write(chunk)) {
          req.pause();
          ws.once('drain', () => {
            if (!settled) req.resume();
          });
        }
      });

      req.on('end', () => {
        if (settled) return;
        if (totalBytes < 44 || !magicChecked) {
          fail(400, 'Uploaded audio chunk must be a valid RIFF WAV stream.');
          return;
        }
        ws.end(() => {
          if (!settled) {
            settled = true;
            resolve({ ok: true, bytes: totalBytes });
          }
        });
      });
    });

    if (ingestResult.ok === false) {
      res.status(ingestResult.status).json({ error: ingestResult.error });
      return;
    }

    session.totalBytes = session.totalBytes - existingBytes + ingestResult.bytes;
    session.chapters.set(indexNum, { filename: assignedFilename, bytes: ingestResult.bytes });
    session.lastTouchedAt = Date.now();
    res.json({ ok: true, index: indexNum, bytes: ingestResult.bytes, chunkCount: session.chapters.size });
  });

  app.post('/api/audio-session/:sessionId/finalize', mp4Limiter, async (req: Request, res: Response) => {
    const sessionId = typeof req.params.sessionId === 'string' ? req.params.sessionId : '';
    if (!SAFE_SESSION_ID_RE.test(sessionId)) {
      res.status(400).json({ error: 'Invalid audio session ID.' });
      return;
    }
    const session = audioSessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Audio session not found or expired.' });
      return;
    }
    if (session.finalizing) {
      res.status(409).json({ error: 'Audio session is already finalizing.' });
      return;
    }
    if (session.chapters.size === 0) {
      res.status(400).json({ error: 'No audio chunks uploaded.' });
      return;
    }
    if (activeFfmpegJobs >= MAX_CONCURRENT_FFMPEG) {
      res.setHeader('Retry-After', '10');
      res.status(503).json({ error: 'Audio encoder is busy. Please retry shortly.' });
      return;
    }

    session.finalizing = true;
    activeFfmpegJobs++;
    let streamedCleanupScheduled = false;

    try {
      const fmt = req.query.format === 'wav' ? 'wav' : 'm4a';
      const sortedIndices = Array.from(session.chapters.keys()).sort((a, b) => a - b);
      const listLines = sortedIndices.map((idx) => `file '${session.chapters.get(idx)!.filename}'`);
      const listFile = path.resolve(session.dir, 'chunks.txt');
      const outFile = path.resolve(session.dir, fmt === 'wav' ? 'master_audio.wav' : 'master_audio.m4a');
      await fs.writeFile(listFile, `${listLines.join('\n')}\n`, 'utf8');

      const ffArgs =
        fmt === 'wav'
          ? [
              '-y',
              '-f',
              'concat',
              '-safe',
              '0',
              '-i',
              listFile,
              '-af',
              'loudnorm=I=-14:TP=-1.5:LRA=11',
              '-c:a',
              'pcm_s16le',
              '-ar',
              '44100',
              outFile,
            ]
          : [
              '-y',
              '-f',
              'concat',
              '-safe',
              '0',
              '-i',
              listFile,
              '-af',
              'loudnorm=I=-14:TP=-1.5:LRA=11',
              '-c:a',
              'aac',
              '-b:a',
              '192k',
              '-movflags',
              '+faststart',
              outFile,
            ];

      await execFileAsync('ffmpeg', ffArgs, { timeout: 300_000, maxBuffer: 4 * 1024 * 1024 });

      const rawName = typeof req.query.filename === 'string' ? req.query.filename : '';
      const safeName = /^[A-Za-z0-9_-]{1,64}$/.test(rawName)
        ? `${rawName}.${fmt}`
        : `katha_mla_audio.${fmt}`;
      const stat = await fs.stat(outFile);
      res.setHeader('Content-Type', fmt === 'wav' ? 'audio/wav' : 'audio/mp4');
      res.setHeader('Content-Length', String(stat.size));
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);

      streamedCleanupScheduled = true;
      await new Promise<void>((resolve, reject) => {
        const rs = createReadStream(outFile);
        const done = () => {
          cleanupAudioSession(sessionId);
          resolve();
        };
        rs.on('error', (err) => {
          cleanupAudioSession(sessionId);
          reject(err);
        });
        res.on('close', done);
        res.on('finish', done);
        rs.pipe(res);
      });
    } catch {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Long-form audio stitching failed.' });
      }
    } finally {
      activeFfmpegJobs = Math.max(0, activeFfmpegJobs - 1);
      if (!streamedCleanupScheduled) {
        cleanupAudioSession(sessionId);
      }
    }
  });

  app.delete('/api/audio-session/:sessionId', chapterUploadLimiter, (req: Request, res: Response) => {
    const sessionId = typeof req.params.sessionId === 'string' ? req.params.sessionId : '';
    if (!SAFE_SESSION_ID_RE.test(sessionId)) {
      res.status(400).json({ error: 'Invalid audio session ID.' });
      return;
    }
    cleanupAudioSession(sessionId);
    res.json({ ok: true });
  });

  // =========================================================================
  // HEADLESS EPISODE COMPILER & YPP/RETENTION AUDIT API (POST /api/episodes/compile)
  // Allows external LLM agents & automation pipelines to compile Lite JSON -> Full Episode!
  // =========================================================================
  app.post('/api/episodes/compile', apiLimiter, async (req: Request, res: Response) => {
    const tsxCli = path.resolve(__dirname, 'node_modules/tsx/dist/cli.mjs');
    const compilerScript = path.resolve(__dirname, 'scripts/compile-episode.ts');
    try {
      await Promise.all([fs.access(tsxCli), fs.access(compilerScript)]);
    } catch {
      res.status(501).json({
        error: 'Headless TypeScript compiler CLI is unavailable in this runtime. Run `npm run compile-episode` locally.',
      });
      return;
    }

    const body = req.body;
    if (!body || (typeof body !== 'object' && typeof body !== 'string')) {
      res.status(400).json({ error: 'Send a JSON episode object or { input, fixYpp, fixRetention } payload.' });
      return;
    }

    try {
      const payloadStr = JSON.stringify(body);
      if (payloadStr.length > 1_800_000) {
        res.status(413).json({ error: 'Episode payload exceeds 1.8 MB limit.' });
        return;
      }

      const childResult = await new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
        const child = spawn(process.execPath, [tsxCli, compilerScript, '--stdin'], {
          cwd: __dirname,
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        const outChunks: Buffer[] = [];
        const errChunks: Buffer[] = [];
        let outBytes = 0;
        let settled = false;

        const timer = setTimeout(() => {
          if (!settled) {
            settled = true;
            child.kill('SIGKILL');
            reject(new Error('Compiler timed out.'));
          }
        }, 15_000);

        child.stdout.on('data', (c: Buffer) => {
          outBytes += c.length;
          if (outBytes <= 6 * 1024 * 1024) outChunks.push(c);
        });
        child.stderr.on('data', (c: Buffer) => {
          if (errChunks.length < 32) errChunks.push(c);
        });
        child.on('error', (err) => {
          clearTimeout(timer);
          if (!settled) {
            settled = true;
            reject(err);
          }
        });
        child.on('close', (code) => {
          clearTimeout(timer);
          if (!settled) {
            settled = true;
            resolve({
              code,
              stdout: Buffer.concat(outChunks).toString('utf8'),
              stderr: Buffer.concat(errChunks).toString('utf8'),
            });
          }
        });

        child.stdin.write(payloadStr);
        child.stdin.end();
      });

      const parsed = JSON.parse(childResult.stdout || '{}') as Record<string, unknown>;
      if (childResult.code !== 0 || parsed.ok === false) {
        res.status(400).json({
          ok: false,
          error: typeof parsed.error === 'string' ? parsed.error : 'Episode compilation failed.',
        });
        return;
      }
      res.json(parsed);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message.slice(0, 200) : 'Headless compiler failed.',
      });
    }
  });

  // Configurable multi-provider server-side TTS proxy
  app.post('/api/tts', apiLimiter, async (req: Request, res: Response) => {
    try {
      const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<
        string,
        unknown
      >;
      const provider = typeof body.provider === 'string' ? body.provider : 'gemini';
      const text = typeof body.text === 'string' ? body.text.trim() : '';
      const voice = typeof body.voice === 'string' ? body.voice.trim().slice(0, 64) : '';
      const model = typeof body.model === 'string' ? body.model.trim().slice(0, 80) : '';
      const style = typeof body.style === 'string' ? body.style.trim().slice(0, 180) : '';
      const rawLang = typeof body.language === 'string' ? body.language.trim() : '';
      const language = SAFE_LANG_RE.test(rawLang) ? rawLang : '';
      const langBase = language ? language.split('-')[0] : '';
      const speedRaw = Number(body.speed);
      const speed = Number.isFinite(speedRaw) ? Math.max(0.6, Math.min(1.6, speedRaw)) : 1.0;

      if (!text || text.length > 1200) {
        res.status(400).json({ error: 'Dialogue text must be between 1 and 1200 characters.' });
        return;
      }

      const effectiveStyle =
        language && langBase !== 'en'
          ? `${style ? `${style}. ` : ''}Speak natively in language locale ${language}.`.slice(0, 220)
          : style;

      if (provider === 'gemini') {
        const ai = getGeminiClient();
        if (!ai) {
          res.status(400).json({
            error: 'GEMINI_API_KEY is not configured in Settings -> Secrets.',
          });
          return;
        }
        const chosenVoice = ALLOWED_GEMINI_VOICES.has(voice) ? voice : 'Charon';
        const primaryModel = ALLOWED_GEMINI_TTS_MODELS.has(model)
          ? model
          : 'gemini-3.8-flash-lite-tts';
        const cacheKey = makeTtsCacheKey({
          provider,
          model: primaryModel,
          voice: chosenVoice,
          style: effectiveStyle,
          language,
          speed,
          text,
        });
        const cached = getCachedTtsAudio(cacheKey);
        if (cached) {
          res.setHeader('Content-Type', cached.contentType);
          res.setHeader('X-TTS-Cache', 'HIT');
          res.send(cached.buf);
          return;
        }
        const ttsCandidates = uniqueModels([primaryModel, 'gemini-2.5-flash-preview-tts']);

        const part: Record<string, unknown> = { text };
        if (effectiveStyle) {
          part.speechMetadata = { style: effectiveStyle };
        }

        let lastErr: unknown = null;
        for (const chosenModel of ttsCandidates) {
          try {
            const response = await ai.models.generateContent({
              model: chosenModel,
              contents: [{ role: 'user', parts: [part] }],
              config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: chosenVoice },
                  },
                },
              },
            });
            const base64Audio =
              response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!base64Audio) {
              res.status(502).json({ error: 'Gemini TTS returned no audio data.' });
              return;
            }
            const wavBuf = Buffer.from(base64Audio, 'base64');
            putCachedTtsAudio(cacheKey, wavBuf, 'audio/wav');
            res.setHeader('Content-Type', 'audio/wav');
            res.setHeader('X-TTS-Cache', 'MISS');
            res.send(wavBuf);
            return;
          } catch (err) {
            lastErr = err;
            const msg = err instanceof Error ? err.message : String(err);
            if (!/404|not found|model/i.test(msg)) break;
          }
        }
        throw lastErr instanceof Error ? lastErr : new Error('Gemini TTS failed.');
      }

      if (provider === 'openai') {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          res.status(400).json({
            error: 'OPENAI_API_KEY is not configured in Settings -> Secrets.',
          });
          return;
        }
        const chosenModel = SAFE_MODEL_RE.test(model) ? model : 'gpt-4o-mini-tts';
        const chosenVoice = SAFE_VOICE_RE.test(voice) ? voice : 'onyx';
        const cacheKey = makeTtsCacheKey({
          provider,
          model: chosenModel,
          voice: chosenVoice,
          style: effectiveStyle,
          language,
          speed,
          text,
        });
        const cached = getCachedTtsAudio(cacheKey);
        if (cached) {
          res.setHeader('Content-Type', cached.contentType);
          res.setHeader('X-TTS-Cache', 'HIT');
          res.send(cached.buf);
          return;
        }
        const upstream = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          signal: AbortSignal.timeout(UPSTREAM_FETCH_TIMEOUT_MS),
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: chosenModel,
            input: text,
            voice: chosenVoice,
            speed,
            ...(effectiveStyle && chosenModel.includes('4o-mini-tts')
              ? { instructions: effectiveStyle }
              : {}),
          }),
        });
        if (!upstream.ok) {
          res.status(upstream.status).json({ error: `OpenAI TTS returned HTTP ${upstream.status}.` });
          return;
        }
        const contentType = upstream.headers.get('content-type') || 'audio/mpeg';
        const audioBuf = Buffer.from(await upstream.arrayBuffer());
        putCachedTtsAudio(cacheKey, audioBuf, contentType);
        res.setHeader('Content-Type', contentType);
        res.setHeader('X-TTS-Cache', 'MISS');
        res.send(audioBuf);
        return;
      }

      if (provider === 'elevenlabs') {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
          res.status(400).json({
            error: 'ELEVENLABS_API_KEY is not configured in Settings -> Secrets.',
          });
          return;
        }
        const safeVoiceId = /^[A-Za-z0-9_-]{8,64}$/.test(voice) ? voice : 'JBFqnCBsd6RMkjVDRZzb';
        const chosenModel = SAFE_MODEL_RE.test(model) ? model : 'eleven_multilingual_v2';
        const cacheKey = makeTtsCacheKey({
          provider,
          model: chosenModel,
          voice: safeVoiceId,
          style: '',
          language: langBase,
          speed: 1,
          text,
        });
        const cached = getCachedTtsAudio(cacheKey);
        if (cached) {
          res.setHeader('Content-Type', cached.contentType);
          res.setHeader('X-TTS-Cache', 'HIT');
          res.send(cached.buf);
          return;
        }
        const upstream = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(safeVoiceId)}`,
          {
            method: 'POST',
            signal: AbortSignal.timeout(UPSTREAM_FETCH_TIMEOUT_MS),
            headers: {
              'xi-api-key': apiKey,
              'Content-Type': 'application/json',
              Accept: 'audio/mpeg',
            },
            body: JSON.stringify({
              text,
              model_id: chosenModel,
              ...(langBase && chosenModel.includes('multilingual')
                ? { language_code: langBase }
                : {}),
            }),
          }
        );
        if (!upstream.ok) {
          res.status(upstream.status).json({ error: `ElevenLabs TTS returned HTTP ${upstream.status}.` });
          return;
        }
        const audioBuf = Buffer.from(await upstream.arrayBuffer());
        putCachedTtsAudio(cacheKey, audioBuf, 'audio/mpeg');
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('X-TTS-Cache', 'MISS');
        res.send(audioBuf);
        return;
      }

      if (provider === 'custom_server') {
        const customUrl = isValidExternalHttpUrl(process.env.CUSTOM_TTS_URL);
        if (!customUrl) {
          res.status(400).json({
            error: 'CUSTOM_TTS_URL is not configured in server environment secrets.',
          });
          return;
        }
        const chosenModel = SAFE_MODEL_RE.test(model) ? model : 'tts-1';
        const chosenVoice = SAFE_VOICE_RE.test(voice) ? voice : 'alloy';
        const cacheKey = makeTtsCacheKey({
          provider,
          model: chosenModel,
          voice: chosenVoice,
          style: '',
          language,
          speed,
          text,
        });
        const cached = getCachedTtsAudio(cacheKey);
        if (cached) {
          res.setHeader('Content-Type', cached.contentType);
          res.setHeader('X-TTS-Cache', 'HIT');
          res.send(cached.buf);
          return;
        }
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (process.env.CUSTOM_TTS_API_KEY) {
          headers.Authorization = `Bearer ${process.env.CUSTOM_TTS_API_KEY}`;
        }
        const upstream = await fetch(customUrl, {
          method: 'POST',
          redirect: 'error',
          signal: AbortSignal.timeout(UPSTREAM_FETCH_TIMEOUT_MS),
          headers,
          body: JSON.stringify({
            model: chosenModel,
            input: text,
            voice: chosenVoice,
            speed,
            ...(language ? { language } : {}),
          }),
        });
        if (!upstream.ok) {
          res
            .status(upstream.status)
            .json({ error: `Custom TTS server returned HTTP ${upstream.status}.` });
          return;
        }
        const contentType = upstream.headers.get('content-type') || 'audio/mpeg';
        const audioBuf = Buffer.from(await upstream.arrayBuffer());
        putCachedTtsAudio(cacheKey, audioBuf, contentType);
        res.setHeader('Content-Type', contentType);
        res.setHeader('X-TTS-Cache', 'MISS');
        res.send(audioBuf);
        return;
      }

      res.status(400).json({ error: `Unsupported TTS provider: ${provider}` });
    } catch (err) {
      if (isAbortTimeoutError(err)) {
        res.status(504).json({ error: 'Upstream TTS provider timed out. Please retry.' });
        return;
      }
      res.status(500).json({ error: 'TTS synthesis failed. Please retry.' });
    }
  });

  // Final Express error guard so malformed payloads never leak stack traces
  app.use((_err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Unexpected server error.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Katha Studio server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
