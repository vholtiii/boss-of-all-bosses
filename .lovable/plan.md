

# Capo Promotion: Available Any Phase, No Action Cost

## Current Behavior
- Capo promotion panel is **locked during Deploy phase** (`phaseLocked={actionsLocked}`)
- Only accessible during Action phase
- Implicitly tied to the action budget

## Changes

### `src/components/GameSidePanels.tsx` (~lines 460-480)
- Remove `phaseLocked={actionsLocked}` from the Capo Promotion `CollapsibleSection`
- Remove the `actionsLocked` conditional that shows "🔒 Unlock in Action phase" — always render `CapoPromotionPanel` regardless of phase

### `src/hooks/useEnhancedMafiaGameState.ts` (~lines 3844-3892)
- In the `promote_capo` case: **do not decrement `actionsRemaining`** (confirm it doesn't already — it appears it doesn't, but verify no action budget check blocks it)
- Remove any phase gate if present (the action handler should work in any phase)

## Files Modified
- `src/components/GameSidePanels.tsx` — unlock promotion panel in all phases
- `src/hooks/useEnhancedMafiaGameState.ts` — ensure no action cost on promotion

