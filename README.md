# Stagecraft Studio

**Deterministic 2D Multi-Genre Animation, Storytelling & Broadcast Production Engine**

Stagecraft Studio is a hybrid Cloud + Local PC 2D animation engine built with React, TypeScript, HTML5 Canvas 2D, WebAudio, Express, and FFmpeg. Direct Shorts (`9:16`) and Long-Form episodes (`16:9`, 8–30+ minutes) from structured JSON storyboards — across anime, explainers, sci-fi, mystery, children's storybooks, history, and world folklore — with zero external render farm dependencies.

---

## Highlights

- **20 Multi-Genre Deterministic Art Engines** (4 genre families, zero asset duplication):
  - **Editorial, Anime & Explainers**: *Chiaroscuro 2D Graphic Novel*, *Anime Cel & Sakuga Shaded*, *Blueprint Technical Cyanotype*, *Lineless Geometric Vector*, *Gouache Matte Storybook*
  - **Tactile & Handcrafted**: *Stitched Felt Puppet Theatre*, *Risograph Halftone Print*, *2.5D Paper-Craft Diorama*, *Backlit Sand Art Lightbox*, *Woodblock & Linocut Print*
  - **Mystery, Manga & Sci-Fi**: *Manga Screentone & G-Pen Ink*, *Neon Cybernoir*, *Scratchboard Noir Engraving*, *Tholu Shadow Puppetry*, *Sumi-e Ink Wash Scroll*
  - **World Heritage & Epics**: *Byzantine Gold & Art Nouveau Mosaic*, *Stained Glass Cloisonné*, *Illuminated Medieval Codex*, *Kente & Ndebele Tapestry*, *Greek Amphora Terracotta*
- **4-Mode Motion Cadence Control**: Switch per-episode between `Auto` (style-native cadence), `60fps` (ultra-smooth), `24fps` (cinema on-ones), and `12fps` (hand-drawn on-twos), paired with velocity-driven tapered motion arcs and deterministic lamp/neon flicker.
- **Modular Character DNA & 2-Bone Kinematics**: 40 built-in archetypes plus a procedural DNA workshop (morph sliders, headgear, marks, palette, wardrobe) with 6-shape phoneme lip-sync, 12-principles pose curves, and live wrist-anchored props.
- **19-Language Typography & Dubbing**: Script-aware Noto font stacks (Latin, Devanagari/Indic, RTL Arabic/Urdu, CJK), word-by-word kinetic karaoke captions, and multi-language audio (MLA) packaging.
- **Broadcast MP4 & Channel Growth Suite**: In-browser offline fast rendering, FFmpeg H.264/AAC `-14 LUFS` EBU R128 loudness normalization, Shorts Slicer, A/B/C Thumbnail Studio, Retention Auditor, YPP Monetization Shield, and portable `.katha` project archives.
- **Hybrid Workflow**: Prototype and direct interactively in the browser (AI Studio / Cloud Run / localhost) and batch-render or stitch 20-minute long-form masters on your local PC with hardware GPU encoding (`h264_nvenc`, `h264_amf`, `h264_videotoolbox`, or software `libx264`).

---

## Quick Start (Local Development)

**Prerequisites**: Node.js 20+ (Node 22 recommended) and optional `ffmpeg` on `PATH` for MP4 transcoding/stitching.

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`.

### Optional API Keys (`.env`)
Stagecraft Studio runs locally with **zero cloud keys** (using built-in procedural music, browser speech / mic recording / uploaded WAV/MP3 voiceovers, or local Ollama/Kokoro/Piper). To enable server-side AI scripting, translation, or cloud voices, add any combination to `.env`:

- `GEMINI_API_KEY` — Gemini TTS, AI Episode Director & Multi-Language Translator
- `OPENAI_API_KEY` — OpenAI TTS & GPT Director
- `ANTHROPIC_API_KEY` — Claude AI Director
- `ELEVENLABS_API_KEY` — ElevenLabs Voice Studio
- `CUSTOM_LLM_URL` / `CUSTOM_LLM_API_KEY` — OpenAI-compatible LLM server (OpenRouter, Groq, vLLM)
- `CUSTOM_TTS_URL` / `CUSTOM_TTS_API_KEY` — Self-hosted OpenAI-compatible TTS server

---

## Local PC Batch Rendering & Optional `shorts-exp` Bridge

Batch-generate YouTube `.srt` captions, launch packs, and broadcast `-14 LUFS` 1080p60 MP4s from exported episode JSONs:

```bash
# Validate episode scripts
node scripts/render-batch.mjs ./episodes/*.json --validate

# Export SRT + Launch Pack + hardware-accelerated MP4 (auto-detects NVENC / AMF / VideoToolbox -> libx264)
node scripts/render-batch.mjs ./episodes/*.json --out ./renders --webm-dir ./recordings --encoder auto

# Stitch multiple long-form chapters into one seamless master MP4
node scripts/render-batch.mjs ch01.webm ch02.webm ch03.webm --concat ./renders/full_episode.mp4 --encoder auto
```

### Optional `shorts-exp` QA Bridge
If you keep a sibling checkout of [`shorts-exp`](https://github.com/fantasiefoxie/shorts-exp) on your local PC, you can opt in to automatic post-render MP4 QA via `--shorts-exp-dir` (or `SHORTS_EXP_DIR` in `.env`):

```bash
node scripts/render-batch.mjs ./episodes/ep01.json --out ./renders --shorts-exp-dir ../shorts-exp
```

---

## Verification Commands

```bash
npm run lint    # Strict TypeScript type-check (tsc --noEmit)
npm test        # Automated regression suite (scripts/run-tests.ts)
npm run build   # Production Vite bundle check
```

---

## First Push to GitHub (`fantasiefoxie/stagecraft-studio`)

This repository enforces a **zero-rendered-binaries** policy via `.gitignore` (`renders/`, `out/`, `*.mp4`, `*.webm`, `*.wav`, `*.zip`, `*.katha` are ignored so the repo stays fast and lightweight).

```bash
git init -b main
git add .
git commit -m "feat: initialize Stagecraft Studio with 20 art engines, motion cadence, and CI"
git remote add origin https://github.com/fantasiefoxie/stagecraft-studio.git
git push -u origin main
```
