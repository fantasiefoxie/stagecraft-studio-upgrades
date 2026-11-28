/**
 * Stagecraft Studio — Live Exportable Director `SKILL.md` & Context-Aware Skill Router (Wave 6 · Upgrade 33)
 *
 * Dynamically reflects EVERY live catalog (160 archetypes, 150 stages, 185 props,
 * 40 moods, 30 weathers, 30 crowds, 36 FX, 20 art engines, 12 acting macros,
 * 192 CharacterDNA sprite presets, 84 backdrop themes, 84 prop presets, 25 act arcs)
 * PLUS:
 * - Complete 20-Engine Craft Matrix (material feel, lighting rule, cadence, transition/VFX, signature foley)
 * - 5-Point Anti-Slop Critique Checklist
 * - Token-saving `buildRoutedDirectorSkillMd({ query, renderStyle?, aspect?, maxPerCategory? })`
 *   powered by Upgrade 34's BM25 semantic catalog index (~70% prompt token reduction).
 */

import { ACTING_MACRO_CATALOG } from './actingMacros';
import { ACT_ARC_PRESETS, BACKDROP_THEMES, CUSTOM_PROP_PRESETS } from './backdropGenerator';
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
} from './characterDna';
import {
  type CatalogItemKind,
  recommendScenePaletteForPrompt,
  searchStudioCatalog,
} from './catalogSearchIndex';
import { SPRITE_PRESET_CATEGORIES, SPRITE_WORKSHOP_PRESETS } from './spriteWorkshopPresets';
import {
  ARCHETYPE_CATALOG,
  CAPTION_STYLE_CATALOG,
  CROWD_CATALOG,
  FX_LIST,
  MOOD_CATALOG,
  MOTION_CADENCE_CATALOG,
  MOTION_PROFILE_CATALOG,
  POST_FX_PASS_CATALOG,
  PROP_CATALOG,
  RAAG_CATALOG,
  RENDER_STYLE_CATALOG,
  SFX_CATALOG,
  SHOT_CATALOG,
  STAGE_CATALOG,
  TRANSITION_CATALOG,
  WEATHER_LIST,
  type AspectMode,
  type RenderStyleId,
} from './types';

export interface EngineCraftRecipe {
  materialFeel: string;
  lightingRule: string;
  cadence: string;
  recommendedTransition: string;
  recommendedVfx: string;
  signatureFoley: string;
}

