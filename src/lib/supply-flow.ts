import type {
  SupplyNodeType,
  SupplyRoutingConfig,
  BusinessSupplyStatus,
  SupplyFlowSnapshot,
  Safehouse,
} from '@/types/game-mechanics';
import {
  ALL_SUPPLY_NODE_TYPES,
  SUPPLY_GENERATION_RATE,
  SUPPLY_BUSINESS_COST,
  SUPPLY_DEAL_MAX_UNITS,
  HQ_SUPPLY_CAPACITY,
  SAFEHOUSE_MAX_STOCKPILE,
  SAFEHOUSE_MAX_ALLOCATION,
  SUPPLY_DEPENDENCIES,
  SUPPLY_NODE_CONFIG,
  SUPPLY_STOCKPILE_BUFFER,
  SUPPLY_DECAY_RATE,
  SUPPLY_DECAY_FLOOR,
  TENSION_PACT_BREAK,
} from '@/types/game-mechanics';

/** Minimal state shape for supply flow (avoids circular import with the game hook). */
export interface SupplyFlowGameState {
  turn: number;
  playerFamily: string;
  hexMap: Array<{
    q: number; r: number; s: number;
    district: string;
    controllingFamily: string;
    isHeadquarters?: string;
    supplyNode?: SupplyNodeType;
    anchor?: { type: string; tribute: number; isExtorted?: boolean };
    buildings?: Record<string, number | undefined>;

  }>;
  supplyNodes?: Array<{ type: SupplyNodeType; q: number; r: number; s: number }>;
  aiOpponents: Array<{ family: string }>;
  familySupplyStorage?: Array<{ nodeType: SupplyNodeType; family: string; hqUnits: number }>;
  supplyRoutingConfig?: SupplyRoutingConfig;
  businessSupplyStatus?: Record<string, BusinessSupplyStatus>;
  supplyFlowSnapshot?: SupplyFlowSnapshot;
  supplyDealPacts?: Array<{
    id: string; active: boolean; buyerFamily: string; targetFamily: string;
    turnsRemaining: number; royaltyRate?: number;
  }>;
  safehouses: Safehouse[];
  pendingNotifications: Array<{ type: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string }>;
  reputation: { familyRelationships: Record<string, number>; reputation: number };
  familyTensions: Record<string, number>;
  supplyStockpile?: unknown;
}

export const supplyHexKey = (q: number, r: number, s: number) => `${q},${r},${s}`;

/** Per-type moved/lost counts when transferring safehouse stockpile to HQ. */
export type SupplyTransferResult = Partial<Record<SupplyNodeType, { moved: number; lost: number }>>;

export function emptyTransferResult(): SupplyTransferResult {
  return {};
}

function mergeTransferEntry(
  result: SupplyTransferResult,
  nodeType: SupplyNodeType,
  moved: number,
  lost: number,
) {
  if (moved <= 0 && lost <= 0) return;
  const prev = result[nodeType] || { moved: 0, lost: 0 };
  result[nodeType] = { moved: prev.moved + moved, lost: prev.lost + lost };
}

export function formatTransferSummary(result: SupplyTransferResult): string {
  const parts: string[] = [];
  for (const nodeType of ALL_SUPPLY_NODE_TYPES) {
    const entry = result[nodeType];
    if (!entry || (entry.moved <= 0 && entry.lost <= 0)) continue;
    const label = SUPPLY_NODE_CONFIG[nodeType].label.toLowerCase();
    if (entry.moved > 0 && entry.lost > 0) {
      parts.push(`${entry.moved} ${label} to HQ, ${entry.lost} lost`);
    } else if (entry.moved > 0) {
      parts.push(`${entry.moved} ${label} to HQ`);
    } else {
      parts.push(`${entry.lost} ${label} lost`);
    }
  }
  return parts.join('; ');
}

export function hasTransferActivity(result: SupplyTransferResult): boolean {
  return ALL_SUPPLY_NODE_TYPES.some(t => {
    const e = result[t];
    return e && (e.moved > 0 || e.lost > 0);
  });
}

