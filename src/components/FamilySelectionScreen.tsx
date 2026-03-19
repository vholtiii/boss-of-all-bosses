import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Crown, DollarSign, Shield, Swords, Users, Eye } from 'lucide-react';

type FamilyId = 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';

interface FamilyInfo {
  id: FamilyId;
  name: string;
  motto: string;
  description: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  traits: { label: string; icon: React.ReactNode; value: string }[];
  bonuses: string[];
  startingResources: {
    money: number;
    soldiers: number;
    influence: number;
    politicalPower: number;
    respect: number;
  };
}

const families: FamilyInfo[] = [
  {
    id: 'gambino',
    name: 'Gambino',
    motto: '"Keep your friends close, but your enemies closer."',
    description: 'The most powerful family. Masters of business and political connections. Strong starting economy but a target for rivals.',
    colorClass: 'text-families-gambino',
    bgClass: 'bg-families-gambino/10',
    borderClass: 'border-families-gambino',
    traits: [
      { label: 'Economy', icon: <DollarSign className="h-4 w-4" />, value: '★★★★★' },
      { label: 'Military', icon: <Swords className="h-4 w-4" />, value: '★★★☆☆' },
      { label: 'Influence', icon: <Crown className="h-4 w-4" />, value: '★★★★☆' },
    ],
    bonuses: ['+25% combat power', '+10% territory income', '+15% intimidation'],
    startingResources: { money: 60000, soldiers: 5, influence: 15, politicalPower: 40, respect: 30 },
  },
  {
    id: 'genovese',
    name: 'Genovese',
    motto: '"In this business, you either kill or get killed."',
    description: 'The most secretive family. Expert infiltrators with unmatched intelligence networks. Hard to pin down, hard to defeat.',
    colorClass: 'text-families-genovese',
    bgClass: 'bg-families-genovese/10',
    borderClass: 'border-families-genovese',
    traits: [
      { label: 'Economy', icon: <DollarSign className="h-4 w-4" />, value: '★★★☆☆' },
      { label: 'Military', icon: <Swords className="h-4 w-4" />, value: '★★★★☆' },
      { label: 'Stealth', icon: <Eye className="h-4 w-4" />, value: '★★★★★' },
    ],
    bonuses: ['+30% business income', '+20% laundering efficiency', '+25% business upgrade discount'],
    startingResources: { money: 45000, soldiers: 6, influence: 10, politicalPower: 25, respect: 20 },
  },
  {
    id: 'lucchese',
    name: 'Lucchese',
    motto: '"Money talks. Everything else walks."',
    description: 'The traders and smugglers. Control supply chains and laundering operations. Excellent at turning dirty money clean.',
    colorClass: 'text-families-lucchese',
    bgClass: 'bg-families-lucchese/10',
    borderClass: 'border-families-lucchese',
    traits: [
      { label: 'Economy', icon: <DollarSign className="h-4 w-4" />, value: '★★★★☆' },
      { label: 'Military', icon: <Swords className="h-4 w-4" />, value: '★★☆☆☆' },
      { label: 'Trade', icon: <Shield className="h-4 w-4" />, value: '★★★★★' },
    ],
    bonuses: ['+25% hit success rate', '+15% heat reduction', '+20% intelligence gathering'],
    startingResources: { money: 70000, soldiers: 4, influence: 12, politicalPower: 20, respect: 15 },
  },
  {
    id: 'bonanno',
    name: 'Bonanno',
    motto: '"Respect is earned, not given."',
    description: 'The old guard. Deeply loyal soldiers and impenetrable defenses. Hard to attack but slow to expand.',
    colorClass: 'text-families-bonanno',
    bgClass: 'bg-families-bonanno/10',
    borderClass: 'border-families-bonanno',
    traits: [
      { label: 'Economy', icon: <DollarSign className="h-4 w-4" />, value: '★★☆☆☆' },
      { label: 'Defense', icon: <Shield className="h-4 w-4" />, value: '★★★★★' },
      { label: 'Loyalty', icon: <Users className="h-4 w-4" />, value: '★★★★★' },
    ],
    bonuses: ['+20% extortion income', '+25% intimidation power', '+15% fear generation'],
    startingResources: { money: 40000, soldiers: 7, influence: 8, politicalPower: 15, respect: 35 },
  },
  {
    id: 'colombo',
    name: 'Colombo',
    motto: '"Strike fast. Strike hard. No mercy."',
    description: 'The wildcards. Aggressive and unpredictable. Strongest military force but burn through resources quickly.',
    colorClass: 'text-families-colombo',
    bgClass: 'bg-families-colombo/10',
    borderClass: 'border-families-colombo',
    traits: [
      { label: 'Attack', icon: <Swords className="h-4 w-4" />, value: '★★★★★' },
      { label: 'Economy', icon: <DollarSign className="h-4 w-4" />, value: '★★☆☆☆' },
      { label: 'Fear', icon: <Crown className="h-4 w-4" />, value: '★★★★☆' },
    ],
    bonuses: ['+30% combat power', 'Intimidation actions are free', 'Fear decays slower'],
    startingResources: { money: 35000, soldiers: 8, influence: 18, politicalPower: 10, respect: 25 },
  },
];

