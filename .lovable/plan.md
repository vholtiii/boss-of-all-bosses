## The bug

Today every supply-deal sitdown the AI sends the player is built as if the *player* is the buyer:

- `incomingSitdowns.push({ proposedDeal: 'supply_deal', proposedAmount: price, ... })` (useEnhancedMafiaGameState.ts ~7134)
- On accept, the `supply_deal` reducer always does `state.resources.money -= cost` and `targetOpp.resources.money += cost` (lines 11289 + 11480–11505) and creates a pact with `buyerFamily: state.playerFamily`.

So even though narratively the AI family lost their docks and is begging the player for access, the UI tells the player to pay them. The user is right — when the player owns the supply, money should flow *to* the player, plus a cut of the rival's businesses that benefit from the line.

## What we'll change

### 1. Model the direction on the sitdown
Extend `IncomingSitdown` and `SupplyDealPact` in `src/types/game-mechanics.ts`:
- `IncomingSitdown.playerIsSupplier?: boolean` — true when the AI is the buyer asking the player for access.
- `IncomingSitdown.royaltyRate?: number` — proposed % of buyer's qualifying business income that flows to the supplier (e.g. 0.15).
- `SupplyDealPact.royaltyRate?: number` — persisted on the active pact.
- `SupplyDealPact.lumpSum?: number` — record the upfront paid (for the post-game log / counters).

### 2. Build AI-initiated offers as "buy from player"
In the boss-level branch at lines 7127–7162:
- Set `playerIsSupplier: true`.
- Compute lump sum via existing `computeSupplyDealPrice(...)` (smaller — it's just the upfront).
- Add a royalty: base 15%, +5% when `isDesperate`, −2% when `isRenewal` (cap 10–30%). Round to 5% steps.
- Update notification copy: "Castellano boss wants supply access — offering $X up front + Y% of their take for D turns."

### 3. Accept reducer pays the player when they're the supplier
In `accept_incoming_sitdown` (~9101) and the family-scope `supply_deal` case (11480):
- If `aiInitiated && sitdown.playerIsSupplier`, take a new branch:
  - `state.resources.money += lumpSum` (no deduction, no cooldown, no respect cost — already handled by the `aiInitiated` fairness path).
  - Push pact with `buyerFamily: enemyFamily`, `targetFamily: state.playerFamily`, plus `royaltyRate` and `lumpSum`.
  - Pay the AI buyer out of their own treasury (subtract lump sum from `targetOpp.resources.money`, clamped ≥ 0).
- Existing player-initiated path (player asks to buy) stays unchanged.

### 4. Pay the royalty each turn
Where `supplyDealPacts` are walked for income/decay (the loop near 3837 and the upkeep tick near 3109/11809):
- For each active pact with `royaltyRate > 0`, compute the buyer family's income from businesses that actually use the supply this turn (re-use the existing "famPacts" filter that already gates supply-dependent income).
- Transfer `royaltyRate * eligibleIncome` from the buyer's treasury to the supplier's treasury (player resources when `targetFamily === playerFamily`, otherwise the matching `aiOpponents` entry).
- Emit a small turn-summary line ("Supply royalty from Castellano: $1,200") so the player feels the inflow.

### 5. Counter-offer semantics flip when player is supplier
`counter_supply_sitdown` reducer (9130) and `predictCounterReaction` in `src/lib/negotiation-odds.ts`:
- Add an optional `playerIsSupplier` arg. When true, asking for *more* is the costly direction (AI pushes back on high counters, accepts low ones). When false, current behavior.
- Keep the ±15% accept / ≥40% walk / mid-counter bands, just measured against the price direction the AI cares about.

### 6. UI surface
`src/components/SitdownsPanel.tsx` / `CounterableSitdownCard`:
- When `s.playerIsSupplier`, render the price chip as green inflow ("+$X up front") and add a second chip "+Y% royalty / turn".
- Swap the helper copy on the counter input ("Counter — ask for a higher cut").
- Decline copy unchanged.

### 7. Tests
Extend `src/hooks/__tests__/negotiation-fairness.test.ts`:
- Accepting a `playerIsSupplier` supply sitdown increases `state.resources.money` and creates a pact with `targetFamily === playerFamily`.
- Each turn the pact is active, the player's money grows by ~`royaltyRate * buyer eligible income` and the buyer's money drops by the same amount.
- Counter direction: a +10% counter is "accept", +50% is "walk".

## Out of scope
- A new player-initiated *"sell supply to X"* outgoing flow. We're only fixing the existing incoming sitdowns so they make sense.
- AI ↔ AI royalty: AI-to-AI deals stay as flat lump sums for now (royalty is a player-facing affordance).
