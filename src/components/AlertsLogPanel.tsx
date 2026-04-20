import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronDown, ChevronRight, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertEntry, AlertCategory } from '@/types/game-mechanics';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

interface AlertsLogPanelProps {
  alerts: AlertEntry[];
  currentTurn: number;
  onMarkAllRead: () => void;
  onSelectUnit?: (unitType: 'soldier' | 'capo', hex: { q: number; r: number; s: number }) => void;
}

type Filter = 'all' | 'critical' | AlertCategory;

const CATEGORY_LABELS: Record<AlertCategory, string> = {
  combat: 'Combat',
  diplomacy: 'Diplomacy',
  economy: 'Economy',
  territory: 'Territory',
  intel: 'Intel',
  phase: 'Phase',
  system: 'System',
};

const TYPE_DOT_CLS: Record<AlertEntry['type'], string> = {
  error: 'bg-destructive',
  warning: 'bg-amber-500',
  success: 'bg-emerald-500',
  info: 'bg-sky-500',
};

const AlertsLogPanel: React.FC<AlertsLogPanelProps> = ({ alerts, currentTurn, onMarkAllRead, onSelectUnit }) => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedTurns, setExpandedTurns] = useState<Set<number>>(new Set([currentTurn]));

  // Keep current turn always expanded
  useEffect(() => {
    setExpandedTurns(prev => {
      const next = new Set(prev);
      next.add(currentTurn);
      return next;
    });
  }, [currentTurn]);

  // Mark visible items read on close
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (wasOpenRef.current && !open) {
      onMarkAllRead();
    }
    wasOpenRef.current = open;
  }, [open, onMarkAllRead]);

  const unreadCriticalCount = useMemo(
    () => alerts.filter(a => !a.read && (a.type === 'error' || a.type === 'warning')).length,
    [alerts]
  );

  const filtered = useMemo(() => {
    return alerts.filter(a => {
      if (filter === 'all') return true;
      if (filter === 'critical') return a.type === 'error' || a.type === 'warning';
      return a.category === filter;
    });
  }, [alerts, filter]);

  // Group by turn (descending)
  const grouped = useMemo(() => {
    const map = new Map<number, AlertEntry[]>();
    for (const a of filtered) {
      if (!map.has(a.turn)) map.set(a.turn, []);
      map.get(a.turn)!.push(a);
    }
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [filtered]);

  const toggleTurn = (t: number) => {
    setExpandedTurns(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const filterChips: Array<{ id: Filter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'critical', label: 'Critical' },
    { id: 'combat', label: 'Combat' },
    { id: 'diplomacy', label: 'Diplomacy' },
    { id: 'economy', label: 'Economy' },
    { id: 'territory', label: 'Territory' },
    { id: 'intel', label: 'Intel' },
    { id: 'phase', label: 'Phase' },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          data-no-sound
          className="relative"
          aria-label="Alerts log"
        >
          <Bell className="h-4 w-4" />
          {unreadCriticalCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 border border-background">
              {unreadCriticalCount > 99 ? '99+' : unreadCriticalCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0 max-h-[70vh] overflow-hidden flex flex-col"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b bg-card/60">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-foreground" />
            <span className="text-sm font-bold uppercase tracking-wider font-playfair">
              Alerts Log
            </span>
            {unreadCriticalCount > 0 && (
              <Badge variant="outline" className="text-[10px] h-5 bg-destructive/20 border-destructive/40 text-destructive">
                {unreadCriticalCount} new
              </Badge>
            )}
          </div>
          <button
            data-no-sound
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-1 px-3 py-2 border-b bg-background/40">
          {filterChips.map(chip => (
            <button
              key={chip.id}
              data-no-sound
              onClick={() => setFilter(chip.id)}
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full border transition-colors',
                filter === chip.id
                  ? 'bg-primary/30 border-primary/60 text-foreground'
                  : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
          {grouped.length === 0 ? (
            <p className="text-xs text-muted-foreground italic text-center py-6">
              No alerts in the log. Recent events will appear here for 2 turns.
            </p>
          ) : (
            grouped.map(([turn, list]) => {
              const isOpen = expandedTurns.has(turn);
              const turnUnread = list.filter(a => !a.read && (a.type === 'error' || a.type === 'warning')).length;
              return (
                <div key={turn} className="rounded-md border border-border/60 bg-card/40">
                  <button
                    data-no-sound
                    onClick={() => toggleTurn(turn)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-left"
                  >
                    {isOpen ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                    <span className="text-[11px] font-semibold text-foreground">
                      Turn {turn}{turn === currentTurn ? ' (current)' : ''}
                    </span>
                    <span className="text-[10px] text-muted-foreground">({list.length})</span>
                    {turnUnread > 0 && (
                      <Badge variant="outline" className="ml-auto text-[9px] h-4 bg-destructive/20 border-destructive/40 text-destructive">
                        {turnUnread} new
                      </Badge>
                    )}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div className="px-2 pb-2 space-y-1">
                          {list.map(a => {
                            const clickable = !!(a.unitRef && onSelectUnit);
                            const Comp: any = clickable ? 'button' : 'div';
                            return (
                              <Comp
                                key={a.id}
                                data-no-sound
                                onClick={clickable ? () => {
                                  if (a.unitRef && onSelectUnit) onSelectUnit(a.unitRef.type, { q: a.unitRef.q, r: a.unitRef.r, s: a.unitRef.s });
                                } : undefined}
                                className={cn(
                                  'w-full text-left rounded border px-2 py-1.5 transition-colors block',
                                  a.type === 'error' && 'border-destructive/30 bg-destructive/5',
                                  a.type === 'warning' && 'border-amber-500/30 bg-amber-500/5',
                                  a.type === 'success' && 'border-emerald-500/30 bg-emerald-500/5',
                                  a.type === 'info' && 'border-sky-500/30 bg-sky-500/5',
                                  clickable && 'cursor-pointer hover:brightness-125'
                                )}
                              >
                                <div className="flex items-start gap-2">
                                  <span className={cn('mt-1 h-2 w-2 rounded-full shrink-0', TYPE_DOT_CLS[a.type])} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[11px] font-semibold text-foreground truncate">
                                        {a.title}
                                      </span>
                                      <Badge variant="outline" className="text-[9px] h-4 px-1.5 shrink-0 bg-muted/30 border-border text-muted-foreground capitalize">
                                        {CATEGORY_LABELS[a.category]}
                                      </Badge>
                                    </div>
                                    {a.message && (
                                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                                        {a.message}
                                      </p>
                                    )}
                                    {clickable && (
                                      <p className="text-[9px] text-primary/70 mt-1">
                                        Click to view on map →
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </Comp>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t bg-card/40 text-[10px] text-muted-foreground text-center">
          Alerts auto-expire after 2 turns
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AlertsLogPanel;
