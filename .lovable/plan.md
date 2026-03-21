

# Add "Active for X turns" indicator to Hitman Panel

## Changes

### `src/components/HitmanPanel.tsx`
- Add `currentTurn: number` to `HitmanPanelProps`
- In each active contract card (line 59-72), add a line showing `"Active: {currentTurn - c.hiredOnTurn} turn(s)"` using a small badge or text indicator

### `src/components/GameSidePanels.tsx`
- Pass `currentTurn` prop to `HitmanPanel`

