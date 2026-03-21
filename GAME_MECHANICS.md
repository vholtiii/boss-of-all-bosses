# 🎮 Game Mechanics & Design Guide

## 📋 Table of Contents

- [1. Core Gameplay Loop](#1-core-gameplay-loop)
  - [1.1 Turn Structure](#11-turn-structure)
  - [1.2 Turn Phases](#12-turn-phases)
  - [1.3 Action Budget](#13-action-budget)
- [2. Map & Territory](#2-map--territory)
  - [2.1 Hex Grid](#21-hex-grid)
  - [2.2 Districts](#22-districts)
  - [2.3 Territory Control States](#23-territory-control-states)
- [3. The Five Families](#3-the-five-families)
  - [3.1 Family Bonuses](#31-family-bonuses)
  - [3.2 Headquarters Locations](#32-headquarters-locations)
- [4. Units & Personnel](#4-units--personnel)
  - [4.1 Starting Setup](#41-starting-setup)
  - [4.2 Soldiers](#42-soldiers)
  - [4.3 Capos](#43-capos)
  - [4.4 Boss](#44-boss)
  - [4.5 Hitmen](#45-hitmen)
  - [4.6 Soldier Stats & Tracking](#46-soldier-stats--tracking)
- [5. Turn Phases In Detail](#5-turn-phases-in-detail)
  - [5.1 Deploy Phase](#51-deploy-phase)
  - [5.2 Tactical (Move) Phase](#52-tactical-move-phase)
  - [5.3 Action Phase](#53-action-phase)
  - [5.4 End Turn](#54-end-turn)
- [6. Tactical Actions](#6-tactical-actions)
  - [6.1 Move](#61-move)
  - [6.2 Scout](#62-scout)
  - [6.3 Fortify](#63-fortify)
  - [6.4 Safehouse](#64-safehouse)
  - [6.5 Escort](#65-escort)
- [7. Combat Actions](#7-combat-actions)
  - [7.1 Hit (Attack Enemy Territory)](#71-hit-attack-enemy-territory)
  - [7.2 Extort](#72-extort)
  - [7.3 Claim Territory](#73-claim-territory)
- [8. Negotiation & Diplomacy](#8-negotiation--diplomacy)
  - [8.1 Ceasefire Pact](#81-ceasefire-pact)
  - [8.2 Bribe for Territory](#82-bribe-for-territory)
  - [8.3 Form Alliance](#83-form-alliance)
- [9. Economy & Businesses](#9-economy--businesses)
  - [9.1 Business Types](#91-business-types)
  - [9.2 Income Calculation](#92-income-calculation)
  - [9.3 Maintenance Costs](#93-maintenance-costs)
- [10. Reputation System](#10-reputation-system)
  - [10.1 Reputation Metrics](#101-reputation-metrics)
  - [10.2 Reputation Effects](#102-reputation-effects)
- [11. Police Heat & Corruption](#11-police-heat--corruption)
  - [11.1 Heat Generation](#111-heat-generation)
  - [11.2 Bribe Tiers](#112-bribe-tiers)
- [12. Recruitment & Promotion](#12-recruitment--promotion)
  - [12.1 Soldier Recruitment](#121-soldier-recruitment)
  - [12.2 Capo Promotion](#122-capo-promotion)
  - [12.3 Hitman Promotion](#123-hitman-promotion)
- [13. Victory Conditions](#13-victory-conditions)
  - [13.1 Territory Domination](#131-territory-domination)
  - [13.2 Economic Empire](#132-economic-empire)
  - [13.3 Legacy of Power](#133-legacy-of-power)
- [14. AI Opponents](#14-ai-opponents)
- [15. Strategic Tips](#15-strategic-tips)

---

## 1. Core Gameplay Loop

### 1.1 Turn Structure

Each turn represents one month of criminal operations. The game follows a strict phase order:

```
Deploy → Tactical (Move) → Action → End Turn
```

### 1.2 Turn Phases

| Phase | Purpose | Key Activities |
|---|---|---|
| **Deploy** | Place units on the map | Deploy soldiers/capos from HQ or safehouse |
| **Tactical** | Move and position units | Move, Scout, Fortify, Escort, Safehouse |
| **Action** | Execute operations | Hit, Extort, Claim, Negotiate |
| **End Turn** | AI + processing | AI acts, income calculated, events fire |

### 1.3 Action Budget

- **Base actions per turn**: 2
- **Bonus action**: +1 if Respect ≥ 50 AND Influence ≥ 50
- **Tactical actions per turn**: 3 (separate budget, used during Tactical phase)

---

## 2. Map & Territory

### 2.1 Hex Grid

The map is a hexagonal grid with radius 10 (~331 hexes). Uses cube coordinates (q, r, s).

### 2.2 Districts

Each hex belongs to one of six districts:
- **Little Italy** — Gambino heartland
- **Brooklyn** — Industrial, docks
- **Queens** — Residential
- **Manhattan** — Commercial center, heavy police presence (extortion is 20% harder)
- **Bronx** — Urban warfare
- **Staten Island** — Isolated

### 2.3 Territory Control States

- **Neutral** (gray) — Unclaimed, can be claimed or extorted
- **Player-controlled** (green) — Your family's territory
- **Rival-controlled** (red) — Enemy family territory

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

| Family | District | Coordinates |
|---|---|---|
| Gambino | Little Italy | (-5, 5, 0) |
| Genovese | Brooklyn Heights | (5, -5, 0) |
| Lucchese | Queens | (-5, -5, 10) |
| Bonanno | Staten Island | (5, 5, -10) |
| Colombo | Manhattan | (0, 0, 0) |

Headquarters **cannot be captured or destroyed**.

---

## 4. Units & Personnel

### 4.1 Starting Setup

Each family starts with:
- **3 Soldiers**
- **1 Capo**
- **1 Boss** (immovable, stays at HQ)

### 4.2 Soldiers

| Property | Value |
|---|---|
| Movement range | 1 hex (adjacent only) |
| Moves per turn | 2 |
| Recruitment cost | $500 |
| Can be promoted to | Capo or Hitman |

### 4.3 Capos

| Property | Value |
|---|---|
| Movement range | Up to 5 hexes (flying) |
| Moves per turn | 3 |
| Promotion cost | $10,000 |
| Max capos | 3 |
| Unique traits | Named, have personality (Diplomat/Enforcer/Schemer) |
| Income bonus | 100% territory income (vs soldiers' 30%) |

**Capo Personalities:**
- **Diplomat** 🕊️ — +20% Ceasefire, +10% Alliance success
- **Enforcer** 💪 — +15% Bribe for Territory success
- **Schemer** 🧠 — +15% Alliance, +10% all negotiations

### 4.4 Boss

- Permanently stationed at headquarters
- Never deploys or moves
- Represents family leadership

### 4.5 Hitman Contracts

Hitmen are **external contract killers** — not members of your family. They perform surgical strikes against specific enemy units.

| Property | Value |
|---|---|
| Cost | $15,000 per contract |
| Max active contracts | 3 |
| Duration | 3–5 turns (based on target location) |
| Heat generated | None |
| Combat bonus | None (external, not in battle) |
| Bonuses gained | None (no respect, fear, or stat gains) |

See [SOLDIER_RECRUITMENT_GUIDE.md](./SOLDIER_RECRUITMENT_GUIDE.md#6-hitman-contracts) for full details on targeting, success rates, and failed hit consequences.

### 4.6 Soldier Stats & Tracking

Each soldier tracks:
- **Loyalty** (1–100)
- **Training** (1–10)
- **Equipment** (1–10)
- **Hits** completed
- **Extortions** completed
- **Intimidations** completed
- **Survived conflicts**

---

## 5. Turn Phases In Detail

### 5.1 Deploy Phase

- Deploy soldiers and capos from your HQ
- Soldiers deploy to adjacent hexes only
- Capos can deploy up to 5 hexes away
- Safehouse acts as a secondary deploy point if active

### 5.2 Tactical (Move) Phase

Uses **3 tactical actions** per turn. Choose from:
- **Move** — Standard movement
- **Scout** — Reveal intel on a hex
- **Fortify** — Defensive stance
- **Safehouse** — Create secondary deploy point (capo only)
- **Escort** — Capo transports soldiers

### 5.3 Action Phase

Uses **2–3 action points** per turn. Choose from:
- **Hit** — Attack enemy territory
- **Extort** — Shakedown neutral or enemy hexes
- **Claim** — Peacefully claim neutral territory
- **Negotiate** — Diplomatic actions with rival families

### 5.4 End Turn

- AI opponents take actions
- Income and maintenance calculated
- Police heat adjusts
- Scouted hexes and safehouses tick down
- Victory conditions checked
- Turn summary modal shows results

---

## 6. Tactical Actions

### 6.1 Move

Standard movement following unit movement rules (soldiers: 1 hex, capos: up to 5 hexes).

### 6.2 Scout

| Property | Value |
|---|---|
| Who can do it | Soldiers |
| Cost | 1 tactical action |
| Duration | 3 turns |
| Effect | Reveals business profits (neutral) or enemy unit/family data |
| Combat bonus | +15% hit success on scouted hex |

### 6.3 Fortify

| Property | Value |
|---|---|
| Who can do it | Any unit |
| Cost | 1 tactical action |
| Effect | +25% defense, 50% casualty reduction |
| Duration | Persists until the unit moves |
| Note | Shield icon hidden from enemies |

### 6.4 Safehouse

| Property | Value |
|---|---|
| Who can do it | Capos only |
| Cost | 1 tactical action |
| Requires | Player-controlled territory |
| Duration | 5 turns |
| Effect | Secondary deployment point |
| Limit | 1 safehouse at a time; destroyed if hex captured |

### 6.5 Escort

| Property | Value |
|---|---|
| Who can do it | Capos only |
| Cost | 1 action (call soldier) or 2 actions (move with soldiers) |
| Max soldiers | 2 |
| Call range | Any range (teleport soldier to capo) |
| Move mode | Capo moves with escorted soldiers |
| Note | Soldiers auto-detach at destination |

---

## 7. Combat Actions

### 7.1 Hit (Attack Enemy Territory)

**Participants**: Selected unit + player units on the target hex + player units on adjacent hexes (adjacent units contribute at 90% effectiveness).

**Success Chance Calculation:**
```
Base chance = 50% + (attackers - defenders) × 15%
+ family combat bonus
+ Lucchese hit bonus
+ scout bonus (+15% if hex is scouted)
+ fortified attacker bonus (+12.5%)
- fortified defender penalty (-25%)
Clamped to 10%–95%
```

**On Victory:**
- Territory set to neutral (must Claim next turn)
- Enemy units removed from hex
- +5 respect, +5 fear
- 20% attacker casualties (random selection, halved if fortified)

**On Defeat:**
- 40% attacker casualties (minimum 1, random selection, halved if fortified)
- Surviving units gain "survived conflict" stat

**Heat:** 8 + (total units involved × 2), max 25

**Diplomacy interactions:**
- Attacking an allied family: breaks alliance, −25 respect, −15 reputation, −40 relationship
- Breaking a ceasefire: −15 respect

### 7.2 Extort

**Participants**: Player units on target hex + player units on adjacent hexes.

**Two modes:**
| | Neutral Target | Enemy Target |
|---|---|---|
| Base success | 90% | 50% |
| On success | Claims territory + money + respect | Steals income only + respect |
| Money gained | $3,000 × respect multiplier | Business income × respect multiplier |
| Respect gained | +5 | +3 |

**Respect payout multiplier**: 0.5 + (respect / 100). At 0 respect = 0.5x, at 100 respect = 1.5x.

**Success modifiers:**
- Family extortion bonus
- −(heat / 1000) penalty
- +(influence / 100) × 15% bonus
- Manhattan: ×0.8 (20% harder)
- Max 99%

**On Failure (no casualties!):**
- −3 respect
- −2 fear
- +5 extra police heat
- Notification: "The locals refused to pay and word spread."

**Heat:** 8 (neutral) or 12 (enemy) + 5 if failed

### 7.3 Claim Territory

**Target**: Neutral hexes only.

**Participants**: Player soldiers on hex + player soldiers adjacent to hex. At least 1 required.

**Effect:**
- Territory claimed (no combat roll)
- +1 respect, +1 influence
- No money reward, no casualties

---

## 8. Negotiation & Diplomacy

Negotiations require a capo adjacent to enemy territory.

### 8.1 Ceasefire Pact

| Property | Value |
|---|---|
| Base success | 50% |
| Cost | $3,000 + 5 reputation |
| Duration | 3–5 turns |
| Effect | Both families cannot attack each other |
| Capo bonus | Diplomat +20%, Schemer +10% |

### 8.2 Bribe for Territory

| Property | Value |
|---|---|
| Base success | 40% |
| Cost | $8,000 (scales with enemy strength) |
| Effect | Peacefully claim the target hex |
| Capo bonus | Enforcer +15%, Schemer +10% |

### 8.3 Form Alliance

| Property | Value |
|---|---|
| Base success | 30% |
| Cost | $5,000 |
| Effect | Conditional pact with shared defense |
| Conditions | No expand in district / no attack family / share income |
| Capo bonus | Schemer +15%, Diplomat +10% |
| Breaking penalty | −25 respect, −15 reputation, −40 relationship |

---

## 9. Economy & Businesses

### 9.1 Business Types

| Type | Icon | Base Income | Heat | Laundering Capacity |
|---|---|---|---|---|
| Brothel | 💋 | $3,000 | 4 | 10% |
| Gambling Den | 🎲 | $4,000 | 3 | 30% |
| Loan Sharking | 💰 | $5,000 | 5 | 20% |
| Store Front | 🏪 | $2,000 | 1 | 50% |

### 9.2 Income Calculation

- Territory with **capo deployed**: 100% of business income
- Territory with **soldiers only**: 30% of business income
- Family bonuses modify income (e.g., Genovese +30% business income)

### 9.3 Maintenance Costs

| Unit | Cost per turn |
|---|---|
| Soldier | Base rate |
| Hitman | 1.5× soldier cost |

---

## 10. Reputation System

### 10.1 Reputation Metrics

| Metric | Range | Description |
|---|---|---|
| Respect | 0–100 | Based on successful operations and territory control |
| Reputation | 0–100 | Overall standing in the criminal underworld |
| Loyalty | 0–100 | How loyal your soldiers and capos are |
| Fear | 0–100 | How much other families fear you |
| Street Influence | 0–100 | Influence on the streets |

### 10.2 Reputation Effects

- **Respect ≥ 50 + Influence ≥ 50**: Grants +1 bonus action per turn
- **Respect scales extortion payouts**: 0.5x at 0, 1.5x at 100
- **Fear**: Gained from hits (+5 per successful hit)
- **Respect lost on failed extortion**: −3
- **Fear lost on failed extortion**: −2

---

## 11. Police Heat & Corruption

### 11.1 Heat Generation

| Action | Heat Gain |
|---|---|
| Hit territory | 8 + (units involved × 2), max 25 |
| Extort (neutral) | 8 (+5 on failure) |
| Extort (enemy) | 12 (+5 on failure) |

### 11.2 Bribe Tiers

| Tier | Cost | Base Success | Duration | Effect |
|---|---|---|---|---|
| Patrol Officer | $500 | 80% | 3 turns | −30% street heat, −2 heat/turn |
| Police Captain | $2,000 | 60% | 5 turns | 20% economic pressure on rival businesses |
| Police Chief | $8,000 | 40% | 7 turns | +50% intel on target rival |
| Mayor | $25,000 | 25% | 10 turns | Can shut down rival territory |

---

## 12. Recruitment & Promotion

### 12.1 Soldier Recruitment

- **Cost**: $500 per soldier
- Recruited soldiers deploy at headquarters

### 12.2 Capo Promotion

| Requirement | Value |
|---|---|
| Cost | $10,000 |
| Min survived conflicts | 5 |
| Min loyalty | 60 |
| Min training | 3 |
| Max capos | 3 |

### 12.3 Hitman Promotion

| Requirement | Value |
|---|---|
| Min strength (training × 10) | 80 |
| Min reputation (loyalty) | 50 |
| Min hits | 3 |
| Max hitmen | 3 |

---

## 13. Victory Conditions

Three paths to victory. Achieving any one triggers a win.

### 13.1 Territory Domination

- **Target**: Control **60 hexes** (~18% of map)
- Requires sustained expansion across multiple districts

### 13.2 Economic Empire

- **Target**: **$50,000+** monthly income
- Requires high-value businesses with capos deployed

### 13.3 Legacy of Power

- **Min turn**: Must reach **turn 15**
- **Requirement**: Player total reputation (respect + reputation + fear + street influence) must exceed the **highest rival's score by at least 25%**
- **Rival score formula**: (territory count × 3) + (soldiers × 2) + (money / 500)

---

## 14. AI Opponents

Each AI family has unique behavior patterns and takes actions during the End Turn phase:
- **Territory expansion** — Claims and attacks hexes
- **Business management** — Develops controlled territory
- **Combat** — Attacks player and rival territories
- **Diplomacy** — May propose or break deals

AI difficulty scales with their family bonuses and growth multipliers.

---

## 15. Strategic Tips

### Early Game (Turns 1–5)
1. Claim adjacent neutral territory for free respect/influence
2. Extort neutral hexes with businesses for income
3. Deploy capos to high-value hexes for full income
4. Keep heat low — avoid unnecessary hits

### Mid Game (Turns 6–15)
1. Promote experienced soldiers to capos and hitmen
2. Use scouts before hitting enemy territory (+15% success)
3. Negotiate ceasefires to protect flanks while expanding elsewhere
4. Build toward the +1 bonus action threshold (50 respect + 50 influence)

### Late Game (Turns 15+)
1. Focus on whichever victory condition you're closest to
2. Use hitmen for high-success hits on fortified enemy territory
3. Deploy fortified defenders on key hexes
4. Use escort to rapidly reposition forces

---

*For more specific guides, see:*
- **[COMBAT_SYSTEM_GUIDE.md](./COMBAT_SYSTEM_GUIDE.md)** — Hit, extort, and claim mechanics
- **[HEADQUARTERS_SYSTEM_GUIDE.md](./HEADQUARTERS_SYSTEM_GUIDE.md)** — HQ, deployment, and unit management
- **[SOLDIER_RECRUITMENT_GUIDE.md](./SOLDIER_RECRUITMENT_GUIDE.md)** — Recruitment, promotion, and soldier stats
