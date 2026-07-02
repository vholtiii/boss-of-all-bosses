// ============================================================================
// ACTION PREVIEWS — consequence forecasts for every player decision.
//
// Wraps the shared formula cores (action-formulas.ts) into uniform
// ActionPreview objects the UI can render before the player commits.
// Because previews and executors share the same math, what you see is
// exactly what rolls.
// ============================================================================

import {
  computeHitCore, computePushOutCore, computeExtortCore,
  computeHQAssaultCore, computeFlipCore, computeBribeCore,
  computeCommissionVoteProjection, computeClaimCore,
  scalePlayerHeat,
  type PreviewModifier,
} from '@/lib/action-formulas';
import {
  SABOTAGE_COST, SABOTAGE_HEAT, SABOTAGE_RELATIONSHIP_PENALTY,
  SOLDIER_COST, LOCAL_SOLDIER_COST, SOLDIER_MAINTENANCE, RECRUIT_TERRITORY_REQUIREMENT,
  LOYALTY_MERC_START, LOYALTY_MERC_CAP, LOYALTY_RECRUIT_START,
  BUILDABLE_BUSINESS_DEFS,
  HITMAN_CONTRACT_COST, HITMAN_BASE_SUCCESS, HITMAN_FORTIFIED_SUCCESS, HITMAN_SAFEHOUSE_SUCCESS, HITMAN_HQ_SUCCESS,
  HITMAN_OPEN_TURNS, HITMAN_FORTIFIED_TURNS, HITMAN_SAFEHOUSE_TURNS, HITMAN_HQ_TURNS,
  BribeTier,
  TENSION_TERRITORY_HIT, TENSION_SUPPLY_SABOTAGE,
  WAR_TENSION_THRESHOLD,
  getTensionPairKey,
  PROSECUTION_ARREST_THRESHOLD, GRAND_JURY_THRESHOLD, FEDERAL_INDICTMENT_THRESHOLD,
  RICO_HEAT_THRESHOLD,
} from '@/types/game-mechanics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PreviewDelta {
  /** e.g. "Money", "Heat", "Respect", "Tension (Gambino)" */
  label: string;
  /** Human-readable value, e.g. "+$4,200", "+12", "−15%" */
  value: string;
  /** For color-coding: is this delta good or bad for the player? */
  tone: 'good' | 'bad' | 'neutral';
}

