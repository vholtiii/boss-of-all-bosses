

# Player-Built Business Seizure — Auto-Ceasefire & Reputation Impact

## What Happens

When a rival family takes over a hex that had a **player-built** business (not extorted), three things trigger:

1. **Forced 5-turn ceasefire** between the two families — hostilities pause so the business can operate
2. **Business runs at 50% revenue** for those 5 turns (the new owner is still settling in)
3. **Reputation impact**: The player who lost the business suffers a bigger reputation hit; the rival who seized it gains influence

When a rival takes an **extorted** business hex, none of this triggers — it's just a normal territory flip.

## Technical Changes

### `src/types/game-mechanics.ts`
- Add constants: `BUILT_BIZ_SEIZURE_CEASEFIRE_DURATION = 5`, `BUILT_BIZ_SEIZURE_INCOME_PENALTY = 0.5`, `BUILT_BIZ_SEIZURE_RESPECT_LOSS = 8`, `BUILT_BIZ_SEIZURE_FEAR_LOSS = 5`, `BUILT_BIZ_SEIZURE_INFLUENCE_GAIN = 10`
- Add a `wasPlayerBuilt?: boolean` flag to track seized built-businesses on tiles (so the 50% penalty persists for 5 turns)
- Add `seizurePenaltyTurns?: number` field on the business object

### `src/hooks/useEnhancedMafiaGameState.ts`

**AI territory capture (lines ~3190-3197)**: When AI claims a player hex, check if the tile had a player-built business (`!tile.business.isExtorted`). If so:
- Auto-create a ceasefire pact (5 turns) between the rival and the player
- Set `tile.business.seizurePenaltyTurns = 5` and `tile.business.wasPlayerBuilt = true`
- Apply reputation loss to player: -8 respect, -5 fear
- Apply influence gain to rival: +10 influence
- Push notification: "⚠️ Business Seized! The {family} family took over your built business in {district}. A 5-turn ceasefire is now in effect."

**AI income calculation (lines ~2812-2816)**: If `tile.business.seizurePenaltyTurns > 0`, apply 50% income modifier for the controlling AI family.

**Turn end processing**: Decrement `seizurePenaltyTurns` each turn. When it reaches 0, clear `wasPlayerBuilt` flag — business now operates at full capacity. Push notification: "💼 Business Stabilized — {family}'s seized business now runs at full revenue."

**Combat resolution**: Same check applies wherever combat results in territory changing hands from player to rival — if the lost hex had a built business, trigger the same seizure logic.

### `src/components/EnhancedMafiaHexGrid.tsx`
- Show a subtle ⚠️ badge on rival-held hexes that have `seizurePenaltyTurns > 0` (so the player can see their former built business is still in transition)

### `src/components/HeadquartersInfoPanel.tsx`
- No changes needed (panel only shows player-controlled hexes)

## Files Modified
- `src/types/game-mechanics.ts`
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/components/EnhancedMafiaHexGrid.tsx`

