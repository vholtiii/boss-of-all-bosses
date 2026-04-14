

# Prosecution Risk System — Updated Plan

## Change from Previous Plan
Added a mechanical effect to the Grand Jury Subpoena (60+): all illegal businesses have their profits reduced by 30% while prosecution risk remains at or above 60. This creates a meaningful mid-tier consequence between the soldier arrest at 50+ and the federal indictment at 90+.

## Prosecution Risk Formula (per turn)

```text
prosecutionRisk = clamp(0, 100,
    floor(policeHeat.level * 0.4)
  + informantCount * 10
  + recentArrests (last 3 turns) * 5
  - patrolBribe ? 10 : 0
  - captainBribe ? 10 : 0
  - chiefBribe ? 15 : 0
  - mayorBribe ? 20 : 0
  - lawyerRetained ? 5 : 0
)
```

## Threshold Events

| Threshold | Timer | Effect |
|-----------|-------|--------|
| 50+ (3 turns) | prosecutionTimer | Random soldier arrested, removed 5 turns, still costs maintenance, returns to HQ with -10 loyalty |
| 60+ | Immediate (persistent) | Grand Jury Subpoena — warning banner + **all illegal business profits reduced by 30%** while risk stays 60+ |
| 90+ (3 turns) | federalIndictmentTimer | All illegal businesses shut down, 30% cash frozen, pay $25K defense or game over |

## Loyalty Bar
- Shows average of all deployed soldiers' individual loyalty (replaces old family-wide stat)

## Technical Changes

### `src/types/game-mechanics.ts`
- Add constants: `PROSECUTION_ARREST_THRESHOLD = 50`, `PROSECUTION_ARREST_TIMER = 3`, `PROSECUTION_ARREST_DURATION = 5`, `PROSECUTION_ARREST_LOYALTY_PENALTY = 10`, `FEDERAL_INDICTMENT_THRESHOLD = 90`, `FEDERAL_INDICTMENT_TIMER = 3`, `FEDERAL_INDICTMENT_DEFENSE_COST = 25000`, `PROSECUTION_LAWYER_REDUCTION = 5`, `GRAND_JURY_THRESHOLD = 60`, `GRAND_JURY_ILLEGAL_PROFIT_PENALTY = 0.3`

### `src/hooks/useEnhancedMafiaGameState.ts`
- Replace family-wide loyalty calculation with soldier average
- Add prosecution risk formula with lawyer reduction (-5)
- Add prosecutionTimer / federalIndictmentTimer tracking
- Tier 1 (50+): arrest random soldier for 5 turns, maintenance still applies, -10 loyalty on release
- **Grand Jury (60+)**: apply 30% reduction to all illegal business income during financial calculation
- Tier 2 (90+): shut down illegal businesses, freeze cash, defense payment or game over

### `src/components/GameSidePanels.tsx`
- Tooltip breakdowns for Loyalty, Heat, Prosecution Risk
- Warning banners at 60+ (with "Illegal profits -30%" note) and 90+
- Prosecution timer display at 50+

### `src/pages/UltimateMafiaGame.tsx`
- Add `federal_indictment` game over type

## Files Changed
1. `src/types/game-mechanics.ts`
2. `src/hooks/useEnhancedMafiaGameState.ts`
3. `src/components/GameSidePanels.tsx`
4. `src/pages/UltimateMafiaGame.tsx`

