import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, Crosshair, Eye, ShieldAlert, SkipForward, Swords, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type CombatResult = {
  q: number;
  r: number;
  s: number;
  success: boolean;
  type: 'hit' | 'extort' | 'sabotage';
  title: string;
  details: string;
  timestamp: number;
};

interface HitSpotlightProps {
  result?: CombatResult | null;
  gameState?: any;
}

interface Evidence {
  result: CombatResult;
  targetName: string;
  targetFamily: string;
  targetUnits: number;
  isMajor: boolean;
  why: string[];
  exposed: string[];
}

const familyLabel = (family?: string) => {
  if (!family) return 'Unknown family';
  return family.charAt(0).toUpperCase() + family.slice(1);
};

const buildEvidence = (result: CombatResult, gameState: any): Evidence => {
  const tile = (gameState?.hexMap || []).find((hex: any) =>
    hex.q === result.q && hex.r === result.r && hex.s === result.s
  );
  const targetUnits = (gameState?.deployedUnits || []).filter((unit: any) =>
    unit.q === result.q && unit.r === result.r && unit.s === result.s && unit.family !== gameState?.playerFamily
  ).length;
  const source = `${result.title} ${result.details}`;
  const isPlanned = /planned|mark|prepared/i.test(source);
  const isBlind = /blind|unscouted|civilian/i.test(source);
  const isMajor = Boolean(tile?.isHeadquarters) || /hq|capo|eliminated|subjugated|assault|assassination/i.test(source);
  const isFortified = (gameState?.fortifiedHexes || []).some((hex: any) =>
    hex.q === result.q && hex.r === result.r && hex.s === result.s
  );
  const isScouted = (gameState?.scoutedHexes || []).some((hex: any) =>
    hex.q === result.q && hex.r === result.r && hex.s === result.s
  );

  const why = [
    isPlanned ? 'Preparation: planned operation' : isBlind ? 'Risk: unscouted engagement' : 'Execution: action resolved on contact',
    isScouted ? 'Intel: target position confirmed' : 'Intel: limited visibility',
    isFortified ? 'Defense: fortified position contested' : 'Position: no fortification detected',
  ];

  const exposed = result.success
    ? [
        targetUnits > 0 ? `${targetUnits} rival unit${targetUnits === 1 ? '' : 's'} remain${targetUnits === 1 ? 's' : ''} in the area` : 'Target position is now open',
        isFortified ? 'Defensive works are compromised' : 'Retaliation risk shifts to nearby territory',
      ]
    : [
        'Your attacking force is exposed after the failed action',
        targetUnits > 0 ? `${targetUnits} rival unit${targetUnits === 1 ? '' : 's'} still hold the position` : 'The target position remains contested',
      ];

  return {
    result,
    targetName: tile?.district || 'Target territory',
    targetFamily: familyLabel(tile?.controllingFamily),
    targetUnits,
    isMajor,
    why,
    exposed,
  };
};

const HitSpotlight: React.FC<HitSpotlightProps> = ({ result, gameState }) => {
  const [queue, setQueue] = useState<CombatResult[]>([]);
  const [active, setActive] = useState<CombatResult | null>(null);
  const seenRef = useRef(new Set<number>());

  useEffect(() => {
    if (!result?.timestamp || seenRef.current.has(result.timestamp)) return;
    seenRef.current.add(result.timestamp);
    setQueue((current) => [...current, result]);
  }, [result]);

  useEffect(() => {
    if (active || queue.length === 0) return;
    const [next, ...rest] = queue;
    setQueue(rest);
    setActive(next);
  }, [active, queue]);

  useEffect(() => {
    if (!active) return;
    const duration = /hq|capo|eliminated|subjugated|assault|assassination/i.test(`${active.title} ${active.details}`) ? 2800 : 1900;
    const timer = window.setTimeout(() => setActive(null), duration);
    return () => window.clearTimeout(timer);
  }, [active]);

  const evidence = useMemo(() => active ? buildEvidence(active, gameState) : null, [active, gameState]);
  const skip = () => setActive(null);

  return (
    <AnimatePresence>
      {evidence && (
        <motion.div
          key={evidence.result.timestamp}
          className="pointer-events-none fixed inset-x-0 top-24 z-[70] flex justify-center px-4"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, transition: { duration: 0.16 } }}
        >
          <motion.section
            role="status"
            aria-live="assertive"
            className={cn(
              'pointer-events-auto w-full max-w-[440px] overflow-hidden border bg-card/95 shadow-2xl backdrop-blur-md',
              evidence.result.success ? 'border-primary/50' : 'border-destructive/60'
            )}
            initial={{ scale: 0.96 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className={cn('h-1 w-full', evidence.result.success ? 'bg-primary' : 'bg-destructive')}>
              <motion.div
                className="h-full origin-left bg-foreground/70"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: evidence.isMajor ? 2.8 : 1.9, ease: 'linear' }}
              />
            </div>

            <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border', evidence.result.success ? 'border-primary/40 text-primary' : 'border-destructive/40 text-destructive')}>
                  {evidence.isMajor ? <Target className="h-5 w-5" /> : evidence.result.success ? <Swords className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="rounded-none text-[9px] uppercase tracking-[0.16em]">Field report</Badge>
                    {evidence.isMajor && <Badge variant="outline" className="rounded-none border-primary/40 text-[9px] uppercase tracking-[0.16em] text-primary">High stakes</Badge>}
                  </div>
                  <h2 className="truncate text-sm font-black uppercase tracking-[0.12em] text-foreground">{evidence.result.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{evidence.targetName} · {evidence.targetFamily}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                data-no-sound
                onClick={skip}
                aria-label="Skip hit spotlight"
                title="Skip hit spotlight"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-3 border-t border-border/60 px-4 py-3 sm:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  <Crosshair className="h-3 w-3" /> Why it worked
                </div>
                <div className="space-y-1.5">
                  {evidence.why.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-[11px] leading-tight text-muted-foreground">
                      <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 text-primary/80" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-destructive">
                  <ShieldAlert className="h-3 w-3" /> Who is exposed
                </div>
                <div className="space-y-1.5">
                  {evidence.exposed.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-[11px] leading-tight text-muted-foreground">
                      <Eye className="mt-0.5 h-3 w-3 shrink-0 text-destructive/80" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-border/60 px-4 py-2 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">Aftermath:</span> {evidence.result.details}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HitSpotlight;
