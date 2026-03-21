

# Remove Investment System

The "Invest $20K" button in the Economy menu and the `InvestmentPanel` component dispatch `make_investment` actions, but there is **no handler** in `useEnhancedMafiaGameState.ts`. It's non-functional dead code.

## Changes

### 1. `src/components/GameSidePanels.tsx`
- Remove the "Invest $20K" `ActionButton` (lines ~174-181) from the Economy category

### 2. `src/components/EnhancedGameMechanics.tsx`
- Remove the entire `InvestmentPanel` component (~lines 335-495) and its export

### 3. `src/types/enhanced-mechanics.ts`
- Remove the `Investment` interface and the `investments` field from `EconomySystem`

### 4. `src/hooks/useEnhancedMafiaGameState.ts`
- Remove `investments: []` from the economy initial state (line ~444)

