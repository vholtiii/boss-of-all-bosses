## Goal

Run 3 full simulated games end-to-end (until someone wins or a game-over fires), capture every runtime error / warning / inconsistency the engine emits, then fix confirmed bugs and report design holes for the rest.

The game logic lives in `src/hooks/useEnhancedMafiaGameState.ts` (~10.6k lines). It's a React hook, but the per-turn engine work happens in plain functions called from `endTurn` (`processAITurn`, `processWeather`, `processEvents`, `processBribes`, `processPacts`, `processInfluenceSystem`, war/tension lifecycle, bankruptcy/RICO checks, etc.). That makes a headless harness practical.

A blocker we already see in the code: only the **player** has victory detection (`victoryType` is set off `state.victoryProgress`). AI rivals can dominate the map forever without "winning". So a real "until someone wins" sim needs symmetric victory detection.

---

## Step 1 — Headless simulator harness

Create `scripts/sim/runSimulation.ts` (run via `bunx tsx scripts/sim/runSimulation.ts`). It will:

1. Build a fresh state with `createInitialGameState(family, seed, difficulty, opponentCount, mapSize)`.
2. Drive turns by calling the same per-turn helpers `endTurn` calls — extracted into a small `runTurn(state)` adapter that mirrors the order in `endTurn` (income → upkeep/desertion → bankruptcy/assassination check → `processAITurn` → weather → events → bribes → pacts → influence → war/tension lifecycle → victory check).
3. Use a **scripted player policy** (passive-but-solvent): collect income, auto-decline events, never expand. Goal is engine coverage, not playing well; if the player dies via bankruptcy/RICO/assassination it's a recorded outcome, sim continues until an AI hits a victory threshold or `MAX_TURNS` (200) is reached.
4. Add **symmetric victory detection** in the harness only (does not change game code yet): for each AI, compute territory %, money, respect, eliminations against the same `victoryProgress` thresholds the player uses; first to meet any condition is the "winner".
5. Wrap every per-turn call in `try/catch`; record stack traces with turn number + family context.
6. Emit a JSON report per game: winner, turn count, final standings, all notifications, all combat-log entries, and any caught exceptions / NaN money / negative soldiers / orphaned units (units pointing at non-existent hexes) / hexes with `controllingFamily` not in roster / pact pointing at eliminated family / etc.

Refactor needed in `useEnhancedMafiaGameState.ts`: extract the body of `endTurn`'s state updater into a pure `runEndTurn(state): { state, report }` function and have `endTurn` call it inside its `setGameState`. No behavior change for the UI, but unlocks the harness. (If extraction proves too invasive, fall back to copying the call sequence into the harness — tracked as a risk.)

## Step 2 — Run 3 sims

Three different setups for variety:

| # | Family | Difficulty | Opponents | Map | Seed |
|---|--------|------------|-----------|-----|------|
| 1 | gambino | normal | 4 | medium | 1337 |
| 2 | colombo | hard | 4 | large | 4242 |
| 3 | bonanno | easy | 3 | small | 9001 |

Each game writes `/mnt/documents/sim-report-{n}.json` and a human-readable `sim-report-{n}.md` summary.

## Step 3 — Triage & fix

Categorize findings into:

- **Bugs** (clear engine errors): runtime exceptions, NaN/Infinity, negative resources, duplicate units, orphan references, pacts/alliances ticking on dead families, victory thresholds never reachable on small maps, etc. → fix in this loop.
- **Gameplay holes** (design): no AI victory detection, AI never builds legal businesses (so influence formula tilts unfair to player), bankruptcy spiral with no comeback, Phase 4 commission vote never fires in AI-only games, supply lines/heat decay rates that produce stalemates, etc. → documented in the final report, **not** auto-fixed (each one is a design call for you).

Bug fixes are scoped: only patches with an obvious correct behavior + small blast radius go in this loop. Anything ambiguous gets reported instead.

## Step 4 — Verify

- `bunx vitest run` (existing 51 tests must still pass).
- Re-run all 3 sims after fixes; confirm prior exceptions are gone and report.

## Deliverables

- `scripts/sim/runSimulation.ts` (+ tiny `runTurn` adapter, ideally extracted `runEndTurn`).
- `/mnt/documents/sim-report-{1,2,3}.{json,md}` before/after fixes.
- Code patches for confirmed bugs.
- A final chat summary listing: bugs fixed, gameplay holes found (with proposed remedies and severity), and which sim they came from.

## Out of scope

- Building a competent player AI (passive policy is intentional).
- Auto-fixing design-level holes — only reported.
- Adding real AI victory detection to the game itself (only added in the harness; flagged as a recommended fix).
- UI changes.

## Risks

- Extracting `runEndTurn` from inside `setGameState` may surface hidden coupling to closure state. Fallback: harness reproduces the call sequence directly.
- 200-turn cap may not be enough on `large` + `easy`; if no winner, report game as "stalemate" and flag as a hole.
