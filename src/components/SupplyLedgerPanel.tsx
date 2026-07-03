import React, { useMemo, useState } from 'react';
import { Truck, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { EnhancedMafiaGameState } from '@/hooks/useEnhancedMafiaGameState';
import {
  SUPPLY_NODE_CONFIG,
  SUPPLY_DEPENDENCIES,
  SUPPLY_STOCKPILE_BUFFER,
  SUPPLY_DECAY_RATE,
  SUPPLY_DECAY_FLOOR,
  HQ_SUPPLY_CAPACITY,
  SAFEHOUSE_MAX_ALLOCATION,
  SAFEHOUSE_MAX_STOCKPILE,
  TENSION_PACT_BREAK,
  ALL_SUPPLY_NODE_TYPES,
  type SupplyNodeType,
  type Safehouse,
} from '@/types/game-mechanics';
import { getBusinessSupplyDecayMultiplier } from '@/lib/supply-flow';

interface Props {
  gameState: EnhancedMafiaGameState;
  onAction: (action: any) => void;
  onHighlightSupplyNode?: (hex: { q: number; r: number; s: number } | null) => void;
  highlightedSupplyHex?: { q: number; r: number; s: number } | null;
  /** When true, render tab content only (parent provides collapsible chrome). */
  embedded?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

type TabId = 'overview' | 'allocation' | 'stockpiles';

const STATUS_STYLES: Record<string, string> = {
  supplied: 'bg-green-600/20 text-green-400 border-green-600/40',
  halted: 'bg-amber-600/20 text-amber-400 border-amber-600/40',
  starved: 'bg-red-600/20 text-red-400 border-red-600/40',
};

const SupplyLedgerPanel: React.FC<Props> = ({
  gameState,
  onAction,
  onHighlightSupplyNode,
  highlightedSupplyHex,
  embedded = false,
  isOpen = true,
  onToggle,
}) => {
  const [tab, setTab] = useState<TabId>('overview');
  const [expandedType, setExpandedType] = useState<SupplyNodeType | null>(null);
  const [cancelDealId, setCancelDealId] = useState<string | null>(null);

  const snapshot = gameState.supplyFlowSnapshot;
  const routing = gameState.supplyRoutingConfig;
  const playerFamily = gameState.playerFamily;

  const playerSafehouses = useMemo(() => {
    return (gameState.safehouses || []).filter((sh: Safehouse) => {
      const t = gameState.hexMap.find(h => h.q === sh.q && h.r === sh.r && h.s === sh.s);
      return t && t.controllingFamily === playerFamily;
    });
  }, [gameState.safehouses, gameState.hexMap, playerFamily]);

  const activeDeals = (gameState.supplyDealPacts || []).filter(
    p => p.active && (p.buyerFamily === playerFamily || p.targetFamily === playerFamily)
  );

  const cancelDeal = activeDeals.find(d => d.id === cancelDealId);

  const moveBusinessPriority = (nodeType: SupplyNodeType, hexKey: string, dir: -1 | 1) => {
    const typeSnap = snapshot?.types.find(t => t.nodeType === nodeType);
    const current = routing?.businessFeedOrder[nodeType]
      ?? typeSnap?.dependentBusinesses.map(b => b.hexKey)
      ?? [];
    const idx = current.indexOf(hexKey);
    if (idx === -1) return;
    const next = [...current];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    onAction({ type: 'set_business_feed_priority', nodeType, orderedHexKeys: next });
  };

  const renderOverview = () => (
    <div className="space-y-2">
      {(snapshot?.types || []).map(row => {
        const cfg = SUPPLY_NODE_CONFIG[row.nodeType];
        const statusLabel = row.connected ? 'Connected' : row.viaDeal ? 'Via Deal' : 'Severed';
        const statusClass = row.connected
          ? 'bg-green-600/20 text-green-400'
          : row.viaDeal
            ? 'bg-blue-600/20 text-blue-400'
            : 'bg-red-600/20 text-red-400';
        const node = gameState.supplyNodes?.find(n => n.type === row.nodeType);
        const isHighlighted = node && highlightedSupplyHex
          && highlightedSupplyHex.q === node.q && highlightedSupplyHex.r === node.r;

        return (
          <div
            key={row.nodeType}
            className={cn(
              'rounded-lg border border-border bg-card p-2 cursor-pointer hover:border-muted-foreground/40',
              isHighlighted && 'border-primary ring-1 ring-primary/50',
            )}
            onClick={() => {
              if (node && onHighlightSupplyNode) {
                onHighlightSupplyNode(isHighlighted ? null : { q: node.q, r: node.r, s: node.s });
              }
              setExpandedType(expandedType === row.nodeType ? null : row.nodeType);
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span>{cfg.icon}</span>
              <span className="text-xs font-bold flex-1">{cfg.label}</span>
              <Badge variant="outline" className={cn('text-[9px] h-4', statusClass)}>{statusLabel}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
              <span>Generated</span>
              <span className="text-right text-foreground">+{row.generatedPerTurn}/turn</span>
              <span>To allies</span>
              <span className="text-right text-amber-400">-{row.committedToAllies}/turn</span>
              <span>Businesses</span>
              <span className="text-right">-{row.usedByBusinesses}/turn ({row.dependentBusinesses.length})</span>
              <span>Storage</span>
              <span className="text-right">HQ {row.hqUnits}/{HQ_SUPPLY_CAPACITY} · SH {Math.floor(row.safehouseUnits)}</span>
              <span>Net</span>
              <span className={cn('text-right font-semibold', row.netSurplus >= 0 ? 'text-green-400' : 'text-red-400')}>
                {row.netSurplus >= 0 ? '+' : ''}{row.netSurplus}
              </span>
            </div>
            {expandedType === row.nodeType && row.dependentBusinesses.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border space-y-1">
                {row.dependentBusinesses.map(biz => (
                  <div key={biz.hexKey} className="flex items-center justify-between text-[10px]">
                    <span className="capitalize truncate">{biz.type.replace(/_/g, ' ')} · {biz.district}</span>
                    <Badge variant="outline" className={cn('text-[8px] h-3.5', STATUS_STYLES[biz.status] || '')}>
                      {biz.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {activeDeals.length > 0 && (
        <div className="mt-3 border-t border-border pt-2 space-y-1.5">
          <p className="text-[10px] font-bold text-muted-foreground">Active Supply Deals</p>
          {activeDeals.map(deal => {
            const isBuyer = deal.buyerFamily === playerFamily;
            const other = isBuyer ? deal.targetFamily : deal.buyerFamily;
            const otherLabel = other.charAt(0).toUpperCase() + other.slice(1);
            const isSupplier = deal.targetFamily === playerFamily;
            return (
              <div key={deal.id} className="rounded border border-border p-2 text-[10px]">
                <div className="flex items-center justify-between gap-2">
                  <span>
                    {isBuyer ? `Buying from ${otherLabel}` : `Supplying ${otherLabel}`}
                    {' · '}{deal.turnsRemaining}t left
                    {typeof deal.royaltyRate === 'number' && deal.royaltyRate > 0 && !isBuyer
                      ? ` · +${Math.round(deal.royaltyRate * 100)}% royalty`
                      : ''}
                  </span>
                  {isSupplier && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 text-[9px] px-2"
                      onClick={() => setCancelDealId(deal.id)}
                    >
                      Break Deal
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderAllocation = () => (
    <div className="space-y-4">
      {ALL_SUPPLY_NODE_TYPES.map(nodeType => {
        const typeSnap = snapshot?.types.find(t => t.nodeType === nodeType);
        const businesses = typeSnap?.dependentBusinesses || [];
        if (businesses.length === 0) return null;

        const pool = (typeSnap?.generatedPerTurn || 0)
          + (typeSnap?.hqUnits || 0)
          + (typeSnap?.safehouseUnits || 0)
          - (typeSnap?.committedToAllies || 0);
        const demand = businesses.length;
        const orderedKeys = routing?.businessFeedOrder[nodeType]
          ?? [...businesses].sort((a, b) => b.income - a.income).map(b => b.hexKey);
        const orderedBiz = orderedKeys
          .map(k => businesses.find(b => b.hexKey === k))
          .filter(Boolean) as typeof businesses;

        let unitsLeft = pool;

        return (
          <div key={nodeType} className="rounded-lg border border-border p-2">
            <div className="flex items-center gap-2 mb-2">
              <span>{SUPPLY_NODE_CONFIG[nodeType].icon}</span>
              <span className="text-xs font-bold flex-1">{SUPPLY_NODE_CONFIG[nodeType].label}</span>
              <span className={cn('text-[10px]', pool >= demand ? 'text-green-400' : 'text-amber-400')}>
                Pool {Math.floor(pool)} vs demand {demand}
              </span>
            </div>
            <div className="space-y-1">
              {orderedBiz.map((biz, idx) => {
                const isHalted = routing?.haltedBusinessHexKeys.includes(biz.hexKey);
                const wouldFeed = !isHalted && unitsLeft >= 1;
                const cutoffHere = !wouldFeed && unitsLeft >= 0 && idx > 0
                  && orderedBiz[idx - 1] && !routing?.haltedBusinessHexKeys.includes(orderedBiz[idx - 1].hexKey);
                if (wouldFeed) unitsLeft -= 1;

                const decayMult = getBusinessSupplyDecayMultiplier(biz.hexKey, gameState.businessSupplyStatus);
                const starvedTurns = gameState.businessSupplyStatus?.[biz.hexKey]?.consecutiveTurnsStarved ?? 0;

                return (
                  <React.Fragment key={biz.hexKey}>
                    {cutoffHere && (
                      <div className="flex items-center gap-2 py-1">
                        <div className="flex-1 border-t border-dashed border-amber-500/60" />
                        <span className="text-[9px] text-amber-400 whitespace-nowrap">supply runs out here</span>
                        <div className="flex-1 border-t border-dashed border-amber-500/60" />
                      </div>
                    )}
                    <div className="flex items-center gap-1 rounded bg-muted/30 p-1.5">
                      <div className="flex flex-col gap-0">
                        <button
                          type="button"
                          className="p-0 h-3 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          disabled={idx === 0}
                          onClick={() => moveBusinessPriority(nodeType, biz.hexKey, -1)}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          className="p-0 h-3 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          disabled={idx === orderedBiz.length - 1}
                          onClick={() => moveBusinessPriority(nodeType, biz.hexKey, 1)}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-semibold capitalize truncate">
                          {biz.type.replace(/_/g, ' ')} · {biz.district}
                        </div>
                        <div className="text-[9px] text-muted-foreground">${biz.income}/turn</div>
                        {biz.status === 'starved' && starvedTurns > SUPPLY_STOCKPILE_BUFFER && (
                          <div className="text-[9px] text-red-400">
                            {starvedTurns}t starved · {Math.round(decayMult * 100)}% income
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className={cn('text-[8px] h-4 shrink-0', STATUS_STYLES[biz.status])}>
                        {biz.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[9px] px-2 shrink-0"
                        onClick={() => onAction({
                          type: isHalted ? 'resume_business_supply' : 'halt_business_supply',
                          hexKey: biz.hexKey,
                        })}
                      >
                        {isHalted ? 'Resume' : 'Halt'}
                      </Button>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderStockpiles = () => (
    <div className="space-y-3">
      <div className="rounded-lg border border-border p-2.5">
        <p className="text-xs font-bold mb-2">HQ Storage <span className="text-muted-foreground font-normal">(permanent, max {HQ_SUPPLY_CAPACITY}/type)</span></p>
        <div className="space-y-2">
          {ALL_SUPPLY_NODE_TYPES.map(nodeType => {
            const cfg = SUPPLY_NODE_CONFIG[nodeType];
            const hqUnits = gameState.familySupplyStorage?.find(
              e => e.family === playerFamily && e.nodeType === nodeType
            )?.hqUnits ?? 0;
            const isPriority = routing?.hqPriorityTypes.includes(nodeType);
            const pct = (hqUnits / HQ_SUPPLY_CAPACITY) * 100;
            return (
              <div key={nodeType} className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span>{cfg.icon} {cfg.label}</span>
                  <span className="font-mono">{hqUnits}/{HQ_SUPPLY_CAPACITY}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary/70 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <Button
                  size="sm"
                  variant={isPriority ? 'default' : 'outline'}
                  className="h-6 text-[9px] w-full"
                  onClick={() => onAction({
                    type: 'set_hq_supply_priority',
                    nodeType,
                    enabled: !isPriority,
                  })}
                >
                  {isPriority ? '✓ Priority restock' : 'Top up before low-priority biz'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {playerSafehouses.length === 0 ? (
        <p className="text-[10px] text-muted-foreground italic">No safehouses — establish one to stockpile surplus supply.</p>
      ) : (
        playerSafehouses.map((sh, idx) => {
          const shTile = gameState.hexMap.find(t => t.q === sh.q && t.r === sh.r && t.s === sh.s);
          const isConnected = sh.connectedSupplyTypes && sh.connectedSupplyTypes.length > 0;
          const nearExpiry = sh.turnsRemaining <= 1;
          return (
            <div key={`sh-${idx}`} className="rounded-lg border border-border p-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <span>🏠</span>
                <span className="text-xs font-bold flex-1">Safehouse · {shTile?.district || '?'}</span>
                {nearExpiry && (
                  <Badge variant="outline" className="text-[9px] h-4 border-amber-500 text-amber-400">
                    <AlertTriangle className="h-3 w-3 mr-0.5" /> Expires {sh.turnsRemaining}t
                  </Badge>
                )}
                {isConnected ? (
                  <Badge className="text-[9px] h-4 bg-green-600">Connected</Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] h-4">Disconnected</Badge>
                )}
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {ALL_SUPPLY_NODE_TYPES.map(nodeType => {
                  const units = sh.stockpile[nodeType] || 0;
                  if (!isConnected && units <= 0) return null;
                  const cfg = SUPPLY_NODE_CONFIG[nodeType];
                  return (
                    <div key={nodeType} className="flex items-center gap-2 text-[10px]">
                      <span className="w-24 truncate">{cfg.icon} {cfg.label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-blue-500/70 rounded-full"
                          style={{ width: `${(units / SAFEHOUSE_MAX_STOCKPILE) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono w-8 text-right">{Math.floor(units)}</span>
                    </div>
                  );
                })}
              </div>
              {isConnected && (
                <div className="space-y-1 pt-1 border-t border-border">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Surplus allocation</span>
                    <span className="font-bold">{sh.allocationPercent}%</span>
                  </div>
                  <Slider
                    value={[sh.allocationPercent]}
                    min={0}
                    max={SAFEHOUSE_MAX_ALLOCATION}
                    step={5}
                    onValueChange={(val) => onAction({
                      type: 'set_safehouse_allocation',
                      q: sh.q, r: sh.r, s: sh.s,
                      allocationPercent: val[0],
                    })}
                  />
                </div>
              )}
              {!isConnected && !sh.manualRouteEstablished && (sh as any)._manuallyConnectable && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs h-7"
                  onClick={() => onAction({
                    type: 'establish_safehouse_route',
                    q: sh.q, r: sh.r, s: sh.s,
                  })}
                >
                  Establish Route
                </Button>
              )}
              <p className="text-[9px] text-muted-foreground">{sh.turnsRemaining} turns remaining</p>
            </div>
          );
        })
      )}
    </div>
  );

  const panelBody = (
    <>
      <div className="flex border-b border-border mb-2">
        {(['overview', 'allocation', 'stockpiles'] as TabId[]).map(id => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 py-1.5 text-[10px] font-semibold capitalize transition-colors',
              tab === id ? 'bg-primary/15 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {id === 'overview' ? 'Overview' : id === 'allocation' ? 'Allocation' : 'Stockpiles'}
          </button>
        ))}
      </div>

      <div className={cn(embedded ? '' : 'max-h-[420px] overflow-y-auto')}>
        {tab === 'overview' && renderOverview()}
        {tab === 'allocation' && renderAllocation()}
        {tab === 'stockpiles' && renderStockpiles()}
      </div>
    </>
  );

  if (embedded) {
    return (
      <>
        {panelBody}
        <Dialog open={!!cancelDealId} onOpenChange={(open) => { if (!open) setCancelDealId(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Break Supply Deal?</DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-2 text-sm text-muted-foreground pt-2">
                  <p>
                    Cutting off {cancelDeal?.buyerFamily.charAt(0).toUpperCase()}{cancelDeal?.buyerFamily.slice(1)} is a betrayal — not a pause.
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[12px]">
                    <li>Royalty income stops immediately</li>
                    <li>Relationship −25</li>
                    <li>Reputation −10</li>
                    <li>Tension +{TENSION_PACT_BREAK}</li>
                  </ul>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setCancelDealId(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (cancelDealId) {
                    onAction({ type: 'cancel_supply_deal', pactId: cancelDealId });
                    setCancelDealId(null);
                  }
                }}
              >
                Break Deal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (!isOpen && onToggle) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted/50 rounded-lg"
      >
        <Truck className="h-4 w-4" />
        Supply Ledger
      </button>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold border-b border-border hover:bg-muted/30"
        >
          <Truck className="h-4 w-4" />
          Supply Ledger
        </button>

        <div className="p-2">
          {panelBody}
        </div>
      </div>

      <Dialog open={!!cancelDealId} onOpenChange={(open) => { if (!open) setCancelDealId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Break Supply Deal?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground pt-2">
                <p>
                  Cutting off {cancelDeal?.buyerFamily.charAt(0).toUpperCase()}{cancelDeal?.buyerFamily.slice(1)} is a betrayal — not a pause.
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[12px]">
                  <li>Royalty income stops immediately</li>
                  <li>Relationship −25</li>
                  <li>Reputation −10</li>
                  <li>Tension +{TENSION_PACT_BREAK}</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelDealId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (cancelDealId) {
                  onAction({ type: 'cancel_supply_deal', pactId: cancelDealId });
                  setCancelDealId(null);
                }
              }}
            >
              Break Deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SupplyLedgerPanel;
