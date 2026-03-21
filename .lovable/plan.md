

# Draw Cohesive District Border Outlines as Connected Paths

## Problem
The current implementation draws individual `<line>` segments for each hex edge on a district boundary. Even with round caps, these appear as disconnected fragments rather than continuous shapes around each borough.

## Solution
Replace the individual line segments with a single connected `<path>` per district that traces the full outer perimeter of each borough as a closed polygon.

## Technical Approach

### `src/components/EnhancedMafiaHexGrid.tsx`

**1. Replace `districtBorderEdges` with `districtBorderPaths`**

Instead of collecting individual line segments, the new `useMemo` will:

- Group all hex tiles by `district`
- For each district, collect all boundary edges (same logic: neighbor missing or different district)
- **Chain the edges into ordered perimeter paths**: Starting from any edge, follow the next edge that shares an endpoint, building a continuous path. This handles districts with holes or disconnected regions by producing multiple sub-paths.
- Convert each ordered path into an SVG `<path>` `d` attribute string (e.g., `M x1,y1 L x2,y2 L x3,y3 ... Z`)

**2. Render as `<path>` elements instead of `<line>` elements**

Each district gets one or more `<path>` elements with:
- `stroke="rgba(200,200,200,0.4)"` — light gray, subtle
- `strokeWidth="2"`
- `fill="none"`
- `strokeLinejoin="round"` for smooth corners
- Closed paths (`Z` in the path data) for complete borough shapes

**3. Edge-chaining algorithm**

Build an adjacency map from edge endpoints (rounded to avoid float precision issues). Walk the chain: pick a starting vertex, follow connected vertices until returning to start. This produces a clean closed polygon per district boundary.

## Files Changed
- `src/components/EnhancedMafiaHexGrid.tsx` — Replace `districtBorderEdges` useMemo and its rendering block

