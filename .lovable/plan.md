

# Addition: Hits Don't Auto-Claim Territory

## Current Behavior
Line 2802: `tile.controllingFamily = state.playerFamily;` — a successful hit immediately flips the hex to the player's control.

## New Behavior
A successful hit **clears enemy units** from the hex and resets it to **neutral** (no controlling family). The player must then **Claim** the hex on a subsequent turn. This adds strategic depth — you have to hold the area and spend an action to formally take it.

## Changes

### `src/hooks/useEnhancedMafiaGameState.ts`
In `processTerritoryHit`, on victory (line ~2802):
- Change `tile.controllingFamily = state.playerFamily` → `tile.controllingFamily = null` (set to neutral)
- Update notification text from "Territory Captured!" to "Hit Successful! Territory is now contested — claim it next turn."
- Update `lastCombatResult.title` from "TERRITORY CAPTURED!" to "HIT SUCCESSFUL!"

### `src/components/TurnSummaryModal.tsx` / notifications
- No structural changes needed; the notification text update in the reducer handles it.

### Combat Guide (`COMBAT_SYSTEM_GUIDE.md`)
- Update Victory Outcome table: "Territory captured → ❌ (set to neutral; must Claim next turn)"

**One file changed**: `src/hooks/useEnhancedMafiaGameState.ts` (3 line edits in the hit victory block)

