

# Boost Blind Hit Success Rewards

## Changes from current values

| Reward | Current | New |
|---|---|---|
| Respect | +15 | **+20** |
| Fear | +15 | **+20** |
| Target influence loss | -10 | **-15** |
| Soldier Toughness | +3 | **+4** |
| Soldier Victories | +2 | +2 (unchanged) |
| Soldier Loyalty | +15 | **+30** |
| Player Influence | — | **+5** |
| Loot | — | None |

## Files Modified

1. **`src/types/game-mechanics.ts`** — Update constants: `BLIND_HIT_RESPECT` 15→20, `BLIND_HIT_FEAR` 15→20, `BLIND_HIT_INFLUENCE_LOSS` 10→15, soldier toughness cap 3→4, loyalty 15→30. Add `BLIND_HIT_INFLUENCE_GAIN = 5`.

2. **`src/hooks/useEnhancedMafiaGameState.ts`** — Apply updated constants in the blind hit victory block; add +5 influence to player on success.

3. **`COMBAT_SYSTEM_GUIDE.md`** — Update the blind hit reward table to reflect new values.

