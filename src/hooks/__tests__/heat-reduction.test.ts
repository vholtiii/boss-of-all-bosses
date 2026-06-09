import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEnhancedMafiaGameState } from '@/hooks/useEnhancedMafiaGameState';

// Locks in the heat-reduction refactor:
//   1. Charitable Donation is blocked while on cooldown.
//   2. Public Appearance + Charity stacked in the same turn → second action's
//      heat reduction is halved (diminishing returns).
//   3. Consigliere Counsel pauses the RICO timer while heat is critical.

const seed = (state: any, patch: (s: any) => void) => {
  const next = JSON.parse(JSON.stringify(state));
  patch(next);
  return next;
};

describe('heat reduction strategy', () => {
  it('blocks Charitable Donation while on cooldown and applies stacked diminishing returns', () => {
    const { result } = renderHook(() =>
      useEnhancedMafiaGameState('gambino', undefined, 'normal', 1234, 'small'),
    );

    act(() => {
      const next = seed(result.current.gameState, s => {
        s.pendingNotifications = [];
        s.resources.money = 200000;
        s.actionsRemaining = 5;
        s.policeHeat.level = 80;
        s.lastCharityTurn = 0;
        s.lastPublicAppearanceTurn = 0;
      });
      result.current.loadGameState(next);
    });

    const heatBefore = result.current.gameState.policeHeat.level;
    act(() => {
      result.current.performAction({ type: 'charitable_donation', amount: 15000 });
    });
    expect(result.current.gameState.policeHeat.level).toBe(heatBefore - 18);
    expect(result.current.gameState.lastCharityTurn).toBe(result.current.gameState.turn);
    expect(result.current.gameState.charityActiveUntil).toBe(result.current.gameState.turn + 2);

    // Second donation same turn → cooldown blocks it
    const moneyMid = result.current.gameState.resources.money;
    const heatMid = result.current.gameState.policeHeat.level;
    act(() => {
      result.current.performAction({ type: 'charitable_donation', amount: 15000 });
    });
    expect(result.current.gameState.policeHeat.level).toBe(heatMid);
    expect(result.current.gameState.resources.money).toBe(moneyMid);
    expect(
      result.current.gameState.pendingNotifications.some(
        (n: any) => n.title === '🤝 Donation Cooldown',
      ),
    ).toBe(true);
  });

  it('halves the second heat-reduction action in the same turn', () => {
    const { result } = renderHook(() =>
      useEnhancedMafiaGameState('gambino', undefined, 'normal', 1234, 'small'),
    );

    act(() => {
      const next = seed(result.current.gameState, s => {
        s.pendingNotifications = [];
        s.resources.money = 200000;
        s.actionsRemaining = 5;
        s.policeHeat.level = 80;
        s.lastCharityTurn = 0;
        s.lastPublicAppearanceTurn = 0;
      });
      result.current.loadGameState(next);
    });

    const h0 = result.current.gameState.policeHeat.level;
    act(() => {
      result.current.performAction({ type: 'public_appearance', cost: 3000 });
    });
    expect(result.current.gameState.policeHeat.level).toBe(h0 - 6);

    const h1 = result.current.gameState.policeHeat.level;
    act(() => {
      result.current.performAction({ type: 'charitable_donation', amount: 15000 });
    });
    expect(result.current.gameState.policeHeat.level).toBe(h1 - 9);
  });

  it('Consigliere pauses the RICO timer while heat is critical', () => {
    const { result } = renderHook(() =>
      useEnhancedMafiaGameState('gambino', undefined, 'normal', 1234, 'small'),
    );

    act(() => {
      const next = seed(result.current.gameState, s => {
        s.pendingNotifications = [];
        s.resources.money = 200000;
        s.actionsRemaining = 5;
        s.lawyerTier = 'consigliere';
        s.lawyerActiveUntil = s.turn + 5;
        s.lawyerRetainerEndsTurn = s.turn + 5;
        s.policeHeat.level = 95;
        s.ricoTimer = 0;
      });
      result.current.loadGameState(next);
    });

    const ricoBefore = result.current.gameState.ricoTimer || 0;

    act(() => {
      result.current.endTurn();
    });

    expect(result.current.gameState.ricoTimer || 0).toBe(ricoBefore);
  });
});
