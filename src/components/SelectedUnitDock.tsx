import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const familyColors: Record<string, string> = {
  gambino: '#42D3F2',
  genovese: '#2AA63E',
  lucchese: '#4169E1',
  bonanno: '#DC143C',
  colombo: '#8A2BE2',
};

const UnitPortrait: React.FC<{ family: string; type: 'soldier' | 'capo' }> = ({ family, type }) => (
  <div
    className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 shrink-0"
    style={{
      backgroundColor: `${familyColors[family] || '#555'}33`,
      borderColor: familyColors[family] || '#555',
    }}
  >
    {type === 'capo' ? '👔' : '👤'}
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
          className="absolute bottom-4 left-4 z-30 bg-noir-dark/95 backdrop-blur-sm border border-mafia-gold/40 rounded-lg px-3 py-2 text-white shadow-lg min-w-[240px] max-w-[320px]"
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
