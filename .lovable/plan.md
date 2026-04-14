

# Loyalty System Refinement — Final Plan (Revised Decay Rates)

## Change from Previous Plan
Increased all decay/loss values to balance against the multiple gain sources.

## All Loyalty Modifiers (summed each turn)

### Gains (unchanged)
| Source | Amount | Condition |
|--------|--------|-----------|
| Stats baseline | +0 to +3 | Only if soldier acted this turn |
| Capo aura | +2/turn | Friendly capo within 2 hexes |
| HQ comfort | +1/turn | Stationed at HQ |
| High-income hex | +3/turn | Already implemented, hex business >= $4K |
| Recruit early bonus | +1/turn | Local recruits, first 5 turns only |
| Action bonus | +2 | Per successful action (existing) |
| Combat survival | +5 | Per survived combat (existing) |

### Losses (increased rates)
| Source | Old | New | Condition |
|--------|-----|-----|-----------|
| Idle decay | -1/turn | **-2/turn** | No action for 2+ consecutive turns |
| Failed action | -3 | **-5** | Hit or extortion fails |
| Enemy territory | -1/turn | **-2/turn** | On or adjacent to enemy-controlled hex |
| Neutral hex | -1/turn | **-2/turn** | Stationed on a neutral hex |
| Maintenance unpaid | -2/turn | **-3/turn** | Family can't pay upkeep |

### Caps (unchanged)
- Mercenaries: start at 35, cap at 70
- Local recruits: start at 50, cap at 80
- Capos: cap at 99

## Technical Changes

### `src/types/game-mechanics.ts`
Add constants: `LOYALTY_IDLE_DECAY = 2`, `LOYALTY_IDLE_THRESHOLD = 2`, `LOYALTY_CAPO_AURA = 2`, `LOYALTY_CAPO_AURA_RANGE = 2`, `LOYALTY_HQ_COMFORT = 1`, `LOYALTY_MERC_CAP = 70`, `LOYALTY_MERC_START = 35`, `LOYALTY_RECRUIT_EARLY_BONUS = 1`, `LOYALTY_RECRUIT_EARLY_TURNS = 5`, `LOYALTY_FAILED_ACTION_PENALTY = 5`, `LOYALTY_ENEMY_TERRITORY_PENALTY = 2`, `LOYALTY_NEUTRAL_HEX_PENALTY = 2`, `LOYALTY_MAINTENANCE_UNPAID = 3`. Add `turnsIdle`, `isMercenary`, `actedThisTurn` to `SoldierStats`.

### `src/hooks/useEnhancedMafiaGameState.ts`
- Rework per-turn loyalty into single summed delta with all modifiers
- Update existing maintenance unpaid decay from -2 to -3
- Failed action: apply -5 to acting soldier in hit/extort failure handlers
- Action tracking: set `actedThisTurn = true` on hit/extort/claim/move; reset `turnsIdle`
- Turn start: reset `actedThisTurn`, increment `turnsIdle`
- Recruitment: set `isMercenary`, starting loyalty 35 for mercs

## Files Changed
1. `src/types/game-mechanics.ts`
2. `src/hooks/useEnhancedMafiaGameState.ts`

