

# Allow Soldier Entry to Enemy-Occupied Hexes With Forced Action

## Current Behavior
Soldiers are **blocked** from moving onto hexes with enemy soldiers. They can move onto unoccupied rival hexes, which triggers the action dialog in Phase 2+.

## Desired Behavior
Soldiers **can** move onto enemy-occupied hexes. In Phase 2+, the action dialog always appears (hit, sabotage, or plan hit). If there are no defending soldiers and the hex is unscouted, the existing civilian casualty risk applies when choosing "Hit Territory." Phase 1 remains unrestricted (contested auto-capture).

## Changes

### File: `src/hooks/useEnhancedMafiaGameState.ts`

**1. Remove `hasEnemySoldierOnHex` from soldier movement validation (~lines 1563, 1574, 1586)**
- Remove the stacking filter from all three soldier movement paths (connected territory, adjacent venturing, and non-connected movement)
- Soldiers can now move onto hexes occupied by rival soldiers, which will trigger the Phase 2+ action dialog or Phase 1 contested mechanic

**2. Keep Capo stacking rule unchanged (~line 1539)**
- Capos still require safe passage to enter enemy-occupied hexes — no change here

**3. Add "Plan Hit" option to the action dialog resolution (~line 1975)**
- Extend `resolveEnemyHexAction` to accept `'plan_hit'` as an action type
- Uses existing plan-hit logic: +35% bonus, bypasses fortification, zero attacker casualties on success, guaranteed target kill

### File: `src/components/EnemyHexActionDialog.tsx`

**4. Add "Plan Hit" button to dialog**
- Show "Plan Hit" option when the hex has been scouted and game phase is 2+
- Display existing civilian casualty warning when hex is unscouted and undefended: "No enemy soldiers detected — risk of civilian casualty if unscouted"

**5. Show defender info dynamically**
- When defenders are present: "X enemy soldiers defending"
- When no defenders and unscouted: warning about civilian risk
- When no defenders and scouted: "No defenders — safe to seize"

### File: `src/pages/UltimateMafiaGame.tsx`

**6. Pass scouted status to dialog**
- Add `isScouted` flag to the target info passed to `EnemyHexActionDialog`

## Technical Notes
- The civilian casualty mechanic already exists in `processTerritoryHit` (lines 7043-7072) — it triggers automatically when hitting an unscouted hex with no defenders
- No new state fields needed; this builds on the existing `pendingEnemyHexAction` system

