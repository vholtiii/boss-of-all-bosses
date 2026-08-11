# Noir Retheme + Tile Management

Bring the uploaded style spec into the live game: painterly sprites and a brass/lamplight visual
system on top of the existing board, plus four tile-management mechanics and the spec's income
model. Family colours stay as the current desaturated 1920s inks — the sprites carry the colour.

## What changes for the player

**Look**
- Units are painted figures (soldier, capo, boss) standing on the hex with a drop shadow and a
  family-coloured base disc, instead of the current vector icons.
- Businesses show a painted building sprite on their tile; family crests appear in the family
  picker and the top bar.
- Panels get the "panel-noir" treatment: dark gradient, brass hairline, inner brass highlight.
  Headings and family names in Cinzel, body and numbers in Barlow, micro-labels in Barlow Condensed.
- Tiles read as painted rather than flat: a radial shade overlay per hex, owner tint, and
  Civ-style thick territory borders drawn only on the edges between different owners.

**Mechanics** (all four selected)
- **Building tiers I–III** — every business type upgrades through three tiers with its own cost,
  build time, income, heat, infra and cover values.
- **Per-tile policies** — each owned hex is set to Earn, Muscle Up, Lay Low, or Fortify Up,
  trading income against crew growth, heat, and defence.
- **Crew growth** — developed hexes accumulate recruit progress each month from their infra and
  spawn a free soldier at 100, shown as a small bar under the tile.
- **District upgrades** — four global purchases (Supply Routes, Local Muscle, Community Goodwill,
  Political Connections) gated by your best district control percentage.

**Economy**
- Income is recomputed with the spec's garrison share (a capo or boss on the tile earns full
  income, two soldiers 60%, one soldier 35%, unguarded 12%), turf tax on controlled districts,
  and overhead on unguarded blocks. The monthly report is a line-item list with zero rows hidden.
- Turns are relabelled **months** everywhere in the UI.

## Build order

**Phase 1 — Visual system**
1. Upload the 12 sprites as CDN assets and add Cinzel / Barlow / Barlow Condensed to the document
   head.
2. Add the spec's brass, lamplight, asphalt, oxblood and terrain tokens to the design system,
   keeping the existing family ink values. Add `panel-noir` and `label-caps` utilities plus the
   `pulse-ring` / `tile-flash` keyframes.
3. Swap unit and business rendering on the hex grid to sprite images with shadow ellipse, family
   base disc, and wounded pip. Add the per-tile shade overlay and the owner-edge territory border
   layer. Move district labels to their own non-interactive layer in Cinzel.
4. Apply `panel-noir` + `label-caps` across the HUD, sidebars, dock, and modals; crests in the
   family picker and top bar.

**Phase 2 — Tile data and policies**
5. Extend the hex model with `buildings` (type → tier), `build` order, `policy`, and
   `recruitProgress`; bump the save schema version with a migration that defaults existing hexes to
   Earn / no buildings / zero progress so current saves keep loading.
6. Build the tile panel: policy selector with its four trade-off blurbs, and a build list showing
   each building's next tier, cost, months, and effect, with the gate order not-your-block →
   fully-upgraded → already-building → phase-locked → not-enough-cash.

**Phase 3 — Ticks and economy**
7. Add the development tick to end-of-turn: decrement build orders, complete them, then add each
   tile's growth rate to recruit progress and spawn a soldier at 100.
8. Replace the income computation with the garrison-share model, turf tax, and overhead, and
   rewrite the monthly report as the line-item list.
9. Give the AI parity: rivals build, upgrade, and set policies on their own tiles inside their
   existing posture budget so they stay competitive.

**Phase 4 — District upgrades and copy**
10. Add the four global upgrades to the city panel, priced and gated on best district control, and
    wire their effects into income, growth, heat decay, and influence.
11. Relabel turns as months across HUD, reports, tooltips, and guide text.

## Technical notes

- Sprites go through `lovable-assets` as `.asset.json` pointers under `src/assets/`; nothing binary
  lands in the repo. Board render sizes follow the spec: units 52×64 at `(-26,-46)`, businesses
  48×48 at `(-24,-30)`.
- Tokens stay HSL in `index.css` (the project is Tailwind v3, not v4 `@theme`), converted from the
  spec's oklch values; existing family ink variables are untouched.
- The hex renderer keeps its current geometry, camera, supply-line layer, and overlays — this adds
  layers rather than replacing `EnhancedMafiaHexGrid`.
- New tile fields are additive on the hex record so `saveMigrations` only needs one forward step to
  schema version 3.
- Building tiers, policy multipliers, growth formula, district upgrades, and income constants live
  in `src/types/game-mechanics.ts` as tables next to the existing configs.
- Existing systems that read business income (supply lines, district bonuses, extortion) are
  updated to read the new tier aggregates so the two models don't run in parallel.
- The simulation and strategy test suites are extended to cover growth, policies, and the new
  income model, and the full suite must pass before the work is done.

## Scope guards

- Existing mechanics stay: hits, sitdowns, heat and RICO, supply lines, influence erosion, the
  Commission Vote victory. Nothing is removed to make room for the tile layer.
- The spec's turn structure section describes separate Deploy / Tactical / Action steps; the game
  now runs a single open turn with a shared action pool, and that stays.
- Extortion continues to work as it does today; building tiers apply to businesses you build.
