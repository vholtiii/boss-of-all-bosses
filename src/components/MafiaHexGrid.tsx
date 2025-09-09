import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface Territory {
  q: number;
  r: number;
  s: number;
  district: 'Little Italy' | 'Bronx' | 'Brooklyn' | 'Queens' | 'Manhattan' | 'Staten Island';
  family: 'neutral' | 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  business?: {
    type: 'casino' | 'speakeasy' | 'restaurant' | 'docks' | 'protection';
    income: number;
  };
  capo?: {
    name: string;
    loyalty: number;
    strength: number;
    family: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  };
}

interface MafiaHexGridProps {
  width: number;
  height: number;
  onTerritoryClick: (territory: Territory) => void;
  selectedTerritory?: Territory | null;
  playerFamily: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
}

const MafiaHexGrid: React.FC<MafiaHexGridProps> = ({ 
  width, 
  height, 
  onTerritoryClick, 
  selectedTerritory,
  playerFamily 
}) => {
  const hexRadius = 35;
  const hexWidth = hexRadius * 2;
  const hexHeight = Math.sqrt(3) * hexRadius;

  // Famous mafia figures and capos
  const mafiaFigures = [
    { name: "Lucky Luciano", family: "genovese" },
    { name: "Al Capone", family: "gambino" },
    { name: "Carlo Gambino", family: "gambino" },
    { name: "John Gotti", family: "gambino" },
    { name: "Vincent Gigante", family: "genovese" },
    { name: "Tommy Lucchese", family: "lucchese" },
    { name: "Joe Bonanno", family: "bonanno" },
    { name: "Joe Colombo", family: "colombo" },
    { name: "Frank Costello", family: "genovese" },
    { name: "Meyer Lansky", family: "lucchese" }
  ];

  const generateTerritories = (): Territory[] => {
    const territories: Territory[] = [];
    const mapRadius = Math.min(width, height) / 2;
    
    for (let q = -mapRadius; q <= mapRadius; q++) {
      const r1 = Math.max(-mapRadius, -q - mapRadius);
      const r2 = Math.min(mapRadius, -q + mapRadius);
      for (let r = r1; r <= r2; r++) {
        const s = -q - r;
        
        // Assign districts based on position
        const districts = ['Little Italy', 'Bronx', 'Brooklyn', 'Queens', 'Manhattan', 'Staten Island'];
        const district = districts[Math.abs(q + r) % districts.length] as Territory['district'];
        
        // Assign families (some neutral territories)
        const families: Territory['family'][] = ['gambino', 'genovese', 'lucchese', 'bonanno', 'colombo'];
        const family = Math.random() > 0.3 ? families[Math.abs(q * r) % families.length] : 'neutral';
        
        // Add businesses
        let business;
        if (Math.random() > 0.6) {
          const businessTypes = ['casino', 'speakeasy', 'restaurant', 'docks', 'protection'];
          business = {
            type: businessTypes[Math.floor(Math.random() * businessTypes.length)] as any,
            income: Math.floor(Math.random() * 5000) + 1000
          };
        }
        
        // Add capos/lieutenants
        let capo;
        if (family !== 'neutral' && Math.random() > 0.7) {
          const availableFigures = mafiaFigures.filter(f => f.family === family);
          if (availableFigures.length > 0) {
            const figure = availableFigures[Math.floor(Math.random() * availableFigures.length)];
            capo = {
              name: figure.name,
              loyalty: Math.floor(Math.random() * 40) + 60,
              strength: Math.floor(Math.random() * 50) + 50,
              family: family as any
            };
          }
        }
        
        territories.push({ q, r, s, district, family, business, capo });
      }
    }
    return territories;
  };

  const [territories] = useState<Territory[]>(generateTerritories);

  const hexToPixel = (territory: Territory) => {
    const x = hexRadius * (3/2 * territory.q);
    const y = hexRadius * (Math.sqrt(3)/2 * territory.q + Math.sqrt(3) * territory.r);
    return { x, y };
  };

  const getFamilyColor = (family: string) => {
    switch (family) {
      case 'gambino': return 'fill-families-gambino';
      case 'genovese': return 'fill-families-genovese';
      case 'lucchese': return 'fill-families-lucchese';
      case 'bonanno': return 'fill-families-bonanno';
      case 'colombo': return 'fill-families-colombo';
      default: return 'fill-mafia-smoke';
    }
  };

  const getBusinessIcon = (business: Territory['business']) => {
    if (!business) return null;
    const icons = {
      casino: '🎰',
      speakeasy: '🍸',
      restaurant: '🍝',
      docks: '⚓',
      protection: '🛡️'
    };
    return icons[business.type];
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-noir-dark rounded-lg border-2 border-noir-light">
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`-350 -350 700 700`}
        className="absolute inset-0"
      >
        <defs>
          <filter id="mafiaGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <pattern id="pinstripe" patternUnits="userSpaceOnUse" width="4" height="4">
            <rect width="4" height="4" fill="rgba(0,0,0,0.1)"/>
            <rect width="1" height="4" fill="rgba(255,255,255,0.05)"/>
          </pattern>
        </defs>
        
        {territories.map((territory, index) => {
          const { x, y } = hexToPixel(territory);
          const isSelected = selectedTerritory && 
            selectedTerritory.q === territory.q && selectedTerritory.r === territory.r;
          const isPlayerTerritory = territory.family === playerFamily;
          
          return (
            <g key={index} className="cursor-pointer">
              <polygon
                points={`
                  ${x + hexRadius},${y}
                  ${x + hexRadius/2},${y + hexHeight/2}
                  ${x - hexRadius/2},${y + hexHeight/2}
                  ${x - hexRadius},${y}
                  ${x - hexRadius/2},${y - hexHeight/2}
                  ${x + hexRadius/2},${y - hexHeight/2}
                `}
                className={cn(
                  getFamilyColor(territory.family),
                  'stroke-noir-light stroke-1 transition-all duration-300',
                  isSelected && 'stroke-mafia-gold stroke-3 filter brightness-125',
                  isPlayerTerritory && 'stroke-mafia-gold stroke-2',
                  'hover:stroke-mafia-gold hover:brightness-110'
                )}
                fill={territory.family !== 'neutral' ? undefined : 'url(#pinstripe)'}
                filter={isSelected ? "url(#mafiaGlow)" : undefined}
                onClick={() => onTerritoryClick(territory)}
              />
              
              {/* Business indicator */}
              {territory.business && (
                <g>
                  <circle
                    cx={x - 15}
                    cy={y - 15}
                    r="8"
                    className="fill-mafia-gold stroke-background stroke-1"
                  />
                  <text
                    x={x - 15}
                    y={y - 10}
                    textAnchor="middle"
                    className="text-xs fill-background select-none"
                  >
                    {getBusinessIcon(territory.business)}
                  </text>
                </g>
              )}
              
              {/* Capo indicator */}
              {territory.capo && (
                <g>
                  <circle
                    cx={x + 15}
                    cy={y - 15}
                    r="10"
                    className={cn(
                      'stroke-2',
                      `fill-families-${territory.capo.family}`,
                      `stroke-families-${territory.capo.family}`
                    )}
                  />
                  <text
                    x={x + 15}
                    y={y - 10}
                    textAnchor="middle"
                    className="text-xs font-bold fill-background select-none"
                  >
                    👤
                  </text>
                </g>
              )}
              
              {/* Territory coordinates and district */}
              <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                className="text-xs fill-foreground select-none opacity-70 font-source"
              >
                {territory.district.split(' ')[0]}
              </text>
              
              <text
                x={x}
                y={y + 20}
                textAnchor="middle"
                className="text-xs fill-muted-foreground select-none opacity-50"
              >
                {territory.q},{territory.r}
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Vintage overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-mafia-gold/5 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-noir-dark/20 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

export default MafiaHexGrid;