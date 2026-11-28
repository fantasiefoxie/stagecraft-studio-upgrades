/**
 * Stagecraft Studio — Wave 8 (Upgrade 44): Bidirectional `cutscene-qa-bridge/v1` Host Client
 *
 * Implements origin-validated `postMessage` communication between Stagecraft Studio (host)
 * and Shot-Inspector (inspector peer) without `window.open()` or `window.alert()`.
 *
 * Frozen Wire Protocol (`channel: 'cutscene-qa-bridge/v1'`):
 *  - `QA_PING` -> `QA_PONG`
 *  - `QA_RUN_AUDIT` -> `QA_PUSH_STAGECRAFT_BUNDLE`
 *  - `QA_SEEK_TIME` -> invokes `onSeekTime(timeSec)`
 *  - `QA_APPLY_PATCH` -> validates via `previewAndApplyStagecraftPatch`, commits if `!dryRun`, replies `QA_PATCH_RESULT`
 */
import type { AspectMode, EpisodeScript } from './types';
import {
  STAGECRAFT_STUDIO_VERSION,
  StagecraftQaBundleV1,
  buildStagecraftQaBundle,
} from './shotInspectorBridge';
import {
  Rfc6902Op,
  parseStagecraftPatchPayload,
  previewAndApplyStagecraftPatch,
} from './shotInspectorPatchApplier';

export const CUTSCENE_QA_BRIDGE_CHANNEL = 'cutscene-qa-bridge/v1' as const;

export const SHOT_INSPECTOR_BRIDGE_CAPABILITIES = [
  'bundle-v1',
  'rfc6902-patch',
  'seek',
] as const;

export interface BridgePostMessageTarget {
  postMessage(message: unknown, targetOrigin: string): void;
}

export interface BridgeMessageEventLike {
  origin: string;
  data: unknown;
  source?: BridgePostMessageTarget | null;
}

export interface BridgeActivityEvent {
  direction: 'in' | 'out';
  type: string;
  origin: string;
  summary: string;
  atIso: string;
}

export interface ShotInspectorHostBridgeOptions {
  getEpisode: () => EpisodeScript;
  getAspect: () => AspectMode;
  onSeekTime?: (timeSec: number) => void;
  onCommitEpisode?: (nextEpisode: EpisodeScript, summary: string, findingIds: string[]) => void;
  onActivity?: (event: BridgeActivityEvent) => void;
  allowedOrigins?: string[];
  currentOrigin?: string;
  studioVersion?: string;
  /** Attach `window.addEventListener('message', ...)` automatically in browser environments (default: true). */
  attachWindow?: boolean;
  /** Optional clock override for deterministic testing. */
  nowIso?: () => string;
}

export interface BridgeHandleResult {
  handled: boolean;
  rejectedReason?: string;
  reply?: Record<string, unknown>;
}

export interface ShotInspectorHostBridge {
  handleIncomingMessage: (event: BridgeMessageEventLike) => BridgeHandleResult;
  pushBundle: (
    target: BridgePostMessageTarget,
    targetOrigin: string
  ) => StagecraftQaBundleV1 | null;
  setAllowedOrigins: (origins: string[]) => void;
  getAllowedOrigins: () => string[];
  destroy: () => void;
}

const LOCALHOST_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/i;

/**
 * Normalizes a user-supplied URL/origin string into a strict `scheme://host[:port]` origin.
 * Returns `null` for unsafe schemes (`javascript:`, `data:`, `file:`, wildcard `*`, etc.).
 */
export function normalizeHttpOrigin(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '*' || trimmed === 'null') return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (!parsed.host) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * Validates that an incoming or outgoing `postMessage` origin is explicitly authorized:
 * - Localhost / 127.0.0.1 (`http` or `https`, any valid port)
 * - Current host origin (when valid `http(s)`)
 * - Explicitly configured trusted Shot-Inspector origins
 */
export function isAllowedBridgeOrigin(
  origin: string,
  extraAllowedOrigins: string[] = [],
  currentOrigin?: string
): boolean {
  const normalized = normalizeHttpOrigin(origin);
  if (!normalized) return false;
  if (LOCALHOST_ORIGIN_RE.test(normalized)) return true;

  if (currentOrigin) {
    const normCurrent = normalizeHttpOrigin(currentOrigin);
    if (normCurrent && normalized === normCurrent) return true;
  }

  for (const candidate of extraAllowedOrigins) {
    const normCandidate = normalizeHttpOrigin(candidate);
    if (normCandidate && normalized === normCandidate) return true;
  }
  return false;
}

