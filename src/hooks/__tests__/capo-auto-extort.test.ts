/**
 * Capo auto-extortion must (a) pay the one-off shakedown into the treasury,
 * (b) flag the anchor as extorted so it keeps paying monthly tribute, and
 * (c) show up in the turn summary ledger as "shakedowns".
 */
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEnhancedMafiaGameState } from "@/hooks/useEnhancedMafiaGameState";

const HEX_DIRS = [
  { q: 1, r: -1, s: 0 }, { q: 1, r: 0, s: -1 }, { q: 0, r: 1, s: -1 },
  { q: -1, r: 1, s: 0 }, { q: -1, r: 0, s: 1 }, { q: 0, r: -1, s: 1 },
];

const setup = () =>
  renderHook(() => useEnhancedMafiaGameState("gambino", undefined, "normal", 1, "medium"));

describe("Capo auto-extortion", () => {
  it("flags the anchor as extorted, banks the shakedown, and tallies it in the report", () => {
    const { result } = setup();
    const s = result.current.gameState;

    const capo = s.deployedUnits.find((u: any) => u.family === s.playerFamily && u.type === "capo");
    expect(capo).toBeTruthy();

    // Find a neutral anchor block with an adjacent tile to stage the capo on.
    let target: any = null;
    let from: any = null;
    for (const t of s.hexMap) {
      if (t.controllingFamily !== "neutral" || !t.anchor || t.isHeadquarters) continue;
      for (const d of HEX_DIRS) {
        const n = s.hexMap.find((x: any) => x.q === t.q + d.q && x.r === t.r + d.r && x.s === t.s + d.s);
        if (n && !n.isHeadquarters) { target = t; from = n; break; }
      }
      if (target) break;
    }
    expect(target).toBeTruthy();

    capo.q = from.q; capo.r = from.r; capo.s = from.s;
    capo.movesRemaining = Math.max(1, capo.movesRemaining || 1);

    const moneyBefore = result.current.gameState.resources.money;

    act(() => { result.current.selectUnit("capo", { q: from.q, r: from.r, s: from.s }); });
    act(() => { result.current.moveUnit({ q: target.q, r: target.r, s: target.s }); });

    const after = result.current.gameState;
    const tile = after.hexMap.find((t: any) => t.q === target.q && t.r === target.r && t.s === target.s);

    expect(tile.anchor).toBeTruthy();
    expect(tile.anchor.isExtorted).toBe(true);
    expect(tile.anchor.extortedBy).toBe(after.playerFamily);
    expect(tile.controllingFamily).toBe(after.playerFamily);

    const gained = after.resources.money - moneyBefore;
    expect(gained).toBeGreaterThan(0);
    expect(after.shakedownIncomeThisTurn).toBe(gained);

    act(() => { result.current.endTurn(); });

    const post = result.current.gameState;
    expect(post.turnReport?.incomeBreakdown?.shakedowns).toBe(gained);
    // Counter resets for the new turn.
    expect(post.shakedownIncomeThisTurn).toBe(0);
  });
});
