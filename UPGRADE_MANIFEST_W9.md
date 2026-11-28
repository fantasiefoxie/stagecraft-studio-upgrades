# Stagecraft Studio — Wave 9 Upgrade Manifest (Upgrades 47–52)

**Theme**: Living Character Rigging, Acting Polish & Closed-Loop Shot-Inspector Auto-Heal  
**Studio Version**: `9.0.0`  
**Determinism Guarantee**: 100% pure-function HTML5 Canvas 2D + TypeScript (zero `Math.random()`, zero per-frame canvas allocations, zero new npm dependencies, zero asset duplication across all 20 `RenderStyleId` art engines).

---

## Upgrade Summary

### Upgrade 47 — Dynamic Eye-Gaze & Head-Tracking
- **Files**: `src/studio/types.ts`, `src/studio/characterRigging.ts`, `src/studio/renderer.ts`
- Added optional, 100% backward-compatible `ActorPlacement` fields with strict sanitization in `validateEpisodeScript`:
  - `gazeTarget?: 'auto' | 'camera' | 'partner' | 'left' | 'right' | 'up' | 'down'`
  - `headAngle?: 'auto' | 'front' | 'three_quarter' | 'profile'`
  - `heldProp?: PropId | 'none'`
  - `heldHand?: 'front' | 'back' | 'both'`
- Created pure deterministic `src/studio/characterRigging.ts` exporting:
  - `resolveActorHeadOrientation(beat, actor, partnerActor?)`
  - `resolveActorGazeVector(beat, actor, partnerActor?, timeSec)` (bounded `lookX ∈ [-1, 1]`, `lookY ∈ [-0.6, 0.6]` with deterministic micro-saccades)
  - `resolveActorRigForBeat(beat, actor, timeSec, speechEnergy)`

### Upgrade 48 — True 3/4 Head & Torso Orientation
- **Files**: `src/studio/modularEntityRenderer.ts`, `src/studio/facialExpressions.ts`, `src/studio/granularCharacterLayers.ts`, `src/studio/renderAssets.ts`, `src/studio/renderer.ts`
- Added perspective shift & foreshortening across eyes, eyebrows, nose bridge, mouth, near/far ear visibility, hair volume, and torso shoulder width for `'front'`, `'three_quarter'`, and `'profile'` head orientations.
- Propagated seamlessly across all 6 chassis (`humanoid`, `quadruped`, `avian`, `serpentine`, `arachnid`, `ethereal`), all 20 `RenderStyleId` art engines, and both full-body and standalone close-up/split-faceoff/eye-strip shots.

### Upgrade 49 — Hand-Held Prop Rigging
- **Files**: `src/studio/modularEntityRenderer.ts`, `src/studio/renderAssets.ts`
- Wired `actor.heldProp` (`front` / `back` / `both`) directly onto the articulated 2-bone arm wrist joints in `drawModularEntityFullBody` and non-DNA `drawActorFullBody`.
- Registered unified `drawStoryProp` via `setHeldPropRenderer` to preserve clean module boundaries with zero circular imports and full 20-engine style inheritance.

### Upgrade 50 — Stateless Secondary Motion Physics
- **Files**: `src/studio/characterRigging.ts`, `src/studio/modularEntityRenderer.ts`, `src/studio/granularCharacterLayers.ts`
- Added `computeSecondaryMotionSway(seed, timeSec, pose, motion, weather, speechEnergy)` — a stateless dual-harmonic analytical spring-pendulum model driving hair behind the head, capes, and tails with phase lag and normalized `energy ∈ [0, 1]`.
- Fully deterministic and frame-scrubbable with zero retained mutable physics state.

### Upgrade 51 — Global Casual DNA Additions & Workshop Turnaround Preview
- **Files**: `src/studio/characterDna.ts`, `src/studio/granularCharacterLayers.ts`, `src/studio/modularEntityRenderer.ts`, `src/studio/EntityWorkshopModal.tsx`
- Added 3 casual hairstyles (`side_part_classic`, `curtain_bangs`, `wolf_cut` — `HAIR_STYLE_CATALOG` now 24) and 3 casual headwear styles (`baseball_cap`, `beanie_knit`, `beret_artist` — `HEADWEAR_CATALOG` now 27) with full NLP trait auto-mapping in `parseNaturalLanguageDnaTraits`.
- Upgraded `EntityWorkshopModal.tsx` with a live turnaround angle toggle (**Front** / **3/4 Left** / **3/4 Right**) and **Held Prop** selector in the 60fps preview pane.

### Upgrade 52 — Wave 9 Shot-Inspector Telemetry, Patch Allowlist & Closed-Loop CLI Auto-Heal
- **Files**: `src/studio/shotInspectorBridge.ts`, `src/studio/shotInspectorPatchApplier.ts`, `scripts/render-batch.mjs`
- Bumped `STAGECRAFT_STUDIO_VERSION = '9.0.0'` and added 6 additive actor telemetry fields to `StagecraftActorTelemetryV1`:
  - `facing`, `resolvedHeadAngle`, `resolvedGazeTarget`, `heldProp`, `secondaryMotionEnergy`, `paletteContrastLuma` (WCAG 2.1 sRGB relative luminance).
- Extended strict RFC 6902 patch allowlist in `shotInspectorPatchApplier.ts`:
  - `/beats/<idx>/actors/<actorIdx>/(gazeTarget|headAngle|heldProp|heldHand|facing)`
  - `/cast/<castIdx>/(primaryColor|accentColor)` (strict `#RRGGBB` hex validation; `/cast/<idx>/name`, `/id`, `__proto__`, `constructor`, `prototype`, and out-of-range indices remain atomically rejected).
- Added `--auto-heal-qa` and `--target-score <N>` (default `85`) closed-loop auto-heal mode to `scripts/render-batch.mjs` (max 2 audit passes, strict `execFileSync` explicit argument arrays, path confinement inside `--shot-inspector-dir`, emits `<episode>.healed.json` + refreshes `<episode>.qa-bundle.json`, reports before/after QA score delta).

---

## Verification Gate
- `npm run sync-docs -- --check` — 0 drift across `STAGECRAFT_LLM_INSTRUCTIONS.md` & `LLM_STORY_STAGE_GUIDE.md` (Test 61)
- `npm run lint` — `tsc --noEmit` 0 errors
- `npm test` — 77/77 regression tests passing (including Wave 9 Tests 72–77 and `zipBuilder.ts` Test 8)
- `npm run build` — Vite production bundle green
- `npx tsx scripts/studio-stress-test.mjs` — Stress test green
- `node --check scripts/render-batch.mjs` — CLI syntax verified
