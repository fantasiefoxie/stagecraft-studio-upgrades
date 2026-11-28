/**
 * Bulletproof zero-dependency client-side PKZIP 2.0 archive generator.
 * Imports all actual project source files via Vite `?raw` so the downloaded ZIP
 * is ALWAYS 100% populated, neatly organized into 4 folders, CRC-32 verified,
 * and never empty due to iframe/proxy static download issues.
 */
import { buildAiDirectorPrompt } from './types';
import { PRESET_EPISODES } from './presets';
import {
  buildGuidedDirectorPrompt,
  buildLlmStoryStageGuideMarkdown,
} from './llmDirectorKit';

// Raw imports of every real file across all 3 machinimas
import pixelShortHtml from '../../public/vikram_betaal_stardew_short.html?raw';
import bakeoffAppTsx from '../bakeoff/BakeoffApp.tsx?raw';
import bakeoffScriptTs from '../bakeoff/script.ts?raw';
import bakeoffStyle1Ts from '../bakeoff/renderStyle1Miniature.ts?raw';
import bakeoffStyle2Ts from '../bakeoff/renderStyle2Chiaroscuro.ts?raw';

import pkgJson from '../../package.json?raw';
import envExample from '../../.env.example?raw';
import gitignoreRaw from '../../.gitignore?raw';
import gitattributesRaw from '../../.gitattributes?raw';
import readmeMdRaw from '../../README.md?raw';
import agentsMdRaw from '../../AGENTS.md?raw';
import ciYmlRaw from '../../.github/workflows/ci.yml?raw';
import serverTs from '../../server.ts?raw';
import indexHtml from '../../index.html?raw';
import viteConfigTs from '../../vite.config.ts?raw';
import tsconfigJson from '../../tsconfig.json?raw';
import metadataJson from '../../metadata.json?raw';
import mainTsx from '../main.tsx?raw';
import indexCss from '../index.css?raw';
import appTsx from '../App.tsx?raw';

