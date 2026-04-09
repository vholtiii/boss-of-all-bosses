

# Supply Lines: Map-Wide Impact + Minimum Distance

## Problem
1. **Limited scope**: Several business types (casino, drug_trafficking, laundromat, prostitution) have no supply dependency — supply lines don't affect them at all. Supply lines should control inventory for ALL businesses on the map.
2. **Too close to HQ**: Current exclusion is only 1-hex adjacent to HQ. Nodes can spawn 2 hexes away, making supply lines trivially short. Need a minimum distance of 5 hexes.

## Changes

### 1. Expand `SUPPLY_DEPENDENCIES` to cover ALL business types (`src/types/game-mechanics.ts`)

Add missing business types with logical supply node assignments:

| Business | Supply Node | Rationale |
|----------|------------|-----------|
| casino | liquor_route | Casinos need liquor supply |
| drug_trafficking | docks | Drugs come through the docks |
| laundromat | trucking_depot | Needs pickup/delivery logistics |
| prostitution | trucking_depot | Transport network |

This means every business on the map now depends on at least one supply node. Losing a supply line affects all businesses of that type across the entire map — not just ones in the node's territory.

### 2. Increase minimum spawn distance to 5 hexes (`src/hooks/useEnhancedMafiaGameState.ts`)

Replace the current "exclude HQ-adjacent hexes" filter (lines 580-592) with a proper hex distance check using the existing `hexDistance()` function:
- For each candidate hex, compute distance to ALL HQ positions
- Reject candidates where distance to ANY HQ is < 5
- This ensures every supply node requires building a meaningful territorial chain to reach

### 3. Apply supply decay to AI families too (`src/hooks/useEnhancedMafiaGameState.ts`)

The income calculation (line 2848-2865) only checks the player's `connectedNodeTypes`. Expand to also apply decay to AI family businesses using per-family connectivity — this is already tracked in `supplyStockpile` but not applied to AI income.

## Files Modified
- `src/types/game-mechanics.ts` — add casino, drug_trafficking, laundromat, prostitution to `SUPPLY_DEPENDENCIES`
- `src/hooks/useEnhancedMafiaGameState.ts` — minimum 5-hex distance filter for node placement + AI supply decay in income calc

