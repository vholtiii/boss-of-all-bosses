

# Fix Soldier Purchase & Capo Promotion Flow

## Issues to Fix

1. **Bought mercenaries don't appear at HQ** — `recruit_soldiers` increments a counter but never creates a `deployedUnit` at HQ coordinates
2. **"Recruit Capo" button shouldn't exist** — Capos are only obtainable via promotion from the existing `CapoPromotionPanel`
3. **Buy Soldier price display** — Ensure the button shows the correct $1,500 price
4. **Capo promotion UX** — When clicking "Promote" in the Capo Promotion section, the player should select from their eligible soldiers (this already works via `CapoPromotionPanel` which lists soldiers with promote buttons — just need to remove the shortcut "Recruit Capo" button that bypasses it)

## Changes

### 1. `src/hooks/useEnhancedMafiaGameState.ts` — Fix mercenary purchase

**`recruit_soldiers` case**: Instead of just incrementing `resources.soldiers`, create an actual `deployedUnit` at the player's HQ coordinates:
- Generate ID like `{family}-soldier-merc-{timestamp}`
- Place at HQ with `movesRemaining: 0`, `type: 'soldier'`
- Create `soldierStats` entry with `training: 5` (combat-ready merc), current loyalty
- Apply -3 loyalty penalty
- Decrement `tacticalActionsRemaining`

**Delete `recruit_capo` case** — no longer callable.

### 2. `src/components/GameSidePanels.tsx` — UI cleanup

- **Remove the "Recruit Capo" ActionButton** (lines 212-218) from the Recruitment section entirely
- **Verify** the Buy Soldier button sublabel correctly shows `$1,500` (it references `SOLDIER_COST` which should already be 1500 from the earlier change — will confirm and fix if needed)

### 3. `src/types/game-mechanics.ts` — Verify price constant

Confirm `SOLDIER_COST = 1500`. If it's still 500, update it.

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/components/GameSidePanels.tsx`
- `src/types/game-mechanics.ts` (if needed)

