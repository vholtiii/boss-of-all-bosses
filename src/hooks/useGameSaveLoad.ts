import { useCallback, useEffect, useRef } from 'react';
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

export interface SaveGameData {
  gameState: EnhancedMafiaGameState;
  saveDate: string;
  gameVersion: string;
  playerName?: string;
}

export type { SlotId };

const CURRENT_VERSION = '1.0.0';
const AUTOSAVE_MIN_INTERVAL_MS = 4000;

let lastAutoSaveAt = 0;

export const useGameSaveLoad = () => {
  // One-time legacy migration on first mount
  const migratedRef = useRef(false);
  useEffect(() => {
    if (migratedRef.current) return;
    migratedRef.current = true;
    migrateLegacySaves().catch(err => console.warn('[save] migration failed', err));
  }, []);

  const saveGame = useCallback(async (
    gameState: EnhancedMafiaGameState,
    slot: SlotId = 1,
    playerName?: string,
  ) => {
    try {
      const saveData: SaveGameData = {
        gameState,
        saveDate: new Date().toISOString(),
        gameVersion: CURRENT_VERSION,
        playerName,
      };
      await writeSlot(slot, saveData);
      return { success: true, message: `Game saved to slot ${slot}` };
    } catch (error) {
      console.error('Failed to save game:', error);
      return { success: false, message: 'Failed to save game' };
    }
  }, []);

  const loadGame = useCallback(async (slot: SlotId = 1) => {
    try {
      const { data, fromBackup } = await readSlot(slot);
      if (!data) return { success: false, message: 'No save data found' };

      // Version check
      const savedMajor = parseInt(data.gameVersion?.split('.')[0] || '0');
      const currentMajor = parseInt(CURRENT_VERSION.split('.')[0]);
      if (savedMajor !== currentMajor) {
        return {
          success: false,
          message: `Save file version ${data.gameVersion} is not compatible with current version ${CURRENT_VERSION}`,
        };
      }

      const versionWarning = data.gameVersion !== CURRENT_VERSION
        ? ` (saved with v${data.gameVersion})`
        : '';
      const backupNote = fromBackup ? ' — recovered from backup' : '';

      return {
        success: true,
        gameState: data.gameState,
        saveDate: data.saveDate,
        playerName: data.playerName,
        message: `Game loaded successfully${versionWarning}${backupNote}`,
      };
    } catch (error) {
      console.error('Failed to load game:', error);
      return { success: false, message: 'Failed to load game' };
    }
  }, []);

  const getSaveSlots = useCallback(async () => {
    const slotIds: SlotId[] = ['auto', 1, 2, 3, 4, 5];
    const present = new Set(await listSlots());
    const out: Array<{ slot: SlotId; saveData?: SaveGameData; exists: boolean }> = [];
    for (const id of slotIds) {
      if (present.has(id)) {
        const { data } = await readSlot(id);
        if (data) {
          out.push({ slot: id, saveData: data, exists: true });
          continue;
        }
      }
      out.push({ slot: id, exists: false });
    }
    return out;
  }, []);

  const deleteSave = useCallback(async (slot: SlotId) => {
    try {
      await deleteSlot(slot);
      return { success: true, message: `Save slot ${slot} deleted` };
    } catch (error) {
      console.error('Failed to delete save:', error);
      return { success: false, message: 'Failed to delete save' };
    }
  }, []);

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
        playerName: 'Auto Save',
      });
    } catch {
      // best effort
    }
  }, []);

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
          resolve({ success: true, message: 'Save data imported successfully' });
        } catch (error) {
          console.error('Failed to import save:', error);
          resolve({ success: false, message: 'Failed to import save file' });
        }
      };
      reader.onerror = () => resolve({ success: false, message: 'Failed to read file' });
      reader.readAsText(file);
    });
  }, []);

  return {
    saveGame,
    loadGame,
    getSaveSlots,
    deleteSave,
    autoSave,
    emergencySaveAuto,
    exportSave,
    importSave,
  };
};
