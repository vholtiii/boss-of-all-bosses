

# Fix: Sync Boss Business List Income with Actual Financial Data

## Problem
The Boss Overview business list shows raw base income (`tile.business.income`) per business, while the Financial Overview shows actual computed income from `processEconomy`. These use completely different calculations:

- A $2,000 business with no unit on it earns only $200 (10% passive), but the Boss list says "$2,000/turn"
- Under-construction businesses show income in the Boss list but are excluded from financials
- Family bonuses and district multipliers are not reflected in per-business display

## Fix

### `src/pages/UltimateMafiaGame.tsx` (~line 954-963)
When building `hexBusinesses`, replicate the same income logic used in `processEconomy`:

1. **Skip under-construction businesses** — if `constructionProgress < constructionGoal`, set income to 0 or exclude them (but still show with a "🚧 Under Construction" label and $0 income)
2. **Apply collection modifier** — check if a capo, soldier, or nobody is on the hex:
   - Capo present → 100% of base income
   - Soldier only → 30%
   - Nobody → 10%
3. **Apply family bonuses** — `businessIncome`, `territoryIncome`, `income` bonuses from the player's family
4. **Apply district bonus** — Manhattan +20% if player controls the district
5. **Add a `baseIncome` field** so the UI can show both: "Base: $2,000 → Earning: $200 (no unit)"

### `src/components/HeadquartersInfoPanel.tsx` (~line 536-539)
Update the per-business income display to show the effective income, with an optional tooltip or subtitle showing why it differs from base (e.g., "10% — no unit present").

### Result
- Boss business list income will sum to match `finances.legalProfit + finances.illegalProfit` (before penalties)
- Players can see exactly why a business earns less than its base rate
- Under-construction businesses show clearly as $0 earning

## Files Modified
- `src/pages/UltimateMafiaGame.tsx` — compute effective income per hex-business using the same rules as `processEconomy`
- `src/components/HeadquartersInfoPanel.tsx` — display effective income with collection-rate context

