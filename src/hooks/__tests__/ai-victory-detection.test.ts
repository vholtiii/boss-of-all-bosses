/**
 * AI victory detection tests.
 *
 * Drives the real engine via renderHook so updateVictoryProgress runs
 * inside endTurn. We mutate state right before endTurn() to set up the
 * scenario.
 */
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEnhancedMafiaGameState } from "@/hooks/useEnhancedMafiaGameState";

function setup() {
  return renderHook(() => useEnhancedMafiaGameState("gambino", undefined, "normal", 1337, "medium"));
}

function flipHexesTo(state: any, family: string, count: number) {
  let flipped = 0;
  for (const hex of state.hexMap) {
    if (flipped >= count) break;
    if (hex.controllingFamily !== family && !hex.isHeadquarters) {
      hex.controllingFamily = family;
      flipped++;
    }
  }
}

describe("AI victory detection (post-Coronation rework)", () => {
  it("does NOT auto-set aiVictor when an AI controls >= TERRITORY_TARGET hexes (Commission-only now)", () => {
    const { result } = setup();
    const targetAI = result.current.gameState.aiOpponents[0].family;

    act(() => {
      flipHexesTo(result.current.gameState as any, targetAI, 60);
      result.current.endTurn();
    });

    // Territory now only flips a qualifier; AI must call a Commission Vote to actually win
    expect((result.current.gameState as any).aiVictor).toBeFalsy();
  });

  it("sets aiVictor (commission) when player is gameOver and only one rival survives", () => {
    const { result } = setup();
    const survivor = result.current.gameState.aiOpponents[0].family;
    const others = result.current.gameState.aiOpponents.slice(1).map(o => o.family);

    act(() => {
      const s: any = result.current.gameState;
      s.gameOver = { type: "bankruptcy", turn: s.turn };
      s.eliminatedFamilies = [...(s.eliminatedFamilies || []), ...others];
      // Also drop them from aiOpponents so the survivor count == 1
      s.aiOpponents = s.aiOpponents.filter((o: any) => !others.includes(o.family));
      result.current.endTurn();
    });

    const v = (result.current.gameState as any).aiVictor;
    expect(v).toBeTruthy();
    expect(v.family).toBe(survivor);
    expect(v.type).toBe("commission");
  });

  it("player meeting a qualifier does not trigger victoryType (only Commission Vote does)", () => {
    const { result } = setup();

    act(() => {
      const s: any = result.current.gameState;
      flipHexesTo(s, s.playerFamily, 80);
      result.current.endTurn();
    });

    // Qualifier met but no auto-win
    expect(result.current.gameState.victoryType).toBeFalsy();
    expect((result.current.gameState as any).qualifyingConditions).toContain("territory");
  });
});
