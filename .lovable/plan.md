

# Fix HQ Financial Overview — Compute Legal/Illegal Split in processEconomy

## Problem
`processEconomy()` computes `totalIncome`, `totalExpenses`, and `totalProfit` from hex-based businesses correctly — but **never sets** `legalProfit`, `illegalProfit`, `dirtyMoney`, or `cleanMoney`. These stay at 0 forever. The HQ panel then falls back to the legacy `businesses[]` array (which is always empty), showing $0 for everything.

## Solution
Track legal vs illegal income separately during the hex iteration in `processEconomy()`, then write all finance fields before returning.

## Changes

### `src/hooks/useEnhancedMafiaGameState.ts` — `processEconomy()` (lines 2500-2615)

**In the main hex income loop (lines 2501-2533):**
- Add two accumulators: `legalIncome = 0`, `illegalIncome = 0`
- After computing `tileIncome` for each hex, check `tile.business.isLegal`:
  - If true: `legalIncome += tileIncome`
  - If false: `illegalIncome += tileIncome`

**After heat penalties and before writing finances (lines 2598-2615):**
- Recalculate legal/illegal split post-penalties (illegal portion reduced by heat penalty percentage)
- Set `state.finances.legalProfit = legalIncome`
- Set `state.finances.illegalProfit = illegalIncome` (after heat penalty reduction)
- Set `state.finances.dirtyMoney += illegalIncome` (accumulates unlaundred money)
- Set `state.finances.cleanMoney = state.resources.money - state.finances.dirtyMoney` (approximation)
- Set `state.finances.legalCosts = maintenance`

**Remove the legacy double-collection block (lines 2604-2615):**
- The "Auto-collect legal business profits" block reads from `state.businesses[]` (legacy array that's always empty) and double-adds income. Remove it entirely — hex-based income already covers everything.

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts`

