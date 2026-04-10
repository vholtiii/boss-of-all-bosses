

# Fix Supply Line Visuals: Thinner Lines, Smaller Arrows, Fix Merge Bug

## Problem
1. Lines too thick (glow `strokeWidth="6"`, main `strokeWidth="4"`)
2. Arrows too large (`markerWidth="5"`, `markerHeight="3"`)
3. All families' routes get pushed into one `routePaths` array, causing overlapping paths to visually merge. Since all lines are the same color and style, duplicate/overlapping segments stack and look like one thick blob.

## Solution

Keep everything uniform color (`#B0B0B0`) and same dash style -- no per-family distinction needed. The fix for the merge bug is to **deduplicate route segments** so overlapping paths from different families don't stack on top of each other creating visual thickness artifacts.

### File: `src/components/EnhancedMafiaHexGrid.tsx`

**1. Deduplicate overlapping route segments (~line 653-706)**
After the family loop finishes building `routePaths`, deduplicate: convert each path's hex keys to a sorted segment set, skip any path whose segments are already covered by a previously added path. This prevents two families sharing the same corridor from rendering two identical stacked polylines.

**2. Reduce line thickness (~line 1314-1335)**

| Element | Old | New |
|---|---|---|
| Glow polyline strokeWidth | 6 | 3 |
| Main dashed polyline strokeWidth | 4 | 2 |
| Dash array | `8 4` | `6 3` |

**3. Reduce arrow marker size (~line 726-736)**

| Property | Old | New |
|---|---|---|
| markerWidth | 5 | 3.5 |
| markerHeight | 3 | 2 |

## Files Modified
- `src/components/EnhancedMafiaHexGrid.tsx` -- deduplicate overlapping routes, thinner strokes, smaller arrows

