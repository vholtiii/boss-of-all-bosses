

# Highlight Rival Family Hexes on Click + Clear on Background Click

## Overview
Clicking a rival family card in the "Rival Families" section highlights all hexes belonging to that family on the map. Clicking the grey map background (outside any hex) clears the highlight and deselects the family.

## Changes

### 1. `src/pages/UltimateMafiaGame.tsx`
- Add `highlightedFamily` / `setHighlightedFamily` state (`string | null`)
- Pass `highlightedFamily` to `EnhancedMafiaHexGrid` (both desktop and mobile instances)
- Pass `onHighlightFamily={setHighlightedFamily}` and `highlightedFamily` to `RightSidePanel` instances
- Pass `onClearHighlight` to also clear `highlightedFamily` (extend existing clear to reset both `bossHighlightHex` and `highlightedFamily`)

### 2. `src/components/EnhancedMafiaHexGrid.tsx`
- Add `highlightedFamily?: string | null` prop
- When `highlightedFamily` is set and a hex's `controllingFamily` matches, render a pulsing highlight ring around it (similar to the gold `bossHighlightHex` ring but in a distinct color, e.g. the family's own color)
- Add an invisible background `<rect>` in the SVG (covering the full viewBox) that calls `onClearHighlight?.()` on click — this handles clicking the grey/empty area

### 3. `src/components/GameSidePanels.tsx`
- Add `onHighlightFamily?: (family: string | null) => void` and `highlightedFamily?: string | null` props to `RightSidePanel`
- Make each rival family card clickable: toggle `highlightedFamily` (click same family again to deselect)
- Add `cursor-pointer` and a selected border style when the family is highlighted
- Play click sound on selection
- Clear `highlightedFamily` when switching away from the 'rivals' section (extend existing `toggle` logic)

## Files Modified
- `src/components/EnhancedMafiaHexGrid.tsx`
- `src/components/GameSidePanels.tsx`
- `src/pages/UltimateMafiaGame.tsx`

