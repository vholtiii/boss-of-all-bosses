

# Show Only Loyalty in Deployed Units Soldier Info

## Change

**File: `src/components/HeadquartersInfoPanel.tsx`** (lines 522-528)

Replace the five stat badges (loyalty, training, toughness, victories, racketeering) with just the loyalty badge. Remove the `flex-wrap gap-1` wrapper div and keep only the `♥ {ss.loyalty}` span with its existing color-coding logic.

