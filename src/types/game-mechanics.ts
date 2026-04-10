// ============ HITMAN SYSTEM ============
export interface SoldierStats {
  loyalty: number;       // 0-80 for soldiers, 0-99 for capos
  training: number;      // 0-3 (+1 per turn deployed away from HQ)
  hits: number;          // successful hit actions
  extortions: number;    // successful extortion actions
  victories: number;     // 0-5 (+1 per successful extortion or hit)
  toughness: number;     // 0-5 (+1 per survived combat encounter)
  racketeering: number;  // 0-5 (+1 per successful extortion)
  turnsDeployed: number; // internal tracker for training calc
  toughnessProgress: number; // 0.0-1.0 fractional progress toward next toughness point
}

export const CLAIM_TOUGHNESS_GAIN = 0.25; // +0.25 progress per territory claim (4 claims = +1 toughness)
export const EXTORTION_TOUGHNESS_GAIN = 0.3; // +0.3 progress per successful extortion (~3-4 extortions = +1 toughness)

export const SOLDIER_LOYALTY_CAP = 80;
export const CAPO_LOYALTY_CAP = 99;

export interface HitmanContract {
  id: string;
  targetUnitId: string;
  targetFamily: string;
  turnsRemaining: number;
  hiredOnTurn: number;
  cost: number;
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
  { tier: 'police_captain', label: 'Police Captain', cost: 2000, baseSuccess: 60, duration: 5, description: '20% economic pressure + reveals target family positions & intel' },
  { tier: 'police_chief', label: 'Police Chief', cost: 8000, baseSuccess: 40, duration: 7, description: '+50% intel + reveals all rival positions & movements' },
  { tier: 'mayor', label: 'Mayor', cost: 25000, baseSuccess: 25, duration: 10, description: 'Shut down rival territory + full map intel & movements' },
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
  domination: { eliminated: number; target: number; met: boolean };
  commission: { supporting: number; needed: number; met: boolean };
}

export type VictoryType = 'territory' | 'economic' | 'legacy' | 'domination' | 'commission' | null;

// ============ GAMEPLAY PHASES ============
export type GamePhase = 1 | 2 | 3 | 4;

export interface PhaseConfig {
  phase: GamePhase;
  name: string;
  icon: string;
  minTurn: number;
  requirements: {
    minHexes?: number;
    minRespect?: number;
    minCapos?: number;
    minBuiltBusinesses?: number;
    minIncomeOrHexesOrRespect?: { hexes: number; income: number; respect: number }; // OR condition
  };
  unlocks: string[];
}

export const PHASE_CONFIGS: PhaseConfig[] = [
  {
    phase: 1, name: 'Making Your Bones', icon: '🔫', minTurn: 1,
    requirements: {},
    unlocks: ['Move', 'Claim', 'Extort (Neutral)', 'Recruit (Mercenary)', 'Blind Hits'],
  },
  {
    phase: 2, name: 'Establishing Territory', icon: '🏴', minTurn: 9,
    requirements: { minHexes: 8, minRespect: 20 },
    unlocks: ['Scouting', 'Plan Hits', 'Capo Promotion', 'Safehouses', 'Fortification', 'Enemy Extortion', 'Patrol Officer Bribe', 'Boss Sitdown', 'Local Recruitment'],
  },
  {
    phase: 3, name: 'Controlling Territory', icon: '🏛️', minTurn: 18,
    requirements: { minHexes: 20, minCapos: 2, minBuiltBusinesses: 1 },
    unlocks: ['Boss Diplomacy', 'Alliances', 'Ceasefires', 'Captain+ Bribes', 'Hitman Contracts', 'Go to the Mattresses', 'War Summit', 'Flip Soldier'],
  },
  {
    phase: 4, name: 'Boss of All Bosses', icon: '👑', minTurn: 30,
    requirements: { minIncomeOrHexesOrRespect: { hexes: 35, income: 40000, respect: 80 } },
    unlocks: ['Commission Vote', 'HQ Assault'],
  },
];

