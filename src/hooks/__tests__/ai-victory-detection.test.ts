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

describe("AI victory detection", () => {
  it("sets aiVictor.type='territory' when an AI controls >= TERRITORY_TARGET hexes", () => {
    const { result } = setup();
    const targetAI = result.current.gameState.aiOpponents[0].family;

    act(() => {
      // Cheat: directly mutate hex map then end turn so updateVictoryProgress runs
      flipHexesTo(result.current.gameState as any, targetAI, 60);
      result.current.endTurn();
    });

    const v = (result.current.gameState as any).aiVictor;
    expect(v).toBeTruthy();
    expect(v.family).toBe(targetAI);
    expect(["territory", "domination"]).toContain(v.type);
  });

  it("sets aiVictor.type='domination' when player is gameOver and one AI survives", () => {
    const { result } = setup();
    const survivor = result.current.gameState.aiOpponents[0].family;
    const others = result.current.gameState.aiOpponents.slice(1).map(o => o.family);

    act(() => {
      const s: any = result.current.gameState;
      s.gameOver = { type: "bankruptcy", turn: s.turn };
      s.eliminatedFamilies = [...(s.eliminatedFamilies || []), ...others];
      result.current.endTurn();
    });

    const v = (result.current.gameState as any).aiVictor;
    expect(v).toBeTruthy();
    expect(v.family).toBe(survivor);
    expect(v.type).toBe("domination");
  });

  it("does not set aiVictor when player victoryType is already set", () => {
    const { result } = setup();
    const targetAI = result.current.gameState.aiOpponents[0].family;

    act(() => {
      const s: any = result.current.gameState;
      // Pre-set player victory before endTurn runs updateVictoryProgress
      s.victoryType = "territory";
      flipHexesTo(s, targetAI, 80);
      result.current.endTurn();
    });

    expect(result.current.gameState.victoryType).toBe("territory");
    expect((result.current.gameState as any).aiVictor).toBeFalsy();
  });
});
