import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Swords, Bomb, X, Target, AlertTriangle, ShieldCheck } from 'lucide-react';

interface EnemyHexActionProps {
  open: boolean;
  targetInfo: {
    district: string;
    controllingFamily: string;
    defendersCount: number;
    hasBusiness: boolean;
    businessType?: string;
    isLegal?: boolean;
    isScouted?: boolean;
  } | null;
  playerMoney: number;
  gamePhase: number;
  onAction: (action: 'hit' | 'sabotage' | 'cancel' | 'plan_hit') => void;
}

const SABOTAGE_COST = 12000;

const EnemyHexActionDialog: React.FC<EnemyHexActionProps> = ({ open, targetInfo, playerMoney, gamePhase, onAction }) => {
  if (!open || !targetInfo) return null;

  const canSabotage = targetInfo.hasBusiness && playerMoney >= SABOTAGE_COST;
  const canPlanHit = gamePhase >= 2 && targetInfo.isScouted;
  const familyName = targetInfo.controllingFamily.charAt(0).toUpperCase() + targetInfo.controllingFamily.slice(1);

  // Defender status message
  const getDefenderStatus = () => {
    if (targetInfo.defendersCount > 0) {
      return { icon: <Swords className="h-3.5 w-3.5 text-destructive" />, text: `${targetInfo.defendersCount} enemy soldier${targetInfo.defendersCount !== 1 ? 's' : ''} defending`, color: 'text-destructive' };
    }
    if (!targetInfo.isScouted) {
      return { icon: <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />, text: 'Unscouted — risk of civilian casualty', color: 'text-yellow-500' };
    }
    return { icon: <ShieldCheck className="h-3.5 w-3.5 text-green-500" />, text: 'No defenders — safe to seize', color: 'text-green-500' };
  };

  const defenderStatus = getDefenderStatus();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => onAction('cancel')}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border border-border rounded-lg shadow-2xl p-5 w-[380px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">⚔️ Enemy Territory</h3>
              <button onClick={() => onAction('cancel')} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-muted/50 rounded-md p-3 mb-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">District</span>
                <span className="text-foreground font-medium">{targetInfo.district}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Controlled by</span>
                <Badge variant="destructive" className="text-xs">{familyName}</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className={`flex items-center gap-1.5 ${defenderStatus.color}`}>
                  {defenderStatus.icon}
                  <span className="text-xs">{defenderStatus.text}</span>
                </span>
              </div>
              {targetInfo.hasBusiness && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Business</span>
                  <span className="text-foreground">{targetInfo.businessType || (targetInfo.isLegal ? 'Store Front' : 'Illegal Operation')}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              You've entered {familyName} territory. Choose an action or retreat.
            </p>

            <div className="space-y-2">
              <Button
                className="w-full justify-start gap-3"
                variant="destructive"
                onClick={() => onAction('hit')}
              >
                <Swords className="h-4 w-4" />
                <div className="text-left">
                  <div className="text-sm font-semibold">Hit Territory</div>
                  <div className="text-xs opacity-80">Combat for control · +10 heat</div>
                </div>
              </Button>

              {canPlanHit && (
                <Button
                  className="w-full justify-start gap-3"
                  variant="default"
                  onClick={() => onAction('plan_hit')}
                >
                  <Target className="h-4 w-4" />
                  <div className="text-left">
                    <div className="text-sm font-semibold">Plan Hit</div>
                    <div className="text-xs opacity-80">Surgical strike · +35% bonus · 0 casualties on success</div>
                  </div>
                </Button>
              )}

              <Button
                className="w-full justify-start gap-3"
                variant="outline"
                disabled={!canSabotage}
                onClick={() => onAction('sabotage')}
              >
                <Bomb className="h-4 w-4" />
                <div className="text-left">
                  <div className="text-sm font-semibold">Sabotage Business</div>
                  <div className="text-xs opacity-80">
                    {!targetInfo.hasBusiness
                      ? 'No business to sabotage'
                      : playerMoney < SABOTAGE_COST
                        ? `Need $${SABOTAGE_COST.toLocaleString()} (you have $${playerMoney.toLocaleString()})`
                        : `Cost: $${SABOTAGE_COST.toLocaleString()} · +15 heat`}
                  </div>
                </div>
              </Button>

              <Button
                className="w-full"
                variant="ghost"
                onClick={() => onAction('cancel')}
              >
                Retreat (return to previous position)
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnemyHexActionDialog;
