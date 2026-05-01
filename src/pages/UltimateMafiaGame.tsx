import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NegotiationDialog from '@/components/NegotiationDialog';
import { NotificationProvider, useMafiaNotifications } from '@/components/ui/notification-system';
import { AnimatedCard, AnimatedCardHeader, AnimatedCardTitle, AnimatedCardContent } from '@/components/ui/animated-card';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ResponsiveLayout, { MobileTabBar, MobileFloatingActionButton } from '@/components/ResponsiveLayout';
import EnhancedMafiaHexGrid from '@/components/EnhancedMafiaHexGrid';
import { LeftSidePanel, RightSidePanel } from '@/components/GameSidePanels';
import { useEnhancedMafiaGameState } from '@/hooks/useEnhancedMafiaGameState';
import { useSoundSystem } from '@/hooks/useSoundSystem';
import SaveLoadDialog from '@/components/SaveLoadDialog';
import EnemyHexActionDialog from '@/components/EnemyHexActionDialog';
import GameGuide from '@/components/GameGuide';
import { HeadquartersInfoPanel } from '@/components/HeadquartersInfoPanel';
import AlertsLogPanel from '@/components/AlertsLogPanel';
import TurnSummaryModal from '@/components/TurnSummaryModal';
import CommissionVoteModal from '@/components/CommissionVoteModal';
import FamilySelectionScreen from '@/components/FamilySelectionScreen';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Info, 
  Users,
  DollarSign,
  Shield,
  Brain,
  Target,
  Swords,
  Eye,
  SkipForward,
  LogOut,
  Settings,
  Lock
} from 'lucide-react';
import { PHASE_CONFIGS, COMMISSION_VOTE_COST, SUPPLY_DEPENDENCIES, SupplyNodeType } from '@/types/game-mechanics';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { buildThreatSections } from '@/lib/threat-board';
import SoundSettingsDialog from '@/components/SoundSettingsDialog';

type FamilyId = 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';

type MapSize = 'small' | 'medium' | 'large';

interface GameConfig {
  family: FamilyId;
  resources: { money: number; soldiers: number; influence: number; politicalPower: number; respect: number };
  difficulty: 'easy' | 'normal' | 'hard';
  seed?: number;
  mapSize?: MapSize;
}

