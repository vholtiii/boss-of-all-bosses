

# Fix HQ Financial Overview — Use Actual Game Finances

## Problem
The HQ panel calculates profits by summing `business.income` from `gameState.businesses` (a legacy array). But actual income is computed from `hexMap` tiles in `processEconomy()` and stored in `gameState.finances`. These two data sources are disconnected, so the HQ panel shows stale/incorrect numbers.

## Solution
Pass `gameState.finances` directly to `HeadquartersInfoPanel` and display the real computed values instead of re-calculating from the businesses array.

## Changes

### `src/components/HeadquartersInfoPanel.tsx`
- Add `finances` prop typed as `{ totalIncome: number; totalExpenses: number; legalProfit: number; illegalProfit: number; totalProfit: number; dirtyMoney: number; cleanMoney: number; legalCosts: number }`
- Replace the local profit calculation (lines 100-110) with direct use of `finances.legalProfit`, `finances.illegalProfit`, `finances.totalProfit`
- Also display dirty/clean money split and maintenance costs so the player sees a complete financial picture

### `src/pages/UltimateMafiaGame.tsx`
- Pass `finances={gameState.finances}` to `HeadquartersInfoPanel` (around line 860)

## Files Modified
- `src/components/HeadquartersInfoPanel.tsx`
- `src/pages/UltimateMafiaGame.tsx`

