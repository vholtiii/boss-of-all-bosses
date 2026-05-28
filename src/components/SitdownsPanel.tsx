import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Handshake, Inbox, Hourglass, Crown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EnhancedMafiaGameState } from '@/hooks/useEnhancedMafiaGameState';
import { PendingNegotiation, IncomingSitdown, NEGOTIATION_TYPES, NegotiationType } from '@/types/game-mechanics';
import { getNegotiationSuccessChance, getNegotiationCost, predictCounterReaction } from '@/lib/negotiation-odds';

// ─── Counterable Sitdown Card (extracted so it can hold local counter-input state) ───
const CounterableSitdownCard: React.FC<{
  s: IncomingSitdown;
  isBoss: boolean;
  isUrgent: boolean;
  isDesperate: boolean;
  isRenewal: boolean;
  isCounterBack: boolean;
  fam: string;
  dl: { label: string; icon: string };
  turnsLeft: number;
  canCounter: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onCounter?: (price: number) => void;
  onFocusHex?: (q: number, r: number, s: number) => void;
}> = ({ s, isBoss, isUrgent, isDesperate, isRenewal, isCounterBack, fam, dl, turnsLeft, canCounter, onAccept, onDecline, onCounter, onFocusHex }) => {
  const [counterOpen, setCounterOpen] = React.useState(false);
  const defaultCounter = Math.max(2000, Math.round(((s.proposedAmount || 7500) * 0.7) / 500) * 500);
  const [counterValue, setCounterValue] = React.useState<number>(defaultCounter);

  const flavorTag = isDesperate
    ? { text: 'DESPERATE', cls: 'bg-red-600/90 text-white animate-pulse' }
    : isRenewal
      ? { text: 'RENEWAL', cls: 'bg-blue-600/80 text-white' }
      : isCounterBack
        ? { text: 'FINAL OFFER', cls: 'bg-amber-600/80 text-white' }
        : null;

  return (
    <div
      className={cn(
        'rounded-md border-2 p-2 text-xs space-y-1.5 transition-colors',
        isBoss
          ? (isDesperate
              ? 'bg-red-500/15 border-red-500/70 hover:bg-red-500/20'
              : isUrgent
                ? 'bg-red-500/10 border-red-500/60 hover:bg-red-500/15'
                : 'bg-mafia-gold/15 border-mafia-gold hover:bg-mafia-gold/20')
          : (isUrgent
              ? 'bg-red-500/10 border-red-500/50 hover:bg-red-500/15 cursor-pointer'
              : 'bg-mafia-gold/10 border-mafia-gold/40 hover:bg-mafia-gold/15 cursor-pointer'),
      )}
      onClick={() => !isBoss && s.targetQ !== undefined && onFocusHex?.(s.targetQ, s.targetR!, s.targetS!)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-bold capitalize flex items-center gap-1 flex-wrap">
            <span className="truncate">{dl.icon} {dl.label}</span>
            {flavorTag && (
              <Badge className={cn('text-[8px] h-3.5 px-1', flavorTag.cls)}>{flavorTag.text}</Badge>
            )}
          </div>
          <div className="text-muted-foreground text-[11px]">
            From{' '}
            {isBoss ? (
              <span className="text-foreground capitalize font-semibold">
                {s.fromBossName || `${fam} Boss`}
              </span>
            ) : (
              <>
                <span className="text-foreground capitalize font-semibold">{fam}</span>
                {s.fromCapoName && (<> · capo <span className="text-foreground">{s.fromCapoName}</span></>)}
              </>
            )}
          </div>
          {!isBoss && s.targetQ !== undefined && (
            <div className="text-[10px] text-muted-foreground">
              Hex ({s.targetQ}, {s.targetR})
            </div>
          )}
          {isBoss && typeof s.proposedDuration === 'number' && (
            <div className="text-[10px] text-muted-foreground">
              Duration: {s.proposedDuration} turns
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {typeof s.proposedAmount === 'number' && (
            s.playerIsSupplier ? (
              <Badge className="text-[10px] h-4 bg-emerald-600/90 text-white">
                +${s.proposedAmount.toLocaleString()} up front
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] h-4 text-green-400 border-green-400/40">
                ${s.proposedAmount.toLocaleString()}
              </Badge>
            )
          )}
          {s.playerIsSupplier && typeof s.royaltyRate === 'number' && s.royaltyRate > 0 && (
            <Badge className="text-[10px] h-4 bg-emerald-700/80 text-white">
              +{Math.round(s.royaltyRate * 100)}% royalty / turn
            </Badge>
          )}
          <Badge className="text-[9px] h-4 bg-emerald-600/80">+{s.successBonus}%</Badge>
        </div>
      </div>
      <div
        className={cn(
          'flex items-center gap-1 rounded px-1.5 py-1 text-[10px] font-semibold',
          isUrgent
            ? 'bg-red-500/15 text-red-300 border border-red-400/40 animate-pulse'
            : 'bg-muted/40 text-muted-foreground border border-border/60'
        )}
      >
        <Clock className="h-3 w-3" />
        {turnsLeft <= 0
          ? 'Expires this turn'
          : `Expires in ${turnsLeft} turn${turnsLeft === 1 ? '' : 's'}`}
      </div>

      {counterOpen ? (
        <div className="space-y-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
          <div className="text-[10px] text-muted-foreground">
            Counter with your price (within ±15% likely accepted):
          </div>
          <div className="flex gap-1">
            <Input
              type="number"
              min={2000}
              step={500}
              value={counterValue}
              onChange={(e) => setCounterValue(Math.max(2000, Math.floor(Number(e.target.value) || 0)))}
              className="h-7 text-[11px]"
            />
            <Button
              size="sm"
              className="h-7 text-[10px] px-2 bg-amber-500 hover:bg-amber-400 text-black"
              onClick={() => { onCounter?.(counterValue); setCounterOpen(false); }}
            >
              Send
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[10px] px-2"
              onClick={() => setCounterOpen(false)}
            >
              Cancel
            </Button>
          </div>
          {(() => {
            const original = s.originalPrice || s.proposedAmount || 0;
            const reaction = predictCounterReaction(original, counterValue, s.counterRound || 0);
            const map = {
              accept: { txt: '✅ They will likely accept', cls: 'text-green-400' },
              recounter: { txt: '↩️ They will probably counter back', cls: 'text-amber-400' },
              walk: { txt: '🚪 They will walk away (+5 tension)', cls: 'text-red-400' },
            } as const;
            const r = map[reaction];
            return <div className={cn('text-[10px] font-semibold', r.cls)}>{r.txt}</div>;
          })()}
        </div>

      ) : (
        <div className="flex gap-1.5 pt-1">
          <Button
            size="sm"
            className="h-6 text-[10px] flex-1"
            onClick={(e) => { e.stopPropagation(); onAccept(); }}
          >
            Accept
          </Button>
          {canCounter && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] px-2 border-amber-500/60 text-amber-400 hover:bg-amber-500/10"
              onClick={(e) => { e.stopPropagation(); setCounterOpen(true); }}
              title="Counter-offer at a different price"
            >
              Counter
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            className="h-6 text-[10px] px-2"
            onClick={(e) => { e.stopPropagation(); onDecline(); }}
            title="Decline — costs +5 tension"
          >
            Decline
          </Button>
        </div>
      )}
    </div>
  );
};


interface SitdownsPanelProps {
  gameState: EnhancedMafiaGameState;
  onOpenOutgoing: (p: PendingNegotiation) => void;
  onAcceptIncoming: (s: IncomingSitdown) => void;
  onDeclineIncoming: (s: IncomingSitdown) => void;
  onCounterIncoming?: (s: IncomingSitdown, counterPrice: number) => void;
  onFocusHex?: (q: number, r: number, s: number) => void;
}

const dealLabel = (deal: NegotiationType | string): { label: string; icon: string } => {
  const cfg = NEGOTIATION_TYPES.find(n => n.type === deal);
  return cfg ? { label: cfg.label, icon: cfg.icon } : { label: String(deal), icon: '🤝' };
};

const SitdownsPanel: React.FC<SitdownsPanelProps> = ({
  gameState, onOpenOutgoing, onAcceptIncoming, onDeclineIncoming, onCounterIncoming, onFocusHex,
}) => {
  const pending: PendingNegotiation[] = (gameState as any).pendingNegotiations || [];
  const incoming: IncomingSitdown[] = (gameState as any).incomingSitdowns || [];
  const ready = pending.filter(p => p.ready);
  const inFlight = pending.filter(p => !p.ready);

  const total = ready.length + inFlight.length + incoming.length;
  const [open, setOpen] = useState<boolean>(false);
  const lastSignatureRef = useRef<string>('');

  // Auto-expand once when something new and actionable appears (ready or incoming).
  useEffect(() => {
    const sig = `${ready.map(r => r.id).join(',')}|${incoming.map(i => i.id).join(',')}`;
    if (sig !== lastSignatureRef.current) {
      if ((ready.length > 0 || incoming.length > 0) && sig !== '|') {
        setOpen(true);
      }
      lastSignatureRef.current = sig;
    }
  }, [ready, incoming]);

  if (total === 0) return null;

  const playerRep = gameState.reputation?.respect || 0;
  const playerInf = gameState.resources?.influence || 0;
  const playerFear = (gameState.reputation as any)?.fear || 0;
  const treacheryActive = ((gameState as any).treacheryDebuff?.turnsRemaining || 0) > 0;

  return (
    <div className="rounded-lg border-2 border-mafia-gold/50 bg-mafia-gold/5 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-mafia-gold/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Handshake className="h-4 w-4 text-mafia-gold" />
          <span className="text-sm font-bold text-mafia-gold uppercase tracking-wider font-playfair">Sitdowns</span>
          <Badge variant="outline" className="text-[10px] h-4 border-mafia-gold/40 text-mafia-gold">{total}</Badge>
          {ready.length > 0 && (
            <Badge className="text-[10px] h-4 bg-yellow-500 text-black animate-pulse">{ready.length} ready</Badge>
          )}
          {incoming.length > 0 && (
            <Badge className="text-[10px] h-4 bg-mafia-gold text-black">{incoming.length} 📩</Badge>
          )}
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-mafia-gold" /> : <ChevronRight className="h-4 w-4 text-mafia-gold" />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3">
          {/* INCOMING */}
          {incoming.length > 0 && (() => {
            const bossIncoming = incoming.filter(s => s.scope !== 'territory');
            const capoIncoming = incoming.filter(s => s.scope === 'territory');

            const renderCard = (s: IncomingSitdown, isBoss: boolean) => {
              const turnsLeft = s.expiresOnTurn - gameState.turn;
              const isUrgent = turnsLeft <= 1;
              const fam = s.fromFamily.charAt(0).toUpperCase() + s.fromFamily.slice(1);
              const dl = dealLabel(s.proposedDeal);
              const canCounter = !!onCounterIncoming && typeof s.proposedAmount === 'number' && (s.counterRound || 0) < 1;
              const isDesperate = !!s.isDesperate;
              const isRenewal = !!s.isRenewal;
              const isCounterBack = !!s.isCounterOffer;
              return (
                <CounterableSitdownCard
                  key={s.id}
                  s={s}
                  isBoss={isBoss}
                  isUrgent={isUrgent}
                  isDesperate={isDesperate}
                  isRenewal={isRenewal}
                  isCounterBack={isCounterBack}
                  fam={fam}
                  dl={dl}
                  turnsLeft={turnsLeft}
                  canCounter={canCounter}
                  onAccept={() => onAcceptIncoming(s)}
                  onDecline={() => onDeclineIncoming(s)}
                  onCounter={onCounterIncoming ? (price) => onCounterIncoming(s, price) : undefined}
                  onFocusHex={onFocusHex}
                />
              );
            };


            return (
              <>
                {bossIncoming.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Crown className="h-3 w-3 text-mafia-gold" />
                      <span className="text-[10px] uppercase tracking-wider font-bold text-mafia-gold">Boss Sitdowns</span>
                    </div>
                    {bossIncoming.map(s => renderCard(s, true))}
                  </div>
                )}
                {capoIncoming.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Inbox className="h-3 w-3 text-mafia-gold" />
                      <span className="text-[10px] uppercase tracking-wider font-bold text-mafia-gold">Capo Sitdowns</span>
                    </div>
                    {capoIncoming.map(s => renderCard(s, false))}
                  </div>
                )}
              </>
            );
          })()}

          {/* OUTGOING — READY */}
          {ready.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Handshake className="h-3 w-3 text-yellow-400" />
                <span className="text-[10px] uppercase tracking-wider font-bold text-yellow-400">Ready to Negotiate</span>
              </div>
              {ready.map(p => {
                const tile = gameState.hexMap.find((t: any) => t.q === p.targetQ && t.r === p.targetR && t.s === p.targetS);
                const enemyOnHex = tile
                  ? gameState.deployedUnits.filter((u: any) => u.family === p.targetFamily && u.q === tile.q && u.r === tile.r && u.s === tile.s).length
                  : 0;
                const hexIncome = tile?.business?.income || 0;
                const fam = p.targetFamily.charAt(0).toUpperCase() + p.targetFamily.slice(1);
                // Best-case odds across territory deal types
                const sample: NegotiationType = 'bribe_territory';
                const odds = getNegotiationSuccessChance({
                  type: sample, scope: 'territory', capoPersonality: p.capoPersonality,
                  playerReputation: playerRep, enemyStrength: enemyOnHex, treacheryActive,
                });
                const cost = getNegotiationCost({ type: sample, enemyStrength: enemyOnHex, hexIncome });
                return (
                  <div
                    key={p.id}
                    className="rounded-md border-2 border-yellow-500/40 bg-yellow-500/10 p-2 text-xs space-y-1.5 cursor-pointer hover:bg-yellow-500/15 transition-colors animate-pulse"
                    onClick={() => onFocusHex?.(p.targetQ, p.targetR, p.targetS)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold truncate">{p.capoName}</div>
                        <div className="text-muted-foreground text-[11px]">
                          → <span className="capitalize text-foreground">{fam}</span> hex ({p.targetQ}, {p.targetR})
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge variant="outline" className="text-[10px] h-4">~{odds}%</Badge>
                        <Badge variant="outline" className="text-[10px] h-4 text-green-400 border-green-400/40">
                          ${cost.toLocaleString()}+
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="h-6 w-full text-[10px] bg-yellow-500 hover:bg-yellow-400 text-black"
                      onClick={(e) => { e.stopPropagation(); onOpenOutgoing(p); }}
                    >
                      Open Negotiation
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* OUTGOING — IN-FLIGHT */}
          {inFlight.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Hourglass className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Word in Transit</span>
              </div>
              {inFlight.map(p => {
                const fam = p.targetFamily.charAt(0).toUpperCase() + p.targetFamily.slice(1);
                return (
                  <div
                    key={p.id}
                    className="rounded-md border border-border bg-muted/20 p-2 text-xs cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => onFocusHex?.(p.targetQ, p.targetR, p.targetS)}
                  >
                    <div className="font-bold">{p.capoName}</div>
                    <div className="text-muted-foreground text-[11px]">
                      → <span className="capitalize text-foreground">{fam}</span> hex ({p.targetQ}, {p.targetR}) · ready next turn
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SitdownsPanel;
