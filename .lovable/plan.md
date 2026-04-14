

# Add Loyalty to Capo Promotion Panel, Soldier Stats to Deployed Units, and Loyalty Requirement for Promotion

## Changes

### 1. Add loyalty display to CapoPromotionPanel soldier cards
**File: `src/components/CapoPromotionPanel.tsx`**
- Add a new `Req` line showing `Loyalty: X/70` with a check/X icon based on whether loyalty >= 70
- Place it after the existing requirement lines (victories, racketeering, balanced path)

### 2. Add loyalty requirement to promotion eligibility
**File: `src/types/game-mechanics.ts`**
- Update `isCapoPromotionEligible()` (line 387) to also require `stats.loyalty >= 70`
- The function currently only checks victories/racketeering — add `&& stats.loyalty >= 70`

### 3. Add soldier stats to Deployed Units in Boss dropdown
**File: `src/components/HeadquartersInfoPanel.tsx`**
- In the Deployed Units list (lines 499-523), expand each unit's info to show key stats from `soldierStats[unit.id]`: loyalty, training, toughness, victories, racketeering
- Display as a compact row of stat badges beneath the unit name/district line
- Only show stats for soldiers (not capos, which have different stat tracking)

### Files Modified
1. `src/types/game-mechanics.ts` — 1-line edit to `isCapoPromotionEligible`
2. `src/components/CapoPromotionPanel.tsx` — Add loyalty requirement display line
3. `src/components/HeadquartersInfoPanel.tsx` — Add stat badges to deployed unit entries

