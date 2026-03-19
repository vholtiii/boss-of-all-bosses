
# ✅ Completed: Fix Broken Mechanics

## Changes Made

### 1. Soldiers can now move onto enemy hexes (Deploy phase)
- Removed the filter in `selectUnit` and `moveUnit` that blocked soldiers from entering enemy-controlled territory.

### 2. Units at HQ visible during Deploy phase
- Removed the `isDeployAtHQ` empty-render block — units at HQ now render normally and are clickable for movement.

### 3. Unit-first action selection (Action phase)
- **New flow**: Click a unit → valid action targets highlight (green hexes) → click a target → context menu appears with available actions.
- `selectUnit` now works during `action` phase, computing adjacent target hexes based on unit type.
- Units are clickable during action phase in the hex grid.
- Bottom bar shows "select a unit first" guidance.

### 4. Tactical action description panel
- During Tactical phase, a description panel appears below the action toolbar showing the selected action's full description.

### 5. Extortion works on enemy hexes
- Extortion now targets both neutral (90% success, claims territory) and enemy hexes with businesses (50% success, steals income without claiming).
- Player units can be on OR adjacent to the target hex.

## Key Behavior Summary

```text
DEPLOY: Move all units anywhere (including enemy territory). Capos auto-claim/extort on arrival. Soldiers just move.
TACTICAL: Scout, Fortify, Safehouse, Escort (3/turn budget). Description panel visible.
ACTION: Select unit first → click highlighted target → Hit, Extort, Claim, Sabotage, Negotiate (2/turn, 3 with bonus).
```
