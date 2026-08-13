import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Handshake, DoorOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Basket, Chip, ChipSide, ChipTemplate } from '@/types/negotiation';
import {
  CHIP_TEMPLATES, computeLeverage, evaluateBasket, aiCounterCash, settleBasket,
  newChip, basketValue, type LeverageInput,
} from '@/lib/sitdown-valuation';
import { getStandingAgreements } from '@/lib/standing-agreements';
import ChipCard from './ChipCard';
import LeverageMeter from './LeverageMeter';
import VerdictBar from './VerdictBar';

export interface SitdownSession {
  scope: 'family' | 'territory';
  targetFamily: string;
  capoName?: string;
  capoPersonality?: any;
  proposerLabel?: string;
  /** AI-initiated: the deal they're asking for and the price they named. */
  lockedDealType?: string;
  proposedAmount?: number;
  hex?: { q: number; r: number; s: number };
  hexIncome?: number;
  playerForce?: number;
  enemyForce?: number;
  theyAskedForThis?: boolean;
  cooldown?: boolean;
}

export interface SitdownSubmitPayload {
  dealType: string | null;
  cash: number;
  accepted: boolean;
  extras: { favorTo?: ChipSide; intelTo?: ChipSide };
  basket: Basket;
}

interface SitdownSceneProps {
  open: boolean;
  session: SitdownSession;
  gameState: any;
  onClose: () => void;
  onSubmit: (payload: SitdownSubmitPayload) => void;
}

const cap = (s: string) => (s || '').charAt(0).toUpperCase() + (s || '').slice(1);

const DEAL_TO_CHIP: Record<string, string> = {
  bribe_territory: 'territory',
  share_profits: 'tribute',
  ceasefire: 'ceasefire',
  alliance: 'alliance',
  safe_passage: 'safe_passage',
  supply_deal: 'supply_access',
};

