## Goal

Make the save system reliable so players don't lose progress. Today the system has gaps: autosave is defined but never called, saves go only to localStorage (~5 MB cap, easy to exceed with full map state), overwrites/deletes have no confirmation or backup, and there's no safeguard for tab close or quota errors.

## Findings

- `useGameSaveLoad.ts` exposes `autoSave()` but **nothing in the app calls it** — there is no automatic save at all.
- All saves go to `localStorage` only. Game state (hex grid, units, history) can grow large; a single JSON write can hit the ~5 MB browser quota and fail silently aside from a generic toast.
- `saveGame()` overwrites in place with no prior backup. A failed/corrupt write can wipe the previous save in that slot.
- `loadGame()` has no shape validation beyond version — a partially corrupted JSON parses but can crash the game on load.
- The autosave slot (`0`) isn't shown in the Save/Load dialog (loop iterates 1..5), so even if autosave ran, players couldn't see/restore it.
- No "save before unload" guard — closing the tab loses unsaved progress.
- Delete and overwrite have no confirmation prompt.

## Plan

### 1. Add automatic saves (no user action needed)
- Call `autoSave(gameState)` at end of every turn (in `UltimateMafiaGame.tsx`, hook into the turn-advance flow).
- Debounce to once per few seconds to avoid thrash during multi-step turns.
- Add a `beforeunload` listener that runs a final autosave when the tab is closing.
- Surface the autosave slot (slot 0) as "Auto Save" in the Load tab so players can recover from it.

### 2. Backup-before-overwrite
- On every write to a slot, first copy the existing payload to a `*_backup` key.
- On load failure (parse error, shape mismatch), automatically try the backup and notify the player.
- Keep one rolling backup per slot (no unlimited history).

### 3. Storage upgrade with fallback
- Use IndexedDB (via a tiny wrapper, no new deps — native `idb` API) as the primary store; keep localStorage as a mirror for the most recent autosave only (small footprint).
- Catch `QuotaExceededError` explicitly and: retry by trimming the localStorage mirror, surface a clear toast, and still succeed in IndexedDB.
- Migrate any existing localStorage saves to IndexedDB on first load (one-time, non-destructive).

### 4. Safer load + validation
- Add a lightweight shape validator (check required top-level keys: `playerFamily`, `resources`, `hexGrid`, `turn`, `units`, etc.).
- If validation fails, refuse to apply the state and offer the backup.
- Wrap the existing version check so "minor" version diffs only warn, "major" diffs block (already partially done — keep).

### 5. UX safeguards
- Add a confirmation dialog (shadcn `AlertDialog`) before Overwrite and Delete actions.
- Show a small "Saved ✓ HH:MM" indicator in the top bar after each autosave so players know it's working.
- In the dialog, show the autosave slot at the top of the Load tab with an "Auto" badge.

### Technical notes (for the engineer)

- New file: `src/lib/gameStorage.ts` — wraps IndexedDB (`indexedDB.open('mafia-saves', 1)`, object store `saves` keyed by slot id). Exposes `get/put/delete/list` returning Promises. No external library.
- `useGameSaveLoad.ts`: refactor `saveGame/loadGame/deleteSave/getSaveSlots/exportSave/importSave` to be `async` and delegate to `gameStorage`. Keep the same return shape so `SaveLoadDialog` only needs minor `await` updates. Add backup logic inside `saveGame` (read existing → write to `${slot}_backup` → write new). Add migration function called once on hook init.
- `useGameSaveLoad.ts`: add `autoSave` debouncer using a module-level timestamp (e.g. min 5 s between writes). Slot id `auto`.
- `UltimateMafiaGame.tsx`: call `autoSave(gameState)` in the existing turn-end effect; add `useEffect` for `beforeunload` that calls a synchronous localStorage mirror write (IndexedDB is async and unreliable on unload). Render a `Saved ✓ HH:MM` badge near the End Turn button.
- `SaveLoadDialog.tsx`: include the autosave slot in both Save (read-only) and Load tabs. Wrap Overwrite/Delete buttons in `AlertDialog` confirmations. Update handlers to `await` the now-async hook methods.
- Validation: add `isValidGameState(s)` in `src/lib/gameStorage.ts` that checks the required keys above.
- No DB / backend changes. No new packages.

### Out of scope
- Cloud sync to Lovable Cloud (can be a follow-up if you want cross-device saves).
- Versioned save migrations beyond the existing major/minor check.
