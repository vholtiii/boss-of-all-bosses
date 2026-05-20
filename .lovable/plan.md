# Tune AI + Sim Harness After Bribes Moved to Tactical

The Corruption bribe is now a Tactical-step spend that consumes a tactical action (3/turn) instead of an Action token. Two things drift out of balance from that move:

1. **Strategy simulations** — all 3 sim policies still issue `bribe_corruption` from the Action branch, where the handler now early-returns with a "No Tactical Actions" warning. Sims report misleading heat numbers because the player effectively never bribes.
2. **AI vs player parity** — the player gained a "free" heat cleanup (no longer competes with claim/extort for Action tokens). The AI's heat reduction (`aiSpendOnHeatReduction`) is a separate, budget-free spend with a 2-turn cooldown and a low warm-tier trigger chance. Without a small bump the AI will fall behind the player on heat management.

Out of scope: bribe costs/effects, success formulas, phase gates, the 4-tier intel system, AI-action-budget refactor, new posture types.

## Tuning changes

### 1. `src/hooks/__tests__/strategy-simulation.test.ts`

Move each `bribe_corruption` call from the `else` (action) branch into the `else if (phase === "tactical")` branch, after `autoResolveEvents`, and guard on `s.tacticalActionsRemaining > 0`:

- Conqueror: bribe when `heat >= 60 && phase >= 2`.
- Tycoon: bribe when `heat > 30 && phase >= 2 && money > 5000`.
- Diplomat: bribe when `heat >= 50 && phase >= 2`.

No other policy logic changes.

### 2. `src/hooks/useEnhancedMafiaGameState.ts` — AI heat-spend tuning

In the AI heat-precaution block (~lines 5707–5721):

- Bump `warm`-tier spend chance from `0.20 * personalityMult` to `0.30 * personalityMult`.
- Bump `hot`-tier spend chance from `0.40 * personalityMult` to `0.55 * personalityMult`.
- Drop bribe cooldown from 2 turns to 1 turn for `warm`/`hot` tiers; keep 2 turns for `critical`/`rico` (no runaway free spend). Done by passing the cooldown as a parameter to `aiSpendOnHeatReduction` or setting `bribeCooldownUntil` after the call site based on tier.

Rationale: player now bribes ~1 turn earlier on average (no Action-slot tradeoff). These three numbers restore parity without changing the AI's posture decision tree.

### 3. `src/hooks/__tests__/ai-posture.test.ts` — regression coverage

Add two focused cases:

- **Tactical budget contract**: dispatch `bribe_corruption` while `tacticalActionsRemaining = 0` → expect a "No Tactical Actions" notification, no money spent, no contract added.
- **AI warm-tier cleanup**: seed an AI opponent with `heat = 50`, run 3 AI turns at fixed RNG, assert `heat` strictly decreases at least once (proves the bumped warm-tier chance fires under normal play).

### 4. Validation

- `bunx vitest run src/hooks/__tests__/ai-posture.test.ts src/hooks/__tests__/strategy-simulation.test.ts`
- Re-read `/mnt/documents/strategy-sim-summary.md` and confirm: bribes registering (active contracts > 0 across turns), average heat in each sim shifts down vs the previous run, no new errors or stuck phases.

## Technical notes

- AI does NOT consume the player's `tacticalActionsRemaining`. `aiSpendOnHeatReduction` stays free-spend by design — the tactical step is a player-side construct.
- The strategy sims drive the player hook; the AI runs inside `endTurn` and is unaffected by where the sim issues its bribe call.
- No UI changes; the Corruption panel and CorruptionPanel component already reflect the tactical step from the prior change.
