

# District Control Bonuses

## Overview
When any family (player or AI) controls 60%+ of hexes in a district, they gain a passive bonus unique to that district. Bonuses apply each turn and are visible in the UI.

## District Bonus Definitions

| District | Bonus | Effect |
|----------|-------|--------|
| Manhattan | +20% business income | All businesses in Manhattan earn 20% more |
| Little Italy | +15% loyalty retention | Soldier loyalty decay reduced by 15% |
| Brooklyn | -3 heat/turn | Police heat drops 3 extra per turn |
| Bronx | +1 soldier recruitment discount ($500 off) | Cheaper recruits |
| Queens | +10% extortion success | Extortion rolls boosted |
| Staten Island | +2 respect/turn | Passive respect gain |

## Implementation

### 1. Add district control computation — `src/hooks/useEnhancedMafiaGameState.ts`

New function `computeDistrictBonuses(state)` called at the start of `endTurn`, before `processEconomy`:
- For each district, count total hexes and hexes controlled by each family
- If any family holds ≥60%, store `{ district, family, bonus }` in `state.activeDistrictBonuses`
- Push a notification when a bonus is gained or lost

### 2. Apply bonuses in existing processing — `src/hooks/useEnhancedMafiaGameState.ts`

- **Manhattan (+20% income)**: In `processEconomy`, after computing `tileIncome` for Manhattan tiles, multiply by 1.2 if player holds the Manhattan bonus
- **Brooklyn (-3 heat)**: In `endTurn` after heat processing, subtract 3 if player holds Brooklyn bonus
- **Staten Island (+2 respect)**: In `endTurn` reputation section, add 2 respect
- **Little Italy (+15% loyalty)**: In loyalty calculation section, reduce decay
- **Queens (+10% extortion)**: In extortion success calculation, add 10%
- **Bronx (recruit discount)**: In recruitment cost calculation, subtract $500

AI families also benefit from their own district bonuses (applied in `processAITurn`).

### 3. Add state field — `src/hooks/useEnhancedMafiaGameState.ts`

```typescript
activeDistrictBonuses: Array<{
  district: string;
  family: string;
  bonusType: string;
  description: string;
}>;
```

Initialize as `[]` in initial state.

### 4. Display in UI — `src/components/GameSidePanels.tsx`

Add a small "District Control" section showing active bonuses the player holds, with district name and bonus description. Also show progress toward 60% for districts where the player is close.

### 5. Turn summary — `src/hooks/useEnhancedMafiaGameState.ts`

Log gained/lost district bonuses in `turnReport.events`.

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — district bonus computation + application across economy, heat, loyalty, recruitment
- `src/components/GameSidePanels.tsx` — display active district bonuses
- `src/pages/UltimateMafiaGame.tsx` — pass `activeDistrictBonuses` to side panels

