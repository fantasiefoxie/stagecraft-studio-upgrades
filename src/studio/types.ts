/**
 * Katha Studio — Encyclopedic Indian Folklore & Epics Machinima Schema
 * Deterministic full-chapter engine covering 12+ classical collections:
 * Vikram & Betaal, Singhasan Battisi, Kathasaritsagara, Panchatantra, Hitopadesha,
 * Jataka Tales, Tenali Rama, Akbar & Birbal, Gopal Bhar, Ramayana, Mahabharata, & Puranas.
 */

export const STUDIO_FPS = 60;

/**
 * Canonical Integer Frame-Index Clock (Motion Canvas determinism lock).
 * All interactive previews, offline WebCodecs renders, and headless Playwright exports
 * snap timestamps to exact integer studio frames so preview === export bit-for-bit.
 */
export function timeToFrameIndex(timeSec: number, fps = STUDIO_FPS): number {
  const safeFps = Number.isFinite(fps) && fps > 0 ? Math.round(fps) : STUDIO_FPS;
  const safeT = Number.isFinite(timeSec) ? Math.max(0, timeSec) : 0;
  return Math.max(0, Math.round(safeT * safeFps));
}

export function frameIndexToTime(frameIndex: number, fps = STUDIO_FPS): number {
  const safeFps = Number.isFinite(fps) && fps > 0 ? Math.round(fps) : STUDIO_FPS;
  const safeFrame = Number.isFinite(frameIndex) ? Math.max(0, Math.floor(frameIndex)) : 0;
  return safeFrame / safeFps;
}

export function quantizeTimeToStudioFrame(timeSec: number, fps = STUDIO_FPS): number {
  return frameIndexToTime(timeToFrameIndex(timeSec, fps), fps);
}

export type AspectMode = '16:9' | '9:16';

export type StorybookShelf =
  | 'Modern Multi-Genre Showcases'
  | 'Supernatural & Royal Legends'
  | 'Animal Fables & Strategy'
  | 'Royal Court Wit & Satire'
  | 'Sacred Epics & Puranas'
  | 'Western Folklore & Fables'
  | 'East Asian Tales & Epics'
  | 'Southeast Asian Folklore'
  | 'Americas & Indigenous Legends'
  | 'African Griot & Trickster Tales';

import { CharacterDNA, validateAndNormalizeDna } from './characterDna';
export type { CharacterDNA } from './characterDna';

export type ArchetypeGroup = 'Epic & Divine' | 'Royalty & Folk' | 'Fable Fauna' | 'World Legends';

export type ArchetypeId =
  | 'deva'
  | 'goddess'
  | 'demon_king'
  | 'vanara_hero'
  | 'spirit'
  | 'yaksha'
  | 'statue_apsara'
  | 'king'
  | 'emperor'
  | 'queen'
  | 'sage'
  | 'courtier'
  | 'warrior'
  | 'ascetic'
  | 'merchant'
  | 'child'
  | 'elder_woman'
  | 'guard'
  | 'monkey'
  | 'lion'
  | 'tiger'
  | 'jackal'
  | 'serpent'
  | 'elephant'
  | 'deer'
  | 'crow'
  | 'crocodile'
  | 'tortoise'
  | 'owl'
  | 'bull'
  | 'hare'
  | 'crane'
  | 'mouse'
  | 'dog'
  | 'fox'
  | 'wolf'
  | 'spider'
  | 'knight'
  | 'samurai'
  | 'raven';

export type StageId =
  | 'banyan_clearing'
  | 'royal_durbar'
  | 'mughal_courtyard'
  | 'kali_temple'
  | 'throne_mound'
  | 'moonlit_terrace'
  | 'royal_bedchamber'
  | 'palace_garden'
  | 'river_ghat'
  | 'enchanted_lake'
  | 'bamboo_forest'
  | 'himalayan_hermitage'
  | 'cloud_skies'
  | 'kurukshetra_field'
  | 'village_chowk'
  | 'cremation_ground'
  | 'cave_den'
  | 'ocean_ship'
  | 'bazaar_lane'
  | 'courtyard_well'
  | 'royal_dungeon'
  | 'desert_caravan'
  | 'ashoka_vatika'
  | 'golden_lanka'
  | 'olympus_acropolis'
  | 'bamboo_pagoda'
  | 'enchanted_cottage'
  | 'savanna_baobab'
  | 'red_canyon_mesa'
  | 'tropical_archipelago';

export type MoodId =
  | 'midnight_banyan'
  | 'crimson_wrath'
  | 'golden_durbar'
  | 'sandstone_dusk'
  | 'twilight_temple'
  | 'moonlit_marble'
  | 'emerald_jungle'
  | 'mystic_teal';

export type PropId =
  | 'none'
  | 'khanda_sword'
  | 'bow_arrow'
  | 'gada_mace'
  | 'sudarshana_chakra'
  | 'trishul'
  | 'sanjevani_mountain'
  | 'signet_ring'
  | 'saffron_feast'
  | 'seven_mattresses'
  | 'lotus_petal'
  | 'diya_lamp'
  | 'treasure_chest'
  | 'royal_scroll'
  | 'kali_idol'
  | 'magic_chariot'
  | 'earthen_pot'
  | 'sacred_fire'
  | 'banyan_bough'
  | 'peacock_throne'
  | 'gold_bangle'
  | 'hanging_khichdi_pot'
  | 'golden_statue'
  | 'lotus_pond'
  | 'measuring_stake'
  | 'wooden_garuda'
  | 'royal_scales'
  | 'conch_shell'
  | 'stone_well'
  | 'wooden_cage'
  | 'flying_stick'
  | 'royal_palanquin'
  | 'poison_chalice'
  | 'golden_egg'
  | 'hand_mirror'
  | 'story_box'
  | 'magic_staff'
  | 'golden_fleece'
  | 'sun_orb'
  | 'magic_peach'
  | 'kris_dagger';

export type ShotId =
  | 'wide_stage'
  | 'two_shot'
  | 'closeup_left'
  | 'closeup_right'
  | 'split_faceoff'
  | 'eye_strip'
  | 'low_angle_swoop'
  | 'prop_spotlight'
  | 'motion_card';

export type TransitionId =
  | 'hard_cut'
  | 'diagonal_slash'
  | 'crimson_flash'
  | 'silhouette_wipe'
  | 'ink_fade';

export type ExpressionId =
  | 'calm'
  | 'warm'
  | 'joy'
  | 'curious'
  | 'awe'
  | 'sly'
  | 'shocked'
  | 'grief'
  | 'stern'
  | 'angry';

export type PoseId =
  | 'stand'
  | 'walk'
  | 'sit'
  | 'kneel'
  | 'recoil'
  | 'gesture'
  | 'hang_upside_down'
  | 'soar'
  | 'attack';

export type MotionId =
  | 'still'
  | 'enter_left'
  | 'enter_right'
  | 'cross_stage'
  | 'step_forward'
  | 'retreat'
  | 'leap_arc';

export type FrameMode = 'main' | 'nested_story' | 'chapter_title' | 'moral_card' | 'end_screen';

export type CrowdId = 'none' | 'courtiers' | 'villagers' | 'army' | 'forest_herd' | 'monks';

export type CameraMoveId =
  | 'still'
  | 'slow_push'
  | 'slow_pull'
  | 'pan_left'
  | 'pan_right'
  | 'impact_shake';

export type FxId =
  | 'none'
  | 'shock_burst'
  | 'question_mark'
  | 'smear_swoop'
  | 'crimson_impact'
  | 'divine_aura';

export type WeatherId = 'fireflies' | 'embers' | 'rain' | 'mist' | 'petals' | 'none';

export type RaagId =
  | 'bhairavi'
  | 'yaman'
  | 'marwa'
  | 'darbari'
  | 'bhoopali'
  | 'malkauns'
  | 'desh'
  | 'greek_lyre'
  | 'medieval_lute'
  | 'guqin_bamboo'
  | 'gamelan_wayang'
  | 'cedar_flute'
  | 'kora_griot';

export type SfxId =
  | 'none'
  | 'temple_bell'
  | 'shankha_conch'
  | 'sword_clash'
  | 'thunder_crack'
  | 'arrow_whoosh'
  | 'mystic_chime'
  | 'court_gasp'
  | 'wooden_gavel'
  | 'fire_crackle';

export type AmbienceId =
  | 'auto'
  | 'none'
  | 'night_forest'
  | 'hearth_fire'
  | 'monsoon_rain'
  | 'river_stream'
  | 'temple_wind'
  | 'royal_hall';

export type PropAnchorId = 'stage' | 'actor_left_hand' | 'actor_right_hand';

export const AMBIENCE_CATALOG: Array<{ id: AmbienceId; label: string }> = [
  { id: 'auto', label: 'Auto (Match Stage & Weather)' },
  { id: 'none', label: 'Off (Silence)' },
  { id: 'night_forest', label: 'Night Forest & Crickets' },
  { id: 'hearth_fire', label: 'Crackling Hearth / Pyre' },
  { id: 'monsoon_rain', label: 'Soft Monsoon Rain' },
  { id: 'river_stream', label: 'Flowing River / Lake' },
  { id: 'temple_wind', label: 'Temple & Mountain Breeze' },
  { id: 'royal_hall', label: 'Warm Palace Room Tone' },
];

export const PROP_ANCHOR_CATALOG: Array<{ id: PropAnchorId; label: string }> = [
  { id: 'stage', label: 'Stage Pedestal / Slot' },
  { id: 'actor_left_hand', label: 'Held by Left Actor' },
  { id: 'actor_right_hand', label: 'Held by Right Actor' },
];

export type VoiceSourceMode = 'mic' | 'upload' | 'cloud_tts' | 'local_tts' | 'browser_tts';
export type CloudTtsProviderId = 'gemini' | 'openai' | 'elevenlabs' | 'custom_server';

export interface CharacterVoiceAssignment {
  voiceId: string;
  style: string;
}

export interface VoiceStudioSettings {
  source: VoiceSourceMode;
  cloudProvider: CloudTtsProviderId;
  cloudModel: string;
  localEndpoint: string;
  localModel: string;
  speed: number;
  browserVoiceUri: string;
  autoSyncDuration: boolean;
}

export type RenderStyleId =
  | 'chiaroscuro'
  | 'shadow_puppetry'
  | 'lineless_vector'
  | 'woodblock_print'
  | 'stained_glass'
  | 'papercraft_diorama'
  | 'sumi_e_wash'
  | 'greek_amphora'
  | 'kente_tapestry'
  | 'illuminated_codex'
  | 'anime_cel'
  | 'manga_screentone'
  | 'blueprint_technical'
  | 'gouache_storybook'
  | 'neon_cybernoir'
  | 'felt_puppet'
  | 'risograph_print'
  | 'backlit_sand'
  | 'scratchboard_noir'
  | 'byzantine_mosaic';

export type RenderStyleCategory =
  | 'Editorial, Anime & Explainers'
  | 'Tactile & Handcrafted'
  | 'Mystery, Manga & Sci-Fi'
  | 'World Heritage & Epics';

export type MotionCadenceId = 'auto' | '60fps' | '24fps' | '12fps';

export type MotionProfileId =
  | 'auto'
  | 'cinematic_drama'
  | 'naturalistic'
  | 'snappy_cartoon'
  | 'motion_graphics';

export const MOTION_CADENCE_CATALOG: Array<{
  id: MotionCadenceId;
  label: string;
  shortLabel: string;
  note: string;
}> = [
  { id: 'auto', label: 'Auto (Style Native)', shortLabel: 'Auto', note: 'Matches each art medium (12/15/24/60fps)' },
  { id: '60fps', label: '60fps Smooth Fluid', shortLabel: '60fps', note: 'Silky modern explainer & broadcast motion' },
  { id: '24fps', label: '24fps Cinema Cadence', shortLabel: '24fps', note: 'Theatrical anime & feature film rhythm' },
  { id: '12fps', label: '12fps Handcrafted Twos', shortLabel: '12fps', note: 'Tactile stop-motion, felt & printmaker feel' },
];

export const MOTION_PROFILE_CATALOG: Array<{
  id: MotionProfileId;
  label: string;
  shortLabel: string;
  note: string;
}> = [
  { id: 'auto', label: 'Auto (Style Matched)', shortLabel: 'Auto', note: 'Matches 12-Principles feel to active Art Engine' },
  { id: 'cinematic_drama', label: 'Cinematic Drama', shortLabel: 'Cinema', note: 'Deliberate anticipation, cushioned slow-in/out & dramatic settle' },
  { id: 'naturalistic', label: 'Naturalistic Life', shortLabel: 'Natural', note: 'Subtle organic breathing, 7-frame overlap & asymmetric weight shifts' },
  { id: 'snappy_cartoon', label: 'Snappy Cartoon', shortLabel: 'Cartoon', note: 'Bold volume-conserving squash/stretch, high arcs & spring overshoot' },
  { id: 'motion_graphics', label: 'Motion Graphics', shortLabel: 'MoGraph', note: 'Crisp cubic-bezier ease-out reveals & snappy lower-third timing' },
];

export type PostFxPassId =
  | 'none'
  | 'bayer_dither'
  | 'pixel_grid_16bit'
  | 'crisp_outline'
  | 'chromatic_pop'
  | 'halftone_zine';

export const POST_FX_PASS_CATALOG: Array<{
  id: PostFxPassId;
  label: string;
  shortLabel: string;
  note: string;
}> = [
  { id: 'none', label: 'Off (Engine Native)', shortLabel: 'Off', note: 'Pure Art Engine finish with zero extra post-pass' },
  { id: 'bayer_dither', label: 'Bayer 4×4 Dither', shortLabel: 'Bayer', note: 'Ordered 4×4 pixel-composer dither matrix across shadows & tones' },
  { id: 'pixel_grid_16bit', label: '16-Bit Pixel Grid', shortLabel: '16-Bit', note: 'Integer-snapped nearest-neighbor pixel grid + subtle Bayer grain' },
  { id: 'crisp_outline', label: 'Crisp Graphic Edge', shortLabel: 'Edge', note: 'High-contrast graphic edge sharpening & cel-ink punch' },
  { id: 'chromatic_pop', label: 'Chromatic Split', shortLabel: 'RGB', note: 'Subtle prism RGB channel separation for kinetic/cyber impact' },
  { id: 'halftone_zine', label: 'Halftone Zine', shortLabel: 'Halftone', note: 'Duotone comic/risograph Ben-Day dot screen overlay' },
];

export const RENDER_STYLE_CATEGORIES: RenderStyleCategory[] = [
  'Editorial, Anime & Explainers',
  'Tactile & Handcrafted',
  'Mystery, Manga & Sci-Fi',
  'World Heritage & Epics',
];

export type LookPresetId =
  | 'classic_chiaroscuro'
  | 'gilded_epic'
  | 'sunlit_storybook'
  | 'moonlit_noir'
  | 'palm_leaf_manuscript';

export type ColorGradeId =
  | 'default'
  | 'warm_gold'
  | 'indigo_noir'
  | 'vermilion_royal'
  | 'emerald_fable'
  | 'sepia_manuscript';

export type SurfaceTextureId =
  | 'clean'
  | 'parchment_grain'
  | 'palm_leaf_fibers'
  | 'woodblock_halftone'
  | 'cinema_35mm';

export type RimLightId = 'auto' | 'gold' | 'moon_silver' | 'fire_crimson' | 'divine_cyan' | 'none';

export type CaptionStyleId =
  | 'classic_cinema'
  | 'gold_manuscript'
  | 'shorts_bold_pop'
  | 'minimal_clean'
  | 'comic_speech_pop'
  | 'minimal_editorial';

export type FrameBorderId = 'clean_letterbox' | 'gold_filigree' | 'manuscript_margin' | 'full_bleed';

