/**
 * AI offensive aggression scaling by difficulty.
 *
 * Single source of truth for "how aggressive should new AI offensive trees feel
 * at this difficulty?" Every new offensive roll (plan hit, hitman, sabotage,
 * supply-line targeting, retaliation, coordinated strike, HQ assault) reads
 * from these tables so we can tune the whole offensive profile from one place.
 *
 * Design goal: Normal should feel like "the AI finally pushes back" — not
 * "the AI hunts me every turn." Hard inherits the full offensive package;
 * Easy stays near current (pre-update) behavior.
 */

import type { AIDifficulty } from './ai-strategy';

/** Global offensive aggression scalar applied to most new rolls/bonuses. */
export function getAggressionScale(d: AIDifficulty | undefined): number {
  switch (d) {
    case 'easy':   return 0.6;
    case 'hard':   return 1.4;
    case 'normal':
    default:       return 1.0;
  }
}

/** HQ-assault base success chance before defense penalty. Easy/Normal/Hard. */
export function getHQAssaultBase(d: AIDifficulty | undefined): number {
  switch (d) {
    case 'easy':   return 0.22;
    case 'hard':   return 0.32;
    case 'normal':
    default:       return 0.28;
  }
}

/** Plan-hit base chance per turn (per eligible AI). */
export function getPlanHitBase(d: AIDifficulty | undefined): number {
  switch (d) {
    case 'easy':   return 0.17;
    case 'hard':   return 0.24;
    case 'normal':
    default:       return 0.20;
  }
}

/** Hitman per-turn chance, split by war state. */
export function getHitmanChance(d: AIDifficulty | undefined, atWar: boolean): number {
  if (atWar) {
    switch (d) {
      case 'easy':   return 0.20;
      case 'hard':   return 0.32;
      case 'normal':
      default:       return 0.26;
    }
  }
  switch (d) {
    case 'easy':   return 0.10;
    case 'hard':   return 0.18;
    case 'normal':
    default:       return 0.14;
  }
}

/** Score-bonus weight added in scoreHexForAI when a hex is a reachable rival supply node. */
export function getSupplyNodeScoreBonus(d: AIDifficulty | undefined): number {
  switch (d) {
    case 'easy':   return 5;
    case 'hard':   return 9;
    case 'normal':
    default:       return 7;
  }
}

/** Probability of routing the move target-pool to reachable enemy supply nodes when present. */
export function getSupplyNodeRoutingChance(d: AIDifficulty | undefined): number {
  switch (d) {
    case 'easy':   return 0.55;
    case 'hard':   return 0.85;
    case 'normal':
    default:       return 0.70;
  }
}

/**
 * Strike radius (in hexes) from an AI's HQ inside which rival supply nodes are
 * considered "reachable" for offensive targeting. Scales with map size to match
 * the existing supply-line radius scaling.
 */
export function getSupplyStrikeRadius(mapSize: 'small' | 'medium' | 'large' | undefined): number {
  switch (mapSize) {
    case 'small': return 4;
    case 'large': return 6;
    case 'medium':
    default:      return 5;
  }
}
