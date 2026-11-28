/**
 * Stagecraft Studio — Wave 8 (Upgrade 43): Safe RFC 6902 Auto-Patch Applier
 *
 * Parses `stagecraft-patch/v1` payloads (or raw RFC 6902 op arrays) produced by
 * Shot-Inspector, strictly enforces path allowlisting + prototype-pollution guards,
 * applies all operations atomically onto a deep clone, and validates the resulting
 * `EpisodeScript` through `validateEpisodeScript()` before returning a preview or
 * committing.
 *
 * Pure deterministic TypeScript — zero dependencies, zero in-place mutation.
 */
import {
  ACTOR_GAZE_TARGET_LIST,
  ACTOR_HEAD_ANGLE_LIST,
  ACTOR_HELD_HAND_LIST,
  EpisodeScript,
  PROP_CATALOG,
  validateEpisodeScript,
} from './types';

export const STAGECRAFT_PATCH_SCHEMA = 'stagecraft-patch/v1' as const;

export interface Rfc6902Op {
  op: 'add' | 'replace' | 'remove';
  path: string;
  value?: unknown;
}

export interface StagecraftPatchFileV1 {
  schema: 'stagecraft-patch/v1';
  patch: Rfc6902Op[];
  summary?: string;
  beforeScore?: number;
  afterScore?: number;
}

export type ParsePatchPayloadResult =
  | {
      ok: true;
      patch: Rfc6902Op[];
      summary?: string;
      beforeScore?: number;
      afterScore?: number;
    }
  | {
      ok: false;
      errors: string[];
    };

export type ApplyPatchResult =
  | {
      ok: true;
      nextEpisode: EpisodeScript;
      appliedCount: number;
      diffSummary: string[];
    }
  | {
      ok: false;
      appliedCount: 0;
      errors: string[];
      diffSummary: [];
    };

const MAX_PATCH_OPS = 256;
const FORBIDDEN_KEYS = new Set<string>(['__proto__', 'constructor', 'prototype']);

const VALID_LOCATION_POSITIONS = new Set<string>(['top_left', 'bottom_left', 'top_right']);
const VALID_LOCATION_STYLES = new Set<string>(['cinematic_bar', 'scroll_ribbon', 'minimal_tag']);
const VALID_SLOTS = new Set<string>(['left', 'center', 'right', 'overhead']);
const VALID_GAZE_TARGETS = new Set<string>(ACTOR_GAZE_TARGET_LIST);
const VALID_HEAD_ANGLES = new Set<string>(ACTOR_HEAD_ANGLE_LIST);
const VALID_HELD_HANDS = new Set<string>(ACTOR_HELD_HAND_LIST);
const VALID_FACINGS = new Set<string>(['left', 'right']);
const VALID_PROP_IDS = new Set<string>(PROP_CATALOG.map((p) => p.id));
const ALLOWED_CAST_COLOR_FIELDS = new Set<string>(['primaryColor', 'accentColor']);
const STRICT_HEX6_RE = /^#[0-9a-fA-F]{6}$/;

function isCanonicalNonNegInt(segment: string): boolean {
  return /^(0|[1-9]\d*)$/.test(segment);
}

function unescapePointerSegment(seg: string): string {
  return seg.replace(/~1/g, '/').replace(/~0/g, '~');
}

function parseJsonPointer(path: string): { ok: true; tokens: string[] } | { ok: false; error: string } {
  if (typeof path !== 'string' || !path.startsWith('/')) {
    return { ok: false, error: `Invalid JSON Pointer "${String(path)}": must start with "/".` };
  }
  const rawSegments = path.slice(1).split('/');
  if (rawSegments.length === 0 || rawSegments.some((s) => s.length === 0)) {
    return { ok: false, error: `Invalid JSON Pointer "${path}": empty path segment.` };
  }
  const tokens = rawSegments.map(unescapePointerSegment);
  for (const tok of tokens) {
    if (FORBIDDEN_KEYS.has(tok) || FORBIDDEN_KEYS.has(tok.toLowerCase())) {
      return {
        ok: false,
        error: `Rejected unsafe pointer "${path}": forbidden prototype key "${tok}".`,
      };
    }
  }
  return { ok: true, tokens };
}

