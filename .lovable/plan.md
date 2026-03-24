

# Respect & Influence Benefits + Rival Panel Enhancement

## Part 1: Answer — Current Benefits

**Respect** (0–100):
- **Extortion payout multiplier**: 0.5x at 0 respect → 1.5x at 100 respect
- **Recruitment discount**: Up to 30% off soldier costs at 100 respect
- **+1 bonus action per turn** when both respect ≥ 50 AND influence ≥ 50

**Influence** (0–100):
- **Extortion success bonus**: Up to +15%
- **Bribe success bonus**: Up to +12%
- **+1 bonus action per turn** when both influence ≥ 50 AND respect ≥ 50
- Gained passively: +1 per 3 hexes controlled

## Part 2: Add Respect + Influence to Rival Families Panel

### `src/types/enhanced-mechanics.ts`
Add `respect: number` to the `AIOpponent.resources` interface.

### `src/hooks/useEnhancedMafiaGameState.ts`
- Initialize AI `resources.respect` to 20 (starting value)
- Grow AI respect each turn based on territory and combat (similar to player formula)

### `src/components/GameSidePanels.tsx` (~lines 662-675)
Change the rival family info grid from 3 columns to a 2x2 grid showing:
- Money | Soldiers
- Respect | Influence

## Files Modified
- `src/types/enhanced-mechanics.ts`
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/components/GameSidePanels.tsx`

