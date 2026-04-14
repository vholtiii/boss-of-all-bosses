

# Police Flip (Rat) System — Cops Turn Your Soldiers

## Overview
Add a new mechanic where **police can flip player/AI soldiers** whose loyalty drops too low. This is distinct from the existing player-initiated flip — cops do it automatically each turn. Bribe tiers provide escalating counter-intelligence against cop-flipped rats.

## Mechanic Design

### Per-Turn Police Flip Check
- Each turn, every deployed soldier (player and AI) with **loyalty below 40** has a chance of being flipped by cops
- Base chance: **5% per turn**, +1% for every loyalty point below 40 (so loyalty 30 = 15% chance)
- Higher family heat increases the chance: +0.5% per heat point above 50
- Flipped-by-cops soldiers become **informants** — a new status tracked separately from player-flipped soldiers
- Effect: informant soldiers leak intel to police, increasing heat by +3/turn per informant and reducing that family's illegal income by 10% per informant

### Bribe-Based Counter-Intelligence (Tiered)

| Bribe Level | Effect |
|---|---|
| **Patrol Officer** | You are told "a soldier has been compromised" (no name, just a warning notification) |
| **Police Captain** | You are told **which specific soldier** was flipped (name + location shown) |
| **Police Chief** | The crooked chief's squad **automatically eliminates** the rat — no heat incurred, soldier removed |
| **Mayor** | Same as Chief — auto-elimination of any cop-flipped rat, plus immunity from new cop flips for the bribe duration |

### Player Response (without bribes)
- Without bribes, cop-flipped soldiers are invisible — you just see rising heat and shrinking income
- Players can manually investigate by scouting their own territory (new action) or raising soldier loyalty above 40 to prevent future flips

## Files Changed

1. **`src/types/game-mechanics.ts`** — Add `CopFlippedSoldier` interface (unitId, family, flippedOnTurn), add `COP_FLIP_LOYALTY_THRESHOLD = 40`, `COP_FLIP_BASE_CHANCE = 0.05` constants
2. **`src/hooks/useEnhancedMafiaGameState.ts`**:
   - Add `copFlippedSoldiers: CopFlippedSoldier[]` to game state + initialization + deep clone
   - Add `processCopFlips()` in turn processing: iterate all soldiers, check loyalty threshold, roll flip chance, add to `copFlippedSoldiers`
   - In income processing: reduce illegal income by 10% per cop informant in that family
   - In heat processing: add +3 heat per cop informant
   - In bribe processing: check active bribes and apply tiered counter-intel (notify, reveal, auto-eliminate)
   - Mayor bribe: add cop-flip immunity flag during bribe duration
3. **`src/components/GameSidePanels.tsx`** — If patrol+ bribe detects a rat, show a warning badge/alert in the left panel; if captain+ bribe, show the soldier's name and location

## Balance Notes
- Loyalty threshold of 40 is intentionally low — only neglected soldiers get flipped
- This creates a reason to invest in soldier welfare (pay maintenance, station on good hexes)
- Synergizes with existing bribe system — bribes now have a defensive purpose, not just offensive intel

