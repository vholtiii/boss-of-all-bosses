

# Highlight Supply Node Hex When Clicking Supply Line Info Panel

## Overview
Clicking a supply node entry in the "Supply Lines" section of the right side panel will highlight that node's hex on the map using the existing `bossHighlightHex` gold pulsing ring mechanism.

## Changes

### 1. `src/components/GameSidePanels.tsx`
- Add `onHighlightSupplyNode?: (hex: { q: number; r: number; s: number } | null) => void` and `highlightedSupplyHex?: { q: number; r: number; s: number } | null` to `RightSidePanel` props
- Make each supply node card (`<div key={node.type} ...>`) clickable with `cursor-pointer` styling
- On click, toggle: if already highlighted, clear it (`null`); otherwise set the node's `{q, r, s}`
- Add a visual selected state (e.g. brighter border) when the node is currently highlighted

### 2. `src/pages/UltimateMafiaGame.tsx`
- Pass `onHighlightSupplyNode={setBossHighlightHex}` and `highlightedSupplyHex={bossHighlightHex}` to all `RightSidePanel` instances (desktop sidebar + mobile tab)

No new state needed -- reuses the existing `bossHighlightHex` / gold pulsing ring system already rendered in `EnhancedMafiaHexGrid`.

## Files Modified
- `src/components/GameSidePanels.tsx`
- `src/pages/UltimateMafiaGame.tsx`

