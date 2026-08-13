import { describe, it, expect } from 'vitest';
import { analyzeSetbacks, analyzeMissedOpportunities } from '@/lib/game-analysis';
import type { EnhancedMafiaGameState } from '@/hooks/useEnhancedMafiaGameState';

const baseState = (over: Partial<EnhancedMafiaGameState> = {}): EnhancedMafiaGameState =>
  ({
    playerFamily: 'gambino',
    turn: 10,
    resources: { money: 5000, respect: 40, soldiers: 3, influence: 10, politicalPower: 0, loyalty: 60, researchPoints: 0 },
    hexMap: [],
    deployedUnits: [],
    soldierStats: {},
    alertsLog: [],
    arrestedCapos: [],
    arrestedSoldiers: [],
    activeBribes: [],
    policeHeat: { level: 20, reductionPerTurn: 0, bribedOfficials: [], arrests: [], rattingRisk: 0 },
    businessSupplyStatus: {},
    scoutedHexes: [],
    fortifiedHexes: [],
    copFlippedSoldiers: [],
    wiretaps: [],
    actionsRemaining: 0,
    maxActions: 3,
    turnPhase: 'action',
    ricoTimer: 0,
    prosecutionTimer: 0,
    turnReport: null,
    turnReportHistory: [],
    ...over,
  }) as unknown as EnhancedMafiaGameState;

describe('game analysis — setbacks', () => {
  it('explains a negative treasury with the largest drain named', () => {
    const state = baseState({
      resources: { money: -1200, respect: 40, soldiers: 3, influence: 10, politicalPower: 0, loyalty: 60, researchPoints: 0 },
      turnReportHistory: [
        {
          turn: 10,
          income: 1000,
          maintenance: 4000,
          netIncome: -3000,
          aiActions: [],
          events: [],
          resourceDeltas: { money: -3000, soldiers: 0, respect: 0, influence: 0, loyalty: 0, heat: 0, territories: 0 },
          territoriesLost: [],
          territoriesGained: [],
          incomeBreakdown: {
            legalGross: 200,
            illegalGross: 800,
            shareProfits: 0,
            penalties: [{ label: 'Informant drag', amount: 200 }],
            expenses: [{ label: 'Soldier upkeep', amount: 3800 }],
            net: -3000,
          },
        } as any,
      ],
    });
    const findings = analyzeSetbacks(state);
    const moneyFinding = findings.find(f => f.id === 'money-10');
    expect(moneyFinding).toBeTruthy();
    expect(moneyFinding!.severity).toBe('critical');
    expect(moneyFinding!.causes.join(' ')).toContain('Soldier upkeep');
    expect(moneyFinding!.advice.toLowerCase()).toContain('upkeep');
  });

  it('traces a capo arrest back to heat and missing protection', () => {
    const state = baseState({
      policeHeat: { level: 78, reductionPerTurn: 0, bribedOfficials: [], arrests: [], rattingRisk: 0 } as any,
      arrestedCapos: [{ unitId: 'c1', returnTurn: 14, arrestTurn: 9, name: 'Sal', family: 'gambino' }] as any,
      alertsLog: [
        { id: 'a1', turn: 8, type: 'error', category: 'combat', title: '🔫 Blind Hit Failed', message: '', read: true, timestamp: 1 },
      ] as any,
    });
    const f = analyzeSetbacks(state).find(x => x.title.includes('Sal'));
    expect(f).toBeTruthy();
    expect(f!.causes.join(' ')).toContain('78');
    expect(f!.causes.join(' ')).toContain('No bribe was active');
    expect(f!.causes.join(' ')).toContain('No lawyer');
  });

  it('explains a lost block as erosion when nobody was on it', () => {
    const state = baseState({
      turnReportHistory: [
        {
          turn: 10,
          income: 0, maintenance: 0, netIncome: 0, aiActions: [], events: [],
          resourceDeltas: { money: 0, soldiers: 0, respect: 0, influence: 0, loyalty: 0, heat: 0, territories: -1 },
          territoriesLost: ['1,0,-1'], territoriesGained: [],
          territoryChanges: [
            { hex: '1,0,-1', district: 'Bronx', change: 'lost', from: 'gambino', to: 'neutral', cause: 'Influence eroded' },
          ],
        } as any,
      ],
    });
    const f = analyzeSetbacks(state).find(x => x.id === 'terr-10-1,0,-1');
    expect(f).toBeTruthy();
    expect(f!.causes.join(' ')).toContain('eroded away');
    expect(f!.causes.join(' ')).toContain('Nobody was standing on it');
    expect(f!.hexRef).toEqual({ q: 1, r: 0, s: -1 });
  });
});

describe('game analysis — missed opportunities', () => {
  it('flags unspent actions and un-extorted rackets on your ground', () => {
    const state = baseState({
      actionsRemaining: 2,
      hexMap: [
        {
          q: 0, r: 0, s: 0, district: 'Brooklyn', terrain: 'urban', controllingFamily: 'gambino',
          anchor: { type: 'store_front', name: 'Vito\'s Deli', tribute: 900, heatLevel: 1, buyoutCost: 4000, isLegal: true, launderingCapacity: 0 },
        } as any,
      ],
    });
    const ops = analyzeMissedOpportunities(state);
    expect(ops.some(o => o.id.startsWith('actions-'))).toBe(true);
    const anchor = ops.find(o => o.id.startsWith('anchor-extort-'));
    expect(anchor).toBeTruthy();
    expect(anchor!.causes.join(' ')).toContain('$900');
  });

  it('flags an unattended construction site with the speed cost', () => {
    const state = baseState({
      hexMap: [
        {
          q: 2, r: -1, s: -1, district: 'Queens', terrain: 'urban', controllingFamily: 'gambino',
          build: { type: 'store_front', tier: 1, monthsRemaining: 1 },
        } as any,
      ],
    });
    const f = analyzeMissedOpportunities(state).find(o => o.id.startsWith('stalled-'));
    expect(f).toBeTruthy();
    expect(f!.advice.toLowerCase()).toContain('capo');
  });
});
