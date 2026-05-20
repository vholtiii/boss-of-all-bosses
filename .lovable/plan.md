# Cancel an active Plan Hit mark during Tactical

## Goal

Let the player abort a Plan Hit they've already marked, but only during the **Tactical step** of the same/later turn (before execution). This is purely UX + a tiny state action; combat/AI logic is unchanged.

## Behavior

- **When allowed:** `gameState.plannedHit` exists, current step is **Tactical**, and the plan was marked by the player (not AI). Cancelling in Action step is not allowed (player should just let it expire or execute).
- **Effect:** Clear `gameState.plannedHit`. No tactical action refund (mirrors how scout/bribe costs aren't refunded). Emit a small notification: "Plan Hit cancelled — {targetName} no longer marked."
- **No cooldown change**, no heat, no respect change.
- Confirmation: lightweight inline confirm on the button (click once → button morphs to "Confirm cancel?" for ~3s, second click cancels). Avoid a modal.

## UI changes (`src/components/GameSidePanels.tsx`)

In the existing **Active Plan Hit** card (around line 639–681), add a small "✕ Cancel mark" button next to / below the existing content, visible only when `phase === 'tactical'`. Styled as a ghost/destructive-outline button, small. Two-click confirm via local `useState`.

Wire it to `onAction({ type: 'cancel_planned_hit' })`.

## State action (`src/hooks/useEnhancedMafiaGameState.ts`)

Add a new `performAction` case `'cancel_planned_hit'`:

- Guard: require `prev.plannedHit` to exist and `prev.turnStep === 'tactical'` (whatever the field is — match existing tactical checks). Otherwise no-op + warning notification.
- Set `newState.plannedHit = null`.
- Push notification: title "Plan Hit Cancelled", body referencing target name when resolvable.
- Do **not** touch `tacticalActionsRemaining`, cooldowns, heat, respect.

Also export the action type in the same union/types where other plan-hit actions live.

## Tests (`src/hooks/__tests__/plan-hit-two-turn.test.ts`)

Append two cases:

1. Cancelling during Tactical with an active plan clears `plannedHit` and does NOT refund the tactical action.
2. Cancelling with no active plan, or outside Tactical, is a no-op and emits a warning.

## Out of scope

- AI plan hits (`aiPlannedHits`) — players can't cancel those.
- Refund mechanics, cooldown adjustments, heat changes.
- Cancelling during Action step.

## Files touched

- `src/components/GameSidePanels.tsx`
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/hooks/__tests__/plan-hit-two-turn.test.ts`
