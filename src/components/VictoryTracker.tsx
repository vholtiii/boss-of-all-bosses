import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Trophy, MapPin, DollarSign, Crown, Skull, Vote } from 'lucide-react';
import { VictoryProgress, CORONATION_QUALIFIER_BUFF_CAP } from '@/types/game-mechanics';

interface VictoryTrackerProps {
  progress: VictoryProgress;
  gamePhase?: number;
}

const VictoryTracker: React.FC<VictoryTrackerProps> = ({ progress, gamePhase = 1 }) => {
  // Compute current qualifier buff (each qualifier met = +1 vote, capped)
  const qualifiersMet = [
    progress.territory.met,
    progress.economic.met,
    progress.legacy.met,
    progress.ironFist.met,
  ].filter(Boolean).length;
  const buff = Math.min(qualifiersMet, CORONATION_QUALIFIER_BUFF_CAP);

  const qualifiers = [
    {
      key: 'territory',
      label: 'Territory',
      icon: <MapPin className="h-3 w-3" />,
      current: progress.territory.current,
      target: progress.territory.target,
      met: progress.territory.met,
      display: `${progress.territory.current}/${progress.territory.target} hexes`,
    },
    {
      key: 'economic',
      label: 'Economic',
      icon: <DollarSign className="h-3 w-3" />,
      current: progress.economic.current,
      target: progress.economic.target,
      met: progress.economic.met,
      display: `$${progress.economic.current.toLocaleString()}/$${progress.economic.target.toLocaleString()}`,
    },
    {
      key: 'legacy',
      label: 'Legacy',
      icon: <Crown className="h-3 w-3" />,
      current: progress.legacy.current,
      target: progress.legacy.highestRival,
      met: progress.legacy.met,
      display: `${progress.legacy.current} vs ${progress.legacy.highestRival}`,
    },
    {
      key: 'ironFist',
      label: 'Iron Fist',
      icon: <Skull className="h-3 w-3" />,
      current: progress.ironFist.eliminated,
      target: progress.ironFist.target,
      met: progress.ironFist.met,
      display: `${progress.ironFist.eliminated}/${progress.ironFist.target} broken (${progress.ironFist.survivorFloor}+ survive)`,
    },
  ];

  const commission = {
    current: progress.commission?.supporting || 0,
    target: progress.commission?.needed || 0,
    met: progress.commission?.met || false,
    display: gamePhase >= 4
      ? `${progress.commission?.supporting || 0}/${progress.commission?.needed || '?'} votes`
      : '🔒 Phase 4',
    locked: gamePhase < 4,
  };

  return (
    <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-3 space-y-3">
      {/* COMMISSION — ultimate goal, gold-bordered */}
      <div className={cn(
        "rounded-md border p-2.5",
        commission.met
          ? "border-amber-400 bg-amber-500/15 shadow-[0_0_12px_hsl(45_100%_55%/0.35)]"
          : "border-amber-500/60 bg-amber-500/5"
      )}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5" />
            Ultimate Goal — Coronation
          </span>
          {commission.met && <Badge variant="default" className="h-4 text-[9px] px-1.5 bg-amber-500 text-noir-dark">WON</Badge>}
        </div>
        <div className="flex items-center justify-between mb-1">
          <span className={cn(
            'text-[11px] font-semibold flex items-center gap-1',
            commission.locked ? 'text-muted-foreground' : 'text-foreground'
          )}>
            <Vote className="h-3 w-3" /> Commission Vote
          </span>
          <span className="text-[10px] text-muted-foreground">{commission.display}</span>
        </div>
        <Progress
          value={commission.target > 0 ? Math.min(100, (commission.current / commission.target) * 100) : 0}
          className="h-1.5"
        />
        {buff > 0 && !commission.met && (
          <p className="text-[9px] text-amber-300/90 mt-1 italic">
            +{buff} qualifier vote{buff === 1 ? '' : 's'} earned (max +{CORONATION_QUALIFIER_BUFF_CAP})
          </p>
        )}
      </div>

      {/* QUALIFIERS — smaller, supporting paths */}
      <div>
        <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
          Qualifying Paths <span className="text-amber-400/80">(+1 vote each, max +{CORONATION_QUALIFIER_BUFF_CAP})</span>
        </h4>
        <div className="space-y-1.5">
          {qualifiers.map(c => (
            <div key={c.key}>
              <div className="flex items-center justify-between mb-0.5">
                <span className={cn(
                  'text-[10px] font-medium flex items-center gap-1',
                  c.met ? 'text-green-400' : 'text-muted-foreground'
                )}>
                  {c.icon} {c.label}
                  {c.met && <Badge variant="default" className="h-3.5 text-[8px] px-1 bg-green-500">✓</Badge>}
                </span>
                <span className="text-[10px] text-muted-foreground">{c.display}</span>
              </div>
              <Progress
                value={c.target > 0 ? Math.min(100, (c.current / c.target) * 100) : 0}
                className="h-1"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VictoryTracker;
