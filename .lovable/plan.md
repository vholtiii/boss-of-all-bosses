

# Refine Event System

## Remove 3 Events
Delete event templates #8 (Market Opportunity, lines 2561-2573), #10 (Celebrity Endorsement, lines 2594-2606), and #12 (Dock Workers Strike, lines 2622-2634) from `processEvents`.

## Merge Rat in the Ranks + Federal Investigation into Escalating Event
Replace events #7 and #11 with a single two-stage event:

**Stage 1 — "Rat in the Ranks"** (triggers when heat > 30):
- **Pay to find the rat** ($3k scaled): -10 heat, event resolved
- **Ignore it**: +15 heat, AND sets a flag `ratIgnored = true` on state

**Stage 2 — "Federal Investigation"** (triggers when heat > 60 AND `ratIgnored === true`):
- This only appears if the player previously ignored a rat. The rat's info led to a federal case.
- **Pay off** ($15k scaled): -25 heat, clears `ratIgnored`
- **Take the risk**: random business shutdown + 15 heat, clears `ratIgnored`

If heat > 60 but `ratIgnored` is false, the Federal Investigation can still appear independently but at lower probability (weighted lower in the eligible pool).

Add `ratIgnored: boolean` to game state, initialized `false`.

## Refine Internal Betrayal — Loyalty-Driven Trigger
Replace the current "3+ soldiers" gate and "pay to prevent" mechanic:

**New trigger**: fires only when at least one deployed player soldier has loyalty < 40. The event picks that soldier specifically.

**New choices**:
- **Confront the soldier**: the soldier is removed from the field (executed/dismissed). -1 soldier but loyalty stabilized.
- **Offer a promotion**: costs $5k scaled. Soldier's loyalty jumps +30, capped at 80. Risk: 20% chance it fails and the soldier defects to a random AI family instead (removed from player, AI gains +1 soldier on a random hex).
- **Ignore**: the low-loyalty soldier has a 50% chance of defecting to a rival family next turn (handled by setting a `pendingDefection` flag on the soldier, resolved in next `endTurn`).

Add `pendingDefection?: boolean` to the deployed unit type. In `endTurn`, check for units with this flag: 50% chance they switch family, 50% they stay (loyalty resets to 50).

## Summary of Final Event Pool (7 events)
1. Police Raid — unchanged
2. Rival Meeting — unchanged
3. Informant Tip — unchanged
4. Weapons Shipment — unchanged (clean buy/sell)
5. Political Scandal — unchanged
6. Internal Betrayal — refined (loyalty-gated, 3 choices, defection risk)
7. Rat in the Ranks / Federal Investigation — merged escalating event

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — remove 3 events, rewrite betrayal, merge rat/federal, add `ratIgnored` to state, add `pendingDefection` to unit handling in `endTurn`

