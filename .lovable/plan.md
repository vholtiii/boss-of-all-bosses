

# Fix Extortion Rules + Add Soldier Loss Notifications

## Problem 1: Extortion Range
Soldiers can currently extort from adjacent hexes, but the auto-move to the target hex doesn't work reliably. The fix: soldiers can only extort businesses on hexes they **currently occupy**. Capos can extort adjacent hexes (they already auto-extort on arrival, but this covers manual extortion too).

## Problem 2: Missing Soldier Loss Notifications
When soldiers are removed (combat casualties, arrests, desertion, mutiny, hiding), some paths lack real-time toast notifications — the info only appears in the turn summary. Every soldier loss should produce an immediate notification explaining why.

## Changes

### 1. `src/components/EnhancedMafiaHexGrid.tsx` — Extortion eligibility logic (~line 355)
- **Soldier**: `canExtort` only if the soldier is **on the target hex** (not adjacent) and hex has an illegal business
- **Capo**: `canExtort` if the Capo is **on or adjacent to** the target hex and hex has an illegal business
- Remove auto-move logic from the extortion handler since soldiers must already be on the hex

### 2. `src/hooks/useEnhancedMafiaGameState.ts` — `processTerritoryExtortion` (~line 3533)
- For soldiers: only check for player soldiers **on** the hex (remove adjacent check)
- For capos: allow if capo is on or adjacent (re-enable capo manual extortion for adjacent hexes)
- Remove the auto-move block (~lines 3605-3611) for soldiers since they're already on the hex
- Update the "Capos cannot manually extort" guard to instead allow capo extortion from adjacent

### 3. `src/hooks/useEnhancedMafiaGameState.ts` — Add notifications for every soldier loss

Add `pendingNotifications` entries at each removal point:

| Location | Cause | Notification |
|---|---|---|
| ~line 3486-3488 | Combat victory casualties | "⚔️ Soldier Lost in Combat" — "Your soldier fell during the assault" |
| ~line 3498-3500 | Combat defeat casualties | "⚔️ Soldier Killed in Battle" — "Your soldier was killed in the failed attack" |
| ~line 3329-3330 | Civilian hit (hiding) | Already has notification — no change needed |
| ~line 1554 | Desertion (low loyalty) | "🚪 Soldier Deserted" — already in turn report, add `pendingNotifications` |
| ~line 1571 | Mutiny | "⚔️ Mutiny!" — already in turn report, add `pendingNotifications` |
| ~line 1653 | Police arrest | "🚔 Soldier Arrested" — already in turn report, add `pendingNotifications` |
| ~line 1676 | Capo arrest | "🚔 Capo Arrested" — already in turn report, add `pendingNotifications` |

