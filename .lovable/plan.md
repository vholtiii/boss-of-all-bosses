

# AI Mechanics Review: Issues & Fixes

## Issues Found

### 1. AI auto-claims territory by just walking in (line 2708-2710)
When an AI unit moves to an unoccupied enemy/neutral hex, it instantly takes ownership — no "Claim" action needed. Players must spend an action point to claim. This is a fundamental fairness violation.

**Fix**: AI movement should NOT auto-claim enemy territory. For neutral hexes, it's acceptable (matches capo auto-claim). For enemy hexes, the AI should need to perform a separate claim-like step that costs one of its implicit action points (give AI 2-3 action points per turn, same as the player).

### 2. AI units don't respect hex stacking limits during movement (line 2477-2486)
The deploy code checks `unitsHere.length < 2` (line 2438), but the movement code has no such check. AI can pile unlimited units onto one hex.

**Fix**: Add a stacking check in movement valid-move filtering — skip hexes with 2+ friendly units.

### 3. AI moves INTO enemy hex before resolving combat (line 2580-2582)
The AI unit's position is set to the target hex, THEN combat happens. If the AI "loses" or retreats, the unit is still sitting on the enemy hex. The unit should stay put if combat doesn't clear the hex.

**Fix**: Only update unit position after combat resolution. If enemies remain on the hex after combat, the attacking unit stays at its original position.

### 4. AI plan hit intel leak (line 2859)
`turnReport.aiActions.push(... 'Planned a hit against a player capo')` — this tells the player outright that a hit is being planned, which should be hidden without intel (same fog-of-war principle).

**Fix**: Only push this to turnReport if player has intel (scouted hex or police bribe). Otherwise, the player should only learn about it from the existing side-panel intel warning system.

### 5. AI deployment auto-claims territory (line 2452-2455)
When AI deploys a soldier to a neutral hex, it instantly claims it. Player soldiers deploying to neutral hexes don't auto-claim (they need a Claim action). Capos auto-claim for both, which is fine.

**Fix**: AI soldier deployment should NOT auto-claim neutral hexes. Only AI capo deployment should auto-claim (matching player rules).

### 6. No action budget for AI
The player has 2-3 action points and 3 tactical points per turn. AI has unlimited implicit actions — it can fight, claim, and extort as many times as units allow. This makes AI disproportionately powerful.

**Fix**: Give AI a budget: 3 tactical actions + 2 combat/claim actions per turn (matching player). Track these during the AI loop and stop when exhausted.

## Implementation Plan

### File: `src/hooks/useEnhancedMafiaGameState.ts`

**A. Add AI action budget** (~line 2465)
```
let aiActionsRemaining = 2 + (opponent.resources.respect >= 50 ? 1 : 0);
let aiTacticalRemaining = 3;
```
Combat engagements and territory claims deduct from `aiActionsRemaining`. Movement and fortify deduct from `aiTacticalRemaining`.

**B. Fix combat positioning** (~line 2580-2682)
Save original position before moving. Only commit the position change if:
- No enemies on hex, OR
- Combat resolved and enemies cleared

If enemies remain, revert to original position and break movement.

**C. Add stacking limit to movement** (~line 2477)
Add filter: `state.deployedUnits.filter(u => u.family === fam && u.q === n.q && u.r === n.r && u.s === n.s).length < 2`

**D. Remove soldier deploy auto-claim** (~line 2452-2455)
Only auto-claim if the deployed unit is a capo, not a soldier.

**E. Remove walk-in territory capture** (~line 2708-2710)
For enemy-controlled hexes with no defenders: AI should spend an action point to claim instead of auto-capturing. For neutral hexes: allow auto-claim (matches capo behavior).

**F. Gate plan hit intel** (~line 2859)
Only push to turnReport if player has intel via scouted hexes or active police bribes.

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — all six fixes above

