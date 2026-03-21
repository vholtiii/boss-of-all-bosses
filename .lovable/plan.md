

# Make District Borders Bold and Continuous (Like Reference Image)

The reference image shows **thick, bold, clearly visible** continuous outlines tracing each district's full perimeter shape. The current implementation uses subtle gray at 0.4 opacity and 2px — far too faint. Additionally, the edge-chaining algorithm may have a bug where it marks vertices as "visited" globally, preventing proper closed-loop formation when multiple vertices are shared across loops.

## Changes — `src/components/EnhancedMafiaHexGrid.tsx`

### 1. Fix edge-chaining algorithm (lines 198-227)
The current algorithm marks visited vertices globally and uses a simple greedy walk, which can fail to form proper closed loops for complex district shapes. Replace with a proper edge-consumption approach:
- Track **edges** as visited (not vertices), since vertices are shared between multiple edges
- For each unconsumed edge, start a new loop and follow connected unconsumed edges until returning to the start vertex
- This guarantees proper closed polygons even for districts with concave shapes or multiple boundary loops

### 2. Update border styling (line 768)
Change from the current subtle appearance to match the reference:
- `strokeWidth="3.5"` — bold and clearly visible
- `stroke="rgba(220,220,220,0.7)"` — bright enough to stand out like the reference image
- Keep `strokeLinejoin="round"` and `fill="none"`

### 3. Render borders above hex tiles
Move the border rendering block to appear **after** hex tile rendering in the SVG (currently at line 766-769), so borders render on top of everything and aren't obscured by hex fills. Place them just before the closing `</svg>`.

## Files Changed
- `src/components/EnhancedMafiaHexGrid.tsx`

