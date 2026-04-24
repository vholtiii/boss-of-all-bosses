# 🎮 Game Mechanics & Design Guide

## 📋 Table of Contents

- [1. Core Gameplay Loop](#1-core-gameplay-loop)
- [2. Map & Territory](#2-map--territory)
- [3. The Five Families](#3-the-five-families)
- [4. Units & Personnel](#4-units--personnel)
- [5. Movement System](#5-movement-system)
- [6. Turn Phases In Detail](#6-turn-phases-in-detail)
- [7. Tactical Actions](#7-tactical-actions)
- [8. Combat Actions](#8-combat-actions)
- [9. Negotiation & Diplomacy](#9-negotiation--diplomacy)
- [10. Economy & Businesses](#10-economy--businesses)
- [11. Reputation System](#11-reputation-system)
- [12. Police Heat & Corruption](#12-police-heat--corruption)
- [13. Recruitment & Promotion](#13-recruitment--promotion)
- [14. HQ Assault & Elimination](#14-hq-assault--elimination)
- [15. Boss Actions](#15-boss-actions)
- [16. Gameplay Phases](#16-gameplay-phases)
- [17. Victory Conditions](#17-victory-conditions)
- [18. Commission Vote](#18-commission-vote)
- [19. Bankruptcy](#19-bankruptcy)
- [20. Difficulty & Map Size](#20-difficulty--map-size)
- [21. AI Opponents](#21-ai-opponents)
- [22. Intel & Threat Detection](#22-intel--threat-detection)
- [23. Strategic Tips](#23-strategic-tips)
- [24. Tension & War System](#24-tension--war-system)
- [25. District Control Bonuses](#25-district-control-bonuses)
- [26. Prosecution Risk System](#26-prosecution-risk-system)
- [27. Counter-Intelligence & Purge Ranks](#27-counter-intelligence--purge-ranks)

---

## 1. Core Gameplay Loop

### 1.1 Turn Structure

Each turn represents one month. Strict phase order:

```
Deploy → Tactical (Move) → Action → End Turn
```

**Skip to Action**: Players can jump directly from Deploy or Tactical phase to the Action phase using the "Skip to Action" button.

### 1.2 Action Budget

- **Base actions per turn**: 2
- **Bonus action**: +1 if Respect ≥ 50 AND Influence ≥ 50
- **Tactical actions per turn**: 3 (separate budget)

---

## 2. Map & Territory

### 2.1 Hex Grid

Map size is chosen at game start:

| Size | Radius | ~Hex Count | Feel |
|------|--------|-----------|------|
| Small | 7 | ~169 | Fast, aggressive |
| Medium | 10 | ~331 | Classic (default) |
| Large | 13 | ~547 | Epic, sprawling |

Cube coordinates (q, r, s). All game values (AI recruitment, victory targets, economy) scale with map size.

### 2.2 Districts

| District | Characteristics |
|---|---|
| Little Italy | Gambino heartland |
| Brooklyn | Industrial, docks |
| Queens | Residential |
| Manhattan | Commercial center, extortion 20% harder |
| Bronx | Urban warfare |
| Staten Island | Isolated |

District boundaries scale proportionally with map radius (threshold ≈ 40% of radius).

### 2.3 Territory Control States

- **Neutral** (gray) — Unclaimed
- **Player-controlled** (green) — Your family
- **Rival-controlled** (red/orange/etc.) — Enemy family

---

## 3. The Five Families

### 3.1 Family Bonuses

| Family | Specialty | Key Bonuses |
|---|---|---|
| **Gambino** | Combat | +25% combat, +15% intimidation, +10% territory income |
| **Genovese** | Business | +30% business income, +20% laundering, +25% business upgrade |
| **Lucchese** | Intelligence | +25% hit success, +15% heat reduction, +20% intel |
| **Bonanno** | Intimidation | +25% intimidation, +20% extortion, +15% fear generation |
| **Colombo** | Growth | +20% income, +15% recruitment discount, +10% reputation gain |

### 3.2 Headquarters Locations

HQ positions vary by map size:

**Medium (radius 10, default):**

| Family | District | Coordinates (q,r,s) |
|---|---|---|
| Gambino | Little Italy | (-8, 8, 0) |
| Genovese | Manhattan | (8, -8, 0) |
| Lucchese | Queens | (-8, -1, 9) |
| Bonanno | Staten Island | (7, 3, -10) |
| Colombo | Bronx | (0, -9, 9) |

**Small (radius 7):** gambino(-5,5,0), genovese(5,-5,0), lucchese(-5,-1,6), bonanno(5,2,-7), colombo(0,-6,6)

**Large (radius 13):** gambino(-11,11,0), genovese(11,-11,0), lucchese(-11,-1,12), bonanno(10,3,-13), colombo(0,-12,12)

### 3.3 Starting Setup

| Family | Soldiers | Starting Money | Notes |
|---|---|---|---|
| Gambino | 4 | $50,000 | Most soldiers |
| Genovese | 4 | $50,000 | Business advantage |
| Lucchese | 3 | $50,000 | Intel advantage |
| Bonanno | 2 | $50,000 | Intimidation advantage |
| Colombo | 1 | $50,000 | Fewest soldiers, growth bonuses |

All families also start with 1 Capo and 1 Boss. Each HQ + 6 adjacent hexes are pre-claimed.

---

## 4. Units & Personnel

### 4.1 Soldiers

| Property | Value |
|---|---|
| Movement range | 1 hex (adjacent), or unlimited within connected territory (free) |
| Moves per turn | 2 |
| Mercenary cost | $1,500 |
| Local recruit cost | $600 (requires 10+ controlled hexes) |
| Maintenance | **$600/turn (deployed only)** — undeployed soldiers in the recruitment pool are free |

### 4.2 Capos

| Property | Value |
|---|---|
| Movement range | Up to 5 hexes (flying) |
| Moves per turn | 3 |
| Promotion cost | $10,000 |
| Max capos | 3 |
| Income bonus | 100% territory income (vs soldiers' 30%) |
| Abilities | Negotiate, Safehouse, Escort |
| Scout range | 2 hexes (vs soldiers' 1 hex) |
| Auto-claim | Claims neutral territory automatically on arrival |
| Combat immunity | Cannot die in regular combat — wounded instead |

**Wound Mechanic**: If a capo would be killed in combat, they are instead wounded: -10 loyalty, -1 move penalty for 1 turn. Capos can only be permanently killed via hitman contract or planned hit.

**Capo Personalities:**
- **Diplomat** 🕊️ — +20% Ceasefire, +10% Alliance
- **Enforcer** 💪 — +15% Bribe for Territory
- **Schemer** 🧠 — +15% Alliance, +10% all negotiations

### 4.3 Boss

- Permanently stationed at HQ
- Can Call a Sitdown (boss action)

### 4.4 Hitman Contracts

External contract killers. **$30,000** per contract, max 3 active. Duration 3-5 turns based on target location. Success rate 40-90%. No heat, no stat gains. Hitman kills raise **global tension** across all family pairs (+5 for soldier kills, +15 for capo kills). Assassinations are anonymous — no pair tension is generated.

### 4.5 Soldier Stats

| Stat | Range | Growth |
|---|---|---|
| Loyalty | 0–80 (soldiers), 0–99 (capos) | +2 per action, +5 per survived combat, -2/turn if unpaid |
| Training | 0–3 | +1 per turn deployed away from HQ |
| Victories | 0–5 | +1 per successful hit or extortion |
| Toughness | 0–5 | +1 per survived combat |
| Racketeering | 0–5 | +1 per successful extortion |

---

## 5. Movement System

### 5.1 Free Movement in Connected Territory

Soldiers can move **unlimited hexes for free** (0 move cost) within territory that forms an unbroken path of player-owned hexes back to HQ (determined by BFS flood-fill).

### 5.2 Standard Movement

When leaving connected territory, crossing gaps, or moving into unclaimed/enemy hexes: standard 1-hex-per-move cost applies.

### 5.3 Capo Movement

Unchanged — capos fly up to 5 hexes regardless of territory ownership.

### 5.4 Zone of Control

Enemy-adjacent hexes stop movement (zone of control). Free movement within connected territory bypasses ZoC.

---

## 6. Turn Phases In Detail

### 6.1 Deploy Phase
- Deploy soldiers/capos from HQ or active safehouse
- Soldiers: adjacent hexes only. Capos: up to 5 hexes.
- Can skip directly to Action phase

### 6.2 Tactical (Move) Phase
- 3 tactical actions: Move, Scout, Fortify, Safehouse, Escort
- Can skip directly to Action phase

### 6.3 Action Phase
- 2-3 action points: Hit, Extort, Claim, Negotiate, Boss Actions

### 6.4 End Turn
- AI acts, income calculated, events fire, victory checked

---

## 7. Tactical Actions

### 7.1 Scout
+15% hit bonus for 3 turns. Reveals enemy count, family, business details. 15% detection chance on enemy hexes. **Capos scout at 2-hex range vs soldiers' 1-hex range.**

### 7.2 Fortify
+25% defense, 50% casualty reduction. Persists until unit moves. **Max 4 fortifications per family on the map.** Hover tooltip shows: age ("Built X turns ago"), occupancy status ("Occupied" or "Abandoned — crumbles in Y turns"), and combat bonuses. Abandoned fortifications (no unit present) crumble after 3 turns.

### 7.3 Safehouse
Capo creates secondary deploy point. $2,500, lasts 5 turns. Max 2 (second requires 15+ hexes). +10% defense on hex.

### 7.4 Escort
Capo transports up to 2 soldiers. Can call soldiers from any distance.

---

## 8. Combat Actions

### 8.1 Hit (Attack Enemy Territory)

```
chance = 50% + (attackers - defenders) × 15%
       + family combat/hit bonuses
       + scout bonus (+15%)
       + fortified attacker (+12.5%)
       - fortified defender (-25%)
       - blind hit penalty (-20% if unscouted)
Clamped: 10%–95%
```

**Victory**: Territory → neutral, enemy units removed, +5 respect/fear, 20% attacker casualties.
**Defeat**: 40% attacker casualties (min 1).
**Heat**: min(25, 8 + totalUnits × 2).

**Capo combat immunity**: Capos cannot die in regular combat. They are wounded instead (-10 loyalty, -1 move for 1 turn).

### 8.2 Extort

| | Neutral | Enemy |
|---|---|---|
| Base success | 90% | 50% |
| On success | Claims territory + money | Steals income only |
| Money | $3,000 × respect multiplier | Business income × respect multiplier |

Failure: -3 respect, -2 fear, +5 heat. **No casualties.**

### 8.3 Claim Territory

Neutral hexes only. Automatic success. +1 respect, +1 influence. No combat, no heat.

---

## 9. Negotiation & Diplomacy

Requires a capo. Success is rolled against base chance + personality bonus + influence bonus (max 95%).

| Type | Base Success | Cost | Effect |
|---|---|---|---|
| Ceasefire | 50% | $3,000 + 5 respect | Non-aggression 3-5 turns |
| Bribe for Territory | 40% | $8,000+ | Peacefully claim hex |
| Alliance | 30% | $5,000 | Conditional pact 5-8 turns |

---

## 10. Economy & Businesses

### 10.1 Business Types

| Type | Icon | Base Income | Heat |
|---|---|---|---|
| Brothel | 💋 | $3,000 | 4 |
| Gambling Den | 🎲 | $4,000 | 3 |
| Loan Sharking | 💰 | $5,000 | 5 |
| Store Front | 🏪 | $2,000 | 1 |

### 10.2 Income Rules
- Capo on hex: 100% income. Soldiers only: 30%. No units: 10% passive.
- Family bonuses modify income (e.g., Genovese +30%).

### 10.3 Maintenance & Financial Display
- **$600/turn per deployed soldier** (undeployed reserves are free)
- $150/turn per empty claimed hex (community upkeep)
- HQ panel shows **gross income** (pre-penalty), with arrest penalties and heat penalties listed as separate expense line items
- Math is transparent: **Gross Income − All Expenses = Net Profit**

---

## 11. Reputation System

| Metric | Effect |
|---|---|
| Respect (0-100) | Extortion payout multiplier (0.5x–1.5x), recruitment discount (up to 30%), +1 bonus action at ≥50 |
| Influence (0-100) | Extortion success +15%, bribe success +12%, +1 bonus action at ≥50. Grows passively: +1 per 3 hexes. |
| Fear (0-100) | Gained from hits (+5), blind hits (+15) |
| Reputation (0-100) | Overall standing |
| Loyalty (0-100) | Soldier cohesion |

---

## 12. Police Heat & Corruption

| Tier | Cost | Base Success | Duration | Effect |
|---|---|---|---|---|
| Patrol Officer | $500 | 80% | 3 turns | -30% heat, -2 heat/turn |
| Police Captain | $2,000 | 60% | 5 turns | Economic pressure on rivals |
| Police Chief | $8,000 | 40% | 7 turns | +50% intel on rival |
| Mayor | $25,000 | 25% | 10 turns | Shut down rival territory |

Active bribes can also reveal enemy planned hits — see [Intel & Threat Detection](#22-intel--threat-detection).

Higher-tier bribes (Captain+) can also reveal **informants** in your own ranks — see [Counter-Intelligence & Purge Ranks](#27-counter-intelligence--purge-ranks).

---

## 13. Recruitment & Promotion

### 13.1 Soldier Recruitment

| Type | Cost | Requirement |
|---|---|---|
| Mercenary | $1,500 | None |
| Local Recruit | $600 | 10+ controlled hexes |

### 13.2 Capo Promotion

| Requirement | Value |
|---|---|
| Cost | $10,000 |
| Min victories | 3 |
| Min loyalty | 60 |
| Min training | 2 |
| Min toughness | 3 |
| Min racketeering | 3 |
| Max capos | 3 |

---

## 14. HQ Assault & Elimination

### 14.1 Assault HQ
- **Who**: Soldiers only, must be adjacent to enemy HQ
- **Requirements**: Toughness ≥ 4, loyalty ≥ 70
- **Base success**: 15%, max 50%. HQ defense: -30%.
- **Flipped soldier bonus**: -10% defense per flipped enemy soldier at HQ
- **Success**: Family eliminated, +$25,000, +30 respect, +40 fear
- **Failure**: Attacking soldier killed, all participating units lose 30 loyalty. No heat.

### 14.2 Flip Soldier
- **Cost**: $5,000. Must have unit adjacent to enemy HQ.
- **Base success**: 25%. Target must have loyalty > 60.
- **Success**: Target marked as flipped, reduces HQ defense by 10%.
- **Failure**: -15 influence for scheming family, target gains +10 loyalty, enemy notified.

---

## 15. Boss Actions

### 15.1 Call a Sitdown
- Recall all or selected soldiers to HQ instantly from anywhere
- **Cost**: $2,000. **Cooldown**: 5 turns.
- Each soldier at HQ: +5% HQ assault defense
- Recalled soldiers: +5 loyalty
- Recalled soldiers lose fortification, cannot act again this turn

### 15.2 Declare War
- **Cost**: $10,000 + 1 action point
- Instantly sets tension to 80 with a chosen family, triggering a 10-turn war
- Cannot declare war on a family you have a ceasefire/alliance with
- Max 2 simultaneous wars

### 15.3 Go to the Mattresses (Defensive Stance)
- **Cost**: $5,000 + 1 action point. **Cooldown**: 8 turns. **Duration**: 3 turns.
- **Buffs**: +20% unit defense, +15% HQ assault defense, +5 loyalty to all soldiers
- **Penalties**: Units locked (cannot move or attack), -50% territory income
- Strategic use: hunker down when under heavy assault or expecting an HQ attack

### 15.4 War Summit (Offensive Rally)
- **Cost**: $5,000 + 1 action point. **Cooldown**: 5 turns. **Duration**: 2 turns.
- **Immediate**: +10 fear, +8 police heat, +3 loyalty to all soldiers
- **Ongoing**: +15% combat (hit) bonus for all deployed soldiers
- **Tradeoff**: Heat increase risks arrests at high heat levels — weigh combat edge vs police attention

### 15.5 Purge Ranks
- **Cost**: 1 action point. **Phase**: Action phase only.
- Eliminate soldiers flagged as "Suspicious" or "Confirmed Rat"
- Available from the left side panel (Strategic Actions) or HQ panel
- **Confirmed Rat**: +5 fear, +3 heat, +10 loyalty to soldiers under 50 loyalty
- **Innocent Soldier**: +3 fear, +2 heat, -5 loyalty to all soldiers, -3 respect
- See [Counter-Intelligence & Purge Ranks](#27-counter-intelligence--purge-ranks) for detection mechanics

---

## 16. Gameplay Phases

The game is divided into four phases that gate which mechanics are available. Phases create a natural arc from street-level scrapper to criminal empire. **Both player and AI families** follow the same phase gates. Once a phase is reached, it is **permanent** — losing hexes or respect does not drop you back.

### 16.1 Phase 1: Making Your Bones 🔫

| Requirement | Value |
|---|---|
| Minimum turn | 1 (start of game) |
| Milestones | None |

**Available**: Move, Claim neutral territory, Extort (neutral hexes only), Recruit soldiers (mercenaries only), Blind Hits (combat without scouting)

**Locked**: Scouting, Plan Hits, Capo Promotion, Safehouses, Fortification, Enemy Extortion, Patrol Officer Bribes, Boss Sitdown, Hitman Contracts, Go to the Mattresses, War Summit, Flip Soldier, HQ Assault, Boss Diplomacy, Alliances, Commission Vote

### 16.2 Phase 2: Establishing Territory 🏴

| Requirement | Value |
|---|---|
| Minimum turn | 9 |
| Controlled hexes | 8+ |
| Respect | 20+ |

**Unlocks**: Scouting, Plan Hits, Capo Promotion, Safehouses, Fortification, Enemy Extortion, Patrol Officer Bribe, Boss Sitdown, Local Recruitment

### 16.3 Phase 3: Controlling Territory 🏛️

| Requirement | Value |
|---|---|
| Minimum turn | 18 |
| Controlled hexes | 20+ |
| Capos | 2+ |
| Built businesses | 1+ |

**Unlocks**: Boss Diplomacy, Alliances, Ceasefires, Captain+ Bribes (Police Captain, Chief, Mayor), Hitman Contracts ($30K), Go to the Mattresses, War Summit, Flip Soldier

> **AI Note**: AI families do not build businesses — any business on AI-controlled territory (extorted or pre-existing) counts toward this requirement.

### 16.4 Phase 4: Boss of All Bosses 👑

| Requirement | Value |
|---|---|
| Minimum turn | 30 |
| **Any one of**: | 35+ hexes **OR** $40,000+ income **OR** 80+ respect |

**Unlocks**: Commission Vote (diplomatic victory path), HQ Assault (the ultimate power move)

### 16.5 Phase Notifications

- Players receive a notification when they enter a new phase, listing newly unlocked abilities
- Players are also notified when **AI families advance** to a new phase (e.g., "The Genovese family has entered Phase 3: Controlling Territory")
- Locked actions in the UI show a 🔒 icon with "Unlocks in Phase X" tooltip

---

## 17. Victory Conditions

| Path | Small Map | Medium Map | Large Map |
|---|---|---|---|
| Territory Domination | 40 hexes | 60 hexes | 80 hexes |
| Economic Empire | $50,000/month | $50,000/month | $50,000/month |
| Legacy of Power | Beat rival by 25% after turn 15 | Same | Same |
| Total Domination | Eliminate all 4 families | Same | Same |
| Commission Vote | Phase 4 required | Same | Same |

---

## 18. Commission Vote

A diplomatic victory path available in **Phase 4 only**. The player (or an AI family) calls a Commission Meeting to be recognized as Boss of All Bosses.

### 18.1 Requirements

| Requirement | Value |
|---|---|
| Phase | 4 (Boss of All Bosses) |
| Cost | $15,000 + 1 Action point |
| Minimum survivors | 2 rival families (cannot call with 0-1 rivals) |
| Cooldown | 10 turns between attempts |

### 18.2 Vote Threshold (Scales with Survivors)

The required votes scale with surviving rivals to prevent cheap wins:

| Surviving Rivals | Votes Needed | Effect |
|---|---|---|
| 4 rivals | 3 of 4 | Strong consensus required |
| 3 rivals | 2 of 3 | Broad support needed |
| 2 rivals | 2 of 2 | Unanimous — very difficult |
| 1 rival | Cannot call | Too few for legitimacy |

### 18.3 Voting Logic

**AI families vote YES if**:
- Relationship with caller ≥ 60, **AND**
- Active ceasefire or alliance pact with caller

**Automatic NO**:
- Families with an active Treachery debuff receive automatic NO from all voters

**Player's vote toward AI caller**: Based on player's relationship level with the calling AI family (same ≥ 60 threshold + pact requirement)

### 18.4 Outcomes

**Success**: Instant victory (or game over if AI wins)

**Failure**:
- -10 relationship with every family that voted NO
- 10-turn cooldown before another attempt
- Notification to all families

### 18.5 AI Commission Votes

AI families in Phase 4 can also call Commission Meetings:
- **Diplomatic** AI: 40% chance per eligible turn
- **Opportunistic** AI: 20% chance per eligible turn
- **All others**: 10% chance per eligible turn
- AI follows the same cost, cooldown, and survivor requirements
- AI win rate is low (~3-5%) by design — creates tension without being unfair

---

## 19. Bankruptcy

- If money < 0: 1 random soldier deserts per $10K in debt each turn
- If money < -$50,000: **Game over**
- Soldiers lose -2 loyalty/turn when family can't afford maintenance

---

## 20. Difficulty & Map Size

### 18.1 Difficulty Modes

| Mode | Player Money | AI Aggression | AI Income |
|---|---|---|---|
| Easy | 1.5x | 0.7x | Standard |
| Normal | 1.0x | 1.0x | Standard |
| Hard | 0.7x | 1.5x | +20% |

### 18.2 Map Size

Selected at game start alongside difficulty. Affects hex count, HQ positions, district boundaries, AI recruitment caps, and victory targets. See [Section 2.1](#21-hex-grid).

---

## 21. AI Opponents

### 21.1 Overview

AI families follow the **same four-phase gates** as the player and act according to five distinct personality traits. Each personality shapes recruitment, fortification, combat, diplomacy, and special actions.

- **Map-scaled AI**: Recruitment caps, action budgets, and income floors scale with map size
- **Phase progression**: AI tracks income, business count, and capo promotions for phase calculation. AI can force-promote soldiers to Capos (at double cost) if standard stat requirements aren't met by Phase 3
- **Early game boost**: +2 actions, +2 tactical for turns 1–8
- AI respects stacking limits, ceasefires, alliances, and pact territory freezes

### 21.2 Personality Traits

| Family | Trait | Description |
|---|---|---|
| **Gambino** | Diplomatic 🕊️ | Avoids initiating combat. Never uses Plan Hit or HQ Assault. Signals ceasefires (Phase 2+) and alliances (Phase 3+, relationship > 30). Recruits conservatively (-1 per batch). Fortifies border hexes (25% chance). |
| **Genovese** | Aggressive ⚔️ | High-frequency attacks and territorial expansion. Recruits aggressively (+1 per batch). 2× Plan Hit chance. 15% HQ Assault chance (Phase 4). Rarely fortifies (10% chance). |
| **Lucchese** | Opportunistic 🎯 | Prefers extortion over direct combat. Only initiates fights when strength exceeds enemy by +1. Moderate Plan Hit chance (isolated targets only). Signals ceasefire when losing territory (< 6 hexes). Fortifies high-value business hexes (20% chance). |
| **Bonanno** | Defensive 🛡️ | Never initiates Plan Hits or HQ Assaults. Proactively fortifies HQ-adjacent hexes (40% chance) even when not alerted. Only attacks enemy hexes when outnumbering by +2. Signals ceasefire at Phase 3+. Recruits conservatively (-1 per batch). |
| **Colombo** | Unpredictable 🎲 | Randomly assigns a temporary behavior mode each turn: Aggressive (30%), Defensive (20%), Diplomatic (20%), or Opportunistic (30%). 1.5× Plan Hit chance. 12% HQ Assault chance. Fortification chance 30%. Recruitment varies randomly (±1). |

### 21.3 Personality-Driven Behaviors

**Recruitment**: Aggressive families recruit +1 more per batch. Defensive and Diplomatic families recruit -1 (minimum 1). Unpredictable families randomly adjust ±1.

**Fortification** (Phase 2+, proactive — not just when alerted):

| Trait | Chance | Strategy |
|---|---|---|
| Defensive | 40% | HQ-adjacent hexes |
| Unpredictable | 30% | Random hexes |
| Diplomatic | 25% | Border hexes |
| Opportunistic | 20% | High-value business hexes |
| Aggressive | 10% | Rarely fortifies |

**Plan Hit** (Phase 2+):

| Trait | Chance Multiplier | Notes |
|---|---|---|
| Aggressive | 2.0× base | Initiates frequently |
| Unpredictable | 1.5× base | Moderate frequency |
| Opportunistic | 1.0× base | Only against isolated targets |
| Defensive | Never | Blocked by personality |
| Diplomatic | Never | Blocked by personality |

**HQ Assault** (Phase 4+):

| Trait | Chance | Notes |
|---|---|---|
| Aggressive | 15% | Most likely to attempt |
| Unpredictable | 12% | Moderate chance |
| Opportunistic | 8% | Only if 2+ flipped soldiers present |
| Defensive | Never | Blocked by personality |
| Diplomatic | Never | Blocked by personality |

**Diplomacy**:
- **Diplomatic**: Signals ceasefire at Phase 2+, alliance at Phase 3+ (if relationship > 30)
- **Defensive**: Signals ceasefire at Phase 3+ (cooperation-based chance)
- **Opportunistic**: Signals ceasefire at Phase 2+ when losing territory (< 6 hexes)
- **Aggressive**: Does not initiate diplomacy
- **Unpredictable**: Depends on randomly assigned mode each turn

### 21.4 Phase Gates for AI Actions

| Action | Required Phase | Old (Removed) |
|---|---|---|
| Enemy Extortion | Phase 2+ | Was ungated |
| Plan Hit | Phase 2+ | — |
| Flip Soldier | Phase 3+ | Was turn > 8 |
| HQ Assault | Phase 4+ | Was turn > 12 |

---

## 22. Intel & Threat Detection

### 20.1 Sources

Planned enemy hits can be detected through:
- **Scouted hexes**: If the target or source hex is scouted, the planned hit is revealed
- **Police bribes**: Active captain/chief/mayor bribes can reveal planned hits against you

### 20.2 Detection

- `detectedVia` field tracks the source: `'scout'`, `'bribe_captain'`, `'bribe_chief'`, or `'bribe_mayor'`
- Notifications fire when a threat is first discovered with flavor text matching the intel source
- Only detected planned hits are shown in the UI (undetected hits remain hidden)

### 20.3 Display

- **Side panel**: Detected threats show with source and turns remaining
- **HQ panel**: "Active Threats" section shows detected planned hits with urgency colors (red for 1 turn, yellow for 2+)

---

## 23. Strategic Tips

### Early Game (Turns 1–5)
1. Claim adjacent neutral territory for free respect/influence
2. Extort neutral hexes with businesses for income
3. Deploy capos to high-value hexes for 100% income
4. Use free movement to reposition within connected territory

### Mid Game (Turns 6–15)
1. Promote soldiers to capos (need victories ≥ 3, loyalty ≥ 60, toughness ≥ 3)
2. Scout before hitting (+15% success)
3. Negotiate ceasefires to protect flanks
4. Reach 50 respect + 50 influence for bonus action

### Late Game (Turns 15+)
1. Focus on closest victory condition
2. Use Sitdown to consolidate HQ defense against assault
3. Flip enemy soldiers to weaken rival HQ before assault
4. Use escort to rapidly reposition forces
5. **Watch for AI phase notifications** — if a rival enters Phase 4, they may attempt a Commission Vote
6. Build relationships with AI families (ceasefires, alliances) to secure YES votes for your own Commission bid

---

## 24. Tension & War System

### 22.1 Tension Meter

Each of the 10 family pairs has a tension value (0-100). Tension **decays by 2 per turn** naturally.

### 22.2 Tension Builders

| Action | Pair Tension | Global Tension | Notes |
|---|---|---|---|
| Territory hit | +10 | — | Between attacker & defender |
| Plan Hit on soldier | +15 | — | Between families |
| Plan Hit on capo (success) | — | — | **Instant war trigger** |
| Extortion (enemy hex) | +8 | — | Between families |
| Encroachment | +12 | — | Claiming neutral hex surrounded by 3+ rival hexes |
| Supply sabotage | +15 | — | Breaking a supply chain via territory capture |
| Breaking pact | +30 | — | Ceasefire or alliance violation |
| Hitman kills soldier | — | +5 all pairs | Anonymous — no pair tension |
| Hitman kills capo | — | +15 all pairs | Anonymous — no pair tension |

### 22.3 Tension Reducers

| Action | Reduction | Notes |
|---|---|---|
| Ceasefire | -25 | Negotiation action |
| Alliance | -35 | Negotiation action |
| Supply deal | -15 | New negotiation type |
| Share profits | -10 | New negotiation type |
| Safe passage | -8 | New negotiation type |
| Bribe for territory | -5 | Existing negotiation |

A **1-turn cooling period** after any successful negotiation prevents immediate tension re-escalation.

### 22.4 War Trigger

War begins when:
1. **Tension reaches 80** between two families, OR
2. A **successful Plan Hit on a Capo** (instant war, bypasses tension threshold)

### 22.5 War Effects (10 Turns)

| Effect | Details |
|---|---|
| Duration | 10 turns |
| Diplomatic lockout | No negotiations between warring families |
| AI forced aggression | AI prioritizes attacking war opponent, recruits every turn |
| Income penalty | -20% on hexes adjacent to warring enemy territory (capped -30% total) |
| Max simultaneous wars | 2 per family |

### 22.6 Post-War State

- Tension resets to **30** (not 0 — lingering animosity)
- Relationship drops by **-50**
- 1-turn negotiation cooling period before diplomacy can resume

### 22.7 AI & War

- AI-vs-AI wars are tracked and notified to the player
- AI prioritizes warring opponents for hits and territorial expansion during war
- AI fortifies HQ-adjacent hexes during active wars

## 25. District Control Bonuses

Control 60%+ of a district's hexes to unlock **primary** and **secondary** bonuses:

| District | Primary Bonus | Secondary Bonus |
|---|---|---|
| **Manhattan** | +25% business income | +1 max action point per turn |
| **Little Italy** | +20% loyalty retention | Soldiers return from hiding 1 turn faster |
| **Brooklyn** | -5 heat/turn | +10% combat defense for units in Brooklyn |
| **Bronx** | $750 recruitment discount | Free soldier recruit every 3 turns |
| **Queens** | +15% extortion success | +5% hit success on all attacks |
| **Staten Island** | +3 respect/turn | +1 influence/turn |

### Universal Bonuses (any controlled district)
- **Turf Tax**: Enemy units in your controlled districts lose **5 loyalty/turn**
- **Safe Passage**: Friendly units get **+1 movement range** in controlled districts

### AI Awareness
AI families benefit from the **same district control bonuses** as the player:
- Manhattan income boost, AP boost
- Bronx recruitment discount and free recruits
- Queens hit success bonus in combat
- Staten Island respect and influence gains
- Turf Tax applies universally — AI-controlled districts drain player unit loyalty too

---

## 26. Prosecution Risk System

Prosecution Risk is a dynamic failure condition that runs parallel to Police Heat. It creates escalating legal pressure as your criminal activity attracts law enforcement attention.

### 26.1 Calculation

```
Prosecution Risk = (Heat × 0.4) + (Active Informants × 10) + (Recent Arrests × 5)
                 - Bribe Reductions - Lawyer Bonus (-5/turn)
```

### 26.2 Thresholds

| Risk Level | Timer | Consequence |
|---|---|---|
| **50+** (Arrest Risk) | 3 consecutive turns at 50+ | Random soldier arrested — jailed for 5 turns (maintenance still paid, -10 loyalty on release) |
| **60+** (Grand Jury) | Immediate | Grand Jury Subpoena — **-30% profit** on all illegal businesses |
| **90+** (Federal Indictment) | 3 turns to respond | Must pay **$25,000** legal defense or **Game Over**. If paid: 30% of cash frozen, illegal businesses suspended for 3 turns |

### 26.3 Key Constants

| Constant | Value |
|---|---|
| `PROSECUTION_ARREST_THRESHOLD` | 50 |
| `PROSECUTION_ARREST_TIMER` | 3 turns |
| `GRAND_JURY_THRESHOLD` | 60 |
| `FEDERAL_INDICTMENT_TIMER` | 3 turns |
| `FEDERAL_INDICTMENT_DEFENSE_COST` | $25,000 |

### 26.4 UI

Status bars in the HQ panel display prosecution risk with tooltip breakdowns of all contributing factors (heat, informants, arrests, bribe offsets).

---

## 27. Counter-Intelligence & Purge Ranks

Internal security system for detecting and eliminating informants (rats) within your family.

### 27.1 How Informants Appear

- **Police Informants**: Soldiers with loyalty < 40 face a turn-based chance of being flipped by police. Active informants generate **+3 heat/turn** and incur a **-10% illegal income penalty**.
- **Enemy Flips**: Rival capos within 3 hexes of your HQ can flip your soldiers (escalating cost: $5K base + $3K per active flip). Flipped units have an **8% turn-based discovery risk**.

### 27.2 Detection Paths

| Method | Chance | Requirement |
|---|---|---|
| **Bribed Captain** | 25% per turn | Active Captain bribe |
| **Bribed Chief** | 40% per turn | Active Chief bribe |
| **Bribed Mayor** | 100% per turn | Active Mayor bribe |
| **Suspicion Markers** | Automatic | Loyalty < 40 for 2+ consecutive turns |
| **Self-Scouting** | Per scout action | Scout your own hex to check for informants |

- **Captain+** bribes: Each turn, a random check reveals whether any of your soldiers are informants
- **Suspicion**: After 2+ turns with loyalty < 40, a soldier is flagged as "Suspicious" (visible in UI)
- **Self-Scout**: Use the Scout tactical action on your own territory to check units for informant status

### 27.3 Purge Ranks (Boss Action)

Eliminate flagged soldiers from your family.

| Property | Value |
|---|---|
| Cost | 1 action point |
| Phase | Action phase only |
| Access | Left panel (Strategic Actions) or HQ panel |
| Targets | Soldiers flagged as "Suspicious" or "Confirmed Rat" |

### 27.4 Elimination Outcomes

| Target Status | Fear | Heat | Loyalty Effect | Respect |
|---|---|---|---|---|
| **Confirmed Rat** | +5 | +3 | +10 to soldiers with loyalty < 50 | — |
| **Innocent Soldier** | +3 | +2 | -5 to all soldiers | -3 |

### 27.5 Turn Summary

Rat eliminations and wrongful kills are reported in the Turn Summary modal at end of turn:
- 🔫 **Rat eliminated**: Confirms the target was an informant
- 💀 **Wrongful kill**: Target was innocent — morale and respect penalties applied

---

*Detailed guides:*
- **[COMBAT_SYSTEM_GUIDE.md](./COMBAT_SYSTEM_GUIDE.md)**
- **[HEADQUARTERS_SYSTEM_GUIDE.md](./HEADQUARTERS_SYSTEM_GUIDE.md)**
- **[SOLDIER_RECRUITMENT_GUIDE.md](./SOLDIER_RECRUITMENT_GUIDE.md)**
