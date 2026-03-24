

# Boss Action: Call a Sitdown

## Concept
The Boss can召集 all or selected soldiers back to HQ instantly, regardless of map position. This is a strategic defensive action — more units at HQ = stronger defense against HQ assaults (aligns with existing HQ defense mechanics).

## Rules
- **Available during**: Action phase only, player HQ panel (Boss card)
- **Cooldown**: Once every 5 turns (powerful action)
- **Cost**: $2,000 (meeting expenses)
- **Selection**: Modal lets player choose "All Soldiers" or pick individual soldiers via checkboxes
- **Effect**: Selected soldiers are teleported to HQ hex instantly
- **Stacking override**: HQ hex is exempt from the 2-unit stacking limit (it's invulnerable and already holds hidden units)
- **Defense bonus**: Each soldier at HQ adds +5% to HQ assault defense (stacks with existing -30% HQ defense)
- **Loyalty bonus**: All recalled soldiers gain +5 loyalty (Boss shows care)
- **Tradeoff**: Recalled soldiers lose any fortification status and cannot act again this turn

## Changes

### 1. `src/types/game-mechanics.ts`
Add constants: `SITDOWN_COST = 2000`, `SITDOWN_COOLDOWN = 5`, `SITDOWN_LOYALTY_BONUS = 5`, `SITDOWN_DEFENSE_PER_SOLDIER = 5`

### 2. `src/hooks/useEnhancedMafiaGameState.ts`
- Add `sitdownCooldownUntil: number` to game state (init 0)
- Add `'call_sitdown'` action handler: validates cooldown/cost/phase, moves selected soldier IDs to HQ coords, applies loyalty bonus, sets cooldown
- Does NOT consume action budget (Boss action, not soldier action)

### 3. `src/components/HeadquartersInfoPanel.tsx`
- Add "📋 Call a Sitdown" button below the Boss card (visible during action phase, player family only)
- Shows cooldown timer if on cooldown
- On click: opens inline selection UI listing all deployed soldiers (not at HQ) with checkboxes + "Select All" toggle
- "Confirm Sitdown" button triggers the action
- Pass new `onCallSitdown` callback prop and `turnPhase`/`sitdownCooldownUntil`/`currentTurn` props

### 4. `src/pages/UltimateMafiaGame.tsx`
- Wire `onCallSitdown` prop to `performAction({ type: 'call_sitdown', soldierIds: [...] })`
- Pass `turnPhase`, `sitdownCooldownUntil`, `currentTurn` to HeadquartersInfoPanel

## Files Modified
- `src/types/game-mechanics.ts`
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/components/HeadquartersInfoPanel.tsx`
- `src/pages/UltimateMafiaGame.tsx`

