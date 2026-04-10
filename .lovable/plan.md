

# Stop Supply Lines at HQ Hex Boundary

## Problem
Supply lines currently draw all the way to the HQ hex center point, visually penetrating into the HQ icon. They should stop at the hex edge/boundary.

## Solution
After building each path and reversing it (so HQ is the first point), replace the HQ center coordinate with a point on the hex boundary. Calculate the direction from HQ center toward the second point in the path, then place the first point at `baseHexRadius` distance along that direction.

### File: `src/components/EnhancedMafiaHexGrid.tsx` (~line 705-710)

After `pathKeys.reverse()` and the `pts` mapping, add logic:
```ts
// Offset first point (HQ) to hex boundary
if (pts.length > 1) {
  const hq = pts[0];
  const next = pts[1];
  const dx = next.x - hq.x;
  const dy = next.y - hq.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 0) {
    pts[0] = {
      x: hq.x + (dx / dist) * baseHexRadius,
      y: hq.y + (dy / dist) * baseHexRadius
    };
  }
}
```

This moves the HQ endpoint from the center to the edge of the hex in the direction of the first path segment. Single edit, ~10 lines added.

## Files Modified
- `src/components/EnhancedMafiaHexGrid.tsx`