function containsForbiddenKeysDeep(value: unknown, depth = 0): string | null {
  if (depth > 24 || value === null || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = containsForbiddenKeysDeep(value[i], depth + 1);
      if (hit) return hit;
    }
    return null;
  }
  const keys = Object.getOwnPropertyNames(value);
  for (const k of keys) {
    if (FORBIDDEN_KEYS.has(k) || FORBIDDEN_KEYS.has(k.toLowerCase())) {
      return k;
    }
    const hit = containsForbiddenKeysDeep((value as Record<string, unknown>)[k], depth + 1);
    if (hit) return hit;
  }
  return null;
}

function validateAllowedTargetPath(
  tokens: string[],
  episode: EpisodeScript
): { ok: true } | { ok: false; error: string } {
  const root = tokens[0];

  if (root === 'visualStyle') {
    if (tokens.length !== 2) {
      return {
        ok: false,
        error: `Disallowed path "/${tokens.join('/')}": only direct /visualStyle/<field> edits are allowed.`,
      };
    }
    return { ok: true };
  }

  if (root === 'beats') {
    if (tokens.length < 3) {
      return {
        ok: false,
        error: `Disallowed path "/${tokens.join('/')}": patches must target fields inside an existing /beats/<index>/<field>.`,
      };
    }
    const idxSeg = tokens[1];
    if (!isCanonicalNonNegInt(idxSeg)) {
      return {
        ok: false,
        error: `Invalid beat index "${idxSeg}" in "/${tokens.join('/')}".`,
      };
    }
    const beatIdx = Number(idxSeg);
    if (beatIdx < 0 || beatIdx >= episode.beats.length) {
      return {
        ok: false,
        error: `Beat index ${beatIdx} out of bounds (episode has ${episode.beats.length} beats).`,
      };
    }
    // Never allow patching immutable beat identity to empty/non-string
    return { ok: true };
  }

  if (root === 'cast') {
    if (tokens.length !== 3) {
      return {
        ok: false,
        error: `Disallowed path "/${tokens.join('/')}": only /cast/<index>/primaryColor or /cast/<index>/accentColor edits are allowed.`,
      };
    }
    const idxSeg = tokens[1];
    if (!isCanonicalNonNegInt(idxSeg)) {
      return {
        ok: false,
        error: `Invalid cast index "${idxSeg}" in "/${tokens.join('/')}".`,
      };
    }
    const castIdx = Number(idxSeg);
    if (castIdx < 0 || castIdx >= episode.cast.length) {
      return {
        ok: false,
        error: `Cast index ${castIdx} out of bounds (episode has ${episode.cast.length} cast members).`,
      };
    }
    if (!ALLOWED_CAST_COLOR_FIELDS.has(tokens[2])) {
      return {
        ok: false,
        error: `Disallowed cast field "/${tokens.join('/')}": only primaryColor and accentColor may be patched.`,
      };
    }
    return { ok: true };
  }

  return {
    ok: false,
    error: `Disallowed patch root "/${root}": only /beats/..., /visualStyle/..., and /cast/<index>/(primaryColor|accentColor) paths are permitted.`,
  };
}

