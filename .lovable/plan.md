

# Fortify Refinement — Max 4 Cap + Hover Info

## Overview
Two targeted changes: (1) cap fortifications at 4 per family, (2) show fortification details on hex hover.

## Changes

### 1. Max Fortification Cap: 4
- Add `MAX_FORTIFICATIONS = 4` constant to `game-mechanics.ts`
- Block fortification in both code paths (the `fortifyUnit` callback ~line 1577 and the inline `moveAction === 'fortify'` handler ~line 1239) if the player already has 4 fortified hexes
- Show notification: "Maximum fortifications reached (4/4)"
- AI also respects the 4-cap limit

### 2. Hover Tooltip — Fortification Info
Add a fortification section to the existing hover panel (~line 1757 area in `EnhancedMafiaHexGrid.tsx`). Shows:
- **🛡️ FORTIFIED** header (only for player's own fortifications)
- **Age**: "Built X turns ago"
- **Status**: "Occupied" or "Abandoned (Y/3 turns until crumble)"
- **Bonuses**: "+25% defense, 50% casualty reduction"
- If abandoned, show countdown: "Crumbles in Z turns"
- Enemy fortifications on revealed hexes show: "🛡️ Enemy Fortified" (no detail beyond existence)

### 3. Fortify Button Feedback
Update the fortify action tip text to show current count: "🛡️ Fortify (2/4)"

## Files Modified
- **`src/types/game-mechanics.ts`** — add `MAX_FORTIFICATIONS = 4`
- **`src/hooks/useEnhancedMafiaGameState.ts`** — enforce cap in both fortify code paths + AI fortify logic
- **`src/components/EnhancedMafiaHexGrid.tsx`** — fortification details in hover tooltip
- **`src/pages/UltimateMafiaGame.tsx`** — update fortify button label with count

