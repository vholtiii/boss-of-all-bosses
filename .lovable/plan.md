

# Run 3 Game Simulations — Balance & Bug Assessment

## What
Write a Node.js simulation script that extracts the core game loop logic (economy, AI turns, combat, heat, prosecution, loyalty, victory checks) from the 9100-line game state hook and runs 3 complete games of 50 turns each with different families and difficulties. Output a detailed analysis report.

## Why a Script (Not Manual Play)
The game state logic is entirely in `useEnhancedMafiaGameState.ts` — a single React hook with all mechanics inline. A headless simulation can run 50 turns in seconds, testing interactions that would take hours of manual play.

## Simulation Design

### 3 Game Scenarios
1. **Gambino / Normal / Medium map** — baseline balanced game
2. **Colombo / Hard / Small map** — worst starting position (1 soldier) on hardest settings
3. **Genovese / Easy / Large map** — best economy family on easiest settings

### Player Strategy (Automated)
Each turn the simulated player will:
- Deploy available soldiers to adjacent neutral hexes
- Claim neutral hexes, extort businesses
- Recruit soldiers when affordable (up to soft cap)
- Build businesses when eligible (Phase 2+)
- End turn → full end-turn processing runs

### Metrics Tracked Per Turn
- Player money, soldiers, territories, respect, heat, prosecution risk
- AI money, soldiers, territories per family
- Events fired (arrests, wars, bankruptcy warnings, game over)
- Victory progress
- Phase transitions

### Analysis Output (Written to `/mnt/documents/`)
A markdown report covering:

**Balance Assessment**
- Income curves (player vs AI) — is AI minimum income too generous?
- Territory expansion rates — does any family snowball?
- Phase progression timing — are thresholds reachable?
- Victory achievability — can any victory condition be met in 50 turns?

**Bug Detection**
- Negative money / resource underflows
- Array index out-of-bounds or undefined access patterns
- Infinite loops in BFS/pathfinding
- Dead code paths (unreachable conditions)
- State corruption (unit counts mismatch, orphaned stats)

**Gamebreaking Mechanics**
- AI minimum income floor (`2000 + turn*500`) — grows to $27k/turn by turn 50 regardless of territory
- Soldier recruit cap (`max(8, 3+turn/2)`) — unbounded growth
- Heat/prosecution death spirals — can heat cascade into unrecoverable state?
- Bankruptcy cascade — does debt→desertion→less income→more debt loop?
- Loyalty death spiral — idle decay + enemy territory penalty stacking

## Technical Approach
1. Extract key functions and constants from the game state file into a standalone Node.js script
2. Replicate the core loop: `createInitialState → (playerActions + endTurn) × 50`
3. Strip React hooks (`useState`, `useCallback`) — use plain functions
4. Use the seeded PRNG (mulberry32) for reproducibility
5. Log per-turn snapshots to build the analysis

## Files
- `/tmp/simulate.js` — simulation script (ephemeral)
- `/mnt/documents/game_simulation_report.md` — final analysis report