function validateDomainValueConstraint(
  tokens: string[],
  op: Rfc6902Op['op'],
  value: unknown
): string | null {
  if (op === 'remove') {
    if (tokens[0] === 'beats' && tokens.length === 3) {
      const requiredBeatFields = new Set([
        'id',
        'title',
        'duration',
        'stage',
        'mood',
        'weather',
        'shot',
        'transition',
        'lightSide',
        'prop',
        'fx',
        'raag',
        'musicEnergy',
        'actors',
        'speakerId',
        'speakerLabel',
        'dialogue',
      ]);
      if (requiredBeatFields.has(tokens[2])) {
        return `Cannot remove required beat field "${tokens[2]}".`;
      }
    }
    if (tokens[0] === 'cast') {
      return `Cannot remove required cast color field "${tokens[2]}".`;
    }
    return null;
  }

  if (tokens[0] === 'cast' && tokens.length === 3) {
    if (typeof value !== 'string' || !STRICT_HEX6_RE.test(value)) {
      return `Invalid cast ${tokens[2]} "${String(value)}": must be a strict #rrggbb hex color.`;
    }
    return null;
  }

  if (tokens[0] === 'beats' && tokens.length >= 3) {
    const field = tokens[2];
    if (tokens.length === 3) {
      if (field === 'duration') {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0.5 || value > 120) {
          return `Invalid beat duration "${String(value)}": must be a finite number in [0.5, 120].`;
        }
      } else if (field === 'cameraFocusX') {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < -0.45 || value > 0.45) {
          return `Invalid cameraFocusX "${String(value)}": must be a finite number in [-0.45, 0.45].`;
        }
      } else if (field === 'cameraFocusY') {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < -0.3 || value > 0.3) {
          return `Invalid cameraFocusY "${String(value)}": must be a finite number in [-0.3, 0.3].`;
        }
      } else if (field === 'audioLeadSec') {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < -0.6 || value > 0.6) {
          return `Invalid audioLeadSec "${String(value)}": must be a finite number in [-0.6, 0.6].`;
        }
      } else if (field === 'musicEnergy' || field === 'haze') {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
          return `Invalid ${field} "${String(value)}": must be a finite number in [0, 1].`;
        }
      } else if (field === 'id') {
        if (typeof value !== 'string' || !value.trim()) {
          return 'Beat id must be a non-empty string.';
        }
      } else if (field === 'dialogue' || field === 'title' || field === 'speakerId' || field === 'speakerLabel') {
        if (typeof value !== 'string') {
          return `Beat field "${field}" must be a string.`;
        }
      }
    } else if (field === 'locationCard' && tokens.length === 4) {
      const sub = tokens[3];
      if (sub === 'position' && (typeof value !== 'string' || !VALID_LOCATION_POSITIONS.has(value))) {
        return `Invalid locationCard.position "${String(value)}".`;
      }
      if (sub === 'style' && (typeof value !== 'string' || !VALID_LOCATION_STYLES.has(value))) {
        return `Invalid locationCard.style "${String(value)}".`;
      }
      if (sub === 'title' && (typeof value !== 'string' || !value.trim())) {
        return 'locationCard.title must be a non-empty string.';
      }
    } else if (field === 'actors' && tokens.length === 5) {
      const sub = tokens[4];
      if ((sub === 'offsetX' || sub === 'offsetY') && (typeof value !== 'number' || !Number.isFinite(value) || value < -0.35 || value > 0.35)) {
        return `Invalid actor ${sub} "${String(value)}": must be in [-0.35, 0.35].`;
      }
      if (sub === 'slot' && (typeof value !== 'string' || !VALID_SLOTS.has(value))) {
        return `Invalid actor slot "${String(value)}".`;
      }
      if (sub === 'gazeTarget' && (typeof value !== 'string' || !VALID_GAZE_TARGETS.has(value))) {
        return `Invalid actor gazeTarget "${String(value)}".`;
      }
      if (sub === 'headAngle' && (typeof value !== 'string' || !VALID_HEAD_ANGLES.has(value))) {
        return `Invalid actor headAngle "${String(value)}".`;
      }
      if (sub === 'heldProp' && (typeof value !== 'string' || (value !== 'none' && !VALID_PROP_IDS.has(value)))) {
        return `Invalid actor heldProp "${String(value)}".`;
      }
      if (sub === 'heldHand' && (typeof value !== 'string' || !VALID_HELD_HANDS.has(value))) {
        return `Invalid actor heldHand "${String(value)}".`;
      }
      if (sub === 'facing' && (typeof value !== 'string' || !VALID_FACINGS.has(value))) {
        return `Invalid actor facing "${String(value)}": must be "left" or "right".`;
      }
    }
  }

  return null;
}

