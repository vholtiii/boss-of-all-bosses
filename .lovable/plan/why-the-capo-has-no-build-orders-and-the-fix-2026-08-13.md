# Why the Capo has no build orders — and the fix

## What's happening

Build orders live in the "The Block" panel (bottom-left), which only renders when a hex is *pinned*
and that hex is already controlled by your family. Two things get in the way:

1. **A normal click on a hex un-pins it.** The hex click handler clears the pinned hex and instead
   opens the combat-style action menu (Hit / Extort / Claim / Sabotage / Safehouse). That menu has no
   Build or Develop entry, so with a Capo selected you see fighting options and nothing about building.
2. **Blocks with a standing racket aren't yours yet.** A Capo moving onto a block that still has an
   anchor racket does not auto-claim it, so the block stays rival/neutral and the development panel
   refuses to render — even though the Capo is standing right there.

The only way to reach build orders today is clicking the Capo's icon itself (which pins the hex), or
double-clicking an owned block to open the city view — neither is discoverable.

## The fix

**1. Keep the block pinned when you click it**
Clicking any block you control keeps it pinned so "The Block" panel opens with Standing Order / Build
tabs, instead of silently closing.

**2. Add a Develop entry to the hex action menu**
When the selected unit is on (or adjacent to) a block, add a "Develop the Block" option to the action
menu. It opens the development panel for owned blocks, and on rival/neutral anchor blocks it shows the
correct next step (Extort → Buy Out → Build) with a short reason when locked.

**3. Say why building is unavailable**
When a Capo stands on a block that can't be developed yet, the panel shows the blocker instead of
nothing: "Racket still owned — buy it out first", "Block not claimed", or the rank requirement for a
tier the current crew can't build.

## Technical notes

- `src/components/EnhancedMafiaHexGrid.tsx`
  - `handleHexClick`: stop clearing `pinnedHex` for player-controlled tiles; re-pin the clicked tile.
  - Action-menu builder (~line 700-750): add a `canDevelop` flag (owned tile, not HQ) plus a
    `develop` reason string for the anchor/claim/rank blockers; render the entry in the menu at
    ~line 2105 and wire it to `setPinnedHex(tile)` (and `setCityHex` for the full manage view).
- `src/components/TileDevelopmentPanel.tsx`
  - Replace the early `return null` for non-owned tiles with a compact "why you can't build here" card
    when a player unit is present on that tile, using `BUILD_RANK_REQUIREMENT` / anchor state.

No gameplay rules, costs, or build rates change — this is discoverability and gating feedback only.
