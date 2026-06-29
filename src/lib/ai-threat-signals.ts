/**
 * AI Threat Signals — pure derivation of "telegraphed" hostile setups
 * the player can see based on existing intel state.
 *
 * No new mechanics: only surfaces what's already in gameState.
 */

export interface ThreatSignal {
  family: string;
  hex: { q: number; r: number; s: number };
  district?: string;
  kind: 'staging' | 'capo_in_range' | 'plan_hit';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

const axialDist = (
  a: { q: number; r: number; s: number },
  b: { q: number; r: number; s: number }
) => (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;

/**
 * Look at scouted hexes (player intel) for enemy units sitting adjacent to
 * player-owned tiles. Returns at most ~6 signals to keep UI sane.
 */
export function getThreatSignals(gameState: any): ThreatSignal[] {
  if (!gameState) return [];
  const playerFamily: string = gameState.playerFamily;
  const scouted: any[] = gameState.scoutedHexes || [];
  const hexMap: any[] = gameState.hexMap || [];
  const playerTiles = hexMap.filter(
    (t) => t.controllingFamily === playerFamily || t.isHeadquarters === playerFamily
  );
  if (playerTiles.length === 0) return [];

  const out: ThreatSignal[] = [];
  for (const s of scouted) {
    if (!s.enemyFamily || s.enemyFamily === playerFamily) continue;
    if ((s.enemySoldierCount || 0) === 0) continue;
    // Distance to nearest player tile
    let minDist = Infinity;
    for (const t of playerTiles) {
      const d = axialDist(s, t);
      if (d < minDist) minDist = d;
    }
    if (minDist > 2) continue;
    const tile = hexMap.find((t) => t.q === s.q && t.r === s.r && t.s === s.s);
    const sev: ThreatSignal['severity'] = minDist <= 1 ? 'high' : 'medium';
    out.push({
      family: s.enemyFamily,
      hex: { q: s.q, r: s.r, s: s.s },
      district: tile?.district,
      kind: 'staging',
      severity: sev,
      description:
        minDist <= 1
          ? `${cap(s.enemyFamily)} forces adjacent to your territory${tile?.district ? ` in ${tile.district}` : ''}`
          : `${cap(s.enemyFamily)} staging near your border${tile?.district ? ` in ${tile.district}` : ''}`,
    });
    if (out.length >= 6) break;
  }
  return out;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
