/**
 * Game Analysis — the consigliere's post-mortem.
 *
 * Pure, deterministic derivation over game state + turn-report history + alerts log.
 * Answers two questions:
 *   1. What went wrong, and what led up to it?  (setbacks)
 *   2. What did I leave on the table?           (missed opportunities)
 *
 * No game rules live here — this module only reads.
 */

import type { EnhancedMafiaGameState, TurnReport, HexTile } from '@/hooks/useEnhancedMafiaGameState';
import {
  BUILDING_DEFS,
  BUILD_RANK_REQUIREMENT,
  buildEtaTurns,
  isCapoPromotionEligible,
  getCapoPromotionCost,
  MAX_CAPOS,
  BRIBE_TIERS,
  type BuildingType,
} from '@/types/game-mechanics';

export type AnalysisSeverity = 'critical' | 'warning' | 'note';
export type AnalysisKind = 'setback' | 'opportunity';

export interface AnalysisFinding {
  id: string;
  kind: AnalysisKind;
  severity: AnalysisSeverity;
  turn: number;
  title: string;
  /** The chain of causes that produced the outcome, newest cause last. */
  causes: string[];
  /** The corrective move. */
  advice: string;
  hexRef?: { q: number; r: number; s: number };
}

export type AnalysisWindow = 1 | 5 | 999;

