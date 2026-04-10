

# Test Supply Node Distances on All Map Sizes

The TypeScript build errors are **already resolved** — `npx tsc --noEmit` passes cleanly with zero errors. The stale errors were from a previous state.

## Testing Plan

To verify supply node minimum distances work correctly, I'll add a temporary console.log in the supply node placement code that prints the map size, radius, calculated minimum distance, and actual distances of placed nodes from each HQ. Then start 3 new games (small, medium, large) and check the console output.

### Steps

1. **Add debug logging** in `useEnhancedMafiaGameState.ts` after supply node placement (around line 763):
   ```typescript
   console.log(`[Supply Nodes] Map radius=${mapRadius}, minDist=${minSupplyDistance}`);
   supplyNodes.forEach(node => {
     const dists = hqPositions.map(hq => hexDistance(hq, { q: node.q, r: node.r, s: node.s }));
     console.log(`  ${node.type}: min HQ dist = ${Math.min(...dists)}`);
   });
   ```

2. **Start 3 new games** — one each on Small, Medium, Large map size — and verify console output shows:
   - Small: all nodes >= 4 hexes from any HQ
   - Medium: all nodes >= 6 hexes from any HQ
   - Large: all nodes >= 8 hexes from any HQ

3. **Remove debug logging** after verification.

### File Modified
- `src/hooks/useEnhancedMafiaGameState.ts` (temporary debug lines, then removed)

