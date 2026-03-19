// ============ HITMAN SYSTEM ============
export interface SoldierStats {
  loyalty: number;       // 1-100
  training: number;      // 1-10
  equipment: number;     // 1-10
  hits: number;
  extortions: number;
  intimidations: number;
  survivedConflicts: number;
}

export interface Hitman {
  unitId: string;         // references DeployedUnit.id
  hitmanLevel: number;    // 1-3
  promotedTurn: number;
}

// ============ BRIBE / CORRUPTION SYSTEM ============
export type BribeTier = 'patrol_officer' | 'police_captain' | 'police_chief' | 'mayor';

export interface BribeTierConfig {
  tier: BribeTier;
  label: string;
  cost: number;
  baseSuccess: number;   // 0-100
  duration: number;       // turns
  description: string;
}

export const BRIBE_TIERS: BribeTierConfig[] = [
  { tier: 'patrol_officer', label: 'Patrol Officer', cost: 500, baseSuccess: 80, duration: 3, description: '-30% street heat, -2 heat/turn' },
  { tier: 'police_captain', label: 'Police Captain', cost: 2000, baseSuccess: 60, duration: 5, description: '20% economic pressure on rival illegal businesses' },
  { tier: 'police_chief', label: 'Police Chief', cost: 8000, baseSuccess: 40, duration: 7, description: '+50% intel on target rival' },
  { tier: 'mayor', label: 'Mayor', cost: 25000, baseSuccess: 25, duration: 10, description: 'Can shut down rival territory' },
];

export interface BribeContract {
  id: string;
  tier: BribeTier;
  turnsRemaining: number;
  targetFamily?: string;  // for captain/chief/mayor
  targetTerritory?: { q: number; r: number; s: number }; // for mayor
  active: boolean;
}

// ============ VICTORY CONDITIONS ============
export interface VictoryProgress {
  territory: { current: number; target: number; met: boolean };
  economic: { current: number; target: number; met: boolean };
  legacy: { current: number; highestRival: number; met: boolean };
}

export type VictoryType = 'territory' | 'economic' | 'legacy' | null;

// ============ FAMILY BONUSES ============
export interface FamilyBonuses {
  combatBonus: number;        // % modifier
  territoryIncome: number;    // % modifier
  intimidation: number;       // % modifier
  businessIncome: number;     // % modifier
  laundering: number;         // % modifier
  businessUpgrade: number;    // % modifier
  hitSuccess: number;         // % modifier
  heatReduction: number;      // % modifier
  intel: number;              // % modifier
  extortion: number;          // % modifier
  fearGeneration: number;     // % modifier
  income: number;             // % modifier
  recruitmentDiscount: number; // % modifier
  reputationGain: number;     // % modifier
}

export const FAMILY_BONUSES: Record<string, FamilyBonuses> = {
  gambino: {
    combatBonus: 25, territoryIncome: 10, intimidation: 15,
    businessIncome: 0, laundering: 0, businessUpgrade: 0,
    hitSuccess: 0, heatReduction: 0, intel: 0,
    extortion: 0, fearGeneration: 0,
    income: 0, recruitmentDiscount: 0, reputationGain: 0,
  },
  genovese: {
    combatBonus: 0, territoryIncome: 0, intimidation: 0,
    businessIncome: 30, laundering: 20, businessUpgrade: 25,
    hitSuccess: 0, heatReduction: 0, intel: 0,
    extortion: 0, fearGeneration: 0,
    income: 0, recruitmentDiscount: 0, reputationGain: 0,
  },
  lucchese: {
    combatBonus: 0, territoryIncome: 0, intimidation: 0,
    businessIncome: 0, laundering: 0, businessUpgrade: 0,
    hitSuccess: 25, heatReduction: 15, intel: 20,
    extortion: 0, fearGeneration: 0,
    income: 0, recruitmentDiscount: 0, reputationGain: 0,
  },
  bonanno: {
    combatBonus: 0, territoryIncome: 0, intimidation: 25,
    businessIncome: 0, laundering: 0, businessUpgrade: 0,
    hitSuccess: 0, heatReduction: 0, intel: 0,
    extortion: 20, fearGeneration: 15,
    income: 0, recruitmentDiscount: 0, reputationGain: 0,
  },
  colombo: {
    combatBonus: 0, territoryIncome: 0, intimidation: 0,
    businessIncome: 0, laundering: 0, businessUpgrade: 0,
    hitSuccess: 0, heatReduction: 0, intel: 0,
    extortion: 0, fearGeneration: 0,
    income: 20, recruitmentDiscount: 15, reputationGain: 10,
  },
};

