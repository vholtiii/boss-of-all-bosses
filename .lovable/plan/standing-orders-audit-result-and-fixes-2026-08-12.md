# Standing Orders: audit result and fixes

## Is it working?

Partly. Three of the four effects are real; one does nothing, and rivals never use the system.

**Live today** (verified in the monthly resolution pass):
- `incomeMult` — applied to anchor tribute and to built-building income.
- `heatMult` — applied to building heat before it hits the police heat meter.
- `growthMult` — applied to crew-growth progress, so Muscle Up genuinely spawns soldiers faster.

**Dead today:**
- `defenseBonus: 25` on Fortify Up is defined but read nowhere. Fortify Up currently just lowers your income and heat for no defensive return — it is a strictly bad order.
- The AI never sets a tile policy. Every rival block sits on the default `earn` forever, so the mechanic is player-only and rivals get no economy/heat/defence choices.

## Fixes

1. **Make Fortify Up real.** Feed the tile's `defenseBonus` into the same defence total the hex already computes for combat (alongside fortification/safehouse bonuses) so attacks on a Fortify Up block are measurably harder, and surface it in the attack preview odds.
2. **AI parity.** During each rival's turn, set the standing order per block from its posture: COOL_OFF/heat-critical → Lay Low, WAR/TURTLE on frontier blocks → Fortify Up, rebuilding crew → Muscle Up, otherwise Earn. Same multipliers, no special-casing.
3. **Show the payoff.** In the City Panel and the block popover, print the actual numbers for the chosen order (income delta, heat delta, crew ETA change, +25 defence) instead of only the blurb, so the choice reads as a real decision.

## Technical notes

- `TILE_POLICIES` in `src/types/game-mechanics.ts` stays the source of truth; only `defenseBonus` gains a consumer.
- Combat change is confined to the defence-total helper used by both player and AI resolution, so parity is automatic.
- AI policy assignment reuses the existing posture object already computed per rival turn — no new AI pass.
- Extend the simulation tests: Fortify Up raises defence, Lay Low reduces monthly heat, Muscle Up shortens crew ETA, AI blocks carry non-default policies.

## Scope guards

No rebalance of the four multipliers, no new orders, no changes to buildings, anchors, or turn structure.
