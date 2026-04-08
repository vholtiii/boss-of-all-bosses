

# Option B: Hex-Chain Tint Overlay for Supply Routes

## What Changes

Replace the current invisible thin line (`strokeWidth="2"`, `strokeOpacity="0.2"`) with a **colored hex fill overlay** on every hex along the BFS path from HQ to each connected supply node. Each hex in the chain gets a faint family-color fill (~8% opacity), creating a visible "corridor." Connected nodes get a green ✅ badge; disconnected nodes get a red ⚠️ badge.

## Visual Design

- **Connected route**: Each hex in the BFS path gets an additional polygon fill in the player's family color at 8% opacity — subtle but visible as a tinted corridor
- **Connected node badge**: Small green circle with ✅ next to the supply node icon
- **Disconnected node badge**: Small red pulsing circle with ⚠️ next to the supply node icon
- **Neutral/unclaimed node**: Keep existing gold dashed border, no status badge

## Technical Details

### `src/components/EnhancedMafiaHexGrid.tsx`

**Replace the route line renderer** (lines 1066-1105):
- Keep the existing BFS logic that builds `par` (parent map) and `vis` (visited set)
- Instead of drawing `<path>` lines, collect all hex keys along each route path into a `Set<string>`
- In the hex rendering loop, check if a hex key is in the supply-route set — if so, render an additional `<polygon>` fill with the family color at 8% opacity behind the hex content
- Add a status badge (`✅` or `⚠️`) next to existing supply node icons based on whether the node key is in the `vis` set (connected) or not

**Changes to the hex tile render block** (around line 902-921):
- After the existing supply node golden border/icon, add a conditional status badge:
  - If node is connected to player HQ → green circle + ✅
  - If node is owned by player but disconnected → red pulsing circle + ⚠️

## Files Modified
- `src/components/EnhancedMafiaHexGrid.tsx` — replace route lines with hex tint overlays + add node status badges

