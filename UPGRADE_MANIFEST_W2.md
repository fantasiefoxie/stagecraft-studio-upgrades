# Stagecraft Studio — Wave 2 Upgrade Manifest (Upgrades 11–20)

This manifest documents all modules, hook-ins, optional backward-compatible schema extensions, and verified quality checks delivered in **Wave 2 (Upgrades 11–20)**.

---

## 1. Added Modules (13 New Files)

| # | File | Upgrade | Purpose |
|---|------|---------|---------|
| 11 | `src/studio/volumetricLighting.ts` | Volumetric Light Shafts & Stage Rim Atmosphere | Pure deterministic volumetric god-rays, moonlight shafts, window sunbeams, hearth glow pools, and drifting dust motes keyed to `stage`, `mood`, `lightSide`, and `lightShafts` (zero canvas allocations, zero `Math.random()`). |
| 12 | `src/studio/propPhysics.ts` | Deterministic Prop Physics & Follow-Through Arcs | Deterministic secondary motion (`offsetX`, `offsetY`, `rotationRad`, `scalePulse`, `glowBoost`) for mystic levitation, damped pendulum carry, kinetic weapon swings, and beat-entry settle overshoot. |
| 13 | `src/studio/kineticCaptions.ts` | Expressive Kinetic Captions & Speaker-Colored Emphasis | Pure token parser detecting ALL-CAPS, `*emphasized*`, and `!`/`?` punch words with 12-Principles squash-overshoot pop transforms and speaker-colored cast accents. |
| 14 | `src/studio/musicTension.ts` | Episode Harmonic Tension Arc & Beat Music Crossfades | 3-act deterministic harmonic tension planner computing `octaveLift`, `phraseDensity`, `percussionEmphasis`, and smooth raag/mood beat-boundary crossfade ramps. |
| 15a | `src/studio/teleprompterUtils.ts` | Voiceover Booth Teleprompter Utilities | Pure cue-sheet builder, pacing evaluator (`short` / `on_target` / `long`), countdown progress math, and WAV take filename formatter. |
| 15b | `src/studio/TeleprompterModal.tsx` | Voiceover Booth Teleprompter & Multi-Take Recorder | Full-screen studio booth modal with large active dialogue, next-line preview, beat timer bar, 3-2-1 countdown, multi-take recording, live waveform preview, and 1-click "Assign Best Take". |
| 16 | `src/studio/pacingAnalyzer.ts` | Retention & Pacing Heatmap + Boost Flat Beats | Per-beat visual/audio retention scorer (`0..100`), `>12s` drop-off detector, and 1-click `boostFlatBeats()` director pass strictly preserving beat durations and dialogue. |
| 17 | `src/studio/lowerThirds.ts` | Animated Location & Time-Jump Lower-Third Banners | Pure deterministic lower-third timing/easing (`scroll_ribbon`, `minimal_slate`, `cinematic_bar`), canvas renderer (zero allocations), and 1-click stage-change auto-tagger. |
| 18a | `src/studio/episodeDiff.ts` | Episode Diff & Selective Beat Snapshot Restore | Pure diff engine classifying added/removed/modified/reordered beats, duration delta, and visualStyle changes, plus `restoreSingleBeatFromCheckpoint()`. |
| 18b | `src/studio/VersionDiffModal.tsx` | History Version Compare Modal | Side-by-side checkpoint diff viewer with field-level badges and 1-click per-beat cherry-pick restore. |
| 19a | `src/studio/studioShortcuts.ts` | Command Palette Registry & NLE Shortcut Guard | Fuzzy command palette indexer (scenes, all 20 art engines, 12 acting macros, modals, actions), shortcut catalog, and `isEditableEventTarget()` input guard. |
| 19b | `src/studio/CommandPaletteModal.tsx` | Command Palette (`Ctrl/Cmd+K`) UI | Keyboard-first command palette modal with arrow-key navigation, category badges, and shortcut cheatsheet footer. |
| 20 | `scripts/studio-stress-test.mjs` | Automated Fuzzing & Edge-Case Stress Test CLI | Deterministic seeded Mulberry32 PRNG CLI running 230 adversarial edge cases (including 150-beat epics, Unicode/RTL/CJK/Devanagari, malformed payloads, and ZIP traversal attacks) across 9 core studio APIs. |

---

## 2. Modified Files (11 Surgical Hook-Ins)

