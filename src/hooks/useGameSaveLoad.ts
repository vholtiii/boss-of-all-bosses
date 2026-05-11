import { useCallback, useEffect, useRef, useState } from 'react';
import { EnhancedMafiaGameState } from './useEnhancedMafiaGameState';
import {
  readSlot,
  writeSlot,
  deleteSlot,
  listSlots,
  isValidSaveData,
  emergencyMirrorAuto,
  migrateLegacySaves,
  type SlotId,
} from '@/lib/gameStorage';
import { CURRENT_SCHEMA_VERSION, migrateState } from '@/lib/saveMigrations';
import { useAuth } from '@/hooks/useAuth';
import {
  cloudListSlots,
  cloudWriteSlot,
  cloudDeleteSlot,
  type CloudSlotEntry,
} from '@/lib/cloudSaveAdapter';

export interface SaveGameData {
  gameState: EnhancedMafiaGameState;
  saveDate: string;
  gameVersion: string;
  /** Schema version for migration. Optional for backward-compat with old saves. */
  schemaVersion?: number;
  playerName?: string;
}

export type { SlotId };

const CURRENT_VERSION = '1.0.0';
const AUTOSAVE_MIN_INTERVAL_MS = 4000;

let lastAutoSaveAt = 0;

export interface SaveSlotInfo {
  slot: SlotId;
  /** Best available save (whichever of local/cloud is newer). */
  saveData?: SaveGameData;
  exists: boolean;
  /** True if a local copy exists. */
  hasLocal: boolean;
  /** True if a cloud copy exists. */
  hasCloud: boolean;
  /** True if local and cloud both exist with different saveDate. */
  conflict: boolean;
  /** "local" or "cloud" — which side is newer. */
  newer: 'local' | 'cloud' | 'equal' | null;
  cloudSaveDate?: string;
  localSaveDate?: string;
}

