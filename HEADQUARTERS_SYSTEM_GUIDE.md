# 🏛️ Headquarters System Guide — Boss of All Bosses

## 📋 Table of Contents

- [1. Overview](#1-overview)
- [2. Headquarters Locations](#2-headquarters-locations)
- [3. Starting Units](#3-starting-units)
- [4. Headquarters Properties](#4-headquarters-properties)
- [5. Deployment System](#5-deployment-system)
- [6. Unit Movement Rules](#6-unit-movement-rules)
- [7. HQ Assault & Defense](#7-hq-assault--defense)
- [8. Boss Actions: Call a Sitdown](#8-boss-actions-call-a-sitdown)
- [9. Flip Soldier](#9-flip-soldier)
- [10. HQ Information Panel](#10-hq-information-panel)
- [11. Visual Indicators](#11-visual-indicators)
- [12. War System & HQ](#12-war-system--hq)

---

## 1. Overview

Each of the five families has a headquarters on the hex map. The HQ is the starting location for all units, the permanent home of the Boss, and the primary deployment point for new recruits. HQ **can be assaulted** — a successful assault eliminates the family from the game.

---

## 2. Headquarters Locations

HQ positions vary by map size:

### Medium Map (radius 10, default)

| Family | District | Coordinates (q,r,s) |
|---|---|---|
| **Gambino** | Little Italy | (-8, 8, 0) |
| **Genovese** | Manhattan | (8, -8, 0) |
| **Lucchese** | Queens | (-8, -1, 9) |
| **Bonanno** | Staten Island | (7, 3, -10) |
| **Colombo** | Bronx | (0, -9, 9) |

### Small Map (radius 7)

| Family | Coordinates (q,r,s) |
|---|---|
| Gambino | (-5, 5, 0) |
| Genovese | (5, -5, 0) |
| Lucchese | (-5, -1, 6) |
| Bonanno | (5, 2, -7) |
| Colombo | (0, -6, 6) |

### Large Map (radius 13)

| Family | Coordinates (q,r,s) |
|---|---|
| Gambino | (-11, 11, 0) |
| Genovese | (11, -11, 0) |
| Lucchese | (-11, -1, 12) |
| Bonanno | (10, 3, -13) |
| Colombo | (0, -12, 12) |

Each HQ + its 6 adjacent hexes start as pre-claimed territory for that family.

---

## 3. Starting Units

Starting soldiers vary by family (historically inspired):

| Family | Soldiers | Capos | Boss |
|---|---|---|---|
| Gambino | 4 | 1 | 1 |
| Genovese | 4 | 1 | 1 |
| Lucchese | 3 | 1 | 1 |
| Bonanno | 2 | 1 | 1 |
| Colombo | 1 | 1 | 1 |

All units start at their family's HQ.

---

## 4. Headquarters Properties

- **Can be assaulted**: Enemy soldiers adjacent to HQ can attempt an HQ Assault (endgame elimination)
- **Built-in defense**: -30% to attacker success rate
- **Permanent control**: Always belongs to its family (unless eliminated)
- **Unit spawning**: All recruited units appear at HQ
- **Stacking exempt**: HQ hex is exempt from the 2-unit stacking limit
- **Cannot be**: Scouted, claimed, or extorted

---

## 5. Deployment System

### 5.1 Deploy Phase

1. Enter the **Deploy** phase at the start of your turn
2. Click your headquarters
3. Choose "Deploy Soldier" or "Deploy Capo"
4. Click an available hex (shown in sky blue)
5. Or use **Skip to Action** to jump directly to the Action phase

### 5.2 Deployment Ranges

| Unit | Deploy Range |
|---|---|
| Soldier | Adjacent hexes only (1 hex) |
| Capo | Up to 5 hexes away (flying) |

### 5.3 Safehouse as Secondary Deploy Point

Active safehouses (established by capos) serve as secondary deploy points with the same range rules. Safehouses last 5 turns and are destroyed if the hex is captured.

---

## 6. Unit Movement Rules

### 6.1 Soldiers — Free Movement in Connected Territory

Soldiers can move **unlimited hexes for free** within territory that forms an unbroken chain of player-owned hexes back to HQ. This is determined by BFS flood-fill.

| Scenario | Move Cost |
|---|---|
| Within connected territory | **Free** (0 moves) |
| Leaving connected territory | 1 move (standard) |
| Crossing gap to disconnected territory | 1 move (standard) |

Standard movement: 1 hex adjacent, 2 moves per turn.

### 6.2 Capos

| Property | Value |
|---|---|
| Movement range | Up to 5 hexes (flying) |
| Moves per turn | 3 |
| Territory rules | Not affected — always flies |
| Auto-claim | Claims neutral territory on arrival |
| Scout range | 2 hexes (vs soldiers' 1 hex) |

**Wound Mechanic**: Capos cannot die in regular combat. If "killed," they are wounded instead (-10 loyalty, -1 move penalty for 1 turn). Can only be permanently eliminated via hitman or planned hit.

### 6.3 Boss

Permanently at HQ. Never moves.

---

## 7. HQ Assault & Defense

### 7.1 Assault Requirements
- Attacking unit: **Soldier only** (not capo)
- Position: Must be on a hex **adjacent** to enemy HQ
- Stats: Toughness ≥ 4, Loyalty ≥ 70
- Base success: 15%, max cap: 50%

### 7.2 Defense Modifiers
- Built-in HQ defense: -30%
- Each friendly soldier at HQ: +5% defense (via Sitdown)
- Each flipped enemy soldier: -10% defense

### 7.3 Outcomes
- **Success**: Target family eliminated. All their units removed, all territory neutralized. Attacker gains $25,000, +30 respect, +40 fear.
- **Failure**: Attacking soldier killed. All participating units lose 30 loyalty. No police heat.

---

## 8. Boss Actions: Call a Sitdown

The Boss can recall soldiers to HQ for a strategic defensive consolidation.

| Property | Value |
|---|---|
| Cost | $2,000 |
| Cooldown | 5 turns |
| Selection | Choose "All Soldiers" or pick individuals |
| Effect | Selected soldiers teleported to HQ hex instantly |
| Defense bonus | +5% HQ assault defense per soldier at HQ |
| Loyalty bonus | +5 loyalty to all recalled soldiers |
| Tradeoff | Recalled soldiers lose fortification, cannot act again this turn |

HQ hex is exempt from the 2-unit stacking limit for Sitdown purposes.

---

## 9. Flip Soldier

Weaken enemy HQ defenses by compromising a rival soldier.

| Property | Value |
|---|---|
| Cost | $5,000 |
| Requirement | Unit adjacent to enemy HQ |
| Target | Enemy soldier at/near HQ with loyalty > 60 |
| Base success | 25% |
| On success | Target flipped (hidden). -10% HQ defense per flipped soldier. |
| On failure | -15 influence, target gains +10 loyalty, enemy notified |

---

## 10. HQ Information Panel

Click any headquarters to view:

- **Financial overview**: Gross income, itemized expenses (soldier maintenance, community upkeep, arrest penalties, heat penalties), and net profit — math is fully transparent
- **Unit status**: Soldiers and capos at HQ vs deployed
- **Business count**: Number of controlled businesses
- **Deploy actions**: Deploy buttons (player HQ only, deploy phase)
- **Sitdown button**: Available during action phase (player HQ only)
- **Purge Ranks**: List of flagged soldiers (Suspicious / Confirmed Rat) with Eliminate buttons. Also accessible from the left panel's Strategic Actions section. Costs 1 action point per elimination.
- **Active Threats**: Detected planned hits from scouting/bribes showing attacking family, target, turns remaining, and intel source (player HQ only)
- **Prosecution Risk**: Status bar showing current risk level with tooltip breakdown of contributing factors
- **Rival info**: Respect, influence, soldier count, money (rival HQs)

---

## 11. Visual Indicators

| Indicator | Color/Style | Meaning |
|---|---|---|
| Player HQ | Gold highlight | Your headquarters |
| Rival HQ | Brown highlight | Enemy headquarters |
| 🏛️ icon | Building icon | HQ hex |
| Sky blue hex | Available target | Deployment target |
| Light green hex | Available target | Movement target |
| "DEPLOY" label | On hex | Deployable location |

---

## 12. War System & HQ

During active wars:
- **AI forced aggression**: AI prioritizes attacking the warring family and recruits every turn
- **AI fortification**: AI fortifies HQ-adjacent hexes when at war
- **Income penalty**: Hexes adjacent to warring enemy territory suffer -20% income (capped -30%)
- **Diplomatic lockout**: No negotiations possible between warring families
- Wars last **10 turns**, after which tension resets to 30 and relationship drops -50

### 12.1 Boss Actions at HQ

In addition to **Call a Sitdown**, the Boss can perform **Purge Ranks** from the HQ panel during the Action phase — eliminating soldiers flagged as Suspicious or Confirmed Rat. See [GAME_MECHANICS.md — Counter-Intelligence & Purge Ranks](./GAME_MECHANICS.md#27-counter-intelligence--purge-ranks) for full details.

---

*See also: [GAME_MECHANICS.md](./GAME_MECHANICS.md) for the full game systems overview.*
