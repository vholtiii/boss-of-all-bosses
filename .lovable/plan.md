

# Review: Hit Territory Mechanic — Current Behavior & Issues

## How It Works Now

1. **Eligibility**: During ACTION phase, select a soldier → adjacent enemy hexes highlight → click target → "Hit Territory" button appears in context menu.
2. **Execution** (`processTerritoryHit`):
   - Gathers ALL player units on the target hex AND adjacent hexes as attackers
   - Gathers enemy units ON the target hex as defenders
   - Base success: 80% if attackers outnumber defenders, 20% otherwise
   - Modifiers: fortification, family combat bonus, hitmen bonus, Lucchese bonus, scout intel bonus
   - Capped at 95%
3. **On Success**: Enemy units removed, hex flipped to player, +$5,000, +10 respect, 20% attacker casualties, +15 police heat
4. **On Failure**: 40% attacker casualties (min 1), +15 police heat, no territory gain

## Identified Issues

### 1. ALL adjacent player units drafted into combat (unintended)
The hit pulls in every player unit from all 6 neighboring hexes — not just the selected unit. A soldier 3 hexes away from the fight contributes and can die. The player has no control over who participates.

### 2. Binary success chance (80% vs 20%) is too coarse
Only two outcomes: outnumber = 80%, don't = 20%. A 5v2 advantage gives the same chance as 2v1. No scaling with force ratio.

### 3. Hit gives +$5,000 — conflicts with Claim Territory rework
Claim was just reworked to be the "no money" option. Hit giving flat $5,000 on enemy territory capture muddies the distinction. Hit should focus on territory control and fear/respect, not cash.

### 4. Casualties remove units by array index order, not randomly
`playerUnits[0]` always dies first. The selected unit (who initiated the hit) is likely index 0, meaning your best-positioned soldier dies first every time.

### 5. No heat scaling — flat +15 regardless of battle size
A 1v0 silent takeover of an undefended hex generates the same heat as a massive 5v3 firefight.

### 6. Capos cannot initiate hits
Only soldiers can hit (`canHit = isEnemy && isSoldier`). Capos — your lieutenants — can't lead an assault, which feels wrong thematically.

## Proposed Fixes

### File: `src/hooks/useEnhancedMafiaGameState.ts`

**Fix 1 — Only use selected unit + units on target hex**
Replace the "all adjacent units" logic. Only the selected unit (who initiated the hit) and any player units already ON the target hex participate. This gives the player tactical control.

**Fix 2 — Scaled success chance**
Replace binary 80/20 with a ratio-based formula:
- `chance = 0.5 + (attackers - defenders) * 0.15` (capped 0.1–0.95)
- 1v0 = 65%, 1v1 = 50%, 2v1 = 65%, 3v1 = 80%, 1v2 = 35%

**Fix 3 — Replace money reward with fear/respect**
Remove +$5,000. Replace with +5 fear, +5 respect. Hit is about dominance, not profit. (Extort is for money.)

**Fix 4 — Random casualty selection**
Shuffle the attacker array before removing casualties so deaths are randomized, not index-ordered.

**Fix 5 — Scale heat with battle size**
Heat = `8 + (totalUnitsInvolved * 2)`, capped at 25. Small skirmish = low heat, big battle = high heat.

**Fix 6 — Allow Capos to initiate hits**

### File: `src/components/EnhancedMafiaHexGrid.tsx`

**Fix 6 (UI)** — Change `canHit` from `isEnemy && isSoldier` to `isEnemy && (isSoldier || isCapo)`.

## Summary of Changes

| Aspect | Before | After |
|---|---|---|
| Participants | All adjacent units | Selected unit + units on target hex |
| Success calc | 80% or 20% | Scaled 0.5 + ratio * 0.15 |
| Reward | +$5,000 + 10 respect | +5 fear + 5 respect (no money) |
| Casualties | First in array die | Random selection |
| Heat | Flat +15 | 8 + 2 per unit involved (cap 25) |
| Capo hit | No | Yes |

### Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — combat logic overhaul
- `src/components/EnhancedMafiaHexGrid.tsx` — enable capo hits

