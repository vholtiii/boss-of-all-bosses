import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import bossIcon from '@/assets/boss-icon.png';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Users, 
  Shield, 
  Building2, 
  X,
  Target,
  Zap
} from 'lucide-react';

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
  businesses: any[];
  onClose: () => void;
  onSelectUnitFromHeadquarters?: (unitType: 'soldier' | 'capo', family: string) => void;
  movementPhase?: boolean;
  playerFamily?: string;
}

const familyColors = {
  gambino: '#42D3F2',
  genovese: '#2AA63E', 
  lucchese: '#4169E1',
  bonanno: '#DC143C',
  colombo: '#8A2BE2',
};

const familyNames = {
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
  businesses,
  onClose,
  onSelectUnitFromHeadquarters,
  movementPhase = false,
  playerFamily
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Calculate profits from businesses owned by this family
  const familyBusinesses = businesses.filter(business => business.family === family);
  
  const legalProfits = familyBusinesses
    .filter(business => business.isLegal)
    .reduce((total, business) => total + business.income, 0);
    
  const illegalProfits = familyBusinesses
    .filter(business => !business.isLegal)
    .reduce((total, business) => total + business.income, 0);
    
  const totalProfits = legalProfits + illegalProfits;
  
  // Count units at headquarters vs deployed
  const soldiersAtHQ = units.soldiers.filter(soldier => 
    soldier.q === headquarters.q && soldier.r === headquarters.r && soldier.s === headquarters.s
  ).length;
  
  const caposAtHQ = units.capos.filter(capo => 
    capo.q === headquarters.q && capo.r === headquarters.r && capo.s === headquarters.s
  ).length;
  
  const deployedSoldiers = units.soldiers.length - soldiersAtHQ;
  const deployedCapos = units.capos.length - caposAtHQ;
  
  const isPlayerFamily = family === playerFamily;
  const familyColor = familyColors[family as keyof typeof familyColors] || '#696969';
  const familyName = familyNames[family as keyof typeof familyNames] || family.toUpperCase();

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ type: 'tween', duration: 0.25 }}
      className="fixed top-4 right-4 z-40 w-80 max-h-[calc(100vh-2rem)] overflow-y-auto"
    >
      <Card className="bg-gradient-to-br from-noir-dark to-background border-noir-light shadow-xl">
          <CardHeader className="pb-4">
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
          
          <CardContent className="space-y-4 pt-0">
            {/* Profits Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-mafia-gold font-playfair flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial Overview
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                  <div className="text-xs text-green-400 font-medium">Legal</div>
                  <div className="text-sm font-bold text-green-400">
                    ${legalProfits.toLocaleString()}
                  </div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                  <div className="text-xs text-red-400 font-medium">Illegal</div>
                  <div className="text-sm font-bold text-red-400">
                    ${illegalProfits.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="bg-mafia-gold/10 border border-mafia-gold/20 rounded-lg p-2">
                <div className="text-xs text-mafia-gold font-medium">Total Profits</div>
                <div className="text-base font-bold text-mafia-gold">
                  ${totalProfits.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Units Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-mafia-gold font-playfair flex items-center gap-2">
                <Users className="h-4 w-4" />
                Unit Status
              </h3>
              
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
              
              <motion.div
                className={`bg-mafia-gold/10 border border-mafia-gold/30 rounded-lg p-2 flex items-center gap-3 ${isPlayerFamily ? 'cursor-pointer hover:border-mafia-gold/60 hover:bg-mafia-gold/20 transition-all' : ''}`}
                whileHover={isPlayerFamily ? { scale: 1.02 } : {}}
                whileTap={isPlayerFamily ? { scale: 0.98 } : {}}
              >
                <div className="w-10 h-10 rounded-full border-2 border-mafia-gold overflow-hidden bg-noir-dark flex items-center justify-center shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                  <img
                    src={bossIcon}
                    alt="The Boss"
                    className="w-8 h-8 object-contain"
                    style={{ mixBlendMode: 'multiply', filter: 'invert(1) brightness(1.5) sepia(1) saturate(3) hue-rotate(15deg)' }}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-mafia-gold font-playfair">The Boss</div>
                  <div className="text-[10px] text-muted-foreground">At Headquarters</div>
                </div>
                {isPlayerFamily && (
                  <div className="text-[9px] text-mafia-gold/50 italic">Coming soon</div>
                )}
              </motion.div>
            </div>

            {/* Business Count */}
            <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-2">
              <div className="text-xs font-medium text-gray-400">Controlled Businesses</div>
              <div className="text-sm font-bold text-gray-400">
                {familyBusinesses.length}
              </div>
            </div>

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
