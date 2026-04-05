

# Capo Promotion Rework: Cross-Discount Requirements + Loyalty Discount + 1-Turn Ceremony

## Promotion Eligibility (3 paths)

| Path | Victories | Racketeering |
|------|-----------|--------------|
| Racketeering maxed | ≥ 3 | 5 |
| Victories maxed | 5 | ≥ 3 |
| Neither maxed | ≥ 4 | ≥ 4 |

## Other Mechanics
- **Loyalty discount**: 25% off ($7,500 instead of $10,000) when loyalty = 80
- **1-turn ceremony**: Soldier enters immobile `pendingPromotion` state, converts to Capo at start of next turn
- **Personality**: Randomly assigned (unchanged)

## Technical Changes

### `src/types/game-mechanics.ts`
- Replace `CAPO_PROMOTION_REQUIREMENTS` with:
  - `maxThreshold: 5`, `discountedThreshold: 3`, `balancedThreshold: 4`
- Add `CAPO_PROMOTION_LOYALTY_DISCOUNT = 0.25`, `CAPO_PROMOTION_LOYALTY_THRESHOLD = 80`
- Remove `minLoyalty`, `minTraining`, `minToughness`

### `src/hooks/useEnhancedMafiaGameState.ts`
- **Eligibility**: `(v>=5 && r>=3) || (r>=5 && v>=3) || (v>=4 && r>=4)`
- **Promote action**: Set `pendingPromotion` flag, deduct cost (with discount), lock unit
- **Start-of-turn**: Convert pending units to Capos, assign personality, notify
- **Movement/action guards**: Skip `pendingPromotion` units
- **AI promotion**: Same 3-path eligibility, skip ceremony

### `src/components/CapoPromotionPanel.tsx`
- Show Victories and Racketeering progress only
- Indicate which path is closest / met
- Show discount text when loyalty = 80
- Show "In Ceremony" state for pending units

### `src/components/EnhancedMafiaHexGrid.tsx`
- Show 🎖️ badge on `pendingPromotion` units

## Files Modified
- `src/types/game-mechanics.ts`
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/components/CapoPromotionPanel.tsx`
- `src/components/EnhancedMafiaHexGrid.tsx`