const SitdownScene: React.FC<SitdownSceneProps> = ({ open, session, gameState, onClose, onSubmit }) => {
  const [chips, setChips] = useState<Chip[]>([]);
  const basket: Basket = useMemo(() => ({ chips }), [chips]);

  const playerMoney = gameState?.resources?.money || 0;
  const owedFavors = (gameState?.owedFavors || []) as any[];
  const theyOweFavor = owedFavors.some(f => f.family === session.targetFamily && f.direction === 'they_owe');

  const leverageInput: LeverageInput = useMemo(() => ({
    scope: session.scope,
    playerForce: session.playerForce,
    enemyForce: session.enemyForce,
    respect: gameState?.reputation?.respect || 0,
    influence: gameState?.resources?.influence || 0,
    fear: gameState?.reputation?.fear || 0,
    relationship: gameState?.reputation?.familyRelationships?.[session.targetFamily] || 0,
    tension: gameState?.familyTensions?.[session.targetFamily] ?? gameState?.tensions?.[session.targetFamily] ?? 0,
    capoPersonality: session.scope === 'territory' ? session.capoPersonality : undefined,
    treacheryActive: (gameState?.treacheryDebuff?.turnsRemaining || 0) > 0,
    atWar: !!gameState?.warsWith?.includes?.(session.targetFamily),
    theyAskedForThis: !!session.theyAskedForThis,
    theyOweFavor: theyOweFavor && chips.some(c => c.kind === 'favor' && c.from === 'them'),
  }), [session, gameState, theyOweFavor, chips]);

  const leverage = useMemo(() => computeLeverage(leverageInput), [leverageInput]);
  const verdict = useMemo(() => evaluateBasket(basket, leverage, leverageInput), [basket, leverage, leverageInput]);
  const agreements = useMemo(() => getStandingAgreements(gameState || {}), [gameState]);

  // Seed the table: AI-initiated sitdowns arrive pre-loaded with their ask.
  useEffect(() => {
    if (!open) return;
    const seeded: Chip[] = [];
    const askKind = session.lockedDealType ? DEAL_TO_CHIP[session.lockedDealType] : undefined;
    if (askKind) {
      const tpl = CHIP_TEMPLATES.find(t => t.kind === askKind);
      seeded.push(newChip({
        kind: askKind as any, from: 'them',
        turns: tpl?.defaultTurns, pct: tpl?.defaultPct,
        hex: session.hex, hexIncome: session.hexIncome,
      }));
    }
    if (typeof session.proposedAmount === 'number' && session.proposedAmount > 0) {
      seeded.push(newChip({ kind: 'cash', from: 'player', amount: session.proposedAmount }));
    }
    setChips(seeded);
  }, [open, session.lockedDealType, session.proposedAmount, session.hex, session.hexIncome]);

  const addChip = useCallback((tpl: ChipTemplate, from: ChipSide) => {
    setChips(prev => [...prev, newChip({
      kind: tpl.kind, from,
      amount: tpl.defaultAmount,
      turns: tpl.defaultTurns,
      pct: tpl.defaultPct,
      hex: tpl.needsHex ? session.hex : undefined,
      hexIncome: session.hexIncome,
    })]);
  }, [session.hex, session.hexIncome]);

  const patchChip = (id: string, patch: Partial<Chip>) =>
    setChips(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));
  const removeChip = (id: string) => setChips(prev => prev.filter(c => c.id !== id));

  const meetTheirNumber = () => {
    const needed = aiCounterCash(basket, leverage, leverageInput);
    setChips(prev => {
      const withoutCash = prev.filter(c => !(c.from === 'player' && c.kind === 'cash'));
      return needed > 0 ? [...withoutCash, newChip({ kind: 'cash', from: 'player', amount: needed })] : withoutCash;
    });
  };

  const templatesFor = (side: ChipSide) => CHIP_TEMPLATES.filter(t =>
    t.sides.includes(side) &&
    (t.scope === 'both' || t.scope === session.scope) &&
    (!t.needsHex || !!session.hex) &&
    !(t.kind === 'favor' && side === 'them' && !theyOweFavor) &&
    !chips.some(c => c.kind === t.kind && c.from === side && t.kind !== 'cash'),
  );

  const yourChips = chips.filter(c => c.from === 'player');
  const theirChips = chips.filter(c => c.from === 'them');
  const cashOffered = yourChips.filter(c => c.kind === 'cash').reduce((s, c) => s + (c.amount || 0), 0);
  const canAfford = playerMoney >= cashOffered;
  const canSign = verdict.accepts && theirChips.length > 0 && canAfford && !session.cooldown;

  const submit = (accepted: boolean) => {
    const settled = settleBasket(basket);
    onSubmit({
      dealType: settled.dealType,
      cash: settled.cash,
      accepted,
      extras: { favorTo: settled.favorTo, intelTo: settled.intelTo },
      basket,
    });
  };

  if (!open) return null;

  const title = session.scope === 'family'
    ? `Sitdown with the ${cap(session.targetFamily)} Boss`
    : `Sitdown with ${session.capoName || `a ${cap(session.targetFamily)} capo`}`;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 backdrop-blur-md p-3 sm:p-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        {/* Smoky table vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,hsl(var(--background))_85%)]" />

        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          className="relative flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-primary/30 bg-card/90 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 py-3">
            <div className="min-w-0">
              <h2 className="font-playfair text-lg text-primary sm:text-xl">{title}</h2>
              <p className="text-[11px] text-muted-foreground">
                {session.proposerLabel
                  ? `📩 ${session.proposerLabel} called this sitdown`
                  : 'You called this sitdown. Put something on the table.'}
                {session.hex && ` · Block (${session.hex.q}, ${session.hex.r})`}
              </p>
            </div>
            <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:text-foreground" aria-label="Leave the table">
              <X className="h-4 w-4" />
            </button>
          </div>

          {session.cooldown && (
            <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive">
              ⏳ Nobody on your side can sign this turn — the last sitdown is still cooling off.
            </div>
          )}

          {/* Body */}
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
            {/* Left: leverage + standing deals */}
            <aside className="space-y-3">
              <div className="rounded-md border border-border/60 bg-background/40 p-3">
                <LeverageMeter leverage={leverage} />
              </div>
              <div className="rounded-md border border-border/60 bg-background/40 p-3">
                <div className="mb-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">On the books</div>
                {agreements.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">No standing agreements.</p>
                ) : (
                  <ul className="space-y-1">
                    {agreements.map(a => (
                      <li key={a.id} className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="truncate">{a.icon} {a.label}</span>
                        <Badge variant="outline" className="h-4 shrink-0 text-[9px]">{a.turnsRemaining}t</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>

            {/* Right: the table */}
            <section className="space-y-3">
              {/* Their side */}
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    What you want from {cap(session.targetFamily)}
                  </span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    ≈${basketValue(basket, 'them').toLocaleString()}
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {theirChips.map(c => (
                    <ChipCard key={c.id} chip={c}
                      onChange={(p) => patchChip(c.id, p)}
                      onRemove={() => removeChip(c.id)} />
                  ))}
                  <AddChipButton templates={templatesFor('them')} onAdd={(t) => addChip(t, 'them')} label="Ask for…" />
                </div>
              </div>

              {/* Your side */}
              <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">What you put up</span>
                  <span className={cn('text-[11px] tabular-nums', canAfford ? 'text-muted-foreground' : 'text-destructive')}>
                    ≈${basketValue(basket, 'player').toLocaleString()} · cash ${cashOffered.toLocaleString()} / ${playerMoney.toLocaleString()}
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {yourChips.map(c => (
                    <ChipCard key={c.id} chip={c}
                      onChange={(p) => patchChip(c.id, p)}
                      onRemove={() => removeChip(c.id)} />
                  ))}
                  <AddChipButton templates={templatesFor('player')} onAdd={(t) => addChip(t, 'player')} label="Offer…" />
                </div>
              </div>

              <VerdictBar verdict={verdict} />
            </section>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-4 py-3">
            <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5">
              <DoorOpen className="h-4 w-4" /> Walk away
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              {theirChips.length > 0 && !verdict.accepts && (
                <Button variant="outline" size="sm" onClick={meetTheirNumber}>
                  Meet their number
                </Button>
              )}
              <Button
                size="sm"
                disabled={!canSign}
                onClick={() => submit(true)}
                className="gap-1.5"
                title={!canAfford ? 'You cannot cover that cash' : undefined}
              >
                <Handshake className="h-4 w-4" /> Shake on it
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const AddChipButton: React.FC<{ templates: ChipTemplate[]; onAdd: (t: ChipTemplate) => void; label: string }> = ({ templates, onAdd, label }) => {
  const [open, setOpen] = useState(false);
  if (templates.length === 0) return null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex min-h-[52px] items-center justify-center gap-1.5 rounded-md border border-dashed border-border/70 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="start">
        {templates.map(t => (
          <button
            key={t.kind}
            type="button"
            onClick={() => { onAdd(t); setOpen(false); }}
            className="flex w-full flex-col items-start rounded px-2 py-1.5 text-left text-xs hover:bg-muted"
          >
            <span className="font-semibold">{t.icon} {t.label}</span>
            <span className="text-[10px] text-muted-foreground">{t.description}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default SitdownScene;
