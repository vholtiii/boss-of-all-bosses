

## Make the Map Bigger & More Board-Game-Like

### What Changes

**1. Increase map radius from 6 to 10 (~300 hexes)**
- Update `mapRadius` in `createInitialGameState` from 6 to 10
- Spread the 5 HQ positions further apart to use the new space (e.g., Gambino at (-9,9,0), Genovese at (9,-9,0), etc.)
- Adjust the `getDistrict` function boundaries so all 6 districts scale proportionally across the larger map
- Increase business density slightly — keep ~30% but tune the hash to ensure good distribution

**2. Shrink hex size for fit**
- Reduce `baseHexRadius` from 35 to ~22 so the larger map remains viewable without panning
- Auto-center the SVG viewBox on the player's HQ on initial load
- Adjust zoom range: min 0.3, max 2.5 (currently 0.5–2)

**3. District labels overlaid on the map**
- Calculate the centroid of each district's hexes
- Render SVG `<text>` elements at each centroid with the district name (e.g., "BROOKLYN", "MANHATTAN")
- Style: semi-transparent white, uppercase, font-playfair, large font size, pointer-events: none
- Labels scale with zoom

**4. Update neighbor/territory claims for larger radius**
- Each family still claims HQ + adjacent hexes at start — more neutral territory to conquer
- `buildLegacyTerritories` already works dynamically off hexMap, no change needed

### Files to Change

| File | Change |
|------|--------|
| `src/hooks/useEnhancedMafiaGameState.ts` | `mapRadius = 10`, new HQ positions, updated `getDistrict` boundaries |
| `src/components/EnhancedMafiaHexGrid.tsx` | Smaller `baseHexRadius` (~22), wider zoom range, district label rendering, auto-center viewBox |

