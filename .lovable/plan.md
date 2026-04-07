

# Supply Lines: Territory-Chain Routes with Visible Overlays

## Core Concept

Supply nodes are special hexes placed during map generation, randomized per game seed but following real-world NYC geography. A **supply route** is an unbroken chain of your controlled hexes from HQ to a supply node. Businesses without supply access suffer gradual income decay (-10%/turn, floor at **20% of max revenue**). Multiple routes to the same node provide redundancy — rivals must sever ALL paths.

## Supply Node Types & District Placement

```text
NODE TYPE          DISTRICT(S)            REAL-WORLD BASIS
──────────────────────────────────────────────────────────
Docks ⚓           Brooklyn, Staten Is.   Waterfront / port
Union Hall 🔧      Bronx, Queens          Labor / construction
Trucking Depot 🚛  Queens, Bronx          Freight corridors
Liquor Route 🍷    Manhattan              Speakeasy distribution
Food Market 🐟     Little Italy, Brooklyn Wholesale food
```

6 nodes total, 1 per type, neutral at start, no direct income (leverage only).

## Business Dependencies

| Business | Requires | Without Access (floor) |
|----------|----------|------------------------|
| Gambling Den 🎲 | Liquor Route 🍷 | 20% max revenue |
| Brothel 💋 | Trucking Depot 🚛 | 20% max revenue |
| Loan Sharking 💰 | Union Hall 🔧 | 20% max revenue |
| Store Front 🏪 | Food Market 🐟 OR Docks ⚓ | 20% max revenue |
| Construction 🏗️ | Union Hall 🔧 | 20% max revenue |

All businesses decay to the same **20% floor** — uniform and punishing.

## Route Mechanics

- **Connection**: BFS from HQ through controlled hexes. Reaching a supply node = active route.
- **Redundancy**: Multiple independent paths mean rivals must cut all of them.
- **Route breaking**: 2-turn stockpile buffer (warning only), then -10%/turn decay to 20% floor.
- **Reconnecting**: Restoring the chain instantly returns income to 100%.

## Map Visuals

- **Supply node hexes**: Distinct icon (⚓🔧🚛🍷🐟) with golden border
- **Active routes**: Subtle thin line along the hex chain, tinted to family color at ~20% opacity — visible but not distracting. Only shown when the route is live.
- **Severed routes**: Dashed red line with ⚠️ on the break point
- **Disrupted nodes**: Pulsing warning overlay

## Supply Deals & Sabotage (Phase 2-3, later)

- Negotiate access (10-20% income share) to bypass route requirement
- Sabotage action to disrupt a node for 2-3 turns

## Phase 1 Implementation

### `src/types/game-mechanics.ts`
- Add `SupplyNodeType`, `SupplyNode` interface, `SUPPLY_DEPENDENCIES` table
- Constants: `SUPPLY_DECAY_RATE = 0.10`, `SUPPLY_DECAY_FLOOR = 0.20`, `SUPPLY_STOCKPILE_BUFFER = 2`

### `src/hooks/useEnhancedMafiaGameState.ts`
- **Map init**: Place 6 supply nodes on random hexes within target districts (seeded)
- **HexTile**: Add optional `supplyNode?: SupplyNodeType`
- **Game state**: Add `supplyStockpile` tracker (turns since route broken, per node type per family)
- **Income calc**: BFS connectivity check → apply decay if no route, respecting buffer and 20% floor
- **End-of-turn**: Update stockpile timers, detect route breaks/restores, notify player

### `src/components/EnhancedMafiaHexGrid.tsx`
- Render supply node icons on hexes with golden border
- Draw subtle route overlay (thin semi-transparent line along BFS path) for active routes
- Severed route: dashed red line at break point

### `src/components/GameSidePanels.tsx`
- "Supply Lines" collapsible section: owned nodes, route status, at-risk businesses

## Files Modified
- `src/types/game-mechanics.ts`
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/components/EnhancedMafiaHexGrid.tsx`
- `src/components/GameSidePanels.tsx`

