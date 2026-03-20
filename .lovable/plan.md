

# Rework: Claim Territory — Strategic Community Expansion

## Concept

Claiming territory becomes a **strategic, community-building** action. No money reward. Instead, each empty claimed hex becomes a "neighborhood" under your protection — costing a small upkeep fee (gifts, community events) but earning influence and respect. The strategic value is that your controlled territory forms a buffer zone that limits enemy offensive movement toward your businesses.

## Changes

### 1. Claim Action Rewards (File: `useEnhancedMafiaGameState.ts`)

Update `processClaimTerritory` to:
- **Remove** any money gain (already zero, confirmed)
- **Add +1 respect** and **+1 influence** (modest — less than extortion's +5 respect)
- **Notification flavor**: *"Your family takes this neighborhood under its wing. The locals appreciate the protection."*

### 2. Community Upkeep Cost (File: `useEnhancedMafiaGameState.ts`)

In `processEconomy`, after soldier maintenance, add a new expense line:
- Count player-controlled hexes **without a business** (empty claimed territory)
- Each costs **$150/turn** ("neighborhood expenses" — holiday gifts, turkey runs, block parties)
- Add to `maintenance` total so it shows in the Turn Summary as part of expenses

### 3. Defensive Territory Benefit — Movement Restriction

In the movement/action validation logic:
- Enemy AI units moving through **player-controlled empty territory** (no business) have their movement **reduced by 1** (zone of community resistance)
- This makes claiming a ring of empty hexes around your business hexes a viable defensive wall strategy
- Implemented during AI movement processing — AI units entering a player's claimed (non-business) hex spend an extra move point

### 4. Turn Summary Display

The existing Turn Summary already shows expenses via `maintenance`. The community upkeep will naturally appear in the "Costs" line. No modal changes needed — the expense flows through the existing `finances.totalExpenses` field.

## Strategic Impact

```text
Before:  Claim = free territory flip, no benefit, no cost
After:   Claim = +1 respect, +1 influence, -$150/turn upkeep
         Empty claimed hexes slow enemy movement (defensive buffer)
         
Tradeoff: Extort = risky, profitable, generates heat
          Claim  = safe, strategic, costs money but builds empire defense
```

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — claim rewards, community upkeep in economy, enemy movement penalty through claimed empty hexes

