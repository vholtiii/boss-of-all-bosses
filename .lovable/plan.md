
## Problem

You are seeing soldiers appear at HQ unexpectedly — including in cases where you don't control the Bronx (so it isn't the Bronx free-recruit district bonus). Your hunch points at the arrest/release flow after hiring a lawyer, and that lines up with what the code shows.

## Findings (in `src/hooks/useEnhancedMafiaGameState.ts`)

There are five places that can put a soldier-typed unit at HQ between your turns. Two of them are buggy or misleading:

1. **Street arrest release (line ~4229)** — When heat ≥ 50, soldiers can be arrested and stored in `arrestedSoldiers` with a `returnTurn`. On the next turn after `returnTurn`, the soldier is re-deployed at HQ as `type: 'soldier'`. This is by design.

2. **Hire Lawyer (line ~8417)** — Reduces every active arrest's `returnTurn` by 25%. With short base sentences (3 turns for soldiers, 5 for capos) the formula `Math.floor((returnTurn - turn) * 0.75)` collapses to **1 turn**, so a soldier arrested this turn is released next turn. To you it looks like a soldier just appeared from nowhere shortly after retaining a lawyer.

3. **Capo release (line ~4255)** — When a capo is released from `arrestedCapos`, the code calls `generateCapoName()` and pushes a freshly-named capo with no stats restoration. Same id, but new name and no `name`/personality continuity, so it visually looks like a new unit (matches your earlier "got a new soldier when capo arrested" complaint, just with a capo).

4. **Prosecution release (line ~4510)** — Federal prosecution arrests release as a soldier with a loyalty penalty. Working as designed, but worth confirming the source flag isn't set on street arrests (it currently isn't, which is correct).

5. **Hidden-unit return from safehouse (line ~3340)** — Loyal soldiers that were hidden return to HQ. Working as designed.

Additionally, the release block at 4243 always pushes `type: 'soldier'` and never restores stats — if a soldier had stats they're preserved (same id), but if the entry in `arrestedSoldiers` was orphaned (e.g. unit died, or stats were cleaned), you can get a stat-less soldier showing up.

The Bronx free-recruit path (line ~3447) is correctly gated on `hasPlayerDistrictBonus('free_recruit')` which is recomputed every turn from current ownership, so it should not fire when you don't control the Bronx — unless `activeDistrictBonuses` is being re-applied from a stale snapshot. Worth verifying.

## Plan

1. **Add diagnostic logging** (temporary) at every soldier-deploying release / spawn path so the next "spontaneous soldier" event prints which path produced it — release-from-jail, prosecution-release, safehouse-return, Bronx free-recruit, or recruit action. This pinpoints the exact source in your save.

2. **Fix the lawyer arrest-reduction math** so reducing a 3-turn sentence with a lawyer doesn't trivially collapse to 1 turn the same turn it was applied. Cap reduction so the new `returnTurn` is at least `arrest.turn + 2`, and never apply the reduction to arrests created on the current turn.

3. **Fix capo release continuity** — restore the capo's original `name` and personality from a stored snapshot at arrest time instead of calling `generateCapoName()` on release. Also restore `recruited` flag and ensure stats survive (they do today via `soldierStats[unitId]` but add a guard).

4. **Strengthen release notifications** so you always see a clear, prominent toast: "🔓 Soldier released from jail (Lawyer reduced sentence) — back at HQ." This removes the "where did this unit come from?" confusion when releases are working as designed.

5. **Audit Bronx district-bonus persistence** — confirm `computeDistrictBonuses` actually runs before the free-recruit check on the same turn, and that loading a save doesn't restore stale `activeDistrictBonuses` without revalidation. If stale, recompute on game-state load.

6. **Verify** — start a game, push heat to 50+, hire a lawyer, advance turns, and confirm: (a) no soldier appears the same turn arrest happens, (b) the release toast is shown when one returns, (c) no soldier spawns when you don't hold ≥60% of any Bronx hex.

### Files to touch

- `src/hooks/useEnhancedMafiaGameState.ts` — release blocks (~4229, ~4255, ~4510), `hire_lawyer` (~8417), capo arrest (~4327) to snapshot name/personality, free-recruit gate (~3447), and load-time bonus revalidation.
- (Possibly) `src/lib/saveMigrations.ts` if stale `activeDistrictBonuses` need to be cleared on load.

No UI/behavior changes elsewhere; this is contained to the arrest/lawyer subsystem and one diagnostic pass.
