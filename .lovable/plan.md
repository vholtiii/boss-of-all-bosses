

# Fix: Separate Negotiation Cooldowns for Boss and Capo

## Current Problem
`negotiationUsedThisTurn` is a single boolean — if the Boss negotiates, the Capo can't, and vice versa. The user wants each to have their own independent cooldown.

## Change

### `src/hooks/useEnhancedMafiaGameState.ts`
- Replace `negotiationUsedThisTurn: boolean` with two flags:
  - `bossNegotiationUsedThisTurn: boolean`
  - `capoNegotiationUsedThisTurn: boolean`
- Reset both to `false` in `advanceToNextTurn`
- In `processNegotiation`: check/set the appropriate flag based on negotiation scope (`'family'` → boss flag, `'territory'` → capo flag)

### `src/components/NegotiationDialog.tsx`
- Update cooldown prop to accept the relevant flag (boss or capo) based on current `scope`

### `src/components/HeadquartersInfoPanel.tsx`
- Pass `bossNegotiationUsedThisTurn` for disabling Boss diplomacy buttons

### `src/pages/UltimateMafiaGame.tsx`
- Pass the correct cooldown flag to `NegotiationDialog` based on whether scope is `'family'` or `'territory'`

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/components/NegotiationDialog.tsx`
- `src/components/HeadquartersInfoPanel.tsx`
- `src/pages/UltimateMafiaGame.tsx`

