import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sword, 
  TrendingUp, 
  Brain, 
  Target, 
  Cloud, 
  Zap, 
  Calendar,
  Users,
  DollarSign,
  Shield,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnhancedMafiaGameState } from '@/hooks/useEnhancedMafiaGameState';

interface EnhancedGameMechanicsProps {
  gameState: EnhancedMafiaGameState;
  onAction: (action: any) => void;
}

const EnhancedGameMechanics: React.FC<EnhancedGameMechanicsProps> = ({ 
  gameState, 
  onAction 
}) => {
  const [activeTab, setActiveTab] = useState('combat');

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="combat" className="flex items-center gap-2">
            <Sword className="h-4 w-4" />
            <span className="hidden sm:inline">Combat</span>
          </TabsTrigger>
          <TabsTrigger value="economy" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Economy</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">AI</span>
          </TabsTrigger>
          <TabsTrigger value="missions" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Missions</span>
          </TabsTrigger>
          <TabsTrigger value="weather" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            <span className="hidden sm:inline">Weather</span>
          </TabsTrigger>
          <TabsTrigger value="tech" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Tech</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="combat" className="space-y-4">
          <CombatPanel gameState={gameState} onAction={onAction} />
        </TabsContent>

        <TabsContent value="economy" className="space-y-4">
          <EconomyPanel gameState={gameState} onAction={onAction} />
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <AIPanel gameState={gameState} onAction={onAction} />
        </TabsContent>

        <TabsContent value="missions" className="space-y-4">
          <MissionsPanel gameState={gameState} onAction={onAction} />
        </TabsContent>

        <TabsContent value="weather" className="space-y-4">
          <WeatherPanel gameState={gameState} onAction={onAction} />
        </TabsContent>

        <TabsContent value="tech" className="space-y-4">
          <TechnologyPanel gameState={gameState} onAction={onAction} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Combat Panel Component
const CombatPanel: React.FC<{ gameState: EnhancedMafiaGameState; onAction: (action: any) => void }> = ({ 
  gameState, 
  onAction 
}) => {
  const { combat } = gameState;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sword className="h-5 w-5 text-red-500" />
            Combat System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Soldier Training */}
          <div>
            <h4 className="font-semibold mb-2">Soldier Training</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Training Level</p>
                <Badge variant="outline" className="mt-1">
                  Level {combat.soldierTraining.level}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Experience</p>
                <Progress value={combat.soldierTraining.experience} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Equipment */}
          <div>
            <h4 className="font-semibold mb-2">Equipment</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 border rounded">
                <p className="text-xs text-muted-foreground">Weapons</p>
                <Badge variant="secondary" className="text-xs">
                  {combat.soldierTraining.equipment.weapons.replace('_', ' ')}
                </Badge>
              </div>
              <div className="text-center p-2 border rounded">
                <p className="text-xs text-muted-foreground">Armor</p>
                <Badge variant="secondary" className="text-xs">
                  {combat.soldierTraining.equipment.armor.replace('_', ' ')}
                </Badge>
              </div>
              <div className="text-center p-2 border rounded">
                <p className="text-xs text-muted-foreground">Vehicles</p>
                <Badge variant="secondary" className="text-xs">
                  {combat.soldierTraining.equipment.vehicles.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>

          {/* Recent Battles */}
          <div>
            <h4 className="font-semibold mb-2">Recent Battles</h4>
            {combat.territoryBattles.length > 0 ? (
              <div className="space-y-2">
                {combat.territoryBattles.slice(-3).map((battle, index) => (
                  <motion.div
                    key={battle.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-2 border rounded text-sm"
                  >
                    <div className="flex justify-between items-center">
                      <span>{battle.territory}</span>
                      <Badge variant={battle.outcome === 'victory' ? 'default' : 'destructive'}>
                        {battle.outcome}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Turn {battle.turn} • {battle.casualties.attacking} vs {battle.casualties.defending}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent battles</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Economy Panel Component
const EconomyPanel: React.FC<{ gameState: EnhancedMafiaGameState; onAction: (action: any) => void }> = ({ 
  gameState, 
  onAction 
}) => {
  const { economy } = gameState;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Market Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {economy.marketConditions.map((condition, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex justify-between items-center p-2 border rounded mb-2"
            >
              <div>
                <p className="font-medium">{condition.sector} Market</p>
                <p className="text-sm text-muted-foreground">{condition.description}</p>
              </div>
              <div className="text-right">
                <Badge variant={condition.modifier >= 0 ? 'default' : 'destructive'}>
                  {condition.modifier > 0 ? '+' : ''}{condition.modifier}%
                </Badge>
                <p className="text-xs text-muted-foreground">{condition.duration} turns</p>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-yellow-500" />
            Investments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {economy.investments.length > 0 ? (
            <div className="space-y-2">
              {economy.investments.map((investment, index) => (
                <motion.div
                  key={investment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-2 border rounded"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{investment.type.replace('_', ' ')}</span>
                    <span className="text-green-600">${investment.currentValue.toLocaleString()}</span>
                  </div>
                  <Progress value={(investment.duration / investment.duration) * 100} className="mt-1" />
                  <p className="text-xs text-muted-foreground">{investment.duration} turns remaining</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active investments</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// AI Panel Component
const AIPanel: React.FC<{ gameState: EnhancedMafiaGameState; onAction: (action: any) => void }> = ({ 
  gameState, 
  onAction 
}) => {
  const { aiOpponents } = gameState;

  return (
    <div className="space-y-4">
      {aiOpponents.map((opponent, index) => (
        <motion.div
          key={opponent.family}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="capitalize">{opponent.family} Family</span>
                <Badge variant="outline">{opponent.personality}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Resources */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 border rounded">
                  <DollarSign className="h-4 w-4 mx-auto mb-1" />
                  <p className="text-sm font-medium">${opponent.resources.money.toLocaleString()}</p>
                </div>
                <div className="text-center p-2 border rounded">
                  <Users className="h-4 w-4 mx-auto mb-1" />
                  <p className="text-sm font-medium">{opponent.resources.soldiers}</p>
                </div>
                <div className="text-center p-2 border rounded">
                  <Shield className="h-4 w-4 mx-auto mb-1" />
                  <p className="text-sm font-medium">{opponent.resources.influence}</p>
                </div>
              </div>

              {/* Strategy */}
              <div>
                <h4 className="font-semibold text-sm mb-1">Strategy</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Goal: {opponent.strategy.primaryGoal}</span>
                    <span>Risk: {opponent.strategy.riskTolerance}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Aggression: {opponent.strategy.aggressionLevel}%</span>
                    <span>Cooperation: {opponent.strategy.cooperationTendency}%</span>
                  </div>
                </div>
              </div>

              {/* Relationships */}
              <div>
                <h4 className="font-semibold text-sm mb-1">Relationships</h4>
                <div className="flex gap-1">
                  {Object.entries(opponent.relationships).map(([family, score]) => (
                    <Badge
                      key={family}
                      variant={score > 0 ? 'default' : score < 0 ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {family}: {score > 0 ? '+' : ''}{score}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

// Missions Panel Component
const MissionsPanel: React.FC<{ gameState: EnhancedMafiaGameState; onAction: (action: any) => void }> = ({ 
  gameState, 
  onAction 
}) => {
  const { missions } = gameState;

  return (
    <div className="space-y-4">
      {missions.map((mission, index) => (
        <motion.div
          key={mission.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{mission.title}</span>
                <div className="flex gap-2">
                  <Badge variant="outline">{mission.difficulty}</Badge>
                  <Badge variant={mission.status === 'completed' ? 'default' : 'secondary'}>
                    {mission.status}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{mission.description}</p>
              
              {/* Objectives */}
              <div>
                <h4 className="font-semibold text-sm mb-2">Objectives</h4>
                <div className="space-y-1">
                  {mission.objectives.map((objective, objIndex) => (
                    <div key={objective.id} className="flex items-center gap-2">
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        objective.completed ? "bg-green-500 border-green-500" : "border-gray-300"
                      )}>
                        {objective.completed && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className="text-sm">{objective.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{mission.progress}%</span>
                </div>
                <Progress value={mission.progress} />
              </div>

              {/* Rewards */}
              <div>
                <h4 className="font-semibold text-sm mb-2">Rewards</h4>
                <div className="flex gap-2">
                  {mission.rewards.map((reward, rewardIndex) => (
                    <Badge key={rewardIndex} variant="outline" className="text-xs">
                      {reward.type}: {reward.amount}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {mission.status === 'available' && (
                <Button 
                  size="sm" 
                  onClick={() => onAction({ type: 'accept_mission', missionId: mission.id })}
                >
                  Accept Mission
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

// Weather Panel Component
const WeatherPanel: React.FC<{ gameState: EnhancedMafiaGameState; onAction: (action: any) => void }> = ({ 
  gameState, 
  onAction 
}) => {
  const { weather } = gameState;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-blue-500" />
          Weather Conditions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Weather */}
        <div className="text-center p-4 border rounded">
          <div className="text-2xl mb-2">
            {weather.currentWeather.type === 'clear' && '☀️'}
            {weather.currentWeather.type === 'rain' && '🌧️'}
            {weather.currentWeather.type === 'snow' && '❄️'}
            {weather.currentWeather.type === 'fog' && '🌫️'}
            {weather.currentWeather.type === 'storm' && '⛈️'}
          </div>
          <h3 className="font-semibold capitalize">{weather.currentWeather.type}</h3>
          <p className="text-sm text-muted-foreground">{weather.currentWeather.description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {weather.currentWeather.duration} turns remaining
          </p>
        </div>

        {/* Weather Effects */}
        {weather.effects.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Current Effects</h4>
            <div className="space-y-1">
              {weather.effects.map((effect, index) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded text-sm">
                  <span>{effect.description}</span>
                  <Badge variant={effect.modifier >= 0 ? 'default' : 'destructive'}>
                    {effect.modifier > 0 ? '+' : ''}{effect.modifier}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Technology Panel Component
const TechnologyPanel: React.FC<{ gameState: EnhancedMafiaGameState; onAction: (action: any) => void }> = ({ 
  gameState, 
  onAction 
}) => {
  const { technology } = gameState;

  return (
    <div className="space-y-4">
      {/* Available Technologies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            Available Technologies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {technology.available.length > 0 ? (
            <div className="space-y-3">
              {technology.available.map((tech, index) => (
                <motion.div
                  key={tech.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 border rounded"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{tech.name}</h4>
                      <p className="text-sm text-muted-foreground">{tech.description}</p>
                    </div>
                    <Badge variant="outline">{tech.category}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <p>Cost: ${tech.cost.toLocaleString()}</p>
                      <p>Research Time: {tech.researchTime} turns</p>
                    </div>
                    <Button 
                      size="sm"
                      disabled={gameState.resources.money < tech.cost}
                      onClick={() => onAction({ type: 'research_technology', technologyId: tech.id })}
                    >
                      Research
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No technologies available</p>
          )}
        </CardContent>
      </Card>

      {/* Research Progress */}
      {Object.keys(technology.researchProgress).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Research in Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(technology.researchProgress).map(([techId, progress]) => {
                const tech = technology.available.find(t => t.id === techId);
                if (!tech) return null;
                
                return (
                  <div key={techId} className="p-2 border rounded">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{tech.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {progress}/{tech.researchTime}
                      </span>
                    </div>
                    <Progress value={(progress / tech.researchTime) * 100} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Researched Technologies */}
      {technology.researched.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Researched Technologies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {technology.researched.map((tech, index) => (
                <motion.div
                  key={tech.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-2 border rounded bg-green-50 dark:bg-green-950"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{tech.name}</span>
                    <Badge variant="default" className="bg-green-500">
                      Researched
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedGameMechanics;
