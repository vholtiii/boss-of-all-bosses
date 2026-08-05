import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TurnReport } from '@/hooks/useEnhancedMafiaGameState';

type Phase = 'idle' | 'settling' | 'income' | 'territory' | 'done';

const PHRASES = [
  'The city settles…',
  'Accounts are tallied…',
  'The boroughs hold their breath…',
  'Ledgers close for the night…',
];

interface Props {
  open: boolean;
  report: TurnReport | null;
  onComplete: () => void;
  onSpawnIncome: (entries: Array<{ hex: string; amount: number }>) => void;
  onSpawnTerritory: (changes: Array<{ hex: string; change: 'gained' | 'lost'; to?: string }>) => void;
  playSound?: (type: string) => void;
}

const TurnResolutionOverlay: React.FC<Props> = ({
  open,
  report,
  onComplete,
  onSpawnIncome,
  onSpawnTerritory,
  playSound,
}) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [phrase] = useState(() => PHRASES[Math.floor(Math.random() * PHRASES.length)]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finishedRef = useRef(false);
  const spawnedIncomeRef = useRef(false);
  const spawnedTerritoryRef = useRef(false);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearTimers();
    setPhase('done');
    onComplete();
  };

  const skip = () => {
    // Fire only effects that haven't run yet
    if (report?.hexIncome?.length && !spawnedIncomeRef.current) {
      spawnedIncomeRef.current = true;
      onSpawnIncome(report.hexIncome);
    }
    if (report?.territoryChanges?.length && !spawnedTerritoryRef.current) {
      spawnedTerritoryRef.current = true;
      onSpawnTerritory(report.territoryChanges.map(c => ({
        hex: c.hex,
        change: c.change,
        to: c.to,
      })));
    }
    finish();
  };

  useEffect(() => {
    if (!open || !report) {
      setPhase('idle');
      finishedRef.current = false;
      spawnedIncomeRef.current = false;
      spawnedTerritoryRef.current = false;
      clearTimers();
      return;
    }

    finishedRef.current = false;
    spawnedIncomeRef.current = false;
    spawnedTerritoryRef.current = false;
    setPhase('settling');
    playSound?.('notification');

    const t1 = setTimeout(() => {
      setPhase('income');
      if (report.hexIncome?.length && !spawnedIncomeRef.current) {
        spawnedIncomeRef.current = true;
        onSpawnIncome(report.hexIncome);
        playSound?.('money');
      }
    }, 400);

    const t2 = setTimeout(() => {
      setPhase('territory');
      if (report.territoryChanges?.length && !spawnedTerritoryRef.current) {
        spawnedTerritoryRef.current = true;
        onSpawnTerritory(report.territoryChanges.map(c => ({
          hex: c.hex,
          change: c.change,
          to: c.to,
        })));
      }
    }, 1100);

    const t3 = setTimeout(() => {
      finish();
    }, 1700);

    timersRef.current = [t1, t2, t3];
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, report?.turn]);

  const visible = open && phase !== 'idle' && phase !== 'done';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={skip}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip(); }}
          aria-label="Skip turn resolution"
        >
          {/* Letterbox bars */}
          <motion.div
            className="absolute inset-x-0 top-0 h-[12%] bg-black/80"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 h-[12%] bg-black/80"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.3 }}
          />
          <div className="absolute inset-0 bg-black/35" />

          <motion.p
            className="relative z-10 font-courier italic text-lg md:text-xl text-[#E8D5A3] tracking-wide drop-shadow-lg"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
          >
            {phrase}
          </motion.p>
          <p className="relative z-10 mt-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">
            Click to skip
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TurnResolutionOverlay;
