

# Reposition Phase Banner to Avoid Popup Overlap

## Problem
The phase indicator banner sits at `absolute top-2 left-1/2 z-20` centered over the game board. This overlaps with dialogs and popups (EnemyHexActionDialog, NegotiationDialog, TurnSummaryModal, etc.) that appear centered on screen.

## Solution
Move the banner to the **bottom-center** of the main content area instead of the top-center. This keeps it visible and informative but out of the way of centered modals and action dialogs.

## Changes

**File: `src/pages/UltimateMafiaGame.tsx`** (~line 906)

Change positioning classes from:
- `absolute top-2 left-1/2 -translate-x-1/2`

To:
- `absolute bottom-2 left-1/2 -translate-x-1/2`

Also update the tooltip to open `side="top"` instead of `side="bottom"` (line 925), and change the entry animation from `y: -20` to `y: 20` (line 903) so it slides in from the bottom.

Three lines changed total.

