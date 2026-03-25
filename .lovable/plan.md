

# Ceasefire Enforcement: Full Combat Block, Territory Freeze & Treachery Debuff

## Overview

Ceasefires become meaningful: both sides are blocked from attacking or claiming each other's territory. Violations trigger harsh penalties and a "treachery" debuff that hurts future negotiations.

## Changes

### 1. New types & constants (`src/types/game-mechanics.ts`)
- Add `CEASEFIRE_VIOLATION_RESPECT_LOSS = 15`
- Add `CEASEFIRE_VIOLATION_FEAR_LOSS = 10`
- Add `TREACHERY_DEBUFF_DURATION = 3` (turns)
- Add `TREACHERY_NEGOTIATION_PENALTY = 20` (% reduction to all negotiation success)
- Add `treacheryDebuff` interface: `{ turnsRemaining: number; appliedOnTurn: number }`

### 2. State additions (`src/hooks/useEnhancedMafiaGameState.ts`)
- Add `treacheryDebuff?: { turnsRemaining: number; appliedOnTurn: number }` to game state
- Initialize as `undefined` in initial state

### 3. AI movement & combat block (~lines 2997-3009, 3104-3127)
- **Target filtering**: When building `playerHexes` target pool, skip player hexes if `state.ceasefires.some(c => c.active && c.family === fam)`. AI units with ceasefire won't select player territory as a target.
- **Combat guard**: Before AI engages combat (~line 3108), check if the enemy units belong to a ceasefire family. If so, revert AI unit position and skip — no combat occurs.
- **Territory claim guard**: In the no-combat claim path (~line 3261-3297), if the hex belongs to a ceasefire family, skip the claim entirely.

### 4. Player attack block & violation penalties (~lines 5150-5202)
- **Hard block option**: When player initiates a hit/extortion/combat against a ceasefire family, show a confirmation warning: "⚠️ This will break the ceasefire!" then proceed with violation penalties if confirmed. Since the current code already applies -15 respect on violation, enhance it:
  - Add `-10 fear` loss
  - Apply `treacheryDebuff = { turnsRemaining: 3, appliedOnTurn: state.turn }`
  - Push notification: "🗡️ Treachery! You broke the ceasefire. -15 respect, -10 fear. Other families trust you less for 3 turns."
  - Reduce relationship with ALL families by -10 (not just the violated one)

### 5. Territory freeze — player side
- In player territory claim actions (extortion, move-to-claim), check if the target hex belongs to a ceasefire family. If so, block the action with a notification: "🤝 Ceasefire Active — you cannot claim {family} territory during a ceasefire."
- Same check for Plan Hit target selection — can't plan hits against ceasefire families

### 6. Treachery debuff effect
- In the negotiation success calculation (where `baseSuccess` is used), apply: `if (state.treacheryDebuff?.turnsRemaining > 0) successChance -= TREACHERY_NEGOTIATION_PENALTY`
- Tick down `treacheryDebuff.turnsRemaining` each turn in `processPacts`. Clear when it reaches 0.
- Show active debuff in the pacts bar (UI): "🗡️ Treachery (-20% negotiations, {N}t)"

### 7. UI updates
- **Pacts bar** (`src/pages/UltimateMafiaGame.tsx`): Show treachery debuff alongside active pacts
- **NegotiationDialog** (`src/components/NegotiationDialog.tsx`): Show warning text when treachery debuff is active, indicating reduced success rates

## Files Modified
- `src/types/game-mechanics.ts` — new constants and interface
- `src/hooks/useEnhancedMafiaGameState.ts` — AI blocking, player violation logic, territory freeze, debuff processing
- `src/pages/UltimateMafiaGame.tsx` — treachery debuff display in pacts bar
- `src/components/NegotiationDialog.tsx` — treachery warning on negotiation panel

