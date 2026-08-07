# Stop the game dropping back to the family select screen

## What I found

The active game is held only in React memory. In `src/pages/UltimateMafiaGame.tsx` the shell keeps `gameConfig` in `useState(null)`, and when it is null it renders the family selection screen. Nothing writes that config to storage and nothing restores it on mount.

That means **any full page reload sends you straight back to family selection** — a dev-server reload, a browser refresh, a preview refresh, a mobile tab reclaim, or a hard crash outside the React tree. It looks like "the game crashed", but the render-time error boundary (`GameErrorBoundary`) would instead show a "The game hit an unexpected error" card with recovery buttons, so a silent jump to the select screen is a remount, not a caught render error.

Diagnosis of the reload trigger itself is unconfirmed — no crash report or console error is currently captured. The plan therefore both makes the session survive a reload and adds the instrumentation to identify the trigger if it keeps happening.

## The efficient fix

1. **Persist only the session shell.** Write the small `gameConfig` object once when a family is selected. Do not write on every turn or game-state update.

2. **Restore lazily on mount.** Read that one config value once when the page starts. If present, initialize the game directly; otherwise render family selection as today.

3. **Reuse the existing autosave.** Keep game-state persistence inside the current throttled `useGameSaveLoad` flow. Do not add a second autosave loop, polling, timers, or a new save format.

4. **Clear only on explicit exit.** The existing Exit button and error-boundary "Return to menu" action remove the stored shell config. Normal rerenders and HMR/reloads leave it available for recovery.

5. **Keep diagnostics passive.** Use the already-recorded `lastCrashReport` and `recentBackgroundErrors` only when investigating a real failure; do not add new per-turn breadcrumbs or runtime listeners as part of the fix.

## Technical notes

- Files touched: `src/pages/UltimateMafiaGame.tsx` and, only if needed, the existing save/load integration point.
- One small local-storage write occurs at game start and one read occurs at app mount; there is no ongoing processing cost.
- Reuses the existing throttled autosave slot (`auto`) — no new save format, schema migration, polling, or background worker.
- No gameplay, AI, balance, or map-generation changes.
