

# Delay Contested Territory Resolution by One Turn

Currently, when a soldier claims a hex it goes contested and resolves to fully owned at the end of the same turn. Change resolution to the **end of the NEXT turn**, giving the claiming soldier a full turn where they can either stay (to defend) or move away, with the resolution happening regardless of their final position (as long as no rival contests it).

## Change

1. **`src/hooks/useEnhancedMafiaGameState.ts`**
   - Locate where contested hexes are stamped (currently sets `contestedUntilTurn = currentTurn` or similar so it resolves at end-of-turn).
   - Update the stamp to `contestedUntilTurn = currentTurn + 1` so the hex remains contested through the entire next turn and resolves at the end of turn N+1.
   - End-of-turn resolution loop already iterates contested hexes — no logic change needed there beyond the new expiry value.
   - Apply same +1 turn shift to:
     - Manual soldier claim
     - Capo auto-claim (per `mem://gameplay/capo-abilities`: "auto-claim now produces contested" — also gets the extended timer)
   - Keep contest-break rules unchanged: if a rival enters/attacks the hex during the contested window, ownership does NOT finalize (existing logic).

2. **UI / Tooltip**
   - In `EnhancedMafiaHexGrid.tsx` (or wherever the contested badge tooltip lives), update the label from "Resolves end of turn" → "Resolves end of next turn" so players understand the new timing.
   - Hex info panel (bottom-left) contested status text updated likewise.

3. **Memory**
   - Update `mem://gameplay/unit-actions/manual-constraints` and `mem://gameplay/capo-abilities` to note: contested territory now resolves at the end of the **following** turn, freeing the claiming unit to move or hold during the intervening turn.

## What Doesn't Change

- Heat generation, claim cost, action budget, contested visuals (hatching/badge), rival contest rules, Phase 3+ disabling of manual claim, capo auto-claim behavior aside from the timer.

