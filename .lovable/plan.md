

# Supply Line Visual Improvements

## Changes

### 1. Line stops at HQ neighbor, not HQ center
In the BFS path builder (line 664), the path currently traces all the way back to the HQ hex. Change: when building `pathKeys`, stop one hex before the HQ (skip the final `""` parent AND the HQ key itself). The line will terminate at the last non-HQ hex center, visually "touching" HQ without entering it.

### 2. Uniform light grey color for all supply lines
Replace `pColor` (family color) with a fixed `#B0B0B0` (light grey) for:
- The hex corridor tint fill
- The polyline stroke color
- The glow filter
- The arrow marker fill

This makes supply lines visually distinct from family territory colors and consistent across all families.

### 3. Toggle button to show/hide supply lines
Add a `showSupplyLines` state (default `true`) to `EnhancedMafiaHexGrid`. Render a small toggle button in the map controls area (near zoom buttons) using the existing `Eye`/`EyeOff` icons. When toggled off:
- Hide the hex corridor tint overlay
- Hide the polyline group
- Supply node icons and badges remain visible (just the lines disappear)

## Files Modified
- `src/components/EnhancedMafiaHexGrid.tsx` — all three changes above

