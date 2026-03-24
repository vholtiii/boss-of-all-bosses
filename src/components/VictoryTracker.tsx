import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Trophy, MapPin, DollarSign, Crown, Skull } from 'lucide-react';
import { VictoryProgress } from '@/types/game-mechanics';

interface VictoryTrackerProps {
  progress: VictoryProgress;
}

const VictoryTracker: React.FC<VictoryTrackerProps> = ({ progress }) => {
  const conditions = [
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
      key: 'domination',
      label: 'Domination',
      icon: <Skull className="h-3 w-3" />,
      current: progress.domination.eliminated,
      target: progress.domination.target,
      met: progress.domination.met,
      display: `${progress.domination.eliminated}/${progress.domination.target} eliminated`,
    },
  ];

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
      <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 mb-2 uppercase tracking-wider">
        <Trophy className="h-3.5 w-3.5" />
        Victory Conditions
      </h4>
      <div className="space-y-2">
        {conditions.map(c => (
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
              className="h-1.5"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VictoryTracker;
