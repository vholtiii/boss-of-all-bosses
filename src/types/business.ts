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

export interface BusinessAction {
  type: 'build_legal' | 'build_illegal' | 'upgrade' | 'extort' | 'launder' | 'collect' | 'hire_lawyer' | 'fire_lawyer';
  businessId?: string;
  businessType?: Business['category'];
  district?: string;
  amount?: number;
  lawyerId?: string;
}