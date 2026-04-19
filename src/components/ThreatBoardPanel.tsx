import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Crosshair,
  Skull,
  Swords,
  Waves,
  DollarSign,
} from 'lucide-react';
import { EnhancedMafiaGameState } from '@/hooks/useEnhancedMafiaGameState';
import { getTensionPairKey } from '@/types/game-mechanics';

interface ThreatRow {
  id: string;
  label: string;
  sub?: string;
  badge?: { text: string; tone: 'danger' | 'warn' | 'muted' };
  hex?: { q: number; r: number; s: number };
  unitType?: 'soldier' | 'capo';
  severity: 'critical' | 'soft';
}

interface ThreatSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  rows: ThreatRow[];
}

interface ThreatBoardPanelProps {
  gameState: EnhancedMafiaGameState;
  onSelectUnit?: (unitType: string, hex: { q: number; r: number; s: number }) => void;
}

const familyName = (f: string) => f.charAt(0).toUpperCase() + f.slice(1);

const ThreatBoardPanel: React.FC<ThreatBoardPanelProps> = ({ gameState, onSelectUnit }) => {
  const [open, setOpen] = useState(false);
  const [userToggled, setUserToggled] = useState(false);
  const autoExpandedTurnRef = useRef<number | null>(null);

  const playerFamily = gameState.playerFamily;
  const turn = gameState.turn;
  const phase = (gameState as any).gamePhase || 1;
  const units = gameState.deployedUnits || [];

  // ── 1. Incoming Hits (rival Plan Hits against player units, intel-gated) ──
  const incomingHits: ThreatRow[] = [];
  const aiPlannedHits = gameState.aiPlannedHits || [];
  for (const ph of aiPlannedHits) {
    if (!ph.detectedVia) continue; // fog-of-war: only show if intel exists
    const target = units.find(u => u.id === ph.targetUnitId);
    if (!target || target.family !== playerFamily) continue;
    const targetLabel = target.type === 'capo' ? `Capo ${target.name || ''}`.trim() : 'Soldier';
    incomingHits.push({
      id: `incoming-${ph.family}-${ph.targetUnitId}`,
      label: `${familyName(ph.family)} → ${targetLabel}`,
      sub: `via ${ph.detectedVia.replace('_', ' ')}`,
      badge: {
        text: `${ph.turnsRemaining}t`,
        tone: ph.turnsRemaining <= 1 ? 'danger' : 'warn',
      },
      hex: { q: target.q, r: target.r, s: target.s },
      unitType: target.type as 'soldier' | 'capo',
      severity: 'critical',
    });
  }

  // ── 2. Active Hitman Contracts (yours) ──
  const hitmanRows: ThreatRow[] = [];
  for (const c of gameState.hitmanContracts || []) {
    const target = units.find(u => u.id === c.targetUnitId);
    const targetLabel = target
      ? `${target.type === 'capo' ? 'Capo' : 'Soldier'} (${familyName(c.targetFamily)})`
      : `Target (${familyName(c.targetFamily)})`;
    hitmanRows.push({
      id: `hitman-${c.id}`,
      label: targetLabel,
      sub: 'Yours · Contract Killer en route',
      badge: { text: `${c.turnsRemaining}t ETA`, tone: 'warn' },
      hex: target ? { q: target.q, r: target.r, s: target.s } : undefined,
      unitType: target?.type as 'soldier' | 'capo' | undefined,
      severity: 'soft',
    });
  }

  // ── 3. Wars & Ceasefires ──
  const diplomacyRows: ThreatRow[] = [];
  for (const war of gameState.activeWars || []) {
    if (war.family1 !== playerFamily && war.family2 !== playerFamily) continue;
    const other = war.family1 === playerFamily ? war.family2 : war.family1;
    diplomacyRows.push({
      id: `war-${other}`,
      label: `War with ${familyName(other)}`,
      sub: `Trigger: ${war.trigger.replace('_', ' ')}`,
      badge: { text: `${war.turnsRemaining}t left`, tone: 'danger' },
      severity: 'critical',
    });
  }
  for (const cf of gameState.ceasefires || []) {
    if (!cf.active || cf.turnsRemaining > 2) continue;
    diplomacyRows.push({
      id: `ceasefire-${cf.id}`,
      label: `Ceasefire with ${familyName(cf.family)} ending`,
      badge: { text: `${cf.turnsRemaining}t`, tone: 'warn' },
      severity: 'soft',
    });
  }
  for (const al of gameState.alliances || []) {
    if (!al.active || al.turnsRemaining > 2) continue;
    diplomacyRows.push({
      id: `alliance-${al.id}`,
      label: `Alliance with ${familyName(al.alliedFamily)} ending`,
      badge: { text: `${al.turnsRemaining}t`, tone: 'warn' },
      severity: 'soft',
    });
  }
  for (const sp of gameState.safePassagePacts || []) {
    if (!sp.active || sp.turnsRemaining > 2) continue;
    diplomacyRows.push({
      id: `safepass-${sp.id}`,
      label: `Safe passage with ${familyName(sp.targetFamily)} ending`,
      badge: { text: `${sp.turnsRemaining}t`, tone: 'warn' },
      severity: 'soft',
    });
  }
  // Tension nearing war (≥75)
  for (const opp of gameState.aiOpponents || []) {
    const key = getTensionPairKey(playerFamily, opp.family);
    const tension = (gameState.familyTensions || {})[key] || 0;
    const atWar = (gameState.activeWars || []).some(
      w => (w.family1 === playerFamily && w.family2 === opp.family) ||
           (w.family2 === playerFamily && w.family1 === opp.family)
    );
    if (atWar) continue;
    if (tension >= 75) {
      diplomacyRows.push({
        id: `tension-${opp.family}`,
        label: `Tension with ${familyName(opp.family)} critical`,
        sub: `Tension ${Math.round(tension)}/100 — war imminent`,
        badge: { text: 'HOT', tone: 'danger' },
        severity: 'critical',
      });
    }
  }

  // ── 4. Erosion / Expansion Watch (Phase 3+) ──
  const erosionRows: ThreatRow[] = [];
  if (phase >= 3) {
    for (const tile of gameState.hexMap || []) {
      // Player hex about to flip neutral via erosion (3-turn → flip; warn at 2+)
      if (
        tile.controllingFamily === playerFamily &&
        (tile.erosionCounter || 0) >= 2
      ) {
        erosionRows.push({
          id: `erosion-${tile.q}-${tile.r}`,
          label: `${tile.district || 'Hex'} eroding`,
          sub: 'Will flip neutral next turn — re-occupy',
          badge: { text: '⚠ 1t', tone: 'danger' },
          hex: { q: tile.q, r: tile.r, s: tile.s },
          severity: 'critical',
        });
      }
      // Rival expansion onto player-adjacent neutral about to flip rival (2-turn)
      if (
        !tile.controllingFamily &&
        (tile.expansionCounter || 0) >= 1 &&
        tile.expansionInfluencer &&
        tile.expansionInfluencer !== playerFamily
      ) {
        erosionRows.push({
          id: `expansion-${tile.q}-${tile.r}`,
          label: `${familyName(tile.expansionInfluencer)} expanding into ${tile.district || 'hex'}`,
          sub: 'Flips rival next turn unless contested',
          badge: { text: '⚠ 1t', tone: 'warn' },
          hex: { q: tile.q, r: tile.r, s: tile.s },
          severity: 'soft',
        });
      }
    }
  }

  // ── 5. Bounties & Marks (low-loyalty soldiers, marked-for-death) ──
  const bountyRows: ThreatRow[] = [];
  const aiBounties = gameState.aiBounties || [];
  for (const b of aiBounties) {
    if (b.targetFamily !== playerFamily) continue;
    bountyRows.push({
      id: `bounty-${b.fromFamily}-${b.expiresOnTurn}`,
      label: `Bounty from ${familyName(b.fromFamily)}`,
      sub: `Active for ${Math.max(0, b.expiresOnTurn - turn)} more turns`,
      badge: { text: 'HUNTED', tone: 'danger' },
      severity: 'critical',
    });
  }
  const stats = gameState.soldierStats || {};
  for (const u of units) {
    if (u.family !== playerFamily) continue;
    const s = stats[u.id];
    if (!s) continue;
    if (s.markedForDeath) {
      bountyRows.push({
        id: `mark-${u.id}`,
        label: `${u.type === 'capo' ? 'Capo' : 'Soldier'} marked for death`,
        sub: u.name || u.id.split('-').slice(-1)[0],
        badge: { text: `${s.markedTurnsRemaining ?? '?'}t`, tone: 'danger' },
        hex: { q: u.q, r: u.r, s: u.s },
        unitType: u.type as 'soldier' | 'capo',
        severity: 'critical',
      });
    } else if (s.loyalty < 40 && u.type === 'soldier') {
      bountyRows.push({
        id: `loyalty-${u.id}`,
        label: `Soldier loyalty ${Math.round(s.loyalty)}`,
        sub: 'Betrayal risk — promote, deploy, or pay up',
        badge: { text: 'LOW', tone: 'warn' },
        hex: { q: u.q, r: u.r, s: u.s },
        unitType: 'soldier',
        severity: 'soft',
      });
    }
  }

  const sections: ThreatSection[] = [
    { id: 'incoming', title: 'Incoming Hits', icon: <Crosshair className="h-3 w-3 text-destructive" />, rows: incomingHits },
    { id: 'hitman', title: 'Hitman Contracts', icon: <Skull className="h-3 w-3 text-amber-400" />, rows: hitmanRows },
    { id: 'diplomacy', title: 'Wars & Ceasefires', icon: <Swords className="h-3 w-3 text-destructive" />, rows: diplomacyRows },
    { id: 'erosion', title: 'Territory Watch', icon: <Waves className="h-3 w-3 text-amber-400" />, rows: erosionRows },
    { id: 'bounties', title: 'Bounties & Marks', icon: <DollarSign className="h-3 w-3 text-destructive" />, rows: bountyRows },
  ].filter(s => s.rows.length > 0);

  const totalCount = sections.reduce((acc, s) => acc + s.rows.length, 0);
  const hasCritical = sections.some(s => s.rows.some(r => r.severity === 'critical'));
  const hasIncomingHit = incomingHits.length > 0;

  // Auto-expand once when an incoming hit first appears this turn
  useEffect(() => {
    if (hasIncomingHit && autoExpandedTurnRef.current !== turn && !userToggled) {
      autoExpandedTurnRef.current = turn;
      setOpen(true);
    }
  }, [hasIncomingHit, turn, userToggled]);

  // Hidden when zero threats
  if (totalCount === 0) return null;

  const headerToneCls = hasCritical
    ? 'text-destructive'
    : 'text-amber-400';
  const badgeToneCls = hasCritical
    ? 'bg-destructive/20 border-destructive/40 text-destructive'
    : 'bg-amber-500/20 border-amber-500/40 text-amber-400';

  return (
    <div className={cn('rounded-lg border bg-card/80 px-3 py-2', hasCritical ? 'border-destructive/40' : 'border-amber-500/30', hasIncomingHit && !open && 'animate-pulse')}>
      <button
        data-no-sound
        onClick={() => { setUserToggled(true); setOpen(o => !o); }}
        className="flex items-center gap-2 w-full text-left"
      >
        <AlertTriangle className={cn('h-4 w-4', headerToneCls)} />
        <span className={cn('flex-1 text-sm font-bold uppercase tracking-wider font-playfair', headerToneCls)}>
          Threat Board
        </span>
        <Badge variant="outline" className={cn('text-[10px] h-5 border', badgeToneCls)}>
          {totalCount}
        </Badge>
        {open ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-3">
              {sections.length === 0 ? (
                <p className="text-xs text-muted-foreground italic px-1">All quiet. No active threats.</p>
              ) : (
                sections.map(section => (
                  <div key={section.id}>
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      {section.icon}
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {section.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70">({section.rows.length})</span>
                    </div>
                    <div className="space-y-1">
                      {section.rows.map(row => {
                        const clickable = !!(row.hex && row.unitType && onSelectUnit);
                        return (
                          <button
                            key={row.id}
                            data-no-sound
                            disabled={!clickable}
                            onClick={() => {
                              if (clickable && row.hex && row.unitType) {
                                onSelectUnit!(row.unitType, row.hex);
                              }
                            }}
                            className={cn(
                              'w-full text-left rounded border bg-background/60 px-2 py-1.5 transition-colors',
                              row.severity === 'critical'
                                ? 'border-destructive/30 hover:border-destructive/60'
                                : 'border-border hover:border-primary/40',
                              clickable && 'cursor-pointer hover:bg-accent/30',
                              !clickable && 'cursor-default opacity-90'
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-medium text-foreground truncate">
                                {row.label}
                              </span>
                              {row.badge && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-[9px] h-4 px-1.5 shrink-0 border',
                                    row.badge.tone === 'danger' && 'bg-destructive/20 border-destructive/40 text-destructive',
                                    row.badge.tone === 'warn' && 'bg-amber-500/20 border-amber-500/40 text-amber-400',
                                    row.badge.tone === 'muted' && 'bg-muted/30 border-muted text-muted-foreground'
                                  )}
                                >
                                  {row.badge.text}
                                </Badge>
                              )}
                            </div>
                            {row.sub && (
                              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                {row.sub}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThreatBoardPanel;
