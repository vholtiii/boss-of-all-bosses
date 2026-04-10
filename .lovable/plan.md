

# Make Pinned Hex Info Persist Until Click

## Problem

When you click a soldier/capo, the hex info panel appears (pinned), but it disappears as soon as you hover over any other hex because `onMouseEnter` calls `setPinnedHex(null)`.

## Fix

**File: `src/components/EnhancedMafiaHexGrid.tsx`**

1. **Line 859** — Remove `setPinnedHex(null)` from the hex polygon's `onMouseEnter`. The hovered hex info should layer under the pinned hex, not replace it. Change the display priority to `pinnedHex || hoveredHex` (already correct on line 1820).

2. **Line 1820** — Change display priority to `pinnedHex || hoveredHex` so pinned always wins when set. (Already correct, no change needed.)

3. **Line 859** — Keep `setHoveredHex(tile)` but do NOT clear pinnedHex on hover. The pinned hex will only clear on explicit clicks.

4. **Clearing pinnedHex** — It should ONLY clear when:
   - User clicks a hex (already in `handleHexClick`, line 270)
   - User clicks the info panel itself (already on line 1828)
   - User clicks the SVG background (add `onClick={() => setPinnedHex(null)}` to the SVG background click handler)

5. **Display logic** (line 1820) — Change from `hoveredHex || pinnedHex` to `pinnedHex || hoveredHex` so that while a hex is pinned, hovering other hexes does NOT replace the displayed info.

One-line removal + one priority swap. Minimal change.

