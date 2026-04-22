

# Fix Rival Unit Visibility Bug

Rival units are currently always rendered. The existing reveal rules (scout intel, adjacency, capo vision, safehouse, corruption tier, pacts, units-on-your-turf, HQ) are correct in design — they just aren't being applied to unit rendering. This is a pure bug fix: add the visibility filter to the render path. No rule changes.

## Fix

1. **`src/components/EnhancedMafiaHexGrid.tsx`**
   - Before rendering each rival unit (soldier or capo), check visibility against the existing game state.
   - A rival unit renders only if at least one is true:
     - Hex is within 1 of any player soldier, or within 2 of any player capo (matches existing scout ranges).
     - Hex is in the player's `scoutedHexes` set with fresh intel (reuse existing freshness check).
     - Hex is within 1 of a player safehouse.
     - Player corruption tier is Police Chief (T3) or Mayor (T4) — reveals all.
     - Rival's family currently has an active Supply Deal or Alliance pact with the player.
     - Hex is owned/contested by the player.
     - Hex is a rival HQ.
   - If none match, skip the unit (do not render its `<SoldierIcon>` / capo icon). The hex itself still renders normally.

2. **Helper placement** — add a small `isRivalUnitVisible(unit, hex)` function inside the grid component (or extracted to a local util) that reads from props/state already passed in (`units`, `hexes`, `scoutedHexes`, `safehouses`, `corruptionTier`, `activePacts`, `playerFamily`). No changes to `useEnhancedMafiaGameState.ts` required if all those are already exposed; otherwise expose them.

## Verification

- Start a new game, do not scout: rival units that aren't adjacent to your units / on your turf / at a rival HQ should not appear.
- Scout a rival hex → its units appear until intel goes stale.
- Move a soldier next to a rival hex → that rival's units appear.
- Buy Police Chief corruption → all rival units appear.

## What Doesn't Change

- Reveal rules themselves, AI behavior, combat, scout/corruption/pact mechanics, hex/territory rendering, fog-of-war for Planned Hits.

