import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FAMILY_COLORS } from '@/lib/period-theme';

const familyColors: Record<string, string> = FAMILY_COLORS;

/* Mugshot-style portrait: height-chart lines behind the subject, framed with
   photo corners like a police dossier photograph. */
const UnitPortrait: React.FC<{ family: string; type: 'soldier' | 'capo' }> = ({ family, type }) => (
  <div className="photo-corners shrink-0">
    <div
      className="w-10 h-11 flex items-center justify-center text-lg border"
      style={{
        borderColor: familyColors[family] || '#555',
        background: `repeating-linear-gradient(0deg, #C9BCA2, #C9BCA2 5px, #BEB097 5px, #BEB097 6px)`,
        filter: 'sepia(0.3)',
      }}
    >
      {type === 'capo' ? '👔' : '👤'}
    </div>
  </div>
);

interface SelectedUnitDockProps {
  gameState: any;
  playerFamily: string;
  onClearSelection?: () => void;
  onAction?: (action: any) => void;
}

/**
 * Floating dock that surfaces the currently selected unit (or deploy mode preview)
 * with portrait, name, key stats and quick context. Sits at bottom-left of the map,
 * sibling to the hex info card.
 */
const SelectedUnitDock: React.FC<SelectedUnitDockProps> = ({
  gameState,
  playerFamily,
  onClearSelection,
}) => {
  const deployMode = gameState?.deployMode;
  const selectedUnitId: string | undefined = gameState?.selectedUnitId;
  const unit = selectedUnitId
    ? (gameState?.deployedUnits || []).find((u: any) => u.id === selectedUnitId)
    : null;

  const show = !!(unit || deployMode);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="selected-unit-dock"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="case-file absolute bottom-4 left-4 z-30 rounded-sm px-3 py-2 shadow-lg min-w-[240px] max-w-[320px] font-courier"
          style={{ marginBottom: 'calc(var(--hex-card-h, 0px))' }}
        >
          {deployMode ? (
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                {deployMode.unitType === 'capo' ? (
                  <UnitPortrait family={deployMode ? playerFamily : unit.family} type="capo" />
                ) : (
                  <UnitPortrait family={deployMode ? playerFamily : unit.family} type="soldier" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-mafia-gold/80">Deploying</p>
                <p className="text-sm font-semibold truncate">
                  {deployMode.unitType === 'capo' ? '👔 Capo' : '👤 Soldier'}
                </p>
                <p className="text-[11px] text-muted-foreground">Click a highlighted hex to place</p>
              </div>
              {onClearSelection && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px]"
                  onClick={(e) => { e.stopPropagation(); onClearSelection(); }}
                >
                  ✕
                </Button>
              )}
            </div>
          ) : unit ? (() => {
            const isCapo = unit.type === 'capo';
            const stats = !isCapo ? gameState?.soldierStats?.[unit.id] : null;
            const wounded = isCapo && (unit.woundedTurnsRemaining ?? 0) > 0;
            const phaseHint = gameState?.turnPhase === 'action'
              ? 'Click a highlighted hex to act'
              : gameState?.turnPhase === 'move'
                ? `${unit.movesRemaining ?? 0} moves left`
                : 'Tactical phase';

            return (
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  {isCapo ? (
                    <UnitPortrait family={deployMode ? playerFamily : unit.family} type="capo" />
                  ) : (
                    <UnitPortrait family={deployMode ? playerFamily : unit.family} type="soldier" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="ink-stamp text-[7px]">Dossier</span>
                    <p className="text-sm font-semibold truncate">
                      {isCapo ? `👔 ${unit.name || 'Capo'}` : '👤 Soldier'}
                    </p>
                    {isCapo && unit.level != null && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded border border-mafia-gold/40 text-mafia-gold">
                        Lvl {unit.level}
                      </span>
                    )}
                    {wounded && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-900/40 border border-red-500/40 text-red-300">
                        Wounded {unit.woundedTurnsRemaining}t
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{phaseHint}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[11px]">
                    <span><span className="text-muted-foreground">Moves:</span> {unit.movesRemaining ?? 0}</span>
                    {stats && (
                      <>
                        <span><span className="text-muted-foreground">Tough:</span> {stats.toughness ?? 0}</span>
                        <span className={cn(
                          (stats.loyalty ?? 0) < 40 ? 'text-red-400' :
                          (stats.loyalty ?? 0) < 60 ? 'text-amber-300' : 'text-emerald-300'
                        )}>
                          <span className="text-muted-foreground">Loy:</span> {stats.loyalty ?? 0}
                        </span>
                      </>
                    )}
                    {isCapo && unit.personality && (
                      <span className="text-muted-foreground">
                        {unit.personality === 'diplomat' ? '🕊️ Diplomat' : unit.personality === 'enforcer' ? '💪 Enforcer' : '🧠 Strategist'}
                      </span>
                    )}
                  </div>
                </div>
                {onClearSelection && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[10px] shrink-0"
                    onClick={(e) => { e.stopPropagation(); onClearSelection(); }}
                    title="Deselect"
                  >
                    ✕
                  </Button>
                )}
              </div>
            );
          })() : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SelectedUnitDock;
