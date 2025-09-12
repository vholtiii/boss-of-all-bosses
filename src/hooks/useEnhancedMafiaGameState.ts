import { useState, useCallback, useEffect } from 'react';
import { 
  CombatSystem, 
  EconomySystem, 
  AIOpponent, 
  GameEvent, 
  EnhancedReputationSystem,
  Mission,
  WeatherSystem,
  TechnologySystem,
  SeasonalEvent
} from '@/types/enhanced-mechanics';
import { Business, BusinessFinances, LegalStatus, PoliceHeat } from '@/types/business';
import { ViolentAction } from '@/types/reputation';

export interface EnhancedMafiaGameState {
  // Core game state
  playerFamily: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  turn: number;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  
  // Resources
  resources: {
    money: number;
    respect: number;
    soldiers: number;
    influence: number;
    politicalPower: number;
    loyalty: number;
    researchPoints: number;
  };
  
  // Enhanced systems
  combat: CombatSystem;
  economy: EconomySystem;
  aiOpponents: AIOpponent[];
  events: GameEvent[];
  missions: Mission[];
  weather: WeatherSystem;
  technology: TechnologySystem;
  seasonalEvents: SeasonalEvent[];
  
  // Legacy systems (enhanced)
  reputation: EnhancedReputationSystem;
  violentActions: ViolentAction[];
  businesses: Business[];
  finances: BusinessFinances;
  legalStatus: LegalStatus;
  policeHeat: PoliceHeat;
  
  // UI state
  selectedTerritory?: any;
  activeEvent?: GameEvent;
  showMissionBoard: boolean;
  
  // Family control (territory control percentages)
  familyControl: {
    gambino: number;
    genovese: number;
    lucchese: number;
    bonanno: number;
    colombo: number;
  };
  
  // Territory system
  territories: Array<{
    district: 'Little Italy' | 'Bronx' | 'Brooklyn' | 'Queens' | 'Manhattan' | 'Staten Island';
    family: 'neutral' | 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
    businesses: Array<{
      q: number;
      r: number;
      s: number;
      businessId: string;
      businessType: string;
      isLegal: boolean;
      income: number;
      district: 'Little Italy' | 'Bronx' | 'Brooklyn' | 'Queens' | 'Manhattan' | 'Staten Island';
      family: 'neutral' | 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
      isExtorted?: boolean;
      heatLevel?: number;
      soldiers?: {
        count: number;
        family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
      };
      capo?: {
        name: string;
        family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
        level: number;
      };
    }>;
  }>;
}

const initialEnhancedGameState: EnhancedMafiaGameState = {
  playerFamily: 'gambino',
  turn: 1,
  season: 'spring',
  
  resources: {
    money: 50000,
    respect: 25,
    soldiers: 5, // Everyone starts with 5 soldiers
    influence: 10,
    politicalPower: 30,
    loyalty: 75,
    researchPoints: 0,
  },
  
  combat: {
    territoryBattles: [],
    soldierTraining: {
      level: 1,
      equipment: {
        weapons: 'basic',
        armor: 'none',
        vehicles: 'none',
        cost: 0,
        effectiveness: 0,
      },
      specialization: 'enforcer',
      experience: 0,
    },
    combatModifiers: [],
  },
  
  economy: {
    marketConditions: [
      {
        type: 'stable',
        sector: 'legal',
        modifier: 0,
        duration: 5,
        description: 'Legal businesses operating normally',
      },
    ],
    supplyChains: [],
    investments: [],
    economicEvents: [],
  },
  
  aiOpponents: [
    {
      family: 'genovese',
      personality: 'aggressive',
      resources: { money: 45000, soldiers: 5, influence: 8 }, // All start with 5 soldiers
      strategy: {
        primaryGoal: 'territory',
        riskTolerance: 70,
        aggressionLevel: 80,
        cooperationTendency: 30,
        focusAreas: ['Manhattan', 'Bronx'],
      },
      relationships: { gambino: -20, lucchese: 10, bonanno: -10, colombo: 5 },
      lastAction: null,
      nextAction: null,
    },
    {
      family: 'lucchese',
      personality: 'opportunistic',
      resources: { money: 38000, soldiers: 5, influence: 12 }, // All start with 5 soldiers
      strategy: {
        primaryGoal: 'money',
        riskTolerance: 50,
        aggressionLevel: 40,
        cooperationTendency: 60,
        focusAreas: ['Brooklyn', 'Queens'],
      },
      relationships: { gambino: 15, genovese: 10, bonanno: 20, colombo: -5 },
      lastAction: null,
      nextAction: null,
    },
    {
      family: 'bonanno',
      personality: 'defensive',
      resources: { money: 42000, soldiers: 5, influence: 6 }, // All start with 5 soldiers
      strategy: {
        primaryGoal: 'reputation',
        riskTolerance: 30,
        aggressionLevel: 25,
        cooperationTendency: 70,
        focusAreas: ['Staten Island', 'Little Italy'],
      },
      relationships: { gambino: 5, genovese: -10, lucchese: 20, colombo: 15 },
      lastAction: null,
      nextAction: null,
    },
    {
      family: 'colombo',
      personality: 'unpredictable',
      resources: { money: 35000, soldiers: 5, influence: 15 }, // All start with 5 soldiers
      strategy: {
        primaryGoal: 'elimination',
        riskTolerance: 90,
        aggressionLevel: 95,
        cooperationTendency: 10,
        focusAreas: ['Queens', 'Brooklyn'],
      },
      relationships: { gambino: -30, genovese: 5, lucchese: -5, bonanno: 15 },
      lastAction: null,
      nextAction: null,
    },
  ],
  
  events: [],
  missions: [
    {
      id: 'tutorial-1',
      title: 'First Territory',
      description: 'Establish your first business operation in Little Italy',
      type: 'story',
      difficulty: 'easy',
      objectives: [
        {
          id: 'obj-1',
          description: 'Acquire a business in Little Italy',
          type: 'collect',
          target: 'Little Italy',
          amount: 1,
          completed: false,
        },
      ],
      rewards: [
        {
          type: 'money',
          amount: 10000,
          description: 'Startup capital bonus',
        },
        {
          type: 'reputation',
          amount: 5,
          description: 'Respect from the neighborhood',
        },
      ],
      status: 'available',
      progress: 0,
    },
  ],
  
  weather: {
    currentWeather: {
      type: 'clear',
      intensity: 0,
      duration: 3,
      description: 'Clear skies, perfect for business',
    },
    forecast: [],
    effects: [],
  },
  
  technology: {
    researched: [],
    available: [
      {
        id: 'wiretapping',
        name: 'Wiretapping',
        description: 'Listen in on rival family communications',
        category: 'intelligence',
        cost: 15000,
        researchTime: 3,
        prerequisites: [],
        effects: { combat: 20 },
        unlocked: false,
      },
      {
        id: 'armored_cars',
        name: 'Armored Vehicles',
        description: 'Protect your soldiers with armored vehicles',
        category: 'combat',
        cost: 25000,
        researchTime: 5,
        prerequisites: [],
        effects: { combat: 15 },
        unlocked: false,
      },
    ],
    researchProgress: {},
  },
  
  seasonalEvents: [],
  
  reputation: {
    respect: 25,
    reputation: 20,
    loyalty: 75,
    fear: 15,
    streetInfluence: 10,
    familyRelationships: {
      genovese: -20,
      lucchese: 15,
      bonanno: 5,
      colombo: -30,
    },
    publicPerception: {
      criminal: 60,
      businessman: 30,
      philanthropist: 10,
    },
    reputationHistory: [],
    achievements: [],
  },
  
  violentActions: [],
  businesses: [],
  finances: {
    totalIncome: 0,
    totalExpenses: 0,
    legalProfit: 0,
    illegalProfit: 0,
    totalProfit: 0,
    dirtyMoney: 0,
    cleanMoney: 0,
    legalCosts: 0,
  },
  legalStatus: {
    charges: [],
    lawyer: null,
    jailTime: 0,
    prosecutionRisk: 10,
    totalLegalCosts: 0,
  },
  policeHeat: {
    level: 15,
    reductionPerTurn: 2,
    bribedOfficials: [],
    arrests: [],
    rattingRisk: 5,
  },
  
  selectedTerritory: null,
  activeEvent: null,
  showMissionBoard: false,
  
  familyControl: {
    gambino: 20,
    genovese: 20,
    lucchese: 20,
    bonanno: 20,
    colombo: 20,
  },
  
  territories: [], // Will be populated by the hex grid component
};

