

# Clear Supply Node Highlight on Map Click or Section Switch

## Changes

### 1. `src/components/EnhancedMafiaHexGrid.tsx`
- Add `onClearHighlight?: () => void` prop
- Call `onClearHighlight?.()` at the top of `handleHexClick` so any hex click on the map clears the supply highlight

### 2. `src/pages/UltimateMafiaGame.tsx`
- Pass `onClearHighlight={() => setBossHighlightHex(null)}` to both `EnhancedMafiaHexGrid` instances

### 3. `src/components/GameSidePanels.tsx`
- In `RightSidePanel`'s `toggle` function, call `onHighlightSupplyNode?.(null)` when switching away from the supply section (i.e., when the new section is not `'supply'`)

## Files Modified
- `src/components/EnhancedMafiaHexGrid.tsx`
- `src/pages/UltimateMafiaGame.tsx`
- `src/components/GameSidePanels.tsx`

