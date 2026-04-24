

# Fix GameGuide recruit prices + add discount hint

## Changes

**1. `src/components/GameGuide.tsx`** — fix stale numbers
- Line 155: `"$3,000 (loyal) or $1,500 (mercenary)"` → `"$600 (loyal) or $1,500 (mercenary)"`
- Line 241: `"$3,000 loyal / $1,500 mercenary"` → `"$600 loyal / $1,500 mercenary"`

**2. `src/components/GameSidePanels.tsx`** — UX hint
- When `totalSoldierDiscount > 0`, show "(X% discount applied)" beneath the recruit price so the gap between the documented base ($600 / $1,500) and the displayed discounted price is obvious. Use the combined discount value (respect + family, capped at 50%), not just respect.

## What Doesn't Change

`LOCAL_SOLDIER_COST`, `SOLDIER_COST`, discount math/cap, recruit flow, docs (already synced).

