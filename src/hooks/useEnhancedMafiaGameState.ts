import { useState, useCallback, useEffect } from 'react';
import { 
  EconomySystem, 
  AIOpponent, 
  GameEvent, 
  EnhancedReputationSystem,
  
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
  FamilyBonuses, CapoPersonality, AlliancePact, CeasefirePact, AllianceCondition, NegotiationType, NegotiationScope, PERSONALITY_BONUSES,
  NEGOTIATION_TYPES, NEGOTIATION_REFUND_RATE, ShareProfitsPact, SafePassagePact,
  ScoutedHex, Safehouse, MoveAction, PlannedHit,
  FORTIFY_DEFENSE_BONUS, FORTIFY_CASUALTY_REDUCTION, FORTIFY_ABANDON_TURNS, FortifiedHex, SCOUT_DURATION, SCOUT_INTEL_BONUS, SCOUT_STALE_BONUS, SCOUT_DETECTION_CHANCE, SAFEHOUSE_DURATION, MAX_ESCORT_SOLDIERS,
  SAFEHOUSE_COST, SAFEHOUSE_DEFENSE_BONUS, SAFEHOUSE_CAPTURE_BOUNTY, SAFEHOUSE_CAPTURE_INTEL_DURATION, SAFEHOUSE_TERRITORY_THRESHOLD, MAX_SAFEHOUSES,
  PLAN_HIT_BONUS, PLAN_HIT_DURATION, PLAN_HIT_FAIL_REPUTATION, PLAN_HIT_FAIL_LOYALTY,
  PLAN_HIT_RELOCATED_BONUS, PLAN_HIT_RELOCATED_HEAT, PLAN_HIT_COOLDOWN,
  BASE_ACTIONS_PER_TURN, BONUS_ACTION_RESPECT_THRESHOLD, BONUS_ACTION_INFLUENCE_THRESHOLD,
  TACTICAL_ACTIONS_PER_TURN,
  HiddenUnit, AIBounty,
  BLIND_HIT_PENALTY, BLIND_HIT_RESPECT, BLIND_HIT_FEAR, HIDING_DURATION, BOUNTY_DURATION, BLIND_HIT_INFLUENCE_LOSS,
  INTERNAL_HIT_LOYALTY_THRESHOLD, INTERNAL_HIT_HEAT_REDUCTION, INTERNAL_HIT_MORALE_RISK, INTERNAL_HIT_MORALE_PENALTY,
  LOYALTY_ACTION_BONUS, LOYALTY_COMBAT_BONUS, LOYALTY_INCOME_HEX_BONUS, LOYALTY_INCOME_HEX_THRESHOLD, LOYALTY_UNPAID_PENALTY,
  CAPO_WOUND_LOYALTY_PENALTY, CAPO_WOUND_MOVE_PENALTY, CAPO_WOUND_DURATION, CAPO_WOUND_COMBAT_PENALTY,
  AI_PLAN_HIT_CHANCE, AI_PLAN_HIT_SUCCESS_RATE, AI_PLAN_HIT_DURATION,
  AIPlannedHit, IntelSource, INTEL_SOURCE_LABELS,
  FlippedSoldier,
  HQ_ASSAULT_BASE_CHANCE, HQ_DEFENSE_BONUS, HQ_ASSAULT_MAX_CHANCE, HQ_ASSAULT_MIN_TOUGHNESS, HQ_ASSAULT_MIN_LOYALTY,
  FLIP_SOLDIER_COST, FLIP_SOLDIER_BASE_CHANCE, FLIP_SOLDIER_FAIL_INFLUENCE_LOSS,
  SITDOWN_COST, SITDOWN_COOLDOWN, SITDOWN_LOYALTY_BONUS, SITDOWN_DEFENSE_PER_SOLDIER,
  CLAIM_TOUGHNESS_GAIN, EXTORTION_TOUGHNESS_GAIN,
  BUILT_BUSINESS_DEFENSE_BONUS, BUILT_BUSINESS_HEAT_REDUCTION, BUILT_BUSINESS_RESPECT_THRESHOLD, BUILT_BUSINESS_RESPECT_BONUS, BUILT_BUSINESS_LOYALTY_BONUS,
  BUILT_BIZ_SEIZURE_CEASEFIRE_DURATION, BUILT_BIZ_SEIZURE_INCOME_PENALTY, BUILT_BIZ_SEIZURE_RESPECT_LOSS, BUILT_BIZ_SEIZURE_FEAR_LOSS, BUILT_BIZ_SEIZURE_INFLUENCE_GAIN,
  CEASEFIRE_VIOLATION_RESPECT_LOSS, CEASEFIRE_VIOLATION_FEAR_LOSS, TREACHERY_DEBUFF_DURATION, TREACHERY_NEGOTIATION_PENALTY, TreacheryDebuff,
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

// ============ SYNC HELPER ============
const syncRespect = (state: any, value: number) => {
  state.reputation.respect = value;
  state.resources.respect = Math.round(value);
};

// ============ BUILT BUSINESS SEIZURE HELPER ============
const applyBuiltBusinessSeizure = (state: any, tile: any, seizingFamily: string, losingFamily: string) => {
  if (!tile.business || tile.business.isExtorted) return; // Only applies to player-built businesses
  
  // Mark business with seizure penalty
  tile.business.seizurePenaltyTurns = BUILT_BIZ_SEIZURE_CEASEFIRE_DURATION;
  tile.business.wasPlayerBuilt = true;
  
  // Auto-ceasefire between the two families
  const existingCeasefire = (state.ceasefires || []).some(
    (c: any) => c.active && c.family === seizingFamily
  );
  if (!existingCeasefire) {
    state.ceasefires = [...(state.ceasefires || []), {
      id: `ceasefire-seizure-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      family: seizingFamily,
      turnsRemaining: BUILT_BIZ_SEIZURE_CEASEFIRE_DURATION,
      turnFormed: state.turn,
      active: true,
    }];
  }
  
  // Reputation loss for the losing family (player)
  if (losingFamily === state.playerFamily) {
    syncRespect(state, Math.max(0, state.reputation.respect - BUILT_BIZ_SEIZURE_RESPECT_LOSS));
    state.reputation.fear = Math.max(0, (state.reputation.fear || 0) - BUILT_BIZ_SEIZURE_FEAR_LOSS);
  }
  
  // Influence gain for the seizing family
  const seizingOpp = state.aiOpponents.find((o: any) => o.family === seizingFamily);
  if (seizingOpp) {
    seizingOpp.resources.money += 0; // no direct cash, just influence
  }
  // If player seized it (future-proofing), gain influence
  if (seizingFamily === state.playerFamily) {
    state.resources.influence = (state.resources.influence || 0) + BUILT_BIZ_SEIZURE_INFLUENCE_GAIN;
  }
  
  // Notification
  if (losingFamily === state.playerFamily) {
    state.pendingNotifications.push({
      type: 'error' as const,
      title: '⚠️ Business Seized!',
      message: `The ${seizingFamily.charAt(0).toUpperCase() + seizingFamily.slice(1)} family took over your built business in ${tile.district}! A ${BUILT_BIZ_SEIZURE_CEASEFIRE_DURATION}-turn ceasefire is now in effect. Business runs at 50% revenue. -${BUILT_BIZ_SEIZURE_RESPECT_LOSS} respect, -${BUILT_BIZ_SEIZURE_FEAR_LOSS} fear.`,
    });
  }
};

// ============ HEX FORTIFICATION HELPERS ============
const isHexFortified = (fortifiedHexes: FortifiedHex[], q: number, r: number, s: number, family: string): boolean =>
  (fortifiedHexes || []).some(f => f.q === q && f.r === r && f.s === s && f.family === family);

const isHexFortifiedAny = (fortifiedHexes: FortifiedHex[], q: number, r: number, s: number): boolean =>
  (fortifiedHexes || []).some(f => f.q === q && f.r === r && f.s === s);

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
  fortifiedHexes: (state.fortifiedHexes || []).map(f => ({ ...f })),
  activeBribes: (state.activeBribes || []).map(b => ({ ...b })),
  plannedHit: state.plannedHit ? { ...state.plannedHit } : null,
  planHitCooldownUntil: state.planHitCooldownUntil || 0,
  alliances: (state.alliances || []).map(a => ({ ...a, conditions: a.conditions.map(c => ({ ...c })) })),
  ceasefires: (state.ceasefires || []).map(c => ({ ...c })),
  shareProfitsPacts: (state.shareProfitsPacts || []).map(p => ({ ...p })),
  safePassagePacts: (state.safePassagePacts || []).map(p => ({ ...p })),
  bossNegotiationCooldown: state.bossNegotiationCooldown || 0,
  capoNegotiationCooldown: state.capoNegotiationCooldown || 0,
  events: [...(state.events || [])],
  flippedSoldiers: (state.flippedSoldiers || []).map(f => ({ ...f })),
  eliminatedFamilies: [...(state.eliminatedFamilies || [])],
  sitdownCooldownUntil: state.sitdownCooldownUntil || 0,
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
  fortified?: boolean; // DEPRECATED — use fortifiedHexes on game state instead
  escortingSoldierIds?: string[]; // capo only — IDs of soldiers being escorted
  recruited?: boolean; // true = locally recruited (loyal), false/undefined = mercenary (bought)
  pendingDefection?: boolean; // set by Internal Betrayal event — resolved in endTurn
  woundedTurnsRemaining?: number; // capo only — 0 or undefined = healthy, >0 = wounded
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
    isExtorted?: boolean;
    seizurePenaltyTurns?: number;  // turns remaining at 50% income after rival seizes a player-built business
    wasPlayerBuilt?: boolean;       // tracks that this was originally a player-built business (cleared when penalty expires)
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
  mapSize: 'small' | 'medium' | 'large';
  
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
  shareProfitsPacts: ShareProfitsPact[];
  safePassagePacts: SafePassagePact[];
  bossNegotiationCooldown: number;
  capoNegotiationCooldown: number;
  treacheryDebuff?: TreacheryDebuff;
  victoryProgress: VictoryProgress;
  victoryType: VictoryType;
  familyBonuses: FamilyBonuses;
  lastTurnIncome: number;
  pendingNotifications: Array<{ type: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string }>;
  
  // Move phase systems
  scoutedHexes: ScoutedHex[];
  safehouses: Safehouse[];
  fortifiedHexes: FortifiedHex[];
  plannedHit: PlannedHit | null;
  planHitCooldownUntil: number;
  selectedMoveAction: MoveAction;
  
  // Action & tactical budgets
  actionsRemaining: number;
  maxActions: number;
  tacticalActionsRemaining: number;
  maxTacticalActions: number;
  
  // Enhanced systems
  economy: EconomySystem;
  aiOpponents: AIOpponent[];
  events: GameEvent[];
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
  reinforceTargets?: Array<{ q: number; r: number; s: number; family: string; expiresOnTurn: number }>;
  
  // HQ Assault system
  flippedSoldiers: FlippedSoldier[];
  eliminatedFamilies: string[];
  sitdownCooldownUntil: number;
  
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

// BFS: returns all player-owned hexes connected to HQ via owned territory
const getConnectedTerritory = (hexMap: HexTile[], playerFamily: string): Set<string> => {
  const hqTile = hexMap.find(t => t.isHeadquarters === playerFamily);
  if (!hqTile) return new Set();
  const key = (q: number, r: number, s: number) => `${q},${r},${s}`;
  const visited = new Set<string>();
  const queue: Array<{q:number;r:number;s:number}> = [{ q: hqTile.q, r: hqTile.r, s: hqTile.s }];
  visited.add(key(hqTile.q, hqTile.r, hqTile.s));
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const neighbors = getHexNeighbors(cur.q, cur.r, cur.s);
    for (const n of neighbors) {
      const nKey = key(n.q, n.r, n.s);
      if (visited.has(nKey)) continue;
      const tile = hexMap.find(t => t.q === n.q && t.r === n.r && t.s === n.s);
      if (tile && (tile.controllingFamily === playerFamily || tile.isHeadquarters === playerFamily)) {
        visited.add(nKey);
        queue.push(n);
      }
    }
  }
  return visited;
};

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
  
  const threshold = Math.ceil(radius * 0.4);
  const threshold2 = Math.ceil(radius * 0.3);
  
  const getDistrict = (q: number, r: number): HexTile['district'] => {
    if (q <= -threshold && r >= threshold2) return 'Little Italy';
    if (q >= threshold2 && r <= -threshold) return 'Manhattan';
    if (q >= threshold2 && r >= threshold2) return 'Staten Island';
    if (q <= -threshold && r <= -threshold) return 'Queens';
    if (r >= threshold2) return 'Brooklyn';
    if (r <= -threshold) return 'Bronx';
    if (q >= threshold2) return 'Manhattan';
    if (q <= -threshold) return 'Queens';
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

const HQ_POSITIONS_BY_SIZE: Record<string, Record<string, {q:number;r:number;s:number;district:HexTile['district']}>> = {
  small: {
    gambino:  { q: -5, r:  5, s: 0,  district: 'Little Italy' },
    genovese: { q:  5, r: -5, s: 0,  district: 'Manhattan' },
    lucchese: { q: -5, r: -1, s: 6,  district: 'Queens' },
    bonanno:  { q:  5, r:  2, s: -7, district: 'Staten Island' },
    colombo:  { q:  0, r: -6, s: 6,  district: 'Bronx' },
  },
  medium: {
    gambino:  { q: -8, r:  8, s: 0,  district: 'Little Italy' },
    genovese: { q:  8, r: -8, s: 0,  district: 'Manhattan' },
    lucchese: { q: -8, r: -1, s: 9,  district: 'Queens' },
    bonanno:  { q:  7, r:  3, s: -10, district: 'Staten Island' },
    colombo:  { q:  0, r: -9, s: 9,  district: 'Bronx' },
  },
  large: {
    gambino:  { q: -11, r: 11, s: 0,  district: 'Little Italy' },
    genovese: { q:  11, r: -11, s: 0, district: 'Manhattan' },
    lucchese: { q: -11, r: -1, s: 12, district: 'Queens' },
    bonanno:  { q:  10, r:  3, s: -13, district: 'Staten Island' },
    colombo:  { q:   0, r: -12, s: 12, district: 'Bronx' },
  },
};

// ============ INITIAL STATE ============
const createInitialGameState = (
  family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo' = 'gambino',
  startingResources?: { money: number; soldiers: number; influence: number; politicalPower: number; respect: number },
  difficulty: Difficulty = 'normal',
  providedSeed?: number,
  mapSize: 'small' | 'medium' | 'large' = 'medium'
): EnhancedMafiaGameState => {
  const MAP_RADII: Record<string, number> = { small: 7, medium: 10, large: 13 };
  const mapRadius = MAP_RADII[mapSize] || 10;
  const HQ_POSITIONS = HQ_POSITIONS_BY_SIZE[mapSize] || HQ_POSITIONS_BY_SIZE.medium;
  const mapSeed = providedSeed ?? Math.floor(Math.random() * 4294967296);
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
        hits: 0, extortions: 0, victories: 0, toughness: 0, racketeering: 0, turnsDeployed: 0, toughnessProgress: 0,
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
    mapSize,
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
    shareProfitsPacts: [],
    safePassagePacts: [],
    bossNegotiationCooldown: 0,
    capoNegotiationCooldown: 0,
    treacheryDebuff: undefined,
    victoryProgress: {
      territory: { current: 0, target: mapSize === 'small' ? 40 : mapSize === 'large' ? 80 : 60, met: false },
      economic: { current: 0, target: 50000, met: false },
      legacy: { current: 0, highestRival: 0, met: false },
      domination: { eliminated: 0, target: 4, met: false },
    },
    flippedSoldiers: [],
    eliminatedFamilies: [],
    sitdownCooldownUntil: 0,
    victoryType: null,
    familyBonuses: bonuses,
    lastTurnIncome: 0,
    pendingNotifications: [],
    scoutedHexes: [],
    safehouses: [],
    fortifiedHexes: [],
    plannedHit: null,
    planHitCooldownUntil: 0,
    selectedMoveAction: 'move' as MoveAction,
    actionsRemaining: BASE_ACTIONS_PER_TURN,
    maxActions: BASE_ACTIONS_PER_TURN,
    tacticalActionsRemaining: TACTICAL_ACTIONS_PER_TURN,
    maxTacticalActions: TACTICAL_ACTIONS_PER_TURN,
    
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
          resources: { money: 35000 + Math.floor(Math.random() * 15000), soldiers: 2, influence: 8 + Math.floor(Math.random() * 8), respect: 15 + Math.floor(Math.random() * 10) },
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
  difficulty?: Difficulty,
  seed?: number,
  mapSize?: 'small' | 'medium' | 'large'
) => {
  const [gameState, setGameState] = useState<EnhancedMafiaGameState>(() => 
    createInitialGameState(initialFamily || 'gambino', startingResources, difficulty || 'normal', seed, mapSize || 'medium')
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
    const TERRITORY_TARGET = state.mapSize === 'small' ? 40 : state.mapSize === 'large' ? 80 : 60;
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

    const eliminatedCount = (state.eliminatedFamilies || []).length;
    state.victoryProgress = {
      territory: { current: playerHexes, target: TERRITORY_TARGET, met: playerHexes >= TERRITORY_TARGET },
      economic: { current: income, target: ECONOMIC_TARGET, met: income >= ECONOMIC_TARGET },
      legacy: { current: playerRep, highestRival, met: legacyMet },
      domination: { eliminated: eliminatedCount, target: 4, met: eliminatedCount >= 4 },
    };

    const prevVictory = state.victoryType;
    if (state.victoryProgress.domination.met) state.victoryType = 'domination';
    else if (state.victoryProgress.territory.met) state.victoryType = 'territory';
    else if (state.victoryProgress.economic.met) state.victoryType = 'economic';
    else if (state.victoryProgress.legacy.met) state.victoryType = 'legacy';
    else state.victoryType = null;

    // Notify on first victory
    if (state.victoryType && !prevVictory) {
      const labels: Record<string, string> = {
        domination: 'Total Domination — All rival families have been eliminated!',
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

  const skipToActionPhase = useCallback(() => {
    setGameState(prev => {
      if (prev.turnPhase === 'action' || prev.turnPhase === 'waiting') return prev;
      const hasBonus = prev.resources.respect >= BONUS_ACTION_RESPECT_THRESHOLD && 
                       prev.resources.influence >= BONUS_ACTION_INFLUENCE_THRESHOLD;
      const maxActs = BASE_ACTIONS_PER_TURN + (hasBonus ? 1 : 0);
      return {
        ...prev,
        turnPhase: 'action' as TurnPhase,
        movementPhase: false,
        selectedUnitId: null,
        availableMoveHexes: [],
        deployMode: null,
        availableDeployHexes: [],
        selectedMoveAction: 'move' as MoveAction,
        actionsRemaining: maxActs,
        maxActions: maxActs,
        tacticalActionsRemaining: 0,
      };
    });
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
          if (isHexFortified(prev.fortifiedHexes || [], unit.q, unit.r, unit.s, prev.playerFamily)) return prev; // Hex already fortified
          return {
            ...prev,
            fortifiedHexes: [...(prev.fortifiedHexes || []), { q: unit.q, r: unit.r, s: unit.s, family: prev.playerFamily, fortifiedOnTurn: prev.turn }],
            selectedUnitId: null, availableMoveHexes: [],
            tacticalActionsRemaining: prev.tacticalActionsRemaining - 1,
            pendingNotifications: [...prev.pendingNotifications, {
              type: 'info' as const, title: '🛡️ Hex Fortified',
              message: `Defenses built at this position (+${FORTIFY_DEFENSE_BONUS}% defense for all units here).`,
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
      if (unitType === 'capo') {
        // Capo movement unchanged — fly up to 5 hexes
        const range = Math.min(5, unit.movesRemaining);
        const candidateHexes = getHexesInRange(unit.q, unit.r, unit.s, range);
        const validHexes = candidateHexes.filter(h => {
          const tile = prev.hexMap.find(t => t.q === h.q && t.r === h.r && t.s === h.s);
          if (!tile) return false;
          if (tile.isHeadquarters && tile.isHeadquarters !== prev.playerFamily) return false;
          return true;
        });
        return { ...prev, selectedUnitId: unit.id, availableMoveHexes: validHexes, deployMode: null, availableDeployHexes: [] };
      }

      // Soldier movement: free within connected territory + normal adjacent for venturing out
      const hexKey = (q: number, r: number, s: number) => `${q},${r},${s}`;
      const connectedSet = getConnectedTerritory(prev.hexMap, prev.playerFamily);
      const unitKey = hexKey(unit.q, unit.r, unit.s);
      const isOnConnected = connectedSet.has(unitKey);

      let validHexes: Array<{q:number;r:number;s:number}> = [];

      if (isOnConnected) {
        // Show all connected territory hexes as free moves
        connectedSet.forEach(k => {
          const [q, r, s] = k.split(',').map(Number);
          if (k !== unitKey) {
            const tile = prev.hexMap.find(t => t.q === q && t.r === r && t.s === s);
            if (tile && !(tile.isHeadquarters && tile.isHeadquarters !== prev.playerFamily)) {
              validHexes.push({ q, r, s });
            }
          }
        });
        // Also add normal adjacent hexes for venturing out (unclaimed/enemy)
        const adjacentHexes = getHexNeighbors(unit.q, unit.r, unit.s);
        for (const h of adjacentHexes) {
          const hk = hexKey(h.q, h.r, h.s);
          if (!connectedSet.has(hk)) {
            const tile = prev.hexMap.find(t => t.q === h.q && t.r === h.r && t.s === h.s);
            if (tile && !(tile.isHeadquarters && tile.isHeadquarters !== prev.playerFamily)) {
              validHexes.push(h);
            }
          }
        }
      } else {
        // Not on connected territory — normal 1-hex adjacent only
        const candidateHexes = getHexNeighbors(unit.q, unit.r, unit.s);
        validHexes = candidateHexes.filter(h => {
          const tile = prev.hexMap.find(t => t.q === h.q && t.r === h.r && t.s === h.s);
          if (!tile) return false;
          if (tile.isHeadquarters && tile.isHeadquarters !== prev.playerFamily) return false;
          return true;
        });
      }

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

      // Handle safehouse action (tactical phase only) — blocked for wounded capos
      if (prev.turnPhase === 'move' && moveAction === 'safehouse' && unit.type === 'capo') {
        if ((unit.woundedTurnsRemaining || 0) > 0) {
          return { ...prev, pendingNotifications: [...prev.pendingNotifications, {
            type: 'warning' as const, title: '🩸 Capo Wounded',
            message: `${unit.name || 'Your Capo'} is wounded and cannot establish a safehouse for ${unit.woundedTurnsRemaining} more turn(s).`,
          }]};
        }
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

      // Free movement check: both origin and target in connected territory = 0 cost
      const hexKey = (q: number, r: number, s: number) => `${q},${r},${s}`;
      let moveCost = 1;
      let isFreeMove = false;
      if (unit.type === 'soldier') {
        const connectedSet = getConnectedTerritory(prev.hexMap, prev.playerFamily);
        const originKey = hexKey(unit.q, unit.r, unit.s);
        const targetKey = hexKey(targetLocation.q, targetLocation.r, targetLocation.s);
        if (connectedSet.has(originKey) && connectedSet.has(targetKey)) {
          moveCost = 0;
          isFreeMove = true;
        }
      }

      if (unit.movesRemaining < moveCost) return prev;

      const newUnits = [...prev.deployedUnits];
      let remainingMoves = unit.movesRemaining - moveCost;

      // FIX #5: Zone of control applies even on free moves — free movement skips COST but not ZoC
      if (unit.type === 'soldier') {
        if (isAdjacentToEnemy(targetLocation.q, targetLocation.r, targetLocation.s, prev.hexMap, prev.deployedUnits, prev.playerFamily)) {
          remainingMoves = 0;
        }
      }

      const updatedUnit = { ...unit, q: targetLocation.q, r: targetLocation.r, s: targetLocation.s, movesRemaining: remainingMoves };
      newUnits[unitIdx] = updatedUnit;

      // Handle escort: move escorted soldiers along with capo (works in any move action during deploy phase)
      if (unit.type === 'capo' && unit.escortingSoldierIds?.length) {
        unit.escortingSoldierIds.forEach(soldierIdToEscort => {
          const sIdx = newUnits.findIndex(u => u.id === soldierIdToEscort);
          if (sIdx !== -1) {
            newUnits[sIdx] = { ...newUnits[sIdx], q: targetLocation.q, r: targetLocation.r, s: targetLocation.s, movesRemaining: 0 };
          }
        });
        // Auto-detach soldiers at destination
        newUnits[unitIdx] = { ...newUnits[unitIdx], escortingSoldierIds: [] };
      }

      // Only Capos auto-claim and auto-extort neutral tiles on move
      // Soldiers do NOT auto-claim — they must use the Action phase
      // Wounded capos cannot auto-claim or auto-extort
      let autoExtortNotification: typeof prev.pendingNotifications[0] | null = null;
      let bonusMoney = 0;
      let bonusRespect = 0;
      const isWoundedCapo = unit.type === 'capo' && (unit.woundedTurnsRemaining || 0) > 0;
      const newHexMap = prev.hexMap.map(tile => {
        if (tile.q === targetLocation.q && tile.r === targetLocation.r && tile.s === targetLocation.s) {
          if (tile.controllingFamily === 'neutral' && !tile.isHeadquarters && unit.type === 'capo' && !isWoundedCapo) {
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
            return { ...tile, controllingFamily: prev.playerFamily, business: tile.business ? { ...tile.business, isExtorted: true } : undefined };
          }
        }
        return tile;
      });

      // Apply capo extortion bonuses
      let newResources = prev.resources;
      if (bonusMoney > 0) {
        newResources = { ...prev.resources, money: prev.resources.money + bonusMoney, respect: Math.min(100, prev.resources.respect + bonusRespect) };
        // Sync reputation.respect to match
        prev.reputation.respect = newResources.respect;
      }

      let newAvailableMoves: Array<{q:number;r:number;s:number}> = [];
      // After free move or if moves remain, recalculate available hexes
      if (updatedUnit.movesRemaining > 0 || isFreeMove) {
        if (updatedUnit.type === 'capo') {
          const range = Math.min(5, updatedUnit.movesRemaining);
          const candidates = getHexesInRange(updatedUnit.q, updatedUnit.r, updatedUnit.s, range);
          newAvailableMoves = candidates.filter(h => {
            const tile = newHexMap.find(t => t.q === h.q && t.r === h.r && t.s === h.s);
            if (!tile) return false;
            if (tile.isHeadquarters && tile.isHeadquarters !== prev.playerFamily) return false;
            return true;
          });
        } else {
          // Soldier: recalculate with connected territory logic
          const connectedSetPost = getConnectedTerritory(newHexMap, prev.playerFamily);
          const updKey = hexKey(updatedUnit.q, updatedUnit.r, updatedUnit.s);
          const isOnConnectedPost = connectedSetPost.has(updKey);

          if (isOnConnectedPost) {
            // Show connected territory + adjacent for venturing out
            connectedSetPost.forEach(k => {
              if (k !== updKey) {
                const [q, r, s] = k.split(',').map(Number);
                const tile = newHexMap.find(t => t.q === q && t.r === r && t.s === s);
                if (tile && !(tile.isHeadquarters && tile.isHeadquarters !== prev.playerFamily)) {
                  newAvailableMoves.push({ q, r, s });
                }
              }
            });
            if (updatedUnit.movesRemaining > 0) {
              const adjacentHexes = getHexNeighbors(updatedUnit.q, updatedUnit.r, updatedUnit.s);
              for (const h of adjacentHexes) {
                const hk = hexKey(h.q, h.r, h.s);
                if (!connectedSetPost.has(hk)) {
                  const tile = newHexMap.find(t => t.q === h.q && t.r === h.r && t.s === h.s);
                  if (tile && !(tile.isHeadquarters && tile.isHeadquarters !== prev.playerFamily)) {
                    newAvailableMoves.push(h);
                  }
                }
              }
            }
          } else if (updatedUnit.movesRemaining > 0) {
            const candidates = getHexNeighbors(updatedUnit.q, updatedUnit.r, updatedUnit.s);
            newAvailableMoves = candidates.filter(h => {
              const tile = newHexMap.find(t => t.q === h.q && t.r === h.r && t.s === h.s);
              if (!tile) return false;
              if (tile.isHeadquarters && tile.isHeadquarters !== prev.playerFamily) return false;
              return true;
            });
          }
        }
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

  // ============ FORTIFY HEX ============
  const fortifyUnit = useCallback(() => {
    setGameState(prev => {
      if (prev.turnPhase !== 'move') return prev;
      if (prev.tacticalActionsRemaining <= 0) return prev;
      if (!prev.selectedUnitId) return prev;
      const unit = prev.deployedUnits.find(u => u.id === prev.selectedUnitId);
      if (!unit) return prev;
      if (unit.family !== prev.playerFamily) return prev;
      if (isHexFortified(prev.fortifiedHexes || [], unit.q, unit.r, unit.s, prev.playerFamily)) return prev;

      return {
        ...prev,
        fortifiedHexes: [...(prev.fortifiedHexes || []), { q: unit.q, r: unit.r, s: unit.s, family: prev.playerFamily, fortifiedOnTurn: prev.turn }],
        selectedUnitId: null, availableMoveHexes: [],
        tacticalActionsRemaining: prev.tacticalActionsRemaining - 1,
        pendingNotifications: [...prev.pendingNotifications, {
          type: 'info' as const, title: '🛡️ Hex Fortified',
          message: `Defenses built at this position (+${FORTIFY_DEFENSE_BONUS}% defense for all units here).`,
        }],
      };
    });
  }, []);

  // ============ SCOUT HEX ============
  const processScout = (prev: EnhancedMafiaGameState, unit: DeployedUnit, targetLocation: { q: number; r: number; s: number }): EnhancedMafiaGameState => {
    const tile = prev.hexMap.find(t => t.q === targetLocation.q && t.r === targetLocation.r && t.s === targetLocation.s);
    if (!tile) return prev;
    // Block scouting HQ hexes
    if (tile.isHeadquarters) return prev;
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
      
      // Add safehouse neighbors for soldier deployment, and safehouse range for capo deployment
      // Only use safehouses on hexes controlled by the player's family
      const playerSafehouses = prev.safehouses.filter(sh => {
        const hex = prev.hexMap.find(t => t.q === sh.q && t.r === sh.r && t.s === sh.s);
        return hex && hex.controlledBy === family;
      });
      if (playerSafehouses.length > 0) {
        for (const sh of playerSafehouses) {
          if (unitType === 'soldier') {
            const safehouseNeighbors = getHexNeighbors(sh.q, sh.r, sh.s);
            candidates = [...candidates, ...safehouseNeighbors];
          } else {
            // Capos can deploy up to 5 hexes from safehouse
            const safehouseRange = getHexesInRange(sh.q, sh.r, sh.s, 5);
            candidates = [...candidates, ...safehouseRange];
          }
        }
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
        // FIX #4: Check stacking limit (max 2 units per non-HQ hex)
        const isTargetHQ = prev.hexMap.some(t => t.q === targetLocation.q && t.r === targetLocation.r && t.s === targetLocation.s && t.isHeadquarters === family);
        if (!isTargetHQ) {
          const unitsAtTarget = newDeployedUnits.filter(u => u.q === targetLocation.q && u.r === targetLocation.r && u.s === targetLocation.s);
          if (unitsAtTarget.length >= 2) {
            return prev; // Hex is full
          }
        }

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
            hits: 0, extortions: 0, victories: 0, toughness: 0, racketeering: 0, turnsDeployed: 0, toughnessProgress: 0,
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
      // Wounded capos cannot auto-claim or auto-extort
      let autoExtortNotification: typeof prev.pendingNotifications[0] | null = null;
      let bonusMoney = 0;
      let bonusRespect = 0;
      const deployedUnit = unitType === 'capo' ? newDeployedUnits.find(u => u.family === family && u.type === 'capo' && u.q === targetLocation.q && u.r === targetLocation.r && u.s === targetLocation.s) : null;
      const isWoundedCapo = deployedUnit && (deployedUnit.woundedTurnsRemaining || 0) > 0;
      const newHexMap = prev.hexMap.map(tile => {
        if (tile.q === targetLocation.q && tile.r === targetLocation.r && tile.s === targetLocation.s) {
          if (unitType === 'capo' && tile.controllingFamily === 'neutral' && !tile.isHeadquarters && !isWoundedCapo) {
            const hasCompletedBusiness = tile.business && !(tile.business.constructionProgress !== undefined && tile.business.constructionProgress < (tile.business.constructionGoal || 3));
            if (hasCompletedBusiness) {
              const respectPayoutMult = 0.5 + (prev.reputation.respect / 100);
              const basePayout = tile.business.isLegal ? 1500 : 3000;
              bonusMoney = Math.floor(basePayout * respectPayoutMult);
              bonusRespect = tile.business.isLegal ? 3 : 5;
              autoExtortNotification = {
                type: 'success' as const,
                title: '💰 Capo Auto-Extortion!',
                message: `${deployedUnit?.name || 'Your Capo'} set up a protection racket on the ${tile.business.isLegal ? 'store front' : 'illegal business'}! +$${bonusMoney.toLocaleString()}, +${bonusRespect} respect.`,
              };
            } else {
              autoExtortNotification = {
                type: 'info' as const,
                title: '🏴 Territory Claimed',
                message: `${deployedUnit?.name || 'Your Capo'} claimed this territory on deployment.`,
              };
            }
            return { ...tile, controllingFamily: family as any, business: tile.business ? { ...tile.business, isExtorted: true } : undefined };
          }
          if (unitType === 'capo' && tile.controllingFamily === family && !tile.isHeadquarters) {
            return tile; // already owned
          }
        }
        return tile;
      });

      if (bonusMoney > 0) {
        newResources = { ...newResources, money: newResources.money + bonusMoney, respect: Math.min(100, (newResources.respect || 0) + bonusRespect) };
        // Sync reputation.respect to match
        prev.reputation.respect = newResources.respect;
      }

      const notifications = autoExtortNotification
        ? [...(prev.pendingNotifications || []), autoExtortNotification]
        : (prev.pendingNotifications || []);

      const newState = {
        ...prev, deployedUnits: newDeployedUnits, hexMap: newHexMap,
        resources: newResources, soldierStats: newSoldierStats,
        deployMode: null, availableDeployHexes: [],
        pendingNotifications: notifications,
      };
      syncLegacyUnits(newState);
      return newState;
    });
  }, []);

  // ============ END TURN ============
  const endTurn = useCallback(() => {
    setGameState(prev => {
      const newState = cloneStateForMutation(prev);
      // Defensive guards for arrays that may be undefined (e.g. from older saved state)
      newState.hiddenUnits = newState.hiddenUnits || [];
      newState.aiBounties = newState.aiBounties || [];
      newState.scoutedHexes = newState.scoutedHexes || [];
      newState.activeBribes = newState.activeBribes || [];
      newState.alliances = newState.alliances || [];
      newState.ceasefires = newState.ceasefires || [];
      newState.events = newState.events || [];
      newState.hitmanContracts = newState.hitmanContracts || [];
      newState.shareProfitsPacts = newState.shareProfitsPacts || [];
      newState.safePassagePacts = newState.safePassagePacts || [];
      newState.bossNegotiationCooldown = Math.max(0, (newState.bossNegotiationCooldown || 0) - 1);
      newState.capoNegotiationCooldown = Math.max(0, (newState.capoNegotiationCooldown || 0) - 1);
      newState.pendingNotifications = newState.pendingNotifications || [];
      newState.deployedUnits = newState.deployedUnits || [];
      newState.policeHeat = newState.policeHeat || { level: 0, reductionPerTurn: 2, bribedOfficials: [], arrests: [], rattingRisk: 5 };
      newState.policeHeat.arrests = newState.policeHeat.arrests || [];
      newState.policeHeat.bribedOfficials = newState.policeHeat.bribedOfficials || [];
      newState.aiAlertState = newState.aiAlertState || {};
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

      // Flush mid-turn combat log into turn report events
      if (newState.combatLog && newState.combatLog.length > 0) {
        turnReport.events.push(...newState.combatLog);
        newState.combatLog = [];
      }

      // Reset to deploy phase for next turn
      newState.turnPhase = 'deploy';
      newState.movementPhase = true;
      newState.selectedUnitId = null;
      newState.availableMoveHexes = [];
      newState.deployMode = null;
      newState.availableDeployHexes = [];

      // ============ HIDDEN UNITS RETURN / INTERNAL HIT CHECK ============
      const returningUnits = newState.hiddenUnits.filter(h => newState.turn >= h.returnsOnTurn);
      if (returningUnits.length > 0) {
        const hq = newState.headquarters[newState.playerFamily];
        let returnedCount = 0;
        let eliminatedCount = 0;

        returningUnits.forEach(h => {
          const stats = newState.soldierStats[h.unitId];
          const loyalty = stats?.loyalty ?? 50;

          if (loyalty < INTERNAL_HIT_LOYALTY_THRESHOLD) {
            // ===== INTERNAL FAMILY HIT: soldier eliminated =====
            eliminatedCount++;
            if (turnReport) turnReport.resourceDeltas.soldiers--;
            delete newState.soldierStats[h.unitId];

            // Heat reduction — family cleaned up its mess
            newState.policeHeat.level = Math.max(0, newState.policeHeat.level - INTERNAL_HIT_HEAT_REDUCTION);

            // Morale risk: each remaining soldier may lose loyalty
            Object.keys(newState.soldierStats).forEach(sid => {
              if (Math.random() < INTERNAL_HIT_MORALE_RISK) {
                newState.soldierStats[sid] = {
                  ...newState.soldierStats[sid],
                  loyalty: Math.max(0, newState.soldierStats[sid].loyalty - INTERNAL_HIT_MORALE_PENALTY),
                };
              }
            });

            newState.pendingNotifications.push({
              type: 'error',
              title: '🔪 Internal Family Hit',
              message: `A disloyal soldier (loyalty: ${loyalty}/${INTERNAL_HIT_LOYALTY_THRESHOLD}) was eliminated by the family. -${INTERNAL_HIT_HEAT_REDUCTION} heat. Warning: remaining crew morale may suffer.`,
            });
          } else {
            // ===== LOYAL SOLDIER: returns to HQ =====
            returnedCount++;
            newState.deployedUnits.push({
              id: h.unitId,
              family: newState.playerFamily,
              type: 'soldier',
              q: hq.q, r: hq.r, s: hq.s,
              movesRemaining: 0,
              maxMoves: 2,
              level: 1,
            });
            if (!newState.soldierStats[h.unitId]) {
              newState.soldierStats[h.unitId] = {
                loyalty: 50, training: 0, hits: 0, extortions: 0,
                victories: 0, toughness: 0, racketeering: 0, turnsDeployed: 0, toughnessProgress: 0,
              };
            }
          }
        });

        newState.hiddenUnits = newState.hiddenUnits.filter(h => newState.turn < h.returnsOnTurn);

        if (returnedCount > 0) {
          newState.pendingNotifications.push({
            type: 'info',
            title: '🕵️ Soldier Returned from Hiding',
            message: `${returnedCount} soldier(s) came out of hiding and returned to HQ.`,
          });
        }
        if (turnReport) {
          if (returnedCount > 0) turnReport.events.push(`${returnedCount} soldier(s) returned from hiding.`);
          if (eliminatedCount > 0) turnReport.events.push(`🔪 Internal hit: ${eliminatedCount} disloyal soldier(s) eliminated by the family (loyalty below ${INTERNAL_HIT_LOYALTY_THRESHOLD}). -${INTERNAL_HIT_HEAT_REDUCTION} heat each. Morale risk applied.`);
        }

      }

      const stillHiding = newState.hiddenUnits.length;
      if (stillHiding > 0 && turnReport) {
        const nextReturn = Math.min(...newState.hiddenUnits.map(h => h.returnsOnTurn));
        turnReport.events.push(`🕵️ ${stillHiding} unit(s) still in hiding. Next return: Turn ${nextReturn}.`);
      }

      // ============ PENDING DEFECTIONS (from Internal Betrayal) ============
      const defectors = newState.deployedUnits.filter(u => u.pendingDefection && u.family === newState.playerFamily);
      if (defectors.length > 0) {
        const aiFamilies = newState.aiOpponents.map(o => o.family);
        defectors.forEach(defector => {
          if (Math.random() < 0.5) {
            // Defects to a random AI family
            const targetFamily = aiFamilies[Math.floor(Math.random() * aiFamilies.length)];
            const aiHexes = newState.hexMap.filter(t => t.controllingFamily === targetFamily);
            const targetHex = aiHexes.length > 0 ? aiHexes[Math.floor(Math.random() * aiHexes.length)] : null;
            if (targetHex && targetFamily) {
              newState.deployedUnits = newState.deployedUnits.map(u =>
                u.id === defector.id
                  ? { ...u, family: targetFamily as any, q: targetHex.q, r: targetHex.r, s: targetHex.s, pendingDefection: undefined }
                  : u
              );
              delete newState.soldierStats[defector.id];
              newState.pendingNotifications = [...newState.pendingNotifications, {
                type: 'error', title: '💀 Soldier Defected!',
                message: `A disloyal soldier has defected to the ${targetFamily} family!`,
              }];
              if (turnReport) turnReport.events.push(`A soldier defected to the ${targetFamily} family.`);
            } else {
              // No valid hex — soldier just leaves
              newState.deployedUnits = newState.deployedUnits.filter(u => u.id !== defector.id);
              delete newState.soldierStats[defector.id];
              newState.pendingNotifications = [...newState.pendingNotifications, {
                type: 'error', title: '💀 Soldier Deserted',
                message: 'A disloyal soldier has deserted the family.',
              }];
              if (turnReport) turnReport.events.push('A disloyal soldier deserted.');
            }
          } else {
            // Stays — loyalty resets to 50, clear flag
            newState.deployedUnits = newState.deployedUnits.map(u =>
              u.id === defector.id ? { ...u, pendingDefection: undefined } : u
            );
            if (newState.soldierStats[defector.id]) {
              newState.soldierStats[defector.id] = { ...newState.soldierStats[defector.id], loyalty: 50 };
            }
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'info', title: '🤝 Soldier Stayed',
              message: 'The disloyal soldier decided to remain with the family. Loyalty reset.',
            }];
            if (turnReport) turnReport.events.push('A soldier reconsidered defection and stayed.');
          }
        });
      }

      // ============ EXPIRE AI BOUNTIES ============
      newState.aiBounties = newState.aiBounties.filter(b => newState.turn < b.expiresOnTurn);
      newState.selectedMoveAction = 'move' as MoveAction;
      
      // Reset action & tactical budgets for new turn
      const hasBonus = newState.resources.respect >= BONUS_ACTION_RESPECT_THRESHOLD && 
                       newState.resources.influence >= BONUS_ACTION_INFLUENCE_THRESHOLD;
      newState.maxActions = BASE_ACTIONS_PER_TURN + (hasBonus ? 1 : 0);
      newState.actionsRemaining = newState.maxActions;
      newState.tacticalActionsRemaining = TACTICAL_ACTIONS_PER_TURN;
      newState.maxTacticalActions = TACTICAL_ACTIONS_PER_TURN;

      // Reset moves and escort for new turn; handle wound recovery for capos
      newState.deployedUnits = (newState.deployedUnits || []).map(u => {
        const wounded = u.woundedTurnsRemaining && u.woundedTurnsRemaining > 0;
        let newWounded = wounded ? u.woundedTurnsRemaining! - 1 : 0;
        
        if (wounded && newWounded <= 0 && u.family === newState.playerFamily) {
          newState.pendingNotifications.push({
            type: 'success' as const,
            title: '💚 Capo Recovered!',
            message: `${u.name || 'Your Capo'} has fully healed and is back to full strength.`,
          });
        }
        
        return {
          ...u,
          movesRemaining: u.type === 'capo' ? (newWounded > 0 ? 2 : 3) : u.maxMoves,
          maxMoves: u.type === 'capo' ? (newWounded > 0 ? 2 : 3) : u.maxMoves,
          escortingSoldierIds: undefined,
          woundedTurnsRemaining: u.type === 'capo' ? newWounded : undefined,
        };
      });

      // --- Hex fortification abandonment tick ---
      newState.fortifiedHexes = (newState.fortifiedHexes || []).filter(f => {
        const hasUnits = newState.deployedUnits.some(u => u.family === f.family && u.q === f.q && u.r === f.r && u.s === f.s);
        if (hasUnits) {
          f.abandonedSinceTurn = undefined; // Reset — units are present
          return true;
        }
        if (!f.abandonedSinceTurn) {
          f.abandonedSinceTurn = newState.turn; // Start counting
          return true;
        }
        return (newState.turn - f.abandonedSinceTurn) < FORTIFY_ABANDON_TURNS; // Remove if abandoned too long
      });

      // --- Training increment & individual soldier loyalty (per-turn) ---
      const maintenanceUnpaid = (() => {
        const pSoldiers = newState.deployedUnits.filter(u => u.family === newState.playerFamily && u.type === 'soldier');
        let maint = pSoldiers.length * SOLDIER_MAINTENANCE;
        return newState.resources.money < maint;
      })();

      newState.deployedUnits.forEach(u => {
        const stats = newState.soldierStats[u.id];
        if (!stats) return;
        const hq = newState.headquarters[u.family];
        const atHQ = hq && u.q === hq.q && u.r === hq.r && u.s === hq.s;
        if (!atHQ && u.type === 'soldier') {
          stats.training = Math.min(3, stats.training + 1);
          stats.turnsDeployed += 1;
        }

        // === Individual soldier loyalty: stats-correlated baseline ===
        const baseline = Math.floor((stats.training + stats.toughness + stats.racketeering + stats.victories) / 4);
        stats.loyalty += baseline;

        // === +3 if on high-income hex ===
        if (u.family === newState.playerFamily) {
          const hex = newState.hexMap.find(t => t.q === u.q && t.r === u.r && t.s === u.s);
          if (hex?.business && hex.business.income >= LOYALTY_INCOME_HEX_THRESHOLD) {
            stats.loyalty += LOYALTY_INCOME_HEX_BONUS;
          }
        }

        // === -2 when unpaid ===
        if (maintenanceUnpaid && u.family === newState.playerFamily) {
          stats.loyalty -= LOYALTY_UNPAID_PENALTY;
        }

        // Enforce loyalty caps & floor
        const isCapo = u.type === 'capo';
        stats.loyalty = Math.max(0, Math.min(isCapo ? CAPO_LOYALTY_CAP : SOLDIER_LOYALTY_CAP, stats.loyalty));
      });

      // Tick scouted hexes
      newState.scoutedHexes = newState.scoutedHexes
        .map(s => ({ ...s, turnsRemaining: s.turnsRemaining - 1 }))
        .filter(s => s.turnsRemaining > 0);

      // Expire reinforcement targets
      newState.reinforceTargets = (newState.reinforceTargets || []).filter(rt => rt.expiresOnTurn > newState.turn);

      // Tick safehouses
      newState.safehouses = (newState.safehouses || [])
        .map(s => ({ ...s, turnsRemaining: s.turnsRemaining - 1 }))
        .filter(s => {
          if (s.turnsRemaining <= 0) {
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'warning' as const, title: '🏠 Safehouse Expired',
              message: 'A safehouse has been dismantled.',
            }];
            return false;
          }
          return true;
        });

      // Tick planned hit expiration
      if (newState.plannedHit && newState.plannedHit.expiresOnTurn <= newState.turn) {
        newState.plannedHit = null;
        newState.pendingNotifications = [...newState.pendingNotifications, {
          type: 'warning' as const, title: '🎯 Plan Hit Expired',
          message: 'Your planned hit has expired — the intel went cold.',
        }];
      }
      
      const seasons = ['spring', 'summer', 'fall', 'winter'] as const;
      newState.season = seasons[Math.floor((newState.turn - 1) / 3) % 4];
      
      computeDistrictBonuses(newState, turnReport);
      processEconomy(newState);
      turnReport.income = newState.finances.totalIncome;
      turnReport.maintenance = newState.finances.totalExpenses;
      turnReport.netIncome = newState.finances.totalProfit;

      // --- BANKRUPTCY MECHANIC ---
      if (newState.resources.money < 0) {
        const debt = Math.abs(newState.resources.money);
        const deserters = Math.floor(debt / 10000);
        if (deserters > 0) {
          const playerSoldiersBankrupt = newState.deployedUnits.filter(u => u.family === newState.playerFamily && u.type === 'soldier');
          const toDesert = Math.min(deserters, playerSoldiersBankrupt.length);
          for (let i = 0; i < toDesert; i++) {
            const idx = Math.floor(Math.random() * playerSoldiersBankrupt.length);
            const deserted = playerSoldiersBankrupt.splice(idx, 1)[0];
            newState.deployedUnits = newState.deployedUnits.filter(u => u.id !== deserted.id);
          }
          if (toDesert > 0) {
            turnReport.events.push(`💸 ${toDesert} soldier${toDesert > 1 ? 's' : ''} deserted — can't afford to pay them! (Debt: $${debt.toLocaleString()})`);
            newState.pendingNotifications.push({
              type: 'error' as const, title: '💸 Soldiers Deserted',
              message: `${toDesert} soldier${toDesert > 1 ? 's' : ''} left because the family is $${debt.toLocaleString()} in debt.`,
            });
          }
        }
        // Boss Assassination check — no soldiers, in debt, no recovery path
        const remainingPlayerSoldiers = newState.deployedUnits.filter(u => u.family === newState.playerFamily && u.type === 'soldier');
        const totalIncome = newState.hexMap.reduce((sum, t) => {
          if (t.controllingFamily === newState.playerFamily && t.business) return sum + (t.business.income || 0);
          return sum;
        }, 0);
        const totalCosts = remainingPlayerSoldiers.length * 600 + newState.hexMap.filter(t => t.controllingFamily === newState.playerFamily && !t.isHeadquarters && newState.deployedUnits.filter(u => u.q === t.q && u.r === t.r && u.s === t.s).length === 0).length * 150;
        if (remainingPlayerSoldiers.length === 0 && newState.resources.money < 0 && totalIncome <= totalCosts) {
          turnReport.events.push('☠️ With no soldiers left and the family drowning in debt, the Five Families called a sitdown. The vote was unanimous.');
          newState.pendingNotifications.push({
            type: 'error' as const, title: '☠️ The Bosses Took You Out',
            message: 'All four rival families ordered the hit. With no muscle and no money, there was nothing left to protect the Boss.',
          });
          newState.hexMap.forEach(t => { if (t.controllingFamily === newState.playerFamily && !t.isHeadquarters) t.controllingFamily = 'neutral'; });
          newState.deployedUnits = newState.deployedUnits.filter(u => u.family !== newState.playerFamily);
          newState.gameOver = { type: 'assassination' as any, turn: newState.turn };
        } else if (debt >= 50000) {
          turnReport.events.push('☠️ BANKRUPTCY! The family has collapsed under $50K+ debt. Game Over.');
          newState.pendingNotifications.push({
            type: 'error' as const, title: '☠️ Game Over — Bankruptcy',
            message: `The family collapsed under $${debt.toLocaleString()} in debt. The other families have divided your territory.`,
          });
          // Game over — player loses all territory
          newState.hexMap.forEach(t => { if (t.controllingFamily === newState.playerFamily && !t.isHeadquarters) t.controllingFamily = 'neutral'; });
          newState.deployedUnits = newState.deployedUnits.filter(u => u.family !== newState.playerFamily);
          newState.gameOver = { type: 'bankruptcy' as any, turn: newState.turn };
        } else if (debt >= 20000) {
          turnReport.events.push(`⚠️ WARNING: Family is $${debt.toLocaleString()} in debt! Soldiers will desert. Bankruptcy at -$50K.`);
        }
      }

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
        
        // District control bonus: Little Italy +15% loyalty retention (reduce decay)
        if (hasPlayerDistrictBonus(newState, 'loyalty')) {
          loyaltyDelta += 0.5; // extra baseline = less net decay
        }
        
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
        const totalMaint = playerSoldiersForMaint.length * SOLDIER_MAINTENANCE;
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
              newState.pendingNotifications.push({
                type: 'error' as const, title: '🚪 Soldier Deserted',
                message: 'A soldier abandoned your crew due to dangerously low loyalty.',
              });
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
              newState.pendingNotifications.push({
                type: 'error' as const, title: '⚔️ Mutiny!',
                message: 'A soldier turned against you! -5 Respect.',
              });
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
      
      // --- Passive heat from illegal operations (built businesses generate 50% less heat) ---
      {
        const illegalBizzes = newState.hexMap.filter(t => 
          t.controllingFamily === newState.playerFamily && t.business && !t.business.isLegal
        );
        let heatFromBiz = 0;
        illegalBizzes.forEach(t => {
          const isPlayerBuilt = !t.business!.isExtorted;
          heatFromBiz += isPlayerBuilt ? 0.5 : 1; // built = half heat contribution
        });
        const passiveHeat = Math.floor(heatFromBiz / 3);
        if (passiveHeat > 0) {
          newState.policeHeat.level = Math.min(100, newState.policeHeat.level + passiveHeat);
        }
      }
      
      // --- Built business empire bonuses: +1 respect & +1 loyalty per 3 built businesses ---
      {
        const builtBizCount = newState.hexMap.filter(t => 
          t.controllingFamily === newState.playerFamily && t.business && !t.business.isExtorted &&
          !(t.business.constructionProgress !== undefined && t.business.constructionProgress < (t.business.constructionGoal || 3))
        ).length;
        const bonusTiers = Math.floor(builtBizCount / BUILT_BUSINESS_RESPECT_THRESHOLD);
        if (bonusTiers > 0) {
          const respectBonus = bonusTiers * BUILT_BUSINESS_RESPECT_BONUS;
          newState.reputation.respect = Math.min(100, newState.reputation.respect + respectBonus);
          newState.resources.respect = Math.round(newState.reputation.respect);
          
          const loyaltyBonus = bonusTiers * BUILT_BUSINESS_LOYALTY_BONUS;
          newState.deployedUnits.forEach(u => {
            if (u.family === newState.playerFamily) {
              const stats = newState.soldierStats[u.id];
              if (stats) {
                const cap = u.type === 'capo' ? CAPO_LOYALTY_CAP : SOLDIER_LOYALTY_CAP;
                stats.loyalty = Math.min(cap, stats.loyalty + loyaltyBonus);
              }
            }
          });
          
          if (bonusTiers >= 1) {
            turnReport.events.push(`🏗️ Your ${builtBizCount} built businesses earned +${respectBonus} respect and +${loyaltyBonus} loyalty across all units.`);
          }
        }
      }
      
      // --- Release arrested soldiers & capos ---
      {
        const releasedSoldiers = (newState.arrestedSoldiers || []).filter(a => a.returnTurn <= newState.turn);
        if (releasedSoldiers.length > 0) {
          releasedSoldiers.forEach(a => {
            // Re-deploy at HQ
            const hq = newState.headquarters[newState.playerFamily];
            if (hq) {
              newState.deployedUnits.push({
                id: a.unitId, type: 'soldier', family: newState.playerFamily,
                q: hq.q, r: hq.r, s: hq.s,
                movesRemaining: 2, maxMoves: 2, level: 1,
              });
              turnReport.events.push(`🔓 Soldier released from jail and returned to HQ.`);
            }
          });
          newState.arrestedSoldiers = newState.arrestedSoldiers.filter(a => a.returnTurn > newState.turn);
        }
        const releasedCapos = (newState.arrestedCapos || []).filter(a => a.returnTurn <= newState.turn);
        if (releasedCapos.length > 0) {
          releasedCapos.forEach(a => {
            const hq = newState.headquarters[newState.playerFamily];
            const capoUnit = newState.deployedUnits.find(u => u.id === a.unitId);
            // Only re-deploy if not already on the map (should have been removed)
            if (hq && !capoUnit) {
              const stats = newState.soldierStats[a.unitId];
              newState.deployedUnits.push({
                id: a.unitId, type: 'capo', family: newState.playerFamily,
                q: hq.q, r: hq.r, s: hq.s,
                movesRemaining: 3, maxMoves: 3, level: 1,
                name: stats ? `Capo` : `Capo`,
              });
              turnReport.events.push(`🔓 Capo released from jail and returned to HQ.`);
            }
          });
          newState.arrestedCapos = newState.arrestedCapos.filter(a => a.returnTurn > newState.turn);
        }
      }

      // --- Escalating Police Heat System (4 tiers) ---
      {
        const heat = newState.policeHeat.level;
        const lawyerActive = (newState.lawyerActiveUntil || 0) >= newState.turn;

        // Tier 1: 30+ → income penalty applied in processEconomy
        // (handled via state flag, not here)

        // Tier 2: 50+ → 20% chance soldier arrest (3 turns, 2 with lawyer)
        if (heat >= 50) {
          if (Math.random() < 0.20) {
            const playerSoldiers = newState.deployedUnits.filter(u => u.family === newState.playerFamily && u.type === 'soldier');
            if (playerSoldiers.length > 0) {
              const arrested = playerSoldiers[Math.floor(Math.random() * playerSoldiers.length)];
              newState.deployedUnits = newState.deployedUnits.filter(u => u.id !== arrested.id);
              const baseSentence = 3;
              const sentence = lawyerActive ? Math.max(1, Math.floor(baseSentence * 0.75)) : baseSentence;
              newState.arrestedSoldiers = [...(newState.arrestedSoldiers || []), { unitId: arrested.id, returnTurn: newState.turn + sentence }];
              newState.policeHeat.arrests.push({
                id: `arrest-street-${newState.turn}`,
                type: 'street',
                target: 'Soldier',
                turn: newState.turn,
                sentence,
                impactOnProfit: 5,
              });
              turnReport.events.push(`🚔 Street arrest! A soldier was picked up. Jailed for ${sentence} turns.${lawyerActive ? ' (Lawyer reduced sentence)' : ''}`);
              newState.pendingNotifications.push({
                type: 'error' as const, title: '🚔 Soldier Arrested',
                message: `A soldier was arrested. Jailed for ${sentence} turns.${lawyerActive ? ' (Lawyer reduced sentence)' : ''}`,
              });
            }
          }
        }

        // Tier 3: 70+ → 15% chance capo arrest (5 turns, 4 with lawyer)
        if (heat >= 70) {
          if (Math.random() < 0.15) {
            const playerCapos = newState.deployedUnits.filter(u => u.family === newState.playerFamily && u.type === 'capo');
            if (playerCapos.length > 0) {
              const arrested = playerCapos[Math.floor(Math.random() * playerCapos.length)];
              newState.deployedUnits = newState.deployedUnits.filter(u => u.id !== arrested.id);
              const baseSentence = 5;
              const sentence = lawyerActive ? Math.max(1, Math.floor(baseSentence * 0.75)) : baseSentence;
              newState.arrestedCapos = [...(newState.arrestedCapos || []), { unitId: arrested.id, returnTurn: newState.turn + sentence }];
              newState.policeHeat.arrests.push({
                id: `arrest-capo-${newState.turn}`,
                type: 'management',
                target: arrested.name || 'Capo',
                turn: newState.turn,
                sentence,
                impactOnProfit: 15,
              });
              newState.resources.influence = Math.max(0, newState.resources.influence - 2);
              turnReport.events.push(`👔 Capo arrested! ${arrested.name || 'A capo'} jailed for ${sentence} turns. -2 Influence.${lawyerActive ? ' (Lawyer reduced sentence)' : ''}`);
              newState.pendingNotifications.push({
                type: 'error' as const, title: '👔 Capo Arrested!',
                message: `${arrested.name || 'A capo'} was arrested. Returns in ${sentence} turns.`,
              });
            }
          }
        }

        // Tier 4: 90+ → Shut down 1 illegal business + RICO timer
        if (heat >= 90) {
          // Shut down a random illegal business
          const illegalBizHexes = newState.hexMap.filter(t =>
            t.controllingFamily === newState.playerFamily && t.business && !t.business.isLegal
          );
          if (illegalBizHexes.length > 0) {
            const target = illegalBizHexes[Math.floor(Math.random() * illegalBizHexes.length)];
            const bizType = target.business!.type;
            target.business = undefined;
            turnReport.events.push(`🏚️ Federal raid! Your ${bizType} was shut down permanently!`);
            newState.pendingNotifications.push({
              type: 'error' as const, title: '🏚️ Business Shut Down!',
              message: `The feds raided and permanently closed your ${bizType}.`,
            });
          }

          // RICO timer
          newState.ricoTimer = (newState.ricoTimer || 0) + 1;
          turnReport.events.push(`⚠️ RICO INVESTIGATION: ${newState.ricoTimer}/5 turns at critical heat!`);
          if (newState.ricoTimer >= 5) {
            newState.gameOver = { type: 'rico', turn: newState.turn };
            turnReport.events.push(`🚨 RICO INDICTMENT! The federal government has brought down your empire!`);
            newState.pendingNotifications.push({
              type: 'error' as const, title: '🚨 GAME OVER — RICO Indictment',
              message: `5 consecutive turns at critical heat. Your entire organization has been dismantled by the feds.`,
            });
          }
        } else {
          // Reset RICO timer if heat drops below 90
          if ((newState.ricoTimer || 0) > 0) {
            newState.ricoTimer = 0;
            turnReport.events.push(`✅ RICO investigation suspended — heat dropped below critical.`);
          }
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
      
      // District control bonus: Staten Island +2 respect/turn
      if (hasPlayerDistrictBonus(newState, 'respect')) {
        newState.reputation.respect = Math.min(100, newState.reputation.respect + 2);
      }
      // FIX #3: Sync resources.respect with reputation.respect (single source of truth)
      syncRespect(newState, newState.reputation.respect);
      
      // --- Heat decay (after arrests) ---
      let heatReduction = newState.policeHeat.reductionPerTurn;
      // District control bonus: Brooklyn -3 heat/turn
      if (hasPlayerDistrictBonus(newState, 'heat')) {
        heatReduction += 3;
      }
      newState.policeHeat.level = Math.max(0, newState.policeHeat.level - heatReduction);
      
      // FIX #2: Process hitman contracts
      if (newState.hitmanContracts && newState.hitmanContracts.length > 0) {
        const resolvedContracts: string[] = [];
        newState.hitmanContracts = newState.hitmanContracts.map(contract => {
          const updated = { ...contract, turnsRemaining: contract.turnsRemaining - 1 };
          if (updated.turnsRemaining <= 0) {
            resolvedContracts.push(contract.id);
            // Resolve: find the target
            const targetUnit = newState.deployedUnits.find(u => u.id === contract.targetUnitId);
            if (!targetUnit) {
              // Target already dead — refund
              newState.resources.money += Math.round(contract.cost * HITMAN_REFUND_RATE);
              newState.pendingNotifications.push({
                type: 'info' as const, title: '🎯 Hitman: Target Gone',
                message: `Target eliminated by other means. $${Math.round(contract.cost * HITMAN_REFUND_RATE).toLocaleString()} refunded.`,
              });
              return updated;
            }
            // Determine success rate based on target's current hex
            const tHex = newState.hexMap.find(t => t.q === targetUnit.q && t.r === targetUnit.r && t.s === targetUnit.s);
            const isAtHQ = tHex?.isHeadquarters === targetUnit.family;
            const isAtSafehouse = (newState.safehouses || []).some(s => targetUnit.q === s.q && targetUnit.r === s.r && targetUnit.s === s.s);
            const isFort = isHexFortified(newState.fortifiedHexes || [], targetUnit.q, targetUnit.r, targetUnit.s, targetUnit.family);
            let successRate = HITMAN_BASE_SUCCESS;
            if (isAtHQ) successRate = HITMAN_HQ_SUCCESS;
            else if (isAtSafehouse) successRate = HITMAN_SAFEHOUSE_SUCCESS;
            else if (isFort) successRate = HITMAN_FORTIFIED_SUCCESS;

            if (Math.random() < successRate) {
              // Kill the target
              newState.deployedUnits = newState.deployedUnits.filter(u => u.id !== contract.targetUnitId);
              delete newState.soldierStats[contract.targetUnitId];
              turnReport.events.push(`🎯 Hitman eliminated a ${contract.targetFamily} ${targetUnit.type}!`);
              newState.pendingNotifications.push({
                type: 'success' as const, title: '🎯 Contract Fulfilled',
                message: `Your hitman successfully eliminated a ${contract.targetFamily} ${targetUnit.type}. No heat generated.`,
              });
            } else {
              // Failed — refund 50%, alert target family
              newState.resources.money += Math.round(contract.cost * HITMAN_REFUND_RATE);
              newState.aiAlertState[contract.targetFamily] = HITMAN_ALERT_DURATION;
              turnReport.events.push(`🎯 Hitman failed to eliminate a ${contract.targetFamily} ${targetUnit.type}.`);
              newState.pendingNotifications.push({
                type: 'warning' as const, title: '🎯 Contract Failed',
                message: `Hitman failed. $${Math.round(contract.cost * HITMAN_REFUND_RATE).toLocaleString()} refunded. ${contract.targetFamily} family is now on high alert.`,
              });
            }
          }
          return updated;
        });
        // Remove resolved contracts and expired ones
        newState.hitmanContracts = newState.hitmanContracts.filter(c => !resolvedContracts.includes(c.id) && (newState.turn - c.hiredOnTurn) < HITMAN_MAX_LIFETIME);
        // Expire old contracts with refund
        const expiredBefore = newState.hitmanContracts.length;
        newState.hitmanContracts = newState.hitmanContracts.filter(c => {
          if ((newState.turn - c.hiredOnTurn) >= HITMAN_MAX_LIFETIME) {
            newState.resources.money += Math.round(c.cost * HITMAN_REFUND_RATE);
            newState.pendingNotifications.push({
              type: 'info' as const, title: '🎯 Contract Expired',
              message: `Hitman contract expired after ${HITMAN_MAX_LIFETIME} turns. $${Math.round(c.cost * HITMAN_REFUND_RATE).toLocaleString()} refunded.`,
            });
            return false;
          }
          return true;
        });
      }

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

  // ============ DISTRICT CONTROL BONUSES ============
  const DISTRICT_CONTROL_THRESHOLD = 0.6;
  const DISTRICT_BONUSES: Record<string, { bonusType: string; description: string }> = {
    'Manhattan': { bonusType: 'income', description: '+20% business income in Manhattan' },
    'Little Italy': { bonusType: 'loyalty', description: '+15% loyalty retention' },
    'Brooklyn': { bonusType: 'heat', description: '-3 heat/turn' },
    'Bronx': { bonusType: 'recruit_discount', description: '$500 off recruitment' },
    'Queens': { bonusType: 'extortion', description: '+10% extortion success' },
    'Staten Island': { bonusType: 'respect', description: '+2 respect/turn' },
  };

  const computeDistrictBonuses = (state: EnhancedMafiaGameState, turnReport?: TurnReport) => {
    const districts = ['Manhattan', 'Little Italy', 'Brooklyn', 'Bronx', 'Queens', 'Staten Island'];
    const prevBonuses = [...(state.activeDistrictBonuses || [])];
    const newBonuses: typeof state.activeDistrictBonuses = [];

    districts.forEach(district => {
      const districtHexes = state.hexMap.filter(t => t.district === district);
      if (districtHexes.length === 0) return;
      
      // Count per family
      const familyCounts: Record<string, number> = {};
      districtHexes.forEach(t => {
        if (t.controllingFamily !== 'neutral') {
          familyCounts[t.controllingFamily] = (familyCounts[t.controllingFamily] || 0) + 1;
        }
      });

      const total = districtHexes.length;
      Object.entries(familyCounts).forEach(([family, count]) => {
        if (count / total >= DISTRICT_CONTROL_THRESHOLD) {
          const bonusDef = DISTRICT_BONUSES[district];
          if (bonusDef) {
            newBonuses.push({ district, family, ...bonusDef });
          }
        }
      });
    });

    // Detect gained/lost bonuses for player notifications
    const playerFamily = state.playerFamily;
    const prevPlayerBonuses = prevBonuses.filter(b => b.family === playerFamily);
    const newPlayerBonuses = newBonuses.filter(b => b.family === playerFamily);

    newPlayerBonuses.forEach(nb => {
      if (!prevPlayerBonuses.some(pb => pb.district === nb.district)) {
        state.pendingNotifications.push({
          type: 'success', title: `🏰 District Control: ${nb.district}`,
          message: nb.description,
        });
        if (turnReport) turnReport.events.push(`🏰 Gained control of ${nb.district}: ${nb.description}`);
      }
    });
    prevPlayerBonuses.forEach(pb => {
      if (!newPlayerBonuses.some(nb => nb.district === pb.district)) {
        state.pendingNotifications.push({
          type: 'warning', title: `⚠️ Lost Control: ${pb.district}`,
          message: `You no longer control 60% of ${pb.district}. Bonus lost.`,
        });
        if (turnReport) turnReport.events.push(`⚠️ Lost control of ${pb.district} — bonus removed`);
      }
    });

    state.activeDistrictBonuses = newBonuses;
  };

  const hasPlayerDistrictBonus = (state: EnhancedMafiaGameState, bonusType: string): boolean => {
    return (state.activeDistrictBonuses || []).some(b => b.family === state.playerFamily && b.bonusType === bonusType);
  };

  // ============ ECONOMY (with family bonuses) ============
  const processEconomy = (state: EnhancedMafiaGameState) => {
    let income = 0;
    const units = state.deployedUnits || [];
    const bonuses = state.familyBonuses;

    // Tick construction timers on ALL hexes (player-owned)
    const LEGAL_BIZ_DEFS: Record<string, { income: number; launderingCapacity: number }> = {
      restaurant: { income: 3000, launderingCapacity: 2000 },
      store: { income: 1800, launderingCapacity: 1500 },
      construction: { income: 5000, launderingCapacity: 4000 },
    };
    (state.hexMap || []).forEach(tile => {
      if (tile.controllingFamily === state.playerFamily && tile.business && tile.business.constructionGoal && (tile.business.constructionProgress ?? 0) < tile.business.constructionGoal) {
        // Check unit presence on this hex
        const hasCapo = units.some(u => 
          u.family === state.playerFamily && u.type === 'capo' &&
          u.q === tile.q && u.r === tile.r && u.s === tile.s
        );
        const hasSoldier = units.some(u => 
          u.family === state.playerFamily && u.type === 'soldier' &&
          u.q === tile.q && u.r === tile.r && u.s === tile.s
        );

        let progressIncrement = 0;
        if (hasCapo) {
          progressIncrement = 1.5; // 50% faster
        } else if (hasSoldier) {
          progressIncrement = 0.75; // 25% slower
        }
        // If no unit → paused (0 progress)

        if (progressIncrement > 0) {
          tile.business.constructionProgress = (tile.business.constructionProgress ?? 0) + progressIncrement;
        }

        if ((tile.business.constructionProgress ?? 0) >= tile.business.constructionGoal) {
          const def = LEGAL_BIZ_DEFS[tile.business.type];
          if (def) {
            tile.business.income = def.income;
            tile.business.launderingCapacity = def.launderingCapacity;
          }
          tile.business.constructionGoal = undefined;
          tile.business.constructionProgress = undefined;
          tile.business.turnsUntilComplete = undefined;
          state.pendingNotifications = [...(state.pendingNotifications || []), {
            type: 'success' as const, title: '🏢 Business Complete!',
            message: `Your ${tile.business.type} is now operational and generating $${tile.business.income.toLocaleString()}/turn.`,
          }];
        }
      }
    });
    
    let legalIncome = 0;
    let illegalIncome = 0;
    
    (state.hexMap || []).forEach(tile => {
      if (tile.controllingFamily === state.playerFamily && tile.business) {
        // Skip businesses still under construction
        if (tile.business.constructionProgress !== undefined && tile.business.constructionProgress < (tile.business.constructionGoal || 3)) {
          return;
        }
        const hasCapo = units.some(u => 
          u.family === state.playerFamily && u.type === 'capo' &&
          u.q === tile.q && u.r === tile.r && u.s === tile.s
        );
        const hasSoldier = units.some(u => 
          u.family === state.playerFamily && u.type === 'soldier' &&
          u.q === tile.q && u.r === tile.r && u.s === tile.s
        );
        
        let tileIncome = 0;
        const isPlayerBuilt = !tile.business.isExtorted && tile.controllingFamily === state.playerFamily;
        if (isPlayerBuilt) {
          // Player-built businesses earn 100% regardless of unit presence
          tileIncome = tile.business.income;
        } else if (hasCapo) {
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
        
        // District control bonus: Manhattan +20% income
        if (tile.district === 'Manhattan' && hasPlayerDistrictBonus(state, 'income')) {
          tileIncome = Math.floor(tileIncome * 1.2);
        }
        
        if (tile.business.isLegal) {
          legalIncome += tileIncome;
        } else {
          illegalIncome += tileIncome;
        }
        income += tileIncome;
      }
    });

    // Share Profits pact income — earn 30% of target hex's income
    let shareProfitsIncome = 0;
    (state.shareProfitsPacts || []).filter(p => p.active).forEach(pact => {
      const pactTile = state.hexMap.find(t => t.q === pact.hexQ && t.r === pact.hexR && t.s === pact.hexS);
      if (pactTile?.business) {
        const pactIncome = Math.floor(pactTile.business.income * pact.incomeShare);
        shareProfitsIncome += pactIncome;
      }
    });
    income += shareProfitsIncome;
    illegalIncome += shareProfitsIncome; // Treat shared profits as illegal income
    
    // Soldier maintenance — $600/soldier per turn (deployed only, undeployed are free)
    const playerSoldiers = state.deployedUnits.filter(u => u.family === state.playerFamily && u.type === 'soldier');
    const soldierMaintenance = playerSoldiers.length * SOLDIER_MAINTENANCE;

    // Community upkeep — $150/turn for each empty claimed hex (neighborhood expenses)
    const communityHexCount = (state.hexMap || []).filter(tile =>
      tile.controllingFamily === state.playerFamily && !tile.business && !tile.isHeadquarters
    ).length;
    const communityUpkeep = communityHexCount * 150;

    // Store gross income before penalties
    const grossIncome = income;
    const grossLegalIncome = legalIncome;
    const grossIllegalIncome = illegalIncome;
    
    // Compute arrest penalty from gross income (not stale previous turn data)
    const activeArrests = state.policeHeat.arrests.filter(a => state.turn - a.turn < a.sentence);
    const totalProfitPenalty = activeArrests.reduce((sum, a) => sum + a.impactOnProfit, 0);
    let arrestPenaltyAmount = 0;
    if (totalProfitPenalty > 0) {
      const penaltyMultiplier = Math.max(0.1, (100 - totalProfitPenalty) / 100);
      arrestPenaltyAmount = grossIncome - Math.floor(grossIncome * penaltyMultiplier);
    }

    // Compute heat penalty from gross illegal income
    let heatPenaltyAmount = 0;
    {
      const heat = state.policeHeat.level;
      let heatPenaltyRate = 0;
      if (heat >= 70) {
        heatPenaltyRate = 0.25;
      } else if (heat >= 30) {
        heatPenaltyRate = 0.15;
      }
      if (heatPenaltyRate > 0) {
        heatPenaltyAmount = Math.floor(grossIllegalIncome * heatPenaltyRate);
      }
    }

    // Total expenses = maintenance + upkeep + penalties
    const totalExpenses = soldierMaintenance + communityUpkeep + arrestPenaltyAmount + heatPenaltyAmount;
    const totalProfit = grossIncome - totalExpenses;

    // Apply to money
    state.lastTurnIncome = grossIncome;
    state.resources.money += totalProfit;
    
    // Post-penalty income values for display of legal/illegal split
    const postPenaltyLegalIncome = totalProfitPenalty > 0 
      ? Math.floor(grossLegalIncome * Math.max(0.1, (100 - totalProfitPenalty) / 100))
      : grossLegalIncome;
    const postPenaltyIllegalIncome = Math.max(0, grossIllegalIncome - heatPenaltyAmount - (totalProfitPenalty > 0 ? (arrestPenaltyAmount - (grossLegalIncome - postPenaltyLegalIncome)) : 0));
    
    state.finances.totalIncome = grossIncome;
    state.finances.totalExpenses = totalExpenses;
    state.finances.totalProfit = totalProfit;
    state.finances.legalProfit = grossLegalIncome;
    state.finances.illegalProfit = grossIllegalIncome;
    state.finances.legalCosts = soldierMaintenance + communityUpkeep;
    state.finances.dirtyMoney = grossIllegalIncome;
    state.finances.cleanMoney = Math.max(0, state.resources.money - grossIllegalIncome);
    state.finances.soldierMaintenance = soldierMaintenance;
    state.finances.communityUpkeep = communityUpkeep;
    state.finances.arrestPenalty = arrestPenaltyAmount;
    state.finances.heatPenalty = heatPenaltyAmount;
  };

  // ============ PROCESS BRIBES ============
  const processBribes = (state: EnhancedMafiaGameState) => {
    state.activeBribes = (state.activeBribes || []).map(b => {
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
    state.aiOpponents = state.aiOpponents || [];
    state.deployedUnits = state.deployedUnits || [];
    state.aiBounties = state.aiBounties || [];
    state.aiAlertState = state.aiAlertState || {};
    const diffMods = state.difficultyModifiers || DIFFICULTY_MODIFIERS.normal;

    state.aiOpponents.forEach(opponent => {
      const fam = opponent.family as any;
      const hq = state.headquarters[fam];
      if (!hq) return;

      // ── INCOME (difficulty-scaled) ──
      let aiIncome = 0;
      state.hexMap.forEach(tile => {
        if (tile.controllingFamily === fam && tile.business) {
          let tileInc = 0;
          const hasCapo = state.deployedUnits.some(u => u.family === fam && u.type === 'capo' && u.q === tile.q && u.r === tile.r && u.s === tile.s);
          const hasSoldier = state.deployedUnits.some(u => u.family === fam && u.type === 'soldier' && u.q === tile.q && u.r === tile.r && u.s === tile.s);
          if (hasCapo) tileInc = tile.business.income;
          else if (hasSoldier) tileInc = Math.floor(tile.business.income * 0.3);
          else tileInc = Math.floor(tile.business.income * 0.1);
          // Seized player-built business runs at 50% during penalty period
          if (tile.business.seizurePenaltyTurns && tile.business.seizurePenaltyTurns > 0) {
            tileInc = Math.floor(tileInc * BUILT_BIZ_SEIZURE_INCOME_PENALTY);
          }
          aiIncome += tileInc;
        }
      });
      const mapScale = state.mapSize === 'small' ? 0.6 : state.mapSize === 'large' ? 1.5 : 1.0;
      const minIncome = Math.floor((2000 + state.turn * 500) * diffMods.aiIncomeMult * mapScale);
      aiIncome = Math.max(aiIncome, minIncome);
      opponent.resources.money += aiIncome;
      if (turnReport) turnReport.aiActions.push({ family: fam, action: 'income', detail: `Earned $${aiIncome.toLocaleString()} income` });

      // ── RECRUIT (difficulty-scaled cap) ──
      const isAlerted = (state.aiAlertState || {})[fam] > 0;
      const alertBonus = isAlerted ? 1 : 0;
      const capScale = state.mapSize === 'small' ? -2 : state.mapSize === 'large' ? 4 : 0;
      const soldierCap = Math.max(8 + alertBonus + diffMods.aiRecruitCapBonus + capScale, 3 + Math.floor(state.turn / 2) + alertBonus + diffMods.aiRecruitCapBonus + capScale);
      const currentDeployed = state.deployedUnits.filter(u => u.family === fam && u.type === 'soldier').length;
      const totalSoldiers = opponent.resources.soldiers + currentDeployed;
      const wantToRecruit = Math.max(0, soldierCap - totalSoldiers);
      if (wantToRecruit > 0) {
        const canAfford = Math.floor(opponent.resources.money / SOLDIER_COST);
        const toRecruit = Math.min(wantToRecruit, canAfford, 3 + alertBonus);
        opponent.resources.soldiers += toRecruit;
        opponent.resources.money -= toRecruit * SOLDIER_COST;
        if (toRecruit > 0 && turnReport) {
          const hasRecruitIntel = (state.activeBribes || []).some(b => (b.tier === 'police_captain' || b.tier === 'police_chief' || b.tier === 'mayor') && b.active);
          if (hasRecruitIntel) {
            turnReport.aiActions.push({ family: fam, action: 'recruit', detail: `Recruited ${toRecruit} soldier(s)` });
          }
        }
      }

      // ── DEPLOY ──
      let soldiersToPlace = opponent.resources.soldiers;
      while (soldiersToPlace > 0) {
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
              hits: 0, extortions: 0, victories: 0, toughness: 0, racketeering: 0, turnsDeployed: 0, toughnessProgress: 0,
            };
            // Only capos auto-claim neutral territory on deploy (matches player rules)
            const tile = state.hexMap.find(t => t.q === target.q && t.r === target.r && t.s === target.s);
            if (tile && tile.controllingFamily === fam && !tile.isHeadquarters) {
              // Already owned, fine
            } else if (tile && tile.controllingFamily === 'neutral' && !tile.isHeadquarters) {
              // Soldiers do NOT auto-claim neutral hexes (only capos do)
              // Don't set controllingFamily here for soldiers
            }
            soldiersToPlace--;
            placed = true;
            break;
          }
        }
        if (!placed) break;
      }
      opponent.resources.soldiers = soldiersToPlace;
      // Intel: report AI deployments if player has captain+ bribe on this family
      if (turnReport) {
        const hasDeployIntel = (state.activeBribes || []).some(b => 
          (b.tier === 'police_captain' && b.active && b.targetFamily === fam) ||
          ((b.tier === 'police_chief' || b.tier === 'mayor') && b.active)
        );
        const deployedCount = state.deployedUnits.filter(u => u.family === fam).length - currentDeployed;
        if (hasDeployIntel && deployedCount > 0) {
          turnReport.aiActions.push({ family: fam, action: 'deploy', detail: `Deployed ${deployedCount} soldier(s) to the field` });
        }
      }

      // ── PERSONALITY-DRIVEN MOVEMENT & COMBAT ──
      const personality = opponent.personality || 'aggressive';
      const aggression = opponent.strategy.aggressionLevel || 50;
      const cooperation = opponent.strategy.cooperationTendency || 50;

      // AI action budget — boosted in early game (turns 1-8) for faster expansion, scaled by map size
      const earlyGameBonus = state.turn <= 8 ? 2 : 0;
      const mapActionBonus = state.mapSize === 'small' ? -1 : state.mapSize === 'large' ? 1 : 0;
      let aiActionsRemaining = Math.max(1, 2 + (opponent.resources.influence >= 50 ? 1 : 0) + earlyGameBonus + mapActionBonus);
      let aiTacticalRemaining = Math.max(2, 3 + earlyGameBonus + mapActionBonus);

      const aiUnits = state.deployedUnits.filter(u => u.family === fam && u.movesRemaining > 0);
      for (const unit of aiUnits) {
        if (aiTacticalRemaining <= 0) break; // No more tactical actions
        let movesLeft = Math.min(unit.movesRemaining, unit.type === 'soldier' ? (2 + alertBonus) : 3);
        while (movesLeft > 0) {
          const neighbors = unit.type === 'soldier'
            ? getHexNeighbors(unit.q, unit.r, unit.s)
            : getHexesInRange(unit.q, unit.r, unit.s, Math.min(3, movesLeft));
          const validMoves = neighbors.filter(n => {
            const tile = state.hexMap.find(t => t.q === n.q && t.r === n.r && t.s === n.s);
            if (!tile || tile.isHeadquarters) return false;
            // Hex stacking limit: max 2 friendly units per hex
            const friendlyUnitsHere = state.deployedUnits.filter(u => u.family === fam && u.q === n.q && u.r === n.r && u.s === n.s);
            if (friendlyUnitsHere.length >= 2) return false;
            if (tile.controllingFamily === fam) return true;
            const nNeighbors = getHexNeighbors(n.q, n.r, n.s);
            return nNeighbors.some(nn => {
              const nt = state.hexMap.find(t => t.q === nn.q && t.r === nn.r && t.s === nn.s);
              return nt && (nt.controllingFamily === fam || (nt.isHeadquarters && state.headquarters[fam]?.q === nt.q && state.headquarters[fam]?.r === nt.r));
            });
          });
          if (validMoves.length === 0) break;

          // Personality-driven target prioritization
          // Ceasefire enforcement: filter out hexes belonging to ceasefire families
          const hasCeasefireWith = (targetFam: string) => (state.ceasefires || []).some(c => c.active && c.family === targetFam) ||
            (targetFam === state.playerFamily && (state.ceasefires || []).some(c => c.active && c.family === fam));
          const playerHexes = validMoves.filter(n => {
            const tile = state.hexMap.find(t => t.q === n.q && t.r === n.r && t.s === n.s);
            return tile && tile.controllingFamily === state.playerFamily && !hasCeasefireWith(state.playerFamily);
          });
          const neutralHexes = validMoves.filter(n => {
            const tile = state.hexMap.find(t => t.q === n.q && t.r === n.r && t.s === n.s);
            return tile && tile.controllingFamily === 'neutral';
          });
          const otherAIHexes = validMoves.filter(n => {
            const tile = state.hexMap.find(t => t.q === n.q && t.r === n.r && t.s === n.s);
            return tile && tile.controllingFamily !== fam && tile.controllingFamily !== 'neutral' && tile.controllingFamily !== state.playerFamily && !hasCeasefireWith(tile.controllingFamily);
          });
          const enemyHexes = [...playerHexes, ...otherAIHexes];

          let targetPool: typeof validMoves;
          const hasBounty = state.aiBounties.some(b => b.fromFamily === fam && b.targetFamily === state.playerFamily);

          // Prioritize enemy safehouse hexes for bounty + intel
          const safehouseHexes = validMoves.filter(n => 
            state.safehouses.some(s => s.q === n.q && s.r === n.r && s.s === n.s) &&
            !state.hexMap.some(t => t.q === n.q && t.r === n.r && t.s === n.s && t.controllingFamily === fam)
          );

          if (safehouseHexes.length > 0 && Math.random() < 0.7) {
            targetPool = safehouseHexes;
          } else if ((hasBounty || isAlerted) && playerHexes.length > 0) {
            targetPool = playerHexes;
          } else {
            switch (personality) {
              case 'aggressive':
                targetPool = enemyHexes.length > 0 ? enemyHexes : neutralHexes.length > 0 ? neutralHexes : validMoves;
                break;
              case 'defensive':
                targetPool = neutralHexes.length > 0 ? neutralHexes : validMoves;
                break;
              case 'opportunistic': {
                const weakest = enemyHexes.reduce((best, hex) => {
                  const t = state.hexMap.find(t2 => t2.q === hex.q && t2.r === hex.r && t2.s === hex.s);
                  if (!t) return best;
                  const dc = state.deployedUnits.filter(u => u.family === t.controllingFamily && u.q === hex.q && u.r === hex.r && u.s === hex.s).length;
                  if (!best || dc < best.count) return { hex, count: dc };
                  return best;
                }, null as { hex: typeof validMoves[0]; count: number } | null);
                targetPool = weakest ? [weakest.hex] : neutralHexes.length > 0 ? neutralHexes : validMoves;
                break;
              }
              case 'diplomatic':
                if (Math.random() < 0.4) {
                  targetPool = neutralHexes.length > 0 ? neutralHexes : validMoves.filter(n => {
                    const t = state.hexMap.find(t2 => t2.q === n.q && t2.r === n.r && t2.s === n.s);
                    return t && t.controllingFamily === fam;
                  });
                  if (targetPool.length === 0) targetPool = validMoves;
                } else {
                  targetPool = neutralHexes.length > 0 ? neutralHexes : enemyHexes.length > 0 ? enemyHexes : validMoves;
                }
                break;
              case 'unpredictable':
              default: {
                const pools = [playerHexes, neutralHexes, otherAIHexes, enemyHexes].filter(s => s.length > 0);
                targetPool = pools.length > 0 ? pools[Math.floor(Math.random() * pools.length)] : validMoves;
                break;
              }
            }
          }

          // Reinforcement: if this family has a reinforceTarget, try to move toward it
          const reinforceTargets = (state.reinforceTargets || []).filter(rt => rt.family === fam && rt.expiresOnTurn >= state.turn);
          const matchingReinforce = reinforceTargets.find(rt => 
            targetPool.some(t => t.q === rt.q && t.r === rt.r && t.s === rt.s) ||
            getHexNeighbors(unit.q, unit.r, unit.s).some(n => n.q === rt.q && n.r === rt.r && n.s === rt.s)
          );
          if (matchingReinforce) {
            const reinforceHex = validMoves.find(v => v.q === matchingReinforce.q && v.r === matchingReinforce.r && v.s === matchingReinforce.s);
            if (reinforceHex) {
              targetPool = [reinforceHex];
              if (turnReport) turnReport.aiActions.push({ family: fam, action: 'reinforce', detail: `Reinforcing detected scout position` });
            }
          }

          // Alert: fortify chance (hex-based)
          if (isAlerted && !isHexFortified(state.fortifiedHexes || [], unit.q, unit.r, unit.s, fam) && Math.random() < 0.3 && aiTacticalRemaining > 0) {
            state.fortifiedHexes = [...(state.fortifiedHexes || []), { q: unit.q, r: unit.r, s: unit.s, family: fam, fortifiedOnTurn: state.turn }];
            unit.movesRemaining = 0;
            aiTacticalRemaining--;
            if (turnReport) turnReport.aiActions.push({ family: fam, action: 'fortify', detail: `Fortified a hex (alert mode)` });
            continue;
          }

          if (targetPool.length === 0) targetPool = validMoves;
          const target = targetPool[Math.floor(Math.random() * targetPool.length)];
          
          // Save original position — only commit move after combat resolution
          const origQ = unit.q, origR = unit.r, origS = unit.s;
          unit.q = target.q;
          unit.r = target.r;
          unit.s = target.s;

          const targetTile = state.hexMap.find(t => t.q === target.q && t.r === target.r && t.s === target.s);
          const isCommunityHex = targetTile && targetTile.controllingFamily === state.playerFamily && !targetTile.business && !targetTile.isHeadquarters;
          const moveCost = isCommunityHex ? 2 : 1;
          unit.movesRemaining = Math.max(0, unit.movesRemaining - moveCost);
          movesLeft = Math.max(0, movesLeft - moveCost);
          aiTacticalRemaining--;

          const tile = state.hexMap.find(t => t.q === target.q && t.r === target.r && t.s === target.s);
          if (tile && !tile.isHeadquarters) {
            // Combat: ANY enemy units (including other AI — enables AI-to-AI combat)
            const enemyUnitsHere = state.deployedUnits.filter(u =>
              u.family !== fam && u.q === target.q && u.r === target.r && u.s === target.s
            );
            if (enemyUnitsHere.length > 0) {
              // Ceasefire guard: skip combat against ceasefire families
              const ceasefireFamilies = new Set((state.ceasefires || []).filter(c => c.active).map(c => c.family));
              const enemyFromCeasefireFamily = enemyUnitsHere.every(u => ceasefireFamilies.has(u.family) || (u.family === state.playerFamily && ceasefireFamilies.has(fam)));
              if (enemyFromCeasefireFamily) {
                unit.q = origQ; unit.r = origR; unit.s = origS;
                break;
              }
              // Combat costs an action point
              if (aiActionsRemaining <= 0) {
                // No action budget left — revert position and skip
                unit.q = origQ; unit.r = origR; unit.s = origS;
                break;
              }
              const aiStrength = state.deployedUnits.filter(u => u.family === fam && u.q === target.q && u.r === target.r && u.s === target.s).length;

              // Personality-driven combat willingness (replaces flat 0.4)
              let combatWillingness: number;
              switch (personality) {
                case 'aggressive': combatWillingness = 0.8; break;
                case 'defensive': combatWillingness = aiStrength >= enemyUnitsHere.length + 2 ? 0.7 : 0.15; break;
                case 'diplomatic': combatWillingness = 0.2; break;
                case 'opportunistic': combatWillingness = aiStrength >= enemyUnitsHere.length ? 0.6 : 0.2; break;
                default: combatWillingness = Math.random(); break;
              }

              if (aiStrength >= enemyUnitsHere.length || Math.random() < combatWillingness) {
                aiActionsRemaining--; // Deduct action point for combat
                // Safehouse defense bonus: defenders on safehouse hex are harder to kill
              const isTargetSafehouse = state.safehouses.some(s => s.q === target.q && s.r === target.r && s.s === target.s);
                // Built business defense bonus: player-built businesses on this hex grant defenders +20% protection
                const isDefenderBuiltBiz = tile.controllingFamily === state.playerFamily && tile.business && !tile.business.isExtorted;
                const builtBizDefBonus = isDefenderBuiltBiz ? (BUILT_BUSINESS_DEFENSE_BONUS / 100) : 0;
                const baseKillChance = isTargetSafehouse ? 0.7 - (SAFEHOUSE_DEFENSE_BONUS / 100) - builtBizDefBonus : 0.7 - builtBizDefBonus;
                enemyUnitsHere.forEach(eu => {
                  // Capos cannot be killed in regular combat — only wounded
                  if (eu.type === 'capo') {
                    const isDefHexFort = isHexFortified(state.fortifiedHexes || [], eu.q, eu.r, eu.s, eu.family);
                    const woundChance = isDefHexFort ? baseKillChance - (FORTIFY_DEFENSE_BONUS / 100) : baseKillChance;
                    if (Math.random() < woundChance) {
                      // Wound the capo instead of killing
                      if (state.soldierStats[eu.id]) {
                        state.soldierStats[eu.id].loyalty = Math.max(0, state.soldierStats[eu.id].loyalty - CAPO_WOUND_LOYALTY_PENALTY);
                      }
                      eu.woundedTurnsRemaining = CAPO_WOUND_DURATION;
                      eu.maxMoves = Math.max(1, (eu.maxMoves || 3) - CAPO_WOUND_MOVE_PENALTY);
                      if (eu.family === state.playerFamily) {
                        state.pendingNotifications.push({
                          type: 'warning' as const,
                          title: '🩸 Capo Wounded!',
                          message: `Your capo was wounded by the ${fam} family in ${tile.district || 'unknown territory'}. -${CAPO_WOUND_LOYALTY_PENALTY} loyalty, wounded for ${CAPO_WOUND_DURATION} turns.`,
                        });
                        if (turnReport) {
                          turnReport.events.push(`🩸 Capo wounded by the ${fam} family in ${tile.district || 'unknown territory'}`);
                        }
                      }
                    }
                    return; // capo survives either way
                  }
                  // Fortified defenders also get protection
                  const isDefHexFort2 = isHexFortified(state.fortifiedHexes || [], eu.q, eu.r, eu.s, eu.family);
                  const killChance = isDefHexFort2 ? baseKillChance - (FORTIFY_DEFENSE_BONUS / 100) : baseKillChance;
                  if (Math.random() < killChance) {
                    const idx = state.deployedUnits.indexOf(eu);
                    if (idx !== -1) {
                      state.deployedUnits.splice(idx, 1);
                      if (eu.family === state.playerFamily) {
                        state.pendingNotifications.push({
                          type: 'error' as const,
                          title: '💀 Soldier Killed!',
                          message: `Your soldier was killed by the ${fam} family in ${tile.district || 'unknown territory'}!`,
                        });
                        if (turnReport) {
                          turnReport.events.push(`💀 Soldier killed by the ${fam} family in ${tile.district || 'unknown territory'}`);
                          turnReport.resourceDeltas.soldiers--;
                        }
                      }
                    }
                  }
                });
                const remainingEnemies = state.deployedUnits.filter(u =>
                  u.family !== fam && u.q === target.q && u.r === target.r && u.s === target.s
                );
              if (remainingEnemies.length === 0) {
                  const prevOwner = tile.controllingFamily;
                  // Built business seizure: requires a Capo to take over
                  const isPlayerBuiltBiz = prevOwner === state.playerFamily && tile.business && !tile.business.isExtorted;
                  const hasCapoOnHex = state.deployedUnits.some(u => u.family === fam && u.type === 'capo' && u.q === target.q && u.r === target.r && u.s === target.s);
                  if (isPlayerBuiltBiz && !hasCapoOnHex) {
                    // Regular soldiers can't seize player-built businesses
                    state.pendingNotifications.push({
                      type: 'info' as const,
                      title: '🛡️ Business Defended!',
                      message: `Your built business in ${tile.district || 'unknown territory'} repelled a ${fam} takeover — only a Capo can seize player-built businesses.`,
                    });
                    tile.controllingFamily = 'neutral' as any;
                  } else {
                    if (isPlayerBuiltBiz) {
                      applyBuiltBusinessSeizure(state, tile, fam, prevOwner);
                      state.pendingNotifications.push({
                        type: 'error' as const,
                        title: '🚨 Capo Seized Your Business!',
                        message: `The ${fam} Capo seized your built business in ${tile.district || 'unknown territory'}! Only Capos can take player-built businesses.`,
                      });
                    }
                    tile.controllingFamily = 'neutral' as any;
                  }
                  // Destroy fortification on captured hex
                  state.fortifiedHexes = (state.fortifiedHexes || []).filter(f => !(f.q === target.q && f.r === target.r && f.s === target.s));
                  // Check if any safehouse was on this hex (player's)
                  const shIdx = state.safehouses.findIndex(s => s.q === target.q && s.r === target.r && s.s === target.s);
                  if (shIdx !== -1) {
                    state.safehouses.splice(shIdx, 1);
                    if (prevOwner === state.playerFamily) {
                      state.pendingNotifications.push({
                        type: 'error' as const,
                        title: '🏠 Safehouse Destroyed',
                        message: `The ${fam} family captured the hex and destroyed your safehouse! They gained $${SAFEHOUSE_CAPTURE_BOUNTY.toLocaleString()} and intel on your operations.`,
                      });
                    }
                    // Bounty to capturing AI family
                    const captorOpponent = state.aiOpponents.find(o => o.family === fam);
                    if (captorOpponent) captorOpponent.resources.money += SAFEHOUSE_CAPTURE_BOUNTY;
                    if (prevOwner === state.playerFamily) {
                      state.aiAlertState[fam] = Math.max(state.aiAlertState[fam] || 0, SAFEHOUSE_CAPTURE_INTEL_DURATION);
                    }
                  }
                } else {
                  // Combat didn't clear the hex — revert AI unit position
                  unit.q = origQ; unit.r = origR; unit.s = origS;
                }
                if (Math.random() < 0.3) {
                  const aiHere = state.deployedUnits.filter(u => u.family === fam && u.q === target.q && u.r === target.r && u.s === target.s);
                  if (aiHere.length > 1) {
                    const casualty = aiHere[Math.floor(Math.random() * aiHere.length)];
                    const idx = state.deployedUnits.indexOf(casualty);
                    if (idx !== -1) state.deployedUnits.splice(idx, 1);
                  }
                }
                if (enemyUnitsHere.some(u => u.family === state.playerFamily)) {
                  state.pendingNotifications.push({
                    type: 'warning' as const,
                    title: `⚔️ ${fam.charAt(0).toUpperCase() + fam.slice(1)} Attack!`,
                    message: `The ${fam} family attacked your units in ${tile.district || 'unknown territory'}!`,
                  });
                  if (turnReport) turnReport.aiActions.push({ family: fam, action: 'attack', detail: `Attacked your units in ${tile.district}` });
                }
                // Log AI-to-AI combat
                const aiVictims = enemyUnitsHere.filter(u => u.family !== state.playerFamily);
                if (aiVictims.length > 0 && turnReport) {
                  const victimFams = [...new Set(aiVictims.map(u => u.family))];
                  turnReport.aiActions.push({ family: fam, action: 'ai_combat', detail: `Fought ${victimFams.join(', ')} in ${tile.district}` });
                }
              } else {
                // AI declined to fight — revert position
                unit.q = origQ; unit.r = origR; unit.s = origS;
              }
              break;
            } else {
              // No enemies on hex — handle territory claiming
              if (tile.controllingFamily !== fam) {
                const prevOwner = tile.controllingFamily;
                const isNeutral = prevOwner === 'neutral';
                
                if (isNeutral) {
                  // Neutral hex: capos auto-claim (matches player rules), soldiers don't
                  if (unit.type === 'capo') {
                    tile.controllingFamily = fam;
                  }
                } else {
                  // Territory freeze: skip claiming ceasefire family hexes
                  const prevOwnerCeasefire = (state.ceasefires || []).some(c => c.active && (c.family === prevOwner || (prevOwner === state.playerFamily && c.family === fam)));
                  if (prevOwnerCeasefire) {
                    // Can't claim — ceasefire territory freeze
                  } else if (aiActionsRemaining > 0) {
                    // Built business protection: requires a Capo to seize
                    const isPlayerBuiltBiz2 = prevOwner === state.playerFamily && tile.business && !tile.business.isExtorted;
                    if (isPlayerBuiltBiz2 && unit.type !== 'capo') {
                      // Regular soldiers can't seize player-built businesses — notify player
                      state.pendingNotifications.push({
                        type: 'info' as const,
                        title: '🛡️ Business Defended!',
                        message: `Your built business in ${tile.district || 'unknown territory'} repelled a ${fam} takeover — only a Capo can seize player-built businesses.`,
                      });
                    } else {
                      aiActionsRemaining--;
                      if (isPlayerBuiltBiz2) {
                        applyBuiltBusinessSeizure(state, tile, fam, prevOwner);
                        state.pendingNotifications.push({
                          type: 'error' as const,
                          title: '🚨 Capo Seized Your Business!',
                          message: `The ${fam} Capo seized your built business in ${tile.district || 'unknown territory'}! Only Capos can take player-built businesses.`,
                        });
                      }
                      tile.controllingFamily = fam;
                      if (prevOwner === state.playerFamily && turnReport) {
                        turnReport.aiActions.push({ family: fam, action: 'capture', detail: `Captured your territory in ${tile.district}` });
                      }
                    }
                  }
                  // No action budget? Can't claim — just occupying the hex
                }
                
                const shIdx2 = state.safehouses.findIndex(s => s.q === target.q && s.r === target.r && s.s === target.s);
                if (shIdx2 !== -1 && tile.controllingFamily === fam) {
                  state.safehouses.splice(shIdx2, 1);
                  if (prevOwner === state.playerFamily) {
                    state.pendingNotifications.push({
                      type: 'error' as const,
                      title: '🏠 Safehouse Destroyed',
                      message: `The ${fam} family captured your territory and destroyed your safehouse! They gained $${SAFEHOUSE_CAPTURE_BOUNTY.toLocaleString()}.`,
                    });
                  }
                  const captorOpp2 = state.aiOpponents.find(o => o.family === fam);
                  if (captorOpp2) captorOpp2.resources.money += SAFEHOUSE_CAPTURE_BOUNTY;
                }
              }
            }
          }
        }
      }

      // ── AI ACTION PHASE: CLAIM & EXTORT ──
      // Priority 1: Extort neutral hexes with completed businesses (free money + territory)
      const aiUnitsForActions = state.deployedUnits.filter(u => u.family === fam);
      for (const unit of aiUnitsForActions) {
        if (aiActionsRemaining <= 0) break;
        const tile = state.hexMap.find(t => t.q === unit.q && t.r === unit.r && t.s === unit.s);
        if (!tile) continue;
        
        if (tile.controllingFamily === 'neutral' && tile.business && 
            (tile.business.constructionProgress === undefined || tile.business.constructionProgress >= (tile.business.constructionGoal || 3))) {
          // Extort neutral business: claim territory + collect payout
          tile.controllingFamily = fam;
          const basePayout = tile.business.isLegal ? 1500 : 3000;
          const respectMult = 0.5 + (opponent.resources.influence || 50) / 100;
          const payout = Math.round(basePayout * respectMult);
          opponent.resources.money += payout;
          aiActionsRemaining--;
          
          // Update soldier stats
          const stats = state.soldierStats[unit.id];
          if (stats) {
            stats.racketeering = Math.min(100, (stats.racketeering || 0) + 3);
            stats.loyalty = Math.min(100, stats.loyalty + 1);
          }
        }
      }

      // Priority 2: Claim empty neutral hexes
      for (const unit of aiUnitsForActions) {
        if (aiActionsRemaining <= 0) break;
        const tile = state.hexMap.find(t => t.q === unit.q && t.r === unit.r && t.s === unit.s);
        if (!tile) continue;
        
        if (tile.controllingFamily === 'neutral' && !tile.business && !tile.isHeadquarters) {
          tile.controllingFamily = fam;
          aiActionsRemaining--;
        }
      }

      // Priority 3: Extort enemy businesses (aggressive AI only)
      const aggressionThreshold = personality === 'aggressive' ? 0.6 : personality === 'opportunistic' ? 0.4 : 0.2;
      for (const unit of aiUnitsForActions) {
        if (aiActionsRemaining <= 0) break;
        const tile = state.hexMap.find(t => t.q === unit.q && t.r === unit.r && t.s === unit.s);
        if (!tile) continue;
        
        // Check adjacent enemy hexes with businesses
        const adjacentEnemyBiz = state.hexMap.filter(t => {
          const dist = Math.max(Math.abs(t.q - unit.q), Math.abs(t.r - unit.r), Math.abs(t.s - unit.s));
          // Territory freeze: skip ceasefire families
          const isCeasefireTarget = (state.ceasefires || []).some(c => c.active && (c.family === t.controllingFamily || (t.controllingFamily === state.playerFamily && c.family === fam)));
          return dist === 1 && t.controllingFamily !== fam && t.controllingFamily !== 'neutral' && !isCeasefireTarget &&
                 t.business && (t.business.constructionProgress === undefined || t.business.constructionProgress >= (t.business.constructionGoal || 3));
        });
        
        for (const enemyTile of adjacentEnemyBiz) {
          if (aiActionsRemaining <= 0) break;
          if (Math.random() > aggressionThreshold) continue;
          
          // Attempt extortion: ~50% base chance
          const successChance = 0.5 + (opponent.resources.influence || 50) / 1000;
          if (Math.random() < successChance) {
            const basePayout = enemyTile.business!.isLegal ? 1500 : 3000;
            const payout = Math.round(basePayout * 0.7); // Enemy extortion pays less
            opponent.resources.money += payout;
            
            if (enemyTile.controllingFamily === state.playerFamily && turnReport) {
              turnReport.aiActions.push({ family: fam, action: 'extort', detail: `Extorted your business in ${enemyTile.district} for $${payout.toLocaleString()}` });
            }
          }
          aiActionsRemaining--;
        }
      }

      // ── DEPLOY CAPO ──
      const caposAtHQ = state.deployedUnits.filter(u =>
        u.family === fam && u.type === 'capo' && u.q === hq.q && u.r === hq.r && u.s === hq.s
      );
      if (caposAtHQ.length > 0) {
        const capo = caposAtHQ[0];
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

      // ── PROMOTE SOLDIERS TO CAPOS ──
      const aiCapoCount = state.deployedUnits.filter(u => u.family === fam && u.type === 'capo').length;
      if (aiCapoCount < MAX_CAPOS && opponent.resources.money >= CAPO_PROMOTION_COST) {
        const aiSoldierUnits = state.deployedUnits.filter(u => u.family === fam && u.type === 'soldier');
        let bestCandidate: { unit: typeof aiSoldierUnits[0]; stats: SoldierStats } | null = null;
        for (const solUnit of aiSoldierUnits) {
          const stats = state.soldierStats[solUnit.id];
          if (!stats) continue;
          if (
            stats.victories >= CAPO_PROMOTION_REQUIREMENTS.minVictories &&
            stats.loyalty >= CAPO_PROMOTION_REQUIREMENTS.minLoyalty &&
            stats.training >= CAPO_PROMOTION_REQUIREMENTS.minTraining &&
            stats.toughness >= CAPO_PROMOTION_REQUIREMENTS.minToughness &&
            stats.racketeering >= CAPO_PROMOTION_REQUIREMENTS.minRacketeering
          ) {
            if (!bestCandidate || stats.victories > bestCandidate.stats.victories) {
              bestCandidate = { unit: solUnit, stats };
            }
          }
        }
        if (bestCandidate) {
          const { unit: promUnit } = bestCandidate;
          promUnit.type = 'capo' as any;
          promUnit.maxMoves = 3;
          promUnit.movesRemaining = 3;
          (promUnit as any).personality = (['diplomat', 'enforcer', 'schemer'] as const)[Math.floor(Math.random() * 3)];
          (promUnit as any).name = `${fam.charAt(0).toUpperCase() + fam.slice(1)} Capo`;
          opponent.resources.money -= CAPO_PROMOTION_COST;
          if (turnReport) {
            turnReport.aiActions.push({ family: fam, action: 'promote', detail: `Promoted a soldier to Capo` });
          }
        }
      }

      // ── DIPLOMATIC AI: Ceasefire proposals ──
      if (personality === 'diplomatic' && Math.random() < (cooperation / 200)) {
        const hasCeasefire = state.ceasefires.some(c => c.active && c.family === fam);
        if (!hasCeasefire) {
          state.pendingNotifications.push({
            type: 'info' as const,
            title: `🤝 ${fam.charAt(0).toUpperCase() + fam.slice(1)} Offers Ceasefire`,
            message: `The ${fam} family signals they want to negotiate peace. Use a Capo to propose a ceasefire on their territory.`,
          });
          if (turnReport) turnReport.aiActions.push({ family: fam, action: 'diplomacy', detail: 'Signaled interest in ceasefire' });
        }
      }

      // ── AI SAFEHOUSE ESTABLISHMENT ──
      const aiFamHexes = state.hexMap.filter(t => t.controllingFamily === fam && !t.isHeadquarters);
      const aiCapos = state.deployedUnits.filter(u => u.family === fam && u.type === 'capo');
      // AI builds safehouse if: 8+ territories, $5000+, has a capo, and doesn't already have one on their territory
      const aiHasSafehouse = state.safehouses.some(s => {
        const shTile = state.hexMap.find(t => t.q === s.q && t.r === s.r && t.s === s.s);
        return shTile && shTile.controllingFamily === fam;
      });
      if (aiFamHexes.length >= 8 && opponent.resources.money >= 5000 && aiCapos.length > 0 && !aiHasSafehouse) {
        // Pick a border hex (adjacent to enemy territory) with most friendly neighbors
        const borderHexes = aiFamHexes.filter(h => {
          const neighbors = getHexNeighbors(h.q, h.r, h.s);
          return neighbors.some(n => {
            const nt = state.hexMap.find(t => t.q === n.q && t.r === n.r && t.s === n.s);
            return nt && nt.controllingFamily !== fam && nt.controllingFamily !== null;
          });
        });
        if (borderHexes.length > 0) {
          // Score by friendly neighbors
          const scored = borderHexes.map(h => {
            const neighbors = getHexNeighbors(h.q, h.r, h.s);
            const friendlyCount = neighbors.filter(n => {
              const nt = state.hexMap.find(t => t.q === n.q && t.r === n.r && t.s === n.s);
              return nt && nt.controllingFamily === fam;
            }).length;
            return { hex: h, score: friendlyCount };
          }).sort((a, b) => b.score - a.score);
          const bestHex = scored[0].hex;
          state.safehouses.push({
            q: bestHex.q, r: bestHex.r, s: bestHex.s,
            turnsRemaining: SAFEHOUSE_DURATION,
            createdTurn: state.turn,
          });
          opponent.resources.money -= SAFEHOUSE_COST;
          if (turnReport) {
            const hasIntel = state.scoutedHexes.some(s => s.q === bestHex.q && s.r === bestHex.r && s.s === bestHex.s) ||
              (state.activeBribes || []).some(b => (b.tier === 'police_captain' || b.tier === 'police_chief' || b.tier === 'mayor') && b.active);
            if (hasIntel) {
              turnReport.aiActions.push({ family: fam, action: 'safehouse', detail: `Established a safehouse in ${bestHex.district}` });
            }
          }
        }
      }

      // ── AI PLAN HIT AGAINST PLAYER CAPOS ──
      const hasCeasefireWithPlayer = (state.ceasefires || []).some(p => p.family === fam && p.active);
      const hasAllianceWithPlayer = (state.alliances || []).some(p => p.alliedFamily === fam && p.active);
      if (hasCeasefireWithPlayer || hasAllianceWithPlayer) {
        // Skip plan hit — active pact with player
      } else if ((personality === 'aggressive' || personality === 'opportunistic') && Math.random() < AI_PLAN_HIT_CHANCE) {
        const playerCapos = state.deployedUnits.filter(u => u.family === state.playerFamily && u.type === 'capo');
        const alreadyTargeted = new Set((state.aiPlannedHits || []).map(h => h.targetUnitId));
        const availableTargets = playerCapos.filter(c => !alreadyTargeted.has(c.id));
        if (availableTargets.length > 0) {
          const target = availableTargets[Math.floor(Math.random() * availableTargets.length)];
          // Determine intel source for detection
          const targetUnit = state.deployedUnits.find(u => u.id === target.id);
          let detectedVia: import('@/types/game-mechanics').IntelSource | undefined;
          
          // Check bribe intel first (higher tier = better source)
          const activeBribes = (state.activeBribes || []).filter(b => b.active);
          const mayorBribe = activeBribes.find(b => b.tier === 'mayor');
          const chiefBribe = activeBribes.find(b => b.tier === 'police_chief');
          const captainBribe = activeBribes.find(b => b.tier === 'police_captain' && (b.targetFamily === fam || !b.targetFamily));
          
          if (mayorBribe) {
            detectedVia = 'bribe_mayor';
          } else if (chiefBribe) {
            detectedVia = 'bribe_chief';
          } else if (captainBribe) {
            detectedVia = 'bribe_captain';
          } else if (targetUnit && state.scoutedHexes.some(s => s.q === targetUnit.q && s.r === targetUnit.r && s.s === targetUnit.s)) {
            detectedVia = 'scout';
          }
          
          state.aiPlannedHits.push({
            family: fam,
            targetUnitId: target.id,
            turnsRemaining: AI_PLAN_HIT_DURATION,
            plannedOnTurn: state.turn,
            detectedVia,
            detectedOnTurn: detectedVia ? state.turn : undefined,
          });
          
          // Fire notification if detected
          if (detectedVia) {
            const sourceInfo = INTEL_SOURCE_LABELS[detectedVia];
            state.pendingNotifications.push({
              type: 'warning' as const,
              title: '🔫 Hit Planned Against You!',
              message: `${sourceInfo.flavorPrefix} the ${fam} family is planning a hit on your capo!`,
            });
            if (turnReport) {
              turnReport.aiActions.push({ family: fam, action: 'plan_hit', detail: `Planned a hit against a player capo` });
            }
          }
        }
      }

      // ── AI RESPECT & INFLUENCE GROWTH ──
      const aiTerritoryCount = state.hexMap.filter(t => t.controllingFamily === fam).length;
      // Influence: +1 per 3 hexes controlled, with decay
      const influenceGain = Math.floor(aiTerritoryCount / 3);
      opponent.resources.influence = Math.min(100, Math.max(0, opponent.resources.influence + influenceGain - 0.5));
      // Respect: grows with territory and combat activity
      const respectGain = Math.floor(aiTerritoryCount / 4) + (aggression > 60 ? 1 : 0);
      opponent.resources.respect = Math.min(100, Math.max(0, (opponent.resources.respect || 0) + respectGain - 0.5));

      // ── AI FLIP SOLDIER (weaken enemy HQ defenses) ──
      if (state.turn > 8 && opponent.resources.money >= FLIP_SOLDIER_COST && Math.random() < (personality === 'aggressive' ? 0.25 : personality === 'opportunistic' ? 0.20 : 0.12)) {
        // Find enemy HQs and look for soldiers near them to flip
        const otherFamilies = [state.playerFamily, ...state.aiOpponents.filter(o => o.family !== fam).map(o => o.family)];
        let flipped = false;
        for (const victimFamily of otherFamilies) {
          if ((state.eliminatedFamilies || []).includes(victimFamily)) continue;
          const victimHQ = state.headquarters[victimFamily as keyof typeof state.headquarters];
          if (!victimHQ) continue;
          const hqNeighbors = getHexNeighbors(victimHQ.q, victimHQ.r, victimHQ.s);
          // AI must have a unit adjacent to victim HQ
          const aiHasPresence = state.deployedUnits.some(u => u.family === fam && hqNeighbors.some(n => n.q === u.q && n.r === u.r && n.s === u.s));
          if (!aiHasPresence) continue;
          // Find flippable enemy soldiers near their own HQ
          const enemySoldiersNearHQ = state.deployedUnits.filter(u =>
            u.family === victimFamily && u.type === 'soldier' &&
            (u.q === victimHQ.q && u.r === victimHQ.r && u.s === victimHQ.s ||
             hqNeighbors.some(n => n.q === u.q && n.r === u.r && n.s === u.s))
          );
          const flippableTargets = enemySoldiersNearHQ.filter(u => {
            const uStats = state.soldierStats[u.id];
            return uStats && uStats.loyalty < 80 && !(state.flippedSoldiers || []).some(f => f.unitId === u.id);
          });
          if (flippableTargets.length === 0) continue;
          // Attempt flip
          const target = flippableTargets[Math.floor(Math.random() * flippableTargets.length)];
          const tStats = state.soldierStats[target.id];
          opponent.resources.money -= FLIP_SOLDIER_COST;
          let chance = FLIP_SOLDIER_BASE_CHANCE;
          if (tStats && tStats.loyalty < 60) chance += 0.15;
          if (tStats && tStats.loyalty > 70) chance -= 0.10;
          chance = Math.min(0.60, Math.max(0.05, chance));
          if (Math.random() < chance) {
            state.flippedSoldiers = [...(state.flippedSoldiers || []), { unitId: target.id, family: victimFamily, flippedByFamily: fam, hqQ: victimHQ.q, hqR: victimHQ.r, hqS: victimHQ.s }];
            if (victimFamily === state.playerFamily) {
              state.pendingNotifications.push({ type: 'warning', title: '🐀 Soldier Compromised!', message: `The ${fam} family has flipped one of your soldiers near HQ! Your HQ defense is weakened.` });
            }
            if (turnReport) turnReport.aiActions.push({ family: fam, action: 'flip_soldier', detail: `Flipped a ${victimFamily} soldier near their HQ` });
          } else {
            // Failed — AI loses influence
            opponent.resources.influence = Math.max(0, opponent.resources.influence - FLIP_SOLDIER_FAIL_INFLUENCE_LOSS);
            if (tStats) tStats.loyalty = Math.min(80, tStats.loyalty + 10);
            if (victimFamily === state.playerFamily) {
              state.pendingNotifications.push({ type: 'info', title: '🛡️ Flip Attempt Foiled', message: `The ${fam} family tried to turn one of your soldiers — but failed! Soldier loyalty increased.` });
            }
            if (turnReport) turnReport.aiActions.push({ family: fam, action: 'flip_soldier_fail', detail: `Failed to flip a ${victimFamily} soldier` });
          }
          flipped = true;
          break;
        }
      }

      // ── AI HQ ASSAULT (aggressive AI, after turn 12) ──
      if (state.turn > 12 && (personality === 'aggressive' || personality === 'unpredictable') && Math.random() < 0.10) {
        // Find enemy HQs adjacent to AI soldiers with high toughness
        const aiSoldiers = state.deployedUnits.filter(u => u.family === fam && u.type === 'soldier');
        for (const soldier of aiSoldiers) {
          const soldierS = state.soldierStats[soldier.id];
          if (!soldierS || soldierS.toughness < HQ_ASSAULT_MIN_TOUGHNESS || soldierS.loyalty < HQ_ASSAULT_MIN_LOYALTY) continue;
          const neighbors = getHexNeighbors(soldier.q, soldier.r, soldier.s);
          for (const n of neighbors) {
            const nTile = state.hexMap.find(t => t.q === n.q && t.r === n.r && t.s === n.s);
            if (!nTile || !nTile.isHeadquarters || nTile.isHeadquarters === fam) continue;
            const victimFamily = nTile.isHeadquarters;
            if ((state.eliminatedFamilies || []).includes(victimFamily)) continue;
            // Attempt assault
            let chance = HQ_ASSAULT_BASE_CHANCE - HQ_DEFENSE_BONUS;
            const adjFriendly = state.deployedUnits.filter(u => u.family === fam && u.id !== soldier.id && neighbors.some(nb => nb.q === u.q && nb.r === u.r && nb.s === u.s));
            chance += adjFriendly.length * 0.05;
            // Flipped soldier bonus
            const flippedCount = (state.flippedSoldiers || []).filter(f => f.family === victimFamily).length;
            chance += flippedCount * 0.10;
            chance = Math.min(HQ_ASSAULT_MAX_CHANCE, Math.max(0.05, chance));
            if (Math.random() < chance) {
              state.eliminatedFamilies = [...(state.eliminatedFamilies || []), victimFamily];
              state.deployedUnits = state.deployedUnits.filter(u => u.family !== victimFamily);
              state.hexMap.forEach(t => { if (t.controllingFamily === victimFamily && !t.isHeadquarters) t.controllingFamily = 'neutral' as any; });
              state.fortifiedHexes = (state.fortifiedHexes || []).filter(f => f.family !== victimFamily);
              state.aiOpponents = state.aiOpponents.filter(o => o.family !== victimFamily);
              opponent.resources.money += 25000;
              state.pendingNotifications.push({
                type: 'warning', title: `💀 ${victimFamily.charAt(0).toUpperCase() + victimFamily.slice(1)} Eliminated!`,
                message: `The ${fam} family destroyed the ${victimFamily} family's headquarters!`,
              });
              if (turnReport) turnReport.aiActions.push({ family: fam, action: 'assault_hq', detail: `Eliminated the ${victimFamily} family!` });
            } else {
              // Failure — soldier dies
              state.deployedUnits = state.deployedUnits.filter(u => u.id !== soldier.id);
              delete state.soldierStats[soldier.id];
              if (turnReport) turnReport.aiActions.push({ family: fam, action: 'assault_hq_fail', detail: `Failed HQ assault on ${victimFamily}` });
            }
            break; // Only one attempt per turn
          }
          break; // Only one soldier attempts per turn
        }
      }
    });

    // ── RE-CHECK UNDETECTED PLANNED HITS FOR NEW INTEL ──
    if (state.aiPlannedHits && state.aiPlannedHits.length > 0) {
      const activeBribes = (state.activeBribes || []).filter(b => b.active);
      for (const hit of state.aiPlannedHits) {
        if (hit.detectedVia) continue; // already detected
        
        const targetUnit = state.deployedUnits.find(u => u.id === hit.targetUnitId);
        let detectedVia: IntelSource | undefined;
        
        if (activeBribes.find(b => b.tier === 'mayor')) {
          detectedVia = 'bribe_mayor';
        } else if (activeBribes.find(b => b.tier === 'police_chief')) {
          detectedVia = 'bribe_chief';
        } else if (activeBribes.find(b => b.tier === 'police_captain' && (b.targetFamily === hit.family || !b.targetFamily))) {
          detectedVia = 'bribe_captain';
        } else if (targetUnit && state.scoutedHexes.some(s => s.q === targetUnit.q && s.r === targetUnit.r && s.s === targetUnit.s)) {
          detectedVia = 'scout';
        }
        
        if (detectedVia) {
          hit.detectedVia = detectedVia;
          hit.detectedOnTurn = state.turn;
          const sourceInfo = INTEL_SOURCE_LABELS[detectedVia];
          state.pendingNotifications.push({
            type: 'warning' as const,
            title: '🔫 Hit Intel Discovered!',
            message: `${sourceInfo.flavorPrefix} the ${hit.family} family has a hit planned on your capo!`,
          });
        }
      }
    }

    // ── EXECUTE PENDING AI PLANNED HITS ──
    if (state.aiPlannedHits && state.aiPlannedHits.length > 0) {
      const remaining: typeof state.aiPlannedHits = [];
      for (const hit of state.aiPlannedHits) {
        hit.turnsRemaining -= 1;
        if (hit.turnsRemaining <= 0) {
          // Safety net: check if pact is now active (formed after hit was planned)
          const hitCeasefire = (state.ceasefires || []).some(p => p.family === hit.family && p.active);
          const hitAlliance = (state.alliances || []).some(p => p.alliedFamily === hit.family && p.active);
          if (hitCeasefire || hitAlliance) {
            const pactType = hitCeasefire ? 'ceasefire' : 'alliance';
            state.pendingNotifications.push({
              type: 'info' as const,
              title: '🕊️ Hit Called Off',
              message: `The ${hit.family} family stood down from a planned hit — ${pactType} in effect.`,
            });
            continue; // skip execution, don't keep
          }

          // Execute the hit
          const targetUnit = state.deployedUnits.find(u => u.id === hit.targetUnitId);
          if (targetUnit) {
            if (Math.random() < AI_PLAN_HIT_SUCCESS_RATE) {
              // Success — capo is killed
              const idx = state.deployedUnits.indexOf(targetUnit);
              if (idx !== -1) state.deployedUnits.splice(idx, 1);
              state.pendingNotifications.push({
                type: 'error' as const,
                title: '💀 Capo Assassinated!',
                message: `The ${hit.family} family executed a planned hit on your capo! They have been eliminated.`,
              });
              if (turnReport) turnReport.aiActions.push({ family: hit.family, action: 'assassination', detail: 'Successfully assassinated a player capo' });
            } else {
              // Failed — capo survives
              state.pendingNotifications.push({
                type: 'warning' as const,
                title: '🔫 Assassination Foiled!',
                message: `The ${hit.family} family attempted a planned hit on your capo, but the attempt was foiled!`,
              });
              if (turnReport) turnReport.aiActions.push({ family: hit.family, action: 'assassination_failed', detail: 'Failed assassination attempt on player capo' });
            }
          } else {
            // Target unit gone — notify player
            state.pendingNotifications.push({
              type: 'info' as const,
              title: '🔫 Hit Abandoned',
              message: `The ${hit.family} family abandoned a planned hit — the target could not be found.`,
            });
          }
          // Hit executed or target gone — don't keep
        } else {
          remaining.push(hit);
        }
      }
      state.aiPlannedHits = remaining;
    }
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
    const diffMods = state.difficultyModifiers || DIFFICULTY_MODIFIERS.normal;
    const costMult = diffMods.eventCostMult;

    if (Math.random() < 0.45) {
      const heat = state.policeHeat.level;
      const respect = state.reputation.respect;
      const money = state.resources.money;
      const eligibleEvents: GameEvent[] = [];

      // 1. Police Raid (always)
      eligibleEvents.push({
        id: `event-${Date.now()}-raid`, type: 'random' as const,
        title: 'Police Raid',
        description: 'The police are planning a raid on your operations.',
        choices: [
          { id: 'bribe', text: `Bribe officers ($${Math.floor(10000 * costMult).toLocaleString()})`, consequences: [{ type: 'money' as const, value: -Math.floor(10000 * costMult), description: 'Bribe' },{ type: 'heat' as const, value: -15, description: 'Reduced heat' }] },
          { id: 'hide', text: 'Hide evidence', consequences: [{ type: 'heat' as const, value: -5, description: 'Partial heat reduction' }] },
          { id: 'fight', text: 'Stand ground', consequences: [{ type: 'heat' as const, value: 20, description: 'Increased heat' },{ type: 'reputation' as const, value: 10, description: 'Gained respect' }] },
        ],
        consequences: [], turn: state.turn, expires: state.turn + 2,
      });

      // 2. Rival Meeting (always)
      eligibleEvents.push({
        id: `event-${Date.now()}-rival`, type: 'random' as const,
        title: 'Rival Meeting',
        description: 'A rival family wants to discuss territory boundaries.',
        choices: [
          { id: 'negotiate', text: 'Negotiate peacefully', consequences: [{ type: 'reputation' as const, value: 5, description: 'Gained rep' }] },
          { id: 'threaten', text: 'Make threats', consequences: [{ type: 'reputation' as const, value: 15, description: 'Fear' },{ type: 'relationship' as const, value: -20, description: 'Damaged relations' }] },
        ],
        consequences: [], turn: state.turn, expires: state.turn + 1,
      });

      // 3. Informant Tip
      eligibleEvents.push({
        id: `event-${Date.now()}-informant`, type: 'random' as const,
        title: 'Informant Tip',
        description: 'A street contact offers to reveal enemy positions.',
        choices: [
          { id: 'pay', text: `Pay ($${Math.floor(5000 * costMult).toLocaleString()})`, consequences: [{ type: 'money' as const, value: -Math.floor(5000 * costMult), description: 'Intel cost' },{ type: 'reputation' as const, value: 3, description: 'Better intel' }] },
          { id: 'ignore', text: 'Ignore the tip', consequences: [] },
        ],
        consequences: [], turn: state.turn, expires: state.turn + 1,
      });

      // 4. Weapons Shipment (money > 10k)
      if (money > 10000) {
        eligibleEvents.push({
          id: `event-${Date.now()}-weapons`, type: 'random' as const,
          title: 'Weapons Shipment',
          description: 'Military-grade weapons available on the black market.',
          choices: [
            { id: 'buy', text: `Buy ($${Math.floor(8000 * costMult).toLocaleString()})`, consequences: [{ type: 'money' as const, value: -Math.floor(8000 * costMult), description: 'Weapons' },{ type: 'reputation' as const, value: 5, description: 'Combat ready' },{ type: 'heat' as const, value: 10, description: 'Arms dealing' }] },
            { id: 'sell', text: `Sell info ($${Math.floor(4000 * costMult).toLocaleString()})`, consequences: [{ type: 'money' as const, value: Math.floor(4000 * costMult), description: 'Info sale' }] },
          ],
          consequences: [], turn: state.turn, expires: state.turn + 1,
        });
      }

      // 5. Political Scandal (influence > 5)
      if (state.resources.influence > 5) {
        eligibleEvents.push({
          id: `event-${Date.now()}-scandal`, type: 'random' as const,
          title: 'Political Scandal',
          description: 'A city councilman caught in a scandal. You can exploit this.',
          choices: [
            { id: 'bribe', text: `Bribe politician ($${Math.floor(12000 * costMult).toLocaleString()})`, consequences: [{ type: 'money' as const, value: -Math.floor(12000 * costMult), description: 'Bribe' },{ type: 'heat' as const, value: -20, description: 'Political cover' }] },
            { id: 'exploit', text: 'Exploit publicly', consequences: [{ type: 'reputation' as const, value: 10, description: 'Public standing' },{ type: 'heat' as const, value: 15, description: 'Scrutiny' }] },
          ],
          consequences: [], turn: state.turn, expires: state.turn + 2,
        });
      }

      // 6. Internal Betrayal — loyalty-gated
      {
        const playerSoldiers = state.deployedUnits.filter(u => u.family === state.playerFamily && u.type === 'soldier');
        const lowLoyaltySoldier = playerSoldiers.find(u => {
          const stats = state.soldierStats[u.id];
          return stats && stats.loyalty < 40;
        });
        if (lowLoyaltySoldier) {
          const soldierName = lowLoyaltySoldier.id.slice(-6);
          eligibleEvents.push({
            id: `event-${Date.now()}-betrayal`, type: 'random' as const,
            title: 'Internal Betrayal',
            description: `Soldier ${soldierName} (loyalty: ${state.soldierStats[lowLoyaltySoldier.id]?.loyalty ?? '?'}) is showing signs of disloyalty. Word on the street says he's talking to the other side.`,
            choices: [
              { id: 'confront', text: 'Confront & dismiss the soldier', consequences: [{ type: 'soldiers' as const, value: -1, description: 'Soldier removed' }] },
              { id: 'promote', text: `Offer a promotion ($${Math.floor(5000 * costMult).toLocaleString()})`, cost: Math.floor(5000 * costMult), consequences: [{ type: 'money' as const, value: -Math.floor(5000 * costMult), description: 'Promotion cost' }] },
              { id: 'ignore', text: 'Ignore it', consequences: [{ type: 'reputation' as const, value: -3, description: 'Potential defection risk' }] },
            ],
            consequences: [], turn: state.turn, expires: state.turn + 1,
            // Store the target soldier ID in the event for resolution
            requirements: { money: 0, soldiers: 0, reputation: 0, territory: [lowLoyaltySoldier.id] },
          });
        }
      }

      // 7. Rat in the Ranks / Federal Investigation — escalating event
      if (heat > 30 && !state.ratIgnored) {
        // Stage 1: Rat in the Ranks
        eligibleEvents.push({
          id: `event-${Date.now()}-rat`, type: 'random' as const,
          title: 'Rat in the Ranks',
          description: 'Someone in your crew is feeding info to the cops. Deal with it now or face consequences later.',
          choices: [
            { id: 'find', text: `Find the rat ($${Math.floor(3000 * costMult).toLocaleString()})`, consequences: [{ type: 'money' as const, value: -Math.floor(3000 * costMult), description: 'Investigation' },{ type: 'heat' as const, value: -10, description: 'Leak plugged' }] },
            { id: 'ignore', text: 'Ignore it', consequences: [{ type: 'heat' as const, value: 15, description: 'Info leaked to feds' }] },
          ],
          consequences: [], turn: state.turn, expires: state.turn + 1,
        });
      }
      if (heat > 60 && state.ratIgnored) {
        // Stage 2: Federal Investigation (escalated from ignored rat)
        eligibleEvents.push({
          id: `event-${Date.now()}-federal`, type: 'random' as const,
          title: 'Federal Investigation',
          description: 'The rat you ignored led the FBI straight to your operations. A federal case has been opened.',
          choices: [
            { id: 'pay', text: `Pay off ($${Math.floor(15000 * costMult).toLocaleString()})`, consequences: [{ type: 'money' as const, value: -Math.floor(15000 * costMult), description: 'Federal payoff' },{ type: 'heat' as const, value: -25, description: 'Investigation derailed' }] },
            { id: 'risk', text: 'Take the risk', consequences: [{ type: 'heat' as const, value: 15, description: 'Investigation intensifies' }] },
          ],
          consequences: [], turn: state.turn, expires: state.turn + 1,
        });
      } else if (heat > 60 && !state.ratIgnored) {
        // Independent Federal Investigation (lower weight — only added if no rat escalation)
        if (Math.random() < 0.3) {
          eligibleEvents.push({
            id: `event-${Date.now()}-federal`, type: 'random' as const,
            title: 'Federal Investigation',
            description: 'The FBI has opened an investigation into your operations.',
            choices: [
              { id: 'pay', text: `Pay off ($${Math.floor(15000 * costMult).toLocaleString()})`, consequences: [{ type: 'money' as const, value: -Math.floor(15000 * costMult), description: 'Payoff' },{ type: 'heat' as const, value: -25, description: 'Investigation stalled' }] },
              { id: 'risk', text: 'Take the risk', consequences: [{ type: 'heat' as const, value: 15, description: 'Investigation intensifies' }] },
            ],
            consequences: [], turn: state.turn, expires: state.turn + 1,
          });
        }
      }

      // Pick one random event
      if (eligibleEvents.length > 0) {
        const chosen = eligibleEvents[Math.floor(Math.random() * eligibleEvents.length)];
        state.events = [...state.events, chosen];
      }
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
      const newState = cloneStateForMutation(prev);
      // Defensive guards for arrays
      newState.hitmanContracts = newState.hitmanContracts || [];
      newState.activeBribes = newState.activeBribes || [];
      newState.alliances = newState.alliances || [];
      newState.ceasefires = newState.ceasefires || [];
      newState.pendingNotifications = newState.pendingNotifications || [];
      newState.deployedUnits = newState.deployedUnits || [];
      newState.policeHeat = newState.policeHeat || { level: 0, reductionPerTurn: 2, bribedOfficials: [], arrests: [], rattingRisk: 5 };
      newState.policeHeat.arrests = newState.policeHeat.arrests || [];
      newState.policeHeat.bribedOfficials = newState.policeHeat.bribedOfficials || [];
      newState.events = newState.events || [];
      newState.businesses = newState.businesses || [];
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
        case 'execute_planned_hit': {
          // Execute a planned hit — follows the target to their current location
          if (!newState.plannedHit) {
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'warning' as const, title: '⚠️ No Plan Active',
              message: 'There is no planned hit to execute.',
            }];
            return newState;
          }
          const planTarget = newState.deployedUnits.find(u => u.id === newState.plannedHit!.targetUnitId);
          if (!planTarget) {
            // Target is gone (dead/removed) — apply failure penalties
            if (newState.resources.respect >= newState.reputation.fear) {
              syncRespect(newState, Math.max(0, newState.resources.respect - PLAN_HIT_FAIL_REPUTATION));
            } else {
              newState.reputation.fear = Math.max(0, newState.reputation.fear - PLAN_HIT_FAIL_REPUTATION);
            }
            const goneStats = newState.soldierStats[newState.plannedHit.plannerUnitId];
            if (goneStats) {
              goneStats.loyalty = Math.max(0, goneStats.loyalty - PLAN_HIT_FAIL_LOYALTY);
            }
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'error' as const, title: '🎯 Target Eliminated',
              message: `The target is no longer on the map — plan wasted. -${PLAN_HIT_FAIL_REPUTATION} reputation, planner morale shaken.`,
            }];
            newState.plannedHit = null;
            newState.actionsRemaining = Math.max(0, newState.actionsRemaining - 1);
            return newState;
          }
          // Target exists — redirect hit to their current hex
          const redirectAction = {
            ...action,
            type: 'hit_territory',
            targetQ: planTarget.q,
            targetR: planTarget.r,
            targetS: planTarget.s,
            _executingPlan: true, // flag so processTerritoryHit knows
          };
          const result = processTerritoryHit(newState, redirectAction);
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
        case 'plan_hit': {
          // Tactical phase action — costs 1 tactical action
          if (newState.turnPhase !== 'move') {
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'warning' as const, title: '⚠️ Wrong Phase',
              message: 'Plan Hit is only available during the Tactical phase.',
            }];
            return newState;
          }
          if (newState.tacticalActionsRemaining <= 0) {
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'warning' as const, title: '⚠️ No Tactical Actions',
              message: 'You have no tactical actions remaining.',
            }];
            return newState;
          }
          // Check cooldown
          if (newState.turn < (newState.planHitCooldownUntil || 0)) {
            const turnsLeft = (newState.planHitCooldownUntil || 0) - newState.turn;
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'warning' as const, title: '⏳ Plan Hit Cooldown',
              message: `Your crew needs to regroup. Plan Hit available in ${turnsLeft} turn${turnsLeft !== 1 ? 's' : ''}.`,
            }];
            return newState;
          }
          // Validate planner soldier
          const plannerUnitId = action.plannerUnitId;
          const plannerUnit = newState.deployedUnits.find(u => u.id === plannerUnitId && u.family === newState.playerFamily);
          if (!plannerUnit) {
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'warning' as const, title: '⚠️ No Planner Selected',
              message: 'Select one of your soldiers to plan the hit.',
            }];
            return newState;
          }
          // Validate target unit
          const targetUnitId = action.targetUnitId;
          const targetUnit = newState.deployedUnits.find(u => u.id === targetUnitId);
          if (!targetUnit || targetUnit.family === newState.playerFamily) {
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'warning' as const, title: '⚠️ Invalid Target Unit',
              message: 'Select an enemy unit on a scouted hex.',
            }];
            return newState;
          }
          const phQ = targetUnit.q;
          const phR = targetUnit.r;
          const phS = targetUnit.s;
          const phTile = newState.hexMap.find(t => t.q === phQ && t.r === phR && t.s === phS);
          if (!phTile || phTile.controllingFamily === newState.playerFamily || phTile.controllingFamily === 'neutral') {
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'warning' as const, title: '⚠️ Invalid Target',
              message: 'Plan Hit requires an enemy-controlled hex.',
            }];
            return newState;
          }
          // Validate hex is scouted
          const phScouted = newState.scoutedHexes.some(s => s.q === phQ && s.r === phR && s.s === phS);
          if (!phScouted) {
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'warning' as const, title: '⚠️ Intel Required',
              message: 'You must scout a hex before planning a hit on it.',
            }];
            return newState;
          }
          newState.plannedHit = {
            q: phQ, r: phR, s: phS,
            targetFamily: phTile.controllingFamily,
            targetUnitId,
            plannerUnitId,
            plannedOnTurn: newState.turn,
            expiresOnTurn: newState.turn + PLAN_HIT_DURATION,
          };
          newState.tacticalActionsRemaining -= 1;
          newState.selectedUnitId = null;
          newState.availableMoveHexes = [];
          const targetName = targetUnit.name || targetUnit.id.split('-').slice(-2).join(' ');
          const plannerName = plannerUnit.name || plannerUnit.id.split('-').slice(-2).join(' ');
          newState.pendingNotifications = [...newState.pendingNotifications, {
            type: 'success' as const, title: '🎯 Hit Planned',
            message: `${plannerName} is planning a hit on ${targetName}. +${PLAN_HIT_BONUS}% bonus if target stays put. Execute within ${PLAN_HIT_DURATION} turns.`,
          }];
          return newState;
        }
        case 'recruit_soldiers': {
          // Buy Mercenary — expensive, combat-ready, hurts loyalty
          if (newState.tacticalActionsRemaining <= 0) return newState;
          const respectDiscount = (newState.reputation.respect / 100) * 0.3;
          const cost = Math.floor(SOLDIER_COST * (1 - discount) * (1 - respectDiscount));
          // District control bonus: Bronx -$500 recruit discount
          const bronxDiscount = hasPlayerDistrictBonus(newState, 'recruit_discount') ? 500 : 0;
          const finalCost = Math.max(100, cost - bronxDiscount);
          if (newState.resources.money >= finalCost) {
            newState.resources.money -= finalCost;
            newState.resources.soldiers += 1;
            newState.tacticalActionsRemaining -= 1;
            // Mercenary loyalty penalty
            newState.reputation.loyalty = Math.max(0, newState.reputation.loyalty - 10);
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
                hits: 0, extortions: 0, victories: 0, toughness: 0, racketeering: 0, turnsDeployed: 0, toughnessProgress: 0,
              };
            }
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'info' as const,
              title: '💰 Mercenary Hired',
              message: `A hired gun joins the family for $${finalCost.toLocaleString()}. Loyalty -3 (outsider).${bronxDiscount > 0 ? ' (Bronx discount applied)' : ''}${respectDiscount > 0.01 ? ` Respect saved $${(Math.floor(SOLDIER_COST * (1 - discount)) - cost).toLocaleString()}.` : ''}`,
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
          const bronxDiscount2 = hasPlayerDistrictBonus(newState, 'recruit_discount') ? 500 : 0;
          const finalCost2 = Math.max(100, cost2 - bronxDiscount2);
          if (newState.resources.money >= finalCost2) {
            newState.resources.money -= finalCost2;
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
                hits: 0, extortions: 0, victories: 0, toughness: 0, racketeering: 0, turnsDeployed: 0, toughnessProgress: 0,
              };
            }
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'success' as const,
              title: '🏘️ Local Recruited',
              message: `A loyal local joins the family for $${finalCost2.toLocaleString()}. Loyalty +2.${bronxDiscount2 > 0 ? ' (Bronx discount applied)' : ''}`,
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
          
          // Hitman contracts targeting this unit are handled at end-of-turn resolution
          
          newState.pendingNotifications = [...(newState.pendingNotifications || []), {
            type: 'success' as const,
            title: '⭐ Soldier Promoted to Capo!',
            message: `${capoName} (${personalityLabel}) now commands 3 moves per turn and can extort, escort, and negotiate.`,
          }];
          
          return newState;
        }
        case 'deselect_unit':
          return { ...newState, selectedUnitId: null, availableMoveHexes: [], deployMode: null, availableDeployHexes: [] };
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
        case 'hire_hitman': {
          const targetUnitId = action.targetUnitId as string;
          const targetFamily = action.targetFamily as string;
          if ((newState.hitmanContracts || []).length >= MAX_HITMEN) return newState;
          if (newState.resources.money < HITMAN_CONTRACT_COST) return newState;
          
          // Check target exists
          const targetUnit = newState.deployedUnits.find(u => u.id === targetUnitId && u.family === targetFamily);
          if (!targetUnit) return newState;
          
          // Determine duration based on target's current location
          const targetHex = newState.hexMap.find(t => t.q === targetUnit.q && t.r === targetUnit.r && t.s === targetUnit.s);
          const isAtHQ = targetHex?.isHeadquarters === targetUnit.family;
          const isAtSafehouse = newState.safehouses.some(s => targetUnit.q === s.q && targetUnit.r === s.r && targetUnit.s === s.s);
          const isFortified = isHexFortified(newState.fortifiedHexes || [], targetUnit.q, targetUnit.r, targetUnit.s, targetUnit.family);
          
          let duration = HITMAN_OPEN_TURNS;
          if (isAtHQ) duration = HITMAN_HQ_TURNS;
          else if (isAtSafehouse) duration = HITMAN_SAFEHOUSE_TURNS;
          else if (isFortified) duration = HITMAN_FORTIFIED_TURNS;
          
          newState.resources.money -= HITMAN_CONTRACT_COST;
          newState.hitmanContracts = [...(newState.hitmanContracts || []), {
            id: `hitman-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
            targetUnitId,
            targetFamily,
            turnsRemaining: duration,
            hiredOnTurn: newState.turn,
            cost: HITMAN_CONTRACT_COST,
          }];
          newState.pendingNotifications = [...newState.pendingNotifications, {
            type: 'info' as const, title: '🎯 Hitman Contracted',
            message: `A contract killer has been hired for $${HITMAN_CONTRACT_COST.toLocaleString()}. ETA: ${duration} turns.`,
          }];
          return newState;
        }
        case 'charitable_donation':
          if (newState.resources.money >= 5000 && newState.actionsRemaining > 0) {
            newState.resources.money -= 5000;
            const repGainCD = 3 * (1 + bonuses.reputationGain / 100);
            newState.reputation.reputation += repGainCD;
            newState.policeHeat.level = Math.max(0, newState.policeHeat.level - 10);
            newState.actionsRemaining -= 1;
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'info' as const, title: '🤝 Charitable Donation',
              message: `Donated $5,000. Heat −10, Reputation +${repGainCD.toFixed(0)}.`,
            }];
          }
          return newState;
        case 'public_appearance':
          if (newState.resources.money >= 3000 && newState.actionsRemaining > 0) {
            newState.resources.money -= 3000;
            const repGainPA = 2 * (1 + bonuses.reputationGain / 100);
            newState.reputation.reputation += repGainPA;
            newState.policeHeat.level = Math.max(0, newState.policeHeat.level - 5);
            newState.actionsRemaining -= 1;
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'info' as const, title: '👑 Public Appearance',
              message: `Spent $3,000. Heat −5, Reputation +${repGainPA.toFixed(0)}.`,
            }];
          }
          return newState;
        case 'hire_lawyer': {
          const lawyerCost = 8000;
          const lawyerCooldown = 3;
          const lastLawyerTurn = newState.lastLawyerTurn || 0;
          const turnsSinceLawyer = newState.turn - lastLawyerTurn;
          if (newState.resources.money >= lawyerCost && newState.actionsRemaining > 0 && turnsSinceLawyer >= lawyerCooldown) {
            newState.resources.money -= lawyerCost;
            newState.actionsRemaining -= 1;
            newState.lastLawyerTurn = newState.turn;
            newState.lawyerActiveUntil = newState.turn + 3;
            
            // Reduce all active arrest sentences by 25%
            newState.policeHeat.arrests = newState.policeHeat.arrests.map(a => {
              if (newState.turn - a.turn < a.sentence) {
                return { ...a, sentence: Math.max(1, Math.floor(a.sentence * 0.75)) };
              }
              return a;
            });
            // Also reduce arrested soldiers/capos return times by 25%
            newState.arrestedSoldiers = (newState.arrestedSoldiers || []).map(a => ({
              ...a,
              returnTurn: Math.max(newState.turn + 1, newState.turn + Math.max(1, Math.floor((a.returnTurn - newState.turn) * 0.75))),
            }));
            newState.arrestedCapos = (newState.arrestedCapos || []).map(a => ({
              ...a,
              returnTurn: Math.max(newState.turn + 1, newState.turn + Math.max(1, Math.floor((a.returnTurn - newState.turn) * 0.75))),
            }));
            
            // Remove first active arrest if any, otherwise just reduce heat
            const activeArrests = newState.policeHeat.arrests.filter(a => newState.turn - a.turn < a.sentence);
            if (activeArrests.length > 0) {
              const cleared = activeArrests[0];
              newState.policeHeat.arrests = newState.policeHeat.arrests.filter(a => a.id !== cleared.id);
              newState.policeHeat.level = Math.max(0, newState.policeHeat.level - 3);
              newState.pendingNotifications = [...newState.pendingNotifications, {
                type: 'info' as const, title: '⚖️ Lawyer Hired',
                message: `Cleared arrest of ${cleared.target}. All sentences reduced 25% for 3 turns. Heat −3.`,
              }];
            } else {
              newState.policeHeat.level = Math.max(0, newState.policeHeat.level - 3);
              newState.pendingNotifications = [...newState.pendingNotifications, {
                type: 'info' as const, title: '⚖️ Lawyer Retained',
                message: `No active arrests to clear. Sentences −25% for 3 turns. Heat −3.`,
              }];
            }
          }
          return newState;
        }
        case 'build_business': {
          // Enter placement mode — player must click a valid hex on the map
          const businessDefs: Record<string, { cost: number; income: number; launderingCapacity: number; icon: string }> = {
            restaurant: { cost: 20000, income: 3000, launderingCapacity: 2000, icon: '🍝' },
            store: { cost: 12000, income: 1800, launderingCapacity: 1500, icon: '🏪' },
            construction: { cost: 35000, income: 5000, launderingCapacity: 4000, icon: '🏗️' },
          };
          const def = businessDefs[action.businessType];
          if (!def) return newState;
          if (newState.resources.money < def.cost) {
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'warning' as const, title: '💰 Not Enough Money',
              message: `You need $${def.cost.toLocaleString()} to build a ${action.businessType}.`,
            }];
            return newState;
          }
          // Check action tokens for legal businesses
          if (newState.actionsRemaining <= 0) {
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'warning' as const, title: '⚠️ No Actions Remaining',
              message: 'You need at least 1 action token to build a business.',
            }];
            return newState;
          }
          // Check that at least one valid hex exists (with Capo for legal)
          const validHexes = newState.hexMap.filter((t: HexTile) => 
            t.controllingFamily === newState.playerFamily && !t.business && !t.isHeadquarters
          );
          const hexesWithCapo = validHexes.filter((t: HexTile) => 
            newState.deployedUnits.some((u: DeployedUnit) => u.type === 'capo' && u.family === newState.playerFamily && u.q === t.q && u.r === t.r && u.s === t.s)
          );
          if (hexesWithCapo.length === 0) {
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'warning' as const, title: '👔 No Capo Available',
              message: 'A Capo must be on an empty owned hex to build a legal business.',
            }];
            return newState;
          }
          // Set pending build — player must click a hex
          newState.pendingBusinessBuild = { businessType: action.businessType, cost: def.cost, isLegal: true };
          newState.pendingNotifications = [...newState.pendingNotifications, {
            type: 'info' as const, title: '📍 Select Hex',
            message: `Click a hex with a Capo to build ${action.businessType}. Costs 1 action.`,
          }];
          return newState;
        }
        case 'place_business_on_hex': {
          // Place a pending business on the selected hex
          const pending = newState.pendingBusinessBuild;
          if (!pending) return newState;
          const targetTile = newState.hexMap.find((t: HexTile) => t.q === action.targetQ && t.r === action.targetR && t.s === action.targetS);
          if (!targetTile || targetTile.controllingFamily !== newState.playerFamily) {
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'warning' as const, title: '🚫 Invalid Location',
              message: 'Select one of your territories.',
            }];
            return newState;
          }
          if (targetTile.business || targetTile.isHeadquarters) {
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'warning' as const, title: '🚫 Hex Occupied',
              message: 'This territory already has a business or headquarters.',
            }];
            return newState;
          }
          // Legal business: require Capo on hex + 1 action token
          if (pending.isLegal) {
            const hasCapo = newState.deployedUnits.some((u: DeployedUnit) => u.type === 'capo' && u.family === newState.playerFamily && u.q === targetTile.q && u.r === targetTile.r && u.s === targetTile.s);
            if (!hasCapo) {
              newState.pendingNotifications = [...newState.pendingNotifications, {
                type: 'warning' as const, title: '👔 Capo Required',
                message: 'A Capo must be on this hex to build a legal business.',
              }];
              return newState;
            }
            if (newState.actionsRemaining <= 0) {
              newState.pendingNotifications = [...newState.pendingNotifications, {
                type: 'warning' as const, title: '⚠️ No Actions Remaining',
                message: 'You need at least 1 action token to build a legal business.',
              }];
              return newState;
            }
            newState.actionsRemaining = Math.max(0, newState.actionsRemaining - 1);
          }
          const allDefs: Record<string, { income: number; launderingCapacity: number }> = {
            restaurant: { income: 3000, launderingCapacity: 2000 },
            store: { income: 1800, launderingCapacity: 1500 },
            construction: { income: 5000, launderingCapacity: 4000 },
          };
          const bDef = allDefs[pending.businessType] || { income: 2000, launderingCapacity: 1000 };
          newState.resources.money -= pending.cost;
          targetTile.business = {
            type: pending.businessType,
            income: 0,
            isLegal: pending.isLegal,
            heatLevel: 0,
            launderingCapacity: 0,
            constructionProgress: 0,
            constructionGoal: 3,
          };
          newState.pendingBusinessBuild = null;
          newState.pendingNotifications = [...newState.pendingNotifications, {
            type: 'success' as const, title: '🚧 Construction Started',
            message: `Building ${pending.businessType} for $${pending.cost.toLocaleString()}. Keep a Capo on hex for faster construction! (1 action used)`,
          }];
          return newState;
        }
        case 'cancel_business_placement': {
          newState.pendingBusinessBuild = null;
          return newState;
        }
        case 'negotiate': {
          const result = processNegotiation(newState, action);
          result.actionsRemaining = Math.max(0, result.actionsRemaining - 1);
          return result;
        }
        case 'boss_negotiate': {
          const result = processNegotiation(newState, { ...action, isBossNegotiation: true });
          result.actionsRemaining = Math.max(0, result.actionsRemaining - 1);
          return result;
        }
        case 'assault_hq': {
          const result = processHQAssault(newState, action);
          result.actionsRemaining = Math.max(0, result.actionsRemaining - 1);
          return result;
        }
        case 'flip_soldier': {
          const result = processFlipSoldier(newState, action);
          result.actionsRemaining = Math.max(0, result.actionsRemaining - 1);
          return result;
        }
        case 'call_sitdown': {
          // Boss action — does NOT consume action budget
          const hq = newState.headquarters[newState.playerFamily];
          if (!hq) return newState;
          if (newState.turnPhase !== 'action') {
            newState.pendingNotifications.push({ type: 'error', title: 'Wrong Phase', message: 'Sitdown can only be called during the Action phase.' });
            return newState;
          }
          if (newState.sitdownCooldownUntil > newState.turn) {
            newState.pendingNotifications.push({ type: 'error', title: 'Cooldown', message: `Sitdown available in ${newState.sitdownCooldownUntil - newState.turn} turns.` });
            return newState;
          }
          if (newState.resources.money < SITDOWN_COST) {
            newState.pendingNotifications.push({ type: 'error', title: 'Not Enough Money', message: `Sitdown costs $${SITDOWN_COST.toLocaleString()}.` });
            return newState;
          }
          const soldierIds: string[] = action.soldierIds || [];
          if (soldierIds.length === 0) {
            newState.pendingNotifications.push({ type: 'error', title: 'No Soldiers Selected', message: 'Select at least one soldier to recall.' });
            return newState;
          }
          let recalled = 0;
          for (const sid of soldierIds) {
            const unit = newState.deployedUnits.find(u => u.id === sid && u.family === newState.playerFamily);
            if (!unit) continue;
            if (unit.q === hq.q && unit.r === hq.r && unit.s === hq.s) continue; // already at HQ
            unit.q = hq.q;
            unit.r = hq.r;
            unit.s = hq.s;
            unit.movesRemaining = 0;
            // (hex fortification stays on the hex, unit just moves to HQ)
            // Loyalty bonus
            const stats = newState.soldierStats[sid];
            if (stats) {
              const cap = unit.type === 'capo' ? 99 : 80;
              stats.loyalty = Math.min(cap, stats.loyalty + SITDOWN_LOYALTY_BONUS);
            }
            recalled++;
          }
          if (recalled === 0) {
            newState.pendingNotifications.push({ type: 'warning', title: 'No Units Moved', message: 'Selected soldiers are already at HQ.' });
            return newState;
          }
          newState.resources.money -= SITDOWN_COST;
          newState.sitdownCooldownUntil = newState.turn + SITDOWN_COOLDOWN;
          newState.pendingNotifications.push({
            type: 'success',
            title: '📋 Sitdown Called',
            message: `${recalled} unit(s) recalled to HQ. +${SITDOWN_LOYALTY_BONUS} loyalty each. HQ defense strengthened.`,
          });
          return newState;
        }
        default:
          return newState;
      }
    });
  }, []);

  const performBusinessAction = useCallback((action: any) => {
    setGameState(prev => {
      const newState = cloneStateForMutation(prev);
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
          // Legacy business building removed — use hex-based build_business action instead
          newState.pendingNotifications = [...newState.pendingNotifications, {
            type: 'warning' as const, title: '🏢 Use Map to Build',
            message: 'Use the Build Business action on claimed territory instead.',
          }];
          break;

        case 'upgrade':
        case 'extort':
        case 'collect':
          // Legacy business actions removed — hex-based system handles these
          break;

        case 'launder': {
          // Laundering: convert dirty money to clean via legal hex businesses
          const legalHexBusinesses = Object.values(newState.hexMap).filter(
            (t: any) => t.controllingFamily === newState.playerFamily && t.business?.isLegal
          );
          const totalLaunderingCapacity = legalHexBusinesses.reduce(
            (sum: number, t: any) => sum + Math.floor((t.business?.income || 0) * 0.5), 0
          );
          const amountToLaunder = Math.min(newState.finances.dirtyMoney, totalLaunderingCapacity);
          if (amountToLaunder > 0) {
            newState.finances.dirtyMoney -= amountToLaunder;
            newState.finances.cleanMoney += amountToLaunder;
            // Do NOT add to resources.money — income already added by processEconomy
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'success' as const, title: '🧺 Money Laundered',
              message: `$${amountToLaunder.toLocaleString()} has been cleaned through your legal businesses.`,
            }];
          } else {
            newState.pendingNotifications = [...newState.pendingNotifications, {
              type: 'warning' as const, title: '🧺 Nothing to Launder',
              message: totalLaunderingCapacity === 0
                ? 'You need legal businesses on your territory to launder money.'
                : 'No dirty money to launder.',
            }];
          }
          break;
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
            if (lawyer) {
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
        case 'stop_bribe':
          // Legacy bribe system removed — use Corruption panel (activeBribes) instead
          newState.pendingNotifications = [...newState.pendingNotifications, {
            type: 'warning' as const, title: '🚫 Use Corruption Panel',
            message: 'Use the Corruption panel to bribe officials.',
          }];
          break;

        case 'rival_info':
          newState.pendingNotifications = [...newState.pendingNotifications, {
            type: 'info' as const, title: '🕵️ Intelligence Report',
            message: 'Your contacts have gathered intelligence on rival operations.',
          }];
          break;

        case 'shutdown_rival':
          // Check activeBribes for mayor-tier bribe instead of legacy system
          if (action.rivalFamily && (newState.activeBribes || []).some((b: any) => b.tier === 'mayor' && b.active)) {
            const rivalFamily = action.rivalFamily as keyof typeof newState.familyControl;
            if (newState.familyControl[rivalFamily] !== undefined) {
              newState.familyControl[rivalFamily] = Math.max(0, newState.familyControl[rivalFamily] - 5);
              newState.familyControl[newState.playerFamily as keyof typeof newState.familyControl] += 2;
              syncRespect(newState, Math.min(100, newState.resources.respect + 3));
            }
          }
          break;
      }

      // Finance values are computed by processEconomy at end of turn — no legacy recalculation here

      return newState;
    });
  }, []);

  const performReputationAction = useCallback((action: any) => {
    setGameState(prev => {
      const newState = { ...prev };
      switch (action.type) {
        case 'charitable_donation':
        case 'public_appearance':
        case 'hire_lawyer':
          // These are now handled by performAction, no-op here
          return newState;
        default:
          return newState;
      }
    });
  }, []);

  const handleEventChoice = useCallback((eventId: string, choiceId: string) => {
    setGameState(prev => {
      const newState = cloneStateForMutation(prev);
      const event = newState.events.find(e => e.id === eventId);
      if (event) {
        const choice = event.choices.find(c => c.id === choiceId);
        if (choice) {
          // Apply standard consequences
          choice.consequences.forEach(c => {
            switch (c.type) {
              case 'money': newState.resources.money += c.value; break;
              case 'heat': newState.policeHeat.level = Math.max(0, newState.policeHeat.level + c.value); break;
              case 'reputation': newState.reputation.reputation += c.value; break;
            }
          });

          // === Special: Internal Betrayal resolution ===
          if (event.title === 'Internal Betrayal' && event.requirements?.territory?.[0]) {
            const targetSoldierId = event.requirements.territory[0];
            if (choiceId === 'confront') {
              // Remove the soldier
              newState.deployedUnits = newState.deployedUnits.filter(u => u.id !== targetSoldierId);
              delete newState.soldierStats[targetSoldierId];
              newState.pendingNotifications = [...newState.pendingNotifications, {
                type: 'warning', title: '🔪 Soldier Dismissed',
                message: 'The disloyal soldier has been dealt with. Your crew\'s loyalty is stabilized.',
              }];
            } else if (choiceId === 'promote') {
              if (Math.random() < 0.2) {
                // 20% chance: promotion fails, soldier defects
                const aiFamilies = newState.aiOpponents.map(o => o.family);
                const targetFamily = aiFamilies[Math.floor(Math.random() * aiFamilies.length)];
                const defector = newState.deployedUnits.find(u => u.id === targetSoldierId);
                if (defector && targetFamily) {
                  // Move soldier to random AI hex
                  const aiHexes = newState.hexMap.filter(t => t.controllingFamily === targetFamily);
                  const targetHex = aiHexes[Math.floor(Math.random() * aiHexes.length)];
                  if (targetHex) {
                    newState.deployedUnits = newState.deployedUnits.map(u =>
                      u.id === targetSoldierId
                        ? { ...u, family: targetFamily as any, q: targetHex.q, r: targetHex.r, s: targetHex.s }
                        : u
                    );
                  } else {
                    newState.deployedUnits = newState.deployedUnits.filter(u => u.id !== targetSoldierId);
                  }
                  delete newState.soldierStats[targetSoldierId];
                  newState.pendingNotifications = [...newState.pendingNotifications, {
                    type: 'error', title: '💀 Promotion Backfired!',
                    message: `The soldier took your money and defected to the ${targetFamily} family!`,
                  }];
                }
              } else {
                // Success: loyalty boost
                const stats = newState.soldierStats[targetSoldierId];
                if (stats) {
                  newState.soldierStats[targetSoldierId] = {
                    ...stats,
                    loyalty: Math.min(80, stats.loyalty + 30),
                  };
                }
                newState.pendingNotifications = [...newState.pendingNotifications, {
                  type: 'success', title: '⬆️ Promotion Accepted',
                  message: 'The soldier is grateful. Loyalty restored.',
                }];
              }
            } else if (choiceId === 'ignore') {
              // Set pending defection flag
              newState.deployedUnits = newState.deployedUnits.map(u =>
                u.id === targetSoldierId ? { ...u, pendingDefection: true } : u
              );
              newState.pendingNotifications = [...newState.pendingNotifications, {
                type: 'warning', title: '⚠️ Ignored Betrayal',
                message: 'The soldier may defect next turn...',
              }];
            }
          }

          // === Special: Rat in the Ranks — set ratIgnored flag ===
          if (event.title === 'Rat in the Ranks' && choiceId === 'ignore') {
            newState.ratIgnored = true;
          }

          // === Special: Federal Investigation — clear ratIgnored ===
          if (event.title === 'Federal Investigation') {
            newState.ratIgnored = false;
            if (choiceId === 'risk') {
              // Shut down a random player business
              const playerBusinessHexes = newState.hexMap.filter(
                t => t.controllingFamily === newState.playerFamily && t.business
              );
              if (playerBusinessHexes.length > 0) {
                const victim = playerBusinessHexes[Math.floor(Math.random() * playerBusinessHexes.length)];
                const lostBiz = victim.business!.type;
                newState.hexMap = newState.hexMap.map(t =>
                  t.q === victim.q && t.r === victim.r && t.s === victim.s
                    ? { ...t, business: undefined }
                    : t
                );
                newState.pendingNotifications = [...newState.pendingNotifications, {
                  type: 'error', title: '🏛️ Business Seized',
                  message: `The feds shut down your ${lostBiz} operation!`,
                }];
              }
            }
          }

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

    // Require $12,000
    if (state.resources.money < 12000) {
      state.pendingNotifications = [...state.pendingNotifications, {
        type: 'warning', title: '💣 Sabotage Failed',
        message: `Not enough money. Sabotage costs $12,000.`,
      }];
      return state;
    }

    // Require a player soldier on or adjacent to the target hex
    const adjacentCoords = getHexNeighbors(targetQ, targetR, targetS);
    const hasSoldierPresence = state.deployedUnits.some(u =>
      u.family === state.playerFamily && u.type === 'soldier' &&
      ((u.q === targetQ && u.r === targetR && u.s === targetS) ||
       adjacentCoords.some(a => u.q === a.q && u.r === a.r && u.s === a.s))
    );
    if (!hasSoldierPresence) {
      state.pendingNotifications = [...state.pendingNotifications, {
        type: 'warning', title: '💣 Sabotage Failed',
        message: `You need a soldier on or adjacent to the target hex.`,
      }];
      return state;
    }

    // Deduct cost
    state.resources.money -= 12000;

    // Permanently destroy the business
    const destroyedType = tile.business.type;
    const destroyedIncome = tile.business.income;
    tile.business = undefined;

    // Increase police heat (+15)
    state.policeHeat.level = Math.min(100, state.policeHeat.level + 15);

    // Damage relationship with owning family
    if (state.reputation.familyRelationships[tile.controllingFamily] !== undefined) {
      state.reputation.familyRelationships[tile.controllingFamily] -= 10;
    }

    state.pendingNotifications = [...state.pendingNotifications, {
      type: 'success', title: '💣 Sabotage Successful!',
      message: `${tile.controllingFamily}'s ${destroyedType} ($${destroyedIncome.toLocaleString()}/turn) has been permanently destroyed! -$12,000. +15 Heat.`,
    }];

    syncLegacyUnits(state);
    updateVictoryProgress(state);
    return state;
  };

  // ============ CLAIM TERRITORY (soldiers + capos, action phase) ============
  const processClaimTerritory = (state: EnhancedMafiaGameState, action: any): EnhancedMafiaGameState => {
    const { targetQ, targetR, targetS } = action;
    const tile = state.hexMap.find(t => t.q === targetQ && t.r === targetR && t.s === targetS);
    if (!tile || tile.controllingFamily !== 'neutral' || tile.isHeadquarters) return state;

    // Allow both soldiers and capos to claim
    const playerUnitsOnHex = state.deployedUnits.filter(u => 
      u.family === state.playerFamily &&
      u.q === targetQ && u.r === targetR && u.s === targetS
    );
    const claimNeighbors = getHexNeighbors(targetQ, targetR, targetS);
    const playerUnitsAdjacent = state.deployedUnits.filter(u => 
      u.family === state.playerFamily &&
      claimNeighbors.some(n => n.q === u.q && n.r === u.r && n.s === u.s)
    );
    const playerUnits = [...playerUnitsOnHex, ...playerUnitsAdjacent];
    if (playerUnits.length === 0) return state;

    tile.controllingFamily = state.playerFamily;

    // Auto-move: move the selected soldier to the claimed hex (fall back to first adjacent soldier)
    const selectedSoldier = action.unitId 
      ? playerUnits.find(u => u.id === action.unitId && u.type === 'soldier')
      : null;
    const soldierToMove = selectedSoldier || playerUnitsAdjacent.find(u => u.type === 'soldier');
    if (soldierToMove && (soldierToMove.q !== targetQ || soldierToMove.r !== targetR || soldierToMove.s !== targetS)) {
      soldierToMove.q = targetQ;
      soldierToMove.r = targetR;
      soldierToMove.s = targetS;
    }
    // Capos do NOT move — they claim at range

    // Community expansion: +1 respect, +1 influence, no money
    let respectGain = 1;
    let influenceGain = 1;
    const hasRecruitedSoldier = playerUnits.some(u => u.recruited);
    if (hasRecruitedSoldier) {
      respectGain += 1;
      influenceGain += 1;
    }
    state.reputation.respect = Math.min(100, state.reputation.respect + respectGain);
    state.reputation.streetInfluence = Math.min(100, state.reputation.streetInfluence + influenceGain);

    const claimBonus = hasRecruitedSoldier ? ' (Recruit bonus!)' : '';
    // Toughness progress for the claiming soldier
    let toughnessMsg = '';
    const claimingSoldier = soldierToMove || playerUnitsOnHex.find(u => u.type === 'soldier');
    if (claimingSoldier && state.soldierStats[claimingSoldier.id]) {
      const sStats = state.soldierStats[claimingSoldier.id];
      if (sStats.toughness < 5) {
        sStats.toughnessProgress = (sStats.toughnessProgress || 0) + CLAIM_TOUGHNESS_GAIN;
        if (sStats.toughnessProgress >= 1.0) {
          sStats.toughness = Math.min(5, sStats.toughness + 1);
          sStats.toughnessProgress -= 1.0;
          toughnessMsg = ` 💪 Soldier toughness increased to ${sStats.toughness}!`;
        }
      }
    }

    state.pendingNotifications = [...state.pendingNotifications, {
      type: 'success' as const, title: '🏴 Territory Claimed!',
      message: `Your family takes ${tile.district} under its wing.${claimBonus} (+${respectGain} Respect, +${influenceGain} Influence)${toughnessMsg}`,
    }];

    syncLegacyUnits(state);
    updateVictoryProgress(state);
    return state;
  };

  // ============ HQ ASSAULT (action phase) ============
  const processHQAssault = (state: EnhancedMafiaGameState, action: any): EnhancedMafiaGameState => {
    const { targetQ, targetR, targetS, selectedUnitId } = action;
    const tile = state.hexMap.find(t => t.q === targetQ && t.r === targetR && t.s === targetS);
    if (!tile || !tile.isHeadquarters) return state;
    const targetFamily = tile.isHeadquarters;
    if (targetFamily === state.playerFamily) return state;
    if ((state.eliminatedFamilies || []).includes(targetFamily)) return state;

    const attacker = state.deployedUnits.find(u => u.id === selectedUnitId);
    if (!attacker || attacker.type !== 'soldier' || attacker.family !== state.playerFamily) return state;
    const dist = hexDistance(attacker, { q: targetQ, r: targetR, s: targetS });
    if (dist !== 1) {
      state.pendingNotifications = [...state.pendingNotifications, { type: 'warning', title: '⚠️ Not Adjacent', message: 'Your soldier must be adjacent to the HQ.' }];
      return state;
    }

    const stats = state.soldierStats[attacker.id];
    if (!stats || stats.toughness < HQ_ASSAULT_MIN_TOUGHNESS || stats.loyalty < HQ_ASSAULT_MIN_LOYALTY) {
      state.pendingNotifications = [...state.pendingNotifications, { type: 'warning', title: '⚠️ Not Ready', message: `Soldier needs Toughness ≥ ${HQ_ASSAULT_MIN_TOUGHNESS} and Loyalty ≥ ${HQ_ASSAULT_MIN_LOYALTY}.` }];
      return state;
    }

    let chance = HQ_ASSAULT_BASE_CHANCE - HQ_DEFENSE_BONUS;
    const hqNeighbors = getHexNeighbors(targetQ, targetR, targetS);
    const friendlyAdjacent = state.deployedUnits.filter(u =>
      u.family === state.playerFamily && u.id !== attacker.id &&
      hqNeighbors.some(n => n.q === u.q && n.r === u.r && n.s === u.s)
    );
    chance += friendlyAdjacent.length * 0.05;
    const bonuses = FAMILY_BONUSES[state.playerFamily] || FAMILY_BONUSES.gambino;
    chance += bonuses.combatBonus / 100 * 0.1;
    const flippedCount = (state.flippedSoldiers || []).filter(f => f.family === targetFamily).length;
    chance += flippedCount * 0.10;
    chance = Math.min(HQ_ASSAULT_MAX_CHANCE, Math.max(0.05, chance));

    if (Math.random() < chance) {
      state.eliminatedFamilies = [...(state.eliminatedFamilies || []), targetFamily];
      state.deployedUnits = state.deployedUnits.filter(u => u.family !== targetFamily);
      state.hexMap.forEach(t => { if (t.controllingFamily === targetFamily && !t.isHeadquarters) t.controllingFamily = 'neutral' as any; });
      state.fortifiedHexes = (state.fortifiedHexes || []).filter(f => f.family !== targetFamily);
      state.aiOpponents = state.aiOpponents.filter(o => o.family !== targetFamily);
      state.flippedSoldiers = (state.flippedSoldiers || []).filter(f => f.family !== targetFamily);
      state.resources.money += 25000;
      state.reputation.respect = Math.min(100, state.reputation.respect + 30);
      state.reputation.fear = Math.min(100, state.reputation.fear + 40);
      state.pendingNotifications = [...state.pendingNotifications, {
        type: 'success', title: '💀 Family Eliminated!',
        message: `The ${targetFamily.charAt(0).toUpperCase() + targetFamily.slice(1)} family has been destroyed! +$25,000, +30 Respect, +40 Fear.`,
      }];
      state.lastCombatResult = { q: targetQ, r: targetR, s: targetS, success: true, type: 'hit', title: `${targetFamily.toUpperCase()} ELIMINATED`, details: 'HQ Assault successful!', timestamp: Date.now() };
    } else {
      state.deployedUnits = state.deployedUnits.filter(u => u.id !== attacker.id);
      delete state.soldierStats[attacker.id];
      friendlyAdjacent.forEach(u => { const uStats = state.soldierStats[u.id]; if (uStats) uStats.loyalty = Math.max(0, uStats.loyalty - 30); });
      state.pendingNotifications = [...state.pendingNotifications, {
        type: 'error', title: '💀 Assault Failed!',
        message: `The HQ assault failed! Your soldier was killed and nearby units lost 30 loyalty.`,
      }];
      state.lastCombatResult = { q: targetQ, r: targetR, s: targetS, success: false, type: 'hit', title: 'ASSAULT FAILED', details: 'HQ defenses held', timestamp: Date.now() };
    }
    syncLegacyUnits(state);
    updateVictoryProgress(state);
    return state;
  };

  // ============ FLIP SOLDIER (action phase) ============
  const processFlipSoldier = (state: EnhancedMafiaGameState, action: any): EnhancedMafiaGameState => {
    const { targetQ, targetR, targetS } = action;
    const tile = state.hexMap.find(t => t.q === targetQ && t.r === targetR && t.s === targetS);
    if (!tile || !tile.isHeadquarters) return state;
    const targetFamily = tile.isHeadquarters;
    if (targetFamily === state.playerFamily) return state;

    if (state.resources.money < FLIP_SOLDIER_COST) {
      state.pendingNotifications = [...state.pendingNotifications, { type: 'warning', title: '💰 Not Enough Money', message: `Flipping costs $${FLIP_SOLDIER_COST.toLocaleString()}.` }];
      return state;
    }

    const hqNeighbors = getHexNeighbors(targetQ, targetR, targetS);
    const hasAdjacentUnit = state.deployedUnits.some(u => u.family === state.playerFamily && hqNeighbors.some(n => n.q === u.q && n.r === u.r && n.s === u.s));
    if (!hasAdjacentUnit) {
      state.pendingNotifications = [...state.pendingNotifications, { type: 'warning', title: '⚠️ No Unit Adjacent', message: 'Need a unit adjacent to enemy HQ.' }];
      return state;
    }

    const enemySoldiersNearHQ = state.deployedUnits.filter(u =>
      u.family === targetFamily && u.type === 'soldier' && hexDistance(u, { q: targetQ, r: targetR, s: targetS }) <= 1
    );
    // FIX #6: Any soldier with loyalty < 80 can be targeted (low loyalty = easier to flip)
    const flippableTargets = enemySoldiersNearHQ.filter(u => {
      const uStats = state.soldierStats[u.id];
      return uStats && uStats.loyalty < 80 && !(state.flippedSoldiers || []).some(f => f.unitId === u.id);
    });

    if (flippableTargets.length === 0) {
      state.pendingNotifications = [...state.pendingNotifications, { type: 'warning', title: '⚠️ No Targets', message: 'No eligible soldiers near enemy HQ.' }];
      return state;
    }

    state.resources.money -= FLIP_SOLDIER_COST;
    const target = flippableTargets[Math.floor(Math.random() * flippableTargets.length)];
    const targetStats = state.soldierStats[target.id]!;

    let chance = FLIP_SOLDIER_BASE_CHANCE;
    // Low loyalty = easier to flip, high loyalty = harder
    if (targetStats.loyalty < 60) chance += 0.15;
    else if (targetStats.loyalty > 70) chance -= 0.10;
    const playerInfluence = state.resources.influence || 0;
    if (playerInfluence > 50) chance += (playerInfluence - 50) * 0.005;
    const schemerAdjacent = state.deployedUnits.some(u =>
      u.family === state.playerFamily && u.type === 'capo' && u.personality === 'schemer' &&
      hqNeighbors.some(n => n.q === u.q && n.r === u.r && n.s === u.s)
    );
    if (schemerAdjacent) chance += 0.10;
    chance = Math.min(0.70, Math.max(0.05, chance));

    if (Math.random() < chance) {
      state.flippedSoldiers = [...(state.flippedSoldiers || []), { unitId: target.id, family: targetFamily, flippedByFamily: state.playerFamily, hqQ: targetQ, hqR: targetR, hqS: targetS }];
      state.pendingNotifications = [...state.pendingNotifications, { type: 'success', title: '🐀 Soldier Flipped!', message: `A ${targetFamily} soldier has been turned! HQ defense -10%.` }];
    } else {
      state.resources.influence = Math.max(0, (state.resources.influence || 0) - FLIP_SOLDIER_FAIL_INFLUENCE_LOSS);
      targetStats.loyalty = Math.min(100, targetStats.loyalty + 10);
      state.pendingNotifications = [...state.pendingNotifications, { type: 'error', title: '🚨 Flip Failed!', message: `Attempt discovered! -${FLIP_SOLDIER_FAIL_INFLUENCE_LOSS} Influence. Target loyalty +10.` }];
    }
    return state;
  };

  // ============ ESTABLISH SAFEHOUSE (action phase) ============
  const processEstablishSafehouse = (state: EnhancedMafiaGameState, action: any): EnhancedMafiaGameState => {
    const { targetQ, targetR, targetS } = action;
    const tile = state.hexMap.find(t => t.q === targetQ && t.r === targetR && t.s === targetS);
    if (!tile || tile.controllingFamily !== state.playerFamily || tile.isHeadquarters) return state;

    // Check cost
    if (state.resources.money < SAFEHOUSE_COST) return state;

    // Check max
    const playerHexCount = state.hexMap.filter(t => t.controllingFamily === state.playerFamily).length;
    const maxAllowed = playerHexCount >= SAFEHOUSE_TERRITORY_THRESHOLD ? MAX_SAFEHOUSES : 1;
    if (state.safehouses.length >= maxAllowed) return state;

    // Check duplicate
    if (state.safehouses.some(s => s.q === targetQ && s.r === targetR && s.s === targetS)) return state;

    state.safehouses.push({
      q: targetQ, r: targetR, s: targetS,
      turnsRemaining: SAFEHOUSE_DURATION,
      createdTurn: state.turn,
    });
    state.resources.money -= SAFEHOUSE_COST;

    state.pendingNotifications = [...state.pendingNotifications, {
      type: 'success', title: '🏠 Safehouse Established!',
      message: `New safehouse at ${tile.district}. Acts as secondary deploy point for ${SAFEHOUSE_DURATION} turns. Cost: $${SAFEHOUSE_COST.toLocaleString()}.`,
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
          syncRespect(state, Math.max(0, state.reputation.respect - 25));
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
          syncRespect(state, Math.max(0, state.reputation.respect - CEASEFIRE_VIOLATION_RESPECT_LOSS));
          state.reputation.fear = Math.max(0, (state.reputation.fear || 0) - CEASEFIRE_VIOLATION_FEAR_LOSS);
          // Apply treachery debuff
          state.treacheryDebuff = { turnsRemaining: TREACHERY_DEBUFF_DURATION, appliedOnTurn: state.turn };
          // Reduce relationships with ALL families
          for (const fam of Object.keys(state.reputation.familyRelationships)) {
            state.reputation.familyRelationships[fam] = (state.reputation.familyRelationships[fam] || 0) - 10;
          }
          state.pendingNotifications = [...state.pendingNotifications, {
            type: 'error', title: '🗡️ Treachery!',
            message: `You broke the ceasefire! -${CEASEFIRE_VIOLATION_RESPECT_LOSS} respect, -${CEASEFIRE_VIOLATION_FEAR_LOSS} fear. Other families trust you less for ${TREACHERY_DEBUFF_DURATION} turns (-${TREACHERY_NEGOTIATION_PENALTY}% negotiations).`,
          }];
        }
      }

      // Check safe passage
      const hasSafePassage = (state.safePassagePacts || []).some(
        (p: SafePassagePact) => p.active && p.targetFamily === tile.controllingFamily
      );
      if (hasSafePassage) {
        state.safePassagePacts = (state.safePassagePacts || []).map((p: SafePassagePact) =>
          p.active && p.targetFamily === tile.controllingFamily ? { ...p, active: false } : p
        ).filter((p: SafePassagePact) => p.active);
        syncRespect(state, Math.max(0, state.reputation.respect - 15));
        state.reputation.reputation = Math.max(0, state.reputation.reputation - 10);
        if (state.reputation.familyRelationships[tile.controllingFamily] !== undefined) {
          state.reputation.familyRelationships[tile.controllingFamily] -= 25;
        }
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'error', title: '🛤️ Safe Passage Violated!',
          message: `You attacked during safe passage! -15 respect, -10 reputation. The ${tile.controllingFamily} family will remember this.`,
        }];
      }

      // Gather participants: selected unit + units on target hex
      const selectedUnitId = action.selectedUnitId;
      const playerUnitsOnHex = state.deployedUnits.filter(u => 
        u.family === state.playerFamily && u.q === targetQ && u.r === targetR && u.s === targetS
      );
      const selectedUnit = state.deployedUnits.find(u => u.id === selectedUnitId);
      const playerUnits: typeof playerUnitsOnHex = [];
      if (selectedUnit && !playerUnitsOnHex.some(u => u.id === selectedUnit.id)) {
        playerUnits.push(selectedUnit);
      }
      playerUnits.push(...playerUnitsOnHex);
      if (playerUnits.length === 0) return state;

      // Check if hex is scouted
      const isScouted = state.scoutedHexes.some(s => s.q === targetQ && s.r === targetR && s.s === targetS);

      const enemyUnits = state.deployedUnits.filter(u => 
        u.family === tile.controllingFamily && u.q === targetQ && u.r === targetR && u.s === targetS
      );

      // ============ BLIND HIT: CIVILIAN RISK ============
      if (!isScouted && enemyUnits.length === 0) {
        // No enemy units — soldier hit a civilian!
        state.policeHeat.level = 100;
        
        // Remove soldier from board, add to hidden units
        const hidingSoldier = playerUnits[0]; // The initiating soldier goes into hiding
        const idx = state.deployedUnits.indexOf(hidingSoldier);
        if (idx !== -1) state.deployedUnits.splice(idx, 1);
        
        state.hiddenUnits = [...state.hiddenUnits, {
          unitId: hidingSoldier.id,
          returnsOnTurn: state.turn + HIDING_DURATION,
        }];
        
        state.lastCombatResult = {
          q: targetQ, r: targetR, s: targetS,
          success: false, type: 'hit',
          title: '💀 CIVILIAN HIT!',
          details: 'Your soldier hit an innocent civilian! Heat maxed, soldier in hiding for 3 turns.',
          timestamp: Date.now(),
        };
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'error', title: '💀 Civilian Casualty!',
          message: `Your soldier hit an innocent civilian! Police heat maxed out. The soldier has gone into hiding for ${HIDING_DURATION} turns.`,
        }];
        
        syncLegacyUnits(state);
        return state;
      }

      // ============ COMBAT RESOLUTION ============
      const attackers = playerUnits.length;
      const defenders = enemyUnits.length;
      let chance = 0.5 + (attackers - defenders) * 0.15;
      
      // Unscouted penalty
      if (!isScouted) {
        chance -= BLIND_HIT_PENALTY;
      }
      
      // Fortification modifiers (hex-based)
      const defenderHexFortified = isHexFortified(state.fortifiedHexes || [], targetQ, targetR, targetS, tile.controllingFamily);
      if (defenderHexFortified) {
        chance -= FORTIFY_DEFENSE_BONUS / 100;
      }
      // Safehouse defense bonus for defenders
      const isDefenderSafehouse = state.safehouses.some(s => s.q === targetQ && s.r === targetR && s.s === targetS);
      if (isDefenderSafehouse) {
        chance -= SAFEHOUSE_DEFENSE_BONUS / 100;
      }
      // Built business defense bonus for defenders
      const isDefenderBuiltBiz = tile.business && !tile.business.isExtorted && tile.controllingFamily !== state.playerFamily;
      if (isDefenderBuiltBiz) {
        chance -= BUILT_BUSINESS_DEFENSE_BONUS / 100;
      }
      // Attacker bonus: attacking FROM a fortified hex
      const attackerUnit = playerUnits[0];
      const attackerHexFortified = attackerUnit && isHexFortified(state.fortifiedHexes || [], attackerUnit.q, attackerUnit.r, attackerUnit.s, state.playerFamily);
      if (attackerHexFortified) {
        chance += FORTIFY_DEFENSE_BONUS / 200;
      }
      
      // Family bonuses (hitmen no longer provide combat bonuses — they are external contractors)
      chance += state.familyBonuses.combatBonus / 100;
      chance += state.familyBonuses.hitSuccess / 100;

      // Scout intel bonus — fresh intel gives full bonus, stale gives half
      if (isScouted) {
        const scoutInfo = state.scoutedHexes.find(s => s.q === tile.q && s.r === tile.r && s.s === tile.s);
        if (scoutInfo && state.turn <= scoutInfo.freshUntilTurn) {
          chance += SCOUT_INTEL_BONUS / 100;
        } else {
          chance += SCOUT_STALE_BONUS / 100;
        }
      }

      // Plan Hit bonus — target tracking system
      if (state.plannedHit && (action._executingPlan || (state.plannedHit.q === targetQ && state.plannedHit.r === targetR && state.plannedHit.s === targetS))) {
        const targetOnOriginalHex = state.deployedUnits.some(u => 
          u.id === state.plannedHit!.targetUnitId && u.q === state.plannedHit!.q && u.r === state.plannedHit!.r && u.s === state.plannedHit!.s
        );
        const targetOnCurrentHex = state.deployedUnits.some(u =>
          u.id === state.plannedHit!.targetUnitId && u.q === targetQ && u.r === targetR && u.s === targetS
        );

        if (targetOnOriginalHex) {
          // Best case — target stayed on planned hex → full +20% bonus
          chance += PLAN_HIT_BONUS / 100;
          state.pendingNotifications = [...state.pendingNotifications, {
            type: 'info', title: '🎯 Plan Hit Executed!',
            message: `+${PLAN_HIT_BONUS}% bonus applied — target was right where expected.`,
          }];
        } else if (targetOnCurrentHex) {
          // Target relocated but we followed them → reduced +10% bonus + penalties
          chance += PLAN_HIT_RELOCATED_BONUS / 100;
          state.policeHeat.level = Math.min(100, state.policeHeat.level + PLAN_HIT_RELOCATED_HEAT);
          state.planHitCooldownUntil = state.turn + PLAN_HIT_COOLDOWN;
          state.pendingNotifications = [...state.pendingNotifications, {
            type: 'warning', title: '🎯 Target Relocated',
            message: `Target moved — strike redirected. +${PLAN_HIT_RELOCATED_BONUS}% bonus (reduced), +${PLAN_HIT_RELOCATED_HEAT} heat. Plan Hit on cooldown for ${PLAN_HIT_COOLDOWN} turns.`,
          }];
        } else {
          // Target gone from this hex entirely (shouldn't happen via execute_planned_hit, but safety net)
          if (state.resources.respect >= state.reputation.fear) {
            state.resources.respect = Math.max(0, state.resources.respect - PLAN_HIT_FAIL_REPUTATION);
          } else {
            state.reputation.fear = Math.max(0, state.reputation.fear - PLAN_HIT_FAIL_REPUTATION);
          }
          const plannerStats = state.soldierStats[state.plannedHit.plannerUnitId];
          if (plannerStats) {
            plannerStats.loyalty = Math.max(0, plannerStats.loyalty - PLAN_HIT_FAIL_LOYALTY);
          }
          state.pendingNotifications = [...state.pendingNotifications, {
            type: 'error', title: '🎯 Plan Hit Failed!',
            message: `The target slipped away — your plan was exposed. -${PLAN_HIT_FAIL_REPUTATION} reputation, planner morale shaken.`,
          }];
        }
        state.plannedHit = null; // Consume the plan either way
      }
      
      chance = Math.max(0.1, Math.min(0.95, chance));

      // Heat scales with battle size
      const totalUnitsInvolved = attackers + defenders;
      const heatGain = Math.min(25, 8 + totalUnitsInvolved * 2);

      if (Math.random() < chance) {
        // ============ VICTORY ============
        const targetFamily = tile.controllingFamily;
        
        enemyUnits.forEach(eu => {
          const idx = state.deployedUnits.indexOf(eu);
          if (idx !== -1) state.deployedUnits.splice(idx, 1);
        });
        tile.controllingFamily = 'neutral'; // Hit clears enemy control — player must Claim next turn
        // Destroy fortification on captured hex
        state.fortifiedHexes = (state.fortifiedHexes || []).filter(f => !(f.q === targetQ && f.r === targetR && f.s === targetS));
        
        // Check if enemy had a safehouse on this hex → player gets bounty + intel
        // (AI safehouses are tracked per-AI; for now we check if any AI opponent has a safehouse here)
        // We store AI safehouses on the same state.safehouses array, marked by checking against player
        // Actually AI safehouses are separate — we track them via aiSafehouses on opponents
        // For simplicity, any safehouse on this hex that isn't the player's gets destroyed
        const enemySafehouseIdx = state.safehouses.findIndex(s => s.q === targetQ && s.r === targetR && s.s === targetS);
        if (enemySafehouseIdx !== -1) {
          state.safehouses.splice(enemySafehouseIdx, 1);
          state.resources.money += SAFEHOUSE_CAPTURE_BOUNTY;
          // Intel: scout all hexes owned by targetFamily for 1 turn
          if (targetFamily) {
            const enemyHexes = state.hexMap.filter(t => t.controllingFamily === targetFamily);
            const newScoutEntries: ScoutedHex[] = enemyHexes.map(h => ({
              q: h.q, r: h.r, s: h.s,
              scoutedTurn: state.turn,
              turnsRemaining: SAFEHOUSE_CAPTURE_INTEL_DURATION,
              freshUntilTurn: state.turn + 1,
              enemySoldierCount: state.deployedUnits.filter(u => u.family === targetFamily && u.q === h.q && u.r === h.r && u.s === h.s).length,
              enemyFamily: targetFamily,
              businessType: h.business?.type,
              businessIncome: h.business?.income,
            }));
            // Merge — don't duplicate existing scouts
            const existingKeys = new Set(state.scoutedHexes.map(s => `${s.q},${s.r},${s.s}`));
            state.scoutedHexes = [
              ...state.scoutedHexes,
              ...newScoutEntries.filter(s => !existingKeys.has(`${s.q},${s.r},${s.s}`)),
            ];
          }
          state.pendingNotifications = [...state.pendingNotifications, {
            type: 'success', title: '🏠 Enemy Safehouse Captured!',
            message: `You raided their safehouse! +$${SAFEHOUSE_CAPTURE_BOUNTY.toLocaleString()} bounty and full intel on ${targetFamily} operations for 1 turn.`,
          }];
        }
        
        if (!isScouted) {
          // ===== BLIND HIT VICTORY: Enhanced rewards =====
          syncRespect(state, Math.min(100, state.reputation.respect + BLIND_HIT_RESPECT));
          state.reputation.fear = Math.min(100, (state.reputation.fear || 0) + BLIND_HIT_FEAR);
          
          // Boost the initiating soldier's stats (bounded, not maxed)
          playerUnits.forEach(u => {
            if (state.soldierStats[u.id]) {
              state.soldierStats[u.id].toughness = Math.min(5, (state.soldierStats[u.id].toughness || 1) + 3);
              state.soldierStats[u.id].victories = Math.min(5, (state.soldierStats[u.id].victories || 0) + 2);
              state.soldierStats[u.id].loyalty = Math.min(SOLDIER_LOYALTY_CAP, (state.soldierStats[u.id].loyalty || 50) + 15);
              state.soldierStats[u.id].hits += 1;
            }
          });
          
          // Street cred event: +15 fear from all rival families
          state.pendingNotifications = [...state.pendingNotifications, {
            type: 'success', title: '🔥 STREET CRED! Bold Blind Hit!',
            message: `Word spreads of your audacious unscouted attack! All rival families now fear you (+${BLIND_HIT_FEAR} fear). The ${targetFamily} family is out for revenge!`,
          }];
          
          // Bounty: targeted family AI prioritizes player for BOUNTY_DURATION turns
          if (targetFamily) {
            state.aiBounties = [...state.aiBounties, {
              targetFamily: state.playerFamily,
              fromFamily: targetFamily,
              expiresOnTurn: state.turn + BOUNTY_DURATION,
            }];
            
            // Targeted family loses influence
            const rivalOpponent = state.aiOpponents.find(o => o.family === targetFamily);
            if (rivalOpponent) {
              rivalOpponent.resources.influence = Math.max(0, rivalOpponent.resources.influence - BLIND_HIT_INFLUENCE_LOSS);
            }
            
            state.pendingNotifications = [...state.pendingNotifications, {
              type: 'warning', title: `🎯 Bounty Placed by ${targetFamily.charAt(0).toUpperCase() + targetFamily.slice(1)}!`,
              message: `The ${targetFamily} family has placed a bounty on you! They will aggressively target your territory for ${BOUNTY_DURATION} turns.`,
            }];
          }
          
          const hitDetails = `+${BLIND_HIT_RESPECT} respect, +${BLIND_HIT_FEAR} fear, soldier stats boosted!`;
          state.lastCombatResult = {
            q: targetQ, r: targetR, s: targetS,
            success: true, type: 'hit',
            title: '🔥 BLIND HIT SUCCESSFUL!',
            details: hitDetails,
            timestamp: Date.now(),
          };
        } else {
          // ===== SCOUTED HIT VICTORY: Standard rewards =====
          syncRespect(state, Math.min(100, (state.reputation.respect || 0) + 5));
          state.reputation.fear = Math.min(100, (state.reputation.fear || 0) + 5);
          
          playerUnits.forEach(u => {
            if (state.soldierStats[u.id]) {
              state.soldierStats[u.id].hits += 1;
              state.soldierStats[u.id].victories = Math.min(5, state.soldierStats[u.id].victories + 1);
              state.soldierStats[u.id].toughness = Math.min(5, state.soldierStats[u.id].toughness + 1);
              // Loyalty: +2 action bonus + +5 combat bonus
              state.soldierStats[u.id].loyalty = Math.min(
                u.type === 'capo' ? CAPO_LOYALTY_CAP : SOLDIER_LOYALTY_CAP,
                state.soldierStats[u.id].loyalty + LOYALTY_ACTION_BONUS + LOYALTY_COMBAT_BONUS
              );
            }
          });
          
          const hitDetails = `+5 fear, +5 respect`;
          state.lastCombatResult = {
            q: targetQ, r: targetR, s: targetS,
            success: true, type: 'hit',
            title: 'HIT SUCCESSFUL!',
            details: hitDetails,
            timestamp: Date.now(),
          };
          state.pendingNotifications = [...state.pendingNotifications, {
            type: 'success', title: 'Hit Successful!',
            message: `Territory is now contested — claim it next turn. ${hitDetails}.`,
          }];
        }
        
        // Casualties — per-unit fortify re-roll (capos immune — wounded only)
        const killableUnits = playerUnits.filter(u => u.type !== 'capo');
        const playerCapos = playerUnits.filter(u => u.type === 'capo');
        const casualties = Math.max(0, Math.floor(killableUnits.length * 0.2));
        const shuffled = [...killableUnits].sort(() => Math.random() - 0.5);
        let removed = 0;
        const alreadyRemoved = new Set<string>();
        for (let i = 0; i < shuffled.length && removed < casualties; i++) {
          const unit = shuffled[i];
          if (alreadyRemoved.has(unit.id)) continue;
          // Hex-based fortify casualty re-roll: units on fortified hex get 50% save
          const unitOnFortifiedHex = isHexFortified(state.fortifiedHexes || [], unit.q, unit.r, unit.s, state.playerFamily);
          if (unitOnFortifiedHex && Math.random() < 0.5) {
            const substitute = shuffled.find((u, j) => j > i && !isHexFortified(state.fortifiedHexes || [], u.q, u.r, u.s, state.playerFamily) && !alreadyRemoved.has(u.id));
            if (substitute) {
              alreadyRemoved.add(substitute.id);
              const idx = state.deployedUnits.indexOf(substitute);
              if (idx !== -1) {
                state.deployedUnits.splice(idx, 1);
                state.pendingNotifications = [...state.pendingNotifications, {
                  type: 'error' as const, title: '⚔️ Soldier Lost in Combat',
                  message: `Your soldier fell during the assault on ${tile.district}.`,
                }];
              }
              removed++;
              continue;
            }
            continue;
          }
          alreadyRemoved.add(unit.id);
          const idx = state.deployedUnits.indexOf(unit);
          if (idx !== -1) {
            state.deployedUnits.splice(idx, 1);
            state.pendingNotifications = [...state.pendingNotifications, {
              type: 'error' as const, title: '⚔️ Soldier Lost in Combat',
              message: `Your soldier fell during the assault on ${tile.district}.`,
            }];
            state.combatLog = [...(state.combatLog || []), `⚔️ Soldier lost during assault on ${tile.district}`];
          }
          removed++;
        }
        // Wound capos in combat (not killed)
        playerCapos.forEach(capo => {
          if (Math.random() < 0.3) {
            if (state.soldierStats[capo.id]) {
              state.soldierStats[capo.id].loyalty = Math.max(0, state.soldierStats[capo.id].loyalty - CAPO_WOUND_LOYALTY_PENALTY);
            }
            capo.woundedTurnsRemaining = CAPO_WOUND_DURATION;
            capo.maxMoves = Math.max(1, (capo.maxMoves || 3) - CAPO_WOUND_MOVE_PENALTY);
            state.pendingNotifications = [...state.pendingNotifications, {
              type: 'warning' as const, title: '🩸 Capo Wounded!',
              message: `Your capo was wounded during the assault on ${tile.district}. Wounded for ${CAPO_WOUND_DURATION} turns.`,
            }];
            state.combatLog = [...(state.combatLog || []), `🩸 Capo wounded during assault on ${tile.district}`];
          }
        });
      } else {
        // ============ DEFEAT — no fortify protection (attackers got overrun), capos wounded only ============
        const defeatKillable = playerUnits.filter(u => u.type !== 'capo');
        const defeatCapos = playerUnits.filter(u => u.type === 'capo');
        const defeatCasualties = Math.min(defeatKillable.length, Math.max(1, Math.floor(defeatKillable.length * 0.4)));
        const defeatShuffled = [...defeatKillable].sort(() => Math.random() - 0.5);
        for (let i = 0; i < defeatCasualties && i < defeatShuffled.length; i++) {
          const idx = state.deployedUnits.indexOf(defeatShuffled[i]);
          if (idx !== -1) {
            state.deployedUnits.splice(idx, 1);
            state.pendingNotifications = [...state.pendingNotifications, {
              type: 'error' as const, title: '⚔️ Soldier Killed in Battle',
              message: `Your soldier was killed in the failed attack on ${tile.district}.`,
            }];
            state.combatLog = [...(state.combatLog || []), `⚔️ Soldier killed in failed attack on ${tile.district}`];
          }
        }
        // Wound capos in defeat
        defeatCapos.forEach(capo => {
          if (state.soldierStats[capo.id]) {
            state.soldierStats[capo.id].loyalty = Math.max(0, state.soldierStats[capo.id].loyalty - CAPO_WOUND_LOYALTY_PENALTY);
          }
          capo.woundedTurnsRemaining = CAPO_WOUND_DURATION;
          capo.maxMoves = Math.max(1, (capo.maxMoves || 3) - CAPO_WOUND_MOVE_PENALTY);
          state.pendingNotifications = [...state.pendingNotifications, {
            type: 'warning' as const, title: '🩸 Capo Wounded!',
            message: `Your capo was wounded in the failed attack on ${tile.district}. Wounded for ${CAPO_WOUND_DURATION} turns.`,
          }];
          state.combatLog = [...(state.combatLog || []), `🩸 Capo wounded in failed attack on ${tile.district}`];
        });
        defeatShuffled.slice(defeatCasualties).forEach(u => {
          if (state.soldierStats[u.id]) {
            state.soldierStats[u.id].toughness = Math.min(5, state.soldierStats[u.id].toughness + 1);
            // Loyalty: +5 combat survival bonus
            state.soldierStats[u.id].loyalty = Math.min(
              u.type === 'capo' ? CAPO_LOYALTY_CAP : SOLDIER_LOYALTY_CAP,
              state.soldierStats[u.id].loyalty + LOYALTY_COMBAT_BONUS
            );
          }
        });
        const failDetails = `${defeatCasualties} casualt${defeatCasualties > 1 ? 'ies' : 'y'} suffered`;
        state.lastCombatResult = {
          q: targetQ, r: targetR, s: targetS,
          success: false, type: 'hit',
          title: !isScouted ? '💀 BLIND HIT FAILED!' : 'HIT FAILED!',
          details: failDetails,
          timestamp: Date.now(),
        };
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'error', title: !isScouted ? '💀 Blind Hit Failed!' : 'Hit Failed!',
          message: `The attack was repelled. ${failDetails}.`,
        }];
        state.combatLog = [...(state.combatLog || []), `💀 Hit on ${tile.district} failed! ${failDetails}`];
      }
      state.policeHeat.level = Math.min(100, state.policeHeat.level + heatGain);
    }
    
    syncLegacyUnits(state);
    return state;
  };

  // ============ 3-STEP TAKEOVER: EXTORT (soldiers only — capos auto-extort on arrival) ============
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

      // Soldiers: must be ON the hex. Capos: can be on or adjacent.
      const playerUnitsOnHex = state.deployedUnits.filter(u => 
        u.family === state.playerFamily && u.q === targetQ && u.r === targetR && u.s === targetS
      );
      const neighbors = getHexNeighbors(targetQ, targetR, targetS);
      const playerCaposAdjacent = state.deployedUnits.filter(u => 
        u.family === state.playerFamily && u.type === 'capo' &&
        neighbors.some(n => n.q === u.q && n.r === u.r && n.s === u.s)
      );
      
      const soldiersOnHex = playerUnitsOnHex.filter(u => u.type === 'soldier');
      const caposInRange = [...playerUnitsOnHex.filter(u => u.type === 'capo'), ...playerCaposAdjacent];
      const allPlayerUnits = [...soldiersOnHex, ...caposInRange];
      
      if (allPlayerUnits.length === 0) {
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'info' as const, title: 'Cannot Extort',
          message: 'Soldiers must be on the hex to extort. Capos can extort from adjacent hexes.',
        }];
        return state;
      }

      // Neutral: 90% success, claims territory. Enemy: 50% success, steals income only.
      let chance = isNeutral ? 0.9 : 0.5;
      chance += state.familyBonuses.extortion / 100;
      // District control bonus: Queens +10% extortion success
      if (hasPlayerDistrictBonus(state, 'extortion')) {
        chance += 0.10;
      }
      chance -= state.policeHeat.level / 1000;
      chance += (state.resources.influence / 100) * 0.15;
      if (tile.district === 'Manhattan') {
        chance *= 0.8;
      }
      const hasRecruitedUnit = allPlayerUnits.some(u => u.recruited);
      if (hasRecruitedUnit) {
        chance += 0.10;
      }
      chance = Math.min(0.99, chance);

      if (Math.random() < chance) {
        if (isNeutral) {
          tile.controllingFamily = state.playerFamily;
          if (tile.business) tile.business.isExtorted = true;
        }
        const baseMoneyGain = isEnemy ? (tile.business?.income || 2000) : 3000;
        const respectPayoutMultiplier = 0.5 + (state.reputation.respect / 100);
        const moneyGain = Math.floor(baseMoneyGain * respectPayoutMultiplier);
        const respectGain = isEnemy ? 3 : 5;
        state.resources.money += moneyGain;
        syncRespect(state, Math.min(100, state.reputation.respect + respectGain));
        
        // Only the acting unit (first soldier, or first capo if no soldiers) gets stat rewards
        const actingSoldiers = allPlayerUnits.filter(u => u.type === 'soldier');
        const actingUnit = actingSoldiers.length > 0 ? actingSoldiers[0] : allPlayerUnits[0];
        if (actingUnit && state.soldierStats[actingUnit.id]) {
          const stats = state.soldierStats[actingUnit.id];
          stats.extortions += 1;
          stats.victories = Math.min(5, stats.victories + 1);
          stats.racketeering = Math.min(5, stats.racketeering + 1);
          stats.loyalty = Math.min(
            actingUnit.type === 'capo' ? CAPO_LOYALTY_CAP : SOLDIER_LOYALTY_CAP,
            stats.loyalty + LOYALTY_ACTION_BONUS
          );
          // Toughness progress from extortion
          stats.toughnessProgress = (stats.toughnessProgress || 0) + EXTORTION_TOUGHNESS_GAIN;
          if (stats.toughnessProgress >= 1.0 && stats.toughness < 5) {
            stats.toughness += 1;
            stats.toughnessProgress -= 1.0;
          }
        }

        // No auto-move needed — soldiers must already be on the hex
        
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
        const respectPenalty = 3;
        const fearPenalty = 2;
        const extraHeat = 5;
        syncRespect(state, Math.max(0, state.reputation.respect - respectPenalty));
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
    const { negotiationType, targetQ, targetR, targetS, capoId, extraData, isBossNegotiation, targetFamily: actionTargetFamily } = action;

    // Separate cooldowns for Boss and Capo
    const isFamily = isBossNegotiation;
    if (isFamily && (state.bossNegotiationCooldown || 0) > 0) {
      state.pendingNotifications = [...state.pendingNotifications, {
        type: 'warning', title: '⏳ Boss Negotiation Cooldown',
        message: `The Boss must wait ${state.bossNegotiationCooldown} more turn(s) before negotiating again.`,
      }];
      return state;
    }
    if (!isFamily && (state.capoNegotiationCooldown || 0) > 0) {
      state.pendingNotifications = [...state.pendingNotifications, {
        type: 'warning', title: '⏳ Capo Negotiation Cooldown',
        message: `A Capo must wait ${state.capoNegotiationCooldown} more turn(s) before negotiating again.`,
      }];
      return state;
    }

    const config = NEGOTIATION_TYPES.find(n => n.type === negotiationType);
    if (!config) return state;

    let enemyFamily: string;
    let tile: any = null;

    if (isBossNegotiation) {
      // Boss (family-level) — no hex needed
      if (config.scope !== 'family') return state;
      enemyFamily = actionTargetFamily;
      if (!enemyFamily || enemyFamily === state.playerFamily) return state;
    } else {
      // Capo (territory-level)
      if (config.scope !== 'territory') return state;
      tile = state.hexMap.find(t => t.q === targetQ && t.r === targetR && t.s === targetS);
      if (!tile || tile.controllingFamily === state.playerFamily || tile.controllingFamily === 'neutral') return state;

      const capo = state.deployedUnits.find(u => u.id === capoId);
      if (!capo || capo.type !== 'capo' || capo.family !== state.playerFamily) return state;
      enemyFamily = tile.controllingFamily;
    }

    const cost = config.baseCost + (negotiationType === 'bribe_territory' && tile ? (state.deployedUnits.filter(u => u.family === enemyFamily && u.q === targetQ && u.r === targetR && u.s === targetS).length * 2000 + (tile.business?.income || 0)) : 0);
    if (state.resources.money < cost) return state;

    state.resources.money -= cost;
    if (isFamily) {
      state.bossNegotiationCooldown = 2;
    } else {
      state.capoNegotiationCooldown = 2;
    }

    // Reputation cost
    if (config.reputationCost > 0) {
      syncRespect(state, Math.max(0, state.reputation.respect - config.reputationCost));
    }

    // ── SUCCESS ROLL ──
    let totalChance = config.baseSuccess;
    if (!isBossNegotiation && capoId) {
      const capo = state.deployedUnits.find(u => u.id === capoId);
      const capoPersonality = capo?.personality || 'enforcer';
      totalChance += PERSONALITY_BONUSES[capoPersonality]?.[negotiationType] || 0;
      totalChance += PERSONALITY_BONUSES[capoPersonality]?.all || 0;
    }
    totalChance += (state.resources.influence / 100) * 10;
    totalChance += Math.floor(state.reputation.respect / 5);
    // Treachery debuff reduces negotiation success
    if (state.treacheryDebuff && state.treacheryDebuff.turnsRemaining > 0) {
      totalChance -= TREACHERY_NEGOTIATION_PENALTY;
    }
    totalChance = Math.max(5, Math.min(95, totalChance));
    const roll = Math.random() * 100;

    if (roll > totalChance) {
      // Negotiation FAILED — 50% refund
      const refund = Math.floor(cost * NEGOTIATION_REFUND_RATE);
      state.resources.money += refund;
      state.pendingNotifications = [...state.pendingNotifications, {
        type: 'error', title: `❌ ${config.label} Failed!`,
        message: `${enemyFamily.charAt(0).toUpperCase() + enemyFamily.slice(1)} rejected the offer. $${refund.toLocaleString()} refunded (50%). (${Math.round(totalChance)}% chance)`,
      }];
      syncLegacyUnits(state);
      return state;
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
        // Cancel any pending AI hits from this family
        const cancelledCeasefire = (state.aiPlannedHits || []).filter(h => h.family === enemyFamily);
        if (cancelledCeasefire.length > 0) {
          state.aiPlannedHits = state.aiPlannedHits.filter(h => h.family !== enemyFamily);
          state.pendingNotifications = [...state.pendingNotifications, {
            type: 'info', title: '🕊️ Hit Called Off',
            message: `The ${enemyFamily.charAt(0).toUpperCase() + enemyFamily.slice(1)} family called off a planned hit — ceasefire agreement honored.`,
          }];
        }
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'success', title: '🤝 Ceasefire Agreed!',
          message: `${enemyFamily.charAt(0).toUpperCase() + enemyFamily.slice(1)} won't attack for ${duration} turns. -${config.reputationCost} respect.`,
        }];
        break;
      }
      case 'bribe_territory': {
        if (!tile) break;
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
        if (state.reputation.familyRelationships[enemyFamily] !== undefined) {
          state.reputation.familyRelationships[enemyFamily] += 20;
        }
        // Cancel any pending AI hits from this family
        const cancelledAlliance = (state.aiPlannedHits || []).filter(h => h.family === enemyFamily);
        if (cancelledAlliance.length > 0) {
          state.aiPlannedHits = state.aiPlannedHits.filter(h => h.family !== enemyFamily);
          state.pendingNotifications = [...state.pendingNotifications, {
            type: 'info', title: '🕊️ Hit Called Off',
            message: `The ${enemyFamily.charAt(0).toUpperCase() + enemyFamily.slice(1)} family called off a planned hit — alliance pact honored.`,
          }];
        }
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'success', title: '⚖️ Alliance Formed!',
          message: `Pact with ${enemyFamily.charAt(0).toUpperCase() + enemyFamily.slice(1)} for ${duration} turns. Condition: ${condition.type.replace(/_/g, ' ')}.`,
        }];
        break;
      }
      case 'share_profits': {
        if (!tile) break;
        const duration = 5;
        state.shareProfitsPacts = [...(state.shareProfitsPacts || []), {
          id: `share-profits-${Date.now()}`,
          targetFamily: enemyFamily,
          hexQ: targetQ,
          hexR: targetR,
          hexS: targetS,
          incomeShare: 0.3,
          turnsRemaining: duration,
          turnFormed: state.turn,
          active: true,
        }];
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'success', title: '💰 Profit Sharing Deal!',
          message: `You'll earn 30% of this hex's income for ${duration} turns. Cost: $${cost.toLocaleString()}.`,
        }];
        break;
      }
      case 'safe_passage': {
        const duration = 3;
        state.safePassagePacts = [...(state.safePassagePacts || []), {
          id: `safe-passage-${Date.now()}`,
          targetFamily: enemyFamily,
          turnsRemaining: duration,
          turnFormed: state.turn,
          active: true,
        }];
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'success', title: '🛤️ Safe Passage Granted!',
          message: `Free movement through ${enemyFamily.charAt(0).toUpperCase() + enemyFamily.slice(1)} territory for ${duration} turns. Cost: $${cost.toLocaleString()}.`,
        }];
        break;
      }
    }

    syncLegacyUnits(state);
    return state;
  };

  // ============ PROCESS PACTS AT END OF TURN ============
  const processPacts = (state: EnhancedMafiaGameState) => {
    // Tick down seizure penalties on businesses
    state.hexMap.forEach(tile => {
      if (tile.business && tile.business.seizurePenaltyTurns && tile.business.seizurePenaltyTurns > 0) {
        tile.business.seizurePenaltyTurns -= 1;
        if (tile.business.seizurePenaltyTurns <= 0) {
          tile.business.seizurePenaltyTurns = undefined;
          tile.business.wasPlayerBuilt = undefined;
          state.pendingNotifications = [...state.pendingNotifications, {
            type: 'info', title: '💼 Business Stabilized',
            message: `${tile.controllingFamily.charAt(0).toUpperCase() + tile.controllingFamily.slice(1)}'s seized business in ${tile.district} now runs at full revenue.`,
          }];
        }
      }
    });

    // Tick down ceasefires
    state.ceasefires = (state.ceasefires || []).map(c => {
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

    // Tick down treachery debuff
    if (state.treacheryDebuff && state.treacheryDebuff.turnsRemaining > 0) {
      state.treacheryDebuff.turnsRemaining -= 1;
      if (state.treacheryDebuff.turnsRemaining <= 0) {
        state.treacheryDebuff = undefined;
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'info', title: '🕊️ Treachery Forgotten',
          message: `The other families have moved past your ceasefire violation. Negotiation penalties lifted.`,
        }];
      }
    }

    // Tick down alliances and check conditions
    state.alliances = (state.alliances || []).map(a => {
      if (!a.active) return a;
      const remaining = a.turnsRemaining - 1;

      // Check conditions — scan hex map for violations
      a.conditions.forEach(cond => {
        if (cond.violated) return;
        if (cond.type === 'no_attack_family') {
          // Check if any combat log entry this turn shows player attacking the allied family
          const attackedAlly = (state.combatLog || []).some(
            (log: string) => log.includes(a.alliedFamily) && (log.includes('attack') || log.includes('hit') || log.includes('assault'))
          );
          if (attackedAlly) {
            cond.violated = true;
            syncRespect(state, Math.max(0, state.reputation.respect - 15));
            state.pendingNotifications = [...state.pendingNotifications, {
              type: 'error', title: '⚠️ Alliance Violated!',
              message: `You attacked ${a.alliedFamily} — alliance broken! -15 respect.`,
            }];
            a.active = false;
            a.turnsRemaining = 0;
          }
        }
        if (cond.type === 'no_expand_district' && cond.target) {
          // Check if player claimed new hexes in the restricted district
          const playerHexesInDistrict = Object.values(state.hexMap).filter(
            (t: any) => t.controllingFamily === state.playerFamily && t.district === cond.target
          ).length;
          const prevCount = (cond as any)._prevCount || 0;
          if (playerHexesInDistrict > prevCount) {
            cond.violated = true;
            syncRespect(state, Math.max(0, state.reputation.respect - 10));
            state.pendingNotifications = [...state.pendingNotifications, {
              type: 'error', title: '⚠️ Alliance Violated!',
              message: `You expanded into ${cond.target} — alliance with ${a.alliedFamily} broken! -10 respect.`,
            }];
            a.active = false;
            a.turnsRemaining = 0;
          }
          (cond as any)._prevCount = playerHexesInDistrict;
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

    // Tick down share profits pacts
    state.shareProfitsPacts = (state.shareProfitsPacts || []).map(p => {
      if (!p.active) return p;
      const remaining = p.turnsRemaining - 1;
      if (remaining <= 0) {
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'info', title: '💰 Profit Sharing Ended',
          message: `Profit sharing deal with ${p.targetFamily.charAt(0).toUpperCase() + p.targetFamily.slice(1)} has expired.`,
        }];
        return { ...p, turnsRemaining: 0, active: false };
      }
      return { ...p, turnsRemaining: remaining };
    }).filter(p => p.active);

    // Tick down safe passage pacts
    state.safePassagePacts = (state.safePassagePacts || []).map(p => {
      if (!p.active) return p;
      const remaining = p.turnsRemaining - 1;
      if (remaining <= 0) {
        state.pendingNotifications = [...state.pendingNotifications, {
          type: 'info', title: '🛤️ Safe Passage Expired',
          message: `Safe passage through ${p.targetFamily.charAt(0).toUpperCase() + p.targetFamily.slice(1)} territory has ended.`,
        }];
        return { ...p, turnsRemaining: 0, active: false };
      }
      return { ...p, turnsRemaining: remaining };
    }).filter(p => p.active);
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
    skipToActionPhase,
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
