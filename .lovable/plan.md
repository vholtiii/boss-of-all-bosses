

# Fix: Loyalty Bar Showing Hardcoded 75 Instead of Average Soldier Loyalty

## Problem
The "Loyalty" status bar in the left panel (`GameSidePanels.tsx`, line 103) displays `reputation.loyalty`, which is a family-level value hardcoded to 75 at game start. It does not reflect actual individual soldier loyalty values.

Per the game's own design (documented in the loyalty system memory), the global Loyalty Bar should show the **mean average** of all deployed units' individual loyalty.

## Fix

### 1. `src/components/GameSidePanels.tsx` (~line 103)
- Instead of `reputation.loyalty`, compute the average loyalty from `soldierStats` across all deployed soldier IDs
- Fallback to `reputation.loyalty` if no soldiers are deployed
- This requires `soldierStats` and deployed unit IDs to be available in scope (they're already passed to this component or accessible from `gameState`)

### 2. Verify `soldierStats` is available in GameSidePanels
- Check if it's already a prop or needs to be passed down
- If not available, pass it from the parent component

### 3. Update `reputation.loyalty` sync (optional but recommended)
- In `useEnhancedMafiaGameState.ts`, update `reputation.loyalty` each turn to match the computed average so the value stays consistent everywhere it's referenced

## Result
The Loyalty bar will show the true average loyalty of your soldiers (e.g., 50 if all soldiers are at 50) instead of the static 75.

