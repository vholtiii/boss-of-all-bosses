/**
 * Phase 1/2/4/5 upgrade test suite.
 *
 * Covers the redesign plan's test checklist:
 *  - Preview/execution parity (shared formula functions feed both paths)
 *  - Deterministic AI by seed (same seed → same AI outcomes; different seeds diverge)
 *  - Posture/personality-driven action scoring (ai-action-scoring layer)
 *  - AI heat avoidance near RICO danger
 *  - Map overlay derivations (war front, unsupported, disconnected, route-breaking)
 *  - Structured turn-report reasons
 *  - Commission vote projection matches the actual vote outcome
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEnhancedMafiaGameState } from '@/hooks/useEnhancedMafiaGameState';
import {
  actionChance, fireGate, fireOffensiveGate,
  offensePersonalityMul, diplomacyPersonalityMul, pickWeighted,
} from '@/lib/ai-action-scoring';
import { posturePolicy } from '@/lib/ai-posture';
import {
  mulberry32, scoreHexForAI, scorePlanHitTarget, familySignaturePreference,
  type ScoreHexInputs,
} from '@/lib/ai-strategy';
import {
  computeExtortCore, computeBribeCore, computeCommissionVoteProjection,
} from '@/lib/action-formulas';
import { previewExtort, previewBribe } from '@/lib/action-previews';
import {
  computeMapOverlays, computeRouteBreakingHexes, computeConnectedTerritory, hexKey,
} from '@/lib/map-overlays';
import { getNegotiationSuccessChance, relationshipSway } from '@/lib/negotiation-odds';
import { SUPPLY_DEPENDENCIES } from '@/types/game-mechanics';

// ───────────────────────────────────────────────────────────────────
// 1. Weighted action scoring (posture + personality)
// ───────────────────────────────────────────────────────────────────
describe('ai-action-scoring: weighted gates', () => {
  it('clamps to [min, max] and suppression zeroes the chance', () => {
    expect(actionChance({ base: 5 })).toBeLessThanOrEqual(0.95);
    expect(actionChance({ base: 0.5, min: 0.05, personalityMul: 0 })).toBe(0.05);
    expect(actionChance({ base: 0.9, suppressed: true })).toBe(0);
    const rng = mulberry32(42);
    for (let i = 0; i < 20; i++) {
      expect(fireGate(rng, { base: 0.9, suppressed: true })).toBe(false);
    }
  });

  it('is deterministic under a seeded rng', () => {
    const roll = (seed: number) => {
      const rng = mulberry32(seed);
      return Array.from({ length: 10 }, () => fireGate(rng, { base: 0.5 }));
    };
    expect(roll(123)).toEqual(roll(123));
  });

  it('aggressive personalities fire offensive gates more than diplomatic ones', () => {
    expect(offensePersonalityMul('aggressive')).toBeGreaterThan(offensePersonalityMul('diplomatic'));
    expect(offensePersonalityMul('aggressive')).toBeGreaterThan(offensePersonalityMul('defensive'));
    expect(diplomacyPersonalityMul('diplomatic')).toBeGreaterThan(diplomacyPersonalityMul('aggressive'));
  });

  it('posture policy shifts offensive chance (UNDERDOG harasses, TURTLE hunkers)', () => {
    const underdog = posturePolicy('UNDERDOG');
    const turtle = posturePolicy('TURTLE');
    const chanceWith = (mul: number | undefined, suppressed: boolean) =>
      actionChance({ base: 0.2, postureMul: mul ?? 1, suppressed });
    const underdogChance = chanceWith(underdog.offensiveHitMul, underdog.suppressOffense);
    const turtleChance = chanceWith(turtle.offensiveHitMul, turtle.suppressOffense);
    expect(underdogChance).toBeGreaterThan(turtleChance);
  });

  it('COOL_OFF posture suppresses offensive gates entirely', () => {
    const coolOff = posturePolicy('COOL_OFF');
    const rng = mulberry32(7);
    for (let i = 0; i < 20; i++) {
      expect(fireOffensiveGate(rng, 0.9, 'aggressive', coolOff)).toBe(false);
    }
  });

  it('pickWeighted respects weights and rejects empty pools', () => {
    const rng = mulberry32(99);
    expect(pickWeighted([], rng)).toBeNull();
    expect(pickWeighted([{ item: 'a', weight: 0 }], rng)).toBeNull();
    // With one dominant weight, it should be picked almost always
    let dominant = 0;
    for (let i = 0; i < 100; i++) {
      const picked = pickWeighted([
        { item: 'heavy', weight: 100 },
        { item: 'light', weight: 1 },
      ], rng);
      if (picked === 'heavy') dominant++;
    }
    expect(dominant).toBeGreaterThan(90);
  });
});

// ───────────────────────────────────────────────────────────────────
// 2. Leader-progress targeting in hex/target scoring
// ───────────────────────────────────────────────────────────────────
describe('leader-progress scoring', () => {
  const baseHex: ScoreHexInputs = {
    hexIncome: 0, defenderCount: 1, isInFocusDistrict: false, distanceToOwnHQ: 3,
    isFortified: false, isSafehouse: false, hasScoutIntel: false, isWarTarget: false,
    isAdjacentToOwnTerritory: false, isPlayerHex: false,
    effectivePersonality: 'opportunistic', signaturePref: familySignaturePreference('gambino'),
    phase: 3, mood: 'neutral', jitter: 0, difficulty: 'normal',
  };

  it('hexes of a near-victory leader score higher than the same hex otherwise', () => {
    const baseline = scoreHexForAI(baseHex);
    const leaderNearWin = scoreHexForAI({ ...baseHex, isLeaderHex: true, leaderProgress: 0.95 });
    expect(leaderNearWin).toBeGreaterThan(baseline);
  });

  it('leader bonus only ramps past 50% progress', () => {
    const baseline = scoreHexForAI(baseHex);
    const earlyLeader = scoreHexForAI({ ...baseHex, isLeaderHex: true, leaderProgress: 0.3 });
    expect(earlyLeader).toBeCloseTo(baseline, 5);
  });

  it('plan-hit targeting prioritizes capos of the runaway leader', () => {
    const base = {
      level: 2, distanceToBorder: 2, atWar: false, distanceToOwnHQ: 4,
      isFortified: false, isSafehouse: false, jitter: 0,
    };
    const normal = scorePlanHitTarget(base);
    const leader = scorePlanHitTarget({ ...base, targetIsLeader: true, leaderProgress: 0.9 });
    expect(leader).toBeGreaterThan(normal);
  });
});

// ───────────────────────────────────────────────────────────────────
// 3. Preview / execution parity (shared formulas)
// ───────────────────────────────────────────────────────────────────
describe('preview/execution parity', () => {
  const extortState = () => ({
    playerFamily: 'gambino',
    hexMap: [
      { q: 1, r: 0, s: -1, controllingFamily: 'neutral', district: 'Queens', terrain: 'urban' },
    ],
    deployedUnits: [
      { id: 's1', family: 'gambino', type: 'soldier', q: 1, r: 0, s: -1 },
    ],
    resources: { money: 10000, influence: 20, respect: 20 },
    reputation: { respect: 20 },
    policeHeat: { level: 30 },
    activeDistrictBonuses: [],
    fortifiedHexes: [],
    difficultyModifiers: { policeHeatMult: 1 },
  });

  it('previewExtort surfaces exactly the core formula chance and heat', () => {
    const state = extortState();
    const core = computeExtortCore(state, { targetQ: 1, targetR: 0, targetS: -1 });
    const preview = previewExtort(state, { targetQ: 1, targetR: 0, targetS: -1 });
    expect(core.ok).toBe(true);
    expect(preview.valid).toBe(true);
    expect(preview.successChance).toBe(core.chance);
    // Heat shown in preview equals scaled heat from the core
    expect(preview.onSuccess.find(d => d.label === 'Heat')?.value).toBe(`+${core.scaledHeatSuccess}`);
  });

  it('Queens district control adds exactly +15 percentage points to extortion', () => {
    // Enemy hex (50% base) so the bonus isn't swallowed by the 99% cap
    const state = extortState();
    state.hexMap[0].controllingFamily = 'genovese';
    (state.hexMap[0] as any).business = { type: 'gambling', income: 2500, isLegal: false };
    const without = computeExtortCore(state, { targetQ: 1, targetR: 0, targetS: -1 });
    const withBonus = computeExtortCore({
      ...state,
      activeDistrictBonuses: [{ family: 'gambino', bonusType: 'extortion' }],
    }, { targetQ: 1, targetR: 0, targetS: -1 });
    expect(without.isEnemy).toBe(true);
    expect(withBonus.chance).toBeCloseTo(without.chance + 0.15, 5);
    expect(withBonus.modifiers.some(m => m.label.includes('Queens'))).toBe(true);
  });

  it('previewBribe mirrors computeBribeCore, and heat lowers bribe odds', () => {
    const state: any = {
      playerFamily: 'gambino',
      resources: { money: 100000, influence: 16 },
      reputation: { reputation: 30 },
      policeHeat: { level: 0 },
      gamePhase: 3,
      activeBribes: [],
    };
    const core = computeBribeCore(state, 'patrol_officer');
    const preview = previewBribe(state, 'patrol_officer');
    expect(core.ok).toBe(true);
    expect(preview.successChance).toBeCloseTo(core.chance / 100, 5);

    const hot = computeBribeCore({ ...state, policeHeat: { level: 60 } }, 'patrol_officer');
    expect(hot.chance).toBeLessThan(core.chance);
  });
});

// ───────────────────────────────────────────────────────────────────
// 4. Negotiation: relationship sway + leader wariness
// ───────────────────────────────────────────────────────────────────
describe('negotiation odds: diplomacy improvements', () => {
  it('relationshipSway clamps to ±10', () => {
    expect(relationshipSway(100)).toBe(10);
    expect(relationshipSway(-100)).toBe(-10);
    expect(relationshipSway(35)).toBe(4);
  });

  it('grudges reduce acceptance; good standing raises it', () => {
    const base = { type: 'ceasefire' as const, scope: 'family' as const, playerReputation: 30, playerInfluence: 20 };
    const friendly = getNegotiationSuccessChance({ ...base, relationshipWithTarget: 60 });
    const hostile = getNegotiationSuccessChance({ ...base, relationshipWithTarget: -60 });
    expect(friendly).toBeGreaterThan(hostile);
  });

  it('a runaway leader gets stonewalled on peace deals but not on bribes', () => {
    const base = { scope: 'family' as const, playerReputation: 30, playerInfluence: 20 };
    const ceasefireNormal = getNegotiationSuccessChance({ ...base, type: 'ceasefire' });
    const ceasefireLeader = getNegotiationSuccessChance({ ...base, type: 'ceasefire', playerIsRunawayLeader: true });
    expect(ceasefireLeader).toBe(ceasefireNormal - 15);

    const bribeNormal = getNegotiationSuccessChance({ ...base, type: 'bribe_territory', scope: 'territory' });
    const bribeLeader = getNegotiationSuccessChance({ ...base, type: 'bribe_territory', scope: 'territory', playerIsRunawayLeader: true });
    expect(bribeLeader).toBe(bribeNormal);
  });
});

// ───────────────────────────────────────────────────────────────────
// 5. Map overlay derivations
// ───────────────────────────────────────────────────────────────────
describe('map overlays', () => {
  // Hand-built mini map: player HQ chain with a cut-off pocket, a war border,
  // and a business with no supply access.
  const [depBizType, depTypes] = Object.entries(SUPPLY_DEPENDENCIES).find(([, d]) => (d as string[]).length > 0)! as [string, string[]];

  const overlayState = () => ({
    playerFamily: 'gambino',
    activeWars: [{ family1: 'gambino', family2: 'genovese' }],
    hexMap: [
      // HQ + connected chain
      { q: 0, r: 0, s: 0, controllingFamily: 'gambino', isHeadquarters: 'gambino', district: 'Manhattan' },
      { q: 1, r: 0, s: -1, controllingFamily: 'gambino', district: 'Manhattan' },
      { q: 2, r: 0, s: -2, controllingFamily: 'gambino', district: 'Manhattan' },
      // Disconnected pocket (not adjacent to the chain)
      { q: 5, r: 0, s: -5, controllingFamily: 'gambino', district: 'Queens' },
      // Enemy at war borders the chain tip
      { q: 3, r: 0, s: -3, controllingFamily: 'genovese', district: 'Manhattan' },
      // Business hex needing supply (no supply nodes anywhere → disconnected)
      { q: 1, r: -1, s: 0, controllingFamily: 'gambino', district: 'Manhattan', business: { type: depBizType, income: 3000, isLegal: true } },
      // Neutral expansion candidate adjacent to player
      { q: 0, r: 1, s: -1, controllingFamily: 'neutral', district: 'Manhattan' },
    ],
    deployedUnits: [],
    fortifiedHexes: [],
    safehouses: [],
    supplyNodes: [],
  });

  it('derives war fronts, unsupported pockets, and disconnected businesses', () => {
    const overlays = computeMapOverlays(overlayState());
    expect(overlays.warEnemies).toEqual(['genovese']);
    // Chain tip borders the enemy → war front on both sides of the border
    expect(overlays.warFrontHexes.has(hexKey(2, 0, -2))).toBe(true);
    expect(overlays.warFrontHexes.has(hexKey(3, 0, -3))).toBe(true);
    // Cut-off pocket is unsupported
    expect(overlays.unsupportedHexes.has(hexKey(5, 0, -5))).toBe(true);
    expect(overlays.unsupportedHexes.has(hexKey(1, 0, -1))).toBe(false);
    // Business with no reachable supply node is flagged with its missing deps
    expect(overlays.disconnectedBusinesses.get(hexKey(1, -1, 0))).toEqual(depTypes);
    // Neutral hex adjacent to player territory is an expansion candidate
    expect(overlays.expansionCandidates.some(c => c.key === hexKey(0, 1, -1))).toBe(true);
  });

  it('identifies route-breaking hexes (articulation points)', () => {
    const state = overlayState();
    const connected = computeConnectedTerritory(state.hexMap, 'gambino');
    expect(connected.has(hexKey(2, 0, -2))).toBe(true);
    // (1,0,-1) holds (2,0,-2) onto the HQ network → route-breaking
    const breaking = computeRouteBreakingHexes(state);
    expect(breaking.has(hexKey(1, 0, -1))).toBe(true);
    // The chain tip holds nothing behind it → not route-breaking
    expect(breaking.has(hexKey(2, 0, -2))).toBe(false);
  });
});

// ───────────────────────────────────────────────────────────────────
// 6. Integration: seeded AI determinism
// ───────────────────────────────────────────────────────────────────
const runTurns = (hook: any, turns: number) => {
  for (let i = 0; i < turns; i++) {
    act(() => hook.result.current.advancePhase());
    act(() => hook.result.current.advancePhase());
    act(() => hook.result.current.advancePhase());
    act(() => hook.result.current.endTurn());
    act(() => hook.result.current.clearNotifications());
  }
};

/** AI-focused signature: resources, heat, and territory per family + AI unit positions. */
const aiSignature = (state: any): string => {
  const fams = (state.aiOpponents || []).map((o: any) => ({
    family: o.family,
    money: o.resources.money,
    heat: o.resources.heat || 0,
    respect: o.resources.respect,
    hexes: state.hexMap.filter((t: any) => t.controllingFamily === o.family).length,
  }));
  const units = (state.deployedUnits || [])
    .filter((u: any) => u.family !== state.playerFamily)
    .map((u: any) => `${u.family}:${u.type}@${u.q},${u.r},${u.s}`)
    .sort();
  return JSON.stringify({ fams, units });
};

