# Let soldiers claim empty blocks, and guarantee the action pool refills

## What's wrong today

Two separate things, confirmed by reading the turn/claim code:

1. **The claim button is hidden more often than the rules require.** The map's action menu only offers CLAIM when the selected unit is a **soldier standing exactly on** a neutral, anchor-free block. The underlying engine is more permissive — it accepts a claim from a soldier or capo that is on **or adjacent to** the block. So legal claims are being hidden by the UI.
2. **The soldier disappears from selection right after moving.** When a move uses the unit's last move point, the game clears the selection. The action menu only renders for a selected unit, so after walking onto an empty block the CLAIM option vanishes until you click the unit again — which reads as "soldiers can't claim".

Additional friction: moving outside your connected turf costs 1 action, so move-then-claim costs 2 of your 3 actions. That is by design, but nothing tells you that before you commit.

The action pool is reset to the full recalculated maximum at the start of each new turn in the end-turn routine. I have not been able to reproduce a case where it fails to refill, so that part starts as a verification step rather than an assumed bug.

## What changes

**Claim availability**
- The action menu offers CLAIM whenever the engine would accept it: a soldier or capo, on or adjacent to a neutral block with no standing racket, before Phase 3, with at least 1 action left.
- When claim is unavailable, the disabled reason states the real cause: no actions left, standing racket (extort or buy it out instead), Phase 3 influence era, or ceasefire freeze.

**Keep the unit usable after it moves**
- A unit that spends its last move point stays selected. Only an explicit background click or picking another unit clears the selection.
- The selected-unit dock keeps showing the block's available actions once moves are exhausted, so claim is one click away.

**Cost transparency**
- The claim entry shows "1 action", and hovering a move target outside your connected turf keeps showing its "1 action" cost, so a move-then-claim plan is visible before you spend.

**Action pool refill**
- Verify the refill with a turn-cycle test: spend every action, end the turn, assert the pool returns to the recomputed maximum (base + respect/influence bonus + Manhattan extra AP).
- Harden it: recompute and refill the pool at the start of the player's turn rather than only at the tail of end-turn, so an error anywhere earlier in end-turn resolution can never leave you at 0 actions. The HUD meter reads the same recomputed maximum.

## Technical notes

- `src/components/EnhancedMafiaHexGrid.tsx`: widen `canClaim` to `(soldier || capo)` and `(on hex || adjacent)`, gate on `actionsRemaining > 0`, and expand `reasons.claim`.
- `src/hooks/useEnhancedMafiaGameState.ts`: in `moveUnit`, stop nulling `selectedUnitId` when `movesRemaining` hits 0; move the action-pool recompute so it runs when the player's turn begins (keeping the existing `maxActions` formula and the legacy `tacticalActionsRemaining` / `maxTacticalActions` mirrors for save compatibility).
- New test in `src/hooks/__tests__/`: soldier moves onto an empty neutral block and claims it with the remaining action; and a full-spend → end-turn → pool-restored assertion.