interface Props {
  onSelectFamily: (familyId: FamilyId, resources: FamilyInfo['startingResources']) => void;
}

const FamilySelectionScreen: React.FC<Props> = ({ onSelectFamily }) => {
  const [hoveredFamily, setHoveredFamily] = useState<FamilyId | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<FamilyId | null>(null);

  const activeFamily = families.find(f => f.id === (selectedFamily || hoveredFamily));

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-repeat pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      {/* Title */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center mb-10"
      >
        <h1 className="text-5xl md:text-7xl font-bold text-primary font-playfair tracking-wider">
          THE FIVE FAMILIES
        </h1>
        <p className="text-lg text-muted-foreground mt-3 font-source">
          New York, 1955 — Choose your destiny
        </p>
      </motion.div>

      {/* Family cards */}
      <div className="flex flex-wrap justify-center gap-4 max-w-6xl mb-8">
        {families.map((family, i) => (
          <motion.div
            key={family.id}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
            onMouseEnter={() => setHoveredFamily(family.id)}
            onMouseLeave={() => setHoveredFamily(null)}
            onClick={() => setSelectedFamily(family.id)}
            className={cn(
              'w-44 cursor-pointer rounded-xl border-2 p-4 transition-all duration-300',
              'bg-card hover:scale-105',
              selectedFamily === family.id
                ? `${family.borderClass} shadow-lg scale-105`
                : 'border-border hover:border-muted-foreground'
            )}
          >
            <div className={cn('text-xl font-bold font-playfair mb-1', family.colorClass)}>
              {family.name}
            </div>
            <div className="space-y-1.5 mt-3">
              {family.traits.map(trait => (
                <div key={trait.label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    {trait.icon}
                    {trait.label}
                  </span>
                  <span className="text-foreground tracking-tighter">{trait.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail panel */}
      <AnimatePresence mode="wait">
        {activeFamily && (
          <motion.div
            key={activeFamily.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'max-w-2xl w-full rounded-xl border-2 p-6',
              'bg-card',
              activeFamily.borderClass
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className={cn('text-2xl font-bold font-playfair', activeFamily.colorClass)}>
                  The {activeFamily.name} Family
                </h2>
                <p className="text-sm text-muted-foreground italic font-playfair mt-1">
                  {activeFamily.motto}
                </p>
              </div>
              {selectedFamily === activeFamily.id && (
                <Badge className="bg-primary text-primary-foreground">Selected</Badge>
              )}
            </div>

            <p className="text-sm text-foreground mb-4">{activeFamily.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Family Bonuses</h4>
                <ul className="space-y-1">
                  {activeFamily.bonuses.map(b => (
                    <li key={b} className="text-xs text-foreground flex items-center gap-1">
                      <span className={activeFamily.colorClass}>✦</span> {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Starting Resources</h4>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span className="text-muted-foreground">Money:</span>
                  <span className="text-foreground font-medium">${activeFamily.startingResources.money.toLocaleString()}</span>
                  <span className="text-muted-foreground">Soldiers:</span>
                  <span className="text-foreground font-medium">{activeFamily.startingResources.soldiers}</span>
                  <span className="text-muted-foreground">Influence:</span>
                  <span className="text-foreground font-medium">{activeFamily.startingResources.influence}</span>
                  <span className="text-muted-foreground">Political:</span>
                  <span className="text-foreground font-medium">{activeFamily.startingResources.politicalPower}</span>
                  <span className="text-muted-foreground">Respect:</span>
                  <span className="text-foreground font-medium">{activeFamily.startingResources.respect}%</span>
                </div>
              </div>
            </div>

            {selectedFamily === activeFamily.id && (
              <Button
                onClick={() => onSelectFamily(activeFamily.id, activeFamily.startingResources)}
                className="w-full bg-primary text-primary-foreground font-playfair font-bold text-lg py-6 hover:bg-primary/90"
              >
                BEGIN AS THE {activeFamily.name.toUpperCase()} FAMILY
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!activeFamily && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground text-sm"
        >
          Select a family to see their strengths and begin your rise to power.
        </motion.p>
      )}
    </div>
  );
};

export default FamilySelectionScreen;
