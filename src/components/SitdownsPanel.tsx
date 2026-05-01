import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Handshake, Inbox, Hourglass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EnhancedMafiaGameState } from '@/hooks/useEnhancedMafiaGameState';
import { PendingNegotiation, IncomingSitdown, NEGOTIATION_TYPES, NegotiationType } from '@/types/game-mechanics';
import { getNegotiationSuccessChance, getNegotiationCost } from '@/lib/negotiation-odds';

interface SitdownsPanelProps {
  gameState: EnhancedMafiaGameState;
  onOpenOutgoing: (p: PendingNegotiation) => void;
  onAcceptIncoming: (s: IncomingSitdown) => void;
  onDeclineIncoming: (s: IncomingSitdown) => void;
  onFocusHex?: (q: number, r: number, s: number) => void;
}

const dealLabel = (deal: NegotiationType | string): { label: string; icon: string } => {
  const cfg = NEGOTIATION_TYPES.find(n => n.type === deal);
  return cfg ? { label: cfg.label, icon: cfg.icon } : { label: String(deal), icon: '🤝' };
};

const SitdownsPanel: React.FC<SitdownsPanelProps> = ({
  gameState, onOpenOutgoing, onAcceptIncoming, onDeclineIncoming, onFocusHex,
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
          {incoming.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Inbox className="h-3 w-3 text-mafia-gold" />
                <span className="text-[10px] uppercase tracking-wider font-bold text-mafia-gold">Incoming Offers</span>
              </div>
              {incoming.map(s => {
                const turnsLeft = s.expiresOnTurn - gameState.turn;
                const isUrgent = turnsLeft <= 1;
                const fam = s.fromFamily.charAt(0).toUpperCase() + s.fromFamily.slice(1);
                const dl = dealLabel(s.proposedDeal);
                const isTerritory = s.scope === 'territory';
                return (
                  <div
                    key={s.id}
                    className={cn(
                      'rounded-md border-2 p-2 text-xs space-y-1.5 cursor-pointer transition-colors',
                      isUrgent
                        ? 'bg-red-500/10 border-red-500/50 hover:bg-red-500/15'
                        : 'bg-mafia-gold/10 border-mafia-gold/40 hover:bg-mafia-gold/15'
                    )}
                    onClick={() => isTerritory && s.targetQ !== undefined && onFocusHex?.(s.targetQ, s.targetR!, s.targetS!)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold capitalize truncate">
                          {dl.icon} {dl.label}
                        </div>
                        <div className="text-muted-foreground text-[11px]">
                          From <span className="text-foreground capitalize font-semibold">{fam}</span>
                          {isTerritory && s.fromCapoName && (
                            <> · capo <span className="text-foreground">{s.fromCapoName}</span></>
                          )}
                        </div>
                        {isTerritory && s.targetQ !== undefined && (
                          <div className="text-[10px] text-muted-foreground">
                            Hex ({s.targetQ}, {s.targetR})
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {typeof s.proposedAmount === 'number' && (
                          <Badge variant="outline" className="text-[10px] h-4 text-green-400 border-green-400/40">
                            ${s.proposedAmount.toLocaleString()}
                          </Badge>
                        )}
                        <Badge className="text-[9px] h-4 bg-emerald-600/80">+{s.successBonus}%</Badge>
                        <Badge variant="outline" className={cn('text-[9px] h-4', isUrgent && 'text-red-400 border-red-400/50')}>
                          {isUrgent ? `⚠️ ${turnsLeft}t` : `${turnsLeft}t left`}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <Button
                        size="sm"
                        className="h-6 text-[10px] flex-1"
                        onClick={(e) => { e.stopPropagation(); onAcceptIncoming(s); }}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-6 text-[10px] px-2"
                        onClick={(e) => { e.stopPropagation(); onDeclineIncoming(s); }}
                        title="Decline — costs +5 tension"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

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
