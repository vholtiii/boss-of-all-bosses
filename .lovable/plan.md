

# Fix: Gate "Send Word" Behind Phase 2+

## Problem
The "Send Word" tactical action button is visible and usable in Phase 1, but per game rules it should only unlock at Phase 2+ (Turn 9+, 8+ hexes, 20+ respect).

## Changes

### 1. `src/pages/UltimateMafiaGame.tsx` (~lines 768-773)
- Add a phase check: filter out or disable the `send_word` action when `gamePhase < 2`
- Approach: add a `hidden` or `phase` property to the action config array, and skip rendering `send_word` when `gp < 2` (where `gp` is already computed at line 897)
- Since `gp` is computed after this block, either move the `gp` computation earlier or inline the check as `((gameState as any).gamePhase || 1) < 2`

### 2. `src/hooks/useEnhancedMafiaGameState.ts` (~lines 1612, 1851)
- Add a backend guard: in both `send_word` handler blocks, return early if `prev.gamePhase < 2` to prevent the action even if the UI is bypassed

Two files, three small guard additions.

