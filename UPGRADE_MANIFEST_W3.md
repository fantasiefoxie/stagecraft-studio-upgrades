# Stagecraft Studio — Wave 3 Upgrade Manifest (Mega Visual World & Sprite Expansion Pack)

## Asset Catalog Expansion Summary

| Asset Dimension | Before (Wave 2) | After (Wave 3) | Delta |
|---|---:|---:|---:|
| Character / Sprite Archetypes (`ArchetypeId`) | 40 | 60 | +20 |
| Multi-Layer Stage Backdrops (`StageId`) | 30 | 50 | +20 |
| Story Props (`PropId`, incl. `none`) | 41 | 65 | +24 |
| Lighting Mood Palettes (`MoodId`) | 8 | 16 | +8 |
| Weather Particle Systems (`WeatherId`) | 6 | 12 | +6 |
| Crowd Silhouette Layers (`CrowdId`) | 6 | 12 | +6 |
| Kinetic Beat FX Overlays (`FxId`) | 6 | 14 | +8 |
| Procedural 1080p Backdrop Themes (`BackdropThemeId`) | 10 | 24 | +14 |
| Procedural Prop Cutout Presets (`CustomPropPresetId`) | 8 | 24 | +16 |
| 4-Act Visual Arc Presets (`ActArcPresetId`) | 5 | 9 | +4 |
| CharacterDNA Headwear (`EntityHeadwearId`) | 12 | 16 | +4 |
| CharacterDNA Tops (`EntityTopStyleId`) | 11 | 15 | +4 |
| CharacterDNA Surface Patterns (`EntitySurfacePatternId`) | 10 | 14 | +4 |
| Curated Multi-Genre CharacterDNA Sprite Presets | 0 | 32 | +32 |
| **Total New Visual Elements Added** | — | — | **+170** |

## New Files Created
- `src/studio/renderAssetsUniversal.ts` — Deterministic Canvas 2D renderer for +20 multi-genre stages, +20 archetypes (close-up & full-body), +24 props, +6 weathers, +6 crowds, and +8 kinetic beat FX (zero per-frame canvas allocations, zero `Math.random()`, auto-stylized across all 20 `RenderStyleId` art engines).
- `src/studio/spriteWorkshopPresets.ts` — 32 hand-tuned multi-genre `CharacterDNA` sprite presets across 6 categories (`Modern & Explainer`, `Sci-Fi & Cyber`, `Fantasy & RPG`, `Folklore & History`, `Noir & Mystery`, `Creatures & Mascots`) with `buildCastMemberFromSpritePreset`.
- `UPGRADE_MANIFEST_W3.md` — This manifest.

## Modified Files
- `src/studio/types.ts` — Added all new IDs, catalogs, groups (`Modern & Sci-Fi`, `Fantasy & Creatures`), and `ARCHETYPE_DEFAULT_COLORS`.
- `src/studio/renderAssets.ts` — Added 8 new `MOOD_PALETTES`, extended indoor stage & nocturnal sky sets, and wired `renderAssetsUniversal.ts` stage, actor, and prop renderers.
- `src/studio/renderer.ts` — Wired `drawUniversalCrowdLayer`, `drawUniversalWeather`, and `drawUniversalBeatFx` into the unified render pass.
- `src/studio/backdropGenerator.ts` — Expanded to 24 backdrop themes, 24 custom prop cutouts, 9 Act Arc presets, and 16 mood palettes.
- `src/studio/characterDna.ts` — Added 4 headwear (`fedora`, `cyber_visor`, `astronaut_helmet`, `tricorn_hat`), 4 tops (`trench_coat`, `lab_coat`, `cyber_jacket`, `space_suit`), 4 surface patterns (`circuit_trace`, `pinstripe`, `camo_hex`, `starfield_speckle`), and `hydrateArchetypeToDna` recipes for all 20 new archetypes.
- `src/studio/modularEntityRenderer.ts` — Implemented Canvas 2D rendering for the 4 new headwear styles, 4 new tops, and 4 new clipped surface patterns.
- `src/studio/animationEngine.ts`, `src/studio/spatialAudio.ts`, `src/studio/volumetricLighting.ts`, `src/studio/propPhysics.ts` — Registered gait mappings, stage room acoustics, volumetric lighting classifications, and kinetic/mystic prop physics for all Wave 3 additions.
- `src/studio/EntityWorkshopModal.tsx` — Added searchable, category-filterable **Presets (32)** tab with live `AssetThumb` previews and 1-click DNA loading.
- `src/studio/WorkbenchAssetsTab.tsx` — Added live search input, category filter pills across all 6 archetype groups, 50 stages, and 64 story props, plus the **Quick Sprite DNA Gallery (32)** with 1-click scene spawning.
- `src/studio/WorkbenchBeatInspector.tsx` — Formatted Weather (12) and FX (14) dropdown options into clean human-readable labels.
- `src/App.tsx` — Added `addSpritePresetToEpisode` callback and wired it to `WorkbenchAssetsTab`.
- `src/studio/zipBuilder.ts` — Synced `?raw` imports and ZIP entries for `renderAssetsUniversal.ts` and `spriteWorkshopPresets.ts`.
- `scripts/run-tests.ts` — Added regression Tests 37–40 covering all Wave 3 catalogs, procedural studio generators, 32 DNA sprite presets + hydrations, and spatial/volumetric stage mappings.

## Verification Gate Results
- `npm run lint` (`tsc --noEmit`): **PASS (0 errors)**
- `npm test` (`tsx scripts/run-tests.ts`): **40/40 PASS (0 failed)**
- `npm run build` (`vite build`): **PASS**
- `node --check scripts/render-batch.mjs && node --check scripts/determinism-audit.mjs`: **PASS**
- `npx tsx scripts/studio-stress-test.mjs`: **230/230 PASS (0 failed)**