export const defaultSupplyRoutingConfig = (): SupplyRoutingConfig => ({
  haltedBusinessHexKeys: [],
  hqPriorityTypes: [],
  businessFeedOrder: {},
});

export function migrateSupplyState(state: SupplyFlowGameState): SupplyFlowGameState {
  if (!state.familySupplyStorage) state.familySupplyStorage = [];
  if (!state.supplyRoutingConfig) state.supplyRoutingConfig = defaultSupplyRoutingConfig();
  if (!state.businessSupplyStatus) state.businessSupplyStatus = {};
  if (!state.supplyFlowSnapshot) {
    state.supplyFlowSnapshot = { turn: state.turn || 0, types: [] };
  }
  // Legacy field — no longer used at runtime
  if ((state as any).supplyStockpile) delete (state as any).supplyStockpile;
  return state;
}

const hexDirs = [
  { q: 1, r: 0, s: -1 }, { q: -1, r: 0, s: 1 }, { q: 0, r: 1, s: -1 },
  { q: 0, r: -1, s: 1 }, { q: 1, r: -1, s: 0 }, { q: -1, r: 1, s: 0 },
];

export function getConnectedTerritorySet(hexMap: SupplyFlowGameState['hexMap'], family: string): Set<string> {
  const hk = supplyHexKey;
  const famHexSet = new Set(
    hexMap.filter(t => t.controllingFamily === family || t.isHeadquarters === family).map(t => hk(t.q, t.r, t.s))
  );
  const hqT = hexMap.find(t => t.isHeadquarters === family);
  if (!hqT) return new Set<string>();

  for (const node of hexMap.filter(t => t.supplyNode)) {
    const nodeKey = hk(node.q, node.r, node.s);
    if (famHexSet.has(nodeKey)) continue;
    const hasNeighbor = hexDirs.some(d => famHexSet.has(hk(node.q + d.q, node.r + d.r, node.s + d.s)));
    if (hasNeighbor) famHexSet.add(nodeKey);
  }

  const vis = new Set<string>();
  const bQ: Array<{ q: number; r: number; s: number }> = [{ q: hqT.q, r: hqT.r, s: hqT.s }];
  vis.add(hk(hqT.q, hqT.r, hqT.s));
  while (bQ.length > 0) {
    const c = bQ.shift()!;
    for (const d of hexDirs) {
      const nq = c.q + d.q, nr = c.r + d.r, ns = c.s + d.s;
      const nk = hk(nq, nr, ns);
      if (vis.has(nk) || !famHexSet.has(nk)) continue;
      vis.add(nk);
      bQ.push({ q: nq, r: nr, s: ns });
    }
  }
  return vis;
}

export function getTerritorialNodeTypes(state: SupplyFlowGameState, family: string): Set<SupplyNodeType> {
  const connected = getConnectedTerritorySet(state.hexMap, family);
  const types = new Set<SupplyNodeType>();
  (state.supplyNodes || []).forEach(node => {
    if (connected.has(supplyHexKey(node.q, node.r, node.s))) types.add(node.type);
  });
  return types;
}

function getHqStorage(state: SupplyFlowGameState, family: string, nodeType: SupplyNodeType): number {
  return (state.familySupplyStorage || []).find(e => e.family === family && e.nodeType === nodeType)?.hqUnits ?? 0;
}

function setHqStorage(state: SupplyFlowGameState, family: string, nodeType: SupplyNodeType, units: number) {
  state.familySupplyStorage = state.familySupplyStorage || [];
  const idx = state.familySupplyStorage.findIndex(e => e.family === family && e.nodeType === nodeType);
  const val = Math.max(0, Math.min(HQ_SUPPLY_CAPACITY, units));
  if (idx >= 0) state.familySupplyStorage[idx].hqUnits = val;
  else state.familySupplyStorage.push({ family, nodeType, hqUnits: val });
}

function getSafehouseStored(state: SupplyFlowGameState, family: string, nodeType: SupplyNodeType): number {
  let total = 0;
  for (const sh of state.safehouses || []) {
    const tile = state.hexMap.find(t => t.q === sh.q && t.r === sh.r && t.s === sh.s);
    if (tile?.controllingFamily === family) total += sh.stockpile[nodeType] || 0;
  }
  return total;
}

