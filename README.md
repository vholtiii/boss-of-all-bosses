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
  - [The Five Families](#the-five-families)
  - [Turn Structure](#turn-structure)
  - [Victory Conditions](#victory-conditions)
- [Core Systems](#-core-systems)
  - [Hex Grid Map](#hex-grid-map)
  - [Units & Personnel](#units--personnel)
  - [Combat (Hit, Extort, Claim)](#combat-hit-extort-claim)
  - [Tactical Actions](#tactical-actions)
  - [Negotiation & Diplomacy](#negotiation--diplomacy)
  - [Economy & Businesses](#economy--businesses)
  - [Reputation & Police Heat](#reputation--police-heat)
  - [Recruitment & Promotion](#recruitment--promotion)
- [Documentation](#-documentation)
- [Technical Stack](#-technical-stack)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

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

| Family | Specialty | Key Bonuses |
|---|---|---|
| **Gambino** | Combat | +25% combat, +15% intimidation |
| **Genovese** | Business | +30% business income, +20% laundering |
| **Lucchese** | Intelligence | +25% hit success, +20% intel |
| **Bonanno** | Intimidation | +25% intimidation, +20% extortion |
| **Colombo** | Growth | +20% income, +15% recruit discount |

### Turn Structure

Each turn = 1 month. Four phases per turn:

```
Deploy → Tactical (Move/Scout/Fortify) → Action (Hit/Extort/Claim/Negotiate) → End Turn
```

- **2–3 action points** per turn (bonus at 50+ respect & influence)
- **3 tactical actions** per turn (separate budget)

### Victory Conditions

| Path | Target |
|---|---|
| 🗺️ Territory Domination | Control **60 hexes** (~18% of map) |
| 💰 Economic Empire | **$50,000+** monthly income |
| 👑 Legacy of Power | Beat highest rival rep by **25%** after **turn 15** |

---

## 🔧 Core Systems

### Hex Grid Map
- ~331 hexes across 6 NYC districts (Little Italy, Brooklyn, Queens, Manhattan, Bronx, Staten Island)
- Zoom, pan, and mobile touch controls
- Color-coded territory ownership

### Units & Personnel
- **Soldiers**: 1-hex movement, 2 moves/turn, $500 to recruit
- **Capos**: 5-hex flying movement, 3 moves/turn, 100% territory income, negotiation abilities
- **Boss**: Permanent HQ presence
- **Hitmen**: +30–50% hit success bonus, elite combat specialists

### Combat (Hit, Extort, Claim)
- **Hit**: Attack enemy territory. Success based on force ratio, modifiers, and luck (10–95% range)
- **Extort**: Shakedown neutral (90%) or enemy (50%) hexes for money and territory. No casualties on failure — only reputation/heat penalties
- **Claim**: Peacefully take neutral territory (+1 respect, +1 influence)

### Tactical Actions
- **Scout**: Reveal hex intel, +15% hit bonus for 3 turns
- **Fortify**: +25% defense, 50% casualty reduction (persists until move)
- **Safehouse**: Capo creates secondary deploy point for 5 turns
- **Escort**: Capo transports up to 2 soldiers across any distance

### Negotiation & Diplomacy
- **Ceasefire**: Mutual non-aggression pact (3–5 turns)
- **Bribe for Territory**: Pay to claim an enemy hex peacefully
- **Alliance**: Conditional pact with shared defense; breaking has severe penalties

### Economy & Businesses
Four business types: Brothel ($3K), Gambling Den ($4K), Loan Sharking ($5K), Store Front ($2K). Capos earn 100% income vs soldiers' 30%.

### Reputation & Police Heat
- Five reputation metrics: Respect, Reputation, Loyalty, Fear, Street Influence
- Police heat from combat/extortion, reducible via bribe tiers (Patrol Officer → Mayor)

### Recruitment & Promotion
- Soldiers → Capos ($10K, 5 conflicts, 60 loyalty, 3 training)
- Soldiers → Hitmen (training 8+, loyalty 50+, 3+ hits)
- Max 3 capos, max 3 hitmen

---

## 📖 Documentation

Detailed guides for each game system:

| Guide | Description |
|---|---|
| **[GAME_MECHANICS.md](./GAME_MECHANICS.md)** | Complete mechanics reference with formulas and tables |
| **[COMBAT_SYSTEM_GUIDE.md](./COMBAT_SYSTEM_GUIDE.md)** | Hit, extort, claim — success formulas, casualties, modifiers |
| **[HEADQUARTERS_SYSTEM_GUIDE.md](./HEADQUARTERS_SYSTEM_GUIDE.md)** | HQ locations, deployment, unit movement rules |
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
- Custom hooks (`useEnhancedMafiaGameState`) for centralized game logic
- Local storage for save/load

---

## 📁 Project Structure

```
src/
├── components/              # React components
│   ├── ui/                  # Reusable UI components (shadcn)
│   ├── EnhancedMafiaHexGrid.tsx   # Main hex grid map
│   ├── CombatInterface.tsx        # Combat UI
│   ├── BusinessManagement.tsx     # Business panel
│   ├── TurnSummaryModal.tsx       # End-of-turn report
│   └── ...
├── hooks/                   # Game logic hooks
│   ├── useEnhancedMafiaGameState.ts  # Core game state (~2800 lines)
│   ├── useSoundSystem.ts            # Audio
│   └── useGameSaveLoad.ts           # Save/load
├── systems/                 # Game subsystems
│   ├── CombatSystem.ts              # Combat calculations
│   └── SoldierRecruitmentSystem.ts  # Recruitment logic
├── types/                   # TypeScript types
│   ├── game-mechanics.ts            # Core game types & constants
│   ├── enhanced-mechanics.ts        # Extended system types
│   ├── business.ts                  # Business types
│   └── reputation.ts               # Reputation types
├── pages/                   # Route components
└── lib/                     # Utilities
```

---

## 🚀 Deployment

```bash
# Production build
npm run build

# Deploy to Vercel
npx vercel --prod

# Deploy to Netlify
npm run build
# Upload dist/ to Netlify
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push and open a Pull Request

---

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

---

**Ready to become the Boss of All Bosses?** 🎯
