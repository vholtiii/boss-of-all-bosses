

# Fix: Make Supply Lines Visually Prominent on the Map

## Problem
The current supply route polyline (`strokeWidth: 2.5`, `strokeOpacity: 0.4`) and hex tint (`fillOpacity: 0.15`) are nearly invisible against district background tints and territory colors.

## Solution
Make the supply line a bold, animated, dashed line with higher contrast — plus boost the hex corridor tint.

### Changes to `src/components/EnhancedMafiaHexGrid.tsx`

**1. Boost hex corridor tint**
- `fillOpacity`: 0.15 → 0.25
- `strokeOpacity`: 0.30 → 0.50
- `strokeWidth`: 1 → 1.5

**2. Replace subtle polyline with bold animated dashed line**
- `strokeWidth`: 2.5 → 4
- `strokeOpacity`: 0.4 → 0.8
- Add `strokeDasharray="8 4"` for a dashed pattern
- Add CSS `@keyframes` animation to make dashes flow along the route (moving dash effect suggesting goods flowing from HQ to node)
- Add a faint glow filter (`feGaussianBlur`) behind the line for extra pop

**3. Add directional arrow markers**
- Define an SVG `<marker>` arrowhead in the family color
- Apply `marker-mid` on the polyline so small arrows appear along the route, indicating direction (HQ → Node)

### Visual Result
- A pulsing, animated dashed line with small directional arrows threading through a tinted hex corridor
- Clearly distinguishable from territory borders and district tints
- Still thematically subtle — not garish

## Files Modified
- `src/components/EnhancedMafiaHexGrid.tsx` — polyline styling + hex tint opacity boost
- `src/index.css` — `@keyframes supplyFlow` for animated dash offset

