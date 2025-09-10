import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { NotificationProvider, useMafiaNotifications } from '@/components/ui/notification-system';
import { AnimatedCard, AnimatedCardHeader, AnimatedCardTitle, AnimatedCardContent } from '@/components/ui/animated-card';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ResponsiveLayout, { MobileTabBar, MobileFloatingActionButton } from '@/components/ResponsiveLayout';
import EnhancedMafiaHexGrid from '@/components/EnhancedMafiaHexGrid';
import MafiaHud from '@/components/MafiaHud';
import { IntelligencePanel } from '@/components/IntelligencePanel';
import ReputationPanel from '@/components/ReputationPanel';
import { useMafiaGameState } from '@/hooks/useMafiaGameState';
import { Play, Settings, Trophy, Info } from 'lucide-react';

// Territory interface for backward compatibility
interface Territory {
  q: number;
  r: number;
  s: number;
  district: 'Little Italy' | 'Bronx' | 'Brooklyn' | 'Queens' | 'Manhattan' | 'Staten Island';
  family: 'neutral' | 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  business?: {
    type: string;
    income: number;
  };
}

const GameContent: React.FC = () => {
  const { 
    gameState, 
    endTurn, 
    selectTerritory, 
    performAction, 
    performBusinessAction,
    performReputationAction,
    isWinner 
  } = useMafiaGameState();

  const [activeMobileTab, setActiveMobileTab] = useState('map');
  const [showSettings, setShowSettings] = useState(false);
  const { notifyTerritoryCaptured, notifyReputationChange } = useMafiaNotifications();

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
              
              // Notify territory capture
              if (business.family === gameState.playerFamily) {
                notifyTerritoryCaptured(business.district);
              }
            }}
            selectedBusiness={null}
            playerFamily={gameState.playerFamily}
          />
        </div>
      )
    },
    {
      id: 'hud',
      label: 'HUD',
      icon: <div className="w-4 h-4 bg-green-500 rounded-sm" />,
      content: (
        <div className="p-4">
          <MafiaHud 
            gameState={gameState} 
            onEndTurn={endTurn} 
            onAction={performAction}
            onBusinessAction={performBusinessAction}
          />
        </div>
      )
    },
    {
      id: 'intel',
      label: 'Intel',
      icon: <div className="w-4 h-4 bg-blue-500 rounded-sm" />,
      content: (
        <div className="p-4">
          <IntelligencePanel
            businesses={gameState.businesses}
            policeHeat={gameState.policeHeat}
            currentTurn={gameState.turn}
            familyControl={gameState.familyControl}
            onAction={performBusinessAction}
          />
        </div>
      )
    },
    {
      id: 'reputation',
      label: 'Rep',
      icon: <div className="w-4 h-4 bg-purple-500 rounded-sm" />,
      content: (
        <div className="p-4">
          <ReputationPanel
            reputation={gameState.reputation}
            violentActions={gameState.violentActions}
            resources={{ money: gameState.resources.money, soldiers: gameState.resources.soldiers }}
            onReputationAction={performReputationAction}
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
            Boss of All Bosses
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-xl text-foreground mb-8"
          >
            You have successfully taken control of New York's underworld.<br/>
            The Five Families now bow to your authority.
          </motion.p>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <Badge className="text-2xl px-8 py-4 bg-mafia-gold text-background font-playfair">
              VICTORY ACHIEVED
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
          <MafiaHud 
            gameState={gameState} 
            onEndTurn={endTurn} 
            onAction={performAction}
            onBusinessAction={performBusinessAction}
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
            Intelligence
          </AnimatedCardTitle>
        </AnimatedCardHeader>
        <AnimatedCardContent>
          <IntelligencePanel
            businesses={gameState.businesses}
            policeHeat={gameState.policeHeat}
            currentTurn={gameState.turn}
            familyControl={gameState.familyControl}
            onAction={performBusinessAction}
          />
        </AnimatedCardContent>
      </AnimatedCard>
      
      <AnimatedCard className="bg-gradient-to-br from-noir-dark to-background border-noir-light">
        <AnimatedCardHeader>
          <AnimatedCardTitle className="text-mafia-gold font-playfair">
            Reputation
          </AnimatedCardTitle>
        </AnimatedCardHeader>
        <AnimatedCardContent>
          <ReputationPanel
            reputation={gameState.reputation}
            violentActions={gameState.violentActions}
            resources={{ money: gameState.resources.money, soldiers: gameState.resources.soldiers }}
            onReputationAction={performReputationAction}
          />
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
          FIVE FAMILIES
        </motion.h1>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-2 h-2 bg-mafia-gold rounded-full"
        />
        <span className="text-sm text-muted-foreground font-source">NEW YORK UNDERWORLD</span>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-sm text-muted-foreground font-source">
          YEAR: 1955 | STATUS: COMMISSION ACTIVE
        </div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-3 h-3 bg-mafia-blood rounded-full"
        />
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
          | RESPECT: {gameState.resources.respect}% | SOLDIERS: {gameState.resources.soldiers}
        </span>
      </div>
      
      <div className="text-sm text-mafia-gold font-playfair">
        "NEVER GO AGAINST THE FAMILY"
      </div>
    </>
  );

  const mainContent = (
    <div className="h-full">
      {/* Vintage paper overlay */}
      <div className="absolute inset-0 opacity-5 bg-repeat pointer-events-none" 
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E")`
           }} 
      />
      
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
          
          // Notify territory capture
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
          onClick={endTurn}
          icon={<Play className="h-5 w-5" />}
          label="End Turn"
          position="bottom-right"
        />
      </div>
    </ResponsiveLayout>
  );
};

const EnhancedIndex: React.FC = () => {
  return (
    <NotificationProvider>
      <GameContent />
    </NotificationProvider>
  );
};

export default EnhancedIndex;
