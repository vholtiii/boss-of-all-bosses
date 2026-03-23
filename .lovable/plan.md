

# Fix: Plan Hit Visibility During Tactical Phase

## Problem
The "Plan Hit" button lives inside the "Strategic Actions" section, which displays a 🔒 icon on its header during the tactical phase. Even though the Plan Hit button itself is correctly unlocked (`phaseLocked={!isTacticalPhase}`), the section-level lock icon misleads the player into thinking the entire section is inaccessible.

The `disabledReason` text (e.g., "Scout an enemy hex first", "No tactical actions") already renders correctly on the button — but the player never opens the section because the header shows 🔒.

## Fix — `src/components/GameSidePanels.tsx`

**Move "Plan Hit" (and its active-hit status card) out of the "Strategic Actions" section** and into the "Recruitment & Tactical" section (which is already unlocked during the tactical phase). This places it alongside other tactical-phase actions like "Hire Mercenary" and "Recruit Local Soldier", where it logically belongs since it costs a tactical action.

This is a simple cut-and-paste of ~50 lines (the `ActionButton` for Plan Hit + the `plannedHit` status card) from the Strategic Actions section to the Recruitment & Tactical section.

No logic changes needed — the button's own `disabled`, `disabledReason`, and `phaseLocked` props already handle all edge cases correctly. The player will now see it in an unlocked section with clear feedback text when conditions aren't met.

## Files Modified
- `src/components/GameSidePanels.tsx` — relocate Plan Hit button + status card to tactical section

