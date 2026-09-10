# Free movement inside your own turf

Moving around territory linked to your headquarters is supposed to be free. Today several separate rules quietly block it. This fixes all of them so the rule holds everywhere.

## What is blocking it now

1. **Capos never get free movement.** A capo's reachable blocks are capped by its remaining move points and its fly range. Once those run out — or once it lands anywhere — it cannot slide across your own turf at all.
2. **A unit out of move points at your HQ can't be picked up.** Clicking your headquarters only selects a unit that still has move points, so a freshly placed or spent soldier sitting at HQ can't be walked into your territory even though that move costs nothing.
3. **Pressure near rivals zeroes a soldier's move points** (later phases, next to rival ground). Costs are fine after that, but combined with the two points above the unit feels frozen.
4. **Blocks you just claimed this turn** are still pending, so they aren't part of your linked turf yet and don't light up as free destinations.

## What changes

- **Free movement covers your whole HQ-linked turf, for soldiers and capos alike.** Any block in the unbroken chain back to your headquarters is a free destination: no move points, no action.
- **Capos keep their fly range on top.** Outside your turf they still fly up to their range using move points and an action, exactly as now.
- **Running out of move points never locks you inside your own turf.** Units with zero move points can still reposition freely on linked blocks; they just can't venture out.
- **Selecting a unit at your headquarters always works**, whatever its move points, so it can be walked out into your territory.
- **Rival pressure keeps its bite where it matters:** it still stops a soldier's outward advance, but never prevents free repositioning inside your own linked turf.
- Cost wording stays honest: destinations inside your turf read as free, everything else keeps its "1 action" label.

## Technical notes

All changes in `src/hooks/useEnhancedMafiaGameState.ts`:

- `selectUnit`, capo branch: union the fly-range candidates with every hex in `getConnectedTerritory(prev.hexMap, prev.playerFamily)` when the capo stands on connected turf; drop the `Math.min(range, movesRemaining)` clamp for the connected set only (fly range still clamps for outside moves).
- `selectUnit`, soldier branch: already lists the connected set — keep, but ensure it is offered regardless of `movesRemaining`.
- `moveUnit`: the existing `isFreeMove` check (origin and target both in the connected set) is extended to capos; `if (unit.movesRemaining < moveCost) return prev;` already passes with `moveCost === 0`, so no change needed there. The Zone-of-Control zeroing stays but is skipped when `isFreeMove` is true.
- `EnhancedMafiaHexGrid.tsx` line ~557: drop the `u.movesRemaining > 0` condition on HQ-hex unit selection (keep the deploy-mode guard).
- Test in `src/hooks/__tests__/`: a soldier and a capo, each with `movesRemaining: 0`, standing on connected turf, move to a distant connected block with no change to `actionsRemaining`; a move to an unconnected owned block still spends 1 action.
