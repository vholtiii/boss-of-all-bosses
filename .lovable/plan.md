

# Clarification: Current Menu Behavior Already Matches Your Request

After reviewing the code, the left panel **already works** the way you described:

1. **Dropdowns are clickable** in any phase — clicking the section header expands it
2. **All action items appear** when a section is expanded
3. **Unavailable actions are greyed out** with lock icons and disabled reasons
4. **Available actions remain normal** and clickable

**However**, I noticed one UX issue that might be causing confusion: the section headers show a 🔒 icon when phase-locked, which could make them **look unclickable** even though they're not.

## Proposed Fix

### `src/components/GameSidePanels.tsx`

**CollapsibleSection header** (line 853):
- Remove the 🔒 from the section header when phase-locked — this icon makes users think the section itself can't be opened
- Instead, add a subtle phase label like "(Action Phase)" in muted text so users know the section is for a different phase but can still browse it

**Also**: Change `toggle()` to allow **multiple sections open at once** (Set-based) so users don't have to close one section to see another — this makes browsing all options easier without removing the dropdown behavior.

## Files Modified
- `src/components/GameSidePanels.tsx` — remove misleading lock on section headers, allow multi-open

