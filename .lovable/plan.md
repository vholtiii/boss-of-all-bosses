

# Police Heat System: Analysis and Refinement Plan

## Current State

### How Heat Is Generated
- **Combat (hits)**: +15 heat per hit attempt
- **Extortion**: +8 (neutral) or +12 (enemy territory)
- **Sabotage**: +10 heat
- **Building illegal businesses**: +5-15 (random, in old hook only)
- **Low loyalty ratting**: +10 to +25 depending on loyalty tier
- **Stopping a bribe**: +10 heat spike
- **Events**: variable via event consequences

### How Heat Is Reduced
- **Passive decay**: `reductionPerTurn` (starts at 2/turn)
- **Patrol officer bribe**: -2/turn while active, plus immediate 30% reduction on bribe
- **Legacy bribe_official action**: -20 heat for $15,000
- **Charity/community events**: -5 heat
- **Successful negotiation**: -5 heat

### What Heat Actually Does (Problem Area)
In the enhanced game state, heat has **only two mechanical effects**:

1. **Reduces bribe success chance**: `-policeHeat.level / 5` to corruption success rolls (up to -20% at max heat)
2. **Warning text in HUD**: At 70+ heat, a warning message appears

That's it. **No arrests, no raids, no profit penalties, no escalating consequences.**

## Identified Issues

| # | Issue | Severity |
|---|---|---|
| 1 | **No arrest system** in enhanced hook — the old hook has a full arrest system (street/management/player arrests based on heat thresholds) but none of it was ported | Critical |
| 2 | **No profit impact** — high heat doesn't reduce income, unlike the old hook's arrest-based profit multiplier | High |
| 3 | **`rattingRisk` is never updated** — initialized at 5, never recalculated. The loyalty system adds heat directly but never updates the `rattingRisk` field displayed in the Police System UI | Medium |
| 4 | **`reductionPerTurn` is static** — starts at 2 and never changes. The old hook modified it based on bribed officials' `heatReduction` values, but the enhanced hook's corruption system (`activeBribes`) doesn't update this field | Medium |
| 5 | **`bribedOfficials` array is always empty** — the enhanced hook uses `activeBribes` (BribeContract[]) instead of the PoliceHeat.bribedOfficials system. The PoliceSystem component's "Active Bribes" section never shows anything | Medium |
| 6 | **No heat generation from extortion income** — running illegal businesses passively generates zero heat per turn, only the act of extorting does | Low |
| 7 | **Heat has no effect on extortion success** — extortion chance doesn't factor in current heat level | Low |

## Proposed Plan

### File: `src/hooks/useEnhancedMafiaGameState.ts`

**1. Add arrest system to end-of-turn processing (after loyalty effects, before heat decay)**

Port and adapt the old hook's arrest logic:
- **Heat 40-69**: 15% chance of a **street arrest** — lose 1 soldier, -5% profit for 3 turns
- **Heat 70-89**: 25% chance of a **management arrest** — lose -2 influence, -15% profit for 5 turns
- **Heat 90-100**: 10% chance of a **player arrest** — jail time (3-5 turns), -30% profit, operations severely hampered

Arrests get pushed to `policeHeat.arrests[]` and reported in `turnReport.events`.

**2. Apply arrest profit penalties to economy processing**

In `processEconomy`, after calculating income:
- Sum `impactOnProfit` from all active arrests (where `currentTurn - arrest.turn < arrest.sentence`)
- Apply as a multiplier: `income *= Math.max(0.1, (100 - totalImpact) / 100)`

**3. Update `rattingRisk` each turn**

After loyalty effects, calculate:
```
recentArrests = arrests from last 3 turns
rattingRisk = recentArrests * 15 * ((100 - loyalty) / 100)
```
This makes the Police System UI's rattingRisk display meaningful.

**4. Heat affects extortion success**

In `processTerritoryExtortion`, subtract `policeHeat.level / 10` from success chance (up to -10% at max heat). High heat means police are watching, making criminal operations harder.

**5. Passive heat from illegal operations**

In end-of-turn, add small heat gain based on illegal activity:
- `+1 heat` per 3 controlled territories with illegal businesses (running rackets draws attention)
- This creates natural heat pressure that must be managed

**6. Add heat delta to Turn Summary Modal**

Track `prevHeat` before end-of-turn, add `heat` field to `resourceDeltas`, display in the modal.

### File: `src/components/TurnSummaryModal.tsx`
- Add `heat: number` to `TurnReport` interface's `resourceDeltas`
- Add a "Police Heat" row to the Resource Changes grid

### Impact Summary

| Heat Range | Consequence |
|---|---|
| 0-39 | Safe — no arrests, normal operations |
| 40-69 | **Street arrests** (15%/turn) — lose soldiers, -5% profit |
| 70-89 | **Management arrests** (25%/turn) — lose influence, -15% profit |
| 90-100 | **Player arrest risk** (10%/turn) — jail time, -30% profit |
| Any | Heat reduces bribe success (-level/5) and extortion success (-level/10) |

### Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — arrest system, rattingRisk calc, heat effects on extortion, passive heat, delta tracking
- `src/components/TurnSummaryModal.tsx` — heat delta row