import studioTypesTs from './types.ts?raw';
import studioI18nTs from './i18n.ts?raw';
import studioErrorBoundaryTsx from './StudioErrorBoundary.tsx?raw';
import studioPresetsTs from './presets.ts?raw';
import studioPresetsExpandedTs from './presetsExpanded.ts?raw';
import studioPresetsWorldTs from './presetsWorld.ts?raw';
import studioPresetsMultiGenreTs from './presetsMultiGenre.ts?raw';
import studioAudioTs from './audioEngine.ts?raw';
import studioFacialExpressionsTs from './facialExpressions.ts?raw';
import studioEmotionChoreographerTs from './emotionChoreographer.ts?raw';
import studioAssetsTs from './renderAssets.ts?raw';
import studioAssetsExpandedTs from './renderAssetsExpanded.ts?raw';
import studioAssetsEncyclopediaTs from './renderAssetsEncyclopedia.ts?raw';
import studioAssetsWorldTs from './renderAssetsWorld.ts?raw';
import studioAssetsUniversalTs from './renderAssetsUniversal.ts?raw';
import studioAssetsAtmosphereAtlasTs from './renderAssetsAtmosphereAtlas.ts?raw';
import studioAssetsArchetypesAtlasTs from './renderAssetsArchetypesAtlas.ts?raw';
import studioAssetsStagesAtlasTs from './renderAssetsStagesAtlas.ts?raw';
import studioAssetsPropsAtlasTs from './renderAssetsPropsAtlas.ts?raw';
import studioAnimationEngineTs from './animationEngine.ts?raw';
import studioAnimationPrinciplesTs from './animationPrinciples.ts?raw';
import studioStyleEnginesTs from './styleEngines.ts?raw';
import studioRendererTs from './renderer.ts?raw';
import studioThumbnailRendererTs from './thumbnailRenderer.ts?raw';
import studioShortsModalTsx from './ShortsAndThumbnailModal.tsx?raw';
import studioVoicePanelTsx from './VoiceStudioPanel.tsx?raw';
import studioGrowthToolsTs from './growthTools.ts?raw';
import studioMonetizationShieldTs from './monetizationShield.ts?raw';
import studioCastBibleTs from './castBible.ts?raw';
import studioGrowthModalTsx from './ChannelGrowthModal.tsx?raw';
import studioAiDirectorTsx from './AiDirectorPanel.tsx?raw';
import studioLlmDirectorKitTs from './llmDirectorKit.ts?raw';
import studioScriptCraftTs from './scriptCraft.ts?raw';
import studioProjectVaultTs from './projectVault.ts?raw';
import studioOfflineRendererTs from './offlineRenderer.ts?raw';
import studioProjectVaultMenuTsx from './ProjectVaultMenu.tsx?raw';
import studioFastRenderModalTsx from './FastRenderModal.tsx?raw';
import studioBrandKitTs from './brandKit.ts?raw';
import studioTimelineUtilsTs from './timelineUtils.ts?raw';
import studioBeatWaveformBarTsx from './BeatWaveformBar.tsx?raw';
import studioMlaPackagerTs from './mlaPackager.ts?raw';
import studioKathaArchiveTs from './kathaArchive.ts?raw';
import studioSeasonBoardTs from './seasonBoard.ts?raw';
import studioCharacterDnaTs from './characterDna.ts?raw';
import studioSpriteWorkshopPresetsTs from './spriteWorkshopPresets.ts?raw';
import studioSpriteWorkshopPresetsAtlasTs from './spriteWorkshopPresetsAtlas.ts?raw';
import studioModularEntityRendererTs from './modularEntityRenderer.ts?raw';
import studioEntityWorkshopModalTsx from './EntityWorkshopModal.tsx?raw';
import studioLongFormEngineTs from './longFormEngine.ts?raw';
import studioBackdropGeneratorTs from './backdropGenerator.ts?raw';
import studioThumbTsx from './AssetThumb.tsx?raw';
import studioStyleEngineSwatchPickerTsx from './StyleEngineSwatchPicker.tsx?raw';
import studioBeatMotionAndCuesEditorTsx from './BeatMotionAndCuesEditor.tsx?raw';
import studioStoryboardTimelineStripTsx from './StoryboardTimelineStrip.tsx?raw';
import studioStoryboardQaTs from './storyboardQa.ts?raw';
import studioStoryboardQaModalTsx from './StoryboardQaModal.tsx?raw';
import studioVoiceEnvelopeTs from './voiceEnvelope.ts?raw';
import studioShortsRecommenderTs from './shortsRecommender.ts?raw';
import studioUseHeadlessDriverTs from './useHeadlessDriver.ts?raw';
import studioWorkbenchAssetsTabTsx from './WorkbenchAssetsTab.tsx?raw';
import studioWorkbenchScriptTabTsx from './WorkbenchScriptTab.tsx?raw';
import studioWorkbenchLookTabTsx from './WorkbenchLookTab.tsx?raw';
import studioWorkbenchBeatInspectorTsx from './WorkbenchBeatInspector.tsx?raw';
import studioLoudnessMeterTs from './loudnessMeter.ts?raw';
import studioSpatialAudioTs from './spatialAudio.ts?raw';
import studioDepthOfFieldTs from './depthOfField.ts?raw';
import studioActingMacrosTs from './actingMacros.ts?raw';
import studioContinuityAuditorTs from './continuityAuditor.ts?raw';
import studioProceduralFoleyTs from './proceduralFoley.ts?raw';
import studioCameraKeyframesTs from './cameraKeyframes.ts?raw';
import studioCameraCurveMiniEditorTsx from './CameraCurveMiniEditor.tsx?raw';
import studioDubSyncPackagerTs from './dubSyncPackager.ts?raw';
import studioLookPresetsTs from './lookPresets.ts?raw';
import studioVolumetricLightingTs from './volumetricLighting.ts?raw';
import studioPropPhysicsTs from './propPhysics.ts?raw';
import studioKineticCaptionsTs from './kineticCaptions.ts?raw';
import studioMusicTensionTs from './musicTension.ts?raw';
import studioTeleprompterUtilsTs from './teleprompterUtils.ts?raw';
import studioTeleprompterModalTsx from './TeleprompterModal.tsx?raw';
import studioPacingAnalyzerTs from './pacingAnalyzer.ts?raw';
import studioLowerThirdsTs from './lowerThirds.ts?raw';
import studioEpisodeDiffTs from './episodeDiff.ts?raw';
import studioVersionDiffModalTsx from './VersionDiffModal.tsx?raw';
import studioShortcutsTs from './studioShortcuts.ts?raw';
import studioCommandPaletteModalTsx from './CommandPaletteModal.tsx?raw';
import studioImpactVfxTs from './impactVfx.ts?raw';
import studioSpritePrepToolsTs from './spritePrepTools.ts?raw';
import studioSpritePrepModalTsx from './SpritePrepModal.tsx?raw';
import studioSpriteSheetSlicerTs from './spriteSheetSlicer.ts?raw';
import studioSurfaceReflectionsTs from './surfaceReflections.ts?raw';
import studioForegroundParallaxTs from './foregroundParallax.ts?raw';
import studioVisualScorecardTs from './visualScorecard.ts?raw';
import studioDirectorSkillExportTs from './directorSkillExport.ts?raw';
import studioVfxEmitterEngineTs from './vfxEmitterEngine.ts?raw';
import studioVfxDistortionPassTs from './vfxDistortionPass.ts?raw';
import studioPapercraftCraftTs from './papercraftCraft.ts?raw';
import studioCatalogSearchIndexTs from './catalogSearchIndex.ts?raw';
import studioStoryRemixEngineTs from './storyRemixEngine.ts?raw';
import studioGranularCharacterLayersTs from './granularCharacterLayers.ts?raw';
import studioLlmMasterGuideBuilderTs from './llmMasterGuideBuilder.ts?raw';
import studioCharacterRiggingTs from './characterRigging.ts?raw';
import studioShotInspectorBridgeTs from './shotInspectorBridge.ts?raw';
import studioShotInspectorPatchApplierTs from './shotInspectorPatchApplier.ts?raw';
import studioShotInspectorHostClientTs from './shotInspectorHostClient.ts?raw';
import studioZipBuilderTs from './zipBuilder.ts?raw';
import stagecraftLlmInstructionsMd from '../../STAGECRAFT_LLM_INSTRUCTIONS.md?raw';
import batchRenderScriptMjs from '../../scripts/render-batch.mjs?raw';
import determinismAuditScriptMjs from '../../scripts/determinism-audit.mjs?raw';
import studioStressTestScriptMjs from '../../scripts/studio-stress-test.mjs?raw';
import compileEpisodeScriptTs from '../../scripts/compile-episode.ts?raw';
import syncLlmDocsScriptTs from '../../scripts/sync-llm-docs.ts?raw';
import runTestsScriptTs from '../../scripts/run-tests.ts?raw';

