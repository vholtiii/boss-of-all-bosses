## Problem

When you're the supplier (the AI is buying your supply) and you click **Counter**, the input pre-fills with a value that's *lower* than the rival's offer — even though the helper text says *"Counter — ask for a larger lump sum"*. If you hit **Send** without editing, you've effectively countered with **less than the original**, the AI re-counters at the midpoint (also below original), and the new "Accept" card shows that lower number. That reads as *"the deal shows the original payment offer, not my new counter."*

The pre-fill is hard-coded at 70% of the current `proposedAmount` regardless of which side of the table you're on:

```ts
// src/components/SitdownsPanel.tsx:29
const defaultCounter = Math.max(2000, Math.round(((s.proposedAmount || 7500) * 0.7) / 500) * 500);
```

The reducer's accept branch (`counter_supply_sitdown`, useEnhancedMafiaGameState.ts:9407) does correctly overwrite `proposedAmount` with the counter you actually sent — the bug is purely the default the UI seeds, plus the missing reminder of what the rival's original number was once a new card appears.

## Fix

Two small UI-only edits in `src/components/SitdownsPanel.tsx`.

### 1. Direction-aware counter default (`CounterableSitdownCard`, ~line 29)

Seed the input on the side of the table that matches the prompt:

```ts
const counterMultiplier = s.playerIsSupplier ? 1.3 : 0.7;
const defaultCounter = Math.max(
  2000,
  Math.round(((s.proposedAmount || 7500) * counterMultiplier) / 500) * 500
);
```

- **Supplier (AI buying from you)** → defaults to **1.3×** the offer (asking for more, matching "ask for a larger lump sum").
- **Buyer (you paying)** → keeps the existing 0.7× lowball default.

### 2. Show the rival's previous number on the new card (~line 100–110)

Once the AI accepts the counter or re-counters, the card only shows the new `proposedAmount`. Add a tiny "was $X" hint when `originalPrice` differs, so the new agreed/re-countered price is unmistakable:

```tsx
{typeof s.proposedAmount === 'number' && (
  s.playerIsSupplier ? (
    <Badge className="text-[10px] h-4 bg-emerald-600/90 text-white">
      +${s.proposedAmount.toLocaleString()} up front (from them)
    </Badge>
  ) : (
    <Badge className="text-[10px] h-4 bg-amber-600/80 text-white">
      You pay ${s.proposedAmount.toLocaleString()}
    </Badge>
  )
)}
{typeof s.originalPrice === 'number'
  && s.originalPrice !== s.proposedAmount && (
  <span className="text-[9px] text-muted-foreground italic">
    was ${s.originalPrice.toLocaleString()}
  </span>
)}
```

This makes the "FINAL OFFER" re-counter case (AI pushes back at the midpoint between your counter and their original) obviously a *new* number, and confirms when the AI fully accepted your counter that the card reflects the price you asked for.

## Out of scope

- No reducer / AI / pricing logic changes.
- No change to swing bands or accept/recounter/walk thresholds.
- Buyer-direction counter UX stays identical.
