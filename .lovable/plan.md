

# Add Purge Ranks to Boss Actions in HQ Panel

## Problem
Purge Ranks is currently a separate section in the HQ panel (lines 978-1040) that only appears when flagged soldiers exist. The user wants it grouped with the other Boss actions (Diplomacy, Sitdown, Declare War, Go to Mattresses, War Summit) and always visible.

## Changes

### `src/components/HeadquartersInfoPanel.tsx`

1. **Move Purge Ranks into the Boss actions block** (before line 976's closing `</div>`), right after War Summit (~line 975). Style it consistently with the other Boss action buttons.

2. **Remove the early `return null`** on line 986 — always render the section.

3. **Show "All clear" when empty** — display a small "No suspects detected" message instead of hiding entirely.

4. **Remove the old standalone Purge Ranks section** (lines 978-1040) since it's now inside the Boss actions block.

### Result
When clicking your HQ, the Boss actions area will show: Diplomacy, Call a Sitdown, Declare War, Go to Mattresses, War Summit, and Purge Ranks — all in one place. Purge Ranks shows "No suspects detected" when empty, or lists flagged soldiers with Eliminate buttons when present.

