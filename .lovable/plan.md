

# Soldier Auto-Move on Claim/Extort + Capo Extort Restrictions

## Problem
1. **Soldiers** claim territory or extort from adjacent hexes but don't move to that hex afterward.
2. **Capos** should NOT be able to extort at range via the action menu. Their extortion is **automatic on arrival** at a neutral hex with a business (already implemented in move/deploy). Capos CAN still claim at range without moving.

## Changes

### `src/hooks/useEnhancedMafiaGameState.ts`

**1. `processClaimTerritory` (~line 2812-2846)**
- Keep allowing both soldiers and capos to claim from adjacent hexes
- After successful claim: find the first **soldier** from `playerSoldiersAdjacent` (not already on hex) and update their `q, r, s` to the target coordinates
- Capos do NOT move — they claim at range

**2. `processTerritoryExtortion` (~line 3141-3249)**
- Add a guard at the top: if ALL units in `allPlayerUnits` are capos (no soldiers present on or adjacent), return early — capos cannot manually extort, their extortion is automatic on arrival only
- After successful extortion: find the first **soldier** from `playerUnitsAdjacent` and move them to the target hex
- This means only soldiers (on hex or adjacent) can trigger the extort action

**3. Capo auto-extort on move (~line 935-957)** — already correctly implemented, no changes needed. Capos auto-claim and auto-extort neutral hexes when they move onto them.

**4. Capo auto-claim on deploy (~line 1241-1249)** — already correct, no changes needed.

## Summary of Behavior After Changes

| Action | Soldier | Capo |
|---|---|---|
| Claim (action menu) | Yes, auto-moves to hex | Yes, stays at range |
| Extort (action menu) | Yes, auto-moves to hex | No — extort is auto on arrival only |
| Extort on arrival | N/A | Automatic (existing) |

