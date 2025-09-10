// Comprehensive Combat System Implementation

import { 
  CombatSystem, 
  TerritoryBattle, 
  SoldierTraining, 
  SoldierEquipment, 
  CombatModifier 
} from '@/types/enhanced-mechanics';

export class CombatSystemManager {
  private combatSystem: CombatSystem;

  constructor(initialCombat: CombatSystem) {
    this.combatSystem = initialCombat;
  }

  // ===== COMBAT CALCULATION ENGINE =====

  /**
   * Calculate combat effectiveness based on multiple factors
   */
  calculateCombatEffectiveness(
    attackingSoldiers: number,
    defendingSoldiers: number,
    attackerTraining: SoldierTraining,
    defenderTraining: SoldierTraining,
    modifiers: CombatModifier[] = []
  ): {
    attackerEffectiveness: number;
    defenderEffectiveness: number;
    victoryChance: number;
  } {
    // Base effectiveness calculation
    let attackerEffectiveness = attackingSoldiers * this.getTrainingMultiplier(attackerTraining);
    let defenderEffectiveness = defendingSoldiers * this.getTrainingMultiplier(defenderTraining);

    // Apply equipment bonuses
    attackerEffectiveness *= (1 + attackerTraining.equipment.effectiveness / 100);
    defenderEffectiveness *= (1 + defenderTraining.equipment.effectiveness / 100);

    // Apply combat modifiers
    modifiers.forEach(modifier => {
      switch (modifier.type) {
        case 'terrain':
          // Terrain affects both sides differently
          attackerEffectiveness *= (1 + modifier.value / 100);
          defenderEffectiveness *= (1 + modifier.value / 100);
          break;
        case 'weather':
          // Weather can help or hinder both sides
          attackerEffectiveness *= (1 + modifier.value / 100);
          defenderEffectiveness *= (1 + modifier.value / 100);
          break;
        case 'surprise':
          // Surprise only helps the attacker
          attackerEffectiveness *= (1 + modifier.value / 100);
          break;
        case 'intelligence':
          // Intelligence helps the side with better intel
          attackerEffectiveness *= (1 + modifier.value / 100);
          break;
        case 'equipment':
          // Equipment modifier (already applied above, but can be overridden)
          attackerEffectiveness *= (1 + modifier.value / 100);
          break;
      }
    });

    // Calculate victory chance
    const totalEffectiveness = attackerEffectiveness + defenderEffectiveness;
    const victoryChance = totalEffectiveness > 0 ? 
      (attackerEffectiveness / totalEffectiveness) * 100 : 50;

    return {
      attackerEffectiveness,
      defenderEffectiveness,
      victoryChance
    };
  }

  /**
   * Get training level multiplier
   */
  private getTrainingMultiplier(training: SoldierTraining): number {
    const baseMultiplier = 1.0;
    const levelBonus = (training.level - 1) * 0.2; // 20% per level
    const experienceBonus = training.experience / 100 * 0.5; // Up to 50% from experience
    
    return baseMultiplier + levelBonus + experienceBonus;
  }

  // ===== TERRITORY BATTLE SYSTEM =====