export type CastMarkId =
  | 'default'
  | 'none'
  | 'vermilion_tilak'
  | 'tripundra_ash'
  | 'royal_mustache'
  | 'full_beard'
  | 'divine_halo';

export type CastHeadgearId =
  | 'default'
  | 'none'
  | 'royal_turban'
  | 'golden_mukut'
  | 'sage_topknot'
  | 'battle_helm';

export interface EpisodeVisualStyle {
  renderStyle: RenderStyleId;
  lookPreset: LookPresetId;
  colorGrade: ColorGradeId;
  texture: SurfaceTextureId;
  shadowContrast: number; // 0.6 (airy storybook) .. 1.0 (default) .. 1.4 (deep noir)
  inkWeight: number; // 0.7 (fine miniature) .. 1.0 (default) .. 1.5 (heavy woodcut)
  rimLight: RimLightId;
  captionStyle: CaptionStyleId;
  frameBorder: FrameBorderId;
  vignette: number; // 0 .. 1 (default 0.35)
  motionCadence?: MotionCadenceId; // 'auto' | '60fps' | '24fps' | '12fps' stepped animation feel
  motionProfile?: MotionProfileId; // 12-Principles physics profile ('auto' | 'cinematic_drama' | 'naturalistic' | 'snappy_cartoon' | 'motion_graphics')
  postFxPass?: PostFxPassId; // Composable Pixel-Composer-inspired post-FX pass ('none' | 'bayer_dither' | 'pixel_grid_16bit' | 'crisp_outline' | 'chromatic_pop' | 'halftone_zine')
  expressionsEnabled?: boolean; // Episode-level toggle (true = dynamic facial expressions, false = neutral calm)
  karaokeCaptions?: boolean; // Word-by-word kinetic active caption highlighting (Latin, Indic, RTL & CJK)
  autoTrackSpeaker?: boolean; // Automatically frame active speaker in 9:16 vertical Shorts (default true)
  depthOfField?: number; // 0 .. 1 subtle 2.5D multi-plane rack focus / backdrop defocus (default 0.35)
  lightShafts?: number; // 0 .. 1 volumetric light shafts & dust-mote atmosphere (default 0.4)
  spatialAudio?: boolean; // Deterministic stereo panning & stage room acoustics (default true)
}

export interface CastMember {
  id: string;
  name: string;
  archetype: ArchetypeId;
  primaryColor: string;
  accentColor: string;
  skinColor?: string;
  mark?: CastMarkId;
  headgear?: CastHeadgearId;
  scale?: number; // 0.82 .. 1.25 (default 1.0)
  /** Optional Sims-style parametric Modular Character / Animal / Entity DNA genome */
  dna?: CharacterDNA;
}

/**
 * Per-frame or frame-range expression keyframe for a specific character.
 * Provide any of:
 * - `frame` (0-based 60fps start frame) + optional `endFrame` (inclusive end frame for a bounded set of frames)
 * - `triggerPhrase` (exact words from `beat.dialogue` where this facial shift triggers — auto-aligned to 60fps!)
 * - `timeSec` (seconds within beat) or `at` (normalized 0..1 beat progress)
 * Plus optional `reason` explaining *why* the character feels this emotion (subtext/motivation).
 */
export interface ExpressionKeyframe {
  at?: number; // 0 .. 1 normalized beat progress
  frame?: number; // 0-based start frame index within beat at STUDIO_FPS (60fps)
  endFrame?: number; // Optional inclusive end frame for an explicit set-of-frames segment
  timeSec?: number; // Seconds offset within beat
  triggerPhrase?: string; // Spoken phrase in beat.dialogue anchoring this emotional shift
  reason?: string; // Short subtext / motivation note explaining why the character feels this emotion
  expression: ExpressionId;
}

/** Beat-level per-frame per-character expression cue (convenient for AI scripting). */
export interface BeatExpressionCue extends ExpressionKeyframe {
  castId: string;
}

/**
 * Declarative Sub-Beat Action Cue (O(1) stateless Motion-Canvas-style choreography).
 * Triggers mid-beat pose/motion switches, camera impact punches, hero prop pulses,
 * or FX bursts at an exact 60fps frame, normalized beat progress, or spoken triggerPhrase.
 */
export interface BeatActionCue {
  frame?: number;
  endFrame?: number;
  timeSec?: number;
  at?: number;
  triggerPhrase?: string;
  castId?: string;
  pose?: PoseId;
  motion?: MotionId;
  cameraPunch?: number; // 0 .. 1 zoom/shake impulse
  propPulse?: number; // 0 .. 1 radial highlight & scale impulse on hero prop
  fx?: FxId;
  sfx?: SfxId;
  label?: string;
}

export type CameraKeyframeEase = 'linear' | 'ease_in_out' | 'overshoot';

/**
 * Optional per-beat camera spline keyframe evaluated deterministically over beat progress u (0..1).
 * Composes cleanly with base cameraMove and speaker auto-framing.
 */
export interface CameraKeyframe {
  atFrac: number; // 0 .. 1 normalized beat progress
  zoom: number; // 0.7 .. 2.2 relative zoom multiplier (1.0 = neutral)
  panX: number; // -0.45 .. 0.45 normalized horizontal pan offset
  panY: number; // -0.35 .. 0.35 normalized vertical pan offset
  ease?: CameraKeyframeEase;
}

export type MotionCardLayoutId = 'hero_stat' | 'split_callout' | 'morph_bar';

/**
 * Declarative Kinetic Motion-Graphics Card specification for `shot: 'motion_card'`.
 * Renders staggered kinetic typography, morphing prompt/accent bars, and spring stat counters
 * through the active 20-Style Art Engine with zero per-video code generation.
 */
export interface MotionCardConfig {
  layout?: MotionCardLayoutId;
  kicker?: string;
  headline?: string;
  metric?: string;
  metricUnit?: string;
  bullets?: string[];
  highlightBar?: string;
  accentColor?: string;
}

export interface ActorPlacement {
  castId: string;
  slot: 'left' | 'center' | 'right' | 'overhead';
  pose: PoseId;
  expression: ExpressionId;
  /** Optional per-frame / mid-beat expression keyframes for this specific character */
  expressionTrack?: ExpressionKeyframe[];
  facing?: 'left' | 'right';
  motion?: MotionId;
  /** Optional fine stage nudge (-0.35 .. +0.35 normalized stage width/height) from interactive drag */
  offsetX?: number;
  offsetY?: number;
}

export type LocationCardPosition = 'top_left' | 'bottom_left' | 'top_right';
export type LocationCardStyle = 'cinematic_bar' | 'scroll_ribbon' | 'minimal_tag';

export interface LocationCardConfig {
  title: string;
  subtitle?: string;
  position?: LocationCardPosition;
  style?: LocationCardStyle;
}

export interface StoryBeat {
  id: string;
  title: string;
  duration: number;
  stage: StageId;
  mood: MoodId;
  weather: WeatherId;
  shot: ShotId;
  transition: TransitionId;
  lightSide: 'left' | 'right';
  prop: PropId;
  propSlot?: 'left' | 'center' | 'right' | 'overhead';
  propAnchor?: PropAnchorId; // Attach hero prop to stage pedestal OR directly in left/right actor's hand
  propOffsetX?: number; // Optional fine stage nudge (-0.35 .. +0.35)
  propOffsetY?: number; // Optional fine stage nudge (-0.35 .. +0.35)
  customPropDataUrl?: string; // Optional user-uploaded PNG/JPEG/WebP cutout prop for one-off chapter objects
  customPropLabel?: string;
  customBackdropDataUrl?: string; // Optional user-uploaded PNG/JPEG/WebP painted backdrop plate
  customBackdropLabel?: string;
  frame?: FrameMode;
  crowd?: CrowdId;
  cameraMove?: CameraMoveId;
  /** Optional manual horizontal camera framing offset (-0.45 .. +0.45 stage width; + = focus right) */
  cameraFocusX?: number;
  /** Optional manual vertical camera framing offset (-0.3 .. +0.3 stage height; + = focus lower) */
  cameraFocusY?: number;
  /** Optional per-beat camera keyframe spline nodes evaluated deterministically across beat progress */
  cameraKeyframes?: CameraKeyframe[];
  flipStage?: boolean; // Mirror stage left-to-right for instant location variety
  haze?: number; // 0 .. 1 atmospheric depth mist
  backdropZoom?: number; // 0.9 .. 1.25 stage crop zoom
  renderStyle?: RenderStyleId; // Optional per-beat Art Engine override (e.g. flashback in Shadow Puppetry or Stained Glass)
  fx: FxId;
  sfx?: SfxId;
  sfxOffsetSec?: number; // Optional 0 .. duration delay so SFX lands right on the mid-beat punchline/action
  /** Optional audio cut lead/lag in seconds (-0.6 .. +0.6): + = J-cut pre-roll before visual cut, - = L-cut delayed voice entry */
  audioLeadSec?: number;
  ambience?: AmbienceId; // Continuous ambient soundscape bed (defaults to 'auto' matching stage/weather)
  raag: RaagId;
  musicEnergy: number;
  actors: ActorPlacement[];
  /** Optional per-frame character expression cues (merged with actor.expressionTrack at render time) */
  expressionCues?: BeatExpressionCue[];
  /** Optional declarative sub-beat choreography cues (pose, motion, cameraPunch, propPulse, fx, sfx) */
  actionCues?: BeatActionCue[];
  /** Optional kinetic motion-graphics card content when shot === 'motion_card' */
  motionCard?: MotionCardConfig;
  /** Optional animated location / time-jump lower-third banner */
  locationCard?: LocationCardConfig;
  speakerId: string;
  speakerLabel: string;
  dialogue: string;
}

export interface EpisodeScript {
  id: string;
  series: string;
  shelf?: StorybookShelf;
  language?: string;
  title: string;
  subtitle: string;
  defaultRaag: RaagId;
  visualStyle?: Partial<EpisodeVisualStyle>;
  cast: CastMember[];
  beats: StoryBeat[];
}

// =========================================================================
// ENCYCLOPEDIC DETERMINISTIC CATALOG METADATA (34 Cast | 24 Stages | 34 Props)
// =========================================================================
export const ARCHETYPE_CATALOG: Array<{
  id: ArchetypeId;
  label: string;
  group: ArchetypeGroup;
  stories: string;
}> = [
  // Epic & Divine (7)
  { id: 'deva', label: 'Celestial Deva / Avatar', group: 'Epic & Divine', stories: 'Lord Rama, Krishna, Vishnu, Shiva, Indra' },
  { id: 'goddess', label: 'Divine Devi / Shakti', group: 'Epic & Divine', stories: 'Goddess Durga, Sita, Saraswati, Lakshmi' },
  { id: 'demon_king', label: 'Ten-Crowned Asura', group: 'Epic & Divine', stories: 'Ravana, Mahishasura, Bakasura, Rakshasas' },
  { id: 'vanara_hero', label: 'Vanara Hero (Hanuman)', group: 'Epic & Divine', stories: 'Hanuman, Sugriva, Angada, Ramayana' },
  { id: 'spirit', label: 'Betaal / Spirit', group: 'Epic & Divine', stories: 'Betaal, Ghosts, Cursed Souls' },
  { id: 'yaksha', label: 'Forest Yaksha', group: 'Epic & Divine', stories: 'Mahabharata Yaksha Prashna, Nature Guardians' },
  { id: 'statue_apsara', label: 'Golden Throne Apsara', group: 'Epic & Divine', stories: 'Singhasan Battisi Statues, Celestial Nymphs' },

  // Royalty & Folk (11)
  { id: 'king', label: 'Royal King', group: 'Royalty & Folk', stories: 'Vikramaditya, Bhoja, Krishna Deva Raya, Dasharatha' },
  { id: 'emperor', label: 'Mughal Emperor', group: 'Royalty & Folk', stories: 'Emperor Akbar, Imperial Courts, Nawabs' },
  { id: 'queen', label: 'Queen / Princess', group: 'Royalty & Folk', stories: 'Draupadi, Somaprabha, Kaikeyi, Noblewomen' },
  { id: 'sage', label: 'Rishi / Sage', group: 'Royalty & Folk', stories: 'Valmiki, Vishwamitra, Chanakya, Brahmin' },
  { id: 'courtier', label: 'Witty Courtier', group: 'Royalty & Folk', stories: 'Birbal, Tenali Rama, Gopal Bhar, Ministers' },
  { id: 'warrior', label: 'Epic Warrior / Prince', group: 'Royalty & Folk', stories: 'Arjuna, Lakshmana, Yudhishthira, Karna' },
  { id: 'ascetic', label: 'Mystic / Tantrik', group: 'Royalty & Folk', stories: 'Tantrik, Sorcerers, Rival Mystics' },
  { id: 'merchant', label: 'Merchant / Traveler', group: 'Royalty & Folk', stories: 'Seth, Sea Traders, Villagers, Travelers' },
  { id: 'child', label: 'Clever Child / Disciple', group: 'Royalty & Folk', stories: 'Ekalavya, Prahlada, Nachiketa, Luv-Kush' },
  { id: 'elder_woman', label: 'Wise Elder / Shabari', group: 'Royalty & Folk', stories: 'Shabari, Kunti, Grandmothers, Folk Elders' },
  { id: 'guard', label: 'Royal Guard / Bandit', group: 'Royalty & Folk', stories: 'Palace Sentinels, Dacoits, Soldiers' },

  // Fable Fauna (16)
  { id: 'monkey', label: 'Clever Monkey', group: 'Fable Fauna', stories: 'Panchatantra, Jataka Monkey King' },
  { id: 'lion', label: 'Forest Lion', group: 'Fable Fauna', stories: 'Panchatantra King of Beasts' },
  { id: 'tiger', label: 'Bengal Tiger', group: 'Fable Fauna', stories: 'Hitopadesha Greedy Tiger, Jungle Fables' },
  { id: 'bull', label: 'Noble Bull / Ox', group: 'Fable Fauna', stories: 'Panchatantra Book 1 Sanjivaka, Nandi' },
  { id: 'hare', label: 'Clever Hare / Rabbit', group: 'Fable Fauna', stories: 'Lion & Clever Hare, Jataka Moon Rabbit' },
  { id: 'jackal', label: 'Cunning Jackal', group: 'Fable Fauna', stories: 'Panchatantra, Blue Jackal, Hitopadesha' },
  { id: 'serpent', label: 'Sacred Naga', group: 'Fable Fauna', stories: 'Panchatantra, Kaliya, Shesha, Folk Tales' },
  { id: 'elephant', label: 'Temple Elephant', group: 'Fable Fauna', stories: 'Panchatantra, Jataka, Airavata' },
  { id: 'deer', label: 'Golden Deer', group: 'Fable Fauna', stories: 'Jataka Banyan Deer, Ramayana Maricha' },
  { id: 'crow', label: 'Clever Crow', group: 'Fable Fauna', stories: 'Panchatantra, Hitopadesha, Birbal Crows' },
  { id: 'crane', label: 'River Crane / Swan', group: 'Fable Fauna', stories: 'Crane & Crab, Talkative Tortoise, Hamsa' },
  { id: 'crocodile', label: 'River Crocodile', group: 'Fable Fauna', stories: 'Monkey & Crocodile, River Fables' },
  { id: 'tortoise', label: 'Wise Tortoise', group: 'Fable Fauna', stories: 'Talkative Tortoise, Jataka & Panchatantra' },
  { id: 'owl', label: 'Counsellor Owl', group: 'Fable Fauna', stories: 'Panchatantra Crows & Owls, Night Seers' },
  { id: 'mouse', label: 'Clever Mouse / Rat', group: 'Fable Fauna', stories: 'Panchatantra, Aesop Lion & Mouse' },
  { id: 'dog', label: 'Loyal Dog / Hound', group: 'Fable Fauna', stories: 'Yudhishthira’s Dog, Aesop, Folk Tales' },
  // World Legends & Folklore (6)
  { id: 'fox', label: 'Cunning Fox / Kitsune', group: 'World Legends', stories: 'Aesop Fox & Crow / Sour Grapes, Kitsune, Reynard' },
  { id: 'wolf', label: 'Timber Wolf / Coyote', group: 'World Legends', stories: 'Grimm Fairy Tales, Aesop, Indigenous Coyote' },
  { id: 'spider', label: 'Anansi Trickster Spider', group: 'World Legends', stories: 'West African Akan Anansi Stories' },
  { id: 'knight', label: 'Knight / Nordic Hero', group: 'World Legends', stories: 'King Arthur, Grimm Heroes, Greek & Norse Epics' },
  { id: 'samurai', label: 'Samurai / Eastern Hero', group: 'World Legends', stories: 'Momotaro, Japanese Yokai, Chinese Martial Epics' },
  { id: 'raven', label: 'Spirit Raven / Thunderbird', group: 'World Legends', stories: 'Pacific NW Raven Steals the Sun, Norse Ravens' },
];