function drawSafehouseStorage(state: SupplyFlowGameState, family: string, nodeType: SupplyNodeType, amount: number) {
  let remaining = amount;
  for (const sh of state.safehouses || []) {
    if (remaining <= 0) break;
    const tile = state.hexMap.find(t => t.q === sh.q && t.r === sh.r && t.s === sh.s);
    if (tile?.controllingFamily !== family) continue;
    const cur = sh.stockpile[nodeType] || 0;
    const take = Math.min(cur, remaining);
    sh.stockpile[nodeType] = cur - take;
    remaining -= take;
  }
}

interface SupplyBusiness {
  q: number; r: number; s: number;
  hexKey: string;
  businessType: string;
  income: number;
  district: string;
  deps: SupplyNodeType[];
}

function getSupplyBusinesses(state: SupplyFlowGameState, family: string): SupplyBusiness[] {
  const out: SupplyBusiness[] = [];
  for (const tile of state.hexMap) {
    if (tile.controllingFamily !== family) continue;
    const types: string[] = [];
    let income = 0;
    if (tile.anchor?.isExtorted) { types.push(tile.anchor.type); income += tile.anchor.tribute || 0; }
    Object.keys(tile.buildings || {}).forEach(t => { if ((tile.buildings as any)[t]) types.push(t); });
    if (!types.length) continue;
    const deps = Array.from(new Set(types.flatMap(t => SUPPLY_DEPENDENCIES[t] || []))) as SupplyNodeType[];
    if (!deps.length) continue;
    out.push({
      q: tile.q, r: tile.r, s: tile.s,
      hexKey: supplyHexKey(tile.q, tile.r, tile.s),
      businessType: types[0],
      income,
      district: tile.district,
      deps,
    });
  }

  return out;
}

function businessNeedsType(biz: SupplyBusiness, type: SupplyNodeType): boolean {
  return biz.deps.includes(type);
}

function countDemandForType(businesses: SupplyBusiness[], type: SupplyNodeType): number {
  return businesses.filter(b => businessNeedsType(b, type)).length;
}

function sortBusinessesForFeed(
  businesses: SupplyBusiness[],
  routing: SupplyRoutingConfig | null,
  nodeType: SupplyNodeType,
): SupplyBusiness[] {
  const relevant = businesses.filter(b => businessNeedsType(b, nodeType));
  const order = routing?.businessFeedOrder?.[nodeType];
  if (order?.length) {
    const rank = new Map(order.map((k, i) => [k, i]));
    return [...relevant].sort((a, b) => {
      const ra = rank.has(a.hexKey) ? rank.get(a.hexKey)! : 9999;
      const rb = rank.has(b.hexKey) ? rank.get(b.hexKey)! : 9999;
      if (ra !== rb) return ra - rb;
      return b.income - a.income;
    });
  }
  return [...relevant].sort((a, b) => b.income - a.income);
}

function pickBestDepType(deps: SupplyNodeType[], pools: Record<SupplyNodeType, number>): SupplyNodeType | null {
  let best: SupplyNodeType | null = null;
  let bestPool = -1;
  for (const d of deps) {
    const p = pools[d] || 0;
    if (p > bestPool) { bestPool = p; best = d; }
  }
  return bestPool >= SUPPLY_BUSINESS_COST ? best : null;
}

