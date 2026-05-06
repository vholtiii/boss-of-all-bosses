import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import { PHASE_CONFIGS } from '@/types/game-mechanics';
import { Crown, MapPin, Users, Store, Clock, Map as MapIcon, ArrowUp, Check } from 'lucide-react';

interface PhaseInfographicProps {
  gamePhase: number;
  turn: number;
  hexMap: any[];
  resources: any;
  units: any[];
  aiOpponents: any[];
  playerFamily: string;
  familyBonuses?: any;
}

const DISTRICT_CONTROL_THRESHOLD = 0.6;

// One-line summary of each phase's defining unlocks
const PHASE_UNLOCKS: Record<number, string[]> = {
  1: ['Claim & extort hexes', 'Recruit soldiers', 'Scout terrain'],
  2: ['Plan Hits unlocked', 'Diplomacy & sitdowns', 'Capo recruitment opens'],
  3: ['Manual claim/extort locked', 'Influence erosion & expansion', 'Hitman contracts ($30k)'],
  4: ['Assault Rival HQ', 'Commission Vote victory path', 'Endgame stakes'],
};

const PhaseInfographic: React.FC<PhaseInfographicProps> = ({
  gamePhase,
  turn,
  hexMap,
  resources,
  units,
  aiOpponents,
  playerFamily,
}) => {
  const playerHexes = hexMap?.filter((h: any) => h.controllingFamily === playerFamily).length || 0;
  const capoCount = (units || []).filter((u: any) => u.family === playerFamily && u.type === 'capo').length;
  const businessCount = hexMap?.filter((h: any) => h.controllingFamily === playerFamily && h.business && !h.business.isExtorted).length || 0;
  const respect = resources?.respect || 0;

  const districtAgg = React.useMemo(() => {
    const counts: Record<string, { fam: number; total: number }> = {};
    (hexMap || []).forEach((h: any) => {
      const d = h?.district;
      if (!d) return;
      if (!counts[d]) counts[d] = { fam: 0, total: 0 };
      counts[d].total++;
      if (h.controllingFamily === playerFamily) counts[d].fam++;
    });
    let controlled = 0;
    let best: { name: string; pct: number } | null = null;
    Object.entries(counts).forEach(([name, c]) => {
      if (c.total === 0) return;
      const pct = c.fam / c.total;
      if (pct >= DISTRICT_CONTROL_THRESHOLD) controlled++;
      if (!best || pct > best.pct) best = { name, pct };
    });
    return { controlled, best };
  }, [hexMap, playerFamily]);

  const nextPhase = gamePhase < 4 ? PHASE_CONFIGS[gamePhase] : null;

  const perfRows = nextPhase ? [
    nextPhase.requirements.minHexes != null && {
      key: 'hexes',
      label: `${nextPhase.requirements.minHexes}+ hexes`,
      icon: <MapPin className="h-3 w-3" />,
      current: playerHexes,
      target: nextPhase.requirements.minHexes,
      met: playerHexes >= nextPhase.requirements.minHexes,
    },
    nextPhase.requirements.minRespect != null && {
      key: 'respect',
      label: `${nextPhase.requirements.minRespect}+ respect`,
      icon: <Crown className="h-3 w-3" />,
      current: respect,
      target: nextPhase.requirements.minRespect,
      met: respect >= nextPhase.requirements.minRespect,
    },
    nextPhase.requirements.minCapos != null && {
      key: 'capos',
      label: `${nextPhase.requirements.minCapos}+ capos`,
      icon: <Users className="h-3 w-3" />,
      current: capoCount,
      target: nextPhase.requirements.minCapos,
      met: capoCount >= nextPhase.requirements.minCapos,
    },
    nextPhase.requirements.minBuiltBusinesses != null && {
      key: 'biz',
      label: `${nextPhase.requirements.minBuiltBusinesses}+ legal business built`,
      icon: <Store className="h-3 w-3" />,
      current: businessCount,
      target: nextPhase.requirements.minBuiltBusinesses,
      met: businessCount >= nextPhase.requirements.minBuiltBusinesses,
      helper: 'Build a Restaurant, Store, or Construction via the Build action.',
    },
    nextPhase.requirements.minControlledDistricts != null && {
      key: 'districts',
      label: `Control ${nextPhase.requirements.minControlledDistricts}+ district (60% of hexes)`,
      icon: <MapIcon className="h-3 w-3" />,
      current: districtAgg.controlled,
      target: nextPhase.requirements.minControlledDistricts,
      met: districtAgg.controlled >= nextPhase.requirements.minControlledDistricts,
      helper: districtAgg.best && districtAgg.controlled < (nextPhase.requirements.minControlledDistricts || 1)
        ? `Closest: ${districtAgg.best.name} at ${Math.round(districtAgg.best.pct * 100)}% (need 60%).`
        : undefined,
    },
    nextPhase.requirements.minIncomeOrHexesOrRespect && {
      key: 'or',
      label: `${nextPhase.requirements.minIncomeOrHexesOrRespect.hexes}+ hexes OR $${(nextPhase.requirements.minIncomeOrHexesOrRespect.income / 1000).toFixed(0)}k income OR ${nextPhase.requirements.minIncomeOrHexesOrRespect.respect}+ respect`,
      icon: <Crown className="h-3 w-3" />,
      current: Math.max(
        playerHexes / nextPhase.requirements.minIncomeOrHexesOrRespect.hexes,
        respect / nextPhase.requirements.minIncomeOrHexesOrRespect.respect,
      ),
      target: 1,
      met: playerHexes >= nextPhase.requirements.minIncomeOrHexesOrRespect.hexes ||
           respect >= nextPhase.requirements.minIncomeOrHexesOrRespect.respect,
      isOr: true,
    },
  ].filter(Boolean) as any[] : [];

  const allPerfMet = perfRows.length > 0 && perfRows.every(r => r.met);
  const turnFloor = nextPhase?.minTurn ?? 1;
  const turnFloorMet = turn >= turnFloor;
  const earnedWaiting = !!nextPhase && allPerfMet && !turnFloorMet;

  // Track previous values for trend arrows
  const prevValuesRef = useRef<Record<string, number>>({});
  const [trends, setTrends] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const next: Record<string, boolean> = {};
    perfRows.forEach(r => {
      const prev = prevValuesRef.current[r.key];
      if (prev != null && r.current > prev) next[r.key] = true;
      prevValuesRef.current[r.key] = r.current;
    });
    setTrends(next);
    if (Object.keys(next).length > 0) {
      const t = setTimeout(() => setTrends({}), 2500);
      return () => clearTimeout(t);
    }
  }, [turn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track rival phase changes
  const prevRivalPhaseRef = useRef<Record<string, number>>({});
  const [rivalJustPromoted, setRivalJustPromoted] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const next: Record<string, boolean> = {};
    (aiOpponents || []).forEach((opp: any) => {
      const p = opp.resources?.cachedPhase || 1;
      const prev = prevRivalPhaseRef.current[opp.family];
      if (prev != null && p > prev) next[opp.family] = true;
      prevRivalPhaseRef.current[opp.family] = p;
    });
    setRivalJustPromoted(next);
    if (Object.keys(next).length > 0) {
      const t = setTimeout(() => setRivalJustPromoted({}), 3000);
      return () => clearTimeout(t);
    }
  }, [turn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown ring on next-phase node when earnedWaiting
  const turnsToFloor = Math.max(0, turnFloor - turn);
  const totalWait = nextPhase ? Math.max(1, nextPhase.minTurn - 1) : 1;
  const ringProgress = earnedWaiting ? Math.max(0, Math.min(1, 1 - turnsToFloor / totalWait)) : 0;
  const ringCirc = 2 * Math.PI * 13;

  const leadingRivalPhase = Math.max(1, ...(aiOpponents || []).map((o: any) => o.resources?.cachedPhase || 1));

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
      <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
        📊 Phase Progression
      </h4>

      {/* Timeline */}
      <div className="flex items-center justify-between gap-0">
        {PHASE_CONFIGS.map((pc, i) => {
          const isCompleted = gamePhase > pc.phase;
          const isCurrent = gamePhase === pc.phase;
          const isLocked = gamePhase < pc.phase;
          const isNextEarned = earnedWaiting && nextPhase?.phase === pc.phase;
          return (
            <React.Fragment key={pc.phase}>
              {i > 0 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-0.5",
                  isCompleted || isCurrent ? "bg-green-500/60" : "bg-muted-foreground/20"
                )} />
              )}
              <HoverCard openDelay={200}>
                <HoverCardTrigger asChild>
                  <div className="flex flex-col items-center gap-0.5 min-w-0 cursor-help">
                    <div className="relative w-7 h-7">
                      {/* Filled disc for completed/current/earned, hollow ring for locked */}
                      <div className={cn(
                        "absolute inset-0 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                        isCompleted && "bg-green-500/30 border-green-500 text-green-300",
                        isCurrent && "bg-primary/25 border-primary text-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]",
                        isNextEarned && "bg-green-500/25 border-green-500 text-green-300 shadow-[0_0_10px_hsl(142_76%_36%/0.55)]",
                        isLocked && !isNextEarned && "bg-transparent border-dashed border-muted-foreground/40 text-muted-foreground/50",
                      )}>
                        <span className="text-[10px]">{pc.icon}</span>
                      </div>
                      {/* Countdown ring overlay when earned-waiting */}
                      {isNextEarned && (
                        <svg className="absolute -inset-1 w-9 h-9 -rotate-90" viewBox="0 0 32 32">
                          <circle
                            cx="16" cy="16" r="13"
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeDasharray={ringCirc}
                            strokeDashoffset={ringCirc * (1 - ringProgress)}
                            className="transition-[stroke-dashoffset] duration-700 ease-out drop-shadow-[0_0_4px_hsl(var(--primary))]"
                          />
                        </svg>
                      )}
                    </div>
                    <span className={cn(
                      "text-[8px] text-center leading-tight max-w-[60px]",
                      isCurrent ? "text-primary font-semibold" : isCompleted ? "text-green-400/80" : isNextEarned ? "text-green-400 font-semibold" : "text-muted-foreground/50"
                    )}>
                      {pc.name.split(' ').slice(0, 2).join(' ')}
                    </span>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent side="bottom" className="w-56 p-3">
                  <p className="text-xs font-bold text-primary mb-1">
                    {pc.icon} Phase {pc.phase}: {pc.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground mb-2">Earliest turn: {pc.minTurn}</p>
                  <ul className="space-y-0.5">
                    {(PHASE_UNLOCKS[pc.phase] || []).map(u => (
                      <li key={u} className="text-[10px] text-foreground flex items-start gap-1">
                        <span className="text-primary mt-0.5">▸</span>{u}
                      </li>
                    ))}
                  </ul>
                </HoverCardContent>
              </HoverCard>
            </React.Fragment>
          );
        })}
      </div>

      {earnedWaiting && (
        <div className="rounded-md border border-green-500/40 bg-green-500/10 px-2 py-1.5">
          <p className="text-[10px] text-green-400 font-semibold">
            ✓ Ready to advance — unlocks Turn {turnFloor} (in {turnFloor - turn} turn{turnFloor - turn === 1 ? '' : 's'})
          </p>
        </div>
      )}

      {nextPhase && perfRows.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground font-medium">
            Next: <span className="text-foreground">{nextPhase.icon} {nextPhase.name}</span>
          </p>
          {perfRows.map((r) => (
            <div key={r.key}>
              <div className="flex items-center justify-between mb-0.5">
                <span className={cn(
                  "text-[10px] flex items-center gap-1",
                  r.met ? "text-green-400" : "text-muted-foreground"
                )}>
                  {/* Filled vs hollow status icon */}
                  <span className={cn(
                    "inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border transition-all",
                    r.met
                      ? "bg-green-500/80 border-green-400 text-noir-dark"
                      : "bg-transparent border-muted-foreground/40 text-muted-foreground"
                  )}>
                    {r.met ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : r.icon}
                  </span>
                  {r.label}
                </span>
                {!r.isOr && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    {trends[r.key] && !r.met && <ArrowUp className="h-2.5 w-2.5 text-green-400 animate-pulse" />}
                    {r.current}/{r.target}
                  </span>
                )}
              </div>
              <Progress
                value={r.target > 0 ? Math.min(100, (r.isOr ? r.current : r.current / r.target) * 100) : 0}
                className="h-1"
              />
              {r.helper && !r.met && (
                <p className="text-[9px] text-muted-foreground/70 italic mt-0.5">{r.helper}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {nextPhase && turnFloor > 1 && (
        <p className={cn(
          "text-[9px] flex items-center gap-1 italic",
          turnFloorMet ? "text-muted-foreground/60" : "text-muted-foreground"
        )}>
          <Clock className="h-3 w-3" />
          {turnFloorMet
            ? `Turn floor cleared — focus on requirements above`
            : `Earliest: Turn ${turnFloor} (currently ${turn})`}
        </p>
      )}

      {gamePhase >= 4 && (
        <p className="text-[10px] text-primary font-semibold text-center">👑 Final Phase — Seize total control!</p>
      )}
      {gamePhase === 3 && (
        <p className="text-[10px] text-amber-400 font-semibold text-center">🔒 Claiming & Extortion disabled — territory shifts through influence</p>
      )}

      {aiOpponents && aiOpponents.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium">Rival Phases:</p>
          <div className="grid grid-cols-2 gap-1">
            {aiOpponents.map((opp: any) => {
              const oppPhase = opp.resources?.cachedPhase || 1;
              const isLeader = oppPhase === leadingRivalPhase && oppPhase >= gamePhase;
              const promoted = rivalJustPromoted[opp.family];
              return (
                <div key={opp.family} className="flex items-center gap-1.5">
                  {isLeader && <Crown className="h-2.5 w-2.5 text-amber-400 shrink-0" />}
                  <span className="text-[10px] capitalize text-muted-foreground truncate flex-1">{opp.family}</span>
                  {promoted && <ArrowUp className="h-2.5 w-2.5 text-destructive animate-pulse" />}
                  <Badge variant="outline" className={cn(
                    "text-[9px] px-1.5 h-4 transition-colors",
                    promoted && "border-destructive bg-destructive/20",
                    !promoted && (oppPhase >= gamePhase ? "border-destructive/50 text-destructive" : "border-muted-foreground/30 text-muted-foreground")
                  )}>
                    P{oppPhase}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhaseInfographic;
