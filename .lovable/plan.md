

# Fix: Tactical Actions Should Work Action-First

## Problem
The tactical action buttons (Scout, Fortify, Escort, Safehouse) are **disabled** when no unit is selected, showing messages like "Select a soldier first". But the user expects to click the action first, then select a unit on the board — which is the more intuitive flow.

The backend already supports this: `selectUnit` reads `selectedMoveAction` from state and branches accordingly (scout → show scoutable hexes, fortify → instant fortify, etc.). So if the user clicks "Scout" first (setting `selectedMoveAction='scout'`), then clicks a soldier on the map, it works correctly.

The problem is purely in the **button disabling logic** in `UltimateMafiaGame.tsx` (lines 583-600): it computes a `reason` like "Select a soldier first" and then disables the button, preventing the action-first flow.

## Fix — `src/pages/UltimateMafiaGame.tsx`

**1. Remove the unit-selection requirement from the disabled logic** (lines 583-600)

The buttons should only be disabled when `tacticalActionsRemaining <= 0`. The "Select a soldier" / "Select a capo" text should become **instructional hints** shown *after* the button is clicked (i.e., when `selectedMoveAction === action`), not blocking reasons.

Change the logic so:
- `isDisabled` is only true when `noTactical` (no tactical actions remaining)
- The `reason` text ("Select a soldier first", etc.) becomes the **description panel text** shown below the buttons when that action is active, rather than a tooltip that blocks clicking
- Keep the existing description panel (lines 629-644) which already explains what to do for each action

**2. Update the hover tooltip to show only real blocking reasons**

When disabled (`noTactical`), the tooltip shows "No tactical actions left". When enabled but active, the description panel below already instructs the player on what to do next.

**3. Clear selectedUnitId when switching tactical actions**

Add a `setMoveAction` wrapper or modify the onClick to also clear `selectedUnitId` when switching between tactical modes, so stale unit selections don't confuse the flow. This can be done by calling the existing state setter.

## Summary of Changes
- Lines 583-600: Simplify — only disable when `noTactical`, remove unit-check reasons from disabled logic
- Lines 608-609: Update disabled prop to just `noTactical`
- Lines 616-620: Remove or simplify the reason tooltip (only show for `noTactical`)

## Files Modified
- `src/pages/UltimateMafiaGame.tsx` — simplify tactical button disabled logic to allow action-first flow

