import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, AlertOctagon, AlertTriangle, Info, Lightbulb, Crosshair } from 'lucide-react';
import { analyzeGame, type AnalysisFinding, type AnalysisSeverity, type AnalysisWindow } from '@/lib/game-analysis';
import type { EnhancedMafiaGameState } from '@/hooks/useEnhancedMafiaGameState';

const SEV_STYLE: Record<AnalysisSeverity, { chip: string; border: string; icon: React.ReactNode; label: string }> = {
  critical: {
    chip: 'bg-destructive/15 text-destructive border-destructive/40',
    border: 'border-destructive/40',
    icon: <AlertOctagon className="h-3.5 w-3.5 text-destructive" />,
    label: 'critical',
  },
  warning: {
    chip: 'bg-primary/15 text-primary border-primary/40',
    border: 'border-primary/30',
    icon: <AlertTriangle className="h-3.5 w-3.5 text-primary" />,
    label: 'warning',
  },
  note: {
    chip: 'bg-muted text-muted-foreground border-border',
    border: 'border-border',
    icon: <Info className="h-3.5 w-3.5 text-muted-foreground" />,
    label: 'note',
  },
};

const WINDOWS: Array<{ id: AnalysisWindow; label: string }> = [
  { id: 1, label: 'This turn' },
  { id: 5, label: 'Last 5' },
  { id: 999, label: 'All' },
];

const FindingCard: React.FC<{
  finding: AnalysisFinding;
  onFocusHex?: (q: number, r: number, s: number) => void;
}> = ({ finding, onFocusHex }) => {
  const [open, setOpen] = useState(finding.severity === 'critical');
  const sev = SEV_STYLE[finding.severity];
  return (
    <div className={cn('rounded-md border bg-card/70 overflow-hidden', sev.border)}>
      <button
        data-no-sound
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-start gap-2 px-2.5 py-2 text-left hover:bg-muted/40 transition-colors"
      >
        <span className="mt-0.5 shrink-0">{sev.icon}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-[11px] font-semibold leading-snug text-foreground">{finding.title}</span>
          <span className="mt-0.5 flex items-center gap-1.5">
            <span className={cn('rounded border px-1 text-[8px] font-bold uppercase tracking-wider', sev.chip)}>{sev.label}</span>
            <span className="text-[9px] text-muted-foreground">Turn {finding.turn}</span>
          </span>
        </span>
        {open ? <ChevronDown className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 border-t border-border/60 px-2.5 py-2">
              <ul className="space-y-1">
                {finding.causes.map((c, i) => (
                  <li key={i} className="flex gap-1.5 text-[10px] leading-snug text-muted-foreground">
                    <span className="text-primary/60">→</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
              <p className="rounded bg-muted/50 px-2 py-1.5 text-[10px] leading-snug text-foreground">
                <span className="font-semibold text-primary">Fix: </span>
                {finding.advice}
              </p>
              {finding.hexRef && onFocusHex && (
                <button
                  data-no-sound
                  onClick={() => onFocusHex(finding.hexRef!.q, finding.hexRef!.r, finding.hexRef!.s)}
                  className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-primary hover:underline"
                >
                  <Crosshair className="h-3 w-3" /> Show the block
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const GameAnalysisPanel: React.FC<{
  gameState: EnhancedMafiaGameState;
  onFocusHex?: (q: number, r: number, s: number) => void;
}> = ({ gameState, onFocusHex }) => {
  const [open, setOpen] = useState(false);
  const [window, setWindow] = useState<AnalysisWindow>(5);

  const { setbacks, opportunities } = useMemo(() => analyzeGame(gameState, window), [gameState, window]);
  const criticalCount = useMemo(() => analyzeGame(gameState, 999).setbacks.filter(f => f.severity === 'critical').length, [gameState]);

  return (
    <div className="border-b border-border/60 pb-3">
      <button
        data-no-sound
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-2 py-1 text-left text-sm font-semibold text-foreground transition-colors hover:text-primary"
      >
        <Lightbulb className="h-4 w-4 text-primary" />
        <span className="flex-1">Game Analysis</span>
        {criticalCount > 0 && (
          <span className="rounded-full border border-destructive/40 bg-destructive/15 px-1.5 text-[9px] font-bold text-destructive">
            {criticalCount}
          </span>
        )}
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-2">
              <div className="flex gap-1">
                {WINDOWS.map(w => (
                  <button
                    key={w.id}
                    data-no-sound
                    onClick={() => setWindow(w.id)}
                    className={cn(
                      'rounded border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider transition-colors',
                      window === w.id ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {w.label}
                  </button>
                ))}
              </div>

              <div>
                <h4 className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-destructive/80">
                  What went wrong ({setbacks.length})
                </h4>
                {setbacks.length === 0 ? (
                  <p className="text-[10px] italic text-muted-foreground">Nothing blew up in this window. Clean books.</p>
                ) : (
                  <div className="space-y-1.5">
                    {setbacks.slice(0, 12).map(f => (
                      <FindingCard key={f.id} finding={f} onFocusHex={onFocusHex} />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-primary/80">
                  Left on the table ({opportunities.length})
                </h4>
                {opportunities.length === 0 ? (
                  <p className="text-[10px] italic text-muted-foreground">You are squeezing everything the city has.</p>
                ) : (
                  <div className="space-y-1.5">
                    {opportunities.slice(0, 12).map(f => (
                      <FindingCard key={f.id} finding={f} onFocusHex={onFocusHex} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameAnalysisPanel;
