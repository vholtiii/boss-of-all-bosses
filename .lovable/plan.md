

# Fortify Rework: Unit → Hex-Based Fortification

## Current State
- Fortify is a boolean on the **unit** (`unit.fortified = true`)
- Only that specific unit gets the defense bonus
- Moving the unit removes the fortification
- No cost, no duration, single level — all staying the same per your choices

## Problem with Current Approach
A fortified soldier who moves loses their barricade — but realistically, the barricade is still there. Another soldier who walks onto that hex gets nothing. This makes fortification feel like a personal buff rather than a tactical position.

## Change: Hex-Based Fortification

**Core concept**: Fortify builds defenses on a **hex**, not a unit. Any friendly unit on a fortified hex gets the +25% defense bonus. The fortification persists until:
- An enemy captures the hex (fortification destroyed)
- The player has no units on the hex for 3 consecutive turns (abandoned, deteriorates)

### Rules
- **Cost**: Free (1 tactical action, unchanged)
- **Defense**: +25% to all friendly units on the hex (unchanged value)
- **Attacker bonus**: Fortified attackers still get +12.5% — but only if attacking FROM a fortified hex
- **Casualty re-roll**: The 50% save applies to any unit on a fortified hex, not just specifically-fortified units
- **Hitman modifier**: If target is on a fortified hex → reduced success (unchanged)
- **Stacking**: A hex is either fortified or not — no double-fortifying
- **Destruction**: Enemy capturing the hex destroys fortification. Sabotage also destroys it.
- **Abandonment**: If no friendly units are on the hex for 3 turns, fortification crumbles

### Visual
- Fortified hexes show a 🛡️ shield icon on the hex itself (not on the unit)
- Enemy fortified hexes are hidden by fog of war (unchanged)

## Technical Changes

### `src/types/game-mechanics.ts`
- Add `FortifiedHex` interface: `{ q, r, s, family, fortifiedOnTurn, abandonedSinceTurn?: number }`
- Keep existing constants (`FORTIFY_DEFENSE_BONUS`, `FORTIFY_CASUALTY_REDUCTION`)
- Add `FORTIFY_ABANDON_TURNS = 3`

### `src/hooks/useEnhancedMafiaGameState.ts`
- Add `fortifiedHexes: FortifiedHex[]` to game state
- **`fortifyUnit` → `fortifyHex`**: Instead of setting `unit.fortified = true`, push `{ q, r, s, family }` to `fortifiedHexes`. Block if hex already fortified
- **Combat resolution**: Replace `unit.fortified` checks with hex-based lookups:
  - Defender bonus: check if target hex is in `fortifiedHexes` for defending family
  - Attacker bonus: check if attacking unit's current hex is fortified
  - Casualty re-roll: check hex, not unit
- **Territory capture**: When enemy takes a hex, remove it from `fortifiedHexes`
- **Abandonment tick**: In `advanceToNextTurn`, for each fortified hex — if no friendly units present, increment `abandonedSinceTurn`. If absent for 3+ turns, remove. If a unit returns, reset the counter.
- Remove `fortified` boolean from unit objects (and the `fortified: false` reset on move)
- **Hitman check**: Replace `targetUnit.fortified` with hex lookup

### `src/components/EnhancedMafiaHexGrid.tsx`
- Render 🛡️ on hex tiles that are in `fortifiedHexes` for the player's family
- Remove per-unit fortification icon if it exists

### `src/pages/UltimateMafiaGame.tsx`
- Pass `fortifiedHexes` to grid component
- Update fortify action handler

## Files Modified
- `src/types/game-mechanics.ts` — new `FortifiedHex` type, abandon constant
- `src/hooks/useEnhancedMafiaGameState.ts` — hex-based fortify logic, combat checks, abandonment
- `src/components/EnhancedMafiaHexGrid.tsx` — hex-level shield rendering
- `src/pages/UltimateMafiaGame.tsx` — pass fortified hex data

