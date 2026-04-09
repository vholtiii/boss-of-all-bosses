# 🗡️ Combat System Guide — Boss of All Bosses

## 📋 Table of Contents

- [1. Overview](#1-overview)
- [2. Hit (Attack Enemy Territory)](#2-hit-attack-enemy-territory)
- [3. Extort](#3-extort)
- [4. Claim Territory](#4-claim-territory)
- [5. Combat Modifiers](#5-combat-modifiers)
- [6. Casualty System](#6-casualty-system)
- [7. HQ Assault](#7-hq-assault)
- [8. Flip Soldier](#8-flip-soldier)
- [9. Victory Conditions](#9-victory-conditions)

---

## 1. Overview

Combat in Boss of All Bosses is resolved through three primary actions during the **Action Phase**: **Hit**, **Extort**, and **Claim**. Each consumes 1 action point (2–3 per turn). Additionally, **HQ Assault** and **Flip Soldier** are endgame combat actions.

Players can **skip directly to the Action phase** from Deploy or Tactical using the "Skip to Action" button.

---

## 2. Hit (Attack Enemy Territory)

The primary offensive action. Attacks an enemy-controlled hex to clear it (territory becomes neutral — must Claim next turn).

**Scouted vs Unscouted (Blind) Hits:**

| | Scouted Hit | Blind Hit (Unscouted) |
|---|---|---|
| Civilian risk | None | Yes — if no enemies on hex |
| Success penalty | None | −20% to hit chance |
| Victory respect | +5 | +15 |
| Victory fear | +5 | +15 |
| Soldier stat boost | Normal (+1 each) | Maxed (toughness, loyalty, victories) |
| Bounty placed | No | Yes — targeted family attacks you for 3 turns |
| Target family penalty | None | −10 influence |

### 2.1 Civilian Hit (Blind Hit Only)

If you hit an unscouted hex with no enemy units:

| Penalty | Value |
|---|---|
| Police heat | Set to **100 (maximum)** |
| Attacking soldier | Removed, enters hiding for **3 turns** |
| Return check | Loyalty ≥ 70: returns. < 70: permanently eliminated |

### 2.2 Who Participates

- The **selected unit** (must be adjacent to or on the target hex)
- Any **player units already on the target hex**
- Player units on **adjacent hexes** (90% effectiveness)
- All **enemy units** on the target hex defend

### 2.3 Success Chance Formula

```
chance = 50% + (attackers - defenders) × 15%
       + family combat bonus (e.g., Gambino +25%)
       + family hit success bonus (e.g., Lucchese +25%)
       + scout bonus (+15% if scouted, +7% if stale)
       + fortified attacker bonus (+12.5%)
       - fortified defender penalty (-25%)
       - blind hit penalty (-20% if unscouted)
       + planned hit bonus (+20% if planned)

Clamped: 10%–95%
```

### 2.4 Victory Outcome

| Effect | Value |
|---|---|
| Territory | Set to **neutral** (must Claim next turn) |
| Enemy units on hex | Removed |
| Respect gained | +5 |
| Fear gained | +5 |
| Attacker casualties | 20% of attackers (random, min 0) |
| Fortified casualty reduction | 50% fewer casualties |

### 2.5 Defeat Outcome

| Effect | Value |
|---|---|
| Territory | Unchanged |
| Attacker casualties | 40% of attackers (random, min 1) |
| Fortified casualty reduction | 50% fewer |

### 2.6 Police Heat from Hits

```
heatGain = min(25, 8 + totalUnitsInvolved × 2)
```

### 2.7 Diplomacy Interactions

| Situation | Penalty |
|---|---|
| Attack allied family | Alliance broken, −25 respect, −15 reputation, −40 relationship |
| Break ceasefire | Ceasefire voided, −15 respect |

---

## 3. Extort

### 3.1 Neutral vs Enemy

| | Neutral | Enemy |
|---|---|---|
| Base success | 90% | 50% |
| On success | Claims territory + money | Steals income only |
| Money | $3,000 × respect multiplier | Business income × respect multiplier |
| Respect | +5 | +3 |

**Respect payout multiplier**: 0.5 + (respect / 100). Range: 0.5x–1.5x.

### 3.2 Success Modifiers

```
+ family extortion bonus (e.g., Bonanno +20%)
- heat / 1000 (up to -10%)
+ (influence / 100) × 15% (up to +15%)
× 0.8 if Manhattan (20% harder)
Max: 99%
```

### 3.3 Failure Outcome

**No casualties.** Reputational blow only:
- −3 respect, −2 fear, +5 extra heat

### 3.4 Heat from Extortion

| Target | Base Heat | Failed Bonus |
|---|---|---|
| Neutral | +8 | +5 |
| Enemy | +12 | +5 |

---

## 4. Claim Territory

Neutral hexes only. Automatic success.

| Property | Value |
|---|---|
| Requires | ≥1 player soldier on or adjacent to hex |
| Reward | +1 respect, +1 influence |
| Casualties / Heat | None |

---

## 5. Combat Modifiers

### 5.1 Fortification
- Defense: +25%. Attack: +12.5%. Casualty reduction: 50%. Persists until move. Hidden from enemies. **Max 4 per family.**

### 5.2 Scouting
- +15% hit success (fresh, within 1 turn). +7% (stale, turns 2-3). Duration: 3 turns.
- **Capos scout at 2-hex range** vs soldiers' 1-hex range.
- Scouted hexes can reveal enemy planned hits — see [Intel & Threat Detection](./GAME_MECHANICS.md#20-intel--threat-detection).

### 5.3 Hitman Contracts
- External killers, NOT in regular combat. **$30,000**. 40-90% success. No heat. Kills raise global tension (+5 soldier, +15 capo).

### 5.4 Family Bonuses
- Gambino: +25% combat. Lucchese: +25% hit success. Bonanno: +20% extortion.

---

## 6. Casualty System

- Random selection from participant pool
- Hit victory: 20% of attackers (min 0)
- Hit defeat: 40% of attackers (min 1)
- Fortified: 50% fewer casualties
- **Extortion failures: NO casualties**
- **Claim: NO casualties**
- **Capos cannot die in regular combat** — they are wounded instead (-10 loyalty, -1 move for 1 turn). Capos can only be permanently killed via hitman contract or planned hit.

---

## 7. HQ Assault

The endgame elimination mechanic. Destroy an enemy headquarters to remove that family from the game.

| Property | Value |
|---|---|
| Who | Soldiers only (not capos) |
| Position | Must be **adjacent** to enemy HQ (not on it) |
| Requirements | Toughness ≥ 4, Loyalty ≥ 70 |
| Base success | 15% |
| Max chance | 50% |
| HQ defense penalty | -30% |
| Friendly adjacent bonus | +5% per friendly unit adjacent to HQ |
| Flipped soldier bonus | +10% per flipped enemy soldier at HQ |
| Family combat bonus | Applies |

**On Success:**
- Target family **eliminated** — all units removed, all territory set to neutral
- +$25,000, +30 respect, +40 fear

**On Failure:**
- Attacking soldier **killed**
- All participating units lose 30 loyalty
- **No police heat penalty**

**Cannot**: Scout, claim, or extort HQ hexes.

---

## 8. Flip Soldier

Weaken enemy HQ defenses by turning a rival soldier.

| Property | Value |
|---|---|
| Cost | $5,000 |
| Position | Must have unit adjacent to enemy HQ |
| Target | Enemy soldier at/near HQ with loyalty > 60 |
| Base success | 25% |
| Modifiers | +10% if target loyalty 60-70, +5% per influence above 50, +schemer capo bonus |

**On Success:** Target marked as flipped (hidden from enemy). Reduces HQ defense by 10%.
**On Failure:** Scheming family loses **15 influence**. Target soldier gains +10 loyalty. Enemy notified.

---

## 9. Victory Conditions

| Path | Small Map | Medium Map | Large Map |
|---|---|---|---|
| Territory Domination | 40 hexes | 60 hexes | 80 hexes |
| Economic Empire | $50,000/month | $50,000/month | $50,000/month |
| Legacy of Power | Beat rival by 25% after turn 15 | Same | Same |
| **Total Domination** | **Eliminate all 4 rival families via HQ Assault** | Same | Same |

---

## 10. Tension & War in Combat

### 10.1 Combat Actions That Raise Tension

| Action | Pair Tension | Global Tension |
|---|---|---|
| Territory hit (success or fail) | +10 | — |
| Extortion (enemy hex) | +8 | — |
| Plan Hit on soldier (success) | +15 | — |
| **Plan Hit on capo (success)** | **Instant war** | — |
| Hitman kills soldier | — | +5 all pairs |
| Hitman kills capo | — | +15 all pairs |

### 10.2 War Combat Modifiers

During an active war (10 turns):
- **Diplomatic lockout**: No negotiations between warring families
- **AI forced aggression**: AI prioritizes attacking war opponent and recruits every turn
- **Income penalty**: -20% on hexes adjacent to warring enemy territory (capped -30%)

### 10.3 Strategic Implications

- Hitman assassinations are **anonymous** — they raise global tension but don't directly trigger war between specific families
- A successful Plan Hit on a Capo is the only combat action that triggers **instant war** regardless of tension level
- Wars last 10 turns then resolve: tension resets to 30, relationship -50

---

*See also: [GAME_MECHANICS.md](./GAME_MECHANICS.md) for full game systems overview.*
