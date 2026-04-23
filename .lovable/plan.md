

# Fix: AI Capo fly range using player phase

## Change

In `src/hooks/useEnhancedMafiaGameState.ts`, update `getCapoFlyRange` (and any call-sites) so the phase used to compute a Capo's fly range comes from **that Capo's family**, not the player's `state.gamePhase`.

- For the player's Capos → use `state.gamePhase`.
- For an AI Capo → use `state.aiOpponents.find(o => o.family === capo.family)?.resources.cachedPhase ?? 1`.

Implementation: change `getCapoFlyRange(phase)` callers to pass the resolved phase per unit, or refactor to `getCapoFlyRange(state, capo)` which internally picks the right phase based on `capo.family === state.playerFamily`.

## Files Touched

- `src/hooks/useEnhancedMafiaGameState.ts` — fix the one leak so AI Capos get their P2+ extended fly range based on their own `cachedPhase`.

## Verification

- Player at P1, rival at P2 → that rival's Capos can fly 4 hexes (not 2).
- Player at P2, rival at P1 → that rival's Capos still limited to 2.
- No change to player Capo movement.

## What Doesn't Change

`PHASE_CONFIGS`, fly-range numbers (2 / 4), capo combat, any other phase gate.

