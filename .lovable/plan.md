

# Add Fortification & Safehouse Intel to Scouting/Bribes

## Problem
When scouting an enemy hex, the intel gathered doesn't include whether the hex is fortified or has a safehouse. This is critical tactical information — fortifications affect combat odds and safehouses are high-value targets.

## Design
- **Scouted hex**: Reveals fortification status AND safehouse presence (only if the exact hex with the safehouse is scouted)
- **Bribe intel**: Captain+ bribes reveal fortification locations across the target family's territory. Safehouses are NOT revealed by bribes (too hidden — requires direct scouting)
- **Map display**: Scouted enemy fortifications show a red shield icon; scouted enemy safehouses show a dim house icon

## Changes

### 1. `src/types/game-mechanics.ts`
- Add to `ScoutedHex` interface: `isFortified?: boolean`, `hasSafehouse?: boolean`

### 2. `src/hooks/useEnhancedMafiaGameState.ts`
- **Scout handler** (~line 1693): When building `scoutInfo`, check `fortifiedHexes` and `safehouses` arrays for enemy entries at the target location. Set the new fields accordingly
- **Scout notification** (~line 1711): Append fortification/safehouse info to the message (e.g., "⚠️ FORTIFIED" or "🏠 Enemy Safehouse detected!")
- **Bribe intel section** (safehouse capture intel at ~line 6310): When generating scouted hex entries from bribe intel, also check and set `isFortified` for each hex

### 3. `src/components/EnhancedMafiaHexGrid.tsx`
- **Fortified hex indicator** (~line 1063-1076): Extend to also show a red shield icon on enemy hexes that are scouted AND have `isFortified: true` in `scoutedHexes`
- **Safehouse indicator**: Add a dim house icon on enemy hexes that are scouted AND have `hasSafehouse: true`
- **Hover tooltip** (~line 1772): When hovering a scouted enemy hex, show fortification/safehouse status if known

## Files Modified
- `src/types/game-mechanics.ts` — 2 new optional fields on `ScoutedHex`
- `src/hooks/useEnhancedMafiaGameState.ts` — populate intel fields during scout and bribe
- `src/components/EnhancedMafiaHexGrid.tsx` — render enemy fortification/safehouse icons on scouted hexes

