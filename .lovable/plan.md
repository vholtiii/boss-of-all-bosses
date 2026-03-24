

# Gameplay Simulation Report — 3 Strategies Tested

## Simulation 1: Aggressive Territorial Rush (Gambino)

**Strategy**: Deploy all 4 soldiers outward turn 1, claim/extort every turn, attack enemy territory early.

**Turn-by-turn**:
- T1: Deploy 4 soldiers to adjacent hexes. Capo deploys to nearest business hex (auto-claims + auto-extorts). ~$3K one-time extortion income.
- T2: Advance phase to Tactical → fortify 1 border soldier. Action phase → claim 2 neutral hexes, extort 1 business.
- T3: Soldiers move outward using free movement across connected territory. Contact enemy border ~turn 4.
- T4-6: Hit enemy hexes (Gambino +25% combat, +25% hitSuccess = 75-90% on 1v1). Hexes reset to neutral after hit → must spend next action turn to claim.
- T7-10: AI early-game boost ends. Player has 15-20 hexes. Income ~$2K-5K/turn from passive businesses. Maintenance: 4 soldiers × $600 = $2,400 + empty hex upkeep.

**Issues Found**:

### BUG: Soldier Deploy from HQ Never Checks Stacking Limit
Lines 1533-1559: `deployUnit()` for soldiers either moves one from HQ or spawns from reserve pool. Neither check if the target hex already has 2 units. A player can stack unlimited soldiers via HQ deployment. AI deployment correctly checks `unitsHere.length < 2` (line 2613) but player deployment does not.

### BUG: Free Movement Bypasses Zone of Control Completely  
Lines 1142-1147: ZoC check is skipped when `isFreeMove === true`. This means a soldier on connected territory can freely move through hexes adjacent to enemies without stopping. In real gameplay, this allows teleporting a soldier past a frontline to attack behind enemy lines — breaks the entire frontline concept.

### BUG: AI Soldiers Claim Neutral Territory Without Action Points on Arrival
Lines 2962-2978: AI extorts neutral businesses and claims the hex in the same "for" loop as their action phase. However, on line 2917-2933, when AI moves onto neutral territory with no enemies, soldiers DON'T auto-claim (correct per rules). But then in the action phase loop (line 2962), any AI soldier standing on a neutral hex with a business claims it for free. This double-pass means AI soldiers effectively auto-claim any neutral hex they walk onto if it has a business — bypassing the intent that only capos auto-claim.

---

## Simulation 2: Economic Turtle (Genovese)

**Strategy**: Minimal expansion, focus on businesses and capo income. Build legal businesses. Avoid combat.

**Turn-by-turn**:
- T1-3: Deploy capo to highest-value hex (auto-claims, auto-extorts). Deploy soldiers defensively around HQ. Claim 6-8 adjacent hexes.
- T4-8: Capo generates 130% income (+30% Genovese bonus). Build a legal business ($12K-35K, 3-turn construction, 2 with capo). Use "Call a Sitdown" once for defense if threatened.
- T9-15: Legal businesses complete. Revenue should climb. Negotiate ceasefires with aggressive families.

**Issues Found**:

### BUG: Legal Business Construction Never Progresses
The `performBusinessAction` handler (around line 4200) processes `build_legal`/`build_illegal` actions and sets `turnsUntilComplete` and `constructionProgress`/`constructionGoal` on the hex business. However, **nowhere in `endTurn` or `processEconomy` does construction progress increment**. Legal businesses created via `performBusinessAction` will NEVER complete. The only construction progress code is in `processEconomy` (around line 2380-2400) but it only processes the legacy `state.businesses[]` array, not hex-based businesses.

This is a **game-breaking bug for economic strategies**. The Genovese family bonus (+25% business upgrade) is worthless because no business construction ever finishes.

### ISSUE: Capo Auto-Extortion Applies to Store Fronts (Legal Businesses)
Lines 1171-1183: When a capo moves onto a neutral hex with a business, it auto-extorts. But store fronts are legal businesses (`isLegal: true`). Auto-extorting a legal business doesn't make thematic sense and the payout ($1,500) is low. This isn't a bug but feels wrong — legal businesses should perhaps be "acquired" not "extorted."

### BUG: `resources.respect` and `reputation.respect` Are Two Separate Values
Line 5044-5046: Hit victory adds to `state.resources.respect`. Line 2237: End-of-turn respect growth writes to `state.reputation.respect`. These are **different fields** and they're never synced. `resources.respect` is used for the bonus action threshold check (line 813), while `reputation.respect` is displayed in the UI. A player could have 50 `resources.respect` (getting bonus actions) while `reputation.respect` shows 10, or vice versa.

---

## Simulation 3: Diplomatic Schemer (Lucchese)

**Strategy**: Scout everything, plan hits, negotiate ceasefires, use hitmen, flip soldiers. Target economic victory.

