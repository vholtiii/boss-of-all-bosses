

# Add "End Turn Early" Button

## Problem
The player must click through all three phases (Deploy → Tactical → Action → Waiting) before they can press "End Turn." There's no way to skip directly to end-of-turn processing.

## Solution
Allow the "END TURN" button to work from **any phase**, not just the `waiting` phase. This lets the player end their turn early whenever they want.

## Change

### `src/pages/UltimateMafiaGame.tsx` — Line 467
Remove the `gameState.turnPhase !== 'waiting'` condition from the END TURN button's `disabled` prop, so it's only disabled when jailed. Add a confirmation dialog when ending early (not in `waiting` phase) to prevent accidental clicks.

The `endTurn()` handler in `useEnhancedMafiaGameState.ts` already resets `turnPhase` back to `'deploy'`, so no backend changes are needed — it will correctly process end-of-turn regardless of which phase the player is in.

### Same file — Mobile floating action button (~line 710)
Apply the same change to the mobile END TURN button so it's also available from any phase.

