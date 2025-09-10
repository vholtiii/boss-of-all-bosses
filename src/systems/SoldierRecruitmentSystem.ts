// Soldier Recruitment System - Realistic Mafia Progression

import { EnhancedReputationSystem } from '@/types/enhanced-mechanics';

export interface SoldierRecruitment {
  baseSoldiers: number;
  loyaltyBonus: number;
  streetInfluenceBonus: number;
  reputationBonus: number;
  totalSoldiers: number;
  recruitmentCost: number;
  recruitmentTime: number; // Turns to recruit
}

export interface RecruitmentAction {
  type: 'recruit_soldier' | 'train_soldier' | 'promote_soldier';
  cost: number;
  time: number;
  requirements: {
    loyalty?: number;
    streetInfluence?: number;
    reputation?: number;
    money?: number;
  };
  effects: {
    soldiers?: number;
    loyalty?: number;
    streetInfluence?: number;
    reputation?: number;
  };
}

export class SoldierRecruitmentManager {
  private reputationSystem: EnhancedReputationSystem;

  constructor(reputationSystem: EnhancedReputationSystem) {
    this.reputationSystem = reputationSystem;
  }

  /**
   * Calculate total soldiers based on reputation factors
   */
  calculateTotalSoldiers(): SoldierRecruitment {
    const baseSoldiers = 5; // Everyone starts with 5 soldiers
    
    // Loyalty bonus: Every 10 loyalty points = 1 additional soldier
    const loyaltyBonus = Math.floor(this.reputationSystem.loyalty / 10);
    
    // Street influence bonus: Every 15 street influence points = 1 additional soldier
    const streetInfluenceBonus = Math.floor(this.reputationSystem.streetInfluence / 15);
    
    // Reputation bonus: Every 20 reputation points = 1 additional soldier
    const reputationBonus = Math.floor(this.reputationSystem.reputation / 20);
    
    const totalSoldiers = baseSoldiers + loyaltyBonus + streetInfluenceBonus + reputationBonus;
    
    // Calculate recruitment cost (increases with each soldier)
    const recruitmentCost = this.calculateRecruitmentCost(totalSoldiers);
    
    // Calculate recruitment time (increases with each soldier)
    const recruitmentTime = this.calculateRecruitmentTime(totalSoldiers);

    return {
      baseSoldiers,
      loyaltyBonus,
      streetInfluenceBonus,
      reputationBonus,
      totalSoldiers,
      recruitmentCost,
      recruitmentTime
    };
  }

  /**
   * Calculate cost to recruit next soldier
   */
  private calculateRecruitmentCost(currentSoldiers: number): number {
    // Base cost increases exponentially
    const baseCost = 5000; // $5,000 for first additional soldier
    const costMultiplier = 1.2; // 20% increase per soldier
    
    return Math.floor(baseCost * Math.pow(costMultiplier, currentSoldiers - 5));
  }

  /**
   * Calculate time to recruit next soldier
   */
  private calculateRecruitmentTime(currentSoldiers: number): number {
    // Recruitment time increases with each soldier
    const baseTime = 2; // 2 turns for first additional soldier
    const timeIncrease = 0.5; // +0.5 turns per soldier
    
    return Math.floor(baseTime + (currentSoldiers - 5) * timeIncrease);
  }

