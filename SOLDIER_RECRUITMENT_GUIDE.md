# 👥 Soldier Recruitment & Promotion Guide — Boss of All Bosses

## 📋 Table of Contents

- [1. Overview](#1-overview)
- [2. Starting Conditions](#2-starting-conditions)
- [3. Soldier Recruitment](#3-soldier-recruitment)
- [4. Soldier Stats](#4-soldier-stats)
- [5. Capo Promotion](#5-capo-promotion)
- [6. Hitman Contracts](#6-hitman-contracts)
- [7. Unit Costs & Maintenance](#7-unit-costs--maintenance)
- [8. Strategic Tips](#8-strategic-tips)

---

## 1. Overview

The personnel system governs recruitment of new soldiers and promotion of experienced soldiers into capos. Hitmen are external contract killers hired for surgical strikes.

---

## 2. Starting Conditions

Starting soldiers vary by family (historically inspired):

| Family | Soldiers | Capos | Boss | Starting Money |
|---|---|---|---|---|
| Gambino | 4 | 1 | 1 | $60,000 |
| Genovese | 4 | 1 | 1 | $45,000 |
| Lucchese | 3 | 1 | 1 | $70,000 |
| Bonanno | 2 | 1 | 1 | $40,000 |
| Colombo | 1 | 1 | 1 | $35,000 |

All units start at their family's HQ hex.

---

## 3. Soldier Recruitment

Two recruitment paths:

| Type | Cost | Requirement | Notes |
|---|---|---|---|
| **Mercenary** | $1,500 | None | Available immediately |
| **Local Recruit** | $600 | 10+ controlled hexes | Cheaper, marked as "recruited" |

Both deploy at headquarters during the Deploy phase. Respect ≥ 50 provides up to 30% recruitment discount.

---

## 4. Soldier Stats

Every soldier tracks individual statistics:

| Stat | Range | Growth | Description |
|---|---|---|---|
| Loyalty | 0–80 (soldiers) / 0–99 (capos) | +2 per action, +5 per combat, -2/turn if unpaid | Promotion eligibility, internal hit survival |
| Training | 0–3 | +1 per turn deployed away from HQ | Combat effectiveness |
| Victories | 0–5 | +1 per successful hit or extortion | Promotion requirement |
| Toughness | 0–5 | +1 per survived combat encounter | HQ assault eligibility |
| Racketeering | 0–5 | +1 per successful extortion | Promotion requirement |
| Hits | Count | +1 per hit action | Tracking only |
| Extortions | Count | +1 per extortion action | Tracking only |

### 4.1 Loyalty Growth & Decay

**Per-Turn Growth:**
| Source | Bonus | Condition |
|---|---|---|
| Stats baseline | `floor((training + toughness + racketeering + victories) / 4)` | Always |
| High-income hex | +3/turn | On hex with business income ≥ $4,000 |

**Action Bonuses (immediate):**
| Trigger | Bonus |
|---|---|
| Successful hit, extortion, or claim | +2 loyalty |
| Survived combat (win or loss) | +5 loyalty |

**Decay:**
| Trigger | Penalty |
|---|---|
| Unpaid maintenance | -2 loyalty/turn |
| Capo wounded in combat | -10 loyalty |

### 4.2 Suspicion & Informant Flags

Soldiers can become informants (rats) through police pressure or enemy espionage. Three tracking fields:

| Field | Type | Description |
|---|---|---|
| `suspiciousTurns` | Counter | Increments each turn loyalty stays < 40. Resets when loyalty ≥ 40. |
| `suspicious` | Boolean | Set to `true` when `suspiciousTurns` ≥ 2. Visible in UI as ⚠️ marker. |
| `confirmedRat` | Boolean | Set to `true` when an informant is positively identified via bribe discovery or self-scouting. Visible as 🐀 marker. |

Soldiers flagged as Suspicious or Confirmed Rat can be eliminated via the **Purge Ranks** Boss action (see Section 9).

---

## 5. Capo Promotion

Promote an experienced soldier into a capo — a leader unit with enhanced movement, income generation, and negotiation abilities.

### 5.1 Requirements

| Requirement | Value |
|---|---|
| Cost | $10,000 |
| Min victories | **3** (0–5 scale) |
| Min loyalty | **60** (0–80 scale) |
| Min training | **2** (0–3 scale) |
| Min toughness | **3** (0–5 scale) |
| Min racketeering | **3** (0–5 scale) |
| Max capos | 3 total |

A soldier typically needs 3+ successful hits/extortions, 3+ survived combats, and 2+ turns deployed to qualify. This is achievable in roughly 8-12 turns of active use.

### 5.2 Capo Personalities

Each promoted capo receives a random personality:

| Personality | Icon | Bonuses |
|---|---|---|
| **Diplomat** | 🕊️ | +20% Ceasefire, +10% Alliance |
| **Enforcer** | 💪 | +15% Bribe for Territory |
| **Schemer** | 🧠 | +15% Alliance, +10% all negotiations |

### 5.3 Capo Properties

| Property | Value |
|---|---|
| Movement | Up to 5 hexes (flying), 3 moves per turn |
| Income | 100% territory income (vs soldiers' 30%) |
| Scout range | 2 hexes (vs soldiers' 1 hex) |
| Auto-claim | Claims neutral territory automatically on arrival |
| Combat immunity | Cannot die in regular combat — wounded instead |
| Abilities | Negotiate, establish safehouses, escort soldiers |

**Wound Mechanic**: If a capo would be killed in combat, they are instead wounded: -10 loyalty and -1 move penalty for 1 turn. Capos can only be permanently eliminated via hitman contract or planned hit.

---

## 6. Hitman Contracts

External contract killers — not family members.

### 6.1 How It Works

| Property | Value |
|---|---|
| Cost | **$30,000** per contract |
| Max active | 3 |
| Heat | None |
| Bonuses gained | None (no respect, fear, or stat gains) |

### 6.2 Duration & Success

**Duration** (based on target location at hire):

| Location | Duration |
|---|---|
| Open field | 3 turns |
| Fortified / Safehouse | 4 turns |
| HQ | 5 turns |

**Success rate** (based on target location at resolution):

| Location | Success |
|---|---|
| Open field | 90% |
| Fortified | 65% |
| Safehouse | 55% |
| HQ | 40% |

Auto-fails after 5 turns total.

### 6.3 Failed Hits & AI Alert

- **Refund**: 50% (**$15,000** back)
- **AI Alert**: Target family enters alert mode for 5 turns (+1 recruit/turn, +1 move/unit, fortify priority, targets player)
- **Global tension**: Successful hitman kills raise tension across ALL family pairs (+5 for soldier, +15 for capo). No pair tension generated (anonymous).

---

## 7. Unit Costs & Maintenance

| Unit | Cost | Per-Turn Maintenance |
|---|---|---|
| Soldier (Mercenary) | $1,500 | $600/turn **(deployed only)** |
| Soldier (Local Recruit) | $600 | $600/turn **(deployed only)** |
| Soldier (Undeployed) | — | **Free** |
| Capo (Promotion) | $10,000 | — |
| Hitman contract | **$30,000** | — (one-time) |
| Empty claimed hex | — | $150/turn (community upkeep) |

**Note**: Soldiers only incur maintenance costs once deployed to the map. Undeployed soldiers in the recruitment pool are free. Once deployed (including if recalled to HQ via Sitdown or manual movement), they continue to cost $600/turn.

---

## 8. Strategic Tips

### Recruitment
- Recruit mercenaries early for action coverage ($1,500 each)
- Once at 10+ hexes, switch to local recruits ($600 each)
- Respect ≥ 50 gives up to 30% discount
- Keep a reserve of undeployed soldiers — they're free until you need them

### Capo Promotion
- Focus on getting a soldier to 3 victories, 3 toughness, 3 racketeering
- Deploy soldiers near combat zones for toughness growth
- Use extortion to build racketeering + victories simultaneously
- Deploy capos to high-income hexes (100% vs 30% income)
- Capos auto-claim neutral territory on arrival — use their 5-hex fly for rapid expansion

### Hitman Contracts
- Target enemy capos on high-value hexes
- Target units in open field for 90% success
- Failed contracts trigger 5-turn AI alert — plan accordingly
- Hitman contracts are the only way to permanently kill enemy capos

### HQ Assault Preparation
- Build a soldier to toughness ≥ 4 and loyalty ≥ 70
- Flip enemy soldiers at their HQ to weaken defenses (-10% each)
- Use Sitdown to consolidate your own HQ defense
- Position multiple units adjacent to target HQ for the +5% per-unit bonus

---

## 9. Purge Ranks (Eliminating Soldiers)

The Boss can eliminate soldiers flagged as "Suspicious" or "Confirmed Rat" to protect the family from internal threats.

### 9.1 Mechanics

| Property | Value |
|---|---|
| Cost | 1 action point |
| Phase | Action phase only |
| Access | Left panel (Strategic Actions → Purge Ranks) or HQ Information Panel |
| Targets | Deployed soldiers flagged as `suspicious` or `confirmedRat` |

### 9.2 Outcomes

| Target Status | Result |
|---|---|
| **Confirmed Rat** | 🔫 +5 fear, +3 heat. Soldiers with loyalty < 50 gain +10 loyalty. Reported in Turn Summary. |
| **Innocent Soldier** | 💀 +3 fear, +2 heat. All soldiers lose -5 loyalty. Family loses -3 respect. Reported in Turn Summary. |

### 9.3 Detection Methods

| Method | Chance | How |
|---|---|---|
| Bribed Captain | 25%/turn | Random check each turn |
| Bribed Chief | 40%/turn | Random check each turn |
| Bribed Mayor | 100%/turn | Guaranteed discovery |
| Suspicion markers | Automatic | Loyalty < 40 for 2+ consecutive turns |
| Self-scouting | Per action | Scout your own hex |

### 9.4 Strategic Considerations

- Eliminating a confirmed rat is always net positive — fear boost + loyalty restoration
- Eliminating a suspicious (but innocent) soldier is devastating — morale collapse across the family
- Invest in Captain+ bribes for reliable detection before purging
- Keep soldier loyalty above 40 to prevent suspicion markers from appearing

---

*See also: [GAME_MECHANICS.md](./GAME_MECHANICS.md) for the full game systems overview.*
