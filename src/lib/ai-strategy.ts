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
}

export function scoreHexForAI(i: ScoreHexInputs): number {
  let s = 0;
  // Base attraction: businesses
  s += Math.min(20, i.hexIncome / 200);
  // Weak hex bonus / strong hex penalty
  if (i.defenderCount === 0) s += 6;
  else if (i.defenderCount === 1) s += 1;
  else s -= 4;
  // Family identity: focus districts
  if (i.isInFocusDistrict) s += 4;
  // Don't overextend
  s -= Math.max(0, i.distanceToOwnHQ - 3) * 1.5;
  // Consolidation bonus (defensive moods love this)
  if (i.isAdjacentToOwnTerritory) {
    s += i.mood === 'desperate' || i.mood === 'cautious' ? 5 : 2;
  }
  // Avoid fortified / safehouses without intel
  if (i.isFortified) s -= 5;
  if (i.isSafehouse && !i.hasScoutIntel) s -= 4;
  if (i.isSafehouse && i.hasScoutIntel) s += 3; // bounty + intel target
  // War prioritization
  if (i.isWarTarget) s += 10;
  // Phase 4 endgame: lean toward player when winning
  if (i.phase >= 4 && i.isPlayerHex && i.mood === 'dominant') s += 4;

  // Personality biases
  switch (i.effectivePersonality) {
    case 'aggressive':
      if (i.defenderCount === 0) s += 2;
      s += 2;
      break;
    case 'defensive':
      if (i.isAdjacentToOwnTerritory) s += 3;
      s -= 2;
      break;
    case 'opportunistic':
      // really loves weak juicy hexes
      if (i.defenderCount === 0 && i.hexIncome > 1000) s += 4;
      break;
    case 'diplomatic':
      if (i.isPlayerHex) s -= 3;
      if (i.isAdjacentToOwnTerritory) s += 2;
      break;
    case 'unpredictable':
      s += i.jitter * 4; // amplified randomness
      break;
  }

  // Signature preferences
  if (i.signaturePref.preferExtort && i.hexIncome > 0 && i.isPlayerHex) s += 2;
  if (i.signaturePref.preferAdjacentExpansion && i.isAdjacentToOwnTerritory) s += 2;
  if (i.signaturePref.preferHighValueOnly && i.hexIncome < 1000) s -= 2;

  // Always sprinkle a little jitter so identical scores don't tie
  s += i.jitter * 0.8;
  return s;
}

/**
 * Softmax-pick from candidates. Returns index of selected candidate.
 * Top-K filters first to avoid silly low-score picks.
 */
export function softmaxPick(scores: number[], rng: () => number, topK = 4, temperature = 1.5): number {
  if (scores.length === 0) return -1;
  if (scores.length === 1) return 0;
  // Sort indices by score desc and keep topK
  const idxs = scores.map((_, i) => i).sort((a, b) => scores[b] - scores[a]).slice(0, topK);
  const top = idxs.map(i => scores[i]);
  const max = Math.max(...top);
  const exps = top.map(s => Math.exp((s - max) / temperature));
  const sum = exps.reduce((a, b) => a + b, 0);
  let r = rng() * sum;
  for (let k = 0; k < exps.length; k++) {
    r -= exps[k];
    if (r <= 0) return idxs[k];
  }
  return idxs[0];
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
