// ============================================================================
// MAP OVERLAYS — pure derivation of strategic map layers from game state.
//
// Consumed by EnhancedMafiaHexGrid (rendering), hex hover cards, and tests.
// All functions are read-only and accept a game-state-shaped object
// (structurally typed as `any` to avoid a circular import with the hook).
// ============================================================================

import {
  EROSION_PROTECTION_RANGE,
  DISTRICT_CONTROL_THRESHOLD,
  SUPPLY_DEPENDENCIES,
} from '@/types/game-mechanics';
import { getHexNeighborsPure, hexDistancePure } from '@/lib/action-formulas';

export const hexKey = (q: number, r: number, s: number) => `${q},${r},${s}`;

export interface VulnerabilityInfo {
  /** Number of adjacent enemy-influence sources (units + hexes). */
  pressure: number;
  /** True if no friendly protection source within EROSION_PROTECTION_RANGE. */
  unprotected: boolean;
  /** Current erosion counter on the tile (turns of sustained enemy pressure). */
  erosionCounter: number;
}

export interface DistrictOwnership {
  district: string;
  totalHexes: number;
  /** family -> controlled hex count */
  counts: Record<string, number>;
  /** family that clears DISTRICT_CONTROL_THRESHOLD, or null */
  owner: string | null;
  playerShare: number; // 0..1
  /** Hexes the player still needs to claim to reach the control threshold. */
  playerHexesToControl: number;
}

export interface ExpansionCandidate {
  key: string;
  q: number; r: number; s: number;
  score: number;
  reasons: string[];
}

export interface MapOverlays {
  /** Player hexes bordering a warring enemy family, plus that enemy's border hexes. */
  warFrontHexes: Set<string>;
  /** Families the player is currently at war with. */
  warEnemies: string[];
  /** Player hexes at erosion risk: enemy pressure and/or unprotected. */
  vulnerability: Map<string, VulnerabilityInfo>;
  /** Player hexes NOT connected to the HQ network (no supply, no protection web). */
  unsupportedHexes: Set<string>;
  /** Player hexes covered by a protection source (unit/built biz/supply node/safehouse in range). */
  protectedHexes: Set<string>;
  /** Player hexes with a fortification. */
  fortifiedHexes: Set<string>;
  /** Hexes with an active safehouse (player-controlled). */
  safehouseHexes: Set<string>;
  /** Player business hexes cut off from a required supply node type. keys -> missing node types */
  disconnectedBusinesses: Map<string, string[]>;
  /** Neutral hexes adjacent to player territory, scored for expansion. */
  expansionCandidates: ExpansionCandidate[];
  /** Per-district control stats. */
  districtOwnership: DistrictOwnership[];
  /** Hexes with a pending (unfinalized) claim. key -> claiming family */
  pendingClaims: Map<string, { family: string; sinceTurn: number }>;
}

/** BFS from a family's HQ across its own territory (mirrors getConnectedTerritory in the hook). */
export const computeConnectedTerritory = (hexMap: any[], family: string): Set<string> => {
  const hq = hexMap.find(t => t.isHeadquarters === family);
  if (!hq) return new Set();
  const byKey = new Map<string, any>(hexMap.map(t => [hexKey(t.q, t.r, t.s), t]));
  const visited = new Set<string>([hexKey(hq.q, hq.r, hq.s)]);
  const queue = [{ q: hq.q, r: hq.r, s: hq.s }];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const n of getHexNeighborsPure(cur.q, cur.r, cur.s)) {
      const k = hexKey(n.q, n.r, n.s);
      if (visited.has(k)) continue;
      const tile = byKey.get(k);
      if (tile && (tile.controllingFamily === family || tile.isHeadquarters === family)) {
        visited.add(k);
        queue.push(n);
      }
    }
  }
  return visited;
};

/** Mirrors processInfluenceSystem's isProtectedBy: any friendly influence source within range. */
export const isHexProtected = (state: any, hex: { q: number; r: number; s: number }, family: string): boolean => {
  const units: any[] = state.deployedUnits || [];
  if (units.some(u => u.family === family && hexDistancePure(u, hex) <= EROSION_PROTECTION_RANGE)) return true;
  const hexMap: any[] = state.hexMap || [];
  if (hexMap.some(t =>
    t.controllingFamily === family && t.business && !t.business.isExtorted &&
    hexDistancePure(t, hex) <= EROSION_PROTECTION_RANGE)) return true;
  if (hexMap.some(t =>
    t.controllingFamily === family && t.supplyNode &&
    hexDistancePure(t, hex) <= EROSION_PROTECTION_RANGE)) return true;
  if ((state.safehouses || []).some((sh: any) => {
    const shTile = hexMap.find(t => t.q === sh.q && t.r === sh.r && t.s === sh.s);
    return shTile && shTile.controllingFamily === family && hexDistancePure(sh, hex) <= EROSION_PROTECTION_RANGE;
  })) return true;
  return false;
};

