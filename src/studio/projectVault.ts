/**
 * Katha Studio — IndexedDB Project, Voice Clip & Music Stem Vault (v2)
 * Persists autosaved drafts, named studio projects, language-namespaced binary per-beat
 * voiceover Audio Blobs, and uploaded custom Music Stems across browser reloads.
 */
import { AspectMode, EpisodeScript } from './types';

export interface SavedProjectRecord {
  id: string;
  name: string;
  episode: EpisodeScript;
  aspect: AspectMode;
  savedAt: number;
  voiceCount: number;
  hasMusicStem?: boolean;
}

export interface PersistedVoiceBlob {
  key: string; // `${projectId}::${beatSlotKey}`
  projectId: string;
  beatId: string; // may be plain beatId (v1 legacy) or `${langCode}::${beatId}` (v2 language-namespaced)
  fileName: string;
  duration: number;
  blob: Blob;
  savedAt: number;
}

export interface PersistedMusicStem {
  projectId: string;
  fileName: string;
  duration: number;
  blob: Blob;
  savedAt: number;
}

const DB_NAME = 'katha_studio_vault_v1';
const DB_VERSION = 2;
const STORE_PROJECTS = 'projects';
const STORE_VOICES = 'voiceBlobs';
const STORE_MUSIC = 'musicStems';
export const AUTOSAVE_PROJECT_ID = '__autosave__';
const FALLBACK_LS_KEY = 'katha_studio_autosave_fallback_v1';

/**
 * Builds a language-namespaced voice slot key so switching an episode between languages
 * (e.g. English -> Hindi -> Japanese) preserves each language's dub clips independently.
 */
export function makeVoiceSlotKey(beatId: string, langCode?: string): string {
  const cleanBeat = String(beatId || '').trim();
  const cleanLang = String(langCode || 'en').trim().toLowerCase() || 'en';
  if (!cleanBeat) return '';
  const sepIdx = cleanBeat.indexOf('::');
  const bareBeat = sepIdx >= 0 ? cleanBeat.slice(sepIdx + 2).trim() : cleanBeat;
  if (!bareBeat) return '';
  return `${cleanLang}::${bareBeat}`;
}

/**
 * Parses either a v2 language-namespaced slot key (`hi::beat_1`) or a legacy v1 bare `beat_1`.
 */
export function parseVoiceSlotKey(rawKey: string): { langCode: string | null; beatId: string } {
  const s = String(rawKey || '').trim();
  const idx = s.indexOf('::');
  if (idx > 0) {
    return {
      langCode: s.slice(0, idx).toLowerCase(),
      beatId: s.slice(idx + 2),
    };
  }
  return { langCode: null, beatId: s };
}

