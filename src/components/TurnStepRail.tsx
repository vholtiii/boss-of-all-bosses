import React from 'react';
import { cn } from '@/lib/utils';

type StepKey = 'deploy' | 'move' | 'action' | 'end';

interface TurnStepRailProps {
  phase: 'deploy' | 'move' | 'action' | 'waiting';
  jailed: boolean;
  jailTime: number;
  onAdvance: () => void;
  onSkipToAction: () => void;
  onEndTurn: () => void;
}

const ORDER: StepKey[] = ['deploy', 'move', 'action', 'end'];
const LABELS: Record<StepKey, string> = { deploy: 'Deploy', move: 'Tactical', action: 'Action', end: 'End' };
const ICONS: Record<StepKey, string> = { deploy: '📦', move: '📋', action: '⚔️', end: '⏭' };

const TurnStepRail: React.FC<TurnStepRailProps> = ({ phase, jailed, jailTime, onAdvance, onSkipToAction, onEndTurn }) => {
  const currentIdx = phase === 'waiting' ? 3 : ORDER.indexOf(phase as StepKey);

  const handleJump = (target: StepKey) => {
    if (jailed) return;
    const targetIdx = ORDER.indexOf(target);
    if (targetIdx <= currentIdx) return;
    if (target === 'end') {
      if (phase !== 'waiting' && !window.confirm('End your turn early? You still have actions remaining.')) return;
      onEndTurn();
      return;
    }
    if (target === 'action') { onSkipToAction(); return; }
    onAdvance();
  };

  return (
    <div
      role="group"
      aria-label="Turn step indicator"
      className="flex items-center bg-background/80 rounded-lg border border-noir-light overflow-hidden"
    >
      {ORDER.map((step, i) => {
        const isCurrent = i === currentIdx;
        const isPast = i < currentIdx;
        const isFuture = i > currentIdx;
        const isEnd = step === 'end';
        const clickable = isFuture && !jailed;
        const hint = isEnd
          ? (jailed ? `Jailed (${jailTime})` : (isPast || isCurrent ? '' : 'Click to end turn'))
          : isPast ? 'Completed' : isCurrent ? 'Current step' : (step === 'action' ? 'Skip to Action' : 'Advance');
        return (
          <React.Fragment key={step}>
            {i > 0 && (
              <span
                className={cn(
                  'text-sm select-none px-0.5',
                  i <= currentIdx ? 'text-primary/70' : 'text-muted-foreground/40'
                )}
                aria-hidden
              >
                ›
              </span>
            )}
            <button
              type="button"
              onClick={() => clickable && handleJump(step)}
              disabled={!clickable}
              title={hint}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(
                'px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1',
                isCurrent && 'bg-primary text-primary-foreground shadow-[0_0_10px_hsl(var(--primary)/0.45)]',
                isCurrent && !isEnd && 'animate-pulse',
                isPast && 'text-emerald-400/80',
                isFuture && !clickable && 'text-muted-foreground/40 cursor-not-allowed',
                isFuture && clickable && 'text-muted-foreground hover:text-foreground hover:bg-primary/10 cursor-pointer',
              )}
            >
              <span className="text-[11px] leading-none">{isPast ? '✓' : ICONS[step]}</span>
              <span>{LABELS[step]}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default TurnStepRail;
