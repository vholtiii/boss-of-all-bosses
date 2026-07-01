/**
 * AI Strategy helpers — variability, reactive moods, target scoring,
 * and family signature preferences.
 *
 * Pure functions. No React, no state mutation. Designed to be called from
 * processAITurn() in useEnhancedMafiaGameState.ts.
 */

export type AIPersonality = 'aggressive' | 'defensive' | 'opportunistic' | 'diplomatic' | 'unpredictable';
export type DynamicMood = 'neutral' | 'desperate' | 'cornered' | 'dominant' | 'cautious';
export type FamilyId = 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
export type AIDifficulty = 'easy' | 'normal' | 'hard';

/** Softmax temperature controls how greedily the AI picks top-scoring targets.
 *  Lower = more deterministic/optimal; higher = more exploratory/random. */
export function difficultySoftmaxTemperature(d: AIDifficulty): number {
  return d === 'hard' ? 1.0 : d === 'easy' ? 2.2 : 1.5;
}

/** Multiplier applied to mood-trigger sensitivity (rivalAvg comparison). */
export function difficultyMoodSensitivity(d: AIDifficulty): number {
  return d === 'hard' ? 1.3 : d === 'easy' ? 0.5 : 1.0;
}

// ─── PRNG (mulberry32) ────────────────────────────────────────────────
export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── 1. Per-game personality variability ─────────────────────────────
const PERSONALITY_WEIGHTS: Record<FamilyId, Record<AIPersonality, number>> = {
  gambino:  { diplomatic: 35, defensive: 25, opportunistic: 20, aggressive: 15, unpredictable: 5  },
  genovese: { aggressive: 45, opportunistic: 25, unpredictable: 15, defensive: 10, diplomatic: 5  },
  lucchese: { opportunistic: 40, aggressive: 20, diplomatic: 20, defensive: 15, unpredictable: 5  },
  bonanno:  { defensive: 45, opportunistic: 20, diplomatic: 20, aggressive: 10, unpredictable: 5  },
  colombo:  { unpredictable: 40, aggressive: 35, opportunistic: 15, diplomatic: 5, defensive: 5   },
};

const FAMILY_BASELINE: Record<FamilyId, { aggression: number; risk: number; cooperation: number; goal: 'territory' | 'money' | 'reputation' | 'elimination'; focus: string[] }> = {
  gambino:  { aggression: 50, risk: 40, cooperation: 60, goal: 'money',       focus: ['Little Italy', 'Manhattan'] },
  genovese: { aggression: 80, risk: 70, cooperation: 30, goal: 'territory',   focus: ['Manhattan', 'Bronx'] },
  lucchese: { aggression: 40, risk: 50, cooperation: 60, goal: 'money',       focus: ['Brooklyn', 'Queens'] },
  bonanno:  { aggression: 25, risk: 30, cooperation: 70, goal: 'reputation',  focus: ['Staten Island', 'Little Italy'] },
  colombo:  { aggression: 95, risk: 90, cooperation: 10, goal: 'elimination', focus: ['Queens', 'Brooklyn'] },
};

export function rollFamilyPersonality(family: FamilyId, rng: () => number): AIPersonality {
  const w = PERSONALITY_WEIGHTS[family];
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (const [p, weight] of Object.entries(w)) {
    r -= weight;
    if (r <= 0) return p as AIPersonality;
  }
  return 'opportunistic';
}

export function rollFamilyStrategy(family: FamilyId, rng: () => number) {
  const base = FAMILY_BASELINE[family];
  const jitter = (range: number) => Math.floor((rng() * 2 - 1) * range);
  return {
    aggressionLevel: Math.max(0, Math.min(100, base.aggression + jitter(20))),
    riskTolerance:   Math.max(0, Math.min(100, base.risk + jitter(20))),
    cooperationTendency: Math.max(0, Math.min(100, base.cooperation + jitter(20))),
    primaryGoal: base.goal,
    focusAreas: base.focus,
  };
}

// ─── 2. Dynamic mood (reactive) ──────────────────────────────────────
export interface MoodInputs {
  myHexes: number;
  rivalAvgHexes: number;
  myMoney: number;
  myUpkeepPerTurn: number;
  myHeat: number;
  recentCapoLosses: number;
  hqAssaultedRecently: boolean;
  isAtWar: boolean;
  phase: number;
}

