

# Fix: Restrict Deployment to Player's Own HQ and Safehouses Only

## Problem
During the Deploy phase, clicking rival HQs allows deploying units from them. The player should only be able to deploy from their own HQ or their active safehouses.

## Root Cause
Multiple layers need hardening — the hex grid HQ click handler, the deploy highlight calculation, and the HQ info panel all need stricter player-family checks.

## Changes

### `src/components/EnhancedMafiaHexGrid.tsx`
- **Line 336 area**: When a rival HQ is clicked during deploy phase, block the click from opening the HQ info panel OR ensure it doesn't trigger any deploy-related state. Add an early return or skip the `onSelectHeadquarters` call during deploy phase for non-player HQs.
- **Line 768**: The "CLICK TO SEE UNITS" prompt already checks `tile.isHeadquarters === playerFamily` — no change needed.

### `src/hooks/useEnhancedMafiaGameState.ts`
- **`selectUnitFromHeadquarters` (~line 1588)**: Already has `family !== prev.playerFamily` guard — add a secondary guard that ensures the HQ coordinates used match the player's own HQ, not a rival's.
- **`deployUnit` (~line 1645)**: Already has `family !== prev.playerFamily` guard — add validation that the deploy origin (HQ used for hex calculation) is the player's own HQ or an active safehouse.
- **Deploy hex calculation**: Ensure `availableDeployHexes` is only computed from the player's HQ + their safehouses. Filter out any safehouse not owned by the player family.

### `src/components/HeadquartersInfoPanel.tsx`
- **Line 782**: The deploy buttons section already checks `isPlayerFamily` — add a secondary `turnPhase === 'deploy'` check to be extra safe, ensuring buttons only render when it's actually the deploy phase AND it's the player's HQ.

## Files Modified
- `src/components/EnhancedMafiaHexGrid.tsx` — block rival HQ clicks during deploy phase
- `src/hooks/useEnhancedMafiaGameState.ts` — harden deploy origin validation
- `src/components/HeadquartersInfoPanel.tsx` — tighten deploy button visibility

