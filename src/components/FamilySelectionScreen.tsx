import React, { useState, useEffect, useRef, useCallback } from 'react';
import mafiaSitdownBg from '@/assets/mafia-sitdown-bg.png';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { DollarSign, Shield, Swords, Users, Eye, Volume2, VolumeX, Crown, Dices, Check, Copy, AlertTriangle } from 'lucide-react';
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
    startingResources: { money: 40000, soldiers: 4, influence: 15, politicalPower: 25, respect: 25 },
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
    startingResources: { money: 55000, soldiers: 3, influence: 12, politicalPower: 20, respect: 10 },
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
    startingResources: { money: 42000, soldiers: 2, influence: 12.5, politicalPower: 10, respect: 15 },
  },
];

// --- Family Crests (inline SVGs) ---
const FamilyCrest: React.FC<{ familyId: FamilyId; color: string; size?: number }> = React.memo(({ familyId, color, size = 32 }) => {
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
});
FamilyCrest.displayName = 'FamilyCrest';

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

// Mini hex-grid preview for map size selector — tactical dossier window
const MapSizeHexPreview: React.FC<{ gridRadius: number; highlighted: boolean; refTag: string }> = ({ gridRadius, highlighted, refTag }) => {
  const size = 92;
  const hexR = size / (2 * (gridRadius + 1) + 0.5);
  const hexW = Math.sqrt(3) * hexR;
  const hexH = 2 * hexR;
  const cx = size / 2;
  const cy = size / 2;
  const cells: { x: number; y: number }[] = [];
  for (let q = -gridRadius; q <= gridRadius; q++) {
    for (let r = -gridRadius; r <= gridRadius; r++) {
      if (Math.abs(q + r) > gridRadius) continue;
      const x = cx + hexW * (q + r / 2);
      const y = cy + (hexH * 3) / 4 * r;
      cells.push({ x, y });
    }
  }
  const hexPath = (cx2: number, cy2: number, r2: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 30);
      pts.push(`${cx2 + r2 * Math.cos(a)},${cy2 + r2 * Math.sin(a)}`);
    }
    return `M${pts.join('L')}Z`;
  };
  // Deterministic family tint sprinkles
  const tints = ['rgba(251,191,36,0.6)', 'rgba(16,185,129,0.55)', 'rgba(244,63,94,0.55)', 'rgba(59,130,246,0.55)', 'rgba(168,85,247,0.55)'];
  const tinted = new Map<number, string>();
  const seed = gridRadius * 7 + 3;
  const tintCount = Math.min(cells.length, gridRadius + 3);
  for (let i = 0; i < tintCount; i++) {
    const idx = (i * 13 + seed) % cells.length;
    tinted.set(idx, tints[i % tints.length]);
  }
  const baseFill = highlighted ? 'hsl(var(--primary) / 0.10)' : 'rgba(255,255,255,0.04)';
  const strokeColor = highlighted ? 'hsl(var(--primary) / 0.55)' : 'rgba(255,255,255,0.18)';
  const cornerColor = highlighted ? 'hsl(var(--primary) / 0.7)' : 'rgba(255,255,255,0.25)';
  return (
    <div className="relative w-full aspect-square overflow-hidden bg-black/40">
      {/* Tactical corner brackets */}
      <span aria-hidden className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t border-l" style={{ borderColor: cornerColor }} />
      <span aria-hidden className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t border-r" style={{ borderColor: cornerColor }} />
      <span aria-hidden className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b border-l" style={{ borderColor: cornerColor }} />
      <span aria-hidden className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b border-r" style={{ borderColor: cornerColor }} />
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="block">
        {cells.map((c, i) => (
          <path
            key={i}
            d={hexPath(c.x, c.y, hexR * 0.92)}
            fill={tinted.get(i) ?? baseFill}
            stroke={strokeColor}
            strokeWidth={0.6}
          />
        ))}
      </svg>
      <span
        aria-hidden
        className="absolute bottom-1 left-2 font-mono text-[8px] tracking-tighter uppercase"
        style={{ color: highlighted ? 'hsl(var(--primary) / 0.7)' : 'rgba(255,255,255,0.35)' }}
      >
        {refTag}
      </span>
    </div>
  );
};

