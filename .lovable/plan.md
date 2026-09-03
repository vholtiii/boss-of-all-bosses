# Stop "Take the Reins" from covering the Five Boroughs Tribune

## What is going wrong

The "Rivals are moving" recap (TurnSpotlight) is not actually waiting for the Tribune. When you end a turn, the new turn report arrives and two things fire in the same instant:

1. The resolution choreography is told to start (which later opens the Tribune).
2. The spotlight checks "is the resolution or the Tribune open?" — but at that exact moment neither flag has flipped yet, so it answers "no" and opens itself immediately.

The Tribune then opens underneath the already-visible spotlight, which sits at a higher layer. The gate added last time never had a chance to block it.

## The fix: strict one-after-the-other sequence

```text
End Turn
  -> Turn resolution choreography (income floats, territory flashes)
  -> Five Boroughs Tribune (newspaper summary)
  -> press "Read all about it - Continue"
  -> "Rivals are moving. Watch the board." recap
  -> press "Take the Reins" -> back to the map
```

- The spotlight will only open as a direct result of closing the Tribune, never on its own timer or on report arrival.
- It still shows once per turn (the existing per-turn guard stays), so reopening the Tribune later from the sidebar won't re-trigger it.
- If a turn has no rival moves to show, the spotlight is skipped and you land straight on the map after Continue.

## Technical details

File: `src/pages/UltimateMafiaGame.tsx`

- Remove the reactive `useEffect` (around lines 284-292) that opens the spotlight based on `turnReport`/`showTurnResolution`/`showTurnSummary`. This is the race condition.
- In `TurnSummaryModal`'s `onClose` handler, after `setShowTurnSummary(false)`, open the spotlight explicitly:
  - only if `gameState.turnReport?.turn === gameState.turn`
  - only if `spotlightedTurnRef.current !== gameState.turn` (then set it)
  - only if `spotlightMoves.length > 0`
- Keep the `TurnResolutionOverlay -> setShowTurnSummary(true)` handoff unchanged.
- No changes to `TurnSpotlight.tsx` or `TurnSummaryModal.tsx` visuals.

## Verification

- Typecheck with `tsgo`.
- Playwright: start a game, end a turn, confirm the Tribune is visible with no spotlight on top; click Continue and confirm the spotlight then appears; click Take the Reins and confirm the map is clear.
