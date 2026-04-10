import React, { useState } from 'react';
import { useSoundSystem } from '@/hooks/useSoundSystem';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
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
  UtensilsCrossed,
  Store,
  HardHat,
  Scale,
} from 'lucide-react';
import { EnhancedMafiaGameState } from '@/hooks/useEnhancedMafiaGameState';
import HitmanPanel from '@/components/HitmanPanel';
import CapoPromotionPanel from '@/components/CapoPromotionPanel';
import CorruptionPanel from '@/components/CorruptionPanel';
import VictoryTracker from '@/components/VictoryTracker';
import { SOLDIER_COST, LOCAL_SOLDIER_COST, RECRUIT_TERRITORY_REQUIREMENT, CAPO_COST, PLAN_HIT_BONUS, PLAN_HIT_DURATION, PLAN_HIT_RELOCATED_BONUS, PLAN_HIT_RELOCATED_HEAT, PLAN_HIT_COOLDOWN, SUPPLY_NODE_CONFIG, SUPPLY_DEPENDENCIES, SUPPLY_DECAY_FLOOR, SUPPLY_STOCKPILE_BUFFER, SupplyNodeType, SAFEHOUSE_MAX_STOCKPILE, SAFEHOUSE_MAX_ALLOCATION, Safehouse, getTensionPairKey, WAR_TENSION_THRESHOLD } from '@/types/game-mechanics';
import { Anchor, Wrench, Truck, Wine, Fish, Package, Link2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface GameSidePanelProps {
  gameState: EnhancedMafiaGameState;
  onAction: (action: any) => void;
  onEventChoice: (eventId: string, choiceId: string) => void;
}

// ─── LEFT PANEL: Resources + Actions ──────────────────────────────────

export const LeftSidePanel: React.FC<{ gameState: EnhancedMafiaGameState; onAction: (action: any) => void; turnPhase?: string; onSelectUnit?: (unitType: string, hex: { q: number; r: number; s: number }) => void }> = ({
  gameState,
  onAction,
  turnPhase,
  onSelectUnit,
}) => {
  const phase = turnPhase || gameState.turnPhase || 'action';
  const actionsLocked = phase === 'deploy' || phase === 'move';
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['actions']));
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

  const toggle = (id: string) => setOpenSections(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

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
              {phase === 'deploy' ? '📦 Deploy Step' : '📋 Tactical Step'}
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
          isOpen={openSections.has('actions')}
          onToggle={() => toggle('actions')}
          phaseLocked={actionsLocked}
        >
          <div className="space-y-1.5">
            <ActionButton
              icon={<Eye className="h-4 w-4" />}
              label="Sabotage Rival"
              sublabel={`$12,000`}
              disabled={resources.money < 12000 || legalStatus.jailTime > 0}
              disabledReason={legalStatus.jailTime > 0 ? 'Jailed' : resources.money < 12000 ? `Need $12,000` : undefined}
              phaseLocked={actionsLocked}
              onClick={() => onAction({ type: 'sabotage', cost: 12000 })}
            />
            <ActionButton
              icon={<HandCoins className="h-4 w-4" />}
              label="Extort Business"
              sublabel={`Free · +Heat`}
              disabled={legalStatus.jailTime > 0}
              disabledReason={legalStatus.jailTime > 0 ? 'Jailed' : undefined}
              phaseLocked={actionsLocked}
              onClick={() => onAction({ type: 'extort_business', amount: 5000 })}
            />
          </div>
        </CollapsibleSection>

        {/* ── ECONOMY ── */}
        <CollapsibleSection
          title="Economy"
          icon={<TrendingUp className="h-4 w-4" />}
          isOpen={openSections.has('economy')}
          onToggle={() => toggle('economy')}
          phaseLocked={actionsLocked}
        >
          <div className="space-y-1.5">
            {/* Capo requirement hint */}
            <div className="text-[10px] text-muted-foreground px-1 pb-1 border-b border-border/30">
              👔 Legal businesses require a Capo on the hex · 1 action token
              {(() => {
                const validHexes = (gameState.hexMap || []).filter((t: any) => 
                  t.controllingFamily === gameState.playerFamily && !t.business && !t.isHeadquarters
                );
                const hexesWithCapo = validHexes.filter((t: any) =>
                  (gameState.deployedUnits || []).some((u: any) => u.type === 'capo' && u.family === gameState.playerFamily && u.q === t.q && u.r === t.r && u.s === t.s)
                );
                return <span className="ml-1">({hexesWithCapo.length} hex{hexesWithCapo.length !== 1 ? 'es' : ''} with Capo)</span>;
              })()}
            </div>
            {/* Pending placement indicator */}
            {(gameState as any).pendingBusinessBuild && (
              <div className="rounded-md border border-primary/50 bg-primary/10 px-3 py-1.5 text-xs text-primary font-medium flex items-center justify-between">
                <span>📍 Click a hex with a Capo to place {(gameState as any).pendingBusinessBuild.businessType}</span>
                <button
                  className="text-destructive hover:text-destructive/80 text-xs underline ml-2"
                  onClick={() => onAction({ type: 'cancel_business_placement' })}
                >Cancel</button>
              </div>
            )}
            <ActionButton
              icon={<UtensilsCrossed className="h-4 w-4" />}
              label="🍝 Restaurant"
              sublabel={`$20,000 · $3K/turn · 1 action`}
              disabled={resources.money < 20000 || legalStatus.jailTime > 0 || gameState.actionsRemaining <= 0}
              disabledReason={legalStatus.jailTime > 0 ? 'Jailed' : gameState.actionsRemaining <= 0 ? 'No actions left' : resources.money < 20000 ? 'Need $20,000' : undefined}
              phaseLocked={actionsLocked}
              onClick={() => onAction({ type: 'build_business', businessType: 'restaurant' })}
            />
            <ActionButton
              icon={<Store className="h-4 w-4" />}
              label="🏪 Store"
              sublabel={`$12,000 · $1.8K/turn · 1 action`}
              disabled={resources.money < 12000 || legalStatus.jailTime > 0 || gameState.actionsRemaining <= 0}
              disabledReason={legalStatus.jailTime > 0 ? 'Jailed' : gameState.actionsRemaining <= 0 ? 'No actions left' : resources.money < 12000 ? 'Need $12,000' : undefined}
              phaseLocked={actionsLocked}
              onClick={() => onAction({ type: 'build_business', businessType: 'store' })}
            />
            <ActionButton
              icon={<HardHat className="h-4 w-4" />}
              label="🏗️ Construction"
              sublabel={`$35,000 · $5K/turn · 1 action`}
              disabled={resources.money < 35000 || legalStatus.jailTime > 0 || gameState.actionsRemaining <= 0}
              disabledReason={legalStatus.jailTime > 0 ? 'Jailed' : gameState.actionsRemaining <= 0 ? 'No actions left' : resources.money < 35000 ? 'Need $35,000' : undefined}
              phaseLocked={actionsLocked}
              onClick={() => onAction({ type: 'build_business', businessType: 'construction' })}
            />
            <ActionButton
              icon={<DollarSign className="h-4 w-4" />}
              label="Launder Money"
              sublabel={`20% fee`}
              disabled={gameState.finances.dirtyMoney < 1000 || legalStatus.jailTime > 0}
              disabledReason={legalStatus.jailTime > 0 ? 'Jailed' : gameState.finances.dirtyMoney < 1000 ? 'No dirty money' : undefined}
              phaseLocked={actionsLocked}
              onClick={() => onAction({ type: 'launder_money', amount: 10000 })}
            />
          </div>
        </CollapsibleSection>

        {/* ── RECRUITMENT (tactical phase only) ── */}
        <CollapsibleSection
          title="Recruitment & Tactical"
          icon={<Users className="h-4 w-4" />}
          isOpen={openSections.has('recruitment')}
          onToggle={() => toggle('recruitment')}
          phaseLocked={!isTacticalPhase}
        >
          <div className="space-y-1.5">
            <ActionButton
              icon={<Target className="h-4 w-4" />}
              label="Plan Hit"
              sublabel={
                (gameState as any).gamePhase < 2
                  ? '🔒 Unlocks Phase 2'
                  : gameState.turn < (gameState.planHitCooldownUntil || 0)
                  ? `⏳ Cooldown: ${(gameState.planHitCooldownUntil || 0) - gameState.turn} turn(s)`
                  : `🎯 +${PLAN_HIT_BONUS}% bonus · 1 tactical · ${PLAN_HIT_DURATION}t`
              }
              disabled={
                (gameState as any).gamePhase < 2 ||
                gameState.turn < (gameState.planHitCooldownUntil || 0) ||
                gameState.tacticalActionsRemaining <= 0 || 
                !(gameState.scoutedHexes || []).some((s: any) => {
                  const tile = (gameState.hexMap || []).find((t: any) => t.q === s.q && t.r === s.r && t.s === s.s);
                  return tile && tile.controllingFamily !== gameState.playerFamily && tile.controllingFamily !== 'neutral';
                })
              }
              disabledReason={
                (gameState as any).gamePhase < 2
                  ? '🔒 Unlocks in Phase 2: Establishing Territory'
                  : gameState.turn < (gameState.planHitCooldownUntil || 0)
                  ? `Cooldown: ${(gameState.planHitCooldownUntil || 0) - gameState.turn} turn(s) remaining`
                  : gameState.tacticalActionsRemaining <= 0 ? 'No tactical actions' : 'Scout an enemy hex first'
              }
              phaseLocked={!isTacticalPhase}
              variant="destructive"
              onClick={() => onAction({ type: 'enter_plan_hit_mode' })}
            />
            {gameState.plannedHit && (() => {
              const planner = (gameState.deployedUnits || []).find((u: any) => u.id === gameState.plannedHit.plannerUnitId);
              const target = (gameState.deployedUnits || []).find((u: any) => u.id === gameState.plannedHit.targetUnitId);
              const plannerName = planner?.name || gameState.plannedHit.plannerUnitId?.split('-').slice(-2).join(' ') || '?';
              const targetName = target?.name || gameState.plannedHit.targetUnitId?.split('-').slice(-2).join(' ') || '?';
              const targetOnOriginalHex = target && target.q === gameState.plannedHit.q && target.r === gameState.plannedHit.r && target.s === gameState.plannedHit.s;
              const targetExists = !!target;
              const targetRelocated = targetExists && !targetOnOriginalHex;
              const isActionPhase = phase === 'action';
              return (
                <div className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium flex flex-col gap-0.5",
                  !targetExists
                    ? "border-destructive/50 bg-destructive/10 text-destructive"
                    : targetOnOriginalHex 
                      ? "border-destructive/30 bg-destructive/10 text-destructive" 
                      : "border-orange-500/30 bg-orange-500/10 text-orange-400"
                )}>
                  <div className="flex items-center gap-1.5">
                    🎯 Hit planned — {targetOnOriginalHex ? `+${PLAN_HIT_BONUS}%` : targetRelocated ? `+${PLAN_HIT_RELOCATED_BONUS}% (relocated)` : 'TARGET GONE'} · Expires turn {gameState.plannedHit.expiresOnTurn}
                  </div>
                  <div className="text-[10px] opacity-80">
                    Planner: {plannerName} → Target: {targetName}
                    {targetRelocated && <span className="ml-1 text-orange-400 font-bold">⚠️ MOVED — +{PLAN_HIT_RELOCATED_HEAT} heat, {PLAN_HIT_COOLDOWN}t cooldown</span>}
                    {!targetExists && <span className="ml-1 text-destructive font-bold">💀 ELIMINATED</span>}
                  </div>
                  {isActionPhase && gameState.actionsRemaining > 0 && (
                    <button
                      onClick={() => onAction({ type: 'execute_planned_hit', selectedUnitId: gameState.plannedHit?.plannerUnitId })}
                      className={cn(
                        "mt-1 px-2 py-1 rounded text-xs font-bold transition-colors",
                        targetExists
                          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      )}
                      disabled={!targetExists}
                    >
                      {targetOnOriginalHex ? '⚔️ Execute Plan' : targetRelocated ? '⚔️ Execute (Redirected)' : '❌ Target Lost'}
                    </button>
                  )}
                </div>
              );
            })()}
            {/* AI Assassination Warnings — only show detected hits */}
            {(() => {
              const allHits = (gameState as any).aiPlannedHits || [];
              const detectedHits = allHits.filter((h: any) => h.detectedVia);
              if (detectedHits.length === 0) return null;
              const sourceLabels: Record<string, string> = {
                scout: '🕵️ Street Scout',
                bribe_captain: '👮 Police Captain',
                bribe_chief: '🏛️ Police Chief',
                bribe_mayor: '🏛️ Mayor\'s Office',
              };
              return (
                <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/40 text-[11px] text-red-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    ⚠️ Intel Warning: {detectedHits.length} assassination plot{detectedHits.length > 1 ? 's' : ''} detected
                  </div>
                  {detectedHits.map((hit: any, i: number) => (
                    <div key={i} className="text-[10px] opacity-90 pl-2 border-l border-red-500/30">
                      <span className="font-semibold capitalize">{hit.family}</span> targeting your capo
                      {hit.turnsRemaining != null && <span className="text-red-400 ml-1">({hit.turnsRemaining} turn{hit.turnsRemaining !== 1 ? 's' : ''} left)</span>}
                      <div className="opacity-70">Source: {sourceLabels[hit.detectedVia] || 'Unknown'}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
            <Separator className="my-1" />
            <ActionButton
              icon={<Users className="h-4 w-4" />}
              label="Buy Soldier (Mercenary)"
              sublabel={respectPct > 0 ? `$${discountedMercCost.toLocaleString()} · -3 loyalty · 1 action (${respectPct}% respect)` : `$${SOLDIER_COST.toLocaleString()} · -3 loyalty · 1 action`}
              disabled={resources.money < discountedMercCost || gameState.tacticalActionsRemaining <= 0}
              disabledReason={gameState.tacticalActionsRemaining <= 0 ? 'No tactical actions' : resources.money < discountedMercCost ? `Need $${discountedMercCost.toLocaleString()}` : undefined}
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
              disabledReason={gameState.tacticalActionsRemaining <= 0 ? 'No tactical actions' : !canRecruit ? `Need ${RECRUIT_TERRITORY_REQUIREMENT} hexes (have ${playerTerritoryCount})` : resources.money < discountedRecruitCost ? `Need $${discountedRecruitCost.toLocaleString()}` : undefined}
              phaseLocked={!isTacticalPhase}
              onClick={() => onAction({ type: 'recruit_local_soldier' })}
            />
          </div>
        </CollapsibleSection>

        {/* ── DEFENSE & LAW ── */}
        <CollapsibleSection
          title="Defense & Law"
          icon={<Gavel className="h-4 w-4" />}
          isOpen={openSections.has('defense')}
          onToggle={() => toggle('defense')}
          phaseLocked={actionsLocked}
        >
          <div className="space-y-1.5">
            {/* Lawyer Active Badge */}
            {(gameState as any).lawyerActiveUntil >= gameState.turn && (
              <div className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs text-green-400 font-medium flex items-center gap-1.5">
                ⚖️ Lawyer Active — Sentences −25%
                <span className="ml-auto text-muted-foreground">
                  {(gameState as any).lawyerActiveUntil - gameState.turn + 1} turn{(gameState as any).lawyerActiveUntil - gameState.turn + 1 !== 1 ? 's' : ''} left
                </span>
              </div>
            )}
            {/* RICO Warning */}
            {(gameState as any).ricoTimer > 0 && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-1.5 text-xs text-destructive font-bold flex items-center gap-1.5 animate-pulse">
                🚨 RICO: {(gameState as any).ricoTimer}/5 turns
              </div>
            )}
            {/* Heat Tier Indicator */}
            {(() => {
              const heat = policeHeat.level;
              if (heat >= 90) return <div className="text-xs text-destructive font-semibold px-1">🔴 CRITICAL — Businesses shutting down, RICO active</div>;
              if (heat >= 70) return <div className="text-xs text-orange-400 font-semibold px-1">🟠 HIGH — Capo arrests possible, −25% illegal income</div>;
              if (heat >= 50) return <div className="text-xs text-yellow-400 font-semibold px-1">🟡 MEDIUM — Soldier arrests possible, −15% illegal income</div>;
              if (heat >= 30) return <div className="text-xs text-blue-400 font-semibold px-1">🔵 LOW — −15% illegal income</div>;
              return null;
            })()}
            <ActionButton
              icon={<Crown className="h-4 w-4" />}
              label="Public Appearance"
              sublabel="$3,000 · −5 Heat · +2 Rep · 1 action"
              disabled={resources.money < 3000 || gameState.actionsRemaining <= 0}
              disabledReason={gameState.actionsRemaining <= 0 ? 'No actions left' : resources.money < 3000 ? 'Need $3,000' : undefined}
              phaseLocked={actionsLocked}
              onClick={() => onAction({ type: 'public_appearance', cost: 3000 })}
            />
            <ActionButton
              icon={<HandCoins className="h-4 w-4" />}
              label="Charitable Donation"
              sublabel="$5,000 · −10 Heat · +3 Rep · 1 action"
              disabled={resources.money < 5000 || gameState.actionsRemaining <= 0}
              disabledReason={gameState.actionsRemaining <= 0 ? 'No actions left' : resources.money < 5000 ? 'Need $5,000' : undefined}
              phaseLocked={actionsLocked}
              onClick={() => onAction({ type: 'charitable_donation', amount: 5000 })}
            />
            {(() => {
              const lawyerCooldown = 3;
              const lastLawyerTurn = (gameState as any).lastLawyerTurn || 0;
              const turnsLeft = Math.max(0, lawyerCooldown - (gameState.turn - lastLawyerTurn));
              const onCooldown = turnsLeft > 0;
              return (
                <ActionButton
                  icon={<Scale className="h-4 w-4" />}
                  label="Hire Lawyer"
                  sublabel={onCooldown ? `Cooldown: ${turnsLeft} turn${turnsLeft > 1 ? 's' : ''}` : '$8,000 · Clears arrest, −25% sentences · 1 action'}
                  disabled={resources.money < 8000 || gameState.actionsRemaining <= 0 || onCooldown}
                  disabledReason={onCooldown ? `Cooldown: ${turnsLeft}t` : gameState.actionsRemaining <= 0 ? 'No actions left' : resources.money < 8000 ? 'Need $8,000' : undefined}
                  phaseLocked={actionsLocked}
                  onClick={() => onAction({ type: 'hire_lawyer' })}
                />
              );
            })()}
            {/* Arrested Units Summary */}
            {(((gameState as any).arrestedSoldiers?.length || 0) > 0 || ((gameState as any).arrestedCapos?.length || 0) > 0) && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs space-y-0.5">
                {((gameState as any).arrestedSoldiers || []).map((a: any, i: number) => (
                  <div key={i} className="text-muted-foreground">🔒 Soldier jailed — returns turn {a.returnTurn}</div>
                ))}
                {((gameState as any).arrestedCapos || []).map((a: any, i: number) => (
                  <div key={i} className="text-orange-400">🔒 Capo jailed — returns turn {a.returnTurn}</div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* ── CORRUPTION (4-tier bribe system) ── */}
        <CollapsibleSection
          title="Corruption"
          icon={<Gavel className="h-4 w-4" />}
          isOpen={openSections.has('corruption')}
          onToggle={() => toggle('corruption')}
          phaseLocked={actionsLocked}
        >
          {actionsLocked ? (
             <p className="text-xs text-muted-foreground italic flex items-center gap-1">🔒 Unlock in Action step</p>
          ) : (
            <CorruptionPanel
              money={resources.money}
              activeBribes={gameState.activeBribes}
              rivalFamilies={gameState.aiOpponents.map(o => o.family)}
              reputation={gameState.reputation.reputation}
              heat={gameState.policeHeat.level}
              gamePhase={(gameState as any).gamePhase || 1}
              onBribe={(tier, targetFamily) => onAction({ type: 'bribe_corruption', tier, targetFamily })}
            />
          )}
        </CollapsibleSection>

        {/* ── HITMAN CONTRACT SYSTEM ── */}
        <CollapsibleSection
          title={`Hitmen (${gameState.hitmanContracts?.length || 0}/3)`}
          icon={<Crosshair className="h-4 w-4" />}
          isOpen={openSections.has('hitmen')}
          onToggle={() => toggle('hitmen')}
          phaseLocked={actionsLocked}
        >
          {actionsLocked ? (
            <p className="text-xs text-muted-foreground italic flex items-center gap-1">🔒 Unlock in Action step</p>
          ) : (
            <HitmanPanel
              hitmanContracts={gameState.hitmanContracts || []}
              deployedUnits={gameState.deployedUnits}
              playerFamily={gameState.playerFamily}
              money={resources.money}
              currentTurn={gameState.turn}
              gamePhase={(gameState as any).gamePhase || 1}
              onHire={(targetUnitId, targetFamily) => onAction({ type: 'hire_hitman', targetUnitId, targetFamily })}
            />
          )}
        </CollapsibleSection>

        {/* ── CAPO PROMOTION ── */}
        <CollapsibleSection
          title={`Capo Promotion (${gameState.deployedUnits.filter(u => u.family === gameState.playerFamily && u.type === 'capo').length}/${3})`}
          icon={<Crown className="h-4 w-4" />}
          isOpen={openSections.has('capo_promotion')}
          onToggle={() => toggle('capo_promotion')}
        >
          <CapoPromotionPanel
            capoCount={gameState.deployedUnits.filter(u => u.family === gameState.playerFamily && u.type === 'capo').length}
            soldierStats={gameState.soldierStats}
            deployedSoldierIds={
              gameState.deployedUnits
                .filter(u => u.family === gameState.playerFamily && u.type === 'soldier')
                .map(u => u.id)
            }
            hitmanIds={[]}
            money={resources.money}
            pendingPromotionIds={
              gameState.deployedUnits
                .filter(u => u.family === gameState.playerFamily && u.type === 'soldier' && (u as any).pendingPromotion)
                .map(u => u.id)
            }
            onPromote={(unitId) => onAction({ type: 'promote_capo', unitId })}
            onHighlightSoldier={(unitId) => {
              const unit = gameState.deployedUnits.find(u => u.id === unitId);
              if (unit && onSelectUnit) {
                onSelectUnit(unit.type, { q: unit.q, r: unit.r, s: unit.s });
              }
            }}
          />
        </CollapsibleSection>

        {/* ── DISTRICT CONTROL BONUSES ── */}
        <CollapsibleSection
          title="District Control"
          icon={<Building2 className="h-4 w-4" />}
          isOpen={openSections.has('district_control')}
          onToggle={() => toggle('district_control')}
        >
          <div className="space-y-1.5">
            {(() => {
              const districts = ['Manhattan', 'Little Italy', 'Brooklyn', 'Bronx', 'Queens', 'Staten Island'];
              const bonusLabels: Record<string, { primary: string; secondary: string }> = {
                'Manhattan': { primary: '+25% income', secondary: '+1 action point' },
                'Little Italy': { primary: '+20% loyalty', secondary: 'Faster hiding return' },
                'Brooklyn': { primary: '-5 heat/turn', secondary: '+10% combat defense' },
                'Bronx': { primary: '-$750 recruits', secondary: 'Free recruit / 3 turns' },
                'Queens': { primary: '+15% extortion', secondary: '+5% hit success' },
                'Staten Island': { primary: '+3 respect/turn', secondary: '+1 influence/turn' },
              };
              const activeBonuses = (gameState as any).activeDistrictBonuses || [];
              const playerControlsAny = activeBonuses.some((b: any) => b.family === gameState.playerFamily);
              return (
                <>
                  {districts.map(district => {
                    const districtHexes = (gameState.hexMap || []).filter((t: any) => t.district === district);
                    const playerHexes = districtHexes.filter((t: any) => t.controllingFamily === gameState.playerFamily);
                    const pct = districtHexes.length > 0 ? Math.round((playerHexes.length / districtHexes.length) * 100) : 0;
                    const isActive = activeBonuses.some((b: any) => b.district === district && b.family === gameState.playerFamily);
                    const labels = bonusLabels[district];
                    return (
                      <div key={district} className={cn(
                        "rounded-md border px-2.5 py-1.5 text-xs",
                        isActive ? "border-primary/50 bg-primary/10" : "border-border/30 bg-muted/30"
                      )}>
                        <div className="flex items-center justify-between">
                          <span className={cn("font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                            {isActive && '✅ '}{district}
                          </span>
                          <span className="text-muted-foreground">{pct}% / 60%</span>
                        </div>
                        <Progress value={Math.min(100, (pct / 60) * 100)} className="h-1.5 mt-1" />
                        <div className={cn("text-[10px] mt-0.5", isActive ? "text-primary/80" : "text-muted-foreground/60")}>
                          {labels.primary} · {labels.secondary}
                        </div>
                      </div>
                    );
                  })}
                  {playerControlsAny && (
                    <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-xs mt-1">
                      <span className="font-medium text-amber-400">🌐 Universal Bonuses Active</span>
                      <div className="text-[10px] text-amber-300/70 mt-0.5">
                        💰 Turf Tax: Enemy units in your districts lose 5 loyalty/turn<br/>
                        🛤️ Safe Passage: +1 move range in controlled districts
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </CollapsibleSection>

        {/* ── VICTORY TRACKER ── */}
        <VictoryTracker progress={gameState.victoryProgress} gamePhase={(gameState as any).gamePhase || 1} />

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
              <div className="mt-3 px-2 py-2 rounded bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground italic">
                  💡 Select a unit, then click a hex for actions
                </p>
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
  onAction?: (action: any) => void;
  onHighlightSupplyNode?: (hex: { q: number; r: number; s: number } | null) => void;
  highlightedSupplyHex?: { q: number; r: number; s: number } | null;
  onHighlightFamily?: (family: string | null) => void;
  highlightedFamily?: string | null;
}> = ({ gameState, onEventChoice, onAction, onHighlightSupplyNode, highlightedSupplyHex, onHighlightFamily, highlightedFamily }) => {
  const [openSection, setOpenSection] = useState<string>('rivals');
  const { playSound } = useSoundSystem();
  const toggle = (id: string) => {
    if (id !== 'supply') onHighlightSupplyNode?.(null);
    if (id !== 'rivals') onHighlightFamily?.(null);
    setOpenSection(prev => (prev === id ? '' : id));
  };

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
                className={cn(
                  "rounded-lg border bg-card p-3 cursor-pointer transition-colors",
                  highlightedFamily === opponent.family ? "border-primary ring-1 ring-primary/50" : "border-border hover:border-primary/30"
                )}
                onClick={() => {
                  playSound('click');
                  onHighlightFamily?.(highlightedFamily === opponent.family ? null : opponent.family);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold capitalize text-foreground">{opponent.family}</span>
                  <Badge variant="outline" className="text-[10px] h-5">{opponent.personality}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-1 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Money</p>
                    <p className="text-xs font-medium text-foreground">${(opponent.resources.money / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Soldiers</p>
                    <p className="text-xs font-medium text-foreground">{opponent.resources.soldiers + (gameState.deployedUnits || []).filter((u: any) => u.family === opponent.family).length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Respect</p>
                    <p className="text-xs font-medium text-foreground">{opponent.resources.respect ?? 0}</p>
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
                {/* Tension Bar */}
                {(() => {
                  const tension = (gameState as any).familyTensions?.[getTensionPairKey(gameState.playerFamily, opponent.family)] || 0;
                  const activeWar = ((gameState as any).activeWars || []).find((w: any) =>
                    (w.family1 === gameState.playerFamily && w.family2 === opponent.family) ||
                    (w.family1 === opponent.family && w.family2 === gameState.playerFamily)
                  );
                  const tensionColor = activeWar ? 'bg-red-600' : tension >= 60 ? 'bg-orange-500' : tension >= 30 ? 'bg-yellow-500' : 'bg-green-500';
                  const tensionLabel = activeWar ? `AT WAR (${activeWar.turnsRemaining} turns)` : `Tension: ${Math.round(tension)}`;
                  return (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">{tensionLabel}</span>
                        {activeWar && (
                          <Badge variant="destructive" className="text-[9px] h-4 animate-pulse">
                            ⚔️ WAR
                          </Badge>
                        )}
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', tensionColor)}
                          style={{ width: `${Math.min(100, activeWar ? 100 : tension)}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* ── Supply Lines ── */}
        {(gameState as any).supplyNodes && (gameState as any).supplyNodes.length > 0 && (
          <CollapsibleSection
            title="Supply Lines"
            icon={<Truck className="h-4 w-4" />}
            isOpen={openSection === 'supply'}
            onToggle={() => toggle('supply')}
          >
            <p className="text-[10px] text-muted-foreground mb-2 italic">Connect HQ to nodes via territory to supply your businesses</p>
            <div className="space-y-2">
              {((gameState as any).supplyNodes || []).map((node: any) => {
                const cfg = SUPPLY_NODE_CONFIG[node.type as SupplyNodeType];
                const nodeTile = (gameState.hexMap || []).find((t: any) => t.q === node.q && t.r === node.r && t.s === node.s);
                const isOwned = nodeTile?.controllingFamily === gameState.playerFamily;
                // Check connection via BFS from HQ through player-controlled territory
                const isConnected = (() => {
                  const hMap = gameState.hexMap || [];
                  const hqTile = hMap.find((t: any) => t.isHeadquarters === gameState.playerFamily);
                  if (!hqTile) return false;
                  const hk = (q: number, r: number, s: number) => `${q},${r},${s}`;
                  const nodeKey = hk(node.q, node.r, node.s);
                  const visited = new Set<string>();
                  const queue: Array<{q:number;r:number;s:number}> = [{ q: hqTile.q, r: hqTile.r, s: hqTile.s }];
                  visited.add(hk(hqTile.q, hqTile.r, hqTile.s));
                  const dirs = [{q:1,r:0,s:-1},{q:-1,r:0,s:1},{q:0,r:1,s:-1},{q:0,r:-1,s:1},{q:1,r:-1,s:0},{q:-1,r:1,s:0}];
                  while (queue.length > 0) {
                    const c = queue.shift()!;
                    if (hk(c.q, c.r, c.s) === nodeKey) return true;
                    for (const d of dirs) {
                      const nq = c.q+d.q, nr = c.r+d.r, ns = c.s+d.s;
                      const nk = hk(nq, nr, ns);
                      if (visited.has(nk)) continue;
                      const t = hMap.find((h: any) => h.q === nq && h.r === nr && h.s === ns);
                      if (t && (t.controllingFamily === gameState.playerFamily || t.isHeadquarters === gameState.playerFamily || nk === nodeKey)) {
                        visited.add(nk);
                        queue.push({q:nq, r:nr, s:ns});
                      }
                    }
                  }
                  return false;
                })();
                const stockEntry = ((gameState as any).supplyStockpile || []).find(
                  (e: any) => e.family === gameState.playerFamily && e.nodeType === node.type && e.turnsSinceDisconnected > 0
                );
                const turnsSinceDisconnected = stockEntry?.turnsSinceDisconnected || 0;
                const inBuffer = !isConnected && turnsSinceDisconnected > 0 && turnsSinceDisconnected <= SUPPLY_STOCKPILE_BUFFER;
                const isDecaying = !isConnected && turnsSinceDisconnected > SUPPLY_STOCKPILE_BUFFER;
                
                // Find dependent businesses
                const depBizTypes = Object.entries(SUPPLY_DEPENDENCIES)
                  .filter(([, deps]) => deps.includes(node.type as SupplyNodeType))
                  .map(([bType]) => bType);
                
                return (
                  <div
                    key={node.type}
                    className={cn(
                      "rounded-lg border bg-card p-2.5 cursor-pointer transition-colors",
                      highlightedSupplyHex && highlightedSupplyHex.q === node.q && highlightedSupplyHex.r === node.r && highlightedSupplyHex.s === node.s
                        ? "border-primary ring-1 ring-primary/50"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                    onClick={() => {
                      playSound('click');
                      if (onHighlightSupplyNode) {
                        const isSelected = highlightedSupplyHex && highlightedSupplyHex.q === node.q && highlightedSupplyHex.r === node.r && highlightedSupplyHex.s === node.s;
                        onHighlightSupplyNode(isSelected ? null : { q: node.q, r: node.r, s: node.s });
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{cfg.icon}</span>
                      <span className="text-xs font-bold text-foreground flex-1">{cfg.label}</span>
                      {isConnected ? (
                        <Badge variant="default" className="text-[9px] h-4 bg-green-600">✓ Active</Badge>
                      ) : inBuffer ? (
                        <Badge variant="outline" className="text-[9px] h-4 border-yellow-500 text-yellow-500">Stockpile: {SUPPLY_STOCKPILE_BUFFER - turnsSinceDisconnected + 1} turn{(SUPPLY_STOCKPILE_BUFFER - turnsSinceDisconnected + 1) !== 1 ? 's' : ''} left</Badge>
                      ) : isDecaying ? (
                        <Badge variant="destructive" className="text-[9px] h-4">✗ Severed</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] h-4">— No Route</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {node.district} · {isOwned ? 'Owned' : nodeTile?.controllingFamily !== 'neutral' ? `Held by ${nodeTile?.controllingFamily}` : 'Neutral'}
                    </p>
                    {depBizTypes.length > 0 && (
                      <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                        Supplies: {depBizTypes.map(t => t.replace('_', ' ')).join(', ')}
                      </p>
                    )}
                    {inBuffer && (
                      <p className="text-[10px] text-yellow-500 mt-0.5">
                        ⏳ Businesses running on stored supplies
                      </p>
                    )}
                    {isDecaying && (
                      <p className="text-[10px] text-destructive mt-0.5">
                        ⚠️ Supply cut — businesses at {Math.max(20, 100 - (turnsSinceDisconnected - SUPPLY_STOCKPILE_BUFFER) * 10)}% revenue
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Active Supply Deals */}
            {(() => {
              const activeDeals = ((gameState as any).supplyDealPacts || []).filter((p: any) => p.active && (p.buyerFamily === gameState.playerFamily || p.targetFamily === gameState.playerFamily));
              if (activeDeals.length === 0) return null;
              return (
                <div className="mt-3 border-t border-border pt-2">
                  <p className="text-[10px] font-bold text-muted-foreground mb-1.5">📜 Active Supply Deals</p>
                  <div className="space-y-1.5">
                    {activeDeals.map((deal: any) => {
                      const isPlayerBuyer = deal.buyerFamily === gameState.playerFamily;
                      const otherFam = isPlayerBuyer ? deal.targetFamily : deal.buyerFamily;
                      const otherFamLabel = otherFam.charAt(0).toUpperCase() + otherFam.slice(1);
                      // Determine which supply types the deal partner has connected
                      const partnerConnected = (() => {
                        const hMap = gameState.hexMap || [];
                        const hqTile = hMap.find((t: any) => t.isHeadquarters === (isPlayerBuyer ? deal.targetFamily : deal.buyerFamily));
                        if (!hqTile) return new Set<string>();
                        const hk = (q: number, r: number, s: number) => `${q},${r},${s}`;
                        const visited = new Set<string>();
                        const queue: Array<{q:number;r:number;s:number}> = [{ q: hqTile.q, r: hqTile.r, s: hqTile.s }];
                        visited.add(hk(hqTile.q, hqTile.r, hqTile.s));
                        const dirs = [{q:1,r:0,s:-1},{q:-1,r:0,s:1},{q:0,r:1,s:-1},{q:0,r:-1,s:1},{q:1,r:-1,s:0},{q:-1,r:1,s:0}];
                        const supplierFam = isPlayerBuyer ? deal.targetFamily : deal.buyerFamily;
                        while (queue.length > 0) {
                          const c = queue.shift()!;
                          for (const d of dirs) {
                            const nq = c.q+d.q, nr = c.r+d.r, ns = c.s+d.s;
                            const nk = hk(nq, nr, ns);
                            if (visited.has(nk)) continue;
                            const t = hMap.find((h: any) => h.q === nq && h.r === nr && h.s === ns);
                            if (t && (t.controllingFamily === supplierFam || t.isHeadquarters === supplierFam)) {
                              visited.add(nk);
                              queue.push({q:nq, r:nr, s:ns});
                            }
                          }
                        }
                        const connTypes = new Set<string>();
                        ((gameState as any).supplyNodes || []).forEach((node: any) => {
                          if (visited.has(hk(node.q, node.r, node.s))) {
                            connTypes.add(node.type);
                          }
                        });
                        return connTypes;
                      })();
                      return (
                        <div key={deal.id} className="rounded border border-amber-500/30 bg-amber-500/5 p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-amber-400">
                              🚚 {otherFamLabel}
                            </span>
                            <Badge variant="outline" className="text-[9px] h-4 border-amber-500/50 text-amber-400">
                              {deal.turnsRemaining}t · {isPlayerBuyer ? 'Buying' : 'Selling'}
                            </Badge>
                          </div>
                          {partnerConnected.size > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Array.from(partnerConnected).map((nodeType: string) => {
                                const cfg = SUPPLY_NODE_CONFIG[nodeType as SupplyNodeType];
                                return cfg ? (
                                  <span key={nodeType} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300">
                                    {cfg.icon} {cfg.label}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </CollapsibleSection>
        )}

        {/* ── Safehouse Stockpiles ── */}
        {(() => {
          const playerSafehouses = ((gameState as any).safehouses || []).filter((sh: Safehouse) => {
            const t = (gameState.hexMap || []).find((h: any) => h.q === sh.q && h.r === sh.r && h.s === sh.s);
            return t && t.controllingFamily === gameState.playerFamily;
          });
          if (playerSafehouses.length === 0) return null;

          const supplyColors: Record<string, string> = {
            docks: 'text-blue-400', union_hall: 'text-yellow-400', trucking_depot: 'text-green-400',
            liquor_route: 'text-purple-400', food_market: 'text-orange-400',
          };

          return (
            <CollapsibleSection
              title={`Safehouse Stockpiles (${playerSafehouses.length})`}
              icon={<Package className="h-4 w-4" />}
              isOpen={openSection === 'safehouse_stockpile'}
              onToggle={() => toggle('safehouse_stockpile')}
            >
              <p className="text-[10px] text-muted-foreground mb-2 italic">
                Connect safehouses to supply lines to stockpile reserves
              </p>
              <div className="space-y-3">
                {playerSafehouses.map((sh: Safehouse, idx: number) => {
                  const shTile = (gameState.hexMap || []).find((t: any) => t.q === sh.q && t.r === sh.r && t.s === sh.s);
                  const isConnected = sh.connectedSupplyTypes && sh.connectedSupplyTypes.length > 0;
                  const isManuallyConnectable = !isConnected && !sh.manualRouteEstablished && (sh as any)._manuallyConnectable;

                  return (
                    <div key={`sh-stockpile-${idx}`} className="rounded-lg border border-border bg-card p-2.5 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🏠</span>
                        <span className="text-xs font-bold text-foreground flex-1">
                          Safehouse · {shTile?.district || '?'}
                        </span>
                        {isConnected ? (
                          <Badge variant="default" className="text-[9px] h-4 bg-green-600">🔗 Connected</Badge>
                        ) : sh.manualRouteEstablished ? (
                          <Badge variant="outline" className="text-[9px] h-4 border-yellow-500 text-yellow-500">⛓️ Route Severed</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] h-4">⛓️‍💥 Not Connected</Badge>
                        )}
                      </div>

                      {/* Establish Route button */}
                      {isManuallyConnectable && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs h-7"
                          onClick={() => onAction({
                            type: 'establish_safehouse_route',
                            q: sh.q, r: sh.r, s: sh.s,
                          })}
                        >
                          <Link2 className="h-3 w-3 mr-1" />
                          Establish Stockpile Route
                        </Button>
                      )}

                      {/* Connected supply types & stockpile bars */}
                      {isConnected && (
                        <>
                          <div className="space-y-1.5">
                            {sh.connectedSupplyTypes.map((st: SupplyNodeType) => {
                              const cfg = SUPPLY_NODE_CONFIG[st];
                              const current = sh.stockpile[st] || 0;
                              const pct = (current / SAFEHOUSE_MAX_STOCKPILE) * 100;
                              return (
                                <div key={st} className="space-y-0.5">
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className={cn('font-medium', supplyColors[st] || 'text-foreground')}>
                                      {cfg.icon} {cfg.label}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {current.toFixed(1)}/{SAFEHOUSE_MAX_STOCKPILE}
                                    </span>
                                  </div>
                                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-primary transition-all"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  {/* Release button */}
                                  {current >= 1 && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full text-[10px] h-5 mt-0.5"
                                      onClick={() => onAction({
                                        type: 'release_safehouse_stockpile',
                                        q: sh.q, r: sh.r, s: sh.s,
                                        supplyType: st,
                                      })}
                                    >
                                      📦 Release 1 Unit
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Allocation slider */}
                          <div className="space-y-1 pt-1 border-t border-border">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground">Allocation</span>
                              <span className="font-bold text-foreground">{sh.allocationPercent}%</span>
                            </div>
                            <Slider
                              value={[sh.allocationPercent]}
                              min={0}
                              max={SAFEHOUSE_MAX_ALLOCATION}
                              step={5}
                              onValueChange={(val) => onAction({
                                type: 'set_safehouse_allocation',
                                q: sh.q, r: sh.r, s: sh.s,
                                allocationPercent: val[0],
                              })}
                              className="w-full"
                            />
                            <p className="text-[9px] text-muted-foreground italic">
                              {sh.allocationPercent > 0
                                ? `Diverting ${sh.allocationPercent}% of supply flow to reserves`
                                : 'Set allocation to begin stockpiling'}
                            </p>
                          </div>
                        </>
                      )}

                      <p className="text-[9px] text-muted-foreground">
                        ⏱️ {sh.turnsRemaining} turns remaining
                      </p>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>
          );
        })()}

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
  disabledReason?: string;
  variant?: 'default' | 'destructive' | 'outline';
  onClick: () => void;
}> = ({ icon, label, sublabel, disabled, phaseLocked, disabledReason, variant = 'outline', onClick }) => {
  const isDisabled = disabled || phaseLocked;
  const tooltipText = phaseLocked ? 'Available in a different phase' : disabledReason;

  const button = (
    <Button
      variant={variant}
      size="sm"
      disabled={isDisabled}
      onClick={onClick}
      className={cn("w-full justify-start text-xs h-9 gap-2", phaseLocked && "opacity-50")}
    >
      {phaseLocked ? <Shield className="h-3.5 w-3.5 text-muted-foreground" /> : icon}
      <span className="flex-1 text-left">{label}</span>
      {phaseLocked ? (
        <span className="text-[10px] text-muted-foreground font-normal">🔒</span>
      ) : disabled && disabledReason ? (
        <span className="text-[10px] text-destructive/80 font-normal">{disabledReason}</span>
      ) : (
        <span className="text-[10px] text-muted-foreground font-normal">{sublabel}</span>
      )}
    </Button>
  );

  if (isDisabled && tooltipText) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="w-full block">{button}</span>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

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
      {phaseLocked && <span className="text-[9px] text-muted-foreground font-normal italic">({title.includes('Recruit') || title.includes('Tactical') ? 'Tactical Step' : 'Action Step'})</span>}
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