// ============ COMMISSION VOTE ============
export const COMMISSION_VOTE_COST = 15000;
export const COMMISSION_VOTE_COOLDOWN = 10;
export const COMMISSION_MIN_SURVIVORS = 2;
export const COMMISSION_VOTE_RELATIONSHIP_THRESHOLD = 60;
export const COMMISSION_VOTE_FAILED_RELATIONSHIP_PENALTY = 10;

// ============ HQ ASSAULT & FLIP SOLDIER ============
// ============ SITDOWN (BOSS ACTION) ============
export const SITDOWN_COST = 2000;
export const SITDOWN_COOLDOWN = 5;
export const SITDOWN_LOYALTY_BONUS = 5;
export const SITDOWN_DEFENSE_PER_SOLDIER = 5;

export const HQ_ASSAULT_BASE_CHANCE = 0.15;
export const HQ_DEFENSE_BONUS = 0.30;
export const HQ_ASSAULT_MAX_CHANCE = 0.50;
export const HQ_ASSAULT_MIN_TOUGHNESS = 4;
export const HQ_ASSAULT_MIN_LOYALTY = 70;
export const FLIP_SOLDIER_COST = 5000;
export const FLIP_SOLDIER_BASE_CHANCE = 0.25;
export const FLIP_SOLDIER_FAIL_INFLUENCE_LOSS = 15;

export interface FlippedSoldier {
  unitId: string;
  family: string; // the family that was flipped (target family)
  flippedByFamily: string; // the family that did the flipping
  hqQ: number;
  hqR: number;
  hqS: number;
}

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
    extortion: 0, fearGeneration: 15,
    income: 20, recruitmentDiscount: 15, reputationGain: 0,
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
  diplomat:  { ceasefire: 20, bribe_territory: 5,  alliance: 10, share_profits: 15, safe_passage: 10, all: 0  },
  enforcer:  { ceasefire: 0,  bribe_territory: 15, alliance: 0,  share_profits: 0,  safe_passage: 5,  all: 0  },
  schemer:   { ceasefire: 0,  bribe_territory: 0,  alliance: 15, share_profits: 10, safe_passage: 15, all: 10 },
};

export const PERSONALITY_LABELS: Record<CapoPersonality, { label: string; icon: string; description: string }> = {
  diplomat:  { label: 'Diplomat',  icon: '🕊️', description: '+20% Ceasefire, +15% Share Profits, +10% Alliance/Safe Passage' },
  enforcer:  { label: 'Enforcer',  icon: '💪', description: '+15% Bribe for Territory, +5% Safe Passage' },
  schemer:   { label: 'Schemer',   icon: '🧠', description: '+15% Alliance/Safe Passage, +10% Share Profits, +10% all' },
};

// ============ NEGOTIATION TYPES ============
export type NegotiationType = 'ceasefire' | 'bribe_territory' | 'alliance' | 'share_profits' | 'safe_passage' | 'supply_deal';

export type NegotiationScope = 'family' | 'territory';

export interface NegotiationConfig {
  type: NegotiationType;
  label: string;
  icon: string;
  description: string;
  baseSuccess: number; // 0-100
  baseCost: number;
  reputationCost: number;
  scope: NegotiationScope;
}

export const NEGOTIATION_TYPES: NegotiationConfig[] = [
  { type: 'ceasefire', label: 'Ceasefire Pact', icon: '🤝', description: 'Both families stop attacking each other for 3-5 turns. Costs reputation.', baseSuccess: 50, baseCost: 8000, reputationCost: 5, scope: 'family' },
  { type: 'alliance', label: 'Form Alliance', icon: '⚖️', description: 'Conditional pact with shared defense. Breaking conditions has severe penalties.', baseSuccess: 30, baseCost: 5000, reputationCost: 0, scope: 'family' },
  { type: 'bribe_territory', label: 'Bribe for Territory', icon: '💵', description: 'Pay to peacefully claim this hex. Cost scales with enemy strength.', baseSuccess: 40, baseCost: 8000, reputationCost: 0, scope: 'territory' },
  { type: 'share_profits', label: 'Share Profits', icon: '💰', description: 'Don\'t take the hex — earn 30% of its income each turn for 5 turns.', baseSuccess: 55, baseCost: 3000, reputationCost: 0, scope: 'territory' },
  { type: 'safe_passage', label: 'Safe Passage', icon: '🛤️', description: 'Buy 3 turns of free movement through this family\'s territory without combat.', baseSuccess: 60, baseCost: 2000, reputationCost: 0, scope: 'territory' },
];