function updateSafehouseConnections(state: SupplyFlowGameState) {
  const hk = supplyHexKey;
  const allFamilies = [state.playerFamily, ...state.aiOpponents.map(o => o.family)];

  for (const sh of state.safehouses || []) {
    const shTile = state.hexMap.find(t => t.q === sh.q && t.r === sh.r && t.s === sh.s);
    if (!shTile || shTile.controllingFamily === 'neutral') {
      sh.connectedSupplyTypes = [];
      continue;
    }
    const ownerFamily = shTile.controllingFamily;
    const routeSet = getConnectedTerritorySet(state.hexMap, ownerFamily);
    const connTypes = getTerritorialNodeTypes(state, ownerFamily);
    const shKey = hk(sh.q, sh.r, sh.s);
    const isOnRoute = routeSet.has(shKey);
    const isAdjToRoute = !isOnRoute && hexDirs.some(d => routeSet.has(hk(sh.q + d.q, sh.r + d.r, sh.s + d.s)));
    let isManualConnected = false;
    if (sh.manualRouteEstablished) {
      const ownedSet = new Set(state.hexMap.filter(t => t.controllingFamily === ownerFamily).map(t => hk(t.q, t.r, t.s)));
      const mVis = new Set<string>([shKey]);
      const mQ: Array<{ q: number; r: number; s: number }> = [{ q: sh.q, r: sh.r, s: sh.s }];
      while (mQ.length > 0 && !isManualConnected) {
        const c = mQ.shift()!;
        for (const d of hexDirs) {
          const nk = hk(c.q + d.q, c.r + d.r, c.s + d.s);
          if (mVis.has(nk)) continue;
          if (routeSet.has(nk)) { isManualConnected = true; break; }
          if (ownedSet.has(nk)) { mVis.add(nk); mQ.push({ q: c.q + d.q, r: c.r + d.r, s: c.s + d.s }); }
        }
      }
      if (!isManualConnected) {
        sh.manualRouteEstablished = false;
        sh.subRoutePath = undefined;
      }
    }
    sh.connectedSupplyTypes = (isOnRoute || isAdjToRoute || isManualConnected)
      ? Array.from(connTypes)
      : [];
  }
}

function restockSurplus(
  state: SupplyFlowGameState,
  family: string,
  pools: Record<SupplyNodeType, number>,
  routing: SupplyRoutingConfig | null,
) {
  const familySafehouses = (state.safehouses || []).filter(sh => {
    const tile = state.hexMap.find(t => t.q === sh.q && t.r === sh.r && t.s === sh.s);
    return tile?.controllingFamily === family && sh.connectedSupplyTypes.length > 0;
  });

  for (const nodeType of ALL_SUPPLY_NODE_TYPES) {
    let surplus = pools[nodeType] || 0;
    if (surplus <= 0) continue;

    const totalAlloc = familySafehouses.reduce((s, sh) => s + sh.allocationPercent, 0);
    if (totalAlloc > 0) {
      for (const sh of familySafehouses) {
        if (surplus <= 0) break;
        const share = sh.allocationPercent / totalAlloc;
        const add = Math.min(surplus, Math.floor(surplus * share + 0.001));
        const room = SAFEHOUSE_MAX_STOCKPILE - (sh.stockpile[nodeType] || 0);
        const put = Math.min(add, room);
        if (put > 0) {
          sh.stockpile[nodeType] = (sh.stockpile[nodeType] || 0) + put;
          surplus -= put;
        }
      }
    }

    const hqPriority = routing?.hqPriorityTypes?.includes(nodeType) ?? true;
    if (hqPriority && surplus > 0) {
      const hqCur = getHqStorage(state, family, nodeType);
      const room = HQ_SUPPLY_CAPACITY - hqCur;
      const put = Math.min(surplus, room);
      if (put > 0) {
        setHqStorage(state, family, nodeType, hqCur + put);
        surplus -= put;
      }
    }
  }
}

export function seedInitialFamilySupplyStorage(state: SupplyFlowGameState) {
  const allFamilies = [state.playerFamily, ...state.aiOpponents.map(o => o.family)];
  state.familySupplyStorage = state.familySupplyStorage || [];
  for (const fam of allFamilies) {
    const types = getTerritorialNodeTypes(state, fam);
    for (const nodeType of types) {
      setHqStorage(state, fam, nodeType, HQ_SUPPLY_CAPACITY);
    }
    // Seed one unit of each type in starting district's plausible nodes if not connected yet
    if (types.size === 0) {
      const hq = state.hexMap.find(t => t.isHeadquarters === fam);
      if (hq) {
        for (const nodeType of ALL_SUPPLY_NODE_TYPES) {
          const cfg = SUPPLY_NODE_CONFIG[nodeType];
          if (cfg.districts.includes(hq.district)) {
            setHqStorage(state, fam, nodeType, HQ_SUPPLY_CAPACITY);
          }
        }
      }
    }
  }
}

