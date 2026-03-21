

# Fog of War: Hide Rival Intel Unless Scouted or Bribed

## Summary

Currently all rival unit positions, counts, fortification status, and safehouses are visible on the map. This removes strategic depth. The plan adds a fog of war system where rival hexes only show **territory control color** — all other intel (units, fortifications, safehouses, unit counts) is hidden unless the hex is **scouted** or the player has an active **Police Captain bribe** targeting that rival family.

## What Changes for the Player

**Hidden by default on rival hexes:**
- Soldier/Capo icons and counts
- Fortification shield indicator
- Enemy safehouse indicator
- Unit details in hover tooltip

**Always visible:**
- Territory control (hex color + control dot)
- Business icons and income (businesses are public-facing)
- HQ locations (common knowledge)

**How to reveal intel:**
1. **Scout action** — reveals a specific hex for 3 turns (already exists)
2. **Police Captain bribe** — reveals all hexes of the targeted rival family while active

## Changes

### 1. `src/components/EnhancedMafiaHexGrid.tsx` — Core fog of war logic

Add a helper function `isHexRevealed(tile, family)` that returns `true` if:
- The hex belongs to the player
- The hex is neutral
- The hex is scouted (exists in `scoutedHexes`)
- The player has an active `police_captain` bribe contract targeting the hex's controlling family

**Unit rendering (~line 509-585):** Wrap rival unit rendering in `isHexRevealed` check — only show enemy SoldierIcon/CapoIcon if revealed.

**Fortification indicator (~line 483-494):** Currently only shows player's fortified units. Keep as-is (already correct — only shows `playerFamily`).

**Safehouse indicator (~line 474-480):** This shows the player's own safehouse. Keep as-is. Add a separate block for *enemy* safehouses that only renders when revealed.

**Hover tooltip (~line 900+):** Gate enemy unit counts and details behind `isHexRevealed`. Show "??? Unknown forces" for unrevealed rival hexes.

### 2. `src/hooks/useEnhancedMafiaGameState.ts` — Expose bribe contracts

Ensure `bribeContracts` (already in state) is passed through to the grid component so the fog of war check can query active captain bribes.

### 3. Minor: update hover tooltip

For unrevealed rival hexes, show a fog indicator like "👁️‍🗨️ Intel unknown — scout or bribe to reveal" instead of unit details.

## Files Modified
- `src/components/EnhancedMafiaHexGrid.tsx`

