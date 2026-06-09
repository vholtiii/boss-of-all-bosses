import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEnhancedMafiaGameState } from '@/hooks/useEnhancedMafiaGameState';

// Locks in the heat-reduction refactor:
//   1. Charitable Donation is blocked while on cooldown.
//   2. Public Appearance + Charity stacked in the same turn → second action's
//      heat reduction is halved (diminishing returns).
//   3. Consigliere Counsel blocks at most one new arrest per turn and pauses
//      the RICO timer while heat is critical.

describe('heat reduction strategy', () => {
  it('blocks Charitable Donation while on cooldown', () => {
    const { result } = renderHook(() => useEnhancedMafiaGameState());

    act(() => {
      result.current.gameState.resources.money = 100000;
      result.current.gameState.actionsRemaining = 5;
      result.current.gameState.policeHeat.level = 80;
    });

    const heatBefore = result.current.gameState.policeHeat.level;
    act(() => {
      result.current.dispatch({ type: 'charitable_donation', amount: 15000 } as any);
    });
    const heatAfterFirst = result.current.gameState.policeHeat.level;
    expect(heatAfterFirst).toBe(heatBefore - 18);
    expect(result.current.gameState.lastCharityTurn).toBe(result.current.gameState.turn);

    // Second donation same turn → cooldown blocks it (no heat change, no spend)
    const moneyBefore = result.current.gameState.resources.money;
    act(() => {
      result.current.dispatch({ type: 'charitable_donation', amount: 15000 } as any);
    });
    expect(result.current.gameState.policeHeat.level).toBe(heatAfterFirst);
    expect(result.current.gameState.resources.money).toBe(moneyBefore);
    const warn = result.current.gameState.pendingNotifications.find(
      (n: any) => n.title === '🤝 Donation Cooldown'
    );
    expect(warn).toBeTruthy();
  });

  it('halves the second heat-reduction action in the same turn', () => {
    const { result } = renderHook(() => useEnhancedMafiaGameState());

    act(() => {
      result.current.gameState.resources.money = 100000;
      result.current.gameState.actionsRemaining = 5;
      result.current.gameState.policeHeat.level = 80;
    });

    // Public appearance first (full -6)
    const h0 = result.current.gameState.policeHeat.level;
    act(() => {
      result.current.dispatch({ type: 'public_appearance', cost: 3000 } as any);
    });
    expect(result.current.gameState.policeHeat.level).toBe(h0 - 6);

    // Charity in same turn — should be halved (18 → 9)
    const h1 = result.current.gameState.policeHeat.level;
    act(() => {
      result.current.dispatch({ type: 'charitable_donation', amount: 15000 } as any);
    });
    expect(result.current.gameState.policeHeat.level).toBe(h1 - 9);
  });

  it('Consigliere blocks one arrest per turn and pauses RICO', () => {
    const { result } = renderHook(() => useEnhancedMafiaGameState());

    act(() => {
      result.current.gameState.resources.money = 200000;
      result.current.gameState.actionsRemaining = 5;
      // Force consigliere active without going through hire flow
      result.current.gameState.lawyerTier = 'consigliere';
      result.current.gameState.lawyerActiveUntil = result.current.gameState.turn + 5;
      result.current.gameState.policeHeat.level = 95; // RICO tier
    });

    const startTurn = result.current.gameState.turn;
    const ricoBefore = result.current.gameState.ricoTimer || 0;

    act(() => {
      result.current.dispatch({ type: 'end_turn' } as any);
    });

    // RICO timer should NOT have incremented (consigliere stalls)
    expect(result.current.gameState.ricoTimer || 0).toBe(ricoBefore);

    // consigliereLastBlockTurn either matches startTurn (used) or stayed 0 (no arrest fired this turn).
    // Either way, no new arrests should have been added to policeHeat.arrests with turn === startTurn.
    const arrestsThisTurn = result.current.gameState.policeHeat.arrests.filter(
      (a: any) => a.turn === startTurn
    );
    expect(arrestsThisTurn.length).toBe(0);
  });
});
