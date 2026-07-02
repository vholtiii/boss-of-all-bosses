// ============================================================================
// ACTION FORMULAS — single source of truth for action math.
//
// These pure, read-only functions are shared by:
//   1. The executors in useEnhancedMafiaGameState (process* handlers)
//   2. The pre-commit consequence previews (action-previews.ts / ActionPreviewCard)
//   3. Tests that assert preview/execution parity
//
// They accept a game-state-shaped object (structurally typed as `any` to avoid
// a circular import with the hook) and NEVER mutate it.
// ============================================================================

import {
  HEAT_GAIN_MULT,
  BLIND_HIT_PENALTY,
  FORTIFY_DEFENSE_BONUS,
  SAFEHOUSE_DEFENSE_BONUS,
  BUILT_BUSINESS_DEFENSE_BONUS,
  SCOUT_INTEL_BONUS,
  SCOUT_STALE_BONUS,
  WAR_SUMMIT_COMBAT_BONUS,
  PLAN_HIT_BONUS,
  PLAN_HIT_RELOCATED_BONUS,
  HQ_ASSAULT_BASE_CHANCE,
  HQ_ASSAULT_MAX_CHANCE,
  HQ_DEFENSE_BONUS,
  MATTRESSES_HQ_BONUS,
  FLIP_SOLDIER_BASE_CHANCE,
  FLIP_SOLDIER_BASE_COST,
  FLIP_SOLDIER_COST_ESCALATION,
  FAMILY_BONUSES,
  BRIBE_TIERS,
  BribeTier,
  COMMISSION_VOTE_COST,
  COMMISSION_MIN_SURVIVORS,
  COMMISSION_VOTE_RELATIONSHIP_THRESHOLD,
  CORONATION_QUALIFIER_BUFF_CAP,
  CLAIM_HEAT_PLAIN,
  CLAIM_HEAT_BUSINESS,
  ENCROACHMENT_NEIGHBOR_THRESHOLD,
  TENSION_TERRITORY_HIT,
  TENSION_EXTORT_RIVAL,
  TENSION_ENCROACHMENT,
} from '@/types/game-mechanics';

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** A single labelled contribution to a success chance or other stat. */
export interface PreviewModifier {
  label: string;
  /** Percentage points (for chances) or absolute units (for flat stats). */
  delta: number;
}

const hexNeighborDirections = [
  { q: 1, r: 0, s: -1 }, { q: 1, r: -1, s: 0 }, { q: 0, r: -1, s: 1 },
  { q: -1, r: 0, s: 1 }, { q: -1, r: 1, s: 0 }, { q: 0, r: 1, s: -1 },
];

export const getHexNeighborsPure = (q: number, r: number, s: number) =>
  hexNeighborDirections.map(d => ({ q: q + d.q, r: r + d.r, s: s + d.s }));

