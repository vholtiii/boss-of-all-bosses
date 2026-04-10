

# Fix Supply Line Branching & Neutral Hex Rendering

## Problem

1. **Deduplication breaks branching paths**: The current dedup logic strips shared segments from the second path when two supply routes share a trunk. This makes the second route visually disconnected -- it renders as a floating stub instead of a continuous line from HQ that branches off.

2. **Supply line renders over neutral hexes**: Supply node hexes (Docks, Union Hall, etc.) are neutral by design but get added to the BFS traversal set (line 670) so paths can reach them. The tint overlay then highlights these neutral hexes as part of the supply route. This is mechanically correct (the route reaches the node), but visually confusing.

## Solution

### 1. Remove segment deduplication entirely (~lines 709-724)

With the thinner stroke widths already in place (glow: 3, main: 2), overlapping paths are visually acceptable. Two supply routes sharing a trunk and then branching will look like a single line on the shared portion (barely thicker) and cleanly fork where they diverge. This is exactly what the user wants.

Replace the dedup block with a simple assignment: `const routePaths = rawRoutePaths;`

### 2. Include HQ hex in path (fix line 697)

Currently the path backtrace stops *before* the HQ hex (`if (nextCk === hqKey) break`). This means supply lines don't visually connect to the HQ. Fix: include the HQ position in the path by adding it after the break.

### 3. Keep neutral supply node tint as-is

The supply node hex being tinted is correct -- it shows the route endpoint. No change needed here since the game mechanic intentionally allows reaching adjacent neutral supply nodes.

## Files Modified
- `src/components/EnhancedMafiaHexGrid.tsx` -- remove dedup, fix HQ inclusion in path

