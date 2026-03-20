

# Loyalty System Overhaul

## Changes

### File: `src/hooks/useEnhancedMafiaGameState.ts`

**1. Unify loyalty** — eliminate `resources.loyalty`, use only `reputation.loyalty`. Sync at end of turn for legacy reads.

**2. Replace unconditional +1/turn with dynamic calculation:**
- +0.5/turn baseline recovery
- +0.5 per successful extortion
- -2 per soldier lost in combat
- -3 per territory lost
- -5 if money < soldier maintenance cost
- Cap 0-100

**3. Loyalty-based mechanical effects:**

| Loyalty Range | Effect |
|---|---|
| 80-100 | **Combat bonus**: +10% effectiveness |
| 50-79 | Neutral |
| 30-49 | **Ratting risk**: 15% chance/turn someone talks to police (+10 heat) |
| 10-29 | **Desertion risk**: **15%** chance/turn of losing a soldier |
| 0-9 | **Mutiny**: 20% chance of losing a soldier + respect penalty |

**4. Wire ratting risk into enhanced hook:**
- `rattingRisk = recentArrests * 15 * ((100 - loyalty) / 100)`
- If triggered: +25 heat, -15 loyalty, -10 respect

**5. Track loyalty delta for Turn Summary** — save `prevLoyalty`, add to `resourceDeltas`

### File: `src/components/GameSidePanels.tsx`
- Read loyalty from `reputation.loyalty` instead of `resources.loyalty`

### File: `src/components/TurnSummaryModal.tsx`
- Add `loyalty` to `TurnReport` interface and resource deltas grid

### Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/components/GameSidePanels.tsx`
- `src/components/TurnSummaryModal.tsx`

