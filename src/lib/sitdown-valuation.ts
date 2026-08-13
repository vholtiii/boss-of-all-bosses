// ============================================================================
// SITDOWN VALUATION — deterministic pricing + leverage for the bargaining table
// No dice. Every number here is shown to the player in the Sitdown Scene.
// ============================================================================

import {
  Basket, BasketSettlement, Chip, ChipKind, ChipTemplate, LeverageLine,
  LeverageResult, Verdict, VerdictLevel,
} from '@/types/negotiation';
import { CapoPersonality, NegotiationType } from '@/types/game-mechanics';

// ─── Chip catalog ───────────────────────────────────────────────────────────

export const CHIP_TEMPLATES: ChipTemplate[] = [
  { kind: 'cash', label: 'Cash', icon: '💵', description: 'A lump sum, paid on the spot.', sides: ['player', 'them'], defaultAmount: 5000, scope: 'both' },
  { kind: 'tribute', label: 'Tribute', icon: '💰', description: 'A cut of a block\'s take, every turn.', sides: ['player', 'them'], defaultPct: 0.3, defaultTurns: 5, needsHex: true, scope: 'territory' },
  { kind: 'territory', label: 'The Block', icon: '📍', description: 'Hand the block over, peacefully.', sides: ['player', 'them'], needsHex: true, scope: 'territory' },
  { kind: 'safe_passage', label: 'Safe Passage', icon: '🛤️', description: 'Move through their turf without a fight.', sides: ['player', 'them'], defaultTurns: 3, scope: 'both' },
  { kind: 'ceasefire', label: 'Ceasefire', icon: '🤝', description: 'Guns down on both sides.', sides: ['them'], defaultTurns: 4, scope: 'family' },
  { kind: 'alliance', label: 'Alliance', icon: '⚖️', description: 'Shared defense, with conditions.', sides: ['them'], defaultTurns: 6, scope: 'family' },
  { kind: 'supply_access', label: 'Supply Access', icon: '🚚', description: 'Ride their supply network.', sides: ['player', 'them'], defaultTurns: 5, scope: 'family' },
  { kind: 'intel', label: 'Intel', icon: '🔎', description: 'Full book on their operations.', sides: ['player', 'them'], scope: 'both' },
  { kind: 'favor', label: 'A Favor', icon: '🎩', description: 'An IOU, callable once within 10 turns.', sides: ['player', 'them'], scope: 'both' },
];

export const CHIP_META: Record<ChipKind, { label: string; icon: string }> =
  CHIP_TEMPLATES.reduce((acc, t) => { acc[t.kind] = { label: t.label, icon: t.icon }; return acc; },
    {} as Record<ChipKind, { label: string; icon: string }>);

export const FAVOR_DURATION = 10;

// ─── Chip valuation (dollars-equivalent, from the receiver's point of view) ──

export function valueChip(chip: Chip): number {
  const turns = Math.max(1, chip.turns || 1);
  const income = Math.max(0, chip.hexIncome || 0);
  switch (chip.kind) {
    case 'cash':          return Math.max(0, Math.floor(chip.amount || 0));
    case 'tribute':       return Math.round((income || 1200) * (chip.pct ?? 0.3) * turns);
    case 'territory':     return Math.round(6000 + income * 4);
    case 'safe_passage':  return 1200 * turns;
    case 'ceasefire':     return 2200 * turns;
    case 'alliance':      return 3000 * turns;
    case 'supply_access': return 1800 * turns;
    case 'intel':         return 4500;
    case 'favor':         return 6000;
    default:              return 0;
  }
}

export const basketValue = (basket: Basket, side: 'player' | 'them'): number =>
  basket.chips.filter(c => c.from === side).reduce((sum, c) => sum + valueChip(c), 0);

// ─── Leverage ───────────────────────────────────────────────────────────────

export interface LeverageInput {
  /** Player units in/around the contested area vs theirs. */
  playerForce?: number;
  enemyForce?: number;
  tension?: number;              // 0-100 pair tension
  relationship?: number;         // -100..100
  respect?: number;              // 0-100
  influence?: number;            // 0-100
  fear?: number;                 // 0-100
  capoPersonality?: CapoPersonality;
  scope: 'family' | 'territory';
  treacheryActive?: boolean;
  playerIsRunawayLeader?: boolean;
  atWar?: boolean;
  theyOweFavor?: boolean;
  theyAreDesperate?: boolean;
  /** +15 when they called the sitdown. */
  theyAskedForThis?: boolean;
}

