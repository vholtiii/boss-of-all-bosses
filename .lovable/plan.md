# Split Plan Hit into Tactical "Mark" + Action "Execute"

## Goal

Make Plan Hit a true two-turn flow:

1. **Turn N — Tactical step:** *Mark target* (costs 1 tactical action, no combat).
2. **Turn N+1 (within expiry) — Action step:** *Execute Plan Hit* (costs 1 action, applies the +20% bonus / 0-casualty mechanics).

Today the data layer already supports this (`gameState.plannedHit` with `expiresOnTurn`, +20% auto-bonus on a normal Hit against the marked target). What needs to change is the UX: a separate "Plan Hit" button still shortcuts both steps into a single Action click via `EnemyHexActionDialog`.

## What changes

### 1. `EnemyHexActionDialog.tsx` — repurpose the Plan Hit button

- Remove the "instant" Plan Hit option that fires `onAction('plan_hit')` on any scouted enemy hex.
- Replace it with an **Execute Plan Hit** button that only renders when the targeted hex matches the player's active `plannedHit` (or holds the marked target unit after relocation).
- Button states:
  - **Ready:** "Execute Plan Hit · +20% bonus · 0 casualties on success"
  - **Relocated target:** "Execute Plan Hit (relocated) · +10% bonus · +5 heat"
  - Otherwise hidden — only Hit / Sabotage / Retreat remain.
- Pass a new `plannedHit` prop (and `targetUnitId`) from `UltimateMafiaGame.tsx` into the dialog so it can decide which variant to render.

### 2. `useEnhancedMafiaGameState.ts` — wire Execute through normal Hit

- In `resolveEnemyHexAction`, change the `'plan_hit'` branch so it requires `prev.plannedHit` to match the target hex (or the marked target's current hex if relocated). If validation fails, surface a notification and abort.
- Keep using the existing `processTerritoryHit` with `_executingPlan: true` — bonus, zero-casualty, relocation heat, cooldown and `plannedHit` consumption already work there.
- Block accidental re-execution if no `plannedHit` is set (no behaviour change for AI).

### 3. Surface the active mark during Action step

- In `GameSidePanels.tsx`, keep the Tactical "Plan Hit" button (already correctly gated to Tactical + 1 tactical action). Reword its sublabel to: "Mark target — execute next Action step".
- Add a small **Active Plan Hit** card visible in both Tactical and Action steps, showing planner, target, turns remaining, "Target on original hex" vs "Target moved", and a one-click "Jump to target" CTA that pans the map to the marked hex. This already partially exists at line 639; extend it so the Action step also shows it and add the pan/select CTA.
- In `EnhancedMafiaHexGrid.tsx`, when a `plannedHit` exists, render a pulsing target ring on the marked hex during Action step so the player can find it visually.

### 4. Phase HUD / banner

- When `plannedHit` exists and we're in Action step, show a small inline HUD chip near the phase banner: "🎯 Plan Hit ready · {turnsRemaining}t". Clicking it pans to the target.

### 5. Tests

- Add a regression test in `src/hooks/__tests__/` (`plan-hit-two-turn.test.ts`) covering:
  - Mark during Tactical decrements `tacticalActionsRemaining`, sets `plannedHit`, does NOT spend an action token.
  - Execute during Action against the marked hex applies the +20% bonus, consumes 1 action, clears `plannedHit`.
  - Attempting "execute" with no `plannedHit` is a no-op with a warning.
  - Relocated-target branch still applies the +10% / +5 heat / cooldown path.

## Out of scope

- AI Plan Hit pipeline (`AIPlannedHit`) already uses its own two-turn `turnsRemaining` and is unchanged.
- Cooldown durations, bonus values, expiry length — all stay the same.
- No changes to documentation files (`COMBAT_SYSTEM_GUIDE.md` etc.) in this pass.

## Files touched

- `src/components/EnemyHexActionDialog.tsx`
- `src/components/GameSidePanels.tsx`
- `src/components/EnhancedMafiaHexGrid.tsx`
- `src/pages/UltimateMafiaGame.tsx`
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/hooks/__tests__/plan-hit-two-turn.test.ts` (new)
