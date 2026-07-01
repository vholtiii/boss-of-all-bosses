# AI Overhaul — Smarter, More Dynamic, Medium-Threat Opponents

## Goals

- **Dynamic**: AI reacts to *why* it's in a posture, not just *that* it is — same posture on different boards produces different action mixes.
- **Reproducible**: same seed → same AI moves. Currently 70 unseeded `Math.random()` calls make replays diverge.
- **Medium-threat baseline**: Normal difficulty should feel like a competent opponent that *pressures* the player without steamrolling. Easy stays learnable, Hard stays punishing.
- **No new mechanics**: this is a decision-quality pass, not new AI abilities.

---

## Diagnosed problems (from audit)

1. **Non-deterministic** — 70 raw `Math.random()` calls inside `processAITurn` (heat bribes, plan hits, hitman, family dinner, HQ assault, combat willingness, deploy positions). Seeds don't reproduce.
2. **Fixed action waterfall** — every posture runs income → recruit → deploy → move → claim → extort → … in the same order. AI is predictable turn-to-turn.
3. **First-mover advantage** — `aiOpponents.forEach` in array order; family at index 0 always acts on stalest board state.
4. **Phase-cap is cosmetic** — `aiPhase` (behavior) advances even when `cachedPhase` (rubber-band) is capped. Rubber-band doesn't actually gate action unlocks.
5. **Passive targeting** — Plan Hit picks random capo; soldier deploy picks random neighbor; softmax `topK` hardcoded to 4 regardless of pool size.
6. **Posture dead-zones** — money runway 2.5–3.0 falls to BUILD_ECONOMY (silent). PRESSURE_LEADER fires at rank 1 with even 1-hex margin (hair-trigger). No "outnumbered but healthy" posture.
7. **No proactive scouting** — AI only attacks with intel if player or a family power gave it. Blind hits dominate.
8. **Economic safety net** — guaranteed income floor (`max(earned, 2000 + turn*500)`) removes consequence for bad economy.
9. **Double-fire** — Plan Hit and Hitman can both target the same capo the same turn.

---

## Plan (6 passes, folded into 1 slice)

### Pass 1 — Seeded determinism (foundation)

Replace `Math.random()` inside `processAITurn` with the existing seeded PRNG (`mulberry32(mapSeed + turn*31 + family.charCodeAt(0))`), already used for hex scoring.

- Extend `turnRng` usage to: lay-low roll, mattresses roll, bribe roll, deploy neighbor pick, fortify chance, combat willingness, plan-hit roll & target pick, wiretap roll, family dinner roll, HQ assault roll, hitman roll, personality drift.
- Keep the existing `turnRng` factory; just pipe it through more branches.
- Add a test in `src/hooks/__tests__/ai-determinism.test.ts`: same seed + same starting board → identical AI action log across 20 turns.

**Value:** replays reproduce, sim regressions become bisectable, difficulty tuning becomes measurable.

---

### Pass 2 — Priority-queued action budget

Replace the fixed if-chain waterfall with a per-turn **weighted action queue**. Each block that currently fires becomes a candidate action with:
- `weight` (base × posture multiplier × personality × urgency)
- `costEstimate` (money + heat)
- `prerequisite` (phase, targets exist, etc.)

Per turn, AI:
1. Enumerates all eligible actions.
2. Sorts by weight × urgency.
3. Executes top-N until money/heat/AP budget exhausted.

Concrete posture-driven weight tables live in `src/lib/ai-action-weights.ts` (new). Example: WAR posture weights hit/plan-hit/hitman 3× higher and build-business 0.2×; TURTLE weights fortify/safehouse/dinner 3× and hit 0.3×.

**Value:** same posture on different boards picks different actions. AI feels *reactive* instead of scripted.

---

### Pass 3 — Smarter target selection

- **Plan Hit target scoring** (`src/lib/ai-strategy.ts`): score each rival capo by `threatScore = level*2 + adjacencyToMyTerritory + inWarBonus - hqProximityPenalty`. Softmax pick with temperature by difficulty (Easy = flat, Hard = greedy).
- **Hitman target scoring**: extend exposure score with `strategicValue = income of hex + district control contribution`. Prefer capos whose death actually hurts the rival, not just exposed ones.
- **Soldier deploy scoring**: score spawn neighbors by `borderPressure - stackingPenalty + supplyLineDefense`. No more `Math.random()` pick.
- **Softmax topK** dynamic: `min(pool.length, 3 + floor(pool.length/4))` — small pools stay greedy, large pools stay diverse.
- **Plan Hit / Hitman dedupe**: track `_targetsThisTurn` set per AI; second system skips if first already queued the same capo.

