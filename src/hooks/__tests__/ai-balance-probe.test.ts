/** Exploratory AI balance probe — not a pass/fail test. */
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEnhancedMafiaGameState } from "@/hooks/useEnhancedMafiaGameState";

const TURNS = 60;

function probe(family: any, difficulty: any, mapSize: any, seed: number) {
  const { result } = renderHook(() =>
    useEnhancedMafiaGameState(family, undefined, difficulty, seed, mapSize)
  );
  const snaps: any[] = [];
  for (let i = 0; i < TURNS; i++) {
    try {
      act(() => { result.current.advancePhase(); });
      act(() => { result.current.advancePhase(); });
      act(() => { result.current.advancePhase(); });
      act(() => { result.current.endTurn(); });
      const ns: any = result.current.gameState;
      for (const n of (ns.pendingNotifications || [])) {
        if (/RICO|Indicted|Heat|bankrupt|Eliminat/i.test(n.title || "")) console.log(`T${ns.turn} ${n.title} :: ${n.message}`);
      }
      act(() => { result.current.clearNotifications(); });
    } catch { /* ignore */ }
    const s: any = result.current.gameState;
    if (s.turn % 10 === 0 || s.turn === TURNS) {
      const counts: Record<string, number> = {};
      for (const t of s.hexMap) if (t.controllingFamily) counts[t.controllingFamily] = (counts[t.controllingFamily] || 0) + 1;
      snaps.push({
        turn: s.turn,
        phase: s.progressionPhase ?? s.phase,
        counts,
        aiMoney: (s.aiOpponents || []).map((o: any) => Math.round(o.resources.money)),
        aiSoldiers: (s.aiOpponents || []).map((o: any) => (s.deployedUnits || []).filter((u: any) => u.family === o.family).length),
        postures: (s.aiOpponents || []).map((o: any) => `${o.family.slice(0,4)}:${o.posture ?? o.currentPosture ?? "?"}`),
        aiHeat: (s.aiOpponents || []).map((o: any) => `${o.family.slice(0,4)}:${Math.round(o.resources.heat||0)}`),
        elim: s.eliminatedFamilies,
        combatTail: (s.combatLog || []).length,
      });
    }
  }
  const final: any = result.current.gameState;
  return { snaps, log: (final.combatLog || []).slice(-40) };
}

describe("AI balance probe", () => {
  for (const cfg of [
    { f: "gambino", d: "normal", m: "medium", s: 1337 },
    { f: "gambino", d: "hard", m: "medium", s: 77 },
  ] as const) {
    it(`probe ${cfg.f} ${cfg.d} ${cfg.m}`, () => {
      const r = probe(cfg.f, cfg.d, cfg.m, cfg.s);
      console.log(`\n### PROBE ${cfg.d} ${cfg.m}`);
      for (const s of r.snaps) console.log(JSON.stringify(s));
      console.log("LOG:", r.log.slice(-15));
      expect(true).toBe(true);
    }, 180_000);
  }
});
