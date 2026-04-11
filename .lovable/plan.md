

# Clarify Hex Info Panel Labels

**File: `src/components/EnhancedMafiaHexGrid.tsx`**

1. Rename "Control:" label to "Owner:" in the hex info panel display (around line 1832)
2. Add district control percentage next to the district name header, calculated from `hexMap`

### Before:
```
Bronx
Control: COLOMBO
```

### After:
```
Bronx (12% controlled)
Owner: COLOMBO
```

Same calculation logic as previously planned — filter hexMap by district, count player-owned tiles, show percentage. Label simply says "Owner:" instead of "Hex Owner:".