export function createShotInspectorHostBridge(
  options: ShotInspectorHostBridgeOptions
): ShotInspectorHostBridge {
  const studioVersion = options.studioVersion || STAGECRAFT_STUDIO_VERSION;
  const currentOrigin =
    options.currentOrigin ??
    (typeof window !== 'undefined' && window.location ? window.location.origin : undefined);

  let extraAllowedOrigins: string[] = (options.allowedOrigins || [])
    .map((o) => normalizeHttpOrigin(o))
    .filter((o): o is string => Boolean(o));

  const getNowIso = options.nowIso || (() => new Date().toISOString());

  const logActivity = (
    direction: 'in' | 'out',
    type: string,
    origin: string,
    summary: string
  ) => {
    options.onActivity?.({
      direction,
      type,
      origin,
      summary,
      atIso: getNowIso(),
    });
  };

  const replyToSource = (
    source: BridgePostMessageTarget | null | undefined,
    targetOrigin: string,
    payload: Record<string, unknown>
  ) => {
    if (!source || typeof source.postMessage !== 'function') return;
    source.postMessage(payload, targetOrigin);
    logActivity('out', String(payload.type || 'MESSAGE'), targetOrigin, 'Sent response');
  };

  const handleIncomingMessage = (event: BridgeMessageEventLike): BridgeHandleResult => {
    if (!event || typeof event.data !== 'object' || event.data === null) {
      return { handled: false };
    }
    const msg = event.data as Record<string, unknown>;
    if (msg.channel !== CUTSCENE_QA_BRIDGE_CHANNEL) {
      return { handled: false };
    }

    const origin = typeof event.origin === 'string' ? event.origin : '';
    if (!isAllowedBridgeOrigin(origin, extraAllowedOrigins, currentOrigin)) {
      return {
        handled: false,
        rejectedReason: `Unauthorized origin "${origin || 'empty'}"`,
      };
    }

    const type = typeof msg.type === 'string' ? msg.type : '';
    const safeOrigin = normalizeHttpOrigin(origin)!;

    if (type === 'QA_PING') {
      logActivity('in', 'QA_PING', safeOrigin, 'Received handshake ping');
      const reply: Record<string, unknown> = {
        channel: CUTSCENE_QA_BRIDGE_CHANNEL,
        type: 'QA_PONG',
        host: 'stagecraft-studio',
        version: studioVersion,
        capabilities: [...SHOT_INSPECTOR_BRIDGE_CAPABILITIES],
      };
      replyToSource(event.source, safeOrigin, reply);
      return { handled: true, reply };
    }

    if (type === 'QA_RUN_AUDIT') {
      logActivity('in', 'QA_RUN_AUDIT', safeOrigin, 'Inspector requested fresh QA bundle');
      const bundle = buildStagecraftQaBundle(options.getEpisode(), {
        aspect: options.getAspect(),
        exportedAt: getNowIso(),
        studioVersion,
      });
      const reply: Record<string, unknown> = {
        channel: CUTSCENE_QA_BRIDGE_CHANNEL,
        type: 'QA_PUSH_STAGECRAFT_BUNDLE',
        bundle,
      };
      replyToSource(event.source, safeOrigin, reply);
      return { handled: true, reply };
    }

    if (type === 'QA_SEEK_TIME') {
      const timeSec = typeof msg.timeSec === 'number' ? msg.timeSec : Number(msg.timeSec);
      if (!Number.isFinite(timeSec) || timeSec < 0) {
        return {
          handled: true,
          rejectedReason: 'Invalid timeSec in QA_SEEK_TIME',
        };
      }
      logActivity('in', 'QA_SEEK_TIME', safeOrigin, `Seek timeline to ${timeSec.toFixed(2)}s`);
      options.onSeekTime?.(timeSec);
      return { handled: true };
    }

    if (type === 'QA_APPLY_PATCH') {
      const txId = typeof msg.txId === 'string' && msg.txId.trim() ? msg.txId.trim() : 'tx_unknown';
      const dryRun = Boolean(msg.dryRun);
      const summary =
        typeof msg.summary === 'string' && msg.summary.trim()
          ? msg.summary.trim()
          : 'Shot-Inspector auto-fix patch';
      const findingIds = Array.isArray(msg.findingIds)
        ? msg.findingIds.filter((id): id is string => typeof id === 'string')
        : [];

      logActivity(
        'in',
        'QA_APPLY_PATCH',
        safeOrigin,
        `${dryRun ? 'Dry-run' : 'Apply'} patch (${txId})`
      );

      const parsed = parseStagecraftPatchPayload(msg.patch as Rfc6902Op[]);
      if (!parsed.ok) {
        const reply: Record<string, unknown> = {
          channel: CUTSCENE_QA_BRIDGE_CHANNEL,
          type: 'QA_PATCH_RESULT',
          txId,
          ok: false,
          appliedCount: 0,
          dryRun,
          validationErrors: parsed.errors,
        };
        replyToSource(event.source, safeOrigin, reply);
        return { handled: true, reply };
      }

      const applied = previewAndApplyStagecraftPatch(options.getEpisode(), parsed.patch);
      if (!applied.ok) {
        const reply: Record<string, unknown> = {
          channel: CUTSCENE_QA_BRIDGE_CHANNEL,
          type: 'QA_PATCH_RESULT',
          txId,
          ok: false,
          appliedCount: 0,
          dryRun,
          validationErrors: applied.errors,
        };
        replyToSource(event.source, safeOrigin, reply);
        return { handled: true, reply };
      }

      if (!dryRun) {
        options.onCommitEpisode?.(applied.nextEpisode, summary, findingIds);
      }

      const updatedBundle = buildStagecraftQaBundle(applied.nextEpisode, {
        aspect: options.getAspect(),
        exportedAt: getNowIso(),
        studioVersion,
      });

      const reply: Record<string, unknown> = {
        channel: CUTSCENE_QA_BRIDGE_CHANNEL,
        type: 'QA_PATCH_RESULT',
        txId,
        ok: true,
        appliedCount: applied.appliedCount,
        dryRun,
        diffSummary: applied.diffSummary,
        updatedBundle,
      };
      replyToSource(event.source, safeOrigin, reply);
      return { handled: true, reply };
    }

    return { handled: false };
  };

  const pushBundle = (
    target: BridgePostMessageTarget,
    targetOrigin: string
  ): StagecraftQaBundleV1 | null => {
    const safeOrigin = normalizeHttpOrigin(targetOrigin);
    if (!safeOrigin || !isAllowedBridgeOrigin(safeOrigin, extraAllowedOrigins, currentOrigin)) {
      return null;
    }
    const bundle = buildStagecraftQaBundle(options.getEpisode(), {
      aspect: options.getAspect(),
      exportedAt: getNowIso(),
      studioVersion,
    });
    target.postMessage(
      {
        channel: CUTSCENE_QA_BRIDGE_CHANNEL,
        type: 'QA_PUSH_STAGECRAFT_BUNDLE',
        bundle,
      },
      safeOrigin
    );
    logActivity(
      'out',
      'QA_PUSH_STAGECRAFT_BUNDLE',
      safeOrigin,
      `Pushed QA bundle (${bundle.telemetry.beatTimeline.length} beats)`
    );
    return bundle;
  };

  const windowListener = (evt: MessageEvent) => {
    handleIncomingMessage({
      origin: evt.origin,
      data: evt.data,
      source: evt.source as BridgePostMessageTarget | null,
    });
  };

  const shouldAttach = options.attachWindow !== false && typeof window !== 'undefined';
  if (shouldAttach) {
    window.addEventListener('message', windowListener);
  }

  return {
    handleIncomingMessage,
    pushBundle,
    setAllowedOrigins: (origins: string[]) => {
      extraAllowedOrigins = origins
        .map((o) => normalizeHttpOrigin(o))
        .filter((o): o is string => Boolean(o));
    },
    getAllowedOrigins: () => [...extraAllowedOrigins],
    destroy: () => {
      if (shouldAttach && typeof window !== 'undefined') {
        window.removeEventListener('message', windowListener);
      }
    },
  };
}
