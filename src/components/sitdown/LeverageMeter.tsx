import React from 'react';
import { cn } from '@/lib/utils';
import { LeverageResult } from '@/types/negotiation';

const LeverageMeter: React.FC<{ leverage: LeverageResult }> = ({ leverage }) => {
  // -60..+60 mapped onto a centered bar
  const pct = Math.max(0, Math.min(100, ((leverage.total + 60) / 120) * 100));
  const positive = leverage.total >= 0;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Leverage</span>
        <span className={cn('font-bold tabular-nums', positive ? 'text-primary' : 'text-destructive')}>
          {positive ? '+' : ''}{leverage.total}
        </span>
      </div>

      <div className="relative h-2 rounded-full bg-muted/40">
        <div className="absolute left-1/2 top-0 h-2 w-px bg-border" />
        <div
          className={cn('absolute top-0 h-2 rounded-full', positive ? 'bg-primary' : 'bg-destructive')}
          style={
            positive
              ? { left: '50%', width: `${pct - 50}%` }
              : { left: `${pct}%`, width: `${50 - pct}%` }
          }
        />
      </div>

      <ul className="space-y-0.5">
        {leverage.lines.map((l, i) => (
          <li key={`${l.label}-${i}`} className="flex items-baseline justify-between gap-2 text-[11px]">
            <span className="truncate text-muted-foreground">
              {l.label}
              {l.detail && <span className="ml-1 opacity-60">· {l.detail}</span>}
            </span>
            <span className={cn('tabular-nums font-semibold', l.value >= 0 ? 'text-primary' : 'text-destructive')}>
              {l.value > 0 ? '+' : ''}{l.value}
            </span>
          </li>
        ))}
        {leverage.lines.length === 0 && (
          <li className="text-[11px] text-muted-foreground">Nothing swings this table either way.</li>
        )}
      </ul>
    </div>
  );
};

export default LeverageMeter;
