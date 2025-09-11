import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Business } from '@/types/business';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { useMafiaNotifications } from '@/components/ui/notification-system';
import SoldierIcon from '@/components/SoldierIcon';
import CapoIcon from '@/components/CapoIcon';

interface BusinessHex {
  q: number;
  r: number;
  s: number;
  businessId: string;
  businessType: Business['category'];
  isLegal: boolean;
  income: number;
  district: 'Little Italy' | 'Bronx' | 'Brooklyn' | 'Queens' | 'Manhattan' | 'Staten Island';
  family: 'neutral' | 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  isExtorted?: boolean;
  heatLevel?: number;
  soldiers?: {
    count: number;
    family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  };
  capo?: {
    name: string;
    family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
    level: number;
  };
}

interface Territory {
  district: 'Little Italy' | 'Bronx' | 'Brooklyn' | 'Queens' | 'Manhattan' | 'Staten Island';
  family: 'neutral' | 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  businesses: BusinessHex[];
  capo?: {
    name: string;
    loyalty: number;
    strength: number;
    family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  };
}

interface EnhancedMafiaHexGridProps {
  width: number;
  height: number;
  onBusinessClick: (business: BusinessHex) => void;
  selectedBusiness?: BusinessHex | null;
  playerFamily: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  gameState?: any; // Add gameState for accessing resources
  onAction?: (action: any) => void; // Add action handler
}

const familyColors = {
  gambino: '#42D3F2', // Light Blue
  genovese: '#2AA63E', // Green
  lucchese: '#4169E1', // Royal Blue
  bonanno: '#DC143C', // Crimson
  colombo: '#8A2BE2', // Blue Violet
  neutral: '#696969', // Dim Gray
};

const businessIcons = {
  casino: '🎰',
  restaurant: '🍝',
  laundromat: '🧽',
  construction: '🏗️',
  drug_trafficking: '💊',
  gambling: '🎲',
  prostitution: '💄',
  loan_sharking: '💰',
};

