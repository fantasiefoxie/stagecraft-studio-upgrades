# Stagecraft Studio — AI Agent Operations Contract

This file defines non-negotiable engineering invariants for any AI coding agent or contributor working in this repository.

## 1. Architecture Overview
- **Runtime**: React 19 + TypeScript + Vite 6 SPA served by Express (`server.ts`, port `3000`).
- **Rendering Core**: Deterministic 100% pure-function HTML5 Canvas 2D compositor (`src/studio/renderer.ts`, `src/studio/styleEngines.ts`, `src/studio/animationEngine.ts`, `src/studio/renderAssets*.ts`, `src/studio/modularEntityRenderer.ts`).
- **Audio Core**: Procedural WebAudio score & SFX engine (`src/studio/audioEngine.ts`) + optional server-side TTS proxies in `server.ts`.
- **Offline Batch CLI**: Standalone Node ESM script (`scripts/render-batch.mjs`) using `execFileSync` (FFmpeg) with optional sibling `shorts-exp` QA hook.

## 2. Hard Invariants
1. **Zero Rendered Binaries in Git**: Never commit `.mp4`, `.webm`, `.mov`, `.wav`, `.m4a`, `.mp3`, `.zip`, `.katha`, or files inside `renders/`, `out/`, `tmp/`, or `artifacts/`. Keep the repo pure source code.
2. **Zero Per-Frame Canvas Allocations**: In `src/studio/styleEngines.ts` and `src/studio/renderer.ts`, reuse pooled offscreen buffers (`getLayer`) and pre-baked static seeded pattern tiles. Never allocate new canvases or run random `Math.random()` inside frame render loops — every frame must be a deterministic function of `(episode, time, style)`.
3. **Zero Asset Duplication Across Art Engines**: All 20 `RenderStyleId` engines operate through `createStyledContext` + `composeStyledScene` + `STYLE_GRAMMARS`. Do not fork character or stage drawers per art style.
4. **Backward Compatibility**: Never break existing episode JSON schemas, saved Vault projects, or `.katha` archives. New visual style fields (like `motionCadence`) must have safe defaults in `DEFAULT_VISUAL_STYLE` and `resolveVisualStyle`.
5. **Security & Subprocess Safety**:
   - Keep all API keys strictly server-side in `process.env` (`server.ts`). Never expose secrets in `VITE_*` variables or client bundles.
   - All subprocess calls (`ffmpeg`, optional Python QA hook in `scripts/render-batch.mjs`) must use `execFileSync` / `spawn` with explicit argument arrays and validated resolved paths — never shell string interpolation (`exec`).
6. **AI Studio Hosting Constraint**: Do not rename `metadata.json` or break port `3000` dev/start server binding.
7. **Source Bundle Sync**: Whenever adding or removing a `.ts`/`.tsx` module in `src/studio/` or a script in `scripts/`, update `src/studio/zipBuilder.ts` so Test 8 (`zipBuilder.ts Completeness Audit`) remains green.

## 3. Mandatory Verification Gate
Before finishing any code change or opening a PR, all three checks must pass cleanly:

```bash
npm run lint   # tsc --noEmit
npm test       # scripts/run-tests.ts regression suite
npm run build  # vite build
```
