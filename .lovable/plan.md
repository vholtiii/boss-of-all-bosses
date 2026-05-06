## Goal

The difficulty selector now advertises four levers — **Income**, **AI Rivals**, **Police Heat**, **Diplomacy** — but only Income, Heat, and a generic AI knob are wired. Make every advertised lever actually move during the turn-based game so the dossier stops lying.

## Current wiring audit (`src/hooks/useEnhancedMafiaGameState.ts`)

`DIFFICULTY_MODIFIERS` (lines 177–181) currently exposes 6 numbers:

| Modifier | Easy / Normal / Hard | Used? |
|---|---|---|
| `playerMoneyMult` | 1.5 / 1.0 / 0.75 | ✅ starting cash + income (lines 1065, 5142–5147) |
| `aiIncomeMult` | 0.6 / 1.0 / 1.5 | ✅ AI minimum income (line 5508) |
| `aiRecruitCapBonus` | 0 / 0 / +2 | ✅ AI recruit cap (line 5529) |
| `policeHeatMult` | 0.7 / 1.0 / 1.3 | ✅ player heat via `applyPlayerHeat` |
| `hitSuccessBonus` | +0.10 / 0 / -0.10 | ✅ player hit chance (line 9403) |
| `eventCostMult` | 0.7 / 1.0 / 1.3 | ✅ event costs (line 7108) |

So **Income** and **Police Heat** already match. **AI Rivals** is partly wired (income + recruit cap) but doesn't change *behavior* (aggression). **Diplomacy** has zero modifier — tension decay, treachery odds, and AI sitdown willingness are difficulty-blind.

## Changes

### 1. Extend `DifficultyModifiers` with two new fields

In `src/hooks/useEnhancedMafiaGameState.ts` lines 168–181:

```ts
export interface DifficultyModifiers {
  playerMoneyMult: number;
  aiIncomeMult: number;
  aiRecruitCapBonus: number;
  policeHeatMult: number;
  hitSuccessBonus: number;
  eventCostMult: number;
  aiAggressionBonus: number;     // NEW — added to every AI's aggressionLevel (0-100)
  diplomacyTensionMult: number;  // NEW — multiplies all tension *gains* against the player
  tensionDecayMult: number;      // NEW — multiplies passive per-turn tension decay
}
```

Values:

| Field | Easy | Normal | Hard | Effect |
|---|---|---|---|---|
| `aiAggressionBonus` | -15 | 0 | +15 | Hesitant / Tactical / Ruthless |
| `diplomacyTensionMult` | 0.7 | 1.0 | 1.4 | Forgiving / Cautious / Treacherous |
| `tensionDecayMult` | 1.5 | 1.0 | 0.6 | tensions cool faster on Easy, linger on Hard |

### 2. Apply `aiAggressionBonus` to AI behavior

In the AI turn loop (around line 5618), where `aggression = opponent.strategy.aggressionLevel || 50`:

```ts
const diffMods = state.difficultyModifiers || DIFFICULTY_MODIFIERS.normal;
const aggression = clamp(0, 100,
  (opponent.strategy.aggressionLevel || 50) + diffMods.aiAggressionBonus);
```

This automatically flows into all aggression-gated decisions already in place (defense chance line 5641, attack threshold line 6178, combat willingness line 5866, etc.) — no new branches needed.

Also bias war declaration: nudge `WAR_TENSION_THRESHOLD` checks via the existing pipeline by feeding `aiAggressionBonus` into the `personality` override step — on Hard, aggression ≥60 personalities act `aggressive` more often.

### 3. Apply diplomacy modifiers to tension flow

Two narrowly-scoped touches to keep tests stable:

**a. Player-direction tension gains.** In `addPairTension` (line 632), when one of the two families is the player's, scale `amount` by `diffMods.diplomacyTensionMult`:

```ts
const isPlayerInvolved = familyA === state.playerFamily || familyB === state.playerFamily;
const mult = isPlayerInvolved
  ? (state.difficultyModifiers?.diplomacyTensionMult ?? 1)
  : 1;
state.familyTensions[key] = clamp(0, 100,
  (state.familyTensions[key] || 0) + amount * mult);
```

This makes Hard rivals get angrier *at the player* faster, leaves AI–AI tension untouched (preserves emergent diplomacy).

**b. Per-turn tension decay.** In the war/tension lifecycle (line 3922–3928), scale `TENSION_DECAY_PER_TURN` by `diffMods.tensionDecayMult` (rounded). On Easy decay 3/turn, on Hard 1/turn.

### 4. Boost AI starting soldiers asymmetry

The existing `+ (difficulty === 'hard' ? 1 : 0)` (line 1172) is fine. Add Easy-side leniency for parity with the dossier's "Hesitant" claim:

```ts
soldiers: 2 + Math.floor(Math.random() * 2)
  + (difficulty === 'hard' ? 1 : 0)
  - (difficulty === 'easy' ? 1 : 0),  // floor at 1 inside Math.max
```

Wrap whole expression in `Math.max(1, …)` to prevent zero starts.

### 5. Update tests + memory

- `src/hooks/__tests__/difficulty-modifiers.test.ts`: add assertions that all 9 fields are present on `state.difficultyModifiers` for each tier and that the new values match the table above. Existing six-field assertions stay green.
- Memory: update `mem://gameplay/difficulty-levels` to document the 9 modifiers and what each scales.

## Out of scope

- UI changes (the dossier cards already render the new flavor text).
- Rebalancing the existing six modifiers' magnitudes.
- Changing AI personality archetypes or starting relationships range.
- Hitman / sitdown cost tweaks (covered by existing `eventCostMult`).

## Files

- `src/hooks/useEnhancedMafiaGameState.ts` — modifier table, `addPairTension`, tension decay, AI aggression read, AI starting soldiers.
- `src/hooks/__tests__/difficulty-modifiers.test.ts` — extend coverage.
- `mem://gameplay/difficulty-levels` — document new fields.
