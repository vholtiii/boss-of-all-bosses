

# Scout System Refinement

## Current State
- Soldiers only, range 1, 3-turn duration, snapshot intel, no risk, works on neutral hexes
- `ScoutedHex` stores `enemySoldierCount`, `enemyFamily`, `businessType`, `businessIncome` as frozen values
- `SCOUT_INTEL_BONUS` (+15% hit success) used in combat
- Tooltip in `EnhancedMafiaHexGrid.tsx` displays static scouted data

## Changes

### 1. Decay Model for Intel Freshness — `useEnhancedMafiaGameState.ts` + `EnhancedMafiaHexGrid.tsx`
- Add `freshUntilTurn: number` to `ScoutedHex` (set to `scoutedTurn + 1`)
- In the hex grid tooltip and `isHexRevealed`, check if `currentTurn <= freshUntilTurn`:
  - **Fresh (turn 1)**: show live unit count from `deployedUnits` (real-time query)
  - **Stale (turns 2-3)**: show original snapshot values with a visual indicator ("⚠️ STALE INTEL")
- Hit success bonus: full `SCOUT_INTEL_BONUS` (+15%) on fresh intel, half (+7%) on stale intel
- Update `ScoutedHex` interface in `game-mechanics.ts`

### 2. Detection Chance — `useEnhancedMafiaGameState.ts`
- In `processScout`, after successful scout of enemy-controlled hex:
  - 15% detection chance (`Math.random() < 0.15`)
  - On detection: no heat increase, but the AI family that owns the hex gets a `reinforceTarget` flag
  - Add `reinforceTargets: { q, r, s, family, expiresOnTurn }[]` to game state
  - In `processAITurn`, if a family has a matching `reinforceTarget`, prioritize moving a unit to that hex
  - Notification to player: "⚠️ Your scout was detected! The {family} may reinforce this position."
- Detection does NOT prevent the scout from succeeding — intel is still gathered

### 3. Neutral Hex Scouting — `useEnhancedMafiaGameState.ts`
- Keep allowing neutral hex scouting (already works)
- In `processScout`, when target is neutral: only populate `businessType` and `businessIncome`, set `enemySoldierCount: 0`
- No detection chance on neutral hexes
- Already showing business info in tooltip — no grid changes needed

## Files Modified
- `src/types/game-mechanics.ts` — add `freshUntilTurn` to `ScoutedHex`
- `src/hooks/useEnhancedMafiaGameState.ts` — decay logic in processScout, detection chance, reinforceTargets in AI turn, stale bonus scaling in combat
- `src/components/EnhancedMafiaHexGrid.tsx` — fresh vs stale tooltip display, live unit count for fresh intel

