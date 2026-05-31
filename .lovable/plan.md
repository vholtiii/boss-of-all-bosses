# Clarify Supply-Deal Direction Everywhere

Audit of every surface that mentions a supply deal so it's always obvious **who is supplying whom** and **which way money flows**. Most surfaces are already correct; a few are ambiguous.

## Current state (audit)

| Surface | File:Line | Direction clear? |
|---|---|---|
| Incoming sitdown card (rival → player) | `SitdownsPanel.tsx:88-106` | ⚠️ Money chips show `+$X` vs `$X`, but no plain-language "they want YOUR supply" header |
| Accept-as-supplier confirmation toast | `useEnhancedMafiaGameState.ts:9138` | ✅ "X paid you $Y up front + Z% royalty" |
| Player-initiated buyer toast | `useEnhancedMafiaGameState.ts:11583` | ✅ "Access to X's supply lines, $Y paid to X" |
| Per-turn royalty income toast | `useEnhancedMafiaGameState.ts:5963` | ✅ "X paid you $Y this turn from your supply deal" |
| AI ↔ AI supply deal toast | `useEnhancedMafiaGameState.ts:7226` | ✅ neutral third-party phrasing |
| **Expiring next turn** toast | `useEnhancedMafiaGameState.ts:3113` | ❌ Doesn't say if you were buyer or seller |
| **Expired** toast | `useEnhancedMafiaGameState.ts:11901` | ❌ Same — no direction |
| Top-bar pact chip | `UltimateMafiaGame.tsx:1486-1494` | ⚠️ Has "(buying)/(selling)" suffix but money-flow direction not visually distinct |
| HQ "Active Supply Deals" card | `GameSidePanels.tsx:1492-1513` | ⚠️ Shows "Buying"/"Selling" badge but no lump sum / royalty rate when player is supplier |
| Outgoing NegotiationDialog (supply_deal) | `NegotiationDialog.tsx` | ✅ Player-as-buyer only; button says "Offer $X & Roll" |

## Changes

### 1. `src/components/SitdownsPanel.tsx`
Add a one-line role banner inside the incoming card, above the deal label, when `s.proposedDeal === 'supply_deal'`:
- `playerIsSupplier === true`: pill `"📦 They want YOUR supply"` (emerald bg)
- otherwise: pill `"🛒 They're offering supply"` (amber bg)

Also relabel the lump-sum money chip:
- supplier: `"+$X up front (from them)"`
- buyer: `"You pay $X"` (replaces the current bare `$X` outline badge)

### 2. `src/hooks/useEnhancedMafiaGameState.ts` — expiring/expired notifications
At lines ~3109-3117 (expiring) and ~11890-11908 (expired): branch on `isPlayerBuyer` / `isPlayerSeller` and use directional copy.

Expiring:
- buyer: `"⏳ Your supply access from {Fam} expires next turn."`
- supplier: `"⏳ {Fam}'s royalty payments to you end next turn."`

Expired:
- buyer: `"🚚 Lost supply access from {Fam}. Tension +N."`
- supplier: `"🚚 {Fam} no longer owes you royalties. Tension +N."`

### 3. `src/pages/UltimateMafiaGame.tsx` — top-bar pact chip (~line 1486)
Make money-flow direction visually obvious:
- buyer (player pays): amber chip, arrow `→` toward the family — `🚚 → Genovese (3t)`
- supplier (player earns): emerald chip, arrow `←` — `🚚 ← Genovese +15% (3t)` (include royalty rate when supplier)

Update the `tooltip`/`title` to say `"Buying supply from X — $Y paid"` or `"Supplying X — earning Z% royalty"`.

### 4. `src/components/GameSidePanels.tsx` — HQ Active Supply Deals (~line 1492)
When `!isPlayerBuyer` (player is supplier), append a second line under the family label:
- `"💵 +${deal.lumpSum.toLocaleString()} up front · +{Math.round(deal.royaltyRate*100)}% royalty / turn"` (emerald text)

When `isPlayerBuyer`, append:
- `"💸 You bought supply access"` (amber text)

Swap the "Buying / Selling" badge color: emerald for Selling (income), amber for Buying (expense), so colors match the money direction used elsewhere.

### 5. Expiring-pact HUD list (`UltimateMafiaGame.tsx:844-848`)
Change the `label` to reflect direction:
- buyer: `"Buying from {Fam}"`
- supplier: `"Supplying {Fam}"`

## Out of scope
- No new gameplay mechanics, no balance changes.
- No changes to AI ↔ AI supply deal flow (already neutral).
- No NegotiationDialog changes — the supplier-direction path bypasses the dialog and is handled in SitdownsPanel.
- No new tests; existing `negotiation-fairness.test.ts` cases still pass (pure copy/UI changes).

## Files touched
- `src/components/SitdownsPanel.tsx`
- `src/components/GameSidePanels.tsx`
- `src/hooks/useEnhancedMafiaGameState.ts` (two notification blocks only)
- `src/pages/UltimateMafiaGame.tsx` (pact chip + expiring-pact label)
