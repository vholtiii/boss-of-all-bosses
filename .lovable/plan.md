## D1 — AI capos send word for territory deals + E3 — Persistent Sitdowns sidebar minicard

### D1 — AI-initiated territory sitdowns

**Goal**: each AI turn (Phase 2+), each AI capo has a low chance to push an `IncomingSitdown` proposing a deal on a *specific player hex* (territory scope), mirroring the player's Send Word path.

**Type changes** (`src/types/game-mechanics.ts`):
- Extend `IncomingSitdown.proposedDeal` to include `'bribe_territory' | 'share_profits'`.
- Add optional fields used only for territory-scoped proposals:
  - `scope?: 'family' | 'territory'` (default `'family'` for backward compat with saves)
  - `targetQ?: number; targetR?: number; targetS?: number`
  - `fromCapoId?: string; fromCapoName?: string; fromCapoPersonality?: CapoPersonality`
  - `proposedAmount?: number` (snapshot of the bribe / share offer at request time, so the player sees the same number they'll get)

**AI generation** (`useEnhancedMafiaGameState.ts` ~L6185 block, after the existing family-scope diplomacy):
- For each living AI capo of family `fam` (skip jailed/wounded):
  - Gate: `aiPhase >= 2`, no active war with player, no existing IncomingSitdown from this capo, capo not on diplomacy cooldown.
  - Per-capo trigger probability ~5% baseline, modified by personality (`diplomatic` ×2, `opportunistic` ×1.5, `aggressive` ×0.5, `defensive` ×1, `unpredictable` ×1).
  - Candidate hex selection: scan player-controlled hexes within Manhattan distance ≤ 6 of the capo. Score = `business.income × 1.0 + (lowGarrisonBonus) − (fortifiedPenalty) − (safehousePenalty if known)`. `lowGarrisonBonus = +50` if 0 player units on hex, `+20` if 1, `0` if 2. `fortifiedPenalty = 40`. Pick the top candidate; skip if score ≤ 0.
  - Choose deal type by personality: `enforcer`/`aggressive` → `bribe_territory`; `diplomat`/`schemer` → 50/50 `share_profits` vs `bribe_territory`; default → `share_profits`.
  - Compute `proposedAmount` using the same formulas the player sees:
    - `bribe_territory`: `baseCost + enemyStrength*2000 + hexIncome` (here `enemyStrength` = friendly units on the hex from the AI's perspective, so use player-unit count on that hex).
    - `share_profits`: fixed `baseCost` ($3,000) — income share is fixed at 30% for 5 turns.
  - `successBonus = 15` (matches existing convention — "they asked you").
  - `expiresOnTurn = state.turn + 2`.
  - Push the sitdown, fire a notification ("📩 {Capo} ({Family}) wants to talk about your hex at (q,r)"), append to `combatLog`.
- Hard cap: at most 1 territory-scope incoming per AI family at a time, and total incoming sitdowns from that family ≤ 2 (so D1 doesn't spam over the existing family-scope pipeline).

**Acceptance routing** (`accept_incoming_sitdown` handler, ~L7959):
- If `sitdown.scope === 'territory'`, do NOT route through `boss_negotiate`. Instead route through the territory negotiation path (the same one Send Word resolves into) using `targetFamily = sitdown.fromFamily`, `targetQ/R/S = sitdown.targetQ/R/S`, `negotiationType = sitdown.proposedDeal`, `successBonus = sitdown.successBonus`, and snap the cost to `sitdown.proposedAmount` so the player can't be surprised by a higher number at accept time.
- Decline behavior unchanged (+5 tension), but the message references the specific hex.

**Dialog** (`NegotiationDialog.tsx`):
- When invoked from a territory-scope incoming sitdown, force `scope = 'territory'`, lock `selectedType` to `sitdown.proposedDeal` (skip the picker, jump straight to the dice-roll), display the AI capo name + personality icon as the proposer, and show the locked-in `proposedAmount`.
- Cost override: if `proposedAmount` is provided, `getCost()` returns it verbatim.

**Auto-invalidation**: in the end-of-turn lifecycle (~L2948 incoming sitdowns block), drop any territory-scope incoming where the target hex is no longer player-controlled or the originating AI capo is dead/jailed — push a "Sitdown Withdrawn" notification, no tension hit (the situation that caused it dissolved).

### E3 — Persistent "Sitdowns" minicard in the right sidebar

**Goal**: a single always-visible card listing every pending/ready outgoing negotiation AND every incoming sitdown, with one-click open. Replaces the dependency on the top-bar chip for spotting ready entries.

**Component**: new `src/components/SitdownsPanel.tsx`, mounted in the right sidebar via `GameSidePanels.tsx`. Default state follows the existing right-sidebar default-collapsed memory rule.

**Sections** (only render the section header if it has rows, hide the whole card if both are empty):

1. **Outgoing — Ready** (yellow accent): one row per `pendingNegotiations[i]` where `ready === true`. Row shows: capo name + personality icon, target family + hex `(q,r)`, computed expected odds and snapshot bribe/share cost (uses the same formula as `NegotiationDialog.getSuccessChance` / `getCost` extracted into `src/lib/negotiation-odds.ts`), and an "Open Negotiation" button that dispatches the same action as today's "Sit Down" button (sets `negotiationState` with `pendingNegotiationId`, hex coords, enemy family).
2. **Outgoing — Pending** (muted): rows where `ready === false`, showing "Word in transit — ready next turn" + capo + target.
3. **Incoming** (gold accent): one row per `incomingSitdowns[i]`. Row shows: from-family (and from-capo if territory scope), proposed deal label + icon, target hex (territory scope only), `proposedAmount` if present, success bonus badge, turns-until-expiry badge ("expires in N"). Buttons: "Accept" (opens the dialog with `incomingSitdownId`) and "Decline" (dispatches `decline_incoming_sitdown` immediately with a confirm tooltip about +5 tension).

**Behavior**:
- Card auto-expands when a new ready entry or new incoming arrives (one-shot, then user can re-collapse).
- Each row clickable to focus the relevant hex on the map (re-uses existing focus-hex helper used by the threat board / pending claims if present; otherwise just opens the dialog).
- The existing top-bar chip stays for at-a-glance count, but its job becomes redundant for actually opening sitdowns — that's now in the sidebar minicard.

**Files touched**:
- `src/types/game-mechanics.ts` — extend `IncomingSitdown`.
- `src/hooks/useEnhancedMafiaGameState.ts` — AI capo sitdown generator, territory-scope acceptance routing, lifecycle invalidation.
- `src/components/NegotiationDialog.tsx` — territory-incoming mode (locked type + amount).
- `src/components/SitdownsPanel.tsx` — new.
- `src/components/GameSidePanels.tsx` — mount the panel.
- `src/lib/negotiation-odds.ts` — new shared util for odds + cost (consumed by dialog and panel).
- `src/pages/UltimateMafiaGame.tsx` — wire the panel's "Open Negotiation" / "Accept" / "Decline" callbacks to existing `negotiationState` / dispatch flow.
- `src/hooks/__tests__/ai-territory-sitdown.test.ts` — new tests covering: AI proposal generation respects phase + cap + scoring; accept routes to territory negotiation with correct hex; decline still adds tension; lifecycle invalidation when hex flips or capo dies.

**Memory updates**:
- New: `mem://gameplay/negotiation-mechanics/ai-territory-sitdowns` describing D1 trigger rules, scope, and acceptance flow.
- New: `mem://ui/sitdowns-panel` describing the right-sidebar minicard.
- Amend: `mem://ui/negotiation-interface` to reference the minicard as the primary entry point.

### Out of scope

- A1 (auto-invalidate stale outgoing pendings), A2 (odds tooltips on the top-bar chip), B1 (per-capo / per-family caps on player Send Word), and any cooldown/tension/proximity tweaks — saved for follow-up.
- Personality-flavored dialogue copy (#8) — separate plan.
