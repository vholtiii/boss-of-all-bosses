import { useState, useCallback } from 'react';

interface Territory {
  q: number;
  r: number;
  s: number;
  district: 'Little Italy' | 'Bronx' | 'Brooklyn' | 'Queens' | 'Manhattan' | 'Staten Island';
  family: 'neutral' | 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  business?: {
    type: 'casino' | 'speakeasy' | 'restaurant' | 'docks' | 'protection';
    income: number;
  };
  capo?: {
    name: string;
    loyalty: number;
    strength: number;
    family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  };
}

interface MafiaGameState {
  playerFamily: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  turn: number;
  resources: {
    money: number;
    respect: number;
    soldiers: number;
    influence: number;
  };
  selectedTerritory?: {
    district: string;
    family: string;
    business?: {
      type: string;
      income: number;
    };
    capo?: {
      name: string;
      loyalty: number;
      strength: number;
    };
  } | null;
  familyControl: {
    gambino: number;
    genovese: number;
    lucchese: number;
    bonanno: number;
    colombo: number;
  };
}

const initialGameState: MafiaGameState = {
  playerFamily: 'gambino', // Player starts as Gambino family
  turn: 1,
  resources: {
    money: 50000,
    respect: 25,
    soldiers: 15,
    influence: 10
  },
  selectedTerritory: null,
  familyControl: {
    gambino: 25, // Player starts with some control
    genovese: 22,
    lucchese: 18,
    bonanno: 20,
    colombo: 15
  }
};

export const useMafiaGameState = () => {
  const [gameState, setGameState] = useState<MafiaGameState>(initialGameState);

  const endTurn = useCallback(() => {
    setGameState(prevState => {
      const newState = { ...prevState };
      
      // Advance turn
      newState.turn += 1;
      
      // Generate income from controlled territories
      const incomeBonus = Math.floor(prevState.familyControl.gambino * 500);
      newState.resources.money += incomeBonus;
      
      // Slightly adjust family control (simulate AI moves)
      const families: (keyof typeof newState.familyControl)[] = ['genovese', 'lucchese', 'bonanno', 'colombo'];
      families.forEach(family => {
        const change = Math.floor(Math.random() * 6) - 3; // -3 to +3 change
        newState.familyControl[family] = Math.max(0, Math.min(100, newState.familyControl[family] + change));
      });
      
      // Normalize family control to 100%
      const totalControl = Object.values(newState.familyControl).reduce((sum, control) => sum + control, 0);
      if (totalControl !== 100) {
        const factor = 100 / totalControl;
        Object.keys(newState.familyControl).forEach(family => {
          newState.familyControl[family as keyof typeof newState.familyControl] = 
            Math.round(newState.familyControl[family as keyof typeof newState.familyControl] * factor);
        });
      }
      
      // Clear selections
      newState.selectedTerritory = null;
      
      return newState;
    });
  }, []);

  const selectTerritory = useCallback((territory: Territory) => {
    setGameState(prevState => ({
      ...prevState,
      selectedTerritory: {
        district: territory.district,
        family: territory.family,
        business: territory.business ? {
          type: territory.business.type,
          income: territory.business.income
        } : undefined,
        capo: territory.capo ? {
          name: territory.capo.name,
          loyalty: territory.capo.loyalty,
          strength: territory.capo.strength
        } : undefined
      }
    }));
  }, []);

  const performAction = useCallback((action: string) => {
    console.log(`Performing mafia action: ${action}`);
    
    setGameState(prevState => {
      const newState = { ...prevState };
      
      switch (action) {
        case 'takeover':
          if (newState.resources.soldiers >= 5 && newState.resources.money >= 10000) {
            // Attempt takeover - costs soldiers and money
            newState.resources.soldiers -= 5;
            newState.resources.money -= 10000;
            newState.resources.respect += 5;
            
            // Increase player family control slightly
            newState.familyControl.gambino = Math.min(100, newState.familyControl.gambino + 3);
            
            // Decrease a random rival family
            const rivals: (keyof typeof newState.familyControl)[] = ['genovese', 'lucchese', 'bonanno', 'colombo'];
            const targetFamily = rivals[Math.floor(Math.random() * rivals.length)];
            newState.familyControl[targetFamily] = Math.max(0, newState.familyControl[targetFamily] - 3);
          }
          break;
          
        case 'negotiate':
          if (newState.resources.money >= 5000) {
            // Peaceful negotiation - costs money but builds respect
            newState.resources.money -= 5000;
            newState.resources.respect += 3;
            newState.resources.influence += 2;
          }
          break;
          
        case 'sabotage':
          if (newState.resources.soldiers >= 2) {
            // Sabotage - costs soldiers, reduces rival influence
            newState.resources.soldiers -= 2;
            newState.resources.respect += 1;
            
            // Damage rival family slightly
            const rivals: (keyof typeof newState.familyControl)[] = ['genovese', 'lucchese', 'bonanno', 'colombo'];
            const targetFamily = rivals[Math.floor(Math.random() * rivals.length)];
            newState.familyControl[targetFamily] = Math.max(0, newState.familyControl[targetFamily] - 2);
            newState.familyControl.gambino = Math.min(100, newState.familyControl.gambino + 1);
          }
          break;
      }
      
      return newState;
    });
  }, []);

  // Check win condition - player needs 60%+ control to become Boss of All Bosses
  const checkWinCondition = useCallback(() => {
    return gameState.familyControl.gambino >= 60;
  }, [gameState.familyControl.gambino]);

  return {
    gameState,
    endTurn,
    selectTerritory,
    performAction,
    checkWinCondition,
    isWinner: checkWinCondition()
  };
};