# Dismissible Hex Mini-Menu

## Problem
The hex action mini-menu stays open after the player tries to perform an action or clicks elsewhere on the map. There is no reliable way to close it at will, which blocks the view and feels sticky.

## Goal
Give the player multiple obvious ways to dismiss the hex action menu and its child pickers immediately.

## What we will change

1. **Background-click dismissal**
   - In `src/components/EnhancedMafiaHexGrid.tsx`, update the existing transparent background rect click handler so it also calls `setActionMenu(null)`, `setPlanHitUnitMenu(null)`, and `setFlipTargetMenu(null)`.
   - Keep the existing pan-suppress guard (`suppressBgClickRef`) so a drag does not accidentally close the menu.

2. **Explicit close button on the action menu**
   - Add a small "✕" close button to the action menu header, next to the action-pip counter.
   - Clicking it calls `setActionMenu(null)` and stops propagation so it does not re-open on the same hex.

3. **Explicit close button on child pickers**
   - Add a "✕ Cancel" header button to the Plan Hit target picker and the Flip Soldier target picker, calling their respective dismiss setters.

4. **Keyboard dismissal**
   - Add a window `keydown` listener (mounted only while any menu/picker is open) that closes the open menu on `Escape`.
   - Clean up the listener when no menu is open.

5. **Verify no accidental reopen**
   - Ensure the close button does not trigger the hex's own click handler and re-open the menu.
   - Ensure background clicks do not pass through to a hex underneath.

## Out of scope
- No changes to menu contents, action costs, or game mechanics.
- No changes to hover info panel behavior.

## Verification
- Typecheck passes.
- Playwright smoke test: open the action menu on a hex, click the ✕, click empty map, and press Escape; confirm the menu closes each time and the game remains interactive.
