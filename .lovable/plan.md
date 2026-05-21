# AI Behavior & Code — Improvement Plan

A review of `processAITurn` (~2,100 lines in `useEnhancedMafiaGameState.ts`) plus the `ai-posture.ts` / `ai-strategy.ts` helpers turned up a clear set of issues. Grouped into **Behavior gaps** (things the AI should do but doesn't, or does poorly) and **Code health** (things that make the AI hard to tune and debug). Each item is rated **High / Med / Low** by impact.

## Behavior gaps

### B1. Strategic posture is half-wired (High)
`computeAIPosture` produces 8 postures and `posturePolicy` exposes 9 knobs (`heatCeiling`, `suppressOffense`, `suppressExpansion`, `forceBribe`, `preferLayLow`, `preferMattresses`, `acceptSitdownsForCash`, `refuseNewWars`, `warTargetMul`, `economyFocusMul`). Only 4 are actually read in `processAITurn`:
- `forceBribe`, `preferLayLow`, `heatCeiling`, `suppressOffense` → used
- `suppressExpansion`, `preferMattresses`, `acceptSitdownsForCash`, `refuseNewWars`, `warTargetMul`, `economyFocusMul` → **defined but never read**

So a CONSOLIDATE family that should refuse new wars and grab any cash sitdown still proposes ceasefires randomly and ignores incoming deals; a TURTLE family that should prefer Mattresses isn't pushed toward it; an EXPAND family doesn't get a movement weight boost on neutrals.

**Fix:** wire the remaining policy fields into the existing branches (no new mechanics, just hook the knobs):
- `suppressExpansion` → skip the "claim neutral hex" priority and the "extort neutral biz" priority, but keep defense.
- `preferMattresses` → mirror the existing `preferLayLow` block at Phase 3+.
- `acceptSitdownsForCash` → in the diplomacy block, when an AI has an incoming sitdown from the player and posture is CONSOLIDATE / COOL_OFF, auto-accept cash-positive deals (supply deals, ceasefire when at war).
- `refuseNewWars` → gate the AI Plan Hit roll and the "blind attack on player" branch.
- `warTargetMul` / `economyFocusMul` → multiply into `scoreHexForAI` via two new optional inputs.

### B2. AI never uses Push Out (High)
The new `push_out_territory` action only resolves through `resolveEnemyHexAction` for the player. AI movement falls through into the heavy combat branch on every empty rival hex it enters, taking +heavier heat instead of the low-heat Push Out path. Mirror the player rule: empty rival hex + no business → run the Push Out branch (`+2/+4` heat) instead of the full Hit path.

### B3. AI never builds businesses (High)
Players construct businesses on owned empty hexes; the AI only extorts pre-existing neutral businesses and captures via combat. That's why `policy.economyFocusMul` was designed but couldn't be wired — there's nothing to bias toward.
Add a simple build path used in BUILD_ECONOMY / CONSOLIDATE / TURTLE postures: on AI families with money runway > 6 and ≥1 owned empty hex adjacent to a connected supply node, build a district-appropriate business (use existing affinities). Cost / construction-turn budget = same as player.

### B4. AI never abandons empty hexes (Med)
Player has Abandon Territory to drop empty hexes and cut community upkeep ($150/hex/turn). AI pays this forever, which compounds when CONSOLIDATE / COOL_OFF fires. Add: in those two postures, if `aiCommunityHexCount > 8` and runway < 5, abandon the lowest-value empty hex furthest from HQ.

### B5. AI never hires hitmen (Med)
Phase 3 hitman contract ($30k) is player-only. At Phase 3+, an aggressive/opportunistic AI with money runway ≥ 8 and an outstanding war / very-low relationship with the player should occasionally contract a hit on a player capo instead of relying solely on the existing Plan Hit. Use existing `processHitmanContract` machinery; no new mechanic.

### B6. RNG determinism inconsistency (Med)
A per-turn seeded `turnRng = mulberry32(mapSeed + turn * 31 + fam)` is created in line 5656 but only used inside `scoreHexForAI`'s jitter. Every other AI decision — Lay Low rolls, bribe rolls, diplomacy proposals, family-power triggers, combat willingness, fortify chance, plan-hit roll, commission-vote roll — uses raw `Math.random()`. Means same map seed produces different AI behavior across reloads, breaking save scumming protection and making regressions hard to reproduce.
**Fix:** swap all `Math.random()` calls inside `processAITurn` for `turnRng()`. Pure mechanical change.

### B7. AI movement scoring doesn't see posture (Med)
`scoreHexForAI` knows personality and mood but not posture. EXPAND / WAR / PRESSURE_LEADER should bias the scoring; currently posture only gates whether the function runs (`suppressOffense`). Add two optional inputs: `warTargetMul` (applied to the `isWarTarget` weight) and `expandMul` (applied to the "weak hex" bonus). Defaults preserve existing behavior.

### B8. Capo deploy is naive (Low)
The "deploy capo from HQ" block (line 6677) picks the highest-income owned tile regardless of threat, distance from front, or whether another capo already covers it. Replace with a small score: `income * 0.6 + 0.4 * (1 if border hex else 0) − 1.0 if another friendly capo within 2 hexes`.

### B9. Family-power triggers ignore posture (Low)
Bonanno Purge fires regardless of money/runway; Gambino Network fires regardless of heat. Tighten with `posture !== 'CONSOLIDATE' && posture !== 'COOL_OFF'` for offensive powers; allow defensive ones (Genovese hide hex) freely.

## Code health

### C1. `processAITurn` is a 2,100-line monolith (High)
Single inner `forEach(opponent ⇒ ...)` body covers: mood, posture, heat tier, lay-low/mattresses, bribes, income, recruit, deploy, movement+combat, claim, extort, capo deploy, promote, diplomacy proposals, supply deals, safehouse, plan hit, family powers, respect/influence, flip soldier, HQ assault, phase transition, commission vote, heat lifecycle. Nothing is extracted, almost no helpers. Hard to test, hard to reason about, hard to PR-review.

**Fix:** extract pure-ish stage helpers into `src/lib/ai/` (one file per stage), called sequentially from a slim `processAITurn`. Each takes `(state, opponent, ctx)` where `ctx` carries the once-per-AI computed bundle (posture, policy, personality, turnRng, heatTier, etc.). Suggested split:
```text
src/lib/ai/
  ai-context.ts          (build the per-AI ctx bundle: mood, posture, heat tier, rng, hex counts)
  ai-precautions.ts      (lay-low, mattresses, bribes, RICO timer)
  ai-economy.ts          (income, recruit, build-business, extort-neutral, abandon)
  ai-deploy.ts           (soldier + capo deploy)
  ai-movement.ts         (move loop, target scoring, fortify-on-the-way)
  ai-combat.ts           (combat resolution, push-out branch, capture, safehouse loot)
  ai-diplomacy.ts        (ceasefires, alliances, supply deals, sitdown auto-accept)
  ai-strategic.ts        (plan hit, hitman, family power, HQ assault, commission vote)
  ai-bookkeeping.ts      (respect/influence, phase transitions, heat lifecycle)
```
Move the existing inline code as-is in the first pass — no behavior change. Posture-wiring (B1) and Push Out (B2) follow afterward against the smaller modules.

### C2. Repeated `state.hexMap.filter` / `state.deployedUnits.filter` (Med)
Per AI turn, the player-hex count and the AI's own hex count are recomputed 5–6 times each (`myHexCount`, `myTerritoryNow`, `aiHexCount`, `aiFamHexes`, `aiHexes`, `aiCommunityHexCount`). Compute once in the ctx bundle.

### C3. Magic numbers scattered everywhere (Med)
`0.5` base lay-low chance, `0.95` cap, `0.85` war-target bias, `0.7` safehouse bias, `0.30/0.25/0.40/0.50` per-family-power roll chances, etc. Lift to a single `AI_TUNING` constant block at the top of the module (or into `ai-context.ts`) so they're tunable in one place.

### C4. No structured AI decision log (Med)
`turnReport.aiActions` is `{family, action, detail}` strings — fine for the post-turn modal, useless for debugging "why did Genovese pick that hex". Add an optional `aiDecisions` debug channel (off in prod, on behind a `localStorage.AI_TRACE` flag) that records per-AI `{posture, mood, heatTier, moneyRunway, chosenAction, alternativesScored}`. Pure additive.

### C5. Combat target selection bypasses `scoreHexForAI` (Low)
Movement uses the scoring system, but the per-personality `combatWillingness` branch (line 6299-6306) and the contested-defense pick (line 6044) use ad-hoc numbers. Reuse the same scoring with a `combatMode: true` flag.

### C6. AI scoring inputs lose info (Low)
`scoreHexForAI` doesn't get `isPushOutTarget` (empty rival hex, low heat) or `hasConnectedSupply` (which would bias extortion/build choices). Small additions during B2/B3 wiring.

### C7. Test coverage gaps (Med)
`ai-posture.test.ts` and friends cover the pure helpers. No tests for the integrated turn (e.g. "AI in CONSOLIDATE posture accepts a cash sitdown", "AI uses Push Out on empty rival hex", "AI doesn't propose new wars when policy.refuseNewWars=true"). Add a small `processAITurn.behavior.test.ts` that builds a minimal state and asserts post-turn invariants for each posture.

## Suggested order of execution

1. **C1 extraction first** (mechanical, no behavior change, makes the rest reviewable).
2. **C2 / C3** as part of the extraction (one-time cleanup).
3. **B6 RNG determinism** swept across the new modules.
4. **B1 wire remaining policy fields** — biggest behavior win, smallest risk.
5. **B2 Push Out** integration in `ai-combat.ts`.
6. **B7 scoring posture inputs**, then **B8 / B9** polishes.
7. **B3 build path** + **B4 abandon** + **B5 hitman** — these are net-new AI capabilities, more design-sensitive, save for last.
8. **C4 trace log** + **C7 behavior tests** alongside the new features so we lock in the wins.

Each step ships independently — no chained dependencies beyond the C1 extraction at the start.

## Out of scope

- No changes to player-facing controls.
- No new AI personalities or postures (the existing 5 + 8 are enough).
- No machine-learning / external decision service — staying in pure TS.
- No changes to map gen, supply lines, diplomacy data model, or save format.

## Open questions

1. **Build-business path priority** — should AI prefer cash-positive illegal builds (faster ROI, higher heat) or legal builds (slower, no heat, contributes to respect/influence)? Default proposal: personality drives it (aggressive/opportunistic → illegal first, defensive/diplomatic/Gambino-Bonanno → legal first).
2. **Sitdown auto-accept thresholds** — what cash floor should CONSOLIDATE consider "worth taking"? Default proposal: any supply deal ≥ $5k, any ceasefire while at war.
3. **Hitman frequency** — once per game per AI? Once per Phase 3+ war? Default proposal: max 1 active hitman contract per AI at a time, 8-turn cooldown after success.
