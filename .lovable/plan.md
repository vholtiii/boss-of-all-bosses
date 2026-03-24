

# Fix All 5 Code Review Issues

## 1. Delete `src/systems/CombatSystem.ts`
Remove the entire file — 590 lines of dead code. No imports reference it anywhere.

## 2. Fix Colombo Family Bonuses
**File**: `src/types/game-mechanics.ts` (lines 139-145)

Colombo shouldn't have `combatBonus: 20`. Per lore, Colombo is the smallest, scrappiest family — their bonuses should lean toward survival/recruitment, not raw combat power.

Change:
- `combatBonus: 20` → `combatBonus: 0`
- `income: 0` → `income: 20` (scrappy income generation to compensate)
- Keep `recruitmentDiscount: 15` and `fearGeneration: 15` as-is (thematic fit)

## 3. Enforce Safe Passage in Combat
**File**: `src/hooks/useEnhancedMafiaGameState.ts` — `processTerritoryHit` (~line 4944)

After the ceasefire/alliance check, add a safe passage check:
- If `safePassagePacts` has an active pact with the target hex's controlling family, block the attack
- If the player attacks anyway (shouldn't reach this, but safety), auto-violate: remove pact, -15 respect, -10 reputation, notify

## 4. Balance Blind Hit Rewards
**File**: `src/hooks/useEnhancedMafiaGameState.ts` (lines 5166-5174)

Replace stat-maxing with bounded boosts:
- `toughness`: `+3` (capped at 5) — instead of setting to 5
- `victories`: `+2` (capped at 5) — instead of setting to 5
- `loyalty`: `+15` (capped at SOLDIER_LOYALTY_CAP) — instead of setting to 80
- Keep `hits += 1`

Update notification text from "soldier stats maxed!" to "soldier stats boosted!"

## 5. Atomic Respect Updates
**File**: `src/hooks/useEnhancedMafiaGameState.ts`

Create a helper function `syncRespect(state, value)` that writes to both `state.reputation.respect` and `state.resources.respect` in one call. Replace the ~5 places where both are written manually with calls to this helper. This prevents future drift between the two values.

## Files Modified
- `src/systems/CombatSystem.ts` — **deleted**
- `src/types/game-mechanics.ts` — Colombo bonuses
- `src/hooks/useEnhancedMafiaGameState.ts` — safe passage enforcement, blind hit balance, respect sync helper

