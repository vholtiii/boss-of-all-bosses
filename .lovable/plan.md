

# Refine Escort Mechanic — DONE

## Changes Implemented

### 1. "Call Soldier" system (tactical phase)
- Escort action now selects a **soldier** (not a capo)
- Shows hexes containing player's capos with room for escorts (< 2)
- Clicking a capo's hex teleports the soldier there (costs 1 tactical action)

### 2. Auto-travel & auto-detach (deploy phase)
- When a capo with escorted soldiers moves, soldiers automatically travel with the capo
- Soldiers auto-detach at the destination (escortingSoldierIds cleared)
- Works regardless of selected move action — any capo movement carries escorts

### 3. No movement penalty
- Removed `movesRemaining` reduction when escorting soldiers
- Capo keeps full movement range with escorts

### 4. Updated UI descriptions
- Tooltip and description panel updated to explain the new flow

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — selectUnit escort flow, moveUnit call handler, startEscort refactor, auto-detach logic
- `src/pages/UltimateMafiaGame.tsx` — UI tooltip and description text
