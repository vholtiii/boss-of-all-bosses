/* TEMP AI audit harness — deleted after the report. */
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as fs from "fs";
import { useEnhancedMafiaGameState } from "@/hooks/useEnhancedMafiaGameState";

const HEX_DIRS = [
  { q: 1, r: -1, s: 0 }, { q: 1, r: 0, s: -1 }, { q: 0, r: 1, s: -1 },
  { q: -1, r: 1, s: 0 }, { q: -1, r: 0, s: 1 }, { q: 0, r: -1, s: 1 },
];
const keyOf = (t: any) => `${t.q},${t.r},${t.s}`;
const owned = (s: any, f: string) => s.hexMap.filter((t: any) => t.controllingFamily === f);
function frontier(s: any, fam: string) {
  const own = owned(s, fam);
  const set = new Set(own.map(keyOf));
  const out = new Map<string, any>();
  for (const t of own) for (const d of HEX_DIRS) {
    const n = { q: t.q + d.q, r: t.r + d.r, s: t.s + d.s };
    if (set.has(keyOf(n))) continue;
    const tile = s.hexMap.find((x: any) => x.q === n.q && x.r === n.r && x.s === n.s);
    if (tile && (!tile.controllingFamily || tile.controllingFamily === "neutral")) out.set(keyOf(n), tile);
  }
  return [...out.values()];
}
const unitOn = (s: any, fam: string, h: any) =>
  (s.deployedUnits || []).find((u: any) => u.family === fam && u.q === h.q && u.r === h.r && u.s === h.s);

describe("AI audit", () => {
  it("runs a long game", () => {
    const { result } = renderHook(() =>
      useEnhancedMafiaGameState("gambino" as any, undefined, "normal" as any, 12345, "medium" as any));
    const A = () => result.current as any;
    const errs: string[] = [];
    const safe = (fn: () => void) => { try { act(() => fn()); } catch (e: any) { errs.push(String(e?.message || e)); } };
    const rows: any[] = [];

    for (let i = 0; i < 120; i++) {
      const s0: any = A().gameState;
      const fam = s0.playerFamily;
      if (s0.victoryType) break;
      safe(() => {
        const st: any = A().gameState;
        const avail = st.resources?.soldiers ?? 0;
        for (const f of frontier(st, fam).slice(0, Math.max(0, Math.min(3, avail))))
          A().deployUnit("soldier", { q: f.q, r: f.r, s: f.s }, fam);
      });
      safe(() => A().advancePhase());
      safe(() => { for (const e of A().gameState.events || []) if (e.choices?.length) A().handleEventChoice(e.id, e.choices[0].id); });
      safe(() => A().advancePhase());
      safe(() => {
        const s: any = A().gameState;
        for (const f of frontier(s, fam)) {
          if (A().gameState.actionsRemaining <= 0) break;
          const u = unitOn(A().gameState, fam, f);
          if (!u) continue;
          A().performAction({ type: "claim_territory", targetQ: f.q, targetR: f.r, targetS: f.s, unitId: u.id });
        }
      });
      safe(() => A().advancePhase());
      safe(() => A().endTurn());
      safe(() => A().clearNotifications());

      const s: any = A().gameState;
      rows.push({
        turn: s.turn,
        ai: (s.aiOpponents || []).map((o: any) => ({
          f: o.family, post: o.posture, hex: owned(s, o.family).length,
          money: Math.round(o.resources.money), heat: Math.round(o.resources.heat ?? 0),
          dead: (s.eliminatedFamilies || []).includes(o.family),
        })),
        wars: (s.wars || s.activeWars || []).filter((w: any) => w.active).length,
        aiActions: (s.turnReport?.aiActions || []).map((a: any) => `${a.family}:${a.action}`),
      });
    }
    fs.writeFileSync("/mnt/documents/ai-audit2.json", JSON.stringify({ rows, errs }, null, 1));
    const counts: Record<string, number> = {};
    const postures: Record<string, number> = {};
    for (const r of rows) {
      for (const a of r.aiActions) { const k = a.split(":")[1]; counts[k] = (counts[k] || 0) + 1; }
      for (const o of r.ai) postures[o.post] = (postures[o.post] || 0) + 1;
    }
    console.log("ERRS", errs.length);
    console.log("ACTIONS", JSON.stringify(counts));
    console.log("POSTURES", JSON.stringify(postures));
    console.log("FINAL", JSON.stringify(rows[rows.length - 1]?.ai));
    console.log("MAXWARS", Math.max(...rows.map(r => r.wars)));
    console.log("AVGHEAT", Math.round(rows.reduce((a, r) => a + r.ai.reduce((x: number, o: any) => x + o.heat, 0) / r.ai.length, 0) / rows.length));
    expect(errs.length).toBe(0);
  }, 600000);
});
