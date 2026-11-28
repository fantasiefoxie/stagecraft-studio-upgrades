#!/usr/bin/env npx tsx
/**
 * Katha Studio — Automated Regression Test Suite (`npm test`)
 *
 * Covers:
 *  1. LLM JSON Healer + Lite-to-Full Episode Compiler + Schema Validator
 *  2. YouTube YPP Monetization Shield + Twin-Silhouette Cast Diversifier
 *  3. Retention / Mid-Roll Planner + Long-Form Chapter Partitioner
 *  4. Anthology Compiler & Voice Beat-ID Remapping
 *  5. PKZIP 2.0 / MLA `.m4a` & `.wav` Packager + `.katha` Archive Path-Safety
 *  6. 6-Shape Phoneme Visemes (English + Devanagari) & Expression-Driven TTS Prosody
 *  7. Procedural Backdrop / Prop Studio & 4-Act Visual Progression
 *  8. zipBuilder.ts Completeness Audit against real files on disk
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { PRESET_EPISODES } from '../src/studio/presets';
import {
  STAGECRAFT_QA_BUNDLE_SCHEMA,
  STAGECRAFT_STUDIO_VERSION,
  buildStagecraftQaBundle,
  computeDnaSilhouetteSignature,
  hasGranularCharacterDna,
  serializeStagecraftQaBundle,
} from '../src/studio/shotInspectorBridge';
import {
  computePaletteContrastLuma,
  computeSecondaryMotionSway,
  resolveActorGazeVector,
  resolveActorHeadOrientation,
  resolveActorRigForBeat,
} from '../src/studio/characterRigging';
import {
  STAGECRAFT_PATCH_SCHEMA,
  parseStagecraftPatchPayload,
  previewAndApplyStagecraftPatch,
} from '../src/studio/shotInspectorPatchApplier';
import {
  CUTSCENE_QA_BRIDGE_CHANNEL,
  createShotInspectorHostBridge,
  isAllowedBridgeOrigin,
} from '../src/studio/shotInspectorHostClient';
import {
  ARCHETYPE_CATALOG,
  ARCHETYPE_DEFAULT_COLORS,
  CAPTION_STYLE_CATALOG,
  CROWD_CATALOG,
  EXPRESSION_CATALOG,
  EpisodeScript,
  FX_LIST,
  MOOD_CATALOG,
  MOTION_CADENCE_CATALOG,
  MOTION_PROFILE_CATALOG,
  POST_FX_PASS_CATALOG,
  PROP_CATALOG,
  RENDER_STYLE_CATALOG,
  RENDER_STYLE_CATEGORIES,
  SHOT_CATALOG,
  STAGE_CATALOG,
  STUDIO_FPS,
  WEATHER_LIST,
  frameIndexToTime,
  getEpisodeDuration,
  getEpisodeTotalFrames,
  quantizeTimeToStudioFrame,
  resolveBeatActionSfxEvents,
  resolveBeatActionStateAtFrame,
  resolveVisualStyle,
  timeToFrameIndex,
  validateEpisodeScript,
} from '../src/studio/types';
import {
  computeVolumetricLightPlan,
  resolveVolumetricBeamKind,
} from '../src/studio/volumetricLighting';
import { computePropPhysics, resolvePropPhysicsMode } from '../src/studio/propPhysics';
import {
  computeKineticWordPop,
  parseEmphasisTokens,
  resolveSpeakerAccentColor,
  stripEmphasisMarkup,
} from '../src/studio/kineticCaptions';
import {
  computeBoundaryCrossfadeGain,
  computeEpisodeMusicArc,
} from '../src/studio/musicTension';
import {
  buildTeleprompterCueSheet,
  computeTeleprompterProgress,
  evaluateTakePacing,
  formatTakeFileName,
} from '../src/studio/teleprompterUtils';
import { analyzeEpisodePacing, boostFlatBeats } from '../src/studio/pacingAnalyzer';
import {
  autoTagStageChangeLocationCards,
  computeLowerThirdTiming,
} from '../src/studio/lowerThirds';
import {
  computeEpisodeDiff,
  restoreSingleBeatFromCheckpoint,
} from '../src/studio/episodeDiff';
import {
  NLE_SHORTCUT_CATALOG,
  buildStudioCommandRegistry,
  filterStudioCommands,
  isEditableEventTarget,
} from '../src/studio/studioShortcuts';
import { analyzeEpisodeVisualQa, autoFixEpisodeVisualQa } from '../src/studio/storyboardQa';
import {
  computeVoiceEnvelopeFromPcm,
  sampleVoiceProfileAtTime,
  trimAndNormalizePcm,
} from '../src/studio/voiceEnvelope';
import { computeSpeechDuckWindows } from '../src/studio/audioEngine';
import {
  computeActiveWordIndex,
  computeSpeakerCameraOffset,
  computeSpeechWindowViseme,
  drawSafeZoneOverlay,
} from '../src/studio/renderer';
import { applyCinematicJCuts } from '../src/studio/timelineUtils';
import {
  buildShortSliceEpisode,
  recommendTopShortSlices,
} from '../src/studio/shortsRecommender';
import {
  computeDeterministicFlicker,
  getArchetypeKinematics,
  getStyleAnimationGrammar,
  resolveEffectiveMotionFps,
  snapStyleTime,
} from '../src/studio/animationEngine';
import {
  applyAnimationPrinciplesAutoPolish,
  auditEpisodeAnimationPrinciples,
  buildAnimationPrinciplesPromptBlock,
  computeCaptionLowerThirdMotion,
  computeStageMotionArc,
  cubicBezier,
  dampedOvershoot,
  resolveMotionProfileSpec,
  volumeConservingSquash,
} from '../src/studio/animationPrinciples';
import {
  compileLiteOrFullToEpisode,
  healAndParseLlmJson,
} from '../src/studio/llmDirectorKit';
import {
  applyCastVisualDiversifier,
  applyFullYppAutoShield,
  auditEpisodeYppCompliance,
  buildLedgerEntryFromEpisode,
} from '../src/studio/monetizationShield';
import {
  auditEpisodeRetention,
  autoFixRetentionPacing,
  compileEpisodesIntoAnthology,
} from '../src/studio/growthTools';
import { partitionEpisodeIntoChapters } from '../src/studio/longFormEngine';
import { buildMlaLanguagePackZip } from '../src/studio/mlaPackager';
import {
  exportKathaArchiveBytes,
  isSafeArchiveEntryPath,
  parseKathaArchiveBytes,
  readBinaryZipEntries,
} from '../src/studio/kathaArchive';
import {
  buildExpressiveTtsProsody,
  getVisemeAperture,
  resolvePhonemeViseme,
} from '../src/studio/facialExpressions';
import {
  ACT_ARC_PRESETS,
  BACKDROP_THEMES,
  CUSTOM_PROP_PRESETS,
  applyActVisualProgression,
  generateProceduralBackdropDataUrl,
  generateProceduralPropDataUrl,
} from '../src/studio/backdropGenerator';
import {
  BACK_GEAR_CATALOG,
  BODY_MARK_CATALOG,
  EAR_JEWELRY_CATALOG,
  EYEBROW_STYLE_CATALOG,
  EYELASH_STYLE_CATALOG,
  EYEWEAR_CATALOG,
  FACE_MARK_CATALOG,
  FACIAL_HAIR_CATALOG,
  FOOTWEAR_CATALOG,
  GLOVE_CATALOG,
  HAIR_STYLE_CATALOG,
  HEADWEAR_CATALOG,
  MOUTH_STYLE_CATALOG,
  NECKWEAR_CATALOG,
  OUTERWEAR_CATALOG,
  PUPIL_STYLE_CATALOG,
  SLEEVE_CATALOG,
  SURFACE_PATTERN_CATALOG,
  TOP_STYLE_CATALOG,
  WAIST_CATALOG,
  WRISTWEAR_CATALOG,
  computeDnaDistance,
  createBaseDna,
  hydrateArchetypeToDna,
  parseNaturalLanguageDnaTraits,
  randomizeDnaAccessories,
  randomizeDnaFace,
  randomizeDnaOutfit,
  resolveAccessories,
  resolveBodyMarks,
  resolveFaceMorph,
  syncMemberWithDna,
  validateAndNormalizeDna,
} from '../src/studio/characterDna';
import {
  AUTO_SYNC_END_MARKER,
  AUTO_SYNC_START_MARKER,
  buildGuideAutoSyncSectionMd,
  buildStagecraftLlmInstructionsMd,
  computeStudioCatalogFingerprint,
} from '../src/studio/llmMasterGuideBuilder';
import {
  SPRITE_PRESET_CATEGORIES,
  SPRITE_WORKSHOP_PRESETS,
  buildCastMemberFromSpritePreset,
} from '../src/studio/spriteWorkshopPresets';
import {
  MOOD_PALETTES,
  drawActorCloseUp,
  drawActorFullBody,
  drawStageBackdrop,
  drawStoryProp,
} from '../src/studio/renderAssets';
import {
  drawUniversalBeatFx,
  drawUniversalCrowdLayer,
  drawUniversalWeather,
} from '../src/studio/renderAssetsUniversal';
import {
  drawAtlasBeatFx,
  drawAtlasCrowdLayer,
  drawAtlasWeather,
} from '../src/studio/renderAssetsAtmosphereAtlas';
import {
  drawModularEntityCloseUp,
  drawModularEntityFullBody,
} from '../src/studio/modularEntityRenderer';
import {
  measurePcmLoudness,
  normalizePcmLufs,
} from '../src/studio/loudnessMeter';
import {
  computeSpatialPanForBeat,
  generateDeterministicImpulsePcm,
  getStageRoomAcoustics,
} from '../src/studio/spatialAudio';
import {
  computeBeatDepthOfFieldSpec,
  getDofPoolAllocationCount,
} from '../src/studio/depthOfField';
import {
  ACTING_MACRO_CATALOG,
  applyActingMacroToBeat,
} from '../src/studio/actingMacros';
import {
  auditEpisodeContinuity,
  autoFixEpisodeContinuity,
  measureDialogueReadingRate,
} from '../src/studio/continuityAuditor';
import { planBeatFoleyEvents } from '../src/studio/proceduralFoley';
import {
  attackHoldDecay,
  computeHitstopState,
  drawImpactShockOverlay,
} from '../src/studio/impactVfx';
import {
  addSpriteOutlineRgba,
  getMoodPaletteHexes,
  processSpriteRgbaPipeline,
  quantizeAndPixelizeRgba,
  removeFlatBackgroundRgba,
} from '../src/studio/spritePrepTools';
import {
  computeSpriteSheetFrameRect,
  detectGridHint,
  normalizeSpriteSheetConfig,
} from '../src/studio/spriteSheetSlicer';
import {
  drawGroundedShadowAndReflection,
  getStageReflectionProfile,
} from '../src/studio/surfaceReflections';
import {
  ForegroundMotifId,
  classifyForegroundFrame,
  drawForegroundParallaxLayer,
} from '../src/studio/foregroundParallax';
import {
  formatVisualScorecardMarkdown,
  scoreEpisodeVisualCraft,
} from '../src/studio/visualScorecard';
import {
  buildRoutedDirectorSkillMd,
  buildStagecraftDirectorSkillMd,
  ENGINE_CRAFT_MATRIX,
  ANTI_SLOP_CRITIQUE_CHECKLIST,
} from '../src/studio/directorSkillExport';
import {
  drawAnalyticalBeatVfxLayer,
  drawAnalyticalRibbonTrail,
  drawAnalyticalVfxRing,
  evalThreePointFCurve,
  hashVfxSeed,
  sampleAnalyticalParticle,
} from '../src/studio/vfxEmitterEngine';
import {
  applyPooledShockwaveDistortion,
  computeShockwaveDistortionSpec,
  getDistortionPoolAllocationCount,
} from '../src/studio/vfxDistortionPass';
import {
  applyPooledTiltShiftBand,
  computePopupHingeTransform,
  drawCardstockCutBevel,
  drawPapercraftLayeredShadow,
  drawPopupFoldTransition,
  getTiltShiftPoolAllocationCount,
} from '../src/studio/papercraftCraft';
import {
  getCatalogIndexSize,
  recommendScenePaletteForPrompt,
  searchStudioCatalog,
} from '../src/studio/catalogSearchIndex';
import {
  STORY_REMIX_BLUEPRINTS,
  remixStoryBlueprint,
} from '../src/studio/storyRemixEngine';
import { TRANSITION_CATALOG } from '../src/studio/types';
import {
  CAMERA_KEYFRAME_PRESETS,
  composeCameraWithKeyframes,
  evaluateCameraKeyframes,
  normalizeCameraKeyframes,
} from '../src/studio/cameraKeyframes';
import {
  buildDubSyncPackageZipBytes,
  buildMlaTrackManifest,
  computeDubTimingPlan,
  generateSyncedSrt,
  generateSyncedWebVtt,
  generateYouTubeChaptersText,
} from '../src/studio/dubSyncPackager';
import {
  createLookRecipe,
  duplicateLookRecipe,
  exportLookRecipesJson,
  importLookRecipesJson,
} from '../src/studio/lookPresets';

interface TestCase {
  name: string;
  run: () => void | Promise<void>;
}

const tests: TestCase[] = [];
function test(name: string, run: () => void | Promise<void>) {
  tests.push({ name, run });
}

function clone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val)) as T;
}

// ---------------------------------------------------------------------------
// 1. LLM JSON Healer + Lite-to-Full Compiler
// ---------------------------------------------------------------------------
test('LLM JSON healer & Lite compiler turn messy fenced storyboard into valid EpisodeScript', () => {
  const messyLlmResponse = `Sure! Here is your episode:
\`\`\`json
{
  "title": "The Fox and the Midnight Drum",
  "series": "Panchatantra Tales",
  "region": "indian_folklore",
  "cast": [
    { "id": "fox", "name": "Chatur Fox", "role": "clever fox", "color": "#d97706" },
    { "id": "lion", "name": "Raja Sher", "role": "mighty lion", "color": "#b45309" },
  ],
  "scenes": [
    {
      "speaker": "fox",
      "line": "What booms behind the banyan roots when the wind rises?",
      "stage": "dark forest",
      "mood": "mysterious",
      "emotion": "curious",
      "prop": "lantern",
    },
    {
      "speaker": "lion",
      "line": "Only an empty drum! Fear fades the moment we inspect the truth.",
      "stage": "banyan_clearing",
      "emotion": "joy",
    },
  ],
}
\`\`\``;

  const healed = healAndParseLlmJson(messyLlmResponse);
  assert.equal(healed.ok, true, 'Expected JSON healer to recover markdown + trailing commas');
  if (!healed.ok) return;

  const compiled = compileLiteOrFullToEpisode(healed.data);
  assert.equal(compiled.ok, true, 'Expected Lite compiler to produce valid EpisodeScript');
  if (!compiled.ok) return;

  const validated = validateEpisodeScript(compiled.script);
  assert.equal(validated.ok, true, 'Compiled episode must pass strict schema validation');
  assert.ok(compiled.script.beats.length >= 2, 'Should contain compiled story beats');
  assert.equal(compiled.script.cast.length, 2);
});

// ---------------------------------------------------------------------------
// 2. YouTube YPP Monetization Shield & Twin-Silhouette Diversifier
// ---------------------------------------------------------------------------
test('YPP Auto-Shield softens ad-safety terms, injects commentary & diversifies twin silhouettes', () => {
  const ep = clone(PRESET_EPISODES[0]);
  // Inject ad-safety trigger + create twin cast DNA matching ledger
  ep.beats[0].dialogue = 'A bloody murder curse haunts the cursed palace!';
  const baseDna = createBaseDna('humanoid');
  ep.cast[0] = syncMemberWithDna(ep.cast[0], baseDna);
  const priorEpisodeEntry = {
    ...buildLedgerEntryFromEpisode(ep),
    id: 'prior_published_ep_001',
  };
  const ledger = [priorEpisodeEntry];

  const beforeAudit = auditEpisodeYppCompliance(ep, { ledger });
  assert.ok(beforeAudit.score < 100, 'Expected YPP audit to flag issues before auto-shield');

  const shielded = applyFullYppAutoShield(ep, ledger);
  assert.ok(shielded.changed && shielded.summary.length > 0, 'Auto-shield should report applied remediation actions');
  assert.ok(
    !shielded.episode.beats[0].dialogue.toLowerCase().includes('murder'),
    'Ad-safety softener should replace flagged violence term'
  );

  const diversified = applyCastVisualDiversifier(ep, ledger, []);
  assert.ok(diversified.diversifiedNames.length > 0, 'Cast diversifier should mutate colliding silhouette');
  assert.notDeepEqual(
    diversified.episode.cast[0].dna,
    ep.cast[0].dna,
    'Diversified cast DNA must differ from twin ledger silhouette'
  );
});

// ---------------------------------------------------------------------------
// 3. Retention / Mid-Roll Planner & Long-Form Chapter Partitioner
// ---------------------------------------------------------------------------
test('Long-form episode partitions cleanly into chapters and triggers mid-roll retention slots', () => {
  const base = clone(PRESET_EPISODES[0]);
  // Expand to ~11 minutes (660s) of beats
  const expandedBeats = [];
  for (let rep = 0; rep < 14; rep++) {
    for (const b of base.beats) {
      expandedBeats.push({
        ...clone(b),
        id: `${b.id}_r${rep}`,
        duration: 7.5,
      });
    }
  }
  const longEp: EpisodeScript = {
    ...base,
    id: 'test_long_11m',
    beats: expandedBeats,
  };

  const totalSec = getEpisodeDuration(longEp);
  assert.ok(totalSec >= 540, `Expected >= 9 min episode, got ${totalSec}s`);

  const chapters = partitionEpisodeIntoChapters(longEp, 200);
  assert.ok(chapters.length >= 3, `Expected >= 3 chapters for ${totalSec}s episode, got ${chapters.length}`);
  assert.equal(chapters[0].startBeatIdx, 0);
  assert.equal(chapters[chapters.length - 1].endBeatIdx, longEp.beats.length - 1);

  const retention = auditEpisodeRetention(longEp);
  assert.ok(retention.recommendedMidRolls.length >= 1, '8+ min episode should produce mid-roll break suggestions');

  const fixed = autoFixRetentionPacing(longEp);
  assert.ok(fixed.beats.length >= longEp.beats.length, 'Auto-fix retention should preserve or enhance beats');
});

// ---------------------------------------------------------------------------
// 4. Anthology Compiler & Voice Remapping
// ---------------------------------------------------------------------------
test('Anthology compiler merges episodes and remaps beat IDs cleanly for voice preservation', () => {
  const epA = clone(PRESET_EPISODES[0]);
  const epB = clone(PRESET_EPISODES[1]);

  const compiled = compileEpisodesIntoAnthology([epA, epB], {
    anthologyTitle: 'Midnight Folk Anthology',
    bedtimeMode: false,
    includeBumpers: true,
  });
  assert.ok(compiled.episode.beats.length > epA.beats.length + epB.beats.length - 1);
  assert.ok(compiled.beatOriginMap.length >= epA.beats.length + epB.beats.length);

  const targetIds = new Set(compiled.episode.beats.map((b) => b.id));
  for (const mapping of compiled.beatOriginMap) {
    assert.ok(
      targetIds.has(mapping.newBeatId),
      `Mapped newBeatId ${mapping.newBeatId} must exist in compiled anthology`
    );
  }
});

// ---------------------------------------------------------------------------
// 5. PKZIP 2.0, MLA .m4a/.wav Packager & .katha Archive Security
// ---------------------------------------------------------------------------
test('MLA packager writes valid .m4a and .wav ZIP entries and .katha rejects traversal paths', () => {
  const ep = clone(PRESET_EPISODES[0]);
  const fakeM4a = new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]);
  const fakeWav = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00]);

  const zipBytes = buildMlaLanguagePackZip([
    {
      langCode: 'en',
      episode: ep,
      audioBytes: fakeM4a,
      audioExt: 'm4a',
    },
    {
      langCode: 'hi',
      episode: ep,
      audioBytes: fakeWav,
      audioExt: 'wav',
    },
  ]);

  const entries = readBinaryZipEntries(zipBytes);
  const paths = [...entries.keys()];
  assert.ok(paths.some((p) => p.endsWith('_en_audio_mix.m4a')), 'Expected .m4a entry in MLA ZIP');
  assert.ok(paths.some((p) => p.endsWith('_hi_audio_mix.wav')), 'Expected .wav entry in MLA ZIP');
  assert.ok(paths.some((p) => p.endsWith('README_YOUTUBE_MLA.txt')), 'Expected MLA guide README');

  // Path traversal security check
  assert.equal(isSafeArchiveEntryPath('../etc/passwd'), false);
  assert.equal(isSafeArchiveEntryPath('/abs/path.json'), false);
  assert.equal(isSafeArchiveEntryPath('voices/b1.wav'), true);

  // Round-trip .katha portable archive
  const kathaBytes = exportKathaArchiveBytes({
    version: 1,
    exportedAt: Date.now(),
    episode: ep,
    aspect: '16:9',
    voices: [
      {
        slotKey: ep.beats[0].id,
        fileName: 'v1.wav',
        mimeType: 'audio/wav',
        duration: 4.5,
        bytes: fakeWav,
      },
    ],
    musicStem: null,
  });
  const parsed = parseKathaArchiveBytes(kathaBytes);
  assert.equal(parsed.episode.id, ep.id);
  assert.equal(parsed.voices.length, 1);
  assert.equal(parsed.voices[0].bytes.byteLength, fakeWav.byteLength);
});

// ---------------------------------------------------------------------------
// 6. 6-Shape Phoneme Visemes & Expression-Driven TTS Prosody
// ---------------------------------------------------------------------------
test('6-shape phoneme lip-sync covers shapes 0..5 across Latin & Devanagari and prosody adapts to expression', () => {
  const seen = new Set<number>();
  const sampleText = 'Mama! Behold the vast, solemn ocean of victory — धर्म और सत्य!';
  for (let i = 0; i <= 120; i++) {
    const v = resolvePhonemeViseme(sampleText, i / 120, 0.85);
    assert.ok(v >= 0 && v <= 5, `Viseme ${v} must stay in 0..5`);
    const ap = getVisemeAperture(v);
    assert.ok(ap >= 0 && ap <= 3.0, `Aperture ${ap} must stay in 0..3.0`);
    seen.add(v);
  }
  assert.ok(seen.has(1), 'Should detect bilabial M/B/P viseme (1)');
  assert.ok(seen.has(2), 'Should detect wide E/I viseme (2)');
  assert.ok(seen.has(3), 'Should detect open A viseme (3)');
  assert.ok(seen.has(4), 'Should detect rounded O/U viseme (4)');
  assert.ok(seen.has(5), 'Should detect dental/fricative F/V/S viseme (5)');
  assert.equal(resolvePhonemeViseme(sampleText, 0.5, 0.01), 0, 'Silence energy must return closed rest (0)');

  const ep = clone(PRESET_EPISODES[0]);
  const angryBeat = clone(ep.beats[0]);
  angryBeat.dialogue = 'Halt! How dare you betray the sacred oath?!';
  angryBeat.expressionCues = undefined;
  angryBeat.actors[0].expression = 'angry';
  angryBeat.actors[0].expressionTrack = undefined;
  angryBeat.speakerId = angryBeat.actors[0].castId;

  const griefBeat = clone(ep.beats[0]);
  griefBeat.dialogue = 'Alas... the lamp has gone dark forever.';
  griefBeat.expressionCues = undefined;
  griefBeat.actors[0].expression = 'grief';
  griefBeat.actors[0].expressionTrack = undefined;
  griefBeat.speakerId = griefBeat.actors[0].castId;

  const angryProsody = buildExpressiveTtsProsody(angryBeat, 'Regal storyteller', 1.0);
  const griefProsody = buildExpressiveTtsProsody(griefBeat, 'Regal storyteller', 1.0);

  assert.equal(angryProsody.expression, 'angry');
  assert.equal(griefProsody.expression, 'grief');
  assert.ok(angryProsody.speed > griefProsody.speed, 'Angry delivery should pace faster than grief');
  assert.notEqual(angryProsody.style, griefProsody.style);
});

// ---------------------------------------------------------------------------
// 7. Procedural Backdrop / Prop Studio & 4-Act Visual Progression
// ---------------------------------------------------------------------------
test('Procedural backdrop/prop studio & 4-Act Visual Arc produce deterministic valid outputs', () => {
  const plate1 = generateProceduralBackdropDataUrl({ theme: 'eclipse_lotus_courtyard', seed: 42 });
  const plate2 = generateProceduralBackdropDataUrl({ theme: 'eclipse_lotus_courtyard', seed: 42 });
  assert.equal(plate1.dataUrl, plate2.dataUrl, 'Same seed must be 100% deterministic');
  assert.ok(plate1.dataUrl.startsWith('data:image/'), 'Backdrop must return valid image data URL');

  const prop = generateProceduralPropDataUrl({ preset: 'crystal_orb', seed: 7 });
  assert.ok(prop.dataUrl.startsWith('data:image/'), 'Prop cutout must return valid image data URL');

  const ep = clone(PRESET_EPISODES[0]);
  const res = applyActVisualProgression(ep, 'mythic_odyssey');
  const sumActs = res.actCounts.reduce((a, b) => a + b, 0);
  assert.ok(sumActs >= 1, '4-Act Visual Progression should style narrative beats');
  const moods = new Set(res.episode.beats.map((b) => b.mood));
  assert.ok(moods.size >= 2, '4-Act Visual Progression should introduce lighting variety across acts');
});

// ---------------------------------------------------------------------------
// 8. zipBuilder.ts Source Bundle Completeness Audit
// ---------------------------------------------------------------------------
test('zipBuilder.ts stays 100% synced with all src/studio and scripts source files on disk', () => {
  const rootDir = process.cwd();
  const zipBuilderSource = fs.readFileSync(path.join(rootDir, 'src/studio/zipBuilder.ts'), 'utf8');

  const studioFiles = fs
    .readdirSync(path.join(rootDir, 'src/studio'))
    .filter((f) => /\.(ts|tsx)$/.test(f));

  const missingStudio = studioFiles.filter((file) => !zipBuilderSource.includes(`src/studio/${file}`));
  assert.deepEqual(
    missingStudio,
    [],
    `zipBuilder.ts is missing studio files: ${missingStudio.join(', ')}`
  );

  const scriptFiles = fs
    .readdirSync(path.join(rootDir, 'scripts'))
    .filter((f) => /\.(ts|mjs)$/.test(f));

  const missingScripts = scriptFiles.filter((file) => !zipBuilderSource.includes(`scripts/${file}`));
  assert.deepEqual(
    missingScripts,
    [],
    `zipBuilder.ts is missing script files: ${missingScripts.join(', ')}`
  );
});

// ---------------------------------------------------------------------------
// 9. 20 Multi-Genre Art Engines, Motion Cadence, Flicker & Fuzzy Style Aliases
// ---------------------------------------------------------------------------
test('All 20 art engines, 4 categories, motion cadence quantization, flicker & fuzzy style routing work cleanly', () => {
  assert.equal(RENDER_STYLE_CATALOG.length, 20, 'Expected exactly 20 art engines in RENDER_STYLE_CATALOG');
  assert.equal(RENDER_STYLE_CATEGORIES.length, 4, 'Expected 4 genre categories in RENDER_STYLE_CATEGORIES');
  assert.equal(MOTION_CADENCE_CATALOG.length, 4, 'Expected 4 motion cadence options (auto/60/24/12)');

  const categoryIds = new Set<string>(RENDER_STYLE_CATEGORIES);
  const seenIds = new Set<string>();
  for (const engine of RENDER_STYLE_CATALOG) {
    assert.ok(!seenIds.has(engine.id), `Duplicate renderStyle id: ${engine.id}`);
    seenIds.add(engine.id);
    assert.ok(categoryIds.has(engine.category), `Invalid category ${engine.category} on ${engine.id}`);
    const grammar = getStyleAnimationGrammar(engine.id);
    assert.ok(grammar.fps > 0 && grammar.fps <= 60, `Invalid fps for ${engine.id}`);
    const flicker = computeDeterministicFlicker(1.37, engine.id, 'twilight_temple');
    assert.ok(flicker >= 0.85 && flicker <= 1.15, `Flicker ${flicker} out of bounds for ${engine.id}`);
  }

  // Motion cadence quantization checks
  assert.equal(resolveEffectiveMotionFps('chiaroscuro', '60fps'), 60);
  assert.equal(resolveEffectiveMotionFps('chiaroscuro', '24fps'), 24);
  assert.equal(resolveEffectiveMotionFps('chiaroscuro', '12fps'), 12);
  assert.equal(resolveEffectiveMotionFps('felt_puppet', 'auto'), 12);
  assert.equal(snapStyleTime(1.03, 'chiaroscuro', '60fps'), 1.03);
  assert.equal(
    snapStyleTime(1.03, 'chiaroscuro', '12fps'),
    Math.floor(1.03 * 12) / 12,
    '12fps cadence should quantize time cleanly to 1/12s steps'
  );

  // Backward compatibility default for visualStyle without motionCadence
  const resolved = resolveVisualStyle({ renderStyle: 'risograph_print' });
  assert.equal(resolved.renderStyle, 'risograph_print');
  assert.equal(resolved.motionCadence, 'auto');

  // Verify fuzzy style matching in Lite compiler for all 10 new engines
  const aliasPairs: Array<[string, string]> = [
    ['anime sakuga', 'anime_cel'],
    ['manga gpen comic', 'manga_screentone'],
    ['technical blueprint schematic', 'blueprint_technical'],
    ['matte gouache editorial', 'gouache_storybook'],
    ['neon synthwave scifi', 'neon_cybernoir'],
    ['stitched wool felt puppet', 'felt_puppet'],
    ['risograph halftone zine', 'risograph_print'],
    ['backlit desert sand art', 'backlit_sand'],
    ['scratchboard noir engraving', 'scratchboard_noir'],
    ['byzantine gold mosaic', 'byzantine_mosaic'],
  ];

  for (const [alias, expectedStyle] of aliasPairs) {
    const compiled = compileLiteOrFullToEpisode({
      title: `Test ${expectedStyle}`,
      series: 'Stagecraft Test',
      style: alias,
      cast: [{ id: 'hero', name: 'Asha', role: 'hero' }],
      scenes: [{ speaker: 'hero', line: 'Testing our new art engine!', stage: 'courtyard' }],
    });
    assert.equal(compiled.ok, true, `Expected alias "${alias}" to compile`);
    if (compiled.ok) {
      assert.equal(
        compiled.script.visualStyle?.renderStyle,
        expectedStyle,
        `Expected "${alias}" to resolve to ${expectedStyle}`
      );
      assert.equal(validateEpisodeScript(compiled.script).ok, true);
    }
  }
});

// ---------------------------------------------------------------------------
// 10. Multi-Genre Showcase Presets (Explainer, Sci-Fi Noir, Manga, Felt Puppet)
// ---------------------------------------------------------------------------
test('All 4 multi-genre showcase presets pass schema validation and cover all 4 showcase engines', () => {
  const expected: Array<[string, string]> = [
    ['quantum_tunneling_explainer', 'blueprint_technical'],
    ['neon_sector_9_short', 'neon_cybernoir'],
    ['clockwork_detective_clue', 'manga_screentone'],
    ['pip_lantern_maker_night', 'felt_puppet'],
  ];

  for (const [id, expectedStyle] of expected) {
    const ep = PRESET_EPISODES.find((item) => item.id === id);
    assert.ok(ep, `Missing multi-genre showcase preset: ${id}`);
    assert.equal(ep.shelf, 'Modern Multi-Genre Showcases');
    assert.equal(ep.visualStyle?.renderStyle, expectedStyle);
    const validation = validateEpisodeScript(ep);
    assert.equal(
      validation.ok,
      true,
      `Preset ${id} failed schema validation: ${validation.ok ? '' : validation.error}`
    );
    assert.ok(ep.beats.length >= 5, `Expected at least 5 beats in ${id}`);
  }
});

// ---------------------------------------------------------------------------
// 11. Disney's 12 Principles of Animation Engine & Auto-Polish
// ---------------------------------------------------------------------------
test('12 Principles engine enforces constant-volume squash, bezier easing, damped overshoot, curved arcs, lower-third timing & auto-polish', () => {
  assert.equal(MOTION_PROFILE_CATALOG.length, 5, 'Expected 5 motion profiles (auto + 4 philosophies)');

  // 1. Strict constant-volume Squash & Stretch (scaleX * scaleY === 1)
  for (const amount of [-0.3, -0.14, 0, 0.12, 0.28]) {
    const { scaleX, scaleY } = volumeConservingSquash(amount);
    assert.ok(
      Math.abs(scaleX * scaleY - 1) < 1e-6,
      `Expected constant volume scaleX*scaleY===1 for amount=${amount}, got ${scaleX * scaleY}`
    );
  }

  // 2. Cubic-bezier Slow In / Slow Out endpoints and non-linear midpoint
  assert.equal(cubicBezier(0.22, 1.0, 0.36, 1.0, 0), 0);
  assert.equal(cubicBezier(0.22, 1.0, 0.36, 1.0, 1), 1);
  const easedMid = cubicBezier(0.22, 1.0, 0.36, 1.0, 0.5);
  assert.ok(easedMid > 0.7 && easedMid < 0.99, `Expected snappy ease-out midpoint, got ${easedMid}`);

  // 3. Damped elastic overshoot starts at 0 and decays cleanly
  assert.equal(dampedOvershoot(0, 3.0, 5.0, 0.5), 0);
  const earlyPeak = Math.abs(dampedOvershoot(0.08, 3.0, 5.0, 0.5));
  const lateTail = Math.abs(dampedOvershoot(1.6, 3.0, 5.0, 0.5));
  assert.ok(earlyPeak > 0.01 && lateTail < earlyPeak * 0.1, 'Expected damped overshoot to decay cleanly');

  // 4. Curved stage motion arcs & reverse anticipation wind-up
  const cartoonSpec = resolveMotionProfileSpec('snappy_cartoon', 'anime_cel');
  const earlyStep = computeStageMotionArc('step_forward', 0.06, cartoonSpec);
  const midStep = computeStageMotionArc('step_forward', 0.55, cartoonSpec);
  assert.ok(earlyStep.progress < 0, `Expected reverse anticipation on step_forward, got ${earlyStep.progress}`);
  assert.ok(midStep.arcOffsetY < -4, `Expected upward curved arc mid-stride, got ${midStep.arcOffsetY}`);

  // 5. Lower-third caption timing (smooth entry and exit)
  const capStart = computeCaptionLowerThirdMotion(0.0, 4.0, cartoonSpec);
  const capMid = computeCaptionLowerThirdMotion(2.0, 4.0, cartoonSpec);
  const capEnd = computeCaptionLowerThirdMotion(3.98, 4.0, cartoonSpec);
  assert.ok(capStart.alpha < 0.1 && capMid.alpha === 1 && capEnd.alpha < 0.25);

  // 6. All 5 profiles resolve cleanly and backward-compat visualStyle defaults motionProfile to 'auto'
  for (const prof of MOTION_PROFILE_CATALOG) {
    const spec = resolveMotionProfileSpec(prof.id, 'chiaroscuro');
    assert.ok(spec.followThroughFrames >= 4 && spec.followThroughFrames <= 8);
  }
  assert.equal(resolveVisualStyle({ renderStyle: 'chiaroscuro' }).motionProfile, 'auto');

  // 7. 12-Principles Audit & 1-Click Auto-Polish upgrades a flat static episode
  const baseEp = PRESET_EPISODES[0];
  const flatEp: EpisodeScript = {
    ...baseEp,
    beats: baseEp.beats.slice(0, 5).map((b) => ({
      ...b,
      duration: 4.0,
      shot: 'wide_stage',
      cameraMove: 'still',
      weather: 'none',
      prop: 'none',
      sfx: 'none',
      actors: b.actors.map((a) => ({ ...a, motion: 'still', expression: 'calm', expressionTrack: undefined })),
    })),
  };
  const beforeAudit = auditEpisodeAnimationPrinciples(flatEp);
  const polished = applyAnimationPrinciplesAutoPolish(flatEp);
  const afterAudit = auditEpisodeAnimationPrinciples(polished.episode);
  assert.ok(
    afterAudit.overallScore > beforeAudit.overallScore,
    `Expected auto-polish to raise 12-Principles score (${beforeAudit.overallScore} -> ${afterAudit.overallScore})`
  );
  assert.equal(validateEpisodeScript(polished.episode).ok, true);
  assert.ok(buildAnimationPrinciplesPromptBlock().includes('TIMING CONTRAST'));
});

// ---------------------------------------------------------------------------
// 12. Frame-Index Lock, Sub-Beat Action Cues, Post-FX Passes & Kinetic Motion Card
// ---------------------------------------------------------------------------
test('Integer frame-index clock, O(1) sub-beat action cues, Post-FX passes & motion_card shot validate deterministically', () => {
  // 1. Canonical integer frame-index clock round-trip
  assert.equal(timeToFrameIndex(1.5, STUDIO_FPS), 90);
  assert.equal(frameIndexToTime(90, STUDIO_FPS), 1.5);
  assert.equal(quantizeTimeToStudioFrame(1.5002, STUDIO_FPS), 1.5);
  const qtEp = PRESET_EPISODES.find((ep) => ep.id === 'quantum_tunneling_explainer');
  assert.ok(qtEp, 'Missing quantum_tunneling_explainer showcase preset');
  assert.equal(
    getEpisodeTotalFrames(qtEp, STUDIO_FPS),
    Math.round(getEpisodeDuration(qtEp) * STUDIO_FPS)
  );

  // 2. O(1) Sub-Beat Action Cue resolution (triggerPhrase + frame bounds)
  const testBeat = {
    duration: 4.0,
    dialogue: 'Wait until the golden shield shatters right before your eyes!',
    actionCues: [
      { frame: 30, endFrame: 90, castId: 'hero', pose: 'attack' as const, cameraPunch: 0.8, fx: 'shock_burst' as const },
      { triggerPhrase: 'golden shield', castId: 'hero', propPulse: 0.9 },
    ],
  };
  const beforeCue = resolveBeatActionStateAtFrame(testBeat, 10);
  assert.equal(beforeCue.actorPoseOverrides.hero, undefined);
  assert.equal(beforeCue.cameraPunch, 0);
  const duringCue = resolveBeatActionStateAtFrame(testBeat, 34);
  assert.equal(duringCue.actorPoseOverrides.hero, 'attack');
  assert.ok(duringCue.cameraPunch > 0.2, `Expected cameraPunch impulse > 0.2, got ${duringCue.cameraPunch}`);
  assert.equal(duringCue.fxOverride, 'shock_burst');
  const afterRange = resolveBeatActionStateAtFrame(testBeat, 150);
  assert.equal(afterRange.actorPoseOverrides.hero, undefined);

  // 3. Post-FX Pass catalog & backward-compatible default
  assert.equal(POST_FX_PASS_CATALOG.length, 6, 'Expected 6 Post-FX pass presets');
  assert.equal(resolveVisualStyle({ renderStyle: 'chiaroscuro' }).postFxPass, 'none');
  assert.equal(
    resolveVisualStyle({ renderStyle: 'chiaroscuro', postFxPass: 'bayer_dither' }).postFxPass,
    'bayer_dither'
  );

  // 4. Kinetic Motion Card shot catalog, preset & validator support
  assert.ok(SHOT_CATALOG.some((s) => s.id === 'motion_card'), 'Expected motion_card in SHOT_CATALOG');
  const cardBeat = qtEp.beats.find((b) => b.shot === 'motion_card');
  assert.ok(cardBeat && cardBeat.motionCard?.metric === '100%', 'Expected motion_card beat in explainer preset');
  const validated = validateEpisodeScript({
    ...qtEp,
    visualStyle: { ...(qtEp.visualStyle || {}), postFxPass: 'pixel_grid_16bit' },
  });
  assert.equal(validated.ok, true);
  if (validated.ok) {
    assert.equal(validated.script.visualStyle?.postFxPass, 'pixel_grid_16bit');
    assert.ok(validated.script.beats.some((b) => b.shot === 'motion_card'));
    assert.ok(validated.script.beats.some((b) => (b.actionCues?.length || 0) > 0));
  }
});

// ---------------------------------------------------------------------------
// 13. Action-Cue SFX Sync, Smarter Auto-Director, Visual QA Gate & CLI Audio Mux
// ---------------------------------------------------------------------------
test('Action-Cue SFX sync, Auto-Director choreography, Visual QA Gate & Headless CLI audio mux work cleanly', () => {
  // 1. Frame-locked Action-Cue SFX event extraction & ordering
  const sfxBeat = {
    duration: 4.0,
    dialogue: 'Wait until the golden shield shatters right now!',
    actionCues: [
      { frame: 120, sfx: 'thunder_crack' as const },
      { frame: 30, sfx: 'sword_clash' as const },
      { frame: 60, cameraPunch: 0.6 }, // no SFX, should be skipped
    ],
  };
  const sfxEvents = resolveBeatActionSfxEvents(sfxBeat);
  assert.equal(sfxEvents.length, 2, 'Expected exactly 2 SFX events');
  assert.equal(sfxEvents[0].sfx, 'sword_clash');
  assert.equal(sfxEvents[0].offsetSec, 0.5);
  assert.equal(sfxEvents[1].sfx, 'thunder_crack');
  assert.equal(sfxEvents[1].offsetSec, 2.0);

  // 2. Smarter Auto-Director: motionProfile, auto-motion_card, auto-actionCues & explicit preservation
  const compiled = compileLiteOrFullToEpisode({
    title: 'Quantum Shield Breakthrough',
    series: 'Science Explainers',
    style: 'blueprint_technical',
    cast: [{ id: 'doc', name: 'Dr. Meera', role: 'sage' }],
    scenes: [
      { speaker: 'doc', line: 'Welcome to the quantum lab where light bends.', stage: 'royal_durbar' },
      { speaker: 'doc', line: 'Nearly 99.4% of particles bounce off the classic wall.', stage: 'royal_durbar' },
      {
        speaker: 'doc',
        line: 'Suddenly the barrier shatters and the wave tunnels through!',
        stage: 'royal_durbar',
        prop: 'lightning_bolt',
      },
      {
        speaker: 'doc',
        line: 'Explicit cue test.',
        stage: 'royal_durbar',
        actionCues: [{ frame: 45, castId: 'doc', pose: 'gesture', sfx: 'mystic_chime', cameraPunch: 0.7 }],
      },
    ],
  });
  assert.equal(compiled.ok, true, 'Expected Lite explainer script to compile cleanly');
  if (compiled.ok) {
    assert.equal(compiled.script.visualStyle?.motionProfile, 'motion_graphics');
    assert.equal(
      compiled.script.beats[1].shot,
      'motion_card',
      'Expected numeric-stat beat in blueprint_technical to auto-promote to motion_card'
    );
    assert.equal(compiled.script.beats[1].motionCard?.metric, '99.4%');
    assert.ok(
      (compiled.script.beats[2].actionCues?.length || 0) >= 1,
      'Expected dramatic climax beat to auto-choreograph an actionCue'
    );
    assert.equal(compiled.script.beats[3].actionCues?.[0]?.sfx, 'mystic_chime');
  }

  // 3. Pre-Render Visual QA Gate: clean preset passes, faulty beat & pixel anomalies caught
  const cleanEp = PRESET_EPISODES[0];
  const cleanQa = analyzeEpisodeVisualQa(cleanEp, '16:9');
  assert.equal(cleanQa.errorCount, 0, `Expected 0 errors on flagship preset, got ${cleanQa.errorCount}`);
  assert.ok(cleanQa.score >= 70, `Expected QA score >= 70 on flagship preset, got ${cleanQa.score}`);

  const faultyEp = clone(cleanEp);
  faultyEp.beats[0].shot = 'motion_card';
  faultyEp.beats[0].title = '';
  faultyEp.beats[0].dialogue = '';
  faultyEp.beats[0].motionCard = {};
  faultyEp.beats[0].actionCues = [{ frame: 9999, castId: 'ghost_actor', cameraPunch: 0.8 }];

  const faultyQa = analyzeEpisodeVisualQa(faultyEp, '9:16', [
    { beatIndex: 0, meanLuma: 2, lumaStdDev: 0.5, fingerprint64: new Array(64).fill(2) },
    { beatIndex: 1, meanLuma: 2, lumaStdDev: 24, fingerprint64: new Array(64).fill(2) },
  ]);
  const codes = new Set(faultyQa.issues.map((x) => x.code));
  assert.ok(codes.has('motion_card_empty'), 'Expected QA to catch empty motion_card');
  assert.ok(codes.has('action_cue_orphan_cast'), 'Expected QA to catch orphan castId');
  assert.ok(codes.has('action_cue_out_of_range'), 'Expected QA to catch out-of-range cue frame');
  assert.ok(codes.has('blank_frame'), 'Expected QA to catch blank frame pixel sample');
  assert.equal(faultyQa.passed, false, 'Faulty episode must not pass QA gate');

  // 4. Headless CLI audio muxing & contact-sheet integration audit
  const cliSource = fs.readFileSync(path.join(process.cwd(), 'scripts/render-batch.mjs'), 'utf8');
  assert.ok(cliSource.includes('renderAudioWavBase64'), 'Expected CLI to call renderAudioWavBase64');
  assert.ok(cliSource.includes('loudnorm=I=-14:TP=-1.5:LRA=11'), 'Expected -14 LUFS loudnorm in CLI');
  assert.ok(cliSource.includes('renderContactSheetPng'), 'Expected CLI --contact-sheet bridge');
});

// ---------------------------------------------------------------------------
// 14. Voice Envelope Lip-Sync + Speech-Window Karaoke + 1-Click QA Auto-Fixer + CLI .katha Audit
// ---------------------------------------------------------------------------
test('14. Voice Envelope, Speech-Window Karaoke, QA Auto-Fixer & CLI .katha Ingestion', () => {
  // 1. Deterministic 60fps RMS envelope & speech window detection on synthetic PCM
  // 3.0s audio @ 48kHz: silence [0..0.6s], speech tone [0.6..2.2s], silence [2.2..3.0s]
  const sr = 48000;
  const totalSamples = sr * 3;
  const pcm = new Float32Array(totalSamples);
  for (let i = Math.floor(0.6 * sr); i < Math.floor(2.2 * sr); i++) {
    pcm[i] = 0.28 * Math.sin((2 * Math.PI * 220 * i) / sr);
  }
  const profA = computeVoiceEnvelopeFromPcm(pcm, sr, 3.0);
  const profB = computeVoiceEnvelopeFromPcm(pcm, sr, 3.0);
  assert.equal(profA.rms60fps.length, 180, 'Expected 180 60fps RMS buckets for 3.0s clip');
  assert.deepEqual(Array.from(profA.rms60fps), Array.from(profB.rms60fps), 'RMS envelope must be 100% deterministic');
  assert.equal(sampleVoiceProfileAtTime(profA, 0.2), 0, 'Leading silence must sample 0 lip energy');
  assert.ok((sampleVoiceProfileAtTime(profA, 1.4) ?? 0) > 0.5, 'Active speech mid-clip must sample strong RMS');
  assert.equal(sampleVoiceProfileAtTime(profA, 2.7), 0, 'Trailing silence must sample 0 lip energy');
  assert.ok(
    profA.speechWindow.startSec >= 0.5 && profA.speechWindow.startSec <= 0.65,
    `Expected speechStartSec near 0.6s, got ${profA.speechWindow.startSec}`
  );
  assert.ok(
    profA.speechWindow.endSec >= 2.15 && profA.speechWindow.endSec <= 2.35,
    `Expected speechEndSec near 2.2s, got ${profA.speechWindow.endSec}`
  );

  // 2. Speech-window karaoke alignment stays idle before speech starts & sweeps across spoken window
  const words = ['King', 'Vikram', 'lifted', 'the', 'lamp'];
  assert.equal(
    computeActiveWordIndex(words, 0.25, 3.0, profA.speechWindow),
    -1,
    'Karaoke must stay unhighlighted during leading silence before speechStartSec'
  );
  assert.equal(
    computeActiveWordIndex(words, profA.speechWindow.startSec + 0.05, 3.0, profA.speechWindow),
    0,
    'Karaoke must highlight word 0 right after speech starts'
  );
  assert.equal(
    computeActiveWordIndex(words, profA.speechWindow.endSec - 0.02, 3.0, profA.speechWindow),
    words.length - 1,
    'Karaoke must reach final word by speechEndSec'
  );

  // 3. 1-Click QA Auto-Fixer repairs all safe defects deterministically
  const broken = clone(PRESET_EPISODES[0]);
  broken.beats[0].shot = 'motion_card';
  broken.beats[0].title = '';
  broken.beats[0].dialogue = '';
  broken.beats[0].motionCard = {};
  broken.beats[0].actionCues = [{ frame: 9999, castId: 'ghost_actor', cameraPunch: 0.5 }];
  // Dense caption overflow on beat 1
  broken.beats[1].dialogue =
    'Beneath the ancient silver banyan tree where lanterns swayed in the midnight gale, the wise king paused to weigh every single word of the cunning spirit before answering the riddle with calm resolve and unwavering courage.';
  broken.beats[1].duration = 3.2;
  // 3 identical consecutive shots
  if (broken.beats.length >= 5) {
    broken.beats[2].shot = 'wide_stage';
    broken.beats[3].shot = 'wide_stage';
    broken.beats[4].shot = 'wide_stage';
  }

  const beforeQa = analyzeEpisodeVisualQa(broken, '9:16');
  assert.ok(beforeQa.errorCount >= 2, 'Expected multiple QA errors before auto-fix');
  const fixRun1 = autoFixEpisodeVisualQa(broken, '9:16');
  const fixRun2 = autoFixEpisodeVisualQa(broken, '9:16');
  assert.deepEqual(fixRun1.episode, fixRun2.episode, 'QA Auto-Fixer must be 100% deterministic');
  assert.ok(fixRun1.fixedCount >= 3, `Expected >= 3 fixes applied, got ${fixRun1.fixedCount}`);

  const afterQa = analyzeEpisodeVisualQa(fixRun1.episode, '9:16');
  assert.equal(afterQa.errorCount, 0, `Expected 0 QA errors after auto-fix, got ${afterQa.errorCount}`);
  assert.ok(afterQa.score > beforeQa.score, `Expected QA score to improve (${beforeQa.score} -> ${afterQa.score})`);
  assert.ok(
    fixRun1.episode.beats.length > broken.beats.length,
    'Expected dense caption beat to split into 2 scenes'
  );

  // 4. Headless CLI .katha archive & --voices-dir integration audit
  const cliSource = fs.readFileSync(path.join(process.cwd(), 'scripts/render-batch.mjs'), 'utf8');
  assert.ok(cliSource.includes('readStoreZipEntries'), 'Expected hardened STORE ZIP reader in CLI');
  assert.ok(cliSource.includes('isSafeArchiveEntryPath'), 'Expected path-traversal guard in CLI');
  assert.ok(cliSource.includes('--voices-dir'), 'Expected --voices-dir option in CLI');
  assert.ok(cliSource.includes('loadVoiceAssets'), 'Expected CLI to call loadVoiceAssets on headless driver');
});

// ---------------------------------------------------------------------------
// 15. Voice Silence Auto-Trim + Speech-Window Ducking + 9:16 Auto-Track Speaker + Viral Shorts Recommender
// ---------------------------------------------------------------------------
test('15. Voice Auto-Trim/Normalize, Speech-Window Ducking, 9:16 Auto-Track Speaker & Viral Shorts Recommender', () => {
  // 1. Voice Silence Auto-Trim & -1 dBFS Peak Normalization
  const sr = 48000;
  const raw = new Float32Array(sr * 3); // 0..0.7s dead air, 0.7..1.9s quiet speech (0.22 peak), 1.9..3.0s dead air
  for (let i = Math.floor(0.7 * sr); i < Math.floor(1.9 * sr); i++) {
    raw[i] = 0.22 * Math.sin((2 * Math.PI * 240 * i) / sr);
  }
  const trimA = trimAndNormalizePcm(raw, sr);
  const trimB = trimAndNormalizePcm(raw, sr);
  assert.equal(trimA.didTrim, true, 'Expected dead air to be trimmed');
  assert.deepEqual(
    Array.from(trimA.samples),
    Array.from(trimB.samples),
    'trimAndNormalizePcm must be 100% deterministic'
  );
  assert.ok(
    trimA.trimmedDurationSec >= 1.3 && trimA.trimmedDurationSec <= 1.65,
    `Expected trimmed duration near ~1.45s, got ${trimA.trimmedDurationSec}`
  );
  assert.ok(
    trimA.trimmedLeadSec >= 0.5 && trimA.trimmedTailSec >= 0.8,
    `Expected significant lead (${trimA.trimmedLeadSec}s) and tail (${trimA.trimmedTailSec}s) trim`
  );
  let peak = 0;
  for (let i = 0; i < trimA.samples.length; i++) {
    peak = Math.max(peak, Math.abs(trimA.samples[i]));
  }
  assert.ok(peak >= 0.85 && peak <= 0.92, `Expected normalized peak near 0.89 (-1 dBFS), got ${peak}`);
  assert.equal(trimA.samples[0], 0, 'Head sample must be 0 after anti-click fade');
  assert.equal(trimA.samples[trimA.samples.length - 1], 0, 'Tail sample must be 0 after anti-click fade');

  // 2. Speech-Window Sidechain Music Ducking Envelope
  const duck = computeSpeechDuckWindows(10.0, 15.0, { startSec: 0.8, endSec: 2.6 }, 4.0);
  assert.equal(duck.hasSpeech, true);
  assert.equal(duck.duckStart, 10.72, 'Expected duck to engage 80ms before speechStartSec');
  assert.equal(duck.duckEnd, 12.72, 'Expected duck to release 120ms after speechEndSec');
  const clampedDuck = computeSpeechDuckWindows(10.0, 12.0, { startSec: 0.02, endSec: 3.0 }, 2.0);
  assert.equal(clampedDuck.duckStart, 10.0, 'Duck start must clamp cleanly to beatStart');
  assert.equal(clampedDuck.duckEnd, 12.0, 'Duck end must clamp cleanly to beatEnd');

  // 3. 9:16 Auto-Track Speaker Framing & Per-Beat Camera Focus Override
  const baseBeat = clone(PRESET_EPISODES[0].beats[0]);
  baseBeat.shot = 'two_shot';
  baseBeat.cameraFocusX = undefined;
  baseBeat.cameraFocusY = undefined;
  baseBeat.actors = [
    { castId: 'hero_left', slot: 'left', pose: 'stand', expression: 'calm', facing: 'right', motion: 'still' },
    { castId: 'hero_right', slot: 'right', pose: 'stand', expression: 'calm', facing: 'left', motion: 'still' },
  ];

  baseBeat.speakerId = 'hero_left';
  const leftTrack = computeSpeakerCameraOffset(baseBeat, '9:16', 0.5, true);
  assert.ok(leftTrack.panXNorm > 0.1, `Expected positive panXNorm to center left speaker, got ${leftTrack.panXNorm}`);
  assert.ok(leftTrack.zoomBoost > 0.05, 'Expected safe zoomBoost during speaker pan');

  baseBeat.speakerId = 'hero_right';
  const rightTrack = computeSpeakerCameraOffset(baseBeat, '9:16', 0.5, true);
  assert.ok(rightTrack.panXNorm < -0.1, `Expected negative panXNorm to center right speaker, got ${rightTrack.panXNorm}`);

  // Disabled autoTrackSpeaker or 16:9 returns zero offset
  assert.equal(computeSpeakerCameraOffset(baseBeat, '9:16', 0.5, false).panXNorm, 0);
  assert.equal(computeSpeakerCameraOffset(baseBeat, '16:9', 0.5, true).panXNorm, 0);

  // Narrator stays centered
  baseBeat.speakerId = 'narrator';
  assert.equal(computeSpeakerCameraOffset(baseBeat, '9:16', 0.5, true).panXNorm, 0);

  // Explicit manual cameraFocusX/Y works in 16:9 & overrides auto-track
  baseBeat.cameraFocusX = 0.25;
  baseBeat.cameraFocusY = -0.1;
  const manualOff = computeSpeakerCameraOffset(baseBeat, '16:9', 0.5, true);
  assert.equal(manualOff.panXNorm, -0.25);
  assert.equal(manualOff.panYNorm, 0.1);
  assert.ok(manualOff.zoomBoost > 0.1);

  // 4. Viral Shorts Auto-Recommender & Standalone Short Slicer
  const ep = PRESET_EPISODES[0];
  const recsA = recommendTopShortSlices(ep, 3);
  const recsB = recommendTopShortSlices(ep, 3);
  assert.deepEqual(recsA, recsB, 'recommendTopShortSlices must be 100% deterministic');
  assert.ok(recsA.length >= 1 && recsA.length <= 3, `Expected 1..3 short recommendations, got ${recsA.length}`);
  assert.ok(recsA[0].score >= recsA[recsA.length - 1].score, 'Recommendations must be sorted by descending score');

  const top = recsA[0];
  const shortEp = buildShortSliceEpisode(ep, top.startIdx, top.endIdx, 'CAN YOU SOLVE THIS?', true);
  assert.equal(shortEp.beats[0].frame, 'chapter_title', 'Hook title must inject 2s chapter_title slate');
  assert.equal(shortEp.beats[0].duration, 2.0);
  assert.equal(shortEp.beats.length, top.beatCount + 1);
  assert.equal(shortEp.visualStyle?.captionStyle, 'shorts_bold_pop');
  assert.equal(shortEp.visualStyle?.autoTrackSpeaker, true);
});

// ---------------------------------------------------------------------------
// Test 16: Speech-Window Lip-Sync Lock, Safe-Zone Overlay, J-Cut/L-Cut & CLI Factory
// ---------------------------------------------------------------------------
test('16. Speech-Window Lip-Sync Lock, Safe-Zone Overlay, J-Cut/L-Cut & CLI Multi-Format Factory', () => {
  // 1. Speech-Window Lip-Sync Lock closes mouth outside active speech window & holds stable visemes
  const speechWin = { startSec: 0.4, endSec: 2.2 };
  const dialogue = 'Open the golden gate and speak the truth!';
  assert.equal(
    computeSpeechWindowViseme(dialogue, 0.1, 3.0, 0.8, speechWin),
    0,
    'Mouth must stay closed during leading dead air before speechWindow.startSec'
  );
  assert.equal(
    computeSpeechWindowViseme(dialogue, 2.6, 3.0, 0.8, speechWin),
    0,
    'Mouth must stay closed during trailing silence after speechWindow.endSec'
  );
  assert.equal(
    computeSpeechWindowViseme(dialogue, 1.0, 3.0, 0.01, speechWin),
    0,
    'Mouth must stay closed when speechEnergy is below noise floor'
  );
  const vMidA = computeSpeechWindowViseme(dialogue, 1.001, 3.0, 0.72, speechWin);
  const vMidB = computeSpeechWindowViseme(dialogue, 1.018, 3.0, 0.72, speechWin);
  assert.equal(vMidA, vMidB, 'Adjacent 60fps frames within the same 18Hz viseme bucket should hold steady');
  assert.ok(vMidA >= 1 && vMidA <= 5, `Expected active viseme 1..5 inside speechWindow, got ${vMidA}`);

  // 2. Safe-Zone overlay helper is exported and callable on mock 2D context for both 9:16 and 16:9
  let drawOps = 0;
  const mockCtx = {
    save() {},
    restore() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() { drawOps++; },
    fillRect() { drawOps++; },
    strokeRect() { drawOps++; },
    setLineDash() {},
    fillText() { drawOps++; },
    translate() {},
    rotate() {},
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'top',
  } as unknown as CanvasRenderingContext2D;
  drawSafeZoneOverlay(mockCtx, 1080, 1920, '9:16');
  const ops916 = drawOps;
  drawSafeZoneOverlay(mockCtx, 1920, 1080, '16:9');
  assert.ok(ops916 >= 5 && drawOps > ops916 + 5, 'drawSafeZoneOverlay must render guides for both 9:16 and 16:9');

  // 3. J-Cut / L-Cut audioLeadSec schema validation & clamping + applyCinematicJCuts helper
  const baseEp = structuredClone(PRESET_EPISODES[0]);
  const jCutRes = applyCinematicJCuts(baseEp.beats, 0.3);
  assert.ok(jCutRes.updatedCount > 0, 'applyCinematicJCuts should tag spoken transition beats');
  assert.equal(jCutRes.beats[0].audioLeadSec, undefined, 'Beat 0 must never receive a positive J-cut lead');
  const firstTagged = jCutRes.beats.find((b) => typeof b.audioLeadSec === 'number' && b.audioLeadSec > 0);
  assert.ok(firstTagged, 'Expected at least one beat with positive J-cut audioLeadSec');

  const testEp = { ...baseEp, beats: jCutRes.beats.map((b, i) => (i === 1 ? { ...b, audioLeadSec: 2.5 } : i === 2 ? { ...b, audioLeadSec: -1.8 } : b)) };
  const validated = validateEpisodeScript(testEp);
  assert.ok(validated.ok, 'Episode with audioLeadSec must pass validateEpisodeScript');
  if (validated.ok) {
    assert.equal(validated.script.beats[1].audioLeadSec, 0.6, 'Positive audioLeadSec must clamp to +0.6s');
    assert.equal(validated.script.beats[2].audioLeadSec, -0.6, 'Negative audioLeadSec must clamp to -0.6s');
  }

  // 4. CLI render-batch.mjs exposes --auto-shorts and --thumbnails factory flags
  const cliSrc = fs.readFileSync(path.resolve('scripts/render-batch.mjs'), 'utf8');
  assert.ok(cliSrc.includes('--auto-shorts'), 'render-batch.mjs must support --auto-shorts');
  assert.ok(cliSrc.includes('--thumbnails'), 'render-batch.mjs must support --thumbnails');
  assert.ok(cliSrc.includes('renderThumbnailPackPngs'), 'render-batch.mjs must call headless renderThumbnailPackPngs');
  assert.ok(cliSrc.includes('recommendShorts'), 'render-batch.mjs must call headless recommendShorts');
});

// ---------------------------------------------------------------------------
// Test 17 (Upgrade 1): EBU R128 / -14 LUFS Loudness Meter & True-Peak Normalizer
// ---------------------------------------------------------------------------
test('17. Upgrade 1: EBU R128 / -14 LUFS K-weighted loudness meter & -1.5 dBTP true-peak normalizer', () => {
  const sr = 48000;
  const durationSec = 2.0;
  const n = sr * durationSec;
  // Quiet stereo 1 kHz sine wave (~ -24 LUFS)
  const amp = 0.08;
  const left = new Float32Array(n);
  const right = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = amp * Math.sin((2 * Math.PI * 1000 * i) / sr);
    left[i] = s;
    right[i] = s;
  }

  const rawMetrics = measurePcmLoudness([left, right], sr);
  assert.ok(rawMetrics.gatedBlocks > 0, 'Expected active gated blocks on 1 kHz sine');
  assert.ok(
    rawMetrics.integratedLufs < -19 && rawMetrics.integratedLufs > -28,
    `Expected quiet sine near -23..-24 LUFS, got ${rawMetrics.integratedLufs}`
  );

  const normA = normalizePcmLufs([new Float32Array(left), new Float32Array(right)], sr, {
    targetLufs: -14.0,
    truePeakCeilingDb: -1.5,
  });
  const normB = normalizePcmLufs([new Float32Array(left), new Float32Array(right)], sr, {
    targetLufs: -14.0,
    truePeakCeilingDb: -1.5,
  });
  assert.equal(normA.after.integratedLufs, normB.after.integratedLufs, 'LUFS normalization must be deterministic');
  assert.equal(normA.normalized, true);
  assert.ok(
    Math.abs(normA.after.integratedLufs - -14.0) <= 0.8,
    `Expected normalized integrated LUFS near -14.0, got ${normA.after.integratedLufs}`
  );
  assert.ok(
    normA.after.truePeakDbtp <= -1.45,
    `Expected true peak <= -1.45 dBTP, got ${normA.after.truePeakDbtp}`
  );
  assert.ok(normA.appliedGainDb > 4, `Expected positive gain boost, got ${normA.appliedGainDb}`);

  // Silent track should stay untouched without NaN/Infinity
  const silent = normalizePcmLufs([new Float32Array(sr), new Float32Array(sr)], sr);
  assert.equal(silent.normalized, false);
  assert.equal(silent.appliedGainDb, 0);
  assert.equal(silent.before.gatedBlocks, 0);
});

// ---------------------------------------------------------------------------
// Test 18 (Upgrade 2): Deterministic Stereo Spatial Audio & Stage Room Acoustics
// ---------------------------------------------------------------------------
test('18. Upgrade 2: Deterministic stereo spatial panning & stage room impulse acoustics', () => {
  const beat = clone(PRESET_EPISODES[0].beats[0]);
  beat.actors = [
    { castId: 'actor_l', slot: 'left', pose: 'stand', expression: 'calm', facing: 'right', motion: 'still' },
    { castId: 'actor_c', slot: 'center', pose: 'stand', expression: 'calm', facing: 'right', motion: 'still' },
    { castId: 'actor_r', slot: 'right', pose: 'stand', expression: 'calm', facing: 'left', motion: 'still' },
  ];

  beat.speakerId = 'actor_l';
  assert.equal(computeSpatialPanForBeat(beat, 'voice'), -0.28, 'Left actor must pan to -0.28');
  beat.speakerId = 'actor_c';
  assert.equal(computeSpatialPanForBeat(beat, 'voice'), 0, 'Center actor must pan to 0');
  beat.speakerId = 'actor_r';
  assert.equal(computeSpatialPanForBeat(beat, 'voice'), 0.28, 'Right actor must pan to +0.28');
  beat.speakerId = 'narrator';
  assert.equal(computeSpatialPanForBeat(beat, 'voice'), 0, 'Narrator must stay dead-center (0)');

  // Stage acoustics mapping
  assert.equal(getStageRoomAcoustics('kali_temple').profileId, 'temple_reverb');
  assert.equal(getStageRoomAcoustics('cave_den').profileId, 'cave_slapback');
  assert.equal(getStageRoomAcoustics('banyan_clearing').profileId, 'dry_outdoor');
  assert.equal(getStageRoomAcoustics('royal_durbar').profileId, 'palace_hall');

  // Bit-exact deterministic stereo impulse response generation
  const ir1 = generateDeterministicImpulsePcm('temple_reverb', 48000);
  const ir2 = generateDeterministicImpulsePcm('temple_reverb', 48000);
  assert.deepEqual(Array.from(ir1.left), Array.from(ir2.left), 'Impulse IR left channel must be bit-exact');
  assert.deepEqual(Array.from(ir1.right), Array.from(ir2.right), 'Impulse IR right channel must be bit-exact');
  assert.ok(ir1.left.length > 10000, 'Expected substantial temple reverb tail');

  // Default visualStyle enables spatialAudio
  assert.equal(resolveVisualStyle({}).spatialAudio, true);
});

// ---------------------------------------------------------------------------
// Test 19 (Upgrade 3): 2.5D Multi-Plane Rack Focus / Depth-of-Field Spec
// ---------------------------------------------------------------------------
test('19. Upgrade 3: Zero-allocation 2.5D depth-of-field spec & visualStyle validation', () => {
  const baseBeat = clone(PRESET_EPISODES[0].beats[0]);
  baseBeat.actors = [
    { castId: 'hero', slot: 'left', pose: 'stand', expression: 'calm', facing: 'right', motion: 'still' },
    { castId: 'foil', slot: 'right', pose: 'stand', expression: 'calm', facing: 'left', motion: 'still' },
  ];
  baseBeat.speakerId = 'hero';

  // Close-up enables backdrop defocus
  const cuSpec = computeBeatDepthOfFieldSpec(
    { ...baseBeat, shot: 'closeup_left' },
    resolveVisualStyle({ depthOfField: 0.35 }),
    0.5
  );
  assert.equal(cuSpec.enabled, true);
  assert.equal(cuSpec.focusMode, 'full_backdrop');
  assert.ok(cuSpec.blurPx > 0.5);

  // Prop spotlight enables backdrop defocus
  const propSpec = computeBeatDepthOfFieldSpec(
    { ...baseBeat, shot: 'prop_spotlight' },
    resolveVisualStyle({ depthOfField: 0.35 }),
    0.5
  );
  assert.equal(propSpec.enabled, true);
  assert.equal(propSpec.focusMode, 'full_backdrop');

  // Two-shot enables speaker rack-focus
  const twoSpec = computeBeatDepthOfFieldSpec(
    { ...baseBeat, shot: 'two_shot' },
    resolveVisualStyle({ depthOfField: 0.5 }),
    0.5
  );
  assert.equal(twoSpec.enabled, true);
  assert.equal(twoSpec.focusMode, 'rack_left');
  assert.ok(twoSpec.strength > 0);

  // Disabled at depthOfField = 0 or on motion_card
  assert.equal(
    computeBeatDepthOfFieldSpec({ ...baseBeat, shot: 'closeup_left' }, resolveVisualStyle({ depthOfField: 0 }), 0.5)
      .enabled,
    false
  );
  assert.equal(
    computeBeatDepthOfFieldSpec({ ...baseBeat, shot: 'motion_card' }, resolveVisualStyle({ depthOfField: 0.5 }), 0.5)
      .enabled,
    false
  );

  // Zero canvas allocations during spec evaluation in Node
  assert.equal(getDofPoolAllocationCount(), 0);

  // Default visualStyle depthOfField is 0.35 and clamps cleanly in validator
  assert.equal(resolveVisualStyle({}).depthOfField, 0.35);
  const clamped = validateEpisodeScript({
    ...PRESET_EPISODES[0],
    visualStyle: { ...(PRESET_EPISODES[0].visualStyle || {}), depthOfField: 9.5 },
  });
  assert.equal(clamped.ok, true);
  if (clamped.ok) {
    assert.equal(clamped.script.visualStyle?.depthOfField, 1);
  }
});

// ---------------------------------------------------------------------------
// Test 20 (Upgrade 4): Character Acting & Choreography Macro Library
// ---------------------------------------------------------------------------
test('20. Upgrade 4: 12 deterministic character acting macros scale frame-locked cues & SFX cleanly', () => {
  assert.ok(ACTING_MACRO_CATALOG.length >= 10, `Expected >= 10 acting macros, got ${ACTING_MACRO_CATALOG.length}`);
  const baseBeat = clone(PRESET_EPISODES[0].beats[0]);
  baseBeat.duration = 4.2;

  for (const macro of ACTING_MACRO_CATALOG) {
    const outA = applyActingMacroToBeat(baseBeat, macro.id);
    const outB = applyActingMacroToBeat(baseBeat, macro.id);
    assert.deepEqual(outA, outB, `Macro ${macro.id} must be 100% deterministic`);
    assert.ok((outA.expressionCues?.length || 0) >= 2, `Macro ${macro.id} should emit expressionCues`);
    assert.ok((outA.actionCues?.length || 0) >= 2, `Macro ${macro.id} should emit actionCues`);
    assert.equal(outA.sfx, macro.sfx, `Macro ${macro.id} should assign matched SFX`);

    const maxFrame = Math.max(1, Math.round(baseBeat.duration * STUDIO_FPS) - 1);
    for (const cue of outA.actionCues || []) {
      if (typeof cue.frame === 'number') {
        assert.ok(cue.frame >= 0 && cue.frame <= maxFrame, `Cue frame ${cue.frame} out of [0..${maxFrame}]`);
      }
      if (typeof cue.endFrame === 'number') {
        assert.ok(cue.endFrame >= 0 && cue.endFrame <= maxFrame, `Cue endFrame ${cue.endFrame} out of [0..${maxFrame}]`);
      }
    }
  }
});

// ---------------------------------------------------------------------------
// Test 21 (Upgrade 5): Director's Continuity & Pacing Auditor + Auto-Fixer
// ---------------------------------------------------------------------------
test('21. Upgrade 5: Continuity auditor detects 180-deg flip, flat stretch, reading speed & missing speaker, and auto-fixes all', () => {
  const ep = clone(PRESET_EPISODES[0]);
  const a1 = ep.cast[0].id;
  const a2 = ep.cast[1]?.id || a1;

  // Build 4 beats with every defect
  ep.beats = [
    {
      ...clone(ep.beats[0]),
      id: 'c_b1',
      stage: 'royal_durbar',
      shot: 'wide_stage',
      cameraMove: 'still',
      duration: 6.0,
      sfx: 'none',
      fx: 'none',
      weather: 'none',
      actionCues: [],
      expressionCues: [],
      speakerId: a1,
      dialogue: 'The royal court awaits the truth.',
      actors: [
        { castId: a1, slot: 'left', pose: 'stand', expression: 'calm', facing: 'right', motion: 'still' },
        { castId: a2, slot: 'right', pose: 'stand', expression: 'calm', facing: 'left', motion: 'still' },
      ],
    },
    {
      ...clone(ep.beats[0]),
      id: 'c_b2',
      stage: 'royal_durbar',
      shot: 'wide_stage',
      cameraMove: 'still',
      duration: 6.0,
      sfx: 'none',
      fx: 'none',
      weather: 'none',
      actionCues: [],
      expressionCues: [],
      speakerId: a1,
      // 180-degree flip: a1 jumped from left->right with flipped facing
      dialogue: 'Now I stand reversed across the axis.',
      actors: [
        { castId: a1, slot: 'right', pose: 'stand', expression: 'calm', facing: 'left', motion: 'still' },
        { castId: a2, slot: 'left', pose: 'stand', expression: 'calm', facing: 'right', motion: 'still' },
      ],
    },
    {
      ...clone(ep.beats[0]),
      id: 'c_b3',
      stage: 'royal_durbar',
      shot: 'wide_stage',
      cameraMove: 'still',
      duration: 6.0,
      sfx: 'none',
      fx: 'none',
      weather: 'none',
      actionCues: [],
      expressionCues: [],
      // Speaker missing from stage!
      speakerId: a2,
      dialogue: 'Where am I speaking from?',
      actors: [
        { castId: a1, slot: 'left', pose: 'stand', expression: 'calm', facing: 'right', motion: 'still' },
      ],
    },
    {
      ...clone(ep.beats[0]),
      id: 'c_b4',
      stage: 'royal_durbar',
      shot: 'wide_stage',
      cameraMove: 'still',
      duration: 2.0,
      sfx: 'none',
      fx: 'none',
      weather: 'none',
      actionCues: [],
      expressionCues: [],
      speakerId: a1,
      // Way too fast reading speed
      dialogue:
        'Listen carefully every single scholar in this grand assembly because twenty-eight spoken words packed into two seconds are impossible to read or narrate cleanly!',
      actors: [
        { castId: a1, slot: 'left', pose: 'stand', expression: 'calm', facing: 'right', motion: 'still' },
      ],
    },
  ];

  // Script-aware reading rate check (Latin, Devanagari, CJK)
  assert.equal(measureDialogueReadingRate('Hello world from the stage.', 2.0).family, 'latin');
  assert.equal(measureDialogueReadingRate('सत्य और धर्म की विजय सदैव होती है।', 2.0).family, 'indic');
  assert.equal(measureDialogueReadingRate('月光下的古寺钟声悠扬回荡在山谷之中。', 2.0).family, 'cjk');

  const before = auditEpisodeContinuity(ep);
  const kinds = new Set(before.issues.map((i) => i.kind));
  assert.ok(kinds.has('eyeline_flip'), 'Should detect 180-degree eye-line flip');
  assert.ok(kinds.has('identical_shot_streak'), 'Should detect 3+ consecutive identical shots');
  assert.ok(kinds.has('flat_pacing_stretch'), 'Should detect >16s flat pacing stretch');
  assert.ok(kinds.has('missing_speaker_on_stage'), 'Should detect missing speaker on stage');
  assert.ok(kinds.has('reading_speed_fast'), 'Should detect fast reading speed mismatch');

  const fixed = autoFixEpisodeContinuity(ep);
  assert.ok(fixed.fixedCount >= 4, `Expected >= 4 fixes applied, got ${fixed.fixedCount}`);
  const after = auditEpisodeContinuity(fixed.episode);
  assert.ok(after.score > before.score, `Expected continuity score to improve (${before.score} -> ${after.score})`);
  assert.equal(
    after.issues.filter((i) => i.kind === 'missing_speaker_on_stage').length,
    0,
    'Auto-fix must resolve missing speaker on stage'
  );
  assert.equal(validateEpisodeScript(fixed.episode).ok, true);
});

// ---------------------------------------------------------------------------
// Test 22 (Upgrade 6): Procedural Stride & Weather Foley Synthesizer Planner
// ---------------------------------------------------------------------------
test('22. Upgrade 6: Procedural foley planner generates deterministic footsteps, whooshes, thunder & ember crackles', () => {
  const walkRainBeat = clone(PRESET_EPISODES[0].beats[0]);
  walkRainBeat.duration = 4.0;
  walkRainBeat.weather = 'rain';
  walkRainBeat.actors = [
    { castId: 'hero', slot: 'left', pose: 'attack', expression: 'angry', facing: 'right', motion: 'cross_stage' },
  ];
  walkRainBeat.actionCues = [{ frame: 90, castId: 'hero', motion: 'leap_arc' }];

  const eventsA = planBeatFoleyEvents(walkRainBeat);
  const eventsB = planBeatFoleyEvents(walkRainBeat);
  assert.deepEqual(eventsA, eventsB, 'Foley event planning must be 100% deterministic');
  assert.ok(eventsA.some((e) => e.kind === 'footstep'), 'Expected stride footsteps for cross_stage');
  assert.ok(eventsA.some((e) => e.kind === 'whoosh'), 'Expected cloth/air whoosh for attack/leap_arc');
  assert.ok(eventsA.some((e) => e.kind === 'thunder_rumble'), 'Expected distant thunder rumble in rain');

  const emberBeat = clone(PRESET_EPISODES[0].beats[0]);
  emberBeat.duration = 4.0;
  emberBeat.weather = 'embers';
  emberBeat.actors = [{ castId: 'hero', slot: 'center', pose: 'stand', expression: 'calm', facing: 'right', motion: 'still' }];
  emberBeat.actionCues = [];
  const emberEvents = planBeatFoleyEvents(emberBeat);
  assert.ok(emberEvents.some((e) => e.kind === 'ember_crackle'), 'Expected ember crackles in embers weather');
});

// ---------------------------------------------------------------------------
// Test 23 (Upgrade 7): Per-Beat Camera Keyframe Splines & Validator
// ---------------------------------------------------------------------------
test('23. Upgrade 7: Camera keyframe splines evaluate linear/ease_in_out/overshoot deterministically & validate cleanly', () => {
  assert.ok(CAMERA_KEYFRAME_PRESETS.length >= 4, 'Expected built-in camera keyframe presets');
  const unsorted = [
    { atFrac: 1.4, zoom: 1.5, panX: 0.2, panY: -0.1, ease: 'linear' as const },
    { atFrac: -0.2, zoom: 0.9, panX: -0.1, panY: 0.05, ease: 'linear' as const },
    { atFrac: 0.5, zoom: 1.15, panX: 0.05, panY: 0, ease: 'overshoot' as const },
  ];
  const norm = normalizeCameraKeyframes(unsorted);
  assert.equal(norm.length, 3);
  assert.equal(norm[0].atFrac, 0, 'Clamped start atFrac should be 0');
  assert.equal(norm[2].atFrac, 1, 'Clamped end atFrac should be 1');

  const midA = evaluateCameraKeyframes(norm, 0.5);
  const midB = evaluateCameraKeyframes(norm, 0.5);
  assert.deepEqual(midA, midB, 'Spline evaluation must be deterministic');
  assert.ok(midA.active && Math.abs(midA.zoom - 1.15) < 1e-4);

  // Overshoot segment around atFrac=0.85 should smoothly approach/exceed target
  const late = evaluateCameraKeyframes(norm, 0.85);
  assert.ok(late.zoom > 1.35, `Expected overshoot zoom > 1.35 near late segment, got ${late.zoom}`);

  const composed = composeCameraWithKeyframes({ zoom: 1.0, panX: 0, panY: 0 }, norm, 0.5, 1920, 1080);
  assert.ok(Math.abs(composed.zoom - 1.15) < 1e-4);
  assert.ok(composed.panX < 0, 'Positive panX keyframe shifts stage transform left');

  // Validator preserves and clamps cameraKeyframes on beats
  const ep = clone(PRESET_EPISODES[0]);
  ep.beats[0].cameraKeyframes = unsorted;
  const validated = validateEpisodeScript(ep);
  assert.equal(validated.ok, true);
  if (validated.ok) {
    assert.equal(validated.script.beats[0].cameraKeyframes?.length, 3);
    assert.equal(validated.script.beats[0].cameraKeyframes?.[0].atFrac, 0);
  }
});

// ---------------------------------------------------------------------------
// Test 24 (Upgrade 8): Multi-Language Dub Timing Lock & Synced Track Packager
// ---------------------------------------------------------------------------
test('24. Upgrade 8: Dub timing lock clamps speechRate to 0.85..1.25 and packages SRT, WebVTT, Chapters & MLA Manifest', () => {
  const baseEp = clone(PRESET_EPISODES[0]);
  const localizedEp = clone(baseEp);
  // Make beat 0 very long (requires speedup clamped <= 1.25) and beat 1 very short (requires slowdown >= 0.85)
  localizedEp.beats[0].dialogue =
    'This is an extraordinarily long translated line designed to test upper speech rate clamping across multiple dramatic clauses without drifting past the video beat duration.';
  localizedEp.beats[1].dialogue = 'Yes.';

  const plan = computeDubTimingPlan(baseEp, localizedEp, 'es');
  assert.equal(plan.beats.length, baseEp.beats.length);
  for (const target of plan.beats) {
    assert.ok(
      target.speechRate >= 0.85 && target.speechRate <= 1.25,
      `speechRate ${target.speechRate} must stay clamped in [0.85, 1.25]`
    );
  }
  assert.equal(plan.beats[0].speechRate, 1.25, 'Long translation should clamp to max 1.25x');
  assert.equal(plan.beats[1].speechRate, 0.85, 'Short translation should clamp to min 0.85x');

  const srt = generateSyncedSrt(localizedEp);
  assert.ok(srt.includes('-->') && srt.includes('00:00:00,080'), 'Expected valid SRT cues with 80ms cut-safe pad');

  const vtt = generateSyncedWebVtt(localizedEp);
  assert.ok(vtt.startsWith('WEBVTT') && vtt.includes('<v '), 'Expected valid WebVTT with speaker voice tags');

  const chapters = generateYouTubeChaptersText(localizedEp);
  assert.ok(chapters.includes('0:00'), 'Expected YouTube 0:00 chapter start');

  const manifest = buildMlaTrackManifest(baseEp, [{ langCode: 'es', episode: localizedEp }]);
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.tracks.length, 2, 'Expected master + es tracks in manifest');
  assert.equal(manifest.tracks[0].isMaster, true);
  assert.equal(manifest.tracks[1].langCode, 'es');

  const zipBytes = buildDubSyncPackageZipBytes(baseEp, [{ langCode: 'es', episode: localizedEp }]);
  const entries = readBinaryZipEntries(zipBytes);
  const paths = [...entries.keys()];
  assert.ok(paths.includes('mla_track_manifest.json'), 'Expected mla_track_manifest.json in ZIP');
  assert.ok(paths.includes('subtitles_es.vtt'), 'Expected WebVTT track in ZIP');
  assert.ok(paths.includes('subtitles_es.srt'), 'Expected SRT track in ZIP');
  assert.ok(paths.includes('youtube_chapters.txt'), 'Expected chapters file in ZIP');
});

// ---------------------------------------------------------------------------
// Test 25 (Upgrade 9): Custom Look Lab Series Recipe Presets & .katha Bundle Preservation
// ---------------------------------------------------------------------------
test('25. Upgrade 9: Look Lab recipes round-trip JSON and persist inside .katha archives with backward compat', () => {
  const ep = clone(PRESET_EPISODES[0]);
  const recipe = createLookRecipe('Midnight Risograph Look', {
    renderStyle: 'risograph_print',
    motionCadence: '24fps',
    motionProfile: 'snappy_cartoon',
    postFxPass: 'bayer_dither',
    depthOfField: 0.45,
    spatialAudio: true,
    inkWeight: 1.25,
    autoTrackSpeaker: true,
  });
  const dup = duplicateLookRecipe(recipe);
  assert.notEqual(dup.id, recipe.id);
  assert.ok(dup.name.endsWith(' Copy'));

  const json = exportLookRecipesJson([recipe, dup]);
  const imported = importLookRecipesJson(json);
  assert.equal(imported.ok, true);
  if (imported.ok) {
    assert.equal(imported.recipes.length, 2);
    assert.equal(imported.recipes[0].style.renderStyle, 'risograph_print');
    assert.equal(imported.recipes[0].style.depthOfField, 0.45);
  }

  // Round-trip inside .katha archive
  const kathaBytes = exportKathaArchiveBytes({
    version: 1,
    exportedAt: Date.now(),
    episode: ep,
    aspect: '16:9',
    voices: [],
    musicStem: null,
    lookRecipes: [recipe],
  });
  const parsed = parseKathaArchiveBytes(kathaBytes);
  assert.equal(parsed.lookRecipes?.length, 1);
  assert.equal(parsed.lookRecipes?.[0].name, 'Midnight Risograph Look');
  assert.equal(parsed.lookRecipes?.[0].style.postFxPass, 'bayer_dither');
});

// ---------------------------------------------------------------------------
// Test 26 (Upgrade 10): Headless Determinism & Render Benchmark CLI Audit
// ---------------------------------------------------------------------------
test('26. Upgrade 10: scripts/determinism-audit.mjs covers all 20 art engines with SHA-256 hash checks & safe spawn', () => {
  const auditPath = path.join(process.cwd(), 'scripts/determinism-audit.mjs');
  assert.equal(fs.existsSync(auditPath), true, 'Expected scripts/determinism-audit.mjs to exist');
  const src = fs.readFileSync(auditPath, 'utf8');
  assert.ok(src.includes('__STAGECRAFT_HEADLESS__'), 'Audit CLI must drive window.__STAGECRAFT_HEADLESS__');
  assert.ok(src.includes('sha256'), 'Audit CLI must compute SHA-256 pixel buffer hashes');
  assert.ok(src.includes('spawn('), 'Audit CLI must use safe spawn with argument arrays');
  assert.equal(/\bexec\s*\(/.test(src), false, 'Audit CLI must never use shell string exec()');
  for (const engine of RENDER_STYLE_CATALOG) {
    assert.ok(src.includes(`'${engine.id}'`), `Audit CLI must include art engine ${engine.id}`);
  }
});

// ---------------------------------------------------------------------------
// Test 27 (Upgrade 11): Volumetric Light Shafts & Stage Rim Atmosphere
// ---------------------------------------------------------------------------
test('27. Upgrade 11: Deterministic volumetric light shafts classify stages, skip slates & validate lightShafts', () => {
  assert.equal(resolveVolumetricBeamKind('kali_temple', 'twilight_temple'), 'temple_godrays');
  assert.equal(resolveVolumetricBeamKind('royal_durbar', 'golden_durbar'), 'window_sunbeams');
  assert.equal(resolveVolumetricBeamKind('cave_den', 'sandstone_dusk'), 'hearth_glow');
  assert.equal(resolveVolumetricBeamKind('banyan_clearing', 'midnight_banyan'), 'moonlight_shafts');

  const beat = clone(PRESET_EPISODES[0].beats[0]);
  beat.frame = 'main';
  beat.shot = 'wide_stage';
  const style = resolveVisualStyle({});
  assert.equal(style.lightShafts, 0.4, 'Default lightShafts must be 0.4');

  const planA = computeVolumetricLightPlan(beat, style, 1.75, 'chiaroscuro');
  const planB = computeVolumetricLightPlan(beat, style, 1.75, 'chiaroscuro');
  assert.deepEqual(planA, planB, 'Volumetric light plan must be 100% deterministic');
  assert.equal(planA.enabled, true);
  assert.ok(planA.beams.length >= 2 && planA.motes.length >= 10);

  // Disabled at lightShafts=0 or on chapter_title / motion_card slates
  assert.equal(computeVolumetricLightPlan(beat, { lightShafts: 0 }, 1.0).enabled, false);
  assert.equal(
    computeVolumetricLightPlan({ ...beat, frame: 'chapter_title' }, style, 1.0).enabled,
    false
  );
  assert.equal(
    computeVolumetricLightPlan({ ...beat, shot: 'motion_card' }, style, 1.0).enabled,
    false
  );

  // Validator clamps lightShafts cleanly
  const ep = clone(PRESET_EPISODES[0]);
  ep.visualStyle = { ...(ep.visualStyle || {}), lightShafts: 5.5 };
  const val = validateEpisodeScript(ep);
  assert.equal(val.ok, true);
  if (val.ok) assert.equal(val.script.visualStyle?.lightShafts, 1);
});

// ---------------------------------------------------------------------------
// Test 28 (Upgrade 12): Deterministic Prop Physics & Follow-Through Arcs
// ---------------------------------------------------------------------------
test('28. Upgrade 12: Prop physics computes deterministic mystic levitation, pendulum carry & kinetic weapon arcs', () => {
  const baseBeat = clone(PRESET_EPISODES[0].beats[0]);

  assert.equal(resolvePropPhysicsMode('sudarshana_chakra', 'stage'), 'mystic_float');
  assert.equal(resolvePropPhysicsMode('khanda_sword', 'actor_right_hand'), 'kinetic_weapon');
  assert.equal(resolvePropPhysicsMode('royal_scroll', 'actor_left_hand'), 'pendulum_carry');
  assert.equal(resolvePropPhysicsMode('peacock_throne', 'stage'), 'grounded_settle');

  // Mystic levitation has glowBoost & non-zero bob
  const mysticBeat = { ...baseBeat, prop: 'sudarshana_chakra' as const, propAnchor: 'stage' as const };
  const mA = computePropPhysics(mysticBeat, 1.2, 0.3, 1.0);
  const mB = computePropPhysics(mysticBeat, 1.2, 0.3, 1.0);
  assert.deepEqual(mA, mB, 'Mystic prop physics must be deterministic');
  assert.equal(mA.mode, 'mystic_float');
  assert.ok(mA.glowBoost > 0.3, `Expected mystic glowBoost > 0.3, got ${mA.glowBoost}`);

  // Kinetic weapon swing under attack pose produces meaningful rotation arc
  const attackActor = { ...baseBeat.actors[0], pose: 'attack' as const, facing: 'right' as const };
  const weaponBeat = { ...baseBeat, prop: 'khanda_sword' as const, propAnchor: 'actor_left_hand' as const };
  const wPhys = computePropPhysics(weaponBeat, 0.8, 0.2, 1.0, attackActor, 0.5);
  assert.equal(wPhys.mode, 'kinetic_weapon');
  assert.ok(Math.abs(wPhys.rotationRad) > 0.1, 'Attack weapon swing must rotate');
  assert.ok(wPhys.scalePulse > 1.0, 'Kinetic weapon swing should pulse scale');
});

// ---------------------------------------------------------------------------
// Test 29 (Upgrade 13): Expressive Kinetic Captions & Speaker-Colored Emphasis
// ---------------------------------------------------------------------------
test('29. Upgrade 13: Kinetic captions parse emphasis tokens, pop active words & support 2 new caption styles', () => {
  const tokens = parseEmphasisTokens('STOP! Listen *very carefully* to the truth?');
  assert.equal(tokens.length, 7);
  assert.equal(tokens[0].emphasis, 'all_caps');
  assert.equal(tokens[2].emphasis, 'asterisk');
  assert.equal(tokens[2].text, 'very');
  assert.equal(tokens[3].emphasis, 'asterisk');
  assert.equal(tokens[3].text, 'carefully');
  assert.equal(tokens[6].emphasis, 'punch_punct');
  assert.equal(stripEmphasisMarkup('Listen *very* closely!'), 'Listen very closely!');

  const activePop = computeKineticWordPop(0.18, true, true);
  const restPop = computeKineticWordPop(0.18, false, false);
  assert.ok(activePop.scaleY > 1.15, `Expected active emphasized word pop > 1.15, got ${activePop.scaleY}`);
  assert.equal(restPop.scaleY, 1);

  const ep = clone(PRESET_EPISODES[0]);
  const accent = resolveSpeakerAccentColor(
    { speakerId: ep.cast[0].id },
    ep.cast,
    '#ffffff'
  );
  assert.equal(accent, ep.cast[0].accentColor || ep.cast[0].primaryColor);
  assert.equal(resolveSpeakerAccentColor({ speakerId: 'narrator' }, ep.cast, '#abc123'), '#abc123');

  // New caption styles exist in catalog & validate cleanly
  const styleIds = CAPTION_STYLE_CATALOG.map((c) => c.id);
  assert.ok(styleIds.includes('comic_speech_pop'));
  assert.ok(styleIds.includes('minimal_editorial'));
  ep.visualStyle = { ...(ep.visualStyle || {}), captionStyle: 'comic_speech_pop' };
  const val = validateEpisodeScript(ep);
  assert.equal(val.ok, true);
  if (val.ok) assert.equal(val.script.visualStyle?.captionStyle, 'comic_speech_pop');
});

// ---------------------------------------------------------------------------
// Test 30 (Upgrade 14): Episode Harmonic Tension Arc & Beat Music Crossfades
// ---------------------------------------------------------------------------
test('30. Upgrade 14: Episode music tension arc computes octave lift, phrase density & raag/mood crossfade ramps', () => {
  const ep = clone(PRESET_EPISODES[0]);
  // Ensure a raag change and a climactic crimson beat
  if (ep.beats.length >= 3) {
    ep.beats[0].raag = 'yaman';
    ep.beats[0].mood = 'emerald_jungle';
    ep.beats[0].musicEnergy = 0.4;
    ep.beats[1].raag = 'bhairavi';
    ep.beats[1].mood = 'crimson_wrath';
    ep.beats[1].musicEnergy = 0.95;
    ep.beats[1].fx = 'crimson_impact';
  }

  const arcA = computeEpisodeMusicArc(ep);
  const arcB = computeEpisodeMusicArc(ep);
  assert.deepEqual(arcA, arcB, 'Music arc must be deterministic');
  assert.equal(arcA.beats.length, ep.beats.length);
  assert.ok(arcA.peakBeatIndex >= 0 && arcA.peakTension > 0.7);
  if (ep.beats.length >= 2) {
    assert.equal(arcA.beats[1].hasHarmonicShift, true, 'Raag/mood shift must flag hasHarmonicShift');
    assert.ok(arcA.beats[1].crossfadeInSec >= 0.4, 'Raag change should trigger >= 0.4s crossfade');
    assert.equal(arcA.beats[1].octaveLift, 1, 'High-tension beat should activate octave lift');
    assert.ok(arcA.beats[1].percussionEmphasis > 1.1, 'High-tension beat should boost percussion');
  }

  // Boundary crossfade ramps smoothly from ~0.25 at beat entry to 1.0 mid-beat
  const entryGain = computeBoundaryCrossfadeGain(0.0, 4.0, 0.42, 0);
  const midGain = computeBoundaryCrossfadeGain(2.0, 4.0, 0.42, 0);
  assert.ok(entryGain < 0.35 && midGain === 1, `Expected smooth ramp (${entryGain} -> ${midGain})`);
});

// ---------------------------------------------------------------------------
// Test 31 (Upgrade 15): Voiceover Booth Teleprompter & Multi-Take Utilities
// ---------------------------------------------------------------------------
test('31. Upgrade 15: Teleprompter cue sheet, pacing evaluator & countdown progress work deterministically', () => {
  const ep = clone(PRESET_EPISODES[0]);
  const sheet = buildTeleprompterCueSheet(ep);
  assert.equal(sheet.length, ep.beats.length);
  assert.equal(sheet[0].beatId, ep.beats[0].id);
  assert.ok(sheet[0].targetDurationSec >= 1.2);
  if (sheet.length > 1) {
    assert.ok(typeof sheet[0].nextPreview === 'string' && sheet[0].nextPreview.length > 0);
    assert.equal(sheet[sheet.length - 1].nextPreview, null);
  }

  assert.equal(evaluateTakePacing(4.0, 4.2), 'on_target');
  assert.equal(evaluateTakePacing(2.0, 4.5), 'short');
  assert.equal(evaluateTakePacing(6.5, 4.0), 'long');

  const prog = computeTeleprompterProgress(2.5, 5.0);
  assert.equal(prog.progressFrac, 0.5);
  assert.equal(prog.remainingSec, 2.5);
  assert.equal(prog.isOvertime, false);
  assert.equal(computeTeleprompterProgress(6.0, 5.0).isOvertime, true);

  assert.equal(formatTakeFileName(0, 'beat_intro', 2), '01_beat_intro_take2.wav');
});

// ---------------------------------------------------------------------------
// Test 32 (Upgrade 16): Retention & Pacing Heatmap + Boost Flat Beats
// ---------------------------------------------------------------------------
test('32. Upgrade 16: Pacing analyzer flags >12s drop-off zones and boostFlatBeats repairs them preserving durations', () => {
  const ep = clone(PRESET_EPISODES[0]);
  // Construct a deliberate 3-beat flat stretch (19.5s total)
  ep.beats = ep.beats.slice(0, 3).map((b, i) => ({
    ...b,
    id: `flat_${i}`,
    frame: 'main',
    shot: 'wide_stage',
    cameraMove: 'still',
    fx: 'none',
    sfx: 'none',
    duration: 6.5,
    musicEnergy: 0.32,
    actionCues: [],
    expressionCues: [],
    actors: b.actors.map((a) => ({
      ...a,
      pose: 'stand',
      motion: 'still',
      expression: 'calm',
      expressionTrack: undefined,
    })),
  }));

  const report = analyzeEpisodePacing(ep);
  assert.ok(report.dropOffZones.length >= 1, 'Expected at least 1 >12s flat drop-off zone');
  assert.ok(report.flatBeatIndices.length >= 2);

  const boosted = boostFlatBeats(ep);
  assert.ok(boosted.boostedIndices.length >= 2);
  assert.ok(
    boosted.afterScore > boosted.beforeScore,
    `Expected pacing score improvement (${boosted.beforeScore} -> ${boosted.afterScore})`
  );
  // Strictly preserves durations and dialogue
  for (let i = 0; i < ep.beats.length; i++) {
    assert.equal(boosted.episode.beats[i].duration, ep.beats[i].duration);
    assert.equal(boosted.episode.beats[i].dialogue, ep.beats[i].dialogue);
  }
});

// ---------------------------------------------------------------------------
// Test 33 (Upgrade 17): Animated Location & Time-Jump Lower-Third Banners
// ---------------------------------------------------------------------------
test('33. Upgrade 17: Lower-third banners ease deterministically, auto-tag stage changes & sanitize in validator', () => {
  // Timing checks: hidden at 0.05s, visible mid-beat, hidden after exit
  assert.equal(computeLowerThirdTiming(0.05, 4.0).visible, false);
  const mid = computeLowerThirdTiming(1.5, 4.0);
  assert.equal(mid.visible, true);
  assert.equal(mid.alpha, 1);
  assert.equal(mid.slideFrac, 0);
  assert.equal(computeLowerThirdTiming(3.95, 4.0).visible, false);

  const ep = clone(PRESET_EPISODES[0]);
  ep.beats.forEach((b) => {
    delete b.locationCard;
  });
  const tagged = autoTagStageChangeLocationCards(ep);
  assert.ok(tagged.taggedCount >= 1, 'Auto-tag should tag at least the opening stage');

  // Validator preserves valid locationCard and drops empty-title cards
  tagged.episode.beats[0].locationCard = {
    title: 'Ujjain Royal Court',
    subtitle: 'Midnight · Act I',
    position: 'bottom_left',
    style: 'scroll_ribbon',
  };
  const val = validateEpisodeScript(tagged.episode);
  assert.equal(val.ok, true);
  if (val.ok) {
    assert.equal(val.script.beats[0].locationCard?.title, 'Ujjain Royal Court');
    assert.equal(val.script.beats[0].locationCard?.style, 'scroll_ribbon');
    assert.equal(val.script.beats[0].locationCard?.position, 'bottom_left');
  }
});

// ---------------------------------------------------------------------------
// Test 34 (Upgrade 18): Episode Diff & Selective Beat Snapshot Restore
// ---------------------------------------------------------------------------
test('34. Upgrade 18: Episode diff detects modified/added/removed/reordered beats & selective beat restore works', () => {
  const base = clone(PRESET_EPISODES[0]);
  const target = clone(base);

  assert.equal(computeEpisodeDiff(base, target).hasChanges, false);

  const originalDialogue0 = base.beats[0].dialogue;
  target.beats[0].dialogue = 'Modified dramatic opening line!';
  target.beats[0].duration = base.beats[0].duration + 1.5;
  target.beats.push({ ...clone(base.beats[0]), id: 'new_bonus_beat', title: 'Bonus Epilogue' });
  target.visualStyle = { ...(target.visualStyle || {}), lightShafts: 0.85 };

  const diff = computeEpisodeDiff(base, target);
  assert.equal(diff.hasChanges, true);
  assert.equal(diff.summary.modified, 1);
  assert.equal(diff.summary.added, 1);
  assert.ok(diff.summary.visualStyleChanges >= 1);
  assert.ok(diff.durationDeltaSec > 0);

  // Cherry-pick restore beat 0 while keeping the newly added beat intact
  const restored = restoreSingleBeatFromCheckpoint(target, base, base.beats[0].id);
  assert.equal(restored.beats[0].dialogue, originalDialogue0);
  assert.ok(restored.beats.some((b) => b.id === 'new_bonus_beat'), 'Selective restore must preserve other beats');
});

// ---------------------------------------------------------------------------
// Test 35 (Upgrade 19): Command Palette Registry & NLE Shortcut Guard
// ---------------------------------------------------------------------------
test('35. Upgrade 19: Command Palette indexes scenes, all 20 art engines & acting macros with fuzzy search + input guard', () => {
  const ep = clone(PRESET_EPISODES[0]);
  const registry = buildStudioCommandRegistry(ep);
  assert.ok(registry.length >= ep.beats.length + 20 + 12, 'Registry must include scenes, 20 engines & 12 macros');

  const styleMatches = filterStudioCommands(registry, 'woodblock');
  assert.ok(styleMatches.some((c) => c.actionType === 'set_render_style' && c.payload === 'woodblock_print'));

  const boothMatches = filterStudioCommands(registry, 'voice booth');
  assert.ok(boothMatches.some((c) => c.actionType === 'open_voice_booth'));

  assert.ok(NLE_SHORTCUT_CATALOG.length >= 10);
  assert.equal(isEditableEventTarget({ tagName: 'INPUT' } as unknown as EventTarget), true);
  assert.equal(isEditableEventTarget({ tagName: 'TEXTAREA' } as unknown as EventTarget), true);
  assert.equal(isEditableEventTarget({ tagName: 'DIV', isContentEditable: true } as unknown as EventTarget), true);
  assert.equal(isEditableEventTarget({ tagName: 'DIV', isContentEditable: false } as unknown as EventTarget), false);
});

// ---------------------------------------------------------------------------
// Test 36 (Upgrade 20): Automated Fuzzing & Edge-Case Stress Test CLI Audit
// ---------------------------------------------------------------------------
test('36. Upgrade 20: scripts/studio-stress-test.mjs exists, uses seeded PRNG (zero Math.random), and covers all 9 APIs', () => {
  const stressPath = path.join(process.cwd(), 'scripts/studio-stress-test.mjs');
  assert.equal(fs.existsSync(stressPath), true, 'Expected scripts/studio-stress-test.mjs to exist');
  const src = fs.readFileSync(stressPath, 'utf8');
  assert.equal(/\bMath\.random\s*\(/.test(src), false, 'Stress test CLI must never call Math.random()');
  for (const fnName of [
    'validateEpisodeScript',
    'healAndParseLlmJson',
    'parseKathaArchiveBytes',
    'trimAndNormalizePcm',
    'measureAudioBufferLufs',
    'computeDubTimingPlan',
    'recommendTopShortSlices',
    'computeEpisodeDiff',
    'analyzeEpisodePacing',
  ]) {
    assert.ok(src.includes(fnName), `Stress test CLI must exercise ${fnName}`);
  }
});

// Helper: full-featured mock Canvas 2D context for headless Node draw smoke tests
function createMockCanvas2D(): { ctx: CanvasRenderingContext2D; getOps: () => number } {
  let ops = 0;
  const grad = { addColorStop() {} };
  const ctx = {
    save() {},
    restore() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    quadraticCurveTo() {},
    bezierCurveTo() {},
    arc() {},
    arcTo() {},
    ellipse() {},
    rect() {},
    roundRect() {},
    clip() {},
    fill() { ops++; },
    stroke() { ops++; },
    fillRect() { ops++; },
    strokeRect() { ops++; },
    clearRect() {},
    fillText() { ops++; },
    strokeText() { ops++; },
    measureText(t: string) { return { width: t.length * 8 }; },
    translate() {},
    rotate() {},
    scale() {},
    transform() {},
    setTransform() {},
    setLineDash() {},
    getLineDash() { return []; },
    createLinearGradient() { return grad; },
    createRadialGradient() { return grad; },
    createPattern() { return null; },
    drawImage() { ops++; },
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    shadowColor: 'transparent',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    font: '16px sans-serif',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    direction: 'ltr',
    filter: 'none',
  } as unknown as CanvasRenderingContext2D;
  return { ctx, getOps: () => ops };
}

// ---------------------------------------------------------------------------
// Test 37 (Wave 3): Mega Catalog Counts, Validator Acceptance & Deterministic Draw Smoke Test
// ---------------------------------------------------------------------------
test('37. Wave 3: All >=60 archetypes, >=50 stages, >=65 props, >=16 moods, >=12 weathers, >=12 crowds & >=14 FX validate and render cleanly', () => {
  assert.ok(ARCHETYPE_CATALOG.length >= 60, `Expected >=60 archetypes, got ${ARCHETYPE_CATALOG.length}`);
  assert.ok(STAGE_CATALOG.length >= 50, `Expected >=50 stages, got ${STAGE_CATALOG.length}`);
  assert.ok(PROP_CATALOG.length >= 65, `Expected >=65 props (incl. none), got ${PROP_CATALOG.length}`);
  assert.ok(MOOD_CATALOG.length >= 16, `Expected >=16 moods, got ${MOOD_CATALOG.length}`);
  assert.ok(WEATHER_LIST.length >= 12, `Expected >=12 weathers, got ${WEATHER_LIST.length}`);
  assert.ok(CROWD_CATALOG.length >= 12, `Expected >=12 crowds, got ${CROWD_CATALOG.length}`);
  assert.ok(FX_LIST.length >= 14, `Expected >=14 FX, got ${FX_LIST.length}`);

  // Zero non-deterministic RNG in renderAssetsUniversal.ts
  const uniSrc = fs.readFileSync(path.join(process.cwd(), 'src/studio/renderAssetsUniversal.ts'), 'utf8');
  assert.equal(/\bMath\.random\s*\(/.test(uniSrc), false, 'renderAssetsUniversal.ts must never call Math.random()');

  // Every mood has a complete palette
  for (const m of MOOD_CATALOG) {
    assert.ok(MOOD_PALETTES[m.id], `Missing MOOD_PALETTES entry for ${m.id}`);
  }

  // Every archetype has default colors
  for (const a of ARCHETYPE_CATALOG) {
    assert.ok(ARCHETYPE_DEFAULT_COLORS[a.id], `Missing ARCHETYPE_DEFAULT_COLORS for ${a.id}`);
  }

  // Validate an episode exercising Wave 3 IDs
  const ep = clone(PRESET_EPISODES[0]);
  ep.cast.push({
    id: 'w3_detective',
    name: 'Inspector Vance',
    archetype: 'detective',
    primaryColor: ARCHETYPE_DEFAULT_COLORS.detective.primary,
    accentColor: ARCHETYPE_DEFAULT_COLORS.detective.accent,
    skinColor: ARCHETYPE_DEFAULT_COLORS.detective.skin,
  });
  ep.beats[0] = {
    ...ep.beats[0],
    stage: 'neon_cyber_alley',
    mood: 'cyber_magenta',
    prop: 'holo_tablet',
    weather: 'data_matrix',
    crowd: 'cyber_drones',
    fx: 'glitch_tear',
    actors: [
      {
        castId: 'w3_detective',
        slot: 'center',
        pose: 'gesture',
        expression: 'angry',
        facing: 'right',
        motion: 'still',
      },
    ],
  };
  const validated = validateEpisodeScript(ep);
  assert.equal(validated.ok, true, `Wave 3 episode failed validation: ${validated.ok ? '' : validated.error}`);

  // Smoke-render every single stage, archetype (close-up + full-body), prop, weather, crowd, and FX
  const { ctx, getOps } = createMockCanvas2D();
  const baseOps = getOps();
  const cyberPal = MOOD_PALETTES.cyber_magenta;
  const noirPal = MOOD_PALETTES.noir_monochrome;

  for (const st of STAGE_CATALOG) {
    drawStageBackdrop(ctx, 640, 360, st.id, 'cyber_magenta', 1.25);
  }
  for (const a of ARCHETYPE_CATALOG) {
    const col = ARCHETYPE_DEFAULT_COLORS[a.id];
    const member = {
      id: `test_${a.id}`,
      name: a.label,
      archetype: a.id,
      primaryColor: col.primary,
      accentColor: col.accent,
      skinColor: col.skin,
    };
    drawActorCloseUp(ctx, member, 'calm', 2, 0.5, 'right', 1.2);
    drawActorFullBody(ctx, member, 320, 300, 1.0, 'stand', 'joy', 'right', 2, 0.5, 1.2, 0.5, 'still');
  }
  for (const p of PROP_CATALOG) {
    if (p.id === 'none') continue;
    drawStoryProp(ctx, p.id, 320, 180, 1.0, 1.2, 0.5);
  }
  for (const w of WEATHER_LIST) {
    drawUniversalWeather(ctx, 640, 360, w, cyberPal, 1.25);
  }
  for (const c of CROWD_CATALOG) {
    drawUniversalCrowdLayer(ctx, 640, 360, c.id, noirPal, 1.25, ep.beats[0], 0);
  }
  for (const fx of FX_LIST) {
    drawUniversalBeatFx(ctx, 640, 360, fx, 0.5, 1.25);
  }

  assert.ok(getOps() - baseOps > 2000, `Expected >2000 canvas draw ops across all catalogs, got ${getOps() - baseOps}`);
});

// ---------------------------------------------------------------------------
// Test 38 (Wave 3): Expanded Procedural Backdrop Studio (24), Props (24) & Act Arcs (9)
// ---------------------------------------------------------------------------
test('38. Wave 3: All >=24 procedural backdrop themes, >=24 prop presets & >=9 Act Arcs generate deterministic outputs', () => {
  assert.ok(BACKDROP_THEMES.length >= 24, `Expected >=24 backdrop themes, got ${BACKDROP_THEMES.length}`);
  assert.ok(CUSTOM_PROP_PRESETS.length >= 24, `Expected >=24 custom prop presets, got ${CUSTOM_PROP_PRESETS.length}`);
  assert.ok(ACT_ARC_PRESETS.length >= 9, `Expected >=9 act arc presets, got ${ACT_ARC_PRESETS.length}`);

  for (const theme of BACKDROP_THEMES) {
    const a = generateProceduralBackdropDataUrl({ theme: theme.id, seed: 13 });
    const b = generateProceduralBackdropDataUrl({ theme: theme.id, seed: 13 });
    assert.equal(a.dataUrl, b.dataUrl, `Backdrop theme ${theme.id} must be deterministic`);
    assert.ok(a.dataUrl.startsWith('data:image/'), `Backdrop theme ${theme.id} must return valid data URL`);
  }

  for (const preset of CUSTOM_PROP_PRESETS) {
    const a = generateProceduralPropDataUrl({ preset: preset.id, seed: 9 });
    const b = generateProceduralPropDataUrl({ preset: preset.id, seed: 9 });
    assert.equal(a.dataUrl, b.dataUrl, `Prop preset ${preset.id} must be deterministic`);
    assert.ok(a.dataUrl.startsWith('data:image/'), `Prop preset ${preset.id} must return valid data URL`);
  }

  const baseEp = clone(PRESET_EPISODES[0]);
  for (const arc of ACT_ARC_PRESETS) {
    const applied = applyActVisualProgression(baseEp, arc.id);
    assert.equal(applied.episode.beats.length, baseEp.beats.length);
    assert.equal(
      validateEpisodeScript(applied.episode).ok,
      true,
      `Act arc ${arc.id} must produce a schema-valid episode`
    );
  }
});

// ---------------------------------------------------------------------------
// Test 39 (Wave 3): >=32 Curated Sprite DNA Presets + New CharacterDNA Parts & Hydration
// ---------------------------------------------------------------------------
test('39. Wave 3: >=32 curated Sprite DNA presets, new headwear/tops/patterns & all 20 archetype hydrations validate and render cleanly', () => {
  assert.ok(SPRITE_WORKSHOP_PRESETS.length >= 32, `Expected >=32 sprite presets, got ${SPRITE_WORKSHOP_PRESETS.length}`);
  assert.ok(SPRITE_PRESET_CATEGORIES.length >= 6, `Expected >=6 sprite categories, got ${SPRITE_PRESET_CATEGORIES.length}`);
  assert.ok(HEADWEAR_CATALOG.length >= 16, `Expected >= 16 headwear styles, got ${HEADWEAR_CATALOG.length}`);
  assert.ok(TOP_STYLE_CATALOG.length >= 15, `Expected >= 15 top styles, got ${TOP_STYLE_CATALOG.length}`);
  assert.ok(SURFACE_PATTERN_CATALOG.length >= 14, `Expected >= 14 surface patterns, got ${SURFACE_PATTERN_CATALOG.length}`);

  // Verify every new DNA part ID is preserved by validateAndNormalizeDna
  const probeDna = createBaseDna('humanoid');
  for (const hw of ['fedora', 'cyber_visor', 'astronaut_helmet', 'tricorn_hat'] as const) {
    const norm = validateAndNormalizeDna({ ...probeDna, outfit: { ...probeDna.outfit, headwear: hw } });
    assert.ok(norm, `Expected normalized DNA for headwear ${hw}`);
    assert.equal(norm.outfit.headwear, hw, `Headwear ${hw} must survive normalization`);
  }
  for (const top of ['trench_coat', 'lab_coat', 'cyber_jacket', 'space_suit'] as const) {
    const norm = validateAndNormalizeDna({ ...probeDna, outfit: { ...probeDna.outfit, topStyle: top } });
    assert.ok(norm, `Expected normalized DNA for topStyle ${top}`);
    assert.equal(norm.outfit.topStyle, top, `Top ${top} must survive normalization`);
  }
  for (const pat of ['circuit_trace', 'pinstripe', 'camo_hex', 'starfield_speckle'] as const) {
    const norm = validateAndNormalizeDna({ ...probeDna, outfit: { ...probeDna.outfit, surfacePattern: pat } });
    assert.ok(norm, `Expected normalized DNA for surfacePattern ${pat}`);
    assert.equal(norm.outfit.surfacePattern, pat, `Surface pattern ${pat} must survive normalization`);
  }

  const { ctx, getOps } = createMockCanvas2D();
  const seenIds = new Set<string>();
  const baseOps = getOps();

  for (let i = 0; i < SPRITE_WORKSHOP_PRESETS.length; i++) {
    const preset = SPRITE_WORKSHOP_PRESETS[i];
    assert.equal(seenIds.has(preset.id), false, `Duplicate sprite preset ID: ${preset.id}`);
    seenIds.add(preset.id);

    const normalizedDna = validateAndNormalizeDna(preset.dna);
    assert.ok(normalizedDna, `Expected normalized DNA for preset ${preset.id}`);
    assert.equal(normalizedDna.chassis, preset.dna.chassis);

    const member = buildCastMemberFromSpritePreset(preset, i);
    drawModularEntityCloseUp(ctx, member, normalizedDna, 'joy', 2, 0.5, 'right', 1.1);
    drawModularEntityFullBody(ctx, member, normalizedDna, 260, 290, 1.0, 'stand', 'calm', 'right', 2, 0.4, 1.1, 0.5, 'still');
  }

  // Hydrate and render all 20 new Wave 3 archetypes
  const wave3Archetypes = [
    'detective', 'scientist', 'astronaut', 'cyber_hacker', 'android',
    'mech_pilot', 'wizard', 'pirate_captain', 'ninja', 'viking',
    'pharaoh', 'vampire_lord', 'dragon_kin', 'elf_archer', 'dwarf_smith',
    'ghost_phantom', 'journalist', 'street_musician', 'cat_mascot', 'robot_companion',
  ] as const;

  for (const arch of wave3Archetypes) {
    const col = ARCHETYPE_DEFAULT_COLORS[arch];
    const hydrated = hydrateArchetypeToDna({
      id: `hyd_${arch}`,
      name: arch,
      archetype: arch,
      primaryColor: col.primary,
      accentColor: col.accent,
      skinColor: col.skin,
    });
    const norm = validateAndNormalizeDna(hydrated);
    assert.ok(norm, `Expected normalized DNA for hydrated archetype ${arch}`);
    const member = syncMemberWithDna(
      { id: `hyd_${arch}`, name: arch, archetype: arch, primaryColor: col.primary, accentColor: col.accent, skinColor: col.skin },
      norm
    );
    drawModularEntityFullBody(ctx, member, norm, 260, 290, 1.0, 'stand', 'calm', 'right', 2, 0.3, 0.9, 0.4, 'still');
  }

  assert.ok(getOps() - baseOps > 1000, `Expected >1000 modular entity draw ops, got ${getOps() - baseOps}`);
});

// ---------------------------------------------------------------------------
// Test 40 (Wave 3): Spatial Acoustics & Volumetric Lighting Coverage for Wave 3 Stages & Moods
// ---------------------------------------------------------------------------
test('40. Wave 3: All 20 new stages resolve deterministic spatial acoustics & volumetric lighting across new moods', () => {
  const wave3Stages = [
    'neon_cyber_alley', 'orbital_starship_bridge', 'mars_colony_dome', 'noir_rainy_street',
    'modern_news_studio', 'cozy_bookshop_cafe', 'high_tech_lab', 'courtroom_hall',
    'ancient_egypt_temple', 'roman_colosseum', 'nordic_fjord_hall', 'gothic_cathedral',
    'steampunk_clocktower', 'pirate_galleon_deck', 'underwater_atlantis', 'volcanic_citadel',
    'snowy_mountain_pass', 'cherry_blossom_shrine', 'vintage_train_car', 'astral_observatory',
  ] as const;

  const wave3Moods = [
    'cyber_magenta', 'noir_monochrome', 'arctic_aurora', 'sunlit_morning',
    'volcanic_inferno', 'deep_abyss', 'sakura_dawn', 'sepia_archive',
  ] as const;

  const baseBeat = clone(PRESET_EPISODES[0].beats[0]);
  baseBeat.frame = 'main';
  baseBeat.shot = 'wide_stage';
  const style = resolveVisualStyle({ lightShafts: 0.65 });

  for (let i = 0; i < wave3Stages.length; i++) {
    const stage = wave3Stages[i];
    const mood = wave3Moods[i % wave3Moods.length];

    const acoustics = getStageRoomAcoustics(stage);
    assert.ok(acoustics.profileId.length > 0, `Missing room acoustics for ${stage}`);
    assert.ok(acoustics.wetMix >= 0 && acoustics.wetMix <= 0.5, `Out-of-range wetMix for ${stage}`);

    const beamKind = resolveVolumetricBeamKind(stage, mood);
    assert.ok(
      ['temple_godrays', 'window_sunbeams', 'moonlight_shafts', 'hearth_glow'].includes(beamKind),
      `Unexpected volumetric beam kind ${beamKind} for ${stage}/${mood}`
    );

    const planA = computeVolumetricLightPlan({ ...baseBeat, stage, mood }, style, 1.5, 'neon_cybernoir');
    const planB = computeVolumetricLightPlan({ ...baseBeat, stage, mood }, style, 1.5, 'neon_cybernoir');
    assert.deepEqual(planA, planB, `Volumetric light plan must be deterministic for ${stage}`);
    assert.equal(planA.enabled, true, `Volumetric light plan should enable for ${stage}/${mood}`);
  }
});

// ---------------------------------------------------------------------------
// Test 41 (Upgrade 21): Deterministic Hit Stop & Attack-Hold-Decay VFX Envelopes
// ---------------------------------------------------------------------------
test('41. Upgrade 21: attackHoldDecay envelope, 2-4f hitstop freeze, disabled bypass & impact shock overlay smoke render', () => {
  // Attack-Hold-Decay shape checks
  assert.equal(attackHoldDecay(0.4, 0.5, 0.1, 0.2, 0.3), 0);
  const midAttack = attackHoldDecay(0.55, 0.5, 0.1, 0.2, 0.3);
  assert.ok(midAttack > 0 && midAttack < 1, `Expected 0 < midAttack < 1, got ${midAttack}`);
  assert.equal(attackHoldDecay(0.65, 0.5, 0.1, 0.2, 0.3), 1);
  const midDecay = attackHoldDecay(0.95, 0.5, 0.1, 0.2, 0.3);
  assert.ok(midDecay > 0 && midDecay < 1, `Expected 0 < midDecay < 1, got ${midDecay}`);
  assert.equal(attackHoldDecay(1.2, 0.5, 0.1, 0.2, 0.3), 0);

  // Beat with attack + sword_clash + cameraPunch action cue
  const beat = clone(PRESET_EPISODES[0].beats[0]);
  beat.duration = 4.0;
  beat.sfx = 'sword_clash';
  beat.fx = 'crimson_impact';
  beat.actionCues = [
    {
      frame: 60,
      castId: beat.actors[0]?.castId,
      pose: 'attack',
      cameraPunch: 0.75,
      sfx: 'sword_clash',
      fx: 'shock_burst',
    },
  ];

  // Exactly at impact anchor frame 60 and frame 61 -> frozen onto frame 60
  const hsAt60 = computeHitstopState(beat, 60, STUDIO_FPS, true);
  const hsAt61 = computeHitstopState(beat, 61, STUDIO_FPS, true);
  assert.equal(hsAt60.isFrozen, true, 'Expected hitstop freeze at impact frame 60');
  assert.equal(hsAt61.isFrozen, true, 'Expected hitstop freeze to hold at frame 61');
  assert.equal(hsAt60.frozenLocalFrame, 60);
  assert.equal(hsAt61.frozenLocalFrame, 60);
  assert.ok(hsAt60.hitstopFrames >= 2 && hsAt60.hitstopFrames <= 4, `Expected 2..4 hitstop frames, got ${hsAt60.hitstopFrames}`);
  assert.ok(hsAt60.impactEnvelope > 0.5);

  // Deterministic repeatability
  const hsAt61Repeat = computeHitstopState(beat, 61, STUDIO_FPS, true);
  assert.deepEqual(hsAt61, hsAt61Repeat);

  // Disabled via hitstopEnabled=false -> zero freeze
  const hsDisabled = computeHitstopState(beat, 60, STUDIO_FPS, false);
  assert.equal(hsDisabled.isFrozen, false);
  assert.equal(hsDisabled.frozenLocalFrame, 60);
  assert.equal(hsDisabled.impactEnvelope, 0);

  // Draw smoke test
  const { ctx, getOps } = createMockCanvas2D();
  const beforeOps = getOps();
  drawImpactShockOverlay(ctx, 1280, 720, hsAt60, 640, 360, '#ffd452', 1.0);
  assert.ok(getOps() > beforeOps, 'Expected drawImpactShockOverlay to execute draw ops');
});

// ---------------------------------------------------------------------------
// Test 42 (Upgrade 22): Pure RGBA Sprite & Prop Prep Tools
// ---------------------------------------------------------------------------
test('42. Upgrade 22: removeFlatBackgroundRgba preserves interior matching color, addSpriteOutlineRgba & quantizeAndPixelizeRgba work deterministically', () => {
  const w = 16;
  const h = 16;
  const rgba = new Uint8ClampedArray(w * h * 4);
  // Fill entire 16x16 with white background (250, 250, 250, 255)
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = 250;
    rgba[i * 4 + 1] = 250;
    rgba[i * 4 + 2] = 250;
    rgba[i * 4 + 3] = 255;
  }
  // Draw a closed red ring (x: 4..11, y: 4..11) enclosing a white interior hole (x: 6..9, y: 6..9)
  for (let y = 4; y <= 11; y++) {
    for (let x = 4; x <= 11; x++) {
      const isInterior = x >= 6 && x <= 9 && y >= 6 && y <= 9;
      if (!isInterior) {
        const off = (y * w + x) * 4;
        rgba[off] = 220;
        rgba[off + 1] = 40;
        rgba[off + 2] = 40;
        rgba[off + 3] = 255;
      }
    }
  }

  const cut = removeFlatBackgroundRgba(rgba, w, h, { tolerance: 24, feather: false });
  // Corner (0,0) must be transparent
  assert.equal(cut[3], 0, 'Expected corner background pixel to be stripped to alpha 0');
  // Ring pixel (4,4) must stay opaque
  assert.equal(cut[(4 * w + 4) * 4 + 3], 255, 'Expected solid ring pixel to remain opaque');
  // Enclosed interior white pixel (7,7) must stay opaque (flood-fill only removes exterior!)
  assert.equal(cut[(7 * w + 7) * 4 + 3], 255, 'Expected enclosed interior matching-color pixel to stay preserved');

  // Outline pass must color adjacent transparent pixel (3,5) with #112233
  const outlined = addSpriteOutlineRgba(cut, w, h, {
    colorHex: '#112233',
    thicknessPx: 1,
    pixelSnap: true,
  });
  const borderOff = (5 * w + 3) * 4;
  assert.equal(outlined[borderOff + 3], 255, 'Expected adjacent outline pixel to become opaque');
  assert.equal(outlined[borderOff], 0x11);
  assert.equal(outlined[borderOff + 1], 0x22);
  assert.equal(outlined[borderOff + 2], 0x33);

  // Mood palette quantization snaps every opaque pixel to getMoodPaletteHexes('cyber_magenta')
  const palette = getMoodPaletteHexes('cyber_magenta');
  assert.ok(palette.length >= 6);
  const quantized = quantizeAndPixelizeRgba(outlined, w, h, { pixelSize: 2, paletteHex: palette });
  const allowedRgb = new Set(
    palette.map((hex) => {
      const hClean = hex.replace('#', '');
      return `${parseInt(hClean.slice(0, 2), 16)},${parseInt(hClean.slice(2, 4), 16)},${parseInt(hClean.slice(4, 6), 16)}`;
    })
  );
  let checkedOpaque = 0;
  for (let i = 0; i < w * h; i++) {
    if (quantized[i * 4 + 3] > 0) {
      checkedOpaque++;
      const key = `${quantized[i * 4]},${quantized[i * 4 + 1]},${quantized[i * 4 + 2]}`;
      assert.ok(allowedRgb.has(key), `Quantized pixel RGB ${key} not in cyber_magenta palette`);
    }
  }
  assert.ok(checkedOpaque > 10);

  // Full pipeline determinism check
  const pipeA = processSpriteRgbaPipeline(rgba, w, h, {
    removeBackground: true,
    bgTolerance: 24,
    outlineEnabled: true,
    outlineThicknessPx: 2,
    pixelSize: 2,
    paletteHex: palette,
  });
  const pipeB = processSpriteRgbaPipeline(rgba, w, h, {
    removeBackground: true,
    bgTolerance: 24,
    outlineEnabled: true,
    outlineThicknessPx: 2,
    pixelSize: 2,
    paletteHex: palette,
  });
  assert.deepEqual(pipeA, pipeB);
});

// ---------------------------------------------------------------------------
// Test 43 (Upgrade 23): Frame-Locked Sprite Sheet Slicer & Schema Validation
// ---------------------------------------------------------------------------
test('43. Upgrade 23: detectGridHint, computeSpriteSheetFrameRect cadence/looping & validateEpisodeScript customPropSheet clamping', () => {
  const h4x1 = detectGridHint(512, 128);
  assert.equal(h4x1.cols, 4);
  assert.equal(h4x1.rows, 1);

  const h4x2 = detectGridHint(512, 256);
  assert.equal(h4x2.cols, 4);
  assert.equal(h4x2.rows, 2);

  const hSq = detectGridHint(512, 512);
  assert.equal(hSq.cols, 4);
  assert.equal(hSq.rows, 4);

  const sheet = normalizeSpriteSheetConfig({ cols: 4, rows: 2, frameCount: 6, fps: 12, loop: true });
  const r0 = computeSpriteSheetFrameRect(sheet, 512, 256, 0.0, 12);
  assert.equal(r0.frameIndex, 0);
  assert.equal(r0.sx, 0);
  assert.equal(r0.sy, 0);
  assert.equal(r0.sw, 128);
  assert.equal(r0.sh, 128);

  // At t=0.5s * 12fps = frame 6 -> loops to frame 0 (frameCount=6)
  const rLoop = computeSpriteSheetFrameRect(sheet, 512, 256, 0.5, 12);
  assert.equal(rLoop.frameIndex, 0);

  // Non-looping sheet clamps at last frame (5 => col 1, row 1)
  const nonLoopSheet = normalizeSpriteSheetConfig({ cols: 4, rows: 2, frameCount: 6, fps: 12, loop: false });
  const rClamped = computeSpriteSheetFrameRect(nonLoopSheet, 512, 256, 2.0, 12);
  assert.equal(rClamped.frameIndex, 5);
  assert.equal(rClamped.col, 1);
  assert.equal(rClamped.row, 1);
  assert.equal(rClamped.sx, 128);
  assert.equal(rClamped.sy, 128);

  // Validator clamps out-of-range customPropSheet fields cleanly
  const ep = clone(PRESET_EPISODES[0]);
  ep.beats[0].customPropSheet = {
    cols: 99,
    rows: 0,
    frameCount: 999,
    fps: 120,
    loop: false,
  };
  const val = validateEpisodeScript(ep);
  assert.equal(val.ok, true);
  if (val.ok) {
    assert.equal(val.script.beats[0].customPropSheet?.cols, 16);
    assert.equal(val.script.beats[0].customPropSheet?.rows, 1);
    assert.equal(val.script.beats[0].customPropSheet?.frameCount, 16);
    assert.equal(val.script.beats[0].customPropSheet?.fps, 30);
    assert.equal(val.script.beats[0].customPropSheet?.loop, false);
  }
});

// ---------------------------------------------------------------------------
// Test 44 (Upgrade 24): Directional Ground Shadows & Wet-Surface / Water Reflections
// ---------------------------------------------------------------------------
test('44. Upgrade 24: getStageReflectionProfile covers all 50 stages + rain override & drawGroundedShadowAndReflection renders cleanly', () => {
  assert.equal(getStageReflectionProfile('river_ghat', 'none').kind, 'water');
  assert.equal(getStageReflectionProfile('underwater_atlantis', 'none').kind, 'water');
  assert.equal(getStageReflectionProfile('neon_cyber_alley', 'none').kind, 'wet_street');
  assert.equal(getStageReflectionProfile('royal_durbar', 'none').kind, 'polished_marble');
  assert.equal(getStageReflectionProfile('banyan_clearing', 'none').kind, 'none');
  // Outdoor non-reflective stage turns wet_street during rain/lightning_storm
  assert.equal(getStageReflectionProfile('banyan_clearing', 'rain').kind, 'wet_street');
  assert.equal(getStageReflectionProfile('banyan_clearing', 'lightning_storm').kind, 'wet_street');

  const validKinds = new Set(['water', 'wet_street', 'polished_marble', 'none']);
  for (const st of STAGE_CATALOG) {
    const prof = getStageReflectionProfile(st.id, 'none');
    assert.ok(validKinds.has(prof.kind), `Unexpected reflection kind ${prof.kind} for ${st.id}`);
  }

  const { ctx, getOps } = createMockCanvas2D();
  const baseOps = getOps();
  const beat = clone(PRESET_EPISODES[0].beats[0]);
  beat.stage = 'neon_cyber_alley';
  beat.weather = 'rain';
  beat.lightSide = 'right';
  drawGroundedShadowAndReflection(
    ctx,
    1280,
    720,
    beat,
    [
      { x: 420, y: 580, scale: 1.0, primaryColor: '#e11d48', accentColor: '#38bdf8' },
      { x: 860, y: 580, scale: 1.0, primaryColor: '#f59e0b', accentColor: '#fef08a' },
    ],
    1.5,
    MOOD_PALETTES.cyber_magenta
  );
  assert.ok(getOps() - baseOps >= 8, 'Expected directional cast shadows + wet reflection draw ops');
});

// ---------------------------------------------------------------------------
// Test 45 (Upgrade 25): Foreground Framing Parallax Silhouettes
// ---------------------------------------------------------------------------
test('45. Upgrade 25: classifyForegroundFrame covers all 50 stages, all 10 motifs render cleanly & foregroundFraming clamps in validator', () => {
  const seenMotifs = new Set<ForegroundMotifId>();
  for (const st of STAGE_CATALOG) {
    const motif = classifyForegroundFrame(st.id);
    seenMotifs.add(motif);
  }
  assert.ok(seenMotifs.size >= 10, `Expected >=10 distinct foreground motifs across 50 stages, got ${seenMotifs.size}`);

  const { ctx, getOps } = createMockCanvas2D();
  const baseOps = getOps();
  const sampleStages = [
    'banyan_clearing',
    'kali_temple',
    'bamboo_forest',
    'neon_cyber_alley',
    'noir_rainy_street',
    'gothic_cathedral',
    'pirate_galleon_deck',
    'snowy_mountain_pass',
    'cherry_blossom_shrine',
    'orbital_starship_bridge',
  ] as const;

  for (const stage of sampleStages) {
    drawForegroundParallaxLayer(ctx, 1280, 720, stage, 'midnight_banyan', 18, 1.08, 1.2, 0.55);
  }
  assert.ok(getOps() - baseOps >= 20, 'Expected foreground parallax motifs to execute draw ops');

  // Clamping in resolveVisualStyle & validateEpisodeScript
  assert.equal(resolveVisualStyle({ foregroundFraming: 3.5 }).foregroundFraming, 1);
  assert.equal(resolveVisualStyle({ foregroundFraming: -2 }).foregroundFraming, 0);
  assert.equal(resolveVisualStyle({ hitstopEnabled: false }).hitstopEnabled, false);

  const ep = clone(PRESET_EPISODES[0]);
  ep.visualStyle = { ...(ep.visualStyle || {}), foregroundFraming: 1.9, hitstopEnabled: false };
  const val = validateEpisodeScript(ep);
  assert.equal(val.ok, true);
  if (val.ok) {
    assert.equal(val.script.visualStyle?.foregroundFraming, 1);
    assert.equal(val.script.visualStyle?.hitstopEnabled, false);
  }
});

// ---------------------------------------------------------------------------
// Test 46 (Upgrade 26): Calibrated 0-3 Visual Craft Scorecard & Audit CLI
// ---------------------------------------------------------------------------
test('46. Upgrade 26: scoreEpisodeVisualCraft calibrates 0-3 rubric across 6 dimensions & determinism-audit.mjs supports --manifest & --max-frame-ms', () => {
  // Minimal weak episode should score lower and emit actionable suggestions
  const weakEp: EpisodeScript = {
    id: 'weak_probe',
    series: 'Test',
    title: 'Weak Probe',
    subtitle: '',
    defaultRaag: 'bhairavi',
    visualStyle: {
      renderStyle: 'chiaroscuro',
      lookPreset: 'classic_chiaroscuro',
      colorGrade: 'default',
      texture: 'clean',
      shadowContrast: 1.0,
      inkWeight: 1.0,
      rimLight: 'auto',
      captionStyle: 'classic_cinema',
      frameBorder: 'clean_letterbox',
      vignette: 0.0,
      depthOfField: 0,
      lightShafts: 0,
      foregroundFraming: 0,
      hitstopEnabled: false,
      karaokeCaptions: false,
    },
    cast: [
      { id: 'a', name: 'One', archetype: 'king', primaryColor: '#444444', accentColor: '#888888', skinColor: '#d9a06c' },
    ],
    beats: [
      {
        id: 'w1',
        title: 'Flat',
        duration: 4,
        stage: 'banyan_clearing',
        mood: 'midnight_banyan',
        weather: 'none',
        shot: 'wide_stage',
        transition: 'hard_cut',
        lightSide: 'right',
        prop: 'none',
        propSlot: 'center',
        cameraMove: 'still',
        fx: 'none',
        sfx: 'none',
        raag: 'bhairavi',
        musicEnergy: 0.4,
        actors: [{ castId: 'a', slot: 'center', pose: 'stand', expression: 'calm', facing: 'right', motion: 'still' }],
        speakerId: 'a',
        speakerLabel: 'One',
        dialogue: 'This is a single static sentence that goes on and on with over twenty eight words so caption readability flags it cleanly for splitting into shorter subtitles.',
      },
    ],
  };

  const weakScore = scoreEpisodeVisualCraft(weakEp);
  assert.equal(weakScore.categories.length, 6);
  assert.equal(weakScore.maxScore, 18);
  assert.ok(weakScore.categories.some((c) => c.score < 2 && Boolean(c.suggestion)));

  // Rich flagship preset should score higher than weak probe
  const richEp = clone(PRESET_EPISODES[0]);
  richEp.visualStyle = resolveVisualStyle({
    ...(richEp.visualStyle || {}),
    colorGrade: 'warm_gold',
    texture: 'parchment_grain',
    depthOfField: 0.45,
    lightShafts: 0.55,
    foregroundFraming: 0.45,
    hitstopEnabled: true,
    karaokeCaptions: true,
  });
  const richScore = scoreEpisodeVisualCraft(richEp);
  assert.ok(
    richScore.totalScore > weakScore.totalScore,
    `Expected rich episode (${richScore.totalScore}) > weak episode (${weakScore.totalScore})`
  );

  const md = formatVisualScorecardMarkdown(richScore);
  assert.ok(md.includes('Visual Craft Scorecard'));
  assert.ok(md.includes(`${richScore.totalScore}/18`));

  // Verify determinism-audit.mjs supports Wave 4 flags & error capture without shell exec()
  const auditSrc = fs.readFileSync(path.join(process.cwd(), 'scripts/determinism-audit.mjs'), 'utf8');
  assert.ok(auditSrc.includes('--manifest'), 'determinism-audit.mjs must support --manifest');
  assert.ok(auditSrc.includes('--max-frame-ms'), 'determinism-audit.mjs must support --max-frame-ms');
  assert.ok(auditSrc.includes('pageerror'), 'determinism-audit.mjs must capture pageerror');
  assert.ok(auditSrc.includes('scoreVisualCraft'), 'determinism-audit.mjs must include Visual Craft Scorecard');
  assert.equal(/\bMath\.random\s*\(/.test(auditSrc), false);
});

// ---------------------------------------------------------------------------
// Test 47 (Upgrade 27): Exportable Live Stagecraft Director SKILL.md Generator
// ---------------------------------------------------------------------------
test('47. Upgrade 27: buildStagecraftDirectorSkillMd dynamically reflects all live catalogs & Wave 4 schema levers', () => {
  const md = buildStagecraftDirectorSkillMd();
  assert.ok(md.startsWith('---\nname: stagecraft-director\n'), 'Expected valid YAML frontmatter');
  assert.ok(md.includes(`Art Engines (${RENDER_STYLE_CATALOG.length})`));
  assert.ok(md.includes(`Cast Archetypes (${ARCHETYPE_CATALOG.length})`));
  assert.ok(md.includes(`Stage Backdrops (${STAGE_CATALOG.length})`));
  assert.ok(md.includes(`(${SPRITE_WORKSHOP_PRESETS.length})`));
  for (const token of [
    'neon_cyber_alley',
    'detective',
    'holo_tablet',
    'hitstopEnabled',
    'foregroundFraming',
    'customPropSheet',
    'cameraKeyframes',
    'locationCard',
    'audioLeadSec',
  ]) {
    assert.ok(md.includes(token), `Expected Director SKILL.md to include "${token}"`);
  }
});

// Helper: NaN-checking + call-signature recording Canvas2D mock for determinism audits
function createAuditedMockCanvas2D(): {
  ctx: CanvasRenderingContext2D;
  getOps: () => number;
  getSignature: () => number;
  getNanCount: () => number;
  reset: () => void;
} {
  let ops = 0;
  let sig = 2166136261;
  let nanCount = 0;

  const mix = (n: number) => {
    if (typeof n === 'number' && !Number.isFinite(n)) {
      nanCount++;
      return;
    }
    const q = Math.round(n * 100);
    sig ^= q & 0xffffffff;
    sig = Math.imul(sig, 16777619) >>> 0;
  };
  const mixArgs = (tag: number, args: unknown[]) => {
    mix(tag);
    for (const a of args) {
      if (typeof a === 'number') mix(a);
    }
  };
  const grad = {
    addColorStop(stop: number) {
      mix(stop);
    },
  };

  const ctx = {
    save() { mix(1); },
    restore() { mix(2); },
    beginPath() { mix(3); },
    closePath() { mix(4); },
    moveTo(...args: unknown[]) { mixArgs(5, args); },
    lineTo(...args: unknown[]) { mixArgs(6, args); },
    quadraticCurveTo(...args: unknown[]) { mixArgs(7, args); },
    bezierCurveTo(...args: unknown[]) { mixArgs(8, args); },
    arc(...args: unknown[]) { mixArgs(9, args); },
    arcTo(...args: unknown[]) { mixArgs(10, args); },
    ellipse(...args: unknown[]) { mixArgs(11, args); },
    rect(...args: unknown[]) { mixArgs(12, args); },
    roundRect(...args: unknown[]) { mixArgs(13, args); },
    clip() { mix(14); },
    fill() { ops++; mix(15); },
    stroke() { ops++; mix(16); },
    fillRect(...args: unknown[]) { ops++; mixArgs(17, args); },
    strokeRect(...args: unknown[]) { ops++; mixArgs(18, args); },
    clearRect(...args: unknown[]) { mixArgs(19, args); },
    fillText(...args: unknown[]) { ops++; mixArgs(20, args); },
    strokeText(...args: unknown[]) { ops++; mixArgs(21, args); },
    measureText(t: string) { return { width: t.length * 8 }; },
    translate(...args: unknown[]) { mixArgs(22, args); },
    rotate(...args: unknown[]) { mixArgs(23, args); },
    scale(...args: unknown[]) { mixArgs(24, args); },
    transform(...args: unknown[]) { mixArgs(25, args); },
    setTransform(...args: unknown[]) { mixArgs(26, args); },
    setLineDash() {},
    getLineDash() { return []; },
    createLinearGradient(...args: unknown[]) { mixArgs(27, args); return grad; },
    createRadialGradient(...args: unknown[]) { mixArgs(28, args); return grad; },
    createPattern() { return null; },
    drawImage(...args: unknown[]) { ops++; mixArgs(29, args); },
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    shadowColor: 'transparent',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    font: '16px sans-serif',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    direction: 'ltr',
    filter: 'none',
  } as unknown as CanvasRenderingContext2D;

  return {
    ctx,
    getOps: () => ops,
    getSignature: () => sig,
    getNanCount: () => nanCount,
    reset: () => {
      ops = 0;
      sig = 2166136261;
      nanCount = 0;
    },
  };
}

// ---------------------------------------------------------------------------
// Test 48 (Wave 5): 5x Universal Visual World Atlas Counts, Zero Math.random & Deterministic Smoke Render
// ---------------------------------------------------------------------------
test('48. Wave 5: Exact 160 archetypes, 150 stages, 185 props, 40 moods, 30 weathers, 30 crowds & 36 FX render deterministically with zero NaNs', () => {
  assert.equal(ARCHETYPE_CATALOG.length, 160, `Expected 160 archetypes, got ${ARCHETYPE_CATALOG.length}`);
  assert.equal(STAGE_CATALOG.length, 150, `Expected 150 stages, got ${STAGE_CATALOG.length}`);
  assert.equal(PROP_CATALOG.length, 185, `Expected 185 props (184 + none), got ${PROP_CATALOG.length}`);
  assert.equal(MOOD_CATALOG.length, 40, `Expected 40 moods, got ${MOOD_CATALOG.length}`);
  assert.equal(WEATHER_LIST.length, 30, `Expected 30 weathers, got ${WEATHER_LIST.length}`);
  assert.equal(CROWD_CATALOG.length, 30, `Expected 30 crowds, got ${CROWD_CATALOG.length}`);
  assert.equal(FX_LIST.length, 36, `Expected 36 FX, got ${FX_LIST.length}`);

  // All 4 new Wave 5 atlas modules must have zero Math.random() calls
  const atlasFiles = [
    'src/studio/renderAssetsArchetypesAtlas.ts',
    'src/studio/renderAssetsStagesAtlas.ts',
    'src/studio/renderAssetsPropsAtlas.ts',
    'src/studio/renderAssetsAtmosphereAtlas.ts',
  ];
  for (const rel of atlasFiles) {
    const src = fs
      .readFileSync(path.join(process.cwd(), rel), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    assert.equal(/\bMath\.random\s*\(/.test(src), false, `${rel} must never call Math.random()`);
  }

  // Unique IDs across every expanded catalog
  assert.equal(new Set(ARCHETYPE_CATALOG.map((a) => a.id)).size, 160);
  assert.equal(new Set(STAGE_CATALOG.map((s) => s.id)).size, 150);
  assert.equal(new Set(PROP_CATALOG.map((p) => p.id)).size, 185);
  assert.equal(new Set(MOOD_CATALOG.map((m) => m.id)).size, 40);
  assert.equal(new Set(WEATHER_LIST).size, 30);
  assert.equal(new Set(CROWD_CATALOG.map((c) => c.id)).size, 30);
  assert.equal(new Set(FX_LIST).size, 36);

  // Every mood has a complete palette & every archetype has default colors
  for (const m of MOOD_CATALOG) {
    assert.ok(MOOD_PALETTES[m.id], `Missing MOOD_PALETTES for ${m.id}`);
  }
  for (const a of ARCHETYPE_CATALOG) {
    assert.ok(ARCHETYPE_DEFAULT_COLORS[a.id], `Missing ARCHETYPE_DEFAULT_COLORS for ${a.id}`);
  }

  // Validate a Wave 5 episode using new IDs
  const ep = clone(PRESET_EPISODES[0]);
  ep.cast.push({
    id: 'w5_zeus',
    name: 'Zeus Thunderer',
    archetype: 'zeus_thunderer',
    primaryColor: ARCHETYPE_DEFAULT_COLORS.zeus_thunderer.primary,
    accentColor: ARCHETYPE_DEFAULT_COLORS.zeus_thunderer.accent,
    skinColor: ARCHETYPE_DEFAULT_COLORS.zeus_thunderer.skin,
  });
  ep.beats[0] = {
    ...ep.beats[0],
    stage: 'babylon_hanging_gardens',
    mood: 'golden_hour_cinema',
    prop: 'katana_blade',
    weather: 'meteor_shower',
    crowd: 'stadium_fans',
    fx: 'lightning_web',
    actors: [
      {
        castId: 'w5_zeus',
        slot: 'center',
        pose: 'attack',
        expression: 'angry',
        facing: 'right',
        motion: 'still',
      },
    ],
  };
  const val = validateEpisodeScript(ep);
  assert.equal(val.ok, true, `Wave 5 episode failed validation: ${val.ok ? '' : val.error}`);

  // Smoke-render every single item twice and verify bit-identical signatures + zero NaNs
  const mockA = createAuditedMockCanvas2D();
  const mockB = createAuditedMockCanvas2D();

  const runFullSweep = (m: ReturnType<typeof createAuditedMockCanvas2D>) => {
    const pal = MOOD_PALETTES.golden_hour_cinema;
    for (let i = 0; i < STAGE_CATALOG.length; i++) {
      const moodId = MOOD_CATALOG[i % MOOD_CATALOG.length].id;
      drawStageBackdrop(m.ctx, 640, 360, STAGE_CATALOG[i].id, moodId, 1.35);
    }
    for (const a of ARCHETYPE_CATALOG) {
      const col = ARCHETYPE_DEFAULT_COLORS[a.id];
      const member = {
        id: `w5_${a.id}`,
        name: a.label,
        archetype: a.id,
        primaryColor: col.primary,
        accentColor: col.accent,
        skinColor: col.skin,
      };
      drawActorCloseUp(m.ctx, member, 'calm', 2, 0.45, 'right', 1.15);
      drawActorFullBody(m.ctx, member, 320, 300, 1.0, 'stand', 'joy', 'right', 2, 0.45, 1.15, 0.5, 'still');
    }
    for (const p of PROP_CATALOG) {
      if (p.id === 'none') continue;
      drawStoryProp(m.ctx, p.id, 320, 180, 1.0, 1.15, 0.5);
    }
    for (const w of WEATHER_LIST) {
      if (!drawAtlasWeather(m.ctx, 640, 360, w, pal, 1.35)) {
        drawUniversalWeather(m.ctx, 640, 360, w, pal, 1.35);
      }
    }
    for (const c of CROWD_CATALOG) {
      if (!drawAtlasCrowdLayer(m.ctx, 640, 360, c.id, pal, 1.35, ep.beats[0], 0)) {
        drawUniversalCrowdLayer(m.ctx, 640, 360, c.id, pal, 1.35, ep.beats[0], 0);
      }
    }
    for (const fx of FX_LIST) {
      if (!drawAtlasBeatFx(m.ctx, 640, 360, fx, 0.5, 1.35)) {
        drawUniversalBeatFx(m.ctx, 640, 360, fx, 0.5, 1.35);
      }
    }
  };

  runFullSweep(mockA);
  runFullSweep(mockB);

  assert.equal(mockA.getNanCount(), 0, `Wave 5 render sweep produced ${mockA.getNanCount()} NaN coordinates`);
  assert.equal(mockA.getOps(), mockB.getOps(), 'Wave 5 draw op counts must be identical on repeat pass');
  assert.equal(mockA.getSignature(), mockB.getSignature(), 'Wave 5 draw call signatures must be bit-identical');
  assert.ok(mockA.getOps() > 12000, `Expected >12000 canvas draw ops across Wave 5 catalogs, got ${mockA.getOps()}`);
});

// ---------------------------------------------------------------------------
// Test 49 (Wave 5): Procedural Studio 84 Backdrops, 84 Prop Presets & 25 Act Arcs
// ---------------------------------------------------------------------------
test('49. Wave 5: All 84 backdrop themes, 84 procedural prop presets & 25 4-Act Visual Arcs are deterministic and distinct', () => {
  assert.equal(BACKDROP_THEMES.length, 84, `Expected 84 backdrop themes, got ${BACKDROP_THEMES.length}`);
  assert.equal(CUSTOM_PROP_PRESETS.length, 84, `Expected 84 custom prop presets, got ${CUSTOM_PROP_PRESETS.length}`);
  assert.equal(ACT_ARC_PRESETS.length, 25, `Expected 25 act arc presets, got ${ACT_ARC_PRESETS.length}`);

  const backdropUrls = new Set<string>();
  for (const theme of BACKDROP_THEMES) {
    const a = generateProceduralBackdropDataUrl({ theme: theme.id, seed: 21 });
    const b = generateProceduralBackdropDataUrl({ theme: theme.id, seed: 21 });
    assert.equal(a.dataUrl, b.dataUrl, `Backdrop theme ${theme.id} must be deterministic`);
    assert.ok(a.dataUrl.startsWith('data:image/') && a.dataUrl.length > 100);
    backdropUrls.add(a.dataUrl);
  }
  assert.equal(backdropUrls.size, 84, `Expected 84 distinct procedural backdrop outputs, got ${backdropUrls.size}`);

  const propUrls = new Set<string>();
  for (const preset of CUSTOM_PROP_PRESETS) {
    const a = generateProceduralPropDataUrl({ preset: preset.id, seed: 17 });
    const b = generateProceduralPropDataUrl({ preset: preset.id, seed: 17 });
    assert.equal(a.dataUrl, b.dataUrl, `Prop preset ${preset.id} must be deterministic`);
    assert.ok(a.dataUrl.startsWith('data:image/') && a.dataUrl.length > 100);
    propUrls.add(a.dataUrl);
  }
  assert.equal(propUrls.size, 84, `Expected 84 distinct procedural prop outputs, got ${propUrls.size}`);

  const baseEp = clone(PRESET_EPISODES[0]);
  const arcSignatures = new Set<string>();
  for (const arc of ACT_ARC_PRESETS) {
    const appliedA = applyActVisualProgression(baseEp, arc.id);
    const appliedB = applyActVisualProgression(baseEp, arc.id);
    assert.deepEqual(appliedA, appliedB, `Act arc ${arc.id} must be deterministic`);
    assert.equal(validateEpisodeScript(appliedA.episode).ok, true, `Act arc ${arc.id} failed validation`);
    arcSignatures.add(
      appliedA.episode.beats.map((b) => `${b.mood}:${b.weather}:${b.transition}`).join('|')
    );
  }
  assert.ok(arcSignatures.size >= 20, `Expected >=20 distinct 4-Act mood/weather arcs, got ${arcSignatures.size}`);
});

// ---------------------------------------------------------------------------
// Test 50 (Wave 5): 192 Sprite Workshop Presets (12 Categories) & 24 Wave 5 CharacterDNA Parts
// ---------------------------------------------------------------------------
test('50. Wave 5: 192 curated DNA sprite presets across 12 categories & 24 new DNA parts validate and render cleanly with zero NaNs', () => {
  assert.equal(SPRITE_WORKSHOP_PRESETS.length, 192, `Expected 192 sprite presets, got ${SPRITE_WORKSHOP_PRESETS.length}`);
  assert.equal(SPRITE_PRESET_CATEGORIES.length, 12, `Expected 12 sprite categories, got ${SPRITE_PRESET_CATEGORIES.length}`);

  const seenIds = new Set<string>();
  const seenCats = new Set<string>();
  for (const p of SPRITE_WORKSHOP_PRESETS) {
    assert.equal(seenIds.has(p.id), false, `Duplicate sprite preset ID: ${p.id}`);
    seenIds.add(p.id);
    seenCats.add(p.category);
  }
  assert.equal(seenCats.size, 12, `Expected presets covering all 12 categories, got ${seenCats.size}`);

  const w5Headwear = [
    'samurai_kabuto', 'chef_toque', 'grad_cap', 'viking_horns',
    'nurse_cap', 'cowboy_hat', 'diver_helmet', 'elf_circlet',
  ] as const;
  const w5Tops = [
    'business_suit', 'space_exo', 'kimono_robe', 'hoodie_street',
    'medieval_plate', 'pirate_coat', 'lab_coat', 'sports_jersey',
  ] as const;
  const w5Patterns = [
    'circuit_traces', 'starfield_constellation', 'camo_tactical', 'dragon_scales',
    'plaid_tartan', 'wave_seigaiha', 'honeycomb_hex', 'floral_botanical',
  ] as const;

  const mock = createAuditedMockCanvas2D();
  const baseDna = createBaseDna('humanoid');

  for (let i = 0; i < 8; i++) {
    const hw = w5Headwear[i];
    const top = w5Tops[i];
    const pat = w5Patterns[i];
    const norm = validateAndNormalizeDna({
      ...baseDna,
      outfit: { ...baseDna.outfit, headwear: hw, topStyle: top, surfacePattern: pat },
    });
    assert.ok(norm, `Failed to validate Wave 5 DNA combo ${hw}/${top}/${pat}`);
    assert.equal(norm.outfit.headwear, hw);
    assert.equal(norm.outfit.topStyle, top);
    assert.equal(norm.outfit.surfacePattern, pat);

    const member = syncMemberWithDna(
      {
        id: `w5_dna_${i}`,
        name: `W5 DNA ${i}`,
        archetype: 'zeus_thunderer',
        primaryColor: '#3b82f6',
        accentColor: '#f59e0b',
        skinColor: '#e0b088',
      },
      norm
    );
    drawModularEntityCloseUp(mock.ctx, member, norm, 'joy', 2, 0.5, 'right', 1.2);
    drawModularEntityFullBody(mock.ctx, member, norm, 280, 290, 1.0, 'stand', 'calm', 'right', 2, 0.4, 1.2, 0.5, 'still');
  }

  for (let i = 0; i < SPRITE_WORKSHOP_PRESETS.length; i++) {
    const preset = SPRITE_WORKSHOP_PRESETS[i];
    const norm = validateAndNormalizeDna(preset.dna);
    assert.ok(norm, `Invalid DNA in sprite preset ${preset.id}`);
    const member = buildCastMemberFromSpritePreset(preset, i);
    drawModularEntityCloseUp(mock.ctx, member, norm, 'calm', 1, 0.3, 'right', 1.0);
    drawModularEntityFullBody(mock.ctx, member, norm, 280, 290, 1.0, 'stand', 'warm', 'right', 1, 0.3, 1.0, 0.4, 'still');
  }

  assert.equal(mock.getNanCount(), 0, `Modular entity rendering produced ${mock.getNanCount()} NaN coordinates`);
  assert.ok(mock.getOps() > 10000, `Expected >10000 draw ops across 192 presets, got ${mock.getOps()}`);
});

// ---------------------------------------------------------------------------
// Test 51 (Wave 5): Exhaustive Stage Acoustics, Volumetric Lighting, Reflections, Parallax & Archetype Gaits
// ---------------------------------------------------------------------------
test('51. Wave 5: All 150 stages resolve acoustics, lighting, reflections & parallax and all 160 archetypes resolve kinematics', () => {
  const validBeamKinds = new Set([
    'temple_godrays',
    'moonlight_shafts',
    'window_sunbeams',
    'hearth_glow',
    'mist_canopy',
  ]);
  const validReflectKinds = new Set(['water', 'wet_street', 'polished_marble', 'none']);
  const baseBeat = clone(PRESET_EPISODES[0].beats[0]);
  baseBeat.frame = 'main';
  baseBeat.shot = 'wide_stage';
  const style = resolveVisualStyle({ lightShafts: 0.55 });

  for (let i = 0; i < STAGE_CATALOG.length; i++) {
    const st = STAGE_CATALOG[i];
    const mood = MOOD_CATALOG[i % MOOD_CATALOG.length].id;

    const ac = getStageRoomAcoustics(st.id);
    assert.ok(ac.profileId.length > 0 && Number.isFinite(ac.rt60Sec) && ac.wetMix >= 0);

    const beamKind = resolveVolumetricBeamKind(st.id, mood);
    assert.ok(validBeamKinds.has(beamKind), `Invalid beamKind ${beamKind} for ${st.id}`);

    const plan = computeVolumetricLightPlan({ ...baseBeat, stage: st.id, mood }, style, 1.25, 'chiaroscuro');
    assert.equal(plan.enabled, true);
    assert.equal(plan.beamColorRgb.every((c) => Number.isFinite(c)), true);

    const refl = getStageReflectionProfile(st.id, 'none');
    assert.ok(validReflectKinds.has(refl.kind));

    const fg = classifyForegroundFrame(st.id);
    assert.ok(typeof fg === 'string' && fg.length > 0);
  }

  // Verify Wave 5 weather reflection triggers (acid_rain & hailstorm wet outdoor stages)
  assert.equal(getStageReflectionProfile('african_sunset_savanna', 'acid_rain').kind, 'wet_street');
  assert.equal(getStageReflectionProfile('suburban_cul_de_sac', 'hailstorm').kind, 'wet_street');
  assert.equal(getStageReflectionProfile('coral_reef_lagoon', 'none').kind, 'water');
  assert.equal(getStageReflectionProfile('hospital_operating_room', 'none').kind, 'polished_marble');

  // Verify all 160 archetypes resolve valid kinematics
  for (const a of ARCHETYPE_CATALOG) {
    const kin = getArchetypeKinematics(a.id);
    assert.ok(Number.isFinite(kin.strideHz) && kin.strideHz > 0, `Invalid kinematics for ${a.id}`);
    assert.ok(Number.isFinite(kin.bobAmp) && Number.isFinite(kin.armSwingAmp));
  }
});

// ---------------------------------------------------------------------------
// Test 52 (Wave 5): Live Director SKILL.md Reflects Exact Wave 5 Counts & New IDs
// ---------------------------------------------------------------------------
test('52. Wave 5: buildStagecraftDirectorSkillMd reports exact Wave 5 counts (160/150/185/40/30/30/36/192) & Wave 5 parts', () => {
  const md = buildStagecraftDirectorSkillMd();
  for (const token of [
    'Cast Archetypes (160)',
    'Stage Backdrops (150)',
    'Story Props (185: 184 + `none`)',
    'Lighting Moods (40)',
    'Weather Systems (30)',
    'Crowd Layers (30)',
    'Kinetic Beat FX (36)',
    'Curated CharacterDNA Sprite Presets (192)',
    'across 12 categories',
    '84 Backdrop Themes',
    '84 Custom Prop Presets',
    '25 4-Act Visual Arc Presets',
    'zeus_thunderer',
    'babylon_hanging_gardens',
    'katana_blade',
    'golden_hour_cinema',
    'samurai_kabuto',
    'space_exo',
    'dragon_scales',
  ]) {
    assert.ok(md.includes(token), `Expected Wave 5 Director SKILL.md to include "${token}"`);
  }
});

// ---------------------------------------------------------------------------
// Test 53 (Wave 6 · Upgrade 28): Analytical 2D Particle, Ribbon & Ring VFX Engine
// ---------------------------------------------------------------------------
test('53. Upgrade 28: Analytical F-curve, stateless particle scrubbing, ribbon/ring rendering & vfxIntensity clamping', () => {
  const src = fs
    .readFileSync(path.join(process.cwd(), 'src/studio/vfxEmitterEngine.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  assert.equal(/\bMath\.random\s*\(/.test(src), false, 'vfxEmitterEngine.ts must never call Math.random()');

  // 3-point F-curve endpoints and midpoint
  assert.ok(Math.abs(evalThreePointFCurve(0, 0.2, 1.0, 0.0, 0.4) - 0.2) < 1e-6);
  assert.ok(Math.abs(evalThreePointFCurve(0.4, 0.2, 1.0, 0.0, 0.4) - 1.0) < 1e-6);
  assert.ok(Math.abs(evalThreePointFCurve(1, 0.2, 1.0, 0.0, 0.4) - 0.0) < 1e-6);

  // Bit-exact deterministic stateless sampling (forward/backward scrub invariance)
  const spec = {
    seed: hashVfxSeed('clash_test'),
    originX: 640,
    originY: 360,
    lifeSec: 1.2,
    speedMin: 80,
    speedMax: 240,
    gravityY: 120,
    drag: 0.9,
    vortexTorque: 0.7,
    turbulenceAmp: 14,
  };
  const pA = sampleAnalyticalParticle(5, 24, 0.45, spec);
  // Scrub elsewhere then return to 0.45
  sampleAnalyticalParticle(5, 24, 0.95, spec);
  const pB = sampleAnalyticalParticle(5, 24, 0.45, spec);
  assert.deepEqual(pA, pB, 'Analytical particle must be bit-identical on backward scrub');
  assert.ok(Number.isFinite(pA.x) && Number.isFinite(pA.y) && Number.isFinite(pA.alpha));
  assert.equal(pA.alive, true);

  // Render smoke test with NaN + determinism audit
  const mockA = createAuditedMockCanvas2D();
  const mockB = createAuditedMockCanvas2D();
  const beat = clone(PRESET_EPISODES[0].beats[0]);
  beat.fx = 'shock_burst';
  beat.sfx = 'sword_clash';
  beat.actors = [{ castId: PRESET_EPISODES[0].cast[0].id, slot: 'center', pose: 'attack', expression: 'angry', facing: 'right', motion: 'leap_arc' }];
  const actors = [
    {
      actor: beat.actors[0],
      x: 640,
      y: 520,
      scale: 1.0,
    },
  ];

  const runVfx = (m: ReturnType<typeof createAuditedMockCanvas2D>) => {
    drawAnalyticalRibbonTrail(
      m.ctx,
      [
        { x: 400, y: 360 },
        { x: 480, y: 320 },
        { x: 580, y: 310 },
        { x: 670, y: 350 },
      ],
      { widthStart: 2, widthMid: 14, widthEnd: 4, colorStart: '#ff4d6d', colorMid: '#f2c85b', colorEnd: '#ffffff' }
    );
    drawAnalyticalVfxRing(m.ctx, 640, 360, 0.42, {
      innerStart: 16,
      innerMid: 72,
      innerEnd: 150,
      outerStart: 30,
      outerMid: 102,
      outerEnd: 180,
      colorOuter: '#f2c85b',
      colorInner: '#ffffff',
      tickCount: 12,
    });
    drawAnalyticalBeatVfxLayer(m.ctx, 1280, 720, beat, actors, 0.35, 1.35, MOOD_PALETTES.midnight_banyan, 0.85);
  };
  runVfx(mockA);
  runVfx(mockB);
  assert.equal(mockA.getNanCount(), 0);
  assert.equal(mockA.getSignature(), mockB.getSignature());
  assert.ok(mockA.getOps() > 30);

  // vfxIntensity clamping in resolveVisualStyle & validateEpisodeScript
  assert.equal(resolveVisualStyle({}).vfxIntensity, 0.75);
  assert.equal(resolveVisualStyle({ vfxIntensity: 2.5 }).vfxIntensity, 1);
  assert.equal(resolveVisualStyle({ vfxIntensity: -0.4 }).vfxIntensity, 0);
  const ep = clone(PRESET_EPISODES[0]);
  ep.visualStyle = { ...(ep.visualStyle || {}), vfxIntensity: 1.8 };
  const val = validateEpisodeScript(ep);
  assert.equal(val.ok, true);
  if (val.ok) assert.equal(val.script.visualStyle?.vfxIntensity, 1);
});

// ---------------------------------------------------------------------------
// Test 54 (Wave 6 · Upgrade 29): Zero-Allocation Pooled 2D Shockwave Refraction Pass
// ---------------------------------------------------------------------------
test('54. Upgrade 29: computeShockwaveDistortionSpec triggers on impacts & applyPooledShockwaveDistortion keeps pool <= 1', () => {
  const src = fs
    .readFileSync(path.join(process.cwd(), 'src/studio/vfxDistortionPass.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  assert.equal(/\bMath\.random\s*\(/.test(src), false, 'vfxDistortionPass.ts must never call Math.random()');

  const beat = clone(PRESET_EPISODES[0].beats[0]);
  beat.fx = 'shock_burst';
  beat.sfx = 'sword_clash';
  const hitstop = computeHitstopState(beat, 12, STUDIO_FPS, true);

  const activeSpec = computeShockwaveDistortionSpec(beat, hitstop, 0.22, 640, 360, 1280, 720, 0.85);
  assert.equal(activeSpec.active, true, 'Expected active shockwave distortion for shock_burst');
  assert.ok(activeSpec.radiusPx > 10 && activeSpec.bandWidthPx > 2 && activeSpec.refractionPx > 0);

  const disabledSpec = computeShockwaveDistortionSpec(beat, hitstop, 0.22, 640, 360, 1280, 720, 0);
  assert.equal(disabledSpec.active, false, 'vfxIntensity=0 must disable shockwave distortion');

  const calmBeat = { ...beat, fx: 'none' as const, sfx: 'none' as const, actionCues: undefined };
  const calmHitstop = computeHitstopState(calmBeat, 12, STUDIO_FPS, true);
  const calmSpec = computeShockwaveDistortionSpec(calmBeat, calmHitstop, 0.5, 640, 360, 1280, 720, 0.8);
  assert.equal(calmSpec.active, false, 'Calm beat must not trigger shockwave distortion');

  const mock = createAuditedMockCanvas2D();
  for (let i = 0; i < 6; i++) {
    applyPooledShockwaveDistortion(mock.ctx, 1280, 720, activeSpec);
  }
  assert.equal(mock.getNanCount(), 0);
  assert.ok(getDistortionPoolAllocationCount() <= 1, `Expected distortion pool <= 1, got ${getDistortionPoolAllocationCount()}`);
});

// ---------------------------------------------------------------------------
// Test 55 (Wave 6 · Upgrade 30): Tactile Photographed Cardstock Papercraft Overhaul
// ---------------------------------------------------------------------------
test('55. Upgrade 30: Papercraft bevel/shadow/tilt-shift render cleanly with pool <= 1 & tiltShiftAmount clamps cleanly', () => {
  const src = fs
    .readFileSync(path.join(process.cwd(), 'src/studio/papercraftCraft.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  assert.equal(/\bMath\.random\s*\(/.test(src), false, 'papercraftCraft.ts must never call Math.random()');

  const styleSrc = fs.readFileSync(path.join(process.cwd(), 'src/studio/styleEngines.ts'), 'utf8');
  assert.ok(styleSrc.includes('drawPapercraftLayeredShadow'), 'styleEngines.ts must use drawPapercraftLayeredShadow');
  assert.ok(styleSrc.includes('drawCardstockCutBevel'), 'styleEngines.ts must use drawCardstockCutBevel');
  assert.ok(styleSrc.includes('applyPooledTiltShiftBand'), 'styleEngines.ts must use applyPooledTiltShiftBand');

  const mock = createAuditedMockCanvas2D();
  const dummyCutout = { width: 640, height: 360 } as unknown as HTMLCanvasElement;
  drawPapercraftLayeredShadow(mock.ctx, dummyCutout, 'right', '#2a1b12', 1.0);
  drawCardstockCutBevel(mock.ctx, dummyCutout, 'right', 1.0);
  applyPooledTiltShiftBand(mock.ctx, 640, 360, 0.55);
  assert.equal(mock.getNanCount(), 0);
  assert.ok(mock.getOps() >= 3, 'Expected cardstock shadow & bevel draw ops');
  assert.ok(getTiltShiftPoolAllocationCount() <= 1, `Expected tilt-shift pool <= 1, got ${getTiltShiftPoolAllocationCount()}`);

  // tiltShiftAmount clamping
  assert.equal(resolveVisualStyle({}).tiltShiftAmount, 0);
  assert.equal(resolveVisualStyle({ tiltShiftAmount: 4 }).tiltShiftAmount, 1);
  assert.equal(resolveVisualStyle({ tiltShiftAmount: -1 }).tiltShiftAmount, 0);
  const ep = clone(PRESET_EPISODES[0]);
  ep.visualStyle = { ...(ep.visualStyle || {}), tiltShiftAmount: 0.65 };
  const val = validateEpisodeScript(ep);
  assert.equal(val.ok, true);
  if (val.ok) assert.equal(val.script.visualStyle?.tiltShiftAmount, 0.65);
});

// ---------------------------------------------------------------------------
// Test 56 (Wave 6 · Upgrade 31): Pop-Up Book Spring-Hinge Transitions & Fold Physics
// ---------------------------------------------------------------------------
test('56. Upgrade 31: computePopupHingeTransform folds -> overshoots -> settles, popup_fold validates & renders deterministically', () => {
  const folded = computePopupHingeTransform(0.0, 0, 0.42);
  assert.ok(folded.scaleY < 0.25, `Expected folded scaleY < 0.25, got ${folded.scaleY}`);
  assert.equal(folded.settled, false);

  // Sample across 0..0.42s to verify overshoot above 1.0 before settling
  let maxScaleY = 0;
  for (let i = 1; i <= 40; i++) {
    const tr = computePopupHingeTransform((i / 40) * 0.42, 0, 0.42);
    if (tr.scaleY > maxScaleY) maxScaleY = tr.scaleY;
    assert.ok(Number.isFinite(tr.scaleY) && Number.isFinite(tr.skewX) && Number.isFinite(tr.liftPx));
  }
  assert.ok(maxScaleY > 1.01, `Expected spring overshoot > 1.01, got ${maxScaleY}`);

  const settled = computePopupHingeTransform(0.55, 0, 0.42);
  assert.equal(settled.settled, true);
  assert.equal(settled.scaleY, 1);
  assert.equal(settled.skewX, 0);

  // 'popup_fold' in TRANSITION_CATALOG and survives validator
  assert.ok(TRANSITION_CATALOG.some((t) => t.id === 'popup_fold'), 'Expected popup_fold in TRANSITION_CATALOG');
  const ep = clone(PRESET_EPISODES[0]);
  ep.beats[0].transition = 'popup_fold';
  const val = validateEpisodeScript(ep);
  assert.equal(val.ok, true);
  if (val.ok) assert.equal(val.script.beats[0].transition, 'popup_fold');

  // Render smoke test + determinism
  const mockA = createAuditedMockCanvas2D();
  const mockB = createAuditedMockCanvas2D();
  drawPopupFoldTransition(mockA.ctx, 1280, 720, 0.06, '#f2c85b', 'right');
  drawPopupFoldTransition(mockB.ctx, 1280, 720, 0.06, '#f2c85b', 'right');
  assert.equal(mockA.getNanCount(), 0);
  assert.equal(mockA.getSignature(), mockB.getSignature());
  assert.ok(mockA.getOps() >= 4);
});

// ---------------------------------------------------------------------------
// Test 57 (Wave 6 · Upgrade 32): Tactile Paper & Cardstock Procedural Foley
// ---------------------------------------------------------------------------
test('57. Upgrade 32: planBeatFoleyEvents stays 1-arg backward-compatible & plans paper_turn / cardstock_fold / hinge_pop deterministically', () => {
  const foleySrc = fs
    .readFileSync(path.join(process.cwd(), 'src/studio/proceduralFoley.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  assert.equal(/\bMath\.random\s*\(/.test(foleySrc), false, 'proceduralFoley.ts must never call Math.random()');

  const beat = clone(PRESET_EPISODES[0].beats[0]);
  beat.transition = 'hard_cut';
  // 1-arg backward compatibility
  const legacyEvents = planBeatFoleyEvents(beat);
  assert.ok(Array.isArray(legacyEvents));

  // Papercraft diorama style triggers paper foley automatically
  const paperBeat = { ...beat, transition: 'popup_fold' as const };
  const paperEventsA = planBeatFoleyEvents(paperBeat, 'papercraft_diorama');
  const paperEventsB = planBeatFoleyEvents(paperBeat, 'papercraft_diorama');
  assert.deepEqual(paperEventsA, paperEventsB, 'Paper foley plan must be deterministic');

  const kinds = new Set(paperEventsA.map((e) => e.kind));
  assert.ok(kinds.has('paper_turn'), 'Expected paper_turn event for popup_fold');
  assert.ok(kinds.has('cardstock_fold'), 'Expected cardstock_fold event for papercraft/popup_fold');
  assert.ok(kinds.has('hinge_pop'), 'Expected hinge_pop event for pop-up actors');
});

// ---------------------------------------------------------------------------
// Test 58 (Wave 6 · Upgrade 33): 20-Engine Craft Matrix, Anti-Slop Checklist & Lean Routed SKILL.md
// ---------------------------------------------------------------------------
test('58. Upgrade 33: Full SKILL.md includes 20-engine Craft Matrix + Anti-Slop Checklist & Routed SKILL.md cuts size by >55%', () => {
  assert.equal(Object.keys(ENGINE_CRAFT_MATRIX).length, 20, 'Expected craft matrix for all 20 art engines');
  assert.equal(ANTI_SLOP_CRITIQUE_CHECKLIST.length, 5, 'Expected 5-point Anti-Slop Checklist');

  const fullMd = buildStagecraftDirectorSkillMd();
  for (const rs of RENDER_STYLE_CATALOG) {
    assert.ok(fullMd.includes(`| \`${rs.id}\` |`), `Expected 20-Engine Craft Matrix row for ${rs.id}`);
  }
  for (const token of ['20-Engine Craft Matrix', '5-Point Anti-Slop Critique Checklist', 'vfxIntensity', 'tiltShiftAmount', 'popup_fold']) {
    assert.ok(fullMd.includes(token), `Expected full SKILL.md to contain "${token}"`);
  }

  const routedMd = buildRoutedDirectorSkillMd({ query: 'cyberpunk rain detective', maxPerCategory: 6 });
  assert.ok(routedMd.startsWith('---\nname: stagecraft-director-routed\n'));
  assert.ok(
    routedMd.length < fullMd.length * 0.45,
    `Expected routed SKILL.md (${routedMd.length} chars) < 45% of full SKILL.md (${fullMd.length} chars)`
  );
  assert.ok(routedMd.includes('Selected Engine Craft Recipe'), 'Routed SKILL.md must include selected engine craft recipe');
  assert.ok(routedMd.includes('BM25-Routed Shortlist'), 'Routed SKILL.md must include BM25 shortlist');
});

// ---------------------------------------------------------------------------
// Test 59 (Wave 6 · Upgrade 34): Pure-TS Okapi BM25 Semantic Search Over 1,150+ Assets
// ---------------------------------------------------------------------------
test('59. Upgrade 34: BM25 index covers >=1,150 items, ranks semantic queries accurately & recommendScenePaletteForPrompt is deterministic', () => {
  const searchSrc = fs
    .readFileSync(path.join(process.cwd(), 'src/studio/catalogSearchIndex.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  assert.equal(/\bMath\.random\s*\(/.test(searchSrc), false, 'catalogSearchIndex.ts must never call Math.random()');

  const total = getCatalogIndexSize();
  assert.ok(total >= 1150, `Expected >=1,150 indexed studio items, got ${total}`);

  // Semantic query 1: cyberpunk rain detective
  const cyberHits = searchStudioCatalog('cyberpunk rain detective', { limit: 15 });
  assert.ok(cyberHits.length >= 5);
  const cyberIds = cyberHits.map((h) => h.id);
  assert.ok(
    cyberIds.some((id) => id.includes('cyber') || id.includes('noir') || id.includes('detective') || id.includes('rain')),
    `Expected cyberpunk/noir/detective hits, got: ${cyberIds.slice(0, 8).join(', ')}`
  );

  // Semantic query 2: thunder god
  const thunderArch = searchStudioCatalog('thunder god', { kinds: ['archetype'], limit: 8 });
  assert.ok(
    thunderArch.some((h) => h.id === 'zeus_thunderer' || h.id.includes('thunder') || h.id.includes('deity')),
    `Expected zeus_thunderer or storm deity in top hits, got: ${thunderArch.map((h) => h.id).join(', ')}`
  );

  // recommendScenePaletteForPrompt determinism + valid catalog IDs
  const palA = recommendScenePaletteForPrompt('cyberpunk rain detective');
  const palB = recommendScenePaletteForPrompt('cyberpunk rain detective');
  assert.deepEqual(palA, palB);
  assert.ok(STAGE_CATALOG.some((s) => s.id === palA.stage));
  assert.ok(ARCHETYPE_CATALOG.some((a) => a.id === palA.archetype));
  assert.ok(PROP_CATALOG.some((p) => p.id === palA.prop));
  assert.ok(MOOD_CATALOG.some((m) => m.id === palA.mood));
  assert.ok(WEATHER_LIST.includes(palA.weather));
  assert.ok(FX_LIST.includes(palA.fx));
  assert.ok(RENDER_STYLE_CATALOG.some((r) => r.id === palA.renderStyle));
});

// ---------------------------------------------------------------------------
// Test 60 (Wave 6 · Upgrade 35): Instant Story Remix Blueprint Engine (12 Blueprints)
// ---------------------------------------------------------------------------
test('60. Upgrade 35: All 12 STORY_REMIX_BLUEPRINTS generate deterministic, validated, high-craft episodes that render cleanly', () => {
  const remixSrc = fs
    .readFileSync(path.join(process.cwd(), 'src/studio/storyRemixEngine.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  assert.equal(/\bMath\.random\s*\(/.test(remixSrc), false, 'storyRemixEngine.ts must never call Math.random()');

  assert.equal(STORY_REMIX_BLUEPRINTS.length, 12, `Expected 12 story remix blueprints, got ${STORY_REMIX_BLUEPRINTS.length}`);
  assert.equal(new Set(STORY_REMIX_BLUEPRINTS.map((b) => b.id)).size, 12, 'Blueprint IDs must be unique');

  const mock = createAuditedMockCanvas2D();

  for (const bp of STORY_REMIX_BLUEPRINTS) {
    const epA = remixStoryBlueprint({
      blueprintId: bp.id,
      topicTitle: `${bp.label} Probe`,
      themeQuery: bp.defaultThemeQuery,
      aspect: '16:9',
    });
    const epB = remixStoryBlueprint({
      blueprintId: bp.id,
      topicTitle: `${bp.label} Probe`,
      themeQuery: bp.defaultThemeQuery,
      aspect: '16:9',
    });

    assert.deepEqual(epA, epB, `Blueprint ${bp.id} must be deterministic`);

    const val = validateEpisodeScript(epA);
    assert.equal(val.ok, true, `Blueprint ${bp.id} failed validation: ${val.ok ? '' : val.error}`);
    assert.ok(epA.beats.length >= 5, `Blueprint ${bp.id} should have >=5 beats`);
    assert.ok(epA.cast.length >= 2, `Blueprint ${bp.id} should have >=2 cast members`);
    assert.notEqual(
      epA.cast[0].archetype,
      epA.cast[1].archetype,
      `Blueprint ${bp.id} must diversify lead vs foil archetypes`
    );

    const craft = scoreEpisodeVisualCraft(epA);
    assert.ok(
      craft.totalScore >= 12,
      `Blueprint ${bp.id} expected Visual Craft >= 12/18, got ${craft.totalScore}/18`
    );

    // Smoke-render beat 0 backdrop + analytical VFX layer with zero NaNs
    const b0 = epA.beats[0];
    const pal = MOOD_PALETTES[b0.mood] || MOOD_PALETTES.midnight_banyan;
    drawStageBackdrop(mock.ctx, 640, 360, b0.stage, b0.mood, 0.5);
    drawAnalyticalBeatVfxLayer(
      mock.ctx,
      640,
      360,
      b0,
      [{ actor: b0.actors[0], x: 320, y: 260, scale: 0.75 }],
      0.28,
      0.28,
      pal,
      epA.visualStyle?.vfxIntensity ?? 0.75
    );
  }

  assert.equal(mock.getNanCount(), 0, `Remix blueprint smoke render produced ${mock.getNanCount()} NaN coordinates`);
});

// ---------------------------------------------------------------------------
// Test 61 (Wave 7): Living LLM Docs Zero-Drift Audit
// ---------------------------------------------------------------------------
test('61. Wave 7 Living LLM Docs: STAGECRAFT_LLM_INSTRUCTIONS.md & LLM_STORY_STAGE_GUIDE.md auto-sync block match live catalogs with zero drift', () => {
  const instructionsPath = path.join(process.cwd(), 'STAGECRAFT_LLM_INSTRUCTIONS.md');
  const guidePath = path.join(process.cwd(), 'LLM_STORY_STAGE_GUIDE.md');
  assert.equal(fs.existsSync(instructionsPath), true, 'STAGECRAFT_LLM_INSTRUCTIONS.md must exist');
  assert.equal(fs.existsSync(guidePath), true, 'LLM_STORY_STAGE_GUIDE.md must exist');

  const fpA = computeStudioCatalogFingerprint();
  const fpB = computeStudioCatalogFingerprint();
  assert.equal(fpA, fpB, 'Catalog fingerprint must be 100% deterministic');
  assert.equal(fpA.length, 16, 'Catalog fingerprint must be 16 hex chars');

  const expectedInstructions = buildStagecraftLlmInstructionsMd();
  const actualInstructions = fs.readFileSync(instructionsPath, 'utf8');
  assert.equal(
    actualInstructions,
    expectedInstructions,
    'STAGECRAFT_LLM_INSTRUCTIONS.md drifted from live catalogs — run `npm run sync-docs`'
  );
  assert.ok(actualInstructions.includes('### 5.7 Sims-Grade Granular Character Customization'));
  assert.ok(actualInstructions.includes(fpA));

  const actualGuide = fs.readFileSync(guidePath, 'utf8');
  const startIdx = actualGuide.indexOf(AUTO_SYNC_START_MARKER);
  const endIdx = actualGuide.indexOf(AUTO_SYNC_END_MARKER);
  assert.ok(startIdx !== -1 && endIdx > startIdx, 'LLM_STORY_STAGE_GUIDE.md must contain auto-sync markers');
  const actualBlock = actualGuide.slice(startIdx, endIdx + AUTO_SYNC_END_MARKER.length);
  const expectedBlock = buildGuideAutoSyncSectionMd();
  assert.equal(
    actualBlock,
    expectedBlock,
    'LLM_STORY_STAGE_GUIDE.md auto-sync block drifted — run `npm run sync-docs`'
  );
});

// ---------------------------------------------------------------------------
// Test 62 (Wave 7 · Upgrades 36–39): Granular DNA Catalog Counts, Clamping & 100% Backward Compatibility
// ---------------------------------------------------------------------------
test('62. Wave 7 Upgrades 36–39: All 18 granular DNA catalogs have exact counts, morphs clamp, bodyMarks cap at 3 & all 192 legacy presets stay valid', () => {
  assert.equal(EYEBROW_STYLE_CATALOG.length, 10);
  assert.equal(PUPIL_STYLE_CATALOG.length, 8);
  assert.equal(EYELASH_STYLE_CATALOG.length, 5);
  assert.equal(MOUTH_STYLE_CATALOG.length, 8);
  assert.equal(HAIR_STYLE_CATALOG.length, 24);
  assert.equal(FACIAL_HAIR_CATALOG.length, 13);
  assert.equal(FACE_MARK_CATALOG.length, 22);
  assert.equal(BODY_MARK_CATALOG.length, 16);
  assert.equal(OUTERWEAR_CATALOG.length, 14);
  assert.equal(SLEEVE_CATALOG.length, 7);
  assert.equal(WAIST_CATALOG.length, 10);
  assert.equal(GLOVE_CATALOG.length, 9);
  assert.equal(FOOTWEAR_CATALOG.length, 12);
  assert.equal(EYEWEAR_CATALOG.length, 12);
  assert.equal(EAR_JEWELRY_CATALOG.length, 9);
  assert.equal(NECKWEAR_CATALOG.length, 10);
  assert.equal(WRISTWEAR_CATALOG.length, 7);
  assert.equal(BACK_GEAR_CATALOG.length, 12);

  // Strict clamping, dedup, max-3 bodyMarks, and filtering of 'none'
  const raw = {
    version: 1,
    chassis: 'humanoid',
    head: {
      eyebrowStyle: 'slit_notched',
      pupilStyle: 'ring_cyber',
      eyelashStyle: 'winged_liner',
      mouthStyle: 'fangs_vampire',
      faceMark: 'brow_slash_scar',
      secondaryFaceMark: 'freckles',
      blushIntensity: 9.5,
    },
    faceMorph: {
      jawWidth: 99,
      chinLength: -5,
      cheekboneWidth: 5,
      eyeSize: 0.1,
      eyeSpacing: 4,
      eyeTilt: 2,
      browHeight: -9,
      browThickness: 99,
      noseScale: 0.01,
      mouthWidth: 8,
      earScale: 9,
      neckLength: 0.1,
    },
    bodyMarks: [
      'none',
      'dragon_coil_tattoo',
      'dragon_coil_tattoo',
      'cyber_circuit_veins',
      'battle_scars_chest',
      'henna_mehndi_hands',
    ],
    outfit: {
      outerwear: 'leather_biker',
      sleeveStyle: 'rolled_cuff',
      waistStyle: 'utility_pouches',
      gloves: 'fingerless_biker',
      footwear: 'combat_boots',
    },
    accessories: {
      eyewear: 'aviator_shades',
      earJewelry: 'cyber_comms_earpiece',
      neckwear: 'dog_tags',
      wristwear: 'holo_wristpad',
      backGear: 'crossed_katanas',
    },
    palette: {
      primary: '#1e293b',
      secondary: '#0f172a',
      accent: '#22d3ee',
      skin: '#d6a481',
      hair: '#0f172a',
      eye: '#22d3ee',
      eyeSecondary: '#f59e0b',
      lip: '#9d4e5a',
      brow: '#111827',
      markTint: '#38bdf8',
      patternTint: '#22d3ee',
    },
  };
  const norm = validateAndNormalizeDna(raw);
  assert.ok(norm, 'Valid Wave 7 DNA must normalize cleanly');
  assert.equal(norm.version, 1);
  assert.equal(norm.head.blushIntensity, 1);

  const fm = resolveFaceMorph(norm);
  assert.equal(fm.jawWidth, 1.32);
  assert.equal(fm.chinLength, 0.75);
  assert.equal(fm.cheekboneWidth, 1.3);
  assert.equal(fm.eyeSize, 0.75);
  assert.equal(fm.eyeSpacing, 1.28);
  assert.equal(fm.eyeTilt, 0.35);
  assert.equal(fm.browHeight, -0.3);
  assert.equal(fm.browThickness, 1.55);
  assert.equal(fm.noseScale, 0.7);
  assert.equal(fm.mouthWidth, 1.3);
  assert.equal(fm.earScale, 1.4);
  assert.equal(fm.neckLength, 0.75);

  const bm = resolveBodyMarks(norm);
  assert.deepEqual(bm, ['dragon_coil_tattoo', 'cyber_circuit_veins', 'battle_scars_chest']);
  const acc = resolveAccessories(norm);
  assert.equal(acc.eyewear, 'aviator_shades');
  assert.equal(acc.backGear, 'crossed_katanas');
  assert.equal(norm.palette.eyeSecondary, '#f59e0b');
  assert.equal(norm.outfit.gloves, 'fingerless_biker');
  assert.equal(norm.outfit.footwear, 'combat_boots');

  // Backward compat: all 192 legacy presets validate cleanly & retain version 1
  for (const preset of SPRITE_WORKSHOP_PRESETS) {
    const legacy = validateAndNormalizeDna(preset.dna);
    assert.ok(legacy, `Preset ${preset.id} failed validation`);
    assert.equal(legacy.version, 1);
  }
});

// ---------------------------------------------------------------------------
// Test 63 (Wave 7 · Upgrade 40): Granular Canvas 2D Renderer Zero-NaN & Zero-Random Audit
// ---------------------------------------------------------------------------
test('63. Wave 7 Upgrade 40: Granular Canvas 2D layers render every Wave 7 catalog, 10 expressions & 6 visemes with 0 NaNs and 0 Math.random()', () => {
  const layerSrc = fs
    .readFileSync(path.join(process.cwd(), 'src/studio/granularCharacterLayers.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  assert.equal(/\bMath\.random\s*\(/.test(layerSrc), false, 'granularCharacterLayers.ts must never call Math.random()');
  assert.equal(/createElement\s*\(\s*['"]canvas['"]/.test(layerSrc), false, 'granularCharacterLayers.ts must never allocate canvases');

  const dnaSrc = fs
    .readFileSync(path.join(process.cwd(), 'src/studio/characterDna.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  assert.equal(/\bMath\.random\s*\(/.test(dnaSrc), false, 'characterDna.ts must never call Math.random()');

  const mock = createAuditedMockCanvas2D();
  const baseDna = createBaseDna('humanoid');
  const maxLen = Math.max(
    HAIR_STYLE_CATALOG.length,
    FACE_MARK_CATALOG.length,
    BODY_MARK_CATALOG.length,
    OUTERWEAR_CATALOG.length,
    EYEWEAR_CATALOG.length,
    BACK_GEAR_CATALOG.length
  );

  for (let i = 0; i < maxLen; i++) {
    const dna = {
      ...baseDna,
      head: {
        ...baseDna.head,
        eyebrowStyle: EYEBROW_STYLE_CATALOG[i % EYEBROW_STYLE_CATALOG.length].id,
        pupilStyle: PUPIL_STYLE_CATALOG[i % PUPIL_STYLE_CATALOG.length].id,
        eyelashStyle: EYELASH_STYLE_CATALOG[i % EYELASH_STYLE_CATALOG.length].id,
        mouthStyle: MOUTH_STYLE_CATALOG[i % MOUTH_STYLE_CATALOG.length].id,
        hairStyle: HAIR_STYLE_CATALOG[i % HAIR_STYLE_CATALOG.length].id,
        facialHair: FACIAL_HAIR_CATALOG[i % FACIAL_HAIR_CATALOG.length].id,
        faceMark: FACE_MARK_CATALOG[i % FACE_MARK_CATALOG.length].id,
        secondaryFaceMark: FACE_MARK_CATALOG[(i + 5) % FACE_MARK_CATALOG.length].id,
        blushIntensity: (i % 4) * 0.25,
      },
      faceMorph: {
        jawWidth: 0.85 + (i % 5) * 0.08,
        chinLength: 0.85 + (i % 4) * 0.1,
        cheekboneWidth: 0.9 + (i % 3) * 0.1,
        eyeSize: 0.85 + (i % 4) * 0.12,
        eyeSpacing: 0.85 + (i % 4) * 0.1,
        eyeTilt: -0.2 + (i % 5) * 0.1,
        browHeight: -0.15 + (i % 4) * 0.1,
        browThickness: 0.7 + (i % 4) * 0.2,
        noseScale: 0.8 + (i % 4) * 0.15,
        mouthWidth: 0.85 + (i % 4) * 0.12,
        earScale: 0.8 + (i % 4) * 0.15,
        neckLength: 0.85 + (i % 4) * 0.1,
      },
      bodyMarks: [
        BODY_MARK_CATALOG[(i % (BODY_MARK_CATALOG.length - 1)) + 1].id,
        BODY_MARK_CATALOG[((i + 3) % (BODY_MARK_CATALOG.length - 1)) + 1].id,
      ],
      outfit: {
        ...baseDna.outfit,
        outerwear: OUTERWEAR_CATALOG[i % OUTERWEAR_CATALOG.length].id,
        sleeveStyle: SLEEVE_CATALOG[i % SLEEVE_CATALOG.length].id,
        waistStyle: WAIST_CATALOG[i % WAIST_CATALOG.length].id,
        gloves: GLOVE_CATALOG[i % GLOVE_CATALOG.length].id,
        footwear: FOOTWEAR_CATALOG[i % FOOTWEAR_CATALOG.length].id,
      },
      accessories: {
        eyewear: EYEWEAR_CATALOG[i % EYEWEAR_CATALOG.length].id,
        earJewelry: EAR_JEWELRY_CATALOG[i % EAR_JEWELRY_CATALOG.length].id,
        neckwear: NECKWEAR_CATALOG[i % NECKWEAR_CATALOG.length].id,
        wristwear: WRISTWEAR_CATALOG[i % WRISTWEAR_CATALOG.length].id,
        backGear: BACK_GEAR_CATALOG[i % BACK_GEAR_CATALOG.length].id,
      },
      palette: {
        ...baseDna.palette,
        eyeSecondary: i % 2 === 0 ? '#f59e0b' : undefined,
        lip: '#b85c68',
        brow: '#1e1b2e',
        markTint: '#38bdf8',
      },
    };
    const member = syncMemberWithDna(
      { id: `w7_${i}`, name: `W7 ${i}`, archetype: 'detective', primaryColor: '#334155', accentColor: '#f2c85b' },
      dna
    );
    const expr = EXPRESSION_CATALOG[i % EXPRESSION_CATALOG.length].id;
    const viseme = i % 6;

    drawModularEntityFullBody(
      mock.ctx,
      member,
      dna,
      320,
      300,
      1,
      'stand',
      expr,
      i % 2 === 0 ? 'right' : 'left',
      viseme,
      viseme > 0 ? 0.7 : 0,
      i * 0.2,
      0.5,
      undefined,
      'chiaroscuro'
    );
    drawModularEntityCloseUp(mock.ctx, member, dna, expr, viseme, viseme > 0 ? 0.7 : 0, 'right', i * 0.2);
  }

  // Also explicitly sweep all 10 expressions x all 6 visemes on one granular face
  const exprDna = {
    ...baseDna,
    head: {
      ...baseDna.head,
      eyebrowStyle: 'high_arched' as const,
      pupilStyle: 'star_sparkle' as const,
      eyelashStyle: 'winged_liner' as const,
      mouthStyle: 'fangs_vampire' as const,
    },
    palette: { ...baseDna.palette, eyeSecondary: '#22d3ee', lip: '#9f1239' },
  };
  const exprMember = syncMemberWithDna(
    { id: 'expr_sweep', name: 'Sweep', archetype: 'king', primaryColor: '#1e293b', accentColor: '#f2c85b' },
    exprDna
  );
  for (const ex of EXPRESSION_CATALOG) {
    for (let v = 0; v < 6; v++) {
      drawModularEntityCloseUp(mock.ctx, exprMember, exprDna, ex.id, v, v > 0 ? 0.65 : 0, 'left', 1.2);
    }
  }

  assert.equal(mock.getNanCount(), 0, `Granular Wave 7 renderer produced ${mock.getNanCount()} NaN coordinates`);
});

// ---------------------------------------------------------------------------
// Test 64 (Wave 7 · Upgrade 39): NLP Trait Parser & Focused Deterministic Sub-Randomizers
// ---------------------------------------------------------------------------
test('64. Wave 7 Upgrade 39: parseNaturalLanguageDnaTraits & randomizeDnaFace/Outfit/Accessories are deterministic and preserve untouched sections', () => {
  const parsed = parseNaturalLanguageDnaTraits(
    'aviator shades, leather biker jacket, crossed katanas on back, dragon tattoo, combat boots, vampire fangs, hoop earrings, dog tags'
  );
  assert.equal(parsed.accessories?.eyewear, 'aviator_shades');
  assert.equal(parsed.outfit.outerwear, 'leather_biker');
  assert.equal(parsed.accessories?.backGear, 'crossed_katanas');
  assert.ok(parsed.bodyMarks?.includes('dragon_coil_tattoo'));
  assert.equal(parsed.outfit.footwear, 'combat_boots');
  assert.equal(parsed.head.mouthStyle, 'fangs_vampire');
  assert.equal(parsed.accessories?.earJewelry, 'hoop_earrings');
  assert.equal(parsed.accessories?.neckwear, 'dog_tags');

  const seedDna = hydrateArchetypeToDna({ id: 'det', name: 'Det', archetype: 'detective' }, 'w7_seed');

  const faceA = randomizeDnaFace(seedDna, 42);
  const faceB = randomizeDnaFace(seedDna, 42);
  assert.deepEqual(faceA, faceB, 'randomizeDnaFace must be deterministic');
  assert.deepEqual(faceA.outfit, seedDna.outfit, 'randomizeDnaFace must preserve outfit');
  assert.deepEqual(faceA.accessories, seedDna.accessories, 'randomizeDnaFace must preserve accessories');

  const outfitA = randomizeDnaOutfit(seedDna, 99);
  const outfitB = randomizeDnaOutfit(seedDna, 99);
  assert.deepEqual(outfitA, outfitB, 'randomizeDnaOutfit must be deterministic');
  assert.deepEqual(outfitA.head, seedDna.head, 'randomizeDnaOutfit must preserve head');

  const accA = randomizeDnaAccessories(seedDna, 77);
  const accB = randomizeDnaAccessories(seedDna, 77);
  assert.deepEqual(accA, accB, 'randomizeDnaAccessories must be deterministic');
  assert.deepEqual(accA.head, seedDna.head, 'randomizeDnaAccessories must preserve head');
  assert.deepEqual(accA.outfit, seedDna.outfit, 'randomizeDnaAccessories must preserve outfit');
});

// ---------------------------------------------------------------------------
// Test 65 (Wave 7 · Upgrade 39): Silhouette Distance Differentiates Wave 7 Traits
// ---------------------------------------------------------------------------
test('65. Wave 7 Upgrade 39: computeDnaDistance distinguishes eyewear, outerwear, backGear, bodyMarks & faceMorphs', () => {
  const base = createBaseDna('humanoid');
  assert.equal(computeDnaDistance(base, base), 0, 'Identical DNA must have distance 0');

  const customized = {
    ...base,
    faceMorph: { jawWidth: 1.25, eyeSize: 1.3, browHeight: 0.25 },
    bodyMarks: ['dragon_coil_tattoo' as const, 'cyber_circuit_veins' as const],
    outfit: { ...base.outfit, outerwear: 'leather_biker' as const, footwear: 'combat_boots' as const },
    accessories: {
      eyewear: 'aviator_shades' as const,
      earJewelry: 'hoop_earrings' as const,
      neckwear: 'dog_tags' as const,
      wristwear: 'holo_wristpad' as const,
      backGear: 'crossed_katanas' as const,
    },
  };
  const dist = computeDnaDistance(base, customized);
  assert.ok(dist > 0.15, `Expected meaningful Wave 7 silhouette distance > 0.15, got ${dist}`);
});

// ---------------------------------------------------------------------------
// Test 66 (Wave 7): Director SKILL.md & BM25 Search Index Integration
// ---------------------------------------------------------------------------
test('66. Wave 7: Director SKILL.md documents all granular DNA catalogs & BM25 search finds Wave 7 parts', () => {
  const fullMd = buildStagecraftDirectorSkillMd();
  for (const token of [
    'Wave 7 Sims-Grade Face & Hair DNA',
    'Wave 7 Combinable Marks & Ink',
    'Wave 7 Layered Clothing',
    'Wave 7 5-Slot Accessories',
    'aviator_shades',
    'leather_biker',
    'crossed_katanas',
    'dragon_coil_tattoo',
    'fangs_vampire',
  ]) {
    assert.ok(fullMd.includes(token), `Expected Director SKILL.md to include "${token}"`);
  }

  const queries: Array<[string, string]> = [
    ['aviator shades', 'eyewear:aviator_shades'],
    ['leather biker jacket', 'outerwear:leather_biker'],
    ['crossed katanas', 'back_gear:crossed_katanas'],
    ['vampire fangs', 'mouth:fangs_vampire'],
  ];
  for (const [q, expectedId] of queries) {
    const hits = searchStudioCatalog(q, { kinds: ['dna_part'], limit: 10 });
    assert.ok(
      hits.some((h) => h.id === expectedId),
      `Expected BM25 query "${q}" to return ${expectedId}, got: ${hits.map((h) => h.id).join(', ')}`
    );
  }
});

// ---------------------------------------------------------------------------
// Test 67 (Wave 8 · Upgrade 42): Deterministic Shot-Inspector QA Telemetry Bundle (v1)
// ---------------------------------------------------------------------------
test('67. Wave 8 Upgrade 42: buildStagecraftQaBundle is deterministic, 60fps-locked & emits full telemetry + Wave 7 DNA signatures', () => {
  const ep = clone(PRESET_EPISODES[0]);
  ep.visualStyle = {
    ...(ep.visualStyle || {}),
    renderStyle: 'anime_cel',
    motionCadence: '24fps',
    hitstopEnabled: true,
    vfxIntensity: 0.85,
  };
  // Attach Wave 7 granular DNA to first cast member
  const baseDna = createBaseDna('humanoid');
  ep.cast[0] = {
    ...ep.cast[0],
    dna: {
      ...baseDna,
      faceMorph: { jawWidth: 1.15, eyeTilt: 0.12 },
      bodyMarks: ['dragon_coil_tattoo'],
      outfit: { ...baseDna.outfit, outerwear: 'leather_biker', footwear: 'combat_boots' },
      accessories: {
        eyewear: 'cyber_holo_visor',
        earJewelry: 'cyber_comms_earpiece',
        neckwear: 'dog_tags',
        wristwear: 'holo_wristpad',
        backGear: 'crossed_katanas',
      },
    },
  };
  ep.beats[0] = {
    ...ep.beats[0],
    duration: 4.5,
    audioLeadSec: 0.25,
    fx: 'crimson_impact',
    sfx: 'sword_clash',
    sfxOffsetSec: 0.6,
    locationCard: {
      title: 'Midnight Courtyard',
      subtitle: 'Act I',
      position: 'top_left',
      style: 'cinematic_bar',
    },
  };

  const bA = buildStagecraftQaBundle(ep, { aspect: '16:9' });
  const bB = buildStagecraftQaBundle(ep, { aspect: '16:9' });
  assert.equal(serializeStagecraftQaBundle(bA), serializeStagecraftQaBundle(bB), 'QA bundle serialization must be bit-exact deterministic');
  assert.equal(bA.schema, STAGECRAFT_QA_BUNDLE_SCHEMA);
  assert.equal(bA.fps, 60);
  assert.equal(bA.aspect, '16:9');
  assert.equal(bA.telemetry.effectiveCadenceFps, 24);
  assert.equal(bA.telemetry.beatTimeline.length, ep.beats.length);
  assert.equal(bA.telemetry.audioSummary?.targetLufs, -14);
  assert.equal(bA.telemetry.audioSummary?.targetTruePeakDbtp, -1.5);

  const beat0 = bA.telemetry.beatTimeline[0];
  assert.equal(beat0.startSec, 0);
  assert.equal(beat0.durationSec, 4.5);
  assert.equal(beat0.audioLeadSec, 0.25);
  assert.ok(beat0.hitstopWindows.length >= 1, 'Expected hitstop window on sword_clash / crimson_impact beat');
  assert.ok(beat0.vfxBurstWindows.length >= 1, 'Expected VFX burst window when fx !== none and vfxIntensity > 0');
  assert.ok(beat0.speechWindow && beat0.speechWindow.wordCount > 0 && beat0.speechWindow.estimatedCps > 0);
  assert.equal(beat0.locationCard?.title, 'Midnight Courtyard');
  assert.equal(beat0.locationCard?.position, 'top_left');

  const leadActor = beat0.actors.find((a) => a.castId === ep.cast[0].id);
  assert.ok(leadActor, 'Expected lead actor in beat 0 telemetry');
  assert.equal(hasGranularCharacterDna(ep.cast[0]), true);
  assert.equal(leadActor?.hasGranularDna, true);
  assert.equal(leadActor?.dnaSilhouetteSignature, computeDnaSilhouetteSignature(ep.cast[0]));
  assert.ok(/^dna_[0-9a-f]{8}$/.test(leadActor?.dnaSilhouetteSignature || ''));

  // Contiguous 60fps timeline check
  for (let i = 1; i < bA.telemetry.beatTimeline.length; i++) {
    assert.equal(
      bA.telemetry.beatTimeline[i].startSec,
      bA.telemetry.beatTimeline[i - 1].endSec,
      `Beat ${i} startSec must match previous beat endSec`
    );
  }
  const lastBeat = bA.telemetry.beatTimeline[bA.telemetry.beatTimeline.length - 1];
  assert.equal(bA.telemetry.totalDurationSec, lastBeat.endSec);
});

// ---------------------------------------------------------------------------
// Test 68 (Wave 8 · Upgrade 43): Safe RFC 6902 Patch Parser & Atomic Applier
// ---------------------------------------------------------------------------
test('68. Wave 8 Upgrade 43: previewAndApplyStagecraftPatch applies valid beat/style ops & atomically rejects unsafe paths', () => {
  const ep = clone(PRESET_EPISODES[0]);
  ep.beats[0].locationCard = { title: 'Palace Gate', position: 'top_left', style: 'cinematic_bar' };

  const envelope = {
    schema: STAGECRAFT_PATCH_SCHEMA,
    summary: 'Fix camera framing, reading pace, lower-third & J-cut',
    beforeScore: 74,
    afterScore: 91,
    patch: [
      { op: 'replace', path: '/beats/0/cameraFocusX', value: 0.22 },
      { op: 'replace', path: '/beats/0/duration', value: 5.5 },
      { op: 'replace', path: '/beats/0/locationCard/position', value: 'bottom_left' },
      { op: 'replace', path: '/beats/0/audioLeadSec', value: 0.2 },
      { op: 'replace', path: '/visualStyle/vfxIntensity', value: 0.65 },
    ],
  };

  const parsed = parseStagecraftPatchPayload(JSON.stringify(envelope));
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.beforeScore, 74);
  assert.equal(parsed.afterScore, 91);

  const origDuration = ep.beats[0].duration;
  const applied = previewAndApplyStagecraftPatch(ep, parsed.patch);
  assert.equal(applied.ok, true);
  if (!applied.ok) return;
  assert.equal(applied.appliedCount, 5);
  assert.equal(applied.diffSummary.length, 5);
  assert.equal(applied.nextEpisode.beats[0].cameraFocusX, 0.22);
  assert.equal(applied.nextEpisode.beats[0].duration, 5.5);
  assert.equal(applied.nextEpisode.beats[0].locationCard?.position, 'bottom_left');
  assert.equal(applied.nextEpisode.beats[0].audioLeadSec, 0.2);
  assert.equal(applied.nextEpisode.visualStyle?.vfxIntensity, 0.65);
  // Original episode must remain completely untouched
  assert.equal(ep.beats[0].duration, origDuration);

  // Raw RFC 6902 array must also parse cleanly
  const rawParsed = parseStagecraftPatchPayload([
    { op: 'replace', path: '/beats/0/cameraFocusX', value: -0.1 },
  ]);
  assert.equal(rawParsed.ok, true);

  // Security & integrity rejections (all must fail atomically)
  const badCases: Array<[string, Array<{ op: 'add' | 'replace' | 'remove'; path: string; value?: unknown }>]> = [
    ['__proto__ segment', [{ op: 'replace', path: '/beats/0/__proto__/polluted', value: true }]],
    ['constructor segment', [{ op: 'replace', path: '/beats/0/constructor/x', value: 1 }]],
    ['disallowed /cast root', [{ op: 'replace', path: '/cast/0/name', value: 'Hijacked' }]],
    ['disallowed /id root', [{ op: 'replace', path: '/id', value: 'hacked_id' }]],
    ['out-of-bounds beat index', [{ op: 'replace', path: '/beats/999/duration', value: 4 }]],
    ['nested __proto__ value', [{ op: 'add', path: '/beats/0/locationCard', value: JSON.parse('{"title":"Ok","__proto__":{"x":1}}') }]],
    ['invalid duration value', [{ op: 'replace', path: '/beats/0/duration', value: -3 }]],
    ['invalid locationCard position', [{ op: 'replace', path: '/beats/0/locationCard/position', value: 'center_top' }]],
  ];

  for (const [label, ops] of badCases) {
    const res = previewAndApplyStagecraftPatch(ep, ops);
    assert.equal(res.ok, false, `Expected "${label}" patch to be rejected`);
  }
});

// ---------------------------------------------------------------------------
// Test 69 (Wave 8 · Upgrade 44): cutscene-qa-bridge/v1 Host Client Protocol & Origin Guard
// ---------------------------------------------------------------------------
test('69. Wave 8 Upgrade 44: cutscene-qa-bridge/v1 handles PING, RUN_AUDIT, SEEK, dryRun/commit APPLY_PATCH & rejects unauthorized origins', () => {
  let currentEp = clone(PRESET_EPISODES[0]);
  let seekedTo = -1;
  let commitCount = 0;
  const sent: Array<{ msg: Record<string, unknown>; targetOrigin: string }> = [];
  const mockSource = {
    postMessage(msg: unknown, targetOrigin: string) {
      sent.push({ msg: msg as Record<string, unknown>, targetOrigin });
    },
  };

  const bridge = createShotInspectorHostBridge({
    getEpisode: () => currentEp,
    getAspect: () => '16:9',
    allowedOrigins: ['https://inspector.example.com'],
    currentOrigin: 'https://studio.example.com',
    attachWindow: false,
    nowIso: () => '2026-06-01T12:00:00.000Z',
    onSeekTime: (t) => {
      seekedTo = t;
    },
    onCommitEpisode: (nextEp) => {
      commitCount += 1;
      currentEp = nextEp;
    },
  });

  // Origin allowlist checks
  assert.equal(isAllowedBridgeOrigin('http://localhost:5173'), true);
  assert.equal(isAllowedBridgeOrigin('https://127.0.0.1:4173'), true);
  assert.equal(isAllowedBridgeOrigin('https://evil.attacker.invalid'), false);
  assert.equal(isAllowedBridgeOrigin('javascript:alert(1)'), false);

  // Unauthorized origin must be rejected silently with zero replies
  const unauth = bridge.handleIncomingMessage({
    origin: 'https://evil.attacker.invalid',
    source: mockSource,
    data: { channel: CUTSCENE_QA_BRIDGE_CHANNEL, type: 'QA_PING' },
  });
  assert.equal(unauth.handled, false);
  assert.ok(unauth.rejectedReason);
  assert.equal(sent.length, 0);

  // 1. QA_PING -> QA_PONG
  const pingRes = bridge.handleIncomingMessage({
    origin: 'http://localhost:5173',
    source: mockSource,
    data: { channel: CUTSCENE_QA_BRIDGE_CHANNEL, type: 'QA_PING' },
  });
  assert.equal(pingRes.handled, true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].msg.type, 'QA_PONG');
  assert.equal(sent[0].msg.host, 'stagecraft-studio');
  assert.deepEqual(sent[0].msg.capabilities, ['bundle-v1', 'rfc6902-patch', 'seek']);

  // 2. QA_SEEK_TIME
  bridge.handleIncomingMessage({
    origin: 'https://inspector.example.com',
    source: mockSource,
    data: { channel: CUTSCENE_QA_BRIDGE_CHANNEL, type: 'QA_SEEK_TIME', timeSec: 6.25 },
  });
  assert.equal(seekedTo, 6.25);

  // 3. QA_APPLY_PATCH (dryRun: true) -> validates & replies without committing
  bridge.handleIncomingMessage({
    origin: 'http://localhost:5173',
    source: mockSource,
    data: {
      channel: CUTSCENE_QA_BRIDGE_CHANNEL,
      type: 'QA_APPLY_PATCH',
      txId: 'tx_dry_1',
      dryRun: true,
      findingIds: ['F-01'],
      summary: 'Dry run camera nudge',
      patch: [{ op: 'replace', path: '/beats/0/cameraFocusX', value: 0.18 }],
    },
  });
  assert.equal(commitCount, 0, 'dryRun patch must not commit to active episode');
  assert.equal(sent[1].msg.type, 'QA_PATCH_RESULT');
  assert.equal(sent[1].msg.txId, 'tx_dry_1');
  assert.equal(sent[1].msg.ok, true);
  assert.equal(sent[1].msg.dryRun, true);
  assert.equal(sent[1].msg.appliedCount, 1);

  // 4. QA_APPLY_PATCH (dryRun: false) -> commits & returns updatedBundle
  bridge.handleIncomingMessage({
    origin: 'http://localhost:5173',
    source: mockSource,
    data: {
      channel: CUTSCENE_QA_BRIDGE_CHANNEL,
      type: 'QA_APPLY_PATCH',
      txId: 'tx_commit_2',
      dryRun: false,
      findingIds: ['F-01'],
      summary: 'Commit camera nudge',
      patch: [{ op: 'replace', path: '/beats/0/cameraFocusX', value: 0.18 }],
    },
  });
  assert.equal(commitCount, 1);
  assert.equal(currentEp.beats[0].cameraFocusX, 0.18);
  assert.equal(sent[2].msg.type, 'QA_PATCH_RESULT');
  assert.equal(sent[2].msg.ok, true);
  assert.equal(sent[2].msg.txId, 'tx_commit_2');
  assert.ok(sent[2].msg.updatedBundle && (sent[2].msg.updatedBundle as { schema: string }).schema === STAGECRAFT_QA_BUNDLE_SCHEMA);

  bridge.destroy();
});

// ---------------------------------------------------------------------------
// Test 70 (Wave 8 · Upgrade 46): render-batch.mjs CLI --qa-bundle & Subprocess Safety Audit
// ---------------------------------------------------------------------------
test('70. Wave 8 Upgrade 46: scripts/render-batch.mjs emits valid stagecraft-shot-inspector/v1 --qa-bundle & uses safe execFileSync only', () => {
  const batchPath = path.join(process.cwd(), 'scripts/render-batch.mjs');
  const src = fs.readFileSync(batchPath, 'utf8');
  assert.ok(src.includes('--qa-bundle'), 'render-batch.mjs must support --qa-bundle');
  assert.ok(src.includes('--shot-inspector-dir'), 'render-batch.mjs must support --shot-inspector-dir');
  assert.ok(src.includes('execFileSync'), 'render-batch.mjs must invoke subprocesses with execFileSync');
  assert.equal(/\bexec\s*\(/.test(src), false, 'render-batch.mjs must never use shell string exec()');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stagecraft-qa-cli-'));
  try {
    const ep = clone(PRESET_EPISODES[0]);
    const epPath = path.join(tmpDir, `${ep.id}.json`);
    const outDir = path.join(tmpDir, 'out');
    fs.writeFileSync(epPath, JSON.stringify(ep, null, 2), 'utf8');

    execFileSync(process.execPath, [batchPath, epPath, '--out', outDir, '--qa-bundle'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      timeout: 30_000,
    });

    const bundleFile = path.join(outDir, `${ep.id}.qa-bundle.json`);
    assert.equal(fs.existsSync(bundleFile), true, `Expected CLI to write ${bundleFile}`);
    const parsed = JSON.parse(fs.readFileSync(bundleFile, 'utf8'));
    assert.equal(parsed.schema, STAGECRAFT_QA_BUNDLE_SCHEMA);
    assert.equal(parsed.fps, 60);
    assert.equal(parsed.telemetry.beatTimeline.length, ep.beats.length);
    assert.equal(parsed.telemetry.audioSummary.targetLufs, -14);
    assert.equal(parsed.telemetry.audioSummary.targetTruePeakDbtp, -1.5);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Test 71 (Wave 8): End-to-End Round-Trip (Bundle -> Shot-Inspector Fix Patch -> Re-Audit)
// ---------------------------------------------------------------------------
test('71. Wave 8 End-to-End: Export QA bundle -> simulate Shot-Inspector RFC 6902 fix patch -> apply -> rebuild bundle & verify resolution', () => {
  const ep = clone(PRESET_EPISODES[0]);
  // Seed a beat with tight reading pace, top-left location card colliding with framing, and zero audio lead
  ep.beats[0] = {
    ...ep.beats[0],
    duration: 2.0,
    audioLeadSec: 0,
    cameraFocusX: 0,
    dialogue:
      'Every single warrior in the courtyard turned sharply toward the gilded throne as thunder echoed across the palace.',
    locationCard: {
      title: 'Royal Courtyard',
      position: 'top_left',
      style: 'cinematic_bar',
    },
  };

  // Step 1: Export initial QA bundle
  const beforeBundle = buildStagecraftQaBundle(ep, { aspect: '16:9' });
  const beforeBeat0 = beforeBundle.telemetry.beatTimeline[0];
  assert.ok((beforeBeat0.speechWindow?.estimatedCps ?? 0) > 25, 'Initial beat should exhibit high CPS reading pressure');
  assert.equal(beforeBeat0.locationCard?.position, 'top_left');

  // Step 2: Simulate Shot-Inspector emitting a stagecraft-patch/v1 auto-fix payload
  const inspectorPatchJson = JSON.stringify({
    schema: STAGECRAFT_PATCH_SCHEMA,
    summary: 'Relax beat 1 reading pace, add 0.2s J-cut lead, nudge focus right & shift lower-third',
    beforeScore: 71,
    afterScore: 93,
    patch: [
      { op: 'replace', path: '/beats/0/duration', value: 6.0 },
      { op: 'replace', path: '/beats/0/audioLeadSec', value: 0.2 },
      { op: 'replace', path: '/beats/0/cameraFocusX', value: 0.16 },
      { op: 'replace', path: '/beats/0/locationCard/position', value: 'bottom_left' },
    ],
  });

  // Step 3: Parse, validate, and apply patch cleanly
  const parsed = parseStagecraftPatchPayload(inspectorPatchJson);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const applied = previewAndApplyStagecraftPatch(ep, parsed.patch);
  assert.equal(applied.ok, true);
  if (!applied.ok) return;

  // Step 4: Validate resulting episode and rebuild QA bundle
  const revalidated = validateEpisodeScript(applied.nextEpisode);
  assert.equal(revalidated.ok, true);
  const afterBundle = buildStagecraftQaBundle(applied.nextEpisode, { aspect: '16:9' });
  const afterBeat0 = afterBundle.telemetry.beatTimeline[0];

  assert.equal(afterBeat0.durationSec, 6);
  assert.equal(afterBeat0.audioLeadSec, 0.2);
  assert.equal(afterBeat0.locationCard?.position, 'bottom_left');
  assert.ok(
    (afterBeat0.speechWindow?.estimatedCps ?? 99) < (beforeBeat0.speechWindow?.estimatedCps ?? 0),
    'Rebuilt QA bundle must confirm reading CPS dropped after patch'
  );
  assert.equal(applied.nextEpisode.beats[0].cameraFocusX, 0.16);
});

// ---------------------------------------------------------------------------
// Test 72 (Wave 9 · Upgrade 47): Dynamic Eye-Gaze, Head-Tracking & Schema Sanitization
// ---------------------------------------------------------------------------
test('72. Wave 9 Upgrade 47: resolveActorHeadOrientation & resolveActorGazeVector are deterministic, bounded & validateEpisodeScript sanitizes new fields', () => {
  const riggingSrc = fs
    .readFileSync(path.join(process.cwd(), 'src/studio/characterRigging.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  assert.equal(/\bMath\.random\s*\(/.test(riggingSrc), false, 'characterRigging.ts must never call Math.random()');
  assert.equal(/createElement\s*\(\s*['"]canvas['"]/.test(riggingSrc), false, 'characterRigging.ts must never allocate canvases');

  const actorA = {
    castId: 'hero',
    slot: 'left' as const,
    facing: 'right' as const,
    pose: 'stand' as const,
    expression: 'calm' as const,
    motion: 'still' as const,
  };
  const actorB = {
    castId: 'rival',
    slot: 'right' as const,
    facing: 'left' as const,
    pose: 'stand' as const,
    expression: 'calm' as const,
    motion: 'still' as const,
  };

  // 'auto' picks front on closeup, three_quarter on two_shot with partner, profile when walking/crossing
  const closeupHead = resolveActorHeadOrientation(
    { shot: 'closeup_left', actors: [actorA, actorB], speakerId: 'hero' },
    actorA,
    actorB
  );
  assert.equal(closeupHead.headAngle, 'front');
  assert.equal(closeupHead.yawBias, 0);

  const twoShotHead = resolveActorHeadOrientation(
    { shot: 'two_shot', actors: [actorA, actorB], speakerId: 'hero' },
    actorA,
    actorB
  );
  assert.equal(twoShotHead.headAngle, 'three_quarter');
  assert.ok(twoShotHead.yawBias > 0.3, 'Left actor in two_shot should turn 3/4 toward right partner');

  const walkHead = resolveActorHeadOrientation(
    { shot: 'wide_stage', actors: [{ ...actorA, pose: 'walk', motion: 'cross_stage' }], speakerId: 'hero' },
    { ...actorA, pose: 'walk', motion: 'cross_stage' }
  );
  assert.equal(walkHead.headAngle, 'profile');
  assert.ok(Math.abs(walkHead.yawBias) >= 0.85);

  // Explicit headAngle override takes precedence
  const forcedProfile = resolveActorHeadOrientation(
    { shot: 'closeup_left', actors: [{ ...actorA, headAngle: 'profile' }], speakerId: 'hero' },
    { ...actorA, headAngle: 'profile' }
  );
  assert.equal(forcedProfile.headAngle, 'profile');

  // Gaze vector determinism & strict bounds across targets and timestamps
  const targets = ['auto', 'camera', 'partner', 'left', 'right', 'up', 'down'] as const;
  for (const gazeTarget of targets) {
    const g1 = resolveActorGazeVector(
      { shot: 'two_shot', actors: [actorA, actorB], speakerId: 'hero' },
      { ...actorA, gazeTarget },
      actorB,
      2.35
    );
    const g2 = resolveActorGazeVector(
      { shot: 'two_shot', actors: [actorA, actorB], speakerId: 'hero' },
      { ...actorA, gazeTarget },
      actorB,
      2.35
    );
    assert.deepEqual(g1, g2, `Gaze vector for ${gazeTarget} must be bit-exact deterministic`);
    assert.ok(g1.lookX >= -1 && g1.lookX <= 1, `lookX out of bounds: ${g1.lookX}`);
    assert.ok(g1.lookY >= -0.6 && g1.lookY <= 0.6, `lookY out of bounds: ${g1.lookY}`);
  }

  // validateEpisodeScript preserves valid Wave 9 fields and strips invalid values safely
  const ep = clone(PRESET_EPISODES[0]);
  ep.beats[0].actors[0] = {
    ...ep.beats[0].actors[0],
    gazeTarget: 'partner',
    headAngle: 'three_quarter',
    heldProp: 'khanda_sword',
    heldHand: 'front',
  };
  if (ep.beats[0].actors[1]) {
    ep.beats[0].actors[1] = {
      ...ep.beats[0].actors[1],
      gazeTarget: 'invalid_gaze' as never,
      headAngle: 'upside_down' as never,
      heldProp: 'not_a_real_prop_xyz' as never,
      heldHand: 'foot' as never,
    };
  }
  const validated = validateEpisodeScript(ep);
  assert.equal(validated.ok, true);
  if (!validated.ok) return;
  assert.equal(validated.script.beats[0].actors[0].gazeTarget, 'partner');
  assert.equal(validated.script.beats[0].actors[0].headAngle, 'three_quarter');
  assert.equal(validated.script.beats[0].actors[0].heldProp, 'khanda_sword');
  assert.equal(validated.script.beats[0].actors[0].heldHand, 'front');
  if (validated.script.beats[0].actors[1]) {
    assert.equal(validated.script.beats[0].actors[1].gazeTarget, undefined);
    assert.equal(validated.script.beats[0].actors[1].headAngle, undefined);
    assert.equal(validated.script.beats[0].actors[1].heldProp, undefined);
    assert.equal(validated.script.beats[0].actors[1].heldHand, undefined);
  }
});

// ---------------------------------------------------------------------------
// Test 73 (Wave 9 · Upgrade 48): True 3/4 & Profile Head/Torso Orientation Rendering
// ---------------------------------------------------------------------------
test('73. Wave 9 Upgrade 48: Modular full-body & close-up render distinct, deterministic, zero-NaN geometry across front, 3/4 & profile', () => {
  const mock = createAuditedMockCanvas2D();
  const baseDna = createBaseDna('humanoid');
  const dna = {
    ...baseDna,
    head: {
      ...baseDna.head,
      hairStyle: 'wolf_cut' as const,
      eyebrowStyle: 'high_arched' as const,
      pupilStyle: 'slit_cat' as const,
    },
    outfit: {
      ...baseDna.outfit,
      headwear: 'beret_artist' as const,
      capeStyle: 'royal_cape' as const,
    },
  };
  const member = syncMemberWithDna(
    {
      id: 'turnaround_hero',
      name: 'Turnaround Hero',
      archetype: 'king',
      primaryColor: '#1e3a8a',
      accentColor: '#f59e0b',
    },
    dna
  );

  const renderFull = (headAngle: 'front' | 'three_quarter' | 'profile', yawBias: number) => {
    mock.reset();
    drawModularEntityFullBody(
      mock.ctx,
      member,
      dna,
      400,
      540,
      1,
      'stand',
      'calm',
      'right',
      2,
      0.7,
      1.2,
      0.5,
      'still',
      undefined,
      undefined,
      undefined,
      { headAngle, yawBias, lookX: yawBias * 0.6, lookY: -0.1 }
    );
    assert.equal(mock.getNanCount(), 0, `Full-body ${headAngle} produced NaN coordinates`);
    assert.ok(mock.getOps() > 20, `Full-body ${headAngle} drew too few ops`);
    return mock.getSignature();
  };

  const frontFullA = renderFull('front', 0);
  const frontFullB = renderFull('front', 0);
  const tqFull = renderFull('three_quarter', 0.55);
  const profFull = renderFull('profile', 0.92);
  assert.equal(frontFullA, frontFullB, 'Repeated full-body render must be bit-exact deterministic');
  assert.notEqual(frontFullA, tqFull, '3/4 full-body orientation must produce distinct geometry from front');
  assert.notEqual(tqFull, profFull, 'Profile full-body orientation must produce distinct geometry from 3/4');

  const renderClose = (headAngle: 'front' | 'three_quarter' | 'profile', yawBias: number) => {
    mock.reset();
    drawModularEntityCloseUp(
      mock.ctx,
      member,
      dna,
      'calm',
      2,
      0.7,
      'right',
      1.2,
      { headAngle, yawBias, lookX: yawBias * 0.5, lookY: 0.05 }
    );
    assert.equal(mock.getNanCount(), 0, `Close-up ${headAngle} produced NaN coordinates`);
    assert.ok(mock.getOps() > 15, `Close-up ${headAngle} drew too few ops`);
    return mock.getSignature();
  };

  const frontCloseA = renderClose('front', 0);
  const frontCloseB = renderClose('front', 0);
  const tqClose = renderClose('three_quarter', 0.55);
  const profClose = renderClose('profile', 0.92);
  assert.equal(frontCloseA, frontCloseB, 'Repeated close-up render must be bit-exact deterministic');
  assert.notEqual(frontCloseA, tqClose, '3/4 close-up orientation must produce distinct geometry from front');
  assert.notEqual(tqClose, profClose, 'Profile close-up orientation must produce distinct geometry from 3/4');
});

// ---------------------------------------------------------------------------
// Test 74 (Wave 9 · Upgrades 49 & 50): Hand-Held Prop Rigging & Stateless Secondary Motion Physics
// ---------------------------------------------------------------------------
test('74. Wave 9 Upgrades 49 & 50: Hand-held props anchor on front/back/both hands & secondary motion physics is scrubbable and storm-reactive', () => {
  const mock = createAuditedMockCanvas2D();
  const baseDna = createBaseDna('humanoid');
  const dna = {
    ...baseDna,
    outfit: { ...baseDna.outfit, capeStyle: 'royal_cape' as const },
    appendages: { ...baseDna.appendages, tail: 'fox_bushy' as const },
  };
  const member = syncMemberWithDna(
    {
      id: 'prop_holder',
      name: 'Lantern Bearer',
      archetype: 'sage',
      primaryColor: '#1f2937',
      accentColor: '#fbbf24',
    },
    dna
  );

  // Upgrade 49: Compare draw ops for none vs front vs back vs both heldProp
  const renderWithHeld = (heldProp?: 'none' | 'diya_lamp', heldHand?: 'front' | 'back' | 'both') => {
    mock.reset();
    drawActorFullBody(
      mock.ctx,
      member,
      400,
      540,
      1,
      'stand',
      'calm',
      'right',
      0,
      0,
      1.5,
      0.5,
      'still',
      undefined,
      undefined,
      undefined,
      heldProp ? { heldProp, heldHand } : undefined
    );
    assert.equal(mock.getNanCount(), 0, `Held prop (${heldProp}/${heldHand}) produced NaN`);
    return { ops: mock.getOps(), sig: mock.getSignature() };
  };

  const noneRes = renderWithHeld('none', 'front');
  const frontRes = renderWithHeld('diya_lamp', 'front');
  const backRes = renderWithHeld('diya_lamp', 'back');
  const bothRes = renderWithHeld('diya_lamp', 'both');
  assert.ok(frontRes.ops > noneRes.ops, 'Front heldProp must render additional prop draw ops');
  assert.ok(backRes.ops > noneRes.ops, 'Back heldProp must render additional prop draw ops');
  assert.ok(bothRes.ops > frontRes.ops, 'Both-hands heldProp must draw on both wrists');
  assert.notEqual(frontRes.sig, backRes.sig, 'Front and back heldHand must anchor at different wrist coordinates');

  // Upgrade 50: Stateless analytical secondary motion physics scrubbability & weather/pose scaling
  const calmT1 = computeSecondaryMotionSway('hero_a', 1.25, 'stand', 'still', 'none', 0);
  // Scrub forward then back to exact same timestamp -> must be bit-identical
  computeSecondaryMotionSway('hero_a', 9.75, 'soar', 'leap_arc', 'blizzard_gale', 1);
  const calmT1Again = computeSecondaryMotionSway('hero_a', 1.25, 'stand', 'still', 'none', 0);
  assert.deepEqual(calmT1, calmT1Again, 'Secondary motion must be stateless and scrubbable to identical output');

  const stormSoar = computeSecondaryMotionSway('hero_a', 1.25, 'soar', 'leap_arc', 'blizzard_gale', 0.8);
  assert.ok(calmT1.energy >= 0 && calmT1.energy <= 1, 'Calm energy must stay within [0, 1]');
  assert.ok(stormSoar.energy >= 0 && stormSoar.energy <= 1, 'Storm energy must stay within [0, 1]');
  assert.ok(
    stormSoar.energy > calmT1.energy + 0.4,
    `Expected storm+soar energy (${stormSoar.energy}) >> calm+stand energy (${calmT1.energy})`
  );
});

// ---------------------------------------------------------------------------
// Test 75 (Wave 9 · Upgrade 51): Global Casual DNA Additions & NLP Mapping
// ---------------------------------------------------------------------------
test('75. Wave 9 Upgrade 51: Casual hairstyles & headwear exist in catalogs, parse from natural traits & render zero-NaN', () => {
  const newHairs = ['side_part_classic', 'curtain_bangs', 'wolf_cut'] as const;
  const newHats = ['baseball_cap', 'beanie_knit', 'beret_artist'] as const;

  for (const h of newHairs) {
    assert.ok(HAIR_STYLE_CATALOG.some((item) => item.id === h), `Missing hair style ${h}`);
  }
  for (const hat of newHats) {
    assert.ok(HEADWEAR_CATALOG.some((item) => item.id === hat), `Missing headwear ${hat}`);
  }

  // NLP trait parsing
  const p1 = parseNaturalLanguageDnaTraits('young designer with curtain bangs and artist beret');
  assert.equal(p1.head?.hairStyle, 'curtain_bangs');
  assert.equal(p1.outfit?.headwear, 'beret_artist');

  const p2 = parseNaturalLanguageDnaTraits('skater with wolf cut and knit beanie');
  assert.equal(p2.head?.hairStyle, 'wolf_cut');
  assert.equal(p2.outfit?.headwear, 'beanie_knit');

  const p3 = parseNaturalLanguageDnaTraits('journalist with classic side part and baseball cap');
  assert.equal(p3.head?.hairStyle, 'side_part_classic');
  assert.equal(p3.outfit?.headwear, 'baseball_cap');

  // Zero-NaN Canvas 2D smoke render of all 6 new assets
  const mock = createAuditedMockCanvas2D();
  const baseDna = createBaseDna('humanoid');
  for (let i = 0; i < 3; i++) {
    const dna = {
      ...baseDna,
      head: { ...baseDna.head, hairStyle: newHairs[i] },
      outfit: { ...baseDna.outfit, headwear: newHats[i] },
    };
    const member = syncMemberWithDna(
      {
        id: `casual_${i}`,
        name: `Casual ${i}`,
        archetype: 'journalist',
        primaryColor: '#334155',
        accentColor: '#38bdf8',
      },
      dna
    );
    mock.reset();
    drawModularEntityFullBody(
      mock.ctx,
      member,
      dna,
      360,
      520,
      1,
      'stand',
      'calm',
      'right',
      0,
      0,
      0.8,
      0.5,
      'still',
      undefined,
      undefined,
      undefined,
      {
        headAngle: 'three_quarter',
        yawBias: 0.55,
        heldProp: 'royal_scroll',
        heldHand: 'front',
      }
    );
    assert.equal(mock.getNanCount(), 0, `Casual DNA combo ${newHairs[i]} + ${newHats[i]} produced NaN`);
    assert.ok(mock.getOps() > 20, `Casual DNA combo ${newHairs[i]} + ${newHats[i]} drew too few ops`);
  }
});

// ---------------------------------------------------------------------------
// Test 76 (Wave 9 · Upgrade 52): Wave 9 Shot-Inspector Telemetry & Extended Patch Allowlist
// ---------------------------------------------------------------------------
test('76. Wave 9 Upgrade 52: Shot-Inspector bundle emits 9.0.0 actor rigging/contrast telemetry & patch applier enforces Wave 9 allowlist', () => {
  assert.equal(STAGECRAFT_STUDIO_VERSION, '9.0.0');
  assert.equal(computePaletteContrastLuma('#000000'), 0);
  assert.equal(computePaletteContrastLuma('#ffffff'), 1);
  assert.ok(computePaletteContrastLuma('#f59e0b') > 0.3 && computePaletteContrastLuma('#f59e0b') < 0.7);

  const ep = clone(PRESET_EPISODES[0]);
  ep.cast[0] = { ...ep.cast[0], primaryColor: '#1e293b', accentColor: '#38bdf8' };
  ep.beats[0].actors[0] = {
    ...ep.beats[0].actors[0],
    facing: 'right',
    gazeTarget: 'partner',
    headAngle: 'three_quarter',
    heldProp: 'diya_lamp',
    heldHand: 'front',
  };

  const bundle = buildStagecraftQaBundle(ep, { aspect: '16:9' });
  assert.equal(bundle.studioVersion, '9.0.0');
  const actor0 = bundle.telemetry.beatTimeline[0].actors[0];
  assert.equal(actor0.facing, 'right');
  assert.equal(actor0.resolvedHeadAngle, 'three_quarter');
  assert.equal(actor0.resolvedGazeTarget, 'partner');
  assert.equal(actor0.heldProp, 'diya_lamp');
  assert.ok(typeof actor0.secondaryMotionEnergy === 'number' && actor0.secondaryMotionEnergy >= 0 && actor0.secondaryMotionEnergy <= 1);
  assert.equal(actor0.paletteContrastLuma, computePaletteContrastLuma('#1e293b'));

  // Resolve actor rig convenience wrapper sanity check
  const rigInfo = resolveActorRigForBeat(ep.beats[0], ep.beats[0].actors[0], 1.1, 0.4);
  assert.equal(rigInfo.orientation.headAngle, 'three_quarter');
  assert.equal(rigInfo.rig.heldProp, 'diya_lamp');

  // Wave 9 RFC 6902 patch allowlist: actor rigging + cast primaryColor/accentColor allowed
  const validWave9Patch = [
    { op: 'replace' as const, path: '/beats/0/actors/0/gazeTarget', value: 'camera' },
    { op: 'replace' as const, path: '/beats/0/actors/0/headAngle', value: 'front' },
    { op: 'replace' as const, path: '/beats/0/actors/0/heldProp', value: 'khanda_sword' },
    { op: 'replace' as const, path: '/beats/0/actors/0/heldHand', value: 'both' },
    { op: 'replace' as const, path: '/beats/0/actors/0/facing', value: 'left' },
    { op: 'replace' as const, path: '/cast/0/primaryColor', value: '#2563eb' },
    { op: 'replace' as const, path: '/cast/0/accentColor', value: '#facc15' },
  ];
  const applied = previewAndApplyStagecraftPatch(ep, validWave9Patch);
  assert.equal(applied.ok, true, `Valid Wave 9 patch failed: ${applied.ok ? '' : applied.errors.join('; ')}`);
  if (!applied.ok) return;
  assert.equal(applied.nextEpisode.beats[0].actors[0].gazeTarget, 'camera');
  assert.equal(applied.nextEpisode.beats[0].actors[0].headAngle, 'front');
  assert.equal(applied.nextEpisode.beats[0].actors[0].heldProp, 'khanda_sword');
  assert.equal(applied.nextEpisode.beats[0].actors[0].heldHand, 'both');
  assert.equal(applied.nextEpisode.beats[0].actors[0].facing, 'left');
  assert.equal(applied.nextEpisode.cast[0].primaryColor, '#2563eb');
  assert.equal(applied.nextEpisode.cast[0].accentColor, '#facc15');

  // Invalid Wave 9 & security paths must still be rejected atomically
  const invalidWave9Cases: Array<[string, Array<{ op: 'replace'; path: string; value: unknown }>]> = [
    ['bad hex primaryColor', [{ op: 'replace', path: '/cast/0/primaryColor', value: '#xyz' }]],
    ['bad hex accentColor', [{ op: 'replace', path: '/cast/0/accentColor', value: 'red' }]],
    ['disallowed /cast/0/name', [{ op: 'replace', path: '/cast/0/name', value: 'Hacked' }]],
    ['disallowed /cast/0/archetype', [{ op: 'replace', path: '/cast/0/archetype', value: 'king' }]],
    ['invalid gazeTarget enum', [{ op: 'replace', path: '/beats/0/actors/0/gazeTarget', value: 'behind' }]],
    ['invalid headAngle enum', [{ op: 'replace', path: '/beats/0/actors/0/headAngle', value: 'top_down' }]],
    ['invalid heldProp id', [{ op: 'replace', path: '/beats/0/actors/0/heldProp', value: 'fake_prop_999' }]],
    ['out-of-range actor index', [{ op: 'replace', path: '/beats/0/actors/99/gazeTarget', value: 'camera' }]],
    ['out-of-range cast index', [{ op: 'replace', path: '/cast/99/primaryColor', value: '#112233' }]],
    ['prototype pollution', [{ op: 'replace', path: '/cast/__proto__/primaryColor', value: '#112233' }]],
  ];
  for (const [label, ops] of invalidWave9Cases) {
    const res = previewAndApplyStagecraftPatch(ep, ops);
    assert.equal(res.ok, false, `Expected "${label}" to be rejected`);
  }
});

// ---------------------------------------------------------------------------
// Test 77 (Wave 9 · Upgrade 52): End-to-End Closed-Loop CLI --auto-heal-qa
// ---------------------------------------------------------------------------
test('77. Wave 9 End-to-End: render-batch.mjs --auto-heal-qa executes closed-loop audit -> patch -> re-audit & persists .healed.json', () => {
  const batchPath = path.join(process.cwd(), 'scripts/render-batch.mjs');
  const batchSrc = fs.readFileSync(batchPath, 'utf8');
  assert.ok(batchSrc.includes('--auto-heal-qa'), 'render-batch.mjs must support --auto-heal-qa');
  assert.ok(batchSrc.includes('--target-score'), 'render-batch.mjs must support --target-score');
  assert.equal(/\bexec\s*\(/.test(batchSrc), false, 'render-batch.mjs must never use shell string exec()');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stagecraft-autoheal-w9-'));
  try {
    const ep = clone(PRESET_EPISODES[0]);
    const epPath = path.join(tmpDir, `${ep.id}.json`);
    const outDir = path.join(tmpDir, 'out');
    const mockInspectorDir = path.join(tmpDir, 'mock-shot-inspector');
    const mockScriptsDir = path.join(mockInspectorDir, 'scripts');
    fs.mkdirSync(mockScriptsDir, { recursive: true });
    fs.writeFileSync(epPath, JSON.stringify(ep, null, 2), 'utf8');

    // Mock scripts/qa-studio-audit.mjs:
    // Pass 1: inspects bundle studioVersion 9.0.0 & actor telemetry, emits valid Wave 9 patch & score 72.
    // Pass 2: verifies patch took effect in refreshed bundle & returns score 94 (>= target 85).
    const mockAuditScript = `
import fs from 'node:fs';
const args = process.argv.slice(2);
let bundlePath = '';
let emitPatchPath = '';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--stagecraft-bundle') bundlePath = args[++i];
  if (args[i] === '--emit-patch') emitPatchPath = args[++i];
}
const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
const actor0 = bundle.telemetry.beatTimeline[0].actors[0];
const cast0 = bundle.episode.cast[0];
const isHealed =
  bundle.studioVersion === '9.0.0' &&
  actor0.resolvedGazeTarget === 'camera' &&
  actor0.resolvedHeadAngle === 'front' &&
  actor0.heldProp === 'diya_lamp' &&
  cast0.primaryColor === '#2563eb';
if (!isHealed) {
  const patchDoc = {
    schema: 'stagecraft-patch/v1',
    summary: 'Auto-heal beat 1 actor gaze, head angle, held prop & cast contrast',
    beforeScore: 72,
    afterScore: 94,
    patch: [
      { op: 'replace', path: '/beats/0/actors/0/gazeTarget', value: 'camera' },
      { op: 'replace', path: '/beats/0/actors/0/headAngle', value: 'front' },
      { op: 'replace', path: '/beats/0/actors/0/heldProp', value: 'diya_lamp' },
      { op: 'replace', path: '/cast/0/primaryColor', value: '#2563eb' },
    ],
  };
  fs.writeFileSync(emitPatchPath, JSON.stringify(patchDoc, null, 2), 'utf8');
  console.log(JSON.stringify({ score: 72, findings: 4 }));
} else {
  console.log(JSON.stringify({ score: 94, findings: 0 }));
}
`;
    fs.writeFileSync(path.join(mockScriptsDir, 'qa-studio-audit.mjs'), mockAuditScript, 'utf8');

    const stdout = execFileSync(
      process.execPath,
      [
        batchPath,
        epPath,
        '--out',
        outDir,
        '--qa-bundle',
        '--shot-inspector-dir',
        mockInspectorDir,
        '--auto-heal-qa',
        '--target-score',
        '85',
      ],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 30_000,
      }
    );

    assert.ok(stdout.includes('auto-heal QA PASS'), `Expected PASS log in stdout, got: ${stdout}`);
    assert.ok(stdout.includes('72 -> 94/100'), `Expected score delta in stdout, got: ${stdout}`);

    const healedPath = path.join(outDir, `${ep.id}.healed.json`);
    const bundlePath = path.join(outDir, `${ep.id}.qa-bundle.json`);
    assert.equal(fs.existsSync(healedPath), true, 'Expected .healed.json to be written');
    assert.equal(fs.existsSync(bundlePath), true, 'Expected refreshed .qa-bundle.json to exist');

    const healedEp = JSON.parse(fs.readFileSync(healedPath, 'utf8'));
    assert.equal(healedEp.beats[0].actors[0].gazeTarget, 'camera');
    assert.equal(healedEp.beats[0].actors[0].headAngle, 'front');
    assert.equal(healedEp.beats[0].actors[0].heldProp, 'diya_lamp');
    assert.equal(healedEp.cast[0].primaryColor, '#2563eb');

    const refreshedBundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
    assert.equal(refreshedBundle.studioVersion, '9.0.0');
    assert.equal(refreshedBundle.telemetry.beatTimeline[0].actors[0].resolvedGazeTarget, 'camera');
    assert.equal(refreshedBundle.telemetry.beatTimeline[0].actors[0].resolvedHeadAngle, 'front');
    assert.equal(refreshedBundle.telemetry.beatTimeline[0].actors[0].heldProp, 'diya_lamp');
    assert.equal(refreshedBundle.telemetry.beatTimeline[0].actors[0].paletteContrastLuma, computePaletteContrastLuma('#2563eb'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
async function main() {
  let passed = 0;
  let failed = 0;
  const startedAt = Date.now();

  console.log(`\nRunning Stagecraft Studio regression suite (${tests.length} tests)...\n`);
  for (const t of tests) {
    try {
      await t.run();
      passed += 1;
      console.log(`  PASS  ${t.name}`);
    } catch (err) {
      failed += 1;
      console.error(`  FAIL  ${t.name}`);
      console.error(`        ${err instanceof Error ? err.stack || err.message : String(err)}`);
    }
  }

  const elapsed = Date.now() - startedAt;
  console.log(`\nSummary: ${passed}/${tests.length} passed, ${failed} failed (${elapsed}ms)\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

void main();
