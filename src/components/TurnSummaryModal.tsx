import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Swords, DollarSign, Users, Shield } from 'lucide-react';

export interface TurnReportAIAction {
  family: string;
  action: string;
  detail: string;
}

export interface TurnReport {
  turn: number;
  income: number;
  maintenance: number;
  netIncome: number;
  aiActions: TurnReportAIAction[];
  events: string[];
  resourceDeltas: {
    money: number;
    soldiers: number;
    respect: number;
    influence: number;
    territories: number;
  };
  territoriesLost: string[];
  territoriesGained: string[];
}

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

const TurnSummaryModal: React.FC<TurnSummaryModalProps> = ({ report, open, onClose }) => {
  if (!report) return null;

  const deltaIcon = (val: number) => {
    if (val > 0) return <TrendingUp className="h-3 w-3 text-green-400" />;
    if (val < 0) return <TrendingDown className="h-3 w-3 text-red-400" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const deltaColor = (val: number) => val > 0 ? 'text-green-400' : val < 0 ? 'text-red-400' : 'text-muted-foreground';
  const formatDelta = (val: number) => val > 0 ? `+${val.toLocaleString()}` : val.toLocaleString();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md bg-noir-dark/95 border-primary/30 text-foreground backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-playfair text-mafia-gold flex items-center gap-2">
            📋 Turn {report.turn} Summary
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Here's what happened this turn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Income breakdown */}
          <div className="rounded-lg bg-background/40 border border-border/50 p-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Income
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Revenue:</span>
                <span className="ml-1 text-green-400 font-semibold">${report.income.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Costs:</span>
                <span className="ml-1 text-red-400 font-semibold">-${report.maintenance.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-border/30 text-sm font-bold">
              Net: <span className={deltaColor(report.netIncome)}>{formatDelta(report.netIncome)}</span>
            </div>
          </div>

          {/* Resource deltas */}
          <div className="rounded-lg bg-background/40 border border-border/50 p-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Resource Changes
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {[
                { label: 'Money', val: report.resourceDeltas.money, prefix: '$' },
                { label: 'Soldiers', val: report.resourceDeltas.soldiers, prefix: '' },
                { label: 'Respect', val: report.resourceDeltas.respect, prefix: '' },
                { label: 'Influence', val: report.resourceDeltas.influence, prefix: '' },
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
          </div>

          {/* AI Actions */}
          {report.aiActions.length > 0 && (
            <div className="rounded-lg bg-background/40 border border-border/50 p-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Swords className="h-3.5 w-3.5" /> Rival Activity
              </h4>
              <div className="space-y-1.5">
                {report.aiActions.map((a, i) => (
                  <div key={i} className="text-xs flex items-start gap-1.5">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${familyColors[a.family] || ''}`}>
                      {a.family.charAt(0).toUpperCase() + a.family.slice(1)}
                    </Badge>
                    <span className="text-muted-foreground">{a.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Territories gained/lost */}
          {(report.territoriesGained.length > 0 || report.territoriesLost.length > 0) && (
            <div className="rounded-lg bg-background/40 border border-border/50 p-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Territory Changes
              </h4>
              {report.territoriesGained.length > 0 && (
                <p className="text-xs text-green-400">
                  ✅ Gained: {report.territoriesGained.join(', ')}
                </p>
              )}
              {report.territoriesLost.length > 0 && (
                <p className="text-xs text-red-400">
                  ❌ Lost: {report.territoriesLost.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Events */}
          {report.events.length > 0 && (
            <div className="rounded-lg bg-background/40 border border-border/50 p-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">📰 Events</h4>
              <ul className="space-y-0.5">
                {report.events.map((ev, i) => (
                  <li key={i} className="text-xs text-muted-foreground">• {ev}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Button onClick={onClose} className="w-full font-playfair font-bold mt-2">
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default TurnSummaryModal;
