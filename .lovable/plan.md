

# Prevent Soldiers from Claiming Hexes with Businesses

## Problem
Soldiers can currently claim any neutral hex, including those with businesses on them. They should only be able to claim empty neutral hexes (no business).

## Change

### `src/components/EnhancedMafiaHexGrid.tsx` — Line 363
Add a check that the tile has no business:

```typescript
// Before:
const canClaim = isNeutral && isSoldier;

// After:
const canClaim = isNeutral && isSoldier && !tile.business;
```

Single line change. No other files affected.

