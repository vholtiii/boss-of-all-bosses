import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  color: string; // hex for inline styles
  traits: { label: string; icon: React.ReactNode; value: number }[];
  bonuses: string[];
  difficulty: string;
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
    description: 'The most powerful family in New York. Masters of business and political connections with a strong starting economy — but that power makes you a target.',
    color: '#42D3F2',
    difficulty: 'Medium',
    traits: [
      { label: 'Economy', icon: <DollarSign className="h-3.5 w-3.5" />, value: 5 },
      { label: 'Military', icon: <Swords className="h-3.5 w-3.5" />, value: 3 },
      { label: 'Influence', icon: <Crown className="h-3.5 w-3.5" />, value: 4 },
    ],
    bonuses: ['+25% combat power', '+10% territory income', '+15% intimidation'],
    startingResources: { money: 60000, soldiers: 5, influence: 15, politicalPower: 40, respect: 30 },
  },
  {
    id: 'genovese',
    name: 'Genovese',
    motto: '"In this business, you either kill or get killed."',
    description: 'The most secretive family. Expert infiltrators with unmatched intelligence networks. Hard to pin down and harder to defeat.',
    color: '#2AA63E',
    difficulty: 'Hard',
    traits: [
      { label: 'Economy', icon: <DollarSign className="h-3.5 w-3.5" />, value: 3 },
      { label: 'Military', icon: <Swords className="h-3.5 w-3.5" />, value: 4 },
      { label: 'Stealth', icon: <Eye className="h-3.5 w-3.5" />, value: 5 },
    ],
    bonuses: ['+30% business income', '+20% laundering efficiency', '+25% business upgrade discount'],
    startingResources: { money: 45000, soldiers: 6, influence: 10, politicalPower: 25, respect: 20 },
  },
  {
    id: 'lucchese',
    name: 'Lucchese',
    motto: '"Money talks. Everything else walks."',
    description: 'The traders and smugglers. Control the supply chains and laundering operations. Excellent at turning dirty money clean.',
    color: '#4169E1',
    difficulty: 'Easy',
    traits: [
      { label: 'Economy', icon: <DollarSign className="h-3.5 w-3.5" />, value: 4 },
      { label: 'Military', icon: <Swords className="h-3.5 w-3.5" />, value: 2 },
      { label: 'Trade', icon: <Shield className="h-3.5 w-3.5" />, value: 5 },
    ],
    bonuses: ['+25% hit success rate', '+15% heat reduction', '+20% intelligence gathering'],
    startingResources: { money: 70000, soldiers: 4, influence: 12, politicalPower: 20, respect: 15 },
  },
  {
    id: 'bonanno',
    name: 'Bonanno',
    motto: '"Respect is earned, not given."',
    description: 'The old guard. Deeply loyal soldiers and impenetrable defenses. Hard to attack but slow to expand your territory.',
    color: '#DC143C',
    difficulty: 'Medium',
    traits: [
      { label: 'Economy', icon: <DollarSign className="h-3.5 w-3.5" />, value: 2 },
      { label: 'Defense', icon: <Shield className="h-3.5 w-3.5" />, value: 5 },
      { label: 'Loyalty', icon: <Users className="h-3.5 w-3.5" />, value: 5 },
    ],
    bonuses: ['+20% extortion income', '+25% intimidation power', '+15% fear generation'],
    startingResources: { money: 40000, soldiers: 7, influence: 8, politicalPower: 15, respect: 35 },
  },
  {
    id: 'colombo',
    name: 'Colombo',
    motto: '"Strike fast. Strike hard. No mercy."',
    description: 'The wildcards. Aggressive and unpredictable with the strongest military force — but you burn through resources quickly.',
    color: '#8A2BE2',
    difficulty: 'Hard',
    traits: [
      { label: 'Attack', icon: <Swords className="h-3.5 w-3.5" />, value: 5 },
      { label: 'Economy', icon: <DollarSign className="h-3.5 w-3.5" />, value: 2 },
      { label: 'Fear', icon: <Crown className="h-3.5 w-3.5" />, value: 4 },
    ],
    bonuses: ['+20% all income', '-15% recruitment cost', '+10% reputation gain'],
    startingResources: { money: 35000, soldiers: 8, influence: 18, politicalPower: 10, respect: 25 },
  },
];

const StatBar: React.FC<{ value: number; color: string }> = ({ value, color }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <div
        key={i}
        className="h-2 w-4 rounded-sm transition-all duration-300"
        style={{
          backgroundColor: i <= value ? color : 'hsl(var(--muted))',
          opacity: i <= value ? 1 : 0.3,
        }}
      />
    ))}
  </div>
);

