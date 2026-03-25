

# Add Visual Indicator for Player-Built Business Hexes

## Problem
Player-built businesses (not extorted) have gameplay advantages (100% income without units, lower heat) but look identical to extorted businesses on the hex map. Players need a subtle visual cue to distinguish them.

## Approach
Currently, player-territory hexes with legal businesses already get a blue outline (`#3B82F6`). We'll add a distinct indicator for **player-built** businesses (where `isExtorted === false` and hex is player-controlled):

- **Inner glow/ring**: A subtle inner polygon or dashed outline in a warm green/teal tone (e.g., `#10B981` — emerald) to indicate "player-built", distinct from the existing blue legal-business stroke
- **Small 🏗️ icon badge**: A small badge in the corner of the hex (similar to the existing 👁️ scout badge) for built businesses

This keeps the existing blue outline for legal businesses while adding an additional layer for the "built" distinction.

## Technical Changes

### `src/components/EnhancedMafiaHexGrid.tsx`

**Line 655-656 (stroke logic)**: Add a check for player-built businesses. If `tile.business && !tile.business.isExtorted && isPlayerTerritory`, use a green-tinted stroke (`#10B981`) instead of the blue legal stroke, with a slightly different stroke style (e.g., dashed or thicker).

**After line 662**: Add a small inner polygon or badge icon for player-built hexes — a slightly smaller hex polygon with a semi-transparent emerald fill (`#10B98120`) to create a subtle inner glow effect, plus a small "🏗️" badge in the bottom-left corner.

## Result
- Player-built hexes get an emerald green outline + subtle inner tint + 🏗️ badge
- Extorted hexes keep existing styling (blue for legal, gold for player territory)
- Quick at-a-glance differentiation on the map

