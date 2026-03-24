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
  SoldierStats, HitmanContract, BribeContract, BribeTier, VictoryProgress, VictoryType,
  FAMILY_BONUSES, BRIBE_TIERS, DOC_BUSINESS_TYPES,
  SOLDIER_COST, LOCAL_SOLDIER_COST, SOLDIER_MAINTENANCE, RECRUIT_TERRITORY_REQUIREMENT, CAPO_COST, MAX_HITMEN,
  HITMAN_CONTRACT_COST, HITMAN_BASE_SUCCESS, HITMAN_FORTIFIED_SUCCESS, HITMAN_SAFEHOUSE_SUCCESS, HITMAN_HQ_SUCCESS,
  HITMAN_OPEN_TURNS, HITMAN_FORTIFIED_TURNS, HITMAN_SAFEHOUSE_TURNS, HITMAN_HQ_TURNS,
  HITMAN_MAX_LIFETIME, HITMAN_REFUND_RATE, HITMAN_ALERT_DURATION,
  MAX_CAPOS, CAPO_PROMOTION_COST, CAPO_PROMOTION_REQUIREMENTS,
  SOLDIER_LOYALTY_CAP, CAPO_LOYALTY_CAP,
  FamilyBonuses, CapoPersonality, AlliancePact, CeasefirePact, AllianceCondition, NegotiationType,
  NEGOTIATION_TYPES,
  ScoutedHex, Safehouse, MoveAction, PlannedHit,
  FORTIFY_DEFENSE_BONUS, FORTIFY_CASUALTY_REDUCTION, SCOUT_DURATION, SCOUT_INTEL_BONUS, SCOUT_STALE_BONUS, SCOUT_DETECTION_CHANCE, SAFEHOUSE_DURATION, MAX_ESCORT_SOLDIERS,
  SAFEHOUSE_COST, SAFEHOUSE_DEFENSE_BONUS, SAFEHOUSE_CAPTURE_BOUNTY, SAFEHOUSE_CAPTURE_INTEL_DURATION, SAFEHOUSE_TERRITORY_THRESHOLD, MAX_SAFEHOUSES,
  PLAN_HIT_BONUS, PLAN_HIT_DURATION, PLAN_HIT_FAIL_REPUTATION, PLAN_HIT_FAIL_LOYALTY,
  PLAN_HIT_RELOCATED_BONUS, PLAN_HIT_RELOCATED_HEAT, PLAN_HIT_COOLDOWN,
  BASE_ACTIONS_PER_TURN, BONUS_ACTION_RESPECT_THRESHOLD, BONUS_ACTION_INFLUENCE_THRESHOLD,
  TACTICAL_ACTIONS_PER_TURN,
  HiddenUnit, AIBounty,
  BLIND_HIT_PENALTY, BLIND_HIT_RESPECT, BLIND_HIT_FEAR, HIDING_DURATION, BOUNTY_DURATION, BLIND_HIT_INFLUENCE_LOSS,
  INTERNAL_HIT_LOYALTY_THRESHOLD, INTERNAL_HIT_HEAT_REDUCTION, INTERNAL_HIT_MORALE_RISK, INTERNAL_HIT_MORALE_PENALTY,
  LOYALTY_ACTION_BONUS, LOYALTY_COMBAT_BONUS, LOYALTY_INCOME_HEX_BONUS, LOYALTY_INCOME_HEX_THRESHOLD, LOYALTY_UNPAID_PENALTY,
  CAPO_WOUND_LOYALTY_PENALTY, CAPO_WOUND_MOVE_PENALTY,
  AI_PLAN_HIT_CHANCE, AI_PLAN_HIT_SUCCESS_RATE, AI_PLAN_HIT_DURATION,
  AIPlannedHit,
} from '@/types/game-mechanics';

