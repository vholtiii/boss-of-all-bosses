import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crosshair, MapPin, SkipForward, Swords, TrendingUp, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FAMILY_COLORS } from '@/lib/period-theme';

export interface RivalMove {
  family: string;
  type: 'claim' | 'extort' | 'hit' | 'build' | 'war' | 'pressure' | 'sitdown' | 'scout';
  district?: string;
  q?: number;
  r?: number;
  s?: number;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface TurnSpotlightProps {
  open: boolean;
  turn: number;
  gamePhase: number;
  playerFamily: string;
  rivalMoves?: RivalMove[];
  leadingFamily?: string;
  onClose: () => void;
  onFocus?: (q: number, r: number, s: number) => void;
}

const phaseLabel = (phase: number) => {
  switch (phase) {
    case 1: return 'The Streets';
    case 2: return 'The Takeover';
    case 3: return 'The Commission';
    case 4: return 'Endgame';
    default: return 'Prologue';
  }
};

const familyLabel = (family?: string) => {
  if (!family) return 'Neutral';
  return family.charAt(0).toUpperCase() + family.slice(1);
};

const iconForMove = (type: RivalMove['type']) => {
  switch (type) {
    case 'hit': return <Crosshair className="h-3.5 w-3.5" />;
    case 'war': return <Swords className="h-3.5 w-3.5" />;
    case 'pressure': return <ShieldAlert className="h-3.5 w-3.5" />;
    case 'build': return <TrendingUp className="h-3.5 w-3.5" />;
    case 'sitdown': return <MapPin className="h-3.5 w-3.5" />;
    default: return <AlertTriangle className="h-3.5 w-3.5" />;
  }
};

const TurnSpotlight: React.FC<TurnSpotlightProps> = ({
  open,
  turn,
  gamePhase,
  playerFamily,
  rivalMoves = [],
  leadingFamily,
  onClose,
  onFocus,
}) => {
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) setVisible(true);
  }, [open]);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => {
      setVisible(false);
      onClose();
    }, 5200);
    return () => window.clearTimeout(timer);
  }, [visible, onClose]);

  const playerColor = FAMILY_COLORS[playerFamily] || '#D4AF37';

  const topMoves = useMemo(() => {
    const sorted = [...rivalMoves].sort((a, b) => {
      const rank = { high: 3, medium: 2, low: 1 };
      return rank[b.severity] - rank[a.severity];
    });
    return sorted.slice(0, 4);
  }, [rivalMoves]);

  const headline = useMemo(() => {
    if (leadingFamily === playerFamily) return 'You hold the edge. Keep it.';
    if (rivalMoves.some(m => m.severity === 'high' && m.family === leadingFamily)) {
      return `${familyLabel(leadingFamily)} is tightening the noose.`;
    }
    if (rivalMoves.some(m => m.severity === 'high')) return 'The night brought blood.';
    if (rivalMoves.length === 0) return 'The city slept. For now.';
    return 'Rivals are moving. Watch the board.';
  }, [leadingFamily, playerFamily, rivalMoves]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={`turn-spotlight-${turn}`}
          className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
        >
          <motion.div
            className="pointer-events-auto w-full max-w-[520px] overflow-hidden border bg-card/95 shadow-2xl backdrop-blur-md"
            initial={{ scale: 0.94, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: -8, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative h-1.5 w-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0"
                style={{ backgroundColor: playerColor }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 5, ease: 'linear' }}
              />
            </div>

            <div className="flex items-start justify-between gap-4 p-5">
              <div className="flex min-w-0 items-start gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center border-2"
                  style={{ borderColor: playerColor, color: playerColor }}
                >
                  <span className="text-lg font-black uppercase tracking-widest">{turn}</span>
                </div>
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-none text-[9px] uppercase tracking-[0.16em]">
                      {phaseLabel(gamePhase)}
                    </Badge>
                    <Badge variant="outline" className="rounded-none text-[9px] uppercase tracking-[0.16em] text-primary">
                      Turn {turn}
                    </Badge>
                  </div>
                  <h2 className="text-base font-black uppercase tracking-[0.1em] text-foreground">{headline}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {rivalMoves.length > 0
                      ? `${rivalMoves.length} rival move${rivalMoves.length === 1 ? '' : 's'} resolved since your last turn.`
                      : 'No major rival activity reported.'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                data-no-sound
                onClick={() => { setVisible(false); onClose(); }}
                aria-label="Skip turn spotlight"
                title="Skip turn spotlight"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {topMoves.length > 0 && (
              <div className="border-t border-border/60 px-5 py-4">
                <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">What happened while you were away</div>
                <div className="grid gap-2">
                  {topMoves.map((move, idx) => (
                    <button
                      key={idx}
                      data-no-sound
                      onClick={() => move.q !== undefined && move.r !== undefined && move.s !== undefined && onFocus?.(move.q, move.r, move.s)}
                      className={cn(
                        'flex items-start gap-3 rounded-sm border border-transparent bg-background/60 p-2.5 text-left transition-colors hover:border-primary/30 hover:bg-background',
                        onFocus && move.q !== undefined ? 'cursor-pointer' : 'cursor-default'
                      )}
                    >
                      <div
                        className={cn(
                          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border',
                          move.severity === 'high' ? 'border-destructive/50 text-destructive' : 'border-primary/40 text-primary'
                        )}
                      >
                        {iconForMove(move.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                          <span style={{ color: FAMILY_COLORS[move.family] || '#ccc' }}>{familyLabel(move.family)}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="capitalize">{move.type}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{move.message}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border/60 bg-background/40 px-5 py-3">
              <Button
                variant="default"
                size="sm"
                data-no-sound
                onClick={() => { setVisible(false); onClose(); }}
                className="w-full rounded-none text-xs font-bold uppercase tracking-[0.12em]"
              >
                Take the reins
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TurnSpotlight;
