# Stagecraft Studio — Wave 7 Upgrade Manifest (Upgrades 36–41)

## Mission
Upgrade Stagecraft Studio's modular `CharacterDNA` schema, deterministic HTML5 Canvas 2D entity renderer, and `EntityWorkshopModal` into a **Sims-grade Create-a-Character (CAS) studio** with full backward compatibility across all 20 `RenderStyleId` art engines, all 10 FACS expressions, all 6 phoneme lip-sync visemes, and all 192 legacy `SPRITE_WORKSHOP_PRESETS`.

## Delivered Upgrades

### Upgrade 36 — Sims-Grade Granular Face, Eyes, Eyebrows, Nose, Mouth & 12 Face Sculpt Morphs (`src/studio/characterDna.ts`)
- Added `EyebrowStyleId` (10), `PupilStyleId` (8), `EyelashStyleId` (5), `MouthStyleId` (8).
- Expanded `HairStyleId` (+10 → **21** total) and `FacialHairId` (+6 → **13** total).
- Added `CharacterFaceMorph` with **12 clamped sculpt morphs** (`jawWidth`, `chinLength`, `cheekboneWidth`, `eyeSize`, `eyeSpacing`, `eyeTilt`, `browHeight`, `browThickness`, `noseScale`, `mouthWidth`, `earScale`, `neckLength`) and `resolveFaceMorph()`.
- Extended `CharacterPaletteSpec` to a **10-channel palette** (+ `eyeSecondary` heterochromia, `lipColor`, `browColor`, `markTint`).

### Upgrade 37 — Combinable Facial & Body Marks, Scars, Tattoos & Implants (`src/studio/characterDna.ts`)
- Expanded `FaceMarkId` (+12 → **22** total) plus `secondaryFaceMark` and `blushIntensity` (`0..1`).
- Added `BodyMarkId` (**16** total) with `bodyMarks?: BodyMarkId[]` (deduplicated, `'none'`-filtered, max 3 simultaneous active markers via `resolveBodyMarks()`).

### Upgrade 38 — Multi-Layer Clothing, Sleeves, Belts, Gloves & Footwear (`src/studio/characterDna.ts`)
- Added 5 independent layered clothing catalogs:
  - `OuterwearStyleId` (**14**), `SleeveStyleId` (**7**), `WaistStyleId` (**10**), `GloveStyleId` (**9**), `FootwearStyleId` (**12**).

### Upgrade 39 — 5 Independent Accessory Slots, NLP Trait Parser, Distance & Deterministic Sub-Randomizers (`src/studio/characterDna.ts`)
- Added `CharacterAccessoriesSpec` with 5 independent slots:
  - `EyewearStyleId` (**12**), `EarJewelryId` (**9**), `NeckwearStyleId` (**10**), `WristwearStyleId` (**7**), `BackGearStyleId` (**12**) and `resolveAccessories()`.
- Added `parseNaturalLanguageDnaTraits(traitsText, baseDna?)` for deterministic natural-language trait parsing.
- Updated `computeDnaFingerprint` & `computeSilhouetteDistance` / `computeDnaDistance` to distinguish Wave 7 eyewear, outerwear, back gear, marks, and face morphs while preserving legacy silhouette scores.
- Added zero-`Math.random()` deterministic sub-randomizers: `randomizeDnaFace`, `randomizeDnaOutfit`, `randomizeDnaAccessories`.

### Upgrade 40 — Pure-Function Granular Canvas 2D Layer Compositor (`src/studio/granularCharacterLayers.ts`, `src/studio/modularEntityRenderer.ts`)
- Built 100% pure, zero-allocation, zero-`Math.random()` Canvas 2D renderers for all Wave 7 layers.
- Integrated full anatomical Z-order into both `drawModularEntityFullBody` and `drawModularEntityCloseUp`:
  - Back gear → Wings/Cape/Tail → Back arm (sleeve/body marks/gloves) → Legs & Footwear → Torso (body marks/outerwear/waist/neckwear) → Head sculpt (jaw/cheekbones/chin/ears/neckLength) → Face marks + blush → Granular eyes (heterochromia, pupils, lashes) & sculpted eyebrows → Nose → Granular mouth/lips/fangs (preserving all 10 `ExpressionId`s & 6 visemes) → Front hair → Eyewear → Ear/face jewelry → Headwear → Front arm (sleeve/body marks/wristwear/gloves).
- `hasGranularFaceOverrides(dna)` guarantees 100% identical legacy rendering for all 192 existing presets and saved episodes.

### Upgrade 41 — Sims-Grade 8-Tab CAS Studio UI (`src/studio/EntityWorkshopModal.tsx`)
- Added `Auto` smart-zoom camera mode (automatically frames Face Close-Up on Face/Hair/Marks tabs and Full Body on Body/Clothes/Accessories/Mythic/Presets tabs) alongside manual `Full Body`, `Face`, and `Split` views.
- Organized the workshop into **8 clean CAS tabs**: `Presets (192)`, `Body`, `Face & Eyes`, `Hair`, `Marks & Ink`, `Clothes`, `Accessories`, `Mythic & Colors`.
- Added 12 Sims Face Sculpt sliders + Reset Face, combinable primary/secondary face marks + blush slider + 3-slot body mark picker, 5 layered clothing pickers, 5 independent accessory pickers, 10-channel palette studio, and focused `Rnd Face` / `Rnd Outfit` / `Rnd Gear` deterministic sub-randomizers.

### Living LLM Docs, Search, Director Skill & Bundle Sync
- Created `src/studio/llmMasterGuideBuilder.ts`, `scripts/sync-llm-docs.ts`, `"sync-docs"` npm script, and auto-generated `STAGECRAFT_LLM_INSTRUCTIONS.md` (with Section 5.7 Wave 7 DNA specification) + auto-synced snapshot block in `LLM_STORY_STAGE_GUIDE.md`.
- Updated `src/studio/directorSkillExport.ts`, `src/studio/catalogSearchIndex.ts` (all 18 Wave 7 DNA catalogs indexed in BM25), and `src/studio/zipBuilder.ts` (Test 8 green).
- Added Regression Tests **61–66** in `scripts/run-tests.ts`.

## Invariant Checklist
- Zero new npm dependencies / zero WebGL / zero Three.js
- Zero per-frame canvas allocations / zero `Math.random()` in render loops, validators, or sub-randomizers
- Zero asset duplication across 20 art engines
- 100% backward compatibility (`CharacterDNA.version: 1`, all new fields optional)
- Zero rendered binaries in repository
