## Difficulty ↔ New AI Behavior Integration

### Problem
The new AI behavior system (weighted personalities, dynamic moods, heuristic scoring, softmax picking) is live but doesn't fully account for difficulty. Easy/Hard need to influence not just aggression/income/recruit caps, but also how smart the AI is at picking targets and how reactive its mood is.

### Changes

#### 1. `src/lib/ai-strategy.ts` — Difficulty-aware scoring & picking
- Add `difficulty: 'easy' | 'normal' | 'hard'` to `ScoreHexInputs`.
- In `scoreHexForAI`, apply a difficulty scalar:
  - Easy: positive scores ×0.85, penalties ×1.15 (AI slightly undervalues good targets and overestimates risk)
  - Hard: positive scores ×1.15, penalties ×0.85 (AI slightly better at finding value and ignoring risk)
- Export a `difficultySoftmaxTemperature(difficulty)` helper:
  - Easy: 2.2 (more random/exploratory)
  - Normal: 1.5
  - Hard: 1.0 (more greedy/consistently optimal)

#### 2. `src/hooks/useEnhancedMafiaGameState.ts` — Wire difficulty into AI turn
- Pass `state.difficulty` (or derive from `difficultyModifiers`) into `scoreHexForAI`.
- Replace hardcoded `softmaxPick(..., 1.5)` with `difficultySoftmaxTemperature(difficulty)`.
- In `computeDynamicMood` inputs, scale `rivalAvgHexes` comparison threshold by difficulty:
  - Easy: 0.5× trigger sensitivity (harder for AI to panic; more relaxed)
  - Hard: 1.3× trigger sensitivity (AI panics/dominates more readily)
- Ensure `aiAggressionBonus` from difficulty modifiers is already applied (verified: yes, line 5766).

#### 3. `src/components/FamilySelectionScreen.tsx` — Update difficulty descriptions
- Revise the "AI Rivals" stat label values to reflect the new behavior:
  - Easy: "Reactive" (mood shifts slowly, scoring muted)
  - Normal: "Adaptive" (standard mood reactivity)
  - Hard: "Ruthless" (mood shifts fast, scoring sharp, greedy picks)
- Keep existing Income/Police Heat/Diplomacy rows.
- Subtly tweak taglines/quote flavor to match.

#### 4. Tests
- Update `difficulty-modifiers.test.ts` to assert that `aiAggressionBonus` is present and correctly applied to the AI's effective aggression during turns.
- No new test file needed; the existing AI variability tests should still pass because the seeded PRNG path is unchanged.

### Out of scope
- Rewriting combat math, economy formulas, or phase progression.
- Changing the 9 difficulty modifier values themselves — those are already balanced.
