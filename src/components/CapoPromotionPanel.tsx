import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Crown, CheckCircle2, XCircle, Users } from 'lucide-react';
import {
  SoldierStats,
  CAPO_PROMOTION_REQUIREMENTS,
  CAPO_PROMOTION_COST,
  MAX_CAPOS,
} from '@/types/game-mechanics';

interface CapoPromotionPanelProps {
  capoCount: number;
  soldierStats: Record<string, SoldierStats>;
  deployedSoldierIds: string[];
  hitmanIds: string[];
  money: number;
  onPromote: (unitId: string) => void;
}

const Req: React.FC<{ met: boolean; label: string }> = ({ met, label }) => (
  <div className="flex items-center gap-1.5 text-[10px]">
    {met
      ? <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
      : <XCircle className="h-3 w-3 text-destructive shrink-0" />}
    <span className={met ? 'text-green-400' : 'text-muted-foreground'}>{label}</span>
  </div>
);

const CapoPromotionPanel: React.FC<CapoPromotionPanelProps> = ({
  capoCount, soldierStats, deployedSoldierIds, hitmanIds, money, onPromote,
}) => {
  const canAfford = money >= CAPO_PROMOTION_COST;
  const hasSlot = capoCount < MAX_CAPOS;

  // Build soldier eligibility data
  const soldiers = deployedSoldierIds
    .filter(id => !hitmanIds.includes(id))
    .map(id => {
      const stats = soldierStats[id];
      if (!stats) return null;
      const meetsVictories = stats.survivedConflicts >= CAPO_PROMOTION_REQUIREMENTS.minVictories;
      const meetsLoyalty = stats.loyalty >= CAPO_PROMOTION_REQUIREMENTS.minLoyalty;
      const meetsTraining = stats.training >= CAPO_PROMOTION_REQUIREMENTS.minTraining;
      const eligible = meetsVictories && meetsLoyalty && meetsTraining;
      return { id, stats, meetsVictories, meetsLoyalty, meetsTraining, eligible };
    })
    .filter(Boolean) as Array<{
      id: string; stats: SoldierStats;
      meetsVictories: boolean; meetsLoyalty: boolean; meetsTraining: boolean; eligible: boolean;
    }>;

  const eligibleCount = soldiers.filter(s => s.eligible).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          Capo Promotion
        </h4>
        <Badge variant="outline" className="text-[10px]">
          {capoCount}/{MAX_CAPOS} Capos
        </Badge>
      </div>

      {/* Cost info */}
      <div className="text-[10px] text-muted-foreground space-y-0.5">
        <p>Cost: <span className={canAfford ? 'text-green-400' : 'text-destructive'}>
          ${CAPO_PROMOTION_COST.toLocaleString()}
        </span></p>
        <p>Requires: {CAPO_PROMOTION_REQUIREMENTS.minVictories} victories, {CAPO_PROMOTION_REQUIREMENTS.minLoyalty} loyalty, {CAPO_PROMOTION_REQUIREMENTS.minTraining} training</p>
      </div>

      {!hasSlot && (
        <p className="text-xs text-destructive">Max capos reached ({MAX_CAPOS})</p>
      )}

      <Separator />

      {/* Soldier list with requirements checklist */}
      {soldiers.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No deployed soldiers available</p>
      ) : (
        <div className="space-y-2">
          {/* Eligible first, then ineligible */}
          {soldiers
            .sort((a, b) => (b.eligible ? 1 : 0) - (a.eligible ? 1 : 0))
            .map(s => (
              <div
                key={s.id}
                className={`rounded-lg border p-2.5 ${
                  s.eligible
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {s.id.split('-').slice(0, 2).join(' ')}
                  </span>
                  {s.eligible && (
                    <Badge variant="default" className="text-[9px] px-1.5 py-0">
                      Eligible
                    </Badge>
                  )}
                </div>

                {/* Requirements checklist */}
                <div className="grid grid-cols-1 gap-0.5 mb-2">
                  <Req met={s.meetsVictories} label={`Victories: ${s.stats.survivedConflicts}/${CAPO_PROMOTION_REQUIREMENTS.minVictories}`} />
                  <Req met={s.meetsLoyalty} label={`Loyalty: ${s.stats.loyalty}/${CAPO_PROMOTION_REQUIREMENTS.minLoyalty}`} />
                  <Req met={s.meetsTraining} label={`Training: ${s.stats.training}/${CAPO_PROMOTION_REQUIREMENTS.minTraining}`} />
                </div>

                {s.eligible && (
                  <Button
                    size="sm"
                    className="w-full h-7 text-xs"
                    disabled={!canAfford || !hasSlot}
                    onClick={() => onPromote(s.id)}
                  >
                    <Crown className="h-3 w-3 mr-1" />
                    Promote to Capo · ${CAPO_PROMOTION_COST.toLocaleString()}
                  </Button>
                )}
              </div>
            ))}
        </div>
      )}

      {eligibleCount > 0 && !canAfford && (
        <p className="text-xs text-destructive">Not enough money for promotion</p>
      )}
    </div>
  );
};

export default CapoPromotionPanel;