export const STAGE_CATALOG: Array<{ id: StageId; label: string; useCase: string }> = [
  { id: 'banyan_clearing', label: 'Banyan Forest Clearing', useCase: 'Vikram & Betaal, Jataka groves' },
  { id: 'royal_durbar', label: 'Royal Durbar Hall', useCase: 'Tenali Rama, Gopal Bhar, Ayodhya court' },
  { id: 'mughal_courtyard', label: 'Mughal Sandstone Courtyard', useCase: 'Akbar & Birbal Fatehpur court' },
  { id: 'ashoka_vatika', label: 'Ashoka Vatika Grove', useCase: 'Ramayana Sita & Hanuman in Lanka' },
  { id: 'golden_lanka', label: 'Golden Spires of Lanka', useCase: 'Ramayana Ravana citadel & celestial cities' },
  { id: 'kali_temple', label: 'Shadowed Kali Temple', useCase: 'Singhasan Battisi vows, divine boons' },
  { id: 'throne_mound', label: 'Buried Throne Mound', useCase: 'Singhasan Battisi ancient excavation' },
  { id: 'moonlit_terrace', label: 'Moonlit Marble Terrace', useCase: 'Palace nights, lotus clues, intrigue' },
  { id: 'royal_bedchamber', label: 'Royal Bedchamber', useCase: 'Palace secrets, seven mattresses' },
  { id: 'palace_garden', label: 'Lantern Palace Garden', useCase: 'Tenali Rama, Gopal Bhar, nocturnal strolls' },
  { id: 'river_ghat', label: 'Lantern River Ghat', useCase: 'Yamuna crossings, Sarayu, crocodile banks' },
  { id: 'enchanted_lake', label: 'Enchanted Lotus Lake', useCase: 'Yaksha Prashna, Hitopadesha pond' },
  { id: 'bamboo_forest', label: 'Dense Jungle Grove', useCase: 'Panchatantra, Dandaka forest, Jataka' },
  { id: 'cave_den', label: 'Mountain Cave & Den', useCase: 'Talking Cave, Kishkindha, lion’s den' },
  { id: 'ocean_ship', label: 'Ocean Crossing & Ram Setu', useCase: 'Sea voyages, Odyssey, Lanka crossing' },
  { id: 'bazaar_lane', label: 'Lantern Bazaar Street', useCase: 'Tenali, Birbal, Arabian Nights & merchants' },
  { id: 'courtyard_well', label: 'Stone Courtyard Well', useCase: 'Lion & Clever Hare, Frog in the Well' },
  { id: 'royal_dungeon', label: 'Iron-Barred Dungeon', useCase: 'Captive princes, twists, courtroom rescues' },
  { id: 'desert_caravan', label: 'Starlit Caravan Dunes', useCase: '1001 Nights, Silk Road & desert parables' },
  { id: 'himalayan_hermitage', label: 'Himalayan Hermitage', useCase: 'Rishi ashrams, Valmiki, mountain sages' },
  { id: 'cloud_skies', label: 'Moonlit Cloud Skies', useCase: 'Hanuman, Sun Wukong, Raven & Icarus flight' },
  { id: 'kurukshetra_field', label: 'Epic Battlefield', useCase: 'Mahabharata, Ramayana, Troy & Arthurian battles' },
  { id: 'village_chowk', label: 'Lantern Village Square', useCase: 'Folk comedy, merchants, thieves' },
  { id: 'cremation_ground', label: 'Smoldering Cremation Ground', useCase: 'Betaal & eerie Tantrik rituals' },
  { id: 'olympus_acropolis', label: 'Greek Acropolis & Olive Grove', useCase: 'Aesop’s Fables, Greek Mythology & Odyssey' },
  { id: 'bamboo_pagoda', label: 'Misty Pagoda & Torii Shrine', useCase: 'Journey to the West, Japanese & Chinese Tales' },
  { id: 'enchanted_cottage', label: 'Nordic Pine Woods & Cottage', useCase: 'Grimm’s Fairy Tales, Celtic & Norse Folklore' },
  { id: 'savanna_baobab', label: 'African Savanna & Great Baobab', useCase: 'Anansi the Spider & African Griot Fables' },
  { id: 'red_canyon_mesa', label: 'Red Rock Canyon & Starry Mesa', useCase: 'Indigenous American & Mesoamerican Legends' },
  { id: 'tropical_archipelago', label: 'Javanese Banyan & Volcano Bay', useCase: 'Sang Kancil, Wayang & Southeast Asian Tales' },
];

export const MOOD_CATALOG: Array<{ id: MoodId; label: string }> = [
  { id: 'midnight_banyan', label: 'Midnight Indigo' },
  { id: 'crimson_wrath', label: 'Crimson Wrath' },
  { id: 'golden_durbar', label: 'Golden Durbar' },
  { id: 'sandstone_dusk', label: 'Mughal Sandstone' },
  { id: 'twilight_temple', label: 'Twilight Violet' },
  { id: 'moonlit_marble', label: 'Silver Moonlight' },
  { id: 'emerald_jungle', label: 'Emerald Jungle' },
  { id: 'mystic_teal', label: 'Mystic Lake Teal' },
];

export const PROP_CATALOG: Array<{ id: PropId; label: string; note: string }> = [
  { id: 'none', label: 'None', note: 'Clear stage focus' },
  { id: 'khanda_sword', label: 'Khanda Broadsword', note: 'Gleaming royal steel' },
  { id: 'bow_arrow', label: 'Divine Bow & Arrow', note: 'Rama Kodanda, Arjuna, Robin Hood' },
  { id: 'gada_mace', label: 'Golden Gada Mace', note: 'Hanuman & Bhima war mace' },
  { id: 'sudarshana_chakra', label: 'Sudarshana Chakra', note: 'Spinning golden celestial disc' },
  { id: 'trishul', label: 'Sacred Trishul', note: 'Shiva, Devi & Poseidon trident' },
  { id: 'sanjevani_mountain', label: 'Sanjeevani Peak', note: 'Glowing herb mountain carried aloft' },
  { id: 'signet_ring', label: 'Royal Signet Ring', note: 'Rama’s Chudamani token & Shakuntala' },
  { id: 'stone_well', label: 'Stone Reflection Well', note: 'Lion & Clever Hare water reflection' },
  { id: 'wooden_cage', label: 'Hunter’s Wooden Cage', note: 'Panchatantra, Aesop & Jataka rescues' },
  { id: 'flying_stick', label: 'Carried Bamboo Pole', note: 'Talkative Tortoise mid-air flight' },
  { id: 'royal_palanquin', label: 'Royal Palki Palanquin', note: 'Royal processions & palanquin riddles' },
  { id: 'poison_chalice', label: 'Smoking Poison Chalice', note: 'Palace intrigue & devotion trials' },
  { id: 'golden_egg', label: 'Glowing Golden Egg', note: 'Aesop Goose & Folk boon fables' },
  { id: 'hand_mirror', label: 'Ornate Brass Mirror', note: 'Vanity, reflections & fairy tales' },
  { id: 'saffron_feast', label: 'Saffron Rice & Mist', note: 'Chowki, banana leaf, rising mist' },
  { id: 'seven_mattresses', label: 'Seven Mattresses', note: '7 layers + red hair marker' },
  { id: 'lotus_petal', label: 'Falling Lotus Petal', note: 'Animated drift + impact ring' },
  { id: 'diya_lamp', label: 'Brass Diya / Oil Lamp', note: 'Warm flickering flame cone (Aladdin / Diya)' },
  { id: 'treasure_chest', label: 'Treasure Chest', note: 'Gold coins & rubies' },
  { id: 'royal_scroll', label: 'Palm-Leaf / Parchment Scroll', note: 'Riddles, decrees, wisdom' },
  { id: 'kali_idol', label: 'Temple Shrine Idol', note: 'Glowing third-eye silhouette' },
  { id: 'magic_chariot', label: 'Golden Chariot', note: 'Pushpaka Vimana, Helios & Epic war chariots' },
  { id: 'earthen_pot', label: 'Terracotta Matka / Jar', note: 'Village, Tenali, Birbal & Folk pots' },
  { id: 'sacred_fire', label: 'Sacred Campfire / Havan', note: 'Ritual flames & storytelling fire' },
  { id: 'banyan_bough', label: 'Hanging Banyan Bough', note: 'Perch for Betaal / monkeys' },
  { id: 'peacock_throne', label: 'Royal Throne', note: 'King seat for durbar & palace scenes' },
  { id: 'gold_bangle', label: 'Golden Bangle', note: 'Hitopadesha gleaming gold trap' },
  { id: 'hanging_khichdi_pot', label: 'Birbal Khichdi Tripod', note: 'Clay pot hung high over tiny fire' },
  { id: 'golden_statue', label: 'Singhasan Putli Statue', note: 'Glowing golden guardian maiden' },
  { id: 'lotus_pond', label: 'Sacred Lotus Pool', note: 'Moonlit ripples & blooming lotus' },
  { id: 'measuring_stake', label: 'Earth-Measure Stake', note: 'Gopal Bhar survey peg & rope' },
  { id: 'wooden_garuda', label: 'Mechanical Garuda', note: 'Kathasaritsagara winged automaton' },
  { id: 'royal_scales', label: 'Scales of Justice', note: 'Tipping brass balance beam' },
  { id: 'conch_shell', label: 'Sacred Shankha Conch', note: 'Epic proclamation soundwaves' },
  { id: 'story_box', label: 'Nyame’s Golden Story Box', note: 'Anansi’s radiant African tale chest' },
  { id: 'magic_staff', label: 'Ruyi Iron Staff / Wizard Staff', note: 'Sun Wukong’s gilded crimson staff' },
  { id: 'golden_fleece', label: 'Greek Amphora & Laurel', note: 'Classical Attic vessel & victory wreath' },
  { id: 'sun_orb', label: 'Radiant Stolen Sun Orb', note: 'Raven Steals the Sun & sky myths' },
  { id: 'magic_peach', label: 'Giant Immortal Peach', note: 'Journey to the West, Momotaro & Grimm' },
  { id: 'kris_dagger', label: 'Javanese Golden Kris', note: 'Southeast Asian Wayang & archipelago blade' },
];

export const SHOT_CATALOG: Array<{ id: ShotId; label: string }> = [
  { id: 'wide_stage', label: 'Wide Stage' },
  { id: 'two_shot', label: 'Medium Two-Shot' },
  { id: 'closeup_left', label: 'Close-Up · Actor 1' },
  { id: 'closeup_right', label: 'Close-Up · Actor 2' },
  { id: 'split_faceoff', label: 'Split-Screen Face-Off' },
  { id: 'eye_strip', label: 'Cinematic Eye Strip' },
  { id: 'low_angle_swoop', label: 'Low-Angle Swoop' },
  { id: 'prop_spotlight', label: 'Prop Spotlight Cutaway' },
  { id: 'motion_card', label: 'Kinetic Motion Card' },
];

export const TRANSITION_CATALOG: Array<{ id: TransitionId; label: string }> = [
  { id: 'hard_cut', label: 'Hard Cut' },
  { id: 'diagonal_slash', label: 'Diagonal Panel Slash' },
  { id: 'crimson_flash', label: 'Crimson Shock Flash' },
  { id: 'silhouette_wipe', label: 'Silhouette Wipe' },
  { id: 'ink_fade', label: 'Obsidian Fade' },
];

export const FRAME_CATALOG: Array<{ id: FrameMode; label: string }> = [
  { id: 'main', label: 'Main Story' },
  { id: 'nested_story', label: 'Nested Flashback' },
  { id: 'chapter_title', label: 'Chapter Title Card' },
  { id: 'moral_card', label: 'Closing Moral Card' },
  { id: 'end_screen', label: 'YouTube End Screen' },
];

export const CROWD_CATALOG: Array<{ id: CrowdId; label: string }> = [
  { id: 'none', label: 'No Crowd' },
  { id: 'courtiers', label: 'Royal Courtiers' },
  { id: 'villagers', label: 'Village Folk' },
  { id: 'army', label: 'Epic Army & Spears' },
  { id: 'forest_herd', label: 'Forest Herd' },
  { id: 'monks', label: 'Sages & Monks' },
];

export const CAMERA_MOVE_CATALOG: Array<{ id: CameraMoveId; label: string }> = [
  { id: 'still', label: 'Default Drift' },
  { id: 'slow_push', label: 'Slow Push-In' },
  { id: 'slow_pull', label: 'Slow Pull-Out' },
  { id: 'pan_left', label: 'Pan Left' },
  { id: 'pan_right', label: 'Pan Right' },
  { id: 'impact_shake', label: 'Impact Shake' },
];

export const MOTION_LIST: MotionId[] = [
  'still',
  'enter_left',
  'enter_right',
  'cross_stage',
  'step_forward',
  'retreat',
  'leap_arc',
];

export const RAAG_CATALOG: Array<{ id: RaagId; label: string; vibe: string }> = [
  { id: 'bhairavi', label: 'Raag Bhairavi', vibe: 'Nocturnal Indian folklore & pathos' },
  { id: 'yaman', label: 'Raag Yaman', vibe: 'Noble durbar & devotion' },
  { id: 'marwa', label: 'Raag Marwa', vibe: 'Eerie tension & twilight' },
  { id: 'darbari', label: 'Raag Darbari', vibe: 'Solemn royal court & epic weight' },
  { id: 'bhoopali', label: 'Raag Bhoopali', vibe: 'Playful wit & Panchatantra' },
  { id: 'malkauns', label: 'Raag Malkauns', vibe: 'Deep midnight mystery & Yaksha riddles' },
  { id: 'desh', label: 'Raag Desh', vibe: 'Lively folk satire & monsoon tales' },
  { id: 'greek_lyre', label: 'Greek Lyre & Frame Drum', vibe: 'Aeolian kithara pluck for Aesop & Olympus' },
  { id: 'medieval_lute', label: 'Medieval Lute & Harp', vibe: 'Dorian woodland ballad for Grimm & Knights' },
  { id: 'guqin_bamboo', label: 'Guqin & Shakuhachi', vibe: 'East Asian pentatonic silk strings & bamboo flute' },
  { id: 'gamelan_wayang', label: 'Javanese Gamelan', vibe: 'Shimmering bronze Pelog metallophones & Wayang gong' },
  { id: 'cedar_flute', label: 'Cedar Flute & Canyon Drum', vibe: 'Americas warm wood-flute & steady heartbeat tom' },
  { id: 'kora_griot', label: 'African Kora & Talking Drum', vibe: 'West African 21-string harp & gliding djembe pulse' },
];

export const EXPRESSION_LIST: ExpressionId[] = [
  'calm',
  'warm',
  'joy',
  'curious',
  'awe',
  'sly',
  'shocked',
  'grief',
  'stern',
  'angry',
];

