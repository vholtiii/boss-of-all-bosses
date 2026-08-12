import React from 'react';
import { motion } from 'framer-motion';
import { X, Hammer, Users, Landmark, ShieldCheck, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildingSprite } from '@/lib/sprites';
import {
  BUILDING_DEFS,
  BUILDING_TYPES,
  TILE_POLICIES,
  DEFAULT_TILE_POLICY,
  RECRUIT_PROGRESS_GOAL,
  RECRUIT_PROGRESS_PER_INFRA,
  DISTRICT_UPGRADES,
  DISTRICT_UPGRADE_IDS,
  garrisonShare,
  tileBuildingTotals,
  anchorBuyoutCost,
  buildingMaxTier,
  buildingUnlockPhase,
  type BuildingType,
  type BuildingTier,
  type TilePolicy,
  type DistrictUpgradeId,
} from '@/types/game-mechanics';
import type { HexTile } from '@/hooks/useEnhancedMafiaGameState';

interface CityPanelProps {
  tile: HexTile;
  gameState: any;
  playerFamily: string;
  onClose: () => void;
  onStartBuild?: (q: number, r: number, s: number, type: BuildingType) => void;
  onSetTilePolicy?: (q: number, r: number, s: number, policy: TilePolicy) => void;
  onBuyOutAnchor?: (q: number, r: number, s: number) => void;
  onBuyDistrictUpgrade?: (id: DistrictUpgradeId) => void;
}

const POLICY_ORDER: TilePolicy[] = ['earn', 'muscle', 'lay_low', 'fortify'];

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <section className="border-b border-noir-light/60 px-4 py-3">
    <h4 className="label-caps mb-2 flex items-center gap-1.5 text-[10px] text-mafia-gold">
      {icon}
      {title}
    </h4>
    {children}
  </section>
);

