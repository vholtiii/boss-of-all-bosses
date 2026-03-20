

# Add Respect & Influence Deltas to Turn Summary Modal

## What Changes

### 1. Track influence delta in turn report (`src/hooks/useEnhancedMafiaGameState.ts`)
- Save `prevInfluence` before end-of-turn processing (alongside existing `prevRespect`, `prevMoney`, etc.)
- Add `influence` field to `resourceDeltas` in the turn report (line ~1338-1343)

### 2. Add influence to TurnReport interface (`src/components/TurnSummaryModal.tsx`)
- Add `influence: number` to `resourceDeltas` in the `TurnReport` interface
- Add an "Influence" row to the Resource Changes grid, alongside the existing Money/Soldiers/Respect/Territories rows

### 3. Also update the duplicate TurnReport interface in `useEnhancedMafiaGameState.ts`
- Add `influence: number` to the `resourceDeltas` type there as well
- Initialize it to `0` in the turn report creation (~line 1240)

### Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — track prevInfluence, compute delta, add to report
- `src/components/TurnSummaryModal.tsx` — update interface, display influence delta row

