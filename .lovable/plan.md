## Problem

The supply-node ring in `EnhancedMafiaHexGrid.tsx` (lines 1469–1504) looks broken/incomplete because:

1. The type-icon badge (`<circle cx={x} cy={y - baseHexRadius*0.85} r={8}>`) sits **directly on the top vertex of the ring**, visually cutting the outline at the top.
2. The connection-status badge (✓ / !) sits on the upper-right edge, cutting that side too.
3. The `strokeDasharray="4,2"` on unconnected nodes reads as "half-drawn" rather than "pending", reinforcing the "incomplete outline" perception.
4. The ring is drawn early in the tile group, so later overlays at similar radii (fortify/safehouse markers, family highlight at `+5`) can overpaint segments.

## Fix (visual only, `src/components/EnhancedMafiaHexGrid.tsx`)

Rework the `tile.supplyNode` block (~1469–1504) so the outline is one continuous stroke and badges float clear of it:

- **Solid, continuous ring** at `baseHexRadius + 4`:
  - Add a dark backing polygon (same points, `stroke="#0b0b12"`, `strokeWidth="4.5"`, `opacity="0.9"`) so the ring reads on any background.
  - Draw the colored ring on top: `strokeWidth="2.5"`, `strokeLinejoin="round"`, `opacity="1"`, no dashes.
  - Colors: connected `#10B981`, player-owned + disconnected `#EF4444`, otherwise `#D4AF37`.
  - Represent "disconnected" with a subtle inner glow (second polygon at `+2`, `opacity 0.35`) instead of dashes, so the outer perimeter stays whole.
- **Move badges off the perimeter**:
  - Type-icon badge: shift from `y - baseHexRadius*0.85` to `y - baseHexRadius*1.15` (fully above the ring) and add a 1px dark halo circle behind it.
  - Status badge (✓ / !): move to `(x + baseHexRadius*0.75, y - baseHexRadius*1.05)` so it sits above-right of the ring, not on it.
- **Render order**: emit the supply-node group *after* the fortify/safehouse markers and the family highlight ring (or bump its `z` by placing it just before the boss/family highlight blocks) so nothing overpaints the perimeter. The badges remain the topmost element inside the group.
- Keep pointer-events off; no logic, tokens, or data changes.

## Out of scope

No changes to supply-node data, connectivity math, colors elsewhere, or hex geometry.