function formatVal(val: unknown): string {
  if (val === undefined) return 'unset';
  if (typeof val === 'string') return JSON.stringify(val.length > 48 ? `${val.slice(0, 45)}...` : val);
  if (typeof val === 'number' || typeof val === 'boolean' || val === null) return String(val);
  try {
    const s = JSON.stringify(val);
    return s.length > 60 ? `${s.slice(0, 57)}...` : s;
  } catch {
    return '[object]';
  }
}

function describeTarget(tokens: string[], episode: EpisodeScript): string {
  if (tokens[0] === 'beats' && tokens.length >= 3) {
    const idx = Number(tokens[1]);
    const beatId = episode.beats[idx]?.id || `beat_${idx + 1}`;
    const fieldPath = tokens.slice(2).join('.');
    return `Beat ${idx + 1} (${beatId}): ${fieldPath}`;
  }
  return tokens.join('.');
}

function isValidRfc6902OpObject(item: unknown): item is Rfc6902Op {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
  const rec = item as Record<string, unknown>;
  if (rec.op !== 'add' && rec.op !== 'replace' && rec.op !== 'remove') return false;
  if (typeof rec.path !== 'string' || !rec.path.startsWith('/')) return false;
  if ((rec.op === 'add' || rec.op === 'replace') && !Object.prototype.hasOwnProperty.call(rec, 'value')) {
    return false;
  }
  return true;
}

/**
 * Parses either a `{ schema: 'stagecraft-patch/v1', patch: [...] }` envelope
 * or a raw `Rfc6902Op[]` array (and accepts a JSON string directly).
 */
export function parseStagecraftPatchPayload(raw: unknown): ParsePatchPayloadResult {
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return { ok: false, errors: ['Patch payload is empty.'] };
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch (err) {
      return {
        ok: false,
        errors: [`Invalid JSON syntax: ${err instanceof Error ? err.message : String(err)}`],
      };
    }
  }

  let opsRaw: unknown;
  let summary: string | undefined;
  let beforeScore: number | undefined;
  let afterScore: number | undefined;

  if (Array.isArray(parsed)) {
    opsRaw = parsed;
  } else if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (obj.schema !== STAGECRAFT_PATCH_SCHEMA) {
      return {
        ok: false,
        errors: [
          `Unsupported patch schema "${String(obj.schema ?? 'missing')}": expected "${STAGECRAFT_PATCH_SCHEMA}" or a raw RFC 6902 op array.`,
        ],
      };
    }
    if (!Array.isArray(obj.patch)) {
      return { ok: false, errors: ['Patch envelope missing array field "patch".'] };
    }
    opsRaw = obj.patch;
    if (typeof obj.summary === 'string') summary = obj.summary.trim();
    if (typeof obj.beforeScore === 'number' && Number.isFinite(obj.beforeScore)) {
      beforeScore = obj.beforeScore;
    }
    if (typeof obj.afterScore === 'number' && Number.isFinite(obj.afterScore)) {
      afterScore = obj.afterScore;
    }
  } else {
    return { ok: false, errors: ['Patch payload must be a stagecraft-patch/v1 object or RFC 6902 array.'] };
  }

  const list = opsRaw as unknown[];
  if (list.length === 0) {
    return { ok: false, errors: ['Patch contains zero operations.'] };
  }
  if (list.length > MAX_PATCH_OPS) {
    return {
      ok: false,
      errors: [`Patch exceeds safety cap (${list.length} > ${MAX_PATCH_OPS} operations).`],
    };
  }

  const errors: string[] = [];
  const ops: Rfc6902Op[] = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!isValidRfc6902OpObject(item)) {
      errors.push(`Operation #${i + 1} is not a valid RFC 6902 op (requires op: add|replace|remove and path starting with "/").`);
      continue;
    }
    ops.push({
      op: item.op,
      path: item.path,
      ...(item.op !== 'remove' ? { value: item.value } : {}),
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    patch: ops,
    ...(summary ? { summary } : {}),
    ...(beforeScore !== undefined ? { beforeScore } : {}),
    ...(afterScore !== undefined ? { afterScore } : {}),
  };
}

