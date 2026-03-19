import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff } from 'lucide-react';
import SoldierIcon from '@/components/SoldierIcon';
import CapoIcon from '@/components/CapoIcon';
import { HexTile, DeployedUnit } from '@/hooks/useEnhancedMafiaGameState';
import { ScoutedHex, Safehouse } from '@/types/game-mechanics';

interface EnhancedMafiaHexGridProps {
  width: number;
  height: number;
  onBusinessClick: (business: any) => void;
  selectedBusiness?: any;
  playerFamily: 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';
  gameState?: any;
  onAction?: (action: any) => void;
  onSelectUnit?: (unitType: 'soldier' | 'capo', location: { q: number; r: number; s: number }) => void;
  onMoveUnit?: (targetLocation: { q: number; r: number; s: number }) => void;
  onSelectHeadquarters?: (family: string) => void;
  onSelectUnitFromHeadquarters?: (unitType: 'soldier' | 'capo', family: string) => void;
  onDeployUnit?: (unitType: 'soldier' | 'capo', targetLocation: { q: number; r: number; s: number }, family: string) => void;
}

const familyColors: Record<string, string> = {
  gambino: '#42D3F2',
  genovese: '#2AA63E',
  lucchese: '#4169E1',
  bonanno: '#DC143C',
  colombo: '#8A2BE2',
  neutral: '#555555',
};

const businessIcons: Record<string, string> = {
  casino: '🎰', restaurant: '🍝', laundromat: '🧽', construction: '🏗️',
  drug_trafficking: '💊', gambling: '🎲', nightclub: '🍸', docks: '⚓',
  speakeasy: '🥃', headquarters: '🏛️',
  // Doc business types
  brothel: '💋', gambling_den: '🎲', loan_sharking: '💰', store_front: '🏪',
};

