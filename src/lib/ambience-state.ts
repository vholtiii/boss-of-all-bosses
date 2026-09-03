/**
 * Pure helpers that turn game state into the values the ambient city bed uses.
 * Kept side-effect free so they can be unit tested without any audio context.
 */

export type DistrictIdentity = 'industrial' | 'commercial' | 'residential' | 'docks' | 'neutral';

export interface AmbienceState {
  /** 0-100 police heat */
  heat: number;
  /** Player involved in at least one active war */
  atWar: boolean;
  /** 0-100 highest tension with any family */
  maxTension: number;
  /** 0-1 how well the player is doing (turf + income) */
  prosperity: number;
  /** 1-4 progression phase */
  phase: number;
  /** RICO clock running */
  ricoActive: boolean;
  /** Player hexes / total claimed hexes (0-1) */
  playerTerritoryRatio: number;
  /** Live player soldiers on board + in HQ */
  soldierCount: number;
  /** Soldiers recruited last turn; drives a short crowd swell */
  recruitedThisTurn: number;
  /** Dominant flavor among player-controlled districts */
  districtIdentity: DistrictIdentity;
  /** Player lost territory last turn */
  lostTerritoryThisTurn: boolean;
  /** Player declared or joined a war this turn */
  warDeclaredThisTurn: boolean;
}

export const NEUTRAL_AMBIENCE: AmbienceState = {
  heat: 0,
  atWar: false,
  maxTension: 0,
  prosperity: 0.35,
  phase: 1,
  ricoActive: false,
  playerTerritoryRatio: 0.2,
  soldierCount: 0,
  recruitedThisTurn: 0,
  districtIdentity: 'neutral',
  lostTerritoryThisTurn: false,
  warDeclaredThisTurn: false,
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));

/**
 * Prosperity blends territory share with net income.
 * 0 = broke and losing ground, 1 = rich and dominant.
 */
export const computeProsperity = (opts: {
  playerHexes: number;
  totalClaimedHexes: number;
  netIncome: number;
  money: number;
}): number => {
  const { playerHexes, totalClaimedHexes, netIncome, money } = opts;
  const share = totalClaimedHexes > 0 ? playerHexes / totalClaimedHexes : 0;
  // Territory contributes most of the signal; share of 0.5+ reads as "dominant".
  const turfScore = clamp01(share / 0.5);
  // Income: -5000 → 0, 0 → 0.4, +10000 → 1
  const incomeScore = netIncome >= 0
    ? clamp01(0.4 + (netIncome / 10000) * 0.6)
    : clamp01(0.4 + (netIncome / 5000) * 0.4);
  // Being flat broke drags everything down regardless of turf.
  const brokePenalty = money < 1000 ? 0.55 : money < 5000 ? 0.85 : 1;
  return clamp01((turfScore * 0.6 + incomeScore * 0.4) * brokePenalty);
};

/**
 * Classify a district code into an ambience identity.
 */
export const classifyDistrict = (district?: string): DistrictIdentity => {
  const d = (district || '').toLowerCase();
  if (d.includes('dock') || d.includes('port') || d.includes('harbor') || d.includes('waterfront')) return 'docks';
  if (d.includes('industrial') || d.includes('factory') || d.includes('manufacturing') || d.includes('warehouse')) return 'industrial';
  if (d.includes('commercial') || d.includes('business') || d.includes('financial') || d.includes('midtown')) return 'commercial';
  if (d.includes('residential') || d.includes('suburb') || d.includes('neighborhood')) return 'residential';
  return 'neutral';
};

/**
 * Pick the dominant district identity among player hexes.
 */
export const computeDistrictIdentity = (hexMap: any[], playerFamily: string): DistrictIdentity => {
  const counts: Record<DistrictIdentity, number> = {
    industrial: 0,
    commercial: 0,
    residential: 0,
    docks: 0,
    neutral: 0,
  };
  hexMap.forEach((h: any) => {
    if (h.controllingFamily !== playerFamily) return;
    const id = classifyDistrict(h.district);
    counts[id]++;
  });
  let best: DistrictIdentity = 'neutral';
  let bestCount = 0;
  (Object.keys(counts) as DistrictIdentity[]).forEach((k) => {
    if (counts[k] > bestCount) {
      bestCount = counts[k];
      best = k;
    }
  });
  return best;
};

