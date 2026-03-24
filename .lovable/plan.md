

# Fix Escort Notification Wording

## Problem
The escort notifications say "Soldier Called to Escort" and "A soldier has been called to [Capo]'s location for escort duty" — it should be phrased from the Capo's perspective with more mafia flavor.

## Changes — `src/hooks/useEnhancedMafiaGameState.ts`

Two notification instances (lines 936-937 and 1027-1028):

**Before:**
```
title: '🚗 Soldier Called to Escort'
message: `A soldier has been called to ${name}'s location for escort duty.`
```

**After:**
```
title: '🚗 Escort Summoned'
message: `${capoName} sent word — a soldier's been called to the meeting point.`
```

Where `capoName` is the capo's name (e.g. `unit.name || 'The Capo'`).

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — update 2 notification messages (lines 936-937, 1027-1028)

