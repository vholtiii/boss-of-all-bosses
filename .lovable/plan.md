

# Code Review + 3-Game Simulation Plan

## Code Review — Grade: B+

### Issues Found

**1. Respect Sync Still Broken in 4 Places** (Bug — High Priority)
The `syncRespect` helper was added but not used everywhere. These 4 locations write to `resources.respect` or `reputation.respect` directly, causing drift:
- **Line 1269**: Capo auto-extort in `moveUnit` — writes `resources.respect` only
- **Line 1685**: Capo auto-extort in `deployUnit` — writes `resources.respect` only  
- **Line 3777**: Plan Hit failure in `endTurn` — writes `resources.respect` only
- **Line 4515**: `shutdown_rival` action — writes `resources.respect` only
- **Line 5484**: Extortion failure — writes `reputation.respect` only (misses `resources.respect`)

**2. `combat` Field is Dead Weight** (Cleanup — Medium)
`state.combat: CombatSystem` (lines 262, 631-639) is initialized with empty data and never read or written anywhere in the codebase. All actual combat is handled inline in `processTerritoryHit`. The `CombatSystem` type from `enhanced-mechanics.ts` is only used for this dead field. Remove it from state and initial state.

**3. Empty `src/systems/` Directory** (Cleanup — Low)
The `CombatSystem.ts` file was deleted but the directory remains empty. Delete it.

**4. `missions` Field Set to `never[]`** (Cleanup — Low)
Line 266: `missions?: never[]` — this was intentionally typed as never to prevent use, but it's still initialized. Remove the field entirely.

**5. Capo Wound `maxMoves` Never Resets** (Bug — Medium)
Line 5311: `capo.maxMoves = Math.max(1, (capo.maxMoves || 3) - CAPO_WOUND_MOVE_PENALTY)` permanently reduces the capo's `maxMoves`. Each wound stacks: 3→2→1. The value never resets to 3 at turn start. After 2 wounds, a capo is permanently crippled at 1 move. Fix: reset `maxMoves` to base value (3) at the start of each turn in `advancePhase`/`endTurn`, then apply any single-turn wound debuff.

**6. No Adjacent Unit Combat Participation** (Missing Feature — Medium)
The memory/docs mention "all units on adjacent hexes join at 90% effectiveness" but `processTerritoryHit` only counts units ON the target hex. Adjacent friendlies don't join the attack. This is a documented mechanic that's not implemented.

### What's Working Well
- `syncRespect` helper exists and is used in ~8 locations correctly
- Share Profits income is properly calculated in the economy loop (line 2614-2625)
- Safe Passage is enforced in `processTerritoryHit` with proper violation penalties
- Blind Hit rewards are properly bounded (+3/+2/+15, capped)
- Pact tickdown in `processPacts` is clean and handles all 4 pact types
- Negotiation cooldowns are properly separated (Boss vs Capo) with 2-turn decay
- Colombo bonuses are correctly set (combatBonus: 0, income: 20)

---

## Plan: Fix Issues + 3-Game Simulation

### Step 1: Fix Remaining Respect Sync (5 locations)
**File**: `src/hooks/useEnhancedMafiaGameState.ts`
- Line 1269: Replace direct `resources.respect` write with post-update sync
- Line 1685: Same pattern
- Line 3777: Use `syncRespect(newState, ...)` instead of raw write
- Line 4515: Use `syncRespect(newState, ...)`
- Line 5484: Use `syncRespect(state, ...)` instead of `state.reputation.respect = ...`

### Step 2: Remove Dead `combat` Field
- Remove `combat: CombatSystem` from `EnhancedMafiaGameState` interface (line 262)
- Remove initialization block (lines 631-639)
- Remove `CombatSystem` import (line 3)
- Check if `CombatSystem` type in `enhanced-mechanics.ts` is used elsewhere — if not, leave it (other types in that file are still used)

### Step 3: Fix Capo Wound Recovery
In `advanceToNextTurn` / beginning of turn processing, reset all player capos' `maxMoves` to 3 before applying any current-turn debuffs. This ensures wounds are single-turn penalties, not permanent.

### Step 4: Delete Empty `src/systems/` Directory
Remove the empty directory.

### Step 5: Remove `missions` Field
Remove `missions?: never[]` from the interface and initial state.

### Step 6: 3-Game Simulation
Run 3 automated game simulations (fast-forward 15 turns each) via console script to verify:
- No crashes or undefined errors
- Economy produces correct income (including share profits)
- Pacts tick down and expire properly
- Respect stays in sync between both fields
- Victory conditions evaluate correctly
- AI turns process without errors

This will be a read-only diagnostic — log output, no state mutation.

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — respect sync fixes, remove dead combat field, capo wound recovery, remove missions
- `src/systems/` — delete empty directory

