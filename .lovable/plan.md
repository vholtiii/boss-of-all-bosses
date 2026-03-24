

# Revised HQ Assault — Endgame Elimination

## Changes from Previous Plan

1. **No police heat penalty** on failure (removed entirely)
2. **Must be adjacent** — attacking soldier doesn't need to be ON the HQ hex, just adjacent
3. **New "Flip Soldier" sabotage mechanic** — weaken HQ defenses by turning a rival soldier

---

## Mechanics

### Assault HQ
- **Who**: Soldiers only (not capos), must be on a hex **adjacent** to enemy HQ
- **Requirements**: Attacking soldier needs **toughness ≥ 4** and **loyalty ≥ 70**
- **Base success**: 15%, max cap 50%
- **HQ defense**: -30% penalty (built-in fortification)
- **Modifiers**: +5% per friendly unit adjacent to HQ, +family combat bonus, -5% per flipped defender still active
- **Flipped soldier bonus**: Each successfully flipped enemy soldier at HQ reduces defense by 10%
- **On success**: Target family eliminated — all units removed, territory neutralized. +$25,000, +30 respect, +40 fear
- **On failure**: Attacking soldier **killed**, all participating units lose 30 loyalty. **No heat penalty.**
- **Cannot**: scout, claim, or extort HQ hexes

### Flip Soldier (New Action)
- **Who**: Player capos or soldiers with **schemer** traits (or any unit, costs money)
- **Target**: An enemy soldier stationed at or near their own HQ with **loyalty > 60**
- **Cost**: $5,000
- **Base success**: 25% (hard — loyal soldiers resist)
- **Modifiers**: +10% if target loyalty 60-70, +5% per player influence above 50, +schemer capo bonus
- **On success**: Target soldier is "flipped" — marked as compromised. Reduces HQ defense by 10% per flipped soldier. Flipped soldier stays in place (enemy doesn't know).
- **On failure**: Flip attempt discovered. **Scheming family loses 15 influence.** Target soldier gains +10 loyalty (now harder to flip). Enemy family gets notified.
- **Requirement**: Must have a unit adjacent to enemy HQ to attempt

### Domination Victory
- Eliminate all 4 rival families → win

---

## Technical Changes

### `src/types/game-mechanics.ts`
- Add constants: `HQ_ASSAULT_BASE_CHANCE`, `HQ_DEFENSE_BONUS`, `HQ_ASSAULT_MAX_CHANCE`, `HQ_ASSAULT_MIN_TOUGHNESS`, `HQ_ASSAULT_MIN_LOYALTY`, `FLIP_SOLDIER_COST`, `FLIP_SOLDIER_BASE_CHANCE`, `FLIP_SOLDIER_FAIL_INFLUENCE_LOSS`
- Add `FlippedSoldier` interface and `domination` to `VictoryProgress`/`VictoryType`

### `src/components/EnhancedMafiaHexGrid.tsx`
- On enemy HQ hex: block scout/claim/extort
- Show "Assault HQ" button when player has eligible soldier **adjacent** to enemy HQ
- Show "Flip Soldier" button when player unit is adjacent to enemy HQ
- Show disabled reasons for unmet requirements

### `src/hooks/useEnhancedMafiaGameState.ts`
- Add `flippedSoldiers: FlippedSoldier[]` to game state
- `processHQAssault()`: adjacency check, success calc with flipped soldier bonus, elimination on success, soldier death on failure (no heat)
- `processFlipSoldier()`: attempt to flip enemy soldier, influence loss on failure
- Update `updateVictoryProgress()` for domination
- AI: aggressive families attempt assaults after turn 12

### `src/components/VictoryTracker.tsx`
- Add domination row: "Eliminate all rival families (X/4)"

## Files Modified
- `src/types/game-mechanics.ts`
- `src/components/EnhancedMafiaHexGrid.tsx`
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/components/VictoryTracker.tsx`