/**
 * Validates, previews, and atomically applies RFC 6902 operations onto a deep clone
 * of `episode`, then verifies the resulting script via `validateEpisodeScript()`.
 *
 * Guarantees:
 * - Source `episode` is never mutated.
 * - Any invalid op, disallowed root, prototype-pollution key, or out-of-bounds index
 *   aborts the entire patch atomically.
 */
export function previewAndApplyStagecraftPatch(
  episode: EpisodeScript,
  ops: Rfc6902Op[]
): ApplyPatchResult {
  if (!Array.isArray(ops) || ops.length === 0) {
    return { ok: false, appliedCount: 0, errors: ['No patch operations provided.'], diffSummary: [] };
  }
  if (ops.length > MAX_PATCH_OPS) {
    return {
      ok: false,
      appliedCount: 0,
      errors: [`Patch exceeds safety cap (${ops.length} > ${MAX_PATCH_OPS} operations).`],
      diffSummary: [],
    };
  }

  // Deep-clone episode via JSON round-trip to break all object references cleanly
  const candidate = JSON.parse(JSON.stringify(episode)) as Record<string, unknown>;
  if (!candidate.visualStyle || typeof candidate.visualStyle !== 'object') {
    candidate.visualStyle = {};
  }

  const diffSummary: string[] = [];

  for (let i = 0; i < ops.length; i++) {
    const opObj = ops[i];
    if (!isValidRfc6902OpObject(opObj)) {
      return {
        ok: false,
        appliedCount: 0,
        errors: [`Op #${i + 1}: invalid RFC 6902 operation structure.`],
        diffSummary: [],
      };
    }

    const ptr = parseJsonPointer(opObj.path);
    if (!ptr.ok) {
      return {
        ok: false,
        appliedCount: 0,
        errors: [`Op #${i + 1}: ${ptr.error}`],
        diffSummary: [],
      };
    }

    const tokens = ptr.tokens;
    const allow = validateAllowedTargetPath(tokens, episode);
    if (!allow.ok) {
      return {
        ok: false,
        appliedCount: 0,
        errors: [`Op #${i + 1}: ${allow.error}`],
        diffSummary: [],
      };
    }

    if (opObj.op !== 'remove') {
      const badKey = containsForbiddenKeysDeep(opObj.value);
      if (badKey) {
        return {
          ok: false,
          appliedCount: 0,
          errors: [`Op #${i + 1}: rejected forbidden key "${badKey}" inside patch value.`],
          diffSummary: [],
        };
      }
    }

    const domainErr = validateDomainValueConstraint(tokens, opObj.op, opObj.value);
    if (domainErr) {
      return {
        ok: false,
        appliedCount: 0,
        errors: [`Op #${i + 1} (${opObj.path}): ${domainErr}`],
        diffSummary: [],
      };
    }

    // Traverse to parent container
    let parent: unknown = candidate;
    for (let s = 0; s < tokens.length - 1; s++) {
      const seg = tokens[s];
      if (Array.isArray(parent)) {
        if (!isCanonicalNonNegInt(seg)) {
          return {
            ok: false,
            appliedCount: 0,
            errors: [`Op #${i + 1}: non-integer array index "${seg}" in "${opObj.path}".`],
            diffSummary: [],
          };
        }
        const idx = Number(seg);
        if (idx < 0 || idx >= parent.length) {
          return {
            ok: false,
            appliedCount: 0,
            errors: [`Op #${i + 1}: array index ${idx} out of bounds in "${opObj.path}".`],
            diffSummary: [],
          };
        }
        parent = parent[idx];
      } else if (parent && typeof parent === 'object') {
        const rec = parent as Record<string, unknown>;
        if (!Object.prototype.hasOwnProperty.call(rec, seg) || rec[seg] === null || typeof rec[seg] !== 'object') {
          return {
            ok: false,
            appliedCount: 0,
            errors: [`Op #${i + 1}: missing parent container "${tokens.slice(0, s + 1).join('/')}" in "${opObj.path}".`],
            diffSummary: [],
          };
        }
        parent = rec[seg];
      } else {
        return {
          ok: false,
          appliedCount: 0,
          errors: [`Op #${i + 1}: cannot traverse non-object parent in "${opObj.path}".`],
          diffSummary: [],
        };
      }
    }

    const leafKey = tokens[tokens.length - 1];
    const clonedVal =
      opObj.op === 'remove' ? undefined : JSON.parse(JSON.stringify(opObj.value));
    const label = describeTarget(tokens, episode);

    if (Array.isArray(parent)) {
      if (opObj.op === 'add') {
        if (leafKey === '-') {
          parent.push(clonedVal);
          diffSummary.push(`${label}: appended ${formatVal(clonedVal)}`);
        } else if (isCanonicalNonNegInt(leafKey)) {
          const idx = Number(leafKey);
          if (idx < 0 || idx > parent.length) {
            return {
              ok: false,
              appliedCount: 0,
              errors: [`Op #${i + 1}: array insert index ${idx} out of bounds in "${opObj.path}".`],
              diffSummary: [],
            };
          }
          parent.splice(idx, 0, clonedVal);
          diffSummary.push(`${label}: inserted ${formatVal(clonedVal)}`);
        } else {
          return {
            ok: false,
            appliedCount: 0,
            errors: [`Op #${i + 1}: invalid array index "${leafKey}" in "${opObj.path}".`],
            diffSummary: [],
          };
        }
      } else {
        if (!isCanonicalNonNegInt(leafKey)) {
          return {
            ok: false,
            appliedCount: 0,
            errors: [`Op #${i + 1}: invalid array index "${leafKey}" in "${opObj.path}".`],
            diffSummary: [],
          };
        }
        const idx = Number(leafKey);
        if (idx < 0 || idx >= parent.length) {
          return {
            ok: false,
            appliedCount: 0,
            errors: [`Op #${i + 1}: array index ${idx} out of bounds in "${opObj.path}".`],
            diffSummary: [],
          };
        }
        const prev = parent[idx];
        if (opObj.op === 'replace') {
          parent[idx] = clonedVal;
          diffSummary.push(`${label}: ${formatVal(prev)} → ${formatVal(clonedVal)}`);
        } else {
          parent.splice(idx, 1);
          diffSummary.push(`${label}: removed ${formatVal(prev)}`);
        }
      }
    } else if (parent && typeof parent === 'object') {
      const rec = parent as Record<string, unknown>;
      const existed = Object.prototype.hasOwnProperty.call(rec, leafKey);
      const prev = existed ? rec[leafKey] : undefined;

      if (opObj.op === 'add') {
        rec[leafKey] = clonedVal;
        diffSummary.push(`${label}: ${formatVal(prev)} → ${formatVal(clonedVal)}`);
      } else if (opObj.op === 'replace') {
        // Allow RFC 6902 replace on optional beat fields (like cameraFocusX / audioLeadSec)
        // even when undefined in sparse JSON, while still rejecting unknown nested missing parents above.
        rec[leafKey] = clonedVal;
        diffSummary.push(`${label}: ${formatVal(prev)} → ${formatVal(clonedVal)}`);
      } else {
        if (!existed) {
          return {
            ok: false,
            appliedCount: 0,
            errors: [`Op #${i + 1}: cannot remove non-existent property "${opObj.path}".`],
            diffSummary: [],
          };
        }
        delete rec[leafKey];
        diffSummary.push(`${label}: removed (was ${formatVal(prev)})`);
      }
    } else {
      return {
        ok: false,
        appliedCount: 0,
        errors: [`Op #${i + 1}: target parent is not an object or array in "${opObj.path}".`],
        diffSummary: [],
      };
    }
  }

  // Final authoritative validation gate through Stagecraft's schema validator
  const validation = validateEpisodeScript(candidate);
  if (!validation.ok) {
    return {
      ok: false,
      appliedCount: 0,
      errors: [`Episode validation failed: ${validation.error}`],
      diffSummary: [],
    };
  }

  return {
    ok: true,
    nextEpisode: validation.script,
    appliedCount: ops.length,
    diffSummary,
  };
}
