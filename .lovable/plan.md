## Goal
Make AI families take **graduated, escalating precautions** as their heat rises — but allow them to push through to RICO when their winning strategy demands it. Mirrors the spirit of the player's bribe-officers / lay-low / hit-tier choices.

All changes are AI-side only in `src/hooks/useEnhancedMafiaGameState.ts`. Player heat behavior unchanged.

## Heat tiers used by AI
- **Cool** (0–39): no precautions, behaves as today.
- **Warm** (40–59): soft caution — biases hit-tier choice, avoids blind hits on civilians, occasional spend on bribe-cooldown.
- **Hot** (60–79): existing Lay Low triggers (already in place) get a higher base chance; AI actively spends money on heat-reduction every 2–3 turns; refuses civilian/empty-hex blind hits entirely.
- **Critical** (80–89): AI defaults to lay-low / mattresses unless a *strategic override* is true; spends on bribes every turn it can afford.
- **RICO zone** (90+): AI usually freezes offense (continues the existing 3-turn RICO countdown). Override gate decides whether it pushes through anyway.

## Strategic-override gate (when AI ignores heat and keeps swinging)

The AI bypasses precautions and accepts RICO risk only if **any** of these are true:

1. **Endgame winning move available** — territory count ≥ `winThreshold - 2` and a claim/hit this turn could close it.
2. **HQ assault available** — Phase 4 + adjacent to rival HQ + has the soldier mass.
3. **Aggressive personality + ahead** — `personality === 'aggressive'` AND already top-1 in territory (rubber-band-aware).
4. **At war + opportunistic personality** — must press a temporary advantage.

Otherwise, the precaution layer wins.

## Concrete behaviors

### 1. New AI heat-precaution block
Inserted right after the existing Lay Low + Mattresses block (~line 5605, before `aiOffenseDisabled` is computed).

```text
heatTier = bucket(aiHeat)
strategicOverride = computeOverride(opponent, state, personality, phase)

if heatTier === 'warm' and not strategicOverride:
  set oppAny.aiHeatCaution = 'warm'   // soft flag, read by action selectors
  if money >= bribeCost and rng < 0.20 * personalityMult:
    spend bribeCost, heat -= 12, set oppAny.bribeCooldownUntil = turn + 3

if heatTier === 'hot' and not strategicOverride:
  oppAny.aiHeatCaution = 'hot'
  // Boost existing Lay Low fire chance by +0.25 (handled inline)
  if money >= bribeCost and rng < 0.40 * personalityMult and turn >= bribeCooldownUntil:
    spend bribeCost, heat -= 15, cooldown = turn + 3

if heatTier === 'critical' and not strategicOverride:
  oppAny.aiHeatCaution = 'critical'
  // Force lay-low if not already
  if not isAILayingLow: layLowActiveUntil = turn + 2
  if money >= bribeCost: spend bribeCost, heat -= 18, cooldown = turn + 2
  // Will also disable offense via existing aiOffenseDisabled path

if heatTier === 'rico' and not strategicOverride:
  // Same as critical, plus skip all hits/sabotage/claim this turn
  oppAny.aiHeatCaution = 'rico_freeze'
  aiOffenseDisabled = true
```

### 2. Hit-tier preference biased by heat
At hit-pipeline tier selection (around line 6232), when `heatTier >= warm` and not overriding:
- Strongly prefer `planned` over `scouted`, `scouted` over `blind`.
- At `hot+`, refuse `blind` entirely (skip the action instead of taking it raw).
- Civilian-hit-on-empty-rival-hex block (line ~5414) becomes opt-out at `warm+` (already extreme heat-cost; AI shouldn't pile more on).

### 3. Existing Lay Low chance boost
Add `+ heatBoost` inside the existing `fireChance` calc:
- warm: +0.05
- hot: +0.20
- critical: +0.40
This makes the existing trigger fire more reliably without rewriting it.

### 4. AI-side bribe action
Single helper `aiSpendOnHeatReduction(opponent, amount, heatDrop)` that:
- Decrements `opponent.resources.money` by scaled cost (uses difficulty `costMult` like the player).
- Decrements `opponent.resources.heat` (clamped ≥0).
- Adds a `turnReport.aiActions` entry: "Bribed officers — heat -X".
- Pushes a low-priority info notification only if the player has captain+ corruption intel on that family (parity with current intel gating).

### 5. Tests / validation
- Manual playthrough: verify mid-game AI at heat 50 occasionally pays bribes and prefers planned hits.
- Verify aggressive AI ahead in territory still pushes through at heat 85.
- Verify defensive AI at heat 90 stops attacking and the RICO countdown still completes if it can't bring heat down in time.
- All 57 existing tests still pass.

## Memory updates
After implementation, update `mem://gameplay/ai-behavior` to add a "Heat-graduated precautions" bullet (warm/hot/critical/RICO tiers + strategic-override conditions).

## Out of scope
- No changes to player heat mechanics.
- No new UI surfaces (intel-gated notifications reuse existing notification path).
- No changes to RICO timing (still 3 consecutive turns at heat ≥ 90).
