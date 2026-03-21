

# Individual Soldier Loyalty System

## Summary

Individual soldier loyalty now grows and decays organically based on actions, combat, positioning, stats, and financial status.

## Mechanics

### Per-Turn Loyalty Growth
- **Stats-correlated baseline**: `floor((training + toughness + racketeering + victories) / 4)` loyalty per turn
- **High-income hex bonus**: +3 loyalty/turn if stationed on hex with business income >= $4,000
- **Unpaid penalty**: -2 loyalty/turn if family can't afford maintenance

### Action Bonuses (immediate)
- **Successful action** (hit, extortion, claim): +2 loyalty
- **Survived combat** (hit win or loss with casualties): +5 loyalty

### Caps
- Soldiers: 80 (`SOLDIER_LOYALTY_CAP`)
- Capos: 99 (`CAPO_LOYALTY_CAP`)
- Minimum: 0

## Constants (`src/types/game-mechanics.ts`)
- `LOYALTY_ACTION_BONUS = 2`
- `LOYALTY_COMBAT_BONUS = 5`
- `LOYALTY_INCOME_HEX_BONUS = 3`
- `LOYALTY_INCOME_HEX_THRESHOLD = 4000`
- `LOYALTY_UNPAID_PENALTY = 2`

## Files Modified
- `src/types/game-mechanics.ts` — 5 new constants
- `src/hooks/useEnhancedMafiaGameState.ts` — per-turn loyalty processing, action/combat bonuses
- `SOLDIER_RECRUITMENT_GUIDE.md` — documented loyalty mechanics
