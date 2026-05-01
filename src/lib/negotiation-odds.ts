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
