

# Refine Fortify Mechanic

## Current State (from code audit)
- **Defense bonus**: +25% applied in `processTerritoryHit` — working correctly
- **Resets every turn**: Line 1166-1168 clears `fortified: false` on all units at turn start — **needs to change per user request**
- **Casualty reduction**: Not implemented — fortify only affects hit success chance, not casualties
- **Visual indicator**: Shield icon (🛡️) is rendered for ALL fortified units regardless of family — needs to be player-only

## Changes

### 1. Fortify persists across turns (does NOT reset)
**File**: `src/hooks/useEnhancedMafiaGameState.ts` (~line 1167)
Remove `fortified: false` from the turn-reset mapping. Fortified status will persist until the unit **moves** (already handled — line 789 sets `fortified: false` on move). This means a unit stays fortified as long as it holds position.

### 2. Fortified units reduce casualty rates
**File**: `src/hooks/useEnhancedMafiaGameState.ts` (inside `processTerritoryHit`, ~line 2046-2054)
After the existing fortify defense bonus logic, add casualty reduction: if defending units are fortified, reduce defending casualties by 50% (round down). This makes fortification a meaningful tactical choice for holding key territory.

Add constant `FORTIFY_CASUALTY_REDUCTION = 50` to `src/types/game-mechanics.ts`.

### 3. Visual indicator only for player's own fortified units
**File**: `src/components/EnhancedMafiaHexGrid.tsx` (~line 482)
Add a filter condition: only show the shield icon if the fortified unit's `family === playerFamily`. Enemy fortified units remain hidden on the map — the player must scout to discover them.

## Files Modified
- `src/types/game-mechanics.ts` — add `FORTIFY_CASUALTY_REDUCTION` constant
- `src/hooks/useEnhancedMafiaGameState.ts` — remove fortify reset, add casualty reduction
- `src/components/EnhancedMafiaHexGrid.tsx` — filter shield indicator to player units only

