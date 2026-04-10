

# Show Hex Info on Soldier/Capo Click + Make Hex Info Clickable

## What Changes

Two behaviors:

1. **Clicking a soldier/capo shows hex info**: When you click on a soldier or capo icon, the hex info panel (bottom-left) will appear for that unit's hex, just as if you were hovering over it. Currently, clicking a unit only selects it but the hover info disappears since your mouse leaves the hex polygon.

2. **Clicking the hex info panel selects/clicks that hex**: The hex info display becomes clickable. Clicking it triggers the same logic as clicking the hex itself (opening the action menu, selecting units, etc.).

## Technical Details

**File: `src/components/EnhancedMafiaHexGrid.tsx`**

1. **New state**: Add `pinnedHex` state (`HexTile | null`) alongside `hoveredHex`. The hex info panel renders from `pinnedHex || hoveredHex`.

2. **Soldier/Capo onClick handlers** (~lines 1309-1314 for soldiers, similar for capos): After calling `onSelectUnit`, also set `pinnedHex` to the tile the unit is on. This makes the hex info persist even after the mouse leaves.

3. **Hex info panel** (~line 1815): 
   - Render based on `pinnedHex || hoveredHex`
   - Add `cursor-pointer` and an `onClick` handler that calls `handleHexClick(displayedHex)` when the panel is clicked
   - Add a subtle visual cue (e.g. border highlight or "Click for actions" hint) to indicate it's interactive

4. **Clear pinnedHex**: Reset `pinnedHex` to null when:
   - The user hovers a different hex (so hoveredHex takes over naturally)
   - The user clicks elsewhere on the map background
   - An action menu opens

This is a lightweight change -- one new state variable and small tweaks to existing click/render logic.

