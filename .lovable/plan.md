# AI Heat Parity

Today AI families only accrue heat from hits, and heat has almost no consequence beyond triggering Lay Low. Player heat is broader (claims, extorts, sabotage, passive biz, informants) and carries real risks (income penalties, prosecution, RICO). This plan closes the gap so AI faces the same rates and risks.

## Scope

All edits are in `src/hooks/useEnhancedMafiaGameState.ts` (a few helpers + AI turn pipeline). No UI/visual work.

## 1. Unify heat scaling

Add a single helper used for every AI heat gain so it matches the player formula:

```text
applyAIHeat(state, fam, amount):
  scaled = round(amount * HEAT_GAIN_MULT * policeHeatMult)
  opp.resources.heat = clamp(opp.resources.heat + scaled, 0, 100)
```

- Apply the same `HEAT_GAIN_MULT (1.30)` global multiplier the player gets.
- Apply the difficulty `policeHeatMult` (easy 0.7 / normal 1.0 / hard 1.3) to AI as well — currently AI bypasses it entirely.
- Replace the existing `applyAIHeat(... hitType)` signature with a small wrapper that computes the same `min(25, 8 + units*2)` base, then `/2` for scouted, `×1.5` for blind, `×1` for planned, and routes through the unified helper.

## 2. AI heat for non-hit actions (currently missing)

Mirror player rates 1:1 in the AI turn pipeline:

- **AI claim** (neutral or contested): `+3`, `+6` if the hex has a business. (Player rule at line 791.)
- **AI extort** (success or fail): `+8` neutral / `+12` rival, plus `+5` if the roll fails. (Player rule at line 10168.)
- **AI sabotage**: same rate as player sabotage (currently `+15`, line 9098).
- **AI War Summit**: `+WAR_SUMMIT_HEAT_COST` (line 8674).
- **AI Plan Hit relocation**: `+PLAN_HIT_RELOCATED_HEAT` (line 9611).

Each call goes through the unified helper so difficulty + global mult apply.

## 3. Passive heat from AI illegal operations

Today only the player accrues passive heat from businesses each turn (line ~4189). Add the same loop per AI family:

- For every tile owned by `fam` with a business, accumulate `0.5` if legally built, `1.0` if extorted/illegal.
- `passiveHeat = floor(sum / 3 * HEAT_GAIN_MULT)`, then add to `opp.resources.heat`.
- Skip if AI is `isAILayingLow` (matches player Lay-Low suppression).

## 4. AI heat decay

Player heat decays by `reductionPerTurn` (2 baseline) every turn. Add to each AI:

- `opp.resources.heat = max(0, heat - 2)` per turn during the turn-end pass.
- No district-control bonus for AI (player Brooklyn -5 stays player-only — that's a district-control reward, not a heat mechanic).

## 5. AI heat-tier consequences (the "risks" half)

Apply the same penalties the player feels, scaled to AI economy:

- **Income penalty**: at AI heat ≥40, reduce that family's gross illegal income by 25%; at ≥70 reduce by 35%. Apply inside the existing AI income computation block. (Mirrors player `heatPenaltyRate` at line 5295.)
- **Tier-based AI mood already exists** (Lay Low at ≥60) — keep it; just make sure it now triggers more often because AI actually accrues heat.
- **RICO equivalent for AI**: at heat ≥90 for 3 consecutive turns, eliminate that AI family from the game (their HQ falls, hexes go neutral). Tracked via `opp.ricoTimer`. This mirrors the player's game-over trigger, just scoped to that AI rather than ending the game.
  - On heat dropping below 90, reset `opp.ricoTimer` to 0 with a "RICO suspended" notification.
- **Prosecution risk (lite)**: each turn, with `risk = floor(heat * 0.4) - bribesMitigation`, roll once; on success, jail one AI soldier for `RETURN_TURNS` (matches player arrest path). Skip for AI capos to avoid runaway losses.

## 6. Notifications + Turn Summary

- Push an info notification when an AI family enters tier 2 (≥40), tier 3 (≥70), or critical (≥90).
- Add `aiActions` entries: `'heat_tier'`, `'rico_started'`, `'rico_eliminated'`, `'ai_prosecution_arrest'` so they show up in the turn summary log.

## 7. Tests

Update `src/hooks/__tests__/difficulty-modifiers.test.ts` (or add a new spec) to assert:
- AI heat after a blind hit on hard equals player heat for the same scenario.
- AI claim on a business hex adds `floor(6 * 1.30 * difficultyMult)` heat.
- AI passive heat ticks up turn-over-turn from owned extorted businesses.
- AI at heat ≥90 for 3 turns is removed from the game.

## Out of scope

- AI corruption/bribery to mitigate heat (would need AI bribery AI; can be a follow-up).
- District-control heat bonuses for AI.
- Visual heat meter per AI in the UI.

## Memory updates after build

Update `mem://gameplay/police-heat-system` and `mem://gameplay/ai-behavior` to record full AI heat parity (rates + decay + tier penalties + RICO).
