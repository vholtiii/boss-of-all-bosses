import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Crosshair, Clock, DollarSign, Users, Eye } from 'lucide-react';
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
  onHire: (targetUnitId: string, targetFamily: string) => void;
}

const HitmanPanel: React.FC<HitmanPanelProps> = ({
  hitmanContracts, deployedUnits, playerFamily, money, currentTurn, gamePhase, activeBribes = [], onHire
}) => {
  const [selecting, setSelecting] = useState(false);
  const [tab, setTab] = useState<'known' | 'blind'>('known');

  const phaseLocked = gamePhase < 3;
  const canHire = !phaseLocked && hitmanContracts.length < MAX_HITMEN && money >= HITMAN_CONTRACT_COST;

  // Captain-bribed (or higher) families: enables blind hits
  const captainBribedFamilies = new Set<string>();
  activeBribes.forEach(b => {
    if (!b.active) return;
    if ((b.tier === 'police_captain' || b.tier === 'police_chief' || b.tier === 'mayor') && b.targetFamily) {
      captainBribedFamilies.add(b.targetFamily);
    }
    // Chief/Mayor without target = map-wide
    if ((b.tier === 'police_chief' || b.tier === 'mayor') && !b.targetFamily) {
      ['gambino','genovese','lucchese','bonanno','colombo'].forEach(f => { if (f !== playerFamily) captainBribedFamilies.add(f); });
    }
  });
  const hasAnyCaptain = captainBribedFamilies.size > 0;

  // Build target list: enemy soldiers and capos, grouped by family
  const enemyUnits = deployedUnits.filter(u => u.family !== playerFamily);
  const familyGroups: Record<string, DeployedUnit[]> = {};
  enemyUnits.forEach(u => {
    if (!familyGroups[u.family]) familyGroups[u.family] = [];
    familyGroups[u.family].push(u);
  });

  const getUnitLabel = (unit: DeployedUnit, index: number) => {
    if (unit.type === 'capo') {
      return `Capo${unit.name ? ` — ${unit.name}` : ''}`;
    }
    return `Soldier #${index + 1}`;
  };

  return (
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
          ${HITMAN_CONTRACT_COST.toLocaleString()} · No heat · No bonuses · 3-5 turn ETA · 50% refund on failure
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
            {hitmanContracts.length >= MAX_HITMEN ? 'Max Contracts' : money < HITMAN_CONTRACT_COST ? 'Not Enough Money' : 'Select Target'}
          </Button>
        ) : (
          <div className="space-y-2">
            {/* Tabs: known vs blind */}
            {hasAnyCaptain && (
              <div className="flex gap-1 mb-2">
                <button
                  className={`flex-1 px-2 py-1 text-[10px] rounded border ${tab === 'known' ? 'bg-accent border-accent' : 'border-border bg-background'}`}
                  onClick={() => setTab('known')}
                >
                  Known Targets
                </button>
                <button
                  className={`flex-1 px-2 py-1 text-[10px] rounded border flex items-center justify-center gap-1 ${tab === 'blind' ? 'bg-accent border-accent' : 'border-border bg-background'}`}
                  onClick={() => setTab('blind')}
                >
                  <Eye className="h-3 w-3" /> Blind (Captain)
                </button>
              </div>
            )}

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
                <p className="text-xs font-medium text-foreground">Captain's intel — pick family + unit type:</p>
                <p className="text-[9px] text-muted-foreground mb-1">Backend resolves to a random matching enemy unit, scouted or not.</p>
                {Array.from(captainBribedFamilies).map(family => {
                  const units = familyGroups[family] || [];
                  const soldierCount = units.filter(u => u.type === 'soldier').length;
                  const capoCount = units.filter(u => u.type === 'capo').length;
                  return (
                    <div key={family} className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-2">
                      <p className="text-xs font-bold text-foreground capitalize mb-1 flex items-center gap-1">
                        <Eye className="h-3 w-3 text-purple-400" />
                        {family}
                      </p>
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
                {captainBribedFamilies.size === 0 && (
                  <p className="text-[10px] text-muted-foreground italic">Bribe a Police Captain (or higher) to unlock blind hits.</p>
                )}
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
  );
};

export default HitmanPanel;
