import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sword, 
  Shield, 
  Target, 
  Users, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CombatSystemManager, COMBAT_ACTIONS, generateCombatEvent } from '@/systems/CombatSystem';
import { CombatSystem, TerritoryBattle, SoldierTraining } from '@/types/enhanced-mechanics';

interface CombatInterfaceProps {
  combatSystem: CombatSystem;
  playerSoldiers: number;
  playerMoney: number;
  onCombatAction: (action: any) => void;
}

const CombatInterface: React.FC<CombatInterfaceProps> = ({
  combatSystem,
  playerSoldiers,
  playerMoney,
  onCombatAction
}) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);
  const [showBattleSimulation, setShowBattleSimulation] = useState(false);
  const [battleResult, setBattleResult] = useState<TerritoryBattle | null>(null);

  const combatManager = new CombatSystemManager(combatSystem);

  const territories = [
    { name: 'Little Italy', family: 'neutral', soldiers: 8, value: 50000 },
    { name: 'Bronx', family: 'genovese', soldiers: 12, value: 40000 },
    { name: 'Brooklyn', family: 'lucchese', soldiers: 10, value: 45000 },
    { name: 'Queens', family: 'bonanno', soldiers: 15, value: 35000 },
    { name: 'Manhattan', family: 'colombo', soldiers: 6, value: 100000 },
    { name: 'Staten Island', family: 'neutral', soldiers: 5, value: 30000 },
  ];

  const handleCombatAction = (action: any) => {
    if (action.type === 'attack_territory' && selectedTerritory) {
      const territory = territories.find(t => t.name === selectedTerritory);
      if (territory && playerSoldiers >= action.soldiers) {
        // Simulate battle
        const battle = combatManager.initiateTerritoryBattle(
          'gambino', // Player family
          territory.family,
          territory.name,
          action.soldiers,
          territory.soldiers,
          1 // Current turn
        );

        setBattleResult(battle);
        setShowBattleSimulation(true);
        
        // Apply battle results
        onCombatAction({
          type: 'battle_result',
          battle,
          cost: action.cost
        });
      }
    }
  };

  const getVictoryChance = (attackingSoldiers: number, defendingSoldiers: number) => {
    const trainingLevel = combatManager.getTrainingLevel();
    const equipmentBonus = combatManager.getEquipment().effectiveness;
    
    // Simplified victory chance calculation
    const baseChance = (attackingSoldiers / (attackingSoldiers + defendingSoldiers)) * 100;
    const trainingBonus = trainingLevel * 5; // 5% per training level
    const equipmentBonusPercent = equipmentBonus * 0.5; // 0.5% per equipment point
    
    return Math.min(95, Math.max(5, baseChance + trainingBonus + equipmentBonusPercent));
  };

  return (
    <div className="space-y-6">
      {/* Combat Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sword className="h-5 w-5 text-red-500" />
            Combat Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded">
              <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{playerSoldiers}</p>
              <p className="text-sm text-muted-foreground">Soldiers</p>
            </div>
            <div className="text-center p-3 border rounded">
              <Shield className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">Level {combatManager.getTrainingLevel()}</p>
              <p className="text-sm text-muted-foreground">Training</p>
            </div>
            <div className="text-center p-3 border rounded">
              <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">{combatManager.getEquipment().effectiveness}</p>
              <p className="text-sm text-muted-foreground">Equipment</p>
            </div>
            <div className="text-center p-3 border rounded">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{combatManager.getExperience()}%</p>
              <p className="text-sm text-muted-foreground">Experience</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Combat Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-500" />
            Combat Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COMBAT_ACTIONS.map((action, index) => (
              <motion.div
                key={action.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-4 border rounded cursor-pointer transition-all",
                  selectedAction === action.type 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
                    : "hover:border-gray-300"
                )}
                onClick={() => setSelectedAction(action.type)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold capitalize">
                    {action.type.replace('_', ' ')}
                  </h4>
                  <Badge variant="outline">
                    {action.risk}% Risk
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Soldiers:</span>
                    <span>{action.soldiers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost:</span>
                    <span>${action.cost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success:</span>
                    <span>{action.expectedOutcome.success}%</span>
                  </div>
                </div>

                <div className="mt-3">
                  <Progress 
                    value={action.expectedOutcome.success} 
                    className="h-2"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Territory Selection */}
      {selectedAction && (
        <Card>
          <CardHeader>
            <CardTitle>Select Target Territory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {territories.map((territory, index) => {
                const action = COMBAT_ACTIONS.find(a => a.type === selectedAction);
                const victoryChance = action ? getVictoryChance(action.soldiers, territory.soldiers) : 0;
                
                return (
                  <motion.div
                    key={territory.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "p-3 border rounded cursor-pointer transition-all",
                      selectedTerritory === territory.name 
                        ? "border-red-500 bg-red-50 dark:bg-red-950" 
                        : "hover:border-gray-300"
                    )}
                    onClick={() => setSelectedTerritory(territory.name)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">{territory.name}</h4>
                      <Badge variant={territory.family === 'neutral' ? 'secondary' : 'destructive'}>
                        {territory.family.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Defending Soldiers:</span>
                        <span>{territory.soldiers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Territory Value:</span>
                        <span>${territory.value.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Victory Chance:</span>
                        <span className={cn(
                          "font-semibold",
                          victoryChance > 70 ? "text-green-600" :
                          victoryChance > 50 ? "text-yellow-600" : "text-red-600"
                        )}>
                          {victoryChance.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-2">
                      <Progress 
                        value={victoryChance} 
                        className={cn(
                          "h-2",
                          victoryChance > 70 ? "[&>div]:bg-green-500" :
                          victoryChance > 50 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"
                        )}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execute Combat */}
      {selectedAction && selectedTerritory && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center">
              <Button
                size="lg"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  const action = COMBAT_ACTIONS.find(a => a.type === selectedAction);
                  if (action) {
                    handleCombatAction(action);
                  }
                }}
                disabled={playerSoldiers < (COMBAT_ACTIONS.find(a => a.type === selectedAction)?.soldiers || 0)}
              >
                <Sword className="h-5 w-5 mr-2" />
                Execute Combat Action
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Battle Simulation Modal */}
      <AnimatePresence>
        {showBattleSimulation && battleResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBattleSimulation(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-background border rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-4xl mb-4">
                  {battleResult.outcome === 'victory' ? (
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  ) : (
                    <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                  )}
                </div>
                
                <h2 className="text-2xl font-bold mb-2">
                  {battleResult.outcome === 'victory' ? 'VICTORY!' : 'DEFEAT!'}
                </h2>
                
                <p className="text-muted-foreground mb-4">
                  Battle for {battleResult.territory}
                </p>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Your Casualties:</span>
                    <span className="text-red-600 font-semibold">
                      -{battleResult.casualties.attacking} soldiers
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enemy Casualties:</span>
                    <span className="text-green-600 font-semibold">
                      -{battleResult.casualties.defending} soldiers
                    </span>
                  </div>
                  
                  {battleResult.outcome === 'victory' && (
                    <>
                      <div className="flex justify-between">
                        <span>Money Gained:</span>
                        <span className="text-green-600 font-semibold">
                          +${battleResult.spoils.money.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reputation Gained:</span>
                        <span className="text-green-600 font-semibold">
                          +{battleResult.spoils.reputation}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <Button 
                  className="mt-6 w-full"
                  onClick={() => setShowBattleSimulation(false)}
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Battles */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Battles</CardTitle>
        </CardHeader>
        <CardContent>
          {combatManager.getRecentBattles(3).length > 0 ? (
            <div className="space-y-3">
              {combatManager.getRecentBattles(3).map((battle, index) => (
                <motion.div
                  key={battle.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div>
                    <p className="font-semibold">{battle.territory}</p>
                    <p className="text-sm text-muted-foreground">
                      Turn {battle.turn} • {battle.attackingFamily} vs {battle.defendingFamily}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={battle.outcome === 'victory' ? 'default' : 'destructive'}>
                      {battle.outcome}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {battle.casualties.attacking} vs {battle.casualties.defending}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No recent battles. Start your first attack!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CombatInterface;
