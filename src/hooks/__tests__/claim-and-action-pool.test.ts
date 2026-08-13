/**
 * Soldiers must be able to claim an empty (anchor-free) neutral block while they
 * still have an action, and the action pool must be full again after every turn.
 */
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEnhancedMafiaGameState } from "@/hooks/useEnhancedMafiaGameState";

const HEX_DIRS = [
  { q: 1, r: -1, s: 0 }, { q: 1, r: 0, s: -1 }, { q: 0, r: 1, s: -1 },
  { q: -1, r: 1, s: 0 }, { q: -1, r: 0, s: 1 }, { q: 0, r: -1, s: 1 },
];

describe("Claim on empty blocks + action pool refill", () => {
  it("a soldier standing on an empty neutral block claims it (pending) and spends 1 action", () => {
    const { result } = renderHook(() =>
      useEnhancedMafiaGameState("gambino", undefined, "normal", 1, "medium")
    );

    // Find an empty neutral tile adjacent to a player-owned tile.
    const s = result.current.gameState;
    const owned = s.hexMap.filter((t: any) => t.controllingFamily === s.playerFamily);
    let target: any = null;
    for (const o of owned) {
      for (const d of HEX_DIRS) {
        const t = s.hexMap.find((x: any) => x.q === o.q + d.q && x.r === o.r + d.r && x.s === o.s + d.s);
        if (t && t.controllingFamily === "neutral" && !t.anchor && !t.isHeadquarters && !t.pendingClaim) {
          target = t;
          break;
        }
      }
      if (target) break;
    }
    expect(target).toBeTruthy();

    const soldier = s.deployedUnits.find((u: any) => u.family === s.playerFamily && u.type === "soldier");
    expect(soldier).toBeTruthy();
    // Place the soldier directly on the target block and select it.
    soldier.q = target.q; soldier.r = target.r; soldier.s = target.s;

    const before = result.current.gameState.actionsRemaining;
    expect(before).toBeGreaterThan(0);

    act(() => {
      result.current.performAction({
        type: "claim_territory",
        targetQ: target.q, targetR: target.r, targetS: target.s,
        unitId: soldier.id,
      });
    });

    const after = result.current.gameState;
    const claimed = after.hexMap.find((t: any) => t.q === target.q && t.r === target.r && t.s === target.s);
    expect(claimed.pendingClaim?.family ?? claimed.controllingFamily).toBe(after.playerFamily);
    expect(after.actionsRemaining).toBe(before - 1);
  });

  it("refills the action pool to maxActions after ending a turn with everything spent", () => {
    const { result } = renderHook(() =>
      useEnhancedMafiaGameState("gambino", undefined, "normal", 1, "medium")
    );

    act(() => {
      // Drain the pool through the public API path used by the HUD.
      result.current.setGameState((prev: any) => ({ ...prev, actionsRemaining: 0 }));
    });
    expect(result.current.gameState.actionsRemaining).toBe(0);

    act(() => { result.current.endTurn(); });

    const s = result.current.gameState;
    expect(s.maxActions).toBeGreaterThanOrEqual(3);
    expect(s.actionsRemaining).toBe(s.maxActions);
  });
});