**Value:** hits land on capos that matter. AI doesn't waste $30k hitman on a level-1 capo hiding at HQ.

---

### Pass 4 — Posture reasoner fixes

Update `src/lib/ai-posture.ts` `computeAIPosture()`:

- **Fill 2.5–3.0 money runway gap**: extend CONSOLIDATE trigger to `moneyRunway < 3.2` when heat ≥ warm.
- **PRESSURE_LEADER margin gate**: require `myHexes >= rank2Hexes + 3` OR `myRespect >= rank2Respect + 15`. No more 1-hex trigger.
- **Add UNDERDOG posture**: fires when `myRank >= 3` AND `topRivalHexes > 1.8 * myHexes` AND Phase ≥ 2. Policy: aggressive diplomacy (propose alliances to other underdogs), sabotage rank-1 hexes, cheap harassment hits — no expansion.
- **CLOSE_OUT loosen**: fire at `victoryGap ≤ 5` when in Phase 4 with `moneyRunway > 4`.
- **Bind `aiPhase` to `cachedPhase`**: after rubber-band cap, use the capped phase for all action gates, not the raw `aiPhase`. Fixes the cosmetic-cap bug.

Add `src/lib/__tests__/ai-posture-edges.test.ts` covering: 2.5 runway warm heat → CONSOLIDATE, rank-1 by 1 hex → not PRESSURE_LEADER, rank-3 outnumbered → UNDERDOG, capped phase → gated actions.

---

### Pass 5 — Proactive scout + intel-driven combat

- Add scout as a scored action in the queue (Pass 2): weight × 2 when a candidate attack target has no fresh intel and AI has a capo within 3 hexes of it.
- Refuse blind hits when scoutable within 2 turns unless posture is WAR/PRESSURE_LEADER + aggressive personality.
- Combat willingness (`6924`) becomes: `baseWillingness + intelBonus (0.15 if scouted) + strengthRatioBonus`. Removes the hardcoded `defensive: strength >= enemy+2 ? 0.7 : 0.15` cliff.

**Value:** AI feels like it *plans* attacks. Player observing gets telegraphed threats (scout ping → attack next turn).

---

### Pass 6 — Fairness + first-mover fix

- **Randomize AI turn order** per round using `turnRng`. Store computed order on state for the "Just Happened" feed to display consistently.
- **Income floor tapered**: keep the floor for Easy at 100%, taper to 50% on Normal (only kicks in below `1000 + turn*250`), disable on Hard. Bad economy actually costs the AI.
- **Fix `floor(illegalBiz/3)` heat hole**: switch to `ceil(illegalBiz/3)` for 1–2 businesses — 1 illegal biz → 1 heat/turn passive, matching intent.

---

## Files to change

- `src/hooks/useEnhancedMafiaGameState.ts` — pipe `turnRng` through `processAITurn`; swap waterfall for queue executor; wire capped phase to action gates; randomize AI order.
- `src/lib/ai-posture.ts` — new UNDERDOG posture; fixed CONSOLIDATE / PRESSURE_LEADER / CLOSE_OUT triggers.
- `src/lib/ai-strategy.ts` — target scoring functions (`scorePlanHitTarget`, `scoreHitmanTarget`, `scoreDeployNeighbor`), dynamic `softmaxPick` topK.
- `src/lib/ai-action-weights.ts` — **new** — posture × action weight table.
- `src/lib/ai-difficulty.ts` — income floor taper values.

## New tests

- `src/hooks/__tests__/ai-determinism.test.ts` — reproducibility harness.
- `src/lib/__tests__/ai-posture-edges.test.ts` — posture trigger edges.
- `src/lib/__tests__/ai-target-scoring.test.ts` — plan-hit / hitman / deploy scoring picks the "right" target on fixtures.

Existing `simulation.test.ts` and `strategy-simulation.test.ts` catch regressions in the aggregate.

---

## What we're NOT touching

- No new AI abilities (no ambush, no counter-attack, no AI-vs-AI alliances against player).
- No combat math changes (casualty ranges, fortify %, capo wound turns) — pure decision layer.
- No difficulty rebalance beyond the income floor taper — Normal stays medium-threat.
- No UI changes to how AI is displayed.

---

## Sequencing & checkpoints

Pass order matters. Ship 1 → 2 → 3 → 4 → 5 → 6, each behind the same commit. After each pass, run `simulation.test.ts` and `strategy-simulation.test.ts` to catch regressions before layering the next.

After all 6 passes: run a 20-turn seeded sim on Easy / Normal / Hard × 3 seeds and eyeball final standings. Target: on Normal, player and top AI within 25% of each other on hexes at turn 40 in ~60% of seeds.
