/**
 * Strategy-driven simulation harness.
 *
 * Three sims, each plays through with an active player policy pursuing a
 * distinct winning strategy:
 *   1. Territory Conqueror  — claim/extort hexes, deploy soldiers outward
 *   2. Economic Tycoon      — build businesses, bribe officials, fortify
 *   3. Diplomatic Commission — sitdowns, accept incoming, commission vote
 *
 * The strategies are intentionally simple. They use only the public hook API
 * and no-op when conditions aren't met. The point is to exercise code paths
 * passive play never touches and surface bugs / dead-ends.
 *
 * Reports go to /mnt/documents/strategy-sim-{1,2,3}.{json,md} plus a rollup
 * /mnt/documents/strategy-sim-summary.md.
 *
 * Usage:
 *   bunx vitest run src/hooks/__tests__/strategy-simulation.test.ts
 */
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as fs from "fs";
import * as path from "path";
import { useEnhancedMafiaGameState } from "@/hooks/useEnhancedMafiaGameState";

type FamilyId = "gambino" | "genovese" | "lucchese" | "bonanno" | "colombo";

const MAX_TURNS = 200;
const OUT_DIR = "/mnt/documents";

// ── Hex helpers (inline; getHexNeighbors not exported) ─────────────
const HEX_DIRS = [
  { q: 1, r: -1, s: 0 }, { q: 1, r: 0, s: -1 }, { q: 0, r: 1, s: -1 },
  { q: -1, r: 1, s: 0 }, { q: -1, r: 0, s: 1 }, { q: 0, r: -1, s: 1 },
];
const neighborsOf = (q: number, r: number, s: number) =>
  HEX_DIRS.map(d => ({ q: q + d.q, r: r + d.r, s: s + d.s }));

const keyOf = (t: { q: number; r: number; s: number }) => `${t.q},${t.r},${t.s}`;

// ── Strategy interface ─────────────────────────────────────────────
interface HookApi {
  gameState: any;
  endTurn: () => void;
  advancePhase: () => void;
  performAction: (a: any) => void;
  performBusinessAction: (a: any) => void;
  selectTerritory: (t: any) => void;
  moveUnit: (q: number, r: number, s: number) => void;
  deployUnit: (type: "soldier" | "capo", loc: { q: number; r: number; s: number }, family: string) => void;
  fortifyUnit: () => void;
  clearNotifications: () => void;
  handleEventChoice: (eventId: string, choiceId: string) => void;
}

interface StrategyPolicy {
  name: string;
  family: FamilyId;
  difficulty: "easy" | "normal" | "hard";
  mapSize: "small" | "medium" | "large";
  seed: number;
  // Called once per turn at each phase. Phase: "deploy" | "tactical" | "action".
  step: (phase: "deploy" | "tactical" | "action", api: HookApi) => void;
}

// ── Common helpers ────────────────────────────────────────────────
function ownedHexes(s: any, fam: string) {
  return s.hexMap.filter((t: any) => t.controllingFamily === fam);
}
function neutralFrontier(s: any, fam: string) {
  const owned = ownedHexes(s, fam);
  const ownedSet = new Set(owned.map(keyOf));
  const cand = new Map<string, any>();
  for (const t of owned) {
    for (const n of neighborsOf(t.q, t.r, t.s)) {
      const k = keyOf(n);
      if (ownedSet.has(k)) continue;
      const tile = s.hexMap.find((x: any) => x.q === n.q && x.r === n.r && x.s === n.s);
      if (tile && (!tile.controllingFamily || tile.controllingFamily === "neutral")) {
        cand.set(k, tile);
      }
    }
  }
  return [...cand.values()];
}
function unitOnHex(s: any, fam: string, q: number, r: number, ss: number) {
  return (s.deployedUnits || []).find(
    (u: any) => u.family === fam && u.q === q && u.r === r && u.s === ss
  );
}
function autoResolveEvents(api: HookApi) {
  const evs = api.gameState.events || [];
  for (const e of evs) {
    if (e.choices?.length) api.handleEventChoice(e.id, e.choices[0].id);
  }
}

