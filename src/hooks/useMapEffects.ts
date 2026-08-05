import { useCallback, useEffect, useRef, useState } from 'react';

export type MapEffect =
  | {
      id: string;
      type: 'capture';
      q: number; r: number; s: number;
      family: string;
      expiresAt: number;
    }
  | {
      id: string;
      type: 'income';
      q: number; r: number; s: number;
      amount: number;
      delay: number;
      expiresAt: number;
    }
  | {
      id: string;
      type: 'combat';
      q: number; r: number; s: number;
      playerLost: boolean;
      expiresAt: number;
    }
  | {
      id: string;
      type: 'territoryFlash';
      q: number; r: number; s: number;
      gained: boolean;
      family: string;
      expiresAt: number;
    };

interface HexLike {
  q: number;
  r: number;
  s: number;
  controllingFamily: string;
}

interface CombatResultLike {
  q: number;
  r: number;
  s: number;
  success: boolean;
  type: string;
  timestamp?: number;
}

const CAPTURE_MS = 750;
const INCOME_MS = 1400;
const COMBAT_MS = 900;
const TERRITORY_MS = 700;
const MAX_CAPTURE_BATCH = 15;
const MAX_INCOME_FLOATS = 20;

let effectSeq = 0;
const nextId = () => `fx-${++effectSeq}-${Date.now()}`;

export function useMapEffects(opts: {
  hexMap: HexLike[];
  lastCombatResult?: CombatResultLike | null;
  playerFamily: string;
}) {
  const { hexMap, lastCombatResult, playerFamily } = opts;
  const [effects, setEffects] = useState<MapEffect[]>([]);
  const ownerRef = useRef<Map<string, string> | null>(null);
  const combatStampRef = useRef<number | null>(null);
  const pruneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enqueue = useCallback((items: MapEffect[]) => {
    if (items.length === 0) return;
    setEffects(prev => [...prev, ...items]);
    const maxExpiry = Math.max(...items.map(i => i.expiresAt));
    const delay = Math.max(0, maxExpiry - Date.now()) + 50;
    if (pruneTimerRef.current) clearTimeout(pruneTimerRef.current);
    pruneTimerRef.current = setTimeout(() => {
      setEffects(prev => prev.filter(e => e.expiresAt > Date.now()));
    }, delay);
  }, []);

  // Ownership diff → capture stamps
  useEffect(() => {
    const next = new Map<string, string>();
    for (const t of hexMap) {
      next.set(`${t.q},${t.r},${t.s}`, t.controllingFamily);
    }
    const prev = ownerRef.current;
    ownerRef.current = next;
    if (!prev) return; // skip first paint / game load baseline

    const stamps: MapEffect[] = [];
    next.forEach((family, key) => {
      const old = prev.get(key);
      if (old !== undefined && old !== family && family !== 'neutral') {
        const [q, r, s] = key.split(',').map(Number);
        stamps.push({
          id: nextId(),
          type: 'capture',
          q, r, s,
          family,
          expiresAt: Date.now() + CAPTURE_MS,
        });
      }
    });
    if (stamps.length > 0 && stamps.length <= MAX_CAPTURE_BATCH) {
      enqueue(stamps);
    }
  }, [hexMap, enqueue]);

  // Combat burst from lastCombatResult
  useEffect(() => {
    if (!lastCombatResult?.timestamp) return;
    if (combatStampRef.current === lastCombatResult.timestamp) return;
    combatStampRef.current = lastCombatResult.timestamp;
    // Player "lost" when a hit/extort/sabotage fails, or when type implies enemy action.
    // Mid-turn lastCombatResult is player-initiated; fail = playerLost for red tint.
    const playerLost = !lastCombatResult.success;
    enqueue([{
      id: nextId(),
      type: 'combat',
      q: lastCombatResult.q,
      r: lastCombatResult.r,
      s: lastCombatResult.s,
      playerLost,
      expiresAt: Date.now() + COMBAT_MS,
    }]);
  }, [lastCombatResult, enqueue]);

  useEffect(() => () => {
    if (pruneTimerRef.current) clearTimeout(pruneTimerRef.current);
  }, []);

  const spawnIncomeFloats = useCallback((
    entries: Array<{ hex: string; amount: number }>,
    hqHex?: { q: number; r: number; s: number } | null,
  ) => {
    if (!entries?.length) return;
    const sorted = [...entries].filter(e => e.amount > 0).sort((a, b) => b.amount - a.amount);
    const top = sorted.slice(0, MAX_INCOME_FLOATS);
    const rest = sorted.slice(MAX_INCOME_FLOATS);
    const restSum = rest.reduce((s, e) => s + e.amount, 0);
    const now = Date.now();
    const items: MapEffect[] = top.map((e, i) => {
      const [q, r, s] = e.hex.split(',').map(Number);
      return {
        id: nextId(),
        type: 'income' as const,
        q, r, s,
        amount: e.amount,
        delay: i * 50,
        expiresAt: now + INCOME_MS + i * 50,
      };
    });
    if (restSum > 0 && hqHex) {
      items.push({
        id: nextId(),
        type: 'income',
        q: hqHex.q, r: hqHex.r, s: hqHex.s,
        amount: restSum,
        delay: top.length * 50,
        expiresAt: now + INCOME_MS + top.length * 50,
      });
    }
    enqueue(items);
  }, [enqueue]);

  const spawnTerritoryFlashes = useCallback((
    changes: Array<{ hex: string; change: 'gained' | 'lost'; to?: string }>,
  ) => {
    if (!changes?.length) return;
    const now = Date.now();
    enqueue(changes.map(c => {
      const [q, r, s] = c.hex.split(',').map(Number);
      return {
        id: nextId(),
        type: 'territoryFlash' as const,
        q, r, s,
        gained: c.change === 'gained',
        family: c.to || playerFamily,
        expiresAt: now + TERRITORY_MS,
      };
    }));
  }, [enqueue, playerFamily]);

  return { effects, spawnIncomeFloats, spawnTerritoryFlashes };
}