export function computeDynamicMood(i: MoodInputs): DynamicMood {
  // Order matters — first match wins
  if (i.myMoney < i.myUpkeepPerTurn * 2) return 'cornered';
  if (i.hqAssaultedRecently || i.recentCapoLosses >= 2) return 'desperate';
  if (i.rivalAvgHexes > 0 && i.myHexes < i.rivalAvgHexes * 0.6) return 'desperate';
  if (i.myHeat >= 70) return 'cautious';
  if (i.rivalAvgHexes > 0 && i.myHexes > i.rivalAvgHexes * 1.3) return 'dominant';
  return 'neutral';
}

/**
 * Blend base personality with mood. Returns the *effective* personality
 * the AI should act with this turn.
 */
export function blendMoodWithPersonality(base: AIPersonality, mood: DynamicMood): AIPersonality {
  switch (mood) {
    case 'desperate':
    case 'cautious':
      // Lean defensive unless already aggressive war-mode (caller handles war override)
      if (base === 'aggressive') return 'opportunistic';
      return 'defensive';
    case 'cornered':
      return 'opportunistic';
    case 'dominant':
      if (base === 'defensive' || base === 'diplomatic') return 'opportunistic';
      return 'aggressive';
    case 'neutral':
    default:
      return base;
  }
}

// ─── 3. Hex target scoring ───────────────────────────────────────────
export interface ScoreHexInputs {
  hexIncome: number;          // 0 if no business
  defenderCount: number;      // friendly-to-defender units on the hex
  isInFocusDistrict: boolean;
  distanceToOwnHQ: number;
  isFortified: boolean;
  isSafehouse: boolean;
  hasScoutIntel: boolean;
  isWarTarget: boolean;
  isAdjacentToOwnTerritory: boolean;
  isPlayerHex: boolean;
  effectivePersonality: AIPersonality;
  signaturePref: FamilySignature;
  phase: number;
  mood: DynamicMood;
  /** small jitter in [-1, +1] from per-turn rng for tie-breaking */
  jitter: number;
  /** Game difficulty — scales scoring sharpness. Defaults to 'normal' if omitted. */
  difficulty?: AIDifficulty;
  /** Posture-driven multiplier on war-target weight (WAR/PRESSURE_LEADER ≥1.5). Default 1. */
  warTargetMul?: number;
  /** Posture-driven multiplier on the "weak hex" (defenderCount===0) bonus (EXPAND >1). Default 1. */
  expandMul?: number;
  /** Posture-driven multiplier on owned-adjacency consolidation bonus (BUILD_ECONOMY/CONSOLIDATE >1). Default 1. */
  economyFocusMul?: number;
  /** True if this hex contains a rival supply node within striking distance of own HQ/safehouse. */
  isSupplyNodeTarget?: boolean;
  /** Posture-driven multiplier on the supply-node bonus (WAR/PRESSURE_LEADER >1, COOL_OFF/CONSOLIDATE 0). Default 1. */
  supplyNodeMul?: number;
  /** Base bonus added when isSupplyNodeTarget is true (scaled by difficulty). Default 7. */
  supplyNodeBonus?: number;
  /** True if the supply node feeds a business inside one of this AI's focus districts. */
  supplyNodeInFocusDistrict?: boolean;
  /** True if the supply node's owning rival currently has an active supply deal with the player. */
  supplyNodeFeedsPlayerDeal?: boolean;
  /** True if the owning family is currently flagged "vulnerable" (recent losses or critical/rico heat). */
  isVulnerableRivalHex?: boolean;
}

