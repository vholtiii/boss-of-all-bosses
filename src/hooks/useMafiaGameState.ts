import { useState, useCallback } from 'react';
import { Business, BusinessFinances, BusinessAction, LegalStatus, Charge, Lawyer } from '@/types/business';

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
    politicalPower: number;
    loyalty: number;
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
  businesses: Business[];
  finances: BusinessFinances;
  legalStatus: LegalStatus;
}

const initialGameState: MafiaGameState = {
  playerFamily: 'gambino', // Player starts as Gambino family
  turn: 1,
  resources: {
    money: 50000,
    respect: 25,
    soldiers: 15,
    influence: 10,
    politicalPower: 30,
    loyalty: 75
  },
  selectedTerritory: null,
  familyControl: {
    gambino: 25, // Player starts with some control
    genovese: 22,
    lucchese: 18,
    bonanno: 20,
    colombo: 15
  },
  businesses: [],
  finances: {
    totalIncome: 0,
    totalExpenses: 0,
    legalProfit: 0,
    illegalProfit: 0,
    totalProfit: 0,
    dirtyMoney: 0,
    cleanMoney: 0,
    legalCosts: 0
  },
  legalStatus: {
    charges: [],
    lawyer: null,
    jailTime: 0,
    prosecutionRisk: 0,
    totalLegalCosts: 0
  }
};

