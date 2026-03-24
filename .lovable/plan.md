

# Split Negotiation: Boss (Family-Level) vs Capo (Territory-Level) — IMPLEMENTED

## Summary
Split negotiations into two tiers: Boss handles family-level diplomacy from HQ (Ceasefire $8,000, Alliance $5,000), Capos handle territory-level deals on enemy hexes (Bribe $8,000+, Share Profits $3,000, Safe Passage $2,000). 1 negotiation per turn total, 50% refund on failure.

## Changes Made

### `src/types/game-mechanics.ts`
- Added `scope: 'family' | 'territory'` to `NegotiationConfig`
- Added `share_profits` and `safe_passage` to `NegotiationType` union
- Added `ShareProfitsPact` and `SafePassagePact` interfaces
- Updated personality bonuses for new negotiation types
- Raised ceasefire cost from $3,000 to $8,000
- Added `NEGOTIATION_REFUND_RATE = 0.5`

### `src/hooks/useEnhancedMafiaGameState.ts`
- Added `negotiationUsedThisTurn`, `shareProfitsPacts`, `safePassagePacts` to state
- Reset `negotiationUsedThisTurn` each turn in `endTurn`
- Updated `processNegotiation` for scope-based handling, cooldown, 50% refund, new pact types
- Added `boss_negotiate` action type
- Added share_profits income to `processEconomy` (30% of target hex income)
- Updated `processPacts` to tick down share profits and safe passage pacts

### `src/components/NegotiationDialog.tsx`
- Added `scope` prop to filter negotiation options by family/territory
- Added `negotiationUsedThisTurn` prop for cooldown display
- Added scope badges and refund notes
- Boss mode: family selector dropdown, no capo personality display
- Territory mode: shows bribe, share profits, safe passage only

### `src/components/HeadquartersInfoPanel.tsx`
- Added Diplomacy section to Boss Overview with per-family negotiate buttons
- Shows active pacts (ceasefires, alliances, share profits, safe passages) with turns remaining

### `src/pages/UltimateMafiaGame.tsx`
- Wired Boss negotiate via `open_boss_negotiate` action from HQ panel
- Updated negotiation state to support both scopes
- Passes scope, cooldown, and active pacts to dialog and HQ panel
- Bottom bar now shows share profits and safe passage pacts
