import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GameState {
  currentPlayer: 1 | 2;
  turn: number;
  resources: {
    player1: { fuel: number; ammo: number; supplies: number };
    player2: { fuel: number; ammo: number; supplies: number };
  };
  selectedUnit?: {
    type: 'infantry' | 'tank' | 'artillery';
    health: number;
    movement: number;
    attack: number;
  } | null;
}

interface GameHudProps {
  gameState: GameState;
  onEndTurn: () => void;
  onAction: (action: string) => void;
}

const GameHud: React.FC<GameHudProps> = ({ gameState, onEndTurn, onAction }) => {
  const currentResources = gameState.resources[`player${gameState.currentPlayer}` as keyof typeof gameState.resources];

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Command Header */}
      <Card className="bg-steel-dark border-steel-light p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-tactical-green">TACTICAL COMMAND</h2>
            <p className="text-sm text-muted-foreground">Turn {gameState.turn}</p>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "text-lg px-4 py-2 border-2",
              gameState.currentPlayer === 1 
                ? "border-tactical-green text-tactical-green" 
                : "border-destructive text-destructive"
            )}
          >
            Player {gameState.currentPlayer}
          </Badge>
        </div>
        
        <Button 
          onClick={onEndTurn}
          className="w-full bg-tactical-amber hover:bg-tactical-amber/90 text-background font-bold"
        >
          END TURN
        </Button>
      </Card>

      {/* Resources Panel */}
      <Card className="bg-steel-dark border-steel-light p-4">
        <h3 className="text-lg font-semibold text-tactical-green mb-3">RESOURCES</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">⛽ Fuel</span>
            <Badge variant="secondary">{currentResources.fuel}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">💥 Ammo</span>
            <Badge variant="secondary">{currentResources.ammo}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">📦 Supplies</span>
            <Badge variant="secondary">{currentResources.supplies}</Badge>
          </div>
        </div>
      </Card>

      {/* Unit Info Panel */}
      {gameState.selectedUnit ? (
        <Card className="bg-steel-dark border-steel-light p-4">
          <h3 className="text-lg font-semibold text-tactical-green mb-3">UNIT INFO</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Type</span>
              <Badge variant="outline" className="capitalize">
                {gameState.selectedUnit.type}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">❤️ Health</span>
              <div className="w-20 bg-muted rounded-full h-2">
                <div 
                  className="bg-tactical-green h-2 rounded-full transition-all"
                  style={{ width: `${gameState.selectedUnit.health}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">🚶 Movement</span>
              <Badge variant="secondary">{gameState.selectedUnit.movement}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">⚔️ Attack</span>
              <Badge variant="secondary">{gameState.selectedUnit.attack}</Badge>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onAction('move')}
            >
              MOVE
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onAction('attack')}
            >
              ATTACK
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onAction('defend')}
            >
              DEFEND
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="bg-steel-dark border-steel-light p-4">
          <h3 className="text-lg font-semibold text-muted-foreground mb-3">NO UNIT SELECTED</h3>
          <p className="text-sm text-muted-foreground">
            Click on a unit to view its information and available actions.
          </p>
        </Card>
      )}

      {/* Action Log */}
      <Card className="bg-steel-dark border-steel-light p-4 flex-1">
        <h3 className="text-lg font-semibold text-tactical-green mb-3">BATTLE LOG</h3>
        <div className="space-y-1 text-xs text-muted-foreground max-h-32 overflow-y-auto">
          <div>• Turn {gameState.turn} - Player {gameState.currentPlayer} active</div>
          <div>• Awaiting orders...</div>
          <div className="text-tactical-amber">• System ready for combat operations</div>
        </div>
      </Card>
    </div>
  );
};

export default GameHud;