**Turn-by-turn**:
- T1-3: Deploy soldiers. Scout enemy hexes (+25% intel bonus from Lucchese). Plan hits on enemy capos.
- T4-6: Execute planned hits. Negotiate ceasefires with 2 families (Lucchese: +20% hitSuccess helps Plan Hits). Use 15% heat reduction bonus to stay under radar.
- T7-12: Hire hitmen ($15K each, max 3). Target isolated enemy units. Flip soldiers near enemy HQs.
- T13+: Attempt HQ assaults using flipped-soldier bonus.

**Issues Found**:

### BUG: Hitman Contracts Never Execute
The `hitmanContracts` array is populated when hiring (around line 4100), but there is **no code in `endTurn` that processes hitman contracts** — no countdown, no execution, no removal. Hitmen are paid for ($15K) and sit in the array forever doing nothing. The constants `HITMAN_OPEN_TURNS`, `HITMAN_BASE_SUCCESS`, etc. are defined but never used in gameplay logic.

### BUG: Plan Hit "Execute" Uses Wrong Hex When Target Moves
Lines 4900-4940: The execute_planned_hit action redirects to the target's current hex. But the `targetOnCurrentHex` check (line 4904) checks if the target unit is on `targetQ/targetR/targetS` — which is the hex the PLAYER clicked, not the target's actual position. If the player clicks the original planned hex but the target moved, neither `targetOnOriginalHex` nor `targetOnCurrentHex` is true, triggering the fail path even though the target exists elsewhere on the map.

### BUG: Flip Soldier Targets Only Soldiers with Loyalty > 60
Line 4703: `uStats.loyalty > 60`. The intent was that loyal soldiers are HARDER to flip, not that only loyal ones can be targeted. Low-loyalty enemy soldiers (loyalty 30-50) should be EASIER to flip but they're excluded entirely. This is backwards.

### ISSUE: AI Never Uses Hitmen
AI families have no hitman hiring logic. Only the player can hire hitmen, but since hitman contracts never execute (bug above), this is doubly broken.

---

## Summary of All Issues Found

| # | Issue | Severity | Category |
|---|-------|----------|----------|
| 1 | Legal business construction never progresses | **CRITICAL** | Economy broken |
| 2 | Hitman contracts never execute | **CRITICAL** | Feature dead |
| 3 | `resources.respect` vs `reputation.respect` desync | **HIGH** | State bug |
| 4 | Player deploy doesn't check hex stacking limit | **HIGH** | Exploit |
| 5 | Free movement bypasses Zone of Control | **HIGH** | Balance exploit |
| 6 | Flip Soldier excludes low-loyalty targets (inverted logic) | **HIGH** | Logic bug |
| 7 | Plan Hit execute fails when target relocated (wrong hex check) | **MEDIUM** | Logic bug |
| 8 | AI soldiers auto-claim neutral business hexes via action phase double-pass | **MEDIUM** | AI fairness |

## Proposed Fixes

### Fix 1: Hex-based business construction progress
In `endTurn` (after `processEconomy`), iterate `hexMap` tiles where `business.constructionProgress !== undefined && constructionProgress < constructionGoal`. Increment progress +1/turn (+0.5 extra if capo present). When complete, clear construction fields.

### Fix 2: Hitman contract execution
In `endTurn`, tick down `hitmanContracts[].turnsRemaining`. When 0, roll success using the defined constants (`HITMAN_BASE_SUCCESS`, etc. based on target hex type). On success, kill target unit. On failure, refund 50%, alert target family.

### Fix 3: Sync respect fields
After all end-of-turn calculations, add: `state.resources.respect = Math.round(state.reputation.respect)`. Use `reputation.respect` as the source of truth everywhere.

### Fix 4: Stacking limit on player deploy
In `deployUnit()`, before placing a soldier, check: `deployedUnits.filter(u => u.q === target.q && ...).length < 2`. If 2+ units already present (and target is not HQ), block deployment.

### Fix 5: Zone of Control on free movement
When `isFreeMove && isAdjacentToEnemy(target)`, set `remainingMoves = 0` (stop movement). Free movement should skip move COST but not ZoC.

### Fix 6: Flip Soldier — invert loyalty check
Change line 4703 from `uStats.loyalty > 60` to `uStats.loyalty < 80`. Low-loyalty soldiers (< 60) get +15% flip bonus; high-loyalty (> 70) get -10% penalty. Any soldier loyalty < 80 can be targeted.

### Fix 7: Plan Hit redirect — find target's actual hex
In execute_planned_hit, look up the target unit's current position dynamically instead of using the clicked hex. Route the attack to wherever the target unit actually is.

### Fix 8: AI action phase — skip already-owned hexes
In AI action phase Priority 1 (line 2962), add check: `tile.controllingFamily !== fam` before letting soldiers claim. They should only extort/claim neutral hexes, not re-process owned ones.

## Files to Modify
- `src/hooks/useEnhancedMafiaGameState.ts` — all 8 fixes
