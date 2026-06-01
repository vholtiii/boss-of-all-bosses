## Remove background grid on Family Selection screen

The faint repeating "+" pattern visible behind the family selection screen comes from a decorative SVG background tile in `src/components/FamilySelectionScreen.tsx` (lines 414–420), commented as "Subtle background grain".

### Change
- Delete that `<div>` block entirely so no plus-grid pattern is layered over the background.
- Leave all other atmosphere intact: vignette/dark overlay, top decorative gradient line, atmospheric particles, and family imagery remain unchanged.

### Files
- `src/components/FamilySelectionScreen.tsx` — remove the 7-line grain/grid div.

No other components reference this pattern, and no logic is affected.