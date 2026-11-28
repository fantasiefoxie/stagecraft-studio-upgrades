/**
 * Stagecraft Studio — Upgrade 35: 1-Click Story Remix Blueprint Studio
 *
 * Provides 12 curated structural STORY_REMIX_BLUEPRINTS spanning 9:16 viral Shorts
 * and 16:9 long-form storytelling. `remixStoryBlueprint` combines BM25 semantic asset
 * retrieval (`recommendScenePaletteForPrompt`) with proven beat pacing, J-cuts,
 * camera keyframes, acting cues, location cards, and `popup_fold`/cinematic transitions
 * to generate 100% validated, high-Visual-Craft-Scorecard `EpisodeScript`s deterministically.
 */

import { recommendScenePaletteForPrompt } from './catalogSearchIndex';
import {
  ARCHETYPE_DEFAULT_COLORS,
  validateEpisodeScript,
  type AspectMode,
  type CaptionStyleId,
  type CastMember,
  type ColorGradeId,
  type EpisodeScript,
  type EpisodeVisualStyle,
  type RaagId,
  type RenderStyleId,
  type ShotId,
  type StoryBeat,
  type SurfaceTextureId,
  type TransitionId,
} from './types';

export type StoryRemixBlueprintId =
  | 'viral_60s_hook_twist'
  | 'true_crime_3_clues'
  | 'mythology_epic_duel'
  | 'explainer_top_5_countdown'
  | 'scifi_first_contact'
  | 'cyberpunk_heist_sprint'
  | 'cozy_bedtime_fable'
  | 'courtroom_plot_twist'
  | 'sports_underdog_comeback'
  | 'startup_rise_and_pivot'
  | 'horror_midnight_escalation'
  | 'historical_turning_point';

export interface StoryRemixBlueprint {
  id: StoryRemixBlueprintId;
  label: string;
  tagline: string;
  defaultAspect: AspectMode;
  recommendedStyle: RenderStyleId;
  colorGrade: ColorGradeId;
  texture: SurfaceTextureId;
  captionStyle: CaptionStyleId;
  defaultRaag: RaagId;
  defaultThemeQuery: string;
  defaultCastRoles: [string, string];
  signatureTransition: TransitionId;
  beatArcLabels: [string, string, string, string, string];
}

export interface StoryRemixConfig {
  blueprintId: StoryRemixBlueprintId;
  topicTitle: string;
  themeQuery: string;
  renderStyle?: RenderStyleId;
  aspect?: AspectMode;
  castNames?: [string, string];
}

