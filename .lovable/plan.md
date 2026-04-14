

# Flip Soldier Rework — Remaining 5 Items

## 1. Target Selection UI (`EnhancedMafiaHexGrid.tsx`)
Instead of randomly picking a target when clicking "Flip Soldier", show a picker popup (reuse the `planHitUnitMenu` pattern):
- New state: `flipTargetMenu` with tile, acting capo, and eligible enemy soldiers
- Clicking "🐀 Flip Soldier (Capo)" opens the picker instead of dispatching immediately
- Each target row shows: soldier name, loyalty bar (color-coded), success chance %, and cost
- Clicking a target dispatches `flip_soldier` with `targetUnitId` added to the action payload
- Cancel button to dismiss

## 2. Escalating Cost (`game-mechanics.ts` + `useEnhancedMafiaGameState.ts`)
- Add constants: `FLIP_SOLDIER_BASE_COST = 5000`, `FLIP_SOLDIER_COST_ESCALATION = 3000`
- Rename existing `FLIP_SOLDIER_COST` to `FLIP_SOLDIER_BASE_COST` or replace usage
- Cost formula: `base + (currentFlippedCount * escalation)` — $5K, $8K, $11K...
- Update `processFlipSoldier` to compute dynamic cost
- Update AI flip logic to use dynamic cost
- Show current cost in the context menu label and target picker

## 3. Counter-Intel Discovery (`useEnhancedMafiaGameState.ts`)
- In turn processing (alongside cop flip processing), iterate player-flipped soldiers (`flippedSoldiers`)
- Each has `COP_FLIP_DISCOVERY_CHANCE` (8%) per turn of being discovered
- If discovered: remove from `flippedSoldiers`, remove unit from `deployedUnits`, push notification
- Apply to AI-flipped soldiers too (symmetric)

## 4. Rat Icon on Map (`EnhancedMafiaHexGrid.tsx`)
- After rendering each soldier group, check if any soldier in that group is in the player's `flippedSoldiers`
- If yes, render a small 🐀 text element offset below-right of the soldier icon (opacity 0.7)
- Only visible for soldiers flipped BY the player (not visible on the player's own compromised soldiers)

## 5. HQ Tracking Panel (`HeadquartersInfoPanel.tsx`)
- Add `flippedSoldiers` to props
- When viewing an enemy HQ, show a "🐀 Flipped Assets" section
- Display count of flipped soldiers at that HQ and cumulative defense reduction (count x 10%)
- Show "No assets" in muted text when zero

## Files Changed
1. `src/types/game-mechanics.ts` — Add escalation constant, keep base cost
2. `src/hooks/useEnhancedMafiaGameState.ts` — Escalating cost, counter-intel discovery in turn processing, accept `targetUnitId` in flip action
3. `src/components/EnhancedMafiaHexGrid.tsx` — Target picker popup, rat icon overlay, updated flip button to open picker with cost display
4. `src/components/HeadquartersInfoPanel.tsx` — Flipped Assets section in enemy HQ view

