

# Remove Cost from Plan Hit Button

## Problem
The "Plan Hit" button shows "$8,000 · 1 soldier" but Plan Hit costs $0.

## Changes

### `src/components/GameSidePanels.tsx` (lines 130-138)
- Change `sublabel` from `$8,000 · 1 soldier` to `Free · 1 soldier`
- Remove the `resources.money < 8000` check from `disabled`
- Change `cost: 8000` to `cost: 0` in the action payload

