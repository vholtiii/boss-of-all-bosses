

# Refine Victory Conditions — Make Them Harder to Attain

## Current State & Problems

The map has ~331 hexes (radius 10). Current thresholds:

| Condition | Target | Problem |
|---|---|---|
| Territory | 25 hexes (7.5% of map) | Far too low — you can claim neutrals risk-free |
| Economic | $25,000/month income | Achievable with ~10 business hexes with capos |
| Legacy | Beat highest rival rep after turn 5 | Turn 5 is trivially early; rival rep calculation is weak (soldiers*2 + influence*2 + money/1000) |

Additional bugs:
- Victory notification text is stale — says "6+ territories" and "$8,000" instead of matching actual targets
- Legacy rival score uses a simplistic formula that doesn't scale well with AI progression

## Proposed Changes

### 1. Raise Territory Target: 25 → 60
60 hexes = ~18% of the map. Requires sustained expansion across multiple districts, not just grabbing nearby neutrals. With 5 families competing, controlling 60 hexes demands real strategy.

### 2. Raise Economic Target: $25,000 → $50,000/month
Forces players to capture high-value business hexes, deploy capos for full income, and manage expenses. Can't be reached passively.

### 3. Strengthen Legacy Condition
- Raise minimum turn from 5 → 15 (must survive at least 15 months)
- Require player rep to exceed highest rival by **at least 25%** (not just beat them by 1 point)
- Improve rival rep calculation to use a more comparable formula: territory count * 3 + soldiers * 2 + money/500

### 4. Fix Notification Text
Update the victory notification strings to match the actual targets.

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — update targets, rival rep formula, turn threshold, notification text

