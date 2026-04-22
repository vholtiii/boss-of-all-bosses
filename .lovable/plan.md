

# Balance Audit & Tuning Plan

A three-part audit of the current balance, with specific tuning recommendations and tests to lock them in. No code changes yet — this plan presents findings and proposes the changes for your approval.

## Part 1 — Family Balance (player-side)

### Findings

Recent edits left a few inconsistencies between **starting resources**, **family bonuses**, and **family identity**:

| Family    | Money | Soldiers | Influence | Pol.Power | Respect | Bonuses                                                        | Identity match? |
|-----------|-------|----------|-----------|-----------|---------|----------------------------------------------------------------|-----------------|
| Gambino   | 60k   | 4        | 20        | 40        | 20      | +25% combat, +10% income, +15% intim.                          | ✅ "Top dog" reads correctly |
| Genovese  | 45k   | 4        | 15        | 25        | 25      | +30% biz income, +20% laundering, +25% upgrade discount        | ⚠️ Strong economic bonuses **+** mid-tier money — slightly overtuned |
| Lucchese  | 70k   | 3        | 12        | 20        | 10      | +25% hit success, +15% heat reduction, +20% intel              | ⚠️ Highest money + "Easy" tag + best hit kit = strongest start |
| Bonanno   | 40k   | 2        | 8         | 15        | 25      | +20% extortion, +25% intim., +15% fear                         | ✅ Slow defensive starter |
| Colombo   | 35k   | 1        | 12.5      | 10        | 15      | +20% income, -15% recruit cost, +15% fear (note: combat was nerfed to 0%) | ⚠️ "Hard" with 1 soldier + lowest money is brutal — likely too punishing |

### Proposed tuning

1. **Lucchese is the de-facto easy mode.** $70k + best hit kit + lowest respect floor is too generous. Drop money **70k → 55k**. Keep the "Easy" tag — they still have surgical precision and heat reduction.
2. **Colombo is too punishing for "Hard."** 1 soldier + $35k + 0% combat bonus turns Phase 1 into a coin-flip. Bump money **35k → 42k** (still lowest) and soldiers **1 → 2** (ties Bonanno). Identity "scrappy survivor" is preserved; the game just becomes playable.
3. **Genovese slight pull-back.** Their economy bonuses are exceptional (+30% biz / +20% laundering / +25% upgrade). Drop starting money **45k → 40k** to lean into the "compounds over time" identity.
4. **Gambino unchanged.** Currently well-tuned: high money + high pol.power + medium respect, balanced by being a target.
5. **Bonanno unchanged.** Defensive identity reads correctly.

### Resulting starting-money ladder
Gambino 60k > Lucchese 55k > Colombo 42k > Genovese 40k > Bonanno 40k

## Part 2 — Gameplay Balance (systemic)

### Findings

| System | Status | Issue |
|---|---|---|
| Phase gates (Turn 9 / 18 / 30) | ✅ | Good pacing |
| Phase 1 dampener (×0.5 passive respect, starting respect 15) | ✅ | Working as intended |
| Diminishing returns on respect/influence | ✅ | Good — combat spikes are still the path to 80+ |
| **Mercenary recruit $1,500 vs Loyal $300** | ⚠️ | $300 with 10+ hex gate is too cheap once unlocked — trivializes Phase 2 |
| **Hitman $30,000 in Phase 3** | ⚠️ | Costed when Phase 3 income makes this trivial; success rates (90/65/55/40) are also high |
| **Soldier maintenance $600/turn** | ✅ | Creates real pressure with 8+ soldiers |
| **Empty-hex upkeep $150** | ✅ | Encourages abandon-territory action |
| **Police heat tiers (30/50/70/90)** | ✅ | Tuned well, RICO 5-turn fuse appropriate |
| **Blind hit 150% heat / -20% success** | ✅ | Risk/reward reads correctly |
| **Phase 4 Commission Vote $15k + 1 action** | ⚠️ | Cost trivial relative to its win condition |

### Proposed tuning

1. **Loyal recruit cost: $300 → $600.** Still half of mercenary, still strong, but no longer a dump-it-all-on-soldiers solve.
2. **Hitman base cost: $30,000 → $40,000.** Keeps Phase 3 player honest; alternative: lower fortified-target success 65% → 55%.
3. **Commission Vote cost: $15,000 → $35,000.** Diplomatic victory should feel expensive.
4. **No changes to** maintenance, heat tiers, hit success, phase gates — these are working.