export const NEGOTIATION_REFUND_RATE = 0.5; // 50% refund on failure

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

export interface ShareProfitsPact {
  id: string;
  targetFamily: string;
  hexQ: number;
  hexR: number;
  hexS: number;
  incomeShare: number; // 0.3 = 30%
  turnsRemaining: number;
  turnFormed: number;
  active: boolean;
}

export interface SafePassagePact {
  id: string;
  targetFamily: string;
  turnsRemaining: number;
  turnFormed: number;
  active: boolean;
}

// ============ RECRUITMENT COSTS ============
export const SOLDIER_COST = 1500;  // Mercenary (buy) cost
export const LOCAL_SOLDIER_COST = 300;  // Recruited (loyal) cost
export const SOLDIER_MAINTENANCE = 600;  // Per-turn upkeep per soldier
export const RECRUIT_TERRITORY_REQUIREMENT = 10;  // Hexes needed to recruit locally
export const CAPO_COST = 1500;
export const MAX_HITMEN = 3;

// ============ HITMAN CONTRACT SYSTEM ============
export const HITMAN_CONTRACT_COST = 30000;
export const HITMAN_BASE_SUCCESS = 90;       // open field
export const HITMAN_FORTIFIED_SUCCESS = 65;
export const HITMAN_SAFEHOUSE_SUCCESS = 55;
export const HITMAN_HQ_SUCCESS = 40;
export const HITMAN_OPEN_TURNS = 3;
export const HITMAN_FORTIFIED_TURNS = 4;
export const HITMAN_SAFEHOUSE_TURNS = 4;
export const HITMAN_HQ_TURNS = 5;
export const HITMAN_MAX_LIFETIME = 5;
export const HITMAN_REFUND_RATE = 0.5;
export const HITMAN_ALERT_DURATION = 5;

// ============ CAPO PROMOTION ============
export const MAX_CAPOS = 3;
export const CAPO_PROMOTION_COST = 10000;
export const CAPO_PROMOTION_LOYALTY_DISCOUNT = 0.25; // 25% off when loyalty is at cap
export const CAPO_PROMOTION_LOYALTY_THRESHOLD = 80;  // loyalty must be at this value for discount
export const CAPO_PROMOTION_REQUIREMENTS = {
  maxThreshold: 5,        // one stat maxed at 5 triggers discount on the other
  discountedThreshold: 3, // the other stat only needs 3 if one is maxed
  balancedThreshold: 4,   // both stats need 4 if neither is maxed at 5
};

// Helper: check if a soldier meets capo promotion eligibility
export function isCapoPromotionEligible(stats: SoldierStats): boolean {
  const v = stats.victories;
  const r = stats.racketeering;
  return (v >= 5 && r >= 3) || (r >= 5 && v >= 3) || (v >= 4 && r >= 4);
}

// Helper: get promotion cost with loyalty discount
export function getCapoPromotionCost(stats: SoldierStats): number {
  return stats.loyalty >= CAPO_PROMOTION_LOYALTY_THRESHOLD
    ? Math.round(CAPO_PROMOTION_COST * (1 - CAPO_PROMOTION_LOYALTY_DISCOUNT))
    : CAPO_PROMOTION_COST;
}

// Hitman promotion requirements (legacy — kept for reference)
// Hitmen are now external contract killers, not promoted soldiers

// ============ MOVE PHASE TYPES ============
export interface ScoutedHex {
  q: number;
  r: number;
  s: number;
  scoutedTurn: number;
  turnsRemaining: number;
  freshUntilTurn: number; // scoutedTurn + 1 — live data on this turn, stale after
  enemySoldierCount: number;
  enemyFamily: string;
  businessType?: string;
  businessIncome?: number;
  isFortified?: boolean;
  hasSafehouse?: boolean;
}