// ============ BUSINESS TYPES (from doc) ============
export type DocBusinessType = 'brothel' | 'gambling_den' | 'loan_sharking' | 'store_front';

export interface DocBusinessConfig {
  type: DocBusinessType;
  label: string;
  icon: string;
  baseIncome: number;
  baseHeat: number;
  launderingCapacity: number;
}

export const DOC_BUSINESS_TYPES: DocBusinessConfig[] = [
  { type: 'brothel', label: 'Brothel', icon: '💋', baseIncome: 3000, baseHeat: 4, launderingCapacity: 10 },
  { type: 'gambling_den', label: 'Gambling Den', icon: '🎲', baseIncome: 4000, baseHeat: 3, launderingCapacity: 30 },
  { type: 'loan_sharking', label: 'Loan Sharking', icon: '💰', baseIncome: 5000, baseHeat: 5, launderingCapacity: 20 },
  { type: 'store_front', label: 'Store Front', icon: '🏪', baseIncome: 2000, baseHeat: 1, launderingCapacity: 50 },
];

// ============ CAPO PERSONALITY TYPES ============
export type CapoPersonality = 'diplomat' | 'enforcer' | 'schemer';

export const PERSONALITY_BONUSES: Record<CapoPersonality, Record<string, number>> = {
  diplomat:  { ceasefire: 20, bribe_territory: 5,  alliance: 10, all: 0  },
  enforcer:  { ceasefire: 0,  bribe_territory: 15, alliance: 0,  all: 0  },
  schemer:   { ceasefire: 0,  bribe_territory: 0,  alliance: 15, all: 10 },
};

export const PERSONALITY_LABELS: Record<CapoPersonality, { label: string; icon: string; description: string }> = {
  diplomat:  { label: 'Diplomat',  icon: '🕊️', description: '+20% Ceasefire, +10% Alliance' },
  enforcer:  { label: 'Enforcer',  icon: '💪', description: '+15% Bribe for Territory' },
  schemer:   { label: 'Schemer',   icon: '🧠', description: '+15% Alliance, +10% all negotiations' },
};

// ============ NEGOTIATION TYPES ============
export type NegotiationType = 'ceasefire' | 'bribe_territory' | 'alliance';

export interface NegotiationConfig {
  type: NegotiationType;
  label: string;
  icon: string;
  description: string;
  baseSuccess: number; // 0-100
  baseCost: number;
  reputationCost: number;
}

export const NEGOTIATION_TYPES: NegotiationConfig[] = [
  { type: 'ceasefire', label: 'Ceasefire Pact', icon: '🤝', description: 'Both families stop attacking each other for 3-5 turns. Costs reputation.', baseSuccess: 50, baseCost: 3000, reputationCost: 5 },
  { type: 'bribe_territory', label: 'Bribe for Territory', icon: '💵', description: 'Pay to peacefully claim this hex. Cost scales with enemy strength.', baseSuccess: 40, baseCost: 8000, reputationCost: 0 },
  { type: 'alliance', label: 'Form Alliance', icon: '⚖️', description: 'Conditional pact with shared defense. Breaking conditions has severe penalties.', baseSuccess: 30, baseCost: 5000, reputationCost: 0 },
];

// ============ ALLIANCE & CEASEFIRE DATA ============
export interface AllianceCondition {
  type: 'no_expand_district' | 'no_attack_family' | 'share_income';
  target: string;
  violated: boolean;
}

export interface AlliancePact {
  id: string;
  alliedFamily: string;
  conditions: AllianceCondition[];
  turnsRemaining: number;
  turnFormed: number;
  active: boolean;
}

export interface CeasefirePact {
  id: string;
  family: string;
  turnsRemaining: number;
  turnFormed: number;
  active: boolean;
}

// ============ RECRUITMENT COSTS ============
export const SOLDIER_COST = 500;
export const CAPO_COST = 1500;
export const HITMAN_MAINTENANCE_MULTIPLIER = 1.5;
export const MAX_HITMEN = 3;

// Hitman promotion requirements
export const HITMAN_REQUIREMENTS = {
  minStrength: 80,    // maps to training * 10
  minReputation: 50,  // maps to loyalty
  minHits: 3,
};