export function transferSafehouseUnitsToHq(
  state: SupplyFlowGameState,
  sh: Safehouse,
  ownerFamily: string,
): SupplyTransferResult {
  const result = emptyTransferResult();
  for (const nodeType of ALL_SUPPLY_NODE_TYPES) {
    const units = sh.stockpile[nodeType] || 0;
    if (units <= 0) continue;
    const hqCur = getHqStorage(state, ownerFamily, nodeType);
    const room = HQ_SUPPLY_CAPACITY - hqCur;
    const transferred = Math.min(units, room);
    const lost = units - transferred;
    if (transferred > 0) setHqStorage(state, ownerFamily, nodeType, hqCur + transferred);
    sh.stockpile[nodeType] = 0;
    mergeTransferEntry(result, nodeType, transferred, lost);
  }
  return result;
}

export function seizeSafehouseStockpileToFamily(
  state: SupplyFlowGameState,
  sh: Safehouse,
  captorFamily: string,
): SupplyTransferResult {
  const result = emptyTransferResult();
  for (const nodeType of ALL_SUPPLY_NODE_TYPES) {
    const units = Math.floor(sh.stockpile[nodeType] || 0);
    if (units <= 0) continue;
    const hqCur = getHqStorage(state, captorFamily, nodeType);
    const room = HQ_SUPPLY_CAPACITY - hqCur;
    const seized = Math.min(units, room);
    const lost = units - seized;
    if (seized > 0) setHqStorage(state, captorFamily, nodeType, hqCur + seized);
    sh.stockpile[nodeType] = 0;
    mergeTransferEntry(result, nodeType, seized, lost);
  }
  return result;
}

export function destroySafehouseWithTransfer(
  state: SupplyFlowGameState,
  sh: Safehouse,
  mode: 'expiry_to_owner' | 'capture_to_captor',
  recipientFamily: string,
): SupplyTransferResult {
  if (mode === 'expiry_to_owner') {
    return transferSafehouseUnitsToHq(state, sh, recipientFamily);
  }
  return seizeSafehouseStockpileToFamily(state, sh, recipientFamily);
}

export function getBusinessSupplyDecayMultiplier(
  hexKey: string,
  businessSupplyStatus: Record<string, BusinessSupplyStatus> | undefined,
): number {
  const st = businessSupplyStatus?.[hexKey];
  if (!st || st.status === 'supplied') return 1;
  const starved = st.consecutiveTurnsStarved;
  if (starved <= SUPPLY_STOCKPILE_BUFFER) return 1;
  const decayTurns = starved - SUPPLY_STOCKPILE_BUFFER;
  return Math.max(SUPPLY_DECAY_FLOOR, 1 - SUPPLY_DECAY_RATE * decayTurns);
}

