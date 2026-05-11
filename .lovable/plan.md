# AI Behavior & Balance Overhaul

Goal: AI feels like a **thinking opponent** that varies between playthroughs and reacts to the board state, while still expressing each family's identity. No two games should play out the same way.

## Where things stand today

After auditing `processAITurn` and the AI init in `useEnhancedMafiaGameState.ts`:

**Strengths already in place**
- 5 personalities (aggressive / defensive / opportunistic / diplomatic / unpredictable) drive movement, combat willingness, fortify chance, recruit batch size, lay-low/mattresses triggers, diplomacy proposals.
- War override flips any AI to aggressive while at war.
- Difficulty modifiers shift aggression baseline and income/recruit caps.
- Hit pipeline parity (scouted/blind), capo wound rules, safehouse capture.

**Why it still feels samey / sub-human**
1. **Hardcoded family→personality map at init** (lines 1187-1191): Gambino is *always* diplomatic, Genovese *always* aggressive, Colombo *always* unpredictable, etc. Every playthrough the same family acts the same way.
2. **Movement target = `Math.random()` pick from a target pool.** No scoring of *which* enemy hex is best (income, distance to own HQ, isolation, district strategic value). A human picks the juicy weak hex; the AI picks any reachable enemy hex.
3. **No mid-game adaptation.** Personality is fixed for the whole game. A human player who's losing turtles up; a winning human pushes for the kill. Our AI doesn't shift.
4. **Diplomacy is one-dimensional.** AI only considers ceasefires with the *player*. AI-to-AI ceasefires/alliances/wars never form, so the player is always the focal point.
5. **Family identity is shallow.** `focusAreas` (district preferences) are defined but never consulted in movement targeting. Family active powers (the 5 unique abilities) are likely not used by AI at full parity.
6. **Phase progression doesn't change strategy.** A Phase 1 land-grab AI plays the same in Phase 4 endgame.
7. **"Unpredictable" is the only varied personality** — and it just rerolls a behavior mode each turn, which reads as random rather than clever.

## What to build

### 1. Per-game personality variability (kills the "same playthrough" feel)

Replace the hardcoded family→personality map with a **weighted profile per family**. Each family has a primary tendency plus 1-2 secondary leans, and the actual personality is rolled at game start (PRNG-seeded so saves remain deterministic).

Example weights (final numbers tunable):

| Family   | Aggressive | Defensive | Opportunistic | Diplomatic | Unpredictable |
|----------|:---:|:---:|:---:|:---:|:---:|
| Gambino  | 15 | 25 | 20 | **35** | 5  |
| Genovese | **45** | 10 | 25 | 5 | 15 |
| Lucchese | 20 | 15 | **40** | 20 | 5 |
| Bonanno  | 10 | **45** | 20 | 20 | 5 |
| Colombo  | 35 | 5  | 15 | 5 | **40** |

Same family still *feels* like itself across runs, but plays differently each time. Also reroll `aggressionLevel`, `riskTolerance`, `cooperationTendency` within ±20 of the family baseline per game.

### 2. Reactive personality shifts mid-game

Add a `dynamicMood` overlay on top of base personality, recomputed each AI turn from board state:

- **Losing badly** (hex count < 60% of average rival, or just lost a capo / HQ assault) → temporarily lean *defensive* (turtle, fortify, propose ceasefires).
- **Dominant** (hex count > 130% of average rival, ahead on income) → temporarily lean *aggressive* (push war, plan hits, refuse ceasefires).
- **Cornered economically** (money < 2 turns of upkeep) → lean *opportunistic* (extort, accept supply deals, sabotage).
- **High heat** (≥70) → lean *defensive* + force lay-low/mattresses biases up.
- **Phase shift**: Phase 1 → expansion bias, Phase 2 → consolidation/recruit, Phase 3 → diplomacy + influence plays, Phase 4 → endgame aggression toward weakest survivor.

Mood blends with base personality (e.g. an aggressive Genovese in losing mood still attacks more than a defensive Bonanno in losing mood).

### 3. Smarter target scoring (replaces `Math.random()` picks)

In the movement/targeting block (around line 5840-5940), replace random selection with a **weighted score per candidate hex**:

