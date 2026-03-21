

# Fix: Distinguish Capo Auto-Extort vs Auto-Claim Notifications

## Problem
When a Capo moves to any neutral hex, the notification always says "Auto-Extortion" with a money bonus — even on empty hexes with no business. Extortion should only happen on neutral hexes with an illegal business. Empty neutral hexes should just be auto-claimed with a different notification.

## Changes

### `src/hooks/useEnhancedMafiaGameState.ts` (~lines 958-970)

Split the existing logic into two paths:

1. **Neutral hex WITH an illegal business** → Auto-extort: claim hex + money bonus + respect + notification "💰 Capo Auto-Extortion!"
2. **Neutral hex WITHOUT a business (or with a legal business)** → Auto-claim only: claim hex, no money, notification "🏴 Territory Claimed" with message like "Your Capo claimed this territory on arrival."

No other files need changes — the notification content is generated entirely in this block.

