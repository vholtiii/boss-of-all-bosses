// Derives the player's live diplomatic agreements from existing pact state so
// signed deals stay visible after the sitdown ends.

import { StandingAgreement } from '@/types/negotiation';

interface PactState {
  playerFamily?: string;
  ceasefires?: any[];
  alliances?: any[];
  shareProfitsPacts?: any[];
  safePassagePacts?: any[];
  supplyDealPacts?: any[];
  hexMap?: any[];
  owedFavors?: any[];
}

const cap = (s: string) => (s || '').charAt(0).toUpperCase() + (s || '').slice(1);

export function getStandingAgreements(state: PactState): StandingAgreement[] {
  const out: StandingAgreement[] = [];

  (state.ceasefires || []).filter(c => c.active && c.turnsRemaining > 0).forEach(c => {
    out.push({
      id: c.id, kind: 'ceasefire', family: c.family, label: `Ceasefire · ${cap(c.family)}`,
      icon: '🤝', turnsRemaining: c.turnsRemaining, detail: 'Neither side attacks',
    });
  });

  (state.alliances || []).filter(a => a.active && a.turnsRemaining > 0).forEach(a => {
    const cond = a.conditions?.[0]?.type?.replace(/_/g, ' ');
    out.push({
      id: a.id, kind: 'alliance', family: a.alliedFamily, label: `Alliance · ${cap(a.alliedFamily)}`,
      icon: '⚖️', turnsRemaining: a.turnsRemaining, detail: cond ? `Condition: ${cond}` : undefined,
    });
  });

  (state.shareProfitsPacts || []).filter(p => p.active && p.turnsRemaining > 0).forEach(p => {
    const tile = (state.hexMap || []).find((t: any) => t.q === p.hexQ && t.r === p.hexR && t.s === p.hexS);
    const income = tile?.anchor?.tribute || 0;
    out.push({
      id: p.id, kind: 'share_profits', family: p.targetFamily,
      label: `Tribute · ${cap(p.targetFamily)}`, icon: '💰', turnsRemaining: p.turnsRemaining,
      detail: `${Math.round((p.incomeShare || 0) * 100)}% of block (${p.hexQ}, ${p.hexR})`,
      perTurn: Math.round(income * (p.incomeShare || 0)),
    });
  });

  (state.safePassagePacts || []).filter(p => p.active && p.turnsRemaining > 0).forEach(p => {
    out.push({
      id: p.id, kind: 'safe_passage', family: p.targetFamily,
      label: `Safe Passage · ${cap(p.targetFamily)}`, icon: '🛤️', turnsRemaining: p.turnsRemaining,
      detail: 'Move through their turf freely',
    });
  });

  (state.supplyDealPacts || []).filter(p => p.active && p.turnsRemaining > 0).forEach(p => {
    const playerIsBuyer = p.buyerFamily === state.playerFamily;
    const other = playerIsBuyer ? p.targetFamily : p.buyerFamily;
    out.push({
      id: p.id, kind: 'supply_access', family: other,
      label: `Supply ${playerIsBuyer ? 'Access' : 'Sold'} · ${cap(other)}`, icon: '🚚',
      turnsRemaining: p.turnsRemaining,
      detail: playerIsBuyer ? 'You ride their network' : 'They ride yours',
    });
  });

  (state.owedFavors || []).filter((f: any) => f.turnsRemaining > 0).forEach((f: any) => {
    out.push({
      id: f.id, kind: 'favor', family: f.family,
      label: f.direction === 'they_owe' ? `Favor owed by ${cap(f.family)}` : `You owe ${cap(f.family)}`,
      icon: '🎩', turnsRemaining: f.turnsRemaining,
      detail: f.direction === 'they_owe' ? 'Call it in at the table (+25 leverage)' : 'They can call it in',
    });
  });

  return out.sort((a, b) => a.turnsRemaining - b.turnsRemaining);
}
