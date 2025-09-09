import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface MafiaGameState {
  playerFamily: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  turn: number;
  resources: {
    money: number;
    respect: number;
    soldiers: number;
    influence: number;
  };
  selectedTerritory?: {
    district: string;
    family: string;
    business?: {
      type: string;
      income: number;
    };
    capo?: {
      name: string;
      loyalty: number;
      strength: number;
    };
  } | null;
  familyControl: {
    gambino: number;
    genovese: number;
    lucchese: number;
    bonanno: number;
    colombo: number;
  };
}

interface MafiaHudProps {
  gameState: MafiaGameState;
  onEndTurn: () => void;
  onAction: (action: string) => void;
}

const MafiaHud: React.FC<MafiaHudProps> = ({ gameState, onEndTurn, onAction }) => {
  const familyNames = {
    gambino: 'Gambino Family',
    genovese: 'Genovese Family', 
    lucchese: 'Lucchese Family',
    bonanno: 'Bonanno Family',
    colombo: 'Colombo Family'
  };

  const familyColors = {
    gambino: 'border-families-gambino text-families-gambino',
    genovese: 'border-families-genovese text-families-genovese',
    lucchese: 'border-families-lucchese text-families-lucchese',
    bonanno: 'border-families-bonanno text-families-bonanno',
    colombo: 'border-families-colombo text-families-colombo'
  };

  return (
    <div className="flex flex-col h-full space-y-4 font-source">
      {/* Family Header */}
      <Card className="bg-noir-dark border-noir-light p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-mafia-gold font-playfair">THE COMMISSION</h2>
            <p className="text-sm text-muted-foreground">Year 1955 - Turn {gameState.turn}</p>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "text-lg px-4 py-2 border-2 font-playfair",
              familyColors[gameState.playerFamily]
            )}
          >
            {familyNames[gameState.playerFamily]}
          </Badge>
        </div>
        
        <Button 
          onClick={onEndTurn}
          className="w-full bg-mafia-gold hover:bg-mafia-gold/90 text-background font-bold font-playfair"
        >
          END TURN
        </Button>
      </Card>

      {/* Resources Panel */}
      <Card className="bg-noir-dark border-noir-light p-4">
        <h3 className="text-lg font-semibold text-mafia-gold mb-3 font-playfair">RESOURCES</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">💰 Money</span>
            <Badge variant="secondary" className="font-bold">${gameState.resources.money.toLocaleString()}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">👑 Respect</span>
            <div className="flex items-center space-x-2">
              <Progress value={gameState.resources.respect} className="w-16 h-2" />
              <Badge variant="secondary">{gameState.resources.respect}%</Badge>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">👥 Soldiers</span>
            <Badge variant="secondary">{gameState.resources.soldiers}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">🗽 Influence</span>
            <Badge variant="secondary">{gameState.resources.influence}</Badge>
          </div>
        </div>
      </Card>

      {/* Territory Info Panel */}
      {gameState.selectedTerritory ? (
        <Card className="bg-noir-dark border-noir-light p-4">
          <h3 className="text-lg font-semibold text-mafia-gold mb-3 font-playfair">TERRITORY INTEL</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">District</span>
              <Badge variant="outline" className="capitalize">
                {gameState.selectedTerritory.district}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Controlled by</span>
              <Badge 
                variant="outline" 
                className={cn(
                  "capitalize",
                  gameState.selectedTerritory.family !== 'neutral' 
                    ? familyColors[gameState.selectedTerritory.family as keyof typeof familyColors]
                    : 'text-muted-foreground border-muted'
                )}
              >
                {gameState.selectedTerritory.family === 'neutral' ? 'Nobody' : 
                 familyNames[gameState.selectedTerritory.family as keyof typeof familyNames]}
              </Badge>
            </div>
            
            {gameState.selectedTerritory.business && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Business</span>
                  <Badge variant="outline" className="capitalize">
                    {gameState.selectedTerritory.business.type}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">💰 Income</span>
                  <Badge variant="secondary">${gameState.selectedTerritory.business.income}/turn</Badge>
                </div>
              </>
            )}
            
            {gameState.selectedTerritory.capo && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">👤 Capo</span>
                  <Badge variant="outline" className="font-playfair">
                    {gameState.selectedTerritory.capo.name}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">🤝 Loyalty</span>
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div 
                      className="bg-mafia-gold h-2 rounded-full transition-all"
                      style={{ width: `${gameState.selectedTerritory.capo.loyalty}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">💪 Strength</span>
                  <Badge variant="secondary">{gameState.selectedTerritory.capo.strength}</Badge>
                </div>
              </>
            )}
          </div>
          
          <div className="mt-4 space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-mafia-gold text-mafia-gold hover:bg-mafia-gold hover:text-background"
              onClick={() => onAction('takeover')}
            >
              TAKE OVER
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onAction('negotiate')}
            >
              NEGOTIATE
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onAction('sabotage')}
            >
              SABOTAGE
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="bg-noir-dark border-noir-light p-4">
          <h3 className="text-lg font-semibold text-muted-foreground mb-3 font-playfair">NO TARGET SELECTED</h3>
          <p className="text-sm text-muted-foreground">
            Click on a territory to view intel and plan your next move.
          </p>
        </Card>
      )}

      {/* Family Control Panel */}
      <Card className="bg-noir-dark border-noir-light p-4">
        <h3 className="text-lg font-semibold text-mafia-gold mb-3 font-playfair">FAMILY POWER</h3>
        <div className="space-y-2">
          {Object.entries(gameState.familyControl).map(([family, control]) => (
            <div key={family} className="flex justify-between items-center">
              <span className={cn("text-sm capitalize", familyColors[family as keyof typeof familyColors])}>
                {familyNames[family as keyof typeof familyNames].split(' ')[0]}
              </span>
              <div className="flex items-center space-x-2">
                <Progress 
                  value={control} 
                  className="w-20 h-2"
                />
                <Badge variant="secondary" className="text-xs">{control}%</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Activity Log */}
      <Card className="bg-noir-dark border-noir-light p-4 flex-1">
        <h3 className="text-lg font-semibold text-mafia-gold mb-3 font-playfair">THE WORD ON THE STREET</h3>
        <div className="space-y-1 text-xs text-muted-foreground max-h-32 overflow-y-auto">
          <div>• Year 1955, Turn {gameState.turn} - {familyNames[gameState.playerFamily]} making moves</div>
          <div>• The Commission watches your every decision...</div>
          <div className="text-mafia-gold">• "Keep your friends close, but your enemies closer" - Sun Tzu</div>
          <div>• Rival families are planning their next moves...</div>
          <div className="text-mafia-blood">• Blood money flows through the streets of New York</div>
        </div>
      </Card>
    </div>
  );
};

export default MafiaHud;