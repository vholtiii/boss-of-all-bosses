/**
 * Headless game simulation harness.
 *
 * Drives the real useEnhancedMafiaGameState hook via renderHook + act so the
 * full per-turn engine pipeline (income, AI turns, weather, events, bribes,
 * pacts, influence, war/tension, RICO, bankruptcy) executes exactly as in the
 * UI. The "player" is a passive policy: never moves, never attacks, just
 * advances phases and ends turns.
 *
 * Goal: surface runtime errors and gameplay holes — not to play well.
 *
 * Usage:
 *   bunx vitest run src/hooks/__tests__/simulation.test.ts -t "sim"
 */
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as fs from "fs";
import * as path from "path";
import { useEnhancedMafiaGameState, createInitialGameState } from "@/hooks/useEnhancedMafiaGameState";

type FamilyId = "gambino" | "genovese" | "lucchese" | "bonanno" | "colombo";

const MAX_TURNS = 200;
const OUT_DIR = "/mnt/documents";

interface SimConfig {
  name: string;
  family: FamilyId;
  difficulty: "easy" | "normal" | "hard";
  mapSize: "small" | "medium" | "large";
  seed: number;
}

interface SimReport {
  config: SimConfig;
  winner: string | null;
  winType: string | null;
  endTurn: number;
  endReason: string;
  errors: { turn: number; phase: string; msg: string; stack?: string }[];
  anomalies: string[];
  finalStandings: any[];
  notifications: { turn: number; type: string; title: string; message: string }[];
  combatLog: string[];
}

// ───────────────────────────────────────────────────────────────────
// Symmetric AI victory detection (harness-only — game itself only
// detects player victory)
// ───────────────────────────────────────────────────────────────────
function checkAIVictory(state: any): { family: string; type: string } | null {
  const TERRITORY_TARGET = state.mapSize === "small" ? 40 : state.mapSize === "large" ? 80 : 60;
  for (const opp of state.aiOpponents || []) {
    const fam = opp.family;
    const hexes = state.hexMap.filter((t: any) => t.controllingFamily === fam).length;
    if (hexes >= TERRITORY_TARGET) return { family: fam, type: "territory" };
    if ((opp.resources?.lastTurnIncome || 0) >= 50000) return { family: fam, type: "economic" };
  }
  // Domination: any family that's the only non-eliminated one
  const eliminated = new Set(state.eliminatedFamilies || []);
  const playerDead = !!state.gameOver;
  if (playerDead) {
    const survivors = (state.aiOpponents || []).filter((o: any) => !eliminated.has(o.family));
    if (survivors.length === 1) return { family: survivors[0].family, type: "last-standing" };
  }
  return null;
}

