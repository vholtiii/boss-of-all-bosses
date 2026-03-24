

# Click Soldier Card in Capo Promotion to Highlight on Map

## Change
When clicking a soldier's card in the Capo Promotion panel, that soldier gets highlighted on the map (selected state with gold ring/pulse). This is info-only — no movement or action triggered.

## Implementation

### `src/components/CapoPromotionPanel.tsx`
- Add prop `onHighlightSoldier?: (unitId: string) => void`
- Add `onClick={() => onHighlightSoldier?.(s.id)}` to each soldier card div (line 90-96), with `cursor-pointer` class

### `src/components/GameSidePanels.tsx` (~line 464-475)
- Pass `onHighlightSoldier` to `CapoPromotionPanel` that finds the soldier's position from `gameState.deployedUnits` and calls `onSelectUnit('soldier', { q, r, s })` — reusing the existing unit selection mechanism which already triggers the gold highlight ring on the map

### `src/components/EnhancedMafiaHexGrid.tsx`
- No changes needed — the existing `selectedUnitId` + `SoldierIcon` already renders the gold pulse ring for selected units

## Files Modified
- `src/components/CapoPromotionPanel.tsx` — add callback prop + click handler on card
- `src/components/GameSidePanels.tsx` — wire callback to find unit position and call `onSelectUnit`

