## Tighten AI-only phase pacing

AI currently shares `calculatePhaseForFamily` with the player, so it inherits the new performance gates. But AI bookkeeping (starting respect, padded income on harder difficulties, deterministic capo deployment) lets it satisfy perf reqs the moment its turn floor opens — leading to "AI jumps to P3 on turn 10" while the player is still organizing. We also want a small safety net so a single fluke turn (one-time income spike, brief district control) doesn't promote the AI.

### Changes

**1. Difficulty-scaled AI turn floor (`src/hooks/useEnhancedMafiaGameState.ts`)**

Add an AI-only offset on top of `PHASE_CONFIGS[p].minTurn` inside `calculatePhaseForFamily` when `family !== state.playerFamily`:

- Easy: `+4` turns
- Normal: `+2` turns
- Hard: `+0` (parity with player)

Implementation: read `state.difficulty` (or `state.difficultyModifiers`), compute `aiTurnOffset`, and use `state.turn < cfg.minTurn + aiTurnOffset` for the AI branch only. Player path unchanged.

**2. Sustained-performance gate for AI**

Track a per-opponent counter `resources.phaseReqStreak` (turns in a row meeting all perf reqs for the next phase). In `processAITurn` (around the existing `aiPhase` computation, L5355), before promoting:

- Compute `meetsPerf = meetsNextPhasePerfReqs(state, fam)` (extract the perf-only check; reuse the helper added for the player).
- If `meetsPerf`, increment streak; else reset to 0.
- Require `streak >= 2` (Normal/Easy) or `>= 1` (Hard) **in addition to** turn floor + perf gate before allowing `aiPhase` to be returned higher than `cachedPhase`.

This prevents one-turn promotions caused by transient income spikes or temporary district flips.

**3. Soft "rubber-band" cap: AI phase ≤ player phase + 1**

In `processAITurn` at the phase-transition block (L6862-6873), clamp:

```
const cap = (state.gamePhase || 1) + 1;
const effective = Math.min(aiPhase, cap);
```

Only promote `cachedPhase` up to `effective`. Once the player advances, the AI catches up next turn (no perf re-check needed because they already qualified). Hard difficulty skips this cap so elite AI can still pull ahead by 2 phases.

**4. Generalize `meetsNextPhasePerfReqs`**

The existing helper hardcodes `state.gamePhase` for player. Refactor to take `(state, family, currentPhase)` so AI can pass `opponent.resources.cachedPhase`. Player call site updated to pass `state.gamePhase`.

**5. Memory update**

Update `mem://gameplay/ai-behavior` with: difficulty-scaled AI turn floor offsets (E+4/N+2/H+0), 2-turn sustained perf streak required, and player+1 phase cap (Normal/Easy only).

### Files

- `src/hooks/useEnhancedMafiaGameState.ts` — `calculatePhaseForFamily`, `meetsNextPhasePerfReqs`, AI promotion block in `processAITurn`
- `mem://gameplay/ai-behavior` — pacing rules

### Result

| Difficulty | AI turn floor | Streak req | Phase cap vs player |
|------------|---------------|------------|---------------------|
| Easy       | cfg + 4       | 2 turns    | player + 1          |
| Normal     | cfg + 2       | 2 turns    | player + 1          |
| Hard       | cfg + 0       | 1 turn     | none (cfg + 2 cap)  |

Skilled players advancing fast still face accelerating AI; slow players get breathing room without trivializing Hard.

Approve to implement, or adjust offsets/cap.