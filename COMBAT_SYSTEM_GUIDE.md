# 🗡️ Combat System Guide — Boss of All Bosses

## 📋 Table of Contents

- [1. Overview](#1-overview)
- [2. Hit (Attack Enemy Territory)](#2-hit-attack-enemy-territory)
  - [2.1 Who Participates](#21-who-participates)
  - [2.2 Success Chance Formula](#22-success-chance-formula)
  - [2.3 Victory Outcome](#23-victory-outcome)
  - [2.4 Defeat Outcome](#24-defeat-outcome)
  - [2.5 Police Heat from Hits](#25-police-heat-from-hits)
  - [2.6 Diplomacy Interactions](#26-diplomacy-interactions)
- [3. Extort](#3-extort)
  - [3.1 Neutral vs Enemy Extortion](#31-neutral-vs-enemy-extortion)
  - [3.2 Success Chance Formula](#32-success-chance-formula)
  - [3.3 Success Outcome](#33-success-outcome)
  - [3.4 Failure Outcome](#34-failure-outcome)
  - [3.5 Police Heat from Extortion](#35-police-heat-from-extortion)
- [4. Claim Territory](#4-claim-territory)
- [5. Combat Modifiers](#5-combat-modifiers)
  - [5.1 Fortification](#51-fortification)
  - [5.2 Scouting](#52-scouting)
  - [5.3 Hitmen](#53-hitmen)
  - [5.4 Family Bonuses](#54-family-bonuses)
- [6. Casualty System](#6-casualty-system)
- [7. Victory Conditions](#7-victory-conditions)

---

## 1. Overview

Combat in Boss of All Bosses is resolved through three distinct actions available during the **Action Phase**: **Hit**, **Extort**, and **Claim**. Each consumes 1 action point from your turn budget (2–3 per turn).

---

## 2. Hit (Attack Enemy Territory)

The primary offensive action. Attacks an enemy-controlled hex to clear it (territory becomes neutral — must Claim next turn).

**Scouted vs Unscouted (Blind) Hits** determine risk/reward:

| | Scouted Hit | Blind Hit (Unscouted) |
|---|---|---|
| Civilian risk | None | Yes — if no enemies on hex |
| Success penalty | None | −20% to hit chance |
| Victory respect | +5 | +15 |
| Victory fear | +5 | +15 |
| Soldier stat boost | Normal (+1 each) | Maxed (toughness, loyalty, victories) |
| Street cred event | No | Yes — all rivals gain fear |
| Bounty placed | No | Yes — targeted family attacks you for 3 turns |
| Target family penalty | None | −10 influence |

### 2.0 Civilian Hit (Blind Hit Only)

If you hit an **unscouted hex with no enemy units**, your soldier struck a civilian:

| Penalty | Value |
|---|---|
| Police heat | Set to **100 (maximum)** |
| Attacking soldier | Removed from board, enters **hiding for 3 turns** |
| Soldier return | Reappears at HQ after hiding duration |
| Respect/fear gained | None |

### 2.1 Who Participates

- The **selected unit** (initiator, typically adjacent to target)
- Any **player units already on the target hex**
- Enemy units on the target hex defend

### 2.2 Success Chance Formula

```
chance = 50% + (attackers - defenders) × 15%
       + family combat bonus (e.g., Gambino +25%)
       + hitman bonus per hitman (+30% + 10% per level above 1)
       + family hit success bonus (e.g., Lucchese +25%)
       + scout bonus (+15% if hex scouted)
       + fortified attacker bonus (+12.5%)
       - fortified defender penalty (-25%)

Clamped to range: 10% – 95%
```

**Example:**
- 2 attackers vs 1 defender: 50% + (1 × 15%) = 65%
- With Gambino bonus: 65% + 25% = 90%
- With 1 fortified defender: 90% - 25% = 65%

### 2.3 Victory Outcome

| Effect | Value |
|---|---|
| Territory captured | ❌ (set to neutral; must Claim next turn) |
| Enemy units on hex | Removed |
| Respect gained | +5 |
| Fear gained | +5 |
| Attacker casualties | 20% of attackers (random, min 0) |
| Fortified casualty reduction | 50% fewer casualties |

Surviving attackers gain +1 "survived conflicts" stat.

### 2.4 Defeat Outcome

| Effect | Value |
|---|---|
| Territory captured | ❌ |
| Attacker casualties | 40% of attackers (random, min 1) |
| Fortified casualty reduction | 50% fewer casualties |

Surviving units gain +1 "survived conflicts" stat.

### 2.5 Police Heat from Hits

```
heatGain = min(25, 8 + totalUnitsInvolved × 2)
```

Heat scales with battle size. A 2v1 fight generates 14 heat; a 5v3 fight generates 24 heat.

### 2.6 Diplomacy Interactions

| Situation | Penalty |
|---|---|
| Attack an allied family | Alliance broken, −25 respect, −15 reputation, −40 relationship |
| Break a ceasefire | Ceasefire voided, −15 respect |

Both penalties apply if both are active. The attack still proceeds after penalties.

---

## 3. Extort

A shakedown operation. Works on **neutral** and **enemy** hexes.

### 3.1 Neutral vs Enemy Extortion

| | Neutral | Enemy |
|---|---|---|
| Base success | 90% | 50% |
| On success | Claims territory + money | Steals income only (no territory change) |
| Base money | $3,000 | Business income or $2,000 |
| Respect gained | +5 | +3 |

### 3.2 Success Chance Formula

```
chance = base (90% or 50%)
       + family extortion bonus (e.g., Bonanno +20%)
       - heat / 1000 (up to −10% at max heat)
       + (influence / 100) × 15% (up to +15%)
       × 0.8 if Manhattan (20% harder)

Max: 99%
```

**Participants**: Player units on the target hex + player units on adjacent hexes.

### 3.3 Success Outcome

- Neutral: territory claimed to player
- Money gained = base × respect multiplier (0.5 + respect/100)
- Respect gained (+5 neutral, +3 enemy)
- All participating units get +1 extortion stat

### 3.4 Failure Outcome

**No casualties.** Failed extortion is a reputational blow, not a firefight.

| Penalty | Value |
|---|---|
| Respect lost | −3 |
| Fear lost | −2 |
| Extra police heat | +5 (on top of base) |

### 3.5 Police Heat from Extortion

| Target | Base Heat | Failed Bonus |
|---|---|---|
| Neutral | +8 | +5 |
| Enemy | +12 | +5 |

---

## 4. Claim Territory

The peaceful way to expand. **Neutral hexes only.**

| Property | Value |
|---|---|
| Combat roll | None — automatic success |
| Requires | ≥1 player soldier on or adjacent to the hex |
| Reward | +1 respect, +1 influence |
| Casualties | None |
| Heat | None |

---

## 5. Combat Modifiers

### 5.1 Fortification

| Modifier | Value |
|---|---|
| Defense bonus | +25% for defenders |
| Attack bonus | +12.5% for attackers (half value) |
| Casualty reduction | 50% fewer casualties |
| Duration | Persists until the unit moves |
| Visibility | Hidden from enemies |

### 5.2 Scouting

| Modifier | Value |
|---|---|
| Hit success bonus | +15% on scouted hexes |
| Duration | 3 turns after scouting |
| Intel revealed | Enemy count, family, business details |

### 5.3 Hitmen

| Level | Hit Bonus |
|---|---|
| Level 1 | +30% |
| Level 2 | +40% |
| Level 3 | +50% |

Multiple hitmen stack their bonuses.

### 5.4 Family Bonuses

| Family | Combat Modifier |
|---|---|
| Gambino | +25% combat bonus |
| Lucchese | +25% hit success |
| Bonanno | +20% extortion |
| Others | See family bonus table |

---

## 6. Casualty System

- Casualties are selected **randomly** from the participant pool (shuffled before removal)
- On hit victory: 20% of attackers (min 0)
- On hit defeat: 40% of attackers (min 1)
- Fortified units reduce casualties by 50%
- **Extortion failures cause NO casualties** — only reputation and heat penalties
- **Claim territory causes NO casualties**

---

## 7. Victory Conditions

| Path | Target | Details |
|---|---|---|
| Territory Domination | 60 hexes | ~18% of the map |
| Economic Empire | $50,000/month | Requires capos on high-value businesses |
| Legacy of Power | Beat rivals by 25% after turn 15 | Player rep vs rival score: (territory×3 + soldiers×2 + money/500) |

---

*See also: [GAME_MECHANICS.md](./GAME_MECHANICS.md) for full game systems overview.*
