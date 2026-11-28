/**
 * Stagecraft Studio — Living LLM Master Instructions & Catalog Fingerprint Builder (Wave 7)
 *
 * Single source of truth for auto-generated LLM instructions (`STAGECRAFT_LLM_INSTRUCTIONS.md`)
 * and the auto-synced catalog summary block inside `LLM_STORY_STAGE_GUIDE.md`.
 *
 * Pure, deterministic TypeScript — zero `Math.random()`, zero filesystem I/O, zero timestamps.
 * Run `npm run sync-docs` after adding or modifying any studio catalog so Test 61 stays 0-drift.
 */

import { ACTING_MACRO_CATALOG } from './actingMacros';
import { ACT_ARC_PRESETS, BACKDROP_THEMES, CUSTOM_PROP_PRESETS } from './backdropGenerator';
import {
  AURA_STYLE_CATALOG,
  BACK_GEAR_CATALOG,
  BODY_MARK_CATALOG,
  BOTTOM_STYLE_CATALOG,
  CAPE_CATALOG,
  CHASSIS_CATALOG,
  COLLAR_CATALOG,
  EAR_JEWELRY_CATALOG,
  EAR_STYLE_CATALOG,
  EYEBROW_STYLE_CATALOG,
  EYELASH_STYLE_CATALOG,
  EYEWEAR_CATALOG,
  EYE_STYLE_CATALOG,
  FACE_MARK_CATALOG,
  FACIAL_HAIR_CATALOG,
  FOOTWEAR_CATALOG,
  GAIT_CATALOG,
  GLOVE_CATALOG,
  HAIR_STYLE_CATALOG,
  HEADWEAR_CATALOG,
  HEAD_SHAPE_CATALOG,
  HORN_STYLE_CATALOG,
  MOUTH_STYLE_CATALOG,
  NECKWEAR_CATALOG,
  NOSE_STYLE_CATALOG,
  OUTERWEAR_CATALOG,
  PUPIL_STYLE_CATALOG,
  SLEEVE_CATALOG,
  SURFACE_PATTERN_CATALOG,
  TAIL_STYLE_CATALOG,
  TOP_STYLE_CATALOG,
  WAIST_CATALOG,
  WING_STYLE_CATALOG,
  WRISTWEAR_CATALOG,
} from './characterDna';
import { SPRITE_PRESET_CATEGORIES, SPRITE_WORKSHOP_PRESETS } from './spriteWorkshopPresets';
import {
  ARCHETYPE_CATALOG,
  CAPTION_STYLE_CATALOG,
  CROWD_CATALOG,
  EXPRESSION_CATALOG,
  FX_LIST,
  MOOD_CATALOG,
  MOTION_CADENCE_CATALOG,
  MOTION_PROFILE_CATALOG,
  POSE_LIST,
  POST_FX_PASS_CATALOG,
  PROP_CATALOG,
  RAAG_CATALOG,
  RENDER_STYLE_CATALOG,
  SFX_CATALOG,
  SHOT_CATALOG,
  STAGE_CATALOG,
  TRANSITION_CATALOG,
  WEATHER_LIST,
} from './types';

export const AUTO_SYNC_START_MARKER = '<!-- STAGECRAFT_AUTO_SYNC_START -->';
export const AUTO_SYNC_END_MARKER = '<!-- STAGECRAFT_AUTO_SYNC_END -->';

