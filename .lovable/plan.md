

# Fix Deployed Units List — Show All Soldiers + Click to Select

## Problem
The "Deployed Units" section in the Boss/HQ dropdown only shows ~3 soldiers when more exist. List is either being clipped by a fixed-height container or rendering only a slice of the array. Clicking a unit also doesn't pan/select it on the map.

## Investigation Plan
Locate the deployed units list rendering in:
- `src/components/HeadquartersInfoPanel.tsx` (likely)
- or `src/components/GameSidePanels.tsx`

Look for: a fixed `max-h-*` class without scroll, a `.slice(0, 3)`, or missing `ScrollArea` wrapper. Also check if list items have an `onClick` that selects the unit and centers the map on its hex.

## Fix

### 1. Make full list visible
Wrap the deployed units list in a `<ScrollArea>` with a sensible max-height (e.g. `max-h-64`) so all units render and become scrollable when the list grows beyond panel space. Remove any `.slice()` truncation.

### 2. Click-to-select on map
Each unit row becomes a clickable button that:
- Sets the unit as the selected unit in game state
- Pans/centers the map on the unit's hex (using existing map-pan logic — same pattern used by the "Locate" actions in sitdown notifications)
- Highlights the row on hover (cursor pointer + bg accent)

### 3. Visual polish
- Show unit type icon (Capo vs Soldier), name, hex coords, and a small status badge (wounded/marked-for-death) per row
- Sticky header showing total count (e.g. "Deployed Units (7)")

## Files Touched
1. **`src/components/HeadquartersInfoPanel.tsx`** (or `GameSidePanels.tsx` — confirmed during implementation) — wrap list in `ScrollArea`, remove truncation, add click handler
2. **`src/pages/UltimateMafiaGame.tsx`** — pass map-pan/select callback prop if not already wired

No new dependencies; `ScrollArea` already exists in the UI kit.

