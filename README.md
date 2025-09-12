# 🎮 Boss of All Bosses - Ultimate Mafia Game

A sophisticated, feature-rich Mafia strategy game built with React, TypeScript, and modern web technologies. Take control of the Gambino crime family and build your criminal empire through strategic territory control, business management, and tactical decision-making.

![Game Preview](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)
![React](https://img.shields.io/badge/React-18+-61dafb)
![Vite](https://img.shields.io/badge/Vite-5.0+-646cff)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/boss-of-all-bosses.git
cd boss-of-all-bosses

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Play the Game
1. Open `http://localhost:8080` in your browser
2. Choose your family name and start building your empire
3. Deploy soldiers, take territories, and manage your criminal operations

## 🎯 Game Features

### 🗺️ **Interactive Hex Grid Map**
- **Zoom & Pan**: Smooth navigation with mouse wheel and drag
- **Territory Control**: Visual representation of family territories
- **Headquarters System**: Each family has headquarters on opposite quadrants
- **Unit Deployment**: Deploy soldiers and capos from headquarters
- **Real-time Updates**: Dynamic map changes as you expand
- **Mobile Responsive**: Touch-friendly controls for mobile devices

### ⚔️ **Strategic Territory System**
- **3-Step Takeover**: Deploy → Hit/Extort → Optimize
- **Risk vs Reward**: Neutral territories (90% success) vs Rival territories (20-80% success)
- **Income Optimization**: Capos (100% income) vs Soldiers (30% income)
- **Casualty System**: Realistic combat losses based on odds

### 👥 **Personnel Management**
- **Headquarters System**: Each family starts with 3 soldiers + 1 capo at headquarters
- **Unit Deployment**: Deploy units from headquarters using movement rules
- **Movement Mechanics**: Soldiers move to adjacent hexagons, capos can fly up to 5 hexagons
- **Boss System**: Boss stays at headquarters and never moves
- **AI Opponents**: 5 rival families with unique personalities and strategies
- **Recruitment**: Grow your army through strategic investments

### 💰 **Advanced Economy**
- **Multiple Income Streams**: Legal businesses, illegal operations, territory control
- **Investment System**: Stocks, real estate, and business ventures
- **Money Laundering**: Convert dirty money to clean funds
- **Economic Events**: Market booms, recessions, and police crackdowns

### 🎭 **Reputation & Heat System**
- **Multi-layered Reputation**: Respect, fear, loyalty, and street influence
- **Police Heat**: Dynamic law enforcement attention
- **Bribery System**: Corrupt officials to reduce heat
- **Public Relations**: Charitable donations and public appearances

### 🎲 **Dynamic Events & Missions**
- **Random Events**: Police raids, rival meetings, and opportunities
- **Story Missions**: Narrative-driven objectives
- **Seasonal Events**: Weather and seasonal effects on gameplay
- **Consequence System**: Actions have lasting effects

### 🔬 **Technology & Innovation**
- **Research System**: Unlock new technologies and abilities
- **Combat Upgrades**: Improve soldier effectiveness
- **Business Efficiency**: Enhance income generation
- **Intelligence Gathering**: Better information on rivals

### 💾 **Save & Load System**
- **Multiple Save Slots**: Save different game states
- **Auto-save**: Automatic progress saving
- **Export/Import**: Share saves between devices
- **Version Control**: Backward compatibility with older saves

### 🎵 **Audio & Visual**
- **Sound Effects**: Immersive audio feedback for all actions
- **Smooth Animations**: Framer Motion powered transitions
- **Modern UI**: Clean, intuitive interface with Shadcn UI
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🛠️ Technical Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Full type safety and better development experience
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions

### UI Components
- **Shadcn UI** - High-quality, accessible component library
- **Radix UI** - Unstyled, accessible UI primitives
- **Lucide React** - Beautiful, customizable icons

### State Management
- **Custom Hooks** - Centralized game state management
- **React Context** - Global state sharing
- **Local Storage** - Persistent game saves

### Development Tools
- **ESLint** - Code linting and quality assurance
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── EnhancedMafiaHexGrid.tsx    # Main game map
│   ├── BusinessManagement.tsx      # Business operations
│   ├── CombatInterface.tsx         # Combat system
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useEnhancedMafiaGameState.ts  # Main game logic
│   ├── useSoundSystem.ts            # Audio management
│   └── useGameSaveLoad.ts           # Save/load system
├── systems/            # Game systems
│   ├── CombatSystem.ts             # Combat mechanics
│   └── SoldierRecruitmentSystem.ts # Personnel management
├── types/              # TypeScript type definitions
├── pages/              # Route components
└── lib/                # Utility functions
```

## 🎮 Game Mechanics

For detailed information about game mechanics, strategies, and systems, see:
- **[GAME_MECHANICS.md](./GAME_MECHANICS.md)** - Comprehensive game mechanics guide
- **[HEADQUARTERS_SYSTEM_GUIDE.md](./HEADQUARTERS_SYSTEM_GUIDE.md)** - Headquarters and unit deployment guide
- **[COMBAT_SYSTEM_GUIDE.md](./COMBAT_SYSTEM_GUIDE.md)** - Combat system documentation
- **[SOLDIER_RECRUITMENT_GUIDE.md](./SOLDIER_RECRUITMENT_GUIDE.md)** - Personnel management guide

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Shadcn UI** for the beautiful component library
- **Framer Motion** for smooth animations
- **Lucide** for the icon set
- **React Community** for the amazing ecosystem

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/yourusername/boss-of-all-bosses/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

**Ready to become the Boss of All Bosses?** 🎯

Start your criminal empire today and prove you have what it takes to rule the underworld!