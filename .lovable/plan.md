

# Rework Soldier Movement: Free Movement in Connected Territory

## Concept

Soldiers can move **unlimited hexes** within territory that forms an unbroken path back to HQ — for free (no move cost). Normal 1-hex-per-move rules apply when leaving connected territory or crossing gaps.

## Rules

| Scenario | Cost | Restriction |
|----------|------|-------------|
| Moving within connected claimed territory | **Free** (0 moves) | Path of owned hexes must connect to HQ |
| Moving to adjacent unclaimed/enemy hex | **1 move** (normal) | Standard deploy rules |
| Moving to disconnected claimed territory | **1 move** (normal) | No free jump across gaps |
| Capo movement | **Unchanged** | Still flies up to 5 hexes |

**"Connected territory"** = a hex controlled by the player's family, where a BFS/flood-fill from HQ through only player-owned hexes can reach that hex.

## Technical Changes

### `src/hooks/useEnhancedMafiaGameState.ts`

**New helper function: `getConnectedTerritory()`**
- BFS from player HQ through hexMap tiles where `controllingFamily === playerFamily`
- Returns a `Set<string>` of `"q,r,s"` keys for all connected hexes

**Modify `selectUnit()` (~line 979-992) — deploy phase hex calculation for soldiers:**
- Compute connected territory set
- If soldier is on a connected hex: show ALL connected territory hexes as valid moves (green highlights), PLUS normal adjacent hexes (for venturing out)
- If soldier is on a disconnected hex: normal 1-hex adjacent only (current behavior)

**Modify `moveUnit()` (~line 1057-1068) — move cost calculation:**
- Before deducting `moveCost = 1`, check: is the soldier on a connected hex AND is the target also a connected hex?
- If both connected: `moveCost = 0`, no zone-of-control stop
- If either is not connected: `moveCost = 1` (normal rules, ZoC applies)

**Modify post-move hex recalculation (~line 1125-1137):**
- Same logic: if soldier landed on connected hex, show full connected territory + adjacent; if not, show normal 1-hex neighbors
- Keep soldier selected after free moves (movesRemaining unchanged)

**No changes to capo movement** — capos already fly freely.

### Visual Distinction (optional, low effort)
Connected territory hexes could use a slightly different highlight color (e.g., lighter green) vs the normal adjacent move hex to help players distinguish free vs costed moves. This can be done in `EnhancedMafiaHexGrid.tsx` by passing a `freeMovementHexes` set alongside `availableMoveHexes`.

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — BFS helper, selectUnit changes, moveUnit cost logic, post-move recalculation

