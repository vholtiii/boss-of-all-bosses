import { describe, it, expect } from 'vitest';
import {
  valueChip, basketValue, computeLeverage, evaluateBasket, aiCounterCash,
  settleBasket, newChip, greedMultiplier,
} from '@/lib/sitdown-valuation';
import type { LeverageInput } from '@/lib/sitdown-valuation';
import { Basket } from '@/types/negotiation';
import { getStandingAgreements } from '@/lib/standing-agreements';

const baseInput: LeverageInput = { scope: 'territory', respect: 40, influence: 20, fear: 0, tension: 30 };

const basket = (...chips: any[]): Basket => ({ chips: chips.map(c => newChip(c)) });

describe('chip valuation', () => {
  it('prices cash at face value', () => {
    expect(valueChip(newChip({ kind: 'cash', from: 'player', amount: 7500 }))).toBe(7500);
  });

  it('scales tribute by income, share and duration', () => {
    const chip = newChip({ kind: 'tribute', from: 'them', pct: 0.3, turns: 5, hexIncome: 1000 });
    expect(valueChip(chip)).toBe(1500);
  });

  it('sums per side independently', () => {
    const b = basket(
      { kind: 'cash', from: 'player', amount: 5000 },
      { kind: 'cash', from: 'player', amount: 2000 },
      { kind: 'safe_passage', from: 'them', turns: 3 },
    );
    expect(basketValue(b, 'player')).toBe(7000);
    expect(basketValue(b, 'them')).toBe(3600);
  });
});

describe('leverage', () => {
  it('rewards force advantage and punishes treachery', () => {
    const strong = computeLeverage({ ...baseInput, playerForce: 3, enemyForce: 0 });
    const rat = computeLeverage({ ...baseInput, playerForce: 3, enemyForce: 0, treacheryActive: true });
    expect(strong.total).toBeGreaterThan(rat.total);
    expect(rat.lines.some(l => l.label === 'Your treachery')).toBe(true);
  });

  it('clamps to +/-60', () => {
    const huge = computeLeverage({
      scope: 'territory', playerForce: 9, enemyForce: 0, respect: 100, influence: 100,
      fear: 100, relationship: 100, tension: 0, theyOweFavor: true, theyAskedForThis: true,
      theyAreDesperate: true, capoPersonality: 'diplomat',
    });
    expect(huge.total).toBeLessThanOrEqual(60);
    expect(huge.total).toBeGreaterThan(40);
  });

  it('every line is labeled for display', () => {
    const r = computeLeverage({ ...baseInput, playerForce: 2, enemyForce: 1, atWar: true });
    expect(r.lines.length).toBeGreaterThan(0);
    r.lines.forEach(l => expect(l.label.length).toBeGreaterThan(0));
  });
});

describe('verdict', () => {
  const lev = computeLeverage({ scope: 'family', respect: 0, influence: 0, tension: 30 });

  it('is insulted by a lowball', () => {
    const b = basket(
      { kind: 'safe_passage', from: 'them', turns: 3 },
      { kind: 'cash', from: 'player', amount: 500 },
    );
    const v = evaluateBasket(b, lev, { scope: 'family' });
    expect(v.level).toBe('insulted');
    expect(v.accepts).toBe(false);
  });

  it('accepts a fair basket', () => {
    const b = basket(
      { kind: 'safe_passage', from: 'them', turns: 3 },
      { kind: 'cash', from: 'player', amount: 3600 },
    );
    const v = evaluateBasket(b, lev, { scope: 'family' });
    expect(v.accepts).toBe(true);
  });

  it('reports nothing on the table when they give nothing', () => {
    const v = evaluateBasket(basket({ kind: 'cash', from: 'player', amount: 9000 }), lev, { scope: 'family' });
    expect(v.accepts).toBe(false);
    expect(v.label).toMatch(/Nothing/);
  });

  it('is deterministic — same inputs, same verdict', () => {
    const b = basket(
      { kind: 'territory', from: 'them', hexIncome: 800 },
      { kind: 'cash', from: 'player', amount: 9000 },
    );
    const a1 = evaluateBasket(b, lev, baseInput);
    const a2 = evaluateBasket(b, lev, baseInput);
    expect(a1).toEqual(a2);
  });

  it('leverage makes the same cash go further', () => {
    const b = basket(
      { kind: 'ceasefire', from: 'them', turns: 4 },
      { kind: 'cash', from: 'player', amount: 7000 },
    );
    const weak = evaluateBasket(b, computeLeverage({ scope: 'family' }), { scope: 'family' });
    const strong = evaluateBasket(b, computeLeverage({ scope: 'family', respect: 100, fear: 100, influence: 100 }), { scope: 'family' });
    expect(strong.ratio).toBeGreaterThan(weak.ratio);
  });
});