// ============ SEEDED PRNG (Mulberry32) ============
function mulberry32(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ============ DIFFICULTY SYSTEM ============
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface DifficultyModifiers {
  playerMoneyMult: number;
  aiIncomeMult: number;
  aiRecruitCapBonus: number;
  policeHeatMult: number;
  hitSuccessBonus: number;
  eventCostMult: number;
}

const DIFFICULTY_MODIFIERS: Record<Difficulty, DifficultyModifiers> = {
  easy: { playerMoneyMult: 1.5, aiIncomeMult: 0.6, aiRecruitCapBonus: 0, policeHeatMult: 0.7, hitSuccessBonus: 0.10, eventCostMult: 0.7 },
  normal: { playerMoneyMult: 1.0, aiIncomeMult: 1.0, aiRecruitCapBonus: 0, policeHeatMult: 1.0, hitSuccessBonus: 0, eventCostMult: 1.0 },
  hard: { playerMoneyMult: 0.75, aiIncomeMult: 1.5, aiRecruitCapBonus: 2, policeHeatMult: 1.3, hitSuccessBonus: -0.10, eventCostMult: 1.3 },
};

// ============ IMMUTABLE STATE CLONE HELPER ============
const cloneStateForMutation = (state: EnhancedMafiaGameState): EnhancedMafiaGameState => ({
  ...state,
  hexMap: state.hexMap.map(t => ({ ...t, business: t.business ? { ...t.business } : undefined })),
  deployedUnits: (state.deployedUnits || []).map(u => ({ ...u, escortingSoldierIds: u.escortingSoldierIds ? [...u.escortingSoldierIds] : undefined })),
  pendingNotifications: [...(state.pendingNotifications || [])],
  soldierStats: Object.fromEntries(
    Object.entries(state.soldierStats || {}).map(([k, v]) => [k, { ...v }])
  ),
  resources: { ...state.resources },
  policeHeat: {
    ...(state.policeHeat || { level: 0, reductionPerTurn: 2, bribedOfficials: [], arrests: [], rattingRisk: 5 }),
    arrests: [...(state.policeHeat?.arrests || [])],
    bribedOfficials: [...(state.policeHeat?.bribedOfficials || [])],
  },
  hiddenUnits: [...(state.hiddenUnits || [])],
  aiBounties: [...(state.aiBounties || [])],
  aiPlannedHits: (state.aiPlannedHits || []).map(h => ({ ...h })),
  combatLog: [...(state.combatLog || [])],
  activeDistrictBonuses: [...(state.activeDistrictBonuses || [])],
  scoutedHexes: [...(state.scoutedHexes || [])],
  safehouses: (state.safehouses || []).map(s => ({ ...s })),
  activeBribes: (state.activeBribes || []).map(b => ({ ...b })),
  plannedHit: state.plannedHit ? { ...state.plannedHit } : null,
  planHitCooldownUntil: state.planHitCooldownUntil || 0,
  alliances: (state.alliances || []).map(a => ({ ...a, conditions: a.conditions.map(c => ({ ...c })) })),
  ceasefires: (state.ceasefires || []).map(c => ({ ...c })),
  events: [...(state.events || [])],
  hitmanContracts: [...(state.hitmanContracts || [])],
  aiOpponents: (state.aiOpponents || []).map(o => ({
    ...o,
    resources: { ...o.resources },
    strategy: { ...o.strategy },
    relationships: { ...o.relationships },
  })),
  reputation: {
    ...state.reputation,
    familyRelationships: { ...state.reputation.familyRelationships },
    publicPerception: { ...state.reputation.publicPerception },
    reputationHistory: [...(state.reputation.reputationHistory || [])],
    achievements: [...(state.reputation.achievements || [])],
  },
  weather: { ...state.weather, currentWeather: { ...state.weather.currentWeather } },
  finances: { ...state.finances },
  legalStatus: { ...state.legalStatus },
  arrestedSoldiers: [...(state.arrestedSoldiers || [])],
  arrestedCapos: [...(state.arrestedCapos || [])],
  businesses: (state.businesses || []).map((b: any) => ({ ...b })),
});

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
  pendingDefection?: boolean; // set by Internal Betrayal event — resolved in endTurn
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
    turnsUntilComplete?: number;
    constructionProgress?: number;
    constructionGoal?: number;
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
  hitmanContracts: HitmanContract[];
  aiAlertState: Record<string, number>; // family → alert turns remaining
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
  safehouses: Safehouse[];
  plannedHit: PlannedHit | null;
  planHitCooldownUntil: number;
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
  lastLawyerTurn: number;
  lawyerActiveUntil: number;
  ricoTimer: number;
  arrestedSoldiers: Array<{ unitId: string; returnTurn: number }>;
  arrestedCapos: Array<{ unitId: string; returnTurn: number }>;
  gameOver?: { type: 'rico'; turn: number } | null;
  pendingBusinessBuild?: { businessType: string; cost: number; isLegal: boolean } | null;
  
  // Blind hit system
  hiddenUnits: HiddenUnit[];
  aiBounties: AIBounty[];
  aiPlannedHits: AIPlannedHit[];
  combatLog: string[];
  activeDistrictBonuses: Array<{
    district: string;
    family: string;
    bonusType: string;
    description: string;
  }>;

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
  
  mapSeed: number;
  difficulty: Difficulty;
  difficultyModifiers: DifficultyModifiers;
  ratIgnored?: boolean; // escalation flag for Rat → Federal Investigation event chain
  reinforceTargets?: Array<{ q: number; r: number; s: number; family: string; expiresOnTurn: number }>; // AI reinforcement from scout detection
  
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
const generateHexMap = (radius: number, seed?: number): HexTile[] => {
  const tiles: HexTile[] = [];
  const rng = mulberry32(seed ?? Math.floor(Math.random() * 4294967296));
  
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
      const terrain = terrainTypes[Math.floor(rng() * terrainTypes.length)];
      
      const districtConfig: Record<string, { density: number; incomeMult: number; weights: number[] }> = {
        'Manhattan':      { density: 0.35, incomeMult: 1.8, weights: [5, 40, 15, 40] },
        'Little Italy':   { density: 0.25, incomeMult: 1.0, weights: [5, 30, 10, 55] },
        'Brooklyn':       { density: 0.20, incomeMult: 0.9, weights: [20, 25, 30, 25] },
        'Bronx':          { density: 0.15, incomeMult: 0.7, weights: [35, 15, 35, 15] },
        'Queens':         { density: 0.15, incomeMult: 0.8, weights: [10, 25, 15, 50] },
        'Staten Island':  { density: 0.10, incomeMult: 0.75, weights: [5, 10, 20, 65] },
      };
      const cfg = districtConfig[district] || { density: 0.20, incomeMult: 1.0, weights: [25, 25, 25, 25] };
      const hasBusiness = rng() < cfg.density;
      
      const tile: HexTile = { q, r, s, district, terrain, controllingFamily: 'neutral' };

      if (hasBusiness) {
        const typeRoll = rng() * 100;
        const cumWeights = cfg.weights.reduce((acc: number[], w, i) => {
          acc.push((acc[i - 1] || 0) + w);
          return acc;
        }, []);
        const typeIdx = cumWeights.findIndex(cw => typeRoll < cw);
        const bConfig = DOC_BUSINESS_TYPES[typeIdx >= 0 ? typeIdx : 0];
        
        const incomeVariation = Math.floor(rng() * 2000);
        const baseIncome = Math.round((bConfig.baseIncome + incomeVariation) * cfg.incomeMult);
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
  startingResources?: { money: number; soldiers: number; influence: number; politicalPower: number; respect: number },
  difficulty: Difficulty = 'normal'
): EnhancedMafiaGameState => {
  const mapRadius = 10;
  const mapSeed = Math.floor(Math.random() * 4294967296);
  const diffMods = DIFFICULTY_MODIFIERS[difficulty];
  let hexMap = generateHexMap(mapRadius, mapSeed);

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
    mapSeed,
    difficulty,
    difficultyModifiers: diffMods,
    
    resources: {
      money: Math.floor((startingResources?.money ?? 50000) * diffMods.playerMoneyMult),
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
    hitmanContracts: [],
    aiAlertState: {},
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
    safehouses: [],
    plannedHit: null,
    planHitCooldownUntil: 0,
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
      supplyChains: [], economicEvents: [],
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
    lastLawyerTurn: 0,
    lawyerActiveUntil: 0,
    ricoTimer: 0,
    arrestedSoldiers: [],
    arrestedCapos: [],
    gameOver: null,
    
    hiddenUnits: [],
    aiBounties: [],
    aiPlannedHits: [],
    combatLog: [],
    activeDistrictBonuses: [],
    
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
  startingResources?: { money: number; soldiers: number; influence: number; politicalPower: number; respect: number },
  difficulty?: Difficulty
) => {
  const [gameState, setGameState] = useState<EnhancedMafiaGameState>(() => 
    createInitialGameState(initialFamily || 'gambino', startingResources, difficulty || 'normal')
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
        if (moveAction === 'scout' && (unitType === 'soldier' || unitType === 'capo')) {
          if (prev.tacticalActionsRemaining <= 0) return prev;
          const scoutRange = unitType === 'capo' ? 2 : 1;
          const neighbors = scoutRange === 1 ? getHexNeighbors(unit.q, unit.r, unit.s) : getHexesInRange(unit.q, unit.r, unit.s, scoutRange);
          const scoutableHexes = neighbors.filter(h => {
            const tile = prev.hexMap.find(t => t.q === h.q && t.r === h.r && t.s === h.s);
            if (!tile) return false;
            return tile.controllingFamily !== prev.playerFamily;
          });
          return { ...prev, selectedUnitId: unit.id, availableMoveHexes: scoutableHexes, deployMode: null, availableDeployHexes: [] };
        }

        if (moveAction === 'safehouse' && unitType === 'capo') {
          if (prev.tacticalActionsRemaining <= 0) return prev;
          // One-click safehouse: apply immediately on capo select
          const result = processSafehouse({ ...prev, selectedUnitId: unit.id }, unit);
          return { ...result, tacticalActionsRemaining: prev.tacticalActionsRemaining - 1 };
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
                  type: 'info' as const, title: '🚗 Escort Summoned',
                  message: `${unit.name || 'The Capo'} sent word — a soldier's been called to the meeting point.`,
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
      if (prev.turnPhase === 'move' && moveAction === 'scout' && (unit.type === 'soldier' || unit.type === 'capo')) {
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
            type: 'info' as const, title: '🚗 Escort Summoned',
            message: `${capo.name || 'The Capo'} sent word — a soldier's been called to the meeting point.`,
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
            const hasCompletedBusiness = tile.business && !(tile.business.constructionProgress !== undefined && tile.business.constructionProgress < (tile.business.constructionGoal || 3));
            if (hasCompletedBusiness) {
              // Capo auto-extorts any completed business on arrival (legal pays less)
              const respectPayoutMult = 0.5 + (prev.reputation.respect / 100);
              const basePayout = tile.business.isLegal ? 1500 : 3000;
              bonusMoney = Math.floor(basePayout * respectPayoutMult);
              bonusRespect = tile.business.isLegal ? 3 : 5;
              autoExtortNotification = {
                type: 'success' as const,
                title: '💰 Capo Auto-Extortion!',
                message: `${unit.name || 'Your Capo'} set up a protection racket on the ${tile.business.isLegal ? 'store front' : 'illegal business'}! +$${bonusMoney.toLocaleString()}, +${bonusRespect} respect.`,
              };
            } else {
              // Capo auto-claims empty/legal territory — no money bonus
              autoExtortNotification = {
                type: 'info' as const,
                title: '🏴 Territory Claimed',
                message: `${unit.name || 'Your Capo'} claimed this territory on arrival.`,
              };
            }
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
    const maxScoutRange = unit.type === 'capo' ? 2 : 1;
    if (dist < 1 || dist > maxScoutRange) return prev;

    const enemyUnitsOnHex = prev.deployedUnits.filter(u => 
      u.q === targetLocation.q && u.r === targetLocation.r && u.s === targetLocation.s &&
      u.family !== prev.playerFamily
    );

    const scoutInfo: ScoutedHex = {
      q: targetLocation.q, r: targetLocation.r, s: targetLocation.s,
      scoutedTurn: prev.turn,
      turnsRemaining: SCOUT_DURATION,
      freshUntilTurn: prev.turn + 1, // live data on scout turn, stale after
      enemySoldierCount: enemyUnitsOnHex.length,
      enemyFamily: tile.controllingFamily,
      businessType: tile.business?.type,
      businessIncome: tile.business?.income,
    };

    const newScoutedHexes = prev.scoutedHexes.filter(s => !(s.q === targetLocation.q && s.r === targetLocation.r && s.s === targetLocation.s));
    newScoutedHexes.push(scoutInfo);

    const newUnits = [...prev.deployedUnits];
    const notifications = [...prev.pendingNotifications, {
      type: 'info' as const, title: '👁️ Hex Scouted',
      message: tile.controllingFamily === 'neutral'
        ? `Neutral territory${tile.business ? `: ${tile.business.type} generating $${tile.business.income}/turn` : ': no businesses'}.`
        : `${tile.controllingFamily.toUpperCase()} territory: ${enemyUnitsOnHex.length} units${tile.business ? `, ${tile.business.type} ($${tile.business.income}/turn)` : ''}.`,
    }];

    // Detection chance on enemy-controlled hexes (no heat, but AI gets reinforcement flag)
    let reinforceTargets = [...(prev.reinforceTargets || [])];
    if (tile.controllingFamily !== 'neutral' && tile.controllingFamily !== prev.playerFamily) {
      if (Math.random() < SCOUT_DETECTION_CHANCE) {
        reinforceTargets.push({
          q: targetLocation.q, r: targetLocation.r, s: targetLocation.s,
          family: tile.controllingFamily,
          expiresOnTurn: prev.turn + 3,
        });
        notifications.push({
          type: 'warning' as const, title: '⚠️ Scout Detected!',
          message: `The ${tile.controllingFamily} family may reinforce this position.`,
        });
      }
    }

    return {
      ...prev, deployedUnits: newUnits, scoutedHexes: newScoutedHexes,
      reinforceTargets,
      selectedUnitId: null, availableMoveHexes: [],
      pendingNotifications: notifications,
    };
  };

  // ============ SETUP SAFEHOUSE ============
  const processSafehouse = (prev: EnhancedMafiaGameState, unit: DeployedUnit): EnhancedMafiaGameState => {
    const tile = prev.hexMap.find(t => t.q === unit.q && t.r === unit.r && t.s === unit.s);
    if (!tile || tile.controllingFamily !== prev.playerFamily) return prev;

    // Check cost
    if (prev.resources.money < SAFEHOUSE_COST) {
      return { ...prev, pendingNotifications: [...prev.pendingNotifications, {
        type: 'error' as const, title: '💰 Insufficient Funds',
        message: `Need $${SAFEHOUSE_COST.toLocaleString()} to establish a safehouse.`,
      }]};
    }

    // Check max safehouses (scaling: 2nd allowed at 15+ hexes)
    const playerHexCount = prev.hexMap.filter(t => t.controllingFamily === prev.playerFamily).length;
    const maxAllowed = playerHexCount >= SAFEHOUSE_TERRITORY_THRESHOLD ? MAX_SAFEHOUSES : 1;
    if (prev.safehouses.length >= maxAllowed) {
      return { ...prev, pendingNotifications: [...prev.pendingNotifications, {
        type: 'warning' as const, title: '🏠 Safehouse Limit Reached',
        message: maxAllowed === 1 ? `Control ${SAFEHOUSE_TERRITORY_THRESHOLD}+ hexes to build a 2nd safehouse.` : `Maximum ${MAX_SAFEHOUSES} safehouses allowed.`,
      }]};
    }

    // Check not already a safehouse on this hex
    if (prev.safehouses.some(s => s.q === unit.q && s.r === unit.r && s.s === unit.s)) {
      return { ...prev, pendingNotifications: [...prev.pendingNotifications, {
        type: 'warning' as const, title: '🏠 Already a Safehouse',
        message: 'There is already a safehouse on this hex.',
      }]};
    }

    const newSafehouse: Safehouse = {
      q: unit.q, r: unit.r, s: unit.s,
      turnsRemaining: SAFEHOUSE_DURATION,
      createdTurn: prev.turn,
    };

    return {
      ...prev, 
      safehouses: [...prev.safehouses, newSafehouse],
      resources: { ...prev.resources, money: prev.resources.money - SAFEHOUSE_COST },
      selectedUnitId: null, availableMoveHexes: [],
      pendingNotifications: [...prev.pendingNotifications, {
        type: 'success' as const, title: '🏠 Safehouse Established',
        message: `Secondary deploy point active for ${SAFEHOUSE_DURATION} turns. Cost: $${SAFEHOUSE_COST.toLocaleString()}.`,
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
