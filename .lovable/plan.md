

# Complete Enemy Hex Entry System

## Summary

Implement three interconnected mechanics governing how units interact with rival-controlled territory, plus AI defense responses.

---

## Mechanic 1: Rival Soldier Stacking Rule

**No two soldiers from different families can occupy the same hex.** Only a Capo may enter a hex with a rival soldier — and only if Safe Passage is active with that family.

**File: `src/hooks/useEnhancedMafiaGameState.ts`**

- In player movement validation (~lines 1517-1565): filter out hexes occupied by an enemy soldier (check `deployedUnits` for rival family units on that tile). Exception: Capos with an active `safePassagePact` for that hex's controlling family.
- In AI movement validation (~lines 3968-3980): same filter — AI soldiers cannot move onto hexes with a rival soldier present.

---

## Mechanic 2: Phase 1 — Contested Hex Auto-Capture

When a soldier moves onto a rival-controlled hex during Phase 1, the hex becomes "contested" rather than immediately captured.

**File: `src/hooks/useEnhancedMafiaGameState.ts`**

- Add `contestedHexes: Array<{ q, r, s, occupyingFamily, occupyingSince }>` to game state (init `[]`, persist in save/load).
- In move execution (~line 1702): if `gamePhase === 1` and target hex is rival-controlled, add entry to `contestedHexes` with current turn. Show notification: "Contesting [Family] territory — hold for 1 turn to seize it."
- In turn-end processing (~line 2229 area): for each contested hex, if the occupying soldier is still there and no rival soldier has retaken it, flip ownership to the occupying family and remove from `contestedHexes`. Show capture notification.
- If the soldier moved away or was killed, remove from `contestedHexes`.

---

## Mechanic 3: Phase 2+ — Forced Action Dialog

When a soldier moves onto a rival-controlled hex in Phase 2+, a modal forces the player to choose an action before continuing.

**New file: `src/components/EnemyHexActionDialog.tsx`**

- Dialog with two options:
  - **Hit Territory**: Triggers combat using existing hit logic (success chance, casualties, heat +10). On success, hex becomes neutral or player-controlled.
  - **Sabotage Business** (only if hex has a business and player has $12,000+): Destroys the business, costs $12k, adds +15 heat.
- **Cancel**: Returns soldier to their previous position, restores `movesRemaining`.
- Shows target info: district, controlling family, defenders present, business type.

**File: `src/hooks/useEnhancedMafiaGameState.ts`**

- Add `pendingEnemyHexAction: { unitId, fromQ, fromR, fromS, toQ, toR, toS } | null` to game state.
- In move execution (~line 1702): if `gamePhase >= 2` and target hex is rival-controlled, set `pendingEnemyHexAction` instead of completing silently. The soldier is placed on the hex but the game pauses for action selection.
- Add `resolveEnemyHexAction(action: 'hit' | 'sabotage' | 'cancel')`:
  - `'hit'`: Run combat formula, apply casualties/heat, flip hex on success.
  - `'sabotage'`: Deduct $12k, remove business, +15 heat.
  - `'cancel'`: Move soldier back to origin hex, restore moves.

**File: `src/pages/UltimateMafiaGame.tsx`**

- Render `EnemyHexActionDialog` when `pendingEnemyHexAction` is set.

---

## Mechanic 4: Capo Escort Restriction

Capos escorting soldiers into rival territory requires Safe Passage.

**File: `src/hooks/useEnhancedMafiaGameState.ts`**

- Escort "call" action (~line 1606-1634): if the Capo is on a rival-controlled hex, check for active `safePassagePact` with that family. Block if none exists, notify: "Cannot escort here — no Safe Passage with [Family]."
- Capo movement with escorts (~lines 1705-1715): when destination is rival-controlled and Capo has escorted soldiers, check safe passage. If none, auto-detach soldiers at their current position before the Capo moves. Notify: "Soldiers detached — no Safe Passage for escort into [Family] territory."

---

## Mechanic 5: AI Defense of Contested Hexes

**File: `src/hooks/useEnhancedMafiaGameState.ts`** (AI turn processing)

- During AI movement (~line 3960+): AI families scan `contestedHexes` for entries in their territory. If a nearby AI soldier exists (within 2 hexes), prioritize moving onto the contested hex to defend it, triggering a hit action against the intruder. Defense probability scales with AI personality aggressiveness.

---

## Technical Details

- `contestedHexes` and `pendingEnemyHexAction` added to the state interface (~line 339) and initialized in `createInitialState` (~line 876).
- Save/load functions updated to persist `contestedHexes`.
- All hex-occupancy checks use existing `deployedUnits` array filtered by coordinates.

