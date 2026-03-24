import React, { useState, useCallback, useEffect } from 'react';
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
import TutorialSystem from '@/components/TutorialSystem';
import { HeadquartersInfoPanel } from '@/components/HeadquartersInfoPanel';
import TurnSummaryModal from '@/components/TurnSummaryModal';
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
  Settings
} from 'lucide-react';
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
    fortifyUnit,
    setMoveAction,
    startEscort,
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
  } | {
    open: boolean;
    scope: 'family';
    targetFamily: string;
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
              if (business.family === gameState.playerFamily) {
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
      content: <RightSidePanel gameState={gameState} onEventChoice={handleEventChoice} />
    },
  ];

  // RICO or Bankruptcy Game Over
  if (gameState.gameOver?.type === 'rico' || (gameState.gameOver as any)?.type === 'bankruptcy' || (gameState.gameOver as any)?.type === 'assassination') {
    const goType = (gameState.gameOver as any)?.type;
    const playerTerritoryCount = gameState.hexMap.filter(h => h.controllingFamily === gameState.playerFamily).length;
    const playerSoldierCount = gameState.deployedUnits.filter(u => u.family === gameState.playerFamily && u.type === 'soldier').length;
    const eliminatedCount = (gameState as any).eliminatedFamilies?.length || 0;
    const goEmoji = goType === 'rico' ? '🚨' : goType === 'assassination' ? '🔫' : '💸';
    const goTitle = goType === 'rico' ? 'RICO INDICTMENT' : goType === 'assassination' ? 'THE COMMISSION HAS SPOKEN' : 'BANKRUPTCY';
    const goDesc = goType === 'rico'
      ? 'The federal government has dismantled your criminal empire after 5 consecutive turns at critical heat.'
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

  const leftSidebar = (
    <LeftSidePanel gameState={gameState} onAction={handleAction} turnPhase={gameState.turnPhase} onSelectUnit={selectUnit} />
  );

  const rightSidebar = (
    <RightSidePanel gameState={gameState} onEventChoice={handleEventChoice} />
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
        <div className="text-center">
          <div className="text-sm font-medium text-green-400">Commission Active</div>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 bg-green-400 rounded-full mx-auto mt-1"
          />
        </div>
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
          {gameState.turnPhase === 'action' ? 'Next Phase' : gameState.turnPhase === 'waiting' ? 'Waiting...' : `End ${gameState.turnPhase === 'move' ? 'Tactical' : gameState.turnPhase.charAt(0).toUpperCase() + gameState.turnPhase.slice(1)}`}
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
                { action: 'fortify' as const, label: '🛡️ Fortify', tip: 'Click a unit to fortify it (+25% defense, persists until it moves).' },
                { action: 'escort' as const, label: '🚗 Escort', tip: 'Call a soldier to your capo\'s location. Select a soldier, then click a capo.' },
                { action: 'safehouse' as const, label: '🏠 Safehouse', tip: 'Select a capo on your territory to set up a secondary deploy point (5 turns).' },
              ] as const).map(({ action, label, tip }) => {
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
                <p><span className="text-foreground font-semibold">🛡️ Fortify:</span> Click any unit to fortify it — grants +25% defense and 50% casualty reduction. Persists until the unit moves.</p>
              )}
              {gameState.selectedMoveAction === 'escort' && (
                <p><span className="text-foreground font-semibold">🚗 Escort:</span> Select a soldier, then click a capo unit (or their hex) to call the soldier there (1 tactical action). The capo can carry up to 2 soldiers — they'll auto-travel and detach at the destination.</p>
              )}
              {gameState.selectedMoveAction === 'safehouse' && (
                <p><span className="text-foreground font-semibold">🏠 Safehouse:</span> Select a capo on your territory to establish a secondary deploy point lasting 5 turns.</p>
              )}
              {gameState.selectedMoveAction === 'move' && (
                <p className="italic">Select a tactical action above to see its description. No regular movement in this phase.</p>
              )}
            </div>
          </div>
        )}
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
        {(!gameState.ceasefires?.length && !gameState.alliances?.length && !(gameState as any).shareProfitsPacts?.length && !(gameState as any).safePassagePacts?.length) && (
          <span className="text-muted-foreground font-playfair italic">"Strategy Rules the Underworld"</span>
        )}
      </div>
    </div>
  );

  const phaseConfig: Record<string, { label: string; hint: string; color: string }> = {
    deploy: { label: '📦 DEPLOY', hint: 'Deploy units from HQ & move them across the map', color: 'bg-blue-600/80' },
    move: { label: '📋 TACTICAL PHASE', hint: `Scout, Fortify, Escort, Safehouse (${gameState.tacticalActionsRemaining}/${gameState.maxTacticalActions} left) — no movement`, color: 'bg-amber-600/80' },
    action: { label: '⚔️ ACTION PHASE', hint: `Hit, Extort, Claim, Negotiate (${gameState.actionsRemaining}/${gameState.maxActions} left)`, color: 'bg-red-600/80' },
    waiting: { label: '⏳ END TURN', hint: 'Press End Turn to advance', color: 'bg-muted' },
  };
  const currentPhaseConfig = phaseConfig[gameState.turnPhase] || phaseConfig.waiting;

  const deselectUnit = () => {
    handleAction({ type: 'deselect_unit' });
  };

  const mainContent = (
    <div className="h-full relative" onClick={deselectUnit}>
      {/* Phase indicator banner */}
      <motion.div
        key={gameState.turnPhase}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "absolute top-2 left-1/2 -translate-x-1/2 z-20 px-6 py-2 rounded-full backdrop-blur-sm border border-border/30 shadow-lg flex items-center gap-3",
          currentPhaseConfig.color
        )}
      >
        <span className="text-sm font-bold text-white font-playfair tracking-wide">
          {currentPhaseConfig.label}
        </span>
        <span className="text-xs text-white/70">
          {currentPhaseConfig.hint}
        </span>
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
              
              if (business.family === gameState.playerFamily) {
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
        const hexBusinesses = (gameState.hexMap || [])
          .filter((tile: any) => tile.controllingFamily === hqFamily && tile.business)
          .map((tile: any) => ({
            q: tile.q, r: tile.r, s: tile.s,
            district: tile.district || 'Unknown',
            businessType: tile.business.type || tile.business.businessType || 'Business',
            income: tile.business.income || 0,
            isLegal: tile.business.isLegal !== false,
            isExtorted: tile.business.isExtorted === true,
          }));
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
            negotiationUsedThisTurn={(gameState as any).bossNegotiationUsedThisTurn || false}
            activePacts={isPlayerHQ ? {
              ceasefires: (gameState as any).ceasefires || [],
              alliances: (gameState as any).alliances || [],
              shareProfits: (gameState as any).shareProfitsPacts || [],
              safePassages: (gameState as any).safePassagePacts || [],
            } : undefined}
            enemyFamilies={isPlayerHQ ? gameState.aiOpponents.map((o: any) => o.family).filter((f: string) => !((gameState as any).eliminatedFamilies || []).includes(f)) : []}
          />
        );
      })()}

      {/* Negotiation Dialog */}
      {negotiationState && (() => {
        if (negotiationState.scope === 'territory') {
          const tile = gameState.hexMap.find((t: any) => t.q === negotiationState.targetQ && t.r === negotiationState.targetR && t.s === negotiationState.targetS);
          const capo = gameState.deployedUnits.find((u: any) => u.id === negotiationState.capoId);
          if (!tile || !capo) return null;
          const enemyFamily = tile.controllingFamily;
          const enemyUnitsOnHex = gameState.deployedUnits.filter((u: any) => u.family === enemyFamily && u.q === tile.q && u.r === tile.r && u.s === tile.s);
          return (
            <NegotiationDialog
              open={negotiationState.open}
              onClose={() => setNegotiationState(null)}
              scope="territory"
              negotiationUsedThisTurn={(gameState as any).capoNegotiationUsedThisTurn || false}
              onNegotiate={(type, extraData) => {
                performAction({
                  type: 'negotiate',
                  negotiationType: type,
                  targetQ: negotiationState.targetQ,
                  targetR: negotiationState.targetR,
                  targetS: negotiationState.targetS,
                  capoId: negotiationState.capoId,
                  extraData,
                });
                setNegotiationState(null);
              }}
              capoName={capo.name || 'Capo'}
              capoPersonality={capo.personality || 'diplomat'}
              enemyFamily={enemyFamily}
              playerReputation={gameState.reputation.respect}
              playerMoney={gameState.resources.money}
              enemyStrength={enemyUnitsOnHex.length}
              hexIncome={tile.business?.income || 0}
            />
          );
        } else {
          // Boss (family-level) negotiation
          const enemyFamilies = gameState.aiOpponents.map((o: any) => o.family).filter((f: string) => !(gameState as any).eliminatedFamilies?.includes(f));
          const targetFam = negotiationState.targetFamily || enemyFamilies[0] || '';
          return (
            <NegotiationDialog
              open={negotiationState.open}
              onClose={() => setNegotiationState(null)}
              scope="family"
              negotiationUsedThisTurn={(gameState as any).negotiationUsedThisTurn || false}
              onNegotiate={(type, extraData) => {
                performAction({
                  type: 'boss_negotiate',
                  negotiationType: type,
                  targetFamily: targetFam,
                  extraData,
                });
                setNegotiationState(null);
              }}
              enemyFamily={targetFam}
              playerReputation={gameState.reputation.respect}
              playerMoney={gameState.resources.money}
              enemyStrength={0}
              hexIncome={0}
              availableEnemyFamilies={enemyFamilies}
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

      {/* Tutorial System */}
      <TutorialSystem
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={() => setShowTutorial(false)}
      />

      {/* Turn Summary Modal */}
      <TurnSummaryModal
        report={gameState.turnReport}
        open={showTurnSummary}
        onClose={() => setShowTurnSummary(false)}
      />

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