function fnv1aHex(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function idsOf(list: readonly { id: string }[]): string[] {
  return list.map((item) => item.id);
}

function fmtCodeList(ids: readonly string[]): string {
  return ids.map((id) => `\`${id}\``).join(', ');
}

export interface StudioCatalogCounts {
  renderStyles: number;
  archetypes: number;
  stages: number;
  props: number;
  moods: number;
  weathers: number;
  crowds: number;
  fx: number;
  transitions: number;
  sfx: number;
  raags: number;
  shots: number;
  poses: number;
  expressions: number;
  actingMacros: number;
  spritePresets: number;
  backdropThemes: number;
  customPropPresets: number;
  actArcPresets: number;
  // Wave 7 Granular DNA catalog counts
  eyebrows: number;
  pupils: number;
  eyelashes: number;
  mouths: number;
  hairStyles: number;
  facialHair: number;
  faceMarks: number;
  bodyMarks: number;
  outerwear: number;
  sleeves: number;
  waists: number;
  gloves: number;
  footwear: number;
  eyewear: number;
  earJewelry: number;
  neckwear: number;
  wristwear: number;
  backGear: number;
}

export function getStudioCatalogCounts(): StudioCatalogCounts {
  return {
    renderStyles: RENDER_STYLE_CATALOG.length,
    archetypes: ARCHETYPE_CATALOG.length,
    stages: STAGE_CATALOG.length,
    props: PROP_CATALOG.length,
    moods: MOOD_CATALOG.length,
    weathers: WEATHER_LIST.length,
    crowds: CROWD_CATALOG.length,
    fx: FX_LIST.length,
    transitions: TRANSITION_CATALOG.length,
    sfx: SFX_CATALOG.length,
    raags: RAAG_CATALOG.length,
    shots: SHOT_CATALOG.length,
    poses: POSE_LIST.length,
    expressions: EXPRESSION_CATALOG.length,
    actingMacros: ACTING_MACRO_CATALOG.length,
    spritePresets: SPRITE_WORKSHOP_PRESETS.length,
    backdropThemes: BACKDROP_THEMES.length,
    customPropPresets: CUSTOM_PROP_PRESETS.length,
    actArcPresets: ACT_ARC_PRESETS.length,
    eyebrows: EYEBROW_STYLE_CATALOG.length,
    pupils: PUPIL_STYLE_CATALOG.length,
    eyelashes: EYELASH_STYLE_CATALOG.length,
    mouths: MOUTH_STYLE_CATALOG.length,
    hairStyles: HAIR_STYLE_CATALOG.length,
    facialHair: FACIAL_HAIR_CATALOG.length,
    faceMarks: FACE_MARK_CATALOG.length,
    bodyMarks: BODY_MARK_CATALOG.length,
    outerwear: OUTERWEAR_CATALOG.length,
    sleeves: SLEEVE_CATALOG.length,
    waists: WAIST_CATALOG.length,
    gloves: GLOVE_CATALOG.length,
    footwear: FOOTWEAR_CATALOG.length,
    eyewear: EYEWEAR_CATALOG.length,
    earJewelry: EAR_JEWELRY_CATALOG.length,
    neckwear: NECKWEAR_CATALOG.length,
    wristwear: WRISTWEAR_CATALOG.length,
    backGear: BACK_GEAR_CATALOG.length,
  };
}

/**
 * Computes a deterministic 16-hex-char fingerprint across every live catalog ID
 * (including all 18 Wave 7 granular CharacterDNA catalogs).
 */
export function computeStudioCatalogFingerprint(): string {
  const payload = [
    'renderStyles:' + idsOf(RENDER_STYLE_CATALOG).join(','),
    'archetypes:' + idsOf(ARCHETYPE_CATALOG).join(','),
    'stages:' + idsOf(STAGE_CATALOG).join(','),
    'props:' + idsOf(PROP_CATALOG).join(','),
    'moods:' + idsOf(MOOD_CATALOG).join(','),
    'weathers:' + WEATHER_LIST.join(','),
    'crowds:' + idsOf(CROWD_CATALOG).join(','),
    'fx:' + FX_LIST.join(','),
    'transitions:' + idsOf(TRANSITION_CATALOG).join(','),
    'sfx:' + idsOf(SFX_CATALOG).join(','),
    'raags:' + idsOf(RAAG_CATALOG).join(','),
    'shots:' + idsOf(SHOT_CATALOG).join(','),
    'poses:' + POSE_LIST.join(','),
    'expressions:' + idsOf(EXPRESSION_CATALOG).join(','),
    'actingMacros:' + idsOf(ACTING_MACRO_CATALOG).join(','),
    'spritePresets:' + idsOf(SPRITE_WORKSHOP_PRESETS).join(','),
    'backdropThemes:' + idsOf(BACKDROP_THEMES).join(','),
    'customPropPresets:' + idsOf(CUSTOM_PROP_PRESETS).join(','),
    'actArcPresets:' + idsOf(ACT_ARC_PRESETS).join(','),
    'chassis:' + idsOf(CHASSIS_CATALOG).join(','),
    'headShape:' + idsOf(HEAD_SHAPE_CATALOG).join(','),
    'eyeStyle:' + idsOf(EYE_STYLE_CATALOG).join(','),
    'eyebrows:' + idsOf(EYEBROW_STYLE_CATALOG).join(','),
    'pupils:' + idsOf(PUPIL_STYLE_CATALOG).join(','),
    'eyelashes:' + idsOf(EYELASH_STYLE_CATALOG).join(','),
    'mouths:' + idsOf(MOUTH_STYLE_CATALOG).join(','),
    'noseStyle:' + idsOf(NOSE_STYLE_CATALOG).join(','),
    'ears:' + idsOf(EAR_STYLE_CATALOG).join(','),
    'hair:' + idsOf(HAIR_STYLE_CATALOG).join(','),
    'facialHair:' + idsOf(FACIAL_HAIR_CATALOG).join(','),
    'horns:' + idsOf(HORN_STYLE_CATALOG).join(','),
    'faceMarks:' + idsOf(FACE_MARK_CATALOG).join(','),
    'bodyMarks:' + idsOf(BODY_MARK_CATALOG).join(','),
    'headwear:' + idsOf(HEADWEAR_CATALOG).join(','),
    'topStyle:' + idsOf(TOP_STYLE_CATALOG).join(','),
    'bottomStyle:' + idsOf(BOTTOM_STYLE_CATALOG).join(','),
    'outerwear:' + idsOf(OUTERWEAR_CATALOG).join(','),
    'sleeves:' + idsOf(SLEEVE_CATALOG).join(','),
    'waists:' + idsOf(WAIST_CATALOG).join(','),
    'gloves:' + idsOf(GLOVE_CATALOG).join(','),
    'footwear:' + idsOf(FOOTWEAR_CATALOG).join(','),
    'collar:' + idsOf(COLLAR_CATALOG).join(','),
    'cape:' + idsOf(CAPE_CATALOG).join(','),
    'surfacePattern:' + idsOf(SURFACE_PATTERN_CATALOG).join(','),
    'eyewear:' + idsOf(EYEWEAR_CATALOG).join(','),
    'earJewelry:' + idsOf(EAR_JEWELRY_CATALOG).join(','),
    'neckwear:' + idsOf(NECKWEAR_CATALOG).join(','),
    'wristwear:' + idsOf(WRISTWEAR_CATALOG).join(','),
    'backGear:' + idsOf(BACK_GEAR_CATALOG).join(','),
    'wings:' + idsOf(WING_STYLE_CATALOG).join(','),
    'tail:' + idsOf(TAIL_STYLE_CATALOG).join(','),
    'aura:' + idsOf(AURA_STYLE_CATALOG).join(','),
    'gait:' + idsOf(GAIT_CATALOG).join(','),
  ].join('|');

  const h1 = fnv1aHex(payload);
  const h2 = fnv1aHex(payload.split('').reverse().join('') + ':' + payload.length);
  return `${h1}${h2}`;
}

/**
 * Generates the auto-synced catalog summary block embedded inside `LLM_STORY_STAGE_GUIDE.md`.
 */
export function buildGuideAutoSyncSectionMd(): string {
  const c = getStudioCatalogCounts();
  const fp = computeStudioCatalogFingerprint();
  const lines: string[] = [
    AUTO_SYNC_START_MARKER,
    '## 14. Live Studio Catalog Sync Snapshot (Auto-Generated)',
    '',
    `> **Catalog Fingerprint**: \`${fp}\` — Generated deterministically by \`npm run sync-docs\` from live runtime catalogs. Do not hand-edit this block.`,
    '',
    `- **Core World Catalogs**: **${c.renderStyles}** Art Engines · **${c.archetypes}** Cast Archetypes · **${c.stages}** Stage Backdrops · **${c.props}** Props · **${c.moods}** Moods · **${c.weathers}** Weathers · **${c.crowds}** Crowds · **${c.fx}** Beat FX · **${c.transitions}** Transitions · **${c.sfx}** SFX · **${c.raags}** Music Engines · **${c.shots}** Shots · **${c.actingMacros}** Acting Macros`,
    `- **Procedural Generators & Presets**: **${c.spritePresets}** Curated CharacterDNA Sprite Presets (${SPRITE_PRESET_CATEGORIES.length} genres) · **${c.backdropThemes}** Backdrop Themes · **${c.customPropPresets}** Custom Prop Presets · **${c.actArcPresets}** 4-Act Visual Arcs`,
    `- **Wave 7 Sims-Grade CharacterDNA Parts**: **${c.eyebrows}** Eyebrows · **${c.pupils}** Pupils · **${c.eyelashes}** Eyelashes · **${c.mouths}** Mouths · **${c.hairStyles}** Hair/Manes · **${c.facialHair}** Beards/Mustaches · **${c.faceMarks}** Face Marks (primary + secondary + blush) · **${c.bodyMarks}** Body Marks (up to 3 combinable) · **${c.outerwear}** Outerwear · **${c.sleeves}** Sleeves · **${c.waists}** Waist/Belts · **${c.gloves}** Gloves · **${c.footwear}** Footwear · **${c.eyewear}** Eyewear · **${c.earJewelry}** Ear/Face Jewelry · **${c.neckwear}** Neckwear · **${c.wristwear}** Wristwear · **${c.backGear}** Back Gear · **12** Face Sculpt Morphs · **10-Channel** Color Palette`,
    `- **Full Master Reference**: See \`STAGECRAFT_LLM_INSTRUCTIONS.md\` (Section 5.7 for Sims-Grade CharacterDNA JSON authoring).`,
    AUTO_SYNC_END_MARKER,
  ];
  return lines.join('\n');
}

/**
 * Builds the complete, living `STAGECRAFT_LLM_INSTRUCTIONS.md` master instructions file
 * directly from Stagecraft Studio's live runtime catalogs.
 */
export function buildStagecraftLlmInstructionsMd(): string {
  const c = getStudioCatalogCounts();
  const fp = computeStudioCatalogFingerprint();
  const nonEmptyProps = PROP_CATALOG.filter((p) => p.id !== 'none');

  const lines: string[] = [
    '# Stagecraft Studio — Master LLM Episode & Character Authoring Instructions',
    '',
    `> **Auto-Generated Living Document** · Catalog Fingerprint: \`${fp}\`  `,
    '> Sync command: `npm run sync-docs` · Drift audit: `npm run sync-docs -- --check` (enforced by Test 61).',
    '',
    '---',
    '',
    '## 1. Mission & Non-Negotiable Determinism Rules',
    '- Output **strict, valid JSON** conforming to `EpisodeScript` (or Lite Storyboard JSON for fast multi-genre drafting).',
    '- Every visual element renders deterministically across all **20 Art Engines** (`RenderStyleId`) in both `16:9` and `9:16`.',
    '- Never invent unregistered enum IDs—use only the live catalog IDs listed below.',
    '- Keep dialogue crisp (**8–22 words**, `<= 145 chars`, `<= 3.8 words/sec`) so kinetic captions never cover faces.',
    '- Separate every cast silhouette with distinct `archetype`, `primaryColor`, and optional `dna` (headwear, outerwear, eyewear, face/body marks, and back gear).',
    '',
    '## 2. Live World Catalogs (Auto-Synced)',
    `- **Art Engines (${c.renderStyles})**: ${fmtCodeList(idsOf(RENDER_STYLE_CATALOG))}`,
    `- **Cast Archetypes (${c.archetypes})**: ${fmtCodeList(idsOf(ARCHETYPE_CATALOG))}`,
    `- **Stage Backdrops (${c.stages})**: ${fmtCodeList(idsOf(STAGE_CATALOG))}`,
    `- **Story Props (${c.props}: ${nonEmptyProps.length} + \`none\`)**: ${fmtCodeList(idsOf(nonEmptyProps))}`,
    `- **Lighting Moods (${c.moods})**: ${fmtCodeList(idsOf(MOOD_CATALOG))}`,
    `- **Weather Systems (${c.weathers})**: ${fmtCodeList(WEATHER_LIST)}`,
    `- **Crowd Layers (${c.crowds})**: ${fmtCodeList(idsOf(CROWD_CATALOG))}`,
    `- **Kinetic Beat FX (${c.fx})**: ${fmtCodeList(FX_LIST)}`,
    `- **Transitions (${c.transitions})**: ${fmtCodeList(idsOf(TRANSITION_CATALOG))}`,
    `- **Procedural SFX (${c.sfx})**: ${fmtCodeList(idsOf(SFX_CATALOG))}`,
    `- **Music Raag / World Engines (${c.raags})**: ${fmtCodeList(idsOf(RAAG_CATALOG))}`,
    `- **Shot Framings (${c.shots})**: ${fmtCodeList(idsOf(SHOT_CATALOG))}`,
    `- **Actor Poses (${c.poses})**: ${fmtCodeList(POSE_LIST)}`,
    `- **FACS Expressions (${c.expressions})**: ${fmtCodeList(idsOf(EXPRESSION_CATALOG))}`,
    `- **Motion Cadences (${MOTION_CADENCE_CATALOG.length})**: ${fmtCodeList(idsOf(MOTION_CADENCE_CATALOG))}`,
    `- **12-Principles Motion Profiles (${MOTION_PROFILE_CATALOG.length})**: ${fmtCodeList(idsOf(MOTION_PROFILE_CATALOG))}`,
    `- **Post-FX Passes (${POST_FX_PASS_CATALOG.length})**: ${fmtCodeList(idsOf(POST_FX_PASS_CATALOG))}`,
    `- **Caption Styles (${CAPTION_STYLE_CATALOG.length})**: ${fmtCodeList(idsOf(CAPTION_STYLE_CATALOG))}`,
    `- **Character Acting Macros (${c.actingMacros})**: ${fmtCodeList(idsOf(ACTING_MACRO_CATALOG))}`,
    `- **Curated CharacterDNA Sprite Presets (${c.spritePresets})**: ${fmtCodeList(idsOf(SPRITE_WORKSHOP_PRESETS))}`,
    '',
    '## 3. Cinematic Direction & Visual Craft Levers (Waves 4–6)',
    '- `visualStyle.vfxIntensity` (`0..1`, default `0.75`): controls Effekseer-inspired analytical 2D ribbons, particles, rings, and pooled shockwave refraction.',
    '- `visualStyle.tiltShiftAmount` (`0..1`, default `0`, auto `0.55` in `papercraft_diorama`): miniature macro tilt-shift focus band.',
    '- `beat.transition: "popup_fold"`: cardstock horizon hinge fold + staggered spring-hinge pop-up entrance with procedural paper foley.',
    '- `visualStyle.hitstopEnabled: true`: deterministic 2–4 frame strike freeze + shockwave ring.',
    '- `visualStyle.depthOfField`, `visualStyle.lightShafts`, `visualStyle.foregroundFraming`, `visualStyle.spatialAudio`.',
    '- Per-beat `audioLeadSec` (`-0.6..+0.6`), `cameraKeyframes`, `actionCues`, `expressionCues`, `locationCard`, `customPropSheet`.',
    '',
    '## 4. Cast Member Schema & Natural-Language `traits` Auto-Mapping',
    'Every entry in `episode.cast[]` accepts either:',
    '1. A base `archetype` + `primaryColor` + `accentColor` (with optional `traits` string parsed deterministically via `parseNaturalLanguageDnaTraits` into eyewear, outerwear, scars, tattoos, fangs, back gear, headwear, etc.), **OR**',
    '2. An explicit modular `dna` object (`CharacterDNA`, `version: 1`) for Sims-grade precision.',
    '',
    '## 5. CharacterDNA Anatomy & Wave 7 Sims-Grade Customization',
    '### 5.1 Chassis & Body Morphs',
    `- **Chassis (${CHASSIS_CATALOG.length})**: ${fmtCodeList(idsOf(CHASSIS_CATALOG))}`,
    `- **Gait (${GAIT_CATALOG.length})**: ${fmtCodeList(idsOf(GAIT_CATALOG))}`,
    '- **Body Morphs (`dna.morph`)**: `height` (`0.72..1.32`), `shoulderWidth` (`0.72..1.38`), `torsoBulk` (`0.72..1.38`), `headRatio` (`0.8..1.28`), `limbLength` (`0.78..1.28`), `posture` (`-0.25..0.25`).',
    '',
    '### 5.2 Head, Hair, Facial Hair & Appendages',
    `- **Head Shapes (${HEAD_SHAPE_CATALOG.length})**: ${fmtCodeList(idsOf(HEAD_SHAPE_CATALOG))}`,
    `- **Eye Geometry (${EYE_STYLE_CATALOG.length})**: ${fmtCodeList(idsOf(EYE_STYLE_CATALOG))}`,
    `- **Nose / Snout / Beak (${NOSE_STYLE_CATALOG.length})**: ${fmtCodeList(idsOf(NOSE_STYLE_CATALOG))}`,
    `- **Ears (${EAR_STYLE_CATALOG.length})**: ${fmtCodeList(idsOf(EAR_STYLE_CATALOG))}`,
    `- **Horns / Antlers (${HORN_STYLE_CATALOG.length})**: ${fmtCodeList(idsOf(HORN_STYLE_CATALOG))}`,
    `- **Wings (${WING_STYLE_CATALOG.length})**: ${fmtCodeList(idsOf(WING_STYLE_CATALOG))}`,
    `- **Tails (${TAIL_STYLE_CATALOG.length})**: ${fmtCodeList(idsOf(TAIL_STYLE_CATALOG))}`,
    `- **Auras (${AURA_STYLE_CATALOG.length})**: ${fmtCodeList(idsOf(AURA_STYLE_CATALOG))}`,
    '',
    '### 5.7 Sims-Grade Granular Character Customization (Wave 7 — Optional, 100% Backward Compatible)',
    'All fields below are **optional** on `CharacterDNA` (`version: 1`). Omit any field to inherit clean neutral defaults. All layers work automatically across all 20 Art Engines, all 10 `ExpressionId`s, and all 6 phoneme lip-sync visemes (`0..5`).',
    '',
    '#### Granular Face, Eyes, Eyebrows & Mouth (`dna.head` & `dna.faceMorph`)',
    `- **Eyebrow Styles (${c.eyebrows})** (\`dna.head.eyebrowStyle\`): ${fmtCodeList(idsOf(EYEBROW_STYLE_CATALOG))}`,
    `- **Pupil / Iris Styles (${c.pupils})** (\`dna.head.pupilStyle\`): ${fmtCodeList(idsOf(PUPIL_STYLE_CATALOG))}`,
    `- **Eyelash / Liner Styles (${c.eyelashes})** (\`dna.head.eyelashStyle\`): ${fmtCodeList(idsOf(EYELASH_STYLE_CATALOG))}`,
    `- **Mouth & Lip Styles (${c.mouths})** (\`dna.head.mouthStyle\`): ${fmtCodeList(idsOf(MOUTH_STYLE_CATALOG))}`,
    `- **Expanded Hair / Mane (${c.hairStyles})** (\`dna.head.hairStyle\`): ${fmtCodeList(idsOf(HAIR_STYLE_CATALOG))}`,
    `- **Expanded Facial Hair (${c.facialHair})** (\`dna.head.facialHair\`): ${fmtCodeList(idsOf(FACIAL_HAIR_CATALOG))}`,
    '- **12 Face Sculpt Morphs (`dna.faceMorph`)**:',
    '  - `jawWidth` (`0.7..1.3`, default `1`), `chinLength` (`0.7..1.3`, default `1`), `cheekboneWidth` (`0.75..1.3`, default `1`)',
    '  - `eyeSize` (`0.7..1.35`, default `1`), `eyeSpacing` (`0.75..1.3`, default `1`), `eyeTilt` (`-0.35..0.35`, default `0`)',
    '  - `browHeight` (`-0.3..0.3`, default `0`), `browThickness` (`0.5..1.8`, default `1`), `noseScale` (`0.65..1.45`, default `1`)',
    '  - `mouthWidth` (`0.7..1.35`, default `1`), `earScale` (`0.65..1.5`, default `1`), `neckLength` (`0.75..1.3`, default `1`)',
    '',
    '#### Combinable Face & Body Marks (`dna.head.faceMark`, `dna.head.secondaryFaceMark`, `dna.head.blushIntensity`, `dna.bodyMarks`)',
    `- **Face Marks (${c.faceMarks})** (combinable primary + secondary): ${fmtCodeList(idsOf(FACE_MARK_CATALOG))}`,
    '- **Cheek Blush (`dna.head.blushIntensity`)**: `0..1` (default `0`)',
    `- **Body Marks (${c.bodyMarks})** (\`dna.bodyMarks\`, array of up to 3 active IDs excluding \`none\`): ${fmtCodeList(idsOf(BODY_MARK_CATALOG))}`,
    '',
    '#### Layered Clothing & Footwear (`dna.outfit`)',
    `- **Headwear (${HEADWEAR_CATALOG.length})** (\`dna.outfit.headwear\`): ${fmtCodeList(idsOf(HEADWEAR_CATALOG))}`,
    `- **Upper Garments (${TOP_STYLE_CATALOG.length})** (\`dna.outfit.topStyle\`): ${fmtCodeList(idsOf(TOP_STYLE_CATALOG))}`,
    `- **Outerwear Layers (${c.outerwear})** (\`dna.outfit.outerwear\`): ${fmtCodeList(idsOf(OUTERWEAR_CATALOG))}`,
    `- **Sleeve Cuts (${c.sleeves})** (\`dna.outfit.sleeveStyle\`): ${fmtCodeList(idsOf(SLEEVE_CATALOG))}`,
    `- **Lower Garments (${BOTTOM_STYLE_CATALOG.length})** (\`dna.outfit.bottomStyle\`): ${fmtCodeList(idsOf(BOTTOM_STYLE_CATALOG))}`,
    `- **Waist / Belts (${c.waists})** (\`dna.outfit.waistStyle\`): ${fmtCodeList(idsOf(WAIST_CATALOG))}`,
    `- **Gloves / Handwear (${c.gloves})** (\`dna.outfit.gloves\`): ${fmtCodeList(idsOf(GLOVE_CATALOG))}`,
    `- **Footwear (${c.footwear})** (\`dna.outfit.footwear\`): ${fmtCodeList(idsOf(FOOTWEAR_CATALOG))}`,
    `- **Collars (${COLLAR_CATALOG.length})** (\`dna.outfit.collarAccessory\`): ${fmtCodeList(idsOf(COLLAR_CATALOG))}`,
    `- **Capes (${CAPE_CATALOG.length})** (\`dna.outfit.capeStyle\`): ${fmtCodeList(idsOf(CAPE_CATALOG))}`,
    `- **Surface Patterns (${SURFACE_PATTERN_CATALOG.length})** (\`dna.outfit.surfacePattern\`): ${fmtCodeList(idsOf(SURFACE_PATTERN_CATALOG))}`,
    '',
    '#### 5 Independent Accessory Slots (`dna.accessories`)',
    `- **Eyewear (${c.eyewear})** (\`dna.accessories.eyewear\`): ${fmtCodeList(idsOf(EYEWEAR_CATALOG))}`,
    `- **Ear & Face Jewelry (${c.earJewelry})** (\`dna.accessories.earJewelry\`): ${fmtCodeList(idsOf(EAR_JEWELRY_CATALOG))}`,
    `- **Neckwear (${c.neckwear})** (\`dna.accessories.neckwear\`): ${fmtCodeList(idsOf(NECKWEAR_CATALOG))}`,
    `- **Wristwear (${c.wristwear})** (\`dna.accessories.wristwear\`): ${fmtCodeList(idsOf(WRISTWEAR_CATALOG))}`,
    `- **Back Gear (${c.backGear})** (\`dna.accessories.backGear\`): ${fmtCodeList(idsOf(BACK_GEAR_CATALOG))}`,
    '',
    '#### 10-Channel Color Palette (`dna.palette`)',
    '- Base 7 channels: `primary`, `secondary`, `accent`, `skin`, `hair`, `eye`, `patternTint`',
    '- Wave 7 optional channels: `eyeSecondary` (heterochromia), `lip`, `brow`, `markTint`',
    '',
    '#### Compact Wave 7 CharacterDNA JSON Recipe',
    '```json',
    '{',
    '  "id": "kira_ronin",',
    '  "name": "Kira",',
    '  "archetype": "cyber_hacker",',
    '  "primaryColor": "#1e293b",',
    '  "accentColor": "#22d3ee",',
    '  "dna": {',
    '    "version": 1,',
    '    "chassis": "humanoid",',
    '    "head": {',
    '      "headShape": "oval_classic",',
    '      "eyeStyle": "narrow_sharp",',
    '      "pupilStyle": "ring_cyber",',
    '      "eyelashStyle": "winged_liner",',
    '      "eyebrowStyle": "slit_notched",',
    '      "noseStyle": "aquiline",',
    '      "mouthStyle": "classic",',
    '      "ears": "human",',
    '      "hairStyle": "side_shave_undercut",',
    '      "facialHair": "none",',
    '      "horns": "none",',
    '      "faceMark": "cyber_cheek_circuit",',
    '      "secondaryFaceMark": "brow_slash_scar",',
    '      "blushIntensity": 0.15',
    '    },',
    '    "faceMorph": { "jawWidth": 0.94, "eyeTilt": 0.14, "browThickness": 1.1 },',
    '    "bodyMarks": ["cyber_circuit_veins", "dragon_coil_tattoo"],',
    '    "outfit": {',
    '      "headwear": "none",',
    '      "topStyle": "cyber_jacket",',
    '      "outerwear": "leather_biker",',
    '      "sleeveStyle": "rolled_cuff",',
    '      "bottomStyle": "trousers",',
    '      "waistStyle": "utility_pouches",',
    '      "gloves": "fingerless_biker",',
    '      "footwear": "combat_boots",',
    '      "collarAccessory": "none",',
    '      "capeStyle": "none",',
    '      "surfacePattern": "circuit_traces"',
    '    },',
    '    "accessories": {',
    '      "eyewear": "cyber_holo_visor",',
    '      "earJewelry": "cyber_comms_earpiece",',
    '      "neckwear": "dog_tags",',
    '      "wristwear": "holo_wristpad",',
    '      "backGear": "crossed_katanas"',
    '    },',
    '    "palette": {',
    '      "primary": "#1e293b",',
    '      "secondary": "#0f172a",',
    '      "accent": "#22d3ee",',
    '      "skin": "#d6a481",',
    '      "hair": "#0f172a",',
    '      "eye": "#22d3ee",',
    '      "eyeSecondary": "#f59e0b",',
    '      "lip": "#9d4e5a",',
    '      "brow": "#0f172a",',
    '      "markTint": "#38bdf8",',
    '      "patternTint": "#22d3ee"',
    '    }',
    '  }',
    '}',
    '```',
    '',
    '## 6. Shot-Inspector QA Bridge, Telemetry Bundle & RFC 6902 Patches (Wave 8)',
    '- **Deterministic QA Bundle (`stagecraft-shot-inspector/v1`)**: Export via Storyboard QA -> Shot-Inspector Bridge -> `Export QA Bundle` (or CLI `node scripts/render-batch.mjs <ep.json> --out ./renders --qa-bundle [--shot-inspector-dir ../shot-inspector]`).',
    '- Contains 60fps integer beat timings, `effectiveCadenceFps` (`12 | 24 | 60`), `hitstopWindows`, `vfxBurstWindows`, `speechWindow` (with `audioLeadSec` J/L-cut offsets & `estimatedCps`), `locationCard`, per-actor `hasGranularDna` & `dnaSilhouetteSignature`, and broadcast audio targets (`-14 LUFS`, `-1.5 dBTP`).',
    '- **Safe RFC 6902 Auto-Patch Format (`stagecraft-patch/v1`)**: Import either `{ "schema": "stagecraft-patch/v1", "summary": "...", "patch": [ ... ] }` or a raw RFC 6902 array (`add` / `replace` / `remove`). Only `/beats/<index>/...` and `/visualStyle/<field>` paths are permitted; prototype-pollution keys and out-of-bounds indices are rejected atomically before `validateEpisodeScript()`.',
    '- **Live Bidirectional Bridge (`cutscene-qa-bridge/v1`)**: Origin-verified `postMessage` host handling `QA_PING` -> `QA_PONG`, `QA_RUN_AUDIT` -> `QA_PUSH_STAGECRAFT_BUNDLE`, `QA_SEEK_TIME`, and `QA_APPLY_PATCH` (dry-run & Undo-preserving commit -> `QA_PATCH_RESULT`).',
    '',
    '## 7. Mandatory Quality & Verification Gate',
    '- Sync living docs: `npm run sync-docs && npm run sync-docs -- --check`',
    '- Lint + Test + Build: `npm run lint && npm test && npm run build`',
    '',
  ];

  return lines.join('\n');
}
