

# Fix: Escort Tactical Action Not Working

## Root Cause

Two related bugs prevent escort from functioning after the deploy phase:

1. **No `movesRemaining` reset on phase transition** — When advancing from Deploy to Tactical phase in `advancePhase`, soldier `movesRemaining` is not restored. Soldiers that moved during deploy have `movesRemaining: 0`.

2. **`movesRemaining > 0` gate blocks selection** — Both `selectUnit` (line 710) and `handleHexClick` (line 261) filter units by `movesRemaining > 0`. Soldiers with 0 moves can't be clicked or selected for escort, even though escort is a tactical action that teleports them (no movement needed).

## Fix Plan

### File: `src/hooks/useEnhancedMafiaGameState.ts`

**1. Reset `movesRemaining` when entering tactical phase**

In `advancePhase`, when `nextPhase === 'move'`, reset all deployed units' `movesRemaining` to their base value (2 for soldiers, 3 for capos). This ensures tactical actions aren't blocked by prior deploy-phase movement.

**2. Bypass `movesRemaining` check for escort selection**

In `selectUnit`, when `moveAction === 'escort'` during tactical phase, find the soldier without requiring `movesRemaining > 0`. The escort "call" teleports the soldier — it doesn't use movement points.

### File: `src/components/EnhancedMafiaHexGrid.tsx`

**3. Bypass `movesRemaining` filter in tactical phase hex clicks**

In `handleHexClick`'s tactical (`move`) phase block (line 258-265), when the selected move action is `escort` or `fortify`, allow selecting units with `movesRemaining === 0` since these are tactical actions, not movement.

### Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — reset moves on phase change, bypass check for escort
- `src/components/EnhancedMafiaHexGrid.tsx` — allow zero-move unit selection in tactical phase

