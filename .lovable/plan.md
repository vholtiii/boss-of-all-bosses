# Balance Rebalance Plan

Addresses the four findings from the audit plus AI-side parity. All edits live in `src/hooks/useEnhancedMafiaGameState.ts`, `src/components/HeadquartersInfoPanel.tsx`, `src/components/HitmanPanel.tsx`, and `src/components/GameSidePanels.tsx`.

---

## 1. Lay Low — close the loophole

**Problem:** Free, no cooldown, allows recruit/scout/fortify → infinite heat-wash loop.

### Changes
- **Cooldown:** 7 turns. Add `layLowCooldownUntil` to game state. Disabled with tooltip "Available in N turns" until expired.
- **Cost:** Stays free (per prior decision) but the cooldown gates spam.
- **Expanded block list** (extend `layLowBlockedActions` set, line ~6933):
  - Already blocked: `hit_territory`, `execute_planned_hit`, `extort_territory`, `sabotage_hex`, `claim_territory`, `assault_hq`, `flip_soldier`, `plan_hit`, `hire_hitman`.
  - **Add:** `recruit_soldier`, `recruit_loyal_soldier` (any recruit action types in the switch). You're hiding, not hiring.
- **Still allowed:** scout, fortify, safehouse, escort, legal construction, diplomacy, abandon, defense/law actions, donations.
- **HQ panel UI:** Button shows three states — "Lay Low (3 turns) — Free", "Active — N turns left" (disabled), "Cooldown — N turns" (disabled with tooltip).
- **Heat double-mult fix:** `applyPlayerHeat` already applies `HEAT_GAIN_MULT`. Audit ambient heat at line 3958 — currently does `Math.floor((heatFromBiz / 3) * HEAT_GAIN_MULT)` and then likely passes through `applyPlayerHeat` again. Confirm and remove the inner multiplication so passive heat isn't 1.69× (1.30²).

---

## 2. Hitman vs Plan Hit — give Hitman a real role

**Problem:** Plan Hit dominates — free tactical action, grants loot/respect, low risk.

### Changes (per your direction)
- **Cost stays at $30,000.**
- **New capability — can target unscouted units**, but only if the player has at least a **bribed Police Captain** (Tier 2 corruption) on the target's family/district. Without Captain intel, behavior is unchanged (must be a known/scouted target).
  - Implementation: in the `hire_hitman` case (line ~7547), allow target selection to include unscouted enemy units when `corruption.bribedOfficials` includes a Captain whose jurisdiction covers the target's hex/district.
  - UI in `HitmanPanel.tsx`: when Captain is bribed, show a new "Blind Contracts (via Captain intel)" tab listing rival families' hidden unit counts; player picks family + unit type; backend resolves to a random matching enemy unit.
- **Clear role split surfaced in tooltips:**
  - Plan Hit → "Cheap, loud, requires capo near target. +Respect, +Loot, generates heat."
  - Hitman → "$30k, anonymous (no tension, low heat), can reach unscouted targets if you have Captain intel."

---

## 3. Difficulty — apply modifiers to ongoing economy

**Problem:** `playerMoneyMult` only touches starting cash; mid/late-game difficulty is identical across settings.

### Changes
- **Apply `playerMoneyMult` to ongoing income**, not just initial bankroll. Multiply legal + illegal income calculations in `business-income-calculation` path by `state.difficultyModifiers.playerMoneyMult`.
  - Easy: 1.5× ongoing income.
  - Normal: 1.0×.
  - Hard: 0.75× ongoing income.
- **`aiIncomeMult`** is already declared but verify it actually scales AI per-turn income. If not, wire it into the AI economy tick.
- **`eventCostMult`** — apply to random event monetary penalties/costs so Easy = cheaper events, Hard = pricier.
- Update tests in `src/hooks/__tests__/difficulty-modifiers.test.ts` to cover ongoing-income scaling (currently only asserts starting cash).

---

## 4. Defense stacking — soft cap

**Problem:** Fortified HQ + Mattresses + purged moles + Captain bribe makes HQ assault near-impossible for AI.

### Changes
- Introduce a **defense cap of +60% total** on a single hex. Sum of all multipliers (fortify +25%, mattresses HQ +X%, district control bonus, safehouse +10%, capo presence) is clamped at 1.60× before combat resolution.
- Note: this affects the player's HQ AND any AI HQ — symmetric.
- Implement at the combat resolution site around line 8901 (`mattressesState defense bonus` block).

---

## 5. AI parity — Lay Low + Mattresses for AI families

**Problem:** Player has two strategic panic buttons the AI can't use.

### State additions per AI opponent (in `AIOpponent.resources` or a new `aiState` map keyed by family):
- `layLowActiveUntil`, `layLowCooldownUntil`
- `mattressesActiveUntil`, `mattressesCooldownUntil`

### Trigger logic (heat-baseline + personality-weighted)
Run during AI turn, before action selection:

**Lay Low triggers when:**
- AI heat proxy ≥ 60, OR
- AI has lost ≥2 soldiers in last 2 turns to arrests/hits.

Personality multipliers on the trigger probability:
- Defensive: ×1.5
- Diplomatic: ×1.3
- Opportunistic: ×1.0
- Aggressive: ×0.4
- Unpredictable: ×0.8 + ±0.4 random jitter

**Mattresses triggers when:**
- AI HQ defense breached recently (assaulted in last turn), OR
- AI lost a capo in the last 2 turns, OR
- AI is at war (tension ≥80) with the player AND adjacent to player units.

Same personality multipliers apply.

### AI behavior while active
- **Lay Low:** AI skips offensive actions in its action loop (gate the `claim/extort/hit/sabotage/plan_hit/flip` branches behind `!isAILayingLow(fam)`). Heat decay still 2/turn; arrest immunity for that family's soldiers.
- **Mattresses:** AI units get the defense bonus on their hexes, no movement, no offense. Same income penalty as the player gets.

### UI surfacing
- Rival cards in `GameSidePanels.tsx` show a 🤫 / 🛏️ badge when an AI family is in either state, with turns remaining. Helps the player recognize "they're hiding — now's the time to consolidate" vs "they're hunkered — don't bother attacking."
- Turn report includes "🤫 Bonanno went to ground (3 turns)" / "🛏️ Lucchese hit the mattresses (4 turns)" entries.

---

## Files Touched
- `src/hooks/useEnhancedMafiaGameState.ts` — Lay Low cooldown + recruit block, heat double-mult fix, Hitman blind contracts via Captain, difficulty income scaling, defense cap, AI Lay Low + Mattresses state/triggers/gates.
- `src/components/HeadquartersInfoPanel.tsx` — three-state Lay Low button with cooldown display.
- `src/components/HitmanPanel.tsx` — "Blind Contracts" tab unlocked by Captain bribe.
- `src/components/GameSidePanels.tsx` — Rival family Lay Low / Mattresses badges.
- `src/hooks/__tests__/difficulty-modifiers.test.ts` — extend to cover ongoing income scaling.
- Memory: update `mem://gameplay/police-heat-system` (cooldown + recruit block), `mem://gameplay/hitman-contracts` (Captain-gated blind contracts), `mem://gameplay/difficulty-levels` (ongoing income), `mem://gameplay/ai-behavior` (Lay Low/Mattresses parity).

## What Doesn't Change
- Heat decay rate (2/turn).
- Heat tier thresholds (40/50/70/90) and penalties just set in the previous pass.
- Lay Low duration (3 turns) and afterglow (2 turns, -10 informant flip).
- Plan Hit mechanics, capo abilities, fortification cap (4/family).
- Mattresses cost/duration (player side) — only parity additions for AI.