describe('AI determinism by seed', () => {
  it('same seed → identical AI outcomes over 5 turns', () => {
    const a = renderHook(() => useEnhancedMafiaGameState('gambino', undefined, 'normal', 1234, 'small'));
    const b = renderHook(() => useEnhancedMafiaGameState('gambino', undefined, 'normal', 1234, 'small'));
    runTurns(a, 5);
    runTurns(b, 5);
    expect(aiSignature(a.result.current.gameState)).toEqual(aiSignature(b.result.current.gameState));
  }, 120000);

  it('different seeds → divergent AI outcomes', () => {
    const a = renderHook(() => useEnhancedMafiaGameState('gambino', undefined, 'normal', 1234, 'small'));
    const c = renderHook(() => useEnhancedMafiaGameState('gambino', undefined, 'normal', 987654, 'small'));
    runTurns(a, 5);
    runTurns(c, 5);
    expect(aiSignature(a.result.current.gameState)).not.toEqual(aiSignature(c.result.current.gameState));
  }, 120000);
});

// ───────────────────────────────────────────────────────────────────
// 7. Integration: AI reduces heat near RICO danger
// ───────────────────────────────────────────────────────────────────
describe('AI heat avoidance near RICO', () => {
  it('an AI at critical heat cools off (bribe/lay-low) instead of pushing on', () => {
    const hook = renderHook(() => useEnhancedMafiaGameState('gambino', undefined, 'normal', 555, 'small'));
    const clone = JSON.parse(JSON.stringify(hook.result.current.gameState));
    const target = clone.aiOpponents[0];
    target.resources.heat = 92;
    target.resources.money = 80000;
    // Defensive personality avoids the aggressive strategic-override path
    target.personality = 'defensive';
    act(() => hook.result.current.loadGameState(clone));

    runTurns(hook, 1);

    const after = hook.result.current.gameState.aiOpponents.find((o: any) => o.family === target.family) as any;
    // Family either survived and cooled down, or (worst case) is laying low with heat dropping
    expect(after).toBeTruthy();
    expect(after.resources.heat).toBeLessThan(92);
    // Forced stand-down at critical heat: lay-low flag set
    expect((after as any).layLowActiveUntil || 0).toBeGreaterThanOrEqual(hook.result.current.gameState.turn - 1);
  }, 120000);
});

