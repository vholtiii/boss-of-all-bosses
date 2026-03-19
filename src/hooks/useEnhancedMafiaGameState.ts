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

// ============ UNIT TYPES ============
export interface DeployedUnit {
  id: string;
  type: 'soldier' | 'capo';
  family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  q: number;
  r: number;
  s: number;
  movesRemaining: number;  // resets each turn
  maxMoves: number;        // soldiers=2, capos=3
  level: number;           // capo level 1-5, soldier always 1
  name?: string;           // capo name
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
  };
  isHeadquarters?: string; // family name if this is an HQ
}

export interface EnhancedMafiaGameState {
  // Core game state
  playerFamily: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  turn: number;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  
  // Resources
  resources: {
    money: number;
    respect: number;
    soldiers: number;      // pool at HQ (undeployed)
    influence: number;
    politicalPower: number;
    loyalty: number;
    researchPoints: number;
  };
  
  // ============ NEW: Hex map & units ============
  hexMap: HexTile[];
  deployedUnits: DeployedUnit[];
  
  // Movement UI state
  movementPhase: boolean;
  selectedUnitId: string | null;
  availableMoveHexes: Array<{ q: number; r: number; s: number }>;
  deployMode: { unitType: 'soldier' | 'capo'; family: string } | null;
  availableDeployHexes: Array<{ q: number; r: number; s: number }>;
  
  // Headquarters positions
  headquarters: {
    [family: string]: {
      q: number;
      r: number;
      s: number;
      district: string;
    };
  };
  
  // Keep units for backward compat with HQ info panel
  units: {
    [family: string]: {
      soldiers: Array<{ q: number; r: number; s: number; id: string }>;
      capos: Array<{ q: number; r: number; s: number; id: string }>;
      boss: { q: number; r: number; s: number; id: string };
    };
  };
  
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
  
  // UI state
  selectedTerritory?: any;
  activeEvent?: GameEvent;
  
  // Family control
  familyControl: {
    gambino: number;
    genovese: number;
    lucchese: number;
    bonanno: number;
    colombo: number;
  };
  
  // Territory system (kept for economy processing compat)
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
  const districtMap: Record<string, HexTile['district']> = {};
  
  // Assign districts by quadrant
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
  const businessTypes = ['restaurant', 'nightclub', 'casino', 'docks', 'construction', 'speakeasy', 'laundromat'];

  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      const s = -q - r;
      if (Math.abs(s) > radius) continue;

      const district = getDistrict(q, r);
      const terrain = terrainTypes[Math.abs((q * 7 + r * 13) % terrainTypes.length)];
      
      // ~30% of hexes have a business
      const hasBusiness = ((q * 31 + r * 47) % 10) < 3;
      
      const tile: HexTile = {
        q, r, s, district, terrain,
        controllingFamily: 'neutral',
      };

