

# Replace District Labels with District Border Outlines

## What Changes
Remove the district abbreviation text labels ("LI", "BX", etc.) from inside hexes. Instead, draw visible border lines along hex edges where two adjacent hexes belong to different districts.

## Technical Approach

### `src/components/EnhancedMafiaHexGrid.tsx`

**1. Remove district abbreviation labels (~lines 520-525)**
Delete the `{/* District abbreviation label */}` block that renders text like "LI", "BX" inside empty hexes.

**2. Add district border edge rendering (new code, before the hex tiles loop)**
- Create a `useMemo` that iterates over all hex tiles and checks each of the 6 hex neighbors
- For each edge where the neighbor is in a **different district** (or the neighbor doesn't exist — map edge), collect the two corner points of that shared edge
- Render these edges as `<line>` elements with a semi-transparent white/gray stroke (`rgba(255,255,255,0.35)`, ~1.5px width)
- The 6 neighbors of a hex `(q, r, s)` in cube coordinates are: `(q+1,r-1,s)`, `(q+1,r,s-1)`, `(q,r+1,s-1)`, `(q-1,r+1,s)`, `(q-1,r,s+1)`, `(q,r-1,s+1)`
- For each edge direction `i`, the two corner vertices are at angles `i*60°` and `(i+1)*60°` from the hex center

**3. Remove the `districtAbbreviations` constant (~lines 141-148)** since it's no longer needed.

This creates a subtle but clear visual grouping of districts without cluttering hex interiors with text.

