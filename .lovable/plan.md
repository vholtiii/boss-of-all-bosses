
# HQ Assault & Domination Victory — Implemented

## Features Added

### Assault HQ
- Soldiers (toughness ≥ 4, loyalty ≥ 70) can assault enemy HQ from adjacent hex
- Base 15% success, -30% HQ defense, +5% per friendly adjacent, +10% per flipped soldier
- Max 50% chance cap
- Success: family eliminated, all units/territory wiped, +$25K, +30 respect, +40 fear
- Failure: soldier killed, adjacent allies -30 loyalty, no heat penalty

### Flip Soldier
- $5,000 to attempt turning enemy soldier near their HQ (loyalty > 60)
- Base 25% success, +10% if loyalty 60-70, +5% per 10 influence above 50, +10% schemer capo bonus
- Success: soldier flipped (HQ defense -10%), enemy unaware
- Failure: -15 influence, target loyalty +10, attempt discovered

### HQ Protection
- HQ hexes cannot be scouted, claimed, or extorted
- Normal hit/sabotage/negotiate blocked on HQ hexes

### Domination Victory
- Eliminate all 4 rival families → win
- Tracked in VictoryTracker with skull icon

### AI Behavior
- Aggressive/unpredictable AI attempts HQ assaults after turn 12 (10% chance/turn)

## Files Modified
- `src/types/game-mechanics.ts` — constants, FlippedSoldier interface, VictoryProgress update
- `src/hooks/useEnhancedMafiaGameState.ts` — processHQAssault, processFlipSoldier, AI assault logic, HQ scout block
- `src/components/EnhancedMafiaHexGrid.tsx` — assault/flip UI buttons, HQ action blocking
- `src/components/VictoryTracker.tsx` — domination victory row
