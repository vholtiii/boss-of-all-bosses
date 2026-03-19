

# Refine Safehouse Mechanic

## Current State
- Duration: 2 turns (`SAFEHOUSE_DURATION = 2`) — too short
- Only 1 safehouse allowed at a time (`safehouse: Safehouse | null`)
- No destruction on enemy capture — safehouse persists even if hex is lost
- No defensive bonus (none requested)

## Changes

### 1. Increase duration to 5 turns
**File**: `src/types/game-mechanics.ts` (line 237)
- Change `SAFEHOUSE_DURATION = 2` to `SAFEHOUSE_DURATION = 5`

### 2. Destroy safehouse when enemy captures the hex
**File**: `src/hooks/useEnhancedMafiaGameState.ts`
- In `processTerritoryHit` (or wherever hex control changes after combat): after a hex flips to an enemy family, check if `safehouse` exists at that hex coordinates. If so, set `safehouse = null` and add a notification: "🏠 Safehouse Destroyed — Enemy captured the hex."
- Also check during AI territory expansion / any hex control change logic.

### 3. Update notification text
**File**: `src/hooks/useEnhancedMafiaGameState.ts` (line 949)
- Update the safehouse creation message to reflect 5-turn duration.

## Files Modified
- `src/types/game-mechanics.ts` — duration constant
- `src/hooks/useEnhancedMafiaGameState.ts` — enemy destruction logic, notification text

