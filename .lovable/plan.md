

# Match AI Movement Limits to Player

The recent capo nerf only fully applied to the player. The AI movement loop still uses old hardcoded numbers, and AI units never get their `movesRemaining` reset each turn — so AI behavior is inconsistent with player rules.

## Bugs to Fix

1. **AI capos move 3 hexes per move (player gets 2 in P1, 4 in P2+)**
   `useEnhancedMafiaGameState.ts:5243` — `unit.type === 'soldier' ? (2 + alertBonus) : 3`
   `useEnhancedMafiaGameState.ts:5247` — `getHexesInRange(..., Math.min(3, movesLeft))`

2. **AI soldiers can move 3 hexes when alerted (player capped at 2)**
   Same line 5243 — `2 + alertBonus` lets alerted AI soldiers exceed the player's hard cap of 2.

3. **AI units never get `movesRemaining` reset per turn**
   `useEnhancedMafiaGameState.ts:1453` — the tactical-phase reset explicitly skips non-player units (`if (u.family !== prev.playerFamily) return u;`). AI units only get fresh moves on initial spawn / promotion, then rely on whatever was left from the previous AI turn. This is a latent bug independent of the nerf.

## Changes

### 1. `src/hooks/useEnhancedMafiaGameState.ts` — AI movement loop (~line 5243)

Replace the hardcoded caps with the same constants/helpers the player uses:

```ts
const aiCapoRange = getCapoFlyRange(state.gamePhase);
const baseMoves = unit.type === 'capo' ? CAPO_MOVES_PER_TURN : 2; // no alertBonus on movement
let movesLeft = Math.min(unit.movesRemaining, baseMoves);
```

And the capo neighbor calculation (~line 5247):

```ts
const neighbors = unit.type === 'soldier'
  ? getHexNeighbors(unit.q, unit.r, unit.s)
  : getHexesInRange(unit.q, unit.r, unit.s, Math.min(aiCapoRange, movesLeft));
```

The `alertBonus` stays applied to AI **recruitment** and **action budget** (its current other uses) — only stripped from per-turn movement to match the player.

### 2. `src/hooks/useEnhancedMafiaGameState.ts` — AI turn-start move reset

At AI turn start (inside `processAITurn`, before the AI movement loop, after Mattresses check), add a reset for AI units of the family being processed:

```ts
state.deployedUnits = state.deployedUnits.map(u => {
  if (u.family !== fam) return u;
  if ((state.mattressesState || {}).active && fam === state.playerFamily) return u;
  const baseMoves = u.type === 'capo' ? CAPO_MOVES_PER_TURN : 2;
  return { ...u, movesRemaining: baseMoves };
});
```

This mirrors the player reset at line 1452–1458 so each AI family gets a fresh 2-move budget per turn.

### 3. Sanity sweep

Search for any other hardcoded `3` related to capo movement/range in the AI paths (defense loop at 5226–5234 only checks distance, not move budget — fine; no other offenders found).

## Verification

- Promote an AI capo (or wait for one to spawn). In Phase 1, observe AI capo never traverses more than 2 hexes per move and 2 moves per turn. In Phase 2+, max 4 hexes per move.
- Confirm AI soldiers never move more than 2 hexes per turn even when alerted (bounty/safehouse capture).
- Confirm AI units actually move on every AI turn (no stuck-at-zero-moves units after turn 2+).

## What Doesn't Change

- AI recruitment alert bonus, AI action budget, AI personality logic, combat, claiming, deployment, fortify, scout — all unchanged. Only the per-turn movement caps and reset are aligned with the player.

