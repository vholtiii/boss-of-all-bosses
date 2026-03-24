

# Update READMEs + Full Gameplay Analysis Report

This is a two-part task: (1) update all documentation files to match the current codebase, and (2) produce a comprehensive gameplay analysis report with simulation findings.

---

## Part 1: Update Documentation Files (4 files)

### README.md — Major Updates Needed
- **Soldier costs**: Says $500 — code has $1,500 (mercenary) and $300 (local recruit, requires 10 hexes)
- **Starting soldiers**: Says "3 per family" — code has variable counts: Gambino:4, Genovese:4, Lucchese:3, Bonanno:2, Colombo:1
- **Maintenance**: Says "Base rate" — code says $600/turn/soldier + $150/turn per empty claimed hex
- **HQ coordinates**: Listed wrong (e.g., Gambino says (-5,5,0), code is (-8,8,0))
- **Project structure**: References deleted files (CombatInterface.tsx, BusinessManagement.tsx, SoldierRecruitmentSystem.ts)
- **Core state**: Says "~2800 lines" — now ~5,463 lines
- **Missing systems**: No mention of free movement in connected territory, HQ Assault/Domination victory, Flip Soldier, Call a Sitdown, bankruptcy mechanic, difficulty system, district control bonuses, blind hit/civilian casualty system
- **Victory conditions**: Missing Domination path (eliminate all 4 families)
- **Capo promotion**: Says "5 conflicts, 60 loyalty, 3 training" — code requires victories≥5, loyalty≥80, training≥3, toughness≥5, racketeering≥5

### GAME_MECHANICS.md — Major Updates Needed
- Same cost/stat discrepancies as README
- Missing: Free movement system, HQ Assault, Flip Soldier, Sitdown, Domination victory, Bankruptcy, Difficulty modes
- Soldier recruitment section incomplete (no mercenary vs local distinction)
- HQ coordinates wrong

### COMBAT_SYSTEM_GUIDE.md — Minor Updates
- Missing: HQ Assault combat mechanics
- Victory conditions missing Domination
- Otherwise mostly accurate

### HEADQUARTERS_SYSTEM_GUIDE.md — Updates Needed
- HQ coordinates wrong
- Says "HQ cannot be captured or destroyed" — now HQ CAN be assaulted (elimination mechanic)
- Missing: Call a Sitdown boss action, HQ defense bonuses from soldiers, Flip Soldier mechanic
- Starting soldier counts wrong

### SOLDIER_RECRUITMENT_GUIDE.md — Updates Needed
- Costs wrong ($500 vs $1,500/$300)
- Missing mercenary vs local recruit distinction
- Capo promotion requirements outdated
- Says 3 starting soldiers — variable per family
- Maintenance section incomplete

---

## Part 2: Gameplay Simulation & Analysis Report

### Simulation 1: Aggressive Expansion as Gambino (Combat Family)

**Setup**: Gambino, normal difficulty. 4 soldiers, 1 capo, $50K. +25% combat, +15% intimidation.

**Turns 1-3**: Deploy soldiers to adjacent hexes. Move outward, claim neutral territory. Capo deployed to highest-income business hex for 100% income.
- Income: ~$500-1500/turn from 1-2 businesses (10% passive on uncovered, 100% on capo hex)
- Costs: 4 soldiers * $600 = $2,400 + empty hex upkeep ($150 * ~8 empty hexes) = $3,600/turn
- Net: -$2,100 to -$3,100/turn. Money at ~$42K by turn 3.

**Turns 4-8**: AI has early game boost (+2 actions, +2 tactical). AI expands aggressively. Player needs to extort and claim to keep up. Each claim costs 1 action point (2-3 available). Player can claim ~6-9 hexes per 3 turns.
- By turn 8: ~15-20 hexes. Money at ~$30K. Need businesses under capo for income.

**Turns 9-15**: Expansion slows. AI families have 5-10 hexes each. Borders form. Combat begins.
- Hitting enemy hexes costs heat, risks soldiers. With Gambino +25% combat, hits succeed ~75-90% vs single defenders.
- Problem: soldier casualties (20% on victory, 40% on defeat) drain forces.

**Victory path**: Territory Domination (60 hexes) at ~turn 25-30, or Economic ($50K/turn) if capos cover enough businesses.

### Simulation 2: Economic as Genovese (Business Family)

**Setup**: Genovese, normal difficulty. 4 soldiers, 1 capo, $50K. +30% business income, +20% laundering, +25% upgrade.

**Turns 1-5**: Similar expansion but focus on hexes WITH businesses. Capo on highest-income hex generates 130% income. Build legal businesses ($12K-35K) for long-term revenue.
- Better income trajectory but still negative early due to maintenance.
- Construction takes 3 turns (2 with capo present due to 1.5x speed).

**Turns 5-10**: First legal businesses complete. Revenue climbs. Less combat-focused, more diplomatic.
- Economic victory path viable but requires $50K/month — needs 10+ high-income hexes with capos (max 3 capos + passive).

**Result**: Genovese has smoother mid-game economy but struggles with territory defense.

### Critical Issues Found

#### CRITICAL: Negotiation Never Rolls for Success (Severity: HIGH)
`processNegotiation()` (line 5309) applies ceasefire/alliance/bribe_territory directly without checking against the defined `baseSuccess` rates. Every negotiation auto-succeeds. The `NEGOTIATION_TYPES` success rates (50%/40%/30%) are defined but never used.

**Fix**: Add success roll check in processNegotiation using config.baseSuccess + capo personality bonus + influence modifier.

