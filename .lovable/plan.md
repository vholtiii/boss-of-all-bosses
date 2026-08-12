# Fewer, Clearer Pre-Built Rackets

## What I checked

Pre-built earners on the map are the "anchor rackets" seeded at map generation: 4 (small) /
5 (medium) / 6 (large), spaced at least 5 hexes apart. On the map an unclaimed anchor draws at
32x28px, 72% opacity and desaturated, which is why they are hard to read against the hex art.

## What changes

**About 20% fewer pre-built buildings**
- Anchor counts drop to 3 (small) / 4 (medium) / 5 (large).
- Spacing logic is unchanged; with fewer anchors they naturally sit further apart.
- Each remaining anchor leans slightly richer so early income stays roughly where it is today.

**Pre-built rackets are easier to see**
- Unclaimed anchors render at close to full size and full opacity instead of shrunken and faded,
  so the building itself is legible.
- They stay visually distinct from your own builds via a marker rather than dimming: a subtle
  cream/neutral ring under the sprite plus a small "racket" tribute tag showing what it pays.
- Once bought out, the sprite switches to the normal owned-building look (owner-coloured, full
  size) so the takeover is visible at a glance.

## Technical notes

- `ANCHOR_COUNT_BY_MAP_SIZE` -> `{ small: 3, medium: 4, large: 5 }` in `src/types/game-mechanics.ts`;
  tribute weighting in `placeAnchorRackets` nudged up to compensate.
- Sprite branch in `EnhancedMafiaHexGrid.tsx`: raise anchor sprite size/opacity, drop the
  `saturate(0.55)` filter, add a neutral base ring + tribute tag for un-bought anchors.
- No save-schema change; new counts apply to newly generated maps.
- Existing simulation/strategy tests run after the change.

## Scope guards

- Only anchor count and anchor rendering change. Claiming, extort, buy-out, building tiers,
  combat, diplomacy and AI behaviour untouched.
