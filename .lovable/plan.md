

# Allow Extortion of Store Fronts (Legal Businesses)

## Problem
The Extort action menu only appears on hexes with **illegal** businesses. Line 441 in `EnhancedMafiaHexGrid.tsx` checks `!tile.business.isLegal`, so store fronts (which are `isLegal: true`) can never be extorted. This blocks a core mafia mechanic — protection rackets on legitimate businesses.

## Changes

### 1. `src/components/EnhancedMafiaHexGrid.tsx` (~line 441-447)
Change the extortion eligibility check from requiring an illegal business to requiring **any completed business**:

```typescript
// Before
const hasIllegalBusiness = !!tile.business && !tile.business.isLegal;
const canExtort = hasIllegalBusiness && (...)

// After
const hasAnyBusiness = !!tile.business && !(tile.business.constructionProgress !== undefined && tile.business.constructionProgress < (tile.business.constructionGoal || 3));
const canExtort = hasAnyBusiness && (...)
```

Also update the disabled reason at line 462 from `'No illegal business'` to `'No business on hex'`.

### 2. `src/components/EnhancedMafiaHexGrid.tsx` (~line 467)
Update the claim reason from `'Has business (extort instead)'` to keep it accurate — this is still correct since any business hex should use extort.

### 3. Auto-extortion in `src/hooks/useEnhancedMafiaGameState.ts` (~lines 1073, 1439)
Capo auto-extortion currently only triggers on illegal businesses (`!tile.business.isLegal`). Extend it to also auto-extort legal businesses on neutral territory, with a slightly lower payout for legal businesses (they're less lucrative as extortion targets).

## Files Modified
- `src/components/EnhancedMafiaHexGrid.tsx` — allow extort on any hex with a completed business
- `src/hooks/useEnhancedMafiaGameState.ts` — extend capo auto-extortion to legal businesses