export interface Safehouse {
  q: number;
  r: number;
  s: number;
  turnsRemaining: number;
  createdTurn: number;
  // Stockpile system
  stockpile: Partial<Record<SupplyNodeType, number>>; // 0-5 per type
  allocationPercent: number; // 0-50, player-configured
  connectedSupplyTypes: SupplyNodeType[]; // derived each turn from BFS
  manualRouteEstablished: boolean; // true if player manually connected via sub-route
  subRoutePath?: Array<{ q: number; r: number; s: number }>; // hex chain for sub-route rendering
}

// Safehouse stockpile constants
export const SAFEHOUSE_MAX_STOCKPILE = 5;
export const SAFEHOUSE_MAX_ALLOCATION = 50;
export const SAFEHOUSE_STOCKPILE_RATE = 1; // units per turn at 50% allocation per node type

export type MoveAction = 'move' | 'scout' | 'fortify' | 'escort' | 'safehouse' | 'send_word';

// ============ PENDING NEGOTIATION (Send Word) ============
export interface PendingNegotiation {
  id: string;
  capoId: string;
  capoName: string;
  capoPersonality: CapoPersonality;
  targetQ: number;
  targetR: number;
  targetS: number;
  targetFamily: string;
  turnRequested: number;
  ready: boolean; // false = just sent, true = available for use next turn
}

export const FORTIFY_DEFENSE_BONUS = 25; // +25% defense
export const FORTIFY_ABANDON_TURNS = 3; // turns with no friendly units before fortification crumbles
export const MAX_FORTIFICATIONS = 4; // max fortifications per family on the map

export interface FortifiedHex {
  q: number;
  r: number;
  s: number;
  family: string;
  fortifiedOnTurn: number;
  abandonedSinceTurn?: number; // turn when last friendly unit left (undefined = occupied)
}
export const FORTIFY_CASUALTY_REDUCTION = 50; // -50% casualties when fortified
export const SCOUT_DURATION = 3; // turns
export const SCOUT_INTEL_BONUS = 15; // +15% hit success on scouted hexes (fresh)
export const SCOUT_STALE_BONUS = 7; // +7% hit success on stale scouted hexes
export const SCOUT_DETECTION_CHANCE = 0.15; // 15% chance scout is detected on enemy hex
export const SAFEHOUSE_DURATION = 5; // turns
export const SAFEHOUSE_COST = 2500;
export const SAFEHOUSE_DEFENSE_BONUS = 10; // +10% defense on safehouse hex
export const SAFEHOUSE_CAPTURE_BOUNTY = 9000; // $ gained by captor
export const SAFEHOUSE_CAPTURE_INTEL_DURATION = 1; // turns of full intel on former owner
export const SAFEHOUSE_TERRITORY_THRESHOLD = 15; // hexes needed for 2nd safehouse
export const MAX_SAFEHOUSES = 2;
export const MAX_ESCORT_SOLDIERS = 2;

// ============ PLAN HIT ============
export const PLAN_HIT_BONUS = 20; // +20% hit success on planned hex
export const PLAN_HIT_DURATION = 2; // expires after 2 turns if unused
export const PLAN_HIT_RELOCATED_BONUS = 10; // +10% bonus when target moved to different hex
export const PLAN_HIT_RELOCATED_HEAT = 5; // +5 heat penalty when chasing relocated target
export const PLAN_HIT_COOLDOWN = 2; // turns before next Plan Hit allowed after relocated execution

export interface PlannedHit {
  q: number;
  r: number;
  s: number;
  targetFamily: string;
  targetUnitId: string;    // specific enemy unit being targeted
  plannerUnitId: string;   // player soldier who planned the hit
  plannedOnTurn: number;
  expiresOnTurn: number;
}

// ============ PLAN HIT FAILURE PENALTIES ============
export const PLAN_HIT_FAIL_REPUTATION = 5;  // -5 respect or fear (whichever is higher)
export const PLAN_HIT_FAIL_LOYALTY = 10;    // -10 loyalty on planner soldier

