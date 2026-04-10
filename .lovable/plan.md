

# Add Supply Line Indicator to Boss Menu Businesses

## What
Add a small badge/icon next to each business in the Boss Overview's business list showing whether that business has an active supply line feeding it. Businesses with a connected supply node show a green "✓ Supply" badge; disconnected ones show an orange "⚠ No Supply" badge. Businesses with no dependency show nothing.

## Implementation

### 1. Extend `HexBusiness` interface (`HeadquartersInfoPanel.tsx`)
Add an optional `supplyStatus` field:
```ts
supplyConnected?: boolean;    // true = connected, false = disconnected
supplyDependency?: string;    // e.g. 'liquor_route', 'docks' — null if no dependency
```

### 2. Compute supply status when building `hexBusinesses` (`UltimateMafiaGame.tsx`)
Where `hexBusinesses` is constructed for the HQ panel, look up `SUPPLY_DEPENDENCIES[biz.type]` and check if the player's connected territory reaches any of the required supply nodes. Pass the result as `supplyConnected` and `supplyDependency` on each business entry.

### 3. Show badge in business list (`HeadquartersInfoPanel.tsx`, ~line 555-572)
After the existing "Built"/"Extorted" badges, add:
- **Connected**: green badge `✓ Supplied` (or just a small ✓ icon)
- **Disconnected**: orange/red badge `⚠ No Supply` with a tooltip showing which node is needed (e.g., "Needs: Liquor Route")
- **No dependency**: no badge shown

## Files Modified
- `src/components/HeadquartersInfoPanel.tsx` — extend `HexBusiness`, render supply badge
- `src/pages/UltimateMafiaGame.tsx` — compute `supplyConnected`/`supplyDependency` when building `hexBusinesses` array

