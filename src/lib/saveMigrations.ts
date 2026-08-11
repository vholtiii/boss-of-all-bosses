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

export const CURRENT_SCHEMA_VERSION = 4;

type Migration = (state: any) => any;

export const migrations: Record<number, Migration> = {
  // v2: arrestedSoldiers / arrestedCapos now carry a `family` tag so AI arrests
  // don't pollute the player's jail UI / HQ. Drop any pre-tag entries — they
  // were polluted by the AI-arrest leak bug and re-deployed wrong on release.
  2: (s) => ({
    ...s,
    arrestedSoldiers: (s.arrestedSoldiers || []).filter((a: any) => !!a.family),
    arrestedCapos: (s.arrestedCapos || []).filter((a: any) => !!a.family),
  }),
  // v3: tile development layer — buildings/policy/recruitProgress on every hex,
  // plus the global districtUpgrades list.
  3: (s) => ({
    ...s,
    districtUpgrades: s.districtUpgrades || [],
    hexMap: (s.hexMap || []).map((t: any) => ({
      ...t,
      buildings: t.buildings || {},
      policy: t.policy || 'earn',
      recruitProgress: t.recruitProgress || 0,
    })),
  }),
  // v4: the old per-hex `business` record is gone. Player/AI-built businesses
  // become tier 1 buildings on their block; extorted ones become anchor rackets.
  4: (s) => ({
    ...s,
    hexMap: (s.hexMap || []).map((t: any) => {
      const biz = t.business;
      const { business, ...rest } = t;
      if (!biz) return { ...rest, buildings: t.buildings || {} };
      const trackMap: Record<string, string> = {
        store: 'store_front', store_front: 'store_front', restaurant: 'store_front',
        construction: 'store_front', brothel: 'brothel', prostitution: 'brothel',
        gambling: 'gambling_den', gambling_den: 'gambling_den', casino: 'gambling_den',
        loan_sharking: 'loan_sharking',
      };
      const track = trackMap[biz.type] || 'store_front';
      if (biz.isExtorted) {
        const tribute = biz.income || 1800;
        return {
          ...rest,
          buildings: t.buildings || {},
          anchor: {
            type: track,
            name: String(track).replace('_', ' '),
            tribute,
            heatLevel: biz.heatLevel || 2,
            buyoutCost: Math.round((tribute * 6) / 500) * 500,
            isLegal: !!biz.isLegal,
            launderingCapacity: biz.launderingCapacity || 0,
            isExtorted: true,
          },
        };
      }
      return { ...rest, buildings: { ...(t.buildings || {}), [track]: 1 } };
    }),
  }),


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
