

# Plan Hit — Unit-Targeted Refinement

## Mechanic Change

Plan Hit now requires selecting a **soldier first**, then a **specific enemy unit on a scouted hex**. At execution time, both the hex AND the unit must still match. If the target unit moved, the plan fails with consequences.

## Flow

1. Click "Plan Hit" in side panel (Tactical phase)
2. Select one of your soldiers (the "planner")
3. Click a scouted enemy hex — UI shows enemy units on it
4. Select a specific enemy unit on that hex
5. Plan is set: tracks `plannerUnitId`, `targetUnitId`, target hex coords

## Execution Check (Action Phase)

When executing `hit_territory` on the planned hex:
- **Success**: Target unit is still on the planned hex → +20% bonus applied, plan consumed
- **Failure**: Target unit moved away → plan auto-fails with consequences:
  - **-5 respect OR -5 fear** (whichever is higher gets hit)
  - **-10 loyalty** on the planner soldier (botched operation morale hit)
  - Notification: "The target slipped away — your plan was exposed"
  - Plan is consumed (no retry)

If the player simply doesn't execute within 2 turns, plan expires silently (no penalty — they just lost the tactical action).

## Data Changes

**`src/types/game-mechanics.ts`** — Extend `PlannedHit`:
```
interface PlannedHit {
  q, r, s: number;
  targetFamily: string;
  targetUnitId: string;    // NEW — specific enemy unit
  plannerUnitId: string;   // NEW — your soldier who planned
  plannedOnTurn: number;
  expiresOnTurn: number;
}
```
Add constants: `PLAN_HIT_FAIL_REPUTATION = 5`, `PLAN_HIT_FAIL_LOYALTY = 10`

## Logic Changes

**`src/hooks/useEnhancedMafiaGameState.ts`**:

1. **`plan_hit` handler** — require `action.plannerUnitId` (player soldier) and `action.targetUnitId` (enemy unit on scouted hex). Validate both exist.

2. **`processTerritoryHit`** — when checking `plannedHit` match, also verify `targetUnitId` is still on that hex:
   - Found → apply +20% bonus (current behavior)
   - Not found → apply failure penalties (respect/fear -5, planner loyalty -10), notify, consume plan

3. **Turn-end expiration** — unchanged (silent expiry, no penalty)

## UI Changes

**`src/pages/UltimateMafiaGame.tsx`**:
- Plan Hit mode becomes a 2-step selection: first select your soldier, then select target hex+unit
- Track `planHitStep: 'selectSoldier' | 'selectTarget'`

**`src/components/EnhancedMafiaHexGrid.tsx`**:
- In planHit target mode, show enemy units on scouted hexes as clickable targets
- Crosshair overlay now shows target unit info (not just hex)

**`src/components/GameSidePanels.tsx`**:
- Planned hit status shows: planner name, target unit, hex, expiry turn

## Files Modified
- `src/types/game-mechanics.ts`
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/pages/UltimateMafiaGame.tsx`
- `src/components/EnhancedMafiaHexGrid.tsx`
- `src/components/GameSidePanels.tsx`

