# Three-Strategy Simulation Sweep

## Goal

Stress-test the game by driving the existing engine through **three full playthroughs, each with a distinct active winning strategy** (not the current passive harness that just ends turns). Surface bugs, infinite loops, NaN propagation, illegal states, and gameplay holes that only show up when the player actually pursues a win condition.

## The three strategies

Each is a deterministic policy function `pickActions(gameState) -> Action[]` that runs once per turn, after Tactical phase, before End Turn.

1. **Territory Conqueror** (target: territory victory — 40/60/80 hexes by map size)
   - Phase 1–2: claim every neutral hex adjacent to owned territory; deploy soldiers to push the border outward; recruit when soldier count < 6.
   - Phase 3+: rely on passive influence expansion + Plan Hits on rival capos blocking the border.
   - Heat management: bribe at heat ≥ 60.

2. **Economic Tycoon** (target: economic victory — $50k/turn income)
   - Phase 1: claim 6–8 high-income hexes near HQ, then stop expanding.
   - Phase 2+: build businesses on every owned hex (prefer high-affinity districts), promote first eligible soldier to capo so he can earn full income, hire lawyers + bribe officials early.
   - Defensive: fortify HQ + top 2 income hexes; never start wars; accept supply deals.

3. **Diplomatic Commission** (target: Phase 4 Commission Vote victory)
   - Phase 1: minimal expansion (4–6 hexes), build legal fronts only.
   - Phase 2+: send sitdown requests to every rival, accept all incoming sitdowns, form alliances with the two highest-tension rivals.
   - Phase 4: trigger Commission Vote when influence + respect peak.
   - Avoid all hits / sabotage / blind claims that generate heat.

## Harness changes

New file `src/hooks/__tests__/strategy-simulation.test.ts` — built on the same `renderHook + act` scaffold as `simulation.test.ts`, but with three additions:

- **`StrategyPolicy` interface** — `{ name, family, difficulty, mapSize, seed, pickActions(state, hookApi): void }`.
- **Per-turn driver** — replaces the current "advance × 3 + endTurn" loop with: `advancePhase` (Deploy) → run policy's deploy actions → `advancePhase` (Tactical) → run policy's tactical picks → `advancePhase` (Action) → run policy's action picks → `endTurn`. Each step wrapped in `safeAct` so a single thrown action doesn't kill the run.
- **Strategy implementations** live in the same test file as plain functions for now. They use only the existing public hook API (`performAction`, `deployUnit`, `moveUnit`, `selectTerritory`, `performBusinessAction`, `performReputationAction`, `fortifyUnit`, `handleEventChoice`).

Anomaly scanner from the existing harness is reused as-is (NaN money, orphan units, > 2 friendly stack, pacts referencing eliminated families, unknown family ids). Add three new checks specific to active play:

- `action_threw` — count + first 5 stacks per phase.
- `stuck_phase` — same `gamePhase` for 5 consecutive iterations.
- `victory_path_progress` — strategy-specific milestone (e.g. Tycoon: per-turn income trend; Commission: tension/influence trend) so we can spot when a path becomes unreachable.

## Reports

Each sim writes `/mnt/documents/strategy-sim-{1,2,3}.{json,md}` with:

- Final standings, winner, end turn, end reason
- Errors (action throws + their phase) with stack
- Anomalies (deduped)
- Strategy progress timeline: every 10 turns log `{ turn, hexes, money, income, respect, influence, heat, phase, posture }` for the player + each AI
- Last 30 notifications and last 50 combat-log entries

After all three runs, write a single `/mnt/documents/strategy-sim-summary.md` rolling up: outcomes, total errors per sim, the most common anomaly per sim, and any victory paths that never made progress.

## Run

```bash
bunx vitest run src/hooks/__tests__/strategy-simulation.test.ts
```

Each sim is capped at 200 turns / 120s. Tests `expect(endTurn).toBeGreaterThan(0)` only — never fail on losses or stalemates, since the goal is exploration. The summary file is what we read to decide what to fix next.

## Out of scope

- No engine changes. If a strategy uncovers a bug, we file it; we don't fix it in this turn.
- No new AI behavior — we only added the strategy policies for the *player* slot.
- No UI / no React component changes.
