

## Enhanced Move Phase System

### Overview
Expand the Move phase with new tactical options for both soldiers and Capos, plus defensive fortification and enemy zone-of-control rules.

### New Soldier Move Options

**1. Move to adjacent hexes** (existing — keep as-is)

**2. Regroup (stack units)**
- Multiple soldiers can move onto the same hex to form a stronger garrison
- No stacking limit beyond your total soldier count
- Stacked soldiers fight together in combat (numbers advantage)

**3. Scout ahead**
- A soldier adjacent to an enemy hex can spend 1 move to "scout" it
- Reveals: enemy soldier count, business type/income, and controlling family strength
- Scouted info persists for 3 turns, then fades
- Visual: eye icon on scouted hexes

### New Capo Move Options

**4. Escort soldiers**
- When a Capo moves, they can carry up to 2 soldiers from their current hex
- Soldiers ride along to the destination (uses Capo's fly range)
- Costs the Capo an extra move point per soldier carried
- Enables rapid deployment of soldiers to distant territory

**5. Set up safehouse**
- Capo spends all remaining moves to establish a safehouse on a friendly hex
- Next turn, that hex acts as a secondary deploy point (soldiers can deploy adjacent to it)
- Safehouse lasts 2 turns, only 1 active at a time
- Visual: 🏠 icon on the hex

### Defensive Option

**6. Fortify (skip move)**
- Any unit that skips its move can "fortify" its current hex
- Grants +25% defense bonus if attacked during the action phase or enemy turn
- Fortified status lasts until the unit moves or the next turn begins
- Visual: shield icon on fortified units

### Movement Rule: Enemy Zone of Control

**7. Zone of control**
- Moving into a hex adjacent to an enemy-occupied hex ends your movement immediately (moves set to 0)
- This prevents freely walking past enemy lines
- Capos flying over are NOT affected (they fly above)
- Scouts can still scout from the zone-of-control hex

### Files to Change

| File | Change |
|------|--------|
| `src/types/game-mechanics.ts` | Add `ScoutedHex`, `Safehouse` types; add `fortified` and `escorting` fields |
| `src/hooks/useEnhancedMafiaGameState.ts` | Add scout, regroup, escort, safehouse, fortify handlers; zone-of-control logic in `moveUnit`; add `scoutedHexes`, `safehouse` to state |
| `src/components/EnhancedMafiaHexGrid.tsx` | Show scout/fortify/escort buttons on selected unit during move phase; visual indicators for scouted hexes, safehouses, fortified units |
| `src/pages/UltimateMafiaGame.tsx` | Update move phase HUD to show available move actions; show safehouse deploy option |

### Implementation Order

1. Add new types to `game-mechanics.ts` (ScoutedHex, Safehouse, fortified flag)
2. Add zone-of-control logic to `moveUnit` — end movement when adjacent to enemy
3. Add `fortifyUnit` action — mark unit as fortified, set moves to 0
4. Add `scoutHex` action — reveal enemy hex info, store in scoutedHexes array
5. Add `escortSoldiers` to Capo movement — carry soldiers along on fly
6. Add `setupSafehouse` action — create secondary deploy point
7. Update grid visuals: shield icon for fortified, eye icon for scouted, house icon for safehouse
8. Update move phase UI with action buttons for selected units

