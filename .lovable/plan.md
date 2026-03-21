

# Make District Border Outlines Thicker and More Cohesive

## Problem
The current district border lines are thin (1.5px) and semi-transparent (0.35 alpha), making them look fragmented and hard to see as continuous borough boundaries.

## Fix

### `src/components/EnhancedMafiaHexGrid.tsx` — Line 713
Change the border line rendering to use:
- **Thicker stroke**: `3px` instead of `1.5px`
- **Higher opacity**: `rgba(255,255,255,0.6)` instead of `0.35`
- **Round line caps and joins**: `strokeLinecap="round"` and `strokeLinejoin="round"` so adjacent segments blend together seamlessly instead of showing gaps at corners

This single styling change will make the same edge segments visually merge into cohesive continuous outlines around each borough.

### Hex vertex alignment fix
The current angle calculation uses `(Math.PI / 3) * i` starting at 0 degrees. Need to verify this aligns with the actual hex rendering orientation. If the hexes use a 30-degree offset (flat-top vs pointy-top), the border edges may be slightly misaligned, causing visible gaps. Will adjust the angle offset to match the hex polygon rendering if needed.

