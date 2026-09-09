# Rackets: make buying out clearly pay, and put twice as many on the map

## What's wrong today

An extorted racket pays a fat monthly tribute (roughly $2,000–$3,900 depending on the
place and the map roll). Buying it out turns it into a **Tier 1** building, which earns
only $700–$1,300 a month. So paying a lump sum to own the place actually *cuts* your
income — the opposite of what it should feel like.

There are also very few of them to fight over at the start: 3 on a small map, 4 on
medium, 5 on large.

## The fix

**1. Buying out is a clear step up**

```text
EXTORT   -> you take a cut of someone else's business (about half of what it earns)
BUY OUT  -> the place is yours: it becomes a Tier 2 building earning roughly double the tribute
UPGRADE  -> Tier 3, the top earner
```

- Tribute is rebalanced to read as a *cut*: about 45–55% of what the place earns when
  you own it outright (still varying by map roll, so no two maps are identical).
- A buy-out now hands you a **Tier 2** building of that type instead of Tier 1 — roughly
  double the monthly cash, plus the things tribute never gave you: crew growth from the
  block, laundering capacity, heat cover, and the Tier 3 upgrade path.
- Buy-out price is rescaled to sit against the value you get (a little above what it
  would cost to build the place to Tier 2 yourself), so it stays a real decision, and it
  pays back in a handful of months rather than never.
- The block panel and City Panel show the comparison directly: "Tribute now $X/mo →
  Owned $Y/mo", so the profit difference is visible before you spend.

**2. Twice as many rackets at the start**

- Anchor counts double: small 6, medium 8, large 10.
- Minimum spacing between rackets is reduced proportionally (small 4, medium 6, large 8)
  so twice as many still fit spread across the board without clustering. HQ exclusion and
  the per-seed randomised placement stay as they are.
- The name pools per racket type are widened so a map with 10 rackets doesn't run out of
  distinct names.

## Technical notes

- `src/types/game-mechanics.ts`: retune `ANCHOR_ARCHETYPES.tribute` against each type's
  Tier 2 income; `ANCHOR_COUNT_BY_MAP_SIZE` → 6/8/10; `ANCHOR_MIN_SPACING_BY_MAP_SIZE` →
  4/6/8 (fallback 6); adjust `ANCHOR_BUYOUT_MULTIPLIER` for the new tribute scale; add
  extra archetype names.
- `buyOutAnchor` in `useEnhancedMafiaGameState.ts` sets the building tier to 2 rather
  than 1 (never downgrading an existing higher tier).
- `TileDevelopmentPanel.tsx` and `CityPanel.tsx` gain the tribute-vs-owned income
  comparison line on the buy-out control.
- Rival AI valuation of anchors already reads `anchor.tribute`, so it follows the new
  numbers automatically; AI buy-out preference is checked so rivals also treat owning as
  the better outcome.
- Existing saves keep their rolled tribute values; only new maps use the new scale.

## Scope guards

- Extort mechanics, garrison gating, heat, respect, combat and diplomacy unchanged.
- No change to victory conditions or the building/standing-order systems themselves.
