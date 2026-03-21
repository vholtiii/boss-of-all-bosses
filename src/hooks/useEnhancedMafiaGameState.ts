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
  SOLDIER_COST, LOCAL_SOLDIER_COST, RECRUIT_TERRITORY_REQUIREMENT, CAPO_COST, HITMAN_MAINTENANCE_MULTIPLIER, MAX_HITMEN, HITMAN_REQUIREMENTS,
  MAX_CAPOS, CAPO_PROMOTION_COST, CAPO_PROMOTION_REQUIREMENTS,
  SOLDIER_LOYALTY_CAP, CAPO_LOYALTY_CAP,
  FamilyBonuses, CapoPersonality, AlliancePact, CeasefirePact, AllianceCondition, NegotiationType,
  NEGOTIATION_TYPES,
  ScoutedHex, Safehouse, MoveAction,
  FORTIFY_DEFENSE_BONUS, FORTIFY_CASUALTY_REDUCTION, SCOUT_DURATION, SCOUT_INTEL_BONUS, SAFEHOUSE_DURATION, MAX_ESCORT_SOLDIERS,
  BASE_ACTIONS_PER_TURN, BONUS_ACTION_RESPECT_THRESHOLD, BONUS_ACTION_INFLUENCE_THRESHOLD,
  TACTICAL_ACTIONS_PER_TURN,
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
  personality?: CapoPersonality;
  fortified?: boolean;
  escortingSoldierIds?: string[]; // capo only — IDs of soldiers being escorted
  recruited?: boolean; // true = locally recruited (loyal), false/undefined = mercenary (bought)
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

export type TurnPhase = 'deploy' | 'move' | 'action' | 'waiting';

export interface TurnReport {
  turn: number;
  income: number;
  maintenance: number;
  netIncome: number;
  aiActions: Array<{ family: string; action: string; detail: string }>;
  events: string[];
  resourceDeltas: { money: number; soldiers: number; respect: number; influence: number; loyalty: number; heat: number; territories: number };
  territoriesLost: string[];
  territoriesGained: string[];
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
  
  // Phase-based turn system
  turnPhase: TurnPhase;
  movementPhase: boolean; // kept for compat — derived from turnPhase
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
  alliances: AlliancePact[];
  ceasefires: CeasefirePact[];
  victoryProgress: VictoryProgress;
  victoryType: VictoryType;
  familyBonuses: FamilyBonuses;
  lastTurnIncome: number;
  pendingNotifications: Array<{ type: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string }>;
  
  // Move phase systems
  scoutedHexes: ScoutedHex[];
  safehouse: Safehouse | null;
  selectedMoveAction: MoveAction;
  
  // Action & tactical budgets
  actionsRemaining: number;
  maxActions: number;
  tacticalActionsRemaining: number;
  maxTacticalActions: number;
  
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
  
