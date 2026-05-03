import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Crosshair, Clock, DollarSign, Users, Eye, Lock, Shield, Building2, Crown } from 'lucide-react';
import { HitmanContract, HITMAN_CONTRACT_COST, MAX_HITMEN, BribeContract } from '@/types/game-mechanics';
import { DeployedUnit } from '@/hooks/useEnhancedMafiaGameState';

interface HitmanPanelProps {
  hitmanContracts: HitmanContract[];
  deployedUnits: DeployedUnit[];
  playerFamily: string;
  money: number;
  currentTurn: number;
  gamePhase: number;
  activeBribes?: BribeContract[];
  actionsRemaining?: number;
  phaseIsAction?: boolean;
  onHire: (targetUnitId: string, targetFamily: string) => void;
}

type BlindTier = 'police_captain' | 'police_chief' | 'mayor';
type BlindSource = { tier: BlindTier; scope: 'targeted' | 'map-wide' };

const TIER_RANK: Record<BlindTier, number> = { police_captain: 1, police_chief: 2, mayor: 3 };

const TIER_META: Record<BlindTier, { label: string; chip: string; icon: React.ReactNode; scopeLabel: string }> = {
  police_captain: {
    label: 'Police Captain',
    chip: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    icon: <Shield className="h-3 w-3" />,
    scopeLabel: 'target intel',
  },
  police_chief: {
    label: 'Police Chief',
    chip: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
    icon: <Building2 className="h-3 w-3" />,
    scopeLabel: 'map-wide intel',
  },
  mayor: {
    label: 'Mayor',
    chip: 'border-yellow-400/50 bg-yellow-400/10 text-yellow-200',
    icon: <Crown className="h-3 w-3" />,
    scopeLabel: 'full map intel',
  },
};

const ALL_FAMILIES = ['gambino', 'genovese', 'lucchese', 'bonanno', 'colombo'];

