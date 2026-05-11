## Goal

Two related problems to solve:

1. **Cloud sync** — saves currently live only in the browser (IndexedDB + localStorage mirror). Clearing site data, switching devices, or switching browsers loses everything. We want saves backed up to Lovable Cloud and restorable on any device the player signs into.
2. **Version compatibility** — the game updates frequently. Today `useGameSaveLoad.loadGame` blocks any save whose major version differs from `CURRENT_VERSION` ('1.0.0'), and minor diffs only show a warning. Frequent updates will start invalidating saves silently or break them at runtime.

## Part 1 — Link saves to Lovable Cloud

### Approach

- Enable Lovable Cloud and turn on email/password + Google sign-in.
- Add a lightweight "Sign in to sync" surface in the Save/Load dialog. Anonymous play keeps working exactly as today (local-only).
- When the player is signed in, every save (manual + autosave) writes to **both** local storage and a `cloud_saves` table.
- On sign-in (or app load), pull the cloud slot list and merge with local: newer-by-`saveDate` wins. Show conflicts as a banner ("Cloud save is newer — Use cloud / Keep local").

### Data model

Single table `cloud_saves`:

| column | type | notes |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid | FK `auth.users`, RLS scoped |
| `slot` | text | `'auto' | '1' | '2' | '3' | '4' | '5'` |
| `save_data` | jsonb | full `SaveGameData` |
| `game_version` | text | denormalized for filtering |
| `schema_version` | int | see Part 2 |
| `save_date` | timestamptz | from payload |
| `updated_at` | timestamptz | trigger |

- Unique constraint on `(user_id, slot)`.
- RLS: owner can `select/insert/update/delete` their rows only. No public read.
- Roles table not needed (no admin features here).

### Sync logic

- `gameStorage.ts` gains a `cloudAdapter` with the same `readSlot/writeSlot/deleteSlot/listSlots` shape.
- New `syncCloud()` helper run on sign-in and after each successful local write:
  - Push: upload local payload if local `saveDate` > cloud `saveDate`.
  - Pull: if cloud is newer, surface a non-destructive prompt before overwriting local.
- Autosave throttle is unchanged locally; cloud writes piggy-back on the same throttle to avoid spamming the DB.
- Failures degrade silently to local-only with a small "Cloud sync failed — retrying" toast; we never block gameplay on a failed cloud write.

### UI changes

- `SaveLoadDialog`:
  - Header strip: "Signed in as X · Cloud sync ✓" or "Sign in to sync saves across devices" with a button.
  - Each slot card gets a tiny badge: `Local`, `Cloud`, `Synced`, or `Conflict`.
  - "Restore from Cloud" action on cloud-only slots.

## Part 2 — Versioning that survives frequent updates

### Problem with the current scheme

- `CURRENT_VERSION = '1.0.0'` is hand-edited and rarely bumped.
- Any major bump instantly bricks every old save.
- There is no migration path — only "compatible / not compatible".

### New scheme

Introduce a **numeric `schemaVersion`** separate from the cosmetic `gameVersion` string:

- `gameVersion` = human-readable build tag (still shown in UI). Pulled from `package.json` automatically so we stop forgetting to bump it.
- `schemaVersion` = integer that only changes when the **shape of `EnhancedMafiaGameState` changes** in a way that needs handling. Most frequent updates (balance tweaks, new sounds, UI) won't touch it.

### Migration registry

New file `src/lib/saveMigrations.ts`:

```ts
export const CURRENT_SCHEMA_VERSION = 7;

type Migration = (state: any) => any;
export const migrations: Record<number, Migration> = {
  // 1 -> 2: added supplyNodes
  2: (s) => ({ ...s, supplyNodes: s.supplyNodes ?? [] }),
  // 2 -> 3: renamed hexMap -> hexGrid
  3: (s) => { const { hexMap, ...rest } = s; return { ...rest, hexGrid: hexGrid ?? hexMap ?? [] }; },
  // ...
};

export function migrate(state: any, fromVersion: number) {
  let v = fromVersion ?? 1;
  let cur = state;
  while (v < CURRENT_SCHEMA_VERSION) {
    v += 1;
    const fn = migrations[v];
    if (!fn) throw new Error(`No migration to v${v}`);
    cur = fn(cur);
  }
  return { state: cur, version: v };
}
```

### Load pipeline

`useGameSaveLoad.loadGame` becomes:

1. Read payload (local or cloud).
2. Validate shape with `isValidSaveData` (already exists).
3. If `payload.schemaVersion < CURRENT_SCHEMA_VERSION` → run `migrate()`.
4. If `payload.schemaVersion > CURRENT_SCHEMA_VERSION` → refuse load with "This save was made on a newer version. Update the game to continue."
5. After a successful migration, **re-save migrated state back to the slot** (and to backup) so the next load is a no-op.
6. If migration throws, fall back to the slot's `__backup` copy and surface a clear toast.

### Discipline going forward

- `CURRENT_SCHEMA_VERSION` is bumped only when a code change requires it. A short checklist comment in `saveMigrations.ts` tells the engineer when: new required field, renamed field, removed field, changed value semantics.
- Balance/UI/sound changes never touch `schemaVersion`; old saves keep loading untouched.
- One write-up in `GAME_MECHANICS.md` documents the policy so it's not lost.

### Out of scope

- Realtime cross-device sync while two tabs play simultaneously (last-writer-wins is fine).
- Cloud save sharing between users.
- Snapshot history beyond the existing one-deep `__backup`.

## Implementation order

1. Add `schemaVersion` + `saveMigrations.ts`, wire into existing local load. Bump to v1, no migrations yet — pure groundwork.
2. Enable Lovable Cloud + auth, create `cloud_saves` table with RLS.
3. Add cloud adapter + sync logic in `gameStorage.ts` and `useGameSaveLoad.ts`.
4. Update `SaveLoadDialog` with sign-in strip, slot badges, and conflict resolution.
5. Document the schema-bump policy in `GAME_MECHANICS.md`.

## Questions before I build

1. **Auth methods** — OK to default to email/password + Google sign-in (Lovable Cloud defaults), or do you want only one of them?
2. **Anonymous play** — keep local-only saves working without an account (recommended), or require sign-in for saving at all?
3. **Conflict policy** — when local and cloud disagree, prompt the player every time, or auto-pick the newest by `saveDate` and just notify?
