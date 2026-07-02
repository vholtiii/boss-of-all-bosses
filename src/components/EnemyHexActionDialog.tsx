import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Swords, Bomb, X, Target, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { SABOTAGE_COST } from '@/types/game-mechanics';
import type { ActionPreview } from '@/lib/action-previews';
import ActionPreviewCard from '@/components/ActionPreviewCard';
import { cn } from '@/lib/utils';

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
    /** True when this hex matches an active plannedHit (target still on original hex). */
    planMatchesHere?: boolean;
    /** True when an active plannedHit exists but the target has relocated to this hex. */
    planRelocatedHere?: boolean;
    /** Turns remaining before plannedHit expires. */
    planTurnsRemaining?: number;
  } | null;
  playerMoney: number;
  gamePhase: number;
  /** Live consequence previews (shared math with the executors). */
  hitPreview?: ActionPreview | null;
  pushOutPreview?: ActionPreview | null;
  sabotagePreview?: ActionPreview | null;
  onAction: (action: 'hit' | 'sabotage' | 'cancel' | 'plan_hit' | 'push_out') => void;
}

const chanceColor = (c: number): string =>
  c >= 0.7 ? 'text-green-400' : c >= 0.45 ? 'text-yellow-400' : 'text-red-400';

/** Action button with an optional chance badge + expandable consequence preview. */
const PreviewableAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  variant?: 'default' | 'destructive' | 'outline';
  disabled?: boolean;
  preview?: ActionPreview | null;
  expanded: boolean;
  onToggleExpand: () => void;
  onClick: () => void;
}> = ({ icon, label, sublabel, variant = 'destructive', disabled, preview, expanded, onToggleExpand, onClick }) => (
  <div className="space-y-1">
    <div className="flex items-stretch gap-1">
      <Button
        className="flex-1 justify-start gap-3 h-auto py-2"
        variant={variant}
        disabled={disabled}
        onClick={onClick}
      >
        {icon}
        <div className="text-left flex-1">
          <div className="text-sm font-semibold flex items-center justify-between gap-2">
            <span>{label}</span>
            {preview?.valid && typeof preview.successChance === 'number' && (
              <span className={cn('text-sm font-bold tabular-nums', chanceColor(preview.successChance))}>
                {Math.round(preview.successChance * 100)}%
              </span>
            )}
          </div>
          <div className="text-xs opacity-80">{sublabel}</div>
        </div>
      </Button>
      {preview && (
        <button
          onClick={onToggleExpand}
          className="px-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title={expanded ? 'Hide consequences' : 'Show consequences'}
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
    {expanded && preview && <ActionPreviewCard preview={preview} compact />}
  </div>
);

const EnemyHexActionDialog: React.FC<EnemyHexActionProps> = ({
  open, targetInfo, playerMoney, gamePhase,
  hitPreview, pushOutPreview, sabotagePreview,
  onAction,
}) => {
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  if (!open || !targetInfo) return null;

  const canSabotage = targetInfo.hasBusiness && playerMoney >= SABOTAGE_COST;
  // "Plan Hit" is now a two-turn flow: MARK in Tactical step, EXECUTE in Action step.
  // The dialog only surfaces the EXECUTE option when a plannedHit already exists for this hex.
  const canExecutePlan = !!(targetInfo.planMatchesHere || targetInfo.planRelocatedHere);
  const familyName = targetInfo.controllingFamily.charAt(0).toUpperCase() + targetInfo.controllingFamily.slice(1);

  const toggle = (key: string) => setExpandedAction(prev => (prev === key ? null : key));

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
            className="bg-card border border-border rounded-lg shadow-2xl p-5 w-[400px] max-h-[85vh] overflow-y-auto"
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
              You've entered {familyName} territory. Choose an action or retreat. Click <ChevronDown className="h-3 w-3 inline" /> for full consequences.
            </p>

            <div className="space-y-2">
              {canExecutePlan && (
                <PreviewableAction
                  icon={<Target className="h-4 w-4" />}
                  label={targetInfo.planMatchesHere ? 'Execute Plan Hit' : 'Execute Plan Hit (Relocated)'}
                  sublabel={`${targetInfo.planMatchesHere
                    ? '+20% bonus · 0 casualties on success'
                    : '+10% bonus · +5 heat · cooldown'}${typeof targetInfo.planTurnsRemaining === 'number' ? ` · ${targetInfo.planTurnsRemaining}t left` : ''}`}
                  variant="default"
                  preview={hitPreview}
                  expanded={expandedAction === 'plan_hit'}
                  onToggleExpand={() => toggle('plan_hit')}
                  onClick={() => onAction('plan_hit')}
                />
              )}

              {!targetInfo.hasBusiness ? (
                <PreviewableAction
                  icon={<Swords className="h-4 w-4" />}
                  label="👊 Push Out"
                  sublabel={targetInfo.defendersCount > 0
                    ? `Light combat${targetInfo.isScouted ? '' : ' · unknown defenders'}`
                    : 'Auto-success · no civilian risk'}
                  preview={pushOutPreview}
                  expanded={expandedAction === 'push_out'}
                  onToggleExpand={() => toggle('push_out')}
                  onClick={() => onAction('push_out')}
                />
              ) : (
                <PreviewableAction
                  icon={<Swords className="h-4 w-4" />}
                  label="Hit Territory"
                  sublabel="Combat for control · heat scales with combatants"
                  preview={hitPreview}
                  expanded={expandedAction === 'hit'}
                  onToggleExpand={() => toggle('hit')}
                  onClick={() => onAction('hit')}
                />
              )}

              <PreviewableAction
                icon={<Bomb className="h-4 w-4" />}
                label="Sabotage Business"
                sublabel={!targetInfo.hasBusiness
                  ? 'No business to sabotage'
                  : playerMoney < SABOTAGE_COST
                    ? `Need $${SABOTAGE_COST.toLocaleString()} (you have $${playerMoney.toLocaleString()})`
                    : `Cost: $${SABOTAGE_COST.toLocaleString()}`}
                variant="outline"
                disabled={!canSabotage}
                preview={targetInfo.hasBusiness ? sabotagePreview : null}
                expanded={expandedAction === 'sabotage'}
                onToggleExpand={() => toggle('sabotage')}
                onClick={() => onAction('sabotage')}
              />

              {!canExecutePlan && gamePhase >= 2 && targetInfo.isScouted && (
                <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground flex items-start gap-2">
                  <Target className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 opacity-70" />
                  <span>
                    To Plan Hit this target, mark it in the <strong className="text-foreground">Tactical step</strong>, then execute next turn's Action.
                  </span>
                </div>
              )}

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
