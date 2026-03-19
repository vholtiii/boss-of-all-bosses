import { useState, useCallback, useEffect } from 'react';
import { 
  CombatSystem, 
  EconomySystem, 
  AIOpponent, 
  GameEvent, 
  EnhancedReputationSystem,
  Mission,
  WeatherSystem,
  TechnologySystem,
  SeasonalEvent
} from '@/types/enhanced-mechanics';
import { Business, BusinessFinances, LegalStatus, PoliceHeat } from '@/types/business';
import { ViolentAction } from '@/types/reputation';
import {
  SoldierStats, Hitman, BribeContract, BribeTier, VictoryProgress, VictoryType,
  FAMILY_BONUSES, BRIBE_TIERS, DOC_BUSINESS_TYPES,
  SOLDIER_COST, CAPO_COST, HITMAN_MAINTENANCE_MULTIPLIER, MAX_HITMEN, HITMAN_REQUIREMENTS,
  FamilyBonuses,
} from '@/types/game-mechanics';

// ============ UNIT TYPES ============
export interface DeployedUnit {
  id: string;
  type: 'soldier' | 'capo';
  family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  q: number;
  r: number;
  s: number;
  movesRemaining: number;
  maxMoves: number;
  level: number;
  name?: string;
}

// ============ HEX TILE ============
export interface HexTile {
  q: number;
  r: number;
  s: number;
  district: 'Little Italy' | 'Bronx' | 'Brooklyn' | 'Queens' | 'Manhattan' | 'Staten Island';
  terrain: 'urban' | 'industrial' | 'residential' | 'docks' | 'commercial';
  controllingFamily: 'neutral' | 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  business?: {
    type: string;
    income: number;
    isLegal: boolean;
    heatLevel: number;
    launderingCapacity?: number;
  };
  isHeadquarters?: string;
}

export interface EnhancedMafiaGameState {
  playerFamily: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  turn: number;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  
  resources: {
    money: number;
    respect: number;
    soldiers: number;
    influence: number;
    politicalPower: number;
    loyalty: number;
    researchPoints: number;
  };
  
  hexMap: HexTile[];
  deployedUnits: DeployedUnit[];
  
  // Movement UI state
  movementPhase: boolean;
  selectedUnitId: string | null;
  availableMoveHexes: Array<{ q: number; r: number; s: number }>;
  deployMode: { unitType: 'soldier' | 'capo'; family: string } | null;
  availableDeployHexes: Array<{ q: number; r: number; s: number }>;
  
  headquarters: {
    [family: string]: { q: number; r: number; s: number; district: string };
  };
  
  units: {
    [family: string]: {
      soldiers: Array<{ q: number; r: number; s: number; id: string }>;
      capos: Array<{ q: number; r: number; s: number; id: string }>;
      boss: { q: number; r: number; s: number; id: string };
    };
  };
  
  // === NEW SYSTEMS ===
  soldierStats: Record<string, SoldierStats>;
  hitmen: Hitman[];
  activeBribes: BribeContract[];
  victoryProgress: VictoryProgress;
  victoryType: VictoryType;
  familyBonuses: FamilyBonuses;
  lastTurnIncome: number;
  pendingNotifications: Array<{ type: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string }>;
  
  // Enhanced systems
  combat: CombatSystem;
  economy: EconomySystem;
  aiOpponents: AIOpponent[];
  events: GameEvent[];
  missions?: never[];
  weather: WeatherSystem;
  technology: TechnologySystem;
  seasonalEvents: SeasonalEvent[];
  
  // Legacy systems
  reputation: EnhancedReputationSystem;
  violentActions: ViolentAction[];
  businesses: Business[];
  finances: BusinessFinances;
  legalStatus: LegalStatus;
  policeHeat: PoliceHeat;
  
  selectedTerritory?: any;
  activeEvent?: GameEvent;
  
  familyControl: {
    gambino: number; genovese: number; lucchese: number; bonanno: number; colombo: number;
  };
  
