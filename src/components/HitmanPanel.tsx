import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Crosshair, Star, Skull } from 'lucide-react';
import { Hitman, SoldierStats, HITMAN_REQUIREMENTS, MAX_HITMEN } from '@/types/game-mechanics';

interface HitmanPanelProps {
  hitmen: Hitman[];
  soldierStats: Record<string, SoldierStats>;
  deployedSoldierIds: string[];
  playerFamily: string;
  money: number;
  onPromote: (unitId: string) => void;
}

const HitmanPanel: React.FC<HitmanPanelProps> = ({
  hitmen, soldierStats, deployedSoldierIds, playerFamily, money, onPromote
}) => {
  const eligibleSoldiers = deployedSoldierIds.filter(id => {
    const stats = soldierStats[id];
    if (!stats) return false;
    if (hitmen.some(h => h.unitId === id)) return false;
    return (
      stats.training >= HITMAN_REQUIREMENTS.minStrength &&
      stats.loyalty >= HITMAN_REQUIREMENTS.minReputation &&
      stats.hits >= HITMAN_REQUIREMENTS.minHits &&
      stats.toughness >= HITMAN_REQUIREMENTS.minToughness
    );
  });

  const canPromote = hitmen.length < MAX_HITMEN;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-destructive" />
            Active Hitmen
          </h4>
          <Badge variant="outline" className="text-[10px]">
            {hitmen.length}/{MAX_HITMEN}
          </Badge>
        </div>
        
        {hitmen.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No hitmen promoted yet</p>
        ) : (
          <div className="space-y-2">
            {hitmen.map(h => {
              const stats = soldierStats[h.unitId];
              return (
                <div key={h.unitId} className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1">
                      <Skull className="h-3 w-3 text-destructive" />
                      Hitman Lv.{h.hitmanLevel}
                    </span>
                    <Badge variant="destructive" className="text-[10px]">
                      +{30 + (h.hitmanLevel - 1) * 10}% hit success
                    </Badge>
                  </div>
                  {stats && (
                    <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground mt-1">
                      <span>Hits: {stats.hits}</span>
                      <span>Training: {stats.training}/3</span>
                      <span>Toughness: {stats.toughness}/5</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      <div>
        <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          Eligible for Promotion
        </h4>
        <p className="text-[10px] text-muted-foreground mb-2">
          Requires: {HITMAN_REQUIREMENTS.minHits}+ hits, training ≥{HITMAN_REQUIREMENTS.minStrength}, loyalty ≥{HITMAN_REQUIREMENTS.minReputation}, toughness ≥{HITMAN_REQUIREMENTS.minToughness}
        </p>
        
        {eligibleSoldiers.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No soldiers meet promotion requirements
          </p>
        ) : (
          <div className="space-y-1.5">
            {eligibleSoldiers.map(id => {
              const stats = soldierStats[id]!;
              return (
                <div key={id} className="flex items-center justify-between rounded-lg border border-border bg-card p-2">
                  <div className="text-xs">
                    <span className="font-medium text-foreground">{id.split('-').slice(0, 2).join(' ')}</span>
                    <div className="text-[10px] text-muted-foreground">
                      Hits: {stats.hits} · Train: {stats.training}/3 · Tough: {stats.toughness}/5
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 text-xs"
                    disabled={!canPromote}
                    onClick={() => onPromote(id)}
                  >
                    Promote
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        
        {!canPromote && (
          <p className="text-xs text-destructive mt-2">Max hitmen reached ({MAX_HITMEN})</p>
        )}
      </div>
    </div>
  );
};

export default HitmanPanel;