#### CRITICAL: Hit Sets Territory to `null` Instead of `'neutral'` (Severity: HIGH)
Line 4957: `tile.controllingFamily = null`. All other code checks `=== 'neutral'`. This means hit-cleared hexes become invisible to territory logic — they can't be claimed, extorted, or counted. Player must re-engage with a broken hex.

**Fix**: Change `null` to `'neutral'` on line 4957.

#### HIGH: Capo Promotion Is Nearly Impossible (Severity: HIGH)
Requirements: victories≥5 AND loyalty≥80 AND training≥3 AND toughness≥5 AND racketeering≥5. A single soldier needs:
- 5 successful hits/extortions (victories cap at 5, so exactly 5 needed)
- 5 survived combats (toughness cap at 5)
- 5 successful extortions (racketeering cap at 5)
- Exactly 80 loyalty (soldier cap is 80)
- 3 turns deployed away from HQ (training cap at 3)

This requires the same soldier to participate in 5+ combats, 5+ extortions, AND reach max loyalty. At 2-3 actions/turn, this takes 10-15 turns minimum. Meanwhile AI can promote capos using the same requirements — they'll also struggle.

**Fix**: Reduce requirements to: victories≥3, loyalty≥60, training≥2, toughness≥3, racketeering≥3. Or increase stat caps.

#### HIGH: Unbalanced Starting Soldiers (Severity: MEDIUM)
Gambino/Genovese start with 4, Lucchese with 3, Bonanno with 2, Colombo with 1. Colombo is severely disadvantaged — 1 soldier can only perform 1 action per turn vs Gambino's 4 soldiers providing 4x the action coverage.

**Fix**: Normalize to 3 soldiers each, or compensate weaker families with bonus money/bonuses.

#### MEDIUM: AI Respect Never Grows (Severity: MEDIUM)
`opponent.resources.respect` is initialized at 15-25 and never updated in `processAITurn()`. AI families never reach the respect≥50 threshold for bonus actions, giving the player an inherent action advantage.

**Fix**: Add AI respect growth in processAITurn based on territory + combat, mirroring player formula.

#### MEDIUM: AI Soldiers Can Never Qualify for HQ Assault (Severity: MEDIUM)
AI HQ assault requires toughness≥4 and loyalty≥70. AI soldiers start with toughness:0 and loyalty:40-70. Toughness only grows +1 per survived combat, and AI soldiers are often killed before reaching 4. The AI assault mechanic after turn 12 will almost never trigger.

**Fix**: Add toughness growth for AI soldiers that survive end-of-turn combat encounters. Or lower AI assault requirements.

#### MEDIUM: Double Economy System (Severity: LOW-MEDIUM)
Two separate business systems exist:
1. Hex-based (processEconomy) — the real system
2. Legacy (state.businesses[], performBusinessAction) — builds restaurants/casinos/etc.

Both contribute income separately. The legacy system's businesses are NOT on the hex map and generate income invisibly. This is confusing and could cause unintended income stacking.

**Fix**: Remove legacy business system (performBusinessAction build_legal/build_illegal) or merge into hex-based system.

#### LOW: Community Upkeep Punishes Expansion
$150/empty hex means claiming 30 empty hexes costs $4,500/turn in upkeep with no income. Players are punished for claiming territory without businesses.

**Suggestion**: Reduce to $50/hex or cap at 20 hexes, or make upkeep scale with distance from HQ.

#### LOW: Free Movement BFS Performance
`getConnectedTerritory()` runs a BFS over all hexes every time a soldier is selected or moved. With 331 hexes and potentially 60+ owned, this is O(n) per call. Not a problem now but could lag with very large territories.

### AI Behavior Assessment

**Strengths:**
- AI personality system creates distinct strategies (aggressive Colombo, defensive Bonanno)
- Early game boost (turns 1-8) prevents AI from falling behind
- AI claims, extorts, and builds safehouses appropriately
- AI respects stacking limits and ceasefire/alliance rules

**Weaknesses:**
- AI never negotiates proactively (only diplomatic AI signals interest, player must initiate)
- AI doesn't use free movement in connected territory (uses basic adjacency)
- AI never builds legal businesses
- AI respect stagnation limits bonus actions
- AI soldiers rarely qualify for HQ assault
- AI capo deployment always goes to highest-income hex — predictable and exploitable

### Summary Priority List

| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| 1 | Negotiation auto-succeeds (no roll) | CRITICAL | Small |
| 2 | Hit sets territory to null not 'neutral' | CRITICAL | Tiny |
| 3 | Capo promotion requirements too high | HIGH | Small |
| 4 | Unbalanced starting soldiers | HIGH | Small |
| 5 | AI respect never grows | MEDIUM | Small |
| 6 | AI can't qualify for HQ assault | MEDIUM | Small |
| 7 | Legacy double economy system | MEDIUM | Medium |
| 8 | Update all 5 documentation files | DOCS | Large |

## Files to Modify
- `README.md` — full rewrite of game data
- `GAME_MECHANICS.md` — update all stats, add new systems
- `COMBAT_SYSTEM_GUIDE.md` — add HQ assault, domination victory
- `HEADQUARTERS_SYSTEM_GUIDE.md` — update coordinates, add assault/sitdown
- `SOLDIER_RECRUITMENT_GUIDE.md` — update costs, requirements, add local recruit
- `src/hooks/useEnhancedMafiaGameState.ts` — fix null→'neutral' (line 4957), add negotiation roll, fix AI respect growth
- `src/types/game-mechanics.ts` — adjust capo promotion requirements

