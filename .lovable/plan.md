

# Rebalance: Distinct Hit Type Identity

## Design Philosophy
Each hit type gets a clear strategic niche: **Blind = high-risk gamble, Scouted = low-heat reliable, Planned = surgical precision.**

## Changes

### 1. Fix Plan Hit: Implement Fortification Bypass (Bug Fix)
**File**: `src/hooks/useEnhancedMafiaGameState.ts`
- Skip fortification defense penalty when `state.plannedHit` is active and target matches

### 2. Plan Hit: Add Unique Rewards on Success
**File**: `src/hooks/useEnhancedMafiaGameState.ts`
- **Zero attacker casualties** (clean execution)
- **+10 respect, +10 fear**
- **Guaranteed target kill** (not random from defender pool)
- **+$5,000 loot bonus**
- Plan Hit on a **capo**: +15 influence (decapitation strike)

### 3. Plan Hit: Keep Existing Failure Penalties
- **No changes** to `PLAN_HIT_FAIL_REPUTATION` (5) or `PLAN_HIT_FAIL_LOYALTY` (10) — they stay as-is

### 4. Scouted Hit: Low-Heat Perk
**File**: `src/hooks/useEnhancedMafiaGameState.ts`
- **50% reduced police heat** from the hit (clean, informed operation)

### 5. Blind Hit: Heat Increase
**File**: `src/hooks/useEnhancedMafiaGameState.ts`
- **+50% police heat** (reckless = more attention)

### 6. New Constants
**File**: `src/types/game-mechanics.ts`
- Add: `PLAN_HIT_RESPECT = 10`, `PLAN_HIT_FEAR = 10`, `PLAN_HIT_LOOT = 5000`, `PLAN_HIT_CAPO_INFLUENCE = 15`

### 7. Update Documentation
**File**: `COMBAT_SYSTEM_GUIDE.md`

## Resulting Balance

| | **Blind** | **Scouted** | **Planned** |
|---|---|---|---|
| **Niche** | High-risk gamble | Low-heat reliable | Surgical precision |
| **Success mod** | -20% | +15% | +35%, bypasses fortification |
| **Respect/Fear** | +15/+15 | +5/+5 | +10/+10 |
| **Heat** | 150% normal | 50% normal | Normal |
| **Casualties** | Standard | Standard | Zero on success |
| **Special** | Stat boost, bounty, civ risk | Clean operation | Guaranteed target kill, +$5K loot |
| **Fail penalty** | Civ hit risk | Standard | -5 rep, -10 loyalty (unchanged) |

## Files Modified
- `src/types/game-mechanics.ts` — new reward constants
- `src/hooks/useEnhancedMafiaGameState.ts` — fortification bypass, reward tiers, heat modifiers
- `COMBAT_SYSTEM_GUIDE.md` — updated documentation

