# Stagecraft Studio — Wave 5 Upgrade Manifest

**Release:** Wave 5 — The 5× Universal Visual World & Sprite Coverage Pack (**+850 New Visual Elements → 1,150+ Total Elements**)  
**Architecture:** 100% Deterministic TypeScript + HTML5 Canvas 2D Compositional Atlases (Zero new npm dependencies, zero WebGL/Three.js, zero `Math.random()`, zero per-frame offscreen allocations, automatic compatibility across all 20 `RenderStyleId` art engines).

---

## 1. Visual Catalog Expansion Summary

| Visual System | Wave 3–4 | Wave 5 Added | Wave 5 Total |
| :--- | ---: | ---: | ---: |
| **Character Archetypes (`ArchetypeId`)** | 60 | **+100** | **160** (11 groups) |
| **Stages / Environments (`StageId`)** | 50 | **+100** | **150** (10 families) |
| **Story Props (`PropId`)** | 65 | **+120** | **185** (`184 + none`) |
| **Lighting Moods (`MoodId`)** | 16 | **+24** | **40** (8 categories) |
| **Weather Systems (`WeatherId`)** | 12 | **+18** | **30** |
| **Crowd Layers (`CrowdId`)** | 12 | **+18** | **30** (5 categories) |
| **Kinetic Beat FX (`FxId`)** | 14 | **+22** | **36** |
| **CharacterDNA Parts (Headwear / Tops / Patterns)** | 45 | **+23 net-new** (+`lab_coat` = 24 covered) | **68** (24 headwear, 22 tops, 22 patterns) |
| **Curated DNA Sprite Presets** | 32 (6 cats) | **+160** (+6 cats) | **192** (12 categories) |
| **Procedural Backdrop Themes** | 24 | **+60** | **84** |
| **Procedural Prop Presets** | 24 | **+60** | **84** |
| **4-Act Visual Arc Presets** | 9 | **+16** | **25** |

---

## 2. New Modular Compositional Atlas Architecture

1. **`src/studio/renderAssetsArchetypesAtlas.ts`** — Compositional Layered Character Rig (`ATLAS_BLUEPRINTS`) spanning all 100 new archetypes across 10 storytelling domains (World Mythology, Historical Eras, Modern Civic, Media/Business, Sci-Fi/Space, High Fantasy RPG, Dark Gothic/Horror, Wildlife/Prehistoric, Mythic Beasts, and Kids/Sports/Entertainment). Full pose, expression, lip-sync, and Wave 4 hitstop compatibility.
2. **`src/studio/renderAssetsStagesAtlas.ts`** — 5-Plane Compositional Stage Composer (`ATLAS_STAGE_BLUEPRINTS`) spanning all 100 new stages across 10 families (Ancient/Sacred, Historical Towns, Modern City, Workplaces/Civic, Interiors/Cozy, Sci-Fi/Cyberpunk, High Fantasy, Horror/Noir, Nature/Biomes, and Sports/Travel/Kids) plus `ATLAS_INDOOR_STAGES`.
3. **`src/studio/renderAssetsPropsAtlas.ts`** — Compositional layered prop renderer (`ATLAS_PROP_BLUEPRINTS`) covering all 120 new props across 10 domains (Weapons & Armor, Magic & Relics, Sci-Fi & Tech, Office/Media/Finance, Science & Lab, Music & Art, Food & Feast, Vehicles & Travel, Mystery/Crime/Noir, and Sports/Kids).
4. **`src/studio/renderAssetsAtmosphereAtlas.ts`** — 24 new `ATLAS_MOOD_PALETTES`, 18 deterministic weather systems (`drawAtlasWeather`), 18 animated crowd layers (`drawAtlasCrowdLayer`), and 22 kinetic beat FX (`drawAtlasBeatFx`).
5. **`src/studio/spriteWorkshopPresetsAtlas.ts`** — 160 curated multi-genre `CharacterDNA` sprite presets integrated into `SPRITE_WORKSHOP_PRESETS` (192 total across 12 genres).

---

## 3. Core Engine, Classifier & Studio UI Upgrades

- **Rendering & DNA Integration**: Wired all 5 atlases into `renderAssets.ts`, `renderer.ts`, `characterDna.ts`, `modularEntityRenderer.ts`, `spriteWorkshopPresets.ts`, and `backdropGenerator.ts`.
- **Exhaustive Classifiers**:
  - `animationEngine.ts`: Mapped all 160 `ArchetypeId`s in `ARCHETYPE_GAIT_MAP`.
  - `spatialAudio.ts`: Mapped all 150 `StageId`s in `STAGE_ACOUSTIC_MAP`.
  - `foregroundParallax.ts`: Mapped all 150 `StageId`s in `STAGE_TO_FOREGROUND`.
  - `surfaceReflections.ts`: Classified Wave 5 water, wet-street, polished-marble, and indoor stages, plus wet-surface reflection support for `acid_rain` and `hailstorm`.
  - `volumetricLighting.ts`: Added beam-kind classification and RGB beam/rim palettes for all 40 moods and 150 stages.
  - `propPhysics.ts`: Classified Wave 5 mystic/glowing props and kinetic weapon/swing props.
  - `directorSkillExport.ts`: Live `SKILL.md` export dynamically reports exact Wave 5 counts and DNA parts.
- **Searchable & Categorized Studio UI**:
  - `WorkbenchAssetsTab.tsx`: Dynamic category filter chips across all 11 archetype groups, 10 stage families, 11 prop categories, and 12 sprite preset categories, plus dedicated search inputs for the 84 Procedural Backdrop Themes and 84 Procedural Prop Presets.
  - `WorkbenchBeatInspector.tsx`: Added inline quick-filter input and `<optgroup>` categorized dropdowns for Stage (150), Mood (40), Prop (185), Weather (30), FX (36), and Crowd (30).
  - `EntityWorkshopModal.tsx`: Updated preset search for 192 presets / 12 genres and added a grouped search filter for the 160-archetype seed selector.
- **Source Bundle Sync**: Registered all 5 new atlas modules in `src/studio/zipBuilder.ts` (Test 8 green).

---

## 4. Verification Gates

- `npm run lint` (`tsc --noEmit`): **0 errors**
- `npm run build` (`vite build`): **Clean production bundle**
- `npm test` (`scripts/run-tests.ts`): **52/52 PASS, 0 failed** (including Wave 5 Tests 48–52 & Test 8 `zipBuilder.ts` audit)
- CLI Syntax Check (`render-batch.mjs`, `determinism-audit.mjs`, `studio-stress-test.mjs`): **Clean**
- Fuzz Stress Test (`npx tsx scripts/studio-stress-test.mjs`): **230/230 PASS, 0 failed**