// ============ PLAN HIT SUCCESS REWARDS ============
export const PLAN_HIT_RESPECT = 10;           // +10 respect on successful plan hit
export const PLAN_HIT_FEAR = 10;              // +10 fear on successful plan hit
export const PLAN_HIT_LOOT = 5000;            // +$5,000 loot bonus on successful plan hit
export const PLAN_HIT_CAPO_INFLUENCE = 15;    // +15 influence when plan hit kills a capo

// ============ ACTION BUDGET ============
export const BASE_ACTIONS_PER_TURN = 2;
export const BONUS_ACTION_RESPECT_THRESHOLD = 50;
export const BONUS_ACTION_INFLUENCE_THRESHOLD = 50;
export const TACTICAL_ACTIONS_PER_TURN = 3;

// ============ BLIND HIT SYSTEM ============
export interface HiddenUnit {
  unitId: string;
  returnsOnTurn: number;
}

export interface AIBounty {
  targetFamily: string;
  fromFamily: string;
  expiresOnTurn: number;
}

export const BLIND_HIT_PENALTY = 0.20;     // -20% success on unscouted hits
export const BLIND_HIT_RESPECT = 15;        // respect gained on unscouted hit victory
export const BLIND_HIT_FEAR = 15;           // fear gained on unscouted hit victory
export const HIDING_DURATION = 3;           // turns a soldier hides after civilian hit
export const BOUNTY_DURATION = 3;           // turns AI prioritizes revenge
export const BLIND_HIT_INFLUENCE_LOSS = 10; // influence lost by targeted family

// ============ INTERNAL FAMILY HIT ============
export const INTERNAL_HIT_LOYALTY_THRESHOLD = 70;  // loyalty below this = eliminated after hiding
export const INTERNAL_HIT_HEAT_REDUCTION = 25;     // heat reduced when family cleans up
export const INTERNAL_HIT_MORALE_RISK = 0.10;      // 10% chance each soldier loses loyalty
export const INTERNAL_HIT_MORALE_PENALTY = 15;     // loyalty lost per affected soldier

// ============ INDIVIDUAL SOLDIER LOYALTY ============
export const LOYALTY_ACTION_BONUS = 2;         // +2 loyalty per successful action (hit, extortion, claim)
export const LOYALTY_COMBAT_BONUS = 5;         // +5 loyalty per survived combat encounter
export const LOYALTY_INCOME_HEX_BONUS = 3;     // +3 loyalty/turn if on hex with business >= threshold
export const LOYALTY_INCOME_HEX_THRESHOLD = 4000; // minimum business income for hex loyalty bonus
export const LOYALTY_UNPAID_PENALTY = 2;       // -2 loyalty/turn when family can't afford maintenance

// ============ CAPO COMBAT PROTECTION ============
export const CAPO_WOUND_LOYALTY_PENALTY = 10;  // -10 loyalty when capo is wounded in combat
export const CAPO_WOUND_MOVE_PENALTY = 1;      // -1 max moves next turn for wounded capo
export const CAPO_WOUND_DURATION = 2;          // wounded state lasts 2 turns
export const CAPO_WOUND_COMBAT_PENALTY = 0.05; // -5% combat effectiveness while wounded

// ============ BUILT VS EXTORTED BUSINESS ============
export const BUILT_BUSINESS_DEFENSE_BONUS = 20;       // +20% defense on player-built business hexes
export const BUILT_BUSINESS_HEAT_REDUCTION = 0.5;    // 50% less heat from player-built businesses
export const BUILT_BUSINESS_RESPECT_THRESHOLD = 3;   // every 3 built businesses grants bonuses
export const BUILT_BUSINESS_RESPECT_BONUS = 1;       // +1 respect per turn per 3 built businesses
export const BUILT_BUSINESS_LOYALTY_BONUS = 1;        // +1 loyalty to all soldiers per turn per 3 built businesses

// ============ BUILT BUSINESS SEIZURE ============
export const BUILT_BIZ_SEIZURE_CEASEFIRE_DURATION = 5;  // 5-turn auto-ceasefire when rival seizes a player-built business
export const BUILT_BIZ_SEIZURE_INCOME_PENALTY = 0.5;    // 50% income during seizure penalty period
export const BUILT_BIZ_SEIZURE_RESPECT_LOSS = 8;        // -8 respect for the family that lost the business
export const BUILT_BIZ_SEIZURE_FEAR_LOSS = 5;           // -5 fear for the family that lost the business
export const BUILT_BIZ_SEIZURE_INFLUENCE_GAIN = 10;     // +10 influence for the family that seized it

