export interface Business {
  id: string;
  name: string;
  type: 'legal' | 'illegal';
  category: 'restaurant' | 'laundromat' | 'casino' | 'construction' | 
           'drug_trafficking' | 'gambling' | 'prostitution' | 'loan_sharking';
  level: number; // 1-5, affects capacity and efficiency
  monthlyIncome: number;
  monthlyExpenses: number;
  launderingCapacity: number; // How much dirty money it can clean per turn
  extortionRate: number; // 0, 0.25, or 0.5 (25% or 50%)
  isExtorted: boolean;
  district: string;
  heatLevel: number; // 0-100, affects prosecution risk
}

export interface LegalStatus {
  charges: Charge[];
  lawyer: Lawyer | null;
  jailTime: number; // turns remaining in jail
  prosecutionRisk: number; // 0-100, chance of getting charged per turn
  totalLegalCosts: number; // lawyer fees per turn
}

export interface Charge {
  id: string;
  type: 'racketeering' | 'tax_evasion' | 'extortion' | 'drug_trafficking' | 'murder' | 'money_laundering';
  severity: 'misdemeanor' | 'felony' | 'federal';
  evidence: number; // 0-100, strength of prosecution case
  penalty: {
    jailTime: number; // turns in jail if convicted
    fine: number; // money penalty
  };
}

export interface Lawyer {
  id: string;
  name: string;
  tier: 'public_defender' | 'local' | 'prestigious' | 'elite';
  monthlyFee: number;
  skillLevel: number; // 1-100, affects case outcomes
  specialties: Charge['type'][];
}

export interface BusinessFinances {
  totalIncome: number;
  totalExpenses: number;
  legalProfit: number;
  illegalProfit: number;
  totalProfit: number;
  dirtyMoney: number; // Unlaundred money from illegal activities
  cleanMoney: number; // Laundered money ready to use
  legalCosts: number; // lawyer fees and legal expenses
}

export interface PoliceHeat {
  level: number; // 0-100, how much attention you have from law enforcement
  reductionPerTurn: number; // How much heat reduces each turn based on bribes
  bribedOfficials: BribedOfficial[];
  arrests: Arrest[];
  rattingRisk: number; // 0-100, chance someone will turn state's witness
}

export interface Arrest {
  id: string;
  type: 'street' | 'management' | 'player';
  target: string; // Name of arrested person
  turn: number; // When arrest happened
  sentence: number; // Turns in jail
  impactOnProfit: number; // Percentage reduction in profits
}

export interface BribedOfficial {
  id: string;
  rank: 'officer' | 'sergeant' | 'captain' | 'chief' | 'mayor';
  name: string;
  monthlyBribe: number;
  heatReduction: number; // Heat reduction per turn
  permissions: string[]; // What this bribe unlocks
}

export interface BusinessAction {
  type: 'build_legal' | 'build_illegal' | 'upgrade' | 'extort' | 'launder' | 'collect' | 'hire_lawyer' | 'fire_lawyer' | 'bribe_official' | 'stop_bribe' | 'rival_info' | 'shutdown_rival';
  businessId?: string;
  businessType?: Business['category'];
  district?: string;
  amount?: number;
  lawyerId?: string;
  officialId?: string;
  rivalFamily?: string;
}