const PERSONALITY_LEVERAGE: Record<CapoPersonality, { label: string; value: number }> = {
  diplomat: { label: 'Diplomat across the table', value: 10 },
  enforcer: { label: 'Enforcer across the table', value: -5 },
  schemer:  { label: 'Schemer across the table', value: 0 },
};

export function computeLeverage(input: LeverageInput): LeverageResult {
  const lines: LeverageLine[] = [];
  const push = (label: string, value: number, detail?: string) => {
    if (value !== 0) lines.push({ label, value, detail });
  };

  if (input.scope === 'territory') {
    const diff = (input.playerForce || 0) - (input.enemyForce || 0);
    push('Guns on the ground', Math.max(-20, Math.min(20, diff * 7)),
      `${input.playerForce || 0} yours vs ${input.enemyForce || 0} theirs`);
    if (input.capoPersonality) {
      const p = PERSONALITY_LEVERAGE[input.capoPersonality];
      push(p.label, p.value);
    }
  }

  push('Your respect', Math.round((input.respect || 0) / 8), `${input.respect || 0} respect`);
  push('Your influence', Math.round((input.influence || 0) / 10), `${input.influence || 0} influence`);
  push('They fear you', Math.round((input.fear || 0) / 12), `${input.fear || 0} fear`);
  push('Standing with them', Math.max(-12, Math.min(12, Math.round((input.relationship || 0) / 8))));

  const tension = input.tension || 0;
  if (tension >= 50) push('Bad blood', -Math.round((tension - 40) / 5), `${tension} tension`);
  else if (tension <= 20) push('Cool heads', 4, `${tension} tension`);

  if (input.atWar) push('Open war', -25, 'Guns are already out');
  if (input.treacheryActive) push('Your treachery', -20, 'Nobody trusts a rat');
  if (input.playerIsRunawayLeader) push('You are winning', -15, 'They won\'t shield the front-runner');
  if (input.theyAskedForThis) push('They called this sitdown', 15);
  if (input.theyAreDesperate) push('They are desperate', 12);
  if (input.theyOweFavor) push('They owe you', 25, 'Calling in a favor');

  const total = lines.reduce((s, l) => s + l.value, 0);
  return { total: Math.max(-60, Math.min(60, total)), lines };
}

// ─── Greed: how much they mark up their own asks ────────────────────────────

export function greedMultiplier(input: LeverageInput): number {
  let g = 1;
  if (input.capoPersonality === 'enforcer') g += 0.15;
  if (input.capoPersonality === 'schemer') g += 0.08;
  if ((input.tension || 0) >= 60) g += 0.15;
  if (input.atWar) g += 0.25;
  if ((input.relationship || 0) >= 40) g -= 0.1;
  if (input.theyAreDesperate) g -= 0.25;
  return Math.max(0.6, Math.min(1.8, g));
}

// ─── Verdict ────────────────────────────────────────────────────────────────

export const VERDICT_LABELS: Record<VerdictLevel, { label: string; hint: string }> = {
  insulted:   { label: 'Insulted',   hint: 'Put this to them and they walk — tension rises.' },
  cold:       { label: 'Cold',       hint: 'They\'ll counter, not sign. Sweeten the pot.' },
  interested: { label: 'Interested', hint: 'They\'ll take this deal.' },
  eager:      { label: 'Eager',      hint: 'They\'d sign this twice.' },
};

