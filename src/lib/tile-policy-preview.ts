/**
 * Standing Order previews — shared wording + maths so the block mini-card and the
 * full Manage panel always say the same thing about what an order does.
 */
import {
  TILE_POLICIES,
  DEFAULT_TILE_POLICY,
  RECRUIT_PROGRESS_GOAL,
  RECRUIT_PROGRESS_PER_INFRA,
  type TilePolicy,
} from '@/types/game-mechanics';

export const POLICY_ORDER: TilePolicy[] = ['earn', 'muscle', 'lay_low', 'fortify'];

export interface PolicyPreviewInputs {
  /** Gross monthly income on the block before garrison share and policy. */
  grossIncome: number;
  /** Garrison share (0..1) from who is standing on the block. */
  share: number;
  /** Total infrastructure points from built structures. */
  infra: number;
  /** Crew progress already banked on the block (0..RECRUIT_PROGRESS_GOAL). */
  recruitProgress: number;
}

export interface PolicyPreview {
  id: TilePolicy;
  label: string;
  blurb: string;
  income: number;
  /** Income difference vs. the order currently running. */
  incomeDelta: number;
  heatText: string;
  crewText: string;
  crewMonths: number | null;
  defenseText: string | null;
  isActive: boolean;
}

function heatWording(mult: number): string {
  if (mult <= 0.5) return 'heat: much lower';
  if (mult < 0.95) return 'heat: lower';
  if (mult <= 1.05) return 'heat: normal';
  if (mult <= 1.25) return 'heat: slightly higher';
  return 'heat: higher';
}

function crewMonths(infra: number, growthMult: number, progress: number): number | null {
  const perMonth = infra * RECRUIT_PROGRESS_PER_INFRA * (growthMult ?? 1);
  if (infra <= 0 || perMonth <= 0) return null;
  return Math.max(1, Math.ceil((RECRUIT_PROGRESS_GOAL - progress) / perMonth));
}

export function policyIncome(i: PolicyPreviewInputs, policy: TilePolicy): number {
  return Math.floor(i.grossIncome * i.share * TILE_POLICIES[policy].incomeMult);
}

export function buildPolicyPreviews(i: PolicyPreviewInputs, active: TilePolicy): PolicyPreview[] {
  const activeIncome = policyIncome(i, active);
  return POLICY_ORDER.map(id => {
    const def = TILE_POLICIES[id];
    const income = policyIncome(i, id);
    const months = crewMonths(i.infra, def.growthMult, i.recruitProgress);
    return {
      id,
      label: def.label,
      blurb: def.blurb,
      income,
      incomeDelta: income - activeIncome,
      heatText: heatWording(def.heatMult),
      crewText: months === null ? 'no crew growth here' : `new soldier in ~${months} month${months === 1 ? '' : 's'}`,
      crewMonths: months,
      defenseText: def.defenseBonus > 0 ? `block ${def.defenseBonus}% harder to take` : null,
      isActive: id === active,
    };
  });
}

/** One plain sentence describing what the running order is doing on this block. */
export function runningOrderSentence(i: PolicyPreviewInputs, active: TilePolicy): string {
  const def = TILE_POLICIES[active || DEFAULT_TILE_POLICY];
  const income = policyIncome(i, active);
  const months = crewMonths(i.infra, def.growthMult, i.recruitProgress);
  const moneyPart = income > 0
    ? `earning $${income.toLocaleString()} a month`
    : 'earning nothing yet';
  const heatPart = heatWording(def.heatMult).replace('heat: ', 'heat ');
  const crewPart = months === null ? 'no crew coming up' : `next soldier in about ${months} month${months === 1 ? '' : 's'}`;
  const defPart = def.defenseBonus > 0 ? `, ${def.defenseBonus}% harder to take` : '';
  return `Running ${def.label}: ${moneyPart}, ${heatPart}, ${crewPart}${defPart}.`;
}

/** Short label used for map badges and the turn summary. */
export function policyShortLabel(policy: TilePolicy): string {
  return TILE_POLICIES[policy]?.label ?? 'Earn';
}
