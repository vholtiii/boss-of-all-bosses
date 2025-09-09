import React from 'react';
import MafiaHexGrid from '@/components/MafiaHexGrid';
import MafiaHud from '@/components/MafiaHud';
import { useMafiaGameState } from '@/hooks/useMafiaGameState';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const Index = () => {
  const { 
    gameState, 
    endTurn, 
    selectTerritory, 
    performAction, 
    performBusinessAction,
    isWinner 
  } = useMafiaGameState();

  if (isWinner) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-6xl font-bold text-mafia-gold mb-4 font-playfair">CONGRATULATIONS</h1>
          <h2 className="text-3xl text-mafia-gold mb-6 font-playfair">Boss of All Bosses</h2>
          <p className="text-xl text-foreground mb-8">
            You have successfully taken control of New York's underworld.<br/>
            The Five Families now bow to your authority.
          </p>
          <Badge className="text-2xl px-8 py-4 bg-mafia-gold text-background font-playfair">
            VICTORY ACHIEVED
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Game Interface */}
      <div className="flex h-screen">
        {/* Left Sidebar - Mafia HUD */}
        <div className="w-80 p-4 bg-gradient-to-b from-noir-dark via-background to-noir-dark border-r border-noir-light">
        <MafiaHud 
          gameState={gameState} 
          onEndTurn={endTurn} 
          onAction={performAction}
          onBusinessAction={performBusinessAction}
        />
        </div>
        
        {/* Main Game Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="h-16 bg-noir-dark border-b border-noir-light flex items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-mafia-gold font-playfair">FIVE FAMILIES</h1>
              <div className="w-2 h-2 bg-mafia-gold rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground font-source">NEW YORK UNDERWORLD</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground font-source">
                YEAR: 1955 | STATUS: COMMISSION ACTIVE
              </div>
              <div className="w-3 h-3 bg-mafia-blood rounded-full" />
            </div>
          </div>
          
          {/* Game Board */}
          <div className="flex-1 p-4 bg-gradient-to-br from-background via-noir-dark/20 to-background relative">
            {/* Vintage paper overlay */}
            <div className="absolute inset-0 opacity-5 bg-repeat" 
                 style={{
                   backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E")`
                 }} 
            />
            
            <MafiaHexGrid 
              width={12}
              height={12}
              onTerritoryClick={selectTerritory}
              selectedTerritory={gameState.selectedTerritory ? {
                q: 0, r: 0, s: 0, // These will be overridden by the actual selection logic
                district: gameState.selectedTerritory.district as any,
                family: gameState.selectedTerritory.family as any
              } : null}
              playerFamily={gameState.playerFamily}
            />
          </div>
          
          {/* Bottom Status Bar */}
          <div className="h-12 bg-noir-dark border-t border-noir-light flex items-center justify-between px-6">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
