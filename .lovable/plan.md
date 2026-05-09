## Goal

The game engine currently only checks victory conditions for the **player**. AI rivals can dominate the map forever without ever "winning". This plan adds symmetric AI victory detection inside the engine and a new end-game screen for when an AI wins (you lose by AI victory, not by RICO/bankruptcy/assassination).

---

## Step 1 — Engine: AI victory detection

In `src/hooks/useEnhancedMafiaGameState.ts`, extend `updateVictoryProgress` (line ~1328) so that after computing the player's victory progress, it also evaluates each surviving AI opponent against the **same** thresholds:

- **Territory:** AI controls ≥ `TERRITORY_TARGET` hexes (40/60/80 by map size).
- **Economic:** AI `lastTurnIncome` ≥ `$50,000`.
- **Legacy:** Same formula already used for AI as a "rival" (`territory*3 + soldiers*2 + money/500`), but now compared against every other family (player + other AIs); AI wins if it exceeds the next-best by 25% AND `turn > 15`.
- **Domination:** All non-AI families eliminated (player + every other AI).
- **Commission:** Already a player-only flow; for AI parity we won't auto-trigger AI commission votes in this loop (out of scope — flagged in the plan summary, not implemented). The state field is preserved.

If multiple AIs hit thresholds the same turn, prefer in this order: domination > territory > economic > legacy. If both player and an AI qualify the same turn, **player wins** (existing behavior — player check runs first; we only set AI victory when player's `victoryType` is still null).

### State additions

Add a new field on `EnhancedMafiaGameState`:

```ts
aiVictor?: {
  family: FamilyId;
  type: 'territory' | 'economic' | 'legacy' | 'domination';
  turn: number;
} | null;
```

When AI victory is detected and player has no `victoryType` and no `gameOver`:
- Set `state.aiVictor = { family, type, turn }`.
- Push a notification: `❌ DEFEAT — The {Family} family has won by {type}!`

Also update `endTurn`'s end-of-turn flow so once `aiVictor` is set, no further AI/turn processing is needed (similar to how `victoryType` short-circuits).

### Last-standing edge case

If the player is already in `gameOver` (RICO/bankruptcy/etc) and exactly one AI survives, set `aiVictor` with `type: 'domination'`. This way the existing game-over screen can still show, but we also know who "inherited" the city — used in the new screen variant below.

---

## Step 2 — UI: AI Victory / Player Defeat screen

In `src/pages/UltimateMafiaGame.tsx`, add a new conditional block **before** the existing `gameOver` block (so AI victory takes precedence over a same-turn player bankruptcy, since the AI win is the more meaningful outcome):

```text
if (gameState.aiVictor) { ...new screen... }
else if (gameState.gameOver?.type === 'rico' | 'bankruptcy' | ...) { ...existing... }
else if (isWinner) { ...existing victory screen... }
```

The new screen mirrors the existing GAME OVER layout (same motion, same Card styling, same "Return to Main Menu" button) but with:

- Header emoji per win type: 👑 territory, 💰 economic, 🏛️ legacy, ☠️ domination.
- Title: `{FAMILY NAME} WINS` (uppercase, family color via existing family color tokens).
- Subtitle describing the win type, e.g. "The Genovese family controls 60+ hexes — the city is theirs."
- Stat grid:
  - Turns Played
  - Winner Family
  - Winner Territory
  - Winner Soldiers
  - Your Final Territory
  - Your Final Wealth
  - Families Eliminated
- Defeat badge: `DEFEAT — Turn {n}`.
- Same `Return to Main Menu` action (`onExitToMenu`).

Use the same semantic tokens (no raw colors) and `font-playfair` headings to match the existing screens.

---

## Step 3 — Tests

Add `src/hooks/__tests__/ai-victory-detection.test.ts`:

- Build a synthetic state where one AI controls ≥ territory target → call `updateVictoryProgress` → assert `state.aiVictor.type === 'territory'`.
- Build a state where AI `lastTurnIncome` ≥ 50k → assert `economic`.
- Build a state where player is `gameOver` and one AI is the only survivor → assert `domination`.
- Player victory takes precedence: both player and AI meet territory the same call → `aiVictor` is null, `victoryType` is set.

The existing simulation harness (`src/hooks/__tests__/simulation.test.ts`) keeps its harness-side `checkAIVictory` for now but should also surface `state.aiVictor` if the engine sets it first — small update to record `winner = state.aiVictor.family` in the report.

---

## Step 4 — Verify

- `bunx vitest run` — all existing 51+ tests pass plus the 4 new ones.
- Re-run the 3 simulations; reports should now show `winner` populated for AI wins via the engine field, not just the harness-side detector.

---

## Out of scope

- AI initiating Commission Votes (separate design call: needs an AI policy for when to call a vote and how rivals decide).
- Rebalancing thresholds (e.g. economic target may be too easy for AI — flagged for a follow-up if sims show instant AI economic wins).
- Any changes to the player-victory or player-game-over screens.
- AI personality-specific defeat copy.

---

## Files

- `src/hooks/useEnhancedMafiaGameState.ts` — extend `updateVictoryProgress`, add `aiVictor` to state + initial value, short-circuit in `endTurn`.
- `src/types/game-mechanics.ts` (or wherever `EnhancedMafiaGameState` lives) — add `aiVictor` field type.
- `src/pages/UltimateMafiaGame.tsx` — new defeat-by-AI screen block.
- `src/hooks/__tests__/ai-victory-detection.test.ts` — new tests.
- `src/hooks/__tests__/simulation.test.ts` — small update to record engine-set `aiVictor`.
