import React from 'react';
import { cn } from '@/lib/utils';

interface TurnActionMeterProps {
  actionsRemaining: number;
  maxActions: number;
  jailed: boolean;
  jailTime: number;
  resolving: boolean;
  onEndTurn: () => void;
}

/**
 * Single open turn: one shared pool of action points. No deploy/tactical/action steps.
 */
const TurnActionMeter: React.FC<TurnActionMeterProps> = ({
  actionsRemaining,
  maxActions,
  jailed,
  jailTime,
  resolving,
  onEndTurn,
}) => {
  const total = Math.max(maxActions, actionsRemaining, 1);
  const spent = Math.max(0, total - actionsRemaining);
  const allSpent = actionsRemaining <= 0;

  const handleEnd = () => {
    if (jailed || resolving) return;
    if (!allSpent && !window.confirm(`End your turn with ${actionsRemaining} action${actionsRemaining === 1 ? '' : 's'} left?`)) return;
    onEndTurn();
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-2 bg-background/80 rounded-lg border border-noir-light px-2.5 py-1"
        title="Actions left this turn. Moves inside your own connected territory are free; moving beyond it costs 1 action."
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actions</span>
        <div className="flex items-center gap-1" role="img" aria-label={`${actionsRemaining} of ${total} actions remaining`}>
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'w-2.5 h-2.5 rounded-full border transition-all',
                i < actionsRemaining
                  ? 'bg-primary border-primary shadow-[0_0_6px_hsl(var(--primary)/0.6)]'
                  : 'bg-transparent border-muted-foreground/40'
              )}
            />
          ))}
        </div>
        <span className={cn('text-[11px] font-bold tabular-nums', allSpent ? 'text-amber-300' : 'text-primary')}>
          {actionsRemaining}/{total}
        </span>
        {spent > 0 && !allSpent && (
          <span className="text-[9px] text-muted-foreground/70">{spent} spent</span>
        )}
      </div>

      <button
        type="button"
        onClick={handleEnd}
        disabled={jailed || resolving}
        title={jailed ? `Jailed (${jailTime})` : resolving ? 'Rivals are moving…' : 'End your turn'}
        className={cn(
          'px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg border transition-all flex items-center gap-1.5',
          (jailed || resolving)
            ? 'bg-muted/30 border-noir-light text-muted-foreground/40 cursor-not-allowed'
            : allSpent
              ? 'bg-amber-500/25 border-amber-400 text-amber-200 hover:bg-amber-500/35 animate-pulse'
              : 'bg-primary/15 border-primary/50 text-primary hover:bg-primary/25 hover:border-primary'
        )}
      >
        <span>{resolving ? 'Resolving…' : 'End Turn'}</span>
        <span aria-hidden>▶</span>
      </button>
    </div>
  );
};

export default TurnActionMeter;