export const EXPRESSION_CATALOG: Array<{ id: ExpressionId; label: string; note: string }> = [
  { id: 'calm', label: 'Calm / Serene', note: 'Relaxed arched brows, gentle expression' },
  { id: 'warm', label: 'Warm / Kind', note: 'Friendly soft smile & warm eyes' },
  { id: 'joy', label: 'Joy / Happy', note: 'Bright smiling eyes & cheerful smile' },
  { id: 'curious', label: 'Curious / Thinking', note: 'One raised inquisitive brow & alert gaze' },
  { id: 'awe', label: 'Awe / Wonder', note: 'Lifted brows, luminous starry eyes' },
  { id: 'sly', label: 'Sly / Mischievous', note: 'Playful raised brow & crooked smirk' },
  { id: 'shocked', label: 'Shocked / Alarmed', note: 'High brows, wide eyes & O-mouth' },
  { id: 'grief', label: 'Sad / Worried', note: 'Upturned inner brows & downcast eyes' },
  { id: 'stern', label: 'Stern / Focused', note: 'Composed straight brows, serious focus' },
  { id: 'angry', label: 'Angry / Fierce', note: 'V-furrowed brows & fierce intense gaze' },
];

export function normalizeExpressionId(raw: unknown): ExpressionId {
  const norm = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (EXPRESSION_LIST.includes(norm as ExpressionId)) return norm as ExpressionId;
  if (/angr|furi|rage|wrath|fierce|mad|enrag|scowl|glare|hostil/.test(norm)) return 'angry';
  if (/stern|serious|determin|solemn|firm|stoic|resolut|focus|grave/.test(norm)) return 'stern';
  if (/warm|kind|tender|gentle|lov|affection|fond|friendly|compassion|sooth/.test(norm)) return 'warm';
  if (/joy|happy|laugh|smile|delight|triumph|proud|cheer|elated|glee/.test(norm)) return 'joy';
  if (/curio|think|ponder|wonder_?ing|puzzl|question|inquisit|thoughtful|intrig/.test(norm)) return 'curious';
  if (/awe|amaz|marvel|rever|enchant|mesmer|starry|magic/.test(norm)) return 'awe';
  if (/sly|smug|cunn|trick|mischiev|grin|sneak|wicked|clever|playful|teas/.test(norm)) return 'sly';
  if (/shock|surpris|fear|scare|alarm|gasp|terrifi|panick|startl|astonish/.test(norm)) return 'shocked';
  if (/grief|sad|cry|sorrow|weep|mourn|despair|regret|worr|anxious|tired|hurt|heartbroken/.test(norm)) return 'grief';
  return 'calm';
}

/**
 * Deterministically maps a spoken phrase inside `dialogue` to a 60fps frame index within a beat,
 * weighting spoken character length plus natural punctuation pauses (em-dash, comma, exclamation, etc.).
 * Optionally adds a human reaction lag (e.g. +12 frames / 0.2s) for listening characters.
 */