function isValidBlobRecord(blob: unknown): blob is Blob {
  return typeof Blob !== 'undefined' && blob instanceof Blob && blob.size > 0;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openVaultDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_VOICES)) {
          const store = db.createObjectStore(STORE_VOICES, { keyPath: 'key' });
          store.createIndex('projectId', 'projectId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_MUSIC)) {
          db.createObjectStore(STORE_MUSIC, { keyPath: 'projectId' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function isValidSavedRecord(raw: unknown): raw is SavedProjectRecord {
  if (!raw || typeof raw !== 'object') return false;
  const r = raw as Partial<SavedProjectRecord>;
  return (
    typeof r.id === 'string' &&
    Boolean(r.episode) &&
    typeof r.episode?.id === 'string' &&
    Array.isArray(r.episode?.beats) &&
    r.episode.beats.length > 0
  );
}

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveAutosaveProject(
  episode: EpisodeScript,
  aspect: AspectMode,
  voiceCount: number,
  hasMusicStem = false
): Promise<void> {
  const record: SavedProjectRecord = {
    id: AUTOSAVE_PROJECT_ID,
    name: episode.title || 'Autosaved Draft',
    episode,
    aspect,
    savedAt: Date.now(),
    voiceCount,
    hasMusicStem,
  };
  const db = await openVaultDb();
  if (!db) {
    try {
      localStorage.setItem(FALLBACK_LS_KEY, JSON.stringify(record));
    } catch {
      // ignore quota error
    }
    return;
  }
  try {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    tx.objectStore(STORE_PROJECTS).put(record);
    await new Promise<void>((res) => {
      tx.oncomplete = () => res();
      tx.onerror = () => res();
    });
  } catch {
    // ignore storage failure cleanly
  }
}

export async function loadAutosaveProject(): Promise<SavedProjectRecord | null> {
  const db = await openVaultDb();
  if (!db) {
    try {
      const raw = localStorage.getItem(FALLBACK_LS_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return isValidSavedRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  try {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const rec: unknown = await idbRequest(tx.objectStore(STORE_PROJECTS).get(AUTOSAVE_PROJECT_ID));
    return isValidSavedRecord(rec) ? rec : null;
  } catch {
    return null;
  }
}

export async function saveNamedProject(
  name: string,
  episode: EpisodeScript,
  aspect: AspectMode,
  voiceClipsMap: Map<string, { blob: Blob; fileName: string; duration: number }>,
  musicStem?: { blob: Blob; fileName: string; duration: number } | null
): Promise<SavedProjectRecord> {
  const projectId = `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const validStem = musicStem && isValidBlobRecord(musicStem.blob) ? musicStem : null;
  const record: SavedProjectRecord = {
    id: projectId,
    name: name.trim() || episode.title || 'Untitled Draft',
    episode: JSON.parse(JSON.stringify(episode)) as EpisodeScript,
    aspect,
    savedAt: Date.now(),
    voiceCount: voiceClipsMap.size,
    hasMusicStem: Boolean(validStem),
  };
  const db = await openVaultDb();
  if (!db) return record;

  try {
    const stores = db.objectStoreNames.contains(STORE_MUSIC)
      ? [STORE_PROJECTS, STORE_VOICES, STORE_MUSIC]
      : [STORE_PROJECTS, STORE_VOICES];
    const tx = db.transaction(stores, 'readwrite');
    tx.objectStore(STORE_PROJECTS).put(record);
    const vStore = tx.objectStore(STORE_VOICES);
    const now = Date.now();
    for (const [beatId, clip] of voiceClipsMap.entries()) {
      if (!isValidBlobRecord(clip.blob)) continue;
      const voiceRec: PersistedVoiceBlob = {
        key: `${projectId}::${beatId}`,
        projectId,
        beatId,
        fileName: clip.fileName,
        duration: clip.duration,
        blob: clip.blob,
        savedAt: now,
      };
      vStore.put(voiceRec);
    }
    if (validStem && db.objectStoreNames.contains(STORE_MUSIC)) {
      tx.objectStore(STORE_MUSIC).put({
        projectId,
        fileName: validStem.fileName,
        duration: validStem.duration,
        blob: validStem.blob,
        savedAt: now,
      } satisfies PersistedMusicStem);
    }
    await new Promise<void>((res) => {
      tx.oncomplete = () => res();
      tx.onerror = () => res();
      tx.onabort = () => res();
    });
  } catch {
    // Graceful fallback when browser storage quota is exceeded
  }
  return record;
}

export async function listSavedProjects(): Promise<SavedProjectRecord[]> {
  const db = await openVaultDb();
  if (!db) return [];
  try {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const all = (await idbRequest(tx.objectStore(STORE_PROJECTS).getAll())) as unknown[];
    return all
      .filter((p): p is SavedProjectRecord => isValidSavedRecord(p) && p.id !== AUTOSAVE_PROJECT_ID)
      .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  } catch {
    return [];
  }
}

export async function deleteSavedProject(projectId: string): Promise<void> {
  if (!projectId || projectId === AUTOSAVE_PROJECT_ID) return;
  const db = await openVaultDb();
  if (!db) return;
  try {
    const stores = db.objectStoreNames.contains(STORE_MUSIC)
      ? [STORE_PROJECTS, STORE_VOICES, STORE_MUSIC]
      : [STORE_PROJECTS, STORE_VOICES];
    const tx = db.transaction(stores, 'readwrite');
    tx.objectStore(STORE_PROJECTS).delete(projectId);
    const vStore = tx.objectStore(STORE_VOICES);
    const idx = vStore.index('projectId');
    const req = idx.getAllKeys(IDBKeyRange.only(projectId));
    req.onsuccess = () => {
      for (const k of req.result || []) {
        vStore.delete(k);
      }
    };
    if (db.objectStoreNames.contains(STORE_MUSIC)) {
      tx.objectStore(STORE_MUSIC).delete(projectId);
    }
    await new Promise<void>((res) => {
      tx.oncomplete = () => res();
      tx.onerror = () => res();
    });
  } catch {
    // ignore
  }
}

export async function saveVoiceBlobToVault(
  projectId: string,
  beatId: string,
  blob: Blob,
  fileName: string,
  duration: number
): Promise<void> {
  if (!isValidBlobRecord(blob)) return;
  const db = await openVaultDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE_VOICES, 'readwrite');
    const rec: PersistedVoiceBlob = {
      key: `${projectId}::${beatId}`,
      projectId,
      beatId,
      fileName,
      duration,
      blob,
      savedAt: Date.now(),
    };
    tx.objectStore(STORE_VOICES).put(rec);
    await new Promise<void>((res) => {
      tx.oncomplete = () => res();
      tx.onerror = () => res();
    });
  } catch {
    // ignore quota error
  }
}

export async function deleteVoiceBlobFromVault(projectId: string, beatId: string): Promise<void> {
  const db = await openVaultDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE_VOICES, 'readwrite');
    tx.objectStore(STORE_VOICES).delete(`${projectId}::${beatId}`);
    await new Promise<void>((res) => {
      tx.oncomplete = () => res();
      tx.onerror = () => res();
    });
  } catch {
    // ignore
  }
}

export async function loadVoiceBlobsForProject(projectId: string): Promise<PersistedVoiceBlob[]> {
  const db = await openVaultDb();
  if (!db) return [];
  try {
    const tx = db.transaction(STORE_VOICES, 'readonly');
    const idx = tx.objectStore(STORE_VOICES).index('projectId');
    const list = (await idbRequest(idx.getAll(IDBKeyRange.only(projectId)))) as PersistedVoiceBlob[];
    if (!Array.isArray(list)) return [];
    return list.filter(
      (rec) =>
        Boolean(rec) &&
        typeof rec.beatId === 'string' &&
        isValidBlobRecord(rec.blob)
    );
  } catch {
    return [];
  }
}

export async function replaceAutosaveVoiceBlobs(
  clips: Array<{ beatId: string; blob: Blob; fileName: string; duration: number }>
): Promise<void> {
  const db = await openVaultDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE_VOICES, 'readwrite');
    const vStore = tx.objectStore(STORE_VOICES);
    const idx = vStore.index('projectId');
    const req = idx.getAllKeys(IDBKeyRange.only(AUTOSAVE_PROJECT_ID));
    req.onsuccess = () => {
      for (const k of req.result || []) {
        vStore.delete(k);
      }
      const now = Date.now();
      for (const c of clips) {
        if (!isValidBlobRecord(c.blob)) continue;
        vStore.put({
          key: `${AUTOSAVE_PROJECT_ID}::${c.beatId}`,
          projectId: AUTOSAVE_PROJECT_ID,
          beatId: c.beatId,
          fileName: c.fileName,
          duration: c.duration,
          blob: c.blob,
          savedAt: now,
        } satisfies PersistedVoiceBlob);
      }
    };
    await new Promise<void>((res) => {
      tx.oncomplete = () => res();
      tx.onerror = () => res();
    });
  } catch {
    // ignore
  }
}

export async function saveMusicStemToVault(
  projectId: string,
  blob: Blob,
  fileName: string,
  duration: number
): Promise<void> {
  if (!isValidBlobRecord(blob)) return;
  const db = await openVaultDb();
  if (!db || !db.objectStoreNames.contains(STORE_MUSIC)) return;
  try {
    const tx = db.transaction(STORE_MUSIC, 'readwrite');
    tx.objectStore(STORE_MUSIC).put({
      projectId,
      fileName,
      duration,
      blob,
      savedAt: Date.now(),
    } satisfies PersistedMusicStem);
    await new Promise<void>((res) => {
      tx.oncomplete = () => res();
      tx.onerror = () => res();
    });
  } catch {
    // ignore quota errors
  }
}

export async function loadMusicStemFromVault(projectId: string): Promise<PersistedMusicStem | null> {
  const db = await openVaultDb();
  if (!db || !db.objectStoreNames.contains(STORE_MUSIC)) return null;
  try {
    const tx = db.transaction(STORE_MUSIC, 'readonly');
    const rec = (await idbRequest(tx.objectStore(STORE_MUSIC).get(projectId))) as PersistedMusicStem | undefined;
    if (!rec || !isValidBlobRecord(rec.blob)) return null;
    return rec;
  } catch {
    return null;
  }
}

export async function deleteMusicStemFromVault(projectId: string): Promise<void> {
  const db = await openVaultDb();
  if (!db || !db.objectStoreNames.contains(STORE_MUSIC)) return;
  try {
    const tx = db.transaction(STORE_MUSIC, 'readwrite');
    tx.objectStore(STORE_MUSIC).delete(projectId);
    await new Promise<void>((res) => {
      tx.oncomplete = () => res();
      tx.onerror = () => res();
    });
  } catch {
    // ignore
  }
}

