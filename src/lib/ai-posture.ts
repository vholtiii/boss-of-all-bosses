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
  | 'UNDERDOG'         // rank 3+ and far behind top: harass leader, seek allies, cheap ops
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
  /** Player's respect at this moment (0-100). Optional for back-compat. */
  myRespect?: number;
  rivalRespect?: number[];
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
  /** Multiplier on scoring bonus for reachable rival supply nodes. Higher = more eager to cut supply lines. */
  supplyNodeMul: number;
  /** Multiplier on plan-hit / hitman firing chance. UNDERDOG >1 (harass), TURTLE <1 (hunker). Default 1. */
  offensiveHitMul?: number;
  /** Prefer proposing alliances/ceasefires this turn (UNDERDOG seeks numbers). Default false. */
  seekAllies?: boolean;
}

export function computeAIPosture(i: PostureInputs): AIPosture {
  // 1. Heat emergency wins outright unless strategic override (CLOSE_OUT-style push)
  if (!i.strategicOverride && (i.heatTier === 'rico' || i.heatTier === 'critical')) {
    return 'COOL_OFF';
  }

  // 2. Cash runway crisis — bankruptcy is more dangerous than rivals.
  // Full crisis at <2.5. Also treat 2.5-3.2 as CONSOLIDATE when heat is warm+
  // (bleeding cash to bribes on top of thin runway is the real trap).
  if (i.moneyRunway < 2.5) return 'CONSOLIDATE';
  if (i.moneyRunway < 3.2 && (i.heatTier === 'warm' || i.heatTier === 'hot')) return 'CONSOLIDATE';

  // 3. Just took heavy losses — turtle to recover
  if (i.hqAssaultedRecently || i.recentCapoLosses >= 2) return 'TURTLE';

  // 4. Active war takes priority over expansion
  if (i.atWar) return 'WAR';

  // 5. Endgame: close it out. Loosened: gap up to 5 when we have real runway.
  if (i.aiPhase >= 4) {
    if (i.victoryGap <= 3 && i.victoryGap > 0) return 'CLOSE_OUT';
    if (i.victoryGap <= 5 && i.victoryGap > 0 && i.moneyRunway > 4) return 'CLOSE_OUT';
  }

  // 6. We are the clear leader in Phase 3+ — pressure #2 instead of generically expanding.
  //    Margin gate: need real lead (≥3 hexes OR ≥15 respect over rank 2), not just #1 by 1 hex.
  if (i.aiPhase >= 3 && i.myRank === 1) {
    const rivals = i.rivalHexCounts.slice().sort((a, b) => b - a);
    const rank2Hexes = rivals[0] ?? 0;
    const hexLead = i.myHexes - rank2Hexes;
    const respectLead = (i.myRespect ?? 0) - Math.max(0, ...(i.rivalRespect ?? [0]));
    if (hexLead >= 3 || respectLead >= 15) return 'PRESSURE_LEADER';
  }

  // 7. Outnumbered but healthy → UNDERDOG. Rank 3+ AND top rival is at least
  //    1.8× our size AND we have some runway. Aggressive harassment + alliance-seeking.
  if (i.aiPhase >= 2 && i.myRank >= 3 && i.moneyRunway >= 2.5) {
    const topRival = i.rivalHexCounts.length ? Math.max(...i.rivalHexCounts) : 0;
    if (i.myHexes > 0 && topRival > i.myHexes * 1.8) return 'UNDERDOG';
  }

  // 8. Phase 1+, cool heat, comfortable treasury → expand.
  if (i.heatTier === 'cool' && i.moneyRunway > 3) return 'EXPAND';

  // 9. Default: build economy, low-risk only
  return 'BUILD_ECONOMY';
}