const CityPanel: React.FC<CityPanelProps> = ({
  tile, gameState, playerFamily, onClose,
  onStartBuild, onSetTilePolicy, onBuyOutAnchor, onBuyDistrictUpgrade,
}) => {
  const money = gameState?.resources?.money ?? 0;
  const actions = gameState?.actionsRemaining ?? 0;
  const phase = gameState?.gamePhase ?? 1;
  const policy = (tile.policy || DEFAULT_TILE_POLICY) as TilePolicy;
  const policyDef = TILE_POLICIES[policy];
  const totals = tileBuildingTotals(tile.buildings);
  const anchor = tile.anchor;

  const unitsHere = (gameState?.deployedUnits || []).filter(
    (u: any) => u.family === playerFamily && u.q === tile.q && u.r === tile.r && u.s === tile.s
  );
  const capoHere = unitsHere.some((u: any) => u.type === 'capo' || u.type === 'boss');
  const soldiers = unitsHere.filter((u: any) => u.type === 'soldier').length;
  const share = garrisonShare(capoHere, soldiers);

  const anchorTribute = anchor?.isExtorted ? anchor.tribute : 0;
  const monthly = Math.floor((totals.income + anchorTribute) * share * policyDef.incomeMult);
  const buyoutCost = anchor ? (anchor.buyoutCost ?? anchorBuyoutCost(anchor.tribute)) : 0;

  const progress = tile.recruitProgress || 0;
  const progressPct = Math.min(100, Math.round((progress / RECRUIT_PROGRESS_GOAL) * 100));
  const perMonth = totals.infra * RECRUIT_PROGRESS_PER_INFRA * (policyDef.growthMult ?? 1);
  const etaMonths = perMonth > 0 ? Math.ceil((RECRUIT_PROGRESS_GOAL - progress) / perMonth) : null;

  const ownedUpgrades: string[] = gameState?.districtUpgrades || [];
  const hexes = gameState?.hexMap || [];
  const districtHexes = hexes.filter((t: HexTile) => t.district === tile.district);
  const mineHere = districtHexes.filter((t: HexTile) => t.controllingFamily === playerFamily).length;
  const districtPct = districtHexes.length ? Math.round((mineHere / districtHexes.length) * 100) : 0;
  const bestControl = (() => {
    let best = 0;
    new Set(hexes.map((t: HexTile) => t.district)).forEach((d: any) => {
      const all = hexes.filter((t: HexTile) => t.district === d);
      if (!all.length) return;
      best = Math.max(best, all.filter((t: HexTile) => t.controllingFamily === playerFamily).length / all.length);
    });
    return best;
  })();

  return (
    <motion.aside
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="pointer-events-auto absolute right-0 top-0 z-40 flex h-full w-96 max-w-[92vw] flex-col border-l border-noir-light bg-noir-dark/96 text-white shadow-2xl backdrop-blur-md"
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-2 border-b border-mafia-gold/30 bg-gradient-to-r from-mafia-gold/10 to-transparent px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg text-mafia-gold">The Block</h3>
          <p className="text-[11px] text-muted-foreground">
            {tile.district} · {districtPct}% district control · ({tile.q},{tile.r})
          </p>
          <p className="mt-1 text-xs">
            <span className={monthly > 0 ? 'text-emerald-400' : 'text-muted-foreground'}>
              {monthly > 0 ? `$${monthly.toLocaleString()}/mo` : 'no earners yet'}
            </span>
            <span className="text-muted-foreground"> · heat {totals.heat >= 0 ? '+' : ''}{totals.heat} · cover {totals.cover}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close block panel"
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-noir-light hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Crew growth */}
        <Section title="Crew Coming Up" icon={<Users className="h-3 w-3" />}>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Garrison share</span>
            <span className="text-white">{Math.round(share * 100)}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded bg-noir-light">
            <div className="h-full bg-mafia-gold/70 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {totals.infra > 0
              ? `${progressPct}% · ${etaMonths !== null ? `new soldier in ~${etaMonths} month${etaMonths === 1 ? '' : 's'}` : 'stalled'}`
              : 'Build something with infrastructure to grow crew here.'}
          </p>
        </Section>

        {/* Standing order */}
        <Section title="Standing Order" icon={<ShieldCheck className="h-3 w-3" />}>
          <div className="grid grid-cols-2 gap-1.5">
            {POLICY_ORDER.map(id => {
              const def = TILE_POLICIES[id];
              const active = policy === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSetTilePolicy?.(tile.q, tile.r, tile.s, id)}
                  className={cn('rounded border px-2 py-2 text-left transition-colors',
                    active
                      ? 'border-mafia-gold/70 bg-mafia-gold/10 text-mafia-gold'
                      : 'border-noir-light text-muted-foreground hover:border-mafia-gold/40 hover:text-white')}
                >
                  <span className="block text-[11px] font-semibold">{def.label}</span>
                  <span className="mt-0.5 block text-[9px] leading-tight opacity-80">{def.blurb}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Anchor racket */}
        {anchor && (
          <Section title="Anchor Racket" icon={<Landmark className="h-3 w-3" />}>
            <div className="rounded border border-mafia-gold/40 bg-mafia-gold/10 px-2.5 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[12px] text-mafia-gold">{anchor.name}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  ${anchor.tribute.toLocaleString()}/mo
                </span>
              </div>
              {anchor.isExtorted ? (
                <button
                  type="button"
                  disabled={money < buyoutCost || actions <= 0}
                  onClick={() => onBuyOutAnchor?.(tile.q, tile.r, tile.s)}
                  className={cn('mt-2 w-full rounded border px-2 py-1.5 text-[10px] label-caps transition-colors',
                    money < buyoutCost || actions <= 0
                      ? 'cursor-not-allowed border-noir-light/60 text-muted-foreground/60'
                      : 'border-mafia-gold/60 text-mafia-gold hover:bg-mafia-gold/15')}
                >
                  Buy it out · ${buyoutCost.toLocaleString()}
                </button>
              ) : (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Shake it down first, then you can own it outright.
                </p>
              )}
            </div>
          </Section>
        )}

        {/* Buildings */}
        <Section title="Development" icon={<Hammer className="h-3 w-3" />}>
          {tile.build && (
            <div className="mb-2 rounded border border-amber-500/40 bg-amber-900/25 px-2 py-1.5 text-[10px] text-amber-200">
              🏗️ {BUILDING_DEFS[tile.build.type].tiers[tile.build.tier]?.name} — {tile.build.monthsRemaining} month
              {tile.build.monthsRemaining !== 1 ? 's' : ''} out
            </div>
          )}
          <div className="space-y-1.5">
            {BUILDING_TYPES.map(type => {
              const cur = (tile.buildings || {})[type] as BuildingTier | undefined;
              const max = buildingMaxTier(type);
              const next = ((cur || 0) + 1) as BuildingTier;
              const maxed = next > max;
              const unlock = buildingUnlockPhase(type);
              const locked = phase < unlock;
              const def = BUILDING_DEFS[type].tiers[(maxed ? max : next) as BuildingTier]!;
              const blocked = maxed || locked || !!tile.build || money < def.cost || actions <= 0;
              const art = buildingSprite(type, cur || 1);
              return (
                <button
                  key={type}
                  type="button"
                  disabled={blocked}
                  onClick={() => onStartBuild?.(tile.q, tile.r, tile.s, type)}
                  className={cn('flex w-full items-center gap-2.5 rounded border px-2 py-2 text-left transition-colors',
                    blocked
                      ? 'cursor-not-allowed border-noir-light/60 opacity-60'
                      : 'border-noir-light hover:border-mafia-gold/60 hover:bg-mafia-gold/10')}
                >
                  {art && (
                    <img
                      src={art}
                      alt=""
                      loading="lazy"
                      width={512}
                      height={512}
                      className={cn('h-9 w-9 shrink-0 object-contain', !cur && 'opacity-35 grayscale')}
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-white">
                      {BUILDING_DEFS[type].label}
                      <span className="text-[9px] font-normal text-muted-foreground">
                        {cur ? `T${cur}` : '—'}{!maxed ? ` → T${next}` : ' · max'}
                      </span>
                      {locked && <Lock className="h-2.5 w-2.5 text-muted-foreground" />}
                    </span>
                    <span className="mt-0.5 block truncate text-[9px] text-muted-foreground">
                      {locked
                        ? `Unlocks in phase ${unlock}`
                        : maxed
                          ? BUILDING_DEFS[type].blurb
                          : `${def.name} · $${def.income.toLocaleString()}/mo · heat ${def.heat >= 0 ? '+' : ''}${def.heat}`}
                    </span>
                  </span>
                  {!maxed && !locked && (
                    <span className="shrink-0 text-right text-[10px] text-mafia-gold">
                      ${def.cost.toLocaleString()}
                      <span className="block text-[9px] text-muted-foreground">{def.months}mo · 1 action</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* District upgrades */}
        <Section title="District Upgrades" icon={<Landmark className="h-3 w-3" />}>
          <div className="space-y-1.5">
            {DISTRICT_UPGRADE_IDS.map(id => {
              const def = DISTRICT_UPGRADES[id];
              const owned = ownedUpgrades.includes(id);
              const eligible = bestControl >= def.requiredControl;
              const blocked = owned || !eligible || money < def.cost;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={blocked}
                  onClick={() => onBuyDistrictUpgrade?.(id)}
                  className={cn('w-full rounded border px-2 py-2 text-left transition-colors',
                    owned
                      ? 'border-emerald-600/50 bg-emerald-900/20'
                      : blocked
                        ? 'cursor-not-allowed border-noir-light/60 opacity-60'
                        : 'border-noir-light hover:border-mafia-gold/60 hover:bg-mafia-gold/10')}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-white">{def.label}</span>
                    <span className={cn('shrink-0 text-[10px]', owned ? 'text-emerald-400' : 'text-mafia-gold')}>
                      {owned ? 'Owned' : `$${def.cost.toLocaleString()}`}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[9px] text-muted-foreground">
                    {def.blurb}{!owned && !eligible ? ` · needs ${Math.round(def.requiredControl * 100)}% of a district` : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>
      </div>

      <footer className="border-t border-noir-light px-4 py-2 text-[10px] text-muted-foreground">
        ${money.toLocaleString()} on hand · {actions} action{actions === 1 ? '' : 's'} left
      </footer>
    </motion.aside>
  );
};

export default CityPanel;
