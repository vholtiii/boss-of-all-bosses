import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Minus, Swords, DollarSign, Shield, Handshake, Flame, Scale, Map } from 'lucide-react';
import type { TurnReport, TurnReportReason } from '@/hooks/useEnhancedMafiaGameState';

export type { TurnReport };

interface TurnSummaryModalProps {
  report: TurnReport | null;
  open: boolean;
  onClose: () => void;
}

const familyColors: Record<string, string> = {
  gambino: 'text-cyan-400',
  genovese: 'text-green-400',
  lucchese: 'text-blue-400',
  bonanno: 'text-red-400',
  colombo: 'text-purple-400',
};

const postureLabels: Record<string, string> = {
  expand: 'Expanding',
  consolidate: 'Consolidating',
  aggress: 'On the Attack',
  turtle: 'Turtling Up',
  launder: 'Cleaning Money',
  desperate: 'Desperate',
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Heuristic: classify free-text events into Combat vs Diplomacy/Events buckets.
const COMBAT_RX = /\b(hit|kill|killed|attack|attacked|assault|war|battle|casualt|wound|raid|capture|captured|sabotage|destroyed|ambush|fight|fought|soldier)/i;
const isCombatEvent = (e: string) => COMBAT_RX.test(e);

/** Builds the front-page headline + subhead from the most dramatic entries
 *  in the structured turn report. */
function buildFrontPage(report: TurnReport): { headline: string; subhead: string } {
  const candidates: string[] = [];

  const wars = report.warUpdates || [];
  const started = wars.filter(w => w.event === 'started');
  const ended = wars.filter(w => w.event === 'ended');
  if (started.length > 0) {
    candidates.push(`WAR ERUPTS: ${started[0].families.split(' vs ').map(f => f.toUpperCase()).join(' AND ')} TAKE TO THE STREETS`);
  }
  if (ended.length > 0) {
    candidates.push(`PEACE AT LAST — ${ended[0].families.split(' vs ').map(cap).join(' and ')} bury the hatchet`);
  }

  const territory = report.territoryChanges || [];
  const lost = territory.filter(t => t.change === 'lost');
  const gained = territory.filter(t => t.change === 'gained');
  if (lost.length >= 2) candidates.push(`EMPIRE CRUMBLING? FAMILY CEDES ${lost.length} CITY BLOCKS`);
  else if (lost.length === 1) candidates.push(`TURF LOST IN ${lost[0].district.toUpperCase()} — ${lost[0].cause}`);
  if (gained.length >= 2) candidates.push(`LAND GRAB! ${gained.length} BLOCKS CHANGE HANDS IN A SINGLE WEEK`);
  else if (gained.length === 1) candidates.push(`NEW MUSCLE IN ${gained[0].district.toUpperCase()} AS TERRITORY CHANGES HANDS`);

  const prosecutionNet = (report.prosecutionReasons || []).reduce((s, r) => s + r.delta, 0);
  if (prosecutionNet >= 10) candidates.push(`PROSECUTORS SHARPEN KNIVES — GRAND JURY SAID TO BE CIRCLING`);

  const heatNet = (report.heatReasons || []).reduce((s, r) => s + r.delta, 0);
  if (heatNet >= 10) candidates.push(`POLICE CRACKDOWN LOOMS AFTER WEEK OF VIOLENCE`);
  else if (heatNet <= -8) candidates.push(`CITY BREATHES EASIER AS STREETS GO QUIET`);

  const net = report.incomeBreakdown?.net ?? (report.income - report.maintenance);
  if (net >= 8000) candidates.push(`BUSINESS IS BOOMING — RECORD TAKINGS DOWNTOWN`);
  else if (net < 0) candidates.push(`RED INK ON EVERY LEDGER — HARD TIMES FOR THE RACKETS`);

  if ((report.boldActions?.length || 0) > 0) candidates.push(`BRAZEN DAYLIGHT MOVE STUNS THE FIVE FAMILIES`);

  if (candidates.length === 0) candidates.push('QUIET WEEK IN THE FIVE BOROUGHS — FOR NOW');

  return {
    headline: candidates[0],
    subhead: candidates[1] || 'Full particulars in the sections below, as compiled by our man on the street.',
  };
}

const Section: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode; accent?: string }> = ({ title, icon, children, accent }) => (
  <div className={`border-t-2 pt-2 px-1 ${accent || 'border-[hsl(27,27%,13%)]/70'}`}>
    <h4 className="text-xs font-bold uppercase tracking-[0.15em] font-playfair mb-2 flex items-center gap-1.5">
      {icon} {title}
    </h4>
    {children}
  </div>
);

