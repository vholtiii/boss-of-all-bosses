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
  FamilyBonuses, CapoPersonality, AlliancePact, CeasefirePact, AllianceCondition, NegotiationType,
  NEGOTIATION_TYPES,
  ScoutedHex, Safehouse, MoveAction,
  FORTIFY_DEFENSE_BONUS, SCOUT_DURATION, SAFEHOUSE_DURATION, MAX_ESCORT_SOLDIERS,
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

  // Real-life inspired starting soldiers:
  // Gambino: 4 — historically the largest and most powerful NYC family
  // Genovese: 4 — rivaled Gambino in size, deeply embedded in unions/politics
  // Lucchese: 3 — mid-sized but highly effective, strong in garment district
  // Bonanno: 2 — suffered internal wars (Banana War), weakened by defections
  // Colombo: 1 — smallest of the Five Families, plagued by leadership instability
  const familySoldierCount: Record<string, number> = {
    gambino: 4, genovese: 4, lucchese: 3, bonanno: 2, colombo: 1,
  };

  allFamilies.forEach(fam => {
    const hq = HQ_POSITIONS[fam];
    const soldierCount = familySoldierCount[fam] || 3;
    for (let i = 0; i < soldierCount; i++) {
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
    turnPhase: 'deploy' as TurnPhase, movementPhase: false,
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
      territory: { current: 0, target: 6, met: false },
      economic: { current: 0, target: 8000, met: false },
      legacy: { current: 0, highestRival: 0, met: false },
    },
    victoryType: null,
    familyBonuses: bonuses,
    lastTurnIncome: 0,
    pendingNotifications: [],
    scoutedHexes: [],
    safehouse: null,
    selectedMoveAction: 'move' as MoveAction,
    
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

    const prevVictory = state.victoryType;
    if (state.victoryProgress.territory.met) state.victoryType = 'territory';
    else if (state.victoryProgress.economic.met) state.victoryType = 'economic';
    else if (state.victoryProgress.legacy.met) state.victoryType = 'legacy';
    else state.victoryType = null;

    // Notify on first victory
    if (state.victoryType && !prevVictory) {
      const labels: Record<string, string> = {
        territory: 'Territory Domination — You control 6+ territories!',
        economic: 'Economic Empire — $8,000+ monthly income achieved!',
        legacy: 'Legacy of Power — Your reputation surpasses all rivals!',
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
      return {
        ...prev,
        turnPhase: nextPhase,
        movementPhase: nextPhase === 'move',
        selectedUnitId: null,
        availableMoveHexes: [],
        deployMode: null,
        availableDeployHexes: [],
        selectedMoveAction: 'move' as MoveAction,
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
      if (prev.turnPhase !== 'move') return prev;
      const unit = prev.deployedUnits.find(u => 
        u.family === prev.playerFamily && u.type === unitType &&
        u.q === location.q && u.r === location.r && u.s === location.s &&
        u.movesRemaining > 0
      );
      if (!unit) return prev;

      const moveAction = prev.selectedMoveAction || 'move';

      // Scout: show adjacent enemy hexes
      if (moveAction === 'scout' && unitType === 'soldier') {
        const neighbors = getHexNeighbors(unit.q, unit.r, unit.s);
        const scoutableHexes = neighbors.filter(h => {
          const tile = prev.hexMap.find(t => t.q === h.q && t.r === h.r && t.s === h.s);
          if (!tile) return false;
          return tile.controllingFamily !== 'neutral' && tile.controllingFamily !== prev.playerFamily;
        });
        return { ...prev, selectedUnitId: unit.id, availableMoveHexes: scoutableHexes, deployMode: null, availableDeployHexes: [] };
      }

      // Safehouse: highlight current hex
      if (moveAction === 'safehouse' && unitType === 'capo') {
        return { ...prev, selectedUnitId: unit.id, availableMoveHexes: [{ q: unit.q, r: unit.r, s: unit.s }], deployMode: null, availableDeployHexes: [] };
      }

      const range = unitType === 'soldier' ? 1 : Math.min(5, unit.movesRemaining);
      const candidateHexes = unitType === 'soldier' 
        ? getHexNeighbors(unit.q, unit.r, unit.s)
        : getHexesInRange(unit.q, unit.r, unit.s, range);
      
      const validHexes = candidateHexes.filter(h => {
        const tile = prev.hexMap.find(t => t.q === h.q && t.r === h.r && t.s === h.s);
        if (!tile) return false;
        if (tile.isHeadquarters && tile.isHeadquarters !== prev.playerFamily) return false;
        if (unitType === 'soldier') {
          if (tile.controllingFamily !== 'neutral' && tile.controllingFamily !== prev.playerFamily) return false;
        }
        return true;
      });

      return { ...prev, selectedUnitId: unit.id, availableMoveHexes: validHexes, deployMode: null, availableDeployHexes: [] };
    });
  }, []);

  // ============ MOVE UNIT (with zone-of-control + escort) ============
  const moveUnit = useCallback((targetLocation: { q: number; r: number; s: number }) => {
    setGameState(prev => {
      if (prev.turnPhase !== 'move') return prev;
      if (!prev.selectedUnitId) return prev;
      const unitIdx = prev.deployedUnits.findIndex(u => u.id === prev.selectedUnitId);
      if (unitIdx === -1) return prev;
      const unit = prev.deployedUnits[unitIdx];
      const moveAction = prev.selectedMoveAction || 'move';

      // Handle scout action
      if (moveAction === 'scout' && unit.type === 'soldier') {
        return processScout(prev, unit, targetLocation);
      }

      // Handle safehouse action
      if (moveAction === 'safehouse' && unit.type === 'capo') {
        return processSafehouse(prev, unit);
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

      // Handle escort: move escorted soldiers along with capo
      if (moveAction === 'escort' && unit.type === 'capo' && unit.escortingSoldierIds?.length) {
        unit.escortingSoldierIds.forEach(soldierIdToEscort => {
          const sIdx = newUnits.findIndex(u => u.id === soldierIdToEscort);
          if (sIdx !== -1) {
            newUnits[sIdx] = { ...newUnits[sIdx], q: targetLocation.q, r: targetLocation.r, s: targetLocation.s, movesRemaining: 0, fortified: false };
          }
        });
      }

      // Auto-claim neutral tiles on move
      const newHexMap = prev.hexMap.map(tile => {
        if (tile.q === targetLocation.q && tile.r === targetLocation.r && tile.s === targetLocation.s) {
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
        newAvailableMoves = candidates.filter(h => {
          const tile = newHexMap.find(t => t.q === h.q && t.r === h.r && t.s === h.s);
          if (!tile) return false;
          if (tile.isHeadquarters && tile.isHeadquarters !== prev.playerFamily) return false;
          if (updatedUnit.type === 'soldier') {
            if (tile.controllingFamily !== 'neutral' && tile.controllingFamily !== prev.playerFamily) return false;
          }
          return true;
        });
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

  // ============ FORTIFY UNIT ============
  const fortifyUnit = useCallback(() => {
    setGameState(prev => {
      if (prev.turnPhase !== 'move') return prev;
      if (!prev.selectedUnitId) return prev;
      const unitIdx = prev.deployedUnits.findIndex(u => u.id === prev.selectedUnitId);
      if (unitIdx === -1) return prev;
      const unit = prev.deployedUnits[unitIdx];
      if (unit.family !== prev.playerFamily || unit.movesRemaining <= 0) return prev;

      const newUnits = [...prev.deployedUnits];
      newUnits[unitIdx] = { ...unit, fortified: true, movesRemaining: 0 };

      return {
        ...prev, deployedUnits: newUnits,
        selectedUnitId: null, availableMoveHexes: [],
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
    const uIdx = newUnits.findIndex(u => u.id === unit.id);
    newUnits[uIdx] = { ...unit, movesRemaining: unit.movesRemaining - 1 };

    return {
      ...prev, deployedUnits: newUnits, scoutedHexes: newScoutedHexes,
      selectedUnitId: null, availableMoveHexes: [],
      selectedMoveAction: 'move' as MoveAction,
      pendingNotifications: [...prev.pendingNotifications, {
        type: 'info' as const, title: '👁️ Hex Scouted',
        message: `${tile.controllingFamily.toUpperCase()} territory: ${enemyUnitsOnHex.length} units${tile.business ? `, ${tile.business.type} ($${tile.business.income}/turn)` : ''}.`,
      }],
    };
  };

  // ============ SETUP SAFEHOUSE ============
  const processSafehouse = (prev: EnhancedMafiaGameState, unit: DeployedUnit): EnhancedMafiaGameState => {
    const tile = prev.hexMap.find(t => t.q === unit.q && t.r === unit.r && t.s === unit.s);
    if (!tile || tile.controllingFamily !== prev.playerFamily) return prev;

    const newUnits = [...prev.deployedUnits];
    const uIdx = newUnits.findIndex(u => u.id === unit.id);
    newUnits[uIdx] = { ...unit, movesRemaining: 0 };

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

  // ============ START ESCORT ============
  const startEscort = useCallback((capoId: string, soldierIds: string[]) => {
    setGameState(prev => {
      if (prev.turnPhase !== 'move') return prev;
      const capoIdx = prev.deployedUnits.findIndex(u => u.id === capoId && u.type === 'capo' && u.family === prev.playerFamily);
      if (capoIdx === -1) return prev;
      const capo = prev.deployedUnits[capoIdx];

      const validSoldierIds = soldierIds.filter(sid => {
        const s = prev.deployedUnits.find(u => u.id === sid);
        return s && s.type === 'soldier' && s.family === prev.playerFamily && s.q === capo.q && s.r === capo.r && s.s === capo.s;
      }).slice(0, MAX_ESCORT_SOLDIERS);

      if (validSoldierIds.length === 0) return prev;

      const newUnits = [...prev.deployedUnits];
      const newMoves = Math.max(0, capo.movesRemaining - validSoldierIds.length);
      newUnits[capoIdx] = { ...capo, escortingSoldierIds: validSoldierIds, movesRemaining: newMoves };

      return {
        ...prev, deployedUnits: newUnits,
        selectedMoveAction: 'escort' as MoveAction,
        pendingNotifications: [...prev.pendingNotifications, {
          type: 'info' as const, title: '🚗 Escort Active',
          message: `${capo.name || 'Capo'} is escorting ${validSoldierIds.length} soldier(s).`,
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
            loyalty: 50, training: 3, equipment: 2,
            hits: 0, extortions: 0, intimidations: 0, survivedConflicts: 0,
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
      
      // Reset to deploy phase for next turn
      newState.turnPhase = 'deploy';
      newState.movementPhase = false;
      newState.selectedUnitId = null;
      newState.availableMoveHexes = [];
      newState.deployMode = null;
      newState.availableDeployHexes = [];
      newState.selectedMoveAction = 'move' as MoveAction;

      // Clear fortified status and escort, reset moves
      newState.deployedUnits = (newState.deployedUnits || []).map(u => ({
        ...u, movesRemaining: u.maxMoves, fortified: false, escortingSoldierIds: undefined,
      }));

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
      processAITurn(newState);
      processWeather(newState);
      processEvents(newState);
      processBribes(newState);
      processPacts(newState);
      
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
        case 'sabotage_hex':
          return processSabotageHex(newState, action);
        case 'establish_safehouse':
          return processEstablishSafehouse(newState, action);
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
              const personalities: CapoPersonality[] = ['diplomat', 'enforcer', 'schemer'];
              const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];
              newState.deployedUnits = [...newState.deployedUnits, {
                id: newId, type: 'capo' as const, family: newState.playerFamily,
                q: hq.q, r: hq.r, s: hq.s,
                movesRemaining: 0, maxMoves: 3, level: 1,
                name: `Capo ${Math.floor(Math.random() * 100)}`,
                personality: randomPersonality,
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
          return processNegotiation(newState, action);
        }
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

  // ============ ESTABLISH SAFEHOUSE (action phase) ============
  const processEstablishSafehouse = (state: EnhancedMafiaGameState, action: any): EnhancedMafiaGameState => {
    const { targetQ, targetR, targetS } = action;
    const tile = state.hexMap.find(t => t.q === targetQ && t.r === targetR && t.s === targetS);
    if (!tile || tile.controllingFamily !== state.playerFamily || tile.isHeadquarters) return state;

    // Only one safehouse at a time
    state.safehouse = {
      q: targetQ, r: targetR, s: targetS,
      turnsRemaining: SAFEHOUSE_DURATION,
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

      const playerUnits = state.deployedUnits.filter(u => 
        u.family === state.playerFamily && u.q === targetQ && u.r === targetR && u.s === targetS
      );
      const enemyUnits = state.deployedUnits.filter(u => 
        u.family === tile.controllingFamily && u.q === targetQ && u.r === targetR && u.s === targetS
      );

      // Base chance: 80% if outnumbering, 20% if not
      let chance = playerUnits.length > enemyUnits.length ? 0.8 : 0.2;
      
      // Apply fortified defense bonus for defenders
      const fortifiedDefenders = enemyUnits.filter(u => u.fortified);
      if (fortifiedDefenders.length > 0) {
        chance -= FORTIFY_DEFENSE_BONUS / 100;
      }
      // Apply fortified bonus for player attackers (shouldn't normally be fortified when attacking, but check)
      const fortifiedAttackers = playerUnits.filter(u => u.fortified);
      if (fortifiedAttackers.length > 0) {
        chance += FORTIFY_DEFENSE_BONUS / 200; // Half bonus for fortified attackers
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
        
        playerUnits.forEach(u => {
          if (state.soldierStats[u.id]) {
            state.soldierStats[u.id].hits += 1;
            state.soldierStats[u.id].survivedConflicts += 1;
          }
        });
        
        const casualties = Math.max(0, Math.floor(playerUnits.length * 0.2));
        for (let i = 0; i < casualties; i++) {
          const idx = state.deployedUnits.indexOf(playerUnits[i]);
          if (idx !== -1) state.deployedUnits.splice(idx, 1);
        }
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'success', title: 'Territory Captured!',
          message: `Hit successful! +$5,000, +10 respect.${casualties > 0 ? ` ${casualties} casualt${casualties > 1 ? 'ies' : 'y'}.` : ''}`,
        }];
      } else {
        const casualties = Math.max(1, Math.floor(playerUnits.length * 0.4));
        for (let i = 0; i < casualties; i++) {
          const idx = state.deployedUnits.indexOf(playerUnits[i]);
          if (idx !== -1) state.deployedUnits.splice(idx, 1);
        }
        playerUnits.slice(casualties).forEach(u => {
          if (state.soldierStats[u.id]) {
            state.soldierStats[u.id].survivedConflicts += 1;
          }
        });
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'error', title: 'Hit Failed!',
          message: `The attack was repelled. ${casualties} casualt${casualties > 1 ? 'ies' : 'y'} suffered.`,
        }];
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
        
        const casualties = Math.floor(playerUnits.length * 0.1);
        for (let i = 0; i < casualties; i++) {
          const idx = state.deployedUnits.indexOf(playerUnits[i]);
          if (idx !== -1) state.deployedUnits.splice(idx, 1);
        }
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'success', title: 'Extortion Successful!',
          message: `Territory claimed! +$3,000, +5 respect.`,
        }];
      } else {
        const casualties = Math.max(1, Math.floor(playerUnits.length * 0.2));
        for (let i = 0; i < casualties; i++) {
          const idx = state.deployedUnits.indexOf(playerUnits[i]);
          if (idx !== -1) state.deployedUnits.splice(idx, 1);
        }
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'error', title: 'Extortion Failed!',
          message: `Resistance was stronger than expected. ${casualties} casualt${casualties > 1 ? 'ies' : 'y'}.`,
        }];
      }
      state.policeHeat.level = Math.min(100, state.policeHeat.level + 8);
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