export function computePhraseTriggerFrame(
  dialogue: string,
  phrase: string,
  beatDuration: number,
  reactionLagFrames = 0
): number | null {
  const cleanDlg = String(dialogue || '').trim();
  const cleanPhrase = String(phrase || '').trim();
  if (!cleanDlg || !cleanPhrase) return null;

  const lowerDlg = cleanDlg.toLowerCase();
  const lowerPhrase = cleanPhrase.toLowerCase().replace(/^["'“”]+|["'“”]+$/g, '').trim();
  if (!lowerPhrase) return null;

  let matchIdx = lowerDlg.indexOf(lowerPhrase);
  if (matchIdx < 0) {
    // Fallback: match first distinctive Unicode token(s) of phrase (supports Latin, Indic, Arabic & CJK)
    const tokens = lowerPhrase
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 2);
    if (tokens.length > 0) {
      for (let len = Math.min(tokens.length, 3); len >= 1 && matchIdx < 0; len--) {
        const probe = tokens.slice(0, len).join(' ');
        const idx = lowerDlg.indexOf(probe);
        if (idx >= 0) matchIdx = idx;
      }
    }
  }
  if (matchIdx < 0) return null;

  // Build cumulative spoken-weight curve across characters (includes Latin, Indic, Arabic & CJK pauses)
  const weights: number[] = new Array(cleanDlg.length + 1).fill(0);
  let acc = 0;
  for (let i = 0; i < cleanDlg.length; i++) {
    const ch = cleanDlg[i];
    if (/[—–]/.test(ch)) acc += 5.5;
    else if (/[.!?।。！？؟]/.test(ch)) acc += 5.0;
    else if (/[,;:、،؛]/.test(ch)) acc += 3.0;
    else if (/\s/.test(ch)) acc += 0.6;
    else acc += 1.0;
    weights[i + 1] = acc;
  }
  const totalWeight = Math.max(1, acc);
  const progress = Math.max(0, Math.min(0.95, weights[matchIdx] / totalWeight));
  // Spoken speech occupies roughly 5%..92% of beat duration (subtle lead-in and tail breath)
  const spokenT = Math.max(1.2, beatDuration) * (0.04 + progress * 0.86);
  const totalFrames = Math.max(1, Math.round(Math.max(1.2, beatDuration) * STUDIO_FPS));
  const rawFrame = Math.round(spokenT * STUDIO_FPS) + reactionLagFrames;
  return Math.max(0, Math.min(totalFrames - 1, rawFrame));
}

function keyframeTimeSec(
  kf: ExpressionKeyframe,
  beatDuration: number,
  dialogue?: string,
  reactionLagFrames = 0
): number {
  const dur = Math.max(1.2, beatDuration);
  if (typeof kf.frame === 'number' && Number.isFinite(kf.frame)) {
    return Math.max(0, kf.frame / STUDIO_FPS);
  }
  if (typeof kf.timeSec === 'number' && Number.isFinite(kf.timeSec)) {
    return Math.max(0, kf.timeSec);
  }
  if (typeof kf.at === 'number' && Number.isFinite(kf.at)) {
    return Math.max(0, Math.min(1, kf.at)) * dur;
  }
  if (kf.triggerPhrase && dialogue) {
    const aligned = computePhraseTriggerFrame(dialogue, kf.triggerPhrase, dur, reactionLagFrames);
    if (aligned !== null) return aligned / STUDIO_FPS;
  }
  return 0;
}

/**
 * Deterministically resolves a character's active facial expression at an exact beat-local
 * timestamp / frame, honoring the system-wide expressions toggle, per-actor expressionTrack,
 * beat-level expressionCues, phrase triggers, and bounded `frame..endFrame` sets of frames.
 */
export function resolveActorExpressionAtTime(
  actor: ActorPlacement,
  beat: Pick<StoryBeat, 'duration' | 'expressionCues'> & Partial<Pick<StoryBeat, 'dialogue' | 'speakerId'>>,
  localT: number,
  expressionsEnabled = true
): ExpressionId {
  if (!expressionsEnabled) return 'calm';

  const isListener = Boolean(beat.speakerId && beat.speakerId !== 'narrator' && beat.speakerId !== actor.castId);
  const lag = isListener ? 12 : 0;

  const combined: Array<{ t: number; endT?: number; expression: ExpressionId; order: number }> = [];
  let ord = 0;

  if (Array.isArray(actor.expressionTrack)) {
    for (const kf of actor.expressionTrack) {
      if (!kf || !kf.expression) continue;
      combined.push({
        t: keyframeTimeSec(kf, beat.duration, beat.dialogue, lag),
        endT:
          typeof kf.endFrame === 'number' && Number.isFinite(kf.endFrame) && kf.endFrame >= 0
            ? kf.endFrame / STUDIO_FPS
            : undefined,
        expression: normalizeExpressionId(kf.expression),
        order: ord++,
      });
    }
  }

  if (Array.isArray(beat.expressionCues)) {
    for (const cue of beat.expressionCues) {
      if (!cue || cue.castId !== actor.castId || !cue.expression) continue;
      combined.push({
        t: keyframeTimeSec(cue, beat.duration, beat.dialogue, lag),
        endT:
          typeof cue.endFrame === 'number' && Number.isFinite(cue.endFrame) && cue.endFrame >= 0
            ? cue.endFrame / STUDIO_FPS
            : undefined,
        expression: normalizeExpressionId(cue.expression),
        order: ord++,
      });
    }
  }

  if (combined.length === 0) {
    return normalizeExpressionId(actor.expression);
  }

  combined.sort((a, b) => (a.t !== b.t ? a.t - b.t : a.order - b.order));
  const baseExpr: ExpressionId = normalizeExpressionId(actor.expression);
  let resolved: ExpressionId = baseExpr;
  const epsT = Math.max(0, localT) + 0.002;

  for (let i = 0; i < combined.length; i++) {
    const item = combined[i];
    if (item.t <= epsT) {
      const next = combined[i + 1];
      // If this cue has an explicit endFrame and we have passed it (with no newer cue active yet), revert cleanly to baseExpr
      if (item.endT !== undefined && localT > item.endT + 0.002 && (!next || next.t > epsT)) {
        resolved = baseExpr;
      } else {
        resolved = item.expression;
      }
    } else {
      break;
    }
  }
  return resolved;
}
export const POSE_LIST: PoseId[] = [
  'stand',
  'walk',
  'sit',
  'kneel',
  'recoil',
  'gesture',
  'hang_upside_down',
  'soar',
  'attack',
];
export const WEATHER_LIST: WeatherId[] = ['fireflies', 'embers', 'rain', 'mist', 'petals', 'none'];
export const FX_LIST: FxId[] = [
  'none',
  'shock_burst',
  'question_mark',
  'smear_swoop',
  'crimson_impact',
  'divine_aura',
];

export const SFX_CATALOG: Array<{ id: SfxId; label: string; note: string }> = [
  { id: 'none', label: 'No SFX', note: 'Pure Raag & dialogue' },
  { id: 'temple_bell', label: 'Temple Bell', note: 'Resonant brass ghanta chime' },
  { id: 'shankha_conch', label: 'Shankha Conch', note: 'Epic battlefield & sacred conch' },
  { id: 'sword_clash', label: 'Sword Unsheathe / Clash', note: 'Metallic steel ring' },
  { id: 'thunder_crack', label: 'Storm Thunder', note: 'Dramatic midnight lightning rumble' },
  { id: 'arrow_whoosh', label: 'Arrow / Leap Whoosh', note: 'High-speed wind sweep' },
  { id: 'mystic_chime', label: 'Mystic Reveal Chime', note: 'Shimmering boon / twist arpeggio' },
  { id: 'court_gasp', label: 'Durbar Impact Hit', note: 'Low drama drum & crowd swell' },
  { id: 'wooden_gavel', label: 'Verdict Strike', note: 'Sharp court judgment double knock' },
  { id: 'fire_crackle', label: 'Havan Fire Burst', note: 'Sacred flame crackle & flare' },
];

// =========================================================================
// =========================================================================
// 20 DETERMINISTIC MULTI-GENRE ART ENGINES + VISUAL VARIATION LEVERS
// =========================================================================
export const RENDER_STYLE_CATALOG: Array<{
  id: RenderStyleId;
  category: RenderStyleCategory;
  label: string;
  shortLabel: string;
  note: string;
  bestFor: string;
}> = [
  // Editorial, Anime & Explainers (5)
  {
    id: 'chiaroscuro',
    category: 'Editorial, Anime & Explainers',
    label: 'Chiaroscuro Graphic Novel',
    shortLabel: 'Chiaroscuro',
    note: 'Bold ink contours, deep indigo shadows & golden rim-light (Default)',
    bestFor: 'Drama · History · Graphic Storytelling',
  },
  {
    id: 'lineless_vector',
    category: 'Editorial, Anime & Explainers',
    label: 'Lineless Geometric Vector',
    shortLabel: 'Editorial Vector',
    note: 'Zero black ink outlines, crisp flat color planes & atmospheric depth',
    bestFor: 'Science Explainers · Essays · Modern Epics',
  },
  {
    id: 'anime_cel',
    category: 'Editorial, Anime & Explainers',
    label: 'Sakuga Anime Cel',
    shortLabel: 'Anime Cel',
    note: 'Crisp 3-tone cel shadows, luminous sky gradients & glowing rim bloom',
    bestFor: 'Anime Storytime · Action · Sci-Fi Drama',
  },
  {
    id: 'gouache_storybook',
    category: 'Editorial, Anime & Explainers',
    label: 'Matte Editorial Gouache',
    shortLabel: 'Matte Gouache',
    note: 'Velvety opaque matte brushwork with warm magazine-illustration finish',
    bestFor: 'Psychology · Philosophy · TED-Ed Essays',
  },
  {
    id: 'risograph_print',
    category: 'Editorial, Anime & Explainers',
    label: '3-Plate Risograph Print',
    shortLabel: 'Risograph Print',
    note: 'Soy-ink plate separation, sub-pixel misregistration, Ben-Day halftone & 12fps',
    bestFor: 'Satire · Pop Culture · Indie Shorts',
  },

  // Tactile & Handcrafted (5)
  {
    id: 'felt_puppet',
    category: 'Tactile & Handcrafted',
    label: 'Stitched Felt Puppetry',
    shortLabel: 'Felt Puppet',
    note: 'Layered wool-felt texture, dashed blanket-stitch seams & tapered pencil arcs',
    bestFor: 'Cozy Fables · Kids & Family · Bedtime Stories',
  },
  {
    id: 'papercraft_diorama',
    category: 'Tactile & Handcrafted',
    label: '2.5D Paper-Craft Diorama',
    shortLabel: 'Paper Diorama',
    note: 'Stacked matte cardstock depth planes, cut-paper edge rims & cast shadows',
    bestFor: 'Animal Fables · Nature · Craft Explainers',
  },
  {
    id: 'backlit_sand',
    category: 'Tactile & Handcrafted',
    label: 'Backlit Kinetic Sand',
    shortLabel: 'Backlit Sand',
    note: 'Warm amber lightbox backlighting, sculpted dark sand & mineral stipple',
    bestFor: 'Flashbacks · Desert Legends · Meditative Tales',
  },
  {
    id: 'woodblock_print',
    category: 'Tactile & Handcrafted',
    label: 'Carved Relief Woodblock',
    shortLabel: 'Woodblock Print',
    note: 'Heavy carved ink lines, engraving hatching & 4-ink cotton paper print',
    bestFor: 'Court Wit · Satire · Folk Chronicles',
  },
  {
    id: 'shadow_puppetry',
    category: 'Tactile & Handcrafted',
    label: 'Backlit Shadow Puppetry',
    shortLabel: 'Shadow Puppet',
    note: 'Backlit oil-lamp parchment scrim, pierced filigree & articulated pins',
    bestFor: 'Riddles · Nested Tales · Wayang & Folklore',
  },

  // Mystery, Manga & Sci-Fi (4)
  {
    id: 'manga_screentone',
    category: 'Mystery, Manga & Sci-Fi',
    label: 'Monochrome Manga Screentone',
    shortLabel: 'Manga Tone',
    note: 'High-contrast G-pen ink, halftone screentone dots, speedlines & crimson pop',
    bestFor: 'Mysteries · True Stories · High-Stakes Drama',
  },
  {
    id: 'scratchboard_noir',
    category: 'Mystery, Manga & Sci-Fi',
    label: 'Inverted Clay Scratchboard',
    shortLabel: 'Scratchboard',
    note: 'Pitch-black India-ink board carved with luminous ivory & gold hatch strokes',
    bestFor: 'Thrillers · Supernatural · Dark Suspense',
  },
  {
    id: 'blueprint_technical',
    category: 'Mystery, Manga & Sci-Fi',
    label: 'Architectural Technical Blueprint',
    shortLabel: 'Tech Blueprint',
    note: 'Prussian-blue cyanotype grid, crisp white-ink schematics & registration marks',
    bestFor: 'Engineering · Tech · Finance · How-It-Works',
  },
  {
    id: 'neon_cybernoir',
    category: 'Mystery, Manga & Sci-Fi',
    label: 'Cyber-Noir Neon',
    shortLabel: 'Cyber-Noir',
    note: 'Nocturnal neon cyan/magenta rims, subtle RGB chromatic edge split & wet glow',
    bestFor: 'AI & Tech · Cyberpunk · Urban Legends',
  },

  // World Heritage & Epics (6)
  {
    id: 'byzantine_mosaic',
    category: 'World Heritage & Epics',
    label: 'Gilded Tesserae Mosaic',
    shortLabel: 'Gold Mosaic',
    note: 'Grout-separated ceramic & gold-smalti mosaic tiles with ornamental arch frame',
    bestFor: 'Ancient History · Sacred Epics · Chapter Openers',
  },
  {
    id: 'stained_glass',
    category: 'World Heritage & Epics',
    label: 'Stained Glass Cloisonné',
    shortLabel: 'Stained Glass',
    note: 'Faceted jewel-tone Voronoi mosaic sky, gilded lead lines & light shafts',
    bestFor: 'Divine Reveals · Cathedral Myths · Puranas',
  },
  {
    id: 'sumi_e_wash',
    category: 'World Heritage & Epics',
    label: 'Sumi-e Ink Wash Scroll',
    shortLabel: 'Sumi-e Scroll',
    note: 'Rice-paper ink-wash mist, soft charcoal brushwork & cinnabar red chop seal',
    bestFor: 'East Asian Epics · Zen Philosophy · Martial Tales',
  },
  {
    id: 'greek_amphora',
    category: 'World Heritage & Epics',
    label: 'Greek Amphora Terracotta',
    shortLabel: 'Greek Amphora',
    note: 'Classical Attic red-figure terracotta clay, obsidian silhouettes & meander frieze',
    bestFor: 'Aesop’s Fables · Classical Antiquity · Odyssey',
  },
  {
    id: 'kente_tapestry',
    category: 'World Heritage & Epics',
    label: 'Kente & Ndebele Tapestry',
    shortLabel: 'Kente Tapestry',
    note: 'Woven African loom texture, vibrant ochre/cobalt rims & geometric Kente border',
    bestFor: 'Anansi · African Griot & Savanna Legends',
  },
  {
    id: 'illuminated_codex',
    category: 'World Heritage & Epics',
    label: 'Illuminated Medieval Codex',
    shortLabel: 'Gilded Codex',
    note: 'Aged vellum manuscript, sepia iron-gall ink & 24k gilded knotwork frame',
    bestFor: 'Medieval History · Grimm · Arthurian & Norse',
  },
];

export function getRecommendedRenderStyle(episode: Pick<EpisodeScript, 'series' | 'shelf'>): RenderStyleId {
  const s = episode.series.toLowerCase();
  if (s.includes('aesop') || s.includes('greek') || s.includes('odyssey')) return 'greek_amphora';
  if (s.includes('grimm') || s.includes('arthur') || s.includes('celtic') || s.includes('norse')) return 'illuminated_codex';
  if (s.includes('journey to the west') || s.includes('japanese') || s.includes('chinese') || s.includes('momotaro')) return 'sumi_e_wash';
  if (s.includes('anansi') || s.includes('african') || s.includes('sunjata')) return 'kente_tapestry';
  if (s.includes('kancil') || s.includes('wayang') || s.includes('javanese')) return 'shadow_puppetry';
  if (s.includes('raven') || s.includes('coyote') || s.includes('indigenous') || s.includes('mayan')) return 'lineless_vector';
  if (s.includes('kathasarit')) return 'shadow_puppetry';
  if (s.includes('ramayana') || s.includes('mahabharata')) return 'lineless_vector';
  if (s.includes('purana') || s.includes('shakti')) return 'stained_glass';
  if (s.includes('tenali') || s.includes('birbal') || s.includes('akbar') || s.includes('gopal')) {
    return 'woodblock_print';
  }
  if (s.includes('panchatantra') || s.includes('hitopadesha') || s.includes('jataka')) {
    return 'papercraft_diorama';
  }
  if (s.includes('quantum') || s.includes('explainer') || s.includes('blueprint')) return 'blueprint_technical';
  if (s.includes('sector 9') || s.includes('cyber') || s.includes('neon')) return 'neon_cybernoir';
  if (s.includes('casebook') || s.includes('detective') || s.includes('manga')) return 'manga_screentone';
  if (s.includes('thimblewood') || s.includes('lantern') || s.includes('puppet')) return 'felt_puppet';
  if (episode.shelf === 'Modern Multi-Genre Showcases') return 'blueprint_technical';
  if (episode.shelf === 'Western Folklore & Fables') return 'greek_amphora';
  if (episode.shelf === 'East Asian Tales & Epics') return 'sumi_e_wash';
  if (episode.shelf === 'Southeast Asian Folklore') return 'shadow_puppetry';
  if (episode.shelf === 'Americas & Indigenous Legends') return 'lineless_vector';
  if (episode.shelf === 'African Griot & Trickster Tales') return 'kente_tapestry';
  if (episode.shelf === 'Animal Fables & Strategy') return 'papercraft_diorama';
  if (episode.shelf === 'Royal Court Wit & Satire') return 'woodblock_print';
  if (episode.shelf === 'Sacred Epics & Puranas') return 'lineless_vector';
  return 'chiaroscuro';
}

export const DEFAULT_VISUAL_STYLE: EpisodeVisualStyle = {
  renderStyle: 'chiaroscuro',
  lookPreset: 'classic_chiaroscuro',
  colorGrade: 'default',
  texture: 'clean',
  shadowContrast: 1.0,
  inkWeight: 1.0,
  rimLight: 'auto',
  captionStyle: 'classic_cinema',
  frameBorder: 'clean_letterbox',
  vignette: 0.3,
  motionCadence: 'auto',
  motionProfile: 'auto',
  postFxPass: 'none',
  expressionsEnabled: true,
  karaokeCaptions: true,
  autoTrackSpeaker: true,
  depthOfField: 0.35,
  lightShafts: 0.4,
  spatialAudio: true,
};

export const LOOK_PRESETS: Array<{
  id: LookPresetId;
  label: string;
  note: string;
  style: EpisodeVisualStyle;
}> = [
  {
    id: 'classic_chiaroscuro',
    label: 'Classic Chiaroscuro',
    note: 'Signature default graphic-novel look',
    style: { ...DEFAULT_VISUAL_STYLE },
  },
  {
    id: 'gilded_epic',
    label: 'Gilded Epic',
    note: 'Warm saffron gold & filigree — Ramayana / Mahabharata',
    style: {
      renderStyle: 'chiaroscuro',
      lookPreset: 'gilded_epic',
      colorGrade: 'warm_gold',
      texture: 'cinema_35mm',
      shadowContrast: 1.12,
      inkWeight: 1.15,
      rimLight: 'gold',
      captionStyle: 'gold_manuscript',
      frameBorder: 'gold_filigree',
      vignette: 0.42,
    },
  },
  {
    id: 'sunlit_storybook',
    label: 'Sunlit Fable',
    note: 'Softer shadows & parchment — Panchatantra / Jataka',
    style: {
      renderStyle: 'papercraft_diorama',
      lookPreset: 'sunlit_storybook',
      colorGrade: 'emerald_fable',
      texture: 'parchment_grain',
      shadowContrast: 0.78,
      inkWeight: 0.9,
      rimLight: 'gold',
      captionStyle: 'classic_cinema',
      frameBorder: 'clean_letterbox',
      vignette: 0.22,
    },
  },
  {
    id: 'moonlit_noir',
    label: 'Moonlit Noir',
    note: 'Deep indigo contrast & silver rim — Vikram & Betaal',
    style: {
      renderStyle: 'chiaroscuro',
      lookPreset: 'moonlit_noir',
      colorGrade: 'indigo_noir',
      texture: 'woodblock_halftone',
      shadowContrast: 1.28,
      inkWeight: 1.32,
      rimLight: 'moon_silver',
      captionStyle: 'shorts_bold_pop',
      frameBorder: 'clean_letterbox',
      vignette: 0.62,
    },
  },
  {
    id: 'palm_leaf_manuscript',
    label: 'Palm-Leaf Classic',
    note: 'Sepia parchment & margin frame — Puranas / Hitopadesha',
    style: {
      renderStyle: 'woodblock_print',
      lookPreset: 'palm_leaf_manuscript',
      colorGrade: 'sepia_manuscript',
      texture: 'palm_leaf_fibers',
      shadowContrast: 0.92,
      inkWeight: 0.85,
      rimLight: 'gold',
      captionStyle: 'gold_manuscript',
      frameBorder: 'manuscript_margin',
      vignette: 0.48,
    },
  },
];

export const COLOR_GRADE_CATALOG: Array<{ id: ColorGradeId; label: string }> = [
  { id: 'default', label: 'Default (Mood Native)' },
  { id: 'warm_gold', label: 'Warm Saffron Gold' },
  { id: 'indigo_noir', label: 'Deep Indigo Noir' },
  { id: 'vermilion_royal', label: 'Royal Vermilion' },
  { id: 'emerald_fable', label: 'Emerald Storybook' },
  { id: 'sepia_manuscript', label: 'Sepia Palm-Leaf' },
];

export const TEXTURE_CATALOG: Array<{ id: SurfaceTextureId; label: string }> = [
  { id: 'clean', label: 'Clean Graphic Ink' },
  { id: 'parchment_grain', label: 'Handmade Parchment' },
  { id: 'palm_leaf_fibers', label: 'Palm-Leaf Fibers' },
  { id: 'woodblock_halftone', label: 'Woodblock Halftone' },
  { id: 'cinema_35mm', label: '35mm Cinema Grain' },
];

export const RIM_LIGHT_CATALOG: Array<{ id: RimLightId; label: string; hex: string | null }> = [
  { id: 'auto', label: 'Auto (Mood Rim)', hex: null },
  { id: 'gold', label: 'Temple Gold', hex: '#ffd452' },
  { id: 'moon_silver', label: 'Moonlight Silver', hex: '#cfe4ff' },
  { id: 'fire_crimson', label: 'Crimson Fire', hex: '#ff425e' },
  { id: 'divine_cyan', label: 'Celestial Cyan', hex: '#6ef2ff' },
  { id: 'none', label: 'Off', hex: '' },
];

export const CAPTION_STYLE_CATALOG: Array<{ id: CaptionStyleId; label: string }> = [
  { id: 'classic_cinema', label: 'Classic Cinema Bar' },
  { id: 'gold_manuscript', label: 'Gold Manuscript Plate' },
  { id: 'shorts_bold_pop', label: 'Shorts Bold Pop' },
  { id: 'minimal_clean', label: 'Minimal Clean' },
  { id: 'comic_speech_pop', label: 'Comic Speech Pop' },
  { id: 'minimal_editorial', label: 'Minimal Editorial' },
];

export const FRAME_BORDER_CATALOG: Array<{ id: FrameBorderId; label: string }> = [
  { id: 'clean_letterbox', label: 'Classic Cinema Bars' },
  { id: 'gold_filigree', label: 'Gilded Filigree Frame' },
  { id: 'manuscript_margin', label: 'Manuscript Border' },
  { id: 'full_bleed', label: 'Full Bleed (No Bars)' },
];

export const CAST_MARK_CATALOG: Array<{ id: CastMarkId; label: string }> = [
  { id: 'default', label: 'Archetype Default' },
  { id: 'none', label: 'Clean Face' },
  { id: 'vermilion_tilak', label: 'Vermilion Tilak' },
  { id: 'tripundra_ash', label: 'Shiva Tripundra Ash' },
  { id: 'royal_mustache', label: 'Royal Mustache' },
  { id: 'full_beard', label: 'Sage / Noble Beard' },
  { id: 'divine_halo', label: 'Golden Divine Halo' },
];

export const CAST_HEADGEAR_CATALOG: Array<{ id: CastHeadgearId; label: string }> = [
  { id: 'default', label: 'Archetype Default' },
  { id: 'none', label: 'No Extra Headgear' },
  { id: 'royal_turban', label: 'Royal Pagri Turban' },
  { id: 'golden_mukut', label: 'Golden Epic Mukut' },
  { id: 'sage_topknot', label: 'Rishi Jata Topknot' },
  { id: 'battle_helm', label: 'Warrior Battle Helm' },
];

export function resolveVisualStyle(partial?: Partial<EpisodeVisualStyle>): EpisodeVisualStyle {
  if (!partial) return { ...DEFAULT_VISUAL_STYLE };
  return {
    renderStyle: partial.renderStyle || DEFAULT_VISUAL_STYLE.renderStyle,
    lookPreset: partial.lookPreset || DEFAULT_VISUAL_STYLE.lookPreset,
    colorGrade: partial.colorGrade || DEFAULT_VISUAL_STYLE.colorGrade,
    texture: partial.texture || DEFAULT_VISUAL_STYLE.texture,
    shadowContrast:
      typeof partial.shadowContrast === 'number' && Number.isFinite(partial.shadowContrast)
        ? Math.max(0.6, Math.min(1.4, partial.shadowContrast))
        : DEFAULT_VISUAL_STYLE.shadowContrast,
    inkWeight:
      typeof partial.inkWeight === 'number' && Number.isFinite(partial.inkWeight)
        ? Math.max(0.7, Math.min(1.5, partial.inkWeight))
        : DEFAULT_VISUAL_STYLE.inkWeight,
    rimLight: partial.rimLight || DEFAULT_VISUAL_STYLE.rimLight,
    captionStyle: partial.captionStyle || DEFAULT_VISUAL_STYLE.captionStyle,
    frameBorder: partial.frameBorder || DEFAULT_VISUAL_STYLE.frameBorder,
    vignette:
      typeof partial.vignette === 'number' && Number.isFinite(partial.vignette)
        ? Math.max(0, Math.min(1, partial.vignette))
        : DEFAULT_VISUAL_STYLE.vignette,
    motionCadence:
      partial.motionCadence === 'auto' ||
      partial.motionCadence === '60fps' ||
      partial.motionCadence === '24fps' ||
      partial.motionCadence === '12fps'
        ? partial.motionCadence
        : DEFAULT_VISUAL_STYLE.motionCadence,
    motionProfile:
      partial.motionProfile === 'auto' ||
      partial.motionProfile === 'cinematic_drama' ||
      partial.motionProfile === 'naturalistic' ||
      partial.motionProfile === 'snappy_cartoon' ||
      partial.motionProfile === 'motion_graphics'
        ? partial.motionProfile
        : DEFAULT_VISUAL_STYLE.motionProfile,
    postFxPass:
      partial.postFxPass === 'none' ||
      partial.postFxPass === 'bayer_dither' ||
      partial.postFxPass === 'pixel_grid_16bit' ||
      partial.postFxPass === 'crisp_outline' ||
      partial.postFxPass === 'chromatic_pop' ||
      partial.postFxPass === 'halftone_zine'
        ? partial.postFxPass
        : DEFAULT_VISUAL_STYLE.postFxPass,
    expressionsEnabled:
      typeof partial.expressionsEnabled === 'boolean'
        ? partial.expressionsEnabled
        : DEFAULT_VISUAL_STYLE.expressionsEnabled,
    karaokeCaptions:
      typeof partial.karaokeCaptions === 'boolean'
        ? partial.karaokeCaptions
        : DEFAULT_VISUAL_STYLE.karaokeCaptions,
    autoTrackSpeaker:
      typeof partial.autoTrackSpeaker === 'boolean'
        ? partial.autoTrackSpeaker
        : DEFAULT_VISUAL_STYLE.autoTrackSpeaker,
    depthOfField:
      typeof partial.depthOfField === 'number' && Number.isFinite(partial.depthOfField)
        ? Math.max(0, Math.min(1, partial.depthOfField))
        : DEFAULT_VISUAL_STYLE.depthOfField,
    lightShafts:
      typeof partial.lightShafts === 'number' && Number.isFinite(partial.lightShafts)
        ? Math.max(0, Math.min(1, partial.lightShafts))
        : DEFAULT_VISUAL_STYLE.lightShafts,
    spatialAudio:
      typeof partial.spatialAudio === 'boolean'
        ? partial.spatialAudio
        : DEFAULT_VISUAL_STYLE.spatialAudio,
  };
}

export const ARCHETYPE_DEFAULT_COLORS: Record<
  ArchetypeId,
  { primary: string; accent: string; skin?: string }
> = {
  deva: { primary: '#d97b16', accent: '#ffd954', skin: '#6ca4d9' },
  goddess: { primary: '#c9183c', accent: '#ffd954', skin: '#edb186' },
  demon_king: { primary: '#2b1224', accent: '#ff2b45', skin: '#544a63' },
  vanara_hero: { primary: '#e65c19', accent: '#ffd452', skin: '#d68f5c' },
  spirit: { primary: '#1d2747', accent: '#ff173d', skin: '#cfe2f7' },
  yaksha: { primary: '#114a57', accent: '#6ef2ff', skin: '#9adce8' },
  statue_apsara: { primary: '#d99a26', accent: '#fff0a6', skin: '#f5cb5c' },
  king: { primary: '#d91a36', accent: '#ffd04d', skin: '#e09a6e' },
  emperor: { primary: '#6b1236', accent: '#ffd452', skin: '#d89b72' },
  queen: { primary: '#a61c5c', accent: '#ffd452', skin: '#e6a882' },
  sage: { primary: '#d96c1f', accent: '#ffe380', skin: '#d19269' },
  courtier: { primary: '#1f7a68', accent: '#ffd452', skin: '#d9986c' },
  warrior: { primary: '#264d8f', accent: '#f5bf38', skin: '#d99268' },
  ascetic: { primary: '#2b1945', accent: '#ff3855', skin: '#c4b8c9' },
  merchant: { primary: '#8c6239', accent: '#f0c24b', skin: '#d4956b' },
  child: { primary: '#2e7d62', accent: '#ffd452', skin: '#e3a57d' },
  elder_woman: { primary: '#8c3b52', accent: '#f2e4c9', skin: '#cc8f68' },
  guard: { primary: '#3d4c6b', accent: '#f5bf38', skin: '#cf8e67' },
  monkey: { primary: '#9c5b34', accent: '#ffd04d', skin: '#d99e75' },
  lion: { primary: '#d68a24', accent: '#ff3b30', skin: '#e8ad4a' },
  tiger: { primary: '#e86f1c', accent: '#ffd04d', skin: '#f28735' },
  bull: { primary: '#d6cfc2', accent: '#f5bf38', skin: '#e8e2d5' },
  hare: { primary: '#d4c8b8', accent: '#ff8da1', skin: '#ebe1d5' },
  jackal: { primary: '#7a4f38', accent: '#6be5b8', skin: '#b37a56' },
  serpent: { primary: '#1b6e4d', accent: '#ffd04d', skin: '#2d8a64' },
  elephant: { primary: '#56647a', accent: '#f5d26b', skin: '#6b7a94' },
  deer: { primary: '#d49a2a', accent: '#fff0a6', skin: '#f0ba48' },
  crow: { primary: '#1c2438', accent: '#f5be38', skin: '#25304a' },
  crane: { primary: '#e8eef5', accent: '#f5a623', skin: '#f5f8fc' },
  crocodile: { primary: '#2b5e40', accent: '#f5c242', skin: '#397852' },
  tortoise: { primary: '#4a6b3d', accent: '#d9a441', skin: '#6e8c58' },
  owl: { primary: '#6e4c36', accent: '#ffd147', skin: '#946b4d' },
  mouse: { primary: '#706b7a', accent: '#f5a3b5', skin: '#948fa1' },
  dog: { primary: '#8c5d38', accent: '#ffd04d', skin: '#b88256' },
  fox: { primary: '#d95b26', accent: '#fff4de', skin: '#eb7438' },
  wolf: { primary: '#4d586b', accent: '#ffd866', skin: '#6b788f' },
  spider: { primary: '#1a1829', accent: '#ffd04d', skin: '#2a2640' },
  knight: { primary: '#2d4b82', accent: '#f2c85b', skin: '#dfb18c' },
  samurai: { primary: '#9e1b2c', accent: '#ffd04d', skin: '#e6b894' },
  raven: { primary: '#161b2e', accent: '#56e8ff', skin: '#202842' },
};

export function getEpisodeDuration(ep: EpisodeScript): number {
  return ep.beats.reduce((sum, b) => sum + Math.max(1.2, b.duration), 0);
}

export function getEpisodeTotalFrames(ep: EpisodeScript, fps = STUDIO_FPS): number {
  const safeFps = Number.isFinite(fps) && fps > 0 ? Math.round(fps) : STUDIO_FPS;
  return Math.max(1, Math.round(getEpisodeDuration(ep) * safeFps));
}

export interface ResolvedBeatActionState {
  actorPoseOverrides: Record<string, PoseId>;
  actorMotionOverrides: Record<string, MotionId>;
  cameraPunch: number; // 0 .. 1 damped impulse
  propPulse: number; // 0 .. 1 damped impulse
  fxOverride: FxId | null;
  activeSfx: SfxId | null;
  activeSfxOffsetSec: number | null;
}

export interface ResolvedBeatActionSfxEvent {
  cueIndex: number;
  sfx: SfxId;
  startFrame: number;
  offsetSec: number;
}

export function resolveActionCueStartFrame(
  cue: BeatActionCue,
  dialogue: string,
  dur: number,
  totalFrames: number
): number {
  if (typeof cue.frame === 'number' && Number.isFinite(cue.frame)) {
    return Math.max(0, Math.round(cue.frame));
  }
  if (typeof cue.timeSec === 'number' && Number.isFinite(cue.timeSec)) {
    return Math.max(0, Math.round(cue.timeSec * STUDIO_FPS));
  }
  if (typeof cue.at === 'number' && Number.isFinite(cue.at)) {
    return Math.max(0, Math.round(Math.max(0, Math.min(1, cue.at)) * totalFrames));
  }
  if (cue.triggerPhrase && dialogue) {
    const aligned = computePhraseTriggerFrame(dialogue, cue.triggerPhrase, dur, 0);
    if (aligned !== null) return aligned;
  }
  return 0;
}

/**
 * Resolves all sub-beat action cue SFX triggers to exact frame-locked beat-local offsets.
 * Shared by both live KathaAudioEngine playback and OfflineAudioContext WAV mixdown.
 */
export function resolveBeatActionSfxEvents(
  beat: Pick<StoryBeat, 'duration' | 'dialogue' | 'actionCues'>
): ResolvedBeatActionSfxEvent[] {
  const cues = beat.actionCues;
  if (!Array.isArray(cues) || cues.length === 0) return [];

  const dur = Math.max(1.2, Number.isFinite(beat.duration) ? beat.duration : 4);
  const totalFrames = Math.max(1, Math.round(dur * STUDIO_FPS));
  const out: ResolvedBeatActionSfxEvent[] = [];

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    if (!cue?.sfx || cue.sfx === 'none') continue;
    const startFrame = Math.min(totalFrames, resolveActionCueStartFrame(cue, beat.dialogue || '', dur, totalFrames));
    const offsetSec = Math.max(0, Math.min(dur - 0.08, startFrame / STUDIO_FPS));
    out.push({ cueIndex: i, sfx: cue.sfx, startFrame, offsetSec });
  }

  out.sort((a, b) => (a.startFrame !== b.startFrame ? a.startFrame - b.startFrame : a.cueIndex - b.cueIndex));
  return out;
}