interface Props {
  onSelectFamily: (familyId: FamilyId, resources: FamilyInfo['startingResources']) => void;
}

const FamilySelectionScreen: React.FC<Props> = ({ onSelectFamily }) => {
  const [selectedFamily, setSelectedFamily] = useState<FamilyId | null>(null);

  const activeFamily = families.find(f => f.id === selectedFamily);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Subtle background grain */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Top decorative line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* Title */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center mb-12"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3 font-source">
          New York City, 1955
        </p>
        <h1 className="text-5xl md:text-6xl font-bold text-primary font-playfair tracking-wider">
          THE FIVE FAMILIES
        </h1>
        <div className="w-24 h-px bg-primary/30 mx-auto mt-4" />
        <p className="text-sm text-muted-foreground mt-4 font-source max-w-md mx-auto">
          Choose your family. Each has unique strengths, weaknesses, and strategies for domination.
        </p>
      </motion.div>

      {/* Family cards — horizontal row */}
      <div className="flex flex-wrap justify-center gap-3 max-w-5xl mb-10">
        {families.map((family, i) => {
          const isSelected = selectedFamily === family.id;
          return (
            <motion.div
              key={family.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
              onClick={() => setSelectedFamily(family.id)}
              className={cn(
                'w-[170px] cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 relative',
                'bg-card/80 backdrop-blur-sm',
                isSelected
                  ? 'scale-[1.03] shadow-xl'
                  : 'border-border/50 hover:border-muted-foreground/50 hover:bg-card'
              )}
              style={{
                borderColor: isSelected ? family.color : undefined,
                boxShadow: isSelected ? `0 8px 30px ${family.color}20` : undefined,
              }}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                  style={{ backgroundColor: family.color }}
                />
              )}

              <div className="text-lg font-bold font-playfair mb-0.5" style={{ color: family.color }}>
                {family.name}
              </div>
              <div className="text-[10px] text-muted-foreground mb-3">{family.difficulty} difficulty</div>

              {/* Stat bars */}
              <div className="space-y-2">
                {family.traits.map(trait => (
                  <div key={trait.label} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        {trait.icon}
                        {trait.label}
                      </span>
                    </div>
                    <StatBar value={trait.value} color={family.color} />
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detail panel — only shows for selected family */}
      <div className="max-w-2xl w-full min-h-[220px]">
        {activeFamily ? (
          <motion.div
            key={activeFamily.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border-2 p-6 bg-card/90 backdrop-blur-sm"
            style={{ borderColor: activeFamily.color + '60' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-2xl font-bold font-playfair" style={{ color: activeFamily.color }}>
                  The {activeFamily.name} Family
                </h2>
                <p className="text-xs text-muted-foreground italic font-playfair mt-1">
                  {activeFamily.motto}
                </p>
              </div>
              <Badge
                className="text-[10px] font-bold border"
                style={{
                  backgroundColor: activeFamily.color + '15',
                  borderColor: activeFamily.color + '40',
                  color: activeFamily.color,
                }}
              >
                SELECTED
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              {activeFamily.description}
            </p>

            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Bonuses */}
              <div>
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Family Bonuses
                </h4>
                <ul className="space-y-1.5">
                  {activeFamily.bonuses.map(b => (
                    <li key={b} className="text-xs text-foreground flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: activeFamily.color }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Resources */}
              <div>
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Starting Resources
                </h4>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span className="text-muted-foreground">Money</span>
                  <span className="text-foreground font-medium">${activeFamily.startingResources.money.toLocaleString()}</span>
                  <span className="text-muted-foreground">Soldiers</span>
                  <span className="text-foreground font-medium">{activeFamily.startingResources.soldiers}</span>
                  <span className="text-muted-foreground">Influence</span>
                  <span className="text-foreground font-medium">{activeFamily.startingResources.influence}</span>
                  <span className="text-muted-foreground">Political</span>
                  <span className="text-foreground font-medium">{activeFamily.startingResources.politicalPower}</span>
                  <span className="text-muted-foreground">Respect</span>
                  <span className="text-foreground font-medium">{activeFamily.startingResources.respect}%</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => onSelectFamily(activeFamily.id, activeFamily.startingResources)}
              className="w-full font-playfair font-bold text-base py-5 transition-all duration-200"
              style={{
                backgroundColor: activeFamily.color,
                color: '#000',
              }}
            >
              BEGIN AS THE {activeFamily.name.toUpperCase()} FAMILY
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground text-sm">
              Select a family above to see their strengths and begin your rise to power.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FamilySelectionScreen;
