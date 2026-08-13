# Cleanup and stability pass

Goal: remove genuinely dead code, cut bundle weight, and harden the game against the failure modes that drop players back to the family select screen. No gameplay, balance, or visual changes.

## Current state (verified)

- Full test suite passes: 27 files, 188 tests, including three full-game simulations with 0 errors / 0 anomalies.
- An unused-code scan reports 28 unreferenced files (27 of them unused shadcn UI primitives plus `TutorialSystem.tsx` and `motion-presets.ts`), 21 unused npm dependencies, and a long tail of unused exports and exported types.
- `GameErrorBoundary` wraps the game shell in `src/pages/UltimateMafiaGame.tsx`, and a global error/rejection reporter is installed in `App.tsx`.
- Session recovery writes the game config to localStorage inside a try/catch; the save mirror writes in `src/lib/gameStorage.ts` are the larger writes.

## 1. Dead code removal

- Delete the unused shadcn primitives that nothing imports (alert, aspect-ratio, avatar, breadcrumb, calendar, carousel, chart, command, context-menu, drawer, dropdown-menu, form, input-otp, menubar, navigation-menu, pagination, radio-group, resizable, select, sidebar, skeleton, textarea, toggle, toggle-group, use-toast re-export).
- Remove `src/components/TutorialSystem.tsx` and `src/lib/motion-presets.ts` (no importers).
- Drop the 21 unused dependencies (`react-hook-form`, `zod`, `recharts`, `date-fns`, `cmdk`, `embla-carousel-react`, `vaul`, `react-day-picker`, `input-otp`, `react-resizable-panels`, the matching unused Radix packages, `@hookform/resolvers`, `@tailwindcss/typography`).
- Tidy unused exports that are pure leftovers (e.g. `previewClaim`/`previewHQAssault` and siblings in `action-previews.ts`, `analysisReports`, `isHexProtected`, `computeEnemyPressure`, `emptyTransferResult`, `getConnectedTerritorySet`, unused constants). Keep anything referenced by tests, docs generation, or save migrations; when in doubt, keep and leave a short comment.
- Keep exported types alone unless the whole module is going away — they cost nothing at runtime and removing them churns type surfaces.
- Re-run the full test suite and a typecheck after each deletion batch, so a mistaken removal is caught immediately.

## 2. Crash minimisation

- **Narrow the blast radius of render errors.** Today one thrown render kills the whole game shell. Add smaller error boundaries around the heavy, independently-failing surfaces — the hex map, the two side panels, and modal overlays — so a bad panel shows an inline "this panel failed" card instead of dumping the player back to family selection.
- **Guarantee no unmount on crash.** Confirm the top-level boundary's recovery path keeps the game config and last autosave intact, and offer "reload last save" rather than "return to menu" as the default action.
- **Harden storage writes.** Wrap the save mirror writes in `gameStorage.ts` in try/catch with quota handling: on failure, drop the oldest non-auto slot and retry once, then surface a single toast rather than throwing.
- **Guard save loading.** Validate the parsed save shape before it enters state and fall back to a clean start with a clear message when a save is malformed or from an incompatible version, instead of letting a missing field throw deep inside a turn resolution.
- **Silence noisy runtime logging.** Gate the remaining `console.log` calls in the game hook behind a dev-only flag so production consoles stay clean.

## 3. Verification

- `bunx vitest run` green (all 188 tests, including the three simulations).
- Typecheck clean.
- Manual pass in the preview: start a new game, play several turns, open every sidebar panel and modal, save/load, and refresh mid-game to confirm session recovery still restores the board.

## Technical notes

- Deletions are batched by risk: unused UI primitives first, then standalone modules, then dependency removal, then unused exports.
- The new inner boundaries reuse the existing `GameErrorBoundary` component with a compact fallback variant; no new error-reporting infrastructure.
- No changes to game rules, AI, economy, map generation, or save format.
