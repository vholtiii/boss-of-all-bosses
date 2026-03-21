

# Enhance Hiding & Internal Hit Visibility

## Problem
1. No turn summary info about units **still in hiding** and when they return
2. Internal family hit notification lacks detail (no loyalty info, no unit type)
3. Internal hits don't decrement `resourceDeltas.soldiers` in the turn summary
4. No mention of hiding status in turn summary events

## Changes

### `src/hooks/useEnhancedMafiaGameState.ts`

**A. Internal hit notification — more detail (~line 1368-1372)**
Update the notification message to include the unit's loyalty level and threshold:
```
"A disloyal soldier (loyalty: X/70) was eliminated by the family. -25 heat. Warning: remaining crew morale may suffer."
```

**B. Internal hit turn report — more detail (~line 1406)**
Change from generic `"X soldier(s) eliminated internally"` to:
```
"🔪 Internal hit: X disloyal soldier(s) eliminated by the family (loyalty below 70). -25 heat each. Morale risk applied."
```

**C. Decrement resourceDeltas.soldiers for internal hits (~line 1352)**
After `eliminatedCount++`, add:
```typescript
if (turnReport) turnReport.resourceDeltas.soldiers--;
```

**D. Add "still in hiding" event to turn summary (~after line 1407)**
After processing returns/eliminations, check remaining hidden units and add an event:
```typescript
const stillHiding = newState.hiddenUnits.length;
if (stillHiding > 0 && turnReport) {
  const nextReturn = Math.min(...newState.hiddenUnits.map(h => h.returnsOnTurn));
  turnReport.events.push(`🕵️ ${stillHiding} unit(s) still in hiding. Next return: Turn ${nextReturn}.`);
}
```

Four small edits in one file. No other files affected.

