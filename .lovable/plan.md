

# Revised: Phase System Restructure

## Correction Applied
- **Soldiers**: Move across map but do NOT auto-claim or auto-extort. They must use the Action phase to claim/extort.
- **Capos**: KEEP auto-claim and auto-extort on arrival (existing behavior is correct for Capos).

## Updated Plan

### Step 1: Deploy Phase — Movement Without Auto-Claim (Soldiers Only)
- Remove auto-claim logic **only for soldiers** in `moveUnit`. Capos retain their auto-claim and auto-extort on arrival.
- Deploy phase handles both HQ placement and map movement for all units.

**Files:** `src/hooks/useEnhancedMafiaGameState.ts`

### Step 2: Move Phase → Tactical Phase
- Rename to "Tactical" — Scout, Fortify, Safehouse, Escort only.
- Add `tacticalActionsRemaining` (budget: 3 per turn).

**Files:** `src/hooks/useEnhancedMafiaGameState.ts`, `src/pages/UltimateMafiaGame.tsx`, `src/types/game-mechanics.ts`

### Step 3: Action Phase Limit
- Add `actionsRemaining` (default 2). Hit, Extort, Claim, Bribe each cost 1 action.
- Disable action buttons when budget is 0. Show counter in bottom bar.
- **"Claim Territory"** added as a new action for soldiers on neutral hexes.

**Files:** `src/hooks/useEnhancedMafiaGameState.ts`, `src/components/EnhancedMafiaHexGrid.tsx`, `src/pages/UltimateMafiaGame.tsx`

### Step 4: Bonus Action at 50+ Respect & 50+ Influence
- `maxActions = 2 + (respect >= 50 && influence >= 50 ? 1 : 0)`
- Reset each turn. Notify player on first unlock.

**Files:** `src/hooks/useEnhancedMafiaGameState.ts`, `src/types/game-mechanics.ts`

### Step 5: UI Polish
- Update phase labels: Deploy → DEPLOY, Move → TACTICAL, Action → ACTION.
- Update phase hints. Add action/tactical counters to bottom bar.

**Files:** `src/pages/UltimateMafiaGame.tsx`

---

### Key Behavior Summary

```text
DEPLOY: Move all units. Capos auto-claim/extort on arrival. Soldiers just move.
TACTICAL: Scout, Fortify, Safehouse, Escort (3/turn budget).
ACTION: Hit, Extort, Claim (soldiers only), Bribe (2/turn, 3 with bonus).
```

### New Constants
```typescript
export const BASE_ACTIONS_PER_TURN = 2;
export const BONUS_ACTION_RESPECT_THRESHOLD = 50;
export const BONUS_ACTION_INFLUENCE_THRESHOLD = 50;
export const TACTICAL_ACTIONS_PER_TURN = 3;
```

