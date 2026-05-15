# Dynamic AI Strategy Progression

## The problem

Today the AI is mostly **reactive**: it scores hexes, blends a mood, then *after* the fact triggers Lay Low / bribes when heat is already high. It doesn't change *what* it does based on the bigger picture (phase, treasury runway, rivals' standing, war state, victory distance). Result: it constantly drifts into heat trouble because it keeps doing the same offensive playbook turn after turn.

The fix is to add a single **AI Strategic Posture** layer that runs once per AI family per turn, before any action loop, and picks one of a small set of postures. Every downstream decision (build vs extort, hit vs scout, expand vs consolidate, bribe vs save) reads from that posture so behavior visibly shifts as the game evolves.

## The decision tree (per AI family, per turn)

Inputs the tree reads (all already exist on game state):

- `aiPhase` (1–4), `heatTier` (cool / warm / hot / critical / rico)
- `myHexes`, `rivalAvgHexes`, `playerHexes`, `myRank` (1–5 by territory)
- `moneyRunway` = `money / max(1, upkeepPerTurn)` (turns of payroll left)
- `atWar`, `recentCapoLosses`, `hqAssaultedRecently`
- `territoryTarget` (already computed from map size) → `victoryGap`
- `basePersonality`, `dynamicMood`

Postures (mutually exclusive, one per turn):

```text
                       ┌─ rico/critical heat & not strategic-override ─► COOL_OFF
                       │
                       ├─ moneyRunway < 3 turns ─────────────────────► CONSOLIDATE
                       │
                       ├─ hqAssaultedRecently OR recentCapoLosses≥2 ─► TURTLE
                       │
                       ├─ atWar ─────────────────────────────────────► WAR
   start ─────────────►┤
                       ├─ Phase 4 AND victoryGap ≤ 3 hexes ──────────► CLOSE_OUT
                       │
                       ├─ Phase 3+ AND myRank == 1 ──────────────────► PRESSURE_LEADER
                       │   (pressure = pick #2's weakest border hex)
                       │
                       ├─ Phase 2 AND heatTier == cool AND
                       │   moneyRunway > 6 ──────────────────────────► EXPAND
                       │
                       └─ default ──────────────────────────────────► BUILD_ECONOMY
```

What each posture changes (concrete, downstream):

- **COOL_OFF** — no manual claims/extorts, no blind hits, refuse new wars, force bribe spend, prefer Lay Low if off cooldown, build legal fronts only. Posture exits when heat ≤ 35.
- **CONSOLIDATE** — sell/abandon empty lowest-income hexes, halt recruitment, no offense, accept supply deals from rivals, accept any sitdown that pays cash.
- **TURTLE** — fortify HQ + 2 highest-income hexes, pull capos home, escort weak units, prefer Mattresses if Phase 3+, decline aggressive sitdowns.
- **WAR** — switch hex scoring to weight `isWarTarget` × 2, allow Plan Hits, ignore distance penalty, accept higher heat (override gate stays as-is).
- **CLOSE_OUT** — concentrate units on the last 1–3 hexes needed to hit territory target; if Commission Vote is reachable, redirect to influence/respect actions instead.
- **PRESSURE_LEADER** — target only the #1 rival's borders (or the player when the player is #1), bias scouts to that rival, propose punitive sitdowns, no expansion elsewhere.
- **EXPAND** — current default offensive behavior (claim/extort, scout new districts, recruit), but with a hard heat ceiling: stop offense at heat ≥ 50 even without a tier flip.
- **BUILD_ECONOMY** — prioritize building businesses on owned hexes, racketeering progression, supply-line connection, single low-risk extort per turn max.

## Why this fixes "always in heat trouble"

1. **Preventative, not reactive.** EXPAND and BUILD_ECONOMY both impose a soft heat ceiling (50) so the AI stops offense *before* it ever reaches the warm/hot bribery cycle.
2. **Phase-aware pacing.** Phase 1 defaults to BUILD_ECONOMY (no manual claims allowed for player anyway in Phase 3+, but AI mirrors the spirit). Heavy offense only unlocks in Phase 2+ via EXPAND, and only when the treasury can pay for the heat that follows.
3. **Cash-runway gate.** CONSOLIDATE fires before the AI bankrupts itself spending on bribes it can't sustain — today this is the main loop that traps it at high heat with no money to bribe out.
4. **Rank-aware.** PRESSURE_LEADER and CLOSE_OUT keep the late game feeling alive instead of every AI doing the same generic expansion.

## Where the code goes

Single new file plus one call site:

- `src/lib/ai-posture.ts` — pure function `computeAIPosture(inputs): Posture` plus a `posturePolicy(posture)` returning the per-posture flags (`heatCeiling`, `allowOffense`, `allowExpansion`, `preferLayLow`, `preferMattresses`, `targetSelector`, `heatScoringMul`, etc.). Mirrors the style of `ai-strategy.ts`.
- `src/hooks/useEnhancedMafiaGameState.ts` → `processAITurn`: compute `posture` right after `dynamicMood` (around line 5583), stash on `oppAny.posture` for UI/debug, then have the existing branches consult `posturePolicy` instead of (or in addition to) the current ad-hoc heat checks. The existing `strategicOverride` stays as a CLOSE_OUT/PRESSURE_LEADER escape hatch.

Tests:

- `src/hooks/__tests__/ai-posture.test.ts` — table-driven: each input scenario maps to expected posture.
- Extend `simulation.test.ts` to assert the AI's average heat over 30 turns drops vs. baseline.

## Out of scope (intentionally)

- No new game mechanics, no new actions, no new UI surfaces (posture is invisible to the player except through behavior — we can add a tiny debug badge later if you want).
- No changes to player rules, scoring, or balance numbers beyond the heat ceilings listed above.
