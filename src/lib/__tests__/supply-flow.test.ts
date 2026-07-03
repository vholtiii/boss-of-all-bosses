import { describe, it, expect } from 'vitest';
import type { Safehouse } from '@/types/game-mechanics';
import { HQ_SUPPLY_CAPACITY } from '@/types/game-mechanics';
import {
  transferSafehouseUnitsToHq,
  seizeSafehouseStockpileToFamily,
  destroySafehouseWithTransfer,
  formatTransferSummary,
  hasTransferActivity,
  type SupplyFlowGameState,
} from '@/lib/supply-flow';

function makeSafehouse(stockpile: Partial<Record<string, number>> = {}): Safehouse {
  return {
    q: 0, r: 0, s: 0,
    turnsRemaining: 1,
    createdTurn: 1,
    stockpile: stockpile as Safehouse['stockpile'],
    allocationPercent: 0,
    connectedSupplyTypes: [],
    manualRouteEstablished: false,
  };
}

function makeState(overrides: Partial<SupplyFlowGameState> = {}): SupplyFlowGameState {
  return {
    turn: 1,
    playerFamily: 'gambino',
    hexMap: [{ q: 0, r: 0, s: 0, district: 'Bronx', controllingFamily: 'gambino' }],
    aiOpponents: [{ family: 'genovese' }],
    safehouses: [],
    pendingNotifications: [],
    reputation: { familyRelationships: {}, reputation: 50 },
    familyTensions: {},
    familySupplyStorage: [],
    ...overrides,
  };
}

describe('safehouse unit transfers', () => {
  it('expiry transfer moves units up to HQ capacity and reports overflow lost', () => {
    const state = makeState({
      familySupplyStorage: [{ family: 'gambino', nodeType: 'docks', hqUnits: 2 }],
    });
    const sh = makeSafehouse({ docks: 6 });

    const result = transferSafehouseUnitsToHq(state, sh, 'gambino');

    expect(result.docks).toEqual({ moved: 2, lost: 4 });
    expect(state.familySupplyStorage!.find(e => e.nodeType === 'docks')!.hqUnits).toBe(HQ_SUPPLY_CAPACITY);
    expect(sh.stockpile.docks).toBe(0);
  });

  it('capture seize respects captor HQ cap and clears safehouse stockpile', () => {
    const state = makeState({
      familySupplyStorage: [{ family: 'genovese', nodeType: 'docks', hqUnits: HQ_SUPPLY_CAPACITY }],
    });
    const sh = makeSafehouse({ docks: 3 });

    const result = seizeSafehouseStockpileToFamily(state, sh, 'genovese');

    expect(result.docks).toEqual({ moved: 0, lost: 3 });
    expect(state.familySupplyStorage!.find(e => e.family === 'genovese' && e.nodeType === 'docks')!.hqUnits)
      .toBe(HQ_SUPPLY_CAPACITY);
    expect(sh.stockpile.docks).toBe(0);
  });

  it('destroySafehouseWithTransfer expiry mode matches owner transfer', () => {
    const state = makeState();
    const sh = makeSafehouse({ food_market: 5 });

    const result = destroySafehouseWithTransfer(state, sh, 'expiry_to_owner', 'gambino');

    expect(result.food_market).toEqual({ moved: 4, lost: 1 });
    expect(sh.stockpile.food_market).toBe(0);
  });

  it('destroySafehouseWithTransfer capture mode seizes to captor', () => {
    const state = makeState({
      familySupplyStorage: [{ family: 'gambino', nodeType: 'union_hall', hqUnits: 1 }],
    });
    const sh = makeSafehouse({ union_hall: 2 });

    const result = destroySafehouseWithTransfer(state, sh, 'capture_to_captor', 'gambino');

    expect(result.union_hall).toEqual({ moved: 2, lost: 0 });
    expect(state.familySupplyStorage!.find(e => e.nodeType === 'union_hall')!.hqUnits).toBe(3);
  });

  it('formatTransferSummary describes moved and lost units', () => {
    const text = formatTransferSummary({
      docks: { moved: 2, lost: 4 },
      food_market: { moved: 1, lost: 0 },
    });
    expect(text).toContain('2 docks to HQ, 4 lost');
    expect(text).toContain('1 food market to HQ');
    expect(hasTransferActivity({ docks: { moved: 0, lost: 1 } })).toBe(true);
    expect(hasTransferActivity({})).toBe(false);
  });
});
