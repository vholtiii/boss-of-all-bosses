import { useCallback } from 'react';
import { EnhancedMafiaGameState } from './useEnhancedMafiaGameState';

export interface SaveGameData {
  gameState: EnhancedMafiaGameState;
  saveDate: string;
  gameVersion: string;
  playerName?: string;
}

export const useGameSaveLoad = () => {
  const SAVE_KEY_PREFIX = 'mafia_game_save_';
  const CURRENT_VERSION = '1.0.0';

  // Save game to localStorage
  const saveGame = useCallback((gameState: EnhancedMafiaGameState, slot: number = 1, playerName?: string) => {
    try {
      const saveData: SaveGameData = {
        gameState,
        saveDate: new Date().toISOString(),
        gameVersion: CURRENT_VERSION,
        playerName,
      };

      const saveKey = `${SAVE_KEY_PREFIX}${slot}`;
      localStorage.setItem(saveKey, JSON.stringify(saveData));
      
      return { success: true, message: `Game saved to slot ${slot}` };
    } catch (error) {
      console.error('Failed to save game:', error);
      return { success: false, message: 'Failed to save game' };
    }
  }, []);

  // Load game from localStorage
  const loadGame = useCallback((slot: number = 1) => {
    try {
      const saveKey = `${SAVE_KEY_PREFIX}${slot}`;
      const saveDataString = localStorage.getItem(saveKey);
      
      if (!saveDataString) {
        return { success: false, message: 'No save data found' };
      }

      const saveData: SaveGameData = JSON.parse(saveDataString);
      
      // Check version compatibility
      if (saveData.gameVersion !== CURRENT_VERSION) {
        return { 
          success: false, 
          message: `Save file version ${saveData.gameVersion} is not compatible with current version ${CURRENT_VERSION}` 
        };
      }

      return { 
        success: true, 
        gameState: saveData.gameState,
        saveDate: saveData.saveDate,
        playerName: saveData.playerName,
        message: 'Game loaded successfully' 
      };
    } catch (error) {
      console.error('Failed to load game:', error);
      return { success: false, message: 'Failed to load game' };
    }
  }, []);

  // Get all available save slots
  const getSaveSlots = useCallback(() => {
    const slots: Array<{ slot: number; saveData?: SaveGameData; exists: boolean }> = [];
    
    for (let i = 1; i <= 5; i++) {
      const saveKey = `${SAVE_KEY_PREFIX}${i}`;
      const saveDataString = localStorage.getItem(saveKey);
      
      if (saveDataString) {
        try {
          const saveData: SaveGameData = JSON.parse(saveDataString);
          slots.push({ slot: i, saveData, exists: true });
        } catch (error) {
          slots.push({ slot: i, exists: false });
        }
      } else {
        slots.push({ slot: i, exists: false });
      }
    }
    
    return slots;
  }, []);

  // Delete a save slot
  const deleteSave = useCallback((slot: number) => {
    try {
      const saveKey = `${SAVE_KEY_PREFIX}${slot}`;
      localStorage.removeItem(saveKey);
      return { success: true, message: `Save slot ${slot} deleted` };
    } catch (error) {
      console.error('Failed to delete save:', error);
      return { success: false, message: 'Failed to delete save' };
    }
  }, []);

  // Auto-save functionality
  const autoSave = useCallback((gameState: EnhancedMafiaGameState) => {
    return saveGame(gameState, 0, 'Auto Save');
  }, [saveGame]);

  // Export save data as JSON
  const exportSave = useCallback((slot: number = 1) => {
    try {
      const saveKey = `${SAVE_KEY_PREFIX}${slot}`;
      const saveDataString = localStorage.getItem(saveKey);
      
      if (!saveDataString) {
        return { success: false, message: 'No save data found' };
      }

      const saveData: SaveGameData = JSON.parse(saveDataString);
      const exportData = JSON.stringify(saveData, null, 2);
      
      // Create and download file
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

  // Import save data from JSON
  const importSave = useCallback((file: File, slot: number = 1) => {
    return new Promise<{ success: boolean; message: string }>((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const saveData: SaveGameData = JSON.parse(e.target?.result as string);
          
          // Validate save data structure
          if (!saveData.gameState || !saveData.saveDate || !saveData.gameVersion) {
            resolve({ success: false, message: 'Invalid save file format' });
            return;
          }
          
          // Save to specified slot
          const saveKey = `${SAVE_KEY_PREFIX}${slot}`;
          localStorage.setItem(saveKey, JSON.stringify(saveData));
          
          resolve({ success: true, message: 'Save data imported successfully' });
        } catch (error) {
          console.error('Failed to import save:', error);
          resolve({ success: false, message: 'Failed to import save file' });
        }
      };
      
      reader.onerror = () => {
        resolve({ success: false, message: 'Failed to read file' });
      };
      
      reader.readAsText(file);
    });
  }, []);

  return {
    saveGame,
    loadGame,
    getSaveSlots,
    deleteSave,
    autoSave,
    exportSave,
    importSave,
  };
};
