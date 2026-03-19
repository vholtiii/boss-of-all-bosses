

# Refine Escort Mechanic (Capo Only)

## Current State (from code audit)
- **startEscort** requires soldiers to be on the **same hex** as the Capo — needs to change (unlimited range teleport)
- **Move penalty**: Capo loses 1 move per escorted soldier — needs removal (no penalty)
- **No prompt** to move with/without soldiers — needs adding
- **Escort action costs 1 tactical action** for attaching — needs to change (1 to call, 2 to move-with)
- **No auto-detach** — escortingSoldierIds persist until turn end reset — needs detach on arrival

## Changes

### 1. Call soldier to Capo (unlimited range, 1 tactical action)
**File**: `src/hooks/useEnhancedMafiaGameState.ts` (~line 964, `startEscort`)
- Remove the same-hex filter (`s.q === capo.q && s.r === capo.r && s.s === capo.s`)
- Teleport called soldiers to the Capo's hex immediately (update their q/r/s)
- Cost: 1 tactical action (deduct from `tacticalActionsRemaining`)
- Remove the move penalty line (`movesRemaining - validSoldierIds.length`)
- Keep max 2 soldiers limit

### 2. New flow: click soldier → click Capo's hex to call
**File**: `src/hooks/useEnhancedMafiaGameState.ts` (~line 719, escort selection)
- Change escort selection: when `moveAction === 'escort'`, allow selecting a **soldier** (not capo)
- When soldier is selected, highlight all hexes containing friendly Capos as valid targets
- When player clicks a Capo's hex, call `startEscort` with that Capo and the selected soldier
- This replaces the current capo-first flow

### 3. Move with/without soldiers prompt
**File**: `src/hooks/useEnhancedMafiaGameState.ts` (~line 788, `moveUnit`)
- Add state field `pendingEscortMove?: { capoId: string; targetLocation: { q: number; r: number; s: number } }`
- When a Capo with `escortingSoldierIds` tries to move during deploy phase, set `pendingEscortMove` instead of moving immediately
- Add `confirmEscortMove(withSoldiers: boolean)` callback:
  - `withSoldiers = true`: move Capo + soldiers to target, costs 2 tactical actions, auto-detach soldiers on arrival (clear `escortingSoldierIds`)
  - `withSoldiers = false`: move Capo alone, costs 1 move as normal, soldiers stay at current hex, clear `escortingSoldierIds`

### 4. Auto-detach at destination
**File**: `src/hooks/useEnhancedMafiaGameState.ts` (~line 793)
- After moving soldiers to destination, clear `escortingSoldierIds` on the Capo
- Soldiers become independent units at the destination hex

### 5. No move penalty
**File**: `src/hooks/useEnhancedMafiaGameState.ts` (~line 980)
- Remove `const newMoves = Math.max(0, capo.movesRemaining - validSoldierIds.length)`
- Capo keeps full 3-move, 5-hex fly range regardless of escort count

### 6. UI for escort move prompt
**File**: `src/components/EnhancedMafiaHexGrid.tsx` or new dialog component
- When `pendingEscortMove` is set, show a small prompt/dialog: "Move with soldiers (2 tactical actions) or move alone?"
- Two buttons: "Move with soldiers 🚗" / "Move alone"

## State Changes
- Add `pendingEscortMove` to game state interface
- Add `confirmEscortMove` callback

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — rework escort flow, add pending move, confirm callback, remove move penalty, auto-detach
- `src/components/EnhancedMafiaHexGrid.tsx` — escort move prompt UI, soldier-first selection highlighting
