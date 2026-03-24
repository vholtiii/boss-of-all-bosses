

# Plan Hit: Unit Selection Menu Flow

## Problem
Currently, clicking "Plan Hit" enters a map-based selection mode where the player must find and click their soldier on the map. The user wants a **popup menu listing all available soldiers** to appear immediately, then the selected soldier should be highlighted on the map while the player picks a target.

## Changes

### 1. Show Soldier Picker Dialog on Plan Hit — `src/pages/UltimateMafiaGame.tsx`

When `enter_plan_hit_mode` fires, instead of just setting `planHitMode=true` and waiting for a map click:
- Collect all deployed player soldiers from `gameState.deployedUnits`
- Set a new state `planHitSoldierMenu: DeployedUnit[]` containing the eligible soldiers
- Render a floating panel/dialog listing each soldier with name, location (district), and a "Select" button
- On selection: set `planHitPlannerId`, clear the menu, advance to `selectTarget` step, and highlight that soldier on the map

### 2. Highlight Selected Planner on Map — `src/components/EnhancedMafiaHexGrid.tsx`

During `planHitStep === 'selectTarget'`, use `planHitPlannerId` to find the planner's hex and render a distinct gold/green pulsing outline around that soldier's hex so the player knows where their planner is. This replaces the current step-1 green highlights on all soldier hexes (which become unnecessary since step 1 is now a menu).

### 3. Remove Map-Based Soldier Selection — `src/components/EnhancedMafiaHexGrid.tsx`

In `handleHexClick`, the `planHitStep === 'selectSoldier'` branch can be simplified — if the soldier menu is the primary selection method, map clicks during step 1 can either be disabled or serve as an alternative selection path.

### 4. Soldier Picker UI — `src/pages/UltimateMafiaGame.tsx`

Render a centered modal/card when `planHitSoldierMenu` is set:
- Title: "Select a Soldier for the Hit"
- List each soldier: name, district, moves remaining
- Click → selects that soldier, closes menu, enters target selection
- Cancel button → exits plan hit mode

## Files Modified
- `src/pages/UltimateMafiaGame.tsx` — add soldier picker state + modal, modify `enter_plan_hit_mode` handler
- `src/components/EnhancedMafiaHexGrid.tsx` — add planner hex highlight during target selection step, keep step-1 hex highlights as fallback

