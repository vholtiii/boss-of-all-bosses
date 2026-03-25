import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff } from 'lucide-react';
import SoldierIcon from '@/components/SoldierIcon';
import CapoIcon from '@/components/CapoIcon';
import { HexTile, DeployedUnit } from '@/hooks/useEnhancedMafiaGameState';
import { ScoutedHex, Safehouse, PlannedHit } from '@/types/game-mechanics';

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
  planHitMode?: boolean;
  planHitStep?: 'selectSoldier' | 'selectTarget';
  planHitPlannerId?: string | null;
  onPlanHitSelect?: (q: number, r: number, s: number, targetUnitId: string) => void;
  onPlanHitSelectSoldier?: (unitId: string) => void;
  onCancelPlanHit?: () => void;
  bossHighlightHex?: { q: number; r: number; s: number } | null;
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
  store: '🏪',
};

const EnhancedMafiaHexGrid: React.FC<EnhancedMafiaHexGridProps> = ({ 
  width, height, onBusinessClick, selectedBusiness, playerFamily,
  gameState, onAction, onSelectUnit, onMoveUnit, onSelectHeadquarters,
  onSelectUnitFromHeadquarters, onDeployUnit, planHitMode, planHitStep, planHitPlannerId, onPlanHitSelect, onPlanHitSelectSoldier, onCancelPlanHit,
  bossHighlightHex
}) => {
  const [zoom, setZoom] = useState(1);
  const [showSoldiers, setShowSoldiers] = useState(true);
  const [hoveredHex, setHoveredHex] = useState<HexTile | null>(null);
  const [actionMenu, setActionMenu] = useState<{ tile: HexTile; canHit: boolean; canExtort: boolean; canClaim: boolean; canNegotiate: boolean; canSabotage: boolean; canSafehouse: boolean; canAssaultHQ?: boolean; canFlipSoldier?: boolean; negotiateCapoId?: string; reasons?: Record<string, string> } | null>(null);
  const [planHitUnitMenu, setPlanHitUnitMenu] = useState<{ tile: HexTile; enemyUnits: DeployedUnit[] } | null>(null);
  const [expandedHQKey, setExpandedHQKey] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);
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
  const scoutedHexes: ScoutedHex[] = gameState?.scoutedHexes || [];
  const bribedOfficials = gameState?.policeHeat?.bribedOfficials || [];

  const activeBribes = gameState?.activeBribes || [];

  // Fog of War: check if a rival hex's intel is revealed
  const isHexRevealed = (tile: HexTile): boolean => {
    // Player's own hexes and neutral hexes are always visible
    if (tile.controllingFamily === playerFamily || tile.controllingFamily === 'neutral') return true;
    // HQ locations are common knowledge
    if (tile.isHeadquarters) return true;
    // Scouted hexes are revealed
    if (scoutedHexes.some((s: ScoutedHex) => s.q === tile.q && s.r === tile.r && s.s === tile.s)) return true;
    // Police Chief or Mayor bribe reveals ALL rival hexes
    if (activeBribes.some((b: any) => (b.tier === 'police_chief' || b.tier === 'mayor') && b.active)) return true;
    // Police Captain bribe reveals targeted family's hexes
    if (activeBribes.some((b: any) => b.tier === 'police_captain' && b.active && b.targetFamily === tile.controllingFamily)) return true;
    // Legacy bribed officials (fallback)
    if (bribedOfficials.some((o: any) => o.id === 'captain_rodriguez')) return true;
    if (bribedOfficials.some((o: any) => o.permissions?.includes('rival_intelligence'))) return true;
    return false;
  };

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

  // Compute district boundary segments for border outlines
  const districtBorderSegments = useMemo(() => {
    const dirs = [
      { dq: 1, dr: 0, ds: -1 },
      { dq: 1, dr: -1, ds: 0 },
      { dq: 0, dr: -1, ds: 1 },
      { dq: -1, dr: 0, ds: 1 },
      { dq: -1, dr: 1, ds: 0 },
      { dq: 0, dr: 1, ds: -1 },
    ];
    const dMap = new Map<string, string>();
    hexMap.forEach(t => dMap.set(`${t.q},${t.r},${t.s}`, t.district));
    const segs: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const seen = new Set<string>();
    hexMap.forEach(tile => {
      const { x: cx, y: cy } = getHexPosition(tile.q, tile.r);
      dirs.forEach((dir, ei) => {
        const nd = dMap.get(`${tile.q + dir.dq},${tile.r + dir.dr},${tile.s + dir.ds}`);
        if (nd !== tile.district) {
          const a1 = (Math.PI / 3) * ei;
          const a2 = (Math.PI / 3) * ((ei + 1) % 6);
          const x1 = Math.round((cx + baseHexRadius * Math.cos(a1)) * 100) / 100;
          const y1 = Math.round((cy + baseHexRadius * Math.sin(a1)) * 100) / 100;
          const x2 = Math.round((cx + baseHexRadius * Math.cos(a2)) * 100) / 100;
          const y2 = Math.round((cy + baseHexRadius * Math.sin(a2)) * 100) / 100;
          const key = [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)].join(',');
          if (!seen.has(key)) { seen.add(key); segs.push({ x1, y1, x2, y2 }); }
        }
      });
    });
    return segs;
  }, [hexMap]);

  // District background tint colors (subtle, for region identification)
  const districtTints: Record<string, string> = {
    'Little Italy': 'rgba(255, 180, 100, 0.12)',
    'Bronx': 'rgba(255, 100, 100, 0.10)',
    'Brooklyn': 'rgba(100, 160, 255, 0.10)',
    'Queens': 'rgba(100, 255, 160, 0.10)',
    'Manhattan': 'rgba(255, 215, 0, 0.10)',
    'Staten Island': 'rgba(200, 130, 255, 0.10)',
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

  // Business placement mode
  const pendingBuild = gameState?.pendingBusinessBuild;
  const isBusinessPlacementMode = !!pendingBuild;
  const validPlacementHexes = useMemo(() => {
    if (!pendingBuild) return [];
    return hexMap.filter(t => 
      t.controllingFamily === playerFamily && !t.business && !t.isHeadquarters &&
      (pendingBuild.isLegal 
        ? deployedUnits.some(u => u.type === 'capo' && u.family === playerFamily && u.q === t.q && u.r === t.r && u.s === t.s)
        : true)
    );
  }, [pendingBuild, hexMap, deployedUnits, playerFamily]);

  const getHexColor = (tile: HexTile): string => {
    // Business placement highlight
    if (isBusinessPlacementMode) {
      const isValid = validPlacementHexes.some(h => h.q === tile.q && h.r === tile.r && h.s === tile.s);
      if (isValid) return '#22C55E'; // green for valid placement
    }

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

    // Plan Hit mode — 2-step selection
    if (planHitMode) {
      if (planHitStep === 'selectSoldier') {
        // Step 1: Select a player soldier
        const key = `${tile.q},${tile.r},${tile.s}`;
        const unitsHere = unitsByHex.get(key) || [];
        const playerSoldier = unitsHere.find(u => u.family === playerFamily && u.type === 'soldier');
        if (playerSoldier && onPlanHitSelectSoldier) {
          onPlanHitSelectSoldier(playerSoldier.id);
        }
        return;
      }
      if (planHitStep === 'selectTarget' && onPlanHitSelect) {
        // Step 2: Select a scouted enemy hex → show unit picker
        const isEnemy = tile.controllingFamily !== 'neutral' && tile.controllingFamily !== playerFamily;
        const isScouted = scoutedHexes.some((s: ScoutedHex) => s.q === tile.q && s.r === tile.r && s.s === tile.s);
        if (isEnemy && isScouted) {
          const key = `${tile.q},${tile.r},${tile.s}`;
          const unitsHere = unitsByHex.get(key) || [];
          const enemyUnits = unitsHere.filter(u => u.family !== playerFamily);
          if (enemyUnits.length === 1) {
            // Only one unit — select directly
            onPlanHitSelect(tile.q, tile.r, tile.s, enemyUnits[0].id);
          } else if (enemyUnits.length > 1) {
            // Show unit picker
            setPlanHitUnitMenu({ tile, enemyUnits });
          }
        }
        return;
      }
      return;
    }

    // Business placement mode — intercept clicks
    if (isBusinessPlacementMode && onAction) {
      const isValid = validPlacementHexes.some(h => h.q === tile.q && h.r === tile.r && h.s === tile.s);
      if (isValid) {
        onAction({ type: 'place_business_on_hex', targetQ: tile.q, targetR: tile.r, targetS: tile.s });
      }
      return; // Consume all clicks during placement mode
    }

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
      const currentMoveAction = gameState?.selectedMoveAction || 'move';
      const bypassMoves = currentMoveAction === 'escort' || currentMoveAction === 'fortify';
      const playerUnit = unitsHere.find(u => u.family === playerFamily && (bypassMoves || u.movesRemaining > 0));
      if (playerUnit && onSelectUnit) {
        onSelectUnit(playerUnit.type, { q: tile.q, r: tile.r, s: tile.s });
        return;
      }
    }

    // Action phase — unit-first selection flow
    if (turnPhase === 'action') {
      const key = `${tile.q},${tile.r},${tile.s}`;
      const unitsHere = unitsByHex.get(key) || [];
      const playerUnitsHere = unitsHere.filter(u => u.family === playerFamily);
      
      // If no unit selected yet, try to select a player unit on this hex
      if (!gameState?.selectedUnitId) {
        if (playerUnitsHere.length > 0 && onSelectUnit) {
          // Prefer soldiers for action selection, fall back to capos
          const soldier = playerUnitsHere.find(u => u.type === 'soldier');
          const capo = playerUnitsHere.find(u => u.type === 'capo');
          const unitToSelect = soldier || capo;
          if (unitToSelect) {
            onSelectUnit(unitToSelect.type, { q: tile.q, r: tile.r, s: tile.s });
          }
        }
        setActionMenu(null);
        return;
      }
      
      // A unit is selected — check if this hex is a valid action target (highlighted)
      const isValidTarget = gameState.availableMoveHexes?.some(
        (h: any) => h.q === tile.q && h.r === tile.r && h.s === tile.s
      );
      
      if (isValidTarget) {
        // Show context-sensitive action menu for the selected unit on this target
        const selectedUnit = (gameState.deployedUnits || []).find((u: DeployedUnit) => u.id === gameState.selectedUnitId);
        if (!selectedUnit) { setActionMenu(null); return; }
        
        const isEnemy = tile.controllingFamily !== 'neutral' && tile.controllingFamily !== playerFamily;
        const isNeutral = tile.controllingFamily === 'neutral';
        const isOwned = tile.controllingFamily === playerFamily;
        
        const isSoldier = selectedUnit.type === 'soldier';
        const isCapo = selectedUnit.type === 'capo';
        
        // Soldiers can only extort on their own hex; Capos can extort adjacent hexes
        const unitOnTargetHex = selectedUnit.q === tile.q && selectedUnit.r === tile.r && selectedUnit.s === tile.s;
        const hasCompletedBusiness = !!tile.business && !(tile.business.constructionProgress !== undefined && tile.business.constructionProgress < (tile.business.constructionGoal || 3));
        
        const isEnemyHQ = !!tile.isHeadquarters && tile.isHeadquarters !== playerFamily;
        
        // Block all normal actions on HQ hexes
        const canHit = isEnemy && (isSoldier || isCapo) && !tile.isHeadquarters;
        const canExtort = hasCompletedBusiness && (
          (isSoldier && unitOnTargetHex) || 
          (isCapo && (unitOnTargetHex || true))
        ) && (isNeutral || isEnemy) && !tile.isHeadquarters;
        const canClaim = isNeutral && isSoldier && !tile.business && !tile.isHeadquarters;
        const isCapoWounded = isCapo && (selectedUnit as any).woundedTurnsRemaining > 0;
        const canNegotiate = isEnemy && isCapo && !tile.isHeadquarters && !isCapoWounded;
        const canSabotage = isEnemy && isSoldier && !!tile.business && !tile.isHeadquarters;
        const canSafehouse = isOwned && !tile.isHeadquarters && !isCapoWounded;
        const negotiateCapoId = isCapo ? selectedUnit.id : undefined;
        
        // HQ Assault: soldier adjacent to enemy HQ
        const isAdjacentToHQ = isEnemyHQ && isSoldier && !unitOnTargetHex;
        const soldierStats = gameState?.soldierStats?.[selectedUnit.id];
        const meetsToughness = soldierStats && soldierStats.toughness >= 4 && soldierStats.loyalty >= 70;
        const canAssaultHQ = isAdjacentToHQ && meetsToughness;
        const canFlipSoldier = isEnemyHQ && isAdjacentToHQ;
        
        // Compute reasons for disabled actions (contextually relevant only)
        const reasons: Record<string, string> = {};
        const noActions = gameState?.actionsRemaining === 0;
        
        if (!canHit && isEnemy) {
          reasons.hit = noActions ? 'No actions left' : (!isSoldier && !isCapo) ? 'Need soldier or capo' : '';
        }
        if (!canExtort) {
          if (!hasCompletedBusiness && (isNeutral || isEnemy) && tile.business) reasons.extort = 'Business under construction';
          else if (!hasCompletedBusiness && (isNeutral || isEnemy)) reasons.extort = 'No business on hex';
          else if (hasCompletedBusiness && isSoldier && !unitOnTargetHex) reasons.extort = 'Soldier must be on hex';
          else if (noActions) reasons.extort = 'No actions left';
        }
        if (!canClaim && isNeutral) {
          if (tile.business) reasons.claim = 'Has business (extort instead)';
          else if (!isSoldier) reasons.claim = 'Need a soldier';
        }
        if (!canSabotage && isEnemy) {
          if (!tile.business) reasons.sabotage = 'No business to sabotage';
          else if (!isSoldier) reasons.sabotage = 'Need a soldier';
          else if (noActions) reasons.sabotage = 'No actions left';
        }
        if (!canNegotiate && isEnemy && isCapo && isCapoWounded) {
          reasons.negotiate = 'Capo is wounded';
        } else if (!canNegotiate && isEnemy && !isCapo) {
          reasons.negotiate = 'Need a capo';
        }
        if (!canSafehouse && isOwned && isCapoWounded) {
          reasons.safehouse = 'Capo is wounded';
        } else if (!canSafehouse && isOwned && tile.isHeadquarters) {
          reasons.safehouse = 'Cannot use HQ';
        }
        if (isEnemyHQ && !canAssaultHQ) {
          if (!isSoldier) reasons.assault_hq = 'Need a soldier';
          else if (unitOnTargetHex) reasons.assault_hq = 'Must be adjacent, not on HQ';
          else if (!meetsToughness) reasons.assault_hq = `Need Tough ≥ 4, Loyalty ≥ 70`;
        }
        
        // Filter out empty reasons
        Object.keys(reasons).forEach(k => { if (!reasons[k]) delete reasons[k]; });
        
        const hasAnyAction = canHit || canExtort || canClaim || canNegotiate || canSabotage || canSafehouse || canAssaultHQ || canFlipSoldier;
        const hasAnyReason = Object.keys(reasons).length > 0;
        
        if (hasAnyAction || hasAnyReason) {
          if (actionMenu && actionMenu.tile.q === tile.q && actionMenu.tile.r === tile.r) {
            setActionMenu(null);
          } else {
            setActionMenu({ tile, canHit, canExtort, canClaim, canNegotiate, canSabotage, canSafehouse, canAssaultHQ, canFlipSoldier, negotiateCapoId, reasons });
          }
          return;
        }
      }
      
      // Clicking a non-target hex or own hex with units — try to select a different unit
      if (playerUnitsHere.length > 0 && onSelectUnit) {
        const soldier = playerUnitsHere.find(u => u.type === 'soldier');
        const capo = playerUnitsHere.find(u => u.type === 'capo');
        const unitToSelect = soldier || capo;
        if (unitToSelect) {
          onSelectUnit(unitToSelect.type, { q: tile.q, r: tile.r, s: tile.s });
        }
      }
      setActionMenu(null);
      return;
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
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-noir-dark/50 to-background/50" onClick={e => e.stopPropagation()}>
      {/* Business placement banner */}
      {isBusinessPlacementMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-6 py-2 rounded-full bg-green-600/90 backdrop-blur-sm border border-green-400/30 shadow-lg flex items-center gap-3">
          <span className="text-sm font-bold text-white">📍 Select a hex with a Capo to place {pendingBuild?.businessType}</span>
          <button
            className="text-xs text-white/70 hover:text-white underline"
            onClick={() => onAction?.({ type: 'cancel_business_placement' })}
          >Cancel</button>
        </div>
      )}
      {/* Plan Hit mode banner */}
      {planHitMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-6 py-2 rounded-full bg-destructive/90 backdrop-blur-sm border border-destructive/30 shadow-lg flex items-center gap-3">
          <span className="text-sm font-bold text-white">
            🎯 {planHitStep === 'selectSoldier' ? 'Select a soldier from the menu' : 'Select a scouted enemy hex to target'}
          </span>
          <button
            className="text-xs text-white/70 hover:text-white underline"
            onClick={() => { setPlanHitUnitMenu(null); onCancelPlanHit?.(); }}
          >Cancel</button>
        </div>
      )}
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
            {/* District background tint layer */}
            <g className="pointer-events-none">
              {hexMap.map(tile => {
                const { x, y } = getHexPosition(tile.q, tile.r);
                const tint = districtTints[tile.district];
                if (!tint) return null;
                return (
                  <polygon
                    key={`tint-${tile.q},${tile.r},${tile.s}`}
                    points={getHexPoints(x, y, baseHexRadius)}
                    fill={tint}
                    stroke="none"
                  />
                );
              })}
            </g>

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
                  {(() => {
                    const isPlayerBuilt = tile.business && !tile.business.isExtorted && isPlayerTerritory;
                    const isConstructionComplete = tile.business && (!tile.business.constructionGoal || (tile.business.constructionProgress ?? 0) >= tile.business.constructionGoal);
                    const showBuiltIndicator = isPlayerBuilt && isConstructionComplete;
                    const hexStroke = tile.isHeadquarters ? '#D4AF37'
                      : showBuiltIndicator ? '#10B981'
                      : (tile.business?.isLegal && isPlayerTerritory) ? '#3B82F6'
                      : isPlayerTerritory ? '#D4AF3780' : '#333333';
                    const hexStrokeWidth = tile.isHeadquarters ? 3
                      : showBuiltIndicator ? 2.5
                      : (tile.business?.isLegal && isPlayerTerritory) ? 2.5
                      : isPlayerTerritory ? 2 : 1;
                    return (
                      <>
                        <polygon
                          points={getHexPoints(x, y, baseHexRadius)}
                          fill={getHexColor(tile)}
                          stroke={hexStroke}
                          strokeWidth={hexStrokeWidth}
                          strokeDasharray={showBuiltIndicator ? '6 3' : undefined}
                          opacity={getHexOpacity(tile)}
                          className="cursor-pointer transition-all duration-150"
                          onClick={() => handleHexClick(tile)}
                          onMouseEnter={() => setHoveredHex(tile)}
                          onMouseLeave={() => setHoveredHex(null)}
                        />
                        {showBuiltIndicator && (
                          <>
                            <polygon
                              points={getHexPoints(x, y, baseHexRadius * 0.85)}
                              fill="#10B98112"
                              stroke="none"
                              className="pointer-events-none"
                            />
                            <text x={x + baseHexRadius * 0.55} y={y - baseHexRadius * 0.45} textAnchor="middle" fontSize="8" className="pointer-events-none select-none">
                              🏗️
                            </text>
                          </>
                        )}
                      </>
                    );
                  })()}

                  {/* Deploy/Move label */}
                  {(isDeployTarget || isMoveTarget) && (
                    <text x={x} y={y - 12} textAnchor="middle" fontSize="8" fill="#ffffff" fontWeight="bold" className="pointer-events-none select-none">
                      {isDeployTarget ? 'DEPLOY' : 'MOVE'}
                    </text>
                  )}

                  {/* Business/HQ icon */}
                  <text x={x} y={y + (tile.business && !tile.isHeadquarters ? 1 : 5)} textAnchor="middle" fontSize="16" className="pointer-events-none select-none">
                    {tile.isHeadquarters ? '🏛️' : tile.business ? (tile.business.constructionGoal && (tile.business.constructionProgress ?? 0) < tile.business.constructionGoal ? '🚧' : (businessIcons[tile.business.type] || '🏢')) : ''}
                  </text>
                  {/* Construction progress label */}
                  {tile.business && tile.business.constructionGoal && (tile.business.constructionProgress ?? 0) < tile.business.constructionGoal && !tile.isHeadquarters && (() => {
                    const hexKey = `${tile.q},${tile.r},${tile.s}`;
                    const hexUnits = unitsByHex.get(hexKey) || [];
                    const hasCapoOnHex = hexUnits.some(u => u.family === playerFamily && u.type === 'capo');
                    const hasSoldierOnHex = hexUnits.some(u => u.family === playerFamily && u.type === 'soldier');
                    const remaining = tile.business!.constructionGoal! - (tile.business!.constructionProgress ?? 0);
                    let rate = 0;
                    let icon = '⏸️';
                    if (hasCapoOnHex) { rate = 1.5; icon = '⚡'; }
                    else if (hasSoldierOnHex) { rate = 0.75; icon = '🐢'; }
                    const estTurns = rate > 0 ? Math.ceil(remaining / rate) : null;
                    return (
                      <text x={x} y={y + 14} textAnchor="middle" fontSize="7" fill="#F59E0B" fontWeight="700" className="pointer-events-none select-none">
                        {icon} {estTurns !== null ? `${estTurns}t` : 'PAUSED'}
                      </text>
                    );
                  })()}

                  {/* District abbreviation label */}
                  {!tile.isHeadquarters && !tile.business && (
                    <text x={x} y={y + 3} textAnchor="middle" fontSize="7" fill="#ffffff" fillOpacity="0.3" fontWeight="600" className="pointer-events-none select-none">
                      {districtAbbreviations[tile.district] || ''}
                    </text>
                  )}

                  {/* Always-visible income label (hide during construction) */}
                  {tile.business && !tile.isHeadquarters && !(tile.business.constructionGoal && (tile.business.constructionProgress ?? 0) < tile.business.constructionGoal) && (
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
                  {gameState?.safehouses?.some((s: any) => s.q === tile.q && s.r === tile.r && s.s === tile.s) && (
                    <g className="pointer-events-none">
                      <circle cx={x - baseHexRadius * 0.55} cy={y - baseHexRadius * 0.55} r="8" fill="#F59E0B" stroke="#ffffff" strokeWidth="1" />
                      <text x={x - baseHexRadius * 0.55} y={y - baseHexRadius * 0.55 + 3.5} textAnchor="middle" fontSize="9" className="select-none">🏠</text>
                    </g>
                  )}

                  {/* Planned Hit crosshair indicator — original hex */}
                  {gameState?.plannedHit && gameState.plannedHit.q === tile.q && gameState.plannedHit.r === tile.r && gameState.plannedHit.s === tile.s && (() => {
                    const target = (gameState.deployedUnits || []).find((u: DeployedUnit) => u.id === gameState.plannedHit?.targetUnitId);
                    const targetStillHere = target && target.q === tile.q && target.r === tile.r && target.s === tile.s;
                    const opacity = targetStillHere ? 1 : 0.35; // Faded if target moved
                    return (
                      <g className="pointer-events-none" opacity={opacity}>
                        <circle cx={x + baseHexRadius * 0.55} cy={y + baseHexRadius * 0.55} r="8" fill="#DC2626" stroke="#ffffff" strokeWidth="1" />
                        <text x={x + baseHexRadius * 0.55} y={y + baseHexRadius * 0.55 + 3.5} textAnchor="middle" fontSize="9" className="select-none">🎯</text>
                      </g>
                    );
                  })()}

                  {/* Planned Hit crosshair — target's current hex (if relocated) */}
                  {gameState?.plannedHit && (() => {
                    const target = (gameState.deployedUnits || []).find((u: DeployedUnit) => u.id === gameState.plannedHit?.targetUnitId);
                    if (!target) return null;
                    const onOriginal = target.q === gameState.plannedHit.q && target.r === gameState.plannedHit.r && target.s === gameState.plannedHit.s;
                    if (onOriginal) return null; // Already shown above
                    const isThisHex = target.q === tile.q && target.r === tile.r && target.s === tile.s;
                    if (!isThisHex) return null;
                    return (
                      <g className="pointer-events-none">
                        <circle cx={x + baseHexRadius * 0.55} cy={y + baseHexRadius * 0.55} r="9" fill="#F97316" stroke="#ffffff" strokeWidth="1.5" />
                        <text x={x + baseHexRadius * 0.55} y={y + baseHexRadius * 0.55 + 3.5} textAnchor="middle" fontSize="9" className="select-none">🎯</text>
                      </g>
                    );
                  })()}

                  {/* Plan Hit mode — step 1: highlight hexes with player soldiers */}
                  {planHitMode && planHitStep === 'selectSoldier' && (() => {
                    const key2 = `${tile.q},${tile.r},${tile.s}`;
                    const unitsHere2 = unitsByHex.get(key2) || [];
                    const hasPlayerSoldier = unitsHere2.some(u => u.family === playerFamily && u.type === 'soldier');
                    if (hasPlayerSoldier) {
                      return (
                        <polygon
                          points={getHexPoints(x, y, baseHexRadius + 3)}
                          fill="none"
                          stroke="#22C55E"
                          strokeWidth="2.5"
                          opacity="0.8"
                          strokeDasharray="6,3"
                          className="pointer-events-none animate-pulse"
                        />
                      );
                    }
                    return null;
                  })()}

                  {/* Plan Hit mode — step 2: highlight scouted enemy hexes + planner hex */}
                  {planHitMode && planHitStep === 'selectTarget' && (() => {
                    // Highlight planner's hex with gold pulsing outline
                    if (planHitPlannerId) {
                      const plannerUnit = (gameState?.deployedUnits || []).find((u: DeployedUnit) => u.id === planHitPlannerId);
                      if (plannerUnit && plannerUnit.q === tile.q && plannerUnit.r === tile.r && plannerUnit.s === tile.s) {
                        return (
                          <polygon
                            points={getHexPoints(x, y, baseHexRadius + 4)}
                            fill="none"
                            stroke="#F59E0B"
                            strokeWidth="3"
                            opacity="0.9"
                            strokeDasharray="8,4"
                            className="pointer-events-none animate-pulse"
                          />
                        );
                      }
                    }
                    const isEnemy = tile.controllingFamily !== 'neutral' && tile.controllingFamily !== playerFamily;
                    const isScouted = scoutedHexes.some((s: ScoutedHex) => s.q === tile.q && s.r === tile.r && s.s === tile.s);
                    if (isEnemy && isScouted) {
                      return (
                        <polygon
                          points={getHexPoints(x, y, baseHexRadius + 3)}
                          fill="none"
                          stroke="#DC2626"
                          strokeWidth="2.5"
                          opacity="0.8"
                          strokeDasharray="6,3"
                          className="pointer-events-none animate-pulse"
                        />
                      );
                    }
                    return null;
                  })()}

                  {/* Fortified hex indicator */}
                  {(() => {
                    const fortifiedHexes = gameState?.fortifiedHexes || [];
                    const isPlayerFortified = fortifiedHexes.some((f: any) => 
                      f.family === gameState?.playerFamily && f.q === tile.q && f.r === tile.r && f.s === tile.s
                    );
                    if (!isPlayerFortified) return null;
                    return (
                      <g className="pointer-events-none">
                        <circle cx={x} cy={y - baseHexRadius * 0.7} r={8} fill="#10B981" stroke="#ffffff" strokeWidth="1" />
                        <text x={x} y={y - baseHexRadius * 0.7 + 3.5} textAnchor="middle" fontSize="9" className="select-none">🛡️</text>
                      </g>
                    );
                  })()}

                  {/* Boss highlight hex — gold pulsing ring */}
                  {bossHighlightHex && bossHighlightHex.q === tile.q && bossHighlightHex.r === tile.r && bossHighlightHex.s === tile.s && (
                    <polygon
                      points={getHexPoints(x, y, baseHexRadius + 5)}
                      fill="none"
                      stroke="#D4AF37"
                      strokeWidth="3"
                      opacity="0.9"
                      strokeDasharray="8,4"
                      className="pointer-events-none animate-pulse"
                    />
                  )}

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
                  {showSoldiers && unitsHere.length > 0 && (!tile.isHeadquarters || expandedHQKey === key || gameState?.turnPhase === 'move' || gameState?.turnPhase === 'action') && (() => {
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

                    // Show units at HQ during deploy so players can select them for movement
                    if (!isAtHQ) {
                      // Normal compact layout — skip HQ hexes (deployment menu handles those)
                      let offsetIdx = 0;
                      const hexRevealed = isHexRevealed(tile);

                      caposByFamily.forEach((capos, fam) => {
                        // Fog of War: hide rival units unless hex is revealed
                        if (fam !== playerFamily && !hexRevealed) return;
                        const capo = capos[0];
                        const isSelected = selectedUnitId === capo.id;
                        const isClickable = fam === playerFamily && (turnPhase === 'move' || turnPhase === 'deploy' || turnPhase === 'action');
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
                            wounded={(capo as any).woundedTurnsRemaining > 0}
                            onClick={isClickable ? (e) => {
                              e.stopPropagation();
                              if ((turnPhase === 'deploy' || turnPhase === 'move' || turnPhase === 'action') && onSelectUnit) {
                                onSelectUnit('capo', { q: tile.q, r: tile.r, s: tile.s });
                              }
                            } : undefined}
                          />
                        );
                        offsetIdx++;
                      });

                      soldiersByFamily.forEach((soldiers, fam) => {
                        // Fog of War: hide rival units unless hex is revealed
                        if (fam !== playerFamily && !hexRevealed) return;
                        const firstSoldier = soldiers[0];
                        const isSelected = soldiers.some(s => s.id === selectedUnitId);
                        const isClickable = fam === playerFamily && (turnPhase === 'move' || turnPhase === 'deploy' || turnPhase === 'action');
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
                              if ((turnPhase === 'deploy' || turnPhase === 'move' || turnPhase === 'action') && onSelectUnit) {
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
              const menuWidth = 150;
              const activeCount = [actionMenu.canHit, actionMenu.canExtort, actionMenu.canClaim, actionMenu.canNegotiate, actionMenu.canSabotage, actionMenu.canSafehouse, actionMenu.canAssaultHQ, actionMenu.canFlipSoldier].filter(Boolean).length;
              const disabledCount = Object.keys(actionMenu.reasons || {}).length;
              const totalItems = activeCount + disabledCount;
              const menuHeight = totalItems * 38 + 30;
              const noActions = gameState?.actionsRemaining === 0;
              const reasons = actionMenu.reasons || {};

              const DisabledAction = ({ icon, label, reason }: { icon: string; label: string; reason: string }) => (
                <div className="flex flex-col px-2.5 py-1 rounded-md opacity-40 cursor-not-allowed">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">{icon} {label}</span>
                  <span className="text-[8px] text-destructive/80 ml-5">{reason}</span>
                </div>
              );

              return (
                <foreignObject
                  x={x - menuWidth / 2}
                  y={y - baseHexRadius - menuHeight - 8}
                  width={menuWidth}
                  height={menuHeight + 20}
                  className="overflow-visible"
                >
                  <div className="text-[9px] font-bold text-center mb-0.5 text-muted-foreground">
                    ⚔️ {gameState?.actionsRemaining ?? '?'}/{gameState?.maxActions ?? '?'} Actions
                  </div>
                  <div className={cn("flex flex-col gap-0.5 bg-background/95 backdrop-blur-sm border border-primary/40 rounded-lg p-1.5 shadow-xl", noActions && !disabledCount && "opacity-50 pointer-events-none")}>
                    {actionMenu.canHit ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onAction) onAction({
                            type: 'hit_territory',
                            targetQ: actionMenu.tile.q,
                            targetR: actionMenu.tile.r,
                            targetS: actionMenu.tile.s,
                            selectedUnitId: gameState?.selectedUnitId,
                          });
                          setActionMenu(null);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-destructive/90 hover:bg-destructive text-destructive-foreground text-xs font-bold transition-colors"
                      >
                        ⚔️ Hit Territory
                        {gameState?.plannedHit && gameState.plannedHit.q === actionMenu.tile.q && gameState.plannedHit.r === actionMenu.tile.r && gameState.plannedHit.s === actionMenu.tile.s && (
                          <span className="ml-1 text-[9px] bg-background/30 px-1 rounded">+20% 🎯</span>
                        )}
                      </button>
                    ) : reasons.hit ? (
                      <DisabledAction icon="⚔️" label="Hit Territory" reason={reasons.hit} />
                    ) : null}
                    {actionMenu.canSabotage ? (
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
                    ) : reasons.sabotage ? (
                      <DisabledAction icon="💣" label="Sabotage" reason={reasons.sabotage} />
                    ) : null}
                    {actionMenu.canExtort ? (
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
                    ) : reasons.extort ? (
                      <DisabledAction icon="💰" label="Extort" reason={reasons.extort} />
                    ) : null}
                    {actionMenu.canClaim ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onAction) onAction({
                            type: 'claim_territory',
                            targetQ: actionMenu.tile.q,
                            targetR: actionMenu.tile.r,
                            targetS: actionMenu.tile.s,
                            unitId: gameState.selectedUnitId,
                          });
                          setActionMenu(null);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-secondary/90 hover:bg-secondary text-secondary-foreground text-xs font-bold transition-colors"
                      >
                        🏴 Claim Territory
                      </button>
                    ) : reasons.claim ? (
                      <DisabledAction icon="🏴" label="Claim Territory" reason={reasons.claim} />
                    ) : null}
                    {actionMenu.canNegotiate ? (
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
                    ) : reasons.negotiate ? (
                      <DisabledAction icon="🤝" label="Negotiate" reason={reasons.negotiate} />
                    ) : null}
                    {actionMenu.canSafehouse ? (
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
                    ) : reasons.safehouse ? (
                      <DisabledAction icon="🏠" label="Safehouse" reason={reasons.safehouse} />
                    ) : null}
                    {actionMenu.canAssaultHQ ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onAction) onAction({
                            type: 'assault_hq',
                            targetQ: actionMenu.tile.q,
                            targetR: actionMenu.tile.r,
                            targetS: actionMenu.tile.s,
                            selectedUnitId: gameState?.selectedUnitId,
                          });
                          setActionMenu(null);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-destructive hover:bg-destructive/80 text-destructive-foreground text-xs font-bold transition-colors"
                      >
                        💀 Assault HQ
                      </button>
                    ) : reasons.assault_hq ? (
                      <DisabledAction icon="💀" label="Assault HQ" reason={reasons.assault_hq} />
                    ) : null}
                    {actionMenu.canFlipSoldier ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onAction) onAction({
                            type: 'flip_soldier',
                            targetQ: actionMenu.tile.q,
                            targetR: actionMenu.tile.r,
                            targetS: actionMenu.tile.s,
                          });
                          setActionMenu(null);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-colors"
                      >
                        🐀 Flip Soldier ($5K)
                      </button>
                    ) : null}
                  </div>
                </foreignObject>
              );
            })()}

            {/* Plan Hit — target unit picker popup */}
            {planHitUnitMenu && (() => {
              const { x, y } = getHexPosition(planHitUnitMenu.tile.q, planHitUnitMenu.tile.r);
              const menuWidth = 160;
              const menuHeight = planHitUnitMenu.enemyUnits.length * 34 + 30;
              return (
                <foreignObject x={x - menuWidth / 2} y={y - menuHeight - baseHexRadius} width={menuWidth} height={menuHeight}>
                  <div className="bg-background/95 backdrop-blur-sm border border-destructive/50 rounded-lg p-2 shadow-xl">
                    <div className="text-xs font-bold text-destructive text-center mb-1.5">🎯 Select Target</div>
                    {planHitUnitMenu.enemyUnits.map(unit => (
                      <button
                        key={unit.id}
                        onClick={() => {
                          onPlanHitSelect?.(planHitUnitMenu.tile.q, planHitUnitMenu.tile.r, planHitUnitMenu.tile.s, unit.id);
                          setPlanHitUnitMenu(null);
                        }}
                        className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md bg-destructive/20 hover:bg-destructive/40 text-foreground text-xs font-medium transition-colors"
                      >
                        {unit.type === 'capo' ? '👔' : '🔫'} {unit.name || unit.id.split('-').slice(-2).join(' ')}
                      </button>
                    ))}
                  </div>
                </foreignObject>
              );
            })()}
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
              <p><span className="text-muted-foreground">Control:</span> {(hoveredHex.controllingFamily || 'neutral').toUpperCase()}</p>
              <p><span className="text-muted-foreground">Terrain:</span> {hoveredHex.terrain}</p>
              {hoveredHex.business && (() => {
                const isUnderConstruction = hoveredHex.business.constructionGoal && (hoveredHex.business.constructionProgress ?? 0) < hoveredHex.business.constructionGoal;
                const hexKey = `${hoveredHex.q},${hoveredHex.r},${hoveredHex.s}`;
                const hexUnits = unitsByHex.get(hexKey) || [];
                const hasCapoH = hexUnits.some(u => u.family === playerFamily && u.type === 'capo');
                const hasSoldierH = hexUnits.some(u => u.family === playerFamily && u.type === 'soldier');
                return (
                  <>
                    <p><span className="text-muted-foreground">Business:</span> {hoveredHex.business.type.replace('_', ' ').toUpperCase()}</p>
                    <p><span className="text-muted-foreground">Type:</span> {hoveredHex.business.isLegal ? 'Legal' : 'Illegal'}</p>
                    {isUnderConstruction ? (
                      <div className="mt-1 p-1.5 rounded bg-yellow-900/40 border border-yellow-500/30">
                        <p className="text-yellow-300 font-bold text-xs">🚧 UNDER CONSTRUCTION</p>
                        <p><span className="text-muted-foreground">Progress:</span> {(hoveredHex.business.constructionProgress ?? 0).toFixed(1)} / {hoveredHex.business.constructionGoal!.toFixed(1)}</p>
                        <p><span className="text-muted-foreground">Speed:</span> {hasCapoH ? '⚡ Capo: 50% faster' : hasSoldierH ? '🐢 Soldier: 25% slower' : '⏸️ Paused — no unit'}</p>
                        {(hasCapoH || hasSoldierH) && (() => {
                          const rate = hasCapoH ? 1.5 : 0.75;
                          const rem = hoveredHex.business.constructionGoal! - (hoveredHex.business.constructionProgress ?? 0);
                          return <p><span className="text-muted-foreground">Est. turns:</span> {Math.ceil(rem / rate)}</p>;
                        })()}
                      </div>
                    ) : (
                      <p><span className="text-muted-foreground">Income:</span> ${hoveredHex.business.income.toLocaleString()}/turn</p>
                    )}
                  </>
                );
              })()}
              {hoveredHex.isHeadquarters && (
                <p className="text-mafia-gold font-bold">🏛️ {hoveredHex.isHeadquarters.toUpperCase()} HQ</p>
              )}
              {/* Scouted intel */}
              {(() => {
                const scoutInfo = (gameState?.scoutedHexes || []).find((s: ScoutedHex) => s.q === hoveredHex.q && s.r === hoveredHex.r && s.s === hoveredHex.s);
                if (!scoutInfo) return null;
                const currentTurn = gameState?.turn || 0;
                const isFresh = currentTurn <= scoutInfo.freshUntilTurn;
                
                // For fresh intel, show live unit count from deployedUnits
                const liveEnemyCount = isFresh
                  ? deployedUnits.filter(u => u.q === hoveredHex.q && u.r === hoveredHex.r && u.s === hoveredHex.s && u.family !== playerFamily).length
                  : scoutInfo.enemySoldierCount;

                return (
                  <div className={cn(
                    "mt-1 p-1.5 rounded border",
                    isFresh 
                      ? "bg-blue-900/40 border-blue-500/30" 
                      : "bg-amber-900/30 border-amber-500/30"
                  )}>
                    <p className={cn("font-bold text-xs", isFresh ? "text-blue-300" : "text-amber-300")}>
                      {isFresh ? '👁️ LIVE INTEL' : '⚠️ STALE INTEL'} ({scoutInfo.turnsRemaining}t left)
                    </p>
                    <p><span className="text-muted-foreground">Enemy:</span> {liveEnemyCount} units ({scoutInfo.enemyFamily})</p>
                    {scoutInfo.businessType && <p><span className="text-muted-foreground">Business:</span> {scoutInfo.businessType} (${scoutInfo.businessIncome?.toLocaleString()}/turn)</p>}
                    {!isFresh && <p className="text-amber-400/70 text-xs italic">Unit count may be outdated</p>}
                  </div>
                );
              })()}
              {(() => {
                const key = `${hoveredHex.q},${hoveredHex.r},${hoveredHex.s}`;
                const units = unitsByHex.get(key) || [];
                const hexRevealed = isHexRevealed(hoveredHex);
                
                // Fog of War: show mystery text for unrevealed rival hexes with units
                if (!hexRevealed && hoveredHex.controllingFamily !== 'neutral' && hoveredHex.controllingFamily !== playerFamily) {
                  return (
                    <p className="text-muted-foreground italic">
                      👁️‍🗨️ Intel unknown — scout or bribe to reveal
                    </p>
                  );
                }
                
                if (units.length === 0) return null;
                return units.filter(u => u.family === playerFamily || hexRevealed).map(u => (
                  <p key={u.id} className={u.family === playerFamily ? 'text-green-400' : 'text-red-400'}>
                    {u.type === 'capo' ? `👔 ${u.name} (Lvl ${u.level})${u.personality ? ` ${u.personality === 'diplomat' ? '🕊️' : u.personality === 'enforcer' ? '💪' : '🧠'}` : ''}` : '👤 Soldier'} — {u.family.toUpperCase()}
                    {u.family === playerFamily && ` (${u.movesRemaining} moves)`}
                  </p>
                ));
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-30">
        <button
          onClick={() => setShowLegend(prev => !prev)}
          className="bg-card/90 backdrop-blur-sm border border-border rounded px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {showLegend ? '▼ Legend' : '▶ Legend'}
        </button>
        {showLegend && (
          <div className="mt-1 bg-card/95 backdrop-blur-sm border border-border rounded p-2.5 space-y-1.5 min-w-[160px]">
            <div className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider mb-1">Hex Outlines</div>
            {[
              { color: '#D4AF37', label: 'Headquarters', style: 'solid', width: 3 },
              { color: '#10B981', label: 'Player-Built', style: 'dashed', width: 2.5 },
              { color: '#3B82F6', label: 'Legal Business', style: 'solid', width: 2.5 },
              { color: '#D4AF3780', label: 'Your Territory', style: 'solid', width: 2 },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <svg width="20" height="12" className="flex-shrink-0">
                  <line x1="0" y1="6" x2="20" y2="6" stroke={item.color} strokeWidth={item.width} strokeDasharray={item.style === 'dashed' ? '4 2' : undefined} />
                </svg>
                <span className="text-[10px] text-muted-foreground">{item.label}</span>
              </div>
            ))}
            <div className="border-t border-border pt-1.5 mt-1.5">
              <div className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider mb-1">Badges</div>
              {[
                { icon: '🏛️', label: 'Headquarters' },
                { icon: '🏗️', label: 'Player-Built Biz' },
                { icon: '🚧', label: 'Under Construction' },
                { icon: '👁️', label: 'Scouted Hex' },
                { icon: '🩸', label: 'Wounded Capo' },
                { icon: '🛡️', label: 'Safehouse' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-[10px] w-4 text-center flex-shrink-0">{item.icon}</span>
                  <span className="text-[10px] text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMafiaHexGrid;
