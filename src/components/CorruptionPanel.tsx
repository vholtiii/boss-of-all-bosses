import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Gavel, Shield, Eye, Crown, Timer, Sparkles } from 'lucide-react';
import { BribeContract, BribeTier, BRIBE_TIERS } from '@/types/game-mechanics';

interface CorruptionPanelProps {
  money: number;
  activeBribes: BribeContract[];
  rivalFamilies: string[];
  reputation: number;
  heat: number;
  gamePhase: number;
  actionsRemaining?: number;
  phaseIsTactical?: boolean;
  onBribe: (tier: BribeTier, targetFamily?: string) => void;
}

const tierIcons: Record<BribeTier, React.ReactNode> = {
  patrol_officer: <Shield className="h-4 w-4" />,
  police_captain: <Gavel className="h-4 w-4" />,
  police_chief: <Eye className="h-4 w-4" />,
  mayor: <Crown className="h-4 w-4" />,
};

const successBand = (n: number) =>
  n >= 60 ? 'text-green-400' : n >= 30 ? 'text-yellow-400' : 'text-destructive';

// Tiny circular ring for active-bribe progress
const ProgressRing: React.FC<{ value: number; total: number }> = ({ value, total }) => {
  const pct = Math.max(0, Math.min(1, value / Math.max(1, total)));
  const r = 10;
  const c = 2 * Math.PI * r;
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" className="shrink-0">
      <circle cx="14" cy="14" r={r} stroke="hsl(var(--border))" strokeWidth="3" fill="none" />
      <circle
        cx="14"
        cy="14"
        r={r}
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 14 14)"
      />
      <text
        x="14"
        y="15"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="9"
        fontWeight="700"
        fill="hsl(var(--foreground))"
      >
        {value}
      </text>
    </svg>
  );
};