// ──────────────────────────────────────────────────────────────────
// Strategy 1: TERRITORY CONQUEROR
// ──────────────────────────────────────────────────────────────────
const conqueror: StrategyPolicy = {
  name: "Territory Conqueror",
  family: "gambino",
  difficulty: "normal",
  mapSize: "medium",
  seed: 1337,
  step(phase, api) {
    const s = api.gameState;
    const fam = s.playerFamily;
    if (phase === "deploy") {
      // Push soldiers from HQ to frontier hexes
      const frontier = neutralFrontier(s, fam).slice(0, 3);
      for (const f of frontier) {
        try { api.deployUnit("soldier", { q: f.q, r: f.r, s: f.s }, fam); } catch {}
      }
    } else if (phase === "tactical") {
      autoResolveEvents(api);
      // Heat management (tactical-step spend)
      if ((s.tacticalActionsRemaining ?? 0) > 0 && (s.policeHeat?.level ?? 0) >= 60 && (s.gamePhase || 1) >= 2) {
        try { api.performAction({ type: "bribe_corruption", tier: "patrol_officer" }); } catch {}
      }
    } else {
      // Action: claim or extort each frontier hex with our soldier on it
      const frontier = neutralFrontier(s, fam);
      for (const f of frontier) {
        if (s.actionsRemaining <= 0) break;
        const u = unitOnHex(s, fam, f.q, f.r, f.s);
        if (!u) continue;
        try { } catch {}
        try {
          api.performAction({
            type: "claim_territory",
            targetQ: f.q, targetR: f.r, targetS: f.s, unitId: u.id,
          });
        } catch {}
      }
      // Recruit if low on soldiers
      if ((s.resources?.soldiers ?? 0) < 4 && s.resources?.money > 8000 && s.actionsRemaining > 0) {
        try { api.performAction({ type: "recruit_local_soldier" }); } catch {}
      }
    }
  },
};

// ──────────────────────────────────────────────────────────────────
// Strategy 2: ECONOMIC TYCOON
// ──────────────────────────────────────────────────────────────────
const tycoon: StrategyPolicy = {
  name: "Economic Tycoon",
  family: "lucchese",
  difficulty: "normal",
  mapSize: "medium",
  seed: 4242,
  step(phase, api) {
    const s = api.gameState;
    const fam = s.playerFamily;
    if (phase === "deploy") {
      // Modest expansion: claim only first 6 frontier hexes total
      const owned = ownedHexes(s, fam).length;
      if (owned < 8) {
        const frontier = neutralFrontier(s, fam).slice(0, 2);
        for (const f of frontier) {
          try { api.deployUnit("soldier", { q: f.q, r: f.r, s: f.s }, fam); } catch {}
        }
      }
    } else if (phase === "tactical") {
      autoResolveEvents(api);
      // Fortify HQ-area units
      const hq = s.headquarters?.[fam];
      if (hq) {
        const u = (s.deployedUnits || []).find(
          (x: any) => x.family === fam && x.q === hq.q && x.r === hq.r && x.s === hq.s
        );
        if (u) {
          try { api.fortifyUnit(); } catch {}
        }
      }
    } else {
      // Build businesses
      if (s.actionsRemaining > 0 && (s.resources?.money ?? 0) > 25000) {
        try { api.performAction({ type: "build_business", businessType: "restaurant" }); } catch {}
        // If placement mode opened, place on first owned non-HQ hex with capo
        const target = ownedHexes(s, fam).find((t: any) => !t.isHeadquarters);
        if (target) {
          try {
            api.performAction({
              type: "place_business_on_hex",
              targetQ: target.q, targetR: target.r, targetS: target.s,
            });
          } catch {}
        }
      }
      // Hire lawyer + bribe early
      if (s.actionsRemaining > 0 && (s.resources?.money ?? 0) > 10000 && (s.policeHeat?.level ?? 0) > 30) {
        try { api.performAction({ type: "hire_lawyer" }); } catch {}
      }
      if (s.actionsRemaining > 0 && (s.gamePhase || 1) >= 2 && (s.resources?.money ?? 0) > 5000) {
        try { api.performAction({ type: "bribe_corruption", tier: "patrol_officer" }); } catch {}
      }
      // Claim frontier with deployed soldiers
      const frontier = neutralFrontier(s, fam);
      for (const f of frontier) {
        if (s.actionsRemaining <= 0) break;
        const u = unitOnHex(s, fam, f.q, f.r, f.s);
        if (!u) continue;
        try {
          
          api.performAction({ type: "claim_territory", targetQ: f.q, targetR: f.r, targetS: f.s, unitId: u.id });
        } catch {}
      }
    }
  },
};

