

# Improve Business Distribution & Add Manhattan Extortion Difficulty

## Changes

### 1. District-Aware Business Generation
**File**: `src/hooks/useEnhancedMafiaGameState.ts` (lines 238-252)

Replace uniform 30% density and random type selection with district-specific configs:

| District | Density | Income Multiplier | Weighted Business Types |
|---|---|---|---|
| Manhattan | ~35% | 1.8x | Gambling dens, store fronts (Wall St, legit fronts) |
| Little Italy | ~25% | 1.0x | Store fronts, gambling dens (restaurants, card games) |
| Brooklyn | ~20% | 0.9x | Balanced mix, slightly more loan sharking |
| Bronx | ~15% | 0.7x | Loan sharking, brothels (grittier) |
| Queens | ~15% | 0.8x | Store fronts, some gambling (immigrant businesses) |
| Staten Island | ~10% | 0.75x | Mostly store fronts, rare loan sharking |

Use the existing coordinate hash for deterministic weighted selection per district.

### 2. Manhattan Extortion Penalty
**File**: `src/hooks/useEnhancedMafiaGameState.ts` (lines 2278-2281)

After computing base `chance`, check if the target tile's district is Manhattan. If so, apply a -20% penalty (multiply by 0.8 or subtract 0.18). This makes Manhattan's lucrative businesses harder to extort — neutral drops from ~90% to ~72%, enemy from ~50% to ~40%.

Add a notification detail when in Manhattan mentioning "heavy police presence" on failure.

### Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — business generation + extortion chance

