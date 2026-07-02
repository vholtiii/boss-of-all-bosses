// ============================================================================
// LEGAL PRESSURE BREAKDOWN — pure mirror of the endTurn prosecution formula.
//
// Keep in sync with the "PROSECUTION RISK SYSTEM" block in
// useEnhancedMafiaGameState.endTurn. Consumed by the legal-pressure UI and tests.
// ============================================================================

import { PROSECUTION_LAWYER_REDUCTION } from '@/types/game-mechanics';

export interface LegalTerm {
  label: string;
  delta: number;
}

export interface LegalBreakdown {
  terms: LegalTerm[];
  /** Final clamped 0-100 risk as the next end-of-turn will compute it. */
  projectedRisk: number;
  /** Current stored risk (last computed at end of turn). */
  currentRisk: number;
  ricoActive: boolean;
  ricoTimer: number;
  prosecutionTimer: number;
  federalIndictmentTimer: number;
  lawyer: { tier: string | null; turnsRemaining: number; feePerTurn: number; effects: string[] } | null;
  charityActive: boolean;
}

export const computeLegalBreakdown = (state: any): LegalBreakdown => {
  const heat = state.policeHeat?.level ?? 0;
  const informantCount = (state.copFlippedSoldiers || []).filter((c: any) => c.family === state.playerFamily).length;
  const recentArrests = (state.policeHeat?.arrests || []).filter((a: any) => state.turn - a.turn < 3).length;
  const bribes = state.activeBribes || [];
  const hasPatrol = bribes.some((b: any) => b.tier === 'patrol_officer' && b.active);
  const hasCaptain = bribes.some((b: any) => b.tier === 'police_captain' && b.active);
  const hasChief = bribes.some((b: any) => b.tier === 'police_chief' && b.active);
  const hasMayor = bribes.some((b: any) => b.tier === 'mayor' && b.active);
  const hasLawyer = (state.lawyerActiveUntil || 0) >= state.turn;
  const firmOrBetter = hasLawyer && (state.lawyerTier === 'firm' || state.lawyerTier === 'consigliere');
  const fedBugBonus = state.fedBugProsecutionBonus || 0;

  const terms: LegalTerm[] = [];
  if (heat > 0) terms.push({ label: `Police heat ${heat} × 0.4`, delta: Math.floor(heat * 0.4) });
  if (informantCount > 0) terms.push({ label: `${informantCount} informant(s)`, delta: informantCount * 10 });
  if (recentArrests > 0) terms.push({ label: `${recentArrests} recent arrest(s)`, delta: recentArrests * 5 });
  if (hasPatrol) terms.push({ label: 'Patrol officer bribed', delta: -10 });
  if (hasCaptain) terms.push({ label: 'Police captain bribed', delta: -10 });
  if (hasChief) terms.push({ label: 'Police chief bribed', delta: -15 });
  if (hasMayor) terms.push({ label: 'Mayor bribed', delta: -20 });
  if (hasLawyer) terms.push({ label: 'Lawyer on retainer', delta: -PROSECUTION_LAWYER_REDUCTION });
  if (fedBugBonus > 0) terms.push({ label: 'Federal wiretap evidence', delta: fedBugBonus });

  let risk = terms.reduce((sum, t) => sum + t.delta, 0);
  if (firmOrBetter) {
    const before = Math.min(100, Math.max(0, risk));
    risk = Math.floor(risk * 0.5);
    const after = Math.min(100, Math.max(0, risk));
    terms.push({ label: `${state.lawyerTier === 'consigliere' ? 'Consigliere' : 'Defense firm'} halves total`, delta: after - before });
  }
  const projectedRisk = Math.min(100, Math.max(0, risk));

  const lawyerTier = state.lawyerTier || null;
  const lawyer = hasLawyer && lawyerTier
    ? {
        tier: lawyerTier,
        turnsRemaining: Math.max(0, (state.lawyerActiveUntil || 0) - state.turn + 1),
        feePerTurn: lawyerTier === 'firm' ? 1500 : lawyerTier === 'consigliere' ? 3000 : 0,
        effects:
          lawyerTier === 'consigliere'
            ? [`-${PROSECUTION_LAWYER_REDUCTION} risk`, 'halves total risk', '-1 heat/turn', 'blocks 1 arrest/turn', 'stalls RICO']
            : lawyerTier === 'firm'
              ? [`-${PROSECUTION_LAWYER_REDUCTION} risk`, 'halves total risk', 'shorter sentences']
              : [`-${PROSECUTION_LAWYER_REDUCTION} risk`, 'shorter sentences'],
      }
    : null;

  return {
    terms,
    projectedRisk,
    currentRisk: state.legalStatus?.prosecutionRisk ?? 0,
    ricoActive: (state.ricoTimer || 0) > 0,
    ricoTimer: state.ricoTimer || 0,
    prosecutionTimer: state.prosecutionTimer || 0,
    federalIndictmentTimer: state.federalIndictmentTimer || 0,
    lawyer,
    charityActive: (state.charityActiveUntil || 0) >= state.turn,
  };
};
