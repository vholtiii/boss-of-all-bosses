# Polish the soldier claim experience

Claiming works, but it reads as just another entry in the hex menu. This pass makes it obvious when a soldier can take a block, what it costs, and what happens after.

## What changes

1. **Clear claim affordance on the map**
   - Neutral, claimable blocks get a subtle dashed family-coloured outline while a soldier with actions left is selected, so you can see your claim range at a glance (on-tile and adjacent).
   - Blocks that would be claimable except for a blocker (no actions left, standing racket present) get a muted version instead of nothing.

2. **A better claim button**
   - Rename the menu entry by context: "Claim Block" when the soldier is already standing there, "Move In & Claim" when adjacent (it moves the soldier).
   - Show cost as a compact chip: `1 action` plus, when adjacent, a "moves your soldier" hint on the button itself rather than only in a hover tooltip.
   - Give claim its own accent treatment (flag icon + family colour edge) so it doesn't look identical to Extort.

3. **Honest, specific disabled states**
   - Rewrite the disabled reasons in plain language, one clear next step each: out of actions -> "Out of actions — end the turn"; racket present -> "Extort or buy out the racket first"; too far -> "Move within one block"; capo selected -> "Capos claim free by moving on".
   - Disabled claim stays visible (not hidden) when a soldier is selected on a neutral block, so the path forward is always readable.

4. **Confirmation and follow-through**
   - After clicking claim: a short floating "Claim staked" toast on the tile, the existing pending-claim marker gets a clearer label ("Yours next turn if uncontested"), and the claim sound fires.
   - Action pips in the menu header flash the spent pip so the cost is felt.

5. **Keyboard / repeat flow**
   - Keep the soldier selected after claiming so consecutive claims don't require re-selecting, and the menu reopens on the next valid target.

## Technical notes

- All work sits in `src/components/EnhancedMafiaHexGrid.tsx`: the `canClaim` / `reasons.claim` block (~lines 619-668), the claim button in the action menu (~lines 2136-2156), and the highlight layer that already draws pending-claim rings (~line 1224).
- Reuse existing tokens and `familyColors`; no new colour literals.
- Sound via existing `useSoundSystem` claim event; floating text via `MapEffectsLayer`.
- No engine/business-logic change: claim cost, adjacency rules, and capo auto-claim behaviour stay exactly as they are.
