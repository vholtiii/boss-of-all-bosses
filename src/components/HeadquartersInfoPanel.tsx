import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import bossIcon from '@/assets/boss-icon.png';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  SITDOWN_COST, SITDOWN_DEFENSE_PER_SOLDIER,
  DECLARE_WAR_COST, MATTRESSES_COST, MATTRESSES_COOLDOWN, MATTRESSES_DURATION, MATTRESSES_DEFENSE_BONUS, MATTRESSES_HQ_BONUS, MATTRESSES_INCOME_PENALTY,
  WAR_SUMMIT_COST, WAR_SUMMIT_COOLDOWN, WAR_SUMMIT_DURATION, WAR_SUMMIT_COMBAT_BONUS, WAR_SUMMIT_FEAR_BONUS, WAR_SUMMIT_HEAT_COST,
  WAR_MAX_SIMULTANEOUS,
  MattressesState, WarSummitState,
} from '@/types/game-mechanics';
import { SUPPLY_NODE_CONFIG, SupplyNodeType } from '@/types/game-mechanics';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { 
  DollarSign, 
  Users, 
  Shield, 
  Building2, 
  X,
  Zap,
  ChevronDown,
  ChevronUp,
  MapPin,
  Store,
  Map,
  Link2,
  Unlink
} from 'lucide-react';

interface HexBusiness {
  q: number;
  r: number;
  s: number;
  district: string;
  businessType: string;
  income: number;
  baseIncome?: number;
  isLegal: boolean;
  isExtorted: boolean;
  isPlayerBuilt?: boolean;
  underConstruction?: boolean;
  collectionRate?: number;
  collectionReason?: string;
  supplyConnected?: boolean;
  supplyDependency?: string; // e.g. 'liquor_route', 'docks'
}

interface HeadquartersInfoPanelProps {
  family: string;
  headquarters: {
    q: number;
    r: number;
    s: number;
    district: string;
  };
  units: {
    soldiers: Array<{ q: number; r: number; s: number; id: string }>;
    capos: Array<{ q: number; r: number; s: number; id: string }>;
    boss: { q: number; r: number; s: number; id: string };
  };
  hexBusinesses?: HexBusiness[];
  finances?: { totalIncome: number; totalExpenses: number; legalProfit: number; illegalProfit: number; totalProfit: number; dirtyMoney: number; cleanMoney: number; legalCosts: number; soldierMaintenance?: number; communityUpkeep?: number; arrestPenalty?: number; heatPenalty?: number };
  totalMoney?: number;
  territoryCount?: number;
  onClose: () => void;
  onSelectUnitFromHeadquarters?: (unitType: 'soldier' | 'capo', family: string) => void;
  movementPhase?: boolean;
  playerFamily?: string;
  deployedUnits?: any[];
  hexMap?: any[];
  bossHighlightHex?: { q: number; r: number; s: number } | null;
  onBossHighlightHex?: (hex: { q: number; r: number; s: number } | null) => void;
  turnPhase?: string;
  currentTurn?: number;
  sitdownCooldownUntil?: number;
  onCallSitdown?: (soldierIds: string[]) => void;
  detectedThreats?: Array<{ family: string; targetUnitId: string; turnsRemaining: number; detectedVia: string; detectedOnTurn: number }>;
  onBossNegotiate?: (targetFamily: string) => void;
  negotiationUsedThisTurn?: boolean;
  activePacts?: {
    ceasefires: Array<{ id: string; family: string; turnsRemaining: number; active: boolean }>;
    alliances: Array<{ id: string; alliedFamily: string; turnsRemaining: number; active: boolean; conditions: Array<{ type: string }> }>;
    shareProfits: Array<{ id: string; targetFamily: string; turnsRemaining: number; active: boolean; hexQ: number; hexR: number; hexS: number }>;
    safePassages: Array<{ id: string; targetFamily: string; turnsRemaining: number; active: boolean }>;
  };
  enemyFamilies?: string[];
  // Boss actions
  onDeclareWar?: (targetFamily: string) => void;
  onGoToMattresses?: () => void;
  onWarSummit?: () => void;
  onLayLow?: () => void;
  mattressesState?: MattressesState;
  warSummitState?: WarSummitState;
  mattressesCooldownUntil?: number;
  warSummitCooldownUntil?: number;
  layLowActiveUntil?: number;
  layLowAfterglowUntil?: number;
  activeWars?: Array<{ family1: string; family2: string; turnsRemaining: number }>;
  actionsRemaining?: number;
  gamePhase?: number;
  flippedSoldiers?: Array<{ unitId: string; family: string; flippedByFamily: string; hqQ: number; hqR: number; hqS: number }>;
  // Purge Ranks
  soldierStats?: Record<string, any>;
  onEliminateSoldier?: (soldierId: string) => void;
}

const familyColors: Record<string, string> = {
  gambino: '#42D3F2',
  genovese: '#2AA63E', 
  lucchese: '#4169E1',
  bonanno: '#DC143C',
  colombo: '#8A2BE2',
};

const familyNames: Record<string, string> = {
  gambino: 'Gambino',
  genovese: 'Genovese',
  lucchese: 'Lucchese', 
  bonanno: 'Bonanno',
  colombo: 'Colombo',
};

