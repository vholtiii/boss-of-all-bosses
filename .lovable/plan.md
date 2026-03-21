

# Fix: "Still in Hiding" Event Not Showing Every Turn

## Problem
The "🕵️ X unit(s) still in hiding" turn summary event is inside the `if (returningUnits.length > 0)` block. This means it only appears on turns when a hidden unit is scheduled to return — not on intermediate turns when soldiers are still hiding but none are returning yet.

## Change

### `src/hooks/useEnhancedMafiaGameState.ts` — Lines 1410-1415
Move the "still in hiding" check **outside** the `if (returningUnits.length > 0)` block so it runs every turn:

```
// Before (inside the if block, at lines 1410-1415):
        const stillHiding = newState.hiddenUnits.length;
        if (stillHiding > 0 && turnReport) {
          const nextReturn = Math.min(...newState.hiddenUnits.map(h => h.returnsOnTurn));
          turnReport.events.push(`🕵️ ${stillHiding} unit(s) still in hiding. Next return: Turn ${nextReturn}.`);
        }
      }   // <-- end of returningUnits block

// After (moved outside):
      }   // <-- end of returningUnits block

      const stillHiding = newState.hiddenUnits.length;
      if (stillHiding > 0 && turnReport) {
        const nextReturn = Math.min(...newState.hiddenUnits.map(h => h.returnsOnTurn));
        turnReport.events.push(`🕵️ ${stillHiding} unit(s) still in hiding. Next return: Turn ${nextReturn}.`);
      }
```

Single block move, one file. Everything else from the previous implementation is correct.

