# Rackets: Extort → Buy Out → Build

## The confusion

A block with a pre-placed anchor racket was showing the full build list right next to the extort
result, so it read as "I shook them down, and now I have to build the same business anyway."

## The intended chain (one block, three steps)

```text
1. EXTORT   shake the racket down  -> it starts paying you monthly tribute
2. BUY OUT  pay the lump sum       -> the place becomes yours as a Tier 1 building
3. BUILD    develop it T1 -> T3    -> normal development, crew growth, standing orders
```

- Step 1 is the money step: tribute flows every month while you hold and garrison the block.
- Step 2 is ownership: tribute stops, the racket converts into a Tier 1 building of its type.
- Step 3 is the existing development track — only available once the racket is bought out.

## What changes

- Building is blocked on any block that still has a standing anchor racket. Attempting it explains
  why: the racket has to be shaken down and bought out first.
- The block panel and the City Panel both show the three steps in order, with the current step
  highlighted, the tribute amount, and the buy-out price.
- Blocks with no anchor are unaffected: bare ground goes straight to building.

## Technical notes

- `startBuild` in `useEnhancedMafiaGameState.ts` rejects when `tile.anchor` is present, with a
  distinct message for extorted vs not-yet-extorted rackets.
- `CityPanel.tsx` and `TileDevelopmentPanel.tsx` disable the building buttons while `tile.anchor`
  exists and render the ordered step list in the Anchor Racket section.
- `buyOutAnchor` already clears the anchor and sets the matching building to Tier 1, so the
  development track opens up automatically after step 2.

## Scope guards

- Tribute values, buy-out costs, combat, heat, diplomacy and AI behaviour unchanged.
