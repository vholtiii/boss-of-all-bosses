# 🏛️ Headquarters System Guide — Boss of All Bosses

## 📋 Table of Contents

- [1. Overview](#1-overview)
- [2. Headquarters Locations](#2-headquarters-locations)
- [3. Starting Units](#3-starting-units)
- [4. Headquarters Properties](#4-headquarters-properties)
- [5. Deployment System](#5-deployment-system)
  - [5.1 Deploy Phase](#51-deploy-phase)
  - [5.2 Deployment Ranges](#52-deployment-ranges)
  - [5.3 Safehouse as Secondary Deploy Point](#53-safehouse-as-secondary-deploy-point)
- [6. Unit Movement Rules](#6-unit-movement-rules)
  - [6.1 Soldiers](#61-soldiers)
  - [6.2 Capos](#62-capos)
  - [6.3 Boss](#63-boss)
- [7. HQ Information Panel](#7-hq-information-panel)
- [8. Visual Indicators](#8-visual-indicators)

---

## 1. Overview

Each of the five families has a headquarters on the hex map. The HQ is the starting location for all units, the permanent home of the Boss, and the primary deployment point for new recruits. Headquarters **cannot be captured or destroyed**.

---

## 2. Headquarters Locations

| Family | District | Quadrant | Coordinates (q,r,s) |
|---|---|---|---|
| **Gambino** | Little Italy | Northwest | (-5, 5, 0) |
| **Genovese** | Brooklyn Heights | Southeast | (5, -5, 0) |
| **Lucchese** | Queens | Southwest | (-5, -5, 10) |
| **Bonanno** | Staten Island | Northeast | (5, 5, -10) |
| **Colombo** | Manhattan | Center | (0, 0, 0) |

---

## 3. Starting Units

Every family begins with exactly:

| Unit Type | Count | Starting Location |
|---|---|---|
| Soldier | 3 | Headquarters |
| Capo | 1 | Headquarters |
| Boss | 1 | Headquarters (permanent) |

---

## 4. Headquarters Properties

- **Invulnerable**: Cannot be attacked, captured, or destroyed
- **Permanent control**: Always belongs to its family
- **Unit spawning**: All recruited units appear at HQ
- **Visual distinction**: Gold highlight for player HQ, brown for rivals
- **Icon**: 🏛️ building icon

---

## 5. Deployment System

### 5.1 Deploy Phase

1. Enter the **Deploy** phase at the start of your turn
2. Click your headquarters
3. Choose "Deploy Soldier" or "Deploy Capo"
4. Click an available hex (shown in sky blue)

### 5.2 Deployment Ranges

| Unit | Deploy Range |
|---|---|
| Soldier | Adjacent hexes only (1 hex) |
| Capo | Up to 5 hexes away (flying) |

### 5.3 Safehouse as Secondary Deploy Point

If a safehouse is active (established by a capo during the Tactical phase), units can also be deployed from the safehouse hex using the same range rules. Safehouses last 5 turns and are destroyed if the hex is captured by an enemy.

---

## 6. Unit Movement Rules

### 6.1 Soldiers

| Property | Value |
|---|---|
| Movement range | 1 hex (adjacent only) |
| Moves per turn | 2 |
| Can fly/jump | No |

### 6.2 Capos

| Property | Value |
|---|---|
| Movement range | Up to 5 hexes (flying) |
| Moves per turn | 3 |
| Can fly/jump | Yes — can move over occupied hexes |

### 6.3 Boss

| Property | Value |
|---|---|
| Movement | None — permanently at HQ |
| Purpose | Command and control, leadership |

---

## 7. HQ Information Panel

Click any headquarters to view:

- **Financial overview**: Legal profits, illegal profits, total profits
- **Unit status**: Soldiers and capos at HQ vs deployed
- **Business count**: Number of controlled businesses
- **Deploy actions**: Deploy buttons appear during Deploy phase (player HQ only)

Click rival HQs to view their family data (intel only, no deploy actions).

---

## 8. Visual Indicators

| Indicator | Color/Style | Meaning |
|---|---|---|
| Player HQ | Gold highlight | Your headquarters |
| Rival HQ | Brown highlight | Enemy headquarters |
| 🏛️ icon | Building icon | Distinguishes HQ from regular hexes |
| Sky blue hex | Available target | Deployment target during Deploy phase |
| Light green hex | Available target | Movement target during Tactical phase |
| "DEPLOY" label | On hex | Indicates deployable location |
| "MOVE" label | On hex | Indicates movable location |

---

*See also: [GAME_MECHANICS.md](./GAME_MECHANICS.md) for the full game systems overview.*
