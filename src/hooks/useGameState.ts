import { useState, useCallback } from 'react';

interface HexTile {
  q: number;
  r: number;
  s: number;
  terrain: 'plains' | 'forest' | 'mountain' | 'water';
  unit?: {
    type: 'infantry' | 'tank' | 'artillery';
    player: 1 | 2;
  };
}

interface GameState {
  currentPlayer: 1 | 2;
  turn: number;
  resources: {
    player1: { fuel: number; ammo: number; supplies: number };
    player2: { fuel: number; ammo: number; supplies: number };
  };
  selectedUnit?: {
    type: 'infantry' | 'tank' | 'artillery';
    health: number;
    movement: number;
    attack: number;
  } | null;
  selectedHex?: HexTile | null;
}

const initialGameState: GameState = {
  currentPlayer: 1,
  turn: 1,
  resources: {
    player1: { fuel: 100, ammo: 50, supplies: 75 },
    player2: { fuel: 100, ammo: 50, supplies: 75 }
  },
  selectedUnit: null,
  selectedHex: null
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const endTurn = useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      currentPlayer: prevState.currentPlayer === 1 ? 2 : 1,
      turn: prevState.currentPlayer === 2 ? prevState.turn + 1 : prevState.turn,
      selectedUnit: null,
      selectedHex: null
    }));
  }, []);

  const selectHex = useCallback((hex: HexTile) => {
    setGameState(prevState => {
      const newState = { ...prevState, selectedHex: hex };
      
      // If the hex contains a unit belonging to the current player, select it
      if (hex.unit && hex.unit.player === prevState.currentPlayer) {
        const unitStats = {
          infantry: { health: 85, movement: 3, attack: 2 },
          tank: { health: 100, movement: 2, attack: 4 },
          artillery: { health: 60, movement: 1, attack: 6 }
        };
        
        newState.selectedUnit = {
          type: hex.unit.type,
          ...unitStats[hex.unit.type]
        };
      } else if (hex.unit && hex.unit.player !== prevState.currentPlayer) {
        // Enemy unit selected - could initiate attack
        newState.selectedUnit = null;
      } else {
        // Empty hex selected
        newState.selectedUnit = null;
      }
      
      return newState;
    });
  }, []);

  const performAction = useCallback((action: string) => {
    console.log(`Performing action: ${action}`);
    // Here you would implement the actual game logic for moves, attacks, etc.
    
    // For now, just consume some resources as an example
    if (action === 'move' || action === 'attack') {
      setGameState(prevState => {
        const newState = { ...prevState };
        const playerKey = `player${prevState.currentPlayer}` as keyof typeof prevState.resources;
        
        if (action === 'move') {
          newState.resources[playerKey].fuel = Math.max(0, newState.resources[playerKey].fuel - 5);
        } else if (action === 'attack') {
          newState.resources[playerKey].ammo = Math.max(0, newState.resources[playerKey].ammo - 10);
        }
        
        return newState;
      });
    }
  }, []);

  return {
    gameState,
    endTurn,
    selectHex,
    performAction
  };
};