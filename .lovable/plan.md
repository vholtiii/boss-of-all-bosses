

# Add "Skip to Action Phase" Button

## What
Add a button that jumps directly from Deploy or Tactical phase to the Action phase, skipping intermediate phases. Shows only when the current phase is `deploy` or `move` (tactical).

## Changes

### `src/hooks/useEnhancedMafiaGameState.ts`
- Add `skipToActionPhase` callback that sets `turnPhase: 'action'` directly, computing the action budget (same logic as lines 840-845), resetting tactical moves, and clearing selection state
- Export it alongside `advancePhase`

### `src/pages/UltimateMafiaGame.tsx`
- Add a "⏭ Skip to Action" button next to the existing phase advance button
- Only visible when `turnPhase === 'deploy' || turnPhase === 'move'`
- Uses `variant="ghost"` and `size="sm"` to stay subtle

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — add `skipToActionPhase`
- `src/pages/UltimateMafiaGame.tsx` — render skip button

