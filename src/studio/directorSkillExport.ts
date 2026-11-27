/**
 * Stagecraft Studio — Live Exportable Director `SKILL.md` Generator (Wave 5 Universal Atlas)
 *
 * Dynamically reflects EVERY live catalog (160 archetypes, 150 stages, 185 props,
 * 40 moods, 30 weathers, 30 crowds, 36 FX, 20 art engines, 12 acting macros,
 * 192 CharacterDNA sprite presets, 84 backdrop themes, 84 prop presets, 25 act arcs)
 * into a ready-to-paste `SKILL.md` for Claude Code, Codex, or Gemini CLI agents.
 */

import { ACTING_MACRO_CATALOG } from './actingMacros';
import { ACT_ARC_PRESETS, BACKDROP_THEMES, CUSTOM_PROP_PRESETS } from './backdropGenerator';
import { HEADWEAR_CATALOG, SURFACE_PATTERN_CATALOG, TOP_STYLE_CATALOG } from './characterDna';
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
  WEATHER_LIST,
} from './types';

function joinIds(list: readonly { id: string }[]): string {
  return list.map((item) => `\`${item.id}\``).join(', ');
}

function joinStrings(list: readonly string[]): string {
  return list.map((id) => `\`${id}\``).join(', ');
}

/**
 * Generates an always-current, self-contained Stagecraft Director `SKILL.md`
 * directly from the live runtime catalogs.
 */
export function buildStagecraftDirectorSkillMd(): string {
  const nonEmptyProps = PROP_CATALOG.filter((p) => p.id !== 'none');

  const lines: string[] = [
    '---',
    'name: stagecraft-director',
    'description: Direct deterministic 60fps multi-genre 2D episodes for Stagecraft Studio using live catalogs, Lite Storyboard JSON, CharacterDNA, camera splines, hitstop VFX, and sprite sheets.',
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
    `- **Procedural Studio Generators**: ${BACKDROP_THEMES.length} Backdrop Themes, ${CUSTOM_PROP_PRESETS.length} Custom Prop Presets, ${ACT_ARC_PRESETS.length} 4-Act Visual Arc Presets`,
    '',
    '## 2. Recommended Episode Authoring Contract',
    '1. **Keep dialogue punchy & readable**: Aim for 8–22 words per beat (<= 145 chars, <= 3.8 words/sec) so kinetic karaoke captions stay clean in both `16:9` and `9:16`.',
    '2. **Vary framing every 1–2 beats**: Alternate `wide_stage`, `two_shot`, `closeup_left`, `closeup_right`, `split_faceoff`, `prop_spotlight`, and `motion_card` to keep Visual Craft Scorecard scores >= 2/3.',
    '3. **Prevent twin silhouettes**: Give each cast member a distinct `archetype`, `primaryColor`, and optional `dna` (headwear: `fedora`, `cyber_visor`, `astronaut_helmet`, `samurai_kabuto`, `chef_toque`, `viking_horns`, `cowboy_hat`, `elf_circlet`; tops: `trench_coat`, `lab_coat`, `business_suit`, `space_exo`, `kimono_robe`, `medieval_plate`, `sports_jersey`; patterns: `circuit_traces`, `starfield_constellation`, `camo_tactical`, `dragon_scales`, `plaid_tartan`, `wave_seigaiha`, `honeycomb_hex`, `floral_botanical`).',
    '4. **Use cinematic polish levers**:',
    '   - `visualStyle.hitstopEnabled: true` — 2–4 frame deterministic impact freeze + shockwave ring on `attack` poses, `cameraPunch >= 0.5`, `sword_clash` / `thunder_crack`, or `crimson_impact` / `shock_burst` / `shatter_glass` / `comic_pow`.',
    `   - \`visualStyle.foregroundFraming: 0.35\` (\`0..1\`) — near-camera 1.28× parallax corner framing silhouettes across all ${STAGE_CATALOG.length} stages.`,
    '   - `visualStyle.depthOfField: 0.35`, `visualStyle.lightShafts: 0.4`, `visualStyle.spatialAudio: true`.',
    '   - Per-beat `audioLeadSec` (`-0.6..+0.6`): positive = J-cut pre-roll, negative = L-cut overlap.',
    '   - Per-beat `cameraKeyframes`: `[{ "atFrac": 0, "zoom": 1, "panX": 0, "panY": 0, "ease": "ease_in_out" }, { "atFrac": 1, "zoom": 1.18, "panX": 0.05, "panY": -0.02, "ease": "overshoot" }]`.',
    '   - Per-beat `locationCard`: `{ "title": "Sector 9 Rain Alley", "subtitle": "02:14 AM · Act II", "position": "bottom_left", "style": "cinematic_bar" }`.',
    '   - Per-beat `customPropSheet`: `{ "cols": 4, "rows": 2, "frameCount": 8, "fps": 12, "loop": true }` for animated custom PNG/WebP sprite-sheet props.',
    '',
    '## 3. Minimal Valid Multi-Genre Episode JSON Template',
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
    '      "transition": "hard_cut",',
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
    '## 4. Verification & Headless Audit Commands',
    '- Schema + regression tests: `npm test`',
    '- Type check + production build: `npm run lint && npm run build`',
    '- Determinism & Visual Craft audit CLI: `node scripts/determinism-audit.mjs --aspect 16:9 --max-frame-ms 45`',
    '',
  ];

  return lines.join('\n');
}
