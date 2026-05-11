## Goal
Increase the soldier sprite size on the hex map so the new figure is readable, while keeping it visibly smaller than the capo.

## Change
In `src/components/SoldierIcon.tsx`:
- Bump `size` from `14` → `20`.
- Capo stays at `32`, so the soldier reads as ~62% of capo size — clearly subordinate but no longer tiny.
- All derived measurements (height `size * 1.5`, glow circle, selection ring, count badge offsets) scale automatically from `size`. Spot-check that the count badge (`cx={x + 12}, cy={y - 12}`) and marked-for-death badge still anchor cleanly; nudge offsets slightly only if they look detached.

## Out of scope
- Capo, boss, HQ sizing.
- Hex stacking layout, badge styling, art regeneration.
