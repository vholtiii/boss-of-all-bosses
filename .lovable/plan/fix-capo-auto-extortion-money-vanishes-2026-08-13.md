# Fix: Capo auto-extortion money vanishes

## What's wrong

When a Capo moves onto a neutral block with a standing racket, the game shows an
"Capo Auto-Extortion! +$X" popup, but:

1. **The racket never actually becomes extorted.** The auto-extort writes the extorted
   flag onto a leftover legacy field (`tile.business`) instead of onto `tile.anchor`.
   Monthly income only pays tribute for blocks where `tile.anchor.isExtorted` is true, so
   the block silently earns nothing from then on — no tribute in the bank, no line in the
   turn summary. The manual (soldier) extort action does set the flag correctly, which is
   why only the auto path is broken.
2. **The one-off shakedown payout is never recorded.** The cash is added to the treasury,
   but nothing writes it into the turn report, so the summary's income tally doesn't
   account for it and the numbers don't reconcile with the money change on screen.

## The fix

**1. Make auto-extort a real extortion**
- On Capo arrival, set `tile.anchor.isExtorted = true` (and record the extorting family)
  instead of writing to the legacy `business` field, matching what the manual extort does.
- Drop the stale `business` write so there's only one source of truth for the block.

**2. Put the shakedown cash in the tally**
- Track one-off shakedown payouts (Capo auto-extort and soldier extort) for the current
  turn and surface them as a "Shakedowns" line in the turn summary's income breakdown, so
  the summary total matches the money actually gained.

**3. Guard against regressions**
- Add a test: a Capo moving onto an anchored neutral block flags the anchor as extorted,
  credits the payout, and the block pays tribute on the following turn's income pass.

## Technical notes

- `moveUnit` in `src/hooks/useEnhancedMafiaGameState.ts` (~line 2606-2620): change the
  returned tile to `{ ...workingTile, controllingFamily: player, anchor: { ...anchor,
  isExtorted: true, extortedBy: player } }`.
- Monthly income gate lives at ~line 5700 (`tile.anchor?.isExtorted`) — no change needed
  once the flag is set correctly; tribute still requires a garrison, as designed.
- `turnReport.incomeBreakdown` (~line 6049) gains a `shakedowns` entry; accumulate the
  amount on a per-turn counter cleared at turn start, written by both extort paths.

## Scope guards

- Tribute values, buy-out costs, garrison rules, heat and respect effects unchanged.
- Soldier manual extortion behaviour unchanged apart from being counted in the tally.
