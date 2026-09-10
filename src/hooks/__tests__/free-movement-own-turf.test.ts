/**
 * Moving inside your own HQ-linked turf must always be free: no move points,
 * no action — for soldiers and capos alike.
 */
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEnhancedMafiaGameState } from "@/hooks/useEnhancedMafiaGameState";

const setup = () =>
  renderHook(() => useEnhancedMafiaGameState("gambino", undefined, "normal", 1, "medium"));

const ownedTiles = (s: any) =>
  s.hexMap.filter((t: any) => t.controllingFamily === s.playerFamily && !t.isHeadquarters);

describe("Free movement inside connected territory", () => {
  it("a soldier with no move points can still reposition on owned turf for free", () => {
    const { result } = setup();
    const s = result.current.gameState;
    const owned = ownedTiles(s);
    expect(owned.length).toBeGreaterThan(1);

    const soldier = s.deployedUnits.find((u: any) => u.family === s.playerFamily && u.type === "soldier");
    expect(soldier).toBeTruthy();
    const from = owned[0];
    const to = owned[1];
    soldier.q = from.q; soldier.r = from.r; soldier.s = from.s;
    soldier.movesRemaining = 0;

    const before = result.current.gameState.actionsRemaining;

    act(() => { result.current.selectUnit("soldier", { q: from.q, r: from.r, s: from.s }); });
    expect(
      result.current.gameState.availableMoveHexes.some((h: any) => h.q === to.q && h.r === to.r && h.s === to.s)
    ).toBe(true);

    act(() => { result.current.moveUnit({ q: to.q, r: to.r, s: to.s }); });

    const moved = result.current.gameState.deployedUnits.find((u: any) => u.id === soldier.id);
    expect([moved.q, moved.r, moved.s]).toEqual([to.q, to.r, to.s]);
    expect(result.current.gameState.actionsRemaining).toBe(before);
  });

  it("a capo with no move points can still reposition on owned turf for free", () => {
    const { result } = setup();
    const s = result.current.gameState;
    const owned = ownedTiles(s);
    const capo = s.deployedUnits.find((u: any) => u.family === s.playerFamily && u.type === "capo");
    expect(capo).toBeTruthy();

    const from = owned[0];
    const to = owned[owned.length - 1];
    expect(from).not.toBe(to);
    capo.q = from.q; capo.r = from.r; capo.s = from.s;
    capo.movesRemaining = 0;

    const before = result.current.gameState.actionsRemaining;

    act(() => { result.current.selectUnit("capo", { q: from.q, r: from.r, s: from.s }); });
    expect(
      result.current.gameState.availableMoveHexes.some((h: any) => h.q === to.q && h.r === to.r && h.s === to.s)
    ).toBe(true);

    act(() => { result.current.moveUnit({ q: to.q, r: to.r, s: to.s }); });

    const moved = result.current.gameState.deployedUnits.find((u: any) => u.id === capo.id);
    expect([moved.q, moved.r, moved.s]).toEqual([to.q, to.r, to.s]);
    expect(result.current.gameState.actionsRemaining).toBe(before);
  });
});
