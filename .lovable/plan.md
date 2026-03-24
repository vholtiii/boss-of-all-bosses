

# HQ Expenses Breakdown

## Problem
The HQ panel shows a single "Expenses" number with no breakdown. The player can't see what's costing them money.

## Expense Categories (from `processEconomy`)
1. **Soldier Maintenance**: $600/turn per deployed soldier + $600/turn per reserve soldier
2. **Community Upkeep**: $150/turn per empty claimed hex (no business, not HQ)
3. **Arrest Penalties**: Profit reduction from active arrests (percentage-based)
4. **Heat Penalties**: Illegal income reduction from police heat

## Changes

### `src/hooks/useEnhancedMafiaGameState.ts`
- Extend `state.finances` to include breakdown fields: `soldierMaintenance`, `communityUpkeep`, `arrestPenalty`, `heatPenalty`
- Set these values during `processEconomy()` so they're available to the UI

### `src/components/HeadquartersInfoPanel.tsx`
- Update `finances` prop type to include `soldierMaintenance`, `communityUpkeep`, `arrestPenalty`, `heatPenalty`
- Replace the single "Expenses" box (line 222-224) with an expandable breakdown showing each cost category with its amount
- Show soldier count × $600, empty hex count × $150, arrest penalty %, heat penalty % — each as a labeled row

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — compute and store expense breakdown
- `src/components/HeadquartersInfoPanel.tsx` — display expense breakdown

