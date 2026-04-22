import React, { useState, useMemo } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  RotateCcw, DollarSign, Map, Crosshair, Users, Building2,
  Handshake, Shield, Siren, Layers, Zap, Trophy, Search, BookOpen
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  keywords: string[];
  content: React.ReactNode;
}

interface GameGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const Stat = ({ label, value, color = 'text-mafia-gold' }: { label: string; value: string; color?: string }) => (
  <div className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className={`text-xs font-bold ${color}`}>{value}</span>
  </div>
);

const Tip = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-accent/30 border border-accent/50 rounded px-3 py-2 text-xs text-accent-foreground mt-2">
    💡 {children}
  </div>
);

const sections: GuideSection[] = [
  {
    id: 'turns',
    title: 'Turn Structure',
    icon: <RotateCcw className="h-4 w-4" />,
    keywords: ['turn', 'deploy', 'tactical', 'action', 'phase', 'step', 'skip'],
    content: (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">Each turn has 3 sequential steps:</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">Step 1</Badge>
            <span className="text-xs font-semibold">DEPLOY</span>
            <span className="text-xs text-muted-foreground">— Move units & spawn reserves</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">Step 2</Badge>
            <span className="text-xs font-semibold">TACTICAL</span>
            <span className="text-xs text-muted-foreground">— Scout, fortify, recruit (3 actions)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">Step 3</Badge>
            <span className="text-xs font-semibold">ACTION</span>
            <span className="text-xs text-muted-foreground">— Combat, economy, diplomacy</span>
          </div>
        </div>
        <Tip>Use "Skip to Action Phase" to jump straight to combat if no deployment needed.</Tip>
      </div>
    ),
  },
  {
    id: 'resources',
    title: 'Resources',
    icon: <DollarSign className="h-4 w-4" />,
    keywords: ['money', 'soldiers', 'respect', 'influence', 'resource', 'income'],
    content: (
      <div className="space-y-2">
        <Stat label="💰 Money" value="Fund operations, recruit, build" color="text-green-400" />
        <Stat label="👥 Soldiers" value="Your fighting force" color="text-red-400" />
        <Stat label="⭐ Respect" value="Unlocks phases & abilities" color="text-yellow-400" />
        <Stat label="🔮 Influence" value="Territory expansion power" color="text-purple-400" />
        <div className="space-y-1 mt-2">
          <p className="text-xs font-semibold">Diminishing Returns (Respect & Influence):</p>
          <Stat label="0–59" value="100% passive gain" color="text-green-400" />
          <Stat label="60–74" value="60% passive gain" color="text-yellow-400" />
          <Stat label="75–89" value="35% passive gain" color="text-orange-400" />
          <Stat label="90–100" value="15% passive gain" color="text-red-400" />
          <Stat label="Decay above 70" value="-1.0/turn (vs -0.5 below)" color="text-red-400" />
        </div>
        <Tip>Respect gates phase progression. Passive gains slow above 60 — combat rewards (Hits, expansion) bypass diminishing returns and remain the fastest path to 80+.</Tip>
      </div>),
  },
  {
    id: 'territory',
    title: 'Territory',
    icon: <Map className="h-4 w-4" />,
    keywords: ['claim', 'extort', 'abandon', 'territory', 'hex', 'erosion', 'expansion', 'neutral'],
    content: (
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold">Phase 1-2 Actions:</p>
          <Stat label="🏴 Claim Territory" value="Take neutral/rival hex (unit required)" />
          <Stat label="💰 Extort Business" value="Shake down businesses for income" />
          <Stat label="🚪 Abandon Territory" value="Release a hex to cut maintenance" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold">Phase 3+ (Passive Only):</p>
          <Stat label="Erosion" value="Unprotected hex → neutral in 3 turns" color="text-red-400" />
          <Stat label="Expansion" value="Adjacent neutral hex → yours in 2 turns" color="text-green-400" />
          <Stat label="Protection Range" value="2 hexes from unit/business/safehouse" />
          <Stat label="Erosion Loss" value="-2 Respect, -3 Influence per hex" color="text-red-400" />
          <Stat label="Expansion Gain" value="+2 Respect, +3 Influence per hex" color="text-green-400" />
        </div>
        <Tip>In Phase 3, position units strategically — manual claiming is disabled!</Tip>
      </div>
    ),
  },
  {
    id: 'combat',
    title: 'Combat',
    icon: <Crosshair className="h-4 w-4" />,
    keywords: ['hit', 'attack', 'blind', 'scouted', 'planned', 'combat', 'heat', 'kill'],
    content: (
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold">Hit Types & Success Rates:</p>
          <Stat label="🎲 Blind Hit (unscouted)" value="40-60% success, +15 heat" color="text-red-400" />
          <Stat label="🔍 Scouted Hit" value="60-80% success, +10 heat" color="text-yellow-400" />
          <Stat label="🎯 Planned Hit (Phase 2+)" value="85-95% success, +5 heat" color="text-green-400" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold">Rewards:</p>
          <Stat label="Blind Hit Bonus" value="+20 Respect, +20 Fear, +5 Influence" />
          <Stat label="Planned Hit Bonus" value="+10 Respect, +10 Fear, 0 casualties" />
        </div>
        <Tip>Planned Hits cost more time but guarantee zero attacker casualties on success.</Tip>
      </div>
    ),
  },
  {
    id: 'units',
    title: 'Units',
    icon: <Users className="h-4 w-4" />,
    keywords: ['soldier', 'capo', 'unit', 'promote', 'loyalty', 'toughness', 'movement', 'recruit'],
    content: (
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold">Soldiers:</p>
          <Stat label="Movement" value="1 hex/move, max 2 moves/turn" />
          <Stat label="Free Travel" value="Unlimited on connected territory" />
          <Stat label="Recruitment" value="$3,000 (loyal) or $1,500 (mercenary)" />
          <Stat label="Toughness" value="+0.25/claim, +0.3/extort" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold">Capos (Promoted Soldiers):</p>
          <Stat label="Moves/Turn" value="2 moves" />
          <Stat label="Fly Range" value="2 hexes (Phase 1) · 4 hexes (Phase 2+)" />
          <Stat label="Auto-Claim" value="1 contested claim per turn" />
          <Stat label="Abilities" value="Scout 2-hex, build safehouses, negotiate" />
          <Stat label="Promotion" value="Requires loyalty 70+, toughness 3+" />
        </div>
        <Stat label="Max per Hex" value="2 units (HQ unlimited)" />
        <Tip>Deploy existing HQ units before spawning new reserves to save money.</Tip>
      </div>
    ),
  },
  {
    id: 'economy',
    title: 'Economy',
    icon: <Building2 className="h-4 w-4" />,
    keywords: ['business', 'income', 'maintenance', 'supply', 'legal', 'construction', 'extort', 'money'],
    content: (
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold">Business Types:</p>
          <Stat label="🎰 Gambling Den" value="High income, high heat" />
          <Stat label="💃 Brothel" value="Moderate income" />
          <Stat label="💳 Loan Sharking" value="Steady income" />
          <Stat label="🏪 Store Front" value="Low heat, legal cover" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold">Costs:</p>
          <Stat label="Soldier Upkeep" value="Per soldier per turn" color="text-red-400" />
          <Stat label="Empty Hex Cost" value="Maintenance on hexes with no business" color="text-red-400" />
          <Stat label="Supply Line Decay" value="10% income loss if severed" color="text-red-400" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold">Legal Construction:</p>
          <Stat label="Types" value="Restaurant, Store, Construction" />
          <Stat label="Speed" value="Varies by unit count on hex" />
        </div>
        <Tip>Built businesses earn more than extorted ones but take time to construct.</Tip>
      </div>
    ),
  },
  {
    id: 'diplomacy',
    title: 'Diplomacy',
    icon: <Handshake className="h-4 w-4" />,
    keywords: ['ceasefire', 'alliance', 'pact', 'negotiate', 'sitdown', 'send word', 'supply deal', 'tension', 'war'],
    content: (
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold">Boss-Level (Family-wide):</p>
          <Stat label="Ceasefire" value="No attacks for set turns" />
          <Stat label="Alliance" value="Full cooperation pact" />
          <Stat label="Supply Deal" value="Temporary access to rival supply nodes" />
          <Stat label="Commission Vote" value="Phase 4 diplomatic victory path" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold">Capo-Level:</p>
          <Stat label="Send Word" value="2-turn territory negotiation (Phase 2+)" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold">Tension System:</p>
          <Stat label="Scale" value="0–100 between each family pair" />
          <Stat label="Auto-War" value="Triggers at high tension" color="text-red-400" />
          <Stat label="Treachery" value="Breaking pacts = lasting debuff" color="text-red-400" />
        </div>
        <Tip>Boss negotiation success: +1% per 4 Respect, +1% per 5 Influence. Treachery debuff: -20%.</Tip>
        <Tip>Boss Sitdown ($2,000) teleports soldiers to HQ for emergency defense.</Tip>
      </div>
    ),
  },
  {
    id: 'tactical',
    title: 'Tactical Actions',
    icon: <Shield className="h-4 w-4" />,
    keywords: ['scout', 'fortify', 'safehouse', 'escort', 'recruit', 'tactical', 'action budget'],
    content: (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">3-action budget per turn during Tactical Phase:</p>
        <div className="space-y-1">
          <Stat label="🔍 Scout" value="Reveal enemy info (1-hex soldier, 2-hex capo)" />
          <Stat label="🏰 Fortify" value="+25% defense bonus, max 4 per family" />
          <Stat label="🏠 Safehouse" value="$2,500, deploy node + 10% defense" />
          <Stat label="👥 Recruit" value="$3,000 loyal / $1,500 mercenary" />
        </div>
        <Stat label="Intel Decay" value="Fresh → Stale over time" color="text-yellow-400" />
        <Tip>Fresh intel gives combat bonuses. Re-scout before major attacks!</Tip>
        <Tip>Soldiers can't see rival units by proximity. Reveal via scout, rat in their family, Captain bribe (target family only), Chief/Mayor bribe (all rivals, map-wide), pact, or capo vision.</Tip>
      </div>
    ),
  },
  {
    id: 'police',
    title: 'Police & Heat',
    icon: <Siren className="h-4 w-4" />,
    keywords: ['heat', 'police', 'arrest', 'corruption', 'bribe', 'prosecution', 'rico', 'lawyer'],
    content: (
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold">Heat Tiers:</p>
          <Stat label="Tier 1 (Low)" value="Minor income penalty" color="text-green-400" />
          <Stat label="Tier 2 (Medium)" value="Random raids, arrests" color="text-yellow-400" />
          <Stat label="Tier 3 (High)" value="Frequent raids, soldier losses" color="text-orange-400" />
          <Stat label="Tier 4 (Critical)" value="RICO timer — game over risk!" color="text-red-400" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold">Corruption Tiers:</p>
          <Stat label="Patrol Officer" value="Small heat reduction (no intel)" />
          <Stat label="Police Captain" value="Reveals TARGET family's units & fortifications" />
          <Stat label="Police Chief" value="Reveals ALL rivals' units & intel (map-wide)" />
          <Stat label="Mayor" value="Full map intel + maximum protection (all rivals)" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold">Counter-Heat Actions:</p>
          <Stat label="Public Appearance" value="Reduce heat (1 action)" />
          <Stat label="Charitable Donation" value="Reduce heat + respect" />
          <Stat label="Hire Lawyer" value="Fight prosecution risk" />
        </div>
        <Tip>Prosecution Risk = (Heat × 0.4) + (Informants). Keep heat low!</Tip>
      </div>
    ),
  },
  {
    id: 'phases',
    title: 'Progression Phases',
    icon: <Layers className="h-4 w-4" />,
    keywords: ['phase', 'milestone', 'unlock', 'progression', 'gate'],
    content: (
      <div className="space-y-3">
        <div className="space-y-1">
          <Stat label="Phase 1 — Foundation" value="Basic movement, claiming, combat" />
          <Stat label="Phase 2 — Expansion" value="Planned Hits, Send Word, extortion" />
          <Stat label="Phase 3 — Influence" value="Passive expansion, erosion, hitmen" />
          <Stat label="Phase 4 — Endgame" value="HQ Assault, Commission Vote" />
        </div>
        <Tip>Each phase unlocks permanently when you hit its Respect milestone.</Tip>
      </div>
    ),
  },
  {
    id: 'special',
    title: 'Special Actions',
    icon: <Zap className="h-4 w-4" />,
    keywords: ['hitman', 'hq assault', 'boss sitdown', 'family power', 'mattresses', 'war summit'],
    content: (
      <div className="space-y-3">
        <div className="space-y-1">
          <Stat label="🗡️ Hitman Contract" value="$30,000, Phase 3, kill any known unit" />
          <Stat label="💀 HQ Assault" value="Phase 4 — eliminate a rival family" />
          <Stat label="📋 Boss Sitdown" value="$2,000 — teleport soldiers to HQ" />
          <Stat label="🛏️ Go to the Mattresses" value="Defensive war stance" />
          <Stat label="📢 War Summit" value="Rally allies for coordinated attack" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold">Family Powers (Tactical Phase):</p>
          <Stat label="Each family" value="1 unique active ability" />
          <Stat label="👑 Colombo — Persico Succession" value="Active: click then select a soldier to instantly promote to Capo. One use per game." color="text-purple-400" />
        </div>
        <Tip>Hitman contracts bypass normal combat — great for eliminating key Capos.</Tip>
      </div>
    ),
  },
  {
    id: 'victory',
    title: 'Victory Conditions',
    icon: <Trophy className="h-4 w-4" />,
    keywords: ['victory', 'win', 'territory', 'commission', 'elimination', 'game over', 'bankruptcy'],
    content: (
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold">Win Conditions:</p>
          <Stat label="🏆 Territory Dominance" value="Control 80% of all hexes" color="text-yellow-400" />
          <Stat label="🗳️ Commission Vote" value="Phase 4 diplomatic victory" color="text-blue-400" />
          <Stat label="💀 Elimination" value="Destroy all rival HQs" color="text-red-400" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold">Lose Conditions:</p>
          <Stat label="💸 Bankruptcy" value="Run out of money" color="text-red-400" />
          <Stat label="⚖️ RICO" value="Prosecution timer expires" color="text-red-400" />
          <Stat label="💀 HQ Destroyed" value="Rival assaults your HQ" color="text-red-400" />
        </div>
        <Tip>Victory target scales by map size. Check the Victory Tracker in the HUD!</Tip>
      </div>
    ),
  },
];

const GameGuide: React.FC<GameGuideProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return sections;
    const q = search.toLowerCase();
    return sections.filter(
      s => s.title.toLowerCase().includes(q) || s.keywords.some(k => k.includes(q))
    );
  }, [search]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[420px] sm:max-w-[420px] p-0 flex flex-col">
        <SheetHeader className="p-4 pb-2 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-5 w-5 text-mafia-gold" />
            Quick Reference Guide
          </SheetTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search mechanics..."
              className="pl-8 h-8 text-xs"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No sections match "{search}"
              </p>
            ) : (
              <Accordion type="multiple" className="space-y-1">
                {filtered.map(section => (
                  <AccordionItem key={section.id} value={section.id} className="border rounded-md px-3">
                    <AccordionTrigger className="py-2.5 text-sm hover:no-underline">
                      <div className="flex items-center gap-2">
                        {section.icon}
                        {section.title}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      {section.content}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default GameGuide;
