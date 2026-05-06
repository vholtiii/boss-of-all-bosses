## Balance Diagnostic + Simulations

Run two automated game simulations against the current mechanics, then produce a written balance report.

### What I'll do

1. **Build a headless simulation harness** (`/tmp/sim/run.ts`) that imports the real game state from `src/hooks/useEnhancedMafiaGameState.ts` and `src/types/game-mechanics.ts`. The harness:
   - Initializes a game with a chosen family + difficulty + map size.
   - Plays a scripted "reasonable" player turn loop (deploy reserves to HQ-adjacent, scout, claim/extort when allowed, build a legal business when reqs near, advance phase when ready) plus the real `processAITurn` for opponents.
   - Logs per-turn snapshots: turn, phase, money, soldiers, capos, hexes, respect, influence, heat, AI phases, AI hex counts, AI heat, war/pact state.

2. **Run 2 simulations** with different seeds/families:
   - Sim A: Gambino, Normal, Medium map, 60 turns or until victory/defeat.
   - Sim B: Colombo, Hard, Medium map, 60 turns or until victory/defeat.

3. **Diagnostic checks** against the documented rules in memory:
   - AI phase pacing respects difficulty turn-floor offsets (E+4/N+2/H+0) and player+1 cap (Easy/Normal).
   - Sustained-perf streak ≥ 2 (≥1 Hard) before AI promotion.
   - Player phase progression isn't blocked by missing perf reqs.
   - Economy: net income trend, bankruptcy frequency, maintenance vs revenue ratio.
   - Heat: tier escalation curve, RICO triggers.
   - Combat: hit success rates, casualty rates, capo survival.
   - Diplomacy: pact uptake, tension/war triggers.
   - Territory: hex distribution between player and AIs, district control progression.

4. **Write a markdown report** to `/mnt/documents/balance-report-2026-05-06.md` with:
   - Executive summary (balanced / minor issues / major issues).
   - Per-sim turn-by-turn highlights and final state.
   - Metric tables (phase timing, economy, combat, AI parity).
   - Flagged imbalances with suggested tuning ranges (no code changes — diagnostic only).
   - Verification that the recent AI-only phase pacing rules behave as designed.

5. Emit the report as a `<lov-artifact>` so you can download it.

### Notes / risks

- The game hook is a React hook; the harness will need to call its underlying pure functions (`processAITurn`, `calculatePhaseForFamily`, etc.) directly rather than mounting React. If any logic is locked inside the hook closure, I'll extract just enough to drive a turn loop in a Node script via `bun`.
- No gameplay code will be modified. This is purely a read + simulate + report task.
- Output: one markdown report file. No UI changes.

Approve to run.