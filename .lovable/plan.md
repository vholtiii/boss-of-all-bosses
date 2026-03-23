

# Plan Hit — Target Tracking with Refined Penalties

## Summary

Extends the approved Plan Hit tracking mechanic with two additional relocated-target penalties: heat increase and a cooldown timer preventing consecutive planned hits.

## Mechanic Table

| Scenario | Bonus | Penalties |
|---|---|---|
| Target on original hex | +20% | None |
| Target moved to new hex | +10% | +5 heat, 2-turn Plan Hit cooldown |
| Target gone (dead/removed) | None | -5 respect/fear, -10 planner loyalty (unchanged) |

## New Constants — `src/types/game-mechanics.ts`

- `PLAN_HIT_RELOCATED_BONUS = 10`
- `PLAN_HIT_RELOCATED_HEAT = 5`
- `PLAN_HIT_COOLDOWN = 2` (turns before next Plan Hit allowed)

## State Addition

Add `planHitCooldownUntil: number` (turn number) to game state alongside existing `plannedHit`.

## Logic — `src/hooks/useEnhancedMafiaGameState.ts`

1. **`plan_hit` handler** — block if `currentTurn < planHitCooldownUntil`
2. **`execute_planned_hit`** — on relocated target: apply +10% bonus, add +5 heat, set `planHitCooldownUntil = currentTurn + 2`
3. **Target gone** — existing penalties only (no cooldown since there was no execution)

## UI — `src/components/GameSidePanels.tsx`

- "Plan Hit" button disabled with "Cooldown: X turns" tooltip when cooldown is active
- Execute button shows "⚠️ Target relocated — reduced bonus, +5 heat" when target moved

## Files Modified
- `src/types/game-mechanics.ts`
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/components/GameSidePanels.tsx`
- `src/pages/UltimateMafiaGame.tsx`
- `src/components/EnhancedMafiaHexGrid.tsx`

