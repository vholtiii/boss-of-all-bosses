import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Heart, 
  Eye, 
  Star,
  TrendingUp,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  SoldierRecruitmentManager, 
  RecruitmentAction,
  generateRecruitmentEvent 
} from '@/systems/SoldierRecruitmentSystem';
import { EnhancedReputationSystem } from '@/types/enhanced-mechanics';

interface SoldierRecruitmentInterfaceProps {
  reputationSystem: EnhancedReputationSystem;
  playerMoney: number;
  onRecruitmentAction: (action: any) => void;
}

const SoldierRecruitmentInterface: React.FC<SoldierRecruitmentInterfaceProps> = ({
  reputationSystem,
  playerMoney,
  onRecruitmentAction
}) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showRecruitmentModal, setShowRecruitmentModal] = useState(false);

  const recruitmentManager = new SoldierRecruitmentManager(reputationSystem);
  const soldierStats = recruitmentManager.calculateTotalSoldiers();
  const recruitmentActions = recruitmentManager.getRecruitmentActions();
  const recommendations = recruitmentManager.getRecruitmentRecommendations();
  const maxSoldiers = recruitmentManager.getMaxPossibleSoldiers();
  const soldierQuality = recruitmentManager.getSoldierQuality();
  const maintenanceCost = recruitmentManager.calculateMaintenanceCost();
  const efficiency = recruitmentManager.getRecruitmentEfficiency();

  const handleRecruitmentAction = (action: RecruitmentAction) => {
    if (playerMoney >= action.cost) {
      onRecruitmentAction({
        type: action.type,
        cost: action.cost,
        effects: action.effects,
        time: action.time
      });
      setShowRecruitmentModal(true);
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'green': return 'text-green-600 bg-green-100';
      case 'experienced': return 'text-blue-600 bg-blue-100';
      case 'veteran': return 'text-purple-600 bg-purple-100';
      case 'elite': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Soldier Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Soldier Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 border rounded">
              <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{soldierStats.totalSoldiers}</p>
              <p className="text-sm text-muted-foreground">Total Soldiers</p>
              <p className="text-xs text-muted-foreground">Max: {maxSoldiers}</p>
            </div>
            <div className="text-center p-3 border rounded">
              <Heart className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold">{reputationSystem.loyalty}</p>
              <p className="text-sm text-muted-foreground">Loyalty</p>
              <p className="text-xs text-muted-foreground">+{soldierStats.loyaltyBonus} soldiers</p>
            </div>
            <div className="text-center p-3 border rounded">
              <Eye className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{reputationSystem.streetInfluence}</p>
              <p className="text-sm text-muted-foreground">Street Influence</p>
              <p className="text-xs text-muted-foreground">+{soldierStats.streetInfluenceBonus} soldiers</p>
            </div>
            <div className="text-center p-3 border rounded">
              <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">{reputationSystem.reputation}</p>
              <p className="text-sm text-muted-foreground">Reputation</p>
              <p className="text-xs text-muted-foreground">+{soldierStats.reputationBonus} soldiers</p>
            </div>
          </div>

          {/* Soldier Quality */}
          <div className="flex items-center justify-between p-3 border rounded mb-4">
            <div>
              <h4 className="font-semibold">Soldier Quality</h4>
              <p className="text-sm text-muted-foreground">Based on loyalty, influence, and reputation</p>
            </div>
            <Badge className={cn("px-3 py-1", getQualityColor(soldierQuality))}>
              {soldierQuality.toUpperCase()}
            </Badge>
          </div>

          {/* Progress to Next Soldier */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to Next Soldier</span>
              <span>{efficiency.toFixed(1)}% Efficiency</span>
            </div>
            <Progress value={efficiency} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Higher loyalty, street influence, and reputation = more soldiers
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recruitment Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-500" />
            Recruitment Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recruitmentActions.map((action, index) => {
              const canAfford = playerMoney >= action.cost;
              const meetsRequirements = 
                (!action.requirements.loyalty || reputationSystem.loyalty >= action.requirements.loyalty) &&
                (!action.requirements.streetInfluence || reputationSystem.streetInfluence >= action.requirements.streetInfluence) &&
                (!action.requirements.reputation || reputationSystem.reputation >= action.requirements.reputation) &&
                (!action.requirements.soldiers || soldierStats.totalSoldiers >= action.requirements.soldiers);

              return (
                <motion.div
                  key={action.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-4 border rounded transition-all",
                    selectedAction === action.type 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
                      : "hover:border-gray-300",
                    (!canAfford || !meetsRequirements) && "opacity-50"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold capitalize">
                      {action.type.replace('_', ' ')}
                    </h4>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {action.time} turn{action.time > 1 ? 's' : ''}
                      </Badge>
                      {!canAfford && <Badge variant="destructive">Insufficient Funds</Badge>}
                      {!meetsRequirements && <Badge variant="destructive">Requirements Not Met</Badge>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground">Cost:</p>
                      <p className="font-semibold">${action.cost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Effects:</p>
                      <div className="space-y-1">
                        {action.effects.soldiers && (
                          <p className="text-green-600">+{action.effects.soldiers} soldiers</p>
                        )}
                        {action.effects.loyalty && (
                          <p className={action.effects.loyalty > 0 ? "text-green-600" : "text-red-600"}>
                            {action.effects.loyalty > 0 ? '+' : ''}{action.effects.loyalty} loyalty
                          </p>
                        )}
                        {action.effects.streetInfluence && (
                          <p className={action.effects.streetInfluence > 0 ? "text-green-600" : "text-red-600"}>
                            {action.effects.streetInfluence > 0 ? '+' : ''}{action.effects.streetInfluence} street influence
                          </p>
                        )}
                        {action.effects.reputation && (
                          <p className="text-green-600">+{action.effects.reputation} reputation</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {action.requirements && (
                    <div className="mb-3">
                      <p className="text-sm text-muted-foreground mb-1">Requirements:</p>
                      <div className="flex flex-wrap gap-1">
                        {action.requirements.loyalty && (
                          <Badge variant={reputationSystem.loyalty >= action.requirements.loyalty ? "default" : "destructive"}>
                            {reputationSystem.loyalty}/{action.requirements.loyalty} Loyalty
                          </Badge>
                        )}
                        {action.requirements.streetInfluence && (
                          <Badge variant={reputationSystem.streetInfluence >= action.requirements.streetInfluence ? "default" : "destructive"}>
                            {reputationSystem.streetInfluence}/{action.requirements.streetInfluence} Street Influence
                          </Badge>
                        )}
                        {action.requirements.reputation && (
                          <Badge variant={reputationSystem.reputation >= action.requirements.reputation ? "default" : "destructive"}>
                            {reputationSystem.reputation}/{action.requirements.reputation} Reputation
                          </Badge>
                        )}
                        {action.requirements.soldiers && (
                          <Badge variant={soldierStats.totalSoldiers >= action.requirements.soldiers ? "default" : "destructive"}>
                            {soldierStats.totalSoldiers}/{action.requirements.soldiers} Soldiers
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!canAfford || !meetsRequirements}
                    onClick={() => handleRecruitmentAction(action)}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Execute Action
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Recruitment Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recommendations.map((recommendation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-2 p-2 border rounded"
              >
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{recommendation}</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Cost */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-500" />
            Maintenance & Costs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 border rounded">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <p className="text-xl font-bold">${maintenanceCost.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Monthly Maintenance</p>
              <p className="text-xs text-muted-foreground">${(maintenanceCost / soldierStats.totalSoldiers).toLocaleString()} per soldier</p>
            </div>
            <div className="text-center p-3 border rounded">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <p className="text-xl font-bold">${soldierStats.recruitmentCost.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Next Recruitment Cost</p>
              <p className="text-xs text-muted-foreground">{soldierStats.recruitmentTime} turn{soldierStats.recruitmentTime > 1 ? 's' : ''} to recruit</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recruitment Success Modal */}
      <AnimatePresence>
        {showRecruitmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRecruitmentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-background border rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Recruitment Successful!</h2>
                <p className="text-muted-foreground mb-4">
                  Your organization is growing stronger. New recruits are being trained.
                </p>
                <Button 
                  className="w-full"
                  onClick={() => setShowRecruitmentModal(false)}
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SoldierRecruitmentInterface;