describe('greed', () => {
  it('desperate rivals ask for less, warring rivals ask for more', () => {
    expect(greedMultiplier({ scope: 'family', theyAreDesperate: true }))
      .toBeLessThan(greedMultiplier({ scope: 'family', atWar: true }));
  });
});

describe('counter offer', () => {
  it('names a number that would actually close the deal', () => {
    const b = basket(
      { kind: 'supply_access', from: 'them', turns: 5 },
      { kind: 'cash', from: 'player', amount: 1000 },
    );
    const lev = computeLeverage({ scope: 'family', respect: 30 });
    const cash = aiCounterCash(b, lev, { scope: 'family', respect: 30 });
    const closed: Basket = {
      chips: [
        ...b.chips.filter(c => !(c.from === 'player' && c.kind === 'cash')),
        newChip({ kind: 'cash', from: 'player', amount: cash }),
      ],
    };
    expect(evaluateBasket(closed, lev, { scope: 'family', respect: 30 }).accepts).toBe(true);
  });
});

describe('legacy settlement bridge', () => {
  it('maps the biggest ask to a deal type and sums player cash', () => {
    const b = basket(
      { kind: 'territory', from: 'them', hex: { q: 1, r: 0, s: -1 } },
      { kind: 'safe_passage', from: 'them', turns: 3 },
      { kind: 'cash', from: 'player', amount: 4000 },
      { kind: 'cash', from: 'player', amount: 2000 },
    );
    const s = settleBasket(b);
    expect(s.dealType).toBe('bribe_territory');
    expect(s.cash).toBe(6000);
  });

  it('tracks favor and intel direction', () => {
    const s = settleBasket(basket(
      { kind: 'ceasefire', from: 'them', turns: 3 },
      { kind: 'favor', from: 'player' },
      { kind: 'intel', from: 'them' },
    ));
    expect(s.dealType).toBe('ceasefire');
    expect(s.favorTo).toBe('them');
    expect(s.intelTo).toBe('player');
  });
});

describe('standing agreements', () => {
  it('surfaces live pacts with turns remaining', () => {
    const agreements = getStandingAgreements({
      playerFamily: 'gambino',
      ceasefires: [{ id: 'c1', family: 'genovese', active: true, turnsRemaining: 3 }],
      shareProfitsPacts: [{ id: 's1', targetFamily: 'lucchese', active: true, turnsRemaining: 5, hexQ: 1, hexR: 2, hexS: -3, incomeShare: 0.3 }],
      hexMap: [{ q: 1, r: 2, s: -3, anchor: { tribute: 1000 } }],
      owedFavors: [{ id: 'f1', family: 'bonanno', direction: 'they_owe', turnsRemaining: 8 }],
    });
    expect(agreements).toHaveLength(3);
    expect(agreements[0].turnsRemaining).toBe(3);
    expect(agreements.find(a => a.kind === 'share_profits')?.perTurn).toBe(300);
  });

  it('hides expired pacts', () => {
    expect(getStandingAgreements({
      ceasefires: [{ id: 'c1', family: 'x', active: false, turnsRemaining: 0 }],
    })).toHaveLength(0);
  });
});