export const useMafiaGameState = () => {
  const [gameState, setGameState] = useState<MafiaGameState>(initialGameState);

  const endTurn = useCallback(() => {
    setGameState(prevState => {
      const newState = { ...prevState };
      
      // If in jail, apply penalties
      if (newState.legalStatus.jailTime > 0) {
        newState.legalStatus.jailTime -= 1;
        // Jail penalties per turn
        newState.resources.money = Math.max(0, newState.resources.money - 5000);
        newState.resources.influence = Math.max(0, newState.resources.influence - 2);
        newState.resources.soldiers = Math.max(0, newState.resources.soldiers - 1);
        
        if (newState.legalStatus.jailTime === 0) {
          // Released from jail, clear all charges
          newState.legalStatus.charges = [];
        }
        
        // Skip normal turn processing while in jail
        return newState;
      }
      
      // Advance turn
      newState.turn += 1;
      
      // Generate income from controlled territories
      const incomeBonus = Math.floor(prevState.familyControl.gambino * 500);
      newState.resources.money += incomeBonus;
      
      // Business income generation
      const legalBusinesses = newState.businesses.filter(b => b.type === 'legal');
      const illegalBusinesses = newState.businesses.filter(b => b.type === 'illegal');

      // Legal business income (goes directly to clean money)
      const legalIncome = legalBusinesses.reduce((sum, b) => {
        const baseProfit = b.monthlyIncome - b.monthlyExpenses;
        const extortionBonus = b.isExtorted ? baseProfit * b.extortionRate : 0;
        return sum + baseProfit + extortionBonus;
      }, 0);
      
      // Subtract lawyer fees from legal income
      const netLegalIncome = legalIncome - newState.legalStatus.totalLegalCosts;
      if (netLegalIncome > 0) {
        newState.resources.money += netLegalIncome;
        newState.finances.cleanMoney += netLegalIncome;
      }

      // Illegal business income (goes to dirty money)
      const illegalIncome = illegalBusinesses.reduce((sum, b) => 
        sum + (b.monthlyIncome - b.monthlyExpenses), 0
      );
      newState.finances.dirtyMoney += illegalIncome;

      // Check for prosecution if no lawyer and have prosecution risk
      if (!newState.legalStatus.lawyer && newState.legalStatus.prosecutionRisk > 0) {
        const prosecutionChance = Math.random() * 100;
        if (prosecutionChance < newState.legalStatus.prosecutionRisk) {
          // Generate a charge based on illegal businesses
          const chargeTypes = ['racketeering', 'tax_evasion', 'extortion', 'money_laundering'];
          if (illegalBusinesses.some(b => b.category === 'drug_trafficking')) chargeTypes.push('drug_trafficking');
          
          const randomCharge = chargeTypes[Math.floor(Math.random() * chargeTypes.length)];
          const severity = randomCharge === 'murder' || randomCharge === 'drug_trafficking' ? 'federal' : 'felony';
          
          const newCharge: Charge = {
            id: `charge_${Date.now()}`,
            type: randomCharge as Charge['type'],
            severity: severity as Charge['severity'],
            evidence: Math.floor(Math.random() * 60) + 20, // 20-80% evidence
            penalty: {
              jailTime: severity === 'federal' ? 8 : severity === 'felony' ? 4 : 2,
              fine: severity === 'federal' ? 100000 : severity === 'felony' ? 50000 : 10000
            }
          };
          
          newState.legalStatus.charges.push(newCharge);
          
          // Immediate conviction without lawyer
          newState.legalStatus.jailTime = newCharge.penalty.jailTime;
          newState.resources.money = Math.max(0, newState.resources.money - newCharge.penalty.fine);
        }
      }
      
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

  const performBusinessAction = useCallback((action: BusinessAction) => {
    setGameState(prevState => {
      const newState = { ...prevState };
      const businessNames = {
        restaurant: ['Tony\'s Pizzeria', 'Mama Mia Restaurant', 'Little Italy Bistro'],
        laundromat: ['Clean Slate Laundry', 'Fresh Start Cleaners', 'Spotless Services'],
        casino: ['Lucky Seven Casino', 'Golden Dice Club', 'Royal Flush Palace'],
        construction: ['Concrete Kings LLC', 'Steel & Stone Co', 'Foundation Masters'],
        drug_trafficking: ['Street Pharmacy', 'The Corner Store', 'Blue Magic Supply'],
        gambling: ['Back Room Poker', 'Numbers Game HQ', 'High Stakes Club'],
        prostitution: ['Gentleman\'s Club', 'VIP Escorts', 'Diamond Dolls'],
        loan_sharking: ['Fast Cash Solutions', 'Money Now Services', 'Quick Loan Express']
      };

      const districts = ['Little Italy', 'Bronx', 'Brooklyn', 'Queens', 'Manhattan', 'Staten Island'];

      switch (action.type) {
        case 'build_legal':
        case 'build_illegal':
          if (action.businessType) {
            const costs = {
              restaurant: 25000, laundromat: 15000, casino: 50000, construction: 40000,
              drug_trafficking: 30000, gambling: 20000, prostitution: 15000, loan_sharking: 10000
            };
            
            const cost = costs[action.businessType];
            if (newState.resources.money >= cost) {
              const newBusiness: Business = {
                id: `${action.businessType}_${Date.now()}`,
                name: businessNames[action.businessType][Math.floor(Math.random() * businessNames[action.businessType].length)],
                type: action.type === 'build_legal' ? 'legal' : 'illegal',
                category: action.businessType,
                level: 1,
                monthlyIncome: action.type === 'build_legal' ? 
                  Math.floor(cost * 0.15) : Math.floor(cost * 0.25),
                monthlyExpenses: Math.floor(cost * 0.05),
                launderingCapacity: action.type === 'build_legal' ? Math.floor(cost * 0.1) : 0,
                extortionRate: 0,
                isExtorted: false,
                district: districts[Math.floor(Math.random() * districts.length)],
                heatLevel: action.type === 'build_illegal' ? 15 : 5
              };
              
              newState.businesses.push(newBusiness);
              newState.resources.money -= cost;
              newState.resources.respect += 2;
            }
          }
          break;

        case 'upgrade':
          if (action.businessId) {
            const business = newState.businesses.find(b => b.id === action.businessId);
            if (business && business.level < 5) {
              const upgradeCost = business.level * 15000;
              if (newState.resources.money >= upgradeCost) {
                business.level += 1;
                business.monthlyIncome = Math.floor(business.monthlyIncome * 1.4);
                business.launderingCapacity = Math.floor(business.launderingCapacity * 1.3);
                newState.resources.money -= upgradeCost;
              }
            }
          }
          break;

        case 'extort':
          if (action.businessId) {
            const business = newState.businesses.find(b => b.id === action.businessId);
            if (business && !business.isExtorted) {
              business.isExtorted = true;
              business.extortionRate = newState.resources.respect >= 50 ? 0.5 : 0.25;
              newState.resources.respect += 3;
            }
          }
          break;

        case 'launder':
          const totalLaunderingCapacity = newState.businesses
            .filter(b => b.type === 'legal')
            .reduce((sum, b) => sum + b.launderingCapacity, 0);
          
          const amountToLaunder = Math.min(newState.finances.dirtyMoney, totalLaunderingCapacity);
          newState.finances.dirtyMoney -= amountToLaunder;
          newState.finances.cleanMoney += amountToLaunder;
          newState.resources.money += amountToLaunder;
          break;

        case 'collect':
          if (action.businessId) {
            const business = newState.businesses.find(b => b.id === action.businessId);
            if (business && business.type === 'illegal') {
              const profit = business.monthlyIncome - business.monthlyExpenses;
              newState.finances.dirtyMoney += profit;
              newState.resources.respect += 1;
            }
          }
        case 'hire_lawyer':
          if (action.lawyerId) {
            const availableLawyers = [
              { id: 'public_defender', name: 'Public Defender', tier: 'public_defender' as const, monthlyFee: 0, skillLevel: 30, specialties: ['racketeering' as const, 'tax_evasion' as const] },
              { id: 'local_attorney', name: 'Tommy "The Shark" Rosetti', tier: 'local' as const, monthlyFee: 5000, skillLevel: 60, specialties: ['extortion' as const, 'racketeering' as const, 'money_laundering' as const] },
              { id: 'prestigious_firm', name: 'Goldman & Associates', tier: 'prestigious' as const, monthlyFee: 15000, skillLevel: 85, specialties: ['tax_evasion' as const, 'money_laundering' as const, 'racketeering' as const] },
              { id: 'elite_counsel', name: 'Clarence "The Fixer" Mitchell', tier: 'elite' as const, monthlyFee: 35000, skillLevel: 95, specialties: ['murder' as const, 'drug_trafficking' as const, 'racketeering' as const, 'money_laundering' as const] }
            ];
            
            const lawyer = availableLawyers.find(l => l.id === action.lawyerId);
            if (lawyer && (lawyer.monthlyFee === 0 || newState.finances.legalProfit >= lawyer.monthlyFee)) {
              newState.legalStatus.lawyer = lawyer;
              newState.legalStatus.totalLegalCosts = lawyer.monthlyFee;
            }
          }
          break;

        case 'fire_lawyer':
          newState.legalStatus.lawyer = null;
          newState.legalStatus.totalLegalCosts = 0;
          break;
      }

      // Recalculate finances
      const legalBusinesses = newState.businesses.filter(b => b.type === 'legal');
      const illegalBusinesses = newState.businesses.filter(b => b.type === 'illegal');

      newState.finances.legalProfit = legalBusinesses.reduce((sum, b) => {
        const baseProfit = b.monthlyIncome - b.monthlyExpenses;
        const extortionBonus = b.isExtorted ? baseProfit * b.extortionRate : 0;
        return sum + baseProfit + extortionBonus;
      }, 0) - newState.legalStatus.totalLegalCosts; // Subtract lawyer fees from legal profit

      newState.finances.illegalProfit = illegalBusinesses.reduce((sum, b) => 
        sum + (b.monthlyIncome - b.monthlyExpenses), 0
      );

      newState.finances.totalProfit = newState.finances.legalProfit + newState.finances.illegalProfit;
      newState.finances.totalIncome = newState.businesses.reduce((sum, b) => sum + b.monthlyIncome, 0);
      newState.finances.totalExpenses = newState.businesses.reduce((sum, b) => sum + b.monthlyExpenses, 0) + newState.legalStatus.totalLegalCosts;
      newState.finances.legalCosts = newState.legalStatus.totalLegalCosts;

      // Calculate prosecution risk based on illegal businesses and heat levels
      const totalHeat = illegalBusinesses.reduce((sum, b) => sum + b.heatLevel, 0);
      newState.legalStatus.prosecutionRisk = Math.min(100, totalHeat / 2);

      return newState;
    });
  }, []);

  return {
    gameState,
    endTurn,
    selectTerritory,
    performAction,
    performBusinessAction,
    checkWinCondition,
    isWinner: checkWinCondition()
  };
};