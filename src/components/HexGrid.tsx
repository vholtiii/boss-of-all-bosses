import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface HexTile {
  q: number;
  r: number;
  s: number;
  terrain: 'plains' | 'forest' | 'mountain' | 'water';
  unit?: {
    type: 'infantry' | 'tank' | 'artillery';
    player: 1 | 2;
  };
}

interface HexGridProps {
  width: number;
  height: number;
  onHexClick: (hex: HexTile) => void;
  selectedHex?: HexTile | null;
}

const HexGrid: React.FC<HexGridProps> = ({ width, height, onHexClick, selectedHex }) => {
  const hexRadius = 30;
  const hexWidth = hexRadius * 2;
  const hexHeight = Math.sqrt(3) * hexRadius;

  // Generate hex grid with cube coordinates
  const generateGrid = (): HexTile[] => {
    const grid: HexTile[] = [];
    const mapRadius = Math.min(width, height) / 2;
    
    for (let q = -mapRadius; q <= mapRadius; q++) {
      const r1 = Math.max(-mapRadius, -q - mapRadius);
      const r2 = Math.min(mapRadius, -q + mapRadius);
      for (let r = r1; r <= r2; r++) {
        const s = -q - r;
        const terrain = Math.random() > 0.7 ? 'forest' : 
                       Math.random() > 0.8 ? 'mountain' : 
                       Math.random() > 0.9 ? 'water' : 'plains';
        
        // Add some sample units
        let unit;
        if (Math.random() > 0.9) {
          unit = {
            type: Math.random() > 0.5 ? 'tank' : 'infantry' as 'tank' | 'infantry',
            player: Math.random() > 0.5 ? 1 : 2 as 1 | 2
          };
        }
        
        grid.push({ q, r, s, terrain, unit });
      }
    }
    return grid;
  };

  const [grid] = useState<HexTile[]>(generateGrid);

  // Convert cube coordinates to pixel coordinates
  const hexToPixel = (hex: HexTile) => {
    const x = hexRadius * (3/2 * hex.q);
    const y = hexRadius * (Math.sqrt(3)/2 * hex.q + Math.sqrt(3) * hex.r);
    return { x, y };
  };

  const getTerrainColor = (terrain: string) => {
    switch (terrain) {
      case 'forest': return 'fill-green-700';
      case 'mountain': return 'fill-stone-600';
      case 'water': return 'fill-blue-600';
      default: return 'fill-green-900';
    }
  };

  const getUnitSymbol = (unit: HexTile['unit']) => {
    if (!unit) return null;
    const symbols = {
      infantry: '👥',
      tank: '🚗',
      artillery: '💥'
    };
    return symbols[unit.type];
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-steel-dark rounded-lg border-2 border-steel-light">
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`-300 -300 600 600`}
        className="absolute inset-0"
      >
        <defs>
          <filter id="hexGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {grid.map((hex, index) => {
          const { x, y } = hexToPixel(hex);
          const isSelected = selectedHex && selectedHex.q === hex.q && selectedHex.r === hex.r;
          
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
                  getTerrainColor(hex.terrain),
                  'stroke-steel-light stroke-1 transition-all duration-200',
                  isSelected && 'stroke-tactical-green stroke-2 filter brightness-125',
                  'hover:stroke-tactical-amber hover:brightness-110'
                )}
                filter={isSelected ? "url(#hexGlow)" : undefined}
                onClick={() => onHexClick(hex)}
              />
              
              {hex.unit && (
                <g>
                  <circle
                    cx={x}
                    cy={y - 8}
                    r="12"
                    className={cn(
                      'stroke-2',
                      hex.unit.player === 1 ? 'fill-tactical-green stroke-tactical-green' : 'fill-destructive stroke-destructive'
                    )}
                  />
                  <text
                    x={x}
                    y={y - 4}
                    textAnchor="middle"
                    className="text-xs font-bold fill-background select-none"
                  >
                    {getUnitSymbol(hex.unit)}
                  </text>
                </g>
              )}
              
              {/* Hex coordinates for debugging */}
              <text
                x={x}
                y={y + 15}
                textAnchor="middle"
                className="text-xs fill-muted-foreground select-none opacity-50"
              >
                {hex.q},{hex.r}
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Grid overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-tactical-green/5 to-transparent pointer-events-none" />
    </div>
  );
};

export default HexGrid;