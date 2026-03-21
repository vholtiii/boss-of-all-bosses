

# Build Legal Business System

## Overview
Add a functional "Build Business" action that lets the player construct legal businesses (Construction, Restaurant, Store) on their owned hexes. These take 3 turns to complete, show icons with a blue outline on the hex map, and generate legitimate income.

## Business Types & Costs

| Type | Icon | Cost | Income/Turn | Laundering Capacity |
|---|---|---|---|---|
| Restaurant | 🍝 | $20,000 | $3,000 | $2,000 |
| Store | 🏪 | $12,000 | $1,800 | $1,500 |
| Construction | 🏗️ | $35,000 | $5,000 | $4,000 |

## Changes

### 1. `src/hooks/useEnhancedMafiaGameState.ts` — HexTile interface
- Add `turnsUntilComplete?: number` to the `business` object on HexTile to track the 3-turn build timer

### 2. `src/hooks/useEnhancedMafiaGameState.ts` — Add `build_business` handler
- New action handler triggered from side panel or hex context menu
- Requires: player-owned hex with no existing business selected, enough money, action phase
- Flow: deducts cost, sets `tile.business = { type, income: 0, isLegal: true, heatLevel: 0, launderingCapacity, turnsUntilComplete: 3 }`
- While `turnsUntilComplete > 0`, income is 0 (under construction)

### 3. `src/hooks/useEnhancedMafiaGameState.ts` — Turn processing
- In `processEconomy` or end-of-turn: decrement `turnsUntilComplete` for all businesses where it's > 0; when it hits 0, set full income

### 4. `src/components/GameSidePanels.tsx` — Replace single button with 3 options
- Replace the generic "Build Business $25,000" button with three buttons:
  - 🍝 Restaurant ($20K)
  - 🏪 Store ($12K)
  - 🏗️ Construction ($35K)
- Each dispatches `{ type: 'build_business', businessType: 'restaurant'|'store'|'construction' }` with the selected hex
- Disabled if no owned hex is selected or hex already has a business

### 5. `src/components/EnhancedMafiaHexGrid.tsx` — Blue outline for legal businesses
- When rendering a hex with `tile.business?.isLegal === true`, add a blue stroke/outline to distinguish from illegal businesses
- Show a construction icon or progress indicator while `turnsUntilComplete > 0` (e.g., 🚧 with "2 turns" label)
- Add `restaurant: '🍝'`, `store: '🏪'`, `construction: '🏗️'` to `businessIcons` (restaurant and construction already exist)

### 6. `src/components/EnhancedMafiaHexGrid.tsx` — Hex context menu
- Add "Build Business" submenu option when right-clicking/interacting with an owned hex that has no business, offering the 3 types

## Technical Details
- The `turnsUntilComplete` field is optional — existing businesses (generated at map creation) won't have it
- During construction, the hex shows 🚧 instead of the final business icon
- Legal businesses generate 0 heat and provide laundering capacity for dirty money
- The blue outline uses `stroke="#3B82F6"` (Tailwind blue-500) with `strokeWidth={2.5}` on the hex polygon

