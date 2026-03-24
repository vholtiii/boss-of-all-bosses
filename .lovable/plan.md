

# Fortify Rework: Unit → Hex-Based — COMPLETED

## Summary
Fortification is now tied to hexes, not individual units. Any friendly unit on a fortified hex gets the defense bonus. Fortifications persist until the hex is captured by an enemy or abandoned (no friendly units for 3 turns).

## Changes Made
- **`src/types/game-mechanics.ts`**: Added `FortifiedHex` interface and `FORTIFY_ABANDON_TURNS = 3` constant
- **`src/hooks/useEnhancedMafiaGameState.ts`**: 
  - Added `fortifiedHexes: FortifiedHex[]` to state, initial state, and clone helper
  - Added `isHexFortified` / `isHexFortifiedAny` helper functions
  - Replaced all `unit.fortified` checks with hex-based lookups (combat, hitman, AI, casualty re-roll)
  - Fortify action now pushes to `fortifiedHexes[]` instead of setting `unit.fortified = true`
  - Moving a unit no longer removes fortification (it stays on the hex)
  - Added abandonment tick in turn advancement (3 turns with no units → removed)
  - Territory capture/elimination now destroys fortifications on affected hexes
- **`src/components/EnhancedMafiaHexGrid.tsx`**: Shield icon renders on fortified hexes (not per-unit)
- **`src/pages/UltimateMafiaGame.tsx`**: Updated fortify tooltips to reflect hex-based mechanics