// ───────────────────────────────────────────────────────────────────
// Anomaly scanner — looks for impossible state
// ───────────────────────────────────────────────────────────────────
function scanAnomalies(state: any, turn: number): string[] {
  const out: string[] = [];
  if (Number.isNaN(state.resources?.money)) out.push(`T${turn}: player money is NaN`);
  if (!Number.isFinite(state.resources?.money)) out.push(`T${turn}: player money not finite (${state.resources?.money})`);
  if ((state.resources?.soldiers ?? 0) < 0) out.push(`T${turn}: player soldiers < 0 (${state.resources.soldiers})`);

  for (const opp of state.aiOpponents || []) {
    if (Number.isNaN(opp.resources?.money)) out.push(`T${turn}: AI ${opp.family} money is NaN`);
    if (!Number.isFinite(opp.resources?.money)) out.push(`T${turn}: AI ${opp.family} money not finite`);
    if ((opp.resources?.soldiers ?? 0) < 0) out.push(`T${turn}: AI ${opp.family} soldiers < 0`);
  }

  // Orphan units — point at a hex that doesn't exist
  const hexKeys = new Set(state.hexMap.map((t: any) => `${t.q},${t.r},${t.s}`));
  for (const u of state.deployedUnits || []) {
    const k = `${u.q},${u.r},${u.s}`;
    if (!hexKeys.has(k)) out.push(`T${turn}: orphan unit ${u.id} (${u.family}/${u.type}) at ${k}`);
  }

  // Unknown controllingFamily values
  const validFamilies = new Set(["gambino", "genovese", "bonanno", "lucchese", "colombo", "neutral"]);
  for (const t of state.hexMap) {
    if (t.controllingFamily && !validFamilies.has(t.controllingFamily)) {
      out.push(`T${turn}: hex ${t.q},${t.r},${t.s} has unknown family "${t.controllingFamily}"`);
    }
  }

  // Pacts referencing eliminated families
  const eliminated = new Set(state.eliminatedFamilies || []);
  for (const p of [...(state.alliances || []), ...(state.shareProfitsPacts || []), ...(state.safePassagePacts || []), ...(state.supplyDealPacts || [])]) {
    if (p.active) {
      const fams = [p.alliedFamily, p.targetFamily, p.buyerFamily].filter(Boolean);
      for (const f of fams) {
        if (eliminated.has(f)) out.push(`T${turn}: active pact references eliminated family ${f}`);
      }
    }
  }

  // > 2 friendly units per non-HQ hex (the actual movement-rule check;
  // 3+ mixed-family units can transiently exist when a capo lands on an
  // enemy-occupied hex before combat resolves)
  const friendlyStack = new Map<string, number>();
  for (const u of state.deployedUnits || []) {
    const k = `${u.family}|${u.q},${u.r},${u.s}`;
    friendlyStack.set(k, (friendlyStack.get(k) || 0) + 1);
  }
  for (const [k, n] of friendlyStack) {
    if (n > 2) {
      const [, coords] = k.split("|");
      const hex = state.hexMap.find((t: any) => `${t.q},${t.r},${t.s}` === coords);
      if (!hex?.isHeadquarters) out.push(`T${turn}: hex ${coords} has ${n} friendly units (limit 2)`);
    }
  }

  return out;
}

function runOneSim(config: SimConfig): SimReport {
  const report: SimReport = {
    config,
    winner: null,
    winType: null,
    endTurn: 0,
    endReason: "max_turns",
    errors: [],
    anomalies: [],
    finalStandings: [],
    notifications: [],
    combatLog: [],
  };

  const { result } = renderHook(() =>
    useEnhancedMafiaGameState(config.family, undefined, config.difficulty, config.seed, config.mapSize)
  );

  const safeAct = (label: string, fn: () => void) => {
    try {
      act(() => fn());
    } catch (e: any) {
      report.errors.push({
        turn: result.current.gameState.turn,
        phase: label,
        msg: e?.message || String(e),
        stack: e?.stack?.split("\n").slice(0, 4).join("\n"),
      });
    }
  };

  for (let i = 0; i < MAX_TURNS; i++) {
    const turn = result.current.gameState.turn;

    // Drive: deploy → move → action → endTurn
    safeAct("advancePhase-1", () => result.current.advancePhase());
    safeAct("advancePhase-2", () => result.current.advancePhase());
    safeAct("advancePhase-3", () => result.current.advancePhase());
    safeAct("endTurn", () => result.current.endTurn());

    const s: any = result.current.gameState;

    // Capture new notifications & combat log from this turn
    for (const n of s.pendingNotifications || []) {
      report.notifications.push({ turn: s.turn, type: n.type, title: n.title, message: n.message });
    }
    safeAct("clearNotifications", () => result.current.clearNotifications());

    // Anomaly scan
    report.anomalies.push(...scanAnomalies(s, s.turn));

    // Player victory?
    if (s.victoryType) {
      report.winner = s.playerFamily;
      report.winType = s.victoryType;
      report.endTurn = s.turn;
      report.endReason = "player_victory";
      break;
    }
    // Player game-over (bankruptcy/RICO/assassination) → keep going to detect AI winner
    // unless ALL families dead.
    const aiWin = checkAIVictory(s);
    if (aiWin) {
      report.winner = aiWin.family;
      report.winType = aiWin.type;
      report.endTurn = s.turn;
      report.endReason = s.gameOver ? "player_eliminated_ai_won" : "ai_victory";
      break;
    }

    if (s.gameOver && i > 50) {
      // Player dead AND no AI winner emerging — give it 50 more turns then stop
      // (tracked by adjusting MAX_TURNS check via endReason)
    }
  }

  const final: any = result.current.gameState;
  report.endTurn = report.endTurn || final.turn;
  if (!report.winner) report.endReason = "stalemate_max_turns";

  // Combat log (last 100 entries)
  report.combatLog = (final.combatLog || []).slice(-100);

  // Final standings
  const playerHexes = final.hexMap.filter((t: any) => t.controllingFamily === final.playerFamily).length;
  report.finalStandings.push({
    family: final.playerFamily,
    isPlayer: true,
    hexes: playerHexes,
    money: final.resources.money,
    soldiers: final.resources.soldiers,
    respect: final.reputation.respect,
    influence: final.reputation.streetInfluence,
    eliminated: !!final.gameOver,
    gameOver: final.gameOver,
  });
  for (const opp of final.aiOpponents || []) {
    const hexes = final.hexMap.filter((t: any) => t.controllingFamily === opp.family).length;
    report.finalStandings.push({
      family: opp.family,
      isPlayer: false,
      hexes,
      money: opp.resources.money,
      soldiers: opp.resources.soldiers,
      respect: opp.resources?.respect ?? 0,
      influence: opp.resources?.influence ?? 0,
      eliminated: (final.eliminatedFamilies || []).includes(opp.family),
      personality: opp.personality,
    });
  }

  return report;
}

