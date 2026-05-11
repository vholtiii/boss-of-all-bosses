## Goal
On the family selection screen: always show an active map seed, add a Reroll button, and add a confirmation indicator so the player can clearly see which seed will be loaded when the game starts.

## Changes (single file)
`src/components/FamilySelectionScreen.tsx`, around lines 592–602 (Map Seed block).

### 1. Always show an active seed
- Initialize `seedInput` lazily with `Math.floor(Math.random() * 1e9).toString()` so the field is never empty.
- Existing digit-only filter on input is preserved.

### 2. Reroll button
- Small icon button next to the input (using `Dices` from `lucide-react`, already in the project).
- On click: regenerate seed (`Math.floor(Math.random() * 1e9)`), set `seedInput`, play `playSound('click')`.
- Styled with the same `border-border/50 bg-card/80` look as nearby controls; tooltip "Reroll seed".

### 3. Confirmation UI
A small confirmation row directly below the input that makes it obvious which seed will be used:

- **Active seed badge**: `Active seed: <value>` rendered in a subtle pill (muted background, primary-colored monospace number). Updates live as the user types or rerolls.
- **Status line**: short helper text that swaps based on input state:
  - Valid number → check icon + `"This seed will be used when the game starts"` (success/primary tint).
  - Empty field → warning icon + `"A random seed will be generated"` (muted/warning tint).
- **Copy button** (small, optional, same row): copies the active seed to clipboard with a brief "Copied!" confirmation, so players can save a seed for replay.

The badge is also briefly highlighted (one-shot scale/flash via existing motion patterns) when the seed changes via Reroll, to confirm the action visually.

### 4. Pass-through unchanged
`onSelectFamily(..., seedInput ? parseInt(seedInput) : undefined, mapSize)` already routes the value into `useEnhancedMafiaGameState` — no game-logic changes needed.

## Out of scope
- No changes to map generation, AI seeding, or game state hooks.
- No seed history, no word-seed hashing, no shareable URL.