export function processSupplyFlow(state: SupplyFlowGameState) {
  migrateSupplyState(state);
  const allFamilies = [state.playerFamily, ...state.aiOpponents.map(o => o.family)];
  const territorialTypes: Record<string, Set<SupplyNodeType>> = {};
  const pools: Record<string, Record<SupplyNodeType, number>> = {};
  const dealCommitsByBuyer: Record<string, Partial<Record<SupplyNodeType, number>>> = {};
  const dealCommitsBySupplier: Record<string, Partial<Record<SupplyNodeType, number>>> = {};

  for (const fam of allFamilies) {
    territorialTypes[fam] = getTerritorialNodeTypes(state, fam);
    pools[fam] = {} as Record<SupplyNodeType, number>;
    for (const nodeType of ALL_SUPPLY_NODE_TYPES) {
      const generated = territorialTypes[fam].has(nodeType) ? SUPPLY_GENERATION_RATE : 0;
      const hqStored = getHqStorage(state, fam, nodeType);
      const shStored = getSafehouseStored(state, fam, nodeType);
      setHqStorage(state, fam, nodeType, 0);
      drawSafehouseStorage(state, fam, nodeType, shStored);
      pools[fam][nodeType] = generated + hqStored + shStored;
    }
  }

  // Pass 1: ally deal commitments (supplier → buyer)
  for (const pact of (state.supplyDealPacts || []).filter(p => p.active)) {
    const supplier = pact.targetFamily;
    const buyer = pact.buyerFamily;
    if (!pools[supplier] || !pools[buyer]) continue;
    const buyerBiz = getSupplyBusinesses(state, buyer);
    for (const nodeType of ALL_SUPPLY_NODE_TYPES) {
      if (!territorialTypes[supplier].has(nodeType)) continue;
      const demand = countDemandForType(buyerBiz, nodeType);
      const selfGen = territorialTypes[buyer].has(nodeType) ? SUPPLY_GENERATION_RATE : 0;
      const need = Math.max(0, demand - selfGen);
      if (need <= 0) continue;
      const commit = Math.min(need, SUPPLY_DEAL_MAX_UNITS, pools[supplier][nodeType] || 0);
      if (commit <= 0) continue;
      pools[supplier][nodeType] -= commit;
      dealCommitsByBuyer[buyer] = dealCommitsByBuyer[buyer] || {};
      dealCommitsByBuyer[buyer][nodeType] = (dealCommitsByBuyer[buyer][nodeType] || 0) + commit;
      dealCommitsBySupplier[supplier] = dealCommitsBySupplier[supplier] || {};
      dealCommitsBySupplier[supplier][nodeType] = (dealCommitsBySupplier[supplier][nodeType] || 0) + commit;
    }
  }

  for (const fam of allFamilies) {
    for (const nodeType of ALL_SUPPLY_NODE_TYPES) {
      pools[fam][nodeType] += dealCommitsByBuyer[fam]?.[nodeType] || 0;
    }
  }

  const businessStatus: Record<string, BusinessSupplyStatus> = {};
  const fedByHex = new Set<string>();

  for (const fam of allFamilies) {
    const routing = fam === state.playerFamily ? state.supplyRoutingConfig : null;
    const businesses = getSupplyBusinesses(state, fam);

    for (const nodeType of ALL_SUPPLY_NODE_TYPES) {
      const ordered = sortBusinessesForFeed(businesses, routing, nodeType);
      for (const biz of ordered) {
        if (fedByHex.has(biz.hexKey)) continue;
        const halted = fam === state.playerFamily && routing?.haltedBusinessHexKeys.includes(biz.hexKey);
        const prevStarved = state.businessSupplyStatus?.[biz.hexKey]?.consecutiveTurnsStarved ?? 0;

        if (halted) {
          businessStatus[biz.hexKey] = {
            hexKey: biz.hexKey, family: fam, status: 'halted',
            consecutiveTurnsStarved: prevStarved + 1,
          };
          continue;
        }

        const typeToUse = pickBestDepType(biz.deps, pools[fam]);
        if (typeToUse && (pools[fam][typeToUse] || 0) >= SUPPLY_BUSINESS_COST) {
          pools[fam][typeToUse] -= SUPPLY_BUSINESS_COST;
          businessStatus[biz.hexKey] = {
            hexKey: biz.hexKey, family: fam, status: 'supplied',
            consecutiveTurnsStarved: 0, supplyTypeUsed: typeToUse,
          };
          fedByHex.add(biz.hexKey);
        }
      }
    }

    // Starve any unfed businesses
    for (const biz of businesses) {
      if (fedByHex.has(biz.hexKey)) continue;
      const prevStarved = state.businessSupplyStatus?.[biz.hexKey]?.consecutiveTurnsStarved ?? 0;
      const halted = fam === state.playerFamily && routing?.haltedBusinessHexKeys.includes(biz.hexKey);
      businessStatus[biz.hexKey] = {
        hexKey: biz.hexKey, family: fam,
        status: halted ? 'halted' : 'starved',
        consecutiveTurnsStarved: prevStarved + 1,
      };
    }

    restockSurplus(state, fam, pools[fam], fam === state.playerFamily ? routing : null);
  }

  state.businessSupplyStatus = businessStatus;
  updateSafehouseConnections(state);
  state.supplyFlowSnapshot = buildPlayerSnapshot(state, territorialTypes, dealCommitsBySupplier);

  // Player notifications on first severance
  for (const nodeType of ALL_SUPPLY_NODE_TYPES) {
    const wasConnected = (state as any)._prevSupplyConnected?.includes?.(nodeType);
    const nowConnected = territorialTypes[state.playerFamily]?.has(nodeType);
    if (wasConnected && !nowConnected) {
      const cfg = SUPPLY_NODE_CONFIG[nodeType];
      state.pendingNotifications.push({
        type: 'warning',
        title: `Supply Route Severed: ${cfg.label}`,
        message: `Your route to ${cfg.label} ${cfg.icon} was cut. HQ and safehouse stockpiles will sustain businesses until they run dry.`,
      });
    }
  }
  (state as any)._prevSupplyConnected = ALL_SUPPLY_NODE_TYPES.filter(t =>
    territorialTypes[state.playerFamily]?.has(t)
  );
}

