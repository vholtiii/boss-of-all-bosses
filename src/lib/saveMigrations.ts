/**
 * Save schema migrations.
 *
 * `schemaVersion` is a plain integer separate from the cosmetic `gameVersion`
 * string. Bump it ONLY when the SHAPE of EnhancedMafiaGameState changes in a
 * way that an old save needs translated to load. Pure balance, sound, and UI
 * tweaks don't touch this — old saves keep loading untouched.
 *
 * To bump: add a migrator under the next version number that turns a state at
 * `(version - 1)` into a state at `version`, and increase CURRENT_SCHEMA_VERSION.
 *
 * Reasons to bump:
 *   - new REQUIRED top-level field on game state
 *   - renamed/removed field that other code assumes is present
 *   - changed value semantics (enum rename, units changed, etc.)
 */

export const CURRENT_SCHEMA_VERSION = 1;

type Migration = (state: any) => any;

export const migrations: Record<number, Migration> = {
  // 1: baseline. No migrations yet. Add e.g.:
  // 2: (s) => ({ ...s, supplyNodes: s.supplyNodes ?? [] }),
};

export interface MigrationResult {
  state: any;
  fromVersion: number;
  toVersion: number;
  migrated: boolean;
}

/**
 * Migrate a save state up to CURRENT_SCHEMA_VERSION.
 * Throws if a required migrator is missing.
 */
export function migrateState(state: any, fromVersion: number | undefined): MigrationResult {
  const start = typeof fromVersion === 'number' && fromVersion > 0 ? fromVersion : 1;
  if (start > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Save schemaVersion ${start} is newer than supported (${CURRENT_SCHEMA_VERSION}). ` +
      `Update the game to load this save.`
    );
  }
  let v = start;
  let cur = state;
  while (v < CURRENT_SCHEMA_VERSION) {
    const next = v + 1;
    const fn = migrations[next];
    if (!fn) {
      throw new Error(`Missing migration to schemaVersion ${next}`);
    }
    cur = fn(cur);
    v = next;
  }
  return { state: cur, fromVersion: start, toVersion: v, migrated: v !== start };
}
