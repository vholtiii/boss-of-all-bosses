import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Crown, CheckCircle2, XCircle, Users, Clock } from 'lucide-react';
import {
  SoldierStats,
  CAPO_PROMOTION_REQUIREMENTS,
  CAPO_PROMOTION_COST,
  MAX_CAPOS,
  CAPO_PROMOTION_LOYALTY_THRESHOLD,
  isCapoPromotionEligible,
  getCapoPromotionCost,
} from '@/types/game-mechanics';

interface CapoPromotionPanelProps {
  capoCount: number;
  soldierStats: Record<string, SoldierStats>;
  deployedSoldierIds: string[];
  hitmanIds: string[];
  money: number;
  onPromote: (unitId: string) => void;
  onHighlightSoldier?: (unitId: string) => void;
  pendingPromotionIds?: string[];
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
  capoCount, soldierStats, deployedSoldierIds, hitmanIds, money, onPromote, onHighlightSoldier, pendingPromotionIds = [],
}) => {
  const hasSlot = capoCount < MAX_CAPOS;
  const { maxThreshold, discountedThreshold, balancedThreshold } = CAPO_PROMOTION_REQUIREMENTS;

  const soldiers = deployedSoldierIds
    .filter(id => !hitmanIds.includes(id))
    .map(id => {
      const stats = soldierStats[id];
      if (!stats) return null;
      const isPending = pendingPromotionIds.includes(id);
      const eligible = isCapoPromotionEligible(stats);
      const cost = getCapoPromotionCost(stats);
      const hasDiscount = stats.loyalty >= CAPO_PROMOTION_LOYALTY_THRESHOLD;
      
      // Determine which path is closest
      const vMaxed = stats.victories >= maxThreshold;
      const rMaxed = stats.racketeering >= maxThreshold;
      let pathLabel = '';
      if (vMaxed && stats.racketeering >= discountedThreshold) pathLabel = 'Victory path';
      else if (rMaxed && stats.victories >= discountedThreshold) pathLabel = 'Racketeer path';
      else if (stats.victories >= balancedThreshold && stats.racketeering >= balancedThreshold) pathLabel = 'Balanced path';
      
      return { id, stats, eligible, cost, hasDiscount, isPending, vMaxed, rMaxed, pathLabel };
    })
    .filter(Boolean) as Array<{
      id: string; stats: SoldierStats; eligible: boolean; cost: number;
      hasDiscount: boolean; isPending: boolean; vMaxed: boolean; rMaxed: boolean; pathLabel: string;
    }>;

  const eligibleCount = soldiers.filter(s => s.eligible && !s.isPending).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          Capo Promotion
        </h4>
        <Badge variant="outline" className="text-[10px]">
          {capoCount}/{MAX_CAPOS} Capos
        </Badge>
      </div>

      <div className="text-[10px] text-muted-foreground space-y-0.5">
        <p>Cost: <span className="text-foreground">${CAPO_PROMOTION_COST.toLocaleString()}</span> <span className="text-green-400">(${getCapoPromotionCost({ loyalty: CAPO_PROMOTION_LOYALTY_THRESHOLD } as SoldierStats).toLocaleString()} with loyalty {CAPO_PROMOTION_LOYALTY_THRESHOLD})</span></p>
        <p className="font-medium text-foreground/80">Three paths to promotion:</p>
        <p>• Max Victories ({maxThreshold}) + Racketeering ≥{discountedThreshold}</p>
        <p>• Max Racketeering ({maxThreshold}) + Victories ≥{discountedThreshold}</p>
        <p>• Both ≥{balancedThreshold} (balanced)</p>
        <p className="text-yellow-400/80">⏳ 1-turn ceremony — soldier cannot act during promotion</p>
      </div>

      {!hasSlot && (
        <p className="text-xs text-destructive">Max capos reached ({MAX_CAPOS})</p>
      )}

      <Separator />

      {soldiers.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No deployed soldiers available</p>
      ) : (
        <div className="space-y-2">
          {soldiers
            .sort((a, b) => {
              if (a.isPending !== b.isPending) return a.isPending ? -1 : 1;
              return (b.eligible ? 1 : 0) - (a.eligible ? 1 : 0);
            })
            .map(s => (
              <div
                key={s.id}
                className={`rounded-lg border p-2.5 cursor-pointer transition-colors hover:border-primary/50 ${
                  s.isPending
                    ? 'border-yellow-500/50 bg-yellow-500/10'
                    : s.eligible
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-card'
                }`}
                onClick={() => onHighlightSoldier?.(s.id)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {s.id.split('-').slice(0, 2).join(' ')}
                  </span>
                  {s.isPending ? (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-yellow-500/50 text-yellow-400">
                      <Clock className="h-2.5 w-2.5 mr-0.5" />
                      In Ceremony
                    </Badge>
                  ) : s.eligible ? (
                    <Badge variant="default" className="text-[9px] px-1.5 py-0">
                      Eligible
                    </Badge>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-0.5 mb-2">
                  <Req met={s.stats.victories >= maxThreshold} label={`Victories: ${s.stats.victories}/${maxThreshold}${s.stats.victories >= maxThreshold ? ' ✦ MAXED' : ''}`} />
                  <Req met={s.stats.racketeering >= maxThreshold} label={`Racketeering: ${s.stats.racketeering}/${maxThreshold}${s.stats.racketeering >= maxThreshold ? ' ✦ MAXED' : ''}`} />
                  {/* Show balanced path progress if neither is maxed */}
                  {!s.vMaxed && !s.rMaxed && (
                    <Req 
                      met={s.stats.victories >= balancedThreshold && s.stats.racketeering >= balancedThreshold} 
                      label={`Balanced path: both ≥${balancedThreshold}`} 
                    />
                  )}
                  {s.pathLabel && (
                    <span className="text-[9px] text-primary/70 ml-4">→ {s.pathLabel}</span>
                  )}
                </div>

                {s.hasDiscount && !s.isPending && (
                  <p className="text-[9px] text-green-400 mb-1">💰 Loyalty bonus: 25% off (${s.cost.toLocaleString()})</p>
                )}

                {s.eligible && !s.isPending && (
                  <Button
                    size="sm"
                    className="w-full h-7 text-xs"
                    disabled={money < s.cost || !hasSlot}
                    onClick={(e) => { e.stopPropagation(); onPromote(s.id); }}
                  >
                    <Crown className="h-3 w-3 mr-1" />
                    Promote to Capo · ${s.cost.toLocaleString()}
                  </Button>
                )}

                {s.isPending && (
                  <p className="text-[9px] text-yellow-400 italic text-center">🎖️ Being made — will become Capo next turn</p>
                )}
              </div>
            ))}
        </div>
      )}

      {eligibleCount > 0 && soldiers.filter(s => s.eligible && !s.isPending).every(s => money < s.cost) && (
        <p className="text-xs text-destructive">Not enough money for promotion</p>
      )}
    </div>
  );
};

export default CapoPromotionPanel;