const money = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString()}`;
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const hexKey = (h: { q: number; r: number; s: number }) => `${h.q},${h.r},${h.s}`;
const parseHex = (key: string) => {
  const [q, r, s] = key.split(',').map(Number);
  return Number.isFinite(q) && Number.isFinite(r) && Number.isFinite(s) ? { q, r, s } : undefined;
};

/** Turn reports we can reason over: rolling history plus the live report. */
export function analysisReports(state: EnhancedMafiaGameState): TurnReport[] {
  const history = (state as any).turnReportHistory as TurnReport[] | undefined;
  const list = [...(history || [])];
  if (state.turnReport && !list.some(r => r.turn === state.turnReport!.turn)) list.push(state.turnReport);
  return list.sort((a, b) => a.turn - b.turn);
}

const alertsSince = (state: EnhancedMafiaGameState, sinceTurn: number, re: RegExp) =>
  (state.alertsLog || [])
    .filter(a => a.turn >= sinceTurn && re.test(`${a.title} ${a.message || ''}`))
    .sort((a, b) => a.turn - b.turn);

// ────────────────────────────────────────────────────────────
// SETBACKS
// ────────────────────────────────────────────────────────────

export function analyzeSetbacks(state: EnhancedMafiaGameState): AnalysisFinding[] {
  const out: AnalysisFinding[] = [];
  const turn = state.turn;
  const reports = analysisReports(state);
  const recent = reports.slice(-6);
  const heat = state.policeHeat?.level ?? 0;
  const lawyerActive = (state.lawyerRetainerEndsTurn || state.lawyerActiveUntil || 0) >= turn;
  const bribeActive = (state.activeBribes || []).some(b => b.active && b.turnsRemaining > 0);

  // ── Arrests: capos and soldiers ──
  const heatDrivers = (label: string) => {
    const acts = alertsSince(state, turn - 3, /hit|blind hit|extort|sabotage|assault/i);
    const causes: string[] = [];
    causes.push(`Heat was at ${Math.round(heat)} when ${label}.`);
    if (acts.length) {
      causes.push(`Heat-raising moves in the last 3 turns: ${acts.slice(-4).map(a => a.title.replace(/^[^\w]+/, '')).join('; ')}.`);
    }
    causes.push(bribeActive ? 'A bribe was running, but not enough to cover the exposure.' : 'No bribe was active — nothing was buying down street heat.');
    causes.push(lawyerActive ? 'A lawyer retainer was on file, which softened the charge.' : 'No lawyer on retainer when the pinch came.');
    return causes;
  };

  for (const c of state.arrestedCapos || []) {
    if (c.family && c.family !== state.playerFamily) continue;
    const t = c.arrestTurn ?? turn;
    if (turn - t > 8) continue;
    out.push({
      id: `arrest-capo-${c.unitId}-${t}`,
      kind: 'setback',
      severity: 'critical',
      turn: t,
      title: `${c.name || 'Your capo'} was arrested`,
      causes: heatDrivers('the arrest landed'),
      advice: lawyerActive
        ? 'Cool off: run a Patrol Officer bribe or Lay Low before your next hit, and keep capos off high-heat blocks.'
        : 'Put a lawyer on retainer before heat climbs past 50, and bribe down street heat between violent moves.',
    });
  }

  const soldierArrests = (state.arrestedSoldiers || []).filter(
    a => (!a.family || a.family === state.playerFamily) && turn - (a.arrestTurn ?? turn) <= 5,
  );
  if (soldierArrests.length >= 2) {
    const t = Math.max(...soldierArrests.map(a => a.arrestTurn ?? turn));
    out.push({
      id: `arrest-soldiers-${t}-${soldierArrests.length}`,
      kind: 'setback',
      severity: 'warning',
      turn: t,
      title: `${soldierArrests.length} soldiers are in the can`,
      causes: heatDrivers('the sweeps happened'),
      advice: 'Sustained heat costs you bodies. Alternate earning turns with heat-reduction (bribe, charity, public appearance).',
    });
  }

  // ── Money ──
  for (const r of recent) {
    const b = r.incomeBreakdown;
    const negative = state.resources.money < 0 && r.turn === turn;
    if (!b) continue;
    if (b.net >= 0 && !negative) continue;
    const lines = [
      ...b.penalties.map(p => ({ label: p.label, amount: Math.abs(p.amount) })),
      ...b.expenses.map(e => ({ label: e.label, amount: Math.abs(e.amount) })),
    ].sort((x, y) => y.amount - x.amount);
    const worst = lines[0];
    const causes: string[] = [
      `Gross earn: ${money(b.illegalGross + b.legalGross)} (${money(b.illegalGross)} illegal, ${money(b.legalGross)} legal).`,
      ...lines.slice(0, 4).map(l => `${l.label}: −${money(l.amount)}.`),
    ];
    if (worst) causes.push(`Biggest drain: ${worst.label} at ${money(worst.amount)} — ${Math.round((worst.amount / Math.max(1, lines.reduce((s, l) => s + l.amount, 0))) * 100)}% of your outgoings.`);
    out.push({
      id: `money-${r.turn}`,
      kind: 'setback',
      severity: negative ? 'critical' : 'warning',
      turn: r.turn,
      title: negative ? `Treasury is in the red (${money(state.resources.money)} short)` : `You ran a loss of ${money(b.net)}`,
      causes,
      advice: worst && /upkeep|soldier/i.test(worst.label)
        ? 'Crew upkeep outruns your earn. Build or upgrade rackets on blocks you already hold before recruiting more bodies.'
        : worst && /empty|overhead|vacant/i.test(worst.label)
          ? 'You hold ground that pays nothing. Develop those blocks or abandon them to cut overhead.'
          : 'Cut the biggest drain first, then raise the earn: buy out an anchor racket or upgrade an existing building.',
    });
  }

  // ── Failed hits / dead soldiers ──
  for (const a of alertsSince(state, turn - 5, /hit failed|soldier killed|capo wounded|ambush/i)) {
    const scouted = (state.scoutedHexes || []).some(
      (h: any) => a.hexRef && h.q === a.hexRef.q && h.r === a.hexRef.r && h.s === a.hexRef.s,
    );
    const fortified = a.hexRef
      ? (state.fortifiedHexes || []).some((f: any) => f.q === a.hexRef!.q && f.r === a.hexRef!.r && f.s === a.hexRef!.s)
      : false;
    out.push({
      id: `combat-${a.id}`,
      kind: 'setback',
      severity: /soldier killed/i.test(a.title) ? 'critical' : 'warning',
      turn: a.turn,
      title: a.title.replace(/^[^\w]+/, ''),
      causes: [
        a.message || 'The move went badly on the street.',
        scouted ? 'The block was scouted beforehand — you had intel.' : 'The block was never scouted — you swung blind, at the worst odds in the game.',
        fortified ? 'The defender was fortified, cutting your odds further.' : 'The defender was not fortified.',
      ],
      advice: scouted
        ? 'Stack the odds: Plan a Hit for a guaranteed kill, or bring a second body before you swing.'
        : 'Scout the block first. Blind hits are the single biggest source of dead soldiers and heat.',
      hexRef: a.hexRef,
    });
  }

  // ── Territory lost ──
  for (const r of recent) {
    for (const ch of r.territoryChanges || []) {
      if (ch.change !== 'lost') continue;
      const hx = parseHex(ch.hex);
      const garrisoned = hx
        ? (state.deployedUnits || []).some(u => u.family === state.playerFamily && u.q === hx.q && u.r === hx.r && u.s === hx.s)
        : false;
      const supply = hx ? state.businessSupplyStatus?.[hexKey(hx)] : undefined;
      out.push({
        id: `terr-${r.turn}-${ch.hex}`,
        kind: 'setback',
        severity: ch.to === 'neutral' ? 'note' : 'warning',
        turn: r.turn,
        title: `Lost a block in ${ch.district}`,
        causes: [
          ch.cause,
          ch.to === 'neutral' ? 'It eroded away — no presence, no influence holding it.' : `${cap(ch.to)} took it off you.`,
          garrisoned ? 'You had a body on it at the time.' : 'Nobody was standing on it.',
          supply && supply.status !== 'supplied' ? `It was ${supply.status} for supply, so it was earning little anyway.` : '',
        ].filter(Boolean),
        advice: ch.to === 'neutral'
          ? 'Erosion only bites empty ground. Garrison your border blocks or develop them so influence holds.'
          : 'Fortify border blocks and keep a reaction force within one move of the frontier.',
        hexRef: hx,
      });
    }
  }

  // ── Supply severed ──
  for (const r of recent) {
    for (const sc of (r.supplyChanges || []).filter(s => s.event === 'disconnected')) {
      out.push({
        id: `supply-${r.turn}-${sc.nodeType}`,
        kind: 'setback',
        severity: 'warning',
        turn: r.turn,
        title: `${cap(sc.nodeType.replace(/_/g, ' '))} supply cut`,
        causes: [sc.detail, 'Businesses depending on that node decay toward 10% earnings while it stays severed.'],
        advice: 'Retake the route hexes or reroute supply — every turn severed compounds the decay.',
      });
    }
  }

  // ── Loyalty ──
  const loyaltyReport = recent.find(r => (r.resourceDeltas?.loyalty ?? 0) <= -3);
  if (loyaltyReport) {
    const mercs = Object.values(state.soldierStats || {}).filter(s => s.isMercenary).length;
    const total = Object.keys(state.soldierStats || {}).length || 1;
    const dinner = (state.lastFamilyDinnerTurn || {})[state.playerFamily] ?? -99;
    out.push({
      id: `loyalty-${loyaltyReport.turn}`,
      kind: 'setback',
      severity: 'warning',
      turn: loyaltyReport.turn,
      title: `Loyalty slid ${loyaltyReport.resourceDeltas.loyalty.toFixed(1)}`,
      causes: [
        ...(loyaltyReport.loyaltyReasons || []).map(x => `${x.reason}: ${x.delta > 0 ? '+' : ''}${x.delta}`),
        `${mercs} of ${total} crew are mercenaries — bought men bleed loyalty faster than locals.`,
        dinner < turn - 5 ? 'No Family Dinner in the last 5 turns.' : `Family Dinner held on turn ${dinner}.`,
      ],
      advice: 'Hold a Family Dinner, keep men busy (idle crews decay), and recruit local instead of mercenary.',
    });
  }

  // Suspicious / confirmed rats
  const rats = Object.entries(state.soldierStats || {}).filter(([, s]) => s.confirmedRat || s.suspicious);
  if (rats.length) {
    out.push({
      id: `rats-${turn}-${rats.length}`,
      kind: 'setback',
      severity: rats.some(([, s]) => s.confirmedRat) ? 'critical' : 'warning',
      turn,
      title: `${rats.length} crew member${rats.length > 1 ? 's are' : ' is'} suspect`,
      causes: [
        'Loyalty under 40 for two turns running flags a man as suspect.',
        `${(state.copFlippedSoldiers || []).length} confirmed informants are feeding the cops right now.`,
        'Each informant adds heat every turn and shaves 10% off illegal income.',
      ],
      advice: 'Bribe a Captain or Chief to confirm the rat, then Purge Ranks — or raise loyalty before it turns.',
    });
  }

  // ── RICO / prosecution ──
  if ((state.ricoTimer || 0) > 0 || (state.prosecutionTimer || 0) > 0) {
    const pr = recent.flatMap(r => r.prosecutionReasons || []);
    out.push({
      id: `rico-${turn}`,
      kind: 'setback',
      severity: (state.ricoTimer || 0) > 0 ? 'critical' : 'warning',
      turn,
      title: (state.ricoTimer || 0) > 0 ? `RICO clock running — ${state.ricoTimer} turns` : 'Prosecutors are building a case',
      causes: [
        `Heat sits at ${Math.round(heat)}.`,
        ...pr.slice(-4).map(x => `${x.reason}: ${x.delta > 0 ? '+' : ''}${x.delta}`),
        (state.wiretaps || []).length ? `${(state.wiretaps || []).length} federal wire${(state.wiretaps || []).length > 1 ? 's' : ''} on record.` : 'No known federal wires.',
        lawyerActive ? 'Retainer active.' : 'No lawyer retainer — nothing is slowing the case.',
      ],
      advice: 'Retain a Consigliere-tier lawyer, run a Sweep for wires, and stop violent actions until heat drops below 40.',
    });
  }

  // ── War / diplomacy fallout ──
  for (const r of recent) {
    for (const w of (r.warUpdates || []).filter(x => x.event === 'started')) {
      out.push({
        id: `war-${r.turn}-${w.families}`,
        kind: 'setback',
        severity: 'warning',
        turn: r.turn,
        title: `War broke out: ${w.families}`,
        causes: [
          w.detail,
          ...(r.relationshipChanges || []).filter(rc => rc.delta < 0).slice(0, 3).map(rc => `${cap(rc.family)} relationship ${rc.delta} — ${rc.reason}`),
        ],
        advice: 'Tension is visible before it snaps. Sit down and buy a ceasefire while relationships are still above 40.',
      });
    }
  }

  return out.sort((a, b) => b.turn - a.turn || sevRank(a.severity) - sevRank(b.severity));
}

// ────────────────────────────────────────────────────────────
// MISSED OPPORTUNITIES
// ────────────────────────────────────────────────────────────

export function analyzeMissedOpportunities(state: EnhancedMafiaGameState): AnalysisFinding[] {
  const out: AnalysisFinding[] = [];
  const turn = state.turn;
  const me = state.playerFamily;
  const myUnits = (state.deployedUnits || []).filter(u => u.family === me);
  const myHexes = (state.hexMap || []).filter(h => h.controllingFamily === me);
  const unitAt = (h: HexTile) => myUnits.filter(u => u.q === h.q && u.r === h.r && u.s === h.s);
  const cash = state.resources.money;

  // Unspent actions
  const reports = analysisReports(state).slice(-5);
  if (state.actionsRemaining > 0 && state.turnPhase !== 'waiting') {
    out.push({
      id: `actions-${turn}`,
      kind: 'opportunity',
      severity: state.actionsRemaining >= 2 ? 'warning' : 'note',
      turn,
      title: `${state.actionsRemaining} of ${state.maxActions} actions still unspent`,
      causes: ['Actions do not bank — anything unused this turn is gone.'],
      advice: 'Claim, extort, build, scout or fortify before you end the turn.',
    });
  }

  // Idle units on undeveloped owned ground
  const idleOnBareGround = myHexes.filter(h => {
    const built = Object.keys(h.buildings || {}).length > 0;
    return !built && !h.build && !h.anchor && unitAt(h).length > 0;
  });
  if (idleOnBareGround.length) {
    const h = idleOnBareGround[0];
    out.push({
      id: `idle-${turn}-${hexKey(h)}`,
      kind: 'opportunity',
      severity: 'note',
      turn,
      title: `${idleOnBareGround.length} crew sitting on bare ground`,
      causes: [`${idleOnBareGround.length} block${idleOnBareGround.length > 1 ? 's have' : ' has'} a body on it and nothing built — that crew earns you nothing where it stands.`],
      advice: 'Break ground on a Store Front or Loan Office, or move the crew to a block that pays.',
      hexRef: { q: h.q, r: h.r, s: h.s },
    });
  }

  // Affordable builds on owned, empty, occupied blocks
  const buildable = myHexes.filter(h => !h.build && Object.keys(h.buildings || {}).length === 0 && !h.anchor && unitAt(h).length > 0);
  if (buildable.length) {
    const hasCapo = (h: HexTile) => unitAt(h).some(u => u.type === 'capo');
    let best: { hex: HexTile; type: BuildingType; cost: number; income: number } | null = null;
    for (const h of buildable) {
      for (const type of Object.keys(BUILDING_DEFS) as BuildingType[]) {
        if (BUILD_RANK_REQUIREMENT[type] === 'capo' && !hasCapo(h)) continue;
        const t1 = BUILDING_DEFS[type].tiers[1];
        if (t1.cost > cash) continue;
        if (!best || t1.income > best.income) best = { hex: h, type, cost: t1.cost, income: t1.income };
      }
    }
    if (best) {
      out.push({
        id: `build-${turn}-${hexKey(best.hex)}`,
        kind: 'opportunity',
        severity: 'warning',
        turn,
        title: `You can afford a ${BUILDING_DEFS[best.type].tiers[1].name} in ${best.hex.district}`,
        causes: [
          `${money(best.cost)} to break ground; adds ${money(best.income)}/month once open.`,
          `Crew is already on site — ETA ${buildEtaTurns(BUILDING_DEFS[best.type].tiers[1].months, hasCapo(best.hex), unitAt(best.hex).length)} turn(s).`,
        ],
        advice: 'Start the build now — construction runs while you do other things.',
        hexRef: { q: best.hex.q, r: best.hex.r, s: best.hex.s },
      });
    }
  }

  // Upgradeable buildings
  const upgradable = myHexes.filter(h => {
    if (h.build) return false;
    return Object.entries(h.buildings || {}).some(([type, tier]) => {
      const next = (tier as number) + 1;
      return next <= 3 && BUILDING_DEFS[type as BuildingType].tiers[next as 1 | 2 | 3].cost <= cash;
    });
  });
  if (upgradable.length) {
    const h = upgradable[0];
    out.push({
      id: `upgrade-${turn}-${hexKey(h)}`,
      kind: 'opportunity',
      severity: 'note',
      turn,
      title: `${upgradable.length} racket${upgradable.length > 1 ? 's are' : ' is'} ready to upgrade`,
      causes: ['You have the cash on hand and the block is idle.'],
      advice: 'Upgrading beats sprawling — a tier bump costs less than holding new ground.',
      hexRef: { q: h.q, r: h.r, s: h.s },
    });
  }

  // Anchors: un-extorted or un-bought
  const anchorsInMyGround = myHexes.filter(h => h.anchor);
  const unextorted = anchorsInMyGround.filter(h => !h.anchor!.isExtorted);
  const boughtable = anchorsInMyGround.filter(h => h.anchor!.isExtorted && h.anchor!.extortedBy === me && h.anchor!.buyoutCost <= cash && unitAt(h).length > 0);
  if (unextorted.length) {
    const h = unextorted[0];
    out.push({
      id: `anchor-extort-${turn}-${hexKey(h)}`,
      kind: 'opportunity',
      severity: 'warning',
      turn,
      title: `${unextorted.length} racket${unextorted.length > 1 ? 's' : ''} on your ground pay you nothing`,
      causes: [`${h.anchor!.name} in ${h.district} would pay ${money(h.anchor!.tribute)}/month in tribute.`],
      advice: 'Put a body on the block and extort it — tribute is free money before you ever buy it out.',
      hexRef: { q: h.q, r: h.r, s: h.s },
    });
  }
  if (boughtable.length) {
    const h = boughtable[0];
    out.push({
      id: `anchor-buyout-${turn}-${hexKey(h)}`,
      kind: 'opportunity',
      severity: 'note',
      turn,
      title: `You can buy out ${h.anchor!.name}`,
      causes: [`${money(h.anchor!.buyoutCost)} converts it to a Tier 1 ${BUILDING_DEFS[h.anchor!.type].label} you can develop.`],
      advice: 'Own it outright — extortion tribute is capped, developed rackets are not.',
      hexRef: { q: h.q, r: h.r, s: h.s },
    });
  }

  // Claimable empty blocks next to your crew
  const NEIGHBORS = [[1, -1, 0], [1, 0, -1], [0, 1, -1], [-1, 1, 0], [-1, 0, 1], [0, -1, 1]];
  const claimable = new Set<string>();
  for (const u of myUnits) {
    for (const [dq, dr, ds] of NEIGHBORS) {
      const t = (state.hexMap || []).find(h => h.q === u.q + dq && h.r === u.r + dr && h.s === u.s + ds);
      if (t && t.controllingFamily === 'neutral' && !t.pendingClaim) claimable.add(hexKey(t));
    }
  }
  if (claimable.size && state.actionsRemaining > 0) {
    const first = parseHex([...claimable][0]);
    out.push({
      id: `claim-${turn}-${claimable.size}`,
      kind: 'opportunity',
      severity: 'note',
      turn,
      title: `${claimable.size} empty block${claimable.size > 1 ? 's are' : ' is'} within reach`,
      causes: ['Your crew is standing next to unclaimed ground and you still have actions.'],
      advice: 'Move a capo on (free claim) or spend a soldier action to take the block.',
      hexRef: first,
    });
  }

  // Unattended construction
  const stalled = myHexes.filter(h => h.build && unitAt(h).length === 0);
  if (stalled.length) {
    const h = stalled[0];
    const b = h.build!;
    const slow = buildEtaTurns(b.monthsRemaining, false, 0);
    const fast = buildEtaTurns(b.monthsRemaining, true, 0);
    out.push({
      id: `stalled-${turn}-${hexKey(h)}`,
      kind: 'opportunity',
      severity: 'warning',
      turn,
      title: `${stalled.length} construction site${stalled.length > 1 ? 's have' : ' has'} nobody on it`,
      causes: [`${BUILDING_DEFS[b.type].label} in ${h.district}: ${slow} turns unattended vs ${fast} with a capo on site.`],
      advice: 'Park a capo on the site — it more than quadruples build speed.',
      hexRef: { q: h.q, r: h.r, s: h.s },
    });
  }

  // Promotions
  const capoCount = myUnits.filter(u => u.type === 'capo').length;
  const eligible = myUnits.filter(u => u.type === 'soldier' && state.soldierStats?.[u.id] && isCapoPromotionEligible(state.soldierStats[u.id]));
  if (eligible.length && capoCount < MAX_CAPOS) {
    const cheapest = Math.min(...eligible.map(u => getCapoPromotionCost(state.soldierStats[u.id])));
    out.push({
      id: `promote-${turn}-${eligible.length}`,
      kind: 'opportunity',
      severity: cash >= cheapest ? 'warning' : 'note',
      turn,
      title: `${eligible.length} soldier${eligible.length > 1 ? 's are' : ' is'} ready to be made`,
      causes: [
        `Promotion costs ${money(cheapest)}; you hold ${money(cash)}.`,
        `You run ${capoCount} of ${MAX_CAPOS} capos.`,
      ],
      advice: cash >= cheapest ? 'Make him. Capos claim for free, fly across the map and build at 1.5x speed.' : 'Bank the cash — a capo is the strongest per-dollar unit in the game.',
      hexRef: eligible[0] ? { q: eligible[0].q, r: eligible[0].r, s: eligible[0].s } : undefined,
    });
  }

  // Affordable bribe while hot
  const heat = state.policeHeat?.level ?? 0;
  const bribeActive = (state.activeBribes || []).some(b => b.active && b.turnsRemaining > 0);
  if (heat >= 40 && !bribeActive) {
    const affordable = BRIBE_TIERS.filter(t => t.cost <= cash);
    if (affordable.length) {
      const best = affordable[affordable.length - 1];
      out.push({
        id: `bribe-${turn}`,
        kind: 'opportunity',
        severity: heat >= 65 ? 'warning' : 'note',
        turn,
        title: `Heat at ${Math.round(heat)} with no one on the payroll`,
        causes: [`You can afford the ${best.label} at ${money(best.cost)}: ${best.description}`],
        advice: 'Buy the badge before the arrests start — bribes are far cheaper than lost capos.',
      });
    }
  }

  // Idle-turn crew (from stats)
  const idleCrew = Object.entries(state.soldierStats || {}).filter(([, s]) => (s.turnsIdle || 0) >= 3);
  if (idleCrew.length) {
    out.push({
      id: `idlecrew-${turn}-${idleCrew.length}`,
      kind: 'opportunity',
      severity: 'note',
      turn,
      title: `${idleCrew.length} crew idle 3+ turns`,
      causes: ['Idle men lose loyalty and gain no training, toughness or racketeering.'],
      advice: 'Give them work — extortion and claims are the cheapest way to grow a soldier.',
    });
  }

  void reports;
  return out.sort((a, b) => sevRank(a.severity) - sevRank(b.severity));
}

function sevRank(s: AnalysisSeverity): number {
  return s === 'critical' ? 0 : s === 'warning' ? 1 : 2;
}

/** Everything, filtered by a turn window. */
export function analyzeGame(state: EnhancedMafiaGameState, window: AnalysisWindow = 999) {
  const cutoff = window === 999 ? -Infinity : state.turn - (window - 1);
  const setbacks = analyzeSetbacks(state).filter(f => f.turn >= cutoff);
  const opportunities = analyzeMissedOpportunities(state);
  return { setbacks, opportunities };
}
