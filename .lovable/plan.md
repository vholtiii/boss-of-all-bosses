

# Discrepancies Between Docs and Code

## Identified Issues

### 1. GAME_MECHANICS.md — Outdated Hitman Section (Section 4.5 & 12.3)

**Doc says**: Hitmen are promoted soldiers with levels 1-3, combat bonus +30%, maintenance 1.5x, requirements: training >= 8, loyalty >= 50, 3+ hits.

**Code does**: Hitmen are external contract killers ($15,000, no combat bonus, no promotion). This was changed but the docs were never updated.

**Fix**: Rewrite sections 4.5 and 12.3 in GAME_MECHANICS.md to match the contract system. Remove hitman promotion table, replace with contract description matching SOLDIER_RECRUITMENT_GUIDE.md section 6.

---

### 2. GAME_MECHANICS.md — Hit Victory Says "Territory Captured" (Section 7.1)

**Doc says (line 312)**: "Territory captured" on hit victory.

**Code does (line 3013)**: `tile.controllingFamily = null` — territory is set to neutral, requiring a separate Claim action.

**COMBAT_SYSTEM_GUIDE.md** is already correct ("Territory captured ❌, set to neutral").

**Fix**: Change GAME_MECHANICS.md line 312 from "Territory captured" to "Territory set to neutral (must Claim next turn)".

---

### 3. GAME_MECHANICS.md — Hit Success Formula Still Lists Hitman Bonus (Line 302)

**Doc says**: `+ hitman bonus (+30% + 10% per level)`

**Code does**: Comment on line 2990 explicitly says "hitmen no longer provide combat bonuses". No hitman bonus in the formula.

**Fix**: Remove `+ hitman bonus (+30% + 10% per level)` from the hit success formula in GAME_MECHANICS.md.

---

### 4. COMBAT_SYSTEM_GUIDE.md — Hitman Section Still Shows Combat Bonus (Section 5.3)

**Doc says**: "Combat bonus: +30% + 10% per level" and references hitmen participating in combat.

**Code does**: Hitmen are external contractors with zero combat involvement.

**Fix**: Already partially updated. Rewrite section 5.3 to say "Hitmen are external contract killers — see SOLDIER_RECRUITMENT_GUIDE.md. Combat bonus: None."

---

### 5. "Attack Territory" Button — Dead/Redundant Action

**UI shows**: An "Attack Territory" button ($15,000, 2 soldiers) in GameSidePanels.tsx (line 121-129).

**Code does**: Dispatches `{ type: 'attack_territory' }` — but `useEnhancedMafiaGameState` has NO handler for `'attack_territory'`. The actual hit system uses `'hit_territory'` triggered by hex-click context menus. This button does nothing.

**Fix**: Remove the "Attack Territory" button entirely from GameSidePanels.tsx (lines 121-129). The hit system is already accessible via the hex interaction menu and "Plan Hit".

---

### 6. Sabotage — Docs Say "Permanently Destroys Business", Code Only Reduces Income

**Memory/docs say**: Sabotage ($12,000, +15 heat) permanently destroys a business on a rival hex.

**Code does (line 2782-2786)**: Reduces income by 40-60% and adds +10 heat (not +15). Does NOT destroy the business — the business remains with reduced income.

**Fix**: Update code to match docs — sabotage should destroy the business (remove `tile.business`), cost $12,000, deduct money from player, and generate +15 heat instead of +10. Also add a check for soldier presence (on or adjacent).

---

### 7. Sabotage — No Money Deduction or Soldier Requirement in Code

**Docs say**: Costs $12,000, requires soldier on or adjacent to target.

**Code does**: `processSabotageHex` checks only if the tile has a business and is not player-owned. It does NOT deduct $12,000, and does NOT verify soldier presence.

**Fix**: Add `state.resources.money -= 12000` and a soldier-adjacency check to `processSabotageHex`.

---

### 8. GAME_MECHANICS.md — Hit Participants Missing Adjacent Units

**Doc says (line 296)**: "Selected unit + player units already on the target hex."

**Code does (lines 2920-2930)**: Includes units on hex AND adjacent units (matching COMBAT_SYSTEM_GUIDE.md).

**Fix**: Update GAME_MECHANICS.md line 296 to: "Selected unit + player units on the target hex + player units on adjacent hexes (adjacent units contribute at 90% effectiveness)."

---

## Summary of Changes

| # | File | Change |
|---|---|---|
| 1 | `GAME_MECHANICS.md` | Rewrite sections 4.5 and 12.3 for hitman contracts |
| 2 | `GAME_MECHANICS.md` | Fix hit victory: "territory set to neutral" |
| 3 | `GAME_MECHANICS.md` | Remove hitman bonus from hit formula |
| 4 | `COMBAT_SYSTEM_GUIDE.md` | Update section 5.3 hitman description |
| 5 | `GameSidePanels.tsx` | Remove dead "Attack Territory" button |
| 6-7 | `useEnhancedMafiaGameState.ts` | Fix sabotage: destroy business, deduct $12k, +15 heat, require soldier |
| 8 | `GAME_MECHANICS.md` | Fix hit participants to include adjacent units |

