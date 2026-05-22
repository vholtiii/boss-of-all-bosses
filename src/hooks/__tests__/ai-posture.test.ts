import { describe, it, expect } from 'vitest';
import { computeAIPosture, posturePolicy, rankByTerritory, type PostureInputs } from '@/lib/ai-posture';

const baseInputs: PostureInputs = {
  aiPhase: 2,
  heatTier: 'cool',
  myHexes: 10,
  rivalHexCounts: [10, 10, 10, 10],
  myRank: 3,
  moneyRunway: 10,
  atWar: false,
  recentCapoLosses: 0,
  hqAssaultedRecently: false,
  victoryGap: 30,
  basePersonality: 'opportunistic',
  dynamicMood: 'neutral',
  strategicOverride: false,
};

describe('computeAIPosture', () => {
  it('COOL_OFF when heat is critical and no override', () => {
    expect(computeAIPosture({ ...baseInputs, heatTier: 'critical' })).toBe('COOL_OFF');
    expect(computeAIPosture({ ...baseInputs, heatTier: 'rico' })).toBe('COOL_OFF');
  });

  it('strategicOverride bypasses COOL_OFF even at critical heat', () => {
    expect(computeAIPosture({ ...baseInputs, heatTier: 'critical', strategicOverride: true, atWar: true }))
      .not.toBe('COOL_OFF');
  });

  it('CONSOLIDATE when cash runway < 3 turns', () => {
    expect(computeAIPosture({ ...baseInputs, moneyRunway: 2 })).toBe('CONSOLIDATE');
  });

  it('TURTLE after HQ assault or 2+ capo losses', () => {
    expect(computeAIPosture({ ...baseInputs, hqAssaultedRecently: true })).toBe('TURTLE');
    expect(computeAIPosture({ ...baseInputs, recentCapoLosses: 2 })).toBe('TURTLE');
  });

  it('WAR overrides default expansion when at war', () => {
    expect(computeAIPosture({ ...baseInputs, atWar: true })).toBe('WAR');
  });

  it('CLOSE_OUT in Phase 4 within 3 hexes of victory', () => {
    expect(computeAIPosture({ ...baseInputs, aiPhase: 4, victoryGap: 2 })).toBe('CLOSE_OUT');
  });

  it('PRESSURE_LEADER in Phase 3+ when ranked #1', () => {
    expect(computeAIPosture({ ...baseInputs, aiPhase: 3, myRank: 1 })).toBe('PRESSURE_LEADER');
  });

  it('EXPAND in Phase 2+ with cool heat and healthy treasury', () => {
    expect(computeAIPosture({ ...baseInputs, aiPhase: 2, heatTier: 'cool', moneyRunway: 10 })).toBe('EXPAND');
  });

  it('EXPAND in Phase 1 with cool heat and healthy treasury (early-game growth)', () => {
    expect(computeAIPosture({ ...baseInputs, aiPhase: 1, heatTier: 'cool', moneyRunway: 10 })).toBe('EXPAND');
  });

  it('BUILD_ECONOMY when runway is tight (cannot afford to expand)', () => {
    expect(computeAIPosture({ ...baseInputs, aiPhase: 1, heatTier: 'cool', moneyRunway: 3.5 })).toBe('BUILD_ECONOMY');
  });

  it('BUILD_ECONOMY when warm heat blocks EXPAND', () => {
    expect(computeAIPosture({ ...baseInputs, aiPhase: 2, heatTier: 'warm' })).toBe('BUILD_ECONOMY');
  });
});

describe('posturePolicy', () => {
  it('COOL_OFF suppresses offense and forces bribe', () => {
    const p = posturePolicy('COOL_OFF');
    expect(p.suppressOffense).toBe(true);
    expect(p.forceBribe).toBe(true);
    expect(p.preferLayLow).toBe(true);
  });

  it('EXPAND has a heat ceiling that prevents runaway offense', () => {
    expect(posturePolicy('EXPAND').heatCeiling).toBeLessThanOrEqual(50);
  });

  it('BUILD_ECONOMY allows expansion and defense but stays low-risk', () => {
    const p = posturePolicy('BUILD_ECONOMY');
    expect(p.suppressExpansion).toBe(false);
    expect(p.suppressOffense).toBe(false);
    expect(p.economyFocusMul).toBeGreaterThan(1);
  });

  it('WAR allows higher heat and weights war targets', () => {
    const p = posturePolicy('WAR');
    expect(p.heatCeiling).toBeGreaterThanOrEqual(70);
    expect(p.warTargetMul).toBeGreaterThan(1);
  });
});

describe('rankByTerritory', () => {
  it('returns 1 when leader', () => {
    expect(rankByTerritory(20, [10, 15, 5])).toBe(1);
  });
  it('returns last rank when smallest', () => {
    expect(rankByTerritory(3, [10, 15, 5])).toBe(4);
  });
});
