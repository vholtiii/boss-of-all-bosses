# 🎮 Game Mechanics & Design Guide

## 📋 Table of Contents
- [Core Gameplay Loop](#core-gameplay-loop)
- [Headquarters System](#headquarters-system)
- [Territory Control System](#territory-control-system)
- [Personnel Management](#personnel-management)
- [Movement & Deployment](#movement--deployment)
- [Economy & Business](#economy--business)
- [Combat & Conflict](#combat--conflict)
- [Reputation & Heat](#reputation--heat)
- [Events & Missions](#events--missions)
- [Technology & Research](#technology--research)
- [AI Opponents](#ai-opponents)
- [Strategic Considerations](#strategic-considerations)

---

## 🔄 Core Gameplay Loop

The game follows a **turn-based strategy** model where each turn represents one month of criminal operations:

```
1. Plan Actions → 2. Execute Actions → 3. Process Results → 4. Advance Turn
```

### Turn Structure
- **Action Phase**: Deploy soldiers, hit territories, manage businesses
- **Processing Phase**: AI opponents act, events occur, income calculated
- **Resolution Phase**: Consequences applied, reputation updated
- **Advancement**: Turn counter increases, new opportunities arise

---

## 🏛️ Headquarters System

### Headquarters Locations
Each of the five families has a headquarters located on opposite quadrants of the map:

- **Gambino Family**: Little Italy (Northwest quadrant)
- **Genovese Family**: Brooklyn Heights (Southeast quadrant)  
- **Lucchese Family**: Queens (Southwest quadrant)
- **Bonanno Family**: Staten Island (Northeast quadrant)
- **Colombo Family**: Manhattan (Center)

### Initial Unit Setup
**Each family starts with:**
- **3 Soldiers**: Can move to adjacent hexagons only
- **1 Capo**: Can fly up to 5 hexagons away
- **1 Boss**: Stays at headquarters permanently

### Headquarters Information Panel
**Click on any headquarters to view:**
- **Financial Overview**: Legal profits, illegal profits, total profits
- **Unit Status**: Soldiers and capos at HQ vs deployed
- **Business Count**: Number of controlled businesses
- **Deploy Actions**: Deploy units during movement phase (player only)

### Headquarters Features
- **Visual Distinction**: Gold highlighting for player HQ, brown for others
- **Special Icon**: 🏛️ building icon to distinguish from regular businesses
- **Unit Management**: All units start at headquarters before deployment
- **Strategic Value**: Headquarters cannot be captured or destroyed

---

## 🗺️ Territory Control System

### Territory Types
- **🟢 Player Controlled**: Your family's territory (green)
- **🔴 Rival Controlled**: Other families' territory (red)
- **⚪ Neutral**: Unclaimed territory (gray)

### 3-Step Takeover Process

#### Step 1: Deploy Soldiers
- **Cost**: Uses your available soldier count
- **Target**: Any territory (neutral, rival, or your own)
- **Purpose**: Establish presence for future actions
- **Visual**: Small masked soldier icons appear on map

#### Step 2: Take Action
**Hit Rival Territories:**
- **Success Rate**: 80% if outnumbering, 20% if outnumbered
- **Casualties**: 20% on victory, 40% on defeat
- **Rewards**: Territory control + $5,000 + 10 respect

**Extort Neutral Territories:**
- **Success Rate**: 90% (much easier)
- **Casualties**: 10% on success, 20% on failure
- **Rewards**: Territory control + $3,000 + 5 respect

#### Step 3: Optimize Income
**Deploy Capo:**
- **Income**: 100% of territory's earning potential
- **Requirement**: Must be your controlled territory
- **Trade-off**: Replaces soldiers (can't use for other actions)

**Keep Soldiers:**
- **Income**: 30% of territory's earning potential
- **Benefit**: Soldiers remain available for other actions

### Strategic Territory Considerations
- **Neutral territories** are safer but less profitable
- **Rival territories** are riskier but more valuable
- **Capos maximize income** but limit flexibility
- **Soldiers provide income** while maintaining options

---

## 👥 Personnel Management

### Initial Unit Setup
**Each family starts with:**
- **3 Soldiers**: Start at headquarters, can be deployed
- **1 Capo**: Start at headquarters, can be deployed  
- **1 Boss**: Permanently stationed at headquarters

### Soldier System
**Deployment:**
- Start at headquarters, must be deployed first
- Deploy to adjacent hexagons only (1 hexagon away)
- Visual representation on map with movement highlighting
- Can be used for multiple actions after deployment

**Movement Rules:**
- **Range**: Adjacent hexagons only
- **Moves Per Turn**: 2 movements
- **Restrictions**: Cannot fly or jump over hexagons

**Combat Effectiveness:**
- Numbers matter (outnumbering = higher success)
- Training levels affect performance
- Equipment upgrades available

**Casualties:**
- Realistic loss rates based on combat odds
- Can be replaced through recruitment
- Lost soldiers reduce your available force

### Capo System
**Deployment:**
- Start at headquarters, must be deployed first
- Can fly up to 5 hexagons away from deployment point
- Only to your controlled territories after deployment
- Replaces soldiers in that territory

**Movement Rules:**
- **Range**: Up to 5 hexagons away (flying)
- **Moves Per Turn**: 3 movements
- **Advantage**: Can fly over other hexagons

**Capo Benefits:**
- **Name**: Each capo has a unique name
- **Level**: 1-5, affects effectiveness
- **Family**: Always loyal to your family
- **Income**: Full territory earning potential

**Strategic Trade-offs:**
- **Maximum Income**: Capos provide 100% vs soldiers' 30%
- **Flexibility Loss**: Can't use capos for other actions
- **Investment**: Capos are permanent until replaced

### Recruitment System
**Soldier Recruitment:**
- Cost: Money and time
- Source: Various recruitment methods
- Training: Can be improved through research

**Capo Recruitment:**
- Special characters with unique names
- Higher cost than soldiers
- Permanent deployment

---

## 🎯 Movement & Deployment

### Movement Phase
**Starting Movement:**
- Click "Movement" button to enter movement phase
- Select units from headquarters or deployed units
- Move units according to movement rules
- End movement phase when done

### Unit Movement Rules
**Soldiers:**
- **Movement Range**: Adjacent hexagons only (1 hexagon away)
- **Moves Per Turn**: 2 movements
- **Restrictions**: Cannot fly or jump over hexagons
- **Visual**: Light green highlighting for available moves

**Capos:**
- **Movement Range**: Up to 5 hexagons away (flying)
- **Moves Per Turn**: 3 movements  
- **Advantage**: Can fly over other hexagons
- **Visual**: Light green highlighting for available moves

### Deployment System
**From Headquarters:**
1. **Click Headquarters**: Select your family's headquarters
2. **Choose Unit Type**: Click "Deploy Soldier" or "Deploy Capo"
3. **Select Location**: Click on available hexagons (sky blue highlighting)
4. **Unit Deployed**: Unit is now on the field and ready for movement

**Visual Indicators:**
- **Gold**: Selected unit or headquarters
- **Sky Blue**: Available deployment targets
- **Light Green**: Available movement targets
- **"DEPLOY" Label**: Shows on available deployment hexagons
- **"MOVE" Label**: Shows on available movement hexagons

### Movement Status Display
**Bottom Bar Shows:**
- **Deployment Mode**: "Deploying [unit type] - Click available hexagons"
- **Movement Mode**: "Moving [unit type] ([moves] moves left)"
- **Clear Distinction**: Different messages for deployment vs movement

---

## 💰 Economy & Business

### Income Sources
1. **Territory Control**: Monthly income from controlled areas
2. **Legal Businesses**: Restaurants, laundromats, construction
3. **Illegal Operations**: Drug trafficking, gambling, loan sharking
4. **Investments**: Stocks, real estate, political contributions

### Business Management
**Legal Businesses:**
- **Lower Risk**: Less police attention
- **Steady Income**: Predictable monthly returns
- **Laundering**: Can clean dirty money
- **Upgrades**: Can be improved for more income

**Illegal Businesses:**
- **Higher Risk**: More police heat
- **Higher Income**: Greater profit potential
- **Heat Generation**: Increases law enforcement attention
- **Specialization**: Different types of illegal operations

### Money Laundering
**Purpose**: Convert dirty money to clean funds
**Process**: Use legal businesses to clean illegal profits
**Capacity**: Each business has laundering limits
**Cost**: Laundering reduces total money but makes it usable

### Investment System
**Types:**
- **Real Estate**: Property investments
- **Stocks**: Market investments
- **Business**: Direct business ownership
- **Political**: Bribes and political contributions

**Risk vs Reward:**
- Higher risk = higher potential returns
- Diversification reduces overall risk
- Market conditions affect performance

---

## ⚔️ Combat & Conflict

### Combat Resolution
**Territory Battles:**
- **Attacker Advantage**: Numbers and training matter
- **Defender Advantage**: Home territory bonus
- **Random Elements**: Luck plays a role
- **Casualties**: Realistic loss rates

**Combat Modifiers:**
- **Terrain**: Urban vs rural areas
- **Weather**: Seasonal effects
- **Surprise**: Stealth and intelligence
- **Equipment**: Weapon and armor quality

### Conflict Types
**Territory Disputes:**
- Direct territorial control
- Resource competition
- Strategic positioning

**Business Sabotage:**
- Disrupt rival operations
- Steal resources
- Intelligence gathering

**Personal Vendettas:**
- Revenge for past actions
- Reputation building
- Fear generation

---

## 🎭 Reputation & Heat

### Reputation System
**Multi-layered Reputation:**
- **Respect**: Based on successful operations
- **Fear**: How much others fear you
- **Loyalty**: Your soldiers' and capos' loyalty
- **Street Influence**: Influence on the streets
- **Public Perception**: How the public sees you

**Reputation Effects:**
- **Recruitment**: Higher reputation = better recruits
- **Negotiations**: Better deals with other families
- **Intimidation**: Easier to extort and control
- **Protection**: Less likely to be targeted

### Police Heat System
**Heat Generation:**
- **Violent Actions**: Increase heat significantly
- **Illegal Businesses**: Steady heat increase
- **Public Exposure**: Media attention increases heat
- **Rival Betrayals**: Snitches increase heat

**Heat Reduction:**
- **Bribes**: Pay off officials
- **Lay Low**: Reduce illegal activities
- **Charitable Acts**: Improve public image
- **Time**: Heat naturally decreases over time

**Heat Consequences:**
- **Arrests**: Higher heat = more arrest risk
- **Raids**: Police may raid your operations
- **Investigation**: Increased scrutiny
- **Prosecution**: Legal consequences

---

## 🎲 Events & Missions

### Random Events
**Police Raids:**
- **Trigger**: High heat levels
- **Choices**: Fight, bribe, or hide
- **Consequences**: Different outcomes based on choice

**Rival Meetings:**
- **Opportunity**: Negotiate or threaten
- **Relationships**: Affect family relationships
- **Strategic**: Can lead to alliances or conflicts

**Economic Events:**
- **Market Booms**: Increased income
- **Recessions**: Reduced income
- **Regulations**: New restrictions
- **Opportunities**: New business prospects

### Mission System
**Story Missions:**
- **Narrative**: Follow the main story
- **Progression**: Unlock new content
- **Rewards**: Unique benefits

**Side Missions:**
- **Optional**: Additional objectives
- **Variety**: Different types of challenges
- **Rewards**: Money, reputation, or resources

**Daily/Weekly Missions:**
- **Recurring**: Regular objectives
- **Variety**: Different each time
- **Rewards**: Consistent benefits

### Seasonal Events
**Spring**: Cleaning up loose ends, strengthening alliances
**Summer**: Hot weather increases tensions
**Fall**: Harvest season, debt collection
**Winter**: Indoor operations, reduced police activity

---

## 🔬 Technology & Research

### Research System
**Categories:**
- **Combat**: Improve soldier effectiveness
- **Business**: Enhance income generation
- **Intelligence**: Better information gathering
- **Legal**: Reduce heat and legal problems
- **Social**: Improve reputation and relationships

**Research Process:**
- **Cost**: Money and time investment
- **Prerequisites**: Some techs require others
- **Progress**: Gradual advancement
- **Benefits**: Permanent improvements

### Technology Effects
**Combat Technologies:**
- **Weapon Upgrades**: Better equipment
- **Training Methods**: Improved soldier skills
- **Tactics**: Better combat strategies

**Business Technologies:**
- **Efficiency**: More income per business
- **Laundering**: Better money cleaning
- **Expansion**: New business types

**Intelligence Technologies:**
- **Information**: Better intel on rivals
- **Counter-intelligence**: Protect your operations
- **Networking**: Better connections

---

## 🤖 AI Opponents

### Rival Families
**The Five Families:**
- **Gambino**: Your family (player controlled)
- **Genovese**: Aggressive expansionists
- **Lucchese**: Defensive strategists
- **Bonanno**: Opportunistic traders
- **Colombo**: Unpredictable wildcards

### AI Personalities
**Aggressive**: Quick to attack, high risk tolerance
**Defensive**: Focus on protection, low risk tolerance
**Opportunistic**: Wait for chances, moderate risk
**Diplomatic**: Prefer negotiation, relationship building
**Unpredictable**: Random behavior, hard to predict

### AI Strategies
**Territory Focus**: Prioritize territorial expansion
**Money Focus**: Focus on income generation
**Reputation Focus**: Build respect and fear
**Elimination Focus**: Target specific rivals

### AI Decision Making
**Context Analysis**: Consider current game state
**Resource Management**: Balance money, soldiers, influence
**Relationship Tracking**: Remember past interactions
**Strategic Planning**: Long-term goal setting

---

## 🎯 Strategic Considerations

### Early Game Strategy
1. **Build Income**: Focus on legal businesses first
2. **Recruit Soldiers**: Build your army
3. **Take Neutral Territories**: Lower risk expansion
4. **Manage Heat**: Keep police attention low

### Mid Game Strategy
1. **Territory Control**: Expand your influence
2. **Capo Deployment**: Maximize income from territories
3. **Rival Relations**: Manage family relationships
4. **Technology Research**: Unlock new abilities

### Late Game Strategy
1. **Eliminate Rivals**: Target specific families
2. **Maximize Income**: Optimize all revenue streams
3. **Control Heat**: Manage police attention
4. **Build Empire**: Establish dominance

### Risk Management
**Diversification**: Don't put all resources in one area
**Heat Control**: Balance illegal activities with legal ones
**Relationship Management**: Maintain good relations with some families
**Resource Reserves**: Keep emergency funds and soldiers

### Long-term Planning
**Technology Tree**: Plan research priorities
**Territory Expansion**: Strategic location selection
**Business Portfolio**: Balance legal and illegal operations
**Reputation Building**: Long-term reputation management

---

## 🎮 Advanced Tips

### Territory Control
- **Neutral territories** are easier to take but less profitable
- **Rival territories** are riskier but more valuable
- **Capos maximize income** but reduce flexibility
- **Soldiers provide income** while maintaining options

### Combat Strategy
- **Outnumber defenders** for higher success rates
- **Use terrain advantages** when possible
- **Consider casualties** before attacking
- **Plan for failure** and have backup strategies

### Economic Management
- **Diversify income sources** to reduce risk
- **Launder money regularly** to avoid heat
- **Invest in technology** for long-term benefits
- **Balance legal and illegal** operations

### Reputation Management
- **Build respect** through successful operations
- **Generate fear** through violent actions
- **Maintain loyalty** among your personnel
- **Control public perception** through charitable acts

---

This comprehensive guide covers all the major systems and mechanics in the game. Use it as a reference to understand the depth and complexity of the strategic decisions you'll need to make as you build your criminal empire! 🎯
