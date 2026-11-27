# Stagecraft Studio — 10-Feature Upgrade Pack Manifest

This manifest documents the modular 10-feature Upgrade Pack added to **Stagecraft Studio**. Every new module is deterministic, zero-dependency, 100% backward-compatible with existing episode JSON, Project Vault entries, and `.katha` archives, and adheres to all engineering invariants in `AGENTS.md`.

---

## 1. Added Files (11)

| # | File | Upgrade | Purpose |
|---|------|---------|---------|
| 1 | `src/studio/loudnessMeter.ts` | Upgrade 1 | Pure TypeScript ITU-R BS.1770-4 / EBU R128 K-weighting filter, gated integrated LUFS meter, 4× Catmull-Rom cubic true-peak estimator, and `-14.0 LUFS` / `-1.5 dBTP` soft-clip PCM & `AudioBuffer` normalizer. |
| 2 | `src/studio/spatialAudio.ts` | Upgrade 2 | Deterministic stereo panning (`-0.28` left, `0` center/narrator, `+0.28` right), 30-stage room acoustic profile map (`temple_reverb`, `cave_slapback`, `palace_hall`, `canyon_echo`, `wood_interior`, `dry_outdoor`), LCG-seeded stereo convolution impulse generator, and `StereoPannerNode` + `ConvolverNode` audio route builder. |
| 3 | `src/studio/depthOfField.ts` | Upgrade 3 | Zero-allocation pooled-buffer 2.5D multi-plane depth-of-field helper applying deterministic bilinear pyramid backdrop defocus on `closeup_left`, `closeup_right`, `prop_spotlight`, and speaker rack-focus on `two_shot` across all 20 art engines. |
| 4 | `src/studio/actingMacros.ts` | Upgrade 4 | 12 deterministic multi-frame character acting & choreography macros generating frame-locked `expressionCues[]`, `actionCues[]`, and matched `sfx`/`sfxOffsetSec` scaled to `beat.duration * STUDIO_FPS`. |
| 5 | `src/studio/continuityAuditor.ts` | Upgrade 5 | Deterministic Director's Continuity & Pacing Auditor + 1-click auto-fixer detecting 180° eye-line/axis flips, 3+ identical shot streaks, >16s flat pacing stretches, script-aware reading-speed mismatches (Latin, Indic/Devanagari, CJK), and missing on-stage speakers. |
| 6 | `src/studio/proceduralFoley.ts` | Upgrade 6 | Deterministic WebAudio foley event planner & synthesizer generating stride footsteps (`walk`/`enter_left`/`enter_right`/`cross_stage`/`step_forward`), cloth/air whooshes (`attack`/`leap_arc`), distant `thunder_rumble` (`rain`), and `ember_crackle` (`embers`). |
| 7 | `src/studio/cameraKeyframes.ts` | Upgrade 7 | Pure deterministic per-beat camera keyframe spline evaluator supporting `linear`, `ease_in_out`, and `overshoot` easing curves plus built-in cinematic curve presets. |
| 8 | `src/studio/CameraCurveMiniEditor.tsx` | Upgrade 7 UI | Compact interactive SVG curve/keyframe editor (click to add, drag nodes, per-keyframe zoom/panX/panY/ease sliders, quick presets, clear). |
| 9 | `src/studio/dubSyncPackager.ts` | Upgrade 8 | Multi-language dub timing lock planner clamping per-beat TTS speech rates strictly to `0.85x..1.25x`, plus synced `.SRT`, WebVTT (`.VTT` with `<v Speaker>` tags), YouTube chapters, `mla_track_manifest.json`, and downloadable ZIP packager. |
| 10 | `src/studio/lookPresets.ts` | Upgrade 9 | Custom "Look Lab" series recipe store (`localStorage` persistence, create/duplicate/sanitize/merge, JSON import/export). |
| 11 | `scripts/determinism-audit.mjs` | Upgrade 10 | Standalone Node ESM + Playwright CLI driving `window.__STAGECRAFT_HEADLESS__` across all 20 `RenderStyleId` engines, hashing repeated fixed frames with SHA-256 for 100% bit-exact determinism, auditing luminance/color health, benchmarking avg/max ms/frame, and writing JSON + Markdown reports (using safe `spawn` argument arrays; no PNGs written). |

---

## 2. Modified Files (13)