  territories: Array<{
    district: 'Little Italy' | 'Bronx' | 'Brooklyn' | 'Queens' | 'Manhattan' | 'Staten Island';
    family: 'neutral' | 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
    businesses: Array<{
      q: number; r: number; s: number;
      businessId: string; businessType: string;
      isLegal: boolean; income: number;
      district: 'Little Italy' | 'Bronx' | 'Brooklyn' | 'Queens' | 'Manhattan' | 'Staten Island';
      family: 'neutral' | 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
      isExtorted?: boolean; heatLevel?: number;
      soldiers?: { count: number; family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo' };
      capo?: { name: string; family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo'; level: number };
    }>;
  }>;
}

// ============ HEX MATH ============
const hexDistance = (a: {q:number;r:number;s:number}, b: {q:number;r:number;s:number}) =>
  (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;

const hexNeighborDirections = [
  {q:1,r:0,s:-1},{q:1,r:-1,s:0},{q:0,r:-1,s:1},
  {q:-1,r:0,s:1},{q:-1,r:1,s:0},{q:0,r:1,s:-1}
];

const getHexNeighbors = (q:number,r:number,s:number) =>
  hexNeighborDirections.map(d => ({q:q+d.q, r:r+d.r, s:s+d.s}));

const getHexesInRange = (q:number, r:number, s:number, range:number) => {
  const results: Array<{q:number;r:number;s:number}> = [];
  for (let dq = -range; dq <= range; dq++) {
    for (let dr = Math.max(-range, -dq-range); dr <= Math.min(range, -dq+range); dr++) {
      const ds = -dq - dr;
      if (dq === 0 && dr === 0 && ds === 0) continue;
      results.push({q:q+dq, r:r+dr, s:s+ds});
    }
  }
  return results;
};

// ============ MAP GENERATION ============
const generateHexMap = (radius: number): HexTile[] => {
  const tiles: HexTile[] = [];
  
  const getDistrict = (q: number, r: number): HexTile['district'] => {
    if (q <= -3 && r >= 2) return 'Little Italy';
    if (q >= 2 && r <= -3) return 'Manhattan';
    if (q >= 2 && r >= 2) return 'Staten Island';
    if (q <= -3 && r <= -3) return 'Queens';
    if (r >= 2) return 'Brooklyn';
    if (r <= -3) return 'Bronx';
    if (q >= 2) return 'Manhattan';
    if (q <= -3) return 'Queens';
    return 'Brooklyn';
  };

  const terrainTypes: HexTile['terrain'][] = ['urban', 'industrial', 'residential', 'docks', 'commercial'];

  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      const s = -q - r;
      if (Math.abs(s) > radius) continue;

      const district = getDistrict(q, r);
      const terrain = terrainTypes[Math.abs((q * 7 + r * 13) % terrainTypes.length)];
      
      // ~30% of hexes have a business (use doc business types)
      const hasBusiness = ((q * 31 + r * 47) % 10) < 3;
      
      const tile: HexTile = { q, r, s, district, terrain, controllingFamily: 'neutral' };

      if (hasBusiness) {
        const bConfig = DOC_BUSINESS_TYPES[Math.abs((q * 17 + r * 23) % DOC_BUSINESS_TYPES.length)];
        tile.business = {
          type: bConfig.type,
          income: bConfig.baseIncome + Math.abs((q * 13 + r * 29) % 2000),
          isLegal: bConfig.type === 'store_front',
          heatLevel: bConfig.baseHeat,
          launderingCapacity: bConfig.launderingCapacity,
        };
      }

      tiles.push(tile);
    }
  }

  return tiles;
};

const HQ_POSITIONS: Record<string, {q:number;r:number;s:number;district:HexTile['district']}> = {
  gambino:  { q: -5, r:  5, s: 0,  district: 'Little Italy' },
  genovese: { q:  5, r: -5, s: 0,  district: 'Manhattan' },
  lucchese: { q: -5, r: -1, s: 6,  district: 'Queens' },
  bonanno:  { q:  4, r:  2, s: -6, district: 'Staten Island' },
  colombo:  { q:  0, r: -5, s: 5,  district: 'Bronx' },
};

// ============ INITIAL STATE ============
const createInitialGameState = (
  family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo' = 'gambino',
  startingResources?: { money: number; soldiers: number; influence: number; politicalPower: number; respect: number }
): EnhancedMafiaGameState => {
  const mapRadius = 6;
  let hexMap = generateHexMap(mapRadius);

  const allFamilies = ['gambino', 'genovese', 'lucchese', 'bonanno', 'colombo'] as const;
  
  allFamilies.forEach(fam => {
    const hq = HQ_POSITIONS[fam];
    const hqTile = hexMap.find(t => t.q === hq.q && t.r === hq.r && t.s === hq.s);
    if (hqTile) {
      hqTile.isHeadquarters = fam;
      hqTile.controllingFamily = fam;
      hqTile.business = undefined;
    }
    const neighbors = getHexNeighbors(hq.q, hq.r, hq.s);
    neighbors.forEach(n => {
      const tile = hexMap.find(t => t.q === n.q && t.r === n.r && t.s === n.s);
      if (tile && tile.controllingFamily === 'neutral') {
        tile.controllingFamily = fam;
      }
    });
  });

  const deployedUnits: DeployedUnit[] = [];
  const soldierStats: Record<string, SoldierStats> = {};

  allFamilies.forEach(fam => {
    const hq = HQ_POSITIONS[fam];
    for (let i = 0; i < 3; i++) {
      const id = `${fam}-soldier-${i}`;
      deployedUnits.push({
        id, type: 'soldier', family: fam,
        q: hq.q, r: hq.r, s: hq.s,
        movesRemaining: 2, maxMoves: 2, level: 1,
      });
      soldierStats[id] = {
        loyalty: 50 + Math.floor(Math.random() * 30),
        training: 3 + Math.floor(Math.random() * 3),
        equipment: 2 + Math.floor(Math.random() * 3),
        hits: 0, extortions: 0, intimidations: 0, survivedConflicts: 0,
      };
    }
    const capoNames: Record<string, string> = {
      gambino: 'Vito Scaletta', genovese: 'Sal Marcano', lucchese: 'Tommy Angelo',
      bonanno: 'Joe Barbaro', colombo: 'Frank Colletti'
    };
    deployedUnits.push({
      id: `${fam}-capo-0`, type: 'capo', family: fam,
      q: hq.q, r: hq.r, s: hq.s,
      movesRemaining: 3, maxMoves: 3, level: 1, name: capoNames[fam],
    });
  });

  const units: EnhancedMafiaGameState['units'] = {};
  allFamilies.forEach(fam => {
    const hq = HQ_POSITIONS[fam];
    units[fam] = {
      soldiers: deployedUnits.filter(u => u.family === fam && u.type === 'soldier').map(u => ({q:u.q,r:u.r,s:u.s,id:u.id})),
      capos: deployedUnits.filter(u => u.family === fam && u.type === 'capo').map(u => ({q:u.q,r:u.r,s:u.s,id:u.id})),
      boss: { q: hq.q, r: hq.r, s: hq.s, id: `${fam}-boss` },
    };
  });

  const territories = buildLegacyTerritories(hexMap);

  const bonuses = FAMILY_BONUSES[family] || FAMILY_BONUSES.gambino;

  return {
    playerFamily: family,
    turn: 1,
    season: 'spring',
    
    resources: {
      money: startingResources?.money ?? 50000,
      respect: startingResources?.respect ?? 25,
      soldiers: startingResources?.soldiers ?? 2,
      influence: startingResources?.influence ?? 10,
      politicalPower: startingResources?.politicalPower ?? 30,
      loyalty: 75,
      researchPoints: 0,
    },

    hexMap, deployedUnits,
    movementPhase: false, selectedUnitId: null, availableMoveHexes: [],
    deployMode: null, availableDeployHexes: [],
    headquarters: Object.fromEntries(allFamilies.map(f => [f, HQ_POSITIONS[f]])),
    units,
    
    // New systems
    soldierStats,
    hitmen: [],
    activeBribes: [],
    victoryProgress: {
      territory: { current: 0, target: 6, met: false },
      economic: { current: 0, target: 8000, met: false },
      legacy: { current: 0, highestRival: 0, met: false },
    },
    victoryType: null,
    familyBonuses: bonuses,
    lastTurnIncome: 0,
    pendingNotifications: [],
    
    combat: {
      territoryBattles: [],
      soldierTraining: {
        level: 1,
        equipment: { weapons: 'basic', armor: 'none', vehicles: 'none', cost: 0, effectiveness: 0 },
        specialization: 'enforcer', experience: 0,
      },
      combatModifiers: [],
    },
    
    economy: {
      marketConditions: [
        { type: 'stable', sector: 'legal', modifier: 0, duration: 5, description: 'Legal businesses operating normally' },
      ],
      supplyChains: [], investments: [], economicEvents: [],
    },
    
    aiOpponents: allFamilies
      .filter(f => f !== family)
      .map(f => {
        const personalities: Record<string, any> = {
          gambino: { personality: 'diplomatic', aggressionLevel: 50, cooperationTendency: 60, primaryGoal: 'money', riskTolerance: 40, focusAreas: ['Little Italy', 'Manhattan'] },
          genovese: { personality: 'aggressive', aggressionLevel: 80, cooperationTendency: 30, primaryGoal: 'territory', riskTolerance: 70, focusAreas: ['Manhattan', 'Bronx'] },
          lucchese: { personality: 'opportunistic', aggressionLevel: 40, cooperationTendency: 60, primaryGoal: 'money', riskTolerance: 50, focusAreas: ['Brooklyn', 'Queens'] },
          bonanno: { personality: 'defensive', aggressionLevel: 25, cooperationTendency: 70, primaryGoal: 'reputation', riskTolerance: 30, focusAreas: ['Staten Island', 'Little Italy'] },
          colombo: { personality: 'unpredictable', aggressionLevel: 95, cooperationTendency: 10, primaryGoal: 'elimination', riskTolerance: 90, focusAreas: ['Queens', 'Brooklyn'] },
        };
        const p = personalities[f];
        const otherFamilies = allFamilies.filter(x => x !== f);
        const relationships: Record<string, number> = {};
        otherFamilies.forEach(x => { relationships[x] = Math.floor(Math.random() * 40) - 20; });
        return {
          family: f, personality: p.personality,
          resources: { money: 35000 + Math.floor(Math.random() * 15000), soldiers: 2, influence: 8 + Math.floor(Math.random() * 8) },
          strategy: { primaryGoal: p.primaryGoal, riskTolerance: p.riskTolerance, aggressionLevel: p.aggressionLevel, cooperationTendency: p.cooperationTendency, focusAreas: p.focusAreas },
          relationships, lastAction: null, nextAction: null,
        };
      }),
    
    events: [],
    weather: {
      currentWeather: { type: 'clear', intensity: 0, duration: 3, description: 'Clear skies, perfect for business' },
      forecast: [], effects: [],
    },
    technology: {
      researched: [],
      available: [
        { id: 'wiretapping', name: 'Wiretapping', description: 'Listen in on rival family communications', category: 'intelligence', cost: 15000, researchTime: 3, prerequisites: [], effects: { combat: 20 }, unlocked: false },
        { id: 'armored_cars', name: 'Armored Vehicles', description: 'Protect your soldiers with armored vehicles', category: 'combat', cost: 25000, researchTime: 5, prerequisites: [], effects: { combat: 15 }, unlocked: false },
      ],
      researchProgress: {},
    },
    seasonalEvents: [],
    
    reputation: {
      respect: startingResources?.respect ?? 25,
      reputation: 20, loyalty: 75, fear: 15,
      streetInfluence: startingResources?.influence ?? 10,
      familyRelationships: Object.fromEntries(
        allFamilies.filter(f => f !== family).map(f => [f, Math.floor(Math.random() * 30) - 15])
      ),
      publicPerception: { criminal: 60, businessman: 30, philanthropist: 10 },
      reputationHistory: [], achievements: [],
    },
    
    violentActions: [],
    businesses: [],
    finances: { totalIncome: 0, totalExpenses: 0, legalProfit: 0, illegalProfit: 0, totalProfit: 0, dirtyMoney: 0, cleanMoney: 0, legalCosts: 0 },
    legalStatus: { charges: [], lawyer: null, jailTime: 0, prosecutionRisk: 10, totalLegalCosts: 0 },
    policeHeat: { level: 15, reductionPerTurn: 2, bribedOfficials: [], arrests: [], rattingRisk: 5 },
    
    selectedTerritory: null,
    activeEvent: null,
    familyControl: { gambino: 20, genovese: 20, lucchese: 20, bonanno: 20, colombo: 20 },
    territories,
  };
};

function buildLegacyTerritories(hexMap: HexTile[]): EnhancedMafiaGameState['territories'] {
  const districts = ['Little Italy', 'Bronx', 'Brooklyn', 'Queens', 'Manhattan', 'Staten Island'] as const;
  return districts.map(district => {
    const tilesInDistrict = hexMap.filter(t => t.district === district);
    const families = tilesInDistrict.filter(t => t.controllingFamily !== 'neutral');
    const dominantFamily = families.length > 0 
      ? families.reduce((acc, t) => {
          acc[t.controllingFamily] = (acc[t.controllingFamily] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      : {};
    const owner = Object.entries(dominantFamily).sort((a,b) => b[1] - a[1])[0]?.[0] || 'neutral';

    const businesses = tilesInDistrict
      .filter(t => t.business)
      .map((t, i) => ({
        q: t.q, r: t.r, s: t.s,
        businessId: `${district.toLowerCase().replace(' ', '_')}_biz_${i}`,
        businessType: t.business!.type,
        isLegal: t.business!.isLegal,
        income: t.business!.income,
        district,
        family: t.controllingFamily,
        isExtorted: false,
        heatLevel: t.business!.heatLevel,
      }));

    return { district, family: owner as any, businesses };
  });
}

// ============ HOOK ============
export const useEnhancedMafiaGameState = (
  initialFamily?: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo',
  startingResources?: { money: number; soldiers: number; influence: number; politicalPower: number; respect: number }
) => {
  const [gameState, setGameState] = useState<EnhancedMafiaGameState>(() => 
    createInitialGameState(initialFamily || 'gambino', startingResources)
  );

  // ============ SYNC LEGACY UNITS FROM DEPLOYED UNITS ============
  const syncLegacyUnits = (state: EnhancedMafiaGameState) => {
    const allFamilies = ['gambino', 'genovese', 'lucchese', 'bonanno', 'colombo'] as const;
    const newUnits: typeof state.units = {};
    const deployed = state.deployedUnits || [];
    allFamilies.forEach(fam => {
      const hq = state.headquarters[fam];
      newUnits[fam] = {
        soldiers: deployed.filter(u => u.family === fam && u.type === 'soldier').map(u => ({q:u.q,r:u.r,s:u.s,id:u.id})),
        capos: deployed.filter(u => u.family === fam && u.type === 'capo').map(u => ({q:u.q,r:u.r,s:u.s,id:u.id})),
        boss: { q: hq?.q ?? 0, r: hq?.r ?? 0, s: hq?.s ?? 0, id: `${fam}-boss` },
      };
    });
    state.units = newUnits;

    allFamilies.forEach(fam => {
      const controlled = state.hexMap.filter(t => t.controllingFamily === fam).length;
      const total = state.hexMap.length;
      state.familyControl[fam] = Math.round((controlled / total) * 100);
    });
  };

  // ============ VICTORY CHECK ============
  const updateVictoryProgress = (state: EnhancedMafiaGameState) => {
    const playerHexes = state.hexMap.filter(t => t.controllingFamily === state.playerFamily).length;
    const income = state.lastTurnIncome;
    const playerRep = state.reputation.respect + state.reputation.reputation + state.reputation.fear + state.reputation.streetInfluence;
    
    // Find highest rival reputation
    let highestRival = 0;
    state.aiOpponents.forEach(opp => {
      const rivalRep = opp.resources.influence * 3; // approximation
      if (rivalRep > highestRival) highestRival = rivalRep;
    });

    state.victoryProgress = {
      territory: { current: playerHexes, target: 6, met: playerHexes >= 6 },
      economic: { current: income, target: 8000, met: income >= 8000 },
      legacy: { current: playerRep, highestRival, met: playerRep > highestRival && state.turn > 5 },
    };

    if (state.victoryProgress.territory.met) state.victoryType = 'territory';
    else if (state.victoryProgress.economic.met) state.victoryType = 'economic';
    else if (state.victoryProgress.legacy.met) state.victoryType = 'legacy';
    else state.victoryType = null;
  };

  // ============ MOVEMENT PHASE ============
  const startMovementPhase = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      movementPhase: true, selectedUnitId: null, availableMoveHexes: [],
      deployMode: null, availableDeployHexes: [],
    }));
  }, []);

  const endMovementPhase = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      movementPhase: false, selectedUnitId: null, availableMoveHexes: [],
      deployMode: null, availableDeployHexes: [],
    }));
  }, []);

  // ============ SELECT UNIT FOR MOVEMENT ============
  const selectUnit = useCallback((unitType: 'soldier' | 'capo', location: { q: number; r: number; s: number }) => {
    setGameState(prev => {
      const unit = prev.deployedUnits.find(u => 
        u.family === prev.playerFamily && u.type === unitType &&
        u.q === location.q && u.r === location.r && u.s === location.s &&
        u.movesRemaining > 0
      );
      if (!unit) return prev;

      const range = unitType === 'soldier' ? 1 : Math.min(5, unit.movesRemaining);
      const candidateHexes = unitType === 'soldier' 
        ? getHexNeighbors(unit.q, unit.r, unit.s)
        : getHexesInRange(unit.q, unit.r, unit.s, range);
      
      const validHexes = candidateHexes.filter(h => 
        prev.hexMap.some(t => t.q === h.q && t.r === h.r && t.s === h.s)
      );

      return { ...prev, selectedUnitId: unit.id, availableMoveHexes: validHexes, deployMode: null, availableDeployHexes: [] };
    });
  }, []);

  // ============ MOVE UNIT ============
  const moveUnit = useCallback((targetLocation: { q: number; r: number; s: number }) => {
    setGameState(prev => {
      if (!prev.selectedUnitId) return prev;
      const unitIdx = prev.deployedUnits.findIndex(u => u.id === prev.selectedUnitId);
      if (unitIdx === -1) return prev;
      const unit = prev.deployedUnits[unitIdx];

      if (!prev.availableMoveHexes.some(h => h.q === targetLocation.q && h.r === targetLocation.r && h.s === targetLocation.s)) {
        return prev;
      }

      const moveCost = 1;
      if (unit.movesRemaining < moveCost) return prev;

      const newUnits = [...prev.deployedUnits];
      const updatedUnit = { ...unit, q: targetLocation.q, r: targetLocation.r, s: targetLocation.s, movesRemaining: unit.movesRemaining - moveCost };
      newUnits[unitIdx] = updatedUnit;

      // Moving to enemy territory does NOT auto-claim — use hit/extort
      const newHexMap = prev.hexMap.map(tile => {
        if (tile.q === targetLocation.q && tile.r === targetLocation.r && tile.s === targetLocation.s) {
          // Only auto-claim neutral tiles
          if (tile.controllingFamily === 'neutral' && !tile.isHeadquarters) {
            return { ...tile, controllingFamily: prev.playerFamily };
          }
        }
        return tile;
      });

      let newAvailableMoves: Array<{q:number;r:number;s:number}> = [];
      if (updatedUnit.movesRemaining > 0) {
        const range = updatedUnit.type === 'soldier' ? 1 : Math.min(5, updatedUnit.movesRemaining);
        const candidates = updatedUnit.type === 'soldier'
          ? getHexNeighbors(updatedUnit.q, updatedUnit.r, updatedUnit.s)
          : getHexesInRange(updatedUnit.q, updatedUnit.r, updatedUnit.s, range);
        newAvailableMoves = candidates.filter(h => 
          newHexMap.some(t => t.q === h.q && t.r === h.r && t.s === h.s)
        );
      }

      const newState = {
        ...prev, deployedUnits: newUnits, hexMap: newHexMap,
        selectedUnitId: updatedUnit.movesRemaining > 0 ? updatedUnit.id : null,
        availableMoveHexes: newAvailableMoves,
      };
      syncLegacyUnits(newState);
      return newState;
    });
  }, []);

  // ============ DEPLOY FROM HQ ============
  const selectHeadquarters = useCallback((family: string) => {}, []);

  const selectUnitFromHeadquarters = useCallback((unitType: 'soldier' | 'capo', family: string) => {
    setGameState(prev => {
      if (family !== prev.playerFamily) return prev;
      const hq = prev.headquarters[family];
      if (!hq) return prev;

      if (unitType === 'soldier') {
        if (prev.resources.soldiers <= 0) {
          const atHQ = prev.deployedUnits.filter(u => 
            u.family === family && u.type === 'soldier' &&
            u.q === hq.q && u.r === hq.r && u.s === hq.s
          );
          if (atHQ.length === 0) return prev;
        }
      } else {
        const caposAtHQ = prev.deployedUnits.filter(u => 
          u.family === family && u.type === 'capo' &&
          u.q === hq.q && u.r === hq.r && u.s === hq.s
        );
        if (caposAtHQ.length === 0) return prev;
      }

      const range = unitType === 'soldier' ? 1 : 5;
      const candidates = unitType === 'soldier'
        ? getHexNeighbors(hq.q, hq.r, hq.s)
        : getHexesInRange(hq.q, hq.r, hq.s, range);
      
      const validHexes = candidates.filter(h => 
        prev.hexMap.some(t => t.q === h.q && t.r === h.r && t.s === h.s)
      );

      return { ...prev, deployMode: { unitType, family }, availableDeployHexes: validHexes, selectedUnitId: null, availableMoveHexes: [] };
    });
  }, []);

  const deployUnit = useCallback((unitType: 'soldier' | 'capo', targetLocation: { q: number; r: number; s: number }, family: string) => {
    setGameState(prev => {
      if (family !== prev.playerFamily) return prev;
      if (!prev.deployMode) return prev;
      if (!prev.availableDeployHexes.some(h => h.q === targetLocation.q && h.r === targetLocation.r && h.s === targetLocation.s)) {
        return prev;
      }

      const hq = prev.headquarters[family];
      if (!hq) return prev;

      let newDeployedUnits = [...prev.deployedUnits];
      let newResources = { ...prev.resources };
      let newSoldierStats = { ...prev.soldierStats };

      if (unitType === 'soldier') {
        if (prev.resources.soldiers > 0) {
          const newId = `${family}-soldier-${Date.now()}-${Math.random().toString(36).substr(2,4)}`;
          newDeployedUnits.push({
            id: newId, type: 'soldier', family: family as any,
            q: targetLocation.q, r: targetLocation.r, s: targetLocation.s,
            movesRemaining: 0, maxMoves: 2, level: 1,
          });
          newSoldierStats[newId] = {
            loyalty: 50, training: 3, equipment: 2,
            hits: 0, extortions: 0, intimidations: 0, survivedConflicts: 0,
          };
          newResources.soldiers -= 1;
        } else {
          const soldierAtHQ = newDeployedUnits.findIndex(u => 
            u.family === family && u.type === 'soldier' &&
            u.q === hq.q && u.r === hq.r && u.s === hq.s
          );
          if (soldierAtHQ === -1) return prev;
          newDeployedUnits[soldierAtHQ] = {
            ...newDeployedUnits[soldierAtHQ],
            q: targetLocation.q, r: targetLocation.r, s: targetLocation.s, movesRemaining: 0,
          };
        }
      } else {
        const capoAtHQ = newDeployedUnits.findIndex(u => 
          u.family === family && u.type === 'capo' &&
          u.q === hq.q && u.r === hq.r && u.s === hq.s
        );
        if (capoAtHQ === -1) return prev;
        newDeployedUnits[capoAtHQ] = {
          ...newDeployedUnits[capoAtHQ],
          q: targetLocation.q, r: targetLocation.r, s: targetLocation.s, movesRemaining: 0,
        };
      }

      // Claim neutral hexes
      const newHexMap = prev.hexMap.map(tile => {
        if (tile.q === targetLocation.q && tile.r === targetLocation.r && tile.s === targetLocation.s) {
          if (tile.controllingFamily === 'neutral' || tile.controllingFamily === family) {
            return { ...tile, controllingFamily: family as any };
          }
        }
        return tile;
      });

      const newState = {
        ...prev, deployedUnits: newDeployedUnits, hexMap: newHexMap,
        resources: newResources, soldierStats: newSoldierStats,
        deployMode: null, availableDeployHexes: [],
      };
      syncLegacyUnits(newState);
      return newState;
    });
  }, []);

  // ============ END TURN ============
  const endTurn = useCallback(() => {
    setGameState(prev => {
      const newState = { ...prev };
      newState.turn += 1;
      
      newState.movementPhase = false;
      newState.selectedUnitId = null;
      newState.availableMoveHexes = [];
      newState.deployMode = null;
      newState.availableDeployHexes = [];

      newState.deployedUnits = (newState.deployedUnits || []).map(u => ({
        ...u, movesRemaining: u.maxMoves,
      }));
      
      const seasons = ['spring', 'summer', 'fall', 'winter'] as const;
      newState.season = seasons[Math.floor((newState.turn - 1) / 3) % 4];
      
      processEconomy(newState);
      processAITurn(newState);
      processWeather(newState);
      processEvents(newState);
      processBribes(newState);
      
      newState.reputation.reputation = Math.max(0, newState.reputation.reputation - 0.5);
      newState.reputation.fear = Math.max(0, newState.reputation.fear - 1);
      newState.reputation.loyalty = Math.min(100, newState.reputation.loyalty + 1);
      
      newState.policeHeat.level = Math.max(0, newState.policeHeat.level - newState.policeHeat.reductionPerTurn);
      
      syncLegacyUnits(newState);
      newState.territories = buildLegacyTerritories(newState.hexMap);
      updateVictoryProgress(newState);
      
      return newState;
    });
  }, []);

  // ============ ECONOMY (with family bonuses) ============
  const processEconomy = (state: EnhancedMafiaGameState) => {
    let income = 0;
    const units = state.deployedUnits || [];
    const bonuses = state.familyBonuses;
    
    (state.hexMap || []).forEach(tile => {
      if (tile.controllingFamily === state.playerFamily && tile.business) {
        const hasCapo = units.some(u => 
          u.family === state.playerFamily && u.type === 'capo' &&
          u.q === tile.q && u.r === tile.r && u.s === tile.s
        );
        const hasSoldier = units.some(u => 
          u.family === state.playerFamily && u.type === 'soldier' &&
          u.q === tile.q && u.r === tile.r && u.s === tile.s
        );
        
        let tileIncome = 0;
        if (hasCapo) {
          tileIncome = tile.business.income; // 100%
        } else if (hasSoldier) {
          tileIncome = Math.floor(tile.business.income * 0.3); // 30%
        } else {
          tileIncome = Math.floor(tile.business.income * 0.1); // 10% passive
        }

        // Apply family bonuses
        if (bonuses.businessIncome > 0) tileIncome = Math.floor(tileIncome * (1 + bonuses.businessIncome / 100));
        if (bonuses.territoryIncome > 0) tileIncome = Math.floor(tileIncome * (1 + bonuses.territoryIncome / 100));
        if (bonuses.income > 0) tileIncome = Math.floor(tileIncome * (1 + bonuses.income / 100));
        
        income += tileIncome;
      }
    });
    
    // Soldier maintenance — $500/soldier base, hitmen cost 50% more
    const playerSoldiers = state.deployedUnits.filter(u => u.family === state.playerFamily && u.type === 'soldier');
    let maintenance = 0;
    playerSoldiers.forEach(s => {
      const isHitman = state.hitmen.some(h => h.unitId === s.id);
      maintenance += isHitman ? Math.floor(SOLDIER_COST * HITMAN_MAINTENANCE_MULTIPLIER) : SOLDIER_COST;
    });
    maintenance += state.resources.soldiers * SOLDIER_COST; // undeployed pool
    
    state.lastTurnIncome = income;
    state.resources.money += income - maintenance;
    state.finances.totalIncome = income;
    state.finances.totalExpenses = maintenance;
    state.finances.totalProfit = income - maintenance;
  };

  // ============ PROCESS BRIBES ============
  const processBribes = (state: EnhancedMafiaGameState) => {
    state.activeBribes = state.activeBribes.map(b => {
      if (!b.active) return b;
      const remaining = b.turnsRemaining - 1;
      if (remaining <= 0) return { ...b, turnsRemaining: 0, active: false };

      // Apply effects each turn
      switch (b.tier) {
        case 'patrol_officer':
          state.policeHeat.level = Math.max(0, state.policeHeat.level - 2);
          break;
        case 'police_captain':
          // 20% economic pressure on rival illegal businesses — reduce their money
          if (b.targetFamily) {
            const rival = state.aiOpponents.find(o => o.family === b.targetFamily);
            if (rival) rival.resources.money = Math.floor(rival.resources.money * 0.96);
          }
          break;
        case 'police_chief':
          // Intel bonus — handled passively
          break;
        case 'mayor':
          // Territory shutdown handled at bribe initiation
          break;
      }

      return { ...b, turnsRemaining: remaining };
    }).filter(b => b.active);
  };

  // ============ AI TURN ============
  const processAITurn = (state: EnhancedMafiaGameState) => {
    state.aiOpponents.forEach(opponent => {
      const fam = opponent.family as any;
      const hq = state.headquarters[fam];
      if (!hq) return;

      let aiIncome = 0;
      state.hexMap.forEach(tile => {
        if (tile.controllingFamily === fam && tile.business) {
          const hasCapo = state.deployedUnits.some(u => u.family === fam && u.type === 'capo' && u.q === tile.q && u.r === tile.r && u.s === tile.s);
          const hasSoldier = state.deployedUnits.some(u => u.family === fam && u.type === 'soldier' && u.q === tile.q && u.r === tile.r && u.s === tile.s);
          if (hasCapo) aiIncome += tile.business.income;
          else if (hasSoldier) aiIncome += Math.floor(tile.business.income * 0.3);
          else aiIncome += Math.floor(tile.business.income * 0.1);
        }
      });
      opponent.resources.money += aiIncome;

      // AI recruit at new costs
      if (opponent.resources.money > 5000 && opponent.resources.soldiers < 5) {
        const recruit = Math.min(2, Math.floor((opponent.resources.money - 3000) / SOLDIER_COST));
        opponent.resources.soldiers += recruit;
        opponent.resources.money -= recruit * SOLDIER_COST;
      }

      // AI deploy
      if (opponent.resources.soldiers > 0 && Math.random() < 0.6) {
        const neighbors = getHexNeighbors(hq.q, hq.r, hq.s);
        const validTargets = neighbors.filter(n => state.hexMap.some(t => t.q === n.q && t.r === n.r && t.s === n.s));
        if (validTargets.length > 0) {
          const target = validTargets[Math.floor(Math.random() * validTargets.length)];
          const newId = `${fam}-soldier-${Date.now()}-${Math.random().toString(36).substr(2,4)}`;
          state.deployedUnits.push({
            id: newId, type: 'soldier', family: fam,
            q: target.q, r: target.r, s: target.s,
            movesRemaining: 2, maxMoves: 2, level: 1,
          });
          state.soldierStats[newId] = {
            loyalty: 40 + Math.floor(Math.random() * 30), training: 2 + Math.floor(Math.random() * 3),
            equipment: 2, hits: 0, extortions: 0, intimidations: 0, survivedConflicts: 0,
          };
          opponent.resources.soldiers -= 1;

          const tile = state.hexMap.find(t => t.q === target.q && t.r === target.r && t.s === target.s);
          if (tile && tile.controllingFamily === 'neutral' && !tile.isHeadquarters) {
            tile.controllingFamily = fam;
          }
        }
      }

      // AI move existing units
      const aiUnits = state.deployedUnits.filter(u => u.family === fam && u.movesRemaining > 0);
      if (aiUnits.length > 0 && Math.random() < 0.4) {
        const unit = aiUnits[Math.floor(Math.random() * aiUnits.length)];
        const neighbors = unit.type === 'soldier' 
          ? getHexNeighbors(unit.q, unit.r, unit.s)
          : getHexesInRange(unit.q, unit.r, unit.s, 3);
        const validMoves = neighbors.filter(n => {
          const tile = state.hexMap.find(t => t.q === n.q && t.r === n.r && t.s === n.s);
          return tile && !tile.isHeadquarters;
        });
        if (validMoves.length > 0) {
          const preferred = validMoves.filter(n => {
            const tile = state.hexMap.find(t => t.q === n.q && t.r === n.r && t.s === n.s);
            return tile && tile.controllingFamily !== fam;
          });
          const target = (preferred.length > 0 ? preferred : validMoves)[Math.floor(Math.random() * (preferred.length > 0 ? preferred.length : validMoves.length))];
          unit.q = target.q;
          unit.r = target.r;
          unit.s = target.s;
          unit.movesRemaining -= 1;
          
          const tile = state.hexMap.find(t => t.q === target.q && t.r === target.r && t.s === target.s);
          if (tile && !tile.isHeadquarters) {
            const playerUnitsHere = state.deployedUnits.filter(u => 
              u.family === state.playerFamily && u.q === target.q && u.r === target.r && u.s === target.s
            );
            if (playerUnitsHere.length > 0) {
              const aiStrength = state.deployedUnits.filter(u => u.family === fam && u.q === target.q && u.r === target.r && u.s === target.s).length;
              if (aiStrength > playerUnitsHere.length && Math.random() < 0.6) {
                playerUnitsHere.forEach(pu => {
                  const idx = state.deployedUnits.indexOf(pu);
                  if (idx !== -1) state.deployedUnits.splice(idx, 1);
                });
                tile.controllingFamily = fam;
              }
            } else {
              tile.controllingFamily = fam;
            }
          }
        }
      }
    });
  };

  // ============ WEATHER ============
  const processWeather = (state: EnhancedMafiaGameState) => {
    state.weather.currentWeather.duration -= 1;
    if (state.weather.currentWeather.duration <= 0) {
      const conditions = [
        { type: 'clear', description: 'Clear skies' },
        { type: 'rain', description: 'Heavy rain reduces police patrols' },
        { type: 'fog', description: 'Fog provides cover' },
        { type: 'storm', description: 'Storm disrupts operations' },
      ];
      const c = conditions[Math.floor(Math.random() * conditions.length)];
      state.weather.currentWeather = {
        type: c.type as any,
        intensity: Math.floor(Math.random() * 100),
        duration: Math.floor(Math.random() * 4) + 2,
        description: c.description,
      };
    }
  };

  // ============ EVENTS ============
  const processEvents = (state: EnhancedMafiaGameState) => {
    if (Math.random() < 0.35) {
      const events = [
        {
          id: `event-${Date.now()}`, type: 'random' as const,
          title: 'Police Raid',
          description: 'The police are planning a raid. What do you do?',
          choices: [
            { id: 'bribe', text: 'Bribe officers ($10,000)', consequences: [{ type: 'money' as const, value: -10000, description: 'Bribe' },{ type: 'heat' as const, value: -15, description: 'Reduced heat' }] },
            { id: 'hide', text: 'Hide evidence', consequences: [{ type: 'heat' as const, value: -5, description: 'Partial heat reduction' }] },
            { id: 'fight', text: 'Stand ground', consequences: [{ type: 'heat' as const, value: 20, description: 'Increased heat' },{ type: 'reputation' as const, value: 10, description: 'Gained respect' }] },
          ],
          consequences: [], turn: state.turn, expires: state.turn + 2,
        },
        {
          id: `event-${Date.now()+1}`, type: 'random' as const,
          title: 'Rival Meeting',
          description: 'A rival family wants to discuss territory boundaries.',
          choices: [
            { id: 'negotiate', text: 'Negotiate peacefully', consequences: [{ type: 'reputation' as const, value: 5, description: 'Gained rep' }] },
            { id: 'threaten', text: 'Make threats', consequences: [{ type: 'reputation' as const, value: 15, description: 'Fear' },{ type: 'relationship' as const, value: -20, description: 'Damaged relations' }] },
          ],
          consequences: [], turn: state.turn, expires: state.turn + 1,
        },
      ];
      state.events.push(events[Math.floor(Math.random() * events.length)]);
    }
    state.events = state.events.filter(e => !e.expires || e.expires > state.turn);
  };

  // ============ TERRITORY SELECTION ============
  const selectTerritory = useCallback((territory: any) => {
    setGameState(prev => ({ ...prev, selectedTerritory: territory }));
  }, []);

  // ============ ACTION SYSTEM ============
  const performAction = useCallback((action: any) => {
    setGameState(prev => {
      const newState = { ...prev };
      const bonuses = newState.familyBonuses;
      const discount = bonuses.recruitmentDiscount / 100;
      
      switch (action.type) {
        case 'hit_territory':
          return processTerritoryHit(newState, action);
        case 'extort_territory':
          return processTerritoryExtortion(newState, action);
        case 'recruit_soldiers': {
          const cost = Math.floor(SOLDIER_COST * (1 - discount));
          if (newState.resources.money >= cost) {
            newState.resources.money -= cost;
            newState.resources.soldiers += 1;
          }
          return newState;
        }
        case 'recruit_capo': {
          const cost = Math.floor(CAPO_COST * (1 - discount));
          if (newState.resources.money >= cost) {
            newState.resources.money -= cost;
            // Deploy capo at HQ
            const hq = newState.headquarters[newState.playerFamily];
            if (hq) {
              const newId = `${newState.playerFamily}-capo-${Date.now()}`;
              newState.deployedUnits = [...newState.deployedUnits, {
                id: newId, type: 'capo' as const, family: newState.playerFamily,
                q: hq.q, r: hq.r, s: hq.s,
                movesRemaining: 0, maxMoves: 3, level: 1,
                name: `Capo ${Math.floor(Math.random() * 100)}`,
              }];
            }
          }
          return newState;
        }
        case 'bribe_official':
          // Legacy fallback — use corruption panel for new system
          if (newState.resources.money >= 15000) {
            newState.resources.money -= 15000;
            newState.policeHeat.level = Math.max(0, newState.policeHeat.level - 20);
          }
          return newState;
        case 'bribe_corruption': {
          const tier = action.tier as BribeTier;
          const config = BRIBE_TIERS.find(t => t.tier === tier);
          if (!config || newState.resources.money < config.cost) return newState;
          
          // Check if already active
          if (newState.activeBribes.some(b => b.tier === tier && b.active)) return newState;
          
          // Calculate success
          let successChance = config.baseSuccess;
          successChance += Math.floor(newState.reputation.reputation / 10);
          successChance -= Math.floor(newState.policeHeat.level / 5);
          successChance = Math.max(5, Math.min(95, successChance));
          
          newState.resources.money -= config.cost;
          
          if (Math.random() * 100 < successChance) {
            const contract: BribeContract = {
              id: `bribe-${Date.now()}`,
              tier,
              turnsRemaining: config.duration,
              targetFamily: action.targetFamily,
              active: true,
            };
            
            // Immediate effects
            if (tier === 'patrol_officer') {
              newState.policeHeat.level = Math.max(0, Math.floor(newState.policeHeat.level * 0.7));
            }
            if (tier === 'mayor' && action.targetFamily) {
              const rivalHex = newState.hexMap.find(t => 
                t.controllingFamily === action.targetFamily && t.business && !t.isHeadquarters
              );
              if (rivalHex) {
                rivalHex.controllingFamily = 'neutral';
              }
            }
            
            newState.activeBribes = [...newState.activeBribes, contract];
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'success', title: `${config.label} Bribed!`,
              message: `${config.description}. Active for ${config.duration} turns.`,
            }];
          } else {
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'error', title: `Bribe Failed!`,
              message: `The ${config.label} rejected your offer. $${config.cost.toLocaleString()} lost.`,
            }];
          }
          return newState;
        }
        case 'promote_hitman': {
          const unitId = action.unitId as string;
          if (newState.hitmen.length >= MAX_HITMEN) return newState;
          const stats = newState.soldierStats[unitId];
          if (!stats) return newState;
          if (stats.training * 10 < HITMAN_REQUIREMENTS.minStrength) return newState;
          if (stats.loyalty < HITMAN_REQUIREMENTS.minReputation) return newState;
          if (stats.hits < HITMAN_REQUIREMENTS.minHits) return newState;
          if (newState.hitmen.some(h => h.unitId === unitId)) return newState;
          
          newState.hitmen = [...newState.hitmen, {
            unitId, hitmanLevel: 1, promotedTurn: newState.turn,
          }];
          return newState;
        }
        case 'charitable_donation':
          if (newState.resources.money >= 5000) {
            newState.resources.money -= 5000;
            const repGain = 10 * (1 + bonuses.reputationGain / 100);
            newState.reputation.reputation += repGain;
            newState.policeHeat.level = Math.max(0, newState.policeHeat.level - 5);
          }
          return newState;
        case 'public_appearance':
          if (newState.resources.money >= 3000) {
            newState.resources.money -= 3000;
            const repGain = 5 * (1 + bonuses.reputationGain / 100);
            newState.reputation.reputation += repGain;
          }
          return newState;
        default:
          return newState;
      }
    });
  }, []);

  const performBusinessAction = useCallback((action: any) => {
    setGameState(prev => {
      const newState = { ...prev };
      switch (action.type) {
        case 'build_business':
          if (newState.resources.money >= 25000) {
            newState.resources.money -= 25000;
          }
          return newState;
        default:
          return newState;
      }
    });
  }, []);

  const performReputationAction = useCallback((action: any) => {
    setGameState(prev => {
      const newState = { ...prev };
      switch (action.type) {
        case 'charitable_donation':
          if (newState.resources.money >= 5000) {
            newState.resources.money -= 5000;
            newState.reputation.reputation += 10;
            newState.policeHeat.level = Math.max(0, newState.policeHeat.level - 5);
          }
          return newState;
        case 'public_appearance':
          if (newState.resources.money >= 3000) {
            newState.resources.money -= 3000;
            newState.reputation.reputation += 5;
          }
          return newState;
        default:
          return newState;
      }
    });
  }, []);

  const handleEventChoice = useCallback((eventId: string, choiceId: string) => {
    setGameState(prev => {
      const newState = { ...prev };
      const event = newState.events.find(e => e.id === eventId);
      if (event) {
        const choice = event.choices.find(c => c.id === choiceId);
        if (choice) {
          choice.consequences.forEach(c => {
            switch (c.type) {
              case 'money': newState.resources.money += c.value; break;
              case 'heat': newState.policeHeat.level = Math.max(0, newState.policeHeat.level + c.value); break;
              case 'reputation': newState.reputation.reputation += c.value; break;
            }
          });
          newState.events = newState.events.filter(e => e.id !== eventId);
        }
      }
      return newState;
    });
  }, []);

  // ============ 3-STEP TAKEOVER: HIT ============
  const processTerritoryHit = (state: EnhancedMafiaGameState, action: any): EnhancedMafiaGameState => {
    const targetQ = action.targetQ;
    const targetR = action.targetR;
    const targetS = action.targetS;
    
    if (targetQ !== undefined) {
      const tile = state.hexMap.find(t => t.q === targetQ && t.r === targetR && t.s === targetS);
      if (!tile || tile.controllingFamily === state.playerFamily || tile.isHeadquarters) return state;

      const playerUnits = state.deployedUnits.filter(u => 
        u.family === state.playerFamily && u.q === targetQ && u.r === targetR && u.s === targetS
      );
      const enemyUnits = state.deployedUnits.filter(u => 
        u.family === tile.controllingFamily && u.q === targetQ && u.r === targetR && u.s === targetS
      );

      // Base chance: 80% if outnumbering, 20% if not
      let chance = playerUnits.length > enemyUnits.length ? 0.8 : 0.2;
      
      // Apply family combat bonus
      chance += state.familyBonuses.combatBonus / 100;
      
      // Apply hitman bonus
      const hitmenOnTile = playerUnits.filter(u => state.hitmen.some(h => h.unitId === u.id));
      hitmenOnTile.forEach(h => {
        const hitman = state.hitmen.find(hm => hm.unitId === h.id)!;
        chance += (0.3 + (hitman.hitmanLevel - 1) * 0.1);
      });
      
      // Apply Lucchese hit success bonus
      chance += state.familyBonuses.hitSuccess / 100;
      
      chance = Math.min(0.95, chance);

      if (Math.random() < chance) {
        // Victory
        enemyUnits.forEach(eu => {
          const idx = state.deployedUnits.indexOf(eu);
          if (idx !== -1) state.deployedUnits.splice(idx, 1);
        });
        tile.controllingFamily = state.playerFamily;
        state.resources.money += 5000;
        state.resources.respect += 10;
        
        // Record hits for soldiers involved
        playerUnits.forEach(u => {
          if (state.soldierStats[u.id]) {
            state.soldierStats[u.id].hits += 1;
            state.soldierStats[u.id].survivedConflicts += 1;
          }
        });
        
        // 20% player casualties
        const casualties = Math.max(0, Math.floor(playerUnits.length * 0.2));
        for (let i = 0; i < casualties; i++) {
          const idx = state.deployedUnits.indexOf(playerUnits[i]);
          if (idx !== -1) state.deployedUnits.splice(idx, 1);
        }
      } else {
        // Defeat — 40% casualties
        const casualties = Math.max(1, Math.floor(playerUnits.length * 0.4));
        for (let i = 0; i < casualties; i++) {
          const idx = state.deployedUnits.indexOf(playerUnits[i]);
          if (idx !== -1) state.deployedUnits.splice(idx, 1);
        }
        // Surviving soldiers still get experience
        playerUnits.slice(casualties).forEach(u => {
          if (state.soldierStats[u.id]) {
            state.soldierStats[u.id].survivedConflicts += 1;
          }
        });
      }
      state.policeHeat.level = Math.min(100, state.policeHeat.level + 15);
    }
    
    syncLegacyUnits(state);
    return state;
  };

  // ============ 3-STEP TAKEOVER: EXTORT (neutral only) ============
  const processTerritoryExtortion = (state: EnhancedMafiaGameState, action: any): EnhancedMafiaGameState => {
    const targetQ = action.targetQ;
    const targetR = action.targetR;
    const targetS = action.targetS;

    if (targetQ !== undefined) {
      const tile = state.hexMap.find(t => t.q === targetQ && t.r === targetR && t.s === targetS);
      if (!tile || tile.controllingFamily !== 'neutral' || tile.isHeadquarters) return state;

      const playerUnits = state.deployedUnits.filter(u => 
        u.family === state.playerFamily && u.q === targetQ && u.r === targetR && u.s === targetS
      );
      if (playerUnits.length === 0) return state;

      // 90% success for extortion of neutral territory
      let chance = 0.9;
      chance += state.familyBonuses.extortion / 100;
      chance = Math.min(0.99, chance);

      if (Math.random() < chance) {
        tile.controllingFamily = state.playerFamily;
        state.resources.money += 3000;
        state.resources.respect += 5;
        
        playerUnits.forEach(u => {
          if (state.soldierStats[u.id]) {
            state.soldierStats[u.id].extortions += 1;
          }
        });
        
        // 10% casualties
        const casualties = Math.floor(playerUnits.length * 0.1);
        for (let i = 0; i < casualties; i++) {
          const idx = state.deployedUnits.indexOf(playerUnits[i]);
          if (idx !== -1) state.deployedUnits.splice(idx, 1);
        }
      } else {
        // 20% casualties on failure
        const casualties = Math.max(1, Math.floor(playerUnits.length * 0.2));
        for (let i = 0; i < casualties; i++) {
          const idx = state.deployedUnits.indexOf(playerUnits[i]);
          if (idx !== -1) state.deployedUnits.splice(idx, 1);
        }
      }
      state.policeHeat.level = Math.min(100, state.policeHeat.level + 8);
    }

    syncLegacyUnits(state);
    return state;
  };

  // ============ WINNER CHECK ============
  const isWinner = gameState.victoryType !== null;

  return {
    gameState,
    endTurn,
    selectTerritory,
    performAction,
    performBusinessAction,
    performReputationAction,
    handleEventChoice,
    startMovementPhase,
    selectUnit,
    moveUnit,
    endMovementPhase,
    selectHeadquarters,
    selectUnitFromHeadquarters,
    deployUnit,
    isWinner,
  };
};
