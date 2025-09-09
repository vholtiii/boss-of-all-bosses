import React from 'react';
import HexGrid from '@/components/HexGrid';
import GameHud from '@/components/GameHud';
import { useGameState } from '@/hooks/useGameState';

const Index = () => {
  const { gameState, endTurn, selectHex, performAction } = useGameState();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Game Interface */}
      <div className="flex h-screen">
        {/* Left Sidebar - Game HUD */}
        <div className="w-80 p-4 bg-gradient-to-b from-steel-dark via-background to-steel-dark border-r border-steel-light">
          <GameHud 
            gameState={gameState}
            onEndTurn={endTurn}
            onAction={performAction}
          />
        </div>
        
        {/* Main Game Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="h-16 bg-steel-dark border-b border-steel-light flex items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-tactical-green">HEX COMMAND</h1>
              <div className="w-2 h-2 bg-tactical-green rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">TACTICAL OPERATIONS ACTIVE</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                GRID: ONLINE | STATUS: READY
              </div>
              <div className="w-3 h-3 bg-tactical-amber rounded-full" />
            </div>
          </div>
          
          {/* Game Board */}
          <div className="flex-1 p-4 bg-gradient-to-br from-background via-steel-dark/20 to-background">
            <HexGrid 
              width={12}
              height={12}
              onHexClick={selectHex}
              selectedHex={gameState.selectedHex}
            />
          </div>
          
          {/* Bottom Status Bar */}
          <div className="h-12 bg-steel-dark border-t border-steel-light flex items-center justify-between px-6">
            <div className="flex items-center space-x-6 text-sm">
              <span className="text-tactical-green">
                ▲ {gameState.selectedHex ? `HEX (${gameState.selectedHex.q},${gameState.selectedHex.r})` : 'NO SELECTION'}
              </span>
              <span className="text-muted-foreground">
                | ZOOM: 100% | GRID: VISIBLE
              </span>
            </div>
            
            <div className="text-sm text-tactical-amber">
              PRESS ESC FOR COMMAND MENU
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
