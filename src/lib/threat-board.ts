import { EnhancedMafiaGameState } from '@/hooks/useEnhancedMafiaGameState';
import { getTensionPairKey } from '@/types/game-mechanics';

export interface ThreatRow {
  id: string;
  label: string;
  sub?: string;
  badge?: { text: string; tone: 'danger' | 'warn' | 'muted' };
  hex?: { q: number; r: number; s: number };
  unitType?: 'soldier' | 'capo';
  severity: 'critical' | 'soft';
}

export interface ThreatSection {
  id: string;
  title: string;
  iconEmoji: string;
  rows: ThreatRow[];
}

const familyName = (f: string) => f.charAt(0).toUpperCase() + f.slice(1);

export function buildThreatSections(gameState: EnhancedMafiaGameState): ThreatSection[] {
  const playerFamily = gameState.playerFamily;
  const turn = gameState.turn;
  const phase = (gameState as any).gamePhase || 1;
  const units = gameState.deployedUnits || [];

  // ── 1. Incoming Hits ──
  const incomingHits: ThreatRow[] = [];
  for (const ph of (gameState.aiPlannedHits || [])) {
    if (!ph.detectedVia) continue;
    const target = units.find(u => u.id === ph.targetUnitId);
    if (!target || target.family !== playerFamily) continue;
    const targetLabel = target.type === 'capo' ? `Capo ${target.name || ''}`.trim() : 'Soldier';
    incomingHits.push({
      id: `incoming-${ph.family}-${ph.targetUnitId}`,
      label: `${familyName(ph.family)} → ${targetLabel}`,
      sub: `via ${ph.detectedVia.replace('_', ' ')}`,
      badge: { text: `${ph.turnsRemaining}t`, tone: ph.turnsRemaining <= 1 ? 'danger' : 'warn' },
      hex: { q: target.q, r: target.r, s: target.s },
      unitType: target.type as 'soldier' | 'capo',
      severity: 'critical',
    });
  }

  // ── 2. Hitman Contracts ──
  const hitmanRows: ThreatRow[] = [];
  for (const c of (gameState.hitmanContracts || [])) {
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
  for (const war of (gameState.activeWars || [])) {
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
  for (const cf of (gameState.ceasefires || [])) {
    if (!cf.active || cf.turnsRemaining > 2) continue;
    diplomacyRows.push({
      id: `ceasefire-${cf.id}`,
      label: `Ceasefire with ${familyName(cf.family)} ending`,
      badge: { text: `${cf.turnsRemaining}t`, tone: 'warn' },
      severity: 'soft',
    });
  }
  for (const al of (gameState.alliances || [])) {
    if (!al.active || al.turnsRemaining > 2) continue;
    diplomacyRows.push({
      id: `alliance-${al.id}`,
      label: `Alliance with ${familyName(al.alliedFamily)} ending`,
      badge: { text: `${al.turnsRemaining}t`, tone: 'warn' },
      severity: 'soft',
    });
  }
  for (const sp of (gameState.safePassagePacts || [])) {
    if (!sp.active || sp.turnsRemaining > 2) continue;
    diplomacyRows.push({
      id: `safepass-${sp.id}`,
      label: `Safe passage with ${familyName(sp.targetFamily)} ending`,
      badge: { text: `${sp.turnsRemaining}t`, tone: 'warn' },
      severity: 'soft',
    });
  }
  for (const opp of (gameState.aiOpponents || [])) {
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

  // ── 4. Law Enforcement ──
  const lawRows: ThreatRow[] = [];
  const heat = (gameState as any).policeHeat?.level || 0;
  const ricoTimer = (gameState as any).ricoTimer || 0;
  const risk = (gameState as any).legalStatus?.prosecutionRisk || 0;
  const prosTimer = (gameState as any).prosecutionTimer || 0;
  const fedTimer = (gameState as any).federalIndictmentTimer || 0;

  if (heat >= 90) {
    lawRows.push({
      id: 'heat-rico',
      label: `RICO investigation — ${Math.max(1, 5 - ricoTimer)}t fuse`,
      sub: `Heat ${Math.round(heat)}/100 — federal indictment imminent`,
      badge: { text: 'RICO', tone: 'danger' },
      severity: 'critical',
    });
  } else if (heat >= 70) {
    lawRows.push({
      id: 'heat-critical',
      label: `Heat critical (${Math.round(heat)}/100)`,
      sub: 'Capo arrests possible each turn',
      badge: { text: 'TIER 3', tone: 'danger' },
      severity: 'critical',
    });
  } else if (heat >= 50) {
    lawRows.push({
      id: 'heat-high',
      label: `Heat high (${Math.round(heat)}/100)`,
      sub: '~20% soldier arrest chance per turn',
      badge: { text: 'TIER 2', tone: 'warn' },
      severity: 'soft',
    });
  } else if (heat >= 30) {
    lawRows.push({
      id: 'heat-elevated',
      label: `Heat elevated (${Math.round(heat)}/100)`,
      sub: 'Illegal income penalized',
      badge: { text: 'TIER 1', tone: 'warn' },
      severity: 'soft',
    });
  }

  if (risk >= 90 && fedTimer > 0) {
    lawRows.push({
      id: 'prosecution-federal',
      label: `Federal indictment in ${Math.max(1, 3 - fedTimer)}t`,
      sub: `Prosecution risk ${Math.round(risk)}/100`,
      badge: { text: 'INDICTMENT', tone: 'danger' },
      severity: 'critical',
    });
  } else if (risk >= 50 && prosTimer > 0) {
    lawRows.push({
      id: 'prosecution-arrest',
      label: `Soldier indictment in ${Math.max(1, 3 - prosTimer)}t`,
      sub: `Prosecution risk ${Math.round(risk)}/100`,
      badge: { text: 'INDICTMENT', tone: 'danger' },
      severity: 'critical',
    });
  } else if (risk >= 50) {
    lawRows.push({
      id: 'prosecution-risk-high',
      label: `Prosecution risk ${Math.round(risk)}/100`,
      sub: 'Sustained risk triggers grand jury',
      badge: { text: 'RISK', tone: 'warn' },
      severity: 'soft',
    });
  } else if (risk >= 30) {
    lawRows.push({
      id: 'prosecution-risk-climbing',
      label: `Prosecution risk climbing (${Math.round(risk)}/100)`,
      sub: 'Bribe officials or hire a lawyer',
      badge: { text: 'RISK', tone: 'warn' },
      severity: 'soft',
    });
  }

  for (const a of ((gameState as any).arrestedSoldiers || [])) {
    const remaining = Math.max(0, a.returnTurn - turn);
    lawRows.push({
      id: `jailed-soldier-${a.unitId}`,
      label: `Soldier jailed${a.source === 'prosecution' ? ' (federal)' : ''}`,
      sub: `Returns in ${remaining}t · maintenance still due`,
      badge: { text: `${remaining}t`, tone: 'warn' },
      severity: 'soft',
    });
  }
  for (const a of ((gameState as any).arrestedCapos || [])) {
    const remaining = Math.max(0, a.returnTurn - turn);
    lawRows.push({
      id: `jailed-capo-${a.unitId}`,
      label: `Capo jailed`,
      sub: `Returns in ${remaining}t · maintenance still due`,
      badge: { text: `${remaining}t`, tone: 'danger' },
      severity: 'critical',
    });
  }

  // ── 5. Erosion / Expansion ──
  const erosionRows: ThreatRow[] = [];
  if (phase >= 3) {
    for (const tile of (gameState.hexMap || [])) {
      if (tile.controllingFamily === playerFamily && (tile.erosionCounter || 0) >= 2) {
        erosionRows.push({
          id: `erosion-${tile.q}-${tile.r}`,
          label: `${tile.district || 'Hex'} eroding`,
          sub: 'Will flip neutral next turn — re-occupy',
          badge: { text: '⚠ 1t', tone: 'danger' },
          hex: { q: tile.q, r: tile.r, s: tile.s },
          severity: 'critical',
        });
      }
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

  // ── 6. Bounties & Marks ──
  const bountyRows: ThreatRow[] = [];
  for (const b of ((gameState as any).aiBounties || [])) {
    if (b.targetFamily !== playerFamily) continue;
    bountyRows.push({
      id: `bounty-${b.fromFamily}-${b.expiresOnTurn}`,
      label: `Bounty from ${familyName(b.fromFamily)}`,
      sub: `Active for ${Math.max(0, b.expiresOnTurn - turn)} more turns`,
      badge: { text: 'HUNTED', tone: 'danger' },
      severity: 'critical',
    });
  }
  const stats = (gameState as any).soldierStats || {};
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

  return [
    { id: 'incoming', title: 'Incoming Hits', iconEmoji: '🎯', rows: incomingHits },
    { id: 'hitman', title: 'Hitman Contracts', iconEmoji: '💀', rows: hitmanRows },
    { id: 'diplomacy', title: 'Wars & Pacts', iconEmoji: '⚔️', rows: diplomacyRows },
    { id: 'law', title: 'Law Enforcement', iconEmoji: '⚖️', rows: lawRows },
    { id: 'erosion', title: 'Territory Watch', iconEmoji: '🌊', rows: erosionRows },
    { id: 'bounties', title: 'Bounties & Marks', iconEmoji: '💰', rows: bountyRows },
  ].filter(s => s.rows.length > 0);
}
