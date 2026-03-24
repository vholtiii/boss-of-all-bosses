

# Fix Scout Mechanics + Boss Panel Scrolling

## Issues Found

### 1. Capo 2-hex scout range broken — `processScout` (line 1167)
The unit selection code correctly shows 2-hex range targets for capos (line 883: `scoutRange = unitType === 'capo' ? 2 : 1`). But `processScout` at line 1167 hard-checks `if (dist !== 1) return prev;` — silently rejecting any target beyond 1 hex. Capos can see the highlighted hexes but clicking them does nothing.

**Fix**: Change the distance check to respect capo range:
```typescript
const maxRange = unit.type === 'capo' ? 2 : 1;
if (dist < 1 || dist > maxRange) return prev;
```

### 2. Boss panel scroll area too small + potentially blocked
The deployed units list has `max-h-32` (128px ≈ 3 items) and businesses `max-h-36` (144px). With many units this is very cramped. The parent `motion.div` has `overflow-hidden` which may clip the scrollbar.

**Fix**:
- Increase scroll areas: units to `max-h-48`, businesses to `max-h-48`
- The outer HQ panel already has `max-h-[calc(100vh-2rem)] overflow-y-auto` (line 143), so the whole panel scrolls if content exceeds viewport — this is fine

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — fix capo scout range check in `processScout`
- `src/components/HeadquartersInfoPanel.tsx` — increase scroll area heights for boss overview lists

