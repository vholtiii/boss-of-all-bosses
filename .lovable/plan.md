

# Family Selection Screen Enhancement — Particles, Crests & Gritty Cards

## Scope
Implement three enhancements to the family selection screen: an atmospheric particle system, animated family crests on each card, and a gritty street-style card redesign. Title animation, detail panel changes, and background overhaul are deferred.

## 1. Atmospheric Particle System

Create a canvas-based particle overlay rendered behind the UI content:
- ~50 particles: small dust motes and embers drifting upward with slight horizontal sway
- Warm amber/gray tones, low opacity (0.1–0.4)
- Subtle parallax response to mouse position
- Canvas element is `pointer-events: none`, `position: fixed`, behind content
- Runs at ~30fps via `requestAnimationFrame` with frame-skip logic
- Built as a standalone `<AtmosphericParticles />` component

**New file:** `src/components/AtmosphericParticles.tsx`

## 2. Animated Family Crests

Add a unique inline SVG crest/emblem to each family card:
- **Gambino**: Crown with dollar sign
- **Genovese**: Eye with serpent
- **Lucchese**: Crossed keys
- **Bonanno**: Shield with fist
- **Colombo**: Crossed swords

Each crest:
- Renders above the family name in the card, sized ~32x32px
- Colored in the family's theme color
- Pulses/glows on hover using framer-motion
- On selection: brief scale-up + glow burst animation

Crests defined as a `familyCrestMap` object in `FamilySelectionScreen.tsx` or a small helper file.

## 3. Gritty Street-Style Card Redesign

Restyle the existing 150px family cards:
- Slightly uneven edges via CSS `clip-path: polygon(...)` for a distressed look
- Subtle concrete-like noise texture background (CSS SVG data URI, no image assets)
- Thicker, more industrial stat bars — taller (h-3), with a brushed/rough feel
- Selected card: harsh directional glow (box-shadow with family color), spray-paint style top accent bar
- Unselected cards: rougher border style, muted tones
- Add a faint grunge noise overlay to the entire screen background (CSS-only, very low opacity)

**Modified file:** `src/components/FamilySelectionScreen.tsx` — card section rewrite, add particle component, integrate crests
**Modified file:** `src/index.css` — add any needed keyframes (glow pulse, ember drift)

## Technical Notes
- No external dependencies — canvas API for particles, inline SVGs for crests, CSS for textures
- Particle component uses `useRef` + `useEffect` with cleanup on unmount
- All visual textures are CSS-generated (no image assets to load)
- Existing layout structure (card grid, detail panel, difficulty/map selectors) stays the same

