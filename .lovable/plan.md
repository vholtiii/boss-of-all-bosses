

# Rework Soldier Acquisition: Buy vs Recruit, Tactical Phase Only

## Summary

Split soldier acquisition into **Buy (Mercenary)** and **Recruit (Loyal)**, available only during the Tactical phase in a dedicated Recruitment section.

## Design

| Property | Buy Soldier (Mercenary) | Recruit Soldier (Loyal) |
|---|---|---|
| Cost | **$1,500** | $300 |
| Territory required | None | 10+ controlled hexes |
| Loyalty effect | **-3** | **+2** |
| Combat (hits) | Average (training 5) | Poor (training 2) |
| Claim bonus | None | +15% success |
| Extortion bonus | None | +10% success |

Mercenaries cost 5× more than recruits — they're combat-ready but expensive and hurt loyalty. Recruits are cheap and loyal but need experience.

## Changes

### 1. `src/types/game-mechanics.ts`
- Change `SOLDIER_COST` from 500 to **1500**
- Add `LOCAL_SOLDIER_COST = 300`
- Add `RECRUIT_TERRITORY_REQUIREMENT = 10`

### 2. `src/hooks/useEnhancedMafiaGameState.ts`
- **`DeployedUnit`**: Add `recruited?: boolean` flag
- **`recruit_soldiers`**: Uses `SOLDIER_COST` (now $1,500), applies -3 loyalty
- **New `recruit_local_soldier`**: Requires 10+ hexes, costs $300, +2 loyalty, training 2, `recruited: true`
- **`processExtort`**: +10% bonus for recruited units
- **`processClaim`**: +15% bonus for recruited units

### 3. `src/components/GameSidePanels.tsx`
- Move recruitment out of Economy into new **"Recruitment"** section, visible only during tactical phase (`phase === 'move'`)
- Three buttons:
  - **Buy Soldier (Mercenary)** — `$1,500 · -3 loyalty`
  - **Recruit Soldier (Loyal)** — `$300 · +2 loyalty · need 10 hexes`
  - **Recruit Capo** — moved here from Economy

## Files Modified
- `src/types/game-mechanics.ts`
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/components/GameSidePanels.tsx`