const EnhancedMafiaHexGrid: React.FC<EnhancedMafiaHexGridProps> = ({ 
  width, 
  height, 
  onBusinessClick, 
  selectedBusiness,
  playerFamily,
  gameState,
  onAction
}) => {
  const [zoom, setZoom] = useState(1);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [showSoldiers, setShowSoldiers] = useState(true);
  const [hoveredHex, setHoveredHex] = useState<BusinessHex | null>(null);
  const [gridData, setGridData] = useState<BusinessHex[]>([]);
  const { notifyBusinessAcquired, notifyPoliceRaid } = useMafiaNotifications();

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '=':
          case '+':
            event.preventDefault();
            setZoom(prev => Math.min(prev + 0.1, 2));
            break;
          case '-':
            event.preventDefault();
            setZoom(prev => Math.max(prev - 0.1, 0.5));
            break;
          case '0':
            event.preventDefault();
            setZoom(1);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const baseHexRadius = 35;
  const hexRadius = baseHexRadius * zoom;
  const hexWidth = baseHexRadius * 2;
  const hexHeight = Math.sqrt(3) * baseHexRadius;

  // Generate grid data
  useEffect(() => {
    const businesses: BusinessHex[] = [];
    const districts: Array<BusinessHex['district']> = ['Little Italy', 'Bronx', 'Brooklyn', 'Queens', 'Manhattan', 'Staten Island'];
    const families: Array<BusinessHex['family']> = ['neutral', 'gambino', 'genovese', 'lucchese', 'bonanno', 'colombo'];
    const businessTypes: Array<Business['category']> = ['casino', 'restaurant', 'laundromat', 'construction', 'drug_trafficking', 'gambling', 'prostitution', 'loan_sharking'];

    for (let q = -width/2; q <= width/2; q++) {
      for (let r = -height/2; r <= height/2; r++) {
        const s = -q - r;
        if (Math.abs(s) <= height/2) {
          const businessId = `business-${q}-${r}-${s}`;
          const district = districts[Math.floor(Math.random() * districts.length)];
          const family = families[Math.floor(Math.random() * families.length)];
          const businessType = businessTypes[Math.floor(Math.random() * businessTypes.length)];
          const income = Math.floor(Math.random() * 5000) + 1000;
          const heatLevel = Math.floor(Math.random() * 5);

          // Add soldiers to non-neutral territories
          let soldiers = undefined;
          if (family !== 'neutral' && Math.random() > 0.3) {
            const soldierCount = Math.floor(Math.random() * 3) + 1; // 1-3 soldiers
            soldiers = {
              count: soldierCount,
              family: family as 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo',
            };
          }

          businesses.push({
            q, r, s,
            businessId,
            businessType,
            isLegal: Math.random() > 0.3,
            income,
            district,
            family,
            isExtorted: Math.random() > 0.7,
            heatLevel,
            soldiers,
          });
        }
      }
    }
    setGridData(businesses);
  }, [width, height]);

  const getHexPosition = (q: number, r: number) => {
    const x = hexWidth * (3/4) * q;
    const y = hexHeight * (r + q/2);
    return { x, y };
  };

  const getHexPoints = (centerX: number, centerY: number, radius: number) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  const handleHexClick = (business: BusinessHex) => {
    onBusinessClick(business);
    
    // Add visual feedback
    if (business.family === playerFamily) {
      notifyBusinessAcquired(business.businessType, business.income);
    } else if (business.heatLevel && business.heatLevel > 3) {
      notifyPoliceRaid(business.district);
    }
  };

  const handleHexRightClick = (business: BusinessHex, e: React.MouseEvent) => {
    e.preventDefault();
    
    if (business.family === playerFamily && !business.capo) {
      // Can deploy capo to player's own territory
      const capoNames = ['Vito', 'Salvatore', 'Antonio', 'Giuseppe', 'Francesco', 'Mario', 'Luigi', 'Paolo'];
      const randomName = capoNames[Math.floor(Math.random() * capoNames.length)];
      const confirmCapo = window.confirm(
        `Deploy Capo ${randomName} to ${business.district}? This will maximize income from this territory (100% vs 30% with soldiers).`
      );
      if (confirmCapo && onAction) {
        onAction({ 
          type: 'deploy_capo', 
          territory: business.district, 
          capoName: randomName,
          capoLevel: 1
        });
      }
    } else if (business.soldiers && business.soldiers.family === playerFamily) {
      // Player has soldiers here - can take action based on territory type
      if (business.family === 'neutral') {
        // Can extort neutral territory
        const confirmExtortion = window.confirm(
          `Extort ${business.district}? You have ${business.soldiers.count} soldiers here. This will attempt to take control of the territory.`
        );
        if (confirmExtortion && onAction) {
          // Trigger extortion action
          onAction({ type: 'extort_territory', targetTerritory: business.district });
        }
      } else if (business.family !== playerFamily) {
        // Can hit rival territory
        const confirmHit = window.confirm(
          `Hit ${business.district}? You have ${business.soldiers.count} soldiers here. This will attempt to take control of the rival territory.`
        );
        if (confirmHit && onAction) {
          // Trigger hit action
          onAction({ type: 'hit_territory', targetTerritory: business.district });
        }
      }
    } else {
      // Can deploy soldiers to any territory (neutral, player's own, or rival)
      const soldierCount = prompt(
        `Deploy how many soldiers to ${business.district}? (Available: ${gameState?.resources.soldiers || 0})`
      );
      if (soldierCount && !isNaN(Number(soldierCount))) {
        const count = Math.min(Number(soldierCount), gameState?.resources.soldiers || 0);
        if (count > 0 && onAction) {
          // Trigger deploy action
          onAction({ type: 'deploy_soldiers', territory: business.district, soldierCount: count });
        }
      }
    }
  };

  const getHexColor = (business: BusinessHex) => {
    if (showHeatMap && business.heatLevel) {
      const intensity = business.heatLevel / 5;
      return `rgba(255, ${Math.floor(255 * (1 - intensity))}, ${Math.floor(255 * (1 - intensity))}, 0.8)`;
    }
    return familyColors[business.family];
  };

  const getHexOpacity = (business: BusinessHex) => {
    if (business.family === playerFamily) return 1;
    if (business.family === 'neutral') return 0.6;
    return 0.8;
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-noir-dark/50 to-background/50">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-2 border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.min(zoom + 0.1, 2))}
            disabled={zoom >= 2}
            title="Zoom In (Ctrl + +)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}
            disabled={zoom <= 0.5}
            title="Zoom Out (Ctrl + -)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(1)}
            title="Reset Zoom (Ctrl + 0)"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <div className="text-xs text-muted-foreground px-2">
            {Math.round(zoom * 100)}%
          </div>
        </div>
        <Button
          variant={showHeatMap ? "default" : "outline"}
          size="sm"
          onClick={() => setShowHeatMap(!showHeatMap)}
        >
          {showHeatMap ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showHeatMap ? 'Hide Heat' : 'Show Heat'}
        </Button>
        <Button
          variant={showSoldiers ? "default" : "outline"}
          size="sm"
          onClick={() => setShowSoldiers(!showSoldiers)}
        >
          {showSoldiers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showSoldiers ? 'Hide Soldiers' : 'Show Soldiers'}
        </Button>
      </div>

      {/* Grid Container */}
      <div className="absolute inset-0 flex items-center justify-center hex-grid-container">
        <svg
          width="100%"
          height="100%"
          viewBox={`-${width * hexWidth/2} -${height * hexHeight/2} ${width * hexWidth} ${height * hexHeight}`}
          className="overflow-visible"
        >
          <g transform={`scale(${zoom})`}>
          {gridData.map((business) => {
            const { x, y } = getHexPosition(business.q, business.r);
            const isSelected = selectedBusiness?.businessId === business.businessId;
            const isHovered = hoveredHex?.businessId === business.businessId;
            const isPlayerFamily = business.family === playerFamily;

            return (
              <motion.g
                key={business.businessId}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: getHexOpacity(business),
                  scale: isSelected ? 1.1 : isHovered ? 1.05 : 1,
                }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <polygon
                  points={getHexPoints(x, y, baseHexRadius)}
                  fill={getHexColor(business)}
                  stroke={isSelected ? '#ffffff' : isPlayerFamily ? '#D4AF37' : '#333333'}
                  strokeWidth={isSelected ? 3 : isPlayerFamily ? 2 : 1}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => handleHexClick(business)}
                  onContextMenu={(e) => handleHexRightClick(business, e)}
                  onMouseEnter={() => setHoveredHex(business)}
                  onMouseLeave={() => setHoveredHex(null)}
                />
                
                {/* Business Icon */}
                <motion.text
                  x={x}
                  y={y + 5}
                  textAnchor="middle"
                  className="text-lg pointer-events-none select-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {businessIcons[business.businessType] || '🏢'}
                </motion.text>

                {/* Income Display */}
                {isHovered && (
                  <motion.text
                    x={x}
                    y={y + hexRadius + 15}
                    textAnchor="middle"
                    className="text-xs fill-white font-semibold pointer-events-none"
                    initial={{ opacity: 0, y: y + hexRadius + 10 }}
                    animate={{ opacity: 1, y: y + hexRadius + 15 }}
                    exit={{ opacity: 0, y: y + hexRadius + 10 }}
                  >
                    ${business.income.toLocaleString()}
                  </motion.text>
                )}

                {/* Heat Indicator */}
                {showHeatMap && business.heatLevel && business.heatLevel > 2 && (
                  <motion.circle
                    cx={x + hexRadius * 0.6}
                    cy={y - hexRadius * 0.6}
                    r="8"
                    fill="red"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  />
                )}

                {/* Extortion Indicator */}
                {business.isExtorted && (
                  <motion.text
                    x={x - hexRadius * 0.6}
                    y={y - hexRadius * 0.6}
                    className="text-xs fill-yellow-400 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    💰
                  </motion.text>
                )}

                {/* Capo Icon */}
                {business.capo && (
                  <CapoIcon
                    x={x + hexRadius * 0.4}
                    y={y + hexRadius * 0.4}
                    family={business.capo.family}
                    name={business.capo.name}
                    level={business.capo.level}
                    isPlayerFamily={business.capo.family === playerFamily}
                    onClick={() => {
                      console.log(`Capo ${business.capo?.name} (Level ${business.capo?.level}) in ${business.district}`);
                    }}
                  />
                )}

                {/* Soldier Icon - only show if no capo */}
                {business.soldiers && showSoldiers && !business.capo && (
                  <SoldierIcon
                    x={x + hexRadius * 0.4}
                    y={y + hexRadius * 0.4}
                    family={business.soldiers.family}
                    count={business.soldiers.count}
                    isPlayerFamily={business.soldiers.family === playerFamily}
                    onClick={() => {
                      console.log(`Soldiers in ${business.district}: ${business.soldiers?.count} ${business.soldiers?.family} soldiers`);
                    }}
                  />
                )}

                {/* Territory Control Indicator */}
                {business.family !== 'neutral' && (
                  <motion.circle
                    cx={x - hexRadius * 0.6}
                    cy={y + hexRadius * 0.6}
                    r="6"
                    fill={business.family === playerFamily ? '#10B981' : '#EF4444'}
                    stroke="#ffffff"
                    strokeWidth="1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 }}
                  />
                )}

                {/* Action Available Indicator */}
                {business.family === playerFamily && !business.capo && (
                  <motion.text
                    x={x}
                    y={y - hexRadius * 0.8}
                    textAnchor="middle"
                    className="text-xs pointer-events-none font-bold"
                    fill="#8B5CF6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    👔
                  </motion.text>
                )}
                {business.soldiers && business.soldiers.family === playerFamily && business.family !== playerFamily && (
                  <motion.text
                    x={x}
                    y={y - hexRadius * 0.8}
                    textAnchor="middle"
                    className="text-xs pointer-events-none font-bold"
                    fill={business.family === 'neutral' ? '#10B981' : '#EF4444'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {business.family === 'neutral' ? '💰' : '⚔️'}
                  </motion.text>
                )}
              </motion.g>
            );
          })}
          </g>
        </svg>
      </div>

      {/* Hover Info Panel */}
      <AnimatePresence>
        {hoveredHex && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 bg-noir-dark/90 backdrop-blur-sm border border-noir-light rounded-lg p-4 text-white max-w-xs"
          >
            <h3 className="font-semibold text-mafia-gold mb-2">
              {hoveredHex.district}
            </h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Family:</span> {hoveredHex.family.toUpperCase()}</p>
              <p><span className="text-muted-foreground">Business:</span> {hoveredHex.businessType.replace('_', ' ').toUpperCase()}</p>
              <p><span className="text-muted-foreground">Income:</span> ${hoveredHex.income.toLocaleString()}/turn</p>
              <p><span className="text-muted-foreground">Status:</span> {hoveredHex.isLegal ? 'Legal' : 'Illegal'}</p>
              {hoveredHex.heatLevel && (
                <p><span className="text-muted-foreground">Heat Level:</span> {hoveredHex.heatLevel}/5</p>
              )}
              {hoveredHex.isExtorted && (
                <p className="text-yellow-400">💰 Extorted</p>
              )}
              {hoveredHex.capo && (
                <p className="text-purple-400">
                  👔 {hoveredHex.capo.name} (Level {hoveredHex.capo.level}) - {hoveredHex.capo.family.toUpperCase()} Capo
                </p>
              )}
              {hoveredHex.soldiers && !hoveredHex.capo && (
                <p className="text-blue-400">
                  👤 {hoveredHex.soldiers.count} {hoveredHex.soldiers.family.toUpperCase()} soldier{hoveredHex.soldiers.count > 1 ? 's' : ''}
                </p>
              )}
              {hoveredHex.family !== 'neutral' && (
                <p className={hoveredHex.family === playerFamily ? 'text-green-400' : 'text-red-400'}>
                  🏴 {hoveredHex.family.toUpperCase()} TERRITORY
                </p>
              )}
              {hoveredHex.family === playerFamily && !hoveredHex.capo && (
                <p className="text-purple-400 font-bold">
                  👔 READY TO DEPLOY CAPO
                </p>
              )}
              {hoveredHex.soldiers && hoveredHex.soldiers.family === playerFamily && hoveredHex.family !== playerFamily && (
                <p className={`font-bold ${
                  hoveredHex.family === 'neutral' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {hoveredHex.family === 'neutral' ? '💰 READY TO EXTORT' : '⚔️ READY TO HIT'}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedMafiaHexGrid;
