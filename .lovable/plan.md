

# HQ Panel: Toggle Instead of Modal Overlay

## Problem
The HeadquartersInfoPanel renders as a full-screen modal overlay (`fixed inset-0 bg-black/50 z-50`) that blocks all map interaction. The user must click the X button or click outside to dismiss it before they can select units on the HQ hex. This forces a double-click pattern.

## Solution
Two changes:

### 1. Toggle behavior on HQ click
**File**: `src/pages/UltimateMafiaGame.tsx` (line 132-143)
- Change `handleHeadquartersClick`: if the same family's HQ is already selected, set `selectedHeadquarters` to `null` (toggle off). Otherwise, open it.

### 2. Convert panel from blocking modal to side panel
**File**: `src/components/HeadquartersInfoPanel.tsx`
- Remove the full-screen `fixed inset-0 bg-black/50` overlay wrapper.
- Position the panel as a non-blocking side panel (e.g., `fixed top-4 right-4 z-40 w-80`) so the map remains fully clickable underneath.
- Keep the X close button for manual dismissal.
- Remove the outer `motion.div` backdrop; keep the inner card with slide-in animation.

### Files Modified
- `src/pages/UltimateMafiaGame.tsx` — toggle logic
- `src/components/HeadquartersInfoPanel.tsx` — non-blocking positioning