// ──────────────────────────────────────────────────────────────────
// Strategy 3: DIPLOMATIC COMMISSION
// ──────────────────────────────────────────────────────────────────
const diplomat: StrategyPolicy = {
  name: "Diplomatic Commission",
  family: "bonanno",
  difficulty: "normal",
  mapSize: "small",
  seed: 9001,
  step(phase, api) {
    const s = api.gameState;
    const fam = s.playerFamily;
    if (phase === "deploy") {
      // Minimal expansion
      const owned = ownedHexes(s, fam).length;
      if (owned < 5) {
        const frontier = neutralFrontier(s, fam).slice(0, 1);
        for (const f of frontier) {
          try { api.deployUnit("soldier", { q: f.q, r: f.r, s: f.s }, fam); } catch {}
        }
      }
    } else if (phase === "tactical") {
      autoResolveEvents(api);
      // Accept all incoming sitdowns
      for (const sd of s.incomingSitdowns || []) {
        try { api.performAction({ type: "accept_incoming_sitdown", sitdownId: sd.id }); } catch {}
      }
    } else {
      // Phase 2+: call sitdowns to build alliances
      if ((s.gamePhase || 1) >= 2) {
        for (const opp of (s.aiOpponents || []).slice(0, 2)) {
          try {
            api.performAction({
              type: "call_sitdown", targetFamily: opp.family, dealType: "alliance",
            });
          } catch {}
        }
      }
      // Phase 4: trigger commission vote
      if ((s.gamePhase || 1) >= 4) {
        try { api.performAction({ type: "commission_vote" }); } catch {}
      }
      // Heat management
      if ((s.policeHeat?.level ?? 0) >= 50 && (s.gamePhase || 1) >= 2) {
        try { api.performAction({ type: "bribe_corruption", tier: "patrol_officer" }); } catch {}
      }
      // Claim frontier (low aggression)
      const frontier = neutralFrontier(s, fam).slice(0, 1);
      for (const f of frontier) {
        if (s.actionsRemaining <= 0) break;
        const u = unitOnHex(s, fam, f.q, f.r, f.s);
        if (!u) continue;
        try {
          
          api.performAction({ type: "claim_territory", targetQ: f.q, targetR: f.r, targetS: f.s, unitId: u.id });
        } catch {}
      }
    }
  },
};

