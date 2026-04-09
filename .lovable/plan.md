

# Tension-Based War System — Final Implementation Plan

## Overview
Add a tension meter between all family pairs (0-100). When tension reaches 80, war erupts for 10 turns. Includes diplomatic defusing, supply sabotage, hitman price increase, and critical bug fixes.

---

## 1. Hitman Changes
- **Price**: $15,000 → $30,000 (`HITMAN_CONTRACT_COST`)
- **Bug fix** (line 2746): `Math.random() < successRate` → `Math.random() * 100 < successRate` (currently hitmen succeed ~100% of the time since successRate is 90, not 0.9)
- **Anonymous**: Hitman kills add zero pair tension, only global tension (+5 soldier, +15 capo to ALL pairs)

## 2. Tension System

### New State
- `familyTensions: Record<string, number>` — keyed by sorted pair (e.g. `"bonanno-gambino"`), range 0-100
- `activeWars: WarState[]` — active wars with turn countdowns
- `tensionCooldowns: Record<string, number>` — 1-turn cooling periods after negotiation (Hole #3 fix)

### Tension Builders

| Action | Pair | Global |
|---|---|---|
| Territory Hit on rival hex | +10 | — |
| Plan Hit on rival soldier (success) | +15 | — |
| Plan Hit on rival capo (success) | **Instant war** | — |
| Extort rival territory | +8 | — |
| Claim neutral hex surrounded by 3+ rival hexes (encroachment) | +12 | — |
| Sabotage rival supply line (capture hex in active route) | +15 | — |
| Hitman kills rival soldier | 0 | +5 all pairs |
| Hitman kills rival capo | 0 | +15 all pairs |
| Break ceasefire/alliance | +30 | — |

### Tension Reducers

| Action | Reduction |
|---|---|
| Ceasefire (successful) | -25 |
| Alliance (successful) | -35 |
| Supply Deal (successful) | -15 |
| Share Profits (successful) | -10 |
| Safe Passage (successful) | -8 |
| Bribe for Territory (successful) | -5 |
| Natural decay per turn | -2 |

## 3. War Mechanics
- **Trigger**: Tension ≥ 80 OR successful Plan Hit on a capo
- **Duration**: 10 turns
- **Diplomatic lockout**: No negotiations possible between warring families; existing pacts voided
- **Forced aggression (AI)**: Override personality to max aggression, prioritize war target, recruit every turn
- **Economic warfare**: -20% income on hexes adjacent to warring enemy territory (capped at -30% per hex if multiple wars)
- **Max simultaneous wars**: 2 per family
- **Post-war**: Tension resets to 40, relationship to -80

## 4. Hole Fixes Included

### Hole #1: AI-vs-AI Tension
Track tension for ALL 10 family pairs (5 families). AI hits, extortions, and territory claims against other AI families also call `addTension()`. AI families can go to war with each other. Player gets notified when AI-vs-AI wars start.

### Hole #3: Ceasefire-Then-Attack Exploit (FIX)
After a successful negotiation reduces tension, impose a **1-turn cooling period** on that pair. During the cooling period, the acting player's hostile actions against that family do not increase tension. This prevents gaming the system by negotiating then immediately attacking. Stored in `tensionCooldowns` and decremented each turn.

### Hole #4: Supply Sabotage Detection
After any hex changes hands, run a check: was this hex part of any family's active BFS supply route? If the route is now broken (re-run BFS confirms no path), add +15 tension between the capturing family and the route-owning family. Piggybacks on existing supply route severance logic around line 2980.

### Hole #5: Encroachment Definition
"Claim inside rival cluster" (+12) applies only when claiming a **neutral** hex that has 3+ adjacent hexes owned by a single rival family. This is distinct from territory hits (which target enemy-owned hexes). Checked at claim time by counting neighbor ownership.

### Hole #6: AI Builds Tension
All AI actions that target another family (hits, extortion, territory claims, pact breaks) now call `addTension()` for the relevant pair. This makes tension bidirectional — AI aggression toward the player also raises tension toward war, and AI-vs-AI hostilities can cascade.

## 5. UI Changes (GameSidePanels)
- **Tension bars**: Per rival family in diplomacy/pacts section, color-coded (green <30, yellow 30-60, orange 60-79, red 80+)
- **"AT WAR" badge**: Red badge with turn countdown when war is active
- **Notifications**: War eruption (major alert), war end, AI-vs-AI war started

---

## Files Modified
- **`src/types/game-mechanics.ts`** — `HITMAN_CONTRACT_COST = 30000`, `WarState` interface, tension/war constants (`WAR_TENSION_THRESHOLD`, `WAR_DURATION`, `TENSION_DECAY_PER_TURN`, `TENSION_BUILDERS`, `TENSION_REDUCERS`, `WAR_INCOME_PENALTY`, `WAR_MAX_SIMULTANEOUS`, `ENCROACHMENT_NEIGHBOR_THRESHOLD`)
- **`src/hooks/useEnhancedMafiaGameState.ts`** — tension state + helpers, war lifecycle, hitman bug fix, supply sabotage detection, encroachment check, AI tension tracking, negotiation cooldown, war income penalty, AI war aggression override
- **`src/components/GameSidePanels.tsx`** — tension bars, war badges, notifications

