// Enhanced Game Mechanics Types

export interface CombatSystem {
  // Territory battles
  territoryBattles: TerritoryBattle[];
  // Soldier training and equipment
  soldierTraining: SoldierTraining;
  // Combat modifiers
  combatModifiers: CombatModifier[];
}

export interface TerritoryBattle {
  id: string;
  attackingFamily: string;
  defendingFamily: string;
  territory: string;
  turn: number;
  outcome: 'victory' | 'defeat' | 'ongoing';
  casualties: {
    attacking: number;
    defending: number;
  };
  spoils: {
    money: number;
    territory: number;
    reputation: number;
  };
}

export interface SoldierTraining {
  level: number; // 1-5, affects combat effectiveness
  equipment: SoldierEquipment;
  specialization: 'enforcer' | 'sniper' | 'infiltrator' | 'negotiator';
  experience: number; // 0-100, gained through combat
}

export interface SoldierEquipment {
  weapons: 'basic' | 'advanced' | 'military_grade';
  armor: 'none' | 'light' | 'heavy';
  vehicles: 'none' | 'cars' | 'armored';
  cost: number;
  effectiveness: number; // Combat bonus
}

export interface CombatModifier {
  type: 'terrain' | 'weather' | 'surprise' | 'intelligence' | 'equipment';
  value: number; // Percentage modifier
  description: string;
}

// Advanced Economy System
export interface EconomySystem {
  marketConditions: MarketCondition[];
  supplyChains: SupplyChain[];
  investments: Investment[];
  economicEvents: EconomicEvent[];
}

export interface MarketCondition {
  type: 'boom' | 'bust' | 'stable' | 'volatile';
  sector: 'legal' | 'illegal' | 'construction' | 'gambling' | 'drugs';
  modifier: number; // Percentage change in income
  duration: number; // Turns remaining
  description: string;
}

export interface SupplyChain {
  id: string;
  type: 'drugs' | 'weapons' | 'alcohol' | 'information';
  source: string;
  destination: string;
  cost: number;
  profit: number;
  risk: number; // 0-100, chance of being intercepted
  reliability: number; // 0-100, chance of successful delivery
}

export interface Investment {
  id: string;
  type: 'real_estate' | 'stocks' | 'business' | 'political';
  amount: number;
  expectedReturn: number;
  risk: number;
  duration: number; // Turns until maturity
  currentValue: number;
}

export interface EconomicEvent {
  id: string;
  type: 'market_crash' | 'boom' | 'regulation' | 'scandal' | 'opportunity';
  title: string;
  description: string;
  effects: {
    money?: number;
    reputation?: number;
    heat?: number;
    businesses?: string[];
  };
  choices: EconomicEventChoice[];
  turn: number;
  expires: number; // Turn when event expires
}

export interface EconomicEventChoice {
  id: string;
  text: string;
  cost: number;
  effects: {
    money?: number;
    reputation?: number;
    heat?: number;
    risk?: number;
  };
  requirements: {
    money?: number;
    soldiers?: number;
    reputation?: number;
  };
}

// AI Opponent System
export interface AIOpponent {
  family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  personality: 'aggressive' | 'defensive' | 'opportunistic' | 'diplomatic' | 'unpredictable';
  resources: {
    money: number;
    soldiers: number;
    influence: number;
  };
  strategy: AIStrategy;
  relationships: {
    [family: string]: number; // -100 to 100, relationship score
  };
  lastAction: AIAction | null;
  nextAction: AIAction | null;
}

export interface AIStrategy {
  primaryGoal: 'territory' | 'money' | 'reputation' | 'elimination';
  riskTolerance: number; // 0-100
  aggressionLevel: number; // 0-100
  cooperationTendency: number; // 0-100
  focusAreas: string[]; // Districts or business types to prioritize
}

export interface AIAction {
  type: 'attack' | 'defend' | 'expand' | 'negotiate' | 'sabotage' | 'bribe';
  target: string;
  resources: number;
  expectedOutcome: {
    success: number; // 0-100
    cost: number;
    benefit: number;
  };
  turn: number;
}

