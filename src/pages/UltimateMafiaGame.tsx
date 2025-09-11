import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationProvider, useMafiaNotifications } from '@/components/ui/notification-system';
import { AnimatedCard, AnimatedCardHeader, AnimatedCardTitle, AnimatedCardContent } from '@/components/ui/animated-card';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ResponsiveLayout, { MobileTabBar, MobileFloatingActionButton } from '@/components/ResponsiveLayout';
import EnhancedMafiaHexGrid from '@/components/EnhancedMafiaHexGrid';
import EnhancedGameMechanics from '@/components/EnhancedGameMechanics';
import { useEnhancedMafiaGameState } from '@/hooks/useEnhancedMafiaGameState';
import { useSoundSystem } from '@/hooks/useSoundSystem';
import SaveLoadDialog from '@/components/SaveLoadDialog';
import TutorialSystem from '@/components/TutorialSystem';
import { 
  Play, 
  Settings, 
  Trophy, 
  Info, 
  Calendar,
  Users,
  DollarSign,
  Shield,
  Brain,
  Target,
  Cloud,
  Zap
} from 'lucide-react';

const GameContent: React.FC = () => {
  const { 
    gameState, 
    endTurn, 
    selectTerritory, 
    performAction, 
    performBusinessAction,
    performReputationAction,
    handleEventChoice,
    isWinner 
  } = useEnhancedMafiaGameState();

  const { playSound, playSoundSequence } = useSoundSystem();
  const [activeMobileTab, setActiveMobileTab] = useState('map');
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const { notifyTerritoryCaptured, notifyReputationChange } = useMafiaNotifications();

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
      icon: <div className="w-4 h-4 bg-mafia-gold rounded-sm" />,
      content: (
        <div className="h-full">
          <EnhancedMafiaHexGrid 
            key={`hex-grid-refresh-${Date.now()}`}
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
          />
        </div>
      )
    },
    {
      id: 'mechanics',
      label: 'Game',
      icon: <div className="w-4 h-4 bg-blue-500 rounded-sm" />,
      content: (
        <div className="p-4 h-full overflow-y-auto">
          <EnhancedGameMechanics 
            gameState={gameState} 
            onAction={performAction}
          />
        </div>
      )
    },
    {
      id: 'resources',
      label: 'Resources',
      icon: <div className="w-4 h-4 bg-green-500 rounded-sm" />,
      content: (
        <div className="p-4 space-y-4">
          <ResourcePanel gameState={gameState} />
        </div>
      )
    },
    {
      id: 'events',
      label: 'Events',
      icon: <div className="w-4 h-4 bg-purple-500 rounded-sm" />,
      content: (
        <div className="p-4">
          <EventsPanel 
            gameState={gameState} 
            onEventChoice={handleEventChoice}
          />
        </div>
      )
    }
  ];

  if (isWinner) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center p-8"
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
            className="text-xl text-foreground mb-8"
          >
            You have successfully dominated New York's underworld with advanced tactics.<br/>
            The Five Families now bow to your superior strategy and power.
          </motion.p>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <Badge className="text-2xl px-8 py-4 bg-mafia-gold text-background font-playfair">
              ULTIMATE VICTORY ACHIEVED
            </Badge>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const leftSidebar = (
    <div className="space-y-4">
      <AnimatedCard className="bg-gradient-to-br from-noir-dark to-background border-noir-light">
        <AnimatedCardHeader>
          <AnimatedCardTitle className="text-mafia-gold font-playfair">
            {gameState.playerFamily.toUpperCase()} FAMILY
          </AnimatedCardTitle>
        </AnimatedCardHeader>
        <AnimatedCardContent>
          <ResourcePanel gameState={gameState} />
        </AnimatedCardContent>
      </AnimatedCard>

      <AnimatedCard className="bg-gradient-to-br from-noir-dark to-background border-noir-light">
        <AnimatedCardHeader>
          <AnimatedCardTitle className="text-mafia-gold font-playfair">
            Game Mechanics
          </AnimatedCardTitle>
        </AnimatedCardHeader>
        <AnimatedCardContent>
          <EnhancedGameMechanics 
            gameState={gameState} 
            onAction={performAction}
          />
        </AnimatedCardContent>
      </AnimatedCard>
    </div>
  );

  const rightSidebar = (
    <div className="space-y-4">
      <AnimatedCard className="bg-gradient-to-br from-noir-dark to-background border-noir-light">
        <AnimatedCardHeader>
          <AnimatedCardTitle className="text-mafia-gold font-playfair">
            Events & Missions
          </AnimatedCardTitle>
        </AnimatedCardHeader>
        <AnimatedCardContent>
          <EventsPanel 
            gameState={gameState} 
            onEventChoice={handleEventChoice}
          />
        </AnimatedCardContent>
      </AnimatedCard>
      
      <AnimatedCard className="bg-gradient-to-br from-noir-dark to-background border-noir-light">
        <AnimatedCardHeader>
          <AnimatedCardTitle className="text-mafia-gold font-playfair">
            AI Opponents
          </AnimatedCardTitle>
        </AnimatedCardHeader>
        <AnimatedCardContent>
          <AIOpponentsPanel gameState={gameState} />
        </AnimatedCardContent>
      </AnimatedCard>
    </div>
  );

  const topBar = (
    <>
      <div className="flex items-center space-x-4">
        <motion.h1
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-bold text-mafia-gold font-playfair"
        >
          ULTIMATE FIVE FAMILIES
        </motion.h1>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-2 h-2 bg-mafia-gold rounded-full"
        />
        <span className="text-sm text-muted-foreground font-source">ENHANCED UNDERWORLD</span>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-sm text-muted-foreground font-source">
          TURN: {gameState.turn} | SEASON: {gameState.season.toUpperCase()} | STATUS: COMMISSION ACTIVE
        </div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-3 h-3 bg-mafia-blood rounded-full"
        />
        <SaveLoadDialog 
          gameState={gameState} 
          onLoadGame={handleLoadGame}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTutorial(true)}
        >
          <Info className="h-4 w-4 mr-2" />
          Tutorial
        </Button>
      </div>
    </>
  );

  const bottomBar = (
    <>
      <div className="flex items-center space-x-6 text-sm font-source">
        <span className="text-mafia-gold">
          ▲ {gameState.selectedTerritory ? 
             `${gameState.selectedTerritory.district} - ${gameState.selectedTerritory.family.toUpperCase()}` : 
             'NO TERRITORY SELECTED'}
        </span>
        <span className="text-muted-foreground">
          | RESPECT: {gameState.resources.respect}% | SOLDIERS: {gameState.resources.soldiers} | RESEARCH: {gameState.resources.researchPoints}
        </span>
      </div>
      
      <div className="text-sm text-mafia-gold font-playfair">
        "ADVANCED STRATEGY RULES THE UNDERWORLD"
      </div>
    </>
  );

  const mainContent = (
    <div className="h-full">
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
        key={`hex-grid-refresh-${Date.now()}`}
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
              playSound('notification');
              endTurn();
            }}
            icon={<Play className="h-5 w-5" />}
            label="End Turn"
            position="bottom-right"
          />
        </div>
      </ResponsiveLayout>

      {/* Tutorial System */}
      <TutorialSystem
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={() => setShowTutorial(false)}
      />
    </>
  );
};

