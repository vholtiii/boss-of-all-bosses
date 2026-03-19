

# Fix Broken Mechanics: Actions, Unit Selection, and Tactical Descriptions

## Problems Identified

1. **Soldiers cannot reach enemy hexes** — Line 695-696 in `useEnhancedMafiaGameState.ts` blocks soldiers from moving onto enemy-controlled territory during Deploy. This means Hit and Sabotage (which require soldiers ON the enemy hex) are impossible.

2. **Units at player HQ are invisible during Deploy** — Lines 491-493 in `EnhancedMafiaHexGrid.tsx` intentionally render nothing for units at the player's HQ during deploy phase. You can't see or click your units to select them for movement.

3. **Action phase doesn't let you select a unit first** — The action context menu (lines 269-299) just checks if ANY player units are on a hex and shows buttons. There's no way to pick WHICH unit performs the action. For Hit/Extort/Claim, the player should click a unit first, then see valid target hexes highlighted, then click a target.

4. **Tactical action descriptions are tooltips only** — The tactical buttons (Scout, Fortify, Escort, Safehouse) only have `title` attributes (hover tooltips). No visible description panel explains what each action does.

---

## Fix Plan

### Step 1: Let soldiers move onto enemy hexes
In `useEnhancedMafiaGameState.ts`, remove the filter on lines 695-696 that blocks soldiers from entering enemy-controlled territory. Soldiers need to reach enemy hexes to perform Hit actions.

### Step 2: Show units at HQ during Deploy phase
In `EnhancedMafiaHexGrid.tsx`, remove the `isDeployAtHQ` empty block (lines 491-494). Units at HQ should render normally so players can click them to select and move.

### Step 3: Add unit-first selection for Action phase
Currently: click hex → see action menu. 
New flow: during Action phase, clicking a player unit selects it and highlights valid target hexes (enemy hexes for Hit/Sabotage, neutral for Extort/Claim, owned for Safehouse). Clicking a highlighted hex then shows the relevant action menu filtered to that unit.

Changes:
- **`useEnhancedMafiaGameState.ts`**: Allow `selectUnit` to work during `action` phase. Calculate valid action target hexes based on unit type (soldiers: adjacent enemy/neutral hexes; capos: adjacent enemy for negotiate).
- **`EnhancedMafiaHexGrid.tsx`**: In the action phase click handler, if no unit is selected yet, select the unit (call `onSelectUnit`). If a unit IS selected and user clicks a highlighted target hex, show the filtered action menu. Add visual highlight for the selected unit during action phase.

### Step 4: Add tactical action description panel
In `UltimateMafiaGame.tsx`, add a small info panel below the tactical action toolbar (visible during Tactical phase) that shows the description of the currently selected tactical action. When no action is selected, show a summary of all four actions.

```text
Descriptions:
- Scout: Select a soldier, then click an adjacent enemy hex to reveal unit count and fortification status for 3 turns.
- Fortify: Select a unit to skip its movement for +25% defense bonus this turn.
- Escort: Select a capo to carry up to 2 soldiers when it moves.
- Safehouse: Select a capo on your territory to establish a secondary deploy point lasting 5 turns.
```

### Step 5: Extort should also work on enemy hexes with businesses
Currently `canExtort` only checks neutral hexes (line 282). Extortion should also be available on enemy hexes that have businesses (different success rate). Update `processTerritoryExtortion` to handle enemy hexes with lower success chance (~50%) and without claiming territory — just stealing income.

---

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — Steps 1, 3, 5
- `src/components/EnhancedMafiaHexGrid.tsx` — Steps 2, 3
- `src/pages/UltimateMafiaGame.tsx` — Step 4

