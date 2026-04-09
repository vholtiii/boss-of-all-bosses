

# Fix: Supply Nodes Incorrectly Showing "Connected" at Game Start

## Problem
At the start of the game, all supply nodes show as "Connected" in the side panel, and some may show route overlays on the map. Two bugs cause this:

1. **Side panel logic** (GameSidePanels.tsx line 742): `isConnected = isOwned || (!stockEntry)` — since `supplyStockpile` starts empty, `stockEntry` is always undefined, so `!stockEntry` is true for every node. All nodes appear "Connected."

2. **Map BFS** (EnhancedMafiaHexGrid.tsx line 635): All supply node hexes are added to `pHexSet` as valid BFS endpoints. If a supply node happened to be placed on a hex that was then claimed as starting territory (HQ neighbors get auto-claimed on lines 603-609), it shows a route overlay from turn 1.

## Fix

### `src/components/GameSidePanels.tsx`
**Replace the connection check** (line 742). Instead of relying on the absence of a stockpile entry, perform actual BFS connectivity or use the same `getConnectedTerritory` approach:

- A node is "Connected" only if there's an unbroken chain of player-controlled hexes from HQ to the node hex (BFS check), OR if the node hex itself is player-owned and adjacent to player territory.
- Simplest approach: compute `connectedNodeTypes` using the same BFS logic already used in the income calculation (lines 2795-2802), and pass it through to the side panel via the game state or a computed property.

### `src/hooks/useEnhancedMafiaGameState.ts`
**Add a computed field** to the game state (or the return value of the hook) that exposes `connectedSupplyNodeTypes: Set<SupplyNodeType>` — computed from BFS each render. This single source of truth will be used by both the side panel and the map.

### `src/components/EnhancedMafiaHexGrid.tsx`
**Tighten the BFS endpoint logic** (line 635): Only add a supply node hex to `pHexSet` if at least one of its neighbors is player-controlled. This prevents showing route overlays to completely unreachable nodes.

### `src/hooks/useEnhancedMafiaGameState.ts` (supply node placement)
**Exclude HQ-adjacent hexes** from supply node candidates (line 579). Add a check that filters out hexes within range 1 of any HQ position. This prevents supply nodes from spawning inside starting territories, which would make them trivially "connected" from turn 1.

## Summary of Changes
| File | Change |
|------|--------|
| `useEnhancedMafiaGameState.ts` | Expose `connectedSupplyNodeTypes` via BFS; exclude HQ-adjacent hexes from node placement |
| `GameSidePanels.tsx` | Use `connectedSupplyNodeTypes` instead of stockpile-absence logic |
| `EnhancedMafiaHexGrid.tsx` | Only add supply nodes to BFS set if they have a player-controlled neighbor |

