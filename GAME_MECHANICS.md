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
- [16. Victory Conditions](#16-victory-conditions)
- [17. Bankruptcy](#17-bankruptcy)
- [18. Difficulty & Map Size](#18-difficulty--map-size)
- [19. AI Opponents](#19-ai-opponents)
- [20. Intel & Threat Detection](#20-intel--threat-detection)
- [21. Strategic Tips](#21-strategic-tips)

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
| Local recruit cost | $300 (requires 10+ controlled hexes) |
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

Active bribes can also reveal enemy planned hits — see [Intel & Threat Detection](#20-intel--threat-detection).

---

## 13. Recruitment & Promotion

### 13.1 Soldier Recruitment

| Type | Cost | Requirement |
|---|---|---|
| Mercenary | $1,500 | None |
| Local Recruit | $300 | 10+ controlled hexes |

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

---

## 16. Victory Conditions

| Path | Small Map | Medium Map | Large Map |
|---|---|---|---|
| Territory Domination | 40 hexes | 60 hexes | 80 hexes |
| Economic Empire | $50,000/month | $50,000/month | $50,000/month |
| Legacy of Power | Beat rival by 25% after turn 15 | Same | Same |
| Total Domination | Eliminate all 4 families | Same | Same |

---

## 17. Bankruptcy

- If money < 0: 1 random soldier deserts per $10K in debt each turn
- If money < -$50,000: **Game over**
- Soldiers lose -2 loyalty/turn when family can't afford maintenance

---

## 18. Difficulty & Map Size

### 18.1 Difficulty Modes

| Mode | Player Money | AI Aggression | AI Income |
|---|---|---|---|
| Easy | 1.5x | 0.7x | Standard |
| Normal | 1.0x | 1.0x | Standard |
| Hard | 0.7x | 1.5x | +20% |

### 18.2 Map Size

Selected at game start alongside difficulty. Affects hex count, HQ positions, district boundaries, AI recruitment caps, and victory targets. See [Section 2.1](#21-hex-grid).

---

## 19. AI Opponents

- AI personality system: aggressive, defensive, balanced, opportunistic, diplomatic
- Early game boost: +2 actions, +2 tactical for turns 1-8
- AI respects stacking limits, ceasefires, alliances
- AI respect grows with territory and combat activity
- Aggressive AI attempts HQ assault after turn 12
- **Map-scaled AI**: Recruitment caps, action budgets, and income floors scale with map size to ensure AI fills the map appropriately

---

## 20. Intel & Threat Detection

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

## 21. Strategic Tips

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

---

## 22. Tension & War System

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

---

*Detailed guides:*
- **[COMBAT_SYSTEM_GUIDE.md](./COMBAT_SYSTEM_GUIDE.md)**
- **[HEADQUARTERS_SYSTEM_GUIDE.md](./HEADQUARTERS_SYSTEM_GUIDE.md)**
- **[SOLDIER_RECRUITMENT_GUIDE.md](./SOLDIER_RECRUITMENT_GUIDE.md)**
