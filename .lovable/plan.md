

# Fix Financial Balance — Free Undeployed Soldiers + Accurate Display Math

## Changes in `src/hooks/useEnhancedMafiaGameState.ts`

### A. Free Undeployed Soldiers (3 removals)
1. **Line ~1897** (loyalty check): Remove `+ newState.resources.soldiers * SOLDIER_MAINTENANCE`
2. **Line ~2064** (loyalty delta): Remove `+ newState.resources.soldiers * SOLDIER_MAINTENANCE`
3. **Line ~2600** (processEconomy): Remove `maintenance += state.resources.soldiers * SOLDIER_MAINTENANCE`

### B. Fix Double-Counted Penalties in processEconomy (~line 2635-2660)
- Compute `grossIncome` before any penalties
- Compute `arrestPenaltyAmount` from `grossIncome` (not stale `state.finances.totalIncome`)
- Compute `heatPenaltyAmount` from post-arrest illegal income
- Set `totalIncome = grossIncome` (pre-penalty)
- Set `totalExpenses = soldierMaintenance + communityUpkeep + arrestPenaltyAmount + heatPenaltyAmount`
- Set `totalProfit = grossIncome - totalExpenses`
- `resources.money += totalProfit` (same net result, transparent math)

### C. Store penalty amounts in finances object
- Add `arrestPenaltyAmount` and `heatPenaltyAmount` to the finances state so HQ panel can display them accurately as expense line items

## Changes in `src/components/HeadquartersInfoPanel.tsx`
- Income header shows gross income (pre-penalty)
- Expenses section includes arrest/heat penalties as line items — now the math adds up: `Gross Income - All Expenses = Profit`

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — maintenance fix + economy restructure
- `src/components/HeadquartersInfoPanel.tsx` — align display with actual values