      if (hasBusiness) {
        const bType = businessTypes[Math.abs((q * 17 + r * 23) % businessTypes.length)];
        tile.business = {
          type: bType,
          income: 2000 + Math.abs((q * 13 + r * 29) % 6000),
          isLegal: ((q + r) % 3) !== 0,
          heatLevel: 0,
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

  // Mark HQ hexes and assign starting territory (HQ + adjacent)
  const allFamilies = ['gambino', 'genovese', 'lucchese', 'bonanno', 'colombo'] as const;
  
  allFamilies.forEach(fam => {
    const hq = HQ_POSITIONS[fam];
    // Set HQ tile
    const hqTile = hexMap.find(t => t.q === hq.q && t.r === hq.r && t.s === hq.s);
    if (hqTile) {
      hqTile.isHeadquarters = fam;
      hqTile.controllingFamily = fam;
      hqTile.business = undefined; // HQ is not a business
    }
    // Set adjacent tiles as controlled territory
    const neighbors = getHexNeighbors(hq.q, hq.r, hq.s);
    neighbors.forEach(n => {
      const tile = hexMap.find(t => t.q === n.q && t.r === n.r && t.s === n.s);
      if (tile && tile.controllingFamily === 'neutral') {
        tile.controllingFamily = fam;
      }
    });
  });

  // Create initial deployed units (all start at HQ)
  const deployedUnits: DeployedUnit[] = [];
  allFamilies.forEach(fam => {
    const hq = HQ_POSITIONS[fam];
    // 3 soldiers at HQ
    for (let i = 0; i < 3; i++) {
      deployedUnits.push({
        id: `${fam}-soldier-${i}`,
        type: 'soldier',
        family: fam,
        q: hq.q, r: hq.r, s: hq.s,
        movesRemaining: 2,
        maxMoves: 2,
        level: 1,
      });
    }
    // 1 capo at HQ
    const capoNames: Record<string, string> = {
      gambino: 'Vito Scaletta', genovese: 'Sal Marcano', lucchese: 'Tommy Angelo',
      bonanno: 'Joe Barbaro', colombo: 'Frank Colletti'
    };
    deployedUnits.push({
      id: `${fam}-capo-0`,
      type: 'capo',
      family: fam,
      q: hq.q, r: hq.r, s: hq.s,
      movesRemaining: 3,
      maxMoves: 3,
      level: 1,
      name: capoNames[fam],
    });
  });

  // Build legacy units for HQ info panel
  const units: EnhancedMafiaGameState['units'] = {};
  allFamilies.forEach(fam => {
    const hq = HQ_POSITIONS[fam];
    units[fam] = {
      soldiers: deployedUnits.filter(u => u.family === fam && u.type === 'soldier').map(u => ({q:u.q,r:u.r,s:u.s,id:u.id})),
      capos: deployedUnits.filter(u => u.family === fam && u.type === 'capo').map(u => ({q:u.q,r:u.r,s:u.s,id:u.id})),
      boss: { q: hq.q, r: hq.r, s: hq.s, id: `${fam}-boss` },
    };
  });

  // Build legacy territories from hexMap for economy compat
  const territories = buildLegacyTerritories(hexMap);

  return {
    playerFamily: family,
    turn: 1,
    season: 'spring',
    
    resources: {
      money: startingResources?.money ?? 50000,
      respect: startingResources?.respect ?? 25,
      soldiers: startingResources?.soldiers ?? 2, // undeployed pool
      influence: startingResources?.influence ?? 10,
      politicalPower: startingResources?.politicalPower ?? 30,
      loyalty: 75,
      researchPoints: 0,
    },

    hexMap,
    deployedUnits,
    movementPhase: false,
    selectedUnitId: null,
    availableMoveHexes: [],
    deployMode: null,
    availableDeployHexes: [],

    headquarters: Object.fromEntries(allFamilies.map(f => [f, HQ_POSITIONS[f]])),
    units,
    
    combat: {
      territoryBattles: [],
      soldierTraining: {
        level: 1,
        equipment: { weapons: 'basic', armor: 'none', vehicles: 'none', cost: 0, effectiveness: 0 },
        specialization: 'enforcer',
        experience: 0,
      },
      combatModifiers: [],
    },
    
    economy: {
      marketConditions: [
        { type: 'stable', sector: 'legal', modifier: 0, duration: 5, description: 'Legal businesses operating normally' },
      ],
      supplyChains: [],
      investments: [],
      economicEvents: [],
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
          family: f,
          personality: p.personality,
          resources: { money: 35000 + Math.floor(Math.random() * 15000), soldiers: 2, influence: 8 + Math.floor(Math.random() * 8) },
          strategy: {
            primaryGoal: p.primaryGoal,
            riskTolerance: p.riskTolerance,
            aggressionLevel: p.aggressionLevel,
            cooperationTendency: p.cooperationTendency,
            focusAreas: p.focusAreas,
          },
          relationships,
          lastAction: null,
          nextAction: null,
        };
      }),
    
    events: [],
    weather: {
      currentWeather: { type: 'clear', intensity: 0, duration: 3, description: 'Clear skies, perfect for business' },
      forecast: [],
      effects: [],
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
      reputation: 20,
      loyalty: 75,
      fear: 15,
      streetInfluence: startingResources?.influence ?? 10,
      familyRelationships: Object.fromEntries(
        allFamilies.filter(f => f !== family).map(f => [f, Math.floor(Math.random() * 30) - 15])
      ),
      publicPerception: { criminal: 60, businessman: 30, philanthropist: 10 },
      reputationHistory: [],
      achievements: [],
    },
    
    violentActions: [],
    businesses: [],
    finances: { totalIncome: 0, totalExpenses: 0, legalProfit: 0, illegalProfit: 0, totalProfit: 0, dirtyMoney: 0, cleanMoney: 0, legalCosts: 0 },
    legalStatus: { charges: [], lawyer: null, jailTime: 0, prosecutionRisk: 10, totalLegalCosts: 0 },
    policeHeat: { level: 15, reductionPerTurn: 2, bribedOfficials: [], arrests: [], rattingRisk: 5 },
    
    selectedTerritory: null,
    activeEvent: null,
    familyControl: { gambino: 20, genovese: 20, lucchese: 20, bonanno: 20, colombo: 20 },
    territories: territories,
  };
};

