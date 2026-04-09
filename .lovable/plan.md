

# Show All Families' Supply Lines on Map

## Problem
The supply route BFS only runs for the player's family. When the toggle is on, only the player's supply lines are visible — rival families' connected routes are hidden.

## Solution
Expand the BFS computation to run for **every family** that has an HQ on the map, not just `playerFamily`. All routes render in the same uniform light grey, so rival supply lines look identical to the player's.

### Changes to `src/components/EnhancedMafiaHexGrid.tsx`

**1. Loop BFS over all families (lines ~634-695):**
- Find all unique families with HQs: `hexMap.filter(t => t.isHeadquarters).map(t => t.isHeadquarters)`
- For each family, run the existing BFS logic (build hex set from that family's controlled territory, find paths to supply nodes)
- Merge all results into the shared `supplyRouteHexSet`, `connectedNodeKeys`, and `routePaths` arrays

**2. Supply node neighbor check per family:**
- The existing check that adds supply nodes to BFS only if they have a player-controlled neighbor — apply this per-family using that family's hex set

**3. HQ exclusion per family:**
- The "stop before entering HQ" logic already uses `hqKey` — this naturally works per-family since each iteration uses its own HQ tile

**4. No changes to rendering:**
- The polyline rendering, hex tint overlay, toggle button, and marker definitions all remain the same — they already consume the shared data structures

## Files Modified
- `src/components/EnhancedMafiaHexGrid.tsx`

