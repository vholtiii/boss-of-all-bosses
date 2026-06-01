## Problem

When the player accepts an incoming **boss (family-scope) sitdown**, the negotiation dialog opens showing every possible boss-level deal (ceasefire, alliance, supply deal, etc.) instead of just the one the rival actually offered.

The territory-scope path already handles this correctly: `handleAcceptIncomingSitdown` passes `lockedDealType`/`proposedAmount`/`proposerLabel` into `negotiationState`, and `NegotiationDialog` filters down to that single deal via its existing `lockedDealType` prop (NegotiationDialog.tsx:61‑63). The bug is purely that the boss branch doesn't forward those fields.

## Fix

Two small edits, both in presentation code — no reducer/logic changes.

### 1. `src/pages/UltimateMafiaGame.tsx` — `handleAcceptIncomingSitdown` (≈ lines 366‑374)

In the `else` (family-scope) branch of the accept handler, forward the proposed deal and proposer info, same as the territory branch already does:

```ts
const fam = String(s.fromFamily || '');
const famLabel = fam.charAt(0).toUpperCase() + fam.slice(1);
setNegotiationState({
  open: true,
  scope: 'family',
  targetFamily: s.fromFamily,
  incomingSitdownId: s.id,
  successBonus: s.successBonus,
  lockedDealType: s.proposedDeal,
  proposedAmount: s.proposedAmount,     // may be undefined for ceasefire/alliance — fine
  proposerLabel: s.fromBossName
    ? `${s.fromBossName} (${famLabel})`
    : `${famLabel} Boss`,
});
```

### 2. `src/pages/UltimateMafiaGame.tsx` — boss `NegotiationDialog` mount (≈ lines 1979‑2016)

Pass the new fields through to the dialog, mirroring the territory mount:

```tsx
<NegotiationDialog
  ...existing props...
  lockedDealType={(negotiationState as any).lockedDealType}
  proposedAmount={(negotiationState as any).proposedAmount}
  proposerLabel={(negotiationState as any).proposerLabel}
/>
```

`availableEnemyFamilies` is already suppressed when `incomingSitdownId` is set, so the family picker stays hidden. `NegotiationDialog`'s existing `filteredTypes` logic will then render only the proposed deal, and the price/proposer header will reflect the rival's offer.

## Out of scope

- No changes to the reducer, AI, or deal-resolution logic.
- Territory-scope acceptance already works and is untouched.
- Outgoing/manual sitdowns still show the full picker as today.
