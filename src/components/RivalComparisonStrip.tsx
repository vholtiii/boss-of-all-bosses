import React from 'react';
import { cn } from '@/lib/utils';

interface Props {
  gameState: any;
  highlightedFamily?: string | null;
  onHighlightFamily?: (family: string | null) => void;
}

const FAMILY_TINT: Record<string, string> = {
  gambino: 'bg-cyan-400',
  genovese: 'bg-green-500',
  lucchese: 'bg-blue-500',
  bonanno: 'bg-red-500',
  colombo: 'bg-purple-500',
};

const METRICS = [
  { key: 'money', label: '$', title: 'Money' },
  { key: 'soldiers', label: '👤', title: 'Soldiers' },
  { key: 'respect', label: '★', title: 'Respect' },
  { key: 'influence', label: '◈', title: 'Influence' },
  { key: 'territory', label: '◢', title: 'Territory %' },
];

/**
 * At-a-glance comparison strip: one row per family with normalized mini-bars
 * for Money, Soldiers, Respect, Influence, Territory%. All bars share the
 * same per-metric max so the player can scan competitive position instantly.
 */
const RivalComparisonStrip: React.FC<Props> = ({ gameState, highlightedFamily, onHighlightFamily }) => {
  const playerFamily = gameState?.playerFamily;
  const ai: any[] = gameState?.aiOpponents || [];
  const hexMap: any[] = gameState?.hexMap || [];
  const deployedUnits: any[] = gameState?.deployedUnits || [];
  const totalHexes = hexMap.length || 1;

  // Build a unified row set (player first, then rivals)
  const playerRes = gameState?.resources || {};
  const rows = [
    {
      family: playerFamily,
      isPlayer: true,
      money: playerRes.money || 0,
      soldiers: (playerRes.soldiers || 0) + deployedUnits.filter(u => u.family === playerFamily).length,
      respect: playerRes.respect || 0,
      influence: playerRes.influence || 0,
      territory: Math.round((hexMap.filter(h => h.controllingFamily === playerFamily).length / totalHexes) * 100),
    },
    ...ai.map(o => ({
      family: o.family,
      isPlayer: false,
      money: o.resources?.money || 0,
      soldiers: (o.resources?.soldiers || 0) + deployedUnits.filter(u => u.family === o.family).length,
      respect: o.resources?.respect || 0,
      influence: o.resources?.influence || 0,
      territory: Math.round((hexMap.filter(h => h.controllingFamily === o.family).length / totalHexes) * 100),
    })),
  ].filter(r => !!r.family);

  // Compute per-metric max (>=1 to avoid /0)
  const maxFor = (key: string) => Math.max(1, ...rows.map(r => (r as any)[key] || 0));
  const maxes: Record<string, number> = {};
  METRICS.forEach(m => { maxes[m.key] = maxFor(m.key); });

  if (rows.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card/60 p-2.5 space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          At a Glance
        </p>
        <p className="text-[9px] text-muted-foreground/60 italic">vs current leader</p>
      </div>
      {/* Header row */}
      <div className="grid grid-cols-[60px_repeat(5,1fr)] items-center gap-1.5 text-[9px] text-muted-foreground/70 px-0.5">
        <span />
        {METRICS.map(m => (
          <span key={m.key} className="text-center" title={m.title}>{m.label}</span>
        ))}
      </div>
      {rows.map(row => {
        const isHi = highlightedFamily === row.family;
        return (
          <button
            key={row.family}
            data-no-sound
            onClick={() => onHighlightFamily?.(isHi ? null : row.family)}
            className={cn(
              'w-full grid grid-cols-[60px_repeat(5,1fr)] items-center gap-1.5 rounded px-1 py-1 transition-colors text-left',
              isHi ? 'bg-primary/10 ring-1 ring-primary/40' : 'hover:bg-accent/30'
            )}
          >
            <span className={cn(
              'text-[10px] capitalize truncate',
              row.isPlayer ? 'text-primary font-bold' : 'text-foreground'
            )}>
              {row.family}{row.isPlayer && ' (you)'}
            </span>
            {METRICS.map(m => {
              const v = (row as any)[m.key] || 0;
              const pct = Math.min(100, Math.round((v / maxes[m.key]) * 100));
              const isLeader = v === maxes[m.key] && v > 0;
              return (
                <div
                  key={m.key}
                  className="relative h-2.5 rounded-sm bg-muted/40 overflow-hidden"
                  title={`${m.title}: ${m.key === 'money' ? `$${v.toLocaleString()}` : m.key === 'influence' ? v.toFixed(1) : Math.round(v)}${m.key === 'territory' ? '%' : ''}${isLeader ? ' (leader)' : ''}`}
                >
                  <div
                    className={cn(
                      'h-full transition-all duration-500',
                      FAMILY_TINT[row.family] || 'bg-muted-foreground',
                      isLeader ? 'opacity-100' : 'opacity-70'
                    )}
                    style={{ width: `${pct}%` }}
                  />
                  {isLeader && (
                    <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[8px] leading-none text-foreground/90">★</span>
                  )}
                </div>
              );
            })}
          </button>
        );
      })}
    </div>
  );
};

export default RivalComparisonStrip;
