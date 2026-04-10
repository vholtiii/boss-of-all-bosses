

# Enhanced District Control Bonuses

## Design

Each district gets its existing (primary) bonus **boosted** plus a new **secondary** bonus. Both activate at 60% control.

### Updated Bonus Table

| District | Primary Bonus (Boosted) | Secondary Bonus (New) |
|---|---|---|
| **Manhattan** | +25% business income (was +20%) | +1 max action point per turn |
| **Little Italy** | +20% loyalty retention (was +15%) | Free safehouse (soldiers hiding return 1 turn faster) |
| **Brooklyn** | -5 heat/turn (was -3) | +10% combat defense for all units in Brooklyn |
| **Bronx** | $750 off recruitment (was $500) | Free soldier recruit every 3 turns |
| **Queens** | +15% extortion success (was +10%) | +5% hit success on all attacks |
| **Staten Island** | +3 respect/turn (was +2) | +1 influence/turn |

### Universal District Control Bonus (any controlled district)
- **Turf Tax**: Enemy units on hexes in your controlled districts lose **5 loyalty/turn**
- **Safe Passage**: Friendly units get **+1 movement range** within controlled districts

## Files Modified

1. **`src/hooks/useEnhancedMafiaGameState.ts`**
   - Update `DISTRICT_BONUSES` to include both primary and secondary bonus types per district
   - Boost primary bonus values at each application point (income 1.2→1.25, loyalty +0.5→+0.7, heat 3→5, recruit $500→$750, extortion 0.10→0.15, respect 2→3)
   - Add secondary bonus checks: Manhattan AP boost in turn start, Brooklyn defense in combat, Bronx free recruit counter, Queens hit bonus, Staten Island influence, Little Italy hiding reduction
   - Add universal turf tax logic in turn processing (enemy loyalty drain)
   - Add safe passage movement bonus when moving through controlled districts
   - Update `hasPlayerDistrictBonus` to support multiple bonus types per district

2. **`src/components/GameSidePanels.tsx`**
   - Update the District Control UI section to show both primary and secondary bonuses
   - Show universal bonuses (Turf Tax, Safe Passage) when player controls any district

3. **`GAME_MECHANICS.md`** / **`COMBAT_SYSTEM_GUIDE.md`**
   - Document the enhanced district control system with all new bonuses

