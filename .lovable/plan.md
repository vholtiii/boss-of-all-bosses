

# Territorial Zone of Control — Phase 3 Gate + Implementation

## Summary

Two changes in one file (`src/hooks/useEnhancedMafiaGameState.ts`):

1. **New helper** `isAdjacentToEnemyTerritory(q, r, s, hexMap, playerFamily)` — returns true if any neighbor hex is controlled by a rival family.

2. **Update ZoC block** (line 1686-1690) — wrap the existing enemy-unit ZoC AND the new territorial ZoC in a **Phase 3+ gate** (`currentPhase >= 3`). Before Phase 3, neither unit-based nor territorial ZoC applies to soldiers.

```text
// Pseudocode for the updated block:
if (unit.type === 'soldier' && currentPhase >= 3) {
  if (isAdjacentToEnemy(...) || isAdjacentToEnemyTerritory(...)) {
    remainingMoves = 0;
  }
}
```

This means:
- **Phase 1-2**: Soldiers move freely near enemies and rival borders — early expansion is unhindered.
- **Phase 3+**: Moving adjacent to enemy units OR rival-claimed territory stops the soldier (0 remaining moves). Capos remain exempt.

No UI changes needed — the soldier simply stops when it enters the ZoC hex, same as the current behavior.

