export interface ReputationSystem {
  respect: number; // 0-100, based on successful operations and territory control
  reputation: number; // 0-100, overall standing in criminal underworld
  loyalty: number; // 0-100, loyalty of your own soldiers and capos
  fear: number; // 0-100, how much other families fear you
  streetInfluence: number; // 0-100, influence on the streets
}

export interface ViolentAction {
  id: string;
  type: 'beating' | 'hit' | 'assassination';
  target: string;
  targetType: 'rival_soldier' | 'rival_capo' | 'rival_boss' | 'own_soldier' | 'own_capo' | 'civilian' | 'police';
  success: boolean;
  turn: number;
  consequences: {
    respectChange: number;
    reputationChange: number;
    loyaltyChange: number;
    fearChange: number;
    streetInfluenceChange: number;
    policeHeatIncrease: number;
  };
}

export interface ReputationFactors {
  soldiers: number; // Each soldier adds to reputation
  politicalPower: number; // Political connections boost reputation
  businessesOwned: number; // Number of businesses increases respect
  extortedProfits: number; // Monthly extorted income boosts fear
  violentActions: ViolentAction[]; // Recent violent actions affect all metrics
  territoryControl: number; // Percentage of territory controlled
}

export interface ReputationAction {
  type: 'beat_up' | 'execute_hit' | 'assassinate' | 'intimidate' | 'show_mercy';
  targetFamily?: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  targetType: 'rival_soldier' | 'rival_capo' | 'rival_boss' | 'own_soldier' | 'own_capo' | 'civilian' | 'police';
  cost?: number; // Money cost for professional hits
  requiredSoldiers?: number; // Soldiers needed for action
}

// Reputation calculation constants
export const REPUTATION_WEIGHTS = {
  SOLDIERS_MULTIPLIER: 1.5, // Each soldier adds 1.5 points to reputation
  POLITICAL_POWER_MULTIPLIER: 0.8, // Each political power point adds 0.8 to reputation
  BUSINESS_MULTIPLIER: 2, // Each business adds 2 points to respect
  EXTORTION_FEAR_MULTIPLIER: 0.001, // $1000 extorted = 1 fear point
  TERRITORY_RESPECT_MULTIPLIER: 1.2, // Each % of territory adds 1.2 respect
  
  // Violent action multipliers
  BEATING_FEAR_BONUS: 3,
  HIT_FEAR_BONUS: 8,
  ASSASSINATION_FEAR_BONUS: 15,
  
  // Own family penalties
  OWN_FAMILY_LOYALTY_PENALTY: -10, // Hitting own people reduces loyalty
  OWN_FAMILY_FEAR_BONUS: 5, // But increases fear from others
  OWN_FAMILY_STREET_BONUS: 8, // And street influence
  
  // Decay rates per turn
  REPUTATION_DECAY: 0.5, // Reputation slowly decreases without action
  FEAR_DECAY: 1, // Fear decays faster than reputation
  LOYALTY_RECOVERY: 1, // Loyalty slowly recovers over time
};