

# Implement Full Business Management in Enhanced Game State

## Summary

The `performBusinessAction` in `useEnhancedMafiaGameState.ts` is a stub. The full working implementation exists in `useMafiaGameState.ts` and needs to be ported over. The "collect" action specifically adds illegal business profits as **dirty money** (not direct income) — this is a manual click-to-collect mechanic that fits the game's laundering loop.

## Integration Check: "Collect" Mechanic

The collect flow works like this:
1. Player clicks "Collect" on an illegal business → profits go to `finances.dirtyMoney`
2. Player clicks "Launder Money" → dirty money moves to `finances.cleanMoney` and `resources.money` (limited by legal business laundering capacity)
3. This creates a gameplay loop: illegal businesses need legal businesses to actually use the money

**Integration concern**: The enhanced game state currently has no per-turn business income processing either. Businesses generate nothing automatically — everything depends on manual collect/launder actions. This is fine for illegal businesses (thematic), but legal businesses should generate income automatically each turn.

## Changes

### File: `src/hooks/useEnhancedMafiaGameState.ts`

**1. Replace stub `performBusinessAction` (lines 2207-2220)** with the full implementation from `useMafiaGameState.ts` (lines 426-657), including:

| Action | Behavior |
|---|---|
| `build_legal` / `build_illegal` | Create business, deduct cost, add heat for illegal, check bribe permissions |
| `upgrade` | Level up (max 5), scale income/laundering by 1.4x/1.3x |
| `extort` | Mark business extorted, rate based on respect (25% or 50%) |
| `launder` | Move dirty → clean money, capped by legal business capacity, add to `resources.money` |
| `collect` | Add illegal business net profit to `finances.dirtyMoney`, +1 respect |
| `hire_lawyer` / `fire_lawyer` | Assign/remove lawyer with monthly fees |
| `bribe_official` / `stop_bribe` | Add/remove officials, adjust heat reduction, check money sources |
| `rival_info` / `shutdown_rival` | Intelligence and political actions via bribed officials |

Also include the **finance recalculation** block that runs after every action (updates legalProfit, illegalProfit, totalExpenses, prosecutionRisk, etc.)

**2. Add per-turn legal business income** to the end-turn processing: legal business net profits should automatically add to `resources.money` each turn (illegal profits still require manual collect → launder).

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — replace stub with full business logic, add per-turn legal income