// Enhanced Event System
export interface GameEvent {
  id: string;
  type: 'story' | 'random' | 'consequence' | 'opportunity';
  title: string;
  description: string;
  image?: string;
  choices: EventChoice[];
  requirements?: {
    turn?: number;
    reputation?: number;
    money?: number;
    soldiers?: number;
    territory?: string[];
  };
  consequences: EventConsequence[];
  turn: number;
  expires?: number;
}

export interface EventChoice {
  id: string;
  text: string;
  cost?: number;
  requirements?: {
    money?: number;
    soldiers?: number;
    reputation?: number;
  };
  consequences: EventConsequence[];
  risk?: number; // 0-100, chance of negative outcome
}

export interface EventConsequence {
  type: 'money' | 'reputation' | 'soldiers' | 'heat' | 'territory' | 'business' | 'relationship';
  value: number;
  description: string;
  probability?: number; // 0-100, chance of this consequence
}

// Enhanced Reputation System
export interface EnhancedReputationSystem {
  // Base reputation properties
  respect: number; // 0-100, based on successful operations and territory control
  reputation: number; // 0-100, overall standing in criminal underworld
  loyalty: number; // 0-100, loyalty of your own soldiers and capos
  fear: number; // 0-100, how much other families fear you
  streetInfluence: number; // 0-100, influence on the streets
  // Family relationships
  familyRelationships: {
    [family: string]: number; // -100 to 100
  };
  // Public perception
  publicPerception: {
    criminal: number; // 0-100, how much public sees you as criminal
    businessman: number; // 0-100, how much public sees you as legitimate
    philanthropist: number; // 0-100, how much public sees you as charitable
  };
  // Historical actions
  reputationHistory: ReputationEvent[];
  // Achievements
  achievements: Achievement[];
}

export interface ReputationEvent {
  id: string;
  type: 'violent_action' | 'business_success' | 'charitable_act' | 'betrayal' | 'alliance';
  description: string;
  turn: number;
  effects: {
    respect: number;
    reputation: number;
    loyalty: number;
    fear: number;
    streetInfluence: number;
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedTurn?: number;
  requirements: {
    money?: number;
    territory?: number;
    businesses?: number;
    soldiers?: number;
    reputation?: number;
    violentActions?: number;
  };
  rewards: {
    money?: number;
    reputation?: number;
    soldiers?: number;
    specialAbility?: string;
  };
}

// Mission System
export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'story' | 'side' | 'daily' | 'weekly';
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  objectives: MissionObjective[];
  rewards: MissionReward[];
  timeLimit?: number; // Turns to complete
  prerequisites?: {
    reputation?: number;
    money?: number;
    soldiers?: number;
    completedMissions?: string[];
  };
  status: 'available' | 'active' | 'completed' | 'failed';
  progress: number; // 0-100
}

export interface MissionObjective {
  id: string;
  description: string;
  type: 'collect' | 'eliminate' | 'protect' | 'deliver' | 'infiltrate';
  target?: string;
  amount?: number;
  completed: boolean;
}

export interface MissionReward {
  type: 'money' | 'reputation' | 'soldiers' | 'territory' | 'business' | 'equipment';
  amount: number;
  description: string;
}

// Weather and Environmental Effects
export interface WeatherSystem {
  currentWeather: WeatherCondition;
  forecast: WeatherCondition[];
  effects: WeatherEffect[];
}

export interface WeatherCondition {
  type: 'clear' | 'rain' | 'snow' | 'fog' | 'storm';
  intensity: number; // 0-100
  duration: number; // Turns remaining
  description: string;
}

export interface WeatherEffect {
  type: 'combat' | 'business' | 'movement' | 'heat';
  modifier: number; // Percentage change
  description: string;
}

// Technology and Innovation System
export interface TechnologySystem {
  researched: Technology[];
  available: Technology[];
  researchProgress: { [techId: string]: number };
}

export interface Technology {
  id: string;
  name: string;
  description: string;
  category: 'combat' | 'business' | 'intelligence' | 'legal' | 'social';
  cost: number;
  researchTime: number; // Turns to research
  prerequisites: string[];
  effects: {
    combat?: number;
    business?: number;
    heat?: number;
    reputation?: number;
  };
  unlocked: boolean;
}

// Seasonal Events
export interface SeasonalEvent {
  id: string;
  name: string;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  description: string;
  effects: {
    business?: number;
    heat?: number;
    reputation?: number;
  };
  specialActions: string[];
  turn: number;
  duration: number;
}
