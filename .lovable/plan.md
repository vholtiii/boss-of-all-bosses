## Diagnosis

After replaying the AI turn pipeline, the cause of "rivals barely do anything" is a single posture interaction in early game:

1. `computeAIPosture()` in `src/lib/ai-posture.ts` only returns `EXPAND` when **all** of these hold: `aiPhase >= 2`, `heatTier === 'cool'`, and `moneyRunway > 6`. Everything else in early game falls through to the default `BUILD_ECONOMY`.
2. `posturePolicy('BUILD_ECONOMY')` sets `suppressExpansion: true` with a low `heatCeiling: 45`.
3. In `processAITurn()` (`useEnhancedMafiaGameState.ts`, ~line 6622) the entire claim/extort action block is gated by:
   ```
   if (aiPhase >= 3 || aiOffenseDisabled || (policy.suppressExpansion && !strategicOverride)) { /* skip */ }
   ```
   So in Phase 1, AI **never** runs the action-phase claim/extort step.
4. Phase 1 also has no capos yet (capo promotion unlocks at Phase 2), and soldiers don't auto-claim on deploy — only capos do. Result: AI hexes barely grow.
5. Phase 2 requires 18 hexes + 40 respect. Because step 4 starves them of hexes, they stay in Phase 1 — which keeps `BUILD_ECONOMY` active — which keeps them stuck. Catch-22, matching the screenshot (turn 17, tiny rival pockets).

## Fix

Two surgical changes in `src/lib/ai-posture.ts`, plus a test update. No gameplay-system rewrites, no changes to `useEnhancedMafiaGameState.ts`.

### 1. Let early game enter EXPAND

In `computeAIPosture()`, broaden the EXPAND gate so Phase 1 with cool heat and a healthy treasury expands instead of turtling:

- Allow EXPAND from Phase 1+ (drop the `aiPhase >= 2` requirement)
- Lower the runway threshold from `> 6` to `> 4` (Phase 1 AIs naturally have less cash)
- Keep `heatTier === 'cool'` requirement so it still respects heat

This keeps all existing posture priorities (heat emergency, cash crisis, turtle, war, close-out, pressure leader) above EXPAND, so the only behavior that changes is "healthy early-game AI now expands instead of camping HQ."

### 2. Make BUILD_ECONOMY not zero-out expansion

`BUILD_ECONOMY` is meant to be "build businesses, low-risk only," not "do nothing." Change its policy so it still favors economy but doesn't completely suppress neutral grabs:

- `suppressExpansion: false` (was `true`)
- `heatCeiling: 45` stays (still pulls back if heat rises)
- `economyFocusMul` stays high so scoring still prefers building over fighting

Net effect: a defensive/early AI will still prefer to consolidate, but it will take adjacent neutral hexes when they're cheap — which is what the player observes is missing.

### 3. Update one posture test

`src/hooks/__tests__/ai-posture.test.ts`:
- `'BUILD_ECONOMY by default in Phase 1'` — with the new EXPAND gate, Phase 1 + cool heat + healthy runway now returns `EXPAND`. Change the test to use a tighter `moneyRunway` (e.g. 3) so it still exercises the BUILD_ECONOMY fallback.
- `'BUILD_ECONOMY suppresses expansion but allows defense'` — flip the assertion: `suppressExpansion` is now `false`. Keep the `suppressOffense === false` assertion.

All other posture tests (COOL_OFF, CONSOLIDATE, TURTLE, WAR, CLOSE_OUT, PRESSURE_LEADER, EXPAND heat ceiling, WAR heat ceiling) remain valid.

## Out of scope

- No changes to scoring, recruitment, movement budget, heat/bribe handling, or Phase thresholds.
- No changes to `useEnhancedMafiaGameState.ts`.
- No new tuning of difficulty modifiers (they already scale aggression and recruit cap separately).

## Verification

- Run `bunx vitest run src/hooks/__tests__/ai-posture.test.ts` — all posture tests pass with the updated two assertions.
- Run `bunx vitest run` to confirm no other test (especially `strategy-simulation` and `simulation`) regresses.
- Manual: start a new game and watch turns 1–10. AIs should now expand into neutral hexes adjacent to their HQ within the first few turns instead of sitting on 1–4 hexes.
