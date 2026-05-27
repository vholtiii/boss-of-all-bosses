## Goal

Make negotiations feel fair and interactive: AI-initiated sitdowns shouldn't punish the player on failure, and both sides should be able to counter any offer with the success chance updating in real time as the price moves.

## Problems today

1. When you **accept an AI-initiated sitdown** and the roll fails, `processNegotiation` still:
   - Deducts the full cost (refunds only 50%)
   - Applies the 2-turn Boss/Capo diplomacy cooldown
   That's wrong — you didn't ask for the meeting; they did.
2. Counter-offers only exist for `supply_deal`. Other deal types (ceasefire, alliance, share_profits, bribe_territory, non_aggression) have no counter UI.
3. When **you** initiate a sitdown, the AI never counters — it just accepts or rejects via the dice roll.
4. The dialog shows a static success chance; tweaking the offered price doesn't change the displayed odds.

## Changes

### 1. Fair handling of AI-initiated sitdowns (`useEnhancedMafiaGameState.ts`)

- Tag the `processNegotiation` call inside `accept_incoming_sitdown` with `aiInitiated: true` (pass through `action`).
- In `processNegotiation`, when `action.aiInitiated`:
  - **Skip the cooldown check** at the top.
  - **Do not set** `bossNegotiationCooldown` / `capoNegotiationCooldown`.
  - **On failure**: full refund of `cost` (not 50%), no respect cost, tension +3 only. Notification: "They walked — you owe nothing."
  - **On success**: pay full agreed cost as today (you got the deal you accepted).
- Player-initiated paths (`negotiate`, `boss_negotiate`) keep current behavior (50% refund, cooldown, respect cost).

### 2. Universal counter-offer action

- Generalize `counter_supply_sitdown` → **`counter_incoming_sitdown`** that works for any `proposedDeal`.
- Same AI response model already used for supply deals:
  - swing ≤ 15% of original → AI accepts, sitdown refreshed at counter price.
  - swing ≥ 40% or `counterRound ≥ 1` → AI walks, tension +5.
  - else → AI re-counters at the midpoint, `counterRound = 1`, marked "final offer".
- For non-priced deals (ceasefire, alliance), counter targets the **duration** instead of price (1–6 turns), reusing the same swing math against `proposedDuration`. `bribe_territory` and `share_profits` use price.
- Keep `counter_supply_sitdown` as a thin alias for save-file compatibility.

### 3. AI counters when the player initiates

- After a player `negotiate` / `boss_negotiate` action where the **roll succeeds but the player's price is "low"** (cost < 0.85× a fair baseline computed the same way as `computeSupplyDealPrice`, generalized per deal type), instead of immediate success, inject a new `IncomingSitdown` with `isCounterOffer: true`, `proposedAmount = midpoint`, and refund the player's payment.
- Player sees it appear in the Sitdowns panel and can Accept / Counter / Decline. This keeps the existing dice-roll UX for fair offers and only triggers a counter when the player lowballs.
- Guarded by a per-turn flag so the AI counters at most once per player-initiated negotiation.

### 4. Live success-chance preview in dialogs

- **`NegotiationDialog.tsx`** (player-initiated): add an editable price `Input` next to each deal option (default = computed cost). Wire its `onChange` to a `useMemo` that re-runs `getSuccessChance` with a price-based modifier:
  - `priceModifier = clamp(round((price / baseCost - 1) * 20), -25, +25)` — higher bid → better odds, lowball → worse.
- The displayed `{chance}% chance` badge updates live as the user types. Roll uses the same modifier.
- **`SitdownsPanel.tsx`** (AI-initiated, `CounterableSitdownCard`): expand the existing counter input from supply-only to all deal types. Show a live "If you counter at $X: ~Y% they accept" hint computed from the swing thresholds in change #2 (≤15% → "likely accept", 15–40% → "they'll re-counter", ≥40% → "they'll walk").

### 5. Types & helpers

- `src/types/game-mechanics.ts`: add `aiInitiated?: boolean` to the negotiation action type; extend `IncomingSitdown.counterRound` doc to cover non-supply deals; add `proposedDuration` to the counter payload.
- `src/lib/negotiation-odds.ts`: add `getPriceAdjustedSuccessChance({ basePrice, offeredPrice, ...oddsInput })` and `predictCounterReaction(originalPrice, counterPrice, round)` returning `'accept' | 'recounter' | 'walk'` so dialog + reducer share one source of truth.

### 6. Tests

- Extend `ai-territory-sitdown.test.ts` (or new `negotiation-fairness.test.ts`):
  - AI-initiated failure → money unchanged, no cooldown set.
  - Player-initiated failure → 50% refund + cooldown as today.
  - `counter_incoming_sitdown` accepts/recounters/walks at the documented thresholds for both `supply_deal` and `ceasefire`.
  - `predictCounterReaction` matches the reducer outcome for sampled prices.

## Out of scope

- Multi-round haggling beyond 1 counter per side.
- New deal types or rebalancing baseline costs.
- AI ↔ AI counter-offers (only player ↔ AI).

## Files touched

- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/lib/negotiation-odds.ts`
- `src/types/game-mechanics.ts`
- `src/components/NegotiationDialog.tsx`
- `src/components/SitdownsPanel.tsx`
- `src/hooks/__tests__/` (new/extended test file)
