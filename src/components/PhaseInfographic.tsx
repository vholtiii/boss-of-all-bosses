import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { PHASE_CONFIGS } from '@/types/game-mechanics';
import { Crown, MapPin, Users, Store, Clock } from 'lucide-react';

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

const PhaseInfographic: React.FC<PhaseInfographicProps> = ({
  gamePhase,
  turn,
  hexMap,
  resources,
  units,
  aiOpponents,
  playerFamily,
}) => {
  // Compute player metrics
  const playerHexes = hexMap?.filter((h: any) => h.controllingFamily === playerFamily).length || 0;
  const capoCount = (units || []).filter((u: any) => u.family === playerFamily && u.type === 'capo').length;
  const businessCount = hexMap?.filter((h: any) => h.controllingFamily === playerFamily && h.business && !h.business.isExtorted).length || 0;
  const respect = resources?.respect || 0;

  // Next phase requirements
  const nextPhase = gamePhase < 4 ? PHASE_CONFIGS[gamePhase] : null; // gamePhase is 1-indexed, array is 0-indexed so [gamePhase] = next

  const requirementRows = nextPhase ? [
    nextPhase.requirements.minHexes != null && {
      label: `${nextPhase.requirements.minHexes}+ hexes`,
      icon: <MapPin className="h-3 w-3" />,
      current: playerHexes,
      target: nextPhase.requirements.minHexes,
      met: playerHexes >= nextPhase.requirements.minHexes,
    },
    nextPhase.requirements.minRespect != null && {
      label: `${nextPhase.requirements.minRespect}+ respect`,
      icon: <Crown className="h-3 w-3" />,
      current: respect,
      target: nextPhase.requirements.minRespect,
      met: respect >= nextPhase.requirements.minRespect,
    },
    nextPhase.requirements.minCapos != null && {
      label: `${nextPhase.requirements.minCapos}+ capos`,
      icon: <Users className="h-3 w-3" />,
      current: capoCount,
      target: nextPhase.requirements.minCapos,
      met: capoCount >= nextPhase.requirements.minCapos,
    },
    nextPhase.requirements.minBuiltBusinesses != null && {
      label: `${nextPhase.requirements.minBuiltBusinesses}+ legal business built`,
      icon: <Store className="h-3 w-3" />,
      current: businessCount,
      target: nextPhase.requirements.minBuiltBusinesses,
      met: businessCount >= nextPhase.requirements.minBuiltBusinesses,
      helper: 'Build a Restaurant, Store, or Construction via the Build action.',
    },
    nextPhase.minTurn > 1 && {
      label: `Turn ${nextPhase.minTurn}+`,
      icon: <Clock className="h-3 w-3" />,
      current: turn,
      target: nextPhase.minTurn,
      met: turn >= nextPhase.minTurn,
    },
    nextPhase.requirements.minIncomeOrHexesOrRespect && {
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
          return (
            <React.Fragment key={pc.phase}>
              {i > 0 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-0.5",
                  isCompleted || isCurrent ? "bg-green-500/60" : "bg-muted-foreground/20"
                )} />
              )}
              <div className="flex flex-col items-center gap-0.5 min-w-0">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                  isCompleted && "bg-green-500/20 border-green-500 text-green-400",
                  isCurrent && "bg-primary/20 border-primary text-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)] animate-pulse",
                  isLocked && "bg-muted/30 border-muted-foreground/30 text-muted-foreground/50",
                )}>
                  <span className="text-[10px]">{pc.icon}</span>
                </div>
                <span className={cn(
                  "text-[8px] text-center leading-tight max-w-[60px]",
                  isCurrent ? "text-primary font-semibold" : isCompleted ? "text-green-400/80" : "text-muted-foreground/50"
                )}>
                  {pc.name.split(' ').slice(0, 2).join(' ')}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Requirements for next phase */}
      {nextPhase && requirementRows.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground font-medium">
            Next: <span className="text-foreground">{nextPhase.icon} {nextPhase.name}</span>
          </p>
          {requirementRows.map((r, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-0.5">
                <span className={cn(
                  "text-[10px] flex items-center gap-1",
                  r.met ? "text-green-400" : "text-muted-foreground"
                )}>
                  {r.icon} {r.label}
                  {r.met && <span className="text-green-500">✓</span>}
                </span>
                {!r.isOr && (
                  <span className="text-[10px] text-muted-foreground">{r.current}/{r.target}</span>
                )}
              </div>
              <Progress
                value={r.target > 0 ? Math.min(100, (r.isOr ? r.current : r.current / r.target) * 100) : 0}
                className="h-1"
              />
            </div>
          ))}
        </div>
      )}

      {gamePhase >= 4 && (
        <p className="text-[10px] text-primary font-semibold text-center">👑 Final Phase — Seize total control!</p>
      )}

      {gamePhase === 3 && (
        <p className="text-[10px] text-amber-400 font-semibold text-center">🔒 Claiming & Extortion disabled — territory shifts through influence</p>
      )}

      {/* Rival phases */}
      {aiOpponents && aiOpponents.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium">Rival Phases:</p>
          <div className="grid grid-cols-2 gap-1">
            {aiOpponents.map((opp: any) => {
              const oppPhase = opp.resources?.cachedPhase || 1;
              return (
                <div key={opp.family} className="flex items-center gap-1.5">
                  <span className="text-[10px] capitalize text-muted-foreground truncate flex-1">{opp.family}</span>
                  <Badge variant="outline" className={cn(
                    "text-[9px] px-1.5 h-4",
                    oppPhase >= gamePhase ? "border-destructive/50 text-destructive" : "border-muted-foreground/30 text-muted-foreground"
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