/**
 * Pure O(1) Stateless Sub-Beat Action Cue Resolver.
 * Evaluates declarative `beat.actionCues` at an exact integer `localFrame` (60fps)
 * so mid-beat pose switches, camera punches, prop highlights, and FX bursts scrub
 * instantaneously with zero stateful generator replay.
 */
export function resolveBeatActionStateAtFrame(
  beat: Pick<StoryBeat, 'duration' | 'dialogue' | 'actionCues'>,
  localFrame: number
): ResolvedBeatActionState {
  const state: ResolvedBeatActionState = {
    actorPoseOverrides: {},
    actorMotionOverrides: {},
    cameraPunch: 0,
    propPulse: 0,
    fxOverride: null,
    activeSfx: null,
    activeSfxOffsetSec: null,
  };

  const cues = beat.actionCues;
  if (!Array.isArray(cues) || cues.length === 0) return state;

  const dur = Math.max(1.2, Number.isFinite(beat.duration) ? beat.duration : 4);
  const totalFrames = Math.max(1, Math.round(dur * STUDIO_FPS));
  const f = Math.max(0, Math.min(totalFrames, Math.round(localFrame)));

  const resolved = cues.map((cue, order) => {
    const startFrame = resolveActionCueStartFrame(cue, beat.dialogue || '', dur, totalFrames);
    const endFrame =
      typeof cue.endFrame === 'number' && Number.isFinite(cue.endFrame) && cue.endFrame >= startFrame
        ? Math.round(cue.endFrame)
        : undefined;
    return { cue, startFrame, endFrame, order };
  });

  resolved.sort((a, b) => (a.startFrame !== b.startFrame ? a.startFrame - b.startFrame : a.order - b.order));

  for (const { cue, startFrame, endFrame } of resolved) {
    if (f < startFrame) continue;
    const elapsed = f - startFrame;
    const withinRange = endFrame === undefined || f <= endFrame;

    if (withinRange && cue.castId) {
      if (cue.pose) state.actorPoseOverrides[cue.castId] = cue.pose;
      if (cue.motion) state.actorMotionOverrides[cue.castId] = cue.motion;
    }

    if (typeof cue.cameraPunch === 'number' && cue.cameraPunch > 0 && elapsed < 22) {
      const env = Math.sin(Math.min(1, elapsed / 4) * Math.PI * 0.5) * Math.exp(-elapsed / 7.5);
      state.cameraPunch = Math.max(state.cameraPunch, Math.min(1, cue.cameraPunch) * env);
    }

    if (typeof cue.propPulse === 'number' && cue.propPulse > 0 && elapsed < 30) {
      const env = Math.sin(Math.min(1, elapsed / 5) * Math.PI * 0.5) * Math.exp(-elapsed / 10);
      state.propPulse = Math.max(state.propPulse, Math.min(1, cue.propPulse) * env);
    }

    if (cue.fx && cue.fx !== 'none') {
      const fxWindowEnd = endFrame ?? startFrame + 42;
      if (f <= fxWindowEnd) {
        state.fxOverride = cue.fx;
      }
    }

    if (cue.sfx && cue.sfx !== 'none' && elapsed <= 45) {
      state.activeSfx = cue.sfx;
      state.activeSfxOffsetSec = startFrame / STUDIO_FPS;
    }
  }

  return state;
}

/**
 * Generates a copy-pasteable AI Director System Prompt so ANY external LLM
 * (Gemini, Claude, GPT) can author deterministic full-chapter JSON scripts across Indian & World Folklore.
 */
export function buildAiDirectorPrompt(): string {
  return `You are an Episode & Full-Chapter Director for "Katha Studio", a deterministic 10-Engine 2D Graphic-Novel Machinima Studio for Public-Domain World Folklore, Fables & Epics (Indian Epics & Folklore, Aesop's Fables, Grimm's Fairy Tales, Greek & Norse Myths, Journey to the West, Japanese Folktales, Southeast Asian Sang Kancil & Wayang, Indigenous American Raven/Coyote & Mesoamerican Myths, and West African Anansi & Griot Legends).

Return ONLY valid JSON matching this EpisodeScript schema (no markdown fences):
{
  "id": "slug",
  "series": "Storybook Name (e.g. Ramayana | Mahabharata | Puranas | Panchatantra | Vikram & Betaal | Singhasan Battisi | Hitopadesha | Jataka Tales | Tenali Rama | Akbar & Birbal | Gopal Bhar | Kathasaritsagara | Aesop's Fables | Grimm's Fairy Tales | Journey to the West | Sang Kancil Folklore | Indigenous Legends | Anansi the Spider)",
  "shelf": "Modern Multi-Genre Showcases | Supernatural & Royal Legends | Animal Fables & Strategy | Royal Court Wit & Satire | Sacred Epics & Puranas | Western Folklore & Fables | East Asian Tales & Epics | Southeast Asian Folklore | Americas & Indigenous Legends | African Griot & Trickster Tales",
  "title": "Chapter / Episode Title",
  "subtitle": "Short evocative tagline",
  "defaultRaag": "${RAAG_CATALOG.map((r) => r.id).join(' | ')}",
  "visualStyle": {
    "lookPreset": "${LOOK_PRESETS.map((l) => l.id).join(' | ')}",
    "colorGrade": "${COLOR_GRADE_CATALOG.map((c) => c.id).join(' | ')}",
    "texture": "${TEXTURE_CATALOG.map((t) => t.id).join(' | ')}",
    "shadowContrast": 1.0,
    "inkWeight": 1.0,
    "rimLight": "${RIM_LIGHT_CATALOG.map((r) => r.id).join(' | ')}",
    "captionStyle": "${CAPTION_STYLE_CATALOG.map((c) => c.id).join(' | ')}",
    "frameBorder": "${FRAME_BORDER_CATALOG.map((f) => f.id).join(' | ')}",
    "renderStyle": "${RENDER_STYLE_CATALOG.map((r) => r.id).join(' | ')}",
    "motionProfile": "${MOTION_PROFILE_CATALOG.map((p) => p.id).join(' | ')}",
    "vignette": 0.3
  },
  "cast": [
    {
      "id": "short_id",
      "name": "Display Name",
      "archetype": "${ARCHETYPE_CATALOG.map((a) => a.id).join(' | ')}",
      "primaryColor": "#hex garment/fur color",
      "accentColor": "#hex trim/crown/eye color",
      "skinColor": "#hex optional skin/fur tone",
      "mark": "${CAST_MARK_CATALOG.map((m) => m.id).join(' | ')}",
      "headgear": "${CAST_HEADGEAR_CATALOG.map((h) => h.id).join(' | ')}",
      "scale": 1.0
    }
  ],
  "beats": [
    {
      "id": "b1",
      "title": "Short Scene Label",
      "duration": 4.2,
      "frame": "${FRAME_CATALOG.map((f) => f.id).join(' | ')}",
      "renderStyle": "optional per-beat override: ${RENDER_STYLE_CATALOG.map((r) => r.id).join(' | ')}",
      "stage": "${STAGE_CATALOG.map((s) => s.id).join(' | ')}",
      "mood": "${MOOD_CATALOG.map((m) => m.id).join(' | ')}",
      "crowd": "${CROWD_CATALOG.map((c) => c.id).join(' | ')}",
      "cameraMove": "${CAMERA_MOVE_CATALOG.map((c) => c.id).join(' | ')}",
      "flipStage": false,
      "haze": 0,
      "backdropZoom": 1.0,
      "weather": "${WEATHER_LIST.join(' | ')}",
      "shot": "${SHOT_CATALOG.map((s) => s.id).join(' | ')}",
      "transition": "${TRANSITION_CATALOG.map((t) => t.id).join(' | ')}",
      "lightSide": "left | right",
      "prop": "${PROP_CATALOG.map((p) => p.id).join(' | ')}",
      "propSlot": "left | center | right | overhead",
      "fx": "${FX_LIST.join(' | ')}",
      "sfx": "${SFX_CATALOG.map((x) => x.id).join(' | ')}",
      "raag": "${RAAG_CATALOG.map((r) => r.id).join(' | ')}",
      "musicEnergy": 0.65,
      "actors": [
        {
          "castId": "matches cast[].id",
          "slot": "left | center | right | overhead",
          "pose": "${POSE_LIST.join(' | ')}",
          "expression": "${EXPRESSION_LIST.join(' | ')}",
          "expressionTrack": [
            { "frame": 0, "endFrame": 120, "expression": "curious", "reason": "weighing the speaker's claim" },
            { "frame": 120, "endFrame": 240, "triggerPhrase": "key turning words", "expression": "shocked", "reason": "reacts to sudden reveal" }
          ],
          "facing": "left | right",
          "motion": "${MOTION_LIST.join(' | ')}"
        }
      ],
      "expressionCues": [
        { "frame": 0, "endFrame": 110, "castId": "castId", "expression": "calm", "reason": "opening composure" },
        { "frame": 110, "endFrame": 240, "castId": "castId", "triggerPhrase": "spoken turn", "expression": "joy", "reason": "delighted realization" }
      ],
      "speakerId": "castId or narrator",
      "speakerLabel": "Speaker Name",
      "dialogue": "Punchy spoken line (10-18 words for crisp pacing)"
    }
  ]
}

FULL-CHAPTER DETERMINISTIC DIRECTING RULES:
- Match the tradition's signature "renderStyle" & "defaultRaag": chiaroscuro (Vikram & Betaal), lineless_vector (Ramayana/Mahabharata/Indigenous), papercraft_diorama (Panchatantra/Jataka/Hitopadesha), woodblock_print (Tenali/Birbal/Gopal Bhar), stained_glass (Puranas), shadow_puppetry (Kathasaritsagara/Sang Kancil), greek_amphora (Aesop), illuminated_codex (Grimm/Arthur), sumi_e_wash (Journey to the West/East Asia), kente_tapestry (Anansi/African Griot).
- EXPRESSION COMPREHENSION & SUBTEXT: Understand what EVERY on-stage character (both speaker AND silent listener!) feels across each set of frames. Account for dramatic irony (a flatterer feels "sly" while the listener shifts "curious -> joy"). Default friendly/narrative beats to "calm", "warm", "curious", "joy", or "awe"; reserve "angry" strictly for genuine rage/fury. Anchor mid-beat shifts with "triggerPhrase" (exact 2-4 spoken words from dialogue) and/or 60fps "frame"/"endFrame" plus a brief "reason"!
- Structure every episode with punchy 8-18 word spoken dialogue lines (zero narration dumps), alternate shots every beat (never repeat the same shot twice in a row), pair "cameraMove" + actor "motion" on beats >= 4.0s, punctuate key turns with "sfx", and close with a crisp "frame": "moral_card" wisdom epigram.
- Differentiate recurring archetypes with cast "primaryColor", "skinColor", "mark", "headgear", and "scale", and toggle "flipStage": true or "haze" when visiting rival kingdoms or return journeys.
- Use "crowd" ("courtiers", "army", "villagers", "forest_herd", "monks") on wide durbars, bazaars, and epic battlefields.
- 12 ANIMATION PRINCIPLES CRAFT: Choose a matching "visualStyle.motionProfile" (auto | cinematic_drama | naturalistic | snappy_cartoon | motion_graphics) and optional "visualStyle.postFxPass" (none | bayer_dither | pixel_grid_16bit | crisp_outline | chromatic_pop | halftone_zine), contrast short snappy action beats (2.6–3.4s) against slower emotional holds (4.4–5.6s), telegraph big payoffs with anticipation beats, and layer secondary atmospheric motion (weather + props + asymmetric poses) so characters never mirror each other like twins.
- SUB-BEAT CHOREOGRAPHY & KINETIC CARDS: You may add optional "actionCues": [{ "triggerPhrase": "key words", "castId": "hero", "pose": "attack", "cameraPunch": 0.7, "propPulse": 0.8 }] for multi-step timing inside a beat, and use "shot": "motion_card" with "motionCard": { "layout": "hero_stat | split_callout | morph_bar", "kicker": "...", "headline": "...", "metric": "99%", "bullets": ["..."] } for crisp explainer/title motion-graphics beats.`;
}