// ============ AI PLAN HIT SYSTEM ============
export const AI_PLAN_HIT_CHANCE = 0.15;        // 15% chance per turn for aggressive/opportunistic AI
export const AI_PLAN_HIT_SUCCESS_RATE = 0.5;   // 50% success when executing
export const AI_PLAN_HIT_DURATION = 2;         // turns before AI executes the hit

export type IntelSource = 'scout' | 'bribe_captain' | 'bribe_chief' | 'bribe_mayor';

export const INTEL_SOURCE_LABELS: Record<IntelSource, { label: string; flavorPrefix: string }> = {
  scout: { label: 'Street Scout', flavorPrefix: 'Your soldier overheard' },
  bribe_captain: { label: 'Police Captain', flavorPrefix: 'The Captain tipped you off —' },
  bribe_chief: { label: 'Police Chief', flavorPrefix: 'High-level sources confirm —' },
  bribe_mayor: { label: "Mayor's Office", flavorPrefix: 'Top brass intelligence —' },
};

export interface AIPlannedHit {
  family: string;
  targetUnitId: string;
  turnsRemaining: number;
  plannedOnTurn: number;
  detectedVia?: IntelSource;
  detectedOnTurn?: number;
}

// ============ CEASEFIRE ENFORCEMENT ============
export const CEASEFIRE_VIOLATION_RESPECT_LOSS = 15;
export const CEASEFIRE_VIOLATION_FEAR_LOSS = 10;
export const TREACHERY_DEBUFF_DURATION = 3;        // turns
export const TREACHERY_NEGOTIATION_PENALTY = 20;   // % reduction to all negotiation success

export interface TreacheryDebuff {
  turnsRemaining: number;
  appliedOnTurn: number;
}

// ============ SUPPLY LINES ============
export type SupplyNodeType = 'docks' | 'union_hall' | 'trucking_depot' | 'liquor_route' | 'food_market';

export const SUPPLY_NODE_CONFIG: Record<SupplyNodeType, { label: string; icon: string; districts: string[] }> = {
  docks:           { label: 'Docks',          icon: '⚓', districts: ['Brooklyn', 'Staten Island'] },
  union_hall:      { label: 'Union Hall',     icon: '🔧', districts: ['Bronx', 'Queens'] },
  trucking_depot:  { label: 'Trucking Depot', icon: '🚛', districts: ['Queens', 'Bronx'] },
  liquor_route:    { label: 'Liquor Route',   icon: '🍷', districts: ['Manhattan'] },
  food_market:     { label: 'Food Market',    icon: '🐟', districts: ['Little Italy', 'Brooklyn'] },
};

// Which businesses depend on which supply nodes
// Store Front accepts EITHER food_market OR docks
export const SUPPLY_DEPENDENCIES: Record<string, SupplyNodeType[]> = {
  gambling_den: ['liquor_route'],
  brothel: ['trucking_depot'],
  loan_sharking: ['union_hall'],
  store_front: ['food_market', 'docks'], // needs at least one
  construction: ['union_hall'],
  store: ['food_market', 'docks'],
  restaurant: ['food_market', 'docks'],
  casino: ['liquor_route'],
  drug_trafficking: ['docks'],
  laundromat: ['trucking_depot'],
  prostitution: ['trucking_depot'],
};

export interface SupplyNode {
  type: SupplyNodeType;
  q: number;
  r: number;
  s: number;
  district: string;
}

export interface SupplyStockpileEntry {
  nodeType: SupplyNodeType;
  family: string;
  turnsSinceDisconnected: number; // 0 = connected, 1-2 = buffer, 3+ = decaying
}

