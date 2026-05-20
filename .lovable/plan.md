# Move Bribe Police / Corruption to the Tactical Step

Reclassify the 4-tier Corruption bribes (Patrol Officer, Police Captain, Police Chief, Mayor) from an **Action**-step spend to a **Tactical**-step spend. Players will be able to grease palms during the prep step and then act in the same turn with reduced heat — directly addressing AI/player heat pressure without adding new mechanics.

Out of scope: bribe costs, success formulas, phase-unlock gates (Patrol = Phase 2, Captain+ = Phase 3), duration/effects, AI bribe behavior (AI already spends outside the player action budget), and the legacy `bribe_official` / event-choice `bribe` options.

## What changes for the player

- The Corruption panel becomes usable during the **Tactical** step instead of the Action step.
- Bribing now consumes **1 tactical action** (same budget as Scout, Fortify, Safehouse, family powers) instead of 1 action.
- Lock/unlock copy updates: button now reads "Tactical step" when in Deploy or Action, "No tactical actions" when the tactical budget is empty.
- Target-selection, tier list, success %, costs, and active-contract display are unchanged.

## Technical changes

1. **`src/components/GameSidePanels.tsx`** — at the `CorruptionPanel` mount (~line 860):
   - Replace `phaseIsAction={phase === 'action'}` with a new `phaseIsTactical={phase === 'move'}` prop.
   - Replace `actionsRemaining={gameState.actionsRemaining}` with `actionsRemaining={gameState.tacticalActionsRemaining}`.

2. **`src/components/CorruptionPanel.tsx`**:
   - Rename prop `phaseIsAction` → `phaseIsTactical` (keep default `true` for safety).
   - Update disabled-button title/label copy: "Available in Tactical step" / "Tactical step" instead of Action variants.
   - No layout or styling changes.

3. **`src/hooks/useEnhancedMafiaGameState.ts`** — `bribe_corruption` handler (~lines 7803 and 8368–8429):
   - Remove `'bribe_corruption'` from the `actionPhaseActions` array (line 7803) so it no longer requires `actionsRemaining`.
   - Add a tactical-budget guard at the top of the `bribe_corruption` case: if `tacticalActionsRemaining <= 0`, push a "No Tactical Actions" notification and return.
   - Replace `newState.actionsRemaining = Math.max(0, newState.actionsRemaining - 1)` (line 8394) with `newState.tacticalActionsRemaining = Math.max(0, newState.tacticalActionsRemaining - 1)`.
   - Keep the existing phase-gate checks, cost deduction, success roll, and effects exactly as-is. The spend must occur whether the bribe succeeds or fails (matches current behavior).

4. **Memory update** — append a one-liner to `mem://gameplay/turn-structure` (or add a new memory) noting that Corruption bribes are a tactical-step spend, so future work doesn't regress this.

## Verification

- `bunx vitest run src/hooks/__tests__/strategy-simulation.test.ts` — confirm sims still complete and that the Conqueror/Tycoon AI heat profile shifts (bribes no longer compete with claim/extort for ACTION slots).
- Manually: in Tactical step, open Corruption panel → bribe works and decrements tactical counter; in Deploy/Action steps, buttons show locked state; Action step still has full budget after bribing.