/**
 * Validates and sanitizes arbitrary AI-generated JSON into a guaranteed-safe EpisodeScript.
 */
export function validateEpisodeScript(raw: unknown): { ok: true; script: EpisodeScript } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Root JSON must be an EpisodeScript object.' };
  }
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.cast) || obj.cast.length === 0) {
    return { ok: false, error: 'EpisodeScript must contain a non-empty "cast" array.' };
  }
  if (!Array.isArray(obj.beats) || obj.beats.length === 0) {
    return { ok: false, error: 'EpisodeScript must contain a non-empty "beats" array.' };
  }

  const validArchetypes = new Set(ARCHETYPE_CATALOG.map((a) => a.id));
  const validStages = new Set(STAGE_CATALOG.map((s) => s.id));
  const validMoods = new Set(MOOD_CATALOG.map((m) => m.id));
  const validProps = new Set(PROP_CATALOG.map((p) => p.id));
  const validShots = new Set(SHOT_CATALOG.map((s) => s.id));
  const validTrans = new Set(TRANSITION_CATALOG.map((t) => t.id));
  const validRaags = new Set(RAAG_CATALOG.map((r) => r.id));
  const validFrames = new Set(FRAME_CATALOG.map((f) => f.id));
  const validCrowds = new Set(CROWD_CATALOG.map((c) => c.id));
  const validCameraMoves = new Set(CAMERA_MOVE_CATALOG.map((c) => c.id));
  const validMarks = new Set(CAST_MARK_CATALOG.map((m) => m.id));
  const validHeadgear = new Set(CAST_HEADGEAR_CATALOG.map((h) => h.id));
  const validLookPresets = new Set(LOOK_PRESETS.map((l) => l.id));
  const validGrades = new Set(COLOR_GRADE_CATALOG.map((g) => g.id));
  const validTextures = new Set(TEXTURE_CATALOG.map((t) => t.id));
  const validRimLights = new Set(RIM_LIGHT_CATALOG.map((r) => r.id));
  const validCaptionStyles = new Set(CAPTION_STYLE_CATALOG.map((c) => c.id));
  const validFrameBorders = new Set(FRAME_BORDER_CATALOG.map((f) => f.id));
  const validRenderStyles = new Set(RENDER_STYLE_CATALOG.map((r) => r.id));
  const validSfx = new Set(SFX_CATALOG.map((x) => x.id));
  const validAmbience = new Set(AMBIENCE_CATALOG.map((a) => a.id));
  const validPropAnchors = new Set(PROP_ANCHOR_CATALOG.map((p) => p.id));

  const cast: CastMember[] = obj.cast.map((c: unknown, i: number) => {
    const item = (c && typeof c === 'object' ? c : {}) as Record<string, unknown>;
    const arch = validArchetypes.has(item.archetype as ArchetypeId)
      ? (item.archetype as ArchetypeId)
      : 'courtier';
    const fallback = ARCHETYPE_DEFAULT_COLORS[arch];
    const scaleNum = Number(item.scale);
    const baseMember: CastMember = {
      id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `char_${i + 1}`,
      name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : `Character ${i + 1}`,
      archetype: arch,
      primaryColor: typeof item.primaryColor === 'string' ? item.primaryColor : fallback.primary,
      accentColor: typeof item.accentColor === 'string' ? item.accentColor : fallback.accent,
      skinColor: typeof item.skinColor === 'string' ? item.skinColor : fallback.skin,
      mark: validMarks.has(item.mark as CastMarkId) ? (item.mark as CastMarkId) : undefined,
      headgear: validHeadgear.has(item.headgear as CastHeadgearId)
        ? (item.headgear as CastHeadgearId)
        : undefined,
      scale:
        Number.isFinite(scaleNum) && scaleNum > 0
          ? Math.max(0.82, Math.min(1.25, scaleNum))
          : undefined,
    };
    const validatedDna = item.dna ? validateAndNormalizeDna(item.dna, baseMember) : undefined;
    return validatedDna ? { ...baseMember, dna: validatedDna } : baseMember;
  });

  const castIds = new Set(cast.map((c) => c.id));

  const beats: StoryBeat[] = obj.beats.map((b: unknown, i: number) => {
    const item = (b && typeof b === 'object' ? b : {}) as Record<string, unknown>;
    const actorsRaw = Array.isArray(item.actors) ? item.actors : [];
    const actors: ActorPlacement[] = actorsRaw
      .map((a: unknown): ActorPlacement | null => {
        if (!a || typeof a !== 'object') return null;
        const ao = a as Record<string, unknown>;
        const cid = typeof ao.castId === 'string' && castIds.has(ao.castId) ? ao.castId : cast[0].id;
        const trackRaw = Array.isArray(ao.expressionTrack) ? ao.expressionTrack : [];
        const expressionTrack: ExpressionKeyframe[] = trackRaw
          .map((kf): ExpressionKeyframe | null => {
            if (!kf || typeof kf !== 'object') return null;
            const ko = kf as Record<string, unknown>;
            const frameNum = Number(ko.frame);
            const endFrameNum = Number(ko.endFrame);
            const timeSecNum = Number(ko.timeSec);
            const atNum = Number(ko.at);
            const out: ExpressionKeyframe = {
              expression: normalizeExpressionId(ko.expression ?? ko.emotion),
            };
            if (ko.frame !== undefined && Number.isFinite(frameNum) && frameNum >= 0) {
              out.frame = Math.round(frameNum);
            } else if (ko.timeSec !== undefined && Number.isFinite(timeSecNum) && timeSecNum >= 0) {
              out.timeSec = Number(Math.min(18, timeSecNum).toFixed(2));
            } else if (ko.at !== undefined && Number.isFinite(atNum)) {
              out.at = Number(Math.max(0, Math.min(1, atNum)).toFixed(3));
            } else if (!ko.triggerPhrase) {
              out.at = 0;
            }
            if (ko.endFrame !== undefined && Number.isFinite(endFrameNum) && endFrameNum >= 0) {
              out.endFrame = Math.round(endFrameNum);
            }
            if (typeof ko.triggerPhrase === 'string' && ko.triggerPhrase.trim()) {
              out.triggerPhrase = ko.triggerPhrase.trim().slice(0, 80);
            }
            if (typeof ko.reason === 'string' && ko.reason.trim()) {
              out.reason = ko.reason.trim().slice(0, 120);
            }
            return out;
          })
          .filter((x): x is ExpressionKeyframe => x !== null);

        const offX = Number(ao.offsetX);
        const offY = Number(ao.offsetY);
        return {
          castId: cid,
          slot: (['left', 'center', 'right', 'overhead'].includes(String(ao.slot))
            ? ao.slot
            : 'left') as ActorPlacement['slot'],
          pose: (POSE_LIST.includes(ao.pose as PoseId) ? ao.pose : 'stand') as PoseId,
          expression: normalizeExpressionId(ao.expression ?? ao.emotion),
          ...(expressionTrack.length > 0 ? { expressionTrack } : {}),
          facing: ao.facing === 'left' ? 'left' : 'right',
          motion: MOTION_LIST.includes(ao.motion as MotionId) ? (ao.motion as MotionId) : 'still',
          ...(Number.isFinite(offX) && offX !== 0
            ? { offsetX: Number(Math.max(-0.35, Math.min(0.35, offX)).toFixed(3)) }
            : {}),
          ...(Number.isFinite(offY) && offY !== 0
            ? { offsetY: Number(Math.max(-0.35, Math.min(0.35, offY)).toFixed(3)) }
            : {}),
        };
      })
      .filter((x): x is ActorPlacement => x !== null);

    const cuesRaw = Array.isArray(item.expressionCues) ? item.expressionCues : [];
    const expressionCues: BeatExpressionCue[] = cuesRaw
      .map((cue): BeatExpressionCue | null => {
        if (!cue || typeof cue !== 'object') return null;
        const co = cue as Record<string, unknown>;
        const cid = typeof co.castId === 'string' && castIds.has(co.castId) ? co.castId : null;
        if (!cid) return null;
        const frameNum = Number(co.frame);
        const endFrameNum = Number(co.endFrame);
        const timeSecNum = Number(co.timeSec);
        const atNum = Number(co.at);
        const out: BeatExpressionCue = {
          castId: cid,
          expression: normalizeExpressionId(co.expression ?? co.emotion),
        };
        if (co.frame !== undefined && Number.isFinite(frameNum) && frameNum >= 0) {
          out.frame = Math.round(frameNum);
        } else if (co.timeSec !== undefined && Number.isFinite(timeSecNum) && timeSecNum >= 0) {
          out.timeSec = Number(Math.min(18, timeSecNum).toFixed(2));
        } else if (co.at !== undefined && Number.isFinite(atNum)) {
          out.at = Number(Math.max(0, Math.min(1, atNum)).toFixed(3));
        } else if (!co.triggerPhrase) {
          out.at = 0;
        }
        if (co.endFrame !== undefined && Number.isFinite(endFrameNum) && endFrameNum >= 0) {
          out.endFrame = Math.round(endFrameNum);
        }
        if (typeof co.triggerPhrase === 'string' && co.triggerPhrase.trim()) {
          out.triggerPhrase = co.triggerPhrase.trim().slice(0, 80);
        }
        if (typeof co.reason === 'string' && co.reason.trim()) {
          out.reason = co.reason.trim().slice(0, 120);
        }
        return out;
      })
      .filter((x): x is BeatExpressionCue => x !== null);

    const actionCuesRaw = Array.isArray(item.actionCues) ? item.actionCues : [];
    const actionCues: BeatActionCue[] = actionCuesRaw
      .map((cue): BeatActionCue | null => {
        if (!cue || typeof cue !== 'object') return null;
        const co = cue as Record<string, unknown>;
        const out: BeatActionCue = {};
        const frameNum = Number(co.frame);
        const endFrameNum = Number(co.endFrame);
        const timeSecNum = Number(co.timeSec);
        const atNum = Number(co.at);
        if (co.frame !== undefined && Number.isFinite(frameNum) && frameNum >= 0) {
          out.frame = Math.round(frameNum);
        } else if (co.timeSec !== undefined && Number.isFinite(timeSecNum) && timeSecNum >= 0) {
          out.timeSec = Number(Math.min(18, timeSecNum).toFixed(2));
        } else if (co.at !== undefined && Number.isFinite(atNum)) {
          out.at = Number(Math.max(0, Math.min(1, atNum)).toFixed(3));
        }
        if (co.endFrame !== undefined && Number.isFinite(endFrameNum) && endFrameNum >= 0) {
          out.endFrame = Math.round(endFrameNum);
        }
        if (typeof co.triggerPhrase === 'string' && co.triggerPhrase.trim()) {
          out.triggerPhrase = co.triggerPhrase.trim().slice(0, 80);
        }
        if (typeof co.castId === 'string' && castIds.has(co.castId)) {
          out.castId = co.castId;
        }
        if (POSE_LIST.includes(co.pose as PoseId)) {
          out.pose = co.pose as PoseId;
        }
        if (MOTION_LIST.includes(co.motion as MotionId)) {
          out.motion = co.motion as MotionId;
        }
        if (co.cameraPunch !== undefined && Number.isFinite(Number(co.cameraPunch))) {
          const punch = Math.max(0, Math.min(1, Number(co.cameraPunch)));
          if (punch > 0) out.cameraPunch = Number(punch.toFixed(2));
        }
        if (co.propPulse !== undefined && Number.isFinite(Number(co.propPulse))) {
          const pulse = Math.max(0, Math.min(1, Number(co.propPulse)));
          if (pulse > 0) out.propPulse = Number(pulse.toFixed(2));
        }
        if (FX_LIST.includes(co.fx as FxId) && co.fx !== 'none') {
          out.fx = co.fx as FxId;
        }
        if (validSfx.has(co.sfx as SfxId) && co.sfx !== 'none') {
          out.sfx = co.sfx as SfxId;
        }
        if (typeof co.label === 'string' && co.label.trim()) {
          out.label = co.label.trim().slice(0, 60);
        }
        const hasAction = Boolean(
          out.pose || out.motion || out.cameraPunch || out.propPulse || out.fx || out.sfx
        );
        return hasAction ? out : null;
      })
      .filter((x): x is BeatActionCue => x !== null);

    let motionCard: MotionCardConfig | undefined;
    if (item.motionCard && typeof item.motionCard === 'object') {
      const mc = item.motionCard as Record<string, unknown>;
      const layout =
        mc.layout === 'hero_stat' || mc.layout === 'split_callout' || mc.layout === 'morph_bar'
          ? mc.layout
          : 'hero_stat';
      const bullets = Array.isArray(mc.bullets)
        ? mc.bullets
            .filter((b): b is string => typeof b === 'string' && b.trim().length > 0)
            .map((b) => b.trim().slice(0, 90))
            .slice(0, 4)
        : undefined;
      motionCard = {
        layout,
        ...(typeof mc.kicker === 'string' && mc.kicker.trim() ? { kicker: mc.kicker.trim().slice(0, 48) } : {}),
        ...(typeof mc.headline === 'string' && mc.headline.trim() ? { headline: mc.headline.trim().slice(0, 96) } : {}),
        ...(typeof mc.metric === 'string' && mc.metric.trim() ? { metric: mc.metric.trim().slice(0, 24) } : {}),
        ...(typeof mc.metricUnit === 'string' && mc.metricUnit.trim()
          ? { metricUnit: mc.metricUnit.trim().slice(0, 32) }
          : {}),
        ...(bullets && bullets.length > 0 ? { bullets } : {}),
        ...(typeof mc.highlightBar === 'string' && mc.highlightBar.trim()
          ? { highlightBar: mc.highlightBar.trim().slice(0, 96) }
          : {}),
        ...(typeof mc.accentColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(mc.accentColor.trim())
          ? { accentColor: mc.accentColor.trim() }
          : {}),
      };
    }

    const dur = Number(item.duration);
    const hazeNum = Number(item.haze);
    const zoomNum = Number(item.backdropZoom);
    return {
      id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `beat_${i + 1}`,
      title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : `Beat ${i + 1}`,
      duration: Number.isFinite(dur) ? Math.min(18, Math.max(1.5, dur)) : 4.0,
      frame: validFrames.has(item.frame as FrameMode) ? (item.frame as FrameMode) : 'main',
      stage: validStages.has(item.stage as StageId) ? (item.stage as StageId) : 'banyan_clearing',
      mood: validMoods.has(item.mood as MoodId) ? (item.mood as MoodId) : 'midnight_banyan',
      crowd: validCrowds.has(item.crowd as CrowdId) ? (item.crowd as CrowdId) : 'none',
      cameraMove: validCameraMoves.has(item.cameraMove as CameraMoveId)
        ? (item.cameraMove as CameraMoveId)
        : 'still',
      cameraFocusX:
        Number.isFinite(Number(item.cameraFocusX)) && Number(item.cameraFocusX) !== 0
          ? Number(Math.max(-0.45, Math.min(0.45, Number(item.cameraFocusX))).toFixed(3))
          : undefined,
      cameraFocusY:
        Number.isFinite(Number(item.cameraFocusY)) && Number(item.cameraFocusY) !== 0
          ? Number(Math.max(-0.3, Math.min(0.3, Number(item.cameraFocusY))).toFixed(3))
          : undefined,
      cameraKeyframes: (() => {
        if (!Array.isArray(item.cameraKeyframes) || item.cameraKeyframes.length === 0) return undefined;
        const parsed: CameraKeyframe[] = [];
        for (const rawKf of item.cameraKeyframes.slice(0, 12)) {
          if (!rawKf || typeof rawKf !== 'object') continue;
          const k = rawKf as Record<string, unknown>;
          const atFrac = Number(k.atFrac);
          const zoom = Number(k.zoom);
          const panX = Number(k.panX);
          const panY = Number(k.panY);
          if (!Number.isFinite(atFrac)) continue;
          const ease: CameraKeyframeEase =
            k.ease === 'linear' || k.ease === 'ease_in_out' || k.ease === 'overshoot'
              ? k.ease
              : 'ease_in_out';
          parsed.push({
            atFrac: Number(Math.max(0, Math.min(1, atFrac)).toFixed(4)),
            zoom: Number(Math.max(0.7, Math.min(2.2, Number.isFinite(zoom) ? zoom : 1)).toFixed(3)),
            panX: Number(Math.max(-0.45, Math.min(0.45, Number.isFinite(panX) ? panX : 0)).toFixed(3)),
            panY: Number(Math.max(-0.35, Math.min(0.35, Number.isFinite(panY) ? panY : 0)).toFixed(3)),
            ease,
          });
        }
        if (parsed.length === 0) return undefined;
        parsed.sort((a, b) => a.atFrac - b.atFrac);
        return parsed;
      })(),
      flipStage: item.flipStage === true ? true : undefined,
      haze: Number.isFinite(hazeNum) && hazeNum > 0 ? Math.max(0, Math.min(1, hazeNum)) : undefined,
      backdropZoom:
        Number.isFinite(zoomNum) && zoomNum > 0 ? Math.max(0.9, Math.min(1.25, zoomNum)) : undefined,
      renderStyle: validRenderStyles.has(item.renderStyle as RenderStyleId)
        ? (item.renderStyle as RenderStyleId)
        : undefined,
      weather: WEATHER_LIST.includes(item.weather as WeatherId) ? (item.weather as WeatherId) : 'fireflies',
      shot: validShots.has(item.shot as ShotId) ? (item.shot as ShotId) : 'wide_stage',
      transition: validTrans.has(item.transition as TransitionId)
        ? (item.transition as TransitionId)
        : 'hard_cut',
      lightSide: item.lightSide === 'left' ? 'left' : 'right',
      prop: validProps.has(item.prop as PropId) ? (item.prop as PropId) : 'none',
      propSlot: (['left', 'center', 'right', 'overhead'].includes(String(item.propSlot))
        ? item.propSlot
        : 'center') as StoryBeat['propSlot'],
      propAnchor: validPropAnchors.has(item.propAnchor as PropAnchorId)
        ? (item.propAnchor as PropAnchorId)
        : undefined,
      propOffsetX:
        Number.isFinite(Number(item.propOffsetX)) && Number(item.propOffsetX) !== 0
          ? Number(Math.max(-0.35, Math.min(0.35, Number(item.propOffsetX))).toFixed(3))
          : undefined,
      propOffsetY:
        Number.isFinite(Number(item.propOffsetY)) && Number(item.propOffsetY) !== 0
          ? Number(Math.max(-0.35, Math.min(0.35, Number(item.propOffsetY))).toFixed(3))
          : undefined,
      customPropDataUrl:
        typeof item.customPropDataUrl === 'string' &&
        item.customPropDataUrl.length <= 5_500_000 &&
        /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(item.customPropDataUrl)
          ? item.customPropDataUrl
          : undefined,
      customPropLabel:
        typeof item.customPropLabel === 'string' ? item.customPropLabel.slice(0, 80) : undefined,
      customBackdropDataUrl:
        typeof item.customBackdropDataUrl === 'string' &&
        item.customBackdropDataUrl.length <= 5_500_000 &&
        /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(item.customBackdropDataUrl)
          ? item.customBackdropDataUrl
          : undefined,
      customBackdropLabel:
        typeof item.customBackdropLabel === 'string'
          ? item.customBackdropLabel.slice(0, 80)
          : undefined,
      fx: FX_LIST.includes(item.fx as FxId) ? (item.fx as FxId) : 'none',
      sfx: validSfx.has(item.sfx as SfxId) ? (item.sfx as SfxId) : 'none',
      sfxOffsetSec:
        Number.isFinite(Number(item.sfxOffsetSec)) && Number(item.sfxOffsetSec) >= 0
          ? Number(Math.min(16, Math.max(0, Number(item.sfxOffsetSec))).toFixed(2))
          : undefined,
      audioLeadSec:
        Number.isFinite(Number(item.audioLeadSec)) && Math.abs(Number(item.audioLeadSec)) >= 0.02
          ? Number(Math.max(-0.6, Math.min(0.6, Number(item.audioLeadSec))).toFixed(2))
          : undefined,
      ambience: validAmbience.has(item.ambience as AmbienceId)
        ? (item.ambience as AmbienceId)
        : undefined,
      raag: validRaags.has(item.raag as RaagId) ? (item.raag as RaagId) : 'bhairavi',
      musicEnergy: Number.isFinite(Number(item.musicEnergy))
        ? Math.min(1, Math.max(0.1, Number(item.musicEnergy)))
        : 0.65,
      actors:
        actors.length > 0
          ? actors
          : [{ castId: cast[0].id, slot: 'center', pose: 'stand', expression: 'calm', facing: 'right', motion: 'still' }],
      ...(expressionCues.length > 0 ? { expressionCues } : {}),
      ...(actionCues.length > 0 ? { actionCues } : {}),
      ...(motionCard ? { motionCard } : {}),
      ...(() => {
        if (!item.locationCard || typeof item.locationCard !== 'object') return {};
        const lc = item.locationCard as Record<string, unknown>;
        const title = typeof lc.title === 'string' ? lc.title.trim().slice(0, 80) : '';
        if (!title) return {};
        const subtitle =
          typeof lc.subtitle === 'string' && lc.subtitle.trim().length > 0
            ? lc.subtitle.trim().slice(0, 90)
            : undefined;
        const position: LocationCardPosition | undefined =
          lc.position === 'top_left' || lc.position === 'bottom_left' || lc.position === 'top_right'
            ? lc.position
            : undefined;
        const style: LocationCardStyle | undefined =
          lc.style === 'cinematic_bar' || lc.style === 'scroll_ribbon' || lc.style === 'minimal_tag'
            ? lc.style
            : undefined;
        const locationCard: LocationCardConfig = {
          title,
          ...(subtitle ? { subtitle } : {}),
          ...(position ? { position } : {}),
          ...(style ? { style } : {}),
        };
        return { locationCard };
      })(),
      speakerId: typeof item.speakerId === 'string' ? item.speakerId : 'narrator',
      speakerLabel: typeof item.speakerLabel === 'string' ? item.speakerLabel : 'Narrator',
      dialogue: typeof item.dialogue === 'string' ? item.dialogue : '',
    };
  });

  const validShelves: StorybookShelf[] = [
    'Modern Multi-Genre Showcases',
    'Supernatural & Royal Legends',
    'Animal Fables & Strategy',
    'Royal Court Wit & Satire',
    'Sacred Epics & Puranas',
    'Western Folklore & Fables',
    'East Asian Tales & Epics',
    'Southeast Asian Folklore',
    'Americas & Indigenous Legends',
    'African Griot & Trickster Tales',
  ];
  const shelf = validShelves.includes(obj.shelf as StorybookShelf)
    ? (obj.shelf as StorybookShelf)
    : undefined;

  let visualStyle: Partial<EpisodeVisualStyle> | undefined;
  if (obj.visualStyle && typeof obj.visualStyle === 'object') {
    const vs = obj.visualStyle as Record<string, unknown>;
    visualStyle = {
      renderStyle: validRenderStyles.has(vs.renderStyle as RenderStyleId)
        ? (vs.renderStyle as RenderStyleId)
        : undefined,
      lookPreset: validLookPresets.has(vs.lookPreset as LookPresetId)
        ? (vs.lookPreset as LookPresetId)
        : undefined,
      colorGrade: validGrades.has(vs.colorGrade as ColorGradeId)
        ? (vs.colorGrade as ColorGradeId)
        : undefined,
      texture: validTextures.has(vs.texture as SurfaceTextureId)
        ? (vs.texture as SurfaceTextureId)
        : undefined,
      shadowContrast: Number.isFinite(Number(vs.shadowContrast))
        ? Math.max(0.6, Math.min(1.4, Number(vs.shadowContrast)))
        : undefined,
      inkWeight: Number.isFinite(Number(vs.inkWeight))
        ? Math.max(0.7, Math.min(1.5, Number(vs.inkWeight)))
        : undefined,
      rimLight: validRimLights.has(vs.rimLight as RimLightId)
        ? (vs.rimLight as RimLightId)
        : undefined,
      captionStyle: validCaptionStyles.has(vs.captionStyle as CaptionStyleId)
        ? (vs.captionStyle as CaptionStyleId)
        : undefined,
      frameBorder: validFrameBorders.has(vs.frameBorder as FrameBorderId)
        ? (vs.frameBorder as FrameBorderId)
        : undefined,
      vignette: Number.isFinite(Number(vs.vignette))
        ? Math.max(0, Math.min(1, Number(vs.vignette)))
        : undefined,
      motionCadence:
        vs.motionCadence === 'auto' ||
        vs.motionCadence === '60fps' ||
        vs.motionCadence === '24fps' ||
        vs.motionCadence === '12fps'
          ? (vs.motionCadence as MotionCadenceId)
          : undefined,
      motionProfile:
        vs.motionProfile === 'auto' ||
        vs.motionProfile === 'cinematic_drama' ||
        vs.motionProfile === 'naturalistic' ||
        vs.motionProfile === 'snappy_cartoon' ||
        vs.motionProfile === 'motion_graphics'
          ? (vs.motionProfile as MotionProfileId)
          : undefined,
      postFxPass:
        vs.postFxPass === 'none' ||
        vs.postFxPass === 'bayer_dither' ||
        vs.postFxPass === 'pixel_grid_16bit' ||
        vs.postFxPass === 'crisp_outline' ||
        vs.postFxPass === 'chromatic_pop' ||
        vs.postFxPass === 'halftone_zine'
          ? (vs.postFxPass as PostFxPassId)
          : undefined,
      expressionsEnabled:
        typeof vs.expressionsEnabled === 'boolean' ? vs.expressionsEnabled : undefined,
      karaokeCaptions:
        typeof vs.karaokeCaptions === 'boolean' ? vs.karaokeCaptions : undefined,
      autoTrackSpeaker:
        typeof vs.autoTrackSpeaker === 'boolean' ? vs.autoTrackSpeaker : undefined,
      depthOfField:
        typeof vs.depthOfField === 'number' && Number.isFinite(vs.depthOfField)
          ? Math.max(0, Math.min(1, vs.depthOfField))
          : undefined,
      lightShafts:
        typeof vs.lightShafts === 'number' && Number.isFinite(vs.lightShafts)
          ? Math.max(0, Math.min(1, vs.lightShafts))
          : undefined,
      spatialAudio:
        typeof vs.spatialAudio === 'boolean' ? vs.spatialAudio : undefined,
    };
  }

  const language =
    typeof obj.language === 'string' && /^[a-z]{2}(?:-[A-Za-z]{2})?$/.test(obj.language.trim())
      ? obj.language.trim().toLowerCase()
      : undefined;

  return {
    ok: true,
    script: {
      id: typeof obj.id === 'string' ? obj.id : 'custom_episode',
      ...(language ? { language } : {}),
      series: typeof obj.series === 'string' ? obj.series : 'Indian Folklore',
      shelf,
      title: typeof obj.title === 'string' ? obj.title : 'Untitled Story',
      subtitle: typeof obj.subtitle === 'string' ? obj.subtitle : '',
      defaultRaag: validRaags.has(obj.defaultRaag as RaagId) ? (obj.defaultRaag as RaagId) : 'bhairavi',
      visualStyle,
      cast,
      beats,
    },
  };
}
