import React from 'react';
import { motion } from 'framer-motion';
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-gradient-to-br from-noir-dark to-background border-noir-light">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-mafia-gold font-playfair">
                <Building2 className="h-6 w-6" style={{ color: familyColor }} />
                {familyName} FAMILY HQ
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground font-source">
              {headquarters.district} • {headquarters.q}, {headquarters.r}, {headquarters.s}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Profits Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-mafia-gold font-playfair flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Overview
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <div className="text-sm text-green-400 font-medium">Legal Profits</div>
                  <div className="text-lg font-bold text-green-400">
                    ${legalProfits.toLocaleString()}
                  </div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <div className="text-sm text-red-400 font-medium">Illegal Profits</div>
                  <div className="text-lg font-bold text-red-400">
                    ${illegalProfits.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="bg-mafia-gold/10 border border-mafia-gold/20 rounded-lg p-3">
                <div className="text-sm text-mafia-gold font-medium">Total Profits</div>
                <div className="text-xl font-bold text-mafia-gold">
                  ${totalProfits.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Units Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-mafia-gold font-playfair flex items-center gap-2">
                <Users className="h-5 w-5" />
                Unit Status
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-400">Soldiers</span>
                  </div>
                  <div className="text-lg font-bold text-blue-400">
                    {units.soldiers.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {soldiersAtHQ} at HQ • {deployedSoldiers} deployed
                  </div>
                </div>
                
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium text-purple-400">Capos</span>
                  </div>
                  <div className="text-lg font-bold text-purple-400">
                    {units.capos.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {caposAtHQ} at HQ • {deployedCapos} deployed
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-400">Boss</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Present at headquarters
                </div>
              </div>
            </div>

            {/* Business Count */}
            <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-400">Controlled Businesses</div>
              <div className="text-lg font-bold text-gray-400">
                {familyBusinesses.length}
              </div>
            </div>

            {/* Action Buttons for Player Family */}
            {isPlayerFamily && movementPhase && onSelectUnitFromHeadquarters && (
              <div className="space-y-2 pt-4 border-t border-noir-light">
                <div className="text-sm font-medium text-mafia-gold">Deploy Units</div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onSelectUnitFromHeadquarters('soldier', family);
                      onClose(); // Close the panel after selecting unit type
                    }}
                    disabled={soldiersAtHQ === 0}
                    className="flex-1"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Deploy Soldier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onSelectUnitFromHeadquarters('capo', family);
                      onClose(); // Close the panel after selecting unit type
                    }}
                    disabled={caposAtHQ === 0}
                    className="flex-1"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Deploy Capo
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
