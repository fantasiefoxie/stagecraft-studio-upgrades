import { ACTING_MACRO_CATALOG, ActingMacroId } from './actingMacros';
import { EpisodeScript, RENDER_STYLE_CATALOG, RenderStyleId } from './types';

export type StudioCommandCategory =
  | 'transport'
  | 'scene'
  | 'style'
  | 'acting'
  | 'viewport'
  | 'tools'
  | 'director'
  | 'asset';

export interface StudioCommandItem {
  id: string;
  label: string;
  subtitle?: string;
  category: StudioCommandCategory;
  shortcut?: string;
  keywords?: string[];
  actionType:
    | 'jump_beat'
    | 'set_render_style'
    | 'apply_acting_macro'
    | 'apply_stage'
    | 'apply_mood'
    | 'apply_prop'
    | 'add_archetype'
    | 'toggle_safe_zones'
    | 'toggle_onion_skin'
    | 'toggle_move_mode'
    | 'open_fast_render'
    | 'open_shorts'
    | 'open_qa'
    | 'open_voice_booth'
    | 'open_version_diff'
    | 'apply_j_cuts'
    | 'apply_animation_polish'
    | 'boost_flat_beats'
    | 'auto_tag_locations'
    | 'split_beat';
  payload?: string | number;
}

export interface NleShortcutSpec {
  id: string;
  keys: string;
  label: string;
  category: 'Transport' | 'Timeline' | 'Viewport' | 'Palette';
}

export const NLE_SHORTCUT_CATALOG: NleShortcutSpec[] = [
  { id: 'palette', keys: 'Ctrl/Cmd+K', label: 'Open Command Palette', category: 'Palette' },
  { id: 'play_pause', keys: 'Space', label: 'Play / Pause', category: 'Transport' },
  { id: 'j_rewind', keys: 'J', label: 'Rewind 1 second', category: 'Transport' },
  { id: 'k_pause', keys: 'K', label: 'Pause transport', category: 'Transport' },
  { id: 'l_play', keys: 'L', label: 'Play transport', category: 'Transport' },
  { id: 'prev_scene', keys: '[', label: 'Jump to Previous Scene', category: 'Timeline' },
  { id: 'next_scene', keys: ']', label: 'Jump to Next Scene', category: 'Timeline' },
  { id: 'split_beat', keys: 'Shift+S', label: 'Split Selected Scene', category: 'Timeline' },
  { id: 'safe_zones', keys: 'G', label: 'Toggle Safe Zones Guide', category: 'Viewport' },
  { id: 'onion_skin', keys: 'O', label: 'Toggle Onion-Skin Overlay', category: 'Viewport' },
  { id: 'move_mode', keys: 'M', label: 'Toggle Direct Stage Move Mode', category: 'Viewport' },
];

/**
 * Returns true if the keyboard event originates from a text input, textarea, select, or contentEditable
 * so NLE single-key shortcuts never steal typing.
 */
export function isEditableEventTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') return false;
  const el = target as { tagName?: string; isContentEditable?: boolean };
  const tag = (el.tagName || '').toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return false;
}

/**
 * Builds the deterministic full list of searchable Studio Command Palette items
 * for the current episode (tools, viewport toggles, scenes, all 20 art engines, acting macros).
 */
