import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Crosshair,
  Skull,
  Swords,
  Waves,
  DollarSign,
  Gavel,
} from 'lucide-react';
import { EnhancedMafiaGameState } from '@/hooks/useEnhancedMafiaGameState';
import { buildThreatSections, ThreatSection as SharedThreatSection } from '@/lib/threat-board';

interface ThreatBoardPanelProps {
  gameState: EnhancedMafiaGameState;
  onSelectUnit?: (unitType: string, hex: { q: number; r: number; s: number }) => void;
}

const ICONS_BY_SECTION: Record<string, React.ReactNode> = {
  incoming: <Crosshair className="h-3 w-3 text-destructive" />,
  hitman: <Skull className="h-3 w-3 text-amber-400" />,
  diplomacy: <Swords className="h-3 w-3 text-destructive" />,
  law: <Gavel className="h-3 w-3 text-amber-400" />,
  erosion: <Waves className="h-3 w-3 text-amber-400" />,
  bounties: <DollarSign className="h-3 w-3 text-destructive" />,
};

const ThreatBoardPanel: React.FC<ThreatBoardPanelProps> = ({ gameState, onSelectUnit }) => {
  const [open, setOpen] = useState(false);
  const [userToggled, setUserToggled] = useState(false);
  const autoExpandedTurnRef = useRef<number | null>(null);

  const turn = gameState.turn;
  const sharedSections = buildThreatSections(gameState);
  const sections = sharedSections.map((s: SharedThreatSection) => ({
    ...s,
    icon: ICONS_BY_SECTION[s.id] || null,
  }));

  const totalCount = sections.reduce((acc, s) => acc + s.rows.length, 0);
  const hasCritical = sections.some(s => s.rows.some(r => r.severity === 'critical'));
  const incomingSection = sections.find(s => s.id === 'incoming');
  const hasIncomingHit = !!(incomingSection && incomingSection.rows.length > 0);

  // Auto-expand once when an incoming hit first appears this turn
  useEffect(() => {
    if (hasIncomingHit && autoExpandedTurnRef.current !== turn && !userToggled) {
      autoExpandedTurnRef.current = turn;
      setOpen(true);
    }
  }, [hasIncomingHit, turn, userToggled]);

  // Always render — show calm "All Clear" state when zero threats
  const isCalm = totalCount === 0;

  const headerToneCls = isCalm
    ? 'text-emerald-400/80'
    : hasCritical
      ? 'text-destructive'
      : 'text-amber-400';
  const badgeToneCls = isCalm
    ? 'bg-muted/30 border-muted text-muted-foreground'
    : hasCritical
      ? 'bg-destructive/20 border-destructive/40 text-destructive'
      : 'bg-amber-500/20 border-amber-500/40 text-amber-400';
  const borderCls = isCalm
    ? 'border-border'
    : hasCritical
      ? 'border-destructive/40'
      : 'border-amber-500/30';

  return (
    <div className={cn('rounded-lg border bg-card/80 px-3 py-2', borderCls, hasIncomingHit && !open && 'animate-pulse')}>
      <button
        data-no-sound
        onClick={() => { setUserToggled(true); setOpen(o => !o); }}
        className="flex items-center gap-2 w-full text-left"
      >
        <AlertTriangle className={cn('h-4 w-4', headerToneCls)} />
        <span className={cn('flex-1 text-sm font-bold uppercase tracking-wider font-playfair', headerToneCls)}>
          Threat Board
        </span>
        <Badge variant="outline" className={cn('text-[10px] h-5 border', badgeToneCls)}>
          {totalCount}
        </Badge>
        {open ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-3">
              {sections.length === 0 ? (
                <p className="text-xs text-muted-foreground italic px-1">All quiet. No active threats.</p>
              ) : (
                sections.map(section => (
                  <div key={section.id}>
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      {section.icon}
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {section.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70">({section.rows.length})</span>
                    </div>
                    <div className="space-y-1">
                      {section.rows.map(row => {
                        const clickable = !!(row.hex && row.unitType && onSelectUnit);
                        return (
                          <button
                            key={row.id}
                            data-no-sound
                            disabled={!clickable}
                            onClick={() => {
                              if (clickable && row.hex && row.unitType) {
                                onSelectUnit!(row.unitType, row.hex);
                              }
                            }}
                            className={cn(
                              'w-full text-left rounded border bg-background/60 px-2 py-1.5 transition-colors',
                              row.severity === 'critical'
                                ? 'border-destructive/30 hover:border-destructive/60'
                                : 'border-border hover:border-primary/40',
                              clickable && 'cursor-pointer hover:bg-accent/30',
                              !clickable && 'cursor-default opacity-90'
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-medium text-foreground truncate">
                                {row.label}
                              </span>
                              {row.badge && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-[9px] h-4 px-1.5 shrink-0 border',
                                    row.badge.tone === 'danger' && 'bg-destructive/20 border-destructive/40 text-destructive',
                                    row.badge.tone === 'warn' && 'bg-amber-500/20 border-amber-500/40 text-amber-400',
                                    row.badge.tone === 'muted' && 'bg-muted/30 border-muted text-muted-foreground'
                                  )}
                                >
                                  {row.badge.text}
                                </Badge>
                              )}
                            </div>
                            {row.sub && (
                              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                {row.sub}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThreatBoardPanel;