const HitmanPanel: React.FC<HitmanPanelProps> = ({
  hitmanContracts, deployedUnits, playerFamily, money, currentTurn, gamePhase, activeBribes = [], actionsRemaining = 1, phaseIsAction = true, onHire
}) => {
  const [selecting, setSelecting] = useState(false);
  const [tab, setTab] = useState<'known' | 'blind'>('known');

  const phaseLocked = gamePhase < 3;
  const noActions = !phaseIsAction || actionsRemaining <= 0;
  const canHire = !phaseLocked && hitmanContracts.length < MAX_HITMEN && money >= HITMAN_CONTRACT_COST && !noActions;

  // Build blind eligibility: family → highest-tier intel source
  const blindEligibility = new Map<string, BlindSource>();
  const upgrade = (fam: string, src: BlindSource) => {
    const cur = blindEligibility.get(fam);
    if (!cur || TIER_RANK[src.tier] > TIER_RANK[cur.tier]) blindEligibility.set(fam, src);
  };
  activeBribes.forEach(b => {
    if (!b.active) return;
    if (b.tier === 'police_captain' && b.targetFamily) {
      upgrade(b.targetFamily, { tier: 'police_captain', scope: 'targeted' });
    }
    if (b.tier === 'police_chief') {
      const scope: BlindSource = { tier: 'police_chief', scope: b.targetFamily ? 'targeted' : 'map-wide' };
      if (b.targetFamily) upgrade(b.targetFamily, scope);
      else ALL_FAMILIES.forEach(f => { if (f !== playerFamily) upgrade(f, scope); });
    }
    if (b.tier === 'mayor') {
      const scope: BlindSource = { tier: 'mayor', scope: b.targetFamily ? 'targeted' : 'map-wide' };
      if (b.targetFamily) upgrade(b.targetFamily, scope);
      else ALL_FAMILIES.forEach(f => { if (f !== playerFamily) upgrade(f, scope); });
    }
  });

  // Patrol-only families (have a bribe but no intel)
  const patrolOnlyFamilies = new Set<string>();
  activeBribes.forEach(b => {
    if (!b.active || b.tier !== 'patrol_officer' || !b.targetFamily) return;
    if (!blindEligibility.has(b.targetFamily)) patrolOnlyFamilies.add(b.targetFamily);
  });

  const hasAnyBlindIntel = blindEligibility.size > 0;

  // Build target list: enemy soldiers and capos, grouped by family
  const enemyUnits = deployedUnits.filter(u => u.family !== playerFamily);
  const familyGroups: Record<string, DeployedUnit[]> = {};
  enemyUnits.forEach(u => {
    if (!familyGroups[u.family]) familyGroups[u.family] = [];
    familyGroups[u.family].push(u);
  });

  const rivalFamilies = ALL_FAMILIES.filter(f => f !== playerFamily);

  const getUnitLabel = (unit: DeployedUnit, index: number) => {
    if (unit.type === 'capo') {
      return `Capo${unit.name ? ` — ${unit.name}` : ''}`;
    }
    return `Soldier #${index + 1}`;
  };

  return (
    <TooltipProvider>
    <div className="space-y-4">
      {/* Active Contracts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-destructive" />
            Active Contracts
          </h4>
          <Badge variant="outline" className="text-[10px]">
            {hitmanContracts.length}/{MAX_HITMEN}
          </Badge>
        </div>

        {hitmanContracts.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No active contracts</p>
        ) : (
          <div className="space-y-2">
            {hitmanContracts.map(c => (
              <div key={c.id} className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-foreground capitalize">
                    vs {c.targetFamily}
                  </span>
                  <Badge variant="destructive" className="text-[10px] flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {c.turnsRemaining} turns
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Target: {c.targetUnitId.includes('capo') ? 'Capo' : 'Soldier'}
                </p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Active: {currentTurn - c.hiredOnTurn} turn{currentTurn - c.hiredOnTurn !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Hire Hitman */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Hire Contract Killer
          </h4>
        </div>
        <p className="text-[10px] text-muted-foreground mb-2">
          ${HITMAN_CONTRACT_COST.toLocaleString()} · 1 action · No heat · No bonuses · 3-5 turn ETA · 50% refund on failure
        </p>

        {phaseLocked ? (
          <div className="text-xs text-muted-foreground italic flex items-center gap-1">
            🔒 Unlocks in Phase 3: Controlling Territory
          </div>
        ) : !selecting ? (
          <Button
            size="sm"
            variant="destructive"
            className="w-full text-xs"
            disabled={!canHire}
            onClick={() => setSelecting(true)}
          >
            <Crosshair className="h-3 w-3 mr-1" />
            {hitmanContracts.length >= MAX_HITMEN ? 'Max Contracts' : noActions ? (phaseIsAction ? 'No actions left' : 'Action step only') : money < HITMAN_CONTRACT_COST ? 'Not Enough Money' : 'Select Target'}
          </Button>
        ) : (
          <div className="space-y-2">
            {/* Tabs: known vs blind (always visible) */}
            <div className="flex gap-1 mb-2">
              <button
                className={`flex-1 px-2 py-1 text-[10px] rounded border ${tab === 'known' ? 'bg-accent border-accent' : 'border-border bg-background'}`}
                onClick={() => setTab('known')}
              >
                Known Targets
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`flex-1 px-2 py-1 text-[10px] rounded border flex items-center justify-center gap-1 ${tab === 'blind' ? 'bg-accent border-accent' : 'border-border bg-background'} ${!hasAnyBlindIntel ? 'opacity-70' : ''}`}
                    onClick={() => setTab('blind')}
                  >
                    {hasAnyBlindIntel ? <Eye className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    Blind Hits
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs">
                  Hire a hitman against an unscouted target. Requires Police Captain (target-scoped) or Police Chief / Mayor (map-wide) bribe.
                </TooltipContent>
              </Tooltip>
            </div>

            {tab === 'known' ? (
              <>
                <p className="text-xs font-medium text-foreground">Pick a known target:</p>
                {Object.entries(familyGroups).map(([family, units]) => {
                  const soldiers = units.filter(u => u.type === 'soldier');
                  const capos = units.filter(u => u.type === 'capo');
                  const allUnits = [...capos, ...soldiers];
                  return (
                    <div key={family} className="rounded-lg border border-border bg-card p-2">
                      <p className="text-xs font-bold text-foreground capitalize mb-1 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {family}
                      </p>
                      <div className="space-y-1">
                        {allUnits.map((unit, idx) => {
                          const alreadyTargeted = hitmanContracts.some(c => c.targetUnitId === unit.id);
                          return (
                            <button
                              key={unit.id}
                              className="w-full flex items-center justify-between rounded border border-border/50 bg-background px-2 py-1 text-[10px] hover:bg-accent/30 transition-colors disabled:opacity-40"
                              disabled={alreadyTargeted}
                              onClick={() => {
                                onHire(unit.id, family);
                                setSelecting(false);
                              }}
                            >
                              <span className="text-foreground">
                                {getUnitLabel(unit, unit.type === 'capo' ? idx : idx - capos.length)}
                              </span>
                              {alreadyTargeted && (
                                <Badge variant="outline" className="text-[8px]">Targeted</Badge>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                {/* Empty-state callout */}
                {!hasAnyBlindIntel && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2 mb-2">
                    <p className="text-[11px] font-bold text-amber-300 flex items-center gap-1 mb-1">
                      <Lock className="h-3 w-3" /> Blind Contracts unavailable
                    </p>
                    <p className="text-[10px] text-muted-foreground mb-1">Requires one of:</p>
                    <ul className="text-[10px] text-muted-foreground space-y-0.5 pl-3">
                      <li>• <span className="text-amber-300">Police Captain</span> bribe on a rival ($2,000 — target-scoped)</li>
                      <li>• <span className="text-sky-300">Police Chief</span> bribe ($8,000 — map-wide, all rivals)</li>
                      <li>• <span className="text-yellow-200">Mayor</span> bribe ($25,000 — map-wide, all rivals)</li>
                    </ul>
                    <p className="text-[10px] text-muted-foreground italic mt-1">Open the Corruption panel to bribe an official.</p>
                  </div>
                )}

                <p className="text-xs font-medium text-foreground">Eligible families (police intel):</p>
                <p className="text-[9px] text-muted-foreground mb-1">Backend resolves the chosen unit type to a random matching enemy unit, scouted or not.</p>

                {rivalFamilies.map(family => {
                  const source = blindEligibility.get(family);
                  const units = familyGroups[family] || [];
                  const soldierCount = units.filter(u => u.type === 'soldier').length;
                  const capoCount = units.filter(u => u.type === 'capo').length;
                  const isPatrolOnly = patrolOnlyFamilies.has(family);

                  if (!source) {
                    // Ineligible — show greyed-out with missing requirement
                    return (
                      <div key={family} className="rounded-lg border border-border/40 bg-muted/20 p-2 opacity-70">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-muted-foreground capitalize flex items-center gap-1">
                            <Lock className="h-3 w-3" /> {family}
                          </p>
                          <Badge variant="outline" className="text-[8px]">Locked</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {isPatrolOnly
                            ? "Patrol Officer doesn't provide intel. Upgrade to Police Captain or higher."
                            : 'Bribe a Police Captain on this family, or a Police Chief / Mayor for map-wide intel.'}
                        </p>
                      </div>
                    );
                  }

                  const meta = TIER_META[source.tier];
                  return (
                    <div key={family} className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-2">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <p className="text-xs font-bold text-foreground capitalize flex items-center gap-1">
                          <Eye className="h-3 w-3 text-purple-400" />
                          {family}
                        </p>
                        <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-medium ${meta.chip}`}>
                          {meta.icon}
                          via {meta.label} ({meta.scopeLabel})
                        </span>
                      </div>
                      <p className="text-[9px] text-muted-foreground mb-1 italic">Hidden units in this family can be targeted.</p>
                      <div className="space-y-1">
                        <button
                          className="w-full flex items-center justify-between rounded border border-border/50 bg-background px-2 py-1 text-[10px] hover:bg-accent/30 transition-colors disabled:opacity-40"
                          disabled={capoCount === 0}
                          onClick={() => {
                            const target = units.find(u => u.type === 'capo' && !hitmanContracts.some(c => c.targetUnitId === u.id));
                            if (target) { onHire(target.id, family); setSelecting(false); }
                          }}
                        >
                          <span className="text-foreground">A Capo</span>
                          <Badge variant="outline" className="text-[8px]">{capoCount} known</Badge>
                        </button>
                        <button
                          className="w-full flex items-center justify-between rounded border border-border/50 bg-background px-2 py-1 text-[10px] hover:bg-accent/30 transition-colors disabled:opacity-40"
                          disabled={soldierCount === 0}
                          onClick={() => {
                            const target = units.find(u => u.type === 'soldier' && !hitmanContracts.some(c => c.targetUnitId === u.id));
                            if (target) { onHire(target.id, family); setSelecting(false); }
                          }}
                        >
                          <span className="text-foreground">A Soldier</span>
                          <Badge variant="outline" className="text-[8px]">{soldierCount} known</Badge>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => setSelecting(false)}
            >
              Cancel
            </Button>
          </div>
        )}

        {hitmanContracts.length >= MAX_HITMEN && (
          <p className="text-xs text-destructive mt-2">Max contracts active ({MAX_HITMEN})</p>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
};

export default HitmanPanel;