const GameContent: React.FC<{ config: GameConfig; onExitToMenu: () => void }> = ({ config, onExitToMenu }) => {
  const {
    gameState,
    endTurn,
    selectTerritory,
    performAction,
    performBusinessAction,
    performReputationAction,
    handleEventChoice,
    startMovementPhase,
    selectUnit,
    moveUnit,
    endMovementPhase,
    advancePhase,
    skipToActionPhase,
    selectHeadquarters,
    selectUnitFromHeadquarters,
    deployUnit,
    isWinner,
    clearNotifications,
    markAlertsRead,
    fortifyUnit,
    setMoveAction,
    startEscort,
    resolveEnemyHexAction,
  } = useEnhancedMafiaGameState(config.family, config.resources, config.difficulty, config.seed, config.mapSize);

  const { notifySuccess, notifyError, notifyWarning, notifyInfo, notifyTerritoryCaptured, notifyReputationChange } = useMafiaNotifications();
  const { playSound, playSoundSequence, updateSoundConfig, soundConfig } = useSoundSystem();
  const [showSoundSettings, setShowSoundSettings] = useState(false);

  // Drain pending notifications from game state into the notification system
  useEffect(() => {
    if (gameState.pendingNotifications.length > 0) {
      gameState.pendingNotifications.forEach(n => {
        switch (n.type) {
          case 'success': notifySuccess(n.title, n.message); playSound('success'); break;
          case 'error': notifyError(n.title, n.message); playSound('danger'); break;
          case 'warning': notifyWarning(n.title, n.message); playSound('error'); break;
          case 'info': notifyInfo(n.title, n.message); playSound('notification'); break;
        }
      });
      clearNotifications();
    }
  }, [gameState.pendingNotifications, notifySuccess, notifyError, notifyWarning, notifyInfo, clearNotifications]);

  // Clear planHitMode when phase changes
  useEffect(() => { setPlanHitMode(false); setPlanHitStep('selectSoldier'); setPlanHitPlannerId(null); setShowPlanHitSoldierMenu(false); }, [gameState.turnPhase]);

  // Global button click sound
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') && !target.closest('[data-no-sound]')) {
        playSound('click');
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [playSound]);

  // Play sounds on combat results
  useEffect(() => {
    if (gameState.lastCombatResult) {
      const { success, type } = gameState.lastCombatResult;
      if (type === 'hit') {
        if (success) playSoundSequence(['hit_success', 'success']);
        else playSoundSequence(['hit_fail', 'error']);
      } else if (type === 'extort') {
        if (success) playSoundSequence(['extort_success', 'money']);
        else playSound('extort_fail');
      } else if (type === 'sabotage') {
        if (success) playSound('combat');
        else playSound('error');
      }
    }
  }, [gameState.lastCombatResult, playSound, playSoundSequence]);

  // Show turn summary when a new report comes in
  useEffect(() => {
    if (gameState.turnReport && gameState.turnReport.turn === gameState.turn) {
      setShowTurnSummary(true);
    }
  }, [gameState.turnReport, gameState.turn]);

  // Negotiation dialog state
  const [negotiationState, setNegotiationState] = useState<{
    open: boolean;
    targetQ: number;
    targetR: number;
    targetS: number;
    capoId: string;
    scope: 'territory';
    pendingNegotiationId?: string;
    incomingSitdownId?: string;
    lockedDealType?: any;
    proposedAmount?: number;
    proposerLabel?: string;
    successBonus?: number;
    targetFamilyOverride?: string;
  } | {
    open: boolean;
    scope: 'family';
    targetFamily: string;
    incomingSitdownId?: string;
    successBonus?: number;
  } | null>(null);

  // Plan Hit mode — 2-step: select soldier, then select target hex+unit
  const [planHitMode, setPlanHitMode] = useState(false);
  const [planHitStep, setPlanHitStep] = useState<'selectSoldier' | 'selectTarget'>('selectSoldier');
  const [planHitPlannerId, setPlanHitPlannerId] = useState<string | null>(null);
  const [showPlanHitSoldierMenu, setShowPlanHitSoldierMenu] = useState(false);

  // Handle action wrapper function
  const handleAction = useCallback((action: any) => {
    if (action.type === 'open_negotiate') {
      setNegotiationState({
        open: true,
        targetQ: action.targetQ,
        targetR: action.targetR,
        targetS: action.targetS,
        capoId: action.capoId,
        scope: 'territory',
        pendingNegotiationId: action.pendingNegotiationId,
      });
      return;
    }
    if (action.type === 'open_boss_negotiate') {
      setNegotiationState({
        open: true,
        scope: 'family',
        targetFamily: action.targetFamily || '',
      });
      return;
    }
    if (action.type === 'enter_plan_hit_mode') {
      setPlanHitMode(true);
      setPlanHitStep('selectSoldier');
      setPlanHitPlannerId(null);
      setShowPlanHitSoldierMenu(true);
      return;
    }
    if (action.type === 'cancel_plan_hit_mode') {
      setPlanHitMode(false);
      setPlanHitStep('selectSoldier');
      setPlanHitPlannerId(null);
      setShowPlanHitSoldierMenu(false);
      return;
    }
    if (action.type === 'plan_hit_select_soldier') {
      setPlanHitPlannerId(action.unitId);
      setPlanHitStep('selectTarget');
      setShowPlanHitSoldierMenu(false);
      return;
    }
    if (action.type === 'plan_hit') {
      performAction(action);
      setPlanHitMode(false);
      setPlanHitStep('selectSoldier');
      setPlanHitPlannerId(null);
      return;
    }
    performAction(action);
  }, [performAction]);

  // playSound/playSoundSequence already destructured above
  const [activeMobileTab, setActiveMobileTab] = useState('map');
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTurnSummary, setShowTurnSummary] = useState(false);
  const [bossHighlightHex, setBossHighlightHex] = useState<{ q: number; r: number; s: number } | null>(null);
  const [highlightedFamily, setHighlightedFamily] = useState<string | null>(null);
  const [selectedHeadquarters, setSelectedHeadquarters] = useState<{
    family: string;
    headquarters: any;
    units: any;
  } | null>(null);

  // Handle headquarters selection
  const handleHeadquartersClick = useCallback((family: string) => {
    // Toggle: if same HQ is already open, close it
    if (selectedHeadquarters?.family === family) {
      setSelectedHeadquarters(null);
      return;
    }
    const headquarters = gameState.headquarters[family];
    const units = gameState.units[family];
    
    if (headquarters && units) {
      setSelectedHeadquarters({
        family,
        headquarters,
        units
      });
    }
  }, [gameState.headquarters, gameState.units, selectedHeadquarters?.family]);

  // Close headquarters panel
  const closeHeadquartersPanel = useCallback(() => {
    setSelectedHeadquarters(null);
    setBossHighlightHex(null);
  }, []);
  // notifyTerritoryCaptured and notifyReputationChange already destructured above

  // Handle loading a saved game
  const handleLoadGame = (loadedGameState: any) => {
    // This would need to be implemented in the game state hook
    // For now, we'll just show a notification
    console.log('Loading game:', loadedGameState);
    playSound('success');
  };

  const mobileTabs = [
    {
      id: 'map',
      label: 'Map',
      icon: <Target className="h-4 w-4" />,
      content: (
        <div className="h-full">
          <EnhancedMafiaHexGrid 
            key="hex-grid-mobile"
            width={12}
            height={12}
            onBusinessClick={(business) => {
              selectTerritory({
                q: business.q, r: business.r, s: business.s,
                district: business.district, family: business.family,
                business: { type: business.businessType as any, income: business.income }
              });
              const districtHexes = (gameState.hexMap || []).filter(t => t.district === business.district);
              const playerHexes = districtHexes.filter(t => t.controllingFamily === gameState.playerFamily);
              const controlPct = districtHexes.length > 0 ? playerHexes.length / districtHexes.length : 0;
              if (controlPct >= 0.6) {
                notifyTerritoryCaptured(business.district);
              }
            }}
            selectedBusiness={null}
            playerFamily={gameState.playerFamily}
            gameState={gameState}
            onAction={handleAction}
            onSelectUnit={selectUnit}
            onMoveUnit={moveUnit}
            onSelectHeadquarters={handleHeadquartersClick}
            onSelectUnitFromHeadquarters={selectUnitFromHeadquarters}
            onDeployUnit={deployUnit}
            planHitMode={planHitMode}
            planHitStep={planHitStep}
            planHitPlannerId={planHitPlannerId}
            onPlanHitSelect={(q, r, s, targetUnitId) => handleAction({ type: 'plan_hit', plannerUnitId: planHitPlannerId, targetUnitId })}
            onPlanHitSelectSoldier={(unitId) => handleAction({ type: 'plan_hit_select_soldier', unitId })}
            onCancelPlanHit={() => handleAction({ type: 'cancel_plan_hit_mode' })}
            bossHighlightHex={bossHighlightHex}
            highlightedFamily={highlightedFamily}
            onClearHighlight={() => { setBossHighlightHex(null); setHighlightedFamily(null); }}
          />
        </div>
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      icon: <Swords className="h-4 w-4" />,
      content: <LeftSidePanel gameState={gameState} onAction={handleAction} turnPhase={gameState.turnPhase} onSelectUnit={selectUnit} />
    },
    {
      id: 'intel',
      label: 'Intel',
      icon: <Eye className="h-4 w-4" />,
      content: <RightSidePanel gameState={gameState} onEventChoice={handleEventChoice} onAction={handleAction} onHighlightSupplyNode={setBossHighlightHex} highlightedSupplyHex={bossHighlightHex} onHighlightFamily={setHighlightedFamily} highlightedFamily={highlightedFamily} onSelectUnit={selectUnit} />
    },
  ];

  // RICO or Bankruptcy Game Over
  if (gameState.gameOver?.type === 'rico' || (gameState.gameOver as any)?.type === 'bankruptcy' || (gameState.gameOver as any)?.type === 'assassination' || (gameState.gameOver as any)?.type === 'federal_indictment') {
    const goType = (gameState.gameOver as any)?.type;
    const playerTerritoryCount = gameState.hexMap.filter(h => h.controllingFamily === gameState.playerFamily).length;
    const playerSoldierCount = gameState.deployedUnits.filter(u => u.family === gameState.playerFamily && u.type === 'soldier').length;
    const eliminatedCount = (gameState as any).eliminatedFamilies?.length || 0;
    const goEmoji = goType === 'rico' ? '🚨' : goType === 'federal_indictment' ? '🏛️' : goType === 'assassination' ? '🔫' : '💸';
    const goTitle = goType === 'rico' ? 'RICO INDICTMENT' : goType === 'federal_indictment' ? 'FEDERAL INDICTMENT' : goType === 'assassination' ? 'THE COMMISSION HAS SPOKEN' : 'BANKRUPTCY';
    const goDesc = goType === 'rico'
      ? 'The federal government has dismantled your criminal empire after 5 consecutive turns at critical heat.'
      : goType === 'federal_indictment'
      ? 'A federal grand jury has indicted the entire organization. Unable to pay for legal defense, the empire crumbles.'
      : goType === 'assassination'
      ? 'With no soldiers, no money, and no way out — the other families voted. The Boss sleeps with the fishes.'
      : 'Your family collapsed under crushing debt. The other families have divided your territory.';
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center p-8 max-w-lg"
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-6xl mb-4"
          >
            {goEmoji}
          </motion.div>
          <motion.h1
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-4xl font-bold text-destructive mb-4 font-playfair"
          >
            {goTitle}
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-lg text-muted-foreground mb-6"
          >
            {goDesc}
          </motion.p>
          {/* Post-game stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="grid grid-cols-2 gap-3 mb-6 text-left bg-card/80 rounded-lg p-4 border border-border"
          >
            <div className="text-xs text-muted-foreground">Turns Survived</div>
            <div className="text-xs font-bold text-foreground">{gameState.gameOver?.turn || gameState.turn}</div>
            <div className="text-xs text-muted-foreground">Territory Held</div>
            <div className="text-xs font-bold text-foreground">{playerTerritoryCount} hexes</div>
            <div className="text-xs text-muted-foreground">Soldiers Remaining</div>
            <div className="text-xs font-bold text-foreground">{playerSoldierCount}</div>
            <div className="text-xs text-muted-foreground">Families Eliminated</div>
            <div className="text-xs font-bold text-foreground">{eliminatedCount}/4</div>
            <div className="text-xs text-muted-foreground">Final Wealth</div>
            <div className="text-xs font-bold text-foreground">${gameState.resources.money.toLocaleString()}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <Badge variant="destructive" className="text-xl px-6 py-3 font-playfair">
              GAME OVER — Turn {gameState.gameOver?.turn || gameState.turn}
            </Badge>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-8"
          >
            <Button size="lg" onClick={onExitToMenu} className="font-playfair text-lg px-8 py-3">
              <LogOut className="h-5 w-5 mr-2" />
              Return to Main Menu
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (isWinner) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center p-8 max-w-lg"
        >
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-6xl font-bold text-mafia-gold mb-4 font-playfair"
          >
            CONGRATULATIONS
          </motion.h1>
          <motion.h2
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-3xl text-mafia-gold mb-6 font-playfair"
          >
            Ultimate Boss of All Bosses
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-xl text-foreground mb-4"
          >
            You have successfully dominated New York's underworld with advanced tactics.
          </motion.p>
          {/* Post-game stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="grid grid-cols-2 gap-3 mb-6 text-left bg-card/80 rounded-lg p-4 border border-border"
          >
            <div className="text-xs text-muted-foreground">Turns Played</div>
            <div className="text-xs font-bold text-foreground">{gameState.turn}</div>
            <div className="text-xs text-muted-foreground">Territory Controlled</div>
            <div className="text-xs font-bold text-foreground">{gameState.hexMap.filter(h => h.controllingFamily === gameState.playerFamily).length} hexes</div>
            <div className="text-xs text-muted-foreground">Soldiers Remaining</div>
            <div className="text-xs font-bold text-foreground">{gameState.deployedUnits.filter(u => u.family === gameState.playerFamily && u.type === 'soldier').length}</div>
            <div className="text-xs text-muted-foreground">Families Eliminated</div>
            <div className="text-xs font-bold text-foreground">{(gameState as any).eliminatedFamilies?.length || 0}/4</div>
            <div className="text-xs text-muted-foreground">Final Wealth</div>
            <div className="text-xs font-bold text-foreground">${gameState.resources.money.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Respect</div>
            <div className="text-xs font-bold text-foreground">{gameState.resources.respect}%</div>
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <Badge className="text-2xl px-8 py-4 bg-mafia-gold text-background font-playfair">
              ULTIMATE VICTORY ACHIEVED
            </Badge>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="mt-8"
          >
            <Button
              size="lg"
              onClick={onExitToMenu}
              className="font-playfair text-lg px-8 py-3"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Return to Main Menu
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Sitdowns minicard handlers (shared between mobile/tab and desktop sidebar mounts)
  const handleOpenOutgoingSitdown = useCallback((p: any) => {
    setNegotiationState({
      open: true,
      targetQ: p.targetQ,
      targetR: p.targetR,
      targetS: p.targetS,
      capoId: p.capoId,
      scope: 'territory',
      pendingNegotiationId: p.id,
    });
  }, []);
  const handleAcceptIncomingSitdown = useCallback((s: any) => {
    if (s.scope === 'territory' && s.targetQ !== undefined) {
      const fam = String(s.fromFamily || '');
      const famLabel = fam.charAt(0).toUpperCase() + fam.slice(1);
      setNegotiationState({
        open: true,
        scope: 'territory',
        targetQ: s.targetQ,
        targetR: s.targetR,
        targetS: s.targetS,
        capoId: '',
        incomingSitdownId: s.id,
        lockedDealType: s.proposedDeal,
        proposedAmount: s.proposedAmount,
        successBonus: s.successBonus,
        targetFamilyOverride: s.fromFamily,
        proposerLabel: s.fromCapoName ? `${s.fromCapoName} (${famLabel})` : famLabel,
      });
    } else {
      setNegotiationState({
        open: true,
        scope: 'family',
        targetFamily: s.fromFamily,
        incomingSitdownId: s.id,
        successBonus: s.successBonus,
      });
    }
  }, []);
  const handleDeclineIncomingSitdown = useCallback((s: any) => {
    performAction({ type: 'decline_incoming_sitdown', sitdownId: s.id });
  }, [performAction]);

  const leftSidebar = (
    <LeftSidePanel gameState={gameState} onAction={handleAction} turnPhase={gameState.turnPhase} onSelectUnit={selectUnit} />
  );

  const rightSidebar = (
    <RightSidePanel
      gameState={gameState}
      onEventChoice={handleEventChoice}
      onAction={handleAction}
      onHighlightSupplyNode={setBossHighlightHex}
      highlightedSupplyHex={bossHighlightHex}
      onHighlightFamily={setHighlightedFamily}
      highlightedFamily={highlightedFamily}
      onSelectUnit={selectUnit}
      onOpenOutgoingSitdown={handleOpenOutgoingSitdown}
      onAcceptIncomingSitdown={handleAcceptIncomingSitdown}
      onDeclineIncomingSitdown={handleDeclineIncomingSitdown}
    />
  );

  const topBar = (
    <div className="flex items-center justify-between w-full px-6 py-4 bg-gradient-to-r from-noir-dark to-background border-b border-noir-light">
      {/* Left side - Game Title */}
      <div className="flex items-center space-x-3">
        <motion.h1
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-xl font-bold text-mafia-gold font-playfair"
        >
          ULTIMATE FIVE FAMILIES
        </motion.h1>
        <div className="h-6 w-px bg-noir-light" />
        <span className="text-sm text-muted-foreground font-source">Enhanced Underworld</span>
        {(gameState as any).mapSeed && (
          <span className="text-[10px] text-muted-foreground/50 font-mono">Seed: {(gameState as any).mapSeed}</span>
        )}
      </div>
      
      {/* Center - Game Status */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-lg font-bold text-mafia-gold">Turn {gameState.turn}</div>
            <div className="text-xs text-muted-foreground capitalize">{gameState.season}</div>
          </div>
          {(gameState.ricoTimer || 0) > 0 && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="text-center px-3 py-1 rounded-lg bg-destructive/20 border border-destructive/40"
            >
              <div className="text-sm font-bold text-destructive">🚨 RICO {gameState.ricoTimer}/5</div>
            </motion.div>
          )}
          {(gameState as any).prosecutionTimer > 0 && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-center px-3 py-1 rounded-lg bg-orange-500/20 border border-orange-500/40"
            >
              <div className="text-sm font-bold text-orange-400">⚖️ PROSECUTION {(gameState as any).prosecutionTimer}/3</div>
            </motion.div>
          )}
          <div className="text-center">
            <div className="text-sm font-medium text-green-400">Commission Active</div>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 bg-green-400 rounded-full mx-auto mt-1"
            />
          </div>
        </div>
        {/* Status HUD Badges */}
        {(() => {
          const bossCd = (gameState as any).bossNegotiationCooldown || 0;
          const capoCd = (gameState as any).capoNegotiationCooldown || 0;
          const hasCooldowns = bossCd > 0 || capoCd > 0;
          
          const expiringPacts: Array<{ label: string; emoji: string }> = [];
          (gameState.ceasefires || []).filter((c: any) => c.active && c.turnsRemaining <= 1).forEach((c: any) => {
            expiringPacts.push({ label: `Ceasefire w/ ${c.family.charAt(0).toUpperCase() + c.family.slice(1)}`, emoji: '🤝' });
          });
          (gameState.alliances || []).filter((a: any) => a.active && a.turnsRemaining <= 1).forEach((a: any) => {
            expiringPacts.push({ label: `Alliance w/ ${(a.alliedFamily || a.family || '').charAt(0).toUpperCase() + (a.alliedFamily || a.family || '').slice(1)}`, emoji: '⚖️' });
          });
          ((gameState as any).shareProfitsPacts || []).filter((p: any) => p.active && p.turnsRemaining <= 1).forEach((p: any) => {
            expiringPacts.push({ label: `Profits w/ ${p.targetFamily.charAt(0).toUpperCase() + p.targetFamily.slice(1)}`, emoji: '💰' });
          });
          ((gameState as any).safePassagePacts || []).filter((p: any) => p.active && p.turnsRemaining <= 1).forEach((p: any) => {
            expiringPacts.push({ label: `Passage w/ ${p.targetFamily.charAt(0).toUpperCase() + p.targetFamily.slice(1)}`, emoji: '🛤️' });
          });
          ((gameState as any).supplyDealPacts || []).filter((p: any) => p.active && p.turnsRemaining <= 1).forEach((p: any) => {
            const isPlayerBuyer = p.buyerFamily === gameState.playerFamily;
            const otherFam = isPlayerBuyer ? p.targetFamily : p.buyerFamily;
            expiringPacts.push({ label: `Supply Deal w/ ${otherFam.charAt(0).toUpperCase() + otherFam.slice(1)}`, emoji: '🚚' });
          });

          const deployedCount = (gameState.deployedUnits || []).filter((u: any) => u.family === gameState.playerFamily && u.type === 'soldier').length;
          const totalSoldiers = deployedCount + (gameState.resources?.soldiers || 0);
          const deployRatio = totalSoldiers > 0 ? deployedCount / totalSoldiers : 0;

          // Threat counter — mirrors ThreatBoardPanel logic (count + tone)
          const playerFam = gameState.playerFamily;
          const units = gameState.deployedUnits || [];
          let threatCount = 0;
          let threatHasCritical = false;
          let threatHasIncoming = false;
          for (const ph of ((gameState as any).aiPlannedHits || [])) {
            if (!ph.detectedVia) continue;
            const target = units.find((u: any) => u.id === ph.targetUnitId);
            if (!target || target.family !== playerFam) continue;
            threatCount++; threatHasCritical = true; threatHasIncoming = true;
          }
          threatCount += ((gameState as any).hitmanContracts || []).length;
          for (const war of (gameState.activeWars || [])) {
            if (war.family1 === playerFam || war.family2 === playerFam) { threatCount++; threatHasCritical = true; }
          }
          for (const cf of (gameState.ceasefires || [])) if (cf.active && cf.turnsRemaining <= 2) threatCount++;
          for (const al of ((gameState as any).alliances || [])) if (al.active && al.turnsRemaining <= 2) threatCount++;
          for (const sp of ((gameState as any).safePassagePacts || [])) if (sp.active && sp.turnsRemaining <= 2) threatCount++;
          for (const b of ((gameState as any).aiBounties || [])) {
            if (b.targetFamily === playerFam) { threatCount++; threatHasCritical = true; }
          }
          const stats = (gameState as any).soldierStats || {};
          for (const u of units) {
            if (u.family !== playerFam) continue;
            const s = stats[u.id]; if (!s) continue;
            if (s.markedForDeath) { threatCount++; threatHasCritical = true; }
            else if (s.loyalty < 40 && u.type === 'soldier') threatCount++;
          }
          // Law Enforcement
          const _heat = (gameState as any).policeHeat?.level || 0;
          const _risk = (gameState as any).legalStatus?.prosecutionRisk || 0;
          if (_heat >= 70) { threatCount++; threatHasCritical = true; }
          else if (_heat >= 30) { threatCount++; }
          if (_risk >= 50) {
            threatCount++;
            if (((gameState as any).prosecutionTimer || 0) > 0 || ((gameState as any).federalIndictmentTimer || 0) > 0) threatHasCritical = true;
          } else if (_risk >= 30) { threatCount++; }
          threatCount += ((gameState as any).arrestedSoldiers || []).length;
          const _capJail = ((gameState as any).arrestedCapos || []).length;
          if (_capJail > 0) { threatCount += _capJail; threatHasCritical = true; }
          const threatTone = threatCount === 0
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            : threatHasCritical
              ? 'bg-destructive/20 border-destructive/40 text-destructive'
              : 'bg-amber-500/20 border-amber-500/30 text-amber-400';
          const threatLabel = threatCount === 0 ? '✓' : threatHasIncoming ? '⚠' : '';
          const threatSections = buildThreatSections(gameState);
          const popoverEmptyTone = 'text-emerald-400/80';
          const threatBadge = (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  data-no-sound
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] border cursor-pointer hover:brightness-125 transition',
                    threatTone,
                    threatHasIncoming && 'animate-pulse'
                  )}
                >
                  🚨 Threats: {threatCount} {threatLabel}
                </button>
              </PopoverTrigger>
              <PopoverContent align="center" sideOffset={6} className="w-80 max-h-[480px] overflow-y-auto p-2 bg-card border-border">
                {threatSections.length === 0 ? (
                  <p className={cn('text-xs italic px-2 py-3 text-center', popoverEmptyTone)}>
                    ✓ All clear. No active threats.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {threatSections.map(section => (
                      <div key={section.id}>
                        <div className="flex items-center gap-1.5 px-1 mb-1">
                          <span className="text-[11px]">{section.iconEmoji}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {section.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60">({section.rows.length})</span>
                        </div>
                        <div className="space-y-0.5">
                          {section.rows.map(row => {
                            const clickable = !!(row.hex && row.unitType);
                            return (
                              <button
                                key={row.id}
                                type="button"
                                data-no-sound
                                disabled={!clickable}
                                onClick={() => {
                                  if (clickable && row.hex && row.unitType) {
                                    selectUnit(row.unitType as 'soldier' | 'capo', row.hex);
                                  }
                                }}
                                className={cn(
                                  'w-full text-left rounded border px-2 py-1 flex items-center justify-between gap-2 transition-colors',
                                  row.severity === 'critical'
                                    ? 'border-destructive/30 bg-destructive/5'
                                    : 'border-border bg-background/40',
                                  clickable
                                    ? 'cursor-pointer hover:bg-accent/40 hover:border-primary/40'
                                    : 'cursor-default opacity-90'
                                )}
                              >
                                <span className="text-[11px] font-medium text-foreground truncate">
                                  {row.label}
                                </span>
                                {row.badge && (
                                  <span
                                    className={cn(
                                      'text-[9px] h-4 px-1.5 rounded border shrink-0 inline-flex items-center',
                                      row.badge.tone === 'danger' && 'bg-destructive/20 border-destructive/40 text-destructive',
                                      row.badge.tone === 'warn' && 'bg-amber-500/20 border-amber-500/40 text-amber-400',
                                      row.badge.tone === 'muted' && 'bg-muted/30 border-muted text-muted-foreground'
                                    )}
                                  >
                                    {row.badge.text}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          );

          if (!hasCooldowns && expiringPacts.length === 0 && totalSoldiers === 0) {
            return <div className="flex flex-wrap items-center justify-center gap-1">{threatBadge}</div>;
          }

          return (
            <div className="flex flex-wrap items-center justify-center gap-1">
              {threatBadge}
              {expiringPacts.map((p, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 border border-amber-500/30 text-amber-400 animate-pulse">
                  ⚠️ {p.emoji} {p.label} expires!
                </span>
              ))}
              {hasCooldowns && (
                <>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] border ${bossCd > 0 ? 'bg-muted/30 border-muted text-muted-foreground' : 'bg-green-500/20 border-green-500/30 text-green-400'}`}>
                    🏛️ Boss: {bossCd > 0 ? `${bossCd}t` : 'Ready'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] border ${capoCd > 0 ? 'bg-muted/30 border-muted text-muted-foreground' : 'bg-green-500/20 border-green-500/30 text-green-400'}`}>
                    👔 Capo: {capoCd > 0 ? `${capoCd}t` : 'Ready'}
                  </span>
                </>
              )}
              {totalSoldiers > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] border ${deployRatio > 0.5 ? 'bg-green-500/20 border-green-500/30 text-green-400' : deployRatio < 0.3 ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-muted/30 border-muted text-muted-foreground'}`}>
                  ⚔️ {deployedCount}/{totalSoldiers} deployed
                </span>
              )}
              {/* Active family power effects */}
              {(gameState as any).frontBossHexes?.length > 0 && (gameState as any).frontBossHexes.some((h: any) => h.ownerFamily === gameState.playerFamily) && (
                <span className="px-2 py-0.5 rounded-full text-[10px] border bg-purple-500/15 border-purple-500/25 text-purple-400">
                  🎭 Front Boss: {Math.max(...(gameState as any).frontBossHexes.filter((h: any) => h.ownerFamily === gameState.playerFamily).map((h: any) => h.turnsRemaining))}t
                </span>
              )}
              {(gameState as any).luccheseBoostedDistrict && (gameState as any).luccheseBoostedDistrict.family === gameState.playerFamily && (
                <span className="px-2 py-0.5 rounded-full text-[10px] border bg-amber-500/15 border-amber-500/25 text-amber-400">
                  💰 Shakedown: {(gameState as any).luccheseBoostedDistrict.turnsRemaining}t
                </span>
              )}
              {(gameState as any).bonannoPurgeImmunity?.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] border bg-teal-500/15 border-teal-500/25 text-teal-400">
                  🛡️ Purge: {Math.max(...(gameState as any).bonannoPurgeImmunity.map((i: any) => i.turnsRemaining))}t
                </span>
              )}
              {/* Power cooldown (tactical phase only) */}
              {gameState.turnPhase === 'move' && (() => {
                const cd = ((gameState as any).familyPowerCooldowns || {})[gameState.playerFamily] || 0;
                if (cd <= 0) return null;
                return (
                  <span className="px-2 py-0.5 rounded-full text-[10px] border bg-muted/30 border-muted text-muted-foreground">
                    ⚡ Power: {cd}t CD
                  </span>
                );
              })()}
            </div>
          );
        })()}
      </div>
      
      {/* Right side - Actions */}
      <div className="flex items-center space-x-2">
        {/* Phase indicator */}
        <div className="flex items-center space-x-1 bg-background/80 rounded-lg px-2 py-1 border border-noir-light">
          {(['deploy', 'move', 'action'] as const).map((phase) => (
              <div
                key={phase}
                className={cn(
                  "px-3 py-1 rounded text-xs font-bold uppercase transition-all",
                  gameState.turnPhase === phase
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                {phase === 'deploy' ? 'deploy' : phase === 'move' ? 'tactical' : phase}
              </div>
            ))}
        </div>

        <Button
          size="sm"
          onClick={() => advancePhase()}
          disabled={gameState.turnPhase === 'waiting'}
          className={cn("font-medium", gameState.turnPhase !== 'waiting' && gameState.turnPhase !== 'action' && "animate-pulse")}
          variant={gameState.turnPhase === 'action' ? 'default' : 'outline'}
        >
          <SkipForward className="h-4 w-4 mr-2" />
          {gameState.turnPhase === 'action' ? 'End Turn' : gameState.turnPhase === 'waiting' ? 'Waiting...' : 'Next Step'}
        </Button>

        {(gameState.turnPhase === 'deploy' || gameState.turnPhase === 'move') && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => skipToActionPhase()}
            className="font-medium text-muted-foreground hover:text-foreground"
          >
            ⏭ Skip to Action
          </Button>
        )}

        <SaveLoadDialog 
          gameState={gameState} 
          onLoadGame={handleLoadGame}
        />
        <AlertsLogPanel
          alerts={gameState.alertsLog || []}
          currentTurn={gameState.turn}
          onMarkAllRead={markAlertsRead}
          onSelectUnit={(unitType, hex) => selectUnit(unitType, hex)}
        />
        <Button
          variant="outline"
          size="sm"
          data-no-sound
          onClick={() => setShowSoundSettings(true)}
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTutorial(true)}
        >
          <Info className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (window.confirm('Return to main menu? Unsaved progress will be lost.')) {
              onExitToMenu();
            }
          }}
          className="text-destructive hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => {
            if (gameState.turnPhase !== 'waiting') {
              if (!window.confirm('End your turn early? You still have actions remaining.')) return;
            }
            playSound('notification');
            endTurn();
          }}
          size="sm"
          className="bg-primary text-primary-foreground font-bold font-playfair hover:bg-primary/90"
          disabled={gameState.legalStatus.jailTime > 0}
        >
          <SkipForward className="h-4 w-4 mr-2" />
          {gameState.legalStatus.jailTime > 0 ? `JAILED (${gameState.legalStatus.jailTime})` : 'END TURN'}
        </Button>
      </div>
    </div>
  );

  const bottomBar = (
    <div className="flex items-center justify-between w-full px-6 py-3 bg-gradient-to-r from-background to-noir-dark border-t border-noir-light">
      {/* Left side - Selected Territory */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-mafia-gold rounded-full" />
          <span className="text-sm font-medium text-mafia-gold">
            {gameState.selectedTerritory ? 
             `${gameState.selectedTerritory.district} - ${gameState.selectedTerritory.family.toUpperCase()}` : 
             'No Territory Selected'}
          </span>
        </div>
        
        {/* Phase Status */}
        {(gameState.selectedUnitId || gameState.deployMode) && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-accent/20 rounded-full border border-accent/30">
            <Target className="h-3 w-3 text-accent-foreground" />
            <span className="text-xs font-medium text-accent-foreground">
              {gameState.deployMode 
                ? `Deploying ${gameState.deployMode.unitType} — click a highlighted hex`
                : (() => {
                    const unit = gameState.deployedUnits.find((u: any) => u.id === gameState.selectedUnitId);
                    if (!unit) return 'Select a unit';
                    if (gameState.turnPhase === 'action') return `${unit.type === 'capo' ? '👔' : '👤'} ${unit.type} selected — click a highlighted hex to act`;
                    return `Moving ${unit.type} (${unit.movesRemaining} moves left)`;
                  })()
              }
            </span>
          </div>
        )}
        {!gameState.selectedUnitId && !gameState.deployMode && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-muted/50 rounded-full">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Phase: {gameState.turnPhase === 'deploy' ? '📦 Deploy & move units across the map' : gameState.turnPhase === 'move' ? '📋 Tactical actions only (Scout, Fortify, Escort) — no movement' : gameState.turnPhase === 'action' ? `⚔️ Select a unit first, then click a target — ${gameState.actionsRemaining}/${gameState.maxActions} actions left` : '⏳ End your turn'}
            </span>
          </div>
        )}

        {/* Tactical action toolbar — only during tactical (move) phase */}
        {gameState.turnPhase === 'move' && (
            <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 bg-background/80 rounded-lg px-2 py-1 border border-noir-light">
              <span className="text-[10px] text-muted-foreground mr-1">📋 {gameState.tacticalActionsRemaining}/{gameState.maxTacticalActions}</span>
              {([
                { action: 'scout' as const, label: '👁️ Scout', tip: 'Select a soldier or capo, click an enemy hex to scout. Soldiers: 1 hex, Capos: 2 hexes.' },
                { action: 'fortify' as const, label: `🛡️ Fortify (${(gameState.fortifiedHexes || []).filter((f: any) => f.family === gameState.playerFamily).length}/${4})`, tip: 'Click a unit to fortify its hex (+25% defense for all units there). Max 4.' },
                { action: 'escort' as const, label: '🚗 Escort', tip: 'Call a soldier to your capo\'s location. Select a soldier, then click a capo.' },
                { action: 'safehouse' as const, label: '🏠 Safehouse', tip: 'Select a capo on your territory to set up a secondary deploy point (5 turns).' },
                { action: 'send_word' as const, label: `📩 Send Word (${((gameState as any).pendingNegotiations || []).length})`, tip: 'Select a capo, then click an enemy hex to request a sitdown. Negotiation available next turn.' },
              ] as const).filter(({ action }) => {
                if (action === 'send_word' && ((gameState as any).gamePhase || 1) < 2) return false;
                return true;
              }).map(({ action, label, tip }) => {
                const noTactical = gameState.tacticalActionsRemaining <= 0;
                const selectedUnit = gameState.selectedUnitId ? (gameState.deployedUnits || []).find((u: any) => u.id === gameState.selectedUnitId) : null;
                const isSoldier = selectedUnit?.type === 'soldier';
                const isCapo = selectedUnit?.type === 'capo';

                const reason = noTactical ? 'No tactical actions left' : '';
                const isDisabled = noTactical;

                return (
                  <div key={action} className="relative group">
                    <Button
                      size="sm"
                      variant={gameState.selectedMoveAction === action ? 'default' : 'outline'}
                      className="text-xs h-7 px-2"
                      title={reason || tip}
                      disabled={isDisabled}
                      onClick={() => {
                        setMoveAction(action);
                      }}
                    >
                      {label}
                    </Button>
                    {reason && gameState.selectedMoveAction !== action && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 whitespace-nowrap text-[8px] text-destructive/80 font-medium pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 bg-background/90 px-1.5 py-0.5 rounded border border-border shadow-sm">
                        {reason}
                      </div>
                    )}
                  </div>
                );
              })}
              {gameState.safehouses.length > 0 && (
                <span className="text-xs text-muted-foreground ml-1">🏠 {gameState.safehouses.map(s => `${s.turnsRemaining}t`).join(', ')}</span>
              )}
            </div>
            {/* Tactical action description panel */}
            <div className="bg-background/80 rounded-lg px-3 py-2 border border-noir-light text-xs text-muted-foreground max-w-md">
              {gameState.selectedMoveAction === 'scout' && (
                <p><span className="text-foreground font-semibold">👁️ Scout:</span> Select a soldier or capo, then click an enemy hex to reveal intel for 3 turns. Soldiers scout 1 hex away, Capos scout up to 2 hexes away.</p>
              )}
              {gameState.selectedMoveAction === 'fortify' && (
                <p><span className="text-foreground font-semibold">🛡️ Fortify:</span> Click any unit to build defenses on its hex — grants +25% defense and 50% casualty reduction for all friendly units there. Persists until abandoned or captured.</p>
              )}
              {gameState.selectedMoveAction === 'escort' && (
                <p><span className="text-foreground font-semibold">🚗 Escort:</span> Select a soldier, then click a capo unit (or their hex) to call the soldier there (1 tactical action). The capo can carry up to 2 soldiers — they'll auto-travel and detach at the destination.</p>
              )}
              {gameState.selectedMoveAction === 'safehouse' && (
                <p><span className="text-foreground font-semibold">🏠 Safehouse:</span> Select a capo on your territory to establish a secondary deploy point lasting 5 turns.</p>
              )}
              {gameState.selectedMoveAction === 'send_word' && (
                <div>
                  <p className="font-semibold text-foreground mb-1">📩 Send Word — How it works:</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground">
                    <li><span className="text-foreground">Select a Capo</span> on the map</li>
                    <li><span className="text-foreground">Click an enemy hex</span> to request a sitdown (costs 1 tactical action)</li>
                    <li><span className="text-foreground">Next turn</span>, use the <span className="text-yellow-400 font-semibold">🤝 Sit Down</span> button below or click the hex on the map</li>
                  </ol>
                </div>
              )}
              {gameState.selectedMoveAction === 'move' && (
                <p className="italic">Select a tactical action above to see its description. No regular movement in this phase.</p>
              )}
            </div>
          </div>
        )}

        {/* Pending Sitdowns Tracker */}
        {(() => {
          const pendingNegs = (gameState as any).pendingNegotiations || [];
          if (pendingNegs.length === 0) return null;
          return (
            <div className="mt-2 flex flex-wrap gap-2 items-center">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Sitdowns:</span>
              {pendingNegs.map((p: any) => (
                <div 
                  key={p.id} 
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded border text-xs",
                    p.ready 
                      ? "bg-yellow-900/30 border-yellow-500/40 text-yellow-300 animate-pulse" 
                      : "bg-muted/30 border-border text-muted-foreground"
                  )}
                >
                  <span>{p.ready ? '🤝' : '📩'}</span>
                  <span className="font-medium">{p.capoName}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="capitalize">{p.targetFamily}</span>
                  {p.ready ? (
                    <button
                      className="ml-1 px-1.5 py-0.5 rounded bg-yellow-600/80 hover:bg-yellow-500/80 text-black text-[10px] font-bold transition-colors"
                      onClick={() => setNegotiationState({
                        open: true,
                        targetQ: p.targetQ,
                        targetR: p.targetR,
                        targetS: p.targetS,
                        capoId: p.capoId,
                        scope: 'territory' as const,
                        pendingNegotiationId: p.id,
                      })}
                    >
                      Sit Down
                    </button>
                  ) : (
                    <span className="text-[10px] italic">next turn</span>
                  )}
                </div>
              ))}
            </div>
          );
        })()}

        {/* Incoming Sitdowns (AI-requested) */}
        {(() => {
          const incoming = (gameState as any).incomingSitdowns || [];
          if (incoming.length === 0) return null;
          const dealLabels: Record<string, string> = { ceasefire: '🕊️ Ceasefire', alliance: '⚖️ Alliance', supply_deal: '🚚 Supply Deal', safe_passage: '🛤️ Safe Passage' };
          return (
            <div className="mt-2 flex flex-wrap gap-2 items-center">
              <span className="text-[10px] text-mafia-gold uppercase tracking-wider font-semibold">📩 Incoming Sitdowns:</span>
              {incoming.map((s: any) => {
                const turnsLeft = s.expiresOnTurn - gameState.turn;
                const famLabel = s.fromFamily.charAt(0).toUpperCase() + s.fromFamily.slice(1);
                const isUrgent = turnsLeft <= 1;
                const isFresh = s.turnRequested === gameState.turn;
                return (
                  <div 
                    key={s.id}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border-2 text-xs animate-pulse shadow-lg",
                      isUrgent
                        ? "bg-red-500/15 border-red-500/60 text-red-200 shadow-red-500/30"
                        : "bg-mafia-gold/10 border-mafia-gold/60 text-mafia-gold shadow-mafia-gold/20"
                    )}
                  >
                    <span className="text-base">📩</span>
                    {isFresh && <span className="text-[9px] font-black bg-mafia-gold text-black px-1 rounded">NEW</span>}
                    <span className="font-bold capitalize">{famLabel}</span>
                    <span className="opacity-70">—</span>
                    <span>{dealLabels[s.proposedDeal] || s.proposedDeal}</span>
                    <span className={cn("text-[10px] font-bold", isUrgent ? "text-red-300" : "opacity-70")}>
                      {isUrgent ? `⚠️ ${turnsLeft}t left!` : `(${turnsLeft}t)`}
                    </span>
                    <span className="text-[10px] text-green-400">+{s.successBonus}%</span>
                    <button
                      className="ml-1 px-2 py-0.5 rounded bg-primary hover:bg-primary/80 text-primary-foreground text-[10px] font-bold transition-colors"
                      onClick={() => {
                        setNegotiationState({
                          open: true,
                          scope: 'family',
                          targetFamily: s.fromFamily,
                          incomingSitdownId: s.id,
                          successBonus: s.successBonus,
                        });
                      }}
                    >
                      Accept
                    </button>
                    <button
                      className="px-1.5 py-0.5 rounded bg-destructive/80 hover:bg-destructive text-destructive-foreground text-[10px] font-bold transition-colors"
                      onClick={() => performAction({ type: 'decline_incoming_sitdown', sitdownId: s.id })}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Boss Diplomacy quick-launch button */}
        {(() => {
          const bossCd = (gameState as any).bossNegotiationCooldown || 0;
          const enemyFamilies = gameState.aiOpponents
            .map((o: any) => o.family)
            .filter((f: string) => !((gameState as any).eliminatedFamilies || []).includes(f));
          if (enemyFamilies.length === 0) return null;
          const disabled = bossCd > 0;
          return (
            <div className="mt-2 flex items-center">
              <button
                onClick={() => {
                  if (disabled) return;
                  setNegotiationState({
                    open: true,
                    scope: 'family',
                    targetFamily: enemyFamilies[0],
                  });
                }}
                disabled={disabled}
                title={disabled ? `Boss must wait ${bossCd} more turn(s)` : 'Open Boss-level diplomacy: ceasefire, alliance, supply deal'}
                className={cn(
                  "px-3 py-1 rounded-md border text-xs font-bold transition-all",
                  disabled
                    ? "bg-muted/30 border-muted text-muted-foreground cursor-not-allowed opacity-60"
                    : "bg-mafia-gold/15 border-mafia-gold/50 text-mafia-gold hover:bg-mafia-gold/25 hover:border-mafia-gold shadow-sm"
                )}
              >
                🏛️ Boss Diplomacy {disabled && `(${bossCd}t)`}
              </button>
            </div>
          );
        })()}
      </div>
      
      {/* Center - Resources */}
      <div className="flex items-center space-x-6">
        <div className="text-center">
          <div className="text-sm font-bold text-green-400">${gameState.resources.money.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Money</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-red-400">{gameState.resources.soldiers}</div>
          <div className="text-xs text-muted-foreground">Soldiers</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-blue-400">{gameState.resources.respect}%</div>
          <div className="text-xs text-muted-foreground">Respect</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-purple-400">{gameState.resources.researchPoints}</div>
          <div className="text-xs text-muted-foreground">Research</div>
        </div>
      </div>
      
      {/* Right side - Active Pacts */}
      <div className="flex items-center gap-2 text-xs">
        {gameState.ceasefires?.filter((c: any) => c.active).map((c: any) => (
          <span key={c.id} className="px-2 py-0.5 rounded-full bg-accent/20 border border-accent/30 text-accent-foreground">
            🤝 {c.family.charAt(0).toUpperCase() + c.family.slice(1)} ({c.turnsRemaining}t)
          </span>
        ))}
        {gameState.alliances?.filter((a: any) => a.active).map((a: any) => (
          <span key={a.id} className="px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary">
            ⚖️ {a.alliedFamily.charAt(0).toUpperCase() + a.alliedFamily.slice(1)} ({a.turnsRemaining}t)
          </span>
        ))}
        {(gameState as any).shareProfitsPacts?.filter((p: any) => p.active).map((p: any) => (
          <span key={p.id} className="px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400">
            💰 {p.targetFamily.charAt(0).toUpperCase() + p.targetFamily.slice(1)} ({p.turnsRemaining}t)
          </span>
        ))}
        {(gameState as any).safePassagePacts?.filter((p: any) => p.active).map((p: any) => (
          <span key={p.id} className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400">
            🛤️ {p.targetFamily.charAt(0).toUpperCase() + p.targetFamily.slice(1)} ({p.turnsRemaining}t)
          </span>
        ))}
        {(gameState as any).supplyDealPacts?.filter((p: any) => p.active).map((p: any) => {
          const isPlayerBuyer = p.buyerFamily === gameState.playerFamily;
          const otherFam = isPlayerBuyer ? p.targetFamily : p.buyerFamily;
          return (
            <span key={p.id} className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400">
              🚚 {otherFam.charAt(0).toUpperCase() + otherFam.slice(1)} {isPlayerBuyer ? '(buying)' : '(selling)'} ({p.turnsRemaining}t)
            </span>
          );
        })}
        {(gameState as any).treacheryDebuff?.turnsRemaining > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-destructive/20 border border-destructive/30 text-destructive animate-pulse">
            🗡️ Treachery (-{20}% neg, {(gameState as any).treacheryDebuff.turnsRemaining}t)
          </span>
        )}
        {(!gameState.ceasefires?.length && !gameState.alliances?.length && !(gameState as any).shareProfitsPacts?.length && !(gameState as any).safePassagePacts?.length && !(gameState as any).supplyDealPacts?.length && !((gameState as any).treacheryDebuff?.turnsRemaining > 0)) && (
          <span className="text-muted-foreground font-playfair italic">"Strategy Rules the Underworld"</span>
        )}
      </div>
    </div>
  );

  const gp = (gameState as any).gamePhase || 1;
  const gpConfig = PHASE_CONFIGS[gp - 1];
  const phaseConfig: Record<string, { label: string; hint: string; color: string }> = {
    deploy: { label: '📦 DEPLOY STEP', hint: 'Deploy units from HQ & move them across the map', color: 'bg-blue-600/80' },
    move: { label: '📋 TACTICAL STEP', hint: `Scout, Fortify, Escort, Safehouse, Send Word (${gameState.tacticalActionsRemaining}/${gameState.maxTacticalActions} left) — no movement`, color: 'bg-amber-600/80' },
    action: { label: '⚔️ ACTION STEP', hint: `Hit, Extort, Claim, Negotiate (${gameState.actionsRemaining}/${gameState.maxActions} left)`, color: 'bg-red-600/80' },
    waiting: { label: '⏳ END TURN', hint: 'Press End Turn to advance', color: 'bg-muted' },
  };
  const currentPhaseConfig = phaseConfig[gameState.turnPhase] || phaseConfig.waiting;

  const phaseProgressRows = useMemo(() => {
    if (gp >= 4) return null;
    const next = PHASE_CONFIGS[gp];
    const playerHexes = gameState.hexMap?.filter((h: any) => h.controllingFamily === config.family).length || 0;
    const playerRespect = gameState.resources?.respect ?? 0;
    const playerCapos = gameState.units?.[config.family]?.capos?.length ?? 0;
    const playerBuilt = gameState.hexMap?.filter((h: any) => h.controllingFamily === config.family && h.business && !h.business.isExtorted).length ?? 0;
    const playerIncome = gameState.lastTurnIncome ?? 0;
    const reqs = next.requirements;
    const rows: { label: string; current: number; target: number; met: boolean }[] = [];
    rows.push({ label: `Turn ${next.minTurn}+`, current: gameState.turn, target: next.minTurn, met: gameState.turn >= next.minTurn });
    if (reqs.minHexes) rows.push({ label: `${reqs.minHexes}+ hexes`, current: playerHexes, target: reqs.minHexes, met: playerHexes >= reqs.minHexes });
    if (reqs.minRespect) rows.push({ label: `${reqs.minRespect}+ respect`, current: playerRespect, target: reqs.minRespect, met: playerRespect >= reqs.minRespect });
    if (reqs.minCapos) rows.push({ label: `${reqs.minCapos}+ capos`, current: playerCapos, target: reqs.minCapos, met: playerCapos >= reqs.minCapos });
    if (reqs.minBuiltBusinesses) rows.push({ label: `${reqs.minBuiltBusinesses}+ legal business built`, current: playerBuilt, target: reqs.minBuiltBusinesses, met: playerBuilt >= reqs.minBuiltBusinesses });
    if (reqs.minIncomeOrHexesOrRespect) {
      const or = reqs.minIncomeOrHexesOrRespect;
      rows.push({ label: `${or.hexes}+ hexes`, current: playerHexes, target: or.hexes, met: playerHexes >= or.hexes });
      rows.push({ label: `$${(or.income/1000).toFixed(0)}k+ income`, current: playerIncome, target: or.income, met: playerIncome >= or.income });
      rows.push({ label: `${or.respect}+ respect`, current: playerRespect, target: or.respect, met: playerRespect >= or.respect });
    }
    return { next, rows, hasOrCondition: !!reqs.minIncomeOrHexesOrRespect };
  }, [gp, gameState.turn, gameState.hexMap, gameState.resources?.respect, gameState.units, gameState.lastTurnIncome, config.family]);

  const deselectUnit = () => {
    handleAction({ type: 'deselect_unit' });
  };

  const mainContent = (
    <div className="h-full relative" onClick={deselectUnit}>
      {/* Phase indicator banner */}
      <motion.div
        key={gameState.turnPhase}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "absolute bottom-2 left-1/2 -translate-x-1/2 z-20 px-4 py-1 rounded-full backdrop-blur-sm border border-border/20 shadow-lg flex flex-col items-center gap-0.5 pointer-events-none opacity-80",
          currentPhaseConfig.color
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white font-playfair tracking-wide">
            {currentPhaseConfig.label}
          </span>
          <span className="text-[10px] text-white/70">
            {currentPhaseConfig.hint}
          </span>
        </div>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[10px] text-white/50 cursor-help underline decoration-dotted underline-offset-2 pointer-events-auto">
                {gpConfig.icon} Phase {gp}: {gpConfig.name}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs bg-black/95 border-border/50 p-3">
              {!phaseProgressRows ? (
                <p className="text-xs text-amber-400 font-semibold">👑 Max phase reached — Boss of All Bosses</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-white">
                    Next: {phaseProgressRows.next.icon} Phase {phaseProgressRows.next.phase} — {phaseProgressRows.next.name}
                  </p>
                  {phaseProgressRows.hasOrCondition && (
                    <p className="text-[10px] text-amber-400/80 italic">Any one path below unlocks this phase:</p>
                  )}
                  <div className="space-y-0.5">
                    {phaseProgressRows.rows.map((row, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px]">
                        <span>{row.met ? '✅' : '❌'}</span>
                        <span className={row.met ? 'text-green-400' : 'text-red-400'}>
                          {row.label}
                        </span>
                        <span className="text-white/40 ml-auto">(current: {typeof row.current === 'number' && row.current >= 1000 ? `$${(row.current/1000).toFixed(0)}k` : row.current})</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/50 pt-1 border-t border-white/10">
                    Unlocks: {phaseProgressRows.next.unlocks.join(', ')}
                  </p>
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>

      {/* Enhanced background with seasonal effects */}
      <div className="absolute inset-0 opacity-5 bg-repeat pointer-events-none" 
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E")`
           }} 
      />
      
      {/* Seasonal overlay */}
      <div className={cn(
        "absolute inset-0 pointer-events-none opacity-10",
        gameState.season === 'spring' && "bg-green-500",
        gameState.season === 'summer' && "bg-yellow-500",
        gameState.season === 'fall' && "bg-orange-500",
        gameState.season === 'winter' && "bg-blue-500"
      )} />
      
          <EnhancedMafiaHexGrid 
            key="hex-grid-desktop"
            width={12}
            height={12}
            onBusinessClick={(business) => {
              console.log('🏢 Business clicked:', business);
              selectTerritory({
                q: business.q,
                r: business.r,
                s: business.s,
                district: business.district,
                family: business.family,
                business: {
                  type: business.businessType as any,
                  income: business.income
                }
              });
              
              const districtHexes2 = (gameState.hexMap || []).filter(t => t.district === business.district);
              const playerHexes2 = districtHexes2.filter(t => t.controllingFamily === gameState.playerFamily);
              const controlPct2 = districtHexes2.length > 0 ? playerHexes2.length / districtHexes2.length : 0;
              if (controlPct2 >= 0.6) {
                notifyTerritoryCaptured(business.district);
              }
            }}
            selectedBusiness={null}
            playerFamily={gameState.playerFamily}
            gameState={gameState}
            onAction={handleAction}
            onSelectUnit={selectUnit}
            onMoveUnit={moveUnit}
            onSelectHeadquarters={handleHeadquartersClick}
            onSelectUnitFromHeadquarters={selectUnitFromHeadquarters}
            onDeployUnit={deployUnit}
            planHitMode={planHitMode}
            planHitStep={planHitStep}
            planHitPlannerId={planHitPlannerId}
            onPlanHitSelect={(q, r, s, targetUnitId) => handleAction({ type: 'plan_hit', plannerUnitId: planHitPlannerId, targetUnitId })}
            onPlanHitSelectSoldier={(unitId) => handleAction({ type: 'plan_hit_select_soldier', unitId })}
            onCancelPlanHit={() => handleAction({ type: 'cancel_plan_hit_mode' })}
            bossHighlightHex={bossHighlightHex}
            highlightedFamily={highlightedFamily}
            onClearHighlight={() => { setBossHighlightHex(null); setHighlightedFamily(null); }}
          />
    </div>
  );

  return (
    <>
      <ResponsiveLayout
        leftSidebar={leftSidebar}
        rightSidebar={rightSidebar}
        mainContent={mainContent}
        topBar={topBar}
        bottomBar={bottomBar}
      >
        {/* Mobile-specific content */}
        <div className="lg:hidden">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden">
              {mobileTabs.find(tab => tab.id === activeMobileTab)?.content}
            </div>
            <MobileTabBar
              tabs={mobileTabs}
              activeTab={activeMobileTab}
              onTabChange={setActiveMobileTab}
            />
          </div>
          
          <MobileFloatingActionButton
            onClick={() => {
              if (gameState.turnPhase !== 'waiting') {
                if (!window.confirm('End your turn early? You still have actions remaining.')) return;
              }
              playSound('notification');
              endTurn();
            }}
            icon={<Play className="h-5 w-5" />}
            label="End Turn"
            position="bottom-right"
          />
        </div>
      </ResponsiveLayout>

      {/* Headquarters Info Panel */}
      {selectedHeadquarters && (() => {
        const hqFamily = selectedHeadquarters.family;
        const isPlayerHQ = hqFamily === gameState.playerFamily;
        const units = gameState.deployedUnits || [];
        const bonuses = gameState.familyBonuses || {};
        const activeDistrictBonuses = (gameState as any).activeDistrictBonuses || [];
        const hasDistrictBonus = (bonusType: string) =>
          activeDistrictBonuses.some((b: any) => b.family === hqFamily && b.bonusType === bonusType);

        // Compute connected supply node types for this family
        const familyHexSet = new Set((gameState.hexMap || [])
          .filter((t: any) => t.controllingFamily === hqFamily)
          .map((t: any) => `${t.q},${t.r},${t.s}`));
        const connectedNodeTypes = new Set<SupplyNodeType>();
        ((gameState as any).supplyNodes || []).forEach((node: any) => {
          if (familyHexSet.has(`${node.q},${node.r},${node.s}`)) {
            connectedNodeTypes.add(node.type as SupplyNodeType);
          }
        });

        const hexBusinesses = (gameState.hexMap || [])
          .filter((tile: any) => tile.controllingFamily === hqFamily && tile.business)
          .map((tile: any) => {
            const baseIncome = tile.business.income || 0;
            const underConstruction = tile.business.constructionProgress !== undefined &&
              tile.business.constructionProgress < (tile.business.constructionGoal || 3);
            const bizType = tile.business.type || tile.business.businessType || 'Business';
            const deps = SUPPLY_DEPENDENCIES[bizType];
            const supplyDependency = deps && deps.length > 0 ? deps.join(',') : undefined;
            const supplyConnected = supplyDependency ? deps!.some(d => connectedNodeTypes.has(d)) : undefined;

            if (underConstruction || !isPlayerHQ) {
              return {
                q: tile.q, r: tile.r, s: tile.s,
                district: tile.district || 'Unknown',
                businessType: bizType,
                income: underConstruction ? 0 : baseIncome,
                baseIncome,
                isLegal: tile.business.isLegal !== false,
                isExtorted: tile.business.isExtorted === true,
                underConstruction,
                collectionRate: underConstruction ? 0 : 100,
                collectionReason: underConstruction ? 'Under construction' : '',
                supplyConnected,
                supplyDependency,
              };
            }

            const hasCapo = units.some((u: any) =>
              u.family === hqFamily && u.type === 'capo' &&
              u.q === tile.q && u.r === tile.r && u.s === tile.s
            );
            const hasSoldier = units.some((u: any) =>
              u.family === hqFamily && u.type === 'soldier' &&
              u.q === tile.q && u.r === tile.r && u.s === tile.s
            );

            let collectionRate = 10;
            let collectionReason = 'No unit';
            const isPlayerBuilt = !tile.business.isExtorted;
            let tileIncome = Math.floor(baseIncome * 0.1);
            
            if (isPlayerBuilt) {
              // Player-built businesses earn 100% regardless of unit presence
              tileIncome = baseIncome;
              collectionRate = 100;
              collectionReason = 'Player-built';
            } else if (hasCapo) {
              tileIncome = baseIncome;
              collectionRate = 100;
              collectionReason = 'Capo';
            } else if (hasSoldier) {
              tileIncome = Math.floor(baseIncome * 0.3);
              collectionRate = 30;
              collectionReason = 'Soldier';
            }

            // Apply supply line decay to displayed income (mirrors turn-end calculation)
            if (supplyConnected === false && deps && deps.length > 0) {
              const stockEntry = ((gameState as any).supplyStockpile || []).find(
                (e: any) => e.family === hqFamily && deps!.includes(e.nodeType)
              );
              const turnsSinceDisconnected = stockEntry?.turnsSinceDisconnected ?? 0;
              if (turnsSinceDisconnected > 2) {
                const decayTurns = turnsSinceDisconnected - 2;
                const decayMultiplier = Math.max(0.2, 1 - (0.1 * decayTurns));
                tileIncome = Math.floor(tileIncome * decayMultiplier);
                const decayPct = Math.round((1 - decayMultiplier) * 100);
                collectionRate = Math.round(collectionRate * decayMultiplier);
                collectionReason = collectionReason ? `${collectionReason}, No Supply -${decayPct}%` : `No Supply -${decayPct}%`;
              }
            }

            if ((bonuses as any).businessIncome > 0) tileIncome = Math.floor(tileIncome * (1 + (bonuses as any).businessIncome / 100));
            if ((bonuses as any).territoryIncome > 0) tileIncome = Math.floor(tileIncome * (1 + (bonuses as any).territoryIncome / 100));
            if ((bonuses as any).income > 0) tileIncome = Math.floor(tileIncome * (1 + (bonuses as any).income / 100));

            if (tile.district === 'Manhattan' && hasDistrictBonus('income')) {
              tileIncome = Math.floor(tileIncome * 1.2);
            }

            return {
              q: tile.q, r: tile.r, s: tile.s,
              district: tile.district || 'Unknown',
              businessType: bizType,
              income: tileIncome,
              baseIncome,
              isLegal: tile.business.isLegal !== false,
              isExtorted: tile.business.isExtorted === true,
              isPlayerBuilt,
              underConstruction,
              collectionRate,
              collectionReason,
              supplyConnected,
              supplyDependency,
            };
          });
        const territoryCount = (gameState.hexMap || []).filter((tile: any) => tile.controllingFamily === hqFamily).length;
        return (
          <HeadquartersInfoPanel
            family={hqFamily}
            headquarters={selectedHeadquarters.headquarters}
            units={selectedHeadquarters.units}
            hexBusinesses={hexBusinesses}
            finances={isPlayerHQ ? gameState.finances : undefined}
            totalMoney={isPlayerHQ ? gameState.resources?.money : undefined}
            territoryCount={territoryCount}
            onClose={closeHeadquartersPanel}
            onSelectUnitFromHeadquarters={selectUnitFromHeadquarters}
            movementPhase={gameState.movementPhase}
            playerFamily={gameState.playerFamily}
            deployedUnits={gameState.deployedUnits || []}
            hexMap={gameState.hexMap || []}
            bossHighlightHex={bossHighlightHex}
            onBossHighlightHex={setBossHighlightHex}
            turnPhase={gameState.turnPhase}
            currentTurn={gameState.turn}
            sitdownCooldownUntil={(gameState as any).sitdownCooldownUntil || 0}
            onCallSitdown={(soldierIds) => handleAction({ type: 'call_sitdown', soldierIds })}
            detectedThreats={isPlayerHQ ? ((gameState as any).aiPlannedHits || []).filter((h: any) => h.detectedVia) : []}
            onBossNegotiate={isPlayerHQ ? (targetFamily) => handleAction({ type: 'open_boss_negotiate', targetFamily }) : undefined}
negotiationUsedThisTurn={((gameState as any).bossNegotiationCooldown || 0) > 0}
            activePacts={isPlayerHQ ? {
              ceasefires: (gameState as any).ceasefires || [],
              alliances: (gameState as any).alliances || [],
              shareProfits: (gameState as any).shareProfitsPacts || [],
              safePassages: (gameState as any).safePassagePacts || [],
            } : undefined}
            enemyFamilies={isPlayerHQ ? gameState.aiOpponents.map((o: any) => o.family).filter((f: string) => !((gameState as any).eliminatedFamilies || []).includes(f)) : []}
            onDeclareWar={isPlayerHQ ? (targetFamily) => handleAction({ type: 'declare_war', targetFamily }) : undefined}
            onGoToMattresses={isPlayerHQ ? () => handleAction({ type: 'go_to_mattresses' }) : undefined}
            onWarSummit={isPlayerHQ ? () => handleAction({ type: 'war_summit' }) : undefined}
            onLayLow={isPlayerHQ ? () => handleAction({ type: 'lay_low' }) : undefined}
            mattressesState={(gameState as any).mattressesState}
            warSummitState={(gameState as any).warSummitState}
            mattressesCooldownUntil={(gameState as any).mattressesCooldownUntil || 0}
            warSummitCooldownUntil={(gameState as any).warSummitCooldownUntil || 0}
            layLowActiveUntil={(gameState as any).layLowActiveUntil || 0}
            layLowAfterglowUntil={(gameState as any).layLowAfterglowUntil || 0}
            layLowCooldownUntil={(gameState as any).layLowCooldownUntil || 0}
            activeWars={(gameState as any).activeWars || []}
            actionsRemaining={gameState.actionsRemaining || 0}
            gamePhase={(gameState as any).gamePhase || 1}
            flippedSoldiers={(gameState as any).flippedSoldiers || []}
            soldierStats={gameState.soldierStats || {}}
            onEliminateSoldier={isPlayerHQ ? (soldierId: string) => handleAction({ type: 'eliminate_soldier', targetId: soldierId }) : undefined}
          />
        );
      })()}

      {/* Negotiation Dialog */}
      {negotiationState && (() => {
        if (negotiationState.scope === 'territory') {
          const tile = gameState.hexMap.find((t: any) => t.q === negotiationState.targetQ && t.r === negotiationState.targetR && t.s === negotiationState.targetS);
          if (!tile) return null;
          const capo = gameState.deployedUnits.find((u: any) => u.id === negotiationState.capoId);
          const pendingEntry = (negotiationState as any).pendingNegotiationId
            ? ((gameState as any).pendingNegotiations || []).find((p: any) => p.id === (negotiationState as any).pendingNegotiationId)
            : null;
          const capoName = capo?.name || pendingEntry?.capoName || 'Capo';
          const capoPersonality = capo?.personality || pendingEntry?.capoPersonality || 'diplomat';
          const enemyFamily = (negotiationState as any).targetFamilyOverride || tile.controllingFamily;
          const enemyUnitsOnHex = gameState.deployedUnits.filter((u: any) => u.family === enemyFamily && u.q === tile.q && u.r === tile.r && u.s === tile.s);
          const incomingSitdownId = (negotiationState as any).incomingSitdownId;
          return (
            <NegotiationDialog
              open={negotiationState.open}
              onClose={() => setNegotiationState(null)}
              scope="territory"
              negotiationUsedThisTurn={((gameState as any).capoNegotiationCooldown || 0) > 0}
              onNegotiate={(type, extraData) => {
                if (incomingSitdownId) {
                  performAction({
                    type: 'accept_incoming_sitdown',
                    sitdownId: incomingSitdownId,
                    negotiationType: type,
                    extraData,
                  });
                } else {
                  performAction({
                    type: 'negotiate',
                    negotiationType: type,
                    targetQ: negotiationState.targetQ,
                    targetR: negotiationState.targetR,
                    targetS: negotiationState.targetS,
                    capoId: negotiationState.capoId,
                    pendingNegotiationId: (negotiationState as any).pendingNegotiationId,
                    extraData,
                  });
                }
                setNegotiationState(null);
              }}
              capoName={capoName}
              capoPersonality={capoPersonality}
              enemyFamily={enemyFamily}
              playerReputation={gameState.reputation.respect}
              playerMoney={gameState.resources.money}
              enemyStrength={enemyUnitsOnHex.length}
              hexIncome={tile.business?.income || 0}
              treacheryTurnsRemaining={(gameState as any).treacheryDebuff?.turnsRemaining || 0}
              lockedDealType={(negotiationState as any).lockedDealType}
              proposedAmount={(negotiationState as any).proposedAmount}
              proposerLabel={(negotiationState as any).proposerLabel}
              successBonus={(negotiationState as any).successBonus || 0}
            />
          );
        } else {
          // Boss (family-level) negotiation
          const enemyFamilies = gameState.aiOpponents.map((o: any) => o.family).filter((f: string) => !(gameState as any).eliminatedFamilies?.includes(f));
          const targetFam = negotiationState.targetFamily || enemyFamilies[0] || '';
          const incomingSitdownId = (negotiationState as any).incomingSitdownId;
          const successBonus = (negotiationState as any).successBonus || 0;
          return (
            <NegotiationDialog
              open={negotiationState.open}
              onClose={() => setNegotiationState(null)}
              scope="family"
              negotiationUsedThisTurn={((gameState as any).bossNegotiationCooldown || 0) > 0}
              onNegotiate={(type, extraData) => {
                if (incomingSitdownId) {
                  performAction({
                    type: 'accept_incoming_sitdown',
                    sitdownId: incomingSitdownId,
                    negotiationType: type,
                    targetFamily: targetFam,
                    extraData,
                  });
                } else {
                  performAction({
                    type: 'boss_negotiate',
                    negotiationType: type,
                    targetFamily: targetFam,
                    extraData,
                  });
                }
                setNegotiationState(null);
              }}
              enemyFamily={targetFam}
              playerReputation={gameState.reputation.respect}
              playerInfluence={gameState.resources.influence || 0}
              playerFear={(gameState.reputation as any).fear || 0}
              playerMoney={gameState.resources.money}
              enemyStrength={0}
              hexIncome={0}
              availableEnemyFamilies={incomingSitdownId ? undefined : enemyFamilies}
              successBonus={successBonus}
              treacheryTurnsRemaining={(gameState as any).treacheryDebuff?.turnsRemaining || 0}
            />
          );
        }
      })()}

      {/* Sound Settings */}
      <SoundSettingsDialog
        open={showSoundSettings}
        onOpenChange={setShowSoundSettings}
        soundConfig={soundConfig}
        onUpdateConfig={updateSoundConfig}
        onTestSound={playSound}
      />

      {/* Game Guide */}
      <GameGuide
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      {/* Turn Summary Modal */}
      <TurnSummaryModal
        report={gameState.turnReport}
        open={showTurnSummary}
        onClose={() => setShowTurnSummary(false)}
      />

      

      {/* Plan Hit Step 2: Instruction Banner + Target List */}
      <AnimatePresence>
        {planHitMode && planHitStep === 'selectTarget' && planHitPlannerId && (() => {
          const plannerUnit = (gameState.deployedUnits || []).find((u: any) => u.id === planHitPlannerId);
          const plannerName = plannerUnit?.name || 'Soldier';
          const scoutedEnemyHexes = (gameState.scoutedHexes || []).filter((s: any) => {
            const hex = (gameState.hexMap || []).find((h: any) => h.q === s.q && h.r === s.r && h.s === s.s);
            return hex && hex.controllingFamily !== 'neutral' && hex.controllingFamily !== gameState.playerFamily;
          });
          const targetableUnits = (gameState.deployedUnits || []).filter((u: any) => {
            if (u.family === gameState.playerFamily) return false;
            return scoutedEnemyHexes.some((s: any) => s.q === u.q && s.r === u.r && s.s === u.s);
          });
          return (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-3 left-1/2 -translate-x-1/2 z-[55] flex flex-col items-center gap-2"
            >
              {/* Instruction banner */}
              <div className="bg-card/95 backdrop-blur-sm border border-destructive/50 rounded-lg px-5 py-3 shadow-xl flex items-center gap-3">
                <span className="text-lg">🎯</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Select a target for {plannerName}</p>
                  <p className="text-xs text-muted-foreground">Click a scouted enemy hex (red outline with 🎯) that has enemy units</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-3 text-xs"
                  onClick={() => handleAction({ type: 'cancel_plan_hit_mode' })}
                >
                  Cancel
                </Button>
              </div>

              {/* Target list panel */}
              {targetableUnits.length > 0 && (
                <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg px-4 py-3 shadow-xl w-[320px] max-h-[200px] overflow-y-auto">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Available Targets ({targetableUnits.length})</p>
                  <div className="space-y-1.5">
                    {targetableUnits.map((unit: any) => {
                      const hex = (gameState.hexMap || []).find((h: any) => h.q === unit.q && h.r === unit.r && h.s === unit.s);
                      const district = hex?.district || 'Unknown';
                      return (
                        <button
                          key={unit.id}
                          className="w-full flex items-center gap-2 p-2 rounded border border-border bg-background hover:bg-destructive/10 hover:border-destructive/50 transition-colors text-left"
                          onClick={() => handleAction({ type: 'plan_hit', plannerUnitId: planHitPlannerId, targetUnitId: unit.id })}
                        >
                          <span className="text-base">{unit.type === 'capo' ? '👔' : '🔫'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-foreground truncate">{unit.name || (unit.type === 'capo' ? 'Capo' : 'Soldier')}</div>
                            <div className="text-[10px] text-muted-foreground">{unit.family} · {district}</div>
                          </div>
                          <Badge variant="destructive" className="text-[10px] shrink-0">Target</Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {targetableUnits.length === 0 && (
                <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg px-4 py-3 shadow-xl">
                  <p className="text-xs text-muted-foreground">⚠️ No enemy units found on scouted hexes. Scout more territory first.</p>
                </div>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Plan Hit Soldier Picker Modal */}
      <AnimatePresence>
        {showPlanHitSoldierMenu && (() => {
          const eligibleSoldiers = (gameState.deployedUnits || []).filter(
            (u: any) => u.family === gameState.playerFamily && u.type === 'soldier'
          );
          const hexMap = gameState.hexMap || [];
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => handleAction({ type: 'cancel_plan_hit_mode' })}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card border border-border rounded-lg shadow-2xl p-5 w-[340px] max-h-[70vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-foreground mb-1">🎯 Select a Soldier for the Hit</h3>
                <p className="text-xs text-muted-foreground mb-4">Choose which soldier will plan the assassination</p>
                {eligibleSoldiers.length === 0 ? (
                  <p className="text-sm text-destructive">No soldiers deployed. Deploy a soldier first.</p>
                ) : (
                  <div className="space-y-2">
                    {eligibleSoldiers.map((soldier: any) => {
                      const hex = hexMap.find((h: any) => h.q === soldier.q && h.r === soldier.r && h.s === soldier.s);
                      const district = hex?.district || 'Unknown';
                      return (
                        <button
                          key={soldier.id}
                          className="w-full flex items-center gap-3 p-3 rounded-md border border-border bg-background hover:bg-accent hover:border-primary transition-colors text-left"
                          onClick={() => handleAction({ type: 'plan_hit_select_soldier', unitId: soldier.id })}
                        >
                          <div className="text-2xl">🔫</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-foreground truncate">{soldier.name || 'Soldier'}</div>
                            <div className="text-xs text-muted-foreground">{district} · {soldier.movesRemaining} moves left</div>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">Select</Badge>
                        </button>
                      );
                    })}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => handleAction({ type: 'cancel_plan_hit_mode' })}
                >
                  Cancel
                </Button>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Commission Vote Modal */}
      <CommissionVoteModal
        open={!!gameState.commissionVoteResult}
        onClose={() => handleAction({ type: 'clear_commission_vote_result' })}
        result={gameState.commissionVoteResult}
        playSound={playSound}
      />

      {/* Enemy Hex Action Dialog (Phase 2+) */}
      <EnemyHexActionDialog
        open={!!gameState.pendingEnemyHexAction}
        targetInfo={(() => {
          if (!gameState.pendingEnemyHexAction) return null;
          const { toQ, toR, toS } = gameState.pendingEnemyHexAction;
          const tile = (gameState.hexMap || []).find((t: any) => t.q === toQ && t.r === toR && t.s === toS);
          if (!tile) return null;
          const defenders = (gameState.deployedUnits || []).filter((u: any) => u.q === toQ && u.r === toR && u.s === toS && u.family === tile.controllingFamily);
          const isScouted = (gameState.scoutedHexes || []).some((s: any) => s.q === toQ && s.r === toR && s.s === toS);
          return {
            district: tile.district || 'Unknown',
            controllingFamily: tile.controllingFamily || 'neutral',
            defendersCount: defenders.length,
            hasBusiness: !!tile.business,
            businessType: tile.business?.type,
            isLegal: tile.business?.isLegal,
            isScouted,
          };
        })()}
        playerMoney={gameState.resources.money}
        gamePhase={gameState.gamePhase || 1}
        onAction={resolveEnemyHexAction}
      />
    </>
  );
};

const UltimateMafiaGame: React.FC = () => {
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);

  if (!gameConfig) {
    return (
      <FamilySelectionScreen
        onSelectFamily={(family, resources, difficulty, seed, mapSize) => setGameConfig({ family, resources, difficulty, seed, mapSize })}
      />
    );
  }

  return (
    <NotificationProvider>
      <GameContent config={gameConfig} onExitToMenu={() => setGameConfig(null)} />
    </NotificationProvider>
  );
};

export default UltimateMafiaGame;