export const HeadquartersInfoPanel: React.FC<HeadquartersInfoPanelProps> = ({
  family,
  headquarters,
  units,
  hexBusinesses = [],
  finances,
  totalMoney,
  territoryCount = 0,
  onClose,
  onSelectUnitFromHeadquarters,
  movementPhase = false,
  playerFamily,
  deployedUnits = [],
  hexMap = [],
  bossHighlightHex,
  onBossHighlightHex,
  turnPhase,
  currentTurn = 0,
  sitdownCooldownUntil = 0,
  onCallSitdown,
  detectedThreats = [],
  onBossNegotiate,
  negotiationUsedThisTurn = false,
  activePacts,
  enemyFamilies = [],
  onDeclareWar,
  onGoToMattresses,
  onWarSummit,
  onLayLow,
  mattressesState,
  warSummitState,
  mattressesCooldownUntil = 0,
  warSummitCooldownUntil = 0,
  layLowActiveUntil = 0,
  layLowAfterglowUntil = 0,
  activeWars = [],
  actionsRemaining = 0,
  gamePhase = 1,
  flippedSoldiers = [],
  soldierStats = {},
  onEliminateSoldier,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [bossExpanded, setBossExpanded] = useState(false);
  const [sitdownOpen, setSitdownOpen] = useState(false);
  const [selectedSitdownIds, setSelectedSitdownIds] = useState<string[]>([]);
  const [declareWarOpen, setDeclareWarOpen] = useState(false);

  // Collapsible section states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    financial: true,
    units: true,
    boss: false,
    threats: false,
    strategic: false,
    diplomacy: false,
  });
  const toggleSection = (key: string) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const isPlayerFamily = family === playerFamily;
  const familyColor = familyColors[family] || '#696969';
  const familyName = familyNames[family] || family.toUpperCase();

  const soldiersAtHQ = units.soldiers.filter(soldier => 
    soldier.q === headquarters.q && soldier.r === headquarters.r && soldier.s === headquarters.s
  ).length;
  
  const caposAtHQ = units.capos.filter(capo => 
    capo.q === headquarters.q && capo.r === headquarters.r && capo.s === headquarters.s
  ).length;
  
  const deployedSoldiers = units.soldiers.length - soldiersAtHQ;
  const deployedCapos = units.capos.length - caposAtHQ;

  // Get deployed units for boss overview
  const familyDeployedUnits = deployedUnits.filter((u: any) => u.family === family);
  const deployedUnitsList = familyDeployedUnits.filter((u: any) => 
    !(u.q === headquarters.q && u.r === headquarters.r && u.s === headquarters.s)
  );
  const hqUnitsList = familyDeployedUnits.filter((u: any) => 
    u.q === headquarters.q && u.r === headquarters.r && u.s === headquarters.s
  );

  const getDistrictForHex = (q: number, r: number, s: number) => {
    const hex = hexMap.find((h: any) => h.q === q && h.r === r && h.s === s);
    return hex?.district || 'Unknown';
  };

  const isHexHighlighted = (q: number, r: number, s: number) => {
    return bossHighlightHex?.q === q && bossHighlightHex?.r === r && bossHighlightHex?.s === s;
  };

  const handleHighlightToggle = (q: number, r: number, s: number) => {
    if (!onBossHighlightHex) return;
    if (isHexHighlighted(q, r, s)) {
      onBossHighlightHex(null);
    } else {
      onBossHighlightHex({ q, r, s });
    }
  };

  // Derived business stats
  const ownedBusinesses = hexBusinesses.filter(b => !b.isExtorted);
  const extortedBusinesses = hexBusinesses.filter(b => b.isExtorted);

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, x: -80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -80 }}
      transition={{ type: 'tween', duration: 0.25 }}
      className="fixed left-44 top-64 bottom-12 z-40 w-96 overflow-hidden"
    >
      <Card className="bg-gradient-to-br from-noir-dark to-background border-noir-light shadow-xl h-full flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-mafia-gold font-playfair text-base">
              <Building2 className="h-5 w-5" style={{ color: familyColor }} />
              {familyName} FAMILY HQ
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground font-source">
            {headquarters.district} • {headquarters.q}, {headquarters.r}, {headquarters.s}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3 pt-0 pb-4 flex-1 overflow-y-auto pr-2">
          {/* Financial Overview — Player Only */}
          {isPlayerFamily && finances ? (
            <Collapsible open={openSections.financial} onOpenChange={() => toggleSection('financial')} className="space-y-2">
              <CollapsibleTrigger className="w-full flex items-center justify-between text-sm font-semibold text-mafia-gold font-playfair hover:opacity-80 transition-opacity">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial Overview
                </span>
                <span className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono ${finances.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {finances.totalProfit >= 0 ? '+' : ''}${finances.totalProfit.toLocaleString()}/t
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSections.financial ? 'rotate-180' : ''}`} />
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2">

              {/* Cash on Hand */}
              {totalMoney !== undefined && (
                <div className="bg-mafia-gold/15 border border-mafia-gold/30 rounded-lg p-2">
                  <div className="text-xs text-mafia-gold font-medium">💰 Cash on Hand</div>
                  <div className="text-lg font-bold text-mafia-gold">
                    ${totalMoney.toLocaleString()}
                  </div>
                </div>
              )}
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-1.5 mb-1">
                <div className="text-[10px] text-blue-400 font-medium mb-1">Gross Income — ${finances.totalIncome.toLocaleString()}/turn</div>
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-green-300/80">📋 Legal</span>
                    <span className="text-green-400 font-semibold">${finances.legalProfit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span className="text-red-300/80">💰 Illegal</span>
                    <span className="text-red-400 font-semibold">${finances.illegalProfit.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-mafia-gold/10 border border-mafia-gold/20 rounded-lg p-2">
                <div className="text-xs text-mafia-gold font-medium">Net Income/Turn</div>
                <div className="text-base font-bold text-mafia-gold">
                  ${finances.totalProfit.toLocaleString()}
                </div>
              </div>

              {/* Expenses Breakdown */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-1.5">
                <div className="text-[10px] text-orange-400 font-medium mb-1">Expenses — ${finances.totalExpenses.toLocaleString()}/turn</div>
                <div className="space-y-0.5">
                  {(finances.soldierMaintenance ?? 0) > 0 && (
                    <div className="flex justify-between text-[9px]">
                      <span className="text-orange-300/80">🔫 Soldier Maintenance</span>
                      <span className="text-orange-400 font-semibold">-${(finances.soldierMaintenance ?? 0).toLocaleString()}</span>
                    </div>
                  )}
                  {(finances.communityUpkeep ?? 0) > 0 && (
                    <div className="flex justify-between text-[9px]">
                      <span className="text-orange-300/80">🏘️ Community Upkeep</span>
                      <span className="text-orange-400 font-semibold">-${(finances.communityUpkeep ?? 0).toLocaleString()}</span>
                    </div>
                  )}
                  {(finances.arrestPenalty ?? 0) > 0 && (
                    <div className="flex justify-between text-[9px]">
                      <span className="text-red-300/80">🚔 Arrest Penalties</span>
                      <span className="text-red-400 font-semibold">-${(finances.arrestPenalty ?? 0).toLocaleString()}</span>
                    </div>
                  )}
                  {(finances.heatPenalty ?? 0) > 0 && (
                    <div className="flex justify-between text-[9px]">
                      <span className="text-red-300/80">🔥 Heat Penalties</span>
                      <span className="text-red-400 font-semibold">-${(finances.heatPenalty ?? 0).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dirty / Clean Money */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-1.5">
                  <div className="text-[10px] text-yellow-400 font-medium">Dirty $</div>
                  <div className="text-xs font-bold text-yellow-400">${finances.dirtyMoney.toLocaleString()}</div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-1.5">
                  <div className="text-[10px] text-emerald-400 font-medium">Clean $</div>
                  <div className="text-xs font-bold text-emerald-400">${finances.cleanMoney.toLocaleString()}</div>
                </div>
              </div>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            /* Rival HQ — limited info */
            <Collapsible open={openSections.financial} onOpenChange={() => toggleSection('financial')} className="space-y-2">
              <CollapsibleTrigger className="w-full flex items-center justify-between text-sm font-semibold text-mafia-gold font-playfair hover:opacity-80 transition-opacity">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Rival Intelligence
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.financial ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/20 border border-border/30 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground font-medium">Businesses</div>
                    <div className="text-sm font-bold text-foreground">{hexBusinesses.length}</div>
                  </div>
                  <div className="bg-muted/20 border border-border/30 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground font-medium">Territory</div>
                    <div className="text-sm font-bold text-foreground">{territoryCount} hexes</div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Territory Count — Player */}
          {isPlayerFamily && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 flex items-center gap-2">
              <Map className="h-4 w-4 text-blue-400" />
              <div>
                <div className="text-xs text-blue-400 font-medium">Territory</div>
                <div className="text-sm font-bold text-blue-400">{territoryCount} hexes</div>
              </div>
            </div>
          )}

          {/* Active Threats — Player Only */}
          {isPlayerFamily && detectedThreats && detectedThreats.length > 0 && (
            <Collapsible open={openSections.threats} onOpenChange={() => toggleSection('threats')} className="space-y-1.5">
              <CollapsibleTrigger className="w-full flex items-center justify-between text-sm font-semibold text-destructive font-playfair hover:opacity-80 transition-opacity">
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  ⚠️ Active Threats
                </span>
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] h-4 border-destructive/40 text-destructive">{detectedThreats.length}</Badge>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSections.threats ? 'rotate-180' : ''}`} />
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1.5">
                {detectedThreats.map((threat, i) => {
                  const sourceLabels: Record<string, string> = {
                    scout: '🕵️ Street Scout',
                    bribe_captain: '👮 Police Captain',
                    bribe_chief: '🏛️ Police Chief',
                    bribe_mayor: '🏛️ Mayor\'s Office',
                  };
                  const targetUnit = deployedUnits.find((u: any) => u.id === threat.targetUnitId);
                  const targetName = targetUnit ? (targetUnit.name || `Capo ${threat.targetUnitId.slice(0, 4)}`) : 'Unknown';
                  const isUrgent = threat.turnsRemaining <= 1;
                  return (
                    <div
                      key={i}
                      className={`rounded-lg p-2 text-[11px] border ${
                        isUrgent
                          ? 'bg-red-500/20 border-red-500/40 text-red-300'
                          : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                      }`}
                    >
                      <div className="font-bold capitalize">
                        {threat.family} → {targetName}
                      </div>
                      <div className="text-[10px] opacity-80">
                        {threat.turnsRemaining} turn{threat.turnsRemaining !== 1 ? 's' : ''} until execution
                      </div>
                      <div className="text-[10px] opacity-60 italic">
                        Source: {sourceLabels[threat.detectedVia] || 'Unknown'}
                      </div>
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          )}

          <Collapsible open={openSections.units} onOpenChange={() => toggleSection('units')} className="space-y-2">
            <CollapsibleTrigger className="w-full flex items-center justify-between text-sm font-semibold text-mafia-gold font-playfair hover:opacity-80 transition-opacity">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Unit Status
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-normal">{units.soldiers.length}🔫 · {units.capos.length}⚡</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.units ? 'rotate-180' : ''}`} />
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Shield className="h-3 w-3 text-blue-400" />
                  <span className="text-xs font-medium text-blue-400">Soldiers</span>
                </div>
                <div className="text-sm font-bold text-blue-400">
                  {units.soldiers.length}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {soldiersAtHQ} at HQ • {deployedSoldiers} deployed
                </div>
              </div>
              
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Zap className="h-3 w-3 text-purple-400" />
                  <span className="text-xs font-medium text-purple-400">Capos</span>
                </div>
                <div className="text-sm font-bold text-purple-400">
                  {units.capos.length}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {caposAtHQ} at HQ • {deployedCapos} deployed
                </div>
              </div>
            </div>
            
            {/* Boss Card — clickable for player family */}
            <motion.div
              className={`bg-mafia-gold/10 border border-mafia-gold/30 rounded-lg p-2 flex items-center gap-3 ${isPlayerFamily ? 'cursor-pointer hover:border-mafia-gold/60 hover:bg-mafia-gold/20 transition-all' : ''}`}
              whileHover={isPlayerFamily ? { scale: 1.02 } : {}}
              whileTap={isPlayerFamily ? { scale: 0.98 } : {}}
              onClick={() => isPlayerFamily && setBossExpanded(!bossExpanded)}
            >
              <div className="w-10 h-10 rounded-full border-2 border-mafia-gold overflow-hidden bg-noir-dark flex items-center justify-center shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                <img
                  src={bossIcon}
                  alt="The Boss"
                  className="w-8 h-8 object-contain"
                  style={{ mixBlendMode: 'multiply' }}
                />
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-mafia-gold font-playfair">The Boss</div>
                <div className="text-[10px] text-muted-foreground">At Headquarters</div>
              </div>
              {isPlayerFamily && (
                bossExpanded ? <ChevronUp className="h-4 w-4 text-mafia-gold/60" /> : <ChevronDown className="h-4 w-4 text-mafia-gold/60" />
              )}
            </motion.div>

            {/* Boss Overview — expanded sub-panel */}
            <AnimatePresence>
              {bossExpanded && isPlayerFamily && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 pt-1">
                    {/* Deployed Units */}
                    <div>
                      <div className="text-xs font-semibold text-foreground/80 mb-1.5 flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Deployed Units ({deployedUnitsList.length})
                      </div>
                      {deployedUnitsList.length === 0 ? (
                        <div className="text-[10px] text-muted-foreground italic px-1">No units deployed</div>
                      ) : (
                        <ScrollArea className={deployedUnitsList.length > 4 ? 'h-64 pr-2' : 'pr-1'}>
                          <div className="space-y-1">
                            {deployedUnitsList.map((unit: any) => {
                              const district = getDistrictForHex(unit.q, unit.r, unit.s);
                              const highlighted = isHexHighlighted(unit.q, unit.r, unit.s);
                              return (
                                <button
                                  key={unit.id}
                                  onClick={() => handleHighlightToggle(unit.q, unit.r, unit.s)}
                                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors text-xs ${
                                    highlighted 
                                      ? 'bg-mafia-gold/20 border border-mafia-gold/40' 
                                      : 'bg-background/50 border border-border/50 hover:bg-accent/50'
                                  }`}
                                >
                                  <span className="text-sm">{unit.type === 'soldier' ? '🔫' : '⚡'}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-foreground truncate">{unit.name || (unit.type === 'soldier' ? 'Soldier' : 'Capo')}</div>
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-2.5 w-2.5" />
                                      {district}
                                    </div>
                                    {unit.type === 'soldier' && soldierStats[unit.id] && (() => {
                                      const ss = soldierStats[unit.id];
                                      return (
                                        <>
                                          <span className={`text-[9px] px-1 rounded mt-0.5 ${ss.loyalty >= 70 ? 'bg-green-500/20 text-green-400' : ss.loyalty >= 40 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>♥ {ss.loyalty}</span>
                                          {ss.markedForDeath && ss.markedTurnsRemaining > 0 && (
                                            <span className="text-[9px] px-1 rounded mt-0.5 bg-red-900/30 text-red-400 animate-pulse">
                                              ☠️ {ss.markedTurnsRemaining}t
                                            </span>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                  {highlighted && <div className="w-2 h-2 rounded-full bg-mafia-gold animate-pulse" />}
                                </button>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      )}
                      
                      {/* Units at HQ */}
                      {hqUnitsList.length > 0 && (
                        <div className="mt-1.5">
                          <div className="text-[10px] text-muted-foreground mb-1">At HQ ({hqUnitsList.length})</div>
                          <div className="space-y-1">
                            {hqUnitsList.map((unit: any) => (
                              <div
                                key={unit.id}
                                className="flex items-center gap-2 px-2 py-1 rounded bg-background/30 border border-border/30 text-xs"
                              >
                                <span className="text-sm">{unit.type === 'soldier' ? '🔫' : '⚡'}</span>
                                <span className="text-foreground/70">{unit.name || (unit.type === 'soldier' ? 'Soldier' : 'Capo')}</span>
                                <Badge variant="outline" className="text-[9px] ml-auto h-4">HQ</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Businesses from hex map */}
                    <div>
                      <div className="text-xs font-semibold text-foreground/80 mb-1.5 flex items-center gap-1">
                        <Store className="h-3 w-3" />
                        Businesses ({hexBusinesses.length})
                        {extortedBusinesses.length > 0 && (
                          <span className="text-[9px] text-muted-foreground ml-1">
                            ({ownedBusinesses.length} owned, {extortedBusinesses.length} extorted)
                          </span>
                        )}
                      </div>
                      {hexBusinesses.length === 0 ? (
                        <div className="text-[10px] text-muted-foreground italic px-1">No businesses controlled</div>
                      ) : (
                        <ScrollArea className={hexBusinesses.length > 4 ? 'h-64 pr-2' : 'pr-1'}>
                          <div className="space-y-1">
                            {hexBusinesses.map((biz, idx) => {
                              const highlighted = isHexHighlighted(biz.q, biz.r, biz.s);
                              return (
                                <button
                                  key={`${biz.q}-${biz.r}-${biz.s}-${idx}`}
                                  onClick={() => handleHighlightToggle(biz.q, biz.r, biz.s)}
                                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors text-xs ${
                                    highlighted 
                                      ? 'bg-mafia-gold/20 border border-mafia-gold/40' 
                                      : 'bg-background/50 border border-border/50 hover:bg-accent/50'
                                  }`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-foreground truncate flex items-center gap-1">
                                      {biz.businessType}
                                      <Badge 
                                        variant="outline" 
                                        className={`text-[9px] h-4 ${biz.isLegal ? 'text-green-400 border-green-400/30' : 'text-red-400 border-red-400/30'}`}
                                      >
                                        {biz.isLegal ? 'Legal' : 'Illegal'}
                                      </Badge>
                                      {biz.isExtorted && (
                                        <Badge variant="outline" className="text-[9px] h-4 text-yellow-400 border-yellow-400/30">
                                          Extorted
                                        </Badge>
                                      )}
                                      {biz.isPlayerBuilt && (
                                        <Badge variant="outline" className="text-[9px] h-4 text-blue-400 border-blue-400/30">
                                          🏗️ Built
                                        </Badge>
                                      )}
                                      {biz.supplyDependency != null && (
                                        biz.supplyConnected ? (
                                          <Badge variant="outline" className="text-[9px] h-4 text-green-400 border-green-400/30 flex items-center gap-0.5">
                                            <Link2 className="h-2.5 w-2.5" /> Supplied
                                          </Badge>
                                        ) : (
                                          <TooltipProvider delayDuration={200}>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Badge variant="outline" className="text-[9px] h-4 text-orange-400 border-orange-400/30 flex items-center gap-0.5 cursor-help">
                                                  <Unlink className="h-2.5 w-2.5" /> No Supply
                                                </Badge>
                                              </TooltipTrigger>
                                              <TooltipContent side="top" className="text-xs">
                                                Needs: {(() => {
                                                  const deps = biz.supplyDependency!.split(',');
                                                  return deps.map(d => SUPPLY_NODE_CONFIG[d.trim() as SupplyNodeType]?.label || d).join(' or ');
                                                })()}
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )
                                      )}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-2.5 w-2.5" />
                                      {biz.district}
                                      <span className="ml-auto flex items-center gap-1">
                                        {biz.underConstruction ? (
                                          <span className="text-yellow-400">🚧 $0</span>
                                        ) : (
                                          <>
                                            <span className="text-green-400">${biz.income.toLocaleString()}/turn</span>
                                            {biz.baseIncome !== undefined && biz.income !== biz.baseIncome && (
                                              <span className="text-muted-foreground/60" title={`Base: $${biz.baseIncome.toLocaleString()} — ${biz.collectionRate}% (${biz.collectionReason})`}>
                                                ({biz.collectionRate}%)
                                              </span>
                                            )}
                                          </>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                  {highlighted && <div className="w-2 h-2 rounded-full bg-mafia-gold animate-pulse" />}
                                </button>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Diplomacy — Boss Negotiation */}
            {isPlayerFamily && onBossNegotiate && (
              <div className="mt-2 space-y-2">
                <h4 className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
                  🏛️ Diplomacy
                </h4>
                
                {/* Active Pacts */}
                {activePacts && (
                  <div className="space-y-1">
                    {activePacts.ceasefires.filter(c => c.active).map(c => (
                      <div key={c.id} className="flex items-center justify-between text-[10px] px-2 py-1 rounded bg-accent/10 border border-accent/20">
                        <span>🤝 Ceasefire — <span className="capitalize">{c.family}</span></span>
                        <Badge variant="outline" className="text-[9px] h-4">{c.turnsRemaining}t</Badge>
                      </div>
                    ))}
                    {activePacts.alliances.filter(a => a.active).map(a => (
                      <div key={a.id} className="flex items-center justify-between text-[10px] px-2 py-1 rounded bg-primary/10 border border-primary/20">
                        <span>⚖️ Alliance — <span className="capitalize">{a.alliedFamily}</span></span>
                        <Badge variant="outline" className="text-[9px] h-4">{a.turnsRemaining}t</Badge>
                      </div>
                    ))}
                    {activePacts.shareProfits.filter(p => p.active).map(p => (
                      <div key={p.id} className="flex items-center justify-between text-[10px] px-2 py-1 rounded bg-green-500/10 border border-green-500/20">
                        <span>💰 Profits — <span className="capitalize">{p.targetFamily}</span></span>
                        <Badge variant="outline" className="text-[9px] h-4">{p.turnsRemaining}t</Badge>
                      </div>
                    ))}
                    {activePacts.safePassages.filter(p => p.active).map(p => (
                      <div key={p.id} className="flex items-center justify-between text-[10px] px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20">
                        <span>🛤️ Passage — <span className="capitalize">{p.targetFamily}</span></span>
                        <Badge variant="outline" className="text-[9px] h-4">{p.turnsRemaining}t</Badge>
                      </div>
                    ))}
                  </div>
                )}

                {/* Boss negotiate buttons */}
                {turnPhase === 'action' && enemyFamilies.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground">Negotiate ceasefire or alliance:</p>
                    <div className="flex flex-wrap gap-1">
                      {enemyFamilies.map(fam => (
                        <Button
                          key={fam}
                          variant="outline"
                          size="sm"
                          className="text-[10px] h-6 px-2 capitalize"
                          disabled={negotiationUsedThisTurn}
                          onClick={() => onBossNegotiate(fam)}
                        >
                          🏛️ {fam}
                        </Button>
                      ))}
                    </div>
                    {negotiationUsedThisTurn && (
                      <p className="text-[9px] text-muted-foreground italic">Cooldown — wait another turn</p>
                    )}
                  </div>
                )}
                {turnPhase !== 'action' && (
                  <p className="text-[10px] text-muted-foreground italic">Available during Action step</p>
                )}
              </div>
            )}

            {/* Call a Sitdown — Boss Action */}
            {isPlayerFamily && onCallSitdown && (
              (() => {
                const onCooldown = sitdownCooldownUntil > currentTurn;
                const cooldownLeft = sitdownCooldownUntil - currentTurn;
                const isActionPhase = turnPhase === 'action';
                const awayUnits = (deployedUnits || []).filter((u: any) =>
                  u.family === family &&
                  !(u.q === headquarters.q && u.r === headquarters.r && u.s === headquarters.s)
                );
                const sitdownPhaseLocked = gamePhase < 2;
                const canOpen = isActionPhase && !onCooldown && awayUnits.length > 0 && !sitdownPhaseLocked;

                return (
                  <div className="mt-2 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8 border-mafia-gold/30 text-mafia-gold hover:bg-mafia-gold/10"
                      disabled={!canOpen && !sitdownOpen}
                      onClick={() => {
                        if (sitdownOpen) {
                          setSitdownOpen(false);
                          setSelectedSitdownIds([]);
                        } else {
                          setSitdownOpen(true);
                          setSelectedSitdownIds([]);
                        }
                      }}
                    >
                      📋 Call a Sitdown {onCooldown ? `(${cooldownLeft} turns)` : `($${SITDOWN_COST.toLocaleString()})`}
                    </Button>

                    {sitdownPhaseLocked && !sitdownOpen && (
                       <p className="text-[10px] text-muted-foreground italic text-center">🔒 Unlocks in Phase 2</p>
                    )}
                    {!sitdownPhaseLocked && !isActionPhase && !sitdownOpen && (
                       <p className="text-[10px] text-muted-foreground italic text-center">Available during Action step</p>
                    )}

                    <AnimatePresence>
                      {sitdownOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-muted/20 border border-border/50 rounded-lg p-2 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-medium text-foreground">Select soldiers to recall</span>
                              <button
                                className="text-[10px] text-mafia-gold hover:underline"
                                onClick={() => {
                                  if (selectedSitdownIds.length === awayUnits.length) {
                                    setSelectedSitdownIds([]);
                                  } else {
                                    setSelectedSitdownIds(awayUnits.map((u: any) => u.id));
                                  }
                                }}
                              >
                                {selectedSitdownIds.length === awayUnits.length ? 'Deselect All' : 'Select All'}
                              </button>
                            </div>
                            <ScrollArea className="max-h-32">
                              <div className="space-y-1">
                                {awayUnits.map((unit: any) => {
                                  const district = (() => {
                                    const hex = hexMap.find((h: any) => h.q === unit.q && h.r === unit.r && h.s === unit.s);
                                    return hex?.district || '???';
                                  })();
                                  const checked = selectedSitdownIds.includes(unit.id);
                                  return (
                                    <label
                                      key={unit.id}
                                      className="flex items-center gap-2 px-2 py-1 rounded bg-background/50 border border-border/30 cursor-pointer hover:bg-accent/30 text-xs"
                                    >
                                      <Checkbox
                                        checked={checked}
                                        onCheckedChange={(v) => {
                                          if (v) setSelectedSitdownIds(prev => [...prev, unit.id]);
                                          else setSelectedSitdownIds(prev => prev.filter(id => id !== unit.id));
                                        }}
                                      />
                                      <span className="text-sm">{unit.type === 'soldier' ? '🔫' : '⚡'}</span>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-foreground truncate">{unit.name || (unit.type === 'soldier' ? 'Soldier' : 'Capo')}</div>
                                        <div className="text-[10px] text-muted-foreground">{district}</div>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </ScrollArea>
                            <div className="text-[10px] text-muted-foreground">
                              +{SITDOWN_DEFENSE_PER_SOLDIER}% HQ defense per soldier at HQ
                            </div>
                            <Button
                              size="sm"
                              className="w-full text-xs h-7 bg-mafia-gold text-background hover:bg-mafia-gold/80"
                              disabled={selectedSitdownIds.length === 0}
                              onClick={() => {
                                onCallSitdown(selectedSitdownIds);
                                setSitdownOpen(false);
                                setSelectedSitdownIds([]);
                              }}
                            >
                              Confirm Sitdown ({selectedSitdownIds.length} unit{selectedSitdownIds.length !== 1 ? 's' : ''})
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })()
            )}

            {/* Active State Badges */}
            {isPlayerFamily && (mattressesState?.active || warSummitState?.active) && (
              <div className="mt-2 space-y-1">
                {mattressesState?.active && (
                  <Badge variant="outline" className="w-full justify-center text-xs border-amber-500/50 text-amber-400 bg-amber-500/10">
                    🛏️ At the Mattresses ({mattressesState.turnsRemaining} turn{mattressesState.turnsRemaining !== 1 ? 's' : ''})
                  </Badge>
                )}
                {warSummitState?.active && (
                  <Badge variant="outline" className="w-full justify-center text-xs border-red-500/50 text-red-400 bg-red-500/10">
                    ⚔️ War Summit ({warSummitState.turnsRemaining} turn{warSummitState.turnsRemaining !== 1 ? 's' : ''})
                  </Badge>
                )}
              </div>
            )}

            {/* Declare War — Boss Action (Phase 3+) */}
            {isPlayerFamily && onDeclareWar && (
              (() => {
                const isActionPhase = turnPhase === 'action';
                const playerWars = activeWars.filter(w => w.family1 === playerFamily || w.family2 === playerFamily).length;
                const atMaxWars = playerWars >= WAR_MAX_SIMULTANEOUS;
                const noActions = actionsRemaining <= 0;
                const warTargets = enemyFamilies.filter(f => {
                  const atWar = activeWars.some(w => (w.family1 === f && w.family2 === playerFamily) || (w.family2 === f && w.family1 === playerFamily));
                  const hasPact = activePacts?.ceasefires?.some(c => c.active && c.family === f) || activePacts?.alliances?.some(a => a.active && a.alliedFamily === f);
                  return !atWar && !hasPact;
                });

                return (
                  <div className="mt-2 space-y-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8 border-red-500/30 text-red-400 hover:bg-red-500/10"
                      disabled={!isActionPhase || atMaxWars || noActions || warTargets.length === 0}
                      onClick={() => setDeclareWarOpen(!declareWarOpen)}
                    >
                      ⚔️ Declare War (${ DECLARE_WAR_COST.toLocaleString()})
                    </Button>
                    {!isActionPhase && <p className="text-[10px] text-muted-foreground italic text-center">Available during Action step</p>}
                    {atMaxWars && isActionPhase && <p className="text-[10px] text-muted-foreground italic text-center">Max {WAR_MAX_SIMULTANEOUS} simultaneous wars</p>}
                    
                    <AnimatePresence>
                      {declareWarOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-muted/20 border border-border/50 rounded-lg p-2 space-y-1">
                            <span className="text-[10px] font-medium text-foreground">Select target family</span>
                            {warTargets.map(f => (
                              <Button
                                key={f}
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs h-7 justify-start hover:bg-red-500/10 text-red-300"
                                onClick={() => {
                                  onDeclareWar(f);
                                  setDeclareWarOpen(false);
                                }}
                              >
                                ⚔️ {f.charAt(0).toUpperCase() + f.slice(1)}
                              </Button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })()
            )}

            {/* Go to the Mattresses — Boss Action */}
            {isPlayerFamily && onGoToMattresses && (
              (() => {
                const isActionPhase = turnPhase === 'action';
                const isActive = mattressesState?.active;
                const onCooldown = mattressesCooldownUntil > currentTurn;
                const cooldownLeft = mattressesCooldownUntil - currentTurn;
                const noActions = actionsRemaining <= 0;

                return (
                  <div className="mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                      disabled={!isActionPhase || !!isActive || onCooldown || noActions || gamePhase < 3}
                      onClick={onGoToMattresses}
                    >
                      🛏️ Go to the Mattresses {onCooldown ? `(${cooldownLeft} turns)` : `($${MATTRESSES_COST.toLocaleString()})`}
                    </Button>
                    {gamePhase < 3 ? (
                      <p className="text-[9px] text-muted-foreground italic mt-0.5 text-center">🔒 Unlocks in Phase 3</p>
                    ) : (
                      <p className="text-[9px] text-muted-foreground mt-0.5 text-center">
                        +{MATTRESSES_DEFENSE_BONUS}% defense, +{MATTRESSES_HQ_BONUS}% HQ def, -{Math.round(MATTRESSES_INCOME_PENALTY * 100)}% income · {MATTRESSES_DURATION} turns
                      </p>
                    )}
                  </div>
                );
              })()
            )}

            {/* War Summit — Boss Action */}
            {isPlayerFamily && onWarSummit && (
              (() => {
                const isActionPhase = turnPhase === 'action';
                const isActive = warSummitState?.active;
                const onCooldown = warSummitCooldownUntil > currentTurn;
                const cooldownLeft = warSummitCooldownUntil - currentTurn;
                const noActions = actionsRemaining <= 0;

                return (
                  <div className="mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8 border-red-500/30 text-red-300 hover:bg-red-500/10"
                      disabled={!isActionPhase || !!isActive || onCooldown || noActions || gamePhase < 3}
                      onClick={onWarSummit}
                    >
                      ⚔️ War Summit {onCooldown ? `(${cooldownLeft} turns)` : `($${WAR_SUMMIT_COST.toLocaleString()})`}
                    </Button>
                    {gamePhase < 3 ? (
                      <p className="text-[9px] text-muted-foreground italic mt-0.5 text-center">🔒 Unlocks in Phase 3</p>
                    ) : (
                      <p className="text-[9px] text-muted-foreground mt-0.5 text-center">
                        +{WAR_SUMMIT_COMBAT_BONUS}% combat, +{WAR_SUMMIT_FEAR_BONUS} fear, +{WAR_SUMMIT_HEAT_COST} heat · {WAR_SUMMIT_DURATION} turns
                      </p>
                    )}
                  </div>
                );
              })()
            )}

            {/* Purge Ranks — inside Boss Actions */}
            {isPlayerFamily && onEliminateSoldier && (() => {
              const flaggedSoldiers = (deployedUnits || []).filter((u: any) => {
                if (u.family !== family || u.type !== 'soldier') return false;
                const stats = soldierStats[u.id];
                return stats && (stats.suspicious || stats.confirmedRat);
              });

              const isActionPhase = turnPhase === 'action';
              const noActions = actionsRemaining <= 0;

              return (
                <div className="space-y-2 mt-3 pt-3 border-t border-border/30">
                  <h4 className="text-xs font-semibold text-red-400 flex items-center gap-1">
                    🔫 Purge Ranks
                  </h4>
                  {flaggedSoldiers.length === 0 ? (
                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-2">
                      <p className="text-[10px] text-green-400 text-center">✅ All clear — no suspects detected</p>
                    </div>
                  ) : (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-2 space-y-1.5">
                      <p className="text-[10px] text-muted-foreground">
                        {flaggedSoldiers.length} soldier{flaggedSoldiers.length !== 1 ? 's' : ''} flagged • Costs 1 Action
                      </p>
                      <ScrollArea className="max-h-32">
                        <div className="space-y-1">
                          {flaggedSoldiers.map((unit: any) => {
                            const stats = soldierStats[unit.id];
                            const isConfirmed = stats?.confirmedRat;
                            const district = (() => {
                              const hex = hexMap.find((h: any) => h.q === unit.q && h.r === unit.r && h.s === unit.s);
                              return hex?.district || '???';
                            })();
                            return (
                              <div
                                key={unit.id}
                                className="flex items-center gap-2 px-2 py-1.5 rounded bg-background/50 border border-border/30 text-xs"
                              >
                                <span className="text-sm">{isConfirmed ? '🐀' : '⚠️'}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-foreground truncate flex items-center gap-1">
                                    {unit.name || 'Soldier'}
                                    <Badge 
                                      variant="outline" 
                                      className={`text-[9px] h-4 ${isConfirmed ? 'text-red-400 border-red-400/30' : 'text-yellow-400 border-yellow-400/30'}`}
                                    >
                                      {isConfirmed ? 'Confirmed Rat' : 'Suspicious'}
                                    </Badge>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <span>Loyalty: {stats?.loyalty ?? '?'}</span>
                                    <span>•</span>
                                    <span>{district}</span>
                                    {!isConfirmed && stats?.suspiciousTurns > 0 && (
                                      <span className="text-yellow-400/60">({stats.suspiciousTurns} turns)</span>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="text-[10px] h-6 px-2"
                                  disabled={!isActionPhase || noActions}
                                  onClick={() => onEliminateSoldier(unit.id)}
                                >
                                  Eliminate
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                      {!isActionPhase && (
                        <p className="text-[9px] text-muted-foreground italic text-center">Available during Action step</p>
                      )}
                      {isActionPhase && noActions && (
                        <p className="text-[9px] text-muted-foreground italic text-center">No actions remaining</p>
                      )}
                      <p className="text-[9px] text-muted-foreground italic">
                        ⚠️ Eliminating an innocent soldier damages morale and respect
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
            </CollapsibleContent>
          </Collapsible>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-2">
              <div className="text-xs font-medium text-gray-400">Businesses</div>
              <div className="text-sm font-bold text-gray-400">
                {hexBusinesses.length}
              </div>
              {extortedBusinesses.length > 0 && (
                <div className="text-[9px] text-muted-foreground">
                  {ownedBusinesses.length} owned · {extortedBusinesses.length} extorted
                </div>
              )}
            </div>
            {!isPlayerFamily && (
              <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-2">
                <div className="text-xs font-medium text-gray-400">Soldiers</div>
                <div className="text-sm font-bold text-gray-400">{units.soldiers.length}</div>
              </div>
            )}
          </div>

          {/* Flipped Assets section for enemy HQ */}
          {!isPlayerFamily && (() => {
            const flippedAtHQ = flippedSoldiers.filter(f => 
              f.family === family && f.hqQ === headquarters.q && f.hqR === headquarters.r && f.hqS === headquarters.s
            );
            const defenseReduction = flippedAtHQ.length * 10;
            return (
              <div className="bg-muted/20 border border-muted-foreground/20 rounded-lg p-2">
                <div className="text-xs font-medium text-foreground flex items-center gap-1">
                  🐀 Flipped Assets
                </div>
                {flippedAtHQ.length > 0 ? (
                  <div className="mt-1">
                    <div className="text-sm font-bold text-foreground">{flippedAtHQ.length} rat{flippedAtHQ.length > 1 ? 's' : ''}</div>
                    <div className="text-xs text-muted-foreground">HQ Defense −{defenseReduction}%</div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-1">No assets</div>
                )}
              </div>
            );
          })()}

          {/* Action Buttons for Player Family */}
          {isPlayerFamily && movementPhase && onSelectUnitFromHeadquarters && (
            <div className="space-y-2 pt-2 border-t border-noir-light">
              <div className="text-xs font-medium text-mafia-gold">Deploy Units</div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onSelectUnitFromHeadquarters('soldier', family);
                    onClose();
                  }}
                  disabled={soldiersAtHQ === 0}
                  className="flex-1 text-xs h-7"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Soldier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onSelectUnitFromHeadquarters('capo', family);
                    onClose();
                  }}
                  disabled={caposAtHQ === 0}
                  className="flex-1 text-xs h-7"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Capo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
