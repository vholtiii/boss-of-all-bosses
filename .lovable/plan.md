# Keep claiming honest: soldiers spend an action, capos claim by moving

## Current behaviour (verified in code)

- The engine already follows your rule: on a move, only a **capo** marks a neutral, racket-free block as contested (free, no action). Soldiers never auto-claim.
- The manual `claim_territory` action always costs **1 action** from the pool.
- The problem is the map's action menu: after the last change it offers CLAIM to **capos** as well, and to any unit merely **adjacent** to the block. That reads as if a capo needs to spend an action, and it hides the fact that a soldier's claim costs one.

## What changes (UI only)

- **CLAIM is a soldier action.** The map menu offers CLAIM only for a selected soldier. Capos no longer see a CLAIM entry — they get a short note: "Capos claim by moving onto the block — no action spent."
- **Cost is stated up front.** The soldier CLAIM entry is labelled with its cost ("Claim · 1 action") and greys out with "No actions left" when the pool is empty.
- **Adjacency stays but is explicit.** A soldier next to the block can still claim (the engine walks him on), and the entry says so: "Moves your soldier onto the block."
- Disabled reasons stay accurate: standing racket → extort or buy out first; Phase 3 → influence era; ceasefire freeze; no actions left.

## Technical notes

- `src/components/EnhancedMafiaHexGrid.tsx`: drop `isCapo` from `canClaim`, keep on-hex or adjacent for soldiers, keep the `actionsRemaining > 0` gate; add the capo explainer string to `reasons.claim` and the "1 action" label on the claim button.
- No engine changes — `processClaimTerritory` and the capo auto-claim path in `moveUnit` already match the rule.
- Extend `src/hooks/__tests__/claim-and-action-pool.test.ts` with a case asserting a capo moving onto an empty neutral block creates a pending claim **without** reducing `actionsRemaining`.
