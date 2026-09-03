# Dynamic Territory & Recruitment Atmosphere Pass

## Goal
Make the background city ambience feel like it is breathing with the player's empire. More owned territory and more soldiers should make the streets feel busier, more populated, and more "owned"; losing ground should make the city feel colder and emptier. Add industrial clang for manufacturing/dock districts and sharper stingers for major turn events.

## What we will build

### 1. New ambience state signals
Extend `AmbienceState` in `src/lib/ambience-state.ts` with turn-derived inputs:
- `playerTerritoryRatio`: player hexes / total claimed hexes (0-1).
- `soldierCount`: live player soldiers on the board + in HQ.
- `recruitedThisTurn`: number of soldiers recruited last turn (drives a short-lived crowd swell).
- `districtIdentity`: dominant district flavor among player hexes (`industrial`, `commercial`, `residential`, `docks`).
- `lostTerritoryThisTurn`: boolean flag from the turn report.

These values are computed from `gameState` once per turn in `UltimateMafiaGame.tsx` and passed into `useAmbience`, so the mix only changes at turn boundaries as requested.

### 2. New audio layers
Add synthesized layers to `src/hooks/useAmbience.ts`:
- **Industrial clang** — filtered, rhythmic metallic transients for `industrial`/`docks` districts; volume scales with `playerTerritoryRatio`.
- **Gangster chatter / racket buzz** — a modulated noise layer that rises with `soldierCount` and `playerTerritoryRatio`; this is the "more background gangsters" feel.
- **Crowd murmur swell** — existing crowd layer gets a temporary boost for 1-2 turns after `recruitedThisTurn > 0`.
- **Cold wind return** — when territory ratio drops below a threshold, wind becomes more prominent again.

All new layers use the Web Audio API and follow the same procedural/no-asset pattern as the existing bed.

### 3. Smooth crossfade + sharp stinger system
- Keep the existing continuous gain ramps (smooth crossfades) when `computeAmbienceMix` changes.
- Add a lightweight **stinger queue** in `useAmbience`:
  - `warDeclared`: low brass/drone hit.
  - `territoryLost`: discordant metallic scrape.
  - `recruitWave` (3+ recruits in one turn): brief crowd cheer / bottle-clink swell.
  - `heatCritical` or `ricoStarted`: police siren wail stinger.
- Stingers are one-shots scheduled at the start of the new turn, not looped.

### 4. Turn-based update wiring
In `src/pages/UltimateMafiaGame.tsx`:
- After the turn-resolution overlay closes, derive the new `AmbienceState` from `gameState` and `gameState.turnReport`.
- Pass it into the existing `<EnhancedMafiaHexGrid />` / `useAmbience` hook path.
- Ensure ambience updates only once per turn to avoid mid-turn distraction.

### 5. Console UX polish (optional stretch)
- Add a small "Atmosphere" readout in the sound settings dialog so players can see which layers are active.
- Keep it subtle; no new persistent HUD elements unless requested.

## Out of scope
- Replacing the music system.
- Adding recorded audio assets; everything stays synthesized.
- Real-time per-action ambience shifts (turn-based only per user direction).

## Success criteria
- Ending a turn after recruiting several soldiers makes the city sound noticeably busier for the next turn.
- Controlling industrial districts adds a faint metallic clang to the bed.
- Losing a large territory makes the wind layer more prominent.
- Declaring war or hitting critical heat triggers a short stinger at turn start.
- Typecheck passes and existing ambience tests still pass.
