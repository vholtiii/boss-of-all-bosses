

# Clarify Captain vs Chief Intel Scope for Rival Unit Visibility

You're right — Captain is **target-scoped** (only the bribed family's intel), Chief is **map-wide** (all rivals). The visibility rule needs to respect that, not treat Captain as a global reveal.

## Updated Visibility Rules for Rival Units

A rival unit is visible ONLY if at least one of these is true:

1. **Fresh scout intel** on that hex (soldier 1-hex, capo 2-hex)
2. **Flipped soldier (rat)** in that rival's family
3. **Active Police Captain bribe targeting that specific rival family** → reveals only that family's units
4. **Active Police Chief or Mayor bribe** → reveals ALL rival families' units (map-wide)
5. **Active supply deal / alliance pact** with that rival
6. **Rival unit standing on YOUR claimed territory**
7. **Rival HQ hex**
8. **Capo vision** (capo's own 2-hex sight radius)

**Removed**: Plain soldier adjacency reveal.

## Files Touched

1. **`src/hooks/useEnhancedMafiaGameState.ts`** — visibility predicate:
   - Drop the soldier-adjacency branch.
   - Corruption check splits into two branches:
     - `activeBribes.some(b => b.active && b.tier === 'police_captain' && b.targetFamily === rivalUnit.family)` → visible
     - `activeBribes.some(b => b.active && (b.tier === 'police_chief' || b.tier === 'mayor'))` → visible (any rival)
   - Keep all other branches (scout intel, rats, pacts, on-your-turf, HQ, capo vision).

2. **`src/components/EnhancedMafiaHexGrid.tsx`** — map legend tooltip lists: scout intel, rat, Captain bribe (target only), Chief/Mayor bribe (all rivals), pact, on your turf, capo vision, rival HQ.

3. **`src/components/GameGuide.tsx`** — Scout/Intel section: "Soldiers can't see rival units by proximity. Reveal via scout, rat, Captain bribe (one family), Chief/Mayor bribe (all families), or pact."

4. **`src/components/CorruptionPanel.tsx`** — tier descriptions clarify: Captain reveals **target family** units & fortifications; Chief reveals **all rival** units & fortifications map-wide.

5. **Memory updates**
   - `mem://gameplay/scout-system` — adjacency removed; Captain (target) and Chief/Mayor (all) corruption reveal rival units.
   - `mem://gameplay/fog-of-war` — same.
   - `mem://gameplay/intel-bribes` — note Captain unlocks unit visibility for the targeted family only; Chief/Mayor extend it map-wide.

## Verification

- Soldier adjacent to rival hex → rivals NOT visible.
- Patrol Officer bribe → no unit reveal (heat tier only).
- Captain bribe targeting Gambino → Gambino units visible; Genovese/Lucchese/etc still hidden.
- Chief or Mayor bribe → all rival units visible map-wide.
- Scout / rat / capo vision / on-your-turf / HQ / pact reveals unchanged.

## What Doesn't Change

- Capo vision, scout mechanics, intel decay, pact reveals, on-your-turf reveal, HQ visibility, Patrol Officer (heat-only), combat, AI behavior, bribe costs/durations/success rates.

