

# Make Phase Banner Non-Obstructive

## Problem
The blue phase indicator banner sits on top of the game map (`absolute top-2 ... z-20`) and blocks hex tiles underneath it, interfering with gameplay.

## Fix

**File: `src/pages/UltimateMafiaGame.tsx`** (lines 899-953)

Make the banner compact, semi-transparent, and non-interactive so clicks pass through to the map:

1. Add `pointer-events-none` to the banner wrapper so clicks pass through to hexes beneath it
2. Reduce vertical padding from `py-2` to `py-1` and horizontal from `px-6` to `px-4`
3. Increase transparency — change colors from `/80` to `/50` (e.g. `bg-blue-600/50`)
4. Make the phase line text inside the tooltip trigger still hoverable by giving only that element `pointer-events-auto`

This keeps the banner visible as a HUD element but prevents it from blocking map interaction.

### Before
```
absolute top-2 ... z-20 px-6 py-2 ... bg-blue-600/80
```

### After
```
absolute top-2 ... z-20 px-4 py-1 pointer-events-none ... bg-blue-600/50
// tooltip trigger gets pointer-events-auto so hover still works
```