  /**
   * Get available recruitment actions
   */
  getRecruitmentActions(): RecruitmentAction[] {
    const currentStats = this.calculateTotalSoldiers();
    
    return [
      {
        type: 'recruit_soldier',
        cost: currentStats.recruitmentCost,
        time: currentStats.recruitmentTime,
        requirements: {
          loyalty: 20, // Minimum loyalty to recruit
          streetInfluence: 15, // Minimum street influence
          money: currentStats.recruitmentCost
        },
        effects: {
          soldiers: 1,
          loyalty: -2, // Recruiting reduces loyalty temporarily
          streetInfluence: -1 // Recruiting reduces street influence temporarily
        }
      },
      {
        type: 'train_soldier',
        cost: 3000,
        time: 1,
        requirements: {
          soldiers: 1, // Need at least 1 soldier to train
          money: 3000
        },
        effects: {
          loyalty: 1, // Training increases loyalty
          streetInfluence: 1 // Training increases street influence
        }
      },
      {
        type: 'promote_soldier',
        cost: 8000,
        time: 2,
        requirements: {
          soldiers: 3, // Need at least 3 soldiers to promote
          loyalty: 40,
          streetInfluence: 30,
          money: 8000
        },
        effects: {
          loyalty: 3, // Promoting increases loyalty significantly
          streetInfluence: 2, // Promoting increases street influence
          reputation: 1 // Promoting increases reputation
        }
      }
    ];
  }

  /**
   * Calculate soldier effectiveness based on loyalty and training
   */
  calculateSoldierEffectiveness(): number {
    const loyaltyBonus = this.reputationSystem.loyalty * 0.5; // 0.5% per loyalty point
    const streetInfluenceBonus = this.reputationSystem.streetInfluence * 0.3; // 0.3% per street influence point
    const reputationBonus = this.reputationSystem.reputation * 0.2; // 0.2% per reputation point
    
    return 100 + loyaltyBonus + streetInfluenceBonus + reputationBonus; // Base 100% effectiveness
  }

  /**
   * Get recruitment recommendations based on current stats
   */
  getRecruitmentRecommendations(): string[] {
    const recommendations: string[] = [];
    const loyalty = this.reputationSystem.loyalty;
    const streetInfluence = this.reputationSystem.streetInfluence;
    const reputation = this.reputationSystem.reputation;

    if (loyalty < 20) {
      recommendations.push("Focus on building loyalty through fair treatment and successful operations");
    }

    if (streetInfluence < 15) {
      recommendations.push("Increase street influence by controlling more territory and businesses");
    }

    if (reputation < 20) {
      recommendations.push("Build reputation through successful business operations and strategic victories");
    }

    if (loyalty >= 20 && streetInfluence >= 15) {
      recommendations.push("Ready to recruit additional soldiers! Focus on maintaining loyalty and influence.");
    }

    if (loyalty >= 40 && streetInfluence >= 30) {
      recommendations.push("Consider promoting experienced soldiers to increase overall effectiveness");
    }

    return recommendations;
  }

  /**
   * Calculate maximum possible soldiers based on current reputation
   */
  getMaxPossibleSoldiers(): number {
    const maxLoyalty = 100;
    const maxStreetInfluence = 100;
    const maxReputation = 100;
    
    const baseSoldiers = 5;
    const maxLoyaltyBonus = Math.floor(maxLoyalty / 10); // 10 soldiers max from loyalty
    const maxStreetInfluenceBonus = Math.floor(maxStreetInfluence / 15); // 6 soldiers max from street influence
    const maxReputationBonus = Math.floor(maxReputation / 20); // 5 soldiers max from reputation
    
    return baseSoldiers + maxLoyaltyBonus + maxStreetInfluenceBonus + maxReputationBonus; // 26 soldiers maximum
  }

  /**
   * Get soldier quality based on reputation factors
   */
  getSoldierQuality(): 'green' | 'experienced' | 'veteran' | 'elite' {
    const totalSoldiers = this.calculateTotalSoldiers().totalSoldiers;
    const effectiveness = this.calculateSoldierEffectiveness();
    
    if (totalSoldiers <= 8 && effectiveness < 120) {
      return 'green';
    } else if (totalSoldiers <= 15 && effectiveness < 150) {
      return 'experienced';
    } else if (totalSoldiers <= 22 && effectiveness < 180) {
      return 'veteran';
    } else {
      return 'elite';
    }
  }

  /**
   * Calculate maintenance cost for soldiers
   */
  calculateMaintenanceCost(): number {
    const totalSoldiers = this.calculateTotalSoldiers().totalSoldiers;
    const baseCost = 1000; // $1,000 per soldier per turn
    
    return totalSoldiers * baseCost;
  }

