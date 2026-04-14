import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  NegotiationType, NegotiationConfig, NEGOTIATION_TYPES, PERSONALITY_BONUSES, PERSONALITY_LABELS,
  CapoPersonality, AllianceCondition, NegotiationScope, NEGOTIATION_REFUND_RATE,
} from '@/types/game-mechanics';

interface NegotiationDialogProps {
  open: boolean;
  onClose: () => void;
  onNegotiate: (type: NegotiationType, extraData?: any) => void;
  scope: NegotiationScope;
  capoName?: string;
  capoPersonality?: CapoPersonality;
  enemyFamily: string;
  playerReputation: number;
  playerFear?: number;
  playerMoney: number;
  enemyStrength: number;
  hexIncome: number;
  negotiationUsedThisTurn: boolean;
  treacheryTurnsRemaining?: number;
  // For boss negotiation — choose target family
  availableEnemyFamilies?: string[];
  onSelectTargetFamily?: (family: string) => void;
  successBonus?: number;
}

const NegotiationDialog: React.FC<NegotiationDialogProps> = ({
  open, onClose, onNegotiate, scope, capoName, capoPersonality,
  enemyFamily, playerReputation, playerFear, playerMoney, enemyStrength, hexIncome,
  negotiationUsedThisTurn, treacheryTurnsRemaining, availableEnemyFamilies, onSelectTargetFamily,
  successBonus = 0,
}) => {
  const [selectedType, setSelectedType] = useState<NegotiationType | null>(null);
  const [rolling, setRolling] = useState(false);
  const [rollResult, setRollResult] = useState<{ success: boolean; roll: number; needed: number } | null>(null);
  const [displayNumber, setDisplayNumber] = useState(50);
  const [allianceCondition, setAllianceCondition] = useState<AllianceCondition['type']>('no_attack_family');
  const [selectedTargetFamily, setSelectedTargetFamily] = useState<string>(enemyFamily);

  const personality = capoPersonality || 'diplomat';
  const personalityInfo = PERSONALITY_LABELS[personality];
  const personalityBonuses = PERSONALITY_BONUSES[personality];

  // Filter negotiation types by scope
  const filteredTypes = NEGOTIATION_TYPES.filter(n => n.scope === scope);

  const getSuccessChance = useCallback((type: NegotiationType) => {
    const config = NEGOTIATION_TYPES.find(n => n.type === type)!;
    let chance = config.baseSuccess;
    if (scope === 'territory') {
      chance += personalityBonuses[type] || 0;
      chance += personalityBonuses.all || 0;
    }
    chance += Math.floor(playerReputation / 5);
    if (type === 'supply_deal') {
      chance += Math.floor((playerFear || 0) / 5);
    }
    if (type === 'bribe_territory') chance -= enemyStrength * 5;
    chance += successBonus;
    return Math.max(5, Math.min(95, chance));
  }, [personalityBonuses, playerReputation, playerFear, enemyStrength, scope, successBonus]);

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
    const extraData: any = {};
    if (selectedType === 'alliance') {
      extraData.condition = { type: allianceCondition, target: selectedTargetFamily, violated: false };
    }
    // Always call onNegotiate — backend handles success/failure
    onNegotiate(selectedType, extraData);
    onClose();
  }, [rollResult, selectedType, allianceCondition, selectedTargetFamily, onNegotiate, onClose]);

  useEffect(() => {
    if (open) {
      setSelectedType(null);
      setRolling(false);
      setRollResult(null);
      setDisplayNumber(50);
      setSelectedTargetFamily(enemyFamily);
    }
  }, [open, enemyFamily]);

  const scopeLabel = scope === 'family' ? '🏛️ Boss Diplomacy' : '📍 Capo Negotiation';
  const targetName = selectedTargetFamily.charAt(0).toUpperCase() + selectedTargetFamily.slice(1);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-noir-dark/95 border-primary/30 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-mafia-gold font-playfair text-xl">
            {scope === 'family' ? '🏛️ Boss Diplomacy' : '🤝 Negotiate'} — {targetName} Territory
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {scope === 'territory' && capoName && (
              <>
                <span className="font-semibold text-foreground">{capoName}</span>{' '}
                <Badge variant="outline" className="text-xs ml-1">
                  {personalityInfo.icon} {personalityInfo.label}
                </Badge>
              </>
            )}
            {scope === 'family' && (
              <span className="text-foreground">The Boss sends word from Headquarters</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Cooldown notice */}
        {negotiationUsedThisTurn && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center">
            <p className="text-sm font-semibold text-destructive">⏳ Negotiation on Cooldown</p>
            <p className="text-xs text-muted-foreground mt-1">
              {scope === 'family' ? 'The Boss must wait another turn before negotiating again.' : 'Capos must wait another turn before negotiating again.'}
            </p>
          </div>
        )}

        {/* Treachery debuff warning */}
        {(treacheryTurnsRemaining || 0) > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center">
            <p className="text-sm font-semibold text-destructive">🗡️ Treachery Debuff Active</p>
            <p className="text-xs text-muted-foreground mt-1">
              -20% negotiation success for {treacheryTurnsRemaining} more turn{treacheryTurnsRemaining === 1 ? '' : 's'}. Other families don't trust you.
            </p>
          </div>
        )}

        {/* Boss family selector */}
        {scope === 'family' && availableEnemyFamilies && availableEnemyFamilies.length > 1 && !selectedType && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Target Family:</p>
            <div className="flex gap-2">
              {availableEnemyFamilies.map(fam => (
                <Button
                  key={fam}
                  size="sm"
                  variant={selectedTargetFamily === fam ? 'default' : 'outline'}
                  onClick={() => setSelectedTargetFamily(fam)}
                  className="text-xs capitalize"
                >
                  {fam}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Negotiation options */}
        {!selectedType && !negotiationUsedThisTurn && (
          <div className="space-y-2 mt-2">
            {filteredTypes.map(config => {
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
                    <span className="font-bold text-sm">
                      {config.icon} {config.label}
                      <Badge variant="outline" className="text-[9px] ml-2 h-4">
                        {config.scope === 'family' ? '🏛️ Family' : '📍 Territory'}
                      </Badge>
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{chance}% chance</Badge>
                      <Badge variant="outline" className="text-xs text-green-400">${cost.toLocaleString()}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic">
                    50% refund on failure
                  </p>
                  {scope === 'territory' && personalityBonuses[config.type] > 0 && (
                    <p className="text-xs text-primary mt-1">
                      {personalityInfo.icon} +{personalityBonuses[config.type]}% from {personalityInfo.label}
                    </p>
                   )}
                  {successBonus > 0 && (
                    <p className="text-xs text-primary mt-1">
                      📩 +{successBonus}% — they requested this sitdown
                    </p>
                  )}
                  {config.type === 'supply_deal' && (playerFear || 0) > 0 && (
                    <p className="text-xs text-red-400 mt-1">
                      😈 +{Math.floor((playerFear || 0) / 5)}% from Fear ({playerFear})
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
              { type: 'no_attack_family' as const, label: `Don't attack ${targetName}`, icon: '🛡️' },
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
                  <p className="text-xs text-amber-400/80">
                    50% of your payment will be refunded.
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
