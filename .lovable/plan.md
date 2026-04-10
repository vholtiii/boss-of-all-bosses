

# Change Supply Node Minimum Distance from 5 to 7

## Change
One line edit in `src/hooks/useEnhancedMafiaGameState.ts` at line 755:

- **Before**: `const tooClose = hqPositions.some(hq => hexDistance(hq, t) < 5);`
- **After**: `const tooClose = hqPositions.some(hq => hexDistance(hq, t) < 7);`

Also update the comment on line 748 from "at least 5 hexes" to "at least 7 hexes", and line 754 from "Minimum distance of 5" to "Minimum distance of 7".

This ensures supply nodes spawn at least 7 hexes from any HQ, making supply chains longer and more strategic. Note: this only affects new games — existing saves retain their current node placement.