export const ENGINE_CRAFT_MATRIX: Record<RenderStyleId, EngineCraftRecipe> = {
  chiaroscuro: {
    materialFeel: 'Deep ink theatre shadows with luminous chiaroscuro rim highlights',
    lightingRule: 'Strong directional key lightSide + warm gold or moon rim contrast',
    cadence: '24fps / auto',
    recommendedTransition: 'silhouette_wipe / ink_fade',
    recommendedVfx: 'ember_swirl + shock_burst (vfxIntensity 0.75)',
    signatureFoley: 'footstep + thunder_rumble',
  },
  shadow_puppetry: {
    materialFeel: 'Backlit oiled leather filigree silhouettes behind warm theatre scrim',
    lightingRule: 'Amber oil-lamp backlight flicker with crisp silhouette separation',
    cadence: '12fps stepped',
    recommendedTransition: 'silhouette_wipe',
    recommendedVfx: 'ember_swirl + mystic_aura',
    signatureFoley: 'whoosh + ember_crackle',
  },
  lineless_vector: {
    materialFeel: 'Flat graphic vector planes with luminous atmospheric bloom',
    lightingRule: 'Layered radial rim bloom separating foreground shapes from backdrop',
    cadence: '24fps',
    recommendedTransition: 'diagonal_slash / crimson_flash',
    recommendedVfx: 'shock_burst + divine_aura',
    signatureFoley: 'whoosh + footstep',
  },
  woodblock_print: {
    materialFeel: 'Hand-carved keyblock contours on warm fibrous rag paper',
    lightingRule: 'Bold value grouping with subtle paper grain warmth',
    cadence: '12fps stepped',
    recommendedTransition: 'silhouette_wipe / ink_fade',
    recommendedVfx: 'ink_splatter + wind_streaks',
    signatureFoley: 'footstep + paper_turn',
  },
  stained_glass: {
    materialFeel: 'Jewel-tone cathedral glass panels bound by dark lead came',
    lightingRule: 'Backlit volumetric shafts (lightShafts >= 0.55) piercing dark mullions',
    cadence: '24fps',
    recommendedTransition: 'ink_fade',
    recommendedVfx: 'divine_aura + chakra_lotus_bloom',
    signatureFoley: 'whoosh + thunder_rumble',
  },
  papercraft_diorama: {
    materialFeel: 'Photographed layered matte cardstock with lit cut-edge bevels & macro tilt-shift',
    lightingRule: 'Warm mood-tinted layered drop shadow opposite lightSide + tiltShiftAmount 0.55',
    cadence: '24fps + spring-hinge pop-up',
    recommendedTransition: 'popup_fold',
    recommendedVfx: 'golden_sparkles + soft paper dust (vfxIntensity 0.55)',
    signatureFoley: 'paper_turn + cardstock_fold + hinge_pop',
  },
  sumi_e_wash: {
    materialFeel: 'Expressive black sumi ink wash blooms on absorbent rice paper',
    lightingRule: 'Negative-space luminance with crimson hanko seal accents',
    cadence: '12fps stepped',
    recommendedTransition: 'silhouette_wipe / diagonal_slash',
    recommendedVfx: 'ink_splatter + wind_streaks',
    signatureFoley: 'whoosh + paper_turn',
  },
  greek_amphora: {
    materialFeel: 'Terracotta red-figure pottery glaze with incised classical friezes',
    lightingRule: 'Warm kiln terracotta contrast with dark obsidian silhouettes',
    cadence: '12fps stepped',
    recommendedTransition: 'silhouette_wipe',
    recommendedVfx: 'lightning_web + divine_aura',
    signatureFoley: 'footstep + thunder_rumble',
  },
  illuminated_codex: {
    materialFeel: 'Medieval vellum manuscript with burnished gold-leaf borders',
    lightingRule: 'Warm candlelight parchment glow with rich ultramarine/vermilion inks',
    cadence: '24fps',
    recommendedTransition: 'silhouette_wipe / popup_fold',
    recommendedVfx: 'golden_sparkles + spell_runes',
    signatureFoley: 'paper_turn + cardstock_fold',
  },
  kente_tapestry: {
    materialFeel: 'Woven royal silk-cotton loom patterns in gold, emerald & crimson',
    lightingRule: 'Sunlit jewel saturation with crisp geometric border rhythm',
    cadence: '24fps',
    recommendedTransition: 'diagonal_slash',
    recommendedVfx: 'golden_sparkles + confetti_cannon',
    signatureFoley: 'footstep + whoosh',
  },
  anime_cel: {
    materialFeel: 'Crisp high-contrast cel ink lines with two-tone shadow bands',
    lightingRule: 'Hard rim speculars + dramatic hitstop impact frames',
    cadence: '24fps / 12fps on twos',
    recommendedTransition: 'diagonal_slash / crimson_flash',
    recommendedVfx: 'shock_burst + speed_lines + sonic_boom_rings (vfxIntensity 0.9)',
    signatureFoley: 'whoosh + footstep',
  },
  manga_screentone: {
    materialFeel: 'Crisp monochrome ink keylines with halftone screentone shadow ramps',
    lightingRule: 'Graphic high-contrast black/white spotting + kinetic speed lines',
    cadence: '12fps stepped',
    recommendedTransition: 'diagonal_slash / hard_cut',
    recommendedVfx: 'comic_pow + speed_lines + ink_splatter_burst',
    signatureFoley: 'whoosh + paper_turn',
  },
  blueprint_technical: {
    materialFeel: 'Prussian cyan architectural draft lines with luminous white callout vectors',
    lightingRule: 'Clean orthographic blueprint grid clarity with crisp rim edges',
    cadence: '24fps motion_graphics',
    recommendedTransition: 'hard_cut / popup_fold',
    recommendedVfx: 'radar_ping + holographic_scan (vfxIntensity 0.5)',
    signatureFoley: 'cardstock_fold + whoosh',
  },
  gouache_storybook: {
    materialFeel: 'Opaque matte hand-painted gouache washes on cold-press illustration board',
    lightingRule: 'Soft luminous paper highlights with gentle warm shadow transitions',
    cadence: '24fps',
    recommendedTransition: 'ink_fade / popup_fold',
    recommendedVfx: 'sparkle_burst + petal_cyclone',
    signatureFoley: 'paper_turn + ember_crackle',
  },
  neon_cybernoir: {
    materialFeel: 'Wet midnight chrome & rain-slicked neon magenta/cyan reflections',
    lightingRule: 'Electric cyan/magenta rim bloom + dark wet street speculars',
    cadence: '60fps smooth',
    recommendedTransition: 'diagonal_slash / hard_cut',
    recommendedVfx: 'glitch_tear + holographic_scan + shock_burst',
    signatureFoley: 'thunder_rumble + whoosh',
  },
  felt_puppet: {
    materialFeel: 'Tactile stitched wool felt puppets with warm studio tabletop spotlighting',
    lightingRule: 'Soft miniature spotlight + shallow tiltShiftAmount 0.45',
    cadence: '12fps stop-motion',
    recommendedTransition: 'popup_fold / hard_cut',
    recommendedVfx: 'dust_shockwave + sparkle_burst (vfxIntensity 0.55)',
    signatureFoley: 'footstep + hinge_pop',
  },
  risograph_print: {
    materialFeel: 'Misregistered soy-ink risograph duotone layers on warm uncoated zine stock',
    lightingRule: 'Bold overprint color separation with subtle halftone grain',
    cadence: '12fps stepped',
    recommendedTransition: 'diagonal_slash / popup_fold',
    recommendedVfx: 'chromatic_split + ink_splatter_burst',
    signatureFoley: 'paper_turn + cardstock_fold',
  },
  backlit_sand: {
    materialFeel: 'Luminous golden-amber glass lightbox with sculpted kinetic sand silhouettes',
    lightingRule: 'Warm under-lit golden glow with soft drifting granular edges',
    cadence: '24fps',
    recommendedTransition: 'ink_fade / silhouette_wipe',
    recommendedVfx: 'dust_shockwave + golden_halo_burst',
    signatureFoley: 'whoosh + ember_crackle',
  },
  scratchboard_noir: {
    materialFeel: 'Razor-etched white crosshatching carved out of obsidian India-ink board',
    lightingRule: 'Stark chiaroscuro spotlighting with engraved silver highlight strokes',
    cadence: '24fps',
    recommendedTransition: 'silhouette_wipe / crimson_flash',
    recommendedVfx: 'shadow_tendrils + shatter_glass + crimson_impact',
    signatureFoley: 'footstep + thunder_rumble',
  },
  byzantine_mosaic: {
    materialFeel: 'Tesserae gold-leaf glass mosaic tiles with dark grout rhythm',
    lightingRule: 'Warm gilded shimmer + ceremonial volumetric shafts',
    cadence: '24fps',
    recommendedTransition: 'ink_fade / silhouette_wipe',
    recommendedVfx: 'divine_aura + golden_halo_burst',
    signatureFoley: 'footstep + ember_crackle',
  },
};

