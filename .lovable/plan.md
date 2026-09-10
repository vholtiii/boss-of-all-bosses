# Why "Shake on it" won't press — and the fix

The sign button at the sitdown table is locked behind four separate conditions, and none of them tell you which one is blocking you. On top of that, one combination of chips lets the button light up but then does nothing when pressed.

## What's actually happening

The button only becomes pressable when all four are true:

1. You've asked them for at least one thing (their side of the table isn't empty).
2. Their verdict is Interested or Eager — Cold and Insulted are locked out.
3. You can cover every dollar of cash you put up.
4. Nobody on your side is on the negotiation cooldown (2 turns after any signed sitdown, boss and capo tracked separately).

Common real cases: you open a sitdown they called, the table shows their ask, but the price you'd need is more cash than you're holding — so "Meet their number" fills in a number you can't pay and the button stays dead. Or a deal was signed two turns ago and the whole table is frozen, with only a thin banner explaining it.

Separately: if the only things you ask for are cash, intel, or a favor, the deal resolves to no deal type, so pressing the button silently closes the table and nothing is agreed.

## The fix

**Say why it's locked.** Under the footer, a single clear line replaces silence: "They won't sign at this price", "You're short $12,000", "Ask them for something first", or "Your boss can't sign for another 2 turns". Same text on hover.

**Don't offer a number you can't pay.** "Meet their number" caps at your cash on hand; if that still isn't enough it says so and suggests adding non-cash chips (a favor, safe passage, intel, tribute) instead of a dead-end number.

**Make cash/intel/favor-only deals real.** A table whose asks are only cash, intel or a favor now settles as a proper agreement instead of closing with no effect.

**Cooldown becomes honest.** When the cooldown is active the table opens in a read-only "you can look, not sign" state with the turns remaining shown next to the sign button, not just a banner at the top.

## Technical notes

- `src/components/sitdown/SitdownScene.tsx`: derive a `blockReason` from the four gates and render it next to the footer buttons plus as the button `title`; clamp `meetTheirNumber` to `playerMoney` and surface a hint when the required cash exceeds it; show `capo/bossNegotiationCooldown` turn count.
- `src/lib/sitdown-valuation.ts`: `settleBasket` currently returns `dealType: null` when their chips contain none of territory/alliance/ceasefire/supply_access/tribute/safe_passage. Add a fallback settlement so cash/intel/favor-only baskets still produce an actionable result.
- `src/pages/UltimateMafiaGame.tsx`: both `onSubmit` handlers skip `performAction` when `dealType` is null — handle the fallback path so the favor/intel extras are applied.
- Extend `src/lib/__tests__/sitdown-valuation.test.ts` with the favor/intel-only settlement case and the counter-cash clamp.
