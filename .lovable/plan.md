

# Rebalance Phase Thresholds + Decouple AI Phase Progression

## Part 1 — Threshold rebalance

### `src/types/game-mechanics.ts` — `PHASE_CONFIGS`

| Transition | Current | New |
|---|---|---|
| **Phase 1 → 2** | `minHexes: 8`, `minRespect: 30` | **`minHexes: 15`, `minRespect: 35`** |
| **Phase 2 → 3** | `minHexes: 20`, `minCapos: 2`, `minBuiltBusinesses: 1` | **`minHexes: 25`, `minCapos: 1`, `minBuiltBusinesses: 1`** |
| **Phase 3 → 4** | unchanged (OR gate stays) | unchanged |

### Label clarity

In `src/pages/UltimateMafiaGame.tsx` (line 1215) and `src/components/PhaseInfographic.tsx` (line 60), change the requirement label from `"1+ businesses"` / `"1+ business"` → **`"1+ legal business built"`**, with a small muted helper line: `"Build a Restaurant, Store, or Construction via the Build action."`

## Part 2 — Decouple AI phase progression

### Problem

I'll grep `cachedPhase` and the AI phase-update logic to confirm, but per the existing memory (`mem://gameplay/ai-behavior` — "Phase gating … parity with the player") and the symptom the user describes, AI families currently use the same `gamePhase` value as the player or recompute against identical thresholds at the same tick, causing synchronized transitions.

### Fix

Each AI opponent should evaluate its own phase independently from its own resources, hexes, capos, and built businesses — using the same `PHASE_CONFIGS` requirements but applied to the AI's state, not the player's.

In the per-turn AI update loop (in `src/hooks/useEnhancedMafiaGameState.ts` — exact function will be located during implementation), for each `aiOpponent`:

1. Count AI-owned hexes from `hexMap.filter(h => h.controllingFamily === opp.family)`.
2. Count AI capos from `units.filter(u => u.family === opp.family && u.type === 'capo')`.
3. Count AI legal-built businesses from `hexMap.filter(h => h.controllingFamily === opp.family && h.business?.builtByPlayer)` — note: the `builtByPlayer` flag is a misnomer; it really means "constructed (vs extorted)" and applies to any builder. If the flag is currently never set for AI builds, extend AI construction logic to set it (will verify during implementation).
4. Read AI respect from `opp.resources.respect`.
5. Compare against `PHASE_CONFIGS[currentAIPhase].requirements` + `minTurn` floor.
6. Write the result to `opp.resources.cachedPhase` (already the field rendered by `PhaseInfographic`'s "Rival Phases" grid).

This keeps the player's `gamePhase` as a separate value driven only by player state. The AI's `cachedPhase` is what gates AI behavior (Plan Hits, Capo Promotion, Hitman, Influence Erosion, etc.) wherever AI logic currently checks phase — those reads switch from `gamePhase` to `opp.resources.cachedPhase`.

### Verification

- Player rushes to Phase 2 → rival panel still shows rivals at P1 until they hit 15 hexes / 35 respect themselves.
- Aggressive AI (e.g., Genovese) reaches P2 before a slow player → its `cachedPhase` reads P2 in the rival grid while player stays P1.
- Player at P3 with rivals lagging at P2 → rivals don't trigger erosion/expansion until they reach P3 individually.
- Existing tests still pass; no change to `PHASE_CONFIGS` shape, only numbers and consumer wiring.

## Files Touched

- `src/types/game-mechanics.ts` — update Phase 1→2 and Phase 2→3 requirement numbers.
- `src/pages/UltimateMafiaGame.tsx` — clarify built-business label.
- `src/components/PhaseInfographic.tsx` — clarify built-business label + helper line.
- `src/hooks/useEnhancedMafiaGameState.ts` — per-AI phase evaluation each turn writing to `opp.resources.cachedPhase`; switch AI phase-gated branches to read `cachedPhase` instead of player `gamePhase`.

## What Doesn't Change

`minTurn` floors. Phase 3→4 OR gate. Victory targets. Player phase logic. AI personalities, family powers, combat math. UI layout.