export function buildStudioCommandRegistry(episode: EpisodeScript): StudioCommandItem[] {
  const items: StudioCommandItem[] = [
    // Viewport & Editing Toggles
    {
      id: 'toggle_safe_zones',
      label: 'Toggle Safe Zones Guide (9:16 / 16:9)',
      subtitle: 'Show or hide title-safe / YouTube Shorts safe overlays',
      category: 'viewport',
      shortcut: 'G',
      keywords: ['safe', 'guides', 'overlay', 'shorts', 'grid'],
      actionType: 'toggle_safe_zones',
    },
    {
      id: 'toggle_onion_skin',
      label: 'Toggle Onion-Skin Animation Ghost',
      subtitle: 'Show previous/next frame ghost silhouettes on stage',
      category: 'viewport',
      shortcut: 'O',
      keywords: ['onion', 'ghost', 'frames', 'animation'],
      actionType: 'toggle_onion_skin',
    },
    {
      id: 'toggle_move_mode',
      label: 'Toggle Direct Stage Move Mode',
      subtitle: 'Drag actors and props directly on the canvas',
      category: 'viewport',
      shortcut: 'M',
      keywords: ['move', 'drag', 'stage', 'blocking', 'actors'],
      actionType: 'toggle_move_mode',
    },
    {
      id: 'split_beat',
      label: 'Split Selected Scene at Midpoint',
      subtitle: 'Cut the current beat cleanly into two consecutive scenes',
      category: 'director',
      shortcut: 'Shift+S',
      keywords: ['split', 'cut', 'razor', 'beat', 'scene'],
      actionType: 'split_beat',
    },
    // Studio Modals & Workflows
    {
      id: 'open_fast_render',
      label: 'Open Fast Render / MP4 Export Modal',
      subtitle: 'Render deterministic WebCodecs / WebM / -14 LUFS audio master',
      category: 'tools',
      keywords: ['export', 'render', 'video', 'mp4', 'webm', 'lufs'],
      actionType: 'open_fast_render',
    },
    {
      id: 'open_shorts',
      label: 'Open Shorts Slicer & Thumbnail Studio',
      subtitle: 'Auto-recommend top vertical Shorts slices & export thumbnails',
      category: 'tools',
      keywords: ['shorts', 'thumbnail', 'vertical', 'youtube', 'clips'],
      actionType: 'open_shorts',
    },
    {
      id: 'open_qa',
      label: 'Open Storyboard QA & Contact Sheet',
      subtitle: 'Inspect frame grid, visual checks & pacing notes',
      category: 'tools',
      keywords: ['qa', 'storyboard', 'contact', 'sheet', 'audit'],
      actionType: 'open_qa',
    },
    {
      id: 'open_voice_booth',
      label: 'Open Voiceover Booth Teleprompter',
      subtitle: 'Full-focus teleprompter with 3-2-1 countdown & multi-take recorder',
      category: 'tools',
      keywords: ['voice', 'booth', 'teleprompter', 'mic', 'record', 'narration'],
      actionType: 'open_voice_booth',
    },
    {
      id: 'open_version_diff',
      label: 'Compare History Checkpoints (Diff)',
      subtitle: 'Inspect scene diffs & cherry-pick individual beats from history',
      category: 'tools',
      keywords: ['diff', 'compare', 'history', 'restore', 'undo', 'snapshot'],
      actionType: 'open_version_diff',
    },
    // One-Click Director Automations
    {
      id: 'apply_j_cuts',
      label: 'Apply Cinematic J-Cuts Across Episode',
      subtitle: 'Pre-roll dialogue audio seamlessly across scene boundaries',
      category: 'director',
      keywords: ['jcut', 'j-cut', 'audio', 'lead', 'dialogue', 'edit'],
      actionType: 'apply_j_cuts',
    },
    {
      id: 'apply_animation_polish',
      label: 'Apply 12-Principles Animation Polish',
      subtitle: 'Enhance beat choreography, anticipation & camera dynamics',
      category: 'director',
      keywords: ['polish', 'animation', '12 principles', 'enhance'],
      actionType: 'apply_animation_polish',
    },
    {
      id: 'boost_flat_beats',
      label: 'Boost Flat Retention Beats',
      subtitle: 'Inject camera motion, reaction cuts & SFX into drop-off zones',
      category: 'director',
      keywords: ['retention', 'pacing', 'boost', 'flat', 'heatmap'],
      actionType: 'boost_flat_beats',
    },
    {
      id: 'auto_tag_locations',
      label: 'Auto-Tag Stage Changes with Location Banners',
      subtitle: 'Add animated lower-third banners whenever the stage backdrop changes',
      category: 'director',
      keywords: ['location', 'banner', 'lower-third', 'title', 'stage'],
      actionType: 'auto_tag_locations',
    },
  ];

  // Jump to Scene commands
  (episode.beats || []).forEach((b, idx) => {
    items.push({
      id: `jump_beat_${idx}`,
      label: `Jump to Scene ${idx + 1}: ${b.title || b.id}`,
      subtitle: `${b.speakerLabel || 'Narrator'} · ${b.shot} · ${b.duration.toFixed(1)}s`,
      category: 'scene',
      keywords: ['scene', 'beat', 'jump', b.id, b.speakerLabel || '', b.stage],
      actionType: 'jump_beat',
      payload: idx,
    });
  });

  // Switch Art Engine (all 20 engines)
  for (const rs of RENDER_STYLE_CATALOG) {
    items.push({
      id: `style_${rs.id}`,
      label: `Art Engine: ${rs.label}`,
      subtitle: rs.note,
      category: 'style',
      keywords: ['art', 'style', 'engine', rs.id, rs.shortLabel],
      actionType: 'set_render_style',
      payload: rs.id as RenderStyleId,
    });
  }

  // Acting & Choreography Macros
  for (const macro of ACTING_MACRO_CATALOG) {
    items.push({
      id: `macro_${macro.id}`,
      label: `Acting Macro: ${macro.label}`,
      subtitle: macro.summary,
      category: 'acting',
      keywords: ['acting', 'macro', 'choreography', macro.id, macro.category],
      actionType: 'apply_acting_macro',
      payload: macro.id as ActingMacroId,
    });
  }

  return items;
}

/**
 * Pure deterministic fuzzy search ranker (exact prefix > substring > ordered subsequence).
 */
export function filterStudioCommands(
  commands: StudioCommandItem[],
  query: string,
  limit = 40
): StudioCommandItem[] {
  const q = (query || '').trim().toLowerCase();
  if (!q) return commands.slice(0, limit);

  const tokens = q.split(/\s+/).filter(Boolean);
  const scored: Array<{ item: StudioCommandItem; score: number }> = [];

  for (const item of commands) {
    const labelL = item.label.toLowerCase();
    const subL = (item.subtitle || '').toLowerCase();
    const kwL = (item.keywords || []).join(' ').toLowerCase();
    const haystack = `${labelL} ${subL} ${kwL} ${item.category}`;

    let totalScore = 0;
    let matchedAll = true;

    for (const tok of tokens) {
      if (labelL.startsWith(tok)) {
        totalScore += 100;
      } else if (labelL.includes(tok)) {
        totalScore += 65;
      } else if (kwL.includes(tok)) {
        totalScore += 45;
      } else if (subL.includes(tok)) {
        totalScore += 30;
      } else {
        // Ordered character subsequence match
        let hi = 0;
        let ti = 0;
        while (hi < haystack.length && ti < tok.length) {
          if (haystack[hi] === tok[ti]) ti++;
          hi++;
        }
        if (ti === tok.length) {
          totalScore += 14;
        } else {
          matchedAll = false;
          break;
        }
      }
    }

    if (matchedAll) {
      scored.push({ item, score: totalScore });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label));
  return scored.slice(0, limit).map((s) => s.item);
}