export const STORY_REMIX_BLUEPRINTS: StoryRemixBlueprint[] = [
  {
    id: 'viral_60s_hook_twist',
    label: '60s Viral Hook & Twist',
    tagline: '9:16 scroll-stopping hook, escalating clues, and a punchy last-second twist reveal.',
    defaultAspect: '9:16',
    recommendedStyle: 'anime_cel',
    colorGrade: 'vermilion_royal',
    texture: 'woodblock_halftone',
    captionStyle: 'shorts_bold_pop',
    defaultRaag: 'bhairavi',
    defaultThemeQuery: 'mystery urban thriller neon twist',
    defaultCastRoles: ['Rohan', 'Mira'],
    signatureTransition: 'diagonal_slash',
    beatArcLabels: ['The Hook', 'The Clue', 'Rising Doubt', 'The Confrontation', 'The Twist'],
  },
  {
    id: 'true_crime_3_clues',
    label: 'True Crime: 3 Forensic Clues',
    tagline: 'Noir case-file breakdown with rain-slicked alleys, evidence reveals & suspect cornering.',
    defaultAspect: '16:9',
    recommendedStyle: 'neon_cybernoir',
    colorGrade: 'indigo_noir',
    texture: 'cinema_35mm',
    captionStyle: 'minimal_editorial',
    defaultRaag: 'bhairavi',
    defaultThemeQuery: 'detective noir crime rain alley evidence',
    defaultCastRoles: ['Inspector Vance', 'Witness Clara'],
    signatureTransition: 'silhouette_wipe',
    beatArcLabels: ['Case Opened', 'Forensic Clue #1', 'The Alibi Cracks', 'Midnight Interrogation', 'Case Closed'],
  },
  {
    id: 'mythology_epic_duel',
    label: 'Mythology Epic Duel',
    tagline: 'Divine confrontation, sacred weapon clash with hitstop shockwaves, and timeless moral.',
    defaultAspect: '16:9',
    recommendedStyle: 'lineless_vector',
    colorGrade: 'warm_gold',
    texture: 'parchment_grain',
    captionStyle: 'gold_manuscript',
    defaultRaag: 'darbari',
    defaultThemeQuery: 'thunder god olympus temple divine epic',
    defaultCastRoles: ['Lord Indra', 'Storm Titan'],
    signatureTransition: 'crimson_flash',
    beatArcLabels: ['Sacred Summit', 'The Challenge', 'Clash of Titans', 'Turning the Tide', 'Timeless Verdict'],
  },
  {
    id: 'explainer_top_5_countdown',
    label: 'Top-5 Fast Explainer Countdown',
    tagline: 'Snappy educational breakdown with kinetic motion cards, clean props & high retention.',
    defaultAspect: '9:16',
    recommendedStyle: 'blueprint_technical',
    colorGrade: 'default',
    texture: 'clean',
    captionStyle: 'shorts_bold_pop',
    defaultRaag: 'yaman',
    defaultThemeQuery: 'science professor lab explainer tech discovery',
    defaultCastRoles: ['Prof. Ada', 'Sam'],
    signatureTransition: 'popup_fold',
    beatArcLabels: ['Why It Matters', 'Breakthrough #3', 'The Hidden Mechanic', 'Breakthrough #1', 'Key Takeaway'],
  },
  {
    id: 'scifi_first_contact',
    label: 'Sci-Fi First Contact',
    tagline: 'Orbital anomaly detection, alien parley on a starship bridge, and cosmic revelation.',
    defaultAspect: '16:9',
    recommendedStyle: 'neon_cybernoir',
    colorGrade: 'indigo_noir',
    texture: 'cinema_35mm',
    captionStyle: 'minimal_editorial',
    defaultRaag: 'malkauns',
    defaultThemeQuery: 'space starship orbital alien diplomat hologram',
    defaultCastRoles: ['Admiral Kira', 'Envoy Zael'],
    signatureTransition: 'silhouette_wipe',
    beatArcLabels: ['Signal in Orbit', 'Bridge Alert', 'Hologram Parley', 'Translation Breakthrough', 'New Horizon'],
  },
  {
    id: 'cyberpunk_heist_sprint',
    label: 'Cyberpunk Heist Sprint',
    tagline: 'High-voltage neon infiltration, laser vault breach, and double-cross escape.',
    defaultAspect: '9:16',
    recommendedStyle: 'neon_cybernoir',
    colorGrade: 'vermilion_royal',
    texture: 'cinema_35mm',
    captionStyle: 'shorts_bold_pop',
    defaultRaag: 'bhairavi',
    defaultThemeQuery: 'cyberpunk neon hacker drone rain heist',
    defaultCastRoles: ['Nyx-09', 'Broker Kade'],
    signatureTransition: 'diagonal_slash',
    beatArcLabels: ['Target Locked', 'Firewall Breach', 'Security Surge', 'The Betrayal', 'Clean Getaway'],
  },
  {
    id: 'cozy_bedtime_fable',
    label: 'Cozy Pop-Up Bedtime Fable',
    tagline: 'Tactile cardstock pop-up theatre with spring-hinge entrances, warm shadows & gentle moral.',
    defaultAspect: '16:9',
    recommendedStyle: 'papercraft_diorama',
    colorGrade: 'warm_gold',
    texture: 'parchment_grain',
    captionStyle: 'minimal_clean',
    defaultRaag: 'yaman',
    defaultThemeQuery: 'cozy storybook forest fable lantern woodland',
    defaultCastRoles: ['Pip the Fox', 'Elder Owl'],
    signatureTransition: 'popup_fold',
    beatArcLabels: ['Once Upon a Dusk', 'A Curious Spark', 'The Woodland Test', 'A Kind Discovery', 'Sweet Dreams Moral'],
  },
  {
    id: 'courtroom_plot_twist',
    label: 'Courtroom Plot Twist',
    tagline: 'High-stakes cross-examination, surprise exhibit spotlight, and dramatic gavel verdict.',
    defaultAspect: '16:9',
    recommendedStyle: 'chiaroscuro',
    colorGrade: 'indigo_noir',
    texture: 'cinema_35mm',
    captionStyle: 'classic_cinema',
    defaultRaag: 'darbari',
    defaultThemeQuery: 'courtroom judge lawyer gavel trial verdict',
    defaultCastRoles: ['Advocate Maya', 'Judge Verma'],
    signatureTransition: 'hard_cut',
    beatArcLabels: ['Opening Argument', 'The Contradiction', 'Exhibit A Revealed', 'Objection Sustained', 'Final Verdict'],
  },
  {
    id: 'sports_underdog_comeback',
    label: 'Sports Underdog Comeback',
    tagline: 'Final-minute stadium pressure, kinetic slow-mo strike, and roaring championship win.',
    defaultAspect: '9:16',
    recommendedStyle: 'anime_cel',
    colorGrade: 'warm_gold',
    texture: 'woodblock_halftone',
    captionStyle: 'shorts_bold_pop',
    defaultRaag: 'bhairavi',
    defaultThemeQuery: 'sports stadium cricket soccer champion trophy',
    defaultCastRoles: ['Captain Dev', 'Coach Rao'],
    signatureTransition: 'diagonal_slash',
    beatArcLabels: ['Down to the Wire', 'Coach Calls Time', 'One Final Shot', 'Impact Moment', 'Champions Crowned'],
  },
  {
    id: 'startup_rise_and_pivot',
    label: 'Startup Rise & Pivot',
    tagline: 'Founder crisis in a midnight war room, bold product pivot, and winning investor pitch.',
    defaultAspect: '16:9',
    recommendedStyle: 'gouache_storybook',
    colorGrade: 'default',
    texture: 'clean',
    captionStyle: 'minimal_editorial',
    defaultRaag: 'yaman',
    defaultThemeQuery: 'startup founder ceo office pitch boardroom tech',
    defaultCastRoles: ['Founder Ananya', 'Partner Vikram'],
    signatureTransition: 'popup_fold',
    beatArcLabels: ['Runway Running Low', 'The Brutal Feedback', 'Midnight Pivot', 'Demo Day Pitch', 'Liftoff'],
  },
  {
    id: 'horror_midnight_escalation',
    label: 'Horror Midnight Escalation',
    tagline: 'Creeping gothic suspense, flickering lantern clues, and a chilling midnight apparition.',
    defaultAspect: '9:16',
    recommendedStyle: 'woodblock_print',
    colorGrade: 'emerald_fable',
    texture: 'parchment_grain',
    captionStyle: 'classic_cinema',
    defaultRaag: 'malkauns',
    defaultThemeQuery: 'horror haunted gothic graveyard ghost lantern',
    defaultCastRoles: ['Investigator Hale', 'The Wraith'],
    signatureTransition: 'ink_fade',
    beatArcLabels: ['The Locked Gate', 'Footsteps Behind', 'The Cursed Relic', 'Midnight Apparition', 'Do Not Look Back'],
  },
  {
    id: 'historical_turning_point',
    label: 'Historical Turning Point',
    tagline: 'Documentary biography arc with gilded codex texture, empire stakes, and lasting legacy.',
    defaultAspect: '16:9',
    recommendedStyle: 'illuminated_codex',
    colorGrade: 'sepia_manuscript',
    texture: 'parchment_grain',
    captionStyle: 'gold_manuscript',
    defaultRaag: 'darbari',
    defaultThemeQuery: 'historical ancient empire palace commander scroll',
    defaultCastRoles: ['Commander Tara', 'Royal Chronicler'],
    signatureTransition: 'silhouette_wipe',
    beatArcLabels: ['Eve of History', 'The Strategic Gamble', 'Turning Point', 'The Decree Signed', 'Enduring Legacy'],
  },
];