export interface ActionPreview {
  /** Action name shown as the card title. */
  title: string;
  valid: boolean;
  blockedReason?: string;
  /** 0-1. Undefined for deterministic actions. */
  successChance?: number;
  /** Itemized chance contributions (percentage points). */
  modifiers: PreviewModifier[];
  /** Upfront costs (charged regardless of outcome unless noted). */
  costs: PreviewDelta[];
  onSuccess: PreviewDelta[];
  onFailure: PreviewDelta[];
  /** Threshold / strategic warnings, e.g. "Heat will cross 90 — RICO clock starts". */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const money = (n: number): string => `$${Math.abs(Math.round(n)).toLocaleString()}`;

/** Heat threshold warnings when heat rises from `current` by `gain`. */
const heatWarnings = (state: any, gain: number): string[] => {
  const current = state.policeHeat?.level || 0;
  const after = Math.min(100, current + gain);
  const warnings: string[] = [];
  if (current < 50 && after >= 50) warnings.push('Heat will cross 50 — soldier arrests become possible each turn.');
  if (current < 70 && after >= 70) warnings.push('Heat will cross 70 — capo arrests and business raids become possible.');
  if (current < RICO_HEAT_THRESHOLD && after >= RICO_HEAT_THRESHOLD) warnings.push('Heat will cross 90 — the RICO indictment clock starts (game over at 3 turns).');
  if (after >= 100) warnings.push('Heat will hit 100 — maximum law-enforcement pressure.');
  return warnings;
};

/** Tension threshold warning for a pair gain. */
const tensionWarning = (state: any, otherFamily: string, gain: number): string | null => {
  if (!otherFamily || otherFamily === 'neutral' || gain <= 0) return null;
  const key = getTensionPairKey(state.playerFamily, otherFamily);
  const current = (state.familyTensions || {})[key] || 0;
  const mult = state.difficultyModifiers?.diplomacyTensionMult ?? 1;
  const after = Math.min(100, current + gain * mult);
  if (current < WAR_TENSION_THRESHOLD && after >= WAR_TENSION_THRESHOLD) {
    return `Tension with ${otherFamily} will cross ${WAR_TENSION_THRESHOLD} — this can trigger WAR.`;
  }
  if (after >= WAR_TENSION_THRESHOLD - 10 && current < after) {
    return `Tension with ${otherFamily} approaching war threshold (${Math.round(after)}/${WAR_TENSION_THRESHOLD}).`;
  }
  return null;
};

const blocked = (title: string, reason: string): ActionPreview => ({
  title, valid: false, blockedReason: reason, modifiers: [], costs: [], onSuccess: [], onFailure: [], warnings: [],
});

// ---------------------------------------------------------------------------
// Map-action previews
// ---------------------------------------------------------------------------

export const previewHit = (
  state: any,
  args: { targetQ: number; targetR: number; targetS: number; selectedUnitId?: string; executingPlan?: boolean }
): ActionPreview => {
  const calc = computeHitCore(state, args);
  if (!calc.ok && calc.blockedReason) return blocked('Hit Territory', calc.blockedReason);

  if (calc.blindCivilianRisk) {
    return {
      title: 'Hit Territory (BLIND)',
      valid: true,
      successChance: 0,
      modifiers: calc.modifiers,
      costs: [],
      onSuccess: [],
      onFailure: [
        { label: 'Heat', value: '→ 100 (maxed)', tone: 'bad' },
        { label: 'Soldier', value: 'In hiding 3 turns', tone: 'bad' },
      ],
      warnings: ['UNSCOUTED and no defenders visible — your soldier will hit a CIVILIAN. Heat maxes out. Scout first.'],
    };
  }

  const warnings = heatWarnings(state, calc.scaledHeat);
  const tw = tensionWarning(state, calc.targetFamily, TENSION_TERRITORY_HIT);
  if (tw) warnings.push(tw);
  if (!calc.isScouted) warnings.push('Blind hit: −20% success and +50% heat. Scout first for +15% and half heat.');
  if (calc.planBonus === 'relocated') warnings.push('Target relocated — reduced bonus, +5 heat, and Plan Hit goes on cooldown.');

  return {
    title: calc.executingPlanHit ? 'Execute Plan Hit' : 'Hit Territory',
    valid: true,
    successChance: calc.chance,
    modifiers: calc.modifiers,
    costs: [{ label: 'Heat', value: `+${calc.scaledHeat}`, tone: 'bad' }],
    onSuccess: [
      { label: 'Territory', value: 'Enemy control cleared → neutral (claim next turn)', tone: 'good' },
      { label: 'Respect / Fear', value: '+5 / +5', tone: 'good' },
      { label: `Tension (${calc.targetFamily})`, value: `+${TENSION_TERRITORY_HIT}`, tone: 'bad' },
      ...(calc.executingPlanHit ? [
        { label: 'Plan Hit rewards', value: '+10 respect, +10 fear, +$5,000 loot', tone: 'good' as const },
        { label: 'Casualties', value: 'None on success', tone: 'good' as const },
      ] : [
        { label: 'Casualties', value: '~20% of attackers', tone: 'bad' as const },
        { label: 'Enemy capos', value: 'Wounded, not killed (Plan Hit/Hitman kill capos)', tone: 'neutral' as const },
      ]),
    ],
    onFailure: [
      { label: 'Casualties', value: '~40% of attackers (min 1)', tone: 'bad' },
      { label: 'Heat', value: `+${calc.scaledHeat} (still applies)`, tone: 'bad' },
    ],
    warnings,
  };
};

export const previewPushOut = (
  state: any,
  args: { targetQ: number; targetR: number; targetS: number; selectedUnitId?: string }
): ActionPreview => {
  const calc = computePushOutCore(state, args);
  if (!calc.ok && calc.blockedReason) return blocked('Push Out', calc.blockedReason);

  const warnings = heatWarnings(state, calc.auto ? calc.scaledHeat : Math.max(calc.scaledHeat, calc.scaledHeatFail));
  const tw = tensionWarning(state, calc.targetFamily, calc.tensionGain);
  if (tw) warnings.push(tw);

  return {
    title: calc.auto ? 'Push Out (undefended)' : 'Push Out',
    valid: true,
    successChance: calc.auto ? 1 : calc.chance,
    modifiers: calc.modifiers,
    costs: [],
    onSuccess: [
      { label: 'Territory', value: 'Rival evicted → neutral (claim next turn)', tone: 'good' },
      { label: 'Respect / Fear', value: '+2 / +2', tone: 'good' },
      { label: 'Heat', value: `+${calc.scaledHeat}`, tone: 'bad' },
      { label: `Relationship (${calc.targetFamily})`, value: '−8', tone: 'bad' },
      { label: `Tension (${calc.targetFamily})`, value: `+${calc.tensionGain}`, tone: 'bad' },
    ],
    onFailure: calc.auto ? [] : [
      { label: 'Casualties', value: 'None — unit shaken, −5 loyalty', tone: 'neutral' },
      { label: 'Heat', value: `+${calc.scaledHeatFail}`, tone: 'bad' },
    ],
    warnings,
  };
};

export const previewExtort = (
  state: any,
  args: { targetQ: number; targetR: number; targetS: number }
): ActionPreview => {
  const calc = computeExtortCore(state, args);
  if (!calc.ok && calc.blockedReason) return blocked('Extort', calc.blockedReason);

  const warnings = heatWarnings(state, calc.scaledHeatFail);
  const tw = tensionWarning(state, calc.targetFamily, calc.tensionGain);
  if (tw) warnings.push(tw);

  return {
    title: calc.isEnemy ? 'Extort Enemy Business' : 'Extort (Neutral)',
    valid: true,
    successChance: calc.chance,
    modifiers: calc.modifiers,
    costs: [],
    onSuccess: [
      { label: 'Money', value: `+${money(calc.expectedMoney)}`, tone: 'good' },
      { label: 'Respect', value: `+${calc.respectGain}`, tone: 'good' },
      ...(calc.isNeutral ? [{ label: 'Territory', value: 'Claimed for your family', tone: 'good' as const }] : []),
      { label: 'Heat', value: `+${calc.scaledHeatSuccess}`, tone: 'bad' },
      ...(calc.isEnemy ? [{ label: `Tension (${calc.targetFamily})`, value: `+${calc.tensionGain}`, tone: 'bad' as const }] : []),
    ],
    onFailure: [
      { label: 'Respect / Fear', value: '−3 / −2', tone: 'bad' },
      { label: 'Heat', value: `+${calc.scaledHeatFail}`, tone: 'bad' },
      { label: 'Acting soldier', value: '−5 loyalty', tone: 'bad' },
    ],
    warnings,
  };
};

export const previewSabotage = (
  state: any,
  args: { targetQ: number; targetR: number; targetS: number }
): ActionPreview => {
  const tile = (state.hexMap || []).find((t: any) => t.q === args.targetQ && t.r === args.targetR && t.s === args.targetS);
  if (!tile || !tile.business || tile.controllingFamily === state.playerFamily || tile.isHeadquarters) {
    return blocked('Sabotage Business', 'No rival business here');
  }
  if ((state.resources?.money || 0) < SABOTAGE_COST) {
    return blocked('Sabotage Business', `Need ${money(SABOTAGE_COST)}`);
  }
  const scaledHeat = scalePlayerHeat(state, SABOTAGE_HEAT);
  const warnings = heatWarnings(state, scaledHeat);
  const tw = tensionWarning(state, tile.controllingFamily, TENSION_SUPPLY_SABOTAGE);
  if (tw) warnings.push(tw);
  const isFrontRisk = (state.frontBossHexes || []).some((h: any) =>
    h.q === args.targetQ && h.r === args.targetR && h.s === args.targetS && h.ownerFamily !== state.playerFamily);

  return {
    title: 'Sabotage Business',
    valid: true,
    successChance: isFrontRisk ? 0.70 : 1,
    modifiers: isFrontRisk ? [{ label: 'Possible Genovese front (30% foil risk)', delta: -30 }] : [],
    costs: [{ label: 'Money', value: `−${money(SABOTAGE_COST)}`, tone: 'bad' }],
    onSuccess: [
      { label: 'Rival business', value: `${tile.business.type} (${money(tile.business.income)}/turn) destroyed permanently`, tone: 'good' },
      { label: 'Heat', value: `+${scaledHeat}`, tone: 'bad' },
      { label: `Relationship (${tile.controllingFamily})`, value: `−${SABOTAGE_RELATIONSHIP_PENALTY}`, tone: 'bad' },
    ],
    onFailure: isFrontRisk ? [{ label: 'Money', value: `−${money(SABOTAGE_COST)} wasted (front)`, tone: 'bad' }] : [],
    warnings,
  };
};

export const previewClaim = (
  state: any,
  args: { targetQ: number; targetR: number; targetS: number }
): ActionPreview => {
  const calc = computeClaimCore(state, args);
  if (!calc.ok) return blocked('Claim Territory', calc.blockedReason || 'Cannot claim');

  const warnings = heatWarnings(state, calc.scaledHeat);
  if (!calc.supported) warnings.push('No friendly unit on or adjacent — the claim will COLLAPSE at finalization. Keep a unit nearby.');
  calc.encroachedFamilies.forEach(f => {
    warnings.push(`Encroaching on ${f} turf (3+ adjacent hexes) — +${calc.tensionPerEncroachment} tension.`);
    const tw = tensionWarning(state, f, calc.tensionPerEncroachment);
    if (tw) warnings.push(tw);
  });
  if (calc.rewards.respect === 0) warnings.push('21+ hexes — diminishing returns: no respect/influence from this claim.');

  return {
    title: 'Claim Territory (pending)',
    valid: true,
    modifiers: [],
    costs: [{ label: 'Heat', value: `+${calc.scaledHeat} now`, tone: 'bad' }],
    onSuccess: [
      { label: 'Finalizes', value: 'End of NEXT turn if a friendly unit holds/borders the hex', tone: 'neutral' },
      ...(calc.rewards.respect > 0
        ? [{ label: 'Respect / Influence', value: `+${calc.rewards.respect} / +${calc.rewards.influence} on finalization`, tone: 'good' as const }]
        : []),
    ],
    onFailure: [
      { label: 'Claim breaks', value: 'If a rival unit enters the hex first', tone: 'bad' },
    ],
    warnings,
  };
};

export const previewHQAssault = (
  state: any,
  args: { targetQ: number; targetR: number; targetS: number; selectedUnitId?: string }
): ActionPreview => {
  const calc = computeHQAssaultCore(state, args);
  if (!calc.ok && calc.blockedReason) return blocked('Assault HQ', calc.blockedReason);

  return {
    title: `Assault ${calc.targetFamily} HQ`,
    valid: true,
    successChance: calc.chance,
    modifiers: calc.modifiers,
    costs: [],
    onSuccess: calc.subjugationLikely
      ? [
        { label: 'Family SUBJUGATED', value: 'They bend the knee (survivor floor)', tone: 'good' },
        { label: 'Money', value: '+$15,000', tone: 'good' },
        { label: 'Respect / Fear', value: '+20 / +30', tone: 'good' },
      ]
      : [
        { label: 'Family ELIMINATED', value: 'Their territory collapses', tone: 'good' },
        { label: 'Money', value: '+$25,000', tone: 'good' },
        { label: 'Respect / Fear', value: '+30 / +40', tone: 'good' },
      ],
    onFailure: [
      { label: 'Attacking soldier', value: 'KILLED', tone: 'bad' },
      { label: 'Adjacent units', value: '−30 loyalty each', tone: 'bad' },
    ],
    warnings: calc.subjugationLikely
      ? ['Survivor floor active — success subjugates rather than eliminates (a Boss needs subjects).']
      : [],
  };
};

export const previewFlipSoldier = (
  state: any,
  args: { targetQ: number; targetR: number; targetS: number; targetUnitId?: string }
): ActionPreview => {
  const calc = computeFlipCore(state, args);
  if (!calc.ok && calc.blockedReason) return blocked('Flip Soldier', calc.blockedReason);

  return {
    title: `Flip ${calc.targetFamily} Soldier`,
    valid: true,
    successChance: calc.chance,
    modifiers: calc.modifiers,
    costs: [{ label: 'Money', value: `−${money(calc.cost)}`, tone: 'bad' }],
    onSuccess: [
      { label: 'Informant', value: 'Feeds intel from their position; −10% enemy HQ defense', tone: 'good' },
    ],
    onFailure: [
      { label: 'Influence', value: '−15', tone: 'bad' },
      { label: 'Target', value: '+10 loyalty, enemy notified', tone: 'bad' },
    ],
    warnings: calc.eligibleTargets > 1 ? [`${calc.eligibleTargets} eligible targets in range.`] : [],
  };
};

// ---------------------------------------------------------------------------
// Panel-action previews
// ---------------------------------------------------------------------------

export const previewBribe = (state: any, tier: BribeTier): ActionPreview => {
  const calc = computeBribeCore(state, tier);
  if (!calc.ok && calc.blockedReason) return blocked(`Bribe: ${tier}`, calc.blockedReason);
  return {
    title: `Bribe ${tier.replace(/_/g, ' ')}`,
    valid: true,
    successChance: calc.chance / 100,
    modifiers: calc.modifiers,
    costs: [
      { label: 'Money', value: `−${money(calc.cost)} (kept even on failure)`, tone: 'bad' },
      { label: 'Tactical action', value: '−1', tone: 'neutral' },
    ],
    onSuccess: [{ label: 'Contract', value: `${calc.description} · ${calc.duration} turns`, tone: 'good' }],
    onFailure: [{ label: 'Money', value: calc.failureConsequence, tone: 'bad' }],
    warnings: [],
  };
};

export const previewCommissionVote = (state: any): ActionPreview => {
  const proj = computeCommissionVoteProjection(state);
  const preview: ActionPreview = {
    title: 'Commission Vote (Coronation)',
    valid: proj.ok,
    blockedReason: proj.blockedReason,
    successChance: undefined,
    modifiers: [],
    costs: [
      { label: 'Money', value: `−${money(proj.cost)}`, tone: 'bad' },
      { label: 'Action', value: '−1', tone: 'neutral' },
    ],
    onSuccess: [{ label: 'VICTORY', value: 'Crowned Boss of All Bosses', tone: 'good' }],
    onFailure: [
      { label: 'NO voters', value: '−10 relationship each', tone: 'bad' },
      { label: 'Cooldown', value: '10 turns', tone: 'bad' },
    ],
    warnings: [],
  };
  preview.warnings.push(
    proj.wouldWin
      ? `Projection: PASSES ${proj.yesVotes}/${proj.needed}.`
      : `Projection: FAILS ${proj.yesVotes}/${proj.needed}. Build relationships (≥60) + pacts before calling the vote.`
  );
  return preview;
};

export const previewRecruitMercenary = (state: any): ActionPreview => {
  const respectDiscount = ((state.reputation?.respect || 0) / 100) * 0.3;
  const familyDiscount = state.familyBonuses?.recruitmentDiscount ? state.familyBonuses.recruitmentDiscount / 100 : 0;
  const discount = Math.min(0.5, respectDiscount + familyDiscount);
  const cost = Math.floor(SOLDIER_COST * (1 - discount));
  const bronx = (state.activeDistrictBonuses || []).some((b: any) => b.family === state.playerFamily && b.bonusType === 'recruit_discount') ? 750 : 0;
  const finalCost = Math.max(100, cost - bronx);
  return {
    title: 'Buy Mercenary',
    valid: (state.resources?.money || 0) >= finalCost && (state.actionsRemaining || 0) > 0,
    blockedReason: (state.resources?.money || 0) < finalCost ? `Need ${money(finalCost)}` : (state.actionsRemaining || 0) <= 0 ? 'No actions left' : undefined,
    modifiers: [],
    costs: [
      { label: 'Money', value: `−${money(finalCost)}`, tone: 'bad' },
      { label: 'Action', value: '−1', tone: 'neutral' },
      { label: 'Family loyalty', value: '−10 (outsider)', tone: 'bad' },
    ],
    onSuccess: [
      { label: 'Soldier', value: `Deployed at HQ · loyalty ${LOYALTY_MERC_START} (cap ${LOYALTY_MERC_CAP})`, tone: 'good' },
      { label: 'Upkeep', value: `−${money(SOLDIER_MAINTENANCE)}/turn`, tone: 'bad' },
    ],
    onFailure: [],
    warnings: ['Mercenaries cap at 70 loyalty and start disloyal — flip risk if left unhappy.'],
  };
};

export const previewRecruitLocal = (state: any): ActionPreview => {
  const territoryCount = (state.hexMap || []).filter((t: any) => t.controllingFamily === state.playerFamily).length;
  const respectDiscount = ((state.reputation?.respect || 0) / 100) * 0.3;
  const familyDiscount = state.familyBonuses?.recruitmentDiscount ? state.familyBonuses.recruitmentDiscount / 100 : 0;
  const discount = Math.min(0.5, respectDiscount + familyDiscount);
  const cost = Math.floor(LOCAL_SOLDIER_COST * (1 - discount));
  return {
    title: 'Recruit Local',
    valid: territoryCount >= RECRUIT_TERRITORY_REQUIREMENT && (state.resources?.money || 0) >= cost && (state.actionsRemaining || 0) > 0,
    blockedReason: territoryCount < RECRUIT_TERRITORY_REQUIREMENT
      ? `Need ${RECRUIT_TERRITORY_REQUIREMENT} hexes (have ${territoryCount})`
      : (state.resources?.money || 0) < cost ? `Need ${money(cost)}` : (state.actionsRemaining || 0) <= 0 ? 'No actions left' : undefined,
    modifiers: [],
    costs: [
      { label: 'Money', value: `−${money(cost)}`, tone: 'bad' },
      { label: 'Action', value: '−1', tone: 'neutral' },
    ],
    onSuccess: [
      { label: 'Soldier', value: `Loyal local · starts at ${LOYALTY_RECRUIT_START} loyalty, +1/turn early`, tone: 'good' },
      { label: 'Upkeep', value: `−${money(SOLDIER_MAINTENANCE)}/turn`, tone: 'bad' },
      { label: 'Extortion', value: '+10% success (knows the block)', tone: 'good' },
    ],
    onFailure: [],
    warnings: [],
  };
};

export const previewBuildBusiness = (state: any, businessType: string): ActionPreview => {
  const def = BUILDABLE_BUSINESS_DEFS[businessType];
  if (!def) return blocked('Build Business', 'Unknown business type');
  return {
    title: `Build ${def.label}`,
    valid: (state.resources?.money || 0) >= def.cost && (state.actionsRemaining || 0) > 0,
    blockedReason: (state.resources?.money || 0) < def.cost ? `Need ${money(def.cost)}` : (state.actionsRemaining || 0) <= 0 ? 'No actions left' : undefined,
    modifiers: [],
    costs: [
      { label: 'Money', value: `−${money(def.cost)}`, tone: 'bad' },
      { label: 'Action', value: '−1', tone: 'neutral' },
      { label: 'Requires', value: 'Capo on an empty owned hex', tone: 'neutral' },
    ],
    onSuccess: [
      { label: 'Income', value: `+${money(def.income)}/turn once built (~3 turns with capo)`, tone: 'good' },
      { label: 'Laundering', value: `+${money(def.launderingCapacity)}/turn capacity`, tone: 'good' },
      { label: 'Defense', value: '+20% on this hex · builds respect & loyalty per 3 built', tone: 'good' },
    ],
    onFailure: [],
    warnings: ['Built businesses draw rival seizure attempts — defend the hex.'],
  };
};

export const previewHireHitman = (state: any, targetUnitId?: string): ActionPreview => {
  const contracts = (state.hitmanContracts || []).length;
  const target = targetUnitId ? (state.deployedUnits || []).find((u: any) => u.id === targetUnitId) : null;
  let successPct = HITMAN_BASE_SUCCESS;
  let duration = HITMAN_OPEN_TURNS;
  let situation = 'open field';
  if (target) {
    const tile = (state.hexMap || []).find((t: any) => t.q === target.q && t.r === target.r && t.s === target.s);
    const isAtHQ = tile?.isHeadquarters === target.family;
    const isAtSafehouse = (state.safehouses || []).some((s: any) => target.q === s.q && target.r === s.r && target.s === s.s);
    const isFortified = (state.fortifiedHexes || []).some((f: any) => f.q === target.q && f.r === target.r && f.s === target.s && f.family === target.family);
    if (isAtHQ) { successPct = HITMAN_HQ_SUCCESS; duration = HITMAN_HQ_TURNS; situation = 'at HQ'; }
    else if (isAtSafehouse) { successPct = HITMAN_SAFEHOUSE_SUCCESS; duration = HITMAN_SAFEHOUSE_TURNS; situation = 'in safehouse'; }
    else if (isFortified) { successPct = HITMAN_FORTIFIED_SUCCESS; duration = HITMAN_FORTIFIED_TURNS; situation = 'fortified'; }
  }
  return {
    title: 'Hire Hitman',
    valid: contracts < 3 && (state.resources?.money || 0) >= HITMAN_CONTRACT_COST && (state.gamePhase || 1) >= 3,
    blockedReason: (state.gamePhase || 1) < 3 ? 'Unlocks in Phase 3'
      : contracts >= 3 ? 'Max 3 active contracts'
        : (state.resources?.money || 0) < HITMAN_CONTRACT_COST ? `Need ${money(HITMAN_CONTRACT_COST)}` : undefined,
    successChance: successPct / 100,
    modifiers: [{ label: `Target ${situation}`, delta: successPct - HITMAN_BASE_SUCCESS }],
    costs: [
      { label: 'Money', value: `−${money(HITMAN_CONTRACT_COST)}`, tone: 'bad' },
      { label: 'Action', value: '−1', tone: 'neutral' },
    ],
    onSuccess: [
      { label: 'Target', value: `Killed in ~${duration} turns (kills capos too)`, tone: 'good' },
      { label: 'Anonymity', value: 'No pair tension, but +5/+15 GLOBAL tension (soldier/capo)', tone: 'neutral' },
    ],
    onFailure: [{ label: 'Refund', value: '50% if contract expires unfulfilled', tone: 'neutral' }],
    warnings: [],
  };
};
