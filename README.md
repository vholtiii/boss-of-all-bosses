# 🎮 Boss of All Bosses — Ultimate Mafia Strategy Game

A turn-based mafia strategy game built with React, TypeScript, and modern web technologies. Choose your crime family and build a criminal empire through territorial warfare, extortion, diplomacy, and business management on a hex grid map of New York City.

![Game Preview](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)
![React](https://img.shields.io/badge/React-18+-61dafb)
![Vite](https://img.shields.io/badge/Vite-5.0+-646cff)

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Game Overview](#-game-overview)
- [Core Systems](#-core-systems)
- [Documentation](#-documentation)
- [Technical Stack](#-technical-stack)
- [Project Structure](#-project-structure)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm, yarn, or bun

### Installation
```bash
git clone https://github.com/yourusername/boss-of-all-bosses.git
cd boss-of-all-bosses
npm install
npm run dev
```

Open `http://localhost:8080` and choose your family to start playing.

---

## 🎯 Game Overview

### The Five Families

| Family | Specialty | Key Bonuses | Starting Soldiers | HQ District |
|---|---|---|---|---|
| **Gambino** | Combat | +25% combat, +15% intimidation | 4 | Little Italy |
| **Genovese** | Business | +30% business income, +20% laundering | 4 | Manhattan |
| **Lucchese** | Intelligence | +25% hit success, +20% intel | 3 | Queens |
| **Bonanno** | Intimidation | +25% intimidation, +20% extortion | 2 | Staten Island |
| **Colombo** | Growth | +20% income, +15% recruit discount | 1 | Bronx |

### Map Sizes

Choose your battlefield at game start:

| Size | Radius | ~Hex Count | Feel |
|------|--------|-----------|------|
| 🗺️ Small | 7 | ~169 | Fast, aggressive — tight quarters |
| 🗺️ Medium | 10 | ~331 | Classic — balanced pacing |
| 🗺️ Large | 13 | ~547 | Epic — sprawling empire building |

Victory targets, AI recruitment caps, and economy values scale automatically with map size.

### Turn Structure

Each turn = 1 month. Four phases per turn:

```
Deploy → Tactical (Move) → Action → End Turn
```

- **2–3 action points** per turn (bonus at 50+ respect & influence)
- **3 tactical actions** per turn (separate budget)
- **Skip to Action**: Jump directly from Deploy or Tactical phase to Action phase

### Victory Conditions

| Path | Target |
|---|---|
| 🗺️ Territory Domination | **40 / 60 / 80 hexes** (Small / Medium / Large map) |
| 💰 Economic Empire | **$50,000+** monthly income |
| 👑 Legacy of Power | Beat highest rival rep by **25%** after **turn 15** |
| 💀 Total Domination | Eliminate **all 4 rival families** via HQ Assault |

---

## 🔧 Core Systems

### Hex Grid Map
- 169–547 hexes across 6 NYC districts depending on map size (Little Italy, Brooklyn, Queens, Manhattan, Bronx, Staten Island)
- Zoom, pan, and mobile touch controls
- Color-coded territory ownership

### Free Movement in Connected Territory
- Soldiers move **unlimited hexes for free** within territory connected to HQ via an unbroken chain of owned hexes
- Normal 1-hex movement applies when leaving connected territory or crossing gaps
- Capos still fly up to 5 hexes regardless

### Units & Personnel
- **Soldiers**: 1-hex movement (or free within connected territory), 2 moves/turn, $1,500 (mercenary) or $300 (local recruit, requires 10+ hexes). **Only deployed soldiers cost $600/turn maintenance — undeployed reserves are free.**
- **Capos**: 5-hex flying movement, 3 moves/turn, 100% territory income, negotiation abilities. Auto-claim neutral territory on arrival. **Wound mechanic**: immune to death in regular combat — wounded instead (-10 loyalty, -1 move for 1 turn). Can only be killed via hitman or planned hit. Scout at 2-hex range.
- **Boss**: Permanent HQ presence. Can call a Sitdown.
- **Hitmen**: External contract killers ($30,000), 40-90% success based on target location. Kills raise global tension (+5 soldier, +15 capo).

### Combat (Hit, Extort, Claim)
- **Hit**: Attack enemy territory. Success based on force ratio, modifiers, and luck (10–95% range). Territory set to neutral on success.
- **Extort**: Shakedown neutral (90%) or enemy (50%) hexes for money and territory. No casualties on failure.
- **Claim**: Peacefully take neutral territory (+1 respect, +1 influence)

### Intel & Threat Detection
- **Scouted hexes** and **active police bribes** can reveal enemy planned hits before they execute
- Detected threats appear in the HQ panel's "Active Threats" section with source intel and urgency indicators
- Notifications fire when new threats are discovered via street scouts or police contacts

### HQ Assault & Elimination
- **Assault HQ**: Soldiers with toughness ≥ 4 and loyalty ≥ 70, adjacent to enemy HQ, can attempt to destroy it (15% base, 50% max)
- **Flip Soldier**: Spend $5,000 to turn an enemy soldier at their HQ (25% base). Reduces HQ defense by 10% per flipped soldier.
- **On success**: Target family eliminated — all units removed, territory neutralized. +$25,000, +30 respect, +40 fear.

### Boss Action: Call a Sitdown
- Boss recalls all or selected soldiers to HQ instantly from anywhere on the map
- Cost: $2,000, cooldown: 5 turns
- Each soldier at HQ adds +5% to HQ assault defense
- Recalled soldiers gain +5 loyalty

### Tactical Actions
- **Scout**: Reveal hex intel, +15% hit bonus for 3 turns. Capos scout at 2-hex range.
- **Fortify**: +25% defense, 50% casualty reduction (persists until move). **Max 4 per family.** Hover tooltip shows age, status, bonuses, and crumble countdown.
- **Safehouse**: Capo creates secondary deploy point for 5 turns
- **Escort**: Capo transports up to 2 soldiers across any distance

### Negotiation & Diplomacy
- **Ceasefire**: Mutual non-aggression pact (3–5 turns), 50% base success
- **Bribe for Territory**: Pay to claim an enemy hex peacefully, 40% base success
- **Alliance**: Conditional pact with shared defense, 30% base success
- Capo personality affects success rates (Diplomat, Enforcer, Schemer)

### Economy & Businesses
Four business types: Brothel ($3K), Gambling Den ($4K), Loan Sharking ($5K), Store Front ($2K). Capos earn 100% income vs soldiers' 30%.

### Financial Display
- HQ panel shows **gross income** (pre-penalty) as the income header
- Expenses include soldier maintenance, community upkeep, arrest penalties, and heat penalties as transparent line items
- Math is fully transparent: **Gross Income − All Expenses = Net Profit**

### Soldier Maintenance
- **Deployed soldiers**: $600/turn per soldier
- **Undeployed reserves**: Free (no maintenance until deployed)
- $150/turn per empty claimed hex (community upkeep)
- Bankruptcy at -$50K triggers game over; soldiers desert at 1 per $10K debt

### Recruitment & Promotion
- **Mercenary soldiers**: $1,500 (available immediately)
- **Local recruits**: $300 (requires 10+ controlled hexes)
- **Capo promotion**: $10,000, requires victories ≥ 3, loyalty ≥ 60, training ≥ 2, toughness ≥ 3, racketeering ≥ 3
- Max 3 capos, max 3 hitman contracts ($30,000 each)

### Tension & War System
- **Tension meter** (0-100) tracked for all 10 family pairs, decays 2/turn
- **Tension builders**: Territory hit (+10), Plan Hit on soldier (+15), Extortion (+8), Encroachment (+12), Supply sabotage (+15), Breaking pact (+30)
- **Tension reducers**: Ceasefire (-25), Alliance (-35), Supply deal (-15), Share profits (-10), Safe passage (-8), Bribe for territory (-5)
- **War trigger**: Tension reaches **80** between two families, OR a successful **Plan Hit on a Capo** (instant war)
- **War duration**: 10 turns — diplomatic lockout, AI forced aggression, -20% income on border hexes (capped -30%)
- **Hitman global tension**: Soldier kill +5, Capo kill +15 (all pairs, anonymous — no pair tension)
- **Post-war**: Tension resets to 30, relationship drops -50, max 2 simultaneous wars per family

### Reputation & Police Heat
- Five reputation metrics: Respect, Reputation, Loyalty, Fear, Street Influence
- Respect scales extortion payouts (0.5x at 0 → 1.5x at 100) and recruitment discounts (up to 30%)
- Influence boosts extortion success (+15%) and bribe success (+12%)
- Police heat from combat/extortion, reducible via bribe tiers (Patrol Officer → Mayor)

### AI Personality Traits

AI families follow the same four-phase gates as the player, with five distinct personality-driven behavior profiles:

| Family | Trait | Behavior |
|---|---|---|
| **Gambino** | Diplomatic 🕊️ | Avoids combat, signals ceasefires/alliances early, never Plan Hits or HQ Assaults |
| **Genovese** | Aggressive ⚔️ | Frequent attacks, +1 recruit/batch, 2× Plan Hit chance, 15% HQ Assault chance |
| **Lucchese** | Opportunistic 🎯 | Prefers extortion, fights only when advantaged, signals ceasefire when losing |
| **Bonanno** | Defensive 🛡️ | Never initiates Plan Hits or HQ Assaults, fortifies proactively (40% chance) |
| **Colombo** | Unpredictable 🎲 | Randomly shifts between all behavior modes each turn for tactical variety |

### Difficulty Modes
- **Easy**: 1.5x player money, 0.7x AI aggression
- **Normal**: Standard balance
- **Hard**: 0.7x player money, 1.5x AI aggression, +20% AI income

---

## 📖 Documentation

| Guide | Description |
|---|---|
| **[GAME_MECHANICS.md](./GAME_MECHANICS.md)** | Complete mechanics reference with formulas and tables |
| **[COMBAT_SYSTEM_GUIDE.md](./COMBAT_SYSTEM_GUIDE.md)** | Hit, extort, claim, HQ assault — success formulas, casualties, modifiers |
| **[HEADQUARTERS_SYSTEM_GUIDE.md](./HEADQUARTERS_SYSTEM_GUIDE.md)** | HQ locations, deployment, Sitdown, HQ assault defense |
| **[SOLDIER_RECRUITMENT_GUIDE.md](./SOLDIER_RECRUITMENT_GUIDE.md)** | Recruitment costs, promotion paths, soldier stats |

---

## 🛠️ Technical Stack

### Frontend
- **React 18** with hooks and functional components
- **TypeScript** for full type safety
- **Vite** for fast builds and HMR
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for animations

### UI Components
- **Shadcn UI** + **Radix UI** for accessible components
- **Lucide React** for icons
- **Recharts** for data visualization

### State Management
- Custom hooks (`useEnhancedMafiaGameState`) for centralized game logic (~7,500+ lines)
- Local storage for save/load

---

## 📁 Project Structure

```
src/
├── components/              # React components
│   ├── ui/                  # Reusable UI components (shadcn)
│   ├── EnhancedMafiaHexGrid.tsx   # Main hex grid map
│   ├── GameSidePanels.tsx         # Left/right info panels
│   ├── HeadquartersInfoPanel.tsx  # HQ detail + Sitdown
│   ├── TurnSummaryModal.tsx       # End-of-turn report
│   └── ...
├── hooks/                   # Game logic hooks
│   ├── useEnhancedMafiaGameState.ts  # Core game state
│   ├── useSoundSystem.ts            # Audio
│   └── useGameSaveLoad.ts           # Save/load
├── systems/                 # Game subsystems
│   └── CombatSystem.ts              # Combat calculations
├── types/                   # TypeScript types
│   ├── game-mechanics.ts            # Core game types & constants
│   ├── enhanced-mechanics.ts        # Extended system types
│   ├── business.ts                  # Business types
│   └── reputation.ts               # Reputation types
├── pages/                   # Route components
└── lib/                     # Utilities
```

---

**Ready to become the Boss of All Bosses?** 🎯
