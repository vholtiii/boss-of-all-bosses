import { describe, it, expect } from 'vitest';
import { scoreHexForAI, familySignaturePreference, type ScoreHexInputs } from '@/lib/ai-strategy';
import {
  getAggressionScale, getHQAssaultBase, getPlanHitBase, getHitmanChance,
  getSupplyNodeScoreBonus, getSupplyNodeRoutingChance, getSupplyStrikeRadius,
} from '@/lib/ai-difficulty';
import { posturePolicy } from '@/lib/ai-posture';

const baseHex: ScoreHexInputs = {
  hexIncome: 0,
  defenderCount: 1,
  isInFocusDistrict: false,
  distanceToOwnHQ: 3,
  isFortified: false,
  isSafehouse: false,
  hasScoutIntel: false,
  isWarTarget: false,
  isAdjacentToOwnTerritory: false,
  isPlayerHex: false,
  effectivePersonality: 'opportunistic',
  signaturePref: familySignaturePreference('gambino'),
  phase: 2,
  mood: 'neutral',
  jitter: 0,
  difficulty: 'normal',
};

describe('AI offensive aggression scaling', () => {
  it('Normal is more aggressive than Easy but less than Hard', () => {
    expect(getAggressionScale('easy')).toBeLessThan(getAggressionScale('normal'));
    expect(getAggressionScale('normal')).toBeLessThan(getAggressionScale('hard'));
  });

  it('Plan-hit base rises with difficulty', () => {
    expect(getPlanHitBase('easy')).toBeLessThan(getPlanHitBase('normal'));
    expect(getPlanHitBase('normal')).toBeLessThan(getPlanHitBase('hard'));
  });

  it('HQ-assault base is now positive at all difficulties (was -0.15 effective)', () => {
    expect(getHQAssaultBase('easy')).toBeGreaterThan(0);
    expect(getHQAssaultBase('normal')).toBeGreaterThanOrEqual(0.28);
    expect(getHQAssaultBase('hard')).toBeGreaterThan(0.30);
  });

  it('Hitman chance is higher at war than in peace, at every difficulty', () => {
    for (const d of ['easy', 'normal', 'hard'] as const) {
      expect(getHitmanChance(d, false)).toBeLessThan(getHitmanChance(d, true));
    }
  });
});

describe('Supply-line strike radius scales with map size', () => {
  it('small map has shorter strike radius than large', () => {
    expect(getSupplyStrikeRadius('small')).toBeLessThan(getSupplyStrikeRadius('large'));
    expect(getSupplyStrikeRadius('medium')).toBe(5);
  });
});

describe('scoreHexForAI supply-node bonus', () => {
  it('reachable supply node gets a substantial scoring boost', () => {
    const baseline = scoreHexForAI(baseHex);
    const withSupply = scoreHexForAI({
      ...baseHex,
      isSupplyNodeTarget: true,
      supplyNodeMul: 1.5, // WAR posture
      supplyNodeBonus: getSupplyNodeScoreBonus('normal'),
    });
    expect(withSupply).toBeGreaterThan(baseline + 5);
  });

  it('COOL_OFF posture (supplyNodeMul=0) neutralizes the supply bonus', () => {
    const baseline = scoreHexForAI(baseHex);
    const withCoolOffSupply = scoreHexForAI({
      ...baseHex,
      isSupplyNodeTarget: true,
      supplyNodeMul: 0,
      supplyNodeBonus: 7,
    });
    expect(withCoolOffSupply).toBeCloseTo(baseline, 1);
  });

  it('supply node that feeds a player deal stacks extra bonus', () => {
    const a = scoreHexForAI({
      ...baseHex,
      isSupplyNodeTarget: true, supplyNodeMul: 1.0, supplyNodeBonus: 7,
    });
    const b = scoreHexForAI({
      ...baseHex,
      isSupplyNodeTarget: true, supplyNodeMul: 1.0, supplyNodeBonus: 7,
      supplyNodeFeedsPlayerDeal: true,
    });
    expect(b).toBeGreaterThan(a);
  });

  it('vulnerable-rival hex gets a pile-on bonus', () => {
    const baseline = scoreHexForAI(baseHex);
    const withVuln = scoreHexForAI({ ...baseHex, isVulnerableRivalHex: true });
    expect(withVuln).toBeGreaterThan(baseline);
  });
});

describe('posture policy supply-node multipliers', () => {
  it('WAR/PRESSURE_LEADER/CLOSE_OUT actively hunt supply nodes', () => {
    expect(posturePolicy('WAR').supplyNodeMul).toBeGreaterThanOrEqual(1.3);
    expect(posturePolicy('PRESSURE_LEADER').supplyNodeMul).toBeGreaterThanOrEqual(1.3);
    expect(posturePolicy('CLOSE_OUT').supplyNodeMul).toBeGreaterThanOrEqual(1.2);
  });

  it('COOL_OFF/CONSOLIDATE/TURTLE ignore supply nodes', () => {
    expect(posturePolicy('COOL_OFF').supplyNodeMul).toBe(0);
    expect(posturePolicy('CONSOLIDATE').supplyNodeMul).toBe(0);
    expect(posturePolicy('TURTLE').supplyNodeMul).toBe(0);
  });

  it('BUILD_ECONOMY no longer refuses new wars (was silently blocking plan hits)', () => {
    expect(posturePolicy('BUILD_ECONOMY').refuseNewWars).toBe(false);
  });
});

describe('Supply-node routing chance scales with difficulty', () => {
  it('higher difficulty routes more aggressively', () => {
    expect(getSupplyNodeRoutingChance('easy')).toBeLessThan(getSupplyNodeRoutingChance('normal'));
    expect(getSupplyNodeRoutingChance('normal')).toBeLessThan(getSupplyNodeRoutingChance('hard'));
  });
});
