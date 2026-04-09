

# Safehouse Inventory Stockpiling System (Revised Connection Logic)

## Key Change: Sub-Route Connection
Safehouses no longer need to sit directly on a supply route. Two connection modes:

1. **Auto-connect**: If the safehouse hex is adjacent to or on the BFS supply route path, it connects automatically — no player action needed
2. **Manual sub-route**: If the safehouse is anywhere else but has an unbroken hex chain of owned/claimed territory linking it to any hex on an active supply route, the player can click "Establish Stockpile Route" to manually connect it. This creates a visible sub-route (thinner dashed line branching off the main supply line to the safehouse)

Once connected (either way), the safehouse begins stockpiling based on the player's allocation slider.

## Subtle Player-Only Indicators
- **Connected glow**: Soft white pulse ring around safehouse icon (only visible to owning player)
- **Stockpiling dots**: Tiny animated dots per supply type being stockpiled (player-only)
- **Sub-route line**: Thin dashed grey line from main supply route to safehouse (player-only, hidden from rivals)

## Core Mechanics (Unchanged from Previous Plan)
- **Capacity**: 5 units per supply type per safehouse
- **Allocation**: Player-configurable 0-50% slider; higher = faster fill, less current income
- **Release**: Manual — player chooses when to tap reserves per supply type
- **Capture**: Enemy seizes ALL stored inventory

## Technical Changes

### `src/types/game-mechanics.ts`
- Extend `Safehouse` interface: `stockpile`, `allocationPercent`, `connectedSupplyTypes`, `manualRouteEstablished: boolean`
- Constants: `SAFEHOUSE_MAX_STOCKPILE = 5`, `SAFEHOUSE_MAX_ALLOCATION = 50`

### `src/hooks/useEnhancedMafiaGameState.ts`
- Per-turn BFS: check if safehouse hex is adjacent to any supply route hex → auto-connect
- For non-adjacent safehouses: run secondary BFS from safehouse hex through owned territory to any supply route hex → if path exists, enable "Establish Stockpile Route" action
- New action: `establishSafehouseRoute(safehouseId)` — sets `manualRouteEstablished = true`, stores the sub-route path for rendering
- Stockpile accumulation, income reduction, manual release, and capture transfer logic (same as before)
- If territory chain breaks (hex lost), sub-route severs and stockpiling stops

### `src/components/EnhancedMafiaHexGrid.tsx`
- Render sub-route lines (thin dashed grey) for manually established routes — player-family only
- Subtle glow + animated dots on connected safehouses — player-family only

### `src/components/GameSidePanels.tsx`
- Per safehouse: connection status, "Establish Stockpile Route" button (when eligible), allocation slider, fill bars, release buttons
- Show which supply types are flowing and current stockpile levels

## Files Modified
- `src/types/game-mechanics.ts`
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/components/EnhancedMafiaHexGrid.tsx`
- `src/components/GameSidePanels.tsx`