function writeReport(n: number, r: SimReport) {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, `sim-report-${n}.json`), JSON.stringify(r, null, 2));

  const md: string[] = [];
  md.push(`# Sim ${n} — ${r.config.name}`);
  md.push("");
  md.push(`**Config:** ${r.config.family} / ${r.config.difficulty} / ${r.config.mapSize} map / seed ${r.config.seed}`);
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
  md.push(`## Anomalies (${r.anomalies.length})`);
  // Dedupe
  const seen = new Set<string>();
  for (const a of r.anomalies) {
    const key = a.replace(/T\d+: /, "");
    if (seen.has(key)) continue;
    seen.add(key);
    md.push(`- ${a}`);
    if (seen.size > 50) break;
  }
  md.push("");
  md.push(`## Sample Notifications (last 30 of ${r.notifications.length})`);
  for (const n of r.notifications.slice(-30)) md.push(`- T${n.turn} [${n.type}] **${n.title}** — ${n.message}`);

  fs.writeFileSync(path.join(OUT_DIR, `sim-report-${n}.md`), md.join("\n"));
}

const SIMS: SimConfig[] = [
  { name: "Gambino normal medium", family: "gambino", difficulty: "normal", mapSize: "medium", seed: 1337 },
  { name: "Colombo hard large",    family: "colombo", difficulty: "hard",   mapSize: "large",  seed: 4242 },
  { name: "Bonanno easy small",    family: "bonanno", difficulty: "easy",   mapSize: "small",  seed: 9001 },
];

describe("Game simulation harness", () => {
  for (let i = 0; i < SIMS.length; i++) {
    const cfg = SIMS[i];
    it(`sim ${i + 1}: ${cfg.name}`, () => {
      const r = runOneSim(cfg);
      writeReport(i + 1, r);
      console.log(`\n=== SIM ${i + 1}: ${cfg.name} ===`);
      console.log(`Outcome: winner=${r.winner ?? "—"} type=${r.winType ?? r.endReason} turn=${r.endTurn}`);
      console.log(`Errors: ${r.errors.length}, Anomalies: ${r.anomalies.length}`);
      if (r.errors.length) console.log("First errors:", r.errors.slice(0, 5));
      // Don't fail on stalemates / errors — this is exploratory
      expect(r.endTurn).toBeGreaterThan(0);
    }, 120_000);
  }
});
