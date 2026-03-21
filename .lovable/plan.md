

# Refine Soldier Attributes & Capo Promotion Requirements

## New Attribute System

| Attribute | Max (Soldier) | Max (Capo) | How it increases |
|---|---|---|---|
| **Victories** | **5** | — | +1 per successful extortion or hit action |
| **Loyalty** | **80** | **99** | Starts at 50 for bought soldiers |
| **Training** | **3** | — | +1 per turn deployed on map (not at HQ); starts at 0 |
| **Toughness** | **5** | — | +1 per survived combat encounter |
| **Racketeering** | **5** | — | +1 per successful extortion action |

**Capo promotion requires ALL maxed**: Victories = 5, Loyalty = 80, Training = 3, Toughness = 5, Racketeering = 5, plus $10,000.

## Changes

### 1. `src/types/game-mechanics.ts`
- Update `SoldierStats`: rename `survivedConflicts` → `victories`, add `toughness` (0-5), `racketeering` (0-5), `turnsDeployed` (internal). Remove `equipment`, `intimidations`.
- Training scale: 0-3 (was 1-10)
- Update `CAPO_PROMOTION_REQUIREMENTS`: `minVictories: 5, minLoyalty: 80, minTraining: 3, minToughness: 5, minRacketeering: 5`

### 2. `src/hooks/useEnhancedMafiaGameState.ts`
- Bought soldiers: loyalty 50, training 0
- Recruited soldiers: loyalty 65, training 0
- End-of-turn: +1 training (cap 3) for soldiers deployed away from HQ
- Victories: +1 (cap 5) on successful extortion or hit
- Toughness: +1 (cap 5) on surviving combat
- Racketeering: +1 (cap 5) on successful extortion
- Loyalty cap: 80 soldiers, 99 capos
- Replace all `survivedConflicts` references with `victories`

### 3. `src/components/CapoPromotionPanel.tsx`
- Show all 5 requirements in checklist (Victories 5, Loyalty 80, Training 3, Toughness 5, Racketeering 5)

### 4. `src/components/HitmanPanel.tsx`
- Update references for new training scale (0-3) and stats

## Files Modified
- `src/types/game-mechanics.ts`
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/components/CapoPromotionPanel.tsx`
- `src/components/HitmanPanel.tsx`