| # | File | Hook-In Summary |
|---|------|-----------------|
| 1 | `src/studio/types.ts` | Added optional `depthOfField`, `spatialAudio` on `EpisodeVisualStyle` and `cameraKeyframes` (`CameraKeyframe[]`, `CameraKeyframeEase`) on `StoryBeat` with safe defaults in `DEFAULT_VISUAL_STYLE` / `resolveVisualStyle` and clamping in `validateEpisodeScript`. |
| 2 | `src/studio/renderer.ts` | Hooked `computeBeatDepthOfFieldSpec` + `applyPooledBackdropDof` into `drawBackdrop` (with DoF cache key tag) and `composeCameraWithKeyframes` into shot camera composition (bypassing static backdrop cache when splines exist). |
| 3 | `src/studio/audioEngine.ts` | Wired `spatialAudio` panning/reverb routing and `proceduralFoley` stride/weather synthesis into both `renderEpisodeAudioOffline` and live `KathaAudioEngine` playback (`setSpatialAudio`, `firedFoleyIndices`). |
| 4 | `src/studio/offlineRenderer.ts` | Added `normalizeLufs` (default `true`) and `spatialAudio` options to `FastRenderOptions`, ran `normalizeAudioBufferLufs` (`-14 LUFS`, `-1.5 dBTP`) before WAV/Opus encoding, and returned `loudnessMetrics` on `FastRenderResult`. |
| 5 | `src/studio/kathaArchive.ts` | Added optional `lookRecipes?: LookLabRecipe[]` to `.katha` bundle/manifest serialization and parsing with strict sanitization and backward compatibility. |
| 6 | `src/studio/FastRenderModal.tsx` | Added `-14 LUFS Normalize` and `Spatial Audio` toggles plus measured Integrated LUFS, applied gain dB, and True Peak dBTP readout badge upon render completion. |
| 7 | `src/studio/BeatMotionAndCuesEditor.tsx` | Added 1-click "Apply Acting Macro (12 Presets)" picker and embedded `<CameraCurveMiniEditor />` for per-beat camera splines. |
| 8 | `src/studio/StoryboardQaModal.tsx` | Integrated Director's Continuity & Pacing Auditor score, clickable beat diagnostics, and 1-click "Fix Continuity" button alongside Visual QA. |
| 9 | `src/studio/WorkbenchLookTab.tsx` | Added 2.5D Depth of Field (`depthOfField`) slider, Stereo Spatial Audio (`spatialAudio`) toggle, and compact "Saved Looks" recipe bar (Save, Apply, Duplicate, Delete, Import/Export JSON). |
| 10 | `src/studio/ChannelGrowthModal.tsx` | Applied `computeDubTimingPlan` per-beat `speechRate` (`0.85x..1.25x`) during MLA Auto-Dubbing and added Dub Timing & Track Export controls (`.SRT`, `.VTT`, Chapters, MLA Manifest ZIP) in the `localize` tab. |
| 11 | `src/App.tsx` | Synced `episode.visualStyle?.spatialAudio` into `audioRef.current.setSpatialAudio(...)` and embedded/merged `lookRecipes` during `.katha` archive export/import. |
| 12 | `src/studio/zipBuilder.ts` | Added `?raw` imports and bundle entries for all 11 new files so Test 8 (`zipBuilder.ts Completeness Audit`) remains 100% synced. |
| 13 | `scripts/run-tests.ts` | Added regression Tests 17–26 covering Upgrades 1–10 (26 total tests). |

---

## 3. New Optional Schema Fields (100% Backward Compatible)

### `EpisodeVisualStyle` (`src/studio/types.ts`)
- **`depthOfField?: number`**
  - **Default**: `0.35` (in `DEFAULT_VISUAL_STYLE` and `resolveVisualStyle`)
  - **Validation / Clamping**: Finite numbers clamped to `[0, 1]` in `validateEpisodeScript`.
- **`spatialAudio?: boolean`**
  - **Default**: `true` (in `DEFAULT_VISUAL_STYLE` and `resolveVisualStyle`)
  - **Validation**: Boolean flag; omitted or non-boolean values safely fall back to `true`.

### `StoryBeat` (`src/studio/types.ts`)
- **`cameraKeyframes?: CameraKeyframe[]`**
  - **Shape**: `{ atFrac: number; zoom: number; panX: number; panY: number; ease?: 'linear' | 'ease_in_out' | 'overshoot' }`
  - **Default**: `undefined` (falls back seamlessly to `beat.cameraMove` + speaker auto-framing)
  - **Validation / Clamping**: Sorted ascending by `atFrac`, clamped to `atFrac ∈ [0, 1]`, `zoom ∈ [0.7, 2.2]`, `panX ∈ [-0.45, 0.45]`, `panY ∈ [-0.35, 0.35]`, and `ease` validated to `'linear' | 'ease_in_out' | 'overshoot'`.

### `KathaProjectBundle` / `KathaManifestFile` (`src/studio/kathaArchive.ts`)
- **`lookRecipes?: LookLabRecipe[]`**
  - **Default**: `undefined` (legacy `.katha` archives without `lookRecipes` import cleanly with zero migration needed).

---

## 4. Verification Results

All mandatory verification gates passed cleanly:

- **`npm run lint` (`tsc --noEmit`)**: PASS — 0 TypeScript errors.
- **`npm test` (`tsx scripts/run-tests.ts`)**: PASS — **26/26 passed, 0 failed** (includes Test 8 `zipBuilder.ts` completeness audit and new Tests 17–26 for Upgrades 1–10).
- **`npm run build` (`vite build`)**: PASS — `✓ built in 1.21s` (`1819 modules transformed`).
- **`node --check scripts/render-batch.mjs && node --check scripts/determinism-audit.mjs`**: PASS — exit code 0.