// Build legacy territory data from hexMap
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
    allFamilies.forEach(fam => {
      const hq = state.headquarters[fam];
      newUnits[fam] = {
        soldiers: state.deployedUnits.filter(u => u.family === fam && u.type === 'soldier').map(u => ({q:u.q,r:u.r,s:u.s,id:u.id})),
        capos: state.deployedUnits.filter(u => u.family === fam && u.type === 'capo').map(u => ({q:u.q,r:u.r,s:u.s,id:u.id})),
        boss: { q: hq?.q ?? 0, r: hq?.r ?? 0, s: hq?.s ?? 0, id: `${fam}-boss` },
      };
    });
    state.units = newUnits;

    // Update family control based on hex ownership
    allFamilies.forEach(fam => {
      const controlled = state.hexMap.filter(t => t.controllingFamily === fam).length;
      const total = state.hexMap.length;
      state.familyControl[fam] = Math.round((controlled / total) * 100);
    });
  };

  // ============ MOVEMENT PHASE ============
  const startMovementPhase = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      movementPhase: true,
      selectedUnitId: null,
      availableMoveHexes: [],
      deployMode: null,
      availableDeployHexes: [],
    }));
  }, []);

  const endMovementPhase = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      movementPhase: false,
      selectedUnitId: null,
      availableMoveHexes: [],
      deployMode: null,
      availableDeployHexes: [],
    }));
  }, []);

  // ============ SELECT UNIT FOR MOVEMENT ============
  const selectUnit = useCallback((unitType: 'soldier' | 'capo', location: { q: number; r: number; s: number }) => {
    setGameState(prev => {
      // Find a unit of this type at this location belonging to player
      const unit = prev.deployedUnits.find(u => 
        u.family === prev.playerFamily &&
        u.type === unitType &&
        u.q === location.q && u.r === location.r && u.s === location.s &&
        u.movesRemaining > 0
      );
      if (!unit) return prev;

      // Calculate available moves
      const range = unitType === 'soldier' ? 1 : Math.min(5, unit.movesRemaining);
      const candidateHexes = unitType === 'soldier' 
        ? getHexNeighbors(unit.q, unit.r, unit.s)
        : getHexesInRange(unit.q, unit.r, unit.s, range);
      
      // Filter to hexes that exist on the map
      const validHexes = candidateHexes.filter(h => 
        prev.hexMap.some(t => t.q === h.q && t.r === h.r && t.s === h.s)
      );

      return {
        ...prev,
        selectedUnitId: unit.id,
        availableMoveHexes: validHexes,
        deployMode: null,
        availableDeployHexes: [],
      };
    });
  }, []);

  // ============ MOVE UNIT ============
  const moveUnit = useCallback((targetLocation: { q: number; r: number; s: number }) => {
    setGameState(prev => {
      if (!prev.selectedUnitId) return prev;
      const unitIdx = prev.deployedUnits.findIndex(u => u.id === prev.selectedUnitId);
      if (unitIdx === -1) return prev;
      const unit = prev.deployedUnits[unitIdx];

      // Validate the target is in available moves
      if (!prev.availableMoveHexes.some(h => h.q === targetLocation.q && h.r === targetLocation.r && h.s === targetLocation.s)) {
        return prev;
      }

      const dist = hexDistance(unit, targetLocation);
      
      // Soldiers: 1 hex per move action, capos: distance counts as 1 move
      const moveCost = 1;
      if (unit.movesRemaining < moveCost) return prev;

      const newUnits = [...prev.deployedUnits];
      const updatedUnit = { ...unit, q: targetLocation.q, r: targetLocation.r, s: targetLocation.s, movesRemaining: unit.movesRemaining - moveCost };
      newUnits[unitIdx] = updatedUnit;

      // If moving to enemy territory, claim it
      const newHexMap = prev.hexMap.map(tile => {
        if (tile.q === targetLocation.q && tile.r === targetLocation.r && tile.s === targetLocation.s) {
          if (tile.controllingFamily !== prev.playerFamily && !tile.isHeadquarters) {
            return { ...tile, controllingFamily: prev.playerFamily };
          }
        }
        return tile;
      });

      // Recalculate moves if unit still has moves left
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
        ...prev,
        deployedUnits: newUnits,
        hexMap: newHexMap,
        selectedUnitId: updatedUnit.movesRemaining > 0 ? updatedUnit.id : null,
        availableMoveHexes: newAvailableMoves,
      };
      syncLegacyUnits(newState);
      return newState;
    });
  }, []);

  // ============ DEPLOY FROM HQ ============
  const selectHeadquarters = useCallback((family: string) => {
    // Just open the HQ panel — handled in UltimateMafiaGame
  }, []);

  const selectUnitFromHeadquarters = useCallback((unitType: 'soldier' | 'capo', family: string) => {
    setGameState(prev => {
      if (family !== prev.playerFamily) return prev;
      const hq = prev.headquarters[family];
      if (!hq) return prev;

      // Check if there's an undeployed unit of this type at HQ
      // For soldiers: also check the pool
      if (unitType === 'soldier') {
        // Check pool first
        if (prev.resources.soldiers <= 0) {
          // Check if any soldiers are at HQ
          const atHQ = prev.deployedUnits.filter(u => 
            u.family === family && u.type === 'soldier' &&
            u.q === hq.q && u.r === hq.r && u.s === hq.s
          );
          if (atHQ.length === 0) return prev;
        }
      } else {
        // For capos, check if any are at HQ
        const caposAtHQ = prev.deployedUnits.filter(u => 
          u.family === family && u.type === 'capo' &&
          u.q === hq.q && u.r === hq.r && u.s === hq.s
        );
        if (caposAtHQ.length === 0) return prev;
      }

      // Calculate deploy targets: adjacent for soldiers, range 5 for capos
      const range = unitType === 'soldier' ? 1 : 5;
      const candidates = unitType === 'soldier'
        ? getHexNeighbors(hq.q, hq.r, hq.s)
        : getHexesInRange(hq.q, hq.r, hq.s, range);
      
      const validHexes = candidates.filter(h => 
        prev.hexMap.some(t => t.q === h.q && t.r === h.r && t.s === h.s)
      );

      return {
        ...prev,
        deployMode: { unitType, family },
        availableDeployHexes: validHexes,
        selectedUnitId: null,
        availableMoveHexes: [],
      };
    });
  }, []);

  const deployUnit = useCallback((unitType: 'soldier' | 'capo', targetLocation: { q: number; r: number; s: number }, family: string) => {
    setGameState(prev => {
      if (family !== prev.playerFamily) return prev;
      if (!prev.deployMode) return prev;
      
      // Validate target
      if (!prev.availableDeployHexes.some(h => h.q === targetLocation.q && h.r === targetLocation.r && h.s === targetLocation.s)) {
        return prev;
      }

      const hq = prev.headquarters[family];
      if (!hq) return prev;

      let newDeployedUnits = [...prev.deployedUnits];
      let newResources = { ...prev.resources };

      if (unitType === 'soldier') {
        // Try to deploy from pool first
        if (prev.resources.soldiers > 0) {
          const newId = `${family}-soldier-${Date.now()}-${Math.random().toString(36).substr(2,4)}`;
          newDeployedUnits.push({
            id: newId,
            type: 'soldier',
            family: family as any,
            q: targetLocation.q, r: targetLocation.r, s: targetLocation.s,
            movesRemaining: 0, // deployed this turn, can't move
            maxMoves: 2,
            level: 1,
          });
          newResources.soldiers -= 1;
        } else {
          // Move a soldier from HQ
          const soldierAtHQ = newDeployedUnits.findIndex(u => 
            u.family === family && u.type === 'soldier' &&
            u.q === hq.q && u.r === hq.r && u.s === hq.s
          );
          if (soldierAtHQ === -1) return prev;
          newDeployedUnits[soldierAtHQ] = {
            ...newDeployedUnits[soldierAtHQ],
            q: targetLocation.q, r: targetLocation.r, s: targetLocation.s,
            movesRemaining: 0,
          };
        }
      } else {
        // Move capo from HQ
        const capoAtHQ = newDeployedUnits.findIndex(u => 
          u.family === family && u.type === 'capo' &&
          u.q === hq.q && u.r === hq.r && u.s === hq.s
        );
        if (capoAtHQ === -1) return prev;
        newDeployedUnits[capoAtHQ] = {
          ...newDeployedUnits[capoAtHQ],
          q: targetLocation.q, r: targetLocation.r, s: targetLocation.s,
          movesRemaining: 0,
        };
      }

      // Claim the hex if neutral
      const newHexMap = prev.hexMap.map(tile => {
        if (tile.q === targetLocation.q && tile.r === targetLocation.r && tile.s === targetLocation.s) {
          if (tile.controllingFamily === 'neutral' || tile.controllingFamily === family) {
            return { ...tile, controllingFamily: family as any };
          }
        }
        return tile;
      });

      const newState = {
        ...prev,
        deployedUnits: newDeployedUnits,
        hexMap: newHexMap,
        resources: newResources,
        deployMode: null,
        availableDeployHexes: [],
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
      
      // End movement phase
      newState.movementPhase = false;
      newState.selectedUnitId = null;
      newState.availableMoveHexes = [];
      newState.deployMode = null;
      newState.availableDeployHexes = [];

      // Reset all player unit moves
      newState.deployedUnits = (newState.deployedUnits || []).map(u => ({
        ...u,
        movesRemaining: u.maxMoves,
      }));
      
      // Update season
      const seasons = ['spring', 'summer', 'fall', 'winter'] as const;
      newState.season = seasons[Math.floor((newState.turn - 1) / 3) % 4];
      
      // Process economy — income from controlled hexes
      processEconomy(newState);
      
      // Process AI
      processAITurn(newState);
      
      // Process weather
      processWeather(newState);
      
      // Process events
      processEvents(newState);
      
      // Update reputation
      newState.reputation.reputation = Math.max(0, newState.reputation.reputation - 0.5);
      newState.reputation.fear = Math.max(0, newState.reputation.fear - 1);
      newState.reputation.loyalty = Math.min(100, newState.reputation.loyalty + 1);
      
      // Reduce police heat
      newState.policeHeat.level = Math.max(0, newState.policeHeat.level - newState.policeHeat.reductionPerTurn);
      
      // Sync
      syncLegacyUnits(newState);
      newState.territories = buildLegacyTerritories(newState.hexMap);
      
      return newState;
    });
  }, []);

  // ============ ECONOMY ============
  const processEconomy = (state: EnhancedMafiaGameState) => {
    let income = 0;
    state.hexMap.forEach(tile => {
      if (tile.controllingFamily === state.playerFamily && tile.business) {
        // Check if a capo is on this hex
        const hasCapo = state.deployedUnits.some(u => 
          u.family === state.playerFamily && u.type === 'capo' &&
          u.q === tile.q && u.r === tile.r && u.s === tile.s
        );
        const hasSoldier = state.deployedUnits.some(u => 
          u.family === state.playerFamily && u.type === 'soldier' &&
          u.q === tile.q && u.r === tile.r && u.s === tile.s
        );
        
        if (hasCapo) {
          income += tile.business.income; // 100%
        } else if (hasSoldier) {
          income += Math.floor(tile.business.income * 0.3); // 30%
        } else {
          income += Math.floor(tile.business.income * 0.1); // 10% passive from territory
        }
      }
    });
    
    // Soldier maintenance
    const totalSoldiers = state.deployedUnits.filter(u => u.family === state.playerFamily && u.type === 'soldier').length + state.resources.soldiers;
    const maintenance = totalSoldiers * 500;
    
    state.resources.money += income - maintenance;
    state.finances.totalIncome = income;
    state.finances.totalExpenses = maintenance;
    state.finances.totalProfit = income - maintenance;
  };

  // ============ AI TURN ============
  const processAITurn = (state: EnhancedMafiaGameState) => {
    state.aiOpponents.forEach(opponent => {
      const fam = opponent.family as any;
      const hq = state.headquarters[fam];
      if (!hq) return;

      // AI income
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

      // AI recruit if wealthy
      if (opponent.resources.money > 30000 && opponent.resources.soldiers < 5) {
        const recruit = Math.min(2, Math.floor((opponent.resources.money - 20000) / 8000));
        opponent.resources.soldiers += recruit;
        opponent.resources.money -= recruit * 8000;
      }

      // AI deploy soldiers from pool
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
          opponent.resources.soldiers -= 1;

          // Claim hex
          const tile = state.hexMap.find(t => t.q === target.q && t.r === target.r && t.s === target.s);
          if (tile && tile.controllingFamily === 'neutral' && !tile.isHeadquarters) {
            tile.controllingFamily = fam;
          }
        }
      }

      // AI move existing units outward
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
          // Prefer neutral or enemy territory
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
            // Combat: if player units are here, resolve
            const playerUnitsHere = state.deployedUnits.filter(u => 
              u.family === state.playerFamily && u.q === target.q && u.r === target.r && u.s === target.s
            );
            if (playerUnitsHere.length > 0) {
              // Simple combat: compare counts
              const aiStrength = state.deployedUnits.filter(u => u.family === fam && u.q === target.q && u.r === target.r && u.s === target.s).length;
              if (aiStrength > playerUnitsHere.length && Math.random() < 0.6) {
                // AI wins — remove player units
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
      switch (action.type) {
        case 'hit_territory':
          return processTerritoryHit(newState, action);
        case 'extort_territory':
          return processTerritoryExtortion(newState, action);
        case 'recruit_soldiers':
          if (newState.resources.money >= 8000) {
            newState.resources.money -= 8000;
            newState.resources.soldiers += 1;
          }
          return newState;
        case 'bribe_official':
          if (newState.resources.money >= 15000) {
            newState.resources.money -= 15000;
            newState.policeHeat.level = Math.max(0, newState.policeHeat.level - 20);
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

  // ============ COMBAT ============
  const processTerritoryHit = (state: EnhancedMafiaGameState, action: any): EnhancedMafiaGameState => {
    // Find target hex or district
    const targetQ = action.targetQ;
    const targetR = action.targetR;
    const targetS = action.targetS;
    
    if (targetQ !== undefined) {
      // Hex-level combat
      const tile = state.hexMap.find(t => t.q === targetQ && t.r === targetR && t.s === targetS);
      if (!tile || tile.controllingFamily === state.playerFamily || tile.isHeadquarters) return state;

      const playerUnits = state.deployedUnits.filter(u => 
        u.family === state.playerFamily && u.q === targetQ && u.r === targetR && u.s === targetS
      );
      const enemyUnits = state.deployedUnits.filter(u => 
        u.family === tile.controllingFamily && u.q === targetQ && u.r === targetR && u.s === targetS
      );

      const chance = playerUnits.length > enemyUnits.length ? 0.8 : 0.3;
      if (Math.random() < chance) {
        // Victory
        enemyUnits.forEach(eu => {
          const idx = state.deployedUnits.indexOf(eu);
          if (idx !== -1) state.deployedUnits.splice(idx, 1);
        });
        tile.controllingFamily = state.playerFamily;
        state.resources.money += 5000;
        state.resources.respect += 10;
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
      }
      state.policeHeat.level = Math.min(100, state.policeHeat.level + 15);
    }
    
    syncLegacyUnits(state);
    return state;
  };

  const processTerritoryExtortion = (state: EnhancedMafiaGameState, action: any): EnhancedMafiaGameState => {
    // Similar but for neutral territory
    return state;
  };

  // ============ WINNER CHECK ============
  const isWinner = gameState.familyControl ? gameState.familyControl[gameState.playerFamily] >= 60 : false;

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