export const ANTI_SLOP_CRITIQUE_CHECKLIST: readonly string[] = [
  '1. **Silhouette Separation**: Never pair two cast members with identical archetypes or primary colors—vary archetype, scale, headgear, or CharacterDNA.',
  '2. **Shot & Rhythm Variety**: Change shot framing (`wide_stage`, `two_shot`, `closeup_left/right`, `prop_spotlight`, `split_faceoff`) every 1–2 beats and avoid static >10s stretches.',
  '3. **Caption Corridor Discipline**: Keep dialogue 8–22 words (<=145 chars, <=3.8 w/s) so kinetic karaoke captions never crowd faces in 9:16 or 16:9.',
  '4. **Style-Matched Craft Levers**: Match `transition` (e.g. `popup_fold` for `papercraft_diorama`), `vfxIntensity`, `tiltShiftAmount`, `depthOfField`, and `lightShafts` to the chosen engine rather than maxing every slider.',
  '5. **Motivated Impact & Audio**: Reserve `hitstopEnabled` strikes, shockwave distortion (`shock_burst`/`sword_clash`), and J-cuts (`audioLeadSec`) for genuine narrative peaks.',
];

function joinIds(list: readonly { id: string }[]): string {
  return list.map((item) => `\`${item.id}\``).join(', ');
}

