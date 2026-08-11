# Build the Block: Development-First Economy

Replace "grab as many hexes as you can" with "own fewer blocks, develop them deeper." The map
starts mostly bare; a small number of hand-placed lucrative rackets sit in strategic zones and are
the only real early money — you fight over those while you build your own earners everywhere else.

## What changes for the player

**A mostly empty city**
- Random per-hex businesses at map generation go away. Ordinary blocks start bare: no income, no
  extort payout, just ground you can build on.
- Grabbing empty blocks is now a cost, not a win: unguarded, undeveloped blocks keep paying
  overhead, so wide-and-thin expansion bleeds you.

**Anchor rackets — the contested prizes**
- 8–12 pre-built **anchors** are placed at deliberate strategic spots (waterfront docks, downtown
  card rooms, garment-district loan offices, market storefronts), scaled with map size, always in
  neutral/contested ground rather than anyone's home turf.
- Each anchor is a named, high-value racket showing its type, tribute, heat, and district.
- **Extort** an anchor (physical presence, as today) and it pays **monthly tribute** to you while
  you hold and garrison it — no upfront jackpot, a recurring stream you have to defend.
- Extorted anchors cannot be upgraded and don't grow crew. To develop one you pay a **buy-out**
  (a lump cost scaled to its tribute), which converts it into a **Tier 1 building of its type** on
  your normal development track — from then on it upgrades T1 → T2 → T3 like anything you built.
- Lose the block, lose the tribute; a bought-out anchor becomes a normal building the taker inherits.

**Building is the main verb**
- Every owned block runs on the existing development layer: pick building types, pay cash + build
  months, set a standing order (Earn / Muscle Up / Lay Low / Fortify Up), grow crew from infra.
- Building costs and early income are rebalanced so a player can realistically get their first
  earners up in the opening months without an anchor.

**One economy, not two**
- The legacy per-hex `business` object and its claim/extort payouts, construction progress, and
  legal/illegal flag are fully replaced. Anchors and buildings are the only earners.
- Everything that read business income — supply lines, district bonuses, heat, influence, loyalty,
  AI valuation, the monthly report, RICO shutdowns, seizure penalties — is repointed at the new
  aggregates so nothing runs on the old model.

**Victory unchanged.** Territory targets and the Commission Vote stay exactly as they are.

## Build order

**Phase 1 — Data model**
1. Add `anchor` to the hex record: type, name, tribute, heat, buyout cost, `extortedBy`, and
   `boughtOut`. Remove `tile.business` and its construction fields.
2. Add anchor definitions and placement tables to `game-mechanics.ts` next to `BUILDING_DEFS`:
   per-map-size anchor counts, district affinities, tribute/heat/buyout values.
3. Save schema v4 migration: convert any existing `tile.business` into either an anchor (if
   extorted or high income) or a Tier 1 building of the matching type (if player-built), then drop
   the field so old saves keep loading.

**Phase 2 — Map generation**
4. Delete the density-roll business generator. Place anchors deterministically from the seed using
   the affinity table, with minimum spacing between anchors and a guaranteed exclusion radius around
   every family HQ so nobody starts on top of one.
5. Give each anchor a period-appropriate generated name.

**Phase 3 — Actions and economy**
6. Rewrite extort: on an anchor it sets `extortedBy` and starts tribute; on a bare block it is
   removed as a money action (claiming a bare block just takes ground).
7. Add the **buy-out** action on an extorted anchor: cash + 1 action, converts to Tier 1 building.
8. Recompute monthly income as: building income × garrison share × policy, plus anchor tribute
   (garrison-gated), plus turf tax, minus overhead. Rewrite the monthly report lines to match.
9. Repoint heat, influence, respect, loyalty, supply lines, district bonuses, and RICO/seizure
   effects at anchors + building aggregates.

**Phase 4 — AI and UI**
10. AI parity: rivals value and race for anchors, buy them out when flush, and build/upgrade their
    own blocks inside their existing posture budget.
11. UI: anchors rendered distinctly on the map (sprite + tribute badge + owner ring), an Anchors
    list in the sidebar showing every anchor and who holds it, buy-out control in the block panel,
    and map-key entries. Update guide/tooltip copy so extort reads as tribute.
12. Extend the simulation and strategy test suites for anchor tribute, buy-out conversion, the new
    income model, and empty-block drag; full suite must pass.

## Technical notes

- `HexTile.business` is removed outright rather than deprecated, so the compiler surfaces every
  read site — that list is the Phase 3 checklist.
- Anchor placement runs off the existing mulberry32 seed so maps stay reproducible.
- Tribute is stored as a value on the anchor, not recomputed per turn, so seizure/decay modifiers
  can apply cleanly.
- Buy-out sets `buildings[type] = 1` and clears the anchor's tribute, so the tile immediately joins
  the existing crew-growth and policy math with no special-casing downstream.
- Balance constants (anchor counts per map size, tribute bands, buy-out multiplier, rebalanced
  Tier 1 costs, overhead) live as tables in `game-mechanics.ts`.

## Scope guards

- Victory conditions, phases, turn structure, hits, sitdowns, diplomacy, heat/RICO, and supply-line
  mechanics stay as they are.
- The existing tier/policy/crew-growth layer is kept and becomes the core loop — this plan feeds it,
  it does not replace it.
