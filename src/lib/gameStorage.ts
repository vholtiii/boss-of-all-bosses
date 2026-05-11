/**
 * Reliable game-save storage.
 *
 * Primary: IndexedDB (no quota anxiety, async)
 * Mirror:  localStorage (sync, used for `beforeunload` last-ditch writes
 *          and for legacy migration of pre-IDB saves)
 *
 * Each write keeps a one-deep rolling backup at `${slotKey}__backup`
 * so a corrupt or interrupted write can never wipe a previous save.
 */

import type { SaveGameData } from '@/hooks/useGameSaveLoad';

const DB_NAME = 'mafia-saves';
const DB_VERSION = 1;
const STORE = 'saves';
const LS_PREFIX = 'mafia_game_save_';
const LS_MIRROR_KEY = 'mafia_game_mirror_auto';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

async function idbGet(key: string): Promise<SaveGameData | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as SaveGameData) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key: string, value: SaveGameData): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbKeys(): Promise<string[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAllKeys();
    req.onsuccess = () => resolve((req.result as string[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

/* ---------- Public API ---------- */

export type SlotId = number | 'auto';

const slotKey = (slot: SlotId) => `slot_${slot}`;

/** Quick shape check — refuses to load obviously corrupt data. */
export function isValidSaveData(data: any): data is SaveGameData {
  if (!data || typeof data !== 'object') return false;
  if (!data.gameState || typeof data.gameState !== 'object') return false;
  if (typeof data.saveDate !== 'string') return false;
  if (typeof data.gameVersion !== 'string') return false;
  const gs = data.gameState;
  // Required top-level keys for our game state
  if (typeof gs.playerFamily !== 'string') return false;
  if (typeof gs.turn !== 'number') return false;
  if (!gs.resources || typeof gs.resources !== 'object') return false;
  if (!Array.isArray(gs.hexMap) && !Array.isArray(gs.hexGrid)) return false;
  return true;
}

/** Read a slot, falling back to its backup on corruption. */
export async function readSlot(slot: SlotId): Promise<{
  data: SaveGameData | null;
  fromBackup: boolean;
}> {
  const key = slotKey(slot);
  try {
    const primary = await idbGet(key);
    if (primary && isValidSaveData(primary)) return { data: primary, fromBackup: false };
  } catch (e) {
    console.warn('[gameStorage] primary read failed', slot, e);
  }
  try {
    const backup = await idbGet(key + '__backup');
    if (backup && isValidSaveData(backup)) return { data: backup, fromBackup: true };
  } catch (e) {
    console.warn('[gameStorage] backup read failed', slot, e);
  }
  return { data: null, fromBackup: false };
}

/**
 * Write a slot. Steps:
 *   1. Move the existing payload to `${slot}__backup` (one-deep rolling backup).
 *   2. Write the new payload to the primary key.
 *   3. For the autosave slot, also mirror a small marker into localStorage
 *      so `beforeunload` has something synchronous to fall back on.
 */
export async function writeSlot(slot: SlotId, data: SaveGameData): Promise<void> {
  const key = slotKey(slot);
  // Backup existing
  try {
    const existing = await idbGet(key);
    if (existing) await idbPut(key + '__backup', existing);
  } catch (e) {
    console.warn('[gameStorage] backup-before-write failed', slot, e);
  }
  await idbPut(key, data);

  if (slot === 'auto') {
    // Mirror to localStorage as a sync emergency copy.
    try {
      localStorage.setItem(LS_MIRROR_KEY, JSON.stringify(data));
    } catch (e) {
      // Quota — drop the mirror, IndexedDB still has the truth.
      try { localStorage.removeItem(LS_MIRROR_KEY); } catch {}
    }
  }
}

export async function deleteSlot(slot: SlotId): Promise<void> {
  const key = slotKey(slot);
  await idbDelete(key);
  try { await idbDelete(key + '__backup'); } catch {}
  if (slot === 'auto') {
    try { localStorage.removeItem(LS_MIRROR_KEY); } catch {}
  }
}

export async function listSlots(): Promise<SlotId[]> {
  try {
    const keys = await idbKeys();
    return keys
      .filter(k => k.startsWith('slot_') && !k.endsWith('__backup'))
      .map(k => {
        const raw = k.slice(5);
        return raw === 'auto' ? 'auto' : Number(raw);
      });
  } catch {
    return [];
  }
}

/**
 * Synchronous emergency write used inside `beforeunload`. IndexedDB
 * transactions are not guaranteed to commit during unload, so we write
 * a single localStorage entry and let `migrateLegacySaves` pull it in
 * on the next session.
 */
export function emergencyMirrorAuto(data: SaveGameData): void {
  try {
    localStorage.setItem(LS_MIRROR_KEY, JSON.stringify(data));
  } catch {
    // Best-effort only.
  }
}

/**
 * One-time migration:
 *   - Pulls any pre-IDB saves stored under `mafia_game_save_<n>` into IDB.
 *   - Promotes the LS emergency mirror into the auto slot if it's newer.
 */
export async function migrateLegacySaves(): Promise<void> {
  // Legacy slot keys
  for (let i = 0; i <= 5; i++) {
    const lsKey = `${LS_PREFIX}${i}`;
    let raw: string | null = null;
    try { raw = localStorage.getItem(lsKey); } catch { continue; }
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (!isValidSaveData(parsed)) continue;
      const slot: SlotId = i === 0 ? 'auto' : i;
      const existing = await idbGet(slotKey(slot));
      if (!existing) {
        await idbPut(slotKey(slot), parsed);
      }
      // Leave the LS copy in place; harmless and acts as another backup.
    } catch {
      // ignore corrupt legacy entry
    }
  }

  // Promote emergency mirror if newer than current auto.
  try {
    const raw = localStorage.getItem(LS_MIRROR_KEY);
    if (!raw) return;
    const mirror = JSON.parse(raw);
    if (!isValidSaveData(mirror)) return;
    const current = await idbGet(slotKey('auto'));
    const mirrorTime = Date.parse(mirror.saveDate);
    const currentTime = current ? Date.parse(current.saveDate) : 0;
    if (mirrorTime > currentTime) {
      await idbPut(slotKey('auto'), mirror);
    }
  } catch {
    // ignore
  }
}
