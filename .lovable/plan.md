# Stop the game dropping back to the family select screen

## What I found

The active game is held only in React memory. In `src/pages/UltimateMafiaGame.tsx` the shell keeps `gameConfig` in `useState(null)`, and when it is null it renders the family selection screen. Nothing writes that config to storage and nothing restores it on mount.

That means **any full page reload sends you straight back to family selection** — a dev-server reload, a browser refresh, a preview refresh, a mobile tab reclaim, or a hard crash outside the React tree. It looks like "the game crashed", but the render-time error boundary (`GameErrorBoundary`) would instead show a "The game hit an unexpected error" card with recovery buttons, so a silent jump to the select screen is a remount, not a caught render error.

Diagnosis of the reload trigger itself is unconfirmed — no crash report or console error is currently captured. The plan therefore both makes the session survive a reload and adds the instrumentation to identify the trigger if it keeps happening.

## The fix

1. **Persist the session shell.** Save `gameConfig` (family, resources, difficulty, seed, map size) to local storage whenever it changes, and clear it only on an explicit "Exit to menu".

2. **Resume on load.** On mount, if a stored config exists and an autosave slot is present, skip family selection and drop the player back into the running game with the autosaved state loaded. Show a brief "Resumed your last session" note.

3. **Offer a choice when resume is ambiguous.** If a stored config exists but the autosave is missing or fails validation, show the select screen with a "Continue last game" option instead of silently discarding it.

4. **Capture why it reloaded.** Record a lightweight breadcrumb (timestamp, turn, phase) on every autosave and on `beforeunload`, plus surface any stored `lastCrashReport` / `recentBackgroundErrors` entries as a one-line notice on resume. If an actual JS crash is behind this, the next occurrence will name it.

## Technical notes

- Files touched: `src/pages/UltimateMafiaGame.tsx` (persist/restore shell), `src/lib/gameStorage.ts` (config key + breadcrumb helpers), and the resume entry point in `src/components/FamilySelectionScreen.tsx` for the "Continue last game" button.
- Reuses the existing `useGameSaveLoad` autosave slot (`auto`) — no new save format, no schema migration.
- No gameplay, AI, or balance logic changes.
