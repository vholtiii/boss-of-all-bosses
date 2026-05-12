# Fix phantom soldier spawns

## Goal
Stop player soldiers from appearing out of nowhere in Phase 1 when Bronx control is below the district-bonus threshold.

## What I found
The Bronx free-recruit rule only fires every 3 turns and only when the player has the active `free_recruit` district bonus. That does not match your report.

The real issue is a reserve/deployed bookkeeping bug in player soldier creation:
- Initial game setup puts `startingResources.soldiers` directly onto the map as deployed soldiers.
- That same value is also stored in `resources.soldiers`, which the deploy system treats as undeployed reserve troops.
- Player recruit actions also do both at once: they increment `resources.soldiers` and immediately add a deployed HQ soldier.
- Result: the game thinks you have extra reserve soldiers even though those soldiers are already on the board, so they can be deployed again later and feel like spontaneous spawns.

## Implementation plan
1. Make player soldier counts single-source-of-truth during setup.
   - Keep starting soldiers deployed on the board.
   - Initialize player `resources.soldiers` to `0` instead of duplicating the same count into reserves.

2. Fix player recruit actions so they do not double-create units.
   - For mercenary and local recruit actions, either add to reserve or deploy immediately, but not both.
   - Keep the current UX of spawning the new recruit at HQ, so these actions should stop incrementing `resources.soldiers` when they already create the unit on the map.

3. Audit player-only soldier return paths for the same reserve/deployed desync.
   - Verify jail return, prosecution return, lay-low return, and free-recruit only add a deployed unit once and do not also inflate reserve count incorrectly.
   - Remove any accidental reserve bumps tied to an already-deployed return path.

4. Validate behavior in-game.
   - Confirm no new soldiers appear each turn without an explicit cause.
   - Confirm Bronx bonus still only grants one free soldier every 3 turns once the 60% threshold is actually reached.
   - Confirm manual deploy still consumes reserve soldiers correctly.

## Technical details
Files to update:
- `src/hooks/useEnhancedMafiaGameState.ts`

Key code areas:
- `createInitialGameState(...)` initialization of `deployedUnits` and `resources.soldiers`
- Player deploy flow around reserve consumption
- Player recruit actions (`recruit_soldiers`, `recruit_local_soldier`)
- Automatic soldier return/spawn blocks at end of turn

## Expected result
Player soldier count will stop drifting upward from hidden duplicate reserve entries, and any new soldier on the board will come from a clear rule: recruiting, release/return, or the Bronx bonus after the proper threshold is reached.