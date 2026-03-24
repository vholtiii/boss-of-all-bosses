

# Replace Boss Icon

## Change
Replace `src/assets/boss-icon.png` with the new uploaded mafia boss image (fedora, sunglasses, red tie). Then update the CSS filters in `HeadquartersInfoPanel.tsx` since the new image has a transparent/white background with full color — the current `invert(1) sepia(1)` filters will distort it.

## Files Modified
- `src/assets/boss-icon.png` — overwrite with new uploaded image
- `src/components/HeadquartersInfoPanel.tsx` — remove the heavy CSS filters (`invert`, `sepia`, `hue-rotate`) from the boss icon `<img>`, keep just the circular container with gold border/glow. The new image has good contrast and color already.

