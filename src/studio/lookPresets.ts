/**
 * Stagecraft Studio — Custom "Look Lab" Series Recipe Presets
 *
 * Save, name, duplicate, export, and import lightweight JSON Look Recipes
 * (`renderStyle`, `colorGrade`, `rimLight`, `postFxPass`, `motionCadence`,
 * `motionProfile`, `inkWeight`, `captionStyle`, `depthOfField`, `autoTrackSpeaker`)
 * in localStorage and inside portable `.katha` archives.
 */

import {
  CAPTION_STYLE_CATALOG,
  COLOR_GRADE_CATALOG,
  DEFAULT_VISUAL_STYLE,
  MOTION_CADENCE_CATALOG,
  MOTION_PROFILE_CATALOG,
  POST_FX_PASS_CATALOG,
  RENDER_STYLE_CATALOG,
  RIM_LIGHT_CATALOG,
  type CaptionStyleId,
  type ColorGradeId,
  type EpisodeVisualStyle,
  type MotionCadenceId,
  type MotionProfileId,
  type PostFxPassId,
  type RenderStyleId,
  type RimLightId,
} from './types';

export const LOOK_RECIPES_STORAGE_KEY = 'stagecraft_look_lab_recipes_v1';

export interface LookLabRecipeStyle {
  renderStyle: RenderStyleId;
  colorGrade: ColorGradeId;
  rimLight: RimLightId;
  postFxPass: PostFxPassId;
  motionCadence: MotionCadenceId;
  motionProfile: MotionProfileId;
  inkWeight: number;
  captionStyle: CaptionStyleId;
  depthOfField: number;
  autoTrackSpeaker: boolean;
}

export interface LookLabRecipe {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  notes?: string;
  style: LookLabRecipeStyle;
}

const VALID_RENDER_STYLES = new Set<string>(RENDER_STYLE_CATALOG.map((s) => s.id));
const VALID_COLOR_GRADES = new Set<string>(COLOR_GRADE_CATALOG.map((s) => s.id));
const VALID_RIM_LIGHTS = new Set<string>(RIM_LIGHT_CATALOG.map((s) => s.id));
const VALID_POST_FX = new Set<string>(POST_FX_PASS_CATALOG.map((s) => s.id));
const VALID_CADENCES = new Set<string>(MOTION_CADENCE_CATALOG.map((s) => s.id));
const VALID_PROFILES = new Set<string>(MOTION_PROFILE_CATALOG.map((s) => s.id));
const VALID_CAPTIONS = new Set<string>(CAPTION_STYLE_CATALOG.map((s) => s.id));

export function extractLookRecipeStyle(
  style: Partial<EpisodeVisualStyle> | undefined
): LookLabRecipeStyle {
  const s = style || {};
  return {
    renderStyle: VALID_RENDER_STYLES.has(String(s.renderStyle))
      ? (s.renderStyle as RenderStyleId)
      : DEFAULT_VISUAL_STYLE.renderStyle,
    colorGrade: VALID_COLOR_GRADES.has(String(s.colorGrade))
      ? (s.colorGrade as ColorGradeId)
      : DEFAULT_VISUAL_STYLE.colorGrade,
    rimLight: VALID_RIM_LIGHTS.has(String(s.rimLight))
      ? (s.rimLight as RimLightId)
      : DEFAULT_VISUAL_STYLE.rimLight,
    postFxPass: VALID_POST_FX.has(String(s.postFxPass))
      ? (s.postFxPass as PostFxPassId)
      : DEFAULT_VISUAL_STYLE.postFxPass || 'none',
    motionCadence: VALID_CADENCES.has(String(s.motionCadence))
      ? (s.motionCadence as MotionCadenceId)
      : DEFAULT_VISUAL_STYLE.motionCadence || 'auto',
    motionProfile: VALID_PROFILES.has(String(s.motionProfile))
      ? (s.motionProfile as MotionProfileId)
      : DEFAULT_VISUAL_STYLE.motionProfile || 'auto',
    inkWeight:
      typeof s.inkWeight === 'number' && Number.isFinite(s.inkWeight)
        ? Number(Math.max(0.7, Math.min(1.5, s.inkWeight)).toFixed(2))
        : DEFAULT_VISUAL_STYLE.inkWeight,
    captionStyle: VALID_CAPTIONS.has(String(s.captionStyle))
      ? (s.captionStyle as CaptionStyleId)
      : DEFAULT_VISUAL_STYLE.captionStyle,
    depthOfField:
      typeof s.depthOfField === 'number' && Number.isFinite(s.depthOfField)
        ? Number(Math.max(0, Math.min(1, s.depthOfField)).toFixed(2))
        : DEFAULT_VISUAL_STYLE.depthOfField ?? 0.35,
    autoTrackSpeaker:
      typeof s.autoTrackSpeaker === 'boolean'
        ? s.autoTrackSpeaker
        : DEFAULT_VISUAL_STYLE.autoTrackSpeaker ?? true,
  };
}

