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
        case 'attack_territory':
          processTerritoryAttack(newState, action);
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
    
    // Generate new economic events
    if (Math.random() < 0.3) {
      generateEconomicEvent(state);
    }
  };

  const processAIOpponents = (state: EnhancedMafiaGameState) => {
    state.aiOpponents.forEach(opponent => {
      // Generate AI action based on personality and strategy
      const action = generateAIAction(opponent, state);
      if (action) {
        executeAIAction(state, opponent, action);
      }
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

  // Placeholder functions for complex logic
  const generateEconomicEvent = (state: EnhancedMafiaGameState) => {
    // Implementation for generating economic events
  };

  const generateAIAction = (opponent: AIOpponent, state: EnhancedMafiaGameState) => {
    // Implementation for AI decision making
    return null;
  };

  const executeAIAction = (state: EnhancedMafiaGameState, opponent: AIOpponent, action: any) => {
    // Implementation for executing AI actions
  };

  const generateWeatherCondition = () => {
    const conditions = ['clear', 'rain', 'snow', 'fog', 'storm'];
    return {
      type: conditions[Math.floor(Math.random() * conditions.length)] as any,
      intensity: Math.floor(Math.random() * 100),
      duration: Math.floor(Math.random() * 5) + 1,
      description: 'Weather condition',
    };
  };

  const applyWeatherEffects = (state: EnhancedMafiaGameState) => {
    // Implementation for weather effects
  };

  const generateSeasonalEvent = (state: EnhancedMafiaGameState) => {
    // Implementation for seasonal events
  };

  const updateMissionProgress = (state: EnhancedMafiaGameState, mission: Mission) => {
    // Implementation for mission progress updates
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
    // Implementation for random events
  };

  const applyConsequence = (state: EnhancedMafiaGameState, consequence: any) => {
    // Implementation for applying event consequences
  };

  // Placeholder functions for action processing
  const processTerritoryAttack = (state: EnhancedMafiaGameState, action: any) => {
    // Implementation for territory attacks
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

  const makeInvestment = (state: EnhancedMafiaGameState, action: any) => {
    // Implementation for investments
  };

  const bribeOfficial = (state: EnhancedMafiaGameState, action: any) => {
    // Implementation for bribing officials
  };

  const buildBusiness = (state: EnhancedMafiaGameState, action: any) => {
    // Implementation for building businesses
  };

  const upgradeBusiness = (state: EnhancedMafiaGameState, action: any) => {
    // Implementation for upgrading businesses
  };

  const extortBusiness = (state: EnhancedMafiaGameState, action: any) => {
    // Implementation for extortion
  };

  const launderMoney = (state: EnhancedMafiaGameState, action: any) => {
    // Implementation for money laundering
  };

  const performViolentAction = (state: EnhancedMafiaGameState, action: any) => {
    // Implementation for violent actions
  };

  const makeCharitableDonation = (state: EnhancedMafiaGameState, action: any) => {
    // Implementation for charitable donations
  };

  const makePublicAppearance = (state: EnhancedMafiaGameState, action: any) => {
    // Implementation for public appearances
  };

  // Check for victory condition
  const isWinner = gameState.familyControl[gameState.playerFamily] >= 80;

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
