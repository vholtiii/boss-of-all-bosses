

# Fix: Supply Line Decay Not Reflected in Business Income Display

## The Problem

There are actually **two issues**:

1. **UI display is misleading**: The Boss Overview (HQ panel) shows player-built businesses at 100% collection rate even when their supply is disconnected. The `supplyConnected` field is computed but only shown as a badge — it doesn't reduce the displayed income amount.

2. **Actual income calculation is correct**: The turn-end income logic in `useEnhancedMafiaGameState.ts` (lines 3583-3601) properly applies supply decay (-10%/turn after 2-turn buffer, floor at 20%). So you ARE losing income, but the UI doesn't show it.

## What Will Change

### File: `src/pages/UltimateMafiaGame.tsx` (~lines 1112-1149)

In the Boss Overview business list builder, after computing `tileIncome`, apply the same supply decay logic that the actual income calculator uses:

- Check if business has supply dependencies (`SUPPLY_DEPENDENCIES`)
- If disconnected (`supplyConnected === false`), look up the stockpile entry to get `turnsSinceDisconnected`
- Apply the same decay formula: after 2-turn buffer, -10%/turn (floor 20%)
- Update `collectionRate` and `collectionReason` to reflect the penalty (e.g. "No Supply -30%")

This ensures the displayed income per business matches what actually gets collected each turn.

### File: `src/hooks/useEnhancedMafiaGameState.ts` (no change needed)

The actual income calculation is already correct — supply decay applies to all businesses including player-built ones.

## Result

When a business has no supply connection:
- The income shown in the HQ panel will reflect the decay penalty
- The collection rate will show the reduced percentage
- The existing "No Supply" badge will be accompanied by accurate income numbers

