// ============================================================================
// AI ACTION SCORING — weighted gate layer for processAITurn.
//
// Replaces raw `Math.random() < base * mult` gates with a single, testable
// combiner that folds in posture policy, personality, aggression and heat
// caution, and always rolls from the caller's seeded rng for reproducibility.
//
// Pure functions. No React, no state mutation.
// ============================================================================

import type { PosturePolicy } from './ai-posture';
import type { AIPersonality } from './ai-strategy';

export interface ActionGateFactors {
  /** Base probability of taking the action this turn (0..1). */
  base: number;
  /** Personality-driven multiplier (e.g. aggressive 1.5 for offense). Default 1. */
  personalityMul?: number;
  /** Posture-policy multiplier (e.g. policy.offensiveHitMul). Default 1. */
  postureMul?: number;
  /** Difficulty / aggression scale from difficultyModifiers. Default 1. */
  aggressionScale?: number;
  /** Extra additive boost (e.g. heat-tier boost for lay low). Default 0. */
  boost?: number;
  /** Hard suppression — chance becomes 0 (e.g. policy.suppressOffense). */
  suppressed?: boolean;
  /** Clamp bounds. Defaults [0, 0.95]. */
  min?: number;
  max?: number;
}

/** Final probability after folding all factors. Exported for tests/UI. */
export const actionChance = (f: ActionGateFactors): number => {
  if (f.suppressed) return 0;
  const raw = f.base
    * (f.personalityMul ?? 1)
    * (f.postureMul ?? 1)
    * (f.aggressionScale ?? 1)
    + (f.boost ?? 0);
  const min = f.min ?? 0;
  const max = f.max ?? 0.95;
  return Math.min(max, Math.max(min, raw));
};

/** Roll the gate with the caller's seeded rng. */
export const fireGate = (rng: () => number, f: ActionGateFactors): boolean =>
  rng() < actionChance(f);

/**
 * Standard offense-personality multiplier used across offensive gates
 * (plan hits, hitman contracts, flips, HQ assaults).
 */
export const offensePersonalityMul = (p: AIPersonality): number =>
  p === 'aggressive' ? 1.5
  : p === 'opportunistic' ? 1.15
  : p === 'unpredictable' ? 1.0
  : p === 'diplomatic' ? 0.6
  : /* defensive */ 0.5;

/**
 * Standard diplomacy-personality multiplier (sitdowns, ceasefires, alliances).
 */
export const diplomacyPersonalityMul = (p: AIPersonality): number =>
  p === 'diplomatic' ? 1.5
  : p === 'defensive' ? 1.2
  : p === 'opportunistic' ? 1.0
  : p === 'unpredictable' ? 0.9
  : /* aggressive */ 0.6;

/**
 * Convenience: gate an offensive action folding posture policy + personality.
 * `policy.suppressOffense` zeroes the chance; `policy.offensiveHitMul` scales it.
 */
export const fireOffensiveGate = (
  rng: () => number,
  base: number,
  personality: AIPersonality,
  policy: PosturePolicy,
  aggressionScale = 1,
): boolean =>
  fireGate(rng, {
    base,
    personalityMul: offensePersonalityMul(personality),
    postureMul: policy.offensiveHitMul ?? 1,
    aggressionScale,
    suppressed: policy.suppressOffense,
  });

/**
 * Convenience: gate a diplomatic overture folding posture + personality.
 * `policy.seekAllies` (UNDERDOG) boosts, `refuseNewWars` postures lean peaceful too.
 */
export const fireDiplomacyGate = (
  rng: () => number,
  base: number,
  personality: AIPersonality,
  policy: PosturePolicy,
): boolean =>
  fireGate(rng, {
    base,
    personalityMul: diplomacyPersonalityMul(personality),
    boost: policy.seekAllies ? 0.15 : 0,
  });

/** Weighted pick from a list of candidates. Returns null on empty/all-zero. */
export const pickWeighted = <T,>(
  items: Array<{ item: T; weight: number }>,
  rng: () => number,
): T | null => {
  const valid = items.filter(i => i.weight > 0);
  if (valid.length === 0) return null;
  const total = valid.reduce((s, i) => s + i.weight, 0);
  let r = rng() * total;
  for (const i of valid) {
    r -= i.weight;
    if (r <= 0) return i.item;
  }
  return valid[valid.length - 1].item;
};
