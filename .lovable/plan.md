# Fix unattended construction and missing racket income

## Confirmed causes

- Construction currently advances at `0.35` progress per turn when no friendly crew occupies the block, so an empty job site never actually stops.
- Capo auto-extortion while **moving** correctly marks `tile.anchor` as extorted, but Capo auto-extortion while **deploying** still writes to the obsolete `tile.business` field. The economy reads `tile.anchor.isExtorted`, so deployed-on rackets never produce recurring tribute.
- The deployment auto-extort path credits the immediate payout to the bank but does not add it to the per-turn shakedown ledger.
- Recurring racket tribute is currently folded into broad legal/illegal totals, making it difficult to confirm in the turn summary even when it is paid.

## Changes

1. **Pause empty construction sites**
   - Change unattended construction progress to `0` for player and AI sites.
   - Keep Capo/boss and soldier construction speeds unchanged.
   - Update ETA and crew labels to show `Paused — send a crew` instead of a misleading completion estimate when no friendly soldier, Capo, or boss is present.

2. **Repair every Capo auto-extort path**
   - Update deployment auto-extortion to set `tile.anchor.isExtorted` and `tile.anchor.extortedBy`, matching movement and manual extortion.
   - Remove the stale legacy business write.
   - Record the deployment shakedown payout in `shakedownIncomeThisTurn` so the bank and turn ledger reconcile.

3. **Make recurring tribute visible**
   - Track anchor-racket tribute as its own subtotal during economy processing without double-counting it.
   - Show `Racket tribute` in the turn summary income breakdown while retaining the existing legal/illegal gross totals and net calculation.

4. **Regression coverage**
   - Test that construction makes no progress while unattended and resumes when a friendly soldier or Capo returns.
   - Test both movement and deployment auto-extortion: anchor ownership flags, immediate bank payout, shakedown ledger, and recurring tribute on the following turn.
   - Test that recurring racket tribute appears in the turn summary and contributes to the bank exactly once.

## Scope guards

- Garrison requirements, occupied-site income shares, tribute amounts, construction speeds with a crew present, maintenance, heat, and buy-out rules remain unchanged.
