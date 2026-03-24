

# Change Negotiation Cooldown: 1 per 2 Turns

## Change
Replace boolean cooldown flags with numeric counters that track remaining cooldown turns.

### `src/hooks/useEnhancedMafiaGameState.ts`
- Replace `bossNegotiationUsedThisTurn: boolean` → `bossNegotiationCooldown: number` (0 = ready, >0 = turns remaining)
- Replace `capoNegotiationUsedThisTurn: boolean` → `capoNegotiationCooldown: number`
- Init both to `0` in initial state and deep copy
- In `advanceToNextTurn`: decrement each by 1 (min 0) instead of resetting to false
- In `processNegotiation`: check `> 0` to block, set to `2` after use (cooldown lasts current + next turn)

### `src/pages/UltimateMafiaGame.tsx`
- Pass `(gameState as any).bossNegotiationCooldown > 0` / `capoNegotiationCooldown > 0` as `negotiationUsedThisTurn` prop

### `src/components/NegotiationDialog.tsx`
- Update cooldown message to say "Wait 1 more turn" (no code logic change needed, just text)

### `src/components/HeadquartersInfoPanel.tsx`
- Update prop to use `bossNegotiationCooldown > 0`

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/pages/UltimateMafiaGame.tsx`
- `src/components/NegotiationDialog.tsx`
- `src/components/HeadquartersInfoPanel.tsx`

