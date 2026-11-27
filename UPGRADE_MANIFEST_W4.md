# Stagecraft Studio — Wave 4 Upgrade Manifest (Upgrades 21–27)

All 7 high-craft Wave 4 upgrades have been implemented cleanly using pure deterministic TypeScript + HTML5 Canvas 2D (zero new npm dependencies, zero per-frame canvas allocations, zero `Math.random()` inside render loops, and zero asset duplication across all 20 unified `RenderStyleId` art engines).

---

## Upgrades Delivered

| # | Upgrade | New / Updated Modules | Summary |
|---|---|---|---|
| **21** | **Deterministic Hit Stop & Attack-Hold-Decay VFX Envelopes** | `src/studio/impactVfx.ts`, `src/studio/types.ts`, `src/studio/renderer.ts`, `src/studio/WorkbenchLookTab.tsx` | Pure `attackHoldDecay(t, start, attackDur, holdDur, decayDur)`, `computeHitstopState` (2–4 frame deterministic actor pose/limb freeze on peak attacks, `cameraPunch >= 0.5`, `sword_clash` / `thunder_crack`, or `crimson_impact` / `shock_burst` / `shatter_glass` / `comic_pow`), micro-shake, and zero-allocation `drawImpactShockOverlay`. Controlled via optional `visualStyle.hitstopEnabled` (default `true`). |
| **22** | **In-Browser Custom Sprite & Prop Prep Studio** | `src/studio/spritePrepTools.ts`, `src/studio/SpritePrepModal.tsx`, `src/studio/WorkbenchAssetsTab.tsx`, `src/App.tsx` | Pure Node-testable RGBA processors (`removeFlatBackgroundRgba` BFS corner flood-fill preserving enclosed matching-color interiors, `addSpriteOutlineRgba` with circular & pixel-snapped Chebyshev modes, `quantizeAndPixelizeRgba`, `getMoodPaletteHexes`, `processSpriteRgbaPipeline`) + lazy-loaded modal with Before/After live previews and 1-click **Apply to Scene Prop** / **Apply to Scene Backdrop**. |
| **23** | **Frame-Locked Sprite Sheet Slicer & Animated Custom Props** | `src/studio/spriteSheetSlicer.ts`, `src/studio/SpritePrepModal.tsx`, `src/studio/types.ts`, `src/studio/renderer.ts` | Optional `StoryBeat.customPropSheet` (`cols 1..16`, `rows 1..16`, `frameCount 1..256`, `fps 2..30`, `loop?: boolean`) validated & clamped in `validateEpisodeScript`, `computeSpriteSheetFrameRect` synced to `STUDIO_FPS` + active `motionCadence`, `detectGridHint` heuristic auto-detector, live animated preview tab in `SpritePrepModal`, and 9-arg `ctx.drawImage` slicing in `renderer.ts`. |
| **24** | **Directional 2D Ground Shadows & Wet-Surface / Water Reflections** | `src/studio/surfaceReflections.ts`, `src/studio/renderer.ts` | Covers all 50 `StageId` environments (`water`, `wet_street`, `polished_marble`, `none`) plus automatic outdoor `rain` / `lightning_storm` wet-street reflection upgrades, rendering directional light-aligned cast ground ellipses and deterministic horizontal ripple reflection bands directly beneath stage actors. |
| **25** | **Foreground Framing Parallax Silhouettes** | `src/studio/foregroundParallax.ts`, `src/studio/types.ts`, `src/studio/renderer.ts`, `src/studio/WorkbenchLookTab.tsx` | Maps all 50 stages to 10 curated near-camera framing motifs (`banyan_foliage`, `temple_pillars`, `bamboo_stalks`, `cyber_cables`, `noir_blinds`, `gothic_arch`, `ship_rigging`, `alpine_pines`, `sakura_branch`, `starship_struts`) + `none`, moving at `1.28×` camera parallax without obstructing center faces or captions. Controlled via optional `visualStyle.foregroundFraming` (`0..1`, default `0.35`). |
| **26** | **Calibrated 0–3 Visual Craft Scorecard & Manifest-Driven Audit CLI** | `src/studio/visualScorecard.ts`, `src/studio/StoryboardQaModal.tsx`, `src/studio/useHeadlessDriver.ts`, `scripts/determinism-audit.mjs` | Evaluates 6 visual-craft dimensions on a calibrated `0..3` rubric (`Placeholder` → `Showcase`, total `0..18`) with actionable tips for any dimension `< 2`, surfaced in Storyboard QA and exposed via `window.__STAGECRAFT_HEADLESS__.scoreVisualCraft()`. Upgraded `scripts/determinism-audit.mjs` with `--manifest <file.json>` multi-viewport (`16:9` + `9:16`) matrices, `--max-frame-ms` budget enforcement, `console` + `pageerror` capture, and scorecard JSON/Markdown reports. |
| **27** | **Exportable Stagecraft Director `SKILL.md` Generator & Guide Update** | `src/studio/directorSkillExport.ts`, `src/studio/WorkbenchScriptTab.tsx`, `LLM_STORY_STAGE_GUIDE.md` | Live `buildStagecraftDirectorSkillMd()` dynamically embedding all runtime catalogs (60 archetypes, 50 stages, 65 props, 16 moods, 12 weathers, 12 crowds, 14 FX, 20 art engines, 12 acting macros, 32 DNA sprite presets) and Wave 1–4 schema levers, with 1-click **Copy Director SKILL.md** & **Download SKILL.md** buttons in `WorkbenchScriptTab.tsx` and Section 13 in `LLM_STORY_STAGE_GUIDE.md`. |

---

## Packaging & Source Bundle Sync
- Updated `src/studio/zipBuilder.ts` with raw imports and archive entries for all 8 new Wave 4 files (`impactVfx.ts`, `spritePrepTools.ts`, `SpritePrepModal.tsx`, `spriteSheetSlicer.ts`, `surfaceReflections.ts`, `foregroundParallax.ts`, `visualScorecard.ts`, `directorSkillExport.ts`).
- Added automated regression **Tests 41–47** in `scripts/run-tests.ts`.

---

## Verification Gate Results
- `npm run lint` (`tsc --noEmit`): **PASS (0 errors)**
- `npm test` (`scripts/run-tests.ts`): **47/47 PASS (0 failed)** — includes Test 8 (`zipBuilder.ts` completeness audit) and Tests 41–47 (Wave 4).
- `npm run build` (`vite build`): **PASS (clean production bundle)**
- `node --check scripts/render-batch.mjs && node --check scripts/determinism-audit.mjs`: **PASS**
- `npx tsx scripts/studio-stress-test.mjs`: **230/230 PASS (0 failed)**
- Rendered binaries in workspace: **0**
- `.env.example`, `metadata.json`, and port `3000` server binding: **Preserved untouched**
