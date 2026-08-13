import React from 'react';
import { cn } from '@/lib/utils';
import { Verdict } from '@/types/negotiation';

const LEVEL_STYLES: Record<Verdict['level'], string> = {
  insulted: 'text-destructive border-destructive/50 bg-destructive/10',
  cold: 'text-amber-400 border-amber-500/50 bg-amber-500/10',
  interested: 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10',
  eager: 'text-emerald-300 border-emerald-400/60 bg-emerald-400/15',
};

const VerdictBar: React.FC<{ verdict: Verdict }> = ({ verdict }) => (
  <div className={cn('rounded-md border px-3 py-2', LEVEL_STYLES[verdict.level])}>
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] uppercase tracking-[0.2em] opacity-80">Their read</span>
      <span className="text-sm font-bold">{verdict.label}</span>
    </div>
    <p className="mt-0.5 text-[11px] text-muted-foreground">{verdict.hint}</p>
    {verdict.demandValue > 0 && (
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>They want ≈${verdict.demandValue.toLocaleString()}</span>
        <span>You put up ≈${verdict.effectiveOffer.toLocaleString()}</span>
      </div>
    )}
  </div>
);

export default VerdictBar;
