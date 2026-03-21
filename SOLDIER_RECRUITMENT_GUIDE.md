# 👥 Soldier Recruitment & Promotion Guide — Boss of All Bosses

## 📋 Table of Contents

- [1. Overview](#1-overview)
- [2. Starting Conditions](#2-starting-conditions)
- [3. Soldier Recruitment](#3-soldier-recruitment)
- [4. Soldier Stats](#4-soldier-stats)
- [5. Capo Promotion](#5-capo-promotion)
  - [5.1 Requirements](#51-requirements)
  - [5.2 Capo Personalities](#52-capo-personalities)
- [6. Hitman Promotion](#6-hitman-promotion)
  - [6.1 Requirements](#61-requirements)
  - [6.2 Hitman Levels](#62-hitman-levels)
- [7. Unit Costs & Maintenance](#7-unit-costs--maintenance)
- [8. Strategic Tips](#8-strategic-tips)

---

## 1. Overview

The personnel system governs recruitment of new soldiers and promotion of experienced soldiers into specialized roles (capos and hitmen). All units start at headquarters and must be deployed to the field.

---

## 2. Starting Conditions

| Property | Value |
|---|---|
| Starting soldiers | 3 per family |
| Starting capos | 1 per family |
| Starting boss | 1 per family (permanent) |
| Starting money | Varies by family |

All families start with the same unit composition, ensuring a balanced early game.

---

## 3. Soldier Recruitment

| Property | Value |
|---|---|
| Cost | $500 per soldier |
| Location | Recruited at headquarters |
| Deployment | Must be deployed during Deploy phase |
| Movement | 1 hex adjacent, 2 moves per turn |

New recruits start with base stats and must build experience through combat operations.

---

## 4. Soldier Stats

Every soldier tracks individual statistics:

| Stat | Range | Description |
|---|---|---|
| Loyalty | 0–80 (soldiers) / 0–99 (capos) | Affects promotion eligibility, internal hit survival, and overall effectiveness |
| Training | 0–3 | +1 per turn deployed away from HQ. Combat effectiveness and hitman eligibility |
| Hits | Count | Number of hit operations completed |
| Extortions | Count | Number of extortion operations completed |
| Victories | 0–5 | +1 per successful extortion or hit |
| Toughness | 0–5 | +1 per survived combat encounter |
| Racketeering | 0–5 | +1 per successful extortion |

### 4.1 Loyalty Growth & Decay

Loyalty changes dynamically each turn and during actions:

**Per-Turn Growth:**
| Source | Bonus | Condition |
|---|---|---|
| Stats baseline | `floor((training + toughness + racketeering + victories) / 4)` | Always (rewards well-rounded soldiers) |
| High-income hex | +3/turn | Stationed on hex with business income ≥ $4,000 |

**Action Bonuses (immediate):**
| Trigger | Bonus |
|---|---|
| Successful hit, extortion, or claim | +2 loyalty |
| Survived combat (win or loss) | +5 loyalty |

**Decay:**
| Trigger | Penalty |
|---|---|
| Unpaid maintenance (family can't afford upkeep) | -2 loyalty/turn |

**Note:** Soldiers returning from hiding with loyalty < 70 are eliminated by the family (internal hit). See [COMBAT_SYSTEM_GUIDE.md](./COMBAT_SYSTEM_GUIDE.md) for details.

Stats increase through successful operations and can be tracked per unit.

---

## 5. Capo Promotion

Promote an experienced soldier into a capo — a leader unit with enhanced movement, income generation, and negotiation abilities.

### 5.1 Requirements

| Requirement | Value |
|---|---|
| Cost | $10,000 |
| Min survived conflicts | 5 |
| Min loyalty | 60 |
| Min training | 3 (on 1–10 scale) |
| Max capos | 3 total |

### 5.2 Capo Personalities

Each promoted capo receives a random personality that provides negotiation bonuses:

| Personality | Icon | Bonuses |
|---|---|---|
| **Diplomat** | 🕊️ | +20% Ceasefire success, +10% Alliance success |
| **Enforcer** | 💪 | +15% Bribe for Territory success |
| **Schemer** | 🧠 | +15% Alliance success, +10% all negotiations |

Capo properties:
- **Named**: Each capo has a unique generated name
- **Movement**: Up to 5 hexes (flying), 3 moves per turn
- **Income**: 100% territory income (vs soldiers' 30%)
- **Abilities**: Can negotiate, establish safehouses, escort soldiers

---

## 6. Hitman Promotion

Promote an elite soldier into a hitman — a specialist unit with massive combat bonuses.

### 6.1 Requirements

| Requirement | Value |
|---|---|
| Min strength (training × 10) | 80 (i.e., training ≥ 8) |
| Min reputation (loyalty) | 50 |
| Min hits completed | 3 |
| Max hitmen | 3 total |
| Maintenance cost | 1.5× normal soldier cost |

### 6.2 Hitman Levels

Hitmen have levels 1–3 that increase their combat bonus:

| Level | Hit Success Bonus |
|---|---|
| 1 | +30% |
| 2 | +40% |
| 3 | +50% |

Multiple hitmen in the same battle stack their bonuses.

---

## 7. Unit Costs & Maintenance

| Unit | Recruitment/Promotion Cost | Per-Turn Maintenance |
|---|---|---|
| Soldier | $500 | Base rate |
| Capo | $10,000 (promotion) | — |
| Hitman | — (promotion) | 1.5× soldier maintenance |

---

## 8. Strategic Tips

### Recruitment
- Recruit early when money allows — more soldiers = more actions available
- Deploy soldiers near neutral territory for easy claims and extortions

### Capo Promotion
- Focus on getting soldiers to 5 survived conflicts and 60 loyalty
- Deploy capos to high-income hexes for maximum revenue (100% vs 30%)
- Use capo personalities strategically — diplomats for peace, enforcers for expansion

### Hitman Promotion
- Train soldiers to level 8+ training before promoting
- Hitmen dramatically increase hit success rates
- Stack hitmen on difficult targets for near-guaranteed captures

### General
- Don't over-extend — each soldier lost is an action budget lost
- Fortify key defensive positions to protect valuable territory
- Use escorts to rapidly move soldiers across the map via capos

---

*See also: [GAME_MECHANICS.md](./GAME_MECHANICS.md) for the full game systems overview.*
