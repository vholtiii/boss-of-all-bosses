

# Individual Soldier Loyalty System

## Problem
Soldier loyalty starts at 50 and never changes organically. The internal hit threshold (70) is unreachable, making every civilian-hit soldier guaranteed to be eliminated.

## Design

### Loyalty Growth (per turn, per soldier)

**1. Stats-correlated baseline** — each soldier gains loyalty proportional to their overall development:
```
loyaltyGain = floor((training + toughness + racketeering + victories) / 4)
```
A fresh recruit (all 0s) gains 0. A veteran with training 3, toughness 3, racketeering 3, victories 3 gains +3/turn. This rewards well-rounded soldiers.

**2. +2 per successful action** — when a soldier completes a hit, extortion, or claim, they get +2 loyalty immediately (applied alongside the existing stat bumps).

**3. +5 per survived combat** — surviving a hit (win or lose) grants +5 loyalty. Battle-forged bonds.

**4. +3 if stationed on high-income hex** — if the soldier's current hex has a business earning >= $4,000/turn, they gain +3 loyalty that turn. Soldiers on profitable turf feel valued.

### Loyalty Decay

**-2 when unpaid** — if the family can't afford maintenance (already detected in the existing maintenance check), each soldier loses -2 loyalty that turn.

### Caps
- Soldiers: 80 (existing `SOLDIER_LOYALTY_CAP`)
- Capos: 99 (existing `CAPO_LOYALTY_CAP`)
- Minimum: 0

## Balance Check
A fresh recruit at loyalty 50 with no stats gains 0 baseline. After 3 turns deployed (training reaches 3), baseline becomes +0.75 → floor = 0. They need successful actions or combat to grow. A soldier with training 3, toughness 2, racketeering 1, victories 1 → (3+2+1+1)/4 = 1.75 → floor = 1/turn. Combined with occasional +2 action bonuses and +5 combat bonuses, reaching 70 loyalty takes roughly 8-12 active turns — achievable but not trivial.

## Files Modified

### `src/types/game-mechanics.ts`
- Add constants: `LOYALTY_ACTION_BONUS = 2`, `LOYALTY_COMBAT_BONUS = 5`, `LOYALTY_INCOME_HEX_BONUS = 3`, `LOYALTY_INCOME_HEX_THRESHOLD = 4000`, `LOYALTY_UNPAID_PENALTY = 2`

### `src/hooks/useEnhancedMafiaGameState.ts`

**Per-turn processing (alongside existing training increment):**
- Calculate stats-correlated baseline per soldier
- Check if soldier is on a high-income hex → +3
- Check if maintenance unpaid → -2 each soldier
- Apply caps

**In hit/extortion/claim action handlers:**
- On successful action: soldier gets +2 loyalty
- On survived combat (hit victory or defeat): +5 loyalty

### `SOLDIER_RECRUITMENT_GUIDE.md`
- Document the loyalty growth and decay mechanics

