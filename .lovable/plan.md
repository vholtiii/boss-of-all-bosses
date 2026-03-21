

# Remove "Train Soldiers" Dead Button

## Problem
The "Train Soldiers" button in the Defense & Law category dispatches `{ type: 'train_soldiers' }`, but there is no handler for this action in `useEnhancedMafiaGameState.ts`. It does nothing when clicked.

## Changes

### `src/components/GameSidePanels.tsx` (lines 216-223)
- Remove the "Train Soldiers" `ActionButton` from the Defense & Law category

That's it — single surgical removal. No types or state to clean up since no handler ever existed.