export function scoreHexForAI(i: ScoreHexInputs): number {
  let raw = 0;
  // Track positive vs. negative components separately so difficulty can
  // asymmetrically scale opportunity-seeking vs. risk-aversion.
  let pos = 0; let neg = 0;
  const add = (v: number) => { if (v >= 0) pos += v; else neg += v; raw += v; };
  // Base attraction: businesses
  add(Math.min(20, i.hexIncome / 200));
  // Weak hex bonus / strong hex penalty
  const expandMul = i.expandMul ?? 1;
  if (i.defenderCount === 0) add(6 * expandMul);
  else if (i.defenderCount === 1) add(1);
  else add(-4);
  // Family identity: focus districts
  if (i.isInFocusDistrict) add(4);
  // Don't overextend
  add(-Math.max(0, i.distanceToOwnHQ - 3) * 1.5);
  // Consolidation bonus (defensive moods love this)
  const econMul = i.economyFocusMul ?? 1;
  if (i.isAdjacentToOwnTerritory) {
    const base = i.mood === 'desperate' || i.mood === 'cautious' ? 5 : 2;
    add(base * econMul);
  }
  // Avoid fortified / safehouses without intel
  if (i.isFortified) add(-5);
  if (i.isSafehouse && !i.hasScoutIntel) add(-4);
  if (i.isSafehouse && i.hasScoutIntel) add(3); // bounty + intel target
  // War prioritization
  if (i.isWarTarget) add(10 * (i.warTargetMul ?? 1));
  // Supply-line targeting: cut rival supply nodes within striking distance of own HQ/safehouse.
  // Posture multiplier drives intensity (WAR 1.5, PRESSURE_LEADER 1.4, COOL_OFF 0).
  if (i.isSupplyNodeTarget) {
    const supplyMul = i.supplyNodeMul ?? 1;
    const supplyBase = i.supplyNodeBonus ?? 7;
    add(supplyBase * supplyMul);
    if (i.supplyNodeInFocusDistrict) add(4);
    if (i.supplyNodeFeedsPlayerDeal) add(5);
  }
  // Vulnerable-rival pile-on: hexes belonging to a flagged-vulnerable rival get a flat bonus.
  if (i.isVulnerableRivalHex) add(6);
  // Phase 4 endgame: lean toward player when winning
  if (i.phase >= 4 && i.isPlayerHex && i.mood === 'dominant') add(4);

  // Personality biases
  switch (i.effectivePersonality) {
    case 'aggressive':
      if (i.defenderCount === 0) add(2);
      add(2);
      break;
    case 'defensive':
      if (i.isAdjacentToOwnTerritory) add(3);
      add(-2);
      break;
    case 'opportunistic':
      if (i.defenderCount === 0 && i.hexIncome > 1000) add(4);
      break;
    case 'diplomatic':
      if (i.isPlayerHex) add(-3);
      if (i.isAdjacentToOwnTerritory) add(2);
      break;
    case 'unpredictable':
      add(i.jitter * 4);
      break;
  }

  // Signature preferences
  if (i.signaturePref.preferExtort && i.hexIncome > 0 && i.isPlayerHex) add(2);
  if (i.signaturePref.preferAdjacentExpansion && i.isAdjacentToOwnTerritory) add(2);
  if (i.signaturePref.preferHighValueOnly && i.hexIncome < 1000) add(-2);

  // ── Difficulty asymmetric scaling ──
  // Easy AI undervalues opportunities and overestimates risk; Hard AI does the opposite.
  const diff = i.difficulty || 'normal';
  const posMul = diff === 'hard' ? 1.15 : diff === 'easy' ? 0.85 : 1.0;
  const negMul = diff === 'hard' ? 0.85 : diff === 'easy' ? 1.15 : 1.0;
  let s = pos * posMul + neg * negMul;

  // Always sprinkle a little jitter so identical scores don't tie
  s += i.jitter * 0.8;
  return s;
}


/**
 * Softmax-pick from candidates. Returns index of selected candidate.
 * Top-K filters first to avoid silly low-score picks.
 *
 * When `topK` is omitted, a dynamic cap is used: keeps things greedy on tiny pools
 * (2-4 candidates) and gets more exploratory as the pool grows.
 */
export function softmaxPick(scores: number[], rng: () => number, topK?: number, temperature = 1.5): number {
  if (scores.length === 0) return -1;
  if (scores.length === 1) return 0;
  const k = topK !== undefined
    ? Math.min(topK, scores.length)
    : Math.min(scores.length, 3 + Math.floor(scores.length / 4));
  // Sort indices by score desc and keep topK
  const idxs = scores.map((_, i) => i).sort((a, b) => scores[b] - scores[a]).slice(0, k);
  const top = idxs.map(i => scores[i]);
  const max = Math.max(...top);
  const exps = top.map(s => Math.exp((s - max) / temperature));
  const sum = exps.reduce((a, b) => a + b, 0);
  let r = rng() * sum;
  for (let k2 = 0; k2 < exps.length; k2++) {
    r -= exps[k2];
    if (r <= 0) return idxs[k2];
  }
  return idxs[0];
}

// ─── 4. Target-scoring helpers (plan hit / hitman / deploy) ─────────
export interface PlanHitTargetInputs {
  /** Capo level (1+). Higher = more valuable target. */
  level: number;
  /** Chebyshev/hex distance from any of AI's border hexes. */
  distanceToBorder: number;
  /** Is AI at war with owner? */
  atWar: boolean;
  /** Distance from the target capo to its own HQ (harder to kill near HQ = penalty). */
  distanceToOwnHQ: number;
  /** Is the target on a fortified hex? */
  isFortified: boolean;
  /** Is the target on a safehouse hex? */
  isSafehouse: boolean;
  /** Small jitter for tie-breaking. */
  jitter: number;
}

