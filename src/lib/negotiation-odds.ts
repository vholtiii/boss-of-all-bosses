import {
  NEGOTIATION_TYPES, NegotiationType, PERSONALITY_BONUSES, CapoPersonality,
} from '@/types/game-mechanics';

interface OddsInput {
  type: NegotiationType;
  scope: 'family' | 'territory';
  capoPersonality?: CapoPersonality;
  playerReputation: number;
  playerInfluence?: number;
  playerFear?: number;
  enemyStrength?: number;
  successBonus?: number;
  treacheryActive?: boolean;
}

interface CostInput {
  type: NegotiationType;
  enemyStrength?: number;
  hexIncome?: number;
  override?: number;
}

/** Mirrors NegotiationDialog.getSuccessChance — single source of truth for chip + dialog. */
export function getNegotiationSuccessChance(input: OddsInput): number {
  const config = NEGOTIATION_TYPES.find(n => n.type === input.type);
  if (!config) return 0;
  let chance = config.baseSuccess;
  if (input.scope === 'territory') {
    const personality = input.capoPersonality || 'enforcer';
    const bonuses = PERSONALITY_BONUSES[personality];
    chance += bonuses[input.type] || 0;
    chance += bonuses.all || 0;
    chance += Math.floor(input.playerReputation / 5);
  } else {
    chance += Math.floor(input.playerReputation / 4);
    chance += Math.floor((input.playerInfluence || 0) / 5);
  }
  if (input.type === 'supply_deal') {
    chance += Math.floor((input.playerFear || 0) / 5);
  }
  if (input.type === 'bribe_territory') {
    chance -= (input.enemyStrength || 0) * 5;
  }
  chance += input.successBonus || 0;
  if (input.treacheryActive) chance -= 20;
  return Math.max(5, Math.min(95, chance));
}

/** Mirrors NegotiationDialog.getCost. */
export function getNegotiationCost(input: CostInput): number {
  if (typeof input.override === 'number') return input.override;
  const config = NEGOTIATION_TYPES.find(n => n.type === input.type);
  if (!config) return 0;
  let cost = config.baseCost;
  if (input.type === 'bribe_territory') {
    cost += (input.enemyStrength || 0) * 2000 + (input.hexIncome || 0);
  }
  return cost;
}

// ────────────────────────────────────────────────────────────────────────────
// SUPPLY DEAL DYNAMIC PRICING
// Centralized so AI initiation, player UI, renewals, and counter-offers all
// agree on what a fair price looks like for a given context.
// ────────────────────────────────────────────────────────────────────────────
export interface SupplyDealPriceInput {
  /** How many supply node types the deal would unlock for the buyer. Min 1. */
  nodeTypesGranted: number;
  /** True if the supplier family is currently at war with anyone (premium for risk). */
  supplierAtWar?: boolean;
  /** True if the buyer just lost lines / is desperate (premium for urgency). */
  buyerDesperate?: boolean;
  /** True if buyer/supplier currently have a tension-reduction cooldown active (friendly discount). */
  friendlyRelationship?: boolean;
  /** True if this is a renewal of an existing deal (small loyalty discount). */
  isRenewal?: boolean;
}

export function computeSupplyDealPrice(input: SupplyDealPriceInput): number {
  const base = 5000;
  const nodes = Math.max(1, input.nodeTypesGranted || 1);
  let cost = base + 1500 * nodes;
  if (input.supplierAtWar) cost *= 1.25;
  if (input.buyerDesperate) cost *= 1.5;
  if (input.friendlyRelationship) cost *= 0.85;
  if (input.isRenewal) cost *= 0.9;
  // Round to nearest $500
  return Math.max(2000, Math.round(cost / 500) * 500);
}

// ────────────────────────────────────────────────────────────────────────────
// PRICE-ADJUSTED SUCCESS CHANCE
// Used by NegotiationDialog so the displayed odds react live as the player
// edits the offered amount. Higher bid → better odds, lowball → worse.
// ────────────────────────────────────────────────────────────────────────────
export interface PriceAdjustedOddsInput extends OddsInput {
  basePrice: number;
  offeredPrice: number;
}

export function getPriceAdjustedSuccessChance(input: PriceAdjustedOddsInput): number {
  const baseChance = getNegotiationSuccessChance(input);
  const base = Math.max(1, input.basePrice);
  const ratio = input.offeredPrice / base - 1; // -1..+∞
  const modifier = Math.max(-25, Math.min(25, Math.round(ratio * 20)));
  return Math.max(5, Math.min(95, baseChance + modifier));
}

// ────────────────────────────────────────────────────────────────────────────
// COUNTER REACTION PREDICTION
// Shared swing-based model — used by both the SitdownsPanel preview hint and
// the reducer that resolves `counter_supply_sitdown`. Keep these in sync.
// ────────────────────────────────────────────────────────────────────────────
export type CounterReaction = 'accept' | 'recounter' | 'walk';

export const COUNTER_ACCEPT_SWING = 0.15;
export const COUNTER_WALK_SWING = 0.40;

export function predictCounterReaction(
  originalPrice: number,
  counterPrice: number,
  round: number = 0,
  playerIsSupplier: boolean = false,
): CounterReaction {
  if (originalPrice <= 0) return 'walk';
  // Signed delta from the AI's perspective. If the player is the SUPPLIER, the
  // AI is the buyer — asking for MORE money is the costly direction. If the
  // player is the BUYER (default), offering LESS money is the costly direction.
  const signed = playerIsSupplier
    ? (counterPrice - originalPrice) / originalPrice    // + = bad for AI
    : (originalPrice - counterPrice) / originalPrice;   // + = bad for AI
  // Asymmetric: a generous counter (signed < 0) is always accepted;
  // a costly counter walks past the walk threshold.
  if (signed <= COUNTER_ACCEPT_SWING) {
    // generous, neutral, or only mildly costly within ±15%
    if (Math.abs(signed) <= COUNTER_ACCEPT_SWING) return 'accept';
    return 'accept';
  }
  if (signed >= COUNTER_WALK_SWING || round >= 1) return 'walk';
  return 'recounter';
}


