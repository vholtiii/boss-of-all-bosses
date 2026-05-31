# More Offensive AI Decision Trees — Difficulty-Scaled

Same offensive expansion as before (proactive war, sabotage, supply-line targeting, retaliation, coordinated strikes, weak-rival piling-on, rebalanced gates), but **every new aggression knob is scaled by difficulty** so Normal mode feels noticeably more dangerous than today without becoming brutal. Hard inherits the full numbers below; Easy stays near current behavior.

The guiding principle: **Normal should feel like "the AI finally pushes back"**, not "the AI hunts me every turn." Hard is where the full offensive package lands.

---

## 1. Difficulty multiplier table

A single `aggressionScale` lookup applied to all new/raised offensive probabilities, target-pool routing chances, and bonus scores:

| Knob | Easy | **Normal** | Hard |
|---|---|---|---|
| `aggressionScale` (global) | **0.6** | **1.0** | **1.4** |
| Proactive war declaration roll | ×0.5 | ×1.0 | ×1.4 |
| AI sabotage per-turn chance | 15% base | **22% base** | 30% base |
| Supply-node target-pool routing chance | 55% | **70%** | 85% |
| Supply-node score bonus | +5 | **+7** | +9 |
| Retaliation Plan-Hit bonus | +10% | **+18%** | +25% |
| Coordinated strike cluster bonus | +0.05 kill | **+0.08 kill** | +0.10 kill |
| Vulnerable-rival override probability | 50% | **65%** | 80% |
| Plan Hit base (`AI_PLAN_HIT_CHANCE`) | 0.17 | **0.20** | 0.24 |
| Hitman war / no-war chance | 0.10 / 0.20 | **0.14 / 0.26** | 0.18 / 0.32 |
| HQ Assault base | 0.22 | **0.28** | 0.32 |

Today's behavior corresponds roughly to "Easy × 0.7," so even Easy under the new plan is mildly more offensive than the current Normal — but the jump from current → new Normal is the intended "more aggressive than before" delta the user asked for.

---

## 2. New decision trees (all gated through `aggressionScale`)

### A. Proactive war declaration
Insert before diplomacy block (~line 6848). Triggers (cool/warm heat + money runway ≥ 6):
- Posture `PRESSURE_LEADER` and rival within 2 hexes of victory target
- Already at `WAR` with a weaker rival but stronger untouched rival exists → second front
- `aggressive`/`unpredictable` + rival territory ≤ 60% of own + relationship ≤ 0 → roll `0.20 * aggressionLevel/100 * aggressionScale`
- `CLOSE_OUT` + nearest rival blocks last 1–2 needed hexes → forced

### B. AI sabotage (mirrors player `sabotage_hex`)
Gates: phase ≥ 2, `!aiOffenseDisabled`, posture ∈ {WAR, PRESSURE_LEADER, CLOSE_OUT, EXPAND+strategicOverride}, AI unit adjacent to enemy built business, heat tier ≤ hot. Personality mults: aggressive ×1.5, unpredictable ×1.3, opportunistic ×1.0, defensive/diplomatic ×0. Per-turn chance: `baseSabotageChance × warTargetMul × aggressionScale`.

### C. Supply-line targeting (your prior ask)
Compute once per AI per turn: `reachableEnemySupplyNodes` = rival supply nodes within `SUPPLY_STRIKE_RADIUS` of own HQ (4 small / 5 medium / 6 large) **or** within 3 hexes of any own safehouse.

- New `ScoreHexInputs.isSupplyNodeTarget` + `supplyNodeMul` → bonus `supplyNodeScoreBonus × supplyNodeMul`
- Posture mults: WAR 1.5, PRESSURE_LEADER 1.4, CLOSE_OUT 1.3, EXPAND 1.0, BUILD_ECONOMY 0.7, others 0.5
- +4 if node feeds business in AI's focus district; +5 if rival currently has supply deal with player
- New `supplySabotagePool`: priority warTargets (85%) → reachable supply nodes (`supplyNodeRoutingChance`) → safehouses (70%) → bounty player → default
- Defensive/diplomatic: opportunistic only (boost applies only when node already adjacent to one of their units)

### D. Retaliation
Add `recentlyAttackedBy: { family, severity, turn }` on AI opponent state, populated on player hit / sabotage on AI biz / safehouse capture / claim from AI / plan-hit execution. On AI's next turn, if severity ≥ moderate:
- Force `strategicOverride = true`
- +15 tension with attacker
- Bias target pool toward attacker (`warTargetMul × 1.5`)
- If aggressive/unpredictable: same-turn Plan Hit roll against attacker's nearest capo at `+retaliationPlanHitBonus`

Decays after one full turn.

