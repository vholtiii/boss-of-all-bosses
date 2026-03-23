
# Plan Hit — Implemented

## Mechanic: Scout → Plan → Strike

1. **Scout** an enemy hex (Tactical phase, 1 tactical action)
2. **Plan Hit** on that scouted hex (Tactical phase, 1 tactical action) — marks it with 🎯 crosshair
3. **Execute Hit** on the planned hex during Action phase — +20% success bonus

## Rules
- Phase: Tactical (costs 1 tactical action)
- Requirement: Target hex must be scouted (fresh or stale)
- Bonus: +20% hit success chance when executing
- Timing: Bonus applies starting next turn's Action phase
- Expiration: 2 turns — if not executed, plan is cleared
- Limit: 1 planned hit at a time (new plan replaces old)
- Visual: 🎯 crosshair overlay on planned hex, "+20% 🎯" label on hit button

## Files Modified
- `src/types/game-mechanics.ts` — PlannedHit interface, PLAN_HIT_BONUS, PLAN_HIT_DURATION constants
- `src/hooks/useEnhancedMafiaGameState.ts` — plannedHit state, plan_hit action, bonus in processTerritoryHit, expiration in endTurn
- `src/components/GameSidePanels.tsx` — Plan Hit button moved to Strategic section, phase-locked to Tactical
- `src/components/EnhancedMafiaHexGrid.tsx` — crosshair overlay, plan hit mode highlighting, +20% label on hit button
- `src/pages/UltimateMafiaGame.tsx` — planHitMode state, enter_plan_hit_mode/plan_hit routing
