

# Fix: Extortion Failure Casualties Are Fake

## The Bug

When extortion fails, casualties are drawn from `playerUnitsOnHex` (units on the **target** hex). But extortion is typically initiated from an **adjacent** hex, meaning `playerUnitsOnHex` is often empty. The code calculates `casualties = max(1, 0 * 0.2) = 1` and reports "1 casualty" in the notification, but the removal loop runs 0 iterations because there are no units to remove. **The message lies — no unit actually dies.**

## The Fix

### File: `src/hooks/useEnhancedMafiaGameState.ts`

Change the casualty logic (lines 2602-2606) to draw from `allPlayerUnits` (which includes both on-hex AND adjacent units) instead of only `playerUnitsOnHex`. Also shuffle before removing so it's random (same pattern as the Hit fix):

```
// Before (broken):
const casualties = Math.max(1, Math.floor(playerUnitsOnHex.length * 0.2));
for (let i = 0; i < casualties && i < playerUnitsOnHex.length; i++) {
  const idx = state.deployedUnits.indexOf(playerUnitsOnHex[i]);

// After (fixed):
const shuffled = [...allPlayerUnits].sort(() => Math.random() - 0.5);
const casualties = Math.max(1, Math.floor(shuffled.length * 0.2));
for (let i = 0; i < casualties && i < shuffled.length; i++) {
  const idx = state.deployedUnits.indexOf(shuffled[i]);
```

This ensures the soldier who initiated the extortion (from an adjacent hex) can actually be killed on failure, and the notification matches reality.

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — fix casualty pool to use all participating units

