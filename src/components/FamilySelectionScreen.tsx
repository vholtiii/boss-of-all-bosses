import React, { useState } from 'react';
import mafiaSitdownBg from '@/assets/mafia-sitdown-bg.png';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DollarSign, Shield, Swords, Users, Eye, Volume2, VolumeX, Crown } from 'lucide-react';
import { useBgMusic } from '@/hooks/useBgMusic';
import { useSoundSystem } from '@/hooks/useSoundSystem';
import AtmosphericParticles from '@/components/AtmosphericParticles';

type FamilyId = 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';

interface FamilyInfo {
  id: FamilyId;
  name: string;
  motto: string;
  description: string;
  color: string;
  traits: { label: string; icon: React.ReactNode; value: number }[];
  bonuses: string[];
  difficulty: string;
  powerName: string;
  powerLore: string;
  powerEffect: string;
  powerCost: string;
  powerCooldown: string;
  startingResources: {
    money: number;
    soldiers: number;
    influence: number;
    politicalPower: number;
    respect: number;
  };
}

export const FAMILIES: FamilyInfo[] = [
  {
    id: 'gambino',
    name: 'Gambino',
    motto: '"The man who controls the money controls everything."',
    description: 'The most powerful family in New York. Masters of business and political connections with a strong starting economy — but that power makes you a target.',
    color: '#42D3F2',
    difficulty: 'Medium',
    traits: [
      { label: 'Economy', icon: <DollarSign className="h-3.5 w-3.5" />, value: 5 },
      { label: 'Military', icon: <Swords className="h-3.5 w-3.5" />, value: 3 },
      { label: 'Influence', icon: <Crown className="h-3.5 w-3.5" />, value: 4 },
    ],
    bonuses: ['+25% combat power', '+10% territory income', '+15% intimidation'],
    powerName: 'The Dellacroce Network',
    powerLore: 'Underboss Aniello Dellacroce ran an unrivaled intelligence network through enforcers like Roy DeMeo\'s "Murder Machine" crew — their eyes and ears stretched further than any rival family.',
    powerEffect: 'Scout a target hex and all 6 adjacent hexes (7 total revealed).',
    powerCost: '2 Tactical Actions',
    powerCooldown: '3 turns',
    startingResources: { money: 60000, soldiers: 4, influence: 20, politicalPower: 40, respect: 20 },
  },
  {
    id: 'genovese',
    name: 'Genovese',
    motto: '"The best move is the one nobody sees."',
    description: 'The shadow empire. Masters of legitimate business fronts and money laundering. Their economic engine funds everything while staying hidden in plain sight.',
    color: '#2AA63E',
    difficulty: 'Hard',
    traits: [
      { label: 'Economy', icon: <DollarSign className="h-3.5 w-3.5" />, value: 3 },
      { label: 'Military', icon: <Swords className="h-3.5 w-3.5" />, value: 4 },
      { label: 'Stealth', icon: <Eye className="h-3.5 w-3.5" />, value: 5 },
    ],
    bonuses: ['+30% business income', '+20% laundering efficiency', '+25% business upgrade discount'],
    powerName: 'The Front Boss',
    powerLore: 'Vincent "The Chin" Gigante feigned insanity in a bathrobe for 30 years, hiding the family\'s true operations in plain sight while the FBI chased shadows.',
    powerEffect: 'Hide a hex as neutral for 3 turns. While disguised: unscoutable by enemies, -30% hit and sabotage success against it, zero police heat.',
    powerCost: '1 Tactical Action',
    powerCooldown: '2 turns',
    startingResources: { money: 45000, soldiers: 4, influence: 15, politicalPower: 25, respect: 25 },
  },
  {
    id: 'lucchese',
    name: 'Lucchese',
    motto: '"One clean hit is worth a hundred soldiers."',
    description: 'The silent killers. Superior intelligence networks and surgical precision make them deadly. Lower heat and higher hit rates let them strike without consequences.',
    color: '#4169E1',
    difficulty: 'Easy',
    traits: [
      { label: 'Economy', icon: <DollarSign className="h-3.5 w-3.5" />, value: 4 },
      { label: 'Military', icon: <Swords className="h-3.5 w-3.5" />, value: 2 },
      { label: 'Trade', icon: <Shield className="h-3.5 w-3.5" />, value: 5 },
    ],
    bonuses: ['+25% hit success rate', '+15% heat reduction', '+20% intelligence gathering'],
    powerName: 'Garment District Shakedown',
    powerLore: 'For decades the Lucchese family strangled NYC\'s Garment District, extracting tribute from every manufacturer on Seventh Avenue.',
    powerEffect: '+50% income from all businesses in the target district. Extract $1,000 tribute from each rival-owned hex in that district.',
    powerCost: '1 Tactical Action',
    powerCooldown: '3 turns',
    startingResources: { money: 70000, soldiers: 3, influence: 12, politicalPower: 20, respect: 10 },
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
    powerName: 'The Donnie Brasco Purge',
    powerLore: 'After FBI agent Joe Pistone infiltrated the family as "Donnie Brasco," the Bonannos launched a brutal internal purge of suspected informants.',
    powerEffect: 'Remove all soldiers with loyalty below 50. Survivors gain +15 loyalty and 2-turn immunity to enemy flip attempts.',
    powerCost: '1 Tactical Action',
    powerCooldown: '4 turns',
    startingResources: { money: 40000, soldiers: 2, influence: 8, politicalPower: 15, respect: 25 },
  },
  {
    id: 'colombo',
    name: 'Colombo',
    motto: '"We don\'t need much. Just enough to bury you."',
    description: 'The scrappy survivors. Start with the least but fight the hardest for every dollar. Low resources force creative play — recruitment discounts and fear keep you in the game.',
    color: '#8A2BE2',
    difficulty: 'Hard',
    traits: [
      { label: 'Attack', icon: <Swords className="h-3.5 w-3.5" />, value: 5 },
      { label: 'Economy', icon: <DollarSign className="h-3.5 w-3.5" />, value: 2 },
      { label: 'Fear', icon: <Crown className="h-3.5 w-3.5" />, value: 4 },
    ],
    bonuses: ['+20% income bonus', '-15% recruitment cost', '+15% fear generation'],
    powerName: 'The Persico Succession',
    powerLore: 'When Joe Colombo was shot at the 1971 Unity Day Rally, Carmine Persico seized control and reorganized — a pattern repeated through decades of assassinations and internal wars.',
    powerEffect: 'Instantly promote a soldier to capo when one of your capos is killed. Reactive trigger — no turn required.',
    powerCost: '1 Tactical Action',
    powerCooldown: 'Once per game',
    startingResources: { money: 35000, soldiers: 1, influence: 12.5, politicalPower: 10, respect: 15 },
  },
];