### E. Coordinated multi-unit strike
After movement loop (~line 6659), posture ∈ {WAR, PRESSURE_LEADER, CLOSE_OUT}. Find clusters ≥ 2 friendly units within 2 hexes of same enemy hex; if `defenderCount ≤ cluster − 1`, queue coordinated assault with `+clusterKillBonus` flanking boost. Costs all cluster moves.

### F. Opportunistic weak-rival strike
"Vulnerable" = rival lost ≥ 2 units in last 2 turns OR heat tier ∈ {critical, rico}. All AIs except defensive/diplomatic shift target pool to vulnerable rival at `vulnerableOverrideProb`; vulnerable rival hexes get +6 score bonus; vulnerable rival's supply nodes stack with C.

---

## 3. Rebalanced existing gates (all difficulty-scaled where shown)

| Issue | Current | Fix |
|---|---|---|
| HQ Assault math impossible (base 0.15 − defense 0.30) | −0.15 | Base → 0.22/0.28/0.32 (E/N/H); cap stays 0.50 |
| `BUILD_ECONOMY` (default!) blocks Plan Hit & Hitman | `refuseNewWars: true` | `false` — let aggressive personalities initiate |
| `EXPAND` runway gate too tight | `moneyRunway > 4` | `> 2.5` |
| Plan Hit base too low | 0.15 | 0.17/0.20/0.24 (E/N/H) |
| Hitman war/no-war | 0.08/0.18 | 0.10/0.20, 0.14/0.26, 0.18/0.32 |
| Enemy-biz extortion thresholds | aggressive 0.6, opportunistic 0.5 | aggressive 0.70, opportunistic 0.55 (verify direction in code) |
| `strategicOverride` triggers | 4 narrow conditions | Add: posture WAR, recentlyAttackedBy.player, reachable supply node in strike radius, vulnerable rival nearby |
| Blind-hit heat caution too strict | aborts on any non-cool heat | Allow `warm` if aggressive/unpredictable + posture WAR/PRESSURE_LEADER |

---

## 4. Safeguards keeping Normal sane

- All new offense respects existing `aiOffenseDisabled`, `postureBlocksOffense`, heat ceilings, ceasefire/alliance guards, RICO freeze, and Lay-Low/Mattresses gates — none of these are weakened
- Defensive/diplomatic personalities keep their low extortion thresholds untouched (only aggressive/opportunistic get raised)
- Retaliation decays after one turn — no permanent vendetta state
- Coordinated strikes cap at one cluster per AI per turn
- Vulnerable-rival override has a cooldown: an AI cannot be the "pile-on target" two turns in a row from the same attacker
- Phase gates respected: sabotage ≥ Phase 2, hitman ≥ Phase 3, HQ assault ≥ Phase 4

---

## 5. Out of scope

- Mark-and-Escort for AI
- AI ↔ AI sabotage initiation
- Changing personality flattening during war (line 6102)
- New AI family powers
- UI beyond standard notifications

---

## Technical Details

**Files**
- `src/lib/ai-posture.ts` — `BUILD_ECONOMY.refuseNewWars=false`, loosen EXPAND runway, add `supplyNodeMul` to policy
- `src/lib/ai-strategy.ts` — add `isSupplyNodeTarget`, `supplyNodeMul`, `vulnerableRivalMul`, `supplyNodeBonus` to `ScoreHexInputs`; wire bonuses
- `src/lib/ai-difficulty.ts` (new, small) — exports `getAggressionScale(difficulty)` and per-knob lookup tables; single source of truth
- `src/hooks/useEnhancedMafiaGameState.ts` — 6 new decision blocks; compute `reachableEnemySupplyNodes` + `vulnerableRivals` once per AI per turn; populate `recentlyAttackedBy` in player-action resolution paths; thread `aggressionScale` into every new roll
- `src/types/game-mechanics.ts` — `recentlyAttackedBy?` on AI opponent; `SUPPLY_STRIKE_RADIUS_BY_MAP`; new constants
- `src/hooks/__tests__/ai-offensive-trees.test.ts` (new) — covers each tree per difficulty (Easy/Normal/Hard) to lock in scaling; supply-node detection by map size + safehouse extension; HQ-assault math; retaliation decay; vulnerable-rival cooldown

**Order inside `processAITurn` (per family)**
Existing 1–13 → **(NEW) compute reachableEnemySupplyNodes + vulnerableRivals + retaliation check** → existing 14 (movement/combat with supply-node scoring) → **(NEW) coordinated strike pass** → existing 15–16 → **(NEW) sabotage block** → existing 17–22 → **(NEW) proactive war check** → existing 23+

No DB or backend changes. Pure client-side logic + tests.
