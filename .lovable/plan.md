

# Capo Scouting at 2-Hex Range

## Summary
Allow capos to scout in addition to soldiers, but with a 2-hex range (instead of soldiers' 1-hex adjacent range).

## Changes — `src/hooks/useEnhancedMafiaGameState.ts`

### 1. Unit selection (line 873)
Change `unitType === 'soldier'` to `unitType === 'soldier' || unitType === 'capo'`. For capos, use `getHexesInRange(unit.q, unit.r, unit.s, 2)` instead of `getHexNeighbors` to compute scoutable hexes.

### 2. Scout execution (line 981)
Change `unit.type === 'soldier'` to `unit.type === 'soldier' || unit.type === 'capo'` so capos can execute the scout action.

### 3. UI hint update — `src/pages/UltimateMafiaGame.tsx`
Update the scout tooltip (line 577) and description (line 619) from "Select a soldier" to "Select a soldier or capo" and note capos scout 2 hexes away.

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — allow capo scouting with 2-hex range
- `src/pages/UltimateMafiaGame.tsx` — update scout UI text

