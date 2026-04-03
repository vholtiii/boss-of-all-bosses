

# Fix #10: Territory Freeze — Block Player Attacks During Ceasefire

## Problem

The approved ceasefire enforcement plan says hits against ceasefire families should be **blocked entirely**, but the current code allows the hit and just applies violation penalties. This means a player can hit a ceasefire family's hex (turning it neutral), then claim it — bypassing the territory freeze.

## Fix

Two changes, both in `src/hooks/useEnhancedMafiaGameState.ts`:

### 1. Block hits against ceasefire families (line ~5182)

Instead of allowing the hit and applying penalties, **return early** with a notification: "Ceasefire active — you cannot attack this family's territory." Remove the violation penalty code from hits (violations should only trigger from extortion attempts or other edge cases, not direct hits — since hits are now blocked).

### 2. Block claims on hexes adjacent to ceasefire family territory (line ~4942)

Add a secondary check in `processClaimTerritory`: if the neutral hex is **surrounded by** (or adjacent to) hexes controlled by a ceasefire family, block the claim. This catches edge cases where a hex became neutral through other means (e.g., AI-on-AI combat) but is still in a ceasefire family's sphere.

Logic: check if any of the 6 neighbors of the target hex belong to an active ceasefire family. If so, block with notification "Territory freeze — cannot claim near ceasefire family territory."

## Files Modified

- `src/hooks/useEnhancedMafiaGameState.ts` — two targeted edits (~10 lines each)

