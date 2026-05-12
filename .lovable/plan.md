# Fix: Supply deals applied without player consent (Boss-level sitdown, distinct from Capo flow)

## Problem

In `useEnhancedMafiaGameState.ts` (~lines 6812–6892), AI families that need supply access auto-create a `supplyDealPacts` entry **and** auto-debit/credit cash. When the chosen supplier is the player, the pact appears already-active with no negotiation step — the player ends up bound to deals they never agreed to.

AI↔AI supply deals can keep auto-resolve. The bug is the player-as-supplier path.

## Fix

### 1. AI → Player supply request → Boss-level sitdown (not Capo)

When the AI's chosen supplier is the player, don't move money or create a pact. Push an `IncomingSitdown` that is **explicitly a Boss-to-Boss meeting**, distinct from the existing Capo territory-sitdown flow:

- `fromFamily`: requesting AI family
- `fromBossName`: the AI family's boss name (or just the family label) — **no `fromCapoId` / `fromCapoName` / `fromCapoPersonality`**, which is what marks territory/capo sitdowns
- `proposedDeal: 'supply_deal'`
- `scope: 'family'` (the existing Boss-scope marker — opposite of `'territory'`)
- `proposedAmount: 7500`
- `proposedDuration: 5–7`
- `successBonus: 15`
- `expiresOnTurn: state.turn + 2`

Skip if there's already an incoming supply-deal sitdown from this family or an active supply pact between this AI and the player.

Notification: "🏛️ Boss Sitdown Requested — The {Family} boss is offering $7,500 for {duration} turns of supply access. Open the Sitdowns panel."

### 2. Distinct UI treatment in `SitdownsPanel`

The panel today renders incoming offers in one block. Split visually so the Boss flow can't be mistaken for a Capo sitdown:

- Group incoming offers by `scope`: render a **"Boss Sitdowns"** subsection (icon: 🏛️ / `Crown`) above the existing **"Capo Sitdowns"** subsection (icon: 🤝 / `Handshake`).
- Boss cards label the requester as "{Family} Boss" — no capo name, no hex coords, no "Hex (q, r)" line.
- Card border/accent uses a Boss-tier color (e.g. `mafia-gold` solid) to differentiate from capo cards.
- Accept/Decline buttons use the same `accept_incoming_sitdown` / `decline_incoming_sitdown` actions; routing is already scope-based (line 8612: `scope === 'territory'` → capo negotiate, else → `boss_negotiate`).

### 3. Acceptance routes through Boss negotiation roll (existing path)

`accept_incoming_sitdown` (line 8606) for `scope: 'family'` already routes to `boss_negotiate`, which calls `processNegotiation` with `isBossNegotiation: true`. That flow:

- Requires Phase 3+ (Boss Diplomacy phase gate at line 8598) — verify this matches design intent for supply deals; if supply deals should be available earlier, lower the gate **only for** `proposedDeal === 'supply_deal'` in this handler.
- Uses Boss-scope success math (no capo personality bonus; `+respect/4`, `+influence/5`, fear bonus for supply deals) — the success roll at line 10489 then mutates state in the `supply_deal` case at line 10635 (cash transfer + pact).
- On failure: 50% refund-equivalent, AI walks away.
- Honor `proposedDuration` in the `supply_deal` case (line 10635) instead of the random 5–7.

### 4. Player → AI supply request stays a Boss negotiation

Player-initiated `supply_deal` from `NegotiationDialog` already runs through `processNegotiation` with the Boss roll (line 10489). Confirm the dialog opens supply_deal as Boss-scope (no capo selector); no behavior change.

### 5. AI ↔ AI supply deals → unchanged

## Files

- `src/hooks/useEnhancedMafiaGameState.ts` — split player-supplier branch (~6812–6892); add the supply_deal case to the Phase-gate exception in `boss_negotiate` if needed; thread `proposedDuration` through accept handler (line 8646) into the `supply_deal` case (line 10635).
- `src/types/game-mechanics.ts` — add `proposedDuration?: number` and `fromBossName?: string` on `IncomingSitdown`.
- `src/components/SitdownsPanel.tsx` — split incoming list into "Boss Sitdowns" and "Capo Sitdowns" subsections by `scope`; render Boss cards without capo/hex fields and with a Boss-tier accent.

## Out of scope

- Capo territory sitdown UX (untouched).
- AI↔AI deal balance.
- New negotiation modal — Boss accept reuses the existing path.

## Validation

- AI proposes supply deal → appears under **Boss Sitdowns** in the panel, never under Capo Sitdowns; no money moves yet.
- Accept → Boss negotiation roll runs; on success pact forms with the proposed duration and $7,500 lands; on failure 50% refund / no pact.
- Decline → +5 tension, no pact.
- Existing Capo territory sitdowns still render in their own subsection and route through capo negotiation.
- Player-initiated supply_deal still rolls through Boss negotiation.
- AI↔AI supply deals unchanged. All existing tests pass.
