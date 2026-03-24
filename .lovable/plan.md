

# Add Toughness Progress from Extortion

## Change
Successful extortion grants +0.3 `toughnessProgress` to the acting soldier (roughly 3-4 extortions = +1 toughness). Same overflow mechanic as claiming territory.

## Files Modified

### `src/types/game-mechanics.ts`
- Add constant `EXTORTION_TOUGHNESS_GAIN = 0.3`

### `src/hooks/useEnhancedMafiaGameState.ts`
- In the extortion success block (where `racketeering` and `victories` are incremented): add `toughnessProgress += 0.3`, with the same overflow → toughness increment logic used for claims (cap at 5)

