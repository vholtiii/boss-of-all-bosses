

# Fix: Supply Lines Invisible Due to SVG Render Order

## Problem
The supply route tint overlay and animated polyline are rendered **before** the main hex tiles in the SVG. Since SVG paints back-to-front, the opaque territory hex fills (line 770+) completely cover the supply line visuals (lines 718-765). The lines exist but are hidden underneath.

## Solution
Move the supply route polylines to render **after** all hex tiles, so they paint on top of territory colors.

### Changes to `src/components/EnhancedMafiaHexGrid.tsx`

**1. Split the supply route IIFE into two parts:**
- **Part A (keep in place, lines ~624-735):** The BFS computation + `defs` (filter, marker) + district tints + hex corridor tint overlay — these should remain underneath the hexes as a subtle background tint
- **Part B (move after hex tiles):** The polyline group (lines 737-765) — the bold animated dashed lines with arrows and glow — moved to render after all hex tiles so they draw on top

**2. Store `routePaths`, `pColor`, and `markerId` on `window` (same pattern already used for `__supplyRouteHexSet`)** so Part B can access them outside the IIFE.

**3. Render Part B** after the main hex tile `.map()` block (after approximately line 950+), ensuring the animated supply lines are always visible on top of territory colors.

### Visual Result
- Bold animated dashed lines with directional arrows will now be clearly visible on top of all hex tiles
- The subtle hex corridor tint remains underneath as a background indicator
- No change to the line styling itself — the existing bold styling is sufficient once rendering order is fixed

## Files Modified
- `src/components/EnhancedMafiaHexGrid.tsx` — move polyline rendering after hex tiles

