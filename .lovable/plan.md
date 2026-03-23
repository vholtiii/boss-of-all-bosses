
# Plan Hit — Unit-Targeted (Refined)

## Mechanic: Scout → Plan → Strike (Unit-Targeted)

1. **Scout** an enemy hex (Tactical phase, 1 tactical action)
2. **Plan Hit** — select your soldier (planner), then pick a specific enemy unit on the scouted hex (Tactical phase, 1 tactical action) — marks hex with 🎯 crosshair
3. **Execute Hit** on the planned hex during Action phase — if target unit is still on hex, +20% bonus; if target moved, plan fails with penalties

## Rules
- Phase: Tactical (costs 1 tactical action)
- Requirement: Target hex must be scouted (fresh or stale)
- Selection: 2-step — select your soldier first, then the enemy unit
- Bonus: +20% hit success chance when target is still present
- Timing: Bonus applies starting next turn's Action phase
- Expiration: 2 turns — if not executed, plan expires silently (no penalty)
- Limit: 1 planned hit at a time (new plan replaces old)
- Visual: 🎯 crosshair overlay on planned hex, planner/target names shown in side panel

## Failure Consequences (target moved away)
- **-5 respect OR fear** (whichever is higher gets reduced)
- **-10 loyalty** on the planner soldier (botched operation morale hit)
- Notification: "The target slipped away — your plan was exposed"
- Plan is consumed (no retry)

## Files Modified
- `src/types/game-mechanics.ts` — PlannedHit interface (+ targetUnitId, plannerUnitId), PLAN_HIT_FAIL_REPUTATION, PLAN_HIT_FAIL_LOYALTY constants
- `src/hooks/useEnhancedMafiaGameState.ts` — plan_hit handler validates planner + target unit, processTerritoryHit checks if target still on hex
- `src/components/GameSidePanels.tsx` — Plan Hit status shows planner name, target name, movement warning
- `src/components/EnhancedMafiaHexGrid.tsx` — 2-step mode (green highlights for soldier selection, red for target), unit picker popup, banner
- `src/pages/UltimateMafiaGame.tsx` — planHitStep, planHitPlannerId state, routing for soldier/target selection
