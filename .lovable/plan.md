

# Add Click Sound to Supply Node Selection

## Problem
The global click sound listener in `UltimateMafiaGame.tsx` only fires for `button` elements. Supply node cards in the side panel are `div` elements, so clicking them is silent.

## Solution
Add `playSound('click')` directly in the supply node card's `onClick` handler in `GameSidePanels.tsx`. This requires:

1. **`src/components/GameSidePanels.tsx`**:
   - Import `useSoundSystem` from `@/hooks/useSoundSystem`
   - Call `useSoundSystem()` inside `RightSidePanel` to get `playSound`
   - Add `playSound('click')` at the top of the supply node card's `onClick` handler (~line 829)

Single file, ~3 lines of changes.

## Files Modified
- `src/components/GameSidePanels.tsx`

