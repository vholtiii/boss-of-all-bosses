import { describe, it, expect } from 'vitest';
import type { IncomingSitdown } from '@/types/game-mechanics';

// Lightweight contract tests for D1 — verifies the IncomingSitdown shape supports
// territory-scope fields and the acceptance routing decision logic.
describe('D1 — AI territory sitdowns', () => {
  it('IncomingSitdown supports territory-scope fields', () => {
    const s: IncomingSitdown = {
      id: 'sitdown-test-1',
      fromFamily: 'genovese',
      proposedDeal: 'bribe_territory',
      turnRequested: 5,
      expiresOnTurn: 7,
      successBonus: 15,
      scope: 'territory',
      targetQ: 1, targetR: -2, targetS: 1,
      fromCapoId: 'capo-1',
      fromCapoName: 'Vito',
      fromCapoPersonality: 'enforcer',
      proposedAmount: 12000,
    };
    expect(s.scope).toBe('territory');
    expect(s.proposedAmount).toBe(12000);
    expect(s.proposedDeal).toBe('bribe_territory');
  });

  it('routes territory-scope to negotiate, family-scope to boss_negotiate', () => {
    const territory: IncomingSitdown = {
      id: 't', fromFamily: 'gambino', proposedDeal: 'share_profits',
      turnRequested: 1, expiresOnTurn: 3, successBonus: 15,
      scope: 'territory', targetQ: 0, targetR: 0, targetS: 0, proposedAmount: 3000,
    };
    const family: IncomingSitdown = {
      id: 'f', fromFamily: 'gambino', proposedDeal: 'ceasefire',
      turnRequested: 1, expiresOnTurn: 3, successBonus: 15,
    };
    const route = (s: IncomingSitdown) =>
      s.scope === 'territory' && s.targetQ !== undefined ? 'negotiate' : 'boss_negotiate';
    expect(route(territory)).toBe('negotiate');
    expect(route(family)).toBe('boss_negotiate');
  });
});