interface Props {
  onSelectFamily: (familyId: FamilyId, resources: FamilyInfo['startingResources'], difficulty: 'easy' | 'normal' | 'hard', seed?: number, mapSize?: MapSize) => void;
}

const FamilySelectionScreen: React.FC<Props> = ({ onSelectFamily }) => {
  const [selectedFamily, setSelectedFamily] = useState<FamilyId | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [mapSize, setMapSize] = useState<MapSize>('medium');
  const [seedInput, setSeedInput] = useState<string>(() => Math.floor(Math.random() * 1e9).toString());
  const [seedFlash, setSeedFlash] = useState(0);
  const [seedCopied, setSeedCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const rerollSeed = useCallback(() => {
    setSeedInput(Math.floor(Math.random() * 1e9).toString());
    setSeedFlash(f => f + 1);
  }, []);

  const copySeed = useCallback(async () => {
    if (!seedInput) return;
    try {
      await navigator.clipboard.writeText(seedInput);
      setSeedCopied(true);
      setTimeout(() => setSeedCopied(false), 1400);
    } catch {}
  }, [seedInput]);
  const { soundConfig, updateSoundConfig, playSound } = useSoundSystem();
  const detailRef = useRef<HTMLDivElement>(null);

  const { fadeOut: fadeOutMusic } = useBgMusic({ src: '/audio/mafia-theme.mp3', soundConfig });

  // Cinematic transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const activeFamily = FAMILIES.find(f => f.id === selectedFamily);

  const beginGame = useCallback(() => {
    if (isTransitioning || !activeFamily) return;
    playSound('success');
    setIsTransitioning(true);
    fadeOutMusic(prefersReducedMotion ? 500 : 1200);

    // Optional ambience crossfade — silently no-op if file missing
    try {
      const ambience = new Audio('/audio/game-ambience.mp3');
      ambience.loop = true;
      ambience.volume = 0;
      const target = soundConfig.enabled ? soundConfig.sfxVolume * 0.4 : 0;
      ambience.play().then(() => {
        const steps = 20;
        const dur = 1200;
        let i = 0;
        const id = window.setInterval(() => {
          i++;
          ambience.volume = Math.min(1, (target * i) / steps);
          if (i >= steps) window.clearInterval(id);
        }, dur / steps);
      }).catch(() => {});
    } catch {}

    const totalMs = prefersReducedMotion ? 700 : 2950;
    window.setTimeout(() => {
      onSelectFamily(
        activeFamily.id,
        activeFamily.startingResources,
        difficulty,
        seedInput ? parseInt(seedInput) : undefined,
        mapSize,
      );
    }, totalMs);
  }, [isTransitioning, activeFamily, playSound, fadeOutMusic, prefersReducedMotion, soundConfig, onSelectFamily, difficulty, seedInput, mapSize]);

  const selectFamily = useCallback((id: FamilyId) => {
    setSelectedFamily(prev => {
      if (prev !== id) playSound('click');
      return id;
    });
  }, [playSound]);

  // Auto-scroll detail panel into view when a family is picked
  useEffect(() => {
    if (selectedFamily && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedFamily]);

  // Arrow key navigation across family row
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTransitioning) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const idx = selectedFamily ? FAMILIES.findIndex(f => f.id === selectedFamily) : -1;
      const next = e.key === 'ArrowRight'
        ? (idx + 1 + FAMILIES.length) % FAMILIES.length
        : (idx - 1 + FAMILIES.length) % FAMILIES.length;
      const safe = idx === -1 ? 0 : next;
      selectFamily(FAMILIES[safe].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedFamily, selectFamily, isTransitioning]);

  return (
    <TooltipProvider delayDuration={150}>
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center p-6 overflow-hidden relative"
    >
      {/* Ken-Burns background layer (CSS-driven for compositor offload) */}
      <div
        className={cn('ken-burns-bg absolute inset-0 z-0', isTransitioning && 'is-paused')}
        style={{
          backgroundImage: `url(${mafiaSitdownBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Dark overlay + vignette for dramatic atmosphere */}
      <div className="absolute inset-0 bg-black/55 z-0" />
      <div
        className="absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.85) 100%)',
        }}
      />
      {/* Atmospheric particles */}
      <AtmosphericParticles paused={isTransitioning} />

      {/* Art-deco corner ornaments — framed playbill feel */}
      {([
        { pos: 'top-3 left-3', rotate: 0 },
        { pos: 'top-3 right-3', rotate: 90 },
        { pos: 'bottom-3 right-3', rotate: 180 },
        { pos: 'bottom-3 left-3', rotate: 270 },
      ] as const).map(({ pos, rotate }) => (
        <svg
          key={pos}
          className={cn('absolute pointer-events-none z-[2] opacity-30', pos)}
          width="56" height="56" viewBox="0 0 56 56" fill="none"
          style={{ transform: `rotate(${rotate}deg)` }}
        >
          <path d="M2 20 V2 H20" stroke="hsl(var(--primary))" strokeWidth="1.2" />
          <path d="M6 14 V6 H14" stroke="hsl(var(--primary))" strokeWidth="0.8" opacity="0.7" />
          <circle cx="2" cy="2" r="1.5" fill="hsl(var(--primary))" />
        </svg>
      ))}

      {/* Music mute toggle */}

      {/* Music mute toggle */}
      <button
        onClick={() => updateSoundConfig({ enabled: !soundConfig.enabled })}
        className="absolute top-4 right-4 z-10 p-2 rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
        title={soundConfig.enabled ? 'Mute music' : 'Unmute music'}
      >
        {soundConfig.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </button>

      {/* Static grunge noise overlay (no blend-mode → no layer promotion) */}
      <div
        className="absolute inset-0 pointer-events-none z-[1] opacity-40"
        style={{ backgroundImage: NOISE_BG }}
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
        <h1 className="text-5xl md:text-6xl font-bold text-primary font-playfair tracking-wider drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
          THE FIVE FAMILIES
        </h1>
        <motion.div
          className="h-px bg-primary/60 mx-auto mt-4 origin-center"
          initial={{ width: 0 }}
          animate={{ width: 96 }}
          transition={{ delay: 0.5, duration: 0.9, ease: 'easeOut' }}
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="text-xs italic text-primary/80 mt-3 font-playfair tracking-wide"
        >
          Five families. One throne. The Commission watches.
        </motion.p>
        <p className="text-sm text-muted-foreground mt-4 font-source max-w-md mx-auto">
          Choose your family and difficulty. Each has unique strengths, weaknesses, and strategies for domination.
        </p>

        {/* STEP 1 header */}
        <div className="mt-10 mb-3 flex items-center justify-center gap-3 relative z-[3]">
          <span className="h-px w-10 bg-primary/40" />
          <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-primary/80">
            Step 1 · Choose Your Game
          </span>
          <span className="h-px w-10 bg-primary/40" />
        </div>
        <p className="text-[11px] text-emerald-400/85 font-mono uppercase tracking-wider mb-3">
          🟢 New player? Start with <span className="font-bold">Wiseguy</span> (Easy).
        </p>
        {/* Difficulty Selector — dossier folders */}
        <div
          role="radiogroup"
          aria-label="Game difficulty"
          className="flex flex-wrap items-stretch justify-center gap-5 mt-2 max-w-4xl mx-auto px-2"
          onKeyDown={(e) => {
            const order = ['easy', 'normal', 'hard'] as const;
            const idx = order.indexOf(difficulty);
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
              e.preventDefault();
              const next = order[(idx + 1) % order.length];
              setDifficulty(next); playSound('click');
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
              e.preventDefault();
              const prev = order[(idx - 1 + order.length) % order.length];
              setDifficulty(prev); playSound('click');
            }
          }}
        >
          {(['easy', 'normal', 'hard'] as const).map((d, dIdx) => {
            type Tone = 'buff' | 'neutral' | 'debuff';
            const meta = ({
              easy: {
                icon: '🥃', name: 'Wiseguy', chip: 'EASY', fileNo: '001',
                tagline: 'Learn the ropes',
                quote: '"Welcome to the family, kid."',
                color: 'rgb(16,185,129)', glow: 'rgba(16,185,129,0.55)', tint: 'rgba(16,185,129,0.10)',
                stats: [
                  { label: 'Income',      value: '+50%',      tone: 'buff' as Tone },
                  { label: 'AI Rivals',   value: 'Reactive',  tone: 'buff' as Tone },
                  { label: 'Police Heat', value: 'Lenient',   tone: 'buff' as Tone },
                  { label: 'Diplomacy',   value: 'Forgiving', tone: 'buff' as Tone },
                ],
              },
              normal: {
                icon: '🎩', name: 'Made Man', chip: 'STANDARD', fileNo: '002',
                tagline: 'Prove your worth',
                quote: '"No favors. No mercy."',
                color: 'rgb(251,191,36)', glow: 'rgba(251,191,36,0.55)', tint: 'rgba(251,191,36,0.10)',
                stats: [
                  { label: 'Income',      value: 'Base',     tone: 'neutral' as Tone },
                  { label: 'AI Rivals',   value: 'Adaptive', tone: 'neutral' as Tone },
                  { label: 'Police Heat', value: 'Standard', tone: 'neutral' as Tone },
                  { label: 'Diplomacy',   value: 'Cautious', tone: 'neutral' as Tone },
                ],
              },
              hard: {
                icon: '🔫', name: 'The Don', chip: 'HARD', fileNo: '003',
                tagline: 'Earn your respect',
                quote: '"Only the strong survive."',
                color: 'rgb(244,63,94)', glow: 'rgba(244,63,94,0.55)', tint: 'rgba(244,63,94,0.10)',
                stats: [
                  { label: 'Income',      value: '−25%',        tone: 'debuff' as Tone },
                  { label: 'AI Rivals',   value: 'Ruthless',    tone: 'debuff' as Tone },
                  { label: 'Police Heat', value: 'Aggressive',  tone: 'debuff' as Tone },
                  { label: 'Diplomacy',   value: 'Treacherous', tone: 'debuff' as Tone },
                ],
              },
            })[d];
            const isActive = difficulty === d;
            const toneClass: Record<Tone, string> = {
              buff: 'text-emerald-400',
              neutral: 'text-amber-300',
              debuff: 'text-rose-400',
            };
            const rotations = prefersReducedMotion ? [0, 0, 0] : [-0.8, 0, 0.8];
            const baseRot = rotations[dIdx];
            return (
              <motion.button
                key={d}
                role="radio"
                aria-checked={isActive}
                aria-label={`Difficulty: ${meta.name} — ${meta.tagline}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => {
                  setDifficulty(d);
                  playSound(d === 'hard' ? 'success' : 'click');
                }}
                animate={{ rotate: isActive ? 0 : baseRot, y: 0 }}
                whileHover={{ y: -4, rotate: 0 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  'flex-1 min-w-[230px] max-w-[290px] text-left px-4 pt-6 pb-4 rounded-sm transition-colors duration-200',
                  'relative outline-none mt-3',
                  'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                )}
                style={{
                  background: `linear-gradient(180deg, rgba(255,240,210,${isActive ? 0.07 : 0.035}) 0%, rgba(255,240,210,${isActive ? 0.02 : 0.008}) 100%), hsl(var(--card) / 0.92)`,
                  border: isActive ? `2px solid ${meta.color}` : '1px solid hsl(var(--border) / 0.5)',
                  boxShadow: isActive
                    ? `0 0 26px ${meta.glow}, inset 0 0 0 1px rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.45)`
                    : '0 4px 12px rgba(0,0,0,0.35)',
                }}
              >
                {/* Paper noise texture (always on) */}
                <div
                  className="absolute inset-0 opacity-[0.06] pointer-events-none rounded-sm"
                  style={{ backgroundImage: NOISE_BG }}
                />
                {/* Ruled paper lines */}
                <div className="absolute left-4 right-4 top-[58%] h-px bg-white/[0.04] pointer-events-none" />
                <div className="absolute left-4 right-4 top-[72%] h-px bg-white/[0.04] pointer-events-none" />
                {/* Corner vignette */}
                <div
                  className="absolute inset-0 pointer-events-none rounded-sm"
                  style={{ background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.35) 100%)' }}
                />

                {/* Folder tab */}
                <div
                  className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-t-sm font-mono text-[9px] uppercase tracking-widest"
                  style={{
                    background: `linear-gradient(180deg, rgba(255,240,210,0.08), rgba(255,240,210,0.02)), hsl(var(--card))`,
                    border: isActive ? `2px solid ${meta.color}` : '1px solid hsl(var(--border) / 0.5)',
                    borderBottom: 'none',
                    color: isActive ? meta.color : 'hsl(var(--muted-foreground))',
                  }}
                >
                  {isActive ? '★ ' : ''}File №{meta.fileNo} — {meta.chip}
                </div>

                {/* Stamp (top-right) */}
                <div
                  className="absolute top-3 right-3 px-2 py-0.5 font-mono font-black uppercase text-[10px] tracking-[0.18em] select-none pointer-events-none"
                  style={{
                    color: isActive ? 'rgb(251,191,36)' : meta.color,
                    border: `2px solid ${isActive ? 'rgb(251,191,36)' : meta.color}`,
                    transform: 'rotate(-8deg)',
                    opacity: isActive ? 0.92 : 0.8,
                    textShadow: '0.5px 0.5px 0 rgba(0,0,0,0.4)',
                    boxShadow: `0 0 0 1px rgba(0,0,0,0.25) inset`,
                    mixBlendMode: 'screen',
                  }}
                >
                  {isActive ? '✓ Approved' : meta.chip}
                </div>

                {/* Header */}
                <div className="relative flex items-center gap-2.5 mb-2 mt-1">
                  <span
                    className="flex items-center justify-center w-8 h-8 rounded-full text-lg leading-none select-none"
                    style={{
                      border: `1px dashed ${meta.color}`,
                      background: 'rgba(0,0,0,0.25)',
                      filter: isActive ? `drop-shadow(0 0 6px ${meta.color})` : undefined,
                    }}
                  >
                    {meta.icon}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-playfair text-lg font-bold leading-tight text-foreground whitespace-nowrap">
                      {meta.name}
                    </span>
                    <span className="font-mono text-[8px] tracking-[0.3em] uppercase text-muted-foreground/70">
                      Classified · Subject
                    </span>
                  </div>
                </div>

                {/* Tagline */}
                <div className="relative text-xs text-foreground/80 font-semibold mb-2 uppercase tracking-wide">
                  {meta.tagline}
                </div>

                {/* Quote — handwritten margin note */}
                <div
                  className="relative text-[11px] italic text-muted-foreground border-l-2 pl-2 pr-1 py-1 mb-3 leading-snug"
                  style={{
                    borderColor: meta.color,
                    transform: prefersReducedMotion ? undefined : 'rotate(-0.4deg)',
                    background: 'rgba(255,240,210,0.025)',
                  }}
                >
                  <span className="mr-1 opacity-70">📎</span>{meta.quote}
                </div>

                {/* Stat rows — typed table with dotted leaders */}
                <div className="relative space-y-1">
                  {meta.stats.map(s => (
                    <div key={s.label} className="flex items-baseline gap-1.5 text-[11px]">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        {s.label}
                      </span>
                      <span className="flex-1 border-b border-dotted border-border/40 mb-0.5" />
                      <span className={cn('font-mono font-bold uppercase tracking-wider', toneClass[s.tone])}>
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Map Size Selector — mini hex-grid previews */}
        <div className="flex items-center justify-center gap-3 mt-6">
          {(['small', 'medium', 'large'] as const).map(s => {
            const meta = {
              small:  { label: 'Small',  desc: '~169 hexes · Fast',     radius: 2, count: 19 },
              medium: { label: 'Medium', desc: '~331 hexes · Classic',  radius: 3, count: 37 },
              large:  { label: 'Large',  desc: '~547 hexes · Epic',     radius: 4, count: 61 },
            }[s];
            const isActive = mapSize === s;
            return (
              <button
                key={s}
                onClick={() => { setMapSize(s); playSound('click'); }}
                className={cn(
                  'relative flex flex-col items-center gap-1 w-[140px] px-3 pt-3 pb-2 rounded-md transition-all duration-200',
                  'bg-card/80 backdrop-blur-sm outline-none',
                  'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                )}
                style={{
                  border: isActive ? '2px solid rgb(251,191,36)' : '1px solid hsl(var(--border) / 0.5)',
                  boxShadow: isActive
                    ? '0 0 18px rgba(251,191,36,0.4), inset 0 0 0 1px rgba(251,191,36,0.1)'
                    : '0 2px 8px rgba(0,0,0,0.25)',
                }}
                title={meta.desc}
              >
                {isActive && (
                  <span
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: 'rgb(251,191,36)', color: '#0a0a0a' }}
                  >
                    ✓
                  </span>
                )}
                <MapSizeHexPreview gridRadius={meta.radius} highlighted={isActive} />
                <div
                  className={cn(
                    'text-xs font-bold uppercase tracking-widest font-mono',
                    isActive ? 'text-amber-400' : 'text-muted-foreground'
                  )}
                >
                  {meta.label}
                </div>
                <div className="text-[9px] text-muted-foreground/70 font-mono">{meta.desc}</div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Map Seed Input — collapsed under Advanced */}
      <div className="flex flex-col items-center gap-2 mb-6 relative z-[3]">
        <button
          type="button"
          onClick={() => { playSound('click'); setShowAdvanced(v => !v); }}
          className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
          aria-expanded={showAdvanced}
        >
          <span>⚙</span> Advanced {showAdvanced ? '▾' : '▸'}
          {!showAdvanced && (
            <span className="ml-2 text-muted-foreground/60 normal-case tracking-normal">
              seed {seedInput || 'random'}
            </span>
          )}
        </button>
        <AnimatePresence initial={false}>
          {showAdvanced && (
            <motion.div
              key="advanced"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col items-center gap-2 pt-2">
                <div className="flex items-center justify-center gap-2">
                  <label className="text-xs text-muted-foreground font-source">Map Seed:</label>
                  <input
                    type="text"
                    value={seedInput}
                    onChange={(e) => setSeedInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Random"
                    className="w-36 px-3 py-1.5 rounded-lg border border-border/50 bg-card/80 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => { playSound('click'); rerollSeed(); }}
                        className="p-1.5 rounded-lg border border-border/50 bg-card/80 text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors"
                        aria-label="Reroll seed"
                      >
                        <Dices className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Reroll seed</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={copySeed}
                        disabled={!seedInput}
                        className="p-1.5 rounded-lg border border-border/50 bg-card/80 text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors disabled:opacity-40 disabled:hover:text-muted-foreground disabled:hover:border-border/50"
                        aria-label="Copy seed"
                      >
                        {seedCopied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{seedCopied ? 'Copied!' : 'Copy seed'}</TooltipContent>
                  </Tooltip>
                </div>
                <AnimatePresence mode="wait">
                  {seedInput ? (
                    <motion.div
                      key={`active-${seedFlash}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center gap-2 text-[11px]"
                    >
                      <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary font-mono tracking-wider">
                        Active seed: {seedInput}
                      </span>
                      <span className="flex items-center gap-1 text-primary/80">
                        <Check className="w-3 h-3" />
                        Will be loaded when game starts
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="random"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1 text-[11px] text-amber-400/90"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      A random seed will be generated
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* STEP 2 header */}
      <div className="mb-4 flex items-center justify-center gap-3 relative z-[3]">
        <span className="h-px w-10 bg-primary/40" />
        <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-primary/80">
          Step 2 · Choose Your Family
        </span>
        <span className="h-px w-10 bg-primary/40" />
      </div>

      {/* Family cards — horizontal row */}
      <div className="flex flex-wrap justify-center gap-5 max-w-6xl mx-auto mb-10 relative z-[3] pb-24">
        {FAMILIES.map((family, i) => {
          const isSelected = selectedFamily === family.id;
          const isDimmed = !!selectedFamily && !isSelected;

          return (
            <motion.div
              key={family.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: isDimmed ? 0.55 : 1 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
              whileHover={{ scale: 1.03, y: -4 }}
              onClick={() => selectFamily(family.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectFamily(family.id);
                }
              }}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
              aria-label={`Select ${family.name} family`}
              className={cn(
                'w-[180px] cursor-pointer transition-all duration-200 relative group outline-none',
                'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm',
              )}
            >
              {/* Spotlight cone behind selected card (outside clip) */}
              {isSelected && (
                <div
                  className="absolute -inset-6 -z-10 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at 50% 50%, ${family.color}30 0%, transparent 70%)`,
                  }}
                />
              )}

              {/* Spray-paint style accent bar (outside clip) */}
              {isSelected && (
                <motion.div
                  layoutId="selectedAccent"
                  className="absolute -top-0.5 left-2 right-2 h-1 rounded-full z-20"
                  style={{
                    backgroundColor: family.color,
                    boxShadow: `0 0 8px ${family.color}80`,
                  }}
                />
              )}


              {/* Clipped inner card surface */}
              <div
                className="relative p-5 bg-card/95"
                style={{
                  clipPath: CARD_CLIP,
                  backgroundImage: NOISE_BG,
                  border: `2px solid ${isSelected ? family.color : 'hsl(var(--border))'}`,
                  boxShadow: isSelected
                    ? `0 0 25px ${family.color}55, 0 0 60px ${family.color}25, inset 0 1px 0 ${family.color}30`
                    : '0 4px 12px hsl(20 15% 5% / 0.4)',
                }}
              >
              <div
                className="flex justify-center mb-2"
                style={isSelected ? { filter: `drop-shadow(0 0 8px ${family.color})` } : undefined}
              >
                <FamilyCrest familyId={family.id} color={family.color} size={40} />
              </div>

              <div className="text-lg font-bold font-playfair mb-0.5 text-center" style={{ color: family.color }}>
                {family.name}
              </div>
              <div className="text-[10px] text-muted-foreground mb-1 text-center">{family.difficulty} difficulty</div>
              <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-3">
                <Users className="h-3 w-3" />
                <span>{family.startingResources.soldiers} soldiers</span>
              </div>

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

              {/* Motto reveal — overlay INSIDE the card so it doesn't get clipped */}
              <div
                className="absolute inset-0 px-3 flex items-center justify-center bg-noir-dark/92 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ clipPath: CARD_CLIP, border: `1px solid ${family.color}60` }}
              >
                <p className="text-xs italic font-playfair text-center leading-snug" style={{ color: family.color }}>
                  {family.motto}
                </p>
              </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detail panel — only shows for selected family */}
      <div ref={detailRef} className="max-w-2xl w-full min-h-[220px] relative z-[3]">
        <AnimatePresence mode="wait">
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
              onClick={beginGame}
              disabled={isTransitioning}
              className="w-full font-playfair font-bold text-base py-5 transition-all duration-200 disabled:opacity-70"
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
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground text-sm">
              Select a family above to see their strengths. Use ← → to browse, Enter to confirm.
            </p>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Sticky bottom confirmation bar */}
      <AnimatePresence>
        {activeFamily && !isTransitioning && (
          <motion.div
            key="sticky-bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-0 left-0 right-0 z-[40] border-t border-border/40 bg-background/85 backdrop-blur-md"
            style={{ boxShadow: `0 -8px 24px rgba(0,0,0,0.55), inset 0 1px 0 ${activeFamily.color}30` }}
          >
            <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4 flex-wrap">
              <FamilyCrest familyId={activeFamily.id} color={activeFamily.color} size={32} />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground leading-none">Selected family</span>
                <span className="font-playfair text-base font-bold leading-tight" style={{ color: activeFamily.color }}>
                  {activeFamily.name}
                </span>
              </div>
              <div className="h-8 w-px bg-border/40" />
              <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                <span>Difficulty: <span className="text-foreground font-bold">{difficulty}</span></span>
                <span>·</span>
                <span>Map: <span className="text-foreground font-bold">{mapSize}</span></span>
                <span>·</span>
                <span>Seed: <span className="text-foreground font-bold">{seedInput || 'random'}</span></span>
              </div>
              <Button
                onClick={beginGame}
                disabled={isTransitioning}
                className="ml-auto font-playfair font-bold text-sm px-6 py-5"
                style={{
                  backgroundColor: activeFamily.color,
                  color: '#000',
                  boxShadow: `0 0 18px ${activeFamily.color}55`,
                }}
              >
                Start as {activeFamily.name} →
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic transition overlay: pull-back through smoke */}
      <AnimatePresence>
        {isTransitioning && activeFamily && (
          <motion.div
            key="cine"
            className="fixed inset-0 z-[60] overflow-hidden pointer-events-auto"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {prefersReducedMotion ? (
              <motion.div
                className="absolute inset-0 bg-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            ) : (
              <>
                {/* Zoom-in layer: the sitdown table rushes toward camera.
                    Pure transform tween — no animated `filter` — so the whole
                    push composites on the GPU and reads as one smooth glide. */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${mafiaSitdownBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'saturate(0.85) brightness(0.9)',
                    transformOrigin: '50% 55%',
                    willChange: 'transform',
                  }}
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1.55 }}
                  transition={{ duration: 3.0, ease: [0.22, 0.61, 0.36, 1] }}
                />

                {/* Cheap GPU-composited darkening pass replaces the old
                    brightness() keyframes. */}
                <motion.div
                  className="absolute inset-0 bg-black"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.55 }}
                  transition={{ duration: 3.0, ease: 'linear' }}
                  style={{ willChange: 'opacity' }}
                />

                {/* Family-tinted vignette glow — single ease-out ramp */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(ellipse at center, transparent 30%, ${activeFamily.color}33 65%, rgba(0,0,0,0.85) 100%)`,
                    willChange: 'opacity',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ duration: 2.4, ease: 'easeOut' }}
                />

                {/* Smoke puffs rushing forward — blur baked into the gradient,
                    no runtime filter:blur() to keep the compositor cheap.
                    Staggered slightly later so they bloom after the image is
                    already moving. */}
                {[
                  { left: '35%', top: '55%', size: 900, delay: 0.95 },
                  { left: '65%', top: '45%', size: 800, delay: 1.15 },
                ].map((p, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      left: p.left,
                      top: p.top,
                      width: p.size,
                      height: p.size,
                      marginLeft: -p.size / 2,
                      marginTop: -p.size / 2,
                      background:
                        'radial-gradient(circle, rgba(180,170,160,0.35) 0%, rgba(40,35,30,0.18) 45%, transparent 70%)',
                      mixBlendMode: 'screen',
                      willChange: 'transform, opacity',
                    }}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: [0.4, 1.4, 2.2], opacity: [0, 0.9, 0.85] }}
                    transition={{ duration: 1.8, delay: p.delay, ease: [0.33, 1, 0.68, 1] }}
                  />
                ))}

                {/* Dense haze cap that fully covers screen at the end */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(20,18,16,0.85) 0%, rgba(0,0,0,0.95) 70%)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 0.95] }}
                  transition={{ duration: 3.0, times: [0, 0.7, 1], ease: 'easeIn' }}
                />

                {/* Title beat */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 1, 1, 0] }}
                  transition={{ duration: 3.0, times: [0, 0.63, 0.74, 0.9, 0.95], ease: 'easeOut' }}
                >
                  <div className="text-center px-6">
                    <div
                      className="font-playfair font-bold uppercase tracking-[0.25em] text-3xl sm:text-5xl"
                      style={{
                        color: activeFamily.color,
                        textShadow: `0 0 24px ${activeFamily.color}, 0 2px 8px rgba(0,0,0,0.9)`,
                      }}
                    >
                      The {activeFamily.name} Family
                    </div>
                    <div className="mt-3 text-xs sm:text-sm uppercase tracking-[0.4em] text-foreground/70">
                      {difficulty === 'hard' ? 'The Don' : difficulty === 'easy' ? 'Wiseguy' : 'Made Man'}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </TooltipProvider>
  );
};

export default FamilySelectionScreen;
