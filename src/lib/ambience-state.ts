/**
 * Pure helpers that turn game state into the values the ambient city bed uses.
 * Kept side-effect free so they can be unit tested without any audio context.
 */

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
}

export const NEUTRAL_AMBIENCE: AmbienceState = {
  heat: 0,
  atWar: false,
  maxTension: 0,
  prosperity: 0.35,
  phase: 1,
  ricoActive: false,
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

  const conflict = Math.max(s.atWar ? 0.7 : 0, tension * 0.8);

  return {
    hiss: 0.28 + density * 0.14,
    rumble: 0.08 + density * 0.1 + prosperity * 0.05,
    crowd: prosperity * (0.18 + density * 0.22),
    wind: (1 - prosperity) * 0.22,
    drone: tension * 0.16 + (s.atWar ? 0.1 : 0),
    policePulse: s.ricoActive ? 0.2 : heat >= 0.8 ? 0.14 : heat >= 0.6 ? 0.06 : 0,
    siren: 0.25 + heat * 0.75,
    sirenGapMs: 55000 - heat * 41000,
    gunfire: conflict > 0.15 ? 0.1 + conflict * 0.25 : 0,
    gunfireGapMs: conflict > 0.15 ? 45000 - conflict * 28000 : Infinity,
  };
};
