

# Difficulty Settings Audit

## What's working ✅

| Modifier         | Easy | Normal | Hard | Status | Where it's applied |
|------------------|------|--------|------|--------|--------------------|
| `playerMoneyMult` | 1.5× | 1.0× | 0.75× | ✅ Wired | `createInitialGameState` line 997 — multiplies player starting money |
| `aiIncomeMult`   | 0.6× | 1.0× | 1.5× | ✅ Wired | AI per-turn income + minimum-income floor (line 5215) |
| `aiRecruitCapBonus` | 0 | 0 | +2 | ✅ Wired | AI soldier cap (line 5236) |
| `eventCostMult`  | 0.7× | 1.0× | 1.3× | ✅ Wired | Random event costs (line 6705) |
| AI starting soldiers (difficulty branch) | 2–3 | 2–3 | **3–4** | ✅ Wired & **test-locked** | Line 1101 — Hard adds +1 soldier; covered by `ai-starting-resources.test.ts` |

The AI test suite already validates Hard's +1 soldier bonus and the [2, 4] range across 30 randomized trials.

## What's broken ⚠️

Two declared modifiers are **dead code** — they exist in the `DIFFICULTY_MODIFIERS` table but are never read anywhere in the codebase:

1. **`policeHeatMult`** (Easy 0.7× / Hard 1.3×)
   - Intent: scale police heat the player accrues from actions.
   - Reality: heat is added at flat values regardless of difficulty. Easy mode players get the same RICO pressure as Hard mode players.

2. **`hitSuccessBonus`** (Easy +10% / Hard −10%)
   - Intent: shift hit success rates so Easy is more forgiving and Hard punishes failed contracts.
   - Reality: hit success rolls (scout/blind/planned) are computed without this bonus. The Family Selection screen's "weaker AI / stronger AI" copy implies this works; it doesn't.

Both are silently inert — no error, no warning, just no effect. The result: **Easy and Hard are noticeably less differentiated than the modifier table suggests.**

## Proposed fix

### Part A — Wire the two missing modifiers

1. **`policeHeatMult`** — find every `state.policeHeat.level += X` (and equivalents in claim/extort/hit/sabotage handlers), and multiply the increment by `state.difficultyModifiers.policeHeatMult` before adding. Single helper `applyHeat(state, amount)` in the hook would be cleanest; will grep the current sites and either factor a helper or scale inline at each call site (≤6 spots expected).

2. **`hitSuccessBonus`** — find the hit-resolution math (scout/blind/planned tiers) and add `+ diffMods.hitSuccessBonus` to the success probability before the random roll. Clamp to `[0.05, 0.99]` to avoid degenerate cases.

### Part B — Lock with tests

New file: `src/hooks/__tests__/difficulty-modifiers.test.ts` covering:
- Player starting money: Easy = 1.5× Normal, Hard = 0.75× Normal (locks line 997).
- AI starting soldiers Hard ≥ 3 (already covered, but re-asserted in the consolidated suite).
- `policeHeatMult` applied: simulate one heat-generating action on Easy vs Hard via a small unit-testable helper, assert ratio ≈ 0.7 / 1.3 of Normal. (If extracting a helper turns out invasive, fall back to asserting `state.difficultyModifiers.policeHeatMult` is consumed by spying on the heat-add path.)
- `hitSuccessBonus` applied: stub `Math.random` and assert a borderline hit succeeds on Easy and fails on Hard given the same roll.

### Part C — Memory

Update `mem://gameplay/difficulty-levels` to record:
- The 6-modifier table with each modifier's call-site.
- A note that `policeHeatMult` and `hitSuccessBonus` were previously dead and are now active.

## Files Touched

- `src/hooks/useEnhancedMafiaGameState.ts` — apply `policeHeatMult` to all heat-add sites; apply `hitSuccessBonus` to hit success calculations (clamped).
- `src/hooks/__tests__/difficulty-modifiers.test.ts` — new test file.
- `mem://gameplay/difficulty-levels` — document the now-complete modifier wiring.

## Verification

- Start an Easy game, perform a claim → heat increment ≈ 0.7× Normal.
- Start a Hard game, perform a hit on a known target → success probability is 10pp lower than Normal.
- All existing tests continue to pass; new difficulty-modifiers test passes.

## What Doesn't Change

Modifier values themselves (Easy 1.5×/0.6×/0.7×/+10% etc.). Player starting money scaling. AI income scaling. AI recruit cap. Event cost scaling. AI starting soldier scaling. Family bonuses. Phase gates.

