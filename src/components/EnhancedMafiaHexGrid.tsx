import React, { useState, useEffect, useMemo } from 'react';
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
  const [actionMenu, setActionMenu] = useState<{ tile: HexTile; canHit: boolean; canExtort: boolean; canClaim: boolean; canNegotiate: boolean; canSabotage: boolean; canSafehouse: boolean; negotiateCapoId?: string } | null>(null);
  const [expandedHQKey, setExpandedHQKey] = useState<string | null>(null);
  const [combatOverlay, setCombatOverlay] = useState<{
    q: number; r: number; s: number;
    success: boolean; type: string;
    title: string; details: string;
    timestamp: number;
  } | null>(null);

  // Clear action menu when phase changes
  const turnPhaseRef = gameState?.turnPhase;
  useEffect(() => { setActionMenu(null); }, [turnPhaseRef]);

  // Show combat result overlay when lastCombatResult changes
  const lastCombatResult = gameState?.lastCombatResult;
  useEffect(() => {
    if (lastCombatResult && lastCombatResult.timestamp) {
      setCombatOverlay(lastCombatResult);
      const timer = setTimeout(() => setCombatOverlay(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [lastCombatResult?.timestamp]);

  const baseHexRadius = 22;
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

  // District abbreviations for hex labels
  const districtAbbreviations: Record<string, string> = {
    'Little Italy': 'LI',
    'Bronx': 'BX',
    'Brooklyn': 'BK',
    'Queens': 'QN',
    'Manhattan': 'MH',
    'Staten Island': 'SI',
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
      return '#87CEEB';
    }

    // Movement highlights
    if (gameState?.selectedUnitId && gameState.availableMoveHexes?.some(
      (h: any) => h.q === tile.q && h.r === tile.r && h.s === tile.s
    )) {
      return '#90EE90';
    }

    // Selected unit hex
    if (gameState?.selectedUnitId) {
      const unit = deployedUnits.find(u => u.id === gameState.selectedUnitId);
      if (unit && unit.q === tile.q && unit.r === tile.r && unit.s === tile.s) {
        return '#FFD700';
      }
    }

    return familyColors[tile.controllingFamily] || '#555555';
  };

  const getHexOpacity = (tile: HexTile): number => {
    if (tile.controllingFamily === playerFamily) return 0.85;
    if (tile.controllingFamily === 'neutral') return 0.35;
    return 0.65;
  };

  const handleHexClick = (tile: HexTile) => {
    const turnPhase = gameState?.turnPhase || 'waiting';

    // During move phase, try selecting units on HQ hex before opening the panel
    if (tile.isHeadquarters && turnPhase === 'move') {
      const key = `${tile.q},${tile.r},${tile.s}`;
      setExpandedHQKey(key); // Ensure units are visible
      const unitsHere = unitsByHex.get(key) || [];
      const playerUnit = unitsHere.find(u => u.family === playerFamily && u.movesRemaining > 0);
      if (playerUnit && onSelectUnit) {
        onSelectUnit(playerUnit.type, { q: tile.q, r: tile.r, s: tile.s });
        return;
      }
    }

    // HQ click — during deploy phase, toggle unit picker, show HQ info, AND allow unit selection
    if (tile.isHeadquarters && turnPhase === 'deploy' && tile.isHeadquarters === playerFamily) {
      const hqKey = `${tile.q},${tile.r},${tile.s}`;
      setExpandedHQKey(prev => prev === hqKey ? null : hqKey);
      if (onSelectHeadquarters) onSelectHeadquarters(tile.isHeadquarters);
      // Also try selecting a unit at HQ for movement (don't return early if unit found)
      const unitsHere = unitsByHex.get(hqKey) || [];
      const playerUnit = unitsHere.find(u => u.family === playerFamily && u.movesRemaining > 0);
      if (playerUnit && onSelectUnit) {
        onSelectUnit(playerUnit.type, { q: tile.q, r: tile.r, s: tile.s });
      }
      return;
    }

    // HQ click — toggle unit icons and open headquarters panel
    if (tile.isHeadquarters) {
      const hqKey = `${tile.q},${tile.r},${tile.s}`;
      if (expandedHQKey === hqKey) {
        setExpandedHQKey(null);
      } else {
        setExpandedHQKey(hqKey);
      }
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
        return;
      }
      // Clicked a non-deploy hex — fall through to unit selection below
    }

    // Deploy phase — select units for movement OR place from HQ
    if (turnPhase === 'deploy') {
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

      // Try to select a player unit on this hex for movement
      const key = `${tile.q},${tile.r},${tile.s}`;
      const unitsHere = unitsByHex.get(key) || [];
      const playerUnit = unitsHere.find(u => u.family === playerFamily && u.movesRemaining > 0);
      if (playerUnit && onSelectUnit) {
        onSelectUnit(playerUnit.type, { q: tile.q, r: tile.r, s: tile.s });
        return;
      }
    }

    // Move (tactical) phase — select units for tactical actions
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
      
      if (playerUnitsHere.length > 0) {
        const isEnemy = tile.controllingFamily !== 'neutral' && tile.controllingFamily !== playerFamily;
        const isNeutral = tile.controllingFamily === 'neutral';
        const isOwned = tile.controllingFamily === playerFamily;
        
        const canHit = isEnemy && !tile.isHeadquarters && playerSoldiersHere.length > 0;
        const canExtort = isNeutral && !tile.isHeadquarters && playerSoldiersHere.length > 0;
        const canClaim = isNeutral && !tile.isHeadquarters && playerSoldiersHere.length > 0;
        const canNegotiate = isEnemy && !tile.isHeadquarters && playerCaposHere.length > 0;
        const canSabotage = isEnemy && !tile.isHeadquarters && playerSoldiersHere.length > 0 && !!tile.business;
        const canSafehouse = isOwned && !tile.isHeadquarters && playerUnitsHere.length > 0;
        const negotiateCapoId = playerCaposHere[0]?.id;
        
        if (canHit || canExtort || canClaim || canNegotiate || canSabotage || canSafehouse) {
          if (actionMenu && actionMenu.tile.q === tile.q && actionMenu.tile.r === tile.r) {
            setActionMenu(null);
          } else {
            setActionMenu({ tile, canHit, canExtort, canClaim, canNegotiate, canSabotage, canSafehouse, negotiateCapoId });
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
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-noir-dark/50 to-background/50">
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
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="100%" height="100%" viewBox={viewBox} className="overflow-visible">
          <g transform={`scale(${zoom})`}>
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
                  <text x={x} y={y + (tile.business && !tile.isHeadquarters ? 1 : 5)} textAnchor="middle" fontSize="16" className="pointer-events-none select-none">
                    {tile.isHeadquarters ? '🏛️' : tile.business ? (businessIcons[tile.business.type] || '🏢') : ''}
                  </text>

                  {/* District abbreviation label */}
                  {!tile.isHeadquarters && !tile.business && (
                    <text x={x} y={y + 3} textAnchor="middle" fontSize="7" fill="#ffffff" fillOpacity="0.3" fontWeight="600" className="pointer-events-none select-none">
                      {districtAbbreviations[tile.district] || ''}
                    </text>
                  )}

                  {/* Always-visible income label */}
                  {tile.business && !tile.isHeadquarters && (
                    <text x={x} y={y + 14} textAnchor="middle" fontSize="7" fill="#10B981" fontWeight="700" className="pointer-events-none select-none">
                      ${tile.business.income >= 1000 ? `${(tile.business.income / 1000).toFixed(1)}k` : tile.business.income}
                    </text>
                  )}

                  {/* Prompt to click HQ during deploy phase */}
                  {tile.isHeadquarters === playerFamily && gameState?.turnPhase === 'deploy' && expandedHQKey !== key && (
                    <motion.text
                      x={x} y={y + baseHexRadius + 14}
                      textAnchor="middle" fontSize="7" fill="#D4AF37" fontWeight="bold"
                      className="pointer-events-none select-none"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      ▲ CLICK TO SEE UNITS ▲
                    </motion.text>
                  )}

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

                  {/* Player territory gold outer glow */}
                  {isPlayerTerritory && !tile.isHeadquarters && (
                    <polygon
                      points={getHexPoints(x, y, baseHexRadius + 2)}
                      fill="none"
                      stroke="#D4AF37"
                      strokeWidth="1.5"
                      opacity="0.4"
                      className="pointer-events-none"
                    />
                  )}

                  {/* Render units */}
                  {showSoldiers && unitsHere.length > 0 && (!tile.isHeadquarters || expandedHQKey === key || gameState?.turnPhase === 'move') && (() => {
                    const turnPhase = gameState?.turnPhase || 'waiting';
                    const selectedUnitId = gameState?.selectedUnitId;
                    // Group by family and type
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
                    const isAtHQ = !!tile.isHeadquarters;
                    const isDeployAtHQ = isAtHQ && turnPhase === 'deploy' && tile.isHeadquarters === playerFamily;

                    // Keep the HQ hex clear during deploy; the picker renders in the outer side panel
                    if (isDeployAtHQ) {
                      // Intentionally render nothing here.
                    } else {
                      // Normal compact layout for non-deploy or non-HQ
                      let offsetIdx = 0;

                      caposByFamily.forEach((capos, fam) => {
                        const capo = capos[0];
                        const isSelected = selectedUnitId === capo.id;
                        const isClickable = fam === playerFamily && (turnPhase === 'move' || (turnPhase === 'deploy' && isAtHQ));
                        elements.push(
                          <CapoIcon
                            key={`capo-${fam}-${key}`}
                            x={x - baseHexRadius * 0.3 + offsetIdx * 12}
                            y={y - baseHexRadius * 0.15}
                            family={fam as any}
                            name={capo.name || 'Capo'}
                            level={capo.level}
                            isPlayerFamily={fam === playerFamily}
                            selected={isSelected}
                            onClick={isClickable ? (e) => {
                              e.stopPropagation();
                              if (turnPhase === 'deploy' && isAtHQ && onSelectUnitFromHeadquarters) {
                                onSelectUnitFromHeadquarters('capo', fam);
                              } else if ((turnPhase === 'deploy' || turnPhase === 'move') && capo.movesRemaining > 0 && onSelectUnit) {
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
                            x={x + baseHexRadius * 0.25 + offsetIdx * 12}
                            y={y + baseHexRadius * 0.35}
                            family={fam as any}
                            count={soldiers.length}
                            isPlayerFamily={fam === playerFamily}
                            selected={isSelected}
                            onClick={isClickable ? (e) => {
                              e.stopPropagation();
                              if (turnPhase === 'deploy' && isAtHQ && onSelectUnitFromHeadquarters) {
                                onSelectUnitFromHeadquarters('soldier', fam);
                              } else if ((turnPhase === 'deploy' || turnPhase === 'move') && firstSoldier.movesRemaining > 0 && onSelectUnit) {
                                onSelectUnit('soldier', { q: tile.q, r: tile.r, s: tile.s });
                              }
                            } : undefined}
                          />
                        );
                        offsetIdx++;
                      });
                    }

                    return elements;
                  })()}

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
              const buttonCount = [actionMenu.canHit, actionMenu.canExtort, actionMenu.canClaim, actionMenu.canNegotiate, actionMenu.canSabotage, actionMenu.canSafehouse].filter(Boolean).length;
              const menuHeight = buttonCount * 32 + 30;
              const noActions = gameState?.actionsRemaining === 0;
              return (
                <foreignObject
                  x={x - menuWidth / 2}
                  y={y - baseHexRadius - menuHeight - 8}
                  width={menuWidth}
                  height={menuHeight}
                  className="overflow-visible"
                >
                  <div className="text-[9px] font-bold text-center mb-0.5 text-muted-foreground">
                    ⚔️ {gameState?.actionsRemaining ?? '?'}/{gameState?.maxActions ?? '?'} Actions
                  </div>
                  <div className={cn("flex flex-col gap-1 bg-background/95 backdrop-blur-sm border border-primary/40 rounded-lg p-1.5 shadow-xl", noActions && "opacity-50 pointer-events-none")}>
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
                    {actionMenu.canSabotage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onAction) onAction({
                            type: 'sabotage_hex',
                            targetQ: actionMenu.tile.q,
                            targetR: actionMenu.tile.r,
                            targetS: actionMenu.tile.s,
                          });
                          setActionMenu(null);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-orange-600/90 hover:bg-orange-600 text-white text-xs font-bold transition-colors"
                      >
                        💣 Sabotage
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
                    {actionMenu.canClaim && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onAction) onAction({
                            type: 'claim_territory',
                            targetQ: actionMenu.tile.q,
                            targetR: actionMenu.tile.r,
                            targetS: actionMenu.tile.s,
                          });
                          setActionMenu(null);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-secondary/90 hover:bg-secondary text-secondary-foreground text-xs font-bold transition-colors"
                      >
                        🏴 Claim Territory
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
                    {actionMenu.canSafehouse && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onAction) onAction({
                            type: 'establish_safehouse',
                            targetQ: actionMenu.tile.q,
                            targetR: actionMenu.tile.r,
                            targetS: actionMenu.tile.s,
                          });
                          setActionMenu(null);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-600/90 hover:bg-amber-600 text-white text-xs font-bold transition-colors"
                      >
                        🏠 Safehouse
                      </button>
                    )}
                  </div>
                </foreignObject>
              );
            })()}

            {/* Combat Result Overlay */}
            <AnimatePresence>
              {combatOverlay && (() => {
                const { x, y } = getHexPosition(combatOverlay.q, combatOverlay.r);
                const isSuccess = combatOverlay.success;
                const flashColor = isSuccess ? '#22c55e' : '#ef4444';
                return (
                  <g key={`combat-overlay-${combatOverlay.timestamp}`}>
                    {/* Hex flash circle */}
                    <motion.circle
                      cx={x}
                      cy={y}
                      r={baseHexRadius * 1.3}
                      fill={flashColor}
                      initial={{ opacity: 0.8, scale: 0.5 }}
                      animate={{ opacity: [0.8, 0.4, 0.6, 0], scale: [0.5, 1.4, 1.2, 1.5] }}
                      transition={{ duration: 2, ease: 'easeOut' }}
                    />
                    {/* Pulsing hex border */}
                    <motion.polygon
                      points={getHexPoints(x, y, baseHexRadius + 2)}
                      fill="none"
                      stroke={isSuccess ? '#D4AF37' : '#ef4444'}
                      strokeWidth={3}
                      initial={{ opacity: 1 }}
                      animate={{ opacity: [1, 0.3, 1, 0.3, 1, 0], strokeWidth: [3, 5, 3, 5, 3, 2] }}
                      transition={{ duration: 2, ease: 'easeOut' }}
                    />
                    {/* Title text */}
                    <motion.text
                      x={x}
                      y={y - 8}
                      textAnchor="middle"
                      fill={isSuccess ? '#22c55e' : '#ef4444'}
                      fontSize="11"
                      fontWeight="900"
                      fontFamily="'Playfair Display', serif"
                      initial={{ opacity: 0, y: y }}
                      animate={{ opacity: [0, 1, 1, 0], y: [y, y - 20, y - 30, y - 50] }}
                      transition={{ duration: 2.5, ease: 'easeOut' }}
                      style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
                    >
                      {combatOverlay.title}
                    </motion.text>
                    {/* Details text */}
                    <motion.text
                      x={x}
                      y={y + 6}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="8"
                      fontWeight="700"
                      initial={{ opacity: 0, y: y + 10 }}
                      animate={{ opacity: [0, 1, 1, 0], y: [y + 10, y - 6, y - 16, y - 36] }}
                      transition={{ duration: 2.5, ease: 'easeOut', delay: 0.15 }}
                      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                    >
                      {combatOverlay.details}
                    </motion.text>
                  </g>
                );
              })()}
            </AnimatePresence>
          </g>
        </svg>
      </div>

      {gameState?.turnPhase === 'deploy' && expandedHQKey && (() => {
        const expandedTile = hexMap.find(tile => `${tile.q},${tile.r},${tile.s}` === expandedHQKey);
        if (!expandedTile || expandedTile.isHeadquarters !== playerFamily) return null;

        const expandedUnits = unitsByHex.get(expandedHQKey) || [];
        const playerCapos = expandedUnits.filter(unit => unit.family === playerFamily && unit.type === 'capo');
        const playerSoldiers = expandedUnits.filter(unit => unit.family === playerFamily && unit.type === 'soldier');

        if (playerCapos.length === 0 && playerSoldiers.length === 0) return null;

        return (
          <div className="absolute right-4 top-1/2 z-20 w-64 -translate-y-1/2 rounded-2xl border border-primary/40 bg-background/95 p-4 shadow-2xl backdrop-blur-sm">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">HQ deployment</p>
              <h3 className="text-sm font-bold text-foreground">Select a unit to deploy</h3>
            </div>

            <div className="space-y-3">
              {playerCapos.length > 0 && (
                <button
                  type="button"
                  onClick={() => onSelectUnitFromHeadquarters?.('capo', playerFamily)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-left transition-colors hover:border-primary/50 hover:bg-accent"
                >
                  <svg width="52" height="58" viewBox="0 0 52 58" className="shrink-0 overflow-visible">
                    <CapoIcon
                      x={26}
                      y={28}
                      family={playerFamily}
                      name={playerCapos[0].name || 'Capo'}
                      level={playerCapos[0].level}
                      isPlayerFamily={true}
                    />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Capo</p>
                    <p className="text-xs text-muted-foreground">{playerCapos.length} available</p>
                  </div>
                </button>
              )}

              {playerSoldiers.length > 0 && (
                <button
                  type="button"
                  onClick={() => onSelectUnitFromHeadquarters?.('soldier', playerFamily)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-left transition-colors hover:border-primary/50 hover:bg-accent"
                >
                  <svg width="52" height="58" viewBox="0 0 52 58" className="shrink-0 overflow-visible">
                    <SoldierIcon
                      x={26}
                      y={30}
                      family={playerFamily}
                      count={playerSoldiers.length}
                      isPlayerFamily={true}
                    />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Soldiers</p>
                    <p className="text-xs text-muted-foreground">{playerSoldiers.length} available</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        );
      })()}

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
