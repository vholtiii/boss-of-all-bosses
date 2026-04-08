

# Fix: Make Full Supply Line Chain Visible on Map

## Problem
The supply route hex-chain tint overlay at 8% opacity is nearly invisible against the 10-12% district background tints. The user sees no visual indication of the route from HQ to the supply node.

## Solution
Increase the tint visibility and add a connecting line between hex centers along the route path for clarity.

### Changes to `src/components/EnhancedMafiaHexGrid.tsx`

1. **Increase hex tint opacity**: Raise `fillOpacity` from `0.08` to `0.15` and `strokeOpacity` from `0.15` to `0.30` on the supply-route hex polygons. This makes the corridor clearly stand out over district tints.

2. **Add a connecting polyline**: Draw a thin line (`strokeWidth="2.5"`, `strokeOpacity="0.4"`) through the centers of all hexes in each route path (from HQ to node), using the family color. This creates a visible "supply line" thread through the tinted corridor.

3. **Fix BFS to include supply node hex**: Currently the BFS on line 632/644 only walks through player-controlled hexes. If a supply node is on a neutral hex adjacent to player territory, the route never connects. Add supply node hex keys to `pHexSet` so the BFS can reach them as endpoints even if they aren't formally "controlled."

### Visual Result
- Tinted corridor of hexes (15% opacity) from HQ to each connected supply node
- Thin colored line threading through the corridor centers
- Connected node: green border + ✓ badge (existing)
- Disconnected node: red pulsing border + ! badge (existing)

## Files Modified
- `src/components/EnhancedMafiaHexGrid.tsx`