const EnhancedMafiaHexGrid: React.FC<EnhancedMafiaHexGridProps> = ({ 
  width, height, onBusinessClick, selectedBusiness, playerFamily,
  gameState, onAction, onSelectUnit, onMoveUnit, onSelectHeadquarters,
  onSelectUnitFromHeadquarters, onDeployUnit
}) => {
  const [zoom, setZoom] = useState(1);
  const [showSoldiers, setShowSoldiers] = useState(true);
  const [hoveredHex, setHoveredHex] = useState<HexTile | null>(null);
  const [actionMenu, setActionMenu] = useState<{ tile: HexTile; canHit: boolean; canExtort: boolean; canNegotiate: boolean; negotiateCapoId?: string } | null>(null);
  const didPanRef = React.useRef(false);
  const panRef = React.useRef({ x: 0, y: 0 });
  const isPanningRef = React.useRef(false);
  const panStartRef = React.useRef({ x: 0, y: 0 });
  const transformGroupRef = React.useRef<SVGGElement>(null);
  const zoomRef = React.useRef(zoom);
  zoomRef.current = zoom;

  const updateTransform = useCallback(() => {
    if (transformGroupRef.current) {
      const p = panRef.current;
      const z = zoomRef.current;
      transformGroupRef.current.setAttribute('transform', `translate(${p.x / z}, ${p.y / z}) scale(${z})`);
    }
  }, []);

  // Clear action menu when phase changes
  const turnPhaseRef = gameState?.turnPhase;
  useEffect(() => { setActionMenu(null); }, [turnPhaseRef]);

  const baseHexRadius = 28;
  const hexWidth = baseHexRadius * 2;
  const hexHeight = Math.sqrt(3) * baseHexRadius;

  // Read hex data from gameState
  const hexMap: HexTile[] = gameState?.hexMap || [];
  const deployedUnits: DeployedUnit[] = gameState?.deployedUnits || [];

  // Group units by hex for rendering
  const unitsByHex = useMemo(() => {
    const map = new Map<string, DeployedUnit[]>();
    deployedUnits.forEach(unit => {
      const key = `${unit.q},${unit.r},${unit.s}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(unit);
    });
    return map;
  }, [deployedUnits]);

  // Keyboard zoom shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '=': case '+': event.preventDefault(); setZoom(prev => Math.min(prev + 0.1, 2.5)); break;
          case '-': event.preventDefault(); setZoom(prev => Math.max(prev - 0.1, 0.3)); break;
          case '0': event.preventDefault(); setZoom(1); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync zoom state to DOM transform
  useEffect(() => { updateTransform(); }, [zoom, updateTransform]);

  // Pan via native DOM events + refs (no React re-renders during drag)
  useEffect(() => {
    const container = document.getElementById('hex-grid-container');
    if (!container) return;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isPanningRef.current = true;
      didPanRef.current = false;
      panStartRef.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
      container.style.cursor = 'grabbing';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isPanningRef.current) return;
      const nx = e.clientX - panStartRef.current.x;
      const ny = e.clientY - panStartRef.current.y;
      if (Math.abs(nx - panRef.current.x) > 3 || Math.abs(ny - panRef.current.y) > 3) {
        didPanRef.current = true;
      }
      panRef.current = { x: nx, y: ny };
      updateTransform();
    };

    const onMouseUp = () => {
      isPanningRef.current = false;
      container.style.cursor = 'grab';
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [updateTransform]);

  const getHexPosition = (q: number, r: number) => ({
    x: hexWidth * (3/4) * q,
    y: hexHeight * (r + q/2),
  });

  const getHexPoints = (cx: number, cy: number, radius: number) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      points.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
    }
    return points.join(' ');
  };

  const getHexColor = (tile: HexTile): string => {
    // HQ
    if (tile.isHeadquarters) {
      return tile.isHeadquarters === playerFamily ? '#D4AF37' : '#8B4513';
    }

    // Deployment highlights
    if (gameState?.deployMode && gameState.availableDeployHexes?.some(
      (h: any) => h.q === tile.q && h.r === tile.r && h.s === tile.s
    )) {
      return '#87CEEB'; // sky blue
    }

    // Movement highlights
    if (gameState?.selectedUnitId && gameState.availableMoveHexes?.some(
      (h: any) => h.q === tile.q && h.r === tile.r && h.s === tile.s
    )) {
      return '#90EE90'; // light green
    }

    // Selected unit hex
    if (gameState?.selectedUnitId) {
      const unit = deployedUnits.find(u => u.id === gameState.selectedUnitId);
      if (unit && unit.q === tile.q && unit.r === tile.r && unit.s === tile.s) {
        return '#FFD700'; // gold
      }
    }

    return familyColors[tile.controllingFamily] || '#555555';
  };

  const getHexOpacity = (tile: HexTile): number => {
    if (tile.controllingFamily === playerFamily) return 1;
    if (tile.controllingFamily === 'neutral') return 0.5;
    return 0.7;
  };

  const handleHexClick = (tile: HexTile) => {
    if (didPanRef.current) return; // ignore clicks after dragging
    const turnPhase = gameState?.turnPhase || 'waiting';

    // During move phase, try selecting units on HQ hex before opening the panel
    if (tile.isHeadquarters && turnPhase === 'move') {
      const key = `${tile.q},${tile.r},${tile.s}`;
      const unitsHere = unitsByHex.get(key) || [];
      const playerUnit = unitsHere.find(u => u.family === playerFamily && u.movesRemaining > 0);
      if (playerUnit && onSelectUnit) {
        onSelectUnit(playerUnit.type, { q: tile.q, r: tile.r, s: tile.s });
        return;
      }
    }

    // HQ click — open headquarters panel
    if (tile.isHeadquarters) {
      if (onSelectHeadquarters) onSelectHeadquarters(tile.isHeadquarters);
      return;
    }

    // Deploy mode — place unit (deploy phase)
    if (turnPhase === 'deploy' && gameState?.deployMode) {
      const isValid = gameState.availableDeployHexes?.some(
        (h: any) => h.q === tile.q && h.r === tile.r && h.s === tile.s
      );
      if (isValid && onDeployUnit) {
        onDeployUnit(gameState.deployMode.unitType, { q: tile.q, r: tile.r, s: tile.s }, gameState.deployMode.family);
      }
      return;
    }

    // Move phase — select or move units
    if (turnPhase === 'move') {
      // If we have a selected unit, try to move it
      if (gameState?.selectedUnitId) {
        const isValidMove = gameState.availableMoveHexes?.some(
          (h: any) => h.q === tile.q && h.r === tile.r && h.s === tile.s
        );
        if (isValidMove && onMoveUnit) {
          onMoveUnit({ q: tile.q, r: tile.r, s: tile.s });
          return;
        }
      }

      // Try to select a player unit on this hex
      const key = `${tile.q},${tile.r},${tile.s}`;
      const unitsHere = unitsByHex.get(key) || [];
      const playerUnit = unitsHere.find(u => u.family === playerFamily && u.movesRemaining > 0);
      if (playerUnit && onSelectUnit) {
        onSelectUnit(playerUnit.type, { q: tile.q, r: tile.r, s: tile.s });
        return;
      }
    }

    // Action phase — show context menu if player has soldiers on enemy/neutral hex
    if (turnPhase === 'action') {
      const key = `${tile.q},${tile.r},${tile.s}`;
      const unitsHere = unitsByHex.get(key) || [];
      const playerUnitsHere = unitsHere.filter(u => u.family === playerFamily);
      const playerSoldiersHere = playerUnitsHere.filter(u => u.type === 'soldier');
      const playerCaposHere = playerUnitsHere.filter(u => u.type === 'capo');
      
      if (playerUnitsHere.length > 0 && tile.controllingFamily !== playerFamily) {
        const canHit = tile.controllingFamily !== 'neutral' && !tile.isHeadquarters && playerSoldiersHere.length > 0;
        const canExtort = tile.controllingFamily === 'neutral' && !tile.isHeadquarters && playerSoldiersHere.length > 0;
        const canNegotiate = tile.controllingFamily !== 'neutral' && !tile.isHeadquarters && playerCaposHere.length > 0;
        const negotiateCapoId = playerCaposHere[0]?.id;
        
        if (canHit || canExtort || canNegotiate) {
          if (actionMenu && actionMenu.tile.q === tile.q && actionMenu.tile.r === tile.r) {
            setActionMenu(null);
          } else {
            setActionMenu({ tile, canHit, canExtort, canNegotiate, negotiateCapoId });
          }
          return;
        }
      }
      setActionMenu(null);
    }

    // Normal click — show info
    onBusinessClick({
      q: tile.q, r: tile.r, s: tile.s,
      district: tile.district,
      family: tile.controllingFamily,
      businessType: tile.business?.type || 'none',
      income: tile.business?.income || 0,
      isLegal: tile.business?.isLegal ?? true,
      heatLevel: tile.business?.heatLevel || 0,
    });
  };

  // Compute viewbox from hexMap
  const viewBox = useMemo(() => {
    if (hexMap.length === 0) return '-400 -400 800 800';
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    hexMap.forEach(tile => {
      const { x, y } = getHexPosition(tile.q, tile.r);
      if (x - baseHexRadius < minX) minX = x - baseHexRadius;
      if (x + baseHexRadius > maxX) maxX = x + baseHexRadius;
      if (y - baseHexRadius < minY) minY = y - baseHexRadius;
      if (y + baseHexRadius > maxY) maxY = y + baseHexRadius;
    });
    const pad = 60;
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad*2} ${maxY - minY + pad*2}`;
  }, [hexMap]);

  return (
    <div id="hex-grid-container" className="relative w-full h-full overflow-auto bg-gradient-to-br from-noir-dark/50 to-background/50">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-3">
        <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-noir-light shadow-lg">
          <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(z + 0.15, 2.5))} className="h-8 w-8 p-0">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(z - 0.15, 0.3))} className="h-8 w-8 p-0">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(1)} className="h-8 w-8 p-0">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-noir-light mx-1" />
          <span className="text-sm font-medium text-mafia-gold">{Math.round(zoom * 100)}%</span>
        </div>
        <Button
          variant={showSoldiers ? "default" : "outline"}
          size="sm"
          onClick={() => setShowSoldiers(s => !s)}
          className="font-medium"
        >
          {showSoldiers ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
          Units
        </Button>
      </div>

      {/* Grid */}
      <div className="absolute inset-0" style={{ cursor: 'grab' }}>
        <svg width="100%" height="100%" viewBox={viewBox} className="overflow-visible">
          <g ref={transformGroupRef} transform={`scale(${zoom})`}>
            {hexMap.map(tile => {
              const { x, y } = getHexPosition(tile.q, tile.r);
              const key = `${tile.q},${tile.r},${tile.s}`;
              const unitsHere = unitsByHex.get(key) || [];
              const isHovered = hoveredHex?.q === tile.q && hoveredHex?.r === tile.r;
              const isPlayerTerritory = tile.controllingFamily === playerFamily;

              // Check highlight states
              const isDeployTarget = gameState?.deployMode && gameState.availableDeployHexes?.some(
                (h: any) => h.q === tile.q && h.r === tile.r && h.s === tile.s
              );
              const isMoveTarget = gameState?.selectedUnitId && gameState.availableMoveHexes?.some(
                (h: any) => h.q === tile.q && h.r === tile.r && h.s === tile.s
              );

              return (
                <g key={key}>
                  <polygon
                    points={getHexPoints(x, y, baseHexRadius)}
                    fill={getHexColor(tile)}
                    stroke={tile.isHeadquarters ? '#D4AF37' : isPlayerTerritory ? '#D4AF3780' : '#333333'}
                    strokeWidth={tile.isHeadquarters ? 3 : isPlayerTerritory ? 2 : 1}
                    opacity={getHexOpacity(tile)}
                    className="cursor-pointer transition-all duration-150"
                    onClick={() => handleHexClick(tile)}
                    onMouseEnter={() => setHoveredHex(tile)}
                    onMouseLeave={() => setHoveredHex(null)}
                  />

                  {/* Deploy/Move label */}
                  {(isDeployTarget || isMoveTarget) && (
                    <text x={x} y={y - 12} textAnchor="middle" fontSize="8" fill="#ffffff" fontWeight="bold" className="pointer-events-none select-none">
                      {isDeployTarget ? 'DEPLOY' : 'MOVE'}
                    </text>
                  )}

                  {/* Business/HQ icon */}
                  <text x={x} y={y + 5} textAnchor="middle" fontSize="16" className="pointer-events-none select-none">
                    {tile.isHeadquarters ? '🏛️' : tile.business ? (businessIcons[tile.business.type] || '🏢') : ''}
                  </text>

                  {/* Scouted hex indicator */}
                  {gameState?.scoutedHexes?.some((s: ScoutedHex) => s.q === tile.q && s.r === tile.r && s.s === tile.s) && (
                    <g className="pointer-events-none">
                      <circle cx={x + baseHexRadius * 0.55} cy={y - baseHexRadius * 0.55} r="8" fill="#3B82F6" stroke="#ffffff" strokeWidth="1" />
                      <text x={x + baseHexRadius * 0.55} y={y - baseHexRadius * 0.55 + 3.5} textAnchor="middle" fontSize="9" className="select-none">👁️</text>
                    </g>
                  )}

                  {/* Safehouse indicator */}
                  {gameState?.safehouse && gameState.safehouse.q === tile.q && gameState.safehouse.r === tile.r && gameState.safehouse.s === tile.s && (
                    <g className="pointer-events-none">
                      <circle cx={x - baseHexRadius * 0.55} cy={y - baseHexRadius * 0.55} r="8" fill="#F59E0B" stroke="#ffffff" strokeWidth="1" />
                      <text x={x - baseHexRadius * 0.55} y={y - baseHexRadius * 0.55 + 3.5} textAnchor="middle" fontSize="9" className="select-none">🏠</text>
                    </g>
                  )}

                  {/* Fortified units indicator */}
                  {(() => {
                    const key2 = `${tile.q},${tile.r},${tile.s}`;
                    const fortifiedHere = (gameState?.deployedUnits || []).filter((u: DeployedUnit) => 
                      u.fortified && u.q === tile.q && u.r === tile.r && u.s === tile.s
                    );
                    if (fortifiedHere.length === 0) return null;
                    return (
                      <g className="pointer-events-none">
                        <circle cx={x} cy={y - baseHexRadius * 0.7} r="8" fill="#10B981" stroke="#ffffff" strokeWidth="1" />
                        <text x={x} y={y - baseHexRadius * 0.7 + 3.5} textAnchor="middle" fontSize="9" className="select-none">🛡️</text>
                      </g>
                    );
                  })()}

                  {/* Income on hover */}
                  {isHovered && tile.business && (
                    <text x={x} y={y + baseHexRadius + 12} textAnchor="middle" fontSize="9" fill="#ffffff" fontWeight="600" className="pointer-events-none">
                      ${tile.business.income.toLocaleString()}/turn
                    </text>
                  )}

                  {/* Render units — skip HQ hexes (handled by popover) */}
                  {showSoldiers && unitsHere.length > 0 && !tile.isHeadquarters && (() => {
                    const turnPhase = gameState?.turnPhase || 'waiting';
                    const selectedUnitId = gameState?.selectedUnitId;
                    const soldiersByFamily = new Map<string, DeployedUnit[]>();
                    const caposByFamily = new Map<string, DeployedUnit[]>();
                    unitsHere.forEach(u => {
                      if (u.type === 'soldier') {
                        if (!soldiersByFamily.has(u.family)) soldiersByFamily.set(u.family, []);
                        soldiersByFamily.get(u.family)!.push(u);
                      } else {
                        if (!caposByFamily.has(u.family)) caposByFamily.set(u.family, []);
                        caposByFamily.get(u.family)!.push(u);
                      }
                    });

                    const elements: React.ReactNode[] = [];
                    let offsetIdx = 0;

                    caposByFamily.forEach((capos, fam) => {
                      const capo = capos[0];
                      const isSelected = selectedUnitId === capo.id;
                      const isClickable = fam === playerFamily && (turnPhase === 'move' || turnPhase === 'deploy');
                      elements.push(
                        <CapoIcon
                          key={`capo-${fam}-${key}`}
                          x={x + baseHexRadius * 0.35 + offsetIdx * 8}
                          y={y + baseHexRadius * 0.3}
                          family={fam as any}
                          name={capo.name || 'Capo'}
                          level={capo.level}
                          isPlayerFamily={fam === playerFamily}
                          selected={isSelected}
                          onClick={isClickable ? (e) => {
                            e.stopPropagation();
                            if (turnPhase === 'deploy' && onSelectUnitFromHeadquarters) {
                              onSelectUnitFromHeadquarters('capo', fam);
                            } else if (turnPhase === 'move' && capo.movesRemaining > 0 && onSelectUnit) {
                              onSelectUnit('capo', { q: tile.q, r: tile.r, s: tile.s });
                            }
                          } : undefined}
                        />
                      );
                      offsetIdx++;
                    });

                    soldiersByFamily.forEach((soldiers, fam) => {
                      const firstSoldier = soldiers[0];
                      const isSelected = soldiers.some(s => s.id === selectedUnitId);
                      const isClickable = fam === playerFamily && (turnPhase === 'move' || turnPhase === 'deploy');
                      elements.push(
                        <SoldierIcon
                          key={`soldier-${fam}-${key}`}
                          x={x + baseHexRadius * 0.35 + offsetIdx * 8}
                          y={y + baseHexRadius * 0.3}
                          family={fam as any}
                          count={soldiers.length}
                          isPlayerFamily={fam === playerFamily}
                          selected={isSelected}
                          onClick={isClickable ? (e) => {
                            e.stopPropagation();
                            if (turnPhase === 'deploy' && onSelectUnitFromHeadquarters) {
                              onSelectUnitFromHeadquarters('soldier', fam);
                            } else if (turnPhase === 'move' && firstSoldier.movesRemaining > 0 && onSelectUnit) {
                              onSelectUnit('soldier', { q: tile.q, r: tile.r, s: tile.s });
                            }
                          } : undefined}
                        />
                      );
                      offsetIdx++;
                    });

                    return elements;
                  })()}

                  {/* HQ unit count badge */}
                  {tile.isHeadquarters && unitsHere.length > 0 && (
                    <g className="pointer-events-none">
                      <circle cx={x + baseHexRadius * 0.5} cy={y - baseHexRadius * 0.5} r="9" fill="#D4AF37" stroke="#000" strokeWidth="1" />
                      <text x={x + baseHexRadius * 0.5} y={y - baseHexRadius * 0.5 + 4} textAnchor="middle" fontSize="10" fill="#000" fontWeight="bold" className="select-none">
                        {unitsHere.length}
                      </text>
                    </g>
                  )}

                  {/* Territory control dot */}
                  {tile.controllingFamily !== 'neutral' && !tile.isHeadquarters && (
                    <circle
                      cx={x - baseHexRadius * 0.55}
                      cy={y + baseHexRadius * 0.55}
                      r="5"
                      fill={isPlayerTerritory ? '#10B981' : '#EF4444'}
                      stroke="#ffffff"
                      strokeWidth="0.8"
                      className="pointer-events-none"
                    />
                  )}
                </g>
              );
            })}

            {/* District name labels */}
            {(() => {
              const districts = ['Little Italy', 'Bronx', 'Brooklyn', 'Queens', 'Manhattan', 'Staten Island'] as const;
              return districts.map(district => {
                const tilesInDistrict = hexMap.filter(t => t.district === district);
                if (tilesInDistrict.length === 0) return null;
                let cx = 0, cy = 0;
                tilesInDistrict.forEach(t => {
                  const pos = getHexPosition(t.q, t.r);
                  cx += pos.x;
                  cy += pos.y;
                });
                cx /= tilesInDistrict.length;
                cy /= tilesInDistrict.length;
                return (
                  <text
                    key={`district-label-${district}`}
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="18"
                    fontWeight="800"
                    fontFamily="'Playfair Display', serif"
                    fill="white"
                    fillOpacity="0.18"
                    letterSpacing="3"
                    className="pointer-events-none select-none uppercase"
                  >
                    {district}
                  </text>
                );
              });
            })()}

            {/* Action context menu on hex */}
            {actionMenu && (() => {
              const { x, y } = getHexPosition(actionMenu.tile.q, actionMenu.tile.r);
              const menuWidth = 140;
              const buttonCount = [actionMenu.canHit, actionMenu.canExtort, actionMenu.canNegotiate].filter(Boolean).length;
              const menuHeight = buttonCount * 32 + 12;
              return (
                <foreignObject
                  x={x - menuWidth / 2}
                  y={y - baseHexRadius - menuHeight - 8}
                  width={menuWidth}
                  height={menuHeight}
                  className="overflow-visible"
                >
                  <div className="flex flex-col gap-1 bg-background/95 backdrop-blur-sm border border-primary/40 rounded-lg p-1.5 shadow-xl">
                    {actionMenu.canHit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onAction) onAction({
                            type: 'hit_territory',
                            targetQ: actionMenu.tile.q,
                            targetR: actionMenu.tile.r,
                            targetS: actionMenu.tile.s,
                          });
                          setActionMenu(null);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-destructive/90 hover:bg-destructive text-destructive-foreground text-xs font-bold transition-colors"
                      >
                        ⚔️ Hit Territory
                      </button>
                    )}
                    {actionMenu.canExtort && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onAction) onAction({
                            type: 'extort_territory',
                            targetQ: actionMenu.tile.q,
                            targetR: actionMenu.tile.r,
                            targetS: actionMenu.tile.s,
                          });
                          setActionMenu(null);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary/90 hover:bg-primary text-primary-foreground text-xs font-bold transition-colors"
                      >
                        💰 Extort
                      </button>
                    )}
                    {actionMenu.canNegotiate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onAction) onAction({
                            type: 'open_negotiate',
                            targetQ: actionMenu.tile.q,
                            targetR: actionMenu.tile.r,
                            targetS: actionMenu.tile.s,
                            capoId: actionMenu.negotiateCapoId,
                          });
                          setActionMenu(null);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-accent/90 hover:bg-accent text-accent-foreground text-xs font-bold transition-colors"
                      >
                        🤝 Negotiate
                      </button>
                    )}
                  </div>
                </foreignObject>
              );
            })()}
          </g>
        </svg>
      </div>

      {/* Hover Info */}
      <AnimatePresence>
        {hoveredHex && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 bg-noir-dark/90 backdrop-blur-sm border border-noir-light rounded-lg p-4 text-white max-w-xs"
          >
            <h3 className="font-semibold text-mafia-gold mb-2">{hoveredHex.district}</h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Control:</span> {hoveredHex.controllingFamily.toUpperCase()}</p>
              <p><span className="text-muted-foreground">Terrain:</span> {hoveredHex.terrain}</p>
              {hoveredHex.business && (
                <>
                  <p><span className="text-muted-foreground">Business:</span> {hoveredHex.business.type.replace('_', ' ').toUpperCase()}</p>
                  <p><span className="text-muted-foreground">Income:</span> ${hoveredHex.business.income.toLocaleString()}/turn</p>
                  <p><span className="text-muted-foreground">Type:</span> {hoveredHex.business.isLegal ? 'Legal' : 'Illegal'}</p>
                </>
              )}
              {hoveredHex.isHeadquarters && (
                <p className="text-mafia-gold font-bold">🏛️ {hoveredHex.isHeadquarters.toUpperCase()} HQ</p>
              )}
              {/* Scouted intel */}
              {(() => {
                const scoutInfo = (gameState?.scoutedHexes || []).find((s: ScoutedHex) => s.q === hoveredHex.q && s.r === hoveredHex.r && s.s === hoveredHex.s);
                if (!scoutInfo) return null;
                return (
                  <div className="mt-1 p-1.5 rounded bg-blue-900/40 border border-blue-500/30">
                    <p className="text-blue-300 font-bold text-xs">👁️ SCOUTED ({scoutInfo.turnsRemaining}t left)</p>
                    <p><span className="text-muted-foreground">Enemy:</span> {scoutInfo.enemySoldierCount} units ({scoutInfo.enemyFamily})</p>
                    {scoutInfo.businessType && <p><span className="text-muted-foreground">Business:</span> {scoutInfo.businessType} (${scoutInfo.businessIncome?.toLocaleString()}/turn)</p>}
                  </div>
                );
              })()}
              {(() => {
                const key = `${hoveredHex.q},${hoveredHex.r},${hoveredHex.s}`;
                const units = unitsByHex.get(key) || [];
                if (units.length === 0) return null;
                return units.map(u => (
                  <p key={u.id} className={u.family === playerFamily ? 'text-green-400' : 'text-red-400'}>
                    {u.type === 'capo' ? `👔 ${u.name} (Lvl ${u.level})${u.personality ? ` ${u.personality === 'diplomat' ? '🕊️' : u.personality === 'enforcer' ? '💪' : '🧠'}` : ''}` : '👤 Soldier'} — {u.family.toUpperCase()}
                    {u.family === playerFamily && ` (${u.movesRemaining} moves${u.fortified ? ', 🛡️ Fortified' : ''})`}
                  </p>
                ));
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedMafiaHexGrid;