1. `src/studio/types.ts` — Added optional `EpisodeVisualStyle.lightShafts` (default `0.4`), `CaptionStyleId` values `'comic_speech_pop' | 'minimal_editorial'`, and `StoryBeat.locationCard` with clamping/sanitization in `resolveVisualStyle` and `validateEpisodeScript`.
2. `src/studio/renderer.ts` — Hooked `drawVolumetricLightShafts`, `computePropPhysics`, `parseEmphasisTokens`/`computeKineticWordPop`/`resolveSpeakerAccentColor` (+ 2 new caption styles), and `drawLocationLowerThird` uniformly across all 20 art engines.
3. `src/studio/audioEngine.ts` — Wired `computeEpisodeMusicArc` and `computeBoundaryCrossfadeGain` (`octaveLift`, `phraseDensity`, `percussionEmphasis`, crossfade ramps) into both live `KathaAudioEngine` and offline `renderEpisodeAudioOffline`.
4. `src/studio/WorkbenchLookTab.tsx` — Added compact `Volumetric Light Shafts & Dust Motes` slider (`0%..100%`) under `2.5D Depth of Field`.
5. `src/studio/VoiceStudioPanel.tsx` — Added `Voice Booth` header button launching `TeleprompterModal`.
6. `src/studio/StoryboardTimelineStrip.tsx` — Added toggleable `Retention` score pill, clickable pacing sparkline bar, and 1-click `Boost Flat Beats` action.
7. `src/studio/BeatMotionAndCuesEditor.tsx` — Added compact `Location / Time-Jump Banner` editor and 1-click `Auto-Tag Stage Changes` button.
8. `src/studio/WorkbenchBeatInspector.tsx` — Threaded optional `onAutoTagStageChanges` callback to `BeatMotionAndCuesEditor`.
9. `src/App.tsx` — Wired `setEpisodeMusicArc` sync, `handleBoostFlatBeats`, `handleAutoTagStageChanges`, `handleRestoreSingleBeat`, `Ctrl/Cmd+K` Command Palette + top-bar `⌘K` trigger, input-safe NLE shortcuts (`J`/`K`/`L`, `[`/`]`, `G`, `O`, `M`, `Shift+S`, `Shift+M`), History `Compare` -> `VersionDiffModal`, and `TeleprompterModal`.
10. `src/studio/zipBuilder.ts` — Synced `?raw` imports and ZIP manifest entries for all 13 new Wave 2 source files so Test 8 remains 100% green.
11. `scripts/run-tests.ts` — Added Tests 27–36 covering every Wave 2 upgrade (36 total tests).

---

## 3. New Optional Schema Fields (100% Backward Compatible)

- `EpisodeVisualStyle.lightShafts?: number` — Range `0..1`, default `0.4` in `DEFAULT_VISUAL_STYLE` / `resolveVisualStyle`, clamped in `validateEpisodeScript`.
- `CaptionStyleId` — Extended with `'comic_speech_pop' | 'minimal_editorial'` (added to `CAPTION_STYLE_CATALOG` and accepted by `validateEpisodeScript`).
- `StoryBeat.locationCard?: { title: string; subtitle?: string; position?: 'top_left' | 'bottom_left'; style?: 'scroll_ribbon' | 'minimal_slate' | 'cinematic_bar' }` — Optional per-beat lower-third banner sanitized in `validateEpisodeScript` (empty-title cards stripped cleanly).

---

## 4. Verification Gate Results

All required checks passed cleanly with zero errors and zero rendered binaries in the repository:

```text
$ npm run lint
> tsc --noEmit
(exit 0 — 0 errors)

$ npm test
> tsx scripts/run-tests.ts
Running Stagecraft Studio regression suite (36 tests)...
Summary: 36/36 passed, 0 failed (336ms)

$ npm run build
> vite build
✓ 1844 modules transformed.
✓ built in 1.19s

$ node --check scripts/render-batch.mjs && node --check scripts/determinism-audit.mjs && node --check scripts/studio-stress-test.mjs && npx tsx scripts/studio-stress-test.mjs
Stagecraft Studio — Deterministic Stress & Fuzz Suite
-----------------------------------------------------
  PASS  validateEpisodeScript       40/40  (19ms)
  PASS  healAndParseLlmJson         35/35  (4ms)
  PASS  parseKathaArchiveBytes      25/25  (3ms)
  PASS  trimAndNormalizePcm         25/25  (70ms)
  PASS  measureAudioBufferLufs      25/25  (217ms)
  PASS  computeDubTimingPlan        20/20  (6ms)
  PASS  recommendTopShortSlices     20/20  (17ms)
  PASS  computeEpisodeDiff          20/20  (12ms)
  PASS  analyzeEpisodePacing        20/20  (8ms)
-----------------------------------------------------
Total: 230/230 passed, 0 failed in 356ms
```