/** Count adjacent enemy influence: enemy-controlled neighbor hexes + enemy units on/adjacent to the hex. */
export const computeEnemyPressure = (state: any, hex: { q: number; r: number; s: number }, family: string): number => {
  const hexMap: any[] = state.hexMap || [];
  const units: any[] = state.deployedUnits || [];
  const neighbors = getHexNeighborsPure(hex.q, hex.r, hex.s);
  let pressure = 0;
  for (const n of neighbors) {
    const t = hexMap.find(t2 => t2.q === n.q && t2.r === n.r && t2.s === n.s);
    if (t && t.controllingFamily !== 'neutral' && t.controllingFamily !== family) pressure++;
  }
  pressure += units.filter(u =>
    u.family !== family &&
    (hexDistancePure(u, hex) <= 1)
  ).length;
  return pressure;
};

export const computeMapOverlays = (state: any): MapOverlays => {
  const playerFamily: string = state.playerFamily;
  const hexMap: any[] = state.hexMap || [];
  const units: any[] = state.deployedUnits || [];

  // ── War fronts ──
  const warEnemies: string[] = (state.activeWars || [])
    .filter((w: any) => w.family1 === playerFamily || w.family2 === playerFamily)
    .map((w: any) => (w.family1 === playerFamily ? w.family2 : w.family1));
  const warFrontHexes = new Set<string>();
  if (warEnemies.length > 0) {
    hexMap.forEach(t => {
      const mine = t.controllingFamily === playerFamily;
      const enemys = warEnemies.includes(t.controllingFamily);
      if (!mine && !enemys) return;
      const opposing = mine ? warEnemies : [playerFamily];
      const borders = getHexNeighborsPure(t.q, t.r, t.s).some(n => {
        const nt = hexMap.find(t2 => t2.q === n.q && t2.r === n.r && t2.s === n.s);
        return nt && opposing.includes(nt.controllingFamily);
      });
      if (borders) warFrontHexes.add(hexKey(t.q, t.r, t.s));
    });
  }

  // ── Connectivity / support ──
  const connected = computeConnectedTerritory(hexMap, playerFamily);
  const playerHexes = hexMap.filter(t => t.controllingFamily === playerFamily);
  const unsupportedHexes = new Set<string>();
  playerHexes.forEach(t => {
    const k = hexKey(t.q, t.r, t.s);
    if (!connected.has(k)) unsupportedHexes.add(k);
  });

  // ── Protection & vulnerability ──
  const protectedHexes = new Set<string>();
  const vulnerability = new Map<string, VulnerabilityInfo>();
  playerHexes.forEach(t => {
    const k = hexKey(t.q, t.r, t.s);
    const prot = isHexProtected(state, t, playerFamily);
    if (prot) protectedHexes.add(k);
    const pressure = computeEnemyPressure(state, t, playerFamily);
    if (!prot || pressure > 0) {
      vulnerability.set(k, {
        pressure,
        unprotected: !prot,
        erosionCounter: t.erosionCounter || 0,
      });
    }
  });

  // ── Fortifications & safehouses ──
  const fortifiedHexes = new Set<string>(
    (state.fortifiedHexes || [])
      .filter((f: any) => f.family === playerFamily)
      .map((f: any) => hexKey(f.q, f.r, f.s))
  );
  const safehouseHexes = new Set<string>(
    (state.safehouses || []).map((sh: any) => hexKey(sh.q, sh.r, sh.s))
  );

  // ── Disconnected businesses (supply decay risk) ──
  const connectedNodeTypes = new Set<string>();
  (state.supplyNodes || []).forEach((node: any) => {
    if (connected.has(hexKey(node.q, node.r, node.s))) connectedNodeTypes.add(node.type);
  });
  const disconnectedBusinesses = new Map<string, string[]>();
  playerHexes.forEach(t => {
    if (!t.business) return;
    const deps = SUPPLY_DEPENDENCIES[t.business.type];
    if (!deps || deps.length === 0) return;
    const hasAccess = deps.some(dep => connectedNodeTypes.has(dep));
    if (!hasAccess) disconnectedBusinesses.set(hexKey(t.q, t.r, t.s), [...deps]);
  });

  // ── District ownership ──
  const districts = new Map<string, { total: number; counts: Record<string, number> }>();
  hexMap.forEach(t => {
    const d = districts.get(t.district) || { total: 0, counts: {} };
    d.total++;
    if (t.controllingFamily !== 'neutral') {
      d.counts[t.controllingFamily] = (d.counts[t.controllingFamily] || 0) + 1;
    }
    districts.set(t.district, d);
  });
  const districtOwnership: DistrictOwnership[] = [...districts.entries()].map(([district, d]) => {
    let owner: string | null = null;
    Object.entries(d.counts).forEach(([fam, count]) => {
      if (count / d.total >= DISTRICT_CONTROL_THRESHOLD) owner = fam;
    });
    const playerCount = d.counts[playerFamily] || 0;
    const needed = Math.ceil(d.total * DISTRICT_CONTROL_THRESHOLD);
    return {
      district,
      totalHexes: d.total,
      counts: d.counts,
      owner,
      playerShare: d.total > 0 ? playerCount / d.total : 0,
      playerHexesToControl: Math.max(0, needed - playerCount),
    };
  });

  // ── Expansion candidates (neutral hexes adjacent to player territory) ──
  const playerKeySet = new Set(playerHexes.map(t => hexKey(t.q, t.r, t.s)));
  const expansionCandidates: ExpansionCandidate[] = [];
  hexMap.forEach(t => {
    if (t.controllingFamily !== 'neutral' || t.isHeadquarters) return;
    const neighbors = getHexNeighborsPure(t.q, t.r, t.s);
    const adjacentToPlayer = neighbors.filter(n => playerKeySet.has(hexKey(n.q, n.r, n.s))).length;
    if (adjacentToPlayer === 0) return;

    let score = adjacentToPlayer; // base: easier to hold with more friendly neighbors
    const reasons: string[] = [];
    if (adjacentToPlayer >= 2) reasons.push(`${adjacentToPlayer} friendly neighbors`);
    if (t.supplyNode) { score += 4; reasons.push(`${t.supplyNode} supply node`); }
    if (t.business) {
      const inc = t.business.income || 0;
      score += Math.min(4, inc / 1500);
      reasons.push(`$${inc.toLocaleString()}/turn business`);
    }
    const distStat = districtOwnership.find(d => d.district === t.district);
    if (distStat && !distStat.owner && distStat.playerHexesToControl > 0 && distStat.playerHexesToControl <= 3) {
      score += 3;
      reasons.push(`${distStat.playerHexesToControl} more for ${t.district} control`);
    }
    // Would this hex reconnect an unsupported pocket?
    const reconnects = neighbors.some(n => unsupportedHexes.has(hexKey(n.q, n.r, n.s)));
    if (reconnects) { score += 3; reasons.push('reconnects cut-off territory'); }
    // Contested by a rival's pending claim — urgent
    if (t.pendingClaim && t.pendingClaim.family !== playerFamily) {
      score += 2;
      reasons.push(`rival ${t.pendingClaim.family} is claiming it`);
    }
    expansionCandidates.push({ key: hexKey(t.q, t.r, t.s), q: t.q, r: t.r, s: t.s, score: Math.round(score * 10) / 10, reasons });
  });
  expansionCandidates.sort((a, b) => b.score - a.score);

  // ── Pending claims ──
  const pendingClaims = new Map<string, { family: string; sinceTurn: number }>();
  hexMap.forEach(t => {
    if (t.pendingClaim) pendingClaims.set(hexKey(t.q, t.r, t.s), { ...t.pendingClaim });
  });

  return {
    warFrontHexes,
    warEnemies,
    vulnerability,
    unsupportedHexes,
    protectedHexes,
    fortifiedHexes,
    safehouseHexes,
    disconnectedBusinesses,
    expansionCandidates,
    districtOwnership,
    pendingClaims,
  };
};

/**
 * Identify "route-breaking" hexes: player hexes whose loss would disconnect
 * other territory from the HQ network (articulation points, approximated by
 * removal simulation — fine for map sizes here).
 */
export const computeRouteBreakingHexes = (state: any): Set<string> => {
  const playerFamily: string = state.playerFamily;
  const hexMap: any[] = state.hexMap || [];
  const baseline = computeConnectedTerritory(hexMap, playerFamily);
  const result = new Set<string>();
  const playerTiles = hexMap.filter(t => t.controllingFamily === playerFamily && !t.isHeadquarters);
  for (const tile of playerTiles) {
    const k = hexKey(tile.q, tile.r, tile.s);
    if (!baseline.has(k)) continue;
    const without = hexMap.map(t => (t === tile ? { ...t, controllingFamily: 'neutral' } : t));
    const after = computeConnectedTerritory(without, playerFamily);
    // Losing this hex costs more than just itself → it was holding a route together
    if (baseline.size - after.size > 1) result.add(k);
  }
  return result;
};