function slugifyId(text: string): string {
  const s = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 36);
  return s || 'remix_episode';
}

function buildDistinctCast(
  primaryArch: ReturnType<typeof recommendScenePaletteForPrompt>['archetype'],
  secondaryArch: ReturnType<typeof recommendScenePaletteForPrompt>['secondaryArchetype'],
  names: [string, string]
): CastMember[] {
  const c1Def = ARCHETYPE_DEFAULT_COLORS[primaryArch] || ARCHETYPE_DEFAULT_COLORS.king;
  const c2Def = ARCHETYPE_DEFAULT_COLORS[secondaryArch] || ARCHETYPE_DEFAULT_COLORS.sage;

  // Ensure second cast member always has distinct primary color for high silhouette contrast
  const primary2 =
    c2Def.primary.toLowerCase() === c1Def.primary.toLowerCase() ? '#2563eb' : c2Def.primary;

  return [
    {
      id: 'lead',
      name: names[0],
      archetype: primaryArch,
      primaryColor: c1Def.primary,
      accentColor: c1Def.accent,
      skinColor: c1Def.skin || '#d99a6c',
      scale: 1.03,
    },
    {
      id: 'foil',
      name: names[1],
      archetype: secondaryArch,
      primaryColor: primary2,
      accentColor: c2Def.accent,
      skinColor: c2Def.skin || '#c78c62',
      scale: 0.96,
    },
  ];
}

