

# Make Respect & Influence Impact Core Mechanics

## Changes

### File: `src/hooks/useEnhancedMafiaGameState.ts`

**1. Recruitment Cost Discount from Respect**
In deployment/recruit logic (~line 1175-1190):
- Up to **30% discount** at 100 respect: `cost = baseCost * (1 - (respect / 100) * 0.3)`
- Show discount in notifications

**2. Extortion Success Bonus from Influence**
In `processTerritoryExtortion` (~line 2315):
- Up to **+15%** success chance at 100 influence: `+ influence / 100 * 0.15`
- Stacks with family bonus and Manhattan penalty

**3. Extortion Payout Scaling from Respect (bidirectional)**
In `processTerritoryExtortion` (~line 2327) and Capo auto-extort (~line 908):
- Use a linear scale centered at 50 respect:
  - At 100 respect: **+50%** payout (`multiplier = 1.5`)
  - At 50 respect: **base** payout (`multiplier = 1.0`)
  - At 0 respect: **-50%** payout (`multiplier = 0.5`)
- Formula: `payout * (0.5 + (respect / 100))` — this naturally gives the full range from 0.5x to 1.5x
- Low respect means businesses don't fear you and pay less; high respect means they pay up without question

**4. Corruption Success Bonus from Influence**
In `bribe_corruption` handler (~line 1898):
- Add `+ Math.floor(resources.influence / 8)` — up to **+12%** at 100 influence

### Impact Summary

| Mechanic | At 0 Respect/Influence | At 50 | At 100 |
|---|---|---|---|
| Recruit cost | Full price | -15% | -30% |
| Extort success | Base | Base +7.5% | Base +15% |
| Extort payout | **0.5x (50% penalty)** | 1.0x (base) | 1.5x (+50% bonus) |
| Bribe success | Base | Base +6% | Base +12% |

### Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts`