// ──────────────────────────────────────────────────────────────────
// Anomaly scanner (mirrors simulation.test.ts)
// ──────────────────────────────────────────────────────────────────
function scanAnomalies(state: any, turn: number): string[] {
  const out: string[] = [];
  if (Number.isNaN(state.resources?.money)) out.push(`T${turn}: player money is NaN`);
  if (!Number.isFinite(state.resources?.money)) out.push(`T${turn}: player money not finite (${state.resources?.money})`);
  if ((state.resources?.soldiers ?? 0) < 0) out.push(`T${turn}: player soldiers < 0`);
  for (const opp of state.aiOpponents || []) {
    if (Number.isNaN(opp.resources?.money)) out.push(`T${turn}: AI ${opp.family} money is NaN`);
    if (!Number.isFinite(opp.resources?.money)) out.push(`T${turn}: AI ${opp.family} money not finite`);
    if ((opp.resources?.soldiers ?? 0) < 0) out.push(`T${turn}: AI ${opp.family} soldiers < 0`);
  }
  const hexKeys = new Set(state.hexMap.map((t: any) => `${t.q},${t.r},${t.s}`));
  for (const u of state.deployedUnits || []) {
    if (!hexKeys.has(`${u.q},${u.r},${u.s}`))
      out.push(`T${turn}: orphan unit ${u.id} (${u.family}/${u.type})`);
  }
  const validFam = new Set(["gambino", "genovese", "bonanno", "lucchese", "colombo", "neutral"]);
  for (const t of state.hexMap) {
    if (t.controllingFamily && !validFam.has(t.controllingFamily))
      out.push(`T${turn}: hex unknown family "${t.controllingFamily}"`);
  }
  const eliminated = new Set(state.eliminatedFamilies || []);
  for (const p of [...(state.alliances || []), ...(state.shareProfitsPacts || []), ...(state.safePassagePacts || []), ...(state.supplyDealPacts || [])]) {
    if (p.active) {
      for (const f of [p.alliedFamily, p.targetFamily, p.buyerFamily].filter(Boolean)) {
        if (eliminated.has(f)) out.push(`T${turn}: active pact references eliminated ${f}`);
      }
    }
  }
  const stack = new Map<string, number>();
  for (const u of state.deployedUnits || []) {
    const k = `${u.family}|${u.q},${u.r},${u.s}`;
    stack.set(k, (stack.get(k) || 0) + 1);
  }
  for (const [k, n] of stack) {
    if (n > 2) {
      const [, c] = k.split("|");
      const hex = state.hexMap.find((t: any) => `${t.q},${t.r},${t.s}` === c);
      if (!hex?.isHeadquarters) out.push(`T${turn}: ${n} friendly units at ${c}`);
    }
  }
  return out;
}