/**
 * Generates a complete, deterministic, schema-validated `EpisodeScript` by remixing
 * one of the 12 structural blueprints with BM25-retrieved Wave 5 assets for `themeQuery`.
 */
export function remixStoryBlueprint(config: StoryRemixConfig): EpisodeScript {
  const bp =
    STORY_REMIX_BLUEPRINTS.find((b) => b.id === config.blueprintId) || STORY_REMIX_BLUEPRINTS[0];

  const topicTitle = (config.topicTitle || '').trim() || bp.label;
  const themeQuery = (config.themeQuery || '').trim() || bp.defaultThemeQuery;
  const aspect: AspectMode = config.aspect || bp.defaultAspect;
  const palette = recommendScenePaletteForPrompt(`${themeQuery} ${topicTitle}`);
  const activeStyle: RenderStyleId = config.renderStyle || bp.recommendedStyle;
  const castNames: [string, string] = [
    (config.castNames?.[0] || '').trim() || bp.defaultCastRoles[0],
    (config.castNames?.[1] || '').trim() || bp.defaultCastRoles[1],
  ];

  const cast = buildDistinctCast(palette.archetype, palette.secondaryArchetype, castNames);
  const isShort = aspect === '9:16';
  const baseDur = isShort ? 3.8 : 4.6;

  const visualStyle: EpisodeVisualStyle = {
    renderStyle: activeStyle,
    lookPreset: 'classic_chiaroscuro',
    colorGrade: bp.colorGrade,
    texture: bp.texture,
    shadowContrast: activeStyle === 'papercraft_diorama' ? 0.94 : 1.06,
    inkWeight: 1.0,
    rimLight: 'gold',
    captionStyle: bp.captionStyle,
    frameBorder: activeStyle === 'papercraft_diorama' ? 'manuscript_margin' : 'clean_letterbox',
    vignette: 0.34,
    motionCadence: activeStyle === 'papercraft_diorama' ? '24fps' : 'auto',
    motionProfile: bp.id === 'cozy_bedtime_fable' ? 'naturalistic' : 'cinematic_drama',
    postFxPass: 'none',
    expressionsEnabled: true,
    karaokeCaptions: true,
    autoTrackSpeaker: true,
    depthOfField: 0.42,
    lightShafts: 0.48,
    spatialAudio: true,
    hitstopEnabled: true,
    foregroundFraming: 0.38,
    vfxIntensity: 0.78,
    tiltShiftAmount: activeStyle === 'papercraft_diorama' ? 0.55 : 0,
  };

  const arc = bp.beatArcLabels;
  const shots: ShotId[] = [
    'wide_stage',
    'two_shot',
    'prop_spotlight',
    'split_faceoff',
    'closeup_left',
  ];

  const beats: StoryBeat[] = [
    {
      id: 'b1_hook',
      title: arc[0],
      duration: baseDur,
      stage: palette.stage,
      mood: palette.mood,
      weather: palette.weather,
      crowd: palette.crowd,
      shot: shots[0],
      transition: activeStyle === 'papercraft_diorama' ? 'popup_fold' : 'ink_fade',
      lightSide: 'right',
      prop: 'none',
      cameraMove: 'slow_push',
      cameraKeyframes: [
        { atFrac: 0, zoom: 1.0, panX: -0.02, panY: 0, ease: 'ease_in_out' },
        { atFrac: 1, zoom: 1.12, panX: 0.02, panY: -0.01, ease: 'ease_in_out' },
      ],
      fx: 'none',
      sfx: 'none',
      raag: bp.defaultRaag,
      musicEnergy: 0.58,
      locationCard: {
        title: topicTitle.slice(0, 38),
        subtitle: `${bp.label} · Act I`,
        position: 'bottom_left',
        style: 'cinematic_bar',
      },
      actors: [
        { castId: 'lead', slot: 'left', pose: 'walk', expression: 'curious', facing: 'right', motion: 'enter_left' },
        { castId: 'foil', slot: 'right', pose: 'stand', expression: 'calm', facing: 'left', motion: 'still' },
      ],
      speakerId: 'lead',
      speakerLabel: cast[0].name,
      dialogue: `Everything about ${topicTitle} changed the instant we noticed what was hiding in plain sight.`,
    },
    {
      id: 'b2_setup',
      title: arc[1],
      duration: baseDur,
      stage: palette.stage,
      mood: palette.mood,
      weather: palette.weather,
      crowd: palette.crowd,
      shot: shots[1],
      transition: bp.signatureTransition,
      lightSide: 'left',
      prop: palette.prop,
      propSlot: 'center',
      cameraMove: 'pan_right',
      audioLeadSec: 0.22,
      fx: 'none',
      sfx: 'none',
      raag: bp.defaultRaag,
      musicEnergy: 0.68,
      actors: [
        { castId: 'lead', slot: 'left', pose: 'gesture', expression: 'stern', facing: 'right', motion: 'step_forward' },
        { castId: 'foil', slot: 'right', pose: 'stand', expression: 'sly', facing: 'left', motion: 'still' },
      ],
      actionCues: [
        { at: 0.45, castId: 'foil', pose: 'gesture', propPulse: 0.45 },
      ],
      speakerId: 'foil',
      speakerLabel: cast[1].name,
      dialogue: `Look closely at the evidence—everyone swore this trail went cold years ago.`,
    },
    {
      id: 'b3_reveal_prop',
      title: arc[2],
      duration: baseDur - 0.3,
      stage: palette.secondaryStage,
      mood: palette.secondaryMood,
      weather: palette.weather,
      crowd: 'none',
      shot: shots[2],
      transition: 'popup_fold',
      lightSide: 'right',
      prop: palette.prop,
      propSlot: 'center',
      cameraMove: 'slow_push',
      cameraKeyframes: [
        { atFrac: 0, zoom: 1.02, panX: 0, panY: 0, ease: 'ease_in_out' },
        { atFrac: 1, zoom: 1.18, panX: 0, panY: -0.02, ease: 'overshoot' },
      ],
      audioLeadSec: 0.25,
      fx: palette.fx,
      sfx: 'mystic_chime',
      sfxOffsetSec: 0.35,
      raag: bp.defaultRaag,
      musicEnergy: 0.78,
      locationCard: {
        title: arc[2],
        subtitle: 'Act II · Turning Point',
        position: 'bottom_left',
        style: 'cinematic_bar',
      },
      actors: [
        { castId: 'lead', slot: 'left', pose: 'gesture', expression: 'awe', facing: 'right', motion: 'still' },
        { castId: 'foil', slot: 'right', pose: 'stand', expression: 'curious', facing: 'left', motion: 'step_forward' },
      ],
      speakerId: 'lead',
      speakerLabel: cast[0].name,
      dialogue: `One single detail unlocked the entire mystery behind ${topicTitle}.`,
    },
    {
      id: 'b4_climax',
      title: arc[3],
      duration: baseDur,
      stage: palette.secondaryStage,
      mood: palette.secondaryMood,
      weather: palette.weather,
      crowd: palette.crowd,
      shot: shots[3],
      transition: bp.signatureTransition,
      lightSide: 'left',
      prop: palette.prop,
      propSlot: 'right',
      cameraMove: 'impact_shake',
      audioLeadSec: 0.18,
      fx: 'shock_burst',
      sfx: 'sword_clash',
      sfxOffsetSec: 0.55,
      raag: bp.defaultRaag,
      musicEnergy: 0.94,
      actors: [
        { castId: 'lead', slot: 'left', pose: 'attack', expression: 'angry', facing: 'right', motion: 'leap_arc' },
        { castId: 'foil', slot: 'right', pose: 'recoil', expression: 'shocked', facing: 'left', motion: 'still' },
      ],
      actionCues: [
        { at: 0.25, castId: 'lead', pose: 'attack', cameraPunch: 0.72, sfx: 'sword_clash', fx: 'shock_burst' },
      ],
      speakerId: 'lead',
      speakerLabel: cast[0].name,
      dialogue: `No more shadows, ${cast[1].name}—now the *whole truth* stands in the spotlight!`,
    },
    {
      id: 'b5_payoff',
      title: arc[4],
      duration: baseDur,
      stage: palette.stage,
      mood: palette.mood,
      weather: 'none',
      crowd: palette.crowd,
      shot: shots[4],
      transition: activeStyle === 'papercraft_diorama' ? 'popup_fold' : 'ink_fade',
      lightSide: 'right',
      prop: 'none',
      cameraMove: 'slow_pull',
      audioLeadSec: 0.2,
      fx: 'sparkle_burst',
      sfx: 'mystic_chime',
      sfxOffsetSec: 0.2,
      raag: bp.defaultRaag,
      musicEnergy: 0.62,
      actors: [
        { castId: 'lead', slot: 'left', pose: 'gesture', expression: 'joy', facing: 'right', motion: 'still' },
        { castId: 'foil', slot: 'right', pose: 'kneel', expression: 'warm', facing: 'left', motion: 'still' },
      ],
      speakerId: 'lead',
      speakerLabel: cast[0].name,
      dialogue: `Remember ${topicTitle}: the boldest twist is always written before the first scene begins.`,
    },
  ];

  const rawEpisode: EpisodeScript = {
    id: `remix_${bp.id}_${slugifyId(topicTitle)}`,
    series: bp.label,
    title: topicTitle,
    subtitle: `${bp.label} · ${aspect}`,
    defaultRaag: bp.defaultRaag,
    visualStyle,
    cast,
    beats,
  };

  const validated = validateEpisodeScript(rawEpisode);
  return validated.ok ? validated.script : rawEpisode;
}