export function posturePolicy(p: AIPosture): PosturePolicy {
  switch (p) {
    case 'COOL_OFF':
      return {
        heatCeiling: 35, suppressOffense: true, suppressExpansion: true,
        forceBribe: true, preferLayLow: true, preferMattresses: false,
        acceptSitdownsForCash: true, refuseNewWars: true,
        warTargetMul: 0, economyFocusMul: 1.5, supplyNodeMul: 0,
        offensiveHitMul: 0.1,
      };
    case 'CONSOLIDATE':
      return {
        heatCeiling: 40, suppressOffense: true, suppressExpansion: true,
        forceBribe: false, preferLayLow: false, preferMattresses: false,
        acceptSitdownsForCash: true, refuseNewWars: true,
        warTargetMul: 0, economyFocusMul: 2.0, supplyNodeMul: 0,
        offensiveHitMul: 0.2,
      };
    case 'TURTLE':
      return {
        heatCeiling: 50, suppressOffense: true, suppressExpansion: true,
        forceBribe: false, preferLayLow: false, preferMattresses: true,
        acceptSitdownsForCash: false, refuseNewWars: true,
        warTargetMul: 0, economyFocusMul: 1.2, supplyNodeMul: 0,
        offensiveHitMul: 0.3,
      };
    case 'WAR':
      return {
        heatCeiling: 80, suppressOffense: false, suppressExpansion: true,
        forceBribe: false, preferLayLow: false, preferMattresses: false,
        acceptSitdownsForCash: false, refuseNewWars: false,
        warTargetMul: 2.0, economyFocusMul: 0.5, supplyNodeMul: 1.5,
        offensiveHitMul: 1.5,
      };
    case 'CLOSE_OUT':
      return {
        heatCeiling: 85, suppressOffense: false, suppressExpansion: false,
        forceBribe: false, preferLayLow: false, preferMattresses: false,
        acceptSitdownsForCash: false, refuseNewWars: true,
        warTargetMul: 1.0, economyFocusMul: 0.8, supplyNodeMul: 1.3,
        offensiveHitMul: 1.3,
      };
    case 'PRESSURE_LEADER':
      return {
        heatCeiling: 55, suppressOffense: false, suppressExpansion: true,
        forceBribe: false, preferLayLow: false, preferMattresses: false,
        acceptSitdownsForCash: false, refuseNewWars: false,
        warTargetMul: 1.5, economyFocusMul: 1.0, supplyNodeMul: 1.4,
        offensiveHitMul: 1.2,
      };
    case 'UNDERDOG':
      return {
        heatCeiling: 55, suppressOffense: false, suppressExpansion: true,
        forceBribe: false, preferLayLow: false, preferMattresses: false,
        acceptSitdownsForCash: true, refuseNewWars: false,
        warTargetMul: 1.3, economyFocusMul: 0.9, supplyNodeMul: 1.5,
        offensiveHitMul: 1.4, seekAllies: true,
      };
    case 'EXPAND':
      return {
        heatCeiling: 50, suppressOffense: false, suppressExpansion: false,
        forceBribe: false, preferLayLow: false, preferMattresses: false,
        acceptSitdownsForCash: false, refuseNewWars: false,
        warTargetMul: 1.0, economyFocusMul: 1.0, supplyNodeMul: 1.0,
        offensiveHitMul: 1.0,
      };
    case 'BUILD_ECONOMY':
    default:
      return {
        // refuseNewWars: false — was true, which silently blocked Plan Hit & Hitman
        // for every AI in the default posture. Aggressive personalities can now
        // still initiate offensive actions while building economy.
        heatCeiling: 45, suppressOffense: false, suppressExpansion: false,
        forceBribe: false, preferLayLow: false, preferMattresses: false,
        acceptSitdownsForCash: false, refuseNewWars: false,
        warTargetMul: 0.5, economyFocusMul: 1.8, supplyNodeMul: 0.7,
        offensiveHitMul: 0.7,
      };
  }
}

/** Convenience: ranks all families by territory descending and returns 1-based rank for `myCount`. */
export function rankByTerritory(myCount: number, rivalCounts: number[]): number {
  const all = [...rivalCounts, myCount].sort((a, b) => b - a);
  return all.indexOf(myCount) + 1;
}
