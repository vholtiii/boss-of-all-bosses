

# Restrict Legal Business Construction to Capos

## Overview
Legal businesses can only be built when a Capo is physically on the target hex. The build costs 1 action token. Illegal businesses remain unrestricted (any unit can build them).

## Rule Summary
- **Legal business**: Requires a Capo on the hex + 1 action token + money cost
- **Illegal business**: No Capo requirement (existing behavior)
- The hex must still be player-owned and have no existing business

## Changes

### 1. `src/hooks/useEnhancedMafiaGameState.ts` — Validation
- In the `place_business_on_hex` handler (or equivalent build logic), when the business type is legal:
  - Check that a Capo unit exists on the target hex
  - Check that the player has ≥1 remaining action token
  - Deduct 1 action token on successful placement
- If no Capo is present, show a toast: "A Capo must be on this hex to build a legal business"
- If no actions remaining, show: "No action tokens remaining"

### 2. `src/components/BusinessManagement.tsx` — UI hints
- For legal business build buttons, show helper text: "Requires Capo on hex • 1 action"
- Disable legal build buttons if player has 0 action tokens remaining
- Available hex count for legal businesses should only count hexes that have a Capo on them

### 3. `src/components/EnhancedMafiaHexGrid.tsx` — Placement highlighting
- When placing a legal business, only highlight hexes that are player-owned, empty, AND have a Capo on them
- Illegal business placement highlights all player-owned empty hexes (unchanged)

### 4. `.lovable/plan.md` — Update plan
- Document the Capo requirement for legal business construction

