# Hover Tile Info: Delayed + Sticky UX

## What to change
Fix the hex tile info popup so it is usable instead of evasive.

## Plan
1. **Add delayed hover state** in `src/components/EnhancedMafiaHexGrid.tsx`.
   - Keep the existing `hoveredHex` for immediate hex highlight / visual feedback.
   - Add a new `delayedHoverHex` state for the info panel.
   - Add a `hoverTimerRef` to hold the active timeout.

2. **Start a 1-second delay on tile mouse enter**.
   - `onMouseEnter` of a hex tile: clear any pending timer, then start a new `setTimeout(1000)` that sets `delayedHoverHex` to that tile.
   - This prevents the popup from flashing instantly while the cursor is only passing over tiles.

3. **Make the popup sticky**.
   - `onMouseLeave` of a hex tile must NOT clear `delayedHoverHex`.
   - The popup stays open for the currently hovered tile, so the user can move the cursor into the popup panel and click it.
   - When the cursor enters a **different** hex tile, clear the old timer and start the 1-second delay for the new tile.
   - Add a brief grace delay (≈300ms) when the cursor leaves the entire map surface / popup area, then clear `delayedHoverHex` if no new tile is entered.

4. **Wire the popup to the delayed state**.
   - Render the existing hover info panel from `delayedHoverHex` instead of `hoveredHex` (keep `pinnedHex` as the override priority).
   - Clicking the popup calls `handleHexClick(displayHex)` and then clears `delayedHoverHex` and `pinnedHex` so the popup dismisses.
   - Ensure `pointer-events-auto` remains on the popup so it is fully clickable.

## Expected result
- Moving the cursor over tiles briefly no longer spawns a popup instantly.
- After 1 second, the popup appears and stays open until the user hovers a different tile, allowing clicks on the popup to select the tile/hex.
- The existing immediate hover highlight on the hex itself remains unchanged.

## Files affected
- `src/components/EnhancedMafiaHexGrid.tsx`

## Verification
- Hover a tile for <1s: no popup.
- Hover a tile for 1s: popup appears.
- Move cursor into the popup: popup stays open.
- Click inside the popup: tile is selected and popup closes.
- Hover a second tile for 1s: popup switches to the new tile.