export function evaluateBasket(basket: Basket, leverage: LeverageResult, input: LeverageInput): Verdict {
  const offerValue = basketValue(basket, 'player');
  const rawDemand = basketValue(basket, 'them');
  const demandValue = Math.round(rawDemand * greedMultiplier(input));
  const effectiveOffer = Math.round(offerValue * (1 + leverage.total / 100));

  // Nothing asked of them and nothing offered — no deal on the table.
  if (rawDemand <= 0) {
    return {
      level: 'cold', accepts: false, ratio: 0, demandValue, offerValue, effectiveOffer,
      label: 'Nothing on the table', hint: 'Add something you want from them.',
    };
  }

  const ratio = effectiveOffer / Math.max(1, demandValue);
  let level: VerdictLevel;
  if (ratio >= 1.15) level = 'eager';
  else if (ratio >= 0.85) level = 'interested';
  else if (ratio >= 0.55) level = 'cold';
  else level = 'insulted';

  const meta = VERDICT_LABELS[level];
  return {
    level,
    accepts: level === 'interested' || level === 'eager',
    ratio,
    demandValue,
    offerValue,
    effectiveOffer,
    label: meta.label,
    hint: meta.hint,
  };
}

// ─── AI counter ─────────────────────────────────────────────────────────────

/**
 * When the table is "cold", they name a number instead of walking: enough cash
 * from the player to hit ~0.95 of their demand after leverage.
 */
export function aiCounterCash(basket: Basket, leverage: LeverageResult, input: LeverageInput): number {
  const demand = Math.round(basketValue(basket, 'them') * greedMultiplier(input));
  const nonCashOffer = basket.chips
    .filter(c => c.from === 'player' && c.kind !== 'cash')
    .reduce((s, c) => s + valueChip(c), 0);
  const needEffective = demand * 0.95;
  const needRaw = needEffective / Math.max(0.4, 1 + leverage.total / 100);
  const cash = Math.max(0, needRaw - nonCashOffer);
  return Math.max(1000, Math.round(cash / 500) * 500);
}

// ─── Legacy bridge ──────────────────────────────────────────────────────────

const CHIP_TO_DEAL: Partial<Record<ChipKind, NegotiationType>> = {
  territory: 'bribe_territory',
  tribute: 'share_profits',
  safe_passage: 'safe_passage',
  ceasefire: 'ceasefire',
  alliance: 'alliance',
  supply_access: 'supply_deal',
};

/** Deal priority when several asks share a table — the biggest concession wins. */
const DEAL_PRIORITY: ChipKind[] = ['territory', 'alliance', 'ceasefire', 'supply_access', 'tribute', 'safe_passage'];

export function settleBasket(basket: Basket): BasketSettlement {
  const theirChips = basket.chips.filter(c => c.from === 'them');
  let dealType: NegotiationType | null = null;
  for (const kind of DEAL_PRIORITY) {
    if (theirChips.some(c => c.kind === kind)) {
      dealType = CHIP_TO_DEAL[kind] || null;
      break;
    }
  }
  const cash = basket.chips
    .filter(c => c.from === 'player' && c.kind === 'cash')
    .reduce((s, c) => s + Math.max(0, Math.floor(c.amount || 0)), 0);

  const favorChip = basket.chips.find(c => c.kind === 'favor');
  const intelChip = basket.chips.find(c => c.kind === 'intel');

  return {
    dealType,
    cash,
    // A favor GIVEN by them is owed TO the player.
    favorTo: favorChip ? (favorChip.from === 'them' ? 'player' : 'them') : undefined,
    intelTo: intelChip ? (intelChip.from === 'them' ? 'player' : 'them') : undefined,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export const newChip = (partial: Omit<Chip, 'id'>): Chip => ({
  id: `chip-${Math.random().toString(36).slice(2, 9)}`,
  ...partial,
});

export const describeChip = (chip: Chip): string => {
  const turns = chip.turns || 0;
  switch (chip.kind) {
    case 'cash':          return `$${(chip.amount || 0).toLocaleString()}`;
    case 'tribute':       return `${Math.round((chip.pct ?? 0.3) * 100)}% of the take · ${turns} turns`;
    case 'territory':     return chip.hex ? `Block (${chip.hex.q}, ${chip.hex.r})` : 'A block';
    case 'safe_passage':  return `${turns} turns of free movement`;
    case 'ceasefire':     return `${turns} turns, guns down`;
    case 'alliance':      return `${turns} turns, shared defense`;
    case 'supply_access': return `${turns} turns of supply access`;
    case 'intel':         return 'Full book on their operations';
    case 'favor':         return `One favor, ${FAVOR_DURATION} turns to call it`;
    default:              return '';
  }
};
