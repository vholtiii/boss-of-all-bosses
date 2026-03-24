

# Fix: Soldier Card Click → Map Highlight in Capo Promotion

## Problem
The `onHighlightSoldier` callback dispatches `onAction({ type: 'select_unit', ... })`, but **no such action type exists** in the game state reducer. Unit selection is handled by a separate `selectUnit` function that lives in `UltimateMafiaGame.tsx` — it's passed to the hex grid as `onSelectUnit` but never passed to `LeftSidePanel`.

## Fix

### `src/pages/UltimateMafiaGame.tsx`
- Pass `selectUnit` to `LeftSidePanel` as a new prop `onSelectUnit={selectUnit}` (in both desktop and mobile renders, ~lines 456 and 275)

### `src/components/GameSidePanels.tsx`
- Add `onSelectUnit` prop to `LeftSidePanel` component signature
- In the `onHighlightSoldier` callback (~line 475-480), replace `onAction({ type: 'select_unit', ... })` with `onSelectUnit(unit.type, { q: unit.q, r: unit.r, s: unit.s })`

## Files Modified
- `src/pages/UltimateMafiaGame.tsx` — pass `selectUnit` prop
- `src/components/GameSidePanels.tsx` — accept and use `onSelectUnit` prop