## Part 3 — AI vs Player Balance

### Findings

AI opponent initialization (line 1101):
```
money: 35,000 + random(0..14,999)   → 35k–50k
soldiers: 2 (flat)
influence: 8 + random(0..7)         → 8–15
respect: 15 + random(0..9)          → 15–24
```

| Aspect | Status | Issue |
|---|---|---|
| AI starting money 35–50k | ✅ | Comparable to lower-mid player range |
| **AI starting soldiers: flat 2** | ⚠️ | Player can start with 4 (Gambino/Genovese) — AI is materially behind from turn 1 |
| AI influence 8–15 | ✅ | Documented as intentional flat range |
| AI respect 15–24 | ✅ | Bypasses Phase 1 dampener intentionally to give early diplomatic weight |
| Difficulty: Easy 0.6× / Hard 1.5× AI income | ✅ | Good per-turn scaling |
| AI recruit cap 18 base + difficulty bonus | ✅ | Prevents runaway armies |
| AI minimum income (capped at turn 20) | ✅ | Anti-poverty floor works |
| **AI starting soldiers does NOT scale with difficulty** | ⚠️ | Hard mode should give AI more starting bodies, not just income |

### Proposed tuning

1. **AI starting soldiers: flat 2 → range 2–3.** `2 + Math.floor(Math.random() * 2)` so some AI start at 3 (matches/beats Bonanno-Colombo), keeps unpredictability.
2. **Difficulty-scaled AI starting soldiers:** add `+1` on Hard, `-0` on Easy. So AI gets 2–3 (Normal/Easy) or 3–4 (Hard).
3. **No change** to AI influence/respect bands — they're documented as intentional and tested.

## Part 4 — Lock it in with tests

Add two test files alongside the existing balance suite:

1. **`src/components/__tests__/FamilySelectionScreen.starting-balance.test.tsx`** — update expected snapshot for Lucchese (55k), Colombo (42k/2), Genovese (40k). Add a test asserting `gambino.money === max` and `colombo.soldiers >= 2` (no-1-soldier-starts rule).
2. **`src/hooks/__tests__/ai-starting-resources.test.ts`** — extend the existing AI test:
   - Soldiers must be in `[2, 4]` (covering Hard's +1 bonus).
   - On Hard difficulty, soldiers must be ≥ 3.
   - Money must remain in `[35000, 50000]`.

## Files Touched

- `src/components/FamilySelectionScreen.tsx` — update Lucchese money 70k→55k, Colombo money 35k→42k & soldiers 1→2, Genovese money 45k→40k.
- `src/hooks/useEnhancedMafiaGameState.ts` — line 1101 AI soldier init becomes `2 + Math.floor(Math.random() * 2) + (difficulty === 'hard' ? 1 : 0)`; loyal recruit cost $300→$600; hitman cost $30k→$40k; commission vote $15k→$35k. (Will grep for the constants first to confirm exact locations.)
- `src/components/__tests__/FamilySelectionScreen.starting-balance.test.tsx` — update expected snapshot + add soldier-floor assertion.
- `src/hooks/__tests__/ai-starting-resources.test.ts` — new file, soldier range + difficulty test.
- `mem://gameplay/starting-balance` — record new money/soldier values and AI soldier range.
- `mem://gameplay/recruitment-costs` — update loyal cost to $600.
- `mem://gameplay/hitman-contracts` — update cost to $40k.
- `mem://gameplay/victory-conditions` — update Commission Vote cost to $35k.

## Verification

- Pick Colombo → start with 2 soldiers and $42k.
- Pick Lucchese → $55k.
- Pick Genovese → $40k.
- AI families spawn with 2–3 soldiers (Normal); 3–4 on Hard.
- Buy loyal soldier → $600. Hitman contract → $40k. Commission Vote → $35k.
- All balance tests pass.

## What Doesn't Change

Family bonuses/powers/identities. Influence/respect starts. Phase gates. Heat tiers. Maintenance. Map scaling. Family color/visual identity. AI behavior personalities. Starting respect ladder.

