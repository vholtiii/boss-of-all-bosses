/**
 * AI Strategic Posture — single high-level decision the AI makes once per turn,
 * before any action loop. Every downstream decision (offense, bribes, lay low,
 * targeting) reads from the resulting posture so behavior visibly shifts as the
 * game evolves instead of looping the same offensive playbook into heat trouble.
 *
 * Pure functions. No React, no state mutation.
 */

import type { AIPersonality, DynamicMood } from './ai-strategy';

export type AIPosture =
  | 'COOL_OFF'         // bleed heat, no offense, force bribes/lay-low
  | 'CONSOLIDATE'      // cash crisis: stop spending, accept any sitdown for cash
  | 'TURTLE'           // recently hit hard: fortify, pull units home
  | 'WAR'              // active war: prioritize war targets
  | 'CLOSE_OUT'        // endgame within reach: focus the last few hexes
  | 'PRESSURE_LEADER'  // we are #1: punch down at #2 to stay #1
  | 'EXPAND'           // healthy + cool: claim/extort/scout new hexes
  | 'BUILD_ECONOMY';   // default: build businesses, racketeer, low-risk only

export type HeatTier = 'cool' | 'warm' | 'hot' | 'critical' | 'rico';

export interface PostureInputs {
  aiPhase: number;
  heatTier: HeatTier;
  myHexes: number;
  rivalHexCounts: number[];   // includes player + AI rivals (excludes self)
  myRank: number;             // 1 = highest territory among all families
  moneyRunway: number;        // money / max(1, upkeepPerTurn)
  atWar: boolean;
  recentCapoLosses: number;
  hqAssaultedRecently: boolean;
  victoryGap: number;         // territoryTarget - myHexes
  basePersonality: AIPersonality;
  dynamicMood: DynamicMood;
  strategicOverride: boolean; // existing escape hatch from processAITurn
}

export interface PosturePolicy {
  /** Hard ceiling: AI refuses *new* offensive actions if its current heat is at/above this. */
  heatCeiling: number;
  /** Suppress all offensive actions (claims, extorts, hits, sabotage) regardless of heat. */
  suppressOffense: boolean;
  /** Suppress new expansion (going to neutral hexes), but allow defensive ops on owned land. */
  suppressExpansion: boolean;
  /** Force a bribe spend this turn if heat is warm+ and money allows. */
  forceBribe: boolean;
  /** Strongly prefer triggering Lay Low this turn if off cooldown. */
  preferLayLow: boolean;
  /** Strongly prefer triggering Mattresses this turn (Phase 3+) if off cooldown. */
  preferMattresses: boolean;
  /** Accept incoming sitdowns more readily (CONSOLIDATE needs cash, COOL_OFF wants peace). */
  acceptSitdownsForCash: boolean;
  /** Refuse new wars / decline aggressive sitdowns. */
  refuseNewWars: boolean;
  /** Multiplier on hex-target scoring weight for war targets. */
  warTargetMul: number;
  /** Multiplier on building businesses on owned hexes (vs. expanding). */
  economyFocusMul: number;
}

export function computeAIPosture(i: PostureInputs): AIPosture {
  // 1. Heat emergency wins outright unless strategic override (CLOSE_OUT-style push)
  if (!i.strategicOverride && (i.heatTier === 'rico' || i.heatTier === 'critical')) {
    return 'COOL_OFF';
  }

  // 2. Cash runway crisis — bankruptcy is more dangerous than rivals
  if (i.moneyRunway < 3) return 'CONSOLIDATE';

  // 3. Just took heavy losses — turtle to recover
  if (i.hqAssaultedRecently || i.recentCapoLosses >= 2) return 'TURTLE';

  // 4. Active war takes priority over expansion
  if (i.atWar) return 'WAR';

  // 5. Endgame: close it out
  if (i.aiPhase >= 4 && i.victoryGap <= 3 && i.victoryGap > 0) return 'CLOSE_OUT';

  // 6. We are the leader in Phase 3+ — pressure #2 instead of generically expanding
  if (i.aiPhase >= 3 && i.myRank === 1) return 'PRESSURE_LEADER';

  // 7. Phase 2+, cool heat, healthy treasury → expand
  // EXPAND from Phase 1+: in early game, AI must grow to hit Phase 2 hex thresholds.
  // Phase 1 AIs have smaller treasuries, so runway threshold is lower.
  if (i.heatTier === 'cool' && i.moneyRunway > 4) return 'EXPAND';

  // 8. Default: build economy, low-risk only
  return 'BUILD_ECONOMY';
}

export function posturePolicy(p: AIPosture): PosturePolicy {
  switch (p) {
    case 'COOL_OFF':
      return {
        heatCeiling: 35, suppressOffense: true, suppressExpansion: true,
        forceBribe: true, preferLayLow: true, preferMattresses: false,
        acceptSitdownsForCash: true, refuseNewWars: true,
        warTargetMul: 0, economyFocusMul: 1.5,
      };
    case 'CONSOLIDATE':
      return {
        heatCeiling: 40, suppressOffense: true, suppressExpansion: true,
        forceBribe: false, preferLayLow: false, preferMattresses: false,
        acceptSitdownsForCash: true, refuseNewWars: true,
        warTargetMul: 0, economyFocusMul: 2.0,
      };
    case 'TURTLE':
      return {
        heatCeiling: 50, suppressOffense: true, suppressExpansion: true,
        forceBribe: false, preferLayLow: false, preferMattresses: true,
        acceptSitdownsForCash: false, refuseNewWars: true,
        warTargetMul: 0, economyFocusMul: 1.2,
      };
    case 'WAR':
      return {
        heatCeiling: 80, suppressOffense: false, suppressExpansion: true,
        forceBribe: false, preferLayLow: false, preferMattresses: false,
        acceptSitdownsForCash: false, refuseNewWars: false,
        warTargetMul: 2.0, economyFocusMul: 0.5,
      };
    case 'CLOSE_OUT':
      return {
        heatCeiling: 85, suppressOffense: false, suppressExpansion: false,
        forceBribe: false, preferLayLow: false, preferMattresses: false,
        acceptSitdownsForCash: false, refuseNewWars: true,
        warTargetMul: 1.0, economyFocusMul: 0.8,
      };
    case 'PRESSURE_LEADER':
      return {
        heatCeiling: 55, suppressOffense: false, suppressExpansion: true,
        forceBribe: false, preferLayLow: false, preferMattresses: false,
        acceptSitdownsForCash: false, refuseNewWars: false,
        warTargetMul: 1.5, economyFocusMul: 1.0,
      };
    case 'EXPAND':
      return {
        heatCeiling: 50, suppressOffense: false, suppressExpansion: false,
        forceBribe: false, preferLayLow: false, preferMattresses: false,
        acceptSitdownsForCash: false, refuseNewWars: false,
        warTargetMul: 1.0, economyFocusMul: 1.0,
      };
    case 'BUILD_ECONOMY':
    default:
      return {
        heatCeiling: 45, suppressOffense: false, suppressExpansion: false,
        forceBribe: false, preferLayLow: false, preferMattresses: false,
        acceptSitdownsForCash: false, refuseNewWars: true,
        warTargetMul: 0.5, economyFocusMul: 1.8,
      };
  }
}

/** Convenience: ranks all families by territory descending and returns 1-based rank for `myCount`. */
export function rankByTerritory(myCount: number, rivalCounts: number[]): number {
  const all = [...rivalCounts, myCount].sort((a, b) => b - a);
  return all.indexOf(myCount) + 1;
}
