# Stagecraft Studio — Wave 6 Upgrade Manifest (Upgrades 28–35)

Wave 6 delivers 8 deterministic 2D VFX, tactile papercraft diorama, semantic BM25 catalog discovery, routed agent skill export, and instant offline story remix upgrades—using **zero new npm dependencies**, **zero WebGL/Three.js**, **zero per-frame canvas allocations**, and **zero `Math.random()`** inside render loops, audio planners, search rankers, or remix builders.

## Summary of Upgrades (28–35)

### Upgrade 28 — Analytical 2D Particle, Ribbon & Ring VFX Engine (`src/studio/vfxEmitterEngine.ts`)
- Pure stateless analytical evaluation from `(localT, seed)` with bit-exact forward and backward timeline scrubbing.
- Exported primitives: `evalThreePointFCurve`, `sampleAnalyticalParticle`, `drawAnalyticalRibbonTrail`, `drawAnalyticalVfxRing`, `drawAnalyticalBeatVfxLayer`, `hashVfxSeed`.
- Added `EpisodeVisualStyle.vfxIntensity` (`0..1`, default `0.75`) with clamping in `resolveVisualStyle` & `validateEpisodeScript` and a live slider in `WorkbenchLookTab.tsx`.

### Upgrade 29 — Zero-Allocation Pooled 2D Shockwave Refraction Pass (`src/studio/vfxDistortionPass.ts`)
- Single pooled offscreen scratch buffer (`getDistortionPoolAllocationCount() <= 1`) for crisp radial shockwave refraction bands triggered by hitstop impacts, `shock_burst`, `crimson_impact`, `shatter_glass`, `portal_vortex`, `time_freeze_ripple`, `sonic_boom_rings`, `sword_clash`, and `thunder_crack`.
- Wired cleanly into `src/studio/renderer.ts` scaled by `vfxIntensity`.

### Upgrade 30 — Tactile Photographed Cardstock Papercraft Overhaul (`src/studio/papercraftCraft.ts`, `src/studio/styleEngines.ts`)
- Upgraded `papercraft_diorama` (Engine 6) with directional mood-tinted layered drop shadows (`drawPapercraftLayeredShadow`), lit cardstock cut-edge bevels (`drawCardstockCutBevel`), and zero-allocation macro miniature tilt-shift blur (`applyPooledTiltShiftBand`, `getTiltShiftPoolAllocationCount() <= 1`).
- Added `EpisodeVisualStyle.tiltShiftAmount` (`0..1`, default `0` globally, auto `0.55` in `papercraft_diorama`) with a live slider in `WorkbenchLookTab.tsx`.

### Upgrade 31 — Pop-Up Book Spring-Hinge Transitions & Fold Physics (`src/studio/papercraftCraft.ts`, `src/studio/types.ts`, `src/studio/renderer.ts`)
- Added damped harmonic spring-hinge solver (`computePopupHingeTransform`: flat fold → slight overshoot → crisp upright settle).
- Added `'popup_fold'` to `TransitionId` & `TRANSITION_CATALOG` with physical horizon crease fold overlay (`drawPopupFoldTransition`) and staggered pop-up entrance for foreground actors and non-held stage props in `papercraft_diorama` or `popup_fold`.

### Upgrade 32 — Tactile Paper & Cardstock Procedural Foley (`src/studio/proceduralFoley.ts`, `src/studio/audioEngine.ts`, `src/App.tsx`)
- Extended `FoleyKind` with deterministic WebAudio synthesis for `'paper_turn'`, `'cardstock_fold'`, and `'hinge_pop'`.
- Extended `planBeatFoleyEvents(beat, renderStyle?)` while preserving 100% 1-argument backward compatibility, wired through both live playback (`App.tsx` → `KathaAudioEngine.update`) and offline audio rendering (`renderEpisodeAudioOffline`).

### Upgrade 33 — 20-Engine Craft Matrix, Anti-Slop Checklist & Lean Routed `SKILL.md` (`src/studio/directorSkillExport.ts`, `src/studio/WorkbenchScriptTab.tsx`)
- Added `ENGINE_CRAFT_MATRIX` (all 20 art engines), 5-point `ANTI_SLOP_CRITIQUE_CHECKLIST`, and Wave 6 schema levers (`vfxIntensity`, `tiltShiftAmount`, `popup_fold`) to `buildStagecraftDirectorSkillMd()`.
- Added `buildRoutedDirectorSkillMd({ query, renderStyle?, aspect?, maxPerCategory? })` cutting prompt token size by >55% via BM25 asset routing, plus a compact **"Copy Lean Routed SKILL.md"** control in `WorkbenchScriptTab.tsx`.

### Upgrade 34 — Pure-TS Okapi BM25 Semantic Catalog Search (`src/studio/catalogSearchIndex.ts`, `src/studio/CommandPaletteModal.tsx`, `src/studio/WorkbenchAssetsTab.tsx`)
- Pure-TypeScript Okapi BM25 (`k1 = 1.5`, `b = 0.75`) + 20 domain synonym groups indexing **1,150+ live studio items** (`getCatalogIndexSize`, `searchStudioCatalog`, `recommendScenePaletteForPrompt`).
- Wired into `CommandPaletteModal.tsx` (`Ctrl/Cmd+K` semantic asset discovery & 1-click stage/mood/prop/cast application) and `WorkbenchAssetsTab.tsx`.

### Upgrade 35 — Instant Offline Story Remix Blueprint Engine (`src/studio/storyRemixEngine.ts`, `src/studio/WorkbenchScriptTab.tsx`)
- Added 12 curated structural `STORY_REMIX_BLUEPRINTS` (`folklore_fable`, `noir_mystery_case`, `scifi_first_contact`, `history_turning_point`, `mythic_boss_duel`, `science_explainer_60s`, `cozy_slice_of_life`, `courtroom_verdict`, `wildlife_micro_doc`, `heist_plan_twist`, `bedtime_storybook_popup`, `sports_comeback_short`).
- Added deterministic `remixStoryBlueprint(config)` using BM25 + `validateEpisodeScript`, plus a **"Remix Blueprint Generator"** drawer in `WorkbenchScriptTab.tsx`.

## New Modules Registered in `src/studio/zipBuilder.ts`
- `src/studio/vfxEmitterEngine.ts`
- `src/studio/vfxDistortionPass.ts`
- `src/studio/papercraftCraft.ts`
- `src/studio/catalogSearchIndex.ts`
- `src/studio/storyRemixEngine.ts`

## Regression Coverage
- Added **Tests 53–60** in `scripts/run-tests.ts` covering every Wave 6 module, determinism invariant, zero-allocation pool cap, backward compatibility, BM25 semantic accuracy, and all 12 story remix blueprints.
