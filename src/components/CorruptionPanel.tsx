import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Gavel, Shield, Eye, Building2, Crown, Timer } from 'lucide-react';
import { BribeContract, BribeTier, BRIBE_TIERS } from '@/types/game-mechanics';

interface CorruptionPanelProps {
  money: number;
  activeBribes: BribeContract[];
  rivalFamilies: string[];
  reputation: number;
  heat: number;
  gamePhase: number;
  actionsRemaining?: number;
  phaseIsAction?: boolean;
  onBribe: (tier: BribeTier, targetFamily?: string) => void;
}

const tierIcons: Record<BribeTier, React.ReactNode> = {
  patrol_officer: <Shield className="h-4 w-4" />,
  police_captain: <Gavel className="h-4 w-4" />,
  police_chief: <Eye className="h-4 w-4" />,
  mayor: <Crown className="h-4 w-4" />,
};

const CorruptionPanel: React.FC<CorruptionPanelProps> = ({
  money, activeBribes, rivalFamilies, reputation, heat, gamePhase, actionsRemaining = 1, phaseIsAction = true, onBribe
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string>(rivalFamilies[0] || '');

  const getModifiedSuccess = (baseSuccess: number) => {
    let mod = baseSuccess;
    mod += Math.floor(reputation / 10); // reputation helps
    mod -= Math.floor(heat / 5);        // heat hurts
    return Math.max(5, Math.min(95, mod));
  };

  return (
    <div className="space-y-4">
      {/* Active Bribes */}
      {activeBribes.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
            <Timer className="h-4 w-4 text-primary" />
            Active Contracts
          </h4>
          <div className="space-y-1.5">
            {activeBribes.map(b => {
              const config = BRIBE_TIERS.find(t => t.tier === b.tier)!;
              return (
                <div key={b.id} className="rounded-lg border border-primary/30 bg-primary/5 p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground flex items-center gap-1">
                      {tierIcons[b.tier]}
                      {config.label}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {b.turnsRemaining} turns left
                    </Badge>
                  </div>
                  {b.targetFamily && (
                    <span className="text-[10px] text-muted-foreground capitalize">
                      Target: {b.targetFamily}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <Separator className="mt-3" />
        </div>
      )}

      {/* Target Selection for captain/chief/mayor */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Target Rival</h4>
        <div className="flex flex-wrap gap-1">
          {rivalFamilies.map(f => (
            <Button
              key={f}
              size="sm"
              variant={selectedTarget === f ? 'default' : 'outline'}
              className="h-6 text-[10px] capitalize"
              onClick={() => setSelectedTarget(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Bribe Tiers */}
      <div className="space-y-2">
        {BRIBE_TIERS.map(config => {
          const modSuccess = getModifiedSuccess(config.baseSuccess);
          const needsTarget = config.tier !== 'patrol_officer';
          const alreadyActive = activeBribes.some(b => b.tier === config.tier && b.active);
          const canAfford = money >= config.cost;
          const tierPhaseLocked = (config.tier === 'patrol_officer' && gamePhase < 2) || (config.tier !== 'patrol_officer' && gamePhase < 3);

          return (
            <div
              key={config.tier}
              className={cn(
                'rounded-lg border p-3 transition-colors',
                alreadyActive ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  {tierIcons[config.tier]}
                  {config.label}
                </span>
                <span className="text-xs font-bold text-green-400">${config.cost.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">{config.description}</p>
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-muted-foreground">
                  Success: <span className={cn(
                    'font-medium',
                    modSuccess >= 60 ? 'text-green-400' : modSuccess >= 30 ? 'text-yellow-400' : 'text-destructive'
                  )}>{modSuccess}%</span>
                  {' · '}{config.duration} turns
                </div>
                {tierPhaseLocked ? (
                  <span className="text-[10px] text-muted-foreground italic">🔒 Phase {config.tier === 'patrol_officer' ? '2' : '3'}</span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={!canAfford || alreadyActive}
                    onClick={() => onBribe(config.tier, needsTarget ? selectedTarget : undefined)}
                  >
                    {alreadyActive ? 'Active' : 'Bribe'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CorruptionPanel;