function joinStrings(list: readonly string[]): string {
  return list.map((id) => `\`${id}\``).join(', ');
}

/**
 * Generates an always-current, self-contained Stagecraft Director `SKILL.md`
 * directly from the live runtime catalogs, complete with the 20-Engine Craft Matrix
 * and 5-Point Anti-Slop Critique Checklist.
 */
export function buildStagecraftDirectorSkillMd(): string {
  const nonEmptyProps = PROP_CATALOG.filter((p) => p.id !== 'none');

  const craftMatrixRows = RENDER_STYLE_CATALOG.map((rs) => {
    const c = ENGINE_CRAFT_MATRIX[rs.id];
    return `| \`${rs.id}\` | ${c.materialFeel} | ${c.lightingRule} | ${c.cadence} | ${c.recommendedTransition} · ${c.recommendedVfx} | ${c.signatureFoley} |`;
  });

  const lines: string[] = [
    '---',
    'name: stagecraft-director',
    'description: Direct deterministic 60fps multi-genre 2D episodes for Stagecraft Studio using live catalogs, Lite Storyboard JSON, CharacterDNA, camera splines, hitstop VFX, analytical 2D VFX, pop-up papercraft, and sprite sheets.',
    '---',
    '',
    '# Stagecraft Studio — AI Episode Director Skill',
    '',
    'Use this skill whenever generating, editing, or auditing an `EpisodeScript` or Lite Storyboard JSON for **Stagecraft Studio**.',
    '',
    '## 1. Live Studio Catalog Counts',
    `- **Art Engines (${RENDER_STYLE_CATALOG.length})**: ${joinIds(RENDER_STYLE_CATALOG)}`,
    `- **Cast Archetypes (${ARCHETYPE_CATALOG.length})**: ${joinIds(ARCHETYPE_CATALOG)}`,
    `- **Stage Backdrops (${STAGE_CATALOG.length})**: ${joinIds(STAGE_CATALOG)}`,
    `- **Story Props (${PROP_CATALOG.length}: ${nonEmptyProps.length} + \`none\`)**: ${joinIds(nonEmptyProps)}`,
    `- **Lighting Moods (${MOOD_CATALOG.length})**: ${joinIds(MOOD_CATALOG)}`,
    `- **Weather Systems (${WEATHER_LIST.length})**: ${joinStrings(WEATHER_LIST)}`,
    `- **Crowd Layers (${CROWD_CATALOG.length})**: ${joinIds(CROWD_CATALOG)}`,
    `- **Kinetic Beat FX (${FX_LIST.length})**: ${joinStrings(FX_LIST)}`,
    `- **Transitions (${TRANSITION_CATALOG.length})**: ${joinIds(TRANSITION_CATALOG)}`,
    `- **Procedural SFX (${SFX_CATALOG.length})**: ${joinIds(SFX_CATALOG)}`,
    `- **Music Raag / World Engines (${RAAG_CATALOG.length})**: ${joinIds(RAAG_CATALOG)}`,
    `- **Shot Framings (${SHOT_CATALOG.length})**: ${joinIds(SHOT_CATALOG)}`,
    `- **Motion Cadences (${MOTION_CADENCE_CATALOG.length})**: ${joinIds(MOTION_CADENCE_CATALOG)}`,
    `- **12-Principles Motion Profiles (${MOTION_PROFILE_CATALOG.length})**: ${joinIds(MOTION_PROFILE_CATALOG)}`,
    `- **Post-FX Passes (${POST_FX_PASS_CATALOG.length})**: ${joinIds(POST_FX_PASS_CATALOG)}`,
    `- **Caption Styles (${CAPTION_STYLE_CATALOG.length})**: ${joinIds(CAPTION_STYLE_CATALOG)}`,
    `- **Character Acting Macros (${ACTING_MACRO_CATALOG.length})**: ${joinIds(ACTING_MACRO_CATALOG)}`,
    `- **Curated CharacterDNA Sprite Presets (${SPRITE_WORKSHOP_PRESETS.length})** across ${SPRITE_PRESET_CATEGORIES.length} categories: ${joinIds(SPRITE_WORKSHOP_PRESETS)}`,
    `- **CharacterDNA Parts**: Headwear (${HEADWEAR_CATALOG.length}): ${joinIds(HEADWEAR_CATALOG)} | Tops (${TOP_STYLE_CATALOG.length}): ${joinIds(TOP_STYLE_CATALOG)} | Surface Patterns (${SURFACE_PATTERN_CATALOG.length}): ${joinIds(SURFACE_PATTERN_CATALOG)}`,
    `- **Wave 7 Sims-Grade Face & Hair DNA**: Eyebrows (${EYEBROW_STYLE_CATALOG.length}): ${joinIds(EYEBROW_STYLE_CATALOG)} | Pupils (${PUPIL_STYLE_CATALOG.length}): ${joinIds(PUPIL_STYLE_CATALOG)} | Eyelashes (${EYELASH_STYLE_CATALOG.length}): ${joinIds(EYELASH_STYLE_CATALOG)} | Mouths (${MOUTH_STYLE_CATALOG.length}): ${joinIds(MOUTH_STYLE_CATALOG)} | Hair (${HAIR_STYLE_CATALOG.length}): ${joinIds(HAIR_STYLE_CATALOG)} | Facial Hair (${FACIAL_HAIR_CATALOG.length}): ${joinIds(FACIAL_HAIR_CATALOG)} | 12 Face Morphs (\`jawWidth\`, \`chinLength\`, \`cheekboneWidth\`, \`eyeSize\`, \`eyeSpacing\`, \`eyeTilt\`, \`browHeight\`, \`browThickness\`, \`noseScale\`, \`mouthWidth\`, \`earScale\`, \`neckLength\`)`,
    `- **Wave 7 Combinable Marks & Ink**: Face Marks (${FACE_MARK_CATALOG.length}, primary + \`secondaryFaceMark\` + \`blushIntensity\`): ${joinIds(FACE_MARK_CATALOG)} | Body Marks (${BODY_MARK_CATALOG.length}, up to 3 active): ${joinIds(BODY_MARK_CATALOG)}`,
    `- **Wave 7 Layered Clothing**: Outerwear (${OUTERWEAR_CATALOG.length}): ${joinIds(OUTERWEAR_CATALOG)} | Sleeves (${SLEEVE_CATALOG.length}): ${joinIds(SLEEVE_CATALOG)} | Waist/Belts (${WAIST_CATALOG.length}): ${joinIds(WAIST_CATALOG)} | Gloves (${GLOVE_CATALOG.length}): ${joinIds(GLOVE_CATALOG)} | Footwear (${FOOTWEAR_CATALOG.length}): ${joinIds(FOOTWEAR_CATALOG)}`,
    `- **Wave 7 5-Slot Accessories**: Eyewear (${EYEWEAR_CATALOG.length}): ${joinIds(EYEWEAR_CATALOG)} | Ear/Face Jewelry (${EAR_JEWELRY_CATALOG.length}): ${joinIds(EAR_JEWELRY_CATALOG)} | Neckwear (${NECKWEAR_CATALOG.length}): ${joinIds(NECKWEAR_CATALOG)} | Wristwear (${WRISTWEAR_CATALOG.length}): ${joinIds(WRISTWEAR_CATALOG)} | Back Gear (${BACK_GEAR_CATALOG.length}): ${joinIds(BACK_GEAR_CATALOG)}`,
    `- **Procedural Studio Generators**: ${BACKDROP_THEMES.length} Backdrop Themes, ${CUSTOM_PROP_PRESETS.length} Custom Prop Presets, ${ACT_ARC_PRESETS.length} 4-Act Visual Arc Presets`,
    '',
    '## 2. 20-Engine Craft Matrix',
    '| Art Engine | Material Feel | Lighting Rule | Cadence | Transition & VFX | Signature Foley |',
    '| :--- | :--- | :--- | :--- | :--- | :--- |',
    ...craftMatrixRows,
    '',
    '## 3. Recommended Episode Authoring Contract (Wave 6)',
    '1. **Keep dialogue punchy & readable**: Aim for 8–22 words per beat (<= 145 chars, <= 3.8 words/sec) so kinetic karaoke captions stay clean in both `16:9` and `9:16`.',
    '2. **Vary framing every 1–2 beats**: Alternate `wide_stage`, `two_shot`, `closeup_left`, `closeup_right`, `split_faceoff`, `prop_spotlight`, and `motion_card` to keep Visual Craft Scorecard scores >= 2/3.',
    '3. **Prevent twin silhouettes**: Give each cast member a distinct `archetype`, `primaryColor`, and optional `dna` (headwear: `fedora`, `cyber_visor`, `astronaut_helmet`, `samurai_kabuto`, `chef_toque`, `viking_horns`, `cowboy_hat`, `elf_circlet`; tops: `trench_coat`, `lab_coat`, `business_suit`, `space_exo`, `kimono_robe`, `medieval_plate`, `sports_jersey`; patterns: `circuit_traces`, `starfield_constellation`, `camo_tactical`, `dragon_scales`, `plaid_tartan`, `wave_seigaiha`, `honeycomb_hex`, `floral_botanical`).',
    '4. **Use cinematic polish levers (Waves 4–6)**:',
    '   - `visualStyle.vfxIntensity` (`0..1`, default `0.75`) — scales Effekseer-style analytical 2D ribbons, burst particles, rings & pooled shockwave refraction.',
    '   - `visualStyle.tiltShiftAmount` (`0..1`, default `0`, auto `0.55` in `papercraft_diorama`) — zero-allocation miniature macro lens top/bottom blur band.',
    '   - `beat.transition: "popup_fold"` — physical cardstock horizon hinge fold + staggered spring-hinge pop-up entrance with procedural `paper_turn`, `cardstock_fold` & `hinge_pop` foley.',
    '   - `visualStyle.hitstopEnabled: true` — 2–4 frame deterministic impact freeze + shockwave ring on `attack` poses, `cameraPunch >= 0.5`, `sword_clash` / `thunder_crack`, or `crimson_impact` / `shock_burst` / `shatter_glass` / `comic_pow`.',
    `   - \`visualStyle.foregroundFraming: 0.35\` (\`0..1\`) — near-camera 1.28× parallax corner framing silhouettes across all ${STAGE_CATALOG.length} stages.`,
    '   - `visualStyle.depthOfField: 0.35`, `visualStyle.lightShafts: 0.4`, `visualStyle.spatialAudio: true`.',
    '   - Per-beat `audioLeadSec` (`-0.6..+0.6`): positive = J-cut pre-roll, negative = L-cut overlap.',
    '   - Per-beat `cameraKeyframes`: `[{ "atFrac": 0, "zoom": 1, "panX": 0, "panY": 0, "ease": "ease_in_out" }, { "atFrac": 1, "zoom": 1.18, "panX": 0.05, "panY": -0.02, "ease": "overshoot" }]`.',
    '   - Per-beat `locationCard`: `{ "title": "Sector 9 Rain Alley", "subtitle": "02:14 AM · Act II", "position": "bottom_left", "style": "cinematic_bar" }`.',
    '   - Per-beat `customPropSheet`: `{ "cols": 4, "rows": 2, "frameCount": 8, "fps": 12, "loop": true }` for animated custom PNG/WebP sprite-sheet props.',
    '',
    '## 4. 5-Point Anti-Slop Critique Checklist',
    ...ANTI_SLOP_CRITIQUE_CHECKLIST,
    '',
    '## 5. Minimal Valid Multi-Genre Episode JSON Template',
    '```json',
    '{',
    '  "id": "neon_rain_casefile",',
    '  "series": "Noir Investigations",',
    '  "title": "The Clockwork Cipher",',
    '  "subtitle": "Episode 1",',
    '  "defaultRaag": "bhairavi",',
    '  "visualStyle": {',
    '    "renderStyle": "neon_cybernoir",',
    '    "colorGrade": "indigo_noir",',
    '    "texture": "cinema_35mm",',
    '    "captionStyle": "minimal_editorial",',
    '    "depthOfField": 0.4,',
    '    "lightShafts": 0.55,',
    '    "foregroundFraming": 0.4,',
    '    "vfxIntensity": 0.8,',
    '    "tiltShiftAmount": 0,',
    '    "hitstopEnabled": true,',
    '    "spatialAudio": true',
    '  },',
    '  "cast": [',
    '    { "id": "vance", "name": "Inspector Vance", "archetype": "detective", "primaryColor": "#475569", "accentColor": "#f2c85b" },',
    '    { "id": "nyx", "name": "Nyx-09", "archetype": "cyber_hacker", "primaryColor": "#7c3aed", "accentColor": "#22d3ee" }',
    '  ],',
    '  "beats": [',
    '    {',
    '      "id": "b1",',
    '      "title": "Rain Alley Arrival",',
    '      "duration": 4.2,',
    '      "stage": "neon_cyber_alley",',
    '      "mood": "cyber_magenta",',
    '      "weather": "rain",',
    '      "crowd": "cyber_drones",',
    '      "shot": "wide_stage",',
    '      "transition": "popup_fold",',
    '      "lightSide": "right",',
    '      "prop": "holo_tablet",',
    '      "cameraMove": "slow_zoom_in",',
    '      "fx": "none",',
    '      "sfx": "none",',
    '      "raag": "bhairavi",',
    '      "musicEnergy": 0.65,',
    '      "locationCard": { "title": "Neon Sector 9", "subtitle": "Midnight · Case File #04", "position": "bottom_left", "style": "cinematic_bar" },',
    '      "actors": [',
    '        { "castId": "vance", "slot": "left", "pose": "stand", "expression": "calm", "facing": "right", "motion": "enter_left" },',
    '        { "castId": "nyx", "slot": "right", "pose": "gesture", "expression": "sly", "facing": "left", "motion": "still" }',
    '      ],',
    '      "speakerId": "vance",',
    '      "speakerLabel": "Inspector Vance",',
    '      "dialogue": "The cipher vanished at midnight—and every drone in Sector Nine saw who took it."',
    '    }',
    '  ]',
    '}',
    '```',
    '',
    '## 6. Verification & Headless Audit Commands',
    '- Schema + regression tests: `npm test`',
    '- Type check + production build: `npm run lint && npm run build`',
    '- Determinism & Visual Craft audit CLI: `node scripts/determinism-audit.mjs --aspect 16:9 --max-frame-ms 45`',
    '',
  ];

  return lines.join('\n');
}