export const SUPPLY_DECAY_RATE = 0.10;       // -10% per turn after buffer expires
export const SUPPLY_DECAY_FLOOR = 0.20;       // minimum 20% of max revenue
export const SUPPLY_STOCKPILE_BUFFER = 2;     // 2-turn grace period before decay starts

// ============ TENSION & WAR SYSTEM ============
export const WAR_TENSION_THRESHOLD = 80;
export const WAR_DURATION = 10;
export const WAR_MAX_SIMULTANEOUS = 2;
export const TENSION_DECAY_PER_TURN = 2;
export const WAR_INCOME_PENALTY = 0.20;       // -20% income on border hexes
export const WAR_INCOME_PENALTY_CAP = 0.30;   // -30% max from multiple wars
export const WAR_POST_TENSION = 40;           // tension resets to this after war
export const WAR_POST_RELATIONSHIP = -80;     // relationship resets to this after war
export const ENCROACHMENT_NEIGHBOR_THRESHOLD = 3; // 3+ rival hexes around a neutral claim = encroachment

// Tension builder constants
export const TENSION_TERRITORY_HIT = 10;
export const TENSION_PLAN_HIT_SOLDIER = 15;
// Plan hit on capo = instant war (no numeric value needed)
export const TENSION_EXTORT_RIVAL = 8;
export const TENSION_ENCROACHMENT = 12;
export const TENSION_SUPPLY_SABOTAGE = 15;
export const TENSION_HITMAN_KILL_SOLDIER_GLOBAL = 5;
export const TENSION_HITMAN_KILL_CAPO_GLOBAL = 15;
export const TENSION_PACT_BREAK = 30;

// Tension reducer constants
export const TENSION_REDUCE_CEASEFIRE = 25;
export const TENSION_REDUCE_ALLIANCE = 35;
export const TENSION_REDUCE_SUPPLY_DEAL = 15;
export const TENSION_REDUCE_SHARE_PROFITS = 10;
export const TENSION_REDUCE_SAFE_PASSAGE = 8;
export const TENSION_REDUCE_BRIBE_TERRITORY = 5;

export interface WarState {
  family1: string;
  family2: string;
  turnsRemaining: number;
  startedOnTurn: number;
  trigger: 'tension' | 'capo_hit' | 'declared';
}

// ============ BOSS ACTIONS: DECLARE WAR, MATTRESSES, WAR SUMMIT ============
export const DECLARE_WAR_COST = 10000;

export const MATTRESSES_COST = 5000;
export const MATTRESSES_COOLDOWN = 8;
export const MATTRESSES_DURATION = 3;
export const MATTRESSES_DEFENSE_BONUS = 20;    // +20% unit defense
export const MATTRESSES_HQ_BONUS = 15;          // +15% HQ assault defense
export const MATTRESSES_INCOME_PENALTY = 0.50;  // -50% territory income
export const MATTRESSES_LOYALTY_BONUS = 5;      // +5 loyalty to all soldiers

export interface MattressesState {
  active: boolean;
  turnsRemaining: number;
}

export const WAR_SUMMIT_COST = 5000;
export const WAR_SUMMIT_COOLDOWN = 5;
export const WAR_SUMMIT_DURATION = 2;
export const WAR_SUMMIT_COMBAT_BONUS = 15;     // +15% hit chance
export const WAR_SUMMIT_FEAR_BONUS = 10;        // +10 fear immediately
export const WAR_SUMMIT_HEAT_COST = 8;          // +8 police heat
export const WAR_SUMMIT_LOYALTY_BONUS = 3;      // +3 loyalty to all soldiers

export interface WarSummitState {
  active: boolean;
  turnsRemaining: number;
}

// Helper: get sorted pair key for tension tracking
export const getTensionPairKey = (a: string, b: string): string => {
  return [a, b].sort().join('-');
};

// Helper: get all pair keys for 5 families
export const getAllFamilyPairKeys = (): string[] => {
  const families = ['gambino', 'genovese', 'lucchese', 'bonanno', 'colombo'];
  const pairs: string[] = [];
  for (let i = 0; i < families.length; i++) {
    for (let j = i + 1; j < families.length; j++) {
      pairs.push(getTensionPairKey(families[i], families[j]));
    }
  }
  return pairs;
};
