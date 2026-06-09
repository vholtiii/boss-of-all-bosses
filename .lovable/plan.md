# Test the AI walk-away path end-to-end

## Goal
Lock in the behavior of the `counter_supply_sitdown` reducer when the player's counter triggers the AI to walk away (≥40% swing, or any swing on a second round). The UI surface for this path is small: the sitdown card disappears, a "Counter Rejected" warning notification fires, and pair tension goes up by 5. A reducer-level test gives us a deterministic, fast check on all four of those without needing a live browser session (the swing thresholds are hard to hit reliably via click-testing).

## What the test will assert
For each walk-away trigger, after dispatching `counter_supply_sitdown`:

1. The targeted sitdown is removed from `incomingSitdowns` (no stale card left over, no replacement pushed).
2. A `pendingNotifications` entry exists with `type: 'warning'`, title `🚫 Counter Rejected`, and a message naming the from-family + "walked away".
3. Pair tension between `playerFamily` and `sitdown.fromFamily` increased by exactly 5 vs. the pre-dispatch value.
4. No success/info notification leaks in (i.e. we didn't accidentally take the accept or re-counter branch).

## Cases covered
- **Greedy swing, round 0**: original $10,000, counter $5,000 (50% swing) → walk.
- **Mild swing, round 1**: original $10,000, counter $11,000 (10% swing) but `counterRound: 1` already set → walk (the "one round only" rule).
- **Supplier-direction greedy swing**: `playerIsSupplier: true`, original $10,000, counter $20,000 → walk.

## Files
- New: `src/hooks/__tests__/counter-sitdown-walk-away.test.ts`
  - Imports the exported reducer (or a thin wrapper) from `src/hooks/useEnhancedMafiaGameState.ts`. If the reducer isn't directly exported, the test will use the hook via `renderHook` + `act` from `@testing-library/react` and dispatch through the returned dispatcher — matches the pattern already used in `src/hooks/__tests__/ai-territory-sitdown.test.ts`.
  - Seeds state with one synthetic entry in `incomingSitdowns` (id, fromFamily, proposedAmount, originalPrice, counterRound, playerIsSupplier) and a known `pairTension` baseline.

## Out of scope
- No code changes to the reducer, panel, or odds library — this is a verification task.
- No browser/preview run; the swing math is deterministic and a unit test is the right tool.

## Technical notes
- Pattern reference: `src/hooks/__tests__/ai-territory-sitdown.test.ts` for hook/reducer wiring, and `src/hooks/__tests__/negotiation-fairness.test.ts` for the swing constants already covered at the pure-function layer.
- The existing `negotiation-fairness.test.ts` covers `predictCounterReaction` (the UI hint). This new test covers the reducer's parallel branch, which is what actually mutates game state.
