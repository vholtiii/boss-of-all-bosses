

# AI District Control Awareness

## What Changes

AI families already receive bonus entries in `activeDistrictBonuses` (the `computeDistrictBonuses` function tracks all families). The missing piece is that bonuses are only **applied** to the player via `hasPlayerDistrictBonus`. This plan applies them to AI families too.

## Bonuses to Apply for AI

| Bonus | Where Applied | Change |
|---|---|---|
| **Manhattan +25% income** | AI income loop (~line 3803) | Multiply AI tile income by 1.25 if AI controls Manhattan |
| **Little Italy +20% loyalty** | Not applicable — AI doesn't track per-soldier loyalty decay the same way | Skip (minimal impact) |
| **Brooklyn -5 heat** | Not applicable — AI doesn't have police heat | Skip |
| **Brooklyn +10% defense** | Already implemented (line 6821) | No change needed |
| **Bronx $750 recruit discount** | AI recruit section (~line 3824) | Reduce effective cost by $750 |
| **Bronx free recruit every 3 turns** | AI recruit section (~line 3823) | Grant +1 free soldier every 3 turns |
| **Queens +15% extortion** | AI doesn't run extortion rolls | Skip |
| **Queens +5% hit success** | AI combat (~line 4119) | Increase combat willingness / kill chance |
| **Staten Island +3 respect** | AI resource tracking | Add respect to AI opponent |
| **Staten Island +1 influence** | AI resource tracking | Add influence to AI opponent |
| **Manhattan +1 AP** | AI action budget (~line 3912) | Add +1 to `aiActionsRemaining` |
| **Turf Tax (universal)** | Already only applies player-controlled districts draining enemies | Extend to ALL controlling families draining enemies on their turf |

## Files Modified

1. **`src/hooks/useEnhancedMafiaGameState.ts`**
   - **AI Income** (~line 3803): After computing `aiIncome`, check `hasFamilyDistrictBonus(state, fam, 'income')` and multiply by 1.25
   - **AI Recruitment** (~line 3824): Reduce `SOLDIER_COST` by 750 if `hasFamilyDistrictBonus(state, fam, 'recruit_discount')`; grant +1 free soldier if `hasFamilyDistrictBonus(state, fam, 'free_recruit')` and `turn % 3 === 0`
   - **AI Action Budget** (~line 3912): Add +1 to `aiActionsRemaining` if `hasFamilyDistrictBonus(state, fam, 'extra_ap')`
   - **AI Combat** (~line 4126): Reduce `baseKillChance` by 0.05 if attacking AI has Queens hit bonus (`hasFamilyDistrictBonus(state, fam, 'hit_bonus')`)
   - **AI Resources** (after income section): Add +3 respect and +1 influence per turn if AI has Staten Island bonuses
   - **Turf Tax** (~line 3440-3459): Extend loop to apply for ALL families that control any district, not just the player — enemy units on any family's controlled district hexes lose 5 loyalty

2. **`GAME_MECHANICS.md`** — Add note that AI families benefit from the same district control bonuses