export interface AmbienceMix {
  /** Filtered noise "rain"/street hiss */
  hiss: number;
  /** Low traffic rumble */
  rumble: number;
  /** Crowd murmur / distant radio */
  crowd: number;
  /** Cold empty wind */
  wind: number;
  /** Sub-bass tension drone */
  drone: number;
  /** Slow low police throb */
  policePulse: number;
  /** Siren bus level */
  siren: number;
  /** Gap in ms between siren wails */
  sirenGapMs: number;
  /** Distant gunfire bus level (0 = silent) */
  gunfire: number;
  /** Gap in ms between gunfire bursts (Infinity = never) */
  gunfireGapMs: number;
  /** Industrial / dock clang layer */
  industrial: number;
  /** Gangster chatter / racket buzz layer */
  chatter: number;
}

/**
 * Maps the live game state onto per-layer gains. Every value is continuous so
 * the hook can ramp instead of switching.
 */
export const computeAmbienceMix = (s: AmbienceState): AmbienceMix => {
  const heat = Math.max(0, Math.min(100, s.heat)) / 100;
  const tension = Math.max(0, Math.min(100, s.maxTension)) / 100;
  const prosperity = clamp01(s.prosperity);
  const phase = Math.max(1, Math.min(4, s.phase));
  // Phase 1 = sleepy backstreet, phase 4 = busy city
  const density = (phase - 1) / 3;
  const turf = clamp01(s.playerTerritoryRatio);
  const soldiers = Math.max(0, s.soldierCount);
  const soldierDensity = clamp01(soldiers / 25); // 25+ soldiers reads as "crowded"
  const recruitBoost = Math.min(1, s.recruitedThisTurn / 3); // 3+ recruits = full swell

  const conflict = Math.max(s.atWar ? 0.7 : 0, tension * 0.8);

  // Territory and soldiers make the city feel populated; losing ground makes it cold.
  const crowdBase = prosperity * (0.18 + density * 0.22);
  const turfCrowd = turf * 0.18;
  const soldierCrowd = soldierDensity * 0.18;
  const crowd = Math.min(0.75, crowdBase + turfCrowd + soldierCrowd + recruitBoost * 0.22);

  const wind = (1 - prosperity) * 0.22 + (1 - turf) * 0.12;

  // Industrial clang only when player controls industrial/dock territory.
  const isIndustrial = s.districtIdentity === 'industrial' || s.districtIdentity === 'docks';
  const industrial = isIndustrial ? 0.08 + turf * 0.18 + soldierDensity * 0.08 : 0;

  // Chatter / racket buzz rises with owned territory and soldiers.
  const chatter = turf * 0.12 + soldierDensity * 0.18 + recruitBoost * 0.12;

  return {
    hiss: 0.28 + density * 0.14,
    rumble: 0.08 + density * 0.1 + prosperity * 0.05,
    crowd,
    wind,
    drone: tension * 0.16 + (s.atWar ? 0.1 : 0),
    policePulse: s.ricoActive ? 0.2 : heat >= 0.8 ? 0.14 : heat >= 0.6 ? 0.06 : 0,
    siren: 0.25 + heat * 0.75,
    sirenGapMs: 55000 - heat * 41000,
    gunfire: conflict > 0.15 ? 0.1 + conflict * 0.25 : 0,
    gunfireGapMs: conflict > 0.15 ? 45000 - conflict * 28000 : Infinity,
    industrial,
    chatter,
  };
};

/**
 * Stinger triggers for one-shot ambience accents at turn start.
 */
export interface AmbienceStingers {
  warDeclared: boolean;
  territoryLost: boolean;
  recruitWave: boolean;
  heatCritical: boolean;
  ricoStarted: boolean;
}

export const computeAmbienceStingers = (state: AmbienceState): AmbienceStingers => ({
  warDeclared: state.warDeclaredThisTurn,
  territoryLost: state.lostTerritoryThisTurn,
  recruitWave: state.recruitedThisTurn >= 3,
  heatCritical: state.heat >= 80,
  ricoStarted: state.ricoActive,
});