  /**
   * Initiate a territory battle
   */
  initiateTerritoryBattle(
    attackingFamily: string,
    defendingFamily: string,
    territory: string,
    attackingSoldiers: number,
    defendingSoldiers: number,
    turn: number
  ): TerritoryBattle {
    const battleId = `battle-${territory}-${turn}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get training levels for both families
    const attackerTraining = this.combatSystem.soldierTraining; // Player's training
    const defenderTraining = this.getAITraining(defendingFamily); // AI training
    
    // Calculate combat effectiveness
    const combatResult = this.calculateCombatEffectiveness(
      attackingSoldiers,
      defendingSoldiers,
      attackerTraining,
      defenderTraining,
      this.combatSystem.combatModifiers
    );

    // Determine battle outcome
    const randomRoll = Math.random() * 100;
    const outcome: 'victory' | 'defeat' | 'ongoing' = 
      randomRoll < combatResult.victoryChance ? 'victory' : 'defeat';

    // Calculate casualties
    const casualties = this.calculateCasualties(
      attackingSoldiers,
      defendingSoldiers,
      combatResult,
      outcome
    );

    // Calculate spoils
    const spoils = this.calculateSpoils(
      territory,
      outcome,
      casualties,
      attackingFamily
    );

    const battle: TerritoryBattle = {
      id: battleId,
      attackingFamily,
      defendingFamily,
      territory,
      turn,
      outcome,
      casualties,
      spoils
    };

    // Add battle to history
    this.combatSystem.territoryBattles.push(battle);

    return battle;
  }

  /**
   * Calculate casualties based on combat effectiveness and outcome
   */
  private calculateCasualties(
    attackingSoldiers: number,
    defendingSoldiers: number,
    combatResult: any,
    outcome: 'victory' | 'defeat' | 'ongoing'
  ): { attacking: number; defending: number } {
    const baseCasualtyRate = 0.15; // 15% base casualty rate
    const effectivenessRatio = combatResult.attackerEffectiveness / 
      (combatResult.attackerEffectiveness + combatResult.defenderEffectiveness);

    let attackingCasualties: number;
    let defendingCasualties: number;

    if (outcome === 'victory') {
      // Attacker wins, takes fewer casualties
      attackingCasualties = Math.floor(attackingSoldiers * baseCasualtyRate * (1 - effectivenessRatio));
      defendingCasualties = Math.floor(defendingSoldiers * baseCasualtyRate * (1 + effectivenessRatio));
    } else {
      // Defender wins, attacker takes more casualties
      attackingCasualties = Math.floor(attackingSoldiers * baseCasualtyRate * (1 + effectivenessRatio));
      defendingCasualties = Math.floor(defendingSoldiers * baseCasualtyRate * (1 - effectivenessRatio));
    }

    return {
      attacking: Math.max(1, attackingCasualties), // Minimum 1 casualty
      defending: Math.max(1, defendingCasualties)
    };
  }

  /**
   * Calculate spoils of war
   */
  private calculateSpoils(
    territory: string,
    outcome: 'victory' | 'defeat' | 'ongoing',
    casualties: { attacking: number; defending: number },
    attackingFamily: string
  ): { money: number; territory: number; reputation: number } {
    if (outcome !== 'victory') {
      return { money: 0, territory: 0, reputation: 0 };
    }

    // Base spoils calculation
    const territoryValue = this.getTerritoryValue(territory);
    const moneySpoils = territoryValue * 0.1; // 10% of territory value
    const reputationGain = Math.floor(casualties.defending * 2); // 2 reputation per enemy casualty

    return {
      money: Math.floor(moneySpoils),
      territory: 1, // 1 territory point
      reputation: reputationGain
    };
  }

  // ===== SOLDIER TRAINING SYSTEM =====

  /**
   * Upgrade soldier training level
   */
  upgradeTrainingLevel(cost: number): boolean {
    if (this.combatSystem.soldierTraining.level >= 5) {
      return false; // Already at max level
    }

    const upgradeCost = this.getTrainingUpgradeCost();
    if (cost < upgradeCost) {
      return false; // Insufficient funds
    }

    this.combatSystem.soldierTraining.level += 1;
    return true;
  }

  /**
   * Get cost to upgrade training level
   */
  getTrainingUpgradeCost(): number {
    const currentLevel = this.combatSystem.soldierTraining.level;
    return currentLevel * 10000; // $10k per level
  }

  /**
   * Add experience to soldiers
   */
  addExperience(amount: number): void {
    this.combatSystem.soldierTraining.experience = Math.min(
      100,
      this.combatSystem.soldierTraining.experience + amount
    );
  }

  /**
   * Upgrade equipment
   */
  upgradeEquipment(
    type: 'weapons' | 'armor' | 'vehicles',
    newLevel: 'basic' | 'advanced' | 'military_grade' | 'none' | 'light' | 'heavy' | 'cars' | 'armored'
  ): boolean {
    const currentEquipment = this.combatSystem.soldierTraining.equipment;
    const upgradeCost = this.getEquipmentCost(type, newLevel);

    if (upgradeCost > 0) {
      // Update equipment
      (currentEquipment as any)[type] = newLevel;
      currentEquipment.cost += upgradeCost;
      currentEquipment.effectiveness = this.calculateEquipmentEffectiveness(currentEquipment);
      return true;
    }

    return false;
  }

  /**
   * Get equipment upgrade cost
   */
  private getEquipmentCost(
    type: string,
    level: string
  ): number {
    const costs = {
      weapons: {
        basic: 5000,
        advanced: 15000,
        military_grade: 35000
      },
      armor: {
        none: 0,
        light: 8000,
        heavy: 25000
      },
      vehicles: {
        none: 0,
        cars: 12000,
        armored: 40000
      }
    };

    return (costs as any)[type]?.[level] || 0;
  }

  /**
   * Calculate total equipment effectiveness
   */
  private calculateEquipmentEffectiveness(equipment: SoldierEquipment): number {
    let effectiveness = 0;

    // Weapon effectiveness
    const weaponBonus = {
      basic: 5,
      advanced: 15,
      military_grade: 30
    };
    effectiveness += weaponBonus[equipment.weapons] || 0;

    // Armor effectiveness (defensive bonus)
    const armorBonus = {
      none: 0,
      light: 8,
      heavy: 20
    };
    effectiveness += armorBonus[equipment.armor] || 0;

    // Vehicle effectiveness (mobility bonus)
    const vehicleBonus = {
      none: 0,
      cars: 10,
      armored: 25
    };
    effectiveness += vehicleBonus[equipment.vehicles] || 0;

    return effectiveness;
  }

  // ===== COMBAT MODIFIERS =====

  /**
   * Add combat modifier
   */
  addCombatModifier(modifier: CombatModifier): void {
    this.combatSystem.combatModifiers.push(modifier);
  }

  /**
   * Remove combat modifier
   */
  removeCombatModifier(modifierId: string): void {
    this.combatSystem.combatModifiers = this.combatSystem.combatModifiers.filter(
      m => m.type !== modifierId
    );
  }

  /**
   * Get terrain modifier for territory
   */
  getTerrainModifier(territory: string): CombatModifier {
    const terrainModifiers = {
      'Little Italy': { value: 10, description: 'Familiar territory advantage' },
      'Bronx': { value: -5, description: 'Urban warfare disadvantage' },
      'Brooklyn': { value: 5, description: 'Industrial area advantage' },
      'Queens': { value: 0, description: 'Neutral territory' },
      'Manhattan': { value: -10, description: 'High police presence' },
      'Staten Island': { value: 15, description: 'Isolated territory advantage' }
    };

    const modifier = terrainModifiers[territory as keyof typeof terrainModifiers] || 
      { value: 0, description: 'Standard territory' };

    return {
      type: 'terrain',
      value: modifier.value,
      description: modifier.description
    };
  }

  /**
   * Get weather modifier
   */
  getWeatherModifier(weather: string): CombatModifier {
    const weatherModifiers = {
      'clear': { value: 0, description: 'Clear weather, no modifiers' },
      'rain': { value: -10, description: 'Rain reduces visibility and mobility' },
      'snow': { value: -15, description: 'Snow severely hampers movement' },
      'fog': { value: -20, description: 'Fog creates confusion and reduces accuracy' },
      'storm': { value: -25, description: 'Storm makes combat extremely difficult' }
    };

    const modifier = weatherModifiers[weather as keyof typeof weatherModifiers] || 
      { value: 0, description: 'Unknown weather' };

    return {
      type: 'weather',
      value: modifier.value,
      description: modifier.description
    };
  }

  // ===== HELPER METHODS =====

  /**
   * Get AI training level (simplified)
   */
  private getAITraining(family: string): SoldierTraining {
    // AI families have different training levels
    const aiTraining = {
      'genovese': { level: 2, experience: 30 },
      'lucchese': { level: 1, experience: 20 },
      'bonanno': { level: 3, experience: 40 },
      'colombo': { level: 1, experience: 15 }
    };

    const training = aiTraining[family as keyof typeof aiTraining] || 
      { level: 1, experience: 10 };

    return {
      level: training.level,
      equipment: {
        weapons: 'basic',
        armor: 'none',
        vehicles: 'none',
        cost: 0,
        effectiveness: 0
      },
      specialization: 'enforcer',
      experience: training.experience
    };
  }

  /**
   * Get territory value for spoils calculation
   */
  private getTerritoryValue(territory: string): number {
    const territoryValues = {
      'Little Italy': 50000,
      'Bronx': 40000,
      'Brooklyn': 45000,
      'Queens': 35000,
      'Manhattan': 100000,
      'Staten Island': 30000
    };

    return territoryValues[territory as keyof typeof territoryValues] || 25000;
  }

  // ===== GETTERS =====

  getCombatSystem(): CombatSystem {
    return this.combatSystem;
  }

  getRecentBattles(limit: number = 5): TerritoryBattle[] {
    return this.combatSystem.territoryBattles
      .slice(-limit)
      .reverse();
  }

  getTrainingLevel(): number {
    return this.combatSystem.soldierTraining.level;
  }

  getEquipment(): SoldierEquipment {
    return this.combatSystem.soldierTraining.equipment;
  }

  getExperience(): number {
    return this.combatSystem.soldierTraining.experience;
  }
}

// ===== COMBAT ACTIONS =====

export interface CombatAction {
  type: 'attack_territory' | 'defend_territory' | 'raid_business' | 'assassinate_target';
  target: string;
  soldiers: number;
  cost: number;
  risk: number;
  expectedOutcome: {
    success: number;
    casualties: number;
    spoils: number;
  };
}

export const COMBAT_ACTIONS: CombatAction[] = [
  {
    type: 'attack_territory',
    target: 'territory',
    soldiers: 3, // Reduced since everyone starts with 5 soldiers
    cost: 8000,
    risk: 35,
    expectedOutcome: {
      success: 55,
      casualties: 1,
      spoils: 20000
    }
  },
  {
    type: 'raid_business',
    target: 'business',
    soldiers: 2, // Reduced for early game
    cost: 4000,
    risk: 25,
    expectedOutcome: {
      success: 70,
      casualties: 1,
      spoils: 12000
    }
  },
  {
    type: 'assassinate_target',
    target: 'person',
    soldiers: 1, // Reduced for early game
    cost: 12000,
    risk: 60,
    expectedOutcome: {
      success: 35,
      casualties: 1,
      spoils: 3000
    }
  }
];

// ===== COMBAT EVENTS =====

export interface CombatEvent {
  id: string;
  type: 'battle_victory' | 'battle_defeat' | 'soldier_training' | 'equipment_upgrade';
  title: string;
  description: string;
  effects: {
    soldiers?: number;
    money?: number;
    reputation?: number;
    experience?: number;
  };
  turn: number;
}

export const generateCombatEvent = (
  type: CombatEvent['type'],
  battle?: TerritoryBattle
): CombatEvent => {
  const events = {
    battle_victory: {
      title: 'Territory Secured',
      description: `Victory in ${battle?.territory}! Your soldiers have proven their worth.`,
      effects: {
        soldiers: -battle?.casualties.attacking || 0,
        money: battle?.spoils.money || 0,
        reputation: battle?.spoils.reputation || 0,
        experience: 10
      }
    },
    battle_defeat: {
      title: 'Territory Lost',
      description: `Defeat in ${battle?.territory}. Your soldiers need better training.`,
      effects: {
        soldiers: -battle?.casualties.attacking || 0,
        reputation: -5,
        experience: 5
      }
    },
    soldier_training: {
      title: 'Training Complete',
      description: 'Your soldiers have improved their combat skills.',
      effects: {
        experience: 15
      }
    },
    equipment_upgrade: {
      title: 'Equipment Upgraded',
      description: 'Your soldiers are now better equipped for combat.',
      effects: {
        money: -10000 // Cost of upgrade
      }
    }
  };

  const event = events[type];
  
  return {
    id: `combat-event-${Date.now()}`,
    type,
    title: event.title,
    description: event.description,
    effects: event.effects,
    turn: Date.now() // This would be the actual turn number
  };
};
