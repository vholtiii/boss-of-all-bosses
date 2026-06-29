/**
 * Pending Actions — derives a priority-ordered queue of "things the player
 * should look at before ending the turn", driving the SmartEndTurnButton.
 *
 * Pure function of game state. No mutations. No new mechanics.
 */
import { isCapoPromotionEligible } from '@/types/game-mechanics';
import { getThreatSignals, type ThreatSignal } from './ai-threat-signals';

export type PendingKind =
  | 'incoming_sitdown'
  | 'ready_sitdown'
  | 'capo_promote'
  | 'unit_orders'
  | 'threat';

export interface PendingItem {
  kind: PendingKind;
  /** Short label shown on the button when this item is the top of the queue. */
  label: string;
  /** Tooltip / detail line. */
  detail: string;
  /** Optional jump target — a hex on the map. */
  hex?: { q: number; r: number; s: number };
  /** Optional unit selection target. */
  unit?: { id: string; type: 'soldier' | 'capo'; q: number; r: number; s: number };
  /** Optional family color hint for the badge. */
  family?: string;
}

/** Priority order — earlier kinds outrank later ones. */
const PRIORITY: PendingKind[] = [
  'incoming_sitdown',
  'ready_sitdown',
  'capo_promote',
  'threat',
  'unit_orders',
];

/**
 * Returns the full queue, ordered by priority then internal recency/severity.
 * The SmartEndTurnButton uses queue[0] as the current "needs attention" state;
 * spacebar / shift-click cycles through.
 */
export function derivePendingActions(gameState: any): PendingItem[] {
  if (!gameState) return [];
  const playerFamily: string = gameState.playerFamily;
  const out: PendingItem[] = [];

  // 1. Incoming sitdowns (AI is asking you something)
  const incoming = (gameState.incomingSitdowns || []) as any[];
  for (const s of incoming) {
    out.push({
      kind: 'incoming_sitdown',
      label: 'INCOMING SITDOWN',
      detail: `${cap(s.fromFamily)} is offering a sitdown — review before it expires`,
      family: s.fromFamily,
      hex:
        typeof s.targetQ === 'number'
          ? { q: s.targetQ, r: s.targetR, s: s.targetS }
          : undefined,
    });
  }

  // 2. Ready outgoing sitdowns (AI replied, ready to open)
  const pending = (gameState.pendingNegotiations || []) as any[];
  for (const p of pending.filter((x) => x.ready)) {
    out.push({
      kind: 'ready_sitdown',
      label: 'SITDOWN READY',
      detail: `${cap(p.withFamily || p.targetFamily || 'rival')} replied — open the sitdown`,
      family: p.withFamily || p.targetFamily,
    });
  }

  // 3. Capos ready to promote
  const units = (gameState.deployedUnits || []) as any[];
  const stats = gameState.soldierStats || {};
  for (const u of units) {
    if (u.family !== playerFamily) continue;
    if (u.type !== 'soldier') continue;
    if (u.pendingPromotion) continue;
    const s = stats[u.id];
    if (!s) continue;
    if (!isCapoPromotionEligible(s)) continue;
    out.push({
      kind: 'capo_promote',
      label: 'PROMOTE A CAPO',
      detail: `A soldier is eligible for promotion to capo`,
      unit: { id: u.id, type: 'soldier', q: u.q, r: u.r, s: u.s },
    });
    if (out.filter((x) => x.kind === 'capo_promote').length >= 3) break;
  }

  // 4. Threats — telegraphed hostile staging
  const threats: ThreatSignal[] = getThreatSignals(gameState);
  for (const t of threats) {
    out.push({
      kind: 'threat',
      label: t.severity === 'high' ? 'THREAT — ADJACENT' : 'THREAT NEARBY',
      detail: t.description,
      family: t.family,
      hex: t.hex,
    });
  }

  // 5. Units that still have orders to give (only during tactical/deploy phases
  // where a movement budget is meaningful)
  if (gameState.turnPhase === 'move' || gameState.turnPhase === 'deploy') {
    for (const u of units) {
      if (u.family !== playerFamily) continue;
      if (u.type !== 'soldier') continue; // capos auto-claim
      if ((u.movesRemaining || 0) <= 0) continue;
      if (u.pendingPromotion) continue;
      out.push({
        kind: 'unit_orders',
        label: 'UNIT NEEDS ORDERS',
        detail: `${cap(u.name || 'Soldier')} still has ${u.movesRemaining} move${u.movesRemaining === 1 ? '' : 's'}`,
        unit: { id: u.id, type: 'soldier', q: u.q, r: u.r, s: u.s },
      });
    }
  }

  // Stable sort by priority order
  out.sort((a, b) => PRIORITY.indexOf(a.kind) - PRIORITY.indexOf(b.kind));
  return out;
}

/** Compact one-line tooltip summary: "3 idle units · 1 sitdown · 1 promotion". */
export function summarizePending(items: PendingItem[]): string {
  if (items.length === 0) return 'Nothing pending — ready to end turn';
  const counts: Record<PendingKind, number> = {
    incoming_sitdown: 0,
    ready_sitdown: 0,
    capo_promote: 0,
    threat: 0,
    unit_orders: 0,
  };
  for (const i of items) counts[i.kind]++;
  const parts: string[] = [];
  if (counts.incoming_sitdown) parts.push(`${counts.incoming_sitdown} incoming sitdown${counts.incoming_sitdown > 1 ? 's' : ''}`);
  if (counts.ready_sitdown) parts.push(`${counts.ready_sitdown} ready sitdown${counts.ready_sitdown > 1 ? 's' : ''}`);
  if (counts.capo_promote) parts.push(`${counts.capo_promote} promotion${counts.capo_promote > 1 ? 's' : ''}`);
  if (counts.threat) parts.push(`${counts.threat} threat${counts.threat > 1 ? 's' : ''}`);
  if (counts.unit_orders) parts.push(`${counts.unit_orders} idle unit${counts.unit_orders > 1 ? 's' : ''}`);
  return parts.join(' · ');
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
