

# Add Purge Ranks to Left Side Panel

## What Changes
Add a "Purge Ranks" button to the **Strategic Actions** collapsible section in the left side panel (`GameSidePanels.tsx`). Clicking it opens an inline list of flagged soldiers (Suspicious / Confirmed Rat) with Eliminate buttons — same data and logic currently in `HeadquartersInfoPanel.tsx`, but accessible without opening the HQ panel.

## How It Works
- New `ActionButton` labeled "🔫 Purge Ranks" in the Strategic Actions section, action-phase locked
- Clicking it expands an inline sub-panel listing all suspicious/confirmed-rat soldiers from `soldierStats`
- Each entry shows soldier name, loyalty, status icon (⚠️ or 🐀), and an "Eliminate" button
- Calls the existing `onEliminateSoldier` handler — no new game logic needed
- The HQ panel version stays as-is (two access points as you suggested)

## Technical Details

### `src/components/GameSidePanels.tsx`
- Pass `soldierStats`, `deployedUnits`, `copFlippedSoldiers`, and `onEliminateSoldier` through props (from `UltimateMafiaGame.tsx`)
- Add a collapsible Purge Ranks sub-section inside Strategic Actions that filters deployed units for `suspicious` or `confirmedRat` flags
- Show soldier count badge on the button when flagged soldiers exist
- Disable eliminate buttons when `actionsRemaining <= 0` or not in action phase

### `src/pages/UltimateMafiaGame.tsx`
- Wire the additional props (`soldierStats`, `onEliminateSoldier`) to `GameSidePanels`

## Files Changed
1. `src/components/GameSidePanels.tsx` — add Purge Ranks UI in Strategic Actions
2. `src/pages/UltimateMafiaGame.tsx` — pass required props