/** Renders a ledger of "reason → signed delta" rows with a computed total. */
const ReasonLedger: React.FC<{ reasons: TurnReportReason[]; unit?: string }> = ({ reasons, unit = '' }) => {
  const total = reasons.reduce((s, r) => s + r.delta, 0);
  const fmt = (v: number) => `${v > 0 ? '+' : ''}${Math.round(v * 10) / 10}${unit}`;
  return (
    <div className="space-y-0.5">
      {reasons.map((r, i) => (
        <div key={i} className="flex items-baseline justify-between gap-2 text-xs">
          <span className="text-muted-foreground">{r.reason}</span>
          <span className={`font-mono font-semibold shrink-0 ${r.delta > 0 ? 'text-red-400' : r.delta < 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
            {fmt(r.delta)}
          </span>
        </div>
      ))}
      <div className="flex items-baseline justify-between gap-2 text-xs pt-1 mt-1 border-t border-border/30 font-bold">
        <span>Net</span>
        <span className={`font-mono ${total > 0 ? 'text-red-400' : total < 0 ? 'text-green-400' : 'text-muted-foreground'}`}>{fmt(total)}</span>
      </div>
    </div>
  );
};

const TurnSummaryModal: React.FC<TurnSummaryModalProps> = ({ report, open, onClose }) => {
  if (!report) return null;

  const deltaIcon = (val: number) => {
    if (val > 0) return <TrendingUp className="h-3 w-3 text-green-400" />;
    if (val < 0) return <TrendingDown className="h-3 w-3 text-red-400" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const deltaColor = (val: number) => val > 0 ? 'text-green-400' : val < 0 ? 'text-red-400' : 'text-muted-foreground';
  const formatDelta = (val: number) => val > 0 ? `+${val.toLocaleString()}` : val.toLocaleString();

  const ib = report.incomeBreakdown;
  const heatReasons = report.heatReasons || [];
  const prosecutionReasons = report.prosecutionReasons || [];
  const loyaltyReasons = report.loyaltyReasons || [];
  const territoryChanges = report.territoryChanges || [];
  const supplyChanges = report.supplyChanges || [];
  const warUpdates = report.warUpdates || [];
  const relationshipChanges = report.relationshipChanges || [];
  const aiMotives = report.aiMotives || [];

  const combatEvents = report.events.filter(isCombatEvent);
  const otherEvents = report.events.filter(e => !isCombatEvent(e));

  const ledgerCount = (ib ? 1 : 0) + Object.values(report.resourceDeltas).filter(v => v !== 0).length;
  const lawCount = heatReasons.length + prosecutionReasons.length + loyaltyReasons.length;
  const mapCount = territoryChanges.length + supplyChanges.length + warUpdates.length + combatEvents.length;
  const rivalCount = report.aiActions.length + relationshipChanges.length + (report.boldActions?.length || 0) + otherEvents.length;

  const CountBadge: React.FC<{ n: number }> = ({ n }) =>
    n > 0 ? (
      <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px] border-current text-inherit">
        {n}
      </Badge>
    ) : null;

  const EmptyState: React.FC<{ label: string }> = ({ label }) => (
    <div className="text-xs italic text-center py-6 opacity-60">
      {label}
    </div>
  );

  const frontPage = buildFrontPage(report);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="newsprint max-w-xl bg-[hsl(44,25%,84%)] text-[hsl(27,27%,13%)] border-2 border-[hsl(27,27%,13%)] shadow-2xl">
        <DialogHeader className="space-y-0">
          {/* Masthead */}
          <div className="text-center border-b border-[hsl(27,27%,13%)]/60 pb-1">
            <div className="flex items-center justify-between text-[8px] uppercase tracking-[0.2em] opacity-60 font-courier">
              <span>Price: Two Cents</span>
              <span>Vol. {report.turn}</span>
              <span>New York City</span>
            </div>
            <DialogTitle className="font-playfair font-black text-3xl tracking-tight leading-none mt-0.5">
              The Five Boroughs Tribune
            </DialogTitle>
            <div className="newsprint-rule mt-1 py-0.5 text-[9px] uppercase tracking-[0.25em] font-courier">
              Turn {report.turn} · All the news the families don't want printed
            </div>
          </div>
          {/* Front-page headline generated from the turn report */}
          <div className="text-center pt-2 pb-1">
            <h2 className="font-playfair font-black text-xl leading-tight">
              {frontPage.headline}
            </h2>
            <DialogDescription className="text-xs italic mt-1 font-courier text-[hsl(32,18%,31%)]">
              {frontPage.subhead}
            </DialogDescription>
          </div>
        </DialogHeader>

        <Tabs defaultValue="ledger" className="w-full font-courier">
          <TabsList className="grid w-full grid-cols-4 bg-transparent border-y border-[hsl(27,27%,13%)]/60 rounded-none h-8">
            {([
              ['ledger', <DollarSign key="i" className="h-3 w-3 mr-0.5" />, 'Ledger', ledgerCount],
              ['law', <Scale key="i" className="h-3 w-3 mr-0.5" />, 'Heat & Law', lawCount],
              ['map', <Map key="i" className="h-3 w-3 mr-0.5" />, 'Territory', mapCount],
              ['rivals', <Handshake key="i" className="h-3 w-3 mr-0.5" />, 'Rivals', rivalCount],
            ] as const).map(([value, icon, label, count]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="text-xs px-1 rounded-none uppercase tracking-wide data-[state=active]:bg-[hsl(27,27%,13%)] data-[state=active]:text-[hsl(42,47%,89%)] data-[state=active]:shadow-none"
              >
                {icon} {label}
                <CountBadge n={count} />
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-3 max-h-[55vh] overflow-y-auto pr-1">
            {/* ═══════════ LEDGER ═══════════ */}
            <TabsContent value="ledger" className="space-y-3 mt-0">
              <Section title="Income Statement" icon={<DollarSign className="h-3.5 w-3.5" />}>
                {ib ? (
                  <div className="space-y-0.5 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Legal business income</span><span className="font-mono text-green-400">+${ib.legalGross.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Illegal rackets income</span><span className="font-mono text-green-400">+${ib.illegalGross.toLocaleString()}</span></div>
                    {ib.shareProfits > 0 && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Share-profits pacts</span><span className="font-mono text-green-400">+${ib.shareProfits.toLocaleString()}</span></div>
                    )}
                    {ib.penalties.map((p, i) => (
                      <div key={`p${i}`} className="flex justify-between">
                        <span className="text-amber-400/90">{p.label}</span>
                        <span className="font-mono text-red-400">{p.amount !== 0 ? `-$${Math.abs(p.amount).toLocaleString()}` : '—'}</span>
                      </div>
                    ))}
                    {ib.expenses.map((e, i) => (
                      <div key={`e${i}`} className="flex justify-between">
                        <span className="text-muted-foreground">{e.label}</span>
                        <span className="font-mono text-red-400">-${Math.abs(e.amount).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-1 mt-1 border-t border-border/30 font-bold">
                      <span>Net profit</span>
                      <span className={`font-mono ${deltaColor(ib.net)}`}>{ib.net >= 0 ? '+' : '-'}${Math.abs(ib.net).toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Revenue:</span><span className="ml-1 text-green-400 font-semibold">${report.income.toLocaleString()}</span></div>
                    <div><span className="text-muted-foreground">Costs:</span><span className="ml-1 text-red-400 font-semibold">-${report.maintenance.toLocaleString()}</span></div>
                  </div>
                )}
              </Section>

              <Section title="Resource Changes" icon={<Shield className="h-3.5 w-3.5" />}>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {[
                    { label: 'Money', val: report.resourceDeltas.money, prefix: '$' },
                    { label: 'Soldiers', val: report.resourceDeltas.soldiers, prefix: '' },
                    { label: 'Respect', val: report.resourceDeltas.respect, prefix: '' },
                    { label: 'Influence', val: report.resourceDeltas.influence, prefix: '' },
                    { label: 'Loyalty', val: report.resourceDeltas.loyalty, prefix: '' },
                    { label: 'Heat', val: report.resourceDeltas.heat, prefix: '' },
                    { label: 'Territories', val: report.resourceDeltas.territories, prefix: '' },
                  ].map(({ label, val, prefix }) => (
                    <div key={label} className="flex items-center gap-1">
                      {deltaIcon(val)}
                      <span className="text-muted-foreground">{label}:</span>
                      <span className={`font-semibold ${deltaColor(val)}`}>
                        {val > 0 ? '+' : ''}{prefix}{val.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            </TabsContent>

            {/* ═══════════ HEAT & LAW ═══════════ */}
            <TabsContent value="law" className="space-y-3 mt-0">
              {lawCount === 0 && <EmptyState label="No heat or legal developments this turn." />}

              {heatReasons.length > 0 && (
                <Section title="Why Your Heat Changed" icon={<Flame className="h-3.5 w-3.5" />}>
                  <ReasonLedger reasons={heatReasons} />
                </Section>
              )}

              {prosecutionReasons.length > 0 && (
                <Section title="Prosecution Risk Breakdown" icon={<Scale className="h-3.5 w-3.5" />}>
                  <ReasonLedger reasons={prosecutionReasons} />
                </Section>
              )}

              {loyaltyReasons.length > 0 && (
                <Section title="Why Family Loyalty Changed" icon={<Shield className="h-3.5 w-3.5" />}>
                  {/* Loyalty gains are good (green), losses bad (red) — inverse of heat coloring */}
                  <div className="space-y-0.5">
                    {loyaltyReasons.map((r, i) => (
                      <div key={i} className="flex items-baseline justify-between gap-2 text-xs">
                        <span className="text-muted-foreground">{r.reason}</span>
                        <span className={`font-mono font-semibold shrink-0 ${r.delta > 0 ? 'text-green-400' : r.delta < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                          {r.delta > 0 ? '+' : ''}{Math.round(r.delta * 10) / 10}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </TabsContent>

            {/* ═══════════ TERRITORY & WAR ═══════════ */}
            <TabsContent value="map" className="space-y-3 mt-0">
              {mapCount === 0 && <EmptyState label="No territorial or military changes this turn." />}

              {territoryChanges.length > 0 && (
                <Section title="Territory Changes" icon={<Map className="h-3.5 w-3.5" />}>
                  <div className="space-y-1">
                    {territoryChanges.map((tc, i) => (
                      <div key={i} className="text-xs flex items-start gap-1.5">
                        <span className={`shrink-0 ${tc.change === 'gained' ? 'text-green-400' : 'text-red-400'}`}>
                          {tc.change === 'gained' ? '✅' : '❌'}
                        </span>
                        <span className="text-muted-foreground">
                          <span className="text-foreground font-medium">{tc.district}</span> ({tc.hex}) — {tc.cause}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {supplyChanges.length > 0 && (
                <Section title="Supply Lines" accent="border-amber-500/40">
                  <div className="space-y-1">
                    {supplyChanges.map((sc, i) => (
                      <div key={i} className="text-xs flex items-start gap-1.5">
                        <span className={`shrink-0 ${sc.event === 'connected' ? 'text-green-400' : 'text-amber-400'}`}>
                          {sc.event === 'connected' ? '🔗' : '⛓️‍💥'}
                        </span>
                        <span className="text-muted-foreground">{sc.detail}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {warUpdates.length > 0 && (
                <Section title="Wars" icon={<Swords className="h-3.5 w-3.5" />} accent="border-red-500/40">
                  <div className="space-y-1">
                    {warUpdates.map((w, i) => (
                      <div key={i} className="text-xs flex items-start gap-1.5">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${
                          w.event === 'started' ? 'text-red-400 border-red-500/40' :
                          w.event === 'ended' ? 'text-green-400 border-green-500/40' :
                          'text-amber-400 border-amber-500/40'}`}>
                          {w.event === 'started' ? 'NEW' : w.event === 'ended' ? 'ENDED' : 'ONGOING'}
                        </Badge>
                        <span className="text-muted-foreground">
                          <span className="text-foreground font-medium">{w.families.split(' vs ').map(cap).join(' vs ')}</span>: {w.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {combatEvents.length > 0 && (
                <Section title="Combat Events" icon={<Swords className="h-3.5 w-3.5" />}>
                  <ul className="space-y-0.5">
                    {combatEvents.map((ev, i) => (
                      <li key={i} className="text-xs text-muted-foreground">• {ev}</li>
                    ))}
                  </ul>
                </Section>
              )}
            </TabsContent>

            {/* ═══════════ RIVALS & DIPLOMACY ═══════════ */}
            <TabsContent value="rivals" className="space-y-3 mt-0">
              {rivalCount === 0 && aiMotives.length === 0 && <EmptyState label="No rival activity or events this turn." />}

              {aiMotives.length > 0 && (
                <Section title="What the Families Are Thinking" icon={<Handshake className="h-3.5 w-3.5" />}>
                  <div className="space-y-1.5">
                    {aiMotives.map((m, i) => (
                      <div key={i} className="text-xs flex items-start gap-1.5">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${familyColors[m.family] || ''}`}>
                          {cap(m.family)}
                        </Badge>
                        <span className="text-muted-foreground">
                          <span className="text-foreground">{postureLabels[m.posture] || cap(m.posture)}</span> — {m.motive}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {relationshipChanges.length > 0 && (
                <Section title="Relationships">
                  <div className="space-y-1">
                    {relationshipChanges.map((rc, i) => (
                      <div key={i} className="text-xs flex items-center gap-1.5">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${familyColors[rc.family] || ''}`}>
                          {cap(rc.family)}
                        </Badge>
                        <span className={`font-mono font-semibold ${rc.delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {rc.delta > 0 ? '+' : ''}{rc.delta}
                        </span>
                        <span className="text-muted-foreground">{rc.reason}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {report.boldActions && report.boldActions.length > 0 && (
                <Section title="🔥 Bold Moves" accent="border-amber-500/40">
                  <div className="space-y-1">
                    {report.boldActions.map((b, i) => (
                      <div key={i} className="text-xs flex items-start gap-1.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 text-amber-300 border-amber-500/40">
                          +{b.respect} Respect
                        </Badge>
                        <span className="text-muted-foreground">{b.detail}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {report.aiActions.length > 0 && (
                <Section title="Rival Moves" icon={<Swords className="h-3.5 w-3.5" />}>
                  <div className="space-y-1.5">
                    {report.aiActions.map((a, i) => (
                      <div key={i} className="text-xs flex items-start gap-1.5">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${familyColors[a.family] || ''}`}>
                          {cap(a.family)}
                        </Badge>
                        <span className="text-muted-foreground">{a.detail}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {otherEvents.length > 0 && (
                <Section title="📰 Events">
                  <ul className="space-y-0.5">
                    {otherEvents.map((ev, i) => (
                      <li key={i} className="text-xs text-muted-foreground">• {ev}</li>
                    ))}
                  </ul>
                </Section>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <Button
          onClick={onClose}
          className="w-full font-playfair font-bold mt-2 rounded-none bg-[hsl(27,27%,13%)] text-[hsl(42,47%,89%)] hover:bg-[hsl(27,27%,20%)] uppercase tracking-[0.2em]"
        >
          Read All About It — Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default TurnSummaryModal;
