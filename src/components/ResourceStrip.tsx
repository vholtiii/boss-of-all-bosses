import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface ResourceValues {
  money: number;
  soldiers: number;
  respect: number;
  influence: number;
  politicalPower: number;
  heat: number;
}

interface Props {
  turn: number;
  values: ResourceValues;
  /** Optional projected income for the current turn (for the money tooltip). */
  lastTurnIncome?: number;
}

const ITEMS: Array<{
  key: keyof ResourceValues;
  label: string;
  prefix?: string;
  suffix?: string;
  icon: string;
  color: string;
  /** When true, a positive delta is bad (e.g. heat). */
  invertGood?: boolean;
  tooltip: string;
}> = [
  { key: 'money',          label: 'Money',     prefix: '$', icon: '💵', color: 'text-green-400',  tooltip: 'Cash on hand. Spent on recruitment, bribes, upkeep.' },
  { key: 'soldiers',       label: 'Reserve',                icon: '👤', color: 'text-rose-300',   tooltip: 'Soldiers in your barracks, available to deploy.' },
  { key: 'respect',        label: 'Respect',   suffix: '%', icon: '⭐', color: 'text-blue-300',   tooltip: 'How feared you are. Drives diplomacy and AI behaviour.' },
  { key: 'influence',      label: 'Influence',              icon: '📈', color: 'text-amber-300',  tooltip: 'Long-term power. Built businesses, alliances, control.' },
  { key: 'politicalPower', label: 'Politics',               icon: '🏛️', color: 'text-purple-300', tooltip: 'Political pull from bribes & favours.' },
  { key: 'heat',           label: 'Heat',      suffix: '/100', icon: '🚨', color: 'text-orange-400', invertGood: true, tooltip: 'Police pressure. ≥80 spawns RICO timer.' },
];

const formatVal = (key: keyof ResourceValues, v: number) => {
  if (key === 'money') return v.toLocaleString();
  return String(Math.round(v));
};

const formatDelta = (key: keyof ResourceValues, d: number) => {
  const sign = d > 0 ? '+' : '−';
  const mag = Math.abs(d);
  if (key === 'money') return `${sign}$${mag.toLocaleString()}`;
  return `${sign}${mag}`;
};

const ResourceStrip: React.FC<Props> = ({ turn, values, lastTurnIncome }) => {
  // Snapshot of values from the previous turn, used to compute deltas shown on
  // the strip. We update it whenever the turn number changes.
  const [prev, setPrev] = useState<ResourceValues>(values);
  const lastTurnRef = useRef(turn);
  // Pulse state per-key so a fresh delta briefly highlights, then settles.
  const [pulseKey, setPulseKey] = useState<string>('');

  useEffect(() => {
    if (turn !== lastTurnRef.current) {
      lastTurnRef.current = turn;
      setPrev(values);
      setPulseKey(`t${turn}`);
      const t = setTimeout(() => setPulseKey(''), 1600);
      return () => clearTimeout(t);
    }
    // We intentionally don't update prev mid-turn — deltas reflect changes
    // since the start of the current turn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn]);

  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-background/40 border border-noir-light/60 backdrop-blur-sm">
      {ITEMS.map((item, i) => {
        const v = values[item.key] ?? 0;
        const p = prev[item.key] ?? v;
        const d = v - p;
        const goodDirection = item.invertGood ? d < 0 : d > 0;
        const deltaColor =
          d === 0
            ? 'text-muted-foreground/50'
            : goodDirection
              ? 'text-emerald-400'
              : 'text-rose-400';
        const tooltip = item.key === 'money' && typeof lastTurnIncome === 'number'
          ? `${item.tooltip} Last turn net: ${lastTurnIncome >= 0 ? '+' : '−'}$${Math.abs(lastTurnIncome).toLocaleString()}.`
          : item.tooltip;

        return (
          <React.Fragment key={item.key}>
            {i > 0 && <span className="text-muted-foreground/30 select-none">·</span>}
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'flex items-baseline gap-1 px-1.5 py-0.5 rounded-md transition-colors',
                    'hover:bg-foreground/5 cursor-default'
                  )}
                  aria-label={`${item.label}: ${formatVal(item.key, v)}`}
                >
                  <span className="text-[11px] leading-none select-none" aria-hidden>{item.icon}</span>
                  <span className={cn('text-[10px] uppercase tracking-wider text-muted-foreground/70 font-source')}>
                    {item.label}
                  </span>
                  <span className={cn('text-sm font-bold tabular-nums leading-none', item.color)}>
                    {item.prefix}{formatVal(item.key, v)}{item.suffix}
                  </span>
                  <AnimatePresence mode="popLayout">
                    {d !== 0 && (
                      <motion.span
                        key={pulseKey + item.key}
                        initial={{ y: -4, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className={cn(
                          'text-[10px] font-bold tabular-nums leading-none',
                          deltaColor,
                          pulseKey && 'animate-pulse'
                        )}
                      >
                        {formatDelta(item.key, d)}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs max-w-[220px]">
                {tooltip}
                {d !== 0 && (
                  <div className={cn('mt-1 font-bold', deltaColor)}>
                    Since last turn: {formatDelta(item.key, d)}
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ResourceStrip;
