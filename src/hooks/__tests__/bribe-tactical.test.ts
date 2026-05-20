/**
 * Regression coverage for the Corruption move to the Tactical step.
 *  1. Player: bribe_corruption requires tacticalActionsRemaining > 0.
 *  2. AI: warm-tier heat triggers an aiSpendOnHeatReduction within a few turns.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEnhancedMafiaGameState } from "@/hooks/useEnhancedMafiaGameState";

describe("bribe_corruption — tactical-step contract", () => {
  it("rejects with a warning notification when tacticalActionsRemaining is 0", () => {
    const { result } = renderHook(() =>
      useEnhancedMafiaGameState("gambino", undefined, "normal", 1234, "small")
    );

    act(() => result.current.advancePhase()); // deploy → tactical
    act(() => {
      // Drain tactical budget and unlock phase gate.
      (result.current.gameState as any).tacticalActionsRemaining = 0;
      (result.current.gameState as any).gamePhase = 2;
    });

    const moneyBefore = result.current.gameState.resources.money;
    const bribesBefore = (result.current.gameState.activeBribes || []).length;
    expect(result.current.gameState.tacticalActionsRemaining).toBe(0);

    act(() => {
      result.current.performAction({ type: "bribe_corruption", tier: "patrol_officer" });
    });

    const notes = result.current.gameState.pendingNotifications || [];
    const blocked = notes.find((n: any) => /Tactical Action/i.test(n.title || ""));
    expect(blocked).toBeTruthy();
    expect(result.current.gameState.resources.money).toBe(moneyBefore);
    expect((result.current.gameState.activeBribes || []).length).toBe(bribesBefore);
  });
});

describe("AI heat reduction — warm-tier parity", () => {
  beforeEach(() => {
    // Stable RNG: warm-tier spendChance is ~0.30, force it to fire.
    vi.spyOn(Math, "random").mockReturnValue(0.05);
  });
  afterEach(() => vi.restoreAllMocks());

  it("AI with warm heat (50) reduces it within 3 turns", () => {
    const { result } = renderHook(() =>
      useEnhancedMafiaGameState("gambino", undefined, "normal", 4321, "small")
    );

    // Seed every AI opponent at warm-tier heat with plenty of cash.
    act(() => {
      for (const opp of result.current.gameState.aiOpponents) {
        opp.resources.heat = 50;
        opp.resources.money = 100000;
      }
    });

    const baselineHeats = result.current.gameState.aiOpponents.map(
      (o: any) => o.resources.heat || 0
    );

    for (let i = 0; i < 3; i++) {
      act(() => result.current.advancePhase());
      act(() => result.current.advancePhase());
      act(() => result.current.advancePhase());
      act(() => result.current.endTurn());
    }

    const newHeats = result.current.gameState.aiOpponents.map(
      (o: any) => o.resources.heat || 0
    );
    // At least one AI should have spent on a bribe given the mocked RNG.
    const anyDecreased = newHeats.some((h, i) => h < baselineHeats[i]);
    expect(anyDecreased).toBe(true);
  });
});
