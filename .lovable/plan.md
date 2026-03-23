

# Plan Hit — Refined Mechanic

## How It Works

**3-step chain: Scout → Plan → Strike**

1. **Scout** an enemy hex (Tactical phase, 1 tactical action)
2. **Plan Hit** on that scouted hex (Tactical phase, 1 tactical action) — marks it with a crosshair
3. **Execute Hit** on the planned hex next turn's Action phase — +20% success bonus

## Rules

| Property | Value |
|---|---|
| Phase | Tactical (costs 1 tactical action) |
| Requirement | Target hex must be scouted (fresh or stale) |
| Bonus | +20% hit success chance when executing |
| Timing | Bonus applies starting next turn's Action phase |
| Expiration | 2 turns — if not executed, plan is cleared |
| Limit | 1 planned hit at a time (new plan replaces old) |
| Visual | Crosshair overlay on planned hex |

## Technical Details

### State — `src/types/game-mechanics.ts`
- Add `PLAN_HIT_BONUS = 20` and `PLAN_HIT_DURATION = 2` constants
- Add `PlannedHit` interface: `{ q, r, s, targetFamily, plannedOnTurn, expiresOnTurn }`

### Logic — `src/hooks/useEnhancedMafiaGameState.ts`
- Add `plannedHit: PlannedHit | null` to game state
- New `plan_hit` action handler:
  - Validates hex is scouted (check `scoutedHexes`)
  - Validates hex is enemy-controlled
  - Validates `tacticalActionsRemaining > 0`
  - Sets `plannedHit` with `expiresOnTurn = currentTurn + 2`
  - Deducts 1 tactical action
- In `processTerritoryHit`: if target matches `plannedHit` coords, add +20% to chance, then clear `plannedHit`
- In turn-end processing: if `plannedHit.expiresOnTurn <= currentTurn`, clear it and notify player

### UI — Side Panel (`src/components/GameSidePanels.tsx`)
- Move "Plan Hit" to Tactical section (phase-locked to TACTICAL)
- Disabled reason: "Scout a hex first" when no scouted enemy hexes exist, or "No tactical actions" when budget is 0

### UI — Hex Grid (`src/components/EnhancedMafiaHexGrid.tsx`)
- Render crosshair overlay on planned hex
- In hit context menu, show "+20% PLANNED" label when target matches `plannedHit`
- Plan Hit mode: clicking a scouted enemy hex sets the plan

### UI — Game Page (`src/pages/UltimateMafiaGame.tsx`)
- Add `'planHit'` interaction mode triggered from side panel button
- Handle hex selection in planHit mode

## Files Modified
- `src/types/game-mechanics.ts`
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/components/GameSidePanels.tsx`
- `src/components/EnhancedMafiaHexGrid.tsx`
- `src/pages/UltimateMafiaGame.tsx`

