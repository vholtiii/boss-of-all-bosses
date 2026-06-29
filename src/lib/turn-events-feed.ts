/**
 * Turn Events Feed — derives the "Just Happened" stack of dismissible event
 * cards shown at the start of each player turn. Pure derivation from
 * alertsLog (which already captures combat/territory/economy/diplomacy events)
 * filtered to the *current* turn and unread.
 */
import type { AlertEntry, AlertCategory } from '@/types/game-mechanics';

export interface FeedItem {
  id: string;
  category: AlertCategory;
  type: AlertEntry['type'];
  title: string;
  message?: string;
  hex?: { q: number; r: number; s: number };
  unit?: { type: 'soldier' | 'capo'; q: number; r: number; s: number };
  /** Severity for sort ordering — error > warning > success > info */
  severity: number;
}

const SEV: Record<AlertEntry['type'], number> = {
  error: 3,
  warning: 2,
  success: 1,
  info: 0,
};

const CAT_PRIORITY: Record<AlertCategory, number> = {
  combat: 6,
  territory: 5,
  diplomacy: 4,
  economy: 3,
  phase: 2,
  intel: 1,
  system: 0,
};

/**
 * Returns the unread alerts from the most recent turn boundary, sorted by
 * severity then category. Capped at `limit`.
 */
export function deriveTurnEventsFeed(
  alerts: AlertEntry[],
  currentTurn: number,
  limit = 20
): FeedItem[] {
  if (!alerts || alerts.length === 0) return [];
  // Include current + previous turn so the feed survives the player taking
  // their first action (which doesn't always increment turn immediately).
  const recent = alerts.filter(
    (a) => !a.read && (a.turn === currentTurn || a.turn === currentTurn - 1)
  );
  const sorted = [...recent].sort((a, b) => {
    const sevDelta = SEV[b.type] - SEV[a.type];
    if (sevDelta !== 0) return sevDelta;
    const catDelta = CAT_PRIORITY[b.category] - CAT_PRIORITY[a.category];
    if (catDelta !== 0) return catDelta;
    return b.timestamp - a.timestamp;
  });
  return sorted.slice(0, limit).map((a) => ({
    id: a.id,
    category: a.category,
    type: a.type,
    title: typeof a.title === 'string' ? a.title : String(a.title),
    message: a.message,
    hex: a.hexRef,
    unit: a.unitRef,
    severity: SEV[a.type],
  }));
}
