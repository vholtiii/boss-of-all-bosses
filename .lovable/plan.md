

# Refine HQ Menu — Accurate, Complete, Up-to-Date Information

## Problems Found

1. **Businesses list uses legacy `gameState.businesses[]` array** — always empty since businesses are on hex tiles. The Boss Overview shows "Businesses (0)" and the bottom "Controlled Businesses" count is always 0.

2. **No total money balance shown** — the HQ panel shows income/expenses/dirty/clean but never shows the player's actual current cash balance (`resources.money`).

3. **Business income per-tile shown in Boss Overview uses legacy `biz.income`** — even if businesses were passed correctly, the income displayed per business would come from the legacy object, not the hex tile's computed income.

4. **Rival HQ click shows player finances** — `finances` is always the player's finances object, but the panel shows it for any family clicked (including rivals). Rival HQs should show rival-relevant info (soldier count, territory count) but NOT player finances.

5. **Territory count missing** — no display of how many hexes the family controls.

6. **Extorted businesses not distinguished** — hex businesses include both owned and extorted, but the panel doesn't differentiate.

## Changes

### `src/pages/UltimateMafiaGame.tsx`
- Build a `hexBusinesses` array from `gameState.hexMap` tiles where `controllingFamily === family && tile.business` exists — include `q, r, s, district, businessType, income, isLegal, isExtorted`
- Pass this as a new `hexBusinesses` prop instead of relying on legacy `businesses`
- Pass `totalMoney={gameState.resources.money}` prop
- Pass `territoryCount` (count of hexes controlled by this family)
- Only pass `finances` when the selected family is the player's family

### `src/components/HeadquartersInfoPanel.tsx`
- Add props: `hexBusinesses`, `totalMoney`, `territoryCount`
- **Financial Overview**: Add "Cash on Hand" box showing `totalMoney` (player only)
- **Businesses section** (Boss Overview): Use `hexBusinesses` instead of `familyBusinesses` from legacy array. Show business type, district, income, legal/illegal badge, and extorted badge
- **Controlled Businesses count**: Use `hexBusinesses.length`
- **Territory count**: Add a territory hex count display
- **Rival HQ**: Hide financial details (income/expenses/dirty/clean) for rival families. Show only unit counts, territory count, and business count
- Remove legacy `businesses` prop and all fallback calculations from legacy array

## Files Modified
- `src/pages/UltimateMafiaGame.tsx` — build hex business list, pass new props
- `src/components/HeadquartersInfoPanel.tsx` — use hex businesses, add cash balance, territory count, hide finances for rivals

