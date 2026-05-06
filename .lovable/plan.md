## Issue

The "NEW PLAYER PICK" badge on the Lucchese family card is being clipped at the top — the top of the green pill (and its star icon's top half) gets cut off. Same root cause subtly affects the selected-card top accent bar.

**Why:** the badge is a child of the card's `motion.div`, which has `clipPath: polygon(0% 0%, 95% 0%, 100% 100%, 5% 100%)` (the angled "playbill" card shape). `clip-path` clips ALL descendants regardless of negative margins / `-top-2` positioning. So anything placed outside the polygon (above the top edge or past the slanted sides) is invisible.

## Fix

Restructure each family card so the clipped artwork lives in an inner element, while overlays that need to escape the clip (recommended badge, top accent bar, spotlight glow) sit on an outer un-clipped wrapper.

In `src/components/FamilySelectionScreen.tsx` (around lines 471-579):

1. Wrap each card in an outer `motion.div` (no clip-path) that holds:
   - the hover/scale/3D transforms, click & keyboard handlers, focus ring, `aria-*`
   - the spotlight cone (`-inset-6` glow), already escapes via `-z-10` but currently still inside the clip
   - the top accent bar (`-top-0.5`) for selected state
   - the **"New player pick"** badge (`-top-2`, centered)

2. Inner `<div>` carries the clipped visuals only:
   - `clipPath: CARD_CLIP`
   - background, border, box-shadow, noise, padding
   - crest, name, difficulty, soldier count, trait bars
   - motto reveal overlay (still needs `clipPath` to match the card silhouette)

3. Move the focus-visible ring to the outer wrapper so the focus outline isn't clipped either.

4. Tiny tweak: give the badge `z-20` so it sits above the inner card border.

No changes to copy, colors, sizes, or interaction behavior — purely a DOM restructure to stop clipping overlays. Verify visually that:
- Lucchese badge renders fully above the card with star icon intact
- Selected accent bar shows full glow
- Hover spotlight cone reaches all the way out
- Motto overlay still respects the angled card shape on hover

## Files

- `src/components/FamilySelectionScreen.tsx` — single-file change
