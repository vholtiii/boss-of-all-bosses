# Stabilize the game: stop crashes that kick the player back to the select screen

## What's actually happening

There is **no React error boundary** anywhere in the app. When any render-time exception is thrown inside `GameContent` (state-update glitch, undefined map lookup, malformed save, AI logic crash, etc.) React tears the whole tree down. In dev/preview, Vite then remounts the root; in production the page goes blank. Either way the in-memory `gameConfig` in `UltimateMafiaGame` is lost, so the next mount falls through to the family-select screen. That's the "crash back to select" the user sees.

Right now we have:
- No error boundary
- No window-level `error` / `unhandledrejection` handler
- An existing autosave (`useGameSaveLoad.autoSave`) that we can lean on for recovery
- A `gameConfig` held in component state, so any unmount = back to select

## Fix in three layers

### 1. Catch render errors instead of unmounting

Add `src/components/GameErrorBoundary.tsx` — a small class component that:

- Catches errors via `getDerivedStateFromError` + `componentDidCatch`.
- Records `error`, `errorInfo.componentStack`, `timestamp`, and the last known game-state snapshot (via a `getSnapshot` prop) into `localStorage` under `lastCrashReport` (keep only the most recent).
- Renders a recovery UI when in error state:
  - Headline: "The game hit an unexpected error."
  - Buttons:
    - **Recover from last autosave** (only shown when an autosave exists for the current family)
    - **Restart same family** (re-init with the same `gameConfig`, same map seed)
    - **Return to main menu** (calls `onExitToMenu`)
  - Collapsible "Technical details" with the error message + first ~30 lines of the component stack.
- Exposes `reset()` which bumps an internal key so the wrapped tree fully remounts after recovery.

Wrap `GameContent` in `UltimateMafiaGame`:

```tsx
<GameErrorBoundary
  config={gameConfig}
  onExitToMenu={() => setGameConfig(null)}
  onRestart={() => setGameConfig({ ...gameConfig })}
>
  <GameContent config={gameConfig} onExitToMenu={() => setGameConfig(null)} />
</GameErrorBoundary>
```

Because `gameConfig` stays alive on the parent, the player no longer gets dumped to the select screen on an error.

### 2. Catch async errors that would otherwise bubble up later

Add a tiny `src/lib/globalErrorReporter.ts` that, mounted once from `App.tsx`:

- Subscribes to `window.addEventListener('error', ...)` and `'unhandledrejection'`.
- Throttles to at most one toast per 5s (`sonner.toast.error("Background error — game state preserved.")`).
- Appends each entry (timestamp + message + stack) to a ring buffer in `localStorage` (`recentBackgroundErrors`, cap 20).

This means an exception in an AI timer or async save no longer poisons future renders silently.

### 3. Harden the two hottest crash surfaces

These are the realistic sources of "occasional" crashes based on what we already saw in the codebase. Keep changes surgical.

**a. Turn advancement in `useEnhancedMafiaGameState.ts`** — wrap the body of `advancePhase` and the AI-turn block in a `try` that, on throw:
- Logs the error and the action it was processing.
- Returns `prev` unchanged (so React never sees a half-updated state).
- Pushes a `pendingNotifications` entry: "AI turn stumbled — turn skipped to keep the game stable."

This stops a single bad AI calculation from killing the whole React tree. (Scope: wrap, don't refactor logic.)

**b. Save deserialization in `useGameSaveLoad.ts`** — wrap `JSON.parse` + `migrateState` calls in try/catch and reject the load with a clear toast instead of throwing into React.

## Tests

Add `src/components/__tests__/GameErrorBoundary.test.tsx`:

- Renders a child that throws on first render; asserts the recovery UI shows, `gameConfig` is preserved, and `reset()` allows the child to render successfully on the second attempt.
- Asserts a `lastCrashReport` entry is written to `localStorage`.

## Out of scope

- Refactoring the actual logic inside `useEnhancedMafiaGameState` to find the root cause of any specific crash. That's a separate investigation; this pass is about **containment + recovery** so a single crash stops being a session-ender.
- Server-side telemetry. We only persist crash info to `localStorage` for now.
- Visual redesign of the recovery screen beyond a clean, themed card.

## Files touched

- `src/components/GameErrorBoundary.tsx` (new)
- `src/lib/globalErrorReporter.ts` (new)
- `src/pages/UltimateMafiaGame.tsx` (wrap `GameContent`, add restart handler)
- `src/App.tsx` (mount global error reporter once)
- `src/hooks/useEnhancedMafiaGameState.ts` (try/catch around turn advance + AI block)
- `src/hooks/useGameSaveLoad.ts` (try/catch around parse/migrate)
- `src/components/__tests__/GameErrorBoundary.test.tsx` (new)
