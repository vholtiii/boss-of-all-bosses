# One Turn, Three Actions

Replace the Deploy → Tactical → Action step sequence with a single open turn where everything draws from one action pool.

## The new turn

- One phase per turn. No step rail, no "skip to action", no phase-locked panels.
- You get **3 actions** per turn, adjusted by the existing modifiers (respect + influence bonus action, Manhattan district extra-AP bonus, and any family/promotion modifiers already in the code).
- Spend them on anything, in any order: scout, fortify, safehouse, escort, wiretap, send word, family powers, claim, extort, hit, plan hit, bribe, recruit, build, negotiate, HQ assault.
- **Deploying from HQ stays free** (it is already tightly limited by deploy hexes and stacking rules).
- **Movement inside your own connected territory stays free and unlimited** — exactly as it works today.
- **Any other movement costs 1 action** (per move onto a hex outside your connected territory), on top of the unit's existing move range and Zone-of-Control rules.
- Turn ends when you choose to end it, or when you run out of things you want to do. Running out of actions no longer forces an end — you can still make free territory moves and deploys.

## What stays the same

- Progression Phases 1-4 and their unlock gates are untouched.
- Every action's cost, odds, heat, and side-effects are unchanged.
- AI opponents keep their own turn logic; their action budget is scaled the same way it is now.
- Family powers that cost 2 points still cost 2 from the single pool.

## Interface changes

- Top HUD: the step rail is replaced by an **Actions 3/3** pip display plus the End Turn button. Hovering a pip shows where the bonus actions come from.
- Every action button shows its action cost and greys out with "No actions left" when the pool is empty, using the disabled-reason pattern already in place.
- Left sidebar loses the "Deploy step / Tactical step locked" banners — all sections are always available.
- Selected-unit dock shows "Move (free in your territory)" vs "Move (1 action)" on hover targets, so the cost is visible before committing.

## Technical notes

- `TurnPhase` collapses to a single active value (`'action'`) plus `'waiting'` during AI resolution. Existing `turnPhase === 'move' | 'deploy'` guards throughout `useEnhancedMafiaGameState.ts`, `EnhancedMafiaHexGrid.tsx`, `GameSidePanels.tsx`, and `HeadquartersInfoPanel.tsx` are rewritten to a single "turn is open" check.
- `tacticalActionsRemaining` is retired as a separate budget: all tactical branches spend from `actionsRemaining` through one shared helper so costs stay consistent. The field is kept in state, mirrored to `actionsRemaining`, so existing saves and the save-migration path keep loading.
- `advancePhase` / `startMovementPhase` / `endMovementPhase` / `skipToActionPhase` become no-ops or are removed along with `TurnStepRail.tsx`; `endTurn` computes the action budget once at the start of each turn (the logic currently duplicated in `advancePhase` and `skipToActionPhase`).
- Movement cost: the existing free-move check (origin and target both in `getConnectedTerritory`) is extended to gate the action spend — free moves cost 0 actions and 0 move points, non-free moves cost 1 action plus the current move-point cost. Capos get the same free-in-territory rule as soldiers.
- Deploy path skips the action spend entirely.
- Tests touching the phase order (`simulation.test.ts`, `strategy-simulation.test.ts`, `plan-hit-two-turn.test.ts`, `bribe-tactical.test.ts`, and others that call `advancePhase`) are updated to the single-turn flow.
