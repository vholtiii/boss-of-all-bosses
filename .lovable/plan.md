

# Stability & Replayability Improvements (Excluding #4 Victory Conditions and #6 Economy Balancing)

## Scope
Implementing 5 improvements: state mutation fixes, randomized map generation, AI personality wiring, difficulty selection, and expanded events. Victory conditions (#4) and economy balancing (#6) are deferred.

---

## 1. State Mutation Fixes — `src/hooks/useEnhancedMafiaGameState.ts`

**Problem:** `processAITurn` directly mutates arrays and objects inside `setGameState` callbacks — `splice()`, direct property assignment on tiles, pushing to arrays. This can cause stale reads within the same callback.

**Changes:**
- Replace all `state.deployedUnits.splice(idx, 1)` with filter-based removal: `state.deployedUnits = state.deployedUnits.filter(u => u !== casualty)`
- Replace `tile.controllingFamily = fam` with immutable hex map updates: `state.hexMap = state.hexMap.map(t => t === tile ? { ...t, controllingFamily: fam } : t)`
- Replace `unit.q = target.q` direct assignments with map-based updates on `state.deployedUnits`
- Replace `state.pendingNotifications.push(...)` with spread: `state.pendingNotifications = [...state.pendingNotifications, newNotif]`
- Apply same treatment to `processWeather`, `processEvents`, `processBribes`, `processPacts`
- ~15-20 mutation sites across `processAITurn` (lines 2014-2308), plus a handful in other process functions

## 2. Randomized Map Generation — `src/hooks/useEnhancedMafiaGameState.ts`

**Problem:** `generateHexMap` uses deterministic hash `(q * 31 + r * 47) % 100` — every game has the same business layout.

**Changes:**
- Add a simple seeded PRNG function (mulberry32 or similar, ~10 lines) at the top of the file
- `generateHexMap` accepts an optional `seed` parameter (defaults to `Math.random() * 2^32`)
- Replace all `Math.abs((q * 31 + r * 47) % 100)` and similar hashes with calls to the seeded PRNG
- Business placement, type selection, and income variation all use the PRNG
- `createInitialGameState` passes the seed through; store it on state for save/load compatibility
- Add `mapSeed: number` to the game state interface

## 3. AI Personality Wiring — `src/hooks/useEnhancedMafiaGameState.ts`

**Problem:** AI opponents have `personality`, `strategy.aggressionLevel`, `cooperationTendency`, `riskTolerance` fields that are never read in `processAITurn`. All families behave identically.

**Changes in `processAITurn`:**

**a) Target selection (lines ~2136-2148):** Replace the uniform targeting logic with personality-driven selection:
- `aggressive` (Colombo): always prefer player/enemy hexes, 80% attack even when weaker
- `defensive` (Bonanno): prefer neutral expansion, only attack if strength advantage >= 2
- `opportunistic` (Lucchese): target the family with fewest soldiers on the border
- `diplomatic` (Gambino): 40% chance to skip attacks entirely, prefer neutral expansion
- `unpredictable` (Genovese): randomize between all strategies each turn

**b) Combat willingness (line ~2179):** Replace flat `Math.random() < 0.4` with `Math.random() < (opponent.strategy.aggressionLevel / 100)`.

**c) AI-to-AI combat:** When an AI unit moves onto a hex controlled by another AI family (not just player), resolve combat between them. This creates shifting power dynamics the player can exploit.

**d) Diplomatic AI actions:** Diplomatic-personality AIs can propose ceasefires to the player (add to pendingNotifications as an event). Chance: `cooperationTendency / 200` per turn.

## 4. Difficulty Selection — `src/components/FamilySelectionScreen.tsx` + `src/hooks/useEnhancedMafiaGameState.ts`

**Problem:** No way to adjust game difficulty. Every game starts with the same balance.

**Changes:**

**a) FamilySelectionScreen.tsx:**
- Add a 3-button difficulty selector (Easy / Normal / Hard) above or below the family cards
- Style with the existing noir aesthetic — segmented toggle or three bordered buttons
- Pass `difficulty` alongside `familyId` and `resources` to `onSelectFamily`
- Update `Props` interface: `onSelectFamily: (familyId, resources, difficulty) => void`

**b) useEnhancedMafiaGameState.ts:**
- Add `difficulty: 'easy' | 'normal' | 'hard'` to game state interface
- `createInitialGameState` accepts difficulty parameter
- Difficulty modifiers applied at state creation:

| Parameter | Easy | Normal | Hard |
|---|---|---|---|
| Player starting money | +50% | unchanged | -25% |
| AI minimum income multiplier | 0.6x | 1x | 1.5x |
| AI recruitment cap bonus | 0 | 0 | +2 |
| Police heat generation | 0.7x | 1x | 1.3x |
| Hit success bonus | +10% | 0 | -10% |

- Store multipliers on state so they're used in `processAITurn`, `performAction`, etc.

**c) UltimateMafiaGame.tsx:**
- Update `onSelectFamily` handler to pass difficulty through to `createInitialGameState`

## 5. Expanded Events — `src/hooks/useEnhancedMafiaGameState.ts`

**Problem:** Only 2 event templates ("Police Raid" and "Rival Meeting"), 35% per turn. Gets repetitive fast.

**Changes in `processEvents`:**
- Add 10 new context-sensitive event templates:
  1. **Informant Tip** — pay $5k to reveal all enemy positions for 2 turns, or ignore
  2. **Weapons Shipment** — pay $8k for +15% combat bonus for 3 turns, or sell for $4k
  3. **Political Scandal** — bribe the politician ($12k, -20 heat) or exploit it (+10 rep, +15 heat)
  4. **Dock Workers Strike** — only if player controls Brooklyn hexes; pay $6k to end it or lose income for 2 turns
  5. **Internal Betrayal** — a random soldier's loyalty drops by 25; pay $5k to prevent it
  6. **Federal Investigation** — if heat > 60; pay $15k or lose a random business
  7. **Market Opportunity** — invest $10k for 2x return in 3 turns, or ignore (30% chance of losing investment)
  8. **Rival Turf War** — two AI families fight; choose to support one (relationship boost) or stay out
  9. **Celebrity Endorsement** — if respect > 50; pay $8k for +15 rep and -10 heat
  10. **Rat in the Ranks** — a soldier is informing; pay $3k to identify, or risk arrest next turn
- Context gating: events check relevant state (heat level, territory, money, respect) before being eligible
- Increase event chance from 35% to 45% but cap at 1 event per turn (no stacking)
- Events use difficulty multiplier on costs (Easy: 0.7x, Hard: 1.3x)

---

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — items 1, 2, 3, 4b, 5
- `src/components/FamilySelectionScreen.tsx` — item 4a
- `src/pages/UltimateMafiaGame.tsx` — item 4c (pass difficulty)

## Implementation Order
1. State mutation fixes (stability foundation)
2. Difficulty selection (UI + state plumbing)
3. Randomized map generation
4. AI personality wiring
5. Expanded events