export const useGameSaveLoad = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [cloudSyncing, setCloudSyncing] = useState(false);

  // One-time legacy migration on first mount
  const migratedRef = useRef(false);
  useEffect(() => {
    if (migratedRef.current) return;
    migratedRef.current = true;
    migrateLegacySaves().catch(err => console.warn('[save] migration failed', err));
  }, []);

  /** Apply schema migrations and persist the migrated payload back to the slot. */
  const migrateAndPersist = useCallback(async (
    slot: SlotId,
    data: SaveGameData,
  ): Promise<SaveGameData> => {
    const fromVersion = data.schemaVersion ?? 1;
    if (fromVersion === CURRENT_SCHEMA_VERSION) return data;
    const result = migrateState(data.gameState, fromVersion);
    if (!result.migrated) return data;
    const upgraded: SaveGameData = {
      ...data,
      gameState: result.state,
      schemaVersion: result.toVersion,
    };
    // Persist back so next load is a no-op
    try { await writeSlot(slot, upgraded); } catch (e) { console.warn('[save] re-persist after migration failed', e); }
    return upgraded;
  }, []);

  const saveGame = useCallback(async (
    gameState: EnhancedMafiaGameState,
    slot: SlotId = 1,
    playerName?: string,
  ) => {
    if (!userId) {
      return { success: false, message: 'Sign in to save your game.' };
    }
    try {
      const saveData: SaveGameData = {
        gameState,
        saveDate: new Date().toISOString(),
        gameVersion: CURRENT_VERSION,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        playerName,
      };
      await writeSlot(slot, saveData);
      try {
        await cloudWriteSlot(userId, slot, saveData, CURRENT_SCHEMA_VERSION);
      } catch (e) {
        console.warn('[save] cloud write failed', e);
      }
      // Best-effort profile bump
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: prof } = await supabase
          .from('profiles')
          .select('total_saves')
          .eq('user_id', userId)
          .maybeSingle();
        await supabase
          .from('profiles')
          .update({
            total_saves: (prof?.total_saves ?? 0) + 1,
            last_seen_at: new Date().toISOString(),
            last_family_played: gameState.playerFamily as any,
          })
          .eq('user_id', userId);
      } catch {}
      return { success: true, message: `Game saved to slot ${slot}` };
    } catch (error) {
      console.error('Failed to save game:', error);
      return { success: false, message: 'Failed to save game' };
    }
  }, [userId]);
  const loadGame = useCallback(async (slot: SlotId = 1, source: 'local' | 'cloud' = 'local') => {
    try {
      let data: SaveGameData | null = null;
      let fromBackup = false;

      if (source === 'cloud' && userId) {
        const { cloudReadSlot } = await import('@/lib/cloudSaveAdapter');
        const cloud = await cloudReadSlot(userId, slot);
        if (cloud) {
          data = { ...cloud.saveData, schemaVersion: cloud.schemaVersion };
          // Pull cloud copy into local so future loads are fast
          try { await writeSlot(slot, data); } catch {}
        }
      } else {
        const r = await readSlot(slot);
        data = r.data;
        fromBackup = r.fromBackup;
      }

      if (!data) return { success: false, message: 'No save data found' };

      // Major game-version compatibility check (cosmetic only now)
      const savedMajor = parseInt(data.gameVersion?.split('.')[0] || '0');
      const currentMajor = parseInt(CURRENT_VERSION.split('.')[0]);
      if (savedMajor !== currentMajor) {
        return {
          success: false,
          message: `Save file version ${data.gameVersion} is not compatible with current version ${CURRENT_VERSION}`,
        };
      }

      // Run schema migrations
      let migrated = data;
      try {
        migrated = await migrateAndPersist(slot, data);
      } catch (e: any) {
        console.error('[save] migration failed', e);
        return { success: false, message: e?.message ?? 'Save migration failed' };
      }

      const versionWarning = migrated.gameVersion !== CURRENT_VERSION
        ? ` (saved with v${migrated.gameVersion})`
        : '';
      const backupNote = fromBackup ? ' — recovered from backup' : '';
      const migratedNote = (migrated.schemaVersion ?? 1) !== (data.schemaVersion ?? 1)
        ? ' — upgraded to current format'
        : '';

      return {
        success: true,
        gameState: migrated.gameState,
        saveDate: migrated.saveDate,
        playerName: migrated.playerName,
        message: `Game loaded successfully${versionWarning}${backupNote}${migratedNote}`,
      };
    } catch (error) {
      console.error('Failed to load game:', error);
      return { success: false, message: 'Failed to load game' };
    }
  }, [userId, migrateAndPersist]);

  const getSaveSlots = useCallback(async (): Promise<SaveSlotInfo[]> => {
    const slotIds: SlotId[] = ['auto', 1, 2, 3, 4, 5];
    const localPresent = new Set(await listSlots());

    // Pull cloud catalog when signed in
    let cloudByKey = new Map<string, CloudSlotEntry>();
    if (userId) {
      try {
        const cloud = await cloudListSlots(userId);
        cloudByKey = new Map(cloud.map(c => [String(c.slot), c]));
      } catch (e) {
        console.warn('[save] cloud list failed', e);
      }
    }

    const out: SaveSlotInfo[] = [];
    for (const id of slotIds) {
      const key = String(id);
      let local: SaveGameData | undefined;
      if (localPresent.has(id)) {
        const { data } = await readSlot(id);
        if (data) local = data;
      }
      const cloud = cloudByKey.get(key);
      const hasLocal = !!local;
      const hasCloud = !!cloud;

      let saveData = local;
      let newer: SaveSlotInfo['newer'] = null;
      if (hasLocal && hasCloud) {
        const lt = Date.parse(local!.saveDate);
        const ct = Date.parse(cloud!.saveDate);
        if (ct > lt) { saveData = cloud!.saveData; newer = 'cloud'; }
        else if (lt > ct) { newer = 'local'; }
        else { newer = 'equal'; }
      } else if (hasCloud) {
        saveData = cloud!.saveData;
        newer = 'cloud';
      } else if (hasLocal) {
        newer = 'local';
      }
      const conflict = hasLocal && hasCloud && local!.saveDate !== cloud!.saveDate;
      out.push({
        slot: id,
        saveData,
        exists: hasLocal || hasCloud,
        hasLocal,
        hasCloud,
        conflict,
        newer,
        cloudSaveDate: cloud?.saveDate,
        localSaveDate: local?.saveDate,
      });
    }
    return out;
  }, [userId]);

  const deleteSave = useCallback(async (slot: SlotId, scope: 'both' | 'local' | 'cloud' = 'both') => {
    try {
      if (scope !== 'cloud') await deleteSlot(slot);
      if (scope !== 'local' && userId) await cloudDeleteSlot(userId, slot);
      return { success: true, message: `Save slot ${slot} deleted` };
    } catch (error) {
      console.error('Failed to delete save:', error);
      return { success: false, message: 'Failed to delete save' };
    }
  }, [userId]);

  /** Throttled autosave — call freely, only writes once per few seconds. */
  const autoSave = useCallback(async (gameState: EnhancedMafiaGameState) => {
    const now = Date.now();
    if (now - lastAutoSaveAt < AUTOSAVE_MIN_INTERVAL_MS) {
      return { success: false, message: 'throttled' };
    }
    lastAutoSaveAt = now;
    return saveGame(gameState, 'auto', 'Auto Save');
  }, [saveGame]);

  /** Synchronous emergency save for `beforeunload`. */
  const emergencySaveAuto = useCallback((gameState: EnhancedMafiaGameState) => {
    try {
      emergencyMirrorAuto({
        gameState,
        saveDate: new Date().toISOString(),
        gameVersion: CURRENT_VERSION,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        playerName: 'Auto Save',
      });
    } catch {
      // best effort
    }
  }, []);

  /** Push every local save up to cloud. Used on sign-in. */
  const syncLocalToCloud = useCallback(async () => {
    if (!userId) return;
    setCloudSyncing(true);
    try {
      const localIds = await listSlots();
      for (const id of localIds) {
        const { data } = await readSlot(id);
        if (!data) continue;
        await cloudWriteSlot(userId, id, data, data.schemaVersion ?? CURRENT_SCHEMA_VERSION);
      }
    } catch (e) {
      console.warn('[save] syncLocalToCloud failed', e);
    } finally {
      setCloudSyncing(false);
    }
  }, [userId]);

  // On sign-in, push local saves up so the cloud always has the latest.
  useEffect(() => {
    if (userId) {
      syncLocalToCloud();
    }
  }, [userId, syncLocalToCloud]);

  const exportSave = useCallback(async (slot: SlotId = 1) => {
    try {
      const { data } = await readSlot(slot);
      if (!data) return { success: false, message: 'No save data found' };
      const exportData = JSON.stringify(data, null, 2);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mafia_game_slot_${slot}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true, message: 'Save data exported successfully' };
    } catch (error) {
      console.error('Failed to export save:', error);
      return { success: false, message: 'Failed to export save' };
    }
  }, []);

  const importSave = useCallback((file: File, slot: SlotId = 1) => {
    return new Promise<{ success: boolean; message: string }>((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          if (!isValidSaveData(parsed)) {
            resolve({ success: false, message: 'Invalid save file format' });
            return;
          }
          await writeSlot(slot, parsed);
          if (userId) {
            cloudWriteSlot(userId, slot, parsed, parsed.schemaVersion ?? 1).catch(() => {});
          }
          resolve({ success: true, message: 'Save data imported successfully' });
        } catch (error) {
          console.error('Failed to import save:', error);
          resolve({ success: false, message: 'Failed to import save file' });
        }
      };
      reader.onerror = () => resolve({ success: false, message: 'Failed to read file' });
      reader.readAsText(file);
    });
  }, [userId]);

  return {
    saveGame,
    loadGame,
    getSaveSlots,
    deleteSave,
    autoSave,
    emergencySaveAuto,
    exportSave,
    importSave,
    cloudSyncing,
    isSignedIn: !!userId,
  };
};
