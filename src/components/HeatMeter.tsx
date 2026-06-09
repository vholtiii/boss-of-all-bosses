import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface HeatMeterProps {
  heat: number;
  history: number[]; // chronological, oldest → newest, EXCLUDES current
  ricoTimer?: number;
  fedBugCount?: number;             // total active Fed wires on the player
  fedBugDiscoveredCount?: number;   // of those, how many are already revealed
}

type Tier = 'cool' | 'warm' | 'hot' | 'critical' | 'rico';

function getTier(h: number): Tier {
  if (h >= 90) return 'rico';
  if (h >= 80) return 'critical';
  if (h >= 60) return 'hot';
  if (h >= 40) return 'warm';
  return 'cool';
}

const TIER_META: Record<Tier, { label: string; color: string; bg: string; border: string; bar: string; desc: string }> = {
  cool:     { label: 'COOL',     color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', bar: 'from-emerald-500 to-emerald-400', desc: 'Below the cops’ radar. Safe to push operations.' },
  warm:    { label: 'WARM',      color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/40',   bar: 'from-amber-500 to-amber-400',   desc: 'Police are noticing. Minor income penalties begin.' },
  hot:     { label: 'HOT',       color: 'text-orange-300',  bg: 'bg-orange-500/10',  border: 'border-orange-500/40',  bar: 'from-orange-500 to-orange-400',  desc: 'Active investigation. Higher arrest & prosecution risk.' },
  critical:{ label: 'CRITICAL',  color: 'text-red-300',     bg: 'bg-red-500/15',     border: 'border-red-500/50',     bar: 'from-red-600 to-red-400',        desc: 'RICO timer ticks each turn at this level. Cool down NOW.' },
  rico:    { label: 'RICO',      color: 'text-red-200',     bg: 'bg-red-700/25',     border: 'border-red-500/70',     bar: 'from-red-700 to-red-500',        desc: 'Federal indictment imminent. 5 consecutive turns = GAME OVER.' },
};

const Sparkline: React.FC<{ values: number[]; tier: Tier }> = ({ values, tier }) => {
  if (values.length < 2) return null;
  const W = 56, H = 16;
  const min = 0, max = 100;
  const stepX = W / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = H - ((v - min) / (max - min)) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const stroke = tier === 'rico' || tier === 'critical' ? '#f87171'
    : tier === 'hot' ? '#fb923c'
    : tier === 'warm' ? '#fbbf24'
    : '#34d399';
  return (
    <svg width={W} height={H} className="opacity-90">
      <polyline fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

const HeatMeter: React.FC<HeatMeterProps> = ({ heat, history, ricoTimer = 0, fedBugCount = 0, fedBugDiscoveredCount = 0 }) => {
  const h = Math.max(0, Math.min(100, Math.round(heat)));
  const tier = getTier(h);
  const meta = TIER_META[tier];
  const prev = history.length > 0 ? history[history.length - 1] : null;
  const delta = prev != null ? h - Math.round(prev) : null;
  // Sparkline shows last 5 points including current
  const trail = [...history.slice(-4), h];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={cn(
            'pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-lg cursor-help',
            'bg-noir-dark/85',
            meta.border,
            tier === 'rico' && 'animate-pulse'
          )}
          style={{ minWidth: 280 }}
        >
          <Flame className={cn('h-4 w-4 shrink-0', meta.color)} />
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 font-semibold">Heat</span>

          {/* Bar */}
          <div className="relative flex-1 h-2 rounded-full bg-noir-light/60 overflow-hidden min-w-[80px]">
            <motion.div
              className={cn('absolute inset-y-0 left-0 bg-gradient-to-r rounded-full', meta.bar)}
              initial={false}
              animate={{ width: `${h}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
            {/* Threshold ticks at 40 / 60 / 80 / 90 */}
            {[40, 60, 80, 90].map(t => (
              <div key={t} className="absolute top-0 bottom-0 w-px bg-noir-dark/70" style={{ left: `${t}%` }} />
            ))}
          </div>

          {/* Value + tier */}
          <div className="flex items-baseline gap-1 tabular-nums leading-none">
            <span className={cn('text-sm font-bold', meta.color)}>{h}</span>
            <span className="text-[10px] text-muted-foreground/70">/100</span>
          </div>
          <span className={cn('text-[10px] font-bold tracking-wider', meta.color)}>{meta.label}</span>

          {/* Delta */}
          {delta != null && (
            <div className={cn(
              'flex items-center gap-0.5 text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full border',
              delta > 0 ? 'text-red-300 border-red-500/40 bg-red-500/10'
                : delta < 0 ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
                : 'text-muted-foreground border-noir-light/60 bg-noir-light/20'
            )}>
              {delta > 0 ? <TrendingUp className="h-2.5 w-2.5" />
                : delta < 0 ? <TrendingDown className="h-2.5 w-2.5" />
                : <Minus className="h-2.5 w-2.5" />}
              <span>{delta > 0 ? `+${delta}` : delta}</span>
            </div>
          )}

          {/* Sparkline */}
          {trail.length >= 2 && <Sparkline values={trail} tier={tier} />}

          {/* Fed wire badge — total active vs known on the player */}
          {fedBugCount > 0 && (
            <div
              className={cn(
                'flex items-center gap-1 text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full border',
                fedBugDiscoveredCount > 0
                  ? 'text-red-300 border-red-500/50 bg-red-500/15 animate-pulse'
                  : 'text-amber-300 border-amber-500/40 bg-amber-500/10'
              )}
              title={
                fedBugDiscoveredCount > 0
                  ? `${fedBugDiscoveredCount} Fed wire(s) discovered, ${fedBugCount - fedBugDiscoveredCount} suspected. Sweep to remove.`
                  : `${fedBugCount} Fed wire(s) suspected on your territory. Mayor bribe / Consigliere / Sweep can find them.`
              }
            >
              <span>🎧</span>
              <span>{fedBugDiscoveredCount > 0 ? `${fedBugDiscoveredCount}/${fedBugCount}` : `?${fedBugCount}`}</span>
            </div>
          )}
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs text-xs">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className={cn('font-bold', meta.color)}>{meta.label} · {h}/100</span>
            {delta != null && (
              <span className="text-muted-foreground">
                {delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : '— no change'} vs last turn
              </span>
            )}
          </div>
          <p className="text-muted-foreground">{meta.desc}</p>
          {ricoTimer > 0 && (
            <p className="text-red-300 font-semibold">🚨 RICO timer: {ricoTimer}/5 — game over at 5.</p>
          )}
          {fedBugCount > 0 && (
            <p className="text-amber-300">
              🎧 Fed wires: {fedBugDiscoveredCount}/{fedBugCount} discovered. Long-running bugs hurt the most on discovery.
            </p>
          )}
          <div className="pt-1 border-t border-border/40 text-[10px] text-muted-foreground/80 space-y-0.5">
            <div>Tiers: Cool &lt;40 · Warm 40 · Hot 60 · Critical 80 · RICO 90+</div>
            <div>Reduce heat: bribe officials, hire lawyer, donate to charity, public appearance.</div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default HeatMeter;
