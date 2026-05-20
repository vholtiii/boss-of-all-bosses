/**
 * Plan Hit two-step contract:
 *   1. MARK runs in the Tactical step (sets plannedHit, spends 1 tactical action).
 *   2. EXECUTE runs in the Action step (consumes 1 action, clears plannedHit).
 *   3. Trying to execute via the enemy-hex dialog with no plannedHit must abort with a warning.
 */
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEnhancedMafiaGameState } from "@/hooks/useEnhancedMafiaGameState";

function setupGame() {
  const hook = renderHook(() =>
    useEnhancedMafiaGameState("gambino", undefined, "normal", 7777, "small")
  );
  // Phase gate
  act(() => {
    (hook.result.current.gameState as any).gamePhase = 2;
  });
  return hook;
}

describe("plan_hit — two-turn contract", () => {
  it("mark step requires Tactical phase and a scouted target", () => {
    const { result } = setupGame();

    // Pick the player's first soldier and an enemy-controlled hex
    const state: any = result.current.gameState;
    const playerSoldier = state.deployedUnits.find(
      (u: any) => u.family === state.playerFamily && u.type === "soldier"
    );
    const enemyTile = state.hexMap.find(
      (t: any) =>
        t.controllingFamily &&
        t.controllingFamily !== "neutral" &&
        t.controllingFamily !== state.playerFamily
    );
    expect(playerSoldier).toBeTruthy();
    expect(enemyTile).toBeTruthy();
    const enemyUnit = state.deployedUnits.find(
      (u: any) =>
        u.q === enemyTile.q &&
        u.r === enemyTile.r &&
        u.s === enemyTile.s &&
        u.family === enemyTile.controllingFamily
    );
    if (!enemyUnit) return; // bail if no enemy units on map seed

    // Advance to Tactical and force-scout the hex
    act(() => result.current.advancePhase()); // deploy → tactical
    act(() => {
      const s: any = result.current.gameState;
      s.scoutedHexes = [
        ...(s.scoutedHexes || []),
        { q: enemyTile.q, r: enemyTile.r, s: enemyTile.s, turnScouted: s.turn },
      ];
      s.tacticalActionsRemaining = 3;
    });

    const tacticalBefore = result.current.gameState.tacticalActionsRemaining;
    const actionsBefore = result.current.gameState.actionsRemaining;

    act(() => {
      result.current.performAction({
        type: "plan_hit",
        plannerUnitId: playerSoldier.id,
        targetUnitId: enemyUnit.id,
      });
    });

    const after: any = result.current.gameState;
    expect(after.plannedHit).toBeTruthy();
    expect(after.plannedHit.targetUnitId).toBe(enemyUnit.id);
    expect(after.tacticalActionsRemaining).toBe(tacticalBefore - 1);
    // MARK must NOT spend an action-step token
    expect(after.actionsRemaining).toBe(actionsBefore);
  });

  it("resolveEnemyHexAction('plan_hit') without an active plan warns and aborts", () => {
    const { result } = setupGame();

    // Manually stage a pendingEnemyHexAction with no plannedHit
    act(() => {
      const s: any = result.current.gameState;
      const soldier = s.deployedUnits.find(
        (u: any) => u.family === s.playerFamily && u.type === "soldier"
      );
      const enemyTile = s.hexMap.find(
        (t: any) =>
          t.controllingFamily &&
          t.controllingFamily !== "neutral" &&
          t.controllingFamily !== s.playerFamily
      );
      if (!soldier || !enemyTile) return;
      s.pendingEnemyHexAction = {
        unitId: soldier.id,
        fromQ: soldier.q,
        fromR: soldier.r,
        fromS: soldier.s,
        toQ: enemyTile.q,
        toR: enemyTile.r,
        toS: enemyTile.s,
      };
      s.plannedHit = null;
    });

    if (!result.current.gameState.pendingEnemyHexAction) return;

    act(() => result.current.resolveEnemyHexAction("plan_hit"));

    const after: any = result.current.gameState;
    expect(after.pendingEnemyHexAction).toBeNull();
    const warn = (after.pendingNotifications || []).find((n: any) =>
      /No Active Plan/i.test(n.title || "")
    );
    expect(warn).toBeTruthy();
  });
});