// Resource Panel Component
const ResourcePanel: React.FC<{ gameState: any }> = ({ gameState }) => {
  const { resources } = gameState;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="text-center p-2 border rounded">
          <DollarSign className="h-4 w-4 mx-auto mb-1 text-green-500" />
          <p className="text-sm font-medium">${resources.money.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Money</p>
        </div>
        <div className="text-center p-2 border rounded">
          <Users className="h-4 w-4 mx-auto mb-1 text-red-500" />
          <p className="text-sm font-medium">{resources.soldiers}</p>
          <p className="text-xs text-muted-foreground">Soldiers</p>
        </div>
        <div className="text-center p-2 border rounded">
          <Shield className="h-4 w-4 mx-auto mb-1 text-blue-500" />
          <p className="text-sm font-medium">{resources.respect}%</p>
          <p className="text-xs text-muted-foreground">Respect</p>
        </div>
        <div className="text-center p-2 border rounded">
          <Brain className="h-4 w-4 mx-auto mb-1 text-purple-500" />
          <p className="text-sm font-medium">{resources.researchPoints}</p>
          <p className="text-xs text-muted-foreground">Research</p>
        </div>
      </div>
    </div>
  );
};

// Events Panel Component
const EventsPanel: React.FC<{ gameState: any; onEventChoice: (eventId: string, choiceId: string) => void }> = ({ 
  gameState, 
  onEventChoice 
}) => {
  const { events, missions } = gameState;

  return (
    <div className="space-y-4">
      {/* Active Events */}
      {events.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-2">Active Events</h4>
          <div className="space-y-2">
            {events.slice(0, 2).map((event: any, index: number) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-2 border rounded bg-yellow-50 dark:bg-yellow-950"
              >
                <p className="font-medium text-sm">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.description}</p>
                <div className="flex gap-1 mt-2">
                  {event.choices.slice(0, 2).map((choice: any) => (
                    <button
                      key={choice.id}
                      onClick={() => onEventChoice(event.id, choice.id)}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      {choice.text}
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Active Missions */}
      <div>
        <h4 className="font-semibold text-sm mb-2">Missions</h4>
        <div className="space-y-2">
          {missions.filter((m: any) => m.status === 'active').slice(0, 2).map((mission: any, index: number) => (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-2 border rounded"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm">{mission.title}</span>
                <Badge variant="outline" className="text-xs">{mission.difficulty}</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1 mb-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full" 
                  style={{ width: `${mission.progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{mission.progress}% complete</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// AI Opponents Panel Component
const AIOpponentsPanel: React.FC<{ gameState: any }> = ({ gameState }) => {
  const { aiOpponents } = gameState;

  return (
    <div className="space-y-2">
      {aiOpponents.slice(0, 3).map((opponent: any, index: number) => (
        <motion.div
          key={opponent.family}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-2 border rounded"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium text-sm capitalize">{opponent.family}</span>
            <Badge variant="outline" className="text-xs">{opponent.personality}</Badge>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${opponent.resources.money.toLocaleString()}</span>
            <span>{opponent.resources.soldiers} soldiers</span>
            <span>{opponent.resources.influence} influence</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const UltimateMafiaGame: React.FC = () => {
  return (
    <NotificationProvider>
      <GameContent />
    </NotificationProvider>
  );
};

export default UltimateMafiaGame;
