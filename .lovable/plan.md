


# Internal Hit After Hiding Period

## Summary

When a blind hit results in a civilian hit, the soldier goes into hiding for 3 turns. Upon return, the family checks the soldier's loyalty — if below 70, the soldier is permanently eliminated (internal family hit). If 70+, the soldier returns to HQ normally.

## Mechanics

### Civilian Hit → Hiding (unchanged)
- Unscouted hex, no enemy units → soldier enters hiding for 3 turns
- Heat set to 100

### Post-Hiding Loyalty Check (new)
- When hiding period ends and `loyalty < 70`:
  - Soldier **permanently removed** (deleted from deployedUnits and soldierStats)
  - Police heat reduced by **25**
  - Each remaining soldier has **10% chance** of losing **15 loyalty** (morale risk)
  - Notification: "The family dealt with the soldier internally."
- When `loyalty >= 70`: soldier returns to HQ hex as normal

## Constants (`src/types/game-mechanics.ts`)
- `INTERNAL_HIT_LOYALTY_THRESHOLD = 70`
- `INTERNAL_HIT_HEAT_REDUCTION = 25`
- `INTERNAL_HIT_MORALE_RISK = 0.10`
- `INTERNAL_HIT_MORALE_PENALTY = 15`

## Files Modified
- `src/types/game-mechanics.ts` — 4 new constants
- `src/hooks/useEnhancedMafiaGameState.ts` — loyalty check in hidden-unit-return logic
- `COMBAT_SYSTEM_GUIDE.md` — Internal Family Hit subsection
