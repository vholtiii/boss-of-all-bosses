
# Plan Hit — Target Tracking with Penalties

## Mechanic: Scout → Plan → Strike (Target-Tracking)

1. **Scout** an enemy hex (Tactical phase, 1 tactical action)
2. **Plan Hit** — select your soldier (planner), then pick a specific enemy unit on the scouted hex (Tactical phase, 1 tactical action) — marks hex with 🎯 crosshair
3. **Execute Plan** during Action phase — system finds target's current location automatically

## Target Tracking Table

| Scenario | Bonus | Penalties |
|---|---|---|
| Target on original hex | +20% | None |
| Target moved to new hex | +10% (reduced) | +5 heat, 2-turn Plan Hit cooldown |
| Target gone (dead/removed) | None | -5 respect/fear, -10 planner loyalty |

## Rules
- Phase: Tactical (costs 1 tactical action to plan)
- Requirement: Target hex must be scouted (fresh or stale)
- Selection: 2-step — select your soldier first, then the enemy unit
- Expiration: 2 turns — if not executed, plan expires silently (no penalty)
- Limit: 1 planned hit at a time (new plan replaces old)
- Cooldown: After a relocated execution, Plan Hit is locked for 2 turns
- Visual: 🎯 crosshair on planned hex (faded if target moved), bright orange 🎯 on target's current hex

## Execute Plan (Action Phase)
- "Execute Plan" button appears in side panel during Action phase
- Shows target status: on original hex, relocated, or eliminated
- Clicking executes the hit on the target's **current** hex (auto-redirect)
- Costs 1 action

## Constants
- `PLAN_HIT_BONUS = 20` — full bonus when target is on original hex
- `PLAN_HIT_RELOCATED_BONUS = 10` — reduced bonus when target moved
- `PLAN_HIT_RELOCATED_HEAT = 5` — heat penalty for chasing relocated target
- `PLAN_HIT_COOLDOWN = 2` — turns before next Plan Hit after relocated execution
- `PLAN_HIT_FAIL_REPUTATION = 5` — respect/fear loss when target gone
- `PLAN_HIT_FAIL_LOYALTY = 10` — planner loyalty loss when target gone

## Files Modified
- `src/types/game-mechanics.ts` — constants
- `src/hooks/useEnhancedMafiaGameState.ts` — execute_planned_hit action, target tracking in processTerritoryHit, cooldown state
- `src/components/GameSidePanels.tsx` — cooldown display, Execute Plan button, relocated status
- `src/components/EnhancedMafiaHexGrid.tsx` — dual crosshair (faded original + bright relocated)