// ───────────────────────────────────────────────────────────────────
// 8. Integration: structured turn report reasons
// ───────────────────────────────────────────────────────────────────
describe('turn report structured reasons', () => {
  it('endTurn populates income breakdown and reason ledgers', () => {
    const hook = renderHook(() => useEnhancedMafiaGameState('gambino', undefined, 'normal', 777, 'small'));
    runTurns(hook, 1);
    const report: any = (hook.result.current.gameState as any).turnReport;
    expect(report).toBeTruthy();
    expect(report.incomeBreakdown).toBeTruthy();
    expect(typeof report.incomeBreakdown.net).toBe('number');
    expect(Array.isArray(report.heatReasons)).toBe(true);
    expect(Array.isArray(report.prosecutionReasons)).toBe(true);
    expect(Array.isArray(report.aiMotives)).toBe(true);
    // Every AI family reports a posture + motive
    expect(report.aiMotives.length).toBe(hook.result.current.gameState.aiOpponents.length);
    for (const m of report.aiMotives) {
      expect(m.posture).toBeTruthy();
      expect(m.motive.length).toBeGreaterThan(0);
    }
  }, 120000);
});

// ───────────────────────────────────────────────────────────────────
// 9. Integration: Commission vote projection parity
// ───────────────────────────────────────────────────────────────────
describe('Commission vote projection parity', () => {
  it('the executed vote matches the pre-vote projection exactly', () => {
    const hook = renderHook(() => useEnhancedMafiaGameState('gambino', undefined, 'normal', 4242, 'small'));
    const clone = JSON.parse(JSON.stringify(hook.result.current.gameState));
    clone.gamePhase = 4;
    clone.resources.money = 200000;
    clone.actionsRemaining = 3;
    clone.commissionVoteCooldownUntil = 0;
    clone.treacheryDebuff = null;
    clone.qualifyingConditions = [];
    // Mixed landscape: two YES-leaning (relationship + ceasefire), rest NO
    const fams = clone.aiOpponents.map((o: any) => o.family);
    clone.reputation.familyRelationships[fams[0]] = 70;
    clone.reputation.familyRelationships[fams[1]] = 65;
    clone.reputation.familyRelationships[fams[2]] = 10;
    if (fams[3]) clone.reputation.familyRelationships[fams[3]] = -20;
    clone.ceasefires = [
      { id: 'cf1', family: fams[0], turnsRemaining: 5, turnFormed: 1, active: true },
      { id: 'cf2', family: fams[1], turnsRemaining: 5, turnFormed: 1, active: true },
    ];

    const projection = computeCommissionVoteProjection(clone);
    expect(projection.ok).toBe(true);

    act(() => hook.result.current.loadGameState(clone));
    act(() => hook.result.current.performAction({ type: 'commission_vote' }));

    const result: any = (hook.result.current.gameState as any).commissionVoteResult;
    expect(result).toBeTruthy();
    expect(result.isPlayerCaller).toBe(true);
    expect(result.yesVotes).toBe(projection.yesVotes);
    expect(result.needed).toBe(projection.needed);
    expect(result.won).toBe(projection.wouldWin);
    // Per-family votes line up too
    for (const v of projection.votes) {
      const actual = result.voteResults.find((r: any) => r.family === v.family);
      expect(actual?.vote).toBe(v.vote);
    }
  }, 120000);
});
