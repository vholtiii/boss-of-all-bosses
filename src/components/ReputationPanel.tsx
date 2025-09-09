import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skull, Hand, Target, Shield, TrendingUp, Users, Crown, Zap } from 'lucide-react';
import { ReputationAction, ViolentAction } from '@/types/reputation';
import { cn } from '@/lib/utils';

interface ReputationPanelProps {
  reputation: {
    respect: number;
    reputation: number;
    loyalty: number;
    fear: number;
    streetInfluence: number;
  };
  violentActions: ViolentAction[];
  resources: {
    money: number;
    soldiers: number;
  };
  onReputationAction: (action: ReputationAction) => void;
}

const ReputationPanel: React.FC<ReputationPanelProps> = ({
  reputation,
  violentActions,
  resources,
  onReputationAction
}) => {
  const recentActions = violentActions.slice(-5); // Show last 5 actions

  const getReputationLevel = (value: number) => {
    if (value >= 80) return { level: 'Legendary', color: 'mafia-gold' };
    if (value >= 60) return { level: 'Feared', color: 'blood-red' };
    if (value >= 40) return { level: 'Respected', color: 'families-genovese' };
    if (value >= 20) return { level: 'Known', color: 'families-lucchese' };
    return { level: 'Nobody', color: 'muted-foreground' };
  };

  const violentActionTypes = [
    {
      id: 'beat_up_rival',
      label: 'Beat Up Rival Soldier',
      icon: Hand,
      cost: 1000,
      requiredSoldiers: 1,
      description: 'Send a message to rival families',
      action: {
        type: 'beat_up' as const,
        targetType: 'rival_soldier' as const,
        cost: 1000,
        requiredSoldiers: 1
      }
    },
    {
      id: 'execute_hit_rival',
      label: 'Execute Hit on Rival',
      icon: Target,
      cost: 5000,
      requiredSoldiers: 2,
      description: 'Eliminate a rival capo',
      action: {
        type: 'execute_hit' as const,
        targetType: 'rival_capo' as const,
        cost: 5000,
        requiredSoldiers: 2
      }
    },
    {
      id: 'assassinate_boss',
      label: 'Assassinate Rival Boss',
      icon: Skull,
      cost: 25000,
      requiredSoldiers: 5,
      description: 'Ultimate power move - high risk, high reward',
      action: {
        type: 'assassinate' as const,
        targetType: 'rival_boss' as const,
        cost: 25000,
        requiredSoldiers: 5
      }
    },
    {
      id: 'discipline_own',
      label: 'Discipline Own Soldier',
      icon: Shield,
      cost: 0,
      requiredSoldiers: 1,
      description: 'Maintain loyalty through fear (decreases loyalty, increases fear)',
      action: {
        type: 'beat_up' as const,
        targetType: 'own_soldier' as const,
        requiredSoldiers: 1
      }
    }
  ];

  return (
    <div className="space-y-4">
      <Card className="bg-noir-dark border-noir-light">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-mafia-gold">
            <Crown className="w-5 h-5" />
            Reputation & Fear
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reputation Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Respect
                </span>
                <Badge variant="outline" className={cn("text-xs", `text-${getReputationLevel(reputation.respect).color}`)}>
                  {getReputationLevel(reputation.respect).level}
                </Badge>
              </div>
              <Progress value={reputation.respect} className="h-2" />
              <span className="text-xs text-right block">{Math.round(reputation.respect)}/100</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Reputation
                </span>
                <Badge variant="outline" className={cn("text-xs", `text-${getReputationLevel(reputation.reputation).color}`)}>
                  {getReputationLevel(reputation.reputation).level}
                </Badge>
              </div>
              <Progress value={reputation.reputation} className="h-2" />
              <span className="text-xs text-right block">{Math.round(reputation.reputation)}/100</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Skull className="w-4 h-4" />
                  Fear
                </span>
                <Badge variant="outline" className={cn("text-xs", `text-${getReputationLevel(reputation.fear).color}`)}>
                  {getReputationLevel(reputation.fear).level}
                </Badge>
              </div>
              <Progress value={reputation.fear} className="h-2 bg-blood-red/20" />
              <span className="text-xs text-right block">{Math.round(reputation.fear)}/100</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Loyalty
                </span>
                <Badge variant="outline" className={cn("text-xs", reputation.loyalty > 70 ? "text-families-gambino" : reputation.loyalty > 40 ? "text-vintage-gold" : "text-blood-red")}>
                  {reputation.loyalty > 70 ? "Loyal" : reputation.loyalty > 40 ? "Uncertain" : "Disloyal"}
                </Badge>
              </div>
              <Progress value={reputation.loyalty} className="h-2" />
              <span className="text-xs text-right block">{Math.round(reputation.loyalty)}/100</span>
            </div>

            <div className="space-y-2 col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  Street Influence
                </span>
                <Badge variant="outline" className={cn("text-xs", `text-${getReputationLevel(reputation.streetInfluence).color}`)}>
                  {getReputationLevel(reputation.streetInfluence).level}
                </Badge>
              </div>
              <Progress value={reputation.streetInfluence} className="h-2" />
              <span className="text-xs text-right block">{Math.round(reputation.streetInfluence)}/100</span>
            </div>
          </div>

          <Separator className="bg-noir-light" />

          {/* Violent Actions */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-mafia-gold">Violent Actions</h4>
            <div className="grid grid-cols-1 gap-2">
              {violentActionTypes.map((actionType) => {
                const canAfford = resources.money >= (actionType.cost || 0);
                const hasEnoughSoldiers = resources.soldiers >= actionType.requiredSoldiers;
                const canPerform = canAfford && hasEnoughSoldiers;

                return (
                  <Button
                    key={actionType.id}
                    variant={canPerform ? "outline" : "ghost"}
                    size="sm"
                    className={cn(
                      "justify-start h-auto p-3 text-left",
                      canPerform 
                        ? "hover:bg-mafia-gold/10 hover:border-mafia-gold border-noir-light" 
                        : "opacity-50 cursor-not-allowed"
                    )}
                    disabled={!canPerform}
                    onClick={() => canPerform && onReputationAction(actionType.action)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <actionType.icon className="w-4 h-4 mt-0.5 text-mafia-gold" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{actionType.label}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {actionType.cost > 0 && (
                              <span className={canAfford ? "" : "text-blood-red"}>
                                ${actionType.cost.toLocaleString()}
                              </span>
                            )}
                            <span className={hasEnoughSoldiers ? "" : "text-blood-red"}>
                              {actionType.requiredSoldiers} soldiers
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{actionType.description}</p>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator className="bg-noir-light" />

          {/* Recent Actions History */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-mafia-gold">Recent Actions</h4>
            {recentActions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No recent violent actions</p>
            ) : (
              <div className="space-y-2">
                {recentActions.reverse().map((action) => (
                  <div
                    key={action.id}
                    className={cn(
                      "p-2 rounded border text-xs",
                      action.success 
                        ? "bg-families-gambino/10 border-families-gambino/30" 
                        : "bg-blood-red/10 border-blood-red/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {action.type === 'beating' ? '👊' : action.type === 'hit' ? '🎯' : '💀'} 
                        {action.type.toUpperCase()} - {action.target}
                      </span>
                      <Badge variant="outline" className={action.success ? "text-families-gambino" : "text-blood-red"}>
                        {action.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                    {action.success && (
                      <div className="mt-1 text-muted-foreground">
                        {action.consequences.fearChange > 0 && `Fear +${action.consequences.fearChange} `}
                        {action.consequences.respectChange > 0 && `Respect +${action.consequences.respectChange} `}
                        {action.consequences.respectChange < 0 && `Respect ${action.consequences.respectChange} `}
                        {action.consequences.loyaltyChange < 0 && `Loyalty ${action.consequences.loyaltyChange} `}
                        {action.consequences.streetInfluenceChange > 0 && `Street +${action.consequences.streetInfluenceChange}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReputationPanel;