

# Add Boss Icon to HQ Panel

## Summary
Add the uploaded boss silhouette image as a clickable Boss unit card in the HeadquartersInfoPanel, replacing the current static yellow text line. No boss actions — just the visual unit display for now.

## Changes

### 1. Save boss icon asset
Copy the uploaded image (white background mafia silhouette, no text) to `src/assets/boss-icon.png`.

### 2. Update HeadquartersInfoPanel — `src/components/HeadquartersInfoPanel.tsx`

Replace the static Boss line (lines 199-205) with a styled card featuring:
- The boss icon image (imported from `src/assets/boss-icon.png`)
- Size ~40x40px, with a gold border/glow
- "The Boss" label and "At Headquarters" subtitle
- For the player's own HQ, make it visually interactive (cursor-pointer, hover glow) — groundwork for future actions
- For rival HQs, show it as view-only

The icon image will need the white background removed via CSS (`mix-blend-mode: multiply` or a circular clip with dark background) since it has a white background.

## Files Modified
- `src/assets/boss-icon.png` — new asset from uploaded image
- `src/components/HeadquartersInfoPanel.tsx` — replace Boss text line with icon card

