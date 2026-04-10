

# Fix: Plan Hit Target Selection

## Problem
The Plan Hit flow has two bugs:

1. **Step 2 silently fails on empty hexes**: When clicking a scouted enemy hex that has no enemy units garrisoned, nothing happens — no feedback. Most enemy territory won't have units on every hex, so this makes the feature feel broken.

2. **No clear guidance after soldier selection**: After picking your soldier from the modal, the map highlights scouted enemy hexes in red, but there's no on-screen instruction telling the player "Now click a scouted enemy hex with units." If no scouted hexes have enemy units, the player is stuck with no feedback.

## Fix

### 1. Add feedback when clicking a scouted hex with no units
**File**: `src/components/EnhancedMafiaHexGrid.tsx` (line ~284-295)
- When `isEnemy && isScouted` but `enemyUnits.length === 0`, show a toast: "No enemy units on this hex — target a hex with soldiers or capos"

### 2. Add a floating instruction banner during step 2
**File**: `src/components/EnhancedMafiaHexGrid.tsx` or `src/pages/UltimateMafiaGame.tsx`
- When `planHitMode && planHitStep === 'selectTarget'`, render a fixed banner at top: "🎯 Click a scouted enemy hex (red outline) with enemy units to plan the hit"
- Include the selected soldier's name and a Cancel button

### 3. Visually distinguish targetable vs empty scouted hexes
**File**: `src/components/EnhancedMafiaHexGrid.tsx` (line ~1018-1032)
- During step 2 highlighting: check if scouted enemy hexes actually have enemy units
- Hexes WITH enemy units: bright red pulsing border (current style) + crosshair icon
- Hexes WITHOUT enemy units: dim grey dashed border (scouted but no valid targets)

### 4. Show a list of valid targets as fallback
**File**: `src/pages/UltimateMafiaGame.tsx`
- During step 2, if there are scouted enemy hexes with units, show a small floating panel listing targetable units (name, family, hex location) as an alternative to map clicking
- Clicking a unit in the list triggers `onPlanHitSelect` directly

## Files Modified
- `src/components/EnhancedMafiaHexGrid.tsx` — feedback toast, hex highlighting split, crosshair icon
- `src/pages/UltimateMafiaGame.tsx` — instruction banner, target list panel