- `+ business income` (seek juicy hexes)
- `+ if defender count == 0` and `– if defender count >= 2` (pick weak)
- `+ if hex is in family's `focusAreas` district` (finally honors family identity)
- `+ if hex breaks a rival's supply line / connected territory`
- `+ if hex is adjacent to own territory` (consolidation bonus, scaled by mood)
- `+ if hex is rival HQ-adjacent and we're in Phase 4 + winning`
- `– if hex is fortified or has a safehouse + we lack scout intel`
- `– per hex-distance from own HQ` (overextension penalty, scaled by aggression)

Then softmax-pick from top-K (top 3-5 with probability weights). Keeps unpredictability while removing dumb picks.

### 4. AI-to-AI diplomacy & wars

Extend the diplomacy block (line 6398+) so AI considers proposing ceasefires/alliances/wars with **other AI families**, not just the player. Triggers:

- Two diplomatic AIs with high mutual relationship → alliance.
- AI losing to another AI → ceasefire request to the bully.
- AI dominant vs a weak rival → declares war when opportunity score is high.
- Tension already tracked per pair (`addPairTension`) — promote pairs over threshold to auto-war as already happens for the player.

This makes the world feel alive and prevents the player from being everyone's punching bag every game.

### 5. Family-flavored play patterns

Beyond stats, give each family a signature **strategic preference** consulted by the scoring function and action priorities:

- **Gambino** — political/legal: prefers building legal fronts, bribing officials, lower heat tolerance.
- **Genovese** — territorial bruiser: prioritizes adjacent expansion, fortifies aggressively.
- **Lucchese** — economic raider: prefers extorting over claiming, supply-line sabotage.
- **Bonanno** — turtle/builder: high construction rate, holds districts, district-control plays.
- **Colombo** — guerilla: capo-heavy, plans hits, uses Persico Succession and bold strikes.

Verify each family's active power is in the AI's action toolkit at appropriate phases (audit + add any missing).

### 6. Phase-aware behavior tree

Wrap action priorities (recruit → deploy → move/combat → claim → extort → promote → diplomacy → fortify) in a phase-aware ordering:

- **Phase 1**: claim > recruit > deploy > expand-move (combat de-prioritized).
- **Phase 2**: extort > promote-capo > recruit > targeted moves.
- **Phase 3**: diplomacy > influence-plays (passive racketeering) > alliance shaping > selective war.
- **Phase 4**: war target > HQ assault when winning > endgame ceasefires when losing.

### 7. Anti-repetition guardrails

- Per-game RNG seed derived from the existing map seed already covers determinism — extend it to AI personality rolls, scoring jitter, and diplomacy timing so the same seed always replays identically (good for debugging) but different seeds feel meaningfully different.
- Add small **decision jitter** (±10% on every weighted score) so even identical board states produce different choices.

### 8. Validation

- Run `src/hooks/__tests__/simulation.test.ts` (3 sims already wired) — confirm no anomaly regressions, and that **winner family / win type varies across seeds** for the same family/difficulty pair (currently likely deterministic-feeling).
- Add a new sim case: same config, 5 different seeds → assert at least 3 distinct winners or distinct win turns.
- Manual playtest: 2 runs of "player Gambino normal medium" should *feel* different from each other.

## Technical sections (where edits land)

- **`src/hooks/useEnhancedMafiaGameState.ts`**
  - Lines ~1183-1210: replace hardcoded family-personality map with weighted roll using existing PRNG.
  - Lines ~5470-5485: add `dynamicMood` computation per AI per turn; blend with `personality` for downstream switches.
  - Lines ~5805-5905: replace random `targetPool` pick with scoring function `scoreHexForAI(state, fam, hex, mood)` → softmax top-K.
  - Lines ~5847 / 5981 / 5924 / 6294: have personality switches read the **blended** mood, not raw `personality`.
  - Lines ~6398-6460: extend diplomacy to iterate `state.aiOpponents` pairs (not just vs player); add AI-to-AI war declarations driven by tension threshold.
  - New helper module `src/lib/ai-strategy.ts`: `rollFamilyPersonality(family, prng)`, `computeDynamicMood(state, opponent)`, `scoreHexForAI(...)`, `familySignaturePreference(family)`.
- **`src/types/enhanced-mechanics.ts`**: add `dynamicMood`, `signaturePreference` fields to `AIOpponent`.
- **`src/hooks/__tests__/`**: add `ai-variability.test.ts` (5 seeds → varied outcomes) and extend `simulation.test.ts` reports with personality-roll log.

## Out of scope (call out if you want them)

- Reworking family active powers themselves (only ensuring AI uses them at parity).
- Changing combat math, economy formulas, or victory targets.
- New UI for AI mood — moods are internal; player learns them through play.