function checkAIVictory(state: any) {
  const T = state.mapSize === "small" ? 40 : state.mapSize === "large" ? 80 : 60;
  for (const opp of state.aiOpponents || []) {
    const hexes = state.hexMap.filter((t: any) => t.controllingFamily === opp.family).length;
    if (hexes >= T) return { family: opp.family, type: "territory" };
    if ((opp.resources?.lastTurnIncome || 0) >= 50000) return { family: opp.family, type: "economic" };
  }
  if (state.gameOver) {
    const elim = new Set(state.eliminatedFamilies || []);
    const survivors = (state.aiOpponents || []).filter((o: any) => !elim.has(o.family));
    if (survivors.length === 1) return { family: survivors[0].family, type: "last-standing" };
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────
// Run one sim
// ──────────────────────────────────────────────────────────────────
interface SimReport {
  policy: string;
  config: any;
  winner: string | null;
  winType: string | null;
  endTurn: number;
  endReason: string;
  errors: { turn: number; phase: string; msg: string }[];
  anomalies: string[];
  timeline: any[];
  finalStandings: any[];
  notifications: { turn: number; type: string; title: string; message: string }[];
  combatLog: string[];
}

function runSim(p: StrategyPolicy): SimReport {
  const report: SimReport = {
    policy: p.name,
    config: { family: p.family, difficulty: p.difficulty, mapSize: p.mapSize, seed: p.seed },
    winner: null, winType: null, endTurn: 0, endReason: "max_turns",
    errors: [], anomalies: [], timeline: [],
    finalStandings: [], notifications: [], combatLog: [],
  };

  const { result } = renderHook(() =>
    useEnhancedMafiaGameState(p.family, undefined, p.difficulty, p.seed, p.mapSize)
  );
  const api = (): HookApi => result.current as any;

  const safe = (label: string, fn: () => void) => {
    try { act(() => fn()); }
    catch (e: any) {
      report.errors.push({
        turn: result.current.gameState.turn,
        phase: label,
        msg: (e?.message || String(e)).slice(0, 240),
      });
    }
  };

  for (let i = 0; i < MAX_TURNS; i++) {
    safe("advance->deploy", () => api().advancePhase());
    safe("policy:deploy", () => p.step("deploy", api()));
    safe("advance->tactical", () => api().advancePhase());
    safe("policy:tactical", () => p.step("tactical", api()));
    safe("advance->action", () => api().advancePhase());
    safe("policy:action", () => p.step("action", api()));
    safe("endTurn", () => api().endTurn());

    const s: any = result.current.gameState;
    for (const n of s.pendingNotifications || []) {
      report.notifications.push({ turn: s.turn, type: n.type, title: n.title, message: n.message });
    }
    safe("clear", () => api().clearNotifications());
    report.anomalies.push(...scanAnomalies(s, s.turn));

    if (s.turn % 10 === 0) {
      const playerHexes = s.hexMap.filter((t: any) => t.controllingFamily === s.playerFamily).length;
      report.timeline.push({
        turn: s.turn,
        phase: s.gamePhase,
        playerHexes, money: s.resources.money, soldiers: s.resources.soldiers,
        income: s.resources.lastTurnIncome ?? 0,
        respect: s.reputation.respect, influence: s.resources.influence ?? 0,
        heat: s.policeHeat?.level ?? 0,
        ai: (s.aiOpponents || []).map((o: any) => ({
          fam: o.family, posture: o.posture,
          hexes: s.hexMap.filter((t: any) => t.controllingFamily === o.family).length,
          money: o.resources.money, heat: o.resources.heat ?? 0,
        })),
      });
    }

    if (s.victoryType) {
      report.winner = s.playerFamily; report.winType = s.victoryType;
      report.endTurn = s.turn; report.endReason = "player_victory"; break;
    }
    const aiWin = checkAIVictory(s);
    if (aiWin) {
      report.winner = aiWin.family; report.winType = aiWin.type;
      report.endTurn = s.turn;
      report.endReason = s.gameOver ? "player_eliminated_ai_won" : "ai_victory";
      break;
    }
  }

  const final: any = result.current.gameState;
  report.endTurn = report.endTurn || final.turn;
  if (!report.winner) report.endReason = "stalemate_max_turns";
  report.combatLog = (final.combatLog || []).slice(-50);

  const playerHexes = final.hexMap.filter((t: any) => t.controllingFamily === final.playerFamily).length;
  report.finalStandings.push({
    family: final.playerFamily, isPlayer: true, hexes: playerHexes,
    money: final.resources.money, soldiers: final.resources.soldiers,
    respect: final.reputation.respect, influence: final.resources.influence ?? 0,
    eliminated: !!final.gameOver,
  });
  for (const opp of final.aiOpponents || []) {
    report.finalStandings.push({
      family: opp.family, isPlayer: false,
      hexes: final.hexMap.filter((t: any) => t.controllingFamily === opp.family).length,
      money: opp.resources.money, soldiers: opp.resources.soldiers,
      respect: opp.resources?.respect ?? 0, influence: opp.resources?.influence ?? 0,
      eliminated: (final.eliminatedFamilies || []).includes(opp.family),
      personality: opp.personality, posture: opp.posture,
    });
  }
  return report;
}

function writeReport(n: number, r: SimReport) {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, `strategy-sim-${n}.json`), JSON.stringify(r, null, 2));
  const md: string[] = [];
  md.push(`# Strategy Sim ${n} — ${r.policy}`);
  md.push("");
  md.push(`**Config:** ${r.config.family} / ${r.config.difficulty} / ${r.config.mapSize} / seed ${r.config.seed}`);
  md.push(`**Outcome:** winner=${r.winner ?? "—"} (${r.winType ?? r.endReason}) on turn ${r.endTurn}`);
  md.push("");
  md.push("## Final Standings");
  md.push("| Family | Player | Hexes | Money | Soldiers | Respect | Influence | Eliminated |");
  md.push("|---|---|---|---|---|---|---|---|");
  for (const s of r.finalStandings) {
    md.push(`| ${s.family} | ${s.isPlayer ? "✓" : ""} | ${s.hexes} | ${s.money} | ${s.soldiers} | ${s.respect} | ${s.influence} | ${s.eliminated ? "💀" : ""} |`);
  }
  md.push("");
  md.push(`## Errors (${r.errors.length})`);
  for (const e of r.errors.slice(0, 30)) md.push(`- T${e.turn} [${e.phase}]: ${e.msg}`);
  md.push("");
  md.push(`## Anomalies (${r.anomalies.length} raw)`);
  const seen = new Set<string>();
  for (const a of r.anomalies) {
    const key = a.replace(/T\d+: /, "");
    if (seen.has(key)) continue;
    seen.add(key);
    md.push(`- ${a}`);
    if (seen.size > 40) break;
  }
  md.push("");
  md.push(`## Progress Timeline`);
  md.push("| Turn | Phase | Hexes | Money | Income | Respect | Infl | Heat |");
  md.push("|---|---|---|---|---|---|---|---|");
  for (const t of r.timeline) {
    md.push(`| ${t.turn} | ${t.phase} | ${t.playerHexes} | ${t.money} | ${t.income} | ${t.respect} | ${t.influence} | ${t.heat} |`);
  }
  md.push("");
  md.push(`## Last 30 Notifications`);
  for (const n2 of r.notifications.slice(-30)) md.push(`- T${n2.turn} [${n2.type}] **${n2.title}** — ${n2.message}`);
  fs.writeFileSync(path.join(OUT_DIR, `strategy-sim-${n}.md`), md.join("\n"));
}

