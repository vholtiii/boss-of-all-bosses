# City Panel: Civ-Style Tile & Business Management

Two things: stop old sessions from resurrecting the pre-pivot map full of businesses, and add a
proper city panel so developing a block is a real layer of play instead of a small popover.

## Why the map looks full of businesses

Fresh map generation is already bare — only 8–12 anchor rackets get seeded. The problem is that
starting a game silently restores the local autosave when the family matches, and the v4 save
migration converts every legacy per-hex business into a Tier 1 building, which draws a business
sprite. So you are looking at an old save, not a new map.

**Fix:** picking a family on the selection screen always starts a clean map and clears the
autosave. Resuming becomes an explicit "Continue" button on the selection screen, shown only when
a save exists, with the family and month it left off at.

## The city panel

Double-clicking a block you control opens a full-height panel on the right (384 px), noir styled,
with its own scroll and a single close affordance. Single click keeps the current inspector
behaviour untouched.

**Header** — district and coordinates, terrain name, infrastructure total and district control %.

**Crew growth** — progress bar plus a plain-language caption: "+4.5/mo · new soldier in 12 months",
or "No local recruitment — build something worth joining." when nothing is generating infra.

**Standing order** — the four policies as a 2×2 grid of selectable cards, each showing its actual
income / growth / heat / defence effect rather than only a blurb.

**Buildings** — one row per building type showing name with owned tier in brass roman ticks, a
flavour line, and a stat line reading "+$X/mo · heat N · N mo". The right side is a Build or
Upgrade button with the cost. When a build is illegal the stat line is replaced by the reason:
"Fully upgraded." · "Crew already building here." · "Unlocks in phase N." · "Not enough cash."
(the last still shows the stats so you can plan). An in-progress build pins a brass notice at the
top of the section.

**Anchor racket** — if the block has one, its tribute, heat, and the buy-out control stay here.

**District upgrades** — the four global upgrades move into this panel with their requirement
("needs 40% of a district") and cost, disabled until control and cash allow.

## Two new building types

Added on top of the existing four, keeping current cost/income tuning rather than the doc's:

- **Legal Front** — low income, negative heat, high cover. Unlocks phase 2.
- **Safehouse** — no income, max tier 2, cover and defence. Unlocks phase 2.

Both plug into the existing infra / income / heat / cover aggregation, so crew growth, prosecution
risk, and the monthly report pick them up with no special-casing.

## Art

Generate painterly tier variants so an upgrade is visible on the board: T2 and T3 for the four
existing buildings, plus T1/T2/T3 for Legal Front and T1/T2 for Safehouse. Same silhouette and
camera per building across tiers — T2 adds a lit extension or second storey, T3 adds a sign, a
parked car, and stronger lamplight. The map picks the sprite for the highest-tier building on the
block.

## Build order

1. Selection screen: New Game wipes the autosave and starts fresh; add an explicit Continue entry.
2. Add `legal_front` and `safehouse` to the building defs, with tier tables, phase gates, and
   max-tier handling.
3. Build the city panel component with all five sections; wire double-click on owned tiles.
4. Move district upgrades out of the right sidebar into the panel.
5. Generate the tier sprites, register them, and make the board render by tier.
6. Extend tests: build gating reasons, phase-locked types, safehouse tier cap, crew-growth caption
   maths; full suite green.

## Technical notes

- `BUILDING_DEFS` gains two entries plus an optional `maxTier` and `phase` field; every consumer
  already iterates `BUILDING_TYPES`, so income/infra/heat/cover aggregation follows automatically.
- No save schema bump needed — new building types are additive keys on the existing
  `tile.buildings` record.
- `TileDevelopmentPanel` is superseded by the city panel; the floating hex info card stays as the
  single-click inspector.
- Sprites ship as CDN asset pointers, keyed `biz-<type>-t<N>`, with a fallback to T1 art.

## Scope guards

Victory conditions, turn structure, the 3-action budget, anchors, combat, diplomacy, heat and RICO
all stay exactly as they are. No rebalance of existing building costs or income.
