

# Scale Supply Node Minimum Distance by Map Size

## Problem
The minimum hex distance for supply nodes from HQs is hardcoded to 7, regardless of map size. On a small map (radius 7), 7 hexes is the entire radius — making valid placements extremely scarce. On a large map (radius 13), 7 hexes is relatively close.

## Solution
Scale the minimum distance proportionally to the map radius:

| Map Size | Radius | Min Distance |
|----------|--------|-------------|
| Small    | 7      | 4           |
| Medium   | 10     | 6           |
| Large    | 13     | 8           |

Formula: `Math.max(4, Math.floor(mapRadius * 0.6))`

## Change
One edit in `src/hooks/useEnhancedMafiaGameState.ts` around line 754-755:

**Before:**
```typescript
// Minimum distance of 7 hexes from any HQ
const tooClose = hqPositions.some(hq => hexDistance(hq, t) < 7);
```

**After:**
```typescript
// Minimum distance scales with map size (small=4, medium=6, large=8)
const minSupplyDistance = Math.max(4, Math.floor(mapRadius * 0.6));
const tooClose = hqPositions.some(hq => hexDistance(hq, t) < minSupplyDistance);
```

Also update the comment on line 748 to reflect the scaling logic.

## File Modified
- `src/hooks/useEnhancedMafiaGameState.ts`

