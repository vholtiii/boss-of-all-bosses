import { describe, it, expect } from 'vitest';
import { computeProsperity, computeAmbienceMix, NEUTRAL_AMBIENCE } from '../ambience-state';

describe('computeProsperity', () => {
  it('is low when broke and holding little turf', () => {
    const p = computeProsperity({ playerHexes: 1, totalClaimedHexes: 40, netIncome: -3000, money: 400 });
    expect(p).toBeLessThan(0.2);
  });

  it('is high when dominant and earning', () => {
    const p = computeProsperity({ playerHexes: 30, totalClaimedHexes: 45, netIncome: 12000, money: 90000 });
    expect(p).toBeGreaterThan(0.9);
  });

  it('penalises being flat broke even with turf', () => {
    const rich = computeProsperity({ playerHexes: 20, totalClaimedHexes: 40, netIncome: 2000, money: 50000 });
    const broke = computeProsperity({ playerHexes: 20, totalClaimedHexes: 40, netIncome: 2000, money: 200 });
    expect(broke).toBeLessThan(rich);
  });
});

describe('computeAmbienceMix', () => {
  it('scales sirens with heat', () => {
    const cool = computeAmbienceMix({ ...NEUTRAL_AMBIENCE, heat: 0 });
    const hot = computeAmbienceMix({ ...NEUTRAL_AMBIENCE, heat: 100 });
    expect(hot.siren).toBeGreaterThan(cool.siren);
    expect(hot.sirenGapMs).toBeLessThan(cool.sirenGapMs);
  });

  it('adds a police throb only at critical heat or during RICO', () => {
    expect(computeAmbienceMix({ ...NEUTRAL_AMBIENCE, heat: 30 }).policePulse).toBe(0);
    expect(computeAmbienceMix({ ...NEUTRAL_AMBIENCE, heat: 85 }).policePulse).toBeGreaterThan(0);
    expect(computeAmbienceMix({ ...NEUTRAL_AMBIENCE, ricoActive: true }).policePulse).toBeGreaterThan(0);
  });

  it('is silent on gunfire in peacetime and audible at war', () => {
    expect(computeAmbienceMix({ ...NEUTRAL_AMBIENCE }).gunfire).toBe(0);
    expect(computeAmbienceMix({ ...NEUTRAL_AMBIENCE }).gunfireGapMs).toBe(Infinity);
    const war = computeAmbienceMix({ ...NEUTRAL_AMBIENCE, atWar: true });
    expect(war.gunfire).toBeGreaterThan(0);
    expect(Number.isFinite(war.gunfireGapMs)).toBe(true);
  });

  it('trades wind for crowd murmur as prosperity rises', () => {
    const poor = computeAmbienceMix({ ...NEUTRAL_AMBIENCE, prosperity: 0 });
    const rich = computeAmbienceMix({ ...NEUTRAL_AMBIENCE, prosperity: 1 });
    expect(poor.wind).toBeGreaterThan(rich.wind);
    expect(rich.crowd).toBeGreaterThan(poor.crowd);
  });

  it('grows city density with the progression phase', () => {
    const early = computeAmbienceMix({ ...NEUTRAL_AMBIENCE, phase: 1 });
    const late = computeAmbienceMix({ ...NEUTRAL_AMBIENCE, phase: 4 });
    expect(late.rumble).toBeGreaterThan(early.rumble);
    expect(late.hiss).toBeGreaterThan(early.hiss);
  });
});