  /**
   * Get recruitment efficiency based on current reputation
   */
  getRecruitmentEfficiency(): number {
    const loyalty = this.reputationSystem.loyalty;
    const streetInfluence = this.reputationSystem.streetInfluence;
    const reputation = this.reputationSystem.reputation;
    
    // Higher reputation = more efficient recruitment
    const efficiency = (loyalty + streetInfluence + reputation) / 3;
    
    return Math.min(100, efficiency); // Max 100% efficiency
  }
}

// Recruitment Events
export interface RecruitmentEvent {
  id: string;
  type: 'loyalty_boost' | 'street_influence_boost' | 'reputation_boost' | 'recruitment_opportunity';
  title: string;
  description: string;
  effects: {
    loyalty?: number;
    streetInfluence?: number;
    reputation?: number;
    soldiers?: number;
  };
  cost?: number;
  requirements?: {
    loyalty?: number;
    streetInfluence?: number;
    reputation?: number;
  };
  turn: number;
  expires: number;
}

export const generateRecruitmentEvent = (
  type: RecruitmentEvent['type'],
  currentReputation: EnhancedReputationSystem
): RecruitmentEvent => {
  const events = {
    loyalty_boost: {
      title: 'Family Loyalty Drive',
      description: 'Your family members are showing increased loyalty. This is a good time to recruit.',
      effects: { loyalty: 5, soldiers: 0 },
      cost: 0,
      requirements: { loyalty: 10 }
    },
    street_influence_boost: {
      title: 'Street Credibility Increase',
      description: 'Your reputation on the streets has grown. More people want to join your organization.',
      effects: { streetInfluence: 5, soldiers: 0 },
      cost: 0,
      requirements: { streetInfluence: 10 }
    },
    reputation_boost: {
      title: 'Criminal Reputation Growth',
      description: 'Your reputation in the criminal underworld has increased. This attracts better recruits.',
      effects: { reputation: 5, soldiers: 0 },
      cost: 0,
      requirements: { reputation: 15 }
    },
    recruitment_opportunity: {
      title: 'Veteran Soldier Available',
      description: 'A veteran soldier from another family is looking to switch sides. This is a rare opportunity.',
      effects: { soldiers: 1, loyalty: -3, streetInfluence: 2 },
      cost: 15000,
      requirements: { loyalty: 30, streetInfluence: 25 }
    }
  };

  const event = events[type];
  
  return {
    id: `recruitment-event-${Date.now()}`,
    type,
    title: event.title,
    description: event.description,
    effects: event.effects,
    cost: event.cost,
    requirements: event.requirements,
    turn: Date.now(), // This would be the actual turn number
    expires: Date.now() + 3 // Expires in 3 turns
  };
};

// AI Family Soldier Calculations
export const calculateAIFamilySoldiers = (family: string, reputation: any): number => {
  const baseSoldiers = 5; // All families start with 5 soldiers
  
  // AI families have different reputation growth rates
  const aiReputationMultipliers = {
    'genovese': 1.2, // Aggressive, grows faster
    'lucchese': 0.8, // Opportunistic, grows slower
    'bonanno': 1.0, // Defensive, average growth
    'colombo': 1.5  // Unpredictable, grows fastest
  };
  
  const multiplier = aiReputationMultipliers[family as keyof typeof aiReputationMultipliers] || 1.0;
  
  // Calculate AI soldiers based on their reputation
  const loyaltyBonus = Math.floor(reputation.loyalty / 10);
  const streetInfluenceBonus = Math.floor(reputation.streetInfluence / 15);
  const reputationBonus = Math.floor(reputation.reputation / 20);
  
  const totalSoldiers = baseSoldiers + loyaltyBonus + streetInfluenceBonus + reputationBonus;
  
  // Apply AI family multiplier
  return Math.floor(totalSoldiers * multiplier);
};