const CorruptionPanel: React.FC<CorruptionPanelProps> = ({
  money,
  activeBribes,
  rivalFamilies,
  reputation,
  heat,
  gamePhase,
  actionsRemaining = 1,
  phaseIsTactical = true,
  onBribe,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string>(rivalFamilies[0] || '');
  const [pendingTier, setPendingTier] = useState<BribeTier | null>(null);

  const getModifiedSuccess = (baseSuccess: number) => {
    let mod = baseSuccess;
    mod += Math.floor(reputation / 10);
    mod -= Math.floor(heat / 5);
    return Math.max(5, Math.min(95, mod));
  };

  const activeMap = new Map(activeBribes.filter(b => b.active).map(b => [b.tier, b]));
  const allActive = BRIBE_TIERS.every(t => activeMap.has(t.tier));
  const noBudget = !phaseIsTactical || actionsRemaining <= 0;
  const showTargetPicker =
    !!pendingTier && pendingTier !== 'patrol_officer' && !activeMap.has(pendingTier);

  return (
    <div className="space-y-3">
      {/* Header strip */}
      <div
        className={cn(
          'flex items-center justify-between rounded-md border px-2 py-1.5',
          phaseIsTactical
            ? 'border-primary/30 bg-primary/5'
            : 'border-border bg-muted/30 opacity-80'
        )}
      >
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide">
          <Sparkles className="h-3 w-3 text-primary" />
          {phaseIsTactical ? (
            <span className="text-foreground">
              Tactical · <span className="text-primary">{actionsRemaining}</span> action
              {actionsRemaining === 1 ? '' : 's'}
            </span>
          ) : (
            <span className="text-muted-foreground">Available in Tactical step</span>
          )}
        </div>
        <Badge variant="outline" className="text-[10px]">
          {activeMap.size}/{BRIBE_TIERS.length} active
        </Badge>
      </div>

      {/* Target picker — only when arming a tier that requires a target */}
      {showTargetPicker && rivalFamilies.length > 0 && (
        <div className="rounded-md border border-border bg-card p-2">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">
            Choose target rival
          </div>
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
          <div className="mt-2 flex justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[10px]"
              onClick={() => setPendingTier(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-6 text-[10px]"
              disabled={!selectedTarget || noBudget}
              onClick={() => {
                if (pendingTier) {
                  onBribe(pendingTier, selectedTarget);
                  setPendingTier(null);
                }
              }}
            >
              Confirm Bribe
            </Button>
          </div>
        </div>
      )}

      {/* Tier rows */}
      <div className="space-y-1.5">
        {BRIBE_TIERS.map(config => {
          const modSuccess = getModifiedSuccess(config.baseSuccess);
          const needsTarget = config.tier !== 'patrol_officer';
          const active = activeMap.get(config.tier);
          const isActive = !!active;
          const canAfford = money >= config.cost;
          const tierPhaseLocked =
            (config.tier === 'patrol_officer' && gamePhase < 2) ||
            (config.tier !== 'patrol_officer' && gamePhase < 3);

          const state: 'locked' | 'active' | 'unaffordable' | 'available' = tierPhaseLocked
            ? 'locked'
            : isActive
              ? 'active'
              : !canAfford
                ? 'unaffordable'
                : 'available';

          const chipCls = cn(
            'flex h-8 w-8 items-center justify-center rounded-full border shrink-0',
            state === 'locked' && 'border-border bg-muted/40 text-muted-foreground',
            state === 'active' && 'border-primary/60 bg-primary/15 text-primary',
            state === 'unaffordable' && 'border-destructive/40 bg-destructive/5 text-destructive',
            state === 'available' && 'border-border bg-card text-foreground'
          );

          return (
            <div
              key={config.tier}
              className={cn(
                'flex items-center gap-2 rounded-lg border p-2 transition-colors',
                state === 'active'
                  ? 'border-primary/50 bg-primary/5'
                  : state === 'locked'
                    ? 'border-border/60 bg-muted/20 opacity-70'
                    : 'border-border bg-card'
              )}
            >
              <div className={chipCls}>{tierIcons[config.tier]}</div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-bold text-foreground">
                    {config.label}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-bold shrink-0',
                      canAfford ? 'text-green-400' : 'text-destructive'
                    )}
                  >
                    ${config.cost.toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                  {config.description}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span>
                    Success:{' '}
                    <span className={cn('font-medium', successBand(modSuccess))}>
                      {modSuccess}%
                    </span>
                  </span>
                  <span>·</span>
                  <span>{config.duration}t</span>
                  <span>·</span>
                  <span>1 action</span>
                  {isActive && active?.targetFamily && (
                    <>
                      <span>·</span>
                      <span className="capitalize text-primary/90">
                        target {active.targetFamily}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                {state === 'locked' ? (
                  <span className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                    🔒 Phase {config.tier === 'patrol_officer' ? '2' : '3'}
                  </span>
                ) : state === 'active' ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <ProgressRing
                      value={active!.turnsRemaining}
                      total={config.duration}
                    />
                    <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                      <Timer className="h-2.5 w-2.5" />
                      left
                    </span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant={state === 'unaffordable' ? 'outline' : 'default'}
                    className="h-7 text-xs"
                    disabled={!canAfford || noBudget}
                    title={
                      !phaseIsTactical
                        ? 'Available in Tactical step'
                        : actionsRemaining <= 0
                          ? 'No tactical actions left'
                          : !canAfford
                            ? `Need $${config.cost.toLocaleString()}`
                            : undefined
                    }
                    onClick={() => {
                      if (needsTarget) {
                        setPendingTier(config.tier);
                      } else {
                        onBribe(config.tier);
                      }
                    }}
                  >
                    {!phaseIsTactical
                      ? 'Tactical'
                      : actionsRemaining <= 0
                        ? 'No actions'
                        : !canAfford
                          ? 'Funds'
                          : needsTarget
                            ? 'Arm…'
                            : 'Bribe'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allActive && (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5 text-center text-[10px] font-semibold text-primary">
          All channels engaged
        </div>
      )}
    </div>
  );
};

export default CorruptionPanel;
