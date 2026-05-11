## Goal

Allow the player to click-and-drag the hex map to pan to any region, especially after zooming in. Today only zoom (0.3x–2.5x) works; panning is intentionally locked, which makes zoomed-in views unusable because off-screen hexes can't be reached.

## Changes

All work is in `src/components/EnhancedMafiaHexGrid.tsx` (the only file rendering the map).

1. **Add pan state** alongside the existing `zoom`:
   - `pan = { x, y }` (in SVG units), default `{ 0, 0 }`.
   - Apply via the existing inner `<g>` transform: `transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}`.

2. **Mouse drag handlers** on the map container `<div>` (or the `<svg>`):
   - `onMouseDown`: record start position + current pan, set `isPanning=true`. Only start when the target is the SVG background / empty area, not when clicking a hex polygon, unit, HQ, or any interactive element (use `event.target` tag check or a data attribute on the background `<rect>`).
   - `onMouseMove`: if panning, update `pan` by `(currentClient - startClient) / zoom` so drag distance feels 1:1 on screen at any zoom.
   - `onMouseUp` / `onMouseLeave`: clear panning state.
   - Suppress the background `<rect>`'s click-to-clear-selection handler when a drag actually moved the cursor more than a few pixels (so a real drag doesn't also count as a click).
   - Cursor: `grab` when idle, `grabbing` while dragging.

3. **Touch support** (basic): mirror mouse handlers with `onTouchStart/Move/End` using the first touch point so the map is pannable on trackpads/tablets too.

4. **Reset behavior**: the existing reset button (`RotateCcw`, sets zoom to 1) should also reset `pan` to `{0,0}`. The Ctrl+0 keyboard shortcut should do the same.

5. **Auto-center on HQ** still runs once at load (current behavior); panning then takes over from the player.

6. **Memory update** (`mem://ui/map-navigation`): replace the "manual click-drag panning is disabled" rule with the new behavior — drag-to-pan enabled at all zoom levels, reset button/Ctrl+0 returns to HQ-centered view.

## Out of scope

- No changes to zoom range, hex sizing, sprites, sidebars, or any gameplay logic.
- No momentum/inertia, no minimap, no pan-bounds clamping (can be added later if the user wants).
- Wheel-to-zoom / pinch-to-zoom not added unless requested.
