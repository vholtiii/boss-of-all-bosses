

# Claiming Territory Increases Toughness

## Change from Previous Plan
- Toughness gain per claim: **0.25** instead of 0.2 (every **4 claims** = +1 toughness)

## Mechanics
- Each territory claim gives the claiming soldier +0.25 `toughnessProgress`
- When progress ≥ 1.0 → toughness +1 (cap 5), reset overflow
- 4 claims = +1 toughness, 20 claims = max toughness from claiming alone

## Changes

### `src/types/game-mechanics.ts`
- Add `toughnessProgress: number` to `SoldierStats`
- Add constant `CLAIM_TOUGHNESS_GAIN = 0.25`

### `src/hooks/useEnhancedMafiaGameState.ts`
- Initialize `toughnessProgress: 0` in all soldier stat creation blocks
- In claim territory logic: add 0.25 to claiming soldier's `toughnessProgress`, increment `toughness` when progress ≥ 1.0 (capped at 5)

## Files Modified
- `src/types/game-mechanics.ts`
- `src/hooks/useEnhancedMafiaGameState.ts`