export const hexDistancePure = (a: { q: number; r: number; s: number }, b: { q: number; r: number; s: number }) =>
  (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;

/** Mirrors applyPlayerHeat scaling: difficulty policeHeatMult × global HEAT_GAIN_MULT. */
export const scalePlayerHeat = (state: any, amount: number): number => {
  const mult = state?.difficultyModifiers?.policeHeatMult ?? 1;
  return Math.max(0, Math.round(amount * mult * HEAT_GAIN_MULT));
};

const hasDistrictBonus = (state: any, family: string, bonusType: string): boolean =>
  (state.activeDistrictBonuses || []).some((b: any) => b.family === family && b.bonusType === bonusType);

const isHexFortifiedFor = (state: any, q: number, r: number, s: number, family: string): boolean =>
  (state.fortifiedHexes || []).some((f: any) => f.q === q && f.r === r && f.s === s && f.family === family);

const findTile = (state: any, q: number, r: number, s: number) =>
  (state.hexMap || []).find((t: any) => t.q === q && t.r === r && t.s === s);

// ---------------------------------------------------------------------------
// HIT (territory combat)
// ---------------------------------------------------------------------------

export interface HitComputation {
  ok: boolean;
  blockedReason?: string;
  attackers: number;
  defenders: number;
  isScouted: boolean;
  scoutFresh: boolean;
  executingPlanHit: boolean;
  /** Plan-hit bonus resolution: target on planned hex / relocated / gone / no plan. */
  planBonus: 'full' | 'relocated' | 'lost' | null;
  /** Unscouted hit with no defenders = civilian-casualty branch (heat → 100). */
  blindCivilianRisk: boolean;
  chance: number;
  modifiers: PreviewModifier[];
  /** RAW heat (before difficulty × HEAT_GAIN_MULT scaling). */
  rawHeat: number;
  /** Heat as it will actually land (scaled). */
  scaledHeat: number;
  targetFamily: string;
}

/**
 * Computes hit success chance + heat exactly as processTerritoryHit does.
 * Read-only; the executor consumes `chance`/`rawHeat`/`planBonus` and applies side effects.
 */
export const computeHitCore = (
  state: any,
  args: { targetQ: number; targetR: number; targetS: number; selectedUnitId?: string; executingPlan?: boolean }
): HitComputation => {
  const { targetQ, targetR, targetS, selectedUnitId, executingPlan } = args;
  const empty: HitComputation = {
    ok: false, attackers: 0, defenders: 0, isScouted: false, scoutFresh: false,
    executingPlanHit: false, planBonus: null, blindCivilianRisk: false,
    chance: 0, modifiers: [], rawHeat: 0, scaledHeat: 0, targetFamily: 'neutral',
  };
  const tile = findTile(state, targetQ, targetR, targetS);
  if (!tile) return { ...empty, blockedReason: 'No such hex' };
  const _isExecPlan = !!executingPlan;
  if (!_isExecPlan && (tile.controllingFamily === state.playerFamily || tile.isHeadquarters)) {
    return { ...empty, blockedReason: tile.isHeadquarters ? 'Headquarters require an HQ Assault' : 'Own territory' };
  }
  if ((state.ceasefires || []).some((c: any) => c.active && c.family === tile.controllingFamily)) {
    return { ...empty, targetFamily: tile.controllingFamily, blockedReason: `Ceasefire active with ${tile.controllingFamily}` };
  }
  if ((state.alliances || []).some((a: any) => a.active && a.alliedFamily === tile.controllingFamily)) {
    return { ...empty, targetFamily: tile.controllingFamily, blockedReason: `Alliance active with ${tile.controllingFamily}` };
  }

  // Participants: selected unit + player units on the hex
  const playerUnitsOnHex = (state.deployedUnits || []).filter((u: any) =>
    u.family === state.playerFamily && u.q === targetQ && u.r === targetR && u.s === targetS);
  const selectedUnit = (state.deployedUnits || []).find((u: any) => u.id === selectedUnitId);
  const playerUnits: any[] = [];
  if (selectedUnit && !playerUnitsOnHex.some((u: any) => u.id === selectedUnit.id)) playerUnits.push(selectedUnit);
  playerUnits.push(...playerUnitsOnHex);
  if (playerUnits.length === 0) return { ...empty, targetFamily: tile.controllingFamily, blockedReason: 'No attacking unit' };

  const isScouted = (state.scoutedHexes || []).some((s: any) => s.q === targetQ && s.r === targetR && s.s === targetS);
  const enemyUnits = (state.deployedUnits || []).filter((u: any) =>
    u.family === tile.controllingFamily && u.family !== state.playerFamily &&
    u.q === targetQ && u.r === targetR && u.s === targetS);
  if (_isExecPlan && state.plannedHit?.targetUnitId) {
    const planTarget = (state.deployedUnits || []).find((u: any) =>
      u.id === state.plannedHit.targetUnitId && u.q === targetQ && u.r === targetR && u.s === targetS &&
      u.family !== state.playerFamily);
    if (planTarget && !enemyUnits.includes(planTarget)) enemyUnits.push(planTarget);
  }

  // Blind civilian-casualty branch
  if (!isScouted && enemyUnits.length === 0) {
    return {
      ...empty, ok: true, blindCivilianRisk: true, attackers: playerUnits.length,
      targetFamily: tile.controllingFamily, isScouted: false,
      rawHeat: 100, scaledHeat: 100, chance: 0,
      modifiers: [{ label: 'Unscouted, no defenders — civilian casualty', delta: -100 }],
    };
  }

  const attackers = playerUnits.length;
  const defenders = enemyUnits.length;
  const modifiers: PreviewModifier[] = [];
  let chance = 0.5 + (attackers - defenders) * 0.15;
  modifiers.push({ label: 'Base', delta: 50 });
  if (attackers !== defenders) {
    modifiers.push({ label: `Numbers (${attackers} vs ${defenders})`, delta: (attackers - defenders) * 15 });
  }

  if (!isScouted) {
    chance -= BLIND_HIT_PENALTY;
    modifiers.push({ label: 'Blind hit (unscouted)', delta: -BLIND_HIT_PENALTY * 100 });
  }

  const defenderHexFortified = isHexFortifiedFor(state, targetQ, targetR, targetS, tile.controllingFamily);
  const isExecutingPlanHit = !!(state.plannedHit && (executingPlan ||
    (state.plannedHit.q === targetQ && state.plannedHit.r === targetR && state.plannedHit.s === targetS)));
  if (defenderHexFortified && !isExecutingPlanHit) {
    chance -= FORTIFY_DEFENSE_BONUS / 100;
    modifiers.push({ label: 'Defender fortified', delta: -FORTIFY_DEFENSE_BONUS });
  }
  if ((state.safehouses || []).some((s: any) => s.q === targetQ && s.r === targetR && s.s === targetS)) {
    chance -= SAFEHOUSE_DEFENSE_BONUS / 100;
    modifiers.push({ label: 'Defender safehouse', delta: -SAFEHOUSE_DEFENSE_BONUS });
  }
  const isDefenderBuiltBiz = tile.business && !tile.business.isExtorted && tile.controllingFamily !== state.playerFamily;
  if (isDefenderBuiltBiz) {
    chance -= BUILT_BUSINESS_DEFENSE_BONUS / 100;
    modifiers.push({ label: 'Built business defense', delta: -BUILT_BUSINESS_DEFENSE_BONUS });
  }
  if (tile.district === 'Brooklyn' && hasDistrictBonus(state, tile.controllingFamily, 'combat_defense')) {
    chance -= 0.10;
    modifiers.push({ label: 'Brooklyn district defense', delta: -10 });
  }
  const attackerUnit = playerUnits[0];
  if (attackerUnit && isHexFortifiedFor(state, attackerUnit.q, attackerUnit.r, attackerUnit.s, state.playerFamily)) {
    chance += FORTIFY_DEFENSE_BONUS / 200;
    modifiers.push({ label: 'Attacking from fortification', delta: FORTIFY_DEFENSE_BONUS / 2 });
  }
  if ((state.warSummitState || {}).active) {
    chance += WAR_SUMMIT_COMBAT_BONUS / 100;
    modifiers.push({ label: 'War Summit', delta: WAR_SUMMIT_COMBAT_BONUS });
  }
  const fam = state.familyBonuses || FAMILY_BONUSES[state.playerFamily] || FAMILY_BONUSES.gambino;
  if (fam.combatBonus) {
    chance += fam.combatBonus / 100;
    modifiers.push({ label: 'Family combat bonus', delta: fam.combatBonus });
  }
  if (fam.hitSuccess) {
    chance += fam.hitSuccess / 100;
    modifiers.push({ label: 'Family hit bonus', delta: fam.hitSuccess });
  }
  if (hasDistrictBonus(state, state.playerFamily, 'hit_bonus')) {
    chance += 0.05;
    modifiers.push({ label: 'Queens district control', delta: 5 });
  }
  const isFrontBossHex = (state.frontBossHexes || []).some((h: any) =>
    h.q === targetQ && h.r === targetR && h.s === targetS && h.ownerFamily !== state.playerFamily);
  if (isFrontBossHex) {
    chance -= 0.30;
    modifiers.push({ label: 'Front Boss cover', delta: -30 });
  }

  let scoutFresh = false;
  if (isScouted) {
    const scoutInfo = (state.scoutedHexes || []).find((s: any) => s.q === tile.q && s.r === tile.r && s.s === tile.s);
    if (scoutInfo && state.turn <= scoutInfo.freshUntilTurn) {
      scoutFresh = true;
      chance += SCOUT_INTEL_BONUS / 100;
      modifiers.push({ label: 'Fresh scout intel', delta: SCOUT_INTEL_BONUS });
    } else {
      chance += SCOUT_STALE_BONUS / 100;
      modifiers.push({ label: 'Stale scout intel', delta: SCOUT_STALE_BONUS });
    }
  }

  // Plan-hit bonus resolution
  let planBonus: HitComputation['planBonus'] = null;
  if (state.plannedHit && (executingPlan ||
    (state.plannedHit.q === targetQ && state.plannedHit.r === targetR && state.plannedHit.s === targetS))) {
    const targetOnOriginalHex = (state.deployedUnits || []).some((u: any) =>
      u.id === state.plannedHit.targetUnitId && u.q === state.plannedHit.q && u.r === state.plannedHit.r && u.s === state.plannedHit.s);
    const targetOnCurrentHex = (state.deployedUnits || []).some((u: any) =>
      u.id === state.plannedHit.targetUnitId && u.q === targetQ && u.r === targetR && u.s === targetS);
    if (targetOnOriginalHex) {
      planBonus = 'full';
      chance += PLAN_HIT_BONUS / 100;
      modifiers.push({ label: 'Plan Hit executed', delta: PLAN_HIT_BONUS });
    } else if (targetOnCurrentHex) {
      planBonus = 'relocated';
      chance += PLAN_HIT_RELOCATED_BONUS / 100;
      modifiers.push({ label: 'Plan Hit (target relocated)', delta: PLAN_HIT_RELOCATED_BONUS });
    } else {
      planBonus = 'lost';
    }
  }

  const diffBonus = state.difficultyModifiers?.hitSuccessBonus ?? 0;
  if (diffBonus) {
    chance += diffBonus;
    modifiers.push({ label: 'Difficulty', delta: diffBonus * 100 });
  }
  chance = Math.max(0.05, Math.min(0.99, chance));

  // Heat scales with battle size, modified by hit type
  const totalUnitsInvolved = attackers + defenders;
  let rawHeat = Math.min(25, 8 + totalUnitsInvolved * 2);
  if (isScouted && !isExecutingPlanHit) rawHeat = Math.floor(rawHeat / 2);
  else if (!isScouted) rawHeat = Math.floor(rawHeat * 1.5);

  return {
    ok: true, attackers, defenders, isScouted, scoutFresh,
    executingPlanHit: isExecutingPlanHit, planBonus, blindCivilianRisk: false,
    chance, modifiers, rawHeat, scaledHeat: scalePlayerHeat(state, rawHeat),
    targetFamily: tile.controllingFamily,
  };
};

// ---------------------------------------------------------------------------
// PUSH OUT
// ---------------------------------------------------------------------------

export interface PushOutComputation {
  ok: boolean;
  blockedReason?: string;
  auto: boolean; // undefended auto-success
  attackers: number;
  defenders: number;
  chance: number;
  modifiers: PreviewModifier[];
  rawHeat: number;      // heat on success (2 auto / 4 combat)
  scaledHeat: number;
  rawHeatFail: number;  // heat on failure (2 scouted / 3 blind)
  scaledHeatFail: number;
  tensionGain: number;
  targetFamily: string;
}

export const computePushOutCore = (
  state: any,
  args: { targetQ: number; targetR: number; targetS: number; selectedUnitId?: string }
): PushOutComputation => {
  const { targetQ, targetR, targetS, selectedUnitId } = args;
  const empty: PushOutComputation = {
    ok: false, auto: false, attackers: 0, defenders: 0, chance: 0, modifiers: [],
    rawHeat: 0, scaledHeat: 0, rawHeatFail: 0, scaledHeatFail: 0, tensionGain: 0, targetFamily: 'neutral',
  };
  const tile = findTile(state, targetQ, targetR, targetS);
  if (!tile) return { ...empty, blockedReason: 'No such hex' };
  if (tile.isHeadquarters) return { ...empty, blockedReason: 'Headquarters require an HQ Assault' };
  if (tile.controllingFamily === state.playerFamily || tile.controllingFamily === 'neutral') {
    return { ...empty, blockedReason: 'Push Out only works on rival territory' };
  }
  if (tile.business) return { ...empty, blockedReason: 'Use Hit or Sabotage on business hexes' };
  const targetFamily = tile.controllingFamily as string;
  if ((state.ceasefires || []).some((c: any) => c.active && c.family === targetFamily)) {
    return { ...empty, targetFamily, blockedReason: `Ceasefire active with ${targetFamily}` };
  }
  if ((state.alliances || []).some((a: any) => a.active && a.alliedFamily === targetFamily)) {
    return { ...empty, targetFamily, blockedReason: `Alliance active with ${targetFamily}` };
  }

  const playerUnitsOnHex = (state.deployedUnits || []).filter((u: any) =>
    u.family === state.playerFamily && u.q === targetQ && u.r === targetR && u.s === targetS);
  const selectedUnit = (state.deployedUnits || []).find((u: any) => u.id === selectedUnitId);
  const playerUnits: any[] = [];
  if (selectedUnit && selectedUnit.family === state.playerFamily && !playerUnitsOnHex.some((u: any) => u.id === selectedUnit.id)) {
    playerUnits.push(selectedUnit);
  }
  playerUnits.push(...playerUnitsOnHex);
  if (playerUnits.length === 0) return { ...empty, targetFamily, blockedReason: 'No attacking unit' };

  const enemyUnits = (state.deployedUnits || []).filter((u: any) =>
    u.family === targetFamily && u.q === targetQ && u.r === targetR && u.s === targetS);
  const isScouted = (state.scoutedHexes || []).some((s: any) => s.q === targetQ && s.r === targetR && s.s === targetS);

  if (enemyUnits.length === 0) {
    return {
      ...empty, ok: true, auto: true, attackers: playerUnits.length, chance: 1,
      rawHeat: 2, scaledHeat: scalePlayerHeat(state, 2),
      rawHeatFail: 0, scaledHeatFail: 0,
      tensionGain: TENSION_TERRITORY_HIT, targetFamily,
      modifiers: [{ label: 'Undefended — automatic', delta: 100 }],
    };
  }

  const attackers = playerUnits.length;
  const defenders = enemyUnits.length;
  const modifiers: PreviewModifier[] = [{ label: 'Base', delta: 50 }];
  let chance = 0.5 + (attackers - defenders) * 0.15;
  if (attackers !== defenders) modifiers.push({ label: `Numbers (${attackers} vs ${defenders})`, delta: (attackers - defenders) * 15 });
  chance += 0.05;
  modifiers.push({ label: 'Push Out (soft target)', delta: 5 });
  if (isScouted) {
    const scoutInfo = (state.scoutedHexes || []).find((s: any) => s.q === tile.q && s.r === tile.r && s.s === tile.s);
    if (scoutInfo && state.turn <= scoutInfo.freshUntilTurn) {
      chance += SCOUT_INTEL_BONUS / 100;
      modifiers.push({ label: 'Fresh scout intel', delta: SCOUT_INTEL_BONUS });
    } else {
      chance += SCOUT_STALE_BONUS / 100;
      modifiers.push({ label: 'Stale scout intel', delta: SCOUT_STALE_BONUS });
    }
  }
  if (isHexFortifiedFor(state, targetQ, targetR, targetS, targetFamily)) {
    chance -= FORTIFY_DEFENSE_BONUS / 100;
    modifiers.push({ label: 'Defender fortified', delta: -FORTIFY_DEFENSE_BONUS });
  }
  if ((state.safehouses || []).some((s: any) => s.q === targetQ && s.r === targetR && s.s === targetS)) {
    chance -= SAFEHOUSE_DEFENSE_BONUS / 100;
    modifiers.push({ label: 'Defender safehouse', delta: -SAFEHOUSE_DEFENSE_BONUS });
  }
  const fam = state.familyBonuses || FAMILY_BONUSES[state.playerFamily] || FAMILY_BONUSES.gambino;
  if (fam.combatBonus) {
    chance += fam.combatBonus / 100;
    modifiers.push({ label: 'Family combat bonus', delta: fam.combatBonus });
  }
  const diffBonus = state.difficultyModifiers?.hitSuccessBonus ?? 0;
  if (diffBonus) {
    chance += diffBonus;
    modifiers.push({ label: 'Difficulty', delta: diffBonus * 100 });
  }
  chance = Math.max(0.05, Math.min(0.95, chance));

  return {
    ok: true, auto: false, attackers, defenders, chance, modifiers,
    rawHeat: 4, scaledHeat: scalePlayerHeat(state, 4),
    rawHeatFail: isScouted ? 2 : 3, scaledHeatFail: scalePlayerHeat(state, isScouted ? 2 : 3),
    tensionGain: TENSION_TERRITORY_HIT, targetFamily,
  };
};

// ---------------------------------------------------------------------------
// EXTORT
// ---------------------------------------------------------------------------

export interface ExtortComputation {
  ok: boolean;
  blockedReason?: string;
  isNeutral: boolean;
  isEnemy: boolean;
  chance: number;
  modifiers: PreviewModifier[];
  expectedMoney: number;
  respectGain: number;
  /** RAW heat applied via applyPlayerHeat on success / failure. */
  rawHeatSuccess: number;
  rawHeatFail: number;
  scaledHeatSuccess: number;
  scaledHeatFail: number;
  tensionGain: number;
  targetFamily: string;
}

export const computeExtortCore = (
  state: any,
  args: { targetQ: number; targetR: number; targetS: number }
): ExtortComputation => {
  const { targetQ, targetR, targetS } = args;
  const empty: ExtortComputation = {
    ok: false, isNeutral: false, isEnemy: false, chance: 0, modifiers: [],
    expectedMoney: 0, respectGain: 0, rawHeatSuccess: 0, rawHeatFail: 0,
    scaledHeatSuccess: 0, scaledHeatFail: 0, tensionGain: 0, targetFamily: 'neutral',
  };
  const tile = findTile(state, targetQ, targetR, targetS);
  if (!tile || tile.isHeadquarters) return { ...empty, blockedReason: 'Invalid target' };
  const isNeutral = tile.controllingFamily === 'neutral';
  const isEnemy = tile.controllingFamily !== 'neutral' && tile.controllingFamily !== state.playerFamily;
  if (!isNeutral && !isEnemy) return { ...empty, blockedReason: 'Own territory' };

  // Presence: soldiers on hex, capos on/adjacent
  const playerUnitsOnHex = (state.deployedUnits || []).filter((u: any) =>
    u.family === state.playerFamily && u.q === targetQ && u.r === targetR && u.s === targetS);
  const neighbors = getHexNeighborsPure(targetQ, targetR, targetS);
  const playerCaposAdjacent = (state.deployedUnits || []).filter((u: any) =>
    u.family === state.playerFamily && u.type === 'capo' &&
    neighbors.some(n => n.q === u.q && n.r === u.r && n.s === u.s));
  const soldiersOnHex = playerUnitsOnHex.filter((u: any) => u.type === 'soldier');
  const caposInRange = [...playerUnitsOnHex.filter((u: any) => u.type === 'capo'), ...playerCaposAdjacent];
  const allPlayerUnits = [...soldiersOnHex, ...caposInRange];
  if (allPlayerUnits.length === 0) {
    return { ...empty, isNeutral, isEnemy, targetFamily: tile.controllingFamily, blockedReason: 'Need a soldier on the hex (or capo adjacent)' };
  }

  const modifiers: PreviewModifier[] = [];
  let chance = isNeutral ? 0.9 : 0.5;
  modifiers.push({ label: isNeutral ? 'Base (neutral)' : 'Base (enemy)', delta: chance * 100 });
  const fam = state.familyBonuses || FAMILY_BONUSES[state.playerFamily] || FAMILY_BONUSES.gambino;
  if (fam.extortion) {
    chance += fam.extortion / 100;
    modifiers.push({ label: 'Family extortion bonus', delta: fam.extortion });
  }
  if (hasDistrictBonus(state, state.playerFamily, 'extortion')) {
    chance += 0.15;
    modifiers.push({ label: 'Queens district control', delta: 15 });
  }
  const heatPenalty = (state.policeHeat?.level || 0) / 1000;
  if (heatPenalty > 0) {
    chance -= heatPenalty;
    modifiers.push({ label: 'Police heat', delta: -Math.round(heatPenalty * 100) });
  }
  const influenceBonus = ((state.resources?.influence || 0) / 100) * 0.15;
  if (influenceBonus > 0) {
    chance += influenceBonus;
    modifiers.push({ label: 'Street influence', delta: Math.round(influenceBonus * 100) });
  }
  if (tile.district === 'Manhattan') {
    const before = chance;
    chance *= 0.8;
    modifiers.push({ label: 'Manhattan competition (×0.8)', delta: Math.round((chance - before) * 100) });
  }
  const hasRecruitedUnit = allPlayerUnits.some((u: any) => u.recruited);
  if (hasRecruitedUnit) {
    chance += 0.10;
    modifiers.push({ label: 'Local recruit knows the block', delta: 10 });
  }
  chance = Math.min(0.99, chance);

  const baseMoneyGain = isEnemy ? (tile.business?.income || 2000) : 3000;
  const respectPayoutMultiplier = 0.5 + ((state.reputation?.respect || 0) / 100);
  const expectedMoney = Math.floor(baseMoneyGain * respectPayoutMultiplier);
  const respectGain = isEnemy ? 3 : 5;
  const rawHeatSuccess = isEnemy ? 12 : 8;
  const rawHeatFail = rawHeatSuccess + 5;

  return {
    ok: true, isNeutral, isEnemy, chance, modifiers,
    expectedMoney, respectGain,
    rawHeatSuccess, rawHeatFail,
    scaledHeatSuccess: scalePlayerHeat(state, rawHeatSuccess),
    scaledHeatFail: scalePlayerHeat(state, rawHeatFail),
    tensionGain: isEnemy ? TENSION_EXTORT_RIVAL : 0,
    targetFamily: tile.controllingFamily,
  };
};

// ---------------------------------------------------------------------------
// HQ ASSAULT
// ---------------------------------------------------------------------------

export interface HQAssaultComputation {
  ok: boolean;
  blockedReason?: string;
  chance: number;
  modifiers: PreviewModifier[];
  defensePenalty: number;
  friendlyAdjacent: number;
  flippedCount: number;
  targetFamily: string;
  /** Will elimination be converted to subjugation (Iron Fist survivor floor)? */
  subjugationLikely: boolean;
}

export const computeHQAssaultCore = (
  state: any,
  args: { targetQ: number; targetR: number; targetS: number; selectedUnitId?: string }
): HQAssaultComputation => {
  const { targetQ, targetR, targetS, selectedUnitId } = args;
  const empty: HQAssaultComputation = {
    ok: false, chance: 0, modifiers: [], defensePenalty: 0,
    friendlyAdjacent: 0, flippedCount: 0, targetFamily: 'neutral', subjugationLikely: false,
  };
  const tile = findTile(state, targetQ, targetR, targetS);
  if (!tile || !tile.isHeadquarters) return { ...empty, blockedReason: 'Not a headquarters' };
  const targetFamily = tile.isHeadquarters;
  if (targetFamily === state.playerFamily) return { ...empty, blockedReason: 'Own HQ' };
  if ((state.eliminatedFamilies || []).includes(targetFamily)) return { ...empty, blockedReason: 'Family already eliminated' };

  const attacker = (state.deployedUnits || []).find((u: any) => u.id === selectedUnitId);
  if (attacker) {
    if (attacker.type !== 'soldier' || attacker.family !== state.playerFamily) {
      return { ...empty, targetFamily, blockedReason: 'Attacker must be your soldier' };
    }
    if (hexDistancePure(attacker, { q: targetQ, r: targetR, s: targetS }) !== 1) {
      return { ...empty, targetFamily, blockedReason: 'Soldier must be adjacent to the HQ' };
    }
    const stats = (state.soldierStats || {})[attacker.id];
    if (!stats || stats.toughness < 4 || stats.loyalty < 70) {
      return { ...empty, targetFamily, blockedReason: 'Soldier needs Toughness ≥ 4 and Loyalty ≥ 70' };
    }
  }

  const modifiers: PreviewModifier[] = [{ label: 'Base', delta: HQ_ASSAULT_BASE_CHANCE * 100 }];
  let defensePenalty = HQ_DEFENSE_BONUS;
  const penaltyParts: PreviewModifier[] = [{ label: 'HQ defense', delta: -HQ_DEFENSE_BONUS * 100 }];
  if (isHexFortifiedFor(state, targetQ, targetR, targetS, targetFamily)) {
    defensePenalty += FORTIFY_DEFENSE_BONUS / 100;
    penaltyParts.push({ label: 'HQ fortified', delta: -FORTIFY_DEFENSE_BONUS });
  }
  const targetOpp = (state.aiOpponents || []).find((o: any) => o.family === targetFamily) as any;
  if (targetOpp && targetOpp.mattressesActiveUntil && targetOpp.mattressesActiveUntil >= state.turn) {
    defensePenalty += MATTRESSES_HQ_BONUS / 100;
    penaltyParts.push({ label: 'Enemy at the mattresses', delta: -MATTRESSES_HQ_BONUS });
  }
  defensePenalty = Math.min(0.60, defensePenalty);
  modifiers.push(...penaltyParts);

  let chance = HQ_ASSAULT_BASE_CHANCE - defensePenalty;
  const hqNeighbors = getHexNeighborsPure(targetQ, targetR, targetS);
  const friendlyAdjacent = (state.deployedUnits || []).filter((u: any) =>
    u.family === state.playerFamily && u.id !== selectedUnitId &&
    hqNeighbors.some(n => n.q === u.q && n.r === u.r && n.s === u.s));
  if (friendlyAdjacent.length > 0) {
    chance += friendlyAdjacent.length * 0.05;
    modifiers.push({ label: `Friendly units adjacent (${friendlyAdjacent.length})`, delta: friendlyAdjacent.length * 5 });
  }
  const bonuses = FAMILY_BONUSES[state.playerFamily] || FAMILY_BONUSES.gambino;
  if (bonuses.combatBonus) {
    chance += bonuses.combatBonus / 100 * 0.1;
    modifiers.push({ label: 'Family combat bonus', delta: bonuses.combatBonus * 0.1 });
  }
  const flippedCount = (state.flippedSoldiers || []).filter((f: any) => f.family === targetFamily).length;
  if (flippedCount > 0) {
    chance += flippedCount * 0.10;
    modifiers.push({ label: `Flipped soldiers inside (${flippedCount})`, delta: flippedCount * 10 });
  }
  chance = Math.min(HQ_ASSAULT_MAX_CHANCE, Math.max(0.05, chance));

  // Survivor floor: if too few rivals remain, elimination converts to subjugation
  const surviving = (state.aiOpponents || []).filter((o: any) => !(state.eliminatedFamilies || []).includes(o.family));
  const subjugationLikely = surviving.length <= 2;

  return { ok: true, chance, modifiers, defensePenalty, friendlyAdjacent: friendlyAdjacent.length, flippedCount, targetFamily, subjugationLikely };
};

// ---------------------------------------------------------------------------
// FLIP SOLDIER
// ---------------------------------------------------------------------------

export interface FlipComputation {
  ok: boolean;
  blockedReason?: string;
  cost: number;
  chance: number;          // for the chosen (or first eligible) target
  modifiers: PreviewModifier[];
  eligibleTargets: number;
  targetFamily: string;
}

export const computeFlipCore = (
  state: any,
  args: { targetQ: number; targetR: number; targetS: number; targetUnitId?: string }
): FlipComputation => {
  const { targetQ, targetR, targetS, targetUnitId } = args;
  const empty: FlipComputation = { ok: false, cost: 0, chance: 0, modifiers: [], eligibleTargets: 0, targetFamily: 'neutral' };
  const tile = findTile(state, targetQ, targetR, targetS);
  if (!tile || !tile.isHeadquarters) return { ...empty, blockedReason: 'Not a headquarters' };
  const targetFamily = tile.isHeadquarters;
  if (targetFamily === state.playerFamily) return { ...empty, blockedReason: 'Own HQ' };

  const currentFlippedCount = (state.flippedSoldiers || []).filter((f: any) => f.flippedByFamily === state.playerFamily).length;
  const cost = FLIP_SOLDIER_BASE_COST + currentFlippedCount * FLIP_SOLDIER_COST_ESCALATION;

  const actingCapo = (state.deployedUnits || [])
    .filter((u: any) => u.family === state.playerFamily && u.type === 'capo' &&
      hexDistancePure(u, { q: targetQ, r: targetR, s: targetS }) <= 3)
    .sort((a: any, b: any) => hexDistancePure(a, { q: targetQ, r: targetR, s: targetS }) - hexDistancePure(b, { q: targetQ, r: targetR, s: targetS }))[0];
  if (!actingCapo) return { ...empty, cost, targetFamily, blockedReason: 'Need a Capo within 3 hexes of enemy HQ' };

  const enemySoldiersNearCapo = (state.deployedUnits || []).filter((u: any) =>
    u.family === targetFamily && u.type === 'soldier' &&
    hexDistancePure(u, actingCapo) <= 2 && hexDistancePure(u, actingCapo) > 0);
  const flippable = enemySoldiersNearCapo.filter((u: any) => {
    const uStats = (state.soldierStats || {})[u.id];
    const hasFlipImmunity = (state.bonannoPurgeImmunity || []).some((i: any) => i.unitId === u.id);
    return uStats && uStats.loyalty < 80 && !(state.flippedSoldiers || []).some((f: any) => f.unitId === u.id) && !hasFlipImmunity;
  });
  if (flippable.length === 0) return { ...empty, cost, targetFamily, blockedReason: 'No eligible enemy soldiers within 2 hexes of your Capo' };

  const target = (targetUnitId ? flippable.find((u: any) => u.id === targetUnitId) : null) || flippable[0];
  const targetStats = (state.soldierStats || {})[target.id];

  const modifiers: PreviewModifier[] = [{ label: 'Base', delta: FLIP_SOLDIER_BASE_CHANCE * 100 }];
  let chance = FLIP_SOLDIER_BASE_CHANCE;
  if (targetStats.loyalty < 60) { chance += 0.15; modifiers.push({ label: 'Target loyalty < 60', delta: 15 }); }
  else if (targetStats.loyalty > 70) { chance -= 0.10; modifiers.push({ label: 'Target loyalty > 70', delta: -10 }); }
  const playerInfluence = state.resources?.influence || 0;
  if (playerInfluence > 50) {
    const inf = (playerInfluence - 50) * 0.005;
    chance += inf;
    modifiers.push({ label: 'Influence above 50', delta: Math.round(inf * 100) });
  }
  if (actingCapo.personality === 'schemer') { chance += 0.10; modifiers.push({ label: 'Schemer capo', delta: 10 }); }
  chance = Math.min(0.70, Math.max(0.05, chance));

  return { ok: true, cost, chance, modifiers, eligibleTargets: flippable.length, targetFamily };
};

// ---------------------------------------------------------------------------
// BRIBE (corruption tiers)
// ---------------------------------------------------------------------------

export interface BribeComputation {
  ok: boolean;
  blockedReason?: string;
  tier: BribeTier;
  cost: number;
  duration: number;
  chance: number; // 0-100
  modifiers: PreviewModifier[];
  description: string;
  failureConsequence: string;
}

export const computeBribeCore = (state: any, tier: BribeTier): BribeComputation => {
  const config = BRIBE_TIERS.find(t => t.tier === tier);
  if (!config) {
    return { ok: false, blockedReason: 'Unknown tier', tier, cost: 0, duration: 0, chance: 0, modifiers: [], description: '', failureConsequence: '' };
  }
  const modifiers: PreviewModifier[] = [{ label: 'Base', delta: config.baseSuccess }];
  let successChance = config.baseSuccess;
  const repBonus = Math.floor((state.reputation?.reputation || 0) / 10);
  if (repBonus) { successChance += repBonus; modifiers.push({ label: 'Reputation', delta: repBonus }); }
  const infBonus = Math.floor((state.resources?.influence || 0) / 8);
  if (infBonus) { successChance += infBonus; modifiers.push({ label: 'Influence', delta: infBonus }); }
  const heatPenalty = Math.floor((state.policeHeat?.level || 0) / 5);
  if (heatPenalty) { successChance -= heatPenalty; modifiers.push({ label: 'Police heat', delta: -heatPenalty }); }
  successChance = Math.max(5, Math.min(95, successChance));

  const phase = state.gamePhase || 1;
  let blockedReason: string | undefined;
  if (tier === 'patrol_officer' && phase < 2) blockedReason = 'Unlocks in Phase 2';
  if (tier !== 'patrol_officer' && phase < 3) blockedReason = 'Unlocks in Phase 3';
  if ((state.activeBribes || []).some((b: any) => b.tier === tier && b.active)) blockedReason = 'Already active';
  if ((state.resources?.money || 0) < config.cost) blockedReason = `Need $${config.cost.toLocaleString()}`;

  return {
    ok: !blockedReason, blockedReason, tier,
    cost: config.cost, duration: config.duration, chance: successChance, modifiers,
    description: config.description,
    failureConsequence: `Full $${config.cost.toLocaleString()} lost, no contract`,
  };
};

// ---------------------------------------------------------------------------
// COMMISSION VOTE (projection)
// ---------------------------------------------------------------------------

export interface CommissionVoteProjection {
  ok: boolean;
  blockedReason?: string;
  cost: number;
  needed: number;
  yesVotes: number;
  wouldWin: boolean;
  qualifierBuffUsed: number;
  votes: Array<{ family: string; vote: boolean; reason: string }>;
}

/**
 * Projects the Commission vote exactly as processCommissionVote tallies it.
 * The executor delegates its tally to this function to guarantee parity.
 */
export const computeCommissionVoteProjection = (state: any): CommissionVoteProjection => {
  const empty: CommissionVoteProjection = {
    ok: false, cost: COMMISSION_VOTE_COST, needed: 0, yesVotes: 0, wouldWin: false, qualifierBuffUsed: 0, votes: [],
  };
  const survivingRivals = (state.aiOpponents || []).filter((o: any) => !(state.eliminatedFamilies || []).includes(o.family));

  let blockedReason: string | undefined;
  if ((state.gamePhase || 1) < 4) blockedReason = 'Requires Phase 4: Boss of All Bosses';
  else if ((state.resources?.money || 0) < COMMISSION_VOTE_COST) blockedReason = `Costs $${COMMISSION_VOTE_COST.toLocaleString()}`;
  else if ((state.commissionVoteCooldownUntil || 0) > state.turn) blockedReason = `On cooldown for ${(state.commissionVoteCooldownUntil || 0) - state.turn} turns`;
  else if (survivingRivals.length < COMMISSION_MIN_SURVIVORS) blockedReason = `Need at least ${COMMISSION_MIN_SURVIVORS} surviving rivals`;

  const needed = Math.max(survivingRivals.length - 1, survivingRivals.length === 2 ? 2 : survivingRivals.length - 1);
  const hasTreachery = !!(state.treacheryDebuff && state.treacheryDebuff.turnsRemaining > 0);
  const subjMap = state.subjugatedFamilies || {};

  let yesVotes = 0;
  const votes: Array<{ family: string; vote: boolean; reason: string }> = [];
  for (const rival of survivingRivals) {
    if (subjMap[rival.family] === state.playerFamily) {
      yesVotes++;
      votes.push({ family: rival.family, vote: true, reason: 'Subjugated vassal — automatic YES' });
      continue;
    }
    if (hasTreachery) {
      votes.push({ family: rival.family, vote: false, reason: 'Treachery debuff — automatic NO' });
      continue;
    }
    const relationship = state.reputation?.familyRelationships?.[rival.family] || 0;
    const hasAlliance = (state.alliances || []).some((a: any) => a.active && a.alliedFamily === rival.family);
    const hasCeasefire = (state.ceasefires || []).some((c: any) => c.active && c.family === rival.family);
    const hasPact = hasAlliance || hasCeasefire;
    if (relationship >= COMMISSION_VOTE_RELATIONSHIP_THRESHOLD && hasPact) {
      yesVotes++;
      votes.push({ family: rival.family, vote: true, reason: `Relationship ${relationship} + active pact` });
    } else {
      const reason = relationship < COMMISSION_VOTE_RELATIONSHIP_THRESHOLD
        ? `Relationship too low (${relationship}/${COMMISSION_VOTE_RELATIONSHIP_THRESHOLD})`
        : 'No active alliance or ceasefire';
      votes.push({ family: rival.family, vote: false, reason });
    }
  }

  // Coronation qualifier buff — flip neutral NOs (rel 30-59, no pact, no treachery)
  let qualifierBuff = Math.min((state.qualifyingConditions || []).length, CORONATION_QUALIFIER_BUFF_CAP);
  let qualifierBuffUsed = 0;
  if (qualifierBuff > 0 && !hasTreachery) {
    const flippable = votes
      .map((vr, idx) => ({ vr, idx }))
      .filter(({ vr }) => {
        if (vr.vote) return false;
        if (vr.reason.startsWith('Subjugated')) return false;
        const rel = state.reputation?.familyRelationships?.[vr.family] || 0;
        return rel >= 30 && rel < COMMISSION_VOTE_RELATIONSHIP_THRESHOLD;
      });
    for (const { idx } of flippable) {
      if (qualifierBuff <= 0) break;
      votes[idx] = { ...votes[idx], vote: true, reason: 'Coronation buff — overwhelming power conceded' };
      yesVotes++;
      qualifierBuff--;
      qualifierBuffUsed++;
    }
  }

  return {
    ok: !blockedReason, blockedReason,
    cost: COMMISSION_VOTE_COST, needed, yesVotes, wouldWin: yesVotes >= needed,
    qualifierBuffUsed, votes,
  };
};

// ---------------------------------------------------------------------------
// CLAIM TERRITORY (pending claim)
// ---------------------------------------------------------------------------

export interface ClaimComputation {
  ok: boolean;
  blockedReason?: string;
  rawHeat: number;
  scaledHeat: number;
  /** Respect/influence rewards on finalization (diminishing). */
  rewards: { respect: number; influence: number };
  /** Whether a friendly unit is on/adjacent — unsupported claims collapse at finalization. */
  supported: boolean;
  /** Rival families with 3+ adjacent hexes — claiming raises tension with them. */
  encroachedFamilies: string[];
  tensionPerEncroachment: number;
}

export const computeClaimCore = (
  state: any,
  args: { targetQ: number; targetR: number; targetS: number }
): ClaimComputation => {
  const { targetQ, targetR, targetS } = args;
  const empty: ClaimComputation = {
    ok: false, rawHeat: 0, scaledHeat: 0, rewards: { respect: 0, influence: 0 },
    supported: false, encroachedFamilies: [], tensionPerEncroachment: TENSION_ENCROACHMENT,
  };
  const tile = findTile(state, targetQ, targetR, targetS);
  if (!tile || tile.controllingFamily !== 'neutral' || tile.isHeadquarters) return { ...empty, blockedReason: 'Only neutral hexes can be claimed' };
  if ((state.gamePhase || 1) >= 3) return { ...empty, blockedReason: 'Phase 3+ — territory shifts through influence' };
  if (tile.pendingClaim && tile.pendingClaim.family !== state.playerFamily) {
    return { ...empty, blockedReason: `Contested by ${tile.pendingClaim.family}` };
  }

  const rawHeat = tile.business ? CLAIM_HEAT_BUSINESS : CLAIM_HEAT_PLAIN;
  const familyHexCount = (state.hexMap || []).filter((t: any) => t.controllingFamily === state.playerFamily).length;
  const rewards = familyHexCount <= 10
    ? { respect: 1, influence: 1 }
    : familyHexCount <= 20 ? { respect: 0.5, influence: 0.5 } : { respect: 0, influence: 0 };

  const neighbors = getHexNeighborsPure(targetQ, targetR, targetS);
  const supported = (state.deployedUnits || []).some((u: any) =>
    u.family === state.playerFamily &&
    ((u.q === targetQ && u.r === targetR && u.s === targetS) ||
      neighbors.some(n => n.q === u.q && n.r === u.r && n.s === u.s)));

  const familyCounts: Record<string, number> = {};
  neighbors.forEach(n => {
    const t = findTile(state, n.q, n.r, n.s);
    if (t && t.controllingFamily !== 'neutral' && t.controllingFamily !== state.playerFamily) {
      familyCounts[t.controllingFamily] = (familyCounts[t.controllingFamily] || 0) + 1;
    }
  });
  const encroachedFamilies = Object.entries(familyCounts)
    .filter(([, count]) => count >= ENCROACHMENT_NEIGHBOR_THRESHOLD)
    .map(([f]) => f);

  return {
    ok: true, rawHeat, scaledHeat: scalePlayerHeat(state, rawHeat),
    rewards, supported, encroachedFamilies, tensionPerEncroachment: TENSION_ENCROACHMENT,
  };
};
