# Fix: deploy mode leaks into free movement

## The bug

When you choose "Deploy Soldier", the map highlights the valid deploy ring (HQ/safehouse adjacent hexes). But if you then click any other hex, the click quietly falls through to the normal unit-selection path. That path selects a soldier and offers the full free-movement set (all connected territory plus adjacent hexes), silently cancelling deploy mode. The result looks like deploying a soldier well outside the deploy boundary.

Two click paths cause this:
- The deploy-phase HQ branch selects a unit at HQ even while deploy mode is active.
- The deploy-mode branch explicitly falls through to unit selection when the clicked hex is not a valid deploy hex.

## The fix

Make deploy mode exclusive while it is active:

1. While `deployMode` is set, a click on a hex that is not in the highlighted deploy set does not select or move a unit. It simply cancels deploy mode (clears the highlight) and does nothing else, so no movement can occur on the same click.
2. While `deployMode` is set, clicking the player HQ toggles the HQ picker/panel only. It no longer auto-selects a unit at HQ for movement.
3. Deploying itself is unchanged: the unit still lands only on a highlighted hex and ends with 0 moves.

Normal deploy-phase movement remains available exactly as before — you just have to exit deploy mode first (one extra click on empty map or the deploy toggle), which also matches how selection clears elsewhere.

## Technical detail

All changes are in `src/components/EnhancedMafiaHexGrid.tsx` inside `handleHexClick`:
- Guard the deploy-phase HQ branch with `!gameState?.deployMode` before calling `onSelectUnit`.
- In the deploy-mode branch, replace the "fall through to unit selection" comment with an early return that clears deploy mode via the existing clear-selection handler.

No game-state hook or balance logic changes.
