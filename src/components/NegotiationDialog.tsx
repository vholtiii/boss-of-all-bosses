import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  NegotiationType, NegotiationConfig, NEGOTIATION_TYPES, PERSONALITY_BONUSES, PERSONALITY_LABELS,
  CapoPersonality, AllianceCondition,
} from '@/types/game-mechanics';

interface NegotiationDialogProps {
  open: boolean;
  onClose: () => void;
  onNegotiate: (type: NegotiationType, extraData?: any) => void;
  capoName: string;
  capoPersonality: CapoPersonality;
  enemyFamily: string;
  playerReputation: number;
  playerMoney: number;
  enemyStrength: number; // number of enemy units on hex
  hexIncome: number;
}

const NegotiationDialog: React.FC<NegotiationDialogProps> = ({
  open, onClose, onNegotiate, capoName, capoPersonality, enemyFamily,
  playerReputation, playerMoney, enemyStrength, hexIncome,
}) => {
  const [selectedType, setSelectedType] = useState<NegotiationType | null>(null);
  const [rolling, setRolling] = useState(false);
  const [rollResult, setRollResult] = useState<{ success: boolean; roll: number; needed: number } | null>(null);
  const [displayNumber, setDisplayNumber] = useState(50);
  const [allianceCondition, setAllianceCondition] = useState<AllianceCondition['type']>('no_attack_family');

  const personalityInfo = PERSONALITY_LABELS[capoPersonality];
  const personalityBonuses = PERSONALITY_BONUSES[capoPersonality];

  const getSuccessChance = useCallback((type: NegotiationType) => {
    const config = NEGOTIATION_TYPES.find(n => n.type === type)!;
    let chance = config.baseSuccess;
    chance += personalityBonuses[type] || 0;
    chance += personalityBonuses.all || 0;
    chance += Math.floor(playerReputation / 5);
    if (type === 'bribe_territory') chance -= enemyStrength * 5;
    return Math.max(5, Math.min(95, chance));
  }, [personalityBonuses, playerReputation, enemyStrength]);

  const getCost = useCallback((type: NegotiationType) => {
    const config = NEGOTIATION_TYPES.find(n => n.type === type)!;
    let cost = config.baseCost;
    if (type === 'bribe_territory') {
      cost += enemyStrength * 2000 + hexIncome;
    }
    return cost;
  }, [enemyStrength, hexIncome]);

  const handleRoll = useCallback((type: NegotiationType) => {
    const chance = getSuccessChance(type);
    setSelectedType(type);
    setRolling(true);
    setRollResult(null);

    // Animate rolling numbers
    let count = 0;
    const interval = setInterval(() => {
      setDisplayNumber(Math.floor(Math.random() * 100) + 1);
      count++;
      if (count > 15) {
        clearInterval(interval);
        const roll = Math.floor(Math.random() * 100) + 1;
        setDisplayNumber(roll);
        setRolling(false);
        setRollResult({ success: roll <= chance, roll, needed: chance });
      }
    }, 80);
  }, [getSuccessChance]);

  const handleConfirm = useCallback(() => {
    if (!rollResult || !selectedType) return;
    if (rollResult.success) {
      const extraData: any = {};
      if (selectedType === 'alliance') {
        extraData.condition = { type: allianceCondition, target: enemyFamily, violated: false };
      }
      onNegotiate(selectedType, extraData);
    }
    onClose();
  }, [rollResult, selectedType, allianceCondition, enemyFamily, onNegotiate, onClose]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedType(null);
      setRolling(false);
      setRollResult(null);
      setDisplayNumber(50);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-noir-dark/95 border-primary/30 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-mafia-gold font-playfair text-xl">
            🤝 Negotiate — {enemyFamily.charAt(0).toUpperCase() + enemyFamily.slice(1)} Territory
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            <span className="font-semibold text-foreground">{capoName}</span>{' '}
            <Badge variant="outline" className="text-xs ml-1">
              {personalityInfo.icon} {personalityInfo.label}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        {/* Negotiation options */}
        {!selectedType && (
          <div className="space-y-2 mt-2">
            {NEGOTIATION_TYPES.map(config => {
              const chance = getSuccessChance(config.type);
              const cost = getCost(config.type);
              const canAfford = playerMoney >= cost;
              return (
                <motion.button
                  key={config.type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (config.type === 'alliance') {
                      setSelectedType('alliance');
                    } else {
                      handleRoll(config.type);
                    }
                  }}
                  disabled={!canAfford}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    canAfford
                      ? 'border-primary/30 hover:border-primary/60 bg-background/50 hover:bg-background/80'
                      : 'border-muted/20 bg-muted/10 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{config.icon} {config.label}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{chance}% chance</Badge>
                      <Badge variant="outline" className="text-xs text-green-400">${cost.toLocaleString()}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
                  {personalityBonuses[config.type] > 0 && (
                    <p className="text-xs text-primary mt-1">
                      {personalityInfo.icon} +{personalityBonuses[config.type]}% from {personalityInfo.label}
                    </p>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Alliance condition picker */}
        {selectedType === 'alliance' && !rolling && !rollResult && (
          <div className="space-y-3 mt-2">
            <p className="text-sm font-semibold">Choose a condition for the pact:</p>
            {([
              { type: 'no_attack_family' as const, label: `Don't attack ${enemyFamily}`, icon: '🛡️' },
              { type: 'no_expand_district' as const, label: `Don't expand into their district`, icon: '🚫' },
              { type: 'share_income' as const, label: 'Share border income (10%)', icon: '💰' },
            ]).map(cond => (
              <button
                key={cond.type}
                onClick={() => setAllianceCondition(cond.type)}
                className={`w-full text-left p-2.5 rounded-lg border text-sm transition-colors ${
                  allianceCondition === cond.type
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted/30 hover:border-muted/50'
                }`}
              >
                {cond.icon} {cond.label}
              </button>
            ))}
            <Button onClick={() => handleRoll('alliance')} className="w-full mt-2">
              Roll for Alliance ({getSuccessChance('alliance')}% chance)
            </Button>
          </div>
        )}

        {/* Dice roll animation */}
        {(rolling || rollResult) && selectedType && (
          <div className="flex flex-col items-center py-6 space-y-4">
            <motion.div
              className={`w-24 h-24 rounded-xl flex items-center justify-center text-4xl font-bold border-2 ${
                rollResult
                  ? rollResult.success
                    ? 'border-green-500 bg-green-500/10 text-green-400'
                    : 'border-red-500 bg-red-500/10 text-red-400'
                  : 'border-primary/50 bg-primary/5 text-foreground'
              }`}
              animate={rolling ? { rotateY: [0, 180, 360] } : {}}
              transition={rolling ? { duration: 0.3, repeat: Infinity } : {}}
            >
              {displayNumber}
            </motion.div>

            {rollResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-2"
              >
                <p className={`text-lg font-bold ${rollResult.success ? 'text-green-400' : 'text-red-400'}`}>
                  {rollResult.success ? '✅ NEGOTIATION SUCCESSFUL!' : '❌ NEGOTIATION FAILED!'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Rolled {rollResult.roll} — needed ≤{rollResult.needed}
                </p>
                {!rollResult.success && (
                  <p className="text-xs text-red-400/80">
                    The {enemyFamily} family rejected your offer. Your Capo may be expelled.
                  </p>
                )}
                <Button onClick={handleConfirm} className="mt-3">
                  {rollResult.success ? 'Accept Deal' : 'Retreat'}
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NegotiationDialog;
