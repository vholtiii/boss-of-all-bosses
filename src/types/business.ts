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
}

export interface BusinessFinances {
  totalIncome: number;
  totalExpenses: number;
  legalProfit: number;
  illegalProfit: number;
  totalProfit: number;
  dirtyMoney: number; // Unlaundred money from illegal activities
  cleanMoney: number; // Laundered money ready to use
}

export interface BusinessAction {
  type: 'build_legal' | 'build_illegal' | 'upgrade' | 'extort' | 'launder' | 'collect';
  businessId?: string;
  businessType?: Business['category'];
  district?: string;
  amount?: number;
}