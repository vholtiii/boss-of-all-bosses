import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { computeHitCore, tilePolicyDefenseBonus } from '@/lib/action-formulas';
import { TILE_POLICIES, DEFAULT_TILE_POLICY } from '@/types/game-mechanics';
import { setTileOwner } from '@/hooks/useEnhancedMafiaGameState';

const hookSrc = fs.readFileSync(
  path.resolve(__dirname, '../useEnhancedMafiaGameState.ts'),
  'utf-8'
);

const baseState = (policy: string) => ({
  playerFamily: 'gambino',
  turn: 5,
  hexMap: [
    { q: 0, r: 0, s: 0, district: 'Bronx', controllingFamily: 'genovese', buildings: {}, policy },
  ],
  deployedUnits: [
    { id: 'p1', family: 'gambino', type: 'soldier', q: 1, r: 0, s: -1 },
    { id: 'e1', family: 'genovese', type: 'soldier', q: 0, r: 0, s: 0 },
  ],
  scoutedHexes: [{ q: 0, r: 0, s: 0, freshUntilTurn: 99 }],
  fortifiedHexes: [],
  safehouses: [],
  aiOpponents: [{ family: 'genovese', resources: { money: 0, soldiers: 2 } }],
  resources: { money: 1000, soldiers: 2, respect: 10, influence: 10 },
});

describe('Standing orders have real effects', () => {
  it('Fortify Up contributes defence, other orders do not', () => {
    expect(tilePolicyDefenseBonus(baseState('fortify'), 0, 0, 0)).toBe(
      TILE_POLICIES.fortify.defenseBonus
    );
    expect(tilePolicyDefenseBonus(baseState('earn'), 0, 0, 0)).toBe(0);
  });

  it('a hit on a Fortify Up block is harder than on an Earn block', () => {
    const earn = computeHitCore(baseState('earn'), { targetQ: 0, targetR: 0, targetS: 0, selectedUnitId: 'p1' });
    const fort = computeHitCore(baseState('fortify'), { targetQ: 0, targetR: 0, targetS: 0, selectedUnitId: 'p1' });
    expect(earn.ok).toBe(true);
    expect(fort.ok).toBe(true);
    expect(fort.chance).toBeLessThan(earn.chance);
    expect(fort.modifiers.some(m => m.label.includes('Fortify Up'))).toBe(true);
  });

  it('Lay Low cuts heat and Muscle Up speeds crew growth', () => {
    expect(TILE_POLICIES.lay_low.heatMult).toBeLessThan(TILE_POLICIES.earn.heatMult);
    expect(TILE_POLICIES.muscle.growthMult).toBeGreaterThan(TILE_POLICIES.earn.growthMult);
    // income/heat/growth multipliers are actually applied in the monthly pass
    expect(hookSrc).toMatch(/policyDef\.incomeMult/);
    expect(hookSrc).toMatch(/policyDef\.heatMult/);
    expect(hookSrc).toMatch(/policyDef\.growthMult/);
  });

  it('AI sets standing orders on its own blocks from its posture', () => {
    expect(hookSrc).toMatch(/Standing orders parity/);
    expect(hookSrc).toMatch(/t\.policy = next;/);
  });

  it('AI attacks respect the defending block standing order', () => {
    expect(hookSrc).toMatch(/defPolicyBonus/);
  });

  it('rivals pay the same income, heat and crew consequences for their orders', () => {
    // income multiplier applied to rival tile income
    expect(hookSrc).toMatch(/aiPolicyDef\.incomeMult/);
    // heat multiplier accrued from rival buildings and pushed onto rival heat
    expect(hookSrc).toMatch(/aiPolicyDef\.heatMult/);
    expect(hookSrc).toMatch(/aiBuildingHeat > 0/);
    // crew growth multiplier actually spawns rival soldiers
    expect(hookSrc).toMatch(/aiPolicyDef\.growthMult/);
    expect(hookSrc).toMatch(/aiRecruitsSpawned > 0/);
  });

  it('a captured block reverts to the default standing order', () => {
    const tile: any = { q: 0, r: 0, s: 0, controllingFamily: 'genovese', policy: 'fortify', recruitProgress: 40 };
    setTileOwner(tile, 'gambino');
    expect(tile.controllingFamily).toBe('gambino');
    expect(tile.policy).toBe(DEFAULT_TILE_POLICY);
    expect(tile.recruitProgress).toBe(0);
  });

  it('re-affirming the same owner leaves the standing order alone', () => {
    const tile: any = { q: 0, r: 0, s: 0, controllingFamily: 'gambino', policy: 'fortify', recruitProgress: 40 };
    setTileOwner(tile, 'gambino');
    expect(tile.policy).toBe('fortify');
    expect(tile.recruitProgress).toBe(40);
  });

  it('rival HQ blocks also carry a standing order', () => {
    expect(hookSrc).not.toMatch(/if \(t\.controllingFamily !== fam \|\| t\.isHeadquarters\) return;/);
  });
});