export function sanitizeLookRecipe(raw: unknown): LookLabRecipe | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const name = typeof obj.name === 'string' ? obj.name.trim().slice(0, 64) : '';
  if (!name) return null;
  const styleRaw =
    obj.style && typeof obj.style === 'object'
      ? (obj.style as Partial<EpisodeVisualStyle>)
      : (obj as Partial<EpisodeVisualStyle>);
  const now = Date.now();
  const id =
    typeof obj.id === 'string' && obj.id.trim()
      ? obj.id.trim().slice(0, 64)
      : `look_${now}_${Math.abs(name.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7))}`;
  return {
    id,
    name,
    createdAt: typeof obj.createdAt === 'number' && Number.isFinite(obj.createdAt) ? obj.createdAt : now,
    updatedAt: typeof obj.updatedAt === 'number' && Number.isFinite(obj.updatedAt) ? obj.updatedAt : now,
    ...(typeof obj.notes === 'string' && obj.notes.trim() ? { notes: obj.notes.trim().slice(0, 140) } : {}),
    style: extractLookRecipeStyle(styleRaw),
  };
}

export function createLookRecipe(
  name: string,
  style: Partial<EpisodeVisualStyle>,
  notes?: string
): LookLabRecipe {
  const now = Date.now();
  const cleanName = name.trim().slice(0, 64) || 'Custom Series Look';
  const slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 28);
  return {
    id: `look_${slug || 'custom'}_${now.toString(36)}`,
    name: cleanName,
    createdAt: now,
    updatedAt: now,
    ...(notes?.trim() ? { notes: notes.trim().slice(0, 140) } : {}),
    style: extractLookRecipeStyle(style),
  };
}

export function duplicateLookRecipe(recipe: LookLabRecipe): LookLabRecipe {
  const now = Date.now();
  const copyName = recipe.name.endsWith(' Copy')
    ? `${recipe.name} 2`
    : `${recipe.name} Copy`;
  return {
    ...recipe,
    id: `${recipe.id}_copy_${now.toString(36)}`,
    name: copyName.slice(0, 64),
    createdAt: now,
    updatedAt: now,
    style: { ...recipe.style },
  };
}

export function loadLookRecipes(): LookLabRecipe[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOOK_RECIPES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => sanitizeLookRecipe(item))
      .filter((r): r is LookLabRecipe => r !== null);
  } catch {
    return [];
  }
}

export function saveLookRecipes(recipes: LookLabRecipe[]): LookLabRecipe[] {
  const clean = recipes
    .map((r) => sanitizeLookRecipe(r))
    .filter((r): r is LookLabRecipe => r !== null)
    .slice(0, 48);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(LOOK_RECIPES_STORAGE_KEY, JSON.stringify(clean));
    } catch {
      // ignore storage quota errors
    }
  }
  return clean;
}

export function mergeLookRecipes(
  existing: LookLabRecipe[],
  incoming: LookLabRecipe[]
): LookLabRecipe[] {
  const byId = new Map<string, LookLabRecipe>();
  for (const r of existing) byId.set(r.id, r);
  for (const r of incoming) byId.set(r.id, r);
  return Array.from(byId.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function exportLookRecipesJson(recipes: LookLabRecipe[]): string {
  return JSON.stringify(
    {
      schema: 'stagecraft_look_lab_v1',
      exportedAt: new Date().toISOString(),
      recipes,
    },
    null,
    2
  );
}

export function importLookRecipesJson(
  jsonText: string
): { ok: true; recipes: LookLabRecipe[] } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(jsonText);
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.recipes)
        ? parsed.recipes
        : parsed && typeof parsed === 'object'
          ? [parsed]
          : [];
    const sanitized = list
      .map((item: unknown) => sanitizeLookRecipe(item))
      .filter((r: LookLabRecipe | null): r is LookLabRecipe => r !== null);
    if (sanitized.length === 0) {
      return { ok: false, error: 'No valid Look Lab recipe found in JSON.' };
    }
    return { ok: true, recipes: sanitized };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Invalid JSON format.',
    };
  }
}
