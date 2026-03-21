

# Add Tactical Action Cost to Soldier Recruitment

## Summary

Buying or recruiting a soldier during the Tactical phase should consume 1 tactical action (out of the 3-action budget), same as Scout, Fortify, Escort, and Safehouse.

## Changes

### File: `src/hooks/useEnhancedMafiaGameState.ts`

**`recruit_soldiers` case (~line 2031)**: Add a guard checking `tacticalActionsRemaining > 0` and decrement it on success.

**`recruit_local_soldier` case (~line 2048)**: Same guard and decrement.

Both cases follow the existing pattern used by Fortify/Scout/etc:
```
if (newState.tacticalActionsRemaining <= 0) return newState;
// ... existing logic ...
newState.tacticalActionsRemaining -= 1;
```

### File: `src/components/GameSidePanels.tsx`

Update the recruitment button sublabels to mention the tactical action cost (e.g., `$1,500 · -3 loyalty · 1 action`) and disable buttons when `tacticalActionsRemaining <= 0`.

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/components/GameSidePanels.tsx`

