

# Hit Territory Rework: Risk/Reward for Unscouted vs Scouted Hits

## Summary

The regular "Hit Territory" action becomes a high-risk, high-reward gamble on unscouted hexes, and a calculated strike on scouted ones. This differentiates it from the safer "Plan Hit" action.

## Mechanics

### Unscouted Hit (Blind Hit)
- **Civilian risk**: If the target hex has **no enemy units**, the soldier hit a civilian
  - Heat set to **100 (max)**
  - Attacking soldier enters **hiding for 3 turns** (removed from board, returns to HQ after 3 turns)
  - No respect/fear gained
- **Enemy found**: If the hex DOES have enemy soldiers/capos, normal hit combat resolves
  - On **victory**: attacking soldier gets **max toughness (training=10), max loyalty (100), +5 survived conflicts**
  - Family **respect +15** (triple normal), **fear +15**
  - Family **loyalty unchanged**, **influence unchanged**
  - **Street cred event**: notification fires, all rival families gain +15 fear of player
  - **Bounty**: targeted family AI prioritizes attacking player territory for 3 turns
  - **Targeted family loses -10 influence**
- Base success rate on unscouted: **-20% penalty** (applied before clamp)

### Scouted Hit
- **No civilian risk** — intel is reliable, full bypass
- Normal hit mechanics apply (existing combat formula)
- Standard rewards (+5 respect, +5 fear)

## State Changes

### New state fields
- `hiddenUnits: { unitId: string; returnsOnTurn: number }[]` — tracks soldiers in hiding
- `aiBounties: { targetFamily: string; fromFamily: string; expiresOnTurn: number }[]` — tracks AI revenge priorities

### `src/hooks/useEnhancedMafiaGameState.ts`

**In `hit_territory` handler:**
1. Check if hex is scouted
2. If **not scouted** and **no enemy units on hex**:
   - Set heat to 100
   - Remove soldier from `deployedUnits`, add to `hiddenUnits` with `returnsOnTurn = currentTurn + 3`
   - Add notification: "Your soldier hit a civilian! They've gone into hiding."
   - Return early — no combat
3. If **not scouted** and **enemy units present**:
   - Apply -20% to success chance
   - On victory: max out attacker stats, +15 respect, +15 fear, street cred event, add bounty, target family -10 influence
4. If **scouted**: existing logic (no civilian risk, standard rewards)

**Start-of-turn processing:**
- Check `hiddenUnits` — if `currentTurn >= returnsOnTurn`, move unit back to HQ hex, remove from hidden list, show notification
- Check `aiBounties` — feed into AI targeting logic (AI prioritizes player hexes for 3 turns)

**AI attack logic:**
- If family has active bounty on player, weight player territories higher in target selection

### `src/types/game-mechanics.ts`
- Add `HiddenUnit` and `AIBounty` interfaces
- Add constants: `BLIND_HIT_PENALTY = 0.20`, `BLIND_HIT_RESPECT = 15`, `BLIND_HIT_FEAR = 15`, `HIDING_DURATION = 3`, `BOUNTY_DURATION = 3`

### `COMBAT_SYSTEM_GUIDE.md`
- Add section on Unscouted vs Scouted hit risk
- Document civilian hit penalty, hiding mechanic, bounty system

## Files Modified
- `src/types/game-mechanics.ts` — new interfaces and constants
- `src/hooks/useEnhancedMafiaGameState.ts` — hit logic rework, hiding/bounty state, start-of-turn resolution, AI targeting
- `COMBAT_SYSTEM_GUIDE.md` — documentation

