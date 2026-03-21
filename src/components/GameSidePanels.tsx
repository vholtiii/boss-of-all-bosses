import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  DollarSign,
  Users,
  Shield,
  Crown,
  Swords,
  Target,
  Eye,
  HandCoins,
  Skull,
  Building2,
  TrendingUp,
  Gavel,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Crosshair,
} from 'lucide-react';
import { EnhancedMafiaGameState } from '@/hooks/useEnhancedMafiaGameState';
import HitmanPanel from '@/components/HitmanPanel';
import CapoPromotionPanel from '@/components/CapoPromotionPanel';
import CorruptionPanel from '@/components/CorruptionPanel';
import VictoryTracker from '@/components/VictoryTracker';
import { SOLDIER_COST, LOCAL_SOLDIER_COST, RECRUIT_TERRITORY_REQUIREMENT, CAPO_COST } from '@/types/game-mechanics';

interface GameSidePanelProps {
  gameState: EnhancedMafiaGameState;
  onAction: (action: any) => void;
  onEventChoice: (eventId: string, choiceId: string) => void;
}

// ─── LEFT PANEL: Resources + Actions ──────────────────────────────────

export const LeftSidePanel: React.FC<{ gameState: EnhancedMafiaGameState; onAction: (action: any) => void; turnPhase?: string }> = ({
  gameState,
  onAction,
  turnPhase,
}) => {
  const phase = turnPhase || gameState.turnPhase || 'action';
  const actionsLocked = phase === 'deploy' || phase === 'move';
  const [openSection, setOpenSection] = useState<string>('actions');
  const { resources, reputation, policeHeat, legalStatus } = gameState;

  // Compute respect-based recruitment discount (mirrors logic in useEnhancedMafiaGameState)
  const respectDiscount = (reputation.respect / 100) * 0.3;
  const familyDiscount = gameState.familyBonuses?.recruitmentDiscount || 0;
  const totalSoldierDiscount = Math.min(0.5, respectDiscount + familyDiscount);
  const totalCapoDiscount = Math.min(0.5, respectDiscount + familyDiscount);
  const discountedMercCost = Math.round(SOLDIER_COST * (1 - totalSoldierDiscount));
  const discountedRecruitCost = Math.round(LOCAL_SOLDIER_COST * (1 - totalSoldierDiscount));
  const discountedCapoCost = Math.round(CAPO_COST * (1 - totalCapoDiscount));
  const respectPct = Math.round(respectDiscount * 100);
  const playerTerritoryCount = gameState.hexMap?.filter((t: any) => t.controllingFamily === gameState.playerFamily).length || 0;
  const canRecruit = playerTerritoryCount >= RECRUIT_TERRITORY_REQUIREMENT;
  const isTacticalPhase = phase === 'move';

  const toggle = (id: string) => setOpenSection(prev => (prev === id ? '' : id));

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* ── Family Header ── */}
        <div className="text-center pb-3 border-b border-border">
          <h2 className="text-lg font-bold text-primary font-playfair tracking-wider uppercase">
            {gameState.playerFamily} Family
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Turn {gameState.turn} · {gameState.season}</p>
        </div>

        {/* ── Resources Grid ── */}
        <div className="grid grid-cols-2 gap-2">
          <ResourceTile icon={<DollarSign className="h-4 w-4" />} label="Money" value={`$${resources.money.toLocaleString()}`} color="text-green-400" />
          <ResourceTile icon={<Users className="h-4 w-4" />} label="Soldiers" value={String(resources.soldiers)} color="text-destructive" />
          <ResourceTile icon={<Shield className="h-4 w-4" />} label="Respect" value={`${resources.respect}%`} color="text-blue-400" />
          <ResourceTile icon={<Crown className="h-4 w-4" />} label="Influence" value={String(resources.influence)} color="text-primary" />
        </div>

        {/* ── Status Bars ── */}
        <div className="space-y-2">
          <StatusBar label="Loyalty" value={Math.round(reputation.loyalty)} max={100} color="bg-primary" />
          <StatusBar label="Police Heat" value={policeHeat.level} max={100} color="bg-destructive" />
          <StatusBar label="Prosecution Risk" value={legalStatus.prosecutionRisk} max={100} color="bg-orange-500" />
        </div>

        <Separator />

        {/* ── Phase guidance banner ── */}
        {actionsLocked && (
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-center">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">
              {phase === 'deploy' ? '📦 Deploy Phase' : '🚶 Move Phase'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {phase === 'deploy'
                ? 'Place your units from HQ onto the map.'
                : 'Move, fortify, scout, escort, or recruit units.'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Complete this phase to unlock actions.
            </p>
          </div>
        )}

        {/* ── ACTIONS ── */}
        <CollapsibleSection
          title="Strategic Actions"
          icon={<Swords className="h-4 w-4" />}
          isOpen={openSection === 'actions'}
          onToggle={() => toggle('actions')}
          phaseLocked={actionsLocked}
        >
          <div className="space-y-1.5">
            <ActionButton
              icon={<Swords className="h-4 w-4" />}
              label="Attack Territory"
              sublabel={`$15,000 · 2 soldiers`}
              disabled={resources.money < 15000 || resources.soldiers < 2 || legalStatus.jailTime > 0}
              phaseLocked={actionsLocked}
              variant="destructive"
              onClick={() => onAction({ type: 'attack_territory' })}
            />
            <ActionButton
              icon={<Target className="h-4 w-4" />}
              label="Plan Hit"
              sublabel={`$8,000 · 1 soldier`}
              disabled={resources.money < 8000 || resources.soldiers < 1 || legalStatus.jailTime > 0}
              phaseLocked={actionsLocked}
              variant="destructive"
              onClick={() => onAction({ type: 'violent_action', violenceType: 'hit', cost: 8000, risk: 70 })}
            />
            <ActionButton
              icon={<Eye className="h-4 w-4" />}
              label="Sabotage Rival"
              sublabel={`$12,000`}
              disabled={resources.money < 12000 || legalStatus.jailTime > 0}
              phaseLocked={actionsLocked}
              onClick={() => onAction({ type: 'sabotage', cost: 12000 })}
            />
            <ActionButton
              icon={<HandCoins className="h-4 w-4" />}
              label="Extort Business"
              sublabel={`Free · +Heat`}
              disabled={legalStatus.jailTime > 0}
              phaseLocked={actionsLocked}
              onClick={() => onAction({ type: 'extort_business', amount: 5000 })}
            />
          </div>
        </CollapsibleSection>

        {/* ── ECONOMY ── */}
        <CollapsibleSection
          title="Economy"
          icon={<TrendingUp className="h-4 w-4" />}
          isOpen={openSection === 'economy'}
          onToggle={() => toggle('economy')}
          phaseLocked={actionsLocked}
        >
          <div className="space-y-1.5">
            <ActionButton
              icon={<Building2 className="h-4 w-4" />}
              label="Build Business"
              sublabel={`$25,000`}
              disabled={resources.money < 25000 || legalStatus.jailTime > 0}
              phaseLocked={actionsLocked}
              onClick={() => onAction({ type: 'build_business', cost: 25000, income: 5000, legal: true })}
            />
            <ActionButton
              icon={<DollarSign className="h-4 w-4" />}
              label="Launder Money"
              sublabel={`20% fee`}
              disabled={gameState.finances.dirtyMoney < 1000 || legalStatus.jailTime > 0}
              phaseLocked={actionsLocked}
              onClick={() => onAction({ type: 'launder_money', amount: 10000 })}
            />
            <ActionButton
              icon={<TrendingUp className="h-4 w-4" />}
              label="Invest $20K"
              sublabel={`~15% return · 5 turns`}
              disabled={resources.money < 20000}
              phaseLocked={actionsLocked}
              onClick={() => onAction({ type: 'make_investment', investmentType: 'stocks', amount: 20000, expectedReturn: 1.15, duration: 5 })}
            />
          </div>
        </CollapsibleSection>

        {/* ── RECRUITMENT (tactical phase only) ── */}
        <CollapsibleSection
          title="Recruitment"
          icon={<Users className="h-4 w-4" />}
          isOpen={openSection === 'recruitment'}
          onToggle={() => toggle('recruitment')}
          phaseLocked={!isTacticalPhase}
        >
          <div className="space-y-1.5">
            <ActionButton
              icon={<Users className="h-4 w-4" />}
              label="Buy Soldier (Mercenary)"
              sublabel={respectPct > 0 ? `$${discountedMercCost.toLocaleString()} · -3 loyalty · 1 action (${respectPct}% respect)` : `$${SOLDIER_COST.toLocaleString()} · -3 loyalty · 1 action`}
              disabled={resources.money < discountedMercCost || gameState.tacticalActionsRemaining <= 0}
              phaseLocked={!isTacticalPhase}
              onClick={() => onAction({ type: 'recruit_soldiers', cost: SOLDIER_COST })}
            />
            <ActionButton
              icon={<Users className="h-4 w-4" />}
              label="Recruit Soldier (Loyal)"
              sublabel={canRecruit 
                ? (respectPct > 0 ? `$${discountedRecruitCost} · +2 loyalty · 1 action (${respectPct}% respect)` : `$${LOCAL_SOLDIER_COST} · +2 loyalty · 1 action`)
                : `Need ${RECRUIT_TERRITORY_REQUIREMENT} hexes (${playerTerritoryCount} owned)`}
              disabled={!canRecruit || resources.money < discountedRecruitCost || gameState.tacticalActionsRemaining <= 0}
              phaseLocked={!isTacticalPhase}
              onClick={() => onAction({ type: 'recruit_local_soldier' })}
            />
          </div>
        </CollapsibleSection>

        {/* ── DEFENSE & LAW ── */}
        <CollapsibleSection
          title="Defense & Law"
          icon={<Gavel className="h-4 w-4" />}
          isOpen={openSection === 'defense'}
          onToggle={() => toggle('defense')}
          phaseLocked={actionsLocked}
        >
          <div className="space-y-1.5">
            <ActionButton
              icon={<Shield className="h-4 w-4" />}
              label="Train Soldiers"
              sublabel={`$8,000`}
              disabled={resources.money < 8000}
              phaseLocked={actionsLocked}
              onClick={() => onAction({ type: 'train_soldiers' })}
            />
            <ActionButton
              icon={<Crown className="h-4 w-4" />}
              label="Public Appearance"
              sublabel={`$3,000 · +Rep`}
              disabled={resources.money < 3000}
              phaseLocked={actionsLocked}
              onClick={() => onAction({ type: 'public_appearance', cost: 3000 })}
            />
            <ActionButton
              icon={<HandCoins className="h-4 w-4" />}
              label="Charitable Donation"
              sublabel={`$5,000 · −Heat · +Rep`}
              disabled={resources.money < 5000}
              phaseLocked={actionsLocked}
              onClick={() => onAction({ type: 'charitable_donation', amount: 5000 })}
            />
          </div>
        </CollapsibleSection>

        {/* ── CORRUPTION (4-tier bribe system) ── */}
        <CollapsibleSection
          title="Corruption"
          icon={<Gavel className="h-4 w-4" />}
          isOpen={openSection === 'corruption'}
          onToggle={() => toggle('corruption')}
          phaseLocked={actionsLocked}
        >
          {actionsLocked ? (
            <p className="text-xs text-muted-foreground italic flex items-center gap-1">🔒 Unlock in Action phase</p>
          ) : (
            <CorruptionPanel
              money={resources.money}
              activeBribes={gameState.activeBribes}
              rivalFamilies={gameState.aiOpponents.map(o => o.family)}
              reputation={gameState.reputation.reputation}
              heat={gameState.policeHeat.level}
              onBribe={(tier, targetFamily) => onAction({ type: 'bribe_corruption', tier, targetFamily })}
            />
          )}
        </CollapsibleSection>

        {/* ── HITMAN CONTRACT SYSTEM ── */}
        <CollapsibleSection
          title={`Hitmen (${gameState.hitmanContracts?.length || 0}/3)`}
          icon={<Crosshair className="h-4 w-4" />}
          isOpen={openSection === 'hitmen'}
          onToggle={() => toggle('hitmen')}
          phaseLocked={actionsLocked}
        >
          {actionsLocked ? (
            <p className="text-xs text-muted-foreground italic flex items-center gap-1">🔒 Unlock in Action phase</p>
          ) : (
            <HitmanPanel
              hitmanContracts={gameState.hitmanContracts || []}
              deployedUnits={gameState.deployedUnits}
              playerFamily={gameState.playerFamily}
              money={resources.money}
              onHire={(targetUnitId, targetFamily) => onAction({ type: 'hire_hitman', targetUnitId, targetFamily })}
            />
          )}
        </CollapsibleSection>

        {/* ── CAPO PROMOTION ── */}
        <CollapsibleSection
          title={`Capo Promotion (${gameState.deployedUnits.filter(u => u.family === gameState.playerFamily && u.type === 'capo').length}/${3})`}
          icon={<Crown className="h-4 w-4" />}
          isOpen={openSection === 'capo_promotion'}
          onToggle={() => toggle('capo_promotion')}
          phaseLocked={actionsLocked}
        >
          {actionsLocked ? (
            <p className="text-xs text-muted-foreground italic flex items-center gap-1">🔒 Unlock in Action phase</p>
          ) : (
            <CapoPromotionPanel
              capoCount={gameState.deployedUnits.filter(u => u.family === gameState.playerFamily && u.type === 'capo').length}
              soldierStats={gameState.soldierStats}
              deployedSoldierIds={
                gameState.deployedUnits
                  .filter(u => u.family === gameState.playerFamily && u.type === 'soldier')
                  .map(u => u.id)
              }
              hitmanIds={gameState.hitmen.map(h => h.unitId)}
              money={resources.money}
              onPromote={(unitId) => onAction({ type: 'promote_capo', unitId })}
            />
          )}
        </CollapsibleSection>

        {/* ── VICTORY TRACKER ── */}
        <VictoryTracker progress={gameState.victoryProgress} />

        {/* ── Selected Territory ── */}
        {gameState.selectedTerritory && (
          <>
            <Separator />
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <h4 className="text-sm font-bold text-primary font-playfair mb-2">
                Selected: {gameState.selectedTerritory.district}
              </h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Controlled by</span>
                  <span className="capitalize font-medium text-foreground">
                    {gameState.selectedTerritory.family === 'neutral' ? 'Nobody' : gameState.selectedTerritory.family}
                  </span>
                </div>
                {gameState.selectedTerritory.business && (
                  <>
                    <div className="flex justify-between">
                      <span>Business</span>
                      <span className="capitalize text-foreground">{gameState.selectedTerritory.business.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Income</span>
                      <span className="text-green-400">${gameState.selectedTerritory.business.income}/turn</span>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-3 space-y-1.5">
                <Button
                  size="sm"
                  variant="default"
                  className="w-full text-xs"
                  disabled={gameState.selectedTerritory.family === gameState.playerFamily || legalStatus.jailTime > 0}
                  onClick={() => onAction({ type: 'hit_territory', targetTerritory: gameState.selectedTerritory?.district })}
                >
                  <Swords className="h-3 w-3 mr-1" /> Take Over
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  disabled={gameState.selectedTerritory.family !== 'neutral' || legalStatus.jailTime > 0}
                  onClick={() => onAction({ type: 'extort_territory', targetTerritory: gameState.selectedTerritory?.district })}
                >
                  <HandCoins className="h-3 w-3 mr-1" /> Extort
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Jailed warning */}
        {legalStatus.jailTime > 0 && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-destructive" />
            <p className="text-sm font-bold text-destructive">IMPRISONED</p>
            <p className="text-xs text-muted-foreground">{legalStatus.jailTime} turns remaining</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

// ─── RIGHT PANEL: Rivals + Events ──────────────────────────────────

export const RightSidePanel: React.FC<{
  gameState: EnhancedMafiaGameState;
  onEventChoice: (eventId: string, choiceId: string) => void;
}> = ({ gameState, onEventChoice }) => {
  const [openSection, setOpenSection] = useState<string>('rivals');
  const toggle = (id: string) => setOpenSection(prev => (prev === id ? '' : id));

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* ── Territory Control ── */}
        <div className="pb-3 border-b border-border">
          <h3 className="text-sm font-bold text-primary font-playfair mb-3 uppercase tracking-wider">Territory Control</h3>
          <div className="space-y-2">
            {gameState.familyControl && Object.entries(gameState.familyControl).map(([family, control]) => (
              <div key={family} className="flex items-center gap-2">
                <span className={cn(
                  'text-xs w-16 capitalize font-medium',
                  family === gameState.playerFamily ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {family}
                </span>
                <Progress value={control} className="flex-1 h-2" />
                <span className="text-xs text-muted-foreground w-8 text-right">{control}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Events ── */}
        {gameState.events.length > 0 && (
          <CollapsibleSection
            title={`Events (${gameState.events.length})`}
            icon={<AlertTriangle className="h-4 w-4 text-primary" />}
            isOpen={openSection === 'events'}
            onToggle={() => toggle('events')}
          >
            <div className="space-y-2">
              {gameState.events.slice(0, 3).map((event: any) => (
                <div key={event.id} className="rounded-lg border border-border bg-card p-3">
                  <p className="text-sm font-medium text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {event.choices?.map((choice: any) => (
                      <Button
                        key={choice.id}
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => onEventChoice(event.id, choice.id)}
                      >
                        {choice.text}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* ── Rival Families ── */}
        <CollapsibleSection
          title="Rival Families"
          icon={<Skull className="h-4 w-4" />}
          isOpen={openSection === 'rivals'}
          onToggle={() => toggle('rivals')}
        >
          <div className="space-y-2">
            {gameState.aiOpponents.map((opponent: any) => (
              <div
                key={opponent.family}
                className="rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold capitalize text-foreground">{opponent.family}</span>
                  <Badge variant="outline" className="text-[10px] h-5">{opponent.personality}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Money</p>
                    <p className="text-xs font-medium text-foreground">${(opponent.resources.money / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Soldiers</p>
                    <p className="text-xs font-medium text-foreground">{opponent.resources.soldiers}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Influence</p>
                    <p className="text-xs font-medium text-foreground">{opponent.resources.influence}</p>
                  </div>
                </div>
                {/* Relationship with player */}
                {opponent.relationships[gameState.playerFamily] !== undefined && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">Relation:</span>
                    <Badge
                      variant={opponent.relationships[gameState.playerFamily] > 0 ? 'default' : 'destructive'}
                      className="text-[10px] h-4"
                    >
                      {opponent.relationships[gameState.playerFamily] > 0 ? '+' : ''}
                      {opponent.relationships[gameState.playerFamily]}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* ── Weather ── */}
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">
              {gameState.weather.currentWeather.type === 'clear' && '☀️'}
              {gameState.weather.currentWeather.type === 'rain' && '🌧️'}
              {gameState.weather.currentWeather.type === 'snow' && '❄️'}
              {gameState.weather.currentWeather.type === 'fog' && '🌫️'}
              {gameState.weather.currentWeather.type === 'storm' && '⛈️'}
            </span>
            <div>
              <p className="text-sm font-medium capitalize text-foreground">{gameState.weather.currentWeather.type}</p>
              <p className="text-[10px] text-muted-foreground">{gameState.weather.currentWeather.duration} turns left</p>
            </div>
          </div>
        </div>

        {/* ── Businesses ── */}
        {gameState.businesses.length > 0 && (
          <CollapsibleSection
            title={`Businesses (${gameState.businesses.length})`}
            icon={<Building2 className="h-4 w-4" />}
            isOpen={openSection === 'businesses'}
            onToggle={() => toggle('businesses')}
          >
            <div className="space-y-1">
              {gameState.businesses.map((biz: any) => (
                <div key={biz.id} className="flex items-center justify-between text-xs p-2 border border-border rounded">
                  <span className="capitalize text-foreground">{biz.category || biz.name}</span>
                  <span className="text-green-400">+${biz.monthlyIncome?.toLocaleString()}/turn</span>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </ScrollArea>
  );
};

// ─── Reusable sub-components ──────────────────────────────────────

const ResourceTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div className="rounded-lg border border-border bg-card p-2.5 text-center">
    <div className={cn('mx-auto mb-1', color)}>{icon}</div>
    <div className={cn('text-base font-bold', color)}>{value}</div>
    <div className="text-[10px] text-muted-foreground">{label}</div>
  </div>
);

const StatusBar: React.FC<{
  label: string;
  value: number;
  max: number;
  color: string;
}> = ({ label, value, max, color }) => (
  <div className="flex items-center gap-2">
    <span className="text-[10px] text-muted-foreground w-20 shrink-0">{label}</span>
    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${(value / max) * 100}%` }} />
    </div>
    <span className="text-[10px] text-muted-foreground w-8 text-right">{value}</span>
  </div>
);

const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  disabled?: boolean;
  phaseLocked?: boolean;
  variant?: 'default' | 'destructive' | 'outline';
  onClick: () => void;
}> = ({ icon, label, sublabel, disabled, phaseLocked, variant = 'outline', onClick }) => (
  <Button
    variant={variant}
    size="sm"
    disabled={disabled || phaseLocked}
    onClick={onClick}
    className={cn("w-full justify-start text-xs h-9 gap-2", phaseLocked && "opacity-50")}
  >
    {phaseLocked ? <Shield className="h-3.5 w-3.5 text-muted-foreground" /> : icon}
    <span className="flex-1 text-left">{label}</span>
    {phaseLocked ? (
      <span className="text-[10px] text-muted-foreground font-normal">🔒</span>
    ) : (
      <span className="text-[10px] text-muted-foreground font-normal">{sublabel}</span>
    )}
  </Button>
);

const CollapsibleSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  phaseLocked?: boolean;
}> = ({ title, icon, isOpen, onToggle, children, disabled, phaseLocked }) => (
  <div>
    <button
      data-no-sound
      onClick={onToggle}
      className="flex items-center gap-2 w-full text-left text-sm font-semibold text-foreground hover:text-primary transition-colors py-1"
    >
      {icon}
      <span className="flex-1">{title}</span>
      {phaseLocked && <span className="text-[9px] text-muted-foreground font-normal">🔒</span>}
      {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="pt-2">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