// Standard IEEE 802.3 CRC-32 table
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

export interface ZipEntryInput {
  path: string;
  content: string;
}

/**
 * Packs UTF-8 text files into a contiguous PKZIP 2.0 byte buffer (STORE mode)
 * with IEEE 802.3 CRC-32 checksums and UTF-8 flags, readable on macOS, Windows, and Linux.
 */
export function buildZipBytes(entries: ZipEntryInput[]): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  const now = new Date();
  const dosTime =
    ((now.getHours() & 0x1f) << 11) |
    ((now.getMinutes() & 0x3f) << 5) |
    ((now.getSeconds() >> 1) & 0x1f);
  const dosDate =
    (((Math.max(1980, now.getFullYear()) - 1980) & 0x7f) << 9) |
    (((now.getMonth() + 1) & 0x0f) << 5) |
    (now.getDate() & 0x1f);

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.path);
    const dataBytes = encoder.encode(entry.content);
    const crc = crc32(dataBytes);

    // Local File Header (30 bytes + filename)
    const lh = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true); // signature PK\x03\x04
    lv.setUint16(4, 20, true); // version needed: 2.0
    lv.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lv.setUint16(8, 0, true); // compression: STORE (0)
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, dataBytes.length, true);
    lv.setUint32(22, dataBytes.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true); // extra length
    lh.set(nameBytes, 30);

    localParts.push(lh, dataBytes);

    // Central Directory Header (46 bytes + filename)
    const ch = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true); // signature PK\x01\x02
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0x0800, true); // UTF-8 flag
    cv.setUint16(10, 0, true); // STORE
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, dataBytes.length, true);
    cv.setUint32(24, dataBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true); // extra
    cv.setUint16(32, 0, true); // comment
    cv.setUint16(34, 0, true); // disk start
    cv.setUint16(36, 0, true); // internal attrs
    cv.setUint32(38, 0, true); // external attrs
    cv.setUint32(42, offset, true); // relative offset of local header
    ch.set(nameBytes, 46);

    centralParts.push(ch);
    offset += lh.length + dataBytes.length;
  }

  let centralSize = 0;
  for (const cp of centralParts) centralSize += cp.length;

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // signature PK\x05\x06
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const archive = new Uint8Array(offset + centralSize + eocd.length);
  let pos = 0;
  for (const lp of localParts) {
    archive.set(lp, pos);
    pos += lp.length;
  }
  for (const cp of centralParts) {
    archive.set(cp, pos);
    pos += cp.length;
  }
  archive.set(eocd, pos);
  return archive;
}

