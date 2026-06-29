/**
 * AI Posture Reasoner — pure label/cause derivation for surfacing AI posture
 * transitions in the "Just Happened" feed. Reads the existing posture state on
 * gameState; no new mechanics, no decisions made here.
 */

export interface PostureReason {
  family: string;
  posture: string;
  /** Human-readable, second-person framing. */
  cause: string;
  /** Optional one-line tactical implication. */
  implication?: string;
}

const POSTURE_CAUSES: Record<string, { cause: string; implication?: string }> = {
  COOL_OFF: {
    cause: 'Heat is dangerously high',
    implication: 'They will avoid hostile action this turn',
  },
  CONSOLIDATE: {
    cause: 'Recently took losses — regrouping',
    implication: 'Expect defense over offense',
  },
  TURTLE: {
    cause: 'Fortifying their core territory',
    implication: 'Expect safehouses and fortifications',
  },
  WAR: {
    cause: 'In active war',
    implication: 'Expect hits and territory grabs',
  },
  CLOSE_OUT: {
    cause: 'Pushing for a victory condition',
    implication: 'Watch their score line',
  },
  PRESSURE_LEADER: {
    cause: "You're ranked #1 — they will harass",
    implication: 'Expect targeted attacks on your high-value hexes',
  },
  EXPAND: {
    cause: 'Pushing into open territory',
    implication: 'They will claim and extort aggressively',
  },
  BUILD_ECONOMY: {
    cause: 'Investing in income',
    implication: 'Quiet turn — they are constructing businesses',
  },
};

export function explainPosture(family: string, posture: string): PostureReason {
  const meta = POSTURE_CAUSES[posture] || { cause: `Posture changed to ${posture}` };
  return { family, posture, ...meta };
}

/**
 * Returns posture transitions visible since last turn. Reads `previousAiPostures`
 * if present; otherwise returns []. Pure.
 */
export function derivePostureTransitions(gameState: any): PostureReason[] {
  if (!gameState) return [];
  const current = gameState.aiPostures || gameState.aiFamilyPostures || {};
  const prev = gameState.previousAiPostures || {};
  const out: PostureReason[] = [];
  for (const fam of Object.keys(current)) {
    if (prev[fam] && prev[fam] !== current[fam]) {
      out.push(explainPosture(fam, current[fam]));
    }
  }
  return out;
}
