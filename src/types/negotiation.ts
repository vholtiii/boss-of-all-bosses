// ============================================================================
// THE SITDOWN — bargaining-chip negotiation model
// Replaces the single-price + dice-roll negotiation with a two-sided basket of
// chips valued deterministically, plus a transparent leverage score.
// ============================================================================

import { NegotiationType } from './game-mechanics';

export type ChipKind =
  | 'cash'
  | 'tribute'
  | 'territory'
  | 'safe_passage'
  | 'ceasefire'
  | 'alliance'
  | 'supply_access'
  | 'intel'
  | 'favor';

export type ChipSide = 'player' | 'them';

export interface Chip {
  id: string;
  kind: ChipKind;
  /** Who is GIVING this chip. */
  from: ChipSide;
  /** Cash chips: dollars. */
  amount?: number;
  /** Duration-based chips: turns. */
  turns?: number;
  /** Tribute chips: 0..1 share of the hex income per turn. */
  pct?: number;
  /** Territory / tribute chips: the hex in question. */
  hex?: { q: number; r: number; s: number };
  /** Cached income for the referenced hex (valuation input). */
  hexIncome?: number;
}

export interface Basket {
  chips: Chip[];
}

export type VerdictLevel = 'insulted' | 'cold' | 'interested' | 'eager';

export interface Verdict {
  level: VerdictLevel;
  /** true when they'd sign the basket as it stands. */
  accepts: boolean;
  /** effectiveOffer / demand — 1.0 means exactly their asking value. */
  ratio: number;
  /** What they're asking for, in dollars-equivalent. */
  demandValue: number;
  /** What the player put on the table, in dollars-equivalent. */
  offerValue: number;
  /** Offer after leverage is applied. */
  effectiveOffer: number;
  label: string;
  hint: string;
}

export interface LeverageLine {
  label: string;
  value: number; // percentage points, +/-
  detail?: string;
}

export interface LeverageResult {
  total: number;
  lines: LeverageLine[];
}

/** Descriptor used by the UI to build the "Add chip" menu. */
export interface ChipTemplate {
  kind: ChipKind;
  label: string;
  icon: string;
  description: string;
  /** Sides this chip can be offered from. */
  sides: ChipSide[];
  defaultAmount?: number;
  defaultTurns?: number;
  defaultPct?: number;
  /** Requires a specific hex to be in play. */
  needsHex?: boolean;
  scope: 'family' | 'territory' | 'both';
}

/** A live deal, derived from the existing pact state. */
export interface StandingAgreement {
  id: string;
  kind: ChipKind | 'share_profits';
  family: string;
  label: string;
  icon: string;
  turnsRemaining: number;
  detail?: string;
  /** Net cash per turn for the player, if any. */
  perTurn?: number;
}

/** An IOU handed out at the table. */
export interface DiplomaticFavor {
  id: string;
  family: string;
  /** 'they_owe' = the player can call it in. */
  direction: 'they_owe' | 'you_owe';
  turnsRemaining: number;
  turnGranted: number;
}

/** Legacy bridge — the basket resolves to one settleable deal + a cash amount. */
export interface BasketSettlement {
  dealType: NegotiationType | null;
  cash: number;
  favorTo?: ChipSide;
  intelTo?: ChipSide;
}