// --- Family Crests (inline SVGs) ---
const FamilyCrest: React.FC<{ familyId: FamilyId; color: string; size?: number }> = ({ familyId, color, size = 32 }) => {
  const s = size;
  const crests: Record<FamilyId, React.ReactNode> = {
    gambino: (
      // Crown with dollar sign
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <path d="M6 22L8 10L12 16L16 8L20 16L24 10L26 22H6Z" stroke={color} strokeWidth="1.5" fill={color + '20'} />
        <circle cx="8" cy="10" r="2" fill={color} />
        <circle cx="16" cy="8" r="2" fill={color} />
        <circle cx="24" cy="10" r="2" fill={color} />
        <text x="16" y="20" textAnchor="middle" fontSize="8" fontWeight="bold" fill={color}>$</text>
        <line x1="6" y1="24" x2="26" y2="24" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    genovese: (
      // Eye with serpent
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <ellipse cx="16" cy="16" rx="12" ry="7" stroke={color} strokeWidth="1.5" fill={color + '10'} />
        <circle cx="16" cy="16" r="3.5" fill={color} opacity="0.8" />
        <circle cx="16" cy="16" r="1.5" fill="black" />
        <path d="M4 16C4 16 8 9 16 9C24 9 28 16 28 16" stroke={color} strokeWidth="1.2" fill="none" />
        <path d="M4 16C4 16 8 23 16 23C24 23 28 16 28 16" stroke={color} strokeWidth="1.2" fill="none" />
        <path d="M26 11C28 9 30 10 29 12" stroke={color} strokeWidth="1" opacity="0.6" />
      </svg>
    ),
    lucchese: (
      // Crossed keys
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <line x1="8" y1="8" x2="24" y2="24" stroke={color} strokeWidth="1.5" />
        <line x1="24" y1="8" x2="8" y2="24" stroke={color} strokeWidth="1.5" />
        <circle cx="8" cy="8" r="3" stroke={color} strokeWidth="1.5" fill={color + '15'} />
        <circle cx="24" cy="8" r="3" stroke={color} strokeWidth="1.5" fill={color + '15'} />
        <line x1="20" y1="20" x2="22" y2="18" stroke={color} strokeWidth="1.2" />
        <line x1="20" y1="20" x2="18" y2="18" stroke={color} strokeWidth="1.2" />
        <line x1="12" y1="20" x2="14" y2="18" stroke={color} strokeWidth="1.2" />
        <line x1="12" y1="20" x2="10" y2="18" stroke={color} strokeWidth="1.2" />
      </svg>
    ),
    bonanno: (
      // Shield with fist
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <path d="M16 4L6 8V18C6 23 10 27 16 28C22 27 26 23 26 18V8L16 4Z" stroke={color} strokeWidth="1.5" fill={color + '12'} />
        <path d="M13 14H19V17C19 17 19 20 16 20C13 20 13 17 13 17V14Z" fill={color} opacity="0.7" />
        <line x1="14" y1="14" x2="14" y2="12" stroke={color} strokeWidth="1.2" />
        <line x1="16" y1="14" x2="16" y2="11" stroke={color} strokeWidth="1.2" />
        <line x1="18" y1="14" x2="18" y2="12" stroke={color} strokeWidth="1.2" />
      </svg>
    ),
    colombo: (
      // Crossed swords with skull
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <line x1="6" y1="6" x2="26" y2="26" stroke={color} strokeWidth="1.5" />
        <line x1="26" y1="6" x2="6" y2="26" stroke={color} strokeWidth="1.5" />
        <polygon points="6,6 4,8 8,8" fill={color} />
        <polygon points="26,6 24,8 28,8" fill={color} />
        <circle cx="16" cy="15" r="4" stroke={color} strokeWidth="1.2" fill={color + '15'} />
        <circle cx="14.5" cy="14" r="1" fill={color} />
        <circle cx="17.5" cy="14" r="1" fill={color} />
        <path d="M14 17.5C14 17.5 15 18.5 16 17.5C17 18.5 18 17.5 18 17.5" stroke={color} strokeWidth="0.8" fill="none" />
      </svg>
    ),
  };
  return <>{crests[familyId]}</>;
};

// Industrial stat bar
const StatBar: React.FC<{ value: number; color: string }> = ({ value, color }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <div
        key={i}
        className="h-3 w-5 transition-all duration-300 relative overflow-hidden"
        style={{
          backgroundColor: i <= value ? color : 'hsl(var(--muted))',
          opacity: i <= value ? 1 : 0.2,
          clipPath: 'polygon(0% 0%, 95% 0%, 100% 100%, 5% 100%)',
        }}
      >
        {/* Brushed metal grain */}
        {i <= value && (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0.1) 2px)`,
            }}
          />
        )}
      </div>
    ))}
  </div>
);

// Noise texture for cards (CSS data URI)
const NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`;

// Distressed card clip path
const CARD_CLIP = 'polygon(0% 1.5%, 1% 0%, 99% 0.5%, 100% 2%, 99.5% 98%, 100% 100%, 0.5% 99.5%, 0% 97%)';

type MapSize = 'small' | 'medium' | 'large';

interface Props {
  onSelectFamily: (familyId: FamilyId, resources: FamilyInfo['startingResources'], difficulty: 'easy' | 'normal' | 'hard', seed?: number, mapSize?: MapSize) => void;
}

const FamilySelectionScreen: React.FC<Props> = ({ onSelectFamily }) => {
  const [selectedFamily, setSelectedFamily] = useState<FamilyId | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [mapSize, setMapSize] = useState<MapSize>('medium');
  const [seedInput, setSeedInput] = useState('');
  const { soundConfig, updateSoundConfig } = useSoundSystem();

  useBgMusic({ src: '/audio/mafia-theme.mp3', soundConfig });

  const activeFamily = FAMILIES.find(f => f.id === selectedFamily);

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center p-6 overflow-hidden relative"
      style={{
        backgroundImage: `url(${mafiaSitdownBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay + vignette for dramatic atmosphere */}
      <div className="absolute inset-0 bg-black/60 z-0" />
      <div
        className="absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.95) 100%)',
        }}
      />
      {/* Atmospheric particles */}
      <AtmosphericParticles />

      {/* Music mute toggle */}
      <button
        onClick={() => updateSoundConfig({ enabled: !soundConfig.enabled })}
        className="absolute top-4 right-4 z-10 p-2 rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
        title={soundConfig.enabled ? 'Mute music' : 'Unmute music'}
      >
        {soundConfig.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </button>

      {/* Grunge noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage: NOISE_BG,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Subtle background grain */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Top decorative line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent z-[2]" />

      {/* Title */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center mb-12 relative z-[3]"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3 font-source">
          New York City, 1955
        </p>
        <h1 className="text-5xl md:text-6xl font-bold text-primary font-playfair tracking-wider">
          THE FIVE FAMILIES
        </h1>
        <div className="w-24 h-px bg-primary/30 mx-auto mt-4" />
        <p className="text-sm text-muted-foreground mt-4 font-source max-w-md mx-auto">
          Choose your family and difficulty. Each has unique strengths, weaknesses, and strategies for domination.
        </p>
        {/* Difficulty Selector */}
        <div className="flex items-center justify-center gap-2 mt-5">
          {(['easy', 'normal', 'hard'] as const).map(d => {
            const labels = { easy: '🟢 Easy', normal: '🟡 Normal', hard: '🔴 Hard' };
            const descs = { easy: '+50% money, weaker AI', normal: 'Balanced experience', hard: '-25% money, stronger AI' };
            const isActive = difficulty === d;
            return (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={cn(
                  'px-4 py-2 rounded-lg border-2 text-xs font-bold uppercase tracking-wider transition-all duration-200',
                  'bg-card/80 backdrop-blur-sm',
                  isActive
                    ? 'border-primary text-primary shadow-md scale-105'
                    : 'border-border/50 text-muted-foreground hover:border-muted-foreground/50'
                )}
                title={descs[d]}
              >
                {labels[d]}
              </button>
            );
          })}
        </div>
        {/* Map Size Selector */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {(['small', 'medium', 'large'] as const).map(s => {
            const labels = { small: '🗺️ Small', medium: '🗺️ Medium', large: '🗺️ Large' };
            const descs = { small: '~169 hexes · Fast games', medium: '~331 hexes · Classic', large: '~547 hexes · Epic sprawl' };
            const isActive = mapSize === s;
            return (
              <button
                key={s}
                onClick={() => setMapSize(s)}
                className={cn(
                  'px-4 py-2 rounded-lg border-2 text-xs font-bold uppercase tracking-wider transition-all duration-200',
                  'bg-card/80 backdrop-blur-sm',
                  isActive
                    ? 'border-primary text-primary shadow-md scale-105'
                    : 'border-border/50 text-muted-foreground hover:border-muted-foreground/50'
                )}
                title={descs[s]}
              >
                {labels[s]}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Map Seed Input */}
      <div className="flex items-center justify-center gap-2 mb-6 relative z-[3]">
        <label className="text-xs text-muted-foreground font-source">Map Seed:</label>
        <input
          type="text"
          value={seedInput}
          onChange={(e) => setSeedInput(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="Random"
          className="w-32 px-3 py-1.5 rounded-lg border border-border/50 bg-card/80 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
        />
      </div>

      {/* Family cards — horizontal row */}
      <div className="flex flex-wrap justify-center gap-4 max-w-5xl mb-10 relative z-[3]">
        {FAMILIES.map((family, i) => {
          const isSelected = selectedFamily === family.id;
          return (
            <motion.div
              key={family.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
              whileHover={{ scale: 1.05, y: -4 }}
              onClick={() => setSelectedFamily(family.id)}
              className={cn(
                'w-[155px] cursor-pointer p-4 transition-all duration-200 relative',
                'bg-card/90 backdrop-blur-sm',
              )}
              style={{
                clipPath: CARD_CLIP,
                backgroundImage: NOISE_BG,
                border: `2px solid ${isSelected ? family.color : 'hsl(var(--border))'}`,
                boxShadow: isSelected
                  ? `0 0 25px ${family.color}40, 0 0 50px ${family.color}15, inset 0 1px 0 ${family.color}20`
                  : '0 4px 12px hsl(20 15% 5% / 0.4)',
              }}
            >
              {/* Spray-paint style accent bar */}
              {isSelected && (
                <motion.div
                  layoutId="selectedAccent"
                  className="absolute -top-0.5 left-2 right-2 h-1 rounded-full"
                  style={{
                    backgroundColor: family.color,
                    boxShadow: `0 0 8px ${family.color}80`,
                  }}
                />
              )}

              {/* Crest */}
              <motion.div
                className="flex justify-center mb-2"
                whileHover={{
                  filter: `drop-shadow(0 0 6px ${family.color})`,
                }}
                animate={isSelected ? {
                  scale: [1, 1.1, 1],
                  filter: [`drop-shadow(0 0 4px ${family.color}60)`, `drop-shadow(0 0 10px ${family.color})`, `drop-shadow(0 0 4px ${family.color}60)`],
                } : {}}
                transition={isSelected ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}}
              >
                <FamilyCrest familyId={family.id} color={family.color} size={36} />
              </motion.div>

              <div className="text-lg font-bold font-playfair mb-0.5 text-center" style={{ color: family.color }}>
                {family.name}
              </div>
              <div className="text-[10px] text-muted-foreground mb-1 text-center">{family.difficulty} difficulty</div>
              <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-3">
                <Users className="h-3 w-3" />
                <span>{family.startingResources.soldiers} soldiers</span>
              </div>

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
      <div className="max-w-2xl w-full min-h-[220px] relative z-[3]">
        {activeFamily ? (
          <motion.div
            key={activeFamily.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border-2 p-6 bg-card/90 backdrop-blur-sm"
            style={{
              borderColor: activeFamily.color + '60',
              backgroundImage: NOISE_BG,
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <FamilyCrest familyId={activeFamily.id} color={activeFamily.color} size={40} />
                <div>
                  <h2 className="text-2xl font-bold font-playfair" style={{ color: activeFamily.color }}>
                    The {activeFamily.name} Family
                  </h2>
                  <p className="text-xs text-muted-foreground italic font-playfair mt-1">
                    {activeFamily.motto}
                  </p>
                </div>
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

            {/* Family Power Section */}
            <div
              className="mb-5 p-4 rounded-lg border-l-[3px]"
              style={{
                borderLeftColor: activeFamily.color,
                backgroundColor: `${activeFamily.color}08`,
              }}
            >
              <h4
                className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                style={{ color: activeFamily.color }}
              >
                ⚡ FAMILY POWER
              </h4>
              <p className="text-sm font-bold text-foreground font-playfair mb-1">
                {activeFamily.powerName}
              </p>
              <p className="text-xs text-muted-foreground italic mb-2 leading-relaxed">
                "{activeFamily.powerLore}"
              </p>
              <p className="text-xs text-foreground mb-3 leading-relaxed">
                {activeFamily.powerEffect}
              </p>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${activeFamily.color}20`,
                    color: activeFamily.color,
                  }}
                >
                  {activeFamily.powerCost}
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${activeFamily.color}20`,
                    color: activeFamily.color,
                  }}
                >
                  {activeFamily.powerCooldown === 'Once per game' ? '🔒 Once per game' : `⏱ Cooldown: ${activeFamily.powerCooldown}`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Bonuses */}
              <div>
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Family Bonuses
                </h4>
                <ul className="space-y-1.5">
                  {activeFamily.bonuses.map(b => (
                    <li key={b} className="text-xs text-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 flex-shrink-0" style={{ backgroundColor: activeFamily.color, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
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
              onClick={() => onSelectFamily(activeFamily.id, activeFamily.startingResources, difficulty, seedInput ? parseInt(seedInput) : undefined, mapSize)}
              className="w-full font-playfair font-bold text-base py-5 transition-all duration-200"
              style={{
                backgroundColor: activeFamily.color,
                color: '#000',
                boxShadow: `0 0 20px ${activeFamily.color}40`,
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