  turnReport: TurnReport | null;
  lastCombatResult?: {
    q: number; r: number; s: number;
    success: boolean;
    type: 'hit' | 'extort' | 'sabotage';
    title: string;
    details: string;
    timestamp: number;
  };
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
    if (q <= -4 && r >= 3) return 'Little Italy';
    if (q >= 3 && r <= -4) return 'Manhattan';
    if (q >= 3 && r >= 3) return 'Staten Island';
    if (q <= -4 && r <= -4) return 'Queens';
    if (r >= 3) return 'Brooklyn';
    if (r <= -4) return 'Bronx';
    if (q >= 3) return 'Manhattan';
    if (q <= -4) return 'Queens';
    return 'Brooklyn';
  };

  const terrainTypes: HexTile['terrain'][] = ['urban', 'industrial', 'residential', 'docks', 'commercial'];

  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      const s = -q - r;
      if (Math.abs(s) > radius) continue;

      const district = getDistrict(q, r);
      const terrain = terrainTypes[Math.abs((q * 7 + r * 13) % terrainTypes.length)];
      
      // District-specific business density, income multiplier, and type weights
      const districtConfig: Record<string, { density: number; incomeMult: number; weights: number[] }> = {
        'Manhattan':      { density: 0.35, incomeMult: 1.8, weights: [5, 40, 15, 40] },  // gambling dens & store fronts
        'Little Italy':   { density: 0.25, incomeMult: 1.0, weights: [5, 30, 10, 55] },  // restaurants/store fronts, card games
        'Brooklyn':       { density: 0.20, incomeMult: 0.9, weights: [20, 25, 30, 25] }, // balanced, more loan sharking
        'Bronx':          { density: 0.15, incomeMult: 0.7, weights: [35, 15, 35, 15] }, // grittier: brothels & loan sharking
        'Queens':         { density: 0.15, incomeMult: 0.8, weights: [10, 25, 15, 50] }, // immigrant businesses, store fronts
        'Staten Island':  { density: 0.10, incomeMult: 0.75, weights: [5, 10, 20, 65] }, // suburban, mostly store fronts
      };
      // weights order: [brothel, gambling_den, loan_sharking, store_front]
      const cfg = districtConfig[district] || { density: 0.20, incomeMult: 1.0, weights: [25, 25, 25, 25] };
      const hashVal = Math.abs((q * 31 + r * 47) % 100);
      const hasBusiness = hashVal < (cfg.density * 100);
      
      const tile: HexTile = { q, r, s, district, terrain, controllingFamily: 'neutral' };

      if (hasBusiness) {
        // Weighted business type selection using cumulative weights
        const typeHash = Math.abs((q * 17 + r * 23) % 100);
        const cumWeights = cfg.weights.reduce((acc: number[], w, i) => {
          acc.push((acc[i - 1] || 0) + w);
          return acc;
        }, []);
        const typeIdx = cumWeights.findIndex(cw => typeHash < cw);
        const bConfig = DOC_BUSINESS_TYPES[typeIdx >= 0 ? typeIdx : 0];
        
        const baseIncome = Math.round((bConfig.baseIncome + Math.abs((q * 13 + r * 29) % 2000)) * cfg.incomeMult);
        tile.business = {
          type: bConfig.type,
          income: baseIncome,
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
  gambino:  { q: -8, r:  8, s: 0,  district: 'Little Italy' },
  genovese: { q:  8, r: -8, s: 0,  district: 'Manhattan' },
  lucchese: { q: -8, r: -1, s: 9,  district: 'Queens' },
  bonanno:  { q:  7, r:  3, s: -10, district: 'Staten Island' },
  colombo:  { q:  0, r: -9, s: 9,  district: 'Bronx' },
};

// ============ INITIAL STATE ============
const createInitialGameState = (
  family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo' = 'gambino',
  startingResources?: { money: number; soldiers: number; influence: number; politicalPower: number; respect: number }
): EnhancedMafiaGameState => {
  const mapRadius = 10;
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

  // Use startingResources.soldiers for the player family if provided,
  // otherwise fall back to historically inspired defaults
  const familySoldierCount: Record<string, number> = {
    gambino: 4, genovese: 4, lucchese: 3, bonanno: 2, colombo: 1,
  };

  allFamilies.forEach(fam => {
    const hq = HQ_POSITIONS[fam];
    const soldierCount = (fam === family && startingResources?.soldiers)
      ? startingResources.soldiers
      : (familySoldierCount[fam] || 3);
    for (let i = 0; i < soldierCount; i++) {
      const id = `${fam}-soldier-${i}`;
      deployedUnits.push({
        id, type: 'soldier', family: fam,
        q: hq.q, r: hq.r, s: hq.s,
        movesRemaining: 2, maxMoves: 2, level: 1,
      });
      soldierStats[id] = {
        loyalty: 50, training: 0,
        hits: 0, extortions: 0, victories: 0, toughness: 0, racketeering: 0, turnsDeployed: 0,
      };
    }
    const capoNames: Record<string, string> = {
      gambino: 'Vito Scaletta', genovese: 'Sal Marcano', lucchese: 'Tommy Angelo',
      bonanno: 'Joe Barbaro', colombo: 'Frank Colletti'
    };
    const personalities: CapoPersonality[] = ['diplomat', 'enforcer', 'schemer'];
    const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];
    deployedUnits.push({
      id: `${fam}-capo-0`, type: 'capo', family: fam,
      q: hq.q, r: hq.r, s: hq.s,
      movesRemaining: 3, maxMoves: 3, level: 1, name: capoNames[fam],
      personality: randomPersonality,
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
    turnPhase: 'deploy' as TurnPhase, movementPhase: true,
    selectedUnitId: null, availableMoveHexes: [],
    deployMode: null, availableDeployHexes: [],
    headquarters: Object.fromEntries(allFamilies.map(f => [f, HQ_POSITIONS[f]])),
    units,
    
    // New systems
    soldierStats,
    hitmen: [],
    activeBribes: [],
    alliances: [],
    ceasefires: [],
    victoryProgress: {
      territory: { current: 0, target: 60, met: false },
      economic: { current: 0, target: 50000, met: false },
      legacy: { current: 0, highestRival: 0, met: false },
    },
    victoryType: null,
    familyBonuses: bonuses,
    lastTurnIncome: 0,
    pendingNotifications: [],
    scoutedHexes: [],
    safehouse: null,
    selectedMoveAction: 'move' as MoveAction,
    actionsRemaining: BASE_ACTIONS_PER_TURN,
    maxActions: BASE_ACTIONS_PER_TURN,
    tacticalActionsRemaining: TACTICAL_ACTIONS_PER_TURN,
    maxTacticalActions: TACTICAL_ACTIONS_PER_TURN,
    
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
    turnReport: null,
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
    const TERRITORY_TARGET = 60;
    const ECONOMIC_TARGET = 50000;
    const LEGACY_MIN_TURN = 15;
    const LEGACY_MARGIN = 1.25; // Must exceed rival by 25%

    const playerHexes = state.hexMap.filter(t => t.controllingFamily === state.playerFamily).length;
    const income = state.lastTurnIncome;
    const playerRep = state.reputation.respect + state.reputation.reputation + state.reputation.fear + state.reputation.streetInfluence;
    
    // Find highest rival legacy using territory + soldiers + wealth
    let highestRival = 0;
    state.aiOpponents.forEach(opp => {
      const oppTerritoryCount = state.hexMap.filter(t => t.controllingFamily === opp.family).length;
      const rivalRep = (oppTerritoryCount * 3) + (opp.resources.soldiers * 2) + (opp.resources.money / 500);
      if (rivalRep > highestRival) highestRival = Math.round(rivalRep);
    });

    const legacyMet = state.turn > LEGACY_MIN_TURN && highestRival > 0 && playerRep >= highestRival * LEGACY_MARGIN;

    state.victoryProgress = {
      territory: { current: playerHexes, target: TERRITORY_TARGET, met: playerHexes >= TERRITORY_TARGET },
      economic: { current: income, target: ECONOMIC_TARGET, met: income >= ECONOMIC_TARGET },
      legacy: { current: playerRep, highestRival, met: legacyMet },
    };

    const prevVictory = state.victoryType;
    if (state.victoryProgress.territory.met) state.victoryType = 'territory';
    else if (state.victoryProgress.economic.met) state.victoryType = 'economic';
    else if (state.victoryProgress.legacy.met) state.victoryType = 'legacy';
    else state.victoryType = null;

    // Notify on first victory
    if (state.victoryType && !prevVictory) {
      const labels: Record<string, string> = {
        territory: `Territory Domination — You control ${TERRITORY_TARGET}+ hexes!`,
        economic: `Economic Empire — $${ECONOMIC_TARGET.toLocaleString()}+ monthly income achieved!`,
        legacy: 'Legacy of Power — Your reputation surpasses all rivals by 25%!',
      };
      state.pendingNotifications = [...state.pendingNotifications, {
        type: 'success' as const, title: '🏆 VICTORY!',
        message: labels[state.victoryType] || 'You have won the game!',
      }];
    }
  };

  // ============ HELPER: check if hex is adjacent to enemy ============
  const isAdjacentToEnemy = (q: number, r: number, s: number, hexMap: HexTile[], deployedUnits: DeployedUnit[], playerFamily: string): boolean => {
    const neighbors = getHexNeighbors(q, r, s);
    return neighbors.some(n => {
      return deployedUnits.some(u => 
        u.family !== playerFamily && u.q === n.q && u.r === n.r && u.s === n.s
      );
    });
  };

  // ============ PHASE-BASED TURN SYSTEM ============
  const advancePhase = useCallback(() => {
    setGameState(prev => {
      const phaseOrder: TurnPhase[] = ['deploy', 'move', 'action'];
      const currentIdx = phaseOrder.indexOf(prev.turnPhase);
      const nextPhase = currentIdx < phaseOrder.length - 1 ? phaseOrder[currentIdx + 1] : 'waiting' as TurnPhase;
      
      // Calculate action budget when entering action phase
      let actionsRemaining = prev.actionsRemaining;
      let maxActions = prev.maxActions;
      if (nextPhase === 'action') {
        const hasBonus = prev.resources.respect >= BONUS_ACTION_RESPECT_THRESHOLD && 
                         prev.resources.influence >= BONUS_ACTION_INFLUENCE_THRESHOLD;
        maxActions = BASE_ACTIONS_PER_TURN + (hasBonus ? 1 : 0);
        actionsRemaining = maxActions;
      }
      
      // Reset movesRemaining for all player units when entering tactical phase
      let deployedUnits = prev.deployedUnits;
      if (nextPhase === 'move') {
        deployedUnits = prev.deployedUnits.map(u => {
          if (u.family !== prev.playerFamily) return u;
          const baseMoves = u.type === 'capo' ? 3 : 2;
          return { ...u, movesRemaining: baseMoves };
        });
      }

      return {
        ...prev,
        turnPhase: nextPhase,
        movementPhase: nextPhase === 'move' || nextPhase === 'deploy',
        selectedUnitId: null,
        availableMoveHexes: [],
        deployMode: null,
        availableDeployHexes: [],
        selectedMoveAction: 'move' as MoveAction,
        actionsRemaining,
        maxActions,
        deployedUnits,
        // Reset tactical budget when entering move (tactical) phase
        tacticalActionsRemaining: nextPhase === 'move' ? TACTICAL_ACTIONS_PER_TURN : prev.tacticalActionsRemaining,
      };
    });
  }, []);

  // Legacy compat — map to advancePhase
  const startMovementPhase = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      turnPhase: 'move' as TurnPhase,
      movementPhase: true, selectedUnitId: null, availableMoveHexes: [],
      deployMode: null, availableDeployHexes: [],
    }));
  }, []);

  const endMovementPhase = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      turnPhase: 'action' as TurnPhase,
      movementPhase: false, selectedUnitId: null, availableMoveHexes: [],
      deployMode: null, availableDeployHexes: [],
    }));
  }, []);

  // ============ SELECT UNIT FOR MOVEMENT ============
  const selectUnit = useCallback((unitType: 'soldier' | 'capo', location: { q: number; r: number; s: number }) => {
    setGameState(prev => {
      if (prev.turnPhase !== 'move' && prev.turnPhase !== 'deploy' && prev.turnPhase !== 'action') return prev;
      
      // Action phase: select unit and compute valid action target hexes
      if (prev.turnPhase === 'action') {
        const unit = prev.deployedUnits.find(u => 
          u.family === prev.playerFamily && u.type === unitType &&
          u.q === location.q && u.r === location.r && u.s === location.s
        );
        if (!unit) return prev;
        
        // If clicking the already-selected unit, deselect
        if (prev.selectedUnitId === unit.id) {
          return { ...prev, selectedUnitId: null, availableMoveHexes: [] };
        }
        
        // Compute valid action target hexes (adjacent hexes where actions can be performed)
        const neighbors = getHexNeighbors(unit.q, unit.r, unit.s);
        // Also include the unit's own hex (for safehouse on owned territory)
        const candidateHexes = [...neighbors, { q: unit.q, r: unit.r, s: unit.s }];
        
        const actionTargets = candidateHexes.filter(h => {
          const tile = prev.hexMap.find(t => t.q === h.q && t.r === h.r && t.s === h.s);
          if (!tile || tile.isHeadquarters) return false;
          
          const isEnemy = tile.controllingFamily !== 'neutral' && tile.controllingFamily !== prev.playerFamily;
          const isNeutral = tile.controllingFamily === 'neutral';
          const isOwned = tile.controllingFamily === prev.playerFamily;
          
          if (unitType === 'soldier') {
            // Soldiers can hit/sabotage enemy, extort neutral/enemy with business, claim neutral
            if (isEnemy) return true;
            if (isNeutral) return true;
          }
          if (unitType === 'capo') {
            // Capos can negotiate on enemy hexes, safehouse on owned
            if (isEnemy) return true;
            if (isOwned && h.q === unit.q && h.r === unit.r && h.s === unit.s) return true;
          }
          return false;
        });
        
        return { ...prev, selectedUnitId: unit.id, availableMoveHexes: actionTargets, deployMode: null, availableDeployHexes: [] };
      }

      const moveAction = prev.selectedMoveAction || 'move';
      const bypassMovesCheck = prev.turnPhase === 'move' && (moveAction === 'escort' || moveAction === 'fortify');
      const unit = prev.deployedUnits.find(u => 
        u.family === prev.playerFamily && u.type === unitType &&
        u.q === location.q && u.r === location.r && u.s === location.s &&
        (bypassMovesCheck || u.movesRemaining > 0)
      );
      if (!unit) return prev;


      // Tactical phase: only tactical actions (scout, fortify, safehouse, escort) — no regular movement
      if (prev.turnPhase === 'move') {
        if (moveAction === 'scout' && unitType === 'soldier') {
          if (prev.tacticalActionsRemaining <= 0) return prev;
          const neighbors = getHexNeighbors(unit.q, unit.r, unit.s);
          const scoutableHexes = neighbors.filter(h => {
            const tile = prev.hexMap.find(t => t.q === h.q && t.r === h.r && t.s === h.s);
            if (!tile) return false;
            return tile.controllingFamily !== prev.playerFamily;
          });
          return { ...prev, selectedUnitId: unit.id, availableMoveHexes: scoutableHexes, deployMode: null, availableDeployHexes: [] };
        }

        if (moveAction === 'safehouse' && unitType === 'capo') {
          if (prev.tacticalActionsRemaining <= 0) return prev;
          return { ...prev, selectedUnitId: unit.id, availableMoveHexes: [{ q: unit.q, r: unit.r, s: unit.s }], deployMode: null, availableDeployHexes: [] };
        }

        if (moveAction === 'fortify') {
          if (prev.tacticalActionsRemaining <= 0) return prev;
          if (unit.fortified) return prev; // Already fortified
          const newUnits = [...prev.deployedUnits];
          const fIdx = newUnits.findIndex(u => u.id === unit.id);
          newUnits[fIdx] = { ...unit, fortified: true, movesRemaining: 0 };
          return {
            ...prev, deployedUnits: newUnits,
            selectedUnitId: null, availableMoveHexes: [],
            tacticalActionsRemaining: prev.tacticalActionsRemaining - 1,
            pendingNotifications: [...prev.pendingNotifications, {
              type: 'info' as const, title: '🛡️ Unit Fortified',
              message: `${unit.type === 'capo' ? unit.name || 'Capo' : 'Soldier'} is fortified (+${FORTIFY_DEFENSE_BONUS}% defense, persists until movement).`,
            }],
          };
        }

        if (moveAction === 'escort') {
          if (prev.tacticalActionsRemaining <= 0) return prev;

          // If a soldier is already selected and user clicks a capo, trigger the escort directly
          if (prev.selectedUnitId && unitType === 'capo') {
            const selectedSoldier = prev.deployedUnits.find(u => u.id === prev.selectedUnitId && u.type === 'soldier');
            if (selectedSoldier && unit.family === prev.playerFamily && (unit.escortingSoldierIds?.length || 0) < MAX_ESCORT_SOLDIERS) {
              const newUnits = [...prev.deployedUnits];
              const soldierIdx = newUnits.findIndex(u => u.id === selectedSoldier.id);
              if (soldierIdx === -1) return prev;
              newUnits[soldierIdx] = { ...selectedSoldier, q: unit.q, r: unit.r, s: unit.s, movesRemaining: 0 };
              const capoIdx = newUnits.findIndex(u => u.id === unit.id);
              const existingEscorts = unit.escortingSoldierIds || [];
              newUnits[capoIdx] = { ...unit, escortingSoldierIds: [...existingEscorts, selectedSoldier.id] };
              return {
                ...prev, deployedUnits: newUnits,
                selectedUnitId: null, availableMoveHexes: [],
                tacticalActionsRemaining: prev.tacticalActionsRemaining - 1,
                pendingNotifications: [...prev.pendingNotifications, {
                  type: 'info' as const, title: '🚗 Soldier Called to Escort',
                  message: `A soldier has been called to ${unit.name || 'Capo'}'s location for escort duty.`,
                }],
              };
            }
            return prev;
          }

          // First step: select a soldier to show available capo targets
          if (unitType === 'soldier') {
            const capoHexes = prev.deployedUnits
              .filter(u => u.type === 'capo' && u.family === prev.playerFamily && (u.escortingSoldierIds?.length || 0) < MAX_ESCORT_SOLDIERS)
              .map(u => ({ q: u.q, r: u.r, s: u.s }));
            if (capoHexes.length === 0) return prev;
            return { ...prev, selectedUnitId: unit.id, availableMoveHexes: capoHexes, deployMode: null, availableDeployHexes: [] };
          }
          return prev;
        }

        // No regular movement in tactical phase
        return prev;
      }

      // Deploy phase: regular movement — soldiers CAN move onto enemy hexes
      const range = unitType === 'soldier' ? 1 : Math.min(5, unit.movesRemaining);
      const candidateHexes = unitType === 'soldier' 
        ? getHexNeighbors(unit.q, unit.r, unit.s)
        : getHexesInRange(unit.q, unit.r, unit.s, range);
      
      const validHexes = candidateHexes.filter(h => {
        const tile = prev.hexMap.find(t => t.q === h.q && t.r === h.r && t.s === h.s);
        if (!tile) return false;
        if (tile.isHeadquarters && tile.isHeadquarters !== prev.playerFamily) return false;
        return true;
      });

      return { ...prev, selectedUnitId: unit.id, availableMoveHexes: validHexes, deployMode: null, availableDeployHexes: [] };
    });
  }, []);

  // ============ MOVE UNIT (with zone-of-control + escort) ============
  const moveUnit = useCallback((targetLocation: { q: number; r: number; s: number }) => {
    setGameState(prev => {
      if (prev.turnPhase !== 'move' && prev.turnPhase !== 'deploy') return prev;
      // In tactical phase, only allow tactical actions — not regular movement
      const moveActionCheck = prev.selectedMoveAction || 'move';
      if (prev.turnPhase === 'move' && moveActionCheck === 'move') return prev;
      if (!prev.selectedUnitId) return prev;
      const unitIdx = prev.deployedUnits.findIndex(u => u.id === prev.selectedUnitId);
      if (unitIdx === -1) return prev;
      const unit = prev.deployedUnits[unitIdx];
      const moveAction = prev.selectedMoveAction || 'move';

      // Handle scout action (tactical phase only)
      if (prev.turnPhase === 'move' && moveAction === 'scout' && unit.type === 'soldier') {
        if (prev.tacticalActionsRemaining <= 0) return prev;
        const result = processScout(prev, unit, targetLocation);
        return { ...result, tacticalActionsRemaining: prev.tacticalActionsRemaining - 1 };
      }

      // Handle safehouse action (tactical phase only)
      if (prev.turnPhase === 'move' && moveAction === 'safehouse' && unit.type === 'capo') {
        if (prev.tacticalActionsRemaining <= 0) return prev;
        const result = processSafehouse(prev, unit);
        return { ...result, tacticalActionsRemaining: prev.tacticalActionsRemaining - 1 };
      }

      // Handle escort "call" action (tactical phase only) — teleport soldier to capo's hex
      if (prev.turnPhase === 'move' && moveAction === 'escort' && unit.type === 'soldier') {
        if (prev.tacticalActionsRemaining <= 0) return prev;
        // Find capo at target hex
        const capo = prev.deployedUnits.find(u => 
          u.type === 'capo' && u.family === prev.playerFamily &&
          u.q === targetLocation.q && u.r === targetLocation.r && u.s === targetLocation.s &&
          (u.escortingSoldierIds?.length || 0) < MAX_ESCORT_SOLDIERS
        );
        if (!capo) return prev;
        const newUnitsEscort = [...prev.deployedUnits];
        // Teleport soldier to capo's hex
        const soldierIdx = newUnitsEscort.findIndex(u => u.id === unit.id);
        if (soldierIdx === -1) return prev;
        newUnitsEscort[soldierIdx] = { ...unit, q: capo.q, r: capo.r, s: capo.s, movesRemaining: 0 };
        // Add soldier to capo's escort list
        const capoIdx = newUnitsEscort.findIndex(u => u.id === capo.id);
        const existingEscorts = capo.escortingSoldierIds || [];
        newUnitsEscort[capoIdx] = { ...capo, escortingSoldierIds: [...existingEscorts, unit.id] };
        return {
          ...prev, deployedUnits: newUnitsEscort,
          selectedUnitId: null, availableMoveHexes: [],
          tacticalActionsRemaining: prev.tacticalActionsRemaining - 1,
          pendingNotifications: [...prev.pendingNotifications, {
            type: 'info' as const, title: '🚗 Soldier Called to Escort',
            message: `A soldier has been called to ${capo.name || 'Capo'}'s location for escort duty.`,
          }],
        };
      }

      if (!prev.availableMoveHexes.some(h => h.q === targetLocation.q && h.r === targetLocation.r && h.s === targetLocation.s)) {
        return prev;
      }

      const moveCost = 1;
      if (unit.movesRemaining < moveCost) return prev;

      const newUnits = [...prev.deployedUnits];
      let remainingMoves = unit.movesRemaining - moveCost;

      // Zone of control: if soldier moves adjacent to enemy, movement ends
      if (unit.type === 'soldier') {
        if (isAdjacentToEnemy(targetLocation.q, targetLocation.r, targetLocation.s, prev.hexMap, prev.deployedUnits, prev.playerFamily)) {
          remainingMoves = 0;
        }
      }

      const updatedUnit = { ...unit, q: targetLocation.q, r: targetLocation.r, s: targetLocation.s, movesRemaining: remainingMoves, fortified: false };
      newUnits[unitIdx] = updatedUnit;

      // Handle escort: move escorted soldiers along with capo (works in any move action during deploy phase)
      if (unit.type === 'capo' && unit.escortingSoldierIds?.length) {
        unit.escortingSoldierIds.forEach(soldierIdToEscort => {
          const sIdx = newUnits.findIndex(u => u.id === soldierIdToEscort);
          if (sIdx !== -1) {
            newUnits[sIdx] = { ...newUnits[sIdx], q: targetLocation.q, r: targetLocation.r, s: targetLocation.s, movesRemaining: 0, fortified: false };
          }
        });
        // Auto-detach soldiers at destination
        newUnits[unitIdx] = { ...newUnits[unitIdx], escortingSoldierIds: [] };
      }

      // Only Capos auto-claim and auto-extort neutral tiles on move
      // Soldiers do NOT auto-claim — they must use the Action phase
      let autoExtortNotification: typeof prev.pendingNotifications[0] | null = null;
      let bonusMoney = 0;
      let bonusRespect = 0;
      const newHexMap = prev.hexMap.map(tile => {
        if (tile.q === targetLocation.q && tile.r === targetLocation.r && tile.s === targetLocation.s) {
          if (tile.controllingFamily === 'neutral' && !tile.isHeadquarters && unit.type === 'capo') {
            // Capo auto-extorts on arrival — skip the extort action step
            // Respect scales payout: 0 respect = 0.5x, 50 = 1.0x, 100 = 1.5x
            const respectPayoutMult = 0.5 + (prev.reputation.respect / 100);
            bonusMoney = Math.floor(3000 * respectPayoutMult);
            bonusRespect = 5;
            autoExtortNotification = {
              type: 'success' as const,
              title: '💰 Capo Auto-Extortion!',
              message: `${unit.name || 'Your Capo'} took over and extorted the territory on arrival! +$${bonusMoney.toLocaleString()}, +5 respect.`,
            };
            return { ...tile, controllingFamily: prev.playerFamily };
          }
        }
        return tile;
      });

      // Apply capo extortion bonuses
      let newResources = prev.resources;
      if (bonusMoney > 0) {
        newResources = { ...prev.resources, money: prev.resources.money + bonusMoney, respect: prev.resources.respect + bonusRespect };
      }

      let newAvailableMoves: Array<{q:number;r:number;s:number}> = [];
      if (updatedUnit.movesRemaining > 0) {
        const range = updatedUnit.type === 'soldier' ? 1 : Math.min(5, updatedUnit.movesRemaining);
        const candidates = updatedUnit.type === 'soldier'
          ? getHexNeighbors(updatedUnit.q, updatedUnit.r, updatedUnit.s)
          : getHexesInRange(updatedUnit.q, updatedUnit.r, updatedUnit.s, range);
        newAvailableMoves = candidates.filter(h => {
          const tile = newHexMap.find(t => t.q === h.q && t.r === h.r && t.s === h.s);
          if (!tile) return false;
          if (tile.isHeadquarters && tile.isHeadquarters !== prev.playerFamily) return false;
          return true;
        });
      }

      const notifications = autoExtortNotification 
        ? [...prev.pendingNotifications, autoExtortNotification]
        : prev.pendingNotifications;

      const newState = {
        ...prev, deployedUnits: newUnits, hexMap: newHexMap,
        resources: newResources,
        selectedUnitId: updatedUnit.movesRemaining > 0 ? updatedUnit.id : null,
        availableMoveHexes: newAvailableMoves,
        pendingNotifications: notifications,
      };
      syncLegacyUnits(newState);
      return newState;
    });
  }, []);

  // ============ FORTIFY UNIT ============
  const fortifyUnit = useCallback(() => {
    setGameState(prev => {
      if (prev.turnPhase !== 'move') return prev;
      if (prev.tacticalActionsRemaining <= 0) return prev;
      if (!prev.selectedUnitId) return prev;
      const unitIdx = prev.deployedUnits.findIndex(u => u.id === prev.selectedUnitId);
      if (unitIdx === -1) return prev;
      const unit = prev.deployedUnits[unitIdx];
      if (unit.family !== prev.playerFamily) return prev;
      if (unit.fortified) return prev; // Already fortified, don't waste action

      const newUnits = [...prev.deployedUnits];
      newUnits[unitIdx] = { ...unit, fortified: true, movesRemaining: 0 };

      return {
        ...prev, deployedUnits: newUnits,
        selectedUnitId: null, availableMoveHexes: [],
        tacticalActionsRemaining: prev.tacticalActionsRemaining - 1,
        pendingNotifications: [...prev.pendingNotifications, {
          type: 'info' as const, title: '🛡️ Unit Fortified',
          message: `${unit.type === 'capo' ? unit.name || 'Capo' : 'Soldier'} is fortified (+${FORTIFY_DEFENSE_BONUS}% defense).`,
        }],
      };
    });
  }, []);

  // ============ SCOUT HEX ============
  const processScout = (prev: EnhancedMafiaGameState, unit: DeployedUnit, targetLocation: { q: number; r: number; s: number }): EnhancedMafiaGameState => {
    const tile = prev.hexMap.find(t => t.q === targetLocation.q && t.r === targetLocation.r && t.s === targetLocation.s);
    if (!tile) return prev;
    const dist = hexDistance(unit, targetLocation);
    if (dist !== 1) return prev;

    const enemyUnitsOnHex = prev.deployedUnits.filter(u => 
      u.q === targetLocation.q && u.r === targetLocation.r && u.s === targetLocation.s &&
      u.family !== prev.playerFamily
    );

    const scoutInfo: ScoutedHex = {
      q: targetLocation.q, r: targetLocation.r, s: targetLocation.s,
      scoutedTurn: prev.turn,
      turnsRemaining: SCOUT_DURATION,
      enemySoldierCount: enemyUnitsOnHex.length,
      enemyFamily: tile.controllingFamily,
      businessType: tile.business?.type,
      businessIncome: tile.business?.income,
    };

    const newScoutedHexes = prev.scoutedHexes.filter(s => !(s.q === targetLocation.q && s.r === targetLocation.r && s.s === targetLocation.s));
    newScoutedHexes.push(scoutInfo);

    const newUnits = [...prev.deployedUnits];

    return {
      ...prev, deployedUnits: newUnits, scoutedHexes: newScoutedHexes,
      selectedUnitId: null, availableMoveHexes: [],
      selectedMoveAction: 'move' as MoveAction,
      pendingNotifications: [...prev.pendingNotifications, {
        type: 'info' as const, title: '👁️ Hex Scouted',
        message: tile.controllingFamily === 'neutral'
          ? `Neutral territory${tile.business ? `: ${tile.business.type} generating $${tile.business.income}/turn` : ': no businesses'}.`
          : `${tile.controllingFamily.toUpperCase()} territory: ${enemyUnitsOnHex.length} units${tile.business ? `, ${tile.business.type} ($${tile.business.income}/turn)` : ''}.`,
      }],
    };
  };

  // ============ SETUP SAFEHOUSE ============
  const processSafehouse = (prev: EnhancedMafiaGameState, unit: DeployedUnit): EnhancedMafiaGameState => {
    const tile = prev.hexMap.find(t => t.q === unit.q && t.r === unit.r && t.s === unit.s);
    if (!tile || tile.controllingFamily !== prev.playerFamily) return prev;

    const newUnits = [...prev.deployedUnits];

    const newSafehouse: Safehouse = {
      q: unit.q, r: unit.r, s: unit.s,
      turnsRemaining: SAFEHOUSE_DURATION,
      createdTurn: prev.turn,
    };

    return {
      ...prev, deployedUnits: newUnits, safehouse: newSafehouse,
      selectedUnitId: null, availableMoveHexes: [],
      selectedMoveAction: 'move' as MoveAction,
      pendingNotifications: [...prev.pendingNotifications, {
        type: 'success' as const, title: '🏠 Safehouse Established',
        message: `Secondary deploy point active for ${SAFEHOUSE_DURATION} turns.`,
      }],
    };
  };

  // ============ SET MOVE ACTION ============
  const setMoveAction = useCallback((action: MoveAction) => {
    setGameState(prev => ({
      ...prev,
      selectedMoveAction: action,
      selectedUnitId: null,
      availableMoveHexes: [],
    }));
  }, []);

  // ============ START ESCORT (legacy — now handled via tactical phase call) ============
  const startEscort = useCallback((capoId: string, soldierIds: string[]) => {
    setGameState(prev => {
      if (prev.turnPhase !== 'move') return prev;
      const capoIdx = prev.deployedUnits.findIndex(u => u.id === capoId && u.type === 'capo' && u.family === prev.playerFamily);
      if (capoIdx === -1) return prev;
      const capo = prev.deployedUnits[capoIdx];

      const validSoldierIds = soldierIds.filter(sid => {
        const s = prev.deployedUnits.find(u => u.id === sid);
        return s && s.type === 'soldier' && s.family === prev.playerFamily;
      }).slice(0, MAX_ESCORT_SOLDIERS);

      if (validSoldierIds.length === 0) return prev;

      const newUnits = [...prev.deployedUnits];
      // No movement penalty — capo keeps full movement range
      newUnits[capoIdx] = { ...capo, escortingSoldierIds: validSoldierIds };

      // Teleport soldiers to capo's hex
      validSoldierIds.forEach(sid => {
        const sIdx = newUnits.findIndex(u => u.id === sid);
        if (sIdx !== -1) {
          newUnits[sIdx] = { ...newUnits[sIdx], q: capo.q, r: capo.r, s: capo.s, movesRemaining: 0 };
        }
      });

      return {
        ...prev, deployedUnits: newUnits,
        selectedMoveAction: 'escort' as MoveAction,
        pendingNotifications: [...prev.pendingNotifications, {
          type: 'info' as const, title: '🚗 Escort Active',
          message: `${capo.name || 'Capo'} is escorting ${validSoldierIds.length} soldier(s). They will travel with the Capo and auto-detach at the destination.`,
        }],
      };
    });
  }, []);


  // ============ DEPLOY FROM HQ ============
  const selectHeadquarters = useCallback((family: string) => {}, []);

  const selectUnitFromHeadquarters = useCallback((unitType: 'soldier' | 'capo', family: string) => {
    setGameState(prev => {
      if (prev.turnPhase !== 'deploy') return prev; // Only during deploy phase
      if (family !== prev.playerFamily) return prev;
      const hq = prev.headquarters[family];
      if (!hq) return prev;

      if (unitType === 'soldier') {
        const atHQ = prev.deployedUnits.filter(u => 
          u.family === family && u.type === 'soldier' &&
          u.q === hq.q && u.r === hq.r && u.s === hq.s
        );
        // Must have soldiers at HQ or in undeployed reserve pool
        if (atHQ.length === 0 && prev.resources.soldiers <= 0) return prev;
      } else {
        const caposAtHQ = prev.deployedUnits.filter(u => 
          u.family === family && u.type === 'capo' &&
          u.q === hq.q && u.r === hq.r && u.s === hq.s
        );
        if (caposAtHQ.length === 0) return prev;
      }

      const range = unitType === 'soldier' ? 1 : 5;
      let candidates = unitType === 'soldier'
        ? getHexNeighbors(hq.q, hq.r, hq.s)
        : getHexesInRange(hq.q, hq.r, hq.s, range);
      
      // Add safehouse neighbors for soldier deployment
      if (unitType === 'soldier' && prev.safehouse) {
        const safehouseNeighbors = getHexNeighbors(prev.safehouse.q, prev.safehouse.r, prev.safehouse.s);
        candidates = [...candidates, ...safehouseNeighbors];
        // Deduplicate
        const seen = new Set<string>();
        candidates = candidates.filter(c => {
          const k = `${c.q},${c.r},${c.s}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      }

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
        // First try to move a soldier already sitting at HQ
        const soldierAtHQ = newDeployedUnits.findIndex(u => 
          u.family === family && u.type === 'soldier' &&
          u.q === hq.q && u.r === hq.r && u.s === hq.s
        );
        if (soldierAtHQ !== -1) {
          newDeployedUnits[soldierAtHQ] = {
            ...newDeployedUnits[soldierAtHQ],
            q: targetLocation.q, r: targetLocation.r, s: targetLocation.s, movesRemaining: 0,
          };
        } else if (prev.resources.soldiers > 0) {
          // Spawn from undeployed reserve pool
          const newId = `${family}-soldier-${Date.now()}-${Math.random().toString(36).substr(2,4)}`;
          newDeployedUnits.push({
            id: newId, type: 'soldier', family: family as any,
            q: targetLocation.q, r: targetLocation.r, s: targetLocation.s,
            movesRemaining: 0, maxMoves: 2, level: 1,
          });
          newSoldierStats[newId] = {
            loyalty: 50, training: 0,
            hits: 0, extortions: 0, victories: 0, toughness: 0, racketeering: 0, turnsDeployed: 0,
          };
          newResources.soldiers -= 1;
        } else {
          return prev; // No soldiers available
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

      // Only Capos auto-claim neutral hexes on deploy; soldiers do not
      const newHexMap = prev.hexMap.map(tile => {
        if (tile.q === targetLocation.q && tile.r === targetLocation.r && tile.s === targetLocation.s) {
          if (unitType === 'capo' && (tile.controllingFamily === 'neutral' || tile.controllingFamily === family) && !tile.isHeadquarters) {
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
      
      // Snapshot before-state for turn report
      const prevMoney = newState.resources.money;
      const prevSoldierCount = newState.deployedUnits.filter(u => u.family === newState.playerFamily).length;
      const prevRespect = newState.reputation.respect;
      const prevInfluence = newState.resources.influence;
      const prevLoyalty = newState.reputation.loyalty;
      const prevHeat = newState.policeHeat.level;
      const prevPlayerHexes = new Set(
        newState.hexMap.filter(t => t.controllingFamily === newState.playerFamily).map(t => `${t.q},${t.r},${t.s}`)
      );

      // Initialize turn report
      const turnReport: TurnReport = {
        turn: newState.turn,
        income: 0,
        maintenance: 0,
        netIncome: 0,
        aiActions: [],
        events: [],
        resourceDeltas: { money: 0, soldiers: 0, respect: 0, influence: 0, loyalty: 0, heat: 0, territories: 0 },
        territoriesLost: [],
        territoriesGained: [],
      };

      // Reset to deploy phase for next turn
      newState.turnPhase = 'deploy';
      newState.movementPhase = true;
      newState.selectedUnitId = null;
      newState.availableMoveHexes = [];
      newState.deployMode = null;
      newState.availableDeployHexes = [];
      newState.selectedMoveAction = 'move' as MoveAction;
      
      // Reset action & tactical budgets for new turn
      const hasBonus = newState.resources.respect >= BONUS_ACTION_RESPECT_THRESHOLD && 
                       newState.resources.influence >= BONUS_ACTION_INFLUENCE_THRESHOLD;
      newState.maxActions = BASE_ACTIONS_PER_TURN + (hasBonus ? 1 : 0);
      newState.actionsRemaining = newState.maxActions;
      newState.tacticalActionsRemaining = TACTICAL_ACTIONS_PER_TURN;
      newState.maxTacticalActions = TACTICAL_ACTIONS_PER_TURN;

      // Reset moves and escort for new turn (fortified persists until unit moves)
      newState.deployedUnits = (newState.deployedUnits || []).map(u => ({
        ...u, movesRemaining: u.maxMoves, escortingSoldierIds: undefined,
      }));

      // --- Training increment: +1 training per turn for soldiers deployed away from HQ ---
      newState.deployedUnits.forEach(u => {
        const stats = newState.soldierStats[u.id];
        if (!stats) return;
        const hq = newState.headquarters[u.family];
        const atHQ = hq && u.q === hq.q && u.r === hq.r && u.s === hq.s;
        if (!atHQ && u.type === 'soldier') {
          stats.training = Math.min(3, stats.training + 1);
          stats.turnsDeployed += 1;
        }
        // Enforce loyalty caps
        const isCapo = u.type === 'capo';
        stats.loyalty = Math.min(isCapo ? CAPO_LOYALTY_CAP : SOLDIER_LOYALTY_CAP, stats.loyalty);
      });

      // Tick scouted hexes
      newState.scoutedHexes = newState.scoutedHexes
        .map(s => ({ ...s, turnsRemaining: s.turnsRemaining - 1 }))
        .filter(s => s.turnsRemaining > 0);

      // Tick safehouse
      if (newState.safehouse) {
        newState.safehouse = { ...newState.safehouse, turnsRemaining: newState.safehouse.turnsRemaining - 1 };
        if (newState.safehouse.turnsRemaining <= 0) {
          newState.safehouse = null;
          newState.pendingNotifications = [...newState.pendingNotifications, {
            type: 'warning' as const, title: '🏠 Safehouse Expired',
            message: 'Your safehouse has been dismantled.',
          }];
        }
      }
      
      const seasons = ['spring', 'summer', 'fall', 'winter'] as const;
      newState.season = seasons[Math.floor((newState.turn - 1) / 3) % 4];
      
      processEconomy(newState);
      turnReport.income = newState.finances.totalIncome;
      turnReport.maintenance = newState.finances.totalExpenses;
      turnReport.netIncome = newState.finances.totalProfit;

      processAITurn(newState, turnReport);
      processWeather(newState);
      processEvents(newState);
      if (newState.events.length > 0) {
        newState.events.forEach(e => turnReport.events.push(e.title));
      }
      processBribes(newState);
      processPacts(newState);
      
      newState.reputation.reputation = Math.max(0, newState.reputation.reputation - 0.5);
      newState.reputation.fear = Math.max(0, newState.reputation.fear - 1);
      
      // --- Dynamic Loyalty Calculation ---
      {
        let loyaltyDelta = 0.5; // baseline recovery
        
        // +0.5 per successful extortion this turn (check turn report events)
        const extortionCount = turnReport.events.filter(e => e.toLowerCase().includes('extort')).length;
        loyaltyDelta += extortionCount * 0.5;
        
        // Soldiers lost this turn
        const afterSoldierCountForLoyalty = newState.deployedUnits.filter(u => u.family === newState.playerFamily).length;
        const soldiersLost = prevSoldierCount - afterSoldierCountForLoyalty;
        if (soldiersLost > 0) loyaltyDelta -= soldiersLost * 2;
        
        // Territories lost this turn
        const currentPlayerHexes = new Set(
          newState.hexMap.filter(t => t.controllingFamily === newState.playerFamily).map(t => `${t.q},${t.r},${t.s}`)
        );
        let territoriesLostCount = 0;
        prevPlayerHexes.forEach(h => { if (!currentPlayerHexes.has(h)) territoriesLostCount++; });
        if (territoriesLostCount > 0) loyaltyDelta -= territoriesLostCount * 3;
        
        // Can't afford soldier maintenance?
        const playerSoldiersForMaint = newState.deployedUnits.filter(u => u.family === newState.playerFamily && u.type === 'soldier');
        const totalMaint = playerSoldiersForMaint.length * SOLDIER_COST + newState.resources.soldiers * SOLDIER_COST;
        if (newState.resources.money < totalMaint) loyaltyDelta -= 5;
        
        newState.reputation.loyalty = Math.min(100, Math.max(0, newState.reputation.loyalty + loyaltyDelta));
      }
      
      // --- Loyalty Mechanical Effects ---
      {
        const loyalty = newState.reputation.loyalty;
        
        // High loyalty: combat bonus tracked via reputation (applied in combat calculations)
        // 80-100: +10% combat effectiveness — this is read from reputation.loyalty in combat
        
        // 30-49: Ratting risk — 15% chance someone talks to police
        if (loyalty >= 30 && loyalty < 50) {
          if (Math.random() < 0.15) {
            newState.policeHeat.level = Math.min(100, newState.policeHeat.level + 10);
            turnReport.events.push('🐀 Low loyalty! Someone in your crew talked to the police (+10 Heat)');
          }
        }
        
        // 10-29: Desertion risk — 15% chance of losing a soldier
        if (loyalty >= 10 && loyalty < 30) {
          if (Math.random() < 0.15) {
            const playerSoldiers = newState.deployedUnits.filter(u => u.family === newState.playerFamily && u.type === 'soldier');
            if (playerSoldiers.length > 0) {
              const deserter = playerSoldiers[Math.floor(Math.random() * playerSoldiers.length)];
              newState.deployedUnits = newState.deployedUnits.filter(u => u.id !== deserter.id);
              turnReport.events.push(`🚪 A soldier deserted due to dangerously low loyalty!`);
            }
          }
          // Also has ratting risk at this level
          if (Math.random() < 0.15) {
            newState.policeHeat.level = Math.min(100, newState.policeHeat.level + 10);
            turnReport.events.push('🐀 Critically low loyalty! Someone ratted you out (+10 Heat)');
          }
        }
        
        // 0-9: Mutiny — 20% chance of losing a soldier + respect penalty
        if (loyalty < 10) {
          if (Math.random() < 0.20) {
            const playerSoldiers = newState.deployedUnits.filter(u => u.family === newState.playerFamily && u.type === 'soldier');
            if (playerSoldiers.length > 0) {
              const mutineer = playerSoldiers[Math.floor(Math.random() * playerSoldiers.length)];
              newState.deployedUnits = newState.deployedUnits.filter(u => u.id !== mutineer.id);
              newState.reputation.respect = Math.max(0, newState.reputation.respect - 5);
              turnReport.events.push(`⚔️ MUTINY! A soldier turned against you! (-5 Respect)`);
            }
          }
          // Also has ratting risk
          if (Math.random() < 0.20) {
            newState.policeHeat.level = Math.min(100, newState.policeHeat.level + 25);
            newState.reputation.loyalty = Math.max(0, newState.reputation.loyalty - 15);
            newState.reputation.respect = Math.max(0, newState.reputation.respect - 10);
            turnReport.events.push('🐀 MUTINY! Someone ratted to the feds! (+25 Heat, -15 Loyalty, -10 Respect)');
          }
        }
      }
      
      // Sync resources.loyalty from reputation.loyalty
      newState.resources.loyalty = Math.round(newState.reputation.loyalty);
      
      // --- Passive heat from illegal operations ---
      {
        const illegalBizCount = newState.hexMap.filter(t => 
          t.controllingFamily === newState.playerFamily && t.business && !t.business.isLegal
        ).length;
        const passiveHeat = Math.floor(illegalBizCount / 3);
        if (passiveHeat > 0) {
          newState.policeHeat.level = Math.min(100, newState.policeHeat.level + passiveHeat);
        }
      }
      
      // --- Arrest System (after loyalty effects, before heat decay) ---
      {
        const heat = newState.policeHeat.level;
        
        // Heat 90-100: Player arrest risk (10%)
        if (heat >= 90 && Math.random() < 0.10) {
          const sentence = 3 + Math.floor(Math.random() * 3); // 3-5 turns
          newState.policeHeat.arrests.push({
            id: `arrest-player-${newState.turn}`,
            type: 'player',
            target: 'You',
            turn: newState.turn,
            sentence,
            impactOnProfit: 30,
          });
          turnReport.events.push(`🚨 FEDERAL ARREST! You've been indicted! -30% profits for ${sentence} turns.`);
          newState.pendingNotifications.push({
            type: 'error' as const, title: '🚨 You\'ve Been Arrested!',
            message: `Federal agents raided your operations. -30% profits for ${sentence} turns.`,
          });
        }
        // Heat 70-89: Management arrest (25%)
        else if (heat >= 70 && Math.random() < 0.25) {
          newState.policeHeat.arrests.push({
            id: `arrest-mgmt-${newState.turn}`,
            type: 'management',
            target: 'Lieutenant',
            turn: newState.turn,
            sentence: 5,
            impactOnProfit: 15,
          });
          newState.resources.influence = Math.max(0, newState.resources.influence - 2);
          turnReport.events.push('👔 Management arrest! A lieutenant was taken in. -2 Influence, -15% profits for 5 turns.');
        }
        // Heat 40-69: Street arrest (15%)
        else if (heat >= 40 && Math.random() < 0.15) {
          const playerSoldiers = newState.deployedUnits.filter(u => u.family === newState.playerFamily && u.type === 'soldier');
          if (playerSoldiers.length > 0) {
            const arrested = playerSoldiers[Math.floor(Math.random() * playerSoldiers.length)];
            newState.deployedUnits = newState.deployedUnits.filter(u => u.id !== arrested.id);
          }
          newState.policeHeat.arrests.push({
            id: `arrest-street-${newState.turn}`,
            type: 'street',
            target: 'Soldier',
            turn: newState.turn,
            sentence: 3,
            impactOnProfit: 5,
          });
          turnReport.events.push('🚔 Street arrest! A soldier was picked up by police. -5% profits for 3 turns.');
        }
      }
      
      // --- Update rattingRisk ---
      {
        const recentArrests = newState.policeHeat.arrests.filter(a => newState.turn - a.turn < 3).length;
        const loyalty = newState.reputation.loyalty;
        newState.policeHeat.rattingRisk = Math.min(100, Math.round(recentArrests * 15 * ((100 - loyalty) / 100)));
      }
      
      // --- Update reductionPerTurn from active bribes ---
      {
        let reduction = 2; // base
        const hasPatrol = newState.activeBribes.some(b => b.tier === 'patrol_officer' && b.active);
        if (hasPatrol) reduction += 2;
        newState.policeHeat.reductionPerTurn = reduction;
      }
      
      // --- Per-turn Influence growth ---
      const playerControlledHexes = newState.hexMap.filter(t => t.controllingFamily === newState.playerFamily).length;
      const activeAlliances = newState.alliances.filter(a => a.active).length;
      const influenceGain = Math.floor(playerControlledHexes / 3) + activeAlliances;
      const influenceDecay = 0.5;
      newState.resources.influence = Math.min(100, Math.max(0, newState.resources.influence + influenceGain - influenceDecay));
      // Sync influence with streetInfluence
      newState.reputation.streetInfluence = Math.round(newState.resources.influence);
      
      // --- Per-turn Respect growth ---
      const hexesWithBusinesses = newState.hexMap.filter(t => t.controllingFamily === newState.playerFamily && t.business).length;
      const incomeRespectGain = Math.min(5, Math.floor(newState.finances.totalIncome / 5000));
      const respectGain = Math.floor(hexesWithBusinesses / 5) + incomeRespectGain;
      const respectDecay = 0.5;
      newState.reputation.respect = Math.min(100, Math.max(0, newState.reputation.respect + respectGain - respectDecay));
      
      // --- Heat decay (after arrests) ---
      newState.policeHeat.level = Math.max(0, newState.policeHeat.level - newState.policeHeat.reductionPerTurn);
      
      // Compute turn report deltas
      const afterPlayerHexes = new Set(
        newState.hexMap.filter(t => t.controllingFamily === newState.playerFamily).map(t => `${t.q},${t.r},${t.s}`)
      );
      afterPlayerHexes.forEach(h => { if (!prevPlayerHexes.has(h)) turnReport.territoriesGained.push(h); });
      prevPlayerHexes.forEach(h => { if (!afterPlayerHexes.has(h)) turnReport.territoriesLost.push(h); });
      
      const afterSoldierCount = newState.deployedUnits.filter(u => u.family === newState.playerFamily).length;
      turnReport.resourceDeltas = {
        money: newState.resources.money - prevMoney,
        soldiers: afterSoldierCount - prevSoldierCount,
        respect: Math.round(newState.reputation.respect - prevRespect),
        influence: Math.round((newState.resources.influence - prevInfluence) * 10) / 10,
        loyalty: Math.round((newState.reputation.loyalty - prevLoyalty) * 10) / 10,
        heat: Math.round(newState.policeHeat.level - prevHeat),
        territories: afterPlayerHexes.size - prevPlayerHexes.size,
      };
      
      newState.turnReport = turnReport;
      
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

    // Community upkeep — $150/turn for each empty claimed hex (neighborhood expenses)
    const communityHexCount = (state.hexMap || []).filter(tile =>
      tile.controllingFamily === state.playerFamily && !tile.business && !tile.isHeadquarters
    ).length;
    const communityUpkeep = communityHexCount * 150;
    maintenance += communityUpkeep;
    
    // Apply arrest profit penalties
    const activeArrests = state.policeHeat.arrests.filter(a => state.turn - a.turn < a.sentence);
    const totalProfitPenalty = activeArrests.reduce((sum, a) => sum + a.impactOnProfit, 0);
    if (totalProfitPenalty > 0) {
      income = Math.floor(income * Math.max(0.1, (100 - totalProfitPenalty) / 100));
    }
    
    state.lastTurnIncome = income;
    state.resources.money += income - maintenance;
    state.finances.totalIncome = income;
    state.finances.totalExpenses = maintenance;
    state.finances.totalProfit = income - maintenance;

    // Auto-collect legal business profits each turn
    const legalBiz = (state.businesses || []).filter((b: any) => b.type === 'legal');
    const legalAutoIncome = legalBiz.reduce((sum: number, b: any) => {
      const baseProfit = b.monthlyIncome - b.monthlyExpenses;
      const extortionBonus = b.isExtorted ? baseProfit * b.extortionRate : 0;
      return sum + baseProfit + extortionBonus;
    }, 0) - (state.legalStatus?.totalLegalCosts || 0);
    if (legalAutoIncome > 0) {
      state.resources.money += legalAutoIncome;
      state.finances.totalIncome += legalAutoIncome;
      state.finances.totalProfit += legalAutoIncome;
    }
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
  const processAITurn = (state: EnhancedMafiaGameState, turnReport?: TurnReport) => {
    state.aiOpponents.forEach(opponent => {
      const fam = opponent.family as any;
      const hq = state.headquarters[fam];
      if (!hq) return;

      // ── INCOME ──
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
      // Minimum passive income so AI always grows
      aiIncome = Math.max(aiIncome, 2000 + state.turn * 500);
      opponent.resources.money += aiIncome;
      if (turnReport) turnReport.aiActions.push({ family: fam, action: 'income', detail: `Earned $${aiIncome.toLocaleString()} income` });

      // ── RECRUIT ── (always try to recruit up to a scaling cap)
      const soldierCap = Math.min(8, 3 + Math.floor(state.turn / 2));
      const currentDeployed = state.deployedUnits.filter(u => u.family === fam && u.type === 'soldier').length;
      const totalSoldiers = opponent.resources.soldiers + currentDeployed;
      const wantToRecruit = Math.max(0, soldierCap - totalSoldiers);
      if (wantToRecruit > 0) {
        const canAfford = Math.floor(opponent.resources.money / SOLDIER_COST);
        const toRecruit = Math.min(wantToRecruit, canAfford, 3);
        opponent.resources.soldiers += toRecruit;
        opponent.resources.money -= toRecruit * SOLDIER_COST;
        if (toRecruit > 0 && turnReport) turnReport.aiActions.push({ family: fam, action: 'recruit', detail: `Recruited ${toRecruit} soldier(s)` });
      }

      // ── DEPLOY ── (deploy ALL available soldiers from pool)
      let soldiersToPlace = opponent.resources.soldiers;
      while (soldiersToPlace > 0) {
        // Find valid hexes: HQ neighbors first, then neighbors of existing units
        const aiUnitPositions = state.deployedUnits
          .filter(u => u.family === fam)
          .map(u => ({ q: u.q, r: u.r, s: u.s }));
        const spawnPoints = [{ q: hq.q, r: hq.r, s: hq.s }, ...aiUnitPositions];
        
        let placed = false;
        for (const sp of spawnPoints) {
          const neighbors = getHexNeighbors(sp.q, sp.r, sp.s);
          const validTargets = neighbors.filter(n => {
            const tile = state.hexMap.find(t => t.q === n.q && t.r === n.r && t.s === n.s);
            if (!tile || tile.isHeadquarters) return false;
            // Prefer neutral or own territory, avoid stacking too many
            const unitsHere = state.deployedUnits.filter(u => u.q === n.q && u.r === n.r && u.s === n.s);
            return unitsHere.length < 2;
          });
          if (validTargets.length > 0) {
            const target = validTargets[Math.floor(Math.random() * validTargets.length)];
            const newId = `${fam}-soldier-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
            state.deployedUnits.push({
              id: newId, type: 'soldier', family: fam,
              q: target.q, r: target.r, s: target.s,
              movesRemaining: 2, maxMoves: 2, level: 1,
            });
            state.soldierStats[newId] = {
              loyalty: 40 + Math.floor(Math.random() * 30), training: 0,
              hits: 0, extortions: 0, victories: 0, toughness: 0, racketeering: 0, turnsDeployed: 0,
            };
            const tile = state.hexMap.find(t => t.q === target.q && t.r === target.r && t.s === target.s);
            if (tile && (tile.controllingFamily === 'neutral' || tile.controllingFamily === fam) && !tile.isHeadquarters) {
              tile.controllingFamily = fam;
            }
            soldiersToPlace--;
            placed = true;
            break; // one per spawn point cycle
          }
        }
        if (!placed) break; // no valid spots
      }
      opponent.resources.soldiers = soldiersToPlace; // leftover

      // ── MOVE ALL UNITS ── (each unit tries to move)
      const aiUnits = state.deployedUnits.filter(u => u.family === fam && u.movesRemaining > 0);
      for (const unit of aiUnits) {
        // Each unit gets up to 2 move attempts
        let movesLeft = Math.min(unit.movesRemaining, unit.type === 'soldier' ? 2 : 3);
        while (movesLeft > 0) {
          const neighbors = unit.type === 'soldier'
            ? getHexNeighbors(unit.q, unit.r, unit.s)
            : getHexesInRange(unit.q, unit.r, unit.s, Math.min(3, movesLeft));
          const validMoves = neighbors.filter(n => {
            const tile = state.hexMap.find(t => t.q === n.q && t.r === n.r && t.s === n.s);
            if (!tile || tile.isHeadquarters) return false;
            // Already own this hex — always valid
            if (tile.controllingFamily === fam) return true;
            // Only expand to hexes adjacent to already-controlled territory
            const nNeighbors = getHexNeighbors(n.q, n.r, n.s);
            return nNeighbors.some(nn => {
              const nt = state.hexMap.find(t => t.q === nn.q && t.r === nn.r && t.s === nn.s);
              return nt && (nt.controllingFamily === fam || (nt.isHeadquarters && state.headquarters[fam]?.q === nt.q && state.headquarters[fam]?.r === nt.r));
            });
          });
          if (validMoves.length === 0) break;

          // Prioritize: 1) player territory, 2) neutral territory, 3) expand away from HQ
          const playerHexes = validMoves.filter(n => {
            const tile = state.hexMap.find(t => t.q === n.q && t.r === n.r && t.s === n.s);
            return tile && tile.controllingFamily === state.playerFamily;
          });
          const neutralHexes = validMoves.filter(n => {
            const tile = state.hexMap.find(t => t.q === n.q && t.r === n.r && t.s === n.s);
            return tile && tile.controllingFamily === 'neutral';
          });
          const enemyHexes = validMoves.filter(n => {
            const tile = state.hexMap.find(t => t.q === n.q && t.r === n.r && t.s === n.s);
            return tile && tile.controllingFamily !== fam && tile.controllingFamily !== 'neutral';
          });

          let targetPool = playerHexes.length > 0 ? playerHexes
            : enemyHexes.length > 0 ? enemyHexes
            : neutralHexes.length > 0 ? neutralHexes
            : validMoves;
          
          // 30% chance to just expand to neutral instead of attacking (variety)
          if (neutralHexes.length > 0 && Math.random() < 0.3) {
            targetPool = neutralHexes;
          }

          const target = targetPool[Math.floor(Math.random() * targetPool.length)];
          unit.q = target.q;
          unit.r = target.r;
          unit.s = target.s;

          // Community resistance: entering player's empty claimed territory costs an extra move
          const targetTile = state.hexMap.find(t => t.q === target.q && t.r === target.r && t.s === target.s);
          const isCommunityHex = targetTile && targetTile.controllingFamily === state.playerFamily && !targetTile.business && !targetTile.isHeadquarters;
          const moveCost = isCommunityHex ? 2 : 1;
          unit.movesRemaining = Math.max(0, unit.movesRemaining - moveCost);
          movesLeft = Math.max(0, movesLeft - moveCost);

          const tile = state.hexMap.find(t => t.q === target.q && t.r === target.r && t.s === target.s);
          if (tile && !tile.isHeadquarters) {
            // Combat: check for enemy units on this hex
            const enemyUnitsHere = state.deployedUnits.filter(u =>
              u.family !== fam && u.q === target.q && u.r === target.r && u.s === target.s
            );
            if (enemyUnitsHere.length > 0) {
              const aiStrength = state.deployedUnits.filter(u => u.family === fam && u.q === target.q && u.r === target.r && u.s === target.s).length;
              // Combat resolution — attacker advantage
              if (aiStrength >= enemyUnitsHere.length || Math.random() < 0.4) {
                // Remove enemy units (with some surviving based on luck)
                enemyUnitsHere.forEach(eu => {
                  if (Math.random() < 0.7) { // 70% chance to eliminate each enemy
                    const idx = state.deployedUnits.indexOf(eu);
                    if (idx !== -1) state.deployedUnits.splice(idx, 1);
                  }
                });
                // Check if we cleared the hex
                const remainingEnemies = state.deployedUnits.filter(u =>
                  u.family !== fam && u.q === target.q && u.r === target.r && u.s === target.s
                );
                if (remainingEnemies.length === 0) {
                  tile.controllingFamily = fam;
                  // Destroy player safehouse if on this hex
                  if (state.safehouse && state.safehouse.q === target.q && state.safehouse.r === target.r && state.safehouse.s === target.s) {
                    state.safehouse = null;
                    state.pendingNotifications.push({
                      type: 'error' as const,
                      title: '🏠 Safehouse Destroyed',
                      message: `The ${fam} family captured the hex and destroyed your safehouse!`,
                    });
                  }
                }
                // AI may also lose units
                if (Math.random() < 0.3) {
                  const aiHere = state.deployedUnits.filter(u => u.family === fam && u.q === target.q && u.r === target.r && u.s === target.s);
                  if (aiHere.length > 1) {
                    const casualty = aiHere[Math.floor(Math.random() * aiHere.length)];
                    const idx = state.deployedUnits.indexOf(casualty);
                    if (idx !== -1) state.deployedUnits.splice(idx, 1);
                  }
                }
                // Notify player if their units were attacked
                if (enemyUnitsHere.some(u => u.family === state.playerFamily)) {
                  state.pendingNotifications.push({
                    type: 'warning' as const,
                    title: `⚔️ ${fam.charAt(0).toUpperCase() + fam.slice(1)} Attack!`,
                    message: `The ${fam} family attacked your units in ${tile.district || 'unknown territory'}!`,
                  });
                  if (turnReport) turnReport.aiActions.push({ family: fam, action: 'attack', detail: `Attacked your units in ${tile.district}` });
                }
              }
              break; // Stop moving after combat
            } else {
              // Claim empty territory
              if (tile.controllingFamily !== fam) {
                const prevOwner = tile.controllingFamily;
                tile.controllingFamily = fam;
                if (prevOwner === state.playerFamily && turnReport) {
                  turnReport.aiActions.push({ family: fam, action: 'capture', detail: `Captured your territory in ${tile.district}` });
                }
                // Destroy player safehouse if on this hex
                if (prevOwner === state.playerFamily && state.safehouse && state.safehouse.q === target.q && state.safehouse.r === target.r && state.safehouse.s === target.s) {
                  state.safehouse = null;
                  state.pendingNotifications.push({
                    type: 'error' as const,
                    title: '🏠 Safehouse Destroyed',
                    message: `The ${fam} family captured your territory and destroyed your safehouse!`,
                  });
                }
              }
            }
          }
        }
      }

      // ── DEPLOY CAPO ── (if capo is still at HQ, move it out)
      const caposAtHQ = state.deployedUnits.filter(u =>
        u.family === fam && u.type === 'capo' && u.q === hq.q && u.r === hq.r && u.s === hq.s
      );
      if (caposAtHQ.length > 0) {
        const capo = caposAtHQ[0];
        // Move capo to a controlled territory with a business
        const valuableTiles = state.hexMap.filter(t =>
          t.controllingFamily === fam && t.business && !t.isHeadquarters &&
          !state.deployedUnits.some(u => u.family === fam && u.type === 'capo' && u.q === t.q && u.r === t.r && u.s === t.s)
        );
        if (valuableTiles.length > 0) {
          valuableTiles.sort((a, b) => (b.business?.income || 0) - (a.business?.income || 0));
          const bestTile = valuableTiles[0];
          capo.q = bestTile.q;
          capo.r = bestTile.r;
          capo.s = bestTile.s;
          capo.movesRemaining = 0;
        }
      }

      // ── PROMOTE SOLDIERS TO CAPOS ── (AI follows same rules as player)
      const aiCapoCount = state.deployedUnits.filter(u => u.family === fam && u.type === 'capo').length;
      if (aiCapoCount < MAX_CAPOS && opponent.resources.money >= CAPO_PROMOTION_COST) {
        const aiSoldierUnits = state.deployedUnits.filter(u => u.family === fam && u.type === 'soldier');
        const aiHitmanIds = state.hitmen.filter(h => aiSoldierUnits.some(u => u.id === h.unitId)).map(h => h.unitId);
        
        // Find the best eligible soldier (highest victories)
        let bestCandidate: { unit: typeof aiSoldierUnits[0]; stats: SoldierStats } | null = null;
        for (const unit of aiSoldierUnits) {
          if (aiHitmanIds.includes(unit.id)) continue; // skip hitmen
          const stats = state.soldierStats[unit.id];
          if (!stats) continue;
          if (
            stats.victories >= CAPO_PROMOTION_REQUIREMENTS.minVictories &&
            stats.loyalty >= CAPO_PROMOTION_REQUIREMENTS.minLoyalty &&
            stats.training >= CAPO_PROMOTION_REQUIREMENTS.minTraining &&
            stats.toughness >= CAPO_PROMOTION_REQUIREMENTS.minToughness &&
            stats.racketeering >= CAPO_PROMOTION_REQUIREMENTS.minRacketeering
          ) {
            if (!bestCandidate || stats.victories > bestCandidate.stats.victories) {
              bestCandidate = { unit, stats };
            }
          }
        }

        if (bestCandidate) {
          const { unit } = bestCandidate;
          unit.type = 'capo' as any;
          unit.maxMoves = 3;
          unit.movesRemaining = 3;
          (unit as any).personality = (['diplomat', 'enforcer', 'schemer'] as const)[Math.floor(Math.random() * 3)];
          (unit as any).name = `${fam.charAt(0).toUpperCase() + fam.slice(1)} Capo`;
          opponent.resources.money -= CAPO_PROMOTION_COST;
          
          if (turnReport) {
            turnReport.aiActions.push({
              family: fam,
              action: 'promote',
              detail: `Promoted a soldier to Capo`,
            });
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
      
      // Actions that consume the action budget
      const actionPhaseActions = ['hit_territory', 'extort_territory', 'sabotage_hex', 'claim_territory', 'negotiate'];
      if (actionPhaseActions.includes(action.type) && newState.actionsRemaining <= 0) {
        newState.pendingNotifications = [...newState.pendingNotifications, {
          type: 'warning' as const, title: '⚠️ No Actions Remaining',
          message: 'You have used all your actions this turn.',
        }];
        return newState;
      }
      
      switch (action.type) {
        case 'hit_territory': {
          const result = processTerritoryHit(newState, action);
          result.actionsRemaining = Math.max(0, result.actionsRemaining - 1);
          return result;
        }
        case 'extort_territory': {
          const result = processTerritoryExtortion(newState, action);
          result.actionsRemaining = Math.max(0, result.actionsRemaining - 1);
          return result;
        }
        case 'sabotage_hex': {
          const result = processSabotageHex(newState, action);
          result.actionsRemaining = Math.max(0, result.actionsRemaining - 1);
          return result;
        }
        case 'claim_territory': {
          const result = processClaimTerritory(newState, action);
          result.actionsRemaining = Math.max(0, result.actionsRemaining - 1);
          return result;
        }
        case 'establish_safehouse':
          return processEstablishSafehouse(newState, action);
        case 'recruit_soldiers': {
          // Buy Mercenary — expensive, combat-ready, hurts loyalty
          if (newState.tacticalActionsRemaining <= 0) return newState;
          const respectDiscount = (newState.reputation.respect / 100) * 0.3;
          const cost = Math.floor(SOLDIER_COST * (1 - discount) * (1 - respectDiscount));
          if (newState.resources.money >= cost) {
            newState.resources.money -= cost;
            newState.resources.soldiers += 1;
            newState.tacticalActionsRemaining -= 1;
            // Mercenary loyalty penalty
            newState.reputation.loyalty = Math.max(0, newState.reputation.loyalty - 3);
            // Deploy mercenary at HQ
            const hq = newState.headquarters[newState.playerFamily];
            if (hq) {
              const newId = `${newState.playerFamily}-soldier-merc-${Date.now()}`;
              newState.deployedUnits = [...newState.deployedUnits, {
                id: newId, type: 'soldier' as const, family: newState.playerFamily,
                q: hq.q, r: hq.r, s: hq.s,
                movesRemaining: 0, maxMoves: 2, level: 1,
                recruited: false,
              }];
              newState.soldierStats[newId] = {
                loyalty: 50, training: 0,
                hits: 0, extortions: 0, victories: 0, toughness: 0, racketeering: 0, turnsDeployed: 0,
              };
            }
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'info' as const,
              title: '💰 Mercenary Hired',
              message: `A hired gun joins the family for $${cost.toLocaleString()}. Loyalty -3 (outsider).${respectDiscount > 0.01 ? ` Respect saved $${(Math.floor(SOLDIER_COST * (1 - discount)) - cost).toLocaleString()}.` : ''}`,
            }];
          }
          return newState;
        }
        case 'recruit_local_soldier': {
          // Recruit Loyal — cheap, territory-gated, boosts loyalty, lower combat stats
          if (newState.tacticalActionsRemaining <= 0) return newState;
          const playerTerritoryCount = newState.hexMap.filter(t => t.controllingFamily === newState.playerFamily).length;
          if (playerTerritoryCount < RECRUIT_TERRITORY_REQUIREMENT) {
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'warning' as const,
              title: '❌ Not Enough Territory',
              message: `You need ${RECRUIT_TERRITORY_REQUIREMENT} hexes to recruit locals. You have ${playerTerritoryCount}.`,
            }];
            return newState;
          }
          const respectDiscount2 = (newState.reputation.respect / 100) * 0.3;
          const cost2 = Math.floor(LOCAL_SOLDIER_COST * (1 - discount) * (1 - respectDiscount2));
          if (newState.resources.money >= cost2) {
            newState.resources.money -= cost2;
            newState.resources.soldiers += 1;
            newState.tacticalActionsRemaining -= 1;
            // Loyal recruit boosts loyalty
            newState.reputation.loyalty = Math.min(100, newState.reputation.loyalty + 2);
            // Deploy at HQ with recruited flag and lower training
            const hq = newState.headquarters[newState.playerFamily];
            if (hq) {
              const newId = `${newState.playerFamily}-soldier-recruit-${Date.now()}`;
              newState.deployedUnits = [...newState.deployedUnits, {
                id: newId, type: 'soldier' as const, family: newState.playerFamily,
                q: hq.q, r: hq.r, s: hq.s,
                movesRemaining: 0, maxMoves: 2, level: 1,
                recruited: true,
              }];
              newState.soldierStats[newId] = {
                loyalty: 65, training: 0,
                hits: 0, extortions: 0, victories: 0, toughness: 0, racketeering: 0, turnsDeployed: 0,
              };
            }
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'success' as const,
              title: '🏘️ Local Recruited',
              message: `A loyal local joins the family for $${cost2.toLocaleString()}. Loyalty +2. Good at claiming & extortion.`,
            }];
          }
          return newState;
        }
        // recruit_capo case removed — capos are only obtainable via promote_capo
        case 'promote_capo': {
          const unitId = action.unitId as string;
          const unit = newState.deployedUnits.find(u => u.id === unitId);
          if (!unit || unit.type !== 'soldier' || unit.family !== newState.playerFamily) return newState;
          
          const currentCapos = newState.deployedUnits.filter(u => u.type === 'capo' && u.family === newState.playerFamily).length;
          if (currentCapos >= MAX_CAPOS) return newState;
          if (newState.resources.money < CAPO_PROMOTION_COST) return newState;
          
          const stats = newState.soldierStats?.[unitId];
          if (stats) {
            if (
              stats.victories < CAPO_PROMOTION_REQUIREMENTS.minVictories ||
              stats.loyalty < CAPO_PROMOTION_REQUIREMENTS.minLoyalty ||
              stats.training < CAPO_PROMOTION_REQUIREMENTS.minTraining ||
              stats.toughness < CAPO_PROMOTION_REQUIREMENTS.minToughness ||
              stats.racketeering < CAPO_PROMOTION_REQUIREMENTS.minRacketeering
            ) return newState;
          }
          
          newState.resources.money -= CAPO_PROMOTION_COST;
          
          const personalities: CapoPersonality[] = ['diplomat', 'enforcer', 'schemer'];
          const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];
          const personalityLabel = randomPersonality.charAt(0).toUpperCase() + randomPersonality.slice(1);
          const capoName = `Capo ${Math.floor(Math.random() * 100)}`;
          
          newState.deployedUnits = newState.deployedUnits.map(u => 
            u.id === unitId ? {
              ...u,
              type: 'capo' as const,
              maxMoves: 3,
              movesRemaining: 0,
              name: capoName,
              personality: randomPersonality,
              level: 1,
            } : u
          );
          
          newState.hitmen = (newState.hitmen || []).filter(h => h.unitId !== unitId);
          
          newState.pendingNotifications = [...(newState.pendingNotifications || []), {
            type: 'success' as const,
            title: '⭐ Soldier Promoted to Capo!',
            message: `${capoName} (${personalityLabel}) now commands 3 moves per turn and can extort, escort, and negotiate.`,
          }];
          
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
          // Influence bonus: up to +12% at 100 influence
          successChance += Math.floor(newState.resources.influence / 8);
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
          newState.pendingNotifications = [...newState.pendingNotifications, {
            type: 'success', title: 'Hitman Promoted!',
            message: `A soldier has been elevated to Hitman. +30% hit success, 50% higher maintenance.`,
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
        case 'negotiate': {
          const result = processNegotiation(newState, action);
          result.actionsRemaining = Math.max(0, result.actionsRemaining - 1);
          return result;
        }
        default:
          return newState;
      }
    });
  }, []);

  const performBusinessAction = useCallback((action: any) => {
    setGameState(prev => {
      const newState = { ...prev };
      const businessNames: Record<string, string[]> = {
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
            const hasOfficerBribe = newState.policeHeat.bribedOfficials.some((o: any) => o.permissions.includes('run_prostitution'));
            const hasCaptainBribe = newState.policeHeat.bribedOfficials.some((o: any) => o.permissions.includes('run_gambling') || o.permissions.includes('run_loan_sharking'));
            
            if (action.businessType === 'prostitution' && !hasOfficerBribe) {
              newState.pendingNotifications = [...newState.pendingNotifications, {
                type: 'warning' as const, title: '🚫 Need Police Protection',
                message: 'You need to bribe a police officer before running prostitution businesses.',
              }];
              return newState;
            }
            if ((action.businessType === 'gambling' || action.businessType === 'loan_sharking') && !hasCaptainBribe) {
              newState.pendingNotifications = [...newState.pendingNotifications, {
                type: 'warning' as const, title: '🚫 Need Police Protection',
                message: 'You need to bribe a captain before running gambling/loan sharking businesses.',
              }];
              return newState;
            }
            
            const costs: Record<string, number> = {
              restaurant: 25000, laundromat: 15000, casino: 50000, construction: 40000,
              drug_trafficking: 30000, gambling: 20000, prostitution: 15000, loan_sharking: 10000
            };
            
            const cost = costs[action.businessType];
            if (newState.resources.money >= cost) {
              const names = businessNames[action.businessType] || ['Unknown Business'];
              const newBusiness = {
                id: `${action.businessType}_${Date.now()}`,
                name: names[Math.floor(Math.random() * names.length)],
                type: action.type === 'build_legal' ? 'legal' as const : 'illegal' as const,
                category: action.businessType,
                level: 1,
                monthlyIncome: action.type === 'build_legal' ? Math.floor(cost * 0.15) : Math.floor(cost * 0.25),
                monthlyExpenses: Math.floor(cost * 0.05),
                launderingCapacity: action.type === 'build_legal' ? Math.floor(cost * 0.1) : 0,
                extortionRate: 0,
                isExtorted: false,
                district: districts[Math.floor(Math.random() * districts.length)],
                heatLevel: action.type === 'build_illegal' ? 15 : 5
              };
              
              if (action.type === 'build_illegal') {
                newState.policeHeat.level += Math.floor(Math.random() * 10) + 5;
              }
              
              newState.businesses = [...newState.businesses, newBusiness];
              newState.resources.money -= cost;
              newState.resources.respect += 2;
              
              newState.pendingNotifications = [...newState.pendingNotifications, {
                type: 'success' as const, title: '🏢 Business Established',
                message: `${newBusiness.name} is now operational in ${newBusiness.district}.`,
              }];
            }
          }
          break;

        case 'upgrade':
          if (action.businessId) {
            const business = newState.businesses.find((b: any) => b.id === action.businessId);
            if (business && business.level < 5) {
              const upgradeCost = business.level * 15000;
              if (newState.resources.money >= upgradeCost) {
                business.level += 1;
                business.monthlyIncome = Math.floor(business.monthlyIncome * 1.4);
                business.launderingCapacity = Math.floor(business.launderingCapacity * 1.3);
                newState.resources.money -= upgradeCost;
                newState.pendingNotifications = [...newState.pendingNotifications, {
                  type: 'success' as const, title: '⬆️ Business Upgraded',
                  message: `${business.name} upgraded to level ${business.level}.`,
                }];
              }
            }
          }
          break;

        case 'extort':
          if (action.businessId) {
            const business = newState.businesses.find((b: any) => b.id === action.businessId);
            if (business && !business.isExtorted) {
              business.isExtorted = true;
              business.extortionRate = newState.resources.respect >= 50 ? 0.5 : 0.25;
              newState.resources.respect += 3;
              newState.pendingNotifications = [...newState.pendingNotifications, {
                type: 'success' as const, title: '💰 Protection Racket',
                message: `${business.name} is now paying ${business.extortionRate * 100}% protection money.`,
              }];
            }
          }
          break;

        case 'launder': {
          const totalLaunderingCapacity = newState.businesses
            .filter((b: any) => b.type === 'legal')
            .reduce((sum: number, b: any) => sum + b.launderingCapacity, 0);
          
          const amountToLaunder = Math.min(newState.finances.dirtyMoney, totalLaunderingCapacity);
          if (amountToLaunder > 0) {
            newState.finances.dirtyMoney -= amountToLaunder;
            newState.finances.cleanMoney += amountToLaunder;
            newState.resources.money += amountToLaunder;
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'success' as const, title: '🧺 Money Laundered',
              message: `$${amountToLaunder.toLocaleString()} has been cleaned through your legal businesses.`,
            }];
          } else {
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'warning' as const, title: '🧺 Nothing to Launder',
              message: totalLaunderingCapacity === 0 
                ? 'You need legal businesses to launder money.' 
                : 'No dirty money to launder.',
            }];
          }
          break;
        }

        case 'collect':
          if (action.businessId) {
            const business = newState.businesses.find((b: any) => b.id === action.businessId);
            if (business && business.type === 'illegal') {
              const profit = business.monthlyIncome - business.monthlyExpenses;
              newState.finances.dirtyMoney += profit;
              newState.resources.respect += 1;
              newState.pendingNotifications = [...newState.pendingNotifications, {
                type: 'success' as const, title: '💵 Profits Collected',
                message: `$${profit.toLocaleString()} in dirty money collected from ${business.name}.`,
              }];
            }
          }
          break;

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
              newState.pendingNotifications = [...newState.pendingNotifications, {
                type: 'success' as const, title: '⚖️ Lawyer Hired',
                message: `${lawyer.name} is now on retainer ($${lawyer.monthlyFee.toLocaleString()}/turn).`,
              }];
            }
          }
          break;

        case 'fire_lawyer':
          if (newState.legalStatus.lawyer) {
            const name = newState.legalStatus.lawyer.name;
            newState.legalStatus.lawyer = null;
            newState.legalStatus.totalLegalCosts = 0;
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'info' as const, title: '⚖️ Lawyer Fired',
              message: `${name} has been dismissed.`,
            }];
          }
          break;

        case 'bribe_official':
          if (action.officialId) {
            const availableOfficials = [
              { id: 'officer_murphy', rank: 'officer' as const, name: 'Officer Murphy', monthlyBribe: 2000, heatReduction: 1, permissions: ['run_prostitution'], territory: 'Brooklyn' },
              { id: 'sergeant_kowalski', rank: 'sergeant' as const, name: 'Sergeant Kowalski', monthlyBribe: 5000, heatReduction: 2, permissions: ['patrol_protection'], territory: 'Queens' },
              { id: 'captain_rodriguez', rank: 'captain' as const, name: 'Captain Rodriguez', monthlyBribe: 12000, heatReduction: 4, permissions: ['run_gambling', 'run_loan_sharking'], territory: 'Manhattan' },
              { id: 'chief_sullivan', rank: 'chief' as const, name: 'Chief Sullivan', monthlyBribe: 30000, heatReduction: 8, permissions: ['rival_intelligence'], territory: 'NYPD HQ' },
              { id: 'mayor_thompson', rank: 'mayor' as const, name: 'Mayor Thompson', monthlyBribe: 75000, heatReduction: 15, permissions: ['shutdown_rivals'], territory: 'City Hall' }
            ];
            
            const official = availableOfficials.find(o => o.id === action.officialId);
            if (official && !newState.policeHeat.bribedOfficials.some((b: any) => b.id === official.id)) {
              if (official.rank === 'mayor') {
                if (newState.finances.cleanMoney >= official.monthlyBribe) {
                  newState.finances.cleanMoney -= official.monthlyBribe;
                  newState.policeHeat.bribedOfficials = [...newState.policeHeat.bribedOfficials, official];
                  newState.policeHeat.reductionPerTurn += official.heatReduction;
                  newState.resources.respect += 2;
                }
              } else {
                const totalMoney = newState.finances.cleanMoney + newState.finances.dirtyMoney;
                if (totalMoney >= official.monthlyBribe) {
                  if (newState.finances.dirtyMoney >= official.monthlyBribe) {
                    newState.finances.dirtyMoney -= official.monthlyBribe;
                  } else {
                    const remainingCost = official.monthlyBribe - newState.finances.dirtyMoney;
                    newState.finances.dirtyMoney = 0;
                    newState.finances.cleanMoney -= remainingCost;
                  }
                  newState.policeHeat.bribedOfficials = [...newState.policeHeat.bribedOfficials, official];
                  newState.policeHeat.reductionPerTurn += official.heatReduction;
                  newState.resources.respect += 2;
                }
              }
            }
          }
          break;

        case 'stop_bribe':
          if (action.officialId) {
            const officialIndex = newState.policeHeat.bribedOfficials.findIndex((o: any) => o.id === action.officialId);
            if (officialIndex !== -1) {
              const official = newState.policeHeat.bribedOfficials[officialIndex];
              newState.policeHeat.reductionPerTurn -= official.heatReduction;
              newState.policeHeat.bribedOfficials = newState.policeHeat.bribedOfficials.filter((_: any, i: number) => i !== officialIndex);
              newState.policeHeat.level += 10;
            }
          }
          break;

        case 'rival_info':
          newState.pendingNotifications = [...newState.pendingNotifications, {
            type: 'info' as const, title: '🕵️ Intelligence Report',
            message: 'Your contacts have gathered intelligence on rival operations.',
          }];
          break;

        case 'shutdown_rival':
          if (action.rivalFamily && newState.policeHeat.bribedOfficials.some((o: any) => o.permissions.includes('shutdown_rivals'))) {
            const rivalFamily = action.rivalFamily as keyof typeof newState.familyControl;
            if (newState.familyControl[rivalFamily] !== undefined) {
              newState.familyControl[rivalFamily] = Math.max(0, newState.familyControl[rivalFamily] - 5);
              newState.familyControl[newState.playerFamily as keyof typeof newState.familyControl] += 2;
              newState.resources.respect += 3;
            }
          }
          break;
      }

      // Recalculate finances after every action
      const legalBiz = newState.businesses.filter((b: any) => b.type === 'legal');
      const illegalBiz = newState.businesses.filter((b: any) => b.type === 'illegal');

      newState.finances.legalProfit = legalBiz.reduce((sum: number, b: any) => {
        const baseProfit = b.monthlyIncome - b.monthlyExpenses;
        const extortionBonus = b.isExtorted ? baseProfit * b.extortionRate : 0;
        return sum + baseProfit + extortionBonus;
      }, 0) - newState.legalStatus.totalLegalCosts;

      newState.finances.illegalProfit = illegalBiz.reduce((sum: number, b: any) =>
        sum + (b.monthlyIncome - b.monthlyExpenses), 0
      );

      newState.finances.totalProfit = newState.finances.legalProfit + newState.finances.illegalProfit;
      newState.finances.totalIncome = newState.businesses.reduce((sum: number, b: any) => sum + b.monthlyIncome, 0);
      newState.finances.totalExpenses = newState.businesses.reduce((sum: number, b: any) => sum + b.monthlyExpenses, 0) + newState.legalStatus.totalLegalCosts;
      newState.finances.legalCosts = newState.legalStatus.totalLegalCosts;

      const totalHeat = illegalBiz.reduce((sum: number, b: any) => sum + b.heatLevel, 0);
      newState.legalStatus.prosecutionRisk = Math.min(100, totalHeat / 2);

      return newState;
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

  // ============ SABOTAGE HEX (action phase) ============
  const processSabotageHex = (state: EnhancedMafiaGameState, action: any): EnhancedMafiaGameState => {
    const { targetQ, targetR, targetS } = action;
    const tile = state.hexMap.find(t => t.q === targetQ && t.r === targetR && t.s === targetS);
    if (!tile || !tile.business || tile.controllingFamily === state.playerFamily || tile.isHeadquarters) return state;

    // Reduce business income by 40-60%
    const reduction = 0.4 + Math.random() * 0.2;
    const oldIncome = tile.business.income;
    tile.business.income = Math.max(100, Math.floor(oldIncome * (1 - reduction)));
    tile.business.heatLevel = Math.min(100, tile.business.heatLevel + 20);

    // Increase police heat
    state.policeHeat.level = Math.min(100, state.policeHeat.level + 10);

    // Damage relationship with owning family
    if (state.reputation.familyRelationships[tile.controllingFamily] !== undefined) {
      state.reputation.familyRelationships[tile.controllingFamily] -= 10;
    }

    state.pendingNotifications = [...state.pendingNotifications, {
      type: 'success', title: '💣 Sabotage Successful!',
      message: `${tile.controllingFamily}'s ${tile.business.type} income reduced from $${oldIncome.toLocaleString()} to $${tile.business.income.toLocaleString()}/turn. +10 Heat.`,
    }];

    syncLegacyUnits(state);
    updateVictoryProgress(state);
    return state;
  };

  // ============ CLAIM TERRITORY (soldiers only, action phase) ============
  const processClaimTerritory = (state: EnhancedMafiaGameState, action: any): EnhancedMafiaGameState => {
    const { targetQ, targetR, targetS } = action;
    const tile = state.hexMap.find(t => t.q === targetQ && t.r === targetR && t.s === targetS);
    if (!tile || tile.controllingFamily !== 'neutral' || tile.isHeadquarters) return state;

    const playerSoldiersOnHex = state.deployedUnits.filter(u => 
      u.family === state.playerFamily && u.type === 'soldier' &&
      u.q === targetQ && u.r === targetR && u.s === targetS
    );
    const claimNeighbors = getHexNeighbors(targetQ, targetR, targetS);
    const playerSoldiersAdjacent = state.deployedUnits.filter(u => 
      u.family === state.playerFamily && u.type === 'soldier' &&
      claimNeighbors.some(n => n.q === u.q && n.r === u.r && n.s === u.s)
    );
    const playerSoldiers = [...playerSoldiersOnHex, ...playerSoldiersAdjacent];
    if (playerSoldiers.length === 0) return state;

    tile.controllingFamily = state.playerFamily;

    // Community expansion: +1 respect, +1 influence, no money
    let respectGain = 1;
    let influenceGain = 1;
    // Recruited soldier bonus: +15% translates to extra respect/influence
    const hasRecruitedSoldier = playerSoldiers.some(u => u.recruited);
    if (hasRecruitedSoldier) {
      respectGain += 1; // bonus from local knowledge
      influenceGain += 1;
    }
    state.reputation.respect = Math.min(100, state.reputation.respect + respectGain);
    state.reputation.streetInfluence = Math.min(100, state.reputation.streetInfluence + influenceGain);

    const claimBonus = hasRecruitedSoldier ? ' (Recruit bonus!)' : '';
    state.pendingNotifications = [...state.pendingNotifications, {
      type: 'success' as const, title: '🏴 Territory Claimed!',
      message: `Your family takes ${tile.district} under its wing.${claimBonus} (+${respectGain} Respect, +${influenceGain} Influence)`,
    }];

    syncLegacyUnits(state);
    updateVictoryProgress(state);
    return state;
  };

  // ============ ESTABLISH SAFEHOUSE (action phase) ============
  const processEstablishSafehouse = (state: EnhancedMafiaGameState, action: any): EnhancedMafiaGameState => {
    const { targetQ, targetR, targetS } = action;
    const tile = state.hexMap.find(t => t.q === targetQ && t.r === targetR && t.s === targetS);
    if (!tile || tile.controllingFamily !== state.playerFamily || tile.isHeadquarters) return state;

    // Only one safehouse at a time
    state.safehouse = {
      q: targetQ, r: targetR, s: targetS,
      turnsRemaining: SAFEHOUSE_DURATION,
      createdTurn: state.turn,
    };

    state.pendingNotifications = [...state.pendingNotifications, {
      type: 'success', title: '🏠 Safehouse Established!',
      message: `New safehouse at ${tile.district}. Acts as secondary deploy point for ${SAFEHOUSE_DURATION} turns.`,
    }];

    return state;
  };

  // ============ 3-STEP TAKEOVER: HIT ============
  const processTerritoryHit = (state: EnhancedMafiaGameState, action: any): EnhancedMafiaGameState => {
    const targetQ = action.targetQ;
    const targetR = action.targetR;
    const targetS = action.targetS;
    
    if (targetQ !== undefined) {
      const tile = state.hexMap.find(t => t.q === targetQ && t.r === targetR && t.s === targetS);
      if (!tile || tile.controllingFamily === state.playerFamily || tile.isHeadquarters) return state;

      // Check ceasefire
      const hasCeasefire = state.ceasefires.some(c => c.active && c.family === tile.controllingFamily);
      // Check alliance
      const hasAlliance = state.alliances.some(a => a.active && a.alliedFamily === tile.controllingFamily);
      if (hasCeasefire || hasAlliance) {
        if (hasAlliance) {
          // Breaking alliance — dissolve with penalty
          state.alliances = state.alliances.map(a => 
            a.active && a.alliedFamily === tile.controllingFamily ? { ...a, active: false } : a
          ).filter(a => a.active);
          state.reputation.respect = Math.max(0, state.reputation.respect - 25);
          state.reputation.reputation = Math.max(0, state.reputation.reputation - 15);
          if (state.reputation.familyRelationships[tile.controllingFamily] !== undefined) {
            state.reputation.familyRelationships[tile.controllingFamily] -= 40;
          }
          state.pendingNotifications = [...state.pendingNotifications, {
            type: 'error', title: '💔 Alliance Broken!',
            message: `You attacked your ally! -25 respect, -15 reputation. Relations devastated.`,
          }];
        }
        if (hasCeasefire) {
          state.ceasefires = state.ceasefires.filter(c => !(c.active && c.family === tile.controllingFamily));
          state.reputation.respect = Math.max(0, state.reputation.respect - 15);
          state.pendingNotifications = [...state.pendingNotifications, {
            type: 'warning', title: '⚠️ Ceasefire Violated!',
            message: `You broke the ceasefire! -15 respect.`,
          }];
        }
      }

      // Fix 1: Only selected unit + player units already ON target hex participate
      const selectedUnitId = action.selectedUnitId;
      const playerUnitsOnHex = state.deployedUnits.filter(u => 
        u.family === state.playerFamily && u.q === targetQ && u.r === targetR && u.s === targetS
      );
      const selectedUnit = state.deployedUnits.find(u => u.id === selectedUnitId);
      const playerUnits: typeof playerUnitsOnHex = [];
      // Add selected unit first (if not already on hex)
      if (selectedUnit && !playerUnitsOnHex.some(u => u.id === selectedUnit.id)) {
        playerUnits.push(selectedUnit);
      }
      // Add units already on the target hex
      playerUnits.push(...playerUnitsOnHex);
      if (playerUnits.length === 0) return state;

      const enemyUnits = state.deployedUnits.filter(u => 
        u.family === tile.controllingFamily && u.q === targetQ && u.r === targetR && u.s === targetS
      );

      // Fix 2: Scaled success chance based on force ratio
      const attackers = playerUnits.length;
      const defenders = enemyUnits.length;
      let chance = 0.5 + (attackers - defenders) * 0.15;
      
      // Apply fortified defense bonus for defenders
      const fortifiedDefenders = enemyUnits.filter(u => u.fortified);
      if (fortifiedDefenders.length > 0) {
        chance -= FORTIFY_DEFENSE_BONUS / 100;
      }
      // Apply fortified bonus for player attackers
      const fortifiedAttackers = playerUnits.filter(u => u.fortified);
      if (fortifiedAttackers.length > 0) {
        chance += FORTIFY_DEFENSE_BONUS / 200;
      }
      
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

      // Apply scout intelligence bonus
      const isScouted = state.scoutedHexes.some(s => s.q === targetQ && s.r === targetR && s.s === targetS);
      if (isScouted) {
        chance += SCOUT_INTEL_BONUS / 100;
      }
      
      chance = Math.max(0.1, Math.min(0.95, chance));

      // Fix 5: Scale heat with battle size
      const totalUnitsInvolved = attackers + defenders;
      const heatGain = Math.min(25, 8 + totalUnitsInvolved * 2);

      if (Math.random() < chance) {
        // Victory
        enemyUnits.forEach(eu => {
          const idx = state.deployedUnits.indexOf(eu);
          if (idx !== -1) state.deployedUnits.splice(idx, 1);
        });
        tile.controllingFamily = null; // Hit clears enemy control — player must Claim next turn
        
        // Fix 3: Replace money with fear/respect
        state.resources.respect += 5;
        state.reputation.fear = Math.min(100, (state.reputation.fear || 0) + 5);
        
        playerUnits.forEach(u => {
          if (state.soldierStats[u.id]) {
            state.soldierStats[u.id].hits += 1;
            state.soldierStats[u.id].victories = Math.min(5, state.soldierStats[u.id].victories + 1);
            state.soldierStats[u.id].toughness = Math.min(5, state.soldierStats[u.id].toughness + 1);
          }
        });
        
        let casualties = Math.max(0, Math.floor(playerUnits.length * 0.2));
        const attackersFortified = playerUnits.some(u => u.fortified);
        if (attackersFortified) {
          casualties = Math.max(0, Math.floor(casualties * (1 - FORTIFY_CASUALTY_REDUCTION / 100)));
        }
        // Fix 4: Random casualty selection — shuffle before removing
        const shuffled = [...playerUnits].sort(() => Math.random() - 0.5);
        for (let i = 0; i < casualties; i++) {
          const idx = state.deployedUnits.indexOf(shuffled[i]);
          if (idx !== -1) state.deployedUnits.splice(idx, 1);
        }
        const hitDetails = `+5 fear, +5 respect${casualties > 0 ? `, ${casualties} casualt${casualties > 1 ? 'ies' : 'y'}` : ''}`;
        state.lastCombatResult = {
          q: targetQ, r: targetR, s: targetS,
          success: true, type: 'hit',
          title: 'TERRITORY CAPTURED!',
          details: hitDetails,
          timestamp: Date.now(),
        };
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'success', title: 'Territory Captured!',
          message: `Hit successful! ${hitDetails}.`,
        }];
      } else {
        let casualties = Math.max(1, Math.floor(playerUnits.length * 0.4));
        const defendersFortified = playerUnits.some(u => u.fortified);
        if (defendersFortified) {
          casualties = Math.max(1, Math.floor(casualties * (1 - FORTIFY_CASUALTY_REDUCTION / 100)));
        }
        // Fix 4: Random casualty selection on failure too
        const shuffled = [...playerUnits].sort(() => Math.random() - 0.5);
        for (let i = 0; i < casualties; i++) {
          const idx = state.deployedUnits.indexOf(shuffled[i]);
          if (idx !== -1) state.deployedUnits.splice(idx, 1);
        }
        shuffled.slice(casualties).forEach(u => {
          if (state.soldierStats[u.id]) {
            state.soldierStats[u.id].toughness = Math.min(5, state.soldierStats[u.id].toughness + 1);
          }
        });
        const failDetails = `${casualties} casualt${casualties > 1 ? 'ies' : 'y'} suffered`;
        state.lastCombatResult = {
          q: targetQ, r: targetR, s: targetS,
          success: false, type: 'hit',
          title: 'HIT FAILED!',
          details: failDetails,
          timestamp: Date.now(),
        };
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'error', title: 'Hit Failed!',
          message: `The attack was repelled. ${failDetails}.`,
        }];
      }
      state.policeHeat.level = Math.min(100, state.policeHeat.level + heatGain);
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
      if (!tile || tile.isHeadquarters) return state;
      
      const isNeutral = tile.controllingFamily === 'neutral';
      const isEnemy = tile.controllingFamily !== 'neutral' && tile.controllingFamily !== state.playerFamily;
      if (!isNeutral && !isEnemy) return state;

      // Check for player units on OR adjacent to the target hex
      const playerUnitsOnHex = state.deployedUnits.filter(u => 
        u.family === state.playerFamily && u.q === targetQ && u.r === targetR && u.s === targetS
      );
      const neighbors = getHexNeighbors(targetQ, targetR, targetS);
      const playerUnitsAdjacent = state.deployedUnits.filter(u => 
        u.family === state.playerFamily && 
        neighbors.some(n => n.q === u.q && n.r === u.r && n.s === u.s)
      );
      const allPlayerUnits = [...playerUnitsOnHex, ...playerUnitsAdjacent];
      if (allPlayerUnits.length === 0) return state;

      // Neutral: 90% success, claims territory. Enemy: 50% success, steals income only.
      let chance = isNeutral ? 0.9 : 0.5;
      chance += state.familyBonuses.extortion / 100;
      // Heat penalty: up to -10% at max heat
      chance -= state.policeHeat.level / 1000;
      // Influence bonus: up to +15% at 100 influence
      chance += (state.resources.influence / 100) * 0.15;
      // Manhattan has heavy police presence — extortion is 20% harder
      if (tile.district === 'Manhattan') {
        chance *= 0.8;
      }
      // Recruited soldier bonus: +10% extortion success
      const hasRecruitedUnit = allPlayerUnits.some(u => u.recruited);
      if (hasRecruitedUnit) {
        chance += 0.10;
      }
      chance = Math.min(0.99, chance);

      if (Math.random() < chance) {
        if (isNeutral) {
          tile.controllingFamily = state.playerFamily;
        }
        const baseMoneyGain = isEnemy ? (tile.business?.income || 2000) : 3000;
        // Respect scales payout: 0 respect = 0.5x, 50 = 1.0x, 100 = 1.5x
        const respectPayoutMultiplier = 0.5 + (state.reputation.respect / 100);
        const moneyGain = Math.floor(baseMoneyGain * respectPayoutMultiplier);
        const respectGain = isEnemy ? 3 : 5;
        state.resources.money += moneyGain;
        state.resources.respect += respectGain;
        
        allPlayerUnits.forEach(u => {
          if (state.soldierStats[u.id]) {
            state.soldierStats[u.id].extortions += 1;
            state.soldierStats[u.id].victories = Math.min(5, state.soldierStats[u.id].victories + 1);
            state.soldierStats[u.id].racketeering = Math.min(5, state.soldierStats[u.id].racketeering + 1);
          }
        });
        
        const extortDetails = isEnemy 
          ? `Stole $${moneyGain.toLocaleString()} from ${tile.controllingFamily} business, +${respectGain} respect`
          : `+$${moneyGain.toLocaleString()}, +${respectGain} respect`;
        state.lastCombatResult = {
          q: targetQ, r: targetR, s: targetS,
          success: true, type: 'extort',
          title: isEnemy ? 'EXTORTION RAID!' : 'EXTORTION SUCCESSFUL!',
          details: extortDetails,
          timestamp: Date.now(),
        };
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'success', title: isEnemy ? '💰 Enemy Business Extorted!' : 'Extortion Successful!',
          message: isEnemy ? `Stole income from ${tile.controllingFamily} territory! ${extortDetails}.` : `Territory claimed! ${extortDetails}.`,
        }];
      } else {
        // Failed extortion: no casualties, but reputation and heat consequences
        const respectPenalty = 3;
        const fearPenalty = 2;
        const extraHeat = 5;
        state.reputation.respect = Math.max(0, state.reputation.respect - respectPenalty);
        state.reputation.fear = Math.max(0, state.reputation.fear - fearPenalty);
        const failDetails = `Respect -${respectPenalty}, Fear -${fearPenalty}, Heat +${(isEnemy ? 12 : 8) + extraHeat} — the locals refused and word spread`;
        state.lastCombatResult = {
          q: targetQ, r: targetR, s: targetS,
          success: false, type: 'extort',
          title: 'EXTORTION FAILED!',
          details: failDetails,
          timestamp: Date.now(),
        };
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'error', title: 'Extortion Failed!',
          message: `The locals refused to pay and word spread. Your reputation takes a hit.`,
        }];
      }
      const extortionFailed = !state.lastCombatResult?.success;
      state.policeHeat.level = Math.min(100, state.policeHeat.level + (isEnemy ? 12 : 8) + (extortionFailed ? 5 : 0));
    }

    syncLegacyUnits(state);
    return state;
  };

  // ============ NEGOTIATION HANDLER ============
  const processNegotiation = (state: EnhancedMafiaGameState, action: any): EnhancedMafiaGameState => {
    const { negotiationType, targetQ, targetR, targetS, capoId, extraData } = action;
    const tile = state.hexMap.find(t => t.q === targetQ && t.r === targetR && t.s === targetS);
    if (!tile || tile.controllingFamily === state.playerFamily || tile.controllingFamily === 'neutral') return state;

    const capo = state.deployedUnits.find(u => u.id === capoId);
    if (!capo || capo.type !== 'capo' || capo.family !== state.playerFamily) return state;

    const enemyFamily = tile.controllingFamily;
    const config = NEGOTIATION_TYPES.find(n => n.type === negotiationType);
    if (!config) return state;

    const cost = config.baseCost + (negotiationType === 'bribe_territory' ? (state.deployedUnits.filter(u => u.family === enemyFamily && u.q === targetQ && u.r === targetR && u.s === targetS).length * 2000 + (tile.business?.income || 0)) : 0);
    if (state.resources.money < cost) return state;

    state.resources.money -= cost;

    // Reputation cost
    if (config.reputationCost > 0) {
      state.reputation.respect = Math.max(0, state.reputation.respect - config.reputationCost);
    }

    switch (negotiationType as NegotiationType) {
      case 'ceasefire': {
        const duration = 3 + Math.floor(Math.random() * 3); // 3-5 turns
        state.ceasefires = [...state.ceasefires, {
          id: `ceasefire-${Date.now()}`,
          family: enemyFamily,
          turnsRemaining: duration,
          turnFormed: state.turn,
          active: true,
        }];
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'success', title: '🤝 Ceasefire Agreed!',
          message: `${enemyFamily.charAt(0).toUpperCase() + enemyFamily.slice(1)} won't attack for ${duration} turns. -${config.reputationCost} respect.`,
        }];
        break;
      }
      case 'bribe_territory': {
        // Peacefully claim the hex
        const enemyUnits = state.deployedUnits.filter(u => u.family === enemyFamily && u.q === targetQ && u.r === targetR && u.s === targetS);
        enemyUnits.forEach(eu => {
          const idx = state.deployedUnits.indexOf(eu);
          if (idx !== -1) state.deployedUnits.splice(idx, 1);
        });
        tile.controllingFamily = state.playerFamily;
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'success', title: '💵 Territory Acquired!',
          message: `Peacefully bribed for the hex. Cost: $${cost.toLocaleString()}.`,
        }];
        break;
      }
      case 'alliance': {
        const condition: AllianceCondition = extraData?.condition || { type: 'no_attack_family', target: enemyFamily, violated: false };
        const duration = 5 + Math.floor(Math.random() * 4); // 5-8 turns
        state.alliances = [...state.alliances, {
          id: `alliance-${Date.now()}`,
          alliedFamily: enemyFamily,
          conditions: [condition],
          turnsRemaining: duration,
          turnFormed: state.turn,
          active: true,
        }];
        // Also boost relationship
        if (state.reputation.familyRelationships[enemyFamily] !== undefined) {
          state.reputation.familyRelationships[enemyFamily] += 20;
        }
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'success', title: '⚖️ Alliance Formed!',
          message: `Pact with ${enemyFamily.charAt(0).toUpperCase() + enemyFamily.slice(1)} for ${duration} turns. Condition: ${condition.type.replace(/_/g, ' ')}.`,
        }];
        break;
      }
    }

    syncLegacyUnits(state);
    return state;
  };

  // ============ PROCESS PACTS AT END OF TURN ============
  const processPacts = (state: EnhancedMafiaGameState) => {
    // Tick down ceasefires
    state.ceasefires = state.ceasefires.map(c => {
      if (!c.active) return c;
      const remaining = c.turnsRemaining - 1;
      if (remaining <= 0) {
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'warning', title: '⏰ Ceasefire Expired',
          message: `Ceasefire with ${c.family.charAt(0).toUpperCase() + c.family.slice(1)} has ended.`,
        }];
        return { ...c, turnsRemaining: 0, active: false };
      }
      return { ...c, turnsRemaining: remaining };
    }).filter(c => c.active);

    // Tick down alliances and check conditions
    state.alliances = state.alliances.map(a => {
      if (!a.active) return a;
      const remaining = a.turnsRemaining - 1;

      // Check conditions
      a.conditions.forEach(cond => {
        if (cond.violated) return;
        if (cond.type === 'no_attack_family') {
          // Check if player attacked ally this turn (we can't retroactively check, but if relationship dropped significantly)
          // Simple: if any ally territory was taken by player this turn, condition violated
        }
        if (cond.type === 'no_expand_district') {
          // Check if player expanded into the target district
          // For simplicity we don't enforce this retroactively here
        }
      });

      if (remaining <= 0) {
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'info', title: '📜 Alliance Ended',
          message: `Alliance with ${a.alliedFamily.charAt(0).toUpperCase() + a.alliedFamily.slice(1)} has expired naturally.`,
        }];
        return { ...a, turnsRemaining: 0, active: false };
      }
      return { ...a, turnsRemaining: remaining };
    }).filter(a => a.active);
  };


  const clearNotifications = useCallback(() => {
    setGameState(prev => ({ ...prev, pendingNotifications: [] }));
  }, []);

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
    advancePhase,
    selectHeadquarters,
    selectUnitFromHeadquarters,
    deployUnit,
    isWinner,
    clearNotifications,
    fortifyUnit,
    setMoveAction,
    startEscort,
  };
};