export function buildZipBlob(entries: ZipEntryInput[]): Blob {
  const bytes = buildZipBytes(entries);
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/zip' });
}

const ROOT_README = `# Indian Folklore Machinima Collection (All 3 Engines)

All work neatly arranged into four self-contained folders:

1. \`01_vikram_betaal_16bit_pixel_rpg/\`
   - \`vikram_betaal_stardew_short.html\` — Single self-contained 1080p60 16-bit Stardew Valley-inspired pixel RPG animated short (36s, horizontal-slice SpriteStack, thought-cloud clues, Raag Bhairavi WebAudio, Theatre Mode, WebM capture).
   - Double-click the HTML file in any modern browser.

2. \`02_style_bakeoff_miniature_vs_chiaroscuro/\`
   - Complete 10-second Style Bake-Off comparing Style 1 (Illuminated Indian Miniature & Cutout Puppetry) vs. Style 2 (Bold Chiaroscuro 2D Graphic-Novel Rig) driven by one shared 60fps Director Script.
   - Includes \`BakeoffApp.tsx\`, \`script.ts\`, \`renderStyle1Miniature.ts\`, and \`renderStyle2Chiaroscuro.ts\`.

3. \`03_katha_studio_indian_folklore_engine/\`
   - Full runnable Vite + React + TypeScript + Express project for **Katha Studio** (Deterministic Folklore & World Mythology Machinima Engine covering 12 classical Indian storybooks & epics PLUS 5 global public-domain folklore traditions: Western Aesop & Grimm, East Asian Journey to the West, Southeast Asian Sang Kancil, Americas & Indigenous Legends, and African Anansi Griot Tales).
   - Contains **10 Deterministic 60fps Art Engines**, **Skeletal Micro-Acting & Secondary Cloth Physics**, **40 Cast Archetypes**, **30 Global & Indian Stages**, **40 Animated Hero Props + Custom Cutout Prop upload slot**, **8 Lighting Moods**, **13 Regional World Music & Indian Raag Engines with Broadcast Sidechain Auto-Ducking**, **9 Procedural Folklore SFX**, **Shorts Slicer (9:16) & 3-Variant A/B/C YouTube Thumbnail Studio with 168px Mobile Feed Preview**, **Configurable Multi-Voice Studio**, plus the full **Channel Growth Suite**:
     - **Broadcast MP4 Converter & Offline Batch CLI** (\`POST /api/convert-mp4\` + \`scripts/render-batch.mjs\` with FFmpeg H.264/AAC & EBU R128 \`-14 LUFS\` loudness normalization)
     - **One-Click Multi-Language Build, Typography & Dubbing (19 Languages)** (English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Urdu [RTL], Spanish, Portuguese, French, German, Indonesian, Japanese, Korean, Chinese & Arabic [RTL] with script-aware Noto typography, automatic RTL Canvas direction, CJK/Indic spoken-unit timing, locale-aware TTS, and localized YouTube Launch Packs)
     - **Retention Auditor & Auto-Fixer** (0–100 score + 1-click 3.4s Cold Open Hook injection & pattern-interrupt pacing repair)
     - **Long-Form Anthology & Cozy Bedtime Stitcher** (chain 2–20 chapters with preserved per-chapter art engines, auto YouTube timestamps, and 1-click Sleep Mode)
     - **One-Click BYO-LLM Episode Director** (Gemini, OpenAI, Anthropic, Custom Server via \`/api/llm\`, or browser-direct Local Ollama)
     - **Persistent Channel Universe Cast Bible & Recurring Sutradhar Host** (locked visual identities + 1-click Host Intro & Outro bookends)
     - **YouTube Monetization & YPP Policy Shield** (Channel Upload Diversity Ledger against repetitious-content flags, 1-click Ad-Safe First-30s softener, Transformative Editorial Commentary injector, COPPA RPM-cliff guard & Disclosure checklist)
     - **One-Click YouTube Launch Packager & Multi-Language Audio (MLA) Packager** (5 Ad-Safe High-CTR Titles, timed Description with Public-Domain Transformative Attribution & Chapters, \`.srt\` captions, COPPA-clean SEO Tags, Pinned-Comment Riddle, Community Poll, plus Batch Multi-Language Dubbing & synced \`.WAV\` + \`.SRT\` YouTube MLA ZIP packaging)
     - **Studio Production Suite**: Word-by-Word Kinetic Karaoke Captions (Latin, Indic, RTL Arabic/Urdu & CJK), Direct 1-Click Fast Render to Broadcast \`-14 LUFS\` H.264 MP4, Voice Casting & Music Stem Vault Continuity, Custom Stage Backdrops & Channel Brand Kit (Corner Watermark + 12s YouTube End-Screen Outro), Drag-to-Reorder Timeline + Duplicate/Split Beat + Visual Voice Waveform SFX Timing, On-Canvas Click/Drag Actor & Prop Staging, Portable Self-Contained \`.katha\` Project Archives, and Season Production Board with "Previously On..." Recap Builder
   - Run locally:
     \`\`\`bash
     cd 03_katha_studio_indian_folklore_engine
     npm install
     cp .env.example .env
     npm run dev
     \`\`\`
   - Run offline CLI batch packaging & \`-14 LUFS\` MP4 conversion:
     \`\`\`bash
     node scripts/render-batch.mjs ../04_ai_director_kit_and_episodes/episode_*.json --out ./renders
     \`\`\`

4. \`04_ai_director_kit_and_episodes/\`
   - \`LLM_STORY_STAGE_GUIDE.md\` — Complete LLM Tier & Determinism Guide (Bare Minimum Local 7B–9B, Medium Cloud Flash/Mini/32B, Higher Frontier Pro/Sonnet + TTS pairings), 6 Story Arc Skeletons, all 9 Regional World Playbooks, 6-field Lite format, and Character/Stage Stand-In Table.
   - \`AI_DIRECTOR_SYSTEM_PROMPT.txt\` — Compact Lite Auto-Direct prompt ready to paste into any AI.
   - \`AI_DIRECTOR_FULL_PROMPT.txt\` — Full Pro schema reference for frontier LLMs.
   - Standalone JSON scripts for all 20 ready-to-play chapters across 9 Indian & World folklore shelves.
`;

