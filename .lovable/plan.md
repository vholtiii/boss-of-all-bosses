# Standing Orders audit: what works, what is broken

## Verdict

Standing orders work correctly **for the player**. For rivals they are half-wired, and one path gives the AI a free advantage.

## Confirmed working (player side)

- **Earn / Muscle Up / Lay Low income** — the monthly pass multiplies both anchor tribute and built-building income by the order's `incomeMult`.
- **Lay Low heat** — building heat is multiplied by `heatMult` before it reaches the police meter.
- **Muscle Up crew growth** — infra-driven recruit progress is multiplied by `growthMult`.
- **Fortify Up defence** — feeds the hit-odds formula and the push-out formula, and shows as a "Defender dug in (Fortify Up)" line in the attack preview. AI attacks against a player block also read the defending block's order.
- **UI** — City Panel and the block popover both print real per-order numbers (income, heat delta, crew rate, +25 defence). Setting an order is free and correctly restricted to owned blocks.

## Confirmed broken

1. **Rivals get Fortify Up for free.** The AI assigns an order to every one of its blocks each turn from its posture, but the rival income pass never applies `incomeMult`, the rival heat never applies `heatMult`, and rivals have no infra crew-growth pass at all, so `growthMult` is inert. Net effect: a rival on Fortify Up gains the full +25 defence on its blocks while paying none of the 30% income cost the player pays. Lay Low and Muscle Up do nothing for them at all.

2. **Captured blocks keep the previous owner's order.** No capture path resets `policy`. Take a rival's dug-in block and it silently stays on Fortify Up, quietly running your new block at 70% income until you notice and change it.

3. **HQ blocks are skipped by the AI assignment** but not by the player's, so an AI HQ never carries an order while a player HQ can. Cosmetic asymmetry, worth aligning.

## Fixes

1. **Pay the price for the order.** In the rival monthly pass, apply the block's `incomeMult` to rival tile income and `heatMult` to rival heat, exactly as the player pass does. Rival Fortify Up then costs the same 30% income it costs the player.
2. **Give Muscle Up a rival meaning.** Either run the same infra crew-growth accumulation for rival blocks, or — if a full rival growth pass is out of scope — stop the AI from ever choosing Muscle Up so it does not sit on a dead order. Preference: run the growth pass for parity.
3. **Reset the order on capture.** Every path that changes `controllingFamily` resets `policy` to `earn` (and clears stale `recruitProgress` where a block flips), so a new owner starts from a clean, visible default.
4. **Align HQ handling** — let the AI assign an order to its HQ block too, matching the player.
5. **Extend the tests** in `tile-policy-effects.test.ts`: rival Fortify Up reduces rival income, rival Lay Low reduces rival heat, and a captured block comes back as `earn`.

## Technical notes

- `TILE_POLICIES` in `src/types/game-mechanics.ts` stays the source of truth; no multiplier values change.
- Rival economy edits are confined to the per-tile loop in the rival turn pass in `src/hooks/useEnhancedMafiaGameState.ts`; the heat multiplier goes in wherever rival building heat is accrued.
- Capture reset is best done by a single helper applied at each `controllingFamily` assignment rather than duplicated inline.

## Scope guards

No rebalance of the four orders, no new orders, no changes to buildings, anchors, combat formulas, or turn structure.