function buildPlayerSnapshot(
  state: SupplyFlowGameState,
  territorialTypes: Record<string, Set<SupplyNodeType>>,
  dealCommitsBySupplier: Record<string, Partial<Record<SupplyNodeType, number>>>,
): SupplyFlowSnapshot {
  const fam = state.playerFamily;
  const businesses = getSupplyBusinesses(state, fam);
  const viaDealTypes = new Set<SupplyNodeType>();
  (state.supplyDealPacts || []).filter(p => p.active && p.buyerFamily === fam).forEach(p => {
    for (const t of ALL_SUPPLY_NODE_TYPES) {
      if (territorialTypes[p.targetFamily]?.has(t)) viaDealTypes.add(t);
    }
  });

  const types = ALL_SUPPLY_NODE_TYPES.map(nodeType => {
    const connected = territorialTypes[fam]?.has(nodeType) ?? false;
    const generated = connected ? SUPPLY_GENERATION_RATE : 0;
    const committed = dealCommitsBySupplier[fam]?.[nodeType] || 0;
    const hqUnits = getHqStorage(state, fam, nodeType);
    const safehouseUnits = getSafehouseStored(state, fam, nodeType);
    const deps = businesses.filter(b => b.deps.includes(nodeType));
    const used = deps.filter(b => state.businessSupplyStatus?.[b.hexKey]?.status === 'supplied'
      && state.businessSupplyStatus?.[b.hexKey]?.supplyTypeUsed === nodeType).length;
    const netSurplus = generated + hqUnits + safehouseUnits - committed - used;
    return {
      nodeType,
      connected,
      viaDeal: !connected && viaDealTypes.has(nodeType),
      generatedPerTurn: generated,
      committedToAllies: committed,
      usedByBusinesses: used,
      hqUnits,
      safehouseUnits,
      netSurplus,
      dependentBusinesses: deps.map(b => ({
        hexKey: b.hexKey,
        type: b.businessType,
        district: b.district,
        status: state.businessSupplyStatus?.[b.hexKey]?.status || 'starved',
        income: b.income,
      })),
    };
  });

  return { turn: state.turn, types };
}

export function cancelSupplyDeal(state: SupplyFlowGameState, pactId: string): boolean {
  const pact = (state.supplyDealPacts || []).find(p => p.id === pactId && p.active);
  if (!pact) return false;
  if (pact.targetFamily !== state.playerFamily) return false;

  pact.active = false;
  pact.turnsRemaining = 0;
  const buyer = pact.buyerFamily;
  const buyerLabel = buyer.charAt(0).toUpperCase() + buyer.slice(1);

  if (state.reputation.familyRelationships[buyer] !== undefined) {
    state.reputation.familyRelationships[buyer] = Math.max(-100,
      (state.reputation.familyRelationships[buyer] || 0) - 25);
  }
  state.reputation.reputation = Math.max(0, (state.reputation.reputation || 0) - 10);

  const key = [state.playerFamily, buyer].sort().join('-');
  state.familyTensions[key] = Math.min(100, (state.familyTensions[key] || 0) + TENSION_PACT_BREAK);

  state.pendingNotifications.push({
    type: 'error',
    title: 'Supply Deal Broken',
    message: `You cut off supply to the ${buyerLabel} family. Royalty income stopped. Relationship -25, tension +${TENSION_PACT_BREAK}.`,
  });

  return true;
}
