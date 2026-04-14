

# Add Mafia-Themed Background to Family Selection Screen

## What Changes

The current selection screen has a plain dark `bg-background` with subtle grain/noise overlays and particles. We'll add the uploaded silhouette image as a dramatic background, creating a moody, smoky mafia atmosphere.

## Approach

1. **Copy the uploaded image** into `src/assets/mafia-sitdown-bg.png`
2. **Update `FamilySelectionScreen.tsx`** to use the image as a full-bleed background with a dark overlay so the cards and text remain readable

### File: `src/components/FamilySelectionScreen.tsx`

- Import the image from `@/assets/mafia-sitdown-bg.png`
- On the root `<div>` (line 256), add the background image via inline style: `backgroundImage`, `backgroundSize: cover`, `backgroundPosition: center`
- Add a dark gradient overlay (`bg-black/70` or similar) between the image and the content so cards/text stay legible
- Keep the existing noise texture, grain, and atmospheric particles on top for consistency

### Visual Result
- The smoky silhouette of men at a table fills the background
- A dark semi-transparent overlay ensures all UI elements remain readable
- Existing grain and particle effects layer on top for depth
- The overall feel shifts from "dark UI" to "noir mafia meeting room"

## Technical Details
- One image asset added (`src/assets/`)
- One component file edited (`FamilySelectionScreen.tsx`) — ~5 lines changed
- Image imported as ES module for proper Vite bundling

