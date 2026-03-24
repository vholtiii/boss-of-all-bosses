

# Borough Outlines + Strategic Gameplay Suggestions

## Part 1: District Border Outlines

### Problem
All six boroughs blend together visually. The faint district abbreviations and low-opacity name labels are not enough to distinguish boundaries.

### Solution
Draw thick border lines along hex edges where two adjacent hexes belong to different districts. This creates a clear outline around each borough.

### Implementation — `src/components/EnhancedMafiaHexGrid.tsx`

**New `useMemo` block** computes district boundary segments:
1. For each hex, check all 6 neighbors (using cube coordinate neighbor offsets)
2. If a neighbor belongs to a different district (or doesn't exist — map edge), that hex edge is a boundary
3. Collect the two corner points of that edge as a line segment
4. Render all segments as `<line>` elements with a dashed or solid white/gold stroke (~1.5px, ~40% opacity)

Corner point math: each hex edge `i` (0-5) connects vertex `i` to vertex `(i+1)%6` using the existing `getHexPoints` angle formula.

Neighbor direction → edge index mapping for pointy-top hexes ensures the correct edge is highlighted.

**Render layer**: Insert the boundary lines as a group **above** the hex fills but **below** unit icons and action menus (between the hex `<g>` blocks and the district name labels around line 848).

### Visual Style
- Stroke: `rgba(255, 255, 255, 0.35)`, width `1.5`
- Dashed: `strokeDasharray="4,3"` for a subtle cartographic feel
- No interactivity (`pointer-events: none`)

### Files Modified
- `src/components/EnhancedMafiaHexGrid.tsx` — add boundary segment computation + render

---

## Part 2: Strategic Gameplay Suggestions

Based on the current mechanics, here are refinements to deepen strategy:

### A. District Control Bonus
When a family controls 60%+ of hexes in a district, they gain a passive bonus specific to that district (e.g., Manhattan: +20% business income, Bronx: -2 heat/turn). This incentivizes focusing on districts rather than spreading thin.

### B. Supply Lines
Units more than 4 hexes from any friendly hex with a business get -1 loyalty/turn ("cut off from supply"). This punishes overextension and rewards building infrastructure behind the front line.

### C. Morale Cascade
When 2+ soldiers are killed in a single turn, remaining soldiers on adjacent hexes lose 5 loyalty each. This makes concentrated losses dangerous and encourages spreading units.

### D. Territorial Pressure
If an enemy controls 3+ hexes adjacent to your hex, that hex generates 25% less income ("surrounded pressure"). Creates natural incentive to secure borders.

I recommend implementing **District Control Bonus** and **Supply Lines** as they add the most strategic depth with the least complexity. Shall I include them in this plan or tackle them separately?

### Files Modified (Part 2, if approved)
- `src/types/game-mechanics.ts` — new constants
- `src/hooks/useEnhancedMafiaGameState.ts` — district bonus calc, supply line loyalty drain
- `src/components/GameSidePanels.tsx` — display district control progress + bonuses

