## Goal
Replace the capo unit sprite with a new figure based on the uploaded reference (mature mafioso in fedora, long pinstripe coat, three-piece suit, cigar) and ensure it renders visibly larger than the soldier on the hex map.

## Changes

### 1. Generate the new capo asset
- Use `user-uploads://Capo-style_image_1.png` as the model.
- Full-body, front-facing, painterly noir illustration matching the existing soldier figure's art treatment (so they read as one unit set).
- Distinguishing features vs. soldier: fedora (not flat cap), fur-collared overcoat over pinstripe three-piece suit, cigar in hand, pocket-watch chain, more imposing build — clearly a higher-rank "made man".
- Transparent PNG with strong dark silhouette so the family-color glow halo behind it stays visible.
- Save as `src/assets/capo-figure.png`, replacing the existing file.

### 2. Make the capo render bigger than the soldier
In `src/components/CapoIcon.tsx`:
- Current `size = 26`. Soldier is `size = 14`. Already larger, but the capo will visually feel only slightly bigger because both use a similar height multiplier.
- Bump `size` from `26` → `32` so the capo is roughly 2.3x the soldier's footprint and clearly reads as a senior unit.
- Keep height multiplier (`size * 1.4`), selection ring math, level badge, and wounded badge offsets — they all derive from `size`, so they scale automatically. Spot-check that the level badge (currently `cx={x + 14}, cy={y - 14}`) and wounded badge still sit on the figure's shoulders after the size bump; nudge offsets if they look detached.

### 3. No other code changes
- `SoldierIcon.tsx`, hex grid, stacking rules, and game logic are untouched.
- No new badges, animations, or capo variants.

### 4. QA
- Visually inspect generated PNG at full size and at the rendered map size (~32px wide).
- Load the game preview, confirm:
  - Capo silhouette is clearly bigger than a soldier on the same hex
  - Family-color glow + gold player ring still show through
  - Level/wounded badges still anchor to the figure cleanly
- Regenerate or tweak badge offsets if anything looks off.

## Out of scope
- Soldier art, boss art, HQ art.
- Capo personality-specific sprites (Diplomat / Enforcer / Schemer all share one figure).
- Changes to capo gameplay (movement, abilities, wound mechanics).