export const useEnhancedMafiaGameState = () => {
  const [gameState, setGameState] = useState<EnhancedMafiaGameState>(initialEnhancedGameState);

  // Enhanced turn processing
  const endTurn = useCallback(() => {
    setGameState(prev => {
      const newState = { ...prev };
      
      // Process turn
      newState.turn += 1;
      
      // Update season (every 12 turns)
      const seasons = ['spring', 'summer', 'fall', 'winter'] as const;
      newState.season = seasons[Math.floor((newState.turn - 1) / 12) % 4];
      
      // Process economy
      processEconomy(newState);
      
      // Process AI opponents
      processAIOpponents(newState);
      
      // Process weather
      processWeather(newState);
      
      // Process seasonal events
      processSeasonalEvents(newState);
      
      // Process missions
      processMissions(newState);
      
      // Process technology research
      processTechnology(newState);
      
      // Process events
      processEvents(newState);
      
      // Update reputation
      updateReputation(newState);
      
      // Reduce police heat
      newState.policeHeat.level = Math.max(0, newState.policeHeat.level - newState.policeHeat.reductionPerTurn);
      
      return newState;
    });
  }, []);

  // Territory selection
  const selectTerritory = useCallback((territory: any) => {
    setGameState(prev => ({
      ...prev,
      selectedTerritory: territory,
    }));
  }, []);

  // Enhanced action system
  const performAction = useCallback((action: any) => {
    setGameState(prev => {
      const newState = { ...prev };
      
      // Process the action based on type
      switch (action.type) {
        case 'hit_territory':
          processTerritoryHit(newState, action);
          break;
        case 'extort_territory':
          processTerritoryExtortion(newState, action);
          break;
        case 'deploy_soldiers':
          deploySoldiers(newState, action);
          break;
        case 'deploy_capo':
          deployCapo(newState, action);
          break;
        case 'research_technology':
          startTechnologyResearch(newState, action.technologyId);
          break;
        case 'accept_mission':
          acceptMission(newState, action.missionId);
          break;
        case 'complete_mission':
          completeMission(newState, action.missionId);
          break;
        case 'make_investment':
          makeInvestment(newState, action);
          break;
        case 'bribe_official':
          bribeOfficial(newState, action);
          break;
        default:
          // Handle legacy actions
          break;
      }
      
      return newState;
    });
  }, []);

  // Business actions
  const performBusinessAction = useCallback((action: any) => {
    setGameState(prev => {
      const newState = { ...prev };
      
      // Process business action
      switch (action.type) {
        case 'build_business':
          buildBusiness(newState, action);
          break;
        case 'upgrade_business':
          upgradeBusiness(newState, action);
          break;
        case 'extort_business':
          extortBusiness(newState, action);
          break;
        case 'launder_money':
          launderMoney(newState, action);
          break;
        default:
          break;
      }
      
      return newState;
    });
  }, []);

  // Reputation actions
  const performReputationAction = useCallback((action: any) => {
    setGameState(prev => {
      const newState = { ...prev };
      
      // Process reputation action
      switch (action.type) {
        case 'violent_action':
          performViolentAction(newState, action);
          break;
        case 'charitable_donation':
          makeCharitableDonation(newState, action);
          break;
        case 'public_appearance':
          makePublicAppearance(newState, action);
          break;
        default:
          break;
      }
      
      return newState;
    });
  }, []);

  // Event handling
  const handleEventChoice = useCallback((eventId: string, choiceId: string) => {
    setGameState(prev => {
      const newState = { ...prev };
      const event = newState.events.find(e => e.id === eventId);
      
      if (event) {
        const choice = event.choices.find(c => c.id === choiceId);
        if (choice) {
          // Apply choice consequences
          choice.consequences.forEach(consequence => {
            applyConsequence(newState, consequence);
          });
          
          // Remove event
          newState.events = newState.events.filter(e => e.id !== eventId);
          newState.activeEvent = null;
        }
      }
      
      return newState;
    });
  }, []);

  // Helper functions
  const processEconomy = (state: EnhancedMafiaGameState) => {
    // Update market conditions
    state.economy.marketConditions = state.economy.marketConditions
      .map(condition => ({
        ...condition,
        duration: condition.duration - 1,
      }))
      .filter(condition => condition.duration > 0);
    
    // Process investments
    state.economy.investments = state.economy.investments
      .map(investment => ({
        ...investment,
        duration: investment.duration - 1,
        currentValue: investment.currentValue * (1 + investment.expectedReturn / 100),
      }))
      .filter(investment => investment.duration > 0);
    
    // Process territory income
    let totalTerritoryIncome = 0;
    state.territories.forEach(territory => {
      if (territory.family === 'gambino') {
        territory.businesses.forEach(business => {
          let incomeMultiplier = 0;
          
          if (business.capo && business.capo.family === 'gambino') {
            // Capo provides 100% income
            incomeMultiplier = 1.0;
          } else if (business.soldiers && business.soldiers.family === 'gambino') {
            // Soldiers provide 30% income
            incomeMultiplier = 0.3;
          }
          
          const territoryIncome = Math.floor(business.income * incomeMultiplier);
          totalTerritoryIncome += territoryIncome;
        });
      }
    });
    
    // Add territory income to player's money
    state.resources.money += totalTerritoryIncome;
    
    // Generate new economic events
    if (Math.random() < 0.3) {
      generateEconomicEvent(state);
    }
  };

  const processAIOpponents = (state: EnhancedMafiaGameState) => {
    state.aiOpponents.forEach(opponent => {
      // Update AI opponent state
      updateAIOpponentState(opponent, state);
      
      // Generate strategic AI action based on personality, strategy, and game state
      const action = generateStrategicAIAction(opponent, state);
      if (action) {
        executeStrategicAIAction(state, opponent, action);
      }
      
      // Process AI territory management
      processAITerritoryManagement(opponent, state);
      
      // Process AI resource management
      processAIResourceManagement(opponent, state);
    });
  };

  const processWeather = (state: EnhancedMafiaGameState) => {
    // Update current weather
    state.weather.currentWeather.duration -= 1;
    
    if (state.weather.currentWeather.duration <= 0) {
      // Generate new weather
      state.weather.currentWeather = generateWeatherCondition();
    }
    
    // Apply weather effects
    applyWeatherEffects(state);
  };

  const processSeasonalEvents = (state: EnhancedMafiaGameState) => {
    // Check for seasonal events
    if (Math.random() < 0.2) {
      generateSeasonalEvent(state);
    }
  };

  const processMissions = (state: EnhancedMafiaGameState) => {
    // Update mission progress
    state.missions.forEach(mission => {
      if (mission.status === 'active') {
        updateMissionProgress(state, mission);
      }
    });
  };

  const processTechnology = (state: EnhancedMafiaGameState) => {
    // Update research progress
    Object.keys(state.technology.researchProgress).forEach(techId => {
      state.technology.researchProgress[techId] += 1;
      
      const tech = state.technology.available.find(t => t.id === techId);
      if (tech && state.technology.researchProgress[techId] >= tech.researchTime) {
        // Research completed
        completeTechnologyResearch(state, techId);
      }
    });
  };

  const processEvents = (state: EnhancedMafiaGameState) => {
    // Generate random events
    if (Math.random() < 0.4) {
      generateRandomEvent(state);
    }
    
    // Remove expired events
    state.events = state.events.filter(event => 
      !event.expires || event.expires > state.turn
    );
  };

  const updateReputation = (state: EnhancedMafiaGameState) => {
    // Apply reputation decay
    state.reputation.reputation = Math.max(0, state.reputation.reputation - 0.5);
    state.reputation.fear = Math.max(0, state.reputation.fear - 1);
    state.reputation.loyalty = Math.min(100, state.reputation.loyalty + 1);
  };

  // Enhanced game mechanics implementations
  const generateEconomicEvent = (state: EnhancedMafiaGameState) => {
    const events = [
      {
        id: `economic-${Date.now()}`,
        type: 'boom' as const,
        title: 'Market Boom',
        description: 'Legal businesses are thriving, increasing income by 20%',
        duration: 3,
        effects: {
          money: 2000,
          heat: -5,
        },
      },
      {
        id: `economic-${Date.now()}`,
        type: 'market_crash' as const,
        title: 'Economic Recession',
        description: 'Tough times reduce all income by 15%',
        duration: 4,
        effects: {
          money: -1000,
          heat: 10,
        },
      },
      {
        id: `economic-${Date.now()}`,
        type: 'regulation' as const,
        title: 'Police Crackdown',
        description: 'Increased police presence raises heat levels',
        duration: 2,
        effects: {
          heat: 20,
          money: -500,
        },
      },
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    state.economy.economicEvents.push({
      ...event,
      turn: state.turn,
      expires: state.turn + event.duration,
      choices: [],
    });
  };

  // Enhanced AI State Management
  const updateAIOpponentState = (opponent: AIOpponent, state: EnhancedMafiaGameState) => {
    // Update relationships based on recent actions
    Object.keys(opponent.relationships).forEach(family => {
      if (family !== opponent.family) {
        // Gradual relationship decay
        const decay = Math.random() * 2 - 1; // -1 to 1
        opponent.relationships[family] = Math.max(-100, Math.min(100, 
          opponent.relationships[family] + decay
        ));
      }
    });

    // Update strategy based on current situation
    updateAIStrategy(opponent, state);
    
    // Update resource priorities
    updateAIResourcePriorities(opponent, state);
  };

  const updateAIStrategy = (opponent: AIOpponent, state: EnhancedMafiaGameState) => {
    const playerStrength = state.familyControl[state.playerFamily];
    const opponentStrength = state.familyControl[opponent.family];
    
    // Adjust strategy based on relative strength
    if (opponentStrength < playerStrength * 0.7) {
      // Weaker than player - become more defensive
      opponent.strategy.aggressionLevel = Math.max(20, opponent.strategy.aggressionLevel - 5);
      opponent.strategy.cooperationTendency = Math.min(90, opponent.strategy.cooperationTendency + 5);
    } else if (opponentStrength > playerStrength * 1.3) {
      // Stronger than player - become more aggressive
      opponent.strategy.aggressionLevel = Math.min(90, opponent.strategy.aggressionLevel + 5);
      opponent.strategy.cooperationTendency = Math.max(10, opponent.strategy.cooperationTendency - 5);
    }
  };

  const updateAIResourcePriorities = (opponent: AIOpponent, state: EnhancedMafiaGameState) => {
    // Adjust resource allocation based on current needs
    const totalResources = opponent.resources.money + (opponent.resources.soldiers * 1000) + (opponent.resources.influence * 500);
    
    if (opponent.resources.soldiers < 3) {
      // Low on soldiers - prioritize recruitment
      opponent.strategy.primaryGoal = 'territory';
    } else if (opponent.resources.money < 20000) {
      // Low on money - prioritize income
      opponent.strategy.primaryGoal = 'money';
    } else if (opponent.resources.influence < 5) {
      // Low on influence - prioritize reputation
      opponent.strategy.primaryGoal = 'reputation';
    }
  };

  // Strategic AI Action Generation
  const generateStrategicAIAction = (opponent: AIOpponent, state: EnhancedMafiaGameState) => {
    const availableActions = [];
    const gameContext = analyzeGameContext(opponent, state);
    
    // Territory Actions
    if (gameContext.canAttackPlayer && opponent.strategy.aggressionLevel > 50) {
      availableActions.push(generateTerritoryAttackAction(opponent, state, gameContext));
    }
    
    if (gameContext.canDefendTerritory && opponent.strategy.aggressionLevel < 50) {
      availableActions.push(generateDefenseAction(opponent, state, gameContext));
    }
    
    // Economic Actions
    if (opponent.strategy.primaryGoal === 'money' && opponent.resources.money > 15000) {
      availableActions.push(generateBusinessExpansionAction(opponent, state, gameContext));
    }
    
    // Diplomatic Actions
    if (opponent.strategy.cooperationTendency > 60 && gameContext.weakestFamily !== opponent.family) {
      availableActions.push(generateAllianceAction(opponent, state, gameContext));
    }
    
    // Sabotage Actions
    if (opponent.personality === 'unpredictable' && Math.random() < 0.3) {
      availableActions.push(generateSabotageAction(opponent, state, gameContext));
    }
    
    // Resource Management Actions
    if (opponent.resources.soldiers < 5 && opponent.resources.money > 10000) {
      availableActions.push(generateSoldierRecruitmentAction(opponent, state, gameContext));
    }
    
    // Capo Management Actions
    if (gameContext.canDeployCapo && opponent.resources.money > 20000) {
      availableActions.push(generateCapoDeploymentAction(opponent, state, gameContext));
    }
    
    // Filter and prioritize actions
    const validActions = availableActions.filter(action => action && action.successProbability > 0.3);
    
    if (validActions.length === 0) return null;
    
    // Select best action based on strategy and success probability
    return selectBestAIAction(validActions, opponent, gameContext);
  };

  const analyzeGameContext = (opponent: AIOpponent, state: EnhancedMafiaGameState) => {
    const playerStrength = state.familyControl[state.playerFamily];
    const opponentStrength = state.familyControl[opponent.family];
    
    // Find weakest and strongest families
    const familyStrengths = Object.entries(state.familyControl)
      .filter(([family]) => family !== 'neutral')
      .sort(([,a], [,b]) => b - a);
    
    const strongestFamily = familyStrengths[0]?.[0];
    const weakestFamily = familyStrengths[familyStrengths.length - 1]?.[0];
    
    // Analyze territory situation
    const playerTerritories = state.territories.filter(t => t.family === state.playerFamily);
    const opponentTerritories = state.territories.filter(t => t.family === opponent.family);
    
    // Check for attack opportunities
    const canAttackPlayer = opponentStrength > playerStrength * 0.8 && 
                           opponent.resources.soldiers >= 2 &&
                           opponent.resources.money >= 10000;
    
    // Check for defense needs
    const canDefendTerritory = opponentTerritories.length > 0 && 
                              opponent.resources.soldiers >= 1;
    
    // Check for capo deployment opportunities
    const canDeployCapo = opponentTerritories.some(territory => 
      territory.businesses.some(business => 
        business.family === opponent.family && 
        !business.capo && 
        business.income > 5000
      )
    );
    
    return {
      playerStrength,
      opponentStrength,
      strongestFamily,
      weakestFamily,
      canAttackPlayer,
      canDefendTerritory,
      canDeployCapo,
      playerTerritories,
      opponentTerritories,
      relativeStrength: opponentStrength / (playerStrength + 1),
      threatLevel: playerStrength > opponentStrength ? 'high' : 'low'
    };
  };

  // Specific Action Generation Functions
  const generateTerritoryAttackAction = (opponent: AIOpponent, state: EnhancedMafiaGameState, context: any) => {
    const playerTerritories = state.territories.filter(t => t.family === state.playerFamily);
    if (playerTerritories.length === 0) return null;
    
    const targetTerritory = playerTerritories[Math.floor(Math.random() * playerTerritories.length)];
    const attackStrength = Math.min(opponent.resources.soldiers, 3);
    const successProbability = Math.min(0.8, 0.4 + (attackStrength * 0.1) + (opponent.strategy.aggressionLevel / 200));
    
    return {
      type: 'territory_attack',
      target: targetTerritory.district,
      cost: 15000,
      soldiers: attackStrength,
      successProbability,
      expectedBenefit: targetTerritory.businesses.reduce((sum, b) => sum + b.income, 0) * 0.5,
      priority: opponent.strategy.aggressionLevel / 100
    };
  };

  const generateDefenseAction = (opponent: AIOpponent, state: EnhancedMafiaGameState, context: any) => {
    const opponentTerritories = state.territories.filter(t => t.family === opponent.family);
    if (opponentTerritories.length === 0) return null;
    
    const targetTerritory = opponentTerritories[Math.floor(Math.random() * opponentTerritories.length)];
    const defenseStrength = Math.min(opponent.resources.soldiers, 2);
    
    return {
      type: 'territory_defense',
      target: targetTerritory.district,
      cost: 8000,
      soldiers: defenseStrength,
      successProbability: 0.7,
      expectedBenefit: targetTerritory.businesses.reduce((sum, b) => sum + b.income, 0) * 0.3,
      priority: (100 - opponent.strategy.aggressionLevel) / 100
    };
  };

  const generateBusinessExpansionAction = (opponent: AIOpponent, state: EnhancedMafiaGameState, context: any) => {
    const businessTypes = ['restaurant', 'nightclub', 'casino', 'construction', 'import_export'];
    const businessType = businessTypes[Math.floor(Math.random() * businessTypes.length)];
    const investment = Math.min(opponent.resources.money * 0.3, 25000);
    const expectedReturn = investment * (1.2 + Math.random() * 0.3);
    
    return {
      type: 'business_expansion',
      businessType,
      cost: investment,
      successProbability: 0.6,
      expectedBenefit: expectedReturn - investment,
      priority: opponent.strategy.primaryGoal === 'money' ? 0.8 : 0.4
    };
  };

  const generateAllianceAction = (opponent: AIOpponent, state: EnhancedMafiaGameState, context: any) => {
    const targetFamily = context.weakestFamily;
    if (!targetFamily || targetFamily === opponent.family) return null;
    
    const currentRelationship = opponent.relationships[targetFamily] || 0;
    const successProbability = Math.max(0.3, (currentRelationship + 50) / 100);
    
    return {
      type: 'form_alliance',
      target: targetFamily,
      cost: 5000,
      successProbability,
      expectedBenefit: 15, // Relationship improvement
      priority: opponent.strategy.cooperationTendency / 100
    };
  };

  const generateSabotageAction = (opponent: AIOpponent, state: EnhancedMafiaGameState, context: any) => {
    const sabotageTypes = ['business_sabotage', 'intelligence_leak', 'resource_theft'];
    const sabotageType = sabotageTypes[Math.floor(Math.random() * sabotageTypes.length)];
    const successProbability = 0.4 + (opponent.resources.influence / 20);
    
    return {
      type: 'sabotage',
      sabotageType,
      target: state.playerFamily,
      cost: 12000,
      successProbability,
      expectedBenefit: 20000, // Estimated damage to player
      priority: 0.6
    };
  };

  const generateSoldierRecruitmentAction = (opponent: AIOpponent, state: EnhancedMafiaGameState, context: any) => {
    const soldiersToRecruit = Math.min(3, Math.floor(opponent.resources.money / 8000));
    const cost = soldiersToRecruit * 8000;
    const successProbability = 0.8;
    
    return {
      type: 'recruit_soldiers',
      soldiers: soldiersToRecruit,
      cost,
      successProbability,
      expectedBenefit: soldiersToRecruit * 1000, // Value of soldiers
      priority: opponent.resources.soldiers < 3 ? 0.9 : 0.5
    };
  };

  const generateCapoDeploymentAction = (opponent: AIOpponent, state: EnhancedMafiaGameState, context: any) => {
    const opponentTerritories = state.territories.filter(t => t.family === opponent.family);
    const targetTerritory = opponentTerritories.find(territory => 
      territory.businesses.some(business => 
        business.family === opponent.family && 
        !business.capo && 
        business.income > 5000
      )
    );
    
    if (!targetTerritory) return null;
    
    const targetBusiness = targetTerritory.businesses.find(b => 
      b.family === opponent.family && !b.capo && b.income > 5000
    );
    
    return {
      type: 'deploy_capo',
      target: targetBusiness?.businessId,
      territory: targetTerritory.district,
      cost: 20000,
      successProbability: 0.9,
      expectedBenefit: (targetBusiness?.income || 0) * 0.7, // 70% income increase
      priority: 0.7
    };
  };

  const selectBestAIAction = (actions: any[], opponent: AIOpponent, context: any) => {
    // Score actions based on priority, success probability, and expected benefit
    const scoredActions = actions.map(action => {
      const score = (action.priority * 0.4) + 
                   (action.successProbability * 0.3) + 
                   (Math.min(action.expectedBenefit / 10000, 1) * 0.3);
      return { ...action, score };
    });
    
    // Sort by score and select top action
    scoredActions.sort((a, b) => b.score - a.score);
    return scoredActions[0];
  };

  // Enhanced AI Action Execution
  const executeStrategicAIAction = (state: EnhancedMafiaGameState, opponent: AIOpponent, action: any) => {
    if (!action || Math.random() > action.successProbability) {
      // Action failed
      opponent.resources.money -= Math.floor(action.cost * 0.3); // Partial cost for failed action
      return;
    }

    switch (action.type) {
      case 'territory_attack':
        executeTerritoryAttack(state, opponent, action);
        break;
      case 'territory_defense':
        executeTerritoryDefense(state, opponent, action);
        break;
      case 'business_expansion':
        executeBusinessExpansion(state, opponent, action);
        break;
      case 'form_alliance':
        executeAllianceFormation(state, opponent, action);
        break;
      case 'sabotage':
        executeSabotage(state, opponent, action);
        break;
      case 'recruit_soldiers':
        executeSoldierRecruitment(state, opponent, action);
        break;
      case 'deploy_capo':
        executeCapoDeployment(state, opponent, action);
        break;
    }
    
    opponent.lastAction = action;
  };

  const executeTerritoryAttack = (state: EnhancedMafiaGameState, opponent: AIOpponent, action: any) => {
    opponent.resources.money -= action.cost;
    opponent.resources.soldiers -= action.soldiers;
    
    // Find and attack target territory
    const targetTerritory = state.territories.find(t => t.district === action.target);
    if (targetTerritory) {
      targetTerritory.family = opponent.family;
      // Remove player soldiers and capos from the territory
      targetTerritory.businesses.forEach(business => {
        if (business.family === state.playerFamily) {
          business.family = opponent.family;
          business.soldiers = undefined;
          business.capo = undefined;
        }
      });
      
      // Update family control
      state.familyControl[opponent.family] += 1;
      state.familyControl[state.playerFamily] = Math.max(0, state.familyControl[state.playerFamily] - 1);
    }
  };

  const executeTerritoryDefense = (state: EnhancedMafiaGameState, opponent: AIOpponent, action: any) => {
    opponent.resources.money -= action.cost;
    // Add defensive soldiers to territory
    const targetTerritory = state.territories.find(t => t.district === action.target);
    if (targetTerritory) {
      targetTerritory.businesses.forEach(business => {
        if (business.family === opponent.family) {
          business.soldiers = {
            count: (business.soldiers?.count || 0) + action.soldiers,
            family: opponent.family
          };
        }
      });
    }
  };

  const executeBusinessExpansion = (state: EnhancedMafiaGameState, opponent: AIOpponent, action: any) => {
    opponent.resources.money -= action.cost;
    opponent.resources.money += action.expectedBenefit;
    
    // Add new business to a random territory
    const availableTerritories = state.territories.filter(t => t.family === 'neutral');
    if (availableTerritories.length > 0) {
      const territory = availableTerritories[Math.floor(Math.random() * availableTerritories.length)];
      const newBusiness = {
        q: Math.floor(Math.random() * 20) - 10,
        r: Math.floor(Math.random() * 20) - 10,
        s: 0,
        businessId: `ai_business_${Date.now()}`,
        businessType: action.businessType,
        isLegal: Math.random() > 0.5,
        income: Math.floor(action.expectedBenefit / 12), // Monthly income
        district: territory.district,
        family: opponent.family
      };
      territory.businesses.push(newBusiness);
    }
  };

  const executeAllianceFormation = (state: EnhancedMafiaGameState, opponent: AIOpponent, action: any) => {
    opponent.resources.money -= action.cost;
    opponent.relationships[action.target] = Math.min(100, 
      (opponent.relationships[action.target] || 0) + action.expectedBenefit
    );
    
    // Improve relationship with target family
    const targetOpponent = state.aiOpponents.find(ai => ai.family === action.target);
    if (targetOpponent) {
      targetOpponent.relationships[opponent.family] = Math.min(100,
        (targetOpponent.relationships[opponent.family] || 0) + action.expectedBenefit
      );
    }
  };

  const executeSabotage = (state: EnhancedMafiaGameState, opponent: AIOpponent, action: any) => {
    opponent.resources.money -= action.cost;
    
    // Apply sabotage effects to player
    switch (action.sabotageType) {
      case 'business_sabotage':
        // Reduce player income temporarily
        state.resources.money -= Math.floor(action.expectedBenefit * 0.1);
        break;
      case 'intelligence_leak':
        // Increase police heat
        state.policeHeat.level = Math.min(100, state.policeHeat.level + 15);
        break;
      case 'resource_theft':
        // Steal money
        const stolenAmount = Math.min(state.resources.money, 10000);
        state.resources.money -= stolenAmount;
        opponent.resources.money += stolenAmount;
        break;
    }
  };

  const executeSoldierRecruitment = (state: EnhancedMafiaGameState, opponent: AIOpponent, action: any) => {
    opponent.resources.money -= action.cost;
    opponent.resources.soldiers += action.soldiers;
  };

  const executeCapoDeployment = (state: EnhancedMafiaGameState, opponent: AIOpponent, action: any) => {
    opponent.resources.money -= action.cost;
    
    // Deploy capo to target business
    const targetTerritory = state.territories.find(t => t.district === action.territory);
    if (targetTerritory) {
      const targetBusiness = targetTerritory.businesses.find(b => b.businessId === action.target);
      if (targetBusiness) {
        const capoNames = ['Vito', 'Salvatore', 'Antonio', 'Giuseppe', 'Francesco', 'Mario', 'Luigi', 'Paolo'];
        targetBusiness.capo = {
          name: capoNames[Math.floor(Math.random() * capoNames.length)],
          family: opponent.family,
          level: Math.floor(Math.random() * 5) + 1
        };
        // Remove soldiers when capo is deployed
        targetBusiness.soldiers = undefined;
      }
    }
  };

  // AI Territory and Resource Management
  const processAITerritoryManagement = (opponent: AIOpponent, state: EnhancedMafiaGameState) => {
    const opponentTerritories = state.territories.filter(t => t.family === opponent.family);
    
    // Deploy soldiers to territories that need protection
    opponentTerritories.forEach(territory => {
      territory.businesses.forEach(business => {
        if (business.family === opponent.family && !business.soldiers && !business.capo) {
          // Deploy soldiers to unprotected businesses
          if (opponent.resources.soldiers > 0 && Math.random() < 0.3) {
            business.soldiers = {
              count: Math.min(2, opponent.resources.soldiers),
              family: opponent.family
            };
            opponent.resources.soldiers -= business.soldiers.count;
          }
        }
      });
    });
    
    // Strategic territory expansion
    if (opponent.resources.soldiers >= 3 && Math.random() < 0.2) {
      const neutralTerritories = state.territories.filter(t => t.family === 'neutral');
      if (neutralTerritories.length > 0) {
        const targetTerritory = neutralTerritories[Math.floor(Math.random() * neutralTerritories.length)];
        const soldiersToDeploy = Math.min(2, opponent.resources.soldiers);
        
        // Deploy soldiers to neutral territory
        for (const business of targetTerritory.businesses) {
          if (!business.soldiers && !business.capo) {
            business.soldiers = {
              count: soldiersToDeploy,
              family: opponent.family
            };
            opponent.resources.soldiers -= soldiersToDeploy;
            break;
          }
        }
      }
    }
  };

  const processAIResourceManagement = (opponent: AIOpponent, state: EnhancedMafiaGameState) => {
    // AI resource allocation and optimization
    
    // Income generation from territories
    const opponentTerritories = state.territories.filter(t => t.family === opponent.family);
    let monthlyIncome = 0;
    
    opponentTerritories.forEach(territory => {
      territory.businesses.forEach(business => {
        if (business.family === opponent.family) {
          if (business.capo) {
            // Capo provides 100% income
            monthlyIncome += business.income;
          } else if (business.soldiers) {
            // Soldiers provide 30% income
            monthlyIncome += business.income * 0.3;
          }
        }
      });
    });
    
    // Add monthly income
    opponent.resources.money += monthlyIncome;
    
    // Resource maintenance costs
    const maintenanceCost = (opponent.resources.soldiers * 1000) + (opponent.resources.influence * 500);
    opponent.resources.money = Math.max(0, opponent.resources.money - maintenanceCost);
    
    // Strategic resource spending
    if (opponent.resources.money > 50000 && opponent.resources.soldiers < 8) {
      // Recruit more soldiers if wealthy
      const soldiersToRecruit = Math.min(3, Math.floor((opponent.resources.money - 30000) / 8000));
      const cost = soldiersToRecruit * 8000;
      if (opponent.resources.money >= cost) {
        opponent.resources.money -= cost;
        opponent.resources.soldiers += soldiersToRecruit;
      }
    }
    
    // Influence management
    if (opponent.resources.money > 30000 && opponent.resources.influence < 20) {
      const influenceCost = 5000;
      if (opponent.resources.money >= influenceCost) {
        opponent.resources.money -= influenceCost;
        opponent.resources.influence += 1;
      }
    }
  };

  const generateWeatherCondition = () => {
    const conditions = [
      { type: 'clear', description: 'Clear skies, perfect for business operations' },
      { type: 'rain', description: 'Heavy rain reduces police patrols' },
      { type: 'snow', description: 'Snowstorm makes travel difficult' },
      { type: 'fog', description: 'Thick fog provides cover for illegal activities' },
      { type: 'storm', description: 'Severe storm disrupts all operations' },
    ];
    
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    return {
      type: condition.type as any,
      intensity: Math.floor(Math.random() * 100),
      duration: Math.floor(Math.random() * 5) + 1,
      description: condition.description,
    };
  };

  const applyWeatherEffects = (state: EnhancedMafiaGameState) => {
    const weather = state.weather.currentWeather;
    
    switch (weather.type) {
      case 'rain':
        state.policeHeat.level = Math.max(0, state.policeHeat.level - 5);
        break;
      case 'fog':
        state.policeHeat.level = Math.max(0, state.policeHeat.level - 3);
        break;
      case 'storm':
        state.resources.money = Math.max(0, state.resources.money - 2000);
        state.policeHeat.level += 5;
        break;
      case 'snow':
        // Reduce movement and operations
        break;
    }
  };

  const generateSeasonalEvent = (state: EnhancedMafiaGameState) => {
    const seasonalEvents = {
      spring: [
        {
          id: `spring-${Date.now()}`,
          title: 'Spring Cleaning',
          description: 'Time to clean up loose ends and strengthen alliances',
          effects: { heat: -10, reputation: 5 },
        },
      ],
      summer: [
        {
          id: `summer-${Date.now()}`,
          title: 'Summer Heat',
          description: 'Hot weather increases tensions and police activity',
          effects: { heat: 15, business: -10 },
        },
      ],
      fall: [
        {
          id: `fall-${Date.now()}`,
          title: 'Harvest Season',
          description: 'Time to collect debts and expand operations',
          effects: { business: 30, reputation: 5 },
        },
      ],
      winter: [
        {
          id: `winter-${Date.now()}`,
          title: 'Winter Solstice',
          description: 'Cold weather brings opportunities for indoor operations',
          effects: { business: 25, heat: -8 },
        },
      ],
    };

    const events = seasonalEvents[state.season];
    if (events && events.length > 0) {
      const event = events[Math.floor(Math.random() * events.length)];
      state.seasonalEvents.push({
        ...event,
        turn: state.turn,
        duration: 3,
        name: event.title,
        season: state.season,
        specialActions: [],
      });
    }
  };

  const updateMissionProgress = (state: EnhancedMafiaGameState, mission: Mission) => {
    // Update mission progress based on current game state
    mission.objectives.forEach(objective => {
      if (!objective.completed) {
        switch (objective.type) {
          case 'collect':
            // Check if player has collected the required items
            if (objective.target === 'Little Italy' && state.familyControl[state.playerFamily] > 25) {
              objective.completed = true;
            }
            break;
          case 'eliminate':
            // Check if target has been eliminated
            break;
          case 'protect':
            // Check if target is still protected
            break;
        }
      }
    });

    // Calculate overall progress
    const completedObjectives = mission.objectives.filter(obj => obj.completed).length;
    mission.progress = Math.round((completedObjectives / mission.objectives.length) * 100);

    // Check if mission is complete
    if (mission.progress >= 100 && mission.status === 'active') {
      mission.status = 'completed';
      // Apply rewards
      mission.rewards.forEach(reward => {
        switch (reward.type) {
          case 'money':
            state.resources.money += reward.amount;
            break;
          case 'reputation':
            state.reputation.reputation += reward.amount;
            break;
          case 'soldiers':
            state.resources.soldiers += reward.amount;
            break;
        }
      });
    }
  };

  const completeTechnologyResearch = (state: EnhancedMafiaGameState, techId: string) => {
    const tech = state.technology.available.find(t => t.id === techId);
    if (tech) {
      tech.unlocked = true;
      state.technology.researched.push(tech);
      delete state.technology.researchProgress[techId];
    }
  };

  const generateRandomEvent = (state: EnhancedMafiaGameState) => {
    const events = [
      {
        id: `event-${Date.now()}`,
        type: 'random' as const,
        title: 'Police Raid',
        description: 'The police are planning a raid on your operations. What do you do?',
        choices: [
          {
            id: 'bribe',
            text: 'Bribe the officers ($10,000)',
            consequences: [
              { type: 'money' as const, value: -10000, description: 'Paid bribe to officers' },
              { type: 'heat' as const, value: -15, description: 'Reduced police heat' },
            ],
          },
          {
            id: 'hide',
            text: 'Hide evidence and lay low',
            consequences: [
              { type: 'heat' as const, value: -5, description: 'Reduced police heat' },
              { type: 'money' as const, value: -2000, description: 'Lost income from laying low' },
            ],
          },
          {
            id: 'fight',
            text: 'Stand your ground',
            consequences: [
              { type: 'heat' as const, value: 20, description: 'Increased police heat' },
              { type: 'reputation' as const, value: 10, description: 'Gained respect' },
            ],
          },
        ],
        consequences: [],
        turn: state.turn,
        expires: state.turn + 2,
      },
      {
        id: `event-${Date.now()}`,
        type: 'random' as const,
        title: 'Rival Family Meeting',
        description: 'A rival family wants to discuss territory boundaries.',
        choices: [
          {
            id: 'negotiate',
            text: 'Negotiate peacefully',
            consequences: [
              { type: 'reputation' as const, value: 5, description: 'Gained reputation' },
              { type: 'relationship' as const, value: 10, description: 'Improved relationship with Genovese' },
            ],
          },
          {
            id: 'threaten',
            text: 'Make threats',
            consequences: [
              { type: 'reputation' as const, value: 15, description: 'Increased fear' },
              { type: 'relationship' as const, value: -20, description: 'Damaged relationship with Genovese' },
            ],
          },
          {
            id: 'ignore',
            text: 'Ignore the meeting',
            consequences: [
              { type: 'relationship' as const, value: -10, description: 'Damaged relationship with Genovese' },
            ],
          },
        ],
        consequences: [],
        turn: state.turn,
        expires: state.turn + 1,
      },
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    state.events.push(event);
  };

  const applyConsequence = (state: EnhancedMafiaGameState, consequence: any) => {
    switch (consequence.type) {
      case 'money':
        state.resources.money += consequence.amount;
        break;
      case 'reputation':
        state.reputation.reputation += consequence.amount;
        break;
      case 'fear':
        state.reputation.fear += consequence.amount;
        break;
      case 'policeHeat':
        state.policeHeat.level += consequence.amount;
        break;
      case 'income':
        // Apply income multiplier
        break;
      case 'familyRelationship':
        if (consequence.family && state.reputation.familyRelationships[consequence.family] !== undefined) {
          state.reputation.familyRelationships[consequence.family] += consequence.amount;
        }
        break;
    }
  };

  // Enhanced action processing
  const processTerritoryHit = (state: EnhancedMafiaGameState, action: any) => {
    const { targetTerritory } = action;
    
    // Find the target territory
    const territory = state.territories.find(t => t.district === targetTerritory);
    if (!territory) return state;

    // Check if player has soldiers in the territory
    const playerSoldiersInTerritory = territory.businesses
      .filter(b => b.soldiers && b.soldiers.family === 'gambino')
      .reduce((total, b) => total + (b.soldiers?.count || 0), 0);

    // Can't hit without soldiers in the territory
    if (playerSoldiersInTerritory === 0) {
      return state; // No action taken
    }

    // Can only hit rival territories (not neutral or player's own)
    if (territory.family === 'neutral' || territory.family === 'gambino') {
      return state; // Invalid target
    }

    // Calculate defending soldiers
    const defendingSoldiers = territory.businesses
      .filter(b => b.soldiers && b.soldiers.family === territory.family)
      .reduce((total, b) => total + (b.soldiers?.count || 0), 0);

    // Determine victory conditions - need to outnumber defenders
    const victoryChance = playerSoldiersInTerritory > defendingSoldiers ? 0.8 : 0.2;
    
    if (Math.random() < victoryChance) {
      // Victory - take over territory
      const updatedTerritories = state.territories.map(t => 
        t.district === targetTerritory 
          ? { 
              ...t, 
              family: 'gambino' as const,
              businesses: t.businesses.map(b => ({
                ...b,
                family: 'gambino' as const,
                soldiers: b.soldiers ? {
                  ...b.soldiers,
                  family: 'gambino' as const
                } : undefined
              }))
            }
          : t
      );
      
      return {
        ...state,
        territories: updatedTerritories,
        resources: {
          ...state.resources,
          soldiers: state.resources.soldiers - Math.floor(playerSoldiersInTerritory * 0.2), // 20% casualties
          money: state.resources.money + 5000, // Territory income
          respect: state.resources.respect + 10
        }
      };
    } else {
      // Defeat - lose soldiers
      return {
        ...state,
        resources: {
          ...state.resources,
          soldiers: state.resources.soldiers - Math.floor(playerSoldiersInTerritory * 0.4) // 40% casualties
        }
      };
    }
  };

  const processTerritoryExtortion = (state: EnhancedMafiaGameState, action: any) => {
    const { targetTerritory } = action;
    
    // Find the target territory
    const territory = state.territories.find(t => t.district === targetTerritory);
    if (!territory) return state;

    // Check if player has soldiers in the territory
    const playerSoldiersInTerritory = territory.businesses
      .filter(b => b.soldiers && b.soldiers.family === 'gambino')
      .reduce((total, b) => total + (b.soldiers?.count || 0), 0);

    // Can't extort without soldiers in the territory
    if (playerSoldiersInTerritory === 0) {
      return state; // No action taken
    }

    // Can only extort neutral territories
    if (territory.family !== 'neutral') {
      return state; // Invalid target
    }

    // Extortion success - need at least 1 soldier
    const successChance = playerSoldiersInTerritory >= 1 ? 0.9 : 0;
    
    if (Math.random() < successChance) {
      // Success - take over territory
      const updatedTerritories = state.territories.map(t => 
        t.district === targetTerritory 
          ? { 
              ...t, 
              family: 'gambino' as const,
              businesses: t.businesses.map(b => ({
                ...b,
                family: 'gambino' as const,
                soldiers: b.soldiers ? {
                  ...b.soldiers,
                  family: 'gambino' as const
                } : undefined
              }))
            }
          : t
      );
      
      return {
        ...state,
        territories: updatedTerritories,
        resources: {
          ...state.resources,
          soldiers: state.resources.soldiers - Math.floor(playerSoldiersInTerritory * 0.1), // 10% casualties
          money: state.resources.money + 3000, // Territory income
          respect: state.resources.respect + 5
        }
      };
    } else {
      // Failure - lose soldiers
      return {
        ...state,
        resources: {
          ...state.resources,
          soldiers: state.resources.soldiers - Math.floor(playerSoldiersInTerritory * 0.2) // 20% casualties
        }
      };
    }
  };

  const startTechnologyResearch = (state: EnhancedMafiaGameState, techId: string) => {
    const tech = state.technology.available.find(t => t.id === techId);
    if (tech && state.resources.money >= tech.cost) {
      state.resources.money -= tech.cost;
      state.technology.researchProgress[techId] = 0;
    }
  };

  const acceptMission = (state: EnhancedMafiaGameState, missionId: string) => {
    const mission = state.missions.find(m => m.id === missionId);
    if (mission) {
      mission.status = 'active';
    }
  };

  const completeMission = (state: EnhancedMafiaGameState, missionId: string) => {
    const mission = state.missions.find(m => m.id === missionId);
    if (mission) {
      mission.status = 'completed';
      mission.rewards.forEach(reward => {
        switch (reward.type) {
          case 'money':
            state.resources.money += reward.amount;
            break;
          case 'reputation':
            state.reputation.reputation += reward.amount;
            break;
          case 'soldiers':
            state.resources.soldiers += reward.amount;
            break;
        }
      });
    }
  };

  // Deploy soldiers to a territory
  const deploySoldiers = (state: EnhancedMafiaGameState, action: any) => {
    const { territory, soldierCount } = action;
    
    if (state.resources.soldiers < soldierCount) {
      return state; // Not enough soldiers
    }

    // Find the territory
    const targetTerritory = state.territories.find(t => t.district === territory);
    if (!targetTerritory) return state;

    // Find a business in the territory to deploy soldiers to
    const business = targetTerritory.businesses.find(b => !b.soldiers || b.soldiers.family === 'gambino');
    if (!business) return state;

    // Deploy soldiers
    const updatedTerritories = state.territories.map(t => 
      t.district === territory
        ? {
            ...t,
            businesses: t.businesses.map(b => 
              b.businessId === business.businessId
                ? {
                    ...b,
                    soldiers: {
                      count: (b.soldiers?.count || 0) + soldierCount,
                      family: 'gambino' as const
                    }
                  }
                : b
            )
          }
        : t
    );

    return {
      ...state,
      territories: updatedTerritories,
      resources: {
        ...state.resources,
        soldiers: state.resources.soldiers - soldierCount
      }
    };
  };

  // Deploy capo to a territory
  const deployCapo = (state: EnhancedMafiaGameState, action: any) => {
    const { territory, capoName, capoLevel } = action;
    
    // Find the territory
    const targetTerritory = state.territories.find(t => t.district === territory);
    if (!targetTerritory) return state;

    // Can only deploy capo to player's own territory
    if (targetTerritory.family !== 'gambino') {
      return state; // Invalid target
    }

    // Find a business in the territory to deploy capo to
    const business = targetTerritory.businesses.find(b => !b.capo);
    if (!business) return state;

    // Deploy capo
    const updatedTerritories = state.territories.map(t => 
      t.district === territory
        ? {
            ...t,
            businesses: t.businesses.map(b => 
              b.businessId === business.businessId
                ? {
                    ...b,
                    capo: {
                      name: capoName,
                      family: 'gambino' as const,
                      level: capoLevel
                    },
                    // Remove soldiers when capo is deployed
                    soldiers: undefined
                  }
                : b
            )
          }
        : t
    );

    return {
      ...state,
      territories: updatedTerritories
    };
  };

  const makeInvestment = (state: EnhancedMafiaGameState, action: any) => {
    const amount = action.amount || 20000;
    const expectedReturn = action.expectedReturn || 1.15; // 15% return
    const duration = action.duration || 5;
    
    if (state.resources.money >= amount) {
      state.resources.money -= amount;
      state.economy.investments.push({
        id: `investment-${Date.now()}`,
        type: action.investmentType || 'stocks',
        amount: amount,
        expectedReturn: expectedReturn,
        duration: duration,
        currentValue: amount,
        risk: 10,
      });
    }
  };

  const bribeOfficial = (state: EnhancedMafiaGameState, action: any) => {
    const amount = action.amount || 15000;
    const officialType = action.officialType || 'police';
    
    if (state.resources.money >= amount) {
      state.resources.money -= amount;
      state.policeHeat.bribedOfficials.push({
        id: `official-${Date.now()}`,
        rank: 'officer' as const,
        name: `Officer ${Math.floor(Math.random() * 1000)}`,
        monthlyBribe: amount,
        heatReduction: 10,
        permissions: ['reduced_heat'],
        territory: 'Manhattan',
      });
      
      // Immediate effect
      state.policeHeat.level = Math.max(0, state.policeHeat.level - 20);
      state.policeHeat.reductionPerTurn += 1;
    }
  };

  const buildBusiness = (state: EnhancedMafiaGameState, action: any) => {
    const cost = action.cost || 25000;
    const income = action.income || 5000;
    
    if (state.resources.money >= cost) {
      state.resources.money -= cost;
      state.businesses.push({
        id: `business-${Date.now()}`,
        name: `Business ${Math.floor(Math.random() * 1000)}`,
        type: action.legal !== false ? 'legal' : 'illegal',
        category: action.businessType || 'restaurant',
        level: 1,
        monthlyIncome: income,
        monthlyExpenses: income * 0.3,
        launderingCapacity: action.legal !== false ? 0 : income * 0.5,
        extortionRate: 0,
        isExtorted: false,
        district: action.location || 'Little Italy',
        heatLevel: 0,
      });
      
      // Update finances
      state.finances.totalIncome += income;
      if (action.legal !== false) {
        state.finances.legalProfit += income;
      } else {
        state.finances.illegalProfit += income;
      }
    }
  };

  const upgradeBusiness = (state: EnhancedMafiaGameState, action: any) => {
    const business = state.businesses.find(b => b.id === action.businessId);
    const upgradeCost = action.cost || 15000;
    
    if (business && state.resources.money >= upgradeCost) {
      state.resources.money -= upgradeCost;
      business.level += 1;
      business.monthlyIncome = Math.round(business.monthlyIncome * 1.5);
      
      // Update finances
      state.finances.totalIncome += business.monthlyIncome * 0.5;
    }
  };

  const extortBusiness = (state: EnhancedMafiaGameState, action: any) => {
    const extortionAmount = action.amount || 5000;
    const risk = 40;
    
    if (Math.random() < (risk / 100)) {
      // Successful extortion
      state.resources.money += extortionAmount;
      state.finances.illegalProfit += extortionAmount;
      state.reputation.fear += 5;
      state.policeHeat.level += 10;
    } else {
      // Failed extortion
      state.policeHeat.level += 20;
      state.reputation.reputation -= 5;
    }
  };

  const launderMoney = (state: EnhancedMafiaGameState, action: any) => {
    const dirtyAmount = action.amount || 10000;
    const launderingCost = Math.round(dirtyAmount * 0.2); // 20% fee
    
    if (state.finances.dirtyMoney >= dirtyAmount && state.resources.money >= launderingCost) {
      state.finances.dirtyMoney -= dirtyAmount;
      state.finances.cleanMoney += dirtyAmount - launderingCost;
      state.resources.money -= launderingCost;
      state.policeHeat.level += 5;
    }
  };

  const performViolentAction = (state: EnhancedMafiaGameState, action: any) => {
    const cost = action.cost || 8000;
    const risk = action.risk || 70;
    
    if (state.resources.money >= cost && state.resources.soldiers >= 1) {
      state.resources.money -= cost;
      state.resources.soldiers -= 1;
      
      if (Math.random() < (risk / 100)) {
        // Successful violent action
        state.reputation.fear += 15;
        state.reputation.reputation += 5;
        state.policeHeat.level += 25;
        
        // Add to violent actions history
        state.violentActions.push({
          id: `violent-${Date.now()}`,
          type: action.violenceType || 'intimidation',
          target: action.target || 'unknown',
          targetType: 'civilian',
          turn: state.turn,
          success: true,
          consequences: {
            respectChange: 5,
            reputationChange: 5,
            loyaltyChange: 0,
            fearChange: 15,
            streetInfluenceChange: 0,
            policeHeatIncrease: 25,
          },
        });
      } else {
        // Failed violent action
        state.policeHeat.level += 35;
        state.reputation.reputation -= 10;
      }
    }
  };

  const makeCharitableDonation = (state: EnhancedMafiaGameState, action: any) => {
    const amount = action.amount || 5000;
    
    if (state.resources.money >= amount) {
      state.resources.money -= amount;
      state.reputation.reputation += 10;
      state.reputation.publicPerception.philanthropist += 5;
      state.reputation.publicPerception.criminal = Math.max(0, state.reputation.publicPerception.criminal - 3);
      state.policeHeat.level = Math.max(0, state.policeHeat.level - 5);
    }
  };

  const makePublicAppearance = (state: EnhancedMafiaGameState, action: any) => {
    const cost = action.cost || 3000;
    
    if (state.resources.money >= cost) {
      state.resources.money -= cost;
      state.reputation.reputation += 5;
      state.reputation.publicPerception.businessman += 8;
      state.reputation.publicPerception.criminal = Math.max(0, state.reputation.publicPerception.criminal - 2);
    }
  };

  // Check for victory condition
  const isWinner = gameState.familyControl ? gameState.familyControl[gameState.playerFamily] >= 80 : false;

  return {
    gameState,
    endTurn,
    selectTerritory,
    performAction,
    performBusinessAction,
    performReputationAction,
    handleEventChoice,
    isWinner,
  };
};
