import { describe, it, expect } from 'vitest';
import {
  predictCounterReaction,
  getPriceAdjustedSuccessChance,
  COUNTER_ACCEPT_SWING,
  COUNTER_WALK_SWING,
} from '@/lib/negotiation-odds';

describe('Negotiation fairness — counter reaction & price modifier', () => {
  it('accepts counters within ±15% of original', () => {
    expect(predictCounterReaction(10000, 9000, 0)).toBe('accept'); // -10%
    expect(predictCounterReaction(10000, 11000, 0)).toBe('accept'); // +10%
  });

  it('re-counters in the 15–40% swing band on the first round', () => {
    expect(predictCounterReaction(10000, 7500, 0)).toBe('recounter'); // -25%
    expect(predictCounterReaction(10000, 13000, 0)).toBe('recounter'); // +30%
  });

  it('walks away on ≥40% swing or after one prior round', () => {
    expect(predictCounterReaction(10000, 5000, 0)).toBe('walk'); // -50%
    expect(predictCounterReaction(10000, 8000, 1)).toBe('walk'); // 20% swing on round 1 → walk
  });

  it('threshold constants match the public contract', () => {
    expect(COUNTER_ACCEPT_SWING).toBe(0.15);
    expect(COUNTER_WALK_SWING).toBe(0.4);
  });

  it('price modifier nudges chance up when you sweeten the pot', () => {
    const baseInput = {
      type: 'supply_deal' as const,
      scope: 'family' as const,
      playerReputation: 20,
      playerInfluence: 10,
      basePrice: 7500,
    };
    const fair = getPriceAdjustedSuccessChance({ ...baseInput, offeredPrice: 7500 });
    const sweet = getPriceAdjustedSuccessChance({ ...baseInput, offeredPrice: 9000 });
    const lowball = getPriceAdjustedSuccessChance({ ...baseInput, offeredPrice: 5000 });
    expect(sweet).toBeGreaterThan(fair);
    expect(lowball).toBeLessThan(fair);
  });
});