export function collectAllMachinimaEntries(): ZipEntryInput[] {
  const root = 'indian_folklore_machinimas_bundle';
  const entries: ZipEntryInput[] = [
    { path: `${root}/README.md`, content: ROOT_README },

    // 01. 16-Bit Pixel RPG Short (Standalone HTML)
    {
      path: `${root}/01_vikram_betaal_16bit_pixel_rpg/vikram_betaal_stardew_short.html`,
      content: pixelShortHtml,
    },
    {
      path: `${root}/01_vikram_betaal_16bit_pixel_rpg/README.md`,
      content:
        '# Machinima 01: Vikram & Betaal (16-Bit Pixel RPG Short)\n\nOpen `vikram_betaal_stardew_short.html` directly in Chrome, Edge, Firefox, or Safari.\nControls: Space (Play/Pause), R (Replay), M (Mute/Unmute Raag Bhairavi), T (Theatre Mode, ESC to exit), Record (.webm).\n',
    },

    // 02. Style Bake-Off (Illuminated Miniature vs Bold Chiaroscuro)
    {
      path: `${root}/02_style_bakeoff_miniature_vs_chiaroscuro/README.md`,
      content:
        '# Machinima 02: 10-Second Style Bake-Off (Style 1 Miniature vs Style 2 Chiaroscuro)\n\nRender `BakeoffApp` from `03_katha_studio_indian_folklore_engine/src/bakeoff/BakeoffApp.tsx` inside `src/main.tsx` to launch the interactive Side-by-Side & Split Curtain Bake-Off.\n',
    },
    {
      path: `${root}/02_style_bakeoff_miniature_vs_chiaroscuro/BakeoffApp.tsx`,
      content: bakeoffAppTsx,
    },
    {
      path: `${root}/02_style_bakeoff_miniature_vs_chiaroscuro/script.ts`,
      content: bakeoffScriptTs,
    },
    {
      path: `${root}/02_style_bakeoff_miniature_vs_chiaroscuro/renderStyle1Miniature.ts`,
      content: bakeoffStyle1Ts,
    },
    {
      path: `${root}/02_style_bakeoff_miniature_vs_chiaroscuro/renderStyle2Chiaroscuro.ts`,
      content: bakeoffStyle2Ts,
    },

    // 03. Full Runnable Stagecraft / Katha Studio Project
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/README.md`,
      content: readmeMdRaw,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/AGENTS.md`,
      content: agentsMdRaw,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/.gitattributes`,
      content: gitattributesRaw,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/.github/workflows/ci.yml`,
      content: ciYmlRaw,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/package.json`,
      content: pkgJson,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/.env.example`,
      content: envExample,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/.gitignore`,
      content: gitignoreRaw,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/server.ts`,
      content: serverTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/index.html`,
      content: indexHtml,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/vite.config.ts`,
      content: viteConfigTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/tsconfig.json`,
      content: tsconfigJson,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/metadata.json`,
      content: metadataJson,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/main.tsx`,
      content: mainTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/index.css`,
      content: indexCss,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/App.tsx`,
      content: appTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/types.ts`,
      content: studioTypesTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/i18n.ts`,
      content: studioI18nTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/StudioErrorBoundary.tsx`,
      content: studioErrorBoundaryTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/presets.ts`,
      content: studioPresetsTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/presetsExpanded.ts`,
      content: studioPresetsExpandedTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/presetsWorld.ts`,
      content: studioPresetsWorldTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/presetsMultiGenre.ts`,
      content: studioPresetsMultiGenreTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/audioEngine.ts`,
      content: studioAudioTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/facialExpressions.ts`,
      content: studioFacialExpressionsTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/emotionChoreographer.ts`,
      content: studioEmotionChoreographerTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/renderAssets.ts`,
      content: studioAssetsTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/renderAssetsExpanded.ts`,
      content: studioAssetsExpandedTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/renderAssetsEncyclopedia.ts`,
      content: studioAssetsEncyclopediaTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/renderAssetsWorld.ts`,
      content: studioAssetsWorldTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/renderAssetsUniversal.ts`,
      content: studioAssetsUniversalTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/renderAssetsAtmosphereAtlas.ts`,
      content: studioAssetsAtmosphereAtlasTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/renderAssetsArchetypesAtlas.ts`,
      content: studioAssetsArchetypesAtlasTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/renderAssetsStagesAtlas.ts`,
      content: studioAssetsStagesAtlasTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/renderAssetsPropsAtlas.ts`,
      content: studioAssetsPropsAtlasTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/animationEngine.ts`,
      content: studioAnimationEngineTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/animationPrinciples.ts`,
      content: studioAnimationPrinciplesTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/styleEngines.ts`,
      content: studioStyleEnginesTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/renderer.ts`,
      content: studioRendererTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/thumbnailRenderer.ts`,
      content: studioThumbnailRendererTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/ShortsAndThumbnailModal.tsx`,
      content: studioShortsModalTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/VoiceStudioPanel.tsx`,
      content: studioVoicePanelTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/growthTools.ts`,
      content: studioGrowthToolsTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/monetizationShield.ts`,
      content: studioMonetizationShieldTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/castBible.ts`,
      content: studioCastBibleTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/ChannelGrowthModal.tsx`,
      content: studioGrowthModalTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/AiDirectorPanel.tsx`,
      content: studioAiDirectorTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/llmDirectorKit.ts`,
      content: studioLlmDirectorKitTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/scriptCraft.ts`,
      content: studioScriptCraftTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/projectVault.ts`,
      content: studioProjectVaultTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/offlineRenderer.ts`,
      content: studioOfflineRendererTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/ProjectVaultMenu.tsx`,
      content: studioProjectVaultMenuTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/FastRenderModal.tsx`,
      content: studioFastRenderModalTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/brandKit.ts`,
      content: studioBrandKitTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/timelineUtils.ts`,
      content: studioTimelineUtilsTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/BeatWaveformBar.tsx`,
      content: studioBeatWaveformBarTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/mlaPackager.ts`,
      content: studioMlaPackagerTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/kathaArchive.ts`,
      content: studioKathaArchiveTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/seasonBoard.ts`,
      content: studioSeasonBoardTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/characterDna.ts`,
      content: studioCharacterDnaTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/spriteWorkshopPresets.ts`,
      content: studioSpriteWorkshopPresetsTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/spriteWorkshopPresetsAtlas.ts`,
      content: studioSpriteWorkshopPresetsAtlasTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/modularEntityRenderer.ts`,
      content: studioModularEntityRendererTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/EntityWorkshopModal.tsx`,
      content: studioEntityWorkshopModalTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/longFormEngine.ts`,
      content: studioLongFormEngineTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/backdropGenerator.ts`,
      content: studioBackdropGeneratorTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/LLM_STORY_STAGE_GUIDE.md`,
      content: buildLlmStoryStageGuideMarkdown(),
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/AssetThumb.tsx`,
      content: studioThumbTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/StyleEngineSwatchPicker.tsx`,
      content: studioStyleEngineSwatchPickerTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/BeatMotionAndCuesEditor.tsx`,
      content: studioBeatMotionAndCuesEditorTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/StoryboardTimelineStrip.tsx`,
      content: studioStoryboardTimelineStripTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/storyboardQa.ts`,
      content: studioStoryboardQaTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/StoryboardQaModal.tsx`,
      content: studioStoryboardQaModalTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/voiceEnvelope.ts`,
      content: studioVoiceEnvelopeTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/shortsRecommender.ts`,
      content: studioShortsRecommenderTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/useHeadlessDriver.ts`,
      content: studioUseHeadlessDriverTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/WorkbenchAssetsTab.tsx`,
      content: studioWorkbenchAssetsTabTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/WorkbenchScriptTab.tsx`,
      content: studioWorkbenchScriptTabTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/WorkbenchLookTab.tsx`,
      content: studioWorkbenchLookTabTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/WorkbenchBeatInspector.tsx`,
      content: studioWorkbenchBeatInspectorTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/loudnessMeter.ts`,
      content: studioLoudnessMeterTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/spatialAudio.ts`,
      content: studioSpatialAudioTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/depthOfField.ts`,
      content: studioDepthOfFieldTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/actingMacros.ts`,
      content: studioActingMacrosTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/continuityAuditor.ts`,
      content: studioContinuityAuditorTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/proceduralFoley.ts`,
      content: studioProceduralFoleyTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/cameraKeyframes.ts`,
      content: studioCameraKeyframesTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/CameraCurveMiniEditor.tsx`,
      content: studioCameraCurveMiniEditorTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/dubSyncPackager.ts`,
      content: studioDubSyncPackagerTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/lookPresets.ts`,
      content: studioLookPresetsTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/volumetricLighting.ts`,
      content: studioVolumetricLightingTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/propPhysics.ts`,
      content: studioPropPhysicsTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/kineticCaptions.ts`,
      content: studioKineticCaptionsTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/musicTension.ts`,
      content: studioMusicTensionTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/teleprompterUtils.ts`,
      content: studioTeleprompterUtilsTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/TeleprompterModal.tsx`,
      content: studioTeleprompterModalTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/pacingAnalyzer.ts`,
      content: studioPacingAnalyzerTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/lowerThirds.ts`,
      content: studioLowerThirdsTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/episodeDiff.ts`,
      content: studioEpisodeDiffTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/VersionDiffModal.tsx`,
      content: studioVersionDiffModalTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/studioShortcuts.ts`,
      content: studioShortcutsTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/CommandPaletteModal.tsx`,
      content: studioCommandPaletteModalTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/impactVfx.ts`,
      content: studioImpactVfxTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/spritePrepTools.ts`,
      content: studioSpritePrepToolsTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/SpritePrepModal.tsx`,
      content: studioSpritePrepModalTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/spriteSheetSlicer.ts`,
      content: studioSpriteSheetSlicerTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/surfaceReflections.ts`,
      content: studioSurfaceReflectionsTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/foregroundParallax.ts`,
      content: studioForegroundParallaxTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/visualScorecard.ts`,
      content: studioVisualScorecardTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/directorSkillExport.ts`,
      content: studioDirectorSkillExportTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/vfxEmitterEngine.ts`,
      content: studioVfxEmitterEngineTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/vfxDistortionPass.ts`,
      content: studioVfxDistortionPassTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/papercraftCraft.ts`,
      content: studioPapercraftCraftTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/catalogSearchIndex.ts`,
      content: studioCatalogSearchIndexTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/storyRemixEngine.ts`,
      content: studioStoryRemixEngineTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/granularCharacterLayers.ts`,
      content: studioGranularCharacterLayersTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/llmMasterGuideBuilder.ts`,
      content: studioLlmMasterGuideBuilderTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/characterRigging.ts`,
      content: studioCharacterRiggingTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/shotInspectorBridge.ts`,
      content: studioShotInspectorBridgeTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/shotInspectorPatchApplier.ts`,
      content: studioShotInspectorPatchApplierTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/shotInspectorHostClient.ts`,
      content: studioShotInspectorHostClientTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/studio/zipBuilder.ts`,
      content: studioZipBuilderTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/STAGECRAFT_LLM_INSTRUCTIONS.md`,
      content: stagecraftLlmInstructionsMd,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/scripts/render-batch.mjs`,
      content: batchRenderScriptMjs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/scripts/determinism-audit.mjs`,
      content: determinismAuditScriptMjs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/scripts/studio-stress-test.mjs`,
      content: studioStressTestScriptMjs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/scripts/compile-episode.ts`,
      content: compileEpisodeScriptTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/scripts/sync-llm-docs.ts`,
      content: syncLlmDocsScriptTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/scripts/run-tests.ts`,
      content: runTestsScriptTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/bakeoff/BakeoffApp.tsx`,
      content: bakeoffAppTsx,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/bakeoff/script.ts`,
      content: bakeoffScriptTs,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/bakeoff/renderStyle1Miniature.ts`,
      content: bakeoffStyle1Ts,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/src/bakeoff/renderStyle2Chiaroscuro.ts`,
      content: bakeoffStyle2Ts,
    },
    {
      path: `${root}/03_katha_studio_indian_folklore_engine/public/vikram_betaal_stardew_short.html`,
      content: pixelShortHtml,
    },

    // 04. AI Director Prompt, LLM Story-to-Stage Guide & Ready-to-Use Episode JSONs
    {
      path: `${root}/04_ai_director_kit_and_episodes/README.md`,
      content:
        '# AI Director Kit, LLM Stage Guide & Episode Scripts\n\n- Read `LLM_STORY_STAGE_GUIDE.md` for all 9 Regional Playbooks, the 6-field Lite Storyboard format, and the Character/Stage Stand-In Table.\n- Paste `AI_DIRECTOR_SYSTEM_PROMPT.txt` into any AI (even basic/local 7B LLMs) to generate Lite Storyboard JSONs, then paste or import them into Katha Studio -> AI Script (the JSON Healer & Auto-Director run automatically).\n- Use `AI_DIRECTOR_FULL_PROMPT.txt` for frontier LLMs that want manual control over all 25 per-beat levers.\n',
    },
    {
      path: `${root}/04_ai_director_kit_and_episodes/LLM_STORY_STAGE_GUIDE.md`,
      content: buildLlmStoryStageGuideMarkdown(),
    },
    {
      path: `${root}/04_ai_director_kit_and_episodes/AI_DIRECTOR_SYSTEM_PROMPT.txt`,
      content: buildGuidedDirectorPrompt({ mode: 'lite', beatTarget: 12 }),
    },
    {
      path: `${root}/04_ai_director_kit_and_episodes/AI_DIRECTOR_FULL_PROMPT.txt`,
      content: buildAiDirectorPrompt(),
    },
    ...PRESET_EPISODES.map((ep, idx) => ({
      path: `${root}/04_ai_director_kit_and_episodes/episode_${String(idx + 1).padStart(2, '0')}_${ep.id}.json`,
      content: JSON.stringify(ep, null, 2),
    })),
  ];

  return entries;
}

export function downloadAllMachinimasZip(): { fileCount: number; bytes: number } {
  const entries = collectAllMachinimaEntries();
  const blob = buildZipBlob(entries);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'indian_folklore_machinimas_bundle.zip';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 6000);
  return { fileCount: entries.length, bytes: blob.size };
}
