

# Deselect Soldier by Clicking Outside the Map

## Problem
Once a soldier is selected/highlighted (via map click or Capo Promotion panel), there's no way to deselect without clicking the same soldier again. Clicking outside the map should clear the selection.

## Solution
Add a click handler on the main game container (outside the hex grid) that clears `selectedUnitId` when the click target is not inside the map SVG.

### `src/pages/UltimateMafiaGame.tsx`
- Add a `deselectUnit` callback that sets `selectedUnitId: null, availableMoveHexes: []` via `handleAction({ type: 'deselect_unit' })`
- Add an `onClick` handler on the outermost game container div that calls `deselectUnit()`, but use `e.stopPropagation()` on the hex grid's container to prevent the deselect from firing when clicking the map itself

### `src/hooks/useEnhancedMafiaGameState.ts`
- Add `deselect_unit` case in the action handler (~line 3844+ area) that returns `{ ...state, selectedUnitId: null, availableMoveHexes: [], deployMode: null, availableDeployHexes: [] }`

### `src/components/EnhancedMafiaHexGrid.tsx`
- Add `onClick={e => e.stopPropagation()}` on the outermost wrapper div so map clicks don't bubble up to the deselect handler

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — add `deselect_unit` action
- `src/pages/UltimateMafiaGame.tsx` — add click-outside handler on game container
- `src/components/EnhancedMafiaHexGrid.tsx` — stop propagation on map wrapper