export function scorePlanHitTarget(i: PlanHitTargetInputs): number {
  let s = 0;
  s += i.level * 2.5;                                  // level scales
  s += Math.max(0, 6 - i.distanceToBorder) * 1.2;      // closer to us = better
  if (i.atWar) s += 4;
  s -= Math.max(0, 3 - i.distanceToOwnHQ) * 1.5;       // near their HQ = harder
  if (i.isFortified) s -= 3;
  if (i.isSafehouse) s -= 2;
  s += i.jitter * 0.8;
  return s;
}

export interface HitmanTargetInputs {
  /** Exposure: 1.0 open, 0.5 fortified, 0.3 safehouse, 0 HQ. */
  exposure: number;
  /** Capo level. */
  level: number;
  /** Income of the hex the capo is standing on (proxy for strategic value). */
  hexIncome: number;
  /** Is the capo currently on a district border the AI cares about? */
  inContestedDistrict: boolean;
  jitter: number;
}

export function scoreHitmanTarget(i: HitmanTargetInputs): number {
  // Exposure gates everything — you can't hit what's in HQ.
  if (i.exposure <= 0) return -100;
  let s = i.exposure * 10;
  s += i.level * 2;
  s += Math.min(6, i.hexIncome / 800);
  if (i.inContestedDistrict) s += 2;
  s += i.jitter * 0.5;
  return s;
}

export interface DeployNeighborInputs {
  /** Distance from the AI's HQ. Closer = safer, but stalls forward pressure. */
  distanceToOwnHQ: number;
  /** Number of hostile-family units within 1 hex of the candidate hex. */
  hostilesAdjacent: number;
  /** Friendly units already stacked on the candidate hex (0-1). */
  friendliesHere: number;
  /** Does the candidate hex belong to us? */
  ownedByUs: boolean;
  /** Is the candidate on a supply-line route we own? */
  onOwnSupplyRoute: boolean;
  /** Is the candidate adjacent to an enemy business we could pressure next turn? */
  adjacentToEnemyBiz: boolean;
  jitter: number;
}

export function scoreDeployNeighbor(i: DeployNeighborInputs): number {
  let s = 0;
  // Forward pressure — prefer intermediate distance over hugging HQ
  s -= Math.abs(i.distanceToOwnHQ - 2) * 0.6;
  // Border defense: place near threats but not into a bloodbath
  if (i.hostilesAdjacent === 1) s += 2;
  else if (i.hostilesAdjacent >= 2) s -= 1;
  // Don't stack unless we need to
  s -= i.friendliesHere * 3;
  if (i.ownedByUs) s += 1;
  if (i.onOwnSupplyRoute) s += 1.5;
  if (i.adjacentToEnemyBiz) s += 2.5;
  s += i.jitter * 0.5;
  return s;
}


// ─── 5. Family signature preferences ─────────────────────────────────
export interface FamilySignature {
  preferExtort: boolean;            // Lucchese
  preferAdjacentExpansion: boolean; // Genovese, Bonanno
  preferHighValueOnly: boolean;     // Gambino (legal/political → high-quality only)
  preferCapoHeavy: boolean;         // Colombo
  preferLegalConstruction: boolean; // Gambino, Bonanno
}

export function familySignaturePreference(family: FamilyId): FamilySignature {
  switch (family) {
    case 'gambino':  return { preferExtort: false, preferAdjacentExpansion: false, preferHighValueOnly: true,  preferCapoHeavy: false, preferLegalConstruction: true };
    case 'genovese': return { preferExtort: false, preferAdjacentExpansion: true,  preferHighValueOnly: false, preferCapoHeavy: false, preferLegalConstruction: false };
    case 'lucchese': return { preferExtort: true,  preferAdjacentExpansion: false, preferHighValueOnly: false, preferCapoHeavy: false, preferLegalConstruction: false };
    case 'bonanno':  return { preferExtort: false, preferAdjacentExpansion: true,  preferHighValueOnly: false, preferCapoHeavy: false, preferLegalConstruction: true };
    case 'colombo':  return { preferExtort: false, preferAdjacentExpansion: false, preferHighValueOnly: false, preferCapoHeavy: true,  preferLegalConstruction: false };
  }
}
