

# Refine Scout Mechanic

## Current State
- Scout only works on **enemy** hexes (line 704 filters out `neutral`)
- Scout reveals: enemy unit count, enemy family, business type, business income
- Scouted info is stored but **never used** by Hit logic — no intelligence bonus
- Duration: 3 turns

## Changes

### 1. Allow scouting neutral hexes
**File**: `src/hooks/useEnhancedMafiaGameState.ts` (line 704)
Change the filter from `!== 'neutral' && !== playerFamily` to just `!== playerFamily`. This lets soldiers scout neutral hexes to reveal business profits before committing to a Claim or Extort.

Update the notification message to handle neutral hex output (no enemy units, just business info).

### 2. Add intelligence bonus to Hit actions (+15% success)
**File**: `src/hooks/useEnhancedMafiaGameState.ts` (~line 2055, inside `processTerritoryHit`)
After the family combat bonus line, add a check: if the target hex exists in `state.scoutedHexes`, apply a `+0.15` (15%) bonus to the hit chance. This makes scouting a meaningful tactical investment before attacking.

### 3. Update scout notification for neutral hexes
**File**: `src/hooks/useEnhancedMafiaGameState.ts` (~line 920, inside `processScout`)
Adjust the notification message: for neutral hexes, show business info only (no "enemy units" count). For enemy hexes, keep current format.

### Constants
Add `SCOUT_INTEL_BONUS = 15` to `src/types/game-mechanics.ts` alongside existing constants.

## Files Modified
- `src/types/game-mechanics.ts` — add `SCOUT_INTEL_BONUS` constant
- `src/hooks/useEnhancedMafiaGameState.ts` — 3 small edits (filter, hit bonus, notification)

