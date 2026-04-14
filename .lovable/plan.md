

# Rework Purge Ranks: Mark-and-Escort Elimination

## Current Behavior
Clicking "Eliminate" instantly removes the soldier from the board (1 action point, Action phase).

## New Behavior
Purge Ranks becomes a two-step process:
1. **Mark for Death** (Action phase, 1 action point): Soldier gets a ☠️ marker visible on the map. Lasts 5 turns, then expires.
2. **Execute via Escort** (Tactical phase): Use the Capo Escort action to call the marked soldier to the Capo's hex. When a marked soldier is escorted, they are automatically eliminated with a sound cue and combat feedback — no additional action cost.

## Technical Changes

### 1. `src/types/game-mechanics.ts`
- Add `PURGE_MARK_DURATION = 5` constant

### 2. `src/hooks/useEnhancedMafiaGameState.ts`

**A. Change `eliminate_soldier` action (~line 7448):**
- Instead of removing the soldier, set `soldierStats[targetId].markedForDeath = true` and `soldierStats[targetId].markedTurnsRemaining = 5`
- Still costs 1 action point
- Notification changes to "Soldier has been marked for elimination"

**B. Modify escort handler (~line 1810):**
- After teleporting a soldier to the capo's hex, check if `soldierStats[unit.id].markedForDeath === true`
- If marked: execute the elimination immediately (reuse existing purge logic — remove unit, apply fear/heat/loyalty effects based on rat status, play `hit_success` sound)
- Notification: "The Capo carried out the hit"

**C. End-of-turn processing:**
- Decrement `markedTurnsRemaining` for all marked soldiers
- If it reaches 0, clear `markedForDeath` flag and notify "Mark expired"

### 3. `src/components/GameSidePanels.tsx` (~line 366)
- Change button label from "Eliminate" to "Mark for Death"
- Show ☠️ badge and remaining turns for already-marked soldiers
- Disable marking for soldiers already marked

### 4. `src/components/SoldierIcon.tsx` / `EnhancedMafiaHexGrid.tsx`
- Show a ☠️ icon overlay on the map for marked soldiers (small skull badge similar to the count badge)

### 5. Sound cue
- Play `hit_success` sound when the escort-triggered elimination occurs (already exists in the sound system)

## Summary
- Mark = Action phase button (renamed from "Eliminate" to "Mark for Death")
- Kill = Escort the marked soldier to a Capo during Tactical phase
- Mark expires after 5 turns if not acted on
- Sound + notification on execution