const POLICIES: StrategyPolicy[] = [conqueror, tycoon, diplomat];

describe("Strategy-driven simulations", () => {
  const reports: SimReport[] = [];
  for (let i = 0; i < POLICIES.length; i++) {
    const p = POLICIES[i];
    it(`strategy ${i + 1}: ${p.name}`, () => {
      const r = runSim(p);
      writeReport(i + 1, r);
      reports.push(r);
      console.log(`\n=== ${p.name} ===`);
      console.log(`Outcome: winner=${r.winner ?? "—"} type=${r.winType ?? r.endReason} turn=${r.endTurn}`);
      console.log(`Errors=${r.errors.length} Anomalies=${r.anomalies.length}`);
      if (r.errors.length) console.log("First errors:", r.errors.slice(0, 5));
      expect(r.endTurn).toBeGreaterThan(0);
    }, 180_000);
  }
  it("write summary", () => {
    if (reports.length !== POLICIES.length) return;
    const md: string[] = [];
    md.push("# Strategy Sim Summary");
    md.push("");
    md.push("| Strategy | Winner | Win Type | End Turn | Errors | Anomalies |");
    md.push("|---|---|---|---|---|---|");
    for (const r of reports) {
      md.push(`| ${r.policy} | ${r.winner ?? "—"} | ${r.winType ?? r.endReason} | ${r.endTurn} | ${r.errors.length} | ${r.anomalies.length} |`);
    }
    md.push("");
    md.push("## Most common anomaly per sim");
    for (const r of reports) {
      const counts = new Map<string, number>();
      for (const a of r.anomalies) {
        const k = a.replace(/T\d+: /, "");
        counts.set(k, (counts.get(k) || 0) + 1);
      }
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
      md.push(`- **${r.policy}**: ${top ? `${top[0]} (×${top[1]})` : "none"}`);
    }
    md.push("");
    md.push("## Most common error phase per sim");
    for (const r of reports) {
      const counts = new Map<string, number>();
      for (const e of r.errors) counts.set(e.phase, (counts.get(e.phase) || 0) + 1);
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
      md.push(`- **${r.policy}**: ${top ? `${top[0]} (×${top[1]})` : "none"}`);
    }
    fs.writeFileSync(path.join(OUT_DIR, "strategy-sim-summary.md"), md.join("\n"));
    expect(true).toBe(true);
  });
});
