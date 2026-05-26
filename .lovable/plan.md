# Make Supply-Line Negotiations Feel Active

## Why this needs fixing

Supply deals exist but rarely surface during play. Today:

- AI only proposes once per "disconnected" episode (20%/turn) and never follows up.
- Price is hardcoded at $7,500 regardless of how badly the buyer needs it or how much leverage the supplier has.
- Deals expire silently — no renewal pressure, no renegotiation moment.
- The player has no incentive to cut a rival's lines because nothing dramatic happens when they do.
- There is no counter-offer flow — the player can only accept/decline a flat offer.

Result: supply lines feel like background plumbing, not a diplomatic lever.

## Goal

Turn supply lines into a recurring negotiation surface. Cutting/holding a supply node should produce **desperate offers**, expiring deals should produce **renewal offers**, and prices should reflect leverage.

## Changes

### 1. Severance-triggered desperation offers (new)
When an AI family **loses connection** to a supply node it had last turn (player or rival cut their chain, or they lost a key hex), it should immediately attempt a supply-deal sitdown — at a premium price.

- Detection: per-AI snapshot of `connectedSupplyNodeTypes` each turn; on loss, fire offer next AI turn.
- Price: `basePrice * (1.5 + 0.25 × nodesLost)` capped at 3×.
- Targeting: prefers the player if the player controls the lost node ("you cut us, now pay us back" framing). Otherwise picks the AI rival currently connected.
- Bypasses the 20% roll — desperation always tries.
- Notification framing: "🚨 Desperate Offer — the Genovese boss is offering $14,000 for emergency access…"

### 2. Renewal offers on expiry (new)
When a supply deal is in its final turn (`turnsRemaining === 1`):
- The supplier (if AI) auto-proposes a renewal sitdown to the buyer (player or AI), priced based on how much income the buyer earned during the deal.
- If the buyer is the player → boss-level sitdown.
- Notification: "🔁 Renewal Offered — Lucchese will extend supply access another 5 turns for $9,000."
- If declined/expired, normal +5 tension penalty still applies, plus a one-turn cooldown before a new deal can be struck (so it feels like burned bridges).

### 3. Dynamic pricing (replace flat $7,500)
New helper `computeSupplyDealPrice(state, buyerFam, supplierFam, context)`:
- Base: $5,000.
- + `$1,500 × number of node types granted`.
- + `25%` if supplier is at war with anyone (premium for risk).
- + `50%` if buyer is in "desperation" state (lost lines this turn or last).
- × `0.85` if buyer/supplier currently have positive tension reduction cooldown (relationship discount).
- Round to nearest $500.

Used everywhere a supply deal price is set: AI↔AI, AI→player sitdowns, player→AI initiation in `NegotiationDialog`, and renewals.

### 4. Player counter-offer flow (sitdowns panel)
In `SitdownsPanel` / dialog for an incoming `supply_deal` sitdown, add a **Counter** button alongside Accept/Decline:
- Opens a small price input (default = proposed price × 0.7, min $2,000).
- Submitting creates a counter-sitdown back to the AI; AI decides next turn:
  - Accept if `counter >= computedPrice × 0.85` (or relationship is friendly).
  - Reject and withdraw if `< 0.6×`.
  - Otherwise counter back once with the midpoint.
- One round of back-and-forth max to avoid loops.

### 5. AI proposes more often when relevant
- Lower the gate from "20% if disconnected" to "60% if disconnected OR if a current deal expires in ≤2 turns".
- Drop the `phase >= 2 && money >= 7500` floor to `phase >= 1 && money >= computedPrice`.
- Keeps the existing "only one active deal per buyer" guard.

### 6. Notifications & turn-summary surfacing
- Pipe new offers, counters, renewals, and severance triggers into `pendingNotifications` with clear icons.
- Add an entry to `turnReport.aiActions` for each new offer type so post-turn summary shows the diplomatic activity.

## Files touched

- `src/hooks/useEnhancedMafiaGameState.ts` — AI supply-deal block (~7026-7123), pact expiry block (~11608), supply-deal acceptance block (~11279).
- `src/lib/negotiation-odds.ts` — add `computeSupplyDealPrice` + export.
- `src/components/SitdownsPanel.tsx` and/or `src/components/NegotiationDialog.tsx` — Counter button + price input UI.
- `src/types/game-mechanics.ts` — extend `IncomingSitdown` (optional `isCounterOffer`, `isRenewal`, `isDesperate` flags; `originalPrice` for counter rounds).
- Tests: extend `src/hooks/__tests__/strategy-simulation.test.ts` or add a focused `supply-deals.test.ts` covering: severance triggers offer, renewal fires on last turn, counter-offer round-trip, dynamic pricing math.

## Out of scope

- Multi-buyer bidding wars (could be a follow-up).
- Supply-line UI overhaul on the map.
- AI personality flavoring of offers (use existing personalities; no new fields).

## Technical notes

- Per-AI snapshot of last-turn supply node connectivity stored on `state.aiOpponents[i].resources` as a non-persistent transient field, or on a top-level `state._aiSupplyConnectivitySnapshot` map cleared each turn. Choose transient map to avoid save-migration churn.
- Counter-offer state lives on the sitdown record itself; no new top-level state needed.
- All price math centralized in `negotiation-odds.ts` so dialog and AI agree.
