

# Hide Unit Icons on HQ Hex

## Problem
Unit icons rendered on the HQ hex take up space and block clicking. The deployment menu already shows available units, so displaying them on the hex is redundant and makes toggling the HQ panel difficult.

## Solution
**File**: `src/components/EnhancedMafiaHexGrid.tsx` (~line 527-583)

Skip rendering Capo and Soldier icons when the tile is a headquarters (`isAtHQ === true`). The deployment picker and HeadquartersInfoPanel already provide unit selection, so the on-hex icons are unnecessary for HQ tiles.

Change: wrap the unit rendering block (capos + soldiers forEach loops, lines ~532-583) in a condition `if (!isAtHQ)` so units are never drawn on any HQ hex. The HQ building icon remains visible.

## Files Modified
- `src/components/EnhancedMafiaHexGrid.tsx` — skip unit icon rendering on HQ tiles

