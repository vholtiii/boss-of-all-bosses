import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEnhancedMafiaGameState } from '@/hooks/useEnhancedMafiaGameState';
import { getTensionPairKey } from '@/types/game-mechanics';

// Verifies the AI walk-away branch of `counter_supply_sitdown`:
//   - sitdown is removed (no stale or replacement card)
//   - a single "🚫 Counter Rejected" warning notification is emitted
//   - pair tension between player and from-family increases by exactly 5
//
// The accept/re-counter branches are covered by the pure-function tests in
// negotiation-fairness.test.ts (predictCounterReaction). This file locks in
// the reducer's state mutation for the walk-away path specifically.

const seedSitdown = (
  state: any,
  overrides: Partial<{
    id: string;
    fromFamily: string;
    proposedAmount: number;
    originalPrice: number;
    counterRound: number;
    playerIsSupplier: boolean;
  }> = {},
) => {
  const sitdown = {
    id: overrides.id ?? 'sitdown-walk-test',
    fromFamily: overrides.fromFamily ?? 'genovese',
    proposedDeal: 'supply_deal' as const,
    turnRequested: state.turn,
    expiresOnTurn: state.turn + 2,
    successBonus: 15,
    proposedAmount: overrides.proposedAmount ?? 10000,
    originalPrice: overrides.originalPrice ?? 10000,
    counterRound: overrides.counterRound ?? 0,
    playerIsSupplier: overrides.playerIsSupplier ?? false,
  };
  state.incomingSitdowns = [sitdown];
  return sitdown;
};

const runWalkAwayCase = (
  label: string,
  seed: Parameters<typeof seedSitdown>[1],
  counterPrice: number,
) => {
  it(label, () => {
    const { result } = renderHook(() =>
      useEnhancedMafiaGameState('gambino', undefined, 'normal', 1234, 'small'),
    );

    // Seed: clear noise from initial state, install our sitdown, zero out the
    // tension cooldown so the +5 lands deterministically.
    const fromFamily = seed?.fromFamily ?? 'genovese';
    act(() => {
      const next = JSON.parse(JSON.stringify(result.current.gameState));
      next.pendingNotifications = [];
      next.tensionCooldowns = {};
      next.familyTensions = next.familyTensions || {};
      next.familyTensions[getTensionPairKey('gambino', fromFamily)] = 10;
      seedSitdown(next, seed);
      result.current.loadGameState(next);
    });

    const sitdownId = result.current.gameState.incomingSitdowns![0].id;
    const tensionBefore =
      result.current.gameState.familyTensions[
        getTensionPairKey('gambino', fromFamily)
      ] || 0;

    act(() => {
      result.current.performAction({
        type: 'counter_supply_sitdown',
        sitdownId,
        counterPrice,
      });
    });

    const after = result.current.gameState;

    // 1. Sitdown removed, no replacement pushed.
    expect(after.incomingSitdowns ?? []).toHaveLength(0);

    // 2. Exactly one warning notification with the walk-away copy.
    const rejected = after.pendingNotifications.filter(
      n => n.title === '🚫 Counter Rejected',
    );
    expect(rejected).toHaveLength(1);
    expect(rejected[0].type).toBe('warning');
    expect(rejected[0].message).toContain('walked away');
    expect(rejected[0].message.toLowerCase()).toContain(fromFamily);

    // No accept/recounter leakage.
    expect(
      after.pendingNotifications.some(n => n.title === '✅ Counter Accepted'),
    ).toBe(false);
    expect(
      after.pendingNotifications.some(n => n.title === '↩️ They Counter Back'),
    ).toBe(false);

    // 3. Pair tension increased by exactly 5.
    const tensionAfter =
      after.familyTensions[getTensionPairKey('gambino', fromFamily)] || 0;
    expect(tensionAfter - tensionBefore).toBe(5);
  });
};

describe('counter_supply_sitdown — AI walk-away path', () => {
  runWalkAwayCase(
    'greedy 50% lowball on round 0 → walks away',
    { proposedAmount: 10000, originalPrice: 10000, counterRound: 0 },
    5000,
  );

  runWalkAwayCase(
    'mild 10% counter but already on round 1 → walks away',
    { proposedAmount: 10000, originalPrice: 10000, counterRound: 1 },
    11000,
  );

  runWalkAwayCase(
    'supplier asks +100% on round 0 → walks away',
    {
      proposedAmount: 10000,
      originalPrice: 10000,
      counterRound: 0,
      playerIsSupplier: true,
    },
    20000,
  );
});
