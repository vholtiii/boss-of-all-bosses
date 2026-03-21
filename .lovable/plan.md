

# Internal Hit After Hiding Period

## Change

Instead of checking loyalty at the moment of the civilian hit and immediately eliminating the soldier, the internal family hit now happens **after the 3-turn hiding period ends**. The soldier goes into hiding as normal, and when they return, if their loyalty is below 70, the family eliminates them instead of returning them to the board.

This creates a tense 3-turn window where the player knows the soldier might not come back.

## Implementation

### `src/hooks/useEnhancedMafiaGameState.ts`

**Civilian hit branch (blind hit, no enemies):**
- Remove the loyalty check — all soldiers go into hiding regardless
- Heat set to 100, soldier added to `hiddenUnits` as before

**Start-of-turn hidden unit processing:**
- When `currentTurn >= returnsOnTurn`:
  - If soldier loyalty < 70: permanently remove unit, reduce heat by 25, roll 10% morale risk on remaining soldiers, notification: "The family dealt with [soldier] internally."
  - If soldier loyalty >= 70: return soldier to HQ hex as normal

### `COMBAT_SYSTEM_GUIDE.md`
- Update Internal Family Hit section to reflect the post-hiding timing

### `.lovable/plan.md`
- Update plan to reflect new timing

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — move loyalty check from civilian-hit branch to hidden-unit-return logic
- `COMBAT_SYSTEM_GUIDE.md` — doc update
- `.lovable/plan.md` — plan update

