import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  SkipForward,
  Bell,
  Handshake,
  Crown,
  AlertTriangle,
  Footprints,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  derivePendingActions,
  summarizePending,
  type PendingItem,
  type PendingKind,
} from '@/lib/pending-actions';

interface Props {
  gameState: any;
  jailed: boolean;
  jailTime: number;
  aiThinking?: boolean;
  onEndTurn: () => void;
  onResolveItem: (item: PendingItem) => void;
}

const KIND_ICON: Record<PendingKind, React.ReactNode> = {
  incoming_sitdown: <Bell className="h-4 w-4" />,
  ready_sitdown: <Handshake className="h-4 w-4" />,
  capo_promote: <Crown className="h-4 w-4" />,
  threat: <AlertTriangle className="h-4 w-4" />,
  unit_orders: <Footprints className="h-4 w-4" />,
};

// Tailwind class strings keyed by kind. Each maps to noir-friendly tints.
const KIND_CLASS: Record<PendingKind, string> = {
  incoming_sitdown:
    'bg-amber-500 hover:bg-amber-400 text-black animate-pulse shadow-[0_0_12px_hsl(45_100%_55%/0.5)]',
  ready_sitdown:
    'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_10px_hsl(190_100%_55%/0.45)]',
  capo_promote:
    'bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_10px_hsl(50_100%_55%/0.45)]',
  threat:
    'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-[0_0_12px_hsl(350_85%_55%/0.5)]',
  unit_orders:
    'bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_10px_hsl(220_100%_60%/0.4)]',
};

const SmartEndTurnButton: React.FC<Props> = ({
  gameState,
  jailed,
  jailTime,
  aiThinking,
  onEndTurn,
  onResolveItem,
}) => {
  // Track which item index in the queue is currently "shown" — lets the user
  // shift-click to cycle past a particular prompt.
  const [skipIdx, setSkipIdx] = useState(0);

  const items = useMemo(() => derivePendingActions(gameState), [gameState]);

  // Reset cycler when queue identity changes
  useEffect(() => {
    setSkipIdx(0);
  }, [items.length, items[0]?.kind, items[0]?.unit?.id, items[0]?.hex?.q]);

  const current = items[Math.min(skipIdx, items.length - 1)];

  const isJailed = jailed;
  const isThinking = !!aiThinking;
  const hasPending = items.length > 0 && !isJailed && !isThinking;

  const summary = useMemo(() => summarizePending(items), [items]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isJailed || isThinking) return;
      if (!hasPending) {
        if (
          gameState?.turnPhase !== 'waiting' &&
          !window.confirm(
            'End your turn early? You still have actions remaining.'
          )
        )
          return;
        onEndTurn();
        return;
      }
      if (e.shiftKey) {
        // skip to next
        setSkipIdx((i) => (i + 1) % items.length);
        return;
      }
      onResolveItem(current);
    },
    [isJailed, isThinking, hasPending, current, items.length, onEndTurn, onResolveItem, gameState]
  );

  // Spacebar ends turn only when nothing is pending; otherwise cycles.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      )
        return;
      if (isJailed || isThinking) return;
      e.preventDefault();
      if (!hasPending) {
        onEndTurn();
      } else {
        setSkipIdx((i) => (i + 1) % items.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasPending, isJailed, isThinking, items.length, onEndTurn]);

  // ---- Render ----
  if (isJailed) {
    return (
      <Button
        size="sm"
        disabled
        className="bg-muted text-muted-foreground font-bold font-playfair"
      >
        <SkipForward className="h-4 w-4 mr-2" />
        JAILED ({jailTime})
      </Button>
    );
  }

  if (isThinking) {
    return (
      <Button
        size="sm"
        disabled
        className="bg-noir-light text-muted-foreground font-bold font-playfair"
      >
        <span className="inline-block h-3 w-3 mr-2 rounded-full border-2 border-current border-r-transparent animate-spin" />
        AI THINKING…
      </Button>
    );
  }

  if (!hasPending || !current) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              onClick={handleClick}
              className="bg-primary text-primary-foreground font-bold font-playfair hover:bg-primary/90"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              END TURN
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="text-xs">
              Nothing pending — press <kbd className="px-1 rounded bg-muted">Space</kbd> to end turn
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            onClick={handleClick}
            className={cn(
              'font-bold font-playfair flex items-center gap-2 transition-all',
              KIND_CLASS[current.kind]
            )}
          >
            {KIND_ICON[current.kind]}
            <span className="text-[11px] uppercase tracking-wider">{current.label}</span>
            {items.length > 1 && (
              <span className="text-[10px] opacity-80 ml-1">+{items.length - 1}</span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1.5">
            <div className="text-xs font-bold">{current.detail}</div>
            <div className="text-[10px] text-muted-foreground">{summary}</div>
            <div className="text-[10px] text-muted-foreground border-t border-border/40 pt-1">
              <kbd className="px-1 rounded bg-muted">Click</kbd> jump to ·{' '}
              <kbd className="px-1 rounded bg-muted">Shift+Click</kbd> skip ·{' '}
              <kbd className="px-1 rounded bg-muted">Space</kbd>{' '}
              {hasPending ? 'cycle' : 'end turn'}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SmartEndTurnButton;
