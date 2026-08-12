# Fewer Standing Rackets, More Building From Bare Ground

## What I checked

Map generation already starts bare — every hex is created with no business, and the only pre-built
earners are the anchor rackets seeded afterwards. The count is currently 8 (small) / 10 (medium) /
12 (large), and every anchor draws a full building sprite on the map, so the opening board reads as
"lots of businesses already up."

## What changes

**Half as many anchors**
- Anchor counts drop to 4 (small) / 5 (medium) / 6 (large).
- Spacing between anchors increases so the survivors sit in clearly separate zones instead of
  clustering, and each remaining anchor stays a distinct high-value prize.
- Since there are fewer of them, each one leans a bit richer within the existing tribute bands —
  the total pre-placed money on the map still goes down, but any single anchor is worth fighting for.

**Anchors read as "someone else's racket", not your building**
- An unclaimed/extorted anchor renders with a smaller, dimmer sprite plus a tribute tag, so it is
  visually distinct from a block you developed yourself.
- Once you buy an anchor out, it switches to the normal full-size Tier 1 building sprite — the visual
  upgrade marks the moment it becomes yours.

**Construction is visible**
- A block with a build in progress shows a distinct under-construction scaffold marker (already the
  behaviour for `tile.build`), kept and made consistent with the new sprite sizing so you can tell
  at a glance: bare ground, scaffold, finished building, or foreign racket.
- Finished buildings only appear at tier 1+, so nothing draws on a block until a build actually
  completes.

**Map stays bare early**
- No other change to claiming, extorting, income, heat, or AI behaviour. Rivals develop their own
  blocks at the same pace as before; the difference is that the starting board has far less already
  standing on it.

## Technical notes

- `ANCHOR_COUNT_BY_MAP_SIZE` → `{ small: 4, medium: 5, large: 6 }`; `ANCHOR_MIN_SPACING` raised so
  the reduced set spreads across the map.
- Anchor tribute variance band nudged up in `placeAnchorRackets` so fewer anchors still gate
  meaningful early income.
- Sprite branch in `EnhancedMafiaHexGrid.tsx` splits the anchor case from the built case: unowned
  anchors get reduced size/opacity, bought-out anchors fall through to the normal building path.
- No save-schema change — existing saves keep loading; the new counts apply to newly generated maps.
- Existing simulation and strategy tests run afterwards to confirm the economy still balances with
  fewer anchors.

## Scope guards

- Victory conditions, turn structure, combat, diplomacy, heat/RICO and supply lines untouched.
- Building tiers, policies, crew growth and district upgrades untouched.