export interface RoutedDirectorSkillOptions {
  query: string;
  renderStyle?: RenderStyleId;
  aspect?: AspectMode;
  maxPerCategory?: number;
}

/**
 * Upgrade 33: Context-Aware Routed `SKILL.md` generator powered by BM25 search.
 * Routes any story pitch/genre to ONLY the top matching archetypes, stages, props,
 * moods, weathers, crowds, FX, and the selected engine's craft recipe — cutting
 * prompt token size by ~65-80% compared to dumping all 1,150+ items.
 */
export function buildRoutedDirectorSkillMd(options: RoutedDirectorSkillOptions): string {
  const query = (options.query || '').trim() || 'cinematic drama';
  const maxPer = Math.max(3, Math.min(14, Math.floor(options.maxPerCategory ?? 8)));
  const palette = recommendScenePaletteForPrompt(query);
  const chosenStyle: RenderStyleId = options.renderStyle || palette.renderStyle;
  const aspect: AspectMode = options.aspect || '16:9';
  const craft = ENGINE_CRAFT_MATRIX[chosenStyle] || ENGINE_CRAFT_MATRIX.chiaroscuro;

  const fmtHits = (kind: CatalogItemKind): string => {
    const hits = searchStudioCatalog(query, { kinds: [kind], limit: maxPer }).filter(
      (h) => h.id !== 'none'
    );
    if (hits.length === 0) return '_(use default)_';
    return hits.map((h) => `\`${h.id}\` (${h.label})`).join(', ');
  };

  const lines: string[] = [
    '---',
    'name: stagecraft-director-routed',
    `description: Lean context-routed Stagecraft Studio Director Skill for "${query}" (${chosenStyle}, ${aspect}).`,
    '---',
    '',
    `# Stagecraft Director (Lean Routed Skill · ${chosenStyle} · ${aspect})`,
    '',
    `> **Story Context**: \`${query}\`  `,
    `> **Recommended Palette**: stage=\`${palette.stage}\`, altStage=\`${palette.secondaryStage}\`, lead=\`${palette.archetype}\`, foil=\`${palette.secondaryArchetype}\`, prop=\`${palette.prop}\`, mood=\`${palette.mood}\`, weather=\`${palette.weather}\`, fx=\`${palette.fx}\``,
    '',
    `## 1. Selected Engine Craft Recipe (\`${chosenStyle}\`)`,
    `- **Material Feel**: ${craft.materialFeel}`,
    `- **Lighting Rule**: ${craft.lightingRule}`,
    `- **Cadence**: ${craft.cadence}`,
    `- **Recommended Transition**: ${craft.recommendedTransition}`,
    `- **Recommended VFX**: ${craft.recommendedVfx}`,
    `- **Signature Foley**: ${craft.signatureFoley}`,
    '',
    `## 2. BM25-Routed Shortlist (Top ${maxPer} per Category)`,
    `- **Archetypes**: ${fmtHits('archetype')}`,
    `- **Stages**: ${fmtHits('stage')}`,
    `- **Props**: ${fmtHits('prop')}`,
    `- **Moods**: ${fmtHits('mood')}`,
    `- **Weathers**: ${fmtHits('weather')}`,
    `- **Crowds**: ${fmtHits('crowd')}`,
    `- **Beat FX**: ${fmtHits('fx')}`,
    `- **DNA Sprite Presets**: ${fmtHits('sprite_preset')}`,
    `- **Transitions**: ${joinIds(TRANSITION_CATALOG)}`,
    `- **Shots**: ${joinIds(SHOT_CATALOG)}`,
    '',
    '## 3. Key Wave 6–7 Schema Levers',
    `- \`visualStyle.renderStyle\`: \`"${chosenStyle}"\``,
    `- \`visualStyle.vfxIntensity\`: \`0.75\` (\`0..1\` analytical ribbons/particles/rings & shockwave refraction)`,
    `- \`visualStyle.tiltShiftAmount\`: \`${chosenStyle === 'papercraft_diorama' ? '0.55' : '0'}\` (\`0..1\` miniature macro lens tilt-shift band)`,
    '- `visualStyle.hitstopEnabled: true`, `depthOfField: 0.4`, `lightShafts: 0.45`, `foregroundFraming: 0.35`, `spatialAudio: true`',
    '- Per-beat: `transition` (supports `"popup_fold"`), `audioLeadSec` (`-0.6..0.6`), `cameraKeyframes`, `actionCues`, `locationCard`',
    `- Wave 7 Granular DNA Parts: ${fmtHits('dna_part')} — plus optional \`faceMorph\` (12 sliders), \`bodyMarks\` (max 3), \`outfit.outerwear/sleeveStyle/waistStyle/gloveStyle/footwearStyle\`, \`accessories\` (5 slots), and 10-channel \`palette\`.`,
    '',
    '## 4. 5-Point Anti-Slop Critique Checklist',
    ...ANTI_SLOP_CRITIQUE_CHECKLIST,
    '',
  ];

  return lines.join('\n');
}
