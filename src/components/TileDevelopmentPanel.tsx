import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  BUILDING_DEFS,
  BUILDING_TYPES,
  MAX_BUILDING_TIER,
  TILE_POLICIES,
  DEFAULT_TILE_POLICY,
  RECRUIT_PROGRESS_GOAL,
  garrisonShare,
  tileBuildingTotals,
  type BuildingType,
  type BuildingTier,
  type TilePolicy,
  anchorBuyoutCost,
  BUILD_RANK_REQUIREMENT,
  buildEtaTurns,
  buildProgressRate,
  buildCrewLabel,
} from '@/types/game-mechanics';
import type { HexTile } from '@/hooks/useEnhancedMafiaGameState';

interface TileDevelopmentPanelProps {
  tile: HexTile;
  gameState: any;
  playerFamily: string;
  onStartBuild?: (q: number, r: number, s: number, type: BuildingType) => void;
  onSetTilePolicy?: (q: number, r: number, s: number, policy: TilePolicy) => void;
  onBuyOutAnchor?: (q: number, r: number, s: number) => void;
  onOpenCityPanel?: () => void;
}

const POLICY_ORDER: TilePolicy[] = ['earn', 'muscle', 'lay_low', 'fortify'];

const TileDevelopmentPanel: React.FC<TileDevelopmentPanelProps> = ({
  tile, gameState, playerFamily, onStartBuild, onSetTilePolicy, onBuyOutAnchor, onOpenCityPanel,
}) => {
  const [tab, setTab] = useState<'orders' | 'build'>('orders');
  if (!tile) return null;

  // Not ours (yet) — if our crew is standing here, explain the blocker instead of showing nothing
  if (tile.controllingFamily !== playerFamily) {
    const crewHere = (gameState?.deployedUnits || []).some(
      (u: any) => u.family === playerFamily && u.q === tile.q && u.r === tile.r && u.s === tile.s
    );
    if (!crewHere) return null;
    const blocked = tile.anchor
      ? (tile.anchor.isExtorted
        ? 'The racket still belongs to its owner. Buy it out to convert the block, then you can build.'
        : 'A standing racket runs this block. Extort it first, then buy it out before building.')
      : 'This block is not yours yet. Claim it with a soldier (1 action) before you can build.';
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        className="panel-noir pointer-events-auto w-full rounded-lg border border-noir-light bg-noir-dark/92 p-3 text-white backdrop-blur-sm"
      >
        <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300/90">No build orders here</div>
        <p className="mt-1 text-[11px] leading-relaxed text-white/70">{blocked}</p>
        <div className="mt-2 text-[10px] uppercase tracking-wider text-white/40">Extort → Buy Out → Build</div>
      </motion.div>
    );
  }

  const money = gameState?.resources?.money ?? 0;
  const actions = gameState?.actionsRemaining ?? 0;
  const policy = (tile.policy || DEFAULT_TILE_POLICY) as TilePolicy;
  const totals = tileBuildingTotals(tile.buildings);

  const unitsHere = (gameState?.deployedUnits || []).filter(
    (u: any) => u.family === playerFamily && u.q === tile.q && u.r === tile.r && u.s === tile.s
  );
  const capoHere = unitsHere.some((u: any) => u.type === 'capo' || u.type === 'boss');
  const soldiers = unitsHere.filter((u: any) => u.type === 'soldier').length;
  const share = garrisonShare(capoHere, soldiers);
  const anyoneHere = capoHere || soldiers > 0 || !!tile.isHeadquarters;
  const crewRate = buildProgressRate(capoHere, soldiers);
  const crewLabel = buildCrewLabel(capoHere, soldiers);
  const buildEta = tile.build ? buildEtaTurns(tile.build.monthsRemaining, capoHere, soldiers) : null;
  const policyDef = TILE_POLICIES[policy];
  const anchor = tile.anchor;
  const anchorTribute = anchor?.isExtorted ? anchor.tribute : 0;
  const monthly = Math.floor((totals.income + anchorTribute) * share * policyDef.incomeMult);
  const buyoutCost = anchor ? (anchor.buyoutCost ?? anchorBuyoutCost(anchor.tribute)) : 0;
  const progressPct = Math.min(100, Math.round(((tile.recruitProgress || 0) / RECRUIT_PROGRESS_GOAL) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="panel-noir pointer-events-auto w-full rounded-lg border border-noir-light bg-noir-dark/92 p-3 text-white backdrop-blur-sm"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="label-caps text-xs text-mafia-gold">The Block · {tile.district}</h3>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {monthly > 0 ? `$${monthly.toLocaleString()}/mo` : 'no earners'}
          </span>
          {onOpenCityPanel && (
            <button
              type="button"
              onClick={onOpenCityPanel}
              className="rounded border border-mafia-gold/50 px-1.5 py-0.5 text-[9px] label-caps text-mafia-gold transition-colors hover:bg-mafia-gold/15"
            >
              Manage
            </button>
          )}
        </div>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-1 text-[10px]">
        <button
          type="button"
          onClick={() => setTab('orders')}
          className={cn('rounded px-2 py-1 label-caps border', tab === 'orders'
            ? 'border-mafia-gold/60 bg-mafia-gold/15 text-mafia-gold'
            : 'border-noir-light text-muted-foreground hover:text-white')}
        >
          Standing Order
        </button>
        <button
          type="button"
          onClick={() => setTab('build')}
          className={cn('rounded px-2 py-1 label-caps border', tab === 'build'
            ? 'border-mafia-gold/60 bg-mafia-gold/15 text-mafia-gold'
            : 'border-noir-light text-muted-foreground hover:text-white')}
        >
          Build
        </button>
      </div>

      {tab === 'orders' && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1">
            {POLICY_ORDER.map(id => {
              const def = TILE_POLICIES[id];
              const active = policy === id;
              const heatPct = Math.round((def.heatMult - 1) * 100);
              return (
                <button
                  key={id}
                  type="button"
                  title={def.blurb}
                  onClick={() => onSetTilePolicy?.(tile.q, tile.r, tile.s, id)}
                  className={cn('rounded border px-2 py-1.5 text-left text-[11px] transition-colors',
                    active
                      ? 'border-mafia-gold/70 bg-mafia-gold/10 text-mafia-gold'
                      : 'border-noir-light text-muted-foreground hover:border-mafia-gold/40 hover:text-white')}
                >
                  <span className="block">{def.label}</span>
                  <span className="mt-0.5 block text-[9px] leading-tight opacity-80">
                    ${Math.floor((totals.income + anchorTribute) * share * def.incomeMult).toLocaleString()}/mo
                    {' · '}heat {heatPct === 0 ? 'std' : `${heatPct > 0 ? '+' : ''}${heatPct}%`}
                    {def.defenseBonus > 0 ? ` · +${def.defenseBonus} def` : ''}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] leading-snug text-muted-foreground">{policyDef.blurb}</p>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Garrison share</span>
            <span className="text-white">{Math.round(share * 100)}%</span>
          </div>
          {totals.infra > 0 && (
            <div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Crew coming up</span>
                <span className="text-white">{progressPct}%</span>
              </div>
              <div className="mt-0.5 h-1 w-full overflow-hidden rounded bg-noir-light">
                <div className="h-full bg-mafia-gold/70" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'build' && (
        <div className="space-y-1.5">
          {anchor && (
            <div className="rounded border border-mafia-gold/40 bg-mafia-gold/10 px-2 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[11px] text-mafia-gold">🍸 {anchor.name}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  ${anchor.tribute.toLocaleString()}/mo tribute
                </span>
              </div>
              <p className="mt-1 text-[9px] leading-snug text-muted-foreground">
                {anchor.isExtorted
                  ? 'Paying you tribute. Buy it out to own the place, then you can build and upgrade here.'
                  : 'Shake it down for tribute first, then buy it out, then build.'}
              </p>
              {anchor.isExtorted && (
                <>
                  <button
                    type="button"
                    disabled={money < buyoutCost || actions <= 0 || !anyoneHere}
                    onClick={() => onBuyOutAnchor?.(tile.q, tile.r, tile.s)}
                    className={cn('mt-1.5 w-full rounded border px-2 py-1 text-[10px] label-caps transition-colors',
                      money < buyoutCost || actions <= 0 || !anyoneHere
                        ? 'cursor-not-allowed border-noir-light/60 text-muted-foreground/60'
                        : 'border-mafia-gold/60 text-mafia-gold hover:bg-mafia-gold/15')}
                  >
                    Buy it out · ${buyoutCost.toLocaleString()}
                  </button>
                  {!anyoneHere && (
                    <p className="mt-1 text-[9px] text-muted-foreground">Send someone to close the deal.</p>
                  )}
                </>
              )}
            </div>
          )}
          {tile.build && (
            <div className="rounded border border-amber-500/40 bg-amber-900/25 px-2 py-1.5 text-[10px] text-amber-200">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">🏗️ {BUILDING_DEFS[tile.build.type].tiers[tile.build.tier].name}</span>
                <span className="shrink-0 font-semibold text-amber-100">
                  {buildEta === 0 ? 'Paused' : `Done in ${buildEta} turn${buildEta !== 1 ? 's' : ''}`}
                </span>
              </div>
              <p className="mt-0.5 text-[9px] text-amber-200/80">{crewLabel}{crewRate > 0 ? ` — ${crewRate}/turn` : ''}</p>
            </div>
          )}
          {!anchor && !anyoneHere && (
            <p className="rounded border border-noir-light bg-noir-dark/60 px-2 py-1.5 text-[9px] text-muted-foreground">
              👤 Nobody on this block — send a crew before breaking ground.
            </p>
          )}
          {BUILDING_TYPES.map(type => {
            const cur = (tile.buildings || {})[type] as BuildingTier | undefined;
            const next = ((cur || 0) + 1) as BuildingTier;
            const maxed = next > MAX_BUILDING_TIER;
            const def = maxed ? BUILDING_DEFS[type].tiers[MAX_BUILDING_TIER] : BUILDING_DEFS[type].tiers[next];
            const rankShort = BUILD_RANK_REQUIREMENT[type] === 'capo' && !capoHere && !tile.isHeadquarters;
            const blocked = maxed || !!anchor || !!tile.build || money < def.cost || actions <= 0 || !anyoneHere || rankShort;
            const startEta = buildEtaTurns(def.months, capoHere, soldiers);
            return (
              <button
                key={type}
                type="button"
                disabled={blocked}
                onClick={() => onStartBuild?.(tile.q, tile.r, tile.s, type)}
                className={cn('flex w-full items-center justify-between gap-2 rounded border px-2 py-1.5 text-left text-[11px] transition-colors',
                  blocked
                    ? 'cursor-not-allowed border-noir-light/60 text-muted-foreground/60'
                    : 'border-noir-light text-white hover:border-mafia-gold/60 hover:bg-mafia-gold/10')}
              >
                <span className="min-w-0 truncate">
                  {BUILDING_DEFS[type].label}
                  <span className="ml-1 text-[9px] text-muted-foreground">
                    {cur ? `T${cur}` : '—'}{!maxed ? ` → T${next}` : ' max'}
                    {rankShort && ' · capo work'}
                  </span>
                </span>
                {!maxed && (
                  <span className="shrink-0 text-[10px] text-mafia-gold">
                    ${def.cost.toLocaleString()} · ~{startEta}t
                  </span>
                )}
              </button>
            );
          })}

          <p className="text-[9px] text-muted-foreground">Breaking ground costs 1 action.</p>
        </div>
      )}
    </motion.div>
  );
};

export default TileDevelopmentPanel;
