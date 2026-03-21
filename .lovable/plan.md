

# Dynamic Construction Speed Based on Unit Presence

## Overview
Legal businesses under construction progress differently depending on which unit occupies the hex. A Capo speeds it up by 50%, a lone soldier slows it down by 25%, and an empty hex pauses construction entirely.

## Rules

| Hex Occupant | Construction Speed |
|---|---|
| Capo present | 50% faster (2 progress per turn instead of 1) |
| Soldier only (no Capo) | 25% slower (0.75 progress per turn) |
| Unoccupied | Paused (0 progress) |

Base construction = 3 turns worth of progress (i.e. progress goal = 3.0). Each turn, progress increments based on the occupant modifier. Business completes when accumulated progress reaches the goal.

## Changes

### 1. `src/hooks/useEnhancedMafiaGameState.ts` — Switch from countdown to progress accumulation

Replace `turnsUntilComplete: number` countdown with a progress-based system on the tile business object:
- Add `constructionProgress: number` (starts at 0) and `constructionGoal: number` (3.0 for all legal businesses)
- Keep `turnsUntilComplete` as a computed display value (derived from remaining progress and current rate)
- In the turn-processing construction tick (~line 1798):
  - Check units on the hex via the units array
  - If no player unit on hex → skip (paused)
  - If a Capo is present → add 1.5 progress
  - If only soldiers → add 0.75 progress
  - When `constructionProgress >= constructionGoal` → complete the business
- Update `place_business_on_hex` handler (~line 2757) to set `constructionProgress: 0, constructionGoal: 3`

### 2. `src/components/EnhancedMafiaHexGrid.tsx` — Hover tooltip shows construction info

In the hover info panel (~line 980), when the business is under construction:
- Show progress bar or fraction (e.g. "Progress: 1.5 / 3.0")
- Show current speed modifier ("⚡ Capo: 50% faster" or "🐢 Soldier only: 25% slower" or "⏸️ Paused — no unit on hex")
- Show estimated turns remaining based on current rate

### 3. `src/components/EnhancedMafiaHexGrid.tsx` — On-hex label update

The existing construction turns label (~line 496) should show estimated turns remaining (computed from remaining progress / current rate), or "⏸️" if paused.

